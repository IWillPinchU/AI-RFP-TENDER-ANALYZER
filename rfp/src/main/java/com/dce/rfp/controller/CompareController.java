package com.dce.rfp.controller;

import com.dce.rfp.dto.request.CompareRequest;
import com.dce.rfp.dto.response.CompareResponse;
import com.dce.rfp.dto.response.ComparisonSummaryResponse;
import com.dce.rfp.security.CustomUserDetails;
import com.dce.rfp.service.CompareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/compare")
@RequiredArgsConstructor
public class CompareController {

    private final CompareService compareService;

    /**
     * Run a new comparison between two documents on a specific aspect.
     * Both documents must be INDEXED and belong to the authenticated user.
     */
    @PostMapping("/run")
    public ResponseEntity<CompareResponse> runComparison(
            @Valid @RequestBody CompareRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        CompareResponse response = compareService.runComparison(request, userDetails.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns all past comparisons for this user — summary view for the list.
     */
    @GetMapping
    public ResponseEntity<List<ComparisonSummaryResponse>> getPastComparisons(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ComparisonSummaryResponse> comparisons = compareService.getPastComparisons(userDetails.getUser());
        return ResponseEntity.ok(comparisons);
    }

    /**
     * Returns the full detail of a specific past comparison by ID.
     */
    @GetMapping("/{comparisonId}")
    public ResponseEntity<CompareResponse> getComparisonById(
            @PathVariable UUID comparisonId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) throws Exception {
        CompareResponse response = compareService.getComparisonById(comparisonId, userDetails.getUser());
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a past comparison from the user's history.
     */
    @DeleteMapping("/{comparisonId}")
    public ResponseEntity<Void> deleteComparison(
            @PathVariable UUID comparisonId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        compareService.deleteComparison(comparisonId, userDetails.getUser());
        return ResponseEntity.noContent().build();
    }
}
