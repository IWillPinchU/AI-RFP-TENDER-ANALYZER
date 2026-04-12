package com.dce.rfp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Caches the generated Q&amp;A questions for a document.
 * One record per document — questions are generated on first request and reused thereafter.
 * The questionsJson column stores a JSON array of question strings.
 */
@Entity
@Table(name = "document_qa")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentQA {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * One Q&amp;A set per document — enforced by unique constraint on document_id.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private Document document;

    /**
     * JSON array of question strings: ["Q1?", "Q2?", ...].
     * Stored as TEXT to handle any number of questions without truncation.
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionsJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
