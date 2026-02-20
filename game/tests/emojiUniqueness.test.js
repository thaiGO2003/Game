/**
 * Property Test: Emoji Uniqueness
 * 
 * **Validates: Requirements 1.1, 12.4**
 * 
 * Feature: post-launch-fixes, Property 1: Emoji Uniqueness
 * 
 * This test verifies that no two units in the unit catalog share the same emoji icon.
 * The property holds across all valid unit catalogs loaded from units.csv.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { UNIT_CATALOG } from '../src/data/unitCatalog.js';

describe('Emoji Uniqueness Property Tests', () => {
  /**
   * Property 1: Emoji Uniqueness
   * For any unit catalog loaded from units.csv, no two units should share the same emoji icon.
   */
  it('should have unique emojis for all units in the catalog', () => {
    // Test the actual unit catalog
    const emojiMap = new Map();
    const duplicates = [];

    for (const unit of UNIT_CATALOG) {
      const emoji = unit.icon;
      
      if (emojiMap.has(emoji)) {
        // Found a duplicate
        const existingUnit = emojiMap.get(emoji);
        duplicates.push({
          emoji,
          units: [existingUnit.name, unit.name],
          ids: [existingUnit.id, unit.id]
        });
      } else {
        emojiMap.set(emoji, unit);
      }
    }

    // Assert no duplicates found
    if (duplicates.length > 0) {
      const errorMessage = duplicates.map(dup => 
        `Emoji ${dup.emoji} is shared by: ${dup.units.join(', ')} (${dup.ids.join(', ')})`
      ).join('\n');
      
      expect.fail(`Found ${duplicates.length} emoji duplicate(s):\n${errorMessage}`);
    }

    expect(duplicates).toHaveLength(0);
  });

  /**
   * Property-Based Test: Emoji Uniqueness across random unit subsets
   * 
   * This test generates random subsets of units and verifies that emoji uniqueness
   * is maintained. This helps catch edge cases and validates the property holds
   * across different combinations of units.
   */
  it('should maintain emoji uniqueness across random unit subsets (property-based)', () => {
    fc.assert(
      fc.property(
        // Generate random subsets of unit indices
        fc.array(
          fc.integer({ min: 0, max: UNIT_CATALOG.length - 1 }),
          { minLength: 2, maxLength: UNIT_CATALOG.length }
        ).map(indices => {
          // Remove duplicates and map to actual units
          const uniqueIndices = [...new Set(indices)];
          return uniqueIndices.map(i => UNIT_CATALOG[i]);
        }),
        (unitSubset) => {
          // For any subset of units, check emoji uniqueness
          const emojiSet = new Set();
          const duplicateEmojis = [];

          for (const unit of unitSubset) {
            if (emojiSet.has(unit.icon)) {
              duplicateEmojis.push(unit.icon);
            }
            emojiSet.add(unit.icon);
          }

          // Property: No duplicate emojis should exist
          return duplicateEmojis.length === 0;
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in the design
    );
  });

  /**
   * Property-Based Test: Emoji uniqueness by role and tier
   * 
   * Verifies that within each role and tier combination, all units have unique emojis.
   * This ensures the 6 roles × 5 tiers × 4 units structure maintains emoji uniqueness.
   */
  it('should have unique emojis within each role-tier combination (property-based)', () => {
    const roles = ['TANKER', 'ASSASSIN', 'ARCHER', 'MAGE', 'SUPPORT', 'FIGHTER'];
    const tiers = [1, 2, 3, 4, 5];

    fc.assert(
      fc.property(
        fc.constantFrom(...roles),
        fc.constantFrom(...tiers),
        (role, tier) => {
          // Filter units by role and tier
          const unitsInGroup = UNIT_CATALOG.filter(
            u => u.classType === role && u.tier === tier
          );

          // Check emoji uniqueness within this group
          const emojiSet = new Set();
          for (const unit of unitsInGroup) {
            if (emojiSet.has(unit.icon)) {
              return false; // Duplicate found
            }
            emojiSet.add(unit.icon);
          }

          return true; // All emojis unique in this group
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-Based Test: Emoji count equals unit count
   * 
   * For any valid unit catalog, the number of unique emojis should equal
   * the total number of units (120 units = 120 unique emojis).
   */
  it('should have exactly as many unique emojis as units (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constant(UNIT_CATALOG),
        (catalog) => {
          const uniqueEmojis = new Set(catalog.map(u => u.icon));
          
          // Property: Number of unique emojis equals number of units
          return uniqueEmojis.size === catalog.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit Test: Verify 120 units total
   * 
   * Ensures the catalog contains exactly 120 units as specified in the requirements.
   */
  it('should have exactly 120 units in the catalog', () => {
    expect(UNIT_CATALOG).toHaveLength(120);
  });

  /**
   * Unit Test: All units have an icon field
   * 
   * Verifies that every unit in the catalog has a non-empty icon field.
   */
  it('should have an icon field for every unit', () => {
    for (const unit of UNIT_CATALOG) {
      expect(unit.icon).toBeDefined();
      expect(unit.icon).not.toBe('');
      expect(typeof unit.icon).toBe('string');
    }
  });

  /**
   * Unit Test: Report all duplicate emojis with details
   * 
   * This test provides detailed reporting of any emoji duplicates found,
   * making it easier to identify and fix issues.
   */
  it('should report all duplicate emojis with unit details', () => {
    const emojiToUnits = new Map();

    // Build a map of emoji -> array of units
    for (const unit of UNIT_CATALOG) {
      const emoji = unit.icon;
      if (!emojiToUnits.has(emoji)) {
        emojiToUnits.set(emoji, []);
      }
      emojiToUnits.get(emoji).push(unit);
    }

    // Find all emojis used by multiple units
    const duplicates = [];
    for (const [emoji, units] of emojiToUnits.entries()) {
      if (units.length > 1) {
        duplicates.push({
          emoji,
          count: units.length,
          units: units.map(u => ({
            id: u.id,
            name: u.name,
            role: u.classType,
            tier: u.tier
          }))
        });
      }
    }

    // If duplicates found, provide detailed report
    if (duplicates.length > 0) {
      const report = duplicates.map(dup => {
        const unitDetails = dup.units.map(u => 
          `  - ${u.name} (${u.id}, ${u.role} T${u.tier})`
        ).join('\n');
        return `Emoji ${dup.emoji} used by ${dup.count} units:\n${unitDetails}`;
      }).join('\n\n');

      expect.fail(`Found ${duplicates.length} duplicate emoji(s):\n\n${report}`);
    }

    expect(duplicates).toHaveLength(0);
  });
});
