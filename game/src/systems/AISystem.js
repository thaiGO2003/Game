/**
 * AISystem - Manages AI opponent logic
 * 
 * This system handles:
 * - Enemy team generation with budget constraints
 * - Difficulty scaling (EASY, MEDIUM, HARD)
 * - Round-based strength scaling
 * - AI decision making for combat
 * 
 * Requirements: 1.1, 1.6, 13.4
 */

import { UNIT_CATALOG } from '../data/unitCatalog.js';
import { getDeployCapByLevel } from '../core/gameUtils.js';

/**
 * AI difficulty settings configuration
 */
const AI_SETTINGS = {
  EASY: {
    label: "Dễ",
    hpMult: 0.84,
    atkMult: 0.82,
    matkMult: 0.82,
    rageGain: 1,
    randomTargetChance: 0.58,
    teamSizeBonus: 0,
    teamGrowthEvery: 5,
    teamGrowthCap: 1,
    budgetMult: 0.9,
    levelBonus: 0,
    maxTierBonus: 0,
    star2Bonus: -0.05,
    star3Bonus: -0.02
  },
  MEDIUM: {
    label: "Trung bình",
    hpMult: 0.95,
    atkMult: 0.93,
    matkMult: 0.93,
    rageGain: 1,
    randomTargetChance: 0.3,
    teamSizeBonus: 1,
    teamGrowthEvery: 4,
    teamGrowthCap: 2,
    budgetMult: 1,
    levelBonus: 0,
    maxTierBonus: 0,
    star2Bonus: -0.01,
    star3Bonus: -0.01
  },
  HARD: {
    label: "Khó",
    hpMult: 1.05,
    atkMult: 1.04,
    matkMult: 1.04,
    rageGain: 1,
    randomTargetChance: 0.12,
    teamSizeBonus: 2,
    teamGrowthEvery: 3,
    teamGrowthCap: 3,
    budgetMult: 1.08,
    levelBonus: 1,
    maxTierBonus: 1,
    star2Bonus: 0,
    star3Bonus: 0.01
  }
};

/**
 * Role composition profiles for different difficulty levels
 */
const AI_ROLE_PROFILES = {
  EASY: {
    minFrontRatio: 0.55,
    nonFrontBias: 0.18,
    weights: { 
      TANKER: 0.36, 
      FIGHTER: 0.28, 
      ARCHER: 0.14, 
      SUPPORT: 0.1, 
      MAGE: 0.07, 
      ASSASSIN: 0.05 
    }
  },
  MEDIUM: {
    minFrontRatio: 0.42,
    nonFrontBias: 0.32,
    weights: { 
      TANKER: 0.24, 
      FIGHTER: 0.24, 
      ARCHER: 0.17, 
      SUPPORT: 0.13, 
      MAGE: 0.13, 
      ASSASSIN: 0.09 
    }
  },
  HARD: {
    minFrontRatio: 0.34,
    nonFrontBias: 0.45,
    weights: { 
      TANKER: 0.19, 
      FIGHTER: 0.19, 
      ARCHER: 0.18, 
      SUPPORT: 0.15, 
      MAGE: 0.16, 
      ASSASSIN: 0.13 
    }
  }
};

/**
 * Utility function to clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Utility function to select a random item from an array
 * @param {Array} array - Array to select from
 * @returns {*} Random item from array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate enemy team based on round, budget, and difficulty
 * 
 * @param {number} round - Current round number
 * @param {number} budget - Budget for unit selection
 * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD)
 * @param {boolean} sandbox - Whether sandbox mode is active
 * @returns {Array<{baseId: string, star: number, row: number, col: number}>} Array of enemy units with positions
 */
export function generateEnemyTeam(round, budget, difficulty = 'MEDIUM', sandbox = false) {
  const ai = AI_SETTINGS[difficulty] ?? AI_SETTINGS.MEDIUM;
  const modeFactor = ai.budgetMult ?? 1;
  const estLevel = clamp(1 + Math.floor(round / 2) + (ai.levelBonus ?? 0), 1, 15);
  const teamSize = computeEnemyTeamSize(round, difficulty, sandbox);
  const actualBudget = Math.round((8 + round * (sandbox ? 2.1 : 2.6)) * modeFactor);
  const maxTier = clamp(1 + Math.floor(round / 3) + (ai.maxTierBonus ?? 0), 1, 5);
  const pool = UNIT_CATALOG.filter((u) => u.tier <= maxTier);

  const picks = [];
  let coins = actualBudget;
  let frontCount = 0;
  const roleCounts = {
    TANKER: 0,
    FIGHTER: 0,
    ASSASSIN: 0,
    ARCHER: 0,
    MAGE: 0,
    SUPPORT: 0
  };
  
  const roleProfile = AI_ROLE_PROFILES[difficulty] ?? AI_ROLE_PROFILES.MEDIUM;
  let guard = 0;
  
  // Generate unit picks based on budget and role composition
  while (picks.length < teamSize && guard < 260) {
    guard += 1;
    let candidates = pool.filter((u) => u.tier <= Math.max(1, coins));
    if (!candidates.length) candidates = pool.filter((u) => u.tier === 1);
    if (!candidates.length) break;

    let pick = null;
    
    // Try to pick by weighted class selection
    const targetClass = pickClassByWeights(roleProfile.weights);
    const byClass = candidates.filter((u) => u.classType === targetClass);
    if (byClass.length) {
      const minRoleCount = Math.min(...Object.values(roleCounts));
      const diversityPool = byClass.filter((u) => roleCounts[u.classType] <= minRoleCount + 1);
      pick = randomItem(diversityPool.length ? diversityPool : byClass);
    }
    
    // Ensure minimum front line ratio
    if (!pick && frontCount < Math.ceil(teamSize * roleProfile.minFrontRatio)) {
      const frontPool = candidates.filter((u) => u.classType === "TANKER" || u.classType === "FIGHTER");
      if (frontPool.length) pick = randomItem(frontPool);
    }
    
    // Apply non-front bias
    if (!pick && Math.random() < roleProfile.nonFrontBias) {
      const nonFrontPool = candidates.filter((u) => u.classType !== "TANKER" && u.classType !== "FIGHTER");
      if (nonFrontPool.length) pick = randomItem(nonFrontPool);
    }
    
    // Fallback to random candidate
    if (!pick) pick = randomItem(candidates);

    // Determine star level based on round progression
    let star = 1;
    const starRoll = Math.random();
    const twoStarChance = clamp((round - 6) * 0.045 + (ai.star2Bonus ?? 0), 0, 0.38);
    const threeStarChance = clamp((round - 11) * 0.018 + (ai.star3Bonus ?? 0), 0, 0.08);
    if (starRoll < threeStarChance) star = 3;
    else if (starRoll < threeStarChance + twoStarChance) star = 2;

    picks.push({ baseId: pick.id, classType: pick.classType, tier: pick.tier, star });
    if (pick.classType === "TANKER" || pick.classType === "FIGHTER") frontCount += 1;
    roleCounts[pick.classType] = (roleCounts[pick.classType] ?? 0) + 1;
    coins -= Math.max(1, pick.tier - (star - 1));
    
    // Stop if budget exhausted and minimum team size reached
    if (coins <= 0 && picks.length >= Math.ceil(teamSize * 0.7)) break;
  }

  // Fallback if no picks were made
  if (!picks.length) {
    const fallback = randomItem(UNIT_CATALOG.filter((u) => u.tier === 1));
    picks.push({ baseId: fallback.id, classType: fallback.classType, tier: fallback.tier, star: 1 });
  }

  // Assign positions based on unit roles
  return assignPositions(picks);
}

/**
 * Compute enemy team size based on round and difficulty
 * 
 * @param {number} round - Current round number
 * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD)
 * @param {boolean} sandbox - Whether sandbox mode is active
 * @returns {number} Team size
 */
export function computeEnemyTeamSize(round, difficulty = 'MEDIUM', sandbox = false) {
  const ai = AI_SETTINGS[difficulty] ?? AI_SETTINGS.MEDIUM;
  const estLevel = clamp(1 + Math.floor(round / 2) + (ai.levelBonus ?? 0), 1, 15);
  const base = getDeployCapByLevel(estLevel);
  const flatBonus = ai?.teamSizeBonus ?? 0;
  const growthEvery = Math.max(1, ai?.teamGrowthEvery ?? 4);
  const growthCap = Math.max(0, ai?.teamGrowthCap ?? 2);
  const roundGrowth = clamp(Math.floor((round - 1) / growthEvery), 0, growthCap);
  const sandboxPenalty = sandbox ? 1 : 0;
  return clamp(base + flatBonus + roundGrowth - sandboxPenalty, 2, 15);
}

/**
 * Get AI difficulty multiplier for stats
 * 
 * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD)
 * @returns {{hpMult: number, atkMult: number, matkMult: number, rageGain: number, randomTargetChance: number}} Difficulty multipliers
 */
export function getAIDifficultyMultiplier(difficulty = 'MEDIUM') {
  const ai = AI_SETTINGS[difficulty] ?? AI_SETTINGS.MEDIUM;
  return {
    hpMult: ai.hpMult,
    atkMult: ai.atkMult,
    matkMult: ai.matkMult,
    rageGain: ai.rageGain,
    randomTargetChance: ai.randomTargetChance
  };
}

/**
 * Make AI decision for combat action
 * Determines whether to use skill or basic attack, and selects target
 * 
 * @param {Object} state - Combat state with all units
 * @param {Object} aiUnit - AI unit taking action
 * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD)
 * @returns {{action: 'SKILL'|'ATTACK'|'SKIP', target: Object|null, reason: string}} AI action decision
 */
export function makeAIDecision(state, aiUnit, difficulty = 'MEDIUM') {
  // Check if unit should skip turn (stunned, etc.)
  if (aiUnit.statuses?.stun > 0) {
    return { action: 'SKIP', target: null, reason: 'stunned' };
  }

  // Select target
  const target = selectTarget(aiUnit, state, difficulty, { deterministic: false });
  if (!target) {
    return { action: 'SKIP', target: null, reason: 'no_target' };
  }

  // Decide between skill and basic attack
  const shouldUseSkill = aiUnit.rage >= (aiUnit.rageMax || 100) && 
                         (aiUnit.statuses?.silence || 0) <= 0 &&
                         aiUnit.skillId;

  if (shouldUseSkill) {
    return { action: 'SKILL', target, reason: 'rage_full' };
  }

  // Check if disarmed
  if ((aiUnit.statuses?.disarmTurns || 0) > 0) {
    return { action: 'SKIP', target: null, reason: 'disarmed' };
  }

  return { action: 'ATTACK', target, reason: 'basic_attack' };
}

/**
 * Select target for an attacker unit
 * Implements tactical target selection based on unit role and positioning
 * 
 * @param {Object} attacker - Attacking unit
 * @param {Object} state - Combat state with all units
 * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD)
 * @param {Object} options - Options {deterministic: boolean}
 * @returns {Object|null} Selected target unit or null
 */
export function selectTarget(attacker, state, difficulty = 'MEDIUM', options = {}) {
  const enemySide = attacker.side === 'LEFT' ? 'RIGHT' : 'LEFT';
  const enemies = (state.units || []).filter(u => u.side === enemySide && u.alive);
  
  if (!enemies.length) return null;

  // Check for taunt (forced target)
  if (attacker.statuses?.tauntTargetId) {
    const forced = enemies.find(e => e.uid === attacker.statuses.tauntTargetId);
    if (forced) return forced;
  }

  const ai = AI_SETTINGS[difficulty] || AI_SETTINGS.MEDIUM;
  const keepFrontline = attacker.range <= 1 && attacker.classType !== 'ASSASSIN';
  const allowRandomTarget = attacker.classType !== 'ASSASSIN';

  // AI random target chance (only for AI units on RIGHT side)
  if (
    attacker.side === 'RIGHT' &&
    allowRandomTarget &&
    !keepFrontline &&
    !options.deterministic &&
    Math.random() < ai.randomTargetChance
  ) {
    return randomItem(enemies);
  }

  // Role-based target selection
  let target = null;
  if (attacker.range <= 1 && attacker.classType !== 'ASSASSIN') {
    // Melee frontline (Tank/Fighter)
    target = findTargetMeleeFrontline(attacker, enemies);
  } else if (attacker.classType === 'ASSASSIN') {
    // Assassin targets backline
    target = findTargetAssassin(attacker, enemies);
  } else {
    // Ranged units (Archer/Mage/Support)
    target = findTargetRanged(attacker, enemies);
  }

  // Fallback: sort by priority and pick best
  if (!target) {
    const sorted = [...enemies].sort((a, b) => compareTargets(attacker, a, b));
    return sorted[0] || null;
  }

  return target;
}

/**
 * Find target for melee frontline units (Tank/Fighter)
 * Prioritizes closest column, same row
 * 
 * @param {Object} attacker - Attacking unit
 * @param {Array} enemies - Array of enemy units
 * @returns {Object|null} Selected target or null
 */
function findTargetMeleeFrontline(attacker, enemies) {
  const myRow = attacker.row;
  const myCol = attacker.col;
  
  // Find closest enemy by column distance
  let best = null;
  let bestScore = Infinity;
  
  enemies.forEach(enemy => {
    const colDist = Math.abs(enemy.col - myCol);
    const rowDist = Math.abs(enemy.row - myRow);
    const sameRow = enemy.row === myRow ? 0 : 1;
    
    // Score: [colDist, sameRow, rowDist]
    const score = colDist * 1000 + sameRow * 100 + rowDist;
    
    if (score < bestScore) {
      bestScore = score;
      best = enemy;
    }
  });
  
  return best;
}

/**
 * Find target for assassin units
 * Prioritizes farthest column (backline), same row
 * 
 * @param {Object} attacker - Attacking unit
 * @param {Array} enemies - Array of enemy units
 * @returns {Object|null} Selected target or null
 */
function findTargetAssassin(attacker, enemies) {
  const myRow = attacker.row;
  
  // Find farthest enemy (backline)
  let best = null;
  let bestScore = -Infinity;
  
  enemies.forEach(enemy => {
    const farthestCol = attacker.side === 'LEFT' ? -enemy.col : enemy.col;
    const sameRow = enemy.row === myRow ? 0 : 1;
    const rowDist = Math.abs(enemy.row - myRow);
    
    // Score: [-farthestCol, sameRow, rowDist] (negative for max)
    const score = farthestCol * 1000 - sameRow * 100 - rowDist;
    
    if (score > bestScore) {
      bestScore = score;
      best = enemy;
    }
  });
  
  return best;
}

/**
 * Find target for ranged units (Archer/Mage/Support)
 * Prioritizes same row, then closest
 * 
 * @param {Object} attacker - Attacking unit
 * @param {Array} enemies - Array of enemy units
 * @returns {Object|null} Selected target or null
 */
function findTargetRanged(attacker, enemies) {
  const myRow = attacker.row;
  const myCol = attacker.col;
  
  // Find target prioritizing same row
  let best = null;
  let bestScore = Infinity;
  
  enemies.forEach(enemy => {
    const sameRow = enemy.row === myRow ? 0 : 1;
    const rowDist = Math.abs(enemy.row - myRow);
    const colDist = Math.abs(enemy.col - myCol);
    
    // Score: [sameRow, rowDist, colDist]
    const score = sameRow * 1000 + rowDist * 100 + colDist;
    
    if (score < bestScore) {
      bestScore = score;
      best = enemy;
    }
  });
  
  return best;
}

/**
 * Compare two targets for priority sorting
 * 
 * @param {Object} attacker - Attacking unit
 * @param {Object} a - First target
 * @param {Object} b - Second target
 * @returns {number} Comparison result (-1, 0, 1)
 */
function compareTargets(attacker, a, b) {
  const sa = scoreTarget(attacker, a);
  const sb = scoreTarget(attacker, b);
  
  for (let i = 0; i < sa.length; i += 1) {
    if (sa[i] !== sb[i]) return sa[i] - sb[i];
  }
  
  return 0;
}

/**
 * Score a target for priority calculation
 * Returns array of priority values for comparison
 * 
 * @param {Object} attacker - Attacking unit
 * @param {Object} target - Target unit
 * @returns {Array<number>} Priority score array
 */
function scoreTarget(attacker, target) {
  const myRow = attacker.row;
  const myCol = attacker.col;
  const targetRow = target.row;
  const targetCol = target.col;

  const colDist = Math.abs(targetCol - myCol);
  const rowDist = Math.abs(targetRow - myRow);
  const sameRow = targetRow === myRow ? 0 : 1;
  const totalDist = colDist + rowDist;

  // HP tiebreaker
  const hpRatio = Math.round((target.hp / target.maxHp) * 1000);
  const hpRaw = target.hp;

  // Melee units (Tank/Fighter)
  if (attacker.range <= 1) {
    if (attacker.classType === 'ASSASSIN') {
      // Assassin: Farthest column → Same row → Row distance
      const farthestCol = attacker.side === 'LEFT' ? -targetCol : targetCol;
      return [farthestCol, sameRow, rowDist, totalDist, hpRatio, hpRaw];
    } else {
      // Tank/Fighter: Closest column → Same row → Row distance
      return [colDist, sameRow, rowDist, totalDist, hpRatio, hpRaw];
    }
  }

  // Ranged units (Archer/Mage/Support): Same row → Row distance → Column distance
  return [sameRow, rowDist, colDist, totalDist, hpRatio, hpRaw];
}

/**
 * Pick a class based on weighted probabilities
 * 
 * @param {Object} weights - Class weights {TANKER: 0.3, FIGHTER: 0.2, ...}
 * @returns {string} Selected class type
 */
function pickClassByWeights(weights) {
  const roll = Math.random();
  let cumulative = 0;
  for (const [classType, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) return classType;
  }
  return 'FIGHTER'; // Fallback
}

/**
 * Assign board positions to enemy units based on their roles
 * 
 * @param {Array<{baseId: string, classType: string, tier: number, star: number}>} picks - Unit picks
 * @returns {Array<{baseId: string, star: number, row: number, col: number}>} Units with positions
 */
function assignPositions(picks) {
  // Define position slots for different roles
  const frontSlots = [
    { row: 2, col: 5 }, { row: 1, col: 5 }, { row: 3, col: 5 }, { row: 2, col: 6 }, 
    { row: 0, col: 5 }, { row: 4, col: 5 }, { row: 1, col: 6 }, { row: 3, col: 6 }, 
    { row: 2, col: 7 }, { row: 0, col: 6 }, { row: 4, col: 6 }, { row: 1, col: 7 }
  ];
  const backSlots = [
    { row: 2, col: 9 }, { row: 1, col: 9 }, { row: 3, col: 9 }, { row: 2, col: 8 }, 
    { row: 0, col: 9 }, { row: 4, col: 9 }, { row: 1, col: 8 }, { row: 3, col: 8 }, 
    { row: 0, col: 8 }, { row: 4, col: 8 }, { row: 2, col: 7 }, { row: 1, col: 7 }
  ];
  const assassinSlots = [
    { row: 0, col: 9 }, { row: 4, col: 9 }, { row: 1, col: 9 }, { row: 3, col: 9 }, 
    { row: 0, col: 8 }, { row: 4, col: 8 }
  ];
  
  const used = new Set();
  const takeSlot = (list) => {
    for (let i = 0; i < list.length; i += 1) {
      const key = `${list[i].row}:${list[i].col}`;
      if (used.has(key)) continue;
      used.add(key);
      return list[i];
    }
    return null;
  };

  const units = [];
  
  // Order units by role priority: front line first, then back line, then assassins
  const ordered = [
    ...picks.filter((p) => p.classType === "TANKER" || p.classType === "FIGHTER"),
    ...picks.filter((p) => p.classType === "SUPPORT" || p.classType === "MAGE" || p.classType === "ARCHER"),
    ...picks.filter((p) => p.classType === "ASSASSIN")
  ];
  
  ordered.forEach((pick) => {
    let slot = null;
    if (pick.classType === "TANKER" || pick.classType === "FIGHTER") {
      slot = takeSlot(frontSlots) ?? takeSlot(backSlots);
    } else if (pick.classType === "ASSASSIN") {
      slot = takeSlot(assassinSlots) ?? takeSlot(backSlots) ?? takeSlot(frontSlots);
    } else {
      slot = takeSlot(backSlots) ?? takeSlot(frontSlots);
    }
    if (!slot) return;
    units.push({ baseId: pick.baseId, star: pick.star, row: slot.row, col: slot.col });
  });

  return units;
}

/**
 * Get AI settings for a specific difficulty
 * 
 * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD)
 * @returns {Object} AI settings object
 */
export function getAISettings(difficulty = 'MEDIUM') {
  return AI_SETTINGS[difficulty] ?? AI_SETTINGS.MEDIUM;
}

// Export AI_SETTINGS for backward compatibility
export { AI_SETTINGS };
