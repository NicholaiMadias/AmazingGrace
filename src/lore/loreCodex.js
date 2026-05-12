/**
 * loreCodex.js  Lore unlock registry for the Seven Sisters.
 *
 * Merges the per-trigger tracking model (copilot/star-alignment-fix) with
 * the localStorage persistence and UI renderer (main).  Every unlock is
 * validated against STAR_TYPES so only canonical star IDs are accepted.
 *
 * Persisted state shape (localStorage):
 *   { [starId]: { unlocked: true, triggers: string[], firstUnlocked: number } }
 */

import { STAR_TYPES } from '../stars/starMap.js';

/*  Storage helpers  */

const STORAGE_KEY = 'seven_star_lore_unlocks_v2';

function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function loadState() {
    try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return {};
          const parsed = JSON.parse(raw);
          return isPlainObject(parsed) ? parsed : {};
    } catch {
          return {};
    }
}

function saveState(state) {
    try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
          console.warn('[loreCodex] Failed to persist state.', err);
    }
}

/*  Core API  */

/**
 * Unlock lore for a star by a named trigger.
 *
 * Returns `true` the first time a particular star + trigger pair fires,
 * `false` if the pair was already recorded or the starId is invalid.
 *
 * @param {string} starId   One of the canonical STAR_TYPES keys.
 * @param {string} [trigger='event']  Semantic label for what caused the
 *   unlock  e.g. 'match3', 'trial-success', 'matrix-activation'.
 * @returns {boolean} Whether this was a new unlock.
 */
export function unlockLore(starId, trigger = 'event') {
    if (!STAR_TYPES[starId]) return false;

  const state = loadState();
    const entry = state[starId] ?? { unlocked: false, triggers: [], firstUnlocked: null };

  const isNew = !entry.triggers.includes(trigger);

  if (isNew) {
        entry.triggers.push(trigger);
  }

  if (!entry.unlocked) {
        entry.unlocked      = true;
        entry.firstUnlocked = Date.now();
  }

  state[starId] = entry;
    saveState(state);

  return isNew;
}

/**
 * Return true if the given star's lore has been unlocked by any trigger.
 *
 * @param {string} starId
 * @returns {boolean}
 */
export function isLoreUnlocked(starId) {
    const state = loadState();
    return !!(state[starId]?.unlocked);
}

/** @alias isLoreUnlocked  backward-compat name from star-alignment-fix. */
export const isUnlocked = isLoreUnlocked;

/**
 * Return an array of star IDs whose lore is currently unlocked.
 *
 * @returns {string[]}
 */
export function getUnlockedLore() {
    const state = loadState();
    return Object.keys(STAR_TYPES).filter((id) => state[id]?.unlocked);
}

/**
 * Return the STAR_TYPES metadata entry for a star, or null if unknown.
 * Useful for callers that need name / virtue / svg without importing
 * starMap.js directly.
 *
 * @param {string} starId
 * @returns {object|null}
 */
export function getLore(starId) {
    return STAR_TYPES[starId] ?? null;
}

/**
 * Return the set of trigger labels that have unlocked a given star,
 * or an empty array if the star has never been unlocked.
 *
 * @param {string} starId
 * @returns {string[]}
 */
export function getTriggers(starId) {
    const state = loadState();
    return state[starId]?.triggers ?? [];
}

/*  UI renderer  */

/**
 * Render the full lore codex into a container element.
 * Locked entries show a placeholder; unlocked entries show their lore text.
 *
 * @param {HTMLElement} container
 * @param {Record>string, string>} [loreEntries]  starId  lore prose text
 */
export function renderLoreCodex(container, loreEntries) {
    const state = loadState();
    container.innerHTML = '';

  const list = document.createElement('div');
    list.className = 'lore-codex';

  Object.entries(STAR_TYPES).forEach(([id, star]) => {
        const entry    = document.createElement('article');
        entry.className = 'lore-entry';

                                         const unlocked = !!state[id]?.unlocked;
        entry.classList.toggle('lore-entry-locked', !unlocked);

                                         const title = document.createElement('h3');
        title.textContent = `${star.name}  ${star.virtue}`;

                                         const body = document.createElement('p');
        const loreText = loreEntries?.[id] || '';
        body.textContent = unlocked
          ? loreText
                : 'Lore locked. Align with this virtue to reveal its story.';

                                         entry.appendChild(title);
        entry.appendChild(body);
        list.appendChild(entry);
  });

  container.appendChild(list);
}
