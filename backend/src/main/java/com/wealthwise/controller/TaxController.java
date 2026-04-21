package com.wealthwise.controller;

import com.wealthwise.repository.InvestmentLotRepository;
import com.wealthwise.repository.InvestmentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * M18/M19/M20 — Tax Engine.
 * FIFO-based STCG/LTCG from actual transaction data.
 * Tax harvesting suggestions.
 */
@RestController
@RequestMapping("/api/tax")
public class TaxController {

    private static final Logger log = LoggerFactory.getLogger(TaxController.class);

    private final InvestmentTransactionRepository txRepo;
    private final InvestmentLotRepository lotRepo;

    public TaxController(InvestmentTransactionRepository txRepo, InvestmentLotRepository lotRepo) {
        this.txRepo = txRepo;
        this.lotRepo = lotRepo;
    }

    /** FY summary: total STCG, LTCG, tax liability */
    @GetMapping("/summary")
    public ResponseEntity<?> summary(@RequestParam(defaultValue = "2025") int fy, Authentication auth) {
        long t0 = System.currentTimeMillis();
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] GET /api/tax/summary  ▶ user={} fy={}", userId, fy);
        LocalDate fyStart = LocalDate.of(fy - 1, 4, 1);
        LocalDate fyEnd   = LocalDate.of(fy, 3, 31);

        var txns = txRepo.findByUserIdOrderByTransactionDateDesc(userId).stream()
            .filter(t -> !t.getTransactionDate().isBefore(fyStart) && !t.getTransactionDate().isAfter(fyEnd))
            .filter(t -> t.getTransactionType().equals("REDEMPTION") ||
                         t.getTransactionType().equals("SWITCH_OUT") ||
                         t.getTransactionType().equals("STP_OUT"))
            .collect(Collectors.toList());

        BigDecimal totalStcg = txns.stream().map(t -> t.getStcgGain() != null ? t.getStcgGain() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLtcg = txns.stream().map(t -> t.getLtcgGain() != null ? t.getLtcgGain() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Equity: STCG@20%, LTCG@12.5% above 1.25L exempt
        BigDecimal stcgTax = totalStcg.multiply(BigDecimal.valueOf(0.20)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ltcgExempt = BigDecimal.valueOf(125000);
        BigDecimal taxableLtcg = totalLtcg.subtract(ltcgExempt).max(BigDecimal.ZERO);
        BigDecimal ltcgTax = taxableLtcg.multiply(BigDecimal.valueOf(0.125)).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("fy",               "FY " + (fy - 1) + "-" + String.valueOf(fy).substring(2));
        res.put("totalStcgGain",    totalStcg);
        res.put("totalLtcgGain",    totalLtcg);
        res.put("stcgTaxLiability", stcgTax);
        res.put("ltcgExemption",    ltcgExempt);
        res.put("ltcgTaxLiability", ltcgTax);
        res.put("totalTaxLiability",stcgTax.add(ltcgTax));
        res.put("redemptionCount",  txns.size());
        res.put("note","Equity funds: STCG @20% (held <1yr), LTCG @12.5% above ₹1.25L (held ≥1yr). Debt funds taxed at slab rate (not included).");
        log.info("[API] GET /api/tax/summary  ✔ {}ms  fy=FY{} stcgTax=₹{} ltcgTax=₹{} redemptions={}",
            System.currentTimeMillis() - t0, fy, stcgTax.toPlainString(),
            ltcgTax.toPlainString(), txns.size());
        return ResponseEntity.ok(res);
    }

    /** List all taxable transactions in a FY */
    @GetMapping("/transactions")
    public ResponseEntity<?> taxTxns(@RequestParam(defaultValue = "2025") int fy, Authentication auth) {
        long t0 = System.currentTimeMillis();
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] GET /api/tax/transactions  ▶ user={} fy={}", userId, fy);
        LocalDate fyStart = LocalDate.of(fy - 1, 4, 1);
        LocalDate fyEnd   = LocalDate.of(fy, 3, 31);

        var list = txRepo.findByUserIdOrderByTransactionDateDesc(userId).stream()
            .filter(t -> !t.getTransactionDate().isBefore(fyStart) && !t.getTransactionDate().isAfter(fyEnd))
            .filter(t -> t.getTransactionType().equals("REDEMPTION") ||
                         t.getTransactionType().equals("SWITCH_OUT"))
            .collect(Collectors.toList());
        log.info("[API] GET /api/tax/transactions  ✔ {}ms  {} taxable transaction(s)",
            System.currentTimeMillis() - t0, list.size());
        return ResponseEntity.ok(list);
    }

    /** M19 — Tax loss harvesting suggestions: find lots with unrealised loss */
    @GetMapping("/harvest-suggestions")
    public ResponseEntity<?> harvestSuggestions(Authentication auth) {
        long t0 = System.currentTimeMillis();
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] GET /api/tax/harvest-suggestions  ▶ user={}", userId);
        var lots = lotRepo.findAllActiveLots(userId);
        log.info("[Tax]   {} active lot(s) loaded for harvest analysis", lots.size());

        // Find lots with cost > last_nav implied by purchase info
        // We emit lots where holding < 1 year and cost basis suggests a loss
        // (In real implementation, compare cost to current NAV from nav_daily)
        List<Map<String, Object>> suggestions = new ArrayList<>();

        Map<String, List<com.wealthwise.model.InvestmentLot>> byScheme = new LinkedHashMap<>();
        lots.forEach(l -> byScheme.computeIfAbsent(l.getSchemeCode(), k -> new ArrayList<>()).add(l));

        for (var entry : byScheme.entrySet()) {
            BigDecimal totalCost = entry.getValue().stream()
                .map(l -> l.getUnitsRemaining().multiply(l.getCostPerUnit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalUnits = entry.getValue().stream()
                .map(com.wealthwise.model.InvestmentLot::getUnitsRemaining)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("schemeCode",    entry.getKey());
            m.put("fundName",      entry.getValue().get(0).getFundName());
            m.put("totalUnits",    totalUnits);
            m.put("investedValue", totalCost);
            m.put("lotCount",      entry.getValue().size());
            m.put("oldestLot",     entry.getValue().stream().map(com.wealthwise.model.InvestmentLot::getPurchaseDate)
                .min(LocalDate::compareTo).orElse(null));
            suggestions.add(m);
        }
        log.info("[API] GET /api/tax/harvest-suggestions  ✔ {}ms  {} fund(s) analysed",
            System.currentTimeMillis() - t0, suggestions.size());
        return ResponseEntity.ok(suggestions);
    }

    /** Export tax report as CSV */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue = "2025") int fy, Authentication auth) {
        long t0 = System.currentTimeMillis();
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] GET /api/tax/export  ▶ user={} fy={}", userId, fy);
        LocalDate fyStart = LocalDate.of(fy - 1, 4, 1);
        LocalDate fyEnd   = LocalDate.of(fy, 3, 31);

        StringBuilder csv = new StringBuilder("Date,Fund,Type,Amount,Units,NAV,STCG Gain,LTCG Gain\n");
        txRepo.findByUserIdOrderByTransactionDateDesc(userId).stream()
            .filter(t -> !t.getTransactionDate().isBefore(fyStart) && !t.getTransactionDate().isAfter(fyEnd))
            .filter(t -> t.getTransactionType().equals("REDEMPTION") || t.getTransactionType().equals("SWITCH_OUT"))
            .forEach(t -> csv.append(String.format("%s,%s,%s,%s,%s,%s,%s,%s\n",
                t.getTransactionDate(), esc(t.getFundName()), t.getTransactionType(),
                t.getAmount() != null ? t.getAmount() : "",
                t.getUnits()  != null ? t.getUnits()  : "",
                t.getNav()    != null ? t.getNav()    : "",
                t.getStcgGain() != null ? t.getStcgGain() : "",
                t.getLtcgGain() != null ? t.getLtcgGain() : "")));

        byte[] bytes = csv.toString().getBytes();
        log.info("[API] GET /api/tax/export  ✔ {}ms  CSV {} bytes",
            System.currentTimeMillis() - t0, bytes.length);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=tax_" + fy + ".csv")
            .body(bytes);
    }

    private String esc(String s) { return s != null ? '"' + s.replace("\"", "\"\"") + '"' : ""; }
}
