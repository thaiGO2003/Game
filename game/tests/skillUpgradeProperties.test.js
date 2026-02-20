/**
 * Property-based tests for assassin skill upgrade logic (Task 2.2)
 * 
 * Tests Properties 6, 7, and 14 using fast-check to verify:
 * - Assassin skill selection logic across random inputs
 * - Skill upgrade naming convention
 * - Skill upgrade validity (returned skill always exists)
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 12.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getEffectiveSkillId } from '../src/core/gameUtils.js';

describe('Property-Based Tests: Skill Upgrade Logic', () => {
  // Mock SKILL_LIBRARY with known _v2 variants
  const mockSkillLibrary = {
    'void_execute': { name: 'Void Execute' },
    'void_execute_v2': { name: 'Void Execute V2' },
    'flame_combo': { name: 'Flame Combo' },
    'flame_combo_v2': { name: 'Flame Combo V2' },
    'mosquito_drain': { name: 'Mosquito Drain' },
    'mosquito_drain_v2': { name: 'Mosquito Drain V2' },
    'blood_bite': { name: 'Blood Bite' },
    'mantis_slice': { name: 'Mantis Slice' },
    'carrion_feast': { name: 'Carrion Feast' },
    'row_pierce': { name: 'Row Pierce' },
    'basic_attack': { name: 'Basic Attack' },
    // Note: blood_bite_v2, mantis_slice_v2, etc. do NOT exist
  };

  // Generators for property-based testing
  const classTypeGen = fc.constantFrom('ASSASSIN', 'MAGE', 'FIGHTER', 'ARCHER', 'TANKER', 'SUPPORT');
  const starLevelGen = fc.integer({ min: 1, max: 3 });
  const skillIdGen = fc.constantFrom(
    'void_execute',
    'flame_combo',
    'mosquito_drain',
    'blood_bite',
    'mantis_slice',
    'carrion_feast',
    'row_pierce',
    'basic_attack'
  );

  describe('Property 6: Assassin Skill Selection', () => {
    it('**Validates: Requirements 4.2** - ASSASSIN with 2-3★ and existing _v2 returns upgraded skill', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('void_execute', 'flame_combo', 'mosquito_drain'),
          fc.constantFrom(2, 3),
          (baseSkillId, star) => {
            const result = getEffectiveSkillId(baseSkillId, 'ASSASSIN', star, mockSkillLibrary);
            const expectedUpgrade = `${baseSkillId}_v2`;
            expect(result).toBe(expectedUpgrade);
            expect(mockSkillLibrary[result]).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.5** - ASSASSIN with 1★ returns base skill', () => {
      fc.assert(
        fc.property(
          skillIdGen,
          (baseSkillId) => {
            const result = getEffectiveSkillId(baseSkillId, 'ASSASSIN', 1, mockSkillLibrary);
            expect(result).toBe(baseSkillId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.4** - Non-ASSASSIN returns base skill regardless of star level', () => {
      fc.assert(
        fc.property(
          skillIdGen,
          fc.constantFrom('MAGE', 'FIGHTER', 'ARCHER', 'TANKER', 'SUPPORT'),
          starLevelGen,
          (baseSkillId, classType, star) => {
            const result = getEffectiveSkillId(baseSkillId, classType, star, mockSkillLibrary);
            expect(result).toBe(baseSkillId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.3, 12.1** - ASSASSIN with 2-3★ without _v2 returns base skill', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('blood_bite', 'mantis_slice', 'carrion_feast', 'basic_attack'),
          fc.constantFrom(2, 3),
          (baseSkillId, star) => {
            const result = getEffectiveSkillId(baseSkillId, 'ASSASSIN', star, mockSkillLibrary);
            expect(result).toBe(baseSkillId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5** - Comprehensive skill selection across all combinations', () => {
      fc.assert(
        fc.property(
          skillIdGen,
          classTypeGen,
          starLevelGen,
          (baseSkillId, classType, star) => {
            const result = getEffectiveSkillId(baseSkillId, classType, star, mockSkillLibrary);
            
            // Determine expected result
            const isAssassin = classType === 'ASSASSIN';
            const isHighStar = star >= 2;
            const upgradedSkillId = `${baseSkillId}_v2`;
            const hasUpgrade = mockSkillLibrary[upgradedSkillId] !== undefined;
            
            if (isAssassin && isHighStar && hasUpgrade) {
              expect(result).toBe(upgradedSkillId);
            } else {
              expect(result).toBe(baseSkillId);
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('Property 7: Skill Upgrade Naming Convention', () => {
    it('**Validates: Requirements 5.1, 5.2** - Upgraded skill ID follows baseSkillId + "_v2" convention', () => {
      fc.assert(
        fc.property(
          skillIdGen,
          (baseSkillId) => {
            const upgradedSkillId = `${baseSkillId}_v2`;
            
            // If the upgrade exists in the library, verify it follows the naming convention
            if (mockSkillLibrary[upgradedSkillId]) {
              const result = getEffectiveSkillId(baseSkillId, 'ASSASSIN', 2, mockSkillLibrary);
              expect(result).toBe(upgradedSkillId);
              expect(result).toMatch(new RegExp(`^${baseSkillId}_v2$`));
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 5.1, 5.2** - All known upgrades follow naming convention', () => {
      const knownUpgrades = [
        ['void_execute', 'void_execute_v2'],
        ['flame_combo', 'flame_combo_v2'],
        ['mosquito_drain', 'mosquito_drain_v2']
      ];

      knownUpgrades.forEach(([base, expected]) => {
        expect(expected).toBe(`${base}_v2`);
        const result = getEffectiveSkillId(base, 'ASSASSIN', 2, mockSkillLibrary);
        expect(result).toBe(expected);
      });
    });

    it('**Validates: Requirements 5.1, 5.2** - Naming convention is consistent across all star levels', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('void_execute', 'flame_combo', 'mosquito_drain'),
          fc.constantFrom(2, 3),
          (baseSkillId, star) => {
            const result = getEffectiveSkillId(baseSkillId, 'ASSASSIN', star, mockSkillLibrary);
            const expectedPattern = `${baseSkillId}_v2`;
            expect(result).toBe(expectedPattern);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Skill Upgrade Validity', () => {
    it('**Validates: Requirements 12.3, 5.3** - Returned skill ID always exists in SKILL_LIBRARY', () => {
      fc.assert(
        fc.property(
          skillIdGen,
          classTypeGen,
          starLevelGen,
          (baseSkillId, classType, star) => {
            const result = getEffectiveSkillId(baseSkillId, classType, star, mockSkillLibrary);
            
            // The returned skill ID must exist in the library
            // Either it's the base skill or the upgraded variant
            expect(mockSkillLibrary[result]).toBeDefined();
          }
        ),
        { numRuns: 200 }
      );
    });

    it('**Validates: Requirements 12.3** - Function never returns non-existent skill IDs', () => {
      fc.assert(
        fc.property(
          skillIdGen,
          classTypeGen,
          starLevelGen,
          (baseSkillId, classType, star) => {
            const result = getEffectiveSkillId(baseSkillId, classType, star, mockSkillLibrary);
            
            // Verify the result is either the base skill or a valid upgrade
            const isBaseSkill = result === baseSkillId;
            const isValidUpgrade = result === `${baseSkillId}_v2` && mockSkillLibrary[result] !== undefined;
            
            // At least one must be true
            expect(isBaseSkill || isValidUpgrade).toBe(true);
            
            // And the returned skill must exist in the library
            expect(mockSkillLibrary[result]).toBeDefined();
          }
        ),
        { numRuns: 200 }
      );
    });

    it('**Validates: Requirements 12.1, 12.2** - Graceful fallback when upgraded skill does not exist', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('blood_bite', 'mantis_slice', 'carrion_feast'),
          fc.constantFrom(2, 3),
          (baseSkillId, star) => {
            const upgradedSkillId = `${baseSkillId}_v2`;
            
            // Verify the upgrade doesn't exist
            expect(mockSkillLibrary[upgradedSkillId]).toBeUndefined();
            
            // Function should return base skill
            const result = getEffectiveSkillId(baseSkillId, 'ASSASSIN', star, mockSkillLibrary);
            expect(result).toBe(baseSkillId);
            
            // And the base skill should exist
            expect(mockSkillLibrary[result]).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Validates: Requirements 12.3** - Empty or invalid skill library handled gracefully', () => {
      fc.assert(
        fc.property(
          skillIdGen,
          classTypeGen,
          starLevelGen,
          fc.constantFrom({}, null, undefined),
          (baseSkillId, classType, star, invalidLibrary) => {
            const result = getEffectiveSkillId(baseSkillId, classType, star, invalidLibrary);
            
            // Should always return base skill when library is invalid
            expect(result).toBe(baseSkillId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles empty base skill ID', () => {
      fc.assert(
        fc.property(
          classTypeGen,
          starLevelGen,
          (classType, star) => {
            const result = getEffectiveSkillId('', classType, star, mockSkillLibrary);
            expect(result).toBe('');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('handles star level boundaries (1, 2, 3)', () => {
      const boundaryStars = [1, 2, 3];
      
      boundaryStars.forEach(star => {
        const result = getEffectiveSkillId('void_execute', 'ASSASSIN', star, mockSkillLibrary);
        
        if (star >= 2) {
          expect(result).toBe('void_execute_v2');
        } else {
          expect(result).toBe('void_execute');
        }
      });
    });

    it('handles all class types consistently', () => {
      const allClasses = ['ASSASSIN', 'MAGE', 'FIGHTER', 'ARCHER', 'TANKER', 'SUPPORT'];
      
      allClasses.forEach(classType => {
        const result = getEffectiveSkillId('void_execute', classType, 3, mockSkillLibrary);
        
        if (classType === 'ASSASSIN') {
          expect(result).toBe('void_execute_v2');
        } else {
          expect(result).toBe('void_execute');
        }
      });
    });
  });
});
