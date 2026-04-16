package com.wealthwise.repository;

import com.wealthwise.model.FinancialGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FinancialGoalRepository extends JpaRepository<FinancialGoal, UUID> {
    List<FinancialGoal> findByUserId(UUID userId);
    List<FinancialGoal> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<FinancialGoal> findByUserIdAndStatusOrderByTargetDateAsc(UUID userId, String status);
}
