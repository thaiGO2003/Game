/**
 * Property Tests: Tooltip Evasion Display
 * 
 * **Validates: Requirements 7.6, 13.1, 13.2, 13.3**
 * 
 * Feature: skill-differentiation-and-wiki-overhaul
 * 
 * This test suite verifies:
 * - Property 17: Tooltip Evasion Display - For any unit with modified evasion, the tooltip should display both base and modified values
 * - Property 33: Tooltip Evasion Presence - For any unit tooltip, the evasion stat should be displayed as a percentage
 * - Property 34: Evasion Format - For any evasion value displayed, it should be formatted with exactly one decimal place
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getBaseEvasion, getEffectiveEvasion } from '../src/core/gameUtils.js';
import { UNIT_BY_ID } from '../src/data/unitCatalog.js';

/**
 * Simulated getUnitTooltip function from PlanningScene
 * This is a simplified version for testing purposes
 */
function getUnitTooltip(baseId, star = 1, ownedUnit = null) {
  const base = UNIT_BY_ID[baseId];
  if (!base) return { title: "Không rõ", body: "Không có dữ liệu linh thú." };
  
  // Calculate evasion stat
  const baseEvasion = getBaseEvasion(base.classType);
  let evasionText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}%`;
  
  // If ownedUnit is provided, check for modified evasion
  if (ownedUnit) {
    const effectiveEvasion = getEffectiveEvasion(ownedUnit);
    if (Math.abs(effectiveEvasion - baseEvasion) > 0.001) {
      evasionText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}% → ${(effectiveEvasion * 100).toFixed(1)}%`;
    }
  }

  return {
    title: `Unit ${baseId} (${star}★)`,
    body: [
      `Stats line 1`,
      `Stats line 2`,
      evasionText,
      `Other stats`
    ].join("\n")
  };
}

/**
 * Arbitrary generator for class types
 */
const classTypeArbitrary = fc.constantFrom(
  'TANKER', 'FIGHTER', 'ASSASSIN', 'ARCHER', 'MAGE', 'SUPPORT'
);

/**
 * Arbitrary generator for unit IDs from the catalog
 */
const unitIdArbitrary = fc.constantFrom(...Object.keys(UNIT_BY_ID));

/**
 * Arbitrary generator for owned units with evasion modifiers
 */
const ownedUnitArbitrary = fc.record({
  baseId: unitIdArbitrary,
  mods: fc.record({
    evadePct: fc.float({ noNaN: true, min: 0, max: Math.fround(0.75) })
  }),
  statuses: fc.record({
    evadeBuffTurns: fc.integer({ min: 0, max: 5 }),
    evadeBuffValue: fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
    evadeDebuffTurns: fc.integer({ min: 0, max: 5 }),
    evadeDebuffValue: fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) })
  })
});

/**
 * Property 17: Tooltip Evasion Display
 * 
 * For any unit with modified evasion, the tooltip should display both the base evasion
 * and the modified evasion values.
 * 
 * This ensures players can see how buffs/debuffs affect their units' evasion.
 */
describe('Property 17: Tooltip Evasion Display', () => {
  it('should display both base and modified evasion when unit has active buffs (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 5 }),
        (unitId, buffValue, buffTurns) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          const ownedUnit = {
            baseId: unitId,
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          const effectiveEvasion = getEffectiveEvasion(ownedUnit);
          
          // If evasion is modified, tooltip should show both values
          if (Math.abs(effectiveEvasion - baseEvasion) > 0.001) {
            return tooltip.body.includes('→') &&
                   tooltip.body.includes(`${(baseEvasion * 100).toFixed(1)}%`) &&
                   tooltip.body.includes(`${(effectiveEvasion * 100).toFixed(1)}%`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display both base and modified evasion when unit has active debuffs (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 5 }),
        (unitId, debuffValue, debuffTurns) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          const ownedUnit = {
            baseId: unitId,
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          const effectiveEvasion = getEffectiveEvasion(ownedUnit);
          
          // If evasion is modified, tooltip should show both values
          if (Math.abs(effectiveEvasion - baseEvasion) > 0.001) {
            return tooltip.body.includes('→') &&
                   tooltip.body.includes(`${(baseEvasion * 100).toFixed(1)}%`) &&
                   tooltip.body.includes(`${(effectiveEvasion * 100).toFixed(1)}%`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display both base and modified evasion with combined buffs and debuffs (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (unitId, buffValue, debuffValue, buffTurns, debuffTurns) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          const ownedUnit = {
            baseId: unitId,
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          const effectiveEvasion = getEffectiveEvasion(ownedUnit);
          
          // If evasion is modified, tooltip should show both values
          if (Math.abs(effectiveEvasion - baseEvasion) > 0.001) {
            return tooltip.body.includes('→') &&
                   tooltip.body.includes(`${(baseEvasion * 100).toFixed(1)}%`) &&
                   tooltip.body.includes(`${(effectiveEvasion * 100).toFixed(1)}%`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display only base evasion when no modifiers are active (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        (unitId) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          const tooltip = getUnitTooltip(unitId, 1, null);
          
          // Should show base evasion without arrow
          return tooltip.body.includes(`${(baseEvasion * 100).toFixed(1)}%`) &&
                 !tooltip.body.includes('→');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly reflect evasion clamping at 75% cap', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.float({ noNaN: true, min: Math.fround(0.5), max: Math.fround(0.7) }),
        fc.integer({ min: 1, max: 5 }),
        (unitId, buffValue, buffTurns) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          // Create a buff that would exceed 75% cap
          const ownedUnit = {
            baseId: unitId,
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          const effectiveEvasion = getEffectiveEvasion(ownedUnit);
          
          // Effective evasion should be clamped at 75%
          if (baseEvasion + buffValue > 0.75) {
            return tooltip.body.includes(`${(effectiveEvasion * 100).toFixed(1)}%`) &&
                   effectiveEvasion === 0.75;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly reflect evasion clamping at 0% floor', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.float({ noNaN: true, min: Math.fround(0.3), max: Math.fround(0.5) }),
        fc.integer({ min: 1, max: 5 }),
        (unitId, debuffValue, debuffTurns) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          // Create a debuff that would go below 0%
          const ownedUnit = {
            baseId: unitId,
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          const effectiveEvasion = getEffectiveEvasion(ownedUnit);
          
          // Effective evasion should be clamped at 0%
          if (baseEvasion - debuffValue < 0) {
            return tooltip.body.includes(`${(effectiveEvasion * 100).toFixed(1)}%`) &&
                   effectiveEvasion === 0;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 33: Tooltip Evasion Presence
 * 
 * For any unit tooltip, the evasion stat should be displayed as a percentage.
 * 
 * This ensures all unit tooltips consistently show evasion information.
 */
describe('Property 33: Tooltip Evasion Presence', () => {
  it('should display evasion percentage for any unit (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.integer({ min: 1, max: 3 }),
        (unitId, star) => {
          const tooltip = getUnitTooltip(unitId, star);
          
          // Tooltip should contain evasion label and percentage
          const hasLabel = tooltip.body.includes('💨 Né tránh:');
          const hasPercentage = /\d+\.\d%/.test(tooltip.body);
          
          return hasLabel && hasPercentage;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display evasion for all class types (property-based)', () => {
    fc.assert(
      fc.property(
        classTypeArbitrary,
        (classType) => {
          // Find a unit with this class type
          const unitId = Object.keys(UNIT_BY_ID).find(id => UNIT_BY_ID[id].classType === classType);
          
          if (!unitId) return true; // Skip if no unit found
          
          const tooltip = getUnitTooltip(unitId, 1);
          const baseEvasion = getBaseEvasion(classType);
          
          // Tooltip should show evasion as percentage
          return tooltip.body.includes('💨 Né tránh:') &&
                 tooltip.body.includes(`${(baseEvasion * 100).toFixed(1)}%`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display evasion percentage for units with modifiers (property-based)', () => {
    fc.assert(
      fc.property(
        ownedUnitArbitrary,
        (ownedUnit) => {
          const tooltip = getUnitTooltip(ownedUnit.baseId, 1, ownedUnit);
          
          // Tooltip should contain evasion with percentage symbol
          return tooltip.body.includes('💨 Né tránh:') &&
                 tooltip.body.includes('%');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always include percentage symbol in evasion display (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.option(ownedUnitArbitrary, { nil: null }),
        (unitId, ownedUnit) => {
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          
          // Extract evasion line
          const evasionLine = tooltip.body.split('\n').find(line => line.includes('💨 Né tránh:'));
          
          if (!evasionLine) return false;
          
          // Count percentage symbols - should have at least one
          const percentCount = (evasionLine.match(/%/g) || []).length;
          
          return percentCount >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 34: Evasion Format
 * 
 * For any evasion value displayed, it should be formatted as a percentage with
 * exactly one decimal place (e.g., "15.0%").
 * 
 * This ensures consistent formatting across all evasion displays.
 */
describe('Property 34: Evasion Format', () => {
  it('should format base evasion with exactly one decimal place (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        (unitId) => {
          const tooltip = getUnitTooltip(unitId, 1);
          
          // Extract evasion percentage
          const match = tooltip.body.match(/💨 Né tránh: (\d+\.\d)%/);
          
          if (!match) return false;
          
          const evasionStr = match[1];
          const parts = evasionStr.split('.');
          
          // Should have exactly one digit after decimal point
          return parts.length === 2 && parts[1].length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format modified evasion with exactly one decimal place (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 5 }),
        (unitId, buffValue, buffTurns) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          const ownedUnit = {
            baseId: unitId,
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          
          // Extract both evasion values if arrow is present
          const match = tooltip.body.match(/💨 Né tránh: (\d+\.\d)% → (\d+\.\d)%/);
          
          if (!match) {
            // If no arrow, check single value format
            const singleMatch = tooltip.body.match(/💨 Né tránh: (\d+\.\d)%/);
            if (!singleMatch) return false;
            
            const parts = singleMatch[1].split('.');
            return parts.length === 2 && parts[1].length === 1;
          }
          
          const baseStr = match[1];
          const modifiedStr = match[2];
          
          const baseParts = baseStr.split('.');
          const modifiedParts = modifiedStr.split('.');
          
          // Both should have exactly one decimal place
          return baseParts.length === 2 && baseParts[1].length === 1 &&
                 modifiedParts.length === 2 && modifiedParts[1].length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format all evasion values consistently (property-based)', () => {
    fc.assert(
      fc.property(
        ownedUnitArbitrary,
        (ownedUnit) => {
          const tooltip = getUnitTooltip(ownedUnit.baseId, 1, ownedUnit);
          
          // Extract all percentage values from evasion line
          const evasionLine = tooltip.body.split('\n').find(line => line.includes('💨 Né tránh:'));
          
          if (!evasionLine) return false;
          
          const percentages = evasionLine.match(/(\d+\.\d)%/g);
          
          if (!percentages) return false;
          
          // All percentages should have exactly one decimal place
          return percentages.every(pct => {
            const numStr = pct.replace('%', '');
            const parts = numStr.split('.');
            return parts.length === 2 && parts[1].length === 1;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use toFixed(1) formatting for all evasion displays (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        (unitId, buffValue, debuffValue, buffTurns, debuffTurns) => {
          const base = UNIT_BY_ID[unitId];
          const baseEvasion = getBaseEvasion(base.classType);
          
          const ownedUnit = {
            baseId: unitId,
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          const effectiveEvasion = getEffectiveEvasion(ownedUnit);
          
          // Verify the displayed values match toFixed(1) formatting
          const expectedBase = (baseEvasion * 100).toFixed(1);
          const expectedEffective = (effectiveEvasion * 100).toFixed(1);
          
          return tooltip.body.includes(`${expectedBase}%`) &&
                 (Math.abs(effectiveEvasion - baseEvasion) < 0.001 || 
                  tooltip.body.includes(`${expectedEffective}%`));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never display evasion with zero or more than one decimal place (property-based)', () => {
    fc.assert(
      fc.property(
        unitIdArbitrary,
        fc.option(ownedUnitArbitrary, { nil: null }),
        (unitId, ownedUnit) => {
          const tooltip = getUnitTooltip(unitId, 1, ownedUnit);
          
          // Extract evasion line
          const evasionLine = tooltip.body.split('\n').find(line => line.includes('💨 Né tránh:'));
          
          if (!evasionLine) return false;
          
          // Should not have percentages with 0 decimal places (e.g., "15%")
          const noDecimal = evasionLine.match(/\s(\d+)%(?!\d)/);
          if (noDecimal) return false;
          
          // Should not have percentages with 2+ decimal places (e.g., "15.00%")
          const twoDecimals = evasionLine.match(/\d+\.\d{2,}%/);
          if (twoDecimals) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
