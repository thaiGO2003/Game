/**
 * Shop Lock/Unlock Integration Tests
 * 
 * **Validates: Requirements 11.1, 11.2, 11.3**
 * 
 * Tests shop lock/unlock functionality that will be extracted to ShopSystem:
 * - Lock shop to preserve offers
 * - Unlock shop to allow refresh
 * - Offers persist across rounds when locked
 * - Lock state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { rollTierForLevel, randomItem } from '../src/core/gameUtils.js';
import { UNIT_CATALOG, UNIT_BY_ID } from '../src/data/unitCatalog.js';

/**
 * Mock Shop System with Lock/Unlock
 */
class MockShopSystem {
  constructor(player) {
    this.player = player;
    this.offers = [];
    this.locked = false;
    this.refreshCost = 1;
  }

  generateOffers() {
    const offers = [];
    for (let i = 0; i < 5; i += 1) {
      const tier = rollTierForLevel(this.player.level);
      const pool = UNIT_CATALOG.filter((u) => u.tier === tier);
      const fallback = UNIT_CATALOG.filter((u) => u.tier <= tier);
      const base = randomItem(pool.length ? pool : fallback.length ? fallback : UNIT_CATALOG);
      
      if (base) {
        offers.push({
          slot: i,
          baseId: base.id,
          tier: base.tier,
          cost: base.tier
        });
      }
    }
    return offers;
  }

  refresh(forceRoll = false) {
    // If locked and not forced, keep current offers
    if (this.locked && !forceRoll) {
      return { success: false, error: 'Shop is locked' };
    }

    // Check gold for refresh cost
    if (this.player.gold < this.refreshCost) {
      return { success: false, error: 'Not enough gold' };
    }

    // Deduct gold and generate new offers
    this.player.gold -= this.refreshCost;
    this.offers = this.generateOffers();
    
    return { success: true, offers: this.offers };
  }

  lock() {
    this.locked = true;
    return { success: true };
  }

  unlock() {
    this.locked = false;
    return { success: true };
  }

  toggleLock() {
    this.locked = !this.locked;
    return { success: true, locked: this.locked };
  }

  isLocked() {
    return this.locked;
  }

  buyUnit(slot) {
    const offer = this.offers[slot];
    if (!offer) {
      return { success: false, error: 'Invalid slot' };
    }

    if (this.player.gold < offer.cost) {
      return { success: false, error: 'Not enough gold' };
    }

    // Deduct gold and add unit to bench
    this.player.gold -= offer.cost;
    const unit = UNIT_BY_ID[offer.baseId];
    this.player.benchUnits.push({ ...unit });

    // Remove offer from slot
    this.offers[slot] = null;

    return { success: true, unit };
  }

  // Simulate advancing to next round
  advanceRound() {
    this.player.round += 1;
    
    // If not locked, auto-refresh shop
    if (!this.locked) {
      this.offers = this.generateOffers();
    }
    // If locked, keep current offers
  }
}

// Helper to create mock player
function createMockPlayer() {
  return {
    level: 5,
    gold: 20,
    round: 1,
    benchUnits: []
  };
}

describe('Shop Lock/Unlock Integration Tests', () => {
  let player;
  let shop;

  beforeEach(() => {
    player = createMockPlayer();
    shop = new MockShopSystem(player);
  });

  describe('Lock/Unlock basic operations', () => {
    it('should start with shop unlocked', () => {
      expect(shop.isLocked()).toBe(false);
    });

    it('should lock shop', () => {
      const result = shop.lock();
      
      expect(result.success).toBe(true);
      expect(shop.isLocked()).toBe(true);
    });

    it('should unlock shop', () => {
      shop.lock();
      expect(shop.isLocked()).toBe(true);
      
      const result = shop.unlock();
      
      expect(result.success).toBe(true);
      expect(shop.isLocked()).toBe(false);
    });

    it('should toggle lock state', () => {
      expect(shop.isLocked()).toBe(false);
      
      let result = shop.toggleLock();
      expect(result.success).toBe(true);
      expect(result.locked).toBe(true);
      expect(shop.isLocked()).toBe(true);
      
      result = shop.toggleLock();
      expect(result.success).toBe(true);
      expect(result.locked).toBe(false);
      expect(shop.isLocked()).toBe(false);
    });
  });

  describe('Locked shop behavior', () => {
    it('should prevent refresh when locked', () => {
      // Generate initial offers
      shop.refresh();
      const initialOffers = [...shop.offers];
      
      // Lock shop
      shop.lock();
      
      // Try to refresh
      const result = shop.refresh();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Shop is locked');
      expect(shop.offers).toEqual(initialOffers);
    });

    it('should allow refresh when unlocked', () => {
      // Generate initial offers
      shop.refresh();
      const initialOffers = [...shop.offers];
      
      // Lock then unlock
      shop.lock();
      shop.unlock();
      
      // Refresh should work
      const result = shop.refresh();
      
      expect(result.success).toBe(true);
      expect(result.offers).toBeDefined();
      // Offers should be different (statistically)
      expect(result.offers).not.toEqual(initialOffers);
    });

    it('should allow forced refresh even when locked', () => {
      // Generate initial offers
      shop.refresh();
      const initialOffers = [...shop.offers];
      
      // Lock shop
      shop.lock();
      
      // Force refresh
      const result = shop.refresh(true);
      
      expect(result.success).toBe(true);
      expect(result.offers).toBeDefined();
    });

    it('should still allow buying units when locked', () => {
      // Generate offers and lock
      shop.refresh();
      const offer = shop.offers[0];
      shop.lock();
      
      const initialGold = player.gold;
      
      // Buy unit
      const result = shop.buyUnit(0);
      
      expect(result.success).toBe(true);
      expect(result.unit).toBeDefined();
      expect(player.gold).toBe(initialGold - offer.cost);
      expect(player.benchUnits).toHaveLength(1);
    });
  });

  describe('Offers persistence across rounds', () => {
    it('should preserve offers when locked and advancing round', () => {
      // Generate initial offers
      shop.refresh();
      const initialOffers = shop.offers.map(o => o ? o.baseId : null);
      
      // Lock shop
      shop.lock();
      
      // Advance to next round
      shop.advanceRound();
      
      // Offers should be preserved
      const currentOffers = shop.offers.map(o => o ? o.baseId : null);
      expect(currentOffers).toEqual(initialOffers);
      expect(player.round).toBe(2);
    });

    it('should refresh offers when unlocked and advancing round', () => {
      // Generate initial offers
      shop.refresh();
      const initialOffers = shop.offers.map(o => o ? o.baseId : null);
      
      // Keep shop unlocked
      expect(shop.isLocked()).toBe(false);
      
      // Advance to next round
      shop.advanceRound();
      
      // Offers should be different (new refresh)
      const currentOffers = shop.offers.map(o => o ? o.baseId : null);
      // Statistically, offers should be different
      expect(currentOffers).not.toEqual(initialOffers);
      expect(player.round).toBe(2);
    });

    it('should preserve offers across multiple rounds when locked', () => {
      // Generate initial offers
      shop.refresh();
      const initialOffers = shop.offers.map(o => o ? o.baseId : null);
      
      // Lock shop
      shop.lock();
      
      // Advance multiple rounds
      for (let i = 0; i < 5; i++) {
        shop.advanceRound();
      }
      
      // Offers should still be preserved
      const currentOffers = shop.offers.map(o => o ? o.baseId : null);
      expect(currentOffers).toEqual(initialOffers);
      expect(player.round).toBe(6);
    });

    it('should preserve partially bought offers when locked', () => {
      // Generate offers
      shop.refresh();
      const slot0Offer = shop.offers[0];
      const slot1Offer = shop.offers[1];
      
      // Buy unit from slot 0
      shop.buyUnit(0);
      expect(shop.offers[0]).toBeNull();
      
      // Lock shop
      shop.lock();
      
      // Advance round
      shop.advanceRound();
      
      // Slot 0 should still be empty, slot 1 should be preserved
      expect(shop.offers[0]).toBeNull();
      expect(shop.offers[1]).toBeDefined();
      expect(shop.offers[1].baseId).toBe(slot1Offer.baseId);
    });
  });

  describe('Lock state management', () => {
    it('should maintain lock state across operations', () => {
      shop.lock();
      
      // Try various operations
      shop.refresh(); // Should fail
      shop.buyUnit(0); // Should work
      shop.advanceRound(); // Should preserve offers
      
      // Lock should still be active
      expect(shop.isLocked()).toBe(true);
    });

    it('should unlock and allow normal operations', () => {
      // Lock then unlock
      shop.lock();
      shop.unlock();
      
      // Refresh should work
      const result = shop.refresh();
      expect(result.success).toBe(true);
      
      // Advancing round should refresh offers
      const offersBeforeRound = shop.offers.map(o => o ? o.baseId : null);
      shop.advanceRound();
      const offersAfterRound = shop.offers.map(o => o ? o.baseId : null);
      
      expect(offersAfterRound).not.toEqual(offersBeforeRound);
    });

    it('should handle lock/unlock cycles', () => {
      shop.refresh();
      const offers1 = shop.offers.map(o => o ? o.baseId : null);
      
      // Lock
      shop.lock();
      shop.advanceRound();
      const offers2 = shop.offers.map(o => o ? o.baseId : null);
      expect(offers2).toEqual(offers1); // Preserved
      
      // Unlock
      shop.unlock();
      shop.advanceRound();
      const offers3 = shop.offers.map(o => o ? o.baseId : null);
      expect(offers3).not.toEqual(offers2); // Refreshed
      
      // Lock again
      shop.lock();
      shop.advanceRound();
      const offers4 = shop.offers.map(o => o ? o.baseId : null);
      expect(offers4).toEqual(offers3); // Preserved again
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle locking empty shop', () => {
      expect(shop.offers).toHaveLength(0);
      
      const result = shop.lock();
      expect(result.success).toBe(true);
      expect(shop.isLocked()).toBe(true);
    });

    it('should handle unlocking already unlocked shop', () => {
      expect(shop.isLocked()).toBe(false);
      
      const result = shop.unlock();
      expect(result.success).toBe(true);
      expect(shop.isLocked()).toBe(false);
    });

    it('should handle locking already locked shop', () => {
      shop.lock();
      expect(shop.isLocked()).toBe(true);
      
      const result = shop.lock();
      expect(result.success).toBe(true);
      expect(shop.isLocked()).toBe(true);
    });

    it('should not deduct gold when refresh fails due to lock', () => {
      shop.refresh(); // Initial refresh
      const goldAfterFirstRefresh = player.gold;
      
      shop.lock();
      
      const result = shop.refresh();
      
      expect(result.success).toBe(false);
      expect(player.gold).toBe(goldAfterFirstRefresh); // Gold unchanged
    });

    it('should handle buying all units then locking', () => {
      shop.refresh();
      
      // Buy all units
      for (let i = 0; i < 5; i++) {
        if (shop.offers[i]) {
          shop.buyUnit(i);
        }
      }
      
      // All slots should be empty
      expect(shop.offers.every(o => o === null)).toBe(true);
      
      // Lock shop
      shop.lock();
      
      // Advance round
      shop.advanceRound();
      
      // Offers should still be empty (preserved)
      expect(shop.offers.every(o => o === null)).toBe(true);
    });
  });

  describe('Integration with player progression', () => {
    it('should preserve locked offers when player levels up', () => {
      player.level = 5;
      shop.refresh();
      const offersAtLevel5 = shop.offers.map(o => o ? o.baseId : null);
      
      shop.lock();
      
      // Player levels up
      player.level = 10;
      shop.advanceRound();
      
      // Offers should still be from level 5 (preserved)
      const currentOffers = shop.offers.map(o => o ? o.baseId : null);
      expect(currentOffers).toEqual(offersAtLevel5);
    });

    it('should use new level tier odds after unlocking', () => {
      player.level = 5;
      shop.refresh();
      
      shop.lock();
      player.level = 15;
      shop.advanceRound();
      
      // Unlock and refresh
      shop.unlock();
      shop.refresh();
      
      // New offers should use level 15 tier odds
      const tiers = shop.offers.map(o => o ? o.tier : 0);
      const maxTier = Math.max(...tiers);
      
      // Level 15 should have higher tier units than level 5
      expect(maxTier).toBeGreaterThanOrEqual(3);
    });

    it('should handle lock across multiple rounds with gold changes', () => {
      shop.refresh();
      const initialOffers = shop.offers.map(o => o ? o.baseId : null);
      
      shop.lock();
      
      // Simulate multiple rounds with gold changes
      for (let i = 0; i < 3; i++) {
        player.gold += 10; // Gain gold each round
        shop.advanceRound();
      }
      
      // Offers should be preserved despite gold changes
      const currentOffers = shop.offers.map(o => o ? o.baseId : null);
      expect(currentOffers).toEqual(initialOffers);
      expect(player.gold).toBeGreaterThan(20); // Gold increased
    });
  });

  describe('Real game scenario simulation', () => {
    it('should simulate typical lock/unlock workflow', () => {
      // Round 1: Refresh shop
      shop.refresh();
      const round1Offers = shop.offers.map(o => o ? o.baseId : null);
      
      // Player likes the offers, locks shop
      shop.lock();
      
      // Buy a unit
      shop.buyUnit(0);
      expect(shop.offers[0]).toBeNull();
      
      // Advance to round 2 (offers preserved)
      shop.advanceRound();
      expect(player.round).toBe(2);
      expect(shop.offers[1].baseId).toBe(round1Offers[1]);
      
      // Buy another unit
      shop.buyUnit(1);
      
      // Advance to round 3 (still locked)
      shop.advanceRound();
      expect(player.round).toBe(3);
      
      // Player wants new offers, unlocks
      shop.unlock();
      
      // Advance to round 4 (new offers)
      shop.advanceRound();
      expect(player.round).toBe(4);
      const round4Offers = shop.offers.map(o => o ? o.baseId : null);
      
      // Offers should be different from round 1
      expect(round4Offers).not.toEqual(round1Offers);
    });

    it('should handle strategic locking for expensive units', () => {
      player.level = 15;
      player.gold = 5;
      
      // Refresh shop
      shop.refresh();
      
      // Find expensive unit (tier 4 or 5)
      const expensiveSlot = shop.offers.findIndex(o => o && o.tier >= 4);
      
      if (expensiveSlot !== -1) {
        const expensiveOffer = shop.offers[expensiveSlot];
        
        // Not enough gold, lock shop to save offer
        shop.lock();
        
        // Advance rounds to accumulate gold
        for (let i = 0; i < 3; i++) {
          player.gold += 5;
          shop.advanceRound();
        }
        
        // Offer should still be there
        expect(shop.offers[expensiveSlot]).toBeDefined();
        expect(shop.offers[expensiveSlot].baseId).toBe(expensiveOffer.baseId);
        
        // Now have enough gold to buy
        expect(player.gold).toBeGreaterThanOrEqual(expensiveOffer.cost);
        
        const result = shop.buyUnit(expensiveSlot);
        expect(result.success).toBe(true);
      }
    });
  });
});
