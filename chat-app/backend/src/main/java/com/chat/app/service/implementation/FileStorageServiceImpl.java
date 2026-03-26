package com.chat.app.service.implementation;

import com.chat.app.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageServiceImpl() {
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";

        if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        String storedFileName = UUID.randomUUID().toString() + fileExtension;

        try {
            if (storedFileName.contains("..")) {
                throw new RuntimeException("Invalid file path: " + storedFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("Stored file: {} as {}", originalFileName, storedFileName);
            return storedFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName, ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();

            // Проверяем что файл находится внутри директории uploads
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new RuntimeException("Access denied: file outside upload directory");
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("File not found");
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("File not found");
        }
    }

    @Override
    public void deleteFile(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
            log.info("Deleted file: {}", fileName);
        } catch (IOException ex) {
            log.error("Could not delete file: {}", fileName, ex);
        }
    }
}
