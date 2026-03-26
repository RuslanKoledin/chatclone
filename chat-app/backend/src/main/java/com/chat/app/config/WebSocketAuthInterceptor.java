package com.chat.app.config;

import com.chat.app.model.User;
import com.chat.app.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith(JwtConstants.TOKEN_PREFIX)) {
                log.warn("WebSocket connection rejected: missing or invalid Authorization header");
                throw new org.springframework.messaging.MessageDeliveryException("Authentication required");
            }

            try {
                Claims claims = tokenProvider.getClaimsFromToken(authHeader);
                String username = claims.get(JwtConstants.USERNAME, String.class);

                if (username == null) {
                    throw new org.springframework.messaging.MessageDeliveryException("Invalid token: no username");
                }

                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isEmpty()) {
                    throw new org.springframework.messaging.MessageDeliveryException("User not found");
                }

                User user = userOpt.get();
                accessor.getSessionAttributes().put("userId", user.getId());
                accessor.getSessionAttributes().put("userEmail", user.getEmail());

                user.setIsOnline(true);
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);

                log.info("WebSocket auth: user {} connected", username);
            } catch (org.springframework.messaging.MessageDeliveryException e) {
                throw e;
            } catch (Exception e) {
                log.warn("WebSocket auth failed: {}", e.getMessage());
                throw new org.springframework.messaging.MessageDeliveryException("Authentication failed: " + e.getMessage());
            }
        }

        return message;
    }
}
