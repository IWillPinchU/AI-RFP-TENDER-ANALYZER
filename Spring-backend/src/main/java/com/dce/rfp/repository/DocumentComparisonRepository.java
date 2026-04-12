package com.dce.rfp.repository;

import com.dce.rfp.entity.DocumentComparison;
import com.dce.rfp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.dce.rfp.entity.Document;

public interface DocumentComparisonRepository extends JpaRepository<DocumentComparison, UUID> {

    // All comparisons for a user — shown in "Past Comparisons" list
    List<DocumentComparison> findByUserOrderByCreatedAtDesc(User user);

    // Lookup a specific comparison (to verify ownership)
    Optional<DocumentComparison> findByIdAndUser(UUID id, User user);

    // Find all comparisons where this document is either Doc A or Doc B
    List<DocumentComparison> findByDocumentAOrDocumentB(Document documentA, Document documentB);

}
