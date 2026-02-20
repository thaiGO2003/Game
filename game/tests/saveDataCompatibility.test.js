/**
 * Save Data Compatibility Tests
 * **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**
 * 
 * Tests the save data migration and validation system to ensure
 * old save data works after the 120-unit expansion update.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveProgress, loadProgress, clearProgress } from '../src/core/persistence.js';

describe('Save Data Compatibility Layer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear console mocks
    vi.clearAllMocks();
  });

  describe('Version 1 to Version 2 Migration', () => {
    /**
     * **Validates: Requirement 27.1**
     * WHEN loading save data from previous version
     * THEN THE system SHALL validate and migrate data to new format
     */
    it('should migrate version 1 save data to version 2', () => {
      // Create old version 1 save data
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            xp: 10,
            level: 5,
            round: 10,
            gameMode: 'PVE_JOURNEY',
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: []
          }
        }
      };

      // Manually save old data
      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));

      // Load and migrate
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.level).toBe(5);
      expect(loaded.player.round).toBe(10);
    });

    /**
     * **Validates: Requirement 27.3**
     * WHEN save data contains invalid level or deploy cap
     * THEN THE system SHALL clamp values to valid ranges
     */
    it('should clamp level to valid range [1, 25]', () => {
      const testCases = [
        { input: 0, expected: 1 },
        { input: -5, expected: 1 },
        { input: 1, expected: 1 },
        { input: 9, expected: 9 },
        { input: 15, expected: 15 },
        { input: 25, expected: 25 },
        { input: 30, expected: 25 },
        { input: 100, expected: 25 }
      ];

      testCases.forEach(({ input, expected }) => {
        const saveData = {
          version: 1,
          savedAt: Date.now(),
          payload: {
            aiMode: 'MEDIUM',
            audioEnabled: true,
            player: {
              hp: 3,
              gold: 10,
              level: input,
              round: 1,
              board: Array.from({ length: 5 }, () => Array(5).fill(null)),
              bench: [],
              shop: []
            }
          }
        };

        localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
        const loaded = loadProgress();

        expect(loaded).not.toBeNull();
        expect(loaded.player.level).toBe(expected);
      });
    });

    /**
     * **Validates: Requirement 27.3**
     * WHEN save data contains invalid deployCapBonus
     * THEN THE system SHALL reset to 0
     */
    it('should reset invalid deployCapBonus to 0', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 10,
            level: 5,
            round: 1,
            deployCapBonus: -10, // Invalid
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.deployCapBonus).toBe(0);
    });

    /**
     * **Validates: Requirement 27.3**
     * WHEN save data contains negative values
     * THEN THE system SHALL clamp to minimum valid values
     */
    it('should clamp negative values to valid minimums', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: -5,
            gold: -100,
            level: -1,
            round: -10,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.hp).toBeGreaterThanOrEqual(0);
      expect(loaded.player.gold).toBeGreaterThanOrEqual(0);
      expect(loaded.player.level).toBeGreaterThanOrEqual(1);
      expect(loaded.player.round).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Unit Replacement', () => {
    /**
     * **Validates: Requirement 27.2**
     * WHEN save data contains units not in new catalog
     * THEN THE system SHALL replace them with equivalent units
     * 
     * Note: Currently no units are removed, so this test validates
     * the mechanism is in place for future unit removals.
     */
    it('should handle units that exist in catalog', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 10,
            level: 5,
            round: 1,
            board: [
              [
                { uid: 'unit1', baseId: 'bear_ancient', star: 1, equips: [] },
                null, null, null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [
              { uid: 'unit2', baseId: 'wolf_alpha', star: 1, equips: [] }
            ],
            shop: [
              { slot: 0, baseId: 'fox_flame' }
            ]
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      // Units should remain unchanged if they exist in catalog
      expect(loaded.player.board[0][0]).not.toBeNull();
      expect(loaded.player.bench.length).toBeGreaterThan(0);
      expect(loaded.player.shop.length).toBeGreaterThan(0);
    });

    /**
     * **Validates: Requirement 27.2**
     * WHEN save data contains invalid unit IDs
     * THEN THE system SHALL remove them
     */
    it('should remove units with invalid IDs', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 10,
            level: 5,
            round: 1,
            board: [
              [
                { uid: 'unit1', baseId: 'invalid_unit_id_12345', star: 1, equips: [] },
                null, null, null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [
              { uid: 'unit2', baseId: 'another_invalid_unit', star: 1, equips: [] }
            ],
            shop: [
              { slot: 0, baseId: 'yet_another_invalid_unit' }
            ]
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      // Invalid units should be removed
      expect(loaded.player.board[0][0]).toBeNull();
      expect(loaded.player.bench.length).toBe(0);
      expect(loaded.player.shop[0]).toBeNull();
    });
  });

  describe('Corrupted Save Data Handling', () => {
    /**
     * **Validates: Requirement 27.5**
     * WHEN save data is corrupted
     * THEN THE system SHALL start a new game and notify the player
     */
    it('should return null for completely corrupted data', () => {
      localStorage.setItem('forest_throne_progress_v1', 'not valid json {{{');
      const loaded = loadProgress();
      expect(loaded).toBeNull();
    });

    it('should return null for null save data', () => {
      localStorage.setItem('forest_throne_progress_v1', 'null');
      const loaded = loadProgress();
      expect(loaded).toBeNull();
    });

    it('should return null for missing payload', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now()
        // Missing payload
      };
      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();
      expect(loaded).toBeNull();
    });

    it('should return null for missing player data', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true
          // Missing player
        }
      };
      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();
      expect(loaded).toBeNull();
    });

    it('should return null for invalid payload type', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: "not an object"
      };
      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();
      expect(loaded).toBeNull();
    });
  });

  describe('Migration Logging', () => {
    /**
     * **Validates: Requirement 27.4**
     * WHEN migration is needed
     * THEN THE system SHALL log migration actions for debugging
     */
    it('should log migration actions to console', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 10,
            level: 5,
            round: 1,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      loadProgress();

      // Should log migration messages
      expect(consoleSpy).toHaveBeenCalledWith('[Save Data Migration]');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Migrating save data from version 1 to version 2'));
    });

    it('should log errors for corrupted data', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      localStorage.setItem('forest_throne_progress_v1', 'invalid json');
      loadProgress();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Save Data Migration]'),
        expect.anything()
      );
    });
  });

  describe('Save and Load Round Trip', () => {
    /**
     * **Validates: Requirements 27.1, 27.3**
     * WHEN saving and loading data
     * THEN THE data should be preserved correctly
     */
    it('should preserve data through save and load cycle', () => {
      const testData = {
        aiMode: 'HARD',
        audioEnabled: false,
        player: {
          hp: 5,
          gold: 100,
          xp: 50,
          level: 15,
          round: 25,
          gameMode: 'PVE_JOURNEY',
          winStreak: 3,
          loseStreak: 0,
          board: Array.from({ length: 5 }, () => Array(5).fill(null)),
          bench: [],
          shop: [],
          augments: [],
          deployCapBonus: 2
        }
      };

      // Save
      const saved = saveProgress(testData);
      expect(saved).toBe(true);

      // Load
      const loaded = loadProgress();
      expect(loaded).not.toBeNull();
      expect(loaded.player.level).toBe(15);
      expect(loaded.player.round).toBe(25);
      expect(loaded.player.gold).toBe(100);
      expect(loaded.player.hp).toBe(5);
      expect(loaded.player.deployCapBonus).toBe(2);
      expect(loaded.aiMode).toBe('HARD');
    });

    it('should handle maximum level correctly', () => {
      const testData = {
        aiMode: 'MEDIUM',
        audioEnabled: true,
        player: {
          hp: 3,
          gold: 10,
          level: 25, // Maximum level
          round: 50,
          board: Array.from({ length: 5 }, () => Array(5).fill(null)),
          bench: [],
          shop: []
        }
      };

      saveProgress(testData);
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.level).toBe(25);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty localStorage', () => {
      const loaded = loadProgress();
      expect(loaded).toBeNull();
    });

    it('should handle missing board array', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 10,
            level: 5,
            round: 1,
            // Missing board
            bench: [],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();

      // Should still load with default board
      expect(loaded).not.toBeNull();
    });

    it('should handle missing bench and shop arrays', () => {
      const saveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 10,
            level: 5,
            round: 1,
            board: Array.from({ length: 5 }, () => Array(5).fill(null))
            // Missing bench and shop
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(saveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
    });
  });
});
