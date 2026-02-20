/**
 * Unit tests for assassin skill upgrade system (Task 2.1)
 * 
 * Tests the getEffectiveSkillId() function which automatically upgrades
 * assassin skills to "_v2" variants when units reach 2-3 stars.
 */

import { describe, it, expect } from 'vitest';
import { getEffectiveSkillId } from '../src/core/gameUtils.js';

describe('getEffectiveSkillId - Assassin Skill Upgrade System', () => {
  // Mock SKILL_LIBRARY with known _v2 variants
  const mockSkillLibrary = {
    'void_execute': { name: 'Void Execute' },
    'void_execute_v2': { name: 'Void Execute V2' },
    'flame_combo': { name: 'Flame Combo' },
    'flame_combo_v2': { name: 'Flame Combo V2' },
    'mosquito_drain': { name: 'Mosquito Drain' },
    'mosquito_drain_v2': { name: 'Mosquito Drain V2' },
    'blood_bite': { name: 'Blood Bite' },
    // Note: blood_bite_v2 does NOT exist
  };

  describe('ASSASSIN units with 2-3 stars', () => {
    it('should return upgraded skill for 2-star assassin with existing _v2 variant', () => {
      const result = getEffectiveSkillId('void_execute', 'ASSASSIN', 2, mockSkillLibrary);
      expect(result).toBe('void_execute_v2');
    });

    it('should return upgraded skill for 3-star assassin with existing _v2 variant', () => {
      const result = getEffectiveSkillId('flame_combo', 'ASSASSIN', 3, mockSkillLibrary);
      expect(result).toBe('flame_combo_v2');
    });

    it('should return base skill for 2-star assassin when _v2 does not exist', () => {
      const result = getEffectiveSkillId('blood_bite', 'ASSASSIN', 2, mockSkillLibrary);
      expect(result).toBe('blood_bite');
    });

    it('should return base skill for 3-star assassin when _v2 does not exist', () => {
      const result = getEffectiveSkillId('blood_bite', 'ASSASSIN', 3, mockSkillLibrary);
      expect(result).toBe('blood_bite');
    });
  });

  describe('ASSASSIN units with 1 star', () => {
    it('should return base skill for 1-star assassin even if _v2 exists', () => {
      const result = getEffectiveSkillId('void_execute', 'ASSASSIN', 1, mockSkillLibrary);
      expect(result).toBe('void_execute');
    });
  });

  describe('Non-ASSASSIN units', () => {
    it('should return base skill for 2-star MAGE even if _v2 exists', () => {
      const result = getEffectiveSkillId('void_execute', 'MAGE', 2, mockSkillLibrary);
      expect(result).toBe('void_execute');
    });

    it('should return base skill for 3-star FIGHTER even if _v2 exists', () => {
      const result = getEffectiveSkillId('flame_combo', 'FIGHTER', 3, mockSkillLibrary);
      expect(result).toBe('flame_combo');
    });

    it('should return base skill for 2-star ARCHER', () => {
      const result = getEffectiveSkillId('blood_bite', 'ARCHER', 2, mockSkillLibrary);
      expect(result).toBe('blood_bite');
    });

    it('should return base skill for 3-star TANKER', () => {
      const result = getEffectiveSkillId('mosquito_drain', 'TANKER', 3, mockSkillLibrary);
      expect(result).toBe('mosquito_drain');
    });

    it('should return base skill for 2-star SUPPORT', () => {
      const result = getEffectiveSkillId('void_execute', 'SUPPORT', 2, mockSkillLibrary);
      expect(result).toBe('void_execute');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty skill library gracefully', () => {
      const result = getEffectiveSkillId('void_execute', 'ASSASSIN', 2, {});
      expect(result).toBe('void_execute');
    });

    it('should handle null skill library gracefully', () => {
      const result = getEffectiveSkillId('void_execute', 'ASSASSIN', 2, null);
      expect(result).toBe('void_execute');
    });

    it('should handle undefined skill library gracefully', () => {
      const result = getEffectiveSkillId('void_execute', 'ASSASSIN', 2, undefined);
      expect(result).toBe('void_execute');
    });

    it('should handle empty base skill ID', () => {
      const result = getEffectiveSkillId('', 'ASSASSIN', 2, mockSkillLibrary);
      expect(result).toBe('');
    });
  });

  describe('Naming convention', () => {
    it('should construct upgraded skill ID as baseSkillId + "_v2"', () => {
      const result = getEffectiveSkillId('test_skill', 'ASSASSIN', 2, { 'test_skill_v2': {} });
      expect(result).toBe('test_skill_v2');
    });

    it('should verify naming convention for all known upgrades', () => {
      const knownUpgrades = [
        ['void_execute', 'void_execute_v2'],
        ['flame_combo', 'flame_combo_v2'],
        ['mosquito_drain', 'mosquito_drain_v2']
      ];

      knownUpgrades.forEach(([base, expected]) => {
        const result = getEffectiveSkillId(base, 'ASSASSIN', 2, mockSkillLibrary);
        expect(result).toBe(expected);
      });
    });
  });
});
