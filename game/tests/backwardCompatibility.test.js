/**
 * Backward Compatibility Tests for Architecture Refactor
 * **Validates: Requirements 10.1, 10.2, 10.3**
 * 
 * Tests that existing save files from before the architecture refactor
 * load correctly and the game continues normally without data loss.
 * 
 * This ensures that players can continue their progress after the refactor
 * without any issues.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { saveProgress, loadProgress, clearProgress } from '../src/core/persistence.js';
import { hydrateRunState } from '../src/core/runState.js';

describe('Backward Compatibility - Architecture Refactor', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Pre-Refactor Save Files', () => {
    /**
     * **Validates: Requirement 10.1**
     * WHEN loading save data from before refactor
     * THEN THE system SHALL load successfully
     */
    it('should load pre-refactor save with basic player state', () => {
      // Simulate a save file from before the refactor
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now() - 86400000, // 1 day ago
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            xp: 25,
            level: 7,
            round: 12,
            gameMode: 'PVE_JOURNEY',
            winStreak: 2,
            loseStreak: 0,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: [],
            augments: [],
            deployCapBonus: 0
          }
        }
      };

      // Save the pre-refactor data
      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));

      // Load and verify
      const loaded = loadProgress();
      
      expect(loaded).not.toBeNull();
      expect(loaded.player.hp).toBe(3);
      expect(loaded.player.gold).toBe(50);
      expect(loaded.player.level).toBe(7);
      expect(loaded.player.round).toBe(12);
      expect(loaded.player.winStreak).toBe(2);
      expect(loaded.aiMode).toBe('MEDIUM');
    });

    /**
     * **Validates: Requirement 10.1**
     * WHEN loading save with units on board
     * THEN THE units SHALL be preserved correctly
     */
    it('should preserve units on board from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 20,
            level: 5,
            round: 8,
            board: [
              [
                { uid: 'unit1', baseId: 'bear_ancient', star: 2, equips: [] },
                { uid: 'unit2', baseId: 'wolf_alpha', star: 1, equips: [] },
                null, null, null
              ],
              [
                { uid: 'unit3', baseId: 'fox_flame', star: 1, equips: [] },
                null, null, null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.board[0][0]).not.toBeNull();
      expect(loaded.player.board[0][0].baseId).toBe('bear_ancient');
      expect(loaded.player.board[0][0].star).toBe(2);
      expect(loaded.player.board[0][1]).not.toBeNull();
      expect(loaded.player.board[0][1].baseId).toBe('wolf_alpha');
      expect(loaded.player.board[1][0]).not.toBeNull();
      expect(loaded.player.board[1][0].baseId).toBe('fox_flame');
    });

    /**
     * **Validates: Requirement 10.1**
     * WHEN loading save with units on bench
     * THEN THE bench units SHALL be preserved correctly
     */
    it('should preserve bench units from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 30,
            level: 6,
            round: 10,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [
              { uid: 'bench1', baseId: 'leopard_shadow', star: 1, equips: [] },
              { uid: 'bench2', baseId: 'eagle_sky', star: 1, equips: [] },
              { uid: 'bench3', baseId: 'bear_ancient', star: 1, equips: [] }
            ],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.bench).toHaveLength(3);
      expect(loaded.player.bench[0].baseId).toBe('leopard_shadow');
      expect(loaded.player.bench[1].baseId).toBe('eagle_sky');
      expect(loaded.player.bench[2].baseId).toBe('bear_ancient');
    });

    /**
     * **Validates: Requirement 10.1**
     * WHEN loading save with shop offers
     * THEN THE shop SHALL be preserved correctly
     */
    it('should preserve shop offers from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 15,
            level: 4,
            round: 5,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: [
              { slot: 0, baseId: 'wolf_alpha' },
              { slot: 1, baseId: 'fox_flame' },
              { slot: 2, baseId: 'bear_ancient' },
              null,
              null
            ],
            shopLocked: true
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.shop).toHaveLength(5);
      expect(loaded.player.shop[0]).not.toBeNull();
      expect(loaded.player.shop[0].baseId).toBe('wolf_alpha');
      expect(loaded.player.shop[1].baseId).toBe('fox_flame');
      expect(loaded.player.shop[2].baseId).toBe('bear_ancient');
      expect(loaded.player.shopLocked).toBe(true);
    });

    /**
     * **Validates: Requirement 10.1**
     * WHEN loading save with units with equipment
     * THEN THE equipment SHALL be preserved
     */
    it('should preserve unit equipment from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 40,
            level: 8,
            round: 15,
            board: [
              [
                { 
                  uid: 'unit1', 
                  baseId: 'bear_ancient', 
                  star: 3, 
                  equips: ['item_sword', 'item_shield'] 
                },
                null, null, null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [
              { 
                uid: 'bench1', 
                baseId: 'wolf_alpha', 
                star: 2, 
                equips: ['item_bow'] 
              }
            ],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.board[0][0].equips).toEqual(['item_sword', 'item_shield']);
      expect(loaded.player.bench[0].equips).toEqual(['item_bow']);
    });
  });

  describe('Game Continues Normally After Load', () => {
    /**
     * **Validates: Requirement 10.3**
     * WHEN loading pre-refactor save and hydrating run state
     * THEN THE game state SHALL be valid and playable
     */
    it('should hydrate run state correctly from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'HARD',
          audioEnabled: false,
          player: {
            hp: 5,
            gold: 75,
            xp: 40,
            level: 10,
            round: 20,
            gameMode: 'PVE_JOURNEY',
            winStreak: 5,
            loseStreak: 0,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: [],
            augments: [],
            deployCapBonus: 1
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();
      
      // Hydrate the run state
      const runState = hydrateRunState(loaded);

      expect(runState).not.toBeNull();
      expect(runState.player.hp).toBe(5);
      expect(runState.player.gold).toBe(75);
      expect(runState.player.level).toBe(10);
      expect(runState.player.round).toBe(20);
      expect(runState.player.winStreak).toBe(5);
      expect(runState.aiMode).toBe('HARD');
    });

    /**
     * **Validates: Requirement 10.3**
     * WHEN loading save with complex game state
     * THEN ALL game state SHALL be preserved and valid
     */
    it('should preserve complex game state including augments', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 2,
            gold: 100,
            xp: 60,
            level: 15,
            round: 30,
            gameMode: 'PVE_JOURNEY',
            winStreak: 10,
            loseStreak: 0,
            board: [
              [
                { uid: 'u1', baseId: 'bear_ancient', star: 3, equips: [] },
                { uid: 'u2', baseId: 'wolf_alpha', star: 3, equips: [] },
                { uid: 'u3', baseId: 'fox_flame', star: 2, equips: [] },
                null, null
              ],
              [
                { uid: 'u4', baseId: 'leopard_shadow', star: 2, equips: [] },
                { uid: 'u5', baseId: 'eagle_sky', star: 2, equips: [] },
                null, null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [
              { uid: 'b1', baseId: 'bear_ancient', star: 1, equips: [] },
              { uid: 'b2', baseId: 'wolf_alpha', star: 1, equips: [] }
            ],
            shop: [
              { slot: 0, baseId: 'fox_flame' },
              { slot: 1, baseId: 'leopard_shadow' },
              null, null, null
            ],
            augments: ['augment_1', 'augment_2'],
            deployCapBonus: 2
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.level).toBe(15);
      expect(loaded.player.round).toBe(30);
      expect(loaded.player.winStreak).toBe(10);
      expect(loaded.player.augments).toEqual(['augment_1', 'augment_2']);
      expect(loaded.player.deployCapBonus).toBe(2);
      
      // Verify board units
      expect(loaded.player.board[0][0]).not.toBeNull();
      expect(loaded.player.board[0][1]).not.toBeNull();
      expect(loaded.player.board[0][2]).not.toBeNull();
      expect(loaded.player.board[1][0]).not.toBeNull();
      expect(loaded.player.board[1][1]).not.toBeNull();
      
      // Verify bench
      expect(loaded.player.bench).toHaveLength(2);
      
      // Verify shop
      expect(loaded.player.shop[0]).not.toBeNull();
      expect(loaded.player.shop[1]).not.toBeNull();
    });
  });

  describe('No Data Loss', () => {
    /**
     * **Validates: Requirement 10.3**
     * WHEN loading and re-saving pre-refactor data
     * THEN NO data SHALL be lost
     */
    it('should preserve all data through load and save cycle', () => {
      const originalSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'HARD',
          audioEnabled: false,
          player: {
            hp: 4,
            gold: 85,
            xp: 55,
            level: 12,
            round: 25,
            gameMode: 'PVE_JOURNEY',
            winStreak: 7,
            loseStreak: 0,
            board: [
              [
                { uid: 'u1', baseId: 'bear_ancient', star: 2, equips: ['item_1'] },
                { uid: 'u2', baseId: 'wolf_alpha', star: 2, equips: [] },
                null, null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [
              { uid: 'b1', baseId: 'fox_flame', star: 1, equips: [] }
            ],
            shop: [
              { slot: 0, baseId: 'leopard_shadow' },
              null, null, null, null
            ],
            augments: ['aug1'],
            deployCapBonus: 1,
            shopLocked: false
          }
        }
      };

      // Save original
      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(originalSave));
      
      // Load
      const loaded = loadProgress();
      expect(loaded).not.toBeNull();
      
      // Re-save
      const saved = saveProgress(loaded);
      expect(saved).toBe(true);
      
      // Load again
      const reloaded = loadProgress();
      expect(reloaded).not.toBeNull();
      
      // Verify all data preserved
      expect(reloaded.player.hp).toBe(4);
      expect(reloaded.player.gold).toBe(85);
      expect(reloaded.player.level).toBe(12);
      expect(reloaded.player.round).toBe(25);
      expect(reloaded.player.winStreak).toBe(7);
      expect(reloaded.player.board[0][0].baseId).toBe('bear_ancient');
      expect(reloaded.player.board[0][0].star).toBe(2);
      expect(reloaded.player.board[0][0].equips).toEqual(['item_1']);
      expect(reloaded.player.bench).toHaveLength(1);
      expect(reloaded.player.shop[0]).not.toBeNull();
      expect(reloaded.player.augments).toEqual(['aug1']);
      expect(reloaded.player.deployCapBonus).toBe(1);
      expect(reloaded.aiMode).toBe('HARD');
    });

    /**
     * **Validates: Requirement 10.3**
     * WHEN loading save with maximum level
     * THEN THE level SHALL be preserved correctly
     */
    it('should preserve maximum level (25) from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'HARD',
          audioEnabled: true,
          player: {
            hp: 1,
            gold: 200,
            xp: 100,
            level: 25, // Maximum level
            round: 50,
            gameMode: 'PVE_JOURNEY',
            winStreak: 20,
            loseStreak: 0,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: [],
            augments: [],
            deployCapBonus: 3
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.level).toBe(25);
      expect(loaded.player.round).toBe(50);
      expect(loaded.player.winStreak).toBe(20);
      expect(loaded.player.deployCapBonus).toBe(3);
    });

    /**
     * **Validates: Requirement 10.3**
     * WHEN loading save with units at different star levels
     * THEN ALL star levels SHALL be preserved
     */
    it('should preserve all star levels (1, 2, 3) from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 9,
            round: 18,
            board: [
              [
                { uid: 'u1', baseId: 'bear_ancient', star: 1, equips: [] },
                { uid: 'u2', baseId: 'wolf_alpha', star: 2, equips: [] },
                { uid: 'u3', baseId: 'fox_flame', star: 3, equips: [] },
                null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.board[0][0].star).toBe(1);
      expect(loaded.player.board[0][1].star).toBe(2);
      expect(loaded.player.board[0][2].star).toBe(3);
    });
  });

  describe('Save Format Unchanged', () => {
    /**
     * **Validates: Requirement 10.2**
     * WHEN saving game after refactor
     * THEN THE save format SHALL remain unchanged
     */
    it('should maintain same save format structure', () => {
      const testData = {
        aiMode: 'MEDIUM',
        audioEnabled: true,
        player: {
          hp: 3,
          gold: 30,
          xp: 15,
          level: 6,
          round: 10,
          gameMode: 'PVE_JOURNEY',
          winStreak: 3,
          loseStreak: 0,
          board: Array.from({ length: 5 }, () => Array(5).fill(null)),
          bench: [],
          shop: [],
          augments: [],
          deployCapBonus: 0
        }
      };

      // Save
      const saved = saveProgress(testData);
      expect(saved).toBe(true);

      // Load raw data
      const raw = localStorage.getItem('forest_throne_progress_v1');
      expect(raw).not.toBeNull();
      
      const parsed = JSON.parse(raw);
      
      // Verify structure
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('savedAt');
      expect(parsed).toHaveProperty('payload');
      expect(parsed.payload).toHaveProperty('aiMode');
      expect(parsed.payload).toHaveProperty('audioEnabled');
      expect(parsed.payload).toHaveProperty('player');
      expect(parsed.payload.player).toHaveProperty('hp');
      expect(parsed.payload.player).toHaveProperty('gold');
      expect(parsed.payload.player).toHaveProperty('level');
      expect(parsed.payload.player).toHaveProperty('round');
      expect(parsed.payload.player).toHaveProperty('board');
      expect(parsed.payload.player).toHaveProperty('bench');
      expect(parsed.payload.player).toHaveProperty('shop');
    });

    /**
     * **Validates: Requirement 10.2**
     * WHEN comparing save format before and after refactor
     * THEN THE format SHALL be identical
     */
    it('should use version 2 for all saves', () => {
      const testData = {
        aiMode: 'EASY',
        audioEnabled: false,
        player: {
          hp: 3,
          gold: 10,
          level: 1,
          round: 1,
          board: Array.from({ length: 5 }, () => Array(5).fill(null)),
          bench: [],
          shop: []
        }
      };

      saveProgress(testData);
      const raw = localStorage.getItem('forest_throne_progress_v1');
      const parsed = JSON.parse(raw);

      expect(parsed.version).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    /**
     * **Validates: Requirement 10.1**
     * WHEN loading save with empty board and bench
     * THEN THE save SHALL load correctly
     */
    it('should handle empty board and bench from pre-refactor save', () => {
      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'EASY',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 10,
            level: 1,
            round: 1,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.board).toHaveLength(5);
      expect(loaded.player.bench).toHaveLength(0);
      expect(loaded.player.shop).toHaveLength(0);
    });

    /**
     * **Validates: Requirement 10.1**
     * WHEN loading save with full bench
     * THEN ALL bench units SHALL be preserved
     */
    it('should handle full bench from pre-refactor save', () => {
      const fullBench = Array.from({ length: 8 }, (_, i) => ({
        uid: `bench${i}`,
        baseId: 'bear_ancient',
        star: 1,
        equips: []
      }));

      const preRefactorSave = {
        version: 2,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 8,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: fullBench,
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(preRefactorSave));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.bench).toHaveLength(8);
    });
  });
});
