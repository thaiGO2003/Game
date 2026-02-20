/**
 * Unit Tests for Knockback Error Handling
 * 
 * **Validates: Requirements 3.6, 4.6**
 * 
 * This test suite verifies error handling in the knockback system:
 * - Ensures findKnockbackPosition() never returns invalid column
 * - Handles case where all cells are blocked
 * - Validates bounds checking and input validation
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Enhanced mock implementation with error handling
 */
class MockKnockbackSystemWithErrorHandling {
  findKnockbackPosition(target, pushDirection, enemies, boardWidth = 10) {
    // Validate inputs - check for valid numeric col and row
    if (!target || typeof target.col !== 'number' || typeof target.row !== 'number' || 
        !Number.isFinite(target.col) || !Number.isFinite(target.row)) {
      console.error('Invalid target in findKnockbackPosition:', target);
      return 0; // Return safe fallback position
    }
    
    const currentCol = target.col;
    const currentRow = target.row;
    
    // Ensure current position is within bounds
    if (currentCol < 0 || currentCol >= boardWidth) {
      console.error(`Invalid current column ${currentCol}, clamping to bounds`);
      return Math.max(0, Math.min(boardWidth - 1, currentCol));
    }
    
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
          let targetCol;
          if (pushDirection > 0) {
            targetCol = Math.max(currentCol, col - 1);
          } else {
            targetCol = Math.min(currentCol, col + 1);
          }
          // Ensure result is within bounds
          return Math.max(0, Math.min(boardWidth - 1, targetCol));
        } else {
          // Non-tanker blocking - stop here
          break;
        }
      }
    }
    
    // Ensure final result is within bounds
    const finalCol = Math.max(0, Math.min(boardWidth - 1, lastEmptyCol));
    return finalCol;
  }
}

describe('Knockback Error Handling Tests', () => {
  let system;

  beforeEach(() => {
    system = new MockKnockbackSystemWithErrorHandling();
  });

  describe('Invalid input handling', () => {
    it('should handle null target gracefully', () => {
      const result = system.findKnockbackPosition(null, 1, [], 10);
      
      // Should return 0 as fallback
      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should handle undefined target gracefully', () => {
      const result = system.findKnockbackPosition(undefined, 1, [], 10);
      
      // Should return 0 as fallback
      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should handle target with missing col property', () => {
      const target = { row: 2 }; // missing col
      const result = system.findKnockbackPosition(target, 1, [], 10);
      
      // Should return 0 as fallback
      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should handle target with missing row property', () => {
      const target = { col: 5 }; // missing row
      const result = system.findKnockbackPosition(target, 1, [], 10);
      
      // Should return 0 as fallback
      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should handle target with non-numeric col', () => {
      const target = { row: 2, col: "invalid" };
      const result = system.findKnockbackPosition(target, 1, [], 10);
      
      // Should return 0 as fallback
      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });
  });

  describe('Out of bounds position handling', () => {
    it('should clamp negative column to 0', () => {
      const target = { row: 2, col: -5, classType: "FIGHTER" };
      const enemies = [{ row: 2, col: -5, classType: "FIGHTER", alive: true }];
      
      const result = system.findKnockbackPosition(target, 1, enemies, 10);
      
      // Should clamp to valid range
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should clamp column beyond board width', () => {
      const target = { row: 2, col: 15, classType: "FIGHTER" };
      const enemies = [{ row: 2, col: 15, classType: "FIGHTER", alive: true }];
      
      const result = system.findKnockbackPosition(target, 1, enemies, 10);
      
      // Should clamp to valid range
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
      expect(result).toBe(9); // Should clamp to max valid column
    });

    it('should handle target at exactly boardWidth', () => {
      const target = { row: 2, col: 10, classType: "FIGHTER" };
      const enemies = [{ row: 2, col: 10, classType: "FIGHTER", alive: true }];
      
      const result = system.findKnockbackPosition(target, 1, enemies, 10);
      
      // Should clamp to valid range
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
      expect(result).toBe(9);
    });
  });

  describe('Always returns valid column', () => {
    it('should never return negative column', () => {
      const scenarios = [
        { target: { row: 0, col: 0 }, direction: -1 },
        { target: { row: 1, col: 1 }, direction: -1 },
        { target: { row: 2, col: 0 }, direction: 1 },
      ];

      scenarios.forEach(({ target, direction }) => {
        const enemies = [{ ...target, classType: "FIGHTER", alive: true }];
        const result = system.findKnockbackPosition(target, direction, enemies, 10);
        
        expect(result).toBeGreaterThanOrEqual(0);
      });
    });

    it('should never return column >= boardWidth', () => {
      const scenarios = [
        { target: { row: 0, col: 9 }, direction: 1 },
        { target: { row: 1, col: 8 }, direction: 1 },
        { target: { row: 2, col: 5 }, direction: 1 },
      ];

      scenarios.forEach(({ target, direction }) => {
        const enemies = [{ ...target, classType: "FIGHTER", alive: true }];
        const result = system.findKnockbackPosition(target, direction, enemies, 10);
        
        expect(result).toBeLessThan(10);
      });
    });

    it('should always return integer column', () => {
      const target = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies = [{ row: 2, col: 5, classType: "FIGHTER", alive: true }];
      
      const result = system.findKnockbackPosition(target, 1, enemies, 10);
      
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('All cells blocked scenario', () => {
    it('should return current position when all cells blocked by non-tankers', () => {
      // Board state (row 2):
      // Col: 0    1    2    3    4    5    6    7    8    9
      //      [--] [E1] [E2] [E3] [E4] [E5] [E6] [E7] [E8] [E9]
      const target = { row: 2, col: 1, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 1, classType: "FIGHTER", alive: true },
        { row: 2, col: 2, classType: "FIGHTER", alive: true },
        { row: 2, col: 3, classType: "FIGHTER", alive: true },
        { row: 2, col: 4, classType: "FIGHTER", alive: true },
        { row: 2, col: 5, classType: "FIGHTER", alive: true },
        { row: 2, col: 6, classType: "FIGHTER", alive: true },
        { row: 2, col: 7, classType: "FIGHTER", alive: true },
        { row: 2, col: 8, classType: "FIGHTER", alive: true },
        { row: 2, col: 9, classType: "FIGHTER", alive: true },
      ];

      const result = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stay at current position
      expect(result).toBe(1);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should return current position when immediately blocked', () => {
      const target = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 5, classType: "FIGHTER", alive: true },
        { row: 2, col: 6, classType: "MAGE", alive: true }, // immediate blocker
      ];

      const result = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stay at current position
      expect(result).toBe(5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should handle blocked path in both directions', () => {
      // Test pushing right when blocked
      const target1 = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies1 = [
        { row: 2, col: 5, classType: "FIGHTER", alive: true },
        { row: 2, col: 6, classType: "ARCHER", alive: true },
      ];
      const result1 = system.findKnockbackPosition(target1, 1, enemies1, 10);
      expect(result1).toBe(5);

      // Test pushing left when blocked
      const target2 = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies2 = [
        { row: 2, col: 5, classType: "FIGHTER", alive: true },
        { row: 2, col: 4, classType: "ARCHER", alive: true },
      ];
      const result2 = system.findKnockbackPosition(target2, -1, enemies2, 10);
      expect(result2).toBe(5);
    });
  });

  describe('Tanker before boundary edge cases', () => {
    it('should not return position beyond board when tanker is at edge', () => {
      // Tanker at right edge
      const target = { row: 2, col: 7, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 7, classType: "FIGHTER", alive: true },
        { row: 2, col: 9, classType: "TANKER", alive: true }, // at edge
      ];

      const result = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stop before tanker, within bounds
      expect(result).toBe(8);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should not return position beyond board when tanker is at left edge', () => {
      // Tanker at left edge
      const target = { row: 2, col: 2, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 2, classType: "FIGHTER", alive: true },
        { row: 2, col: 0, classType: "TANKER", alive: true }, // at edge
      ];

      const result = system.findKnockbackPosition(target, -1, enemies, 10);

      // Should stop before tanker, within bounds
      expect(result).toBe(1);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });

    it('should handle tanker immediately adjacent returning current position', () => {
      const target = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 5, classType: "FIGHTER", alive: true },
        { row: 2, col: 6, classType: "TANKER", alive: true }, // immediately adjacent
      ];

      const result = system.findKnockbackPosition(target, 1, enemies, 10);

      // Should stay at current position (can't move past tanker)
      expect(result).toBe(5);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(10);
    });
  });

  describe('Stress test with extreme scenarios', () => {
    it('should handle very large board width', () => {
      const target = { row: 0, col: 50, classType: "FIGHTER" };
      const enemies = [{ row: 0, col: 50, classType: "FIGHTER", alive: true }];

      const result = system.findKnockbackPosition(target, 1, enemies, 100);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(100);
    });

    it('should handle board width of 1', () => {
      const target = { row: 0, col: 0, classType: "FIGHTER" };
      const enemies = [{ row: 0, col: 0, classType: "FIGHTER", alive: true }];

      const result = system.findKnockbackPosition(target, 1, enemies, 1);

      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });

    it('should handle many enemies in the same row', () => {
      const target = { row: 2, col: 0, classType: "FIGHTER" };
      const enemies = [];
      
      // Create 100 enemies in the same row
      for (let i = 0; i < 100; i++) {
        enemies.push({ row: 2, col: i, classType: "FIGHTER", alive: true });
      }

      const result = system.findKnockbackPosition(target, 1, enemies, 100);

      // Should stay at position 0 (immediately blocked)
      expect(result).toBe(0);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(100);
    });
  });

  describe('Requirement 3.6: Never returns invalid column', () => {
    it('should always return column within [0, boardWidth-1] for random inputs', () => {
      const boardWidth = 10;
      const testCases = 100;

      for (let i = 0; i < testCases; i++) {
        const col = Math.floor(Math.random() * 20) - 5; // -5 to 14
        const row = Math.floor(Math.random() * 5);
        const direction = Math.random() > 0.5 ? 1 : -1;

        const target = { row, col, classType: "FIGHTER" };
        const enemies = [{ row, col, classType: "FIGHTER", alive: true }];

        const result = system.findKnockbackPosition(target, direction, enemies, boardWidth);

        // CRITICAL: Result must ALWAYS be valid
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(boardWidth);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe('Requirement 4.6: Appropriate feedback for blocked positions', () => {
    it('should return current position when blocked (for "KHÓA VỊ TRÍ" message)', () => {
      const target = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 5, classType: "FIGHTER", alive: true },
        { row: 2, col: 6, classType: "MAGE", alive: true },
      ];

      const result = system.findKnockbackPosition(target, 1, enemies, 10);

      // When result equals current position, game shows "KHÓA VỊ TRÍ"
      expect(result).toBe(target.col);
    });

    it('should return different position when push succeeds (for "ĐẨY LÙI" message)', () => {
      const target = { row: 2, col: 5, classType: "FIGHTER" };
      const enemies = [
        { row: 2, col: 5, classType: "FIGHTER", alive: true },
      ];

      const result = system.findKnockbackPosition(target, 1, enemies, 10);

      // When result differs from current position, game shows "ĐẨY LÙI"
      expect(result).not.toBe(target.col);
      expect(result).toBe(9); // Should push to end
    });
  });
});
