/**
 * Integration Tests for Shop and Progression System
 * 
 * **Validates: Requirements 12.1, 13.1, 14.1, 16.1**
 * 
 * This test suite verifies the complete shop and progression flow works correctly with:
 * - Shop refresh using extended tier odds (levels 1-25+)
 * - Level up progression from 1 to 25+
 * - Deploy cap increase over time (max 25)
 * - XP gain and tier odds progression
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  rollTierForLevel, 
  getDeployCapByLevel, 
  getXpToLevelUp,
  randomItem 
} from '../src/core/gameUtils.js';
import { UNIT_CATALOG, UNIT_BY_ID } from '../src/data/unitCatalog.js';

/**
 * Mock Player for progression testing
 */
class MockPlayer {
  constructor() {
    this.level = 1;
    this.xp = 0;
    this.gold = 10;
    this.deployedUnits = [];
    this.benchUnits = [];
  }

  gainXp(amount) {
    this.xp += amount;
    
    // Check for level up
    while (this.level < 25) {
      const xpNeeded = getXpToLevelUp(this.level);
      if (this.xp >= xpNeeded) {
        this.xp -= xpNeeded;
        this.level += 1;
      } else {
        break;
      }
    }
    
    // Handle level 25+ (no more level ups defined)
    if (this.level >= 25) {
      const xpNeeded = getXpToLevelUp(25);
      if (xpNeeded !== Number.POSITIVE_INFINITY && this.xp >= xpNeeded) {
        this.xp = xpNeeded - 1; // Cap at max
      }
    }
  }

  getDeployCap() {
    return getDeployCapByLevel(this.level);
  }

  canDeploy() {
    return this.deployedUnits.length < this.getDeployCap();
  }

  deployUnit(unit) {
    if (this.canDeploy()) {
      this.deployedUnits.push(unit);
      return true;
    }
    return false;
  }
}

/**
 * Mock Shop System
 */
class MockShop {
  constructor(player) {
    this.player = player;
    this.offers = [];
    this.refreshCost = 1;
  }

  refresh() {
    this.offers = [];
    for (let i = 0; i < 5; i += 1) {
      const tier = rollTierForLevel(this.player.level);
      const pool = UNIT_CATALOG.filter((u) => u.tier === tier);
      const fallback = UNIT_CATALOG.filter((u) => u.tier <= tier);
      const base = randomItem(pool.length ? pool : fallback.length ? fallback : UNIT_CATALOG);
      
      if (base) {
        this.offers.push({
          slot: i,
          baseId: base.id,
          tier: base.tier,
          cost: base.tier
        });
      }
    }
    return this.offers;
  }

  buyUnit(slot) {
    const offer = this.offers[slot];
    if (!offer) return null;
    
    if (this.player.gold >= offer.cost) {
      this.player.gold -= offer.cost;
      const unit = UNIT_BY_ID[offer.baseId];
      this.player.benchUnits.push({ ...unit });
      return unit;
    }
    
    return null;
  }
}

describe('Shop and Progression Integration Tests', () => {
  let player;
  let shop;

  beforeEach(() => {
    player = new MockPlayer();
    shop = new MockShop(player);
  });

  describe('Shop refresh with new tier odds', () => {
    /**
     * **Validates: Requirements 16.1, 13.1**
     * Shop queries tier odds from Progression_System based on player level
     */
    it('should refresh shop with tier 1 units at level 1', () => {
      player.level = 1;
      const offers = shop.refresh();
      
      expect(offers).toHaveLength(5);
      offers.forEach(offer => {
        expect(offer.tier).toBe(1); // Level 1 = 100% tier 1
        expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      });
    });

    it('should refresh shop with mixed tiers at level 10', () => {
      player.level = 10;
      const offers = shop.refresh();
      
      expect(offers).toHaveLength(5);
      offers.forEach(offer => {
        expect(offer.tier).toBeGreaterThanOrEqual(1);
        expect(offer.tier).toBeLessThanOrEqual(5);
        expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      });
      
      // At level 10, should have variety of tiers
      const tiers = offers.map(o => o.tier);
      const uniqueTiers = new Set(tiers);
      expect(uniqueTiers.size).toBeGreaterThan(1); // Multiple tiers present
    });

    it('should refresh shop with mostly tier 5 units at level 25', () => {
      player.level = 25;
      const refreshCount = 20;
      let tier5Count = 0;
      let totalUnits = 0;
      
      for (let i = 0; i < refreshCount; i++) {
        const offers = shop.refresh();
        offers.forEach(offer => {
          totalUnits++;
          if (offer.tier === 5) tier5Count++;
        });
      }
      
      const tier5Percentage = tier5Count / totalUnits;
      
      // Level 25 should have ~90% tier 5 units
      expect(tier5Percentage).toBeGreaterThan(0.80); // At least 80%
      expect(tier5Percentage).toBeLessThan(0.95); // At most 95%
    });

    it('should handle shop refresh at level 26+ using level 25 odds', () => {
      player.level = 26;
      const offers = shop.refresh();
      
      expect(offers).toHaveLength(5);
      offers.forEach(offer => {
        expect(offer.tier).toBeGreaterThanOrEqual(1);
        expect(offer.tier).toBeLessThanOrEqual(5);
        expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
      });
      
      // Should behave like level 25 (mostly tier 5)
      const tier5Count = offers.filter(o => o.tier === 5).length;
      expect(tier5Count).toBeGreaterThan(0); // Should have some tier 5
    });

    it('should update shop tier distribution when player levels up', () => {
      // Start at level 5
      player.level = 5;
      const offers5 = shop.refresh();
      const tier5Count5 = offers5.filter(o => o.tier === 5).length;
      
      // Level up to 15
      player.level = 15;
      const offers15 = shop.refresh();
      const tier5Count15 = offers15.filter(o => o.tier === 5).length;
      
      // Level 15 should have more tier 5 units than level 5
      // Run multiple times to get statistical significance
      let tier5Total5 = 0;
      let tier5Total15 = 0;
      
      player.level = 5;
      for (let i = 0; i < 50; i++) {
        const offers = shop.refresh();
        tier5Total5 += offers.filter(o => o.tier === 5).length;
      }
      
      player.level = 15;
      for (let i = 0; i < 50; i++) {
        const offers = shop.refresh();
        tier5Total15 += offers.filter(o => o.tier === 5).length;
      }
      
      expect(tier5Total15).toBeGreaterThan(tier5Total5);
    });

    it('should allow buying units from shop', () => {
      player.level = 5;
      player.gold = 20;
      
      shop.refresh();
      const initialGold = player.gold;
      const offer = shop.offers[0];
      
      const unit = shop.buyUnit(0);
      
      expect(unit).toBeDefined();
      expect(player.gold).toBe(initialGold - offer.cost);
      expect(player.benchUnits).toHaveLength(1);
      expect(player.benchUnits[0].id).toBe(offer.baseId);
    });

    it('should not allow buying units without enough gold', () => {
      player.level = 5;
      player.gold = 0;
      
      shop.refresh();
      const unit = shop.buyUnit(0);
      
      expect(unit).toBeNull();
      expect(player.benchUnits).toHaveLength(0);
    });
  });

  describe('Level up from 1 to 25+', () => {
    /**
     * **Validates: Requirements 14.1, 13.1**
     * XP progression and tier odds extension
     */
    it('should level up from 1 to 2 with correct XP', () => {
      expect(player.level).toBe(1);
      expect(player.xp).toBe(0);
      
      const xpNeeded = getXpToLevelUp(1);
      expect(xpNeeded).toBe(2);
      
      player.gainXp(2);
      
      expect(player.level).toBe(2);
      expect(player.xp).toBe(0);
    });

    it('should level up from 1 to 10 with cumulative XP', () => {
      expect(player.level).toBe(1);
      
      // Calculate total XP needed to reach level 10
      let totalXpNeeded = 0;
      for (let lvl = 1; lvl < 10; lvl++) {
        totalXpNeeded += getXpToLevelUp(lvl);
      }
      
      player.gainXp(totalXpNeeded);
      
      expect(player.level).toBe(10);
    });

    it('should level up from 1 to 25 with full progression', () => {
      expect(player.level).toBe(1);
      
      // Calculate total XP needed to reach level 25
      let totalXpNeeded = 0;
      for (let lvl = 1; lvl < 25; lvl++) {
        totalXpNeeded += getXpToLevelUp(lvl);
      }
      
      player.gainXp(totalXpNeeded);
      
      expect(player.level).toBe(25);
    });

    it('should have monotonically increasing XP requirements', () => {
      const xpRequirements = [];
      for (let lvl = 1; lvl <= 25; lvl++) {
        xpRequirements.push(getXpToLevelUp(lvl));
      }
      
      // Verify each level requires more XP than the previous
      for (let i = 1; i < xpRequirements.length; i++) {
        expect(xpRequirements[i]).toBeGreaterThan(xpRequirements[i - 1]);
      }
    });

    it('should handle partial XP gains correctly', () => {
      player.level = 1;
      player.xp = 0;
      
      // Gain 1 XP (need 2 to level up)
      player.gainXp(1);
      expect(player.level).toBe(1);
      expect(player.xp).toBe(1);
      
      // Gain 1 more XP (should level up)
      player.gainXp(1);
      expect(player.level).toBe(2);
      expect(player.xp).toBe(0);
    });

    it('should handle excess XP carrying over to next level', () => {
      player.level = 1;
      player.xp = 0;
      
      // Level 1 needs 2 XP, level 2 needs 4 XP
      // Gain 5 XP total
      player.gainXp(5);
      
      expect(player.level).toBe(2);
      expect(player.xp).toBe(3); // 5 - 2 = 3 XP remaining
    });

    it('should handle multiple level ups in single XP gain', () => {
      player.level = 1;
      player.xp = 0;
      
      // Gain enough XP to jump multiple levels
      player.gainXp(50);
      
      expect(player.level).toBeGreaterThan(1);
      expect(player.level).toBeLessThanOrEqual(25);
    });
  });

  describe('Deploy cap increase over time', () => {
    /**
     * **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
     * Deploy cap progression from 3 to 25
     */
    it('should start with deploy cap of 3 at level 1', () => {
      player.level = 1;
      expect(player.getDeployCap()).toBe(3);
    });

    it('should increase deploy cap as player levels up', () => {
      const deployCapProgression = [];
      
      for (let lvl = 1; lvl <= 25; lvl++) {
        player.level = lvl;
        deployCapProgression.push(player.getDeployCap());
      }
      
      // Verify monotonic increase
      for (let i = 1; i < deployCapProgression.length; i++) {
        expect(deployCapProgression[i]).toBeGreaterThanOrEqual(deployCapProgression[i - 1]);
      }
    });

    it('should reach deploy cap of 25 at level 23', () => {
      player.level = 23;
      expect(player.getDeployCap()).toBe(25);
    });

    it('should cap deploy cap at 25 for levels 23+', () => {
      player.level = 23;
      expect(player.getDeployCap()).toBe(25);
      
      player.level = 24;
      expect(player.getDeployCap()).toBe(25);
      
      player.level = 25;
      expect(player.getDeployCap()).toBe(25);
      
      player.level = 30;
      expect(player.getDeployCap()).toBe(25);
      
      player.level = 100;
      expect(player.getDeployCap()).toBe(25);
    });

    it('should allow deploying units up to deploy cap', () => {
      player.level = 5;
      const deployCap = player.getDeployCap(); // Should be 7
      
      expect(deployCap).toBe(7);
      
      // Deploy units up to cap
      for (let i = 0; i < deployCap; i++) {
        const success = player.deployUnit({ id: `unit_${i}` });
        expect(success).toBe(true);
        expect(player.deployedUnits).toHaveLength(i + 1);
      }
      
      // Try to deploy one more (should fail)
      const success = player.deployUnit({ id: 'unit_extra' });
      expect(success).toBe(false);
      expect(player.deployedUnits).toHaveLength(deployCap);
    });

    it('should allow deploying 25 units at level 23+', () => {
      player.level = 23;
      const deployCap = player.getDeployCap();
      
      expect(deployCap).toBe(25);
      
      // Deploy 25 units
      for (let i = 0; i < 25; i++) {
        const success = player.deployUnit({ id: `unit_${i}` });
        expect(success).toBe(true);
      }
      
      expect(player.deployedUnits).toHaveLength(25);
      
      // Try to deploy 26th unit (should fail)
      const success = player.deployUnit({ id: 'unit_26' });
      expect(success).toBe(false);
      expect(player.deployedUnits).toHaveLength(25);
    });

    it('should have correct deploy cap formula: level + 2', () => {
      for (let lvl = 1; lvl <= 22; lvl++) {
        player.level = lvl;
        const expected = lvl + 2;
        expect(player.getDeployCap()).toBe(expected);
      }
    });
  });

  describe('XP gain and tier odds progression', () => {
    /**
     * **Validates: Requirements 14.1, 13.1, 16.1**
     * Complete progression flow with XP, levels, and shop
     */
    it('should show progression from early to late game', () => {
      // Early game (level 1-5)
      player.level = 1;
      expect(player.getDeployCap()).toBe(3);
      
      let offers = shop.refresh();
      let tier5Count = offers.filter(o => o.tier === 5).length;
      expect(tier5Count).toBe(0); // No tier 5 at level 1
      
      // Mid game (level 10)
      player.level = 10;
      expect(player.getDeployCap()).toBe(12);
      
      offers = shop.refresh();
      const tiers = offers.map(o => o.tier);
      expect(Math.max(...tiers)).toBeGreaterThanOrEqual(3); // Should see tier 3+
      
      // Late game (level 25)
      player.level = 25;
      expect(player.getDeployCap()).toBe(25);
      
      // Run multiple refreshes to verify tier 5 dominance
      let tier5Total = 0;
      for (let i = 0; i < 20; i++) {
        offers = shop.refresh();
        tier5Total += offers.filter(o => o.tier === 5).length;
      }
      
      const tier5Percentage = tier5Total / (20 * 5);
      expect(tier5Percentage).toBeGreaterThan(0.80); // Mostly tier 5
    });

    it('should simulate full game progression from level 1 to 25', () => {
      const progressionLog = [];
      
      player.level = 1;
      player.xp = 0;
      
      // Simulate gaining XP and leveling up
      for (let lvl = 1; lvl < 25; lvl++) {
        const xpNeeded = getXpToLevelUp(lvl);
        const deployCap = player.getDeployCap();
        
        progressionLog.push({
          level: player.level,
          xpNeeded,
          deployCap
        });
        
        // Gain XP to level up
        player.gainXp(xpNeeded);
      }
      
      // Final state at level 25
      progressionLog.push({
        level: player.level,
        xpNeeded: getXpToLevelUp(25),
        deployCap: player.getDeployCap()
      });
      
      // Verify progression
      expect(progressionLog[0].level).toBe(1);
      expect(progressionLog[0].deployCap).toBe(3);
      
      expect(progressionLog[progressionLog.length - 1].level).toBe(25);
      expect(progressionLog[progressionLog.length - 1].deployCap).toBe(25);
      
      // Verify XP requirements increase
      for (let i = 1; i < progressionLog.length - 1; i++) {
        expect(progressionLog[i].xpNeeded).toBeGreaterThan(progressionLog[i - 1].xpNeeded);
      }
    });

    it('should integrate shop, XP, and deploy cap in realistic scenario', () => {
      // Start at level 1
      player.level = 1;
      player.gold = 50;
      
      // Refresh shop and buy units
      shop.refresh();
      const unit1 = shop.buyUnit(0);
      expect(unit1).toBeDefined();
      expect(unit1.tier).toBe(1); // Level 1 = tier 1 only
      
      // Gain XP and level up to 5
      let totalXp = 0;
      for (let lvl = 1; lvl < 5; lvl++) {
        totalXp += getXpToLevelUp(lvl);
      }
      player.gainXp(totalXp);
      
      expect(player.level).toBe(5);
      expect(player.getDeployCap()).toBe(7);
      
      // Refresh shop at level 5
      shop.refresh();
      const offers5 = shop.offers;
      const maxTier5 = Math.max(...offers5.map(o => o.tier));
      expect(maxTier5).toBeGreaterThanOrEqual(2); // Should see tier 2+
      
      // Continue to level 15
      for (let lvl = 5; lvl < 15; lvl++) {
        player.gainXp(getXpToLevelUp(lvl));
      }
      
      expect(player.level).toBe(15);
      expect(player.getDeployCap()).toBe(17);
      
      // Refresh shop at level 15
      shop.refresh();
      const offers15 = shop.offers;
      const tier5Count15 = offers15.filter(o => o.tier === 5).length;
      expect(tier5Count15).toBeGreaterThan(0); // Should see some tier 5
      
      // Continue to level 25
      for (let lvl = 15; lvl < 25; lvl++) {
        player.gainXp(getXpToLevelUp(lvl));
      }
      
      expect(player.level).toBe(25);
      expect(player.getDeployCap()).toBe(25);
      
      // Refresh shop at level 25
      let tier5Total = 0;
      for (let i = 0; i < 10; i++) {
        shop.refresh();
        tier5Total += shop.offers.filter(o => o.tier === 5).length;
      }
      
      const tier5Percentage = tier5Total / 50;
      expect(tier5Percentage).toBeGreaterThan(0.80); // Mostly tier 5
    });

    it('should handle edge case: level 26+ uses level 25 tier odds', () => {
      // Manually set level beyond 25
      player.level = 30;
      
      expect(player.getDeployCap()).toBe(25); // Capped at 25
      
      // Shop should use level 25 odds
      let tier5Total = 0;
      for (let i = 0; i < 20; i++) {
        shop.refresh();
        tier5Total += shop.offers.filter(o => o.tier === 5).length;
      }
      
      const tier5Percentage = tier5Total / 100;
      expect(tier5Percentage).toBeGreaterThan(0.80); // Same as level 25
    });

    it('should verify tier odds progression matches requirements', () => {
      // Level 1: 100% tier 1
      player.level = 1;
      let tier1Count = 0;
      for (let i = 0; i < 50; i++) {
        shop.refresh();
        tier1Count += shop.offers.filter(o => o.tier === 1).length;
      }
      expect(tier1Count).toBe(250); // 50 refreshes × 5 slots = 100% tier 1
      
      // Level 9: ~30% tier 5
      player.level = 9;
      let tier5Count9 = 0;
      for (let i = 0; i < 100; i++) {
        shop.refresh();
        tier5Count9 += shop.offers.filter(o => o.tier === 5).length;
      }
      const tier5Pct9 = tier5Count9 / 500;
      expect(tier5Pct9).toBeGreaterThan(0.20);
      expect(tier5Pct9).toBeLessThan(0.40);
      
      // Level 25: ~90% tier 5
      player.level = 25;
      let tier5Count25 = 0;
      for (let i = 0; i < 100; i++) {
        shop.refresh();
        tier5Count25 += shop.offers.filter(o => o.tier === 5).length;
      }
      const tier5Pct25 = tier5Count25 / 500;
      expect(tier5Pct25).toBeGreaterThan(0.85);
      expect(tier5Pct25).toBeLessThan(0.95);
    });
  });

  describe('Complete progression scenario', () => {
    /**
     * **Validates: Requirements 12.1, 13.1, 14.1, 16.1**
     * Full integration test simulating a complete game
     */
    it('should simulate a complete game from start to level 25', () => {
      const gameLog = [];
      
      // Start game
      player.level = 1;
      player.gold = 10;
      player.xp = 0;
      
      // Play through levels 1-25
      for (let targetLevel = 2; targetLevel <= 25; targetLevel++) {
        // Gain XP to reach target level
        const xpNeeded = getXpToLevelUp(targetLevel - 1);
        player.gainXp(xpNeeded);
        
        // Refresh shop
        shop.refresh();
        
        // Log state
        gameLog.push({
          level: player.level,
          deployCap: player.getDeployCap(),
          shopTiers: shop.offers.map(o => o.tier),
          tier5Count: shop.offers.filter(o => o.tier === 5).length
        });
      }
      
      // Verify final state
      const finalState = gameLog[gameLog.length - 1];
      expect(finalState.level).toBe(25);
      expect(finalState.deployCap).toBe(25);
      expect(finalState.tier5Count).toBeGreaterThan(0);
      
      // Verify progression trends
      const earlyGame = gameLog.slice(0, 5); // Levels 2-6
      const midGame = gameLog.slice(9, 14); // Levels 11-15
      const lateGame = gameLog.slice(19, 24); // Levels 21-25
      
      const earlyTier5Avg = earlyGame.reduce((sum, log) => sum + log.tier5Count, 0) / earlyGame.length;
      const midTier5Avg = midGame.reduce((sum, log) => sum + log.tier5Count, 0) / midGame.length;
      const lateTier5Avg = lateGame.reduce((sum, log) => sum + log.tier5Count, 0) / lateGame.length;
      
      // Tier 5 count should increase as game progresses
      expect(midTier5Avg).toBeGreaterThanOrEqual(earlyTier5Avg);
      expect(lateTier5Avg).toBeGreaterThanOrEqual(midTier5Avg);
      
      // Late game should have mostly tier 5
      expect(lateTier5Avg).toBeGreaterThan(3.5); // Average > 3.5 out of 5 slots
    });
  });
});
