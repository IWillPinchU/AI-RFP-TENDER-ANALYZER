package com.dce.rfp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for a single Q&amp;A answer.
 * Mirrors the structured chat response — bullet points + a short conclusion.
 * Answers are ephemeral (not stored in DB); the frontend maintains session state.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QAAnswerResponse {

    /** The original question that was asked. */
    private String question;

    /** Bullet-point answer items extracted from the AI response. */
    private List<String> mainAnswer;

    /** Short concluding insight from the AI response. */
    private String conclusion;
}
