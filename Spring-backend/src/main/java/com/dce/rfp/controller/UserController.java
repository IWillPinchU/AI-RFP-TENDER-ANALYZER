package com.dce.rfp.controller;

import com.dce.rfp.dto.request.UpdatePasswordRequest;
import com.dce.rfp.dto.response.ApiResponse;
import com.dce.rfp.dto.response.TwoFactorSetupResponse;
import com.dce.rfp.dto.response.UserResponse;
import com.dce.rfp.entity.User;
import com.dce.rfp.exception.TwoFactorAuthenticationException;
import com.dce.rfp.repository.UserRepository;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.AuthService;
import com.dce.rfp.service.TotpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final TotpService totpService;
    private final UserRepository userRepository;

    
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse response = authService.mapToUserResponse(userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    
    @PutMapping("/update-password")
    public ResponseEntity<ApiResponse> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String message = authService.updatePassword(request, userDetails.getUser());
        return ResponseEntity.ok(new ApiResponse(true, message));
    }

    
    @PostMapping("/enable-2fa")
    public ResponseEntity<TwoFactorSetupResponse> enable2fa(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userDetails.getUser();

        if (user.isTwoFactorEnabled()) {
            throw new TwoFactorAuthenticationException("2FA is already enabled");
        }

        
        String secret = totpService.generateSecret();
        String qrCode = totpService.generateQrCodeImage(secret, user.getEmail());

        
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        return ResponseEntity.ok(new TwoFactorSetupResponse(secret, qrCode));
    }

    
    @PostMapping("/verify-2fa-setup")
    public ResponseEntity<ApiResponse> verify2faSetup(
            @RequestParam String code,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userDetails.getUser();

        if (user.getTwoFactorSecret() == null) {
            throw new TwoFactorAuthenticationException("Please call /enable-2fa first");
        }

        if (!totpService.verifyCode(user.getTwoFactorSecret(), code)) {
            throw new TwoFactorAuthenticationException("Invalid code. Please try again.");
        }

        
        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "2FA enabled successfully!"));
    }

    
    @PostMapping("/disable-2fa")
    public ResponseEntity<ApiResponse> disable2fa(
            @RequestParam String code,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userDetails.getUser();

        if (!user.isTwoFactorEnabled()) {
            throw new TwoFactorAuthenticationException("2FA is not enabled");
        }

        
        if (!totpService.verifyCode(user.getTwoFactorSecret(), code)) {
            throw new TwoFactorAuthenticationException("Invalid code");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "2FA disabled successfully"));
    }
}
