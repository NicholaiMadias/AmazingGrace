import { STAR_TYPES } from '../../stars/starMap.js';
import { attachDragSwap, isAdjacent } from '../../../js/matchmaker.js';

const detachByContainer = new WeakMap();

/**
 * Renders the Star Match board. Supports click-select-click and
 * mouse/touch drag-to-swap; both call onSwap({x, y}, {x, y}).
 */
export function renderBoard(container, engine, onSwap) {
  const prev = detachByContainer.get(container);
  if (prev) prev();

  container.innerHTML = '';
  container.classList.add('match3-grid');
  let selected = null;

  engine.board.forEach((row, y) => {
    row.forEach((tile, x) => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'star-tile' + (tile.special ? ` special-${tile.special}` : '');
      cell.dataset.r = y;
      cell.dataset.c = x;
      cell.setAttribute('aria-label', STAR_TYPES[tile.starId]?.name || tile.starId);
      cell.innerHTML = `<img class="star-tile-inner" src="${STAR_TYPES[tile.starId]?.gem || ''}" alt="" draggable="false">`;
      cell.addEventListener('click', () => {
        if (!selected) {
          selected = { x, y };
          cell.classList.add('selected');
          return;
        }
        const first = selected;
        selected = null;
        if (first.x === x && first.y === y) {
          cell.classList.remove('selected');
        } else if (isAdjacent(first.y, first.x, y, x)) {
          container.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
          onSwap(first, { x, y });
        } else {
          container.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
          selected = { x, y };
          cell.classList.add('selected');
        }
      });
      container.appendChild(cell);
    });
  });

  const detach = attachDragSwap(container, {
    cellAt: (el) => ({ r: Number(el.dataset.r), c: Number(el.dataset.c) }),
    onSwap: (a, b) => {
      selected = null;
      container.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
      onSwap({ x: a.c, y: a.r }, { x: b.c, y: b.r });
    },
  });
  detachByContainer.set(container, detach);
  return detach;
}
