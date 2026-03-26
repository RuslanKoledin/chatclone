package com.chat.app.dto.response;

import com.chat.app.model.User;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Builder
public record UserDTO(UUID id, String username, String email, String fullName, String department, String title, LocalDateTime lastSeen, Boolean isOnline, Set<UUID> pinnedChatIds, Set<UUID> mutedChatIds, String profilePhoto) {

    public static UserDTO fromUser(User user) {
        if (Objects.isNull(user)) return null;
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .department(user.getDepartment())
                .title(user.getTitle())
                .lastSeen(user.getLastSeen())
                .isOnline(user.getIsOnline())
                .pinnedChatIds(user.getPinnedChatIds() != null ? new HashSet<>(user.getPinnedChatIds()) : new HashSet<>())
                .mutedChatIds(user.getMutedChatIds() != null ? new HashSet<>(user.getMutedChatIds()) : new HashSet<>())
                .profilePhoto(user.getProfilePhoto())
                .build();
    }

    public static Set<UserDTO> fromUsers(Collection<User> users) {
        if (Objects.isNull(users)) return Set.of();
        return users.stream()
                .map(UserDTO::fromUser)
                .collect(Collectors.toSet());
    }

    public static List<UserDTO> fromUsersAsList(Collection<User> users) {
        if (Objects.isNull(users)) return List.of();
        return users.stream()
                .map(UserDTO::fromUser)
                .toList();
    }

}
