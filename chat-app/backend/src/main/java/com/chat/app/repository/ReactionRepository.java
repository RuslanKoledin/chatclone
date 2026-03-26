package com.chat.app.repository;

import com.chat.app.model.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {

    Optional<Reaction> findByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);

    void deleteByMessageIdAndUserIdAndEmoji(UUID messageId, UUID userId, String emoji);

}
