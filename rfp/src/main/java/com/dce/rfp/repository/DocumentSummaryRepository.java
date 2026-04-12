package com.dce.rfp.repository;

import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.DocumentSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DocumentSummaryRepository extends JpaRepository<DocumentSummary, UUID> {
    // Find cached summary for a specific document
    Optional<DocumentSummary> findByDocument(Document document);
}
