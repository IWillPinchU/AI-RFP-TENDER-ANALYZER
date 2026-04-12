package com.dce.rfp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CompareRequest {

    @NotNull(message = "Document A is required")
    private UUID documentIdA;

    @NotNull(message = "Document B is required")
    private UUID documentIdB;

    @NotBlank(message = "Comparison aspect is required")
    private String query;  // e.g. "Eligibility Criteria" or custom text
}
