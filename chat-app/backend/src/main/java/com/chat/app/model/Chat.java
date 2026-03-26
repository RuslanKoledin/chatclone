package com.chat.app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.*;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Chat {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    private String chatName;
    private Boolean isGroup;

    @ManyToMany
    private Set<User> admins = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    private Set<User> users = new HashSet<>();

    @ManyToOne
    private User createdBy;

    @OneToMany(cascade = CascadeType.ALL)
    private List<Message> messages = new ArrayList<>();

    // Закреплённое сообщение (одно на чат)
    @ManyToOne
    @JoinColumn(name = "pinned_message_id")
    private Message pinnedMessage;

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (!(obj instanceof Chat)) {
            return false;
        }
        Chat other = (Chat) obj;
        return Objects.equals(chatName, other.chatName)
                && Objects.equals(isGroup, other.isGroup)
                && Objects.equals(admins, other.admins)
                && Objects.equals(users, other.users)
                && Objects.equals(createdBy, other.createdBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(chatName, isGroup, admins, users, createdBy);
    }

    @Override
    public String toString() {
        return "Chat{" +
                "id=" + id +
                ", chatName='" + chatName + '\'' +
                ", isGroup=" + isGroup +
                '}';
    }

}
