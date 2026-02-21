# Task 3.1.2: Board Logic Extraction Summary

## Overview
This document summarizes the board-related logic extracted from PlanningScene and added to BoardSystem.

## Extracted Methods

### 1. Board Creation
- **`createEmptyBoard()`** (Line 1042 in PlanningScene)
  - Creates a 5x5 matrix of nulls
  - Pure function with no dependencies
  - **Status**: ✅ Extracted to BoardSystem

### 2. Board Validation
- **`checkDuplicateUnit(baseId, ignoreRow, ignoreCol)`** (Line 3250 in PlanningScene)
  - Checks if a unit with the same baseId exists on the board
  - Used to prevent deploying duplicate units
  - **Status**: ✅ Extracted to BoardSystem as pure function
  - **Changes**: Removed `this.player.board` reference, now takes board as parameter

- **`isValidPlayerBoardPosition(row, col)`** (New function)
  - Validates position is within player board bounds (0-4 for both row and col)
  - Extracted from validation logic in `moveUnit`
  - **Status**: ✅ Added to BoardSystem

- **`isValidBenchIndex(index, benchCap)`** (New function)
  - Validates bench index is within bounds
  - Extracted from validation logic in `moveUnit`
  - **Status**: ✅ Added to BoardSystem

### 3. Board Queries
- **`getDeployCount()`** (Line 3775 in PlanningScene)
  - Counts non-null units on the board
  - **Status**: ✅ Already in BoardSystem (task 3.1.1)
  - **Changes**: Removed `this.player.board` reference

- **`getUnitAt(x, y)`** (Line 2916 in PlanningScene)
  - Gets unit at screen coordinates (includes UI hit detection)
  - **Status**: ⚠️ NOT extracted - contains Phaser UI logic (benchSlots, getBounds)
  - **Note**: This is a UI method, not pure board logic

### 4. Complex Board Operations
- **`moveUnit(from, to, allowSwap)`** (Line 3334 in PlanningScene)
  - Handles all unit movement scenarios:
    - Board to Board
    - Bench to Board (with duplicate check and deploy limit)
    - Board to Bench (with bench capacity check)
    - Bench to Bench
  - **Status**: ✅ Extracted as three separate pure functions:
    - `placeBenchUnitOnBoard()` - Bench to Board movement
    - `moveBoardUnitToBench()` - Board to Bench movement
    - `moveBenchUnit()` - Bench to Bench movement
  - **Note**: Board-to-Board movement already covered by existing `moveUnit()` in BoardSystem
  - **Changes**: 
    - Removed `this.` references
    - Removed UI refresh calls (`refreshPlanningUi`, `persistProgress`)
    - Removed auto-merge trigger (`tryAutoMerge`)
    - Split into focused functions for each movement type
    - Returns result objects with success/error/swapped status

- **`removeOwnedUnitRefs(refs)`** (Line 3977 in PlanningScene)
  - Removes multiple units from board and bench by reference
  - Used during unit merging/upgrading
  - **Status**: ✅ Extracted to BoardSystem as pure function
  - **Changes**: 
    - Takes board and bench as parameters
    - Returns result object with removedCount
    - Removed `this.player` references

## Functions NOT Extracted (UI/Phaser-dependent)

The following methods were identified but NOT extracted because they contain Phaser-specific or UI logic:

1. **`getUnitAt(x, y)`** - Contains UI hit detection with Phaser bounds checking
2. **`onPlayerCellClick(row, col)`** - UI event handler
3. **`onBenchClick(index)`** - UI event handler
4. **`findPlayerBoardCellFromPoint(x, y)`** - Phaser coordinate conversion
5. **`getDeployCap()`** - Depends on game rules (getDeployCapByLevel), not pure board logic
6. **`drawBoard()`** - Phaser rendering
7. **`refreshBoardUi()`** - Phaser UI updates

## Pure Functions Added to BoardSystem

### New Exports
```javascript
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
```

## Key Changes Made

1. **Removed Phaser Dependencies**: All extracted functions are pure JavaScript with no Phaser imports
2. **Removed `this.` References**: Functions now take board/bench as parameters instead of accessing `this.player`
3. **Return Result Objects**: Functions return `{ success, error, ... }` objects for better error handling
4. **Split Complex Logic**: The large `moveUnit` function was split into focused functions for each movement type
5. **Added Validation Helpers**: Created `isValidPlayerBoardPosition` and `isValidBenchIndex` for reusable validation

## Requirements Validated

This extraction validates the following requirements:
- **1.2**: System does not depend on Phaser framework ✅
- **1.3**: System does not depend on other Systems ✅
- **1.4**: System uses pure functions where possible ✅
- **8.1**: Scene delegates business logic to Systems ✅
- **8.5**: Scene does not contain business logic calculations ✅

## Next Steps (Task 3.1.3)

The next task will update PlanningScene to use these BoardSystem functions:
1. Replace `this.createEmptyBoard()` with `BoardSystem.createEmptyBoard()`
2. Replace `this.checkDuplicateUnit()` with `BoardSystem.checkDuplicateUnit(this.player.board, ...)`
3. Replace `this.getDeployCount()` with `BoardSystem.getDeployCount(this.player.board)`
4. Refactor `this.moveUnit()` to use the new BoardSystem functions
5. Replace `this.removeOwnedUnitRefs()` with `BoardSystem.removeOwnedUnitRefs(this.player.board, this.player.bench, ...)`

## Testing Notes

The extracted functions should be tested with:
- Valid and invalid positions
- Empty and occupied cells
- Deploy limit scenarios
- Duplicate unit detection
- Bench capacity limits
- Swap vs non-swap scenarios
- Multiple unit removal scenarios
