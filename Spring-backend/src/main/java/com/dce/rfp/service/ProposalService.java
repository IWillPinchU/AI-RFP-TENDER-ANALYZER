package com.dce.rfp.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dce.rfp.dto.request.GenerateProposalRequest;
import com.dce.rfp.dto.response.ProposalResponse;
import com.dce.rfp.dto.response.ProposalSectionResponse;
import com.dce.rfp.entity.Document;
import com.dce.rfp.entity.Proposal;
import com.dce.rfp.entity.ProposalSection;
import com.dce.rfp.entity.User;
import com.dce.rfp.exception.UserNotFoundException;
import com.dce.rfp.repository.DocumentRepository;
import com.dce.rfp.repository.ProposalRepository;
import com.dce.rfp.repository.ProposalSectionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProposalSectionRepository proposalSectionRepository;
    private final DocumentRepository documentRepository;
    private final AIService aiService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    
    @Transactional
    public ProposalResponse generateProposal(GenerateProposalRequest request, User user) throws Exception {
        
        Document document = documentRepository.findByIdAndUser(request.getDocumentId(), user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));

        
        Proposal proposal = Proposal.builder()
                .user(user)
                .document(document)
                .title(request.getTitle())
                .build();
        proposalRepository.save(proposal);

        List<ProposalSectionResponse> sectionResponses = new ArrayList<>();

        List<String> sectionTitles = request.getSections();


List<CompletableFuture<Map<String, Object>>> futures = sectionTitles.stream()
        .map(title -> CompletableFuture.supplyAsync(() ->
                aiService.generateProposalSection(document.getAiDocId(), title)
        ))
        .toList();

        
        List<Map<String, Object>> aiResponses = futures.stream()
                .map(CompletableFuture::join)
                .toList();

        
        for (int i = 0; i < sectionTitles.size(); i++) {
        String sectionTitle = sectionTitles.get(i);
        List<String> points = extractPoints(aiResponses.get(i));
        String pointsJson = objectMapper.writeValueAsString(points);

        ProposalSection section = ProposalSection.builder()
                .proposal(proposal)
                .sectionTitle(sectionTitle)
                .points(pointsJson)
                .orderIndex(i)
                .build();
        proposalSectionRepository.save(section);

        sectionResponses.add(ProposalSectionResponse.builder()
                .id(section.getId())
                .sectionTitle(sectionTitle)
                .points(points)
                .orderIndex(i)
                .build());
        }

        return buildResponse(proposal, document, sectionResponses);
    }

    
    @Transactional(readOnly = true)
    public List<ProposalResponse> getProposalsByDocument(UUID documentId, User user) {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new UserNotFoundException("Document not found"));

        return proposalRepository.findByDocumentAndUserOrderByCreatedAtDesc(document, user)
                .stream()
                .map(p -> buildResponse(p, document, null))
                .toList();
    }

    
    @Transactional(readOnly = true)
    public ProposalResponse getProposalById(UUID proposalId, User user) throws Exception {
        Proposal proposal = proposalRepository.findByIdAndUser(proposalId, user)
                .orElseThrow(() -> new UserNotFoundException("Proposal not found"));

        List<ProposalSection> sections = proposalSectionRepository
                .findByProposalOrderByOrderIndex(proposal);

        List<ProposalSectionResponse> sectionResponses = new ArrayList<>();
        for (ProposalSection section : sections) {
            
            List<String> points = objectMapper.readValue(
                    section.getPoints(), new TypeReference<List<String>>() {}
            );
            sectionResponses.add(ProposalSectionResponse.builder()
                    .id(section.getId())
                    .sectionTitle(section.getSectionTitle())
                    .points(points)
                    .orderIndex(section.getOrderIndex())
                    .build());
        }

        return buildResponse(proposal, proposal.getDocument(), sectionResponses);
    }

    
    @Transactional
    public void deleteProposal(UUID proposalId, User user) {
        Proposal proposal = proposalRepository.findByIdAndUser(proposalId, user)
                .orElseThrow(() -> new UserNotFoundException("Proposal not found"));
        proposalRepository.delete(proposal);
    }

    
    @SuppressWarnings("unchecked")
    private List<String> extractPoints(Map<String, Object> aiResponse) {
        try {
            Object sectionObj = aiResponse.get("section");
            if (sectionObj instanceof Map) {
                Map<String, Object> sectionMap = (Map<String, Object>) sectionObj;
                Object pointsObj = sectionMap.get("points");
                if (pointsObj instanceof List) {
                    return ((List<?>) pointsObj).stream()
                            .map(String::valueOf)
                            .toList();
                }
            }
        } catch (Exception ignored) {}
        
        return List.of("Unable to generate section content");
    }

    
    private ProposalResponse buildResponse(Proposal proposal, Document document,
                                           List<ProposalSectionResponse> sections) {
        return ProposalResponse.builder()
                .id(proposal.getId())
                .title(proposal.getTitle())
                .documentId(document.getId())
                .documentName(document.getOriginalFilename())
                .createdAt(proposal.getCreatedAt())
                .sections(sections)  
                .build();
    }
}
