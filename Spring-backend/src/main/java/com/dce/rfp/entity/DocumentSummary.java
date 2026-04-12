package com.dce.rfp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_summaries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // One summary per document
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private Document document;

    // Executive overview JSON — { overview, tender_purpose, scope_of_work[], critical_deadlines[], etc. }
    @Column(columnDefinition = "TEXT", nullable = false)
    private String overviewJson;

    // Category summaries JSON — { Financial: {...}, Legal: {...}, ... }
    @Column(columnDefinition = "TEXT", nullable = false)
    private String categoriesJson;

    // Estimated risk extracted from the overview
    private String estimatedRisk;

    // ML-computed win probability (0.0 - 1.0) averaged over top 10 chunks
    private Double winProbability;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
