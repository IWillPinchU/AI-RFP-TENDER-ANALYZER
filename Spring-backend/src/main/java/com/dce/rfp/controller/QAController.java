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

    
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentQAResponse> getOrGenerateQuestions(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        return ResponseEntity.ok(qaService.getOrGenerateQuestions(documentId, userDetails.getUser()));
    }

    
    @PostMapping("/{documentId}/regenerate")
    public ResponseEntity<DocumentQAResponse> regenerateQuestions(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        return ResponseEntity.ok(qaService.regenerateQuestions(documentId, userDetails.getUser()));
    }

    
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

    
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteQA(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        qaService.deleteQA(documentId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}
