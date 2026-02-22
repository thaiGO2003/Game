import { describe, it, expect } from 'vitest';
import { calculateDamage, applyDamage } from '../src/systems/CombatSystem.js';

/**
 * Unit tests for CombatSystem damage calculation and application
 * Task 3.6.4: Extract damage calculation and application
 * Requirements: 4.6, 4.7, 4.8
 * 
 * **Property 21: Damage Calculation Includes Modifiers**
 * **Property 22: HP Never Goes Below Zero**
 * **Property 23: Death Handling**
 * **Validates: Requirements 4.6, 4.7, 4.8**
 */

describe('CombatSystem - Damage Calculation', () => {
  describe('calculateDamage - Basic Attack', () => {
    it('should calculate basic attack damage using attacker ATK', () => {
      const attacker = {
        atk: 50,
        statuses: {}
      };
      const defender = {
        def: 10,
        mdef: 5,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.damageType).toBe('physical');
    });

    it('should apply defense reduction to physical damage', () => {
      const attacker = {
        atk: 100,
        statuses: {}
      };
      const defender = {
        def: 50,
        mdef: 0,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // Formula: 100 * (100 / (100 + 50)) = 100 * 0.667 = 66.7 -> 67
      expect(result.damage).toBeLessThan(100);
      expect(result.damage).toBeGreaterThan(0);
    });

    it('should ensure minimum damage of 1', () => {
      const attacker = {
        atk: 1,
        statuses: {}
      };
      const defender = {
        def: 1000,
        mdef: 0,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateDamage - Skill Damage', () => {
    it('should calculate skill damage with base and scale', () => {
      const attacker = {
        atk: 50,
        matk: 30,
        star: 1,
        statuses: {}
      };
      const defender = {
        def: 10,
        mdef: 5,
        statuses: {}
      };
      const skill = {
        name: 'Fireball',
        base: 20,
        scale: 1.5,
        scaleStat: 'matk',
        damageType: 'magic'
      };
      const state = {};

      const result = calculateDamage(attacker, defender, skill, state);

      expect(result.success).toBe(true);
      // Base damage: (20 + 30 * 1.5) * 1.0 = 65
      // After magic defense: 65 * (100 / 105) = ~62
      expect(result.damage).toBeGreaterThan(0);
      expect(result.damageType).toBe('magic');
    });

    it('should apply star multiplier for 2-star units', () => {
      const attacker = {
        atk: 50,
        star: 2,
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        statuses: {}
      };
      const skill = {
        name: 'Slash',
        base: 10,
        scale: 1.0,
        scaleStat: 'atk',
        damageType: 'physical'
      };
      const state = {};

      const result = calculateDamage(attacker, defender, skill, state);

      expect(result.success).toBe(true);
      // Base damage: (10 + 50 * 1.0) * 1.2 = 72
      expect(result.damage).toBeGreaterThanOrEqual(72);
    });

    it('should apply star multiplier for 3-star units', () => {
      const attacker = {
        atk: 50,
        star: 3,
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        statuses: {}
      };
      const skill = {
        name: 'Slash',
        base: 10,
        scale: 1.0,
        scaleStat: 'atk',
        damageType: 'physical'
      };
      const state = {};

      const result = calculateDamage(attacker, defender, skill, state);

      expect(result.success).toBe(true);
      // Base damage: (10 + 50 * 1.0) * 1.4 = 84
      expect(result.damage).toBeGreaterThanOrEqual(84);
    });

    it('should default to physical damage type if not specified', () => {
      const attacker = {
        atk: 50,
        star: 1,
        statuses: {}
      };
      const defender = {
        def: 10,
        mdef: 5,
        statuses: {}
      };
      const skill = {
        name: 'Slash',
        base: 20,
        scale: 1.0,
        scaleStat: 'atk'
      };
      const state = {};

      const result = calculateDamage(attacker, defender, skill, state);

      expect(result.success).toBe(true);
      expect(result.damageType).toBe('physical');
    });

    it('should handle true damage type (ignores defense)', () => {
      const attacker = {
        atk: 50,
        star: 1,
        statuses: {}
      };
      const defender = {
        def: 100,
        mdef: 100,
        statuses: {}
      };
      const skill = {
        name: 'True Strike',
        base: 50,
        scale: 0,
        scaleStat: 'atk',
        damageType: 'true'
      };
      const state = {};

      const result = calculateDamage(attacker, defender, skill, state);

      expect(result.success).toBe(true);
      expect(result.damageType).toBe('true');
      // True damage should be close to base (50) regardless of defense
      expect(result.damage).toBeGreaterThanOrEqual(50);
    });
  });

  describe('calculateDamage - Elemental Modifiers', () => {
    it('should apply 1.5x damage for elemental advantage (non-tanker attacker)', () => {
      const attacker = {
        atk: 100,
        tribe: 'BEAST',
        classType: 'FIGHTER',
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        tribe: 'PLANT',
        classType: 'FIGHTER',
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // 100 * 1.5 = 150
      expect(result.damage).toBeGreaterThanOrEqual(150);
    });

    it('should apply 0.5x damage for elemental advantage against tanker', () => {
      const attacker = {
        atk: 100,
        tribe: 'BEAST',
        classType: 'FIGHTER',
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        tribe: 'PLANT',
        classType: 'TANKER',
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // 100 * 0.5 = 50
      expect(result.damage).toBeLessThanOrEqual(50);
    });

    it('should not apply elemental modifier when tanker attacks', () => {
      const attacker = {
        atk: 100,
        tribe: 'BEAST',
        classType: 'TANKER',
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        tribe: 'PLANT',
        classType: 'FIGHTER',
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // No modifier, should be base 100
      expect(result.damage).toBe(100);
    });

    it('should handle PLANT > AQUA elemental advantage', () => {
      const attacker = {
        atk: 100,
        tribe: 'PLANT',
        classType: 'FIGHTER',
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        tribe: 'AQUA',
        classType: 'FIGHTER',
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThanOrEqual(150);
    });

    it('should handle AQUA > BEAST elemental advantage', () => {
      const attacker = {
        atk: 100,
        tribe: 'AQUA',
        classType: 'FIGHTER',
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        tribe: 'BEAST',
        classType: 'FIGHTER',
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThanOrEqual(150);
    });
  });

  describe('calculateDamage - Status Effects', () => {
    it('should apply attack buff to damage calculation', () => {
      const attacker = {
        atk: 50,
        statuses: {
          atkBuffTurns: 2,
          atkBuffValue: 30
        }
      };
      const defender = {
        def: 0,
        mdef: 0,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // Effective ATK: 50 + 30 = 80
      expect(result.damage).toBeGreaterThanOrEqual(80);
    });

    it('should apply attack debuff to damage calculation', () => {
      const attacker = {
        atk: 100,
        statuses: {
          atkDebuffTurns: 2,
          atkDebuffValue: 40
        }
      };
      const defender = {
        def: 0,
        mdef: 0,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // Effective ATK: 100 - 40 = 60
      expect(result.damage).toBeLessThanOrEqual(60);
    });

    it('should apply defense buff to damage reduction', () => {
      const attacker = {
        atk: 100,
        statuses: {}
      };
      const defender = {
        def: 20,
        mdef: 0,
        statuses: {
          defBuffTurns: 2,
          defBuffValue: 30
        }
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // Effective DEF: 20 + 30 = 50
      // Damage: 100 * (100 / 150) = 66.7 -> 67
      expect(result.damage).toBeLessThan(100);
    });

    it('should apply armor break to reduce defense', () => {
      const attacker = {
        atk: 100,
        statuses: {}
      };
      const defender = {
        def: 50,
        mdef: 0,
        statuses: {
          armorBreakTurns: 2,
          armorBreakValue: 30
        }
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // Effective DEF: 50 - 30 = 20
      // Damage: 100 * (100 / 120) = 83.3 -> 83
      expect(result.damage).toBeGreaterThan(66); // More than without armor break
    });
  });

  describe('calculateDamage - Global Damage Multiplier', () => {
    it('should apply global damage multiplier from state', () => {
      const attacker = {
        atk: 100,
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        statuses: {}
      };
      const state = {
        globalDamageMult: 2.0
      };

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      // 100 * 2.0 = 200
      expect(result.damage).toBeGreaterThanOrEqual(200);
    });

    it('should work without global damage multiplier', () => {
      const attacker = {
        atk: 100,
        statuses: {}
      };
      const defender = {
        def: 0,
        mdef: 0,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      expect(result.damage).toBe(100);
    });
  });

  describe('calculateDamage - Error Handling', () => {
    it('should handle null attacker', () => {
      const defender = {
        def: 10,
        mdef: 5,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(null, defender, null, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid attacker or defender');
      expect(result.damage).toBe(0);
    });

    it('should handle null defender', () => {
      const attacker = {
        atk: 50,
        statuses: {}
      };
      const state = {};

      const result = calculateDamage(attacker, null, null, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid attacker or defender');
      expect(result.damage).toBe(0);
    });

    it('should handle missing statuses property', () => {
      const attacker = {
        atk: 50
      };
      const defender = {
        def: 10,
        mdef: 5
      };
      const state = {};

      const result = calculateDamage(attacker, defender, null, state);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
    });
  });
});

describe('CombatSystem - Damage Application', () => {
  describe('applyDamage - Basic Damage', () => {
    it('should reduce HP by damage amount', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 30, state);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(70);
      expect(result.hpLost).toBe(30);
      expect(result.died).toBe(false);
    });

    it('should ensure HP never goes below 0', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 50,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 100, state);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(0);
      expect(result.hpLost).toBe(50);
      expect(result.died).toBe(true);
    });

    it('should handle exactly lethal damage', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 50,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(0);
      expect(result.hpLost).toBe(50);
      expect(result.died).toBe(true);
    });

    it('should handle 0 damage', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 0, state);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(100);
      expect(result.hpLost).toBe(0);
      expect(result.died).toBe(false);
    });
  });

  describe('applyDamage - Shield Absorption', () => {
    it('should absorb damage with shield first', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 30,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 20, state);

      expect(result.success).toBe(true);
      expect(unit.shield).toBe(10);
      expect(unit.hp).toBe(100);
      expect(result.shieldAbsorbed).toBe(20);
      expect(result.hpLost).toBe(0);
      expect(result.died).toBe(false);
    });

    it('should break shield and damage HP', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 20,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(true);
      expect(unit.shield).toBe(0);
      expect(unit.hp).toBe(70);
      expect(result.shieldAbsorbed).toBe(20);
      expect(result.hpLost).toBe(30);
      expect(result.totalDamage).toBe(50);
      expect(result.died).toBe(false);
    });

    it('should handle shield larger than damage', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 100,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 30, state);

      expect(result.success).toBe(true);
      expect(unit.shield).toBe(70);
      expect(unit.hp).toBe(100);
      expect(result.shieldAbsorbed).toBe(30);
      expect(result.hpLost).toBe(0);
    });
  });

  describe('applyDamage - Unit Death', () => {
    it('should mark unit as dead when HP reaches 0', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 50,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(0);
      expect(unit.isDead).toBe(true);
      expect(unit.alive).toBe(false);
      expect(result.died).toBe(true);
    });

    it('should set shield to 0 when unit dies', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 30,
        maxHp: 100,
        shield: 20,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 100, state);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(0);
      expect(unit.shield).toBe(0);
      expect(unit.isDead).toBe(true);
      expect(result.died).toBe(true);
    });

    it('should remove unit from turn order when it dies', () => {
      const unit1 = {
        uid: 'u1',
        name: 'Warrior',
        hp: 50,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const unit2 = {
        uid: 'u2',
        name: 'Mage',
        hp: 80,
        maxHp: 80,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit1, unit2],
        combatLog: []
      };

      const result = applyDamage(unit1, 50, state);

      expect(result.success).toBe(true);
      expect(unit1.isDead).toBe(true);
      expect(state.turnOrder).toHaveLength(1);
      expect(state.turnOrder[0].uid).toBe('u2');
    });

    it('should log death event to combat log', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 50,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false,
        side: 'LEFT'
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(true);
      expect(state.combatLog).toHaveLength(1);
      expect(state.combatLog[0].type).toBe('UNIT_DEATH');
      expect(state.combatLog[0].unitName).toBe('Warrior');
      expect(state.combatLog[0].uid).toBe('u1');
      expect(state.combatLog[0].side).toBe('LEFT');
    });
  });

  describe('applyDamage - Error Handling', () => {
    it('should handle null unit', () => {
      const state = {
        turnOrder: [],
        combatLog: []
      };

      const result = applyDamage(null, 50, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid unit');
    });

    it('should handle invalid damage (negative)', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, -10, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid damage value');
    });

    it('should handle invalid damage (NaN)', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, NaN, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid damage value');
    });

    it('should handle invalid damage (Infinity)', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, Infinity, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid damage value');
    });

    it('should reject damage to already dead unit (isDead flag)', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 0,
        maxHp: 100,
        shield: 0,
        alive: false,
        isDead: true
      };
      const state = {
        turnOrder: [],
        combatLog: []
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit is already dead');
    });

    it('should reject damage to already dead unit (alive flag)', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 0,
        maxHp: 100,
        shield: 0,
        alive: false
      };
      const state = {
        turnOrder: [],
        combatLog: []
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit is already dead');
    });

    it('should handle missing state gracefully', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };

      const result = applyDamage(unit, 30, null);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(70);
      // Should not crash even without state
    });

    it('should handle missing turnOrder in state', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 50,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        combatLog: []
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(true);
      expect(unit.isDead).toBe(true);
      // Should not crash even without turnOrder
    });

    it('should handle missing combatLog in state', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 50,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit]
      };

      const result = applyDamage(unit, 50, state);

      expect(result.success).toBe(true);
      expect(unit.isDead).toBe(true);
      // Should not crash even without combatLog
    });
  });

  describe('applyDamage - Fractional Damage', () => {
    it('should round fractional damage', () => {
      const unit = {
        uid: 'u1',
        name: 'Warrior',
        hp: 100,
        maxHp: 100,
        shield: 0,
        alive: true,
        isDead: false
      };
      const state = {
        turnOrder: [unit],
        combatLog: []
      };

      const result = applyDamage(unit, 25.7, state);

      expect(result.success).toBe(true);
      expect(unit.hp).toBe(74); // 100 - 26 (rounded)
      expect(result.hpLost).toBe(26);
    });
  });
});
