package com.dce.rfp.controller;

import com.dce.rfp.dto.request.QAAnswerRequest;
import com.dce.rfp.dto.response.DocumentQAResponse;
import com.dce.rfp.dto.response.QAAnswerResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.QAService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/qa")
@RequiredArgsConstructor
public class QAController {

    private final QAService qaService;

    /**
     * Returns cached Q&amp;A questions for the document, generating and caching them
     * on first call. Subsequent calls return the cached version instantly.
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentQAResponse> getOrGenerateQuestions(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        return ResponseEntity.ok(qaService.getOrGenerateQuestions(documentId, userDetails.getUser()));
    }

    /**
     * Forces re-generation of questions, overwriting the existing cache.
     * Use when the user explicitly clicks "Regenerate".
     */
    @PostMapping("/{documentId}/regenerate")
    public ResponseEntity<DocumentQAResponse> regenerateQuestions(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        return ResponseEntity.ok(qaService.regenerateQuestions(documentId, userDetails.getUser()));
    }

    /**
     * Fetches the answer to a specific question from the AI service.
     * Answers are ephemeral — not stored in the database.
     */
    @PostMapping("/{documentId}/answer")
    public ResponseEntity<QAAnswerResponse> answerQuestion(
            @PathVariable UUID documentId,
            @Valid @RequestBody QAAnswerRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        return ResponseEntity.ok(
                qaService.answerQuestion(documentId, request.getQuestion(), userDetails.getUser())
        );
    }

    /**
     * Deletes the cached Q&amp;A record so questions will be regenerated on next access.
     */
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteQA(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        qaService.deleteQA(documentId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}
