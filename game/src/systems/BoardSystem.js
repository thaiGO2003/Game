/**
 * BoardSystem - Board Management System
 * 
 * Manages board state and unit placement operations.
 * This system is independent of Phaser and uses pure functions where possible.
 * 
 * **Validates: Requirements 1.1, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 13.4**
 */

import { CLASS_SYNERGY, TRIBE_SYNERGY } from "../data/synergies.js";

/**
 * Board dimensions
 */
const BOARD_ROWS = 5;
const BOARD_COLS = 5;
const PLAYER_COLS = 5; // Player side columns (0-4)

/**
 * Validates if a position is within board bounds (0-4 for both row and col)
 * 
 * @param {number} row - Row index (0-4)
 * @param {number} col - Column index (0-4)
 * @returns {boolean} True if position is valid, false otherwise
 * 
 * **Validates: Requirement 2.1**
 */
export function isValidPosition(row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_ROWS &&
    col >= 0 &&
    col < BOARD_COLS
  );
}

/**
 * Checks if a position on the board is empty
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean} True if position is empty, false otherwise
 * 
 * **Validates: Requirement 2.2**
 */
export function isPositionEmpty(board, row, col) {
  if (!isValidPosition(row, col)) return false;
  return board[row][col] === null;
}

/**
 * Gets the unit at a specific position on the board
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {Object|null} Unit at position or null if empty/invalid
 * 
 * **Validates: Requirement 2.4**
 */
export function getUnitAt(board, row, col) {
  if (!isValidPosition(row, col)) return null;
  return board[row][col];
}

/**
 * Counts the number of deployed units on the board
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix
 * @returns {number} Number of non-null units on board
 * 
 * **Validates: Requirement 2.5**
 */
export function getDeployCount(board) {
  let count = 0;
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[row][col] !== null) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Gets all deployed units from the board
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix
 * @returns {Array<Object>} Array of all units on board
 */
export function getDeployedUnits(board) {
  const units = [];
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      if (board[row][col] !== null) {
        units.push(board[row][col]);
      }
    }
  }
  return units;
}

/**
 * Checks if a unit can be deployed based on current deploy count and limit
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix
 * @param {number} deployLimit - Maximum number of units allowed on board
 * @returns {boolean} True if deployment is allowed, false otherwise
 * 
 * **Validates: Requirement 2.6**
 */
export function canDeploy(board, deployLimit) {
  return getDeployCount(board) < deployLimit;
}

/**
 * Places a unit on the board at the specified position
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {Object} unit - Unit to place
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} deployLimit - Maximum number of units allowed on board
 * @returns {Object} Result object with success flag and optional error message
 * 
 * **Validates: Requirements 2.1, 2.2, 2.6**
 */
export function placeUnit(board, unit, row, col, deployLimit) {
  // Validate position
  if (!isValidPosition(row, col)) {
    return { success: false, error: 'Invalid position' };
  }

  // Check if position is empty
  if (!isPositionEmpty(board, row, col)) {
    return { success: false, error: 'Position occupied' };
  }

  // Check deploy limit
  if (!canDeploy(board, deployLimit)) {
    return { success: false, error: 'Deploy limit reached' };
  }

  // Place unit
  board[row][col] = { ...unit, row, col };
  return { success: true };
}

/**
 * Removes a unit from the board at the specified position
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {Object} Result object with success flag, optional error, and removed unit
 * 
 * **Validates: Requirements 2.1, 2.3**
 */
export function removeUnit(board, row, col) {
  if (!isValidPosition(row, col)) {
    return { success: false, error: 'Invalid position' };
  }

  const unit = board[row][col];
  if (!unit) {
    return { success: false, error: 'No unit at position' };
  }

  board[row][col] = null;
  return { success: true, unit };
}

/**
 * Moves a unit from one position to another on the board
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {number} fromRow - Source row index
 * @param {number} fromCol - Source column index
 * @param {number} toRow - Destination row index
 * @param {number} toCol - Destination column index
 * @param {boolean} allowSwap - Whether to allow swapping with existing unit at destination
 * @returns {Object} Result object with success flag, optional error, and swap status
 * 
 * **Validates: Requirements 2.1, 2.3**
 */
export function moveUnit(board, fromRow, fromCol, toRow, toCol, allowSwap = true) {
  // Validate source position
  if (!isValidPosition(fromRow, fromCol)) {
    return { success: false, error: 'Invalid source position' };
  }

  // Validate destination position
  if (!isValidPosition(toRow, toCol)) {
    return { success: false, error: 'Invalid destination position' };
  }

  const sourceUnit = board[fromRow][fromCol];
  if (!sourceUnit) {
    return { success: false, error: 'No unit at source position' };
  }

  const destUnit = board[toRow][toCol];

  if (destUnit && !allowSwap) {
    return { success: false, error: 'Destination occupied and swap not allowed' };
  }

  // Perform move or swap
  board[toRow][toCol] = { ...sourceUnit, row: toRow, col: toCol };
  board[fromRow][fromCol] = destUnit ? { ...destUnit, row: fromRow, col: fromCol } : null;

  return { success: true, swapped: destUnit !== null };
}

/**
 * Calculates active synergies based on deployed units
 * 
 * @param {Array<Object>} units - Array of deployed units
 * @returns {Object} Synergy result with class and tribe counts and active bonuses
 * 
 * **Validates: Requirement 2.7**
 */
export function calculateSynergies(units) {
  const classCounts = {};
  const tribeCounts = {};

  // Normalize synergy key to handle undefined/null values
  const normalizeSynergyKey = (value) => {
    const key = typeof value === "string" ? value.trim() : value;
    if (!key || key === "undefined" || key === "null") return null;
    return key;
  };

  // Count units by class and tribe
  units.forEach((unit) => {
    const classType = normalizeSynergyKey(unit?.classType ?? unit?.base?.classType);
    const tribe = normalizeSynergyKey(unit?.tribe ?? unit?.base?.tribe);

    if (classType) {
      classCounts[classType] = (classCounts[classType] ?? 0) + 1;
    }
    if (tribe) {
      tribeCounts[tribe] = (tribeCounts[tribe] ?? 0) + 1;
    }
  });

  // Calculate active synergies
  const activeSynergies = [];

  // Check class synergies
  Object.entries(classCounts).forEach(([classType, count]) => {
    const def = CLASS_SYNERGY[classType];
    if (!def) return;

    // Find highest active tier
    let activeTier = -1;
    for (let i = 0; i < def.thresholds.length; i++) {
      if (count >= def.thresholds[i]) {
        activeTier = i;
      }
    }

    if (activeTier >= 0) {
      activeSynergies.push({
        type: 'class',
        key: classType,
        count,
        tier: activeTier,
        threshold: def.thresholds[activeTier],
        bonuses: def.bonuses[activeTier]
      });
    }
  });

  // Check tribe synergies
  Object.entries(tribeCounts).forEach(([tribe, count]) => {
    const def = TRIBE_SYNERGY[tribe];
    if (!def) return;

    // Find highest active tier
    let activeTier = -1;
    for (let i = 0; i < def.thresholds.length; i++) {
      if (count >= def.thresholds[i]) {
        activeTier = i;
      }
    }

    if (activeTier >= 0) {
      activeSynergies.push({
        type: 'tribe',
        key: tribe,
        count,
        tier: activeTier,
        threshold: def.thresholds[activeTier],
        bonuses: def.bonuses[activeTier]
      });
    }
  });

  return {
    classCounts,
    tribeCounts,
    activeSynergies
  };
}

/**
 * Creates an empty board (5x5 matrix of nulls)
 * 
 * @returns {Array<Array<null>>} Empty 5x5 board
 */
export function createEmptyBoard() {
  return Array.from({ length: BOARD_ROWS }, () => 
    Array.from({ length: PLAYER_COLS }, () => null)
  );
}

/**
 * Checks if a duplicate unit (same baseId) exists on the board
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix
 * @param {string} baseId - Base ID to check for
 * @param {number} ignoreRow - Row to ignore in check (default -1)
 * @param {number} ignoreCol - Column to ignore in check (default -1)
 * @returns {boolean} True if duplicate exists, false otherwise
 */
export function checkDuplicateUnit(board, baseId, ignoreRow = -1, ignoreCol = -1) {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < PLAYER_COLS; col++) {
      if (row === ignoreRow && col === ignoreCol) continue;
      const unit = board[row][col];
      if (unit && unit.baseId === baseId) return true;
    }
  }
  return false;
}

/**
 * Validates board position for player side (0-4 columns)
 * 
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean} True if valid player board position
 */
export function isValidPlayerBoardPosition(row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_ROWS &&
    col >= 0 &&
    col < PLAYER_COLS
  );
}

/**
 * Validates bench index
 * 
 * @param {number} index - Bench index
 * @param {number} benchCap - Maximum bench capacity
 * @returns {boolean} True if valid bench index
 */
export function isValidBenchIndex(index, benchCap) {
  return Number.isInteger(index) && index >= 0 && index < benchCap;
}

/**
 * Places a unit from bench to board
 * Handles deploy limit checking and duplicate unit validation
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {Array<Object>} bench - Bench array (will be modified)
 * @param {number} benchIndex - Index in bench
 * @param {number} row - Destination row
 * @param {number} col - Destination column
 * @param {number} deployLimit - Maximum deploy count
 * @param {boolean} allowSwap - Whether to allow swapping with existing unit
 * @returns {Object} Result with success flag, error message, and swap status
 */
export function placeBenchUnitOnBoard(board, bench, benchIndex, row, col, deployLimit, allowSwap = true) {
  if (benchIndex >= bench.length) {
    return { success: false, error: 'Invalid bench index' };
  }

  if (!isValidPlayerBoardPosition(row, col)) {
    return { success: false, error: 'Invalid board position' };
  }

  const moving = bench[benchIndex];
  if (!moving) {
    return { success: false, error: 'No unit at bench index' };
  }

  // Check for duplicate unit on board
  if (checkDuplicateUnit(board, moving.baseId, row, col)) {
    return { success: false, error: 'Duplicate unit on board' };
  }

  const target = board[row][col];

  // Check deploy limit if not swapping
  if (!target && getDeployCount(board) >= deployLimit) {
    return { success: false, error: 'Deploy limit reached' };
  }

  if (target && !allowSwap) {
    return { success: false, error: 'Position occupied and swap not allowed' };
  }

  // Place unit on board
  board[row][col] = moving;

  // Handle bench
  if (target) {
    bench[benchIndex] = target;
  } else {
    bench.splice(benchIndex, 1);
  }

  return { success: true, swapped: !!target };
}

/**
 * Moves a unit from board to bench
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {Array<Object>} bench - Bench array (will be modified)
 * @param {number} row - Source row
 * @param {number} col - Source column
 * @param {number} benchIndex - Destination bench index
 * @param {number} benchCap - Maximum bench capacity
 * @param {boolean} allowSwap - Whether to allow swapping
 * @returns {Object} Result with success flag, error message, and swap status
 */
export function moveBoardUnitToBench(board, bench, row, col, benchIndex, benchCap, allowSwap = true) {
  if (!isValidPlayerBoardPosition(row, col)) {
    return { success: false, error: 'Invalid board position' };
  }

  if (!isValidBenchIndex(benchIndex, benchCap)) {
    return { success: false, error: 'Invalid bench index' };
  }

  const moving = board[row][col];
  if (!moving) {
    return { success: false, error: 'No unit at board position' };
  }

  const target = bench[benchIndex] ?? null;

  if (target && !allowSwap) {
    return { success: false, error: 'Bench position occupied and swap not allowed' };
  }

  if (!target && bench.length >= benchCap) {
    return { success: false, error: 'Bench is full' };
  }

  // Move unit to bench
  if (target) {
    board[row][col] = target;
    bench[benchIndex] = moving;
  } else {
    board[row][col] = null;
    if (benchIndex >= bench.length) {
      bench.push(moving);
    } else if (bench[benchIndex] == null) {
      bench[benchIndex] = moving;
    } else {
      bench.splice(benchIndex, 0, moving);
    }
  }

  return { success: true, swapped: !!target };
}

/**
 * Moves a unit within the bench
 * 
 * @param {Array<Object>} bench - Bench array (will be modified)
 * @param {number} fromIndex - Source bench index
 * @param {number} toIndex - Destination bench index
 * @param {boolean} allowSwap - Whether to allow swapping
 * @returns {Object} Result with success flag, error message, and swap status
 */
export function moveBenchUnit(bench, fromIndex, toIndex, allowSwap = true) {
  if (fromIndex >= bench.length) {
    return { success: false, error: 'Invalid source bench index' };
  }

  if (fromIndex === toIndex) {
    return { success: false, error: 'Source and destination are the same' };
  }

  const moving = bench[fromIndex];
  if (!moving) {
    return { success: false, error: 'No unit at source bench index' };
  }

  const target = bench[toIndex] ?? null;

  if (target) {
    if (!allowSwap) {
      return { success: false, error: 'Destination occupied and swap not allowed' };
    }
    bench[toIndex] = moving;
    bench[fromIndex] = target;
  } else {
    bench.splice(fromIndex, 1);
    const insertIndex = Math.max(0, Math.min(toIndex, bench.length));
    bench.splice(insertIndex, 0, moving);
  }

  return { success: true, swapped: !!target };
}

/**
 * Removes units from board and bench by their references
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {Array<Object>} bench - Bench array (will be modified)
 * @param {Array<Object>} refs - Array of unit references with location info
 * @returns {Object} Result with success flag and count of removed units
 */
export function removeOwnedUnitRefs(board, bench, refs) {
  if (!Array.isArray(refs) || !refs.length) {
    return { success: false, error: 'No references provided' };
  }

  const benchUidSet = new Set();
  const benchIndexFallback = [];
  let removedCount = 0;

  refs.forEach((ref) => {
    if (!ref) return;
    
    if (ref.location === "BOARD") {
      if (isValidPlayerBoardPosition(ref.row, ref.col)) {
        board[ref.row][ref.col] = null;
        removedCount++;
      }
      return;
    }
    
    const uid = ref.unit?.uid;
    if (uid) {
      benchUidSet.add(uid);
    } else if (Number.isInteger(ref.index)) {
      benchIndexFallback.push(ref.index);
    }
  });

  // Remove from bench by uid
  if (benchUidSet.size) {
    const beforeLength = bench.length;
    bench.splice(0, bench.length, ...bench.filter((unit) => !benchUidSet.has(unit?.uid)));
    removedCount += beforeLength - bench.length;
  }

  // Fallback: remove by index (for legacy units without uid)
  benchIndexFallback
    .sort((a, b) => b - a)
    .forEach((index) => {
      if (index >= 0 && index < bench.length) {
        bench.splice(index, 1);
        removedCount++;
      }
    });

  return { success: true, removedCount };
}

/**
 * BoardSystem - Main export object with all board operations
 */
export const BoardSystem = {
  // Position validation
  isValidPosition,
  isValidPlayerBoardPosition,
  isValidBenchIndex,
  isPositionEmpty,
  
  // Board queries
  getUnitAt,
  getDeployCount,
  getDeployedUnits,
  canDeploy,
  
  // Board creation
  createEmptyBoard,
  
  // Unit validation
  checkDuplicateUnit,
  
  // Basic board operations
  placeUnit,
  removeUnit,
  moveUnit,
  
  // Complex board operations (board + bench)
  placeBenchUnitOnBoard,
  moveBoardUnitToBench,
  moveBenchUnit,
  removeOwnedUnitRefs,
  
  // Synergy calculation
  calculateSynergies
};

export default BoardSystem;
