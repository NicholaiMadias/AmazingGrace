import React, { useState, useEffect } from 'react';
import Level1NexusDefense from './Level1NexusDefense';
import Level2SyndicateSiege from './Level2SyndicateSiege';
import { EmergenceScene } from '../../src/components/EmergenceSimulation/EmergenceScene';
import { EmergenceDataProvider } from '../../src/components/EmergenceSimulation/EmergenceDataContext';
import UniverseMap from './UniverseMap';
import { useConscience } from '../../src/components/ConscienceProvider';
import './cosmic-strategy.css';

export default function MatrixOfConscienceApp() {
  const { userLevel, setUserLevel, cosmicLogs, sectorControl, factions } = useConscience();
  const [level, setLevel] = useState<number>(0);
  const [selectedSector, setSelectedSector] = useState<number>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('moc-progress');
      if (savedProgress) {
        const parsed = parseInt(savedProgress, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 3) {
          setUnlockedLevel(parsed);
          setUserLevel(prev => Math.max(prev, parsed));
        }
      }
    } catch (e) {
      console.error('Failed to load level progress:', e);
    }
  }, []);

  const saveProgress = (nextLevel: number) => {
    if (nextLevel > unlockedLevel && nextLevel <= 3) {
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
      setLevel(0);
      try {
        localStorage.setItem('moc-progress', '1');
      } catch (e) {}
    }
  };

  const handleSelectSector = (sectorId: number) => {
    setSelectedSector(sectorId);
    if (sectorId === 1) {
      setLevel(1);
    } else if (sectorId === 2 || sectorId === 4) {
      setLevel(2);
    } else if (sectorId === 3 || sectorId === 5) {
      setLevel(3);
    }
  };

  // Level selector / Galaxy Map UI
  if (level === 0) {
    return (
      <div className="universe-map-container">
        {/* Header Section */}
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem 0.5rem 1rem', position: 'relative', zIndex: 10 }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            margin: '0 0 0.25rem 0',
            background: 'linear-gradient(135deg, #00f2ff 0%, #bc13fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(0, 242, 255, 0.15)',
            fontFamily: "'Outfit', sans-serif"
          }}>
            Matrix of Conscience
          </h1>
          <p style={{
            color: '#94a3b8',
            fontSize: '0.9rem',
            margin: '0 0 0.5rem 0',
            letterSpacing: '0.05em'
          }}>
            GALACTIC STRATEGY NETWORK & ACTIVE SECTOR CONFINEMENT
          </p>
          
          {/* User Level Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 16px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontFamily: 'monospace'
          }}>
            <span>OVERLORD LEVEL:</span>
            <strong style={{ color: '#00f2ff', textShadow: '0 0 10px rgba(0,242,255,0.5)' }}>{userLevel}</strong>
          </div>
        </div>

        {/* Strategic Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gap: '1.5rem',
          width: '95%',
          maxWidth: '1280px',
          margin: '0 auto',
          flex: 1,
          alignItems: 'stretch',
          paddingBottom: '1.5rem',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Main Universe Map */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <UniverseMap onSelectSector={handleSelectSector} />
          </div>

          {/* Faction Wars Panel */}
          <div style={{
            background: 'rgba(8, 12, 24, 0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#fff',
                marginTop: 0,
                marginBottom: '1rem',
                fontFamily: "'Outfit', sans-serif",
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '8px'
              }}>
                Faction Control
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                {Object.keys(factions).map(key => {
                  const f = factions[key as keyof typeof factions];
                  const controlledSectors = Object.keys(sectorControl).filter(
                    sKey => sectorControl[parseInt(sKey)] === key
                  ).length;

                  return (
                    <div key={key} style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${f.color}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{f.name}</span>
                        <span style={{ fontSize: '0.8rem', color: f.color, fontFamily: 'monospace' }}>
                          {controlledSectors} Sectors
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        {f.special}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Cosmic Event Logger */}
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#fff',
                marginBottom: '0.5rem',
                fontFamily: "'Outfit', sans-serif"
              }}>
                Telemetry Logs
              </h3>
              <div className="cosmic-log-panel">
                {cosmicLogs.map((log, idx) => (
                  <div key={idx} className="cosmic-log-entry">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
              <button
                onClick={resetProgress}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Reset Level Progress
              </button>
              <a
                href="../"
                style={{
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                Back to Arcade Hub
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Level 1
  if (level === 1) {
    return (
      <Level1NexusDefense
        onBack={() => setLevel(0)}
        onVictory={() => {
          saveProgress(2);
          setUserLevel(prev => Math.max(prev, 2));
          setLevel(0);
        }}
      />
    );
  }

  // Render Level 2
  if (level === 2) {
    return (
      <Level2SyndicateSiege
        onBack={() => setLevel(0)}
        onVictory={() => {
          saveProgress(3);
          setUserLevel(prev => Math.max(prev, 3));
          setLevel(0);
        }}
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
          <EmergenceScene sectorId={selectedSector} />
        </EmergenceDataProvider>
      </div>
    );
  }

  return null;
}
