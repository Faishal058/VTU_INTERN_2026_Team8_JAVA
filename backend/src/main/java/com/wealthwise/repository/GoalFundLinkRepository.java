package com.wealthwise.repository;

import com.wealthwise.model.GoalFundLink;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface GoalFundLinkRepository extends JpaRepository<GoalFundLink, UUID> {
    List<GoalFundLink> findByGoalId(UUID goalId);
    List<GoalFundLink> findByUserId(UUID userId);
    void deleteByGoalIdAndSchemeCode(UUID goalId, String schemeCode);
}
