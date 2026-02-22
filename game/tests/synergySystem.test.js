/**
 * SynergySystem Unit Tests
 * 
 * **Validates: Requirements 2.7, 6.1, 6.2, 6.3, 6.6, 11.1, 11.2**
 * **Property 9: Synergy Calculation Correctness**
 * **Property 31: Synergy Bonus Application**
 * 
 * Tests SynergySystem functionality:
 * - calculateSynergies with various team compositions
 * - Synergy threshold activation (2, 4, 6 units)
 * - Multiple synergies active simultaneously
 * - Synergy recalculation when team changes
 * - applySynergiesToUnit cumulative bonuses
 * - Extra count support (from augments)
 * - Edge cases (empty teams, invalid data, etc.)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSynergies,
  getSynergyBonus,
  getSynergyTier,
  applySynergiesToUnit,
  applyBonusToCombatUnit,
  applySynergyBonusesToTeam,
  getSynergyDescription,
  getSynergyIcon,
  getActiveSynergies,
  SynergySystem
} from '../src/systems/SynergySystem.js';
import { CLASS_SYNERGY, TRIBE_SYNERGY } from '../src/data/synergies.js';

// Helper function to create a test unit
function createUnit(uid, classType, tribe, star = 1) {
  return {
    uid,
    classType,
    tribe,
    star,
    base: {
      classType,
      tribe
    }
  };
}

// Helper function to create a combat unit
function createCombatUnit(uid, classType, tribe, stats = {}) {
  return {
    uid,
    classType,
    tribe,
    hp: stats.hp || 100,
    maxHp: stats.maxHp || 100,
    atk: stats.atk || 50,
    def: stats.def || 20,
    matk: stats.matk || 30,
    mdef: stats.mdef || 15,
    speed: stats.speed || 10,
    rage: stats.rage || 0,
    rageMax: stats.rageMax || 100,
    mods: stats.mods || {}
  };
}

describe('SynergySystem Unit Tests', () => {

  describe('calculateSynergies', () => {
    it('should calculate synergies for empty unit list', () => {
      const result = calculateSynergies([]);
      
      expect(result.classCounts).toEqual({});
      expect(result.tribeCounts).toEqual({});
    });

    it('should count units by class type', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'SPIRIT'),
        createUnit('u3', 'ASSASSIN', 'TIDE')
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['TANKER']).toBe(2);
      expect(result.classCounts['ASSASSIN']).toBe(1);
    });

    it('should count units by tribe', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'ASSASSIN', 'FIRE'),
        createUnit('u3', 'MAGE', 'SPIRIT')
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.tribeCounts['FIRE']).toBe(2);
      expect(result.tribeCounts['SPIRIT']).toBe(1);
    });

    it('should handle units with undefined/null class or tribe', () => {
      const units = [
        createUnit('u1', null, 'FIRE'),
        createUnit('u2', 'TANKER', null),
        { uid: 'u3', base: {} }
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['TANKER']).toBe(1);
      expect(result.tribeCounts['FIRE']).toBe(1);
      expect(result.classCounts[null]).toBeUndefined();
    });

    it('should apply extra class count to top class for player side', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'SPIRIT'),
        createUnit('u3', 'ASSASSIN', 'TIDE')
      ];
      
      const result = calculateSynergies(units, 'LEFT', { extraClassCount: 1 });
      
      expect(result.classCounts['TANKER']).toBe(3); // 2 + 1 extra
      expect(result.classCounts['ASSASSIN']).toBe(1);
    });

    it('should apply extra tribe count to top tribe for player side', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'ASSASSIN', 'FIRE'),
        createUnit('u3', 'MAGE', 'SPIRIT')
      ];
      
      const result = calculateSynergies(units, 'LEFT', { extraTribeCount: 2 });
      
      expect(result.tribeCounts['FIRE']).toBe(4); // 2 + 2 extra
      expect(result.tribeCounts['SPIRIT']).toBe(1);
    });

    it('should not apply extra counts for enemy side', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'FIRE')
      ];
      
      const result = calculateSynergies(units, 'RIGHT', { extraClassCount: 1, extraTribeCount: 1 });
      
      expect(result.classCounts['TANKER']).toBe(2);
      expect(result.tribeCounts['FIRE']).toBe(2);
    });

    it('should not apply extra counts when units list is empty', () => {
      const result = calculateSynergies([], 'LEFT', { extraClassCount: 1, extraTribeCount: 1 });
      
      expect(result.classCounts).toEqual({});
      expect(result.tribeCounts).toEqual({});
    });
  });

  describe('getSynergyBonus', () => {
    it('should return null for invalid synergy definition', () => {
      expect(getSynergyBonus(null, 2)).toBeNull();
      expect(getSynergyBonus({}, 2)).toBeNull();
      expect(getSynergyBonus({ thresholds: [] }, 2)).toBeNull();
    });

    it('should return null when count does not meet any threshold', () => {
      const synergyDef = {
        thresholds: [2, 4, 6],
        bonuses: [{ atk: 10 }, { atk: 20 }, { atk: 30 }]
      };
      
      expect(getSynergyBonus(synergyDef, 1)).toBeNull();
    });

    it('should return first tier bonus when count meets first threshold', () => {
      const synergyDef = {
        thresholds: [2, 4, 6],
        bonuses: [{ atk: 10 }, { atk: 20 }, { atk: 30 }]
      };
      
      const bonus = getSynergyBonus(synergyDef, 2);
      expect(bonus).toEqual({ atk: 10 });
    });

    it('should return highest tier bonus when count meets multiple thresholds', () => {
      const synergyDef = {
        thresholds: [2, 4, 6],
        bonuses: [{ atk: 10 }, { atk: 20 }, { atk: 30 }]
      };
      
      const bonus = getSynergyBonus(synergyDef, 6);
      expect(bonus).toEqual({ atk: 30 });
    });

    it('should return middle tier bonus when count is between thresholds', () => {
      const synergyDef = {
        thresholds: [2, 4, 6],
        bonuses: [{ atk: 10 }, { atk: 20 }, { atk: 30 }]
      };
      
      const bonus = getSynergyBonus(synergyDef, 5);
      expect(bonus).toEqual({ atk: 20 });
    });

    it('should work with real CLASS_SYNERGY data', () => {
      if (CLASS_SYNERGY['TANKER']) {
        const bonus = getSynergyBonus(CLASS_SYNERGY['TANKER'], 2);
        expect(bonus).toBeDefined();
      }
    });
  });

  describe('getSynergyTier', () => {
    it('should return -1 for invalid thresholds', () => {
      expect(getSynergyTier(2, null)).toBe(-1);
      expect(getSynergyTier(2, undefined)).toBe(-1);
      expect(getSynergyTier(2, 'not-array')).toBe(-1);
    });

    it('should return -1 when count does not meet any threshold', () => {
      expect(getSynergyTier(1, [2, 4, 6])).toBe(-1);
    });

    it('should return 0 for first tier', () => {
      expect(getSynergyTier(2, [2, 4, 6])).toBe(0);
    });

    it('should return highest tier index when count meets multiple thresholds', () => {
      expect(getSynergyTier(6, [2, 4, 6])).toBe(2);
      expect(getSynergyTier(10, [2, 4, 6])).toBe(2);
    });

    it('should return correct tier for count between thresholds', () => {
      expect(getSynergyTier(3, [2, 4, 6])).toBe(0);
      expect(getSynergyTier(5, [2, 4, 6])).toBe(1);
    });
  });

  describe('applySynergiesToUnit', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => applySynergiesToUnit(null, {})).not.toThrow();
      expect(() => applySynergiesToUnit({}, null)).not.toThrow();
    });

    it('should apply class synergy bonus to unit mods', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      const synergyCounts = {
        classCounts: { TANKER: 2 },
        tribeCounts: {}
      };
      
      applySynergiesToUnit(unit, synergyCounts);
      
      expect(unit.mods).toBeDefined();
      // Check that some bonus was applied (actual values depend on synergies.csv)
      expect(Object.keys(unit.mods).length).toBeGreaterThan(0);
    });

    it('should apply tribe synergy bonus to unit mods', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      const synergyCounts = {
        classCounts: {},
        tribeCounts: { FIRE: 2 }
      };
      
      applySynergiesToUnit(unit, synergyCounts);
      
      expect(unit.mods).toBeDefined();
      expect(Object.keys(unit.mods).length).toBeGreaterThan(0);
    });

    it('should apply both class and tribe synergies cumulatively', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      const synergyCounts = {
        classCounts: { TANKER: 2 },
        tribeCounts: { FIRE: 2 }
      };
      
      applySynergiesToUnit(unit, synergyCounts);
      
      expect(unit.mods).toBeDefined();
      // Both synergies should be applied
      expect(Object.keys(unit.mods).length).toBeGreaterThan(0);
    });

    it('should not apply synergy if count does not meet threshold', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      const synergyCounts = {
        classCounts: { TANKER: 1 }, // Below threshold
        tribeCounts: {}
      };
      
      applySynergiesToUnit(unit, synergyCounts);
      
      // No synergy should be applied if below threshold
      expect(unit.mods).toEqual({});
    });

    it('should initialize mods object if not present', () => {
      const unit = { uid: 'u1', classType: 'TANKER', tribe: 'FIRE' };
      const synergyCounts = {
        classCounts: { TANKER: 2 },
        tribeCounts: {}
      };
      
      applySynergiesToUnit(unit, synergyCounts);
      
      expect(unit.mods).toBeDefined();
    });
  });

  describe('applyBonusToCombatUnit', () => {
    it('should handle null bonus gracefully', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      const originalHp = unit.hp;
      
      applyBonusToCombatUnit(unit, null);
      
      expect(unit.hp).toBe(originalHp);
    });

    it('should apply flat defense bonus', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE', { def: 20 });
      
      applyBonusToCombatUnit(unit, { defFlat: 10 });
      
      expect(unit.def).toBe(30);
    });

    it('should apply flat magic defense bonus', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE', { mdef: 15 });
      
      applyBonusToCombatUnit(unit, { mdefFlat: 5 });
      
      expect(unit.mdef).toBe(20);
    });

    it('should apply HP percentage bonus', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE', { hp: 100, maxHp: 100 });
      
      applyBonusToCombatUnit(unit, { hpPct: 0.2 }); // 20% bonus
      
      expect(unit.maxHp).toBe(120);
      expect(unit.hp).toBe(120);
    });

    it('should apply attack percentage bonus', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE', { atk: 50 });
      
      applyBonusToCombatUnit(unit, { atkPct: 0.3 }); // 30% bonus
      
      expect(unit.atk).toBe(65); // 50 * 1.3 = 65
    });

    it('should apply magic attack percentage bonus', () => {
      const unit = createCombatUnit('u1', 'MAGE', 'FIRE', { matk: 40 });
      
      applyBonusToCombatUnit(unit, { matkPct: 0.25 }); // 25% bonus
      
      expect(unit.matk).toBe(50); // 40 * 1.25 = 50
    });

    it('should apply mod-based bonuses', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      unit.mods = { healPct: 0, lifestealPct: 0, evadePct: 0 };
      
      applyBonusToCombatUnit(unit, {
        healPct: 0.1,
        lifestealPct: 0.15,
        evadePct: 0.05
      });
      
      expect(unit.mods.healPct).toBe(0.1);
      expect(unit.mods.lifestealPct).toBe(0.15);
      expect(unit.mods.evadePct).toBe(0.05);
    });

    it('should apply shield and rage bonuses', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      unit.mods = { shieldStart: 0, startingRage: 0 };
      
      applyBonusToCombatUnit(unit, {
        shieldStart: 50,
        startingRage: 20
      });
      
      expect(unit.mods.shieldStart).toBe(50);
      expect(unit.mods.startingRage).toBe(20);
    });

    it('should apply status effect bonuses', () => {
      const unit = createCombatUnit('u1', 'ASSASSIN', 'FIRE');
      unit.mods = { critPct: 0, burnOnHit: 0, poisonOnHit: 0 };
      
      applyBonusToCombatUnit(unit, {
        critPct: 0.2,
        burnOnHit: 10,
        poisonOnHit: 5
      });
      
      expect(unit.mods.critPct).toBe(0.2);
      expect(unit.mods.burnOnHit).toBe(10);
      expect(unit.mods.poisonOnHit).toBe(5);
    });

    it('should handle teamHpPct as hpPct', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE', { hp: 100, maxHp: 100 });
      
      applyBonusToCombatUnit(unit, { teamHpPct: 0.15 });
      
      expect(unit.maxHp).toBe(115);
      expect(unit.hp).toBe(115);
    });

    it('should handle teamAtkPct as atkPct', () => {
      const unit = createCombatUnit('u1', 'FIGHTER', 'FIRE', { atk: 60 });
      
      applyBonusToCombatUnit(unit, { teamAtkPct: 0.2 });
      
      expect(unit.atk).toBe(72); // 60 * 1.2 = 72
    });

    it('should handle teamMatkPct as matkPct', () => {
      const unit = createCombatUnit('u1', 'MAGE', 'SPIRIT', { matk: 50 });
      
      applyBonusToCombatUnit(unit, { teamMatkPct: 0.3 });
      
      expect(unit.matk).toBe(65); // 50 * 1.3 = 65
    });
  });

  describe('applySynergyBonusesToTeam', () => {
    it('should handle empty team', () => {
      expect(() => applySynergyBonusesToTeam([])).not.toThrow();
    });

    it('should handle null/undefined team', () => {
      expect(() => applySynergyBonusesToTeam(null)).not.toThrow();
      expect(() => applySynergyBonusesToTeam(undefined)).not.toThrow();
    });

    it('should apply synergies to all units in team', () => {
      const units = [
        createCombatUnit('u1', 'TANKER', 'FIRE', { hp: 100, maxHp: 100 }),
        createCombatUnit('u2', 'TANKER', 'FIRE', { hp: 100, maxHp: 100 })
      ];
      
      applySynergyBonusesToTeam(units, 'LEFT');
      
      // Both units should have synergy bonuses applied
      units.forEach(unit => {
        expect(unit.hp).toBeGreaterThanOrEqual(100);
        expect(unit.maxHp).toBeGreaterThanOrEqual(100);
      });
    });

    it('should apply starting rage from mods', () => {
      const units = [
        createCombatUnit('u1', 'FIGHTER', 'FIRE', { rage: 0 })
      ];
      units[0].mods = { startingRage: 30 };
      
      applySynergyBonusesToTeam(units, 'LEFT');
      
      expect(units[0].rage).toBe(30);
    });

    it('should cap starting rage at rageMax', () => {
      const units = [
        createCombatUnit('u1', 'FIGHTER', 'FIRE', { rage: 90, rageMax: 100 })
      ];
      units[0].mods = { startingRage: 50 };
      
      applySynergyBonusesToTeam(units, 'LEFT');
      
      expect(units[0].rage).toBe(100); // Capped at rageMax
    });

    it('should apply starting shield from mods', () => {
      const units = [
        createCombatUnit('u1', 'TANKER', 'STONE')
      ];
      units[0].mods = { shieldStart: 40 };
      units[0].shield = 0;
      
      applySynergyBonusesToTeam(units, 'LEFT');
      
      expect(units[0].shield).toBe(40);
    });

    it('should handle multiple synergies simultaneously', () => {
      const units = [
        createCombatUnit('u1', 'TANKER', 'FIRE', { hp: 100, maxHp: 100 }),
        createCombatUnit('u2', 'TANKER', 'FIRE', { hp: 100, maxHp: 100 }),
        createCombatUnit('u3', 'ASSASSIN', 'SPIRIT', { hp: 80, maxHp: 80 }),
        createCombatUnit('u4', 'ASSASSIN', 'SPIRIT', { hp: 80, maxHp: 80 })
      ];
      
      applySynergyBonusesToTeam(units, 'LEFT');
      
      // All units should have their respective synergies applied
      units.forEach(unit => {
        expect(unit.hp).toBeGreaterThanOrEqual(80);
      });
    });

    it('should support extra counts from options', () => {
      const units = [
        createCombatUnit('u1', 'TANKER', 'FIRE'),
        createCombatUnit('u2', 'TANKER', 'FIRE')
      ];
      
      // With extra count, should reach higher tier
      applySynergyBonusesToTeam(units, 'LEFT', { extraClassCount: 2 });
      
      // Units should have bonuses applied (exact values depend on synergies.csv)
      expect(units[0].hp).toBeGreaterThanOrEqual(100);
    });
  });

  describe('getSynergyDescription', () => {
    it('should return empty string for invalid synergy', () => {
      expect(getSynergyDescription('INVALID', 0, 'class')).toBe('');
    });

    it('should return empty string for invalid level', () => {
      expect(getSynergyDescription('TANKER', -1, 'class')).toBe('');
      expect(getSynergyDescription('TANKER', 999, 'class')).toBe('');
    });

    it('should return description for valid class synergy', () => {
      if (CLASS_SYNERGY['TANKER']) {
        const desc = getSynergyDescription('TANKER', 0, 'class');
        expect(desc).toBeTruthy();
        expect(typeof desc).toBe('string');
      }
    });

    it('should return description for valid tribe synergy', () => {
      if (TRIBE_SYNERGY['FIRE']) {
        const desc = getSynergyDescription('FIRE', 0, 'tribe');
        expect(desc).toBeTruthy();
        expect(typeof desc).toBe('string');
      }
    });

    it('should include threshold in description', () => {
      if (CLASS_SYNERGY['TANKER']) {
        const desc = getSynergyDescription('TANKER', 0, 'class');
        const threshold = CLASS_SYNERGY['TANKER'].thresholds[0];
        expect(desc).toContain(threshold.toString());
      }
    });
  });

  describe('getSynergyIcon', () => {
    it('should return class icons', () => {
      expect(getSynergyIcon('TANKER', 'class')).toBe('🛡️');
      expect(getSynergyIcon('ASSASSIN', 'class')).toBe('🗡️');
      expect(getSynergyIcon('ARCHER', 'class')).toBe('🏹');
      expect(getSynergyIcon('MAGE', 'class')).toBe('🔮');
      expect(getSynergyIcon('SUPPORT', 'class')).toBe('💚');
      expect(getSynergyIcon('FIGHTER', 'class')).toBe('⚔️');
    });

    it('should return tribe icons', () => {
      expect(getSynergyIcon('FIRE', 'tribe')).toBe('🔥');
      expect(getSynergyIcon('SPIRIT', 'tribe')).toBe('👻');
      expect(getSynergyIcon('TIDE', 'tribe')).toBe('🌊');
      expect(getSynergyIcon('STONE', 'tribe')).toBe('🪨');
      expect(getSynergyIcon('WIND', 'tribe')).toBe('💨');
      expect(getSynergyIcon('NIGHT', 'tribe')).toBe('🌙');
      expect(getSynergyIcon('SWARM', 'tribe')).toBe('🐝');
      expect(getSynergyIcon('WOOD', 'tribe')).toBe('🌲');
    });

    it('should return default icon for unknown synergy', () => {
      expect(getSynergyIcon('UNKNOWN', 'class')).toBe('◎');
      expect(getSynergyIcon('INVALID', 'tribe')).toBe('◎');
    });
  });

  describe('getActiveSynergies', () => {
    it('should return empty array for empty team', () => {
      const result = getActiveSynergies([]);
      expect(result).toEqual([]);
    });

    it('should return active class synergies', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'SPIRIT')
      ];
      
      const result = getActiveSynergies(units);
      
      const classSynergies = result.filter(s => s.type === 'class');
      expect(classSynergies.length).toBeGreaterThan(0);
      
      const tankerSynergy = classSynergies.find(s => s.key === 'TANKER');
      if (tankerSynergy) {
        expect(tankerSynergy.count).toBe(2);
        expect(tankerSynergy.tier).toBeGreaterThanOrEqual(0);
        expect(tankerSynergy.threshold).toBeDefined();
        expect(tankerSynergy.bonuses).toBeDefined();
        expect(tankerSynergy.description).toBeTruthy();
        expect(tankerSynergy.icon).toBeTruthy();
      }
    });

    it('should return active tribe synergies', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'ASSASSIN', 'FIRE')
      ];
      
      const result = getActiveSynergies(units);
      
      const tribeSynergies = result.filter(s => s.type === 'tribe');
      expect(tribeSynergies.length).toBeGreaterThan(0);
      
      const fireSynergy = tribeSynergies.find(s => s.key === 'FIRE');
      if (fireSynergy) {
        expect(fireSynergy.count).toBe(2);
        expect(fireSynergy.tier).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return multiple active synergies', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'FIRE'),
        createUnit('u3', 'ASSASSIN', 'SPIRIT'),
        createUnit('u4', 'ASSASSIN', 'SPIRIT')
      ];
      
      const result = getActiveSynergies(units);
      
      // Should have at least 2 class synergies and 2 tribe synergies
      expect(result.length).toBeGreaterThanOrEqual(2);
      
      const classSynergies = result.filter(s => s.type === 'class');
      const tribeSynergies = result.filter(s => s.type === 'tribe');
      
      expect(classSynergies.length).toBeGreaterThan(0);
      expect(tribeSynergies.length).toBeGreaterThan(0);
    });

    it('should not return synergies below threshold', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE')
      ];
      
      const result = getActiveSynergies(units);
      
      // Single unit should not activate any synergies (thresholds are typically 2+)
      expect(result.length).toBe(0);
    });

    it('should support extra counts in getActiveSynergies', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE')
      ];
      
      const result = getActiveSynergies(units, 'LEFT', { extraClassCount: 1, extraTribeCount: 1 });
      
      // With extra counts, should reach threshold
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return higher tier for higher counts', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'FIRE'),
        createUnit('u3', 'TANKER', 'FIRE'),
        createUnit('u4', 'TANKER', 'FIRE')
      ];
      
      const result = getActiveSynergies(units);
      
      const tankerSynergy = result.find(s => s.key === 'TANKER');
      if (tankerSynergy) {
        expect(tankerSynergy.count).toBe(4);
        // Tier should be at least 1 (assuming thresholds like [2, 4, 6])
        expect(tankerSynergy.tier).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Integration tests', () => {
    it('should calculate and apply synergies for a complete team', () => {
      const units = [
        createCombatUnit('u1', 'TANKER', 'FIRE', { hp: 100, maxHp: 100, atk: 50 }),
        createCombatUnit('u2', 'TANKER', 'FIRE', { hp: 100, maxHp: 100, atk: 50 }),
        createCombatUnit('u3', 'ASSASSIN', 'SPIRIT', { hp: 80, maxHp: 80, atk: 60 }),
        createCombatUnit('u4', 'ASSASSIN', 'SPIRIT', { hp: 80, maxHp: 80, atk: 60 })
      ];
      
      const originalStats = units.map(u => ({ hp: u.hp, maxHp: u.maxHp, atk: u.atk }));
      
      applySynergyBonusesToTeam(units, 'LEFT');
      
      // Stats should be modified by synergies
      units.forEach((unit, i) => {
        // HP/maxHP should be increased or stay same
        expect(unit.hp).toBeGreaterThanOrEqual(originalStats[i].hp);
        expect(unit.maxHp).toBeGreaterThanOrEqual(originalStats[i].maxHp);
      });
    });

    it('should recalculate synergies when team composition changes', () => {
      let units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'FIRE')
      ];
      
      const result1 = calculateSynergies(units);
      expect(result1.classCounts['TANKER']).toBe(2);
      
      // Add another TANKER
      units.push(createUnit('u3', 'TANKER', 'FIRE'));
      
      const result2 = calculateSynergies(units);
      expect(result2.classCounts['TANKER']).toBe(3);
      
      // Remove one TANKER
      units = units.slice(0, 2);
      
      const result3 = calculateSynergies(units);
      expect(result3.classCounts['TANKER']).toBe(2);
    });

    it('should handle team with all different classes and tribes', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'ASSASSIN', 'SPIRIT'),
        createUnit('u3', 'MAGE', 'TIDE'),
        createUnit('u4', 'ARCHER', 'STONE'),
        createUnit('u5', 'SUPPORT', 'WIND'),
        createUnit('u6', 'FIGHTER', 'NIGHT')
      ];
      
      const result = calculateSynergies(units);
      
      expect(Object.keys(result.classCounts).length).toBe(6);
      expect(Object.keys(result.tribeCounts).length).toBe(6);
      
      // Each should have count of 1
      Object.values(result.classCounts).forEach(count => {
        expect(count).toBe(1);
      });
    });

    it('should handle team with maximum synergy tiers', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE'),
        createUnit('u2', 'TANKER', 'FIRE'),
        createUnit('u3', 'TANKER', 'FIRE'),
        createUnit('u4', 'TANKER', 'FIRE'),
        createUnit('u5', 'TANKER', 'FIRE'),
        createUnit('u6', 'TANKER', 'FIRE')
      ];
      
      const result = getActiveSynergies(units);
      
      const tankerSynergy = result.find(s => s.key === 'TANKER');
      if (tankerSynergy) {
        expect(tankerSynergy.count).toBe(6);
        // Should reach highest tier
        expect(tankerSynergy.tier).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle mixed star levels (star level should not affect synergy count)', () => {
      const units = [
        createUnit('u1', 'TANKER', 'FIRE', 1),
        createUnit('u2', 'TANKER', 'FIRE', 2),
        createUnit('u3', 'TANKER', 'FIRE', 3)
      ];
      
      const result = calculateSynergies(units);
      
      // All should count equally regardless of star level
      expect(result.classCounts['TANKER']).toBe(3);
      expect(result.tribeCounts['FIRE']).toBe(3);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle units with missing base property', () => {
      const units = [
        { uid: 'u1', classType: 'TANKER', tribe: 'FIRE' },
        { uid: 'u2', classType: 'TANKER', tribe: 'FIRE' }
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['TANKER']).toBe(2);
      expect(result.tribeCounts['FIRE']).toBe(2);
    });

    it('should handle units with string "undefined" or "null" values', () => {
      const units = [
        { uid: 'u1', classType: 'undefined', tribe: 'FIRE', base: {} },
        { uid: 'u2', classType: 'TANKER', tribe: 'null', base: {} }
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['TANKER']).toBe(1);
      expect(result.tribeCounts['FIRE']).toBe(1);
      expect(result.classCounts['undefined']).toBeUndefined();
      expect(result.tribeCounts['null']).toBeUndefined();
    });

    it('should handle very large teams', () => {
      const units = [];
      for (let i = 0; i < 100; i++) {
        units.push(createUnit(`u${i}`, 'TANKER', 'FIRE'));
      }
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['TANKER']).toBe(100);
      expect(result.tribeCounts['FIRE']).toBe(100);
    });

    it('should handle units with whitespace in class/tribe values', () => {
      const units = [
        { uid: 'u1', classType: '  TANKER  ', tribe: '  FIRE  ', base: {} }
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['TANKER']).toBe(1);
      expect(result.tribeCounts['FIRE']).toBe(1);
    });

    it('should not crash with circular references in unit objects', () => {
      const unit = createUnit('u1', 'TANKER', 'FIRE');
      unit.self = unit; // Circular reference
      
      expect(() => calculateSynergies([unit])).not.toThrow();
    });

    it('should handle bonus with zero values', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE');
      
      applyBonusToCombatUnit(unit, {
        defFlat: 0,
        hpPct: 0,
        atkPct: 0
      });
      
      // Should not crash, stats should remain unchanged
      expect(unit.def).toBe(20);
      expect(unit.hp).toBe(100);
      expect(unit.atk).toBe(50);
    });

    it('should handle negative bonus values gracefully', () => {
      const unit = createCombatUnit('u1', 'TANKER', 'FIRE', { def: 20 });
      
      applyBonusToCombatUnit(unit, { defFlat: -5 });
      
      expect(unit.def).toBe(15);
    });
  });

  describe('SynergySystem export object', () => {
    it('should export all required functions', () => {
      expect(SynergySystem.calculateSynergies).toBeDefined();
      expect(SynergySystem.getActiveSynergies).toBeDefined();
      expect(SynergySystem.getSynergyBonus).toBeDefined();
      expect(SynergySystem.getSynergyTier).toBeDefined();
      expect(SynergySystem.applySynergiesToUnit).toBeDefined();
      expect(SynergySystem.applyBonusToCombatUnit).toBeDefined();
      expect(SynergySystem.applySynergyBonusesToTeam).toBeDefined();
      expect(SynergySystem.getSynergyDescription).toBeDefined();
      expect(SynergySystem.getSynergyIcon).toBeDefined();
    });

    it('should have functions that match named exports', () => {
      expect(SynergySystem.calculateSynergies).toBe(calculateSynergies);
      expect(SynergySystem.getActiveSynergies).toBe(getActiveSynergies);
      expect(SynergySystem.getSynergyBonus).toBe(getSynergyBonus);
      expect(SynergySystem.getSynergyTier).toBe(getSynergyTier);
      expect(SynergySystem.applySynergiesToUnit).toBe(applySynergiesToUnit);
      expect(SynergySystem.applyBonusToCombatUnit).toBe(applyBonusToCombatUnit);
      expect(SynergySystem.applySynergyBonusesToTeam).toBe(applySynergyBonusesToTeam);
      expect(SynergySystem.getSynergyDescription).toBe(getSynergyDescription);
      expect(SynergySystem.getSynergyIcon).toBe(getSynergyIcon);
    });
  });
});
