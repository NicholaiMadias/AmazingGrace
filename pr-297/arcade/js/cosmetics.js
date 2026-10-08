/**
 * cosmetics.js — Rebellion OS Cosmetic Definitions
 * Defines all unlockable cosmetics and their unlock conditions.
 */

const COSMETICS = [
  {
    id: "theme_neon",
    type: "uiTheme",
    name: "Neon Flux",
    unlock: { stars: { starMatrix: 2 } },
  },
  {
    id: "theme_synth",
    type: "uiTheme",
    name: "Synthwave Horizon",
    unlock: { threatBelow: 40 },
  },
  {
    id: "tower_quantum",
    type: "towerSkin",
    name: "Quantum Turret",
    unlock: { items: { quantumCore: 2 } },
  },
  {
    id: "tower_spectral",
    type: "towerSkin",
    name: "Spectral Prism Tower",
    unlock: { items: { spectralKey: 2 } },
  },
  {
    id: "tower_ultra",
    type: "towerSkin",
    name: "Ultra Siege Cannon",
    unlock: { stars: { syndicateSiege: 3 } },
  },
  {
    id: "sm_runes",
    type: "starMatrixSkin",
    name: "Runic Symbols",
    unlock: { stars: { starMatrix: 3 } },
  },
  {
    id: "qsstreamblue",
    type: "quantumStreamSkin",
    name: "Azure Stream",
    unlock: { stars: { quantumShift: 2 } },
  },
  {
    id: "lgfilterpurple",
    type: "lookingGlassFilter",
    name: "Violet Spectral Filter",
    unlock: { stars: { lookingGlass: 2 } },
  },
  // ── Boss Mutation Cosmetics ───────────────────────────────────────────────
  {
    id: "aura_data_glitch",
    type: "aura",
    name: "Data Glitch Aura",
    unlock: { bossMutation: 'dataOverload' },
  },
  {
    id: "filter_spectral_pulse",
    type: "filter",
    name: "Spectral Pulse Filter",
    unlock: { bossMutation: 'spectralEcho' },
  },
  {
    id: "skin_quantum_flux_stream",
    type: "quantumStreamSkin",
    name: "Quantum Flux Stream Skin",
    unlock: { bossMutation: 'quantumFlux' },
  },
  {
    id: "skin_overseer_armor_tower",
    type: "towerSkin",
    name: "Overseer Armor Tower Skin",
    unlock: { bossMutation: 'armorRegen' },
  },
  {
    id: "theme_ascendant",
    type: "uiTheme",
    name: "Ascendant UI Theme",
    unlock: { bossMutation: 'cataclysmic' },
  },
  // ── Boss Personality Cosmetics ────────────────────────────────────────────
  {
    id: "aura_red_rage",
    type: "aura",
    name: "Red Rage Aura",
    unlock: { personalityTrait: 'aggression' },
  },
  {
    id: "filter_blue_predictive",
    type: "filter",
    name: "Blue Predictive Filter",
    unlock: { personalityTrait: 'cunning' },
  },
  {
    id: "skin_black_corruption",
    type: "generalSkin",
    name: "Black Corruption Skin",
    unlock: { personalityTrait: 'cruelty' },
  },
  {
    id: "theme_gold_dominion",
    type: "uiTheme",
    name: "Gold Dominion Theme",
    unlock: { personalityTrait: 'pride' },
  },
  {
    id: "theme_glitch_fracture",
    type: "uiTheme",
    name: "Glitching Fracture UI",
    unlock: { personalityTrait: 'fear' },
  },
  // ── Boss Emotion Cosmetics ────────────────────────────────────────────────
  {
    id: "aura_red_fury",
    type: "aura",
    name: "Red Fury Aura",
    unlock: { emotionMilestone: 'anger' },
  },
  {
    id: "theme_gold_honor",
    type: "uiTheme",
    name: "Gold Honor Theme",
    unlock: { emotionMilestone: 'respect' },
  },
  {
    id: "filter_blue_focus",
    type: "filter",
    name: "Blue Focus Filter",
    unlock: { emotionMilestone: 'obsession' },
  },
  {
    id: "skin_void_collapse",
    type: "generalSkin",
    name: "Void Collapse Skin",
    unlock: { emotionMilestone: 'despair' },
  },
];
