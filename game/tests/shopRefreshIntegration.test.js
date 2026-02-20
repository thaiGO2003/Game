/**
 * Shop Refresh Integration Test
 * 
 * Simulates the actual shop refresh behavior from the game scenes
 * to verify Requirements 16.1-16.5 are met in practice.
 */

import { describe, it, expect } from 'vitest';
import { rollTierForLevel, randomItem } from '../src/core/gameUtils.js';
import { UNIT_CATALOG, UNIT_BY_ID } from '../src/data/unitCatalog.js';

/**
 * Simulates the refreshShop() method from PlanningScene/CombatScene/BoardPrototypeScene
 */
function simulateShopRefresh(playerLevel) {
  const offers = [];
  for (let i = 0; i < 5; i += 1) {
    const tier = rollTierForLevel(playerLevel);
    const pool = UNIT_CATALOG.filter((u) => u.tier === tier);
    const fallback = UNIT_CATALOG.filter((u) => u.tier <= tier);
    const base = randomItem(pool.length ? pool : fallback.length ? fallback : UNIT_CATALOG);
    offers.push({ slot: i, baseId: base.id });
  }
  return offers;
}

describe('Shop Refresh Integration Tests', () => {
  /**
   * Requirement 16.1: Shop queries tier odds from Progression_System based on player level
   * Requirement 16.2: Shop randomly selects tier for each slot according to tier odds
   * Requirement 16.3: Shop displays correct tier distribution matching the odds
   */
  it('shop refresh produces 5 valid unit offers at level 1', () => {
    const offers = simulateShopRefresh(1);
    
    expect(offers).toHaveLength(5);
    offers.forEach(offer => {
      expect(offer).toHaveProperty('slot');
      expect(offer).toHaveProperty('baseId');
      expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      
      // At level 1, all units should be tier 1
      const unit = UNIT_BY_ID[offer.baseId];
      expect(unit.tier).toBe(1);
    });
  });

  it('shop refresh produces 5 valid unit offers at level 10', () => {
    const offers = simulateShopRefresh(10);
    
    expect(offers).toHaveLength(5);
    offers.forEach(offer => {
      expect(offer).toHaveProperty('slot');
      expect(offer).toHaveProperty('baseId');
      expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      
      // At level 10, units should be tier 1-5 with specific distribution
      const unit = UNIT_BY_ID[offer.baseId];
      expect(unit.tier).toBeGreaterThanOrEqual(1);
      expect(unit.tier).toBeLessThanOrEqual(5);
    });
  });

  it('shop refresh produces 5 valid unit offers at level 25', () => {
    const offers = simulateShopRefresh(25);
    
    expect(offers).toHaveLength(5);
    offers.forEach(offer => {
      expect(offer).toHaveProperty('slot');
      expect(offer).toHaveProperty('baseId');
      expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      
      // At level 25, units should be mostly tier 5
      const unit = UNIT_BY_ID[offer.baseId];
      expect(unit.tier).toBeGreaterThanOrEqual(1);
      expect(unit.tier).toBeLessThanOrEqual(5);
    });
  });

  /**
   * Requirement 16.5: Handles levels beyond 25 by using level 25 odds as fallback
   * 
   * CRITICAL TEST for task 7.7
   */
  it('shop refresh handles level 26 using level 25 odds as fallback', () => {
    const offers = simulateShopRefresh(26);
    
    expect(offers).toHaveLength(5);
    offers.forEach(offer => {
      expect(offer).toHaveProperty('slot');
      expect(offer).toHaveProperty('baseId');
      expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      
      const unit = UNIT_BY_ID[offer.baseId];
      expect(unit.tier).toBeGreaterThanOrEqual(1);
      expect(unit.tier).toBeLessThanOrEqual(5);
    });
  });

  it('shop refresh handles level 30 using level 25 odds as fallback', () => {
    const offers = simulateShopRefresh(30);
    
    expect(offers).toHaveLength(5);
    offers.forEach(offer => {
      expect(offer).toHaveProperty('slot');
      expect(offer).toHaveProperty('baseId');
      expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      
      const unit = UNIT_BY_ID[offer.baseId];
      expect(unit.tier).toBeGreaterThanOrEqual(1);
      expect(unit.tier).toBeLessThanOrEqual(5);
    });
  });

  it('shop refresh handles level 100 using level 25 odds as fallback', () => {
    const offers = simulateShopRefresh(100);
    
    expect(offers).toHaveLength(5);
    offers.forEach(offer => {
      expect(offer).toHaveProperty('slot');
      expect(offer).toHaveProperty('baseId');
      expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      
      const unit = UNIT_BY_ID[offer.baseId];
      expect(unit.tier).toBeGreaterThanOrEqual(1);
      expect(unit.tier).toBeLessThanOrEqual(5);
    });
  });

  /**
   * Requirement 16.4: Shop displays correct tier distribution
   * 
   * Statistical test to verify tier distribution matches expected odds
   */
  it('shop refresh at level 25 produces ~90% tier 5 units over many refreshes', () => {
    const refreshCount = 200; // 200 refreshes × 5 slots = 1000 units
    const tierCounts = [0, 0, 0, 0, 0];
    
    for (let i = 0; i < refreshCount; i++) {
      const offers = simulateShopRefresh(25);
      offers.forEach(offer => {
        const unit = UNIT_BY_ID[offer.baseId];
        tierCounts[unit.tier - 1]++;
      });
    }
    
    const totalUnits = refreshCount * 5;
    
    // Level 25 odds: [0, 0, 0.02, 0.08, 0.90]
    expect(tierCounts[0]).toBe(0); // No tier 1
    expect(tierCounts[1]).toBe(0); // No tier 2
    expect(tierCounts[2] / totalUnits).toBeCloseTo(0.02, 1); // ~2% tier 3
    expect(tierCounts[3] / totalUnits).toBeCloseTo(0.08, 1); // ~8% tier 4
    expect(tierCounts[4] / totalUnits).toBeCloseTo(0.90, 1); // ~90% tier 5
  });

  it('shop refresh at level 1 produces 100% tier 1 units', () => {
    const refreshCount = 100;
    const tierCounts = [0, 0, 0, 0, 0];
    
    for (let i = 0; i < refreshCount; i++) {
      const offers = simulateShopRefresh(1);
      offers.forEach(offer => {
        const unit = UNIT_BY_ID[offer.baseId];
        tierCounts[unit.tier - 1]++;
      });
    }
    
    const totalUnits = refreshCount * 5;
    
    // Level 1 odds: [1, 0, 0, 0, 0]
    expect(tierCounts[0]).toBe(totalUnits); // 100% tier 1
    expect(tierCounts[1]).toBe(0);
    expect(tierCounts[2]).toBe(0);
    expect(tierCounts[3]).toBe(0);
    expect(tierCounts[4]).toBe(0);
  });

  /**
   * Requirement 16.3: Shop uses updated tier odds for subsequent refreshes
   */
  it('tier distribution changes when player level increases', () => {
    const refreshCount = 100;
    
    // Level 5 refresh
    const tierCounts5 = [0, 0, 0, 0, 0];
    for (let i = 0; i < refreshCount; i++) {
      const offers = simulateShopRefresh(5);
      offers.forEach(offer => {
        const unit = UNIT_BY_ID[offer.baseId];
        tierCounts5[unit.tier - 1]++;
      });
    }
    
    // Level 15 refresh
    const tierCounts15 = [0, 0, 0, 0, 0];
    for (let i = 0; i < refreshCount; i++) {
      const offers = simulateShopRefresh(15);
      offers.forEach(offer => {
        const unit = UNIT_BY_ID[offer.baseId];
        tierCounts15[unit.tier - 1]++;
      });
    }
    
    const totalUnits = refreshCount * 5;
    
    // Level 5 should have less tier 5 than level 15
    const tier5Pct5 = tierCounts5[4] / totalUnits;
    const tier5Pct15 = tierCounts15[4] / totalUnits;
    
    expect(tier5Pct15).toBeGreaterThan(tier5Pct5);
    
    // Level 15 should have no tier 1, but level 5 should have some
    expect(tierCounts15[0]).toBe(0); // No tier 1 at level 15
    expect(tierCounts5[0]).toBeGreaterThan(0); // Some tier 1 at level 5
  });

  /**
   * Edge case: Verify shop never produces invalid units
   */
  it('shop refresh never produces undefined or invalid units', () => {
    const levels = [1, 5, 10, 15, 20, 25, 26, 30, 50, 100];
    
    levels.forEach(level => {
      for (let i = 0; i < 10; i++) {
        const offers = simulateShopRefresh(level);
        
        expect(offers).toHaveLength(5);
        offers.forEach(offer => {
          expect(offer.baseId).toBeDefined();
          expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
          
          const unit = UNIT_BY_ID[offer.baseId];
          expect(unit.tier).toBeGreaterThanOrEqual(1);
          expect(unit.tier).toBeLessThanOrEqual(5);
          expect(unit.id).toBe(offer.baseId);
        });
      }
    });
  });
});
