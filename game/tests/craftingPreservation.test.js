/**
 * Preservation Property Tests - Crafting System (Tier 1 and Tier 2 Recipes)
 * 
 * **Validates: Requirements 3.7, 3.8, 3.9**
 * 
 * These tests capture the EXISTING behavior of tier 1 and tier 2 recipes
 * to ensure no regressions when fixing tier 3 recipes.
 * 
 * **EXPECTED OUTCOME**: Tests PASS on UNFIXED code (confirms baseline behavior to preserve)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CRAFT_RECIPES, ITEM_BY_ID, EQUIPMENT_ITEMS, RECIPE_BY_ID } from '../src/data/items.js';
import { applyBonusToCombatUnit } from '../src/systems/SynergySystem.js';

/**
 * Helper: get recipe tier
 */
function getRecipeTier(recipe) {
    if (Number.isFinite(recipe?.tier)) return Math.floor(recipe.tier);
    const gridSize = Number.isFinite(recipe?.gridSize) ? Math.floor(recipe.gridSize) : 2;
    return gridSize >= 3 ? 3 : 1;
}

/**
 * Helper: check if ingredient is a crafted equipment
 */
function isEquipmentIngredient(id) {
    return typeof id === 'string' && id.startsWith('eq_');
}

/**
 * Helper: create a minimal combat unit for bonus testing
 */
function createTestUnit(overrides = {}) {
    return {
        maxHp: 1000,
        hp: 1000,
        atk: 100,
        def: 20,
        matk: 50,
        mdef: 10,
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
            startingRage: 0,
            basicAttackType: 'physical',
            basicAttackScaleStat: 'atk'
        },
        ...overrides
    };
}

describe('Preservation - Tier 1 and Tier 2 Crafting Recipes', () => {
    /**
     * Property 1: Tier 1 Recipes Use 1-4 Base Ingredients
     * 
     * **Validates: Requirement 3.7**
     * 
     * Tier 1 recipes should use 1-4 ingredients from the base item pool.
     * They use a 2x2 grid (gridSize 2) with at most 4 slots.
     */
    it('Property 1: Tier 1 recipes require 1-4 base ingredients', () => {
        const tier1Recipes = CRAFT_RECIPES.filter(r => getRecipeTier(r) === 1);

        // Verify we have tier 1 recipes
        expect(tier1Recipes.length).toBeGreaterThan(0);

        tier1Recipes.forEach(recipe => {
            const requires = Array.isArray(recipe.requires) ? recipe.requires.filter(Boolean) : [];

            // Tier 1 recipes should have 1-4 ingredients
            expect(requires.length).toBeGreaterThanOrEqual(1);
            expect(requires.length).toBeLessThanOrEqual(4);

            // Tier 1 recipes should use gridSize 2
            expect(recipe.gridSize).toBe(2);

            // Tier 1 recipes should NOT contain crafted equipment ingredients
            const hasEquipmentIngredient = requires.some(id => isEquipmentIngredient(id));
            expect(hasEquipmentIngredient).toBe(false);
        });
    });

    /**
     * Property 2: Tier 2 Recipes Use 3 Ingredients with At Least 1 Tier 1 Item
     * 
     * **Validates: Requirement 3.8**
     * 
     * Tier 2 recipes should require exactly 3 ingredients,
     * where at least 1 is a crafted equipment item (eq_* prefix).
     */
    it('Property 2: Tier 2 recipes require 3 ingredients with at least 1 crafted equipment', () => {
        const tier2Recipes = CRAFT_RECIPES.filter(r => getRecipeTier(r) === 2);

        // Verify we have tier 2 recipes
        expect(tier2Recipes.length).toBeGreaterThan(0);

        tier2Recipes.forEach(recipe => {
            const requires = Array.isArray(recipe.requires) ? recipe.requires.filter(Boolean) : [];

            // Tier 2 recipes should have exactly 3 ingredients
            expect(requires.length).toBe(3);

            // Tier 2 recipes should use gridSize 2
            expect(recipe.gridSize).toBe(2);

            // Tier 2 recipes should have at least 1 crafted equipment ingredient
            const hasEquipmentIngredient = requires.some(id => isEquipmentIngredient(id));
            expect(hasEquipmentIngredient).toBe(true);

            // Tier 2 should have explicit tier property
            expect(recipe.tier).toBe(2);
        });
    });

    /**
     * Property 3: Equipment Bonuses Are Applied Correctly
     * 
     * **Validates: Requirement 3.9**
     * 
     * Equipment bonuses (atkPct, hpPct, defFlat, matkPct, etc.) should be
     * properly applied to combat units via applyBonusToCombatUnit.
     */
    it('Property 3: Equipment bonuses are correctly applied to combat units', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: CRAFT_RECIPES.length - 1 }),
                (recipeIndex) => {
                    const recipe = CRAFT_RECIPES[recipeIndex];
                    if (!recipe?.bonus) return true; // Skip recipes without bonus

                    const unit = createTestUnit();
                    const originalHp = unit.maxHp;
                    const originalAtk = unit.atk;
                    const originalDef = unit.def;
                    const originalMatk = unit.matk;
                    const originalMdef = unit.mdef;

                    // Apply bonus
                    applyBonusToCombatUnit(unit, recipe.bonus);

                    // Verify bonuses are applied (stats should change or stay same, never decrease below original for positive bonuses)
                    if (recipe.bonus.hpPct > 0) {
                        expect(unit.maxHp).toBeGreaterThan(originalHp);
                        expect(unit.hp).toBeGreaterThan(originalHp);
                    }
                    if (recipe.bonus.atkPct > 0) {
                        expect(unit.atk).toBeGreaterThan(originalAtk);
                    }
                    if (recipe.bonus.defFlat > 0) {
                        expect(unit.def).toBe(originalDef + recipe.bonus.defFlat);
                    }
                    if (recipe.bonus.matkPct > 0) {
                        expect(unit.matk).toBeGreaterThan(originalMatk);
                    }
                    if (recipe.bonus.mdefFlat > 0) {
                        expect(unit.mdef).toBe(originalMdef + recipe.bonus.mdefFlat);
                    }
                    if (recipe.bonus.startingRage > 0) {
                        expect(unit.mods.startingRage).toBeGreaterThan(0);
                    }
                    if (recipe.bonus.critPct > 0) {
                        expect(unit.mods.critPct).toBeGreaterThan(0.05); // default is 0.05
                    }
                    if (recipe.bonus.burnOnHit > 0) {
                        expect(unit.mods.burnOnHit).toBeGreaterThan(0);
                    }
                    if (recipe.bonus.lifestealPct > 0) {
                        expect(unit.mods.lifestealPct).toBeGreaterThan(0);
                    }

                    return true;
                }
            ),
            { numRuns: Math.min(100, CRAFT_RECIPES.length * 3) }
        );
    });

    /**
     * Property 4: All Recipe Ingredients Reference Valid Items
     * 
     * Preservation check: all recipe ingredients should exist in ITEM_BY_ID.
     */
    it('Property 4: All recipe ingredients reference valid items', () => {
        CRAFT_RECIPES.forEach(recipe => {
            const requires = Array.isArray(recipe.requires) ? recipe.requires.filter(Boolean) : [];

            requires.forEach(ingredientId => {
                const item = ITEM_BY_ID[ingredientId];
                expect(item).toBeDefined();
            });
        });
    });

    /**
     * Property 5: Recipe tier hierarchy is consistent
     * 
     * Tier 2 recipes should only reference tier 1 equipment.
     * Tier 4 recipes should reference tier 2+ equipment.
     */
    it('Property 5: Recipe tier hierarchy is consistent', () => {
        CRAFT_RECIPES.forEach(recipe => {
            const tier = getRecipeTier(recipe);
            const requires = Array.isArray(recipe.requires) ? recipe.requires.filter(Boolean) : [];

            requires.forEach(id => {
                if (!isEquipmentIngredient(id)) return;

                const recipeId = id.slice(3); // Remove eq_ prefix
                const ingredientRecipe = RECIPE_BY_ID[recipeId];
                if (!ingredientRecipe) return;

                const ingredientTier = getRecipeTier(ingredientRecipe);

                // Ingredient tier should be less than the recipe tier
                expect(ingredientTier).toBeLessThan(tier);
            });
        });
    });
});
