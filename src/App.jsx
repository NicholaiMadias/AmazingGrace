import React, { useState, useEffect } from 'react';
import { Shield, Settings, Menu, X, BookOpen, Gamepad2, Activity } from 'lucide-react';
import { useSevenSisters } from '@/context/SevenSistersContext';

// Import our core architectural modules
import MatrixHUD from '@/modules/matrix/MatrixHUD';
import MatrixExchange from '@/modules/matrix/MatrixExchange';
import StorybookHub from '@/modules/storybook/StorybookHub';
import ReclaimMission from '@/modules/arcade/ReclaimMission';

// Thematic Configuration (Nimbus Land / Voice of Jesus)
const OS_THEME = {
  primary: '#7851A9',   // Royal Purple
  accent: '#00E5FF',    // Neon Blue
  background: '#050505', // Deep Space Black
  alert: '#facc15'      // Radiant Yellow (Lumen)
};

export default function StellaraOS() {
  const [activeView, setActiveView] = useState('hub');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMissionId, setActiveMissionId] = useState(null);

  // Pull global telemetry from the Context
  const { matrixMetrics, sisters, getUnlockedCount } = useSevenSisters();

  // Route Handler for seamless internal transitions
  const navigateTo = (view, missionId = null) => {
    setActiveView(view);
    setActiveMissionId(missionId);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // ---------------------------------------------------------------------------
  // RENDER: Core Navigation (High-Integrity Header)
  // ---------------------------------------------------------------------------
  const renderNavigation = () => (
    <nav className="sticky top-0 z-50 w-full border-b border-purple-900/50 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Identity Shield & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigateTo('hub')}
          >
            <Shield size={28} color={OS_THEME.accent} className="drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-widest text-sm uppercase">Stellara OS</span>
              <span className="text-purple-400 text-[10px] tracking-widest font-mono">v14.0 // Nexus Arcade</span>
            </div>
          </div>

          {/* Desktop Routing Nodes */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => navigateTo('hub')} className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeView === 'hub' ? 'text-[#00E5FF]' : 'text-gray-400 hover:text-white'}`}>
              Telemetry
            </button>
            <button onClick={() => navigateTo('storybook')} className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeView === 'storybook' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
              Shell of Vision
            </button>
            <button onClick={() => navigateTo('exchange')} className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeView === 'exchange' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              Lumen Exchange
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-400 hover:text-white">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Routing Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#050505] border-b border-purple-900/50 p-4 flex flex-col gap-4">
          <button onClick={() => navigateTo('hub')} className="text-left text-white font-bold uppercase tracking-widest">Telemetry Hub</button>
          <button onClick={() => navigateTo('storybook')} className="text-left text-white font-bold uppercase tracking-widest">Shell of Vision</button>
          <button onClick={() => navigateTo('exchange')} className="text-left text-white font-bold uppercase tracking-widest">Lumen Exchange</button>
        </div>
      )}
    </nav>
  );

  // ---------------------------------------------------------------------------
  // RENDER: Active View Controller
  // ---------------------------------------------------------------------------
  const renderActiveView = () => {
    switch(activeView) {
      
      // The Core Telemetry Dashboard
      case 'hub':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_15px_rgba(120,81,169,0.5)]">
                Matrix of Conscience
              </h1>
              <p className="text-purple-300 font-mono text-sm">
                System Integrity: Stable. {getUnlockedCount()} / 7 Virtues Resonating.
              </p>
            </div>
            
            {/* The primary HUD we built earlier */}
            <MatrixHUD 
              integrity={matrixMetrics.integrity} 
              lumen={matrixMetrics.globalLumen}
              activeStars={getUnlockedCount()}
              sisters={sisters}
            />

            {/* Quick Action CTA */}
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => navigateTo('storybook')}
                className="flex items-center gap-3 px-8 py-4 bg-purple-900/40 border border-purple-500 text-white rounded-lg hover:bg-purple-800 transition-all shadow-[0_0_20px_rgba(120,81,169,0.3)] font-bold uppercase tracking-widest"
              >
                <BookOpen size={20} />
                Access Reclaim Records
              </button>
            </div>
          </div>
        );

      // The Narrative Portal
      case 'storybook':
        return (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <StorybookHub 
              sisters={sisters} 
              onLaunchMission={(id) => navigateTo('mission', id)} 
            />
          </div>
        );

      // The Arcade Engine Wrapper
      case 'mission':
        return (
          <div className="animate-in zoom-in-95 duration-500">
             {/* If the Guardian bails on the mission, return them to the storybook */}
            <button 
              onClick={() => navigateTo('storybook')}
              className="mb-4 text-purple-400 hover:text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2"
            >
              <X size={16} /> Abort Mission Sequence
            </button>
            
            <ReclaimMission 
              targetSisterId={activeMissionId} 
              onMissionComplete={() => navigateTo('hub')}
            />
          </div>
        );

      // The Storefront
      case 'exchange':
        return (
          <div className="animate-in fade-in duration-500">
            <MatrixExchange />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen text-white font-sans selection:bg-purple-500/30 selection:text-white pb-24"
      style={{ backgroundColor: OS_THEME.background }}
    >
      {/* Background Cosmic Canvas (Assuming it mounts to body/root externally, or you can embed it here as a component) */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black"></div>

      {renderNavigation()}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {renderActiveView()}
      </main>
    </div>
  );
}
