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
public class ChatMessageResponse {
    private UUID id;
    private String role;

    
    private String content;

    
    private List<String> mainAnswer;
    private String conclusion;
    private String overallRisk;
    private Double winProbability;

    private LocalDateTime createdAt;
}
