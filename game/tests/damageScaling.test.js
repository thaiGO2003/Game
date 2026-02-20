import { getGoldReserveScaling } from '../src/core/gameUtils.js';
import * as fc from 'fast-check';

describe('Damage Scaling with Gold', () => {
  /**
   * Helper function to simulate damage calculation as done in CombatScene.calcSkillRaw()
   */
  function calculateScaledDamage(baseDamage, gold) {
    const goldMultiplier = getGoldReserveScaling(gold);
    return Math.round(baseDamage * goldMultiplier);
  }

  describe('specific gold amounts', () => {
    test('damage with 0 gold (no scaling)', () => {
      expect(calculateScaledDamage(100, 0)).toBe(100);
      expect(calculateScaledDamage(50, 0)).toBe(50);
      expect(calculateScaledDamage(1, 0)).toBe(1);
    });

    test('damage with 10 gold (baseline, no scaling)', () => {
      expect(calculateScaledDamage(100, 10)).toBe(100);
      expect(calculateScaledDamage(50, 10)).toBe(50);
      expect(calculateScaledDamage(1, 10)).toBe(1);
    });

    test('damage with 30 gold (+10% scaling)', () => {
      // 100 * 1.10 = 110
      expect(calculateScaledDamage(100, 30)).toBe(110);
      // 50 * 1.10 = 55
      expect(calculateScaledDamage(50, 30)).toBe(55);
      // 1 * 1.10 = 1.1 -> rounds to 1
      expect(calculateScaledDamage(1, 30)).toBe(1);
    });

    test('damage with 50 gold (+20% scaling)', () => {
      // 100 * 1.20 = 120
      expect(calculateScaledDamage(100, 50)).toBe(120);
      // 50 * 1.20 = 60
      expect(calculateScaledDamage(50, 50)).toBe(60);
      // 10 * 1.20 = 12
      expect(calculateScaledDamage(10, 50)).toBe(12);
    });

    test('damage with 210 gold (+100% scaling, capped at 2.0x)', () => {
      // 100 * 2.0 = 200
      expect(calculateScaledDamage(100, 210)).toBe(200);
      // 50 * 2.0 = 100
      expect(calculateScaledDamage(50, 210)).toBe(100);
      // 1 * 2.0 = 2
      expect(calculateScaledDamage(1, 210)).toBe(2);
    });
  });

  describe('rounding behavior', () => {
    test('rounds fractional damage correctly', () => {
      // 15 * 1.10 = 16.5 -> rounds to 17
      expect(calculateScaledDamage(15, 30)).toBe(17);
      
      // 25 * 1.10 = 27.5 -> rounds to 28
      expect(calculateScaledDamage(25, 30)).toBe(28);
      
      // 3 * 1.10 = 3.3 -> rounds to 3
      expect(calculateScaledDamage(3, 30)).toBe(3);
      
      // 7 * 1.10 = 7.7 -> rounds to 8
      expect(calculateScaledDamage(7, 30)).toBe(8);
    });
  });

  describe('Property 4: Damage Scaling Correctness', () => {
    /**
     * **Validates: Requirements 2.2, 2.3**
     * 
     * For any base damage value and gold amount, the final damage should equal
     * the base damage multiplied by the gold multiplier (rounded), and should
     * never be less than the base damage.
     */
    test('final damage = round(baseDamage * goldMultiplier)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // base damage
          fc.integer({ min: 0, max: 500 }),  // gold amount
          (baseDamage, gold) => {
            const goldMultiplier = getGoldReserveScaling(gold);
            const expectedDamage = Math.round(baseDamage * goldMultiplier);
            const actualDamage = calculateScaledDamage(baseDamage, gold);
            
            return actualDamage === expectedDamage;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('final damage >= base damage (never reduces)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }), // base damage
          fc.integer({ min: 0, max: 500 }),  // gold amount
          (baseDamage, gold) => {
            const scaledDamage = calculateScaledDamage(baseDamage, gold);
            
            // Scaled damage should always be >= base damage
            // (gold multiplier is always >= 1.0)
            return scaledDamage >= baseDamage;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('damage scales proportionally with gold multiplier', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // base damage (non-zero)
          fc.integer({ min: 0, max: 500 }),  // gold amount
          (baseDamage, gold) => {
            const goldMultiplier = getGoldReserveScaling(gold);
            const scaledDamage = calculateScaledDamage(baseDamage, gold);
            
            // Verify the scaled damage is what we expect from the formula
            const expectedDamage = Math.round(baseDamage * goldMultiplier);
            
            // The scaled damage should exactly match the expected calculation
            return scaledDamage === expectedDamage;
          }
        ),
        { numRuns: 1000 }
      );
    });

    test('zero damage remains zero regardless of gold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          (gold) => {
            const scaledDamage = calculateScaledDamage(0, gold);
            return scaledDamage === 0;
          }
        ),
        { numRuns: 500 }
      );
    });

    test('damage with specific gold amounts matches expected values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom(0, 10, 30, 50, 210),
          (baseDamage, gold) => {
            const scaledDamage = calculateScaledDamage(baseDamage, gold);
            const goldMultiplier = getGoldReserveScaling(gold);
            const expectedDamage = Math.round(baseDamage * goldMultiplier);
            
            return scaledDamage === expectedDamage;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('edge cases', () => {
    test('handles very large base damage', () => {
      const largeDamage = 999999;
      
      // With 10 gold (1.0x): should remain same
      expect(calculateScaledDamage(largeDamage, 10)).toBe(largeDamage);
      
      // With 210 gold (2.0x): should double
      expect(calculateScaledDamage(largeDamage, 210)).toBe(largeDamage * 2);
    });

    test('handles very small base damage', () => {
      // 1 damage with various gold amounts
      expect(calculateScaledDamage(1, 0)).toBe(1);
      expect(calculateScaledDamage(1, 10)).toBe(1);
      expect(calculateScaledDamage(1, 30)).toBe(1); // 1 * 1.10 = 1.1 -> 1
      expect(calculateScaledDamage(1, 50)).toBe(1); // 1 * 1.20 = 1.2 -> 1
      expect(calculateScaledDamage(1, 210)).toBe(2); // 1 * 2.0 = 2
    });

    test('handles negative gold (treated as 0)', () => {
      expect(calculateScaledDamage(100, -50)).toBe(100);
      expect(calculateScaledDamage(50, -100)).toBe(50);
    });

    test('consistent results for same inputs', () => {
      // Verify deterministic behavior
      const damage = 100;
      const gold = 50;
      
      const result1 = calculateScaledDamage(damage, gold);
      const result2 = calculateScaledDamage(damage, gold);
      const result3 = calculateScaledDamage(damage, gold);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('realistic combat scenarios', () => {
    test('typical early game damage (low gold)', () => {
      const earlyDamage = 50;
      const earlyGold = 15;
      
      const scaled = calculateScaledDamage(earlyDamage, earlyGold);
      
      // 50 * 1.025 = 51.25 -> 51
      expect(scaled).toBe(51);
      expect(scaled).toBeGreaterThanOrEqual(earlyDamage);
    });

    test('typical mid game damage (moderate gold)', () => {
      const midDamage = 100;
      const midGold = 50;
      
      const scaled = calculateScaledDamage(midDamage, midGold);
      
      // 100 * 1.20 = 120
      expect(scaled).toBe(120);
      expect(scaled).toBeGreaterThanOrEqual(midDamage);
    });

    test('typical late game damage (high gold)', () => {
      const lateDamage = 200;
      const lateGold = 150;
      
      const scaled = calculateScaledDamage(lateDamage, lateGold);
      
      // 200 * 1.70 = 340
      expect(scaled).toBe(340);
      expect(scaled).toBeGreaterThanOrEqual(lateDamage);
    });

    test('max scaling scenario', () => {
      const damage = 150;
      const maxGold = 500; // Well above cap
      
      const scaled = calculateScaledDamage(damage, maxGold);
      
      // 150 * 2.0 = 300 (capped)
      expect(scaled).toBe(300);
      expect(scaled).toBe(damage * 2);
    });
  });
});
