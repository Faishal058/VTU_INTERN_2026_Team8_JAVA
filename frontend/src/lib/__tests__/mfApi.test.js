/**
 * Unit tests for mfApi.js
 * Uses Vitest's vi.stubGlobal to mock the global fetch function
 * so no real network requests are made.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getLatestNav,
  batchGetNavs,
  searchFunds,
  getNavHistory,
  SCHEME_CODES,
} from '../mfApi.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_LATEST_RESPONSE = {
  meta: {
    scheme_name: 'Mirae Asset Large Cap Fund - Growth',
    fund_house: 'Mirae Asset',
    scheme_category: 'Equity: Large Cap',
  },
  data: [{ date: '21-04-2025', nav: '120.45' }],
  status: 'SUCCESS',
};

const MOCK_HISTORY_RESPONSE = {
  meta: { scheme_name: 'Mirae Asset Large Cap Fund - Growth' },
  data: [
    { date: '21-04-2025', nav: '120.45' },
    { date: '20-04-2025', nav: '119.87' },
    { date: '19-04-2025', nav: '118.50' },
  ],
  status: 'SUCCESS',
};

const MOCK_SEARCH_RESPONSE = [
  { schemeCode: 100033, schemeName: 'Mirae Asset Large Cap Fund - Growth' },
  { schemeCode: 119551, schemeName: 'Parag Parikh Flexi Cap Fund - Growth' },
];

function mockFetch(data) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ── getLatestNav ──────────────────────────────────────────────────────────────

describe('getLatestNav', () => {
  it('returns correct NAV data for valid scheme code', async () => {
    vi.stubGlobal('fetch', mockFetch(MOCK_LATEST_RESPONSE));

    const result = await getLatestNav('100033_nocache');

    expect(result).toBeDefined();
    expect(result.schemeCode).toBe('100033_nocache');
    expect(result.nav).toBe(120.45);
    expect(result.date).toBe('21-04-2025');
    expect(result.schemeName).toContain('Mirae Asset');
  });

  it('throws when API response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn(),
    }));

    await expect(getLatestNav('BAD_CODE_404')).rejects.toThrow('MFAPI error');
  });

  it('throws on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    await expect(getLatestNav('NET_ERR_CODE')).rejects.toThrow();
  });
});

// ── searchFunds ───────────────────────────────────────────────────────────────

describe('searchFunds', () => {
  it('returns an array of matching funds', async () => {
    vi.stubGlobal('fetch', mockFetch(MOCK_SEARCH_RESPONSE));

    const results = await searchFunds('mirae');

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    expect(results[0]).toHaveProperty('schemeCode');
    expect(results[0]).toHaveProperty('schemeName');
  });

  it('limits results to 10 items', async () => {
    const bigList = Array.from({ length: 50 }, (_, i) => ({
      schemeCode: i,
      schemeName: `Fund ${i}`,
    }));
    vi.stubGlobal('fetch', mockFetch(bigList));

    const results = await searchFunds('any');
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('returns empty array when API returns null', async () => {
    vi.stubGlobal('fetch', mockFetch(null));

    const results = await searchFunds('test');
    expect(results).toEqual([]);
  });
});

// ── getNavHistory ─────────────────────────────────────────────────────────────

describe('getNavHistory', () => {
  it('returns parsed and filtered NAV history', async () => {
    vi.stubGlobal('fetch', mockFetch(MOCK_HISTORY_RESPONSE));

    const history = await getNavHistory('HIST_TEST_1');

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    history.forEach((item) => {
      expect(item).toHaveProperty('date');
      expect(item.nav).toBeGreaterThan(0);
    });
  });

  it('returns 3 items matching fixture length', async () => {
    vi.stubGlobal('fetch', mockFetch(MOCK_HISTORY_RESPONSE));

    const history = await getNavHistory('HIST_TEST_2');
    expect(history.length).toBe(3);
  });

  it('throws for non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    }));

    await expect(getNavHistory('ERR_CODE_500')).rejects.toThrow('MFAPI history error');
  });
});

// ── batchGetNavs ──────────────────────────────────────────────────────────────

describe('batchGetNavs', () => {
  it('returns a map of schemeCode → navData', async () => {
    vi.stubGlobal('fetch', mockFetch(MOCK_LATEST_RESPONSE));

    const result = await batchGetNavs(['BATCH_ONLY_1']);

    expect(result).toHaveProperty('BATCH_ONLY_1');
    expect(result['BATCH_ONLY_1'].nav).toBe(120.45);
  });

  it('skips failed fetches, returns only successes', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('First fetch fails'));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_LATEST_RESPONSE),
      });
    }));

    const result = await batchGetNavs(['FAIL_CODE', 'BATCH_GOOD_1']);
    expect(result['FAIL_CODE']).toBeUndefined();
  });
});

// ── SCHEME_CODES constant ─────────────────────────────────────────────────────

describe('SCHEME_CODES', () => {
  it('is a non-empty object', () => {
    expect(typeof SCHEME_CODES).toBe('object');
    expect(Object.keys(SCHEME_CODES).length).toBeGreaterThan(0);
  });

  it('all values are non-empty strings', () => {
    Object.entries(SCHEME_CODES).forEach(([, code]) => {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });
  });
});
