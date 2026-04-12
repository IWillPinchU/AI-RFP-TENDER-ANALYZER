package com.dce.rfp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatQueryRequest {
    @NotBlank(message = "Query cannot be empty")
    private String query;
}
