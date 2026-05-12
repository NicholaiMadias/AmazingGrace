/**
 * StarTile.js — factory for interactive Pleiades star tile DOM elements.
 * Usage:
 *   import { createStarTile } from './stars/StarTile.js';
 *   const tile = createStarTile('electra', { size: 72, interactive: true });
 *   boardCell.appendChild(tile);
 *
 * CSS states (toggle via classList):
 *   .matched         — play match-flash animation
 *   .chain-active    — play chain-resonance animation
 *   .idle-pulse      — continuous breathing glow (for hints / idle stars)
 */

import { STAR_TYPES } from './starMap.js';

/**
 * @param {string} type  — key from STAR_TYPES (e.g. 'electra')
 * @param {{ size?: number, interactive?: boolean }} [options]
 * @returns {HTMLDivElement}
 */
export function createStarTile(type, options = {}) {
  const star = STAR_TYPES[type];
  if (!star) {
    console.warn(`Unknown star type: ${type}`);
    return document.createElement('div');
  }

  const size = options.size || 64;
  const el = document.createElement('div');
  el.className = `star-tile star-${star.id}`;
  el.style.setProperty('--star-tile-size', `${size}px`);

  el.innerHTML = `
    <div class="star-tile-inner" data-virtue="${star.virtue}">
      <img src="${star.svg}" alt="${star.name} — ${star.virtue}">
    </div>
  `;

  if (options.interactive) {
    el.classList.add('star-tile-interactive');
  }

  return el;
}
