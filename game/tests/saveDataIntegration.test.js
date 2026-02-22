/**
 * Save Data Integration Tests
 * Tests the full save/load pipeline including persistence and runState hydration
 * **Validates: Requirements 27.1, 27.2, 27.3**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { saveProgress, loadProgress } from '../src/core/persistence.js';
import { hydrateRunState } from '../src/core/runState.js';

describe('Save Data Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * **Validates: Requirements 27.1, 27.3**
   * Tests the full pipeline: save -> load -> hydrate
   */
  it('should handle full save/load/hydrate pipeline', () => {
    // Create test data
    const testData = {
      aiMode: 'HARD',
      audioEnabled: true,
      player: {
        hp: 5,
        gold: 100,
        xp: 50,
        level: 15,
        round: 25,
        gameMode: 'EndlessPvEClassic',
        board: Array.from({ length: 5 }, () => Array(5).fill(null)),
        bench: [],
        shop: []
      }
    };

    // Save
    const saved = saveProgress(testData);
    expect(saved).toBe(true);

    // Load (with migration)
    const loaded = loadProgress();
    expect(loaded).not.toBeNull();

    // Hydrate (with validation)
    const hydrated = hydrateRunState(loaded);
    expect(hydrated).not.toBeNull();
    expect(hydrated.player.level).toBe(15);
    expect(hydrated.player.round).toBe(25);
  });

  /**
   * **Validates: Requirement 27.3**
   * Tests that level clamping works through the full pipeline
   */
  it('should clamp level through full pipeline', () => {
    const testData = {
      aiMode: 'MEDIUM',
      audioEnabled: true,
      player: {
        hp: 3,
        gold: 10,
        level: 100, // Way over max
        round: 1,
        board: Array.from({ length: 5 }, () => Array(5).fill(null)),
        bench: [],
        shop: []
      }
    };

    saveProgress(testData);
    const loaded = loadProgress();
    const hydrated = hydrateRunState(loaded);

    expect(hydrated).not.toBeNull();
    expect(hydrated.player.level).toBe(25); // Clamped to max
  });

  /**
   * **Validates: Requirement 27.3**
   * Tests that old version 1 saves with level 9 work correctly
   */
  it('should handle old version 1 save with level 9', () => {
    // Simulate old save data (version 1, max level was 9)
    const oldSaveData = {
      version: 1,
      savedAt: Date.now(),
      payload: {
        aiMode: 'MEDIUM',
        audioEnabled: true,
        player: {
          hp: 3,
          gold: 50,
          level: 9, // Old max level
          round: 20,
          board: Array.from({ length: 5 }, () => Array(5).fill(null)),
          bench: [],
          shop: []
        }
      }
    };

    localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
    
    const loaded = loadProgress();
    const hydrated = hydrateRunState(loaded);

    expect(hydrated).not.toBeNull();
    expect(hydrated.player.level).toBe(9); // Should remain 9 (valid in new system)
  });

  /**
   * **Validates: Requirement 27.2**
   * Tests that units are properly validated through the pipeline
   */
  it('should validate units through full pipeline', () => {
    const testData = {
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
        shop: []
      }
    };

    saveProgress(testData);
    const loaded = loadProgress();
    const hydrated = hydrateRunState(loaded);

    expect(hydrated).not.toBeNull();
    expect(hydrated.player.board[0][0]).not.toBeNull();
    expect(hydrated.player.board[0][0].baseId).toBe('bear_ancient');
    expect(hydrated.player.bench.length).toBe(1);
    expect(hydrated.player.bench[0].baseId).toBe('wolf_alpha');
  });

  /**
   * **Validates: Requirement 27.5**
   * Tests that corrupted data is handled gracefully
   */
  it('should handle corrupted data gracefully through pipeline', () => {
    localStorage.setItem('forest_throne_progress_v1', 'corrupted data');
    
    const loaded = loadProgress();
    expect(loaded).toBeNull();

    // hydrateRunState should also handle null input
    const hydrated = hydrateRunState(loaded);
    expect(hydrated).toBeNull();
  });
});
