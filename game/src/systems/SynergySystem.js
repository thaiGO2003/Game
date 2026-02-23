/**
 * SynergySystem - Synergy Management System
 * 
 * Manages synergy calculation and application for team compositions.
 * This system is independent of Phaser and uses pure functions.
 * 
 * **Validates: Requirements 1.1, 1.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 13.4**
 */

import { CLASS_SYNERGY, TRIBE_SYNERGY } from "../data/synergies.js";
import { getClassLabelVi, getTribeLabelVi } from "../data/unitVisuals.js";

/**
 * Normalizes a synergy key to handle undefined/null values
 * 
 * @param {*} value - Value to normalize
 * @returns {string|null} Normalized key or null if invalid
 */
function normalizeSynergyKey(value) {
  const key = typeof value === "string" ? value.trim() : value;
  if (!key || key === "undefined" || key === "null") return null;
  return key;
}

/**
 * Calculates synergy counts from a list of units
 * Supports extra class/tribe counts for player bonuses
 * 
 * @param {Array<Object>} units - Array of units to analyze
 * @param {string} side - Side identifier ("LEFT" for player, "RIGHT" for enemy)
 * @param {Object} options - Optional configuration
 * @param {number} options.extraClassCount - Extra count to add to top class (default 0)
 * @param {number} options.extraTribeCount - Extra count to add to top tribe (default 0)
 * @returns {Object} Object with classCounts and tribeCounts
 * 
 * **Validates: Requirement 6.1**
 */
export function calculateSynergies(units, side = "LEFT", options = {}) {
  const { extraClassCount = 0, extraTribeCount = 0 } = options;

  const classCounts = {};
  const tribeCounts = {};

  // Count units by class and tribe
  units.forEach((unit) => {
    const classType = normalizeSynergyKey(unit?.classType ?? unit?.base?.classType);
    const tribe = normalizeSynergyKey(unit?.tribe ?? unit?.base?.tribe);

    if (classType) {
      classCounts[classType] = (classCounts[classType] ?? 0) + 1;
    }
    if (tribe) {
      tribeCounts[tribe] = (tribeCounts[tribe] ?? 0) + 1;
    }
  });

  // Apply extra counts for player side (from augments/bonuses)
  if (side === "LEFT" && units.length > 0) {
    if (extraClassCount > 0) {
      const topClass = Object.keys(classCounts).sort(
        (a, b) => classCounts[b] - classCounts[a]
      )[0];
      if (topClass) {
        classCounts[topClass] += extraClassCount;
      }
    }
    if (extraTribeCount > 0) {
      const topTribe = Object.keys(tribeCounts).sort(
        (a, b) => tribeCounts[b] - tribeCounts[a]
      )[0];
      if (topTribe) {
        tribeCounts[topTribe] += extraTribeCount;
      }
    }
  }

  return { classCounts, tribeCounts };
}

/**
 * Gets the synergy bonus for a given definition and count
 * Returns the highest tier bonus that the count qualifies for
 * 
 * @param {Object} synergyDef - Synergy definition with thresholds and bonuses
 * @param {number} count - Number of units of this type
 * @returns {Object|null} Bonus object or null if no threshold met
 * 
 * **Validates: Requirement 6.2**
 */
export function getSynergyBonus(synergyDef, count) {
  if (!synergyDef || !synergyDef.thresholds || !synergyDef.bonuses) {
    return null;
  }

  let bonus = null;
  for (let i = 0; i < synergyDef.thresholds.length; i += 1) {
    if (count >= synergyDef.thresholds[i]) {
      bonus = synergyDef.bonuses[i];
    }
  }
  return bonus;
}

/**
 * Gets the synergy tier index for a given count and thresholds
 * Returns -1 if no threshold is met
 * 
 * @param {number} count - Number of units
 * @param {Array<number>} thresholds - Array of threshold values
 * @returns {number} Tier index (0-based) or -1 if no threshold met
 */
export function getSynergyTier(count, thresholds) {
  if (!thresholds || !Array.isArray(thresholds)) {
    return -1;
  }

  let idx = -1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (count >= thresholds[i]) {
      idx = i;
    }
  }
  return idx;
}

/**
 * Applies synergy bonuses to a single unit
 * Modifies the unit's stats based on active class and tribe synergies
 * 
 * @param {Object} unit - Combat unit to apply bonuses to (will be modified)
 * @param {Object} synergyCounts - Object with classCounts and tribeCounts
 * @returns {void}
 * 
 * **Validates: Requirements 6.3, 6.6**
 */
export function applySynergiesToUnit(unit, synergyCounts) {
  if (!unit || !synergyCounts) return;

  const { classCounts, tribeCounts } = synergyCounts;

  // Apply class synergy bonus
  const classType = unit.classType;
  if (classType && classCounts[classType]) {
    const classDef = CLASS_SYNERGY[classType];
    if (classDef) {
      const bonus = getSynergyBonus(classDef, classCounts[classType]);
      if (bonus) {
        applyBonusToUnit(unit, bonus);
      }
    }
  }

  // Apply tribe synergy bonus
  const tribe = unit.tribe;
  if (tribe && tribeCounts[tribe]) {
    const tribeDef = TRIBE_SYNERGY[tribe];
    if (tribeDef) {
      const bonus = getSynergyBonus(tribeDef, tribeCounts[tribe]);
      if (bonus) {
        applyBonusToUnit(unit, bonus);
      }
    }
  }
}

/**
 * Applies a bonus object to a unit's mods
 * Helper function that merges bonus stats into unit.mods
 * 
 * @param {Object} unit - Unit to apply bonus to (will be modified)
 * @param {Object} bonus - Bonus object with stat modifiers
 * @returns {void}
 */
function applyBonusToUnit(unit, bonus) {
  if (!unit || !bonus) return;
  if (!unit.mods) unit.mods = {};

  // Merge bonus into unit.mods
  Object.keys(bonus).forEach((key) => {
    if (typeof bonus[key] === "number") {
      unit.mods[key] = (unit.mods[key] ?? 0) + bonus[key];
    } else {
      unit.mods[key] = bonus[key];
    }
  });
}

/**
 * Applies a bonus object directly to a combat unit's stats
 * This version modifies the unit's actual stats (hp, atk, def, etc.) not just mods
 * Used during combat initialization to apply synergy bonuses
 * 
 * @param {Object} unit - Combat unit to apply bonus to (will be modified)
 * @param {Object} bonus - Bonus object with stat modifiers
 * @returns {void}
 * 
 * **Validates: Requirements 6.3, 6.6**
 */
export function applyBonusToCombatUnit(unit, bonus) {
  if (!bonus) return;

  // Handle percentage-based bonuses
  const hpPct = bonus.hpPct ?? bonus.teamHpPct ?? 0;
  const atkPct = bonus.atkPct ?? bonus.teamAtkPct ?? 0;
  const matkPct = bonus.matkPct ?? bonus.teamMatkPct ?? 0;

  // Apply flat stat bonuses
  if (bonus.defFlat) unit.def += bonus.defFlat;
  if (bonus.mdefFlat) unit.mdef += bonus.mdefFlat;

  // Apply HP percentage bonus
  if (hpPct) {
    const add = Math.round(unit.maxHp * hpPct);
    unit.maxHp += add;
    unit.hp += add;
  }

  // Apply attack percentage bonuses
  if (atkPct) unit.atk = Math.round(unit.atk * (1 + atkPct));
  if (matkPct) unit.matk = Math.round(unit.matk * (1 + matkPct));

  // Apply mod-based bonuses
  if (bonus.healPct) unit.mods.healPct += bonus.healPct;
  if (bonus.lifestealPct) unit.mods.lifestealPct += bonus.lifestealPct;
  if (bonus.evadePct) unit.mods.evadePct += bonus.evadePct;
  if (bonus.shieldStart) unit.mods.shieldStart += bonus.shieldStart;
  if (bonus.startingRage) unit.mods.startingRage += bonus.startingRage;
  if (bonus.critPct) unit.mods.critPct += bonus.critPct;
  if (bonus.burnOnHit) unit.mods.burnOnHit += bonus.burnOnHit;
  if (bonus.poisonOnHit) unit.mods.poisonOnHit += bonus.poisonOnHit;
}

/**
 * Applies synergy bonuses to all units on a team
 * Calculates synergies for the team and applies bonuses to each unit
 * Also applies starting rage and shield bonuses from synergies
 * 
 * @param {Array<Object>} units - Array of combat units
 * @param {string} side - Side identifier ("LEFT" for player, "RIGHT" for enemy)
 * @param {Object} options - Optional configuration for extra counts
 * @returns {void}
 * 
 * **Validates: Requirements 6.3, 6.6, 6.7**
 */
export function applySynergyBonusesToTeam(units, side = "LEFT", options = {}) {
  if (!units || !Array.isArray(units)) return;

  const { classCounts, tribeCounts } = calculateSynergies(units, side, options);

  units.forEach((unit) => {
    // Apply class synergy bonus
    const classType = unit.classType;
    if (classType && classCounts[classType]) {
      const classDef = CLASS_SYNERGY[classType];
      if (classDef) {
        const bonus = getSynergyBonus(classDef, classCounts[classType]);
        if (bonus) {
          applyBonusToCombatUnit(unit, bonus);
        }
      }
    }

    // Apply tribe synergy bonus
    const tribe = unit.tribe;
    if (tribe && tribeCounts[tribe]) {
      const tribeDef = TRIBE_SYNERGY[tribe];
      if (tribeDef) {
        const bonus = getSynergyBonus(tribeDef, tribeCounts[tribe]);
        if (bonus) {
          applyBonusToCombatUnit(unit, bonus);
        }
      }
    }

    // Apply starting rage and shield from mods
    if (unit.mods) {
      if (unit.mods.startingRage) {
        // Cap startingRage bonus at 4 maximum (Requirement 2.2)
        const cappedStartingRage = Math.min(4, unit.mods.startingRage);
        unit.rage = Math.min(unit.rageMax || 100, unit.rage + cappedStartingRage);
      }
      if (unit.mods.shieldStart) {
        unit.shield = (unit.shield || 0) + unit.mods.shieldStart;
      }
    }
  });
}

/**
 * Gets a formatted description of a synergy bonus
 * 
 * @param {string} synergyId - Synergy identifier (class or tribe key)
 * @param {number} level - Synergy tier level (0-based index)
 * @param {string} type - Synergy type ("class" or "tribe")
 * @returns {string} Formatted description of the synergy bonus
 * 
 * **Validates: Requirement 6.4**
 */
export function getSynergyDescription(synergyId, level, type = "class") {
  const synergyDef = type === "class" ? CLASS_SYNERGY[synergyId] : TRIBE_SYNERGY[synergyId];

  if (!synergyDef || level < 0 || level >= synergyDef.bonuses.length) {
    return "";
  }

  const bonus = synergyDef.bonuses[level];
  const threshold = synergyDef.thresholds[level];
  const label = type === "class" ? getClassLabelVi(synergyId) : getTribeLabelVi(synergyId);

  const bonusText = formatBonusSet(bonus);
  return `${label} (${threshold}): ${bonusText}`;
}

/**
 * Gets the icon/emoji for a synergy
 * 
 * @param {string} synergyId - Synergy identifier (class or tribe key)
 * @param {string} type - Synergy type ("class" or "tribe")
 * @returns {string} Icon/emoji representing the synergy
 * 
 * **Validates: Requirement 6.5**
 */
export function getSynergyIcon(synergyId, type = "class") {
  // Class icons
  const classIcons = {
    TANKER: "🛡️",
    ASSASSIN: "🗡️",
    ARCHER: "🏹",
    MAGE: "🔮",
    SUPPORT: "💚",
    FIGHTER: "⚔️"
  };

  // Tribe icons
  const tribeIcons = {
    FIRE: "🔥",
    SPIRIT: "👻",
    TIDE: "🌊",
    STONE: "🪨",
    WIND: "💨",
    NIGHT: "🌙",
    SWARM: "🐝",
    WOOD: "🌲"
  };

  if (type === "class") {
    return classIcons[synergyId] ?? "◎";
  }
  return tribeIcons[synergyId] ?? "◎";
}

/**
 * Formats a bonus set into a readable string
 * 
 * @param {Object} bonus - Bonus object with stat modifiers
 * @returns {string} Formatted bonus description
 */
function formatBonusSet(bonus) {
  if (!bonus || typeof bonus !== "object") return "";

  const parts = [];

  // Common stat bonuses
  if (bonus.attack) parts.push(`+${bonus.attack} Tấn công`);
  if (bonus.defense) parts.push(`+${bonus.defense} Phòng thủ`);
  if (bonus.hp) parts.push(`+${bonus.hp} HP`);
  if (bonus.accuracy) parts.push(`+${bonus.accuracy}% Chính xác`);
  if (bonus.evasion) parts.push(`+${bonus.evasion}% Né tránh`);
  if (bonus.critChance) parts.push(`+${bonus.critChance}% Chí mạng`);
  if (bonus.critDamage) parts.push(`+${bonus.critDamage}% Sát thương chí mạng`);

  // Special bonuses
  if (bonus.shieldStart) parts.push(`+${bonus.shieldStart} Giáp ban đầu`);
  if (bonus.startingRage) parts.push(`+${bonus.startingRage} Nộ khí ban đầu`);
  if (bonus.lifeSteal) parts.push(`+${bonus.lifeSteal}% Hút máu`);
  if (bonus.damageReduction) parts.push(`+${bonus.damageReduction}% Giảm sát thương`);
  if (bonus.healingBonus) parts.push(`+${bonus.healingBonus}% Hồi máu`);

  // Status effect bonuses
  if (bonus.poisonOnHit) parts.push(`Độc ${bonus.poisonOnHit} khi đánh`);
  if (bonus.burnOnHit) parts.push(`Bỏng ${bonus.burnOnHit} khi đánh`);
  if (bonus.stunChance) parts.push(`+${bonus.stunChance}% Choáng`);
  if (bonus.knockbackChance) parts.push(`+${bonus.knockbackChance}% Đẩy lùi`);

  return parts.join(", ") || "Không có bonus";
}

/**
 * Gets all active synergies for a team
 * Returns detailed information about each active synergy
 * 
 * @param {Array<Object>} units - Array of units
 * @param {string} side - Side identifier
 * @param {Object} options - Optional configuration for extra counts
 * @returns {Array<Object>} Array of active synergy objects
 * 
 * **Validates: Requirement 6.7**
 */
export function getActiveSynergies(units, side = "LEFT", options = {}) {
  const { classCounts, tribeCounts } = calculateSynergies(units, side, options);
  const activeSynergies = [];

  // Check class synergies
  Object.entries(classCounts).forEach(([classType, count]) => {
    const def = CLASS_SYNERGY[classType];
    if (!def) return;

    const tier = getSynergyTier(count, def.thresholds);
    if (tier >= 0) {
      activeSynergies.push({
        type: "class",
        key: classType,
        count,
        tier,
        threshold: def.thresholds[tier],
        bonuses: def.bonuses[tier],
        description: getSynergyDescription(classType, tier, "class"),
        icon: getSynergyIcon(classType, "class")
      });
    }
  });

  // Check tribe synergies
  Object.entries(tribeCounts).forEach(([tribe, count]) => {
    const def = TRIBE_SYNERGY[tribe];
    if (!def) return;

    const tier = getSynergyTier(count, def.thresholds);
    if (tier >= 0) {
      activeSynergies.push({
        type: "tribe",
        key: tribe,
        count,
        tier,
        threshold: def.thresholds[tier],
        bonuses: def.bonuses[tier],
        description: getSynergyDescription(tribe, tier, "tribe"),
        icon: getSynergyIcon(tribe, "tribe")
      });
    }
  });

  return activeSynergies;
}

/**
 * Gets the class synergy definition for a given class type
 * 
 * @param {string} classType - Class type identifier
 * @returns {Object|null} Synergy definition or null if not found
 */
export function getClassSynergyDef(classType) {
  return CLASS_SYNERGY[classType] || null;
}

/**
 * Gets the tribe synergy definition for a given tribe
 * 
 * @param {string} tribe - Tribe identifier
 * @returns {Object|null} Synergy definition or null if not found
 */
export function getTribeSynergyDef(tribe) {
  return TRIBE_SYNERGY[tribe] || null;
}

/**
 * SynergySystem - Main export object with all synergy operations
 */
export const SynergySystem = {
  // Core synergy calculation
  calculateSynergies,
  getActiveSynergies,

  // Synergy bonus operations
  getSynergyBonus,
  getSynergyTier,
  applySynergiesToUnit,
  applyBonusToCombatUnit,
  applySynergyBonusesToTeam,

  // UI/Display helpers
  getSynergyDescription,
  getSynergyIcon,
  formatBonusSet,

  // Synergy definition getters
  getClassSynergyDef,
  getTribeSynergyDef
};

export default SynergySystem;
