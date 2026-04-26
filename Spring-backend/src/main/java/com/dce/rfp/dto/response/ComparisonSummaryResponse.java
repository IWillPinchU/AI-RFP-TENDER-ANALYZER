package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComparisonSummaryResponse {
    private UUID id;
    private String documentNameA;
    private String documentNameB;
    private String query;
    private String documentARisk;
    private String documentBRisk;
    private LocalDateTime createdAt;
}
