import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConscienceProvider } from '../../src/components/ConscienceProvider';
import { StarMatchGame } from '../../src/arcade/star-match/gameLoop.js';
import '../../src/arcade/star-match/match3.css';

type Trial = {
  star: { name: string };
  prompt: string;
  onAnswer: (answer: string) => void;
};

function StarMatchApp() {
  const gameRoot = useRef<HTMLElement>(null);
  const [run, setRun] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(1500);
  const [moves, setMoves] = useState(20);
  const [message, setMessage] = useState('Swap adjacent stars to make matches of three or more.');
  const [trial, setTrial] = useState<Trial | null>(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (!gameRoot.current) return;

    const game = new StarMatchGame(gameRoot.current, {
      updateHUD: (nextLevel: number, nextScore: number, nextTarget: number, nextMoves: number) => {
        setLevel(nextLevel);
        setScore(nextScore);
        setTarget(nextTarget);
        setMoves(nextMoves);
      },
      showLevelComplete: (completedLevel: number) => {
        setMessage(`Level ${completedLevel} complete — the next level is ready.`);
      },
      showGameOver: () => setMessage('No moves remain. Start a new run to play again.'),
      showPrompt: (star: Trial['star'], prompt: string, onAnswer: Trial['onAnswer']) => {
        setTrial({ star, prompt, onAnswer });
        setAnswer('');
      },
      showResult: (success: boolean, star: Trial['star']) => {
        setTrial(null);
        setMessage(success ? `${star.name} trial complete.` : `${star.name} trial missed.`);
      },
    });

    game.start();
    return () => game.destroy();
  }, [run]);

  return (
    <main className="star-match-app" ref={gameRoot}>
      <nav className="star-match-nav">
        <a href="../">← Arcade</a>
        <span>PLEIADES MATCH-3</span>
      </nav>
      <header className="star-match-header">
        <h1>Star Match</h1>
        <p>Align the seven stars and build virtue chains.</p>
      </header>
      <section className="star-match-stats" aria-label="Game status">
        <div><span>LEVEL</span><strong>{level}</strong></div>
        <div><span>SCORE</span><strong>{score} / {target}</strong></div>
        <div><span>MOVES</span><strong>{moves}</strong></div>
      </section>
      <p className="star-match-message" role="status" aria-live="polite">{message}</p>
      <div className="match3-board" aria-label="Star Match game board" />
      <p className="star-match-instructions">Tap two adjacent stars or drag/swipe between them to swap.</p>
      <button className="star-match-reset" onClick={() => {
        setLevel(1);
        setScore(0);
        setTarget(1500);
        setMoves(20);
        setMessage('Swap adjacent stars to make matches of three or more.');
        setTrial(null);
        setRun(value => value + 1);
      }}>
        Start New Run
      </button>
      {trial && (
        <form className="star-match-trial" onSubmit={(event) => {
          event.preventDefault();
          trial.onAnswer(answer);
        }}>
          <label htmlFor="star-trial-answer">{trial.prompt}</label>
          <input
            id="star-trial-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            autoComplete="off"
          />
          <button type="submit">Answer {trial.star.name}'s Trial</button>
        </form>
      )}
    </main>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ConscienceProvider>
        <StarMatchApp />
      </ConscienceProvider>
    </StrictMode>
  );
}
