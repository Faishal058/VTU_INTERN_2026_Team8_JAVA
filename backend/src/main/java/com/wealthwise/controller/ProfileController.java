package com.wealthwise.controller;

import com.wealthwise.model.UserProfile;
import com.wealthwise.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final Logger log = LoggerFactory.getLogger(ProfileController.class);

    private final UserProfileRepository repo;

    public ProfileController(UserProfileRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<?> get(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] GET /api/profile  ▶ user={}", userId);
        return ResponseEntity.ok(repo.findByUserId(userId).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUserId(userId);
            return p;
        }));
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody UserProfile profile, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        log.info("[API] PUT /api/profile  ▶ user={} name={}", userId, profile.getFullName());
        UserProfile existing = repo.findByUserId(userId).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUserId(userId);
            p.setCreatedAt(OffsetDateTime.now());
            return p;
        });
        existing.setFullName(profile.getFullName());
        existing.setPhone(profile.getPhone());
        existing.setUpdatedAt(OffsetDateTime.now());
        var saved = repo.save(existing);
        log.info("[API] PUT /api/profile  ✔ profile updated for user={}", userId);
        return ResponseEntity.ok(saved);
    }
}
