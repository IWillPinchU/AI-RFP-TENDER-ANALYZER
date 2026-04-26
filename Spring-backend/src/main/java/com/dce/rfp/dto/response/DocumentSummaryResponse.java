package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSummaryResponse {

    private UUID documentId;
    private String documentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean cached;  

    
    private String overview;
    private String tenderPurpose;
    private List<String> scopeOfWork;
    private List<String> criticalDeadlines;
    private List<String> eligibilityHighlights;
    private String estimatedRisk;
    private Double winProbability;
    private String overallRecommendation;

    
    
    
    private Map<String, Map<String, Object>> categories;
}
