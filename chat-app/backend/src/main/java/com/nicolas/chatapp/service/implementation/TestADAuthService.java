package com.nicolas.chatapp.service.implementation;

import com.nicolas.chatapp.service.ADAuthService;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Тестовая реализация AD-аутентификации.
 * Имитирует AD с захардкоженными пользователями.
 * Используется при ad.mode=test.
 */
@Slf4j
public class TestADAuthService implements ADAuthService {

    private final List<Map<String, String>> testUsers = List.of(
            Map.of(
                    "username", "r_koledin",
                    "password", "test",
                    "fullName", "Koledin Ruslan",
                    "email", "r.koledin@cbk.kg",
                    "department", "ОПО",
                    "title", "Специалист"
            ),
            Map.of(
                    "username", "b_bob",
                    "password", "test",
                    "fullName", "Bob Builder",
                    "email", "b.bob@cbk.kg",
                    "department", "IT отдел",
                    "title", "Разработчик"
            ),
            Map.of(
                    "username", "a_tom",
                    "password", "test",
                    "fullName", "Tom Adams",
                    "email", "a.tom@cbk.kg",
                    "department", "Бухгалтерия",
                    "title", "Бухгалтер"
            )
    );

    @Override
    public Map<String, String> authenticate(String username, String password) {
        log.info("[TEST AD] Попытка аутентификации пользователя: {}", username);

        for (Map<String, String> user : testUsers) {
            if (user.get("username").equalsIgnoreCase(username)
                    && user.get("password").equals(password)) {
                log.info("[TEST AD] Пользователь {} успешно аутентифицирован", username);
                Map<String, String> result = new HashMap<>();
                result.put("username", user.get("username"));
                result.put("fullName", user.get("fullName"));
                result.put("email", user.get("email"));
                result.put("department", user.get("department"));
                result.put("title", user.get("title"));
                return result;
            }
        }

        log.warn("[TEST AD] Неверные credentials для пользователя: {}", username);
        return null;
    }
}
