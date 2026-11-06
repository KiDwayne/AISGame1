import React from 'react';
import {
  Shield,
  ShieldAlert,
  Coins,
  Pause,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  Layers,
  ChevronsRight,
  Rocket,
  Sun,
} from 'lucide-react';
import { WeaponId } from '../types/game';
import { WEAPON_REGISTRY } from '../services/arsenalData';

interface InGameHUDProps {
  bunkerHp: number;
  bunkerMaxHp: number;
  bunkerShield: number;
  wave: number;
  waveKills: number;
  waveTotal: number;
  totalKills: number;
  bioCreditsEarned: number;
  currentWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  empReady: boolean;
  empCooldownRatio: number;
  isMuted: boolean;
  onSelectWeapon: (weapon: WeaponId) => void;
  onTriggerEmp: () => void;
  onPause: () => void;
  onToggleMute: () => void;
}

const WEAPON_ICONS: Record<WeaponId, React.ReactNode> = {
  gatling: <Flame className="w-4 h-4 text-amber-400" />,
  shotgun: <Layers className="w-4 h-4 text-orange-400" />,
  railgun: <ChevronsRight className="w-4 h-4 text-sky-400" />,
  rockets: <Rocket className="w-4 h-4 text-rose-400" />,
  plasma: <Sun className="w-4 h-4 text-purple-400" />,
};

export const InGameHUD: React.FC<InGameHUDProps> = ({
  bunkerHp,
  bunkerMaxHp,
  bunkerShield,
  wave,
  waveKills,
  waveTotal,
  totalKills,
  bioCreditsEarned,
  currentWeapon,
  unlockedWeapons,
  empReady,
  empCooldownRatio,
  isMuted,
  onSelectWeapon,
  onTriggerEmp,
  onPause,
  onToggleMute,
}) => {
  const hpRatio = Math.max(0, Math.min(1, bunkerHp / (bunkerMaxHp || 1)));
  const isCriticalHp = hpRatio < 0.25;
  const waveProgress = Math.min(1, waveKills / (waveTotal || 1));

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none z-20">
      {/* Top Bar Perimeter Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Bunker Structural Integrity Meter */}
        <div className="bg-slate-950/85 backdrop-blur-none border border-slate-800 p-3 rounded-lg shadow-xl w-64 pointer-events-auto">
          <div className="flex items-center justify-between mb-1 text-xs font-mono-tech">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              {isCriticalHp ? (
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
              ) : (
                <Shield className="w-4 h-4 text-amber-500" />
              )}
              BUNKER HULL
            </span>
            <span
              className={`tabular-nums font-bold ${
                isCriticalHp ? 'text-rose-400 animate-pulse' : 'text-slate-100'
              }`}
            >
              {bunkerHp} / {bunkerMaxHp}
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full h-3 bg-slate-900 rounded-sm overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className={`h-full transition-all duration-150 rounded-xs ${
                isCriticalHp
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : hpRatio > 0.5
                  ? 'bg-amber-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${hpRatio * 100}%` }}
            />
          </div>

          {/* Hard-Light Energy Shield if present */}
          {bunkerShield > 0 && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono-tech text-sky-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                SHIELD DOME
              </span>
              <span className="tabular-nums font-bold">+{bunkerShield} HP</span>
            </div>
          )}
        </div>

        {/* Center Wave Tracker */}
        <div className="bg-slate-950/85 border border-slate-800 px-5 py-2.5 rounded-lg shadow-xl flex flex-col items-center pointer-events-auto">
          <div className="font-display text-2xl font-black tracking-wider text-amber-400 uppercase">
            WAVE {wave.toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs font-mono-tech text-slate-400">
            <span className="tabular-nums font-semibold text-slate-200">
              {waveKills} / {waveTotal}
            </span>
            <span>KILLS</span>
          </div>
          {/* Progress track */}
          <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-200"
              style={{ width: `${waveProgress * 100}%` }}
            />
          </div>
        </div>

        {/* Right Corner Bio-Credits & Quick Utilities */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Currency Harvested */}
          <div className="bg-slate-950/85 border border-slate-800 px-3.5 py-2 rounded-lg shadow-xl flex items-center gap-2.5">
            <Coins className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-mono-tech text-slate-400 uppercase leading-none">
                BIO-CREDITS
              </span>
              <span className="font-mono-tech text-base font-bold text-emerald-400 tabular-nums leading-tight">
                +{bioCreditsEarned}
              </span>
            </div>
          </div>

          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-950/85 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Pause button */}
          <button
            onClick={onPause}
            className="p-2.5 bg-slate-950/85 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
            title="Pause Game (Esc)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Bar Controls Cluster */}
      <div className="flex items-end justify-between w-full">
        {/* Weapon Arsenal Wheel Bar */}
        <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-lg shadow-xl flex items-center gap-2 pointer-events-auto">
          {(['gatling', 'shotgun', 'railgun', 'rockets', 'plasma'] as WeaponId[]).map((wId, idx) => {
            const def = WEAPON_REGISTRY[wId];
            const isUnlocked = unlockedWeapons.includes(wId);
            const isActive = currentWeapon === wId;

            return (
              <button
                key={wId}
                disabled={!isUnlocked}
                onClick={() => onSelectWeapon(wId)}
                className={`flex items-center gap-2 px-3 py-2 rounded border transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/80 shadow-md shadow-amber-500/10'
                    : isUnlocked
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                    : 'opacity-30 bg-slate-950/40 border-slate-900 cursor-not-allowed'
                }`}
              >
                <span className="font-mono-tech text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {idx + 1}
                </span>
                <div className="hidden sm:flex flex-col">
                  <div className="flex items-center gap-1.5">
                    {WEAPON_ICONS[wId]}
                    <span
                      className={`font-display text-sm font-bold tracking-wide uppercase ${
                        isActive ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {def.name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Emergency EMP Shockwave Ability */}
        <button
          onClick={onTriggerEmp}
          disabled={!empReady}
          className={`bg-slate-950/90 border p-3 rounded-lg shadow-xl flex items-center gap-3 transition-all pointer-events-auto ${
            empReady
              ? 'border-sky-500/80 bg-sky-950/30 hover:bg-sky-900/40 cursor-pointer shadow-lg shadow-sky-500/20 active:scale-95'
              : 'border-slate-800 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Circular cooldown track */}
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                className="stroke-slate-800"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                className={`${empReady ? 'stroke-sky-400' : 'stroke-sky-600'}`}
                strokeWidth="3"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset={100 - empCooldownRatio * 100}
                strokeLinecap="round"
              />
            </svg>
            <Zap className={`w-5 h-5 absolute ${empReady ? 'text-sky-300 animate-pulse' : 'text-slate-500'}`} />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold text-sky-400 uppercase tracking-wide">
                EMP BLAST
              </span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 text-[10px] font-mono-tech text-slate-300 rounded">
                SPACE
              </kbd>
            </div>
            <span className="text-[11px] font-mono-tech text-slate-400">
              {empReady ? 'READY TO DETONATE' : 'RECHARGING...'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
