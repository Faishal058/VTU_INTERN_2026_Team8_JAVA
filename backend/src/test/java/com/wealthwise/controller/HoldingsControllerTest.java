package com.wealthwise.controller;

import com.wealthwise.service.AnalyticsService;
import com.wealthwise.service.HoldingsService;
import com.wealthwise.service.XirrService;
import com.wealthwise.repository.InvestmentLotRepository;
import com.wealthwise.repository.InvestmentTransactionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * HoldingsController direct unit tests (no MockMvc).
 *
 * Calls controller methods directly, passing a mocked Authentication.
 * This avoids the Java 25 byte-buddy + MockMvc Security integration issue.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("HoldingsController — Direct Unit Tests")
class HoldingsControllerTest {

    @Mock HoldingsService holdingsService;
    @Mock XirrService xirrService;
    @Mock AnalyticsService analyticsService;
    @Mock InvestmentLotRepository lotRepo;
    @Mock InvestmentTransactionRepository txRepo;

    @InjectMocks HoldingsController holdingsController;

    UUID testUserId;
    Authentication testAuth;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testAuth = new UsernamePasswordAuthenticationToken(
                testUserId.toString(), null,
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> bodyAsList(ResponseEntity<?> resp) {
        return (List<Map<String, Object>>) resp.getBody();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> bodyAsMap(ResponseEntity<?> resp) {
        return (Map<String, Object>) resp.getBody();
    }

    private HoldingsService.Holding sampleHolding() {
        return new HoldingsService.Holding(
                "100033",
                "Mirae Asset Large Cap Fund",
                "Mirae Asset",
                "Equity - Large Cap",
                "Growth",
                3,
                BigDecimal.valueOf(100.5),
                BigDecimal.valueOf(183.25),
                BigDecimal.valueOf(18325),
                BigDecimal.valueOf(200.0),
                LocalDate.now(),
                BigDecimal.valueOf(20100),
                BigDecimal.valueOf(1775),
                9.69,
                List.of()
        );
    }

    // ── list() ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("list() — returns 200 with empty list for user with no holdings")
    void list_emptyPortfolio_returns200EmptyList() {
        when(holdingsService.getHoldings(testUserId)).thenReturn(List.of());

        ResponseEntity<?> resp = holdingsController.list(testAuth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> body = bodyAsList(resp);
        assertThat(body).isEmpty();
    }

    @Test
    @DisplayName("list() — returns 200 with one holding mapped to response")
    void list_withOneHolding_returns200WithData() {
        when(holdingsService.getHoldings(testUserId)).thenReturn(List.of(sampleHolding()));

        ResponseEntity<?> resp = holdingsController.list(testAuth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> body = bodyAsList(resp);
        assertThat(body).hasSize(1);
        assertThat(body.get(0)).containsEntry("schemeCode", "100033");
        assertThat(body.get(0)).containsEntry("fundName", "Mirae Asset Large Cap Fund");
    }

    // ── summary() ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("summary() — returns 200 with zero totals for empty portfolio")
    void summary_emptyPortfolio_returns200WithZeroTotals() {
        when(holdingsService.getHoldings(testUserId)).thenReturn(List.of());

        ResponseEntity<?> resp = holdingsController.summary(testAuth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = bodyAsMap(resp);
        assertThat(body).containsKey("totalInvested");
        assertThat(body).containsKey("currentValue");
        assertThat(body).containsEntry("fundCount", 0);
    }

    @Test
    @DisplayName("summary() — fundCount equals number of unique holdings")
    void summary_withOneHolding_fundCountIsOne() {
        when(holdingsService.getHoldings(testUserId)).thenReturn(List.of(sampleHolding()));

        ResponseEntity<?> resp = holdingsController.summary(testAuth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = bodyAsMap(resp);
        assertThat(body).containsEntry("fundCount", 1);
    }

    // ── deleteHolding() ───────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteHolding() — returns 200 with message and schemeCode")
    void deleteHolding_returns200WithSchemeCode() {
        ResponseEntity<?> resp = holdingsController.deleteHolding("100033", testAuth);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = bodyAsMap(resp);
        assertThat(body).containsEntry("message", "Holding deleted");
        assertThat(body).containsEntry("schemeCode", "100033");
    }
}
