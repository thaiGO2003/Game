const TIER_ODDS_BY_LEVEL = {
  1: [1, 0, 0, 0, 0],
  2: [0.8, 0.2, 0, 0, 0],
  3: [0.65, 0.3, 0.05, 0, 0],
  4: [0.5, 0.35, 0.13, 0.02, 0],
  5: [0.35, 0.35, 0.22, 0.07, 0.01],
  6: [0.25, 0.3, 0.28, 0.14, 0.03],
  7: [0.18, 0.24, 0.3, 0.2, 0.08],
  8: [0.12, 0.18, 0.27, 0.26, 0.17],
  9: [0.08, 0.12, 0.2, 0.3, 0.3],
  10: [0.05, 0.10, 0.20, 0.35, 0.30],
  11: [0.01, 0.05, 0.15, 0.30, 0.49],
  12: [0, 0, 0.10, 0.30, 0.60],
  13: [0, 0, 0.08, 0.28, 0.64],
  14: [0, 0, 0.06, 0.26, 0.68],
  15: [0, 0, 0.05, 0.24, 0.71],
  16: [0, 0, 0.04, 0.22, 0.74],
  17: [0, 0, 0.03, 0.20, 0.77],
  18: [0, 0, 0.03, 0.18, 0.79],
  19: [0, 0, 0.02, 0.16, 0.82],
  20: [0, 0, 0.02, 0.14, 0.84],
  21: [0, 0, 0.02, 0.12, 0.86],
  22: [0, 0, 0.02, 0.10, 0.88],
  23: [0, 0, 0.02, 0.09, 0.89],
  24: [0, 0, 0.02, 0.08, 0.90],
  25: [0, 0, 0.02, 0.08, 0.90]
};

const XP_TO_LEVEL_UP = {
  1: 2,
  2: 4,
  3: 6,
  4: 10,
  5: 16,
  6: 24,
  7: 36,
  8: 52,
  9: 68,
  10: 88,
  11: 112,
  12: 140,
  13: 172,
  14: 208,
  15: 248,
  16: 292,
  17: 340,
  18: 392,
  19: 448,
  20: 508,
  21: 572,
  22: 640,
  23: 712,
  24: 788,
  25: 868
};

let uidSeed = 1;

export function createUnitUid() {
  uidSeed += 1;
  return `u_${uidSeed}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function randomItem(list, rng = Math.random) {
  if (!list.length) return null;
  const idx = Math.floor(rng() * list.length);
  return list[idx];
}

export function sampleWithoutReplacement(list, count, rng = Math.random) {
  const pool = [...list];
  const result = [];
  while (pool.length && result.length < count) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export function weightedChoice(weights, rng = Math.random) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 0;
  let needle = rng() * sum;
  for (let i = 0; i < weights.length; i += 1) {
    needle -= weights[i];
    if (needle <= 0) return i;
  }
  return weights.length - 1;
}

export function rollTierForLevel(level, rng = Math.random) {
  // Cap effective level at 25 for tier odds lookup
  const safeLevel = clamp(level, 1, 25);
  const odds = TIER_ODDS_BY_LEVEL[safeLevel];
  return weightedChoice(odds, rng) + 1;
}

export function getDeployCapByLevel(level) {
  // Start at 3 slots. Max cap increased to 25 (full 5×5 board).
  return clamp(level + 2, 3, 25);
}

export function getXpToLevelUp(level) {
  return XP_TO_LEVEL_UP[level] ?? Number.POSITIVE_INFINITY;
}

export function starMultiplier(star) {
  if (star <= 1) return 1;
  if (star === 2) return 1.6;
  return 2.5;
}

const BASE_EVASION_BY_CLASS = {
  TANKER: 0.05,
  FIGHTER: 0.08,
  ASSASSIN: 0.15,
  ARCHER: 0.10,
  MAGE: 0.05,
  SUPPORT: 0.07
};

export function getBaseEvasion(classType) {
  return BASE_EVASION_BY_CLASS[classType] ?? 0.05;
}

export function getEffectiveEvasion(unit) {
  const classType = unit?.classType ?? unit?.base?.classType;
  const baseEvasion = getBaseEvasion(classType);
  let evasion = Number.isFinite(unit?.mods?.evadePct) ? unit.mods.evadePct : baseEvasion;
  const statuses = unit?.statuses ?? {};

  // Apply buffs
  if ((statuses.evadeBuffTurns ?? 0) > 0) {
    evasion += statuses.evadeBuffValue ?? 0;
  }

  // Apply debuffs
  if ((statuses.evadeDebuffTurns ?? 0) > 0) {
    evasion -= statuses.evadeDebuffValue ?? 0;
  }

  // Clamp to 0-75% range
  return Math.max(0, Math.min(0.75, evasion));
}

/**
 * Calculate hit chance based on attacker accuracy and target evasion
 * @param {Object} attacker - Attacking unit (unused for now, but available for future accuracy modifiers)
 * @param {Object} defender - Defending unit
 * @returns {number} Hit chance as a decimal (0.1 to 1.0)
 */
export function calculateHitChance(attacker, defender) {
  const baseAccuracy = 0.95; // 95% base hit chance
  const defenderEvasion = getEffectiveEvasion(defender);
  const hitChance = baseAccuracy - defenderEvasion;

  // Ensure minimum 10% hit chance
  return Math.max(0.1, hitChance);
}

export function starEffectChanceMultiplier(star) {
  if (star <= 1) return 1;
  if (star === 2) return 1.4;
  return 2.0;
}

export function starTargetBonus(star) {
  if (star <= 1) return 0;
  if (star === 2) return 1;
  return 2;
}

export function starAreaBonus(star) {
  return Math.max(0, star - 1);
}

export function getWaspMaxTargets(unit, skill) {
  // For wasp_triple_strike skill, maxHits scales with star level
  if (skill.id === "wasp_triple_strike") {
    return Math.max(1, Math.min(3, unit.star ?? 1));
  }
  // For other skills, return the skill's default maxHits
  return skill.maxHits;
}

export function scaledBaseStats(baseStats, star, classType) {
  const mult = starMultiplier(star);
  const evasionBase = getBaseEvasion(classType);
  const evasionBonus = star <= 1 ? 0 : star === 2 ? 0.05 : 0.10;
  return {
    hp: Math.round(baseStats.hp * mult),
    atk: Math.round(baseStats.atk * mult),
    def: Math.round(baseStats.def * mult),
    matk: Math.round(baseStats.matk * mult),
    mdef: Math.round(baseStats.mdef * mult),
    range: baseStats.range,
    rageMax: baseStats.rageMax,
    evasion: Math.min(0.60, evasionBase + evasionBonus)
  };
}

export function getGoldReserveScaling(gold) {
  // Handle invalid inputs: negative, non-numeric, null/undefined
  if (typeof gold !== 'number' || gold < 0 || !isFinite(gold)) {
    return 1.0;
  }

  const baselineGold = 10;
  const goldPerPercent = 2;
  const maxMultiplier = 2.0;

  // No bonus at or below baseline
  if (gold <= baselineGold) {
    return 1.0;
  }

  // Calculate bonus: +1% per 2 gold above baseline
  const excessGold = gold - baselineGold;
  const bonusPercent = excessGold / goldPerPercent;
  const multiplier = 1.0 + (bonusPercent / 100);

  // Cap at maximum multiplier (2.0 = 100% bonus at 210 gold)
  return Math.min(multiplier, maxMultiplier);
}

/**
 * Get effective skill ID for a unit, potentially upgrading to _v2 variant
 * @param {string} baseSkillId - Base skill ID from unit definition
 * @param {string} classType - Unit class (ASSASSIN, MAGE, etc.)
 * @param {number} star - Star level (1-3)
 * @param {Object} skillLibrary - SKILL_LIBRARY object to check for upgraded skills
 * @returns {string} Skill ID to use (may be upgraded variant)
 */
export function getEffectiveSkillId(baseSkillId, classType, star, skillLibrary) {
  // Only ASSASSIN units with 2-3 stars qualify for upgrades
  if (classType !== 'ASSASSIN' || star < 2) {
    return baseSkillId;
  }

  // Construct upgraded skill ID
  const upgradedSkillId = `${baseSkillId}_v2`;

  // Check if upgraded skill exists in library
  if (skillLibrary && skillLibrary[upgradedSkillId]) {
    return upgradedSkillId;
  }

  // Fall back to base skill
  return baseSkillId;
}

export function gridKey(row, col) {
  return `${row}:${col}`;
}

export function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export function findClosest(targets, myCol) {
  return targets.reduce((closest, target) => {
    const distCurrent = Math.abs(target.col - myCol);
    const distClosest = Math.abs(closest.col - myCol);
    return distCurrent < distClosest ? target : closest;
  });
}

export function findTargetMeleeFrontline(myRow, myCol, enemies) {
  // 1. Tìm cùng hàng
  const sameRow = enemies.filter(e => e.row === myRow);
  if (sameRow.length > 0) {
    return findClosest(sameRow, myCol); // Gần nhất theo cột
  }

  // 2. Tìm theo thứ tự: lên 1, xuống 1, lên 2, xuống 2
  const searchOrder = [
    myRow - 1,  // Lên 1
    myRow + 1,  // Xuống 1
    myRow - 2,  // Lên 2
    myRow + 2   // Xuống 2
  ];

  for (const row of searchOrder) {
    const targets = enemies.filter(e => e.row === row);
    if (targets.length > 0) {
      return findClosest(targets, myCol);
    }
  }

  return null; // Không tìm thấy
}

export function findTargetAssassin(myRow, enemies) {
  // Chỉ tìm cùng hàng
  const sameRow = enemies.filter(e => e.row === myRow);
  if (sameRow.length === 0) return null;

  // Chọn xa nhất theo cự ly cột
  return sameRow.reduce((farthest, target) => {
    // Vì không có myCol, ta đơn giản tìm mục tiêu có cột lớn nhất (thường là hàng sau của enemy bên trái đánh phải)
    // Nhưng để chính xác cho bất kể bên nào: cột xa nhất là cột khác biệt nhiều nhất so với 4.5 (giữa bàn cờ)
    // Hoặc nếu enemies là phe phải, cột của nó là 5..9. Xa nhất với phe trái đánh phải là cột 9 (max).
    // Phe phải đánh trái, xa nhất là cột 0 (min).
    // "xa nhất cùng hàng"
    // Nếu side chưa biết, dùng giả định: phe trái tiến sang phải (tìm max col), phe phải tiến trái (tìm min col)
    // Thực tế unit có target.col. Ta sẽ tìm target.col lớn nhất.
    return target.col > farthest.col ? target : farthest;
  });
}

export function findTargetRanged(myRow, myCol, range, enemies) {
  // Chỉ tìm cùng hàng và trong tầm
  const sameRow = enemies.filter(e =>
    e.row === myRow &&
    Math.abs(e.col - myCol) <= range
  );

  if (sameRow.length === 0) return null;

  // Chọn gần nhất
  return findClosest(sameRow, myCol);
}
