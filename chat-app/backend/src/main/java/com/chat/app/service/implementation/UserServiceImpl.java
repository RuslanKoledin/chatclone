package com.chat.app.service.implementation;

import com.chat.app.config.JwtConstants;
import com.chat.app.config.TokenProvider;
import com.chat.app.dto.request.UpdateUserRequestDTO;
import com.chat.app.exception.UserException;
import com.chat.app.model.User;
import com.chat.app.model.UserStatus;
import com.chat.app.repository.UserRepository;
import com.chat.app.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;

    @Override
    public User findUserById(UUID id) throws UserException {

        Optional<User> user = userRepository.findById(id);

        if (user.isPresent()) {
            return user.get();
        }

        throw new UserException("User not found with id " + id);
    }

    @Override
    public User findUserByProfile(String jwt) throws UserException {

        String username = String.valueOf(tokenProvider.getClaimsFromToken(jwt).get(JwtConstants.USERNAME));

        if (username == null) {
            throw new BadCredentialsException("Invalid token");
        }

        Optional<User> user = userRepository.findByUsername(username);

        if (user.isPresent()) {
            return user.get();
        }

        throw new UserException("User not found with username " + username);
    }

    @Override
    public User updateUser(UUID id, UpdateUserRequestDTO request) throws UserException {

        User user = findUserById(id);

        if (Objects.nonNull(request.fullName())) {
            user.setFullName(request.fullName());
        }

        if (Objects.nonNull(request.profilePhoto())) {
            user.setProfilePhoto(request.profilePhoto());
        }

        if (Objects.nonNull(request.userStatus())) {
            try {
                user.setUserStatus(UserStatus.valueOf(request.userStatus()));
            } catch (IllegalArgumentException ignored) {}
        }

        return userRepository.save(user);
    }

    @Override
    public List<User> searchUser(String query) {
        return userRepository.findByFullNameOrUsername(query).stream()
                .sorted(Comparator.comparing(User::getFullName))
                .toList();
    }

    @Override
    public List<User> searchUserByName(String name) {
        return userRepository.findByFullName(name).stream()
                .sorted(Comparator.comparing(User::getFullName))
                .toList();
    }

    @Override
    public void pinChat(UUID userId, UUID chatId) throws UserException {
        User user = findUserById(userId);
        if (user.getPinnedChatIds() == null) {
            user.setPinnedChatIds(new HashSet<>());
        }
        user.getPinnedChatIds().add(chatId);
        userRepository.save(user);
    }

    @Override
    public void unpinChat(UUID userId, UUID chatId) throws UserException {
        User user = findUserById(userId);
        if (user.getPinnedChatIds() != null) {
            user.getPinnedChatIds().remove(chatId);
            userRepository.save(user);
        }
    }

    @Override
    public void muteChat(UUID userId, UUID chatId) throws UserException {
        User user = findUserById(userId);
        if (user.getMutedChatIds() == null) {
            user.setMutedChatIds(new HashSet<>());
        }
        user.getMutedChatIds().add(chatId);
        userRepository.save(user);
    }

    @Override
    public void unmuteChat(UUID userId, UUID chatId) throws UserException {
        User user = findUserById(userId);
        if (user.getMutedChatIds() != null) {
            user.getMutedChatIds().remove(chatId);
            userRepository.save(user);
        }
    }

}
