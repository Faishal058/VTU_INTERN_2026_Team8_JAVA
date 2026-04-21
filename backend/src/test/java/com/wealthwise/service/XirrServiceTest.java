package com.wealthwise.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Pure unit tests for XirrService — no Spring context needed.
 * Tests verify the Newton-Raphson / bisection XIRR numerics,
 * absolute return, and CAGR calculations.
 */
@DisplayName("XirrService — Unit Tests")
class XirrServiceTest {

    private XirrService xirrService;

    @BeforeEach
    void setUp() {
        xirrService = new XirrService();
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private XirrService.CashFlow cf(LocalDate date, double amount) {
        return new XirrService.CashFlow(date, amount);
    }

    // ── calculateXirr ───────────────────────────────────────────────────────

    @Test
    @DisplayName("calculateXirr — null list returns null")
    void calculateXirr_nullList_returnsNull() {
        assertThat(xirrService.calculateXirr(null)).isNull();
    }

    @Test
    @DisplayName("calculateXirr — single cash flow returns null (need at least 2)")
    void calculateXirr_singleFlow_returnsNull() {
        List<XirrService.CashFlow> flows = List.of(cf(LocalDate.now(), -1000));
        assertThat(xirrService.calculateXirr(flows)).isNull();
    }

    @Test
    @DisplayName("calculateXirr — all outflows (no positive) returns null")
    void calculateXirr_allNegative_returnsNull() {
        List<XirrService.CashFlow> flows = List.of(
                cf(LocalDate.now().minusDays(365), -1000),
                cf(LocalDate.now(), -500)
        );
        assertThat(xirrService.calculateXirr(flows)).isNull();
    }

    @Test
    @DisplayName("calculateXirr — all inflows (no negative) returns null")
    void calculateXirr_allPositive_returnsNull() {
        List<XirrService.CashFlow> flows = List.of(
                cf(LocalDate.now().minusDays(365), 1000),
                cf(LocalDate.now(), 1200)
        );
        assertThat(xirrService.calculateXirr(flows)).isNull();
    }

    @Test
    @DisplayName("calculateXirr — same-day buy/sell returns null (totalDays == 0)")
    void calculateXirr_sameDayFlows_returnsNull() {
        LocalDate today = LocalDate.now();
        List<XirrService.CashFlow> flows = List.of(
                cf(today, -1000),
                cf(today, 1000)
        );
        assertThat(xirrService.calculateXirr(flows)).isNull();
    }

    @Test
    @DisplayName("calculateXirr — lumpsum with ~10% annual return is approx 0.10")
    void calculateXirr_lumpsum10Pct_returnsApproximately10Pct() {
        LocalDate start = LocalDate.now().minusDays(365);
        LocalDate end   = LocalDate.now();

        // Invest 10,000 and receive 11,000 after 1 year → ~10% XIRR
        List<XirrService.CashFlow> flows = List.of(
                cf(start, -10_000),
                cf(end,    11_000)
        );
        Double result = xirrService.calculateXirr(flows);

        assertThat(result).isNotNull();
        assertThat(result).isBetween(0.09, 0.11);
    }

    @Test
    @DisplayName("calculateXirr — monthly SIPs converging to reasonable rate")
    void calculateXirr_monthlySips_returnsPositiveRate() {
        LocalDate base = LocalDate.now().minusDays(365);
        double monthlySip = 5_000;
        double totalInvested = 12 * monthlySip;
        double currentValue  = totalInvested * 1.12; // ~12% returns

        // 12 monthly SIP outflows
        List<XirrService.CashFlow> flows = new java.util.ArrayList<>();
        for (int i = 0; i < 12; i++) {
            flows.add(cf(base.plusMonths(i), -monthlySip));
        }
        // One inflow today (current NAV)
        flows.add(cf(LocalDate.now(), currentValue));

        Double result = xirrService.calculateXirr(flows);

        assertThat(result).isNotNull();
        assertThat(result).isGreaterThan(0.05); // at least 5% annualised
    }

    @Test
    @DisplayName("calculateXirr — result is clamped to [-0.99, 5.0]")
    void calculateXirr_resultClamping() {
        // Extremely high gain that might exceed 500%
        LocalDate start = LocalDate.now().minusDays(365);
        List<XirrService.CashFlow> flows = List.of(
                cf(start, -1),
                cf(LocalDate.now(), 1_000_000)
        );
        Double result = xirrService.calculateXirr(flows);

        if (result != null) {
            assertThat(result).isLessThanOrEqualTo(5.0);
            assertThat(result).isGreaterThanOrEqualTo(-0.99);
        }
    }

    // ── absoluteReturn ──────────────────────────────────────────────────────

    @Test
    @DisplayName("absoluteReturn — correct formula: (current-invested)/invested")
    void absoluteReturn_correctFormula() {
        Double result = xirrService.absoluteReturn(
                BigDecimal.valueOf(10_000),
                BigDecimal.valueOf(12_500)
        );
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(0.25); // 25% return
    }

    @Test
    @DisplayName("absoluteReturn — zero invested returns null")
    void absoluteReturn_zeroInvested_returnsNull() {
        assertThat(xirrService.absoluteReturn(BigDecimal.ZERO, BigDecimal.valueOf(1000)))
                .isNull();
    }

    @Test
    @DisplayName("absoluteReturn — null invested returns null")
    void absoluteReturn_nullInvested_returnsNull() {
        assertThat(xirrService.absoluteReturn(null, BigDecimal.valueOf(1000)))
                .isNull();
    }

    @Test
    @DisplayName("absoluteReturn — loss yields negative return")
    void absoluteReturn_loss_returnsNegative() {
        Double result = xirrService.absoluteReturn(
                BigDecimal.valueOf(10_000),
                BigDecimal.valueOf(8_000)
        );
        assertThat(result).isNotNull().isNegative();
        assertThat(result).isBetween(-0.21, -0.19); // −20%
    }

    // ── CAGR ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("cagr — 2x return over 365*3 days → approx 26% annualised")
    void cagr_doubling_threeYears() {
        // 10,000 → 20,000 over ~3 years (1095 days)
        Double result = xirrService.cagr(
                BigDecimal.valueOf(10_000),
                BigDecimal.valueOf(20_000),
                1095L
        );
        assertThat(result).isNotNull();
        assertThat(result).isBetween(0.24, 0.28);
    }

    @Test
    @DisplayName("cagr — period shorter than 30 days returns null")
    void cagr_shortPeriod_returnsNull() {
        assertThat(xirrService.cagr(
                BigDecimal.valueOf(1000),
                BigDecimal.valueOf(1100),
                20L
        )).isNull();
    }

    @Test
    @DisplayName("cagr — null initial returns null")
    void cagr_nullInitial_returnsNull() {
        assertThat(xirrService.cagr(null, BigDecimal.valueOf(5000), 365L)).isNull();
    }

    @Test
    @DisplayName("cagr — zero initial returns null")
    void cagr_zeroInitial_returnsNull() {
        assertThat(xirrService.cagr(BigDecimal.ZERO, BigDecimal.valueOf(5000), 365L)).isNull();
    }
}
