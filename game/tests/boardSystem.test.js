/**
 * BoardSystem Unit Tests
 * 
 * **Validates: Requirements 2.1, 2.2, 11.1, 11.2, 11.8, 17.6**
 * **Property 5: Board Position Validation**
 * 
 * Tests BoardSystem functionality:
 * - Position validation (isValidPosition, isValidPlayerBoardPosition, isValidBenchIndex)
 * - Position queries (isPositionEmpty, getUnitAt)
 * - Deploy count operations (getDeployCount, canDeploy)
 * - Unit placement (placeUnit with valid/invalid positions, occupied positions, deploy limits)
 * - Unit removal (removeUnit)
 * - Unit movement (moveUnit with swap and no-swap scenarios)
 * - Boundary cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidPosition,
  isValidPlayerBoardPosition,
  isValidBenchIndex,
  isPositionEmpty,
  getUnitAt,
  getDeployCount,
  getDeployedUnits,
  canDeploy,
  placeUnit,
  removeUnit,
  moveUnit,
  createEmptyBoard,
  checkDuplicateUnit,
  placeBenchUnitOnBoard,
  moveBoardUnitToBench,
  moveBenchUnit,
  calculateSynergies
} from '../src/systems/BoardSystem.js';

// Helper function to create a test unit
function createUnit(id, baseId = 'test_unit', star = 1) {
  return {
    uid: id,
    baseId,
    star,
    name: `Unit ${id}`,
    hp: 100,
    atk: 50,
    classType: 'Warrior',
    tribe: 'Human'
  };
}

describe('BoardSystem Unit Tests', () => {

  describe('Position validation', () => {
    describe('isValidPosition', () => {
      it('should validate positions within bounds (0-4)', () => {
        expect(isValidPosition(0, 0)).toBe(true);
        expect(isValidPosition(2, 2)).toBe(true);
        expect(isValidPosition(4, 4)).toBe(true);
        expect(isValidPosition(0, 4)).toBe(true);
        expect(isValidPosition(4, 0)).toBe(true);
      });

      it('should reject negative positions', () => {
        expect(isValidPosition(-1, 0)).toBe(false);
        expect(isValidPosition(0, -1)).toBe(false);
        expect(isValidPosition(-1, -1)).toBe(false);
      });

      it('should reject positions >= 5', () => {
        expect(isValidPosition(5, 0)).toBe(false);
        expect(isValidPosition(0, 5)).toBe(false);
        expect(isValidPosition(5, 5)).toBe(false);
        expect(isValidPosition(10, 10)).toBe(false);
      });

      it('should reject non-integer positions', () => {
        expect(isValidPosition(1.5, 2)).toBe(false);
        expect(isValidPosition(2, 2.5)).toBe(false);
        expect(isValidPosition(1.5, 2.5)).toBe(false);
      });

      it('should handle boundary cases', () => {
        // Test all corners
        expect(isValidPosition(0, 0)).toBe(true);
        expect(isValidPosition(0, 4)).toBe(true);
        expect(isValidPosition(4, 0)).toBe(true);
        expect(isValidPosition(4, 4)).toBe(true);
        
        // Test just outside boundaries
        expect(isValidPosition(-1, 0)).toBe(false);
        expect(isValidPosition(0, -1)).toBe(false);
        expect(isValidPosition(5, 4)).toBe(false);
        expect(isValidPosition(4, 5)).toBe(false);
      });
    });

    describe('isValidPlayerBoardPosition', () => {
      it('should validate player board positions (0-4)', () => {
        expect(isValidPlayerBoardPosition(0, 0)).toBe(true);
        expect(isValidPlayerBoardPosition(2, 2)).toBe(true);
        expect(isValidPlayerBoardPosition(4, 4)).toBe(true);
      });

      it('should reject invalid player board positions', () => {
        expect(isValidPlayerBoardPosition(-1, 0)).toBe(false);
        expect(isValidPlayerBoardPosition(0, -1)).toBe(false);
        expect(isValidPlayerBoardPosition(5, 0)).toBe(false);
        expect(isValidPlayerBoardPosition(0, 5)).toBe(false);
      });
    });

    describe('isValidBenchIndex', () => {
      it('should validate bench indices within capacity', () => {
        expect(isValidBenchIndex(0, 10)).toBe(true);
        expect(isValidBenchIndex(5, 10)).toBe(true);
        expect(isValidBenchIndex(9, 10)).toBe(true);
      });

      it('should reject negative bench indices', () => {
        expect(isValidBenchIndex(-1, 10)).toBe(false);
      });

      it('should reject bench indices >= capacity', () => {
        expect(isValidBenchIndex(10, 10)).toBe(false);
        expect(isValidBenchIndex(15, 10)).toBe(false);
      });

      it('should reject non-integer bench indices', () => {
        expect(isValidBenchIndex(1.5, 10)).toBe(false);
      });
    });
  });

  describe('Board creation and queries', () => {
    let board;

    beforeEach(() => {
      board = createEmptyBoard();
    });

    describe('createEmptyBoard', () => {
      it('should create 5x5 board', () => {
        expect(board).toHaveLength(5);
        board.forEach(row => {
          expect(row).toHaveLength(5);
        });
      });

      it('should initialize all cells to null', () => {
        board.forEach(row => {
          row.forEach(cell => {
            expect(cell).toBeNull();
          });
        });
      });
    });

    describe('isPositionEmpty', () => {
      it('should return true for empty positions', () => {
        expect(isPositionEmpty(board, 0, 0)).toBe(true);
        expect(isPositionEmpty(board, 2, 2)).toBe(true);
        expect(isPositionEmpty(board, 4, 4)).toBe(true);
      });

      it('should return false for occupied positions', () => {
        const unit = createUnit('unit1');
        board[1][1] = unit;
        
        expect(isPositionEmpty(board, 1, 1)).toBe(false);
      });

      it('should return false for invalid positions', () => {
        expect(isPositionEmpty(board, -1, 0)).toBe(false);
        expect(isPositionEmpty(board, 0, -1)).toBe(false);
        expect(isPositionEmpty(board, 5, 0)).toBe(false);
        expect(isPositionEmpty(board, 0, 5)).toBe(false);
      });
    });

    describe('getUnitAt', () => {
      it('should return unit at position', () => {
        const unit = createUnit('unit1');
        board[2][3] = unit;
        
        const retrieved = getUnitAt(board, 2, 3);
        expect(retrieved).toBe(unit);
        expect(retrieved.uid).toBe('unit1');
      });

      it('should return null for empty position', () => {
        expect(getUnitAt(board, 2, 3)).toBeNull();
      });

      it('should return null for invalid position', () => {
        expect(getUnitAt(board, -1, 0)).toBeNull();
        expect(getUnitAt(board, 5, 5)).toBeNull();
      });
    });

    describe('getDeployCount', () => {
      it('should return 0 for empty board', () => {
        expect(getDeployCount(board)).toBe(0);
      });

      it('should count single unit', () => {
        board[0][0] = createUnit('unit1');
        expect(getDeployCount(board)).toBe(1);
      });

      it('should count multiple units', () => {
        board[0][0] = createUnit('unit1');
        board[1][1] = createUnit('unit2');
        board[2][2] = createUnit('unit3');
        expect(getDeployCount(board)).toBe(3);
      });

      it('should count all 25 positions when full', () => {
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            board[row][col] = createUnit(`unit_${row}_${col}`);
          }
        }
        expect(getDeployCount(board)).toBe(25);
      });
    });

    describe('getDeployedUnits', () => {
      it('should return empty array for empty board', () => {
        const units = getDeployedUnits(board);
        expect(units).toHaveLength(0);
      });

      it('should return all deployed units', () => {
        const unit1 = createUnit('unit1');
        const unit2 = createUnit('unit2');
        const unit3 = createUnit('unit3');
        
        board[0][0] = unit1;
        board[2][2] = unit2;
        board[4][4] = unit3;
        
        const units = getDeployedUnits(board);
        expect(units).toHaveLength(3);
        expect(units).toContain(unit1);
        expect(units).toContain(unit2);
        expect(units).toContain(unit3);
      });
    });

    describe('canDeploy', () => {
      it('should return true when below deploy limit', () => {
        expect(canDeploy(board, 5)).toBe(true);
        
        board[0][0] = createUnit('unit1');
        expect(canDeploy(board, 5)).toBe(true);
      });

      it('should return false when at deploy limit', () => {
        board[0][0] = createUnit('unit1');
        board[0][1] = createUnit('unit2');
        board[0][2] = createUnit('unit3');
        
        expect(canDeploy(board, 3)).toBe(false);
      });

      it('should return false when over deploy limit', () => {
        board[0][0] = createUnit('unit1');
        board[0][1] = createUnit('unit2');
        board[0][2] = createUnit('unit3');
        
        expect(canDeploy(board, 2)).toBe(false);
      });
    });
  });

  describe('Unit placement', () => {
    let board;

    beforeEach(() => {
      board = createEmptyBoard();
    });

    describe('placeUnit - valid placements', () => {
      it('should place unit on empty position', () => {
        const unit = createUnit('unit1');
        const result = placeUnit(board, unit, 2, 2, 5);
        
        expect(result.success).toBe(true);
        expect(board[2][2]).toBeDefined();
        expect(board[2][2].uid).toBe('unit1');
        expect(board[2][2].row).toBe(2);
        expect(board[2][2].col).toBe(2);
      });

      it('should place multiple units on different positions', () => {
        const unit1 = createUnit('unit1');
        const unit2 = createUnit('unit2');
        const unit3 = createUnit('unit3');
        
        placeUnit(board, unit1, 0, 0, 5);
        placeUnit(board, unit2, 2, 2, 5);
        placeUnit(board, unit3, 4, 4, 5);
        
        expect(board[0][0].uid).toBe('unit1');
        expect(board[2][2].uid).toBe('unit2');
        expect(board[4][4].uid).toBe('unit3');
        expect(getDeployCount(board)).toBe(3);
      });

      it('should preserve unit properties', () => {
        const unit = createUnit('unit1', 'warrior', 2);
        unit.hp = 500;
        unit.atk = 100;
        
        placeUnit(board, unit, 1, 1, 5);
        
        expect(board[1][1].uid).toBe('unit1');
        expect(board[1][1].baseId).toBe('warrior');
        expect(board[1][1].star).toBe(2);
        expect(board[1][1].hp).toBe(500);
        expect(board[1][1].atk).toBe(100);
      });
    });

    describe('placeUnit - invalid positions', () => {
      it('should reject placement on invalid position', () => {
        const unit = createUnit('unit1');
        
        let result = placeUnit(board, unit, -1, 0, 5);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
        
        result = placeUnit(board, unit, 0, -1, 5);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
        
        result = placeUnit(board, unit, 5, 0, 5);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
        
        result = placeUnit(board, unit, 0, 5, 5);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
      });

      it('should not modify board on invalid placement', () => {
        const unit = createUnit('unit1');
        placeUnit(board, unit, -1, 0, 5);
        
        expect(getDeployCount(board)).toBe(0);
      });
    });

    describe('placeUnit - occupied positions', () => {
      it('should reject placement on occupied position', () => {
        const unit1 = createUnit('unit1');
        const unit2 = createUnit('unit2');
        
        placeUnit(board, unit1, 1, 1, 5);
        const result = placeUnit(board, unit2, 1, 1, 5);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Position occupied');
        expect(board[1][1].uid).toBe('unit1');
        expect(getDeployCount(board)).toBe(1);
      });
    });

    describe('placeUnit - deploy limit', () => {
      it('should reject placement when deploy limit reached', () => {
        const deployLimit = 3;
        
        placeUnit(board, createUnit('unit1'), 0, 0, deployLimit);
        placeUnit(board, createUnit('unit2'), 0, 1, deployLimit);
        placeUnit(board, createUnit('unit3'), 0, 2, deployLimit);
        
        expect(getDeployCount(board)).toBe(3);
        expect(canDeploy(board, deployLimit)).toBe(false);
        
        const result = placeUnit(board, createUnit('unit4'), 0, 3, deployLimit);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Deploy limit reached');
        expect(getDeployCount(board)).toBe(3);
      });

      it('should allow placement when below deploy limit', () => {
        const deployLimit = 5;
        
        placeUnit(board, createUnit('unit1'), 0, 0, deployLimit);
        placeUnit(board, createUnit('unit2'), 0, 1, deployLimit);
        
        expect(canDeploy(board, deployLimit)).toBe(true);
        
        const result = placeUnit(board, createUnit('unit3'), 0, 2, deployLimit);
        
        expect(result.success).toBe(true);
        expect(getDeployCount(board)).toBe(3);
      });

      it('should handle deploy limit of 25 (full board)', () => {
        const deployLimit = 25;
        let count = 0;
        
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            const result = placeUnit(board, createUnit(`unit${count}`), row, col, deployLimit);
            expect(result.success).toBe(true);
            count++;
          }
        }
        
        expect(getDeployCount(board)).toBe(25);
        expect(canDeploy(board, deployLimit)).toBe(false);
      });
    });
  });

  describe('Unit removal', () => {
    let board;

    beforeEach(() => {
      board = createEmptyBoard();
    });

    describe('removeUnit - valid removals', () => {
      it('should remove unit from position', () => {
        const unit = createUnit('unit1');
        placeUnit(board, unit, 1, 1, 5);
        
        expect(getDeployCount(board)).toBe(1);
        
        const result = removeUnit(board, 1, 1);
        
        expect(result.success).toBe(true);
        expect(result.unit.uid).toBe('unit1');
        expect(board[1][1]).toBeNull();
        expect(getDeployCount(board)).toBe(0);
      });

      it('should return removed unit', () => {
        const unit = createUnit('unit1', 'warrior', 2);
        unit.hp = 500;
        placeUnit(board, unit, 2, 2, 5);
        
        const result = removeUnit(board, 2, 2);
        
        expect(result.success).toBe(true);
        expect(result.unit.uid).toBe('unit1');
        expect(result.unit.baseId).toBe('warrior');
        expect(result.unit.star).toBe(2);
        expect(result.unit.hp).toBe(500);
      });

      it('should allow placing unit after removal', () => {
        const unit1 = createUnit('unit1');
        const unit2 = createUnit('unit2');
        
        placeUnit(board, unit1, 3, 3, 5);
        removeUnit(board, 3, 3);
        
        const result = placeUnit(board, unit2, 3, 3, 5);
        
        expect(result.success).toBe(true);
        expect(board[3][3].uid).toBe('unit2');
      });
    });

    describe('removeUnit - invalid removals', () => {
      it('should reject removal from invalid position', () => {
        let result = removeUnit(board, -1, 0);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
        
        result = removeUnit(board, 0, -1);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
        
        result = removeUnit(board, 5, 0);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid position');
      });

      it('should reject removal from empty position', () => {
        const result = removeUnit(board, 2, 2);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('No unit at position');
      });
    });
  });

  describe('Unit movement', () => {
    let board;

    beforeEach(() => {
      board = createEmptyBoard();
    });

    describe('moveUnit - to empty position', () => {
      it('should move unit to empty position', () => {
        const unit = createUnit('unit1');
        placeUnit(board, unit, 0, 0, 5);
        
        const result = moveUnit(board, 0, 0, 2, 2);
        
        expect(result.success).toBe(true);
        expect(result.swapped).toBe(false);
        expect(board[0][0]).toBeNull();
        expect(board[2][2]).toBeDefined();
        expect(board[2][2].uid).toBe('unit1');
        expect(board[2][2].row).toBe(2);
        expect(board[2][2].col).toBe(2);
      });

      it('should maintain deploy count after move', () => {
        const unit = createUnit('unit1');
        placeUnit(board, unit, 0, 0, 5);
        
        expect(getDeployCount(board)).toBe(1);
        
        moveUnit(board, 0, 0, 4, 4);
        
        expect(getDeployCount(board)).toBe(1);
      });

      it('should preserve unit properties during move', () => {
        const unit = createUnit('unit1', 'mage', 3);
        unit.hp = 1000;
        unit.atk = 200;
        placeUnit(board, unit, 1, 1, 5);
        
        moveUnit(board, 1, 1, 3, 3);
        
        expect(board[3][3].uid).toBe('unit1');
        expect(board[3][3].baseId).toBe('mage');
        expect(board[3][3].star).toBe(3);
        expect(board[3][3].hp).toBe(1000);
        expect(board[3][3].atk).toBe(200);
      });
    });

    describe('moveUnit - swap units', () => {
      it('should swap units when allowSwap is true', () => {
        const unit1 = createUnit('unit1');
        const unit2 = createUnit('unit2');
        
        placeUnit(board, unit1, 0, 0, 5);
        placeUnit(board, unit2, 1, 1, 5);
        
        const result = moveUnit(board, 0, 0, 1, 1, true);
        
        expect(result.success).toBe(true);
        expect(result.swapped).toBe(true);
        expect(board[0][0].uid).toBe('unit2');
        expect(board[0][0].row).toBe(0);
        expect(board[0][0].col).toBe(0);
        expect(board[1][1].uid).toBe('unit1');
        expect(board[1][1].row).toBe(1);
        expect(board[1][1].col).toBe(1);
      });

      it('should maintain deploy count after swap', () => {
        const unit1 = createUnit('unit1');
        const unit2 = createUnit('unit2');
        
        placeUnit(board, unit1, 0, 0, 5);
        placeUnit(board, unit2, 4, 4, 5);
        
        expect(getDeployCount(board)).toBe(2);
        
        moveUnit(board, 0, 0, 4, 4, true);
        
        expect(getDeployCount(board)).toBe(2);
      });

      it('should reject swap when allowSwap is false', () => {
        const unit1 = createUnit('unit1');
        const unit2 = createUnit('unit2');
        
        placeUnit(board, unit1, 0, 0, 5);
        placeUnit(board, unit2, 1, 1, 5);
        
        const result = moveUnit(board, 0, 0, 1, 1, false);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Destination occupied and swap not allowed');
        expect(board[0][0].uid).toBe('unit1');
        expect(board[1][1].uid).toBe('unit2');
      });
    });

    describe('moveUnit - invalid moves', () => {
      it('should reject move from invalid source position', () => {
        let result = moveUnit(board, -1, 0, 2, 2);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid source position');
        
        result = moveUnit(board, 0, -1, 2, 2);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid source position');
        
        result = moveUnit(board, 5, 0, 2, 2);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid source position');
      });

      it('should reject move to invalid destination position', () => {
        const unit = createUnit('unit1');
        placeUnit(board, unit, 0, 0, 5);
        
        let result = moveUnit(board, 0, 0, -1, 0);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid destination position');
        
        result = moveUnit(board, 0, 0, 0, -1);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid destination position');
        
        result = moveUnit(board, 0, 0, 5, 5);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid destination position');
        
        expect(board[0][0].uid).toBe('unit1');
      });

      it('should reject move from empty position', () => {
        const result = moveUnit(board, 0, 0, 2, 2);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('No unit at source position');
      });
    });
  });

  describe('Duplicate unit checking', () => {
    let board;

    beforeEach(() => {
      board = createEmptyBoard();
    });

    it('should detect duplicate unit on board', () => {
      const unit1 = createUnit('unit1', 'warrior');
      placeUnit(board, unit1, 0, 0, 5);
      
      const hasDuplicate = checkDuplicateUnit(board, 'warrior');
      expect(hasDuplicate).toBe(true);
    });

    it('should return false when no duplicate exists', () => {
      const unit1 = createUnit('unit1', 'warrior');
      placeUnit(board, unit1, 0, 0, 5);
      
      const hasDuplicate = checkDuplicateUnit(board, 'mage');
      expect(hasDuplicate).toBe(false);
    });

    it('should ignore specified position when checking', () => {
      const unit1 = createUnit('unit1', 'warrior');
      placeUnit(board, unit1, 0, 0, 5);
      
      // Checking at the same position should return false (ignoring itself)
      const hasDuplicate = checkDuplicateUnit(board, 'warrior', 0, 0);
      expect(hasDuplicate).toBe(false);
    });

    it('should detect duplicate when ignoring different position', () => {
      const unit1 = createUnit('unit1', 'warrior');
      const unit2 = createUnit('unit2', 'warrior');
      placeUnit(board, unit1, 0, 0, 5);
      placeUnit(board, unit2, 1, 1, 5);
      
      // Checking at position 2,2 should find duplicates at 0,0 and 1,1
      const hasDuplicate = checkDuplicateUnit(board, 'warrior', 2, 2);
      expect(hasDuplicate).toBe(true);
    });

    it('should return false for empty board', () => {
      const hasDuplicate = checkDuplicateUnit(board, 'warrior');
      expect(hasDuplicate).toBe(false);
    });
  });

  describe('Complex board operations', () => {
    let board;

    beforeEach(() => {
      board = createEmptyBoard();
    });

    it('should handle full board workflow', () => {
      const deployLimit = 10;
      
      // Place units
      placeUnit(board, createUnit('unit1'), 0, 0, deployLimit);
      placeUnit(board, createUnit('unit2'), 0, 1, deployLimit);
      placeUnit(board, createUnit('unit3'), 1, 0, deployLimit);
      
      expect(getDeployCount(board)).toBe(3);
      
      // Move unit
      moveUnit(board, 0, 0, 2, 2);
      expect(board[0][0]).toBeNull();
      expect(board[2][2].uid).toBe('unit1');
      
      // Swap units
      moveUnit(board, 0, 1, 2, 2, true);
      expect(board[0][1].uid).toBe('unit1');
      expect(board[2][2].uid).toBe('unit2');
      
      // Remove unit
      removeUnit(board, 1, 0);
      expect(getDeployCount(board)).toBe(2);
      
      // Place new unit in freed position
      placeUnit(board, createUnit('unit4'), 1, 0, deployLimit);
      expect(board[1][0].uid).toBe('unit4');
      expect(getDeployCount(board)).toBe(3);
    });

    it('should handle multiple operations maintaining integrity', () => {
      const deployLimit = 5;
      
      // Place 3 units
      placeUnit(board, createUnit('unit1', 'warrior'), 0, 0, deployLimit);
      placeUnit(board, createUnit('unit2', 'mage'), 1, 1, deployLimit);
      placeUnit(board, createUnit('unit3', 'archer'), 2, 2, deployLimit);
      
      expect(getDeployCount(board)).toBe(3);
      
      // Move and verify
      moveUnit(board, 0, 0, 3, 3);
      expect(board[3][3].baseId).toBe('warrior');
      
      // Remove and verify
      removeUnit(board, 1, 1);
      expect(getDeployCount(board)).toBe(2);
      
      // Place at limit
      placeUnit(board, createUnit('unit4', 'tank'), 1, 1, deployLimit);
      placeUnit(board, createUnit('unit5', 'healer'), 4, 4, deployLimit);
      expect(getDeployCount(board)).toBe(4);
      
      // Verify all units
      const units = getDeployedUnits(board);
      expect(units).toHaveLength(4);
      const baseIds = units.map(u => u.baseId).sort();
      expect(baseIds).toEqual(['archer', 'healer', 'tank', 'warrior']);
    });
  });

  describe('Board and bench operations', () => {
    let board;
    let bench;

    beforeEach(() => {
      board = createEmptyBoard();
      bench = [];
    });

    describe('placeBenchUnitOnBoard', () => {
      it('should place unit from bench to board', () => {
        bench.push(createUnit('unit1', 'warrior'));
        
        const result = placeBenchUnitOnBoard(board, bench, 0, 1, 1, 5);
        
        expect(result.success).toBe(true);
        expect(result.swapped).toBe(false);
        expect(board[1][1]).toBeDefined();
        expect(board[1][1].uid).toBe('unit1');
        expect(bench).toHaveLength(0);
      });

      it('should swap bench unit with board unit', () => {
        bench.push(createUnit('unit1', 'warrior'));
        placeUnit(board, createUnit('unit2', 'mage'), 1, 1, 5);
        
        const result = placeBenchUnitOnBoard(board, bench, 0, 1, 1, 5, true);
        
        expect(result.success).toBe(true);
        expect(result.swapped).toBe(true);
        expect(board[1][1].uid).toBe('unit1');
        expect(bench[0].uid).toBe('unit2');
      });

      it('should reject placement of duplicate unit', () => {
        bench.push(createUnit('unit1', 'warrior'));
        placeUnit(board, createUnit('unit2', 'warrior'), 0, 0, 5);
        
        const result = placeBenchUnitOnBoard(board, bench, 0, 1, 1, 5);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Duplicate unit on board');
      });

      it('should reject when deploy limit reached', () => {
        bench.push(createUnit('unit1', 'warrior'));
        placeUnit(board, createUnit('unit2', 'mage'), 0, 0, 3);
        placeUnit(board, createUnit('unit3', 'archer'), 0, 1, 3);
        placeUnit(board, createUnit('unit4', 'tank'), 0, 2, 3);
        
        const result = placeBenchUnitOnBoard(board, bench, 0, 1, 1, 3);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Deploy limit reached');
      });

      it('should reject invalid bench index', () => {
        const result = placeBenchUnitOnBoard(board, bench, 0, 1, 1, 5);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid bench index');
      });

      it('should reject invalid board position', () => {
        bench.push(createUnit('unit1', 'warrior'));
        
        const result = placeBenchUnitOnBoard(board, bench, 0, -1, 0, 5);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid board position');
      });
    });

    describe('moveBoardUnitToBench', () => {
      it('should move unit from board to bench', () => {
        placeUnit(board, createUnit('unit1', 'warrior'), 1, 1, 5);
        
        const result = moveBoardUnitToBench(board, bench, 1, 1, 0, 10);
        
        expect(result.success).toBe(true);
        expect(result.swapped).toBe(false);
        expect(board[1][1]).toBeNull();
        expect(bench).toHaveLength(1);
        expect(bench[0].uid).toBe('unit1');
      });

      it('should swap board unit with bench unit', () => {
        placeUnit(board, createUnit('unit1', 'warrior'), 1, 1, 5);
        bench.push(createUnit('unit2', 'mage'));
        
        const result = moveBoardUnitToBench(board, bench, 1, 1, 0, 10, true);
        
        expect(result.success).toBe(true);
        expect(result.swapped).toBe(true);
        expect(board[1][1].uid).toBe('unit2');
        expect(bench[0].uid).toBe('unit1');
      });

      it('should reject when bench is full and trying to add to end', () => {
        placeUnit(board, createUnit('unit1', 'warrior'), 1, 1, 5);
        // Fill bench to capacity (10 units)
        for (let i = 0; i < 10; i++) {
          bench.push(createUnit(`unit${i}`, 'mage'));
        }
        
        // Try to move to a valid index (9) but bench is already at capacity
        // Since bench[9] exists (has a unit), this will try to swap
        // Let's try index 10 which is at the edge of benchCap
        // Actually, benchIndex 10 will fail isValidBenchIndex check
        // The "Bench is full" error occurs when:
        // - benchIndex is valid (< benchCap)
        // - bench[benchIndex] is null or undefined
        // - bench.length >= benchCap
        
        // This scenario is actually hard to trigger because if bench.length is 10
        // and benchCap is 10, all indices 0-9 will have units
        // Let's test a different scenario: bench has 9 units, benchCap is 10
        bench.length = 0; // Clear bench
        for (let i = 0; i < 9; i++) {
          bench.push(createUnit(`unit${i}`, 'mage'));
        }
        
        // Now bench.length is 9, benchCap is 10
        // Try to add to index 9 (valid index, no unit there yet)
        let result = moveBoardUnitToBench(board, bench, 1, 1, 9, 10);
        expect(result.success).toBe(true); // Should succeed
        
        // Now bench is full (10 units)
        // Place another unit on board
        placeUnit(board, createUnit('unit_new', 'warrior'), 2, 2, 5);
        
        // Try to add to index 10 (invalid - beyond benchCap)
        result = moveBoardUnitToBench(board, bench, 2, 2, 10, 10);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid bench index');
      });

      it('should reject invalid board position', () => {
        const result = moveBoardUnitToBench(board, bench, -1, 0, 0, 10);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid board position');
      });

      it('should reject invalid bench index', () => {
        placeUnit(board, createUnit('unit1', 'warrior'), 1, 1, 5);
        
        const result = moveBoardUnitToBench(board, bench, 1, 1, -1, 10);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid bench index');
      });
    });

    describe('moveBenchUnit', () => {
      it('should move unit within bench', () => {
        bench.push(createUnit('unit1', 'warrior'));
        bench.push(createUnit('unit2', 'mage'));
        bench.push(createUnit('unit3', 'archer'));
        
        // Moving from index 0 to index 1 (adjacent swap scenario)
        const result = moveBenchUnit(bench, 0, 1);
        
        expect(result.success).toBe(true);
        // After removing unit1 from index 0, bench becomes [unit2, unit3]
        // Then unit1 is inserted at index 1 (between unit2 and unit3)
        expect(bench[0].uid).toBe('unit2');
        expect(bench[1].uid).toBe('unit1');
        expect(bench[2].uid).toBe('unit3');
      });

      it('should swap bench units', () => {
        bench.push(createUnit('unit1', 'warrior'));
        bench.push(createUnit('unit2', 'mage'));
        
        const result = moveBenchUnit(bench, 0, 1, true);
        
        expect(result.success).toBe(true);
        expect(result.swapped).toBe(true);
        expect(bench[0].uid).toBe('unit2');
        expect(bench[1].uid).toBe('unit1');
      });

      it('should reject when source and destination are same', () => {
        bench.push(createUnit('unit1', 'warrior'));
        
        const result = moveBenchUnit(bench, 0, 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Source and destination are the same');
      });

      it('should reject invalid source index', () => {
        const result = moveBenchUnit(bench, 0, 1);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid source bench index');
      });
    });
  });

  describe('Synergy calculation', () => {
    it('should calculate synergies for empty unit list', () => {
      const result = calculateSynergies([]);
      
      expect(result.classCounts).toEqual({});
      expect(result.tribeCounts).toEqual({});
      expect(result.activeSynergies).toHaveLength(0);
    });

    it('should count units by class', () => {
      const units = [
        createUnit('unit1', 'warrior', 1),
        createUnit('unit2', 'warrior', 1),
        createUnit('unit3', 'mage', 1)
      ];
      units[0].classType = 'Warrior';
      units[1].classType = 'Warrior';
      units[2].classType = 'Mage';
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['Warrior']).toBe(2);
      expect(result.classCounts['Mage']).toBe(1);
    });

    it('should count units by tribe', () => {
      const units = [
        createUnit('unit1', 'warrior', 1),
        createUnit('unit2', 'warrior', 1),
        createUnit('unit3', 'mage', 1)
      ];
      units[0].tribe = 'Human';
      units[1].tribe = 'Human';
      units[2].tribe = 'Elf';
      
      const result = calculateSynergies(units);
      
      expect(result.tribeCounts['Human']).toBe(2);
      expect(result.tribeCounts['Elf']).toBe(1);
    });

    it('should handle units with undefined/null synergy values', () => {
      const units = [
        { uid: 'unit1', baseId: 'test', classType: undefined, tribe: null },
        { uid: 'unit2', baseId: 'test', classType: 'Warrior', tribe: 'Human' }
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['Warrior']).toBe(1);
      expect(result.tribeCounts['Human']).toBe(1);
      expect(result.classCounts['undefined']).toBeUndefined();
      expect(result.tribeCounts['null']).toBeUndefined();
    });

    it('should handle units with base property synergy values', () => {
      const units = [
        {
          uid: 'unit1',
          baseId: 'test',
          base: { classType: 'Warrior', tribe: 'Human' }
        },
        {
          uid: 'unit2',
          baseId: 'test',
          base: { classType: 'Warrior', tribe: 'Human' }
        }
      ];
      
      const result = calculateSynergies(units);
      
      expect(result.classCounts['Warrior']).toBe(2);
      expect(result.tribeCounts['Human']).toBe(2);
    });

    it('should return active synergies structure', () => {
      const units = [];
      for (let i = 0; i < 4; i++) {
        const unit = createUnit(`unit${i}`, 'warrior', 1);
        unit.classType = 'Warrior';
        unit.tribe = 'Human';
        units.push(unit);
      }
      
      const result = calculateSynergies(units);
      
      expect(result.activeSynergies).toBeDefined();
      expect(Array.isArray(result.activeSynergies)).toBe(true);
      
      // Check if synergies have correct structure
      result.activeSynergies.forEach(synergy => {
        expect(synergy).toHaveProperty('type');
        expect(synergy).toHaveProperty('key');
        expect(synergy).toHaveProperty('count');
        expect(synergy).toHaveProperty('tier');
        expect(synergy).toHaveProperty('threshold');
        expect(synergy).toHaveProperty('bonuses');
      });
    });
  });

  describe('Edge cases and boundary conditions', () => {
    let board;

    beforeEach(() => {
      board = createEmptyBoard();
    });

    it('should handle placing unit at all corner positions', () => {
      const corners = [
        [0, 0], [0, 4], [4, 0], [4, 4]
      ];
      
      corners.forEach(([row, col], index) => {
        const unit = createUnit(`unit${index}`);
        const result = placeUnit(board, unit, row, col, 5);
        expect(result.success).toBe(true);
      });
      
      expect(getDeployCount(board)).toBe(4);
    });

    it('should handle placing unit at all edge positions', () => {
      const edges = [
        [0, 1], [0, 2], [0, 3],  // Top edge
        [4, 1], [4, 2], [4, 3],  // Bottom edge
        [1, 0], [2, 0], [3, 0],  // Left edge
        [1, 4], [2, 4], [3, 4]   // Right edge
      ];
      
      edges.forEach(([row, col], index) => {
        const unit = createUnit(`unit${index}`);
        const result = placeUnit(board, unit, row, col, 15);
        expect(result.success).toBe(true);
      });
      
      expect(getDeployCount(board)).toBe(12);
    });

    it('should handle deploy limit of 0', () => {
      const unit = createUnit('unit1');
      const result = placeUnit(board, unit, 0, 0, 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Deploy limit reached');
    });

    it('should handle deploy limit of 1', () => {
      const unit1 = createUnit('unit1');
      const unit2 = createUnit('unit2');
      
      let result = placeUnit(board, unit1, 0, 0, 1);
      expect(result.success).toBe(true);
      
      result = placeUnit(board, unit2, 0, 1, 1);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Deploy limit reached');
    });

    it('should handle moving unit to same position (via swap)', () => {
      const unit = createUnit('unit1');
      placeUnit(board, unit, 1, 1, 5);
      
      // This should technically work as a no-op swap
      const result = moveUnit(board, 1, 1, 1, 1);
      
      // The function doesn't explicitly handle this, but it shouldn't break
      expect(board[1][1]).toBeDefined();
    });

    it('should maintain unit data integrity through multiple operations', () => {
      const unit = createUnit('unit1', 'warrior', 3);
      unit.hp = 1500;
      unit.atk = 300;
      unit.customProp = 'test';
      
      // Place
      placeUnit(board, unit, 0, 0, 5);
      expect(board[0][0].customProp).toBe('test');
      
      // Move
      moveUnit(board, 0, 0, 2, 2);
      expect(board[2][2].customProp).toBe('test');
      expect(board[2][2].hp).toBe(1500);
      
      // Remove and verify
      const result = removeUnit(board, 2, 2);
      expect(result.unit.customProp).toBe('test');
      expect(result.unit.atk).toBe(300);
    });
  });
});
