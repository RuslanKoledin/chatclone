package com.chat.app.service;

import com.chat.app.dto.request.UpdateUserRequestDTO;
import com.chat.app.exception.UserException;
import com.chat.app.model.User;

import java.util.List;
import java.util.UUID;

public interface UserService {

    User findUserById(UUID id) throws UserException;

    User findUserByProfile(String jwt) throws UserException;

    User updateUser(UUID id, UpdateUserRequestDTO request) throws UserException;

    List<User> searchUser(String query);

    List<User> searchUserByName(String name);

    void pinChat(UUID userId, UUID chatId) throws UserException;

    void unpinChat(UUID userId, UUID chatId) throws UserException;

    void muteChat(UUID userId, UUID chatId) throws UserException;

    void unmuteChat(UUID userId, UUID chatId) throws UserException;

}
