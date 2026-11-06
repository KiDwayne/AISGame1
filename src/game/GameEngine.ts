import { soundEngine } from '../services/audio';
import { TURRET_REGISTRY, WEAPON_REGISTRY } from '../services/arsenalData';
import {
  BloodDecal,
  EnemyDef,
  EnemyEntity,
  EnemyType,
  FloatingText,
  InRunStats,
  Particle,
  PlacedTurret,
  Projectile,
  TurretSocketId,
  TurretTypeId,
  WeaponId,
} from '../types/game';

const ENEMY_BASE_DEFS: Record<EnemyType, EnemyDef> = {
  walker: {
    type: 'walker',
    name: 'Infected Walker',
    hp: 65,
    speed: 88,
    damage: 16,
    attackInterval: 0.70,
    radius: 13,
    color: '#65a30d',
    bloodColor: '#166534',
    credits: 1,
    score: 8,
  },
  runner: {
    type: 'runner',
    name: 'Sprint Crawler',
    hp: 42,
    speed: 168,
    damage: 15,
    attackInterval: 0.45,
    radius: 11,
    color: '#ca8a04',
    bloodColor: '#854d0e',
    credits: 1,
    score: 10,
  },
  spitter: {
    type: 'spitter',
    name: 'Acid Spitter',
    hp: 80,
    speed: 82,
    damage: 26,
    attackInterval: 1.15,
    radius: 14,
    color: '#06b6d4',
    bloodColor: '#0e7490',
    credits: 2,
    score: 20,
  },
  brute: {
    type: 'brute',
    name: 'Armored Crusher',
    hp: 420,
    speed: 66,
    damage: 58,
    attackInterval: 0.85,
    radius: 23,
    color: '#991b1b',
    bloodColor: '#450a0a',
    credits: 5,
    score: 50,
  },
  bloater: {
    type: 'bloater',
    name: 'Toxic Bloater',
    hp: 160,
    speed: 78,
    damage: 65,
    attackInterval: 0.80,
    radius: 19,
    color: '#a855f7',
    bloodColor: '#581c87',
    credits: 3,
    score: 30,
  },
  boss: {
    type: 'boss',
    name: 'Mutation Goliath',
    hp: 7500,
    speed: 52,
    damage: 135,
    attackInterval: 0.95,
    radius: 42,
    color: '#b91c1c',
    bloodColor: '#450a0a',
    credits: 30,
    score: 400,
  },
};

export interface GameEngineCallbacks {
  onHudUpdate: (data: {
    bunkerHp: number;
    bunkerMaxHp: number;
    bunkerShield: number;
    wave: number;
    waveKills: number;
    waveTotal: number;
    totalKills: number;
    bioCreditsEarned: number;
    currentWeapon: WeaponId;
    empReady: boolean;
    empCooldownRatio: number;
  }) => void;
  onWaveComplete: (wave: number) => void;
  onGameOver: (summary: {
    wavesSurvived: number;
    totalKills: number;
    bioCreditsEarned: number;
    score: number;
  }) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bloodCanvas: HTMLCanvasElement;
  private bloodCtx: CanvasRenderingContext2D;

  private width: number = 1200;
  private height: number = 800;
  private centerX: number = 600;
  private centerY: number = 400;
  private bunkerRadius: number = 55;

  // Running state
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private hitstopTimer: number = 0;

  // Camera shake
  private screenShake: number = 0;

  // Entities
  private enemies: EnemyEntity[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private bloodDecals: BloodDecal[] = [];
  private placedTurrets: PlacedTurret[] = [];

  // Wave & Spawning
  private currentWave: number = 1;
  private waveTotalEnemies: number = 15;
  private waveSpawnedCount: number = 0;
  private waveKilledCount: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1.0;
  private waveInProgress: boolean = false;

  // Player & Bunker
  private currentWeapon: WeaponId = 'gatling';
  private unlockedWeapons: WeaponId[] = ['gatling'];
  private mouseX: number = 600;
  private mouseY: number = 200;
  private isFiring: boolean = false;
  private lastShotTime: number = 0;
  private currentAimAngle: number = -Math.PI / 2;

  // In-run Stats & Modifiers
  private runStats: InRunStats;
  private bunkerShield: number = 0;
  private maxBunkerShield: number = 0;

  // Progression Counters
  private sessionBioCredits: number = 0;
  private sessionKills: number = 0;
  private sessionScore: number = 0;

  // Callbacks
  private callbacks: GameEngineCallbacks;

  // Throttled HUD update
  private lastHudUpdateTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    initialStats: InRunStats,
    unlockedWeapons: WeaponId[],
    placedTurrets: PlacedTurret[],
    callbacks: GameEngineCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.runStats = initialStats;
    this.unlockedWeapons = unlockedWeapons;
    this.placedTurrets = placedTurrets;
    this.callbacks = callbacks;

    // Create offscreen buffer for persistent blood splatters
    this.bloodCanvas = document.createElement('canvas');
    this.bloodCtx = this.bloodCanvas.getContext('2d')!;

    this.handleResize();
    this.setupListeners();
  }

  public handleResize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      this.width = rect.width;
      this.height = rect.height;
    } else {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    }

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.bloodCanvas.width = this.width;
    this.bloodCanvas.height = this.height;

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }

  private setupListeners() {
    window.addEventListener('resize', () => this.handleResize());

    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.currentAimAngle = Math.atan2(this.mouseY - this.centerY, this.mouseX - this.centerX);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isFiring = true;
        soundEngine.init();
        soundEngine.resume();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isFiring = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1' && this.unlockedWeapons.includes('gatling')) {
        this.selectWeapon('gatling');
      } else if (e.key === '2' && this.unlockedWeapons.includes('shotgun')) {
        this.selectWeapon('shotgun');
      } else if (e.key === '3' && this.unlockedWeapons.includes('railgun')) {
        this.selectWeapon('railgun');
      } else if (e.key === '4' && this.unlockedWeapons.includes('rockets')) {
        this.selectWeapon('rockets');
      } else if (e.key === '5' && this.unlockedWeapons.includes('plasma')) {
        this.selectWeapon('plasma');
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.triggerEmpShockwave();
      }
    };

    this.canvas.addEventListener('mousemove', handleMouseMove);
    this.canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
  }

  public selectWeapon(weaponId: WeaponId) {
    if (this.unlockedWeapons.includes(weaponId)) {
      this.currentWeapon = weaponId;
      soundEngine.playClick();
    }
  }

  public updateStatsAndTurrets(
    stats: InRunStats,
    turrets: PlacedTurret[],
    unlockedWeapons: WeaponId[]
  ) {
    this.runStats = stats;
    this.placedTurrets = turrets;
    this.unlockedWeapons = unlockedWeapons;
  }

  public startSortie() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.currentWave = 1;
    this.sessionBioCredits = 0;
    this.sessionKills = 0;
    this.sessionScore = 0;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bloodDecals = [];

    // Clear blood buffer
    this.bloodCtx.clearRect(0, 0, this.width, this.height);

    this.setupWave(1);
    this.loop(performance.now());
  }

  public startNextWave(wave: number) {
    this.currentWave = wave;
    this.setupWave(wave);
    soundEngine.playWaveHorn();
  }

  // Additional combat systems
  private droneOrbitAngle: number = 0;
  private lastDroneFireTime: number = 0;
  private napalmPools: { x: number; y: number; radius: number; life: number; damage: number }[] = [];

  private setupWave(waveNumber: number) {
    this.currentWave = waveNumber;
    this.waveInProgress = true;
    this.waveSpawnedCount = 0;
    this.waveKilledCount = 0;

    // Wave 1 serves as introductory horde, Wave 2+ escalates rapidly into massive hordes
    const isBoss = waveNumber % 5 === 0;
    if (waveNumber === 1) {
      this.waveTotalEnemies = 65;
      this.spawnInterval = 0.22;
    } else {
      // Exploding horde size starting after 1st wave
      this.waveTotalEnemies = 140 + (waveNumber - 2) * 100 + (isBoss ? 110 : 0);
      this.spawnInterval = Math.max(0.03, 0.16 - waveNumber * 0.018);
    }
    this.spawnTimer = 0;

    // Refresh energy shield if unlocked
    if (this.maxBunkerShield > 0) {
      this.bunkerShield = this.maxBunkerShield;
    }
  }

  public deductCredits(amount: number) {
    this.sessionBioCredits = Math.max(0, this.sessionBioCredits - amount);
  }

  public addCredits(amount: number) {
    this.sessionBioCredits += amount;
  }

  public setShield(amount: number) {
    this.maxBunkerShield = amount;
    this.bunkerShield = amount;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTimestamp = performance.now();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundEngine.stopAlarm();
  }

  // --- MAIN LOOP ---
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Delta time clamping
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // --- UPDATE SIMULATION ---
  private update(dt: number) {
    const now = performance.now() / 1000;

    // 1. Screen Shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    // 2. Nanite Auto-Repair
    if (this.runStats.bunkerCurrentHp < this.runStats.bunkerMaxHp) {
      // 3 HP per sec base if nanite unlocked
      const naniteLevel = this.runStats.armorReduction > 0 ? 3 : 1;
      this.runStats.bunkerCurrentHp = Math.min(
        this.runStats.bunkerMaxHp,
        this.runStats.bunkerCurrentHp + naniteLevel * dt
      );
    }

    // Alarm management
    if (this.runStats.bunkerCurrentHp / this.runStats.bunkerMaxHp < 0.25) {
      soundEngine.startAlarm();
    } else {
      soundEngine.stopAlarm();
    }

    // 3. Player Turret Firing
    if (this.isFiring) {
      const weaponDef = WEAPON_REGISTRY[this.currentWeapon] || WEAPON_REGISTRY.gatling;
      const effectiveFireRate = weaponDef.fireRate * this.runStats.fireRateMult;
      const interval = 1 / effectiveFireRate;

      if (now - this.lastShotTime >= interval) {
        this.firePlayerWeapon(weaponDef, now);
        this.lastShotTime = now;
      }
    }

    // 4. Side Turrets AI Targeting & Firing
    this.updateSideTurrets(dt, now);

    // 4b. Orbital Combat Drones Support
    this.updateOrbitalDrones(dt, now);

    // 4c. Napalm Ground Pools
    this.updateNapalmPools(dt);

    // 5. Enemy Spawning (Rapid pack clusters for huge hoards)
    if (this.waveInProgress && this.waveSpawnedCount < this.waveTotalEnemies) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const packSize = Math.min(
          this.waveTotalEnemies - this.waveSpawnedCount,
          Math.floor((this.currentWave === 1 ? 2 : 4) + Math.random() * (this.currentWave >= 3 ? 5 : 3))
        );
        const clusterAngle = Math.random() * Math.PI * 2;
        for (let p = 0; p < packSize; p++) {
          this.spawnEnemy(clusterAngle + (Math.random() - 0.5) * 0.45);
        }
      }
    }

    // 6. Update Enemies
    this.updateEnemies(dt, now);

    // 7. Update Projectiles & Collisions
    this.updateProjectiles(dt);

    // 8. Update Particles
    this.updateParticles(dt);

    // 9. Update Floating Combat Text
    this.updateFloatingTexts(dt);

    // 10. Check Wave Completion
    if (
      this.waveInProgress &&
      this.waveSpawnedCount >= this.waveTotalEnemies &&
      this.enemies.length === 0
    ) {
      this.waveInProgress = false;
      this.callbacks.onWaveComplete(this.currentWave);
    }

    // 11. Check Bunker Death
    if (this.runStats.bunkerCurrentHp <= 0) {
      this.handleGameOver();
      return;
    }

    // 12. Throttle React HUD updates (every ~100ms)
    if (now - this.lastHudUpdateTime > 0.1) {
      this.lastHudUpdateTime = now;
      const empElapsed = now - this.runStats.lastEmpUsedTime;
      const empRatio = Math.min(1, empElapsed / this.runStats.empCooldownSec);

      this.callbacks.onHudUpdate({
        bunkerHp: Math.ceil(this.runStats.bunkerCurrentHp),
        bunkerMaxHp: Math.ceil(this.runStats.bunkerMaxHp),
        bunkerShield: Math.ceil(this.bunkerShield),
        wave: this.currentWave,
        waveKills: this.waveKilledCount,
        waveTotal: this.waveTotalEnemies,
        totalKills: this.sessionKills,
        bioCreditsEarned: this.sessionBioCredits,
        currentWeapon: this.currentWeapon,
        empReady: empRatio >= 1,
        empCooldownRatio: empRatio,
      });
    }
  }

  // --- WEAPON SHOOTING LOGIC ---
  private firePlayerWeapon(def: typeof WEAPON_REGISTRY.gatling, now: number) {
    soundEngine.playWeaponFire(def.id);
    this.screenShake = Math.max(this.screenShake, def.screenShake);

    // Calculate barrel end position
    const barrelLength = 46;
    const spawnX = this.centerX + Math.cos(this.currentAimAngle) * barrelLength;
    const spawnY = this.centerY + Math.sin(this.currentAimAngle) * barrelLength;

    // Muzzle flash particle
    this.createMuzzleFlash(spawnX, spawnY, this.currentAimAngle, def.muzzleColor);

    // Eject shell casing backward-right
    this.createShellCasing(this.centerX, this.centerY, this.currentAimAngle);

    const extraBurst = this.runStats.extraProjectilesPerShot || 0;
    const baseBurst = def.burstCount * (this.runStats.quadBarrels ? 2 : 1) + extraBurst;

    // Calculate split shot fan angles based on rank
    let fanAngles = [0];
    if (this.runStats.splitShots === 1) {
      fanAngles = [-0.14, 0, 0.14]; // 3-way split
    } else if (this.runStats.splitShots === 2) {
      fanAngles = [-0.26, -0.13, 0, 0.13, 0.26]; // 5-way split
    } else if (this.runStats.splitShots === 3) {
      fanAngles = [-0.36, -0.24, -0.12, 0, 0.12, 0.24, 0.36]; // 7-way split
    } else if (this.runStats.splitShots >= 4) {
      fanAngles = [-0.44, -0.33, -0.22, -0.11, 0, 0.11, 0.22, 0.33, 0.44]; // 9-way split
    }

    for (const fanOffset of fanAngles) {
      for (let i = 0; i < baseBurst; i++) {
        const spread = (Math.random() - 0.5) * def.spread;
        const angle = this.currentAimAngle + fanOffset + spread;
        const vx = Math.cos(angle) * def.projectileSpeed;
        const vy = Math.sin(angle) * def.projectileSpeed;

        // Base damage with in-run multipliers
        let damage = def.damage * this.runStats.damageMult;
        const isCrit = Math.random() < this.runStats.critChance;
        if (isCrit) {
          damage *= this.runStats.critMultiplier;
        }

        this.projectiles.push({
          id: Math.random(),
          x: spawnX,
          y: spawnY,
          vx,
          vy,
          damage,
          radius: def.projectileRadius,
          pierceRemaining: def.pierce + this.runStats.pierceBonus,
          color: isCrit ? '#f43f5e' : def.color,
          glowColor: def.muzzleColor,
          source: 'player',
          weaponId: def.id,
          explosiveRadius:
            def.id === 'rockets'
              ? 70
              : this.runStats.explosiveRounds
              ? this.runStats.explosiveRadius
              : 0,
          slowEffect: this.runStats.cryoSlowMult,
          lifeTime: 2.5,
        });
      }
    }
  }

  // --- AUTOMATED SIDE TURRETS ---
  private updateSideTurrets(dt: number, now: number) {
    if (this.placedTurrets.length === 0 || this.enemies.length === 0) return;

    for (const turret of this.placedTurrets) {
      const socketPos = this.getSocketPosition(turret.socket);
      const def = TURRET_REGISTRY[turret.type];
      if (!def) continue;

      // Find closest enemy within range
      let closestEnemy: EnemyEntity | null = null;
      let closestDistSq = def.range * def.range;

      for (const enemy of this.enemies) {
        const dx = enemy.x - socketPos.x;
        const dy = enemy.y - socketPos.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestEnemy = enemy;
        }
      }

      if (closestEnemy) {
        // Aim toward enemy
        const targetAngle = Math.atan2(closestEnemy.y - socketPos.y, closestEnemy.x - socketPos.x);
        turret.targetAngle = targetAngle;

        // Firing check with stacked fire rate multiplier
        const effectiveFireRate = def.fireRate * (this.runStats.turretFireRateMult || 1.0);
        const interval = 1 / effectiveFireRate;
        if (now - turret.lastFired >= interval) {
          turret.lastFired = now;
          this.fireSideTurret(turret, def, socketPos, closestEnemy);
        }
      }
    }
  }

  private fireSideTurret(
    turret: PlacedTurret,
    def: typeof TURRET_REGISTRY.vulcan,
    pos: { x: number; y: number },
    target: EnemyEntity
  ) {
    soundEngine.playTurretFire(turret.type);

    const muzzleX = pos.x + Math.cos(turret.targetAngle) * 22;
    const muzzleY = pos.y + Math.sin(turret.targetAngle) * 22;

    this.createMuzzleFlash(muzzleX, muzzleY, turret.targetAngle, def.color);

    const turretDmgMult = this.runStats.turretDamageMult || 1.0;
    const baseDamage = def.damage * (1 + (turret.level - 1) * 0.25) * turretDmgMult;

    if (turret.type === 'vulcan') {
      const speed = 880;
      this.projectiles.push({
        id: Math.random(),
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(turret.targetAngle) * speed,
        vy: Math.sin(turret.targetAngle) * speed,
        damage: baseDamage,
        radius: 3,
        pierceRemaining: 1,
        color: def.color,
        glowColor: '#fef08a',
        source: 'turret',
        turretType: 'vulcan',
        lifeTime: 1.5,
      });
    } else if (turret.type === 'tesla') {
      // Instant chain lightning
      this.executeTeslaArc(pos, target, baseDamage * 1.2);
    } else if (turret.type === 'cryo') {
      // Frost spray particles & freeze cone
      const coneAngle = 0.45;
      for (const e of this.enemies) {
        const dx = e.x - pos.x;
        const dy = e.y - pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= def.range) {
          const angleToEnemy = Math.atan2(dy, dx);
          let angleDiff = Math.abs(angleToEnemy - turret.targetAngle);
          while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

          if (angleDiff <= coneAngle) {
            e.hp -= baseDamage;
            e.frozenTimer = 3.5;
            this.createSparks(e.x, e.y, '#38bdf8', 3);
          }
        }
      }
    } else if (turret.type === 'flamethrower') {
      // Continuous napalm cone
      const coneAngle = 0.5;
      for (const e of this.enemies) {
        const dx = e.x - pos.x;
        const dy = e.y - pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= def.range) {
          const angleToEnemy = Math.atan2(dy, dx);
          let angleDiff = Math.abs(angleToEnemy - turret.targetAngle);
          while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

          if (angleDiff <= coneAngle) {
            e.hp -= baseDamage;
            this.createSparks(e.x, e.y, '#f97316', 3);
          }
        }
      }
      // Visual flame puff particles
      for (let f = 0; f < 3; f++) {
        const fAngle = turret.targetAngle + (Math.random() - 0.5) * 0.35;
        const fSpeed = 160 + Math.random() * 80;
        this.particles.push({
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(fAngle) * fSpeed,
          vy: Math.sin(fAngle) * fSpeed,
          radius: 4 + Math.random() * 5,
          color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
          alpha: 0.9,
          decay: 2.8,
          isSmoke: false,
        });
      }
    } else if (turret.type === 'laser') {
      // Optical coherent red beam
      target.hp -= baseDamage;
      this.createLightningSegment(muzzleX, muzzleY, target.x, target.y);
      this.createSparks(target.x, target.y, '#ef4444', 3);
    } else if (turret.type === 'missile') {
      // Fires heat-seeking micro-missiles that curve and hunt down zombies
      for (let m = -1; m <= 1; m += 2) {
        const mAngle = turret.targetAngle + m * 0.28;
        const speed = 480;
        this.projectiles.push({
          id: Math.random(),
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(mAngle) * speed,
          vy: Math.sin(mAngle) * speed,
          damage: baseDamage,
          radius: 4,
          pierceRemaining: 1,
          color: '#f43f5e',
          glowColor: '#fda4af',
          source: 'turret',
          turretType: 'missile',
          explosiveRadius: 55,
          isHoming: true,
          homingSpeed: speed,
          lifeTime: 3.0,
        });
      }
    } else if (turret.type === 'mortar') {
      // Mortar shell lobbed at target location
      const targetX = target.x;
      const targetY = target.y;
      setTimeout(() => {
        if (!this.isRunning) return;
        soundEngine.playExplosion(true);
        this.triggerExplosion(targetX, targetY, 95, baseDamage, '#ea580c');
      }, 700);
    }
  }

  private executeTeslaArc(pos: { x: number; y: number }, initialTarget: EnemyEntity, damage: number) {
    let currentX = pos.x;
    let currentY = pos.y;
    const hitEnemies: EnemyEntity[] = [initialTarget];
    const initialDamage = initialTarget.isBoss ? damage * 0.75 : damage;
    initialTarget.hp -= initialDamage;
    this.createSparks(initialTarget.x, initialTarget.y, '#38bdf8', 6);

    const jumpCount = this.runStats.chainLightningTargets || 4;
    const bonusArcDmg = this.runStats.chainLightningDamage || 45;

    // Jump to additional nearby enemies based on upgrade rank
    let lastEnemy = initialTarget;
    for (let jump = 0; jump < jumpCount; jump++) {
      let nextTarget: EnemyEntity | null = null;
      let minDistSq = 190 * 190;

      for (const candidate of this.enemies) {
        if (hitEnemies.includes(candidate)) continue;
        const dx = candidate.x - lastEnemy.x;
        const dy = candidate.y - lastEnemy.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          nextTarget = candidate;
        }
      }

      if (nextTarget) {
        hitEnemies.push(nextTarget);
        const jumpDmg = nextTarget.isBoss
          ? (damage * 0.7 + bonusArcDmg * 0.4) * 0.75
          : damage * 0.7 + bonusArcDmg * 0.4;
        nextTarget.hp -= jumpDmg;
        this.createSparks(nextTarget.x, nextTarget.y, '#38bdf8', 4);
        lastEnemy = nextTarget;
      } else {
        break;
      }
    }

    // Draw visual lightning bolt particles
    hitEnemies.forEach((e) => {
      this.createLightningSegment(currentX, currentY, e.x, e.y);
      currentX = e.x;
      currentY = e.y;
    });
  }

  // --- 8-SOCKET DEFENSE HARDPOINTS ---
  public getSocketPosition(socket: TurretSocketId): { x: number; y: number } {
    const dist = this.bunkerRadius + 26;
    const diag = dist * 0.7071;
    switch (socket) {
      case 'north':
        return { x: this.centerX, y: this.centerY - dist };
      case 'northeast':
        return { x: this.centerX + diag, y: this.centerY - diag };
      case 'east':
        return { x: this.centerX + dist, y: this.centerY };
      case 'southeast':
        return { x: this.centerX + diag, y: this.centerY + diag };
      case 'south':
        return { x: this.centerX, y: this.centerY + dist };
      case 'southwest':
        return { x: this.centerX - diag, y: this.centerY + diag };
      case 'west':
        return { x: this.centerX - dist, y: this.centerY };
      case 'northwest':
        return { x: this.centerX - diag, y: this.centerY - diag };
    }
  }

  // --- ORBITAL DRONES & NAPALM UPDATE ---
  private updateOrbitalDrones(dt: number, now: number) {
    if (!this.runStats.droneEscorts || this.runStats.droneEscorts <= 0) return;
    this.droneOrbitAngle += dt * 2.2;

    if (now - this.lastDroneFireTime > 0.35 && this.enemies.length > 0) {
      this.lastDroneFireTime = now;
      for (let i = 0; i < this.runStats.droneEscorts; i++) {
        const droneAngle = this.droneOrbitAngle + (i * Math.PI * 2) / this.runStats.droneEscorts;
        const droneX = this.centerX + Math.cos(droneAngle) * 115;
        const droneY = this.centerY + Math.sin(droneAngle) * 115;

        // Find nearest hostile
        let target: EnemyEntity | null = null;
        let minDistSq = 260 * 260;
        for (const e of this.enemies) {
          const distSq = (e.x - droneX) * (e.x - droneX) + (e.y - droneY) * (e.y - droneY);
          if (distSq < minDistSq) {
            minDistSq = distSq;
            target = e;
          }
        }

        if (target) {
          target.hp -= 26 * this.runStats.damageMult;
          this.createLightningSegment(droneX, droneY, target.x, target.y);
          this.createSparks(target.x, target.y, '#38bdf8', 2);
        }
      }
    }
  }

  private updateNapalmPools(dt: number) {
    for (let i = this.napalmPools.length - 1; i >= 0; i--) {
      const pool = this.napalmPools[i];
      pool.life -= dt;

      // Damage enemies standing in napalm
      for (const e of this.enemies) {
        const distSq = (e.x - pool.x) * (e.x - pool.x) + (e.y - pool.y) * (e.y - pool.y);
        if (distSq <= pool.radius * pool.radius) {
          e.hp -= pool.damage * dt;
        }
      }

      if (pool.life <= 0) {
        this.napalmPools.splice(i, 1);
      }
    }
  }

  // --- ENEMY SPAWNING & BEHAVIOR ---
  private spawnEnemy(clusterAngle?: number) {
    this.waveSpawnedCount++;

    // Pick type based on wave & probabilities
    let type: EnemyType = 'walker';
    const roll = Math.random();

    if (this.currentWave >= 5 && (this.waveSpawnedCount === 1 || this.waveSpawnedCount === Math.floor(this.waveTotalEnemies * 0.5))) {
      type = 'boss';
    } else if (this.currentWave >= 4 && roll < 0.16) {
      type = 'bloater';
    } else if (this.currentWave >= 3 && roll < 0.32) {
      type = 'spitter';
    } else if (this.currentWave >= 2 && roll < 0.50) {
      type = 'brute';
    } else if (roll < 0.80) {
      type = 'runner';
    } else {
      type = 'walker';
    }

    const baseDef = ENEMY_BASE_DEFS[type];

    // Spawn randomly around perimeter border (360 degrees) or grouped angle
    const angle = clusterAngle !== undefined ? clusterAngle : Math.random() * Math.PI * 2;
    const spawnDist = Math.max(this.width, this.height) / 2 + 60;
    const x = this.centerX + Math.cos(angle) * spawnDist;
    const y = this.centerY + Math.sin(angle) * spawnDist;

    // Compounding wave HP scale: makes enemy health bars noticeably longer and more durable every wave
    const hpScale = Math.pow(1.25, this.currentWave - 1) * (1 + (this.currentWave - 1) * 0.08);
    const maxHp = Math.round(baseDef.hp * hpScale);

    this.enemies.push({
      id: Math.random(),
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: angle + Math.PI,
      hp: maxHp,
      maxHp,
      speed: baseDef.speed * (0.9 + Math.random() * 0.2),
      damage: baseDef.damage,
      attackInterval: baseDef.attackInterval,
      lastAttackTime: 0,
      radius: baseDef.radius,
      color: baseDef.color,
      bloodColor: baseDef.bloodColor,
      credits: baseDef.credits,
      score: baseDef.score,
      frozenTimer: 0,
      isBoss: type === 'boss',
      rangedCooldown: 2.0,
      wobbleOffset: Math.random() * 10,
    });
  }

  private updateEnemies(dt: number, now: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Handle cryo frozen status
      let currentSpeed = e.speed;
      if (e.frozenTimer > 0) {
        e.frozenTimer -= dt;
        currentSpeed *= 0.45;
      }

      // Vector toward center bunker
      const dx = this.centerX - e.x;
      const dy = this.centerY - e.y;
      const distToBunker = Math.hypot(dx, dy);

      e.angle = Math.atan2(dy, dx);

      // Boss periodic seismic shockwave attack
      if (e.isBoss) {
        e.rangedCooldown = (e.rangedCooldown || 0) - dt;
        if (e.rangedCooldown <= 0 && distToBunker <= 560) {
          e.rangedCooldown = 3.6;
          this.fireBossSeismicWave(e);
        }
      }

      // Spitter ranged attack logic
      if (e.type === 'spitter' && distToBunker <= 270) {
        e.rangedCooldown = (e.rangedCooldown || 0) - dt;
        if (e.rangedCooldown <= 0) {
          e.rangedCooldown = e.attackInterval;
          this.fireAcidSpit(e);
        }
      } else {
        // Move toward bunker
        if (distToBunker > this.bunkerRadius + e.radius) {
          const moveSpeed = currentSpeed * dt;
          e.x += (dx / distToBunker) * moveSpeed;
          e.y += (dy / distToBunker) * moveSpeed;
        } else {
          // At bunker perimeter: Melee attack
          if (now - e.lastAttackTime >= e.attackInterval) {
            e.lastAttackTime = now;
            this.damageBunker(e.damage);

            // Retaliatory Barbed Wire shock
            if (this.runStats.armorReduction > 0) {
              e.hp -= 30;
              this.createSparks(e.x, e.y, '#38bdf8', 4);
            }
          }
        }
      }

      // Check death
      if (e.hp <= 0) {
        this.killEnemy(e, i);
      }
    }
  }

  private fireBossSeismicWave(boss: EnemyEntity) {
    soundEngine.playExplosion(false);
    this.screenShake = Math.max(this.screenShake, 5.0);
    const baseAngle = Math.atan2(this.centerY - boss.y, this.centerX - boss.x);
    for (const offset of [-0.22, 0, 0.22]) {
      const angle = baseAngle + offset;
      const speed = 230;
      this.projectiles.push({
        id: Math.random(),
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: 40,
        radius: 9,
        pierceRemaining: 1,
        color: '#ef4444',
        glowColor: '#fca5a5',
        source: 'enemy',
        lifeTime: 3.5,
      });
    }
  }

  private fireAcidSpit(spitter: EnemyEntity) {
    const angle = Math.atan2(this.centerY - spitter.y, this.centerX - spitter.x);
    const speed = 260;
    this.projectiles.push({
      id: Math.random(),
      x: spitter.x,
      y: spitter.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: spitter.damage,
      radius: 5,
      pierceRemaining: 1,
      color: '#22c55e',
      glowColor: '#86efac',
      source: 'enemy',
      lifeTime: 3.0,
    });
  }

  private damageBunker(amount: number) {
    soundEngine.playBunkerDamage();
    this.screenShake = Math.max(this.screenShake, 3.5);

    // Shield absorption first
    if (this.bunkerShield > 0) {
      if (this.bunkerShield >= amount) {
        this.bunkerShield -= amount;
        this.addFloatingText(`-${Math.round(amount)} SHIELD`, this.centerX, this.centerY - 40, '#38bdf8');
        return;
      } else {
        amount -= this.bunkerShield;
        this.bunkerShield = 0;
      }
    }

    // Direct hull damage
    const reducedAmount = amount * (1 - this.runStats.armorReduction);
    this.runStats.bunkerCurrentHp = Math.max(0, this.runStats.bunkerCurrentHp - reducedAmount);
    this.addFloatingText(`-${Math.round(reducedAmount)}`, this.centerX, this.centerY - 30, '#ef4444');
  }

  private killEnemy(e: EnemyEntity, index: number) {
    this.enemies.splice(index, 1);
    this.waveKilledCount++;
    this.sessionKills++;
    soundEngine.playZombieDeath(e.isBoss);

    // Hitstop on boss kill
    if (e.isBoss) {
      this.hitstopTimer = 0.08;
      this.screenShake = 12;
      soundEngine.playExplosion(true);
    }

    // Balanced Bio-Credits logic: lower and harder to earn
    let earnedCredits = 0;
    if (e.credits === 1) {
      if (Math.random() < 0.55 * this.runStats.creditsMultiplier) {
        earnedCredits = 1;
      }
    } else {
      earnedCredits = Math.max(1, Math.round(e.credits * (0.7 + 0.3 * this.runStats.creditsMultiplier)));
    }

    if (earnedCredits > 0) {
      this.sessionBioCredits += earnedCredits;
      this.addFloatingText(`+${earnedCredits}`, e.x, e.y - 12, '#10b981', 12);
    }
    this.sessionScore += e.score;

    // Splatter blood onto permanent ground canvas
    this.stampBloodDecal(e.x, e.y, e.bloodColor, e.radius * 1.6);

    // Flesh and blood particles
    this.createGoreExplosion(e.x, e.y, e.bloodColor, e.isBoss ? 25 : 8);

    // Bloater explosion on death
    if (e.type === 'bloater') {
      soundEngine.playExplosion(false);
      this.triggerExplosion(e.x, e.y, 65, 90, '#a855f7');
    }

    // Vampiric Nanite repair perk check
    if (Math.random() < this.runStats.vampiricChance) {
      this.runStats.bunkerCurrentHp = Math.min(
        this.runStats.bunkerMaxHp,
        this.runStats.bunkerCurrentHp + 18
      );
      this.addFloatingText('+18 HP', this.centerX, this.centerY - 45, '#10b981');
    }

    // Bouncing shrapnel splinter perk check (supports upgrade stacking)
    if (this.runStats.bouncingShrapnel) {
      const fragmentCount = this.runStats.shrapnelCount || 4;
      for (let s = 0; s < fragmentCount; s++) {
        const shrapnelAngle = Math.random() * Math.PI * 2;
        this.projectiles.push({
          id: Math.random(),
          x: e.x,
          y: e.y,
          vx: Math.cos(shrapnelAngle) * 550,
          vy: Math.sin(shrapnelAngle) * 550,
          damage: 35,
          radius: 2,
          pierceRemaining: 2,
          color: '#fbbf24',
          glowColor: '#fef08a',
          source: 'player',
          lifeTime: 0.6,
        });
      }
    }
  }

  // --- PROJECTILE SIMULATION & IMPACTS ---
  private updateProjectiles(dt: number) {
    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.projectiles[pIdx];

      // Heat-seeking homing guidance
      if (p.isHoming && this.enemies.length > 0) {
        let closest: EnemyEntity | null = null;
        let minDistSq = 450 * 450;
        for (const e of this.enemies) {
          const distSq = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
          if (distSq < minDistSq) {
            minDistSq = distSq;
            closest = e;
          }
        }
        if (closest) {
          const targetAngle = Math.atan2(closest.y - p.y, closest.x - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          let diff = targetAngle - currentAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turnRate = 7.0 * dt;
          const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate);
          const speed = p.homingSpeed || 500;
          p.vx = Math.cos(newAngle) * speed;
          p.vy = Math.sin(newAngle) * speed;

          // Smoke puff particle behind missile
          if (Math.random() < 0.45) {
            this.particles.push({
              x: p.x,
              y: p.y,
              vx: -p.vx * 0.12,
              vy: -p.vy * 0.12,
              radius: 2.5,
              color: '#cbd5e1',
              alpha: 0.65,
              decay: 2.2,
              isSmoke: true,
            });
          }
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifeTime -= dt;

      // Despawn if out of bounds or expired
      if (
        p.lifeTime <= 0 ||
        p.x < -100 ||
        p.x > this.width + 100 ||
        p.y < -100 ||
        p.y > this.height + 100
      ) {
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      // Check collision
      if (p.source === 'player' || p.source === 'turret') {
        let hitSomething = false;

        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
          const e = this.enemies[eIdx];
          const distSq = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
          const hitDist = e.radius + p.radius;

          if (distSq <= hitDist * hitDist) {
            hitSomething = true;
            e.hp -= p.damage;
            soundEngine.playZombieHit();

            // Knockback
            const hitAngle = Math.atan2(p.vy, p.vx);
            e.x += Math.cos(hitAngle) * 4;
            e.y += Math.sin(hitAngle) * 4;

            // Cryo slow
            if (p.slowEffect && p.slowEffect > 0) {
              e.frozenTimer = 3.0;
            }

            // Tesla chain arc trigger
            if (p.source === 'player' && (this.runStats.teslaArc || this.runStats.electricDischarge)) {
              this.executeTeslaArc({ x: p.x, y: p.y }, e, p.damage * 0.85);
            }

            // Incendiary napalm pool trigger
            if (p.source === 'player' && this.runStats.incendiaryRounds && Math.random() < 0.4) {
              this.napalmPools.push({
                x: e.x,
                y: e.y,
                radius: 48,
                life: 3.5,
                damage: 45,
              });
            }

            // Impact sparks
            this.createSparks(p.x, p.y, p.color, 4);

            // Explosive detonation
            if (p.explosiveRadius && p.explosiveRadius > 0) {
              soundEngine.playExplosion(false);
              this.triggerExplosion(p.x, p.y, p.explosiveRadius, p.damage * 0.7, p.color);
            }

            // Hitstop on heavy railgun shots
            if (p.weaponId === 'railgun') {
              this.hitstopTimer = 0.03;
            }

            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) {
              break;
            }
          }
        }

        if (p.pierceRemaining <= 0) {
          this.projectiles.splice(pIdx, 1);
        }
      } else if (p.source === 'enemy') {
        // Enemy projectile hitting bunker
        const distToBunker = Math.hypot(p.x - this.centerX, p.y - this.centerY);
        if (distToBunker <= this.bunkerRadius + p.radius) {
          this.damageBunker(p.damage);
          this.createSparks(p.x, p.y, p.color, 6);
          this.projectiles.splice(pIdx, 1);
        }
      }
    }
  }

  private triggerExplosion(
    x: number,
    y: number,
    radius: number,
    damage: number,
    color: string
  ) {
    this.screenShake = Math.max(this.screenShake, 5.0);

    // Damage all enemies in blast radius
    for (const e of this.enemies) {
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist <= radius + e.radius) {
        const falloff = 1 - dist / (radius + e.radius);
        e.hp -= damage * Math.max(0.4, falloff);
        const knockAngle = Math.atan2(e.y - y, e.x - x);
        e.x += Math.cos(knockAngle) * (15 * falloff);
        e.y += Math.sin(knockAngle) * (15 * falloff);
      }
    }

    // Explosion particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 6,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        alpha: 1.0,
        decay: 1.6 + Math.random() * 1.5,
        isSmoke: Math.random() > 0.6,
      });
    }
  }

  // --- EMERGENCY EMP SHOCKWAVE ---
  public triggerEmpShockwave() {
    const now = performance.now() / 1000;
    if (now - this.runStats.lastEmpUsedTime < this.runStats.empCooldownSec) return;

    this.runStats.lastEmpUsedTime = now;
    soundEngine.playEmpBlast();
    this.screenShake = 9.0;

    // Push back and stun all enemies
    for (const e of this.enemies) {
      const dx = e.x - this.centerX;
      const dy = e.y - this.centerY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      e.hp -= 85;
      e.frozenTimer = 4.0; // Stunned
      e.x += Math.cos(angle) * 70;
      e.y += Math.sin(angle) * 70;
      this.createSparks(e.x, e.y, '#38bdf8', 6);
    }

    // Visual ring wave particles
    for (let a = 0; a < Math.PI * 2; a += 0.15) {
      const speed = 450;
      this.particles.push({
        x: this.centerX,
        y: this.centerY,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        radius: 4,
        color: '#38bdf8',
        alpha: 1.0,
        decay: 1.2,
      });
    }

    this.addFloatingText('EMP SHOCKWAVE ACTIVE', this.centerX, this.centerY - 60, '#38bdf8', 16);
  }

  // --- PARTICLES & GORE ENGINE ---
  private stampBloodDecal(x: number, y: number, color: string, radius: number) {
    this.bloodCtx.save();
    this.bloodCtx.fillStyle = color;
    this.bloodCtx.globalAlpha = 0.75;

    this.bloodCtx.beginPath();
    this.bloodCtx.arc(x, y, radius, 0, Math.PI * 2);
    this.bloodCtx.fill();

    // Splatter droplets
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius * (1 + Math.random() * 1.5);
      const dropRadius = 2 + Math.random() * 4;
      this.bloodCtx.beginPath();
      this.bloodCtx.arc(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        dropRadius,
        0,
        Math.PI * 2
      );
      this.bloodCtx.fill();
    }
    this.bloodCtx.restore();
  }

  private createMuzzleFlash(x: number, y: number, angle: number, color: string) {
    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * 60,
      vy: Math.sin(angle) * 60,
      radius: 8 + Math.random() * 4,
      color,
      alpha: 1.0,
      decay: 18.0, // very fast fade
    });
  }

  private createShellCasing(x: number, y: number, aimAngle: number) {
    const ejectAngle = aimAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    const speed = 120 + Math.random() * 80;
    this.particles.push({
      x,
      y,
      vx: Math.cos(ejectAngle) * speed,
      vy: Math.sin(ejectAngle) * speed,
      radius: 2,
      color: '#facc15',
      alpha: 1.0,
      decay: 0.8,
      isCasing: true,
      angle: Math.random() * Math.PI,
      angularVelocity: 8 + Math.random() * 8,
    });
  }

  private createSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2,
        color,
        alpha: 1.0,
        decay: 3.5,
        isSpark: true,
      });
    }
  }

  private createGoreExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 3.5,
        color,
        alpha: 0.9,
        decay: 1.8,
      });
    }
  }

  private createLightningSegment(x1: number, y1: number, x2: number, y2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(3, Math.floor(dist / 25));

    let prevX = x1;
    let prevY = y1;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const targetX = x1 + dx * t + (i < steps ? (Math.random() - 0.5) * 18 : 0);
      const targetY = y1 + dy * t + (i < steps ? (Math.random() - 0.5) * 18 : 0);

      this.particles.push({
        x: (prevX + targetX) / 2,
        y: (prevY + targetY) / 2,
        vx: 0,
        vy: 0,
        radius: 2,
        color: '#38bdf8',
        alpha: 1.0,
        decay: 12.0,
      });

      prevX = targetX;
      prevY = targetY;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.isCasing && p.angularVelocity) {
        p.angle = (p.angle || 0) + p.angularVelocity * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string, fontSize = 14) {
    this.floatingTexts.push({
      id: Math.random(),
      text,
      x: x + (Math.random() - 0.5) * 16,
      y,
      vy: -35,
      color,
      alpha: 1.0,
      fontSize,
    });
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.5;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private handleGameOver() {
    this.isRunning = false;
    soundEngine.stopAlarm();
    this.callbacks.onGameOver({
      wavesSurvived: this.currentWave - 1,
      totalKills: this.sessionKills,
      bioCreditsEarned: this.sessionBioCredits,
      score: this.sessionScore,
    });
  }

  // --- RENDERING ---
  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake offset
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Dark Asphalt Arena Surface
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Tactical grid / concrete seam lines
    ctx.strokeStyle = '#151c28';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Hazard boundary markings around perimeter
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, this.width - 60, this.height - 60);

    // 2. Persistent Blood Decals Buffer
    ctx.drawImage(this.bloodCanvas, 0, 0);

    // 2b. Burning Napalm Pools
    for (const pool of this.napalmPools) {
      ctx.save();
      ctx.fillStyle = 'rgba(234, 88, 12, 0.45)';
      ctx.beginPath();
      ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render Enemies
    this.renderEnemies(ctx);

    // 4. Central Bunker & Side Turrets
    this.renderBunkerAndTurrets(ctx);

    // 4b. Render Orbital Escort Drones
    if (this.runStats.droneEscorts && this.runStats.droneEscorts > 0) {
      for (let d = 0; d < this.runStats.droneEscorts; d++) {
        const dAngle = this.droneOrbitAngle + (d * Math.PI * 2) / this.runStats.droneEscorts;
        const dx = this.centerX + Math.cos(dAngle) * 115;
        const dy = this.centerY + Math.sin(dAngle) * 115;

        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(dAngle + Math.PI / 2);
        // Diamond drone chassis
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 9);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Thruster glow
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 5. Render Projectiles
    this.renderProjectiles(ctx);

    // 6. Render Particles
    this.renderParticles(ctx);

    // 7. Tactical Flashlight Beam & Dynamic Lighting Mask
    this.renderAtmosphericLighting(ctx);

    // 8. Render Floating Combat Text
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);

      // Body drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 4, e.radius, e.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Frozen overlay tint
      ctx.fillStyle = e.frozenTimer > 0 ? '#38bdf8' : e.color;

      // Zombie torso
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // Armored outline or boss spikes
      if (e.type === 'brute' || e.isBoss) {
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Reaching arms
      ctx.fillStyle = e.frozenTimer > 0 ? '#7dd3fc' : '#475569';
      ctx.fillRect(e.radius * 0.4, -e.radius * 0.7, e.radius * 0.8, 4);
      ctx.fillRect(e.radius * 0.4, e.radius * 0.4, e.radius * 0.8, 4);

      // Glowing mutation eyes
      ctx.fillStyle = e.type === 'bloater' ? '#c084fc' : '#ef4444';
      ctx.fillRect(e.radius * 0.5, -4, 3, 2);
      ctx.fillRect(e.radius * 0.5, 2, 3, 2);

      ctx.restore();

      // Mini Health Bar over damaged enemies
      if (e.hp < e.maxHp) {
        const barWidth = e.radius * 2;
        const barHeight = 4;
        const hpRatio = Math.max(0, e.hp / e.maxHp);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 10, barWidth, barHeight);

        ctx.fillStyle = hpRatio > 0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(e.x - barWidth / 2, e.y - e.radius - 10, barWidth * hpRatio, barHeight);
      }
    }
  }

  private renderBunkerAndTurrets(ctx: CanvasRenderingContext2D) {
    // Outer Bunker Hazard Ring
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Concrete fortress base ring
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, this.bunkerRadius + 8, 0, Math.PI * 2);
    ctx.fill();

    // Hazard striped rim
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner ballistic armored bulkhead
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, this.bunkerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Shield Dome indicator if active
    if (this.bunkerShield > 0) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.bunkerRadius + 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // Render Side Defense Turrets in their sockets
    for (const turret of this.placedTurrets) {
      const pos = this.getSocketPosition(turret.socket);
      const def = TURRET_REGISTRY[turret.type];

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Mount base
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pivoting turret head
      ctx.rotate(turret.targetAngle);

      // Turret barrels
      ctx.fillStyle = def ? def.color : '#94a3b8';
      if (turret.type === 'vulcan') {
        ctx.fillRect(4, -5, 18, 3);
        ctx.fillRect(4, 2, 18, 3);
      } else if (turret.type === 'tesla') {
        ctx.fillRect(4, -3, 14, 6);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(18, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (turret.type === 'cryo') {
        ctx.fillRect(4, -4, 16, 8);
      } else if (turret.type === 'flamethrower') {
        ctx.fillRect(4, -6, 22, 12);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(26, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (turret.type === 'laser') {
        ctx.fillRect(4, -3, 24, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(16, -5, 8, 10);
      } else if (turret.type === 'missile') {
        ctx.fillRect(4, -8, 22, 6);
        ctx.fillRect(4, 2, 22, 6);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(20, -7, 6, 4);
        ctx.fillRect(20, 3, 6, 4);
      } else if (turret.type === 'mortar') {
        ctx.fillRect(2, -6, 20, 12);
      }

      // Turret body
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Render Primary Center Player Turret (Smoothly follows mouse angle)
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.currentAimAngle);

    const weaponDef = WEAPON_REGISTRY[this.currentWeapon] || WEAPON_REGISTRY.gatling;

    // Heavy Cannon Barrels
    ctx.fillStyle = '#475569';
    if (this.currentWeapon === 'gatling') {
      // Rotary multi-barrel
      ctx.fillRect(10, -6, 36, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(44, -7, 5, 14);
    } else if (this.currentWeapon === 'shotgun') {
      // Twin wide flak barrels
      ctx.fillRect(10, -8, 30, 6);
      ctx.fillRect(10, 2, 30, 6);
    } else if (this.currentWeapon === 'railgun') {
      // Long sleek electromagnetic rails
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10, -4, 46, 8);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, -6, 38, 2);
      ctx.fillRect(14, 4, 38, 2);
    } else if (this.currentWeapon === 'rockets') {
      // Dual box rocket pods
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, -12, 28, 9);
      ctx.fillRect(10, 3, 28, 9);
    } else if (this.currentWeapon === 'plasma') {
      // Plasma arc orb chamber
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(10, -5, 34, 10);
      ctx.beginPath();
      ctx.arc(44, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Turret Pivot Core
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = weaponDef.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glowColor;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Tracer line behind fast bullets
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.radius * 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      if (p.isCasing) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.fillRect(-2, -1, 4, 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- ATMOSPHERIC LIGHTING & SPOTLIGHT CONE ---
  private renderAtmosphericLighting(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Spotlight Cone following mouse aim
    const beamAngle = 0.55; // 31 degrees cone
    const beamLength = Math.max(this.width, this.height);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY);
    ctx.arc(
      this.centerX,
      this.centerY,
      beamLength,
      this.currentAimAngle - beamAngle / 2,
      this.currentAimAngle + beamAngle / 2
    );
    ctx.closePath();

    const beamGradient = ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      this.bunkerRadius,
      this.centerX,
      this.centerY,
      beamLength
    );
    beamGradient.addColorStop(0, 'rgba(254, 240, 138, 0.18)'); // soft warm spotlight
    beamGradient.addColorStop(0.6, 'rgba(254, 240, 138, 0.08)');
    beamGradient.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGradient;
    ctx.fill();
    ctx.restore();

    // Dark ambient fog of war with clear vision around bunker
    const ambientGrad = ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      this.bunkerRadius + 60,
      this.centerX,
      this.centerY,
      this.width * 0.75
    );
    ambientGrad.addColorStop(0, 'rgba(11, 14, 20, 0)');
    ambientGrad.addColorStop(0.5, 'rgba(11, 14, 20, 0.35)');
    ambientGrad.addColorStop(1, 'rgba(11, 14, 20, 0.75)');

    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
