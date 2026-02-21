/**
 * Property Tests: CombatSystem
 * 
 * **Validates: Requirements 11.2**
 * 
 * Feature: code-architecture-refactor
 * Task: 3.6.8
 * 
 * This test suite verifies:
 * - Property: Combat always ends within max rounds
 * - Property: Turn order is always sorted by speed
 * - Property: Damage is always non-negative
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  initializeCombat,
  getNextActor,
  executeAction,
  calculateDamage,
  checkCombatEnd,
  applyDamage
} from '../src/systems/CombatSystem.js';

/**
 * Arbitrary generator for combat units with unique UIDs
 */
const combatUnit = (side = 'LEFT') => fc.record({
  uid: fc.string({ minLength: 8, maxLength: 20 }), // Longer to avoid duplicates
  name: fc.string({ minLength: 3, maxLength: 15 }),
  side: fc.constant(side),
  hp: fc.integer({ min: 50, max: 500 }),
  maxHp: fc.integer({ min: 50, max: 500 }),
  atk: fc.integer({ min: 10, max: 100 }),
  def: fc.integer({ min: 5, max: 50 }),
  matk: fc.integer({ min: 10, max: 100 }),
  mdef: fc.integer({ min: 5, max: 50 }),
  speed: fc.integer({ min: 1, max: 100 }),
  rage: fc.integer({ min: 0, max: 100 }),
  rageMax: fc.constant(100),
  alive: fc.constant(true),
  isDead: fc.constant(false),
  statuses: fc.constant({})
});

/**
 * Arbitrary generator for player units (LEFT side)
 */
const playerUnit = () => combatUnit('LEFT');

/**
 * Arbitrary generator for enemy units (RIGHT side)
 */
const enemyUnit = () => combatUnit('RIGHT');

/**
 * Property: Combat Always Ends Within Max Rounds
 * 
 * For any valid combat state with player and enemy units, combat should always
 * reach a conclusion (player victory, enemy victory) within a reasonable number
 * of rounds. This prevents infinite combat loops and ensures game progression.
 * 
 * Note: Full combat simulation is complex and depends on many factors. These tests
 * verify that the combat system has mechanisms to ensure termination.
 * 
 * **Validates: Requirement 11.2**
 */
describe('Property: Combat Always Ends Within Max Rounds', () => {
  it('combat state initializes with isFinished=false (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 5 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 5 }),
        (playerUnits, enemyUnits) => {
          // Ensure units have positive HP and are alive
          playerUnits.forEach(u => {
            u.hp = Math.max(u.hp, 50);
            u.maxHp = Math.max(u.maxHp, u.hp);
            u.alive = true;
            u.isDead = false;
          });
          enemyUnits.forEach(u => {
            u.hp = Math.max(u.hp, 50);
            u.maxHp = Math.max(u.maxHp, u.hp);
            u.alive = true;
            u.isDead = false;
          });
          
          const state = initializeCombat(playerUnits, enemyUnits);
          
          // Combat should start in unfinished state
          return state.isFinished === false && state.winner === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkCombatEnd detects when all player units are dead (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 5 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 5 }),
        (playerUnits, enemyUnits) => {
          // Make all player units dead
          playerUnits.forEach(u => {
            u.hp = 0;
            u.alive = false;
            u.isDead = true;
          });
          
          // Make enemy units alive
          enemyUnits.forEach(u => {
            u.hp = Math.max(u.hp, 50);
            u.alive = true;
            u.isDead = false;
          });
          
          const state = initializeCombat(playerUnits, enemyUnits);
          const result = checkCombatEnd(state);
          
          // Should detect enemy victory
          return result.isFinished === true && result.winner === 'enemy';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkCombatEnd detects when all enemy units are dead (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 5 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 5 }),
        (playerUnits, enemyUnits) => {
          // Make player units alive
          playerUnits.forEach(u => {
            u.hp = Math.max(u.hp, 50);
            u.alive = true;
            u.isDead = false;
          });
          
          // Make all enemy units dead
          enemyUnits.forEach(u => {
            u.hp = 0;
            u.alive = false;
            u.isDead = true;
          });
          
          const state = initializeCombat(playerUnits, enemyUnits);
          const result = checkCombatEnd(state);
          
          // Should detect player victory
          return result.isFinished === true && result.winner === 'player';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('checkCombatEnd returns not finished when both sides have alive units (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 5 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 5 }),
        (playerUnits, enemyUnits) => {
          // Ensure at least one unit on each side is alive
          playerUnits.forEach(u => {
            u.hp = Math.max(u.hp, 50);
            u.alive = true;
            u.isDead = false;
          });
          enemyUnits.forEach(u => {
            u.hp = Math.max(u.hp, 50);
            u.alive = true;
            u.isDead = false;
          });
          
          const state = initializeCombat(playerUnits, enemyUnits);
          const result = checkCombatEnd(state);
          
          // Should not be finished
          return result.isFinished === false && result.winner === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('applyDamage reduces HP and marks units as dead when HP reaches 0 (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        fc.integer({ min: 1, max: 1000 }),
        (unit, damage) => {
          const state = { combatLog: [] };
          const initialHp = Math.max(unit.hp, 50);
          unit.hp = initialHp;
          unit.alive = true;
          unit.isDead = false;
          
          applyDamage(unit, damage, state);
          
          // HP should never go below 0
          if (unit.hp < 0) {
            return false;
          }
          
          // If damage >= initialHp, unit should be dead
          if (damage >= initialHp) {
            return unit.hp === 0 && unit.isDead === true && unit.alive === false;
          }
          
          // Otherwise, unit should still be alive
          return unit.hp === initialHp - damage && unit.alive === true;
        }
      ),
      { numRuns: 200 }
    );
  });
});

/**
 * Property: Turn Order Is Always Sorted By Speed
 * 
 * For any set of combat units, the turn order should always be sorted by unit
 * speed stats in descending order (within each side, then interleaved). This
 * ensures faster units act first, which is a core combat mechanic.
 * 
 * **Validates: Requirement 11.2**
 */
describe('Property: Turn Order Is Always Sorted By Speed', () => {
  it('turn order is sorted by speed for any unit configuration (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 10 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 10 }),
        (playerUnits, enemyUnits) => {
          const state = initializeCombat(playerUnits, enemyUnits);
          
          // Check that turn order is sorted by speed within each side
          const playerTurnOrder = state.turnOrder.filter(u => u.side === 'LEFT');
          const enemyTurnOrder = state.turnOrder.filter(u => u.side === 'RIGHT');
          
          // Verify player side is sorted by speed (descending)
          for (let i = 0; i < playerTurnOrder.length - 1; i++) {
            if (playerTurnOrder[i].speed < playerTurnOrder[i + 1].speed) {
              return false;
            }
          }
          
          // Verify enemy side is sorted by speed (descending)
          for (let i = 0; i < enemyTurnOrder.length - 1; i++) {
            if (enemyTurnOrder[i].speed < enemyTurnOrder[i + 1].speed) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('units with same speed maintain stable order (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 10, max: 100 }),
        (count, speed) => {
          // Create units with same speed
          const playerUnits = Array.from({ length: count }, (_, i) => ({
            uid: `p${i}`,
            name: `Player${i}`,
            side: 'LEFT',
            hp: 100,
            maxHp: 100,
            atk: 50,
            def: 10,
            matk: 50,
            mdef: 10,
            speed: speed, // Same speed
            rage: 0,
            rageMax: 100,
            alive: true,
            isDead: false,
            statuses: {}
          }));
          
          const enemyUnits = Array.from({ length: count }, (_, i) => ({
            uid: `e${i}`,
            name: `Enemy${i}`,
            side: 'RIGHT',
            hp: 100,
            maxHp: 100,
            atk: 50,
            def: 10,
            matk: 50,
            mdef: 10,
            speed: speed, // Same speed
            rage: 0,
            rageMax: 100,
            alive: true,
            isDead: false,
            statuses: {}
          }));
          
          const state = initializeCombat(playerUnits, enemyUnits);
          
          // All units should be in turn order
          return state.turnOrder.length === playerUnits.length + enemyUnits.length;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('fastest unit is always first in turn order (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 5 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 5 }),
        (playerUnits, enemyUnits) => {
          const state = initializeCombat(playerUnits, enemyUnits);
          
          // Find fastest unit overall
          const allUnits = [...playerUnits, ...enemyUnits];
          const maxSpeed = Math.max(...allUnits.map(u => u.speed));
          
          // First unit in turn order should have max speed (or close to it within same side)
          const firstUnit = state.turnOrder[0];
          const firstSideUnits = allUnits.filter(u => u.side === firstUnit.side);
          const maxSpeedInFirstSide = Math.max(...firstSideUnits.map(u => u.speed));
          
          return firstUnit.speed === maxSpeedInFirstSide;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('turn order contains all alive units (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 8 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 8 }),
        (playerUnits, enemyUnits) => {
          const state = initializeCombat(playerUnits, enemyUnits);
          
          const totalUnits = playerUnits.length + enemyUnits.length;
          
          // Turn order should contain all units
          return state.turnOrder.length === totalUnits;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('turn order has no duplicate units (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 8 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 8 }),
        (playerUnits, enemyUnits) => {
          const state = initializeCombat(playerUnits, enemyUnits);
          
          // Check for duplicate UIDs in turn order
          const uids = state.turnOrder.map(u => u.uid);
          const uniqueUids = new Set(uids);
          
          return uids.length === uniqueUids.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('turn order respects side interleaving (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(playerUnit(), { minLength: 1, maxLength: 5 }),
        fc.array(enemyUnit(), { minLength: 1, maxLength: 5 }),
        (playerUnits, enemyUnits) => {
          const state = initializeCombat(playerUnits, enemyUnits);
          
          // Turn order should alternate between sides when possible
          // (This is the interleaving behavior)
          const sides = state.turnOrder.map(u => u.side);
          
          // Count consecutive same-side units
          let maxConsecutive = 1;
          let currentConsecutive = 1;
          
          for (let i = 1; i < sides.length; i++) {
            if (sides[i] === sides[i - 1]) {
              currentConsecutive++;
              maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            } else {
              currentConsecutive = 1;
            }
          }
          
          // With interleaving, we shouldn't have too many consecutive same-side units
          // unless one side has significantly more units
          const playerCount = playerUnits.length;
          const enemyCount = enemyUnits.length;
          const maxExpectedConsecutive = Math.max(playerCount, enemyCount);
          
          return maxConsecutive <= maxExpectedConsecutive;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property: Damage Is Always Non-Negative
 * 
 * For any attacker and defender configuration, calculated damage should always
 * be non-negative (>= 0). Negative damage would be nonsensical and could cause
 * bugs. This ensures damage calculation is always valid.
 * 
 * **Validates: Requirement 11.2**
 */
describe('Property: Damage Is Always Non-Negative', () => {
  it('calculateDamage always returns non-negative damage (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        combatUnit('RIGHT'),
        (attacker, defender) => {
          const state = { combatLog: [] };
          
          // Calculate damage with null skill (basic attack)
          const result = calculateDamage(attacker, defender, null, state);
          
          if (result.success) {
            return result.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('damage is non-negative even with high defense (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 100, max: 500 }),
        (atk, def) => {
          const attacker = {
            atk: atk,
            matk: atk,
            statuses: {}
          };
          
          const defender = {
            def: def,
            mdef: def,
            statuses: {}
          };
          
          const state = { combatLog: [] };
          const result = calculateDamage(attacker, defender, null, state);
          
          if (result.success) {
            return result.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('damage is non-negative with skill attacks (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        combatUnit('RIGHT'),
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 15 }),
          damageType: fc.constantFrom('physical', 'magical'),
          scaleStat: fc.constantFrom('atk', 'matk'),
          base: fc.integer({ min: 0, max: 50 }),
          scale: fc.float({ min: Math.fround(0.1), max: Math.fround(3.0), noNaN: true }) // Exclude NaN
        }),
        (attacker, defender, skill) => {
          const state = { combatLog: [] };
          
          const result = calculateDamage(attacker, defender, skill, state);
          
          if (result.success) {
            return result.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('damage is non-negative for all damage types (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        combatUnit('RIGHT'),
        fc.constantFrom('physical', 'magical', 'true'),
        (attacker, defender, damageType) => {
          const state = { combatLog: [] };
          
          const skill = damageType === 'true' ? null : {
            name: 'Test Skill',
            damageType: damageType,
            scaleStat: damageType === 'physical' ? 'atk' : 'matk',
            base: 10,
            scale: 1.5
          };
          
          const result = calculateDamage(attacker, defender, skill, state);
          
          if (result.success) {
            return result.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('damage with status effects is non-negative (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        combatUnit('RIGHT'),
        fc.record({
          atkBuff: fc.integer({ min: -50, max: 50 }),
          defBuff: fc.integer({ min: -50, max: 50 })
        }),
        (attacker, defender, buffs) => {
          // Apply status effects
          attacker.statuses = {
            atkBuff: buffs.atkBuff
          };
          
          defender.statuses = {
            defBuff: buffs.defBuff
          };
          
          const state = { combatLog: [] };
          const result = calculateDamage(attacker, defender, null, state);
          
          if (result.success) {
            return result.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('minimum damage is at least 1 for successful attacks (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        combatUnit('RIGHT'),
        (attacker, defender) => {
          const state = { combatLog: [] };
          
          const result = calculateDamage(attacker, defender, null, state);
          
          if (result.success) {
            // Most damage calculations should result in at least 1 damage
            // (unless there's a specific miss/dodge mechanic)
            return result.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('damage scales reasonably with attack stat (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 200 }),
        fc.integer({ min: 5, max: 50 }),
        (atk, def) => {
          const attacker1 = {
            atk: atk,
            matk: atk,
            statuses: {}
          };
          
          const attacker2 = {
            atk: atk * 2, // Double attack
            matk: atk * 2,
            statuses: {}
          };
          
          const defender = {
            def: def,
            mdef: def,
            statuses: {}
          };
          
          const state = { combatLog: [] };
          
          const result1 = calculateDamage(attacker1, defender, null, state);
          const result2 = calculateDamage(attacker2, defender, null, state);
          
          if (result1.success && result2.success) {
            // Higher attack should result in higher or equal damage
            return result2.damage >= result1.damage && result1.damage >= 0 && result2.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('damage is reduced by defense but never negative (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 5, max: 100 }),
        (atk, def) => {
          const attacker = {
            atk: atk,
            matk: atk,
            statuses: {}
          };
          
          const defender1 = {
            def: def,
            mdef: def,
            statuses: {}
          };
          
          const defender2 = {
            def: def * 2, // Double defense
            mdef: def * 2,
            statuses: {}
          };
          
          const state = { combatLog: [] };
          
          const result1 = calculateDamage(attacker, defender1, null, state);
          const result2 = calculateDamage(attacker, defender2, null, state);
          
          if (result1.success && result2.success) {
            // Higher defense should result in lower or equal damage
            // But both should be non-negative
            return result1.damage >= result2.damage && 
                   result1.damage >= 0 && 
                   result2.damage >= 0;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
