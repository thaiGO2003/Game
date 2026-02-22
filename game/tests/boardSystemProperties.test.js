/**
 * Property Tests: BoardSystem
 * 
 * **Validates: Requirements 2.4, 2.5, 2.6**
 * 
 * Feature: code-architecture-refactor
 * 
 * This test suite verifies:
 * - Property 6: Board Query Correctness - getUnitAt returns correct unit or null
 * - Property 7: Deploy Count Accuracy - getDeployCount equals number of non-null cells
 * - Property 8: Deploy Limit Enforcement - canDeploy and placeUnit respect deploy limit
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createEmptyBoard,
  getUnitAt,
  getDeployedUnits,
  isPositionEmpty,
  getDeployCount,
  canDeploy,
  placeUnit,
  isValidPosition
} from '../src/systems/BoardSystem.js';

/**
 * Arbitrary generator for valid board positions (0-4)
 */
const validPosition = () => fc.record({
  row: fc.integer({ min: 0, max: 4 }),
  col: fc.integer({ min: 0, max: 4 })
});

/**
 * Arbitrary generator for test units
 */
const testUnit = () => fc.record({
  uid: fc.string({ minLength: 1, maxLength: 20 }),
  baseId: fc.constantFrom('warrior', 'mage', 'archer', 'tank', 'healer'),
  star: fc.integer({ min: 1, max: 3 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  hp: fc.integer({ min: 50, max: 1000 }),
  atk: fc.integer({ min: 10, max: 200 }),
  classType: fc.constantFrom('Warrior', 'Mage', 'Archer', 'Tank', 'Healer'),
  tribe: fc.constantFrom('Human', 'Beast', 'Undead', 'Elemental')
});

/**
 * Helper to place units on a board at specific positions
 */
function placeUnitsOnBoard(board, positions, units, deployLimit) {
  const results = [];
  for (let i = 0; i < positions.length && i < units.length; i++) {
    const { row, col } = positions[i];
    const result = placeUnit(board, units[i], row, col, deployLimit);
    results.push(result);
  }
  return results;
}

/**
 * Helper to count non-null cells manually
 */
function countNonNullCells(board) {
  let count = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (board[row][col] !== null) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Property 6: Board Query Correctness
 * 
 * For any board state and position, querying the unit at that position should return
 * the correct unit or null. This ensures board queries are always accurate.
 * 
 * **Validates: Requirement 2.4**
 */
describe('Property 6: Board Query Correctness', () => {
  it('getUnitAt returns correct unit or null for any valid position (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(validPosition(), { minLength: 0, maxLength: 10 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 10 }),
        (positions, units) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          
          // Place units on board
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          // Verify getUnitAt returns correct unit for each position
          for (let i = 0; i < uniquePositions.length && i < units.length; i++) {
            const { row, col } = uniquePositions[i];
            const retrievedUnit = getUnitAt(board, row, col);
            
            if (retrievedUnit !== null) {
              // If unit was placed successfully, it should match
              if (retrievedUnit.uid !== units[i].uid) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getUnitAt returns null for empty positions (property-based)', () => {
    fc.assert(
      fc.property(
        validPosition(),
        (position) => {
          const board = createEmptyBoard();
          const { row, col } = position;
          
          const unit = getUnitAt(board, row, col);
          return unit === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getUnitAt returns null for invalid positions (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10, max: 10 }),
        fc.integer({ min: -10, max: 10 }),
        (row, col) => {
          // Skip valid positions
          if (isValidPosition(row, col)) {
            return true;
          }
          
          const board = createEmptyBoard();
          const unit = getUnitAt(board, row, col);
          return unit === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isPositionEmpty is consistent with getUnitAt (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(validPosition(), { minLength: 0, maxLength: 10 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 10 }),
        validPosition(),
        (positions, units, queryPos) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          
          // Place units on board
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          // Verify consistency
          const { row, col } = queryPos;
          const unit = getUnitAt(board, row, col);
          const isEmpty = isPositionEmpty(board, row, col);
          
          return (unit === null) === isEmpty;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getDeployedUnits returns all and only non-null units (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(validPosition(), { minLength: 0, maxLength: 15 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 15 }),
        (positions, units) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          
          // Place units on board
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          // Get deployed units
          const deployedUnits = getDeployedUnits(board);
          
          // Count non-null cells manually
          const manualCount = countNonNullCells(board);
          
          // Verify all deployed units are non-null
          const allNonNull = deployedUnits.every(unit => unit !== null);
          
          // Verify count matches
          const countMatches = deployedUnits.length === manualCount;
          
          return allNonNull && countMatches;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getDeployedUnits returns empty array for empty board (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const board = createEmptyBoard();
          const deployedUnits = getDeployedUnits(board);
          return deployedUnits.length === 0;
        }
      ),
      { numRuns: 10 }
    );
  });
});

/**
 * Property 7: Deploy Count Accuracy
 * 
 * For any board state, the calculated deployed unit count should always equal
 * the number of non-null positions on the board. This ensures deploy count
 * is maintained correctly after any sequence of operations.
 * 
 * **Validates: Requirement 2.5**
 */
describe('Property 7: Deploy Count Accuracy', () => {
  it('getDeployCount equals number of non-null cells (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(validPosition(), { minLength: 0, maxLength: 20 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 20 }),
        (positions, units) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          
          // Place units on board
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          // Get deploy count from system
          const systemCount = getDeployCount(board);
          
          // Count manually
          const manualCount = countNonNullCells(board);
          
          return systemCount === manualCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deploy count is 0 for empty board (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const board = createEmptyBoard();
          return getDeployCount(board) === 0;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('deploy count increases by 1 after each successful placement (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(validPosition(), { minLength: 1, maxLength: 10 }),
        fc.array(testUnit(), { minLength: 1, maxLength: 10 }),
        (positions, units) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          
          // Ensure unique positions
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          let expectedCount = 0;
          
          for (let i = 0; i < uniquePositions.length && i < units.length; i++) {
            const { row, col } = uniquePositions[i];
            const result = placeUnit(board, units[i], row, col, deployLimit);
            
            if (result.success) {
              expectedCount++;
              const actualCount = getDeployCount(board);
              if (actualCount !== expectedCount) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deploy count never exceeds 25 (full board) (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(validPosition(), { minLength: 0, maxLength: 30 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 30 }),
        (positions, units) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          
          // Place units on board
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          const count = getDeployCount(board);
          return count >= 0 && count <= 25;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deploy count is consistent across multiple queries (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(validPosition(), { minLength: 0, maxLength: 15 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 15 }),
        (positions, units) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          
          // Place units on board
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          // Query multiple times
          const count1 = getDeployCount(board);
          const count2 = getDeployCount(board);
          const count3 = getDeployCount(board);
          
          return count1 === count2 && count2 === count3;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Deploy Limit Enforcement
 * 
 * For any board state and deploy limit, attempting to place a unit when the board
 * is at capacity should be rejected. The canDeploy function should return false
 * when count >= limit, and placeUnit should respect this limit.
 * 
 * **Validates: Requirement 2.6**
 */
describe('Property 8: Deploy Limit Enforcement', () => {
  it('canDeploy returns false when count >= limit (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 25 }),
        fc.array(validPosition(), { minLength: 0, maxLength: 25 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 25 }),
        (deployLimit, positions, units) => {
          const board = createEmptyBoard();
          
          // Place units up to or beyond limit
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          const count = getDeployCount(board);
          const canDeployResult = canDeploy(board, deployLimit);
          
          // If count >= limit, canDeploy should be false
          if (count >= deployLimit) {
            return canDeployResult === false;
          }
          
          // If count < limit, canDeploy should be true
          return canDeployResult === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('placeUnit respects deploy limit (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.array(validPosition(), { minLength: 0, maxLength: 15 }),
        fc.array(testUnit(), { minLength: 0, maxLength: 15 }),
        validPosition(),
        testUnit(),
        (deployLimit, positions, units, extraPos, extraUnit) => {
          const board = createEmptyBoard();
          
          // Place units up to limit
          const uniquePositions = [];
          const positionSet = new Set();
          for (const pos of positions) {
            const key = `${pos.row},${pos.col}`;
            if (!positionSet.has(key)) {
              positionSet.add(key);
              uniquePositions.push(pos);
            }
          }
          
          placeUnitsOnBoard(board, uniquePositions, units, deployLimit);
          
          const count = getDeployCount(board);
          
          // Try to place one more unit
          const extraKey = `${extraPos.row},${extraPos.col}`;
          const isExtraPositionUsed = positionSet.has(extraKey);
          
          if (!isExtraPositionUsed && count >= deployLimit) {
            const result = placeUnit(board, extraUnit, extraPos.row, extraPos.col, deployLimit);
            return result.success === false && result.error === 'Deploy limit reached';
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deploy limit is enforced consistently (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        fc.array(testUnit(), { minLength: 1, maxLength: 25 }),
        (deployLimit, units) => {
          const board = createEmptyBoard();
          let placedCount = 0;
          
          // Try to place all units
          for (let row = 0; row < 5 && placedCount < units.length; row++) {
            for (let col = 0; col < 5 && placedCount < units.length; col++) {
              const result = placeUnit(board, units[placedCount], row, col, deployLimit);
              if (result.success) {
                placedCount++;
              } else if (getDeployCount(board) >= deployLimit) {
                // Should fail with deploy limit error
                if (result.error !== 'Deploy limit reached') {
                  return false;
                }
              }
            }
          }
          
          // Final count should not exceed limit
          const finalCount = getDeployCount(board);
          return finalCount <= deployLimit;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('canDeploy returns true when below limit (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 25 }),
        fc.integer({ min: 0, max: 4 }),
        (deployLimit, unitsToPlace) => {
          const board = createEmptyBoard();
          
          // Place fewer units than limit
          for (let i = 0; i < unitsToPlace; i++) {
            const unit = { uid: `unit${i}`, baseId: 'test', star: 1 };
            placeUnit(board, unit, 0, i, deployLimit);
          }
          
          const count = getDeployCount(board);
          const canDeployResult = canDeploy(board, deployLimit);
          
          if (count < deployLimit) {
            return canDeployResult === true;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deploy limit of 0 prevents all placements (property-based)', () => {
    fc.assert(
      fc.property(
        validPosition(),
        testUnit(),
        (position, unit) => {
          const board = createEmptyBoard();
          const deployLimit = 0;
          
          const result = placeUnit(board, unit, position.row, position.col, deployLimit);
          
          return result.success === false && result.error === 'Deploy limit reached';
        }
      ),
      { numRuns: 50 }
    );
  });

  it('deploy limit of 25 allows full board (property-based)', () => {
    fc.assert(
      fc.property(
        fc.array(testUnit(), { minLength: 25, maxLength: 25 }),
        (units) => {
          const board = createEmptyBoard();
          const deployLimit = 25;
          let index = 0;
          
          // Fill entire board
          for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
              const result = placeUnit(board, units[index], row, col, deployLimit);
              if (!result.success) {
                return false;
              }
              index++;
            }
          }
          
          // Verify full board
          const count = getDeployCount(board);
          return count === 25;
        }
      ),
      { numRuns: 20 }
    );
  });
});

