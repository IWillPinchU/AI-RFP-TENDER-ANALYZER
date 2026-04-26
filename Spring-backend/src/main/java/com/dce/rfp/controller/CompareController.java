package com.dce.rfp.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dce.rfp.dto.request.CompareRequest;
import com.dce.rfp.dto.response.CompareResponse;
import com.dce.rfp.dto.response.ComparisonSummaryResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.CompareService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/compare")
@RequiredArgsConstructor
public class CompareController {

    private final CompareService compareService;

    
    @PostMapping("/run")
    public ResponseEntity<CompareResponse> runComparison(
            @Valid @RequestBody CompareRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        CompareResponse response = compareService.runComparison(request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    
    @GetMapping
    public ResponseEntity<List<ComparisonSummaryResponse>> getPastComparisons(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ComparisonSummaryResponse> comparisons = compareService.getPastComparisons(userDetails.getUser());
        return ResponseEntity.ok(comparisons);
    }

    
    @GetMapping("/{comparisonId}")
    public ResponseEntity<CompareResponse> getComparisonById(
            @PathVariable UUID comparisonId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        CompareResponse response = compareService.getComparisonById(comparisonId, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    
    @DeleteMapping("/{comparisonId}")
    public ResponseEntity<Void> deleteComparison(
            @PathVariable UUID comparisonId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        compareService.deleteComparison(comparisonId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}
