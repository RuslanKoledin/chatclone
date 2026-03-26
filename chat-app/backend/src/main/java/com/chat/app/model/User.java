package com.chat.app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "APP_USER")
public class User {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(unique = true)
    private String username;

    private String email;
    private String password;
    private String fullName;
    private String department;
    private String title;

    // Онлайн статус
    private LocalDateTime lastSeen;
    private Boolean isOnline = false;

    // Закреплённые чаты (ID чатов)
    @ElementCollection
    private Set<UUID> pinnedChatIds = new HashSet<>();

    // Чаты с отключенными уведомлениями (ID чатов)
    @ElementCollection
    private Set<UUID> mutedChatIds = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String profilePhoto;

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (!(obj instanceof User)) {
            return false;
        }
        User other = (User) obj;
        return Objects.equals(username, other.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(username);
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", password='" + password + '\'' +
                ", fullName='" + fullName + '\'' +
                '}';
    }

}
