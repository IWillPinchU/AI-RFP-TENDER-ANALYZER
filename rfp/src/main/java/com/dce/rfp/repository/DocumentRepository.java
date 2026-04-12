package com.dce.rfp.repository;

import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByUserOrderByUploadedAtDesc(User user);
    Optional<Document> findByIdAndUser(UUID id, User user);
    Optional<Document> findByAiDocId(String aiDocId);
}
