/**
 * starMapRenderer.js — SVG constellation renderer for the Seven Sisters.
 * Draws connecting lines and interactive star nodes in a viewBox coordinate space.
 */

import { STAR_TYPES } from './starMap.js';

const CONSTELLATION_POINTS = {
  electra:  { x: 10, y: 30 },
  taygete:  { x: 22, y: 18 },
  alcyone:  { x: 36, y: 14 },
  maia:     { x: 50, y: 20 },
  celaeno:  { x: 44, y: 32 },
  sterope:  { x: 30, y: 38 },
  merope:   { x: 18, y: 40 }
};

const ORDER = Object.keys(CONSTELLATION_POINTS);

/**
 * Render a Pleiades constellation SVG into a container element.
 * Star nodes are keyboard-accessible and emit a `star-select` CustomEvent
 * on the SVG element when activated (click or Enter/Space).
 * Alternatively pass `options.onSelect(id, star)` for a direct callback.
 *
 * @param {HTMLElement} container
 * @param {{
 *   width?: number,
 *   height?: number,
 *   onSelect?: (id: string, star: object) => void
 * }} [options]
 */
export function renderStarConstellation(container, options = {}) {
  const width = options.width || 320;
  const height = options.height || 200;

  container.innerHTML = '';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 48');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Pleiades constellation map');
  svg.classList.add('star-constellation');

  for (let i = 0; i < ORDER.length - 1; i++) {
    const a = CONSTELLATION_POINTS[ORDER[i]];
    const b = CONSTELLATION_POINTS[ORDER[i + 1]];
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', a.x);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x);
    line.setAttribute('y2', b.y);
    line.classList.add('star-constellation-line');
    line.dataset.from = ORDER[i];
    line.dataset.to = ORDER[i + 1];
    svg.appendChild(line);
  }

  ORDER.forEach((id) => {
    const star = STAR_TYPES[id];
    const p = CONSTELLATION_POINTS[id];

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', '1.4');
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('role', 'button');
    circle.classList.add('star-constellation-node', `star-node-${id}`);
    circle.dataset.starId = id;
    circle.dataset.virtue = star.virtue;

    // Accessible label via SVG <title>
    const title = document.createElementNS(svgNS, 'title');
    title.textContent = `${star.name} — ${star.virtue}`;
    circle.appendChild(title);

    const activate = () => {
      svg.dispatchEvent(new CustomEvent('star-select', {
        bubbles: true,
        detail: { id, star }
      }));
      options.onSelect?.(id, star);
    };

    circle.addEventListener('click', activate);
    circle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });

    svg.appendChild(circle);
  });

  container.appendChild(svg);
}
