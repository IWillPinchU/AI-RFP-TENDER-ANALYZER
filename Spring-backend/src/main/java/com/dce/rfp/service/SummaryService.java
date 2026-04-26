package com.dce.rfp.service;

import com.dce.rfp.dto.response.DocumentSummaryResponse;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.DocumentSummary;
import com.dce.rfp.entity.User;
import com.dce.rfp.exception.UserNotFoundException;
import com.dce.rfp.repository.DocumentRepository;
import com.dce.rfp.repository.DocumentSummaryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SummaryService {

    private final DocumentRepository documentRepository;
    private final DocumentSummaryRepository documentSummaryRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper  = new ObjectMapper();

    
    @Transactional
    public DocumentSummaryResponse generateSummary(UUID documentId, User user) throws Exception {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));

        
        Map<String, Object> aiResponse = aiService.summarizeDocument(document.getAiDocId());

        if (aiResponse.containsKey("error")) {
            throw new RuntimeException("AI service error: " + aiResponse.get("error"));
        }

        
        @SuppressWarnings("unchecked")
        Map<String, Object> summaryMap = (Map<String, Object>) aiResponse.get("summary");
        @SuppressWarnings("unchecked")
        Map<String, Object> overviewMap = (Map<String, Object>) summaryMap.get("overview");
        @SuppressWarnings("unchecked")
        Map<String, Object> categoriesMap = (Map<String, Object>) summaryMap.get("categories");

        
        String overviewJson = objectMapper.writeValueAsString(overviewMap);
        String categoriesJson = objectMapper.writeValueAsString(categoriesMap);
        
        String estimatedRisk = aiResponse.containsKey("estimated_risk")
                ? (String) aiResponse.get("estimated_risk")
                : (String) overviewMap.getOrDefault("estimated_risk", "Unknown");

        
        Double winProbability = null;
        Object winObj = aiResponse.get("win_probability");
        if (winObj instanceof Number) {
            winProbability = ((Number) winObj).doubleValue();
        }

        
        Optional<DocumentSummary> existingSummary = documentSummaryRepository.findByDocument(document);
        DocumentSummary summary;
        if (existingSummary.isPresent()) {
            
            summary = existingSummary.get();
            summary.setOverviewJson(overviewJson);
            summary.setCategoriesJson(categoriesJson);
            summary.setEstimatedRisk(estimatedRisk);
            summary.setWinProbability(winProbability);
        } else {
            summary = DocumentSummary.builder()
                    .document(document)
                    .overviewJson(overviewJson)
                    .categoriesJson(categoriesJson)
                    .estimatedRisk(estimatedRisk)
                    .winProbability(winProbability)
                    .build();
        }
        documentSummaryRepository.save(summary);


        return buildResponse(summary, document, overviewMap, categoriesMap, false);
    }

    
    @Transactional(readOnly = true)
    public DocumentSummaryResponse getSummary(UUID documentId, User user) throws Exception {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));

        Optional<DocumentSummary> cached = documentSummaryRepository.findByDocument(document);
        if (cached.isEmpty()) {
            return null;  
        }

        DocumentSummary summary = cached.get();

        
        Map<String, Object> overviewMap = objectMapper.readValue(
                summary.getOverviewJson(), new TypeReference<>() {}
        );

        Map<String, Object> categoriesMap = objectMapper.readValue(
        summary.getCategoriesJson(), new TypeReference<>() {}
        );

        return buildResponse(summary, document, overviewMap, categoriesMap, true);
    }

    @Transactional
    public void deleteSummary(UUID documentId, User user) {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));
        documentSummaryRepository.findByDocument(document)
                .ifPresent(documentSummaryRepository::delete);
    }


    
    @SuppressWarnings("unchecked")
    private DocumentSummaryResponse buildResponse(
            DocumentSummary summary, Document document,
            Map<String, Object> overviewMap,
            Map<String, Object> categoriesMap,
            boolean cached
    ) {
        
        List<String> scopeOfWork = (List<String>) overviewMap.getOrDefault("scope_of_work", List.of());
        List<String> criticalDeadlines = (List<String>) overviewMap.getOrDefault("critical_deadlines", List.of());
        List<String> eligibilityHighlights = (List<String>) overviewMap.getOrDefault("eligibility_highlights", List.of());

        
        Map<String, Map<String, Object>> typedCategories = new java.util.HashMap<>();
        if (categoriesMap != null) {
            categoriesMap.forEach((cat, val) -> {
                if (val instanceof Map) {
                    typedCategories.put(cat, (Map<String, Object>) val);
                }
            });
        }

        return DocumentSummaryResponse.builder()
                .documentId(document.getId())
                .documentName(document.getOriginalFilename())
                .createdAt(summary.getCreatedAt())
                .updatedAt(summary.getUpdatedAt())
                .cached(cached)
                .overview((String) overviewMap.getOrDefault("overview", ""))
                .tenderPurpose((String) overviewMap.getOrDefault("tender_purpose", ""))
                .scopeOfWork(scopeOfWork)
                .criticalDeadlines(criticalDeadlines)
                .eligibilityHighlights(eligibilityHighlights)
                .estimatedRisk(summary.getEstimatedRisk())
                .winProbability(summary.getWinProbability())
                .overallRecommendation((String) overviewMap.getOrDefault("overall_recommendation", ""))
                .categories(typedCategories)
                .build();
    }
}
