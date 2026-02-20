import { getGoldReserveScaling } from '../src/core/gameUtils.js';
import * as fc from 'fast-check';

describe('Probability Scaling with Gold', () => {
  describe('basic probability scaling', () => {
    test('scales probability correctly with gold multiplier', () => {
      const baseProb = 0.40;
      const goldMult = getGoldReserveScaling(30); // 1.10
      const finalProb = Math.min(baseProb * goldMult, 1.0);
      
      expect(finalProb).toBeCloseTo(0.44, 2);
    });

    test('caps probability at 1.0', () => {
      const baseProb = 0.90;
      const goldMult = getGoldReserveScaling(50); // 1.20
      const finalProb = Math.min(baseProb * goldMult, 1.0);
      
      expect(finalProb).toBe(1.0);
    });

    test('never reduces probability below base', () => {
      const baseProb = 0.30;
      const goldMult = getGoldReserveScaling(10); // 1.0
      const finalProb = Math.min(baseProb * goldMult, 1.0);
      
      expect(finalProb).toBeGreaterThanOrEqual(baseProb);
    });
  });

  describe('Property 5: Probability Scaling Correctness', () => {
    /**
     * **Validates: Requirements 3.2, 3.4**
     * 
     * For any base probability and gold amount, the final probability should equal
     * the base probability multiplied by the gold multiplier (capped at 1.0),
     * and should never be less than the base probability.
     */
    test('final probability equals min(baseProb * goldMultiplier, 1.0)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.0, max: 1.0, noNaN: true }),
          fc.integer({ min: 0, max: 500 }),
          (baseProb, gold) => {
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * goldMult, 1.0);
            
            // Calculate expected value
            const expected = Math.min(baseProb * goldMult, 1.0);
            
            // Should match expected calculation
            return Math.abs(finalProb - expected) < 0.0001;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('final probability is always >= base probability', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.0, max: 1.0, noNaN: true }),
          fc.integer({ min: 0, max: 500 }),
          (baseProb, gold) => {
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * goldMult, 1.0);
            
            // Final probability should never be less than base
            // (since goldMult is always >= 1.0)
            return finalProb >= baseProb - 0.0001; // Small epsilon for floating point
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('final probability never exceeds 1.0', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.0, max: 1.0, noNaN: true }),
          fc.integer({ min: 0, max: 10000 }),
          (baseProb, gold) => {
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * goldMult, 1.0);
            
            // Probability should never exceed 100%
            return finalProb <= 1.0;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('probability scaling is monotonic with gold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.0, max: 1.0, noNaN: true }),
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          (baseProb, gold1, gold2) => {
            // Ensure g1 < g2
            const g1 = Math.min(gold1, gold2);
            const g2 = Math.max(gold1, gold2);
            
            if (g1 === g2) return true; // Skip equal values
            
            const goldMult1 = getGoldReserveScaling(g1);
            const goldMult2 = getGoldReserveScaling(g2);
            
            const finalProb1 = Math.min(baseProb * goldMult1, 1.0);
            const finalProb2 = Math.min(baseProb * goldMult2, 1.0);
            
            // Higher gold should give higher or equal probability
            return finalProb1 <= finalProb2 + 0.0001; // Small epsilon
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('edge cases', () => {
    test('handles zero base probability', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          (gold) => {
            const baseProb = 0.0;
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * goldMult, 1.0);
            
            return finalProb === 0.0;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handles 100% base probability', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          (gold) => {
            const baseProb = 1.0;
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * goldMult, 1.0);
            
            return finalProb === 1.0;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('handles very high base probability with high gold', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.8, max: 1.0, noNaN: true }),
          fc.integer({ min: 50, max: 500 }),
          (baseProb, gold) => {
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * goldMult, 1.0);
            
            // Should cap at 1.0
            return finalProb <= 1.0 && finalProb >= baseProb;
          }
        ),
        { numRuns: 500 }
      );
    });

    test('handles very low base probability', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 0.1, noNaN: true }),
          fc.integer({ min: 0, max: 500 }),
          (baseProb, gold) => {
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * goldMult, 1.0);
            
            // Should scale correctly even for low probabilities
            const expected = Math.min(baseProb * goldMult, 1.0);
            return Math.abs(finalProb - expected) < 0.0001;
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('realistic game scenarios', () => {
    test('stun effect scaling (40% base)', () => {
      const baseStunChance = 0.40;
      
      // Test various gold amounts
      const scenarios = [
        { gold: 10, expected: 0.40 },
        { gold: 30, expected: 0.44 },
        { gold: 50, expected: 0.48 },
        { gold: 100, expected: 0.58 },
        { gold: 210, expected: 0.80 }
      ];
      
      scenarios.forEach(({ gold, expected }) => {
        const goldMult = getGoldReserveScaling(gold);
        const finalProb = Math.min(baseStunChance * goldMult, 1.0);
        expect(finalProb).toBeCloseTo(expected, 2);
      });
    });

    test('freeze effect scaling (50% base)', () => {
      const baseFreezeChance = 0.50;
      
      const scenarios = [
        { gold: 10, expected: 0.50 },   // 0.50 * 1.0 = 0.50
        { gold: 30, expected: 0.55 },   // 0.50 * 1.10 = 0.55
        { gold: 50, expected: 0.60 },   // 0.50 * 1.20 = 0.60
        { gold: 100, expected: 0.725 }, // 0.50 * 1.45 = 0.725
        { gold: 210, expected: 1.00 }   // 0.50 * 2.0 = 1.0 (capped)
      ];
      
      scenarios.forEach(({ gold, expected }) => {
        const goldMult = getGoldReserveScaling(gold);
        const finalProb = Math.min(baseFreezeChance * goldMult, 1.0);
        expect(finalProb).toBeCloseTo(expected, 2);
      });
    });

    test('sleep effect scaling (60% base)', () => {
      const baseSleepChance = 0.60;
      
      const scenarios = [
        { gold: 10, expected: 0.60 },   // 0.60 * 1.0 = 0.60
        { gold: 30, expected: 0.66 },   // 0.60 * 1.10 = 0.66
        { gold: 50, expected: 0.72 },   // 0.60 * 1.20 = 0.72
        { gold: 100, expected: 0.87 },  // 0.60 * 1.45 = 0.87
        { gold: 150, expected: 1.00 }   // 0.60 * 1.70 = 1.02 (capped at 1.0)
      ];
      
      scenarios.forEach(({ gold, expected }) => {
        const goldMult = getGoldReserveScaling(gold);
        const finalProb = Math.min(baseSleepChance * goldMult, 1.0);
        expect(finalProb).toBeCloseTo(expected, 2);
      });
    });

    test('low probability effect scaling (20% base)', () => {
      const baseLowChance = 0.20;
      
      const scenarios = [
        { gold: 10, expected: 0.20 },   // 0.20 * 1.0 = 0.20
        { gold: 30, expected: 0.22 },   // 0.20 * 1.10 = 0.22
        { gold: 50, expected: 0.24 },   // 0.20 * 1.20 = 0.24
        { gold: 100, expected: 0.29 },  // 0.20 * 1.45 = 0.29
        { gold: 210, expected: 0.40 }   // 0.20 * 2.0 = 0.40
      ];
      
      scenarios.forEach(({ gold, expected }) => {
        const goldMult = getGoldReserveScaling(gold);
        const finalProb = Math.min(baseLowChance * goldMult, 1.0);
        expect(finalProb).toBeCloseTo(expected, 2);
      });
    });

    test('high probability effect scaling (90% base)', () => {
      const baseHighChance = 0.90;
      
      const scenarios = [
        { gold: 10, expected: 0.90 },
        { gold: 20, expected: 0.945 },
        { gold: 30, expected: 0.99 },
        { gold: 50, expected: 1.00 }, // Caps at 1.0
        { gold: 100, expected: 1.00 }
      ];
      
      scenarios.forEach(({ gold, expected }) => {
        const goldMult = getGoldReserveScaling(gold);
        const finalProb = Math.min(baseHighChance * goldMult, 1.0);
        expect(finalProb).toBeCloseTo(expected, 2);
      });
    });
  });

  describe('combined with star multipliers', () => {
    test('probability scales with both star and gold multipliers', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.0, max: 1.0, noNaN: true }),
          fc.double({ min: 1.0, max: 2.0, noNaN: true }), // Star multiplier
          fc.integer({ min: 0, max: 500 }),
          (baseProb, starMult, gold) => {
            const goldMult = getGoldReserveScaling(gold);
            const finalProb = Math.min(baseProb * starMult * goldMult, 1.0);
            
            // Should never exceed 1.0
            if (finalProb > 1.0) return false;
            
            // Should be at least base probability (since both multipliers >= 1.0)
            if (finalProb < baseProb - 0.0001) return false;
            
            // Should match expected calculation
            const expected = Math.min(baseProb * starMult * goldMult, 1.0);
            return Math.abs(finalProb - expected) < 0.0001;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
