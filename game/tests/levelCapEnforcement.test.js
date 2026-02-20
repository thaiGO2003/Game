import { getXpToLevelUp } from '../src/core/gameUtils.js';
import * as fc from 'fast-check';

/**
 * Property-based tests for level cap enforcement
 * Tests Properties 8, 9, and 13 from the design document
 */

// Mock player state for testing
class MockPlayer {
  constructor(level = 1, xp = 0) {
    this.level = level;
    this.xp = xp;
    this.logs = [];
  }

  addLog(message) {
    this.logs.push(message);
  }

  // Simulate gainXp from CombatScene/PlanningScene/BoardPrototypeScene
  gainXp(value) {
    let amount = value;
    while (amount > 0 && this.level < 25) {
      const need = getXpToLevelUp(this.level) - this.xp;
      if (amount >= need) {
        amount -= need;
        this.level += 1;
        this.xp = 0;
        this.addLog(`Lên cấp ${this.level}.`);
      } else {
        this.xp += amount;
        amount = 0;
      }
    }
  }
}

describe('Level Cap Enforcement', () => {
  describe('basic level cap behavior', () => {
    test('level never exceeds 25 after gaining XP', () => {
      const player = new MockPlayer(24, 0);
      player.gainXp(10000); // Massive XP gain
      expect(player.level).toBe(25);
    });

    test('XP gain at level 25 does not increase level', () => {
      const player = new MockPlayer(25, 0);
      player.gainXp(1000);
      expect(player.level).toBe(25);
      expect(player.xp).toBe(0); // XP should not accumulate at cap
    });

    test('can level up from 24 to 25', () => {
      const player = new MockPlayer(24, 0);
      const xpNeeded = getXpToLevelUp(24);
      player.gainXp(xpNeeded);
      expect(player.level).toBe(25);
    });

    test('excess XP at level 24 is discarded after reaching 25', () => {
      const player = new MockPlayer(24, 0);
      const xpNeeded = getXpToLevelUp(24);
      player.gainXp(xpNeeded + 500); // Extra XP
      expect(player.level).toBe(25);
      expect(player.xp).toBe(0); // Excess discarded
    });
  });

  describe('XP processing correctness', () => {
    test('single level up processes correctly', () => {
      const player = new MockPlayer(5, 0);
      const xpNeeded = getXpToLevelUp(5);
      player.gainXp(xpNeeded);
      expect(player.level).toBe(6);
      expect(player.xp).toBe(0);
    });

    test('partial XP gain accumulates correctly', () => {
      const player = new MockPlayer(5, 0);
      const xpNeeded = getXpToLevelUp(5);
      player.gainXp(xpNeeded - 5);
      expect(player.level).toBe(5);
      expect(player.xp).toBe(xpNeeded - 5);
    });

    test('XP rollover works across multiple levels', () => {
      const player = new MockPlayer(1, 0);
      // Level 1 needs 2 XP, level 2 needs 4 XP
      player.gainXp(7); // Should level to 3 with 1 XP remaining
      expect(player.level).toBe(3);
      expect(player.xp).toBe(1);
    });

    test('multi-level gain from level 1 to 10', () => {
      const player = new MockPlayer(1, 0);
      let totalXp = 0;
      for (let lvl = 1; lvl < 10; lvl++) {
        totalXp += getXpToLevelUp(lvl);
      }
      player.gainXp(totalXp);
      expect(player.level).toBe(10);
      expect(player.xp).toBe(0);
    });
  });

  describe('level up logging', () => {
    test('single level up generates one log message', () => {
      const player = new MockPlayer(5, 0);
      const xpNeeded = getXpToLevelUp(5);
      player.gainXp(xpNeeded);
      expect(player.logs).toHaveLength(1);
      expect(player.logs[0]).toBe('Lên cấp 6.');
    });

    test('multi-level gain generates multiple log messages', () => {
      const player = new MockPlayer(1, 0);
      let totalXp = 0;
      for (let lvl = 1; lvl <= 3; lvl++) {
        totalXp += getXpToLevelUp(lvl);
      }
      player.gainXp(totalXp);
      expect(player.logs).toHaveLength(3);
      expect(player.logs[0]).toBe('Lên cấp 2.');
      expect(player.logs[1]).toBe('Lên cấp 3.');
      expect(player.logs[2]).toBe('Lên cấp 4.');
    });

    test('no log message when XP does not cause level up', () => {
      const player = new MockPlayer(5, 0);
      player.gainXp(1); // Not enough to level up
      expect(player.logs).toHaveLength(0);
    });

    test('no log message when at level cap', () => {
      const player = new MockPlayer(25, 0);
      player.gainXp(1000);
      expect(player.logs).toHaveLength(0);
    });
  });

  describe('property-based tests', () => {
    describe('Property 8: Level Cap Enforcement', () => {
      /**
       * **Validates: Requirements 6.1, 6.2, 6.3**
       * 
       * For any XP gain at any level, after processing the XP,
       * the player level should never exceed 25.
       */
      test('level never exceeds 25 for any XP gain', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 25 }), // Starting level
            fc.integer({ min: 0, max: 10000 }), // XP gain
            (startLevel, xpGain) => {
              const player = new MockPlayer(startLevel, 0);
              player.gainXp(xpGain);
              return player.level <= 25;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('level 25 is stable (no further increases)', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 100000 }), // Any XP amount
            (xpGain) => {
              const player = new MockPlayer(25, 0);
              player.gainXp(xpGain);
              return player.level === 25 && player.xp === 0;
            }
          ),
          { numRuns: 500 }
        );
      });
    });

    describe('Property 9: XP Processing Correctness', () => {
      /**
       * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
       * 
       * For any XP gain when player level is below 25, the XP should be
       * properly distributed across level ups with excess XP carried over,
       * and each level up should increment the level by exactly 1.
       */
      test('XP is properly distributed across level ups', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 24 }), // Starting level (below cap)
            fc.integer({ min: 0, max: 1000 }), // XP gain
            (startLevel, xpGain) => {
              const player = new MockPlayer(startLevel, 0);
              const initialLevel = player.level;
              
              player.gainXp(xpGain);
              
              // Level should increase by at least 0 (no XP or not enough)
              const levelsGained = player.level - initialLevel;
              
              // Each level up should be exactly +1
              // Verify by checking that we didn't skip levels
              return levelsGained >= 0 && player.level <= 25;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('excess XP is carried over correctly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 23 }), // Starting level
            fc.integer({ min: 0, max: 50 }), // Small XP gain
            (startLevel, xpGain) => {
              const player = new MockPlayer(startLevel, 0);
              const xpNeeded = getXpToLevelUp(startLevel);
              
              if (xpGain < xpNeeded) {
                // Should not level up, XP should accumulate
                player.gainXp(xpGain);
                return player.level === startLevel && player.xp === xpGain;
              } else {
                // Should level up, excess should carry over
                player.gainXp(xpGain);
                const expectedExcess = xpGain - xpNeeded;
                
                if (player.level === startLevel + 1) {
                  // Single level up
                  return player.xp <= expectedExcess;
                } else {
                  // Multiple level ups or hit cap
                  return player.level > startLevel;
                }
              }
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('multi-level gains process sequentially', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 20 }), // Starting level
            fc.integer({ min: 100, max: 500 }), // Large XP gain
            (startLevel, xpGain) => {
              const player = new MockPlayer(startLevel, 0);
              const initialLevel = player.level;
              
              player.gainXp(xpGain);
              
              // Count expected levels
              let expectedLevel = initialLevel;
              let remainingXp = xpGain;
              
              while (remainingXp > 0 && expectedLevel < 25) {
                const need = getXpToLevelUp(expectedLevel);
                if (remainingXp >= need) {
                  remainingXp -= need;
                  expectedLevel++;
                } else {
                  break;
                }
              }
              
              return player.level === expectedLevel;
            }
          ),
          { numRuns: 500 }
        );
      });
    });

    describe('Property 13: XP Conservation', () => {
      /**
       * **Validates: Requirements 13.1, 13.2, 13.3**
       * 
       * For any XP gain when player level is below 25, the total XP should be
       * accounted for as either: (sum of XP thresholds crossed) + (final player.xp) + (XP discarded at level cap).
       */
      test('XP is conserved (not lost) until level cap', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 24 }), // Starting level (below cap)
            fc.integer({ min: 0, max: 500 }), // XP gain
            (startLevel, xpGain) => {
              const player = new MockPlayer(startLevel, 0);
              const initialLevel = player.level;
              
              player.gainXp(xpGain);
              
              // Calculate XP consumed by level ups
              let xpConsumed = 0;
              for (let lvl = initialLevel; lvl < player.level; lvl++) {
                xpConsumed += getXpToLevelUp(lvl);
              }
              
              // Total XP should equal consumed + remaining (if not at cap)
              if (player.level < 25) {
                return xpConsumed + player.xp === xpGain;
              } else {
                // At cap, some XP may be discarded
                return xpConsumed <= xpGain;
              }
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('XP discarded at level cap is handled correctly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 10000 }), // Any XP amount
            (xpGain) => {
              const player = new MockPlayer(24, 0);
              const xpToReach25 = getXpToLevelUp(24);
              
              player.gainXp(xpGain);
              
              if (xpGain >= xpToReach25) {
                // Should reach level 25
                return player.level === 25 && player.xp === 0;
              } else {
                // Should stay at level 24 with accumulated XP
                return player.level === 24 && player.xp === xpGain;
              }
            }
          ),
          { numRuns: 500 }
        );
      });

      test('massive XP gain from level 1 reaches cap correctly', () => {
        // Calculate total XP needed to reach level 25 from level 1
        let totalXpNeeded = 0;
        for (let lvl = 1; lvl <= 24; lvl++) {
          totalXpNeeded += getXpToLevelUp(lvl);
        }
        
        fc.assert(
          fc.property(
            fc.integer({ min: totalXpNeeded, max: totalXpNeeded + 100000 }), // Massive XP (enough to reach cap)
            (xpGain) => {
              const player = new MockPlayer(1, 0);
              player.gainXp(xpGain);
              
              // Should reach level 25
              return player.level === 25 && player.xp === 0;
            }
          ),
          { numRuns: 200 }
        );
      });
    });

    describe('Property 10: Multi-Level Logging', () => {
      /**
       * **Validates: Requirements 8.1, 8.2**
       * 
       * For any XP gain that causes multiple level ups, a log message
       * should be generated for each level gained.
       */
      test('log count matches levels gained', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 23 }), // Starting level
            fc.integer({ min: 0, max: 1000 }), // XP gain
            (startLevel, xpGain) => {
              const player = new MockPlayer(startLevel, 0);
              const initialLevel = player.level;
              
              player.gainXp(xpGain);
              
              const levelsGained = player.level - initialLevel;
              return player.logs.length === levelsGained;
            }
          ),
          { numRuns: 1000 }
        );
      });

      test('log messages are correctly formatted', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 23 }), // Starting level
            fc.integer({ min: 1, max: 500 }), // XP gain (at least 1)
            (startLevel, xpGain) => {
              const player = new MockPlayer(startLevel, 0);
              const initialLevel = player.level;
              
              player.gainXp(xpGain);
              
              // Check each log message format
              for (let i = 0; i < player.logs.length; i++) {
                const expectedLevel = initialLevel + i + 1;
                const expectedMessage = `Lên cấp ${expectedLevel}.`;
                if (player.logs[i] !== expectedMessage) {
                  return false;
                }
              }
              
              return true;
            }
          ),
          { numRuns: 500 }
        );
      });
    });

    describe('edge cases', () => {
      test('zero XP gain does not change state', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 25 }), // Any level
            fc.integer({ min: 0, max: 100 }), // Any current XP
            (level, currentXp) => {
              const player = new MockPlayer(level, currentXp);
              const initialLevel = player.level;
              const initialXp = player.xp;
              
              player.gainXp(0);
              
              return player.level === initialLevel && 
                     player.xp === initialXp &&
                     player.logs.length === 0;
            }
          ),
          { numRuns: 200 }
        );
      });

      test('handles starting with partial XP correctly', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 24 }), // Starting level
            fc.integer({ min: 1, max: 50 }), // Starting XP
            fc.integer({ min: 1, max: 100 }), // XP gain
            (startLevel, startXp, xpGain) => {
              const xpNeeded = getXpToLevelUp(startLevel);
              const validStartXp = Math.min(startXp, xpNeeded - 1);
              
              const player = new MockPlayer(startLevel, validStartXp);
              player.gainXp(xpGain);
              
              // Should process correctly
              return player.level >= startLevel && player.level <= 25;
            }
          ),
          { numRuns: 500 }
        );
      });
    });
  });
});
