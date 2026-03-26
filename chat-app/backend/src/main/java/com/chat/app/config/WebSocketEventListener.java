package com.chat.app.config;

import com.chat.app.model.User;
import com.chat.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final UserRepository userRepository;

    // Храним соответствие sessionId -> userId
    private final Map<String, UUID> sessionUserMap = new ConcurrentHashMap<>();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        // Получаем userId из атрибутов сессии (устанавливается в ChannelInterceptor)
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null && sessionAttributes.containsKey("userId")) {
            UUID userId = (UUID) sessionAttributes.get("userId");
            sessionUserMap.put(sessionId, userId);

            // Обновляем статус пользователя
            userRepository.findById(userId).ifPresent(user -> {
                user.setIsOnline(true);
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);
                log.info("User {} is now online", user.getEmail());
            });
        }

        log.info("WebSocket connected: sessionId={}", sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        UUID userId = sessionUserMap.remove(sessionId);
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                user.setIsOnline(false);
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);
                log.info("User {} is now offline", user.getEmail());
            });
        }

        log.info("WebSocket disconnected: sessionId={}", sessionId);
    }

    // Получаем userId из токена и сохраняем в сессию
    public void setUserForSession(String sessionId, UUID userId) {
        sessionUserMap.put(sessionId, userId);
    }
}
