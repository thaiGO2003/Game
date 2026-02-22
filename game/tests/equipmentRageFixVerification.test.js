/**
 * Verification Test - Equipment Rage Fix
 * 
 * This test verifies that the fix for Bug 1 (Equipment rage bonuses not being applied)
 * works correctly with the real SynergySystem.
 */

import { describe, it, expect } from 'vitest';
import { applySynergyBonusesToTeam } from '../src/systems/SynergySystem.js';

describe('Equipment Rage Fix Verification', () => {
  /**
   * Test 1: Verify startingRage is applied from equipment
   */
  it('should apply startingRage from equipment to unit rage', () => {
    const unit = {
      classType: 'WARRIOR',
      tribe: 'BEAST',
      rage: 0,
      rageMax: 5,
      mods: {
        startingRage: 2
      }
    };

    applySynergyBonusesToTeam([unit], 'LEFT', {});

    // Unit should now have 2 rage from equipment
    expect(unit.rage).toBe(2);
  });

  /**
   * Test 2: Verify startingRage is capped at 4 maximum
   */
  it('should cap startingRage bonus at 4 maximum', () => {
    const unit = {
      classType: 'WARRIOR',
      tribe: 'BEAST',
      rage: 0,
      rageMax: 10,
      mods: {
        startingRage: 30 // Excessive value (e.g., from Blue Buff)
      }
    };

    applySynergyBonusesToTeam([unit], 'LEFT', {});

    // Unit should have 4 rage (capped), not 30
    expect(unit.rage).toBe(4);
  });

  /**
   * Test 3: Verify rage is capped at rageMax
   */
  it('should cap rage at rageMax when startingRage exceeds it', () => {
    const unit = {
      classType: 'WARRIOR',
      tribe: 'BEAST',
      rage: 0,
      rageMax: 2,
      mods: {
        startingRage: 4
      }
    };

    applySynergyBonusesToTeam([unit], 'LEFT', {});

    // Unit should have 2 rage (capped at rageMax), not 4
    expect(unit.rage).toBe(2);
  });

  /**
   * Test 4: Verify multiple equipment items stack correctly
   */
  it('should stack startingRage from multiple equipment items (capped at 4)', () => {
    const unit = {
      classType: 'WARRIOR',
      tribe: 'BEAST',
      rage: 0,
      rageMax: 5,
      mods: {
        startingRage: 1 + 2 + 2 // Three items: +1, +2, +2 = 5 total
      }
    };

    applySynergyBonusesToTeam([unit], 'LEFT', {});

    // Unit should have 4 rage (capped), not 5
    expect(unit.rage).toBe(4);
  });

  /**
   * Test 5: Verify units without equipment start with 0 rage
   */
  it('should leave rage at 0 for units without startingRage equipment', () => {
    const unit = {
      classType: 'WARRIOR',
      tribe: 'BEAST',
      rage: 0,
      rageMax: 5,
      mods: {
        startingRage: 0
      }
    };

    applySynergyBonusesToTeam([unit], 'LEFT', {});

    // Unit should still have 0 rage
    expect(unit.rage).toBe(0);
  });
});
