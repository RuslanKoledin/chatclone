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
public class Attachment {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    private String fileName;      // Оригинальное имя файла
    private String storedName;    // Имя файла в хранилище
    private String contentType;   // MIME тип (image/jpeg, application/pdf и т.д.)
    private Long fileSize;        // Размер в байтах

    @ManyToOne
    @JoinColumn(name = "message_id")
    private Message message;
}
