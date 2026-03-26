package com.chat.app.controllers;

import com.chat.app.config.JwtConstants;
import com.chat.app.dto.response.AttachmentDTO;
import com.chat.app.dto.response.MessageDTO;
import com.chat.app.exception.ChatException;
import com.chat.app.exception.MessageException;
import com.chat.app.exception.UserException;
import com.chat.app.model.Attachment;
import com.chat.app.model.Chat;
import com.chat.app.model.Message;
import com.chat.app.model.User;
import com.chat.app.repository.AttachmentRepository;
import com.chat.app.repository.MessageRepository;
import com.chat.app.service.ChatService;
import com.chat.app.service.FileStorageService;
import com.chat.app.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.Set;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final AttachmentRepository attachmentRepository;
    private final MessageRepository messageRepository;
    private final UserService userService;
    private final ChatService chatService;

    // Белый список разрешённых MIME-типов
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            // Изображения
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
            // Документы
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            // Текст
            "text/plain", "text/csv",
            // Архивы
            "application/zip", "application/x-rar-compressed", "application/x-7z-compressed"
    );

    // Запрещённые расширения (исполняемые файлы)
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".jar", ".msi",
            ".com", ".scr", ".pif", ".hta", ".wsf", ".cpl", ".reg", ".inf"
    );

    // Загрузка файлов и создание сообщения с вложениями
    @PostMapping("/upload")
    public ResponseEntity<MessageDTO> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("chatId") UUID chatId,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.findChatById(chatId);

        // Создаём сообщение
        Message message = Message.builder()
                .chat(chat)
                .user(user)
                .content(content)
                .timeStamp(LocalDateTime.now())
                .readBy(new HashSet<>(Set.of(user.getId())))
                .attachments(new HashSet<>())
                .build();

        message = messageRepository.save(message);
        chat.getMessages().add(message);

        // Валидация и сохранение файлов
        for (MultipartFile file : files) {
            // Проверка MIME-типа
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                log.warn("Rejected file upload: {} with type {}", file.getOriginalFilename(), contentType);
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            // Проверка расширения файла
            String originalName = file.getOriginalFilename();
            if (originalName != null) {
                String lowerName = originalName.toLowerCase();
                for (String ext : BLOCKED_EXTENSIONS) {
                    if (lowerName.endsWith(ext)) {
                        log.warn("Rejected file upload: blocked extension {}", originalName);
                        return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
                    }
                }
            }

            // Проверка размера (дополнительно к Spring-настройке)
            if (file.getSize() > 10 * 1024 * 1024) { // 10 MB
                log.warn("Rejected file upload: size {} exceeds limit", file.getSize());
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }

            String storedName = fileStorageService.storeFile(file);

            Attachment attachment = Attachment.builder()
                    .fileName(file.getOriginalFilename())
                    .storedName(storedName)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .message(message)
                    .build();

            attachmentRepository.save(attachment);
            message.getAttachments().add(attachment);
        }

        log.info("User {} uploaded {} files to chat {}", user.getEmail(), files.length, chatId);

        return new ResponseEntity<>(MessageDTO.fromMessage(message), HttpStatus.OK);
    }

    // Скачивание файла (требуется аутентификация)
    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName,
                                                  @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException {

        // Проверяем аутентификацию
        userService.findUserByProfile(jwt);

        // Защита от path traversal
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        Resource resource = fileStorageService.loadFileAsResource(fileName);

        Optional<Attachment> attachment = attachmentRepository.findByStoredName(fileName);
        String contentType = attachment.map(Attachment::getContentType).orElse("application/octet-stream");
        String originalFileName = attachment.map(Attachment::getFileName).orElse(fileName);

        // Санитизация имени файла в Content-Disposition
        String safeFileName = originalFileName.replaceAll("[^a-zA-Zа-яА-Я0-9._\\- ]", "_");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFileName + "\"")
                .body(resource);
    }
}
