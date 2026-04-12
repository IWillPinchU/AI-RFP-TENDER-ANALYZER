package com.dce.rfp.service;

import com.dce.rfp.dto.response.DocumentResponse;
import com.dce.rfp.entity.ChatSession;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.User;
import com.dce.rfp.entity.enums.AiStatus;
import com.dce.rfp.exception.UserNotFoundException;
import com.dce.rfp.repository.ChatSessionRepository;
import com.dce.rfp.repository.DocumentComparisonRepository;
import com.dce.rfp.repository.DocumentRepository;
import com.dce.rfp.repository.DocumentSummaryRepository;
import com.dce.rfp.repository.ProposalRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final FileStorageService fileStorageService;
    private final AIService aiService;
    private final AsyncDocumentProcessor asyncDocumentProcessor;
    private final ProposalRepository proposalRepository;
    private final DocumentSummaryRepository documentSummaryRepository;
    private final DocumentComparisonRepository comparisonRepository;

    @Transactional
    public void deleteDocument(UUID documentId, User user) throws IOException {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));

        // 0. Unload AI index from memory and delete persisted index files from disk
        aiService.unloadDocument(document.getAiDocId());

        // 1. Delete chat session (cascade deletes all ChatMessages)
        chatSessionRepository.findByDocument(document)
                .ifPresent(chatSessionRepository::delete);

        // 2. Delete all proposals + their sections (cascade deletes ProposalSections)
        proposalRepository.findByDocumentAndUserOrderByCreatedAtDesc(document, user)
                .forEach(proposalRepository::delete);

        // 2a. Delete all comparisons involving this document (as either Doc A or Doc B)
        comparisonRepository.findByDocumentAOrDocumentB(document, document)
                .forEach(comparisonRepository::delete);

        // 3. Delete cached document summary
        documentSummaryRepository.findByDocument(document)
                .ifPresent(documentSummaryRepository::delete);

        // 4. Delete physical file from disk
        Path filePath = Paths.get(document.getFilePath());
        Files.deleteIfExists(filePath);

        // 5. Delete the document record itself
        documentRepository.delete(document);
    }


    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, User user) throws IOException {
        // 1. Validate file type
        String extension = fileStorageService.getFileExtension(file.getOriginalFilename());
        if (!List.of("pdf", "docx", "doc").contains(extension)) {
            throw new IllegalArgumentException("Only PDF and Word documents are supported");
        }

        // 2. Store file on disk
        String filePath = fileStorageService.storeFile(file, user.getId());

        // 3. Generate unique AI doc_id
        String aiDocId = user.getId() + "_" + UUID.randomUUID().toString().substring(0, 8);

        // 4. Create document record
        Document document = Document.builder()
                .user(user)
                .originalFilename(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .fileType(extension)
                .aiDocId(aiDocId)
                .aiStatus(AiStatus.PENDING)
                .build();
        documentRepository.save(document);

        // 5. Create a chat session for this document
        ChatSession chatSession = ChatSession.builder()
                .user(user)
                .document(document)
                .title(file.getOriginalFilename())
                .build();
        chatSessionRepository.save(chatSession);

        // 6. Call Async processor to index the document in the background
        asyncDocumentProcessor.processDocumentAsync(document, filePath, aiDocId);

        // 7. Return response instantly
        return mapToResponse(document, chatSession.getId());
    }

    public List<DocumentResponse> getUserDocuments(User user) {
        List<Document> documents = documentRepository.findByUserOrderByUploadedAtDesc(user);
        return documents.stream()
                .map(doc -> {
                    UUID chatSessionId = chatSessionRepository.findByDocument(doc)
                            .map(ChatSession::getId)
                            .orElse(null);
                    return mapToResponse(doc, chatSessionId);
                })
                .toList();
    }

    public Document getDocumentById(UUID id, User user) {
        return documentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));
    }

    private DocumentResponse mapToResponse(Document doc, UUID chatSessionId) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .originalFilename(doc.getOriginalFilename())
                .fileSize(doc.getFileSize())
                .fileType(doc.getFileType())
                .aiStatus(doc.getAiStatus().name())
                .chunksIndexed(doc.getChunksIndexed())
                .uploadedAt(doc.getUploadedAt())
                .chatSessionId(chatSessionId)
                .build();
    }
}
