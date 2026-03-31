package com.chat.app.service.implementation;

import com.chat.app.dto.request.SendMessageRequestDTO;
import com.chat.app.exception.ChatException;
import com.chat.app.exception.MessageException;
import com.chat.app.exception.UserException;
import com.chat.app.model.Chat;
import com.chat.app.model.Message;
import com.chat.app.model.Reaction;
import com.chat.app.model.User;
import com.chat.app.repository.MessageRepository;
import com.chat.app.repository.ReactionRepository;
import com.chat.app.service.ChatService;
import com.chat.app.service.MessageService;
import com.chat.app.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageServiceImpl implements MessageService {

    private final UserService userService;
    private final ChatService chatService;
    private final MessageRepository messageRepository;
    private final ReactionRepository reactionRepository;

    @Override
    public Message sendMessage(SendMessageRequestDTO req, UUID userId) throws UserException, ChatException {

        User user = userService.findUserById(userId);
        Chat chat = chatService.findChatById(req.chatId());

        // Проверяем что пользователь является участником чата
        if (!chat.getUsers().contains(user)) {
            throw new UserException("User is not a member of this chat");
        }

        // Находим цитируемое сообщение если указано
        Message replyTo = null;
        if (req.replyToId() != null) {
            try {
                replyTo = findMessageById(req.replyToId());
            } catch (MessageException e) {
                // Игнорируем если цитируемое сообщение не найдено
            }
        }

        Message message = Message.builder()
                .chat(chat)
                .user(user)
                .content(req.content())
                .timeStamp(LocalDateTime.now())
                .readBy(new HashSet<>(Set.of(user.getId())))
                .replyTo(replyTo)
                .build();

        chat.getMessages().add(message);

        return messageRepository.save(message);
    }

    @Override
    public List<Message> getChatMessages(UUID chatId, User reqUser) throws UserException, ChatException {

        Chat chat = chatService.findChatById(chatId);

        if (!chat.getUsers().contains(reqUser)) {
            throw new UserException("User isn't related to chat " + chatId);
        }

        return messageRepository.findByChat_Id(chat.getId());
    }

    @Override
    public List<Message> getChatMessagesPaginated(UUID chatId, int page, int size, User reqUser)
            throws UserException, ChatException {

        Chat chat = chatService.findChatById(chatId);

        if (!chat.getUsers().contains(reqUser)) {
            throw new UserException("User isn't related to chat " + chatId);
        }

        // Получаем сообщения в обратном порядке (новые первые), затем реверсим
        List<Message> messages = messageRepository.findByChat_IdPaginated(chatId, PageRequest.of(page, size));
        Collections.reverse(messages);
        return messages;
    }

    @Override
    public long getChatMessagesCount(UUID chatId, User reqUser) throws UserException, ChatException {

        Chat chat = chatService.findChatById(chatId);

        if (!chat.getUsers().contains(reqUser)) {
            throw new UserException("User isn't related to chat " + chatId);
        }

        return messageRepository.countByChat_Id(chatId);
    }

    @Override
    public Message findMessageById(UUID messageId) throws MessageException {

        Optional<Message> message = messageRepository.findById(messageId);

        if (message.isPresent()) {
            return message.get();
        }

        throw new MessageException("Message not found " + messageId);
    }

    @Override
    public void deleteMessageById(UUID messageId, User reqUser) throws UserException, MessageException {

        Message message = findMessageById(messageId);

        if (message.getUser().getId().equals(reqUser.getId())) {
            messageRepository.deleteById(messageId);
            return;
        }

        throw new UserException("User is not related to message " + message.getId());
    }

    @Override
    public Message editMessage(UUID messageId, String newContent, User reqUser) throws MessageException, UserException {

        Message message = findMessageById(messageId);

        // Проверяем, что редактирует автор
        if (!message.getUser().getId().equals(reqUser.getId())) {
            throw new UserException("Only the author can edit the message");
        }

        // Проверяем, что прошло не более 24 часов
        LocalDateTime editDeadline = message.getTimeStamp().plusHours(24);
        if (LocalDateTime.now().isAfter(editDeadline)) {
            throw new MessageException("Message can only be edited within 24 hours");
        }

        // Проверяем, что сообщение не удалено
        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            throw new MessageException("Cannot edit deleted message");
        }

        message.setContent(newContent);
        message.setEditedAt(LocalDateTime.now());

        return messageRepository.save(message);
    }

    @Override
    public void deleteMessageForMe(UUID messageId, User reqUser) throws MessageException {

        Message message = findMessageById(messageId);

        // Добавляем пользователя в список "удалено для"
        if (message.getDeletedFor() == null) {
            message.setDeletedFor(new HashSet<>());
        }
        message.getDeletedFor().add(reqUser.getId());

        messageRepository.save(message);
    }

    @Override
    public void deleteMessageForAll(UUID messageId, User reqUser) throws MessageException, UserException {

        Message message = findMessageById(messageId);

        // Проверяем, что удаляет автор
        if (!message.getUser().getId().equals(reqUser.getId())) {
            throw new UserException("Only the author can delete the message for everyone");
        }

        // Soft delete - помечаем как удалённое
        message.setIsDeleted(true);
        message.setContent("Сообщение удалено");

        messageRepository.save(message);
    }

    @Override
    public List<Message> forwardMessage(UUID messageId, List<UUID> targetChatIds, User reqUser)
            throws MessageException, ChatException {

        Message originalMessage = findMessageById(messageId);

        // Проверяем, что сообщение не удалено
        if (Boolean.TRUE.equals(originalMessage.getIsDeleted())) {
            throw new MessageException("Cannot forward deleted message");
        }

        List<Message> forwardedMessages = new ArrayList<>();

        for (UUID chatId : targetChatIds) {
            Chat targetChat = chatService.findChatById(chatId);

            // Проверяем, что пользователь является участником целевого чата
            if (!targetChat.getUsers().contains(reqUser)) {
                continue; // Пропускаем чаты, где пользователь не состоит
            }

            Message forwardedMessage = Message.builder()
                    .chat(targetChat)
                    .user(reqUser)
                    .content(originalMessage.getContent())
                    .timeStamp(LocalDateTime.now())
                    .readBy(new HashSet<>(Set.of(reqUser.getId())))
                    .forwardedFromName(originalMessage.getUser().getFullName())
                    .build();

            targetChat.getMessages().add(forwardedMessage);
            forwardedMessages.add(messageRepository.save(forwardedMessage));
        }

        return forwardedMessages;
    }

    @Override
    public List<Message> searchMessages(UUID chatId, String query, User reqUser) throws ChatException {

        Chat chat = chatService.findChatById(chatId);

        // Проверяем, что пользователь является участником чата
        if (!chat.getUsers().contains(reqUser)) {
            throw new ChatException("User is not a member of this chat");
        }

        // Поиск сообщений по содержимому (без учёта регистра)
        return messageRepository.findByChat_IdAndContentContainingIgnoreCase(chatId, query);
    }

    @Override
    public Message addReaction(UUID messageId, String emoji, User reqUser) throws MessageException {

        Message message = findMessageById(messageId);

        // Проверяем, не поставил ли уже пользователь такую реакцию
        Optional<Reaction> existingReaction = reactionRepository.findByMessageIdAndUserIdAndEmoji(
                messageId, reqUser.getId(), emoji);

        if (existingReaction.isPresent()) {
            // Реакция уже есть - ничего не делаем
            return message;
        }

        Reaction reaction = Reaction.builder()
                .emoji(emoji)
                .user(reqUser)
                .message(message)
                .build();

        reactionRepository.save(reaction);
        message.getReactions().add(reaction);

        return message;
    }

    @Override
    public Message removeReaction(UUID messageId, String emoji, User reqUser) throws MessageException {

        Message message = findMessageById(messageId);

        Optional<Reaction> existingReaction = reactionRepository.findByMessageIdAndUserIdAndEmoji(
                messageId, reqUser.getId(), emoji);

        if (existingReaction.isPresent()) {
            message.getReactions().remove(existingReaction.get());
            reactionRepository.delete(existingReaction.get());
        }

        return message;
    }

}
