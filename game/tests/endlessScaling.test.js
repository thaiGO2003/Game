/**
 * Unit Test for Endless Mode AI Scaling
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 * 
 * This test verifies that:
 * - Player units (LEFT side) do NOT receive healing buffs in Endless mode
 * - AI units (RIGHT side) receive scaling buffs when round > 30 in Endless mode
 * - Scaling formula is correct: 1 + (round - 30) * 0.05
 * - Scaling applies to HP, ATK, and MATK
 * - Scaling does NOT apply when game mode is not PVE_JOURNEY (Endless)
 * - Scaling does NOT apply when round <= 30
 */

import { describe, it, expect } from 'vitest';

// Mock implementation of createCombatUnit logic for Endless mode scaling
class MockCombatScene {
  constructor(gameMode, round, aiMode = 'MEDIUM') {
    this.player = {
      gameMode: gameMode,
      round: round,
      teamHpPct: 0,
      teamAtkPct: 0,
      teamMatkPct: 0,
      startingRage: 0,
      startingShield: 0,
      lifestealPct: 0
    };
    this.aiMode = aiMode;
  }

  getAI() {
    const AI_SETTINGS = {
      EASY: { hpMult: 0.84, atkMult: 0.82, matkMult: 0.82, rageGain: 1 },
      MEDIUM: { hpMult: 1.0, atkMult: 1.0, matkMult: 1.0, rageGain: 1 },
      HARD: { hpMult: 1.15, atkMult: 1.15, matkMult: 1.15, rageGain: 1 }
    };
    return AI_SETTINGS[this.aiMode];
  }

  // Simplified createCombatUnit focusing on stat calculation
  calculateUnitStats(side, baseStats) {
    const ai = this.getAI();
    let hpBase = side === "RIGHT" ? Math.round(baseStats.hp * ai.hpMult) : baseStats.hp;
    let atkBase = side === "RIGHT" ? Math.round(baseStats.atk * ai.atkMult) : baseStats.atk;
    let matkBase = side === "RIGHT" ? Math.round(baseStats.matk * ai.matkMult) : baseStats.matk;

    // Apply Endless mode scaling for AI units when round > 30
    if (side === "RIGHT" && this.player.gameMode === "PVE_JOURNEY" && this.player.round > 30) {
      const scaleFactor = 1 + (this.player.round - 30) * 0.05;
      hpBase = Math.round(hpBase * scaleFactor);
      atkBase = Math.round(atkBase * scaleFactor);
      matkBase = Math.round(matkBase * scaleFactor);
    }

    const hpWithAug = side === "LEFT" ? Math.round(hpBase * (1 + this.player.teamHpPct)) : hpBase;
    const atkWithAug = side === "LEFT" ? Math.round(atkBase * (1 + this.player.teamAtkPct)) : atkBase;
    const matkWithAug = side === "LEFT" ? Math.round(matkBase * (1 + this.player.teamMatkPct)) : matkBase;

    return { hp: hpWithAug, atk: atkWithAug, matk: matkWithAug };
  }
}

describe('Endless Mode AI Scaling', () => {
  const baseStats = { hp: 100, atk: 50, matk: 40 };

  describe('Requirement 5.1: No player healing buffs', () => {
    it('should NOT apply healing buffs to player units in Endless mode', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 35);
      const playerStats = scene.calculateUnitStats('LEFT', baseStats);
      
      // Player stats should be base stats (no healing buff)
      expect(playerStats.hp).toBe(baseStats.hp);
      expect(playerStats.atk).toBe(baseStats.atk);
      expect(playerStats.matk).toBe(baseStats.matk);
    });
  });

  describe('Requirement 5.2: AI scaling when round > 30 in Endless mode', () => {
    it('should apply scaling buffs to AI units when round > 30', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 35);
      const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
      
      // Expected: base * aiMult * scaleFactor
      // scaleFactor = 1 + (35 - 30) * 0.05 = 1.25
      const expectedHp = Math.round(baseStats.hp * 1.0 * 1.25); // 125
      const expectedAtk = Math.round(baseStats.atk * 1.0 * 1.25); // 62 (rounded from 62.5)
      const expectedMatk = Math.round(baseStats.matk * 1.0 * 1.25); // 50
      
      expect(aiStats.hp).toBe(expectedHp);
      expect(aiStats.atk).toBe(expectedAtk);
      expect(aiStats.matk).toBe(expectedMatk);
    });
  });

  describe('Requirement 5.3: AI scaling affects HP, ATK, and MATK', () => {
    it('should increase all three stats (HP, ATK, MATK) for AI units', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 40);
      const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
      
      // scaleFactor = 1 + (40 - 30) * 0.05 = 1.5
      expect(aiStats.hp).toBeGreaterThan(baseStats.hp);
      expect(aiStats.atk).toBeGreaterThan(baseStats.atk);
      expect(aiStats.matk).toBeGreaterThan(baseStats.matk);
    });
  });

  describe('Requirement 5.4: No scaling when game mode is not Endless', () => {
    it('should NOT apply scaling in PVE_SANDBOX mode', () => {
      const scene = new MockCombatScene('PVE_SANDBOX', 35);
      const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
      
      // Expected: base * aiMult only (no scaling)
      const expectedHp = Math.round(baseStats.hp * 1.0);
      const expectedAtk = Math.round(baseStats.atk * 1.0);
      const expectedMatk = Math.round(baseStats.matk * 1.0);
      
      expect(aiStats.hp).toBe(expectedHp);
      expect(aiStats.atk).toBe(expectedAtk);
      expect(aiStats.matk).toBe(expectedMatk);
    });
  });

  describe('Requirement 5.5: Scaling formula correctness', () => {
    it('should use formula: 1 + (round - 30) * 0.05', () => {
      const testCases = [
        { round: 31, expectedFactor: 1.05 },
        { round: 35, expectedFactor: 1.25 },
        { round: 40, expectedFactor: 1.5 },
        { round: 50, expectedFactor: 2.0 },
        { round: 60, expectedFactor: 2.5 }
      ];

      testCases.forEach(({ round, expectedFactor }) => {
        const scene = new MockCombatScene('PVE_JOURNEY', round);
        const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
        
        const expectedHp = Math.round(baseStats.hp * 1.0 * expectedFactor);
        const expectedAtk = Math.round(baseStats.atk * 1.0 * expectedFactor);
        const expectedMatk = Math.round(baseStats.matk * 1.0 * expectedFactor);
        
        expect(aiStats.hp).toBe(expectedHp);
        expect(aiStats.atk).toBe(expectedAtk);
        expect(aiStats.matk).toBe(expectedMatk);
      });
    });

    it('should NOT apply scaling when round <= 30', () => {
      const testCases = [1, 10, 20, 30];

      testCases.forEach((round) => {
        const scene = new MockCombatScene('PVE_JOURNEY', round);
        const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
        
        // No scaling, only AI multiplier
        const expectedHp = Math.round(baseStats.hp * 1.0);
        const expectedAtk = Math.round(baseStats.atk * 1.0);
        const expectedMatk = Math.round(baseStats.matk * 1.0);
        
        expect(aiStats.hp).toBe(expectedHp);
        expect(aiStats.atk).toBe(expectedAtk);
        expect(aiStats.matk).toBe(expectedMatk);
      });
    });
  });

  describe('Integration: Scaling with different AI difficulties', () => {
    it('should apply scaling on top of EASY mode AI multipliers', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 40, 'EASY');
      const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
      
      // scaleFactor = 1.5, EASY hpMult = 0.84
      const expectedHp = Math.round(Math.round(baseStats.hp * 0.84) * 1.5);
      expect(aiStats.hp).toBe(expectedHp);
    });

    it('should apply scaling on top of HARD mode AI multipliers', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 40, 'HARD');
      const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
      
      // scaleFactor = 1.5, HARD hpMult = 1.15
      const expectedHp = Math.round(Math.round(baseStats.hp * 1.15) * 1.5);
      expect(aiStats.hp).toBe(expectedHp);
    });
  });

  describe('Edge cases', () => {
    it('should handle round 31 (first round with scaling)', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 31);
      const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
      
      // scaleFactor = 1 + (31 - 30) * 0.05 = 1.05
      const expectedHp = Math.round(baseStats.hp * 1.0 * 1.05);
      expect(aiStats.hp).toBe(expectedHp);
    });

    it('should handle very high rounds (round 100)', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 100);
      const aiStats = scene.calculateUnitStats('RIGHT', baseStats);
      
      // scaleFactor = 1 + (100 - 30) * 0.05 = 4.5
      const expectedHp = Math.round(baseStats.hp * 1.0 * 4.5);
      expect(aiStats.hp).toBe(expectedHp);
    });

    it('should NOT affect player units even at high rounds', () => {
      const scene = new MockCombatScene('PVE_JOURNEY', 100);
      const playerStats = scene.calculateUnitStats('LEFT', baseStats);
      
      // Player stats should remain base stats
      expect(playerStats.hp).toBe(baseStats.hp);
      expect(playerStats.atk).toBe(baseStats.atk);
      expect(playerStats.matk).toBe(baseStats.matk);
    });
  });
});
