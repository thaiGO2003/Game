# Architecture Documentation

## Overview

This document describes the layered architecture of the Phaser 3 game codebase after the refactoring process. The architecture is organized into 6 distinct layers, each with clear responsibilities and dependencies.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Game Modes Layer                         │
│  (Defines different game modes and their configurations)    │
│                                                              │
│  • PVEJourneyMode  • EndlessMode  • PVPMode (future)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      Scene Layer                            │
│         (Phaser scenes - orchestration only)                │
│                                                              │
│  • LoadingScene  • MainMenuScene                            │
│  • PlanningScene • CombatScene                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Systems Layer                            │
│              (Business logic modules)                       │
│                                                              │
│  • BoardSystem    • ShopSystem    • CombatSystem            │
│  • UpgradeSystem  • SynergySystem • AISystem                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                 UI Components Layer                         │
│              (Reusable UI components)                       │
│                                                              │
│  • LibraryModal  • SkillPreview  • AttackPreview            │
│  • RecipeDiagram                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      Core Layer                             │
│         (Shared utilities and state management)             │
│                                                              │
│  • persistence  • spritePool  • runState  • gameRules       │
│  • gameUtils    • vfx         • audioFx   • tooltip         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│            (Static data and catalogs)                       │
│                                                              │
│  • unitCatalog  • skills      • items     • synergies       │
│  • augments     • unitVisuals • CSV files                   │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Game Modes Layer

**Location:** `src/gameModes/`

**Purpose:** Defines different game modes with their unique rules, configurations, and behaviors.

**Responsibilities:**
- Define game mode configurations (starting resources, rules, scaling)
- Specify which systems are enabled for each mode
- Configure AI difficulty and enemy scaling
- Define scene flow and progression rules
- Register game modes in the central registry

**Key Files:**
- `GameModeConfig.js` - Configuration interface and validation
- `GameModeRegistry.js` - Central registry for all game modes
- `PVEJourneyMode.js` - Standard PVE campaign mode
- `EndlessMode.js` - Endless survival mode
- `PVPMode.js` - PVP mode (future implementation)
- `README.md` - Guide for creating new game modes

**Dependencies:**
- None (top-level layer)

**Usage Example:**
```javascript
import { GameModeRegistry } from './gameModes/GameModeRegistry.js'

// Get a game mode
const mode = GameModeRegistry.get('PVE_JOURNEY')

// Start game with mode configuration
game.scene.start('MainMenuScene', { gameMode: mode })
```

**Design Principles:**
- Game modes are declarative configurations, not imperative code
- Each mode is self-contained and independent
- Modes can be added without modifying existing code
- Validation ensures all required fields are present

---

### 2. Scene Layer

**Location:** `src/scenes/`

**Purpose:** Phaser scenes that handle only lifecycle management, rendering, and orchestration.

**Responsibilities:**
- Manage Phaser scene lifecycle (create, update, init, shutdown)
- Handle user input and UI events
- Render graphics, animations, and visual effects
- Orchestrate calls to Systems layer for business logic
- Display results and errors from Systems
- Manage scene transitions

**What Scenes Should NOT Do:**
- ❌ Contain business logic calculations
- ❌ Directly manipulate game state
- ❌ Implement game rules
- ❌ Perform data validation
- ❌ Calculate damage, gold, or other game mechanics

**Key Files:**
- `LoadingScene.js` - Asset loading and initialization
- `MainMenuScene.js` - Main menu and game mode selection
- `PlanningScene.js` - Shop, board management, unit deployment
- `CombatScene.js` - Combat visualization and animation
- `BoardPrototypeScene.js` - Development/testing scene

**Dependencies:**
- Systems Layer (for business logic)
- UI Components Layer (for reusable UI)
- Core Layer (for utilities and effects)
- Data Layer (for static data)

**Usage Example:**
```javascript
// PlanningScene - orchestration only
refreshShop() {
  // Delegate to ShopSystem
  const result = ShopSystem.refreshShop(this.player, 2)
  
  if (result.success) {
    this.player = result.player  // Update state
    this.updateShopUI()          // Render changes
  } else {
    this.showError(result.error) // Display error
  }
}
```

**Design Principles:**
- Scenes are thin orchestration layers
- All business logic delegated to Systems
- Scenes handle only Phaser-specific concerns
- Pure functions preferred where possible

---

### 3. Systems Layer

**Location:** `src/systems/`

**Purpose:** Independent modules containing all business logic for specific game domains.

**Responsibilities:**
- Implement game rules and mechanics
- Perform calculations and validations
- Manage game state transformations
- Return success/error results
- Provide pure functions where possible
- Be independently testable

**Key Systems:**

#### BoardSystem
- Manages 5x5 board state
- Validates unit placement and movement
- Tracks deployed units
- Enforces deploy limits
- Calculates synergies from deployed units

#### ShopSystem
- Generates shop offers based on player level
- Handles buy/sell operations
- Manages shop refresh and locking
- Calculates tier odds (levels 1-25)
- Validates gold requirements

#### CombatSystem
- Initializes combat state
- Manages turn order based on speed
- Executes skills and basic attacks
- Calculates damage with modifiers
- Applies status effects
- Determines combat end conditions
- Logs combat events

#### UpgradeSystem
- Detects upgrade opportunities (3 matching units)
- Combines units to increase star level
- Transfers equipment between units
- Validates star level limits (max 3)
- Searches bench and board for candidates

#### SynergySystem
- Counts units by type and class
- Activates synergies at thresholds
- Applies synergy bonuses to units
- Provides synergy descriptions and icons
- Handles multiple active synergies

#### AISystem
- Generates enemy teams within budget
- Scales difficulty (EASY, MEDIUM, HARD)
- Makes tactical AI decisions
- Scales enemy strength by round
- Ensures diverse team compositions

**Dependencies:**
- Core Layer (utilities and state management)
- Data Layer (static data and catalogs)
- ❌ NO dependencies on other Systems
- ❌ NO dependencies on Phaser framework

**Usage Example:**
```javascript
// Systems use pure functions
import { BoardSystem } from '../systems/BoardSystem.js'

// Place a unit on the board
const result = BoardSystem.placeUnit(board, unit, row, col)

if (result.success) {
  board = result.board  // Updated board state
} else {
  console.error(result.error)  // Handle error
}
```

**Design Principles:**
- Systems are independent and reusable
- No Phaser dependencies (framework-agnostic)
- Pure functions preferred (no side effects)
- Clear input/output interfaces
- Comprehensive error handling
- Independently testable without mocking

---

### 4. UI Components Layer

**Location:** `src/ui/`

**Purpose:** Reusable UI components that can be used across multiple scenes.

**Responsibilities:**
- Provide reusable UI widgets
- Handle component-specific interactions
- Manage component state and lifecycle
- Render consistent UI elements
- Emit events for parent scenes

**Key Components:**

#### LibraryModal
- Displays unit encyclopedia
- Shows unit stats and abilities
- Provides search and filtering
- Handles modal open/close

#### SkillPreview
- Shows skill details and effects
- Displays skill damage and targeting
- Provides skill comparison

#### AttackPreview
- Previews attack outcomes
- Shows damage calculations
- Displays hit chance and modifiers

#### RecipeDiagram
- Shows unit upgrade paths
- Displays 3-unit combination recipes
- Visualizes star level progression

**Dependencies:**
- Core Layer (for utilities)
- Data Layer (for static data)
- May use Systems Layer for calculations

**Usage Example:**
```javascript
// Create reusable UI component
this.libraryModal = new LibraryModal(this)
this.libraryModal.show(unitId)

// Listen to component events
this.libraryModal.on('close', () => {
  this.resumeGame()
})
```

**Design Principles:**
- Components are self-contained
- Reusable across multiple scenes
- Emit events rather than direct coupling
- Consistent styling and behavior

---

### 5. Core Layer

**Location:** `src/core/`

**Purpose:** Shared utilities, state management, and effects that don't contain business logic.

**Responsibilities:**
- Provide utility functions
- Manage global game state
- Handle persistence (save/load)
- Manage sprite pooling for performance
- Provide visual and audio effects
- Handle tooltips and UI settings

**Key Modules:**

#### persistence.js
- Save game state to localStorage
- Load game state
- Handle save data migration
- Validate save data integrity

#### spritePool.js
- Pool sprites for performance
- Reuse sprites to reduce GC
- Manage sprite lifecycle

#### runState.js
- Global game state management
- Player state (gold, HP, level, units)
- Current run progress

#### gameRules.js
- Game constants and rules
- Deploy limits, gold costs
- Level caps, tier odds tables

#### gameUtils.js
- Utility functions
- Random number generation
- Array manipulation
- Math helpers

#### vfx.js
- Visual effects (particles, flashes)
- Damage numbers
- Skill effects

#### audioFx.js
- Sound effect management
- Music playback
- Volume control

#### tooltip.js
- Tooltip display system
- Hover information
- Context-sensitive help

**Dependencies:**
- Data Layer (for static data)
- ❌ NO dependencies on Systems
- ❌ NO dependencies on Scenes

**Usage Example:**
```javascript
import { persistence } from '../core/persistence.js'
import { gameUtils } from '../core/gameUtils.js'

// Save game state
persistence.saveGame(runState)

// Use utility functions
const randomUnit = gameUtils.randomChoice(units)
```

**Design Principles:**
- Utilities are pure functions where possible
- No business logic (that belongs in Systems)
- Reusable across all layers
- Performance-optimized

---

### 6. Data Layer

**Location:** `src/data/` and `data/`

**Purpose:** Static data, catalogs, and CSV parsing logic.

**Responsibilities:**
- Define unit catalog and stats
- Define skills and abilities
- Define items and equipment
- Define synergies and bonuses
- Parse CSV data files
- Provide data lookup functions
- Validate data integrity

**Key Modules:**

#### unitCatalog.js
- Unit definitions and base stats
- Unit types and classes
- CSV parsing for units.csv
- Unit lookup by ID

#### skills.js
- Skill definitions and effects
- Skill targeting rules
- CSV parsing for skills.csv
- Skill lookup by ID

#### items.js
- Item definitions and bonuses
- Equipment slots
- Item effects

#### synergies.js
- Synergy definitions
- Synergy thresholds and bonuses
- Synergy icons and descriptions

#### augments.js
- Augment definitions (future)
- Augment effects

#### unitVisuals.js
- Unit sprite information
- Animation data
- Visual effects

**Dependencies:**
- None (bottom-level layer)

**Usage Example:**
```javascript
import { UNIT_BY_ID } from '../data/unitCatalog.js'
import { SKILL_BY_ID } from '../data/skills.js'

// Look up unit data
const unitBase = UNIT_BY_ID['WARRIOR_1']

// Look up skill data
const skill = SKILL_BY_ID['SLASH']
```

**Design Principles:**
- Data is immutable (read-only)
- Data is validated on load
- CSV files are source of truth
- Efficient lookup structures (maps/objects)

---

## Dependency Rules

### Allowed Dependencies (Top to Bottom)

```
Game Modes Layer
    ↓ can use
Scene Layer
    ↓ can use
Systems Layer
    ↓ can use
UI Components Layer
    ↓ can use
Core Layer
    ↓ can use
Data Layer
```

### Forbidden Dependencies

- ❌ Systems CANNOT depend on other Systems
- ❌ Systems CANNOT depend on Scenes
- ❌ Systems CANNOT depend on Phaser framework
- ❌ Core CANNOT depend on Systems
- ❌ Data CANNOT depend on anything
- ❌ NO circular dependencies allowed

### Dependency Validation

The architecture enforces these rules through:
- Code reviews
- Automated dependency analysis
- Import statement validation
- Property-based tests

---

## Benefits of This Architecture

### 1. Testability
- Systems can be tested without Phaser
- Pure functions are easy to test
- No mocking required for system tests
- Fast test execution

### 2. Reusability
- Systems can be reused across game modes
- UI components work in any scene
- Core utilities available everywhere
- Data layer is shared

### 3. Maintainability
- Clear separation of concerns
- Easy to locate code
- Changes are localized
- Reduced coupling

### 4. Extensibility
- New game modes without code changes
- New systems can be added easily
- Scenes can be modified independently
- UI components are composable

### 5. Performance
- Systems are lightweight (no Phaser overhead)
- Sprite pooling reduces GC
- Pure functions enable optimization
- Clear performance boundaries

---

## Creating New Game Modes

To create a new game mode:

1. Create a new file in `src/gameModes/`
2. Define the configuration object
3. Register the mode in GameModeRegistry
4. Test the configuration

Example:
```javascript
// src/gameModes/MyNewMode.js
import { createGameModeConfig } from './GameModeConfig.js'
import { GameModeRegistry } from './GameModeRegistry.js'

const myNewMode = createGameModeConfig('MY_MODE', {
  name: 'My New Mode',
  description: 'A custom game mode',
  scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
  startingGold: 20,
  startingHP: 10,
  loseCondition: 'NO_HEARTS',
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: false,
    pvp: false
  },
  aiDifficulty: 'HARD',
  goldScaling: (round) => 10 + round * 2,
  enemyScaling: (round) => round * 3
})

GameModeRegistry.register(myNewMode)

export default myNewMode
```

---

## Migration Guide

### For Developers Working on Existing Code

**Before Refactor:**
```javascript
// Business logic in scene
class PlanningScene extends Phaser.Scene {
  refreshShop() {
    if (this.player.gold < 2) return
    this.player.gold -= 2
    this.player.shop = this.generateShopOffers()
    this.updateShopUI()
  }
}
```

**After Refactor:**
```javascript
// Scene delegates to system
class PlanningScene extends Phaser.Scene {
  refreshShop() {
    const result = ShopSystem.refreshShop(this.player, 2)
    if (result.success) {
      this.player = result.player
      this.updateShopUI()
    } else {
      this.showError(result.error)
    }
  }
}

// Business logic in system
export function refreshShop(player, cost) {
  if (player.gold < cost) {
    return { success: false, error: 'Not enough gold' }
  }
  
  const newPlayer = {
    ...player,
    gold: player.gold - cost,
    shop: generateShopOffers(player.level)
  }
  
  return { success: true, player: newPlayer }
}
```

### Key Changes

1. **Business logic moved to Systems**
   - Find: Logic in scenes
   - Replace: Calls to system functions

2. **Pure functions preferred**
   - Find: Methods that modify `this`
   - Replace: Functions that return new state

3. **Error handling standardized**
   - Find: Silent failures or exceptions
   - Replace: Result objects with success/error

4. **Dependencies clarified**
   - Find: Mixed concerns in one file
   - Replace: Clear layer separation

---

## File Organization

```
game/
├── src/
│   ├── gameModes/          # Game mode configurations
│   │   ├── GameModeConfig.js
│   │   ├── GameModeRegistry.js
│   │   ├── PVEJourneyMode.js
│   │   ├── EndlessMode.js
│   │   ├── PVPMode.js
│   │   └── README.md
│   │
│   ├── scenes/             # Phaser scenes (orchestration)
│   │   ├── LoadingScene.js
│   │   ├── MainMenuScene.js
│   │   ├── PlanningScene.js
│   │   └── CombatScene.js
│   │
│   ├── systems/            # Business logic systems
│   │   ├── BoardSystem.js
│   │   ├── ShopSystem.js
│   │   ├── CombatSystem.js
│   │   ├── UpgradeSystem.js
│   │   ├── SynergySystem.js
│   │   └── AISystem.js
│   │
│   ├── ui/                 # Reusable UI components
│   │   ├── LibraryModal.js
│   │   ├── SkillPreview.js
│   │   ├── AttackPreview.js
│   │   └── RecipeDiagram.js
│   │
│   ├── core/               # Shared utilities
│   │   ├── persistence.js
│   │   ├── spritePool.js
│   │   ├── runState.js
│   │   ├── gameRules.js
│   │   ├── gameUtils.js
│   │   ├── vfx.js
│   │   ├── audioFx.js
│   │   └── tooltip.js
│   │
│   ├── data/               # Static data and catalogs
│   │   ├── unitCatalog.js
│   │   ├── skills.js
│   │   ├── items.js
│   │   ├── synergies.js
│   │   ├── augments.js
│   │   └── unitVisuals.js
│   │
│   └── main.js             # Entry point
│
├── data/                   # CSV data files
│   ├── units.csv
│   └── skills.csv
│
└── tests/                  # Test files
    ├── systems/            # System unit tests
    ├── integration/        # Integration tests
    └── properties/         # Property-based tests
```

---

## Summary

This layered architecture provides:

✅ **Clear separation of concerns** - Each layer has a specific purpose  
✅ **Independent testability** - Systems can be tested without Phaser  
✅ **Reusable components** - Systems and UI work across game modes  
✅ **Extensible design** - New game modes without code changes  
✅ **Maintainable codebase** - Easy to locate and modify code  
✅ **Performance optimized** - Lightweight systems, sprite pooling  
✅ **Type-safe interfaces** - Clear contracts between layers  

The architecture supports the current game while enabling future expansion with minimal changes to existing code.
