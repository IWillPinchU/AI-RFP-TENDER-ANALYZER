package com.dce.rfp.service;

import com.dce.rfp.dto.response.DocumentQAResponse;
import com.dce.rfp.dto.response.QAAnswerResponse;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.DocumentQA;
import com.dce.rfp.entity.User;
import com.dce.rfp.entity.enums.AiStatus;
import com.dce.rfp.exception.UserNotFoundException;
import com.dce.rfp.repository.DocumentQARepository;
import com.dce.rfp.repository.DocumentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QAService {

    private final DocumentRepository documentRepository;
    private final DocumentQARepository qaRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Returns the cached Q&amp;A questions for a document if they exist,
     * otherwise calls the AI service to generate and cache them.
     */
    @Transactional
    public DocumentQAResponse getOrGenerateQuestions(UUID documentId, User user) throws Exception {
        Document document = resolveDocument(documentId, user);

        // Return from cache if available
        return qaRepository.findByDocument(document)
                .map(qa -> buildResponse(qa, document, deserializeQuestions(qa.getQuestionsJson()), true))
                .orElseGet(() -> generateAndCache(document));
    }

    /**
     * Forces fresh question generation by updating the cached record in-place.
     * Existing cached questions are overwritten.
     */
    @Transactional
    public DocumentQAResponse regenerateQuestions(UUID documentId, User user) throws Exception {
        Document document = resolveDocument(documentId, user);
        return generateAndCache(document);
    }

    /**
     * Fetches the answer to a specific question using the AI query endpoint.
     * Answers are NOT persisted — the frontend manages session-level state.
     */
    @Transactional(readOnly = true)
    public QAAnswerResponse answerQuestion(UUID documentId, String question, User user) throws Exception {
        Document document = resolveDocument(documentId, user);

        Map<String, Object> aiResponse = aiService.queryDocument(document.getAiDocId(), question);

        if (aiResponse == null || aiResponse.containsKey("error")) {
            throw new IllegalStateException("AI service error: " +
                    (aiResponse != null ? aiResponse.get("error") : "unreachable"));
        }

        return parseAnswerResponse(question, aiResponse);
    }

    /**
     * Deletes the cached Q&amp;A record for a document.
     * Subsequent calls to getOrGenerateQuestions will regenerate from scratch.
     */
    @Transactional
    public void deleteQA(UUID documentId, User user) {
        Document document = resolveDocument(documentId, user);
        qaRepository.findByDocument(document).ifPresent(qaRepository::delete);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolves the document and validates the user owns it and it is indexed.
     */
    private Document resolveDocument(UUID documentId, User user) {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));

        if (document.getAiStatus() != AiStatus.INDEXED) {
            throw new IllegalStateException(
                    "Document is not yet indexed. Current status: " + document.getAiStatus());
        }
        return document;
    }

    /**
     * Calls the AI service to generate questions, then upserts the DB cache.
     */
    private DocumentQAResponse generateAndCache(Document document) {
        Map<String, Object> aiResponse = aiService.generateQuestions(document.getAiDocId());

        if (aiResponse == null || aiResponse.containsKey("error")) {
            throw new IllegalStateException("AI service error while generating questions: " +
                    (aiResponse != null ? aiResponse.get("error") : "unreachable"));
        }

        @SuppressWarnings("unchecked")
        List<String> questions = (List<String>) aiResponse.getOrDefault("questions", List.of());

        String questionsJson;
        try {
            questionsJson = objectMapper.writeValueAsString(questions);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize questions: " + e.getMessage());
        }

        // Upsert: update existing record or create a new one
        DocumentQA qa = qaRepository.findByDocument(document)
                .orElseGet(() -> DocumentQA.builder().document(document).build());
        qa.setQuestionsJson(questionsJson);
        DocumentQA saved = qaRepository.save(qa);

        return buildResponse(saved, document, questions, false);
    }

    /**
     * Parses the AI /query response into a QAAnswerResponse (same structure as chat).
     */
    @SuppressWarnings("unchecked")
    private QAAnswerResponse parseAnswerResponse(String question, Map<String, Object> aiResponse) {
        Object rawAnswer = aiResponse.get("answer");

        List<String> mainAnswer = null;
        String conclusion = null;

        if (rawAnswer instanceof Map<?, ?> answerMap) {
            Object mainObj = ((Map<String, Object>) answerMap).get("main_answer");
            if (mainObj instanceof List<?> points) {
                mainAnswer = points.stream().map(String::valueOf).toList();
            }
            Object conclusionObj = ((Map<String, Object>) answerMap).get("conclusion");
            if (conclusionObj != null) {
                conclusion = String.valueOf(conclusionObj);
            }
        }

        return QAAnswerResponse.builder()
                .question(question)
                .mainAnswer(mainAnswer)
                .conclusion(conclusion)
                .build();
    }

    private List<String> deserializeQuestions(String questionsJson) {
        try {
            return objectMapper.readValue(questionsJson, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private DocumentQAResponse buildResponse(DocumentQA qa, Document document,
                                              List<String> questions, boolean cached) {
        return DocumentQAResponse.builder()
                .documentId(document.getId())
                .documentName(document.getOriginalFilename())
                .questions(questions)
                .cached(cached)
                .createdAt(qa.getCreatedAt())
                .updatedAt(qa.getUpdatedAt())
                .build();
    }
}
