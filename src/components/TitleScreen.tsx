import React, { useEffect } from 'react';
import {
  Crosshair,
  Cpu,
  Volume2,
  VolumeX,
  Trophy,
  Skull,
  Shield,
  Coins,
  Play,
  Flame,
} from 'lucide-react';
import { PersistentProfile } from '../types/game';
import { soundEngine } from '../services/audio';

interface TitleScreenProps {
  profile: PersistentProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
  onOpenTechTree: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  profile,
  isMuted,
  onToggleMute,
  onStartGame,
  onOpenTechTree,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        soundEngine.init();
        soundEngine.resume();
        soundEngine.playClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 overflow-hidden bg-[#07090e]">
      {/* Background Grid & Atmospheric Radar Sweep */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 70%),
              linear-gradient(to right, #1e293b 1px, transparent 1px),
              linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        />
      </div>

      {/* Atmospheric Center Bunker Wireframe Icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
        <div className="w-[500px] h-[500px] rounded-full border border-amber-500/30 flex items-center justify-center animate-spin" style={{ animationDuration: '60s' }}>
          <div className="w-[380px] h-[380px] rounded-full border border-dashed border-red-500/30 flex items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border-2 border-slate-700/60" />
          </div>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-amber-500 rotate-45" />
          <span className="font-mono-tech text-xs tracking-wider uppercase text-amber-500 font-semibold">
            DEFENSE PROTOCOL // STAND DEFENSE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded border border-slate-800">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="font-mono-tech text-xs text-slate-400">CREDITS:</span>
            <span className="font-mono-tech text-sm font-bold text-emerald-400 tabular-nums">
              {profile.bioCredits.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.init();
              onToggleMute();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-xs transition-colors cursor-pointer"
            title="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            <span className="font-mono-tech">{isMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>
        </div>
      </header>

      {/* Center Hero Lockup */}
      <div className="relative z-10 max-w-4xl mx-auto text-center my-auto flex flex-col items-center">
        {/* Bespoke SVG Title Lockup */}
        <div className="mb-3">
          <svg className="w-[320px] sm:w-[460px] md:w-[580px] h-auto max-h-[140px]" viewBox="0 0 600 130" fill="none">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            {/* Background stencil shadow */}
            <text x="302" y="77" textAnchor="middle" fill="#000000" fontSize="72" fontWeight="900" fontFamily="Barlow Condensed, sans-serif" letterSpacing="0.1em">
              OUTPOST ZERO
            </text>
            <text x="300" y="75" textAnchor="middle" fill="url(#titleGrad)" fontSize="72" fontWeight="900" fontFamily="Barlow Condensed, sans-serif" letterSpacing="0.1em">
              OUTPOST ZERO
            </text>
            {/* Subtitle ribbon */}
            <rect x="150" y="94" width="300" height="22" fill="#1e293b" rx="2" />
            <text x="300" y="109" textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono, monospace" letterSpacing="0.3em">
              GUN STAND HORDE DEFENSE
            </text>
          </svg>
        </div>

        <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed mb-8">
          Defend the central military bunker against 360-degree mutant zombie swarms. Deploy switchable heavy cannons, build automated flank turrets, draft tactical perks, and unlock permanent military tech.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <button
            onClick={() => {
              soundEngine.init();
              soundEngine.resume();
              soundEngine.playClick();
              onStartGame();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display text-xl font-bold uppercase tracking-wider rounded transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Engage Sortie</span>
          </button>

          <button
            onClick={() => {
              soundEngine.init();
              soundEngine.playClick();
              onOpenTechTree();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-display text-xl font-bold uppercase tracking-wider rounded transition-all active:scale-98 cursor-pointer"
          >
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>Tech Tree HQ</span>
          </button>
        </div>

        {/* Lifetime Record Strip */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono-tech border border-slate-800/80 bg-slate-950/60 px-6 py-3 rounded">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>BEST WAVE:</span>
            <span className="text-slate-100 font-bold tabular-nums">
              {profile.highestWaveSurvied > 0 ? `WAVE ${profile.highestWaveSurvied}` : 'NO RECORD'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-400" />
            <span>MUTANTS SLAIN:</span>
            <span className="text-slate-100 font-bold tabular-nums">
              {profile.totalZombiesKilled.toLocaleString()}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>SORTIES:</span>
            <span className="text-slate-100 font-bold tabular-nums">
              {profile.totalSortiesCompleted}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono-tech">
        <div className="flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-amber-500" />
          <span>Mouse Aim & Left Click · 1-5 Switch Weapon · Space EMP Blast · Esc Pause</span>
        </div>
        <div className="text-slate-600">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">ENTER</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">SPACE</kbd> to Begin
        </div>
      </footer>
    </div>
  );
};
