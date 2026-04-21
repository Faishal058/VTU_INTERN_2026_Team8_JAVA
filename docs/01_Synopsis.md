# WealthWise — Project Synopsis

**Document Version:** 1.0  
**Date:** April 21, 2026  
**Prepared By:** WealthWise Development Team  

---

## 1. Project Title

**WealthWise — Smart Mutual Fund Portfolio Management & Goal Planning Platform**

---

## 2. Problem Statement

India's mutual fund industry manages over ₹65 lakh crore (as of 2026) in Assets Under Management (AUM), with individual retail participation growing at ~18% CAGR. Yet the majority of Indian retail investors face several compounding challenges:

| Challenge | Real-World Impact |
|-----------|-------------------|
| **Fragmented Portfolio Visibility** | Investors hold funds across 5–10 AMCs but have no single dashboard to view consolidated holdings, NAV-weighted returns, or asset allocation in real time. |
| **Lack of Cost-Basis Tracking** | Platforms rarely track FIFO-based lot-level cost-basis, forcing investors to rely on brokerage CAS statements or manual spreadsheets for capital gains computation. |
| **Opaque Tax Implications** | India's bifurcated tax regime (STCG @20% for equity held <1 year; LTCG @12.5% above ₹1.25L exemption for ≥1 year) is poorly understood. Most investors discover tax liabilities post-facto during ITR filing. |
| **No Goal-to-Fund Linkage** | While goal-based investing is the recommended approach, no free tooling allows users to link specific mutual fund holdings to specific financial goals (retirement, child education, house purchase) with real-time progress tracking. |
| **SIP vs. Lumpsum Ambiguity** | Investors lack empirical evidence on whether SIP or lumpsum strategies have worked better for their specific funds and holding periods — leading to suboptimal capital deployment. |
| **Inadequate Risk Profiling** | Most platforms display a static risk score once during onboarding. Portfolio risk (volatility, Sharpe ratio, max drawdown) changes continuously with allocation shifts, but is never surfaced to the investor. |

WealthWise addresses these gaps by providing a **unified, analytics-first platform** that consolidates mutual fund holdings, automates FIFO-based capital gains tracking, enables goal-based financial planning with Monte Carlo simulations, and delivers quantitative risk analytics — all in a single, self-hostable web application.

---

## 3. Objectives

### 3.1 Short-Term Objectives (v1.0 — Current Release)

1. **Consolidated Portfolio Dashboard** — Aggregate holdings across AMCs with live NAV pricing, gain/loss metrics, and XIRR computation per fund and at portfolio level.
2. **Immutable Transaction Ledger** — Record purchases (SIP/Lumpsum), redemptions, switches, STP, SWP, and dividend events with automatic lot creation and FIFO depletion.
3. **CSV Bulk Import** — Parse and normalize CAS-format CSV exports with multi-format date handling, scheme-code auto-resolution, and NAV fallback logic.
4. **Goal-Based Financial Planning** — Define financial goals (Retirement, Child Education, House Purchase, Custom) with inflation-adjusted target amounts, link holdings to goals, and track real-time corpus accumulation.
5. **Monte Carlo Simulation Engine** — Run 10,000-simulation stochastic analyses for goal attainment probability with 10th/50th/90th percentile projections in real (today's money) terms.
6. **FIFO-Based Tax Engine** — Compute STCG/LTCG per redemption transaction, generate FY-wise tax summaries, and provide tax-loss harvesting suggestions.
7. **Portfolio Risk Analytics** — Compute Sharpe ratio, portfolio volatility, max drawdown estimates, diversification scoring, and derived risk appetite.
8. **SIP Intelligence** — Compare actual SIP rupee-cost-averaging outcomes against hypothetical lumpsum scenarios per holding.

### 3.2 Long-Term Objectives (v2.0+)

1. **CAS PDF Auto-Import** — Parse CAMS/KFintech Consolidated Account Statements (PDF) using Apache PDFBox for zero-manual-entry onboarding.
2. **Real-Time Market Data Integration** — Live intraday NAV feeds and market indices (Nifty 50, Sensex) for dynamic portfolio valuation.
3. **AI-Driven Rebalancing Recommendations** — Machine-learning-based asset allocation suggestions based on user risk profile, market regime, and goal timelines.
4. **Push Notification Engine** — Email and in-app alerts for SIP due dates, goal milestones, missed SIP warnings, and tax reminders.
5. **Multi-Currency Support** — Support for NRI investors with USD/GBP/EUR denominated portfolios.
6. **Mobile-First PWA** — Progressive Web App with offline capability and biometric authentication.

---

## 4. Scope of the System

### 4.1 In Scope

| Module | Description |
|--------|-------------|
| **M01 — Authentication** | JWT-based stateless auth with BCrypt password hashing, signup/login, password reset via email token, and password change for authenticated users. |
| **M02 — Scheme Master** | AMFI registry (~45,000 mutual fund schemes) with trigram-based fuzzy search, category/plan-type metadata, and automated daily sync from AMFI data feeds. |
| **M03 — NAV Engine** | Daily NAV storage with historical lookups, per-scheme NAV history for charting, and fallback to scheme_master.last_nav when daily data is unavailable. |
| **M06 — Transactions** | CRUD for investment transactions with automatic lot creation (BUY) and FIFO depletion (SELL). Supports 11 transaction types: PURCHASE_LUMPSUM, PURCHASE_SIP, REDEMPTION, SWITCH_IN/OUT, STP_IN/OUT, SWP, DIVIDEND_PAYOUT, DIVIDEND_REINVEST, REVERSAL. |
| **M08 — Holdings & XIRR** | Real-time portfolio holdings aggregated from active lots, with per-fund and portfolio-level XIRR using Newton-Raphson numerical method. |
| **M10 — Portfolio Analytics** | Asset allocation breakdown, portfolio risk scoring (SEBI riskometer 1–6 weighted by value), growth timeline, and risk profile with Sharpe/volatility/max-drawdown. |
| **M15 — Goal Planner** | Goal CRUD with link-fund capability (many-to-many goals ↔ funds), real-time corpus calculation from linked holdings, and allocation percentage per link. |
| **M16 — Projection Engine** | Deterministic future value projection with sensitivity analysis (lower returns, missed SIPs, higher inflation scenarios). |
| **M17 — Monte Carlo Engine** | 10,000-run stochastic simulation with Gaussian return distribution, inflation-adjusted target matching, and percentile-based reporting. |
| **M18 — Tax Engine** | FY-based STCG/LTCG summary, taxable transaction listing with per-transaction gain breakdown, and CSV export for CA/ITR filing. |
| **M19 — Tax Harvesting** | Unrealised loss identification across active lots for tax-loss harvesting recommendations. |
| **M21 — SIP Intelligence** | Per-fund SIP vs. lumpsum comparison using actual lot-level cost-basis data. |
| **M24 — Notification & Alerts** | In-app alert system with severity levels (Info/Watch/Action), unread count badge, and per-alert read/delete management. |
| **M25 — Settings** | Notification preference management (SIP due, goal milestones, daily digest, market alerts, missed SIP, tax reminders). |
| **M26 — User Profile** | Extended KYC info (name, phone, PAN, DOB, risk tolerance, nominee details, avatar). |

### 4.2 Out of Scope (Current Version)

- Direct mutual fund order execution (buy/sell via BSE StAR or AMFI platforms)
- Real-time stock/ETF tracking (equity shares, debentures, bonds)
- Bank account aggregation (Account Aggregator framework integration)
- Multi-tenancy / advisor-client hierarchy
- Regulatory compliance reporting (SEBI/AMFI mandated disclosures)

---

## 5. Key Features Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                     WealthWise Feature Map                       │
├───────────────────┬───────────────────────────────────────────────┤
│ Authentication    │ JWT signup/login, password reset, BCrypt      │
│ Transactions      │ Manual entry, CSV import, 11 types, FIFO     │
│ Portfolio         │ Consolidated holdings, XIRR, gain/loss       │
│ Analytics         │ Risk profile, Sharpe, volatility, drawdown   │
│ Goals             │ Goal planner, fund linking, corpus tracking   │
│ Projections       │ Deterministic + Monte Carlo (10K sims)       │
│ Tax               │ STCG/LTCG summary, harvest suggestions, CSV  │
│ SIP Intelligence  │ SIP vs lumpsum backtesting per fund          │
│ Notifications     │ In-app alerts with severity & read tracking  │
│ Settings          │ Notification preferences, profile management │
│ Scheme Search     │ 45K+ funds, trigram fuzzy search              │
│ NAV Engine        │ Historical NAV, live pricing, chart data     │
└───────────────────┴───────────────────────────────────────────────┘
```

---

## 6. Technology Stack

### 6.1 Technology Architecture Summary

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend Framework** | React | 19.2.4 | Component-based UI with concurrent features, modern hooks API |
| **Build Tool** | Vite | 8.0.4 | Sub-second HMR, native ESM, 10–100× faster than Webpack |
| **Routing** | React Router DOM | 7.14.0 | Declarative routing with nested layouts, route guards |
| **UI Animation** | Framer Motion | 12.38.0 | Performant spring-physics animations, layout transitions |
| **Charts** | Recharts | 3.8.1 | Declarative SVG charting with responsive containers |
| **Icons** | Lucide React | 1.8.0 | Tree-shakeable SVG icons, consistent design language |
| **State/Auth** | React Context + Custom Hooks | — | Lightweight state management, no Redux overhead |
| **Backend Framework** | Spring Boot | 3.2.3 | Auto-configured embedded Tomcat, production-grade defaults |
| **Language** | Java | 17 (LTS) | Records, sealed classes, pattern matching, module system |
| **ORM** | Spring Data JPA / Hibernate | — | Type-safe repository pattern, automatic query generation |
| **Security** | Spring Security | — | Stateless JWT filter chain, BCrypt password encoding |
| **Database** | PostgreSQL | 15+ | JSONB support, pg_trgm for fuzzy search, ACID compliance |
| **Caching** | Caffeine | — | High-performance in-memory cache for NAV/scheme lookups |
| **JWT Library** | jjwt | 0.12.5 | Industry-standard JWT creation/validation |
| **PDF Parsing** | Apache PDFBox | 3.0.1 | CAS PDF statement parsing (future CAS import feature) |
| **Containerization** | Docker | — | Single-command deployment with `Dockerfile` |
| **Testing (Backend)** | JUnit 5 + Mockito + H2 | — | In-memory DB for integration tests, no external dependencies |
| **Testing (Frontend)** | Vitest + Testing Library | — | Unit tests co-located with components |
| **Testing (E2E)** | Playwright | 1.49.1 | Cross-browser E2E tests with auto-waiting, video recording |
| **Email** | Spring Boot Starter Mail | — | SMTP-based password reset links |

### 6.2 Architecture Pattern

**Client-Server Architecture** with clear separation:

```
┌─────────────┐     HTTPS/REST      ┌──────────────┐      JDBC       ┌────────────┐
│   Vite/React │ ──────────────────▶ │  Spring Boot  │ ─────────────▶ │ PostgreSQL │
│   SPA Client │ ◀────── JSON ────── │   REST API    │ ◀───────────── │  Database  │
└─────────────┘                      └──────────────┘                 └────────────┘
                                            │
                                            ▼ HTTPS
                                     ┌──────────────┐
                                     │  AMFI / MFAPI │
                                     │ (External NAV)│
                                     └──────────────┘
```

### 6.3 External API Integrations

| API | Purpose | Endpoint Pattern |
|-----|---------|-----------------|
| **MFAPI.in** | Real-time NAV & scheme metadata | `https://api.mfapi.in/mf/{schemeCode}` |
| **AMFI Data Feed** | Daily scheme master sync (~45K funds) | `https://www.amfiindia.com/spages/NAVAll.txt` |
| **SMTP (Gmail/SendGrid)** | Transactional email for password resets | Configurable via `application.properties` |

---

## 7. Expected Outcomes

1. A functional, self-hostable mutual fund portfolio management platform suitable for individual Indian retail investors.
2. Accurate FIFO-based cost-basis tracking eliminating the need for manual spreadsheets.
3. Quantitative goal-planning tools (Monte Carlo + deterministic) enabling data-driven financial decisions.
4. Tax-ready STCG/LTCG reports reducing dependency on chartered accountants for basic capital gains computation.
5. A comprehensive, well-documented REST API surface enabling future mobile app development or third-party integrations.

---

*End of Synopsis Document*
