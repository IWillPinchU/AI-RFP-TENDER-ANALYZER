package com.dce.rfp.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private final String tokenType = "Bearer";
    private boolean requiresTwoFactor;
    private String tempToken;  
    private UserResponse user;
}
