# Task 5.2.3: Remove Synergy Logic from CombatScene - Summary

## Task Overview
Removed synergy application logic from CombatScene and delegated all synergy operations to SynergySystem, keeping only visual effects and UI rendering in the scene.

## Changes Made

### 1. Removed Wrapper Functions
Deleted the following wrapper functions that were delegating to SynergySystem:
- `computeSynergyCounts(units, side)` - Removed, callers now use `SynergySystem.calculateSynergies()` directly
- `applySynergyBonuses(side)` - Removed, logic moved inline to `beginCombat()`
- `getSynergyBonus(def, count)` - Removed, was unused
- `applyBonusToUnit(unit, bonus)` - Removed, callers now use `SynergySystem.applyBonusToCombatUnit()` directly
- `getSynergyTier(count, thresholds)` - Removed, callers now use `SynergySystem.getSynergyTier()` directly

### 2. Updated Call Sites

#### In `beginCombat()` (lines ~1968-1980)
**Before:**
```javascript
// Apply synergy bonuses
this.applySynergyBonuses("LEFT");
this.applySynergyBonuses("RIGHT");
```

**After:**
```javascript
// Apply synergy bonuses using SynergySystem
const leftTeam = this.getCombatUnits("LEFT");
const rightTeam = this.getCombatUnits("RIGHT");

const leftOptions = {
  extraClassCount: this.player.extraClassCount || 0,
  extraTribeCount: this.player.extraTribeCount || 0
};
SynergySystem.applySynergyBonusesToTeam(leftTeam, "LEFT", leftOptions);
leftTeam.forEach((unit) => this.updateCombatUnitUi(unit));

SynergySystem.applySynergyBonusesToTeam(rightTeam, "RIGHT", {});
rightTeam.forEach((unit) => this.updateCombatUnitUi(unit));
```

#### In `refreshSynergyPreview()` (line ~2766)
**Before:**
```javascript
const summary = this.computeSynergyCounts(deployed, "LEFT");
```

**After:**
```javascript
const summary = SynergySystem.calculateSynergies(deployed, "LEFT", {
  extraClassCount: this.player.extraClassCount || 0,
  extraTribeCount: this.player.extraTribeCount || 0
});
```

#### In `getSynergyTooltip()` (lines ~2926-2927)
**Before:**
```javascript
const leftSummary = this.computeSynergyCounts(leftTeam, "LEFT");
const rightSummary = this.computeSynergyCounts(rightTeam, "RIGHT");
```

**After:**
```javascript
const leftSummary = SynergySystem.calculateSynergies(leftTeam, "LEFT", {
  extraClassCount: this.player.extraClassCount || 0,
  extraTribeCount: this.player.extraTribeCount || 0
});
const rightSummary = SynergySystem.calculateSynergies(rightTeam, "RIGHT", {});
```

#### In `getSynergyTooltip()` pushSide function (lines ~2937, 2945)
**Before:**
```javascript
const tier = this.getSynergyTier(count, def.thresholds);
```

**After:**
```javascript
const tier = SynergySystem.getSynergyTier(count, def.thresholds);
```

#### In `applyOwnedEquipmentBonuses()` (line ~3378)
**Before:**
```javascript
equipItems.forEach((item) => this.applyBonusToUnit(unit, item.bonus));
```

**After:**
```javascript
equipItems.forEach((item) => SynergySystem.applyBonusToCombatUnit(unit, item.bonus));
```

### 3. Visual Functions Preserved
The following visual/UI functions were kept intact as they handle display only:
- `refreshSynergyPreview()` - Updates synergy display UI
- `getSynergyTooltip()` - Generates tooltip text for synergy display
- `synergyText` and `synergyTitleText` - UI text elements
- `formatBonusSet()` - Formats bonus text for display

## Requirements Validated
- **Requirement 8.1**: Scene delegates business logic to Systems ✓
- **Requirement 8.2**: Scene contains only orchestration code ✓
- **Requirement 8.5**: Scene does NOT contain business logic calculations ✓

## Testing
All tests pass (1643 tests):
- Unit tests for synergy system functionality
- Integration tests for combat flow
- Property-based tests for synergy calculations

## Impact
- **Lines removed**: ~35 lines of wrapper functions
- **Direct SynergySystem calls**: 6 call sites updated
- **Functionality preserved**: All synergy logic works identically
- **Visual effects preserved**: All synergy UI and tooltips work correctly

## Verification
✓ No syntax errors in CombatScene.js
✓ All 1643 tests pass
✓ No references to removed wrapper functions remain
✓ Visual synergy functions still present and functional
✓ SynergySystem is now the single source of truth for synergy logic
