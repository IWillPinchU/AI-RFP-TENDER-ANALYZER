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

    /**
     * Load a document into the AI service for indexing
     */
    public Map<String, Object> loadDocument(String filePath, String docId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/load")
                .body(Map.of("file_path", filePath, "doc_id", docId))
                .retrieve()
                .body(Map.class);
        return response;
    }

    /**
     * Query a loaded document
     */
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

        /**
     * Calls the Python AI /proposal endpoint to generate a single proposal section.
     * Returns a map containing "section" with "title" and "points" (list of strings).
     */
    public Map<String, Object> generateProposalSection(String docId, String title) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/proposal")
                .body(Map.of("doc_id", docId, "title", title))
                .retrieve()
                .body(Map.class);
        return response;
    }

    /**
     * Calls the Python /summarize endpoint for a given doc_id.
     * Returns the full summary map: { overview: {...}, categories: {...} }
     */
    public Map<String, Object> summarizeDocument(String docId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/summarize")
                .body(Map.of("doc_id", docId))
                .retrieve()
                .body(Map.class);
        return response;
    }

    /**
     * Calls the Python /compare endpoint.
     * Returns the full comparison map: { doc_id_a, doc_id_b, comparison: {...} }
     */
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

    /**
     * Calls the Python /unload endpoint to remove a document's FAISS index
     * from memory AND delete its persisted files from disk.
     * Non-critical — if AI service is down, log and continue.
     */
    public void unloadDocument(String docId) {
        try {
            restClient.delete()
                    .uri("/unload/" + docId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // Non-critical — document is still deleted from DB and disk
            System.err.println("Warning: Failed to unload AI index for doc " + docId + ": " + e.getMessage());
        }
    }

    /**
     * Calls the Python /generate-questions endpoint.
     * Returns a map containing { "doc_id": ..., "questions": [...] }.
     */
    public Map<String, Object> generateQuestions(String docId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restClient.post()
                .uri("/generate-questions")
                .body(Map.of("doc_id", docId))
                .retrieve()
                .body(Map.class);
        return response;
    }

    /**
     * Check if AI service is running
     */
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
