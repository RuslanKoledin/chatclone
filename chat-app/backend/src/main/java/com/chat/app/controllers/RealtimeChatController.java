package com.chat.app.controllers;

import com.chat.app.dto.request.DeliveryReceiptDTO;
import com.chat.app.dto.request.ReadReceiptDTO;
import com.chat.app.dto.request.TypingEventDTO;
import com.chat.app.exception.ChatException;
import com.chat.app.model.Chat;
import com.chat.app.model.Message;
import com.chat.app.model.User;
import com.chat.app.repository.MessageRepository;
import com.chat.app.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class RealtimeChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final MessageRepository messageRepository;

    @MessageMapping("/messages")
    public void receiveMessage(@Payload Message message) {
        if (message.getChat() == null || message.getChat().getId() == null) {
            log.error("Message chat is null!");
            return;
        }
        try {
            Chat chat = chatService.findChatById(message.getChat().getId());
            log.debug("Delivering message to {} users in chat {}", chat.getUsers().size(), chat.getId());

            for (User user : chat.getUsers()) {
                final String destination = "/topic/" + user.getId();
                messagingTemplate.convertAndSend(destination, message);
            }
        } catch (ChatException e) {
            log.error("Chat not found for message: {}", message.getChat().getId());
        }
    }

    @MessageMapping("/typing")
    public void receiveTypingEvent(@Payload TypingEventDTO typingEvent) {
        try {
            UUID chatId = UUID.fromString(typingEvent.getChatId());
            UUID senderId = UUID.fromString(typingEvent.getUserId());

            Chat chat = chatService.findChatById(chatId);
            // Отправляем typing событие всем пользователям чата, кроме отправителя
            for (User user : chat.getUsers()) {
                if (!user.getId().equals(senderId)) {
                    final String destination = "/topic/" + user.getId();
                    messagingTemplate.convertAndSend(destination, typingEvent);
                }
            }
        } catch (ChatException e) {
            log.warn("Chat not found for typing event: {}", typingEvent.getChatId());
        } catch (Exception e) {
            log.error("Error processing typing event: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/read")
    public void receiveReadReceipt(@Payload ReadReceiptDTO readReceipt) {
        try {
            UUID chatId = UUID.fromString(readReceipt.getChatId());
            UUID readerId = UUID.fromString(readReceipt.getReaderId());

            Chat chat = chatService.findChatById(chatId);

            // Помечаем все сообщения в чате как прочитанные этим пользователем
            List<Message> chatMessages = messageRepository.findByChat_Id(chatId);
            for (Message msg : chatMessages) {
                if (!msg.getUser().getId().equals(readerId) && !msg.getReadBy().contains(readerId)) {
                    msg.getReadBy().add(readerId);
                    messageRepository.save(msg);
                }
            }

            // Отправляем событие прочтения всем пользователям чата, кроме читателя
            for (User user : chat.getUsers()) {
                if (!user.getId().equals(readerId)) {
                    final String destination = "/topic/" + user.getId();
                    messagingTemplate.convertAndSend(destination, readReceipt);
                }
            }
            log.debug("Read receipt sent for chat {} by user {}", chatId, readerId);
        } catch (ChatException e) {
            log.warn("Chat not found for read receipt: {}", readReceipt.getChatId());
        } catch (Exception e) {
            log.error("Error processing read receipt: {}", e.getMessage());
        }
    }

    @MessageMapping("/delivered")
    public void receiveDeliveryReceipt(@Payload DeliveryReceiptDTO deliveryReceipt) {
        try {
            UUID chatId = UUID.fromString(deliveryReceipt.getChatId());
            UUID userId = UUID.fromString(deliveryReceipt.getUserId());

            Chat chat = chatService.findChatById(chatId);

            // Помечаем все сообщения в чате как доставленные этому пользователю
            List<Message> chatMessages = messageRepository.findByChat_Id(chatId);
            for (Message msg : chatMessages) {
                if (!msg.getUser().getId().equals(userId)) {
                    if (msg.getDeliveredTo() == null) {
                        msg.setDeliveredTo(new java.util.HashSet<>());
                    }
                    if (!msg.getDeliveredTo().contains(userId)) {
                        msg.getDeliveredTo().add(userId);
                        messageRepository.save(msg);
                    }
                }
            }

            // Уведомляем отправителей о доставке
            for (User user : chat.getUsers()) {
                if (!user.getId().equals(userId)) {
                    final String destination = "/topic/" + user.getId();
                    messagingTemplate.convertAndSend(destination, deliveryReceipt);
                }
            }
            log.debug("Delivery receipt sent for chat {} by user {}", chatId, userId);
        } catch (ChatException e) {
            log.warn("Chat not found for delivery receipt: {}", deliveryReceipt.getChatId());
        } catch (Exception e) {
            log.error("Error processing delivery receipt: {}", e.getMessage());
        }
    }

}
