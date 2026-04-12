package com.dce.rfp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for fetching the answer to a specific Q&amp;A question.
 */
@Data
public class QAAnswerRequest {

    @NotBlank(message = "Question is required")
    private String question;
}
