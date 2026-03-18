package com.nicolas.chatapp.repository;

import com.nicolas.chatapp.model.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    Optional<Attachment> findByStoredName(String storedName);
}




