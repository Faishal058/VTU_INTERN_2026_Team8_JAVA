/**
 * Unit tests for goalHelpers.js
 * Tests all pure utility functions: futureValue, yearsUntil,
 * recommendedSIP, getAllocationSuggestion, formatINR, GOAL_TYPES.
 */

import { describe, it, expect } from 'vitest';
import {
  GOAL_TYPES,
  getAllocationSuggestion,
  futureValue,
  yearsUntil,
  recommendedSIP,
  formatINR,
} from '../goalHelpers.js';

// ── GOAL_TYPES constant ───────────────────────────────────────────────────────

describe('GOAL_TYPES', () => {
  it('should contain 8 goal types', () => {
    expect(GOAL_TYPES).toHaveLength(8);
  });

  it('each goal type has required fields', () => {
    GOAL_TYPES.forEach((goal) => {
      expect(goal).toHaveProperty('type');
      expect(goal).toHaveProperty('icon');
      expect(goal).toHaveProperty('label');
      expect(goal).toHaveProperty('inflationRate');
      expect(goal).toHaveProperty('suggestedYears');
      expect(goal).toHaveProperty('expectedReturn');
    });
  });

  it('includes RETIREMENT type', () => {
    const retirement = GOAL_TYPES.find((g) => g.type === 'RETIREMENT');
    expect(retirement).toBeDefined();
    expect(retirement.priority).toBe(undefined); // no priority on the object itself
  });
});

// ── getAllocationSuggestion ───────────────────────────────────────────────────

describe('getAllocationSuggestion', () => {
  it('returns Aggressive Growth for > 10 years', () => {
    const result = getAllocationSuggestion(15);
    expect(result.equity).toBe(80);
    expect(result.debt).toBe(20);
    expect(result.label).toBe('Aggressive Growth');
  });

  it('returns Balanced Growth for > 5 and <= 10 years', () => {
    const result = getAllocationSuggestion(7);
    expect(result.equity).toBe(60);
    expect(result.debt).toBe(40);
    expect(result.label).toBe('Balanced Growth');
  });

  it('returns Conservative Growth for > 3 and <= 5 years', () => {
    const result = getAllocationSuggestion(4);
    expect(result.equity).toBe(40);
    expect(result.debt).toBe(60);
    expect(result.label).toBe('Conservative Growth');
  });

  it('returns Capital Preservation for > 1 and <= 3 years', () => {
    const result = getAllocationSuggestion(2);
    expect(result.equity).toBe(20);
    expect(result.debt).toBe(80);
    expect(result.label).toBe('Capital Preservation');
  });

  it('returns Liquid / Debt Only for <= 1 year', () => {
    const result = getAllocationSuggestion(0.5);
    expect(result.equity).toBe(0);
    expect(result.debt).toBe(100);
    expect(result.label).toBe('Liquid / Debt Only');
  });

  it('boundary: exactly 10 years → Balanced Growth (not Aggressive)', () => {
    const result = getAllocationSuggestion(10);
    expect(result.label).toBe('Balanced Growth');
  });

  it('boundary: exactly 1 year → Liquid / Debt Only', () => {
    const result = getAllocationSuggestion(1);
    expect(result.label).toBe('Liquid / Debt Only');
  });
});

// ── futureValue ───────────────────────────────────────────────────────────────

describe('futureValue', () => {
  it('calculates correct compound future value', () => {
    // FV = 100,000 × (1.12)^10 ≈ 310,585
    const result = futureValue(100_000, 0.12, 10);
    expect(result).toBeCloseTo(310584.82, 0);
  });

  it('returns PV unchanged when years = 0', () => {
    expect(futureValue(50_000, 0.12, 0)).toBe(50_000);
  });

  it('returns 0 when pv is 0', () => {
    expect(futureValue(0, 0.12, 10)).toBe(0);
  });

  it('returns PV when pv is null/falsy', () => {
    // falsy pv → returns pv || 0
    expect(futureValue(null, 0.12, 10)).toBe(0);
  });

  it('returns PV when years is negative (edge case)', () => {
    // years <= 0 → returns pv
    const result = futureValue(10_000, 0.12, -1);
    expect(result).toBe(10_000);
  });

  it('handles 0% rate (no growth)', () => {
    const result = futureValue(10_000, 0, 5);
    expect(result).toBeCloseTo(10_000, 0);
  });
});

// ── yearsUntil ────────────────────────────────────────────────────────────────

describe('yearsUntil', () => {
  it('returns 0 for null/empty date', () => {
    expect(yearsUntil(null)).toBe(0);
    expect(yearsUntil('')).toBe(0);
  });

  it('returns approximately 1 for a date ~1 year in future', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = yearsUntil(future.toISOString().slice(0, 10));
    expect(result).toBeGreaterThan(0.9);
    expect(result).toBeLessThan(1.1);
  });

  it('returns approximately 5 for a date ~5 years away', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 5);
    const result = yearsUntil(future.toISOString().slice(0, 10));
    expect(result).toBeGreaterThan(4.9);
    expect(result).toBeLessThan(5.1);
  });

  it('returns 0 for a past date (floored at 0)', () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 2);
    const result = yearsUntil(past.toISOString().slice(0, 10));
    expect(result).toBe(0);
  });
});

// ── recommendedSIP ────────────────────────────────────────────────────────────

describe('recommendedSIP', () => {
  it('calculates correct SIP for given FV, rate, and years', () => {
    // To accumulate ₹1,000,000 in 10 years at 12% per annum
    const fv = 1_000_000;
    const annualRate = 0.12;
    const years = 10;
    const sip = recommendedSIP(fv, annualRate, years);

    // SIP should be positive and a reasonable monthly amount
    expect(sip).toBeGreaterThan(0);
    expect(sip).toBeLessThan(fv); // monthly SIP < target value
    // Well-known: ~₹4,347/month for this scenario
    expect(sip).toBeCloseTo(4347, -1);
  });

  it('returns raw FV when years is 0', () => {
    const result = recommendedSIP(500_000, 0.12, 0);
    expect(result).toBe(500_000);
  });

  it('returns FV as-is when rate is 0 (no compounding)', () => {
    // When rate=0: r=0, so the function returns fv*0/(0) → falls to sip * n branch
    // But sip is the parameter fv here — looking at implementation:
    // r = 0/12 = 0; the condition r <= 0 returns fv (the first arg) directly
    // Actually when r=0, (1+r)^n-1 = 0 so the whole expression returns fv||0
    // Implementation: if (n <= 0 || r <= 0) return fv || 0;
    const result = recommendedSIP(120_000, 0, 10);
    // Returns fv directly when rate is 0
    expect(result).toBe(120_000);
  });

  it('returns higher SIP for shorter time horizon', () => {
    const sipShort = recommendedSIP(1_000_000, 0.12, 5);
    const sipLong  = recommendedSIP(1_000_000, 0.12, 15);
    expect(sipShort).toBeGreaterThan(sipLong);
  });
});

// ── formatINR ─────────────────────────────────────────────────────────────────

describe('formatINR', () => {
  it('returns "—" for null', () => {
    expect(formatINR(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatINR(undefined)).toBe('—');
  });

  it('returns "—" for non-numeric string', () => {
    expect(formatINR('abc')).toBe('—');
  });

  it('formats crore correctly', () => {
    expect(formatINR(10_000_000)).toBe('₹1.00 Cr');
    expect(formatINR(25_000_000)).toBe('₹2.50 Cr');
  });

  it('formats lakh correctly', () => {
    expect(formatINR(100_000)).toBe('₹1.00 L');
    expect(formatINR(250_000)).toBe('₹2.50 L');
  });

  it('formats thousands correctly', () => {
    expect(formatINR(5000)).toBe('₹5.0K');
    expect(formatINR(12_500)).toBe('₹12.5K');
  });

  it('formats small values as plain INR', () => {
    expect(formatINR(500)).toBe('₹500');
    expect(formatINR(0)).toBe('₹0');
  });

  it('handles negative values (losses)', () => {
    // -₹1.5 lakh → negative crore/lakh format
    const result = formatINR(-150_000);
    expect(result).toContain('-');
    expect(result).toContain('L');
  });

  it('accepts string numbers', () => {
    expect(formatINR('500000')).toBe('₹5.00 L');
  });

  it('boundary: exactly 1000 → K format', () => {
    expect(formatINR(1000)).toBe('₹1.0K');
  });

  it('boundary: exactly 100000 → L format', () => {
    expect(formatINR(100000)).toBe('₹1.00 L');
  });
});
