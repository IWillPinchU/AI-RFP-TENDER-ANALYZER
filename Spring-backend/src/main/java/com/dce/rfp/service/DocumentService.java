package com.dce.rfp.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.dce.rfp.dto.response.DocumentResponse;
import com.dce.rfp.entity.ChatSession;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.User;
import com.dce.rfp.entity.enums.AiStatus;
import com.dce.rfp.exception.UserNotFoundException;
import com.dce.rfp.repository.ChatSessionRepository;
import com.dce.rfp.repository.DocumentComparisonRepository;
import com.dce.rfp.repository.DocumentQARepository;
import com.dce.rfp.repository.DocumentRepository;
import com.dce.rfp.repository.DocumentSummaryRepository;
import com.dce.rfp.repository.ProposalRepository;

import lombok.RequiredArgsConstructor;

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
    private final DocumentQARepository documentQARepository;

    @Transactional
    public void deleteDocument(UUID documentId, User user) throws IOException {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));

        aiService.unloadDocument(document.getAiDocId());

        chatSessionRepository.findByDocument(document)
                .ifPresent(chatSessionRepository::delete);

        proposalRepository.findByDocumentAndUserOrderByCreatedAtDesc(document, user)
                .forEach(proposalRepository::delete);

        comparisonRepository.findByDocumentAOrDocumentB(document, document)
                .forEach(comparisonRepository::delete);

        documentSummaryRepository.findByDocument(document)
                .ifPresent(documentSummaryRepository::delete);

        documentQARepository.findByDocument(document)
                .ifPresent(documentQARepository::delete);

        Path filePath = Paths.get(document.getFilePath());
        Files.deleteIfExists(filePath);

        documentRepository.delete(document);
    }


    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, User user) throws IOException {
        String extension = fileStorageService.getFileExtension(file.getOriginalFilename());
        if (!List.of("pdf", "docx", "doc").contains(extension)) {
            throw new IllegalArgumentException("Only PDF and Word documents are supported");
        }

        String filePath = fileStorageService.storeFile(file, user.getId());

        String aiDocId = user.getId() + "_" + UUID.randomUUID().toString().substring(0, 8);

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

        ChatSession chatSession = ChatSession.builder()
                .user(user)
                .document(document)
                .title(file.getOriginalFilename())
                .build();
        chatSessionRepository.save(chatSession);

        asyncDocumentProcessor.processDocumentAsync(document, filePath, aiDocId);

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
