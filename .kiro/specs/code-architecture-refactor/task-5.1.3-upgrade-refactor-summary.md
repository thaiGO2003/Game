# Task 5.1.3: Remove Upgrade Logic from PlanningScene - Summary

## Task Overview
Refactored PlanningScene to remove duplicate upgrade logic and fully delegate to UpgradeSystem, keeping only UI updates and animations in the scene.

**Requirements Validated:** 8.1, 8.2, 8.5

## Changes Made

### 1. Removed Duplicate Equipment Helper Method

**File:** `game/src/scenes/PlanningScene.js`

**Before:**
```javascript
getEquipmentNameKey(itemId) {
  const item = ITEM_BY_ID[itemId];
  if (!item || item.kind !== "equipment") return null;
  const byName = String(item.name ?? "").trim().toLowerCase();
  if (byName) return byName;
  return String(item.id ?? itemId).trim().toLowerCase();
}
```

**After:**
```javascript
getEquipmentNameKey(itemId) {
  // Delegate to UpgradeSystem for equipment name key logic
  return UpgradeSystem.getEquipmentNameKey(itemId, ITEM_BY_ID);
}
```

**Rationale:** This method duplicated the exact logic in `UpgradeSystem.getEquipmentNameKey()`. By delegating to the system, we:
- Eliminate code duplication
- Ensure consistent equipment name handling across the codebase
- Follow the architecture principle of delegating business logic to systems

## Analysis of Existing Implementation

### Already Properly Delegated to UpgradeSystem

The PlanningScene was already properly using UpgradeSystem for core upgrade operations:

1. **Auto-upgrade detection**: ✓ Uses `UpgradeSystem.tryAutoMerge()`
2. **Unit combination logic**: ✓ Handled by `UpgradeSystem.tryAutoMerge()`
3. **Equipment transfer logic**: ✓ Handled by `UpgradeSystem.collectMergeEquips()`

### Scene-Appropriate Methods Kept

The following methods remain in PlanningScene as they are UI/orchestration concerns:

1. **`tryAutoMerge()`**: Thin wrapper that:
   - Calls `UpgradeSystem.tryAutoMerge()` for business logic
   - Handles UI logging (`addLog()`)
   - Manages overflow equipment (returns to item bag)
   - This is appropriate scene orchestration code

2. **`normalizeEquipIds()`**: Used for manual equipment management
   - Deduplicates equipment when manually equipping units
   - Not part of the upgrade/merge system
   - Appropriate to keep in scene for UI operations

3. **`tryEquipSelectedItem()`**: Manual equipment management
   - Handles user interaction for equipping items
   - Validates equipment constraints
   - Updates UI and logs messages
   - This is UI orchestration, not upgrade logic

4. **`isEquipmentItem()`**: Simple helper for UI logic
   - Used to determine if an item can be equipped
   - Appropriate scene helper

## Verification

### Tests Passed
- ✓ All 82 UpgradeSystem unit tests passed
- ✓ All 31 unitUpgradeMerge integration tests passed
- ✓ All 35 boardOperations tests passed

### Code Quality
- Eliminated duplicate code
- Maintained clear separation of concerns
- Scene now properly delegates equipment name logic to UpgradeSystem
- All upgrade business logic remains in UpgradeSystem

## Architecture Compliance

### Requirements Met

**Requirement 8.1**: Scene delegates business logic to Systems
- ✓ Auto-merge logic delegated to UpgradeSystem
- ✓ Equipment name key logic delegated to UpgradeSystem

**Requirement 8.2**: Scene contains only orchestration code
- ✓ `tryAutoMerge()` is thin orchestration wrapper
- ✓ Manual equipment methods handle UI interactions only

**Requirement 8.5**: Scene does NOT contain business logic calculations
- ✓ No upgrade detection logic in scene
- ✓ No unit combination logic in scene
- ✓ No equipment transfer logic in scene
- ✓ Equipment name key calculation delegated to system

## Summary

The PlanningScene was already well-refactored for upgrade operations. The main improvement was removing the duplicate `getEquipmentNameKey()` implementation and delegating to UpgradeSystem. 

The scene now:
- ✓ Uses UpgradeSystem for all upgrade business logic
- ✓ Keeps only UI updates and animations
- ✓ Properly orchestrates upgrade operations
- ✓ Has no duplicate business logic

All tests pass and the architecture is clean and maintainable.
