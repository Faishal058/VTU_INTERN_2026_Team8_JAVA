package com.wealthwise.service;

import com.wealthwise.model.NavDaily;
import com.wealthwise.model.SchemeMaster;
import com.wealthwise.repository.NavDailyRepository;
import com.wealthwise.repository.SchemeMasterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * M02/M03 — AMFI Scheme Master Seeder & NAV Fetcher.
 *
 * NAVAll.txt format (6 semicolon-delimited columns):
 *   [0] Scheme Code (AMFI code)
 *   [1] ISIN Div Payout / Growth
 *   [2] ISIN Div Reinvestment
 *   [3] Scheme Name
 *   [4] Net Asset Value
 *   [5] Date (dd-MMM-yyyy)
 *
 * Category header lines have NO semicolons.
 * Column-header lines start with "Scheme Code".
 */
@Service
public class AmfiSeedService {

    private static final Logger log = LoggerFactory.getLogger(AmfiSeedService.class);
    private static final String AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    private final SchemeMasterRepository schemeRepo;
    private final NavDailyRepository     navRepo;

    public AmfiSeedService(SchemeMasterRepository schemeRepo, NavDailyRepository navRepo) {
        this.schemeRepo = schemeRepo;
        this.navRepo    = navRepo;
    }

    /** Called on startup (if table empty) and daily at 11 PM IST. */
    @Scheduled(cron = "0 30 23 * * *", zone = "Asia/Kolkata")
    public SeedResult seedFromAmfi() {
        log.info("Starting AMFI NAV seed from {}", AMFI_URL);
        int seeded = 0, navUpdated = 0, errors = 0;

        try {
            // ── open connection with browser-like User-Agent ──────────────────
            HttpURLConnection conn = (HttpURLConnection) new URL(AMFI_URL).openConnection();
            conn.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");
            conn.setRequestProperty("Accept", "text/plain,*/*");
            conn.setConnectTimeout(20_000);
            conn.setReadTimeout(120_000);

            int status = conn.getResponseCode();
            if (status != 200) {
                log.error("AMFI returned HTTP {}", status);
                return new SeedResult(0, 0, 0, "FAILED: HTTP " + status);
            }

            // ── parse line by line ─────────────────────────────────────────────
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {

                String currentCategory = null;
                String line;

                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty()) continue;

                    // Lines without semicolons are category-header rows
                    if (!line.contains(";")) {
                        // e.g. "Open Ended Schemes( Equity Scheme - Large Cap Fund )"
                        currentCategory = line;
                        continue;
                    }

                    // Skip the column-header row that starts with "Scheme Code"
                    if (line.startsWith("Scheme Code")) continue;

                    // ── Data line: exactly 6 columns ──────────────────────────
                    String[] p = line.split(";", -1);
                    if (p.length < 6) continue;          // ← was wrongly < 8

                    try {
                        String amfiCode   = p[0].trim();
                        String isinGrowth = p[1].trim();
                        String isinIdcw   = p[2].trim();
                        String schemeName = p[3].trim();
                        String navStr     = p[4].trim();  // Net Asset Value
                        String dateStr    = p[5].trim();  // dd-MMM-yyyy

                        if (amfiCode.isEmpty() || schemeName.isEmpty()) continue;
                        // AMFI code must be numeric
                        if (!amfiCode.matches("\\d+")) continue;

                        // Parse NAV
                        BigDecimal navValue = null;
                        try { navValue = new BigDecimal(navStr); } catch (Exception ignored) {}

                        // Parse date
                        LocalDate navDate = null;
                        try { navDate = LocalDate.parse(dateStr, DATE_FMT); } catch (Exception ignored) {}

                        // ── Upsert SchemeMaster ───────────────────────────────
                        SchemeMaster scheme = schemeRepo.findByAmfiCode(amfiCode)
                            .orElseGet(() -> {
                                SchemeMaster s = new SchemeMaster();
                                s.setAmfiCode(amfiCode);
                                s.setCreatedAt(OffsetDateTime.now());
                                return s;
                            });

                        scheme.setSchemeName(schemeName);
                        scheme.setIsinGrowth(isinGrowth.isEmpty() || "-".equals(isinGrowth) ? null : isinGrowth);
                        scheme.setIsinIdcw  (isinIdcw.isEmpty()   || "-".equals(isinIdcw)   ? null : isinIdcw);
                        scheme.setIsActive(true);
                        scheme.setUpdatedAt(OffsetDateTime.now());

                        if (scheme.getAmcName() == null)
                            scheme.setAmcName(deriveAmc(schemeName));
                        if (scheme.getCategory() == null && currentCategory != null)
                            scheme.setCategory(normaliseCategory(currentCategory));

                        derivePlanOption(scheme, schemeName);

                        if (navValue != null) scheme.setLastNav(navValue);
                        if (navDate  != null) scheme.setLastNavDate(navDate);

                        schemeRepo.save(scheme);
                        seeded++;

                        // ── Upsert NavDaily ───────────────────────────────────
                        if (navValue != null && navDate != null
                                && !navRepo.existsBySchemeCodeAndNavDate(amfiCode, navDate)) {
                            NavDaily nd = new NavDaily();
                            nd.setSchemeCode(amfiCode);
                            nd.setNavDate(navDate);
                            nd.setNavValue(navValue);
                            nd.setCreatedAt(OffsetDateTime.now());
                            navRepo.save(nd);
                            navUpdated++;
                        }

                    } catch (Exception e) {
                        errors++;
                        if (errors <= 5) log.warn("Row parse error: {} → {}", line, e.getMessage());
                    }
                }
            }

        } catch (Exception e) {
            log.error("AMFI seed failed: {}", e.getMessage(), e);
            return new SeedResult(seeded, navUpdated, errors, "FAILED: " + e.getMessage());
        }

        log.info("AMFI seed complete: {} schemes, {} NAVs, {} errors", seeded, navUpdated, errors);
        return new SeedResult(seeded, navUpdated, errors, "OK");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Extract AMC name from the scheme name. */
    private String deriveAmc(String name) {
        String lower = name.toLowerCase();
        // Known AMC prefixes
        for (String amcKey : new String[]{
            "aditya birla","axis","bandhan","baroda bnp","bnp paribas","canara robeco",
            "dsp","edelweiss","franklin","groww","hdfc","hsbc","icici prudential",
            "invesco","iti","jm financial","kotak","l&t","lic","mahindra manulife",
            "mirae","motilal","navi","nippon","nj","old bridge","parag parikh",
            "pgim","ppfas","quant","quantum","sahara","samco","sbi","shriram",
            "sundaram","tata","taurus","trust","union","uti","whiteoak","zerodha"
        }) {
            if (lower.startsWith(amcKey)) {
                // Find "Mutual Fund" boundary
                int mf = lower.indexOf(" mutual fund");
                if (mf > 0) return name.substring(0, mf).trim();
                // Otherwise use first 3 words
                String[] w = name.split(" ");
                int wordCount = Math.min(3, w.length);
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < wordCount; i++) { if (i > 0) sb.append(' '); sb.append(w[i]); }
                return sb.toString();
            }
        }
        // Generic fallback
        int mf = lower.indexOf(" mutual fund");
        if (mf > 0) return name.substring(0, mf).trim();
        String[] parts = name.split(" ");
        return parts.length > 1 ? parts[0] + " " + parts[1] : parts[0];
    }

    /** Normalise category from AMFI header, e.g. "Open Ended Schemes( Equity Scheme - Large Cap Fund )" → "Large Cap Fund" */
    private String normaliseCategory(String header) {
        int open = header.indexOf('(');
        int close = header.lastIndexOf(')');
        if (open >= 0 && close > open) {
            String inner = header.substring(open + 1, close).trim();
            // "Equity Scheme - Large Cap Fund" → "Large Cap Fund"
            int dash = inner.indexOf(" - ");
            return dash >= 0 ? inner.substring(dash + 3).trim() : inner;
        }
        return header;
    }

    private void derivePlanOption(SchemeMaster s, String name) {
        String up = name.toUpperCase();
        if (s.getPlanType() == null)
            s.setPlanType(up.contains("DIRECT") ? "DIRECT" : up.contains("REGULAR") ? "REGULAR" : "UNKNOWN");
        if (s.getOptionType() == null) {
            if (up.contains("IDCW") || up.contains("DIVIDEND"))
                s.setOptionType(up.contains("REINVEST") ? "IDCW_REINVESTMENT" : "IDCW_PAYOUT");
            else
                s.setOptionType("GROWTH");
        }
    }

    public record SeedResult(int schemesSaved, int navsInserted, int errors, String status) {}
}
