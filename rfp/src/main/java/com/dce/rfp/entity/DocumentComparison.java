package com.dce.rfp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_comparisons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentComparison {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Two documents being compared — each stored as a separate FK
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_a_id", nullable = false)
    private Document documentA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_b_id", nullable = false)
    private Document documentB;

    // The aspect/query the comparison was run on (e.g. "Eligibility Criteria")
    @Column(nullable = false)
    private String query;

    // Full AI comparison result stored as a JSON string
    @Column(columnDefinition = "TEXT", nullable = false)
    private String resultJson;

    // ML-computed risk levels stored as columns to avoid parsing full resultJson for list views
    private String documentARisk;
    private String documentBRisk;

    // ML-computed win probabilities (0.0 - 1.0) from win_model across comparison chunks
    private Double documentAWinProbability;
    private Double documentBWinProbability;

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
