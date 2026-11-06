/**
 * Core type definitions for Outpost Zero: Gun Stand Defense
 */

export type GameState =
  | 'TITLE_MENU'
  | 'TECH_TREE'
  | 'PLAYING'
  | 'WAVE_DRAFT'
  | 'PAUSED'
  | 'GAME_OVER';

export type WeaponId = 'gatling' | 'shotgun' | 'railgun' | 'rockets' | 'plasma';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // rounds per second
  burstCount: number;
  spread: number; // in radians
  projectileSpeed: number;
  projectileRadius: number;
  pierce: number;
  screenShake: number;
  color: string;
  muzzleColor: string;
  description: string;
  unlockedByDefault: boolean;
  requiredTechId?: string;
  iconName: string;
}

export type TurretSocketId =
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest';

export type TurretTypeId =
  | 'vulcan'
  | 'flamethrower'
  | 'tesla'
  | 'cryo'
  | 'mortar'
  | 'laser'
  | 'missile';

export interface TurretDef {
  type: TurretTypeId;
  name: string;
  description: string;
  cost: number;
  range: number;
  fireRate: number;
  damage: number;
  color: string;
  iconName: string;
}

export interface PlacedTurret {
  socket: TurretSocketId;
  type: TurretTypeId;
  level: number;
  lastFired: number;
  targetAngle: number;
  totalKills: number;
}

export type EnemyType =
  | 'walker'
  | 'runner'
  | 'spitter'
  | 'brute'
  | 'bloater'
  | 'boss';

export interface EnemyDef {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  attackInterval: number; // seconds
  radius: number;
  color: string;
  bloodColor: string;
  credits: number;
  score: number;
}

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackInterval: number;
  lastAttackTime: number;
  radius: number;
  color: string;
  bloodColor: string;
  credits: number;
  score: number;
  frozenTimer: number; // cryo slow
  isBoss?: boolean;
  rangedCooldown?: number;
  wobbleOffset: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  pierceRemaining: number;
  color: string;
  glowColor: string;
  source: 'player' | 'turret' | 'enemy';
  weaponId?: WeaponId;
  turretType?: TurretTypeId;
  explosiveRadius?: number;
  slowEffect?: number;
  lifeTime: number;
  isArc?: boolean;
  isHoming?: boolean;
  homingSpeed?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  isSpark?: boolean;
  isSmoke?: boolean;
  isCasing?: boolean;
  angle?: number;
  angularVelocity?: number;
}

export interface BloodDecal {
  x: number;
  y: number;
  radius: number;
  color: string;
  splatterPoints: { dx: number; dy: number; r: number }[];
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  fontSize: number;
}

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
}

export type PerkRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PerkDef {
  id: string;
  name: string;
  tagline: string;
  rarity: PerkRarity;
  description: string;
  iconName: string;
  apply: (runStats: InRunStats, rank: number) => void;
  maxRank?: number;
  currentRank?: number;
  nextRank?: number;
}

export interface InRunStats {
  damageMult: number;
  fireRateMult: number;
  reloadMult: number;
  bunkerMaxHpBonus: number;
  bunkerCurrentHp: number;
  bunkerMaxHp: number;
  armorReduction: number;
  critChance: number;
  critMultiplier: number;
  explosiveRounds: boolean;
  explosiveRadius: number;
  explosiveDamageBonus: number;
  pierceBonus: number;
  vampiricChance: number;
  bouncingShrapnel: boolean;
  shrapnelCount: number;
  electricDischarge: boolean;
  chainLightningTargets: number;
  chainLightningDamage: number;
  cryoSlowMult: number;
  creditsMultiplier: number;
  empCooldownSec: number;
  lastEmpUsedTime: number;
  unlockedSockets: TurretSocketId[];
  splitShots: number; // 0 = standard, 1 = 3-way, 2 = 5-way, 3 = 7-way
  teslaArc: boolean; // main gun chain lightning jumps
  incendiaryRounds: boolean; // burning napalm patches on bullet impacts
  napalmBurnDamageBonus: number;
  napalmRadiusBonus: number;
  quadBarrels: boolean; // cyclic receiver multiplier
  extraProjectilesPerShot: number;
  droneEscorts: number; // orbital companion drones
  turretDamageMult: number;
  turretFireRateMult: number;
}

export type TechBranch = 'bunker' | 'ballistics' | 'automation' | 'logistics';

export interface TechNode {
  id: string;
  branch: TechBranch;
  name: string;
  description: string;
  iconName: string;
  maxLevel: number;
  baseCost: number;
  costScale: number;
  currentLevel: number;
  effectDescription: (level: number) => string;
}

export interface PersistentProfile {
  bioCredits: number;
  totalZombiesKilled: number;
  highestWaveSurvied: number;
  totalSortiesCompleted: number;
  unlockedTech: Record<string, number>;
  unlockedWeapons: WeaponId[];
  soundEnabled: boolean;
  soundVolume: number;
}

export interface WaveInfo {
  waveNumber: number;
  totalEnemies: number;
  spawnedCount: number;
  killedCount: number;
  spawnInterval: number;
  isBossWave: boolean;
  active: boolean;
}
