import { getDeployCapByLevel, rollTierForLevel, getXpToLevelUp } from '../src/core/gameUtils.js';
import * as fc from 'fast-check';

/**
 * Property-based tests for level-based calculations
 * Tests Property 11 from the design document
 */

describe('Level-Based Calculations', () => {
  describe('basic functionality', () => {
    test('getDeployCapByLevel returns valid values for levels 1-25', () => {
      for (let level = 1; level <= 25; level++) {
        const cap = getDeployCapByLevel(level);
        expect(cap).toBeGreaterThanOrEqual(3);
        expect(cap).toBeLessThanOrEqual(25);
        expect(Number.isFinite(cap)).toBe(true);
      }
    });

    test('rollTierForLevel returns valid tiers for levels 1-25', () => {
      for (let level = 1; level <= 25; level++) {
        for (let i = 0; i < 10; i++) {
          const tier = rollTierForLevel(level);
          expect(tier).toBeGreaterThanOrEqual(1);
          expect(tier).toBeLessThanOrEqual(5);
          expect(Number.isInteger(tier)).toBe(true);
        }
      }
    });

    test('getXpToLevelUp returns valid values for levels 1-25', () => {
      for (let level = 1; level <= 25; level++) {
        const xp = getXpToLevelUp(level);
        expect(xp).toBeGreaterThan(0);
        expect(Number.isFinite(xp)).toBe(true);
      }
    });

    test('getXpToLevelUp returns Infinity for levels beyond 25', () => {
      expect(getXpToLevelUp(26)).toBe(Infinity);
      expect(getXpToLevelUp(30)).toBe(Infinity);
      expect(getXpToLevelUp(100)).toBe(Infinity);
    });
  });

  describe('edge cases', () => {
    test('getDeployCapByLevel handles level 1', () => {
      const cap = getDeployCapByLevel(1);
      expect(cap).toBe(3);
    });

    test('getDeployCapByLevel handles level 25', () => {
      const cap = getDeployCapByLevel(25);
      expect(cap).toBe(25);
    });

    test('getDeployCapByLevel handles levels beyond 25', () => {
      const cap30 = getDeployCapByLevel(30);
      const cap100 = getDeployCapByLevel(100);
      expect(cap30).toBe(25);
      expect(cap100).toBe(25);
    });

    test('getDeployCapByLevel handles level 0 and negative', () => {
      const cap0 = getDeployCapByLevel(0);
      const capNeg = getDeployCapByLevel(-5);
      expect(cap0).toBe(3);
      expect(capNeg).toBe(3);
    });

    test('rollTierForLevel handles level 1', () => {
      for (let i = 0; i < 20; i++) {
        const tier = rollTierForLevel(1);
        expect(tier).toBe(1); // Level 1 should always give tier 1
      }
    });

    test('rollTierForLevel handles level 25', () => {
      for (let i = 0; i < 20; i++) {
        const tier = rollTierForLevel(25);
        expect(tier).toBeGreaterThanOrEqual(3); // Level 25 should give tier 3-5
        expect(tier).toBeLessThanOrEqual(5);
      }
    });

    test('rollTierForLevel handles levels beyond 25', () => {
      // Should use level 25 odds
      for (let i = 0; i < 20; i++) {
        const tier = rollTierForLevel(30);
        expect(tier).toBeGreaterThanOrEqual(3);
        expect(tier).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('property-based tests', () => {
    describe('Property 11: Level-Based Calculations Support', () => {
      /**
       * **Validates: Requirements 9.3, 9.4**
       * 
       * For any level from 1 to 25, the deploy cap calculation and tier odds
       * calculation should return valid values.
       */
      test('getDeployCapByLevel returns valid cap for all levels 1-25', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 25 }),
            (level) => {
              const cap = getDeployCapByLevel(level);
              
              // Must be a finite number
              if (!Number.isFinite(cap)) return false;
              
              // Must be within valid range
              if (cap < 3 || cap > 25) return false;
              
              // Must be an integer
              if (!Number.isInteger(cap)) return false;
              
              return true;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('rollTierForLevel returns valid tier for all levels 1-25', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 25 }),
            (level) => {
              const tier = rollTierForLevel(level);
              
              // Must be a finite number
              if (!Number.isFinite(tier)) return false;
              
              // Must be within valid range (1-5)
              if (tier < 1 || tier > 5) return false;
              
              // Must be an integer
              if (!Number.isInteger(tier)) return false;
              
              return true;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('getXpToLevelUp returns valid XP for all levels 1-25', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 25 }),
            (level) => {
              const xp = getXpToLevelUp(level);
              
              // Must be a finite positive number
              if (!Number.isFinite(xp)) return false;
              if (xp <= 0) return false;
              
              return true;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('no undefined or null returns for levels 1-25', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 25 }),
            (level) => {
              const cap = getDeployCapByLevel(level);
              const tier = rollTierForLevel(level);
              const xp = getXpToLevelUp(level);
              
              // None should be undefined or null
              return cap !== undefined && cap !== null &&
                     tier !== undefined && tier !== null &&
                     xp !== undefined && xp !== null;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('functions handle levels beyond 25 gracefully', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 26, max: 100 }),
            (level) => {
              const cap = getDeployCapByLevel(level);
              const tier = rollTierForLevel(level);
              const xp = getXpToLevelUp(level);
              
              // Deploy cap should be capped at 25
              if (cap !== 25) return false;
              
              // Tier should still be valid (uses level 25 odds)
              if (tier < 1 || tier > 5) return false;
              
              // XP should be Infinity (no more levels)
              if (xp !== Infinity) return false;
              
              return true;
            }
          ),
          { numRuns: 500 }
        );
      });

      test('functions handle edge cases (0, negative)', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: -100, max: 0 }),
            (level) => {
              const cap = getDeployCapByLevel(level);
              const tier = rollTierForLevel(level);
              const xp = getXpToLevelUp(level);
              
              // Deploy cap should be minimum 3
              if (cap < 3) return false;
              
              // Tier should be valid (uses level 1 odds)
              if (tier < 1 || tier > 5) return false;
              
              // XP should be undefined or Infinity for invalid levels
              // (implementation may vary)
              
              return true;
            }
          ),
          { numRuns: 200 }
        );
      });
    });

    describe('monotonicity and consistency', () => {
      test('deploy cap increases monotonically with level', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 24 }),
            (level) => {
              const cap1 = getDeployCapByLevel(level);
              const cap2 = getDeployCapByLevel(level + 1);
              
              // Cap should never decrease
              return cap2 >= cap1;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('XP requirements increase monotonically with level', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 24 }),
            (level) => {
              const xp1 = getXpToLevelUp(level);
              const xp2 = getXpToLevelUp(level + 1);
              
              // XP should increase with level
              return xp2 > xp1;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('tier odds improve with level (statistical)', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 24 }),
            (level) => {
              // Sample tiers at this level and next level
              const samples = 100;
              let avgTier1 = 0;
              let avgTier2 = 0;
              
              for (let i = 0; i < samples; i++) {
                avgTier1 += rollTierForLevel(level);
                avgTier2 += rollTierForLevel(level + 1);
              }
              
              avgTier1 /= samples;
              avgTier2 /= samples;
              
              // Average tier should generally increase or stay same
              // (with some tolerance for randomness)
              return avgTier2 >= avgTier1 - 0.5;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('specific level ranges', () => {
      test('early levels (1-5) have appropriate caps', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 5 }),
            (level) => {
              const cap = getDeployCapByLevel(level);
              
              // Early levels should have small caps
              return cap >= 3 && cap <= 7;
            }
          ),
          { numRuns: 200 }
        );
      });

      test('mid levels (10-15) have appropriate caps', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 10, max: 15 }),
            (level) => {
              const cap = getDeployCapByLevel(level);
              
              // Mid levels should have medium caps
              return cap >= 12 && cap <= 17;
            }
          ),
          { numRuns: 200 }
        );
      });

      test('late levels (20-25) have appropriate caps', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 20, max: 25 }),
            (level) => {
              const cap = getDeployCapByLevel(level);
              
              // Late levels should have large caps
              return cap >= 22 && cap <= 25;
            }
          ),
          { numRuns: 200 }
        );
      });

      test('late levels (12+) never give tier 1 or 2 units', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 12, max: 25 }),
            (level) => {
              // Sample multiple times to ensure consistency
              for (let i = 0; i < 50; i++) {
                const tier = rollTierForLevel(level);
                if (tier < 3) return false;
              }
              return true;
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
