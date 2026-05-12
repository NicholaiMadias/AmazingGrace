/**
 * matrixEconomy.ts — Shared economy/progression foundation for the
 * Matrix of Conscience minigame hub (Phase 1).
 *
 * Handles credits/spending, launch-promotion discounts, Oracle unlock,
 * and daily usage caps. Uses the same localStorage key ("aghl-credits")
 * as the root credits.js module so balances remain consistent across pages.
 *
 * Assumptions (Phase 1):
 * - Donor identity is approximated per-device via localStorage.
 *   A future iteration should verify donor status via Firestore to make
 *   the slot count truly global across all users.
 * - Usage caps reset at midnight (calendar-day boundary, local time).
 * - The expensive image-generator and sandbox features are intentionally
 *   NOT exposed here — only the basic Oracle text-reflection is unlockable.
 *   Add them behind their own flag when they are production-ready.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Launch promotion: first N devices that purchase receive LAUNCH_DISCOUNT_PCT off. */
export const LAUNCH_DONOR_LIMIT = 7;

/** Percentage discount applied during the launch promotion (0–100). */
export const LAUNCH_DISCOUNT_PCT = 90;

/** Base credit cost to unlock Oracle access (before any discount). */
export const ORACLE_BASE_COST = 500;

/**
 * Maximum Oracle invocations allowed per calendar day per device.
 * Guards against runaway usage if the Oracle is later backed by an API.
 */
export const ORACLE_DAILY_CAP = 5;

// ── Storage keys ──────────────────────────────────────────────────────────────

const CREDITS_KEY         = 'aghl-credits';        // shared with root credits.js
const DONOR_COUNT_KEY     = 'aghl-donor-count';    // global slot counter (per-device approx.)
const DONOR_ACCESS_KEY    = 'aghl-donor-access';   // boolean: this device has donor status
const ORACLE_UNLOCKED_KEY = 'aghl-oracle-unlocked';
const ORACLE_USAGE_KEY    = 'aghl-oracle-usage';   // { date: string; count: number }

// ── Numeric safety ────────────────────────────────────────────────────────────

/**
 * Safely coerce an unknown value to a finite number.
 * Mirrors the `toFiniteNumber` pattern used in `useFamilyStats.ts`.
 */
export const toSafeNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

// ── Storage helpers ───────────────────────────────────────────────────────────

function _storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function _read(key: string): string | null {
  return _storage()?.getItem(key) ?? null;
}

function _write(key: string, value: string): void {
  try {
    _storage()?.setItem(key, value);
  } catch {
    // Ignore write failures (e.g., private-browsing quota exceeded).
  }
}

// ── Credits ───────────────────────────────────────────────────────────────────

function _loadCredits(): { total: number } {
  try {
    const raw = _read(CREDITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed !== null && typeof parsed === 'object' && 'total' in parsed) {
        const total = toSafeNumber((parsed as Record<string, unknown>).total);
        if (Number.isFinite(total) && total >= 0) return { total };
      }
    }
  } catch {
    // Ignore corrupt data.
  }
  return { total: 0 };
}

/** Return the current credit balance. */
export function getCredits(): number {
  return _loadCredits().total;
}

/**
 * Deduct `amount` credits. Returns `true` if the purchase succeeded.
 * Uses the same defensive finite-number check as root `credits.js`.
 */
export function spendCredits(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const data = _loadCredits();
  const deduct = Math.floor(amount);
  if (data.total < deduct) return false;
  data.total -= deduct;
  _write(CREDITS_KEY, JSON.stringify(data));
  _dispatchCreditsUpdated(data.total);
  return true;
}

function _dispatchCreditsUpdated(total: number): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('credits:updated', { detail: { total } }));
  }
}

// ── Donor access & launch promotion ──────────────────────────────────────────

function _loadDonorCount(): number {
  try {
    const raw = _read(DONOR_COUNT_KEY);
    if (raw !== null) return Math.max(0, toSafeNumber(JSON.parse(raw) as unknown));
  } catch {
    // Ignore.
  }
  return 0;
}

/** Number of donor-access slots taken (capped at LAUNCH_DONOR_LIMIT). */
export function getDonorAccessCount(): number {
  return Math.min(_loadDonorCount(), LAUNCH_DONOR_LIMIT);
}

/** Whether this device has already claimed donor access. */
export function hasDonorAccess(): boolean {
  return _read(DONOR_ACCESS_KEY) === 'true';
}

/**
 * Whether the launch promotion is still open.
 * Returns false once LAUNCH_DONOR_LIMIT devices have claimed access.
 */
export function isPromoActive(): boolean {
  return getDonorAccessCount() < LAUNCH_DONOR_LIMIT;
}

/**
 * Attempt to claim a donor-access slot for this device.
 * Idempotent: calling again on a device that already has access is a no-op.
 * @returns Information about the claim result.
 */
export function claimDonorAccess(): {
  granted: boolean;
  position: number;
  slotsRemaining: number;
} {
  if (hasDonorAccess()) {
    const count = getDonorAccessCount();
    return { granted: true, position: count, slotsRemaining: LAUNCH_DONOR_LIMIT - count };
  }

  const count = _loadDonorCount();
  if (count >= LAUNCH_DONOR_LIMIT) {
    return { granted: false, position: count, slotsRemaining: 0 };
  }

  const newCount = count + 1;
  _write(DONOR_COUNT_KEY, JSON.stringify(newCount));
  _write(DONOR_ACCESS_KEY, 'true');

  return {
    granted: true,
    position: newCount,
    slotsRemaining: LAUNCH_DONOR_LIMIT - newCount,
  };
}

// ── Oracle unlock ─────────────────────────────────────────────────────────────

/**
 * Effective credit cost to unlock Oracle.
 * The launch discount applies while the promo is active OR this device
 * already has donor access (so existing donors aren't penalised).
 */
export function getOracleCost(): number {
  if (isPromoActive() || hasDonorAccess()) {
    const multiplier = 1 - LAUNCH_DISCOUNT_PCT / 100;
    return Math.max(1, Math.round(ORACLE_BASE_COST * multiplier));
  }
  return ORACLE_BASE_COST;
}

/** Whether this device has unlocked Oracle access. */
export function isOracleUnlocked(): boolean {
  return _read(ORACLE_UNLOCKED_KEY) === 'true';
}

/**
 * Attempt to purchase Oracle access.
 * Automatically claims a donor-access slot if the promo is still open.
 */
export function purchaseOracleAccess(): {
  success: boolean;
  cost: number;
  newBalance: number;
  message: string;
} {
  if (isOracleUnlocked()) {
    return { success: false, cost: 0, newBalance: getCredits(), message: 'Already unlocked.' };
  }

  const cost = getOracleCost();
  const promoWasActive = isPromoActive();

  if (!spendCredits(cost)) {
    return {
      success: false,
      cost,
      newBalance: getCredits(),
      message: `Insufficient credits. You need ${cost} credits.`,
    };
  }

  _write(ORACLE_UNLOCKED_KEY, 'true');

  // Claim a donor slot only once, at purchase time, while the promo was open.
  if (promoWasActive) {
    claimDonorAccess();
  }

  return {
    success: true,
    cost,
    newBalance: getCredits(),
    message: 'Oracle access unlocked! 🔮',
  };
}

// ── Oracle daily usage cap ────────────────────────────────────────────────────

function _loadOracleUsage(): { date: string; count: number } {
  try {
    const raw = _read(ORACLE_USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'date' in parsed &&
        'count' in parsed
      ) {
        const p = parsed as Record<string, unknown>;
        if (typeof p.date === 'string' && typeof p.count === 'number') {
          return { date: p.date, count: toSafeNumber(p.count) };
        }
      }
    }
  } catch {
    // Ignore corrupt data.
  }
  return { date: '', count: 0 };
}

function _todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Number of Oracle invocations used today on this device. */
export function getOracleUsageToday(): number {
  const usage = _loadOracleUsage();
  return usage.date === _todayIso() ? usage.count : 0;
}

/** Whether the user may invoke the Oracle right now (unlocked + cap not reached). */
export function canUseOracle(): boolean {
  return isOracleUnlocked() && getOracleUsageToday() < ORACLE_DAILY_CAP;
}

/**
 * Record one Oracle invocation.
 * Call this each time the user receives an Oracle reflection.
 * @returns Updated invocation count for today.
 */
export function recordOracleUsage(): number {
  const today = _todayIso();
  const usage = _loadOracleUsage();
  const count = (usage.date === today ? usage.count : 0) + 1;
  _write(ORACLE_USAGE_KEY, JSON.stringify({ date: today, count }));
  return count;
}

// ── Feature-request stub (future iteration) ───────────────────────────────────

/**
 * Placeholder for a future feature-request flow.
 *
 * When a player submits an idea they consent to share with the Oracle/Gemini
 * for consideration, this function will persist it locally until it can be
 * submitted for review. For Phase 1, it simply returns the idea for in-memory
 * use; a future iteration can persist/queue it and award bonus credits.
 *
 * @param idea  Player's feature idea text (trimmed).
 * @param consentToShare  Player explicitly consents to sharing the idea.
 * @returns Normalised idea string, or null if invalid.
 */
export function prepareFeatureRequest(
  idea: unknown,
  consentToShare: boolean,
): string | null {
  if (!consentToShare) return null;
  if (typeof idea !== 'string') return null;
  const trimmed = idea.trim();
  return trimmed.length > 0 ? trimmed : null;
}
