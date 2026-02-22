# System Interfaces Documentation

This document provides comprehensive documentation for all system interfaces in the refactored architecture.

**Requirements Validated**: 18.2, 18.3

## Table of Contents

1. [BoardSystem](#boardsystem)
2. [ShopSystem](#shopsystem)
3. [CombatSystem](#combatsystem)
4. [UpgradeSystem](#upgradesystem)
5. [SynergySystem](#synergysystem)
6. [AISystem](#aisystem)

---

## BoardSystem

**Purpose**: Manages board state and unit placement operations.

**File**: `game/src/systems/BoardSystem.js`

**Dependencies**: 
- `src/data/synergies.js` (CLASS_SYNERGY, TRIBE_SYNERGY)

### Public API

#### Position Validation Functions

##### `isValidPosition(row, col)`

Validates if a position is within board bounds (0-4 for both row and col).

**Parameters:**
- `row` (number): Row index (0-4)
- `col` (number): Column index (0-4)

**Returns:** `boolean` - True if position is valid, false otherwise

**Error Handling:** Returns false for invalid inputs (non-integers, out of bounds)

**Example:**
```javascript
import { isValidPosition } from './systems/BoardSystem.js';

if (isValidPosition(2, 3)) {
  console.log('Valid position');
}
// Output: Valid position

if (isValidPosition(5, 2)) {
  console.log('Valid position');
} else {
  console.log('Invalid position');
}
// Output: Invalid position
```

##### `isPositionEmpty(board, row, col)`

Checks if a position on the board is empty.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix
- `row` (number): Row index
- `col` (number): Column index

**Returns:** `boolean` - True if position is empty, false otherwise

**Error Handling:** Returns false if position is invalid

**Example:**
```javascript
const board = createEmptyBoard();
console.log(isPositionEmpty(board, 0, 0)); // true

board[0][0] = { baseId: 'unit1', star: 1 };
console.log(isPositionEmpty(board, 0, 0)); // false
```

#### Board Query Functions

##### `getUnitAt(board, row, col)`

Gets the unit at a specific position on the board.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix
- `row` (number): Row index
- `col` (number): Column index

**Returns:** `Object|null` - Unit at position or null if empty/invalid

**Error Handling:** Returns null for invalid positions

**Example:**
```javascript
const unit = getUnitAt(board, 2, 3);
if (unit) {
  console.log(`Found unit: ${unit.baseId} (${unit.star}★)`);
}
```

##### `getDeployCount(board)`

Counts the number of deployed units on the board.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix

**Returns:** `number` - Number of non-null units on board

**Error Handling:** Returns 0 for invalid board

**Example:**
```javascript
const count = getDeployCount(board);
console.log(`${count} units deployed`);
```

##### `getDeployedUnits(board)`

Gets all deployed units from the board.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix

**Returns:** `Array<Object>` - Array of all units on board

**Example:**
```javascript
const units = getDeployedUnits(board);
units.forEach(unit => {
  console.log(`${unit.baseId} at (${unit.row}, ${unit.col})`);
});
```

##### `canDeploy(board, deployLimit)`

Checks if a unit can be deployed based on current deploy count and limit.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix
- `deployLimit` (number): Maximum number of units allowed on board

**Returns:** `boolean` - True if deployment is allowed, false otherwise

**Example:**
```javascript
if (canDeploy(board, 5)) {
  console.log('Can deploy more units');
} else {
  console.log('Deploy limit reached');
}
```

#### Board Manipulation Functions

##### `placeUnit(board, unit, row, col, deployLimit)`

Places a unit on the board at the specified position.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix (will be modified)
- `unit` (Object): Unit to place
- `row` (number): Row index
- `col` (number): Column index
- `deployLimit` (number): Maximum number of units allowed on board

**Returns:** `Object` - Result object with success flag and optional error message
```javascript
{
  success: boolean,
  error?: string  // 'Invalid position' | 'Position occupied' | 'Deploy limit reached'
}
```

**Error Handling:**
- Returns `{success: false, error: 'Invalid position'}` if position is out of bounds
- Returns `{success: false, error: 'Position occupied'}` if position is not empty
- Returns `{success: false, error: 'Deploy limit reached'}` if board is full

**Side Effects:** Modifies the board array in place

**Example:**
```javascript
const result = placeUnit(board, myUnit, 2, 3, 5);
if (result.success) {
  console.log('Unit placed successfully');
} else {
  console.error(`Failed to place unit: ${result.error}`);
}
```

##### `removeUnit(board, row, col)`

Removes a unit from the board at the specified position.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix (will be modified)
- `row` (number): Row index
- `col` (number): Column index

**Returns:** `Object` - Result object with success flag, optional error, and removed unit
```javascript
{
  success: boolean,
  error?: string,  // 'Invalid position' | 'No unit at position'
  unit?: Object    // The removed unit (if successful)
}
```

**Error Handling:**
- Returns `{success: false, error: 'Invalid position'}` if position is out of bounds
- Returns `{success: false, error: 'No unit at position'}` if position is empty

**Side Effects:** Modifies the board array in place

**Example:**
```javascript
const result = removeUnit(board, 2, 3);
if (result.success) {
  console.log(`Removed unit: ${result.unit.baseId}`);
}
```

##### `moveUnit(board, fromRow, fromCol, toRow, toCol, allowSwap)`

Moves a unit from one position to another on the board.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix (will be modified)
- `fromRow` (number): Source row index
- `fromCol` (number): Source column index
- `toRow` (number): Destination row index
- `toCol` (number): Destination column index
- `allowSwap` (boolean, optional): Whether to allow swapping with existing unit at destination (default: true)

**Returns:** `Object` - Result object with success flag, optional error, and swap status
```javascript
{
  success: boolean,
  error?: string,  // 'Invalid source position' | 'Invalid destination position' | 
                   // 'No unit at source position' | 'Destination occupied and swap not allowed'
  swapped: boolean // True if units were swapped
}
```

**Error Handling:**
- Validates both source and destination positions
- Checks if source position has a unit
- Respects allowSwap parameter

**Side Effects:** Modifies the board array in place

**Example:**
```javascript
// Move unit from (1,1) to (2,2)
const result = moveUnit(board, 1, 1, 2, 2, true);
if (result.success) {
  if (result.swapped) {
    console.log('Units swapped');
  } else {
    console.log('Unit moved');
  }
}
```

#### Synergy Calculation

##### `calculateSynergies(units)`

Calculates active synergies based on deployed units.

**Parameters:**
- `units` (Array<Object>): Array of deployed units

**Returns:** `Object` - Synergy result with class and tribe counts and active bonuses
```javascript
{
  classCounts: Object,      // e.g., { TANKER: 2, MAGE: 3 }
  tribeCounts: Object,      // e.g., { FIRE: 2, WATER: 3 }
  activeSynergies: Array    // Array of active synergy objects
}
```

**Example:**
```javascript
const units = getDeployedUnits(board);
const synergies = calculateSynergies(units);

console.log('Class counts:', synergies.classCounts);
console.log('Tribe counts:', synergies.tribeCounts);
console.log('Active synergies:', synergies.activeSynergies.length);
```

---

## ShopSystem

**Purpose**: Manages shop operations including refresh, buy, sell, lock/unlock, and shop generation.

**File**: `game/src/systems/ShopSystem.js`

**Dependencies**:
- `src/data/unitCatalog.js` (UNIT_CATALOG, UNIT_BY_ID)
- `src/core/gameUtils.js` (rollTierForLevel, randomItem)

### Public API

#### Shop Operations

##### `refreshShop(player, cost)`

Refreshes the shop with new offers. Deducts refresh cost from player gold if not locked.

**Parameters:**
- `player` (Object): Player state object
- `cost` (number, optional): Cost to refresh shop (default: 2)

**Returns:** `Object` - Result object with success flag, updated player, or error
```javascript
{
  success: boolean,
  player?: Object,  // Updated player state (if successful)
  error?: string    // 'No player provided' | 'Shop is locked' | 'Not enough gold'
}
```

**Error Handling:**
- Returns error if player is null
- Returns error if shop is locked
- Returns error if player has insufficient gold

**Example:**
```javascript
const result = refreshShop(player, 2);
if (result.success) {
  player = result.player;  // Update player state
  updateShopUI(player.shop);
} else {
  showError(result.error);
}
```

##### `buyUnit(player, slot, createUnitFn, benchCap)`

Buys a unit from the shop at the specified slot. Deducts unit cost from player gold and adds unit to bench.

**Parameters:**
- `player` (Object): Player state object
- `slot` (number): Shop slot index (0-4)
- `createUnitFn` (Function): Function to create owned unit `(baseId, star) => unit`
- `benchCap` (number): Maximum bench capacity

**Returns:** `Object` - Result object with success flag, updated player, purchased unit, or error
```javascript
{
  success: boolean,
  player?: Object,  // Updated player state (if successful)
  unit?: Object,    // Purchased unit (if successful)
  cost?: number,    // Cost paid (if successful)
  error?: string    // Error message if failed
}
```

**Error Handling:**
- Returns error if player is null
- Returns error if slot is invalid
- Returns error if no unit in slot
- Returns error if invalid unit data
- Returns error if insufficient gold
- Returns error if bench is full
- Returns error if unit creation fails

**Example:**
```javascript
const result = buyUnit(player, 0, createOwnedUnit, 8);
if (result.success) {
  player = result.player;
  console.log(`Bought ${result.unit.baseId} for ${result.cost} gold`);
  updateBenchUI(player.bench);
} else {
  showError(result.error);
}
```

##### `sellUnit(player, unit)`

Sells a unit and adds gold to player.

**Parameters:**
- `player` (Object): Player state object
- `unit` (Object): Unit to sell

**Returns:** `Object` - Result object with success flag, updated player, sell value, or error
```javascript
{
  success: boolean,
  player?: Object,    // Updated player state (if successful)
  sellValue?: number, // Gold received (if successful)
  error?: string      // Error message if failed
}
```

**Sell Value Formula:**
- Star 1: `tier × 1`
- Star 2: `tier × 3`
- Star 3: `tier × 5`

**Error Handling:**
- Returns error if player is null
- Returns error if unit is null
- Returns error if invalid unit data

**Example:**
```javascript
const result = sellUnit(player, selectedUnit);
if (result.success) {
  player = result.player;
  console.log(`Sold unit for ${result.sellValue} gold`);
  updateGoldUI(player.gold);
}
```

##### `lockShop(player)`

Locks the shop to preserve current offers.

**Parameters:**
- `player` (Object): Player state object

**Returns:** `Object` - Result object with success flag and updated player
```javascript
{
  success: boolean,
  player?: Object,  // Updated player state with shopLocked: true
  error?: string
}
```

**Example:**
```javascript
const result = lockShop(player);
if (result.success) {
  player = result.player;
  updateLockButtonUI(true);
}
```

##### `unlockShop(player)`

Unlocks the shop to allow refreshing.

**Parameters:**
- `player` (Object): Player state object

**Returns:** `Object` - Result object with success flag and updated player
```javascript
{
  success: boolean,
  player?: Object,  // Updated player state with shopLocked: false
  error?: string
}
```

**Example:**
```javascript
const result = unlockShop(player);
if (result.success) {
  player = result.player;
  updateLockButtonUI(false);
}
```

#### Shop Generation

##### `generateShopOffers(level, slots)`

Generates shop offers based on player level. Uses tier odds to determine which tier units to offer.

**Parameters:**
- `level` (number): Player level (1-25)
- `slots` (number, optional): Number of shop slots (default: 5)

**Returns:** `Array<Object>` - Array of shop offers
```javascript
[
  { slot: 0, baseId: 'unit1' },
  { slot: 1, baseId: 'unit2' },
  ...
]
```

**Tier Odds:** Uses level-based tier probability distribution (see `getTierOdds`)

**Example:**
```javascript
const offers = generateShopOffers(5, 5);
console.log(`Generated ${offers.length} shop offers`);
offers.forEach(offer => {
  console.log(`Slot ${offer.slot}: ${offer.baseId}`);
});
```

##### `calculateRefreshCost()`

Calculates the cost to refresh the shop.

**Parameters:** None

**Returns:** `number` - Cost to refresh shop (currently fixed at 2)

**Note:** Can be extended for dynamic pricing (increasing cost per refresh, discounts, level-based pricing)

**Example:**
```javascript
const cost = calculateRefreshCost();
console.log(`Refresh cost: ${cost} gold`);
```

##### `getTierOdds(level)`

Gets the tier odds for a specific player level. Returns probability distribution for tiers 1-5.

**Parameters:**
- `level` (number): Player level (1-25)

**Returns:** `Object` - Tier odds object with probabilities for each tier
```javascript
{
  tier1: number,  // Probability for tier 1 (0-1)
  tier2: number,  // Probability for tier 2 (0-1)
  tier3: number,  // Probability for tier 3 (0-1)
  tier4: number,  // Probability for tier 4 (0-1)
  tier5: number   // Probability for tier 5 (0-1)
}
```

**Level Clamping:** Levels beyond 25 use level 25 odds

**Example:**
```javascript
const odds = getTierOdds(10);
console.log('Tier odds at level 10:');
console.log(`Tier 1: ${(odds.tier1 * 100).toFixed(1)}%`);
console.log(`Tier 2: ${(odds.tier2 * 100).toFixed(1)}%`);
console.log(`Tier 3: ${(odds.tier3 * 100).toFixed(1)}%`);
console.log(`Tier 4: ${(odds.tier4 * 100).toFixed(1)}%`);
console.log(`Tier 5: ${(odds.tier5 * 100).toFixed(1)}%`);
```

---

## CombatSystem

**Purpose**: Manages all combat logic including turn order, skill execution, damage calculation, status effects, and combat end conditions.

**File**: `game/src/systems/CombatSystem.js`

**Dependencies**: None (pure functions)

### Public API

#### Combat Initialization

##### `initializeCombat(playerUnits, enemyUnits)`

Initializes combat state with player and enemy units. Creates combat state with turn order based on unit speed.

**Parameters:**
- `playerUnits` (Array<Object>): Array of player combat units
- `enemyUnits` (Array<Object>): Array of enemy combat units

**Returns:** `Object` - Combat state object
```javascript
{
  playerUnits: Array<Object>,  // Copy of player units
  enemyUnits: Array<Object>,   // Copy of enemy units
  turnOrder: Array<Object>,    // Units sorted by speed (interleaved)
  currentTurn: number,         // Current turn index (0)
  combatLog: Array,            // Combat event log
  isFinished: boolean,         // Combat finished flag (false)
  winner: null                 // Winner ('player' | 'enemy' | 'draw' | null)
}
```

**Turn Order Algorithm:**
- Separates units by side (LEFT/RIGHT)
- Sorts each side by speed (higher speed first)
- Interleaves player and enemy units

**Example:**
```javascript
const combatState = initializeCombat(playerUnits, enemyUnits);
console.log(`Combat initialized with ${combatState.turnOrder.length} units`);
```

#### Turn Management

##### `getNextActor(state)`

Gets the next actor from the turn order. Skips dead units and cycles through turn order.

**Parameters:**
- `state` (Object): Current combat state

**Returns:** `Object|null` - Next combat unit to act, or null if combat is finished

**Behavior:**
- Skips units with `alive === false` or `isDead === true`
- Increments `state.currentTurn`
- Returns null when turn order is exhausted

**Example:**
```javascript
const actor = getNextActor(combatState);
if (actor) {
  console.log(`${actor.name}'s turn`);
  executeUnitAction(actor);
} else {
  console.log('Turn order exhausted, rebuild needed');
}
```

##### `executeAction(state, actor)`

Executes an action for the current actor. Determines whether to use skill (rage >= 100) or basic attack (rage < 100).

**Parameters:**
- `state` (Object): Current combat state
- `actor` (Object): Combat unit performing the action

**Returns:** `Object` - Action result
```javascript
{
  success: boolean,
  actionType?: string,  // 'SKILL' | 'BASIC_ATTACK' | 'DISARMED'
  useSkill?: boolean,   // True if skill should be used
  resetRage?: boolean,  // True if rage should be reset to 0
  rageChange?: number,  // Amount of rage change
  message?: string,     // Action description
  error?: string        // Error message if failed
}
```

**Action Logic:**
- If rage >= 100 and not silenced: Use skill, reset rage to 0 (except MAGE class)
- If disarmed: Cannot attack, skip turn
- Otherwise: Use basic attack, gain ~20 rage

**Error Handling:**
- Returns error if actor is null or dead
- Checks for silence status (prevents skill usage)
- Checks for disarm status (prevents basic attacks)

**Example:**
```javascript
const result = executeAction(combatState, actor);
if (result.success) {
  if (result.useSkill) {
    executeSkill(actor, actor.skill, targets, combatState);
  } else if (result.actionType === 'BASIC_ATTACK') {
    executeBasicAttack(actor, target);
  }
  actor.rage += result.rageChange;
}
```

#### Skill Execution

##### `executeSkill(caster, skill, targets, state)`

Executes a skill for the caster on the specified targets. Applies skill effects including damage, status effects, and special mechanics.

**Parameters:**
- `caster` (Object): Combat unit casting the skill
- `skill` (Object): Skill definition object
- `targets` (Array<Object>): Array of target combat units
- `state` (Object): Current combat state

**Returns:** `Object` - Skill result
```javascript
{
  success: boolean,
  skillName?: string,       // Skill name
  skillEffect?: string,     // Skill effect description
  caster?: Object,          // Caster unit
  targets?: Array<Object>,  // Valid target units
  damageType?: string,      // 'physical' | 'magic' | 'true'
  actionPattern?: string,   // Skill action pattern
  message?: string,         // Skill execution message
  error?: string            // Error message if failed
}
```

**Error Handling:**
- Returns error if caster, skill, targets, or state is null
- Returns error if skill definition is invalid
- Returns error if caster is silenced
- Filters out dead targets

**Note:** This function validates and prepares skill execution. Actual damage calculation and effect application is done by the scene.

**Example:**
```javascript
const result = executeSkill(caster, skill, targets, combatState);
if (result.success) {
  console.log(`${result.caster.name} casts ${result.skillName}`);
  result.targets.forEach(target => {
    applySkillEffects(target, skill);
  });
}
```

#### Damage Calculation

##### `calculateDamage(attacker, defender, skill, state)`

Calculates damage from attacker to defender. Applies attack, defense, elemental modifiers, and synergy bonuses.

**Parameters:**
- `attacker` (Object): Attacking combat unit
- `defender` (Object): Defending combat unit
- `skill` (Object|null): Skill or attack being used (null for basic attack)
- `state` (Object): Current combat state (for synergies and modifiers)

**Returns:** `Object` - Damage result
```javascript
{
  success: boolean,
  damage: number,           // Final damage value
  damageType: string,       // 'physical' | 'magic' | 'true'
  isCrit: boolean,          // True if critical hit
  breakdown: {
    rawDamage: number,      // Damage before defense
    elementalMult: number,  // Elemental multiplier (0.5, 1, or 1.5)
    finalDamage: number     // Final damage after all modifiers
  },
  error?: string
}
```

**Damage Formula:**
1. **Base Damage:**
   - Skill: `(base + stat * scale) * starMult * goldMult`
   - Basic Attack: `effectiveAtk`
2. **Elemental Advantage:** ×1.5 (advantage) or ×0.5 (disadvantage)
3. **Critical Hit:** ×1.5 (physical damage only, ignores defense)
4. **Defense Reduction:**
   - Physical: `damage * (100 / (100 + def))`
   - Magic: `damage * (100 / (100 + mdef))`
   - True: No reduction

**Error Handling:**
- Returns error if attacker or defender is null
- Returns minimum 1 damage

**Example:**
```javascript
const result = calculateDamage(attacker, defender, skill, combatState);
if (result.success) {
  console.log(`Damage: ${result.damage} (${result.damageType})`);
  if (result.isCrit) {
    console.log('Critical hit!');
  }
  applyDamage(defender, result.damage, combatState);
}
```

##### `applyDamage(unit, damage, state)`

Applies damage to a combat unit. Ensures HP never goes below 0 and marks unit as dead if HP reaches 0.

**Parameters:**
- `unit` (Object): Combat unit receiving damage (will be modified)
- `damage` (number): Amount of damage to apply
- `state` (Object): Current combat state

**Returns:** `Object` - Damage application result
```javascript
{
  success: boolean,
  unit?: Object,          // Updated unit
  died: boolean,          // True if unit died
  shieldAbsorbed: number, // Damage absorbed by shield
  hpLost: number,         // HP lost
  totalDamage: number,    // Total damage dealt (shield + hp)
  error?: string
}
```

**Damage Application:**
1. Shield absorbs damage first
2. Remaining damage applied to HP
3. HP clamped to 0 minimum
4. If HP reaches 0: mark as dead, remove from turn order, log death event

**Error Handling:**
- Returns error if unit is null
- Returns error if damage is invalid (negative, NaN, Infinity)
- Returns error if unit is already dead

**Side Effects:**
- Modifies unit.hp, unit.shield, unit.isDead, unit.alive
- Modifies state.turnOrder (removes dead unit)
- Adds death event to state.combatLog

**Example:**
```javascript
const result = applyDamage(defender, 50, combatState);
if (result.success) {
  console.log(`Dealt ${result.totalDamage} damage`);
  if (result.died) {
    console.log(`${defender.name} has been defeated!`);
  }
}
```

#### Status Effects

##### `applyStatusEffect(unit, effect, state)`

Applies a status effect to a combat unit. Handles stacking, duration, and effect application.

**Parameters:**
- `unit` (Object): Combat unit receiving the status effect (will be modified)
- `effect` (Object): Status effect definition
  ```javascript
  {
    type: string,      // Effect type (see below)
    duration: number,  // Duration in turns
    value: number      // Effect value (damage, stat modifier, etc.)
  }
  ```
- `state` (Object): Current combat state

**Returns:** `Object` - Status application result
```javascript
{
  success: boolean,
  unit?: Object,      // Updated unit
  effectType: string, // Effect type applied
  duration: number,   // Duration applied
  value: number,      // Value applied
  message?: string,   // Status application message
  error?: string
}
```

**Supported Status Effects:**

**Control Effects (Hard CC):**
- `freeze`, `stun`, `sleep`, `silence`

**Damage Over Time:**
- `burn`, `poison`, `bleed`, `disease`

**Stat Modifiers:**
- `armorBreak`, `atkBuff`, `atkDebuff`, `defBuff`, `mdefBuff`, `evadeBuff`, `evadeDebuff`

**Special Effects:**
- `taunt`, `reflect`, `disarm`, `immune`, `physReflect`, `counter`, `protecting`

**Error Handling:**
- Returns error if unit or effect is null
- Returns error if unit is dead
- Returns error for unknown effect types

**Side Effects:**
- Modifies unit.statuses object
- Adds status application event to state.combatLog

**Example:**
```javascript
const effect = { type: 'burn', duration: 3, value: 20 };
const result = applyStatusEffect(target, effect, combatState);
if (result.success) {
  console.log(`Applied ${result.effectType} for ${result.duration} turns`);
}
```

##### `tickStatusEffects(unit, state)`

Ticks all status effects on a combat unit. Decrements duration, applies periodic effects, and removes expired effects.

**Parameters:**
- `unit` (Object): Combat unit with status effects (will be modified)
- `state` (Object): Current combat state

**Returns:** `Object` - Status tick result
```javascript
{
  success: boolean,
  unit?: Object,                // Updated unit
  triggeredEffects: Array,      // Effects that triggered this turn
  controlStatus: string|null,   // Active control status ('freeze' | 'stun' | 'sleep' | null)
  message?: string,
  error?: string
}
```

**Tick Behavior:**
1. Decrements all timed status durations
2. Applies damage over time effects (burn, poison, bleed, disease)
3. Checks for control effects (freeze > stun > sleep priority)
4. Cleans up expired status values

**Error Handling:**
- Returns error if unit is null
- Returns error if unit is dead

**Side Effects:**
- Modifies unit.statuses object
- Adds status tick event to state.combatLog

**Example:**
```javascript
const result = tickStatusEffects(unit, combatState);
if (result.success) {
  result.triggeredEffects.forEach(effect => {
    if (effect.type === 'burn') {
      applyDamage(unit, effect.damage, combatState);
    }
  });
  
  if (result.controlStatus) {
    console.log(`${unit.name} is ${result.controlStatus}d, skipping turn`);
    return; // Skip turn
  }
}
```

#### Combat End

##### `checkCombatEnd(state)`

Checks if combat has ended. Determines winner based on which side has units remaining.

**Parameters:**
- `state` (Object): Current combat state (will be modified)

**Returns:** `Object` - Combat end result
```javascript
{
  isFinished: boolean,          // True if combat has ended
  winner: string|null,          // 'player' | 'enemy' | 'draw' | null
  playerUnitsRemaining: number, // Number of alive player units
  enemyUnitsRemaining: number,  // Number of alive enemy units
  message: string,              // Combat end message
  error?: string
}
```

**End Conditions:**
- **Player Victory:** All enemy units dead, at least 1 player unit alive
- **Enemy Victory:** All player units dead, at least 1 enemy unit alive
- **Draw:** All units on both sides dead
- **Continue:** Units remaining on both sides

**Error Handling:**
- Returns error if state is null

**Side Effects:**
- Sets state.isFinished and state.winner
- Adds combat end event to state.combatLog

**Example:**
```javascript
const result = checkCombatEnd(combatState);
if (result.isFinished) {
  console.log(result.message);
  if (result.winner === 'player') {
    handlePlayerVictory();
  } else if (result.winner === 'enemy') {
    handlePlayerDefeat();
  } else {
    handleDraw();
  }
}
```

---

## UpgradeSystem

**Purpose**: Manages unit upgrade operations including detection, combination, and equipment transfer.

**File**: `game/src/systems/UpgradeSystem.js`

**Dependencies**: None (pure functions)

### Public API

#### Upgrade Validation

##### `canUpgradeUnit(unit)`

Checks if a unit can be upgraded (star level < 3).

**Parameters:**
- `unit` (Object): Unit to check

**Returns:** `boolean` - True if unit can be upgraded, false otherwise

**Example:**
```javascript
if (canUpgradeUnit(unit)) {
  console.log('Unit can be upgraded');
}
```

##### `canUpgrade(units, baseId, star)`

Checks if there are enough units to perform an upgrade.

**Parameters:**
- `units` (Array<Object>): Array of units to check
- `baseId` (string): Base ID to match
- `star` (number): Star level to match

**Returns:** `boolean` - True if upgrade is possible (3+ matching units), false otherwise

**Upgrade Requirements:**
- Need 3 units with same baseId and star level
- Star level must be < 3

**Example:**
```javascript
if (canUpgrade(allUnits, 'wolf', 1)) {
  console.log('Can upgrade 3 1-star wolves to 1 2-star wolf');
}
```

#### Unit Upgrade

##### `upgradeUnit(unit)`

Upgrades a single unit to the next star level. Creates a new unit object with incremented star level.

**Parameters:**
- `unit` (Object): Unit to upgrade

**Returns:** `Object` - Result object
```javascript
{
  success: boolean,
  unit?: Object,  // Upgraded unit with star + 1
  error?: string  // 'No unit provided' | 'Unit cannot be upgraded (max star level reached)'
}
```

**Error Handling:**
- Returns error if unit is null
- Returns error if unit is already star 3

**Example:**
```javascript
const result = upgradeUnit(unit);
if (result.success) {
  console.log(`Upgraded to ${result.unit.star}★`);
}
```

##### `findUpgradeCandidates(board, bench)`

Finds all upgrade candidates from a collection of units. Returns groups of units that can be combined.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix
- `bench` (Array<Object>): Bench array

**Returns:** `Array<Object>` - Array of upgrade candidate groups
```javascript
[
  {
    baseId: string,           // Base ID of units
    star: number,             // Star level
    count: number,            // Number of matching units
    refs: Array<Object>       // First 3 unit references
  },
  ...
]
```

**Grouping Logic:**
- Groups units by species (normalized) and star level
- Only includes groups with 3+ units
- Excludes star 3 units

**Example:**
```javascript
const candidates = findUpgradeCandidates(board, bench);
candidates.forEach(candidate => {
  console.log(`Can upgrade ${candidate.count} ${candidate.baseId} (${candidate.star}★)`);
});
```

##### `combineUnits(units)`

Combines 3 units into 1 upgraded unit.

**Parameters:**
- `units` (Array<Object>): Array of exactly 3 units to combine

**Returns:** `Object` - Result object
```javascript
{
  success: boolean,
  unit?: Object,              // Combined unit with star + 1
  equipmentTransferred: number, // Number of equipment items transferred
  error?: string
}
```

**Combination Rules:**
- All 3 units must have same baseId and star level
- Star level must be < 3
- Equipment from all 3 units is collected (max 3 items)

**Error Handling:**
- Returns error if not exactly 3 units provided
- Returns error if units don't match
- Returns error if star level is 3

**Example:**
```javascript
const result = combineUnits([unit1, unit2, unit3]);
if (result.success) {
  console.log(`Combined into ${result.unit.star}★ unit`);
  console.log(`Transferred ${result.equipmentTransferred} equipment`);
}
```

#### Equipment Management

##### `collectMergeEquips(refs, itemCatalog)`

Collects and deduplicates equipment from source units for merging. Ensures no duplicate equipment names on the merged unit.

**Parameters:**
- `refs` (Array<Object>): Array of unit references with equipment
- `itemCatalog` (Object): Item catalog (ITEM_BY_ID)

**Returns:** `Object` - Equipment collection result
```javascript
{
  kept: Array<string>,      // Equipment kept (max 3, deduplicated by name)
  overflow: Array<string>   // Equipment that couldn't be kept
}
```

**Deduplication Logic:**
- Equipment with same name cannot be equipped on same unit
- Keeps first occurrence of each equipment name
- Maximum 3 equipment items kept

**Example:**
```javascript
const { kept, overflow } = collectMergeEquips(unitRefs, ITEM_BY_ID);
console.log(`Kept ${kept.length} equipment, ${overflow.length} overflow`);
```

#### Auto-Merge

##### `tryAutoMerge(board, bench, itemCatalog, unitCatalog, createUnitFn)`

Performs automatic upgrade/merge for all eligible units. Processes all possible upgrades in one pass.

**Parameters:**
- `board` (Array<Array<Object|null>>): 5x5 board matrix (will be modified)
- `bench` (Array<Object>): Bench array (will be modified)
- `itemCatalog` (Object): Item catalog for equipment handling (ITEM_BY_ID)
- `unitCatalog` (Object): Unit catalog for tier sorting (UNIT_BY_ID)
- `createUnitFn` (Function): Function to create a new owned unit `(baseId, star, equips) => unit`

**Returns:** `Object` - Auto-merge result
```javascript
{
  mergeCount: number,  // Total number of merges performed
  log: Array<Object>   // Log of merge operations
}
```

**Merge Log Entry:**
```javascript
{
  baseId: string,              // Base ID of merged unit
  fromStar: number,            // Original star level
  toStar: number,              // New star level
  equipCount: number,          // Equipment kept
  equipOverflow: number,       // Equipment overflow count
  overflowItems: Array<string> // Overflow equipment IDs
}
```

**Merge Algorithm:**
1. Collect all unit references from board and bench
2. Group by species and star level
3. For each group with 3+ units:
   - Take first 3 units
   - Collect and deduplicate equipment
   - Remove source units
   - Create upgraded unit
   - Place merged unit (prefer board position)
4. Repeat until no more merges possible

**Side Effects:**
- Modifies board and bench arrays in place
- Removes source units
- Adds merged units

**Example:**
```javascript
const result = tryAutoMerge(board, bench, ITEM_BY_ID, UNIT_BY_ID, createOwnedUnit);
console.log(`Performed ${result.mergeCount} auto-merges`);
result.log.forEach(entry => {
  console.log(`Merged ${entry.baseId} ${entry.fromStar}★ → ${entry.toStar}★`);
});
```

---

## SynergySystem

**Purpose**: Manages synergy calculation and application for team compositions.

**File**: `game/src/systems/SynergySystem.js`

**Dependencies**:
- `src/data/synergies.js` (CLASS_SYNERGY, TRIBE_SYNERGY)
- `src/data/unitVisuals.js` (getClassLabelVi, getTribeLabelVi)

### Public API

#### Core Synergy Calculation

##### `calculateSynergies(units, side, options)`

Calculates synergy counts from a list of units. Supports extra class/tribe counts for player bonuses.

**Parameters:**
- `units` (Array<Object>): Array of units to analyze
- `side` (string, optional): Side identifier ("LEFT" for player, "RIGHT" for enemy, default: "LEFT")
- `options` (Object, optional): Configuration options
  ```javascript
  {
    extraClassCount: number,  // Extra count to add to top class (default: 0)
    extraTribeCount: number   // Extra count to add to top tribe (default: 0)
  }
  ```

**Returns:** `Object` - Synergy counts
```javascript
{
  classCounts: Object,  // e.g., { TANKER: 2, MAGE: 3 }
  tribeCounts: Object   // e.g., { FIRE: 2, WATER: 3 }
}
```

**Example:**
```javascript
const synergies = calculateSynergies(units, "LEFT", { extraClassCount: 1 });
console.log('Class counts:', synergies.classCounts);
console.log('Tribe counts:', synergies.tribeCounts);
```

##### `getActiveSynergies(units, side, options)`

Gets all active synergies for a team. Returns detailed information about each active synergy.

**Parameters:**
- `units` (Array<Object>): Array of units
- `side` (string, optional): Side identifier (default: "LEFT")
- `options` (Object, optional): Configuration options (same as calculateSynergies)

**Returns:** `Array<Object>` - Array of active synergy objects
```javascript
[
  {
    type: string,           // 'class' | 'tribe'
    key: string,            // Synergy key (e.g., 'TANKER', 'FIRE')
    count: number,          // Number of units
    tier: number,           // Active tier (0-based index)
    threshold: number,      // Threshold for this tier
    bonuses: Object,        // Bonus stats for this tier
    description: string,    // Formatted description
    icon: string            // Icon/emoji
  },
  ...
]
```

**Example:**
```javascript
const activeSynergies = getActiveSynergies(units);
activeSynergies.forEach(synergy => {
  console.log(`${synergy.icon} ${synergy.description}`);
});
```

#### Synergy Bonus Operations

##### `getSynergyBonus(synergyDef, count)`

Gets the synergy bonus for a given definition and count. Returns the highest tier bonus that the count qualifies for.

**Parameters:**
- `synergyDef` (Object): Synergy definition with thresholds and bonuses
- `count` (number): Number of units of this type

**Returns:** `Object|null` - Bonus object or null if no threshold met

**Example:**
```javascript
const classDef = CLASS_SYNERGY['TANKER'];
const bonus = getSynergyBonus(classDef, 4);
if (bonus) {
  console.log('Tanker bonus:', bonus);
}
```

##### `getSynergyTier(count, thresholds)`

Gets the synergy tier index for a given count and thresholds.

**Parameters:**
- `count` (number): Number of units
- `thresholds` (Array<number>): Array of threshold values

**Returns:** `number` - Tier index (0-based) or -1 if no threshold met

**Example:**
```javascript
const tier = getSynergyTier(4, [2, 4, 6]);
console.log(`Tier: ${tier}`); // Output: Tier: 1
```

##### `applySynergiesToUnit(unit, synergyCounts)`

Applies synergy bonuses to a single unit. Modifies the unit's stats based on active class and tribe synergies.

**Parameters:**
- `unit` (Object): Combat unit to apply bonuses to (will be modified)
- `synergyCounts` (Object): Object with classCounts and tribeCounts

**Returns:** `void`

**Side Effects:** Modifies unit.mods object

**Example:**
```javascript
const synergyCounts = calculateSynergies(units);
units.forEach(unit => {
  applySynergiesToUnit(unit, synergyCounts);
});
```

##### `applyBonusToCombatUnit(unit, bonus)`

Applies a bonus object directly to a combat unit's stats. This version modifies the unit's actual stats (hp, atk, def, etc.) not just mods.

**Parameters:**
- `unit` (Object): Combat unit to apply bonus to (will be modified)
- `bonus` (Object): Bonus object with stat modifiers

**Returns:** `void`

**Side Effects:** Modifies unit stats (hp, maxHp, atk, matk, def, mdef, mods)

**Bonus Properties:**
- `hpPct`, `teamHpPct`: HP percentage bonus
- `atkPct`, `teamAtkPct`: Attack percentage bonus
- `matkPct`, `teamMatkPct`: Magic attack percentage bonus
- `defFlat`: Flat defense bonus
- `mdefFlat`: Flat magic defense bonus
- `healPct`, `lifestealPct`, `evadePct`: Mod-based bonuses
- `shieldStart`, `startingRage`, `critPct`: Special bonuses
- `burnOnHit`, `poisonOnHit`: On-hit effects

**Example:**
```javascript
const bonus = { hpPct: 0.2, atkPct: 0.15 };
applyBonusToCombatUnit(unit, bonus);
```

##### `applySynergyBonusesToTeam(units, side, options)`

Applies synergy bonuses to all units on a team. Calculates synergies for the team and applies bonuses to each unit. Also applies starting rage and shield bonuses from synergies.

**Parameters:**
- `units` (Array<Object>): Array of combat units (will be modified)
- `side` (string, optional): Side identifier (default: "LEFT")
- `options` (Object, optional): Configuration options (same as calculateSynergies)

**Returns:** `void`

**Side Effects:**
- Modifies all unit stats based on synergies
- Applies starting rage and shield bonuses

**Example:**
```javascript
applySynergyBonusesToTeam(playerUnits, "LEFT");
applySynergyBonusesToTeam(enemyUnits, "RIGHT");
```

#### UI/Display Helpers

##### `getSynergyDescription(synergyId, level, type)`

Gets a formatted description of a synergy bonus.

**Parameters:**
- `synergyId` (string): Synergy identifier (class or tribe key)
- `level` (number): Synergy tier level (0-based index)
- `type` (string, optional): Synergy type ("class" or "tribe", default: "class")

**Returns:** `string` - Formatted description of the synergy bonus

**Example:**
```javascript
const desc = getSynergyDescription('TANKER', 1, 'class');
console.log(desc); // "Tanker (4): +20% HP, +10 Defense"
```

##### `getSynergyIcon(synergyId, type)`

Gets the icon/emoji for a synergy.

**Parameters:**
- `synergyId` (string): Synergy identifier (class or tribe key)
- `type` (string, optional): Synergy type ("class" or "tribe", default: "class")

**Returns:** `string` - Icon/emoji representing the synergy

**Class Icons:**
- TANKER: 🛡️
- ASSASSIN: 🗡️
- ARCHER: 🏹
- MAGE: 🔮
- SUPPORT: 💚
- FIGHTER: ⚔️

**Tribe Icons:**
- FIRE: 🔥
- SPIRIT: 👻
- TIDE: 🌊
- STONE: 🪨
- WIND: 💨
- NIGHT: 🌙
- SWARM: 🐝
- WOOD: 🌲

**Example:**
```javascript
const icon = getSynergyIcon('FIRE', 'tribe');
console.log(icon); // 🔥
```

---

## AISystem

**Purpose**: Manages AI opponent logic including enemy team generation, difficulty scaling, and AI decision making.

**File**: `game/src/systems/AISystem.js`

**Dependencies**:
- `src/data/unitCatalog.js` (UNIT_CATALOG)
- `src/core/gameUtils.js` (getDeployCapByLevel)

### Public API

#### AI Settings

##### `getAISettings(difficulty)`

Get AI settings for a specific difficulty.

**Parameters:**
- `difficulty` (string, optional): Difficulty level ("EASY" | "MEDIUM" | "HARD", default: "MEDIUM")

**Returns:** `Object` - AI settings object
```javascript
{
  label: string,              // Display label
  hpMult: number,             // HP multiplier
  atkMult: number,            // Attack multiplier
  matkMult: number,           // Magic attack multiplier
  rageGain: number,           // Rage gain multiplier
  randomTargetChance: number, // Chance to pick random target
  teamSizeBonus: number,      // Flat team size bonus
  teamGrowthEvery: number,    // Rounds between team size growth
  teamGrowthCap: number,      // Maximum team size growth
  budgetMult: number,         // Budget multiplier
  levelBonus: number,         // Level bonus
  maxTierBonus: number,       // Max tier bonus
  star2Bonus: number,         // 2-star chance bonus
  star3Bonus: number          // 3-star chance bonus
}
```

**Example:**
```javascript
const settings = getAISettings('HARD');
console.log(`Hard mode: ${settings.hpMult}x HP, ${settings.atkMult}x ATK`);
```

#### Enemy Team Generation

##### `generateEnemyTeam(round, budget, difficulty, sandbox)`

Generate enemy team based on round, budget, and difficulty.

**Parameters:**
- `round` (number): Current round number
- `budget` (number): Budget for unit selection
- `difficulty` (string, optional): Difficulty level (default: "MEDIUM")
- `sandbox` (boolean, optional): Whether sandbox mode is active (default: false)

**Returns:** `Array<Object>` - Array of enemy units with positions
```javascript
[
  {
    baseId: string,  // Unit base ID
    star: number,    // Star level (1-3)
    row: number,     // Board row (0-4)
    col: number      // Board column (5-9 for enemy side)
  },
  ...
]
```

**Generation Algorithm:**
1. Calculate team size based on round and difficulty
2. Calculate budget based on round and difficulty multiplier
3. Determine max tier based on round
4. Pick units based on weighted class selection
5. Ensure minimum front line ratio
6. Determine star levels based on round progression
7. Assign positions based on unit roles

**Team Composition:**
- Front line (TANKER, FIGHTER): Positioned in columns 5-6
- Back line (ARCHER, MAGE, SUPPORT): Positioned in columns 7-9
- Assassins: Positioned in corners (rows 0, 4)

**Example:**
```javascript
const enemyTeam = generateEnemyTeam(10, 50, 'HARD', false);
console.log(`Generated ${enemyTeam.length} enemy units`);
enemyTeam.forEach(unit => {
  console.log(`${unit.baseId} (${unit.star}★) at (${unit.row}, ${unit.col})`);
});
```

##### `computeEnemyTeamSize(round, difficulty, sandbox)`

Compute enemy team size based on round and difficulty.

**Parameters:**
- `round` (number): Current round number
- `difficulty` (string, optional): Difficulty level (default: "MEDIUM")
- `sandbox` (boolean, optional): Whether sandbox mode is active (default: false)

**Returns:** `number` - Team size (2-15)

**Formula:**
```
base = getDeployCapByLevel(estLevel)
flatBonus = ai.teamSizeBonus
roundGrowth = min(floor((round - 1) / growthEvery), growthCap)
sandboxPenalty = sandbox ? 1 : 0
teamSize = clamp(base + flatBonus + roundGrowth - sandboxPenalty, 2, 15)
```

**Example:**
```javascript
const teamSize = computeEnemyTeamSize(15, 'HARD', false);
console.log(`Enemy team size: ${teamSize}`);
```

##### `getAIDifficultyMultiplier(difficulty)`

Get AI difficulty multiplier for stats.

**Parameters:**
- `difficulty` (string, optional): Difficulty level (default: "MEDIUM")

**Returns:** `Object` - Difficulty multipliers
```javascript
{
  hpMult: number,             // HP multiplier
  atkMult: number,            // Attack multiplier
  matkMult: number,           // Magic attack multiplier
  rageGain: number,           // Rage gain multiplier
  randomTargetChance: number  // Random target chance
}
```

**Example:**
```javascript
const mult = getAIDifficultyMultiplier('HARD');
enemyUnit.hp *= mult.hpMult;
enemyUnit.atk *= mult.atkMult;
```

#### AI Decision Making

##### `makeAIDecision(state, aiUnit, difficulty)`

Make AI decision for combat action. Determines whether to use skill or basic attack, and selects target.

**Parameters:**
- `state` (Object): Combat state with all units
- `aiUnit` (Object): AI unit taking action
- `difficulty` (string, optional): Difficulty level (default: "MEDIUM")

**Returns:** `Object` - AI action decision
```javascript
{
  action: string,      // 'SKILL' | 'ATTACK' | 'SKIP'
  target: Object|null, // Selected target unit or null
  reason: string       // Decision reason
}
```

**Decision Logic:**
1. Check if unit should skip turn (stunned, etc.)
2. Select target using `selectTarget`
3. Decide between skill and basic attack:
   - Use skill if rage >= 100 and not silenced
   - Skip if disarmed
   - Otherwise use basic attack

**Reasons:**
- `'stunned'`: Unit is stunned
- `'no_target'`: No valid target found
- `'rage_full'`: Rage is full, using skill
- `'disarmed'`: Unit is disarmed
- `'basic_attack'`: Using basic attack

**Example:**
```javascript
const decision = makeAIDecision(combatState, aiUnit, 'HARD');
if (decision.action === 'SKILL') {
  executeSkill(aiUnit, aiUnit.skill, [decision.target], combatState);
} else if (decision.action === 'ATTACK') {
  executeBasicAttack(aiUnit, decision.target);
}
```

##### `selectTarget(attacker, state, difficulty, options)`

Select target for an attacker unit. Implements tactical target selection based on unit role and positioning.

**Parameters:**
- `attacker` (Object): Attacking unit
- `state` (Object): Combat state with all units
- `difficulty` (string, optional): Difficulty level (default: "MEDIUM")
- `options` (Object, optional): Options
  ```javascript
  {
    deterministic: boolean  // If true, disable random target selection (default: false)
  }
  ```

**Returns:** `Object|null` - Selected target unit or null

**Target Selection Logic:**

**Melee Frontline (Tank/Fighter):**
- Prioritizes closest column
- Prefers same row
- Targets nearest enemy

**Assassin:**
- Prioritizes farthest column (backline)
- Prefers same row
- Targets backline units

**Ranged (Archer/Mage/Support):**
- Prioritizes same row
- Then closest by row distance
- Then closest by column distance

**Special Cases:**
- Taunt: Forces target to taunting unit
- Random Target: AI has chance to pick random target (based on difficulty)

**Example:**
```javascript
const target = selectTarget(attacker, combatState, 'MEDIUM', { deterministic: false });
if (target) {
  console.log(`${attacker.name} targets ${target.name}`);
  executeAttack(attacker, target);
}
```

---

## Common Patterns and Best Practices

### Error Handling Pattern

All systems follow a consistent error handling pattern:

```javascript
// Success case
{
  success: true,
  // ... result data
}

// Error case
{
  success: false,
  error: 'Error message'
}
```

Always check the `success` flag before using result data:

```javascript
const result = someSystemFunction(params);
if (result.success) {
  // Use result data
  console.log('Operation successful');
} else {
  // Handle error
  console.error(result.error);
}
```

### Immutability vs Mutation

**Pure Functions (Immutable):**
- ShopSystem: Returns new player state objects
- Most query functions: Return new data without modifying inputs

**Mutating Functions (In-Place):**
- BoardSystem: Modifies board array in place
- CombatSystem: Modifies unit and state objects in place
- UpgradeSystem: Modifies board and bench arrays in place

Always check function documentation to understand mutation behavior.

### State Management

Systems are designed to work with state objects passed as parameters:

```javascript
// Initialize state
let player = { gold: 10, level: 1, shop: [], bench: [] };
let board = createEmptyBoard();

// Update state through systems
const result = refreshShop(player, 2);
if (result.success) {
  player = result.player;  // Update player reference
}

// Board operations modify in place
placeUnit(board, unit, 2, 3, 5);
```

### Integration Example

Complete example showing how systems work together:

```javascript
import { BoardSystem } from './systems/BoardSystem.js';
import { ShopSystem } from './systems/ShopSystem.js';
import { UpgradeSystem } from './systems/UpgradeSystem.js';
import { SynergySystem } from './systems/SynergySystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { AISystem } from './systems/AISystem.js';

// Planning Phase
const player = { gold: 10, level: 5, shop: [], bench: [], board: BoardSystem.createEmptyBoard() };

// Refresh shop
const refreshResult = ShopSystem.refreshShop(player, 2);
if (refreshResult.success) {
  player = refreshResult.player;
}

// Buy unit
const buyResult = ShopSystem.buyUnit(player, 0, createOwnedUnit, 8);
if (buyResult.success) {
  player = buyResult.player;
}

// Place unit on board
const placeResult = BoardSystem.placeUnit(player.board, player.bench[0], 2, 2, 5);
if (placeResult.success) {
  player.bench.shift();
}

// Auto-merge units
const mergeResult = UpgradeSystem.tryAutoMerge(
  player.board, 
  player.bench, 
  ITEM_BY_ID, 
  UNIT_BY_ID, 
  createOwnedUnit
);
console.log(`Performed ${mergeResult.mergeCount} merges`);

// Calculate synergies
const deployedUnits = BoardSystem.getDeployedUnits(player.board);
const synergies = SynergySystem.getActiveSynergies(deployedUnits);
console.log(`Active synergies: ${synergies.length}`);

// Combat Phase
const playerCombatUnits = createCombatUnits(deployedUnits);
const enemyTeam = AISystem.generateEnemyTeam(player.round, 50, 'MEDIUM', false);
const enemyCombatUnits = createCombatUnits(enemyTeam);

// Apply synergies
SynergySystem.applySynergyBonusesToTeam(playerCombatUnits, "LEFT");
SynergySystem.applySynergyBonusesToTeam(enemyCombatUnits, "RIGHT");

// Initialize combat
const combatState = CombatSystem.initializeCombat(playerCombatUnits, enemyCombatUnits);

// Combat loop
while (!combatState.isFinished) {
  const actor = CombatSystem.getNextActor(combatState);
  if (!actor) break;
  
  const actionResult = CombatSystem.executeAction(combatState, actor);
  if (actionResult.success && actionResult.useSkill) {
    const target = AISystem.selectTarget(actor, combatState, 'MEDIUM');
    if (target) {
      const skillResult = CombatSystem.executeSkill(actor, actor.skill, [target], combatState);
      // ... apply skill effects
    }
  }
  
  const endResult = CombatSystem.checkCombatEnd(combatState);
  if (endResult.isFinished) {
    console.log(`Combat ended: ${endResult.winner} wins!`);
    break;
  }
}
```

---

## Summary

This documentation covers all public interfaces for the six core systems:

1. **BoardSystem**: Board management and unit placement
2. **ShopSystem**: Shop operations (refresh, buy, sell, lock)
3. **CombatSystem**: Combat logic (turn order, skills, damage)
4. **UpgradeSystem**: Unit upgrades and combinations
5. **SynergySystem**: Synergy calculation and application
6. **AISystem**: Enemy generation and AI decisions

Each system is:
- **Independent**: No dependencies on other systems
- **Testable**: Pure functions where possible
- **Well-documented**: JSDoc comments and usage examples
- **Error-safe**: Consistent error handling patterns

For implementation details, refer to the source files in `game/src/systems/`.
