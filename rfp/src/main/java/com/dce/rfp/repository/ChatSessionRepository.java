package com.dce.rfp.repository;

import com.dce.rfp.entity.ChatSession;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    Optional<ChatSession> findByDocument(Document document);
    Optional<ChatSession> findByIdAndUser(UUID id, User user);
    List<ChatSession> findByUserOrderByUpdatedAtDesc(User user);
}
