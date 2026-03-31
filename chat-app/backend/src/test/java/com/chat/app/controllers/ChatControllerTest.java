package com.chat.app.controllers;

import com.chat.app.AbstractIntegrationTest;
import com.chat.app.config.JwtConstants;
import com.chat.app.dto.request.GroupChatRequestDTO;
import com.chat.app.dto.request.LoginRequestDTO;
import com.chat.app.dto.response.ChatDTO;
import com.chat.app.dto.response.LoginResponseDTO;
import com.chat.app.dto.response.MessageDTO;
import com.chat.app.dto.response.UserDTO;
import com.chat.app.exception.ChatException;
import com.chat.app.exception.MessageException;
import com.chat.app.exception.UserException;
import com.chat.app.model.Message;
import com.chat.app.model.User;
import com.chat.app.service.MessageService;
import com.chat.app.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

class ChatControllerTest extends AbstractIntegrationTest {

    @Autowired
    private ChatController chatController;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @Autowired
    private AuthController authController;

    private final UUID leiasId = UUID.fromString("0fb97ac1-1304-4e83-b640-f659b8679907");
    private final UUID hansId = UUID.fromString("4e039f0a-5eaf-4354-ad5b-14e2889643d4");
    private final UUID lukesId = UUID.fromString("be900497-cc68-4504-9b99-4e5deaf1e6c0");
    private final UUID kenobisId = UUID.fromString("d7083ad6-9e09-453e-b7c8-65016f20ea37");
    private final UUID vadersId = UUID.fromString("f290f384-60ba-4cdd-af96-26c88ede0264");
    private final UUID notExistingId = UUID.fromString("4d09862c-71b6-4719-aeda-f3d961ee89b9");
    private final UUID lukesAndLeiasChatId = UUID.fromString("c40e7df3-7e67-4955-96b5-25e8769ec9bc");
    private final UUID leiaAndKenobisChatId = UUID.fromString("8a3ad4c8-3c57-43c3-aed7-f3af68da5135");
    private final UUID vaderAndLukeChatId = UUID.fromString("0bd20a41-4d23-4c4e-a8aa-8e46743f9ee4");
    private final UUID theGoodiesChatId = UUID.fromString("ac63914e-151e-444f-b44c-f67a3374f1f1");
    private final UUID theDarkSideChatId = UUID.fromString("f476eee8-9a39-4fd2-906f-9e7a746ef167");
    private final UUID messageLukeLeia1Id = UUID.fromString("620d606a-9033-4210-b9c0-982e0f3800ef");
    private final UUID messageLukeLeia2Id = UUID.fromString("15733d9e-939d-497b-b042-fd2fe54d7430");

    private String getAuthorization(String mail, String password) {
        LoginRequestDTO request = new LoginRequestDTO(mail, password);
        LoginResponseDTO response = authController.login(request).getBody();
        assert response != null;
        return JwtConstants.TOKEN_PREFIX + response.token();
    }

    @Test
    void createSingleChat() throws UserException, ChatException {

        // Create new chat
        String authorization = getAuthorization("leia.organa@test.com", "4567");
        User leia = userService.findUserById(leiasId);
        User han = userService.findUserById(hansId);
        ResponseEntity<ChatDTO> result = chatController.createSingleChat(hansId, authorization);
        ResponseEntity<ChatDTO> repositoryChat = chatController.findChatById(Objects.requireNonNull(result.getBody()).id(), authorization);
        assertThat(result.getBody().id()).isNotNull();
        assertThat(result.getBody().createdBy()).isEqualTo(UserDTO.fromUser(leia));
        assertThat(result.getBody().isGroup()).isFalse();
        assertThat(result.getBody().users()).containsExactlyInAnyOrderElementsOf(
                Set.of(Objects.requireNonNull(UserDTO.fromUser(leia)), Objects.requireNonNull(UserDTO.fromUser(han))));
        assertThat(repositoryChat).isEqualTo(result);

        // Create already existing chat
        ResponseEntity<ChatDTO> existingChat = chatController.createSingleChat(lukesId, authorization);
        assertThat(Objects.requireNonNull(existingChat.getBody()).id()).isEqualTo(lukesAndLeiasChatId);

        // Create chat with non-existing user
        assertThrows(UserException.class, () -> chatController.createSingleChat(notExistingId, authorization));
    }

    @Test
    void createGroupChat() throws UserException, ChatException {

        // Create new chat
        String authorization = getAuthorization("leia.organa@test.com", "4567");
        User leia = userService.findUserById(leiasId);
        User han = userService.findUserById(hansId);
        GroupChatRequestDTO dto = new GroupChatRequestDTO(List.of(leiasId, hansId), "TestName");
        ResponseEntity<ChatDTO> result = chatController.createGroupChat(dto, authorization);
        ResponseEntity<ChatDTO> repositoryChat = chatController.findChatById(Objects.requireNonNull(result.getBody()).id(), authorization);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().id()).isNotNull();
        assertThat(result.getBody().createdBy()).isEqualTo(UserDTO.fromUser(leia));
        assertThat(result.getBody().isGroup()).isTrue();
        assertThat(result.getBody().chatName()).isEqualTo("TestName");
        assertThat(result.getBody().users()).containsExactlyInAnyOrderElementsOf(
                Set.of(Objects.requireNonNull(UserDTO.fromUser(leia)), Objects.requireNonNull(UserDTO.fromUser(han))));
        assertThat(repositoryChat).isEqualTo(result);
    }

    @Test
    void findChatById() throws UserException, MessageException, ChatException {

        // Find existing chat (luke is a member of this chat)
        String lukeAuth = getAuthorization("luke.skywalker@test.com", "1234");
        User luke = userService.findUserById(lukesId);
        User leia = userService.findUserById(leiasId);
        Message message1 = messageService.findMessageById(messageLukeLeia1Id);
        Message message2 = messageService.findMessageById(messageLukeLeia2Id);
        ResponseEntity<ChatDTO> result = chatController.findChatById(lukesAndLeiasChatId, lukeAuth);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(Objects.requireNonNull(result.getBody()).id()).isEqualTo(lukesAndLeiasChatId);
        assertThat(result.getBody().isGroup()).isFalse();
        assertThat(result.getBody().createdBy()).isEqualTo(UserDTO.fromUser(luke));
        assertThat(result.getBody().users()).containsExactlyInAnyOrderElementsOf(
                Set.of(Objects.requireNonNull(UserDTO.fromUser(luke)), Objects.requireNonNull(UserDTO.fromUser(leia))));
        assertThat(result.getBody().messages()).containsExactlyElementsOf(
                List.of(Objects.requireNonNull(MessageDTO.fromMessage(message1)),
                        Objects.requireNonNull(MessageDTO.fromMessage(message2))));

        // Find non-existing chat
        assertThrows(ChatException.class, () -> chatController.findChatById(notExistingId, lukeAuth));
    }

    @Test
    void findAllChatsByUserId() throws UserException, ChatException {

        // Find all by existing user
        String authorization = getAuthorization("luke.skywalker@test.com", "1234");
        ResponseEntity<List<ChatDTO>> result = chatController.findAllChatsByUserId(authorization);
        ResponseEntity<ChatDTO> chat1 = chatController.findChatById(theGoodiesChatId, authorization);
        ResponseEntity<ChatDTO> chat2 = chatController.findChatById(lukesAndLeiasChatId, authorization);
        ResponseEntity<ChatDTO> chat3 = chatController.findChatById(vaderAndLukeChatId, authorization);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody()).containsExactlyElementsOf(
                List.of(Objects.requireNonNull(chat1.getBody()), Objects.requireNonNull(chat2.getBody()),
                        Objects.requireNonNull(chat3.getBody())));
    }

    @Test
    void addUserToGroup() throws UserException, ChatException {

        // Add user to group
        String authorization = getAuthorization("luke.skywalker@test.com", "1234");
        User vader = userService.findUserById(vadersId);
        ResponseEntity<ChatDTO> result = chatController.addUserToGroup(theGoodiesChatId, vadersId, authorization);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(Objects.requireNonNull(result.getBody()).users()).contains(UserDTO.fromUser(vader));

        // Add to non-existing group
        String finalAuthorization = authorization;
        assertThrows(ChatException.class, () -> chatController.addUserToGroup(notExistingId, kenobisId, finalAuthorization));

        // Add non-existing user
        assertThrows(UserException.class, () -> chatController.addUserToGroup(theGoodiesChatId, notExistingId, finalAuthorization));

        // Add as user that is not admin
        String leiaAuth = getAuthorization("leia.organa@test.com", "4567");
        assertThrows(UserException.class, () -> chatController.addUserToGroup(theGoodiesChatId, vadersId, leiaAuth));
    }

    @Test
    void removeUserFromGroup() throws UserException, ChatException {

        // Remove from Chat
        String authorization = getAuthorization("luke.skywalker@test.com", "1234");
        User leia = userService.findUserById(leiasId);
        ResponseEntity<ChatDTO> result = chatController.removeUserFromGroup(theGoodiesChatId, leiasId, authorization);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(Objects.requireNonNull(result.getBody()).users()).isNotEmpty();
        assertThat(result.getBody().users()).doesNotContain(UserDTO.fromUser(leia));

        // Remove from non-existing chat
        String finalAuthorization1 = authorization;
        assertThrows(ChatException.class, () -> chatController.removeUserFromGroup(notExistingId, hansId, finalAuthorization1));

        // Remove non-existing user
        assertThrows(UserException.class, () -> chatController.removeUserFromGroup(theGoodiesChatId, notExistingId, finalAuthorization1));

        // Remove self from chat as not admin
        String kenobiAuth = getAuthorization("obiwan.kenobi@test.com", "3456");
        User kenobi = userService.findUserById(kenobisId);
        ResponseEntity<ChatDTO> result2 = chatController.removeUserFromGroup(theGoodiesChatId, kenobisId, kenobiAuth);
        assertThat(Objects.requireNonNull(result2.getBody()).users()).isNotEmpty();
        assertThat(result2.getBody().users()).doesNotContain(UserDTO.fromUser(kenobi));

        // Remove as not admin
        String hanAuth = getAuthorization("han.solo@test.com", "5678");
        assertThrows(UserException.class, () -> chatController.removeUserFromGroup(theGoodiesChatId, lukesId, hanAuth));
    }

    @Test
    void markAsRead() throws UserException, ChatException {

        // Mark chat as read
        String authorization = getAuthorization("luke.skywalker@test.com", "1234");
        User luke = userService.findUserById(lukesId);
        ResponseEntity<ChatDTO> result = chatController.markAsRead(theGoodiesChatId, authorization);
        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        Objects.requireNonNull(result.getBody()).messages().forEach(msg -> assertThat(msg.readBy()).contains(luke.getId()));

        // Mark non-existing chat as read
        assertThrows(ChatException.class, () -> chatController.markAsRead(notExistingId, authorization));

        // Mark chat as read that user is not a part of
        String vaderAuth = getAuthorization("darth.vader@test.com", "2345");
        assertThrows(UserException.class, () -> chatController.markAsRead(theGoodiesChatId, vaderAuth));
    }

    @Test
    void deleteChat() throws ChatException, UserException {

        // Remove non-existing chat
        String palpatineAuth = getAuthorization("imperator.palpatine@test.com", "6789");
        assertThrows(ChatException.class, () -> chatController.deleteChat(notExistingId, palpatineAuth));

        // Remove group chat as admin
        chatController.deleteChat(theDarkSideChatId, palpatineAuth);
        assertThrows(ChatException.class, () -> chatController.findChatById(theDarkSideChatId, palpatineAuth));

        // Remove group chat as not admin
        String leiaAuth = getAuthorization("leia.organa@test.com", "4567");
        assertThrows(UserException.class, () -> chatController.deleteChat(theGoodiesChatId, leiaAuth));

        // Remove single chat
        String kenobiAuth = getAuthorization("obiwan.kenobi@test.com", "3456");
        chatController.deleteChat(leiaAndKenobisChatId, kenobiAuth);
        assertThrows(ChatException.class, () -> chatController.findChatById(leiaAndKenobisChatId, kenobiAuth));
    }

}