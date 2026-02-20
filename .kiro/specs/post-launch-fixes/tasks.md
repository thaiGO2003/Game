# Implementation Plan: Post-Launch Fixes

## Overview

This plan addresses critical post-launch issues following the Forest Lord Overhaul. The implementation follows a systematic approach: first fix data integrity issues in CSV files, then correct combat logic bugs, implement missing skill effects, and finally validate everything through comprehensive testing. All tasks build incrementally to ensure the game remains functional at each step.

## Tasks

- [ ] 1. Data validation and emoji uniqueness fixes
  - [x] 1.1 Enhance verify_data.cjs with emoji uniqueness validation
    - Add validateEmojiUniqueness() function that returns duplicate emoji map
    - Scan units.csv and report all units sharing the same emoji
    - Exit with error code if duplicates found
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 1.2 Write property test for emoji uniqueness
    - **Property 1: Emoji Uniqueness**
    - **Validates: Requirements 1.1, 12.4**
  
  - [x] 1.3 Fix Triceratops emoji duplication
    - Identify current Triceratops emoji (🦕) that conflicts with Tyrannosaurus
    - Replace with unique emoji (suggest 🦏 or another unique dinosaur)
    - Update units.csv with new emoji
    - _Requirements: 1.4_
  
  - [~] 1.4 Write property test for CSV round-trip validation
    - **Property 2: CSV Round-Trip Validation**
    - **Validates: Requirements 1.5**

- [ ] 2. Skill description terminology and completeness fixes
  - [~] 2.1 Add geometric term detection to verify_data.cjs
    - Add validateSkillDescriptions() function
    - Scan skills.csv for "hình nón", "hình tròn" in descriptionVi
    - Report all skills with geometric terms
    - _Requirements: 2.1, 2.2_
  
  - [~] 2.2 Write property test for skill description terminology
    - **Property 3: Skill Description Terminology**
    - **Validates: Requirements 2.1**
  
  - [~] 2.3 Replace geometric terms with grid-based terminology
    - Replace "hình nón" with "vùng hình tam giác phía trước" or "các ô phía trước"
    - Replace "hình tròn" with "vùng xung quanh" or "các ô liền kề"
    - Maintain semantic equivalence with original intent
    - Update skills.csv with corrected descriptions
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [~] 2.4 Add numeric value completeness validation
    - Add validateSkillCompleteness() function to verify_data.cjs
    - Identify skills with vague descriptions lacking numeric values
    - Report skills missing scaling formulas or thresholds
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [~] 2.5 Write property test for skill numeric completeness
    - **Property 15: Skill Numeric Completeness**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ] 3. Wolf role transformation and 120 units verification
  - [~] 3.1 Transfer Wolf's alpha_howl skill to a Tanker unit
    - Identify suitable Tanker unit (suggest ant_guard or pangolin_plate)
    - Update target Tanker's skillId to alpha_howl in units.csv
    - Verify skill configuration is correct for Tanker role
    - _Requirements: 3.1, 3.3_
  
  - [~] 3.2 Create new assassin skill for Wolf
    - Design shadow_strike skill (high burst damage, single target, stealth mechanic)
    - Add new skill entry to skills.csv with appropriate values
    - Update Wolf's skillId to shadow_strike in units.csv
    - _Requirements: 3.2, 3.4_
  
  - [~] 3.3 Add 120 units distribution validation
    - Add validate120Units() function to verify_data.cjs
    - Verify exactly 120 units total
    - Verify distribution: 6 roles × 5 tiers × 4 units per combination
    - Report any missing or excess units by role/tier
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [~] 3.4 Write property test for 120 units distribution
    - **Property 19: 120 Units Distribution**
    - **Validates: Requirements 12.2, 12.5**

- [x] 4. Checkpoint - Verify all data validation passes
  - Run verify_data.cjs and ensure all checks pass
  - Confirm zero duplicate emojis, correct unit count, and valid skill references
  - Ask the user if questions arise

- [ ] 5. Combat rage system fixes
  - [~] 5.1 Fix rage gain on miss in CombatScene.js resolveDamage()
    - Move evasion check to the beginning, before damage calculation
    - On miss: only defender gains rage (clamped to rageMax), attacker does NOT
    - On hit: both attacker and defender gain rage (if damage > 0)
    - Always use Math.min(rageMax, rage + gain) to clamp rage values
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [~] 5.2 Write property test for no rage gain on miss (attacker)
    - **Property 5: No Rage Gain on Miss (Attacker)**
    - **Validates: Requirements 5.1, 13.2**
  
  - [~] 5.3 Write property test for rage gain on miss (defender)
    - **Property 6: Rage Gain on Miss (Defender)**
    - **Validates: Requirements 5.3**
  
  - [~] 5.4 Write property test for hit vs miss rage distinction
    - **Property 7: Hit vs Miss Rage Distinction**
    - **Validates: Requirements 5.4, 13.4**
  
  - [~] 5.5 Fix rageOverflow.test.js expectations
    - Update test to expect attacker rage = 0 when attack misses
    - Verify test "should not gain rage when attack misses (attacker)" passes
    - Ensure evasion configuration correctly causes miss
    - _Requirements: 5.2, 13.1, 13.3, 13.4_

- [ ] 6. Knockback system fixes
  - [~] 6.1 Fix Triceratops knockback direction in findKnockbackPosition()
    - Calculate targetBackCol based on unit side (LEFT → col 9, RIGHT → col 0)
    - Set moveDirection: LEFT units move +1, RIGHT units move -1
    - Move target one column toward their back line
    - Handle occupied positions by keeping unit in current position
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [~] 6.2 Write property test for knockback direction
    - **Property 12: Triceratops Knockback Direction**
    - **Validates: Requirements 8.1**
  
  - [~] 6.3 Write property test for knockback position persistence
    - **Property 13: Knockback Position Persistence**
    - **Validates: Requirements 8.2**
  
  - [~] 6.4 Write property test for knockback relative positioning
    - **Property 14: Knockback Relative Positioning**
    - **Validates: Requirements 8.3**
  
  - [~] 6.5 Write unit tests for knockback edge cases
    - Test knockback with occupied positions
    - Test knockback at board boundaries
    - Test knockback with multiple units in same row
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. Checkpoint - Verify combat logic fixes
  - Run all combat-related tests (rage, knockback)
  - Ensure rageOverflow.test.js passes completely
  - Ask the user if questions arise

- [ ] 8. Mosquito lifesteal enhancement
  - [~] 8.1 Implement max HP increase in mosquito_drain_v2 skill effect
    - In applySkillEffect(), locate lifesteal_disease_maxhp case
    - Calculate maxHpIncrease as 15% of damage dealt
    - Increase both attacker.hpMax and attacker.hp by maxHpIncrease
    - Add combat log message for max HP increase
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [~] 8.2 Write property test for Mosquito lifesteal max HP increase
    - **Property 4: Mosquito Lifesteal Max HP Increase**
    - **Validates: Requirements 4.1, 4.3**
  
  - [~] 8.3 Write unit tests for Mosquito lifesteal
    - Test lifesteal healing current HP
    - Test max HP increase calculation
    - Test disease spread to adjacent enemies
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9. Leopard buff implementation
  - [~] 9.1 Update Leopard skill to award 5 gold per kill
    - In applySkillEffect(), locate assassin_execute_rage_refund case
    - Change gold reward from 1 to 5 when target.hp <= 0
    - Add combat log message showing 5 gold reward
    - _Requirements: 6.1, 6.3_
  
  - [~] 9.2 Implement extra attack on kill for Leopard
    - After kill confirmation, select new target using selectTarget()
    - Call basicAttack() with new target if available
    - Handle multi-kill scenarios with additive gold rewards
    - _Requirements: 6.2, 6.4_
  
  - [~] 9.3 Write property test for Leopard gold reward
    - **Property 8: Leopard Gold Reward**
    - **Validates: Requirements 6.1**
  
  - [~] 9.4 Write property test for Leopard extra attack
    - **Property 9: Leopard Extra Attack**
    - **Validates: Requirements 6.2**
  
  - [~] 9.5 Write property test for Leopard multi-kill gold stacking
    - **Property 10: Leopard Multi-Kill Gold Stacking**
    - **Validates: Requirements 6.4**
  
  - [~] 9.6 Write unit tests for Leopard buff
    - Test single kill scenario (5 gold, extra attack)
    - Test multi-kill scenario (10+ gold, multiple extra attacks)
    - Test no extra attack when no targets available
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 10. Fox gold reward verification
  - [~] 10.1 Verify Fox flame_combo_v2 implementation awards gold
    - In applySkillEffect(), locate double_hit_gold_reward case
    - Ensure killCount tracks eliminations from both hits
    - Verify gold is awarded: this.gold += killCount
    - Add combat log message for gold rewards
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [~] 10.2 Write property test for Fox gold reward
    - **Property 11: Fox Gold Reward**
    - **Validates: Requirements 7.1, 7.3**
  
  - [~] 10.3 Write unit tests for Fox gold reward
    - Test single kill from first hit
    - Test single kill from second hit
    - Test double kill (both hits eliminate targets)
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 11. Checkpoint - Verify skill implementations
  - Run all skill-related tests (Mosquito, Leopard, Fox)
  - Verify gold rewards and combat effects work correctly
  - Ask the user if questions arise

- [ ] 12. Skill implementation completeness audit
  - [~] 12.1 Create skill effect inventory
    - List all unique effect values from skills.csv
    - Map each effect to its handler in applySkillEffect()
    - Identify effects without handlers or with incomplete implementations
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [~] 12.2 Implement missing skill handlers
    - For each missing effect, add case in applySkillEffect()
    - Implement complete skill logic matching description
    - Add fallback handler for unrecognized effects
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [~] 12.3 Write property test for skill implementation completeness
    - **Property 16: Skill Implementation Completeness**
    - **Validates: Requirements 10.1**
  
  - [~] 12.4 Write integration tests for skill effects
    - Test skill activation and effect execution
    - Test skill effect chaining (multi-hit, status effects)
    - Test edge cases (no targets, already dead targets)
    - _Requirements: 10.1, 10.2, 10.4_

- [ ] 13. Stat scaling implementation
  - [~] 13.1 Define stat scaling formulas per tier and role
    - Create scaling configuration object with formulas
    - Define HP, Attack, Defense scaling per tier (1-5)
    - Define role-specific modifiers (Tanker: +HP, Assassin: +Attack, etc.)
    - _Requirements: 11.2, 11.4_
  
  - [~] 13.2 Implement stat scaling in level-up logic
    - Apply scaling formulas when unit levels up
    - Calculate stat increases based on tier and role
    - Update unit stats (hp, hpMax, atk, def, etc.)
    - _Requirements: 11.1, 11.2_
  
  - [~] 13.3 Identify units without stat scaling configuration
    - Scan all units and verify scaling is applied
    - Report units missing scaling configuration
    - _Requirements: 11.3_
  
  - [~] 13.4 Write property test for stat scaling on level up
    - **Property 17: Stat Scaling on Level Up**
    - **Validates: Requirements 11.1, 11.2**
  
  - [~] 13.5 Write property test for stat scaling consistency
    - **Property 18: Stat Scaling Consistency**
    - **Validates: Requirements 11.4**
  
  - [~] 13.6 Write unit tests for stat scaling
    - Test scaling for each tier (1-5)
    - Test role-specific modifiers
    - Test multiple level-ups (cumulative scaling)
    - _Requirements: 11.1, 11.2, 11.4_

- [ ] 14. Final validation and integration testing
  - [~] 14.1 Run complete test suite
    - Execute all unit tests, property tests, and integration tests
    - Verify all tests pass with no failures
    - Check test coverage for critical paths
    - _Requirements: All_
  
  - [~] 14.2 Run verify_data.cjs validation
    - Confirm zero duplicate emojis
    - Confirm exactly 120 units with correct distribution
    - Confirm all skills have valid descriptions and numeric values
    - Confirm no geometric terms in skill descriptions
    - _Requirements: 1.1, 2.1, 9.1, 12.1, 12.2_
  
  - [~] 14.3 Write integration tests for multi-kill scenarios
    - Test Leopard multi-kill with gold stacking
    - Test Fox double-kill with gold rewards
    - Test combat with multiple skill activations
    - _Requirements: 6.4, 7.3_
  
  - [~] 14.4 Write integration tests for knockback with occupied positions
    - Test knockback when target position occupied
    - Test knockback at board boundaries
    - Test knockback with multiple units in formation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 15. Final checkpoint - Complete validation
  - Ensure all tests pass (unit, property, integration)
  - Verify verify_data.cjs reports no errors
  - Confirm all 13 requirements are satisfied
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across random inputs
- Unit tests validate specific examples and edge cases
- All code changes are in JavaScript (game/src/ and game/tests/)
- Data changes are in CSV files (game/data/units.csv, game/data/skills.csv)
- Validation script is game/verify_data.cjs
