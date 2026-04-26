package com.dce.rfp.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ChatMessageResponse sendMessage(UUID chatSessionId, String query, User user) {
        
        ChatSession session = chatSessionRepository.findByIdAndUser(chatSessionId, user)
                .orElseThrow(() -> new UserNotFoundException("Chat session not found"));

        Document document = session.getDocument();

        
        if (document.getAiStatus() != AiStatus.INDEXED) {
            throw new IllegalStateException("Document is not yet indexed. Status: " + document.getAiStatus());
        }

        
        ChatMessage userMessage = ChatMessage.builder()
                .chatSession(session)
                .role(MessageRole.USER)
                .content(query)
                .build();
        chatMessageRepository.save(userMessage);

        
        if (session.getTitle() == null || session.getTitle().isBlank() || session.getTitle().equals(document.getOriginalFilename())) {
            String title = query.length() > 50 ? query.substring(0, 50) + "..." : query;
            session.setTitle(title);
        }

        
        Map<String, Object> aiResponse = aiService.queryDocument(document.getAiDocId(), query);

        
        if (aiResponse == null) {
            throw new IllegalStateException("AI service is unreachable. Please ensure the AI service is running.");
        }
        
        if (aiResponse.containsKey("error")) {
            throw new IllegalStateException("AI service error: " + aiResponse.get("error"));
        }

        
        Object rawAnswer = aiResponse.get("answer");
        String contentJson;  
        List<String> mainAnswer = null;
        String conclusion = null;

        if (rawAnswer instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> answerMap = (Map<String, Object>) rawAnswer;

            
            Object mainObj = answerMap.get("main_answer");
            if (mainObj instanceof List) {
                List<String> points = ((List<?>) mainObj).stream()
                        .map(String::valueOf).toList();
                mainAnswer = points;
            }

            
            conclusion = answerMap.containsKey("conclusion")
                    ? String.valueOf(answerMap.get("conclusion")) : null;
        }

        
        try {
            contentJson = objectMapper.writeValueAsString(rawAnswer);
        } catch (Exception e) {
            contentJson = String.valueOf(rawAnswer);
        }

        
        ChatMessage assistantMessage = ChatMessage.builder()
                .chatSession(session)
                .role(MessageRole.ASSISTANT)
                .content(contentJson)
                .build();
        chatMessageRepository.save(assistantMessage);

        chatSessionRepository.save(session);

        
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
                builder.content(msg.getContent()); 
            }

            builder.overallRisk(null);
            builder.winProbability(null);
        }

        return builder.build();
    }

}
