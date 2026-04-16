package com.wealthwise.service;

import com.wealthwise.model.AppUser;
import com.wealthwise.repository.AppUserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Date;
import java.util.Optional;

@Service
public class AuthService {

    private final AppUserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    public AuthService(AppUserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public String generateToken(String userId) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(key)
                .compact();
    }

    public AppUser signup(String email, String password, String fullName) {
        if (userRepo.existsByEmail(email)) {
            throw new RuntimeException("An account with this email already exists");
        }
        AppUser user = new AppUser();
        user.setEmail(email.toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setCreatedAt(OffsetDateTime.now());
        user.setUpdatedAt(OffsetDateTime.now());
        return userRepo.save(user);
    }

    public AppUser login(String email, String password) {
        Optional<AppUser> opt = userRepo.findByEmail(email.toLowerCase().trim());
        if (opt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }
        AppUser user = opt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }
        return user;
    }

    public void updatePassword(String email, String newPassword) {
        AppUser user = userRepo.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(OffsetDateTime.now());
        userRepo.save(user);
    }

    public void changePassword(String userId, String currentPassword, String newPassword) {
        java.util.UUID id;
        try { id = java.util.UUID.fromString(userId); } catch (Exception e) { throw new RuntimeException("Invalid user"); }
        AppUser user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (currentPassword != null && !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(OffsetDateTime.now());
        userRepo.save(user);
    }
}
