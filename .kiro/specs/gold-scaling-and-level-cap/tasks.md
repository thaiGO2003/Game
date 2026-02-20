# Implementation Plan: Gold Scaling and Level Cap

## Overview

This implementation plan breaks down the Gold Scaling and Level Cap feature into actionable coding tasks. The project introduces three interconnected mechanics: (1) gold reserve scaling for damage and control effects, (2) automatic assassin skill upgrades for 2-3 star units, and (3) level cap extension from 9-12 to 25 across all scenes.

Implementation language: JavaScript (Phaser 3 game engine)

## Tasks

- [ ] 1. Phase 1: Gold Reserve Scaling System
  - [x] 1.1 Implement getGoldReserveScaling() in gameUtils.js
    - Create new exported function `getGoldReserveScaling(gold)`
    - Implement baseline threshold at 10 gold (no bonus)
    - Calculate +1% bonus per 2 gold above baseline
    - Cap multiplier at 2.0 (100% bonus at 210 gold)
    - Handle edge cases: negative gold, non-numeric input
    - _Requirements: 1.1, 1.2, 1.3, 11.1, 11.2, 11.3_
  
  - [x] 1.2 Write property tests for gold scaling
    - **Property 1: Gold Scaling Monotonicity**
    - **Property 2: Gold Scaling Bounds**
    - **Property 3: Gold Scaling Formula**
    - Use fast-check to generate random gold amounts
    - Verify monotonicity: g1 < g2 implies scale(g1) <= scale(g2)
    - Verify bounds: 1.0 <= scale(g) <= 2.0 for all g
    - Verify formula correctness for gold > 10
    - Test edge cases: 0, 10, 210, negative values
    - _Validates: Properties 1, 2, 3_
  
  - [x] 1.3 Integrate gold scaling into skill damage calculation
    - Locate damage calculation in CombatScene.js `applySkillEffect()`
    - Import `getGoldReserveScaling` from gameUtils
    - Call scaling function with `this.player.gold`
    - Multiply base damage by gold multiplier and round result
    - Apply to all damage-dealing skills
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 1.4 Write property tests for damage scaling
    - **Property 4: Damage Scaling Correctness**
    - Generate random base damage and gold values
    - Verify final damage = round(baseDamage * goldMultiplier)
    - Verify final damage >= base damage (never reduces)
    - Test with various gold amounts (0, 10, 30, 50, 210)
    - _Validates: Property 4_
  
  - [x] 1.5 Integrate gold scaling into control effect probabilities
    - Locate control effect calculations (stun, freeze, sleep, etc.)
    - Apply gold multiplier to base probability
    - Cap final probability at 1.0 (100%)
    - Update effects: stun, freeze, sleep, disease, poison
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 1.6 Write property tests for probability scaling
    - **Property 5: Probability Scaling Correctness**
    - Generate random base probabilities (0.0 to 1.0) and gold values
    - Verify final probability = min(baseProb * goldMultiplier, 1.0)
    - Verify final probability >= base probability
    - Verify probability never exceeds 1.0
    - _Validates: Property 5_

- [ ] 2. Phase 2: Assassin Skill Upgrade System
  - [x] 2.1 Implement getEffectiveSkillId() in gameUtils.js or CombatScene.js
    - Create function `getEffectiveSkillId(baseSkillId, classType, star)`
    - Check if classType === 'ASSASSIN' and star >= 2
    - Construct upgraded skill ID: `${baseSkillId}_v2`
    - Look up upgraded skill in SKILL_LIBRARY
    - Return upgraded skill if exists, otherwise return base skill
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3_
  
  - [x] 2.2 Write property tests for skill upgrade logic
    - **Property 6: Assassin Skill Selection**
    - **Property 7: Skill Upgrade Naming Convention**
    - **Property 14: Skill Upgrade Validity**
    - Generate random units with various classes and star levels
    - Verify ASSASSIN + 2-3★ with existing _v2 returns upgraded skill
    - Verify ASSASSIN + 1★ returns base skill
    - Verify non-ASSASSIN returns base skill
    - Verify ASSASSIN + 2-3★ without _v2 returns base skill
    - Verify naming convention: baseSkillId + "_v2"
    - Verify returned skill ID always exists in SKILL_LIBRARY
    - _Validates: Properties 6, 7, 14_
  
  - [x] 2.3 Integrate skill upgrade into unit creation
    - Locate unit creation in CombatScene.js `createCombatUnit()`
    - Call `getEffectiveSkillId()` with unit's base skill, class, and star
    - Assign effective skill ID to combat unit
    - Ensure backward compatibility for existing units
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 2.4 Write integration tests for assassin upgrades
    - Test creating 2★ Panther (void_execute → void_execute_v2)
    - Test creating 3★ Fox (flame_combo → flame_combo_v2)
    - Test creating 2★ Mosquito (mosquito_drain → mosquito_drain_v2)
    - Test creating 1★ Panther (uses base void_execute)
    - Test creating 3★ Mage (uses base skill, not upgraded)
    - Test creating 2★ Bat (uses base blood_bite, no _v2 exists)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 12.1, 12.2, 12.3_

- [ ] 3. Phase 3: Level Cap Extension
  - [x] 3.1 Update level cap constant in all scenes
    - Update LEVEL_CAP from 9 to 25 in CombatScene.js
    - Update LEVEL_CAP from 12 to 25 in PlanningScene.js
    - Update LEVEL_CAP from 9 to 25 in BoardPrototypeScene.js
    - Ensure consistent cap across all scenes
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 3.2 Update gainXp() in CombatScene.js
    - Modify level cap check from 9 to 25
    - Ensure loop condition: `while (amount > 0 && this.player.level < 25)`
    - Verify XP rollover logic handles multiple level ups
    - Verify excess XP is discarded at level 25
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 3.3 Update gainXp() in PlanningScene.js
    - Modify level cap check from 12 to 25
    - Ensure consistent behavior with CombatScene
    - Verify deploy cap and tier odds updates
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 3.4 Update gainXp() in BoardPrototypeScene.js
    - Modify level cap check from 9 to 25
    - Ensure consistent behavior with other scenes
    - Verify deploy cap and tier odds updates
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 3.5 Write property tests for level cap enforcement
    - **Property 8: Level Cap Enforcement**
    - **Property 9: XP Processing Correctness**
    - **Property 13: XP Conservation**
    - Generate random XP gains and starting levels
    - Verify level never exceeds 25 after gainXp()
    - Verify XP is properly distributed across level ups
    - Verify excess XP is carried over correctly
    - Verify XP conservation: total XP = thresholds crossed + final xp + discarded
    - Test multi-level gains (e.g., 1000 XP at level 1)
    - Test XP gain at level 25 (no level up)
    - _Validates: Properties 8, 9, 13_
  
  - [x] 3.6 Write unit tests for level up logging
    - **Property 10: Multi-Level Logging**
    - Test single level up generates one log message
    - Test multi-level gain generates multiple log messages
    - Verify log format: "Lên cấp {level}."
    - _Validates: Property 10, Requirements 8.1, 8.2_

- [ ] 4. Phase 4: Supporting Systems Integration
  - [x] 4.1 Verify deploy cap calculations support level 25
    - Review `getDeployCapByLevel()` in gameUtils.js
    - Ensure function returns valid values for levels 1-25
    - Test edge cases: level 1, level 25
    - _Requirements: 9.1, 9.3_
  
  - [x] 4.2 Verify tier odds calculations support level 25
    - Review `rollTierForLevel()` and TIER_ODDS_BY_LEVEL in gameUtils.js
    - Ensure tier odds table has entries for levels 1-25
    - Test edge cases: level 1, level 25
    - _Requirements: 9.2, 9.4_
  
  - [x] 4.3 Write property tests for level-based calculations
    - **Property 11: Level-Based Calculations Support**
    - Generate random levels from 1 to 25
    - Verify getDeployCapByLevel() returns valid cap for all levels
    - Verify rollTierForLevel() returns valid tier for all levels
    - Verify no undefined or null returns
    - _Validates: Property 11_
  
  - [x] 4.4 Implement save data level validation
    - Add validation in save/load logic (likely in persistence.js or scene init)
    - Check loaded level is between 1 and 25
    - Cap level at 25 if above
    - Preserve level if within valid range
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 4.5 Write property tests for save data validation
    - **Property 12: Save Data Level Validation**
    - Generate random save data with various levels
    - Test level 9 and below (preserved)
    - Test level 10-12 (preserved)
    - Test level 13-25 (preserved)
    - Test level 26+ (capped at 25)
    - Test level 0 or negative (handled gracefully)
    - _Validates: Property 12_

- [ ] 5. Phase 5: Integration Testing
  - [x] 5.1 Test gold scaling in combat scenarios
    - Create combat with 10 gold, verify 1.0x damage
    - Create combat with 30 gold, verify 1.10x damage
    - Create combat with 50 gold, verify 1.20x damage
    - Create combat with 210 gold, verify 2.0x damage (capped)
    - Verify control effects scale with gold
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_
  
  - [x] 5.2 Test assassin upgrades in combat
    - Create 2★ Panther, verify uses void_execute_v2
    - Create 3★ Fox, verify uses flame_combo_v2
    - Create 2★ Mosquito, verify uses mosquito_drain_v2
    - Verify upgraded skills function correctly in combat
    - Verify 1★ assassins use base skills
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 5.3 Test level progression across scenes
    - Level up from 8 to 9 in CombatScene (old cap)
    - Level up from 9 to 10 in CombatScene (breaking old cap)
    - Level up from 11 to 12 in PlanningScene (old cap)
    - Level up from 12 to 13 in PlanningScene (breaking old cap)
    - Level up from 24 to 25 in all scenes (new cap)
    - Gain XP at level 25, verify no level up
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 5.4 Test combined mechanics
    - Create combat with 50 gold and 2★ assassins
    - Verify both gold scaling and skill upgrades work together
    - Level up during combat, verify state persists
    - Test deploy cap increases with level
    - Test tier odds improve with level
    - _Requirements: Multiple combined_
  
  - [x] 5.5 Test save/load compatibility
    - Save game at level 9, reload, verify level preserved
    - Save game at level 25, reload, verify level preserved
    - Save game with 50 gold, reload, verify gold scaling works
    - Save game with 2★ assassin, reload, verify skill upgrade works
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 6. Phase 6: Edge Cases and Error Handling
  - [x] 6.1 Test gold scaling edge cases
    - Test with gold = 0 (returns 1.0)
    - Test with gold = 10 (returns 1.0, baseline)
    - Test with gold = 210 (returns 2.0, capped)
    - Test with gold = 1000 (returns 2.0, capped)
    - Test with negative gold (treated as 0)
    - Test with non-numeric gold (treated as 0)
    - Test with null/undefined gold (treated as 0)
    - _Requirements: 1.1, 1.3, 11.1, 11.2, 11.3_
  
  - [x] 6.2 Test skill upgrade edge cases
    - Test assassin with empty skill ID (returns empty)
    - Test assassin with invalid skill ID (returns invalid)
    - Test assassin with skill that has no _v2 (returns base)
    - Test non-assassin with skill that has _v2 (returns base)
    - Verify all cases return valid skill IDs
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 6.3 Test level cap edge cases
    - Test gaining 10000 XP at level 1 (multiple level ups)
    - Test gaining 1000 XP at level 24 (level to 25, discard excess)
    - Test gaining 1 XP at level 25 (no level up)
    - Test gaining 0 XP (no change)
    - Test gaining negative XP (handled gracefully)
    - _Requirements: 6.2, 6.3, 13.1, 13.2, 13.3_
  
  - [x] 6.4 Test probability capping
    - Test control effect with 0.9 base probability and 50 gold
    - Verify probability is capped at 1.0 (100%)
    - Test with various high gold amounts
    - _Requirements: 3.3_

- [ ] 7. Final Validation
  - [x] 7.1 Run all property tests
    - Execute all 14 property tests
    - Verify minimum 100 iterations per property
    - Ensure all properties pass
    - Document any failures
  
  - [x] 7.2 Run all unit tests
    - Execute all unit and integration tests
    - Verify edge cases are handled
    - Ensure backward compatibility
  
  - [x] 7.3 Manual gameplay testing
    - Play through Combat mode to level 25
    - Play through Planning mode to level 25
    - Verify gold scaling feels balanced
    - Verify assassin upgrades are noticeable
    - Test save/load at various levels
  
  - [x] 7.4 Performance validation
    - Verify gold scaling doesn't impact frame rate
    - Verify skill upgrade lookup is fast
    - Verify level up processing is smooth
    - Profile with large XP gains (multi-level ups)
  
  - [x] 7.5 Documentation update
    - Update game documentation with new mechanics
    - Document gold scaling formula for players
    - Document assassin upgrade system
    - Document new level cap
