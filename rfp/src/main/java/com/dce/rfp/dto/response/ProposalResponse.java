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
public class ProposalResponse {
    private UUID id;
    private String title;
    private UUID documentId;
    private String documentName;
    private LocalDateTime createdAt;
    private List<ProposalSectionResponse> sections;  // null when listing, populated when fetching single
}
