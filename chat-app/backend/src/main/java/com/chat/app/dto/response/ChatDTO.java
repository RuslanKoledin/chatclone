package com.chat.app.dto.response;

import com.chat.app.model.Chat;
import lombok.Builder;

import java.util.*;

@Builder
public record ChatDTO(
        UUID id,
        String chatName,
        Boolean isGroup,
        Set<UserDTO> admins,
        Set<UserDTO> users,
        UserDTO createdBy,
        List<MessageDTO> messages,
        MessageDTO pinnedMessage,
        String groupAvatar) {

    public static ChatDTO fromChat(Chat chat) {
        if (Objects.isNull(chat)) return null;
        return ChatDTO.builder()
                .id(chat.getId())
                .chatName(chat.getChatName())
                .isGroup(chat.getIsGroup())
                .admins(UserDTO.fromUsers(chat.getAdmins()))
                .users(UserDTO.fromUsers(chat.getUsers()))
                .createdBy(UserDTO.fromUser(chat.getCreatedBy()))
                .messages(MessageDTO.fromMessages(chat.getMessages()))
                .pinnedMessage(MessageDTO.fromMessage(chat.getPinnedMessage()))
                .groupAvatar(chat.getGroupAvatar())
                .build();
    }

    /**
     * Облегчённая версия — только последние N сообщений (для списка чатов в сайдбаре)
     */
    public static ChatDTO fromChatLight(Chat chat, int lastMessagesCount) {
        if (Objects.isNull(chat)) return null;

        List<MessageDTO> lastMessages = List.of();
        if (chat.getMessages() != null && !chat.getMessages().isEmpty()) {
            lastMessages = chat.getMessages().stream()
                    .sorted((a, b) -> a.getTimeStamp().compareTo(b.getTimeStamp()))
                    .skip(Math.max(0, chat.getMessages().size() - lastMessagesCount))
                    .map(MessageDTO::fromMessageLight)
                    .toList();
        }

        return ChatDTO.builder()
                .id(chat.getId())
                .chatName(chat.getChatName())
                .isGroup(chat.getIsGroup())
                .admins(UserDTO.fromUsersLight(chat.getAdmins()))
                .users(UserDTO.fromUsersLight(chat.getUsers()))
                .createdBy(UserDTO.fromUserLight(chat.getCreatedBy()))
                .messages(lastMessages)
                .pinnedMessage(null)
                .groupAvatar(chat.getGroupAvatar())
                .build();
    }

    public static List<ChatDTO> fromChats(Collection<Chat> chats) {
        if (Objects.isNull(chats)) return List.of();
        return chats.stream()
                .map(ChatDTO::fromChat)
                .toList();
    }

    public static List<ChatDTO> fromChatsLight(Collection<Chat> chats, int lastMessagesCount) {
        if (Objects.isNull(chats)) return List.of();
        return chats.stream()
                .map(c -> fromChatLight(c, lastMessagesCount))
                .toList();
    }

}
