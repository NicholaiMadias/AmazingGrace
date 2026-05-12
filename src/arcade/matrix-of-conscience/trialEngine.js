/**
 * trialEngine.js — Matrix of Conscience trial Q&A engine.
 * One virtue question per star; correct answer unlocks that star's lore.
 */

import { STAR_TYPES } from '../../stars/starMap.js';
import { unlockLore } from '../../lore/loreCodex.js';

/** @type {Record<string, { prompt: string, answer: string }>} */
export const TRIAL_QUESTIONS = {
  electra:  { prompt: 'What virtue does Electra embody?',  answer: 'Vision' },
  taygete:  { prompt: 'What virtue does Taygete embody?',  answer: 'Courage' },
  alcyone:  { prompt: 'What virtue does Alcyone embody?',  answer: 'Serenity' },
  maia:     { prompt: 'What virtue does Maia embody?',     answer: 'Autonomy' },
  celaeno:  { prompt: 'What virtue does Celaeno embody?',  answer: 'Sustenance' },
  sterope:  { prompt: 'What virtue does Sterope embody?',  answer: 'Patience' },
  merope:   { prompt: 'What virtue does Merope embody?',   answer: 'Humility' }
};

/**
 * Start a trial for the given star.
 *
 * @param {string} starId
 * @param {{
 *   showPrompt: (star: object, prompt: string, onAnswer: (answer: string) => void) => void,
 *   showResult: (success: boolean, star: object) => void
 * }} ui — UI adapter that presents the question and result to the player
 */
export function startTrial(starId, ui) {
  const star = STAR_TYPES[starId];
  if (!star) return;

  const q = TRIAL_QUESTIONS[starId];
  if (!q) return;

  ui.showPrompt(star, q.prompt, (userAnswer) => {
    const normalized = String(userAnswer || '').trim().toLowerCase();
    const expected = q.answer.toLowerCase();

    if (normalized === expected) {
      unlockLore(starId, 'trial-success');
      ui.showResult(true, star);
    } else {
      ui.showResult(false, star);
    }
  });
}
