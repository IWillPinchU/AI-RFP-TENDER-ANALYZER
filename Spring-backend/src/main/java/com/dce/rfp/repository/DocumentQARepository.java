package com.dce.rfp.repository;

import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.DocumentQA;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DocumentQARepository extends JpaRepository<DocumentQA, UUID> {

    
    Optional<DocumentQA> findByDocument(Document document);

    
    boolean existsByDocument(Document document);
}
