/**
 * CombatSystem - Combat Management System
 * 
 * Manages all combat logic including turn order, skill execution, damage calculation,
 * status effects, and combat end conditions.
 * This system is independent of Phaser and uses pure functions where possible.
 * 
 * **Validates: Requirements 1.1, 1.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 13.4**
 */

import { APPLY_HANDLERS, TICK_HANDLERS, isStatusTypeSupported } from './StatusEffectHandlers.js';

/**
 * Calculates turn order by sorting units by speed (higher speed acts first)
 * Interleaves player and enemy units to alternate turns
 * 
 * @param {Array<Object>} allUnits - All combat units (player and enemy)
 * @returns {Array<Object>} Turn order array with units sorted by speed
 * 
 * @private
 */
function calculateTurnOrder(allUnits) {
  // Separate player and enemy units — no speed sorting (turn-based game)
  const playerUnits = allUnits.filter(u => u.side === "LEFT");
  const enemyUnits = allUnits.filter(u => u.side === "RIGHT");

  // Interleave player and enemy units (order determined by buildTurnQueue in scenes)
  const turnOrder = [];
  const maxLen = Math.max(playerUnits.length, enemyUnits.length);

  for (let i = 0; i < maxLen; i += 1) {
    if (i < playerUnits.length) {
      turnOrder.push(playerUnits[i]);
    }
    if (i < enemyUnits.length) {
      turnOrder.push(enemyUnits[i]);
    }
  }

  return turnOrder;
}

/**
 * Initializes combat state with player and enemy units
 * Creates combat state with turn order based on unit speed
 * 
 * @param {Array<Object>} playerUnits - Array of player combat units
 * @param {Array<Object>} enemyUnits - Array of enemy combat units
 * @returns {Object} Combat state object with all units, turn order, and combat log
 * 
 * **Validates: Requirements 4.1, 4.2**
 */
export function initializeCombat(playerUnits, enemyUnits) {
  // Combine all units into combat state
  const allUnits = [...playerUnits, ...enemyUnits];

  // Calculate turn order based on speed (higher speed acts first)
  const turnOrder = calculateTurnOrder(allUnits);

  return {
    playerUnits: [...playerUnits],
    enemyUnits: [...enemyUnits],
    turnOrder,
    currentTurn: 0,
    combatLog: [],
    isFinished: false,
    winner: null
  };
}

/**
 * Gets the next actor from the turn order
 * Skips dead units and cycles through turn order
 * 
 * @param {Object} state - Current combat state
 * @returns {Object|null} Next combat unit to act, or null if combat is finished
 * 
 * **Validates: Requirements 4.2, 4.3**
 */
export function getNextActor(state) {
  if (!state || !state.turnOrder || state.turnOrder.length === 0) {
    return null;
  }

  // Find next alive unit in turn order
  while (state.currentTurn < state.turnOrder.length) {
    const actor = state.turnOrder[state.currentTurn];
    state.currentTurn += 1;

    // Skip dead units
    if (actor && actor.alive !== false && !actor.isDead) {
      return actor;
    }
  }

  // End of turn order reached, need to rebuild
  return null;
}

/**
 * Executes an action for the current actor
 * Determines whether to use skill (rage >= 100) or basic attack (rage < 100)
 * 
 * @param {Object} state - Current combat state
 * @param {Object} actor - Combat unit performing the action
 * @returns {Object} Action result with action type, rage changes, and whether skill was used
 * 
 * **Validates: Requirements 4.3, 4.4, 4.5**
 */
export function executeAction(state, actor) {
  if (!actor || !state) {
    return {
      success: false,
      error: 'Invalid actor or state'
    };
  }

  // Check if actor is dead or invalid
  if (actor.alive === false || actor.isDead) {
    return {
      success: false,
      error: 'Actor is dead'
    };
  }

  // Get rage max (default 100)
  const rageMax = actor.rageMax ?? 100;
  const currentRage = actor.rage ?? 0;

  // Determine action type based on rage
  // Requirement 4.4: When unit rage is >= 100, execute skill and reset rage to 0
  // Requirement 4.5: When unit rage is < 100, execute basic attack and increase rage
  const shouldUseSkill = currentRage >= rageMax;

  // Check for silence status (prevents skill usage)
  const isSilenced = (actor.statuses?.silence ?? 0) > 0;

  // Check for disarm status (prevents basic attacks)
  const isDisarmed = (actor.statuses?.disarmTurns ?? 0) > 0;

  if (shouldUseSkill && !isSilenced) {
    // Use skill - always reset rage to 0 (MAGE regains via per-hit mechanic)
    return {
      success: true,
      actionType: 'SKILL',
      useSkill: true,
      resetRage: true,
      rageChange: -currentRage,
      message: `${actor.name} uses skill`
    };
  } else if (isDisarmed) {
    // Cannot attack due to disarm
    return {
      success: true,
      actionType: 'DISARMED',
      useSkill: false,
      rageChange: 0,
      message: `${actor.name} is disarmed`
    };
  } else {
    // Use basic attack - increase rage
    // Rage gain varies but typically around 20-25 per basic attack
    const rageGain = 20;

    return {
      success: true,
      actionType: 'BASIC_ATTACK',
      useSkill: false,
      rageChange: rageGain,
      message: `${actor.name} uses basic attack`
    };
  }
}

/**
 * Executes a skill for the caster on the specified targets
 * Applies skill effects including damage, status effects, and special mechanics
 * 
 * @param {Object} caster - Combat unit casting the skill
 * @param {Object} skill - Skill definition object
 * @param {Array<Object>} targets - Array of target combat units
 * @param {Object} state - Current combat state
 * @returns {Object} Skill result with damage dealt, effects applied, and affected units
 * 
 * **Validates: Requirements 4.4, 4.6, 4.11**
 */
export function executeSkill(caster, skill, targets, state) {
  if (!caster || !skill || !targets || !state) {
    return {
      success: false,
      error: 'Invalid parameters'
    };
  }

  // Validate skill exists
  if (!skill.name || !skill.effect) {
    return {
      success: false,
      error: 'Invalid skill definition'
    };
  }

  // Check if caster is silenced
  if ((caster.statuses?.silence ?? 0) > 0) {
    return {
      success: false,
      error: 'Caster is silenced'
    };
  }

  // Ensure targets is an array
  const targetArray = Array.isArray(targets) ? targets : [targets];

  // Filter out dead targets
  const validTargets = targetArray.filter(t => t && t.alive !== false && !t.isDead);

  if (validTargets.length === 0) {
    return {
      success: false,
      error: 'No valid targets'
    };
  }

  // Return skill execution result
  // The actual damage calculation and effect application will be done by the scene
  // This function validates and prepares the skill execution
  return {
    success: true,
    skillName: skill.name,
    skillEffect: skill.effect,
    caster: caster,
    targets: validTargets,
    damageType: skill.damageType ?? 'physical',
    actionPattern: skill.actionPattern ?? 'MELEE_FRONT',
    message: `${caster.name} casts ${skill.name}`
  };
}

/**
 * Calculates damage from attacker to defender
 * Applies attack, defense, elemental modifiers, and synergy bonuses
 * 
 * @param {Object} attacker - Attacking combat unit
 * @param {Object} defender - Defending combat unit
 * @param {Object} skill - Skill or attack being used
 * @param {Object} state - Current combat state (for synergies and modifiers)
 * @returns {Object} Damage result with final damage value and calculation breakdown
 * 
 * **Validates: Requirement 4.6**
 */
/**
 * Calculates damage with all modifiers applied
 * Applies attack, defense, elemental, and synergy modifiers
 * 
 * @param {Object} attacker - Combat unit dealing damage
 * @param {Object} defender - Combat unit receiving damage
 * @param {Object} skill - Skill being used (null for basic attack)
 * @param {Object} state - Current combat state
 * @returns {Object} Damage calculation result with breakdown
 * 
 * **Validates: Requirements 4.6, 4.7**
 */
export function calculateDamage(attacker, defender, skill, state) {
  // Validate inputs
  if (!attacker || !defender) {
    return {
      success: false,
      error: 'Invalid attacker or defender',
      damage: 0,
      breakdown: {}
    };
  }

  // Get base damage
  let rawDamage = 0;
  let damageType = 'physical';

  if (skill) {
    // Skill damage calculation
    const statName = skill.scaleStat || 'atk';
    let sourceStat = 0;

    if (statName === 'atk') {
      sourceStat = getEffectiveAtk(attacker);
    } else if (statName === 'matk') {
      sourceStat = getEffectiveMatk(attacker);
    } else {
      sourceStat = attacker[statName] ?? 0;
    }

    // Star multiplier
    const starSkillMult = attacker?.star >= 3 ? 1.4 : attacker?.star === 2 ? 1.2 : 1;

    // Base skill damage formula: (base + stat * scale) * starMult
    const baseDamage = (skill.base + sourceStat * skill.scale) * starSkillMult;

    // Apply gold scaling if state has player gold
    let goldMultiplier = 1;
    if (state?.player?.gold !== undefined) {
      // Gold scaling formula from game rules
      const gold = state.player.gold;
      if (gold >= 100) {
        goldMultiplier = 1 + Math.floor((gold - 100) / 10) * 0.01;
      }
    }

    rawDamage = Math.round(baseDamage * goldMultiplier);
    damageType = skill.damageType || 'physical';
  } else {
    // Basic attack damage
    rawDamage = getEffectiveAtk(attacker);
    damageType = 'physical';
  }

  // Apply global damage multiplier (death match scaling)
  if (state?.globalDamageMult) {
    rawDamage *= state.globalDamageMult;
  }

  rawDamage = Math.max(1, Math.round(rawDamage));

  // Apply elemental advantage/disadvantage
  let elementalMult = 1;
  if (attacker.tribe && defender.tribe) {
    // Check if attacker has elemental advantage
    const TRIBE_COUNTER = {
      BEAST: 'PLANT',
      PLANT: 'AQUA',
      AQUA: 'BEAST'
    };

    if (TRIBE_COUNTER[attacker.tribe] === defender.tribe) {
      // Attacker has advantage
      if (defender.classType === 'TANKER') {
        // Tanker defender reduces incoming damage by 50%
        elementalMult = 0.5;
      } else if (attacker.classType !== 'TANKER') {
        // Non-tanker attacker increases damage by 50%
        elementalMult = 1.5;
      }
    }
  }

  rawDamage *= elementalMult;
  rawDamage = Math.max(1, Math.round(rawDamage));

  // Apply critical hit for physical damage
  let isCrit = false;
  if (damageType === 'physical' && attacker.mods?.critPct) {
    if (Math.random() < attacker.mods.critPct) {
      isCrit = true;
      rawDamage *= 1.5;
      rawDamage = Math.round(rawDamage);
    }
  }

  // Apply defense reduction
  let finalDamage = rawDamage;

  if (damageType === 'physical') {
    if (isCrit) {
      // Critical hits ignore defense
      finalDamage = rawDamage;
    } else {
      // Apply armor break
      const armorBreak = defender.statuses?.armorBreakTurns > 0 ? defender.statuses.armorBreakValue : 0;
      const effectiveDef = Math.max(0, getEffectiveDef(defender) - armorBreak);

      // Defense formula: damage * (100 / (100 + def))
      finalDamage = rawDamage * (100 / (100 + effectiveDef));
    }
  } else if (damageType === 'magic') {
    // Magic defense formula
    const effectiveMdef = getEffectiveMdef(defender);
    finalDamage = rawDamage * (100 / (100 + effectiveMdef));
  }
  // 'true' damage type ignores defense

  finalDamage = Math.max(1, Math.round(finalDamage));

  return {
    success: true,
    damage: finalDamage,
    damageType,
    isCrit,
    breakdown: {
      rawDamage,
      elementalMult,
      finalDamage
    }
  };
}

/**
 * Gets effective attack stat for a unit
 * Applies attack buffs and debuffs from status effects
 * 
 * @param {Object} unit - Combat unit
 * @returns {number} Effective attack value (minimum 1)
 * @private
 */
function getEffectiveAtk(unit) {
  const buff = unit.statuses?.atkBuffTurns > 0 ? unit.statuses.atkBuffValue : 0;
  const debuff = unit.statuses?.atkDebuffTurns > 0 ? unit.statuses.atkDebuffValue : 0;
  return Math.max(1, unit.atk + buff - debuff);
}

/**
 * Gets effective defense stat for a unit
 * Applies defense buffs from status effects
 * 
 * @param {Object} unit - Combat unit
 * @returns {number} Effective defense value (minimum 0)
 * @private
 */
function getEffectiveDef(unit) {
  const buff = unit.statuses?.defBuffTurns > 0 ? unit.statuses.defBuffValue : 0;
  return Math.max(0, unit.def + buff);
}

/**
 * Gets effective magic attack stat for a unit
 * 
 * @param {Object} unit - Combat unit
 * @returns {number} Effective magic attack value (minimum 1)
 * @private
 */
function getEffectiveMatk(unit) {
  return Math.max(1, unit.matk);
}

/**
 * Gets effective magic defense stat for a unit
 * 
 * @param {Object} unit - Combat unit
 * @returns {number} Effective magic defense value (minimum 0)
 * @private
 */
function getEffectiveMdef(unit) {
  return Math.max(0, unit.mdef);
}

/**
 * Applies damage to a combat unit
 * Ensures HP never goes below 0 and marks unit as dead if HP reaches 0
 * 
 * @param {Object} unit - Combat unit receiving damage
 * @param {number} damage - Amount of damage to apply
 * @param {Object} state - Current combat state
 * @returns {Object} Result with updated unit, isDead flag, and actual damage dealt
 * 
 * **Validates: Requirements 4.7, 4.8**
 */
export function applyDamage(unit, damage, state) {
  // Validate inputs
  if (!unit) {
    return {
      success: false,
      error: 'Invalid unit'
    };
  }

  if (typeof damage !== 'number' || !Number.isFinite(damage) || damage < 0) {
    return {
      success: false,
      error: 'Invalid damage value'
    };
  }

  // Check if unit is already dead
  if (unit.isDead || unit.alive === false) {
    return {
      success: false,
      error: 'Unit is already dead'
    };
  }

  let damageLeft = Math.round(damage);
  let shieldAbsorbed = 0;
  let hpLost = 0;

  // Apply shield absorption first
  if (unit.shield > 0) {
    shieldAbsorbed = Math.min(unit.shield, damageLeft);
    unit.shield -= shieldAbsorbed;
    damageLeft -= shieldAbsorbed;
  }

  // Apply remaining damage to HP
  if (damageLeft > 0) {
    const oldHP = unit.hp;
    unit.hp = Math.max(0, unit.hp - damageLeft);
    hpLost = oldHP - unit.hp;
  }

  // Check if unit died
  const died = unit.hp <= 0;

  if (died) {
    unit.hp = 0;
    unit.shield = 0;
    unit.isDead = true;
    unit.alive = false;

    // Remove from turn order
    if (state?.turnOrder) {
      state.turnOrder = state.turnOrder.filter(u => u.uid !== unit.uid);
    }

    // Log death event
    if (state?.combatLog) {
      state.combatLog.push({
        type: 'UNIT_DEATH',
        unitName: unit.name,
        uid: unit.uid,
        side: unit.side
      });
    }
  }

  return {
    success: true,
    unit,
    died,
    shieldAbsorbed,
    hpLost,
    totalDamage: shieldAbsorbed + hpLost
  };
}

/**
 * Applies a status effect to a combat unit
 * Handles stacking, duration, and effect application using StatusEffectHandlers
 * 
 * @param {Object} unit - Combat unit receiving the status effect
 * @param {Object} effect - Status effect definition with type, duration, and value
 * @param {Object} state - Current combat state
 * @returns {Object} Result with updated unit and effect application details
 * 
 * **Validates: Requirement 4.11**
 */
export function applyStatusEffect(unit, effect, state) {
  // Validate inputs
  if (!unit || !effect) {
    return {
      success: false,
      error: 'Invalid unit or effect'
    };
  }

  // Check if unit is dead
  if (unit.isDead || unit.alive === false) {
    return {
      success: false,
      error: 'Cannot apply status to dead unit'
    };
  }

  // Initialize statuses object if not present
  if (!unit.statuses) {
    unit.statuses = {};
  }

  const effectType = effect.type;
  const duration = effect.duration ?? 1;
  const value = effect.value ?? 0;

  // Check if status type is supported
  if (!isStatusTypeSupported(effectType)) {
    return {
      success: false,
      error: `Unknown status effect type: ${effectType}`
    };
  }

  // Apply status effect using handler
  const handler = APPLY_HANDLERS[effectType];
  handler(unit, { ...effect, duration, value });

  // Log status application
  if (state?.combatLog) {
    state.combatLog.push({
      type: 'STATUS_APPLIED',
      unitName: unit.name,
      uid: unit.uid,
      effectType,
      duration,
      value
    });
  }

  return {
    success: true,
    unit,
    effectType,
    duration,
    value,
    message: `Applied ${effectType} to ${unit.name}`
  };
}

/**
 * Ticks all status effects on a combat unit
 * Decrements duration, applies periodic effects, and removes expired effects
 * 
 * @param {Object} unit - Combat unit with status effects
 * @param {Object} state - Current combat state
 * @returns {Object} Result with updated unit, effects that triggered, and control status
 * 
 * **Validates: Requirement 4.12**
 */
export function tickStatusEffects(unit, state) {
  // Validate inputs
  if (!unit) {
    return {
      success: false,
      error: 'Invalid unit'
    };
  }

  // Check if unit is dead
  if (unit.isDead || unit.alive === false) {
    return {
      success: false,
      error: 'Cannot tick status on dead unit'
    };
  }

  // Initialize statuses if not present
  if (!unit.statuses) {
    unit.statuses = {};
  }

  const triggeredEffects = [];
  let controlStatus = null; // 'freeze', 'stun', 'sleep', or null

  // Check for control effects FIRST (these prevent actions)
  // Priority: freeze > stun > sleep
  // Only the highest priority control effect is active and decremented
  if (unit.statuses.freeze > 0) {
    controlStatus = 'freeze';
    // Don't tick other control effects when frozen
  } else if (unit.statuses.stun > 0) {
    controlStatus = 'stun';
    // Don't tick other control effects when stunned
  } else if (unit.statuses.sleep > 0) {
    controlStatus = 'sleep';
    // Don't tick other control effects when asleep
  }

  // Tick all non-control status effects using handlers
  const nonControlStatusTypes = ['silence', 'burn', 'poison', 'bleed', 'disease',
    'armorBreak', 'atkBuff', 'atkDebuff', 'defBuff', 'mdefBuff', 'evadeBuff', 'evadeDebuff',
    'taunt', 'reflect', 'disarm', 'immune', 'physReflect', 'counter', 'protecting', 'hot'];

  for (const statusType of nonControlStatusTypes) {
    const handler = TICK_HANDLERS[statusType];
    if (handler) {
      const result = handler(unit);

      // If damage was dealt, add to triggered effects
      if (result.damage) {
        triggeredEffects.push({
          type: statusType,
          damage: result.damage,
          spreads: statusType === 'disease' // Disease spreads to adjacent allies
        });
      }
      // If heal was triggered (HoT), add to triggered effects
      if (result.healed) {
        triggeredEffects.push({
          type: statusType,
          healed: result.healed
        });
      }
    }
  }

  // Tick the active control effect (only one at a time)
  if (controlStatus) {
    const handler = TICK_HANDLERS[controlStatus];
    if (handler) {
      handler(unit);
    }
  }

  // Log status ticks
  if (state?.combatLog && (triggeredEffects.length > 0 || controlStatus)) {
    state.combatLog.push({
      type: 'STATUS_TICK',
      unitName: unit.name,
      uid: unit.uid,
      triggeredEffects,
      controlStatus
    });
  }

  return {
    success: true,
    unit,
    triggeredEffects,
    controlStatus, // Returns 'freeze', 'stun', 'sleep', or null
    message: `Ticked status effects for ${unit.name}`
  };
}

/**
 * Checks if combat has ended
 * Determines winner based on which side has units remaining
 * 
 * @param {Object} state - Current combat state
 * @returns {Object} Combat end result with isFinished flag and winner
 * 
 * **Validates: Requirements 4.9, 4.10**
 */
export function checkCombatEnd(state) {
  // Validate state
  if (!state) {
    return {
      isFinished: false,
      winner: null,
      error: 'Invalid state'
    };
  }

  // Get alive units for each side
  const playerUnits = state.playerUnits || [];
  const enemyUnits = state.enemyUnits || [];

  const alivePlayerUnits = playerUnits.filter(u => u && u.alive !== false && !u.isDead);
  const aliveEnemyUnits = enemyUnits.filter(u => u && u.alive !== false && !u.isDead);

  const playerCount = alivePlayerUnits.length;
  const enemyCount = aliveEnemyUnits.length;

  // Check if all player units are dead (enemy victory)
  if (playerCount === 0 && enemyCount > 0) {
    state.isFinished = true;
    state.winner = 'enemy';

    // Log combat end
    if (state.combatLog) {
      state.combatLog.push({
        type: 'COMBAT_END',
        winner: 'enemy',
        reason: 'All player units defeated',
        playerUnitsRemaining: 0,
        enemyUnitsRemaining: enemyCount
      });
    }

    return {
      isFinished: true,
      winner: 'enemy',
      playerUnitsRemaining: 0,
      enemyUnitsRemaining: enemyCount,
      message: 'Enemy victory - all player units defeated'
    };
  }

  // Check if all enemy units are dead (player victory)
  if (enemyCount === 0 && playerCount > 0) {
    state.isFinished = true;
    state.winner = 'player';

    // Log combat end
    if (state.combatLog) {
      state.combatLog.push({
        type: 'COMBAT_END',
        winner: 'player',
        reason: 'All enemy units defeated',
        playerUnitsRemaining: playerCount,
        enemyUnitsRemaining: 0
      });
    }

    return {
      isFinished: true,
      winner: 'player',
      playerUnitsRemaining: playerCount,
      enemyUnitsRemaining: 0,
      message: 'Player victory - all enemy units defeated'
    };
  }

  // Check if both sides are dead (draw)
  if (playerCount === 0 && enemyCount === 0) {
    state.isFinished = true;
    state.winner = 'draw';

    // Log combat end
    if (state.combatLog) {
      state.combatLog.push({
        type: 'COMBAT_END',
        winner: 'draw',
        reason: 'All units defeated',
        playerUnitsRemaining: 0,
        enemyUnitsRemaining: 0
      });
    }

    return {
      isFinished: true,
      winner: 'draw',
      playerUnitsRemaining: 0,
      enemyUnitsRemaining: 0,
      message: 'Draw - all units defeated'
    };
  }

  // Combat continues
  return {
    isFinished: false,
    winner: null,
    playerUnitsRemaining: playerCount,
    enemyUnitsRemaining: enemyCount,
    message: 'Combat continues'
  };
}

/**
 * CombatSystem - Main export object with all combat operations
 */
export const CombatSystem = {
  // Combat initialization
  initializeCombat,

  // Turn management
  getNextActor,
  executeAction,

  // Skill execution
  executeSkill,

  // Damage calculation
  calculateDamage,
  applyDamage,

  // Status effects
  applyStatusEffect,
  tickStatusEffects,

  // Combat end
  checkCombatEnd
};

export default CombatSystem;
