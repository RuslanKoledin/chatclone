package com.chat.app.service;

import com.chat.app.dto.request.SendMessageRequestDTO;
import com.chat.app.exception.ChatException;
import com.chat.app.exception.MessageException;
import com.chat.app.exception.UserException;
import com.chat.app.model.Message;
import com.chat.app.model.User;

import java.util.List;
import java.util.UUID;

public interface MessageService {

    Message sendMessage(SendMessageRequestDTO req, UUID userId) throws UserException, ChatException;

    List<Message> getChatMessages(UUID chatId, User reqUser) throws UserException, ChatException;

    // Пагинированная загрузка сообщений (page 0 = последние, page 1 = предыдущие и т.д.)
    List<Message> getChatMessagesPaginated(UUID chatId, int page, int size, User reqUser) throws UserException, ChatException;

    // Общее количество сообщений в чате
    long getChatMessagesCount(UUID chatId, User reqUser) throws UserException, ChatException;

    Message findMessageById(UUID messageId) throws MessageException;

    void deleteMessageById(UUID messageId, User reqUser) throws UserException, MessageException;

    // Редактирование сообщения (только автор, в течение 24 часов)
    Message editMessage(UUID messageId, String newContent, User reqUser) throws MessageException, UserException;

    // Удаление "у меня" - сообщение скрывается только для текущего пользователя
    void deleteMessageForMe(UUID messageId, User reqUser) throws MessageException;

    // Удаление "у всех" - soft delete, видно всем как "Сообщение удалено"
    void deleteMessageForAll(UUID messageId, User reqUser) throws MessageException, UserException;

    // Пересылка сообщения в другие чаты
    List<Message> forwardMessage(UUID messageId, List<UUID> targetChatIds, User reqUser) throws MessageException, ChatException;

    // Поиск сообщений в чате по тексту
    List<Message> searchMessages(UUID chatId, String query, User reqUser) throws ChatException;

    // Добавить реакцию на сообщение
    Message addReaction(UUID messageId, String emoji, User reqUser) throws MessageException;

    // Удалить реакцию с сообщения
    Message removeReaction(UUID messageId, String emoji, User reqUser) throws MessageException;

}
