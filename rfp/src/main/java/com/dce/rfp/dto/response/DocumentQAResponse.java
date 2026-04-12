package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response returned when fetching or generating Q&amp;A questions for a document.
 * The {@code cached} flag tells the frontend whether questions were freshly
 * generated or returned from the DB cache.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentQAResponse {

    private UUID documentId;
    private String documentName;

    /** The list of generated question strings. */
    private List<String> questions;

    /** True if questions were served from the DB cache; false if freshly generated. */
    private boolean cached;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
