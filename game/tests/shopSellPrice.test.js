/**
 * Shop Sell Price Tests
 * 
 * Tests for sell price calculation in ShopSystem
 * Validates that sell prices match the game formula:
 * - Star 1: tier × 1
 * - Star 2: tier × 3
 * - Star 3: tier × 5
 */

import { describe, it, expect } from 'vitest';
import { sellUnit } from '../src/systems/ShopSystem.js';

describe('ShopSystem - Sell Price Calculation', () => {
  it('should calculate correct sell price for star 1 units', () => {
    const player = { gold: 10, bench: [] };
    
    // Tier 1, Star 1: 1 × 1 = 1
    const unit1 = { baseId: 'bear_ancient', star: 1 };
    const result1 = sellUnit(player, unit1);
    expect(result1.success).toBe(true);
    expect(result1.sellValue).toBe(1);
    expect(result1.player.gold).toBe(11);
    
    // Tier 3, Star 1: 3 × 1 = 3
    const unit2 = { baseId: 'turtle_mire', star: 1 };
    const result2 = sellUnit(player, unit2);
    expect(result2.success).toBe(true);
    expect(result2.sellValue).toBe(3);
    expect(result2.player.gold).toBe(13);
    
    // Tier 5, Star 1: 5 × 1 = 5
    const unit3 = { baseId: 'panther_void', star: 1 };
    const result3 = sellUnit(player, unit3);
    expect(result3.success).toBe(true);
    expect(result3.sellValue).toBe(5);
    expect(result3.player.gold).toBe(15);
  });

  it('should calculate correct sell price for star 2 units', () => {
    const player = { gold: 10, bench: [] };
    
    // Tier 1, Star 2: 1 × 3 = 3
    const unit1 = { baseId: 'bear_ancient', star: 2 };
    const result1 = sellUnit(player, unit1);
    expect(result1.success).toBe(true);
    expect(result1.sellValue).toBe(3);
    expect(result1.player.gold).toBe(13);
    
    // Tier 3, Star 2: 3 × 3 = 9
    const unit2 = { baseId: 'turtle_mire', star: 2 };
    const result2 = sellUnit(player, unit2);
    expect(result2.success).toBe(true);
    expect(result2.sellValue).toBe(9);
    expect(result2.player.gold).toBe(19);
    
    // Tier 5, Star 2: 5 × 3 = 15
    const unit3 = { baseId: 'panther_void', star: 2 };
    const result3 = sellUnit(player, unit3);
    expect(result3.success).toBe(true);
    expect(result3.sellValue).toBe(15);
    expect(result3.player.gold).toBe(25);
  });

  it('should calculate correct sell price for star 3 units', () => {
    const player = { gold: 10, bench: [] };
    
    // Tier 1, Star 3: 1 × 5 = 5
    const unit1 = { baseId: 'bear_ancient', star: 3 };
    const result1 = sellUnit(player, unit1);
    expect(result1.success).toBe(true);
    expect(result1.sellValue).toBe(5);
    expect(result1.player.gold).toBe(15);
    
    // Tier 3, Star 3: 3 × 5 = 15
    const unit2 = { baseId: 'turtle_mire', star: 3 };
    const result2 = sellUnit(player, unit2);
    expect(result2.success).toBe(true);
    expect(result2.sellValue).toBe(15);
    expect(result2.player.gold).toBe(25);
    
    // Tier 5, Star 3: 5 × 5 = 25
    const unit3 = { baseId: 'panther_void', star: 3 };
    const result3 = sellUnit(player, unit3);
    expect(result3.success).toBe(true);
    expect(result3.sellValue).toBe(25);
    expect(result3.player.gold).toBe(35);
  });

  it('should handle units without star level (default to 1)', () => {
    const player = { gold: 10, bench: [] };
    
    // Unit without star property should default to star 1
    const unit = { baseId: 'bear_ancient' };
    const result = sellUnit(player, unit);
    expect(result.success).toBe(true);
    expect(result.sellValue).toBe(1); // tier 1 × 1 = 1
    expect(result.player.gold).toBe(11);
  });

  it('should return error for invalid unit data', () => {
    const player = { gold: 10, bench: [] };
    
    // No unit provided
    const result1 = sellUnit(player, null);
    expect(result1.success).toBe(false);
    expect(result1.error).toBe('No unit provided');
    
    // Invalid baseId
    const result2 = sellUnit(player, { baseId: 'invalid_unit', star: 1 });
    expect(result2.success).toBe(false);
    expect(result2.error).toBe('Invalid unit data');
  });

  it('should return error when no player provided', () => {
    const unit = { baseId: 'rat', star: 1 };
    const result = sellUnit(null, unit);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No player provided');
  });

  it('should match PlanningScene formula exactly', () => {
    // This test verifies the formula matches PlanningScene.getUnitSalePrice()
    // Formula: tier * (star === 3 ? 5 : star === 2 ? 3 : 1)
    
    const player = { gold: 0, bench: [] };
    
    const testCases = [
      // [baseId, tier, star, expectedValue]
      ['bear_ancient', 1, 1, 1],
      ['bear_ancient', 1, 2, 3],
      ['bear_ancient', 1, 3, 5],
      ['rhino_quake', 2, 1, 2],
      ['rhino_quake', 2, 2, 6],
      ['rhino_quake', 2, 3, 10],
      ['turtle_mire', 3, 1, 3],
      ['turtle_mire', 3, 2, 9],
      ['turtle_mire', 3, 3, 15],
      ['buffalo_mist', 4, 1, 4],
      ['buffalo_mist', 4, 2, 12],
      ['buffalo_mist', 4, 3, 20],
      ['panther_void', 5, 1, 5],
      ['panther_void', 5, 2, 15],
      ['panther_void', 5, 3, 25],
    ];
    
    testCases.forEach(([baseId, tier, star, expected]) => {
      const unit = { baseId, star };
      const result = sellUnit(player, unit);
      expect(result.success).toBe(true);
      expect(result.sellValue).toBe(expected);
    });
  });
});
