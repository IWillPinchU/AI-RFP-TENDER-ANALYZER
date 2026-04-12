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

    // For USER messages — plain text question
    private String content;

    // For ASSISTANT messages — structured AI response
    private List<String> mainAnswer;
    private String conclusion;
    private String overallRisk;
    private Double winProbability;

    private LocalDateTime createdAt;
}
