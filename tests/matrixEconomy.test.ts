import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── localStorage mock (node environment) ──────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem:    (key: string) => store[key] ?? null,
  setItem:    (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear:      () => { Object.keys(store).forEach((k) => delete store[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);

// Import *after* stubbing so the module sees the mock.
const {
  toSafeNumber,
  getCredits,
  spendCredits,
  getDonorAccessCount,
  hasDonorAccess,
  isPromoActive,
  claimDonorAccess,
  getOracleCost,
  isOracleUnlocked,
  purchaseOracleAccess,
  getOracleUsageToday,
  canUseOracle,
  recordOracleUsage,
  prepareFeatureRequest,
  LAUNCH_DONOR_LIMIT,
  LAUNCH_DISCOUNT_PCT,
  ORACLE_BASE_COST,
  ORACLE_DAILY_CAP,
} = await import('../src/economy/matrixEconomy.ts');

// ── Helpers ───────────────────────────────────────────────────────────────────

function seedCredits(total: number) {
  store['aghl-credits'] = JSON.stringify({ total });
}

// ── toSafeNumber ──────────────────────────────────────────────────────────────

describe('toSafeNumber', () => {
  it('returns the value when it is a finite number', () => {
    expect(toSafeNumber(42)).toBe(42);
    expect(toSafeNumber(0)).toBe(0);
    expect(toSafeNumber(-7)).toBe(-7);
  });

  it('returns the fallback for non-finite numbers', () => {
    expect(toSafeNumber(Infinity)).toBe(0);
    expect(toSafeNumber(-Infinity)).toBe(0);
    expect(toSafeNumber(NaN)).toBe(0);
  });

  it('returns the fallback for non-numeric types', () => {
    expect(toSafeNumber('5')).toBe(0);
    expect(toSafeNumber(null)).toBe(0);
    expect(toSafeNumber(undefined)).toBe(0);
    expect(toSafeNumber({})).toBe(0);
  });

  it('uses a custom fallback when supplied', () => {
    expect(toSafeNumber('bad', 99)).toBe(99);
    expect(toSafeNumber(NaN, -1)).toBe(-1);
  });
});

// ── Credits ───────────────────────────────────────────────────────────────────

describe('getCredits', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('returns 0 when no credits are stored', () => {
    expect(getCredits()).toBe(0);
  });

  it('returns the stored total', () => {
    seedCredits(250);
    expect(getCredits()).toBe(250);
  });

  it('returns 0 for corrupted storage', () => {
    store['aghl-credits'] = '{bad json}';
    expect(getCredits()).toBe(0);
  });
});

describe('spendCredits', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('deducts the amount and returns true on success', () => {
    seedCredits(100);
    expect(spendCredits(40)).toBe(true);
    expect(getCredits()).toBe(60);
  });

  it('returns false when balance is insufficient', () => {
    seedCredits(10);
    expect(spendCredits(50)).toBe(false);
    expect(getCredits()).toBe(10);
  });

  it('returns false for non-positive amounts', () => {
    seedCredits(100);
    expect(spendCredits(0)).toBe(false);
    expect(spendCredits(-5)).toBe(false);
    expect(getCredits()).toBe(100);
  });

  it('returns false for non-finite amounts', () => {
    seedCredits(100);
    expect(spendCredits(NaN)).toBe(false);
    expect(spendCredits(Infinity)).toBe(false);
  });

  it('floors fractional amounts', () => {
    seedCredits(100);
    expect(spendCredits(9.9)).toBe(true);
    expect(getCredits()).toBe(91); // Math.floor(9.9) = 9 deducted
  });
});

// ── Donor access & promotion ──────────────────────────────────────────────────

describe('donor access & promotion', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('LAUNCH_DONOR_LIMIT equals 7', () => {
    expect(LAUNCH_DONOR_LIMIT).toBe(7);
  });

  it('LAUNCH_DISCOUNT_PCT equals 90', () => {
    expect(LAUNCH_DISCOUNT_PCT).toBe(90);
  });

  it('getDonorAccessCount returns 0 initially', () => {
    expect(getDonorAccessCount()).toBe(0);
  });

  it('hasDonorAccess returns false initially', () => {
    expect(hasDonorAccess()).toBe(false);
  });

  it('isPromoActive returns true when no slots are taken', () => {
    expect(isPromoActive()).toBe(true);
  });

  it('claimDonorAccess grants a slot and sets hasDonorAccess', () => {
    const result = claimDonorAccess();
    expect(result.granted).toBe(true);
    expect(result.position).toBe(1);
    expect(result.slotsRemaining).toBe(6);
    expect(hasDonorAccess()).toBe(true);
  });

  it('claimDonorAccess is idempotent — returns same result on second call', () => {
    claimDonorAccess();
    const second = claimDonorAccess();
    expect(second.granted).toBe(true);
    // Position should still be 1 (same device; no new slot incremented)
    expect(getDonorAccessCount()).toBe(1);
  });

  it('isPromoActive returns false after all slots are taken', () => {
    // Simulate 7 different devices by directly writing the count.
    store['aghl-donor-count'] = JSON.stringify(7);
    expect(isPromoActive()).toBe(false);
  });

  it('claimDonorAccess returns granted=false when slots are exhausted', () => {
    store['aghl-donor-count'] = JSON.stringify(7);
    const result = claimDonorAccess();
    expect(result.granted).toBe(false);
    expect(result.slotsRemaining).toBe(0);
  });
});

// ── Oracle cost & unlock ──────────────────────────────────────────────────────

describe('getOracleCost', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('applies the 90% discount when the promo is active', () => {
    const discountedCost = Math.max(1, Math.round(ORACLE_BASE_COST * (1 - LAUNCH_DISCOUNT_PCT / 100)));
    expect(getOracleCost()).toBe(discountedCost);
    expect(getOracleCost()).toBe(50); // 500 * 0.10 = 50
  });

  it('applies the discount for a device with donor access even after promo closes', () => {
    store['aghl-donor-count'] = JSON.stringify(7);    // promo slots full
    store['aghl-donor-access'] = 'true';               // but this device is a donor
    expect(getOracleCost()).toBe(50);
  });

  it('charges full price when promo is inactive and no donor access', () => {
    store['aghl-donor-count'] = JSON.stringify(7);
    expect(getOracleCost()).toBe(ORACLE_BASE_COST);
    expect(getOracleCost()).toBe(500);
  });
});

describe('isOracleUnlocked', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('returns false initially', () => {
    expect(isOracleUnlocked()).toBe(false);
  });

  it('returns true after setting the key', () => {
    store['aghl-oracle-unlocked'] = 'true';
    expect(isOracleUnlocked()).toBe(true);
  });
});

describe('purchaseOracleAccess', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('succeeds when sufficient credits exist during promo', () => {
    seedCredits(100);                          // promo cost is 50
    const result = purchaseOracleAccess();
    expect(result.success).toBe(true);
    expect(result.cost).toBe(50);
    expect(isOracleUnlocked()).toBe(true);
    expect(hasDonorAccess()).toBe(true);        // donor slot claimed
    expect(getDonorAccessCount()).toBe(1);
  });

  it('returns success=false when balance is too low', () => {
    seedCredits(10);                           // need 50
    const result = purchaseOracleAccess();
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/insufficient/i);
    expect(isOracleUnlocked()).toBe(false);
  });

  it('returns success=false and correct message when already unlocked', () => {
    seedCredits(600);
    purchaseOracleAccess();                    // first purchase
    const second = purchaseOracleAccess();
    expect(second.success).toBe(false);
    expect(second.message).toMatch(/already unlocked/i);
  });

  it('does NOT claim a donor slot when promo is already closed', () => {
    store['aghl-donor-count'] = JSON.stringify(7);  // promo closed
    seedCredits(600);
    const result = purchaseOracleAccess();
    expect(result.success).toBe(true);
    expect(result.cost).toBe(500);              // full price
    // Donor slot count should not have increased
    expect(getDonorAccessCount()).toBe(7);
    expect(hasDonorAccess()).toBe(false);        // not a donor
  });
});

// ── Oracle usage cap ──────────────────────────────────────────────────────────

describe('Oracle usage cap', () => {
  beforeEach(() => { localStorageMock.clear(); });

  it('ORACLE_DAILY_CAP equals 5', () => {
    expect(ORACLE_DAILY_CAP).toBe(5);
  });

  it('getOracleUsageToday returns 0 initially', () => {
    expect(getOracleUsageToday()).toBe(0);
  });

  it('canUseOracle returns false when Oracle is not unlocked', () => {
    expect(canUseOracle()).toBe(false);
  });

  it('canUseOracle returns true when unlocked and cap not reached', () => {
    store['aghl-oracle-unlocked'] = 'true';
    expect(canUseOracle()).toBe(true);
  });

  it('recordOracleUsage increments usage count', () => {
    store['aghl-oracle-unlocked'] = 'true';
    expect(recordOracleUsage()).toBe(1);
    expect(recordOracleUsage()).toBe(2);
    expect(getOracleUsageToday()).toBe(2);
  });

  it('canUseOracle returns false once the daily cap is reached', () => {
    store['aghl-oracle-unlocked'] = 'true';
    const today = new Date().toISOString().slice(0, 10);
    store['aghl-oracle-usage'] = JSON.stringify({ date: today, count: ORACLE_DAILY_CAP });
    expect(canUseOracle()).toBe(false);
  });

  it('usage resets for a different date', () => {
    store['aghl-oracle-usage'] = JSON.stringify({ date: '2000-01-01', count: 99 });
    expect(getOracleUsageToday()).toBe(0);
  });
});

// ── Feature request stub ──────────────────────────────────────────────────────

describe('prepareFeatureRequest', () => {
  it('returns null when consent is false', () => {
    expect(prepareFeatureRequest('My idea', false)).toBeNull();
  });

  it('returns null for empty/whitespace ideas', () => {
    expect(prepareFeatureRequest('', true)).toBeNull();
    expect(prepareFeatureRequest('   ', true)).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(prepareFeatureRequest(42, true)).toBeNull();
    expect(prepareFeatureRequest(null, true)).toBeNull();
    expect(prepareFeatureRequest(undefined, true)).toBeNull();
  });

  it('returns trimmed idea when valid and consent given', () => {
    expect(prepareFeatureRequest('  My great idea  ', true)).toBe('My great idea');
  });
});
