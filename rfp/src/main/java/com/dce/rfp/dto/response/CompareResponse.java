package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareResponse {

    private UUID id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Document names for display
    private UUID documentIdA;
    private UUID documentIdB;
    private String documentNameA;
    private String documentNameB;

    // The aspect/query this comparison covers
    private String query;

    // Structural comparison data — maps directly to the frontend layout
    private List<String> similarities;
    private List<ComparisonDifferenceItem> differences;  // feeds the 3-column table
    private String documentAAdvantage;
    private String documentBAdvantage;
    private String documentARisk;
    private String documentBRisk;
    private Double documentAWinProbability;
    private Double documentBWinProbability;
    private String riskExplanation;
    private String recommendation;
}
