package com.dce.rfp.service;

import com.dce.rfp.dto.request.*;
import com.dce.rfp.dto.response.AuthResponse;
import com.dce.rfp.dto.response.UserResponse;
import com.dce.rfp.entity.*;
import com.dce.rfp.entity.enums.AuthProvider;
import com.dce.rfp.entity.enums.RoleName;
import com.dce.rfp.exception.*;
import com.dce.rfp.repository.*;
import com.dce.rfp.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final TotpService totpService;

    
    
    
    @Transactional
    public String register(RegisterRequest request) {
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email is already registered");
        }

        
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_USER)));

        
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(AuthProvider.LOCAL)
                .roles(Set.of(userRole))
                .build();

        userRepository.save(user);

        
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(Instant.now().plusSeconds(86400)) 
                .build();
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user, token);

        return "Registration successful! Please check your email to verify your account.";
    }

    
    
    
    @Transactional
    public String verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new TokenInvalidException("Invalid verification token"));

        if (verificationToken.getExpiryDate().isBefore(Instant.now())) {
            verificationTokenRepository.delete(verificationToken);
            throw new TokenExpiredException("Verification token has expired. Please register again.");
        }

        User user = verificationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        verificationTokenRepository.delete(verificationToken);

        return "Email verified successfully! You can now login.";
    }

    
    
    
    @Transactional
    public AuthResponse login(LoginRequest request) {
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        
        if (user.isTwoFactorEnabled()) {
            String tempToken = jwtService.generateTempToken(userDetails);
            return AuthResponse.builder()
                    .requiresTwoFactor(true)
                    .tempToken(tempToken)
                    .build();
        }

        
        return generateAuthResponse(userDetails, user);
    }

    
    
    
    @Transactional
    public AuthResponse verify2fa(TwoFactorVerifyRequest request) {
        
        if (!jwtService.isTempTokenValid(request.getTempToken())) {
            throw new TwoFactorAuthenticationException("Invalid or expired temporary token. Please login again.");
        }

        
        String email = jwtService.extractUsername(request.getTempToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        
        if (!totpService.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            throw new TwoFactorAuthenticationException("Invalid 2FA code");
        }

        
        CustomUserDetails userDetails = new CustomUserDetails(user);
        return generateAuthResponse(userDetails, user);
    }

    
    
    
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());

        
        refreshTokenService.deleteToken(refreshToken);

        
        User user = refreshToken.getUser();
        CustomUserDetails userDetails = new CustomUserDetails(user);

        String newAccessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .user(mapToUserResponse(user))
                .build();
    }

    
    
    
    @Transactional
    public String logout(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
        refreshTokenService.deleteToken(refreshToken);
        return "Logged out successfully";
    }

    
    
    
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found with this email"));

        
        passwordResetTokenRepository.deleteByUser(user);

        
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(Instant.now().plusSeconds(1800)) 
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user, token);

        return "Password reset email sent. Check your inbox.";
    }

    
    
    
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new TokenInvalidException("Invalid password reset token"));

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new TokenExpiredException("Password reset token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);

        
        refreshTokenService.deleteByUser(user);

        return "Password has been reset successfully. Please login with your new password.";
    }

    
    
    
    public String updatePassword(UpdatePasswordRequest request, User user) {
        
        if (user.getPassword() != null) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new TwoFactorAuthenticationException("Current password is required");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new TwoFactorAuthenticationException("Current password is incorrect");
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        
        refreshTokenService.deleteByUser(user);

        return "Password updated successfully. Please login again.";
    }

    
    
    
    private AuthResponse generateAuthResponse(CustomUserDetails userDetails, User user) {
        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(mapToUserResponse(user))
                .build();
    }

    
    
    
    public UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .twoFactorEnabled(user.isTwoFactorEnabled())
                .provider(user.getProvider().name())
                .hasPassword(user.getPassword() != null)
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .build();
    }
}
