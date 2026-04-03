package com.chat.app.dto.response;

import com.chat.app.model.Message;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.*;

@Builder
public record MessageDTO(UUID id, String content, LocalDateTime timeStamp, UserDTO user,
                         Set<UUID> readBy, Set<UUID> deliveredTo, LocalDateTime editedAt, Boolean isDeleted,
                         ReplyInfoDTO replyTo, String forwardedFromName, List<AttachmentDTO> attachments,
                         List<ReactionDTO> reactions) {

    public static MessageDTO fromMessage(Message message) {
        if (Objects.isNull(message)) return null;
        return MessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .timeStamp(message.getTimeStamp())
                .user(UserDTO.fromUser(message.getUser()))
                .readBy(new HashSet<>(message.getReadBy()))
                .deliveredTo(message.getDeliveredTo() != null ? new HashSet<>(message.getDeliveredTo()) : new HashSet<>())
                .editedAt(message.getEditedAt())
                .isDeleted(message.getIsDeleted())
                .replyTo(ReplyInfoDTO.fromMessage(message.getReplyTo()))
                .forwardedFromName(message.getForwardedFromName())
                .attachments(AttachmentDTO.fromAttachments(message.getAttachments()))
                .reactions(ReactionDTO.fromReactions(message.getReactions()))
                .build();
    }

    /**
     * Облегчённая версия — без вложений и реакций, без фото юзера (для превью в сайдбаре)
     */
    public static MessageDTO fromMessageLight(Message message) {
        if (Objects.isNull(message)) return null;
        return MessageDTO.builder()
                .id(message.getId())
                .content(message.getContent())
                .timeStamp(message.getTimeStamp())
                .user(UserDTO.fromUserLight(message.getUser()))
                .readBy(new HashSet<>(message.getReadBy()))
                .deliveredTo(message.getDeliveredTo() != null ? new HashSet<>(message.getDeliveredTo()) : new HashSet<>())
                .editedAt(null)
                .isDeleted(message.getIsDeleted())
                .replyTo(null)
                .forwardedFromName(null)
                .attachments(null)
                .reactions(null)
                .build();
    }

    public static List<MessageDTO> fromMessages(Collection<Message> messages) {
        if (Objects.isNull(messages)) return List.of();
        return messages.stream()
                .map(MessageDTO::fromMessage)
                .toList();
    }

}
