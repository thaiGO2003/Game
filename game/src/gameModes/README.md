# Game Modes Documentation

This directory contains the game mode system, which allows you to create different game modes with unique rules, difficulty settings, and progression systems.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Step-by-Step Guide](#step-by-step-guide)
- [Configuration Options](#configuration-options)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Using Game Modes in Your Application](#using-game-modes-in-your-application)
- [Validation and Error Handling](#validation-and-error-handling)
- [Integration with Game Systems](#integration-with-game-systems)
- [Testing Game Modes](#testing-game-modes)
- [Performance Considerations](#performance-considerations)
- [Migration Guide](#migration-guide)
- [Quick Reference](#quick-reference)

## Overview

The game mode system provides a flexible way to create different gameplay experiences by configuring:
- Starting resources (gold, HP)
- Win/lose conditions
- AI difficulty
- Enabled systems (shop, crafting, augments, PVP)
- Progression scaling (gold per round, enemy strength)
- Scene flow

Each game mode is defined by a `GameModeConfig` object that specifies all these parameters.

## Quick Start

Here's the minimal code to create a new game mode:

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

const MyMode = createGameModeConfig('MY_MODE', {
  name: 'My Custom Mode',
  description: 'A brief description of what makes this mode unique',
  startingGold: 10,
  startingHP: 3,
  aiDifficulty: AI_DIFFICULTY.MEDIUM
})

GameModeRegistry.register(MyMode)

export default MyMode
```

That's it! Your game mode is now registered and ready to use.

## Step-by-Step Guide

### Step 1: Create a New File

Create a new file in `src/gameModes/` with a descriptive name:

```
src/gameModes/MyCustomMode.js
```

### Step 2: Import Required Dependencies

At the top of your file, import the necessary functions and enums:

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'
```

### Step 3: Define Your Configuration

Use `createGameModeConfig()` to create your game mode configuration. The first parameter is a unique ID (use UPPER_SNAKE_CASE), and the second is your configuration object:

```javascript
const MyCustomMode = createGameModeConfig('MY_CUSTOM_MODE', {
  // Your configuration here
})
```

### Step 4: Configure Basic Properties

Set the display name and description:

```javascript
const MyCustomMode = createGameModeConfig('MY_CUSTOM_MODE', {
  name: 'My Custom Mode',
  description: 'A detailed description that explains what makes this mode unique and interesting to players.',
  
  // More config...
})
```

### Step 5: Set Starting Resources

Define how much gold and HP players start with:

```javascript
const MyCustomMode = createGameModeConfig('MY_CUSTOM_MODE', {
  name: 'My Custom Mode',
  description: '...',
  
  startingGold: 15,  // Players start with 15 gold
  startingHP: 5,     // Players start with 5 HP/hearts
  
  // More config...
})
```

### Step 6: Configure Game Rules

Set the lose condition and AI difficulty:

```javascript
const MyCustomMode = createGameModeConfig('MY_CUSTOM_MODE', {
  name: 'My Custom Mode',
  description: '...',
  startingGold: 15,
  startingHP: 5,
  
  loseCondition: LOSE_CONDITION.NO_HEARTS,  // Lose when HP reaches 0
  aiDifficulty: AI_DIFFICULTY.HARD,         // Face hard AI opponents
  
  // More config...
})
```

### Step 7: Enable/Disable Systems

Choose which game systems are available in your mode:

```javascript
const MyCustomMode = createGameModeConfig('MY_CUSTOM_MODE', {
  name: 'My Custom Mode',
  description: '...',
  startingGold: 15,
  startingHP: 5,
  loseCondition: LOSE_CONDITION.NO_HEARTS,
  aiDifficulty: AI_DIFFICULTY.HARD,
  
  enabledSystems: {
    shop: true,      // Shop is available
    crafting: true,  // Crafting is available
    augments: true,  // Augments are available
    pvp: false       // PVP is not available
  },
  
  // More config...
})
```

### Step 8: Define Scaling Functions

Create functions that determine how gold and enemy strength scale with round number:

```javascript
const MyCustomMode = createGameModeConfig('MY_CUSTOM_MODE', {
  name: 'My Custom Mode',
  description: '...',
  startingGold: 15,
  startingHP: 5,
  loseCondition: LOSE_CONDITION.NO_HEARTS,
  aiDifficulty: AI_DIFFICULTY.HARD,
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: true,
    pvp: false
  },
  
  // Gold scaling: how much gold players get per round
  goldScaling: (round) => {
    return 10 + Math.floor(round * 1.5)
    // Round 1: 11 gold, Round 2: 13 gold, Round 3: 14 gold, etc.
  },
  
  // Enemy scaling: multiplier for enemy strength
  enemyScaling: (round) => {
    return Math.floor(round * 2)
    // Round 1: 2x, Round 2: 4x, Round 3: 6x, etc.
  }
})
```

### Step 9: Register Your Mode

Register your game mode so it can be used:

```javascript
GameModeRegistry.register(MyCustomMode)
```

### Step 10: Export Your Mode

Export your mode so it can be imported elsewhere:

```javascript
export default MyCustomMode
```

### Step 11: Complete Example

Here's what your complete file should look like:

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

const MyCustomMode = createGameModeConfig('MY_CUSTOM_MODE', {
  name: 'My Custom Mode',
  description: 'A challenging mode with aggressive scaling and hard AI opponents.',
  
  startingGold: 15,
  startingHP: 5,
  
  loseCondition: LOSE_CONDITION.NO_HEARTS,
  aiDifficulty: AI_DIFFICULTY.HARD,
  
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: true,
    pvp: false
  },
  
  goldScaling: (round) => 10 + Math.floor(round * 1.5),
  enemyScaling: (round) => Math.floor(round * 2)
})

GameModeRegistry.register(MyCustomMode)

export default MyCustomMode
```

## Configuration Options

### Required Options

These options must be provided (though `createGameModeConfig` provides defaults):

| Option | Type | Description |
|--------|------|-------------|
| `id` | `string` | Unique identifier (first parameter to `createGameModeConfig`) |
| `name` | `string` | Display name shown to players |
| `description` | `string` | Description of the game mode |

### Optional Options (with defaults)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scenes` | `string[]` | `['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene']` | Array of scene names to use |
| `startingGold` | `number` | `10` | Initial gold amount (must be >= 0) |
| `startingHP` | `number` | `3` | Initial HP/hearts (must be > 0) |
| `loseCondition` | `string` | `LOSE_CONDITION.NO_HEARTS` | When the player loses |
| `enabledSystems` | `object` | See below | Which systems are enabled |
| `aiDifficulty` | `string` | `AI_DIFFICULTY.MEDIUM` | AI opponent difficulty |
| `goldScaling` | `function` | `(round) => 10` | Gold per round function |
| `enemyScaling` | `function` | `(round) => round` | Enemy strength multiplier function |

### Enabled Systems Default

```javascript
{
  shop: true,
  crafting: true,
  augments: true,
  pvp: false
}
```

### Lose Condition Options

```javascript
LOSE_CONDITION.NO_HEARTS     // Lose when HP reaches 0 (default)
LOSE_CONDITION.SINGLE_LOSS   // Lose on first combat defeat
LOSE_CONDITION.TIME_LIMIT    // Lose when time runs out
```

### AI Difficulty Options

```javascript
AI_DIFFICULTY.EASY    // Easier AI opponents
AI_DIFFICULTY.MEDIUM  // Standard AI opponents (default)
AI_DIFFICULTY.HARD    // Challenging AI opponents
```

## Examples

### Example 1: Easy Mode for Beginners

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

const EasyMode = createGameModeConfig('EASY_MODE', {
  name: 'Easy Mode',
  description: 'Perfect for learning the game. Start with extra resources and face easier opponents.',
  
  // Extra starting resources
  startingGold: 20,
  startingHP: 10,
  
  // Easy AI
  aiDifficulty: AI_DIFFICULTY.EASY,
  
  // Generous gold scaling
  goldScaling: (round) => 15 + round,
  
  // Gentle enemy scaling
  enemyScaling: (round) => Math.floor(round * 0.8)
})

GameModeRegistry.register(EasyMode)
export default EasyMode
```

### Example 2: Speed Run Mode

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

const SpeedRunMode = createGameModeConfig('SPEED_RUN', {
  name: 'Speed Run',
  description: 'Race against time! You have one life - make it count.',
  
  // Standard starting resources
  startingGold: 10,
  startingHP: 1,  // Only 1 HP!
  
  // Lose on first defeat
  loseCondition: LOSE_CONDITION.SINGLE_LOSS,
  
  // Hard AI for challenge
  aiDifficulty: AI_DIFFICULTY.HARD,
  
  // Lots of gold to build quickly
  goldScaling: (round) => 20 + round * 2,
  
  // Fast enemy scaling
  enemyScaling: (round) => Math.floor(round * 3)
})

GameModeRegistry.register(SpeedRunMode)
export default SpeedRunMode
```

### Example 3: Crafting-Only Mode

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

const CraftingOnlyMode = createGameModeConfig('CRAFTING_ONLY', {
  name: 'Crafting Challenge',
  description: 'No shop! Build your team entirely through crafting and augments.',
  
  startingGold: 50,  // Extra gold since no shop
  startingHP: 5,
  
  // Disable shop, enable crafting and augments
  enabledSystems: {
    shop: false,      // No shop!
    crafting: true,   // Crafting is key
    augments: true,   // Augments available
    pvp: false
  },
  
  aiDifficulty: AI_DIFFICULTY.MEDIUM,
  
  // More gold since shop is disabled
  goldScaling: (round) => 20 + round * 2,
  
  enemyScaling: (round) => round
})

GameModeRegistry.register(CraftingOnlyMode)
export default CraftingOnlyMode
```

### Example 4: Exponential Scaling Mode

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

const ExponentialMode = createGameModeConfig('EXPONENTIAL', {
  name: 'Exponential Chaos',
  description: 'Everything scales exponentially. How long can you survive?',
  
  startingGold: 25,
  startingHP: 10,
  
  aiDifficulty: AI_DIFFICULTY.HARD,
  
  // Exponential gold scaling
  goldScaling: (round) => {
    return Math.floor(10 * Math.pow(1.2, round))
    // Round 1: 12, Round 2: 14, Round 3: 17, Round 5: 24, Round 10: 61
  },
  
  // Exponential enemy scaling
  enemyScaling: (round) => {
    return Math.floor(Math.pow(1.5, round))
    // Round 1: 1, Round 2: 2, Round 3: 3, Round 5: 7, Round 10: 57
  }
})

GameModeRegistry.register(ExponentialMode)
export default ExponentialMode
```

## Best Practices

### 1. Choose a Descriptive ID

Use UPPER_SNAKE_CASE for IDs and make them descriptive:

```javascript
// Good
'ENDLESS_MODE'
'SPEED_RUN'
'CRAFTING_ONLY'

// Bad
'mode1'
'test'
'new'
```

### 2. Write Clear Descriptions

Help players understand what makes your mode unique:

```javascript
// Good
description: 'Survive as long as possible against increasingly difficult enemies. Start with more resources but face aggressive scaling and HARD AI opponents.'

// Bad
description: 'Hard mode'
```

### 3. Balance Starting Resources with Difficulty

If you increase difficulty, consider giving players more starting resources:

```javascript
// Balanced: Hard AI but extra resources
{
  startingGold: 15,
  startingHP: 5,
  aiDifficulty: AI_DIFFICULTY.HARD
}
```

### 4. Test Your Scaling Functions

Make sure your scaling functions return reasonable values:

```javascript
// Test your functions
goldScaling: (round) => {
  const gold = 10 + Math.floor(round * 1.5)
  console.log(`Round ${round}: ${gold} gold`)
  return gold
}
```

### 5. Consider the Player Experience

Think about what makes your mode fun and unique:

- **Too Easy**: Players get bored
- **Too Hard**: Players get frustrated
- **Just Right**: Players feel challenged but capable

### 6. Use Comments to Explain Your Choices

```javascript
// Aggressive gold scaling to help players keep up with enemy strength
goldScaling: (round) => 10 + Math.floor(round * 2),

// Exponential enemy scaling creates increasing pressure
enemyScaling: (round) => Math.floor(Math.pow(1.3, round))
```

### 7. Validate Your Configuration

The system automatically validates your config, but you can manually check:

```javascript
import { validateGameModeConfig } from './GameModeConfig.js'

const result = validateGameModeConfig(MyMode)
if (!result.valid) {
  console.error('Invalid config:', result.errors)
}
```

## Testing Your Game Mode

### 1. Import Your Mode

In your main game file or test file, import your mode:

```javascript
import MyCustomMode from './gameModes/MyCustomMode.js'
```

### 2. Verify Registration

Check that your mode is registered:

```javascript
import GameModeRegistry from './gameModes/GameModeRegistry.js'

const mode = GameModeRegistry.get('MY_CUSTOM_MODE')
console.log('Mode registered:', mode.name)
```

### 3. Test in Game

Start the game with your mode:

```javascript
// In your scene initialization
const gameMode = GameModeRegistry.get('MY_CUSTOM_MODE')
this.scene.start('PlanningScene', { gameMode })
```

### 4. Verify Scaling

Test that your scaling functions work as expected:

```javascript
// Test gold scaling
for (let round = 1; round <= 10; round++) {
  const gold = MyCustomMode.goldScaling(round)
  console.log(`Round ${round}: ${gold} gold`)
}

// Test enemy scaling
for (let round = 1; round <= 10; round++) {
  const strength = MyCustomMode.enemyScaling(round)
  console.log(`Round ${round}: ${strength}x enemy strength`)
}
```

### 5. Playtest

The most important test is actually playing your mode:

- Does it feel balanced?
- Is it fun?
- Is the difficulty curve appropriate?
- Do the starting resources feel right?
- Does the scaling feel fair?

## Advanced Topics

### Custom Scene Flow

You can specify a custom scene flow:

```javascript
scenes: ['LoadingScene', 'CustomMenuScene', 'PlanningScene', 'CustomCombatScene']
```

Note: Custom scenes must be implemented separately.

### Dynamic Scaling

Create more complex scaling functions:

```javascript
goldScaling: (round) => {
  // Different scaling for early, mid, and late game
  if (round <= 5) {
    return 10 + round  // Early game: linear
  } else if (round <= 15) {
    return 15 + round * 2  // Mid game: faster
  } else {
    return 45 + round * 3  // Late game: very fast
  }
}
```

### Conditional System Enabling

You can enable/disable systems based on your mode's theme:

```javascript
// Minimalist mode: only shop
enabledSystems: {
  shop: true,
  crafting: false,
  augments: false,
  pvp: false
}

// Everything mode: all systems
enabledSystems: {
  shop: true,
  crafting: true,
  augments: true,
  pvp: true  // If implemented
}
```

## Troubleshooting

### "Invalid config" Error

Check the validation errors:

```javascript
const result = validateGameModeConfig(MyMode)
console.log(result.errors)
```

Common issues:
- Missing required fields (id, name, description)
- Negative numbers for startingGold or startingHP
- Invalid lose condition or AI difficulty
- Scaling functions that don't return numbers

### Mode Not Appearing

Make sure you:
1. Called `GameModeRegistry.register(MyMode)`
2. Imported your mode file somewhere in your app
3. Used a unique ID

### Scaling Feels Wrong

Test your scaling functions with different round numbers:

```javascript
// Print scaling for rounds 1-20
for (let i = 1; i <= 20; i++) {
  console.log(`Round ${i}: Gold=${MyMode.goldScaling(i)}, Enemy=${MyMode.enemyScaling(i)}`)
}
```

## Reference

### Complete Configuration Template

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

const MyMode = createGameModeConfig('MY_MODE_ID', {
  // Display information
  name: 'My Mode Name',
  description: 'Detailed description of what makes this mode unique',
  
  // Scene configuration
  scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
  
  // Starting resources
  startingGold: 10,
  startingHP: 3,
  
  // Game rules
  loseCondition: LOSE_CONDITION.NO_HEARTS,
  
  // Systems
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: true,
    pvp: false
  },
  
  // AI configuration
  aiDifficulty: AI_DIFFICULTY.MEDIUM,
  
  // Scaling functions
  goldScaling: (round) => 10,
  enemyScaling: (round) => round
})

GameModeRegistry.register(MyMode)

export default MyMode
```

## Using Game Modes in Your Application

### Starting a Game with a Specific Mode

To start a game with a specific game mode, retrieve it from the registry and pass it to your scenes:

```javascript
import GameModeRegistry from './gameModes/GameModeRegistry.js'

// In your main game initialization or menu scene
const gameMode = GameModeRegistry.get('PVE_JOURNEY')

// Start the game with this mode
this.scene.start('PlanningScene', { gameMode })
```

### Accessing Mode Configuration in Scenes

In your Phaser scenes, access the game mode configuration from the scene data:

```javascript
class PlanningScene extends Phaser.Scene {
  init(data) {
    this.gameMode = data.gameMode
    
    // Use the configuration
    this.player.gold = this.gameMode.startingGold
    this.player.hp = this.gameMode.startingHP
    
    // Check which systems are enabled
    if (this.gameMode.enabledSystems.shop) {
      this.initializeShop()
    }
    
    if (this.gameMode.enabledSystems.crafting) {
      this.initializeCrafting()
    }
  }
  
  calculateRoundGold(round) {
    // Use the mode's gold scaling function
    return this.gameMode.goldScaling(round)
  }
}
```

### Listing Available Modes

To show players all available game modes (e.g., in a menu):

```javascript
import GameModeRegistry from './gameModes/GameModeRegistry.js'

// Get all registered modes
const allModes = GameModeRegistry.getAll()

// Display them in your UI
allModes.forEach(mode => {
  console.log(`${mode.name}: ${mode.description}`)
  // Create UI buttons, menu items, etc.
})
```

### Checking if a Mode Exists

Before using a mode, you can check if it's registered:

```javascript
import GameModeRegistry from './gameModes/GameModeRegistry.js'

if (GameModeRegistry.has('ENDLESS')) {
  const endlessMode = GameModeRegistry.get('ENDLESS')
  // Use the mode
} else {
  console.warn('Endless mode not available')
}
```

## Validation and Error Handling

### Automatic Validation

When you register a game mode, it's automatically validated:

```javascript
const result = GameModeRegistry.register(MyMode)

if (!result.success) {
  console.error('Failed to register mode:', result.error)
  // Handle the error appropriately
}
```

### Manual Validation

You can validate a configuration before registering:

```javascript
import { validateGameModeConfig } from './GameModeConfig.js'

const validation = validateGameModeConfig(MyMode)

if (!validation.valid) {
  console.error('Configuration errors:')
  validation.errors.forEach(error => {
    console.error(`  - ${error}`)
  })
} else {
  GameModeRegistry.register(MyMode)
}
```

### Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "id is required" | Missing or empty ID | Provide a non-empty string as first parameter |
| "name is required" | Missing or empty name | Add a `name` property to config |
| "startingGold must be >= 0" | Negative starting gold | Use 0 or positive number |
| "startingHP must be > 0" | Zero or negative HP | Use positive number |
| "scenes array must not be empty" | Empty scenes array | Provide at least one scene name |
| "goldScaling must be a function" | Not a function | Provide a function: `(round) => number` |
| "goldScaling must return a non-negative number" | Function returns negative | Ensure function always returns >= 0 |
| "aiDifficulty must be one of: EASY, MEDIUM, HARD" | Invalid difficulty | Use `AI_DIFFICULTY.EASY/MEDIUM/HARD` |

## Integration with Game Systems

### Shop System Integration

The shop system respects the `enabledSystems.shop` flag:

```javascript
// In your planning scene
if (this.gameMode.enabledSystems.shop) {
  // Initialize and show shop UI
  this.shopSystem = new ShopSystem()
  this.showShopUI()
} else {
  // Hide shop UI or show alternative
  this.hideShopUI()
}
```

### AI System Integration

The AI system uses the mode's difficulty and scaling:

```javascript
// In your combat scene
import { AISystem } from '../systems/AISystem.js'

// Generate enemies based on mode configuration
const enemyStrength = this.gameMode.enemyScaling(this.currentRound)
const enemies = AISystem.generateEnemyTeam(
  this.currentRound,
  enemyStrength,
  this.gameMode.aiDifficulty
)
```

### Lose Condition Integration

Check the lose condition to determine when the game ends:

```javascript
// After combat
if (this.player.hp <= 0) {
  if (this.gameMode.loseCondition === LOSE_CONDITION.NO_HEARTS) {
    this.gameOver()
  }
}

// Or for single loss mode
if (combatResult.winner === 'enemy') {
  if (this.gameMode.loseCondition === LOSE_CONDITION.SINGLE_LOSS) {
    this.gameOver()
  }
}
```

## Testing Game Modes

### Unit Testing

Create tests for your game mode configuration:

```javascript
import { describe, it, expect } from 'vitest'
import MyCustomMode from '../src/gameModes/MyCustomMode.js'
import { validateGameModeConfig } from '../src/gameModes/GameModeConfig.js'

describe('MyCustomMode', () => {
  it('should have valid configuration', () => {
    const validation = validateGameModeConfig(MyCustomMode)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })
  
  it('should have correct starting resources', () => {
    expect(MyCustomMode.startingGold).toBe(15)
    expect(MyCustomMode.startingHP).toBe(5)
  })
  
  it('should scale gold correctly', () => {
    expect(MyCustomMode.goldScaling(1)).toBe(11)
    expect(MyCustomMode.goldScaling(5)).toBe(17)
    expect(MyCustomMode.goldScaling(10)).toBe(25)
  })
  
  it('should scale enemies correctly', () => {
    expect(MyCustomMode.enemyScaling(1)).toBe(2)
    expect(MyCustomMode.enemyScaling(5)).toBe(10)
    expect(MyCustomMode.enemyScaling(10)).toBe(20)
  })
})
```

### Integration Testing

Test that your mode works with the game systems:

```javascript
import { describe, it, expect } from 'vitest'
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js'
import MyCustomMode from '../src/gameModes/MyCustomMode.js'

describe('MyCustomMode Integration', () => {
  it('should be registered in the registry', () => {
    expect(GameModeRegistry.has('MY_CUSTOM_MODE')).toBe(true)
  })
  
  it('should be retrievable from registry', () => {
    const mode = GameModeRegistry.get('MY_CUSTOM_MODE')
    expect(mode).toBeDefined()
    expect(mode.id).toBe('MY_CUSTOM_MODE')
    expect(mode.name).toBe('My Custom Mode')
  })
  
  it('should appear in all modes list', () => {
    const allModes = GameModeRegistry.getAll()
    const myMode = allModes.find(m => m.id === 'MY_CUSTOM_MODE')
    expect(myMode).toBeDefined()
  })
})
```

### Playtesting Checklist

When playtesting your game mode, verify:

- [ ] Starting resources feel appropriate
- [ ] AI difficulty matches expectations
- [ ] Gold scaling provides enough resources
- [ ] Enemy scaling creates appropriate challenge
- [ ] Lose condition triggers correctly
- [ ] Enabled systems work as expected
- [ ] Disabled systems are properly hidden
- [ ] Mode is fun and engaging
- [ ] Difficulty curve feels balanced
- [ ] Mode description accurately describes gameplay

## Performance Considerations

### Scaling Function Performance

Your scaling functions are called frequently, so keep them efficient:

```javascript
// Good: Simple calculation
goldScaling: (round) => 10 + round * 2

// Good: Cached complex calculation
const scalingCache = new Map()
goldScaling: (round) => {
  if (!scalingCache.has(round)) {
    scalingCache.set(round, complexCalculation(round))
  }
  return scalingCache.get(round)
}

// Bad: Expensive calculation every time
goldScaling: (round) => {
  let result = 0
  for (let i = 0; i < round * 1000; i++) {
    result += Math.random()
  }
  return result
}
```

### Memory Management

Game mode configurations are kept in memory, so:

- Keep descriptions concise
- Avoid storing large data structures in the config
- Use functions to generate data on-demand rather than storing it

## Migration Guide

### Updating Existing Code to Use Game Modes

If you have existing code that doesn't use game modes, here's how to migrate:

#### Before (Hardcoded Values)

```javascript
class PlanningScene extends Phaser.Scene {
  create() {
    this.player.gold = 10  // Hardcoded
    this.player.hp = 3     // Hardcoded
  }
  
  getRoundGold(round) {
    return 10  // Hardcoded
  }
}
```

#### After (Using Game Mode)

```javascript
class PlanningScene extends Phaser.Scene {
  init(data) {
    this.gameMode = data.gameMode || GameModeRegistry.get('PVE_JOURNEY')
  }
  
  create() {
    this.player.gold = this.gameMode.startingGold
    this.player.hp = this.gameMode.startingHP
  }
  
  getRoundGold(round) {
    return this.gameMode.goldScaling(round)
  }
}
```

## Need Help?

- Check existing modes (PVEJourneyMode.js, EndlessMode.js) for examples
- Review GameModeConfig.js for detailed JSDoc comments
- Test your configuration with `validateGameModeConfig()`
- Start simple and iterate based on playtesting
- Look at the test files in `tests/gameModeConfig.test.js` and `tests/gameModeRegistry.test.js` for testing examples

## Quick Reference

### File Structure

```
src/gameModes/
├── GameModeConfig.js      # Core configuration interface and validation
├── GameModeRegistry.js    # Registry for managing modes
├── PVEJourneyMode.js      # Default PVE mode
├── EndlessMode.js         # Endless challenge mode
├── PVPMode.js             # PVP mode (stub)
├── README.md              # This file
└── YourMode.js            # Your custom mode
```

### Essential Imports

```javascript
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'
```

### Minimal Mode Template

```javascript
const MyMode = createGameModeConfig('MY_MODE', {
  name: 'My Mode',
  description: 'Description here'
})

GameModeRegistry.register(MyMode)
export default MyMode
```

### Full Mode Template

```javascript
const MyMode = createGameModeConfig('MY_MODE', {
  name: 'My Mode',
  description: 'Description here',
  startingGold: 10,
  startingHP: 3,
  loseCondition: LOSE_CONDITION.NO_HEARTS,
  aiDifficulty: AI_DIFFICULTY.MEDIUM,
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: true,
    pvp: false
  },
  goldScaling: (round) => 10,
  enemyScaling: (round) => round
})

GameModeRegistry.register(MyMode)
export default MyMode
```

Happy game mode creating! 🎮
