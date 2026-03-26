package com.chat.app.repository;

import com.chat.app.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByChat_Id(UUID chatId);

    // Пагинация: последние N сообщений (по timeStamp desc), затем реверсим на клиенте
    @Query("SELECT m FROM Message m WHERE m.chat.id = :chatId ORDER BY m.timeStamp DESC")
    List<Message> findByChat_IdPaginated(@Param("chatId") UUID chatId, Pageable pageable);

    // Количество сообщений в чате
    long countByChat_Id(UUID chatId);

    // Поиск сообщений по содержимому (без учёта регистра)
    List<Message> findByChat_IdAndContentContainingIgnoreCase(UUID chatId, String content);

}
