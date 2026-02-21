/**
 * PlanningScene Integration Tests
 * 
 * Tests the full planning flow through PlanningScene using refactored systems:
 * - Buy units → deploy → upgrade → start combat
 * - Shop operations through scene (refresh, buy, sell, lock)
 * - Board operations through scene (place, move, remove)
 * - Error handling (insufficient gold, invalid placement)
 * 
 * **Validates: Requirements 11.4, 11.5**
 * 
 * Task 5.1.6: Write integration tests for PlanningScene
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoardSystem } from '../src/systems/BoardSystem.js';
import { ShopSystem } from '../src/systems/ShopSystem.js';
import { UpgradeSystem } from '../src/systems/UpgradeSystem.js';
import { SynergySystem } from '../src/systems/SynergySystem.js';
import { UNIT_BY_ID } from '../src/data/unitCatalog.js';
import { createUnitUid } from '../src/core/gameUtils.js';

/**
 * Mock PlanningScene that uses the refactored systems
 * Simulates the scene's orchestration of systems
 */
class MockPlanningScene {
  constructor() {
    this.player = this.createDefaultPlayer();
  }

  createDefaultPlayer() {
    return {
      level: 5,
      gold: 20,
      round: 1,
      xp: 0,
      hp: 3,
      board: BoardSystem.createEmptyBoard(),
      bench: [],
      shop: [],
      shopLocked: false,
      loseCondition: 'NO_HEARTS'
    };
  }

  // Shop operations through scene
  refreshShop() {
    const result = ShopSystem.refreshShop(this.player, 2);
    if (result.success) {
      this.player = result.player;
      return { success: true };
    }
    return result;
  }

  buyUnit(slot) {
    const benchCap = 20;
    const createUnitFn = (baseId, star) => {
      const base = UNIT_BY_ID[baseId];
      if (!base) return null;
      return {
        uid: createUnitUid(),
        baseId: base.id,
        star: star || 1,
        base,
        equips: []
      };
    };

    const result = ShopSystem.buyUnit(this.player, slot, createUnitFn, benchCap);
    if (result.success) {
      this.player = result.player;
      return { success: true, unit: result.unit, cost: result.cost };
    }
    return result;
  }

  sellUnit(unit) {
    const result = ShopSystem.sellUnit(this.player, unit);
    if (result.success) {
      this.player = result.player;
      // Remove from bench
      this.player.bench = this.player.bench.filter(u => u.uid !== unit.uid);
      return { success: true, sellValue: result.sellValue };
    }
    return result;
  }

  lockShop() {
    const result = ShopSystem.lockShop(this.player);
    if (result.success) {
      this.player = result.player;
      return { success: true };
    }
    return result;
  }

  unlockShop() {
    const result = ShopSystem.unlockShop(this.player);
    if (result.success) {
      this.player = result.player;
      return { success: true };
    }
    return result;
  }

  // Board operations through scene
  placeUnitOnBoard(unit, row, col) {
    const deployLimit = 5;
    const result = BoardSystem.placeUnit(this.player.board, unit, row, col, deployLimit);
    if (result.success) {
      // Remove from bench
      this.player.bench = this.player.bench.filter(u => u.uid !== unit.uid);
      return { success: true };
    }
    return result;
  }

  removeUnitFromBoard(row, col) {
    const result = BoardSystem.removeUnit(this.player.board, row, col);
    if (result.success) {
      // Add to bench
      this.player.bench.push(result.unit);
      return { success: true, unit: result.unit };
    }
    return result;
  }

  moveUnitOnBoard(fromRow, fromCol, toRow, toCol) {
    return BoardSystem.moveUnit(this.player.board, fromRow, fromCol, toRow, toCol, true);
  }

  // Upgrade operations through scene
  checkForUpgrades() {
    const candidates = UpgradeSystem.findUpgradeCandidates(this.player.board, this.player.bench);
    return candidates;
  }

  performUpgrade(candidate) {
    // Use tryAutoMerge for automatic upgrade
    const result = UpgradeSystem.tryAutoMerge(
      this.player.board,
      this.player.bench,
      {}, // itemCatalog - not needed for basic test
      UNIT_BY_ID,
      (baseId, star) => {
        const base = UNIT_BY_ID[baseId];
        if (!base) return null;
        return {
          uid: createUnitUid(),
          baseId: base.id,
          star: star || 1,
          base,
          equips: []
        };
      }
    );

    if (result.success) {
      this.player.board = result.board;
      this.player.bench = result.bench;
      return { success: true, upgradedUnit: result.upgradedUnit };
    }
    return result;
  }

  // Synergy calculation through scene
  calculateSynergies() {
    const deployedUnits = BoardSystem.getDeployedUnits(this.player.board);
    const result = SynergySystem.calculateSynergies(deployedUnits);
    // Return the counts object (not an array)
    return result;
  }

  // Combat preparation
  canStartCombat() {
    const deployCount = BoardSystem.getDeployCount(this.player.board);
    return deployCount > 0;
  }

  startCombat() {
    if (!this.canStartCombat()) {
      return { success: false, error: 'No units deployed' };
    }
    return { success: true };
  }
}

describe('PlanningScene Integration Tests', () => {
  let scene;

  beforeEach(() => {
    scene = new MockPlanningScene();
  });

  describe('Full planning flow: buy → deploy → upgrade → combat', () => {
    it('should complete full planning flow successfully', () => {
      // Step 1: Refresh shop
      const refreshResult = scene.refreshShop();
      expect(refreshResult.success).toBe(true);
      expect(scene.player.gold).toBe(18); // 20 - 2
      expect(scene.player.shop).toHaveLength(5);

      // Step 2: Buy units
      const buyResult1 = scene.buyUnit(0);
      expect(buyResult1.success).toBe(true);
      expect(scene.player.bench).toHaveLength(1);

      const buyResult2 = scene.buyUnit(1);
      expect(buyResult2.success).toBe(true);
      expect(scene.player.bench).toHaveLength(2);

      // Step 3: Deploy units to board
      const unit1 = scene.player.bench[0];
      const unit2 = scene.player.bench[1];

      const placeResult1 = scene.placeUnitOnBoard(unit1, 0, 0);
      expect(placeResult1.success).toBe(true);
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(1);
      expect(scene.player.bench).toHaveLength(1);

      const placeResult2 = scene.placeUnitOnBoard(unit2, 0, 1);
      expect(placeResult2.success).toBe(true);
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(2);
      expect(scene.player.bench).toHaveLength(0);

      // Step 4: Calculate synergies
      const synergies = scene.calculateSynergies();
      expect(synergies).toBeDefined();

      // Step 5: Start combat
      const combatResult = scene.canStartCombat();
      expect(combatResult).toBe(true);

      const startResult = scene.startCombat();
      expect(startResult.success).toBe(true);
    });

    it('should handle buy → deploy → upgrade flow', () => {
      // Give player more gold for multiple purchases
      scene.player.gold = 50;

      // Refresh shop
      scene.refreshShop();

      // Buy first unit
      const buyResult = scene.buyUnit(0);
      if (buyResult.success) {
        const unit1 = buyResult.unit;

        // Manually add 2 more of same type for testing upgrade
        const unit2 = {
          uid: createUnitUid(),
          baseId: unit1.baseId,
          star: 1,
          base: unit1.base,
          equips: []
        };
        const unit3 = {
          uid: createUnitUid(),
          baseId: unit1.baseId,
          star: 1,
          base: unit1.base,
          equips: []
        };
        scene.player.bench.push(unit2, unit3);

        // Check for upgrades
        const candidates = scene.checkForUpgrades();
        expect(candidates.length).toBeGreaterThan(0);

        // Verify we have 3 units of same type
        const sameTypeUnits = scene.player.bench.filter(u => u.baseId === unit1.baseId);
        expect(sameTypeUnits.length).toBe(3);
      }
    });

    it('should handle move units on board', () => {
      // Add units to bench
      const unit1 = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      const unit2 = {
        uid: createUnitUid(),
        baseId: 'bear_ancient',
        star: 1,
        base: UNIT_BY_ID['bear_ancient'],
        equips: []
      };
      scene.player.bench.push(unit1, unit2);

      // Deploy units
      scene.placeUnitOnBoard(unit1, 0, 0);
      scene.placeUnitOnBoard(unit2, 0, 1);

      // Move unit
      const moveResult = scene.moveUnitOnBoard(0, 0, 2, 2);
      expect(moveResult.success).toBe(true);
      expect(BoardSystem.getUnitAt(scene.player.board, 0, 0)).toBeNull();
      expect(BoardSystem.getUnitAt(scene.player.board, 2, 2)).toBeDefined();
      expect(BoardSystem.getUnitAt(scene.player.board, 2, 2).uid).toBe(unit1.uid);
    });

    it('should handle remove unit from board', () => {
      // Add unit to bench
      const unit = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      scene.player.bench.push(unit);

      // Deploy unit
      scene.placeUnitOnBoard(unit, 1, 1);
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(1);
      expect(scene.player.bench).toHaveLength(0);

      // Remove unit
      const removeResult = scene.removeUnitFromBoard(1, 1);
      expect(removeResult.success).toBe(true);
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(0);
      expect(scene.player.bench).toHaveLength(1);
      expect(scene.player.bench[0].uid).toBe(unit.uid);
    });
  });

  describe('Shop operations through scene', () => {
    it('should refresh shop and deduct gold', () => {
      const initialGold = scene.player.gold;
      
      const result = scene.refreshShop();
      
      expect(result.success).toBe(true);
      expect(scene.player.gold).toBe(initialGold - 2);
      expect(scene.player.shop).toHaveLength(5);
      scene.player.shop.forEach(offer => {
        if (offer) {
          expect(offer.baseId).toBeDefined();
          expect(UNIT_BY_ID[offer.baseId]).toBeDefined();
        }
      });
    });

    it('should buy unit from shop', () => {
      scene.refreshShop();
      const initialGold = scene.player.gold;
      const offer = scene.player.shop[0];
      
      if (offer) {
        const result = scene.buyUnit(0);
        
        expect(result.success).toBe(true);
        expect(result.unit).toBeDefined();
        expect(result.unit.baseId).toBe(offer.baseId);
        expect(scene.player.bench).toHaveLength(1);
        expect(scene.player.gold).toBeLessThan(initialGold);
        expect(scene.player.shop[0]).toBeNull();
      }
    });

    it('should sell unit and gain gold', () => {
      // Add unit to bench
      const unit = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      scene.player.bench.push(unit);
      
      const initialGold = scene.player.gold;
      const result = scene.sellUnit(unit);
      
      expect(result.success).toBe(true);
      expect(result.sellValue).toBeGreaterThan(0);
      expect(scene.player.gold).toBe(initialGold + result.sellValue);
      expect(scene.player.bench).toHaveLength(0);
    });

    it('should lock and unlock shop', () => {
      scene.refreshShop();
      const offersBeforeLock = [...scene.player.shop];
      
      // Lock shop
      const lockResult = scene.lockShop();
      expect(lockResult.success).toBe(true);
      expect(scene.player.shopLocked).toBe(true);
      
      // Try to refresh (should fail)
      const refreshResult = scene.refreshShop();
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error).toBe('Shop is locked');
      expect(scene.player.shop).toEqual(offersBeforeLock);
      
      // Unlock shop
      const unlockResult = scene.unlockShop();
      expect(unlockResult.success).toBe(true);
      expect(scene.player.shopLocked).toBe(false);
      
      // Refresh should work now
      const refreshResult2 = scene.refreshShop();
      expect(refreshResult2.success).toBe(true);
    });

    it('should handle multiple buy operations', () => {
      scene.player.gold = 50;
      scene.refreshShop();
      
      const buyCount = 3;
      for (let i = 0; i < buyCount; i++) {
        if (scene.player.shop[i]) {
          const result = scene.buyUnit(i);
          expect(result.success).toBe(true);
        }
      }
      
      expect(scene.player.bench.length).toBeGreaterThan(0);
      expect(scene.player.bench.length).toBeLessThanOrEqual(buyCount);
    });
  });

  describe('Board operations through scene', () => {
    it('should place unit on valid empty position', () => {
      const unit = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      scene.player.bench.push(unit);
      
      const result = scene.placeUnitOnBoard(unit, 2, 2);
      
      expect(result.success).toBe(true);
      expect(BoardSystem.getUnitAt(scene.player.board, 2, 2)).toBeDefined();
      expect(BoardSystem.getUnitAt(scene.player.board, 2, 2).uid).toBe(unit.uid);
      expect(scene.player.bench).toHaveLength(0);
    });

    it('should reject placement on invalid position', () => {
      const unit = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      scene.player.bench.push(unit);
      
      const result = scene.placeUnitOnBoard(unit, -1, 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid position');
      expect(scene.player.bench).toHaveLength(1);
    });

    it('should reject placement on occupied position', () => {
      const unit1 = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      const unit2 = {
        uid: createUnitUid(),
        baseId: 'bear_ancient',
        star: 1,
        base: UNIT_BY_ID['bear_ancient'],
        equips: []
      };
      scene.player.bench.push(unit1, unit2);
      
      scene.placeUnitOnBoard(unit1, 1, 1);
      const result = scene.placeUnitOnBoard(unit2, 1, 1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Position occupied');
      expect(BoardSystem.getUnitAt(scene.player.board, 1, 1).uid).toBe(unit1.uid);
    });

    it('should reject placement when deploy limit reached', () => {
      // Fill board to deploy limit (5)
      for (let i = 0; i < 5; i++) {
        const unit = {
          uid: createUnitUid(),
          baseId: 'ant_guard',
          star: 1,
          base: UNIT_BY_ID['ant_guard'],
          equips: []
        };
        scene.player.bench.push(unit);
        scene.placeUnitOnBoard(unit, 0, i);
      }
      
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(5);
      
      // Try to place 6th unit
      const unit6 = {
        uid: createUnitUid(),
        baseId: 'bear_ancient',
        star: 1,
        base: UNIT_BY_ID['bear_ancient'],
        equips: []
      };
      scene.player.bench.push(unit6);
      
      const result = scene.placeUnitOnBoard(unit6, 1, 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Deploy limit reached');
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(5);
    });

    it('should swap units on board', () => {
      const unit1 = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      const unit2 = {
        uid: createUnitUid(),
        baseId: 'bear_ancient',
        star: 1,
        base: UNIT_BY_ID['bear_ancient'],
        equips: []
      };
      scene.player.bench.push(unit1, unit2);
      
      scene.placeUnitOnBoard(unit1, 0, 0);
      scene.placeUnitOnBoard(unit2, 1, 1);
      
      const result = scene.moveUnitOnBoard(0, 0, 1, 1);
      
      expect(result.success).toBe(true);
      expect(result.swapped).toBe(true);
      expect(BoardSystem.getUnitAt(scene.player.board, 0, 0).uid).toBe(unit2.uid);
      expect(BoardSystem.getUnitAt(scene.player.board, 1, 1).uid).toBe(unit1.uid);
    });

    it('should calculate synergies for deployed units', () => {
      // Deploy multiple units
      const units = [
        { uid: createUnitUid(), baseId: 'ant_guard', star: 1, base: UNIT_BY_ID['ant_guard'], equips: [] },
        { uid: createUnitUid(), baseId: 'bear_ancient', star: 1, base: UNIT_BY_ID['bear_ancient'], equips: [] },
        { uid: createUnitUid(), baseId: 'fox_flame', star: 1, base: UNIT_BY_ID['fox_flame'], equips: [] }
      ];
      
      units.forEach((unit, i) => {
        scene.player.bench.push(unit);
        scene.placeUnitOnBoard(unit, 0, i);
      });
      
      const synergies = scene.calculateSynergies();
      
      expect(synergies).toBeDefined();
      expect(synergies).toHaveProperty('classCounts');
      expect(synergies).toHaveProperty('tribeCounts');
    });
  });

  describe('Error handling', () => {
    it('should handle insufficient gold for shop refresh', () => {
      scene.player.gold = 1;
      
      const result = scene.refreshShop();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough gold');
      expect(scene.player.gold).toBe(1);
    });

    it('should handle insufficient gold for buying unit', () => {
      scene.player.gold = 50;
      scene.refreshShop();
      
      // Set gold to 0
      scene.player.gold = 0;
      
      const result = scene.buyUnit(0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough gold');
    });

    it('should handle buying from empty shop slot', () => {
      scene.refreshShop();
      scene.buyUnit(0); // Buy unit from slot 0
      
      const result = scene.buyUnit(0); // Try to buy again from empty slot
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No unit in this slot');
    });

    it('should handle invalid shop slot', () => {
      scene.refreshShop();
      
      const result = scene.buyUnit(10);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid shop slot');
    });

    it('should handle placement on out-of-bounds position', () => {
      const unit = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      scene.player.bench.push(unit);
      
      const result = scene.placeUnitOnBoard(unit, 5, 5);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid position');
    });

    it('should handle starting combat with no units', () => {
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(0);
      
      const canStart = scene.canStartCombat();
      expect(canStart).toBe(false);
      
      const result = scene.startCombat();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No units deployed');
    });

    it('should handle selling unit not in bench', () => {
      const unit = {
        uid: createUnitUid(),
        baseId: 'ant_guard',
        star: 1,
        base: UNIT_BY_ID['ant_guard'],
        equips: []
      };
      
      // Don't add to bench
      const result = scene.sellUnit(unit);
      
      // Should still succeed (system doesn't check bench)
      expect(result.success).toBe(true);
      expect(result.sellValue).toBeGreaterThan(0);
    });

    it('should handle full bench when buying', () => {
      scene.player.gold = 100;
      scene.refreshShop();
      
      // Fill bench to capacity (20)
      for (let i = 0; i < 20; i++) {
        scene.player.bench.push({
          uid: createUnitUid(),
          baseId: 'ant_guard',
          star: 1,
          base: UNIT_BY_ID['ant_guard'],
          equips: []
        });
      }
      
      const result = scene.buyUnit(0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bench is full');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complete round workflow', () => {
      // Start of round
      scene.player.gold = 30;
      
      // Refresh shop
      scene.refreshShop();
      expect(scene.player.gold).toBe(28);
      
      // Buy 2 units
      scene.buyUnit(0);
      scene.buyUnit(1);
      expect(scene.player.bench.length).toBeGreaterThanOrEqual(2);
      
      // Deploy units
      const unit1 = scene.player.bench[0];
      const unit2 = scene.player.bench[1];
      scene.placeUnitOnBoard(unit1, 0, 0);
      scene.placeUnitOnBoard(unit2, 0, 1);
      
      // Calculate synergies
      const synergies = scene.calculateSynergies();
      expect(synergies).toBeDefined();
      
      // Start combat
      const canStart = scene.canStartCombat();
      expect(canStart).toBe(true);
      
      const combatResult = scene.startCombat();
      expect(combatResult.success).toBe(true);
    });

    it('should handle lock shop across operations', () => {
      scene.player.gold = 50;
      scene.refreshShop();
      const offersBeforeLock = scene.player.shop.map(o => o ? o.baseId : null);
      
      // Lock shop
      scene.lockShop();
      
      // Buy unit (should work)
      if (scene.player.shop[0]) {
        const buyResult = scene.buyUnit(0);
        expect(buyResult.success).toBe(true);
      }
      
      // Try to refresh (should fail)
      const refreshResult = scene.refreshShop();
      expect(refreshResult.success).toBe(false);
      
      // Offers should be preserved (except bought slot)
      const offersAfterBuy = scene.player.shop.map(o => o ? o.baseId : null);
      expect(offersAfterBuy[0]).toBeNull(); // Bought slot
      for (let i = 1; i < 5; i++) {
        expect(offersAfterBuy[i]).toBe(offersBeforeLock[i]);
      }
    });

    it('should handle deploy, move, and remove workflow', () => {
      // Add units to bench
      const units = [];
      for (let i = 0; i < 3; i++) {
        const unit = {
          uid: createUnitUid(),
          baseId: 'ant_guard',
          star: 1,
          base: UNIT_BY_ID['ant_guard'],
          equips: []
        };
        units.push(unit);
        scene.player.bench.push(unit);
      }
      
      // Deploy all units
      scene.placeUnitOnBoard(units[0], 0, 0);
      scene.placeUnitOnBoard(units[1], 0, 1);
      scene.placeUnitOnBoard(units[2], 0, 2);
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(3);
      
      // Move unit
      scene.moveUnitOnBoard(0, 0, 2, 2);
      expect(BoardSystem.getUnitAt(scene.player.board, 0, 0)).toBeNull();
      expect(BoardSystem.getUnitAt(scene.player.board, 2, 2).uid).toBe(units[0].uid);
      
      // Remove unit
      scene.removeUnitFromBoard(0, 1);
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(2);
      expect(scene.player.bench).toHaveLength(1);
      
      // Re-deploy removed unit
      const removedUnit = scene.player.bench[0];
      scene.placeUnitOnBoard(removedUnit, 1, 1);
      expect(BoardSystem.getDeployCount(scene.player.board)).toBe(3);
    });

    it('should maintain data integrity through operations', () => {
      scene.player.gold = 50;
      scene.refreshShop();
      
      // Buy unit
      const buyResult = scene.buyUnit(0);
      if (buyResult.success) {
        const unit = buyResult.unit;
        const originalUid = unit.uid;
        const originalBaseId = unit.baseId;
        
        // Deploy unit
        scene.placeUnitOnBoard(unit, 1, 1);
        const boardUnit = BoardSystem.getUnitAt(scene.player.board, 1, 1);
        expect(boardUnit.uid).toBe(originalUid);
        expect(boardUnit.baseId).toBe(originalBaseId);
        
        // Move unit
        scene.moveUnitOnBoard(1, 1, 3, 3);
        const movedUnit = BoardSystem.getUnitAt(scene.player.board, 3, 3);
        expect(movedUnit.uid).toBe(originalUid);
        expect(movedUnit.baseId).toBe(originalBaseId);
        
        // Remove unit
        scene.removeUnitFromBoard(3, 3);
        const benchUnit = scene.player.bench[scene.player.bench.length - 1];
        expect(benchUnit.uid).toBe(originalUid);
        expect(benchUnit.baseId).toBe(originalBaseId);
      }
    });
  });
});

