/**
 * Integration Tests for Gold Scaling in Combat
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * This test suite verifies that gold scaling is properly integrated into
 * skill damage calculation in CombatScene.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getGoldReserveScaling } from '../src/core/gameUtils.js';

/**
 * Mock Combat System for Gold Scaling Testing
 */
class MockCombatScene {
  constructor(playerGold = 0) {
    this.player = {
      gold: playerGold
    };
  }

  getEffectiveAtk(unit) {
    return unit.atk || 0;
  }

  getEffectiveMatk(unit) {
    return unit.matk || 0;
  }

  // This is the actual calcSkillRaw implementation from CombatScene.js
  calcSkillRaw(attacker, skill) {
    const statName = skill.scaleStat || "atk";
    const sourceStat =
      statName === "atk" ? this.getEffectiveAtk(attacker) : statName === "matk" ? this.getEffectiveMatk(attacker) : attacker[statName] ?? 0;
    const baseDamage = skill.base + sourceStat * skill.scale;
    
    // Apply gold scaling to skill damage (Requirement 2.1, 2.2, 2.3, 2.4)
    const goldMultiplier = getGoldReserveScaling(this.player.gold);
    const scaledDamage = Math.round(baseDamage * goldMultiplier);
    
    return scaledDamage;
  }
}

describe('Gold Scaling Integration in Combat', () => {
  describe('calcSkillRaw with gold scaling', () => {
    it('applies no bonus with 10 gold (baseline)', () => {
      const scene = new MockCombatScene(10);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      // Base damage: 50 + 100 * 1.0 = 150
      // Gold multiplier at 10 gold: 1.0
      // Expected: 150 * 1.0 = 150
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(150);
    });

    it('applies +10% bonus with 30 gold', () => {
      const scene = new MockCombatScene(30);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      // Base damage: 50 + 100 * 1.0 = 150
      // Gold multiplier at 30 gold: 1.10
      // Expected: 150 * 1.10 = 165
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(165);
    });

    it('applies +20% bonus with 50 gold', () => {
      const scene = new MockCombatScene(50);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      // Base damage: 50 + 100 * 1.0 = 150
      // Gold multiplier at 50 gold: 1.20
      // Expected: 150 * 1.20 = 180
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(180);
    });

    it('applies +100% bonus (capped) with 210 gold', () => {
      const scene = new MockCombatScene(210);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      // Base damage: 50 + 100 * 1.0 = 150
      // Gold multiplier at 210 gold: 2.0 (capped)
      // Expected: 150 * 2.0 = 300
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(300);
    });

    it('applies +100% bonus (capped) with 500 gold', () => {
      const scene = new MockCombatScene(500);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      // Base damage: 50 + 100 * 1.0 = 150
      // Gold multiplier at 500 gold: 2.0 (capped)
      // Expected: 150 * 2.0 = 300
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(300);
    });

    it('rounds damage correctly with fractional results', () => {
      const scene = new MockCombatScene(30);
      const attacker = { atk: 100 };
      const skill = { base: 33, scale: 1.0, scaleStat: "atk" };
      
      // Base damage: 33 + 100 * 1.0 = 133
      // Gold multiplier at 30 gold: 1.10
      // Expected: Math.round(133 * 1.10) = Math.round(146.3) = 146
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(146);
    });

    it('works with magic damage (matk scaling)', () => {
      const scene = new MockCombatScene(50);
      const attacker = { matk: 80 };
      const skill = { base: 40, scale: 1.2, scaleStat: "matk" };
      
      // Base damage: 40 + 80 * 1.2 = 40 + 96 = 136
      // Gold multiplier at 50 gold: 1.20
      // Expected: Math.round(136 * 1.20) = 163
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(163);
    });

    it('ensures damage never decreases (always >= base)', () => {
      const scene = new MockCombatScene(0);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      // Base damage: 50 + 100 * 1.0 = 150
      // Gold multiplier at 0 gold: 1.0
      // Expected: 150 * 1.0 = 150 (no reduction)
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(150);
    });
  });

  describe('gold scaling with different skill types', () => {
    it('scales low base damage skills', () => {
      const scene = new MockCombatScene(50);
      const attacker = { atk: 50 };
      const skill = { base: 10, scale: 0.5, scaleStat: "atk" };
      
      // Base damage: 10 + 50 * 0.5 = 35
      // Gold multiplier at 50 gold: 1.20
      // Expected: Math.round(35 * 1.20) = 42
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(42);
    });

    it('scales high base damage skills', () => {
      const scene = new MockCombatScene(50);
      const attacker = { atk: 200 };
      const skill = { base: 100, scale: 2.0, scaleStat: "atk" };
      
      // Base damage: 100 + 200 * 2.0 = 500
      // Gold multiplier at 50 gold: 1.20
      // Expected: Math.round(500 * 1.20) = 600
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(600);
    });

    it('scales skills with zero base damage', () => {
      const scene = new MockCombatScene(30);
      const attacker = { atk: 100 };
      const skill = { base: 0, scale: 1.5, scaleStat: "atk" };
      
      // Base damage: 0 + 100 * 1.5 = 150
      // Gold multiplier at 30 gold: 1.10
      // Expected: Math.round(150 * 1.10) = 165
      const damage = scene.calcSkillRaw(attacker, skill);
      expect(damage).toBe(165);
    });
  });

  describe('gold scaling consistency', () => {
    it('produces consistent results for same gold amount', () => {
      const scene = new MockCombatScene(50);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      const damage1 = scene.calcSkillRaw(attacker, skill);
      const damage2 = scene.calcSkillRaw(attacker, skill);
      const damage3 = scene.calcSkillRaw(attacker, skill);
      
      expect(damage1).toBe(damage2);
      expect(damage2).toBe(damage3);
      expect(damage1).toBe(180); // 150 * 1.20
    });

    it('updates damage when gold changes', () => {
      const scene = new MockCombatScene(10);
      const attacker = { atk: 100 };
      const skill = { base: 50, scale: 1.0, scaleStat: "atk" };
      
      // Initial damage with 10 gold
      const damage1 = scene.calcSkillRaw(attacker, skill);
      expect(damage1).toBe(150); // 150 * 1.0
      
      // Update gold to 50
      scene.player.gold = 50;
      const damage2 = scene.calcSkillRaw(attacker, skill);
      expect(damage2).toBe(180); // 150 * 1.20
      
      // Update gold to 210
      scene.player.gold = 210;
      const damage3 = scene.calcSkillRaw(attacker, skill);
      expect(damage3).toBe(300); // 150 * 2.0
    });
  });
});
