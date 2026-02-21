/**
 * Legacy Status Migration Tests
 * **Validates: Requirement 7.1**
 * 
 * Tests the migration of legacy speed-based statuses (slowTurns, hasteTurns)
 * to the new evasion-based system (evadeDebuffTurns, evadeBuffTurns).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { saveProgress, loadProgress, clearProgress } from '../src/core/persistence.js';

describe('Legacy Status Migration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('slowTurns to evadeDebuffTurns Migration', () => {
    /**
     * **Validates: Requirement 7.1**
     * WHEN save data contains units with slowTurns
     * THEN THE system SHALL convert slowTurns to evadeDebuffTurns with 15% penalty
     */
    it('should migrate slowTurns to evadeDebuffTurns on board units', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: [],
                  statuses: {
                    slowTurns: 3,
                    stunTurns: 0,
                    poisonTurns: 0
                  }
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      const unit = loaded.player.board[0][0];
      expect(unit).not.toBeNull();
      expect(unit.statuses.slowTurns).toBeUndefined();
      expect(unit.statuses.evadeDebuffTurns).toBe(3);
      expect(unit.statuses.evadeDebuffValue).toBe(0.15);
    });

    it('should migrate slowTurns to evadeDebuffTurns on bench units', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [
              {
                uid: 'unit2',
                baseId: 'wolf_alpha',
                star: 1,
                equips: [],
                statuses: {
                  slowTurns: 2,
                  stunTurns: 0
                }
              }
            ],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.bench.length).toBe(1);
      const unit = loaded.player.bench[0];
      expect(unit.statuses.slowTurns).toBeUndefined();
      expect(unit.statuses.evadeDebuffTurns).toBe(2);
      expect(unit.statuses.evadeDebuffValue).toBe(0.15);
    });

    it('should not migrate slowTurns if value is 0', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: [],
                  statuses: {
                    slowTurns: 0,
                    stunTurns: 0
                  }
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      const unit = loaded.player.board[0][0];
      expect(unit).not.toBeNull();
      expect(unit.statuses.slowTurns).toBeUndefined();
      expect(unit.statuses.evadeDebuffTurns).toBeUndefined();
      expect(unit.statuses.evadeDebuffValue).toBeUndefined();
    });
  });

  describe('hasteTurns to evadeBuffTurns Migration', () => {
    /**
     * **Validates: Requirement 7.1**
     * WHEN save data contains units with hasteTurns
     * THEN THE system SHALL convert hasteTurns to evadeBuffTurns with 10% bonus
     */
    it('should migrate hasteTurns to evadeBuffTurns on board units', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'fox_flame',
                  star: 1,
                  equips: [],
                  statuses: {
                    hasteTurns: 2,
                    stunTurns: 0
                  }
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      const unit = loaded.player.board[0][0];
      expect(unit).not.toBeNull();
      expect(unit.statuses.hasteTurns).toBeUndefined();
      expect(unit.statuses.evadeBuffTurns).toBe(2);
      expect(unit.statuses.evadeBuffValue).toBe(0.10);
    });

    it('should migrate hasteTurns to evadeBuffTurns on bench units', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: Array.from({ length: 5 }, () => Array(5).fill(null)),
            bench: [
              {
                uid: 'unit2',
                baseId: 'fox_flame',
                star: 1,
                equips: [],
                statuses: {
                  hasteTurns: 3,
                  stunTurns: 0
                }
              }
            ],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded.player.bench.length).toBe(1);
      const unit = loaded.player.bench[0];
      expect(unit.statuses.hasteTurns).toBeUndefined();
      expect(unit.statuses.evadeBuffTurns).toBe(3);
      expect(unit.statuses.evadeBuffValue).toBe(0.10);
    });

    it('should not migrate hasteTurns if value is 0', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'fox_flame',
                  star: 1,
                  equips: [],
                  statuses: {
                    hasteTurns: 0,
                    stunTurns: 0
                  }
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      const unit = loaded.player.board[0][0];
      expect(unit).not.toBeNull();
      expect(unit.statuses.hasteTurns).toBeUndefined();
      expect(unit.statuses.evadeBuffTurns).toBeUndefined();
      expect(unit.statuses.evadeBuffValue).toBeUndefined();
    });
  });

  describe('Combined Migration', () => {
    /**
     * **Validates: Requirement 7.1**
     * WHEN save data contains units with both slowTurns and hasteTurns
     * THEN THE system SHALL migrate both statuses correctly
     */
    it('should migrate both slowTurns and hasteTurns on different units', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: [],
                  statuses: {
                    slowTurns: 3,
                    stunTurns: 0
                  }
                },
                {
                  uid: 'unit2',
                  baseId: 'fox_flame',
                  star: 1,
                  equips: [],
                  statuses: {
                    hasteTurns: 2,
                    stunTurns: 0
                  }
                },
                null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      
      // Check slow unit
      const slowUnit = loaded.player.board[0][0];
      expect(slowUnit).not.toBeNull();
      expect(slowUnit.statuses.slowTurns).toBeUndefined();
      expect(slowUnit.statuses.evadeDebuffTurns).toBe(3);
      expect(slowUnit.statuses.evadeDebuffValue).toBe(0.15);
      
      // Check haste unit
      const hasteUnit = loaded.player.board[0][1];
      expect(hasteUnit).not.toBeNull();
      expect(hasteUnit.statuses.hasteTurns).toBeUndefined();
      expect(hasteUnit.statuses.evadeBuffTurns).toBe(2);
      expect(hasteUnit.statuses.evadeBuffValue).toBe(0.10);
    });

    it('should handle units without legacy statuses', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: [],
                  statuses: {
                    stunTurns: 0,
                    poisonTurns: 0
                  }
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      const unit = loaded.player.board[0][0];
      expect(unit).not.toBeNull();
      expect(unit.statuses.slowTurns).toBeUndefined();
      expect(unit.statuses.hasteTurns).toBeUndefined();
      expect(unit.statuses.evadeDebuffTurns).toBeUndefined();
      expect(unit.statuses.evadeBuffTurns).toBeUndefined();
    });

    it('should handle units without statuses object', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: []
                  // Missing statuses object
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      const unit = loaded.player.board[0][0];
      expect(unit).not.toBeNull();
      // Should not crash, unit should still be loaded
      expect(unit.baseId).toBe('bear_ancient');
    });
  });

  describe('Migration Logging', () => {
    /**
     * **Validates: Requirement 27.4**
     * WHEN legacy statuses are migrated
     * THEN THE system SHALL log migration actions for debugging
     */
    it('should log migration of legacy statuses', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: [],
                  statuses: {
                    slowTurns: 3
                  }
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      loadProgress();

      // Should log migration messages
      expect(consoleSpy).toHaveBeenCalledWith('[Save Data Migration]');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Migrated legacy speed statuses for unit bear_ancient')
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple units with legacy statuses', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: [],
                  statuses: { slowTurns: 3 }
                },
                {
                  uid: 'unit2',
                  baseId: 'wolf_alpha',
                  star: 1,
                  equips: [],
                  statuses: { hasteTurns: 2 }
                },
                null, null, null
              ],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null],
              [null, null, null, null, null]
            ],
            bench: [
              {
                uid: 'unit3',
                baseId: 'fox_flame',
                star: 1,
                equips: [],
                statuses: { slowTurns: 1 }
              }
            ],
            shop: []
          }
        }
      };

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      
      // All units should be migrated
      expect(loaded.player.board[0][0].statuses.evadeDebuffTurns).toBe(3);
      expect(loaded.player.board[0][1].statuses.evadeBuffTurns).toBe(2);
      expect(loaded.player.bench[0].statuses.evadeDebuffTurns).toBe(1);
    });

    it('should preserve other status effects during migration', () => {
      const oldSaveData = {
        version: 1,
        savedAt: Date.now(),
        payload: {
          aiMode: 'MEDIUM',
          audioEnabled: true,
          player: {
            hp: 3,
            gold: 50,
            level: 5,
            round: 10,
            board: [
              [
                {
                  uid: 'unit1',
                  baseId: 'bear_ancient',
                  star: 1,
                  equips: [],
                  statuses: {
                    slowTurns: 3,
                    stunTurns: 2,
                    poisonTurns: 1,
                    poisonPerTurn: 10,
                    tauntTurns: 1
                  }
                },
                null, null, null, null
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

      localStorage.setItem('forest_throne_progress_v1', JSON.stringify(oldSaveData));
      const loaded = loadProgress();

      expect(loaded).not.toBeNull();
      const unit = loaded.player.board[0][0];
      
      // Legacy status migrated
      expect(unit.statuses.slowTurns).toBeUndefined();
      expect(unit.statuses.evadeDebuffTurns).toBe(3);
      expect(unit.statuses.evadeDebuffValue).toBe(0.15);
      
      // Other statuses preserved
      expect(unit.statuses.stunTurns).toBe(2);
      expect(unit.statuses.poisonTurns).toBe(1);
      expect(unit.statuses.poisonPerTurn).toBe(10);
      expect(unit.statuses.tauntTurns).toBe(1);
    });
  });
});
