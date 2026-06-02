import { useEffect, useMemo, useState, createContext, useContext, useRef, useCallback } from "react";
import "./matrix-of-conscience.css";
// @ts-ignore
import { useTowerDefenseHUD } from "../modules/tower-defense/useTowerDefenseHUD";
// @ts-ignore
import { useSevenStarsHUD } from "../modules/seven-stars/useSevenStarsHUD";
// @ts-ignore
import { useBibleStudyHUD } from "../modules/bible-study/useBibleStudyHUD";
// @ts-ignore
import SpiritualFormationPanel from "../spiritual/SpiritualFormationPanel";
// @ts-ignore
import InnerCourtScreen from "../inner-court/InnerCourtScreen";
// @ts-ignore
import { useNexusRouter } from "../router/useNexusRouter";
// @ts-ignore
import ThroneRoomScreen from "../throne/ThroneRoomScreen";
// @ts-ignore
import { useHUD } from "../hud/HUDContext";
// @ts-ignore
import TempleNavigationScreen from "../temple/TempleNavigationScreen";
// @ts-ignore
import HolyEncounterScreen from "../holy/HolyEncounterScreen";
// @ts-ignore
import VisionCodexScreen from "../oracle-chamber/VisionCodexScreen";
// @ts-ignore
import BookOfLifeScreen from "../book/BookOfLifeScreen";
// @ts-ignore
import GuardianScreen from "../temple-guardians/GuardianScreen";
// @ts-ignore
import TempleHologram from "../temple3d/TempleHologram";
// @ts-ignore
import CelestialLadderScreen from "../ascension/CelestialLadderScreen";
// @ts-ignore
import PreOriginField from "../ascension/PreOriginField";
// @ts-ignore
import UnutterableConstant from "../ascension/UnutterableConstant";
// @ts-ignore
import SheilaPathScreen from "../dual-ascent/SheilaPathScreen";
// @ts-ignore
import YiPathScreen from "../dual-ascent/YiPathScreen";
// @ts-ignore
import MirrorLayerScreen from "../dual-ascent/MirrorLayerScreen";
// @ts-ignore
import AeonEngineScreen from "../aeon/AeonEngineScreen";
// @ts-ignore
import EmpyreanSphereScreen from "../book/EmpyreanSphereScreen";
// @ts-ignore
import OriginPointScreen from "../book/OriginPointScreen";




const TELEMETRY_ENDPOINT = "https://script.google.com/macros/s/AKfycbyq6jzCVGtoOTcid-LzD_njmuuOOSwJrhktU3ya1GKXLZI9jp6yCMJzlrdvyNb1fpkb/exec";

type FamilyStats = {
  integrity: number;
  community: number;
  karma: number;
  wisdom: number;
};

type Props = {
  stats?: FamilyStats;
  chainLevel?: number;
  activeUser?: string;
};

const M_CONSCIENCE_DEFAULT = { integrity: 0.85, community: 0.72, karma: 0.78, wisdom: 0.90 };
const ConscienceContext = createContext<{
  metrics: typeof M_CONSCIENCE_DEFAULT;
  updateMetrics: (deltas: Partial<typeof M_CONSCIENCE_DEFAULT>) => void;
} | null>(null);

type ConscienceProviderProps = {
  children: React.ReactNode;
  initialMetrics?: typeof M_CONSCIENCE_DEFAULT;
};

export function ConscienceProvider({ children, initialMetrics = M_CONSCIENCE_DEFAULT }: ConscienceProviderProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const prevMetricsRef = useRef(initialMetrics);

  useEffect(() => {
    const changed = (Object.keys(initialMetrics) as Array<keyof typeof M_CONSCIENCE_DEFAULT>).some(
      (key) => initialMetrics[key] !== prevMetricsRef.current[key]
    );
    if (changed) {
      setMetrics(initialMetrics);
      prevMetricsRef.current = initialMetrics;
    }
  }, [initialMetrics]);

  const updateMetrics = useCallback((deltas: Partial<typeof M_CONSCIENCE_DEFAULT>) => {
    setMetrics((prev) => {
      const updated = { ...prev };
      Object.keys(deltas).forEach((key) => {
        const k = key as keyof typeof M_CONSCIENCE_DEFAULT;
        updated[k] = Math.max(0, Math.min(1, prev[k] + (deltas[k] || 0)));
      });
      return updated;
    });
  }, []);
  const value = useMemo(() => ({ metrics, updateMetrics }), [metrics, updateMetrics]);
  return <ConscienceContext.Provider value={value}>{children}</ConscienceContext.Provider>;
}

function useConscience() {
  const ctx = useContext(ConscienceContext);
  if (!ctx) throw new Error("useConscience must be used inside ConscienceProvider");
  return ctx;
}

const CHURCHES = [
  { name: 'Ephesus', message: 'The church in Ephesus was known for its hard work and perseverance. However, Jesus warned them that they had abandoned their first love.', question: 'What had the church in Ephesus abandoned?', options: ['Their generosity', 'Their first love', 'Their church building', 'Their daily prayers'], answer: 'Their first love' },
  { name: 'Smyrna', message: 'The church in Smyrna faced tribulation and poverty, yet Jesus praised their faithfulness and told them not to fear suffering.', question: 'What did Jesus tell Smyrna not to fear?', options: ['False prophets', 'Poverty', 'Suffering', 'Travel'], answer: 'Suffering' },
  { name: 'Pergamum', message: 'Pergamum held fast to Jesus’ name in a difficult city, but some there were tolerating false teaching.', question: 'What problem did Pergamum tolerate?', options: ['False teaching', 'Silence', 'No worship songs', 'Lack of elders'], answer: 'False teaching' },
  { name: 'Thyatira', message: 'Thyatira was praised for love, faith, service, and perseverance, but rebuked for tolerating corruption.', question: 'What was Thyatira praised for?', options: ['Military power', 'Love and service', 'Wealth alone', 'Temple size'], answer: 'Love and service' },
  { name: 'Sardis', message: 'Sardis had a reputation for being alive, but Jesus said they were dead and needed to wake up.', question: 'What did Sardis need to do?', options: ['Build larger walls', 'Wake up', 'Move cities', 'Collect offerings'], answer: 'Wake up' },
  { name: 'Philadelphia', message: 'Philadelphia had little strength, but kept Jesus’ word and did not deny His name. An open door was set before them.', question: 'What was set before Philadelphia?', options: ['A closed gate', 'A golden crown', 'An open door', 'A mountain path'], answer: 'An open door' },
  { name: 'Laodicea', message: 'Laodicea was called lukewarm—neither hot nor cold—and was warned against complacency.', question: 'How was Laodicea described?', options: ['Faithful', 'Bold', 'Lukewarm', 'Joyful'], answer: 'Lukewarm' }
];

export default function MatrixOfConscience({ stats, chainLevel, activeUser }: Props) {
  const initial = useMemo(() => {
    if (stats) {
      return {
        integrity: stats.integrity,
        community: stats.community,
        karma: stats.karma,
        wisdom: stats.wisdom
      };
    }
    return M_CONSCIENCE_DEFAULT;
  }, [stats]);

  return (
    <ConscienceProvider initialMetrics={initial}>
      <MatrixCoreMaster activeUser={activeUser || "nicholai_madias"} />
    </ConscienceProvider>
  );
}

function MatrixCoreMaster({ activeUser }: { activeUser: string }) {
  const { metrics, updateMetrics } = useConscience();
  const [terminalLog, setTerminalLog] = useState("System online. Standalone Unification Model deployed safely.");
  const [activeTab, setActiveTab] = useState("calibration");
  const [selectedStar, setSelectedStar] = useState<{ r: number; c: number } | null>(null);
  const currentUserId = activeUser;

  // HUD hook integrations
  const { showOverlay: startTowerDefense } = useTowerDefenseHUD();
  const { openSevenStars } = useSevenStarsHUD();
  const { openBibleStudy } = useBibleStudyHUD();
  const { screen, go } = useNexusRouter();
  const { hud } = useHUD();

  // Seven Stars local storage state and selection
  const [completedStars, setCompletedStars] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('aghl_sevenStarsCompleted') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedChurchIndex, setSelectedChurchIndex] = useState<number | null>(null);

  // Standalone M45 Local Grid Generation (No external imports)
  const [grid, setGrid] = useState([
    ["🔷", "⭐", "★", "⭐", "🔷", "♦", "🔷"],
    ["♦", "🔷", "⭐", "♦", "⬢", "⬢", "★"],
    ["★", "♦", "🔷", "★", "★", "🔷", "⬢"],
    ["♦", "⬢", "⭐", "⬢", "⭐", "⭐", "⬢"],
    ["🔷", "♦", "🔷", "🔷", "⭐", "⭐", "🔷"],
    ["★", "★", "⬢", "⬢", "🔷", "⬢", "⬢"],
    ["🔷", "⭐", "★", "🔷", "⭐", "⬢", "🔷"]
  ]);

  // Sync state deltas seamlessly with the background Key Matrix Google Sheet 
  useEffect(() => {
    const syncController = new AbortController();
    async function transmitMetrics() {
      try {
        await fetch(TELEMETRY_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            white: metrics.integrity,
            scarlet: metrics.karma,
            coherence: metrics.wisdom,
            updatedAt: Date.now()
          }),
          signal: syncController.signal
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Matrix alignment telemetry missed sync cycle:", err);
        }
      }
    }
    transmitMetrics();
    return () => syncController.abort();
  }, [metrics, currentUserId]);

  const handleTileClick = (r: number, c: number) => {
    if (selectedStar === null) {
      setSelectedStar({ r, c });
    } else {
      const distance = Math.abs(selectedStar.r - r) + Math.abs(selectedStar.c - c);
      if (distance === 1) {
        const nextGrid = grid.map(row => [...row]);
        const temp = nextGrid[selectedStar.r][selectedStar.c];
        nextGrid[selectedStar.r][selectedStar.c] = nextGrid[r][c];
        nextGrid[r][c] = temp;
        setGrid(nextGrid);
        updateMetrics({ integrity: 0.02, wisdom: 0.01 });
        setTerminalLog(`[M45 Shifter] Swapped node alignment at grid vectors.`);
      }
      setSelectedStar(null);
    }
  };

  const handleQuizAnswer = (churchName: string, selectedOption: string, correctAnswer: string) => {
    if (selectedOption === correctAnswer) {
      const updated = Array.from(new Set([...completedStars, churchName]));
      setCompletedStars(updated);
      localStorage.setItem('aghl_sevenStarsCompleted', JSON.stringify(updated));
      updateMetrics({ community: 0.05, karma: 0.02, wisdom: 0.03 });
      
      const allCompleted = updated.length === CHURCHES.length;
      if (allCompleted) {
        setTerminalLog(`[System Calibration] Epiphany achieved! All 7 congregation nodes perfectly aligned.`);
      } else {
        setTerminalLog(`[Verification SUCCESS] Calibrated node channel for: ${churchName}.`);
      }
      setSelectedChurchIndex(null);
    } else {
      setTerminalLog(`[ANOMALY Mismatch] Calibration override rejected at ${churchName}. Read carefully.`);
    }
  };

  const resetSevenStars = () => {
    setCompletedStars([]);
    localStorage.removeItem('aghl_sevenStarsCompleted');
    setTerminalLog("[Lattice Reset] All congregation coordinates released.");
  };

  if (screen === "innerCourt") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <InnerCourtScreen />
        </div>
      </div>
    );
  }

  if (screen === "throne") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <ThroneRoomScreen />
        </div>
      </div>
    );
  }

  if (screen === "temple") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <TempleNavigationScreen />
        </div>
      </div>
    );
  }

  if (screen === "holyOfHolies") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <HolyEncounterScreen />
        </div>
      </div>
    );
  }

  if (screen === "oracleChamber") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <VisionCodexScreen />
        </div>
      </div>
    );
  }

  if (screen === "bookOfLife") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <BookOfLifeScreen />
        </div>
      </div>
    );
  }

  if (screen === "temple3d") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <TempleHologram />
        </div>
      </div>
    );
  }

  if (screen === "ascension") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <CelestialLadderScreen />
        </div>
      </div>
    );
  }

  if (screen === "aeon") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <AeonEngineScreen />
        </div>
      </div>
    );
  }

  if (screen === "empyrean") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <EmpyreanSphereScreen />
        </div>
      </div>
    );
  }

  if (screen === "origin") {
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <OriginPointScreen />
        </div>
      </div>
    );
  }

  if (screen === "sheilaPath") {
    return <SheilaPathScreen />;
  }

  if (screen === "yiPath") {
    return <YiPathScreen />;
  }

  if (screen === "mirrorLayer") {
    return <MirrorLayerScreen />;
  }

  if (screen === "guardian") {
    const target = hud?.route?.target || "temple";
    return (
      <div className="mc-matrix-root">
        <div className="mc-container" style={{ padding: 0 }}>
          <GuardianScreen onPass={() => go(target)} onFail={() => go("temple")} />
        </div>
      </div>
    );
  }

  return (
    <div className="mc-matrix-root">
      <div className="mc-container">
        <header className="mc-header">
          <p className="mc-badge">NEXUS ARCADE // CORE UNIFICATION</p>
          <h1>MATRIX OF CONSCIENCE</h1>
          <div className="mc-nav-row">
            <button className={`mc-nav-btn ${activeTab === "calibration" ? "active" : ""}`} onClick={() => setActiveTab("calibration")}>
              M45 Calibration Grid
            </button>
            <button className={`mc-nav-btn ${activeTab === "sevenstars" ? "active" : ""}`} onClick={() => setActiveTab("sevenstars")}>
              Seven Stars Status
            </button>
            <button className={`mc-nav-btn ${activeTab === "formation" ? "active" : ""}`} onClick={() => setActiveTab("formation")}>
              Spiritual Formation
            </button>
            <button className={`mc-nav-btn ${activeTab === "innercourt" ? "active" : ""}`} onClick={() => setActiveTab("innercourt")}>
              Inner Court
            </button>
          </div>
        </header>

        <div className="mc-main-layout">
          <section className="mc-card mc-telemetry-panel">
            <h2>System Telemetry</h2>
            <div className="mc-bars-list">
              <MetricRow label="Integrity Matrix" value={metrics.integrity} color="var(--neon-blue)" />
              <MetricRow label="Community Thread" value={metrics.community} color="var(--neon-purple)" />
              <MetricRow label="Karma Continuum" value={metrics.karma} color="#f43f5e" />
              <MetricRow label="Wisdom Index" value={metrics.wisdom} color="var(--neon-gold)" />
            </div>
            <div className="mc-console-log">
              <div className="mc-log-terminal">{terminalLog}</div>
            </div>
            
            <div style={{ marginTop: "1rem", display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>HUD Subsystems</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={openSevenStars} 
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    fontSize: "0.75rem",
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    color: "#a78bfa",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  🌠 Sync Seven Stars HUD
                </button>
                <button 
                  onClick={openBibleStudy} 
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    fontSize: "0.75rem",
                    background: "rgba(234, 179, 8, 0.1)",
                    border: "1px solid rgba(234, 179, 8, 0.3)",
                    color: "#facc15",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  📖 Engage Bible Study
                </button>
              </div>
              <button 
                onClick={() => startTowerDefense({ wave: 1, coresRemaining: 5, lives: 20, credits: 100 })} 
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  background: "rgba(6, 182, 212, 0.1)",
                  border: "1px solid rgba(6, 182, 212, 0.3)",
                  color: "#22d3ee",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginBottom: "0.5rem"
                }}
              >
                🛡️ Launch Tower Defense
              </button>
              <button 
                onClick={() => go("innerCourt")} 
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  background: "rgba(167, 139, 250, 0.1)",
                  border: "1px solid rgba(167, 139, 250, 0.3)",
                  color: "#a78bfa",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginBottom: "0.5rem"
                }}
              >
                🚪 Enter Inner Court Cockpit
              </button>
              <button 
                onClick={() => go("temple")} 
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.75rem",
                  background: "rgba(234, 179, 8, 0.1)",
                  border: "1px solid rgba(234, 179, 8, 0.3)",
                  color: "var(--neon-gold)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                🕌 Open Temple Map Overworld
              </button>
            </div>
          </section>

          {activeTab === "calibration" && (
            <section className="mc-card mc-control-panel">
              <h2>M45 Constellation Shifter</h2>
              <p className="mc-panel-desc">Align neighbor nodes linearly to resolve localized database entropy metrics.</p>
              <div className="m45-interactive-grid">
                {grid.map((row, r) => (
                  <div key={r} className="m45-row">
                    {row.map((tile, c) => {
                      const isSelected = selectedStar && selectedStar.r === r && selectedStar.c === c;
                      return (
                        <button 
                          key={c} 
                          className={`m45-tile ${isSelected ? "selected-node" : ""}`}
                          onClick={() => handleTileClick(r, c)}
                        >
                          {tile}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "sevenstars" && (
            <section className="mc-card mc-control-panel">
              <h2>Seven Stars Alignment</h2>
              {selectedChurchIndex === null ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <p className="mc-panel-desc">Select a church node to calibrate the holy star matrix.</p>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--neon-gold)' }}>
                      {completedStars.length} / {CHURCHES.length} Stars Resonating
                    </span>
                  </div>

                  <div className="seven-stars-status-box">
                    {CHURCHES.map((church, idx) => {
                      const isCompleted = completedStars.includes(church.name);
                      return (
                        <div 
                          key={church.name} 
                          className="star-status-item" 
                          onClick={() => setSelectedChurchIndex(idx)}
                        >
                          <span>{isCompleted ? "🌟" : "✨"} {church.name}</span>
                          <span className={`status-tag ${isCompleted ? "completed-tag" : "click-trigger"}`} style={{
                            background: isCompleted ? 'rgba(52,211,153,0.12)' : undefined,
                            color: isCompleted ? '#34d399' : undefined,
                            border: isCompleted ? '1px solid rgba(52,211,153,0.3)' : undefined
                          }}>
                            {isCompleted ? "✔ Completed" : "⚡ Calibrate Node"}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mc-actions-group" style={{ marginTop: "1rem", display: 'flex', gap: '0.5rem' }}>
                    {completedStars.length > 0 && (
                      <button onClick={resetSevenStars} style={{
                        flex: 1,
                        padding: '0.65rem',
                        background: 'rgba(244,63,94,0.1)',
                        border: '1px solid rgba(244,63,94,0.3)',
                        color: '#f43f5e',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        ↺ Reset Journey
                      </button>
                    )}
                    <a href="../certificates/" className="mc-action-anchor text-center" style={{ flex: 1 }}>
                      📜 View Certificates
                    </a>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--neon-gold)' }}>
                      Calibrating: {CHURCHES[selectedChurchIndex].name}
                    </h3>
                    <button 
                      onClick={() => setSelectedChurchIndex(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    lineHeight: '1.5',
                    color: '#e2e8f0',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontStyle: 'italic',
                    borderLeft: '2px solid var(--neon-purple)'
                  }}>
                    "{CHURCHES[selectedChurchIndex].message}"
                  </p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>
                    {CHURCHES[selectedChurchIndex].question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {CHURCHES[selectedChurchIndex].options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleQuizAnswer(
                          CHURCHES[selectedChurchIndex].name,
                          opt,
                          CHURCHES[selectedChurchIndex].answer
                        )}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--neon-blue)';
                          e.currentTarget.style.background = 'rgba(0,242,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.background = 'rgba(15,23,42,0.8)';
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === "formation" && (
            <section className="mc-card mc-control-panel">
              <SpiritualFormationPanel />
            </section>
          )}

          {activeTab === "innercourt" && (
            <section className="mc-card mc-control-panel">
              <InnerCourtScreen />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  const percentage = Math.round(value * 100);
  return (
    <div className="mc-metric-row">
      <div className="mc-row-header">
        <span className="mc-row-label">{label}</span>
        <span className="mc-row-pct" style={{ color }}>{percentage}%</span>
      </div>
      <div className="mc-progress-outer">
        <div className="mc-progress-inner" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}



