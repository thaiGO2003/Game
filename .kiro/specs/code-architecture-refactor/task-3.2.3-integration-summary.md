# Task 3.2.3: Update PlanningScene to use UpgradeSystem - Summary

## Completion Status
✅ **COMPLETED** - PlanningScene successfully updated to use UpgradeSystem

## Changes Made

### 1. Added UpgradeSystem Import
- Added import statement for UpgradeSystem in PlanningScene
- Location: `game/src/scenes/PlanningScene.js` line 8

### 2. Replaced tryAutoMerge Implementation
The old tryAutoMerge method in PlanningScene has been completely replaced with a new implementation that:
- Calls `UpgradeSystem.tryAutoMerge()` with required parameters:
  - `this.player.board` - The 5x5 board matrix
  - `this.player.bench` - The bench array
  - `ITEM_BY_ID` - Item catalog for equipment validation
  - `UNIT_BY_ID` - Unit catalog for tier sorting
  - `this.createOwnedUnit.bind(this)` - Function to create new owned units
- Processes merge results from UpgradeSystem
- Logs merge operations with unit names
- Handles overflow equipment by adding items to player's item bag

### 3. Removed Redundant Helper Methods
The following helper methods were removed from PlanningScene as they are now in UpgradeSystem:
- `getMergeSpeciesKey(unit)` - Now in UpgradeSystem
- `getMergeSpeciesLabel(unit)` - Now in UpgradeSystem
- `collectMergeEquips(refs)` - Now in UpgradeSystem
- `collectOwnedUnitRefs()` - Now in UpgradeSystem
- `removeOwnedUnitRefs(refs)` - Now in BoardSystem (already removed in previous task)
- `placeMergedUnit(unit, preferredRef)` - Now in UpgradeSystem

### 4. Enhanced UpgradeSystem Return Value
Fixed a bug in UpgradeSystem where overflow equipment items were not being returned:
- Modified `tryAutoMerge()` to include `overflowItems` array in merge log entries
- This allows PlanningScene to properly return overflow equipment to player's item bag

## Implementation Details

### New tryAutoMerge in PlanningScene
```javascript
tryAutoMerge() {
  // Use UpgradeSystem for auto-merge logic
  const result = UpgradeSystem.tryAutoMerge(
    this.player.board,
    this.player.bench,
    ITEM_BY_ID,
    UNIT_BY_ID,
    this.createOwnedUnit.bind(this)
  );

  // Handle merge results
  if (result.mergeCount > 0) {
    // Process each merge log entry
    result.log.forEach((entry) => {
      // Get unit label for logging
      const unit = UNIT_BY_ID[entry.baseId];
      const label = unit?.name || entry.baseId;
      
      // Log the merge
      this.addLog(`Nâng sao: ${label} -> ${entry.toStar}★`);
      
      // Handle overflow equipment by returning to item bag
      if (entry.overflowItems && entry.overflowItems.length > 0) {
        this.player.itemBag.push(...entry.overflowItems);
        this.addLog(`Nâng sao hoàn trả ${entry.overflowItems.length} trang bị dư vào túi đồ.`);
      }
    });
  }
}
```

### Upgrade Results Handling
The new implementation properly handles:
1. **Merge Count**: Number of successful merges performed
2. **Merge Log**: Array of merge entries with details:
   - `baseId`: The unit's base ID
   - `fromStar`: Original star level
   - `toStar`: New star level after merge
   - `equipCount`: Number of equipment items kept
   - `equipOverflow`: Number of overflow equipment items
   - `overflowItems`: Array of actual overflow item IDs (NEW)
3. **UI Updates**: Logs are added for each merge operation
4. **Overflow Equipment**: Items are properly returned to player's item bag

## Requirements Validated

### Requirement 8.1: Scene delegates business logic to Systems
✅ PlanningScene now delegates all upgrade logic to UpgradeSystem

### Requirement 8.6: Scene handles success and error results appropriately
✅ PlanningScene processes merge results and handles overflow equipment

### Requirement 8.5: Scene does not contain business logic calculations
✅ All upgrade calculation logic removed from PlanningScene

### Requirement 5.3: Equipment transfer from source units to upgraded unit
✅ Handled by UpgradeSystem, overflow properly returned to item bag

## Testing

### Tests Passed
- ✅ All 31 unit upgrade/merge tests pass
- ✅ All 35 board operations tests pass
- ✅ No diagnostics or errors in PlanningScene or UpgradeSystem

### Test Coverage
- Merge detection with 3 matching units
- Auto-merge execution (star 1→2, star 2→3)
- Equipment transfer and deduplication
- Merge from bench and board
- Complex merge scenarios (cascading, partial)
- Edge cases (empty board, multiple units)
- Overflow equipment handling

## Code Quality

### Lines Removed
- Approximately 120 lines of business logic removed from PlanningScene
- 6 helper methods removed (now in systems)

### Lines Added
- 1 import statement
- 25 lines for new tryAutoMerge implementation
- 1 line in UpgradeSystem to return overflow items

### Net Result
- PlanningScene is now ~95 lines shorter
- Scene is cleaner and focused on orchestration
- Business logic properly encapsulated in UpgradeSystem

## Benefits

1. **Separation of Concerns**: Upgrade logic is now in UpgradeSystem, not in Scene
2. **Reusability**: UpgradeSystem can be used by other scenes or game modes
3. **Testability**: Upgrade logic can be tested independently without Phaser
4. **Maintainability**: Changes to upgrade logic only need to be made in one place
5. **Clarity**: PlanningScene is now focused on UI orchestration, not business logic

## Next Steps

The next task (3.2.4) will:
1. Write unit tests for UpgradeSystem
2. Write property-based tests for upgrade operations
3. Verify all requirements are met

## Files Modified

- ✅ `game/src/scenes/PlanningScene.js` - Updated to use UpgradeSystem
- ✅ `game/src/systems/UpgradeSystem.js` - Enhanced to return overflow items

## Verification

- ✅ All existing tests pass
- ✅ No diagnostics or errors
- ✅ Code follows refactoring requirements
- ✅ Backward compatibility maintained
- ✅ Functionality preserved
