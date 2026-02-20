import { getGoldReserveScaling } from '../src/core/gameUtils.js';
import * as fc from 'fast-check';

describe('getGoldReserveScaling', () => {
  describe('baseline and edge cases', () => {
    test('returns 1.0 for gold at baseline (10)', () => {
      expect(getGoldReserveScaling(10)).toBe(1.0);
    });

    test('returns 1.0 for gold below baseline', () => {
      expect(getGoldReserveScaling(0)).toBe(1.0);
      expect(getGoldReserveScaling(5)).toBe(1.0);
      expect(getGoldReserveScaling(9)).toBe(1.0);
    });

    test('handles negative gold by treating as 0', () => {
      expect(getGoldReserveScaling(-10)).toBe(1.0);
      expect(getGoldReserveScaling(-100)).toBe(1.0);
    });

    test('handles non-numeric input by treating as 0', () => {
      expect(getGoldReserveScaling(null)).toBe(1.0);
      expect(getGoldReserveScaling(undefined)).toBe(1.0);
      expect(getGoldReserveScaling(NaN)).toBe(1.0);
      expect(getGoldReserveScaling('50')).toBe(1.0);
      expect(getGoldReserveScaling({})).toBe(1.0);
    });

    test('handles Infinity by treating as 0', () => {
      expect(getGoldReserveScaling(Infinity)).toBe(1.0);
      expect(getGoldReserveScaling(-Infinity)).toBe(1.0);
    });
  });

  describe('formula correctness', () => {
    test('calculates correct multiplier for gold above baseline', () => {
      // Formula: 1.0 + ((gold - 10) / 2) / 100
      // Gold 30: 1.0 + ((30 - 10) / 2) / 100 = 1.0 + 10/100 = 1.10
      expect(getGoldReserveScaling(30)).toBe(1.10);
      
      // Gold 50: 1.0 + ((50 - 10) / 2) / 100 = 1.0 + 20/100 = 1.20
      expect(getGoldReserveScaling(50)).toBe(1.20);
      
      // Gold 70: 1.0 + ((70 - 10) / 2) / 100 = 1.0 + 30/100 = 1.30
      expect(getGoldReserveScaling(70)).toBe(1.30);
      
      // Gold 110: 1.0 + ((110 - 10) / 2) / 100 = 1.0 + 50/100 = 1.50
      expect(getGoldReserveScaling(110)).toBe(1.50);
    });

    test('calculates correct multiplier for fractional gold', () => {
      // Gold 11: 1.0 + ((11 - 10) / 2) / 100 = 1.0 + 0.5/100 = 1.005
      expect(getGoldReserveScaling(11)).toBe(1.005);
      
      // Gold 12: 1.0 + ((12 - 10) / 2) / 100 = 1.0 + 1/100 = 1.01
      expect(getGoldReserveScaling(12)).toBe(1.01);
    });
  });

  describe('cap enforcement', () => {
    test('caps multiplier at 2.0 for 210 gold', () => {
      // Gold 210: 1.0 + ((210 - 10) / 2) / 100 = 1.0 + 100/100 = 2.0
      expect(getGoldReserveScaling(210)).toBe(2.0);
    });

    test('caps multiplier at 2.0 for gold above 210', () => {
      expect(getGoldReserveScaling(300)).toBe(2.0);
      expect(getGoldReserveScaling(500)).toBe(2.0);
      expect(getGoldReserveScaling(1000)).toBe(2.0);
      expect(getGoldReserveScaling(10000)).toBe(2.0);
    });

    test('returns values below cap for gold below 210', () => {
      // Gold 200: 1.0 + ((200 - 10) / 2) / 100 = 1.0 + 95/100 = 1.95
      expect(getGoldReserveScaling(200)).toBe(1.95);
      
      // Gold 190: 1.0 + ((190 - 10) / 2) / 100 = 1.0 + 90/100 = 1.90
      expect(getGoldReserveScaling(190)).toBe(1.90);
    });
  });

  describe('monotonicity', () => {
    test('multiplier increases or stays same as gold increases', () => {
      const gold1 = getGoldReserveScaling(10);
      const gold2 = getGoldReserveScaling(30);
      const gold3 = getGoldReserveScaling(50);
      const gold4 = getGoldReserveScaling(100);
      const gold5 = getGoldReserveScaling(210);
      const gold6 = getGoldReserveScaling(500);
      
      expect(gold1).toBeLessThanOrEqual(gold2);
      expect(gold2).toBeLessThanOrEqual(gold3);
      expect(gold3).toBeLessThanOrEqual(gold4);
      expect(gold4).toBeLessThanOrEqual(gold5);
      expect(gold5).toBeLessThanOrEqual(gold6);
    });
  });

  describe('bounds', () => {
    test('multiplier is always between 1.0 and 2.0', () => {
      const testValues = [0, 5, 10, 20, 30, 50, 100, 150, 200, 210, 300, 1000];
      
      testValues.forEach(gold => {
        const multiplier = getGoldReserveScaling(gold);
        expect(multiplier).toBeGreaterThanOrEqual(1.0);
        expect(multiplier).toBeLessThanOrEqual(2.0);
      });
    });
  });

  describe('property-based tests', () => {
    describe('Property 1: Gold Scaling Monotonicity', () => {
      /**
       * **Validates: Requirements 1.4**
       * 
       * For any two gold amounts g1 and g2 where g1 < g2,
       * the gold multiplier for g1 should be less than or equal to
       * the gold multiplier for g2.
       */
      test('monotonicity: g1 < g2 implies scale(g1) <= scale(g2)', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 1000 }),
            fc.integer({ min: 0, max: 1000 }),
            (gold1, gold2) => {
              // Ensure g1 < g2
              const g1 = Math.min(gold1, gold2);
              const g2 = Math.max(gold1, gold2);
              
              if (g1 === g2) return true; // Skip equal values
              
              const scale1 = getGoldReserveScaling(g1);
              const scale2 = getGoldReserveScaling(g2);
              
              return scale1 <= scale2;
            }
          ),
          { numRuns: 1000 }
        );
      });
    });

    describe('Property 2: Gold Scaling Bounds', () => {
      /**
       * **Validates: Requirements 1.5**
       * 
       * For any gold amount, the gold multiplier should be between
       * 1.0 and 2.0 inclusive.
       */
      test('bounds: 1.0 <= scale(g) <= 2.0 for all g', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 10000 }),
            (gold) => {
              const multiplier = getGoldReserveScaling(gold);
              return multiplier >= 1.0 && multiplier <= 2.0;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('bounds: handles edge cases (negative, zero, very large)', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.integer({ min: -1000, max: -1 }), // Negative
              fc.constant(0), // Zero
              fc.integer({ min: 1, max: 10 }), // Below baseline
              fc.integer({ min: 11, max: 209 }), // Normal range
              fc.integer({ min: 210, max: 1000000 }) // Above cap
            ),
            (gold) => {
              const multiplier = getGoldReserveScaling(gold);
              return multiplier >= 1.0 && multiplier <= 2.0;
            }
          ),
          { numRuns: 1000 }
        );
      });
    });

    describe('Property 3: Gold Scaling Formula', () => {
      /**
       * **Validates: Requirements 1.2, 1.3**
       * 
       * For any gold amount above 10, the gold multiplier should equal
       * 1.0 + ((gold - 10) / 2) / 100, capped at 2.0.
       */
      test('formula: correct calculation for gold > 10', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 11, max: 500 }),
            (gold) => {
              const actual = getGoldReserveScaling(gold);
              
              // Calculate expected value using the formula
              const excessGold = gold - 10;
              const bonusPercent = excessGold / 2;
              const expected = Math.min(1.0 + (bonusPercent / 100), 2.0);
              
              // Use approximate equality for floating point comparison
              return Math.abs(actual - expected) < 0.0001;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('formula: returns 1.0 for gold <= 10', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: -100, max: 10 }),
            (gold) => {
              const multiplier = getGoldReserveScaling(gold);
              return multiplier === 1.0;
            }
          ),
          { numRuns: 500 }
        );
      });

      test('formula: caps at 2.0 for gold >= 210', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 210, max: 100000 }),
            (gold) => {
              const multiplier = getGoldReserveScaling(gold);
              return multiplier === 2.0;
            }
          ),
          { numRuns: 500 }
        );
      });
    });

    describe('edge cases with property testing', () => {
      test('handles special numeric values', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(null),
              fc.constant(undefined),
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant(-Infinity)
            ),
            (value) => {
              const multiplier = getGoldReserveScaling(value);
              return multiplier === 1.0;
            }
          ),
          { numRuns: 100 }
        );
      });

      test('handles fractional gold amounts', () => {
        fc.assert(
          fc.property(
            fc.double({ min: 0, max: 500, noNaN: true }),
            (gold) => {
              const multiplier = getGoldReserveScaling(gold);
              
              // Should still satisfy bounds
              if (multiplier < 1.0 || multiplier > 2.0) return false;
              
              // Should still satisfy monotonicity with integer neighbors
              const floor = Math.floor(gold);
              const ceil = Math.ceil(gold);
              const floorScale = getGoldReserveScaling(floor);
              const ceilScale = getGoldReserveScaling(ceil);
              
              return multiplier >= floorScale && multiplier <= ceilScale;
            }
          ),
          { numRuns: 1000 }
        );
      });
    });
  });
});
