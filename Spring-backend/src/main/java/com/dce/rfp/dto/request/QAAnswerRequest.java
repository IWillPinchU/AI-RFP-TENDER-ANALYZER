package com.dce.rfp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class QAAnswerRequest {

    @NotBlank(message = "Question is required")
    private String question;
}
