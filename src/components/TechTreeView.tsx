import React, { useState } from 'react';
import {
  PersistentProfile,
  TechBranch,
  TechNode,
  WeaponId,
} from '../types/game';
import { getNodeCost, TECH_TREE_NODES } from '../services/techTreeData';
import { soundEngine } from '../services/audio';
import {
  Shield,
  Crosshair,
  Cpu,
  Coins,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Activity,
  Zap,
  Disc,
  Flame,
  Target,
  Layers,
  ChevronsRight,
  Rocket,
  Sun,
  Compass,
  Radio,
  Bomb,
  BatteryCharging,
  Package,
  FastForward,
} from 'lucide-react';

interface TechTreeViewProps {
  profile: PersistentProfile;
  onUpgradeNode: (node: TechNode, cost: number, weaponUnlock?: WeaponId) => void;
  onResetTech: () => void;
  onBack: () => void;
}

const BRANCH_CONFIG: Record<
  TechBranch,
  { name: string; subtitle: string; icon: React.ReactNode; color: string }
> = {
  bunker: {
    name: 'Bunker Hull & Fortification',
    subtitle: 'Structural integrity, nanite repair, and perimeter defensive armor.',
    icon: <Shield className="w-5 h-5 text-amber-400" />,
    color: 'border-amber-500/40 text-amber-400',
  },
  ballistics: {
    name: 'Ballistics & Heavy Weapons',
    subtitle: 'Kinetic caliber upgrades, fire rate acceleration, and switchable heavy weapons.',
    icon: <Crosshair className="w-5 h-5 text-rose-400" />,
    color: 'border-rose-500/40 text-rose-400',
  },
  automation: {
    name: 'Automation & 8-Turret Grid',
    subtitle: 'Automated 8-socket defense network, rapid feeders, and orbital drone hangars.',
    icon: <Cpu className="w-5 h-5 text-sky-400" />,
    color: 'border-sky-500/40 text-sky-400',
  },
  logistics: {
    name: 'Logistics & Combat Systems',
    subtitle: 'Bio-Credit scrap harvesting, EMP shockwave recharge, and kinetic penetration.',
    icon: <Coins className="w-5 h-5 text-emerald-400" />,
    color: 'border-emerald-500/40 text-emerald-400',
  },
};

const TECH_ICONS: Record<string, React.ReactNode> = {
  Shield: <Shield className="w-5 h-5 text-amber-400" />,
  Activity: <Activity className="w-5 h-5 text-emerald-400" />,
  Zap: <Zap className="w-5 h-5 text-cyan-400" />,
  Disc: <Disc className="w-5 h-5 text-sky-400" />,
  Crosshair: <Crosshair className="w-5 h-5 text-rose-400" />,
  Flame: <Flame className="w-5 h-5 text-orange-400" />,
  Target: <Target className="w-5 h-5 text-rose-500" />,
  Layers: <Layers className="w-5 h-5 text-amber-300" />,
  ChevronsRight: <ChevronsRight className="w-5 h-5 text-sky-400" />,
  Rocket: <Rocket className="w-5 h-5 text-rose-400" />,
  Sun: <Sun className="w-5 h-5 text-purple-400" />,
  Compass: <Compass className="w-5 h-5 text-sky-400" />,
  Cpu: <Cpu className="w-5 h-5 text-cyan-400" />,
  Radio: <Radio className="w-5 h-5 text-sky-300" />,
  Bomb: <Bomb className="w-5 h-5 text-amber-500" />,
  Coins: <Coins className="w-5 h-5 text-emerald-400" />,
  BatteryCharging: <BatteryCharging className="w-5 h-5 text-cyan-400" />,
  Package: <Package className="w-5 h-5 text-amber-400" />,
  FastForward: <FastForward className="w-5 h-5 text-sky-400" />,
};

export const TechTreeView: React.FC<TechTreeViewProps> = ({
  profile,
  onUpgradeNode,
  onResetTech,
  onBack,
}) => {
  const [activeBranch, setActiveBranch] = useState<TechBranch>('bunker');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const branchNodes = TECH_TREE_NODES.filter((n) => n.branch === activeBranch);

  const handlePurchase = (node: TechNode) => {
    const currentLvl = profile.unlockedTech[node.id] || 0;
    if (currentLvl >= node.maxLevel) return;

    const cost = getNodeCost(node, currentLvl);
    if (profile.bioCredits < cost) return;

    soundEngine.playUpgradeSuccess();

    // Map weapon unlock if applicable
    let weaponUnlock: WeaponId | undefined = undefined;
    if (node.id === 'unlock_shotgun') weaponUnlock = 'shotgun';
    if (node.id === 'unlock_railgun') weaponUnlock = 'railgun';
    if (node.id === 'unlock_rockets') weaponUnlock = 'rockets';
    if (node.id === 'unlock_plasma') weaponUnlock = 'plasma';

    onUpgradeNode(node, cost, weaponUnlock);
  };

  return (
    <div className="relative w-full h-full flex flex-col p-6 md:p-10 bg-[#07090e] select-none overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px),
              linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono-tech transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO COMMAND</span>
          </button>

          <div>
            <span className="font-mono-tech text-[11px] text-amber-500 font-bold uppercase tracking-wider">
              OPERATIONS HQ // RESEARCH & UPGRADES
            </span>
            <h1 className="font-display text-2xl font-black uppercase text-slate-100 tracking-wide">
              Permanent Military Tech Tree
            </h1>
          </div>
        </div>

        {/* Currency & Respec */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-lg shadow-xl">
            <Coins className="w-5 h-5 text-emerald-400" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-mono-tech text-slate-400 uppercase">
                BIO-CREDITS BANK
              </span>
              <span className="font-mono-tech text-lg font-bold text-emerald-400 tabular-nums leading-none">
                {profile.bioCredits.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded text-xs font-mono-tech transition-colors cursor-pointer"
            title="Reset Tech Tree"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESPEC</span>
          </button>
        </div>
      </header>

      {/* Branch Selector Tabs */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        {(['bunker', 'ballistics', 'automation', 'logistics'] as TechBranch[]).map((branch) => {
          const cfg = BRANCH_CONFIG[branch];
          const isSelected = activeBranch === branch;

          return (
            <button
              key={branch}
              onClick={() => {
                soundEngine.playClick();
                setActiveBranch(branch);
              }}
              className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500/80 bg-amber-950/25 shadow-lg shadow-amber-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {cfg.icon}
                <span
                  className={`font-display text-base font-bold uppercase tracking-wider ${
                    isSelected ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  {cfg.name.split(' ')[0]}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{cfg.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Tech Tree Upgrade Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
          {branchNodes.map((node) => {
            const currentLvl = profile.unlockedTech[node.id] || 0;
            const isMaxed = currentLvl >= node.maxLevel;
            const cost = getNodeCost(node, currentLvl);
            const canAfford = !isMaxed && profile.bioCredits >= cost;

            return (
              <div
                key={node.id}
                className={`p-5 rounded-lg border flex flex-col justify-between transition-all ${
                  isMaxed
                    ? 'border-emerald-500/50 bg-emerald-950/15'
                    : currentLvl > 0
                    ? 'border-slate-700 bg-slate-900/90'
                    : 'border-slate-800/80 bg-slate-950/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      {TECH_ICONS[node.iconName] || <Shield className="w-5 h-5 text-amber-400" />}
                    </div>

                    <div className="flex items-center gap-1 font-mono-tech text-xs">
                      <span className="text-slate-400">LVL</span>
                      <span
                        className={`font-bold tabular-nums ${
                          isMaxed ? 'text-emerald-400' : currentLvl > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {currentLvl}/{node.maxLevel}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-lg font-bold uppercase text-slate-100 tracking-wide mb-1">
                    {node.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    {node.description}
                  </p>

                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono-tech text-amber-400/90 mb-4">
                    {node.effectDescription(currentLvl > 0 ? currentLvl : 1)}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  {isMaxed ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-mono-tech font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MAX LEVEL REACHED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(node)}
                      disabled={!canAfford}
                      className={`w-full py-2.5 px-4 rounded text-xs font-display font-bold uppercase tracking-wider flex items-center justify-between transition-all ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-98 cursor-pointer'
                          : 'bg-slate-800/80 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Upgrade Lvl {currentLvl + 1}</span>
                      <span className="font-mono-tech font-bold tabular-nums">{cost} cr</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Respec Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold uppercase text-slate-100 mb-2">
              Confirm Tech Respec
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Resetting will clear all current technology nodes back to level 0 and lock additional weapons. Are you sure you want to re-allocate your build?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded text-xs font-mono-tech text-slate-300 bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onResetTech();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded text-xs font-mono-tech font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 cursor-pointer"
              >
                CONFIRM RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
