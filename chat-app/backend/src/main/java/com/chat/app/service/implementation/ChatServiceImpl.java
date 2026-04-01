package com.chat.app.service.implementation;

import com.chat.app.dto.request.GroupChatRequestDTO;
import com.chat.app.exception.ChatException;
import com.chat.app.exception.UserException;
import com.chat.app.model.Chat;
import com.chat.app.model.User;
import com.chat.app.model.Message;
import com.chat.app.repository.ChatRepository;
import com.chat.app.repository.MessageRepository;
import com.chat.app.service.ChatService;
import com.chat.app.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {

    private final UserService userService;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    @Override
    public Chat createChat(User reqUser, UUID userId2) throws UserException {

        User user2 = userService.findUserById(userId2);

        Optional<Chat> existingChatOptional = chatRepository.findSingleChatByUsers(user2, reqUser);

        if (existingChatOptional.isPresent()) {
            return existingChatOptional.get();
        }

        Chat chat = Chat.builder()
                .createdBy(reqUser)
                .users(new HashSet<>(Set.of(reqUser, user2)))
                .isGroup(false)
                .build();

        return chatRepository.save(chat);
    }

    @Override
    @Transactional(readOnly = true)
    public Chat findChatById(UUID id) throws ChatException {

        Optional<Chat> chatOptional = chatRepository.findById(id);

        if (chatOptional.isPresent()) {
            return chatOptional.get();
        }

        throw new ChatException("No chat found with id " + id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Chat> findAllByUserId(UUID userId) throws UserException {

        User user = userService.findUserById(userId);

        return chatRepository.findChatByUserId(user.getId()).stream()
                .sorted((chat1, chat2) -> {
                    if (chat1.getMessages().isEmpty() && chat2.getMessages().isEmpty()) {
                        return 0;
                    } else if (chat1.getMessages().isEmpty()) {
                        return 1;
                    } else if (chat2.getMessages().isEmpty()) {
                        return -1;
                    }
                    LocalDateTime timeStamp1 = chat1.getMessages().get(chat1.getMessages().size() - 1).getTimeStamp();
                    LocalDateTime timeStamp2 = chat2.getMessages().get(chat2.getMessages().size() - 1).getTimeStamp();
                    return timeStamp2.compareTo(timeStamp1);
                })
                .toList();
    }

    @Override
    public Chat createGroup(GroupChatRequestDTO req, User reqUser) throws UserException {

        Chat groupChat = Chat.builder()
                .isGroup(true)
                .chatName(req.chatName())
                .createdBy(reqUser)
                .admins(new HashSet<>(Set.of(reqUser)))
                .users(new HashSet<>())
                .build();

        for (UUID userId : req.userIds()) {
            User userToAdd = userService.findUserById(userId);
            groupChat.getUsers().add(userToAdd);
        }

        return chatRepository.save(groupChat);
    }

    @Override
    public Chat addUserToGroup(UUID userId, UUID chatId, User reqUser) throws UserException, ChatException {

        Chat chat = findChatById(chatId);
        User user = userService.findUserById(userId);

        if (chat.getAdmins().contains(reqUser)) {
            chat.getUsers().add(user);
            return chatRepository.save(chat);
        }

        throw new UserException("User doesn't have permissions to add members to group chat");
    }

    @Override
    public Chat renameGroup(UUID chatId, String groupName, User reqUser) throws UserException, ChatException {

        Chat chat = findChatById(chatId);

        if (chat.getAdmins().contains(reqUser)) {
            chat.setChatName(groupName);
            return chatRepository.save(chat);
        }

        throw new UserException("User doesn't have permissions to rename group chat");
    }

    @Override
    public Chat removeFromGroup(UUID chatId, UUID userId, User reqUser) throws UserException, ChatException {

        Chat chat = findChatById(chatId);
        User user = userService.findUserById(userId);

        boolean isAdminOrRemoveSelf = chat.getAdmins().contains(reqUser) ||
                (chat.getUsers().contains(reqUser) && user.getId().equals(reqUser.getId()));

        if (isAdminOrRemoveSelf) {
            chat.getUsers().remove(user);
            return chatRepository.save(chat);
        }

        throw new UserException("User doesn't have permissions to remove users from group chat");
    }

    @Override
    public void deleteChat(UUID chatId, UUID userId) throws UserException, ChatException {

        Chat chat = findChatById(chatId);
        User user = userService.findUserById(userId);

        boolean isSingleChatOrAdmin = !chat.getIsGroup() || chat.getAdmins().contains(user);

        if (isSingleChatOrAdmin) {
            chatRepository.deleteById(chatId);
            return;
        }

        throw new UserException("User doesn't have permissions to delete group chat");
    }

    @Override
    public Chat markAsRead(UUID chatId, User reqUser) throws ChatException, UserException {

        Chat chat = findChatById(chatId);

        if (chat.getUsers().contains(reqUser)) {
            chat.getMessages().forEach(msg -> msg.getReadBy().add(reqUser.getId()));

            return chatRepository.save(chat);
        }


        throw new UserException("User is not related to chat");
    }

    @Override
    public Chat pinMessage(UUID chatId, UUID messageId, User reqUser) throws ChatException, UserException {

        Chat chat = findChatById(chatId);

        // Проверяем, что пользователь является участником чата
        if (!chat.getUsers().contains(reqUser)) {
            throw new UserException("User is not a member of this chat");
        }

        // Находим сообщение
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ChatException("Message not found"));

        // Проверяем, что сообщение принадлежит этому чату
        if (!message.getChat().getId().equals(chatId)) {
            throw new ChatException("Message does not belong to this chat");
        }

        chat.setPinnedMessage(message);
        return chatRepository.save(chat);
    }

    @Override
    public Chat unpinMessage(UUID chatId, User reqUser) throws ChatException, UserException {

        Chat chat = findChatById(chatId);

        // Проверяем, что пользователь является участником чата
        if (!chat.getUsers().contains(reqUser)) {
            throw new UserException("User is not a member of this chat");
        }

        chat.setPinnedMessage(null);
        return chatRepository.save(chat);
    }

    @Override
    public Chat updateGroupAvatar(UUID chatId, String groupAvatar, User reqUser) throws ChatException, UserException {
        Chat chat = findChatById(chatId);
        if (!chat.getUsers().contains(reqUser)) {
            throw new UserException("User is not a member of this chat");
        }
        chat.setGroupAvatar(groupAvatar);
        return chatRepository.save(chat);
    }

}
