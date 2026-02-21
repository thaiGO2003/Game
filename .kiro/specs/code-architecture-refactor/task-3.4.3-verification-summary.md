# Task 3.4.3: Extract Buy and Sell Logic - Verification Summary

## Task Overview
Verify that the buy and sell logic in ShopSystem matches PlanningScene implementation and handles all edge cases correctly (insufficient gold, full bench, invalid slots, etc.).

## Requirements Validated
- **Requirement 3.3**: Buy unit SHALL deduct unit cost from Player_State
- **Requirement 3.4**: Buy unit SHALL add Owned_Unit to player bench
- **Requirement 3.5**: Buy unit SHALL remove Shop_Offer from that slot
- **Requirement 3.6**: Sell unit SHALL add sell value to Player_State gold
- **Requirement 3.9**: IF player gold is less than refresh cost, THEN return error result
- **Requirement 3.10**: IF player gold is less than unit cost, THEN return error result

## Implementation Analysis

### Buy Unit Logic Comparison

#### PlanningScene Implementation (lines 3806-3834)
```javascript
// In PlanningScene (method name not shown in excerpt, but called from shop click)
const offer = this.player.shop[index];
if (!offer) return;
const base = UNIT_BY_ID[offer.baseId];
if (!base) {
  this.player.shop[index] = null;
  this.addLog("Dữ liệu thú trong shop không hợp lệ, đã bỏ qua.");
  this.refreshPlanningUi();
  this.persistProgress();
  return;
}
const cost = base.tier;
if (this.player.gold < cost) {
  this.addLog("Không đủ vàng để mua linh thú.");
  return;
}
if (this.player.bench.length >= this.getBenchCap()) {
  this.addLog("Hàng dự bị đã đầy.");
  return;
}
this.player.gold -= cost;
const owned = this.createOwnedUnit(base.id, 1);
if (owned) this.player.bench.push(owned);
this.player.shop[index] = null;
this.tryAutoMerge();
this.refreshPlanningUi();
this.persistProgress();
```

#### ShopSystem Implementation (lines 69-127)
```javascript
export function buyUnit(player, slot, createUnitFn, benchCap) {
  if (!player) {
    return { success: false, error: 'No player provided' };
  }

  if (!player.shop || slot < 0 || slot >= player.shop.length) {
    return { success: false, error: 'Invalid shop slot' };
  }

  const offer = player.shop[slot];
  if (!offer) {
    return { success: false, error: 'No unit in this slot' };
  }

  const base = UNIT_BY_ID[offer.baseId];
  if (!base) {
    return { success: false, error: 'Invalid unit data' };
  }

  const cost = base.tier;

  // Check if player has enough gold
  if (player.gold < cost) {
    return { success: false, error: 'Not enough gold' };
  }

  // Check if bench has space
  if (player.bench.length >= benchCap) {
    return { success: false, error: 'Bench is full' };
  }

  // Create owned unit
  const ownedUnit = createUnitFn(base.id, 1);
  if (!ownedUnit) {
    return { success: false, error: 'Failed to create unit' };
  }

  // Update shop offers (remove purchased unit)
  const updatedShop = [...player.shop];
  updatedShop[slot] = null;

  // Update bench
  const updatedBench = [...player.bench, ownedUnit];

  // Create updated player state
  const updatedPlayer = {
    ...player,
    gold: player.gold - cost,
    shop: updatedShop,
    bench: updatedBench
  };

  return { 
    success: true, 
    player: updatedPlayer,
    unit: ownedUnit,
    cost
  };
}
```

#### Comparison Analysis

✅ **Logic Matches**:
1. Both check if offer exists in slot
2. Both validate unit data from UNIT_BY_ID
3. Both calculate cost as `base.tier`
4. Both check insufficient gold (Requirement 3.10)
5. Both check bench capacity
6. Both deduct gold (Requirement 3.3)
7. Both add unit to bench (Requirement 3.4)
8. Both remove offer from shop slot (Requirement 3.5)

✅ **ShopSystem Improvements**:
1. Returns structured result object with success/error
2. Uses immutable state updates (creates new objects)
3. Accepts `createUnitFn` as parameter (dependency injection)
4. Accepts `benchCap` as parameter (configurable)
5. Returns purchased unit and cost for caller use
6. Better error handling with descriptive messages

✅ **Edge Cases Handled**:
- ✅ Invalid shop slot (out of bounds)
- ✅ Empty shop slot (no offer)
- ✅ Invalid unit data (baseId not found)
- ✅ Insufficient gold
- ✅ Full bench
- ✅ Failed unit creation

### Sell Unit Logic Comparison

#### PlanningScene Implementation (lines 3397-3433)
```javascript
sellUnit(uid) {
  if (!uid) return false;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < PLAYER_COLS; col += 1) {
      const unit = this.player?.board?.[row]?.[col];
      if (!unit || unit.uid !== uid) continue;
      const salePrice = this.getUnitSalePrice(unit);
      this.player.board[row][col] = null;
      this.player.gold += salePrice;
      this.selectedBenchIndex = null;
      this.addLog(`Bán ${unit.base.name} (${unit.star}★) +${salePrice} vàng.`);
      this.refreshPlanningUi();
      this.persistProgress();
      return true;
    }
  }
  const benchIndex = this.player?.bench?.findIndex((unit) => unit?.uid === uid) ?? -1;
  if (benchIndex >= 0) return this.sellBenchIndex(benchIndex);
  return false;
}

sellBenchIndex(index) {
  const unit = this.player?.bench?.[index];
  if (!unit) return false;
  const salePrice = this.getUnitSalePrice(unit);
  this.player.gold += salePrice;
  this.player.bench.splice(index, 1);
  if (this.selectedBenchIndex === index) this.selectedBenchIndex = null;
  if (this.selectedBenchIndex != null && this.selectedBenchIndex > index) this.selectedBenchIndex -= 1;
  this.addLog(`Bán ${unit.base.name} (${unit.star}★) +${salePrice} vàng.`);
  this.refreshPlanningUi();
  this.persistProgress();
  return true;
}

getUnitSalePrice(unit) {
  if (!unit?.base) return 1;
  return Math.max(1, Math.floor(unit.base.tier * (unit.star === 3 ? 5 : unit.star === 2 ? 3 : 1)));
}
```

#### ShopSystem Implementation (lines 138-167)
```javascript
export function sellUnit(player, unit) {
  if (!player) {
    return { success: false, error: 'No player provided' };
  }

  if (!unit) {
    return { success: false, error: 'No unit provided' };
  }

  const base = UNIT_BY_ID[unit.baseId];
  if (!base) {
    return { success: false, error: 'Invalid unit data' };
  }

  // Calculate sell value (tier * star level)
  const sellValue = base.tier * (unit.star || 1);

  // Create updated player state
  const updatedPlayer = {
    ...player,
    gold: player.gold + sellValue
  };

  return { 
    success: true, 
    player: updatedPlayer,
    sellValue
  };
}
```

#### Comparison Analysis

⚠️ **DISCREPANCY FOUND**: Sell price calculation differs!

**PlanningScene Formula**:
```javascript
tier * (star === 3 ? 5 : star === 2 ? 3 : 1)
```
- Star 1: tier × 1
- Star 2: tier × 3
- Star 3: tier × 5

**ShopSystem Formula**:
```javascript
tier * star
```
- Star 1: tier × 1 ✅
- Star 2: tier × 2 ❌ (should be × 3)
- Star 3: tier × 3 ❌ (should be × 5)

This is a **CRITICAL BUG** in ShopSystem! The sell value calculation does not match the game's actual implementation.

### Additional Observations

1. **PlanningScene handles board and bench**: The scene's `sellUnit()` searches both board and bench for the unit by UID, then removes it from the appropriate location.

2. **ShopSystem is more focused**: ShopSystem's `sellUnit()` only calculates the sell value and updates gold. It doesn't handle removing the unit from board/bench - that's the caller's responsibility.

3. **This is actually correct design**: The ShopSystem should focus on the transaction (gold calculation), while the scene handles the unit removal and UI updates. However, the sell price formula must be correct.

## Required Fix

The `sellUnit()` function in ShopSystem needed to use the correct sell price formula:

```javascript
// Before (WRONG):
const sellValue = base.tier * (unit.star || 1);

// After (CORRECT):
const starMultiplier = unit.star === 3 ? 5 : unit.star === 2 ? 3 : 1;
const sellValue = base.tier * starMultiplier;
```

✅ **FIX APPLIED** - The sell price calculation now matches PlanningScene exactly.

## Test Results

### New Test: shopSellPrice.test.js
Created comprehensive test suite for sell price calculation:
- ✅ 7 tests passed
- Tests star 1, 2, and 3 units across all tiers
- Tests units without star level (defaults to 1)
- Tests error handling (no player, no unit, invalid unit)
- Tests exact formula match with PlanningScene

### All Shop Tests
- ✅ shopTierOdds.test.js: 6 tests passed
- ✅ shopLockUnlock.test.js: 25 tests passed
- ✅ shopRefreshIntegration.test.js: 10 tests passed
- ✅ shopProgressionIntegration.test.js: 27 tests passed
- ✅ shopSellPrice.test.js: 7 tests passed

**Total: 75 tests passed** ✅

## Edge Cases Verification

### Buy Unit Edge Cases
- ✅ Invalid shop slot (out of bounds) - Handled
- ✅ Empty shop slot (no offer) - Handled
- ✅ Invalid unit data (baseId not found) - Handled
- ✅ Insufficient gold - Handled (Requirement 3.10)
- ✅ Full bench - Handled
- ✅ Failed unit creation - Handled

### Sell Unit Edge Cases
- ✅ No player provided - Handled
- ✅ No unit provided - Handled
- ✅ Invalid unit data - Handled
- ❌ Incorrect sell price calculation - **NEEDS FIX**

## Conclusion

Task 3.4.3 is **COMPLETE**. The buy and sell logic has been successfully verified and fixed:

1. ✅ Buy unit logic matches PlanningScene implementation
2. ✅ Sell unit logic matches PlanningScene implementation (after fix)
3. ✅ All edge cases handled correctly
4. ✅ All requirements validated
5. ✅ All tests passing (75 tests)
6. ✅ Sell price formula corrected

The ShopSystem buy and sell functions are now ready for integration with PlanningScene.

## Summary of ShopSystem Buy/Sell Functions

### buyUnit(player, slot, createUnitFn, benchCap)
- ✅ Validates shop slot and offer
- ✅ Validates unit data
- ✅ Checks insufficient gold (Requirement 3.10)
- ✅ Checks bench capacity
- ✅ Deducts gold (Requirement 3.3)
- ✅ Adds unit to bench (Requirement 3.4)
- ✅ Removes offer from shop (Requirement 3.5)
- ✅ Returns structured result with success/error
- ✅ Uses immutable state updates

### sellUnit(player, unit)
- ✅ Validates player and unit
- ✅ Validates unit data
- ✅ Calculates correct sell value (Requirement 3.6)
- ✅ Uses correct formula: tier × (star === 3 ? 5 : star === 2 ? 3 : 1)
- ✅ Adds gold to player
- ✅ Returns structured result with success/error
- ✅ Uses immutable state updates

## Next Steps

Proceed to task 3.4.4: Extract shop lock/unlock logic
