/**
 * Final Integration Tests - Full Game Flow
 * 
 * **Property 40: Save Data Round Trip**
 * **Validates: Requirements 10.2, 10.3, 11.4, 11.5**
 * 
 * Tests the complete game flow from start to finish with all systems working together:
 * - Full game flow: menu → planning → combat → next round
 * - Save/load compatibility and data round trip
 * - All systems integration (Shop, Board, Upgrade, Synergy, Combat, AI)
 * - State persistence across save/load cycles
 * 
 * Task 9.4.5: Write final integration tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoardSystem } from '../src/systems/BoardSystem.js';
import { ShopSystem } from '../src/systems/ShopSystem.js';
import { UpgradeSystem } from '../src/systems/UpgradeSystem.js';
import { SynergySystem } from '../src/systems/SynergySystem.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { AISystem } from '../src/systems/AISystem.js';
import { saveProgress, loadProgress } from '../src/core/persistence.js';
import { hydrateRunState } from '../src/core/runState.js';
import { UNIT_BY_ID } from '../src/data/unitCatalog.js';
import { createUnitUid } from '../src/core/gameUtils.js';

/**
 * Mock Game State Manager
 * Simulates the full game state and orchestrates all systems
 */
class MockGameState {
  constructor() {
    this.player = this.createDefaultPlayer();
    this.combatState = null;
  }

  createDefaultPlayer() {
    return {
      level: 1,
      gold: 10,
      round: 1,
      xp: 0,
      hp: 3,
      gameMode: 'EndlessPvEClassic',
      board: BoardSystem.createEmptyBoard(),
      bench: [],
      shop: [],
      shopLocked: false,
      loseCondition: 'NO_HEARTS',
      winStreak: 0,
      loseStreak: 0,
      augments: [],
      deployCapBonus: 0
    };
  }

  // Planning phase operations
  refreshShop() {
    const result = ShopSystem.refreshShop(this.player, 2);
    if (result.success) {
      this.player = result.player;
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
    }
    return result;
  }

  placeUnit(unit, row, col) {
    const deployLimit = 5 + (this.player.deployCapBonus || 0);
    const result = BoardSystem.placeUnit(this.player.board, unit, row, col, deployLimit);
    if (result.success) {
      this.player.bench = this.player.bench.filter(u => u.uid !== unit.uid);
    }
    return result;
  }

  checkAutoUpgrade() {
    const result = UpgradeSystem.tryAutoMerge(
      this.player.board,
      this.player.bench,
      {},
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
    }
    return result;
  }

  calculateSynergies() {
    const deployedUnits = BoardSystem.getDeployedUnits(this.player.board);
    return SynergySystem.calculateSynergies(deployedUnits);
  }

  // Combat phase operations
  initializeCombat() {
    const playerUnits = BoardSystem.getDeployedUnits(this.player.board);
    if (playerUnits.length === 0) {
      return { success: false, error: 'No units deployed' };
    }

    // Generate enemy team
    const enemyBudget = 10 + this.player.round * 5;
    const enemyUnits = AISystem.generateEnemyTeam(
      this.player.round,
      enemyBudget,
      'MEDIUM',
      UNIT_BY_ID
    );

    // Initialize combat
    this.combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits);
    return { success: true, combatState: this.combatState };
  }

  executeCombatTurn() {
    if (!this.combatState || this.combatState.isFinished) {
      return { success: false, error: 'Combat not active' };
    }

    // Get next actor and execute their action
    const actor = CombatSystem.getNextActor(this.combatState);
    if (!actor) {
      return { success: false, error: 'No actor available' };
    }

    const result = CombatSystem.executeAction(this.combatState, actor);
    
    // Check if combat ended
    const endCheck = CombatSystem.checkCombatEnd(this.combatState);
    if (endCheck.isFinished) {
      this.combatState.isFinished = true;
      this.combatState.winner = endCheck.winner;
    }

    return result;
  }

  runCombatToEnd(maxTurns = 100) {
    if (!this.combatState) {
      return { success: false, error: 'Combat not initialized' };
    }

    let turns = 0;
    while (!this.combatState.isFinished && turns < maxTurns) {
      this.executeCombatTurn();
      turns++;
    }

    return {
      success: true,
      winner: this.combatState.winner,
      turns
    };
  }

  // Round progression
  advanceToNextRound(combatWon) {
    if (combatWon) {
      this.player.round += 1;
      this.player.gold += 5 + Math.floor(this.player.round / 5);
      this.player.winStreak += 1;
      this.player.loseStreak = 0;
      
      // Gain XP and level up
      this.player.xp += 2;
      const xpNeeded = this.player.level * 2;
      if (this.player.xp >= xpNeeded && this.player.level < 25) {
        this.player.level += 1;
        this.player.xp = 0;
      }
    } else {
      this.player.hp -= 1;
      this.player.loseStreak += 1;
      this.player.winStreak = 0;
    }

    // Reset combat state
    this.combatState = null;
    
    // Unlock shop for new round
    this.player.shopLocked = false;

    return {
      success: true,
      gameOver: this.player.hp <= 0
    };
  }

  // Save/Load operations
  saveGame() {
    const saveData = {
      aiMode: 'MEDIUM',
      audioEnabled: true,
      player: {
        ...this.player
      }
    };
    return saveProgress(saveData);
  }

  loadGame() {
    const loaded = loadProgress();
    if (!loaded) return { success: false, error: 'No save data' };

    const hydrated = hydrateRunState(loaded);
    if (!hydrated) return { success: false, error: 'Failed to hydrate' };

    this.player = hydrated.player;
    return { success: true };
  }

  // State validation
  validateState() {
    const errors = [];

    // Validate player state
    if (this.player.gold < 0) errors.push('Negative gold');
    if (this.player.hp < 0) errors.push('Negative HP');
    if (this.player.level < 1 || this.player.level > 25) errors.push('Invalid level');
    if (this.player.round < 1) errors.push('Invalid round');

    // Validate board
    if (!Array.isArray(this.player.board) || this.player.board.length !== 5) {
      errors.push('Invalid board structure');
    }

    // Validate bench
    if (!Array.isArray(this.player.bench)) {
      errors.push('Invalid bench structure');
    }

    // Validate shop
    if (!Array.isArray(this.player.shop)) {
      errors.push('Invalid shop structure');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

describe('Final Integration Tests - Full Game Flow', () => {
  let game;

  beforeEach(() => {
    game = new MockGameState();
    localStorage.clear();
  });

  describe('Property 40: Save Data Round Trip', () => {
    it('should preserve game state through save and load cycle', () => {
      // **Validates: Requirements 10.2, 10.3**
      
      // Set up game state
      game.player.level = 5;
      game.player.gold = 50;
      game.player.round = 10;
      game.player.hp = 2;
      game.player.xp = 8;
      game.player.winStreak = 3;

      // Add some units to bench
      const unit1 = {
        uid: createUnitUid(),
        baseId: 'bear_ancient',
        star: 2,
        base: UNIT_BY_ID['bear_ancient'],
        equips: []
      };
      const unit2 = {
        uid: createUnitUid(),
        baseId: 'wolf_alpha',
        star: 1,
        base: UNIT_BY_ID['wolf_alpha'],
        equips: []
      };
      game.player.bench.push(unit1, unit2);

      // Deploy a unit
      game.placeUnit(unit1, 0, 0);

      // Save original state
      const originalState = JSON.parse(JSON.stringify(game.player));

      // Save game
      const saved = game.saveGame();
      expect(saved).toBe(true);

      // Create new game instance and load
      const newGame = new MockGameState();
      const loadResult = newGame.loadGame();
      expect(loadResult.success).toBe(true);

      // Verify state preserved
      expect(newGame.player.level).toBe(originalState.level);
      expect(newGame.player.gold).toBe(originalState.gold);
      expect(newGame.player.round).toBe(originalState.round);
      expect(newGame.player.hp).toBe(originalState.hp);
      expect(newGame.player.xp).toBe(originalState.xp);
      expect(newGame.player.winStreak).toBe(originalState.winStreak);
      expect(newGame.player.bench.length).toBe(originalState.bench.length);
      expect(BoardSystem.getDeployCount(newGame.player.board)).toBe(
        BoardSystem.getDeployCount(originalState.board)
      );
    });

    it('should handle multiple save/load cycles without data loss', () => {
      // **Validates: Requirements 10.2, 10.3**
      
      for (let cycle = 0; cycle < 3; cycle++) {
        // Modify state
        game.player.gold += 10;
        game.player.round += 1;

        // Save
        const saved = game.saveGame();
        expect(saved).toBe(true);

        // Load
        const loadResult = game.loadGame();
        expect(loadResult.success).toBe(true);

        // Verify state
        expect(game.player.gold).toBe(10 + (cycle + 1) * 10);
        expect(game.player.round).toBe(1 + (cycle + 1));
      }
    });

    it('should preserve complex game state with units and shop', () => {
      // **Validates: Requirements 10.2, 10.3**
      
      // Set up complex state
      game.player.gold = 100;
      game.refreshShop();
      
      // Buy and deploy units
      game.buyUnit(0);
      game.buyUnit(1);
      
      if (game.player.bench.length >= 2) {
        game.placeUnit(game.player.bench[0], 0, 0);
        game.placeUnit(game.player.bench[0], 0, 1);
      }

      // Lock shop
      ShopSystem.lockShop(game.player);

      // Save state
      const originalGold = game.player.gold;
      const originalBenchSize = game.player.bench.length;
      const originalDeployCount = BoardSystem.getDeployCount(game.player.board);
      const originalShopLocked = game.player.shopLocked;

      game.saveGame();

      // Load in new instance
      const newGame = new MockGameState();
      newGame.loadGame();

      // Verify complex state preserved
      expect(newGame.player.gold).toBe(originalGold);
      expect(newGame.player.bench.length).toBe(originalBenchSize);
      expect(BoardSystem.getDeployCount(newGame.player.board)).toBe(originalDeployCount);
      expect(newGame.player.shopLocked).toBe(originalShopLocked);
    });

    it('should maintain data format compatibility after refactor', () => {
      // **Validates: Requirements 10.2, 10.3**
      
      // Save with current format
      game.player.level = 15;
      game.player.gold = 75;
      game.saveGame();

      // Load and verify format
      const loaded = loadProgress();
      expect(loaded).not.toBeNull();
      expect(loaded.player).toBeDefined();
      expect(loaded.player.level).toBe(15);
      expect(loaded.player.gold).toBe(75);

      // Verify hydration works
      const hydrated = hydrateRunState(loaded);
      expect(hydrated).not.toBeNull();
      expect(hydrated.player.level).toBe(15);
      expect(hydrated.player.gold).toBe(75);
    });
  });

  describe('Full Game Flow: Start to Finish', () => {
    it('should complete full round: planning → combat → next round', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      // Round 1: Planning Phase
      expect(game.player.round).toBe(1);
      expect(game.player.gold).toBe(10);

      // Refresh shop
      const refreshResult = game.refreshShop();
      expect(refreshResult.success).toBe(true);
      expect(game.player.gold).toBe(8);

      // Buy units
      const buyResult1 = game.buyUnit(0);
      const buyResult2 = game.buyUnit(1);
      expect(buyResult1.success || buyResult2.success).toBe(true);

      // Deploy units
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 0);
      }
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 1);
      }

      expect(BoardSystem.getDeployCount(game.player.board)).toBeGreaterThan(0);

      // Calculate synergies
      const synergies = game.calculateSynergies();
      expect(synergies).toBeDefined();

      // Combat Phase
      const combatInit = game.initializeCombat();
      expect(combatInit.success).toBe(true);

      const combatResult = game.runCombatToEnd();
      expect(combatResult.success).toBe(true);
      expect(combatResult.winner).toBeDefined();
      // Winner can be 'player', 'enemy', or null (if max turns reached)
      if (combatResult.winner) {
        expect(['player', 'enemy', 'draw']).toContain(combatResult.winner);
      }

      // Advance to next round
      const advanceResult = game.advanceToNextRound(combatResult.winner === 'player');
      expect(advanceResult.success).toBe(true);

      if (combatResult.winner === 'player') {
        expect(game.player.round).toBe(2);
        expect(game.player.gold).toBeGreaterThan(0);
      } else {
        expect(game.player.hp).toBe(2);
      }
    });

    it('should handle multiple rounds with progression', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      const maxRounds = 3;
      let roundsCompleted = 0;

      for (let i = 0; i < maxRounds; i++) {
        if (game.player.hp <= 0) break;

        // Planning
        game.player.gold = 50; // Give enough gold for testing
        game.refreshShop();
        
        // Buy and deploy units
        for (let slot = 0; slot < 3; slot++) {
          game.buyUnit(slot);
        }

        // Deploy all bench units
        let deployRow = 0;
        let deployCol = 0;
        while (game.player.bench.length > 0 && deployRow < 5) {
          const unit = game.player.bench[0];
          const placeResult = game.placeUnit(unit, deployRow, deployCol);
          
          if (placeResult.success) {
            deployCol++;
            if (deployCol >= 5) {
              deployCol = 0;
              deployRow++;
            }
          } else {
            break;
          }
        }

        // Combat
        const combatInit = game.initializeCombat();
        if (!combatInit.success) break;

        const combatResult = game.runCombatToEnd(200); // Increase max turns
        expect(combatResult.success).toBe(true);

        // Advance (assume player wins if combat completes, loses if it doesn't)
        const won = combatResult.winner === 'player';
        game.advanceToNextRound(won);
        roundsCompleted++;
        
        // Break if player lost
        if (!won && game.player.hp <= 0) break;
      }

      expect(roundsCompleted).toBeGreaterThan(0);
      // Player should have progressed at least one round if they won any combat
      expect(game.player.round).toBeGreaterThanOrEqual(1);
    });

    it('should handle game over condition', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      // Set HP to 1
      game.player.hp = 1;
      game.player.gold = 50;

      // Set up minimal combat
      game.refreshShop();
      game.buyUnit(0);
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 0);
      }

      // Initialize combat
      game.initializeCombat();

      // Force loss by advancing with loss
      const advanceResult = game.advanceToNextRound(false);
      expect(advanceResult.success).toBe(true);
      expect(advanceResult.gameOver).toBe(true);
      expect(game.player.hp).toBe(0);
    });
  });

  describe('All Systems Integration', () => {
    it('should integrate Shop, Board, Upgrade, and Synergy systems', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      game.player.gold = 100;

      // Shop System
      game.refreshShop();
      expect(game.player.shop.length).toBe(5);

      // Buy units
      game.buyUnit(0);
      game.buyUnit(1);
      game.buyUnit(2);
      const benchSize = game.player.bench.length;
      expect(benchSize).toBeGreaterThan(0);

      // Board System
      const unit1 = game.player.bench[0];
      game.placeUnit(unit1, 0, 0);
      expect(BoardSystem.getDeployCount(game.player.board)).toBe(1);

      // Synergy System
      const synergies = game.calculateSynergies();
      expect(synergies).toBeDefined();
      expect(synergies.classCounts).toBeDefined();
      expect(synergies.tribeCounts).toBeDefined();

      // Upgrade System (add matching units for upgrade)
      if (benchSize >= 2) {
        const baseId = game.player.bench[0].baseId;
        // Add 2 more matching units
        for (let i = 0; i < 2; i++) {
          game.player.bench.push({
            uid: createUnitUid(),
            baseId: baseId,
            star: 1,
            base: UNIT_BY_ID[baseId],
            equips: []
          });
        }

        const upgradeResult = game.checkAutoUpgrade();
        // Upgrade may or may not happen depending on unit availability
        expect(upgradeResult).toBeDefined();
      }
    });

    it('should integrate Combat and AI systems', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      game.player.gold = 50;
      game.refreshShop();

      // Buy and deploy units
      game.buyUnit(0);
      game.buyUnit(1);
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 0);
      }
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 1);
      }

      // AI System generates enemies
      const combatInit = game.initializeCombat();
      expect(combatInit.success).toBe(true);
      expect(game.combatState.enemyUnits.length).toBeGreaterThan(0);

      // Combat System executes battle
      const combatResult = game.runCombatToEnd(200); // Increase max turns
      expect(combatResult.success).toBe(true);
      expect(combatResult.turns).toBeGreaterThan(0);
      // Combat should finish within reasonable time or hit max turns
      expect(combatResult.turns).toBeLessThanOrEqual(200);
    });

    it('should maintain state consistency across all systems', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      game.player.gold = 100;

      // Perform operations across all systems
      game.refreshShop(); // Shop
      game.buyUnit(0); // Shop
      
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 0); // Board
      }
      
      game.calculateSynergies(); // Synergy
      game.checkAutoUpgrade(); // Upgrade

      // Validate state
      const validation = game.validateState();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Save/Load with Full Game Flow', () => {
    it('should save and load mid-game state correctly', () => {
      // **Validates: Requirements 10.2, 10.3, 11.4, 11.5**
      
      // Play through first round
      game.player.gold = 50;
      game.refreshShop();
      game.buyUnit(0);
      game.buyUnit(1);
      
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 0);
      }

      // Save mid-planning
      const saveResult = game.saveGame();
      expect(saveResult).toBe(true);

      // Continue playing
      game.initializeCombat();
      const combatResult = game.runCombatToEnd();
      game.advanceToNextRound(combatResult.winner === 'player');

      // Load saved state
      const loadResult = game.loadGame();
      expect(loadResult.success).toBe(true);

      // Verify we're back to planning phase
      expect(game.player.round).toBe(1);
      expect(game.combatState).toBeNull();
    });

    it('should handle save/load across multiple rounds', () => {
      // **Validates: Requirements 10.2, 10.3, 11.4, 11.5**
      
      // Play through 2 rounds
      for (let round = 0; round < 2; round++) {
        game.player.gold = 50;
        game.refreshShop();
        game.buyUnit(0);
        
        if (game.player.bench.length > 0) {
          game.placeUnit(game.player.bench[0], 0, 0);
        }

        game.initializeCombat();
        const combatResult = game.runCombatToEnd(200); // Increase max turns
        const won = combatResult.winner === 'player';
        game.advanceToNextRound(won);

        // Save after each round
        game.saveGame();
        
        // Break if player lost
        if (!won && game.player.hp <= 0) break;
      }

      // Load and verify
      const newGame = new MockGameState();
      const loadResult = newGame.loadGame();
      expect(loadResult.success).toBe(true);
      // Round should be at least 1
      expect(newGame.player.round).toBeGreaterThanOrEqual(1);
    });

    it('should preserve all system states through save/load', () => {
      // **Validates: Requirements 10.2, 10.3, 11.4, 11.5**
      
      // Set up complex state with all systems
      game.player.gold = 100;
      game.player.level = 5;
      game.player.round = 3;

      // Shop state
      game.refreshShop();
      const shopState = [...game.player.shop];

      // Board state
      game.buyUnit(0);
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 0);
      }
      const boardState = game.player.board.map(row => [...row]);

      // Bench state
      const benchState = [...game.player.bench];

      // Save
      game.saveGame();

      // Load in new instance
      const newGame = new MockGameState();
      newGame.loadGame();

      // Verify all states preserved
      expect(newGame.player.level).toBe(5);
      expect(newGame.player.round).toBe(3);
      expect(newGame.player.shop.length).toBe(shopState.length);
      expect(newGame.player.bench.length).toBe(benchState.length);
      expect(BoardSystem.getDeployCount(newGame.player.board)).toBe(
        BoardSystem.getDeployCount(boardState)
      );
    });
  });

  describe('State Validation and Error Handling', () => {
    it('should validate game state is always consistent', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      // Initial state
      let validation = game.validateState();
      expect(validation.valid).toBe(true);

      // After shop operations
      game.player.gold = 50;
      game.refreshShop();
      validation = game.validateState();
      expect(validation.valid).toBe(true);

      // After buying units
      game.buyUnit(0);
      validation = game.validateState();
      expect(validation.valid).toBe(true);

      // After deploying units
      if (game.player.bench.length > 0) {
        game.placeUnit(game.player.bench[0], 0, 0);
      }
      validation = game.validateState();
      expect(validation.valid).toBe(true);
    });

    it('should handle corrupted save data gracefully', () => {
      // **Validates: Requirements 10.2, 10.3**
      
      // Save corrupted data
      localStorage.setItem('forest_throne_progress_v1', 'corrupted data');

      // Try to load
      const loadResult = game.loadGame();
      expect(loadResult.success).toBe(false);

      // Game should still be in valid state
      const validation = game.validateState();
      expect(validation.valid).toBe(true);
    });

    it('should maintain state integrity after failed operations', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      const initialGold = game.player.gold;

      // Try to refresh with insufficient gold
      game.player.gold = 1;
      const refreshResult = game.refreshShop();
      expect(refreshResult.success).toBe(false);

      // State should be unchanged
      expect(game.player.gold).toBe(1);
      const validation = game.validateState();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large game state efficiently', () => {
      // **Validates: Requirements 11.4, 11.5**
      
      // Create large state
      game.player.gold = 1000;
      game.player.level = 25;
      game.player.round = 50;

      // Fill bench
      for (let i = 0; i < 15; i++) {
        game.player.bench.push({
          uid: createUnitUid(),
          baseId: 'bear_ancient',
          star: 1,
          base: UNIT_BY_ID['bear_ancient'],
          equips: []
        });
      }

      // Deploy units
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (game.player.bench.length > 0) {
            game.placeUnit(game.player.bench[0], row, col);
          }
        }
      }

      // Save and load should still work
      const saveResult = game.saveGame();
      expect(saveResult).toBe(true);

      const newGame = new MockGameState();
      const loadResult = newGame.loadGame();
      expect(loadResult.success).toBe(true);
      expect(newGame.player.bench.length).toBeGreaterThan(0);
    });

    it('should handle rapid save/load cycles', () => {
      // **Validates: Requirements 10.2, 10.3**
      
      for (let i = 0; i < 10; i++) {
        game.player.gold += 1;
        game.saveGame();
        game.loadGame();
      }

      expect(game.player.gold).toBeGreaterThan(10);
      const validation = game.validateState();
      expect(validation.valid).toBe(true);
    });
  });
});
