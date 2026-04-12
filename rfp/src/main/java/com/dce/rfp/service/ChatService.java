package com.dce.rfp.service;

import com.dce.rfp.dto.response.ChatMessageResponse;
import com.dce.rfp.dto.response.ChatSessionResponse;
import com.dce.rfp.entity.ChatMessage;
import com.dce.rfp.entity.ChatSession;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.User;
import com.dce.rfp.entity.enums.AiStatus;
import com.dce.rfp.entity.enums.MessageRole;
import com.dce.rfp.exception.UserNotFoundException;
import com.dce.rfp.repository.ChatMessageRepository;
import com.dce.rfp.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ChatMessageResponse sendMessage(UUID chatSessionId, String query, User user) {
        // 1. Get chat session
        ChatSession session = chatSessionRepository.findByIdAndUser(chatSessionId, user)
                .orElseThrow(() -> new UserNotFoundException("Chat session not found"));

        Document document = session.getDocument();

        // 2. Verify document is indexed
        if (document.getAiStatus() != AiStatus.INDEXED) {
            throw new IllegalStateException("Document is not yet indexed. Status: " + document.getAiStatus());
        }

        // 3. Save user message
        ChatMessage userMessage = ChatMessage.builder()
                .chatSession(session)
                .role(MessageRole.USER)
                .content(query)
                .build();
        chatMessageRepository.save(userMessage);

        // 4. Auto-generate title from first question
        if (session.getTitle() == null || session.getTitle().isBlank() || session.getTitle().equals(document.getOriginalFilename())) {
            String title = query.length() > 50 ? query.substring(0, 50) + "..." : query;
            session.setTitle(title);
        }

        // 5. Call AI service
        Map<String, Object> aiResponse = aiService.queryDocument(document.getAiDocId(), query);

        // Guard: null response means AI service is completely unreachable
        if (aiResponse == null) {
            throw new IllegalStateException("AI service is unreachable. Please ensure the AI service is running.");
        }
        // Guard: error key means AI returned a handled error (e.g. doc not loaded)
        if (aiResponse.containsKey("error")) {
            throw new IllegalStateException("AI service error: " + aiResponse.get("error"));
        }

        // Parse structured AI response
        Object rawAnswer = aiResponse.get("answer");
        String contentJson;  // raw JSON to store in DB
        List<String> mainAnswer = null;
        String conclusion = null;

        if (rawAnswer instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> answerMap = (Map<String, Object>) rawAnswer;

            // main_answer
            Object mainObj = answerMap.get("main_answer");
            if (mainObj instanceof List) {
                List<String> points = ((List<?>) mainObj).stream()
                        .map(String::valueOf).toList();
                mainAnswer = points;
            }

            // conclusion
            conclusion = answerMap.containsKey("conclusion")
                    ? String.valueOf(answerMap.get("conclusion")) : null;
        }

        // Store raw JSON in DB
        try {
            contentJson = objectMapper.writeValueAsString(rawAnswer);
        } catch (Exception e) {
            contentJson = String.valueOf(rawAnswer);
        }

        // 6. Save assistant message
        ChatMessage assistantMessage = ChatMessage.builder()
                .chatSession(session)
                .role(MessageRole.ASSISTANT)
                .content(contentJson)
                .build();
        chatMessageRepository.save(assistantMessage);

        chatSessionRepository.save(session);

        // 7. Return structured response directly (not from DB mapping)
        return ChatMessageResponse.builder()
                .id(assistantMessage.getId())
                .role("ASSISTANT")
                .mainAnswer(mainAnswer)
                .conclusion(conclusion)
                .createdAt(assistantMessage.getCreatedAt())
                .build();

    }

    @Transactional(readOnly = true)
    public ChatSessionResponse getChatSession(UUID chatSessionId, User user) {
        ChatSession session = chatSessionRepository.findByIdAndUser(chatSessionId, user)
                .orElseThrow(() -> new UserNotFoundException("Chat session not found"));

        List<ChatMessage> messages = chatMessageRepository
                .findByChatSessionOrderByCreatedAtAsc(session);

        return ChatSessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .documentName(session.getDocument().getOriginalFilename())
                .documentId(session.getDocument().getId())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .messages(messages.stream().map(this::mapToMessageResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getUserChatSessions(User user) {
        return chatSessionRepository.findByUserOrderByUpdatedAtDesc(user).stream()
                .map(session -> ChatSessionResponse.builder()
                        .id(session.getId())
                        .title(session.getTitle())
                        .documentName(session.getDocument().getOriginalFilename())
                        .documentId(session.getDocument().getId())
                        .createdAt(session.getCreatedAt())
                        .updatedAt(session.getUpdatedAt())
                        .build())
                .toList();
    }

        private ChatMessageResponse mapToMessageResponse(ChatMessage msg) {
        ChatMessageResponse.ChatMessageResponseBuilder builder = ChatMessageResponse.builder()
                .id(msg.getId())
                .role(msg.getRole().name())
                .createdAt(msg.getCreatedAt());

        if (msg.getRole() == MessageRole.USER) {
            builder.content(msg.getContent());
        } else {
            // Parse stored JSON back into structured fields
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> parsed = objectMapper.readValue(msg.getContent(), Map.class);

                Object mainObj = parsed.get("main_answer");
                if (mainObj instanceof List) {
                    List<String> points = ((List<?>) mainObj).stream()
                            .map(String::valueOf).toList();
                    builder.mainAnswer(points);
                }
                if (parsed.containsKey("conclusion")) {
                    builder.conclusion(String.valueOf(parsed.get("conclusion")));
                }
            } catch (Exception e) {
                builder.content(msg.getContent()); // fallback to raw text
            }

            builder.overallRisk(null);
            builder.winProbability(null);
        }

        return builder.build();
    }

}
