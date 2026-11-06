import { PersistentProfile, WeaponId } from '../types/game';

const STORAGE_KEY = 'OUTPOST_ZERO_PROFILE_V1';

const DEFAULT_PROFILE: PersistentProfile = {
  bioCredits: 450, // starting grant for early upgrades
  totalZombiesKilled: 0,
  highestWaveSurvied: 0,
  totalSortiesCompleted: 0,
  unlockedTech: {},
  unlockedWeapons: ['gatling'],
  soundEnabled: true,
  soundVolume: 0.7,
};

export function loadProfile(): PersistentProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      unlockedTech: parsed.unlockedTech || {},
      unlockedWeapons: parsed.unlockedWeapons?.length ? parsed.unlockedWeapons : ['gatling'],
    };
  } catch (err) {
    console.error('Failed to load profile:', err);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PersistentProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}

export function addCredits(amount: number): PersistentProfile {
  const profile = loadProfile();
  profile.bioCredits = Math.max(0, profile.bioCredits + amount);
  saveProfile(profile);
  return profile;
}

export function unlockTechNode(nodeId: string, cost: number, weaponUnlock?: WeaponId): PersistentProfile {
  const profile = loadProfile();
  if (profile.bioCredits < cost) return profile;

  profile.bioCredits -= cost;
  profile.unlockedTech[nodeId] = (profile.unlockedTech[nodeId] || 0) + 1;

  if (weaponUnlock && !profile.unlockedWeapons.includes(weaponUnlock)) {
    profile.unlockedWeapons.push(weaponUnlock);
  }

  saveProfile(profile);
  return profile;
}

export function resetProfileTech(): PersistentProfile {
  const profile = loadProfile();
  // Refund 100% of credits spent
  // Simple reset: give back reasonable sum or reset tech levels
  profile.unlockedTech = {};
  profile.unlockedWeapons = ['gatling'];
  saveProfile(profile);
  return profile;
}
