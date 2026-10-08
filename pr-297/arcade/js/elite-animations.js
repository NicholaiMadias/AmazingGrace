/**
 * elite-animations.js — Rebellion OS Elite Animation System
 *
 * Provides CSS-driven animation triggers for kill events, boss phase
 * transitions, tower fire bursts, and elite-mode UI morphs.
 * Each function briefly adds a class to the target element and
 * removes it after the animation completes so it can fire again.
 */

(function initEliteAnimations(global) {
  /** Duration constants (ms) — must match the CSS keyframe durations below. */
  const DURATION_KILL       = 400;
  const DURATION_PHASE      = 600;
  const DURATION_TOWER_FIRE = 300;
  const DURATION_WEAKPOINT  = 500;
  const DURATION_UI_MORPH   = 500;

  /**
   * Flash a cell when any enemy is killed.
   * @param {Element} cell  - The grid cell element where the kill occurred.
   * @param {string}  type  - Enemy type: "normal" | "elite" | "boss".
   */
  function triggerKillAnimation(cell, type) {
    if (!cell) return;
    const cls = type === "boss"  ? "anim-boss-kill"
              : type === "elite" ? "anim-elite-kill"
              : "anim-kill-flash";
    cell.classList.add(cls);
    setTimeout(() => cell.classList.remove(cls), DURATION_KILL);
  }

  /**
   * Animate the boss cell when it shifts to a new phase (health threshold
   * crossed or multi-form transition).
   * @param {Element} cell - The grid cell element where the boss resides.
   */
  function triggerPhaseTransition(cell) {
    if (!cell) return;
    cell.classList.add("anim-phase-shift");
    setTimeout(() => cell.classList.remove("anim-phase-shift"), DURATION_PHASE);
  }

  /**
   * Briefly pulse a tower cell when it fires at an enemy.
   * @param {Element} cell - The tower's grid cell element.
   */
  function triggerTowerFire(cell) {
    if (!cell) return;
    cell.classList.add("anim-tower-fire");
    setTimeout(() => cell.classList.remove("anim-tower-fire"), DURATION_TOWER_FIRE);
  }

  /**
   * Highlight an enemy cell's weakpoint indicator.
   * @param {Element} cell - The grid cell element containing the enemy.
   */
  function triggerWeakpointFlash(cell) {
    if (!cell) return;
    cell.classList.add("anim-weakpoint");
    setTimeout(() => cell.classList.remove("anim-weakpoint"), DURATION_WEAKPOINT);
  }

  /**
   * Animate the entire game grid when Elite Mode is toggled on or off.
   * @param {boolean} active - true when Elite Mode is being activated.
   */
  function triggerEliteModeTransition(active) {
    const grid = global.document && global.document.getElementById("grid");
    if (!grid) return;
    const cls = active ? "anim-elite-mode-on" : "anim-elite-mode-off";
    grid.classList.add(cls);
    setTimeout(() => grid.classList.remove(cls), DURATION_UI_MORPH);
  }

  /* ── Expose on global scope ── */
  global.triggerKillAnimation      = triggerKillAnimation;
  global.triggerPhaseTransition    = triggerPhaseTransition;
  global.triggerTowerFire          = triggerTowerFire;
  global.triggerWeakpointFlash     = triggerWeakpointFlash;
  global.triggerEliteModeTransition = triggerEliteModeTransition;
})(window);
