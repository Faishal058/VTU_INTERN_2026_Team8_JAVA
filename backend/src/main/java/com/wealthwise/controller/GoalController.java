package com.wealthwise.controller;

import com.wealthwise.model.FinancialGoal;
import com.wealthwise.model.GoalFundLink;
import com.wealthwise.repository.FinancialGoalRepository;
import com.wealthwise.repository.GoalFundLinkRepository;
import com.wealthwise.service.GoalProjectionService;
import com.wealthwise.service.HoldingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * M15/M16/M17 — Goal Planner, Projection Engine, Progress Tracker.
 */
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final FinancialGoalRepository goalRepo;
    private final GoalFundLinkRepository linkRepo;
    private final GoalProjectionService projService;
    private final HoldingsService holdingsService;

    public GoalController(FinancialGoalRepository goalRepo, GoalFundLinkRepository linkRepo,
                           GoalProjectionService projService, HoldingsService holdingsService) {
        this.goalRepo = goalRepo;
        this.linkRepo = linkRepo;
        this.projService = projService;
        this.holdingsService = holdingsService;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        var goals = goalRepo.findByUserId(userId);
        // Enrich with projection
        List<Map<String, Object>> enriched = new ArrayList<>();
        for (var g : goals) {
            var map = goalToMap(g);
            var proj = projService.project(g);
            map.putAll(proj);
            enriched.add(map);
        }
        return ResponseEntity.ok(enriched);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        FinancialGoal g = new FinancialGoal();
        g.setUserId(userId);
        applyBody(body, g);
        g.setCreatedAt(OffsetDateTime.now());
        g.setUpdatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(goalRepo.save(g));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody Map<String, Object> body, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return goalRepo.findById(id)
            .filter(g -> g.getUserId().equals(userId))
            .map(g -> {
                applyBody(body, g);
                g.setUpdatedAt(OffsetDateTime.now());
                return ResponseEntity.ok((Object) goalRepo.save(g));
            }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> patchStatus(@PathVariable UUID id, @RequestBody Map<String, Object> body, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return goalRepo.findById(id)
            .filter(g -> g.getUserId().equals(userId))
            .map(g -> {
                g.setStatus(body.getOrDefault("status", "Active").toString());
                g.setUpdatedAt(OffsetDateTime.now());
                return ResponseEntity.ok((Object) goalRepo.save(g));
            }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return goalRepo.findById(id)
            .filter(g -> g.getUserId().equals(userId))
            .map(g -> { goalRepo.delete(g); return ResponseEntity.ok(Map.of("message", "Deleted")); })
            .orElse(ResponseEntity.notFound().build());
    }

    /** M16 — deterministic projection */
    @GetMapping("/{id}/projection")
    public ResponseEntity<?> projection(@PathVariable UUID id, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return goalRepo.findById(id)
            .filter(g -> g.getUserId().equals(userId))
            .map(g -> {
                updateCorpusFromHoldings(g, userId);
                return ResponseEntity.ok(projService.project(g));
            }).orElse(ResponseEntity.notFound().build());
    }

    /** M16 — Monte Carlo */
    @GetMapping("/{id}/monte-carlo")
    public ResponseEntity<?> monteCarlo(@PathVariable UUID id, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return goalRepo.findById(id)
            .filter(g -> g.getUserId().equals(userId))
            .map(g -> {
                updateCorpusFromHoldings(g, userId);
                return ResponseEntity.ok(projService.monteCarlo(g));
            }).orElse(ResponseEntity.notFound().build());
    }

    /** M15 — Link a fund to a goal */
    @PostMapping("/{id}/link-fund")
    public ResponseEntity<?> linkFund(@PathVariable UUID id, @RequestBody Map<String, Object> body, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        GoalFundLink link = new GoalFundLink();
        link.setUserId(userId);
        link.setGoalId(id);
        link.setSchemeCode(body.getOrDefault("schemeCode", "").toString());
        link.setFundName(body.getOrDefault("fundName", "").toString());
        link.setFolioNumber(body.getOrDefault("folioNumber", "DEFAULT").toString());
        Object pct = body.get("allocationPct");
        link.setAllocationPct(pct != null ? new BigDecimal(pct.toString()) : BigDecimal.valueOf(100));
        link.setCreatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(linkRepo.save(link));
    }

    @GetMapping("/{id}/links")
    public ResponseEntity<?> getLinks(@PathVariable UUID id) {
        return ResponseEntity.ok(linkRepo.findByGoalId(id));
    }

    // ── helpers ───────────────────────────────────────────────────
    private void updateCorpusFromHoldings(FinancialGoal g, UUID userId) {
        List<GoalFundLink> links = linkRepo.findByGoalId(g.getId());
        if (links.isEmpty()) return;

        var holdings = holdingsService.getHoldings(userId);
        BigDecimal corpus = BigDecimal.ZERO;
        for (GoalFundLink link : links) {
            for (var h : holdings) {
                if (h.schemeCode().equals(link.getSchemeCode())) {
                    corpus = corpus.add(
                        h.currentValue().multiply(link.getAllocationPct())
                         .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                }
            }
        }
        g.setCurrentCorpus(corpus);
    }

    private Map<String, Object> goalToMap(FinancialGoal g) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", g.getId());
        m.put("name", g.getName());
        m.put("goalType", g.getGoalType());
        m.put("category", g.getCategory());
        m.put("priority", g.getPriority());
        m.put("targetAmount", g.getTargetAmount());
        m.put("currentCorpus", g.getCurrentCorpus());
        m.put("monthlyNeed", g.getMonthlyNeed());
        m.put("inflationRate", g.getInflationRate());
        m.put("expectedReturn", g.getExpectedReturn());
        m.put("targetDate", g.getTargetDate());
        m.put("status", g.getStatus());
        m.put("createdAt", g.getCreatedAt());
        return m;
    }

    private void applyBody(Map<String, Object> body, FinancialGoal g) {
        if (body.containsKey("name"))           g.setName(body.get("name").toString());
        if (body.containsKey("goalType"))       g.setGoalType(body.get("goalType").toString());
        // category falls back to goalType if not explicitly sent
        if (body.containsKey("category"))       g.setCategory(body.get("category").toString());
        else if (g.getCategory() == null)       g.setCategory(
            body.containsKey("goalType") ? body.get("goalType").toString() : "General");
        if (body.containsKey("priority"))       g.setPriority(body.get("priority").toString());
        if (body.containsKey("targetAmount"))   g.setTargetAmount(new BigDecimal(body.get("targetAmount").toString()));
        if (body.containsKey("monthlyNeed"))    g.setMonthlyNeed(new BigDecimal(body.get("monthlyNeed").toString()));
        if (body.containsKey("currentCorpus"))  g.setCurrentCorpus(new BigDecimal(body.get("currentCorpus").toString()));
        if (body.containsKey("targetDate"))     g.setTargetDate(LocalDate.parse(body.get("targetDate").toString()));
        if (body.containsKey("inflationRate"))  g.setInflationRate(new BigDecimal(body.get("inflationRate").toString()));
        if (body.containsKey("expectedReturn")) g.setExpectedReturn(new BigDecimal(body.get("expectedReturn").toString()));
        if (body.containsKey("status"))         g.setStatus(body.get("status").toString());
    }
}
