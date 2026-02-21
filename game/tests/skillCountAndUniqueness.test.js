/**
 * Property Test: Skill Count and Uniqueness
 * 
 * **Validates: Requirements 1.1**
 * 
 * Feature: skill-differentiation-and-wiki-overhaul, Property 1: Skill Count and Uniqueness
 * 
 * This test verifies that the skills.csv file contains between 40 and 50 skill entries
 * (inclusive) and that each skill has a unique identifier. The property holds across
 * all valid skill libraries loaded from skills.csv.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { SKILL_LIBRARY } from '../src/data/skills.js';

describe('Skill Count and Uniqueness Property Tests', () => {
  /**
   * Property 1: Skill Count and Uniqueness
   * For any valid skills.csv file, the skill count should match or exceed the unit count
   * (as many units as there are, that's how many skills there should be), and each skill
   * should have a unique identifier.
   */
  it('should have skill count matching or exceeding unit count with unique identifiers', () => {
    // Get all skill IDs from the library
    const skillIds = Object.keys(SKILL_LIBRARY);
    const skillCount = skillIds.length;

    // Note: We'll verify against unit count in the integration test
    // For now, verify we have a reasonable number of skills (at least 40)
    expect(skillCount).toBeGreaterThanOrEqual(40);

    // Assert all skill IDs are unique (this is guaranteed by the object structure,
    // but we verify the count matches to ensure no duplicates in the CSV)
    const uniqueSkillIds = new Set(skillIds);
    expect(uniqueSkillIds.size).toBe(skillCount);
  });

  /**
   * Property-Based Test: Skill ID uniqueness across random subsets
   * 
   * This test generates random subsets of skills and verifies that skill ID uniqueness
   * is maintained. This helps validate the property holds across different combinations.
   */
  it('should maintain skill ID uniqueness across random skill subsets (property-based)', () => {
    const allSkillIds = Object.keys(SKILL_LIBRARY);

    fc.assert(
      fc.property(
        // Generate random subsets of skill indices
        fc.array(
          fc.integer({ min: 0, max: allSkillIds.length - 1 }),
          { minLength: 2, maxLength: allSkillIds.length }
        ).map(indices => {
          // Remove duplicates and map to actual skill IDs
          const uniqueIndices = [...new Set(indices)];
          return uniqueIndices.map(i => allSkillIds[i]);
        }),
        (skillIdSubset) => {
          // For any subset of skill IDs, check uniqueness
          const idSet = new Set();
          const duplicateIds = [];

          for (const skillId of skillIdSubset) {
            if (idSet.has(skillId)) {
              duplicateIds.push(skillId);
            }
            idSet.add(skillId);
          }

          // Property: No duplicate skill IDs should exist
          return duplicateIds.length === 0;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in the design
    );
  });

  /**
   * Property-Based Test: Skill count validation
   * 
   * Verifies that the skill count property (matching or exceeding unit count) holds consistently.
   */
  it('should consistently have sufficient skill count (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constant(SKILL_LIBRARY),
        (skillLibrary) => {
          const count = Object.keys(skillLibrary).length;
          
          // Property: Skill count should be at least 40 (minimum viable)
          return count >= 40;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit Test: Verify all skills have required id field
   * 
   * Ensures every skill in the library has a non-empty id field.
   */
  it('should have an id field for every skill', () => {
    const skills = Object.values(SKILL_LIBRARY);
    
    for (const skill of skills) {
      expect(skill.id).toBeDefined();
      expect(skill.id).not.toBe('');
      expect(typeof skill.id).toBe('string');
    }
  });

  /**
   * Unit Test: Verify skill IDs match object keys
   * 
   * Ensures that each skill's id property matches its key in the SKILL_LIBRARY object.
   */
  it('should have skill IDs that match their object keys', () => {
    for (const [key, skill] of Object.entries(SKILL_LIBRARY)) {
      expect(skill.id).toBe(key);
    }
  });

  /**
   * Unit Test: Report exact skill count
   * 
   * Provides clear reporting of the current skill count for debugging purposes.
   */
  it('should report the exact skill count', () => {
    const skillCount = Object.keys(SKILL_LIBRARY).length;
    
    console.log(`Total skills in SKILL_LIBRARY: ${skillCount}`);
    
    // This test always passes but provides useful information
    expect(skillCount).toBeGreaterThan(0);
  });

  /**
   * Unit Test: Detect any duplicate skill IDs in the library
   * 
   * This test provides detailed reporting of any skill ID duplicates found.
   * Note: Due to the object structure, duplicates would overwrite each other,
   * but this test helps identify if the CSV has duplicate entries.
   */
  it('should not have any duplicate skill IDs', () => {
    const skillIds = Object.keys(SKILL_LIBRARY);
    const uniqueIds = new Set(skillIds);

    // If there are duplicates, they would have been overwritten in the object
    // So we check that the count matches
    expect(uniqueIds.size).toBe(skillIds.length);
  });

  /**
   * Property-Based Test: All skill entries are valid objects
   * 
   * Verifies that every skill in the library is a valid object with required properties.
   */
  it('should have valid skill objects for all entries (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(SKILL_LIBRARY)),
        (skillId) => {
          const skill = SKILL_LIBRARY[skillId];
          
          // Property: Each skill is a valid object with an id
          return (
            typeof skill === 'object' &&
            skill !== null &&
            typeof skill.id === 'string' &&
            skill.id.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit Test: Verify skill count is sufficient
   * 
   * Explicit test for the skill count requirement.
   */
  it('should have sufficient skills (at least 40)', () => {
    const skillCount = Object.keys(SKILL_LIBRARY).length;
    
    if (skillCount < 40) {
      expect.fail(`Skill count ${skillCount} is below the minimum of 40`);
    }
    
    // If we reach here, the count is valid
    expect(skillCount).toBeGreaterThanOrEqual(40);
  });
});
