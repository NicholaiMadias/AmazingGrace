/**
 * matrix.js — Matrix of Conscience grid renderer.
 * Renders an interactive 7-star grid; clicking a tile unlocks its lore
 * and plays the star-resonance animation.
 */

import { createStarTile } from '../../stars/StarTile.js';
import '../../stars/starTiles.css';
import { unlockLore } from '../../lore/loreCodex.js';
import { STAR_TYPES } from '../../stars/starMap.js';

const MATRIX_STARS = [
  'electra', 'taygete', 'alcyone', 'maia', 'celaeno', 'sterope', 'merope'
];

/** Number of columns in the matrix grid layout */
const GRID_COLS = 4;

/**
 * Render the Matrix of Conscience star grid into a container element.
 * Tiles are fully keyboard-accessible: Tab to enter, arrow keys to navigate,
 * Enter or Space to activate.
 *
 * @param {HTMLElement} container
 * @param {string|null} [activeStarId]  — star to animate immediately on render
 */
export function renderMatrix(container, activeStarId = null) {
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'matrix-grid';

  /** @type {HTMLElement[]} */
  const tiles = [];

  MATRIX_STARS.forEach((id, index) => {
    const star = STAR_TYPES[id];
    const tile = createStarTile(id, { size: 96, interactive: true });

    // Button semantics for keyboard and screen-reader users
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `${star.name} — ${star.virtue}`);

    const activate = () => {
      unlockLore(id, 'matrix-activation');
      animateStar(tile);
    };

    tile.addEventListener('click', activate);

    tile.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          activate();
          break;
        case 'ArrowRight':
          e.preventDefault();
          tiles[index + 1]?.focus();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          tiles[index - 1]?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          tiles[index + GRID_COLS]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          tiles[index - GRID_COLS]?.focus();
          break;
      }
    });

    if (id === activeStarId) {
      requestAnimationFrame(() => animateStar(tile));
    }

    tiles.push(tile);
    grid.appendChild(tile);
  });

  container.appendChild(grid);
}

function animateStar(tile) {
  const inner = tile.querySelector('.star-tile-inner');
  if (!inner) return;
  inner.classList.remove('star-resonance');
  void inner.offsetWidth;
  inner.classList.add('star-resonance');
}
