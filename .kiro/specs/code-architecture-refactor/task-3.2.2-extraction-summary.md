# Task 3.2.2: Extract Upgrade Logic from PlanningScene - Summary

## Completion Status
✅ **COMPLETED** - Upgrade logic successfully extracted from PlanningScene to UpgradeSystem

## What Was Extracted

### Core Functions Added to UpgradeSystem

1. **`getEquipmentNameKey(itemId, itemCatalog)`**
   - Extracts equipment name key for deduplication
   - Ensures units cannot have duplicate equipment with same name
   - Returns normalized equipment name or ID

2. **`getMergeSpeciesKey(unit)`**
   - Generates normalized species key for grouping units
   - Uses species/name from unit base, normalized to lowercase with diacritics removed
   - Groups units by species for merging (e.g., "tiger", "elephant")

3. **`getMergeSpeciesLabel(unit)`**
   - Gets display label for merge species
   - Removes trailing numbers from unit names
   - Used for logging merge operations

4. **`collectMergeEquips(refs, itemCatalog)`**
   - Collects equipment from 3 source units during merge
   - Deduplicates by equipment name (no duplicate names allowed)
   - Returns `{ kept: [], overflow: [] }` with max 3 kept items
   - Overflow items are returned to player's item bag

5. **`tryAutoMerge(board, bench, itemCatalog, unitCatalog, createUnitFn)`**
   - Main auto-merge function that processes all eligible upgrades
   - Uses species-based grouping (not baseId-based)
   - Iteratively merges until no more merges possible
   - Picks highest tier baseId from group when merging
   - Returns merge count and detailed log

## Key Implementation Details

### Species-Based Merging
The system uses **species-based grouping** rather than baseId-based grouping. This means:
- Units with same species (e.g., "tiger") but different baseIds can merge together
- The highest tier baseId from the group is selected for the merged unit
- This matches the original PlanningScene behavior

### Equipment Deduplication
Equipment handling includes name-based deduplication:
- Equipment with same name cannot be on the same unit
- During merge, duplicate equipment names go to overflow
- Max 3 unique equipment items kept on merged unit
- Overflow items returned to player's item bag

### Merge Algorithm
The merge algorithm follows PlanningScene's approach:
1. Collect all unit references from board and bench
2. Group by `species:star` key (e.g., "tiger:1", "elephant:2")
3. For each group with 3+ units:
   - Take first 3 units
   - Check star level < 3
   - Pick highest tier baseId
   - Collect and deduplicate equipment
   - Remove source units
   - Create upgraded unit with star+1
   - Place merged unit (prefer board position)
4. Repeat until no more merges possible

## Dependencies

The UpgradeSystem now requires these external dependencies:
- **itemCatalog** (ITEM_BY_ID) - For equipment validation and name lookup
- **unitCatalog** (UNIT_BY_ID) - For tier sorting when selecting baseId
- **createUnitFn** - Function to create new owned units with proper structure

## Validation

### Requirements Validated
- ✅ **1.2**: System has no Phaser dependencies
- ✅ **1.3**: System only depends on Core and Data layers (via parameters)
- ✅ **1.4**: Uses pure functions where possible
- ✅ **5.1**: Detects upgrade opportunities (3 units, same species, same star)
- ✅ **5.2**: Combines 3 units into 1 with star+1
- ✅ **5.3**: Transfers equipment from source units to upgraded unit
- ✅ **5.4**: Removes 3 source units from bench/board
- ✅ **5.5**: Does not upgrade beyond star level 3
- ✅ **5.6**: Checks both bench and board units
- ✅ **5.7**: Returns list of upgrade candidates

## Next Steps

The next task (3.2.3) will:
1. Update PlanningScene to use UpgradeSystem.tryAutoMerge
2. Remove the old tryAutoMerge implementation from PlanningScene
3. Pass required dependencies (ITEM_BY_ID, UNIT_BY_ID, createOwnedUnit)
4. Handle merge results and overflow equipment
5. Update UI after merges

## Files Modified

- ✅ `game/src/systems/UpgradeSystem.js` - Added extracted upgrade logic

## Files To Be Modified (Next Task)

- ⏳ `game/src/scenes/PlanningScene.js` - Will be updated to use UpgradeSystem
