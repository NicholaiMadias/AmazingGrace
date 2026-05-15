/**
 * unlocks.js — Unlock conditions for Sovereign Matrix tools and features.
 *
 * Exports:
 *   computeUnlocks(playerData)           → { [featureId]: boolean }
 *   unlockHint(featureId)                → string
 *   mergeToolUnlocks(userTools, globalTools) → { [toolId]: boolean }
 */

/* ── Feature definitions ─────────────────────────────────────────────────── */

/**
 * Each feature defines:
 *   id        — unique key
 *   label     — display name
 *   hint      — how to unlock it
 *   condition — (playerData) => boolean
 */
const FEATURES = [
  {
    id: 'diagnostics',
    label: 'Diagnostics Console',
    hint: 'Reach level 3 in Match Maker.',
    condition: (p) => (p.level ?? 0) >= 3,
  },
  {
    id: 'nations',
    label: 'Sovereign Nations',
    hint: 'Score 1 000 points in Match Maker.',
    condition: (p) => (p.score ?? 0) >= 1000,
  },
  {
    id: 'visionForge',
    label: 'Vision Forge',
    hint: 'Clear 50 gems and complete a daily challenge.',
    condition: (p) => (p.totalClears ?? 0) >= 50 && !!p.dailyComplete,
  },
  {
    id: 'networkDefense',
    label: 'Network Defense',
    hint: 'Make a 5-match combo.',
    condition: (p) => (p.combo ?? 0) >= 5,
  },
  {
    id: 'matrixAct2',
    label: 'Matrix Act 2',
    hint: 'Trigger 10 explosion specials.',
    condition: (p) => (p.explosions ?? 0) >= 10,
  },
  {
    id: 'starChart',
    label: 'Star Chart',
    hint: 'Play 7 days in a row.',
    condition: (p) => (p.daysPlayed ?? 0) >= 7,
  },
  {
    id: 'bonusGames',
    label: 'Bonus Game Vault',
    hint: 'Support the Voice of Jesus Ministry mission with a donation.',
    condition: (p) => !!p.donationUnlock,
  },
];

/* ── Public API ──────────────────────────────────────────────────────────── */

/**
 * Compute which features are unlocked for the given player data.
 *
 * @param {object} playerData - Object with fields: level, score, totalClears,
 *   dailyComplete, combo, explosions, daysPlayed, donationUnlock.
 * @returns {{ [featureId: string]: boolean }}
 */
export function computeUnlocks(playerData = {}) {
  const result = {};
  for (const feat of FEATURES) {
    result[feat.id] = Boolean(feat.condition(playerData));
  }
  return result;
}

/**
 * Return the hint text that explains how to unlock a feature.
 *
 * @param {string} featureId
 * @returns {string}
 */
export function unlockHint(featureId) {
  const feat = FEATURES.find((f) => f.id === featureId);
  return feat ? feat.hint : 'Complete more challenges to unlock this feature.';
}

/**
 * Merge per-user tool grants with the globally computed unlock map.
 * A tool is accessible if EITHER the global condition is met OR the user
 * has been granted explicit access via the admin dashboard.
 *
 * @param {{ [toolId: string]: boolean }} userTools  - Admin-assigned tool grants.
 * @param {{ [toolId: string]: boolean }} globalTools - Output of computeUnlocks().
 * @returns {{ [toolId: string]: boolean }}
 */
export function mergeToolUnlocks(userTools = {}, globalTools = {}) {
  const merged = {};
  const allKeys = new Set([...Object.keys(userTools), ...Object.keys(globalTools)]);
  for (const key of allKeys) {
    merged[key] = Boolean(userTools[key]) || Boolean(globalTools[key]);
  }
  return merged;
}

/**
 * Load player data from localStorage and return the merged unlock map.
 * Convenience helper for pages that don't manage state externally.
 *
 * @returns {{ [featureId: string]: boolean }}
 */
export function getUnlocksFromStorage() {
  let playerData = {};
  try {
    const saves = JSON.parse(localStorage.getItem('matchmaker-saves') || '{}');
    const slot  = saves.slot1 ?? saves[Object.keys(saves)[0]] ?? {};
    const streak = JSON.parse(localStorage.getItem('mm-streak') || '{}');
    playerData = {
      level:        slot.level        ?? 0,
      score:        slot.score        ?? 0,
      totalClears:  slot.totalClears  ?? 0,
      combo:        slot.combo        ?? 0,
      explosions:   slot.explosions   ?? 0,
      daysPlayed:   streak.streak     ?? 0,
      dailyComplete: localStorage.getItem('dailyComplete') === 'true',
      donationUnlock: localStorage.getItem('donation_unlock') === 'true',
    };
  } catch {
    // Return locked state if storage is unavailable
  }

  const globalTools = computeUnlocks(playerData);

  let userTools = {};
  try {
    const session = JSON.parse(localStorage.getItem('matrixUser') || '{}');
    const users   = JSON.parse(localStorage.getItem('matrix_demo_users') || '{}');
    const uid     = session.uid;
    if (uid && users[uid]?.tools) userTools = users[uid].tools;
  } catch {
    // No user session — use only global unlocks
  }

  return mergeToolUnlocks(userTools, globalTools);
}
