import { initMatchMakerUI } from "./match-maker-ui.js";

const app = document.getElementById("app");

// Render a simple game-selection screen with Match Maker
app.innerHTML = `
  <header class="arcade-header">
    <h1>🕹️ Arcade</h1>
    <p class="arcade-subtitle">Gamified Learning Arcade</p>
  </header>
  <main class="arcade-main">
    <div id="game-container"></div>
  </main>
`;

const gameContainer = document.getElementById("game-container");
initMatchMakerUI(gameContainer);
