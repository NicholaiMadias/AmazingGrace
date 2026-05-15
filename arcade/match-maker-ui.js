import {
  createInitialGrid,
  canSwap,
  swapGems,
  findMatches,
  applyGravity,
} from './matchMakerState.js';

const ROWS = 8;
const COLS = 8;
const GEM_SIZE = 60;
const SWAP_ANIM_DURATION = 200;
const POINTS_PER_GEM = 10;

const COLOR_MAP = {
  red: '#e74c3c', blue: '#3498db', green: '#2ecc71',
  yellow: '#f1c40f', purple: '#9b59b6', orange: '#e67e22',
};
const ICON_MAP = {
  red: '♦', blue: '●', green: '★',
  yellow: '▲', purple: '■', orange: '♥',
};

let grid = [];
let selected = null;
let score = 0;
let isAnimating = false;
let boardEl, scoreEl;

// ── Drag state ───────────────────────────────────────────────────
let draggedGem = null; // { r, c, el }

function injectDragCSS() {
  if (document.getElementById('mm-drag-styles')) return;
  const style = document.createElement('style');
  style.id = 'mm-drag-styles';
  style.textContent = `
    .mm-gem {
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      cursor: grab;
    }
    .mm-gem.dragging {
      opacity: 0.45;
      transform: scale(0.88);
      cursor: grabbing;
    }
    .mm-gem.drag-over-target {
      border: 2px solid #4ade80;
      border-radius: 8px;
      box-shadow: 0 0 10px #4ade80;
      transform: scale(1.07);
      transition: all 0.15s ease-in-out;
    }
    .mm-gem.mm-selected {
      box-shadow: 0 0 0 3px #fff, 0 0 0 5px #f1c40f;
    }
    .mm-gem.mm-pop {
      animation: mmPop 0.3s ease forwards;
    }
    @keyframes mmPop {
      0%   { transform: scale(1);   opacity: 1; }
      50%  { transform: scale(1.3); opacity: 0.6; }
      100% { transform: scale(0);   opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export function initMatchMakerUI(containerEl) {
  injectDragCSS();

  containerEl.innerHTML = `
    <div class="match-maker-wrapper">
      <h2 class="match-maker-title">Match Maker</h2>
      <div class="match-maker-score-bar">
        <span>Score: </span><span id="mm-score">0</span>
      </div>
      <div id="mm-board" class="match-maker-board"></div>
      <button id="mm-restart" class="match-maker-btn">Restart</button>
    </div>
  `;

  boardEl  = containerEl.querySelector('#mm-board');
  scoreEl  = containerEl.querySelector('#mm-score');
  containerEl.querySelector('#mm-restart').addEventListener('click', restart);

  boardEl.style.setProperty('--cols', COLS);
  boardEl.style.setProperty('--gem-size', GEM_SIZE + 'px');
  restart();
}

function restart() {
  score = 0; selected = null; isAnimating = false; draggedGem = null;
  scoreEl.textContent = '0';
  grid = createInitialGrid(ROWS, COLS);
  while (findMatches(grid).length > 0) { grid = createInitialGrid(ROWS, COLS); }
  renderBoard();
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'mm-gem';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.setAttribute('draggable', 'true');
      applyGemStyle(cell, grid[r][c]);

      if (selected && selected.r === r && selected.c === c) {
        cell.classList.add('mm-selected');
      }

      // ── Click (existing behaviour) ───────────────────────────
      cell.addEventListener('click', () => onGemClick(r, c));

      // ── Drag events ──────────────────────────────────────────
      cell.addEventListener('dragstart', handleDragStart);
      cell.addEventListener('dragover',  handleDragOver);
      cell.addEventListener('dragenter', handleDragEnter);
      cell.addEventListener('dragleave', handleDragLeave);
      cell.addEventListener('drop',      handleDrop);
      cell.addEventListener('dragend',   handleDragEnd);

      boardEl.appendChild(cell);
    }
  }
}

// ── Drag handlers ────────────────────────────────────────────────

function handleDragStart(e) {
  if (isAnimating) { e.preventDefault(); return; }
  draggedGem = { r: +this.dataset.r, c: +this.dataset.c, el: this };
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (draggedGem && this !== draggedGem.el) {
    this.classList.add('drag-over-target');
  }
}

function handleDragLeave() {
  this.classList.remove('drag-over-target');
}

async function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove('drag-over-target');

  if (!draggedGem || this === draggedGem.el || isAnimating) return;

  const r1 = draggedGem.r, c1 = draggedGem.c;
  const r2 = +this.dataset.r,  c2 = +this.dataset.c;

  if (!canSwap(r1, c1, r2, c2)) return; // not adjacent — silently ignore

  selected = null;
  isAnimating = true;
  renderBoard();

  await animateSwap(r1, c1, r2, c2);
  swapGems(grid, r1, c1, r2, c2);

  const matches = findMatches(grid);
  if (matches.length === 0) {
    // Invalid swap — swap back
    await animateSwap(r2, c2, r1, c1);
    swapGems(grid, r2, c2, r1, c1);
    isAnimating = false;
    renderBoard();
    return;
  }

  await processMatches();
  isAnimating = false;
  renderBoard();
}

function handleDragEnd() {
  document.querySelectorAll('.mm-gem').forEach(g => {
    g.classList.remove('dragging', 'drag-over-target');
  });
  draggedGem = null;
}

// ── Existing engine (unchanged) ──────────────────────────────────

function applyGemStyle(cell, color) {
  cell.style.background = COLOR_MAP[color] || '#ccc';
  cell.textContent = ICON_MAP[color] || '';
  cell.dataset.color = color;
}

function getCell(r, c) {
  return boardEl.querySelector(`.mm-gem[data-r="${r}"][data-c="${c}"]`);
}

async function onGemClick(r, c) {
  if (isAnimating) return;
  if (!selected) { selected = { r, c }; renderBoard(); return; }

  const { r: r1, c: c1 } = selected;
  if (r1 === r && c1 === c) { selected = null; renderBoard(); return; }
  if (!canSwap(r1, c1, r, c)) { selected = { r, c }; renderBoard(); return; }

  selected = null;
  isAnimating = true;
  renderBoard();

  await animateSwap(r1, c1, r, c);
  swapGems(grid, r1, c1, r, c);

  const matches = findMatches(grid);
  if (matches.length === 0) {
    await animateSwap(r, c, r1, c1);
    swapGems(grid, r, c, r1, c1);
    isAnimating = false;
    renderBoard();
    return;
  }

  await processMatches();
  isAnimating = false;
  renderBoard();
}

async function processMatches() {
  let matches = findMatches(grid);
  while (matches.length > 0) {
    score += matches.length * POINTS_PER_GEM;
    scoreEl.textContent = score;
    await animateClear(matches);
    for (const { r, c } of matches) { grid[r][c] = null; }
    renderBoard();
    await delay(150);
    applyGravity(grid);
    renderBoard();
    await delay(300);
    matches = findMatches(grid);
  }
}

function animateSwap(r1, c1, r2, c2) {
  return new Promise((resolve) => {
    const cell1 = getCell(r1, c1);
    const cell2 = getCell(r2, c2);
    if (!cell1 || !cell2) { resolve(); return; }
    const dx = (c2 - c1) * GEM_SIZE;
    const dy = (r2 - r1) * GEM_SIZE;
    cell1.style.transition = `transform ${SWAP_ANIM_DURATION}ms ease`;
    cell2.style.transition = `transform ${SWAP_ANIM_DURATION}ms ease`;
    cell1.style.transform  = `translate(${dx}px, ${dy}px)`;
    cell2.style.transform  = `translate(${-dx}px, ${-dy}px)`;
    setTimeout(() => {
      cell1.style.transition = ''; cell1.style.transform = '';
      cell2.style.transition = ''; cell2.style.transform = '';
      resolve();
    }, SWAP_ANIM_DURATION);
  });
}

function animateClear(matches) {
  return new Promise((resolve) => {
    for (const { r, c } of matches) {
      const cell = getCell(r, c);
      if (cell) cell.classList.add('mm-pop');
    }
    setTimeout(resolve, 300);
  });
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
