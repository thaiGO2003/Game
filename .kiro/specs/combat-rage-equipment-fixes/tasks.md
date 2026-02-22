# Implementation Plan - Combat Rage Equipment Fixes

## Bug 1: Equipment Rage Bonuses Not Applied

- [x] 1. Write bug condition exploration test for equipment rage bonuses
  - **Property 1: Fault Condition** - Equipment startingRage Not Applied
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate startingRage is not being applied
  - **Scoped PBT Approach**: Test units with equipment having startingRage values (1-4) to ensure rage is applied at combat start
  - Test that units with startingRage equipment begin combat with increased rage (from Fault Condition 1.1, 1.2)
  - Test that startingRage bonus is capped at 4 maximum (from Expected Behavior 2.2)
  - Test that units with low rageMax start with min(rageMax, startingRage) (from Expected Behavior 2.3)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "unit with +2 startingRage equipment starts with 0 rage instead of 2")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests for equipment rage system (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Rage Mechanics Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for units without startingRage equipment
  - Write property-based tests capturing observed behavior patterns:
    - Units without equipment start with 0 rage (from Preservation 3.1)
    - Units gain rage when attacking or being attacked (from Preservation 3.1)
    - Rage is capped at rageMax (from Preservation 3.3)
    - Skills can be used when rage >= rageMax (from Preservation 3.2)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Fix equipment rage bonus application

  - [x] 3.1 Implement startingRage application at combat start
    - Locate combat initialization code (likely in CombatSystem or CombatScene)
    - Sum all startingRage values from equipped items for each unit
    - Cap total startingRage bonus at 4
    - Set initial rage to min(rageMax, startingRage)
    - Ensure equipment generation caps individual startingRage at 4
    - _Bug_Condition: isBugCondition(unit) where unit has equipment with startingRage > 0_
    - _Expected_Behavior: unit.rage = min(unit.rageMax, min(4, sum(equipment.startingRage)))_
    - _Preservation: Rage gain mechanics, rageMax cap, skill usage conditions from Preservation Requirements_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Equipment startingRage Applied Correctly
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Rage Mechanics Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug 2: Assassin Basic Attacks Target Nearest Instead of Farthest

- [x] 4. Write bug condition exploration test for Assassin targeting
  - **Property 1: Fault Condition** - Assassin Targets Nearest Enemy
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate Assassin targets nearest instead of farthest
  - **Scoped PBT Approach**: Test Assassin basic attacks with various enemy positions to confirm incorrect targeting
  - Test that Assassin basic attacks target nearest enemy instead of farthest (from Fault Condition 2.1)
  - Test with multiple enemies at different distances
  - Test tie-breaking behavior when multiple enemies are equidistant (from Fault Condition 2.3)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Assassin at (0,0) attacks enemy at (1,0) instead of enemy at (2,0)")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.3, 2.5, 2.6, 2.7_

- [x] 5. Write preservation property tests for targeting system (BEFORE implementing fix)
  - **Property 2: Preservation** - Other Role Targeting Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-Assassin roles
  - Write property-based tests capturing observed behavior patterns:
    - TANKER and FIGHTER target nearest enemy (from Preservation 3.4)
    - ARCHER, MAGE, SUPPORT use their existing targeting logic (from Preservation 3.5)
    - Skills with actionPattern use pattern-specific targeting (from Preservation 3.6)
    - Assassin skills with ASSASSIN_BACK pattern target farthest (from Fault Condition 2.2)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 6. Fix Assassin basic attack targeting

  - [x] 6.1 Implement farthest enemy targeting for Assassin basic attacks
    - Locate targeting logic in AISystem or CombatSystem
    - Identify where basic attack targets are selected
    - Add role-specific check for ASSASSIN role
    - Implement farthest distance calculation for Assassin basic attacks
    - Implement tie-breaking: same row → top row → bottom row (from Expected Behavior 2.6, 2.7)
    - Ensure skill-based targeting (ASSASSIN_BACK) remains unchanged
    - _Bug_Condition: isBugCondition(action) where action.role === 'ASSASSIN' AND action.isBasicAttack_
    - _Expected_Behavior: target = farthestEnemy(enemies) with tie-breaking by row priority_
    - _Preservation: Other roles' targeting logic, skill-based targeting patterns from Preservation Requirements_
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 3.4, 3.5, 3.6_

  - [x] 6.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Assassin Targets Farthest Enemy
    - **IMPORTANT**: Re-run the SAME test from task 4 - do NOT write a new test
    - The test from task 4 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 4
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 6.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Other Role Targeting Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 5 - do NOT write new tests
    - Run preservation property tests from step 5
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug 3: Tier 3 Crafting Recipe Requirements

- [x] 7. Write bug condition exploration test for tier 3 recipes
  - **Property 1: Fault Condition** - Tier 3 Recipes Insufficient Requirements
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate tier 3 recipes have insufficient requirements
  - **Scoped PBT Approach**: Test all tier 3 recipes to verify they meet minimum requirements
  - Test that tier 3 recipes require at least 6 ingredients (from Expected Behavior 2.8)
  - Test that tier 3 recipes require at least 1 tier 2 item (from Expected Behavior 2.9)
  - Test that 1-star units cannot equip tier 3 items (from Fault Condition 3.3)
  - Test equipment tier restrictions by unit star level (from Expected Behavior 2.11, 2.12, 2.13)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "tier 3 recipe only requires 4 ingredients", "1-star unit can equip tier 3 item")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 3.1, 3.2, 3.3, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

- [x] 8. Write preservation property tests for crafting system (BEFORE implementing fix)
  - **Property 2: Preservation** - Tier 1 and 2 Recipes Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for tier 1 and tier 2 recipes
  - Write property-based tests capturing observed behavior patterns:
    - Tier 1 recipes require 1-4 basic ingredients (from Preservation 3.7)
    - Tier 2 recipes require 3 ingredients with at least 1 tier 1 item (from Preservation 3.8)
    - Equipment bonuses are applied when crafted (from Preservation 3.9)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.7, 3.8, 3.9_

- [x] 9. Fix tier 3 crafting recipe requirements and equipment restrictions

  - [x] 9.1 Update tier 3 recipe requirements
    - Locate recipe definitions (likely in data files or recipe system)
    - Update all tier 3 recipes to require minimum 6 ingredients
    - Ensure all tier 3 recipes include at least 1 tier 2 item
    - Consider updating to 9 ingredients for full 3x3 grid utilization (from Expected Behavior 2.10)
    - Add tier 1 equipment items if needed for balance (from Expected Behavior 2.14)
    - _Bug_Condition: isBugCondition(recipe) where recipe.tier === 3 AND (recipe.ingredients.length < 6 OR !hasTier2Item(recipe))_
    - _Expected_Behavior: recipe.ingredients.length >= 6 AND hasTier2Item(recipe.ingredients)_
    - _Preservation: Tier 1 and 2 recipe requirements, equipment bonus application from Preservation Requirements_
    - _Requirements: 3.1, 3.2, 2.8, 2.9, 2.10, 2.14, 3.7, 3.8, 3.9_

  - [x] 9.2 Implement equipment tier restrictions by unit star level
    - Locate equipment equipping logic (likely in BoardSystem or unit management)
    - Add validation: 1-star units can only equip tier 1 items
    - Add validation: 2-star units can equip tier 1 and tier 2 items
    - Add validation: 3-star units can equip tier 1, 2, and 3 items
    - Prevent tier 3 items from being equipped on units with insufficient stars
    - _Bug_Condition: isBugCondition(unit, equipment) where equipment.tier > unit.stars_
    - _Expected_Behavior: canEquip(unit, equipment) = (equipment.tier <= unit.stars)_
    - _Preservation: Equipment bonus application from Preservation Requirements_
    - _Requirements: 3.3, 2.11, 2.12, 2.13, 3.9_

  - [x] 9.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Tier 3 Requirements and Restrictions Met
    - **IMPORTANT**: Re-run the SAME test from task 7 - do NOT write a new test
    - The test from task 7 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 7
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

  - [x] 9.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Tier 1 and 2 Recipes Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 8 - do NOT write new tests
    - Run preservation property tests from step 8
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug 4: Non-MAGE Roles Not Resetting Rage After Skills

- [x] 10. Write bug condition exploration test for rage reset
  - **Property 1: Fault Condition** - Non-MAGE Roles Keep Rage After Skills
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate non-MAGE roles don't reset rage after using skills
  - **Scoped PBT Approach**: Test WARRIOR, ASSASSIN, TANKER, SUPPORT roles using skills to verify rage is not reset
  - Test that non-MAGE roles (WARRIOR, ASSASSIN, TANKER, SUPPORT) don't reset rage to 0 after using skills (from Fault Condition 4.1)
  - Test that MAGE role keeps rage after using skills (from Fault Condition 4.2)
  - Test that MAGE doesn't gain rage based on targets hit (from Fault Condition 4.3)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "WARRIOR with 5 rage uses skill, still has 5 rage instead of 0")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 4.1, 4.2, 4.3, 2.15, 2.16, 2.17, 2.18_

- [x] 11. Write preservation property tests for skill mechanics (BEFORE implementing fix)
  - **Property 2: Preservation** - Skill Effects and Conditions Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for skill effects and conditions
  - Write property-based tests capturing observed behavior patterns:
    - MAGE skills don't reset rage (from Preservation 3.10)
    - MAGE AOE skills damage multiple targets (from Preservation 3.11)
    - Skills with special effects (stun, freeze) apply correctly (from Preservation 3.12)
    - Skills with special conditions (void_execute_v2) execute correctly (from Preservation 3.13)
    - Silenced units cannot use skills (from Preservation 3.14)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.10, 3.11, 3.12, 3.13, 3.14_

- [x] 12. Fix rage reset for non-MAGE roles and MAGE rage gain

  - [x] 12.1 Implement rage reset after skill use for non-MAGE roles
    - Locate skill execution code (likely in CombatSystem)
    - After skill execution, check unit role
    - If role is WARRIOR, ASSASSIN, TANKER, or SUPPORT: reset rage to 0
    - If role is MAGE: keep rage unchanged
    - _Bug_Condition: isBugCondition(unit) where unit.role !== 'MAGE' AND unit.usedSkill_
    - _Expected_Behavior: unit.rage = 0 after skill use for non-MAGE roles_
    - _Preservation: MAGE rage retention, skill effects, special conditions from Preservation Requirements_
    - _Requirements: 4.1, 4.2, 2.15, 2.16, 3.10, 3.11, 3.12, 3.13, 3.14_

  - [x] 12.2 Implement MAGE rage gain based on targets hit
    - In skill execution code, after MAGE uses skill
    - Count number of enemies affected by the skill
    - Increase MAGE rage by number of targets hit
    - Cap rage at rageMax
    - Review and adjust MAGE rageMax values if too high (>7) to 6-7 range (from Expected Behavior 2.18)
    - _Bug_Condition: isBugCondition(unit) where unit.role === 'MAGE' AND unit.usedSkill_
    - _Expected_Behavior: unit.rage += min(targetsHit, rageMax - unit.rage)_
    - _Preservation: MAGE AOE damage, skill effects from Preservation Requirements_
    - _Requirements: 4.3, 2.17, 2.18, 3.11, 3.12_

  - [x] 12.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Rage Reset and MAGE Gain Correct
    - **IMPORTANT**: Re-run the SAME test from task 10 - do NOT write a new test
    - The test from task 10 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 10
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.15, 2.16, 2.17, 2.18_

  - [x] 12.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Skill Effects and Conditions Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 11 - do NOT write new tests
    - Run preservation property tests from step 11
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Bug 5: TANKER Not Auto-Casting Skill When Attacked

- [x] 13. Write bug condition exploration test for TANKER auto-cast
  - **Property 1: Fault Condition** - TANKER Doesn't Auto-Cast at Full Rage
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate TANKER doesn't auto-cast when attacked at full rage
  - **Scoped PBT Approach**: Test TANKER units with rage >= rageMax being attacked to verify no auto-cast
  - Test that TANKER with rage >= rageMax doesn't auto-cast skill when attacked (from Fault Condition 5.1)
  - Test that TANKER with rage < rageMax doesn't auto-cast (from Fault Condition 5.2)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "TANKER with rage=5, rageMax=5 is attacked but doesn't cast skill")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 5.1, 5.2, 2.19, 2.20, 2.21_

- [x] 14. Write preservation property tests for combat flow (BEFORE implementing fix)
  - **Property 2: Preservation** - Normal Combat Flow Preserved
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for normal combat flow
  - Write property-based tests capturing observed behavior patterns:
    - Units take damage when attacked (basic combat flow)
    - Skills execute normally when manually triggered
    - Silenced units cannot use skills (from Preservation 3.14)
    - Other roles don't auto-cast when attacked
    - Skill effects apply correctly (from Preservation 3.12)
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.12, 3.14_

- [x] 15. Fix TANKER auto-cast skill when attacked

  - [x] 15.1 Implement TANKER auto-cast on being attacked
    - Locate damage receiving code (likely in CombatSystem)
    - Before applying damage to TANKER, check if rage >= rageMax
    - Check if TANKER is not silenced and has valid skill
    - If conditions met, trigger skill execution immediately
    - Execute skill before damage is applied (from Expected Behavior 2.20)
    - Ensure rage is reset to 0 after auto-cast (consistent with task 12.1)
    - _Bug_Condition: isBugCondition(unit) where unit.role === 'TANKER' AND unit.rage >= unit.rageMax AND unit.isBeingAttacked_
    - _Expected_Behavior: autocast skill before damage, then reset rage to 0_
    - _Preservation: Normal damage flow, silence effects, other roles' behavior from Preservation Requirements_
    - _Requirements: 5.1, 5.2, 2.19, 2.20, 2.21, 3.12, 3.14_

  - [x] 15.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - TANKER Auto-Casts Correctly
    - **IMPORTANT**: Re-run the SAME test from task 13 - do NOT write a new test
    - The test from task 13 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 13
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.19, 2.20, 2.21_

  - [x] 15.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Normal Combat Flow Preserved
    - **IMPORTANT**: Re-run the SAME tests from task 14 - do NOT write new tests
    - Run preservation property tests from step 14
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

## Final Checkpoint

- [x] 16. Checkpoint - Ensure all tests pass
  - Run all exploration tests (tasks 1, 4, 7, 10, 13) - all should PASS
  - Run all preservation tests (tasks 2, 5, 8, 11, 14) - all should PASS
  - Verify no regressions in existing test suite
  - Ensure all 5 bugs are fixed and validated
  - Ask the user if questions arise
