package com.wealthwise.service;

import com.wealthwise.model.FinancialGoal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

/**
 * M16 — Goal Projection Engine.
 * Deterministic projection + Monte Carlo simulation.
 */
@Service
public class GoalProjectionService {

    private static final Logger log = LoggerFactory.getLogger(GoalProjectionService.class);
    private static final int MC_SIMULATIONS = 5000;

    /**
     * Deterministic projection: FV of corpus + FV of SIP stream.
     * Returns map with projectedValue, gap, requiredSip, onTrack.
     */
    public Map<String, Object> project(FinancialGoal goal) {
        long t0 = System.currentTimeMillis();
        log.info("[Goals] ▶ Deterministic projection  goal='{}' target=₹{} targetDate={}",
            goal.getName(), goal.getTargetAmount(), goal.getTargetDate());
        long months = goal.getTargetDate() != null
            ? ChronoUnit.MONTHS.between(LocalDate.now(), goal.getTargetDate())
            : 240L; // default 20 years if no date set
        if (months <= 0) {
            // Past-due: return zeroed projection WITH monthsRemaining=0 so frontend knows
            Map<String, Object> pastDue = new java.util.LinkedHashMap<>();
            pastDue.put("projectedValue",  BigDecimal.ZERO);
            pastDue.put("gap",             goal.getTargetAmount() != null ? goal.getTargetAmount() : BigDecimal.ZERO);
            pastDue.put("onTrack",         false);
            pastDue.put("monthsRemaining", 0L);
            pastDue.put("fvCorpus",        BigDecimal.ZERO);
            pastDue.put("fvSip",           BigDecimal.ZERO);
            pastDue.put("requiredSip",     goal.getTargetAmount() != null ? goal.getTargetAmount() : BigDecimal.ZERO);
            return pastDue;
        }

        double r = (goal.getExpectedReturn() != null ? goal.getExpectedReturn().doubleValue() : 12.0) / 100.0;
        double monthlyR = r / 12.0;
        double n = months;

        double corpus = goal.getCurrentCorpus() != null ? goal.getCurrentCorpus().doubleValue() : 0;
        double sip = goal.getMonthlyNeed() != null ? goal.getMonthlyNeed().doubleValue() : 0;
        double target = goal.getTargetAmount().doubleValue();

        // FV of current corpus
        double fvCorpus = corpus * Math.pow(1 + monthlyR, n);

        // FV of SIP stream (annuity due)
        double fvSip = monthlyR > 0
            ? sip * ((Math.pow(1 + monthlyR, n) - 1) / monthlyR) * (1 + monthlyR)
            : sip * n;

        double projected = fvCorpus + fvSip;
        double gap = target - projected;

        // Required SIP to close gap
        double requiredSip = 0;
        if (gap > 0 && monthlyR > 0) {
            requiredSip = gap / (((Math.pow(1 + monthlyR, n) - 1) / monthlyR) * (1 + monthlyR));
        }

        // Capture values for logging before building return map
        BigDecimal projectedBd   = bd(projected);
        BigDecimal gapBd         = bd(gap);
        boolean    onTrack       = gap <= 0;
        BigDecimal requiredSipBd = bd(sip + Math.max(0, requiredSip));
        long       monthsRem     = (long) n;
        BigDecimal fvCorpusBd    = bd(fvCorpus);
        BigDecimal fvSipBd       = bd(fvSip);

        log.info("[Goals] ✔ Projection done in {}ms  projected=₹{} gap=₹{} onTrack={}",
            System.currentTimeMillis() - t0, projectedBd, gapBd, onTrack);

        return Map.of(
            "projectedValue",  projectedBd,
            "gap",             gapBd,
            "onTrack",         onTrack,
            "requiredSip",     requiredSipBd,
            "monthsRemaining", monthsRem,
            "fvCorpus",        fvCorpusBd,
            "fvSip",           fvSipBd
        );
    }

    /**
     * Monte Carlo: 5000 simulations using normal distribution of monthly returns.
     * Expected monthly return derived from annual rate. SD estimated from category.
     */
    public Map<String, Object> monteCarlo(FinancialGoal goal) {
        long t0 = System.currentTimeMillis();
        log.info("[Goals] ▶ Monte Carlo simulation  goal='{}' simulations={}",
            goal.getName(), MC_SIMULATIONS);
        long months = ChronoUnit.MONTHS.between(LocalDate.now(), goal.getTargetDate());
        if (months <= 0) return Map.of("probability", 0.0, "p50", 0.0, "p5", 0.0, "p95", 0.0);

        double annualReturn = (goal.getExpectedReturn() != null ? goal.getExpectedReturn().doubleValue() : 12.0) / 100.0;
        double monthlyMean  = annualReturn / 12.0;
        double monthlySd    = 0.045; // ~15% annual SD for equity, adjust per risk profile

        double corpus = goal.getCurrentCorpus() != null ? goal.getCurrentCorpus().doubleValue() : 0;
        double sip = goal.getMonthlyNeed() != null ? goal.getMonthlyNeed().doubleValue() : 0;
        double target = goal.getTargetAmount().doubleValue();

        Random rng = ThreadLocalRandom.current();
        double[] outcomes = new double[MC_SIMULATIONS];

        for (int i = 0; i < MC_SIMULATIONS; i++) {
            double value = corpus;
            for (int m = 0; m < months; m++) {
                double ret = monthlyMean + monthlySd * rng.nextGaussian();
                value = value * (1 + ret) + sip;
            }
            outcomes[i] = value;
        }

        java.util.Arrays.sort(outcomes);
        long success = java.util.Arrays.stream(outcomes).filter(v -> v >= target).count();
        double probability = (double) success / MC_SIMULATIONS * 100;

        // Capture values for logging before building return map
        double      prob = Math.round(probability * 10.0) / 10.0;
        BigDecimal  p5   = bd(outcomes[(int)(MC_SIMULATIONS * 0.05)]);
        BigDecimal  p50  = bd(outcomes[(int)(MC_SIMULATIONS * 0.50)]);
        BigDecimal  p95  = bd(outcomes[(int)(MC_SIMULATIONS * 0.95)]);
        int         sims = MC_SIMULATIONS;

        log.info("[Goals] ✔ Monte Carlo done in {}ms  probability={}% p50=₹{}",
            System.currentTimeMillis() - t0, prob, p50);

        return Map.of(
            "probability",  prob,
            "p5",           p5,
            "p50",          p50,
            "p95",          p95,
            "simulations",  sims
        );
    }

    private BigDecimal bd(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }
}
