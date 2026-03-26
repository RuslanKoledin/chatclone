package com.chat.app.repository;

import com.chat.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM APP_USER u WHERE u.fullName LIKE %:fullName%")
    List<User> findByFullName(@Param("fullName") String fullName);

    @Query("SELECT u FROM APP_USER u WHERE u.fullName LIKE %:query% OR u.username LIKE %:query%")
    List<User> findByFullNameOrUsername(@Param("query") String query);

}
