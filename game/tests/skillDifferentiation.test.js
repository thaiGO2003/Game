/**
 * Property Tests: Skill Differentiation
 * 
 * **Validates: Requirements 1.2, 1.4, 1.5**
 * 
 * Feature: skill-differentiation-and-wiki-overhaul
 * 
 * This test suite verifies:
 * - Property 2: Tier-Archetype Skill Differentiation - Units with same tier and classType have different skills
 * - Property 3: Valid Skill References - All unit skillId values reference existing skills
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { SKILL_LIBRARY } from '../src/data/skills.js';
import unitsCsv from '../data/units.csv?raw';

/**
 * Parse units.csv to get unit data
 */
function parseUnitsCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const units = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = '';
    let inQuote = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuote && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const unit = {};
    headers.forEach((header, index) => {
      let value = values[index];
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      unit[header] = value;
    });

    if (unit.id) {
      units.push(unit);
    }
  }

  return units;
}

const ALL_UNITS = parseUnitsCsv(unitsCsv);

describe('Skill Differentiation Property Tests', () => {
  /**
   * Property 2: Tier-Archetype Skill Differentiation
   * 
   * For any two units that share the same tier and classType, their skillId values must be different.
   * 
   * This ensures each unit has a unique skill variant within its tier-archetype group,
   * creating meaningful differentiation between similar units.
   */
  it('should have different skills for units with same tier and classType', () => {
    // Group units by tier-classType combination
    const groups = new Map();
    
    for (const unit of ALL_UNITS) {
      const key = `${unit.tier}-${unit.classType}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(unit);
    }

    // Check each group for skill differentiation
    const violations = [];
    
    for (const [key, unitsInGroup] of groups.entries()) {
      if (unitsInGroup.length <= 1) continue; // Skip groups with only one unit
      
      // Check all pairs in the group
      for (let i = 0; i < unitsInGroup.length; i++) {
        for (let j = i + 1; j < unitsInGroup.length; j++) {
          const unit1 = unitsInGroup[i];
          const unit2 = unitsInGroup[j];
          
          if (unit1.skillId === unit2.skillId) {
            violations.push({
              tierClassType: key,
              unit1: { id: unit1.id, name: unit1.name, skillId: unit1.skillId },
              unit2: { id: unit2.id, name: unit2.name, skillId: unit2.skillId }
            });
          }
        }
      }
    }

    // Report violations if any
    if (violations.length > 0) {
      const violationReport = violations.map(v => 
        `  - ${v.tierClassType}: ${v.unit1.id} (${v.unit1.name}) and ${v.unit2.id} (${v.unit2.name}) both use skill "${v.unit1.skillId}"`
      ).join('\n');
      
      expect.fail(
        `Found ${violations.length} skill differentiation violation(s):\n${violationReport}\n\n` +
        `Property 2 requires units with the same tier and classType to have different skillId values.`
      );
    }

    // If no violations, test passes
    expect(violations).toHaveLength(0);
  });

  /**
   * Property-Based Test: Tier-Archetype Skill Differentiation (random sampling)
   * 
   * Verifies the differentiation property across random pairs of units.
   */
  it('should maintain skill differentiation across random unit pairs (property-based)', () => {
    fc.assert(
      fc.property(
        // Generate two random unit indices
        fc.integer({ min: 0, max: ALL_UNITS.length - 1 }),
        fc.integer({ min: 0, max: ALL_UNITS.length - 1 }),
        (index1, index2) => {
          if (index1 === index2) return true; // Same unit, skip
          
          const unit1 = ALL_UNITS[index1];
          const unit2 = ALL_UNITS[index2];
          
          // If units have same tier and classType, they must have different skills
          if (unit1.tier === unit2.tier && unit1.classType === unit2.classType) {
            return unit1.skillId !== unit2.skillId;
          }
          
          // If tier or classType differ, no constraint
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Valid Skill References
   * 
   * For any unit in units.csv, the skillId field must reference a skill that exists
   * in the SKILL_LIBRARY.
   * 
   * This ensures data integrity and prevents runtime errors when resolving unit skills.
   */
  it('should have valid skill references for all units', () => {
    const invalidReferences = [];
    
    for (const unit of ALL_UNITS) {
      if (!unit.skillId) {
        invalidReferences.push({
          unitId: unit.id,
          unitName: unit.name,
          issue: 'Missing skillId field'
        });
        continue;
      }
      
      if (!SKILL_LIBRARY[unit.skillId]) {
        invalidReferences.push({
          unitId: unit.id,
          unitName: unit.name,
          skillId: unit.skillId,
          issue: 'Skill not found in SKILL_LIBRARY'
        });
      }
    }

    // Report invalid references if any
    if (invalidReferences.length > 0) {
      const referenceReport = invalidReferences.map(ref => 
        `  - ${ref.unitId} (${ref.unitName}): ${ref.issue}${ref.skillId ? ` - skillId: "${ref.skillId}"` : ''}`
      ).join('\n');
      
      expect.fail(
        `Found ${invalidReferences.length} invalid skill reference(s):\n${referenceReport}\n\n` +
        `Property 3 requires all units to reference existing skills in SKILL_LIBRARY.`
      );
    }

    // If no invalid references, test passes
    expect(invalidReferences).toHaveLength(0);
  });

  /**
   * Property-Based Test: Valid Skill References (random sampling)
   * 
   * Verifies that skill references are valid across random unit selections.
   */
  it('should have valid skill references for random units (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: ALL_UNITS.length - 1 }),
        (unitIndex) => {
          const unit = ALL_UNITS[unitIndex];
          
          // Property: Unit's skillId must exist in SKILL_LIBRARY
          return (
            unit.skillId !== undefined &&
            unit.skillId !== null &&
            unit.skillId !== '' &&
            SKILL_LIBRARY[unit.skillId] !== undefined
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit Test: Report skill usage statistics
   * 
   * Provides insight into how skills are distributed across units.
   */
  it('should report skill usage statistics', () => {
    const skillUsage = new Map();
    
    for (const unit of ALL_UNITS) {
      const skillId = unit.skillId;
      if (!skillUsage.has(skillId)) {
        skillUsage.set(skillId, []);
      }
      skillUsage.get(skillId).push(unit.id);
    }

    const totalSkills = Object.keys(SKILL_LIBRARY).length;
    const usedSkills = skillUsage.size;
    const unusedSkills = totalSkills - usedSkills;
    
    console.log(`\nSkill Usage Statistics:`);
    console.log(`  Total skills in library: ${totalSkills}`);
    console.log(`  Skills used by units: ${usedSkills}`);
    console.log(`  Unused skills: ${unusedSkills}`);
    console.log(`  Total units: ${ALL_UNITS.length}`);
    
    // Find skills used by multiple units
    const sharedSkills = Array.from(skillUsage.entries())
      .filter(([_, units]) => units.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
    
    if (sharedSkills.length > 0) {
      console.log(`\n  Skills shared by multiple units: ${sharedSkills.length}`);
      console.log(`  Top shared skills:`);
      sharedSkills.slice(0, 5).forEach(([skillId, units]) => {
        console.log(`    - ${skillId}: used by ${units.length} units`);
      });
    }

    // This test always passes but provides useful information
    expect(usedSkills).toBeGreaterThan(0);
  });

  /**
   * Unit Test: Verify all units have skillId field
   * 
   * Ensures every unit has a skillId field defined.
   */
  it('should have skillId field for every unit', () => {
    for (const unit of ALL_UNITS) {
      expect(unit.skillId).toBeDefined();
      expect(unit.skillId).not.toBe('');
      expect(typeof unit.skillId).toBe('string');
    }
  });

  /**
   * Unit Test: Verify skill library completeness
   * 
   * Checks that all referenced skills exist in the library.
   */
  it('should have all referenced skills in SKILL_LIBRARY', () => {
    const referencedSkills = new Set(ALL_UNITS.map(u => u.skillId));
    const missingSkills = [];
    
    for (const skillId of referencedSkills) {
      if (!SKILL_LIBRARY[skillId]) {
        missingSkills.push(skillId);
      }
    }

    if (missingSkills.length > 0) {
      expect.fail(
        `Missing skills in SKILL_LIBRARY: ${missingSkills.join(', ')}\n` +
        `These skills are referenced by units but not defined in skills.csv`
      );
    }

    expect(missingSkills).toHaveLength(0);
  });

  /**
   * Unit Test: Detect tier-classType groups with shared skills
   * 
   * Identifies specific groups where skill differentiation is violated.
   */
  it('should not have shared skills within tier-classType groups', () => {
    const groups = new Map();
    
    for (const unit of ALL_UNITS) {
      const key = `${unit.tier}-${unit.classType}`;
      if (!groups.has(key)) {
        groups.set(key, new Map());
      }
      
      const skillMap = groups.get(key);
      if (!skillMap.has(unit.skillId)) {
        skillMap.set(unit.skillId, []);
      }
      skillMap.get(unit.skillId).push(unit);
    }

    const problemGroups = [];
    
    for (const [key, skillMap] of groups.entries()) {
      for (const [skillId, units] of skillMap.entries()) {
        if (units.length > 1) {
          problemGroups.push({
            tierClassType: key,
            skillId,
            units: units.map(u => ({ id: u.id, name: u.name }))
          });
        }
      }
    }

    if (problemGroups.length > 0) {
      console.log('\nTier-ClassType groups with shared skills:');
      problemGroups.forEach(group => {
        console.log(`  ${group.tierClassType} - skill "${group.skillId}":`);
        group.units.forEach(u => {
          console.log(`    - ${u.id} (${u.name})`);
        });
      });
    }

    expect(problemGroups).toHaveLength(0);
  });

  /**
   * Property-Based Test: Skill library contains all unit skills
   * 
   * Verifies that the skill library is complete for all unit references.
   */
  it('should have complete skill library for all unit references (property-based)', () => {
    const allSkillIds = new Set(ALL_UNITS.map(u => u.skillId));
    
    fc.assert(
      fc.property(
        fc.constantFrom(...Array.from(allSkillIds)),
        (skillId) => {
          // Property: Every skill referenced by units exists in SKILL_LIBRARY
          return SKILL_LIBRARY[skillId] !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });
});
