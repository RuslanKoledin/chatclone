package com.chat.app.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Origins: localhost для разработки + серверный URL из env
        String serverOrigin = System.getenv("MCHAT_FRONTEND_URL");
        if (serverOrigin != null && !serverOrigin.isBlank()) {
            registry.addEndpoint("/ws")
                    .setAllowedOrigins("http://localhost:3000", serverOrigin)
                    .withSockJS();
        } else {
            // Если фронт встроен в JAR — разрешаем все origins
            registry.addEndpoint("/ws")
                    .setAllowedOriginPatterns("*")
                    .withSockJS();
        }
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic/");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }

}
