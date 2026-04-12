package com.dce.rfp.repository;

import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.Proposal;
import com.dce.rfp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProposalRepository extends JpaRepository<Proposal, UUID> {
    List<Proposal> findByDocumentAndUserOrderByCreatedAtDesc(Document document, User user);
    Optional<Proposal> findByIdAndUser(UUID id, User user);
    List<Proposal> findByUserOrderByCreatedAtDesc(User user);
}
