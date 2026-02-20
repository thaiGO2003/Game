/**
 * Unit Tests for Knockback Position Finding
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * This test suite verifies the findKnockbackPosition() helper method:
 * - Test pushing to last empty cell
 * - Test stopping before tanker
 * - Test blocked path (no movement)
 * - Test board boundary cases
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Mock implementation of findKnockbackPosition based on CombatScene.js
 * This is the exact algorithm from task 1.3
 */
class MockKnockbackSystem {
  findKnockbackPosition(target, pushDirection, enemies, boardWidth = 10) {
    const currentCol = target.col;
    const currentRow = target.row;
    
    // Determine scan range based on push direction
    let scanStart, scanEnd, scanStep;
    if (pushDirection > 0) {
      // Pushing right (player attacking)
      scanStart = currentCol + 1;
      scanEnd = boardWidth - 1;
      scanStep = 1;
    } else {
      // Pushing left (enemy attacking)
      scanStart = currentCol - 1;
      scanEnd = 0;
      scanStep = -1;
    }
    
    // Scan for last empty cell or cell before tanker
    let lastEmptyCol = currentCol; // Default: no movement
    
    for (let col = scanStart; pushDirection > 0 ? col <= scanEnd : col >= scanEnd; col += scanStep) {
      // Check if cell is occupied
      const occupant = enemies.find(u => u.alive && u.row === currentRow && u.col === col);
      
      if (!occupant) {
        // Empty cell found
        lastEmptyCol = col;
      } else {
        // Cell occupied - check if it's a tanker
        if (occupant.classType === "TANKER") {
          // Stop at cell before tanker
          if (pushDirection > 0) {
            return Math.max(currentCol, col - 1);
          } else {
            return Math.min(currentCol, col + 1);
          }
        } else {
          // Non-tanker blocking - stop here
          break;
        }
      }
    }
    
    // Return last empty cell found (or current position if none)
    return lastEmptyCol;
  }
}

describe('Knockback Position Finding Unit Tests', () => {
  let system;

  beforeEach(() => {
    system = new MockKnockbackSystem();
  });

  describe('Pushing to last empty cell', () => {
    it('should push right to last empty cell when path is clear', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [--] [E1] [--] [--] [--] [--] [--] [--]
      const target = { row: 2, col: 3, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 3, classType: "FIGHTER", alive: true } // target itself
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should push to the last empty cell (col 9)
      expect(newCol).toBe(9);
    });

    it('should push left to last empty cell when path is clear', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [--] [--] [--] [--] [E1] [--] [--] [--]
      const target = { row: 2, col: 6, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 6, classType: "FIGHTER", alive: true } // target itself
      ];

      const newCol = system.findKnockbackPosition(target, -1, enemies, 10);

      // Should push to the last empty cell (col 0)
      expect(newCol).toBe(0);
    });

    it('should push to last empty cell before board edge', () => {
      // Board state (row 1):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [E1] [--] [--] [--] [--] [--] [--] [--] [--]
      const target = { row: 1, col: 1, classType: "ARCHER" };
      const enemies = [
        { row: 1, col: 1, classType: "ARCHER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should push to col 9 (last column)
      expect(newCol).toBe(9);
    });

    it('should push through multiple empty cells', () => {
      // Board state (row 3):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [E1] [--] [--] [--] [--] [--] [--] [--]
      const target = { row: 3, col: 2, classType: "MAGE" };
      const enemies = [
        { row: 3, col: 2, classType: "MAGE", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should push to col 9
      expect(newCol).toBe(9);
    });
  });

  describe('Stopping before tanker', () => {
    it('should stop at cell before tanker when pushing right', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [P1] [--] [--] [E1] [--] [--] [E2] [--] [--] [--]
      //                     (Fighter)      (Tanker)
      const target = { row: 2, col: 3, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 3, classType: "FIGHTER", alive: true },  // target itself
        { row: 2, col: 6, classType: "TANKER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stop at col 5 (cell before tanker at col 6)
      expect(newCol).toBe(5);
    });

    it('should stop at cell before tanker when pushing left', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [E2] [--] [--] [E1] [--] [--] [--] [--]
      //                (Tanker)      (Fighter)
      const target = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 2, classType: "TANKER", alive: true },
        { row: 2, col: 5, classType: "FIGHTER", alive: true }  // target itself
      ];

      const newCol = system.findKnockbackPosition(target, -1, enemies, 10);

      // Should stop at col 3 (cell before tanker at col 2)
      expect(newCol).toBe(3);
    });

    it('should stop before tanker even if there are empty cells beyond', () => {
      // Board state (row 1):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [E1] [--] [--] [E2] [--] [--] [--] [--] [--]
      //           (Archer)      (Tanker)
      const target = { row: 1, col: 1, classType: "ARCHER" };
      const enemies = [
        { row: 1, col: 1, classType: "ARCHER", alive: true },
        { row: 1, col: 4, classType: "TANKER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stop at col 3 (before tanker), not col 9
      expect(newCol).toBe(3);
    });

    it('should handle tanker immediately adjacent to target', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [E1] [E2] [--] [--] [--] [--] [--] [--]
      //                (Fighter)(Tanker)
      const target = { row: 2, col: 2, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 2, classType: "FIGHTER", alive: true },
        { row: 2, col: 3, classType: "TANKER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stay at current position (col 2) since tanker is immediately adjacent
      expect(newCol).toBe(2);
    });
  });

  describe('Blocked path (no movement)', () => {
    it('should not move when non-tanker unit blocks immediately', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [E1] [E2] [--] [--] [--] [--] [--] [--]
      //                (Target)(Fighter)
      const target = { row: 2, col: 2, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 2, classType: "FIGHTER", alive: true },  // target
        { row: 2, col: 3, classType: "FIGHTER", alive: true }   // blocker
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stay at current position (col 2)
      expect(newCol).toBe(2);
    });

    it('should not move when all cells are blocked by non-tankers', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [E1] [E2] [E3] [--] [--] [--] [--] [--] [--]
      //           (Target)(Fighter)(Mage)
      const target = { row: 2, col: 1, classType: "ASSASSIN" };
      const enemies = [
        { row: 2, col: 1, classType: "ASSASSIN", alive: true },  // target
        { row: 2, col: 2, classType: "FIGHTER", alive: true },
        { row: 2, col: 3, classType: "MAGE", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stay at current position (col 1) - blocked by fighter at col 2
      expect(newCol).toBe(1);
    });

    it('should not move when pushing left and immediately blocked', () => {
      // Board state (row 3):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [E2] [E1] [--] [--] [--] [--] [--] [--]
      //                (Archer)(Target)
      const target = { row: 3, col: 3, classType: "MAGE" };
      const enemies = [
        { row: 3, col: 2, classType: "ARCHER", alive: true },
        { row: 3, col: 3, classType: "MAGE", alive: true }  // target
      ];

      const newCol = system.findKnockbackPosition(target, -1, enemies, 10);

      // Should stay at current position (col 3)
      expect(newCol).toBe(3);
    });

    it('should ignore dead units when checking for blockers', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [E1] [X2] [--] [--] [--] [--] [--] [--] [--]
      //           (Target)(Dead)
      const target = { row: 2, col: 1, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 1, classType: "FIGHTER", alive: true },  // target
        { row: 2, col: 2, classType: "FIGHTER", alive: false }  // dead, should be ignored
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should push through dead unit to col 9
      expect(newCol).toBe(9);
    });
  });

  describe('Board boundary cases', () => {
    it('should not push beyond right board boundary', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [--] [--] [--] [--] [--] [--] [--] [E1]
      const target = { row: 2, col: 9, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 9, classType: "FIGHTER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stay at col 9 (already at right edge)
      expect(newCol).toBe(9);
    });

    it('should not push beyond left board boundary', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [E1] [--] [--] [--] [--] [--] [--] [--] [--] [--]
      const target = { row: 2, col: 0, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 0, classType: "FIGHTER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, -1, enemies, 10);

      // Should stay at col 0 (already at left edge)
      expect(newCol).toBe(0);
    });

    it('should handle target near right boundary with tanker', () => {
      // Board state (row 1):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [--] [--] [--] [--] [--] [--] [E1] [--] [E2]
      //                                          (Target)(Tanker)
      const target = { row: 1, col: 7, classType: "ASSASSIN" };
      const enemies = [
        { row: 1, col: 7, classType: "ASSASSIN", alive: true },
        { row: 1, col: 9, classType: "TANKER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stop at col 8 (before tanker at col 9)
      expect(newCol).toBe(8);
    });

    it('should handle target near left boundary with tanker', () => {
      // Board state (row 1):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [E2] [--] [E1] [--] [--] [--] [--] [--] [--] [--]
      //      (Tanker) (Target)
      const target = { row: 1, col: 2, classType: "ARCHER" };
      const enemies = [
        { row: 1, col: 0, classType: "TANKER", alive: true },
        { row: 1, col: 2, classType: "ARCHER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, -1, enemies, 10);

      // Should stop at col 1 (before tanker at col 0)
      expect(newCol).toBe(1);
    });

    it('should return valid column within bounds [0, boardWidth-1]', () => {
      // Test various scenarios to ensure result is always in bounds
      const scenarios = [
        { target: { row: 0, col: 0 }, direction: 1 },
        { target: { row: 0, col: 9 }, direction: -1 },
        { target: { row: 2, col: 5 }, direction: 1 },
        { target: { row: 2, col: 5 }, direction: -1 },
        { target: { row: 4, col: 0 }, direction: -1 },
        { target: { row: 4, col: 9 }, direction: 1 }
      ];

      scenarios.forEach(({ target, direction }) => {
        const enemies = [{ ...target, classType: "FIGHTER", alive: true }];
        const newCol = system.findKnockbackPosition(target, direction, enemies, 10);

        // Result must be within bounds
        expect(newCol).toBeGreaterThanOrEqual(0);
        expect(newCol).toBeLessThan(10);
      });
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should only check units in the same row', () => {
      // Board state:
      // Row 1: [--] [E2] [--] [--] [--] [--] [--] [--] [--] [--]
      // Row 2: [--] [E1] [--] [--] [--] [--] [--] [--] [--] [--]
      // Row 3: [--] [E3] [--] [--] [--] [--] [--] [--] [--] [--]
      const target = { row: 2, col: 1, classType: "FIGHTER" };
      const enemies = [
        { row: 1, col: 2, classType: "TANKER", alive: true },  // different row
        { row: 2, col: 1, classType: "FIGHTER", alive: true }, // target
        { row: 3, col: 2, classType: "TANKER", alive: true }   // different row
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should push to col 9, ignoring tankers in other rows
      expect(newCol).toBe(9);
    });

    it('should handle empty enemies array', () => {
      const target = { row: 2, col: 3, classType: "FIGHTER" };
      const enemies = [];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should push to last empty cell (col 9)
      expect(newCol).toBe(9);
    });

    it('should handle multiple tankers in path (stop at first)', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [E1] [--] [--] [E2] [--] [E3] [--] [--] [--]
      //           (Target)      (Tanker)  (Tanker)
      const target = { row: 2, col: 1, classType: "ASSASSIN" };
      const enemies = [
        { row: 2, col: 1, classType: "ASSASSIN", alive: true },
        { row: 2, col: 4, classType: "TANKER", alive: true },
        { row: 2, col: 6, classType: "TANKER", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stop at col 3 (before first tanker at col 4)
      expect(newCol).toBe(3);
    });

    it('should handle custom board width', () => {
      const target = { row: 0, col: 2, classType: "MAGE" };
      const enemies = [
        { row: 0, col: 2, classType: "MAGE", alive: true }
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 5);

      // Should push to col 4 (last column in 5-width board)
      expect(newCol).toBe(4);
    });

    it('should find last empty cell with gaps in enemy positions', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [E1] [--] [--] [E2] [--] [--] [E3] [--] [--] [--]
      //      (Target)      (Dead)            (Dead)
      const target = { row: 2, col: 0, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 0, classType: "FIGHTER", alive: true },  // target
        { row: 2, col: 3, classType: "FIGHTER", alive: false }, // dead
        { row: 2, col: 6, classType: "MAGE", alive: false }     // dead
      ];

      const newCol = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should push through dead units to col 9
      expect(newCol).toBe(9);
    });
  });
});
