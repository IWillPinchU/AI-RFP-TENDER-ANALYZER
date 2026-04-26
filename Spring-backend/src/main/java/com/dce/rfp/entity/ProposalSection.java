package com.dce.rfp.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "proposal_sections")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalSection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private Proposal proposal;

    @Column(nullable = false)
    private String sectionTitle;

    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String points;

    private Integer orderIndex;
}
