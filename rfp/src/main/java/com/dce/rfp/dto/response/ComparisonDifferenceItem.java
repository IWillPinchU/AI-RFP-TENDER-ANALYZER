package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Represents one row in the differences table: Aspect | Doc A says | Doc B says
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComparisonDifferenceItem {
    private String aspect;
    private String documentA;
    private String documentB;
}
