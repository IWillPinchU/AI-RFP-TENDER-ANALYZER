package com.dce.rfp.controller;

import com.dce.rfp.dto.request.GenerateProposalRequest;
import com.dce.rfp.dto.response.ApiResponse;
import com.dce.rfp.dto.response.ProposalResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    
    @PostMapping("/generate")
    public ResponseEntity<ProposalResponse> generateProposal(
            @Valid @RequestBody GenerateProposalRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        ProposalResponse response = proposalService.generateProposal(request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    
    @GetMapping
    public ResponseEntity<List<ProposalResponse>> getProposalsByDocument(
            @RequestParam UUID documentId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ProposalResponse> proposals = proposalService.getProposalsByDocument(
                documentId, userDetails.getUser()
        );
        return ResponseEntity.ok(proposals);
    }

    
    @GetMapping("/{proposalId}")
    public ResponseEntity<ProposalResponse> getProposalById(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        ProposalResponse response = proposalService.getProposalById(proposalId, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    
    @DeleteMapping("/{proposalId}")
    public ResponseEntity<ApiResponse> deleteProposal(
            @PathVariable UUID proposalId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        proposalService.deleteProposal(proposalId, userDetails.getUser());
        return ResponseEntity.ok(new ApiResponse(true, "Proposal deleted successfully"));
    }
}
