package com.chat.app.controllers;

import com.chat.app.config.JwtConstants;
import com.chat.app.dto.request.GroupChatRequestDTO;
import com.chat.app.dto.request.UpdateGroupAvatarRequestDTO;
import com.chat.app.dto.response.ApiResponseDTO;
import com.chat.app.dto.response.ChatDTO;
import com.chat.app.exception.ChatException;
import com.chat.app.exception.UserException;
import com.chat.app.model.Chat;
import com.chat.app.model.User;
import com.chat.app.service.ChatService;
import com.chat.app.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chats")
public class ChatController {

    private final UserService userService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/single")
    public ResponseEntity<ChatDTO> createSingleChat(@RequestBody UUID userId,
                                                    @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.createChat(user, userId);
        log.info("User {} created single chat: {}", user.getEmail(), chat.getId());

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    @PostMapping("/group")
    public ResponseEntity<ChatDTO> createGroupChat(@RequestBody GroupChatRequestDTO req,
                                                   @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.createGroup(req, user);
        log.info("User {} created group chat: {}", user.getEmail(), chat.getId());

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatDTO> findChatById(@PathVariable("id") UUID id,
                                                 @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws ChatException, UserException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.findChatById(id);

        // Проверяем что пользователь является участником чата
        if (!chat.getUsers().contains(user)) {
            throw new ChatException("Access denied to chat " + id);
        }

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    @GetMapping("/user")
    public ResponseEntity<List<ChatDTO>> findAllChatsByUserId(@RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException {

        User user = userService.findUserByProfile(jwt);
        List<Chat> chats = chatService.findAllByUserId(user.getId());

        // Облегчённый ответ — только последние 5 сообщений на чат (для превью в сайдбаре)
        return new ResponseEntity<>(ChatDTO.fromChatsLight(chats, 5), HttpStatus.OK);
    }

    @PutMapping("/{chatId}/add/{userId}")
    public ResponseEntity<ChatDTO> addUserToGroup(@PathVariable UUID chatId, @PathVariable UUID userId,
                                                  @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.addUserToGroup(userId, chatId, user);
        log.info("User {} added user {} to group chat: {}", user.getEmail(), userId, chat.getId());

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    @PutMapping("/{chatId}/remove/{userId}")
    public ResponseEntity<ChatDTO> removeUserFromGroup(@PathVariable UUID chatId, @PathVariable UUID userId,
                                                       @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.removeFromGroup(chatId, userId, user);
        log.info("User {} removed user {} from group chat: {}", user.getEmail(), userId, chat.getId());

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    @PutMapping("/{chatId}/markAsRead")
    public ResponseEntity<ChatDTO> markAsRead(@PathVariable UUID chatId,
                                              @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.markAsRead(chatId, user);
        log.info("Chat {} marked as read for user: {}", chatId, user.getEmail());

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponseDTO> deleteChat(@PathVariable UUID id,
                                                     @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);

        // Запоминаем участников чата ДО удаления
        Chat chat = chatService.findChatById(id);
        Set<User> chatUsers = new HashSet<>(chat.getUsers());

        chatService.deleteChat(id, user.getId());
        log.info("User {} deleted chat: {}", user.getEmail(), id);

        // Уведомляем всех участников чата об удалении
        java.util.Map<String, Object> deleteEvent = java.util.Map.of(
                "type", "CHAT_DELETED",
                "chatId", id.toString()
        );
        for (User chatUser : chatUsers) {
            if (!chatUser.getId().equals(user.getId())) {
                messagingTemplate.convertAndSend("/topic/" + chatUser.getId(), deleteEvent);
            }
        }

        ApiResponseDTO res = ApiResponseDTO.builder()
                .message("Chat deleted successfully")
                .status(true)
                .build();

        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    // Закрепление сообщения в чате
    @PostMapping("/{chatId}/pin/{messageId}")
    public ResponseEntity<ChatDTO> pinMessage(@PathVariable UUID chatId, @PathVariable UUID messageId,
                                              @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.pinMessage(chatId, messageId, user);
        log.info("User {} pinned message {} in chat: {}", user.getEmail(), messageId, chatId);

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    // Обновление аватара группы
    @PutMapping("/{chatId}/avatar")
    public ResponseEntity<ChatDTO> updateGroupAvatar(@PathVariable UUID chatId,
                                                     @RequestBody UpdateGroupAvatarRequestDTO req,
                                                     @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.updateGroupAvatar(chatId, req.groupAvatar(), user);
        log.info("User {} updated avatar for group chat: {}", user.getEmail(), chatId);

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    // Переименование группы
    @PutMapping("/{chatId}/rename")
    public ResponseEntity<ChatDTO> renameGroup(@PathVariable UUID chatId,
                                                @RequestBody java.util.Map<String, String> body,
                                                @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        String newName = body.get("groupName");
        Chat chat = chatService.renameGroup(chatId, newName, user);
        log.info("User {} renamed group chat {} to: {}", user.getEmail(), chatId, newName);

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

    // Открепление сообщения в чате
    @PostMapping("/{chatId}/unpin")
    public ResponseEntity<ChatDTO> unpinMessage(@PathVariable UUID chatId,
                                                @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, ChatException {

        User user = userService.findUserByProfile(jwt);
        Chat chat = chatService.unpinMessage(chatId, user);
        log.info("User {} unpinned message in chat: {}", user.getEmail(), chatId);

        return new ResponseEntity<>(ChatDTO.fromChat(chat), HttpStatus.OK);
    }

}
