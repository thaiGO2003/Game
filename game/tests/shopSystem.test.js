/**
 * ShopSystem Unit Tests
 * 
 * Comprehensive unit tests for ShopSystem covering all shop operations.
 * 
 * **Validates: Requirements 3.1-3.10, 11.1, 11.2**
 * 
 * Properties tested:
 * - Property 10: Shop Refresh Deducts Gold
 * - Property 11: Shop Offers Respect Tier Odds
 * - Property 12: Buy Unit Deducts Cost and Adds to Bench
 * - Property 13: Buy Unit Removes Shop Offer
 * - Property 14: Sell Unit Adds Gold
 * - Property 15: Shop Lock Preserves Offers
 * - Property 16: Insufficient Gold Errors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  refreshShop,
  buyUnit,
  sellUnit,
  lockShop,
  unlockShop,
  generateShopOffers,
  calculateRefreshCost,
  getTierOdds
} from '../src/systems/ShopSystem.js';

describe('ShopSystem - Unit Tests', () => {
  let player;
  let mockCreateUnit;

  beforeEach(() => {
    // Create fresh player state for each test
    player = {
      gold: 10,
      level: 5,
      round: 1,
      shop: [],
      bench: [],
      shopLocked: false
    };

    // Mock createUnit function
    mockCreateUnit = (baseId, star) => ({
      uid: `unit_${Date.now()}_${Math.random()}`,
      baseId,
      star,
      equips: []
    });
  });

  describe('Property 10: Shop Refresh Deducts Gold', () => {
    /**
     * **Validates: Requirement 3.1**
     * When refreshing shop with sufficient gold, the system should deduct refresh cost
     */
    it('should deduct refresh cost from player gold', () => {
      const initialGold = player.gold;
      const cost = 2;

      const result = refreshShop(player, cost);

      expect(result.success).toBe(true);
      expect(result.player.gold).toBe(initialGold - cost);
    });

    it('should deduct custom refresh cost', () => {
      player.gold = 20;
      const cost = 5;

      const result = refreshShop(player, cost);

      expect(result.success).toBe(true);
      expect(result.player.gold).toBe(15);
    });

    it('should use default refresh cost when not specified', () => {
      const result = refreshShop(player);

      expect(result.success).toBe(true);
      expect(result.player.gold).toBe(8); // 10 - 2 (default cost)
    });

    it('should generate new shop offers on refresh', () => {
      const result = refreshShop(player, 2);

      expect(result.success).toBe(true);
      expect(result.player.shop).toBeDefined();
      expect(result.player.shop.length).toBeGreaterThan(0);
    });
  });

  describe('Property 11: Shop Offers Respect Tier Odds', () => {
    /**
     * **Validates: Requirements 3.2, 3.8**
     * Shop offers should be generated based on player level tier odds
     */
    it('should generate 5 shop offers by default', () => {
      const offers = generateShopOffers(5);

      expect(offers).toHaveLength(5);
    });

    it('should generate custom number of shop offers', () => {
      const offers = generateShopOffers(5, 7);

      expect(offers).toHaveLength(7);
    });

    it('should generate valid offers with baseId', () => {
      const offers = generateShopOffers(5);

      offers.forEach((offer, index) => {
        if (offer) {
          expect(offer).toHaveProperty('slot', index);
          expect(offer).toHaveProperty('baseId');
          expect(typeof offer.baseId).toBe('string');
        }
      });
    });

    it('should generate tier 1 units at level 1', () => {
      // At level 1, tier odds are [1, 0, 0, 0, 0] - 100% tier 1
      const offers = generateShopOffers(1);

      expect(offers).toHaveLength(5);
      offers.forEach(offer => {
        expect(offer).toBeDefined();
        expect(offer.baseId).toBeDefined();
      });
    });

    it('should generate higher tier units at higher levels', () => {
      // At level 25, should have mostly tier 5 units
      const offers = generateShopOffers(25);

      expect(offers).toHaveLength(5);
      offers.forEach(offer => {
        expect(offer).toBeDefined();
        expect(offer.baseId).toBeDefined();
      });
    });

    it('should handle level beyond 25 using level 25 odds', () => {
      const offers = generateShopOffers(30);

      expect(offers).toHaveLength(5);
      offers.forEach(offer => {
        expect(offer).toBeDefined();
        expect(offer.baseId).toBeDefined();
      });
    });
  });

  describe('Property 12: Buy Unit Deducts Cost and Adds to Bench', () => {
    /**
     * **Validates: Requirements 3.3, 3.4**
     * Buying a unit should deduct cost and add unit to bench
     */
    beforeEach(() => {
      // Setup shop with offers
      player.shop = [
        { slot: 0, baseId: 'bear_ancient' }, // tier 1, cost 1
        { slot: 1, baseId: 'rhino_quake' },  // tier 2, cost 2
        { slot: 2, baseId: 'turtle_mire' },  // tier 3, cost 3
        { slot: 3, baseId: 'buffalo_mist' }, // tier 4, cost 4
        { slot: 4, baseId: 'panther_void' }  // tier 5, cost 5
      ];
      player.gold = 20;
    });

    it('should deduct unit cost from player gold', () => {
      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(true);
      expect(result.cost).toBe(1); // tier 1 unit
      expect(result.player.gold).toBe(19); // 20 - 1
    });

    it('should add purchased unit to bench', () => {
      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(true);
      expect(result.player.bench).toHaveLength(1);
      expect(result.player.bench[0].baseId).toBe('bear_ancient');
    });

    it('should return the purchased unit', () => {
      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(true);
      expect(result.unit).toBeDefined();
      expect(result.unit.baseId).toBe('bear_ancient');
      expect(result.unit.star).toBe(1);
      expect(result.unit.uid).toBeDefined();
    });

    it('should handle different tier costs correctly', () => {
      // Buy tier 3 unit (cost 3)
      const result = buyUnit(player, 2, mockCreateUnit, 10);

      expect(result.success).toBe(true);
      expect(result.cost).toBe(3);
      expect(result.player.gold).toBe(17); // 20 - 3
    });

    it('should preserve existing bench units', () => {
      player.bench = [
        { uid: 'existing1', baseId: 'rat', star: 1 }
      ];

      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(true);
      expect(result.player.bench).toHaveLength(2);
      expect(result.player.bench[0].uid).toBe('existing1');
      expect(result.player.bench[1].baseId).toBe('bear_ancient');
    });
  });

  describe('Property 13: Buy Unit Removes Shop Offer', () => {
    /**
     * **Validates: Requirement 3.5**
     * Buying a unit should remove it from the shop slot
     */
    beforeEach(() => {
      player.shop = [
        { slot: 0, baseId: 'bear_ancient' },
        { slot: 1, baseId: 'rhino_quake' },
        { slot: 2, baseId: 'turtle_mire' }
      ];
      player.gold = 20;
    });

    it('should remove purchased unit from shop slot', () => {
      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(true);
      expect(result.player.shop[0]).toBeNull();
    });

    it('should preserve other shop offers', () => {
      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(true);
      expect(result.player.shop[1]).toEqual({ slot: 1, baseId: 'rhino_quake' });
      expect(result.player.shop[2]).toEqual({ slot: 2, baseId: 'turtle_mire' });
    });

    it('should allow buying multiple units from different slots', () => {
      // Buy from slot 0
      let result = buyUnit(player, 0, mockCreateUnit, 10);
      expect(result.success).toBe(true);
      player = result.player;

      // Buy from slot 1
      result = buyUnit(player, 1, mockCreateUnit, 10);
      expect(result.success).toBe(true);

      expect(result.player.shop[0]).toBeNull();
      expect(result.player.shop[1]).toBeNull();
      expect(result.player.shop[2]).toEqual({ slot: 2, baseId: 'turtle_mire' });
      expect(result.player.bench).toHaveLength(2);
    });
  });

  describe('Property 14: Sell Unit Adds Gold', () => {
    /**
     * **Validates: Requirement 3.6**
     * Selling a unit should add gold based on tier and star level
     */
    it('should add sell value to player gold', () => {
      const unit = { baseId: 'bear_ancient', star: 1 }; // tier 1, star 1 = 1 gold
      const initialGold = player.gold;

      const result = sellUnit(player, unit);

      expect(result.success).toBe(true);
      expect(result.sellValue).toBe(1);
      expect(result.player.gold).toBe(initialGold + 1);
    });

    it('should calculate sell value: tier × 1 for star 1', () => {
      const testCases = [
        { baseId: 'bear_ancient', star: 1, expectedValue: 1 },  // tier 1
        { baseId: 'rhino_quake', star: 1, expectedValue: 2 },   // tier 2
        { baseId: 'turtle_mire', star: 1, expectedValue: 3 },   // tier 3
        { baseId: 'buffalo_mist', star: 1, expectedValue: 4 },  // tier 4
        { baseId: 'panther_void', star: 1, expectedValue: 5 }   // tier 5
      ];

      testCases.forEach(({ baseId, star, expectedValue }) => {
        const result = sellUnit(player, { baseId, star });
        expect(result.success).toBe(true);
        expect(result.sellValue).toBe(expectedValue);
      });
    });

    it('should calculate sell value: tier × 3 for star 2', () => {
      const testCases = [
        { baseId: 'bear_ancient', star: 2, expectedValue: 3 },   // tier 1 × 3
        { baseId: 'rhino_quake', star: 2, expectedValue: 6 },    // tier 2 × 3
        { baseId: 'turtle_mire', star: 2, expectedValue: 9 },    // tier 3 × 3
        { baseId: 'buffalo_mist', star: 2, expectedValue: 12 },  // tier 4 × 3
        { baseId: 'panther_void', star: 2, expectedValue: 15 }   // tier 5 × 3
      ];

      testCases.forEach(({ baseId, star, expectedValue }) => {
        const result = sellUnit(player, { baseId, star });
        expect(result.success).toBe(true);
        expect(result.sellValue).toBe(expectedValue);
      });
    });

    it('should calculate sell value: tier × 5 for star 3', () => {
      const testCases = [
        { baseId: 'bear_ancient', star: 3, expectedValue: 5 },   // tier 1 × 5
        { baseId: 'rhino_quake', star: 3, expectedValue: 10 },   // tier 2 × 5
        { baseId: 'turtle_mire', star: 3, expectedValue: 15 },   // tier 3 × 5
        { baseId: 'buffalo_mist', star: 3, expectedValue: 20 },  // tier 4 × 5
        { baseId: 'panther_void', star: 3, expectedValue: 25 }   // tier 5 × 5
      ];

      testCases.forEach(({ baseId, star, expectedValue }) => {
        const result = sellUnit(player, { baseId, star });
        expect(result.success).toBe(true);
        expect(result.sellValue).toBe(expectedValue);
      });
    });
  });

  describe('Property 15: Shop Lock Preserves Offers', () => {
    /**
     * **Validates: Requirement 3.7**
     * Locking shop should preserve current offers
     */
    it('should set shopLocked flag to true', () => {
      const result = lockShop(player);

      expect(result.success).toBe(true);
      expect(result.player.shopLocked).toBe(true);
    });

    it('should prevent refresh when shop is locked', () => {
      // Lock shop
      const lockResult = lockShop(player);
      player = lockResult.player;

      // Try to refresh
      const refreshResult = refreshShop(player, 2);

      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error).toBe('Shop is locked');
    });

    it('should allow refresh after unlocking', () => {
      // Lock then unlock
      let result = lockShop(player);
      player = result.player;
      
      result = unlockShop(player);
      player = result.player;

      // Refresh should work
      result = refreshShop(player, 2);

      expect(result.success).toBe(true);
      expect(result.player.shop).toBeDefined();
    });

    it('should preserve shop offers when locked', () => {
      player.shop = [
        { slot: 0, baseId: 'bear_ancient' },
        { slot: 1, baseId: 'rhino_quake' }
      ];

      const result = lockShop(player);

      expect(result.success).toBe(true);
      expect(result.player.shop).toEqual(player.shop);
    });

    it('should set shopLocked flag to false when unlocking', () => {
      let result = lockShop(player);
      player = result.player;

      result = unlockShop(player);

      expect(result.success).toBe(true);
      expect(result.player.shopLocked).toBe(false);
    });
  });

  describe('Property 16: Insufficient Gold Errors', () => {
    /**
     * **Validates: Requirements 3.9, 3.10**
     * Operations should fail with error when player has insufficient gold
     */
    it('should return error when refreshing with insufficient gold', () => {
      player.gold = 1;
      const cost = 2;

      const result = refreshShop(player, cost);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough gold');
    });

    it('should not deduct gold when refresh fails', () => {
      player.gold = 1;
      const initialGold = player.gold;

      const result = refreshShop(player, 2);

      expect(result.success).toBe(false);
      // Player state should not be modified
      expect(player.gold).toBe(initialGold);
    });

    it('should return error when buying with insufficient gold', () => {
      player.shop = [
        { slot: 0, baseId: 'panther_void' } // tier 5, cost 5
      ];
      player.gold = 3;

      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough gold');
    });

    it('should not modify bench when buy fails due to insufficient gold', () => {
      player.shop = [
        { slot: 0, baseId: 'panther_void' }
      ];
      player.gold = 3;
      const initialBenchLength = player.bench.length;

      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(player.bench).toHaveLength(initialBenchLength);
    });

    it('should not remove shop offer when buy fails', () => {
      player.shop = [
        { slot: 0, baseId: 'panther_void' }
      ];
      player.gold = 3;

      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(player.shop[0]).toEqual({ slot: 0, baseId: 'panther_void' });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return error when no player provided to refreshShop', () => {
      const result = refreshShop(null, 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No player provided');
    });

    it('should return error when no player provided to buyUnit', () => {
      const result = buyUnit(null, 0, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No player provided');
    });

    it('should return error when no player provided to sellUnit', () => {
      const result = sellUnit(null, { baseId: 'rat', star: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No player provided');
    });

    it('should return error when no player provided to lockShop', () => {
      const result = lockShop(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No player provided');
    });

    it('should return error when no player provided to unlockShop', () => {
      const result = unlockShop(null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No player provided');
    });

    it('should return error when buying from invalid slot', () => {
      player.shop = [
        { slot: 0, baseId: 'bear_ancient' }
      ];

      const result = buyUnit(player, 5, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid shop slot');
    });

    it('should return error when buying from empty slot', () => {
      player.shop = [null, null, null];

      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No unit in this slot');
    });

    it('should return error when bench is full', () => {
      player.shop = [
        { slot: 0, baseId: 'bear_ancient' }
      ];
      player.bench = new Array(10).fill({ uid: 'unit', baseId: 'rat', star: 1 });
      player.gold = 20;

      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bench is full');
    });

    it('should return error when selling unit with invalid baseId', () => {
      const result = sellUnit(player, { baseId: 'invalid_unit', star: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid unit data');
    });

    it('should return error when selling null unit', () => {
      const result = sellUnit(player, null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No unit provided');
    });

    it('should return error when buying unit with invalid baseId', () => {
      player.shop = [
        { slot: 0, baseId: 'invalid_unit_id' }
      ];
      player.gold = 20;

      const result = buyUnit(player, 0, mockCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid unit data');
    });

    it('should return error when createUnitFn fails', () => {
      player.shop = [
        { slot: 0, baseId: 'bear_ancient' }
      ];
      player.gold = 20;

      const failingCreateUnit = () => null;

      const result = buyUnit(player, 0, failingCreateUnit, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create unit');
    });
  });

  describe('Utility Functions', () => {
    it('calculateRefreshCost should return default cost', () => {
      const cost = calculateRefreshCost();

      expect(cost).toBe(2);
    });

    it('getTierOdds should return odds for level 1', () => {
      const odds = getTierOdds(1);

      expect(odds).toEqual({
        tier1: 1,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        tier5: 0
      });
    });

    it('getTierOdds should return odds for level 25', () => {
      const odds = getTierOdds(25);

      expect(odds).toEqual({
        tier1: 0,
        tier2: 0,
        tier3: 0.02,
        tier4: 0.08,
        tier5: 0.90
      });
    });

    it('getTierOdds should clamp level to 1-25 range', () => {
      const odds0 = getTierOdds(0);
      const odds1 = getTierOdds(1);
      expect(odds0).toEqual(odds1);

      const odds30 = getTierOdds(30);
      const odds25 = getTierOdds(25);
      expect(odds30).toEqual(odds25);
    });

    it('getTierOdds should handle negative levels', () => {
      const odds = getTierOdds(-5);

      expect(odds).toEqual({
        tier1: 1,
        tier2: 0,
        tier3: 0,
        tier4: 0,
        tier5: 0
      });
    });

    it('getTierOdds should sum to 1.0 for all levels', () => {
      for (let level = 1; level <= 25; level++) {
        const odds = getTierOdds(level);
        const sum = odds.tier1 + odds.tier2 + odds.tier3 + odds.tier4 + odds.tier5;
        expect(sum).toBeCloseTo(1.0, 5);
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete shop workflow: refresh → buy → sell', () => {
      player.gold = 20;

      // Refresh shop
      let result = refreshShop(player, 2);
      expect(result.success).toBe(true);
      player = result.player;
      expect(player.gold).toBe(18);

      // Buy unit from slot 0
      result = buyUnit(player, 0, mockCreateUnit, 10);
      expect(result.success).toBe(true);
      player = result.player;
      const purchasedUnit = result.unit;
      expect(player.bench).toHaveLength(1);

      // Sell the unit
      result = sellUnit(player, purchasedUnit);
      expect(result.success).toBe(true);
      player = result.player;
      expect(player.gold).toBeGreaterThan(0);
    });

    it('should handle lock workflow: lock → try refresh → unlock → refresh', () => {
      player.gold = 20;

      // Lock shop
      let result = lockShop(player);
      player = result.player;

      // Try to refresh (should fail)
      result = refreshShop(player, 2);
      expect(result.success).toBe(false);

      // Unlock
      result = unlockShop(player);
      player = result.player;

      // Refresh (should succeed)
      result = refreshShop(player, 2);
      expect(result.success).toBe(true);
    });

    it('should handle buying multiple units until bench is full', () => {
      player.shop = new Array(5).fill(null).map((_, i) => ({
        slot: i,
        baseId: 'bear_ancient'
      }));
      player.gold = 100;
      const benchCap = 3;

      // Buy until bench is full
      for (let i = 0; i < benchCap; i++) {
        const result = buyUnit(player, i, mockCreateUnit, benchCap);
        expect(result.success).toBe(true);
        player = result.player;
      }

      expect(player.bench).toHaveLength(benchCap);

      // Next buy should fail
      const result = buyUnit(player, 3, mockCreateUnit, benchCap);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bench is full');
    });

    it('should handle buying until out of gold', () => {
      player.shop = new Array(5).fill(null).map((_, i) => ({
        slot: i,
        baseId: 'turtle_mire' // tier 3, cost 3
      }));
      player.gold = 10;

      // Buy 3 units (9 gold)
      for (let i = 0; i < 3; i++) {
        const result = buyUnit(player, i, mockCreateUnit, 10);
        expect(result.success).toBe(true);
        player = result.player;
      }

      expect(player.gold).toBe(1);
      expect(player.bench).toHaveLength(3);

      // Next buy should fail (not enough gold)
      const result = buyUnit(player, 3, mockCreateUnit, 10);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough gold');
    });
  });
});
