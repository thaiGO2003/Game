# Task 3.3.2: Extract Synergy Logic - Summary

## Objective
Extract synergy calculation and application logic from PlanningScene and CombatScene into the SynergySystem, centralizing all synergy-related business logic.

## What Was Extracted

### From PlanningScene and CombatScene

The following methods were identified as duplicated across both scenes:

1. **`computeSynergyCounts(units, side)`** - Counts units by class and tribe, applies extra counts for player bonuses
2. **`applySynergyBonuses(side)`** - Applies synergy bonuses to all units on a team
3. **`getSynergyBonus(def, count)`** - Gets the highest tier bonus for a given count
4. **`getSynergyTier(count, thresholds)`** - Gets the tier index for a given count
5. **`applyBonusToUnit(unit, bonus)`** - Applies a bonus object to a unit's stats

### Differences Between Scenes

**PlanningScene version:**
- `computeSynergyCounts` includes `normalizeSynergyKey` helper to handle undefined/null values
- More defensive against malformed data

**CombatScene version:**
- `computeSynergyCounts` assumes cleaner data (no normalization)
- Otherwise identical logic

## Implementation in SynergySystem

### Enhanced Functions

1. **`calculateSynergies(units, side, options)`** - Already existed, matches `computeSynergyCounts` functionality
   - Includes normalization logic from PlanningScene
   - Supports `extraClassCount` and `extraTribeCount` via options parameter
   - Returns `{ classCounts, tribeCounts }`

2. **`getSynergyBonus(synergyDef, count)`** - Already existed, matches scene versions exactly

3. **`getSynergyTier(count, thresholds)`** - Already existed, matches scene versions exactly

### New Functions Added

4. **`applyBonusToCombatUnit(unit, bonus)`** - NEW
   - Applies bonus directly to combat unit stats (hp, atk, def, etc.)
   - Handles percentage-based bonuses (hpPct, atkPct, matkPct)
   - Applies flat stat bonuses (defFlat, mdefFlat)
   - Applies mod-based bonuses (healPct, lifestealPct, evadePct, etc.)
   - This is the version used in both scenes' `applyBonusToUnit` methods

5. **`applySynergyBonusesToTeam(units, side, options)`** - NEW
   - Applies synergy bonuses to all units on a team
   - Calculates synergies using `calculateSynergies`
   - Applies class and tribe bonuses to each unit
   - Applies starting rage and shield from mods
   - Matches the logic from both scenes' `applySynergyBonuses` methods

### Existing Functions (Unchanged)

- `applySynergiesToUnit(unit, synergyCounts)` - Applies bonuses to a single unit (uses mods)
- `getSynergyDescription(synergyId, level, type)` - Formats synergy description for UI
- `getSynergyIcon(synergyId, type)` - Gets icon/emoji for synergy
- `getActiveSynergies(units, side, options)` - Gets all active synergies with details

## Key Design Decisions

### Two Bonus Application Methods

The system now has two methods for applying bonuses:

1. **`applySynergiesToUnit(unit, synergyCounts)`** - Uses internal `applyBonusToUnit` helper
   - Applies bonuses to `unit.mods` object
   - Used for planning/preview scenarios
   - Does not modify actual stats

2. **`applyBonusToCombatUnit(unit, bonus)`** - Exported function
   - Applies bonuses directly to unit stats (hp, atk, def, etc.)
   - Used during combat initialization
   - Modifies actual combat stats

This separation allows for:
- Preview synergies without modifying units (planning phase)
- Apply synergies to combat units with stat modifications (combat phase)

### Centralized Logic

All synergy-related logic is now in one place:
- **Counting**: `calculateSynergies()`
- **Threshold checking**: `getSynergyTier()`, `getSynergyBonus()`
- **Application**: `applySynergyBonusesToTeam()`, `applyBonusToCombatUnit()`
- **Display**: `getSynergyDescription()`, `getSynergyIcon()`, `getActiveSynergies()`

### No Phaser Dependencies

The SynergySystem remains completely independent of Phaser:
- Only imports from data layer (`synergies.js`, `unitVisuals.js`)
- Pure functions with no side effects (except unit modification)
- Can be tested independently

## Validation

The extracted functions validate the following requirements:

- **Requirement 1.1**: System extracted to separate file
- **Requirement 1.6**: System has clearly defined interface
- **Requirement 6.1**: Calculates synergy counts by type and class
- **Requirement 6.2**: Activates synergies at appropriate thresholds
- **Requirement 6.3**: Applies synergy bonuses to units
- **Requirement 6.4**: Provides synergy descriptions for display
- **Requirement 6.5**: Provides synergy icons for UI
- **Requirement 6.6**: Applies multiple synergies cumulatively
- **Requirement 6.7**: Recalculates synergies when team changes
- **Requirement 13.4**: JSDoc comments for all public functions

## Next Steps

Task 3.3.3 will:
1. Update PlanningScene to use SynergySystem methods
2. Update CombatScene to use SynergySystem methods
3. Remove duplicated synergy logic from both scenes
4. Verify all tests still pass

## Files Modified

- `game/src/systems/SynergySystem.js` - Enhanced with extracted logic

## Files to be Modified (Task 3.3.3)

- `game/src/scenes/PlanningScene.js` - Replace synergy methods with SynergySystem calls
- `game/src/scenes/CombatScene.js` - Replace synergy methods with SynergySystem calls

## Summary

Successfully extracted all synergy-related business logic from PlanningScene and CombatScene into the SynergySystem. The system now provides:

1. **Centralized synergy counting** with support for extra counts (augments)
2. **Centralized threshold checking** for synergy activation
3. **Centralized bonus application** for both preview and combat scenarios
4. **UI helper functions** for displaying synergy information

The extraction maintains backward compatibility - the new functions match the behavior of the scene methods exactly, ensuring that task 3.3.3 can safely replace the scene methods with system calls.
