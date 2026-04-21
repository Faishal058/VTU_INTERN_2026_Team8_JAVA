package com.wealthwise.controller;

import com.wealthwise.model.UserAlert;
import com.wealthwise.repository.UserAlertRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final UserAlertRepository repo;

    public AlertController(UserAlertRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<UserAlert> list(Authentication auth) {
        return repo.findByUserIdOrderByIsReadAscCreatedAtDesc(UUID.fromString(auth.getName()));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication auth) {
        long count = repo.countByUserIdAndIsReadFalse(UUID.fromString(auth.getName()));
        return Map.of("count", count);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable UUID id, Authentication auth) {
        return repo.findById(id).map(alert -> {
            if (!alert.getUserId().equals(UUID.fromString(auth.getName())))
                return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
            alert.setIsRead(true);
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
