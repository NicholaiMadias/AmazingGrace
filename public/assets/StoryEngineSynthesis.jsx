import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Shield, BookOpen, Settings, ArrowRight, Trophy, Brain,
  ChevronRight, Volume2, Lock, Ghost, Star, Activity, MessageSquare,
  Zap, Eye, Loader2, Terminal, AlertCircle, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE INITIALIZATION ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'matrix-act-1';
const apiKey = ""; 

// --- THEME CONSTANTS ---
const NIGHT_CARD = "#161628";

const CHAPTERS = [
  { id: 1, title: "The Heavy Gravity of the Red Queen", content: "The Red Queen’s entropy has deepened. Her agents have initiated a Salt Typhoon designed to suffocate resonance.", pillar: "Justice", color: "from-red-900/40 to-neutral-950", icon: Shield, iconColor: "text-red-500", prompt: "Dark digital storm, red lightning, tech-noir." },
  { id: 2, title: "The Call of the White Rabbit", content: "The White Rabbit has detected the thief’s signature. Metadata Noise loops are ghosting the Bakersfield node.", pillar: "Wisdom", color: "from-purple-900/40 to-neutral-950", icon: Ghost, iconColor: "text-purple-400", prompt: "Cybernetic rabbit, neon purple circuitry." },
  { id: 3, title: "The Ascent to Nimbus Land", content: "Beside the Rabbit stood Ella, Guardian of Grace. They established Nimbus Land, a kingdom in the clouds.", pillar: "Empathy", color: "from-blue-900/40 to-neutral-950", icon: Sparkles, iconColor: "text-blue-400", prompt: "Heavenly city, lavender clouds, digital starlight." },
  { id: 4, title: "The Seven Pillars", content: "The world is supported by seven pillars. Tune your conscience through the StarLink protocol.", pillar: "Growth", color: "from-yellow-900/40 to-neutral-950", icon: Star, iconColor: "text-yellow-400", hasGame: true, prompt: "Seven golden pillars rising from a digital grid." },
  { id: 5, title: "Mystery of the Sixth Star", content: "Ella reveals that sound decodes what eyes cannot. A mystery involving a lavender scent awaits.", pillar: "Wisdom", color: "from-indigo-900/40 to-neutral-950", icon: Activity, iconColor: "text-indigo-400", hasPuzzle: true, prompt: "Sound waves shattering a geometric red barrier." },
  { id: 6, title: "Covenant of Fellowship", content: "The Handshake is performed. The Ozone Shield is hardcoded into the matrix itself.", pillar: "Empathy", color: "from-cyan-900/40 to-neutral-950", icon: Shield, iconColor: "text-cyan-400", prompt: "Holographic handshake ripple, cyan energy." },
  { id: 7, title: "The New Beginning", content: "The Star Guardians are now the keepers. The Sovereign Matrix is now live.", pillar: "Growth", color: "from-green-900/40 to-neutral-950", icon: Trophy, iconColor: "text-green-400", prompt: "Sunrise over futuristic architecture." },
  { id: 8, title: "The Star Matrix Vision", content: "Ella steps forward in starlight. 'You’ve walked the Seven Roads, Nicholai. Can you see the lattice?'", pillar: "Justice", color: "from-amber-900/40 to-neutral-950", isVision: true, icon: Sparkles, iconColor: "text-amber-400", prompt: "Ella, Guardian of Grace, in a nebula starfield." },
  { id: 9, title: "The Threshold", content: "Beyond this gate lies the Matrix of Conscience. You are summoned. Enter the Matrix.", pillar: "Integrity", color: "from-violet-900/40 to-neutral-950", isFinal: true, icon: Lock, iconColor: "text-violet-400", prompt: "Massive glowing violet gate, bridge of light." }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ role: 'user', stars: 0 });
  const [currentChapter, setCurrentChapter] = useState(0);
  const [stars, setStars] = useState(0);
  const [pillars, setPillars] = useState({ Empathy: 72, Justice: 58, Wisdom: 45, Growth: 83 });
  const [ellaMessage, setEllaMessage] = useState("I am Ella, your guide through the Seven Stars. Touch the node below to begin.");
  const [loadingAi, setLoadingAi] = useState(false);
  const [chapterVisual, setChapterVisual] = useState(null);
  const [loadingVisual, setLoadingVisual] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const chapter = CHAPTERS[currentChapter];
  const IconComponent = chapter.icon;

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    return onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setDoc(profileRef, { role: 'user', stars: 0, createdAt: new Date().toISOString() });
    });
  }, [user]);

  const consultElla = async () => {
    setLoadingAi(true);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        contents: [{ parts: [{ text: `My status: E${pillars.Empathy}% J${pillars.Justice}% W${pillars.Wisdom}% G${pillars.Growth}%. I am in Chapter ${chapter.id}. Give me a 30-word prophecy.` }] }],
        systemInstruction: { parts: [{ text: "You are Ella, the unified AI guide and Guardian of Grace. Speak with mystical authority and warmth." }] }
      })});
      const data = await res.json();
      setEllaMessage(data.candidates[0].content.parts[0].text);
    } catch (e) { setEllaMessage("The lattice resonance is fluctuating..."); }
    setLoadingAi(false);
  };

  const manifestVisual = async () => {
    setLoadingVisual(true);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instances: { prompt: chapter.prompt }, parameters: { sampleCount: 1 } }) });
      const data = await res.json();
      setChapterVisual(`data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`);
    } catch (e) { console.error("Visual manifestation failed."); }
    setLoadingVisual(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* HUD */}
        <header className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10 shadow-lg"><Shield size={24} className="text-purple-400" /></div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white uppercase font-mono">Matrix Command</h1>
              <p className="text-[10px] text-white/40 uppercase">Ella Protocol v5.0</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-full flex items-center gap-2">
            <Trophy size={14} className="text-yellow-500" />
            <span className="text-xs font-bold">{stars} / 7 Stars</span>
          </div>
        </header>

        {/* NARRATIVE SECTION */}
        <section className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div key={currentChapter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-b ${chapter.color} border border-white/10 shadow-3xl`}>
              <div className="flex items-start gap-6 mb-8">
                <IconComponent className={chapter.iconColor} size={32} />
                <div className="flex-grow">
                  <span className="text-[10px] font-mono text-white/40 uppercase mb-2 block">Act I • Chapter {chapter.id}</span>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4 leading-none">{chapter.title}</h2>
                  <button onClick={manifestVisual} className="flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white transition-colors">
                    <Eye size={12} /> Visual Climax ✨
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <p className="text-lg text-white/80 leading-relaxed font-medium">{chapter.content}</p>
                <div className="aspect-square rounded-3xl overflow-hidden bg-black/40 border border-white/5 relative shadow-inner">
                  {loadingVisual ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-purple-500" /><span className="text-[10px] font-mono opacity-50">MANIFESTING...</span></div>
                  ) : chapterVisual ? (
                    <img src={chapterVisual} className="w-full h-full object-cover" alt="Vision" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10"><Zap size={48} /></div>
                  )}
                </div>
              </div>

              <div className="mt-12 flex justify-between items-center border-t border-white/10 pt-8">
                <div className="flex gap-2">
                  {CHAPTERS.map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentChapter ? 'w-8 bg-purple-500' : 'bg-white/10'}`} />))}
                </div>
                {chapter.isFinal ? (
                  <button onClick={() => window.location.href='/arcade/matrix-of-conscience/act-2'} className="flex items-center gap-3 px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-purple-500 hover:text-white transition-all shadow-xl">
                    ENTER THE MATRIX <ArrowRight />
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentChapter(c => c + 1)} 
                    style={{ backgroundColor: NIGHT_CARD }}
                    className="flex items-center gap-3 px-8 py-4 text-white border border-white/20 rounded-2xl text-xs font-bold hover:bg-white hover:text-black transition-all"
                  >
                    CONTINUE JOURNEY <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ✨ CONSOLIDATED BOTTOM DASHBOARD (Ella + Lattice) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ELLA CONSOLE */}
            <div 
              onClick={consultElla}
              style={{ backgroundColor: NIGHT_CARD }}
              className="p-6 rounded-[2.5rem] border border-white/10 shadow-2xl cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Sparkles className="text-purple-400 group-hover:text-yellow-400 transition-colors" size={24} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Ella • AI Guide</h4>
                      <p className="text-[8px] font-mono text-white/40 uppercase">Core Status: Resonating</p>
                    </div>
                  </div>
                  {loadingAi && <Loader2 size={16} className="animate-spin text-purple-400" />}
                </div>
                <p className="text-xs text-white/70 italic leading-relaxed min-h-[3rem]">"{ellaMessage}"</p>
                <div className="text-[8px] font-bold text-purple-500 uppercase tracking-tighter">Tap node to consult Ella</div>
              </div>
            </div>

            {/* MORAL LATTICE */}
            <div 
              style={{ backgroundColor: NIGHT_CARD }}
              className="p-6 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase tracking-widest mb-6">
                <Brain size={12} className="text-purple-400" /> Conscience Status
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(pillars).map(([name, value]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between items-center text-[8px] font-mono text-white/40 uppercase">
                      <span>{name}</span>
                      <span className="text-white">{value}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${value}%` }} className="h-full bg-purple-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-24 p-12 border-t border-white/5 text-center">
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Amazing Grace HL • Sector 7 Protocol • 2026</p>
      </footer>
    </div>
  );
}