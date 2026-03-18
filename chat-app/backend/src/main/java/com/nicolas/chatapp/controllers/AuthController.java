package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.config.TokenProvider;
import com.nicolas.chatapp.dto.request.LoginRequestDTO;
import com.nicolas.chatapp.dto.response.LoginResponseDTO;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.UserRepository;
import com.nicolas.chatapp.service.ADAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final ADAuthService adAuthService;

    @PostMapping("/signin")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequestDTO) {

        final String username = loginRequestDTO.username();
        final String password = loginRequestDTO.password();

        // 1. Аутентификация через AD
        Map<String, String> adUser = adAuthService.authenticate(username, password);
        if (adUser == null) {
            throw new BadCredentialsException("Неверный логин или пароль");
        }

        // 2. Ищем или создаём пользователя в локальной БД
        Optional<User> existingUser = userRepository.findByUsername(adUser.get("username"));
        User user;

        if (existingUser.isPresent()) {
            // Обновляем данные из AD при каждом входе
            user = existingUser.get();
            user.setFullName(adUser.get("fullName"));
            user.setEmail(adUser.get("email"));
            user.setDepartment(adUser.get("department"));
            user.setTitle(adUser.get("title"));
            userRepository.save(user);
            log.info("Пользователь {} обновлён из AD", username);
        } else {
            // Первый вход — создаём профиль автоматически
            user = User.builder()
                    .username(adUser.get("username"))
                    .fullName(adUser.get("fullName"))
                    .email(adUser.get("email"))
                    .department(adUser.get("department"))
                    .title(adUser.get("title"))
                    .password("") // пароль не хранится, auth через AD
                    .build();
            userRepository.save(user);
            log.info("Пользователь {} создан из AD (первый вход)", username);
        }

        // 3. Генерируем JWT
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null, new ArrayList<>()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        LoginResponseDTO loginResponseDTO = LoginResponseDTO.builder()
                .token(jwt)
                .isAuthenticated(true)
                .build();

        log.info("Пользователь {} успешно вошёл через AD", username);

        return new ResponseEntity<>(loginResponseDTO, HttpStatus.ACCEPTED);
    }
}
