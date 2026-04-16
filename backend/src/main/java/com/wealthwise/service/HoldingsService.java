package com.wealthwise.service;

import com.wealthwise.model.InvestmentLot;
import com.wealthwise.model.NavDaily;
import com.wealthwise.model.SchemeMaster;
import com.wealthwise.repository.InvestmentLotRepository;
import com.wealthwise.repository.NavDailyRepository;
import com.wealthwise.repository.SchemeMasterRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * M08 — Holdings Calculator.
 * Computes current holdings by aggregating active (non-redeemed) lots
 * and valuing them at the latest available NAV.
 */
@Service
public class HoldingsService {

    private final InvestmentLotRepository lotRepo;
    private final NavDailyRepository navRepo;
    private final SchemeMasterRepository schemeRepo;

    public HoldingsService(InvestmentLotRepository lotRepo, NavDailyRepository navRepo,
                            SchemeMasterRepository schemeRepo) {
        this.lotRepo = lotRepo;
        this.navRepo = navRepo;
        this.schemeRepo = schemeRepo;
    }

    public record Holding(
        String schemeCode,
        String fundName,
        String amcName,
        String category,
        String planType,
        int riskLevel,
        BigDecimal totalUnits,
        BigDecimal avgCostNav,
        BigDecimal investedValue,
        BigDecimal currentNav,
        LocalDate navDate,
        BigDecimal currentValue,
        BigDecimal gainLoss,
        Double gainLossPct,
        List<InvestmentLot> lots
    ) {}

    public List<Holding> getHoldings(UUID userId) {
        // Aggregate lots per scheme
        Map<String, List<InvestmentLot>> byScheme = new LinkedHashMap<>();
        lotRepo.findAllActiveLots(userId).forEach(lot ->
            byScheme.computeIfAbsent(lot.getSchemeCode(), k -> new ArrayList<>()).add(lot));

        List<Holding> holdings = new ArrayList<>();
        for (var entry : byScheme.entrySet()) {
            String code = entry.getKey();
            List<InvestmentLot> lots = entry.getValue();

            BigDecimal totalUnits = lots.stream()
                .map(InvestmentLot::getUnitsRemaining)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalUnits.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal investedValue = lots.stream()
                .map(l -> l.getUnitsRemaining().multiply(l.getCostPerUnit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal avgCostNav = investedValue.divide(totalUnits, 6, RoundingMode.HALF_UP);

            // Get latest NAV
            BigDecimal currentNav = BigDecimal.ZERO;
            LocalDate navDate = null;
            List<NavDaily> navs = navRepo.findLatestBySchemeCode(code, PageRequest.of(0, 1));
            if (!navs.isEmpty()) {
                currentNav = navs.get(0).getNavValue();
                navDate = navs.get(0).getNavDate();
            } else {
                // fallback to scheme_master last_nav
                schemeRepo.findByAmfiCode(code).ifPresent(s -> {});
            }

            BigDecimal currentValue = totalUnits.multiply(currentNav);
            BigDecimal gainLoss = currentValue.subtract(investedValue);
            Double gainLossPct = investedValue.compareTo(BigDecimal.ZERO) > 0
                ? gainLoss.divide(investedValue, 8, RoundingMode.HALF_UP).doubleValue() * 100
                : 0.0;

            // Fund metadata
            String fundName = lots.get(0).getFundName() != null ? lots.get(0).getFundName() : code;
            String amcName = null, category = null, planType = null;
            int riskLevel = 3;
            Optional<SchemeMaster> sm = schemeRepo.findByAmfiCode(code);
            if (sm.isPresent()) {
                amcName = sm.get().getAmcName();
                category = sm.get().getCategory();
                planType = sm.get().getPlanType();
                if (sm.get().getRiskLevel() != null) riskLevel = sm.get().getRiskLevel();
                if (currentNav.compareTo(BigDecimal.ZERO) == 0 && sm.get().getLastNav() != null) {
                    currentNav = sm.get().getLastNav();
                }
            }

            holdings.add(new Holding(code, fundName, amcName, category, planType, riskLevel,
                totalUnits, avgCostNav, investedValue, currentNav, navDate,
                currentValue, gainLoss, gainLossPct, lots));
        }
        return holdings;
    }

    public BigDecimal getTotalPortfolioValue(UUID userId) {
        return getHoldings(userId).stream()
            .map(Holding::currentValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getTotalInvestedValue(UUID userId) {
        return getHoldings(userId).stream()
            .map(Holding::investedValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
