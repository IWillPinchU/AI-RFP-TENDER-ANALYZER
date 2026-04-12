package com.dce.rfp.controller;

import com.dce.rfp.dto.response.ApiResponse;
import com.dce.rfp.dto.response.DocumentResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    

    @DeleteMapping("/{documentId}")
    public ResponseEntity<ApiResponse> deleteDocument(
            @PathVariable UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws IOException {
        documentService.deleteDocument(documentId, userDetails.getUser());
        return ResponseEntity.ok(new ApiResponse(true, "Document deleted successfully"));
    }

    // ── Upload a document ──
    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws IOException {
        DocumentResponse response = documentService.uploadDocument(file, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── Get all documents for current user ──
    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getUserDocuments(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<DocumentResponse> documents = documentService.getUserDocuments(userDetails.getUser());
        return ResponseEntity.ok(documents);
    }
}
