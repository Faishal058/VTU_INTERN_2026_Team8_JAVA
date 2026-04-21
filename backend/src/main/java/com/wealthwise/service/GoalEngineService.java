package com.wealthwise.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GoalEngineService {

    // ════════════════════════════════════════════════════════════
    // Helper: Convert future nominal money → today's real money
    // ════════════════════════════════════════════════════════════
    private double toReal(double nominalFutureValue, double annualInflationRate, int months) {
        double monthlyInflation = annualInflationRate / 12;
        return nominalFutureValue / Math.pow(1 + monthlyInflation, months);
    }

    /** FV of an annuity-due. Safe when r == 0: returns sip * n. */
    private double fvAnnuity(double sip, double r, int n) {
        if (r == 0) return sip * n;
        return sip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    }

    // ════════════════════════════════════════════════════════════
    // Monte Carlo Simulation (10,000 runs)
    // All output normalised to today's money (real terms)
    // ════════════════════════════════════════════════════════════
    public MonteCarloResult runMonteCarlo(
            double initialPortfolio,
            double monthlyContribution,
            double monthlyMean,
            double monthlyStdDev,
            int months,
            double targetAmount,
            double annualInflationRate) {

        double monthlyInflation = annualInflationRate / 12;
        double inflationAdjustedTarget = targetAmount * Math.pow(1 + monthlyInflation, months);

        int simulations = 10_000;
        List<Double> finalValues = new ArrayList<>(simulations);
        Random random = new Random();

        for (int sim = 0; sim < simulations; sim++) {
            double portfolio = initialPortfolio;
            for (int month = 0; month < months; month++) {
                double r = monthlyMean + monthlyStdDev * random.nextGaussian();
                double floor = monthlyStdDev > 0.07 ? -0.30
                        : monthlyStdDev > 0.03 ? -0.20
                        : -0.10;
                r = Math.max(r, floor);
                portfolio = portfolio * (1 + r) + monthlyContribution;
                portfolio = Math.max(portfolio, 0);
            }
            finalValues.add(portfolio);
        }

        Collections.sort(finalValues);

        double p10Nominal = percentile(finalValues, 10);
        double p50Nominal = percentile(finalValues, 50);
        double p90Nominal = percentile(finalValues, 90);

        double p10Real = toReal(p10Nominal, annualInflationRate, months);
        double p50Real = toReal(p50Nominal, annualInflationRate, months);
        double p90Real = toReal(p90Nominal, annualInflationRate, months);

        long successCount = finalValues.stream()
                .filter(v -> v >= inflationAdjustedTarget)
                .count();
        double probability = (successCount * 100.0) / simulations;

        return new MonteCarloResult(
                Math.round(p10Real),
                Math.round(p50Real),
                Math.round(p90Real),
                Math.round(probability * 10.0) / 10.0
        );
    }

    // ════════════════════════════════════════════════════════════
    // Deterministic Projection
    // All output normalised to today's money (real terms)
    // ════════════════════════════════════════════════════════════
    public DeterministicResult runDeterministicProjection(
            double initialPortfolio,
            double monthlyContribution,
            double monthlyMean,
            int months,
            double targetAmount,
            double annualInflationRate) {

        double r = monthlyMean;
        int n = months;

        double fvCorpusNominal = initialPortfolio * Math.pow(1 + r, n);
        double fvSipNominal    = fvAnnuity(monthlyContribution, r, n);

        double fvCorpusReal = toReal(fvCorpusNominal, annualInflationRate, n);
        double fvSipReal    = toReal(fvSipNominal, annualInflationRate, n);
        double totalReal    = fvCorpusReal + fvSipReal;
        double gapReal      = targetAmount - totalReal;

        // Scenario A: Return is only 10% p.a.
        double lowerMean = 0.10 / 12;
        double projLowerNominal = initialPortfolio * Math.pow(1 + lowerMean, n)
                + monthlyContribution * ((Math.pow(1 + lowerMean, n) - 1) / lowerMean) * (1 + lowerMean);
        double projLowerReal = toReal(projLowerNominal, annualInflationRate, n);

        // Scenario B: Missed 6 SIPs
        int reducedN = Math.max(n - 6, 1);
        double fvSipMissedNominal = fvAnnuity(monthlyContribution, r, reducedN);
        double projMissedReal = toReal(fvCorpusNominal + fvSipMissedNominal, annualInflationRate, n);

        // Scenario C: Inflation 2% higher
        double highInflationRate = annualInflationRate + 0.02;
        double projHighInfReal = toReal(fvCorpusNominal + fvSipNominal, highInflationRate, n);

        List<SensitivityRow> sensitivity = List.of(
                new SensitivityRow("Return = 10% pa",
                        Math.round(projLowerReal), Math.round(targetAmount - projLowerReal)),
                new SensitivityRow("6 SIPs missed",
                        Math.round(projMissedReal), Math.round(targetAmount - projMissedReal)),
                new SensitivityRow("Inflation at " + Math.round(highInflationRate * 100) + "%",
                        Math.round(projHighInfReal), Math.round(targetAmount - projHighInfReal))
        );

        return new DeterministicResult(
                Math.round(fvCorpusReal),
                Math.round(fvSipReal),
                Math.round(totalReal),
                Math.round(gapReal),
                gapReal <= 0,
                sensitivity
        );
    }

    // ════════════════════════════════════════════════════════════
    // Required SIP Calculator
    // ════════════════════════════════════════════════════════════
    public RequiredSipResult runRequiredSipCalculator(
            double initialPortfolio,
            double monthlyContribution,
            double monthlyMean,
            int months,
            double targetAmount,
            double annualInflationRate) {

        double monthlyInflation = annualInflationRate / 12;
        double inflationAdjustedTarget = targetAmount * Math.pow(1 + monthlyInflation, months);

        double r = monthlyMean;
        int n = months;

        double sipNeeded = requiredSip(initialPortfolio, r, n, inflationAdjustedTarget);
        double sipGap = sipNeeded - monthlyContribution;

        double fvSipCurrent = fvAnnuity(monthlyContribution, r, n);
        double remainingNeedFuture = inflationAdjustedTarget
                - (initialPortfolio * Math.pow(1 + r, n) + fvSipCurrent);
        double lumpSumToday = Math.max(r > 0 ? remainingNeedFuture / Math.pow(1 + r, n) : remainingNeedFuture, 0);

        return new RequiredSipResult(
                Math.round(sipNeeded),
                Math.round(monthlyContribution),
                Math.round(sipGap),
                Math.round(lumpSumToday),
                extraMonthsNeeded(initialPortfolio, monthlyContribution, r, targetAmount, annualInflationRate, n),
                sipGap <= 0
        );
    }

    // ════════════════════════════════════════════════════════════
    // Private helpers
    // ════════════════════════════════════════════════════════════
    private double requiredSip(double corpus, double r, int n, double targetNominal) {
        double fvCorpus = corpus * Math.pow(1 + r, n);
        double remaining = targetNominal - fvCorpus;
        if (r == 0) return n > 0 ? remaining / n : 0;
        double annuityFactor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
        return annuityFactor == 0 ? 0 : remaining / annuityFactor;
    }

    private int extraMonthsNeeded(double corpus, double sip, double r,
                                   double targetAmountToday, double annualInflationRate, int currentMonths) {
        double monthlyInflation = annualInflationRate / 12;
        for (int extra = 1; extra <= 600; extra++) {
            int n = currentMonths + extra;
            double movingTargetNominal = targetAmountToday * Math.pow(1 + monthlyInflation, n);
            double fvC = corpus * Math.pow(1 + r, n);
            double fvS = fvAnnuity(sip, r, n);
            if (fvC + fvS >= movingTargetNominal) return extra;
        }
        return -1;
    }

    private double percentile(List<Double> sorted, int pct) {
        int index = (int) Math.ceil(pct / 100.0 * sorted.size()) - 1;
        return sorted.get(Math.max(0, index));
    }

    // ════════════════════════════════════════════════════════════
    // Result Records
    // ════════════════════════════════════════════════════════════
    public record MonteCarloResult(
            double pessimistic,
            double likely,
            double optimistic,
            double probability
    ) {}

    public record DeterministicResult(
            long fvCorpus,
            long fvSip,
            long totalProjected,
            long gap,
            boolean onTrack,
            List<SensitivityRow> sensitivity
    ) {}

    public record SensitivityRow(String scenario, long projected, long gap) {}

    public record RequiredSipResult(
            long requiredSip,
            long currentSip,
            long sipGap,
            long lumpSumToday,
            int extraMonths,
            boolean currentSipEnough
    ) {}
}
