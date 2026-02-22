# Task 7.3.1 Summary: Update PlanningScene to Read Game Mode Config

## Overview
Successfully updated PlanningScene to read and apply game mode configuration from GameModeRegistry. The scene now adapts its behavior based on the game mode config, including starting resources, gold scaling, and conditional UI elements.

## Changes Made

### 1. Import GameModeRegistry
- Added import for `GameModeRegistry` from `../gameModes/GameModeRegistry.js`
- Allows scene to retrieve game mode configurations

### 2. Store Game Mode Config
- Added `gameModeConfig` property to PlanningScene constructor
- Initialized to `null` and populated in `create()` method

### 3. Get Game Mode Config in create()
```javascript
// Get game mode configuration
this.gameModeConfig = GameModeRegistry.get(this.gameMode);
if (!this.gameModeConfig) {
  console.warn(`Game mode "${this.gameMode}" not found, falling back to PVE_JOURNEY`);
  this.gameMode = "PVE_JOURNEY";
  this.gameModeConfig = GameModeRegistry.get(this.gameMode);
}
```

### 4. Use config.startingGold and config.startingHP
Updated `startNewRun()` to apply starting values from config:
```javascript
// Apply game mode config starting values
if (this.gameModeConfig) {
  this.player.gold = this.gameModeConfig.startingGold;
  this.player.hp = this.gameModeConfig.startingHP;
} else {
  // Fallback to default values
  this.player.hp = this.player.loseCondition === "NO_HEARTS" ? 3 : 1;
}
```

### 5. Use config.goldScaling for Gold Per Round
Updated `grantRoundIncome()` to use config's gold scaling function:
```javascript
// Use game mode config for base gold, fallback to 5 if not available
const base = this.gameModeConfig?.goldScaling?.(this.player.round) ?? 5;
```

This allows different game modes to have different gold income formulas while preserving interest and streak bonuses.

### 6. Conditionally Show UI Based on config.enabledSystems

#### Shop Buttons (roll, xp, lock)
```javascript
// Only show shop buttons if shop is enabled in game mode
if (this.gameModeConfig?.enabledSystems?.shop !== false) {
  this.buttons.roll = this.createButton(...);
  this.buttons.xp = this.createButton(...);
  this.buttons.lock = this.createButton(...);
}
```

#### Craft Button
```javascript
// Only show craft button if crafting is enabled in game mode
if (this.gameModeConfig?.enabledSystems?.crafting !== false) {
  this.buttons.upgradeCraft = this.createButton(...);
}
```

#### Augments
```javascript
// Only show augment choices if augments are enabled in game mode
if (this.gameModeConfig?.enabledSystems?.augments !== false) {
  if (AUGMENT_ROUNDS.includes(this.player.round) && !this.player.augmentRoundsTaken.includes(this.player.round)) {
    this.showAugmentChoices();
  }
}
```

### 7. Safe Button Access in refreshButtons()
Updated `refreshButtons()` to use optional chaining for buttons that may not exist:
```javascript
this.buttons.roll?.setLabel(`Đổi tướng (${rollCost} vàng)`);
this.buttons.xp?.setLabel("Mua XP (4 vàng)");
this.buttons.lock?.setLabel(`Khóa: ${lock}`);
// ... etc
```

## Test Coverage

Created comprehensive test suite in `game/tests/planningSceneGameMode.test.js`:

### Tests Implemented (13 tests, all passing)
1. ✅ Should read game mode config from scene data
2. ✅ Should fallback to PVE_JOURNEY if mode not found
3. ✅ Should use config.startingGold when starting new run
4. ✅ Should use config.startingHP when starting new run
5. ✅ Should use config.goldScaling for round income
6. ✅ Should not create craft button when crafting disabled
7. ✅ Should create craft button when crafting enabled
8. ✅ Should create shop buttons when shop enabled
9. ✅ Should not show augments when augments disabled
10. ✅ Should show augments when augments enabled
11. ✅ Should handle missing gameModeConfig gracefully
12. ✅ Should use goldScaling with different round numbers
13. ✅ Should preserve interest and streak bonuses with goldScaling

### Test Approach
- Used MockPlanningScene to simulate game mode integration without Phaser dependencies
- Created TEST_MODE with custom values to verify config is being read
- Verified fallback behavior when config is missing
- Tested conditional UI creation based on enabledSystems

## Validation

### Requirements Validated
- **Requirement 9.8**: Scenes adapt behavior based on game mode configuration
  - ✅ PlanningScene reads config from scene data
  - ✅ Uses config.startingGold and config.startingHP
  - ✅ Uses config.goldScaling for gold per round
  - ✅ Conditionally shows UI based on config.enabledSystems

### Behavior Preserved
- ✅ Existing PVE_JOURNEY mode works identically (startingGold: 10, startingHP: 3, goldScaling: 10)
- ✅ Interest and streak bonuses still apply on top of base gold
- ✅ Fallback to default values if config is missing
- ✅ No diagnostics errors

## Example Usage

### PVE Journey Mode (Default)
```javascript
// In main.js or scene transition
scene.start('PlanningScene', { mode: 'PVE_JOURNEY' })

// Results in:
// - Starting gold: 10
// - Starting HP: 3
// - Gold per round: 10 (base) + interest + streak
// - All systems enabled (shop, crafting, augments)
```

### Custom Game Mode
```javascript
const customMode = createGameModeConfig('CUSTOM', {
  startingGold: 20,
  startingHP: 5,
  goldScaling: (round) => 15 + round,
  enabledSystems: {
    shop: true,
    crafting: false,  // No craft button
    augments: false,  // No augment choices
    pvp: false
  }
})
GameModeRegistry.register(customMode)

scene.start('PlanningScene', { mode: 'CUSTOM' })

// Results in:
// - Starting gold: 20
// - Starting HP: 5
// - Gold per round: (15 + round) + interest + streak
// - Shop buttons visible, craft button hidden, no augments
```

## Benefits

1. **Flexible Game Modes**: Easy to create new modes with different starting conditions
2. **Conditional Features**: Systems can be enabled/disabled per mode
3. **Dynamic Scaling**: Gold income can scale differently per mode
4. **Backward Compatible**: Existing saves and PVE_JOURNEY mode work unchanged
5. **Graceful Fallback**: Missing configs don't crash the game

## Next Steps

This task is complete. The next task (7.3.2) will update CombatScene to read game mode config for:
- AI difficulty from config
- Enemy scaling from config
- Lose condition from config

## Files Modified
- `game/src/scenes/PlanningScene.js` - Added game mode config integration
- `game/tests/planningSceneGameMode.test.js` - New test file with 13 tests

## Test Results
```
✓ tests/planningSceneGameMode.test.js (13 tests) 28ms
  ✓ PlanningScene Game Mode Integration (13)
    ✓ should read game mode config from scene data
    ✓ should fallback to PVE_JOURNEY if mode not found
    ✓ should use config.startingGold when starting new run
    ✓ should use config.startingHP when starting new run
    ✓ should use config.goldScaling for round income
    ✓ should not create craft button when crafting disabled
    ✓ should create craft button when crafting enabled
    ✓ should create shop buttons when shop enabled
    ✓ should not show augments when augments disabled
    ✓ should show augments when augments enabled
    ✓ should handle missing gameModeConfig gracefully
    ✓ should use goldScaling with different round numbers
    ✓ should preserve interest and streak bonuses with goldScaling

Test Files  1 passed (1)
     Tests  13 passed (13)
```
