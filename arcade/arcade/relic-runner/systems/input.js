// Centralized keyboard + mouse input system for Relic Runner

const keyState = new Set();
const listeners = {
  keydown: [],
  keyup: [],
  mousemove: [],
  mousedown: [],
  mouseup: [],
  click: [],
  wheel: [],
  tileClick: [],
  tileHover: []
};

let initialized = false;
let canvas = null;
let boardConfig = {
  rows: 8,
  cols: 8,
  padding: 20,
  tileSize: 64
};

// --- Public API ---

export function initInput(options = {}) {
  if (initialized) return;
  if (options.canvas) canvas = options.canvas;
  if (options.boardConfig) boardConfig = { ...boardConfig, ...options.boardConfig };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("click", handleClick);
  window.addEventListener("wheel", handleWheel, { passive: true });
  initialized = true;
}

export function destroyInput() {
  if (!initialized) return;
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mousedown", handleMouseDown);
  window.removeEventListener("mouseup", handleMouseUp);
  window.removeEventListener("click", handleClick);
  window.removeEventListener("wheel", handleWheel);
  keyState.clear();
  initialized = false;
}

export function on(event, handler) {
  if (!listeners[event]) {
    console.warn(`Unknown input event: ${event}`);
    return;
  }
  listeners[event].push(handler);
}

export function off(event, handler) {
  if (!listeners[event]) return;
  const idx = listeners[event].indexOf(handler);
  if (idx >= 0) listeners[event].splice(idx, 1);
}

export function isKeyDown(code) {
  return keyState.has(code);
}

export function setBoardConfig(config) {
  boardConfig = { ...boardConfig, ...config };
}

// --- Internal handlers ---

function handleKeyDown(e) {
  if (!keyState.has(e.code)) {
    keyState.add(e.code);
    emit("keydown", e);
  }
}

function handleKeyUp(e) {
  keyState.delete(e.code);
  emit("keyup", e);
}

function handleMouseMove(e) {
  const pos = getCanvasPos(e);
  emit("mousemove", { event: e, ...pos });

  const tile = getTileFromPos(pos);
  if (tile) emit("tileHover", { ...tile, ...pos, event: e });
}

function handleMouseDown(e) {
  const pos = getCanvasPos(e);
  emit("mousedown", { event: e, ...pos });
}

function handleMouseUp(e) {
  const pos = getCanvasPos(e);
  emit("mouseup", { event: e, ...pos });
}

function handleClick(e) {
  const pos = getCanvasPos(e);
  emit("click", { event: e, ...pos });

  const tile = getTileFromPos(pos);
  if (tile) emit("tileClick", { ...tile, ...pos, event: e });
}

function handleWheel(e) {
  emit("wheel", e);
}

// --- Helpers ---

function emit(event, payload) {
  if (!listeners[event]) return;
  for (const handler of listeners[event]) {
    handler(payload);
  }
}

function getCanvasPos(e) {
  if (!canvas) return { x: e.clientX, y: e.clientY };
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function getTileFromPos({ x, y }) {
  if (!canvas) return null;

  const { rows, cols, padding, tileSize } = boardConfig;
  const boardWidth = cols * tileSize;
  const boardHeight = rows * tileSize;

  const paddedBoardWidth = boardWidth + padding * 2;
  const paddedBoardHeight = boardHeight + padding * 2;
  const startX = (canvas.width - paddedBoardWidth) / 2 + padding;
  const startY = (canvas.height - paddedBoardHeight) / 2 + padding;

  const bx = x - startX;
  const by = y - startY;

  if (bx < 0 || by < 0 || bx >= boardWidth || by >= boardHeight) return null;

  const col = Math.floor(bx / tileSize);
  const row = Math.floor(by / tileSize);

  if (row < 0 || row >= rows || col < 0 || col >= cols) return null;

  return { row, col };
}
