# Outpost Zero: Gun Stand Defense

Outpost Zero is a tactical top-down defense shooter inspired by *Zombie Shooter 2 Gun Stand* mode. Players hold a fortified central outpost against relentless waves of mutated zombie hordes attacking from 360 degrees, deploying switchable heavy artillery, automated flank defense grids, roguelike round draft perks, and permanent base tech-tree upgrades.

> [!IMPORTANT]
> **User Review & Confirmed Decisions**:
> - **Visual Perspective & Atmosphere**: Top-down tactical military outpost with dynamic flashlight cones, muzzle flashes, and shadow lighting.
> - **Player Arsenal & Controls**: Mouse aim and click to fire with switchable heavy weapons (Gatling, Heavy Flak Shotgun, High-Velocity Railgun, Cluster Rockets, Plasma Arc) plus active support abilities.
> - **Meta-Progression System**: Permanent Military Tech Tree using earned Bio-Credits to unlock defensive perimeter structures, base armor/repair, automated flank turrets, and offensive calibrations.

---

### 1. Overview & Core Concept

- **What It Does**: Puts the player in command of a fortified central gun stand besieged by escalating swarms of diverse zombie mutations (Swarm Walkers, Fast Crawlers, Armored Brutes, Toxic Spitters, Bloater Bombers, and Mutation Bosses). Between surviving waves, players draft tactical roguelike perks (Chain Lightning ammo, Shrapnel Splinters, Cryo Coatings) and place/upgrade automated flank defenses. Between survival runs, players spend earned Bio-Credits in the permanent Military Tech Tree to unlock baseline fortress stats and advanced turret technology.
- **Target Audience**: Fans of classic arcade stand shooters (*Zombie Shooter 2*, *Crimsonland*), horde survivors (*Vampire Survivors*), and strategic tower defense titles.
- **Key Value**: Intense, visceral 60 FPS horde combat coupled with strategic automated defense placement and satisfying long-term meta-progression.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Title Screen / Operations Command**: Atmospheric title lockup with live background combat preview (searchlights scanning darkness, perimeter barricades), High Score record, Quick Stats, Start Sortie CTA (`Enter`/`Space`), and direct access to the **Military Tech Tree HQ**.
2. **Sortie Preparation / Tech Tree**: Spend Bio-Credits across 4 research branches (Bunker Hull & Nanite Repair, Heavy Ballistics Calibration, Automated Flank Defenses, Tactical Logistics) with instant stat previews and reset capability.
3. **Active Horde Wave (Top-Down Arena)**:
   - 360-degree zombie horde rushing from all screen borders toward center bunker.
   - Player controls primary central turret via mouse aim with dynamic flashlight beam, mouse click to fire, `1-5` (or wheel) to switch unlocked heavy weapons, and `Space` for emergency EMP blast.
   - Automated side defense sockets (North, South, East, West flank turrets, Tesla coils, cryo towers) acquire targets autonomously.
   - Low-occlusion perimeter HUD: Bunker Integrity, Ammo/Cooldown dials, Current Wave, Score, and Bio-Credits earned.
4. **Between-Wave Tactical Supply Drop (Roguelike Draft)**:
   - Pause in the action; choose 1 of 3 randomized tactical military cards (e.g. *Incendiary Munitions*, *Overcharged Capacitors*, *Nanite Siphon*, *Perimeter Barbed Wire*, *Mortar Battery Upgrade*).
   - Repair bunker or install/upgrade flank defense turrets before initiating next wave (`Space` to deploy next wave).
5. **Debriefing (Victory / Last Stand)**:
   - Detailed combat statistics (Zombies exterminated, waves endured, accuracy, Bio-Credits banked).
   - Immediate option to return to Base HQ to upgrade tech or redeploy directly.

#### Visual Identity & Theme
- **Aesthetic Direction**: Gritty military quarantine outpost; industrial concrete, hazard stripes, military green and slate metals, illuminated by rotating searchlights, muzzle flashes, and glowing tracer bullets.
- **Color Palette & Discipline (60-30-10)**:
  - 60% Dark Arena Surface: Deep asphalt and blast-scorched concrete (`#0c0f14`, `#131923`).
  - 30% Structural Metals & Barricades: Matte military slate (`#1e293b`), ballistic plating (`#334155`), reinforced bunker ring.
  - 10% Tactical Accents: Tracer amber (`#f59e0b`), alarm red (`#ef4444`), Tesla cyan (`#06b6d4`), and Bio-Credit emerald (`#10b981`).
- **Typography & Hierarchy**:
  - Display / Heads-Up: Bold industrial sans (`Oswald` / `Barlow Condensed` / `Plus Jakarta Sans`) with heavy military weight.
  - Telemetry & Readouts: Monospace tabular numerals (`font-mono tabular-nums`) for bunker HP, ammo count, DPS, and wave timers.
  - Clean unboxed metadata with subtle typographic bullet separators (`·`).

#### Interactive Feedback & Procedural Audio
- **Web Audio API Engine**: Custom procedural synthesizer generating dynamic sound effects without external audio files:
  - Multi-caliber gunfire (deep thudding Gatling pulses, sharp shotgun blasts, high-frequency railgun charge and discharge).
  - Heavy explosion thumps with low-frequency rumble.
  - Metallic shell casings pinging off bunker grating.
  - Zombie groans, screeching death rattles, and alarm klaxon when bunker HP dips below 25%.
  - Audio mute toggle in perimeter HUD.
- **Visceral Combat Feel**:
  - Decaying screen shake scaled to blast radius and heavy impacts.
  - 40ms simulation hitstop on piercing railgun penetrations and boss detonations.
  - Particle pooling for blood spatters (persisting on ground), sparks, smoke trails, and glowing cartridge ejections.
  - Dynamic 2D light cone tracking the mouse cursor through atmospheric darkness.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Isolated Canvas Rendering Engine with React HUD Overlay**
  - *Chosen Approach*: Pure HTML5 Canvas 2D render loop mounted in an isolated container driven by `requestAnimationFrame`, with React handling the Title Menu, Tech Tree UI, and Roguelike Draft modals.
  - *Why*: Guarantees fluid 60 FPS simulation handling 400+ simultaneous zombies, projectiles, and particle effects without React state reconciliation overhead.
  - *Alternatives Considered*: DOM-based sprite nodes (crawls at ~40 entities) or WebGL Three.js (unnecessary overhead for 2D top-down perspective).
- **Decision 2: Dedicated Auto Side Defense Grid (Gun Stand Mode Authenticity)**
  - *Chosen Approach*: Center bunker features dedicated socket positions (4 cardinal/flank slots) where players can build and upgrade autonomous side defenses (Twin Vulcans, Tesla Arc Nodes, Cryo Sprayers, Heavy Mortar Launchers).
  - *Why*: Directly fulfills the *Zombie Shooter 2 Gun Stand* experience where the central player turret is assisted by autonomous defensive systems defending flanking angles.
- **Decision 3: Dual-Layer Progression (In-Run Roguelike + Permanent Tech Tree)**
  - *Chosen Approach*: In-run upgrades provide immediate tactical synergies (e.g. explosive ammo, ricochet, overcharge), while Bio-Credits persist in `localStorage` to unlock permanent bunker stats and defense tiers.
  - *Why*: Ensures high replayability, allowing players to feel continuous power growth even after failing high-difficulty waves.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              APP COMPONENT                                 │
│  State Machine: TITLE_MENU ──► TECH_TREE ──► PLAYING ──► DRAFT ──► GAMEOVER│
└──────┬─────────────────────────────┬───────────────────────────────┬───────┘
       │                             │                               │
       ▼                             ▼                               ▼
┌──────────────────┐       ┌──────────────────┐            ┌──────────────────┐
│  TECH TREE VIEW  │       │  COMBAT ENGINE   │            │ ROGUELIKE DRAFT  │
│ - Tech branches  │       │ - 60 FPS Loop    │            │ - 3 Supply cards │
│ - Bio-Credit shop│       │ - Zombie manager │            │ - Flank sockets  │
│ - Persistent save│       │ - Projectile pool│            │ - Repair station │
└──────────────────┘       │ - Particle pool  │            └──────────────────┘
                           │ - Lighting cone  │
                           │ - Side turrets   │
                           │ - Sound synth    │
                           └─────────┬────────┘
                                     │
                                     ▼
                           ┌──────────────────┐
                           │   CANVAS VIEW    │
                           │ - Isolated ref   │
                           │ - Low-occlusion  │
                           │ - Full viewport  │
                           └──────────────────┘
```

#### Core Data Structures
```typescript
interface TechTreeUpgrade {
  id: string;
  branch: 'bunker' | 'ballistics' | 'automation' | 'logistics';
  name: string;
  description: string;
  currentLevel: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  statBonusPerLevel: number;
}

interface WeaponConfig {
  id: 'gatling' | 'shotgun' | 'railgun' | 'rockets' | 'plasma';
  name: string;
  damage: number;
  fireRate: number; // shots per sec
  spread: number;
  projectileSpeed: number;
  pierce: number;
  unlockedByDefault: boolean;
  requiredTechId?: string;
}

interface SideTurret {
  id: string;
  socket: 'north' | 'south' | 'east' | 'west';
  type: 'vulcan' | 'tesla' | 'cryo' | 'mortar';
  level: number;
  range: number;
  damage: number;
  fireRate: number;
  lastFired: number;
  targetAngle: number;
}

interface Enemy {
  id: number;
  type: 'walker' | 'runner' | 'brute' | 'spitter' | 'bloater' | 'boss';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  rewardCredits: number;
}
```

#### Verification & Quality Gates
- **Performance**: Constant 60 FPS target with 300+ on-screen entities using spatial partitioning and pooled particles.
- **Controls**: Responsive mouse aiming, smooth weapon cycling, clear visual cooldowns, and full keyboard fallback hints (`Space`, `1-5`, `Esc`).
- **Persistence**: Safe `localStorage` hydration for all tech unlocks, total kills, high waves, and currency with versioning.
- **Audio Compliance**: Synthesizer lazily initialized on user interaction with instant mute toggle.
