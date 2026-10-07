import React, { useState, useEffect } from 'react';
import Level1NexusDefense from './Level1NexusDefense';
import Level2SyndicateSiege from './Level2SyndicateSiege';
import { EmergenceScene } from '../../src/components/EmergenceSimulation/EmergenceScene';
import { EmergenceDataProvider } from '../../src/components/EmergenceSimulation/EmergenceDataContext';
import UniverseMap, { SECTORS } from './UniverseMap';
import SectorCampaignMission from './SectorCampaignMission';
import { isCampaignMissionLevel } from './campaignMissionData';
import { useConscience } from '../../src/components/ConscienceProvider';
import './cosmic-strategy.css';

const CAMPAIGN_ACTS = SECTORS.map((sector) => sector.name);

export default function MatrixOfConscienceApp() {
  const { userLevel, setUserLevel, cosmicLogs, sectorControl, factions } = useConscience();
  const [level, setLevel] = useState<number>(0);
  const [selectedSector, setSelectedSector] = useState<number>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const selectedSectorData = SECTORS.find((sector) => sector.id === selectedSector) ?? SECTORS[0];
  const selectedMissionLevel = selectedSectorData.id;

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('moc-progress');
      if (savedProgress) {
        const parsed = parseInt(savedProgress, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= SECTORS.length) {
          setUnlockedLevel(parsed);
          setSelectedSector(parsed);
          setUserLevel(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load level progress:', e);
    }
  }, []);

  const saveProgress = (nextLevel: number) => {
    if (nextLevel > unlockedLevel && nextLevel <= SECTORS.length) {
      setUnlockedLevel(nextLevel);
      try {
        localStorage.setItem('moc-progress', nextLevel.toString());
      } catch (e) {
        console.error('Failed to save level progress:', e);
      }
    }
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all game progress?')) {
      setUnlockedLevel(1);
      setUserLevel(1);
      setSelectedSector(1);
      setLevel(0);
      try {
        localStorage.setItem('moc-progress', '1');
      } catch (e) {
        console.error('Failed to reset level progress:', e);
      }
    }
  };

  const handleSelectSector = (sectorId: number) => {
    setSelectedSector(sectorId);
  };

  const deploySelectedSector = () => {
    if (selectedMissionLevel <= unlockedLevel) setLevel(selectedMissionLevel);
  };

  const completeLevel = (completedLevel: number, autoAdvance = false) => {
    const nextLevel = Math.min(completedLevel + 1, SECTORS.length);
    saveProgress(nextLevel);
    setUserLevel((currentLevel: number) => Math.max(currentLevel, nextLevel));
    setSelectedSector(nextLevel);
    if (autoAdvance) {
      setLevel(nextLevel);
    } else {
      setLevel(0);
    }
  };

  // Level selector / Galaxy Map UI
  if (level === 0) {
    return (
      <div className="universe-map-container">
        <header className="universe-header">
          <div className="universe-eyebrow">THE SEVEN-STAR CAMPAIGN</div>
          <h1>Matrix of Conscience</h1>
          <p className="universe-intro">
            A broken beacon divides the star grid. Reconnect its worlds through courage, trust, and alliances that can outlast a war.
          </p>
          <div className="campaign-status">
            <div className="campaign-status-copy">
              <span>CAMPAIGN · LEVEL {unlockedLevel} OF {SECTORS.length}</span>
              <strong>{CAMPAIGN_ACTS[unlockedLevel - 1]}</strong>
            </div>
            <div
              className="campaign-progress"
              role="progressbar"
              aria-label="Campaign levels unlocked"
              aria-valuemin={1}
              aria-valuemax={SECTORS.length}
              aria-valuenow={unlockedLevel}
            >
              <span style={{ width: `${(unlockedLevel / SECTORS.length) * 100}%` }} />
            </div>
            <div className="overlord-level">
              <span>OVERLORD LEVEL</span>
              <strong>{userLevel}</strong>
            </div>
          </div>
        </header>

        <div className="strategy-layout">
          <section className="strategy-map-column" aria-label="Sector deployment map">
            <div className="map-instructions">Select an unlocked sector to read its transmission.</div>
            <UniverseMap selectedSectorId={selectedSector} onSelectSector={handleSelectSector} />
            <div className="map-legend" aria-label="Map legend">
              <span><i className="legend-swatch legend-open" />Connected sector</span>
              <span><i className="legend-swatch legend-locked" />Signal locked</span>
              <span><i className="legend-swatch legend-boss" />Sovereign encounter</span>
            </div>
          </section>

          <aside className="faction-panel" aria-label="Campaign briefing and faction telemetry">
            <section className="mission-briefing" aria-labelledby="mission-briefing-title" aria-live="polite">
              <div className="mission-briefing-kicker">
                <span>{selectedSectorData.chapter}</span>
                {selectedSectorData.isBoss && <span className="boss-tag">SOVEREIGN</span>}
              </div>
              <h2 id="mission-briefing-title">{selectedSectorData.name}</h2>
              <p>{selectedSectorData.transmission}</p>
              <div className="mission-objective">
                <span>OBJECTIVE</span>
                <strong>{selectedSectorData.objective}</strong>
              </div>
              <button
                className="mission-deploy-button"
                type="button"
                onClick={deploySelectedSector}
                disabled={selectedMissionLevel > unlockedLevel}
              >
                {selectedMissionLevel <= unlockedLevel ? `Deploy to level ${selectedMissionLevel}` : 'Unlock this sector to deploy'}
                <span aria-hidden="true">→</span>
              </button>
            </section>

            <div className="faction-section">
              <h3 className="faction-heading">Faction Control</h3>
              <div className="faction-list">
                {Object.keys(factions).map(key => {
                  const f = factions[key as keyof typeof factions];
                  const controlledSectors = Object.keys(sectorControl).filter(
                    sKey => sectorControl[parseInt(sKey)] === key
                  ).length;

                  return (
                    <div key={key} className="faction-card" style={{ borderLeft: `3px solid ${f.color}` }}>
                      <div className="faction-card-heading">
                        <span>{f.name}</span>
                        <span className="faction-sector-count">{controlledSectors} Sectors</span>
                      </div>
                      <p>{f.special}</p>
                    </div>
                  );
                })}
              </div>

              <h3 className="telemetry-heading">Telemetry Logs</h3>
              <div className="cosmic-log-panel" aria-live="polite">
                {cosmicLogs.map((log, idx) => (
                  <div key={idx} className="cosmic-log-entry">{log}</div>
                ))}
              </div>
            </div>

            <div className="map-actions">
              <button className="reset-progress-button" type="button" onClick={resetProgress}>
                Reset Level Progress
              </button>
              <a className="arcade-hub-link" href="../">Back to Arcade Hub</a>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Render Level 1
  if (level === 1) {
    return (
      <Level1NexusDefense
        onBack={() => setLevel(0)}
        onVictory={() => completeLevel(1, true)}
      />
    );
  }

  // Render Level 2
  if (level === 2) {
    return (
      <Level2SyndicateSiege
        onBack={() => setLevel(0)}
        onVictory={() => completeLevel(2, true)}
        sectorId={selectedSector}
      />
    );
  }

  // Render Level 3
  if (level === 3) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#030307' }}>
        <button
          onClick={() => setLevel(0)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 9999,
            background: 'rgba(30, 41, 59, 0.75)',
            border: '1px solid rgba(0, 242, 255, 0.3)',
            color: '#00f2ff',
            padding: '0.45rem 1rem',
            borderRadius: '999px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(0, 242, 255, 0.2)'
          }}
        >
          ← Sector Map
        </button>
        <EmergenceDataProvider>
          <EmergenceScene
            sectorId={selectedSector}
            onMissionComplete={() => completeLevel(3)}
          />
        </EmergenceDataProvider>
      </div>
    );
  }

  if (isCampaignMissionLevel(level)) {
    return (
      <SectorCampaignMission
        level={level}
        sector={selectedSectorData}
        onBack={() => setLevel(0)}
        onVictory={() => completeLevel(level)}
      />
    );
  }

  return null;
}
