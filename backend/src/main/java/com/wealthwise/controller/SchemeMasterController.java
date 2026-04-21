package com.wealthwise.controller;

import com.wealthwise.repository.SchemeMasterRepository;
import com.wealthwise.service.AmfiSeedService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * M02 — Scheme Master Controller.
 * Provides autocomplete search for fund names, AMFI trigger, AMC list.
 */
@RestController
@RequestMapping("/api/schemes")
public class SchemeMasterController {

    private static final Logger log = LoggerFactory.getLogger(SchemeMasterController.class);

    private final SchemeMasterRepository repo;
    private final AmfiSeedService seedService;

    public SchemeMasterController(SchemeMasterRepository repo, AmfiSeedService seedService) {
        this.repo = repo;
        this.seedService = seedService;
    }

    /** Autocomplete: GET /api/schemes/search?q=hdfc+bluechip&limit=10 */
    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String q,
                                    @RequestParam(defaultValue = "15") int limit) {
        if (q == null || q.trim().length() < 2)
            return ResponseEntity.ok(java.util.Collections.emptyList());
        log.info("[API] GET /api/schemes/search  q='{}' limit={}", q.trim(), limit);
        var results = repo.searchSchemes(q.trim(), PageRequest.of(0, Math.min(limit, 50)));
        log.info("[API] GET /api/schemes/search  ✔ {} result(s) for '{}'", results.size(), q.trim());
        return ResponseEntity.ok(results);
    }

    /** Get single scheme by AMFI code */
    @GetMapping("/{code}")
    public ResponseEntity<?> get(@PathVariable String code) {
        return repo.findByAmfiCode(code)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** List all unique AMC names */
    @GetMapping("/amcs")
    public ResponseEntity<?> amcs() {
        return ResponseEntity.ok(repo.findAllAmcNames());
    }

    /** Stats: how many schemes are loaded */
    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(Map.of(
            "totalSchemes", repo.count(),
            "activeSchemes", repo.countByIsActiveTrue()
        ));
    }

    /** Admin trigger: re-seed from AMFI. */
    @PostMapping("/seed")
    public ResponseEntity<?> seed() {
        log.info("[API] POST /api/schemes/seed  ▶ AMFI seed triggered");
        long t0 = System.currentTimeMillis();
        var result = seedService.seedFromAmfi();
        log.info("[API] POST /api/schemes/seed  ✔ {}ms  status={} schemes={} navs={} errors={}",
            System.currentTimeMillis() - t0, result.status(),
            result.schemesSaved(), result.navsInserted(), result.errors());
        return ResponseEntity.ok(Map.of(
            "status", result.status(),
            "schemesSaved", result.schemesSaved(),
            "navsInserted", result.navsInserted(),
            "errors", result.errors()
        ));
    }
}
