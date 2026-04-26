package com.dce.rfp.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dce.rfp.dto.request.ChatQueryRequest;
import com.dce.rfp.dto.response.ChatMessageResponse;
import com.dce.rfp.dto.response.ChatSessionResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.ChatService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

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

    @GetMapping("/{sessionId}")
    public ResponseEntity<ChatSessionResponse> getChatSession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        ChatSessionResponse response = chatService.getChatSession(sessionId, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ChatSessionResponse>> getUserChatSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ChatSessionResponse> sessions = chatService.getUserChatSessions(userDetails.getUser());
        return ResponseEntity.ok(sessions);
    }
}
