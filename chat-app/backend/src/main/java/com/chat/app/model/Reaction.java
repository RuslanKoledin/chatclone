package com.chat.app.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reaction {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    // Эмодзи реакции (например, "👍", "❤️", "🔥")
    private String emoji;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "message_id")
    private Message message;

}
