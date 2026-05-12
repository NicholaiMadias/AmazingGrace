import { STAR_TYPES } from '../../stars/starMap.js';

export const CONSTELLATION_ORDER = [
  'electra',
  'taygete',
  'alcyone',
  'maia',
  'celaeno',
  'sterope',
  'merope',
];

export const CONSTELLATION_PROGRESS_KEY = 'aghl_constellation_progress_v1';

/**
 * Normalize a stored progress value into a safe prefix of CONSTELLATION_ORDER.
 * - Ensures entries are canonical STAR_TYPES keys
 * - Ensures order is a prefix of CONSTELLATION_ORDER (enables deterministic line animation)
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeConstellationProgress(value) {
  if (!Array.isArray(value)) return [];

  const wanted = CONSTELLATION_ORDER;
  const out = [];
  for (let i = 0; i < wanted.length; i++) {
    const id = wanted[i];
    if (!STAR_TYPES[id]) break;
    if (value[i] !== id) break;
    out.push(id);
  }
  return out;
}

/**
 * @param {{ getItem: (k: string) => string | null }} storage
 * @returns {string[]}
 */
export function loadConstellationProgress(storage) {
  try {
    const raw = storage.getItem(CONSTELLATION_PROGRESS_KEY);
    if (!raw) return [];
    return normalizeConstellationProgress(JSON.parse(raw));
  } catch {
    return [];
  }
}

/**
 * @param {{ setItem: (k: string, v: string) => void }} storage
 * @param {string[]} progress
 */
export function saveConstellationProgress(storage, progress) {
  try {
    storage.setItem(CONSTELLATION_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore persistence failures (private mode / quota).
  }
}

/**
 * Return the next star id that can be trial-completed (the first missing
 * element in the canonical order), or `null` when all stars are complete.
 *
 * @param {string[]} progress
 * @returns {string|null}
 */
export function getNextTrialStar(progress) {
  const safe = normalizeConstellationProgress(progress);
  if (safe.length >= CONSTELLATION_ORDER.length) return null;
  return CONSTELLATION_ORDER[safe.length];
}

/**
 * Attempt to record a completed trial for a star.
 * Only succeeds if it matches the next expected star in the progression.
 *
 * @param {string[]} progress
 * @param {string} starId
 * @returns {{ next: string[], changed: boolean }}
 */
export function completeTrial(progress, starId) {
  const safe = normalizeConstellationProgress(progress);
  const expected = getNextTrialStar(safe);
  if (expected === null) return { next: safe, changed: false };
  if (starId !== expected) return { next: safe, changed: false };
  return { next: [...safe, starId], changed: true };
}

/**
 * Compute a subtle RGB tint that can be applied as a background overlay.
 *
 * @param {number} completedCount
 * @param {number} total
 * @returns {{ rgb: string, opacity: number }}
 */
export function computeConscienceTint(completedCount, total) {
  const t = total > 0 ? Math.max(0, Math.min(1, completedCount / total)) : 0;

  // Interpolate between a deep neon-purple and neon-cyan.
  const a = { r: 188, g: 19, b: 254 };
  const b = { r: 0, g: 242, b: 255 };
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);

  // Keep the tint very subtle; scale with completion.
  const opacity = 0.06 + t * 0.14;
  return { rgb: `${r} ${g} ${bl}`, opacity };
}

