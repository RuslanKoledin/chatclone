package com.chat.app.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TypingEventDTO {
    private String chatId;
    private String userId;
    private String userName;
    private boolean isTyping;
}
