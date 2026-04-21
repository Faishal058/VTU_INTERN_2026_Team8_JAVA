package com.wealthwise.service;

import com.wealthwise.model.InvestmentLot;
import com.wealthwise.model.NavDaily;
import com.wealthwise.model.SchemeMaster;
import com.wealthwise.repository.InvestmentLotRepository;
import com.wealthwise.repository.NavDailyRepository;
import com.wealthwise.repository.SchemeMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * M21 — Analytics Service.
 * Provides portfolio risk profiling (Sharpe ratio, volatility, max drawdown),
 * diversification scoring, SIP intelligence, and monthly growth timelines.
 * Adapted to use the existing WealthWise model classes.
 */
@Service
public class AnalyticsService {

    private static final double RISK_FREE_RATE = 0.07; // 7% annual
    private static final double TRADING_DAYS   = 252.0;

    @Autowired private InvestmentLotRepository    lotRepo;
    @Autowired private NavDailyRepository         navRepo;
    @Autowired private SchemeMasterRepository     schemeRepo;
    @Autowired private HoldingsService            holdingsService;

    // ─── Risk Profile ─────────────────────────────────────────────────────────

    /**
     * Returns a full risk analytics profile for the user's portfolio:
     *  volatility, Sharpe ratio, max drawdown, diversification, risk appetite.
     */
    public Map<String, Object> getRiskProfile(UUID userId) {
        var holdings = holdingsService.getHoldings(userId);

        BigDecimal totalCurrent = holdings.stream()
            .map(HoldingsService.Holding::currentValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Weighted risk score (SEBI riskometer 1-6) ──────────────────────
        BigDecimal weightedRisk = holdings.stream()
            .map(h -> BigDecimal.valueOf(h.riskLevel()).multiply(h.currentValue()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        double avgRisk = totalCurrent.compareTo(BigDecimal.ZERO) > 0
            ? weightedRisk.divide(totalCurrent, 4, RoundingMode.HALF_UP).doubleValue() : 3.0;
        int riskLevel = (int) Math.round(avgRisk);

        // ── Try to compute Sharpe + Volatility from NAV history ───────────
        double volatility   = estimateVolatility(holdings);
        double maxDrawdown  = estimateMaxDrawdown(holdings);
        double annualReturn = computeAnnualReturn(holdings, totalCurrent);
        double sharpe       = volatility > 0
            ? (annualReturn - RISK_FREE_RATE) / volatility : 0.0;

        // ── Diversification score (0-10) ──────────────────────────────────
        int diversificationScore = calcDiversificationScore(holdings, totalCurrent);

        // ── Derived risk appetite label ────────────────────────────────────
        String derivedRiskAppetite = deriveRiskAppetite(avgRisk, equityPct(holdings, totalCurrent));

        // ── Comparison message ─────────────────────────────────────────────
        String comparison = buildComparisonMessage(sharpe, annualReturn);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("portfolioRiskScore",    round2(avgRisk));
        result.put("riskLevel",             riskLevel);
        result.put("riskLabel",             riskLabel(riskLevel));
        result.put("volatility",            round2(volatility * 100));          // as %
        result.put("sharpeRatio",           round2(sharpe));
        result.put("maxDrawdown",           round2(maxDrawdown * 100));         // as %
        result.put("annualReturn",          round2(annualReturn * 100));        // as %
        result.put("diversificationScore",  diversificationScore);
        result.put("derivedRiskAppetite",   derivedRiskAppetite);
        result.put("comparisonMessage",     comparison);
        result.put("fundCount",             holdings.size());
        result.put("amcCount",              holdings.stream().map(HoldingsService.Holding::amcName)
                                                .filter(Objects::nonNull).collect(Collectors.toSet()).size());
        result.put("categoryBreakdown",     buildCategoryBreakdown(holdings, totalCurrent));
        return result;
    }

    // ─── SIP Intelligence ────────────────────────────────────────────────────

    /**
     * For each active holding that was built via SIP lots, compare
     * the actual SIP cost-basis vs what a lumpsum of the same total
     * amount on day-1 would have been worth today.
     */
    public List<Map<String, Object>> getSipIntelligence(UUID userId) {
        var holdings = holdingsService.getHoldings(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (var h : holdings) {
            // Only consider funds with multiple lots (SIP pattern)
            if (h.lots().size() < 2) continue;

            List<InvestmentLot> lots = h.lots().stream()
                .sorted(Comparator.comparing(InvestmentLot::getPurchaseDate))
                .collect(Collectors.toList());

            BigDecimal totalInvested = lots.stream()
                .map(l -> l.getUnitsRemaining().multiply(l.getCostPerUnit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalInvested.compareTo(BigDecimal.ZERO) <= 0) continue;

            // SIP: average cost nav
            BigDecimal sipUnits = lots.stream()
                .map(InvestmentLot::getUnitsRemaining)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sipCurrentValue = sipUnits.multiply(h.currentNav());

            // Lumpsum: if entire amount invested on day-1 at day-1 NAV
            LocalDate firstDate = lots.get(0).getPurchaseDate();
            BigDecimal firstNav  = lots.get(0).getCostPerUnit();
            BigDecimal lumpsumUnits = firstNav.compareTo(BigDecimal.ZERO) > 0
                ? totalInvested.divide(firstNav, 6, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal lumpsumCurrentValue = lumpsumUnits.multiply(h.currentNav());

            BigDecimal sipGain     = sipCurrentValue.subtract(totalInvested);
            BigDecimal lumpsumGain = lumpsumCurrentValue.subtract(totalInvested);
            boolean sipWins        = sipCurrentValue.compareTo(lumpsumCurrentValue) >= 0;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("schemeCode",          h.schemeCode());
            item.put("fundName",            h.fundName());
            item.put("category",            h.category());
            item.put("totalInvested",       totalInvested);
            item.put("sipLots",             h.lots().size());
            item.put("firstSipDate",        firstDate);
            item.put("sipCurrentValue",     sipCurrentValue.setScale(2, RoundingMode.HALF_UP));
            item.put("sipGain",             sipGain.setScale(2, RoundingMode.HALF_UP));
            item.put("lumpsumCurrentValue", lumpsumCurrentValue.setScale(2, RoundingMode.HALF_UP));
            item.put("lumpsumGain",         lumpsumGain.setScale(2, RoundingMode.HALF_UP));
            item.put("sipWins",             sipWins);
            item.put("advantage",           sipCurrentValue.subtract(lumpsumCurrentValue).abs().setScale(2, RoundingMode.HALF_UP));
            item.put("message",             sipWins
                ? "SIP outperformed lumpsum by rupee-cost averaging"
                : "Lumpsum would have outperformed — market trended up consistently");
            result.add(item);
        }

        // Sort: biggest advantage first
        result.sort((a, b) -> {
            BigDecimal advA = (BigDecimal) a.get("advantage");
            BigDecimal advB = (BigDecimal) b.get("advantage");
            return advB.compareTo(advA);
        });
        return result;
    }

    // ─── Growth Timeline ─────────────────────────────────────────────────────

    /**
     * Builds a monthly portfolio value timeline from the first investment date
     * to today, using actual NAV data from nav_daily where available.
     * Falls back to prev-known NAV if a month has no data.
     */
    public List<Map<String, Object>> getGrowthTimeline(UUID userId) {
        var holdings = holdingsService.getHoldings(userId);
        if (holdings.isEmpty()) return List.of();

        // All lots sorted by date
        List<InvestmentLot> allLots = lotRepo.findAllActiveLots(userId);
        if (allLots.isEmpty()) return List.of();

        LocalDate start = allLots.stream()
            .map(InvestmentLot::getPurchaseDate)
            .min(LocalDate::compareTo).orElse(LocalDate.now().minusYears(1));

        // Build monthly snapshots
        List<Map<String, Object>> timeline = new ArrayList<>();
        LocalDate cursor = YearMonth.from(start).atDay(1);
        LocalDate today  = LocalDate.now();

        // Cache last-known NAV per scheme
        Map<String, BigDecimal> lastKnownNav = new HashMap<>();

        while (!cursor.isAfter(today)) {
            final LocalDate month = cursor;

            // For each scheme, get NAV on or before end of this month
            BigDecimal portfolioValue   = BigDecimal.ZERO;
            BigDecimal portfolioInvested = BigDecimal.ZERO;

            for (var h : holdings) {
                // Units purchased up to end of this month
                BigDecimal units = allLots.stream()
                    .filter(l -> l.getSchemeCode().equals(h.schemeCode()))
                    .filter(l -> !l.getPurchaseDate().isAfter(month.withDayOfMonth(month.lengthOfMonth())))
                    .map(InvestmentLot::getUnitsRemaining)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (units.compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal invested = allLots.stream()
                    .filter(l -> l.getSchemeCode().equals(h.schemeCode()))
                    .filter(l -> !l.getPurchaseDate().isAfter(month.withDayOfMonth(month.lengthOfMonth())))
                    .map(l -> l.getUnitsRemaining().multiply(l.getCostPerUnit()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Get NAV for this month-end from DB
                LocalDate monthEnd = month.withDayOfMonth(month.lengthOfMonth());
                List<NavDaily> navs = navRepo.findNavOnOrBefore(h.schemeCode(), monthEnd, PageRequest.of(0, 1));
                BigDecimal nav;
                if (!navs.isEmpty()) {
                    nav = navs.get(0).getNavValue();
                    lastKnownNav.put(h.schemeCode(), nav);
                } else {
                    // Use last known, or cost nav as fallback
                    nav = lastKnownNav.getOrDefault(h.schemeCode(), h.avgCostNav());
                }

                portfolioValue   = portfolioValue.add(units.multiply(nav));
                portfolioInvested = portfolioInvested.add(invested);
            }

            if (portfolioInvested.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> point = new LinkedHashMap<>();
                point.put("month",    month.toString().substring(0, 7)); // "yyyy-MM"
                point.put("value",    portfolioValue.setScale(2, RoundingMode.HALF_UP));
                point.put("invested", portfolioInvested.setScale(2, RoundingMode.HALF_UP));
                point.put("gain",     portfolioValue.subtract(portfolioInvested).setScale(2, RoundingMode.HALF_UP));
                timeline.add(point);
            }

            cursor = cursor.plusMonths(1);
        }

        return timeline;
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private double estimateVolatility(List<HoldingsService.Holding> holdings) {
        // Weighted-average volatility using category-based approximations
        double totalVal = holdings.stream()
            .mapToDouble(h -> h.currentValue().doubleValue()).sum();
        if (totalVal <= 0) return 0.15;

        double weightedVol = 0.0;
        for (var h : holdings) {
            double weight = h.currentValue().doubleValue() / totalVal;
            double vol = categoryVolatility(h.category());
            weightedVol += weight * vol;
        }
        return weightedVol;
    }

    private double categoryVolatility(String category) {
        if (category == null) return 0.18;
        String c = category.toLowerCase();
        if (c.contains("small cap"))  return 0.28;
        if (c.contains("mid cap") || c.contains("midcap")) return 0.22;
        if (c.contains("elss"))       return 0.20;
        if (c.contains("flexi") || c.contains("multi")) return 0.19;
        if (c.contains("large cap") || c.contains("large & mid")) return 0.16;
        if (c.contains("index"))      return 0.15;
        if (c.contains("hybrid") || c.contains("balanced")) return 0.12;
        if (c.contains("liquid") || c.contains("overnight")) return 0.01;
        if (c.contains("debt") || c.contains("bond"))        return 0.05;
        if (c.contains("gold"))       return 0.13;
        if (c.contains("international") || c.contains("fof")) return 0.20;
        return 0.18;
    }

    private double estimateMaxDrawdown(List<HoldingsService.Holding> holdings) {
        // Proxy: worst category drawdown weighted by allocation
        double totalVal = holdings.stream()
            .mapToDouble(h -> h.currentValue().doubleValue()).sum();
        if (totalVal <= 0) return 0.25;

        double weighted = 0.0;
        for (var h : holdings) {
            double w = h.currentValue().doubleValue() / totalVal;
            weighted += w * categoryMaxDrawdown(h.category());
        }
        return weighted;
    }

    private double categoryMaxDrawdown(String category) {
        if (category == null) return 0.35;
        String c = category.toLowerCase();
        if (c.contains("small cap"))  return 0.60;
        if (c.contains("mid cap") || c.contains("midcap")) return 0.50;
        if (c.contains("large cap"))  return 0.38;
        if (c.contains("elss"))       return 0.45;
        if (c.contains("flexi") || c.contains("multi")) return 0.42;
        if (c.contains("index"))      return 0.38;
        if (c.contains("hybrid") || c.contains("balanced")) return 0.28;
        if (c.contains("liquid") || c.contains("overnight")) return 0.002;
        if (c.contains("debt"))       return 0.08;
        if (c.contains("gold"))       return 0.20;
        if (c.contains("international") || c.contains("fof")) return 0.40;
        return 0.35;
    }

    private double computeAnnualReturn(List<HoldingsService.Holding> holdings, BigDecimal totalCurrent) {
        BigDecimal totalInvested = holdings.stream()
            .map(HoldingsService.Holding::investedValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalInvested.compareTo(BigDecimal.ZERO) <= 0) return 0.0;
        // Simple absolute return — XIRR requires actual cashflow dates
        double absReturn = totalCurrent.subtract(totalInvested)
            .divide(totalInvested, 8, RoundingMode.HALF_UP).doubleValue();
        // Annualise assuming 2-year average holding (conservative proxy)
        return Math.pow(1 + absReturn, 1.0 / 2.0) - 1;
    }

    private double equityPct(List<HoldingsService.Holding> holdings, BigDecimal total) {
        double equityVal = holdings.stream()
            .filter(h -> h.category() != null && (
                h.category().toLowerCase().contains("equity") ||
                h.category().toLowerCase().contains("elss")   ||
                h.category().toLowerCase().contains("large")  ||
                h.category().toLowerCase().contains("mid")    ||
                h.category().toLowerCase().contains("small")  ||
                h.category().toLowerCase().contains("flexi")  ||
                h.category().toLowerCase().contains("index")
            ))
            .mapToDouble(h -> h.currentValue().doubleValue()).sum();
        double t = total.doubleValue();
        return t > 0 ? equityVal / t * 100 : 0;
    }

    private int calcDiversificationScore(List<HoldingsService.Holding> holdings, BigDecimal totalCurrent) {
        int score = 0;
        int funds = holdings.size();
        if (funds >= 3 && funds <= 8) score += 2; else if (funds >= 9) score += 1;
        long amcs  = holdings.stream().map(HoldingsService.Holding::amcName).filter(Objects::nonNull).distinct().count();
        long cats  = holdings.stream().map(HoldingsService.Holding::category).filter(Objects::nonNull).distinct().count();
        if (amcs >= 3) score += 2; else if (amcs >= 2) score += 1;
        if (cats >= 3) score += 2; else if (cats >= 2) score += 1;
        double ep = equityPct(holdings, totalCurrent);
        double dp  = holdings.stream()
            .filter(h -> h.category() != null && (h.category().toLowerCase().contains("debt") || h.category().toLowerCase().contains("liquid")))
            .mapToDouble(h -> h.currentValue().doubleValue()).sum();
        dp = totalCurrent.doubleValue() > 0 ? dp / totalCurrent.doubleValue() * 100 : 0;
        if (ep > 0 && dp > 0) score += 2; else if (ep > 0 || dp > 0) score += 1;
        // Overlap penalty: if a single holding > 40% of portfolio
        double maxWeight = holdings.stream()
            .mapToDouble(h -> totalCurrent.doubleValue() > 0 ? h.currentValue().doubleValue() / totalCurrent.doubleValue() : 0)
            .max().orElse(0);
        if (maxWeight > 0.40) score -= 1;
        return Math.max(0, Math.min(10, score));
    }

    private List<Map<String, Object>> buildCategoryBreakdown(List<HoldingsService.Holding> holdings, BigDecimal total) {
        Map<String, BigDecimal> catMap = new LinkedHashMap<>();
        holdings.forEach(h -> {
            String cat = broadCategory(h.category());
            catMap.merge(cat, h.currentValue(), BigDecimal::add);
        });
        List<Map<String, Object>> list = new ArrayList<>();
        catMap.forEach((cat, val) -> {
            double pct = total.doubleValue() > 0 ? val.doubleValue() / total.doubleValue() * 100 : 0;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("category", cat); m.put("value", val.setScale(2, RoundingMode.HALF_UP));
            m.put("pct", round2(pct));
            list.add(m);
        });
        list.sort((a, b) -> Double.compare((double) b.get("pct"), (double) a.get("pct")));
        return list;
    }

    private String broadCategory(String cat) {
        if (cat == null) return "Other";
        String c = cat.toLowerCase();
        if (c.contains("equity") || c.contains("large") || c.contains("mid") ||
            c.contains("small") || c.contains("flexi") || c.contains("elss") ||
            c.contains("thematic") || c.contains("index")) return "Equity";
        if (c.contains("debt") || c.contains("liquid") || c.contains("bond") ||
            c.contains("gilt") || c.contains("credit") || c.contains("overnight")) return "Debt";
        if (c.contains("hybrid") || c.contains("balanced") || c.contains("asset allocation")) return "Hybrid";
        if (c.contains("gold") || c.contains("silver") || c.contains("commodity")) return "Commodity";
        if (c.contains("international") || c.contains("fof") || c.contains("global")) return "International";
        return "Other";
    }

    private String deriveRiskAppetite(double avgRisk, double equityPct) {
        if (avgRisk >= 4.5 || equityPct >= 80) return "AGGRESSIVE";
        if (avgRisk <= 2.5 && equityPct < 40)  return "CONSERVATIVE";
        return "MODERATE";
    }

    private String buildComparisonMessage(double sharpe, double annualReturn) {
        String perfMsg = annualReturn > 0.14 ? "beating the Nifty 50 benchmark" :
                         annualReturn > 0.10 ? "tracking the Nifty 50 benchmark" :
                                               "underperforming the Nifty 50 benchmark";
        String sharpeMsg = sharpe > 1.0 ? "Excellent risk-adjusted returns (Sharpe > 1)." :
                           sharpe > 0.5 ? "Adequate risk-adjusted returns (Sharpe > 0.5)." :
                                          "Risk-adjusted returns could be improved.";
        return String.format("Your portfolio is %s at %.1f%% estimated annual return. %s",
            perfMsg, annualReturn * 100, sharpeMsg);
    }

    private String riskLabel(int level) {
        return switch (level) {
            case 1 -> "Low"; case 2 -> "Low to Moderate"; case 3 -> "Moderate";
            case 4 -> "Moderately High"; case 5 -> "High"; case 6 -> "Very High";
            default -> "Moderate";
        };
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
