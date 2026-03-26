package com.chat.app.controllers;

import com.chat.app.config.JwtConstants;
import com.chat.app.dto.request.UpdateUserRequestDTO;
import com.chat.app.dto.response.ApiResponseDTO;
import com.chat.app.dto.response.UserDTO;
import com.chat.app.exception.UserException;
import com.chat.app.model.User;
import com.chat.app.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getUserProfile(@RequestHeader(JwtConstants.TOKEN_HEADER) String token) throws UserException {

        User user = userService.findUserByProfile(token);

        return new ResponseEntity<>(UserDTO.fromUser(user), HttpStatus.OK);
    }

    @GetMapping("/{query}")
    public ResponseEntity<List<UserDTO>> searchUsers(@PathVariable String query) {

        // Валидация длины запроса
        if (query == null || query.isBlank() || query.length() > 100) {
            return new ResponseEntity<>(List.of(), HttpStatus.OK);
        }

        List<User> users = userService.searchUser(query);

        return new ResponseEntity<>(UserDTO.fromUsersAsList(users), HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<Set<UserDTO>> searchUsersByName(@RequestParam("name") String name) {

        // Валидация длины запроса
        if (name == null || name.isBlank() || name.length() > 100) {
            return new ResponseEntity<>(Set.of(), HttpStatus.OK);
        }

        List<User> users = userService.searchUserByName(name);

        return new ResponseEntity<>(UserDTO.fromUsers(users), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponseDTO> updateUser(@RequestBody UpdateUserRequestDTO request,
                                                     @RequestHeader(JwtConstants.TOKEN_HEADER) String token)
            throws UserException {

        User user = userService.findUserByProfile(token);
        user = userService.updateUser(user.getId(), request);
        log.info("User updated: {}", user.getEmail());

        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("User updated")
                .status(true)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/chats/{chatId}/pin")
    public ResponseEntity<ApiResponseDTO> pinChat(@PathVariable UUID chatId,
                                                   @RequestHeader(JwtConstants.TOKEN_HEADER) String token)
            throws UserException {

        User user = userService.findUserByProfile(token);
        userService.pinChat(user.getId(), chatId);
        log.info("User {} pinned chat {}", user.getEmail(), chatId);

        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("Chat pinned")
                .status(true)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/chats/{chatId}/pin")
    public ResponseEntity<ApiResponseDTO> unpinChat(@PathVariable UUID chatId,
                                                     @RequestHeader(JwtConstants.TOKEN_HEADER) String token)
            throws UserException {

        User user = userService.findUserByProfile(token);
        userService.unpinChat(user.getId(), chatId);
        log.info("User {} unpinned chat {}", user.getEmail(), chatId);

        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("Chat unpinned")
                .status(true)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/chats/pinned")
    public ResponseEntity<Set<UUID>> getPinnedChats(@RequestHeader(JwtConstants.TOKEN_HEADER) String token)
            throws UserException {

        User user = userService.findUserByProfile(token);
        Set<UUID> pinnedChatIds = user.getPinnedChatIds();

        return new ResponseEntity<>(pinnedChatIds, HttpStatus.OK);
    }

    @PostMapping("/chats/{chatId}/mute")
    public ResponseEntity<ApiResponseDTO> muteChat(@PathVariable UUID chatId,
                                                   @RequestHeader(JwtConstants.TOKEN_HEADER) String token)
            throws UserException {

        User user = userService.findUserByProfile(token);
        userService.muteChat(user.getId(), chatId);
        log.info("User {} muted chat {}", user.getEmail(), chatId);

        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("Chat muted")
                .status(true)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/chats/{chatId}/mute")
    public ResponseEntity<ApiResponseDTO> unmuteChat(@PathVariable UUID chatId,
                                                      @RequestHeader(JwtConstants.TOKEN_HEADER) String token)
            throws UserException {

        User user = userService.findUserByProfile(token);
        userService.unmuteChat(user.getId(), chatId);
        log.info("User {} unmuted chat {}", user.getEmail(), chatId);

        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("Chat unmuted")
                .status(true)
                .build();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/chats/muted")
    public ResponseEntity<Set<UUID>> getMutedChats(@RequestHeader(JwtConstants.TOKEN_HEADER) String token)
            throws UserException {

        User user = userService.findUserByProfile(token);
        Set<UUID> mutedChatIds = user.getMutedChatIds();

        return new ResponseEntity<>(mutedChatIds, HttpStatus.OK);
    }

}
