# Current Behavior and Feature List

**Date**: 2024-01-XX
**Branch**: refactor/code-architecture (created from main)
**Purpose**: Document all current game features and behaviors before refactoring

## Game Overview

This is a Phaser 3 auto-battler game where players build teams of units, manage resources, and battle AI opponents through progressive rounds.

## Core Game Loop

1. **Main Menu** → Player starts game
2. **Planning Phase** → Player manages shop, buys units, deploys units, upgrades units
3. **Combat Phase** → Auto-battle between player team and AI enemy team
4. **Results** → Victory/defeat, gold rewards, HP changes
5. **Next Round** → Return to planning phase with increased difficulty

## Feature List

### 1. Shop System
- **Shop Refresh**: Costs 2 gold, generates new unit offers based on player level
- **Tier Odds**: Unit tier probability changes with player level (1-25)
- **Buy Unit**: Purchase units from shop slots, costs vary by tier
- **Sell Unit**: Sell owned units for gold (sell value based on tier and star level)
- **Shop Lock**: Lock shop to preserve offers across rounds
- **Shop Unlock**: Unlock shop to allow refreshing
- **Shop Slots**: 5 slots available for unit offers
- **Gold Management**: Track player gold, validate sufficient funds

### 2. Board System
- **5x5 Grid**: Board with 25 positions for unit placement
- **Deploy Units**: Place units from bench onto board
- **Move Units**: Drag and drop units to different positions
- **Remove Units**: Remove units from board back to bench
- **Deploy Limit**: Maximum units that can be deployed (increases with level)
- **Position Validation**: Ensure positions are within bounds and not occupied
- **Bench Management**: Store owned units not currently deployed

### 3. Unit System
- **Unit Catalog**: 100 units across 5 tiers and 5 roles
- **Unit Stats**: HP, attack, defense, speed, range, element
- **Star Levels**: Units can be 1-star, 2-star, or 3-star
- **Unit Upgrades**: Combine 3 identical units to increase star level
- **Auto-Upgrade**: Automatically detect and perform upgrades
- **Equipment**: Units can have equipment that modifies stats
- **Equipment Transfer**: Equipment transfers to upgraded unit
- **Unique IDs**: Each owned unit has a unique uid

### 4. Synergy System
- **Type Synergies**: Bonuses for having multiple units of same type (Beast, Undead, etc.)
- **Class Synergies**: Bonuses for having multiple units of same class (Warrior, Mage, etc.)
- **Synergy Thresholds**: Activate at 2, 4, 6 units of same type/class
- **Synergy Bonuses**: Stat increases, special abilities, damage modifiers
- **Synergy Display**: Show active synergies in UI
- **Synergy Application**: Apply bonuses to all units in combat

### 5. Combat System
- **Turn-Based Combat**: Units take turns based on speed stat
- **Turn Order**: Calculated at combat start, sorted by speed
- **Rage System**: Units gain rage on basic attacks, spend rage on skills
- **Skill Execution**: When rage >= 100, unit uses skill instead of basic attack
- **Basic Attacks**: Deal damage based on attack stat
- **Damage Calculation**: Apply attack, defense, elemental modifiers
- **HP Management**: Track currentHP, ensure HP >= 0
- **Death Handling**: Mark units as dead, remove from turn order
- **Combat End**: Detect when all units of one side are dead
- **Victory/Defeat**: Award gold on victory, lose HP on defeat
- **Combat Log**: Record all combat events for display

### 6. Status Effects System
- **Buff/Debuff**: Temporary stat modifications
- **Status Duration**: Effects last for specified number of turns
- **Status Ticking**: Decrease duration each turn
- **Status Application**: Apply effects from skills
- **Status Types**: Attack up/down, defense up/down, speed up/down, stun, poison, etc.

### 7. Skill System
- **Skill Catalog**: 100+ unique skills
- **Skill Types**: Damage, heal, buff, debuff, control
- **Skill Targeting**: Single target, AOE, random, lowest HP, etc.
- **Skill Effects**: Damage, healing, status effects, knockback
- **Skill Upgrades**: Some skills upgrade at higher star levels
- **Elemental Skills**: Skills can have elemental types (fire, water, earth, air, light, dark)
- **Skill Descriptions**: Display skill effects in UI

### 8. AI System
- **Enemy Generation**: Generate enemy teams based on round number
- **Budget System**: AI has budget to spend on units
- **Difficulty Scaling**: Enemy stats scale with difficulty (EASY, MEDIUM, HARD)
- **Round Scaling**: Enemy strength increases with round number
- **AI Decisions**: AI selects targets and uses skills tactically
- **Team Diversity**: AI generates varied team compositions

### 9. Progression System
- **Player Level**: Increases each round (1-25)
- **Deploy Limit**: Increases with level (starts at 3, max 10)
- **Gold Per Round**: Base gold awarded each round
- **HP System**: Player has HP, loses HP on defeat, game over at 0 HP
- **Round Counter**: Track current round number
- **Difficulty Curve**: Game gets harder each round

### 10. UI Components
- **Shop UI**: Display shop offers, prices, buy/sell buttons
- **Board UI**: Visual grid for unit placement
- **Bench UI**: Display owned units not on board
- **Synergy Display**: Show active synergies and thresholds
- **Combat UI**: Show unit HP, rage, status effects
- **Combat Log**: Display combat events
- **Library/Encyclopedia**: Browse all units and skills
- **Skill Preview**: Show skill details on hover
- **Attack Preview**: Show attack range and targets
- **Recipe Diagram**: Show unit upgrade paths
- **Stat Display**: Show unit stats in various contexts
- **Animation Preview**: Preview unit animations

### 11. Persistence System
- **Save Game**: Save player state to localStorage
- **Load Game**: Load saved game state
- **Auto-Save**: Automatically save after each round
- **Save Format**: JSON format with player state, units, round, etc.
- **Backward Compatibility**: Load saves from previous versions

### 12. Visual Effects
- **Sprite Pool**: Reuse sprites for performance
- **Damage Numbers**: Display damage dealt in combat
- **Skill Animations**: Visual effects for skills
- **Status Effect Icons**: Display status effects on units
- **Combat Speed**: Adjustable combat animation speed
- **Knockback Effects**: Visual knockback on certain skills

### 13. Audio System
- **Sound Effects**: Play sounds for actions (buy, sell, attack, skill)
- **Background Music**: Play music during different scenes
- **Volume Control**: Adjust sound and music volume

### 14. Data Management
- **CSV Parsing**: Load units and skills from CSV files
- **Unit Catalog**: Central registry of all unit data
- **Skill Catalog**: Central registry of all skill data
- **Item Catalog**: Central registry of equipment data
- **Synergy Definitions**: Define synergy rules and bonuses

### 15. Elemental System
- **Elemental Types**: Fire, Water, Earth, Air, Light, Dark
- **Elemental Advantages**: Damage bonuses for advantageous matchups
- **Elemental Counters**: Damage penalties for disadvantageous matchups
- **Elemental Display**: Show elemental types in UI
- **Elemental Logging**: Log elemental interactions in combat

### 16. Evasion System
- **Evasion Stat**: Units can have evasion chance
- **Hit Chance**: Calculate hit chance based on evasion
- **Miss Handling**: Attacks can miss based on evasion
- **Evasion Buffs/Debuffs**: Temporary evasion modifications

### 17. Special Mechanics
- **Knockback**: Some skills push units back
- **Rage Overflow**: Handle rage values > 100
- **Missing Skills**: Handle units with invalid skill references
- **Error Recovery**: Graceful handling of data errors
- **Level Cap**: Enforce maximum level of 25
- **Star Cap**: Enforce maximum star level of 3

## Current Code Organization

### Scene Structure
- **LoadingScene**: Load assets and initialize game
- **MainMenuScene**: Main menu UI and game start
- **PlanningScene**: Shop, board, bench, unit management (largest scene, ~2000+ lines)
- **CombatScene**: Combat execution and animation (large scene, ~1500+ lines)

### Core Systems
- **persistence.js**: Save/load functionality
- **spritePool.js**: Sprite reuse for performance
- **runState.js**: Global game state management
- **gameRules.js**: Game constants and rules
- **vfx.js**: Visual effects utilities
- **audioFx.js**: Audio playback utilities

### Data Layer
- **unitCatalog.js**: Unit data and CSV parsing
- **skills.js**: Skill definitions
- **items.js**: Equipment definitions
- **synergies.js**: Synergy rules
- **unitVisuals.js**: Unit sprite and animation data

### UI Components
- **LibraryModal.js**: Encyclopedia/wiki modal
- **SkillPreview.js**: Skill tooltip component
- **AttackPreview.js**: Attack range preview
- **RecipeDiagram.js**: Unit upgrade tree display

## Known Issues (from baseline metrics)

1. **Duplicate Emoji**: 🦬 used by two units (triceratops_charge, yak_highland)
2. **Unit Catalog Structure**: Some role-tier combinations have 3 units instead of 4
3. **Skill ID Mismatches**: Some tests expect different skill IDs than actual data
4. **Test Environment Issues**: Some UI tests fail due to Phaser mocking issues

## Performance Characteristics

- **Test Suite**: 917 tests, 51.48s execution time
- **Pass Rate**: 98.0% (899 passed, 18 failed)
- **Combat Performance**: Not yet benchmarked (target < 16ms per turn)
- **Shop Performance**: Not yet benchmarked (target < 50ms refresh)
- **Synergy Performance**: Not yet benchmarked (target < 10ms calculation)

## Dependencies

- **Phaser 3**: Game framework
- **Vitest**: Testing framework
- **fast-check**: Property-based testing library
- **Node.js**: Runtime for build and test scripts

## Notes

This document captures the current state of the game before the refactor begins. All features listed here must continue to work identically after the refactor is complete. This serves as a reference for:

1. **Regression Testing**: Ensure no features are lost
2. **Behavior Verification**: Confirm identical behavior after refactor
3. **Feature Completeness**: Track that all features are preserved
4. **Documentation**: Reference for understanding current implementation

**Last Updated**: 2024-01-XX
**Status**: Complete - ready for refactor to begin
