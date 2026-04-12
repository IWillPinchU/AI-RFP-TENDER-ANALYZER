package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TwoFactorSetupResponse {

    private String secret;
    private String qrCodeImage;  // base64 encoded PNG
}
