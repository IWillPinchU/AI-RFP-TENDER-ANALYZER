package com.dce.rfp.entity;

import com.dce.rfp.entity.enums.AiStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String filePath;  // absolute path on disk

    private Long fileSize;  // bytes

    private String fileType;  // pdf, docx, etc.

    @Column(nullable = false, unique = true)
    private String aiDocId;  // doc_id used with Python AI service

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AiStatus aiStatus = AiStatus.PENDING;

    private Integer chunksIndexed;

    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
