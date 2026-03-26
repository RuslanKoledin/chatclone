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
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    private String content;
    private LocalDateTime timeStamp;

    @ManyToOne
    private User user;

    @ManyToOne
    private Chat chat;

    @ElementCollection
    private Set<UUID> readBy = new HashSet<>();

    // Кому доставлено (WebSocket-соединение активно, но чат не открыт)
    @ElementCollection
    private Set<UUID> deliveredTo = new HashSet<>();

    // Время редактирования (null если не редактировалось)
    private LocalDateTime editedAt;

    // Флаг удаления (soft delete)
    private Boolean isDeleted = false;

    // Для кого удалено (если удалено "только у меня")
    @ElementCollection
    private Set<UUID> deletedFor = new HashSet<>();

    // Цитируемое (Reply) сообщение
    @ManyToOne
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;

    // Пересланное сообщение - имя оригинального автора
    private String forwardedFromName;

    // Прикреплённые файлы
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Attachment> attachments = new HashSet<>();

    // Реакции на сообщение
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Reaction> reactions = new HashSet<>();

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (!(obj instanceof Message)) {
            return false;
        }
        Message other = (Message) obj;
        return Objects.equals(content, other.content)
                && Objects.equals(timeStamp, other.timeStamp)
                && Objects.equals(user, other.user)
                && Objects.equals(chat, other.chat);
    }

    @Override
    public int hashCode() {
        return Objects.hash(content, timeStamp, user, chat);
    }

    @Override
    public String toString() {
        return "Message{" +
                "id=" + id +
                ", content='" + content + '\'' +
                ", timeStamp=" + timeStamp +
                '}';
    }

}
