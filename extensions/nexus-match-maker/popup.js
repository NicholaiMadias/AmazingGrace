import { createEngine } from './engine/index.js';

const startButton = document.getElementById('start');
const engine = createEngine();

startButton?.addEventListener('click', () => {
  engine.start();
});
