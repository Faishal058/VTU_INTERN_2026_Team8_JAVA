package com.wealthwise.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthwise.service.AuthService;
import com.wealthwise.service.PasswordResetService;
import com.wealthwise.model.AppUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController unit tests using standalone MockMvc (no Spring context needed).
 * Uses @ExtendWith(MockitoExtension) + MockMvcBuilders.standaloneSetup so
 * we bypass the @WebMvcTest + byte-buddy restriction on Java 25.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthController — Standalone MockMvc Tests")
class AuthControllerTest {

    @Mock AuthService authService;
    @Mock PasswordResetService passwordResetService;

    @InjectMocks AuthController authController;

    MockMvc mockMvc;
    ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String json(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }

    private AppUser stubUser(String email, String fullName) {
        AppUser u = new AppUser();
        u.setId(UUID.randomUUID());
        u.setEmail(email);
        u.setFullName(fullName);
        u.setPasswordHash("$2a$10$hashed");
        return u;
    }

    // ── GET /api/auth/health ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/auth/health — 200 with status ok")
    void health_returns200() throws Exception {
        mockMvc.perform(get("/api/auth/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.service").value("WealthWise Backend"));
    }

    // ── POST /api/auth/signup ─────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/signup — 200 with token and user on success")
    void signup_success_returns200WithToken() throws Exception {
        AppUser user = stubUser("alice@example.com", "Alice");
        when(authService.signup(anyString(), anyString(), anyString())).thenReturn(user);
        when(authService.generateToken(anyString())).thenReturn("mock.jwt.token");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", "alice@example.com",
                                "password", "password123",
                                "fullName", "Alice"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.user.email").value("alice@example.com"))
                .andExpect(jsonPath("$.user.fullName").value("Alice"));
    }

    @Test
    @DisplayName("POST /api/auth/signup — 400 when email is blank")
    void signup_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "", "password", "password123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is required"));

        verify(authService, never()).signup(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("POST /api/auth/signup — 400 when password shorter than 8 chars")
    void signup_shortPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", "bob@test.com",
                                "password", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password must be at least 8 characters"));
    }

    @Test
    @DisplayName("POST /api/auth/signup — 400 when email already exists")
    void signup_duplicateEmail_returns400() throws Exception {
        // When signup throws, badRequest() is called with e.getMessage()
        doThrow(new RuntimeException("An account with this email already exists"))
                .when(authService).signup(anyString(), anyString(), any());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", "dup@test.com",
                                "password", "password123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — 200 with token on valid credentials")
    void login_success_returns200WithToken() throws Exception {
        AppUser user = stubUser("alice@example.com", "Alice");
        when(authService.login(anyString(), anyString())).thenReturn(user);
        when(authService.generateToken(anyString())).thenReturn("valid.jwt.here");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", "alice@example.com",
                                "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("valid.jwt.here"))
                .andExpect(jsonPath("$.user.email").value("alice@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/login — 401 on wrong credentials")
    void login_wrongCredentials_returns401() throws Exception {
        when(authService.login(anyString(), anyString()))
                .thenThrow(new RuntimeException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", "alice@example.com",
                                "password", "wrongpass"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/auth/login — 400 when email is blank")
    void login_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", " ", "password", "pass1234"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is required"));
    }

    @Test
    @DisplayName("POST /api/auth/login — 400 when password is blank")
    void login_blankPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "alice@test.com", "password", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password is required"));
    }

    // ── POST /api/auth/forgot-password ────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/forgot-password — 200 always (security: no info leak)")
    void forgotPassword_returns200Always() throws Exception {
        doNothing().when(passwordResetService).sendResetLink(anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "someone@test.com"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password — 400 when email is blank")
    void forgotPassword_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is required"));
    }
}
