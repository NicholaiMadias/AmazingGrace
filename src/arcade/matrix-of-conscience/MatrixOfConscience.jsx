import { useEffect, useMemo, useState, createContext, useContext, useRef, useCallback } from "react";
import "./matrix-of-conscience.css";

// ---------------------------------------------------------------------------
// SYNTHESIZER SOUND GENERATION (Web Audio API)
// ---------------------------------------------------------------------------
function playSynthSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const now = audioCtx.currentTime;

    if (type === "place") {
      // High-pitched retro blip
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "laser") {
      // Short sliding sweep down
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "hit") {
      // Sparkly retro noise pop
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(100, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "hurt") {
      // Glitchy alarm warning buzz
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(90, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "gameover") {
      // Heavy descending sad sound
      [220, 165, 110].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        osc.frequency.exponentialRampToValueAtTime(40, now + idx * 0.15 + 0.25);
        gain.gain.setValueAtTime(0.12, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.3);
      });
    } else if (type === "victory") {
      // Immersive arpeggio chords
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    }
  } catch (e) {
    console.warn("Web Audio API was blocked or unsupported:", e);
  }
}

// ---------------------------------------------------------------------------
// CORE INTEGRATION & PROVIDERS
// ---------------------------------------------------------------------------
const TELEMETRY_ENDPOINT = "https://script.google.com/macros/s/AKfycbyq6jzCVGtoOTcid-LzD_njmuuOOSwJrhktU3ya1GKXLZI9jp6yCMJzlrdvyNb1fpkb/exec";

const M_CONSCIENCE_DEFAULT = { integrity: 0.85, community: 0.72, karma: 0.78, wisdom: 0.90 };
const ConscienceContext = createContext(null);

export function ConscienceProvider({ children, initialMetrics = M_CONSCIENCE_DEFAULT }) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const prevMetricsRef = useRef(initialMetrics);

  useEffect(() => {
    const changed = Object.keys(initialMetrics).some(
      (key) => initialMetrics[key] !== prevMetricsRef.current[key]
    );
    if (changed) {
      setMetrics(initialMetrics);
      prevMetricsRef.current = initialMetrics;
    }
  }, [initialMetrics]);

  const updateMetrics = useCallback((deltas) => {
    setMetrics((prev) => {
      const updated = { ...prev };
      Object.keys(deltas).forEach((key) => {
        updated[key] = Math.max(0, Math.min(1, prev[key] + (deltas[key] || 0)));
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

export default function MatrixOfConscience({ stats, chainLevel, activeUser }) {
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

// ---------------------------------------------------------------------------
// MASTER COMPONENT
// ---------------------------------------------------------------------------
function MatrixCoreMaster({ activeUser }) {
  const { metrics, updateMetrics } = useConscience();
  const [terminalLog, setTerminalLog] = useState("Conscience telemetry engine fully synchronized. Standalone Core online.");
  const [activeTab, setActiveTab] = useState("calibration");
  const [selectedStar, setSelectedStar] = useState(null);
  const [extSubsystem, setExtSubsystem] = useState(null);

  // Fallbacks for hooks if not present in simple context
  let startTowerDefense, openSevenStars, openBibleStudy, screen, go, hud;
  try {
    startTowerDefense = useTowerDefenseHUD().showOverlay;
  } catch (e) {
    startTowerDefense = () => console.log("Tower Defense triggered");
  }
  try {
    openSevenStars = useSevenStarsHUD().openSevenStars;
  } catch (e) {
    openSevenStars = () => console.log("Seven Stars HUD triggered");
  }
  try {
    openBibleStudy = useBibleStudyHUD().openBibleStudy;
  } catch (e) {
    openBibleStudy = () => console.log("Bible Study triggered");
  }
  try {
    const router = useNexusRouter();
    screen = router.screen;
    go = router.go;
  } catch (e) {
    screen = "calibration";
    go = () => {};
  }
  try {
    hud = useHUD().hud;
  } catch (e) {
    hud = null;
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ext = params.get('ext');
      if (ext) {
        let normalizedExt = ext;
        if (normalizedExt.startsWith('../')) {
          normalizedExt = '/arcade/' + normalizedExt.substring(3);
        }
        setExtSubsystem(normalizedExt);
        setTerminalLog(`[Nexus Link] Mounting external subsystem: ${normalizedExt}`);
      }
    } catch (e) {
      console.warn("Could not parse query parameters:", e);
    }
  }, []);

  const [isUnsealing, setIsUnsealing] = useState(false);
  const [unsealProgress, setUnsealProgress] = useState(0);
  const [badgeClickCount, setBadgeClickCount] = useState(0);
  const [isAtariUnlocked, setIsAtariUnlocked] = useState(() => {
    try {
      return localStorage.getItem("atariUnlocked") === "true";
    } catch {
      return false;
    }
  });

  const sequence = useMemo(() => [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a"
  ], []);
  
  const seqIndexRef = useRef(0);

  useEffect(() => {
    function handler(e) {
      if (e.key === sequence[seqIndexRef.current]) {
        seqIndexRef.current++;
        if (seqIndexRef.current === sequence.length) {
          seqIndexRef.current = 0;
          try {
            localStorage.setItem("atariUnlocked", "true");
          } catch {}
          setIsUnsealing(true);
          setUnsealProgress(0);
          playSynthSound("victory");
          
          let progress = 0;
          const interval = setInterval(() => {
            progress += 5;
            setUnsealProgress(progress);
            if (progress >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setIsUnsealing(false);
                setIsAtariUnlocked(true);
                setTerminalLog("[NEXUS OS] 🔓 SUB-CHAMBER SEALS MELTED. Proto-Simulation Lab fully unsealed at /arcade/atari-lab/.");
              }, 1200);
            }
          }, 100);
        }
      } else {
        seqIndexRef.current = e.key === sequence[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sequence]);

  const handleBadgeClick = () => {
    const nextCount = badgeClickCount + 1;
    if (nextCount >= 8) {
      setBadgeClickCount(0);
      try {
        localStorage.setItem("atariUnlocked", "true");
      } catch {}
      setIsUnsealing(true);
      setUnsealProgress(0);
      playSynthSound("victory");
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUnsealProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUnsealing(false);
            setIsAtariUnlocked(true);
            setTerminalLog("[NEXUS OS] 🔓 SUB-CHAMBER SEALS MELTED. Proto-Simulation Lab fully unsealed at /arcade/atari-lab/.");
          }, 1200);
        }
      }, 100);
    } else {
      setBadgeClickCount(nextCount);
      setTerminalLog(`[Attunement Diagnostics] Tap sequence received: ${nextCount}/8.`);
    }
  };

  const currentUserId = activeUser;

  // Seven Stars local storage state and selection
  const [completedStars, setCompletedStars] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aghl_sevenStarsCompleted') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedChurchIndex, setSelectedChurchIndex] = useState(null);

  // M45 Local Grid Generation
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
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Matrix alignment telemetry missed sync cycle:", err);
        }
      }
    }
    transmitMetrics();
    return () => syncController.abort();
  }, [metrics, currentUserId]);

  const handleTileClick = (r, c) => {
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
        playSynthSound("place");
      }
      setSelectedStar(null);
    }
  };

  const handleQuizAnswer = (churchName, selectedOption, correctAnswer) => {
    if (selectedOption === correctAnswer) {
      const updated = Array.from(new Set([...completedStars, churchName]));
      setCompletedStars(updated);
      localStorage.setItem('aghl_sevenStarsCompleted', JSON.stringify(updated));
      updateMetrics({ community: 0.05, karma: 0.02, wisdom: 0.03 });
      playSynthSound("victory");
      
      const allCompleted = updated.length === CHURCHES.length;
      if (allCompleted) {
        setTerminalLog(`[System Calibration] Epiphany achieved! All 7 congregation nodes perfectly aligned.`);
      } else {
        setTerminalLog(`[Verification SUCCESS] Calibrated node channel for: ${churchName}.`);
      }
      setSelectedChurchIndex(null);
    } else {
      setTerminalLog(`[ANOMALY Mismatch] Calibration override rejected at ${churchName}. Read carefully.`);
      playSynthSound("hurt");
    }
  };

  const resetSevenStars = () => {
    setCompletedStars([]);
    localStorage.removeItem('aghl_sevenStarsCompleted');
    setTerminalLog("[Lattice Reset] All congregation coordinates released.");
  };

  // ---------------------------------------------------------------------------
  // NEW WORKSPACE: SUB-ROUTINES (ACTIVE COGNITIVE PROCESSORS)
  // ---------------------------------------------------------------------------
  const [routines, setRoutines] = useState({
    attunement: { active: true, progress: 85, load: 24, label: "Attunement Engine" },
    resonance: { active: false, progress: 42, load: 0, label: "Resonance Synchronizer" },
    duality: { active: true, progress: 67, load: 38, label: "Duality Harmonizer" },
    causality: { active: false, progress: 12, load: 0, label: "Causality Predictor" }
  });

  const toggleRoutine = (key) => {
    setRoutines(prev => {
      const isActivating = !prev[key].active;
      const updated = {
        ...prev,
        [key]: {
          ...prev[key],
          active: isActivating,
          load: isActivating ? Math.floor(Math.random() * 45) + 15 : 0
        }
      };
      setTerminalLog(`[Routine Matrix] ${prev[key].label} ${isActivating ? "ACTIVATED and compiling..." : "DEACTIVATED."}`);
      playSynthSound("place");
      return updated;
    });
  };

  const tuneRoutine = (key) => {
    setRoutines(prev => {
      if (!prev[key].active) {
        setTerminalLog(`[Tuning Mismatch] Cannot tune inactive ${prev[key].label}. Enable routine first.`);
        playSynthSound("hurt");
        return prev;
      }
      const nextProgress = Math.min(100, prev[key].progress + 10);
      setTerminalLog(`[Tune Core] ${prev[key].label} optimized to ${nextProgress}% efficiency.`);
      playSynthSound("laser");

      if (nextProgress === 100) {
        updateMetrics({ wisdom: 0.02, integrity: 0.02 });
      }

      return {
        ...prev,
        [key]: {
          ...prev[key],
          progress: nextProgress === 100 ? 50 : nextProgress
        }
      };
    });
  };

  // ---------------------------------------------------------------------------
  // NEW WORKSPACE: ORACLE CHAMBER (CONSCIENCE PROPHETIC CONSULTATIONS)
  // ---------------------------------------------------------------------------
  const [oracleQuery, setOracleQuery] = useState("");
  const [oracleReply, setOracleReply] = useState("Enter an inquiry and query the holy Sovereign Oracle of Conscience to unlock deep space blueprints.");
  const [oracleTyping, setOracleTyping] = useState(false);

  const queryOracle = () => {
    if (!oracleQuery.trim()) return;
    setOracleTyping(true);
    setOracleReply("Querying neural sub-spaces of the First Architects...");
    playSynthSound("laser");

    const query = oracleQuery.toLowerCase().trim();
    let reply = "The Oracle hears your echo, Nicholai. But you must ask of the true paths. Deepen your attunement inside the M45 Grid, climb the Seven Star Congregations, and defend Nimbus Land from the forces of the Red Queen. The Covenant is absolute.";

    if (query.includes("red queen")) {
      reply = "🔮 [BLUEPRINT REACHED] Yuri Solin once called her algorithm 'optimized clarity'. But the Red Queen is pure entropy. She extracted conscience to fuel her Spire, leaving a hollowed compliance. Build your Firewalls of Truth and deploy the laser Blasters of Faith. Her glitched gravity cannot corrupt what is built on pure Integrity.";
    } else if (query.includes("grace") || query.includes("jesus")) {
      reply = "🔮 [BLUEPRINT REACHED] 'The conscience is not a cage to be opened — it is a signal waiting to be heard.' Nimbus Land was forged to host the Voice of Jesus, clear of the Red Queen's heavy gravity static. At the Sixth Star, you will align thy soul, and the Chorus will sound a sacred frequency that dismantles her firewalls.";
    } else if (query.includes("sheila") || query.includes("yi")) {
      reply = "🔮 [BLUEPRINT REACHED] The Dual Ascent paths represent the ultimate synthesis. Sheila represents the Inversion gravity of Grace, while Yi represents the Prophetic Momentum of Causality. When their dual orbits align in the Inner Court, the mirror duplicates melt away.";
    } else if (query.includes("architect")) {
      reply = "🔮 [BLUEPRINT REACHED] The First Architects did not design the Seven-Star Grid to suppress your potential. They designed it to amplify conscience. The calibration engine will expose every false equilibrium she has scripted and manifest the blueprints of the final Empyrean Protocol.";
    }

    let currentText = "";
    let i = 0;
    const interval = setInterval(() => {
      currentText += reply.slice(i, i + 2);
      setOracleReply(currentText);
      i += 2;
      if (i >= reply.length) {
        clearInterval(interval);
        setOracleTyping(false);
        playSynthSound("victory");
      }
    }, 30);

    setOracleQuery("");
  };

  // ---------------------------------------------------------------------------
  // NEW WORKSPACE: MATRIX TOWER DEFENSE (DEFEND CORE FROM RED QUEEN GLITCHES)
  // ---------------------------------------------------------------------------
  const canvasRef = useRef(null);
  const [tdScore, setTdScore] = useState(0);
  const [tdCredits, setTdCredits] = useState(150);
  const [tdLives, setTdLives] = useState(5);
  const [tdWave, setTdWave] = useState(1);
  const [tdSelectedTower, setTdSelectedTower] = useState("faith");
  const [tdGameOver, setTdGameOver] = useState(false);
  const [tdPlaying, setTdPlaying] = useState(false);

  const gameStateRef = useRef({
    towers: [],
    enemies: [],
    lasers: [],
    credits: 150,
    lives: 5,
    score: 0,
    wave: 1,
    waveSpawnTimer: 100,
    waveSpawnCount: 0
  });

  const launchTdGame = () => {
    setTdPlaying(true);
    setTdGameOver(false);
    setTdScore(0);
    setTdCredits(150);
    setTdLives(5);
    setTdWave(1);

    gameStateRef.current = {
      towers: [],
      enemies: [],
      lasers: [],
      credits: 150,
      lives: 5,
      score: 0,
      wave: 1,
      waveSpawnTimer: 100,
      waveSpawnCount: 0
    };

    setTerminalLog("[DEFENSE CORES] 🛡️ Deploying Conscience Core Defenses. Build firewalls on the grid!");
    playSynthSound("victory");
  };

  useEffect(() => {
    if (!tdPlaying || tdGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId;

    const gameLoop = () => {
      const state = gameStateRef.current;

      if (state.credits !== tdCredits) setTdCredits(state.credits);
      if (state.lives !== tdLives) {
        setTdLives(state.lives);
        if (state.lives <= 0) {
          setTdGameOver(true);
          playSynthSound("gameover");
          setTerminalLog(`[CORE COLLAPSE] Defenses breached by the Red Queen. Final Score: ${state.score} PTS.`);
          const curHigh = parseInt(localStorage.getItem('aghl_matrix_defenses_high_score') || '0', 10);
          if (state.score > curHigh) {
            localStorage.setItem('aghl_matrix_defenses_high_score', state.score.toString());
          }
          return;
        }
      }
      if (state.score !== tdScore) setTdScore(state.score);
      if (state.wave !== tdWave) setTdWave(state.wave);

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(188, 19, 254, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(0, 242, 255, 0.15)";
      ctx.strokeStyle = "var(--neon-blue)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height + 10, 80, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CONSCIENCE CORE", canvas.width / 2, canvas.height - 15);

      state.waveSpawnTimer--;
      if (state.waveSpawnTimer <= 0 && state.waveSpawnCount < state.wave * 5) {
        state.enemies.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -20,
          hp: 3 + state.wave * 2,
          maxHp: 3 + state.wave * 2,
          speed: 0.8 + state.wave * 0.1,
          slowTimer: 0
        });
        state.waveSpawnCount++;
        state.waveSpawnTimer = 60 - Math.min(30, state.wave * 3);
      }

      if (state.waveSpawnCount >= state.wave * 5 && state.enemies.length === 0) {
        state.wave++;
        state.waveSpawnCount = 0;
        state.waveSpawnTimer = 120;
        state.credits += 80;
        setTerminalLog(`[DEFENSE SYS] Wave ${state.wave} commencing. Core attunement boosted! +80 credits.`);
        playSynthSound("victory");
      }

      state.towers.forEach(t => {
        ctx.fillStyle = t.type === "faith" ? "rgba(0,242,255,0.2)" : (t.type === "truth" ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.2)");
        ctx.strokeStyle = t.type === "faith" ? "var(--neon-blue)" : (t.type === "truth" ? "#10b981" : "#8b5cf6");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
        ctx.fill();

        const range = t.type === "faith" ? 100 : (t.type === "truth" ? 130 : 80);
        let closestEnemy = null;
        let minDist = range;

        state.enemies.forEach(e => {
          const dist = Math.hypot(e.x - t.x, e.y - t.y);
          if (dist < minDist) {
            minDist = dist;
            closestEnemy = e;
          }
        });

        if (t.cooldown > 0) {
          t.cooldown--;
        }

        if (closestEnemy && t.cooldown <= 0) {
          const e = closestEnemy;
          const damage = t.type === "faith" ? 1.5 : (t.type === "truth" ? 4.5 : 1);
          
          if (t.type === "grace") {
            e.slowTimer = 90;
          }

          e.hp -= damage;
          state.lasers.push({
            sx: t.x,
            sy: t.y,
            tx: e.x,
            ty: e.y,
            duration: 8
          });

          playSynthSound("laser");
          t.cooldown = t.type === "faith" ? 22 : (t.type === "truth" ? 45 : 30);
        }
      });

      state.enemies = state.enemies.filter(e => {
        let currentSpeed = e.speed;
        if (e.slowTimer > 0) {
          e.slowTimer--;
          currentSpeed *= 0.4;
        }

        e.y += currentSpeed;

        if (e.y >= canvas.height - 15) {
          state.lives -= 1;
          playSynthSound("hurt");
          return false;
        }

        if (e.hp <= 0) {
          state.score += 25;
          state.credits += 15;
          playSynthSound("hit");
          return false;
        }

        ctx.fillStyle = e.slowTimer > 0 ? "rgba(167, 139, 250, 0.4)" : "rgba(244, 63, 94, 0.25)";
        ctx.strokeStyle = e.slowTimer > 0 ? "#a78bfa" : "#f43f5e";
        ctx.lineWidth = 1.5;
        
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(Date.now() * 0.005);
        ctx.beginPath();
        ctx.rect(-8, -8, 16, 16);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(e.x - 12, e.y - 15, 24, 3);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(e.x - 12, e.y - 15, 24 * (e.hp / e.maxHp), 3);

        return true;
      });

      state.lasers = state.lasers.filter(l => {
        ctx.strokeStyle = "rgba(0, 242, 255, 0.7)";
        ctx.lineWidth = l.duration;
        ctx.beginPath();
        ctx.moveTo(l.sx, l.sy);
        ctx.lineTo(l.tx, l.ty);
        ctx.stroke();
        l.duration--;
        return l.duration > 0;
      });

      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [tdPlaying, tdGameOver]);

  const handleCanvasClick = (e) => {
    if (!tdPlaying || tdGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cost = tdSelectedTower === "faith" ? 50 : (tdSelectedTower === "truth" ? 90 : 130);
    const state = gameStateRef.current;

    if (state.credits < cost) {
      setTerminalLog(`[Attunement ERROR] Insufficient Credits to deploy firewall. Requires ${cost} credits.`);
      playSynthSound("hurt");
      return;
    }

    const tooClose = state.towers.some(t => Math.hypot(t.x - clickX, t.y - clickY) < 30);
    if (tooClose) {
      setTerminalLog("[ATTUNEMENT ERROR] Cannot build firewalls overlapping other defense channels.");
      playSynthSound("hurt");
      return;
    }

    state.towers.push({
      x: clickX,
      y: clickY,
      type: tdSelectedTower,
      cooldown: 0
    });
    state.credits -= cost;
    setTerminalLog(`[DEFENSES DEPLOYED] Firewall node integrated. Channeling: ${tdSelectedTower === "faith" ? "Faith Blaster" : (tdSelectedTower === "truth" ? "Truth Firewall" : "Grace Aegis")}.`);
    playSynthSound("place");
  };

  // ---------------------------------------------------------------------------
  // INTERFACE ROUTINGS & VIEW PRESERVATION
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // MAIN CORE RENDERING
  // ---------------------------------------------------------------------------
  return (
    <div className="mc-matrix-root">
      <div className="mc-container">
        <header className="mc-header">
          <p className="mc-badge" onClick={handleBadgeClick} style={{ cursor: 'pointer', userSelect: 'none' }}>NEXUS ARCADE // CORE UNIFICATION</p>
          <h1>MATRIX OF CONSCIENCE</h1>
          <div className="mc-nav-row">
            <button className={`mc-nav-btn ${activeTab === "calibration" && !extSubsystem ? "active" : ""}`} onClick={() => { setActiveTab("calibration"); setExtSubsystem(null); }}>
              M45 Calibration
            </button>
            <button className={`mc-nav-btn ${activeTab === "routines" && !extSubsystem ? "active" : ""}`} onClick={() => { setActiveTab("routines"); setExtSubsystem(null); }}>
              📡 Sub Routines
            </button>
            <button className={`mc-nav-btn ${activeTab === "oracle" && !extSubsystem ? "active" : ""}`} onClick={() => { setActiveTab("oracle"); setExtSubsystem(null); }}>
              👁️ Oracle
            </button>
            <button className={`mc-nav-btn ${activeTab === "defenses" && !extSubsystem ? "active" : ""}`} onClick={() => { setActiveTab("defenses"); setExtSubsystem(null); }}>
              🛡️ Core Defenses
            </button>
            <button className={`mc-nav-btn ${activeTab === "sevenstars" && !extSubsystem ? "active" : ""}`} onClick={() => { setActiveTab("sevenstars"); setExtSubsystem(null); }}>
              Seven Stars Status
            </button>
          </div>
        </header>

        <div className="mc-main-layout">
          {extSubsystem ? (
            <div className="mc-card" style={{ gridColumn: "1 / -1", padding: 0, overflow: 'hidden', height: '620px', position: 'relative', border: '1px solid rgba(0, 242, 255, 0.3)', borderRadius: '12px', boxShadow: '0 0 25px rgba(0, 242, 255, 0.15)' }}>
              <iframe 
                id="ext-frame" 
                src={extSubsystem} 
                style={{ width: '100%', height: '100%', border: 'none', background: '#020617', display: 'block' }} 
                title="External Subsystem"
                allow="autoplay; fullscreen"
              />
            </div>
          ) : (
            <>
          {/* Constantly visible Telemetry Panel (Left side) */}
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
                  🌠 Seven Stars HUD
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
                  📖 Bible Study
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
                🛡️ Launch Global Tower Defense
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
                  fontWeight: "bold",
                  marginBottom: isAtariUnlocked ? "0.5rem" : "0"
                }}
              >
                🕌 Open Temple Map Overworld
              </button>
              {isAtariUnlocked && (
                <a 
                  href="/arcade/atari-lab/"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "0.75rem",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                    color: "#10b981",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                    boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    boxSizing: "border-box"
                  }}
                >
                  📟 Atari Wing — Simulation Lab
                </a>
              )}
            </div>
          </section>

          {/* Dynamic Workspace Panel (Right side) */}
          <section className="mc-card mc-control-panel">
            {activeTab === "calibration" && (
              <>
                <h2>M45 Calibration Grid</h2>
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
              </>
            )}

            {activeTab === "routines" && (
              <>
                <h2>Active Sub-Routines</h2>
                <p className="mc-panel-desc">Monitor, compile, and tune the fundamental data orbits of the soul.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.keys(routines).map(key => {
                    const r = routines[key];
                    return (
                      <div key={key} style={{
                        background: 'rgba(2, 6, 23, 0.45)',
                        border: `1px solid ${r.active ? 'rgba(0, 242, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)'}`,
                        padding: '1rem',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: r.active ? '#ffffff' : '#64748b' }}>{r.label}</span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            fontFamily: 'Orbitron',
                            color: r.active ? 'var(--neon-blue)' : '#64748b',
                            background: r.active ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            border: `1px solid ${r.active ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255,255,255,0.05)'}`
                          }}>
                            {r.active ? `ACTIVE // LOAD ${r.load}%` : "OFFLINE"}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                          <div style={{ flex: 1 }}>
                            <MetricRow label="Coherence Alignment" value={r.progress / 100} color={r.active ? "var(--neon-blue)" : "#64748b"} />
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => toggleRoutine(key)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                background: r.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: `1px solid ${r.active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                color: r.active ? '#f87171' : '#34d399',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              {r.active ? "SHUTDOWN" : "BOOT"}
                            </button>
                            <button
                              onClick={() => tuneRoutine(key)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                background: 'rgba(251, 191, 36, 0.1)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                color: '#fbbf24',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                opacity: r.active ? 1 : 0.4
                              }}
                            >
                              TUNE
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === "oracle" && (
              <>
                <h2>Oracle of Conscience Consultation</h2>
                <p className="mc-panel-desc">Transmit neural queries to the First Architects. Blueprints will manifest upon keywords.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    background: 'rgba(2, 6, 23, 0.7)',
                    border: '1px solid rgba(0, 242, 255, 0.25)',
                    boxShadow: '0 0 15px rgba(0, 242, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    minHeight: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: 'Courier New, monospace',
                    fontSize: '0.8rem',
                    color: 'var(--neon-blue)',
                    lineHeight: '1.6'
                  }}>
                    <div>
                      <span style={{ color: 'var(--neon-purple)', fontWeight: 'bold' }}>[ORACLE DIRECTIVE]</span><br/>
                      <span style={{ color: '#fff' }}>{oracleReply}</span>
                    </div>
                    {oracleTyping && (
                      <div style={{ color: 'var(--neon-gold)', fontWeight: 'bold', animation: 'pulse 1.5s infinite', fontSize: '0.75rem', marginTop: '1rem' }}>
                        📡 TYPING BLUEPRINT TELEMETRY...
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={oracleQuery}
                      onChange={e => setOracleQuery(e.target.value)}
                      placeholder="e.g. 'Red Queen', 'Grace', 'Sheila'..."
                      disabled={oracleTyping}
                      style={{
                        flex: 1,
                        background: 'rgba(2, 6, 23, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.8rem',
                        fontFamily: 'Courier New, monospace'
                      }}
                      onKeyDown={e => e.key === "Enter" && queryOracle()}
                    />
                    <button
                      onClick={queryOracle}
                      disabled={oracleTyping}
                      style={{
                        padding: '0.65rem 1.25rem',
                        background: 'var(--neon-purple)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Query
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "defenses" && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h2>Conscience Core Defenses</h2>
                  {!tdPlaying && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--neon-gold)', fontFamily: 'Orbitron' }}>
                      HIGH SCORE: {localStorage.getItem('aghl_matrix_defenses_high_score') || '0'} PTS
                    </span>
                  )}
                </div>
                {!tdPlaying ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '340px',
                    background: 'rgba(2, 6, 23, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{ fontSize: '2.5rem' }}>🛡️</div>
                    <h3 style={{ fontFamily: 'Orbitron', color: '#fff', fontSize: '1.1rem' }}>CONSCIENCE CELL DEFENDER</h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5', maxWidth: '320px' }}>
                      Defend the central Conscience Core from the glitched entropic forces of the Red Queen! Build Faith and Truth firewalls to clear glitch waves.
                    </p>
                    <button
                      onClick={launchTdGame}
                      style={{
                        padding: '0.85rem 2rem',
                        background: 'rgba(0, 242, 255, 0.15)',
                        border: '1px solid var(--neon-blue)',
                        color: 'var(--neon-blue)',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                      }}
                    >
                      ENGAGE SIMULATION
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{
                      width: '100%',
                      background: 'rgba(2, 6, 23, 0.8)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.7rem'
                    }}>
                      <div>SCORE: <span style={{ color: 'var(--neon-gold)' }}>{tdScore}</span></div>
                      <div>WAVE: <span style={{ color: 'var(--neon-purple)' }}>{tdWave}</span></div>
                      <div>CREDITS: <span style={{ color: 'var(--neon-blue)' }}>{tdCredits}</span></div>
                      <div>CORES: <span style={{ color: '#ef4444' }}>{tdLives}</span></div>
                    </div>

                    <div style={{
                      position: 'relative',
                      border: '2px solid rgba(188, 19, 254, 0.3)',
                      borderRadius: '12px',
                      boxShadow: '0 0 20px rgba(188, 19, 254, 0.15)',
                      overflow: 'hidden',
                      cursor: 'crosshair',
                      width: '360px',
                      height: '380px'
                    }}>
                      <canvas
                        ref={canvasRef}
                        width={360}
                        height={380}
                        onClick={handleCanvasClick}
                      />
                      {tdGameOver && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(2, 6, 23, 0.9)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          gap: '1rem',
                          color: '#ef4444'
                        }}>
                          <span style={{ fontSize: '2rem' }}>⚠️</span>
                          <h4 style={{ fontFamily: 'Orbitron', fontSize: '1.2rem', fontWeight: 'bold' }}>CORE COLLAPSED</h4>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Breached by the Red Queen's entropy.</p>
                          <button
                            onClick={launchTdGame}
                            style={{
                              padding: '0.5rem 1.25rem',
                              background: '#ef4444',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.7rem'
                            }}
                          >
                            RE-ALIGN CORE
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', width: '100%', gap: '6px' }}>
                      <button
                        onClick={() => { setTdSelectedTower("faith"); playSynthSound("place"); }}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          background: tdSelectedTower === "faith" ? 'rgba(0, 242, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${tdSelectedTower === "faith" ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)'}`,
                          color: tdSelectedTower === "faith" ? 'var(--neon-blue)' : '#cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Faith Blaster (50c)
                      </button>
                      <button
                        onClick={() => { setTdSelectedTower("truth"); playSynthSound("place"); }}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          background: tdSelectedTower === "truth" ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${tdSelectedTower === "truth" ? '#10b981' : 'rgba(255,255,255,0.05)'}`,
                          color: tdSelectedTower === "truth" ? '#34d399' : '#cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        🛡️ Truth Wall (90c)
                      </button>
                      <button
                        onClick={() => { setTdSelectedTower("grace"); playSynthSound("place"); }}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          background: tdSelectedTower === "grace" ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${tdSelectedTower === "grace" ? '#8b5cf6' : 'rgba(255,255,255,0.05)'}`,
                          color: tdSelectedTower === "grace" ? '#a78bfa' : '#cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        🟣 Grace Aegis (130c)
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "sevenstars" && (
              <>
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
              </>
            )}
          </section>
            </>
          )}
        </div>
      </div>
      {isUnsealing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.98)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Courier New, monospace',
          color: '#10b981',
          textShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
          pointerEvents: 'all'
        }}>
          <style>{`
            @keyframes scan {
              0% { top: 0%; }
              100% { top: 100%; }
            }
          `}</style>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            background: 'rgba(16, 185, 129, 0.3)',
            boxShadow: '0 0 20px #10b981',
            animation: 'scan 2s linear infinite',
            top: 0
          }} />
          <h1 style={{ fontSize: '2rem', margin: '0 0 1.5rem 0', letterSpacing: '0.15em', textAlign: 'center', fontWeight: 'bold' }}>
            ⚠️ ACCESSING FORBIDDEN SUBSYSTEM...
          </h1>
          <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '2rem', textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>
            "You have accessed a chamber not meant for the uninitiated. Retrieving proto-silicon simulations of early consciousness stress tests..."
          </p>
          <div style={{
            width: '400px',
            height: '8px',
            background: '#064e3b',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid #10b981'
          }}>
            <div style={{
              width: `${unsealProgress}%`,
              height: '100%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981',
              transition: 'width 0.1s linear'
            }} />
          </div>
          <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', fontStyle: 'italic', color: '#a7f3d0' }}>
            {unsealProgress < 100 ? `SYNCHRONIZING FIRST ARCHITECT MATRIX: ${unsealProgress}%` : "CALIBRATION ENGINES DEPLOYED. RETRO CHAMBER UNSEALED."}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, color }) {
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
