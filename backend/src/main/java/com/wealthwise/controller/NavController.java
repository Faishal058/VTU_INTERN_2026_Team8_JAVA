package com.wealthwise.controller;

import com.wealthwise.model.NavDaily;
import com.wealthwise.repository.NavDailyRepository;
import com.wealthwise.repository.SchemeMasterRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * M03 — NAV Controller.
 * Exposes NAV lookup endpoints.
 */
@RestController
@RequestMapping("/api/nav")
public class NavController {

    private final NavDailyRepository navRepo;
    private final SchemeMasterRepository schemeRepo;

    public NavController(NavDailyRepository navRepo, SchemeMasterRepository schemeRepo) {
        this.navRepo = navRepo;
        this.schemeRepo = schemeRepo;
    }

    /** Latest NAV for a scheme */
    @GetMapping("/{code}/latest")
    public ResponseEntity<?> latest(@PathVariable String code) {
        List<NavDaily> navs = navRepo.findLatestBySchemeCode(code, PageRequest.of(0, 1));
        if (!navs.isEmpty()) return ResponseEntity.ok(navs.get(0));
        // Fallback to scheme_master last_nav
        return schemeRepo.findByAmfiCode(code)
            .map(s -> ResponseEntity.ok(Map.of(
                "schemeCode", code,
                "navDate", s.getLastNavDate() != null ? s.getLastNavDate() : "N/A",
                "navValue", s.getLastNav() != null ? s.getLastNav() : 0
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    /** NAV on or before a specific date */
    @GetMapping("/{code}/{date}")
    public ResponseEntity<?> navOnDate(@PathVariable String code, @PathVariable String date) {
        try {
            LocalDate d = LocalDate.parse(date);
            List<NavDaily> navs = navRepo.findNavOnOrBefore(code, d, PageRequest.of(0, 1));
            if (!navs.isEmpty()) return ResponseEntity.ok(navs.get(0));
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid date format. Use yyyy-MM-dd"));
        }
    }

    /** Last N NAVs for charting */
    @GetMapping("/{code}/history")
    public ResponseEntity<?> history(@PathVariable String code,
                                     @RequestParam(defaultValue = "365") int days) {
        LocalDate from = LocalDate.now().minusDays(days);
        List<NavDaily> navs = navRepo.findNavOnOrBefore(code, LocalDate.now(), PageRequest.of(0, days));
        return ResponseEntity.ok(navs);
    }
}
