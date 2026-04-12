package com.dce.rfp.repository;

import com.dce.rfp.entity.Proposal;
import com.dce.rfp.entity.ProposalSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProposalSectionRepository extends JpaRepository<ProposalSection, UUID> {
    List<ProposalSection> findByProposalOrderByOrderIndex(Proposal proposal);
}
