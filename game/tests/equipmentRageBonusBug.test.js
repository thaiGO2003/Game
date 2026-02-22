/**
 * Bug Condition Exploration Test - Equipment Rage Bonuses Fixed
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4**
 * 
 * This test verifies that the fix for equipment rage bonuses works correctly:
 * - Units with startingRage equipment begin combat with increased rage (Requirements 2.1, 2.2)
 * - startingRage bonus is capped at 4 maximum (Requirement 2.2)
 * - Units with low rageMax start with min(rageMax, startingRage) (Requirement 2.3)
 * 
 * **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
 * 
 * This is the SAME test from Task 1, now using the real SynergySystem with the fix.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { applySynergyBonusesToTeam, applyBonusToCombatUnit } from '../src/systems/SynergySystem.js';

// Combat initialization helper using real SynergySystem
class CombatInitializer {
  constructor() {
    this.player = {
      startingRage: 0, // Global starting rage from augments
      startingShield: 0
    };
  }

  /**
   * Creates a combat unit with equipment bonuses applied
   * This mimics the createCombatUnit flow in CombatScene.js
   */
  createCombatUnit(baseStats, equipment, side = "LEFT") {
    // Create unit with base stats
    const unit = {
      maxHp: baseStats.hp,
      hp: baseStats.hp,
      atk: baseStats.atk,
      def: baseStats.def,
      matk: baseStats.matk,
      mdef: baseStats.mdef,
      range: baseStats.range,
      rageMax: baseStats.rageMax,
      rage: side === "LEFT" ? this.player.startingRage : 0, // Initial rage from global bonus
      shield: side === "LEFT" ? this.player.startingShield : 0,
      alive: true,
      mods: {
        atkPct: 0,
        matkPct: 0,
        healPct: 0,
        lifestealPct: 0,
        critPct: 0.05,
        evadePct: 0,
        burnOnHit: 0,
        poisonOnHit: 0,
        shieldStart: 0,
        startingRage: 0 // Equipment rage bonus accumulates here
      }
    };

    // Apply equipment bonuses to unit.mods using real SynergySystem
    if (equipment && equipment.length > 0) {
      equipment.forEach(item => {
        applyBonusToCombatUnit(unit, item.bonus);
      });
    }

    return unit;
  }
}

// Arbitraries for property-based testing
const baseStatsArbitrary = () => fc.record({
  hp: fc.integer({ min: 100, max: 500 }),
  atk: fc.integer({ min: 20, max: 100 }),
  def: fc.integer({ min: 10, max: 50 }),
  matk: fc.integer({ min: 20, max: 100 }),
  mdef: fc.integer({ min: 10, max: 50 }),
  range: fc.integer({ min: 1, max: 3 }),
  rageMax: fc.integer({ min: 2, max: 6 }) // Vary rageMax to test capping
});

const equipmentWithRageArbitrary = () => fc.record({
  id: fc.constantFrom("spear_shojin", "frozen_heart", "archangel_staff", "blue_buff"),
  bonus: fc.record({
    startingRage: fc.integer({ min: 1, max: 4 }) // Equipment rage bonuses 1-4
  })
});

describe('Bug Condition Exploration - Equipment Rage Bonuses', () => {
  /**
   * Property 1: Equipment startingRage Applied Correctly (Expected Behavior)
   * 
   * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
   * 
   * This property tests the FIXED behavior:
   * - Units with startingRage equipment should begin with increased rage
   * - After the fix, they correctly start with rage from equipment
   * 
   * **EXPECTED**: This test PASSES, proving the bug is fixed
   */
  it('Property 1: Units with startingRage equipment should begin combat with increased rage', () => {
    fc.assert(
      fc.property(
        baseStatsArbitrary(),
        fc.array(equipmentWithRageArbitrary(), { minLength: 1, maxLength: 3 }),
        (baseStats, equipment) => {
          const scene = new CombatInitializer();
          
          // Create unit with equipment
          const unit = scene.createCombatUnit(baseStats, equipment, "LEFT");
          
          // Calculate expected starting rage from equipment
          const totalEquipmentRage = equipment.reduce(
            (sum, item) => sum + (item.bonus.startingRage || 0),
            0
          );
          
          // Verify equipment bonuses were accumulated in mods
          expect(unit.mods.startingRage).toBe(totalEquipmentRage);
          
          // Apply synergy bonuses using REAL SynergySystem (with the fix)
          applySynergyBonusesToTeam([unit], "LEFT");
          
          // **CRITICAL ASSERTION**: Unit should have rage from equipment
          // After the fix, this should PASS
          const expectedRage = Math.min(unit.rageMax, Math.min(4, totalEquipmentRage));
          
          // This assertion should PASS on fixed code
          expect(unit.rage).toBe(expectedRage);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: startingRage Bonus Capped at 4 Maximum
   * 
   * **Validates: Requirement 2.2**
   * 
   * Tests that even with multiple high-rage equipment,
   * the starting rage bonus is capped at 4
   * 
   * **EXPECTED**: This test PASSES after the fix
   */
  it('Property 2: startingRage bonus should be capped at 4 maximum', () => {
    fc.assert(
      fc.property(
        baseStatsArbitrary(),
        (baseStats) => {
          const scene = new CombatInitializer();
          
          // Create equipment with excessive startingRage (e.g., 3 items with +4 each = 12 total)
          const equipment = [
            { id: "blue_buff", bonus: { startingRage: 4 } },
            { id: "spear_shojin", bonus: { startingRage: 4 } },
            { id: "archangel_staff", bonus: { startingRage: 4 } }
          ];
          
          const unit = scene.createCombatUnit(baseStats, equipment, "LEFT");
          
          // Total equipment rage is 12, but should be capped at 4
          expect(unit.mods.startingRage).toBe(12); // Accumulated in mods
          
          // Apply synergy bonuses using REAL SynergySystem
          applySynergyBonusesToTeam([unit], "LEFT");
          
          // After applying, rage should be capped at min(rageMax, 4)
          const expectedRage = Math.min(unit.rageMax, 4);
          
          // This should PASS on fixed code
          expect(unit.rage).toBe(expectedRage);
          expect(unit.rage).toBeLessThanOrEqual(4);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: Units with Low rageMax Start with min(rageMax, startingRage)
   * 
   * **Validates: Requirement 2.3**
   * 
   * Tests that units with low rageMax (e.g., 2) and high startingRage equipment
   * start with rage capped at their rageMax
   * 
   * **EXPECTED**: This test PASSES after the fix
   */
  it('Property 3: Units with low rageMax should start with min(rageMax, startingRage)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // Low rageMax values
        fc.integer({ min: 2, max: 4 }), // startingRage from equipment
        (rageMax, startingRage) => {
          const scene = new CombatInitializer();
          
          const baseStats = {
            hp: 200,
            atk: 50,
            def: 20,
            matk: 50,
            mdef: 20,
            range: 2,
            rageMax: rageMax
          };
          
          const equipment = [
            { id: "test_item", bonus: { startingRage: startingRage } }
          ];
          
          const unit = scene.createCombatUnit(baseStats, equipment, "LEFT");
          
          // Apply synergy bonuses using REAL SynergySystem
          applySynergyBonusesToTeam([unit], "LEFT");
          
          // Rage should be capped at rageMax and at 4
          const expectedRage = Math.min(rageMax, Math.min(4, startingRage));
          
          // This should PASS on fixed code
          expect(unit.rage).toBe(expectedRage);
          expect(unit.rage).toBeLessThanOrEqual(unit.rageMax);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Multiple Equipment Items Stack startingRage
   * 
   * **Validates: Requirements 1.3, 2.1**
   * 
   * Tests that multiple equipment items with startingRage
   * correctly stack their bonuses
   * 
   * **EXPECTED**: This test PASSES after the fix
   */
  it('Property 4: Multiple equipment items should stack startingRage bonuses', () => {
    const scene = new CombatInitializer();
    
    const baseStats = {
      hp: 300,
      atk: 60,
      def: 25,
      matk: 60,
      mdef: 25,
      range: 2,
      rageMax: 5
    };
    
    // Multiple items with different startingRage values
    const equipment = [
      { id: "frozen_heart", bonus: { startingRage: 1 } },
      { id: "spear_shojin", bonus: { startingRage: 2 } },
      { id: "archangel_staff", bonus: { startingRage: 2 } }
    ];
    
    const unit = scene.createCombatUnit(baseStats, equipment, "LEFT");
    
    // Total should be 1 + 2 + 2 = 5
    expect(unit.mods.startingRage).toBe(5);
    
    // Apply synergy bonuses using REAL SynergySystem
    applySynergyBonusesToTeam([unit], "LEFT");
    
    // Should start with min(5, 4) = 4 rage (capped at 4, not rageMax)
    // This should PASS on fixed code
    expect(unit.rage).toBe(4);
  });

  /**
   * Property 5: Units Without Equipment Start with 0 Rage
   * 
   * **Validates: Requirement 2.4**
   * 
   * Control test: Units without equipment should start with 0 rage
   * (assuming no global startingRage bonus)
   * 
   * **EXPECTED**: This test PASSES (preservation property)
   */
  it('Property 5: Units without equipment should start with 0 rage', () => {
    const scene = new CombatInitializer();
    
    const baseStats = {
      hp: 250,
      atk: 55,
      def: 22,
      matk: 55,
      mdef: 22,
      range: 2,
      rageMax: 4
    };
    
    const unit = scene.createCombatUnit(baseStats, [], "LEFT");
    
    expect(unit.mods.startingRage).toBe(0);
    
    // Apply synergy bonuses using REAL SynergySystem
    applySynergyBonusesToTeam([unit], "LEFT");
    
    // Should remain at 0 rage
    expect(unit.rage).toBe(0);
  });
});
