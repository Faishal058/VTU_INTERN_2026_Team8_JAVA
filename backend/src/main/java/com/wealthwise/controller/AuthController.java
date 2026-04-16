package com.wealthwise.controller;

import com.wealthwise.model.AppUser;
import com.wealthwise.service.AuthService;
import com.wealthwise.service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String fullName = body.get("fullName");

        if (email == null || email.isBlank()) return badRequest("Email is required");
        if (password == null || password.length() < 8) return badRequest("Password must be at least 8 characters");

        try {
            AppUser user = authService.signup(email, password, fullName);
            String token = authService.generateToken(user.getId().toString());
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("token", token);
            res.put("user", userMap(user));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return badRequest(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank()) return badRequest("Email is required");
        if (password == null || password.isBlank()) return badRequest("Password is required");

        try {
            AppUser user = authService.login(email, password);
            String token = authService.generateToken(user.getId().toString());
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("token", token);
            res.put("user", userMap(user));
            return ResponseEntity.ok(res);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) return badRequest("Email is required");

        try {
            passwordResetService.sendResetLink(email);
            return ResponseEntity.ok(Map.of("message", "Reset link sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("message", "If an account exists with that email, a reset link has been sent"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("password");

        if (token == null || token.isBlank()) return badRequest("Token is required");
        if (newPassword == null || newPassword.length() < 8) return badRequest("Password must be at least 8 characters");

        String email = passwordResetService.validateToken(token);
        if (email == null) return badRequest("Invalid or expired reset token");

        try {
            authService.updatePassword(email, newPassword);
            passwordResetService.invalidateToken(token);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return badRequest(e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body,
                                            org.springframework.security.core.Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 8) return badRequest("New password must be at least 8 characters");
        try {
            authService.changePassword(auth.getName(), currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (RuntimeException e) {
            return badRequest(e.getMessage());
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "WealthWise Backend"));
    }

    private ResponseEntity<?> badRequest(String msg) {
        return ResponseEntity.badRequest().body(Map.of("message", msg));
    }

    private Map<String, Object> userMap(AppUser u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId().toString());
        m.put("email", u.getEmail());
        m.put("fullName", u.getFullName());
        return m;
    }
}
