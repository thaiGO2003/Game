/**
 * Status Effect Handlers
 * 
 * Provides a lookup table of handler functions for different status effect types.
 * Each handler is responsible for applying or ticking a specific status effect.
 * 
 * This module reduces cyclomatic complexity in CombatSystem by replacing large
 * switch statements with a simple lookup pattern.
 */

/**
 * Apply handlers - called when a status effect is first applied to a unit
 */
export const APPLY_HANDLERS = {
  // Control effects (hard CC)
  freeze: (unit, effect) => {
    unit.statuses.freeze = Math.max(unit.statuses.freeze ?? 0, effect.duration ?? 1);
  },
  
  stun: (unit, effect) => {
    unit.statuses.stun = Math.max(unit.statuses.stun ?? 0, effect.duration ?? 1);
  },
  
  sleep: (unit, effect) => {
    unit.statuses.sleep = Math.max(unit.statuses.sleep ?? 0, effect.duration ?? 1);
  },
  
  silence: (unit, effect) => {
    unit.statuses.silence = Math.max(unit.statuses.silence ?? 0, effect.duration ?? 1);
  },

  // Damage over time effects
  burn: (unit, effect) => {
    unit.statuses.burnTurns = Math.max(unit.statuses.burnTurns ?? 0, effect.duration ?? 1);
    unit.statuses.burnDamage = effect.value ?? 0;
  },

  poison: (unit, effect) => {
    unit.statuses.poisonTurns = Math.max(unit.statuses.poisonTurns ?? 0, effect.duration ?? 1);
    unit.statuses.poisonDamage = effect.value ?? 0;
  },

  bleed: (unit, effect) => {
    unit.statuses.bleedTurns = Math.max(unit.statuses.bleedTurns ?? 0, effect.duration ?? 1);
    unit.statuses.bleedDamage = effect.value ?? 0;
  },

  disease: (unit, effect) => {
    unit.statuses.diseaseTurns = Math.max(unit.statuses.diseaseTurns ?? 0, effect.duration ?? 1);
    unit.statuses.diseaseDamage = effect.value ?? 0;
  },

  // Stat modifiers
  armorBreak: (unit, effect) => {
    unit.statuses.armorBreakTurns = Math.max(unit.statuses.armorBreakTurns ?? 0, effect.duration ?? 1);
    unit.statuses.armorBreakValue = effect.value ?? 0;
  },

  atkBuff: (unit, effect) => {
    unit.statuses.atkBuffTurns = Math.max(unit.statuses.atkBuffTurns ?? 0, effect.duration ?? 1);
    unit.statuses.atkBuffValue = effect.value ?? 0;
  },

  atkDebuff: (unit, effect) => {
    unit.statuses.atkDebuffTurns = Math.max(unit.statuses.atkDebuffTurns ?? 0, effect.duration ?? 1);
    unit.statuses.atkDebuffValue = effect.value ?? 0;
  },

  defBuff: (unit, effect) => {
    unit.statuses.defBuffTurns = Math.max(unit.statuses.defBuffTurns ?? 0, effect.duration ?? 1);
    unit.statuses.defBuffValue = effect.value ?? 0;
  },

  mdefBuff: (unit, effect) => {
    unit.statuses.mdefBuffTurns = Math.max(unit.statuses.mdefBuffTurns ?? 0, effect.duration ?? 1);
    unit.statuses.mdefBuffValue = effect.value ?? 0;
  },

  evadeBuff: (unit, effect) => {
    unit.statuses.evadeBuffTurns = Math.max(unit.statuses.evadeBuffTurns ?? 0, effect.duration ?? 1);
    unit.statuses.evadeBuffValue = effect.value ?? 0;
  },

  evadeDebuff: (unit, effect) => {
    unit.statuses.evadeDebuffTurns = Math.max(unit.statuses.evadeDebuffTurns ?? 0, effect.duration ?? 1);
    unit.statuses.evadeDebuffValue = effect.value ?? 0;
  },

  // Special effects
  taunt: (unit, effect) => {
    unit.statuses.tauntTurns = Math.max(unit.statuses.tauntTurns ?? 0, effect.duration ?? 1);
    unit.statuses.tauntTargetId = effect.targetId ?? null;
  },

  reflect: (unit, effect) => {
    unit.statuses.reflectTurns = Math.max(unit.statuses.reflectTurns ?? 0, effect.duration ?? 1);
    unit.statuses.reflectPct = effect.value ?? 0;
  },

  disarm: (unit, effect) => {
    unit.statuses.disarmTurns = Math.max(unit.statuses.disarmTurns ?? 0, effect.duration ?? 1);
  },

  immune: (unit, effect) => {
    unit.statuses.immuneTurns = Math.max(unit.statuses.immuneTurns ?? 0, effect.duration ?? 1);
  },

  physReflect: (unit, effect) => {
    unit.statuses.physReflectTurns = Math.max(unit.statuses.physReflectTurns ?? 0, effect.duration ?? 1);
  },

  counter: (unit, effect) => {
    unit.statuses.counterTurns = Math.max(unit.statuses.counterTurns ?? 0, effect.duration ?? 1);
  },

  protecting: (unit, effect) => {
    unit.statuses.isProtecting = effect.duration ?? 1;
  }
};

/**
 * Tick handlers - called each turn to process ongoing status effects
 * Returns { damage, healed, expired } for effects that trigger
 */
export const TICK_HANDLERS = {
  // Control effects - just decrement
  freeze: (unit) => {
    if (unit.statuses.freeze > 0) {
      unit.statuses.freeze--;
      return { expired: unit.statuses.freeze === 0 };
    }
    return {};
  },

  stun: (unit) => {
    if (unit.statuses.stun > 0) {
      unit.statuses.stun--;
      return { expired: unit.statuses.stun === 0 };
    }
    return {};
  },

  sleep: (unit) => {
    if (unit.statuses.sleep > 0) {
      unit.statuses.sleep--;
      return { expired: unit.statuses.sleep === 0 };
    }
    return {};
  },

  silence: (unit) => {
    if (unit.statuses.silence > 0) {
      unit.statuses.silence--;
      return { expired: unit.statuses.silence === 0 };
    }
    return {};
  },

  // Damage over time effects
  burn: (unit) => {
    if (unit.statuses.burnTurns > 0) {
      const damage = unit.statuses.burnDamage ?? 0;
      unit.statuses.burnTurns--;
      const expired = unit.statuses.burnTurns === 0;
      if (expired) {
        unit.statuses.burnDamage = 0;
      }
      return { damage, expired };
    }
    return {};
  },

  poison: (unit) => {
    if (unit.statuses.poisonTurns > 0) {
      const damage = unit.statuses.poisonDamage ?? 0;
      unit.statuses.poisonTurns--;
      const expired = unit.statuses.poisonTurns === 0;
      if (expired) {
        unit.statuses.poisonDamage = 0;
      }
      return { damage, expired };
    }
    return {};
  },

  bleed: (unit) => {
    if (unit.statuses.bleedTurns > 0) {
      const damage = unit.statuses.bleedDamage ?? 0;
      unit.statuses.bleedTurns--;
      const expired = unit.statuses.bleedTurns === 0;
      if (expired) {
        unit.statuses.bleedDamage = 0;
      }
      return { damage, expired };
    }
    return {};
  },

  disease: (unit) => {
    if (unit.statuses.diseaseTurns > 0) {
      const damage = unit.statuses.diseaseDamage ?? 0;
      unit.statuses.diseaseTurns--;
      const expired = unit.statuses.diseaseTurns === 0;
      if (expired) {
        unit.statuses.diseaseDamage = 0;
      }
      return { damage, expired };
    }
    return {};
  },

  // Stat modifiers - just decrement
  armorBreak: (unit) => {
    if (unit.statuses.armorBreakTurns > 0) {
      unit.statuses.armorBreakTurns--;
      const expired = unit.statuses.armorBreakTurns === 0;
      if (expired) {
        unit.statuses.armorBreakValue = 0;
      }
      return { expired };
    }
    return {};
  },

  atkBuff: (unit) => {
    if (unit.statuses.atkBuffTurns > 0) {
      unit.statuses.atkBuffTurns--;
      const expired = unit.statuses.atkBuffTurns === 0;
      if (expired) {
        unit.statuses.atkBuffValue = 0;
      }
      return { expired };
    }
    return {};
  },

  atkDebuff: (unit) => {
    if (unit.statuses.atkDebuffTurns > 0) {
      unit.statuses.atkDebuffTurns--;
      const expired = unit.statuses.atkDebuffTurns === 0;
      if (expired) {
        unit.statuses.atkDebuffValue = 0;
      }
      return { expired };
    }
    return {};
  },

  defBuff: (unit) => {
    if (unit.statuses.defBuffTurns > 0) {
      unit.statuses.defBuffTurns--;
      const expired = unit.statuses.defBuffTurns === 0;
      if (expired) {
        unit.statuses.defBuffValue = 0;
      }
      return { expired };
    }
    return {};
  },

  mdefBuff: (unit) => {
    if (unit.statuses.mdefBuffTurns > 0) {
      unit.statuses.mdefBuffTurns--;
      const expired = unit.statuses.mdefBuffTurns === 0;
      if (expired) {
        unit.statuses.mdefBuffValue = 0;
      }
      return { expired };
    }
    return {};
  },

  evadeBuff: (unit) => {
    if (unit.statuses.evadeBuffTurns > 0) {
      unit.statuses.evadeBuffTurns--;
      const expired = unit.statuses.evadeBuffTurns === 0;
      if (expired) {
        unit.statuses.evadeBuffValue = 0;
      }
      return { expired };
    }
    return {};
  },

  evadeDebuff: (unit) => {
    if (unit.statuses.evadeDebuffTurns > 0) {
      unit.statuses.evadeDebuffTurns--;
      const expired = unit.statuses.evadeDebuffTurns === 0;
      if (expired) {
        unit.statuses.evadeDebuffValue = 0;
      }
      return { expired };
    }
    return {};
  },

  // Special effects
  taunt: (unit) => {
    if (unit.statuses.tauntTurns > 0) {
      unit.statuses.tauntTurns--;
      const expired = unit.statuses.tauntTurns === 0;
      if (expired) {
        unit.statuses.tauntTargetId = null;
      }
      return { expired };
    }
    return {};
  },

  reflect: (unit) => {
    if (unit.statuses.reflectTurns > 0) {
      unit.statuses.reflectTurns--;
      const expired = unit.statuses.reflectTurns === 0;
      if (expired) {
        unit.statuses.reflectPct = 0;
      }
      return { expired };
    }
    return {};
  },

  disarm: (unit) => {
    if (unit.statuses.disarmTurns > 0) {
      unit.statuses.disarmTurns--;
      return { expired: unit.statuses.disarmTurns === 0 };
    }
    return {};
  },

  immune: (unit) => {
    if (unit.statuses.immuneTurns > 0) {
      unit.statuses.immuneTurns--;
      return { expired: unit.statuses.immuneTurns === 0 };
    }
    return {};
  },

  physReflect: (unit) => {
    if (unit.statuses.physReflectTurns > 0) {
      unit.statuses.physReflectTurns--;
      return { expired: unit.statuses.physReflectTurns === 0 };
    }
    return {};
  },

  counter: (unit) => {
    if (unit.statuses.counterTurns > 0) {
      unit.statuses.counterTurns--;
      return { expired: unit.statuses.counterTurns === 0 };
    }
    return {};
  },

  protecting: (unit) => {
    if (unit.statuses.isProtecting > 0) {
      unit.statuses.isProtecting--;
      return { expired: unit.statuses.isProtecting === 0 };
    }
    return {};
  }
};

/**
 * Get all supported status effect types
 */
export function getSupportedStatusTypes() {
  return Object.keys(APPLY_HANDLERS);
}

/**
 * Check if a status effect type is supported
 */
export function isStatusTypeSupported(type) {
  return type in APPLY_HANDLERS;
}
