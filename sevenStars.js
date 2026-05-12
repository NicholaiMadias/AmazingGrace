/**
 * sevenStars.js — star-unlock system for Match Maker achievements.
 * Star data is inlined to avoid JSON import-assertion browser compatibility issues.
 */

const stars = [
  { "id": "gold",      "virtue": "Knowledge",   "goal": "Reach level 3" },
  { "id": "silver",    "virtue": "Faith",        "goal": "Complete a daily challenge" },
  { "id": "sapphire",  "virtue": "Truth",        "goal": "Score 1000 points" },
  { "id": "emerald",   "virtue": "Compassion",   "goal": "Clear 50 gems" },
  { "id": "ruby",      "virtue": "Courage",      "goal": "Make a 5-match combo" },
  { "id": "amethyst",  "virtue": "Creativity",   "goal": "Trigger 10 explosions" },
  { "id": "obsidian",  "virtue": "Integrity",    "goal": "Play 7 days in a row" }
];

export function unlockStar(id) {
  const unlocked = JSON.parse(localStorage.getItem('stars') || '[]');
  if (!unlocked.includes(id)) {
    unlocked.push(id);
    localStorage.setItem('stars', JSON.stringify(unlocked));
    showStarToast(id);
  }
}

function showStarToast(id) {
  const star = stars.find(s => s.id === id);
  const el = document.createElement('div');
  el.textContent = `⭐ ${star?.virtue || id} Star Unlocked!`;
  el.style.cssText = [
    'position:fixed', 'top:20px', 'left:50%', 'transform:translateX(-50%)',
    'background:#ffd700', 'color:#000', 'padding:10px 20px',
    'border-radius:6px', 'font-weight:bold', 'z-index:9999',
    'pointer-events:none'
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
