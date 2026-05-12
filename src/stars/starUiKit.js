/**
 * starUiKit.js — High-level rendering helpers for Pleiades star UI components.
 * Builds on createStarTile() and STAR_TYPES from the core star modules.
 */

import { createStarTile } from './StarTile.js';
import { STAR_TYPES } from './starMap.js';
import './starTiles.css';

/**
 * Render a horizontal strip of star tiles into a container element.
 *
 * @param {HTMLElement} container
 * @param {{ order?: string[], size?: number, interactive?: boolean }} [options]
 */
export function renderStarStrip(container, options = {}) {
  const order = options.order || Object.keys(STAR_TYPES);
  const size = options.size || 56;

  container.innerHTML = '';
  const strip = document.createElement('div');
  strip.className = 'star-strip';

  order.forEach((id) => {
    const tile = createStarTile(id, { size, interactive: !!options.interactive });
    strip.appendChild(tile);
  });

  container.appendChild(strip);
}

/**
 * Render a star badge (tile + name/virtue/spectral meta) into a container element.
 *
 * @param {HTMLElement} container
 * @param {string} starId
 */
export function renderStarBadge(container, starId) {
  const star = STAR_TYPES[starId];
  if (!star) return;

  container.innerHTML = '';
  const badge = document.createElement('div');
  badge.className = 'star-badge';

  const tile = createStarTile(starId, { size: 64 });

  const meta = document.createElement('div');
  meta.className = 'star-badge-meta';

  const nameEl = document.createElement('div');
  nameEl.className = 'star-badge-name';
  nameEl.textContent = star.name;

  const virtueEl = document.createElement('div');
  virtueEl.className = 'star-badge-virtue';
  virtueEl.textContent = star.virtue;

  const spectralEl = document.createElement('div');
  spectralEl.className = 'star-badge-spectral';
  spectralEl.textContent = `Type ${star.spectralType}`;

  meta.appendChild(nameEl);
  meta.appendChild(virtueEl);
  meta.appendChild(spectralEl);

  badge.appendChild(tile);
  badge.appendChild(meta);
  container.appendChild(badge);
}
