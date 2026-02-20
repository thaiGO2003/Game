# Implementation Plan: Đại tu và Cân bằng Game Bá Chủ Khu Rừng

## Overview

This implementation plan breaks down the Forest Lord Overhaul into actionable coding tasks following the 6-phase approach defined in the design document. The project fixes core combat mechanics, reworks 4 units, expands the catalog to 120 units, and extends the progression system to level 25+.

Implementation language: JavaScript (Phaser 3 game engine)

## Tasks

- [x] 1. Phase 1: Core Combat Fixes
  - [x] 1.1 Fix rage gain on attack miss in CombatScene.js
    - Modify `resolveDamage()` method to check if damage was actually dealt before granting rage to attacker
    - Ensure attacker only gains rage when `damageDealt > 0`
    - Ensure defender always gains rage when attacked (even on miss)
    - Add evasion check before damage calculation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 1.2 Write property test for rage gain consistency
    - **Property 1: Rage Gain Consistency**
    - **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
    - Use fast-check to generate random combat scenarios
    - Verify attacker gains no rage on miss, gains rage on hit
    - Verify defender always gains rage when attacked
  
  - [x] 1.3 Implement findKnockbackPosition() helper in CombatScene.js
    - Create new method that scans horizontal row for valid push position
    - Implement logic to find last empty cell OR cell before enemy tanker
    - Handle edge cases: board boundaries, blocked paths, no valid position
    - Return target's current column if no valid push exists
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 1.4 Write unit tests for knockback position finding
    - Test pushing to last empty cell
    - Test stopping before tanker
    - Test blocked path (no movement)
    - Test board boundary cases
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 1.5 Update knockback_charge effect in applySkillEffect()
    - Replace existing knockback logic with call to `findKnockbackPosition()`
    - Apply damage first, then check if target survived
    - Move target to new position if different from current
    - Show "ĐẨY LÙI" text on successful push, "KHÓA VỊ TRÍ" if blocked
    - Add tween animation for knockback movement
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 1.6 Remove Endless mode player healing buff
    - Locate Endless mode buff application logic (likely in `processStartTurn()` or `applySynergyBonuses()`)
    - Remove healing buff for player units (side === "LEFT")
    - Keep AI scaling buffs for enemy units (side === "RIGHT")
    - Ensure AI buffs scale with round number: `1 + (round - 30) * 0.05`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Checkpoint - Core fixes validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Phase 2: Unit Reworks
  - [x] 3.1 Update Wolf unit data in units.csv
    - Change classType from "FIGHTER" to "ASSASSIN"
    - Change classVi from "Đấu sĩ" to "Sát thủ"
    - Update stats: HP 325→280, ATK 64→72, DEF 21→16, rageMax 3→2
    - Update skillId to reference new assassin-appropriate skill if needed
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 3.2 Create mosquito_drain_v2 skill in skills.csv
    - Add new skill entry with effect type "lifesteal_disease_maxhp"
    - Set lifesteal to 60% of damage dealt
    - Set max HP increase to 15% of damage dealt
    - Keep disease spread to adjacent enemies (3 turns, 10 damage)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 3.3 Implement lifesteal_disease_maxhp effect in CombatScene.js
    - Add new case in `applySkillEffect()` for "lifesteal_disease_maxhp"
    - Calculate and apply lifesteal healing (60% of damage)
    - Increase attacker's hpMax by 15% of damage dealt
    - Also increase current hp by the same amount
    - Show floating text for max HP increase
    - Apply disease status to adjacent enemies
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 3.4 Create flame_combo_v2 skill in skills.csv
    - Add new skill entry with effect type "double_hit_gold_reward"
    - Define two hits with appropriate damage scaling
    - Add gold reward parameter (1 gold on kill)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 3.5 Implement double_hit_gold_reward effect in CombatScene.js
    - Add new case in `applySkillEffect()` for "double_hit_gold_reward"
    - Execute two separate hits with delay between them
    - Check if target was alive before second hit and died from either hit
    - Award 1 gold to player if kill occurred and attacker is on LEFT side
    - Show "+1 VÀNG" floating text and add log message
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 3.6 Update Leopard to tier 5 in units.csv
    - Change tier from 2 to 5
    - Buff stats: HP to 320, ATK to 95
    - Update skillId to reference new execute skill with rage refund
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 3.7 Create void_execute_v2 skill in skills.csv
    - Add new skill entry with effect type "assassin_execute_rage_refund"
    - Set rage refund to 50% of rageMax on kill
    - Define high damage scaling appropriate for tier 5 assassin
    - _Requirements: 11.4, 11.5, 11.6, 11.7_
  
  - [x] 3.8 Implement assassin_execute_rage_refund effect in CombatScene.js
    - Add new case in `applySkillEffect()` for "assassin_execute_rage_refund"
    - Track if target was alive before damage
    - If target dies from skill, refund 50% of attacker's rageMax
    - Clamp rage to not exceed rageMax
    - Show floating text for rage refund
    - _Requirements: 11.4, 11.5, 11.6, 11.7_

- [x] 4. Checkpoint - Unit reworks validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Phase 3: Unit Catalog Expansion
  - [x] 5.1 Design and add 70 new units to units.csv
    - Create units to reach exactly 120 total (6 roles × 5 tiers × 4 units)
    - Ensure each role has exactly 20 units (4 per tier)
    - Assign unique IDs, names, and emoji icons
    - Balance stats appropriately for each tier and role
    - Assign skills from skills.csv (create new skills if needed)
    - Distribute across all 8 tribes for synergy diversity
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 28.1, 28.2, 28.3, 28.4, 28.5_
  
  - [x] 5.2 Create additional skills for new units in skills.csv
    - Design skills appropriate for each role and tier
    - Ensure variety in effect types and damage patterns
    - Add Vietnamese descriptions for all new skills
    - Reference existing effect types or create new ones as needed
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [x] 5.3 Implement any new skill effects in CombatScene.js
    - Add new cases in `applySkillEffect()` for any new effect types
    - Follow existing patterns for damage calculation and visual feedback
    - Ensure all effects work with rage system and combat flow
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_
  
  - [x] 5.4 Remove generateExtraUnits() logic from unitCatalog.js
    - Delete or comment out any dynamic unit generation code
    - Ensure `loadUnitCatalog()` only parses and returns units from CSV
    - Verify exactly 120 units are loaded without generation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 5.5 Update encyclopedia display for 120 units
    - Ensure encyclopedia UI can display all 120 units
    - Verify grouping by role and tier works correctly
    - Test filtering and search functionality
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

- [x] 6. Checkpoint - Unit catalog validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Phase 4: Progression System Extension
  - [x] 7.1 Extend TIER_ODDS_BY_LEVEL in gameUtils.js
    - Add tier odds entries for levels 10-25
    - Use interpolation formula for smooth progression
    - Ensure tier 1 odds decrease and tier 5 odds increase with level
    - Target ~70% tier 5 odds at level 25
    - Normalize all odds to sum to 1.0
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [x] 7.2 Write property test for tier odds probability sum
    - **Property 5: Tier Odds Probability Sum**
    - **Validates: Requirements 13.5**
    - Verify sum of odds equals 1.0 (±0.001) for all levels
    - Verify all individual odds are in range [0, 1]
  
  - [x] 7.3 Extend XP_TO_LEVEL_UP in gameUtils.js
    - Add XP requirements for levels 10-25
    - Ensure values are monotonically increasing
    - Use appropriate scaling (e.g., quadratic or exponential)
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [x] 7.4 Update getDeployCapByLevel() in gameUtils.js
    - Change max deploy cap from current limit to 25
    - Use formula: `clamp(level + 2, 3, 25)`
    - Ensure level 23+ returns 25 (full 5×5 board)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 7.5 Write unit tests for deploy cap monotonicity
    - **Property 4: Deploy Cap Monotonicity**
    - **Validates: Requirements 12.1, 12.2, 12.3**
    - Test levels 1-30 to verify monotonic increase
    - Verify bounds: min 3, max 25
  
  - [x] 7.6 Implement Easy mode difficulty scaling
    - Locate Easy mode AI strength calculation
    - Add check for round number > 30
    - Apply scaling factor to AI unit stats: `1 + (round - 30) * 0.05`
    - Ensure scaling only applies to AI units (side === "RIGHT")
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 7.7 Update shop system to use extended tier odds
    - Ensure shop refresh queries tier odds for current player level
    - Handle levels beyond 25 by using level 25 odds as fallback
    - Verify shop displays correct tier distribution
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 8. Checkpoint - Progression system validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Phase 5: Validation & Testing
  - [x] 9.1 Update verify_data.cjs for 120 unit validation
    - Implement `validateUnitCatalog()` function following Algorithm 3
    - Check total count equals 120
    - Check each role has exactly 20 units
    - Check each role-tier combination has exactly 4 units
    - Check all IDs are unique
    - Check all name+icon combinations are unique
    - Check all skillId references exist in skills.csv
    - Exit with error code 1 if validation fails
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 9.2 Add unit data integrity validation
    - Validate tier is in range [1, 5]
    - Validate hp, atk > 0
    - Validate def, matk, mdef >= 0
    - Validate range in [1, 4]
    - Validate rageMax in [2, 5]
    - Validate classType is valid role
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_
  
  - [x] 9.3 Add skill reference validation
    - Load all skills from skills.csv into a Set
    - Check each unit's skillId exists in the Set
    - Report all missing skill references with unit ID
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [x] 9.4 Improve CSV parsing robustness
    - Handle empty fields with defaults or errors
    - Handle special characters in names and descriptions
    - Trim whitespace from all string fields
    - Convert numeric fields to numbers
    - Report line number and field on parse errors
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_
  
  - [ ]* 9.5 Write unit tests for core combat mechanics
    - Test rage gain with hit vs miss scenarios
    - Test knockback position finding with various board states
    - Test deploy cap calculation for levels 1-30
    - Test unit stat validation
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_
  
  - [x] 9.6 Write integration tests for combat flow
    - Test full combat scenario with rage tracking
    - Test knockback in real combat with multiple units
    - Test Endless mode buff application
    - Test all 4 reworked units in combat scenarios
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 8.1, 9.1, 10.1, 11.1_
  
  - [x] 9.7 Write integration tests for shop and progression
    - Test shop refresh with new tier odds
    - Test level up from 1 to 25+
    - Test deploy cap increase over time
    - Test XP gain and tier odds progression
    - _Requirements: 12.1, 13.1, 14.1, 16.1_

- [x] 10. Checkpoint - Validation and testing complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Phase 6: Error Handling & Polish
  - [x] 11.1 Add error handling for invalid knockback positions
    - Ensure `findKnockbackPosition()` never returns invalid column
    - Handle case where all cells are blocked
    - Show appropriate feedback message to player
    - _Requirements: 3.6, 4.6_
  
  - [x] 11.2 Add error handling for rage overflow
    - Ensure rage is always clamped to rageMax
    - Handle multiple rage gain sources safely
    - _Requirements: 1.5, 2.2_
  
  - [x] 11.3 Add error handling for missing skills
    - Log error if unit references non-existent skill
    - Skip skill execution gracefully without crashing
    - _Requirements: 18.3, 18.4_
  
  - [x] 11.4 Add save data compatibility layer
    - Validate and migrate old save data to new format
    - Replace removed units with equivalent units
    - Clamp level and deploy cap to valid ranges
    - Handle corrupted save data gracefully
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_
  
  - [x] 11.5 Optimize performance for 25 units on board
    - Profile rendering with 25 units
    - Implement sprite pooling if needed
    - Ensure frame rate stays above 30 FPS
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_
  
  - [x] 11.6 Add comprehensive error recovery
    - Ensure combat continues after unexpected errors
    - Log errors for debugging without crashing game
    - Provide fallback values for invalid data
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

- [x] 12. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each phase
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Implementation follows the 6-phase order from the design document
- All code examples use JavaScript (Phaser 3 game engine)
