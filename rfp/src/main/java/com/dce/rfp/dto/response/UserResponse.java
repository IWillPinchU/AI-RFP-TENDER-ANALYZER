package com.dce.rfp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private boolean twoFactorEnabled;
    private String provider;
    private boolean hasPassword;
    private Set<String> roles;
}

