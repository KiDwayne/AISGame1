/**
 * Outpost Zero: Gun Stand Defense
 * Main Application & Game Loop State Coordinator
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  InRunStats,
  PerkDef,
  PlacedTurret,
  TechNode,
  TurretSocketId,
  TurretTypeId,
  WeaponId,
} from './types/game';
import {
  addCredits,
  loadProfile,
  resetProfileTech,
  saveProfile,
  unlockTechNode,
} from './services/storage';
import { soundEngine } from './services/audio';
import { getRandomPerks } from './services/perksData';
import { GameEngine } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { InGameHUD } from './components/InGameHUD';
import { WaveDraftModal } from './components/WaveDraftModal';
import { TechTreeView } from './components/TechTreeView';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const [profile, setProfile] = useState(() => loadProfile());
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [isMuted, setIsMuted] = useState(false);

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // HUD State (decoupled from 60 FPS loop, updated via callback)
  const [hudData, setHudData] = useState({
    bunkerHp: 1000,
    bunkerMaxHp: 1000,
    bunkerShield: 0,
    wave: 1,
    waveKills: 0,
    waveTotal: 15,
    totalKills: 0,
    bioCreditsEarned: 0,
    currentWeapon: 'gatling' as WeaponId,
    empReady: true,
    empCooldownRatio: 1.0,
  });

  // Current In-Run State
  const [inRunStats, setInRunStats] = useState<InRunStats>(() => createInitialRunStats(profile));
  const [placedTurrets, setPlacedTurrets] = useState<PlacedTurret[]>([]);
  const [draftPerks, setDraftPerks] = useState<PerkDef[]>([]);
  const [perkStacks, setPerkStacks] = useState<Record<string, number>>({});
  const [gameOverSummary, setGameOverSummary] = useState({
    wavesSurvived: 0,
    totalKills: 0,
    bioCreditsEarned: 0,
    score: 0,
  });

  // ALL 8 Auto Turret Sockets are UNLOCKED from the beginning
  const unlockedSockets: TurretSocketId[] = [
    'north',
    'northeast',
    'east',
    'southeast',
    'south',
    'southwest',
    'west',
    'northwest',
  ];

  // ALL Turret Types are UNLOCKED from the beginning
  const unlockedTurretTypes: TurretTypeId[] = [
    'vulcan',
    'flamethrower',
    'tesla',
    'cryo',
    'laser',
    'missile',
    'mortar',
  ];

  // Helper to create starting run stats from persistent tech
  function createInitialRunStats(prof: typeof profile): InRunStats {
    const tech = prof.unlockedTech;
    const maxHp = 1000 + (tech['hull_armor'] || 0) * 200;
    const damageMult = 1.0 + (tech['caliber_mastery'] || 0) * 0.15;
    const fireRateMult = 1.0 + (tech['fire_rate'] || 0) * 0.12;
    const critChance = 0.05 + (tech['critical_optics'] || 0) * 0.06;
    const critMultiplier = 1.5 + (tech['critical_optics'] || 0) * 0.4;
    const creditsMult = 1.0 + (tech['bio_salvage'] || 0) * 0.2;
    const empCooldown = Math.max(10, 35 - (tech['emp_overcharge'] || 0) * 5);
    const pierce = tech['ammo_resupply'] || 0;
    const armorReduction = (tech['spiked_plating'] || 0) * 0.06;

    const splitShots = (tech['split_shot_tech'] || 0);
    const teslaArc = (tech['tesla_main_tech'] || 0) > 0;
    const droneEscorts = (tech['quad_drone_bay'] || 0);

    return {
      damageMult,
      fireRateMult,
      reloadMult: 1.0,
      bunkerMaxHpBonus: 0,
      bunkerCurrentHp: maxHp,
      bunkerMaxHp: maxHp,
      armorReduction,
      critChance,
      critMultiplier,
      explosiveRounds: false,
      explosiveRadius: 0,
      explosiveDamageBonus: 0,
      pierceBonus: pierce,
      vampiricChance: 0,
      bouncingShrapnel: false,
      shrapnelCount: 4,
      electricDischarge: false,
      chainLightningTargets: 3,
      chainLightningDamage: 45,
      cryoSlowMult: 0,
      creditsMultiplier: creditsMult,
      empCooldownSec: empCooldown,
      lastEmpUsedTime: -999,
      unlockedSockets: [
        'north',
        'northeast',
        'east',
        'southeast',
        'south',
        'southwest',
        'west',
        'northwest',
      ],
      splitShots,
      teslaArc,
      incendiaryRounds: false,
      napalmBurnDamageBonus: 0,
      napalmRadiusBonus: 0,
      quadBarrels: false,
      extraProjectilesPerShot: 0,
      droneEscorts,
      turretDamageMult: 1.0,
      turretFireRateMult: 1.0,
    };
  }

  // Audio mute toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Handle Game Engine Callbacks
  const handleWaveComplete = useCallback(
    (wave: number) => {
      // Award lump sum dividend from tech
      const dividendLvl = profile.unlockedTech['tactical_rations'] || 0;
      if (dividendLvl > 0) {
        const bonus = dividendLvl * 60;
        engineRef.current?.addCredits(bonus);
        setHudData((prev) => ({
          ...prev,
          bioCreditsEarned: prev.bioCreditsEarned + bonus,
        }));
      }

      // Generate 3 random roguelike perks (supporting stacking & upgrades)
      const perks = getRandomPerks(3, perkStacks);
      setDraftPerks(perks);
      setGameState('WAVE_DRAFT');
    },
    [profile, perkStacks]
  );

  const handleGameOverCallback = useCallback(
    (summary: {
      wavesSurvived: number;
      totalKills: number;
      bioCreditsEarned: number;
      score: number;
    }) => {
      // Update persistent profile in localStorage
      const updatedProfile = addCredits(summary.bioCreditsEarned);
      updatedProfile.totalZombiesKilled += summary.totalKills;
      updatedProfile.totalSortiesCompleted += 1;
      if (summary.wavesSurvived > updatedProfile.highestWaveSurvied) {
        updatedProfile.highestWaveSurvied = summary.wavesSurvived;
      }
      saveProfile(updatedProfile);
      setProfile(updatedProfile);

      setGameOverSummary(summary);
      setGameState('GAME_OVER');
    },
    []
  );

  // Initialize or start sortie
  const startSortie = useCallback(() => {
    const stats = createInitialRunStats(profile);
    setInRunStats(stats);

    // Auto turrets are unlocked at the beginning: pre-equip 2 starter defensive turrets!
    const starterTurrets: PlacedTurret[] = [
      {
        socket: 'north',
        type: 'vulcan',
        level: 1,
        lastFired: 0,
        targetAngle: -Math.PI / 2,
        totalKills: 0,
      },
      {
        socket: 'south',
        type: 'vulcan',
        level: 1,
        lastFired: 0,
        targetAngle: Math.PI / 2,
        totalKills: 0,
      },
    ];
    setPlacedTurrets(starterTurrets);
    setPerkStacks({});

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!engineRef.current) {
      engineRef.current = new GameEngine(
        canvas,
        stats,
        profile.unlockedWeapons,
        starterTurrets,
        {
          onHudUpdate: (data) => setHudData(data),
          onWaveComplete: handleWaveComplete,
          onGameOver: handleGameOverCallback,
        }
      );
    } else {
      engineRef.current.updateStatsAndTurrets(stats, starterTurrets, profile.unlockedWeapons);
    }

    const shieldBonus = (profile.unlockedTech['perimeter_shield'] || 0) * 250;
    engineRef.current.setShield(shieldBonus);

    setGameState('PLAYING');
    engineRef.current.startSortie();
  }, [profile, handleWaveComplete, handleGameOverCallback]);

  // Draft: Select Perk (stacks/upgrades)
  const handleSelectPerk = (perk: PerkDef) => {
    const nextRank = (perkStacks[perk.id] || 0) + 1;
    perk.apply(inRunStats, nextRank);
    setPerkStacks((prev) => ({
      ...prev,
      [perk.id]: nextRank,
    }));

    if (engineRef.current) {
      engineRef.current.updateStatsAndTurrets(inRunStats, placedTurrets, profile.unlockedWeapons);
    }
  };

  // Draft: Build Turret on Socket
  const handleBuildTurret = (socket: TurretSocketId, type: TurretTypeId, cost: number) => {
    if (hudData.bioCreditsEarned < cost) return;

    if (engineRef.current) {
      engineRef.current.deductCredits(cost);
    }

    setHudData((prev) => ({
      ...prev,
      bioCreditsEarned: prev.bioCreditsEarned - cost,
    }));

    const newTurrets: PlacedTurret[] = [
      ...placedTurrets.filter((t) => t.socket !== socket),
      {
        socket,
        type,
        level: 1,
        lastFired: 0,
        targetAngle: 0,
        totalKills: 0,
      },
    ];

    setPlacedTurrets(newTurrets);

    if (engineRef.current) {
      engineRef.current.updateStatsAndTurrets(inRunStats, newTurrets, profile.unlockedWeapons);
    }
  };

  // Draft: Upgrade Turret
  const handleUpgradeTurret = (socket: TurretSocketId, cost: number) => {
    if (hudData.bioCreditsEarned < cost) return;

    if (engineRef.current) {
      engineRef.current.deductCredits(cost);
    }

    setHudData((prev) => ({
      ...prev,
      bioCreditsEarned: prev.bioCreditsEarned - cost,
    }));

    const newTurrets = placedTurrets.map((t) =>
      t.socket === socket ? { ...t, level: t.level + 1 } : t
    );

    setPlacedTurrets(newTurrets);

    if (engineRef.current) {
      engineRef.current.updateStatsAndTurrets(inRunStats, newTurrets, profile.unlockedWeapons);
    }
  };

  // Draft: Dismantle / Sell Turret (60% refund)
  const handleSellTurret = (socket: TurretSocketId, refund: number) => {
    if (engineRef.current) {
      engineRef.current.addCredits(refund);
    }

    setHudData((prev) => ({
      ...prev,
      bioCreditsEarned: prev.bioCreditsEarned + refund,
    }));

    const newTurrets = placedTurrets.filter((t) => t.socket !== socket);
    setPlacedTurrets(newTurrets);

    if (engineRef.current) {
      engineRef.current.updateStatsAndTurrets(inRunStats, newTurrets, profile.unlockedWeapons);
    }
  };

  // Draft: Repair Bunker
  const handleRepairBunker = (cost: number, healAmount: number) => {
    if (hudData.bioCreditsEarned < cost) return;

    if (engineRef.current) {
      engineRef.current.deductCredits(cost);
    }

    setHudData((prev) => ({
      ...prev,
      bioCreditsEarned: prev.bioCreditsEarned - cost,
      bunkerHp: Math.min(prev.bunkerMaxHp, prev.bunkerHp + healAmount),
    }));

    inRunStats.bunkerCurrentHp = Math.min(
      inRunStats.bunkerMaxHp,
      inRunStats.bunkerCurrentHp + healAmount
    );

    if (engineRef.current) {
      engineRef.current.updateStatsAndTurrets(inRunStats, placedTurrets, profile.unlockedWeapons);
    }
  };

  // Draft: Deploy next wave
  const handleStartNextWave = () => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.startNextWave(hudData.wave + 1);
    }
  };

  // Tech Tree: Purchase upgrade
  const handleUpgradeNode = (node: TechNode, cost: number, weaponUnlock?: WeaponId) => {
    const updated = unlockTechNode(node.id, cost, weaponUnlock);
    setProfile(updated);
  };

  // Tech Tree: Respec
  const handleResetTech = () => {
    const updated = resetProfileTech();
    setProfile(updated);
  };

  // Pause / Resume keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          e.preventDefault();
          engineRef.current?.pause();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          e.preventDefault();
          engineRef.current?.resume();
          setGameState('PLAYING');
        } else if (gameState === 'TECH_TREE') {
          e.preventDefault();
          setGameState('TITLE_MENU');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] flex items-center justify-center font-sans">
      {/* 1. Underlying 60 FPS HTML5 Canvas (Mounts once, remains isolated) */}
      <div className="absolute inset-0 z-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
        />
      </div>

      {/* 2. Title Screen View */}
      {gameState === 'TITLE_MENU' && (
        <div className="absolute inset-0 z-30">
          <TitleScreen
            profile={profile}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onStartGame={startSortie}
            onOpenTechTree={() => {
              soundEngine.playClick();
              setGameState('TECH_TREE');
            }}
          />
        </div>
      )}

      {/* 3. Tech Tree Operations HQ View */}
      {gameState === 'TECH_TREE' && (
        <div className="absolute inset-0 z-30">
          <TechTreeView
            profile={profile}
            onUpgradeNode={handleUpgradeNode}
            onResetTech={handleResetTech}
            onBack={() => setGameState('TITLE_MENU')}
          />
        </div>
      )}

      {/* 4. Active In-Game Heads-Up Display (HUD) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <InGameHUD
          bunkerHp={hudData.bunkerHp}
          bunkerMaxHp={hudData.bunkerMaxHp}
          bunkerShield={hudData.bunkerShield}
          wave={hudData.wave}
          waveKills={hudData.waveKills}
          waveTotal={hudData.waveTotal}
          totalKills={hudData.totalKills}
          bioCreditsEarned={hudData.bioCreditsEarned}
          currentWeapon={hudData.currentWeapon}
          unlockedWeapons={profile.unlockedWeapons}
          empReady={hudData.empReady}
          empCooldownRatio={hudData.empCooldownRatio}
          isMuted={isMuted}
          onSelectWeapon={(wId) => engineRef.current?.selectWeapon(wId)}
          onTriggerEmp={() => engineRef.current?.triggerEmpShockwave()}
          onPause={() => {
            engineRef.current?.pause();
            setGameState('PAUSED');
          }}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 5. Between-Wave Tactical Supply Drop Modal */}
      {gameState === 'WAVE_DRAFT' && (
        <WaveDraftModal
          wave={hudData.wave}
          perks={draftPerks}
          placedTurrets={placedTurrets}
          unlockedSockets={unlockedSockets}
          unlockedTurretTypes={unlockedTurretTypes}
          bunkerHp={hudData.bunkerHp}
          bunkerMaxHp={hudData.bunkerMaxHp}
          bioCredits={hudData.bioCreditsEarned}
          onSelectPerk={handleSelectPerk}
          onBuildTurret={handleBuildTurret}
          onUpgradeTurret={handleUpgradeTurret}
          onSellTurret={handleSellTurret}
          onRepairBunker={handleRepairBunker}
          onStartNextWave={handleStartNextWave}
        />
      )}

      {/* 6. Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          isMuted={isMuted}
          onResume={() => {
            engineRef.current?.resume();
            setGameState('PLAYING');
          }}
          onRestart={() => {
            engineRef.current?.stop();
            startSortie();
          }}
          onExitToTitle={() => {
            engineRef.current?.stop();
            setGameState('TITLE_MENU');
          }}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 7. Game Over Debriefing Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          wavesSurvived={gameOverSummary.wavesSurvived}
          totalKills={gameOverSummary.totalKills}
          bioCreditsEarned={gameOverSummary.bioCreditsEarned}
          score={gameOverSummary.score}
          onRestart={startSortie}
          onOpenTechTree={() => setGameState('TECH_TREE')}
        />
      )}
    </div>
  );
}
