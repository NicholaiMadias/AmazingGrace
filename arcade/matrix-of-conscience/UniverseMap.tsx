import React, { type CSSProperties, useEffect } from 'react';
import { useConscience, FactionKey } from '../../src/components/ConscienceProvider';
import { motion, useReducedMotion } from 'framer-motion';

export type SectorData = {
  id: number;
  x: number; // % position
  y: number;
  requiredLevel: number;
  name: string;
  isBoss?: boolean;
  chapter: string;
  transmission: string;
  objective: string;
};

export const SECTORS: SectorData[] = [
  {
    id: 1, x: 50, y: 50, requiredLevel: 1, name: "Origin Point",
    chapter: "I · The First Signal",
    transmission: "At the quiet edge of the known grid, a failing beacon repeats one word: remember. The factions have mistaken silence for surrender. Restore the signal, and give the scattered worlds a reason to answer.",
    objective: "Reignite the beacon and hold the first line."
  },
  {
    id: 2, x: 25, y: 30, requiredLevel: 2, name: "Aurion Gate",
    chapter: "II · A Shield Can Open",
    transmission: "The Aurion gate is defended by a shield that answers only to trust. Its keepers expect another conqueror; your arrival is their first chance to choose an ally instead.",
    objective: "Break the siege without breaking the people behind the shield."
  },
  {
    id: 3, x: 75, y: 30, requiredLevel: 3, name: "Voidborn Rift",
    chapter: "III · What the Dark Remembers",
    transmission: "A gravity wound is pulling whole settlements from their routes. Voidborn scouts know how to close it, but years of fear have made every approach look like an attack.",
    objective: "Survive the rift and make room for a ceasefire."
  },
  {
    id: 4, x: 30, y: 75, requiredLevel: 4, name: "Solari Forge",
    chapter: "IV · The Cost of Fire",
    transmission: "The forge can power a thousand worlds—or consume the hands that tend it. Solari engineers have hidden a failing core beneath the triumphal banners.",
    objective: "Stabilize the core before its next flare."
  },
  {
    id: 5, x: 70, y: 75, requiredLevel: 5, name: "Eclipse Reach", isBoss: true,
    chapter: "V · The Long Shadow",
    transmission: "At Eclipse Reach, a commander has turned old grief into an empire. Victory will open the route forward; what you spare here will decide who is willing to stand beside you.",
    objective: "Face the first sovereign and end the cycle of reprisals."
  },
  {
    id: 6, x: 10, y: 15, requiredLevel: 6, name: "Outer Rim Alpha",
    chapter: "VI · The Listening Dark",
    transmission: "Outer Rim Alpha has gone quiet. Beneath its abandoned relay, a community is still transmitting in short bursts—too faint for the factions, but not too faint for you.",
    objective: "Trace the distress signal through the abandoned relay."
  },
  {
    id: 7, x: 90, y: 15, requiredLevel: 7, name: "Outer Rim Omega",
    chapter: "VII · Lines Between Stars",
    transmission: "A supply route links rival settlements across the rim. One false alarm could turn the corridor into a battlefield, so every signal must be checked before anyone moves.",
    objective: "Secure the corridor and reunite the separated settlements."
  },
  {
    id: 8, x: 50, y: 10, requiredLevel: 8, name: "Core Worlds Gate", isBoss: true,
    chapter: "VIII · The Gatekeeper's Choice",
    transmission: "The Core Worlds gatekeeper will trade passage for allegiance. Behind the bargain lies the truth about the signal that started this journey—and a choice that no faction can make for you.",
    objective: "Unmask the gatekeeper and choose what the alliance is for."
  },
  {
    id: 9, x: 10, y: 90, requiredLevel: 9, name: "Abyssal Trench",
    chapter: "IX · Light Below",
    transmission: "The Trench is a graveyard of lost ships and unfinished promises. Its deepest beacon still burns, guarded by those who believe the surface forgot them.",
    objective: "Reach the beacon and carry its message back alive."
  },
  {
    id: 10, x: 90, y: 90, requiredLevel: 10, name: "Zenith Pinnacle", isBoss: true,
    chapter: "X · A Constellation, Not a Crown",
    transmission: "At the Pinnacle, every surviving faction arrives with its own claim to the future. The final test is not who can rule the grid, but whether its worlds can hold together without a ruler.",
    objective: "Resolve the final stand and decide what the restored network becomes."
  }
];

interface UniverseMapProps {
  selectedSectorId: number;
  onSelectSector: (sectorId: number) => void;
}

export default function UniverseMap({ selectedSectorId, onSelectSector }: UniverseMapProps) {
  const prefersReducedMotion = useReducedMotion();
  const {
    userLevel,
    sectorControl,
    factions,
    triggerCosmicEvent,
    unlockedSectors,
    unlockSector
  } = useConscience();

  // Auto-unlock sectors based on level
  useEffect(() => {
    SECTORS.forEach(s => {
      if (userLevel >= s.requiredLevel && !unlockedSectors.includes(s.id)) {
        unlockSector(s.id);
        triggerCosmicEvent(`SECTOR UNLOCKED: ${s.name}`);
      }
    });
  }, [userLevel, unlockedSectors, unlockSector, triggerCosmicEvent]);

  return (
    <div className="universe-map-viewport">
      {/* Parallax depth layers */}
      <div className="cosmic-depth">
        <div className="cosmic-layer" style={{ backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 2px)' }} />
        <div className="cosmic-layer mid" style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 3px)' }} />
        <div className="cosmic-layer deep" style={{ backgroundImage: 'radial-gradient(circle, #facc15 1px, transparent 4px)' }} />
      </div>
      <svg className="sector-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="route-gradient">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {SECTORS.slice(1).map((sector) => (
          <line
            key={sector.id}
            x1="50"
            y1="50"
            x2={sector.x}
            y2={sector.y}
            className={`sector-route ${unlockedSectors.includes(sector.id) ? 'sector-route-open' : ''}`}
          />
        ))}
        <line x1="25" y1="30" x2="75" y2="30" className="sector-route sector-route-branch" />
        <line x1="30" y1="75" x2="70" y2="75" className="sector-route sector-route-branch" />
      </svg>

      {SECTORS.map(sector => {
        const unlocked = unlockedSectors.includes(sector.id);
        const factionKey = sectorControl[sector.id] as FactionKey | undefined;
        const faction = factionKey ? factions[factionKey] : undefined;

        // Custom glow and theme colors
        const themeColor = faction ? faction.color : '#64748b';
        const glow = unlocked ? `0 0 25px ${themeColor}cc, inset 0 0 10px ${themeColor}` : 'none';
        const bossStyle = sector.isBoss ? { borderStyle: 'dashed', borderWidth: '3px' } : {};
        const selected = selectedSectorId === sector.id;
        const nodeStyle: CSSProperties & { '--theme-color': string; '--sector-glow': string } = {
          left: `${sector.x}%`,
          top: `${sector.y}%`,
          borderColor: themeColor,
          boxShadow: glow,
          ...bossStyle,
          '--theme-color': themeColor,
          '--sector-glow': themeColor
        };

        return (
          <motion.button
            key={sector.id}
            type="button"
            className={`sector-node ${unlocked ? 'unlocked' : ''} ${selected ? 'sector-selected' : ''} ${sector.isBoss ? 'boss-sector' : ''}`}
            disabled={!unlocked}
            title={unlocked ? `${sector.chapter}: ${sector.objective}` : `Unlocks at level ${sector.requiredLevel}`}
            aria-label={`${sector.name}. ${sector.chapter}. ${unlocked ? sector.objective : `Requires level ${sector.requiredLevel}`}${sector.isBoss ? '. Sovereign encounter' : ''}`}
            aria-pressed={selected}
            style={nodeStyle}
            onClick={() => onSelectSector(sector.id)}
            initial={prefersReducedMotion ? false : { scale: 0.8, opacity: 0.2 }}
            animate={unlocked ? { scale: 1, opacity: 1 } : { scale: prefersReducedMotion ? 1 : 0.8, opacity: 0.55 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
          >
            {/* Visual glow overlay */}
            {unlocked && (
              <span
                className="sector-node-glow"
                style={{ background: `radial-gradient(circle, ${themeColor}33, transparent)` }}
              />
            )}
            
            {/* Sector Details */}
            <span className="sector-node-details">
              <span className="sector-node-name">
                {sector.name}
              </span>
              {unlocked && faction ? (
                <span className="sector-node-faction" style={{ color: themeColor }}>
                  {faction.name.split(' ')[0]}
                </span>
              ) : (
                <span className="sector-node-requirement">
                  Req Lv {sector.requiredLevel}
                </span>
              )}
              {sector.isBoss && (
                <span className="sector-node-boss">
                  BOSS
                </span>
              )}
            </span>

            {/* Aura Ring animation */}
            {unlocked && (
              <span
                className="aura-ring-layer" 
                style={{ color: themeColor }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
