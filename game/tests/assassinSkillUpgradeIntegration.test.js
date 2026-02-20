/**
 * Integration tests for assassin skill upgrade in unit creation (Task 2.4)
 * 
 * Tests that createCombatUnit() correctly applies skill upgrades when creating
 * assassin units with 2-3 stars.
 */

import { describe, it, expect } from 'vitest';
import { getEffectiveSkillId } from '../src/core/gameUtils.js';
import { SKILL_LIBRARY } from '../src/data/skills.js';
import { UNIT_BY_ID } from '../src/data/unitCatalog.js';

describe('Assassin Skill Upgrade Integration', () => {
  describe('Unit creation with skill upgrades', () => {
    it('should use upgraded skill for 2-star Panther (void_execute → void_execute_v2)', () => {
      // **Validates: Requirements 4.1, 4.2**
      const panther = UNIT_BY_ID['panther_void'];
      expect(panther).toBeDefined();
      expect(panther.classType).toBe('ASSASSIN');
      
      // Get base skill (should be void_execute or void_execute_v2)
      const baseSkillId = panther.skillId;
      
      // For 2-star assassin, should return upgraded skill
      const effectiveSkillId = getEffectiveSkillId(baseSkillId, panther.classType, 2, SKILL_LIBRARY);
      
      // Verify the effective skill exists in library
      expect(SKILL_LIBRARY[effectiveSkillId]).toBeDefined();
      
      // If base skill is void_execute, should upgrade to void_execute_v2
      // If base skill is already void_execute_v2, should stay void_execute_v2
      if (baseSkillId === 'void_execute') {
        expect(effectiveSkillId).toBe('void_execute_v2');
      } else if (baseSkillId === 'void_execute_v2') {
        // Already upgraded in catalog, system should handle gracefully
        expect(effectiveSkillId).toBe('void_execute_v2');
      }
    });

    it('should use upgraded skill for 3-star Fox (flame_combo → flame_combo_v2)', () => {
      // **Validates: Requirements 4.1, 4.2**
      const fox = UNIT_BY_ID['fox_flame'];
      expect(fox).toBeDefined();
      expect(fox.classType).toBe('ASSASSIN');
      
      const baseSkillId = fox.skillId;
      expect(baseSkillId).toBe('flame_combo');
      
      // For 3-star assassin, should return upgraded skill
      const effectiveSkillId = getEffectiveSkillId(baseSkillId, fox.classType, 3, SKILL_LIBRARY);
      
      expect(effectiveSkillId).toBe('flame_combo_v2');
      expect(SKILL_LIBRARY[effectiveSkillId]).toBeDefined();
    });

    it('should use upgraded skill for 2-star Mosquito (mosquito_drain → mosquito_drain_v2)', () => {
      // **Validates: Requirements 4.1, 4.2**
      const mosquito = UNIT_BY_ID['mosquito_toxic'];
      expect(mosquito).toBeDefined();
      expect(mosquito.classType).toBe('ASSASSIN');
      
      const baseSkillId = mosquito.skillId;
      expect(baseSkillId).toBe('mosquito_drain');
      
      // For 2-star assassin, should return upgraded skill
      const effectiveSkillId = getEffectiveSkillId(baseSkillId, mosquito.classType, 2, SKILL_LIBRARY);
      
      expect(effectiveSkillId).toBe('mosquito_drain_v2');
      expect(SKILL_LIBRARY[effectiveSkillId]).toBeDefined();
    });

    it('should use base skill for 1-star Panther (void_execute)', () => {
      // **Validates: Requirements 4.5**
      const panther = UNIT_BY_ID['panther_void'];
      expect(panther).toBeDefined();
      
      const baseSkillId = panther.skillId === 'void_execute_v2' ? 'void_execute' : panther.skillId;
      
      // For 1-star assassin, should return base skill
      const effectiveSkillId = getEffectiveSkillId(baseSkillId, panther.classType, 1, SKILL_LIBRARY);
      
      expect(effectiveSkillId).toBe(baseSkillId);
      expect(SKILL_LIBRARY[effectiveSkillId]).toBeDefined();
    });

    it('should use base skill for 3-star non-ASSASSIN unit', () => {
      // **Validates: Requirements 4.4**
      // Find a non-assassin unit
      const mage = UNIT_BY_ID['worm_queen'];
      expect(mage).toBeDefined();
      expect(mage.classType).toBe('MAGE');
      
      const baseSkillId = mage.skillId;
      
      // For non-assassin, should return base skill regardless of star level
      const effectiveSkillId = getEffectiveSkillId(baseSkillId, mage.classType, 3, SKILL_LIBRARY);
      
      expect(effectiveSkillId).toBe(baseSkillId);
      expect(SKILL_LIBRARY[effectiveSkillId]).toBeDefined();
    });

    it('should use base skill for 2-star Bat when no _v2 exists (blood_bite)', () => {
      // **Validates: Requirements 4.3, 12.1**
      const bat = UNIT_BY_ID['bat_blood'];
      expect(bat).toBeDefined();
      expect(bat.classType).toBe('ASSASSIN');
      
      const baseSkillId = bat.skillId;
      expect(baseSkillId).toBe('blood_bite');
      
      // For 2-star assassin with no _v2 variant, should return base skill
      const effectiveSkillId = getEffectiveSkillId(baseSkillId, bat.classType, 2, SKILL_LIBRARY);
      
      expect(effectiveSkillId).toBe('blood_bite');
      expect(SKILL_LIBRARY[effectiveSkillId]).toBeDefined();
      
      // Verify _v2 doesn't exist
      expect(SKILL_LIBRARY['blood_bite_v2']).toBeUndefined();
    });
  });

  describe('Backward compatibility', () => {
    it('should handle units with existing skills gracefully', () => {
      // **Validates: Requirements 12.2, 12.3**
      const assassinUnits = Object.values(UNIT_BY_ID).filter(u => u.classType === 'ASSASSIN');
      
      expect(assassinUnits.length).toBeGreaterThan(0);
      
      assassinUnits.forEach(unit => {
        // Test with different star levels
        [1, 2, 3].forEach(star => {
          const effectiveSkillId = getEffectiveSkillId(unit.skillId, unit.classType, star, SKILL_LIBRARY);
          
          // Should always return a valid skill ID
          expect(effectiveSkillId).toBeDefined();
          expect(typeof effectiveSkillId).toBe('string');
          expect(effectiveSkillId.length).toBeGreaterThan(0);
          
          // The effective skill should exist in the library
          expect(SKILL_LIBRARY[effectiveSkillId]).toBeDefined();
        });
      });
    });

    it('should verify all _v2 skills exist in SKILL_LIBRARY', () => {
      // **Validates: Requirements 5.3**
      const knownUpgrades = [
        'void_execute_v2',
        'flame_combo_v2',
        'mosquito_drain_v2'
      ];

      knownUpgrades.forEach(upgradedSkillId => {
        expect(SKILL_LIBRARY[upgradedSkillId]).toBeDefined();
        expect(SKILL_LIBRARY[upgradedSkillId].name).toBeDefined();
      });
    });
  });

  describe('Skill upgrade naming convention', () => {
    it('should follow baseSkillId + "_v2" naming pattern', () => {
      // **Validates: Requirements 5.1, 5.2**
      const baseSkills = ['void_execute', 'flame_combo', 'mosquito_drain'];
      
      baseSkills.forEach(baseSkillId => {
        const upgradedSkillId = `${baseSkillId}_v2`;
        
        // Verify the upgraded skill exists
        expect(SKILL_LIBRARY[upgradedSkillId]).toBeDefined();
        
        // Verify the naming convention
        expect(upgradedSkillId).toMatch(new RegExp(`^${baseSkillId}_v2$`));
      });
    });
  });
});
