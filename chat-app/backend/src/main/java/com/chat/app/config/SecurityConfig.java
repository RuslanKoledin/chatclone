package com.chat.app.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] WHITE_LIST_URL = {"/auth/**", "/ws/**"};

    private final JwtAuthorizationFilter jwtAuthorizationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.sessionManagement(management -> management.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(request -> {
                    request.requestMatchers(WHITE_LIST_URL).permitAll();
                    request.anyRequest().authenticated();
                })
                .addFilterBefore(jwtAuthorizationFilter, BasicAuthenticationFilter.class)
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration cfg = new CorsConfiguration();
                    // Разрешённые origins: localhost для разработки + серверный из env
                    String serverOrigin = System.getenv("MCHAT_FRONTEND_URL");
                    if (serverOrigin != null) {
                        cfg.setAllowedOrigins(List.of("http://localhost:3000", serverOrigin));
                    } else {
                        cfg.setAllowedOrigins(List.of("http://localhost:3000"));
                    }
                    cfg.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    cfg.setAllowCredentials(true);
                    cfg.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
                    cfg.setExposedHeaders(List.of(JwtConstants.TOKEN_HEADER));
                    cfg.setMaxAge(3600L);
                    return cfg;
                }))
                .csrf(AbstractHttpConfigurer::disable)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
