/**
 * NarrativeFX.js — DOM visual effects for narrative unlock events.
 * omenFX   — dramatic screen flash + particle burst for omen reveals.
 * memoryFX — soft luminous ripple for memory unlocks.
 */

/**
 * Trigger the omen visual effect for a given omen identifier.
 * Applies a full-screen flash overlay and adds `.omen-active` to `document.body`
 * for the duration of the effect so CSS can layer additional styles.
 *
 * @param {string} omenId  - identifier of the unlocked omen
 */
export function omenFX(omenId) {
  const maxAlpha = 0.85;
  const overlay = _makeOverlay('mc-omen-overlay', '#1a0033');
  document.body.appendChild(overlay);
  document.body.classList.add('omen-active');
  document.body.setAttribute('data-omen', omenId);

  // Particles burst from center
  _burst(12, overlay, '#c084fc', 'mc-omen-particle');

  requestAnimationFrame(() => {
    overlay.style.opacity = String(maxAlpha);
    overlay.style.transition = 'opacity 0.15s ease-in';
  });

  setTimeout(() => {
    overlay.style.opacity  = '0';
    overlay.style.transition = 'opacity 0.6s ease-out';
    setTimeout(() => {
      overlay.remove();
      if (!document.querySelector('.mc-omen-overlay')) {
        document.body.classList.remove('omen-active');
        document.body.removeAttribute('data-omen');
      }
    }, 620);
  }, 400);
}

/**
 * Trigger the memory visual effect for a given memory identifier.
 * Adds a gentle radial ripple overlay and `.memory-active` to `document.body`.
 *
 * @param {string} memoryId  - identifier of the unlocked memory
 */
export function memoryFX(memoryId) {
  const maxAlpha = 0.65;
  const overlay = _makeOverlay('mc-memory-overlay', '#001a33');
  document.body.appendChild(overlay);
  document.body.classList.add('memory-active');
  document.body.setAttribute('data-memory', memoryId);

  _burst(8, overlay, '#7dd3fc', 'mc-memory-particle');

  requestAnimationFrame(() => {
    overlay.style.opacity = String(maxAlpha);
    overlay.style.transition = 'opacity 0.2s ease-in';
  });

  setTimeout(() => {
    overlay.style.opacity  = '0';
    overlay.style.transition = 'opacity 0.9s ease-out';
    setTimeout(() => {
      overlay.remove();
      if (!document.querySelector('.mc-memory-overlay')) {
        document.body.classList.remove('memory-active');
        document.body.removeAttribute('data-memory');
      }
    }, 920);
  }, 500);
}

/* ---- Helpers ---- */

/**
 * Create a full-screen semi-transparent overlay div.
 *
 * @param {string} className
 * @param {string} color   - CSS color for background
 * @returns {HTMLDivElement}
 */
function _makeOverlay(className, color) {
  const el = document.createElement('div');
  el.className = className;
  Object.assign(el.style, {
    position:      'fixed',
    inset:         '0',
    background:    color,
    opacity:       '0',
    pointerEvents: 'none',
    zIndex:        '9999',
  });
  return el;
}

/**
 * Spawn `count` particle elements inside `parent`, animating outward from center.
 *
 * @param {number}      count
 * @param {HTMLElement} parent
 * @param {string}      color
 * @param {string}      particleClass
 */
function _burst(count, parent, color, particleClass) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = particleClass;

    const angle  = (i / count) * 2 * Math.PI;
    const dist   = 60 + Math.random() * 80;
    const dx     = Math.cos(angle) * dist;
    const dy     = Math.sin(angle) * dist;
    const size   = 6 + Math.random() * 8;

    Object.assign(p.style, {
      position:  'absolute',
      left:      '50%',
      top:       '50%',
      width:     `${size}px`,
      height:    `${size}px`,
      background: color,
      borderRadius: '50%',
      opacity:   '0.9',
      transform: 'translate(-50%, -50%)',
      transition: `transform 0.5s ease-out, opacity 0.5s ease-out`
    });

    parent.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`;
      p.style.opacity   = '0';
    });
  }
}
