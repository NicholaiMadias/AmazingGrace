/**
 * credits.js — Nexus Credit Manager
 * Repository: NicholaiMadias/Amazing-Grace
 * Path: arcade/js/credits.js
 *
 * Shared ES module + global credit manager.
 * localStorage-backed, GitHub Pages compatible — no backend required.
 * 1 point = 1 credit | 300 credits = $1 donated
 */

const STORAGE_KEY = 'nexus_credits';
const HISTORY_KEY = 'nexus_credit_history';
const CREDITS_PER_DOLLAR = 300;
const CREDITS_PER_POINT = 1;

class NexusCredits {
  constructor() {
    this._listeners = [];
    this._load();
  }

  /* ─── Core Getters ─── */

  get balance() { return this._data.balance; }
  get totalEarned() { return this._data.totalEarned; }
  get totalSpent() { return this._data.totalSpent; }
  get totalDonated() { return this._data.totalDonated; }

  /* ─── Earning ─── */

  /** Award credits from gameplay points */
  earnFromPoints(points, source = 'match-3') {
    const credits = Math.floor(points * CREDITS_PER_POINT);
    if (credits <= 0) return 0;

    this._data.balance += credits;
    this._data.totalEarned += credits;
    this._log('earn', credits, `Points earned in ${source}`);
    this._save();
    this._emit('earn', { credits, source, balance: this._data.balance });
    return credits;
  }

  /** Award credits from donation */
  earnFromDonation(dollars) {
    const credits = Math.floor(dollars * CREDITS_PER_DOLLAR);
    if (credits <= 0) return 0;

    this._data.balance += credits;
    this._data.totalEarned += credits;
    this._data.totalDonated += dollars;
    this._log('donation', credits, `$${dollars} donated`);
    this._save();
    this._emit('donation', { credits, dollars, balance: this._data.balance });
    return credits;
  }

  /** Direct credit award (achievements, bonuses) */
  award(credits, reason = 'bonus') {
    if (credits <= 0) return 0;

    this._data.balance += credits;
    this._data.totalEarned += credits;
    this._log('award', credits, reason);
    this._save();
    this._emit('award', { credits, reason, balance: this._data.balance });
    return credits;
  }

  /* ─── Spending ─── */

  /** Check if player can afford an item */
  canAfford(cost) {
    return this._data.balance >= cost;
  }

  /** Spend credits on a store item */
  spend(cost, itemName = 'item') {
    if (!this.canAfford(cost)) {
      this._emit('insufficientFunds', { cost, balance: this._data.balance, itemName });
      return false;
    }

    this._data.balance -= cost;
    this._data.totalSpent += cost;
    this._log('purchase', -cost, `Purchased: ${itemName}`);
    this._save();
    this._emit('purchase', { cost, itemName, balance: this._data.balance });
    return true;
  }

  /* ─── History ─── */

  getHistory(limit = 50) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return history.slice(-limit);
  }

  /* ─── Events ─── */

  onChange(fn) {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  }

  /* ─── Reset ─── */

  reset() {
    this._data = { balance: 0, totalEarned: 0, totalSpent: 0, totalDonated: 0 };
    localStorage.removeItem(HISTORY_KEY);
    this._save();
    this._emit('reset', { balance: 0 });
  }

  /* ─── Internals ─── */

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._data = raw ? JSON.parse(raw) : {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        totalDonated: 0,
      };
    } catch {
      this._data = { balance: 0, totalEarned: 0, totalSpent: 0, totalDonated: 0 };
    }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
  }

  _log(type, amount, description) {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.push({
        type,
        amount,
        description,
        balance: this._data.balance,
        timestamp: new Date().toISOString(),
      });
      // Keep last 200 entries
      if (history.length > 200) history.splice(0, history.length - 200);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch { /* localStorage full — silent fail */ }
  }

  _emit(event, data) {
    for (const fn of this._listeners) {
      try { fn(event, data); } catch (e) { console.error('[Credits]', e); }
    }
  }
}

/* ─── Singleton ─── */
const credits = new NexusCredits();

// Expose globally for MutationObserver wiring and cross-module access
if (typeof window !== 'undefined') {
  window.NexusCredits = credits;
}

export { NexusCredits, CREDITS_PER_DOLLAR, CREDITS_PER_POINT };
export default credits;
