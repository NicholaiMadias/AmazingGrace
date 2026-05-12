/**
 * credits.js — Client-side credit module for the Matrix of Conscience Arcade.
 *
 * Rules (from Matrix Governance):
 *   1 point scored  → 1 credit
 *   $1 donated      → 300 credits
 *
 * Storage: localStorage key "aghl-credits"
 * Exports: getCredits, addCreditsFromPoints, addCreditsFromDonation, spendCredits
 */

const STORAGE_KEY = 'aghl-credits';
const CREDITS_PER_DOLLAR = 300;

/**
 * Read the raw credits object from localStorage.
 * @returns {{ total: number }}
 */
function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.total === 'number' && parsed.total >= 0) return parsed;
    }
  } catch (_) {
    // ignore corrupt data
  }
  return { total: 0 };
}

/**
 * Persist the credits object to localStorage.
 * @param {{ total: number }} data
 */
function _save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // ignore write failures (e.g. private-browsing quota)
  }
}

/**
 * Return the current total credit balance.
 * @returns {number}
 */
export function getCredits() {
  return _load().total;
}

/**
 * Award 1 credit for every point scored.
 * @param {number} points  Raw game score (integer).
 * @returns {number}       New total balance.
 */
export function addCreditsFromPoints(points) {
  if (!Number.isFinite(points) || points <= 0) return getCredits();
  const data = _load();
  data.total += Math.floor(points);
  _save(data);
  _dispatch(data.total);
  return data.total;
}

/**
 * Award 300 credits for every dollar donated.
 * @param {number} dollars  Donation amount in whole dollars.
 * @returns {number}        New total balance.
 */
export function addCreditsFromDonation(dollars) {
  if (!Number.isFinite(dollars) || dollars <= 0) return getCredits();
  const data = _load();
  data.total += Math.floor(dollars) * CREDITS_PER_DOLLAR;
  _save(data);
  _dispatch(data.total);
  return data.total;
}

/**
 * Spend credits on a purchase.  Returns false if balance is insufficient.
 * @param {number} amount  Credits to deduct.
 * @returns {boolean}      true if purchase succeeded.
 */
export function spendCredits(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const data = _load();
  if (data.total < amount) return false;
  data.total -= Math.floor(amount);
  _save(data);
  _dispatch(data.total);
  return true;
}

/**
 * Dispatch a custom DOM event so any live HUD element can react.
 * @param {number} total
 */
function _dispatch(total) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('credits:updated', { detail: { total } }));
  }
}
