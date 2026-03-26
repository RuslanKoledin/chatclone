package com.chat.app.dto.request;

import java.util.UUID;

public record SendMessageRequestDTO(UUID chatId, String content, UUID replyToId) {
}
