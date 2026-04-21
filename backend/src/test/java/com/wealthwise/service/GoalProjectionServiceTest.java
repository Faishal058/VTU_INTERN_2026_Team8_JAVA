package com.wealthwise.service;

import com.wealthwise.model.FinancialGoal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * Pure unit tests for GoalProjectionService.
 * Validates the deterministic projection math and Monte Carlo simulation.
 * No Spring context required.
 */
@DisplayName("GoalProjectionService — Unit Tests")
class GoalProjectionServiceTest {

    private GoalProjectionService projectionService;

    @BeforeEach
    void setUp() {
        projectionService = new GoalProjectionService();
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private FinancialGoal buildGoal(BigDecimal target, BigDecimal corpus,
                                    BigDecimal sip, BigDecimal rate, int yearsFromNow) {
        FinancialGoal goal = new FinancialGoal();
        goal.setName("Test Goal");
        goal.setTargetAmount(target);
        goal.setCurrentCorpus(corpus);
        goal.setMonthlyNeed(sip);
        goal.setExpectedReturn(rate);
        goal.setTargetDate(LocalDate.now().plusYears(yearsFromNow));
        return goal;
    }

    // ── project() — deterministic ────────────────────────────────────────────

    @Test
    @DisplayName("project() — past-due goal returns zeroed projection")
    void project_pastDueGoal_returnsZeroed() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(500_000), BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.valueOf(12), 0);
        // Force past date
        goal.setTargetDate(LocalDate.now().minusYears(1));

        Map<String, Object> result = projectionService.project(goal);

        assertThat(result).containsKey("projectedValue");
        assertThat(result.get("onTrack")).isEqualTo(false);
        assertThat(result.get("monthsRemaining")).isEqualTo(0L);
    }

    @Test
    @DisplayName("project() — on-track goal returns onTrack=true when projected >= target")
    void project_onTrack_whenProjectedExceedsTarget() {
        // ₹10 Lakh corpus growing at 12% for 10 years, no SIP needed to exceed ₹2L target
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(200_000),   // target ₹2L
                BigDecimal.valueOf(1_000_000), // corpus ₹10L
                BigDecimal.ZERO,
                BigDecimal.valueOf(12),
                10
        );

        Map<String, Object> result = projectionService.project(goal);

        assertThat(result.get("onTrack")).isEqualTo(true);
        double projected = ((BigDecimal) result.get("projectedValue")).doubleValue();
        assertThat(projected).isGreaterThan(200_000);
    }

    @Test
    @DisplayName("project() — no corpus or SIP results in gap equal to target")
    void project_noCorpusNoSip_gapEqualsTarget() {
        BigDecimal target = BigDecimal.valueOf(1_000_000);
        FinancialGoal goal = buildGoal(target, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.valueOf(12), 10);

        Map<String, Object> result = projectionService.project(goal);

        assertThat(result.get("onTrack")).isEqualTo(false);
        double gap = ((BigDecimal) result.get("gap")).doubleValue();
        // Without corpus or SIP the full target is the gap
        assertThat(gap).isCloseTo(1_000_000.0, within(1.0));
    }

    @Test
    @DisplayName("project() — result map contains all required keys")
    void project_resultContainsAllRequiredKeys() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(1_000_000), BigDecimal.valueOf(100_000),
                BigDecimal.valueOf(5_000), BigDecimal.valueOf(12), 5);

        Map<String, Object> result = projectionService.project(goal);

        assertThat(result).containsKeys(
                "projectedValue", "gap", "onTrack",
                "requiredSip", "monthsRemaining", "fvCorpus", "fvSip"
        );
    }

    @Test
    @DisplayName("project() — monthsRemaining is positive for future goal")
    void project_futureGoal_positiveMonthsRemaining() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(500_000), BigDecimal.ZERO,
                BigDecimal.valueOf(5_000), BigDecimal.valueOf(12), 5);

        Map<String, Object> result = projectionService.project(goal);

        long months = (long) result.get("monthsRemaining");
        assertThat(months).isGreaterThan(0);
    }

    @Test
    @DisplayName("project() — fvCorpus is zero when corpus is zero")
    void project_zeroCorpus_fvCorpusIsZero() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(1_000_000), BigDecimal.ZERO,
                BigDecimal.valueOf(10_000), BigDecimal.valueOf(12), 5);

        Map<String, Object> result = projectionService.project(goal);

        double fvCorpus = ((BigDecimal) result.get("fvCorpus")).doubleValue();
        assertThat(fvCorpus).isCloseTo(0.0, within(0.01));
    }

    @Test
    @DisplayName("project() — defaults to 12% return when expectedReturn is null")
    void project_nullExpectedReturn_defaultsTo12Pct() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(1_000_000), BigDecimal.valueOf(100_000),
                BigDecimal.ZERO, null, 10);

        // Should not throw; projection completes with 12% default
        assertThatCode(() -> projectionService.project(goal)).doesNotThrowAnyException();
    }

    // ── monteCarlo() ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("monteCarlo() — past-due goal returns 0% probability")
    void monteCarlo_pastDueGoal_zeroProb() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(1_000_000), BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.valueOf(12), 0);
        goal.setTargetDate(LocalDate.now().minusDays(1));

        Map<String, Object> result = projectionService.monteCarlo(goal);

        assertThat(result.get("probability")).isEqualTo(0.0);
    }

    @Test
    @DisplayName("monteCarlo() — returns all required keys")
    void monteCarlo_resultContainsAllKeys() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(1_000_000), BigDecimal.valueOf(200_000),
                BigDecimal.valueOf(10_000), BigDecimal.valueOf(12), 10);

        Map<String, Object> result = projectionService.monteCarlo(goal);

        assertThat(result).containsKeys("probability", "p5", "p50", "p95");
    }

    @Test
    @DisplayName("monteCarlo() — probability is between 0 and 100")
    void monteCarlo_probabilityIsInValidRange() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(1_000_000), BigDecimal.valueOf(50_000),
                BigDecimal.valueOf(5_000), BigDecimal.valueOf(12), 10);

        Map<String, Object> result = projectionService.monteCarlo(goal);

        double prob = (double) result.get("probability");
        assertThat(prob).isBetween(0.0, 100.0);
    }

    @Test
    @DisplayName("monteCarlo() — p5 <= p50 <= p95 (percentile ordering)")
    void monteCarlo_percentilesAreOrdered() {
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(2_000_000), BigDecimal.valueOf(100_000),
                BigDecimal.valueOf(10_000), BigDecimal.valueOf(12), 10);

        Map<String, Object> result = projectionService.monteCarlo(goal);

        double p5  = ((BigDecimal) result.get("p5")).doubleValue();
        double p50 = ((BigDecimal) result.get("p50")).doubleValue();
        double p95 = ((BigDecimal) result.get("p95")).doubleValue();

        assertThat(p5).isLessThanOrEqualTo(p50);
        assertThat(p50).isLessThanOrEqualTo(p95);
    }

    @Test
    @DisplayName("monteCarlo() — very well-funded goal has high probability")
    void monteCarlo_wellFundedGoal_highProbability() {
        // Corpus is 20x the target → should almost certainly succeed
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(100_000),    // target ₹1L
                BigDecimal.valueOf(2_000_000),  // corpus ₹20L
                BigDecimal.ZERO,
                BigDecimal.valueOf(10), 5);

        Map<String, Object> result = projectionService.monteCarlo(goal);

        double prob = (double) result.get("probability");
        assertThat(prob).isGreaterThan(90.0);
    }

    @Test
    @DisplayName("monteCarlo() — unreachable goal has low probability")
    void monteCarlo_unreachableGoal_lowProbability() {
        // Target ₹100 Cr with ₹0 corpus, ₹100/month, 1 year
        FinancialGoal goal = buildGoal(
                BigDecimal.valueOf(1_000_000_000), // ₹100 Cr
                BigDecimal.ZERO,
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(12), 1);

        Map<String, Object> result = projectionService.monteCarlo(goal);

        double prob = (double) result.get("probability");
        assertThat(prob).isLessThan(1.0);
    }
}
