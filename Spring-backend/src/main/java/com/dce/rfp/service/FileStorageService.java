package com.dce.rfp.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    @Value("${app.file.upload-dir:./uploads}")
    private String uploadDir;

    public String storeFile(MultipartFile file, Long userId) throws IOException {
        
        Path userDir = Paths.get(uploadDir, String.valueOf(userId));
        Files.createDirectories(userDir);

        
        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String storedFilename = UUID.randomUUID() + extension;

        
        Path filePath = userDir.resolve(storedFilename);
        file.transferTo(filePath.toFile());

        return filePath.toAbsolutePath().toString();
    }

    public String getFileExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        }
        return "";
    }
}
