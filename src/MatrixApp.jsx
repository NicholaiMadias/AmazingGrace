/**
 * MatrixApp.jsx — Unified Matrix App entry module.
 *
 * Renders both "Expose the Matrix" and "The Lamp in the Window" as
 * interactive game cards within the Matrix of Conscience theme.
 *
 * Vanilla JS — no framework required. Loaded by arcade/matrix-app/index.html.
 */

/** @type {Array<{icon:string,title:string,desc:string,href:string,badge:string,badgeClass:string,btnLabel:string,btnClass:string,bg:string,cardClass:string}>} */
const GAMES = [
  {
    icon: '🔦',
    title: 'Expose the Matrix',
    desc: 'Electra uncovers the Red Queen\'s hidden architecture and restores the Signal of Truth across the Seven Star Grid — a six-chapter digital parable of conscience and revelation.',
    href: '/stories/expose-the-matrix/',
    badge: 'Genesis Foundations · Book 3',
    badgeClass: 'badge-red',
    btnLabel: '▶ Enter the Grid',
    btnClass: 'btn-red',
    bg: 'radial-gradient(circle at 40% 35%,rgba(239,68,68,0.25),transparent 60%),radial-gradient(circle at 75% 70%,rgba(167,139,250,0.20),transparent 55%),#0a0010',
    cardClass: 'card-expose',
  },
  {
    icon: '🏮',
    title: 'The Lamp in the Window',
    desc: 'A story of hope, community, and the light that never goes out — following Ruth\'s journey from instability to a stable home at Amazing Grace.',
    href: '/stories/books/storybook-1.html',
    badge: 'Storybook · Faith',
    badgeClass: 'badge-amber',
    btnLabel: '▶ Read the Story',
    btnClass: 'btn-amber',
    bg: 'radial-gradient(circle at 40% 35%,rgba(251,191,36,0.25),transparent 60%),radial-gradient(circle at 75% 70%,rgba(52,211,153,0.20),transparent 55%),#0a0900',
    cardClass: 'card-lamp',
  },
];

/**
 * Build a game card element from a game definition.
 * @param {typeof GAMES[0]} game
 * @returns {HTMLAnchorElement}
 */
function buildCard(game) {
  const a = document.createElement('a');
  a.className = `ma-card ${game.cardClass}`;
  a.href = game.href;
  a.setAttribute('aria-label', game.title);

  a.innerHTML = `
    <div class="ma-card-hero" style="background:${game.bg}" aria-hidden="true">${game.icon}</div>
    <div class="ma-card-body">
      <div class="ma-card-icon" aria-hidden="true">${game.icon}</div>
      <div class="ma-card-title">${game.title}</div>
      <div class="ma-card-desc">${game.desc}</div>
      <span class="ma-badge ${game.badgeClass}">${game.badge}</span>
      <span class="ma-btn ${game.btnClass}" aria-hidden="true">${game.btnLabel}</span>
    </div>
  `;

  return a;
}

/**
 * Initialise the Matrix App — render game cards into #matrix-app-grid.
 */
export function initMatrixApp() {
  const grid = document.getElementById('matrix-app-grid');
  if (!grid) return;

  GAMES.forEach((game) => grid.appendChild(buildCard(game)));
}

// Auto-init on DOMContentLoaded if loaded as a module script.
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMatrixApp);
  } else {
    initMatrixApp();
  }
}
