package com.dce.rfp.service;

import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.enums.AiStatus;
import com.dce.rfp.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AsyncDocumentProcessor {

    private final AIService aiService;
    private final DocumentRepository documentRepository;

    @Async
    public void processDocumentAsync(Document document, String filePath, String aiDocId) {
        try {
            Map<String, Object> aiResponse = aiService.loadDocument(filePath, aiDocId);
            if (aiResponse != null && aiResponse.containsKey("chunks_indexed")) {
                document.setAiStatus(AiStatus.INDEXED);
                document.setChunksIndexed((Integer) aiResponse.get("chunks_indexed"));
            } else {
                document.setAiStatus(AiStatus.FAILED);
            }
        } catch (Exception e) {
            document.setAiStatus(AiStatus.FAILED);
            try {
                Files.deleteIfExists(Paths.get(filePath));
            } catch (Exception ignored) {}
        }
        documentRepository.save(document);
    }
}
