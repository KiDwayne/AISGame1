import { PerkDef } from '../types/game';

export interface BasePerkTemplate {
  id: string;
  name: string;
  tagline: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  iconName: string;
  maxRank: number;
  baseDescription: string;
  getUpgradeDescription: (rank: number) => string;
  apply: (stats: any, rank: number) => void;
}

export const BASE_PERK_TEMPLATES: BasePerkTemplate[] = [
  {
    id: 'hollow_point',
    name: 'Hollow-Point Munitions',
    tagline: 'Raw stopping power',
    rarity: 'common',
    maxRank: 5,
    iconName: 'Crosshair',
    baseDescription: 'Increases primary weapon ballistic damage by +25%.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Increases primary weapon damage by +25% (Total +${rank * 25}%).`,
    apply: (stats) => {
      stats.damageMult += 0.25;
    },
  },
  {
    id: 'overdrive_rotor',
    name: 'Overdrive Rotor',
    tagline: 'Higher cyclic rate',
    rarity: 'common',
    maxRank: 5,
    iconName: 'Flame',
    baseDescription: 'Increases firing rate of all weapons by +20%.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Increases firing rate by +20% (Total +${rank * 20}%).`,
    apply: (stats) => {
      stats.fireRateMult += 0.20;
    },
  },
  {
    id: 'piercing_cal',
    name: 'Tungsten Penetrator',
    tagline: 'Carve through ranks',
    rarity: 'common',
    maxRank: 5,
    iconName: 'ChevronsRight',
    baseDescription: 'Projectiles pierce through +2 additional infected targets.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Pierces through +2 additional targets (Total +${rank * 2} pierce).`,
    apply: (stats) => {
      stats.pierceBonus += 2;
    },
  },
  {
    id: 'field_repairs',
    name: 'Combat Engineering',
    tagline: 'Hull restoration',
    rarity: 'common',
    maxRank: 5,
    iconName: 'Wrench',
    baseDescription: 'Restores +400 Bunker Integrity and permanently adds +250 Max Integrity.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Restores +450 Bunker HP and expands Max Integrity by +250 HP (Total +${rank * 250} Max HP).`,
    apply: (stats, rank) => {
      stats.bunkerMaxHp += 250;
      stats.bunkerCurrentHp = Math.min(stats.bunkerMaxHp, stats.bunkerCurrentHp + 450);
    },
  },
  {
    id: 'cryo_munitions',
    name: 'Liquid Nitrogen Rounds',
    tagline: 'Sub-zero suppression',
    rarity: 'rare',
    maxRank: 4,
    iconName: 'Snowflake',
    baseDescription: 'Shots slow hit zombies by 40% for 3.5 seconds.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Freezes infected approach speeds by ${Math.min(75, 40 + (rank - 1) * 12)}% and extends frost duration.`,
    apply: (stats, rank) => {
      stats.cryoSlowMult = Math.min(0.75, 0.40 + (rank - 1) * 0.12);
    },
  },
  {
    id: 'critical_targeting',
    name: 'Vital Anatomy Radar',
    tagline: 'Pinpoint headshots',
    rarity: 'rare',
    maxRank: 5,
    iconName: 'Target',
    baseDescription: '+12% Critical Strike Chance and +50% Critical Damage multiplier.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Adds +12% Crit Chance and +50% Crit Damage (Total +${rank * 12}% chance, +${rank * 50}% damage).`,
    apply: (stats) => {
      stats.critChance += 0.12;
      stats.critMultiplier += 0.50;
    },
  },
  {
    id: 'explosive_rounds',
    name: 'Micro-HE Detonators',
    tagline: 'Splash devastation',
    rarity: 'rare',
    maxRank: 5,
    iconName: 'Bomb',
    baseDescription: 'Primary shots detonate on impact in a 45px explosive splash radius.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Expands explosion blast radius to ${45 + (rank - 1) * 15}px and adds +${rank * 30} area splash damage.`,
    apply: (stats, rank) => {
      stats.explosiveRounds = true;
      stats.explosiveRadius = 45 + (rank - 1) * 15;
      stats.explosiveDamageBonus = (stats.explosiveDamageBonus || 0) + 30;
    },
  },
  {
    id: 'bounty_harvest',
    name: 'Scrap Scavenger Protocol',
    tagline: 'Bio-credit extraction',
    rarity: 'rare',
    maxRank: 5,
    iconName: 'Coins',
    baseDescription: 'Earn +35% more Bio-Credits from defeated infected and wave bonuses.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Stacks +35% credit extraction yield (Total +${rank * 35}%).`,
    apply: (stats) => {
      stats.creditsMultiplier += 0.35;
    },
  },
  {
    id: 'vampiric_nanites',
    name: 'Biomass Siphon',
    tagline: 'Life from the dead',
    rarity: 'epic',
    maxRank: 4,
    iconName: 'Activity',
    baseDescription: '12% chance on each zombie kill to siphon +20 Bunker Integrity.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Increases siphon chance to ${rank * 12}% (Restores +${20 + (rank - 1) * 8} HP per siphon).`,
    apply: (stats) => {
      stats.vampiricChance += 0.12;
    },
  },
  {
    id: 'shrapnel_burst',
    name: 'Fragmentation Splinters',
    tagline: 'Chain fatalities',
    rarity: 'epic',
    maxRank: 4,
    iconName: 'Layers',
    baseDescription: 'Defeated zombies violently erupt into 4 ricocheting bone and metal fragments.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Increases death shrapnel to ${4 + (rank - 1) * 3} piercing fragments.`,
    apply: (stats, rank) => {
      stats.bouncingShrapnel = true;
      stats.shrapnelCount = 4 + (rank - 1) * 3;
    },
  },
  {
    id: 'electric_discharge',
    name: 'Tesla Induction Coils',
    tagline: 'Arc discharge',
    rarity: 'epic',
    maxRank: 5,
    iconName: 'Zap',
    baseDescription: 'Impacts arc high-voltage lightning bolts to up to 3 nearby hostiles for 45 damage.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Arcs lightning to ${3 + (rank - 1) * 2} targets dealing ${45 + (rank - 1) * 25} shock damage.`,
    apply: (stats, rank) => {
      stats.electricDischarge = true;
      stats.chainLightningTargets = 3 + (rank - 1) * 2;
      stats.chainLightningDamage = 45 + (rank - 1) * 25;
    },
  },
  {
    id: 'emp_rapid_cycle',
    name: 'Capacitor Superconductors',
    tagline: 'Rapid shockwave',
    rarity: 'epic',
    maxRank: 4,
    iconName: 'BatteryCharging',
    baseDescription: 'Reduces emergency EMP Shockwave cooldown by 7 seconds.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Reduces EMP cooldown by -7s (Total -${rank * 7}s recharge delay).`,
    apply: (stats) => {
      stats.empCooldownSec = Math.max(6, stats.empCooldownSec - 7);
    },
  },
  {
    id: 'heavy_ordnance',
    name: 'Heavy Artillery Caliber',
    tagline: 'Devastating payload',
    rarity: 'legendary',
    maxRank: 4,
    iconName: 'ShieldAlert',
    baseDescription: '+60% Weapon Damage and +25px blast radius, with -8% fire rate.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Stacks +60% weapon damage and +25px blast radius (Total +${rank * 60}% dmg).`,
    apply: (stats) => {
      stats.damageMult += 0.60;
      stats.explosiveRadius += 25;
      stats.fireRateMult = Math.max(0.6, stats.fireRateMult - 0.08);
    },
  },
  {
    id: 'split_shots_3',
    name: 'Multi-Split Barrel Mod',
    tagline: 'Horde spray multiplier',
    rarity: 'rare',
    maxRank: 4,
    iconName: 'ChevronsRight',
    baseDescription: 'Main turret fires a 3-way split forward stream on every shot.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Upgrades to a ${1 + rank * 2}-way spread fan of projectiles!`,
    apply: (stats, rank) => {
      stats.splitShots = Math.max(stats.splitShots, rank);
    },
  },
  {
    id: 'tesla_main_conduit',
    name: 'Tesla Induction Conduit',
    tagline: 'Chain lightning rounds',
    rarity: 'epic',
    maxRank: 4,
    iconName: 'Zap',
    baseDescription: 'Main weapon impacts discharge chain lightning jumping between up to 5 infected.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Chain lightning jumps to ${5 + (rank - 1) * 3} targets for ${50 + (rank - 1) * 30} damage.`,
    apply: (stats, rank) => {
      stats.teslaArc = true;
      stats.electricDischarge = true;
      stats.chainLightningTargets = Math.max(stats.chainLightningTargets || 3, 5 + (rank - 1) * 3);
      stats.chainLightningDamage = (stats.chainLightningDamage || 45) + 30;
    },
  },
  {
    id: 'napalm_canister',
    name: 'Incendiary Napalm Shells',
    tagline: 'Scorched earth',
    rarity: 'rare',
    maxRank: 4,
    iconName: 'Flame',
    baseDescription: 'Main turret impacts ignite asphalt into fiery napalm pools burning passing zombies.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Increases napalm pool radius by +20px and burn damage by +40/sec.`,
    apply: (stats, rank) => {
      stats.incendiaryRounds = true;
      stats.napalmRadiusBonus = (stats.napalmRadiusBonus || 0) + 20;
      stats.napalmBurnDamageBonus = (stats.napalmBurnDamageBonus || 0) + 40;
    },
  },
  {
    id: 'quad_rotary_barrels',
    name: 'Synchronized Cyclic Receivers',
    tagline: 'Multiplied lead volume',
    rarity: 'epic',
    maxRank: 3,
    iconName: 'Flame',
    baseDescription: 'Main turret cycles synchronized multi-receivers, doubling projectiles fired.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Adds +1 additional synchronized projectile stream per trigger pull (Rank ${rank}: ${rank + 1}x lead volume!).`,
    apply: (stats, rank) => {
      stats.quadBarrels = true;
      stats.extraProjectilesPerShot = rank;
    },
  },
  {
    id: 'orbital_drones',
    name: 'Tactical Drone Wing',
    tagline: 'Autonomous air cover',
    rarity: 'epic',
    maxRank: 4,
    iconName: 'Cpu',
    baseDescription: 'Deploys 2 combat escort drones that orbit the outpost and laser-cut approaching infected.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Deploys +2 additional combat drones (Total: ${rank * 2} active orbital drones!).`,
    apply: (stats) => {
      stats.droneEscorts = (stats.droneEscorts || 0) + 2;
    },
  },
  {
    id: 'turret_synchrony',
    name: 'Perimeter Grid Overclock',
    tagline: 'Autonomous frenzy',
    rarity: 'rare',
    maxRank: 5,
    iconName: 'Crosshair',
    baseDescription: 'All 8 automated flank turrets gain +25% firing speed and +20% damage.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Adds +25% fire rate and +20% damage to all 8 flank turrets (Total +${rank * 25}% speed, +${rank * 20}% dmg).`,
    apply: (stats) => {
      stats.turretFireRateMult = (stats.turretFireRateMult || 1.0) + 0.25;
      stats.turretDamageMult = (stats.turretDamageMult || 1.0) + 0.20;
    },
  },
  {
    id: 'nanite_fortress',
    name: 'Living Nanite Bulwark',
    tagline: 'Impenetrable perimeter',
    rarity: 'legendary',
    maxRank: 3,
    iconName: 'Shield',
    baseDescription: 'Increases Max Bunker HP by +600, fully restores hull, and adds +15% armor reduction.',
    getUpgradeDescription: (rank) =>
      `Rank ${rank}: Fully restores bunker hull, adds +600 Max HP, and +15% armor reduction (Total +${rank * 600} HP, ${Math.min(65, rank * 15)}% armor).`,
    apply: (stats) => {
      stats.bunkerMaxHp += 600;
      stats.bunkerCurrentHp = stats.bunkerMaxHp;
      stats.armorReduction = Math.min(0.65, stats.armorReduction + 0.15);
    },
  },
];

export function getRandomPerks(count = 3, perkStacks: Record<string, number> = {}): PerkDef[] {
  // Filter templates that have not reached maxRank
  const available = BASE_PERK_TEMPLATES.filter((tpl) => {
    const current = perkStacks[tpl.id] || 0;
    return current < tpl.maxRank;
  });

  const pool = available.length >= count ? available : BASE_PERK_TEMPLATES;

  // Weighted lottery by rarity
  const weighted: BasePerkTemplate[] = [];
  pool.forEach((p) => {
    let weight = 10;
    if (p.rarity === 'common') weight = 12;
    if (p.rarity === 'rare') weight = 7;
    if (p.rarity === 'epic') weight = 4;
    if (p.rarity === 'legendary') weight = 2;
    for (let i = 0; i < weight; i++) {
      weighted.push(p);
    }
  });

  const chosenTemplates: BasePerkTemplate[] = [];
  const chosenIds = new Set<string>();

  while (chosenTemplates.length < count && weighted.length > 0) {
    const idx = Math.floor(Math.random() * weighted.length);
    const candidate = weighted[idx];
    if (!chosenIds.has(candidate.id)) {
      chosenIds.add(candidate.id);
      chosenTemplates.push(candidate);
    }
  }

  // Transform templates into PerkDef with stack awareness
  return chosenTemplates.map((tpl) => {
    const currentRank = perkStacks[tpl.id] || 0;
    const nextRank = currentRank + 1;
    const isUpgrade = currentRank > 0;

    return {
      id: tpl.id,
      name: isUpgrade ? `${tpl.name} (Rank ${nextRank})` : tpl.name,
      tagline: isUpgrade ? `UPGRADE // RANK ${nextRank}` : tpl.tagline,
      rarity: tpl.rarity,
      description: isUpgrade ? tpl.getUpgradeDescription(nextRank) : tpl.baseDescription,
      iconName: tpl.iconName,
      maxRank: tpl.maxRank,
      currentRank,
      nextRank,
      apply: (stats: any) => {
        tpl.apply(stats, nextRank);
      },
    };
  });
}
