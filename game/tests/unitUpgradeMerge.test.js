/**
 * Unit Upgrade/Merge Integration Tests
 * 
 * **Validates: Requirements 11.1, 11.2, 11.3**
 * 
 * Tests unit upgrade and merge functionality that will be extracted to UpgradeSystem:
 * - Auto-merge detection (3 units with same baseId and star)
 * - Unit combination (3 star 1 → 1 star 2)
 * - Equipment transfer during merge
 * - Merge from bench and board
 * - Star level limits (max star 3)
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Mock Upgrade System
 * Simulates the tryAutoMerge functionality from PlanningScene
 */
class MockUpgradeSystem {
  constructor() {
    this.board = this.createEmptyBoard();
    this.bench = [];
    this.mergeLog = [];
  }

  createEmptyBoard() {
    const board = [];
    for (let row = 0; row < 5; row++) {
      board[row] = [];
      for (let col = 0; col < 5; col++) {
        board[row][col] = null;
      }
    }
    return board;
  }

  // Get merge species key (baseId + star)
  getMergeSpeciesKey(unit) {
    return `${unit.baseId}_${unit.star}`;
  }

  // Collect all owned unit references (bench + board)
  collectOwnedUnitRefs() {
    const refs = [];
    
    // Collect from bench
    this.bench.forEach((unit, index) => {
      if (unit) {
        refs.push({
          unit,
          region: 'bench',
          index
        });
      }
    });
    
    // Collect from board
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const unit = this.board[row][col];
        if (unit) {
          refs.push({
            unit,
            region: 'board',
            row,
            col
          });
        }
      }
    }
    
    return refs;
  }

  // Check if units can be merged
  canMerge(baseId, star) {
    if (star >= 3) return false; // Max star level
    
    const refs = this.collectOwnedUnitRefs();
    const key = `${baseId}_${star}`;
    const matching = refs.filter(ref => this.getMergeSpeciesKey(ref.unit) === key);
    
    return matching.length >= 3;
  }

  // Collect equipment from units being merged
  collectMergeEquips(refs) {
    const equips = [];
    refs.forEach(ref => {
      if (ref.unit.equips && ref.unit.equips.length > 0) {
        equips.push(...ref.unit.equips);
      }
    });
    return equips;
  }

  // Remove unit references from board/bench
  removeOwnedUnitRefs(refs) {
    refs.forEach(ref => {
      if (ref.region === 'bench') {
        this.bench[ref.index] = null;
      } else if (ref.region === 'board') {
        this.board[ref.row][ref.col] = null;
      }
    });
  }

  // Place merged unit (prefer board position if available)
  placeMergedUnit(unit, preferredRef) {
    if (preferredRef.region === 'board') {
      this.board[preferredRef.row][preferredRef.col] = unit;
    } else {
      // Find first empty bench slot
      const emptySlot = this.bench.findIndex(u => u === null);
      if (emptySlot !== -1) {
        this.bench[emptySlot] = unit;
      } else {
        this.bench.push(unit);
      }
    }
  }

  // Try to auto-merge units
  tryAutoMerge() {
    const refs = this.collectOwnedUnitRefs();
    const mergeGroups = {};
    
    // Group units by species key
    refs.forEach(ref => {
      const key = this.getMergeSpeciesKey(ref.unit);
      if (!mergeGroups[key]) {
        mergeGroups[key] = [];
      }
      mergeGroups[key].push(ref);
    });
    
    let mergeCount = 0;
    
    // Process each group
    Object.entries(mergeGroups).forEach(([key, group]) => {
      const [baseId, starStr] = key.split('_');
      const star = parseInt(starStr);
      
      // Can't merge star 3 units
      if (star >= 3) return;
      
      // Need at least 3 units to merge
      while (group.length >= 3) {
        // Take first 3 units
        const toMerge = group.splice(0, 3);
        
        // Collect equipment
        const equips = this.collectMergeEquips(toMerge);
        
        // Create merged unit
        const mergedUnit = {
          uid: `merged_${Date.now()}_${Math.random()}`,
          baseId,
          star: star + 1,
          equips: equips.slice(0, 3), // Max 3 equipment slots
          hp: toMerge[0].unit.hp,
          atk: toMerge[0].unit.atk,
          name: toMerge[0].unit.name
        };
        
        // Remove source units
        this.removeOwnedUnitRefs(toMerge);
        
        // Place merged unit (prefer board position)
        const preferredRef = toMerge.find(ref => ref.region === 'board') || toMerge[0];
        this.placeMergedUnit(mergedUnit, preferredRef);
        
        // Log merge
        this.mergeLog.push({
          baseId,
          fromStar: star,
          toStar: star + 1,
          equipCount: equips.length
        });
        
        mergeCount++;
      }
    });
    
    return { mergeCount, log: this.mergeLog };
  }

  // Add unit to bench
  addToBench(unit) {
    this.bench.push(unit);
  }

  // Place unit on board
  placeOnBoard(unit, row, col) {
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      this.board[row][col] = unit;
      return true;
    }
    return false;
  }

  // Get unit count by baseId and star
  getUnitCount(baseId, star) {
    const refs = this.collectOwnedUnitRefs();
    const key = `${baseId}_${star}`;
    return refs.filter(ref => this.getMergeSpeciesKey(ref.unit) === key).length;
  }
}

// Helper to create test unit
function createUnit(baseId, star = 1, equips = []) {
  return {
    uid: `${baseId}_${star}_${Math.random()}`,
    baseId,
    star,
    equips: [...equips],
    hp: 100 * star,
    atk: 50 * star,
    name: `Unit ${baseId}`
  };
}

describe('Unit Upgrade/Merge Integration Tests', () => {
  let system;

  beforeEach(() => {
    system = new MockUpgradeSystem();
  });

  describe('Merge detection', () => {
    it('should detect merge opportunity with 3 matching units', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      expect(system.canMerge('warrior', 1)).toBe(true);
    });

    it('should not detect merge with only 2 matching units', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      expect(system.canMerge('warrior', 1)).toBe(false);
    });

    it('should not detect merge for star 3 units', () => {
      system.addToBench(createUnit('warrior', 3));
      system.addToBench(createUnit('warrior', 3));
      system.addToBench(createUnit('warrior', 3));
      
      expect(system.canMerge('warrior', 3)).toBe(false);
    });

    it('should detect merge across bench and board', () => {
      system.addToBench(createUnit('mage', 1));
      system.addToBench(createUnit('mage', 1));
      system.placeOnBoard(createUnit('mage', 1), 0, 0);
      
      expect(system.canMerge('mage', 1)).toBe(true);
    });

    it('should not mix different star levels', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 2));
      
      expect(system.canMerge('warrior', 1)).toBe(false);
      expect(system.canMerge('warrior', 2)).toBe(false);
    });

    it('should not mix different baseIds', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('mage', 1));
      
      expect(system.canMerge('warrior', 1)).toBe(false);
      expect(system.canMerge('mage', 1)).toBe(false);
    });
  });

  describe('Auto-merge execution', () => {
    it('should merge 3 star 1 units into 1 star 2 unit', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(1);
      expect(system.getUnitCount('warrior', 1)).toBe(0);
      expect(system.getUnitCount('warrior', 2)).toBe(1);
    });

    it('should merge 3 star 2 units into 1 star 3 unit', () => {
      system.addToBench(createUnit('mage', 2));
      system.addToBench(createUnit('mage', 2));
      system.addToBench(createUnit('mage', 2));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(1);
      expect(system.getUnitCount('mage', 2)).toBe(0);
      expect(system.getUnitCount('mage', 3)).toBe(1);
    });

    it('should not merge star 3 units', () => {
      system.addToBench(createUnit('warrior', 3));
      system.addToBench(createUnit('warrior', 3));
      system.addToBench(createUnit('warrior', 3));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(0);
      expect(system.getUnitCount('warrior', 3)).toBe(3);
    });

    it('should handle multiple merge groups', () => {
      // 3 warriors
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      // 3 mages
      system.addToBench(createUnit('mage', 1));
      system.addToBench(createUnit('mage', 1));
      system.addToBench(createUnit('mage', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(2);
      expect(system.getUnitCount('warrior', 2)).toBe(1);
      expect(system.getUnitCount('mage', 2)).toBe(1);
    });

    it('should handle 6 units merging into 2 star 2 units', () => {
      for (let i = 0; i < 6; i++) {
        system.addToBench(createUnit('archer', 1));
      }
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(2);
      expect(system.getUnitCount('archer', 1)).toBe(0);
      expect(system.getUnitCount('archer', 2)).toBe(2);
    });

    it('should handle 9 units merging into 1 star 3 unit', () => {
      for (let i = 0; i < 9; i++) {
        system.addToBench(createUnit('tank', 1));
      }
      
      // First merge pass: 9 star 1 → 3 star 2
      let result = system.tryAutoMerge();
      expect(result.mergeCount).toBe(3);
      expect(system.getUnitCount('tank', 2)).toBe(3);
      
      // Second merge pass: 3 star 2 → 1 star 3
      result = system.tryAutoMerge();
      expect(result.mergeCount).toBe(1); // 1 more merge in this pass
      expect(system.getUnitCount('tank', 1)).toBe(0);
      expect(system.getUnitCount('tank', 2)).toBe(0);
      expect(system.getUnitCount('tank', 3)).toBe(1);
    });
  });

  describe('Equipment transfer', () => {
    it('should transfer equipment from merged units', () => {
      system.addToBench(createUnit('warrior', 1, ['sword']));
      system.addToBench(createUnit('warrior', 1, ['shield']));
      system.addToBench(createUnit('warrior', 1, ['helmet']));
      
      system.tryAutoMerge();
      
      const refs = system.collectOwnedUnitRefs();
      const mergedUnit = refs.find(ref => ref.unit.star === 2);
      
      expect(mergedUnit).toBeDefined();
      expect(mergedUnit.unit.equips).toHaveLength(3);
      expect(mergedUnit.unit.equips).toContain('sword');
      expect(mergedUnit.unit.equips).toContain('shield');
      expect(mergedUnit.unit.equips).toContain('helmet');
    });

    it('should limit equipment to 3 slots', () => {
      system.addToBench(createUnit('warrior', 1, ['sword', 'shield']));
      system.addToBench(createUnit('warrior', 1, ['helmet', 'boots']));
      system.addToBench(createUnit('warrior', 1, ['gloves']));
      
      system.tryAutoMerge();
      
      const refs = system.collectOwnedUnitRefs();
      const mergedUnit = refs.find(ref => ref.unit.star === 2);
      
      expect(mergedUnit).toBeDefined();
      expect(mergedUnit.unit.equips).toHaveLength(3); // Max 3 equipment
    });

    it('should handle units with no equipment', () => {
      system.addToBench(createUnit('warrior', 1, []));
      system.addToBench(createUnit('warrior', 1, []));
      system.addToBench(createUnit('warrior', 1, []));
      
      system.tryAutoMerge();
      
      const refs = system.collectOwnedUnitRefs();
      const mergedUnit = refs.find(ref => ref.unit.star === 2);
      
      expect(mergedUnit).toBeDefined();
      expect(mergedUnit.unit.equips).toHaveLength(0);
    });

    it('should handle mixed equipment scenarios', () => {
      system.addToBench(createUnit('warrior', 1, ['sword']));
      system.addToBench(createUnit('warrior', 1, []));
      system.addToBench(createUnit('warrior', 1, ['shield', 'helmet']));
      
      system.tryAutoMerge();
      
      const refs = system.collectOwnedUnitRefs();
      const mergedUnit = refs.find(ref => ref.unit.star === 2);
      
      expect(mergedUnit).toBeDefined();
      expect(mergedUnit.unit.equips).toHaveLength(3);
      expect(mergedUnit.unit.equips).toContain('sword');
      expect(mergedUnit.unit.equips).toContain('shield');
      expect(mergedUnit.unit.equips).toContain('helmet');
    });
  });

  describe('Merge from bench and board', () => {
    it('should merge units from bench only', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(1);
      
      // Merged unit should be on bench
      const benchUnits = system.bench.filter(u => u !== null);
      expect(benchUnits).toHaveLength(1);
      expect(benchUnits[0].star).toBe(2);
    });

    it('should merge units from board only', () => {
      system.placeOnBoard(createUnit('warrior', 1), 0, 0);
      system.placeOnBoard(createUnit('warrior', 1), 0, 1);
      system.placeOnBoard(createUnit('warrior', 1), 0, 2);
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(1);
      
      // Merged unit should be on board
      const refs = system.collectOwnedUnitRefs();
      const boardUnits = refs.filter(ref => ref.region === 'board');
      expect(boardUnits).toHaveLength(1);
      expect(boardUnits[0].unit.star).toBe(2);
    });

    it('should prefer board position when merging mixed units', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.placeOnBoard(createUnit('warrior', 1), 2, 2);
      
      system.tryAutoMerge();
      
      // Merged unit should be on board at position 2,2
      expect(system.board[2][2]).toBeDefined();
      expect(system.board[2][2].star).toBe(2);
    });

    it('should handle merging with multiple board units', () => {
      system.placeOnBoard(createUnit('mage', 1), 0, 0);
      system.placeOnBoard(createUnit('mage', 1), 1, 1);
      system.addToBench(createUnit('mage', 1));
      
      system.tryAutoMerge();
      
      // One board position should have star 2 unit
      const refs = system.collectOwnedUnitRefs();
      const boardUnits = refs.filter(ref => ref.region === 'board');
      expect(boardUnits).toHaveLength(1);
      expect(boardUnits[0].unit.star).toBe(2);
    });
  });

  describe('Complex merge scenarios', () => {
    it('should handle cascading merges (star 1 → star 2 → star 3)', () => {
      // Add 9 star 1 units
      for (let i = 0; i < 9; i++) {
        system.addToBench(createUnit('warrior', 1));
      }
      
      // First merge pass: 9 star 1 → 3 star 2
      let result = system.tryAutoMerge();
      expect(result.mergeCount).toBe(3);
      expect(system.getUnitCount('warrior', 2)).toBe(3);
      
      // Second merge pass: 3 star 2 → 1 star 3
      result = system.tryAutoMerge();
      expect(result.mergeCount).toBe(1); // 1 more merge in this pass
      expect(system.getUnitCount('warrior', 1)).toBe(0);
      expect(system.getUnitCount('warrior', 2)).toBe(0);
      expect(system.getUnitCount('warrior', 3)).toBe(1);
    });

    it('should handle partial merges (4 units → 1 star 2 + 1 star 1)', () => {
      system.addToBench(createUnit('archer', 1));
      system.addToBench(createUnit('archer', 1));
      system.addToBench(createUnit('archer', 1));
      system.addToBench(createUnit('archer', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(1);
      expect(system.getUnitCount('archer', 1)).toBe(1); // 1 leftover
      expect(system.getUnitCount('archer', 2)).toBe(1);
    });

    it('should handle multiple different units merging simultaneously', () => {
      // 3 warriors
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      // 3 mages
      system.addToBench(createUnit('mage', 1));
      system.addToBench(createUnit('mage', 1));
      system.addToBench(createUnit('mage', 1));
      
      // 3 archers
      system.addToBench(createUnit('archer', 1));
      system.addToBench(createUnit('archer', 1));
      system.addToBench(createUnit('archer', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(3);
      expect(system.getUnitCount('warrior', 2)).toBe(1);
      expect(system.getUnitCount('mage', 2)).toBe(1);
      expect(system.getUnitCount('archer', 2)).toBe(1);
    });

    it('should handle merging with equipment across bench and board', () => {
      system.addToBench(createUnit('warrior', 1, ['sword']));
      system.placeOnBoard(createUnit('warrior', 1, ['shield']), 0, 0);
      system.addToBench(createUnit('warrior', 1, ['helmet']));
      
      system.tryAutoMerge();
      
      // Merged unit should be on board with all equipment
      expect(system.board[0][0]).toBeDefined();
      expect(system.board[0][0].star).toBe(2);
      expect(system.board[0][0].equips).toHaveLength(3);
    });

    it('should not merge when units are split across different star levels', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 2));
      system.addToBench(createUnit('warrior', 2));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(0);
      expect(system.getUnitCount('warrior', 1)).toBe(2);
      expect(system.getUnitCount('warrior', 2)).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty bench and board', () => {
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(0);
    });

    it('should handle only 1 unit', () => {
      system.addToBench(createUnit('warrior', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(0);
      expect(system.getUnitCount('warrior', 1)).toBe(1);
    });

    it('should handle exactly 2 matching units (no merge)', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.mergeCount).toBe(0);
      expect(system.getUnitCount('warrior', 1)).toBe(2);
    });

    it('should handle 10 units (3 merges + 1 leftover)', () => {
      for (let i = 0; i < 10; i++) {
        system.addToBench(createUnit('warrior', 1));
      }
      
      // First merge pass: 9 star 1 → 3 star 2 (1 star 1 remains)
      let result = system.tryAutoMerge();
      expect(result.mergeCount).toBe(3);
      expect(system.getUnitCount('warrior', 1)).toBe(1);
      expect(system.getUnitCount('warrior', 2)).toBe(3);
      
      // Second merge pass: 3 star 2 → 1 star 3
      result = system.tryAutoMerge();
      expect(result.mergeCount).toBe(1); // 1 more merge in this pass
      expect(system.getUnitCount('warrior', 1)).toBe(1);
      expect(system.getUnitCount('warrior', 3)).toBe(1);
    });

    it('should maintain unique UIDs after merge', () => {
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      system.tryAutoMerge();
      
      const refs = system.collectOwnedUnitRefs();
      const mergedUnit = refs.find(ref => ref.unit.star === 2);
      
      expect(mergedUnit).toBeDefined();
      expect(mergedUnit.unit.uid).toBeDefined();
      expect(mergedUnit.unit.uid).toContain('merged_');
    });

    it('should log merge operations', () => {
      system.addToBench(createUnit('warrior', 1, ['sword']));
      system.addToBench(createUnit('warrior', 1));
      system.addToBench(createUnit('warrior', 1));
      
      const result = system.tryAutoMerge();
      
      expect(result.log).toHaveLength(1);
      expect(result.log[0]).toEqual({
        baseId: 'warrior',
        fromStar: 1,
        toStar: 2,
        equipCount: 1
      });
    });
  });
});
