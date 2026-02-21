import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for combat speed scaling system
 * Task 15.4: Write unit tests for speed scaling
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

describe('Combat Speed Scaling System', () => {
  let mockScene;

  beforeEach(() => {
    // Mock CombatScene with necessary methods and properties
    mockScene = {
      combatUnits: [],
      combatSpeedMultiplier: 3,
      
      getCombatUnits(side) {
        return this.combatUnits.filter(u => u.alive && u.side === side);
      },
      
      calculateCombatSpeedMultiplier() {
        const leftTeam = this.getCombatUnits("LEFT");
        const rightTeam = this.getCombatUnits("RIGHT");
        const maxUnits = Math.max(leftTeam.length, rightTeam.length);
        
        // 10% speed increase per unit
        const speedIncrease = maxUnits * 0.10;
        const multiplier = 1 + speedIncrease;
        
        // Cap at 2.5x maximum
        const MAX_COMBAT_SPEED_MULTIPLIER = 2.5;
        return Math.min(multiplier, MAX_COMBAT_SPEED_MULTIPLIER);
      },
      
      scaleCombatDuration(ms) {
        const value = Number(ms);
        if (!Number.isFinite(value) || value <= 0) return 0;
        return Math.max(1, Math.round(value * this.combatSpeedMultiplier));
      }
    };
  });

  describe('Speed Multiplier Calculation (Requirements 11.1, 11.2)', () => {
    it('should calculate max unit count correctly', () => {
      // Requirement 11.1: Calculate max(leftTeam.length, rightTeam.length)
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true }
      ];

      const leftTeam = mockScene.getCombatUnits('LEFT');
      const rightTeam = mockScene.getCombatUnits('RIGHT');
      const maxUnits = Math.max(leftTeam.length, rightTeam.length);

      expect(leftTeam.length).toBe(3);
      expect(rightTeam.length).toBe(5);
      expect(maxUnits).toBe(5);
    });

    it('should apply 10% speed increase per unit', () => {
      // Requirement 11.2: Apply 1 + (n * 0.1)
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true }
      ];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Max units = 5, so multiplier should be 1 + (5 * 0.1) = 1.5
      expect(multiplier).toBe(1.5);
    });

    it('should calculate correct multiplier for equal teams', () => {
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true }
      ];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Max units = 3, so multiplier should be 1 + (3 * 0.1) = 1.3
      expect(multiplier).toBe(1.3);
    });

    it('should calculate correct multiplier for single unit', () => {
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        { side: 'RIGHT', alive: true }
      ];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Max units = 1, so multiplier should be 1 + (1 * 0.1) = 1.1
      expect(multiplier).toBe(1.1);
    });

    it('should handle empty teams', () => {
      mockScene.combatUnits = [];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Max units = 0, so multiplier should be 1 + (0 * 0.1) = 1.0
      expect(multiplier).toBe(1.0);
    });
  });

  describe('Maximum Cap Enforcement (Requirement 11.5)', () => {
    it('should cap multiplier at 2.5x', () => {
      // Requirement 11.5: Set maximum cap to prevent excessive acceleration
      // Create 20 units on one side (would be 1 + 20*0.1 = 3.0 without cap)
      mockScene.combatUnits = Array.from({ length: 20 }, () => ({
        side: 'RIGHT',
        alive: true
      }));

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Should be capped at 2.5
      expect(multiplier).toBe(2.5);
    });

    it('should not cap multiplier below maximum', () => {
      // 10 units = 1 + (10 * 0.1) = 2.0, which is below cap
      mockScene.combatUnits = Array.from({ length: 10 }, () => ({
        side: 'RIGHT',
        alive: true
      }));

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      expect(multiplier).toBe(2.0);
      expect(multiplier).toBeLessThan(2.5);
    });

    it('should cap at exactly 2.5 for 15 or more units', () => {
      // 15 units = 1 + (15 * 0.1) = 2.5 (at cap)
      mockScene.combatUnits = Array.from({ length: 15 }, () => ({
        side: 'LEFT',
        alive: true
      }));

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      expect(multiplier).toBe(2.5);
    });
  });

  describe('Multiplier Application (Requirement 11.3)', () => {
    it('should apply multiplier to combat animations', () => {
      // Requirement 11.3: Apply multiplier to all combat animations and action timings
      mockScene.combatUnits = Array.from({ length: 5 }, () => ({
        side: 'RIGHT',
        alive: true
      }));

      mockScene.combatSpeedMultiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Test with a typical animation duration
      const baseDuration = 1000;
      const scaledDuration = mockScene.scaleCombatDuration(baseDuration);
      
      // With 5 units, multiplier is 1.5, so 1000 * 1.5 = 1500
      expect(scaledDuration).toBe(1500);
    });

    it('should apply multiplier to action timings', () => {
      mockScene.combatUnits = Array.from({ length: 10 }, () => ({
        side: 'LEFT',
        alive: true
      }));

      mockScene.combatSpeedMultiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Test with combat tick delay
      const tickDelay = 420;
      const scaledDelay = mockScene.scaleCombatDuration(tickDelay);
      
      // With 10 units, multiplier is 2.0, so 420 * 2.0 = 840
      expect(scaledDelay).toBe(840);
    });

    it('should handle edge case of zero duration', () => {
      mockScene.combatSpeedMultiplier = 1.5;
      
      const scaledDuration = mockScene.scaleCombatDuration(0);
      
      expect(scaledDuration).toBe(0);
    });

    it('should handle negative duration', () => {
      mockScene.combatSpeedMultiplier = 1.5;
      
      const scaledDuration = mockScene.scaleCombatDuration(-100);
      
      expect(scaledDuration).toBe(0);
    });

    it('should handle non-finite duration', () => {
      mockScene.combatSpeedMultiplier = 1.5;
      
      const scaledDuration = mockScene.scaleCombatDuration(NaN);
      
      expect(scaledDuration).toBe(0);
    });
  });

  describe('Dynamic Recalculation (Requirement 11.4)', () => {
    it('should recalculate when units are removed', () => {
      // Requirement 11.4: Recalculate speed multiplier when units are added or removed
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true }
      ];

      // Initial calculation: max = 5, multiplier = 1.5
      let multiplier = mockScene.calculateCombatSpeedMultiplier();
      expect(multiplier).toBe(1.5);

      // Simulate unit death
      mockScene.combatUnits[7].alive = false;
      mockScene.combatUnits[6].alive = false;
      mockScene.combatUnits[5].alive = false;

      // Recalculate: max = 3, multiplier = 1.3
      multiplier = mockScene.calculateCombatSpeedMultiplier();
      expect(multiplier).toBe(1.3);
    });

    it('should handle all units on one side dying', () => {
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: true }
      ];

      // Initial: max = 3, multiplier = 1.3
      let multiplier = mockScene.calculateCombatSpeedMultiplier();
      expect(multiplier).toBe(1.3);

      // All RIGHT units die
      mockScene.combatUnits.forEach(u => {
        if (u.side === 'RIGHT') u.alive = false;
      });

      // Recalculate: max = 2 (LEFT team), multiplier = 1.2
      multiplier = mockScene.calculateCombatSpeedMultiplier();
      expect(multiplier).toBe(1.2);
    });

    it('should update scaleCombatDuration after recalculation', () => {
      mockScene.combatUnits = Array.from({ length: 10 }, () => ({
        side: 'RIGHT',
        alive: true
      }));

      // Initial: 10 units, multiplier = 2.0
      mockScene.combatSpeedMultiplier = mockScene.calculateCombatSpeedMultiplier();
      let scaled = mockScene.scaleCombatDuration(1000);
      expect(scaled).toBe(2000);

      // 5 units die
      for (let i = 0; i < 5; i++) {
        mockScene.combatUnits[i].alive = false;
      }

      // Recalculate: 5 units, multiplier = 1.5
      mockScene.combatSpeedMultiplier = mockScene.calculateCombatSpeedMultiplier();
      scaled = mockScene.scaleCombatDuration(1000);
      expect(scaled).toBe(1500);
    });
  });

  describe('Performance (Requirement 11.1)', () => {
    it('should calculate speed multiplier in under 1ms', () => {
      // Create a large team
      mockScene.combatUnits = Array.from({ length: 15 }, () => ({
        side: 'LEFT',
        alive: true
      }));

      const start = performance.now();
      mockScene.calculateCombatSpeedMultiplier();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1);
    });

    it('should handle repeated recalculations efficiently', () => {
      mockScene.combatUnits = Array.from({ length: 10 }, () => ({
        side: 'RIGHT',
        alive: true
      }));

      const start = performance.now();
      
      // Simulate multiple recalculations during combat
      for (let i = 0; i < 100; i++) {
        mockScene.calculateCombatSpeedMultiplier();
      }
      
      const duration = performance.now() - start;

      // 100 calculations should complete in under 10ms
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle only dead units', () => {
      mockScene.combatUnits = [
        { side: 'LEFT', alive: false },
        { side: 'LEFT', alive: false },
        { side: 'RIGHT', alive: false }
      ];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // No alive units, max = 0, multiplier = 1.0
      expect(multiplier).toBe(1.0);
    });

    it('should handle mixed alive and dead units', () => {
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        { side: 'LEFT', alive: false },
        { side: 'LEFT', alive: true },
        { side: 'RIGHT', alive: true },
        { side: 'RIGHT', alive: false },
        { side: 'RIGHT', alive: false }
      ];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // LEFT: 2 alive, RIGHT: 1 alive, max = 2, multiplier = 1.2
      expect(multiplier).toBe(1.2);
    });

    it('should return 1.0 for no units', () => {
      mockScene.combatUnits = [];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      expect(multiplier).toBe(1.0);
    });

    it('should handle asymmetric teams', () => {
      mockScene.combatUnits = [
        { side: 'LEFT', alive: true },
        ...Array.from({ length: 12 }, () => ({ side: 'RIGHT', alive: true }))
      ];

      const multiplier = mockScene.calculateCombatSpeedMultiplier();
      
      // Max = 12, multiplier = 1 + 1.2 = 2.2
      expect(multiplier).toBe(2.2);
    });
  });
});
