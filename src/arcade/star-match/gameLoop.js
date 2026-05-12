import { StarMatchEngine } from './starMatchEngine.js';
import { renderBoard } from './starMatchUI.js';
import { startTrial } from '../matrix-of-conscience/trialEngine.js';

export class StarMatchGame {
  constructor(rootEl, ui) {
    this.rootEl = rootEl;
    this.ui = ui; // { updateHUD(level, score, target, moves), showLevelComplete(level), showGameOver() }
    this.level = 1;
    this.score = 0;
    this.targetScore = 1500;
    this.moves = 20;
    this.engine = new StarMatchEngine(8);
  }

  start() {
    this.render();
  }

  nextLevel() {
    this.level++;
    this.targetScore = Math.floor(this.targetScore * 1.4);
    this.moves = 20 + this.level * 2;
    this.engine = new StarMatchEngine(8);

    // Merge with Matrix Trials: trigger a trial every 3 levels
    if (this.level % 3 === 0) {
      startTrial('electra', this.ui); // or rotate through stars
    }

    this.render();
  }

  render() {
    const boardContainer = this.rootEl.querySelector('.match3-board');
    if (!boardContainer) return;

    this.ui.updateHUD(this.level, this.engine.score, this.targetScore, this.moves);

    renderBoard(boardContainer, this.engine, (a, b) => {
      if (this.moves <= 0) return;

      const moved = this.engine.swap(a, b);
      if (moved) {
        this.moves--;
        this.score = this.engine.score;
        this.ui.updateHUD(this.level, this.score, this.targetScore, this.moves);

        if (this.score >= this.targetScore) {
          this.ui.showLevelComplete(this.level);
          this.nextLevel();
        } else if (this.moves === 0) {
          this.ui.showGameOver();
        } else {
          this.render();
        }
      }
    });
  }
}
