package com.wealthwise.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * M09 — Returns Engine.
 * XIRR using Newton-Raphson with bisection fallback.
 * All amounts: purchases are NEGATIVE, redemptions/current-value are POSITIVE.
 */
@Service
public class XirrService {

    private static final double TOLERANCE = 1e-7;
    private static final int MAX_ITER = 1000;

    /** Cashflow record: date + signed amount (negative = outflow, positive = inflow) */
    public record CashFlow(LocalDate date, double amount) {}

    /**
     * Calculate XIRR given a list of cash flows.
     * Returns null if calculation fails or insufficient data.
     */
    public Double calculateXirr(List<CashFlow> flows) {
        if (flows == null || flows.size() < 2) return null;

        boolean hasNeg = flows.stream().anyMatch(f -> f.amount() < 0);
        boolean hasPos = flows.stream().anyMatch(f -> f.amount() > 0);
        if (!hasNeg || !hasPos) return null;

        LocalDate base = flows.stream().map(CashFlow::date).min(LocalDate::compareTo).orElseThrow();

        // Convert to days array
        double[] amounts = flows.stream().mapToDouble(CashFlow::amount).toArray();
        double[] days = flows.stream().mapToDouble(f -> ChronoUnit.DAYS.between(base, f.date())).toArray();

        // Newton-Raphson
        Double result = newtonRaphson(amounts, days, 0.1);
        if (result == null) result = newtonRaphson(amounts, days, -0.5);
        if (result == null) result = bisection(amounts, days, -0.999, 100.0);
        return result;
    }

    private Double newtonRaphson(double[] amounts, double[] days, double guess) {
        double rate = guess;
        for (int i = 0; i < MAX_ITER; i++) {
            double npv = 0, dnpv = 0;
            for (int j = 0; j < amounts.length; j++) {
                double t = days[j] / 365.25;
                double factor = Math.pow(1 + rate, t);
                if (!Double.isFinite(factor) || factor == 0) return null;
                npv  += amounts[j] / factor;
                dnpv -= amounts[j] * t / (factor * (1 + rate));
            }
            if (!Double.isFinite(npv) || dnpv == 0) return null;
            double next = rate - npv / dnpv;
            if (!Double.isFinite(next)) return null;
            if (Math.abs(next - rate) < TOLERANCE) return next > -1 ? next : null;
            rate = next;
        }
        return null;
    }

    private Double bisection(double[] amounts, double[] days, double lo, double hi) {
        for (int i = 0; i < MAX_ITER; i++) {
            double mid = (lo + hi) / 2.0;
            double npv = npv(amounts, days, mid);
            if (!Double.isFinite(npv)) return null;
            if (Math.abs(npv) < TOLERANCE || (hi - lo) / 2.0 < TOLERANCE) return mid;
            if (npv * npv(amounts, days, lo) < 0) hi = mid; else lo = mid;
        }
        return (lo + hi) / 2.0;
    }

    private double npv(double[] amounts, double[] days, double rate) {
        double sum = 0;
        for (int j = 0; j < amounts.length; j++) {
            double factor = Math.pow(1 + rate, days[j] / 365.25);
            if (!Double.isFinite(factor) || factor == 0) return Double.NaN;
            sum += amounts[j] / factor;
        }
        return sum;
    }

    /** Absolute return: (current - invested) / invested */
    public Double absoluteReturn(BigDecimal invested, BigDecimal current) {
        if (invested == null || invested.compareTo(BigDecimal.ZERO) <= 0) return null;
        return current.subtract(invested).divide(invested, 8, java.math.RoundingMode.HALF_UP).doubleValue();
    }

    /** CAGR for single lumpsum */
    public Double cagr(BigDecimal initial, BigDecimal finalVal, long days) {
        if (days < 30 || initial == null || initial.compareTo(BigDecimal.ZERO) <= 0) return null;
        try {
            double years = days / 365.25;
            double ratio = finalVal.divide(initial, 10, java.math.RoundingMode.HALF_UP).doubleValue();
            return Math.pow(ratio, 1.0 / years) - 1;
        } catch (Exception e) {
            return null;
        }
    }
}
