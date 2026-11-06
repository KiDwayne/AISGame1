import React, { useState } from 'react';
import {
  PerkDef,
  PlacedTurret,
  TurretSocketId,
  TurretTypeId,
} from '../types/game';
import { TURRET_REGISTRY } from '../services/arsenalData';
import { soundEngine } from '../services/audio';
import {
  Shield,
  Wrench,
  Zap,
  Crosshair,
  Flame,
  Bomb,
  Snowflake,
  Play,
  CheckCircle,
  Coins,
  Radio,
  Layers,
  Activity,
  Target,
  ChevronsRight,
  Rocket,
  ShieldAlert,
} from 'lucide-react';

interface WaveDraftModalProps {
  wave: number;
  perks: PerkDef[];
  placedTurrets: PlacedTurret[];
  unlockedSockets: TurretSocketId[];
  unlockedTurretTypes: TurretTypeId[];
  bunkerHp: number;
  bunkerMaxHp: number;
  bioCredits: number;
  onSelectPerk: (perk: PerkDef) => void;
  onBuildTurret: (socket: TurretSocketId, type: TurretTypeId, cost: number) => void;
  onUpgradeTurret: (socket: TurretSocketId, cost: number) => void;
  onSellTurret?: (socket: TurretSocketId, refund: number) => void;
  onRepairBunker: (cost: number, healAmount: number) => void;
  onStartNextWave: () => void;
}

const PERK_ICONS: Record<string, React.ReactNode> = {
  Crosshair: <Crosshair className="w-6 h-6 text-amber-400" />,
  Flame: <Flame className="w-6 h-6 text-orange-400" />,
  ChevronsRight: <ChevronsRight className="w-6 h-6 text-sky-400" />,
  Wrench: <Wrench className="w-6 h-6 text-emerald-400" />,
  Snowflake: <Snowflake className="w-6 h-6 text-cyan-300" />,
  Target: <Target className="w-6 h-6 text-rose-400" />,
  Bomb: <Bomb className="w-6 h-6 text-amber-500" />,
  Coins: <Coins className="w-6 h-6 text-emerald-400" />,
  Activity: <Activity className="w-6 h-6 text-rose-500" />,
  Layers: <Layers className="w-6 h-6 text-amber-300" />,
  Zap: <Zap className="w-6 h-6 text-sky-400" />,
  BatteryCharging: <Zap className="w-6 h-6 text-cyan-400" />,
  ShieldAlert: <ShieldAlert className="w-6 h-6 text-orange-400" />,
  Shield: <Shield className="w-6 h-6 text-emerald-400" />,
};

const RARITY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  common: { border: 'border-slate-700', bg: 'bg-slate-900/60', text: 'text-slate-400' },
  rare: { border: 'border-sky-500/60', bg: 'bg-sky-950/30', text: 'text-sky-400' },
  epic: { border: 'border-purple-500/60', bg: 'bg-purple-950/30', text: 'text-purple-400' },
  legendary: { border: 'border-amber-500/80', bg: 'bg-amber-950/30', text: 'text-amber-400' },
};

export const WaveDraftModal: React.FC<WaveDraftModalProps> = ({
  wave,
  perks,
  placedTurrets,
  unlockedSockets,
  unlockedTurretTypes,
  bunkerHp,
  bunkerMaxHp,
  bioCredits,
  onSelectPerk,
  onBuildTurret,
  onUpgradeTurret,
  onSellTurret,
  onRepairBunker,
  onStartNextWave,
}) => {
  const [selectedPerkId, setSelectedPerkId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perks' | 'defenses'>('perks');

  const repairCost = 75;
  const repairAmount = 250;
  const canRepair = bunkerHp < bunkerMaxHp && bioCredits >= repairCost;

  const handlePickPerk = (perk: PerkDef) => {
    soundEngine.playUpgradeSuccess();
    setSelectedPerkId(perk.id);
    onSelectPerk(perk);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div>
            <span className="font-mono-tech text-xs text-amber-500 font-bold uppercase tracking-wider">
              SECTOR CLEARED // WAVE {wave} COMPLETE
            </span>
            <h2 className="font-display text-2xl font-black uppercase text-slate-100 tracking-wide">
              Tactical Supply Drop & Perimeter Upgrades
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span className="font-mono-tech text-xs text-slate-400">CREDITS:</span>
              <span className="font-mono-tech text-base font-bold text-emerald-400 tabular-nums">
                {bioCredits.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-xs font-mono-tech text-slate-300">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>HULL:</span>
              <span className="font-bold tabular-nums">
                {bunkerHp} / {bunkerMaxHp}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/30 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('perks')}
              className={`px-4 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'perks'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              1. Choose Tactical Perk {selectedPerkId && '✓'}
            </button>
            <button
              onClick={() => setActiveTab('defenses')}
              className={`px-4 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'defenses'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              2. 8-Turret Defense Grid ({placedTurrets.length}/8 Active)
            </button>
          </div>

          {/* Quick Repair Action */}
          <button
            onClick={() => {
              if (canRepair) {
                soundEngine.playUpgradeSuccess();
                onRepairBunker(repairCost, repairAmount);
              }
            }}
            disabled={!canRepair}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono-tech border transition-all ${
              canRepair
                ? 'border-emerald-500/70 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 cursor-pointer'
                : 'border-slate-800 text-slate-600 bg-slate-900 cursor-not-allowed'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Field Repair (+{repairAmount} HP)</span>
            <span className="text-emerald-400 font-bold">{repairCost} cr</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'perks' ? (
            <div>
              <div className="text-xs text-slate-400 font-mono-tech mb-4">
                Select 1 military tactical supply card. Repeating options stack and upgrade rank for compounding power:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {perks.map((perk) => {
                  const isSelected = selectedPerkId === perk.id;
                  const rarityStyle = RARITY_COLORS[perk.rarity] || RARITY_COLORS.common;
                  const isUpgrade = (perk.currentRank || 0) > 0;

                  return (
                    <div
                      key={perk.id}
                      onClick={() => handlePickPerk(perk)}
                      className={`relative flex flex-col justify-between p-5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/40 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400'
                          : isUpgrade
                          ? 'border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-400 hover:scale-[1.02]'
                          : `${rarityStyle.border} ${rarityStyle.bg} hover:border-slate-500 hover:scale-[1.02]`
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                            {PERK_ICONS[perk.iconName] || <Zap className="w-6 h-6 text-amber-400" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isUpgrade && (
                              <span className="font-mono-tech text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                                UPGRADE (RANK {perk.nextRank})
                              </span>
                            )}
                            <span
                              className={`font-mono-tech text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900/80 ${rarityStyle.text}`}
                            >
                              {perk.rarity}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-display text-xl font-bold uppercase text-slate-100 tracking-wide mb-1">
                          {perk.name}
                        </h3>
                        <div className="text-xs text-amber-400/90 font-mono-tech mb-2">
                          {perk.tagline}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {perk.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] font-mono-tech text-slate-400">
                          {isSelected ? 'SELECTED' : isUpgrade ? 'CLICK TO UPGRADE RANK' : 'CLICK TO SELECT'}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-amber-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-slate-400 font-mono-tech mb-4">
                Automated Side Turrets defend perimeter flanks independently while you aim the main gun:
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(
                  [
                    'north',
                    'northeast',
                    'east',
                    'southeast',
                    'south',
                    'southwest',
                    'west',
                    'northwest',
                  ] as TurretSocketId[]
                ).map((socket) => {
                  const isSocketUnlocked = unlockedSockets.includes(socket);
                  const placed = placedTurrets.find((t) => t.socket === socket);

                  return (
                    <div
                      key={socket}
                      className={`p-4 rounded-lg border flex flex-col justify-between ${
                        isSocketUnlocked
                          ? 'border-slate-800 bg-slate-950/60'
                          : 'border-slate-900 bg-slate-950/20 opacity-40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400 mb-2">
                          <span className="uppercase font-bold text-amber-500">
                            {socket} FLANK
                          </span>
                          <span>{placed ? `LVL ${placed.level}` : 'EMPTY'}</span>
                        </div>

                        {placed ? (
                          <div>
                            <div className="font-display text-lg font-bold text-slate-100 uppercase mb-1">
                              {TURRET_REGISTRY[placed.type]?.name}
                            </div>
                            <p className="text-xs text-slate-400 mb-3">
                              {TURRET_REGISTRY[placed.type]?.description}
                            </p>
                            <div className="text-[11px] font-mono-tech text-slate-400 space-y-0.5">
                              <div>Damage: {TURRET_REGISTRY[placed.type]?.damage * placed.level}</div>
                              <div>Range: {TURRET_REGISTRY[placed.type]?.range}px</div>
                            </div>
                          </div>
                        ) : isSocketUnlocked ? (
                          <div>
                            <div className="text-xs text-slate-300 font-semibold mb-2">
                              Build New Turret:
                            </div>
                            <div className="space-y-1.5">
                              {unlockedTurretTypes.map((type) => {
                                const def = TURRET_REGISTRY[type];
                                const canAfford = bioCredits >= def.cost;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      if (canAfford) {
                                        soundEngine.playUpgradeSuccess();
                                        onBuildTurret(socket, type, def.cost);
                                      }
                                    }}
                                    disabled={!canAfford}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono-tech border transition-all ${
                                      canAfford
                                        ? 'border-slate-700 bg-slate-900 hover:border-amber-500/70 text-slate-200 cursor-pointer'
                                        : 'border-slate-800 bg-slate-950/40 text-slate-600 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>{def.name}</span>
                                    <span className="font-bold text-emerald-400">{def.cost} cr</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 py-6 text-center">
                            Socket Locked in Tech Tree HQ
                          </div>
                        )}
                      </div>

                      {placed && (
                        <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                          {(() => {
                            const upgradeCost = Math.round(TURRET_REGISTRY[placed.type].cost * 0.8 * placed.level);
                            const canAfford = bioCredits >= upgradeCost;
                            return (
                              <button
                                onClick={() => {
                                  if (canAfford) {
                                    soundEngine.playUpgradeSuccess();
                                    onUpgradeTurret(socket, upgradeCost);
                                  }
                                }}
                                disabled={!canAfford}
                                className={`w-full py-1.5 px-3 rounded text-xs font-mono-tech font-bold border transition-all ${
                                  canAfford
                                    ? 'border-amber-500/80 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 cursor-pointer'
                                    : 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                                }`}
                              >
                                Upgrade Lvl {placed.level + 1} ({upgradeCost} cr)
                              </button>
                            );
                          })()}

                          {onSellTurret && (() => {
                            const refundAmount = Math.round(TURRET_REGISTRY[placed.type].cost * 0.6 * placed.level);
                            return (
                              <button
                                onClick={() => {
                                  soundEngine.playClick();
                                  onSellTurret(socket, refundAmount);
                                }}
                                className="w-full py-1 px-2 rounded text-[10px] font-mono-tech text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 hover:border-rose-700/60 transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>Dismantle Turret (+{refundAmount} cr)</span>
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono-tech">
            {selectedPerkId ? (
              <span className="text-emerald-400">Tactical Perk confirmed. Ready to deploy next wave.</span>
            ) : (
              <span className="text-amber-400">Select 1 tactical perk above to deploy.</span>
            )}
          </div>

          <button
            onClick={() => {
              if (selectedPerkId) {
                soundEngine.playWaveHorn();
                onStartNextWave();
              }
            }}
            disabled={!selectedPerkId}
            className={`flex items-center gap-2.5 px-6 py-3 rounded font-display text-lg font-bold uppercase tracking-wider transition-all ${
              selectedPerkId
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Deploy Wave {wave + 1}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
