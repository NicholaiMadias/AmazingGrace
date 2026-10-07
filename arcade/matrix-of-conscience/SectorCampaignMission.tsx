import React, { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { SectorData } from './UniverseMap';
import { CAMPAIGN_MISSIONS } from './campaignMissionData';
import type { CampaignMissionLevel } from './campaignMissionData';
import './sector-campaign-mission.css';

type DefenseType = 'pulse' | 'snare' | 'lance' | 'nova';
type EnemyType = 'scout' | 'bruiser' | 'boss';

interface DefenseTower {
  row: number;
  column: number;
  type: DefenseType;
  cooldown: number;
}

interface MissionEnemy {
  id: string;
  pathIndex: number;
  hp: number;
  maxHp: number;
  speed: number;
  delay: number;
  type: EnemyType;
}

interface MissionState {
  wave: number;
  credits: number;
  integrity: number;
  score: number;
  towers: DefenseTower[];
  enemies: MissionEnemy[];
  waveActive: boolean;
  victory: boolean;
  defeat: boolean;
}

interface DefenseDefinition {
  name: string;
  symbol: string;
  cost: number;
  damage: number;
  range: number;
  cooldown: number;
  detail: string;
}

const DEFENSES: Record<DefenseType, DefenseDefinition> = {
  pulse: { name: 'Pulse Beacon', symbol: '✦', cost: 80, damage: 7, range: 2, cooldown: 3, detail: 'Reliable short-range damage.' },
  snare: { name: 'Gravity Snare', symbol: '◉', cost: 120, damage: 3, range: 3, cooldown: 2, detail: 'Slows enemies caught in its field.' },
  lance: { name: 'Aurora Lance', symbol: '⌁', cost: 180, damage: 16, range: 3, cooldown: 5, detail: 'Long-range armor breaker.' },
  nova: { name: 'Nova Array', symbol: '✹', cost: 260, damage: 42, range: 1.5, cooldown: 9, detail: 'Heavy damage for the final approach.' }
};

const ROWS = 8;
const COLUMNS = 10;
const HIGH_SCORE_KEY = 'moc-campaign-high-scores-v1';
const BADGE_KEY = 'moc-campaign-badges-v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const cellKey = (row: number, column: number) => `${row}:${column}`;

function createInitialState(level: CampaignMissionLevel): MissionState {
  const mission = CAMPAIGN_MISSIONS[level];
  return {
    wave: 1,
    credits: mission.startingCredits,
    integrity: mission.coreIntegrity,
    score: 0,
    towers: [],
    enemies: [],
    waveActive: false,
    victory: false,
    defeat: false
  };
}

function createWaveEnemies(level: CampaignMissionLevel, wave: number, routeLength: number): MissionEnemy[] {
  const mission = CAMPAIGN_MISSIONS[level];
  const count = 3 + Math.min(wave, 4) + Math.floor((level - 4) / 2);
  const enemies = Array.from({ length: count }, (_, index): MissionEnemy => {
    const type: EnemyType = index > 0 && index % 4 === 0 ? 'bruiser' : 'scout';
    const hp = mission.enemyHealth + wave * 2 + (type === 'bruiser' ? 8 : 0);
    return {
      id: `${level}-${wave}-${index}`,
      pathIndex: 0,
      hp,
      maxHp: hp,
      speed: mission.enemySpeed + Math.min(0.08, (wave - 1) * 0.012),
      delay: index * 3,
      type
    };
  });

  if (wave === mission.waves) {
    const bossHp = mission.enemyHealth * 8 + level * 4 + wave * 4;
    enemies.push({
      id: `${level}-${wave}-sovereign`,
      pathIndex: 0,
      hp: bossHp,
      maxHp: bossHp,
      speed: mission.enemySpeed * 0.72,
      delay: count * 3,
      type: 'boss'
    });
  }

  if (routeLength < 2) throw new Error(`Campaign level ${level} has no usable defense route.`);
  return enemies;
}

interface SectorCampaignMissionProps {
  level: CampaignMissionLevel;
  sector: SectorData;
  onBack: () => void;
  onVictory: () => void;
}

export default function SectorCampaignMission({ level, sector, onBack, onVictory }: SectorCampaignMissionProps) {
  const mission = CAMPAIGN_MISSIONS[level];
  const [state, setState] = useState(() => createInitialState(level));
  const [selectedDefense, setSelectedDefense] = useState<DefenseType | null>(null);
  const [notice, setNotice] = useState('Build your perimeter, then launch the first wave.');
  const [highScore, setHighScore] = useState(0);
  const missionStyle: CSSProperties & { '--mission-accent': string; '--mission-secondary': string } = {
    '--mission-accent': mission.accent,
    '--mission-secondary': mission.secondaryAccent
  };

  const pathCellIndices = useMemo(() => {
    const indices = new Map<string, number>();
    mission.route.forEach(([row, column], index) => indices.set(cellKey(row, column), index));
    return indices;
  }, [mission]);

  const occupiedCells = useMemo(() => new Set(state.towers.map((tower) => cellKey(tower.row, tower.column))), [state.towers]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      if (!saved) return;
      const scores: unknown = JSON.parse(saved);
      if (!isRecord(scores)) throw new Error('Saved Matrix campaign scores are not a record.');
      const score = scores[String(level)];
      if (score === undefined) return;
      if (typeof score !== 'number' || !Number.isFinite(score) || score < 0) {
        throw new Error(`Saved score for campaign level ${level} is invalid.`);
      }
      setHighScore(score);
    } catch (error) {
      console.error('Could not load the Matrix campaign high score.', error);
    }
  }, [level]);

  useEffect(() => {
    if (!state.waveActive) return;

    const timer = window.setInterval(() => {
      setState((current) => {
        if (!current.waveActive) return current;

        let integrity = current.integrity;
        let credits = current.credits;
        let score = current.score;
        const movingEnemies: MissionEnemy[] = [];

        for (const enemy of current.enemies) {
          if (enemy.delay > 0) {
            movingEnemies.push({ ...enemy, delay: enemy.delay - 1 });
            continue;
          }

          const nextPathIndex = enemy.pathIndex + enemy.speed;
          if (nextPathIndex >= mission.route.length) {
            integrity -= enemy.type === 'boss' ? 5 : enemy.type === 'bruiser' ? 2 : 1;
            continue;
          }
          movingEnemies.push({ ...enemy, pathIndex: nextPathIndex });
        }

        const towers = current.towers.map((tower) => ({
          ...tower,
          cooldown: Math.max(0, tower.cooldown - 1)
        }));

        for (const tower of towers) {
          if (tower.cooldown > 0) continue;
          const definition = DEFENSES[tower.type];
          const target = movingEnemies.find((enemy) => {
            if (enemy.hp <= 0 || enemy.delay > 0) return false;
            const [row, column] = mission.route[Math.floor(enemy.pathIndex)];
            return Math.abs(row - tower.row) + Math.abs(column - tower.column) <= definition.range;
          });
          if (!target) continue;

          if (tower.type === 'snare') {
            target.speed = Math.max(0.22, target.speed * 0.72);
          } else {
            target.hp -= definition.damage;
          }
          tower.cooldown = definition.cooldown;

          if (target.hp <= 0) {
            credits += target.type === 'boss' ? 90 : target.type === 'bruiser' ? 30 : 18;
            score += target.type === 'boss' ? 500 : target.type === 'bruiser' ? 120 : 60;
          }
        }

        const survivors = movingEnemies.filter((enemy) => enemy.hp > 0);
        if (integrity <= 0) {
          return {
            ...current,
            integrity: 0,
            credits,
            score,
            towers,
            enemies: [],
            waveActive: false,
            defeat: true
          };
        }

        if (survivors.length === 0) {
          if (current.wave >= mission.waves) {
            return {
              ...current,
              integrity,
              credits,
              score,
              towers,
              enemies: [],
              waveActive: false,
              victory: true
            };
          }
          return {
            ...current,
            integrity,
            credits: credits + 80 + current.wave * 20,
            score,
            towers,
            enemies: [],
            waveActive: false,
            wave: current.wave + 1
          };
        }

        return { ...current, integrity, credits, score, towers, enemies: survivors };
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, [mission, state.waveActive]);

  const placeDefense = (row: number, column: number) => {
    if (!selectedDefense || state.waveActive || state.victory || state.defeat) return;
    const key = cellKey(row, column);
    if (pathCellIndices.has(key)) {
      setNotice('Keep the route clear; defenses can only be placed beside it.');
      return;
    }
    if (occupiedCells.has(key)) {
      setNotice('That grid cell already holds a defense.');
      return;
    }

    const defense = DEFENSES[selectedDefense];
    if (state.credits < defense.cost) {
      setNotice(`The ${defense.name} needs ${defense.cost} credits.`);
      return;
    }

    setState((current) => ({
      ...current,
      credits: current.credits - defense.cost,
      towers: [...current.towers, { row, column, type: selectedDefense, cooldown: 0 }]
    }));
    setNotice(`${defense.name} deployed. Add another system or launch the wave.`);
  };

  const launchWave = () => {
    if (state.waveActive || state.victory || state.defeat) return;
    setState((current) => ({
      ...current,
      enemies: createWaveEnemies(level, current.wave, mission.route.length),
      waveActive: true
    }));
    setSelectedDefense(null);
    setNotice(`Wave ${state.wave} is inbound. Hold the beacon line.`);
  };

  const retryMission = () => {
    setState(createInitialState(level));
    setSelectedDefense(null);
    setNotice('Perimeter cleared. Rebuild your defenses for a fresh attempt.');
  };

  const saveRewardsAndContinue = () => {
    try {
      const rawBadges = localStorage.getItem(BADGE_KEY);
      const badges: unknown = rawBadges ? JSON.parse(rawBadges) : [];
      if (!Array.isArray(badges) || badges.some((badge) => typeof badge !== 'string')) {
        throw new Error('Saved Matrix campaign badges are invalid.');
      }
      if (!badges.includes(mission.badge)) badges.push(mission.badge);
      localStorage.setItem(BADGE_KEY, JSON.stringify(badges));
    } catch (error) {
      console.error('Could not save the Matrix campaign certification.', error);
    }

    try {
      const rawScores = localStorage.getItem(HIGH_SCORE_KEY);
      const scores: unknown = rawScores ? JSON.parse(rawScores) : {};
      if (!isRecord(scores)) throw new Error('Saved Matrix campaign scores are invalid.');
      const previousScore = scores[String(level)];
      if (previousScore !== undefined && (typeof previousScore !== 'number' || !Number.isFinite(previousScore))) {
        throw new Error(`Saved score for campaign level ${level} is invalid.`);
      }
      const bestScore = Math.max(typeof previousScore === 'number' ? previousScore : 0, state.score);
      scores[String(level)] = bestScore;
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
      setHighScore(bestScore);
    } catch (error) {
      console.error('Could not save the Matrix campaign high score.', error);
    }

    onVictory();
  };

  return (
    <main className="sector-mission" style={missionStyle}>
      <header className="sector-mission-header">
        <button className="mission-back-button" type="button" onClick={onBack}>← Sector map</button>
        <div className="mission-title-block">
          <span>CAMPAIGN LEVEL {level} · {mission.faction}</span>
          <h1>{sector.name}</h1>
          <p>{sector.chapter}</p>
        </div>
        <div className="mission-hud" aria-label="Mission status">
          <div><span>CORE</span><strong>{state.integrity}/{mission.coreIntegrity}</strong></div>
          <div><span>CREDITS</span><strong>{state.credits}</strong></div>
          <div><span>WAVE</span><strong>{Math.min(state.wave, mission.waves)}/{mission.waves}</strong></div>
        </div>
      </header>

      <section className="mission-story-card" aria-label="Sector transmission">
        <div>
          <span className="mission-story-label">INCOMING TRANSMISSION</span>
          <p>{sector.transmission}</p>
        </div>
        <div className="mission-story-objective">
          <span>MISSION OBJECTIVE</span>
          <strong>{sector.objective}</strong>
          <small>{mission.modifier}</small>
        </div>
      </section>

      <div className="mission-play-area">
        <section className="mission-board-panel" aria-labelledby="defense-grid-title">
          <div className="mission-board-heading">
            <div>
              <span>TACTICAL OVERVIEW</span>
              <h2 id="defense-grid-title">Defense Grid</h2>
            </div>
            <div className="mission-score"><span>HIGH SCORE</span><strong>{Math.max(highScore, state.score)}</strong></div>
          </div>

          <div className="mission-route-legend">
            <span><i className="route-key" />Enemy route</span>
            <span><i className="core-key" />Protected beacon</span>
            <span><i className="tower-key" />Defense platform</span>
          </div>

          <div className="mission-grid" role="grid" aria-label={`${sector.name} tactical defense grid`}>
            {Array.from({ length: ROWS }, (_, row) =>
              Array.from({ length: COLUMNS }, (_, column) => {
                const key = cellKey(row, column);
                const routeIndex = pathCellIndices.get(key);
                const tower = state.towers.find((entry) => entry.row === row && entry.column === column);
                const enemy = routeIndex === undefined
                  ? undefined
                  : state.enemies.find((entry) => entry.hp > 0 && Math.floor(entry.pathIndex) === routeIndex);
                const isGoal = routeIndex === mission.route.length - 1;
                const disabled = routeIndex !== undefined || Boolean(tower) || state.waveActive || state.victory || state.defeat;

                return (
                  <button
                    key={key}
                    className={`mission-cell ${routeIndex !== undefined ? 'route-cell' : ''} ${isGoal ? 'goal-cell' : ''} ${tower ? 'tower-cell' : ''}`}
                    type="button"
                    role="gridcell"
                    aria-label={tower ? `${DEFENSES[tower.type].name}, row ${row + 1}, column ${column + 1}` : isGoal ? 'Protected beacon core' : routeIndex !== undefined ? `Enemy route, step ${routeIndex + 1}` : `Build platform, row ${row + 1}, column ${column + 1}`}
                    disabled={disabled}
                    onClick={() => placeDefense(row, column)}
                  >
                    {isGoal && <span className="mission-core-icon" aria-hidden="true">◆</span>}
                    {tower && <span className={`placed-defense defense-${tower.type}`} aria-hidden="true">{DEFENSES[tower.type].symbol}</span>}
                    {enemy && <span className={`mission-enemy enemy-${enemy.type}`} aria-label={`${enemy.type}, ${enemy.hp} health`}><i style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }} /></span>}
                  </button>
                );
              })
            )}
          </div>

          <p className="mission-live-notice" aria-live="polite">{notice}</p>
        </section>

        <aside className="mission-controls">
          <div className="mission-control-heading">
            <span>DEPLOYMENT SYSTEMS</span>
            <h2>Build the line</h2>
            <p>Choose a defense, then tap an open cell beside the route.</p>
          </div>

          <div className="defense-options">
            {(Object.keys(DEFENSES) as DefenseType[]).map((type) => {
              const defense = DEFENSES[type];
              return (
                <button
                  key={type}
                  className={`defense-option defense-option-${type} ${selectedDefense === type ? 'selected' : ''}`}
                  type="button"
                  aria-pressed={selectedDefense === type}
                  disabled={state.waveActive || state.victory || state.defeat || state.credits < defense.cost}
                  onClick={() => setSelectedDefense((selected) => selected === type ? null : type)}
                >
                  <span className="defense-symbol" aria-hidden="true">{defense.symbol}</span>
                  <span className="defense-copy"><strong>{defense.name}</strong><small>{defense.detail}</small></span>
                  <span className="defense-cost">{defense.cost} CR</span>
                </button>
              );
            })}
          </div>

          <div className="mission-wave-card">
            <span>{state.waveActive ? `WAVE ${state.wave} IN PROGRESS` : `NEXT · WAVE ${Math.min(state.wave, mission.waves)}`}</span>
            <strong>{state.wave === mission.waves ? mission.bossName : mission.enemyName}</strong>
            <p>{state.wave === mission.waves ? 'The sovereign is advancing with the final formation.' : 'Reinforcements are moving toward the protected beacon.'}</p>
          </div>

          <button className="launch-wave-button" type="button" onClick={launchWave} disabled={state.waveActive || state.victory || state.defeat}>
            {state.waveActive ? 'Holding the line…' : `Launch wave ${Math.min(state.wave, mission.waves)}`}
            <span aria-hidden="true">↗</span>
          </button>

          {state.defeat && (
            <div className="mission-outcome mission-defeat" role="alert">
              <span>BEACON LOST</span>
              <strong>The sector signal has fallen, but your campaign remains intact.</strong>
              <button type="button" onClick={retryMission}>Rebuild and retry</button>
              <button type="button" onClick={onBack}>Return to sector map</button>
            </div>
          )}
        </aside>
      </div>

      {state.victory && (
        <div className="mission-victory-backdrop">
          <section className="mission-outcome mission-victory" role="dialog" aria-modal="true" aria-labelledby="mission-victory-title">
            <span className="victory-kicker">SECTOR RESTORED · LEVEL {level} COMPLETE</span>
            <div className="victory-emblem" aria-hidden="true">✦</div>
            <h2 id="mission-victory-title">{sector.name} answers the signal</h2>
            <p>{mission.ending}</p>
            <div className="certification-badge">
              <span>SEVEN-STAR GRID CERTIFICATION</span>
              <strong>{mission.badge}</strong>
              <small>HIGH SCORE · {Math.max(highScore, state.score)}</small>
            </div>
            <button type="button" onClick={saveRewardsAndContinue}>Save certification · continue</button>
          </section>
        </div>
      )}
    </main>
  );
}
