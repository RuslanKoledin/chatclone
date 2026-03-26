package com.chat.app.dto.response;

import lombok.Builder;

@Builder
public record LoginResponseDTO(String token, boolean isAuthenticated) {

}
