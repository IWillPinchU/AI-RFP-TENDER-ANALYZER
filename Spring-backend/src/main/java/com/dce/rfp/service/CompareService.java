package com.dce.rfp.service;

import com.dce.rfp.dto.request.CompareRequest;
import com.dce.rfp.dto.response.CompareResponse;
import com.dce.rfp.dto.response.ComparisonDifferenceItem;
import com.dce.rfp.dto.response.ComparisonSummaryResponse;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.DocumentComparison;
import com.dce.rfp.entity.User;
import com.dce.rfp.exception.UserNotFoundException;
import com.dce.rfp.repository.DocumentComparisonRepository;
import com.dce.rfp.repository.DocumentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompareService {

    private final DocumentRepository documentRepository;
    private final DocumentComparisonRepository comparisonRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper  = new ObjectMapper();

    
    @Transactional
    public CompareResponse runComparison(CompareRequest request, User user) throws Exception {
        
        Document docA = documentRepository.findByIdAndUser(request.getDocumentIdA(), user)
                .orElseThrow(() -> new UserNotFoundException("Document A not found"));
        Document docB = documentRepository.findByIdAndUser(request.getDocumentIdB(), user)
                .orElseThrow(() -> new UserNotFoundException("Document B not found"));

        if (request.getDocumentIdA().equals(request.getDocumentIdB())) {
            throw new IllegalArgumentException("Cannot compare a document with itself");
        }

        
        Map<String, Object> aiResponse = aiService.compareDocuments(
                docA.getAiDocId(), docB.getAiDocId(),
                docA.getOriginalFilename(), docB.getOriginalFilename(),
                request.getQuery()
        );

        if (aiResponse.containsKey("error")) {
            throw new RuntimeException("AI service error: " + aiResponse.get("error"));
        }

        
        @SuppressWarnings("unchecked")
        Map<String, Object> comparisonMap = (Map<String, Object>) aiResponse.get("comparison");

        
        String resultJson = objectMapper.writeValueAsString(comparisonMap);

        
        String riskA = aiResponse.getOrDefault("document_a_risk", "Unknown").toString();
        String riskB = aiResponse.getOrDefault("document_b_risk", "Unknown").toString();

        
        Double winA = extractDouble(aiResponse, "document_a_win_probability");
        Double winB = extractDouble(aiResponse, "document_b_win_probability");

        
        DocumentComparison saved = DocumentComparison.builder()
                .user(user)
                .documentA(docA)
                .documentB(docB)
                .query(request.getQuery())
                .resultJson(resultJson)
                .documentARisk(riskA)
                .documentBRisk(riskB)
                .documentAWinProbability(winA)
                .documentBWinProbability(winB)
                .build();
        comparisonRepository.save(saved);

        return buildFullResponse(saved, docA, docB, comparisonMap);
    }

    
    @Transactional(readOnly = true)
    public List<ComparisonSummaryResponse> getPastComparisons(User user) {
        return comparisonRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(c -> buildSummaryResponse(c))
                .toList();
    }

    
    @Transactional(readOnly = true)
    public CompareResponse getComparisonById(UUID comparisonId, User user) throws Exception {
        DocumentComparison comparison = comparisonRepository.findByIdAndUser(comparisonId, user)
                .orElseThrow(() -> new UserNotFoundException("Comparison not found"));

        
        Map<String, Object> comparisonMap = objectMapper.readValue(
                comparison.getResultJson(), new TypeReference<>() {}
        );

        return buildFullResponse(comparison, comparison.getDocumentA(),
                comparison.getDocumentB(), comparisonMap);
    }

    
    @Transactional
    public void deleteComparison(UUID comparisonId, User user) {
        DocumentComparison comparison = comparisonRepository.findByIdAndUser(comparisonId, user)
                .orElseThrow(() -> new UserNotFoundException("Comparison not found"));
        comparisonRepository.delete(comparison);
    }

    
    private Double extractDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).doubleValue() : null;
    }

    
    private ComparisonSummaryResponse buildSummaryResponse(DocumentComparison c) {
    return ComparisonSummaryResponse.builder()
            .id(c.getId())
            .documentNameA(c.getDocumentA().getOriginalFilename())
            .documentNameB(c.getDocumentB().getOriginalFilename())
            .query(c.getQuery())
            .documentARisk(c.getDocumentARisk())
            .documentBRisk(c.getDocumentBRisk())
            .createdAt(c.getCreatedAt())
            .build();
    }

    
    @SuppressWarnings("unchecked")
    private CompareResponse buildFullResponse(DocumentComparison comparison,
                                               Document docA, Document docB,
                                               Map<String, Object> comparisonMap) {
        
        List<String> similarities = (List<String>) comparisonMap.getOrDefault("similarities", List.of());

        
        List<ComparisonDifferenceItem> differences = new ArrayList<>();
        Object diffsObj = comparisonMap.get("differences");
        if (diffsObj instanceof List<?> diffs) {
            for (Object diff : diffs) {
                if (diff instanceof Map<?, ?> diffMap) {
                    differences.add(ComparisonDifferenceItem.builder()
                            .aspect((String) diffMap.get("aspect"))
                            .documentA((String) diffMap.get("document_a"))
                            .documentB((String) diffMap.get("document_b"))
                            .build());
                }
            }
        }

        return CompareResponse.builder()
                .id(comparison.getId())
                .createdAt(comparison.getCreatedAt())
                .updatedAt(comparison.getUpdatedAt())
                .documentIdA(docA.getId())
                .documentIdB(docB.getId())
                .documentNameA(docA.getOriginalFilename())
                .documentNameB(docB.getOriginalFilename())
                .query(comparison.getQuery())
                .similarities(similarities)
                .differences(differences)
                .documentAAdvantage((String) comparisonMap.getOrDefault("document_a_advantage", ""))
                .documentBAdvantage((String) comparisonMap.getOrDefault("document_b_advantage", ""))
                .documentARisk(comparison.getDocumentARisk())
                .documentBRisk(comparison.getDocumentBRisk())
                .documentAWinProbability(comparison.getDocumentAWinProbability())
                .documentBWinProbability(comparison.getDocumentBWinProbability())
                .riskExplanation(null)
                .recommendation((String) comparisonMap.getOrDefault("recommendation", ""))
                .build();
    }
}
