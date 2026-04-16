package com.wealthwise.repository;

import com.wealthwise.model.NotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, UUID> {
    Optional<NotificationPreferences> findByUserId(UUID userId);
}
