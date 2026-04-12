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

    // ════════════════════════════════════════════════════════
    // REGISTER
    // ════════════════════════════════════════════════════════
    @Transactional
    public String register(RegisterRequest request) {
        // 1. Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email is already registered");
        }

        // 2. Get the USER role (create if not exists)
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_USER)));

        // 3. Create user (enabled = false until email verification)
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(AuthProvider.LOCAL)
                .roles(Set.of(userRole))
                .build();

        userRepository.save(user);

        // 4. Generate verification token and send email
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(Instant.now().plusSeconds(86400)) // 24 hours
                .build();
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user, token);

        return "Registration successful! Please check your email to verify your account.";
    }

    // ════════════════════════════════════════════════════════
    // VERIFY EMAIL
    // ════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════
    // LOGIN
    // ════════════════════════════════════════════════════════
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Authenticate credentials (Spring Security handles password check + enabled check)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        // 2. If 2FA is enabled, return temp token instead of real tokens
        if (user.isTwoFactorEnabled()) {
            String tempToken = jwtService.generateTempToken(userDetails);
            return AuthResponse.builder()
                    .requiresTwoFactor(true)
                    .tempToken(tempToken)
                    .build();
        }

        // 3. No 2FA — issue real tokens
        return generateAuthResponse(userDetails, user);
    }

    // ════════════════════════════════════════════════════════
    // VERIFY 2FA (Step 2 of login)
    // ════════════════════════════════════════════════════════
    @Transactional
    public AuthResponse verify2fa(TwoFactorVerifyRequest request) {
        // 1. Validate the temp token
        if (!jwtService.isTempTokenValid(request.getTempToken())) {
            throw new TwoFactorAuthenticationException("Invalid or expired temporary token. Please login again.");
        }

        // 2. Extract email from temp token
        String email = jwtService.extractUsername(request.getTempToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // 3. Verify the TOTP code
        if (!totpService.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            throw new TwoFactorAuthenticationException("Invalid 2FA code");
        }

        // 4. Issue real tokens
        CustomUserDetails userDetails = new CustomUserDetails(user);
        return generateAuthResponse(userDetails, user);
    }

    // ════════════════════════════════════════════════════════
    // REFRESH TOKEN
    // ════════════════════════════════════════════════════════
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        // 1. Verify the refresh token
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());

        // 2. Delete old token (rotation)
        refreshTokenService.deleteToken(refreshToken);

        // 3. Issue new access + refresh tokens
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

    // ════════════════════════════════════════════════════════
    // LOGOUT
    // ════════════════════════════════════════════════════════
    @Transactional
    public String logout(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
        refreshTokenService.deleteToken(refreshToken);
        return "Logged out successfully";
    }

    // ════════════════════════════════════════════════════════
    // FORGOT PASSWORD
    // ════════════════════════════════════════════════════════
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("No account found with this email"));

        // Delete any existing reset token for this user
        passwordResetTokenRepository.deleteByUser(user);

        // Create new reset token (30 min expiry)
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(Instant.now().plusSeconds(1800)) // 30 minutes
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user, token);

        return "Password reset email sent. Check your inbox.";
    }

    // ════════════════════════════════════════════════════════
    // RESET PASSWORD (using token from email)
    // ════════════════════════════════════════════════════════
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

        // Invalidate all refresh tokens (force re-login everywhere)
        refreshTokenService.deleteByUser(user);

        return "Password has been reset successfully. Please login with your new password.";
    }

    // ════════════════════════════════════════════════════════
    // UPDATE PASSWORD (logged-in user)
    // ════════════════════════════════════════════════════════
    public String updatePassword(UpdatePasswordRequest request, User user) {
        // OAuth users may not have a password set — allow them to set one
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

        // Invalidate all refresh tokens
        refreshTokenService.deleteByUser(user);

        return "Password updated successfully. Please login again.";
    }

    // ════════════════════════════════════════════════════════
    // HELPER: Generate full auth response with tokens
    // ════════════════════════════════════════════════════════
    private AuthResponse generateAuthResponse(CustomUserDetails userDetails, User user) {
        String accessToken = jwtService.generateAccessToken(userDetails);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .user(mapToUserResponse(user))
                .build();
    }

    // ════════════════════════════════════════════════════════
    // HELPER: Map User entity to UserResponse DTO
    // ════════════════════════════════════════════════════════
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
