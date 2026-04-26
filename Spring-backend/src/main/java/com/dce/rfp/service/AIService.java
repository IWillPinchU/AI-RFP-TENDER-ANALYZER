package com.dce.rfp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AIService {

    private final RestClient restClient;



    public AIService(@Value("${app.ai.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    
    public Map<String, Object> loadDocument(String filePath, String docId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/load")
                .body(Map.of("file_path", filePath, "doc_id", docId))
                .retrieve()
                .body(Map.class);
        return response;
    }

    
    public Map<String, Object> queryDocument(String docId, String query) {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("doc_id", docId);
        body.put("query", query);
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/query")
                .body(body)
                .retrieve()
                .body(Map.class);
        return response;
    }

        
    public Map<String, Object> generateProposalSection(String docId, String title) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/proposal")
                .body(Map.of("doc_id", docId, "title", title))
                .retrieve()
                .body(Map.class);
        return response;
    }

    
    public Map<String, Object> summarizeDocument(String docId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/summarize")
                .body(Map.of("doc_id", docId))
                .retrieve()
                .body(Map.class);
        return response;
    }

    
    public Map<String, Object> compareDocuments(String docIdA, String docIdB,
                                                String docNameA, String docNameB,
                                                String query) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/compare")
                .body(Map.of(
                        "doc_id_a", docIdA,
                        "doc_id_b", docIdB,
                        "doc_name_a", docNameA,
                        "doc_name_b", docNameB,
                        "query", query
                ))
                .retrieve()
                .body(Map.class);
        return response;
    }

    
    public void unloadDocument(String docId) {
        try {
            restClient.delete()
                    .uri("/unload/" + docId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            
            System.err.println("Warning: Failed to unload AI index for doc " + docId + ": " + e.getMessage());
        }
    }

    
    public Map<String, Object> generateQuestions(String docId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/generate-questions")
                .body(Map.of("doc_id", docId))
                .retrieve()
                .body(Map.class);
        return response;
    }

    
    public boolean isHealthy() {
        try {
            restClient.get()
                    .uri("/health")
                    .retrieve()
                    .body(Map.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
