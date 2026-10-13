import { useEffect, useMemo, useState, createContext, useContext, useRef, useCallback } from "react";
import { ConscienceProvider, useConscience, DEFAULT_METRICS } from "./ConscienceProvider";
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
import PreOriginField from "../ascension/PreOriginField";
import UnutterableConstant from "../ascension/UnutterableConstant";
import SheilaPathScreen from "../dual-ascent/SheilaPathScreen";
import SheilaPathChapter1 from "../dual-ascent/SheilaPathChapter1";
import { useDualAscent } from "../dual-ascent/DualAscentContext";
import YiPathScreen from "../dual-ascent/YiPathScreen";
import { SandboxRule, DraftingBoard } from './DraftingBoard/DraftingBoard';
import { EmergenceScene } from './EmergenceSimulation/EmergenceScene';
import { EmergenceDataProvider } from './EmergenceSimulation/EmergenceDataContext';
import { GoogleAuthOverlay, UserProfile } from './EmergenceSimulation/GoogleAuthOverlay';
import { evaluateAllianceAction, PlayerReputation } from './EmergenceSimulation/aiReputationEvaluator';
import { useMatrixReputation } from './EmergenceSimulation/useMatrixReputation';
import { KarmaLeaderboard } from './EmergenceSimulation/KarmaLeaderboard';
import MirrorLayerScreen from "../dual-ascent/MirrorLayerScreen";
import OpeningCinematic from "../dual-ascent/OpeningCinematic";
import DualAscentTitleScreen from "../dual-ascent/DualAscentTitleScreen";
// @ts-ignore
import AeonEngineScreen from "../aeon/AeonEngineScreen";
// @ts-ignore
import EmpyreanSphereScreen from "../book/EmpyreanSphereScreen";
// @ts-ignore
import OriginPointScreen from "../book/OriginPointScreen";

// ---------------------------------------------------------------------------
// SYNTHESIZER SOUND GENERATION (Web Audio API)
// ---------------------------------------------------------------------------
function playSynthSound(type: "place" | "laser" | "hit" | "hurt" | "gameover" | "victory" | "start") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
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
    } else if (type === "start") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    console.warn("Web Audio API was blocked or unsupported:", e);
  }
}

// ---------------------------------------------------------------------------
// CORE INTEGRATION & PROVIDERS
// ---------------------------------------------------------------------------
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
    return DEFAULT_METRICS;
  }, [stats]);

  return (
    <ConscienceProvider initialMetrics={initial}>
      <EmergenceDataProvider>
        <MatrixCoreMaster activeUser={activeUser || "nicholai_madias"} />
      </EmergenceDataProvider>
    </ConscienceProvider>
  );
}

// ---------------------------------------------------------------------------
// MASTER COMPONENT
// ---------------------------------------------------------------------------
function MatrixCoreMaster({ activeUser }: { activeUser: string }) {
  const { metrics, updateMetrics } = useConscience();
  const [authSkipped, setAuthSkipped] = useState(false);
  const { currentUser, globalLeaderboard, handleGoogleSignIn, adjustKarma } = useMatrixReputation(activeUser);
  
  const [terminalLog, setTerminalLog] = useState("Conscience telemetry engine fully synchronized. Standalone Core online.");
  const [activeTab, setActiveTab] = useState("calibration");
  const [selectedStar, setSelectedStar] = useState<{ r: number; c: number } | null>(null);
  const [extSubsystem, setExtSubsystem] = useState<string | null>(null);

  // Router, HUD and modules hooks
  const { showOverlay: startTowerDefense } = useTowerDefenseHUD();
  const { openSevenStars } = useSevenStarsHUD();
  const { openBibleStudy } = useBibleStudyHUD();
  const { screen, go } = useNexusRouter();
  const { hud } = useHUD();

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

  const [badgeClickCount, setBadgeClickCount] = useState(0);
  const [isAtariUnlocked, setIsAtariUnlocked] = useState(false);
  const [showCrack, setShowCrack] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem("atari_attuned");
      if (unlocked) setIsAtariUnlocked(true);
    }
  }, []);

  const triggerUnlock = () => {
    if (typeof window !== 'undefined') {
      const nonce = crypto.randomUUID();
      sessionStorage.setItem("atari_attuned", nonce);
    }
    try {
      fetch('/api/attune', { method: 'POST', body: JSON.stringify({ nonce: "atari" }) }).catch(() => {});
    } catch {}

    setWhisper("Accessing Forbidden Subsystem...");
    setTimeout(() => setShowCrack(true), 800);
    setTimeout(() => setWhisper("Warning: You are not cleared for Pre-Genesis cognition models."), 2400);
    setTimeout(() => setWhisper("Janus Continuum has been notified."), 4200);
    setTimeout(() => {
      setIsAtariUnlocked(true);
      setWhisper(null);
      setShowCrack(false);
      setTerminalLog("[NEXUS OS] 🔓 SUB-CHAMBER SEALS MELTED. Proto-Simulation Lab fully unsealed at /arcade/atari-lab/.");
    }, 5800);
  };

  const sequence = useMemo(() => [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a"
  ], []);
  
  const seqIndexRef = useRef(0);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!extSubsystem?.includes("emergence-3d")) return;

      if (e.key === sequence[seqIndexRef.current]) {
        seqIndexRef.current++;
        if (seqIndexRef.current === sequence.length) {
          triggerUnlock();
          seqIndexRef.current = 0;
        }
      } else {
        seqIndexRef.current = e.key === sequence[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [extSubsystem, sequence]);

  const handleBadgeClick = () => {
    const nextCount = badgeClickCount + 1;
    if (nextCount >= 8) {
      setBadgeClickCount(0);
      triggerUnlock();
    } else {
      setBadgeClickCount(nextCount);
      setTerminalLog(`[Attunement Diagnostics] Tap sequence received: ${nextCount}/8.`);
    }
  };

  const currentUserId = activeUser;

  // Seven Stars local storage state and selection
  const [completedStars, setCompletedStars] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('aghl_sevenStarsCompleted') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedChurchIndex, setSelectedChurchIndex] = useState<number | null>(null);

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
        playSynthSound("place");
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

  const toggleRoutine = (key: keyof typeof routines) => {
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

  const tuneRoutine = (key: keyof typeof routines) => {
    setRoutines(prev => {
      if (!prev[key].active) {
        setTerminalLog(`[Tuning Mismatch] Cannot tune inactive ${prev[key].label}. Enable routine first.`);
        playSynthSound("hurt");
        return prev;
      }
      const nextProgress = Math.min(100, prev[key].progress + 10);
      setTerminalLog(`[Tune Core] ${prev[key].label} optimized to ${nextProgress}% efficiency.`);
      playSynthSound("laser");

      // Give small bump to global metrics on optimal tuning!
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
      currentText += reply[i];
      setOracleReply(currentText);
      i++;
      if (i >= reply.length) {
        clearInterval(interval);
        setOracleTyping(false);
        playSynthSound("victory");
      }
    }, 15);

    setOracleQuery("");
  };

  // ---------------------------------------------------------------------------
  // NEW WORKSPACE: MULTI-AGENT DRAFTING BOARD & ACTIVE RULES
  // ---------------------------------------------------------------------------
  const [activeRules, setActiveRules] = useState<SandboxRule[]>([]);

  // ---------------------------------------------------------------------------
  // NEW WORKSPACE: MATRIX TOWER DEFENSE (DEFEND CORE FROM RED QUEEN GLITCHES)
  // ---------------------------------------------------------------------------
  const [tdPlaying, setTdPlaying] = useState(false);

  const launchTdGame = () => {
    setTdPlaying(true);
    setTerminalLog("[DEFENSE CORES] 🛡️ Deploying Conscience Core Defenses. Build firewalls on the grid!");
    playSynthSound("start");
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

  if (screen === "daOpening") {
    return <OpeningCinematic />;
  }

  if (screen === "daTitle") {
    return <DualAscentTitleScreen />;
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
  // Reputation evaluation state
  const currentPlayerReputation: PlayerReputation = { 
    globalKarma: currentUser.globalKarma, 
    historicalBetrayalsLogged: currentUser.betrayals 
  };

  const hasAuthenticated = currentUser.globalKarma !== 50 || authSkipped; // assuming 50 is default guest

  if (!hasAuthenticated) {
    return (
      <GoogleAuthOverlay 
        onSignIn={(profile) => {
          handleGoogleSignIn(profile);
          setAuthSkipped(true);
        }} 
        onBypass={() => setAuthSkipped(true)} 
      />
    );
  }

  return (
    <div className="mc-matrix-root" style={{ position: 'relative' }}>
      {/* 2. Live Global Karma Scoreboards */}
      <KarmaLeaderboard profiles={globalLeaderboard} currentUid={currentUser.uid} />

      {showCrack && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9999, pointerEvents: 'none',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          backdropFilter: 'contrast(1.5) brightness(1.2) hue-rotate(-10deg)',
          border: '8px solid rgba(245, 158, 11, 0.3)',
          boxShadow: 'inset 0 0 150px rgba(245, 158, 11, 0.2)'
        }}>
          {/* Procedural Glass Crack Lines */}
          <div style={{ position: 'absolute', top: '10%', left: '30%', width: '1px', height: '200px', background: 'rgba(255,255,255,0.8)', transform: 'rotate(25deg)', boxShadow: '0 0 8px #fff' }} />
          <div style={{ position: 'absolute', top: '25%', left: '45%', width: '1px', height: '300px', background: 'rgba(255,255,255,0.7)', transform: 'rotate(-40deg)', boxShadow: '0 0 8px #fff' }} />
          <div style={{ position: 'absolute', top: '20%', left: '35%', width: '1px', height: '180px', background: 'rgba(255,255,255,0.6)', transform: 'rotate(70deg)', boxShadow: '0 0 8px #fff' }} />
          <div style={{ position: 'absolute', top: '45%', left: '40%', width: '1px', height: '250px', background: 'rgba(255,255,255,0.6)', transform: 'rotate(-15deg)', boxShadow: '0 0 8px #fff' }} />
        </div>
      )}
      
      {whisper && (
        <div style={{
          position: 'absolute', bottom: '6rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
          pointerEvents: 'none', textAlign: 'center', background: 'rgba(0,0,0,0.7)', padding: '0.5rem 1rem', borderRadius: '4px',
          border: '1px solid rgba(245, 158, 11, 0.5)'
        }}>
          <p style={{
            fontFamily: 'var(--mono)', color: '#fcd34d', fontSize: '0.9rem', letterSpacing: '0.1em',
            textShadow: '0 0 10px #f59e0b', margin: 0
          }}>
            {whisper}
          </p>
        </div>
      )}
      <div className="mc-container">
        <header className="mc-header">
          <p className="mc-badge" onClick={handleBadgeClick} style={{ cursor: 'pointer', userSelect: 'none' }}>NEXUS ARCADE // CORE UNIFICATION</p>
          <h1>MATRIX OF CONSCIENCE</h1>
          <div className="mc-nav-row" style={{ flexWrap: 'wrap', gap: '0.25rem' }}>
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
            <button className={`mc-nav-btn ${activeTab === "drafting" && !extSubsystem ? "active" : ""}`} onClick={() => { setActiveTab("drafting"); setExtSubsystem(null); }}>
              ⚖️ Drafting Board
            </button>
            <button className={`mc-nav-btn ${activeTab === "arcade" && !extSubsystem ? "active" : ""}`} onClick={() => { setActiveTab("arcade"); setExtSubsystem(null); }}>
              🎮 Sovereign Arcade
            </button>
          </div>
        </header>

        <div className="mc-main-layout">
          {extSubsystem ? (
            <div style={{ gridColumn: "1 / -1", display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(0, 242, 255, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem 1.25rem',
                boxShadow: '0 0 15px rgba(0, 242, 255, 0.1)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--neon-blue)', letterSpacing: '0.05em' }}>
                  ACTIVE SUBSYSTEM: {
                    extSubsystem.includes("trinity") ? "TRINITY CORE" :
                    extSubsystem.includes("star-matrix") ? "STAR MATRIX" :
                    extSubsystem.includes("tower-defense") ? "NEXUS DEFENSE" :
                    extSubsystem.includes("syndicate-siege") ? "SYNDICATE SIEGE" :
                    extSubsystem.includes("bible-study") ? "HOLY BIBLE STUDY" :
                    extSubsystem.includes("seven-stars") ? "SEVEN STARS" :
                    extSubsystem.includes("emergence-3d") ? "EMERGENCE 3D" :
                    extSubsystem.includes("atari-lab") ? "ATARI WING" :
                    extSubsystem.includes("certificates") ? "SOVEREIGN CERTIFICATES" : "EXTERNAL NODE"
                  }
                </span>
                <button
                  onClick={() => setExtSubsystem(null)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                >
                  ← Return to Arcade Hub
                </button>
              </div>
              
              <div className="mc-card" style={{ padding: 0, overflow: 'hidden', height: 'min(620px, 80vh)', position: 'relative', border: '1px solid rgba(0, 242, 255, 0.3)', borderRadius: '12px', boxShadow: '0 0 25px rgba(0, 242, 255, 0.15)' }}>
                <iframe 
                  id="ext-frame" 
                  src={extSubsystem} 
                  style={{ width: '100%', height: '100%', border: 'none', background: '#020617', display: 'block' }} 
                  title="External Subsystem"
                  allow="autoplay; fullscreen"
                />
              </div>
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
                  {(Object.keys(routines) as Array<keyof typeof routines>).map(key => {
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
                    {/* Game header panel */}
                    <div style={{
                      width: '100%',
                      background: 'rgba(2, 6, 23, 0.8)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.7rem',
                      color: 'var(--neon-gold)'
                    }}>
                      <div>NEXUS DEFENSE: <span>ONLINE</span></div>
                    </div>

                    {/* Game area replaced by Emergence 3D */}
                    <div style={{
                      position: 'relative',
                      border: '2px solid rgba(188, 19, 254, 0.3)',
                      borderRadius: '12px',
                      boxShadow: '0 0 20px rgba(188, 19, 254, 0.15)',
                      overflow: 'hidden',
                      width: '100%',
                      height: '500px'
                    }}>
                      <EmergenceDataProvider>
                        <EmergenceScene 
                          activeRules={activeRules} 
                          playerReputation={currentPlayerReputation} 
                          adjustKarma={adjustKarma}
                          uid={currentUser.uid}
                        />
                      </EmergenceDataProvider>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "drafting" && (
              <>
                <h2>Multi-Agent Drafting Board</h2>
                <p className="mc-panel-desc">Negotiate and lock rules to stabilize the Matrix Defense simulations. Your karma: {currentPlayerReputation.globalKarma}</p>
                <DraftingBoard onRulePassed={(rules) => setActiveRules(rules)} playerReputation={currentPlayerReputation} />
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
            {activeTab === "arcade" && (
              <>
                <h2>Sovereign Arcade Hub</h2>
                <p className="mc-panel-desc">Launch, attune, and monitor virtual sandboxes directly inside the Conscience Mainframe.</p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginTop: '0.5rem',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  paddingRight: '0.25rem'
                }}>
                  {[
                    {
                      name: "Trinity Core",
                      desc: "Metaphysical match-3 virtue alignment and soul calibrations.",
                      path: "/arcade/trinity/index.html",
                      color: "var(--neon-blue)",
                      tag: "VIRTUE PUZZLE"
                    },
                    {
                      name: "Star Matrix",
                      desc: "Align constellation coordinates on a shifting 7x7 celestial grid.",
                      path: "/arcade/star-matrix/index.html",
                      color: "var(--neon-purple)",
                      tag: "COSMIC MAP"
                    },
                    {
                      name: "Nexus Defense",
                      desc: "Deploy defensive towers to protect database sectors in a 3D isometric simulation.",
                      path: "/arcade/emergence-3d/index.html",
                      color: "#10b981",
                      tag: "WAVE STRATEGY"
                    },

                    {
                      name: "Holy Bible Study",
                      desc: "Scriptural learning modules and study session validation.",
                      path: "/arcade/bible-study/index.html",
                      color: "var(--neon-gold)",
                      tag: "SACRED KNOWLEDGE"
                    },
                    {
                      name: "Seven Stars",
                      desc: "Ascend the Pleiades attunement ladder through congregation trials.",
                      path: "/arcade/seven-stars/index.html",
                      color: "#a78bfa",
                      tag: "SOUL CHANNELS"
                    },
                    {
                      name: "Emergence 3D",
                      desc: "Monitor active sovereign agents, timeline drifts, and co-apex pressure fields in 3D space.",
                      path: "/arcade/emergence-3d/index.html",
                      color: "#00f0ff",
                      tag: "3D SIMULATION"
                    },

                    ...(isAtariUnlocked ? [{
                      name: "Atari Wing",
                      desc: "Proto-simulation lab. Cognition models unstable. Chrono-lock engaged.",
                      path: "/arcade/atari-lab/index.html",
                      color: "#ef4444",
                      tag: "RESTRICTED"
                    }] : [])
                  ].map(game => (
                    <div key={game.name} style={{
                      background: 'rgba(2, 6, 23, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '160px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = game.color;
                      e.currentTarget.style.boxShadow = `0 0 15px ${game.color}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => {
                      setExtSubsystem(game.path);
                      setTerminalLog(`[Nexus Link] Mounting external subsystem: ${game.path}`);
                      playSynthSound("place");
                    }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.55rem', fontWeight: 'bold', letterSpacing: '0.05em', color: game.color, background: `${game.color}15`, padding: '0.15rem 0.4rem', borderRadius: '4px', border: `1px solid ${game.color}33` }}>
                            {game.tag}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff', margin: '0 0 0.4rem 0', fontFamily: 'Orbitron, sans-serif' }}>{game.name}</h3>
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>{game.desc}</p>
                      </div>
                      
                      <button style={{
                        marginTop: '0.85rem',
                        width: '100%',
                        padding: '0.4rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 'bold',
                        fontFamily: 'Orbitron, sans-serif',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.background = `${game.color}15`;
                        e.currentTarget.style.borderColor = game.color;
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }}
                      >
                        LAUNCH CORE
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
            </>
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










