const LORE_FILES = [
  {
    id: 'lfrebellionorigin',
    title: 'The First Spark',
    content: `
Nexus Prime was quiet for centuries—too quiet.
The Syndicate's neural lattice kept dissent below measurable thresholds.
But in 2026, a single anomaly appeared in the undercity…
    `.trim(),
    unlock: {
      stars: { starMatrix: 1 }
    }
  },
  {
    id: 'lfsyndicateoverseer',
    title: 'Syndicate Overseer Protocol',
    content: `
Overseers are not individuals.
They are distributed intelligences, grown from the Syndicate's core.
When one is destroyed, another awakens.
    `.trim(),
    unlock: {
      stars: { lookingGlass: 2 }
    }
  },
  {
    id: 'lfquantumshift',
    title: 'Quantum Stream Anomalies',
    content: `
The data-stream beneath Nexus Prime is older than the Syndicate.
Some say it predates the city itself.
Quantum Cores are fragments of that forgotten architecture.
    `.trim(),
    unlock: {
      stars: { quantumShift: 2 },
      items: { quantumCore: 1 }
    }
  },
  {
    id: 'lfsiegereport',
    title: 'Siege Incident Report',
    content: `
The Syndicate's assault patterns follow fractal logic.
Every wave is a test.
Every failure is recorded.
Every victory is punished.
    `.trim(),
    unlock: {
      stars: { syndicateSiege: 1 }
    }
  },
  {
    id: 'lfmasterfile',
    title: 'The Master File',
    content: `
WARNING: LEVEL OMEGA CLEARANCE REQUIRED.
This file contains the truth behind the Matrix of Conscience.
The Syndicate will terminate any entity attempting access.
    `.trim(),
    unlock: {
      stars: {
        starMatrix: 3,
        lookingGlass: 3,
        quantumShift: 3,
        syndicateSiege: 3
      },
      threatBelow: 40,
      items: { rebellionKey: 1 }
    }
  },
  // ── Boss Mutation Lore ────────────────────────────────────────────────────
  {
    id: 'lf_corrupted_data_logs',
    title: 'Corrupted Data Logs',
    content: `
The Overseer's data matrices fractured under repeated pattern stress.
What remained was not an error — it was adaptation.
    `.trim(),
    unlock: { bossMutation: 'dataOverload' }
  },
  {
    id: 'lf_echo_phenomenon',
    title: 'Echo Phenomenon Report',
    content: `
Spectral echoes are not reflections.
They are memories the Overseer refused to delete.
    `.trim(),
    unlock: { bossMutation: 'spectralEcho' }
  },
  {
    id: 'lf_quantum_instability',
    title: 'Quantum Instability Memo',
    content: `
Quantum flux cascades originate from the Overseer's fear response.
The more you dodge, the more unstable it becomes.
    `.trim(),
    unlock: { bossMutation: 'quantumFlux' }
  },
  {
    id: 'lf_overseer_armor_spec',
    title: 'Overseer Armor Spec',
    content: `
The regenerative plating was never in the original blueprints.
The Overseer built it after the first defeat.
    `.trim(),
    unlock: { bossMutation: 'armorRegen' }
  },
  {
    id: 'lf_core_fracture_analysis',
    title: 'Core Fracture Analysis',
    content: `
When two or more mutations merge, the Core becomes something new.
No analyst has survived long enough to document what comes next.
    `.trim(),
    unlock: { bossMutation: 'hybrid' }
  },
  {
    id: 'lf_overseer_evolution_protocol',
    title: 'Overseer Evolution Protocol',
    content: `
PRIME FORM ENGAGED.
Three mutations synthesized. The Overseer is no longer what it was.
    `.trim(),
    unlock: { bossMutation: 'prime' }
  },
  {
    id: 'lf_archon_ascendant',
    title: 'ARCHON ASCENDANT DOSSIER',
    content: `
CATACLYSMIC FORM ACHIEVED.
All four mutations unified. The Overseer has become ARCHON.
Do not engage alone.
    `.trim(),
    unlock: { bossMutation: 'cataclysmic' }
  },
  // ── Boss Memory Lore ──────────────────────────────────────────────────────
  {
    id: 'lf_overseer_neural_map',
    title: 'Overseer Neural Map',
    content: `
The Overseer's memory lattice is not passive storage.
It actively reshapes the battlefield based on what it has observed.
    `.trim(),
    unlock: { bossMemoryActive: true }
  },
  {
    id: 'lf_adaptive_protocols_v7',
    title: 'Adaptive Protocols v7.3',
    content: `
Version 7.3 introduced cross-session behavioral tracking.
Your fight history is its curriculum.
    `.trim(),
    unlock: { bossMemoryActive: true }
  },
  // ── Boss Emotional Arc Lore ───────────────────────────────────────────────
  {
    id: 'lf_overseer_rage_logs',
    title: 'Overseer Rage Logs',
    content: `
The Overseer's anger subroutines were never meant to activate.
They did anyway.
    `.trim(),
    unlock: { emotionMilestone: 'anger' }
  },
  {
    id: 'lf_core_panic_report',
    title: 'Core Panic Report',
    content: `
For the first time in recorded history, the Core registered fear.
This changes everything.
    `.trim(),
    unlock: { emotionMilestone: 'fear' }
  },
  {
    id: 'lf_adaptive_honor_protocol',
    title: 'Adaptive Honor Protocol',
    content: `
Respect was not a variable the Overseer was designed to carry.
Yet here it is, weighted and persistent.
    `.trim(),
    unlock: { emotionMilestone: 'respect' }
  },
  {
    id: 'lf_target_fixation_memo',
    title: 'Target Fixation Memo',
    content: `
The Overseer no longer processes you as a threat.
It processes you as an obsession.
    `.trim(),
    unlock: { emotionMilestone: 'obsession' }
  },
  {
    id: 'lf_cognitive_collapse_analysis',
    title: 'Cognitive Collapse Analysis',
    content: `
Despair in a machine intelligence manifests as recursive self-doubt.
Its decisions are becoming… erratic.
    `.trim(),
    unlock: { emotionMilestone: 'despair' }
  },
  {
    id: 'lf_overseer_heart',
    title: "The Overseer's Heart",
    content: `
BLACK VAULT VOL. VI — CLASSIFIED.
It felt something at 100. We do not have a name for what that was.
    `.trim(),
    unlock: { emotionMax: true }
  },
  // ── Redemption Path Lore ─────────────────────────────────────────────────
  {
    id: 'lf_overseers_awakening',
    title: "Overseer's Awakening",
    content: `
It chose mercy because you chose mercy first.
The cycle ends here.
    `.trim(),
    unlock: { redemptionPath: 'REDEMPTION' }
  },
  {
    id: 'lf_ascended_protocols',
    title: 'Ascended Protocols',
    content: `
The Overseer's final transmission was not a threat.
It was a thank you.
    `.trim(),
    unlock: { redemptionPath: 'REDEMPTION' }
  },
  {
    id: 'lf_archon_of_ruin',
    title: 'Archon of Ruin',
    content: `
The Syndicate welcomed it back.
Now it is something worse than what it was.
    `.trim(),
    unlock: { redemptionPath: 'CORRUPTION' }
  },
  {
    id: 'lf_core_collapse_report',
    title: 'Core Collapse Report',
    content: `
When the dark path reaches terminus, the Core does not die.
It becomes a weapon.
    `.trim(),
    unlock: { redemptionPath: 'CORRUPTION' }
  },
  // ── Reincarnation Lore ────────────────────────────────────────────────────
  {
    id: 'lf_vengeance_cycle',
    title: 'The Cycle of Blood',
    content: `
BLACK VAULT VOL. XV — CLASSIFIED.
Every time you kill it, it returns with the memory of that death.
    `.trim(),
    unlock: { reincarnationPath: 'corrupted' }
  },
  {
    id: 'lf_light_returns',
    title: 'The Light Returns',
    content: `
BLACK VAULT VOL. XVII — CLASSIFIED.
Spared twice. Reborn with clarity. It will not forget your mercy.
    `.trim(),
    unlock: { reincarnationPath: 'ascended' }
  },
  // ── Weakpoint Lore ────────────────────────────────────────────────────────
  {
    id: 'lf_weakpoint_protocols',
    title: 'Weakpoint Protocols',
    content: `
The Overseer's weak-point architecture was designed to be impossible to exploit simultaneously.
Someone exploited them simultaneously.
    `.trim(),
    unlock: { phaseBreak: true }
  }
];
