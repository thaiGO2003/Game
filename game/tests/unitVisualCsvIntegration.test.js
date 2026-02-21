/**
 * Property-Based Test: Unit Visual CSV Integration
 * Task 1.2: Write property test for unit visual CSV integration
 * 
 * **Property 1: Unit Visual CSV Integration**
 * **Validates: Requirements 1.5, 1.6, 1.7**
 * 
 * For any unit ID in the catalog, calling getUnitVisual should return visual data 
 * that matches the unit's icon and name from UNIT_BY_ID (units.csv), or fallback 
 * to "🐾" if icon is missing.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { UNIT_CATALOG, UNIT_BY_ID } from '../src/data/unitCatalog.js';
import { getUnitVisual } from '../src/data/unitVisuals.js';

describe('Property 1: Unit Visual CSV Integration', () => {
  /**
   * Property Test: Unit visual icon matches CSV data or fallback
   * 
   * For any unit in the catalog, getUnitVisual should return:
   * - The icon from CSV if present
   * - The fallback "🐾" if icon is missing
   */
  it('should return icon from CSV or fallback to 🐾 for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const visual = getUnitVisual(unit.id);
          const expectedIcon = unit.icon || "🐾";
          
          // Visual should have an icon
          expect(visual).toHaveProperty('icon');
          expect(typeof visual.icon).toBe('string');
          expect(visual.icon.length).toBeGreaterThan(0);
          
          // Icon should match CSV or be fallback
          return visual.icon === expectedIcon;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Unit visual name is present and valid
   * 
   * For any unit in the catalog, getUnitVisual should return a valid name
   * (either from CSV or generated flavor name).
   */
  it('should return valid name for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const visual = getUnitVisual(unit.id);
          
          // Visual should have a name
          expect(visual).toHaveProperty('nameVi');
          expect(typeof visual.nameVi).toBe('string');
          expect(visual.nameVi.length).toBeGreaterThan(0);
          
          // Name should not be empty or just whitespace
          return visual.nameVi.trim().length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Missing unit returns fallback visual
   * 
   * For any non-existent unit ID, getUnitVisual should return the fallback
   * visual with "Linh thú" name and "🐾" icon.
   */
  it('should return fallback visual for non-existent unit IDs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(id => !UNIT_BY_ID[id] && id.length > 0),
        (nonExistentId) => {
          const visual = getUnitVisual(nonExistentId);
          
          // Should return fallback values
          expect(visual.nameVi).toBe("Linh thú");
          expect(visual.icon).toBe("🐾");
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property Test: Visual data structure is consistent
   * 
   * For any unit, getUnitVisual should always return an object with
   * exactly the expected properties: nameVi and icon.
   */
  it('should return consistent structure for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const visual = getUnitVisual(unit.id);
          
          // Check structure
          const keys = Object.keys(visual);
          expect(keys).toContain('nameVi');
          expect(keys).toContain('icon');
          
          // Should have exactly these two properties
          return keys.length === 2 && 
                 typeof visual.nameVi === 'string' && 
                 typeof visual.icon === 'string';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Icon is always a valid emoji or fallback
   * 
   * For any unit, the icon should be either a valid emoji character
   * or the fallback "🐾".
   */
  it('should return valid emoji icon for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const visual = getUnitVisual(unit.id);
          
          // Icon should be a string with at least one character
          expect(typeof visual.icon).toBe('string');
          expect(visual.icon.length).toBeGreaterThan(0);
          
          // Icon should be either from CSV or fallback
          const expectedIcon = unit.icon || "🐾";
          return visual.icon === expectedIcon;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: CSV icon takes precedence over fallback
   * 
   * For any unit with an icon in CSV, getUnitVisual should use that icon
   * and NOT the fallback.
   */
  it('should use CSV icon when available, not fallback', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG.filter(u => u.icon && u.icon.length > 0)),
        (unitWithIcon) => {
          const visual = getUnitVisual(unitWithIcon.id);
          
          // Should use CSV icon, not fallback
          expect(visual.icon).toBe(unitWithIcon.icon);
          expect(visual.icon).not.toBe("🐾");
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: Fallback icon used when CSV icon is missing
   * 
   * For any unit without an icon in CSV, getUnitVisual should use
   * the fallback "🐾" icon.
   */
  it('should use fallback icon when CSV icon is missing', () => {
    // First check if there are any units without icons
    const unitsWithoutIcon = UNIT_CATALOG.filter(u => !u.icon || u.icon.length === 0);
    
    if (unitsWithoutIcon.length === 0) {
      // All units have icons, test passes trivially
      expect(true).toBe(true);
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...unitsWithoutIcon),
        (unitWithoutIcon) => {
          const visual = getUnitVisual(unitWithoutIcon.id);
          
          // Should use fallback icon
          expect(visual.icon).toBe("🐾");
          
          return true;
        }
      ),
      { numRuns: Math.min(50, unitsWithoutIcon.length) }
    );
  });

  /**
   * Property Test: getUnitVisual is idempotent
   * 
   * For any unit, calling getUnitVisual multiple times should return
   * the same result (idempotent operation).
   */
  it('should return same result on multiple calls for any unit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          const visual1 = getUnitVisual(unit.id);
          const visual2 = getUnitVisual(unit.id);
          const visual3 = getUnitVisual(unit.id);
          
          // All calls should return identical results
          expect(visual1.nameVi).toBe(visual2.nameVi);
          expect(visual1.nameVi).toBe(visual3.nameVi);
          expect(visual1.icon).toBe(visual2.icon);
          expect(visual1.icon).toBe(visual3.icon);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test: All catalog units resolve to valid visuals
   * 
   * For any unit in the catalog, getUnitVisual should successfully
   * return a valid visual without throwing errors.
   */
  it('should successfully resolve visual for all catalog units', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNIT_CATALOG),
        (unit) => {
          let visual;
          let error = null;
          
          try {
            visual = getUnitVisual(unit.id);
          } catch (e) {
            error = e;
          }
          
          // Should not throw error
          expect(error).toBeNull();
          
          // Should return valid visual
          expect(visual).toBeDefined();
          expect(visual.nameVi).toBeDefined();
          expect(visual.icon).toBeDefined();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
