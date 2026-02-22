/**
 * Preservation Property Tests - Targeting System
 * 
 * **Validates: Requirements 3.4, 3.5, 3.6**
 * 
 * This test verifies that existing targeting behavior for non-Assassin roles
 * continues to work correctly after fixing the Assassin targeting bug.
 * 
 * **IMPORTANT**: Follow observation-first methodology
 * - These tests capture the CURRENT behavior on UNFIXED code
 * - Tests should PASS on unfixed code (confirms baseline to preserve)
 * - Tests should PASS after fix (confirms no regressions)
 * 
 * **EXPECTED OUTCOME**: Tests PASS on unfixed code and after fix
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { selectTarget } from '../src/systems/AISystem.js';

// Arbitraries for property-based testing
const enemyArbitrary = (uid, side = 'RIGHT') => fc.record({
  uid: fc.constant(uid),
  row: fc.integer({ min: 1, max: 3 }),
  col: fc.integer({ min: 1, max: 5 }),
  side: fc.constant(side),
  alive: fc.constant(true),
  classType: fc.constantFrom('FIGHTER', 'MAGE', 'ARCHER', 'TANKER', 'SUPPORT')
});

describe('Preservation Property Tests - Targeting System', () => {
  /**
   * Property 1: TANKER Targets Nearest Enemy
   * 
   * **Validates: Requirement 3.4**
   * 
   * TANKER role should target the nearest enemy (frontline targeting).
   * This behavior should be preserved after fixing Assassin targeting.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 1: TANKER targets nearest enemy (frontline)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // TANKER row
        fc.integer({ min: 1, max: 2 }), // TANKER col (left side)
        (tankerRow, tankerCol) => {
          // Create TANKER on LEFT side
          const tanker = {
            uid: 'tanker1',
            row: tankerRow,
            col: tankerCol,
            side: 'LEFT',
            classType: 'TANKER',
            range: 1, // Melee range
            alive: true
          };

          // Create enemies at different distances on RIGHT side
          const enemies = [
            {
              uid: 'enemy_nearest',
              row: tankerRow,
              col: 3,
              side: 'RIGHT',
              alive: true,
              classType: 'FIGHTER'
            },
            {
              uid: 'enemy_middle',
              row: tankerRow,
              col: 4,
              side: 'RIGHT',
              alive: true,
              classType: 'MAGE'
            },
            {
              uid: 'enemy_farthest',
              row: tankerRow,
              col: 5,
              side: 'RIGHT',
              alive: true,
              classType: 'ARCHER'
            }
          ];

          const state = { units: [tanker, ...enemies] };
          const target = selectTarget(tanker, state, 'MEDIUM', { deterministic: true });

          // TANKER should target NEAREST enemy (frontline)
          expect(target).toBeDefined();
          expect(target.uid).toBe('enemy_nearest');
          expect(target.col).toBe(3); // Nearest column

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2: FIGHTER Targets Nearest Enemy
   * 
   * **Validates: Requirement 3.4**
   * 
   * FIGHTER role should target the nearest enemy (frontline targeting).
   * This behavior should be preserved after fixing Assassin targeting.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 2: FIGHTER targets nearest enemy (frontline)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // FIGHTER row
        fc.integer({ min: 1, max: 2 }), // FIGHTER col (left side)
        (fighterRow, fighterCol) => {
          // Create FIGHTER on LEFT side
          const fighter = {
            uid: 'fighter1',
            row: fighterRow,
            col: fighterCol,
            side: 'LEFT',
            classType: 'FIGHTER',
            range: 1, // Melee range
            alive: true
          };

          // Create enemies at different distances on RIGHT side
          const enemies = [
            {
              uid: 'enemy_nearest',
              row: fighterRow,
              col: 3,
              side: 'RIGHT',
              alive: true,
              classType: 'FIGHTER'
            },
            {
              uid: 'enemy_middle',
              row: fighterRow,
              col: 4,
              side: 'RIGHT',
              alive: true,
              classType: 'MAGE'
            },
            {
              uid: 'enemy_farthest',
              row: fighterRow,
              col: 5,
              side: 'RIGHT',
              alive: true,
              classType: 'ARCHER'
            }
          ];

          const state = { units: [fighter, ...enemies] };
          const target = selectTarget(fighter, state, 'MEDIUM', { deterministic: true });

          // FIGHTER should target NEAREST enemy (frontline)
          expect(target).toBeDefined();
          expect(target.uid).toBe('enemy_nearest');
          expect(target.col).toBe(3); // Nearest column

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: ARCHER Uses Ranged Targeting Logic
   * 
   * **Validates: Requirement 3.5**
   * 
   * ARCHER role should use ranged targeting logic (prioritize same row).
   * This behavior should be preserved after fixing Assassin targeting.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 3: ARCHER uses ranged targeting (prioritize same row)', () => {
    const archer = {
      uid: 'archer1',
      row: 2,
      col: 1,
      side: 'LEFT',
      classType: 'ARCHER',
      range: 3, // Ranged
      alive: true
    };

    // Create enemies at different positions
    const enemies = [
      {
        uid: 'enemy_top',
        row: 1,
        col: 4,
        side: 'RIGHT',
        alive: true,
        classType: 'FIGHTER'
      },
      {
        uid: 'enemy_same_row',
        row: 2, // Same row as archer
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'MAGE'
      },
      {
        uid: 'enemy_bottom',
        row: 3,
        col: 4,
        side: 'RIGHT',
        alive: true,
        classType: 'ARCHER'
      }
    ];

    const state = { units: [archer, ...enemies] };
    const target = selectTarget(archer, state, 'MEDIUM', { deterministic: true });

    // ARCHER should prioritize same row target
    expect(target).toBeDefined();
    expect(target.uid).toBe('enemy_same_row');
    expect(target.row).toBe(2);
  });

  /**
   * Property 4: MAGE Uses Ranged Targeting Logic
   * 
   * **Validates: Requirement 3.5**
   * 
   * MAGE role should use ranged targeting logic (prioritize same row).
   * This behavior should be preserved after fixing Assassin targeting.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 4: MAGE uses ranged targeting (prioritize same row)', () => {
    const mage = {
      uid: 'mage1',
      row: 2,
      col: 1,
      side: 'LEFT',
      classType: 'MAGE',
      range: 3, // Ranged
      alive: true
    };

    // Create enemies at different positions
    const enemies = [
      {
        uid: 'enemy_top',
        row: 1,
        col: 4,
        side: 'RIGHT',
        alive: true,
        classType: 'FIGHTER'
      },
      {
        uid: 'enemy_same_row',
        row: 2, // Same row as mage
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'MAGE'
      },
      {
        uid: 'enemy_bottom',
        row: 3,
        col: 4,
        side: 'RIGHT',
        alive: true,
        classType: 'ARCHER'
      }
    ];

    const state = { units: [mage, ...enemies] };
    const target = selectTarget(mage, state, 'MEDIUM', { deterministic: true });

    // MAGE should prioritize same row target
    expect(target).toBeDefined();
    expect(target.uid).toBe('enemy_same_row');
    expect(target.row).toBe(2);
  });

  /**
   * Property 5: SUPPORT Uses Ranged Targeting Logic
   * 
   * **Validates: Requirement 3.5**
   * 
   * SUPPORT role should use ranged targeting logic (prioritize same row).
   * This behavior should be preserved after fixing Assassin targeting.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 5: SUPPORT uses ranged targeting (prioritize same row)', () => {
    const support = {
      uid: 'support1',
      row: 2,
      col: 1,
      side: 'LEFT',
      classType: 'SUPPORT',
      range: 3, // Ranged
      alive: true
    };

    // Create enemies at different positions
    const enemies = [
      {
        uid: 'enemy_top',
        row: 1,
        col: 4,
        side: 'RIGHT',
        alive: true,
        classType: 'FIGHTER'
      },
      {
        uid: 'enemy_same_row',
        row: 2, // Same row as support
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'MAGE'
      },
      {
        uid: 'enemy_bottom',
        row: 3,
        col: 4,
        side: 'RIGHT',
        alive: true,
        classType: 'ARCHER'
      }
    ];

    const state = { units: [support, ...enemies] };
    const target = selectTarget(support, state, 'MEDIUM', { deterministic: true });

    // SUPPORT should prioritize same row target
    expect(target).toBeDefined();
    expect(target.uid).toBe('enemy_same_row');
    expect(target.row).toBe(2);
  });

  /**
   * Property 6: Melee Frontline Targeting Consistency
   * 
   * **Validates: Requirement 3.4**
   * 
   * Property-based test with random positions to verify that
   * melee frontline units (TANKER, FIGHTER) consistently target
   * the nearest enemy across many scenarios.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 6: Melee frontline units always target nearest enemy', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('TANKER', 'FIGHTER'),
        fc.integer({ min: 1, max: 3 }), // Attacker row
        fc.array(enemyArbitrary('enemy'), { minLength: 2, maxLength: 5 }),
        (classType, attackerRow, enemies) => {
          // Ensure enemies have unique UIDs and are on RIGHT side
          const uniqueEnemies = enemies.map((e, i) => ({
            ...e,
            uid: `enemy${i}`,
            side: 'RIGHT',
            alive: true
          }));

          const attacker = {
            uid: 'attacker1',
            row: attackerRow,
            col: 1,
            side: 'LEFT',
            classType: classType,
            range: 1, // Melee
            alive: true
          };

          const state = { units: [attacker, ...uniqueEnemies] };
          const target = selectTarget(attacker, state, 'MEDIUM', { deterministic: true });

          // Find the enemy with the lowest column (nearest)
          const nearestCol = Math.min(...uniqueEnemies.map(e => e.col));
          const nearestEnemies = uniqueEnemies.filter(e => e.col === nearestCol);

          // Target should be one of the nearest enemies
          expect(target).toBeDefined();
          expect(target.col).toBe(nearestCol);
          expect(nearestEnemies.some(e => e.uid === target.uid)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Ranged Targeting Consistency
   * 
   * **Validates: Requirement 3.5**
   * 
   * Property-based test with random positions to verify that
   * ranged units (ARCHER, MAGE, SUPPORT) consistently use their
   * targeting logic (prioritize same row) across many scenarios.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 7: Ranged units prioritize same row targets', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ARCHER', 'MAGE', 'SUPPORT'),
        fc.integer({ min: 1, max: 3 }), // Attacker row
        (classType, attackerRow) => {
          const attacker = {
            uid: 'attacker1',
            row: attackerRow,
            col: 1,
            side: 'LEFT',
            classType: classType,
            range: 3, // Ranged
            alive: true
          };

          // Create enemies: one in same row, others in different rows
          const enemies = [
            {
              uid: 'enemy_same_row',
              row: attackerRow,
              col: 4,
              side: 'RIGHT',
              alive: true,
              classType: 'FIGHTER'
            },
            {
              uid: 'enemy_other_row',
              row: attackerRow === 1 ? 2 : 1,
              col: 3, // Even closer, but different row
              side: 'RIGHT',
              alive: true,
              classType: 'MAGE'
            }
          ];

          const state = { units: [attacker, ...enemies] };
          const target = selectTarget(attacker, state, 'MEDIUM', { deterministic: true });

          // Should prioritize same row even if farther
          expect(target).toBeDefined();
          expect(target.uid).toBe('enemy_same_row');
          expect(target.row).toBe(attackerRow);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8: Action Pattern-Based Targeting Exists
   * 
   * **Validates: Requirement 3.6 (special targeting patterns)**
   * 
   * This test documents that the targeting system supports different
   * action patterns (MELEE_FRONT, RANGED_STATIC, ASSASSIN_BACK, etc.)
   * and that these patterns are used in combat. This is a structural
   * preservation test - we're not testing specific targeting behavior
   * here, just that the pattern system exists and is used.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 8: Targeting system supports role-based selection', () => {
    // Test that selectTarget returns valid targets for all role types
    const roles = ['TANKER', 'FIGHTER', 'ARCHER', 'MAGE', 'SUPPORT', 'ASSASSIN'];
    
    roles.forEach(classType => {
      const attacker = {
        uid: 'attacker1',
        row: 2,
        col: 1,
        side: 'LEFT',
        classType: classType,
        range: classType === 'TANKER' || classType === 'FIGHTER' ? 1 : 3,
        alive: true
      };

      const enemies = [
        {
          uid: 'enemy1',
          row: 2,
          col: 3,
          side: 'RIGHT',
          alive: true,
          classType: 'FIGHTER'
        },
        {
          uid: 'enemy2',
          row: 2,
          col: 5,
          side: 'RIGHT',
          alive: true,
          classType: 'ARCHER'
        }
      ];

      const state = { units: [attacker, ...enemies] };
      const target = selectTarget(attacker, state, 'MEDIUM', { deterministic: true });

      // All roles should be able to select a valid target
      expect(target).toBeDefined();
      expect(target.side).toBe('RIGHT');
      expect(target.alive).toBe(true);
    });
  });

  /**
   * Property 9: Taunt Forces Target Selection
   * 
   * **Validates: Requirement 3.6 (special targeting patterns)**
   * 
   * When a unit has a taunt status, it should force target selection
   * regardless of role-based targeting logic. This is a special
   * targeting pattern that should be preserved.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 9: Taunt status forces target selection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('TANKER', 'FIGHTER', 'ARCHER', 'MAGE', 'SUPPORT', 'ASSASSIN'),
        fc.integer({ min: 1, max: 3 }),
        (classType, attackerRow) => {
          const attacker = {
            uid: 'attacker1',
            row: attackerRow,
            col: 1,
            side: 'LEFT',
            classType: classType,
            range: classType === 'TANKER' || classType === 'FIGHTER' ? 1 : 3,
            alive: true,
            statuses: {
              tauntTargetId: 'taunter'
            }
          };

          const enemies = [
            {
              uid: 'enemy_normal',
              row: attackerRow,
              col: 3,
              side: 'RIGHT',
              alive: true,
              classType: 'FIGHTER'
            },
            {
              uid: 'taunter',
              row: attackerRow === 1 ? 2 : 1,
              col: 5,
              side: 'RIGHT',
              alive: true,
              classType: 'TANKER'
            }
          ];

          const state = { units: [attacker, ...enemies] };
          const target = selectTarget(attacker, state, 'MEDIUM', { deterministic: true });

          // Should target the taunter regardless of role-based logic
          expect(target).toBeDefined();
          expect(target.uid).toBe('taunter');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 10: All Roles Can Select Valid Targets
   * 
   * **Validates: Requirements 3.4, 3.5, 3.6**
   * 
   * Comprehensive test to ensure all roles can successfully select
   * targets using their respective targeting logic. This verifies
   * that the targeting system works for all roles.
   * 
   * **EXPECTED**: This test PASSES on unfixed code and after fix
   */
  it('Property 10: All roles can select valid targets', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('TANKER', 'FIGHTER', 'ARCHER', 'MAGE', 'SUPPORT', 'ASSASSIN'),
        fc.integer({ min: 1, max: 3 }),
        fc.array(enemyArbitrary('enemy'), { minLength: 1, maxLength: 5 }),
        (classType, attackerRow, enemies) => {
          const uniqueEnemies = enemies.map((e, i) => ({
            ...e,
            uid: `enemy${i}`,
            side: 'RIGHT',
            alive: true
          }));

          const attacker = {
            uid: 'attacker1',
            row: attackerRow,
            col: 1,
            side: 'LEFT',
            classType: classType,
            range: classType === 'TANKER' || classType === 'FIGHTER' ? 1 : 3,
            alive: true
          };

          const state = { units: [attacker, ...uniqueEnemies] };
          const target = selectTarget(attacker, state, 'MEDIUM', { deterministic: true });

          // All roles should be able to select a valid target
          expect(target).toBeDefined();
          expect(target.side).toBe('RIGHT');
          expect(target.alive).toBe(true);
          expect(uniqueEnemies.some(e => e.uid === target.uid)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
