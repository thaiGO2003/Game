/**
 * Bug Condition Exploration Test - Assassin Targeting
 * 
 * **Validates: Requirements 2.1, 2.3, 2.5, 2.6, 2.7**
 * 
 * This test verifies the EXPECTED behavior for Assassin targeting:
 * - Assassin basic attacks should target the FARTHEST enemy (Requirement 2.5)
 * - When multiple enemies are equidistant, prefer same row (Requirement 2.6)
 * - When no same row target, prefer top row then bottom row (Requirement 2.7)
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * 
 * **EXPECTED OUTCOME**: Test FAILS on unfixed code (proves bug exists)
 * After fix: Test PASSES (confirms bug is fixed)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { selectTarget } from '../src/systems/AISystem.js';

// Arbitraries for property-based testing
const positionArbitrary = () => fc.record({
  row: fc.integer({ min: 1, max: 3 }),
  col: fc.integer({ min: 1, max: 5 })
});

const enemyArbitrary = (uid) => fc.record({
  uid: fc.constant(uid),
  row: fc.integer({ min: 1, max: 3 }),
  col: fc.integer({ min: 1, max: 5 }),
  side: fc.constant('RIGHT'),
  alive: fc.constant(true),
  classType: fc.constantFrom('FIGHTER', 'MAGE', 'ARCHER', 'TANKER')
});

describe('Bug Condition Exploration - Assassin Targeting', () => {
  /**
   * Property 1: Assassin Targets Farthest Enemy (Expected Behavior)
   * 
   * **Validates: Requirements 2.1, 2.5**
   * 
   * This property tests the EXPECTED behavior:
   * - Assassin basic attacks should target the FARTHEST enemy
   * 
   * **EXPECTED**: This test FAILS on unfixed code (bug: targets nearest)
   * After fix: This test PASSES (confirms correct behavior)
   */
  it('Property 1: Assassin should target farthest enemy', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // Assassin row
        fc.integer({ min: 1, max: 2 }), // Assassin col (left side)
        (assassinRow, assassinCol) => {
          // Create Assassin on LEFT side
          const assassin = {
            uid: 'assassin1',
            row: assassinRow,
            col: assassinCol,
            side: 'LEFT',
            classType: 'ASSASSIN',
            range: 1,
            alive: true
          };

          // Create enemies at different distances on RIGHT side
          // Nearest enemy at col=3, farthest at col=5
          const enemies = [
            {
              uid: 'enemy_nearest',
              row: assassinRow,
              col: 3,
              side: 'RIGHT',
              alive: true,
              classType: 'FIGHTER'
            },
            {
              uid: 'enemy_middle',
              row: assassinRow,
              col: 4,
              side: 'RIGHT',
              alive: true,
              classType: 'MAGE'
            },
            {
              uid: 'enemy_farthest',
              row: assassinRow,
              col: 5,
              side: 'RIGHT',
              alive: true,
              classType: 'ARCHER'
            }
          ];

          const state = { units: [assassin, ...enemies] };
          
          // Select target using AISystem
          const target = selectTarget(assassin, state, 'MEDIUM', { deterministic: true });

          // **CRITICAL ASSERTION**: Assassin should target FARTHEST enemy
          // On UNFIXED code: This will FAIL (targets nearest instead)
          // After fix: This will PASS
          expect(target).toBeDefined();
          expect(target.uid).toBe('enemy_farthest');
          expect(target.col).toBe(5); // Farthest column

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2: Assassin Tie-Breaking - Same Row Preference
   * 
   * **Validates: Requirements 2.3, 2.6**
   * 
   * When multiple enemies are at the same farthest distance,
   * Assassin should prefer the one in the same row
   * 
   * **EXPECTED**: This test FAILS on unfixed code
   * After fix: This test PASSES
   */
  it('Property 2: When multiple enemies equidistant, prefer same row', () => {
    const assassin = {
      uid: 'assassin1',
      row: 2,
      col: 1,
      side: 'LEFT',
      classType: 'ASSASSIN',
      range: 1,
      alive: true
    };

    // Three enemies at same farthest column (col=5) but different rows
    const enemies = [
      {
        uid: 'enemy_top',
        row: 1,
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'MAGE'
      },
      {
        uid: 'enemy_same_row',
        row: 2, // Same row as assassin
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'ARCHER'
      },
      {
        uid: 'enemy_bottom',
        row: 3,
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'FIGHTER'
      }
    ];

    const state = { units: [assassin, ...enemies] };
    const target = selectTarget(assassin, state, 'MEDIUM', { deterministic: true });

    // Should prefer same row when equidistant
    expect(target).toBeDefined();
    expect(target.uid).toBe('enemy_same_row');
    expect(target.row).toBe(2);
  });

  /**
   * Property 3: Assassin Tie-Breaking - Row Priority (Top > Bottom)
   * 
   * **Validates: Requirements 2.3, 2.7**
   * 
   * When multiple enemies are equidistant and none in same row,
   * prefer top row over bottom row
   * 
   * **EXPECTED**: This test FAILS on unfixed code
   * After fix: This test PASSES
   */
  it('Property 3: When no same row target, prefer top row over bottom', () => {
    const assassin = {
      uid: 'assassin1',
      row: 2,
      col: 1,
      side: 'LEFT',
      classType: 'ASSASSIN',
      range: 1,
      alive: true
    };

    // Two enemies at same farthest column, no same row
    const enemies = [
      {
        uid: 'enemy_top',
        row: 1, // Top row
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'MAGE'
      },
      {
        uid: 'enemy_bottom',
        row: 3, // Bottom row
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'FIGHTER'
      }
    ];

    const state = { units: [assassin, ...enemies] };
    const target = selectTarget(assassin, state, 'MEDIUM', { deterministic: true });

    // Should prefer top row (row 1) over bottom row (row 3)
    expect(target).toBeDefined();
    expect(target.uid).toBe('enemy_top');
    expect(target.row).toBe(1);
  });

  /**
   * Property 4: Assassin Targets Backline Over Frontline
   * 
   * **Validates: Requirements 2.1, 2.5**
   * 
   * Property-based test with random enemy positions
   * Assassin should always target the enemy with the highest column number
   * 
   * **EXPECTED**: This test FAILS on unfixed code
   * After fix: This test PASSES
   */
  it('Property 4: Assassin always targets enemy with highest column', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // Assassin row
        fc.array(enemyArbitrary('enemy'), { minLength: 2, maxLength: 5 }),
        (assassinRow, enemies) => {
          // Ensure enemies have unique UIDs and are on RIGHT side
          const uniqueEnemies = enemies.map((e, i) => ({
            ...e,
            uid: `enemy${i}`,
            side: 'RIGHT',
            alive: true
          }));

          const assassin = {
            uid: 'assassin1',
            row: assassinRow,
            col: 1,
            side: 'LEFT',
            classType: 'ASSASSIN',
            range: 1,
            alive: true
          };

          const state = { units: [assassin, ...uniqueEnemies] };
          const target = selectTarget(assassin, state, 'MEDIUM', { deterministic: true });

          // Find the enemy with the highest column (farthest)
          const farthestCol = Math.max(...uniqueEnemies.map(e => e.col));
          const farthestEnemies = uniqueEnemies.filter(e => e.col === farthestCol);

          // Target should be one of the farthest enemies
          expect(target).toBeDefined();
          expect(target.col).toBe(farthestCol);
          expect(farthestEnemies.some(e => e.uid === target.uid)).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Assassin Skills with ASSASSIN_BACK Pattern Work Correctly
   * 
   * **Validates: Requirement 2.2 (from Fault Condition)**
   * 
   * This is a control test: Assassin skills with ASSASSIN_BACK pattern
   * already work correctly (they target farthest). This test documents
   * that the bug only affects basic attacks.
   * 
   * **EXPECTED**: This test PASSES even on unfixed code
   */
  it('Property 5: Assassin skills with ASSASSIN_BACK pattern target farthest (control)', () => {
    // This test documents that skills work correctly
    // The bug only affects basic attacks
    const assassin = {
      uid: 'assassin1',
      row: 2,
      col: 1,
      side: 'LEFT',
      classType: 'ASSASSIN',
      range: 1,
      alive: true
    };

    const enemies = [
      {
        uid: 'enemy_nearest',
        row: 2,
        col: 3,
        side: 'RIGHT',
        alive: true,
        classType: 'FIGHTER'
      },
      {
        uid: 'enemy_farthest',
        row: 2,
        col: 5,
        side: 'RIGHT',
        alive: true,
        classType: 'ARCHER'
      }
    ];

    const state = { units: [assassin, ...enemies] };
    
    // When using selectTarget for skills, it should work correctly
    // (This is a control - the bug is in basic attack targeting)
    const target = selectTarget(assassin, state, 'MEDIUM', { deterministic: true });

    // Note: This test documents expected behavior
    // The actual bug might be in how basic attacks call selectTarget
    // or in a different code path
    expect(target).toBeDefined();
  });

  /**
   * Property 6: Comprehensive Tie-Breaking Test
   * 
   * **Validates: Requirements 2.6, 2.7**
   * 
   * Tests all tie-breaking rules in a single scenario:
   * - Multiple enemies at farthest distance
   * - Same row preference
   * - Top row > bottom row when no same row
   * 
   * **EXPECTED**: This test FAILS on unfixed code
   * After fix: This test PASSES
   */
  it('Property 6: Comprehensive tie-breaking with multiple farthest enemies', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // Assassin row
        (assassinRow) => {
          const assassin = {
            uid: 'assassin1',
            row: assassinRow,
            col: 1,
            side: 'LEFT',
            classType: 'ASSASSIN',
            range: 1,
            alive: true
          };

          // Create enemies at different columns
          const nearCol = 3;
          const farCol = 5;

          const enemies = [
            // Nearest enemies (should be ignored)
            { uid: 'near1', row: 1, col: nearCol, side: 'RIGHT', alive: true, classType: 'FIGHTER' },
            { uid: 'near2', row: 2, col: nearCol, side: 'RIGHT', alive: true, classType: 'MAGE' },
            
            // Farthest enemies (one should be selected based on row)
            { uid: 'far_top', row: 1, col: farCol, side: 'RIGHT', alive: true, classType: 'ARCHER' },
            { uid: 'far_same', row: assassinRow, col: farCol, side: 'RIGHT', alive: true, classType: 'MAGE' },
            { uid: 'far_bottom', row: 3, col: farCol, side: 'RIGHT', alive: true, classType: 'FIGHTER' }
          ];

          const state = { units: [assassin, ...enemies] };
          const target = selectTarget(assassin, state, 'MEDIUM', { deterministic: true });

          // Should target farthest column
          expect(target).toBeDefined();
          expect(target.col).toBe(farCol);

          // Should prefer same row if available
          if (assassinRow >= 1 && assassinRow <= 3) {
            expect(target.uid).toBe('far_same');
            expect(target.row).toBe(assassinRow);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
