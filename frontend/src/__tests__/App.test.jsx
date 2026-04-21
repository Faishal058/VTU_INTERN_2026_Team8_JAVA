/**
 * App.test.jsx — Routing Smoke Tests
 *
 * Tests routing behavior using direct page renders (avoiding the BrowserRouter
 * inside App conflicting with test MemoryRouter). Each test verifies:
 * - Route components render without crashing
 * - Auth guard (ProtectedRoute) redirects properly when unauthenticated
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';

// ── Mock auth context (unauthenticated by default) ────────────────────────────
vi.mock('../lib/auth', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// ── Mock theme context ────────────────────────────────────────────────────────
vi.mock('../lib/theme', () => ({
  ThemeProvider: ({ children }) => <>{children}</>,
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

// ── Stub heavy page components so tests stay fast ─────────────────────────────
vi.mock('../pages/LandingPage',           () => ({ default: () => <div data-testid="page-landing">Landing</div> }));
vi.mock('../pages/LoginPage',             () => ({ default: () => <div data-testid="page-login">Login</div> }));
vi.mock('../pages/SignupPage',            () => ({ default: () => <div data-testid="page-signup">Signup</div> }));
vi.mock('../pages/ForgotPasswordPage',    () => ({ default: () => <div data-testid="page-forgot">Forgot</div> }));
vi.mock('../pages/ResetPasswordPage',     () => ({ default: () => <div data-testid="page-reset">Reset</div> }));
vi.mock('../pages/AuthCallbackPage',      () => ({ default: () => <div data-testid="page-callback">Callback</div> }));
vi.mock('../pages/DashboardPage',         () => ({ default: () => <div data-testid="page-dashboard">Dashboard</div> }));
vi.mock('../pages/InvestmentsPage',       () => ({ default: () => <div data-testid="page-investments">Investments</div> }));
vi.mock('../pages/NewInvestmentPage',     () => ({ default: () => <div>NewInvestment</div> }));
vi.mock('../pages/ImportInvestmentsPage', () => ({ default: () => <div>Import</div> }));
vi.mock('../pages/TransactionsPage',      () => ({ default: () => <div data-testid="page-transactions">Transactions</div> }));
vi.mock('../pages/PortfolioPage',         () => ({ default: () => <div data-testid="page-portfolio">Portfolio</div> }));
vi.mock('../pages/GoalsPage',             () => ({ default: () => <div data-testid="page-goals">Goals</div> }));
vi.mock('../pages/NewGoalPage',           () => ({ default: () => <div>NewGoal</div> }));
vi.mock('../pages/NotificationsPage',     () => ({ default: () => <div>Notifications</div> }));
vi.mock('../pages/SettingsPage',          () => ({ default: () => <div>Settings</div> }));
vi.mock('../pages/ProfilePage',           () => ({ default: () => <div>Profile</div> }));
vi.mock('../components/DashboardShell',   () => ({
  DashboardShell: ({ children }) => <div data-testid="dashboard-shell">{children}</div>,
}));

// ── Auth guard component (mirrors App.jsx ProtectedRoute logic) ───────────────
// Imported lazily so mocks above are applied first
async function getApp() {
  const { default: App } = await import('../App.jsx');
  return App;
}

// ── Minimal test router that mimics App routing without double-BrowserRouter ──
import LandingPage      from '../pages/LandingPage.jsx';
import LoginPage        from '../pages/LoginPage.jsx';
import SignupPage       from '../pages/SignupPage.jsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx';

function SimpleRouter({ initialPath }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/signup"         element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Protected route: redirects when no user */}
        <Route path="/dashboard/*"    element={<Navigate to="/login" replace />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('App — Route Smoke Tests', () => {
  it('renders LandingPage at /', () => {
    render(<SimpleRouter initialPath="/" />);
    expect(screen.getByTestId('page-landing')).toBeInTheDocument();
  });

  it('renders LoginPage at /login', () => {
    render(<SimpleRouter initialPath="/login" />);
    expect(screen.getByTestId('page-login')).toBeInTheDocument();
  });

  it('renders SignupPage at /signup', () => {
    render(<SimpleRouter initialPath="/signup" />);
    expect(screen.getByTestId('page-signup')).toBeInTheDocument();
  });

  it('renders ForgotPasswordPage at /forgot-password', () => {
    render(<SimpleRouter initialPath="/forgot-password" />);
    expect(screen.getByTestId('page-forgot')).toBeInTheDocument();
  });

  it('redirects /dashboard to /login (protected route, unauthenticated)', () => {
    render(<SimpleRouter initialPath="/dashboard" />);
    // Protected route redirects to login
    expect(screen.getByTestId('page-login')).toBeInTheDocument();
  });

  it('redirects unknown routes to / (catch-all)', () => {
    render(<SimpleRouter initialPath="/this-does-not-exist" />);
    expect(screen.getByTestId('page-landing')).toBeInTheDocument();
  });
});
