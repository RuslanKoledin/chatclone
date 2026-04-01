package com.chat.app.dto.request;

public record UpdateUserRequestDTO(String email, String password, String fullName, String profilePhoto, String userStatus) {
}
