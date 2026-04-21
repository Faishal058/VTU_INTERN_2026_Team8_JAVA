package com.wealthwise.service;

import com.wealthwise.model.FinancialGoal;
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

    private static final int MC_SIMULATIONS = 5000;

    /**
     * Deterministic projection: FV of corpus + FV of SIP stream.
     * Returns map with projectedValue, gap, requiredSip, onTrack.
     */
    public Map<String, Object> project(FinancialGoal goal) {
        long months = ChronoUnit.MONTHS.between(LocalDate.now(), goal.getTargetDate());
        if (months <= 0) return Map.of("projectedValue", BigDecimal.ZERO, "gap", goal.getTargetAmount(), "onTrack", false);

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

        return Map.of(
            "projectedValue",  bd(projected),
            "gap",             bd(gap),
            "onTrack",         gap <= 0,
            "requiredSip",     bd(sip + Math.max(0, requiredSip)),
            "monthsRemaining", (long) n,
            "fvCorpus",        bd(fvCorpus),
            "fvSip",           bd(fvSip)
        );
    }

    /**
     * Monte Carlo: 5000 simulations using normal distribution of monthly returns.
     * Expected monthly return derived from annual rate. SD estimated from category.
     */
    public Map<String, Object> monteCarlo(FinancialGoal goal) {
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

        return Map.of(
            "probability",  Math.round(probability * 10.0) / 10.0,
            "p5",           bd(outcomes[(int)(MC_SIMULATIONS * 0.05)]),
            "p50",          bd(outcomes[(int)(MC_SIMULATIONS * 0.50)]),
            "p95",          bd(outcomes[(int)(MC_SIMULATIONS * 0.95)]),
            "simulations",  MC_SIMULATIONS
        );
    }

    private BigDecimal bd(double v) {
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP);
    }
}
