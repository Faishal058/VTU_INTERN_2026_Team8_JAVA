package com.wealthwise.repository;

import com.wealthwise.model.UserAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserAlertRepository extends JpaRepository<UserAlert, UUID> {
    List<UserAlert> findByUserIdOrderByIsReadAscCreatedAtDesc(UUID userId);
    long countByUserIdAndIsReadFalse(UUID userId);
    List<UserAlert> findBySourceTypeAndSourceId(String sourceType, UUID sourceId);
}
