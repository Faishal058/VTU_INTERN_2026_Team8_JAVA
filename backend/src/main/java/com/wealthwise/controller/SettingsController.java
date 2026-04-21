package com.wealthwise.controller;

import com.wealthwise.model.NotificationPreferences;
import com.wealthwise.repository.NotificationPreferencesRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private static final Logger log = LoggerFactory.getLogger(SettingsController.class);

    private final NotificationPreferencesRepository repo;

    public SettingsController(NotificationPreferencesRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<?> get(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] GET /api/settings  ▶ user={}", userId);
        return ResponseEntity.ok(repo.findByUserId(userId).orElseGet(() -> {
            NotificationPreferences np = new NotificationPreferences();
            np.setUserId(userId);
            return np;
        }));
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody NotificationPreferences prefs, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] PUT /api/settings  ▶ user={}", userId);
        NotificationPreferences existing = repo.findByUserId(userId).orElseGet(() -> {
            NotificationPreferences np = new NotificationPreferences();
            np.setUserId(userId);
            np.setCreatedAt(OffsetDateTime.now());
            return np;
        });
        existing.setSipDueInApp(prefs.getSipDueInApp());
        existing.setSipDueEmail(prefs.getSipDueEmail());
        existing.setGoalMilestonesInApp(prefs.getGoalMilestonesInApp());
        existing.setGoalMilestonesEmail(prefs.getGoalMilestonesEmail());
        existing.setDailyDigestEmail(prefs.getDailyDigestEmail());
        existing.setMarketAlertsInApp(prefs.getMarketAlertsInApp());
        existing.setUpdatedAt(OffsetDateTime.now());
        var saved = repo.save(existing);
        log.info("[API] PUT /api/settings  ✔ preferences saved for user={}", userId);
        return ResponseEntity.ok(saved);
    }
}
