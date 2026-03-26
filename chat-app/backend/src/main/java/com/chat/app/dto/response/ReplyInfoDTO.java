package com.chat.app.dto.response;

import com.chat.app.model.Message;
import lombok.Builder;

import java.util.Objects;
import java.util.UUID;

@Builder
public record ReplyInfoDTO(UUID id, String content, String userName) {

    public static ReplyInfoDTO fromMessage(Message message) {
        if (Objects.isNull(message)) return null;

        String displayContent = message.getContent();
        // Если сообщение было удалено, показываем соответствующий текст
        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            displayContent = "Сообщение удалено";
        }
        // Обрезаем длинные сообщения
        if (displayContent != null && displayContent.length() > 100) {
            displayContent = displayContent.substring(0, 100) + "...";
        }

        return ReplyInfoDTO.builder()
                .id(message.getId())
                .content(displayContent)
                .userName(message.getUser() != null ? message.getUser().getFullName() : "Неизвестный")
                .build();
    }
}
