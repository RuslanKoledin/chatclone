package com.chat.app.dto.response;

import lombok.Builder;

@Builder
public record ApiResponseDTO(String message, boolean status) {
}
