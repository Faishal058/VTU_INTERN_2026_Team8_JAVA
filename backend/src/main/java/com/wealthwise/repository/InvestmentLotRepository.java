package com.wealthwise.repository;

import com.wealthwise.model.InvestmentLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface InvestmentLotRepository extends JpaRepository<InvestmentLot, UUID> {

    // FIFO: oldest lots first for redemption
    @Query("SELECT l FROM InvestmentLot l WHERE l.userId = :uid AND l.schemeCode = :code AND l.isFullyRedeemed = false ORDER BY l.purchaseDate ASC")
    List<InvestmentLot> findActiveLotsFifo(@Param("uid") UUID userId, @Param("code") String schemeCode);

    // All lots for a user
    @Query("SELECT l FROM InvestmentLot l WHERE l.userId = :uid AND l.isFullyRedeemed = false ORDER BY l.schemeCode, l.purchaseDate")
    List<InvestmentLot> findAllActiveLots(@Param("uid") UUID userId);

    // Holdings summary per scheme
    @Query("SELECT l.schemeCode, l.fundName, SUM(l.unitsRemaining), SUM(l.unitsRemaining * l.costPerUnit) " +
           "FROM InvestmentLot l WHERE l.userId = :uid AND l.isFullyRedeemed = false GROUP BY l.schemeCode, l.fundName")
    List<Object[]> findHoldingsSummary(@Param("uid") UUID userId);

    // Delete all lots for a specific user + fund (used by "remove holding" feature)
    @Transactional
    void deleteByUserIdAndSchemeCode(UUID userId, String schemeCode);
}
