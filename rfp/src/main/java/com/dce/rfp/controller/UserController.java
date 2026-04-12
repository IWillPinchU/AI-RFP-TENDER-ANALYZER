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

    // ── Get current user profile ──
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserResponse response = authService.mapToUserResponse(userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    // ── Update password ──
    @PutMapping("/update-password")
    public ResponseEntity<ApiResponse> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String message = authService.updatePassword(request, userDetails.getUser());
        return ResponseEntity.ok(new ApiResponse(true, message));
    }

    // ── Enable 2FA: Step 1 — generate secret + QR code ──
    @PostMapping("/enable-2fa")
    public ResponseEntity<TwoFactorSetupResponse> enable2fa(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userDetails.getUser();

        if (user.isTwoFactorEnabled()) {
            throw new TwoFactorAuthenticationException("2FA is already enabled");
        }

        // Generate secret and QR code
        String secret = totpService.generateSecret();
        String qrCode = totpService.generateQrCodeImage(secret, user.getEmail());

        // Save secret temporarily (not enabled yet until verified)
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        return ResponseEntity.ok(new TwoFactorSetupResponse(secret, qrCode));
    }

    // ── Enable 2FA: Step 2 — verify code to confirm setup ──
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

        // Code is valid — enable 2FA
        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "2FA enabled successfully!"));
    }

    // ── Disable 2FA ──
    @PostMapping("/disable-2fa")
    public ResponseEntity<ApiResponse> disable2fa(
            @RequestParam String code,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userDetails.getUser();

        if (!user.isTwoFactorEnabled()) {
            throw new TwoFactorAuthenticationException("2FA is not enabled");
        }

        // Verify code before disabling (security measure)
        if (!totpService.verifyCode(user.getTwoFactorSecret(), code)) {
            throw new TwoFactorAuthenticationException("Invalid code");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse(true, "2FA disabled successfully"));
    }
}
