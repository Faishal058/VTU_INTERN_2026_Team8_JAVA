package com.wealthwise.controller;

import com.wealthwise.repository.SchemeMasterRepository;
import com.wealthwise.service.AmfiSeedService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * M02 — Scheme Master Controller.
 * Provides autocomplete search for fund names, AMFI trigger, AMC list.
 */
@RestController
@RequestMapping("/api/schemes")
public class SchemeMasterController {

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
        return ResponseEntity.ok(repo.searchSchemes(q.trim(), PageRequest.of(0, Math.min(limit, 50))));
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
        var result = seedService.seedFromAmfi();
        return ResponseEntity.ok(Map.of(
            "status", result.status(),
            "schemesSaved", result.schemesSaved(),
            "navsInserted", result.navsInserted(),
            "errors", result.errors()
        ));
    }
}
