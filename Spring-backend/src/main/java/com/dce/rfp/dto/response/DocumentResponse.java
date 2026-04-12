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
public class DocumentResponse {
    private UUID id;
    private String originalFilename;
    private Long fileSize;
    private String fileType;
    private String aiStatus;
    private Integer chunksIndexed;
    private LocalDateTime uploadedAt;
    private UUID chatSessionId;
}
