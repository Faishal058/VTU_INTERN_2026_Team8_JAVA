package com.wealthwise.controller;

import com.wealthwise.model.UserAlert;
import com.wealthwise.repository.UserAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private static final Logger log = LoggerFactory.getLogger(AlertController.class);

    private final UserAlertRepository repo;

    public AlertController(UserAlertRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<UserAlert> list(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] GET /api/alerts  ▶ user={}", userId);
        var alerts = repo.findByUserIdOrderByIsReadAscCreatedAtDesc(userId);
        log.info("[API] GET /api/alerts  ✔ {} alert(s) returned", alerts.size());
        return alerts;
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        long count = repo.countByUserIdAndIsReadFalse(userId);
        log.info("[API] GET /api/alerts/unread-count  user={} unread={}", userId, count);
        return Map.of("count", count);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable UUID id, Authentication auth) {
        log.info("[API] PATCH /api/alerts/{}/read  ▶ user={}", id, auth.getName());
        return repo.findById(id).map(alert -> {
            if (!alert.getUserId().equals(UUID.fromString(auth.getName())))
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            alert.setIsRead(true);
            log.info("[API] PATCH /api/alerts/{}/read  ✔ marked read", id);
            return ResponseEntity.ok(repo.save(alert));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id, Authentication auth) {
        return repo.findById(id).map(alert -> {
            if (!alert.getUserId().equals(UUID.fromString(auth.getName())))
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            repo.delete(alert);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
