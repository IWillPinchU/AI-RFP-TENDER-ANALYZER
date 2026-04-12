package com.dce.rfp.controller;

import com.dce.rfp.dto.request.ChatQueryRequest;
import com.dce.rfp.dto.response.ChatMessageResponse;
import com.dce.rfp.dto.response.ChatSessionResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // ── Send a message to a chat session ──
    @PostMapping("/{sessionId}/send")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable UUID sessionId,
            @Valid @RequestBody ChatQueryRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ChatMessageResponse response = chatService.sendMessage(
                sessionId, request.getQuery(), userDetails.getUser()
        );
        return ResponseEntity.ok(response);
    }

    // ── Get a chat session with all messages ──
    @GetMapping("/{sessionId}")
    public ResponseEntity<ChatSessionResponse> getChatSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ChatSessionResponse response = chatService.getChatSession(sessionId, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    // ── Get all chat sessions for current user ──
    @GetMapping
    public ResponseEntity<List<ChatSessionResponse>> getUserChatSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ChatSessionResponse> sessions = chatService.getUserChatSessions(userDetails.getUser());
        return ResponseEntity.ok(sessions);
    }
}
