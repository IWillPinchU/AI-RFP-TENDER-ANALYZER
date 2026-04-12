package com.dce.rfp.repository;

import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.DocumentQA;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DocumentQARepository extends JpaRepository<DocumentQA, UUID> {

    /**
     * Finds the cached Q&amp;A record for a given document.
     * Returns empty if questions have not been generated yet.
     */
    Optional<DocumentQA> findByDocument(Document document);

    /**
     * Checks whether questions have already been generated for this document.
     */
    boolean existsByDocument(Document document);
}
