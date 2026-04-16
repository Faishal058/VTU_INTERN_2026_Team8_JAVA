package com.wealthwise.controller;

import com.wealthwise.model.UserProfile;
import com.wealthwise.repository.UserProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserProfileRepository repo;

    public ProfileController(UserProfileRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<?> get(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(repo.findByUserId(userId).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUserId(userId);
            return p;
        }));
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody UserProfile profile, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        UserProfile existing = repo.findByUserId(userId).orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setUserId(userId);
            p.setCreatedAt(OffsetDateTime.now());
            return p;
        });
        existing.setFullName(profile.getFullName());
        existing.setPhone(profile.getPhone());
        existing.setUpdatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(repo.save(existing));
    }
}
