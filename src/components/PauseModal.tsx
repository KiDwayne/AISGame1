import React, { useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Crosshair,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../services/audio';

interface PauseModalProps {
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isMuted,
  onResume,
  onRestart,
  onExitToTitle,
  onToggleMute,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        soundEngine.playClick();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-center">
        <span className="font-mono-tech text-xs text-amber-500 font-bold uppercase tracking-widest">
          SIMULATION SUSPENDED
        </span>
        <h2 className="font-display text-3xl font-black uppercase text-slate-100 tracking-wide mt-1 mb-6">
          Tactical Pause
        </h2>

        {/* Controls Quick Reference */}
        <div className="bg-slate-950/80 rounded border border-slate-800 p-4 mb-6 text-left text-xs font-mono-tech text-slate-300 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span className="text-slate-400">Aim & Fire</span>
            <span className="font-bold text-amber-400">Mouse Aim + Left Click</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span className="text-slate-400">Switch Weapons</span>
            <span className="font-bold text-amber-400">Keys 1, 2, 3, 4, 5</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span className="text-slate-400">Emergency Stun</span>
            <span className="font-bold text-sky-400">SPACEBAR</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Audio System</span>
            <button
              onClick={onToggleMute}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-lg font-bold uppercase tracking-wider rounded transition-all shadow-md shadow-amber-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Sortie</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-display text-base font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Wave 1</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onExitToTitle();
            }}
            className="w-full py-2.5 px-6 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 font-display text-base font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Abort to Base HQ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
