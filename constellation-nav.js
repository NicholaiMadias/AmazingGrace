import '/src/stars/starTiles.css';
import '/constellation-nav.css';

import { renderStarConstellation } from '/src/stars/starMapRenderer.js';
import { STAR_TYPES } from '/src/stars/starMap.js';
import { isLoreUnlocked } from '/src/lore/loreCodex.js';
import { startTrial } from '/src/arcade/matrix-of-conscience/trialEngine.js';
import {
  CONSTELLATION_ORDER,
  loadConstellationProgress,
  saveConstellationProgress,
  completeTrial,
  computeConscienceTint,
} from '/src/arcade/star-matrix/constellationState.js';

// Runtime self-check
const NAV_ID = 'constellation-nav';
const navRoot = document.getElementById(NAV_ID);
if (!navRoot) {
  console.warn(`[ConstellationNav] Missing <div id="${NAV_ID}"> on this page.`);
}

const NAV_ITEMS = [
  { id: 'galleries', label: 'Galleries', href: '/galleries/' },
  { id: 'stories', label: 'Library', href: '/stories/' },
  { id: 'arcade', label: 'Arcade', href: '/arcade/' },
  { id: 'ministry', label: 'Ministry', href: '/ministry/' },
];

const ATLAS_IDS = [
  'gem-galleries',
  'gem-stories',
  'gem-arcade',
  'gem-ministry',
];

const GEM_CONFIG = {
  'gem-galleries': { label: 'Galleries', href: '/galleries/' },
  'gem-stories': { label: 'Library', href: '/stories/' },
  'gem-arcade': { label: 'Arcade', href: '/arcade/' },
  'gem-ministry': { label: 'Ministry', href: '/ministry/' },
};

// Render constellation nav
export function renderConstellationNav() {
  if (!navRoot) return;

  const progress = loadConstellationProgress();
  const tint = computeConscienceTint(progress);

  const container = document.createElement('div');
  container.className = 'constellation-nav-container';

  ATLAS_IDS.forEach((gemId) => {
    const cfg = GEM_CONFIG[gemId];
    if (!cfg) return;

    const gem = document.createElement('div');
    gem.className = 'constellation-gem';
    gem.dataset.gem = gemId;

    const link = document.createElement('a');
    link.href = cfg.href;
    link.textContent = cfg.label;

    gem.appendChild(link);

    // Tinting based on conscience state
    if (tint) {
      gem.style.filter = `drop-shadow(0 0 6px ${tint})`;
    }

    container.appendChild(gem);
  });

  navRoot.innerHTML = '';
  navRoot.appendChild(container);

  // Render constellation overlay
  renderStarConstellation({
    mount: navRoot,
    starTypes: STAR_TYPES,
    order: CONSTELLATION_ORDER,
    progress,
    onTrialStart: startTrial,
    onTrialComplete: (starId) => {
      const updated = completeTrial(progress, starId);
      saveConstellationProgress(updated);
      renderConstellationNav();
    },
    isLoreUnlocked,
  });
}

// Auto-init if container exists
if (navRoot) {
  renderConstellationNav();
}
