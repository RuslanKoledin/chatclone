package com.chat.app.config;

public class JwtConstants {

    private JwtConstants() {
    }

    public static final String TOKEN_HEADER = "Authorization";
    public static final String USERNAME = "username";
    public static final String EMAIL = "email";
    public static final String TOKEN_PREFIX = "Bearer ";
    static final long ACCESS_TOKEN_VALIDITY = 8 * 60 * 60 * 1000L; // 8 часов (рабочий день)
    static final String ISSUER = "chat-app-backend";
    static final String AUTHORITIES = "authorities";

    // Секрет из переменной окружения (ОБЯЗАТЕЛЬНО установить перед запуском!)
    // Для разработки: export MCHAT_JWT_SECRET=<ваш_секрет_256бит_hex>
    static final String SECRET_KEY;

    static {
        String envSecret = System.getenv("MCHAT_JWT_SECRET");
        if (envSecret == null || envSecret.isBlank()) {
            throw new IllegalStateException(
                    "MCHAT_JWT_SECRET environment variable is not set! " +
                    "Generate with: openssl rand -hex 64"
            );
        }
        SECRET_KEY = envSecret;
    }
}
