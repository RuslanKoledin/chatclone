package com.chat.app.dto.response;

import com.chat.app.model.Attachment;
import lombok.Builder;

import java.util.*;

@Builder
public record AttachmentDTO(UUID id, String fileName, String contentType, Long fileSize, String url) {

    public static AttachmentDTO fromAttachment(Attachment attachment) {
        if (Objects.isNull(attachment)) return null;
        return AttachmentDTO.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .contentType(attachment.getContentType())
                .fileSize(attachment.getFileSize())
                .url("/api/files/" + attachment.getStoredName())
                .build();
    }

    public static List<AttachmentDTO> fromAttachments(Collection<Attachment> attachments) {
        if (Objects.isNull(attachments)) return List.of();
        return attachments.stream()
                .map(AttachmentDTO::fromAttachment)
                .toList();
    }
}
