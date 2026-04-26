package com.dce.rfp.controller;

import com.dce.rfp.dto.response.ApiResponse;
import com.dce.rfp.dto.response.DocumentSummaryResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.SummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final SummaryService summaryService;

    
    @PostMapping("/generate")
    public ResponseEntity<DocumentSummaryResponse> generateSummary(
            @RequestBody Map<String, UUID> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        UUID documentId = body.get("documentId");
        if (documentId == null) {
            throw new IllegalArgumentException("documentId is required in request body");
        }
        DocumentSummaryResponse response = summaryService.generateSummary(documentId, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentSummaryResponse> getSummary(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        DocumentSummaryResponse response = summaryService.getSummary(documentId, userDetails.getUser());
        if (response == null) {
            return ResponseEntity.noContent().build();  
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<ApiResponse> deleteSummary(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        summaryService.deleteSummary(documentId, userDetails.getUser());
        return ResponseEntity.ok(new ApiResponse(true, "Summary deleted"));
    }

}
