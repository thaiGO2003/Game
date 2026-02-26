/**
 * AISystem - AI Opponent Management System
 * 
 * Manages AI opponent logic including enemy team generation, difficulty scaling,
 * and tactical decision making for combat.
 * This system is independent of Phaser and uses pure functions where possible.
 * 
 * **Validates: Requirements 1.1, 1.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 13.4**
 */

import { UNIT_CATALOG } from '../data/unitCatalog.js';
import { getDeployCapByLevel } from '../core/gameUtils.js';

/**
 * AI difficulty settings configuration
 */
export const AI_SETTINGS = {
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
    maxStar: 1,
    star2Bonus: -1,
    star3Bonus: -1,
    equipStartRound: 8,      // Trang bị từ round 8
    equipBaseChance: 0.10,   // 10% cơ bản
    equipGrowth: 0.02,       // +2% mỗi round
    equipMaxChance: 0.35,    // Cap 35%
    equipMaxTier: 1
  },
  MEDIUM: {
    label: "Trung bình",
    hpMult: 0.95,
    atkMult: 0.93,
    matkMult: 0.93,
    rageGain: 1,
    randomTargetChance: 0.3,
    teamSizeBonus: 0,       // Giống EASY
    teamGrowthEvery: 5,     // Giống EASY
    teamGrowthCap: 1,       // Giống EASY
    budgetMult: 1,
    levelBonus: 0,
    maxTierBonus: 0,
    maxStar: 2,              // Tối đa 2★
    minStar2Round: 5,        // Guarantee 1× 2★ từ round 5
    star2Bonus: -0.02,
    star3Bonus: -1,           // Không cho 3★
    equipStartRound: 6,      // Trang bị từ round 6
    equipBaseChance: 0.12,   // 12% cơ bản
    equipGrowth: 0.03,       // +3% mỗi round
    equipMaxChance: 0.55,    // Cap 55%
    equipMaxTier: 2
  },
  HARD: {
    label: "Khó",
    hpMult: 1.05,
    atkMult: 1.04,
    matkMult: 1.04,
    rageGain: 1,
    randomTargetChance: 0.12,
    teamSizeBonus: 1,
    teamGrowthEvery: 4,
    teamGrowthCap: 2,
    budgetMult: 1.05,
    levelBonus: 1,
    maxTierBonus: 1,
    maxStar: 3,              // Cho phép 3★
    minStar2Round: 4,        // Guarantee 1× 2★ từ round 4
    minStar3Round: 14,       // Guarantee 1× 3★ từ round 14
    star2Bonus: 0,
    star3Bonus: 0,
    equipStartRound: 5,
    equipBaseChance: 0.15,
    equipGrowth: 0.04,
    equipMaxChance: 0.70,
    equipMaxTier: 3
  }
};

/**
 * Gets AI settings configuration for a specific difficulty level
 * Returns stat multipliers, rage gain, targeting behavior, and team composition settings
 * 
 * @param {string} difficulty - Difficulty level (EASY, MEDIUM, HARD), defaults to MEDIUM
 * @returns {Object} AI settings object with multipliers and configuration
 * @returns {string} return.label - Display label for difficulty
 * @returns {number} return.hpMult - HP multiplier for enemy units
 * @returns {number} return.atkMult - Attack multiplier for enemy units
 * @returns {number} return.matkMult - Magic attack multiplier for enemy units
 * @returns {number} return.rageGain - Rage gain multiplier
 * @returns {number} return.randomTargetChance - Probability of random target selection
 * @returns {number} return.teamSizeBonus - Flat bonus to team size
 * @returns {number} return.teamGrowthEvery - Rounds between team size growth
 * @returns {number} return.teamGrowthCap - Maximum team size growth
 * @returns {number} return.budgetMult - Budget multiplier for unit selection
 * @returns {number} return.levelBonus - Bonus to estimated level
 * @returns {number} return.maxTierBonus - Bonus to maximum tier available
 * @returns {number} return.star2Bonus - Bonus to 2-star unit chance
 * @returns {number} return.star3Bonus - Bonus to 3-star unit chance
 * 
 * @example
 * const settings = getAISettings('HARD');
 * console.log(settings.hpMult); // 1.05
 * console.log(settings.randomTargetChance); // 0.12
 * 
 * **Validates: Requirements 7.2, 7.3**
 */
export function getAISettings(difficulty = 'MEDIUM') {
  return AI_SETTINGS[difficulty] ?? AI_SETTINGS.MEDIUM;
}

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
 * Utility function to clamp a value between minimum and maximum bounds
 * 
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value between min and max (inclusive)
 * 
 * @example
 * clamp(15, 0, 10); // Returns 10
 * clamp(-5, 0, 10); // Returns 0
 * clamp(5, 0, 10);  // Returns 5
 * 
 * @private
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Utility function to select a random item from an array
 * 
 * @param {Array} array - Array to select from (must not be empty)
 * @returns {*} Random item from the array
 * 
 * @example
 * const units = ['warrior', 'mage', 'archer'];
 * const random = randomItem(units); // Returns one of the three units
 * 
 * @private
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates an enemy team based on round number, budget, and difficulty
 * Creates a balanced team composition with appropriate unit tiers and star levels
 * Considers role distribution (tanks, damage dealers, support) for tactical variety
 * 
 * @param {number} round - Current round number (affects team strength and composition)
 * @param {number} budget - Budget constraint for unit selection (currently unused, calculated internally)
 * @param {string} difficulty - Difficulty level: "EASY", "MEDIUM", or "HARD" (default: "MEDIUM")
 * @param {boolean} sandbox - Whether sandbox mode is active (affects team size penalty)
 * @returns {Array<Object>} Array of enemy units with positions
 * @returns {string} return[].baseId - Unit base ID from catalog
 * @returns {number} return[].star - Star level (1-3)
 * @returns {number} return[].row - Board row position (0-4)
 * @returns {number} return[].col - Board column position (5-9 for enemy side)
 * 
 * @example
 * // Generate medium difficulty enemy team for round 5
 * const enemies = generateEnemyTeam(5, 50, 'MEDIUM', false);
 * // Returns: [{baseId: 'warrior', star: 1, row: 2, col: 5}, ...]
 * 
 * @example
 * // Generate hard difficulty enemy team for round 10
 * const hardEnemies = generateEnemyTeam(10, 100, 'HARD', false);
 * // Returns larger team with higher star units
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.5, 7.6, 7.7**
 */
export function generateEnemyTeam(round, budget, difficulty = 'MEDIUM', sandbox = false) {
  const ai = AI_SETTINGS[difficulty] ?? AI_SETTINGS.MEDIUM;
  const modeFactor = ai.budgetMult ?? 1;
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
    const maxStar = ai.maxStar ?? 3;
    if (maxStar >= 2) {
      const starRoll = Math.random();
      const twoStarChance = clamp((round - 6) * 0.045 + (ai.star2Bonus ?? 0), 0, 0.38);
      const threeStarChance = maxStar >= 3 ? clamp((round - 11) * 0.018 + (ai.star3Bonus ?? 0), 0, 0.08) : 0;
      if (starRoll < threeStarChance) star = 3;
      else if (starRoll < threeStarChance + twoStarChance) star = 2;
    }

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

  // ── Star guarantee: nâng random units lên 2★/3★ nếu chưa đủ ──
  const minStar2Round = ai.minStar2Round ?? Infinity;
  const minStar3Round = ai.minStar3Round ?? Infinity;
  const maxStar = ai.maxStar ?? 3;

  if (round >= minStar2Round && maxStar >= 2) {
    // Số lượng 2★ guarantee: 1 ở minRound, thêm 1 mỗi 4 rounds
    const guaranteed2Star = clamp(1 + Math.floor((round - minStar2Round) / 4), 1, Math.ceil(picks.length * 0.5));
    let current2Plus = picks.filter(p => p.star >= 2).length;
    // Nâng random units lên 2★ cho đến khi đủ
    for (let i = 0; i < picks.length && current2Plus < guaranteed2Star; i++) {
      if (picks[i].star < 2) {
        picks[i].star = 2;
        current2Plus++;
      }
    }
  }

  if (round >= minStar3Round && maxStar >= 3) {
    // Guarantee 1× 3★ ở minRound, thêm 1 mỗi 6 rounds
    const guaranteed3Star = clamp(1 + Math.floor((round - minStar3Round) / 6), 1, Math.ceil(picks.length * 0.25));
    let current3 = picks.filter(p => p.star >= 3).length;
    // Nâng unit tier cao nhất lên 3★
    const sorted = picks.map((p, idx) => ({ idx, tier: p.tier })).sort((a, b) => b.tier - a.tier);
    for (const { idx } of sorted) {
      if (current3 >= guaranteed3Star) break;
      if (picks[idx].star < 3) {
        picks[idx].star = 3;
        current3++;
      }
    }
  }

  // Assign positions based on unit roles
  return assignPositions(picks);
}

/**
 * Computes enemy team size based on round number and difficulty
 * Team size increases with rounds and varies by difficulty level
 * 
 * @param {number} round - Current round number
 * @param {string} difficulty - Difficulty level: "EASY", "MEDIUM", or "HARD" (default: "MEDIUM")
 * @param {boolean} sandbox - Whether sandbox mode is active (reduces team size by 1)
 * @returns {number} Team size (number of units), clamped between 2 and 15
 * 
 * @example
 * // Early game, medium difficulty
 * computeEnemyTeamSize(1, 'MEDIUM', false); // Returns ~5
 * 
 * @example
 * // Late game, hard difficulty
 * computeEnemyTeamSize(20, 'HARD', false); // Returns ~12
 * 
 * **Validates: Requirements 7.2, 7.6**
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
 * Gets AI difficulty multipliers for combat stats
 * Returns multipliers that scale enemy unit stats based on difficulty
 * 
 * @param {string} difficulty - Difficulty level: "EASY", "MEDIUM", or "HARD" (default: "MEDIUM")
 * @returns {Object} Difficulty multipliers object
 * @returns {number} return.hpMult - HP multiplier (0.84 for EASY, 0.95 for MEDIUM, 1.05 for HARD)
 * @returns {number} return.atkMult - Attack multiplier
 * @returns {number} return.matkMult - Magic attack multiplier
 * @returns {number} return.rageGain - Rage gain multiplier (currently 1 for all difficulties)
 * @returns {number} return.randomTargetChance - Probability of random target selection
 * 
 * @example
 * const mult = getAIDifficultyMultiplier('HARD');
 * enemyUnit.hp *= mult.hpMult;    // Increase HP by 5%
 * enemyUnit.atk *= mult.atkMult;  // Increase attack by 4%
 * 
 * **Validates: Requirements 7.2, 7.3**
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
 * Makes AI decision for combat action
 * Determines whether to use skill, basic attack, or skip turn
 * Selects appropriate target based on unit role and tactical considerations
 * 
 * @param {Object} state - Combat state with all units and game state
 * @param {Object} aiUnit - AI unit taking action
 * @param {string} difficulty - Difficulty level: "EASY", "MEDIUM", or "HARD" (default: "MEDIUM")
 * @returns {Object} AI action decision
 * @returns {'SKILL'|'ATTACK'|'SKIP'} return.action - Action type to perform
 * @returns {Object|null} return.target - Target unit for the action (null if SKIP)
 * @returns {string} return.reason - Reason for the decision (for debugging/logging)
 * 
 * @example
 * const decision = makeAIDecision(combatState, enemyUnit, 'MEDIUM');
 * if (decision.action === 'SKILL') {
 *   executeSkill(enemyUnit, decision.target);
 * } else if (decision.action === 'ATTACK') {
 *   executeBasicAttack(enemyUnit, decision.target);
 * }
 * 
 * **Validates: Requirements 7.4, 7.5**
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
 * Selects target for an attacker unit using tactical AI
 * Implements role-based target selection:
 * - Melee frontline (Tank/Fighter): Targets closest enemy, prefers same row
 * - Assassins: Targets backline (farthest column), prefers same row
 * - Ranged (Archer/Mage/Support): Targets same row first, then closest
 * 
 * @param {Object} attacker - Attacking unit with position and role information
 * @param {Object} state - Combat state with all units
 * @param {string} difficulty - Difficulty level: "EASY", "MEDIUM", or "HARD" (default: "MEDIUM")
 * @param {Object} options - Optional configuration
 * @param {boolean} options.deterministic - If true, disables random target selection (for testing)
 * @returns {Object|null} Selected target unit or null if no valid targets
 * 
 * @example
 * // Tank selects closest enemy
 * const target = selectTarget(tankUnit, state, 'MEDIUM');
 * 
 * @example
 * // Assassin targets backline
 * const target = selectTarget(assassinUnit, state, 'HARD');
 * 
 * @example
 * // Deterministic selection for testing
 * const target = selectTarget(unit, state, 'MEDIUM', { deterministic: true });
 * 
 * **Validates: Requirements 7.4, 7.5**
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
 * Finds target for melee frontline units (Tank/Fighter)
 * Prioritizes closest column, then same row, then closest row
 * 
 * @param {Object} attacker - Attacking unit with position
 * @param {Array<Object>} enemies - Array of enemy units to choose from
 * @returns {Object|null} Selected target or null if no enemies
 * 
 * @example
 * const target = findTargetMeleeFrontline(tankUnit, enemyUnits);
 * // Returns enemy in closest column, preferring same row
 * 
 * @private
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
 * Finds target for assassin units
 * Prioritizes farthest column (backline), then same row, then closest row
 * Assassins prefer to target squishy backline units like mages and archers
 * 
 * @param {Object} attacker - Attacking assassin unit with position
 * @param {Array<Object>} enemies - Array of enemy units to choose from
 * @returns {Object|null} Selected target or null if no enemies
 * 
 * @example
 * const target = findTargetAssassin(assassinUnit, enemyUnits);
 * // Returns enemy in farthest column (backline), preferring same row
 * 
 * @private
 */
function findTargetAssassin(attacker, enemies) {
  const myRow = attacker.row;

  // Find farthest enemy (backline), then sweep down before up
  let best = null;
  let bestScore = -Infinity;

  // Class priority for tie-breaking (prefer squishy targets)
  const classPriority = { 'MAGE': 0, 'ARCHER': 1, 'SUPPORT': 2, 'FIGHTER': 3, 'TANKER': 4 };

  enemies.forEach(enemy => {
    // For LEFT side: higher col = farther (want to maximize enemy.col)
    // For RIGHT side: lower col = farther (want to minimize enemy.col, so negate it)
    const farthestCol = attacker.side === 'LEFT' ? enemy.col : -enemy.col;

    // Same row gets highest priority (0 = same, 1 = different)
    const sameRow = enemy.row === myRow ? 0 : 1;

    // Row sweep: same row → downward (row+1,+2,...) → then upward (row-1,-2,...)
    // Labels now match indices: row 0 at top, row 4 at bottom
    // e.g. Assassin at row 1 (label "1"): order is 1→2→3→4→0
    const rowDelta = enemy.row - myRow;
    // Positive delta (downward) gets priority 0..4, negative delta (upward) gets 5+
    const rowSweep = rowDelta >= 0 ? rowDelta : (5 + Math.abs(rowDelta));

    // Final tie-breaker: prefer squishy targets (MAGE > ARCHER > others)
    const classScore = classPriority[enemy.classType] !== undefined ? classPriority[enemy.classType] : 5;

    // Score: farthest column first, then same row bonus, then downward sweep, then class
    const score = farthestCol * 1000000 - sameRow * 100000 - rowSweep * 1000 - classScore;

    if (score > bestScore) {
      bestScore = score;
      best = enemy;
    }
  });

  return best;
}

/**
 * Finds target for ranged units (Archer/Mage/Support)
 * Prioritizes same row first, then closest by row distance, then column distance
 * 
 * @param {Object} attacker - Attacking ranged unit with position
 * @param {Array<Object>} enemies - Array of enemy units to choose from
 * @returns {Object|null} Selected target or null if no enemies
 * 
 * @example
 * const target = findTargetRanged(archerUnit, enemyUnits);
 * // Returns enemy in same row if possible, otherwise closest enemy
 * 
 * @private
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
 * Compares two targets for priority sorting
 * Uses scoreTarget to calculate priority scores and compares them
 * 
 * @param {Object} attacker - Attacking unit
 * @param {Object} a - First target to compare
 * @param {Object} b - Second target to compare
 * @returns {number} Comparison result: negative if a has higher priority, positive if b has higher priority, 0 if equal
 * 
 * @private
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
 * Scores a target for priority calculation
 * Returns array of priority values for lexicographic comparison
 * Lower scores indicate higher priority
 * 
 * @param {Object} attacker - Attacking unit with position and role
 * @param {Object} target - Target unit to score
 * @returns {Array<number>} Priority score array [primary, secondary, tertiary, ...]
 *   - For melee frontline: [colDist, sameRow, rowDist, totalDist, hpRatio, hpRaw]
 *   - For assassins: [farthestCol, sameRow, rowDist, totalDist, hpRatio, hpRaw]
 *   - For ranged: [sameRow, rowDist, colDist, totalDist, hpRatio, hpRaw]
 * 
 * @private
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
      // Assassin: Farthest column → Same row → Downward sweep
      const farthestCol = attacker.side === 'LEFT' ? -targetCol : targetCol;
      const rowDelta = targetRow - myRow;
      const rowSweep = rowDelta >= 0 ? rowDelta : (5 + Math.abs(rowDelta));
      return [farthestCol, sameRow, rowSweep, totalDist, hpRatio, hpRaw];
    } else {
      // Tank/Fighter: Closest column → Same row → Row distance
      return [colDist, sameRow, rowDist, totalDist, hpRatio, hpRaw];
    }
  }

  // Ranged units (Archer/Mage/Support): Same row → Row distance → Column distance
  return [sameRow, rowDist, colDist, totalDist, hpRatio, hpRaw];
}

/**
 * Picks a class type based on weighted probabilities
 * Uses random roll to select from weighted distribution
 * 
 * @param {Object} weights - Class weights object {TANKER: 0.3, FIGHTER: 0.2, ...}
 *   Weights should sum to 1.0 for proper probability distribution
 * @returns {string} Selected class type (TANKER, FIGHTER, ARCHER, MAGE, SUPPORT, ASSASSIN)
 * 
 * @example
 * const weights = { TANKER: 0.3, FIGHTER: 0.3, ARCHER: 0.2, MAGE: 0.2 };
 * const classType = pickClassByWeights(weights);
 * // Returns class type with probability matching weights
 * 
 * @private
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
 * Assigns board positions to enemy units based on their roles
 * Places units in tactical positions:
 * - Frontline (Tank/Fighter): Columns 5-7, center rows first
 * - Backline (Mage/Archer/Support): Columns 8-9, center rows first
 * - Assassins: Edge rows (0, 4) in backline columns
 * 
 * @param {Array<Object>} picks - Unit picks with baseId, classType, tier, and star
 * @param {string} picks[].baseId - Unit base ID
 * @param {string} picks[].classType - Unit class type (TANKER, FIGHTER, etc.)
 * @param {number} picks[].tier - Unit tier (1-5)
 * @param {number} picks[].star - Star level (1-3)
 * @returns {Array<Object>} Units with assigned positions
 * @returns {string} return[].baseId - Unit base ID
 * @returns {number} return[].star - Star level
 * @returns {number} return[].row - Board row (0-4)
 * @returns {number} return[].col - Board column (5-9 for enemy side)
 * 
 * @example
 * const picks = [
 *   {baseId: 'warrior', classType: 'TANKER', tier: 2, star: 1},
 *   {baseId: 'mage', classType: 'MAGE', tier: 3, star: 1}
 * ];
 * const positioned = assignPositions(picks);
 * // Returns: [
 * //   {baseId: 'warrior', star: 1, row: 2, col: 5},
 * //   {baseId: 'mage', star: 1, row: 2, col: 9}
 * // ]
 * 
 * @private
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
 * AISystem - Main export object with all AI operations
 */
export const AISystem = {
  // AI settings
  getAISettings,
  getAIDifficultyMultiplier,

  // Enemy team generation
  generateEnemyTeam,
  computeEnemyTeamSize,

  // AI decision making
  makeAIDecision,
  selectTarget
};

export default AISystem;
