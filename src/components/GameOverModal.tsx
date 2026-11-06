import React, { useEffect } from 'react';
import {
  Skull,
  Trophy,
  Coins,
  Cpu,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { soundEngine } from '../services/audio';

interface GameOverModalProps {
  wavesSurvived: number;
  totalKills: number;
  bioCreditsEarned: number;
  score: number;
  onRestart: () => void;
  onOpenTechTree: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  wavesSurvived,
  totalKills,
  bioCreditsEarned,
  score,
  onRestart,
  onOpenTechTree,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        soundEngine.init();
        soundEngine.resume();
        soundEngine.playClick();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl text-center">
        {/* Skull badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-950/60 border border-rose-600/60 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>

        <span className="font-mono-tech text-xs text-rose-500 font-bold uppercase tracking-widest">
          DEFENSE OVERRUN // SECTOR LOST
        </span>

        <h2 className="font-display text-3xl font-black uppercase text-slate-100 tracking-wide mt-1 mb-2">
          Post-Action Debriefing
        </h2>

        <p className="text-xs text-slate-400 mb-6">
          The central bunker has suffered catastrophic structural failure. All harvested Bio-Credits have been beamed back to Base HQ for research.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono-tech text-left">
          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>WAVES SURVIVED</span>
            </div>
            <div className="text-xl font-bold text-slate-100 tabular-nums">
              {wavesSurvived}
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>MUTANTS EXTERMINATED</span>
            </div>
            <div className="text-xl font-bold text-slate-100 tabular-nums">
              {totalKills.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>CREDITS HARVESTED</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">
              +{bioCreditsEarned.toLocaleString()}
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              <span>SORTIE SCORE</span>
            </div>
            <div className="text-xl font-bold text-sky-400 tabular-nums">
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display text-lg font-bold uppercase tracking-wider rounded transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Redeploy Sortie</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenTechTree();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-display text-lg font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Upgrade Base Tech</span>
          </button>
        </div>

        <div className="mt-4 text-[11px] font-mono-tech text-slate-500">
          Press <kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">SPACE</kbd> or <kbd className="px-1 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">ENTER</kbd> to Quick Restart
        </div>
      </div>
    </div>
  );
};
