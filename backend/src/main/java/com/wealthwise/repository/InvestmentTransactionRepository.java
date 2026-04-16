package com.wealthwise.repository;

import com.wealthwise.model.InvestmentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface InvestmentTransactionRepository extends JpaRepository<InvestmentTransaction, UUID> {
    List<InvestmentTransaction> findByUserIdOrderByTransactionDateDesc(UUID userId);
    List<InvestmentTransaction> findByUserIdOrderByTransactionDateAsc(UUID userId);

    @Transactional
    void deleteByUserIdAndSchemeCode(UUID userId, String schemeCode);
}
