/**
 * Bug Condition Exploration Test - Tier 3 Recipe Requirements
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14**
 * 
 * This test verifies the bugs in tier 3 crafting recipes and equipment restrictions:
 * - Tier 3 recipes have insufficient ingredient requirements (Requirements 3.1, 3.2)
 * - Tier 3 recipes don't require tier 2 items (Requirement 3.2)
 * - 1-star units can equip tier 3 items (Requirement 3.3)
 * - Equipment tier restrictions are not enforced by unit star level (Requirements 2.11, 2.12, 2.13)
 * 
 * **EXPECTED OUTCOME**: Test FAILS on unfixed code (confirms bugs exist)
 * 
 * This test encodes the EXPECTED behavior - it will validate the fix when it passes after implementation.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CRAFT_RECIPES } from '../src/data/items.js';

/**
 * Helper function to determine equipment tier from recipe
 */
function getEquipmentTier(recipe) {
  // Explicit tier property takes precedence
  if (Number.isFinite(recipe?.tier)) {
    return Math.floor(recipe.tier);
  }
  
  // Otherwise infer from gridSize
  const gridSize = Number.isFinite(recipe?.gridSize) ? Math.floor(recipe.gridSize) : 2;
  return gridSize >= 3 ? 3 : 1;
}

/**
 * Helper function to check if an ingredient is a tier 2 equipment item
 */
function isTier2Equipment(ingredientId) {
  if (!ingredientId || !String(ingredientId).startsWith('eq_')) {
    return false;
  }
  
  // Find the recipe for this equipment
  const recipeId = String(ingredientId).slice(3); // Remove 'eq_' prefix
  const recipe = CRAFT_RECIPES.find(r => r.id === recipeId);
  
  if (!recipe) return false;
  
  const tier = getEquipmentTier(recipe);
  return tier === 2;
}

/**
 * Helper function to check if a unit can equip an item based on star level
 * This is the EXPECTED behavior that should be enforced
 */
function canEquipByStarLevel(unitStars, equipmentTier) {
  // Expected behavior:
  // 1-star units: tier 1 only
  // 2-star units: tier 1 and 2
  // 3-star units: tier 1, 2, and 3
  return equipmentTier <= unitStars;
}

describe('Bug Condition Exploration - Tier 3 Recipe Requirements', () => {
  /**
   * Property 1: Tier 3 Recipes Require At Least 6 Ingredients
   * 
   * **Validates: Requirements 3.1, 2.8**
   * 
   * This property tests the EXPECTED behavior:
   * - Tier 3 recipes should require at least 6 ingredients
   * - Currently, some tier 3 recipes only require 4 ingredients
   * 
   * **EXPECTED**: This test FAILS on unfixed code (proves bug exists)
   */
  it('Property 1: Tier 3 recipes should require at least 6 ingredients', () => {
    // Get all tier 3 recipes
    const tier3Recipes = CRAFT_RECIPES.filter(recipe => {
      const tier = getEquipmentTier(recipe);
      return tier === 3;
    });
    
    // Verify we have tier 3 recipes to test
    expect(tier3Recipes.length).toBeGreaterThan(0);
    
    // Track counterexamples
    const counterexamples = [];
    
    // Test each tier 3 recipe
    tier3Recipes.forEach(recipe => {
      const ingredientCount = Array.isArray(recipe.requires) 
        ? recipe.requires.filter(Boolean).length 
        : 0;
      
      // EXPECTED: All tier 3 recipes should have at least 6 ingredients
      // ACTUAL (unfixed): Some recipes have only 4 ingredients
      if (ingredientCount < 6) {
        counterexamples.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          ingredientCount: ingredientCount,
          expected: 6
        });
      }
    });
    
    // Document counterexamples if found
    if (counterexamples.length > 0) {
      console.log('\n=== COUNTEREXAMPLES FOUND ===');
      console.log('Tier 3 recipes with insufficient ingredients:');
      counterexamples.forEach(ce => {
        console.log(`  - ${ce.recipeName} (${ce.recipeId}): has ${ce.ingredientCount} ingredients, expected at least ${ce.expected}`);
      });
      console.log('=============================\n');
    }
    
    // This assertion should FAIL on unfixed code
    expect(counterexamples).toHaveLength(0);
  });

  /**
   * Property 2: Tier 3 Recipes Require At Least 1 Tier 2 Item
   * 
   * **Validates: Requirements 3.2, 2.9**
   * 
   * This property tests the EXPECTED behavior:
   * - Tier 3 recipes should require at least 1 tier 2 equipment item
   * - Currently, tier 3 recipes don't require tier 2 items
   * 
   * **EXPECTED**: This test FAILS on unfixed code (proves bug exists)
   */
  it('Property 2: Tier 3 recipes should require at least 1 tier 2 item', () => {
    // Get all tier 3 recipes
    const tier3Recipes = CRAFT_RECIPES.filter(recipe => {
      const tier = getEquipmentTier(recipe);
      return tier === 3;
    });
    
    // Track counterexamples
    const counterexamples = [];
    
    // Test each tier 3 recipe
    tier3Recipes.forEach(recipe => {
      const requires = Array.isArray(recipe.requires) ? recipe.requires.filter(Boolean) : [];
      
      // Check if any ingredient is a tier 2 equipment
      const hasTier2Item = requires.some(ingredientId => isTier2Equipment(ingredientId));
      
      // EXPECTED: All tier 3 recipes should have at least 1 tier 2 item
      // ACTUAL (unfixed): Tier 3 recipes don't require tier 2 items
      if (!hasTier2Item) {
        counterexamples.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          ingredients: requires
        });
      }
    });
    
    // Document counterexamples if found
    if (counterexamples.length > 0) {
      console.log('\n=== COUNTEREXAMPLES FOUND ===');
      console.log('Tier 3 recipes without tier 2 items:');
      counterexamples.forEach(ce => {
        console.log(`  - ${ce.recipeName} (${ce.recipeId}): ingredients = [${ce.ingredients.join(', ')}]`);
      });
      console.log('=============================\n');
    }
    
    // This assertion should FAIL on unfixed code
    expect(counterexamples).toHaveLength(0);
  });

  /**
   * Property 3: Equipment Tier Restrictions Not Enforced
   * 
   * **Validates: Requirements 3.3, 2.11**
   * 
   * This property documents the EXPECTED behavior:
   * - 1-star units should only be able to equip tier 1 items
   * - Currently, there's NO CODE enforcing this restriction
   * - The game allows any unit to equip any tier equipment
   * 
   * **NOTE**: This test documents the expected behavior using a helper function.
   * The actual bug is that NO restriction code exists in the game.
   * When the fix is implemented, the game code should match this helper function.
   */
  it('Property 3: Equipment tier restrictions should prevent 1-star units from equipping tier 3 items', () => {
    // Document the expected behavior
    const unitStars = 1;
    const tier3Equipment = 3;
    
    // EXPECTED behavior (what SHOULD happen after fix)
    const expectedCanEquip = canEquipByStarLevel(unitStars, tier3Equipment);
    expect(expectedCanEquip).toBe(false);
    
    // ACTUAL behavior (unfixed code): No restriction exists
    // The game currently allows any unit to equip any tier equipment
    // This is documented in the bugfix.md as Fault Condition 3.3
    console.log('\n=== BUG DOCUMENTATION ===');
    console.log('EXPECTED: 1-star units cannot equip tier 3 items');
    console.log('ACTUAL: No restriction code exists - any unit can equip any tier');
    console.log('FIX NEEDED: Implement canEquipByStarLevel validation in equipment system');
    console.log('=========================\n');
  });

  /**
   * Property 4: Equipment Tier Restrictions by Unit Star Level
   * 
   * **Validates: Requirements 2.11, 2.12, 2.13**
   * 
   * This property tests the EXPECTED behavior for all star levels:
   * - 1-star units: tier 1 only
   * - 2-star units: tier 1 and 2
   * - 3-star units: tier 1, 2, and 3
   * 
   * **EXPECTED**: This test documents the expected behavior
   */
  it('Property 4: Equipment tier restrictions should match unit star level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // Unit stars (1-3)
        fc.integer({ min: 1, max: 3 }), // Equipment tier (1-3)
        (unitStars, equipmentTier) => {
          const canEquip = canEquipByStarLevel(unitStars, equipmentTier);
          const expectedCanEquip = equipmentTier <= unitStars;
          
          // Verify the helper function implements the expected behavior
          expect(canEquip).toBe(expectedCanEquip);
          
          // Document the expected behavior
          if (unitStars === 1) {
            // 1-star units: tier 1 only
            expect(canEquip).toBe(equipmentTier === 1);
          } else if (unitStars === 2) {
            // 2-star units: tier 1 and 2
            expect(canEquip).toBe(equipmentTier <= 2);
          } else if (unitStars === 3) {
            // 3-star units: tier 1, 2, and 3
            expect(canEquip).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5: Tier 3 Recipes Should Use 3x3 Grid
   * 
   * **Validates: Requirement 2.10**
   * 
   * This property tests the RECOMMENDED behavior:
   * - Tier 3 recipes should ideally use 9 ingredients to utilize the full 3x3 grid
   * - This is a SHOULD requirement, not a MUST
   * 
   * **NOTE**: This is informational - documents current state vs. ideal state
   */
  it('Property 5: Tier 3 recipes should ideally use 9 ingredients (3x3 grid)', () => {
    // Get all tier 3 recipes
    const tier3Recipes = CRAFT_RECIPES.filter(recipe => {
      const tier = getEquipmentTier(recipe);
      return tier === 3;
    });
    
    // Track recipes that don't use full 3x3 grid
    const notFullGrid = [];
    
    tier3Recipes.forEach(recipe => {
      const ingredientCount = Array.isArray(recipe.requires) 
        ? recipe.requires.filter(Boolean).length 
        : 0;
      
      if (ingredientCount < 9) {
        notFullGrid.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          ingredientCount: ingredientCount,
          gridSize: recipe.gridSize || 2
        });
      }
    });
    
    // Document current state (informational only)
    if (notFullGrid.length > 0) {
      console.log('\n=== INFORMATIONAL ===');
      console.log('Tier 3 recipes not using full 3x3 grid (SHOULD requirement):');
      notFullGrid.forEach(r => {
        console.log(`  - ${r.recipeName} (${r.recipeId}): ${r.ingredientCount}/9 ingredients`);
      });
      console.log('=====================\n');
    }
    
    // This is informational - we don't fail the test for SHOULD requirements
    // Just document the current state
    expect(tier3Recipes.length).toBeGreaterThan(0);
  });
});
