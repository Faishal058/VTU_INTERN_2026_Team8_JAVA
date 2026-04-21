package com.wealthwise.service;

import com.wealthwise.model.AppUser;
import com.wealthwise.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthService — Unit Tests")
class AuthServiceTest {

    @Mock
    private AppUserRepository userRepo;

    @InjectMocks
    private AuthService authService;

    private final PasswordEncoder realEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        // Inject real BCrypt encoder + fake JWT config via reflection
        ReflectionTestUtils.setField(authService, "passwordEncoder", realEncoder);
        ReflectionTestUtils.setField(authService, "jwtSecret",
                "test-secret-key-which-is-256-bits-long-for-hmac-ok12");
        ReflectionTestUtils.setField(authService, "jwtExpirationMs", 3_600_000L);
    }

    // ── Signup ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("signup() — success: new user is persisted and returned")
    void signup_success() {
        when(userRepo.existsByEmail(anyString())).thenReturn(false);
        when(userRepo.save(any(AppUser.class))).thenAnswer(inv -> {
            AppUser u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        AppUser result = authService.signup("alice@example.com", "password123", "Alice");

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("alice@example.com");
        assertThat(result.getFullName()).isEqualTo("Alice");
        // Password must be encoded, not stored in plain text
        assertThat(result.getPasswordHash()).isNotEqualTo("password123");
        assertThat(realEncoder.matches("password123", result.getPasswordHash())).isTrue();
        verify(userRepo).save(any(AppUser.class));
    }

    @Test
    @DisplayName("signup() — normalises email to lowercase")
    void signup_emailNormalisedToLowercase() {
        when(userRepo.existsByEmail("bob@example.com")).thenReturn(false);
        when(userRepo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        AppUser result = authService.signup("BOB@EXAMPLE.COM", "password123", "Bob");

        assertThat(result.getEmail()).isEqualTo("bob@example.com");
    }

    @Test
    @DisplayName("signup() — duplicate email throws RuntimeException")
    void signup_duplicateEmail_throws() {
        when(userRepo.existsByEmail(anyString())).thenReturn(true);

        assertThatThrownBy(() -> authService.signup("dup@test.com", "password123", "Dup"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already exists");

        verify(userRepo, never()).save(any());
    }

    // ── Login ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login() — success: valid credentials return user")
    void login_success() {
        AppUser stored = new AppUser();
        stored.setId(UUID.randomUUID());
        stored.setEmail("alice@example.com");
        stored.setPasswordHash(realEncoder.encode("secret123"));

        when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.of(stored));

        AppUser result = authService.login("alice@example.com", "secret123");

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("login() — wrong password throws RuntimeException")
    void login_wrongPassword_throws() {
        AppUser stored = new AppUser();
        stored.setEmail("alice@example.com");
        stored.setPasswordHash(realEncoder.encode("correct"));

        when(userRepo.findByEmail("alice@example.com")).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> authService.login("alice@example.com", "wrong"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("login() — unknown email throws RuntimeException")
    void login_unknownEmail_throws() {
        when(userRepo.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("ghost@test.com", "abc"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid email or password");
    }

    // ── JWT ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("generateToken() — returns non-null, non-blank JWT string")
    void generateToken_returnsJwt() {
        String token = authService.generateToken(UUID.randomUUID().toString());

        assertThat(token).isNotBlank();
        // JWT format: three dot-separated Base64 segments
        assertThat(token.split("\\.")).hasSize(3);
    }

    // ── Change / update password ────────────────────────────────────────────

    @Test
    @DisplayName("changePassword() — success updates hash")
    void changePassword_success() {
        UUID id = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(id);
        user.setEmail("alice@example.com");
        user.setPasswordHash(realEncoder.encode("oldPass1"));

        when(userRepo.findById(id)).thenReturn(Optional.of(user));
        when(userRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.changePassword(id.toString(), "oldPass1", "newPass99");

        assertThat(realEncoder.matches("newPass99", user.getPasswordHash())).isTrue();
        verify(userRepo).save(user);
    }

    @Test
    @DisplayName("changePassword() — wrong current password throws")
    void changePassword_wrongCurrentPassword_throws() {
        UUID id = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(id);
        user.setPasswordHash(realEncoder.encode("realPass"));

        when(userRepo.findById(id)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.changePassword(id.toString(), "wrongPass", "newPass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Current password is incorrect");

        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("changePassword() — invalid UUID string throws")
    void changePassword_invalidUuid_throws() {
        assertThatThrownBy(() -> authService.changePassword("not-a-uuid", "old", "new"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid user");
    }
}
