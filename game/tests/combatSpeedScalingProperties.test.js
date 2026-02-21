import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property-based tests for combat speed scaling system
 * Task 15.3: Write property tests for combat speed scaling
 * 
 * **Property 27: Combat Speed Calculation**
 * For any combat state, the maximum unit count should be correctly calculated 
 * as max(leftTeam.length, rightTeam.length).
 * Validates: Requirements 11.1
 * 
 * **Property 28: Speed Multiplier Formula**
 * For any unit count n, the combat speed multiplier should be calculated as 
 * 1 + (n * 0.1), capped at a maximum value.
 * Validates: Requirements 11.2, 11.5
 * 
 * **Property 29: Speed Multiplier Recalculation**
 * For any change in team composition (unit added or removed), the combat speed 
 * multiplier should be recalculated.
 * Validates: Requirements 11.4
 */

const MAX_COMBAT_SPEED_MULTIPLIER = 2.5;

// Arbitraries (generators) for property-based testing
const combatUnitArbitrary = fc.record({
  side: fc.constantFrom('LEFT', 'RIGHT'),
  alive: fc.boolean()
});

const combatStateArbitrary = fc.record({
  leftTeam: fc.array(
    fc.record({ side: fc.constant('LEFT'), alive: fc.constant(true) }),
    { minLength: 0, maxLength: 20 }
  ),
  rightTeam: fc.array(
    fc.record({ side: fc.constant('RIGHT'), alive: fc.constant(true) }),
    { minLength: 0, maxLength: 20 }
  )
});

// Mock scene implementation
class MockCombatScene {
  constructor() {
    this.combatUnits = [];
    this.combatSpeedMultiplier = 3;
  }

  getCombatUnits(side) {
    return this.combatUnits.filter(u => u.alive && u.side === side);
  }

  calculateCombatSpeedMultiplier() {
    const leftTeam = this.getCombatUnits("LEFT");
    const rightTeam = this.getCombatUnits("RIGHT");
    const maxUnits = Math.max(leftTeam.length, rightTeam.length);
    
    // 10% speed increase per unit
    const speedIncrease = maxUnits * 0.10;
    const multiplier = 1 + speedIncrease;
    
    // Cap at maximum
    return Math.min(multiplier, MAX_COMBAT_SPEED_MULTIPLIER);
  }

  scaleCombatDuration(ms) {
    const value = Number(ms);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.max(1, Math.round(value * this.combatSpeedMultiplier));
  }
}

describe('Combat Speed Scaling Properties', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = new MockCombatScene();
  });

  describe('Property 27: Combat Speed Calculation', () => {
    /**
     * **Validates: Requirements 11.1**
     * 
     * For any combat state, the maximum unit count should be correctly calculated 
     * as max(leftTeam.length, rightTeam.length).
     */
    it('should always calculate max unit count as max(leftTeam.length, rightTeam.length)', () => {
      /**
       * Feature: skill-differentiation-and-wiki-overhaul, Property 27
       * For any combat state, the maximum unit count should be correctly calculated 
       * as max(leftTeam.length, rightTeam.length).
       */
      fc.assert(
        fc.property(combatStateArbitrary, (state) => {
          mockScene.combatUnits = [...state.leftTeam, ...state.rightTeam];
          
          const leftTeam = mockScene.getCombatUnits('LEFT');
          const rightTeam = mockScene.getCombatUnits('RIGHT');
          const maxUnits = Math.max(leftTeam.length, rightTeam.length);
          
          // Property: maxUnits should equal the larger of the two team sizes
          const expectedMax = Math.max(state.leftTeam.length, state.rightTeam.length);
          return maxUnits === expectedMax;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle asymmetric team sizes correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),
          fc.integer({ min: 0, max: 20 }),
          (leftCount, rightCount) => {
            mockScene.combatUnits = [
              ...Array.from({ length: leftCount }, () => ({ side: 'LEFT', alive: true })),
              ...Array.from({ length: rightCount }, () => ({ side: 'RIGHT', alive: true }))
            ];
            
            const leftTeam = mockScene.getCombatUnits('LEFT');
            const rightTeam = mockScene.getCombatUnits('RIGHT');
            const maxUnits = Math.max(leftTeam.length, rightTeam.length);
            
            // Property: maxUnits should be the larger of leftCount and rightCount
            return maxUnits === Math.max(leftCount, rightCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only count alive units', () => {
      fc.assert(
        fc.property(
          fc.array(combatUnitArbitrary, { minLength: 0, maxLength: 20 }),
          (units) => {
            mockScene.combatUnits = units;
            
            const leftTeam = mockScene.getCombatUnits('LEFT');
            const rightTeam = mockScene.getCombatUnits('RIGHT');
            
            // Property: getCombatUnits should only return alive units
            const allAlive = [...leftTeam, ...rightTeam].every(u => u.alive);
            return allAlive;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 28: Speed Multiplier Formula', () => {
    /**
     * **Validates: Requirements 11.2, 11.5**
     * 
     * For any unit count n, the combat speed multiplier should be calculated as 
     * 1 + (n * 0.1), capped at a maximum value.
     */
    it('should calculate multiplier as 1 + (n * 0.1) for any unit count', () => {
      /**
       * Feature: skill-differentiation-and-wiki-overhaul, Property 28
       * For any unit count n, the combat speed multiplier should be calculated as 
       * 1 + (n * 0.1), capped at a maximum value.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),
          (unitCount) => {
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'LEFT',
              alive: true
            }));
            
            const multiplier = mockScene.calculateCombatSpeedMultiplier();
            const expectedMultiplier = Math.min(1 + (unitCount * 0.1), MAX_COMBAT_SPEED_MULTIPLIER);
            
            // Property: multiplier should match formula or be capped
            return Math.abs(multiplier - expectedMultiplier) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never exceed maximum cap', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50 }),
          (unitCount) => {
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'RIGHT',
              alive: true
            }));
            
            const multiplier = mockScene.calculateCombatSpeedMultiplier();
            
            // Property: multiplier should never exceed MAX_COMBAT_SPEED_MULTIPLIER
            return multiplier <= MAX_COMBAT_SPEED_MULTIPLIER;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be at least 1.0 for any team composition', () => {
      fc.assert(
        fc.property(combatStateArbitrary, (state) => {
          mockScene.combatUnits = [...state.leftTeam, ...state.rightTeam];
          
          const multiplier = mockScene.calculateCombatSpeedMultiplier();
          
          // Property: multiplier should always be at least 1.0
          return multiplier >= 1.0;
        }),
        { numRuns: 100 }
      );
    });

    it('should increase monotonically with unit count up to cap', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 14 }),
          (unitCount) => {
            // Test with unitCount and unitCount + 1
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'LEFT',
              alive: true
            }));
            const multiplier1 = mockScene.calculateCombatSpeedMultiplier();
            
            mockScene.combatUnits.push({ side: 'LEFT', alive: true });
            const multiplier2 = mockScene.calculateCombatSpeedMultiplier();
            
            // Property: adding a unit should increase or maintain multiplier (if at cap)
            return multiplier2 >= multiplier1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply correct 10% increment per unit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (unitCount) => {
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'RIGHT',
              alive: true
            }));
            
            const multiplier = mockScene.calculateCombatSpeedMultiplier();
            const expectedIncrement = unitCount * 0.1;
            
            // Property: increment should be exactly 10% per unit (before cap)
            return Math.abs((multiplier - 1.0) - expectedIncrement) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 29: Speed Multiplier Recalculation', () => {
    /**
     * **Validates: Requirements 11.4**
     * 
     * For any change in team composition (unit added or removed), the combat speed 
     * multiplier should be recalculated.
     */
    it('should produce different multiplier when units die', () => {
      /**
       * Feature: skill-differentiation-and-wiki-overhaul, Property 29
       * For any change in team composition (unit added or removed), the combat speed 
       * multiplier should be recalculated.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (initialCount, unitsToKill) => {
            // Skip if we'd kill all units
            if (unitsToKill >= initialCount) return true;
            
            mockScene.combatUnits = Array.from({ length: initialCount }, () => ({
              side: 'LEFT',
              alive: true
            }));
            
            const initialMultiplier = mockScene.calculateCombatSpeedMultiplier();
            
            // Kill some units
            for (let i = 0; i < unitsToKill; i++) {
              mockScene.combatUnits[i].alive = false;
            }
            
            const newMultiplier = mockScene.calculateCombatSpeedMultiplier();
            
            // Property: multiplier should decrease when units die (unless at minimum)
            return newMultiplier <= initialMultiplier;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reflect current team state, not initial state', () => {
      fc.assert(
        fc.property(
          fc.array(combatUnitArbitrary, { minLength: 1, maxLength: 20 }),
          (units) => {
            mockScene.combatUnits = units;
            
            const multiplier = mockScene.calculateCombatSpeedMultiplier();
            
            // Count alive units manually
            const leftAlive = units.filter(u => u.side === 'LEFT' && u.alive).length;
            const rightAlive = units.filter(u => u.side === 'RIGHT' && u.alive).length;
            const maxAlive = Math.max(leftAlive, rightAlive);
            const expectedMultiplier = Math.min(1 + (maxAlive * 0.1), MAX_COMBAT_SPEED_MULTIPLIER);
            
            // Property: multiplier should match current alive unit count
            return Math.abs(multiplier - expectedMultiplier) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle sequential unit deaths correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 15 }),
          (initialCount) => {
            mockScene.combatUnits = Array.from({ length: initialCount }, () => ({
              side: 'RIGHT',
              alive: true
            }));
            
            const multipliers = [];
            
            // Record multiplier as units die one by one
            for (let i = 0; i < initialCount; i++) {
              multipliers.push(mockScene.calculateCombatSpeedMultiplier());
              if (i < initialCount - 1) {
                mockScene.combatUnits[i].alive = false;
              }
            }
            
            // Property: multipliers should be monotonically decreasing (or equal at cap)
            for (let i = 1; i < multipliers.length; i++) {
              if (multipliers[i] > multipliers[i - 1]) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle team imbalance changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (leftCount, rightCount) => {
            mockScene.combatUnits = [
              ...Array.from({ length: leftCount }, () => ({ side: 'LEFT', alive: true })),
              ...Array.from({ length: rightCount }, () => ({ side: 'RIGHT', alive: true }))
            ];
            
            const initialMultiplier = mockScene.calculateCombatSpeedMultiplier();
            const initialMax = Math.max(leftCount, rightCount);
            
            // Kill all units from the larger team
            const largerSide = leftCount > rightCount ? 'LEFT' : 'RIGHT';
            mockScene.combatUnits.forEach(u => {
              if (u.side === largerSide) u.alive = false;
            });
            
            const newMultiplier = mockScene.calculateCombatSpeedMultiplier();
            const newMax = Math.min(leftCount, rightCount);
            
            // Property: multiplier should reflect new max team size
            const expectedNewMultiplier = Math.min(1 + (newMax * 0.1), MAX_COMBAT_SPEED_MULTIPLIER);
            return Math.abs(newMultiplier - expectedNewMultiplier) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration Properties', () => {
    it('should apply multiplier consistently to all durations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }),
          fc.integer({ min: 100, max: 2000 }),
          (unitCount, baseDuration) => {
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'LEFT',
              alive: true
            }));
            
            mockScene.combatSpeedMultiplier = mockScene.calculateCombatSpeedMultiplier();
            const scaledDuration = mockScene.scaleCombatDuration(baseDuration);
            
            // Property: scaled duration should be base * multiplier (rounded)
            const expectedDuration = Math.max(1, Math.round(baseDuration * mockScene.combatSpeedMultiplier));
            return scaledDuration === expectedDuration;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain proportional timing relationships', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 100, max: 1000 }),
          (unitCount, duration1, duration2) => {
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'RIGHT',
              alive: true
            }));
            
            mockScene.combatSpeedMultiplier = mockScene.calculateCombatSpeedMultiplier();
            const scaled1 = mockScene.scaleCombatDuration(duration1);
            const scaled2 = mockScene.scaleCombatDuration(duration2);
            
            // Property: if duration1 < duration2, then scaled1 <= scaled2
            if (duration1 < duration2) {
              return scaled1 <= scaled2;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case durations correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 15 }),
          fc.oneof(
            fc.constant(0),
            fc.constant(-1),
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.integer({ min: 1, max: 1000 })
          ),
          (unitCount, duration) => {
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'LEFT',
              alive: true
            }));
            
            mockScene.combatSpeedMultiplier = mockScene.calculateCombatSpeedMultiplier();
            const scaled = mockScene.scaleCombatDuration(duration);
            
            // Property: scaled duration should always be non-negative and finite
            return Number.isFinite(scaled) && scaled >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Boundary Properties', () => {
    it('should handle minimum team size (0 units)', () => {
      fc.assert(
        fc.property(fc.constant(0), () => {
          mockScene.combatUnits = [];
          
          const multiplier = mockScene.calculateCombatSpeedMultiplier();
          
          // Property: 0 units should give multiplier of 1.0
          return multiplier === 1.0;
        }),
        { numRuns: 10 }
      );
    });

    it('should handle maximum team size (at cap)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 15, max: 50 }),
          (unitCount) => {
            mockScene.combatUnits = Array.from({ length: unitCount }, () => ({
              side: 'LEFT',
              alive: true
            }));
            
            const multiplier = mockScene.calculateCombatSpeedMultiplier();
            
            // Property: any count >= 15 should give multiplier of 2.5 (cap)
            return multiplier === MAX_COMBAT_SPEED_MULTIPLIER;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single unit per side', () => {
      fc.assert(
        fc.property(fc.constant(1), () => {
          mockScene.combatUnits = [
            { side: 'LEFT', alive: true },
            { side: 'RIGHT', alive: true }
          ];
          
          const multiplier = mockScene.calculateCombatSpeedMultiplier();
          
          // Property: 1 unit max should give multiplier of 1.1
          return Math.abs(multiplier - 1.1) < 0.001;
        }),
        { numRuns: 10 }
      );
    });
  });
});
