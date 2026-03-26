package com.chat.app.dto.request;

import java.util.List;
import java.util.UUID;

public record ForwardMessageRequestDTO(UUID messageId, List<UUID> targetChatIds) {
}
