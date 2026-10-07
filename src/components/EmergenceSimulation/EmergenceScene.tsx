import React, { useRef, useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useConscience } from '../ConscienceProvider';
import { useTowerDefenseEngine, TOWER_DEFS } from './useTowerDefenseEngine';
import TowerDefenseBoss from './TowerDefenseBoss';
import { SandboxRule } from '../DraftingBoard/DraftingBoard';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Trail, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useEmergenceData, Sovereign } from './EmergenceDataContext';
import { AtariWingOverlay, useKonamiCode } from './AtariWingUnlock';
import { PlayerReputation } from './aiReputationEvaluator';
import { ChatOverlay } from '../ChatOverlay';
import './emergence.css';

const isWebGLSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// ── 0. Moving Nebula Backdrop ──
const MovingNebula = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} scale={[100, 100, 100]} raycast={() => null}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial
        color="#0a0514"
        side={THREE.BackSide}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
};

// ── 0.1. Atmospheric Data Dust ──
const AtmosphericParticles = () => {
  const count = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <points ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute
          attach="position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#00f0ff"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// ── 0.2. Environmental Instability Spikes ──
const EnvironmentalSpikes: React.FC<{ instability: number }> = ({ instability }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const scale = 1 + (Math.sin(time * 3 + i) * 0.5 + 0.5) * (instability / 100);
        mesh.scale.y = Math.max(0.1, scale * 5);
        mesh.position.y = (mesh.scale.y / 2) - 0.5;
      });
    }
  });

  const spikePositions = useMemo(() => {
    return Array.from({ length: 16 }).map(() => ({
      x: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 20,
      rot: Math.random() * Math.PI
    }));
  }, []);

  if (instability < 35) return null;

  return (
    <group ref={groupRef} raycast={() => null}>
      {spikePositions.map((pos, i) => (
        <mesh key={i} position={[pos.x, 0, pos.z]} rotation={[0, pos.rot, 0]}>
          <coneGeometry args={[0.08, 1, 4]} />
          <meshStandardMaterial
            color="#ff0055"
            emissive="#ff0055"
            emissiveIntensity={2.5}
            transparent
            opacity={0.5 * (instability / 100)}
          />
        </mesh>
      ))}
    </group>
  );
};

// ── 0.5. Dialogue Bubble Component ──
const DialogueBubble: React.FC<{ text: string }> = ({ text }) => {
  return (
    <Html distanceFactor={10} center position={[0, 1.2, 0]}>
      <div className="agent-dialogue-bubble">
        {text}
      </div>
    </Html>
  );
};

// ── 0.6. Local Player Avatar ──
const LocalPlayer: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = 0.5 + Math.sin(time * 2) * 0.1;
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[0.2, 16, 16]}>
          <MeshDistortMaterial
            color="#39ff14"
            speed={4}
            distort={0.4}
            radius={1}
            emissive="#39ff14"
            emissiveIntensity={1.5}
          />
        </Sphere>
      </Float>
      <Html distanceFactor={8} center position={[0, 0.6, 0]}>
        <div className="html-label player-label">Local Architect (You)</div>
      </Html>
      <pointLight color="#39ff14" intensity={1} distance={3} />
    </group>
  );
};

// ── 1. Individual bobbing grid tile component ──
const GridTile: React.FC<{
  x: number;
  z: number;
  instability: number;
}> = ({ x, z, instability }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const distance = useMemo(() => Math.sqrt(x * x + z * z), [x, z]);

  const color = useMemo(() => {
    const hue = 210 + (instability / 100) * 120;
    const saturation = 70 + Math.sin(distance) * 10;
    const lightness = 15 + Math.cos(distance) * 5;
    return new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }, [instability, distance]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const bob = Math.sin(time * 0.8 - distance * 0.3) * 0.15 * (1 + instability / 50);
    meshRef.current.position.y = bob;

    if (instability > 50) {
      const drift = (instability - 50) / 500;
      meshRef.current.rotation.x = Math.sin(time + x) * drift;
      meshRef.current.rotation.z = Math.cos(time + z) * drift;
    } else {
      meshRef.current.rotation.x = 0;
      meshRef.current.rotation.z = 0;
    }
  });

  return (
    <mesh ref={meshRef} position={[x, 0, z]} receiveShadow raycast={() => null}>
      <boxGeometry args={[0.9, 0.15, 0.9]} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.7}
        emissive={color}
        emissiveIntensity={instability > 65 ? 0.6 : 0.1}
      />
    </mesh>
  );
};

// ── 2. Terrain Grid Floor component ──
const TerrainGrid: React.FC<{ instability: number }> = ({ instability }) => {
  const tiles = useMemo(() => {
    const list = [];
    const size = 10;
    const half = size / 2;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        list.push({
          id: `${x}-${z}`,
          x: x - half + 0.5,
          z: z - half + 0.5,
        });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {tiles.map((tile) => (
        <GridTile key={tile.id} x={tile.x} z={tile.z} instability={instability} />
      ))}
    </group>
  );
};

// ── 3. Central Energy Portal Component ──
const CentralPortal: React.FC<{ instability: number }> = ({ instability }) => {
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ringRef1.current) {
      ringRef1.current.rotation.z = time * 0.5;
      ringRef1.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -time * 0.8;
      ringRef2.current.scale.setScalar(0.7 + Math.cos(time * 2) * 0.04);
    }
  });

  return (
    <group position={[0, 0.1, 0]} raycast={() => null}>
      <mesh ref={ringRef1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.06, 8, 48]} />
        <meshStandardMaterial
          color="#bd00ff"
          emissive="#a855f7"
          emissiveIntensity={1.5 + (instability / 50)}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh ref={ringRef2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.04, 8, 36]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#06b6d4"
          emissiveIntensity={2.0 + (instability / 40)}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#bd00ff"
          emissiveIntensity={3.0 + (instability / 20)}
        />
      </mesh>
    </group>
  );
};

// ── 4. Dynamic Data Flows Component ──
const DataFlows: React.FC = () => {
  const numPackets = 12;
  const packets = useMemo(() => {
    return Array.from({ length: numPackets }).map((_, i) => {
      const startX = Math.floor(Math.random() * 10) - 5 + 0.5;
      const startZ = Math.floor(Math.random() * 10) - 5 + 0.5;
      return {
        id: i,
        pos: new THREE.Vector3(startX, 0.15, startZ),
        startX,
        startZ,
        targetX: startX,
        targetZ: startZ,
        speed: 1.2 + Math.random() * 1.5,
        progress: 1.0,
        color: i % 2 === 0 ? "#00f0ff" : "#ff0055",
      };
    });
  }, []);

  const refs = useRef<THREE.Group[]>([]);

  useFrame((state, delta) => {
    packets.forEach((p, idx) => {
      const ref = refs.current[idx];
      if (!ref) return;
      p.progress += delta * p.speed;
      if (p.progress >= 1.0) {
        p.startX = p.targetX;
        p.startZ = p.targetZ;
        p.progress = 0;
        const moveX = Math.random() > 0.5;
        const offset = Math.random() > 0.5 ? 1 : -1;
        if (moveX) {
          p.targetX = Math.max(-4.5, Math.min(4.5, p.startX + offset));
          p.targetZ = p.startZ;
        } else {
          p.targetX = p.startX;
          p.targetZ = Math.max(-4.5, Math.min(4.5, p.startZ + offset));
        }
      }
      const x = p.startX + (p.targetX - p.startX) * p.progress;
      const z = p.startZ + (p.targetZ - p.startZ) * p.progress;
      const y = 0.2 + Math.abs(Math.sin(p.progress * Math.PI)) * 0.15;
      ref.position.set(x, y, z);
    });
  });

  return (
    <group raycast={() => null}>
      {packets.map((p, idx) => (
        <group key={p.id} ref={(el) => { if (el) refs.current[idx] = el; }}>
          <Trail width={0.8} length={4} color={new THREE.Color(p.color)} attenuation={(t) => t * t}>
            <mesh><sphereGeometry args={[0.06, 8, 8]} /><meshBasicMaterial color={p.color} /></mesh>
          </Trail>
          <pointLight color={p.color} intensity={1.5} distance={1.5} />
        </group>
      ))}
    </group>
  );
};

// ── 5. Central obelisks ──
const CentralTowers: React.FC<{ alignment: number; instability: number; }> = ({ alignment, instability }) => {
  const beastRef = useRef<THREE.Mesh>(null);
  const devourerRef = useRef<THREE.Mesh>(null);
  const beastHeight = useMemo(() => 1.5 + ((alignment + 100) / 200) * 2.5, [alignment]);
  const devourerHeight = useMemo(() => 1.5 + ((100 - alignment) / 200) * 2.5, [alignment]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (beastRef.current) {
      beastRef.current.rotation.y = time * 0.25;
      beastRef.current.position.y = beastHeight / 2 + Math.sin(time * 0.5) * 0.1;
    }
    if (devourerRef.current) {
      devourerRef.current.rotation.y = -time * 0.2;
      devourerRef.current.position.y = devourerHeight / 2 + Math.cos(time * 0.4) * 0.1;
    }
  });

  return (
    <group raycast={() => null}>
      <mesh ref={beastRef} position={[-2, beastHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, beastHeight, 4]} />
        <meshStandardMaterial color="#00ffb7" roughness={0.25} metalness={0.9} emissive="#00bfa5" emissiveIntensity={1.3 + Math.sin(instability) * 0.2} />
      </mesh>
      <mesh ref={devourerRef} position={[2, devourerHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, devourerHeight, 4]} />
        <meshStandardMaterial color="#ff0055" roughness={0.25} metalness={0.9} emissive="#d50000" emissiveIntensity={1.3 + Math.cos(instability) * 0.2} />
      </mesh>
    </group>
  );
};

// ── 6. Floating Sovereign agent ──
const SovereignAgent: React.FC<{ sovereign: Sovereign; index: number; isSelected: boolean; slowed: boolean; threatLevel: string; threatFlash: boolean; onSelect: () => void; }> = ({ sovereign, index, isSelected, slowed, threatLevel, threatFlash, onSelect }) => {
  const { agentConversations } = useEmergenceData();
  const meshRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const satellite1 = useRef<THREE.Mesh>(null);
  const satellite2 = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const activeDialogue = useMemo(() => {
    const now = Date.now();
    return agentConversations.find(c => c.from === sovereign.name && (now - c.time) < 4000);
  }, [agentConversations, sovereign.name]);

  const startPos = useMemo(() => {
    const angle = (index * (2 * Math.PI)) / 5;
    const radius = 3.2 + (index % 2) * 0.6;
    return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
  }, [index]);

  const colors = useMemo(() => {
    if (sovereign.status === 'exiled') return { base: '#555558', emissive: '#222222' };
    if (sovereign.corruption > 60) return { base: '#ff0055', emissive: '#aa0033' };
    if (sovereign.instinct === 'hunt') return { base: '#bd00ff', emissive: '#6b00aa' };
    if (sovereign.instinct === 'genesis') return { base: '#00f0ff', emissive: '#0099cc' };
    return { base: '#39ff14', emissive: '#22aa0b' };
  }, [sovereign.status, sovereign.corruption, sovereign.instinct]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const movementScale = slowed ? 0.45 : 1;
    const driftX = Math.sin(time * 0.35 * movementScale + index * 1.5) * 1.2;
    const driftZ = Math.cos(time * 0.45 * movementScale + index * 2.2) * 1.2;
    const driftY = 1.2 + Math.sin(time * 1.3 + index) * 0.2;
    meshRef.current.position.set(startPos.x + driftX, driftY, startPos.z + driftZ);
    if (shellRef.current) {
      shellRef.current.rotation.x = time * 0.5;
      shellRef.current.rotation.y = time * 0.8 + index;
    }
    if (pulseRef.current) {
      const p = sovereign.pulse || 0.5;
      pulseRef.current.scale.setScalar(1.0 + (p * 0.15));
    }
    const orbitSpeed = isSelected ? 4.0 : 2.0;
    if (satellite1.current) {
      satellite1.current.position.set(Math.cos(time * orbitSpeed + index) * 0.5, Math.sin(time * orbitSpeed + index) * 0.2, Math.sin(time * orbitSpeed + index) * 0.5);
    }
    if (satellite2.current) {
      satellite2.current.position.set(Math.sin(time * orbitSpeed * 0.8 + index * 1.3) * 0.5, Math.cos(time * orbitSpeed * 0.8 + index * 1.3) * 0.5, Math.cos(time * orbitSpeed * 0.8 + index * 1.3) * -0.2);
    }
  });

  return (
    <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {activeDialogue && <DialogueBubble text={activeDialogue.text} />}
      <mesh ref={pulseRef} castShadow><octahedronGeometry args={[0.22, 0]} /><meshStandardMaterial color={colors.base} roughness={0.15} metalness={0.8} emissive={colors.emissive} emissiveIntensity={isSelected ? 1.8 : 0.9} /></mesh>
      <mesh ref={shellRef}><icosahedronGeometry args={[0.38, 1]} /><meshBasicMaterial wireframe color={colors.base} transparent opacity={isSelected ? 0.7 : 0.3} /></mesh>
      {isSelected && (<mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.6, 0.02, 6, 24]} /><meshBasicMaterial color="#39ff14" transparent opacity={0.6} /></mesh>)}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <torusGeometry args={[0.5, 0.025, 8, 32]} />
        <meshBasicMaterial color={threatFlash ? '#ff0000' : (threatLevel === 'safe' ? '#39ff14' : threatLevel === 'warning' ? '#facc15' : threatLevel === 'danger' ? '#fb923c' : '#ef4444')} transparent opacity={threatFlash ? 0.95 : 0.65} />
      </mesh>
      <mesh ref={satellite1}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color={colors.base} /></mesh>
      <mesh ref={satellite2}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color={colors.base} /></mesh>
      <Html distanceFactor={8} center position={[0, 0.5, 0]}>
        <div className={`html-label ${sovereign.corruption > 60 ? 'corrupted' : ''} ${sovereign.status === 'exiled' ? 'exiled' : ''} ${isSelected ? 'selected-glow' : ''}`}>
          {sovereign.name}
        </div>
      </Html>
    </group>
  );
};

// ── 7. Main Emergence Scene View Component ──
interface EmergenceSceneProps {
  activeRules?: SandboxRule[];
  playerReputation?: PlayerReputation;
  adjustKarma?: (uid: string, delta: number, isBetrayal?: boolean) => void;
  uid?: string;
  sectorId?: number;
  onMissionComplete?: () => void;
}

export const EmergenceScene: React.FC<EmergenceSceneProps> = ({ activeRules = [], playerReputation = { globalKarma: 10, historicalBetrayalsLogged: 0 }, adjustKarma, uid, sectorId, onMissionComplete }) => {
  const { metrics, veilState, sovereigns, selectedSovereignName, selectSovereign, multiplayerLogs, addMultiplayerLog, transmitAgentMessage, applyAgentOverride, toggleTowerPlacementMode, getThreatLevel, slowedSovereigns, threatFlashes, agentConversations } = useEmergenceData();

  const [chatMessage, setChatMessage] = useState('');
  const [hoverCell, setHoverCell] = useState<{ x: number; z: number } | null>(null);
  const [atariUnlocked, setAtariUnlocked] = useState(false);
  const [atariOverlayTrigger, setAtariOverlayTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [webglSupported, setWebglSupported] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const supported = isWebGLSupported();
    setWebglSupported(supported);
    const isMobile = window.innerWidth <= 900;
    if (!supported || isMobile) {
      setViewMode('2d');
    }
  }, []);

  useEffect(() => { setAtariUnlocked(sessionStorage.getItem('atari_attuned') === 'true'); }, []);
  const handleAtariUnlock = useCallback(() => { sessionStorage.setItem('atari_attuned', 'true'); setAtariUnlocked(true); setAtariOverlayTrigger((prev) => prev + 1); if (typeof addMultiplayerLog === 'function') { addMultiplayerLog('SYSTEM BREACH DETECTED: Atari Wing protocols activated.', 'System', 'event'); } }, [addMultiplayerLog]);
  useKonamiCode(handleAtariUnlock);

  const { globalCollapseRisk } = useConscience();
  const tdEngine = useTowerDefenseEngine(activeRules, playerReputation, adjustKarma, uid);
  const { gameState, gameEntities, startGame, startWave, placeTower: placeTDTower, getTowerCost, damagePlayer, PATH } = tdEngine;
  const campaignVictory = Boolean(onMissionComplete && gameState.active && !gameState.waveActive && gameState.wave > 3);

  const [tdSelectedTower, setTdSelectedTower] = useState<'purify' | 'contain' | 'sentinel' | 'genesis' | null>(null);

  const saveCampaignRewards = () => {
    try {
      const rawBadges = localStorage.getItem('moc-campaign-badges-v1');
      const badges: unknown = rawBadges ? JSON.parse(rawBadges) : [];
      if (!Array.isArray(badges) || badges.some((badge) => typeof badge !== 'string')) {
        throw new Error('Saved Matrix campaign badges are invalid.');
      }
      if (!badges.includes('Rift Peacemaker')) badges.push('Rift Peacemaker');
      localStorage.setItem('moc-campaign-badges-v1', JSON.stringify(badges));
    } catch (error) {
      console.error('Could not save the Matrix campaign certification.', error);
    }

    try {
      const rawScores = localStorage.getItem('moc-campaign-high-scores-v1');
      const scores: unknown = rawScores ? JSON.parse(rawScores) : {};
      if (!isRecord(scores)) {
        throw new Error('Saved Matrix campaign scores are invalid.');
      }
      const previousScore = scores['3'];
      if (previousScore !== undefined && (typeof previousScore !== 'number' || !Number.isFinite(previousScore) || previousScore < 0)) {
        throw new Error('Saved score for campaign level 3 is invalid.');
      }
      scores['3'] = Math.max(
        typeof previousScore === 'number' ? previousScore : 0,
        gameState.score
      );
      localStorage.setItem('moc-campaign-high-scores-v1', JSON.stringify(scores));
    } catch (error) {
      console.error('Could not save the Matrix campaign high score.', error);
    }

    onMissionComplete?.();
  };

  const handleTDGridPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!tdSelectedTower) return;
    const pt = e.point;
    const gx = Math.floor(pt.x) + 0.5;
    const gz = Math.floor(pt.z) + 0.5;
    if (!hoverCell || hoverCell.x !== gx || hoverCell.z !== gz) setHoverCell({ x: gx, z: gz });
  };

  const hoverPlacementValid = hoverCell && !PATH.some(p => Math.abs(p.x - hoverCell.x) < 0.5 && Math.abs(p.z - hoverCell.z) < 0.5) && !gameEntities.towers.some(t => Math.hypot(t.x - hoverCell.x, t.z - hoverCell.z) < 0.8) && (tdSelectedTower ? gameState.money >= getTowerCost(tdSelectedTower) : false);

  const handleTDGridClick = (e: ThreeEvent<MouseEvent>) => {
    if (tdSelectedTower && hoverCell && hoverPlacementValid) {
      placeTDTower(hoverCell.x, hoverCell.z, tdSelectedTower);
      setTdSelectedTower(null);
    }
  };

  const handleSendTransmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedSovereignName) return;
    transmitAgentMessage(selectedSovereignName, chatMessage.trim());
    setChatMessage('');
  };

  const getGridCoordsFromEvent = (e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const pctX = clientX / rect.width;
    const pctY = clientY / rect.height;
    const gridX = Math.floor(pctX * 10) - 5 + 0.5;
    const gridZ = Math.floor(pctY * 10) - 5 + 0.5;
    return { x: gridX, z: gridZ };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getGridCoordsFromEvent(e);
    if (!coords) return;

    if (tdSelectedTower) {
      if (hoverPlacementValid) {
        placeTDTower(coords.x, coords.z, tdSelectedTower);
        setTdSelectedTower(null);
      }
    } else {
      const time = performance.now() / 1000;
      let clickedSov: any = null;
      let minDistance = 1.0;
      
      sovereigns.forEach((sov: any, i: number) => {
        const angle = (i * (2 * Math.PI)) / 5;
        const radius = 3.2 + (i % 2) * 0.6;
        const startX = Math.cos(angle) * radius;
        const startZ = Math.sin(angle) * radius;
        
        const slowed = Boolean(slowedSovereigns[sov.name]);
        const movementScale = slowed ? 0.45 : 1;
        const driftX = Math.sin(time * 0.35 * movementScale + i * 1.5) * 1.2;
        const driftZ = Math.cos(time * 0.45 * movementScale + i * 2.2) * 1.2;
        
        const curX = startX + driftX;
        const curZ = startZ + driftZ;
        
        const distance = Math.hypot(coords.x - curX, coords.z - curZ);
        if (distance < minDistance) {
          minDistance = distance;
          clickedSov = sov;
        }
      });
      
      if (clickedSov) {
        selectSovereign(clickedSov.name);
      } else {
        selectSovereign(null);
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tdSelectedTower) {
      setHoverCell(null);
      return;
    }
    const coords = getGridCoordsFromEvent(e);
    if (coords) {
      if (!hoverCell || hoverCell.x !== coords.x || hoverCell.z !== coords.z) {
        setHoverCell(coords);
      }
    }
  };

  const handleCanvasPointerLeave = () => {
    setHoverCell(null);
  };

  useEffect(() => {
    if (viewMode !== '2d') return;
    let animFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getSovereignPos = (sovereignName: string, index: number, time: number) => {
      const angle = (index * (2 * Math.PI)) / 5;
      const radius = 3.2 + (index % 2) * 0.6;
      const startX = Math.cos(angle) * radius;
      const startZ = Math.sin(angle) * radius;
      
      const slowed = Boolean(slowedSovereigns[sovereignName]);
      const movementScale = slowed ? 0.45 : 1;
      const driftX = Math.sin(time * 0.35 * movementScale + index * 1.5) * 1.2;
      const driftZ = Math.cos(time * 0.45 * movementScale + index * 2.2) * 1.2;
      
      return { x: startX + driftX, z: startZ + driftZ };
    };

    const loop = () => {
      animFrameId = requestAnimationFrame(loop);
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const viewWidth = width / window.devicePixelRatio;
      const viewHeight = height / window.devicePixelRatio;
      const cs = viewWidth / 10;

      // 1. Clear background
      ctx.fillStyle = '#05050c';
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      // 2. Draw Grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cs, 0);
        ctx.lineTo(i * cs, viewHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cs);
        ctx.lineTo(viewWidth, i * cs);
        ctx.stroke();
      }

      // 3. Draw Path
      if (gameState.active) {
        PATH.forEach(p => {
          const col = Math.floor(p.x + 5);
          const row = Math.floor(p.z + 5);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fillRect(col * cs + 1, row * cs + 1, cs - 2, cs - 2);
          
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fillRect(col * cs + cs/2 - cs/6, row * cs + cs/2 - cs/6, cs/3, cs/3);
        });
      }

      // 4. Draw Central Portal
      const time = performance.now() / 1000;
      const portalX = 5 * cs;
      const portalY = 5 * cs;
      
      ctx.strokeStyle = '#bd00ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const r1 = cs * 1.5 * (1 + Math.sin(time * 2) * 0.05);
      ctx.arc(portalX, portalY, r1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const r2 = cs * 1.0 * (0.7 + Math.cos(time * 2) * 0.04);
      ctx.arc(portalX, portalY, r2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#bd00ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(portalX, portalY, cs * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 5. Draw Central Obelisks
      const alignment = metrics.worldAlignment;
      ctx.fillStyle = '#00ffb7';
      ctx.shadowColor = '#00bfa5';
      ctx.shadowBlur = 10;
      ctx.fillRect(3 * cs + cs/2 - 6, 5 * cs + cs/2 - 6, 12, 12);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("BEAST", 3 * cs + cs/2, 5 * cs + cs/2 - 10);

      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#d50000';
      ctx.shadowBlur = 10;
      ctx.fillRect(7 * cs + cs/2 - 6, 5 * cs + cs/2 - 6, 12, 12);
      ctx.shadowBlur = 0;
      ctx.fillText("DEVOURER", 7 * cs + cs/2, 5 * cs + cs/2 - 10);

      // 6. Draw Local Player Avatar
      ctx.fillStyle = '#39ff14';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const playerSize = 5 + Math.sin(time * 4) * 1.5;
      ctx.arc(5 * cs + cs/2, 5 * cs + cs/2, playerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 7. Draw Placement Preview
      if (tdSelectedTower && hoverCell) {
        const col = Math.floor(hoverCell.x + 5);
        const row = Math.floor(hoverCell.z + 5);
        const def = TOWER_DEFS[tdSelectedTower];
        const range = def.range * cs;
        const valid = hoverPlacementValid;
        
        ctx.strokeStyle = valid ? 'rgba(57, 255, 20, 0.4)' : 'rgba(255, 0, 85, 0.4)';
        ctx.fillStyle = valid ? 'rgba(57, 255, 20, 0.08)' : 'rgba(255, 0, 85, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(col * cs + cs/2, row * cs + cs/2, range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = valid ? '#39ff14' : '#ff0055';
        ctx.strokeRect(col * cs + 2, row * cs + 2, cs - 4, cs - 4);
      }

      // 8. Draw Defense Towers
      gameEntities.towers.forEach(t => {
        const col = Math.floor(t.x + 5);
        const row = Math.floor(t.z + 5);
        const color = t.type === 'purify' ? '#00f0ff' : t.type === 'contain' ? '#a855f7' : t.type === 'sentinel' ? '#ff0055' : '#00ffb7';
        
        ctx.fillStyle = '#222222';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillRect(col * cs + 6, row * cs + 6, cs - 12, cs - 12);
        ctx.strokeRect(col * cs + 6, row * cs + 6, cs - 12, cs - 12);

        ctx.save();
        ctx.translate(col * cs + cs/2, row * cs + cs/2);
        ctx.rotate(-(t.angle || 0));

        ctx.fillStyle = color;
        ctx.fillRect(-6, -6, 12, 12);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, 0, 4, 10);
        ctx.restore();

        if (t.level > 1) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`L${t.level}`, col * cs + cs - 4, row * cs + cs - 4);
        }
      });

      // 9. Draw Projectiles
      gameEntities.projectiles.forEach(p => {
        const px = (p.x + 5) * cs;
        const pz = (p.z + 5) * cs;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, pz, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 10. Draw Particles
      gameEntities.particles.forEach(p => {
        const px = (p.x + 5) * cs;
        const pz = (p.z + 5) * cs;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(px - 2, pz - 2, 4, 4);
      });
      ctx.globalAlpha = 1.0;

      // 11. Draw Enemies
      gameEntities.enemies.forEach(e => {
        const ex = (e.x + 5) * cs;
        const ez = (e.z + 5) * cs;
        ctx.fillStyle = e.color || '#ff0055';
        ctx.shadowColor = e.color || '#ff0055';
        ctx.shadowBlur = e.type === 'boss' ? 12 : 5;
        
        ctx.beginPath();
        if (e.type === 'boss') {
          ctx.arc(ex, ez, 14, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'armored') {
          ctx.fillRect(ex - 8, ez - 8, 16, 16);
        } else if (e.type === 'shielded') {
          ctx.arc(ex, ez, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ex, ez, 11, 0, Math.PI * 2);
          ctx.stroke();
        } else if (e.type === 'swarm') {
          ctx.moveTo(ex, ez - 6);
          ctx.lineTo(ex + 5, ez + 5);
          ctx.lineTo(ex - 5, ez + 5);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.arc(ex, ez, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = '#333333';
        ctx.fillRect(ex - 10, ez - 14, 20, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(ex - 10, ez - 14, 20 * hpPct, 3);
      });

      // 12. Draw Floating Damage Text
      gameEntities.floatingTexts.forEach(ft => {
        const fx = (ft.x + 5) * cs;
        const fz = (ft.z + 5) * cs;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, fx, fz - 15);
      });
      ctx.globalAlpha = 1.0;

      // 13. Draw Sovereign Agents
      sovereigns.forEach((sov: any, i: number) => {
        const pos = getSovereignPos(sov.name, i, time);
        const sx = (pos.x + 5) * cs;
        const sz = (pos.z + 5) * cs;
        const isSelected = selectedSovereignName === sov.name;
        const threatLevel = getThreatLevel(sov.corruption);
        const threatFlash = Boolean(threatFlashes[sov.name]);
        
        const colors = (() => {
          if (sov.status === 'exiled') return { base: '#555558', glow: '#222222' };
          if (sov.corruption > 60) return { base: '#ff0055', glow: '#aa0033' };
          if (sov.instinct === 'hunt') return { base: '#bd00ff', glow: '#6b00aa' };
          if (sov.instinct === 'genesis') return { base: '#00f0ff', glow: '#0099cc' };
          return { base: '#39ff14', glow: '#22aa0b' };
        })();

        ctx.strokeStyle = threatFlash ? '#ff0000' : (threatLevel === 'safe' ? '#39ff14' : threatLevel === 'warning' ? '#facc15' : threatLevel === 'danger' ? '#fb923c' : '#ef4444');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sz, 16, 0, Math.PI * 2);
        ctx.stroke();

        if (isSelected) {
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sz, 22, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = colors.base;
        ctx.shadowColor = colors.base;
        ctx.shadowBlur = isSelected ? 12 : 5;
        ctx.beginPath();
        ctx.moveTo(sx, sz - 8);
        ctx.lineTo(sx + 8, sz);
        ctx.lineTo(sx, sz + 8);
        ctx.lineTo(sx - 8, sz);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = sov.corruption > 60 ? '#ff0055' : sov.status === 'exiled' ? '#888888' : '#ffffff';
        ctx.font = isSelected ? 'bold 10px sans-serif' : '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sov.name, sx, sz - 20);
        
        const activeDialogue = agentConversations.find(c => c.from === sov.name && (Date.now() - c.time) < 4000);
        if (activeDialogue) {
          ctx.save();
          ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
          ctx.strokeStyle = colors.base;
          ctx.lineWidth = 1.5;
          const boxWidth = 120;
          const boxHeight = 40;
          const bx = sx - boxWidth/2;
          const by = sz - 65;
          
          ctx.fillRect(bx, by, boxWidth, boxHeight);
          ctx.strokeRect(bx, by, boxWidth, boxHeight);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          const words = activeDialogue.text.split(' ');
          let line = '';
          let lines = [];
          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            if (testLine.length > 25 && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);
          
          lines.slice(0, 3).forEach((l, idx) => {
            ctx.fillText(l, sx, by + 12 + idx * 10);
          });
          ctx.restore();
        }
      });

      ctx.restore();
    };

    loop();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [viewMode, sovereigns, gameEntities, gameState, tdSelectedTower, hoverCell, hoverPlacementValid, selectedSovereignName, agentConversations, slowedSovereigns, threatFlashes, metrics]);

  return (
    <div className="emergence-viewport" onClick={() => selectSovereign(null)}>
      <div className="telemetry-sidebar" onClick={(e) => e.stopPropagation()}>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close telemetry sidebar">×</button>
        <div className="sidebar-header"><h1>Emergence 3D</h1><p>Local Simulation Telemetry Engine</p></div>
        <div className="panel-section">
          <div className="section-title">System Metrics</div>
          <div className="metrics-grid">
            <div className={`metric-card ${metrics.timelineInstability > 60 ? 'unstable' : ''}`}><div className="metric-label">Instability</div><div className="metric-value">{metrics.timelineInstability.toFixed(1)}%</div></div>
            <div className="metric-card"><div className="metric-label">Alignment</div><div className="metric-value">{metrics.worldAlignment.toFixed(0)}</div></div>
            <div className="metric-card"><div className="metric-label">Faction Trust</div><div className="metric-value">{metrics.factionTrust.toFixed(1)}%</div></div>
            <div className="metric-card"><div className="metric-label">Veil Status</div><div className="metric-value" style={{ color: veilState === 'unveiled' ? '#ff0055' : '#00f0ff' }}>{veilState.toUpperCase()}</div></div>
          </div>
        </div>
        {selectedSovereignName ? (
          <div className="panel-section sovereign-communicator-card">
            <div className="section-title communicator-title">Sovereign Communicator</div>
            <div className="comm-agent-details">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="comm-agent-name">{selectedSovereignName}</span><span className={`agent-badge`}>AGENT</span></div>
              <div className="comm-actions-row">
                <button className="comm-small-btn" onClick={() => applyAgentOverride(selectedSovereignName!, 'purify')}>🛡️ Purify</button>
                <button className="comm-small-btn" onClick={() => applyAgentOverride(selectedSovereignName!, 'attune_genesis')}>🌱 Genesis</button>
                <button className="comm-small-btn" onClick={() => applyAgentOverride(selectedSovereignName!, 'attune_hunt')}>⚔️ Hunt</button>
              </div>
              <form onSubmit={handleSendTransmit} style={{ marginTop: '12px', display: 'flex', gap: '6px' }}><input type="text" className="comm-chat-input" placeholder="Send signal..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} /><button type="submit" className="comm-send-btn">Send</button></form>
            </div>
          </div>
        ) : (<div className="panel-section select-agent-hint"><div className="section-title">AI Communicator</div><div className="hint-card-text">🖱️ Select mesh to transmit.</div></div>)}
        <div className="panel-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><div className="section-title">Multiplayer Operator Lobby</div><div className="log-display flex-grow-log">{multiplayerLogs.map((log) => (<div className={`log-entry ${log.type}`} key={log.id}><span className="log-entry-time">[{log.time}] {log.operator}:</span><span className="log-entry-text">{log.text}</span></div>))}</div></div>
        <div className="panel-section">
          <div className="section-title">NEXUS DEFENSE</div>
          {!gameState.active ? (<button className="cyber-btn" onClick={startGame}>🛡️ Initialize War Feature</button>) : campaignVictory ? (
            <div className="campaign-completion-sidebar">
              <strong>RIFT STABILIZED</strong>
              <span>Three waves held. The ceasefire can begin.</span>
            </div>
          ) : (
            <>
              <button className={`cyber-btn ${tdSelectedTower ? 'active-mode' : ''}`} onClick={() => toggleTowerPlacementMode && toggleTowerPlacementMode()} style={{ marginBottom: '10px', width: '100%' }}>🛡️ Toggle Towers (T)</button>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', marginBottom: '10px' }}>
                <div>Credits: <strong style={{color:'#00f0ff'}}>{Math.floor(gameState.money)}</strong></div>
                <div>Health: <strong style={{color:'#ff0055'}}>{gameState.health}</strong></div>
                <div>Wave: <strong>{gameState.wave}</strong></div>
              </div>
              <button className="cyber-btn" onClick={startWave} disabled={gameState.waveActive}>{gameState.waveActive ? 'Wave in Progress...' : 'Start Next Wave'}</button>
              <div className="tower-grid" style={{ marginTop: '10px' }}>
                {(['purify', 'contain', 'sentinel', 'genesis'] as const).map(type => (
                  <button key={type} className={`tower-btn ${tdSelectedTower === type ? 'active' : ''}`} onClick={() => setTdSelectedTower(prev => prev === type ? null : type)} disabled={gameState.money < getTowerCost(type)}><span className="tower-name">{type}</span></button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {gameState.bossWarning && (
        <div className="boss-warning-overlay" style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          color: '#ff0000', fontSize: '3rem', fontWeight: 'bold', textShadow: '0 0 20px #ff0000',
          animation: 'pulse 1s infinite', zIndex: 100, pointerEvents: 'none', textAlign: 'center'
        }}>
          ⚠️ BOSS ENCOUNTER DETECTED ⚠️<br/>
          <span style={{ fontSize: '1.5rem', color: '#ffb3c6' }}>PREPARE FOR SWARM</span>
        </div>
      )}

      <div className="canvas-container">
        {sectorId && (
          <TowerDefenseBoss 
            sectorId={sectorId} 
            onBossAttack={(damage) => {
              damagePlayer(damage);
            }}
            onBossDefeated={() => {
              gameEntities.enemies = gameEntities.enemies.filter(e => e.type !== 'boss');
            }}
          />
        )}
        <div className="view-mode-toggle">
          <button
            type="button"
            className={`cyber-btn ${viewMode === '3d' ? 'active-mode' : ''}`}
            onClick={() => setViewMode('3d')}
            disabled={!webglSupported}
          >
            3D View {!webglSupported && '(N/A)'}
          </button>
          <button
            type="button"
            className={`cyber-btn ${viewMode === '2d' ? 'active-mode' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            2D View
          </button>
        </div>

        {viewMode === '3d' ? (
          <Canvas shadows camera={{ position: [9, 8, 9], fov: 42 }} onCreated={({ gl }) => { gl.setClearColor(new THREE.Color('#030307')); }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <pointLight position={[8, 12, 8]} intensity={4.0} castShadow />
              <Stars radius={150} depth={50} count={7000} factor={8} saturation={1.0} fade speed={2.5} />
              <MovingNebula />
              <AtmosphericParticles />
              <LocalPlayer />
              <TerrainGrid instability={metrics.timelineInstability} />
              <EnvironmentalSpikes instability={metrics.timelineInstability} />
              {gameState.active && PATH.map((p, i) => (
                <mesh key={`path_${i}`} position={[p.x, 0.05, p.z]} rotation={[-Math.PI/2, 0, 0]} raycast={() => null}>
                  <planeGeometry args={[0.8, 0.8]} />
                  <meshBasicMaterial color="#0f172a" transparent opacity={0.8} />
                  <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[0.3, 0.3]} />
                    <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
                  </mesh>
                </mesh>
              ))}
              <CentralPortal instability={metrics.timelineInstability} />
              <DataFlows />
              <CentralTowers alignment={metrics.worldAlignment} instability={metrics.timelineInstability} />
              {gameEntities.towers.map(tower => (
                <group key={tower.id} position={[tower.x, 0, tower.z]} raycast={() => null}>
                  {/* Base */}
                  <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[0.3, 0.4, 0.5, 16]} />
                    <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <torusGeometry args={[0.4, 0.05, 16, 32]} />
                    <meshBasicMaterial color={tower.type === 'purify' ? '#00f0ff' : tower.type === 'contain' ? '#a855f7' : tower.type === 'sentinel' ? '#ff0055' : '#00ffb7'} />
                  </mesh>
                  {/* Turret */}
                  <group position={[0, 0.6, 0]} rotation={[0, tower.angle || 0, 0]}>
                    <mesh>
                      <boxGeometry args={[0.4, 0.3, 0.4]} />
                      <meshStandardMaterial color={tower.type === 'purify' ? '#00f0ff' : tower.type === 'contain' ? '#a855f7' : tower.type === 'sentinel' ? '#ff0055' : '#00ffb7'} />
                    </mesh>
                    {/* Barrel */}
                    <mesh position={[0, 0, 0.3]} rotation={[Math.PI/2, 0, 0]}>
                      <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                      <meshStandardMaterial color="#fff" emissive={tower.type === 'purify' ? '#00f0ff' : tower.type === 'contain' ? '#a855f7' : tower.type === 'sentinel' ? '#ff0055' : '#00ffb7'} emissiveIntensity={2} />
                    </mesh>
                  </group>
                </group>
              ))}

              {gameEntities.projectiles.map((p, idx) => (
                <mesh key={`proj_${p.id}_${idx}`} position={[p.x, 0.6, p.z]} raycast={() => null}>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshBasicMaterial color={p.color} />
                  <pointLight color={p.color} intensity={2} distance={2} />
                </mesh>
              ))}

              {gameEntities.particles.map((p, idx) => (
                <mesh key={`part_${idx}`} position={[p.x, p.y, p.z]} raycast={() => null}>
                  <boxGeometry args={[0.05, 0.05, 0.05]} />
                  <meshBasicMaterial color={p.color} transparent opacity={p.life} />
                </mesh>
              ))}

              {gameEntities.enemies.map(e => (
                <group key={e.id} position={[e.x, e.type === 'boss' ? 0.8 : 0.3, e.z]} raycast={() => null}>
                  <mesh>
                    {e.type === 'boss' && <sphereGeometry args={[0.8, 32, 32]} />}
                    {e.type === 'armored' && <boxGeometry args={[0.5, 0.5, 0.5]} />}
                    {e.type === 'shielded' && <sphereGeometry args={[0.4, 16, 16]} />}
                    {e.type === 'swarm' && <coneGeometry args={[0.2, 0.4, 4]} />}
                    {(!e.type || e.type === 'normal') && <sphereGeometry args={[0.3, 16, 16]} />}
                    <meshStandardMaterial 
                      color="#000"
                      emissive={e.color || "#ff0055"}
                      emissiveIntensity={e.type === 'boss' ? 3 : 1.5}
                      wireframe={e.type === 'shielded' || e.type === 'swarm'} 
                      metalness={e.type === 'armored' ? 0.9 : 0.1}
                      roughness={e.type === 'armored' ? 0.2 : 0.8}
                    />
                    <mesh>
                      <sphereGeometry args={[0.15, 8, 8]} />
                      <meshBasicMaterial color="#fff" />
                    </mesh>
                  </mesh>
                  <mesh position={[0, e.type === 'boss' ? 1.0 : 0.5, 0]}>
                    <planeGeometry args={[0.5, 0.05]} />
                    <meshBasicMaterial color="#333" />
                  </mesh>
                  <mesh position={[0, e.type === 'boss' ? 1.0 : 0.5, 0.01]}>
                    <planeGeometry args={[0.5 * (e.hp / e.maxHp), 0.05]} />
                    <meshBasicMaterial color="#00ff00" />
                  </mesh>
                </group>
              ))}
              {gameEntities.floatingTexts.map((ft, idx) => (
                <Html key={`ft_${idx}`} position={[ft.x, ft.y, ft.z]} center distanceFactor={10}>
                  <div style={{ color: ft.color, fontWeight: 'bold', fontSize: '1.2rem', textShadow: '0 0 5px black', pointerEvents: 'none' }}>
                    {ft.text}
                  </div>
                </Html>
              ))}
              {sovereigns.map((sovereign: any, i: number) => (
                <SovereignAgent key={sovereign.name || i} sovereign={sovereign} index={i} isSelected={selectedSovereignName === sovereign.name} slowed={Boolean(slowedSovereigns[sovereign.name])} threatFlash={Boolean(threatFlashes[sovereign.name])} threatLevel={getThreatLevel(sovereign.corruption)} onSelect={() => selectSovereign(sovereign.name)} />
              ))}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} onPointerMove={handleTDGridPointerMove} onClick={handleTDGridClick}>
                <planeGeometry args={[10, 10]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
              <OrbitControls enableDamping minDistance={4} maxDistance={22} />
              <EffectComposer>
                <Bloom intensity={1.8} luminanceThreshold={0.15} mipmapBlur />
                <Noise opacity={0.05} />
                <Vignette darkness={1.1} />
              </EffectComposer>
            </Suspense>
          </Canvas>
        ) : (
          <div className="canvas-2d-wrapper">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onPointerMove={handleCanvasPointerMove}
              onPointerLeave={handleCanvasPointerLeave}
            />
            {tdSelectedTower && (
              <div className="placement-hint">
                📍 Click grid cell to place <strong>{tdSelectedTower.toUpperCase()}</strong> (Cost: {getTowerCost(tdSelectedTower)})
              </div>
            )}
          </div>
        )}
      </div>
      <button className="sidebar-toggle-btn" onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }} aria-label="Open telemetry sidebar">
        📊 Telemetry
      </button>
      {campaignVictory && (
        <div className="campaign-completion-backdrop">
          <section className="campaign-completion" role="dialog" aria-modal="true" aria-labelledby="campaign-completion-title">
            <span className="campaign-completion-kicker">SECTOR RESTORED · LEVEL 3 COMPLETE</span>
            <h2 id="campaign-completion-title">The Rift remembers a different future</h2>
            <p>
              The gravity wound closes. Voidborn scouts and the settlements they once feared agree to keep the corridor open together.
              The signal is no longer a warning; it is an invitation.
            </p>
            <div className="campaign-completion-badge">
              <span>SEVEN-STAR GRID CERTIFICATION</span>
              <strong>Rift Peacemaker</strong>
              <small>HIGH SCORE · {gameState.score}</small>
            </div>
            <button className="cyber-btn" type="button" onClick={saveCampaignRewards}>
              Save certification · continue
            </button>
          </section>
        </div>
      )}
      <AtariWingOverlay key={atariOverlayTrigger} unlocked={atariUnlocked} />
      <ChatOverlay />
    </div>
  );
};
