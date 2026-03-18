package com.nicolas.chatapp.service;

import java.util.Map;

/**
 * Интерфейс для аутентификации через Active Directory.
 * Возвращает атрибуты пользователя из AD при успешной проверке credentials.
 */
public interface ADAuthService {

    /**
     * Проверяет credentials пользователя через AD.
     *
     * @return Map с атрибутами (username, fullName, email, department, title) или null если auth failed
     */
    Map<String, String> authenticate(String username, String password);
}
