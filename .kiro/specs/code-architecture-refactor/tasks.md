# Implementation Plan: Code Architecture Refactor

## Overview

This is a major refactor to reorganize the entire Phaser 3 game codebase to support multiple game modes and create an extensible architecture. The refactor extracts business logic into independent systems, makes scenes thin orchestration layers, and establishes a clear layered architecture.

**Timeline**: 6-8 weeks  
**Phases**: 6 phases (Preparation → Extract Systems → Refactor Scenes → Game Modes → Documentation → Review)  
**Critical Constraints**: 
- Maintain 100% test pass rate after every commit
- Maintain backward compatibility with existing saves
- No functional regressions
- Performance must not degrade > 5%

## Tasks

- [x] 1. Phase 1: Preparation (1-2 days)
  - [x] 1.1 Run baseline tests and establish metrics
    - Run full test suite and verify 100% pass
    - Document current test coverage percentage
    - Run performance benchmarks for combat, shop, synergy operations
    - Document baseline metrics (combat < 16ms, shop < 50ms, synergy < 10ms)
    - _Requirements: 11.6, 12.1, 12.2, 12.3_
  
  - [x] 1.2 Create refactor branch and setup
    - Create branch: `git checkout -b refactor/code-architecture`
    - Document current behavior and feature list
    - Create rollback plan document
    - Set up performance monitoring hooks
    - _Requirements: 14.7, 19.1_
  
  - [x] 1.3 Review and add missing test coverage
    - Analyze test coverage for PlanningScene, CombatScene, MainMenuScene
    - Identify critical paths without tests
    - Add tests for shop operations (refresh, buy, sell, lock)
    - Add tests for board operations (place, move, remove)
    - Add tests for combat flow (turn order, skill execution, damage)
    - Target: >= 80% coverage before starting extraction
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 2. Checkpoint - Preparation complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 3. Phase 2: Extract Systems (2-3 weeks)
  - [ ] 3.1 Extract BoardSystem (2-3 days)
    - [x] 3.1.1 Create BoardSystem file and interface
      - Create `src/systems/BoardSystem.js`
      - Define interface: placeUnit, removeUnit, moveUnit, getUnitAt, getDeployedUnits, getDeployCount, canDeploy, isValidPosition, isPositionEmpty, calculateSynergies
      - Add JSDoc comments for all functions
      - _Requirements: 1.1, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 13.4_
    
    - [x] 3.1.2 Extract board logic from PlanningScene
      - Identify all board-related methods in PlanningScene
      - Extract placeUnit, removeUnit, moveUnit logic
      - Convert to pure functions (no `this.` references)
      - Remove Phaser dependencies from extracted code
      - _Requirements: 1.2, 1.3, 1.4, 8.1, 8.5_
    
    - [x] 3.1.3 Update PlanningScene to use BoardSystem
      - Replace direct board manipulation with BoardSystem calls
      - Update method signatures to pass board state
      - Handle success/error results from BoardSystem
      - _Requirements: 8.1, 8.6, 8.7_
    
    - [x] 3.1.4 Write unit tests for BoardSystem
      - **Property 5: Board Position Validation**
      - **Validates: Requirements 2.1, 2.2, 17.6**
      - Test placeUnit with valid/invalid positions
      - Test placeUnit with occupied positions
      - Test moveUnit validation
      - Test getUnitAt correctness
      - Test getDeployCount accuracy
      - Test canDeploy with various limits
      - Test isValidPosition boundary cases
      - _Requirements: 11.1, 11.2, 11.8_
    
    - [x] 3.1.5 Write property tests for BoardSystem
      - **Property 6: Board Query Correctness**
      - **Property 7: Deploy Count Accuracy**
      - **Property 8: Deploy Limit Enforcement**
      - **Validates: Requirements 2.4, 2.5, 2.6**
      - _Requirements: 11.2_
    
    - [x] 3.1.6 Verify and commit BoardSystem extraction
      - Run full test suite
      - Verify all tests pass
      - Manual test board operations in game
      - Commit: "Extract BoardSystem from PlanningScene"
      - _Requirements: 1.5, 14.1, 14.2, 14.3_


  - [ ] 3.2 Extract UpgradeSystem (2-3 days)
    - [x] 3.2.1 Create UpgradeSystem file and interface
      - Create `src/systems/UpgradeSystem.js`
      - Define interface: canUpgrade, upgradeUnit, findUpgradeCandidates, combineUnits, transferEquipment
      - Add JSDoc comments
      - _Requirements: 1.1, 1.6, 13.4_
    
    - [x] 3.2.2 Extract upgrade logic from PlanningScene
      - Identify upgrade detection and combination logic
      - Extract to pure functions
      - Handle 3-unit combination logic
      - Handle equipment transfer logic
      - Remove Phaser dependencies
      - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4_
    
    - [x] 3.2.3 Update PlanningScene to use UpgradeSystem
      - Replace auto-upgrade logic with UpgradeSystem calls
      - Handle upgrade results
      - Update UI after upgrades
      - _Requirements: 8.1, 8.6_
    
    - [x] 3.2.4 Write unit tests for UpgradeSystem
      - **Property 27: Upgrade Detection**
      - **Property 28: Upgrade Transformation**
      - **Property 29: Equipment Transfer on Upgrade**
      - **Property 30: No Upgrade Beyond Star 3**
      - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
      - Test canUpgrade with 3 matching units
      - Test canUpgrade with star 3 units (should fail)
      - Test combineUnits creates correct star level
      - Test equipment transfer from 3 units
      - Test findUpgradeCandidates on bench and board
      - _Requirements: 11.1, 11.2_
    
    - [x] 3.2.5 Verify and commit UpgradeSystem extraction
      - Run full test suite
      - Verify all tests pass
      - Manual test unit upgrades in game
      - Commit: "Extract UpgradeSystem from PlanningScene"
      - _Requirements: 1.5, 14.1, 14.2, 14.3_


  - [ ] 3.3 Extract SynergySystem (2-3 days)
    - [x] 3.3.1 Create SynergySystem file and interface
      - Create `src/systems/SynergySystem.js`
      - Define interface: calculateSynergies, applySynergiesToUnit, getSynergyDescription, getSynergyIcon
      - Add JSDoc comments
      - _Requirements: 1.1, 1.6, 13.4_
    
    - [x] 3.3.2 Extract synergy logic from multiple locations
      - Identify synergy calculation in PlanningScene
      - Identify synergy application in CombatScene
      - Centralize synergy counting logic (by type and class)
      - Centralize synergy threshold checking
      - Centralize synergy bonus application
      - Remove Phaser dependencies
      - _Requirements: 1.2, 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
    
    - [x] 3.3.3 Update scenes to use SynergySystem
      - Update PlanningScene to use SynergySystem.calculateSynergies
      - Update CombatScene to use SynergySystem.applySynergiesToUnit
      - Update UI to use SynergySystem for descriptions and icons
      - _Requirements: 8.1, 8.6_
    
    - [x] 3.3.4 Write unit tests for SynergySystem
      - **Property 9: Synergy Calculation Correctness**
      - **Property 31: Synergy Bonus Application**
      - **Validates: Requirements 2.7, 6.1, 6.2, 6.3, 6.6**
      - Test calculateSynergies with various team compositions
      - Test synergy threshold activation (2, 4, 6 units)
      - Test multiple synergies active simultaneously
      - Test synergy recalculation when team changes
      - Test applySynergiesToUnit cumulative bonuses
      - _Requirements: 11.1, 11.2_
    
    - [x] 3.3.5 Verify and commit SynergySystem extraction
      - Run full test suite
      - Verify all tests pass
      - Manual test synergies in game
      - Commit: "Extract SynergySystem from scenes"
      - _Requirements: 1.5, 14.1, 14.2, 14.3_


  - [ ] 3.4 Extract ShopSystem (3-4 days)
    - [x] 3.4.1 Create ShopSystem file and interface
      - Create `src/systems/ShopSystem.js`
      - Define interface: refreshShop, buyUnit, sellUnit, lockShop, unlockShop, generateShopOffers, calculateRefreshCost, getTierOdds
      - Add JSDoc comments
      - _Requirements: 1.1, 1.6, 13.4_
    
    - [x] 3.4.2 Extract shop refresh and generation logic
      - Extract refreshShop logic from PlanningScene
      - Extract generateShopOffers with tier odds calculation
      - Extract getTierOdds for levels 1-25
      - Convert to pure functions
      - Remove Phaser dependencies
      - _Requirements: 1.2, 1.3, 1.4, 3.1, 3.2, 3.8_
    
    - [x] 3.4.3 Extract buy and sell logic
      - Extract buyUnit logic with gold validation
      - Extract sellUnit logic with gold calculation
      - Handle insufficient gold errors
      - Handle shop slot management
      - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.9, 3.10_
    
    - [x] 3.4.4 Extract shop lock/unlock logic
      - Extract lockShop to preserve offers
      - Extract unlockShop logic
      - Ensure offers persist across rounds when locked
      - _Requirements: 3.7_
    
    - [x] 3.4.5 Update PlanningScene to use ShopSystem
      - Replace all shop methods with ShopSystem calls
      - Handle success/error results
      - Update shop UI based on results
      - Display error messages for insufficient gold
      - _Requirements: 8.1, 8.6, 8.7, 16.4_
    
    - [x] 3.4.6 Write unit tests for ShopSystem
      - **Property 10: Shop Refresh Deducts Gold**
      - **Property 11: Shop Offers Respect Tier Odds**
      - **Property 12: Buy Unit Deducts Cost and Adds to Bench**
      - **Property 13: Buy Unit Removes Shop Offer**
      - **Property 14: Sell Unit Adds Gold**
      - **Property 15: Shop Lock Preserves Offers**
      - **Property 16: Insufficient Gold Errors**
      - **Validates: Requirements 3.1-3.10**
      - Test refreshShop with sufficient/insufficient gold
      - Test tier odds for each level (1-25)
      - Test buyUnit success and failure cases
      - Test sellUnit gold calculation
      - Test shop lock preserves offers across rounds
      - _Requirements: 11.1, 11.2_
    
    - [x] 3.4.7 Write property tests for ShopSystem
      - Property: Gold never goes negative after operations
      - Property: Tier odds always sum to 100
      - Property: Shop offers always valid units
      - _Requirements: 11.2_
    
    - [-] 3.4.8 Verify and commit ShopSystem extraction
      - Run full test suite
      - Verify all tests pass
      - Manual test shop operations in game
      - Commit: "Extract ShopSystem from PlanningScene"
      - _Requirements: 1.5, 14.1, 14.2, 14.3_


  - [ ] 3.5 Extract AISystem (3-4 days)
    - [~] 3.5.1 Create AISystem file and interface
      - Create `src/systems/AISystem.js`
      - Define interface: generateEnemyTeam, makeAIDecision, getAIDifficultyMultiplier
      - Add JSDoc comments
      - _Requirements: 1.1, 1.6, 13.4_
    
    - [~] 3.5.2 Extract enemy team generation logic
      - Extract enemy generation from CombatScene
      - Extract budget-based team composition
      - Extract difficulty scaling logic (EASY, MEDIUM, HARD)
      - Extract round-based strength scaling
      - Remove Phaser dependencies
      - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.6_
    
    - [~] 3.5.3 Extract AI decision making logic
      - Extract AI target selection logic
      - Extract AI skill usage decisions
      - Ensure tactical decision making
      - _Requirements: 7.4_
    
    - [~] 3.5.4 Update CombatScene to use AISystem
      - Replace enemy generation with AISystem.generateEnemyTeam
      - Replace AI decisions with AISystem.makeAIDecision
      - Pass difficulty from game mode config
      - _Requirements: 8.1, 8.6_
    
    - [~] 3.5.5 Write unit tests for AISystem
      - **Property 32: AI Budget Constraint**
      - **Property 33: AI Difficulty Scaling**
      - **Property 34: AI Team Validity**
      - **Property 35: AI Strength Increases with Rounds**
      - **Validates: Requirements 7.1, 7.2, 7.3, 7.6, 7.7**
      - Test generateEnemyTeam respects budget
      - Test difficulty multipliers (EASY, MEDIUM, HARD)
      - Test team strength scales with round number
      - Test generated teams have unique uids
      - Test generated teams have valid positions
      - Test diverse team compositions
      - _Requirements: 11.1, 11.2_
    
    - [~] 3.5.6 Verify and commit AISystem extraction
      - Run full test suite
      - Verify all tests pass
      - Manual test AI opponents in game
      - Commit: "Extract AISystem from CombatScene"
      - _Requirements: 1.5, 14.1, 14.2, 14.3_


  - [ ] 3.6 Extract CombatSystem (4-5 days)
    - [~] 3.6.1 Create CombatSystem file and interface
      - Create `src/systems/CombatSystem.js`
      - Define interface: initializeCombat, getNextActor, executeAction, executeSkill, calculateDamage, applyDamage, applyStatusEffect, tickStatusEffects, checkCombatEnd
      - Add JSDoc comments
      - _Requirements: 1.1, 1.6, 13.4_
    
    - [~] 3.6.2 Extract combat initialization and turn order
      - Extract initializeCombat logic
      - Extract turn order calculation based on speed
      - Extract getNextActor logic
      - Remove Phaser dependencies
      - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 4.3_
    
    - [~] 3.6.3 Extract skill and attack execution
      - Extract executeAction logic (skill vs basic attack)
      - Extract executeSkill with target selection
      - Extract rage gain and consumption logic
      - Handle rage >= 100 for skill execution
      - Handle rage < 100 for basic attack
      - _Requirements: 4.4, 4.5_
    
    - [~] 3.6.4 Extract damage calculation and application
      - Extract calculateDamage with all modifiers
      - Apply attack, defense, elemental modifiers
      - Extract applyDamage ensuring HP >= 0
      - Handle unit death (mark dead, remove from turn order)
      - _Requirements: 4.6, 4.7, 4.8_
    
    - [~] 3.6.5 Extract status effects and combat end
      - Extract applyStatusEffect logic
      - Extract tickStatusEffects for each turn
      - Extract checkCombatEnd logic
      - Handle all player units dead (enemy victory)
      - Handle all enemy units dead (player victory)
      - Add combat event logging
      - _Requirements: 4.9, 4.10, 4.11, 4.12, 4.13_
    
    - [~] 3.6.6 Update CombatScene to use CombatSystem
      - Replace combat logic with CombatSystem calls
      - Keep only animation and rendering in scene
      - Handle combat events for UI updates
      - Display combat log
      - _Requirements: 8.1, 8.3, 8.4, 8.6_
    
    - [~] 3.6.7 Write unit tests for CombatSystem
      - **Property 17: Combat Initialization Includes All Units**
      - **Property 18: Turn Order Based on Speed**
      - **Property 19: Skill Execution at Full Rage**
      - **Property 20: Basic Attack Below Full Rage**
      - **Property 21: Damage Calculation Includes Modifiers**
      - **Property 22: HP Never Goes Below Zero**
      - **Property 23: Death Handling**
      - **Property 24: Combat End Conditions**
      - **Property 25: Status Effect Ticking**
      - **Property 26: Combat Event Logging**
      - **Validates: Requirements 4.1-4.13**
      - Test initializeCombat with various unit sets
      - Test turn order calculation
      - Test skill execution when rage >= 100
      - Test basic attack when rage < 100
      - Test damage calculation with modifiers
      - Test HP never goes below 0
      - Test unit death handling
      - Test combat end detection
      - Test status effect application and ticking
      - Test combat event logging
      - _Requirements: 11.1, 11.2_
    
    - [~] 3.6.8 Write property tests for CombatSystem
      - Property: Combat always ends within max rounds
      - Property: Turn order is always sorted by speed
      - Property: Damage is always non-negative
      - _Requirements: 11.2_
    
    - [~] 3.6.9 Verify and commit CombatSystem extraction
      - Run full test suite
      - Verify all tests pass
      - Manual test combat in game
      - Commit: "Extract CombatSystem from CombatScene"
      - _Requirements: 1.5, 14.1, 14.2, 14.3_

- [ ] 4. Checkpoint - Systems extraction complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 5. Phase 3: Refactor Scenes (1-2 weeks)
  - [ ] 5.1 Refactor PlanningScene (4-5 days)
    - [~] 5.1.1 Remove shop logic from PlanningScene
      - Remove refreshShop implementation (use ShopSystem)
      - Remove buyUnit implementation (use ShopSystem)
      - Remove sellUnit implementation (use ShopSystem)
      - Remove lockShop/unlockShop implementation (use ShopSystem)
      - Keep only UI orchestration and event handlers
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.1.2 Remove board logic from PlanningScene
      - Remove placeUnit implementation (use BoardSystem)
      - Remove moveUnit implementation (use BoardSystem)
      - Remove removeUnit implementation (use BoardSystem)
      - Remove board validation logic (use BoardSystem)
      - Keep only drag-and-drop UI handling
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.1.3 Remove upgrade logic from PlanningScene
      - Remove auto-upgrade detection (use UpgradeSystem)
      - Remove unit combination logic (use UpgradeSystem)
      - Remove equipment transfer logic (use UpgradeSystem)
      - Keep only upgrade animation and UI updates
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.1.4 Remove synergy logic from PlanningScene
      - Remove synergy calculation (use SynergySystem)
      - Keep only synergy display UI
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.1.5 Refactor PlanningScene to orchestration only
      - Scene contains only Phaser lifecycle methods (create, update, init, shutdown)
      - Scene contains only rendering and animation code
      - Scene contains only user input handling
      - Scene delegates all business logic to systems
      - Scene handles success/error results from systems
      - _Requirements: 8.2, 8.3, 8.4, 8.6, 8.7_
    
    - [~] 5.1.6 Write integration tests for PlanningScene
      - Test full planning flow: buy units → deploy → upgrade → start combat
      - Test shop operations through scene
      - Test board operations through scene
      - Test error handling (insufficient gold, invalid placement)
      - _Requirements: 11.4, 11.5_
    
    - [~] 5.1.7 Verify and commit PlanningScene refactor
      - Run full test suite
      - Verify all tests pass
      - Manual test planning phase in game
      - Verify all functionality works identically
      - Commit: "Refactor PlanningScene to use systems"
      - _Requirements: 8.8, 14.1, 14.2, 14.3_


  - [ ] 5.2 Refactor CombatScene (4-5 days)
    - [~] 5.2.1 Remove combat logic from CombatScene
      - Remove combat initialization (use CombatSystem)
      - Remove turn order logic (use CombatSystem)
      - Remove action execution (use CombatSystem)
      - Remove skill execution (use CombatSystem)
      - Remove damage calculation (use CombatSystem)
      - Keep only combat animations and rendering
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.2.2 Remove AI logic from CombatScene
      - Remove enemy generation (use AISystem)
      - Remove AI decision making (use AISystem)
      - Keep only AI action animation
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.2.3 Remove synergy logic from CombatScene
      - Remove synergy application (use SynergySystem)
      - Keep only synergy visual effects
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.2.4 Refactor CombatScene to orchestration only
      - Scene contains only Phaser lifecycle methods
      - Scene contains only animation and rendering code
      - Scene contains only combat UI updates
      - Scene delegates all combat logic to CombatSystem
      - Scene handles combat events for rendering
      - _Requirements: 8.2, 8.3, 8.4, 8.6_
    
    - [~] 5.2.5 Write integration tests for CombatScene
      - Test full combat flow: initialize → turns → end
      - Test combat through scene with animations
      - Test player victory and enemy victory
      - Test combat log updates
      - _Requirements: 11.4, 11.5_
    
    - [~] 5.2.6 Verify and commit CombatScene refactor
      - Run full test suite
      - Verify all tests pass
      - Manual test combat in game
      - Verify animations still work
      - Verify all functionality works identically
      - Commit: "Refactor CombatScene to use systems"
      - _Requirements: 8.8, 14.1, 14.2, 14.3_


  - [ ] 5.3 Refactor MainMenuScene (1-2 days)
    - [~] 5.3.1 Extract any remaining game mode logic
      - Identify any game initialization logic
      - Extract to appropriate system or game mode config
      - Keep only menu UI and scene transitions
      - _Requirements: 8.1, 8.2, 8.5_
    
    - [~] 5.3.2 Refactor MainMenuScene to orchestration only
      - Scene contains only Phaser lifecycle methods
      - Scene contains only menu UI rendering
      - Scene contains only menu navigation
      - Scene handles game start with game mode selection
      - _Requirements: 8.2, 8.3, 8.4_
    
    - [~] 5.3.3 Write integration tests for MainMenuScene
      - Test menu navigation
      - Test game start flow
      - Test scene transitions
      - _Requirements: 11.4_
    
    - [~] 5.3.4 Verify and commit MainMenuScene refactor
      - Run full test suite
      - Verify all tests pass
      - Manual test menu in game
      - Commit: "Refactor MainMenuScene to use systems"
      - _Requirements: 8.8, 14.1, 14.2, 14.3_

- [ ] 6. Checkpoint - Scenes refactored
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 7. Phase 4: Game Mode Support (1 week)
  - [ ] 7.1 Create Game Mode Layer (2 days)
    - [~] 7.1.1 Create GameModeConfig interface and validation
      - Create `src/gameModes/` directory
      - Create `src/gameModes/GameModeConfig.js`
      - Define GameModeConfig interface (id, name, description, scenes, startingGold, startingHP, loseCondition, enabledSystems, aiDifficulty, goldScaling, enemyScaling)
      - Implement createGameModeConfig factory function
      - Implement validateGameModeConfig validation function
      - Add JSDoc comments
      - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 17.1, 17.2, 17.3, 13.4, 20.2_
    
    - [~] 7.1.2 Create GameModeRegistry
      - Create `src/gameModes/GameModeRegistry.js`
      - Implement register(gameMode) function
      - Implement get(gameModeId) function
      - Implement getAll() function
      - Support multiple game modes registered simultaneously
      - Validate configs on registration
      - _Requirements: 9.7, 9.9, 20.2_
    
    - [~] 7.1.3 Create PVEJourneyMode config (current game)
      - Create `src/gameModes/PVEJourneyMode.js`
      - Define config for existing game mode
      - Set startingGold: 10, startingHP: 3
      - Enable all systems (shop, crafting, augments)
      - Set aiDifficulty: "MEDIUM"
      - Define goldScaling and enemyScaling functions
      - Register mode in registry
      - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 20.2_
    
    - [~] 7.1.4 Write unit tests for Game Mode layer
      - **Property 37: Game Mode Configuration Completeness**
      - **Property 38: Game Mode Configuration Validation**
      - **Property 39: Multiple Game Modes Support**
      - **Validates: Requirements 9.2-9.9, 17.1-17.3**
      - Test createGameModeConfig with valid config
      - Test validateGameModeConfig rejects invalid configs
      - Test GameModeRegistry register and get
      - Test multiple modes registered without conflicts
      - Test PVEJourneyMode config is valid
      - _Requirements: 11.1_


  - [ ] 7.2 Update Main Entry Point (1 day)
    - [~] 7.2.1 Modify main.js to accept game mode
      - Import GameModeRegistry
      - Accept game mode parameter
      - Pass game mode to scenes via scene data
      - Initialize systems based on mode config
      - _Requirements: 9.8_
    
    - [~] 7.2.2 Write integration tests for main entry point
      - Test game starts with PVEJourneyMode
      - Test game mode passed to scenes correctly
      - _Requirements: 11.4_
  
  - [ ] 7.3 Update Scenes for Game Modes (2 days)
    - [~] 7.3.1 Update PlanningScene to read game mode config
      - Read config from scene data
      - Use config.startingGold and config.startingHP
      - Use config.goldScaling for gold per round
      - Conditionally show UI based on config.enabledSystems
      - _Requirements: 9.8_
    
    - [~] 7.3.2 Update CombatScene to read game mode config
      - Read config from scene data
      - Use config.aiDifficulty for enemy generation
      - Use config.enemyScaling for enemy strength
      - Use config.loseCondition for game over
      - _Requirements: 9.8_
    
    - [~] 7.3.3 Update MainMenuScene to support game mode selection
      - Add game mode selection UI (optional for now)
      - Pass selected mode to PlanningScene
      - Default to PVEJourneyMode
      - _Requirements: 9.8_
    
    - [~] 7.3.4 Write integration tests for scenes with game modes
      - Test scenes adapt to different configs
      - Test conditional system usage
      - Test scene flow based on mode.scenes
      - _Requirements: 9.8, 11.4_


  - [ ] 7.4 Create Example Modes (2 days)
    - [~] 7.4.1 Create EndlessMode config (example)
      - Create `src/gameModes/EndlessMode.js`
      - Define config: startingGold: 15, startingHP: 5
      - Set aiDifficulty: "HARD"
      - Define aggressive scaling functions
      - Register mode in registry
      - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 20.2_
    
    - [~] 7.4.2 Create PVPMode config stub (future)
      - Create `src/gameModes/PVPMode.js`
      - Define basic config structure
      - Disable AI system, enable PVP system (stub)
      - Add TODO comments for future implementation
      - Register mode in registry
      - _Requirements: 9.1, 20.2_
    
    - [~] 7.4.3 Document how to create new game modes
      - Add documentation to GameModeConfig.js
      - Provide step-by-step guide
      - Include example code
      - Document all config options
      - _Requirements: 18.5, 18.8_
    
    - [~] 7.4.4 Write tests for example modes
      - Test EndlessMode config is valid
      - Test PVPMode config is valid
      - Test switching between modes
      - _Requirements: 9.10, 11.1_
    
    - [~] 7.4.5 Verify and commit game mode support
      - Run full test suite
      - Verify all tests pass
      - Manual test PVEJourneyMode works
      - Manual test EndlessMode works (if implemented)
      - Commit: "Add game mode support layer"
      - _Requirements: 14.1, 14.2, 14.3_

- [ ] 8. Checkpoint - Game mode support complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 9. Phase 5: Documentation & Cleanup (3-4 days)
  - [ ] 9.1 Architecture Documentation (1 day)
    - [~] 9.1.1 Document layer responsibilities
      - Document Game Modes Layer purpose and usage
      - Document Scene Layer responsibilities (orchestration only)
      - Document Systems Layer responsibilities (business logic)
      - Document UI Components Layer
      - Document Core Layer (shared utilities)
      - Document Data Layer (static data)
      - Create architecture diagram
      - _Requirements: 18.4_
    
    - [~] 9.1.2 Document system interfaces
      - Document each system's public API
      - Document input parameters and return types
      - Document error handling for each system
      - Add usage examples for each system
      - _Requirements: 18.2, 18.3_
    
    - [~] 9.1.3 Document game mode creation process
      - Step-by-step guide to create new game mode
      - Document all config options
      - Provide complete example
      - Document how to register and use modes
      - _Requirements: 18.5_
  
  - [ ] 9.2 Code Documentation (1 day)
    - [~] 9.2.1 Add JSDoc comments to all systems
      - Add JSDoc to BoardSystem functions
      - Add JSDoc to UpgradeSystem functions
      - Add JSDoc to SynergySystem functions
      - Add JSDoc to ShopSystem functions
      - Add JSDoc to AISystem functions
      - Add JSDoc to CombatSystem functions
      - Document input parameters and return types
      - _Requirements: 13.4, 13.8, 18.1_
    
    - [~] 9.2.2 Document complex algorithms
      - Document combat turn order algorithm
      - Document synergy calculation algorithm
      - Document tier odds calculation
      - Document enemy generation algorithm
      - _Requirements: 18.2_
    
    - [~] 9.2.3 Update README
      - Update README with new architecture information
      - Add section on systems layer
      - Add section on game modes
      - Update development guide
      - _Requirements: 18.7_


  - [ ] 9.3 Cleanup (1 day)
    - [~] 9.3.1 Remove dead code
      - Identify unused functions in scenes
      - Remove commented-out code
      - Remove unused imports
      - Remove temporary debug code
      - _Requirements: 13.7_
    
    - [~] 9.3.2 Standardize naming conventions
      - Verify camelCase for functions
      - Verify PascalCase for classes
      - Verify UPPER_CASE for constants
      - Ensure consistent naming across systems
      - _Requirements: 13.5_
    
    - [~] 9.3.3 Format all code
      - Run code formatter on all files
      - Ensure consistent indentation
      - Ensure consistent spacing
      - _Requirements: 13.7_
    
    - [~] 9.3.4 Verify code quality metrics
      - Check all system files <= 500 lines
      - Check cyclomatic complexity <= 10
      - Check code duplication < 5%
      - Fix any violations
      - _Requirements: 13.1, 13.2, 13.3_
  
  - [ ] 9.4 Final Testing (1 day)
    - [~] 9.4.1 Run full test suite
      - Run all unit tests
      - Run all integration tests
      - Run all property-based tests
      - Verify 100% pass rate
      - Verify test coverage >= 90% for systems
      - _Requirements: 11.1, 11.6_
    
    - [~] 9.4.2 Performance testing
      - Run performance benchmarks
      - Verify combat turn < 16ms
      - Verify shop refresh < 50ms
      - Verify synergy calculation < 10ms
      - Verify scene transition < 100ms
      - Verify no performance regression > 5%
      - Verify no memory increase > 10%
      - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6, 12.7_
    
    - [~] 9.4.3 Manual testing of all features
      - Test full game flow: menu → planning → combat → next round
      - Test shop operations (refresh, buy, sell, lock)
      - Test board operations (place, move, remove)
      - Test unit upgrades (auto-upgrade, equipment transfer)
      - Test synergies (calculation, display, application)
      - Test combat (turn order, skills, damage, victory/defeat)
      - Test AI opponents (generation, difficulty, decisions)
      - Test save/load functionality
      - _Requirements: 10.1, 10.4_
    
    - [~] 9.4.4 Cross-browser testing
      - Test in Chrome
      - Test in Firefox
      - Test in Safari
      - Test in Edge
      - Verify no browser-specific issues
      - _Requirements: 10.4_
    
    - [~] 9.4.5 Write final integration tests
      - **Property 40: Save Data Round Trip**
      - **Validates: Requirements 10.2, 10.3**
      - Test full game flow from start to finish
      - Test save/load compatibility
      - Test all systems working together
      - _Requirements: 11.4, 11.5_

- [ ] 10. Checkpoint - Documentation and cleanup complete
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 11. Phase 6: Review & Merge (2-3 days)
  - [ ] 11.1 Code Review (1 day)
    - [~] 11.1.1 Review all system extractions
      - Review BoardSystem code quality
      - Review UpgradeSystem code quality
      - Review SynergySystem code quality
      - Review ShopSystem code quality
      - Review AISystem code quality
      - Review CombatSystem code quality
      - Check for code quality issues
      - Verify no circular dependencies
      - _Requirements: 13.6, 15.5_
    
    - [~] 11.1.2 Review scene refactors
      - Review PlanningScene refactor
      - Review CombatScene refactor
      - Review MainMenuScene refactor
      - Verify scenes only contain orchestration
      - Verify no business logic in scenes
      - _Requirements: 8.2, 8.5_
    
    - [~] 11.1.3 Review game mode layer
      - Review GameModeConfig implementation
      - Review GameModeRegistry implementation
      - Review PVEJourneyMode config
      - Review example modes
      - Verify validation logic
      - _Requirements: 9.7, 17.1, 17.2, 17.3_
    
    - [~] 11.1.4 Review test coverage
      - Verify >= 90% coverage for systems
      - Verify >= 80% coverage overall
      - Check for missing test cases
      - Review property-based tests
      - _Requirements: 11.1_
    
    - [~] 11.1.5 Review documentation
      - Verify all systems documented
      - Verify architecture documented
      - Verify game mode creation documented
      - Verify README updated
      - Check for missing documentation
      - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.7_


  - [ ] 11.2 Integration Testing (1 day)
    - [~] 11.2.1 Test full game flow multiple times
      - Play through complete game 5+ times
      - Test different strategies (different units, synergies)
      - Test edge cases (no gold, full bench, max star units)
      - Verify no crashes or errors
      - _Requirements: 10.4, 10.6_
    
    - [~] 11.2.2 Test all features thoroughly
      - Test shop: refresh, buy, sell, lock, unlock
      - Test board: place, move, remove, deploy limit
      - Test upgrades: 3-star, equipment transfer, auto-upgrade
      - Test synergies: all combinations, multiple active
      - Test combat: skills, damage, status effects, victory/defeat
      - Test AI: different difficulties, round scaling
      - Test save/load: save mid-game, load, continue
      - _Requirements: 10.4_
    
    - [~] 11.2.3 Test error scenarios
      - Test insufficient gold errors
      - Test invalid board placement errors
      - Test full bench errors
      - Test graceful error handling
      - Verify error messages displayed correctly
      - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.6_
    
    - [~] 11.2.4 Test backward compatibility
      - Load existing save files from before refactor
      - Verify saves load correctly
      - Verify game continues normally
      - Verify no data loss
      - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 11.3 Merge Preparation (1 day)
    - [~] 11.3.1 Rebase on main branch
      - Fetch latest main branch
      - Rebase refactor branch on main
      - Resolve any merge conflicts
      - _Requirements: 14.7_
    
    - [~] 11.3.2 Run final test suite
      - Run all tests after rebase
      - Verify 100% pass rate
      - Run performance benchmarks
      - Verify no regressions
      - _Requirements: 11.6, 12.6_
    
    - [~] 11.3.3 Create merge request
      - Write comprehensive merge request description
      - List all changes made
      - List all systems extracted
      - List all scenes refactored
      - Include test coverage report
      - Include performance comparison
      - Request code review
      - _Requirements: 14.8_
    
    - [~] 11.3.4 Address review feedback
      - Respond to code review comments
      - Make requested changes
      - Re-run tests after changes
      - Update documentation if needed
      - _Requirements: 14.8_
    
    - [~] 11.3.5 Final approval and merge
      - Get approval from reviewers
      - Verify all CI/CD checks pass
      - Merge to main branch
      - Delete refactor branch
      - _Requirements: 14.8_

- [ ] 12. Final Checkpoint - Refactor complete
  - Ensure all tests pass, refactor merged to main.


## Notes

### Task Marking Convention
- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- All non-optional tasks must be completed for the refactor to be successful
- Each task references specific requirements for traceability

### Execution Order
- Systems must be extracted in dependency order: Board → Upgrade → Synergy → Shop → AI → Combat
- Scenes must be refactored after all systems are extracted
- Game mode support must be added after scenes are refactored
- All tests must pass after every commit

### Checkpoints
- Checkpoints are placed at the end of each major phase
- At each checkpoint, verify all tests pass and ask user if questions arise
- Do not proceed to next phase if tests are failing

### Testing Strategy
- Unit tests validate individual system behavior
- Property-based tests validate universal correctness properties
- Integration tests validate systems working together
- Manual testing validates user experience

### Performance Targets
- Combat turn execution: < 16ms (60 FPS)
- Shop refresh operation: < 50ms
- Board synergy calculation: < 10ms
- Scene transition: < 100ms
- Performance must not degrade > 5% after refactor

### Code Quality Targets
- System files: <= 500 lines of code
- Function complexity: <= 10 cyclomatic complexity
- Code duplication: < 5%
- Test coverage: >= 90% for systems, >= 80% overall
- All public functions must have JSDoc comments

### Rollback Strategy
- If > 5 tests fail: revert last commit and investigate
- If performance regression > 20%: revert and optimize
- If critical bug found: revert to last stable commit
- Maintain backup of working state before major changes

### File Organization
- Systems: `src/systems/`
- Game Modes: `src/gameModes/`
- Scenes: `src/scenes/`
- Core: `src/core/`
- Data: `src/data/`
- System tests: `tests/systems/`
- Integration tests: `tests/integration/`
- Property tests: `tests/properties/`

### Timeline Summary
- Phase 1 (Preparation): 1-2 days
- Phase 2 (Extract Systems): 2-3 weeks
  - BoardSystem: 2-3 days
  - UpgradeSystem: 2-3 days
  - SynergySystem: 2-3 days
  - ShopSystem: 3-4 days
  - AISystem: 3-4 days
  - CombatSystem: 4-5 days
- Phase 3 (Refactor Scenes): 1-2 weeks
  - PlanningScene: 4-5 days
  - CombatScene: 4-5 days
  - MainMenuScene: 1-2 days
- Phase 4 (Game Modes): 1 week
- Phase 5 (Documentation): 3-4 days
- Phase 6 (Review & Merge): 2-3 days
- **Total: 6-8 weeks**

### Success Criteria
- All existing tests pass (100%)
- All new tests pass (100%)
- Test coverage >= 90% for systems
- No functional regressions
- Performance meets targets
- Backward compatibility maintained
- Code quality metrics met
- Documentation complete
- Code review approved
- Successfully merged to main

