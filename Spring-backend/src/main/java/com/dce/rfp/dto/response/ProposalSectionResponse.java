package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalSectionResponse {
    private UUID id;
    private String sectionTitle;
    private List<String> points;   // deserialized from JSON
    private Integer orderIndex;
}
