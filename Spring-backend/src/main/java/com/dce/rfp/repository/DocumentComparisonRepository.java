package com.dce.rfp.repository;

import com.dce.rfp.entity.DocumentComparison;
import com.dce.rfp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.dce.rfp.entity.Document;

public interface DocumentComparisonRepository extends JpaRepository<DocumentComparison, UUID> {

    
    List<DocumentComparison> findByUserOrderByCreatedAtDesc(User user);

    
    Optional<DocumentComparison> findByIdAndUser(UUID id, User user);

    
    List<DocumentComparison> findByDocumentAOrDocumentB(Document documentA, Document documentB);

}
