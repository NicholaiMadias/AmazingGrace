export type CampaignMissionLevel = 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type GridCell = readonly [row: number, column: number];

export interface CampaignMissionConfig {
  level: CampaignMissionLevel;
  faction: string;
  enemyName: string;
  bossName: string;
  accent: string;
  secondaryAccent: string;
  waves: number;
  startingCredits: number;
  coreIntegrity: number;
  enemyHealth: number;
  enemySpeed: number;
  route: readonly GridCell[];
  modifier: string;
  ending: string;
  badge: string;
}

export const CAMPAIGN_MISSIONS: Record<CampaignMissionLevel, CampaignMissionConfig> = {
  4: {
    level: 4,
    faction: 'Solari Imperium',
    enemyName: 'Flare Drones',
    bossName: 'Helios Warden',
    accent: '#facc15',
    secondaryAccent: '#fb923c',
    waves: 4,
    startingCredits: 300,
    coreIntegrity: 14,
    enemyHealth: 8,
    enemySpeed: 0.42,
    route: [[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[2,4],[2,5],[1,5],[1,6],[1,7],[2,7],[3,7],[4,7],[4,6],[4,5],[5,5],[6,5],[6,6],[6,7],[6,8],[7,8],[7,9]],
    modifier: 'Solar flares periodically disrupt nearby defenses.',
    ending: 'The core steadies. Solari engineers shut down the runaway furnace and keep the forge crews safe as a new, shared power line comes online.',
    badge: 'Forgekeeper Seal'
  },
  5: {
    level: 5,
    faction: 'Eclipse Reach',
    enemyName: 'Umbra Raiders',
    bossName: 'The Mourning Crown',
    accent: '#f472b6',
    secondaryAccent: '#8b5cf6',
    waves: 5,
    startingCredits: 320,
    coreIntegrity: 13,
    enemyHealth: 10,
    enemySpeed: 0.45,
    route: [[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[0,9],[1,9],[2,9],[3,9],[4,9],[4,8],[4,7],[4,6],[5,6],[6,6],[6,7],[6,8],[7,8],[7,9]],
    modifier: 'The eclipse accelerates the final assault.',
    ending: 'The Mourning Crown falls without another world being erased. Its commander orders the evacuation corridor opened and leaves the throne empty.',
    badge: 'Eclipse Mediator'
  },
  6: {
    level: 6,
    faction: 'Outer Rim Alpha',
    enemyName: 'Rift Hunters',
    bossName: 'The Hollow Admiral',
    accent: '#38bdf8',
    secondaryAccent: '#22d3ee',
    waves: 5,
    startingCredits: 340,
    coreIntegrity: 16,
    enemyHealth: 10,
    enemySpeed: 0.43,
    route: [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[3,3],[3,2],[3,1],[4,1],[5,1],[6,1],[7,1],[7,2],[7,3],[7,4],[6,4],[5,4],[5,5],[5,6],[5,7],[5,8],[6,8],[7,8],[7,9]],
    modifier: 'Leaked enemies cost extra convoy integrity.',
    ending: 'The evacuees reach the relay ships. A final burst from the station carries their names—not their coordinates—across the restored signal.',
    badge: 'Rim Rescuer'
  },
  7: {
    level: 7,
    faction: 'Outer Rim Omega',
    enemyName: 'Ghost Armada',
    bossName: 'The Drift Marshal',
    accent: '#34d399',
    secondaryAccent: '#2dd4bf',
    waves: 5,
    startingCredits: 360,
    coreIntegrity: 15,
    enemyHealth: 12,
    enemySpeed: 0.47,
    route: [[7,0],[7,1],[7,2],[7,3],[6,3],[5,3],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[3,8],[2,8],[1,8],[1,7],[1,6],[1,5],[0,5],[0,6],[0,7],[0,8],[0,9],[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9]],
    modifier: 'Fast scouts test both ends of the convoy route.',
    ending: 'The two rim settlements reconnect. Their first shared transmission is a route plan that gives both sides equal say in its defense.',
    badge: 'Starway Pathfinder'
  },
  8: {
    level: 8,
    faction: 'Core Worlds Gate',
    enemyName: 'Gate Sentinels',
    bossName: 'Gatekeeper Prime',
    accent: '#a78bfa',
    secondaryAccent: '#60a5fa',
    waves: 6,
    startingCredits: 380,
    coreIntegrity: 15,
    enemyHealth: 13,
    enemySpeed: 0.47,
    route: [[0,4],[1,4],[2,4],[3,4],[3,3],[3,2],[3,1],[4,1],[5,1],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[5,6],[4,6],[3,6],[2,6],[2,7],[2,8],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9]],
    modifier: 'Armored gate sentinels resist rapid, light attacks.',
    ending: 'The Gatekeeper yields the records it guarded. The evidence points beyond the Core Worlds, to the force that taught the factions to fear one another.',
    badge: 'Gatebreaker Sigil'
  },
  9: {
    level: 9,
    faction: 'Abyssal Trench',
    enemyName: 'Trench Wraiths',
    bossName: 'The Abyssal Leviathan',
    accent: '#60a5fa',
    secondaryAccent: '#2dd4bf',
    waves: 6,
    startingCredits: 400,
    coreIntegrity: 16,
    enemyHealth: 14,
    enemySpeed: 0.5,
    route: [[7,0],[7,1],[7,2],[7,3],[7,4],[6,4],[5,4],[4,4],[3,4],[2,4],[1,4],[1,5],[1,6],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[7,8],[7,9],[6,9],[5,9],[4,9],[3,9],[2,9],[1,9],[0,9]],
    modifier: 'Abyss pressure makes each breach harder to contain.',
    ending: 'The deep beacon is carried to the surface intact. The Trench communities are no longer a footnote in the network; their signal becomes its new foundation.',
    badge: 'Beacon Diver'
  },
  10: {
    level: 10,
    faction: 'Zenith Pinnacle',
    enemyName: "Red Queen's Sentinels",
    bossName: 'The Red Queen',
    accent: '#fb7185',
    secondaryAccent: '#f0abfc',
    waves: 7,
    startingCredits: 450,
    coreIntegrity: 18,
    enemyHealth: 16,
    enemySpeed: 0.52,
    route: [[7,0],[6,0],[5,0],[4,0],[3,0],[2,0],[2,1],[2,2],[2,3],[3,3],[4,3],[5,3],[5,4],[5,5],[5,6],[5,7],[4,7],[3,7],[2,7],[1,7],[1,8],[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9]],
    modifier: 'The final sovereign adapts after every completed wave.',
    ending: 'The Red Queen is defeated, but no one takes her seat. The seven-star network awakens as a constellation of communities—connected by choice, not control.',
    badge: 'Conscience of the Grid'
  }
};

export function isCampaignMissionLevel(level: number): level is CampaignMissionLevel {
  return Number.isInteger(level) && level >= 4 && level <= 10;
}
