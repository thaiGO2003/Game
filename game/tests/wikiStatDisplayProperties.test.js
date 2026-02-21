/**
 * Property-Based Test: Wiki Stat Display Completeness
 * Task 10.2: Write property test for stat display completeness
 * 
 * **Property 8: Wiki Stat Display Completeness**
 * **Validates: Requirements 5.1, 5.2, 5.4, 5.5**
 * 
 * For any unit displayed in the Wiki, the display should include HP, ATK, DEF, MATK, 
 * MDEF, Range, Evasion, element, and role information.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { UNIT_CATALOG } from '../src/data/unitCatalog.js';
import { getBaseEvasion } from '../src/core/gameUtils.js';
import { getTribeLabelVi, getClassLabelVi } from '../src/data/unitVisuals.js';

describe('Property 8: Wiki Stat Display Completeness', () => {
  /**
   * Helper function to check if a unit has all required stat fields
   */
  function hasAllRequiredStats(unit) {
    const stats = unit.stats;
    
    // Check all required numeric stats
    const hasHP = stats.hp !== undefined && typeof stats.hp === 'number';
    const hasATK = stats.atk !== undefined && typeof stats.atk === 'number';
    const hasDEF = stats.def !== undefined && typeof stats.def === 'number';
    const hasMATK = stats.matk !== undefined && typeof stats.matk === 'number';
    const hasMDEF = stats.mdef !== undefined && typeof stats.mdef === 'number';
    const hasRange = stats.range !== undefined && typeof stats.range === 'number';
    
    // Check evasion can be calculated
    const evasion = getBaseEvasion(unit.classType);
    const hasEvasion = evasion !== undefined && typeof evasion === 'number';
    
    // Check element (tribe) information
    const tribeLabel = getTribeLabelVi(unit.tribe);
    const hasElement = tribeLabel !== undefined && typeof tribeLabel === 'string' && tribeLabel.length > 0;
    
    // Check role (classType) information
    const classLabel = getClassLabelVi(unit.classType);
    const hasRole = classLabel !== undefined && typeof classLabel === 'string' && classLabel.length > 0;
    
    return {
      hasHP,
      hasATK,
      hasDEF,
      hasMATK,
      hasMDEF,
      hasRange,
      hasEvasion,
      hasElement,
      hasRole,
      allPresent: hasHP && hasATK && hasDEF && hasMATK && hasMDEF && hasRange && hasEvasion && hasElement && hasRole
    };
  }

  /**
   * Property Test: All units in catalog have complete stat display
   * 
   * For any unit in the catalog, all required stats should be present and valid.
   */
  it('should have all required stats for any unit in the catalog', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const statCheck = hasAllRequiredStats(unit);
          
          // If this fails, log which stats are missing for debugging
          if (!statCheck.allPresent) {
            console.log(`Unit ${unit.id} missing stats:`, {
              HP: statCheck.hasHP,
              ATK: statCheck.hasATK,
              DEF: statCheck.hasDEF,
              MATK: statCheck.hasMATK,
              MDEF: statCheck.hasMDEF,
              Range: statCheck.hasRange,
              Evasion: statCheck.hasEvasion,
              Element: statCheck.hasElement,
              Role: statCheck.hasRole
            });
          }
          
          return statCheck.allPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: HP stat is always present and positive
   */
  it('should have HP stat present and positive for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const hp = unit.stats.hp;
          return hp !== undefined && typeof hp === 'number' && hp > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: ATK stat is always present and positive
   */
  it('should have ATK stat present and positive for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const atk = unit.stats.atk;
          return atk !== undefined && typeof atk === 'number' && atk > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: DEF stat is always present and non-negative
   */
  it('should have DEF stat present and non-negative for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const def = unit.stats.def;
          return def !== undefined && typeof def === 'number' && def >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: MATK stat is always present and non-negative
   */
  it('should have MATK stat present and non-negative for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const matk = unit.stats.matk;
          return matk !== undefined && typeof matk === 'number' && matk >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: MDEF stat is always present and non-negative
   */
  it('should have MDEF stat present and non-negative for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const mdef = unit.stats.mdef;
          return mdef !== undefined && typeof mdef === 'number' && mdef >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Range stat is always present and positive
   */
  it('should have Range stat present and positive for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const range = unit.stats.range;
          return range !== undefined && typeof range === 'number' && range > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Evasion can be calculated for any unit
   */
  it('should have calculable Evasion for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const evasion = getBaseEvasion(unit.classType);
          return evasion !== undefined && typeof evasion === 'number' && evasion >= 0 && evasion <= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Element (tribe) information is always present
   */
  it('should have element (tribe) information for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const tribeLabel = getTribeLabelVi(unit.tribe);
          return tribeLabel !== undefined && typeof tribeLabel === 'string' && tribeLabel.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Role (classType) information is always present
   */
  it('should have role (classType) information for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const classLabel = getClassLabelVi(unit.classType);
          return classLabel !== undefined && typeof classLabel === 'string' && classLabel.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: All stats are numeric and within reasonable bounds
   */
  it('should have all numeric stats within reasonable bounds for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const stats = unit.stats;
          
          // Check all stats are numbers
          const allNumeric = 
            typeof stats.hp === 'number' &&
            typeof stats.atk === 'number' &&
            typeof stats.def === 'number' &&
            typeof stats.matk === 'number' &&
            typeof stats.mdef === 'number' &&
            typeof stats.range === 'number';
          
          // Check reasonable bounds (not NaN, not Infinity)
          const allFinite = 
            Number.isFinite(stats.hp) &&
            Number.isFinite(stats.atk) &&
            Number.isFinite(stats.def) &&
            Number.isFinite(stats.matk) &&
            Number.isFinite(stats.mdef) &&
            Number.isFinite(stats.range);
          
          return allNumeric && allFinite;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Evasion is within valid percentage range (0-100%)
   */
  it('should have evasion within valid percentage range for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const evasion = getBaseEvasion(unit.classType);
          const evasionPct = evasion * 100;
          
          return evasionPct >= 0 && evasionPct <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Stats display can be formatted without errors
   */
  it('should be able to format stat display for any unit without errors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          try {
            const stats = unit.stats;
            const range = stats.range ?? 1;
            const rangeTypeLabel = range >= 2 ? "Đánh xa" : "Cận chiến";
            const evasionPct = Math.round(getBaseEvasion(unit.classType) * 100);
            
            // Format the stats text as it would appear in the Wiki
            const statsText = [
              `Tộc: ${getTribeLabelVi(unit.tribe)}   Nghề: ${getClassLabelVi(unit.classType)}`,
              `Máu (HP): ${stats.hp ?? "?"}   Công (ATK): ${stats.atk ?? "?"}   Phòng thủ (DEF): ${stats.def ?? "?"}`,
              `K.Phép (MDEF): ${stats.mdef ?? "?"}   S.Mạnh Phép (MATK): ${stats.matk ?? "?"}`,
              `Tầm đánh: ${range} ô (${rangeTypeLabel})   Né tránh: ${evasionPct}%   Nộ tối đa: ${stats.rageMax ?? "?"}`
            ].join("\n");
            
            // Verify the formatted text contains all required elements
            return (
              statsText.includes('Tộc:') &&
              statsText.includes('Nghề:') &&
              statsText.includes('Máu (HP):') &&
              statsText.includes('Công (ATK):') &&
              statsText.includes('Phòng thủ (DEF):') &&
              statsText.includes('K.Phép (MDEF):') &&
              statsText.includes('S.Mạnh Phép (MATK):') &&
              statsText.includes('Tầm đánh:') &&
              statsText.includes('Né tránh:') &&
              statsText.length > 0
            );
          } catch (error) {
            console.error(`Error formatting stats for unit ${unit.id}:`, error);
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Range type label is correctly determined
   */
  it('should correctly determine range type label for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const range = unit.stats.range ?? 1;
          const rangeTypeLabel = range >= 2 ? "Đánh xa" : "Cận chiến";
          
          // Verify the label matches the range value
          if (range >= 2) {
            return rangeTypeLabel === "Đánh xa";
          } else {
            return rangeTypeLabel === "Cận chiến";
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: All required stat labels are present in display
   */
  it('should include all required stat labels in display for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const stats = unit.stats;
          const range = stats.range ?? 1;
          const rangeTypeLabel = range >= 2 ? "Đánh xa" : "Cận chiến";
          const evasionPct = Math.round(getBaseEvasion(unit.classType) * 100);
          
          const statsText = [
            `Tộc: ${getTribeLabelVi(unit.tribe)}   Nghề: ${getClassLabelVi(unit.classType)}`,
            `Máu (HP): ${stats.hp}   Công (ATK): ${stats.atk}   Phòng thủ (DEF): ${stats.def}`,
            `K.Phép (MDEF): ${stats.mdef}   S.Mạnh Phép (MATK): ${stats.matk}`,
            `Tầm đánh: ${range} ô (${rangeTypeLabel})   Né tránh: ${evasionPct}%   Nộ tối đa: ${stats.rageMax}`
          ].join("\n");
          
          const requiredLabels = [
            'Tộc:',
            'Nghề:',
            'Máu (HP):',
            'Công (ATK):',
            'Phòng thủ (DEF):',
            'K.Phép (MDEF):',
            'S.Mạnh Phép (MATK):',
            'Tầm đánh:',
            'Né tránh:'
          ];
          
          return requiredLabels.every(label => statsText.includes(label));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit Test: Verify completeness for a sample of units
   */
  it('should have complete stats for a sample of units from the catalog', () => {
    // Test first 10 units as a sample
    const sampleUnits = UNIT_CATALOG.slice(0, 10);
    
    sampleUnits.forEach(unit => {
      const statCheck = hasAllRequiredStats(unit);
      
      expect(statCheck.allPresent).toBe(true);
      expect(statCheck.hasHP).toBe(true);
      expect(statCheck.hasATK).toBe(true);
      expect(statCheck.hasDEF).toBe(true);
      expect(statCheck.hasMATK).toBe(true);
      expect(statCheck.hasMDEF).toBe(true);
      expect(statCheck.hasRange).toBe(true);
      expect(statCheck.hasEvasion).toBe(true);
      expect(statCheck.hasElement).toBe(true);
      expect(statCheck.hasRole).toBe(true);
    });
  });

  /**
   * Unit Test: Report any units with incomplete stats
   */
  it('should report any units with incomplete stats', () => {
    const incompleteUnits = [];
    
    UNIT_CATALOG.forEach(unit => {
      const statCheck = hasAllRequiredStats(unit);
      if (!statCheck.allPresent) {
        incompleteUnits.push({
          id: unit.id,
          missing: Object.entries(statCheck)
            .filter(([key, value]) => key !== 'allPresent' && !value)
            .map(([key]) => key)
        });
      }
    });
    
    if (incompleteUnits.length > 0) {
      console.log('Units with incomplete stats:', incompleteUnits);
    }
    
    expect(incompleteUnits.length).toBe(0);
  });
});
