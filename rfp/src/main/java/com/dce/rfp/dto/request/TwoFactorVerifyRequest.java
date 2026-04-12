package com.dce.rfp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFactorVerifyRequest {

    @NotBlank(message = "Temporary token is required")
    private String tempToken;

    @NotBlank(message = "2FA code is required")
    private String code;
}
