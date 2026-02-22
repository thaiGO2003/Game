# Baseline Metrics - Code Architecture Refactor

**Date**: 2024-01-XX
**Branch**: main (before refactor)
**Purpose**: Establish baseline metrics before starting the major code architecture refactor

## Test Suite Results

### Overall Test Status
- **Total Test Files**: 68
- **Passed Test Files**: 60
- **Failed Test Files**: 8
- **Total Tests**: 917
- **Passed Tests**: 899
- **Failed Tests**: 18
- **Pass Rate**: 98.0%

### Test Execution Time
- **Total Duration**: 51.48s
- **Transform Time**: 2.67s
- **Setup Time**: 1.94s
- **Import Time**: 19.75s
- **Tests Time**: 17.29s
- **Environment Time**: 158.28s

### Failed Tests Summary

#### 1. combatTooltipAttackPreviewProperties.test.js (1 suite failure)
- **Error**: `TypeError: Cannot set properties of null (setting 'fillStyle')`
- **Location**: `node_modules/phaser/src/device/CanvasFeatures.js:74:23`
- **Type**: Phaser initialization issue in test environment

#### 2. assassinSkillUpgradeIntegration.test.js (3 test failures)
- Test: "should use upgraded skill for 3-star Fox (flame_combo → flame_combo_v2)"
  - Expected: `flame_combo`, Received: `unit_skill_fox_flame`
- Test: "should use upgraded skill for 2-star Mosquito (mosquito_drain → mosquito_drain_v2)"
  - Expected: `mosquito_drain`, Received: `unit_skill_mosquito_toxic`
- Test: "should use base skill for 2-star Bat when no _v2 exists (blood_bite)"
  - Expected: `blood_bite`, Received: `unit_skill_bat_blood`
- **Type**: Skill ID mismatch - test expectations don't match actual data

#### 3. csvRoundTrip.test.js (2 test failures)
- Test: "should confirm zero duplicate emojis after parsing units.csv"
- Test: "should have zero duplicate emojis in the current units.csv file"
- **Issue**: Duplicate emoji 🦬 used by:
  - Bò Rừng Xung Phong (triceratops_charge)
  - Bò Tây Tạng (yak_highland)
- **Type**: Data validation issue

#### 4. emojiUniqueness.test.js (3 test failures)
- Test: "should have unique emojis for all units in the catalog"
- Test: "should have exactly as many unique emojis as units (property-based)"
- Test: "should report all duplicate emojis with unit details"
- **Issue**: Same duplicate emoji 🦬 issue
- **Type**: Data validation issue

#### 5. encyclopedia.test.js (3 test failures)
- Test: "should group units by role correctly"
  - Expected: 20 units per role, Received: 17 for one role
- Test: "should have exactly 4 units per role-tier combination"
  - Expected: 4, Received: 3 for some combinations
- Test: "should support filtering by role"
  - Expected: 20 assassins, Received: 19
- **Type**: Unit catalog structure issue

#### 6. evasionBuffDebuff.test.js (1 test failure)
- Test: "should handle missing mods gracefully"
  - Expected: 0, Received: 0.05
- **Type**: Default value handling issue

#### 7. libraryModalProperties.test.js (4 test failures)
- Test: "should keep open/close/toggle behavior deterministic"
- Test: "should invoke onClose and return interaction when modal closes"
- Test: "should clamp modal size inside viewport for any valid resolution"
- Test: "should preserve scene phase/state after opening and closing library"
- **Error**: `TypeError: part?.setVisible is not a function`
- **Location**: `src/ui/LibraryModal.js:217:47`
- **Type**: UI component initialization issue in test environment

#### 8. waspSkillBalancing.test.js (2 test failures)
- Test: "should have wasp_sting unit with tier 1"
  - Expected: `wasp_triple_strike`, Received: `unit_skill_wasp_sting`
- Test: "should have garuda_divine unit with tier 5"
  - Expected: `wasp_triple_strike`, Received: `unit_skill_garuda_divine`
- **Type**: Skill ID mismatch - test expectations don't match actual data

## Test Coverage

**Note**: Test coverage metrics not yet collected. Need to configure vitest coverage reporting.

**Action Required**: Add coverage configuration to vitest.config.js and run tests with coverage flag.

## Performance Benchmarks

### Target Metrics (from requirements)
- Combat turn execution: < 16ms (60 FPS)
- Shop refresh operation: < 50ms
- Board synergy calculation: < 10ms
- Scene transition: < 100ms
- Game load time: < 2 seconds

### Actual Metrics
**Status**: Not yet measured

**Action Required**: 
1. Create performance benchmark tests for:
   - Combat turn execution
   - Shop refresh operation
   - Synergy calculation
   - Scene transitions
2. Run benchmarks and document baseline times

## Analysis

### Critical Issues
1. **18 failing tests** - These need to be addressed before starting the refactor
2. **No test coverage data** - Need to set up coverage reporting
3. **No performance benchmarks** - Need to create and run performance tests

### Test Failures Categories
- **Data validation issues** (8 failures): Duplicate emojis, unit catalog structure
- **Test environment issues** (5 failures): Phaser initialization, UI component mocking
- **Test expectation mismatches** (5 failures): Skill IDs don't match test expectations

### Recommendations
1. **Fix data validation issues first**: 
   - Resolve duplicate emoji (🦬) in units.csv
   - Verify unit catalog has correct role distribution
2. **Fix test environment setup**:
   - Improve Phaser mocking for LibraryModal tests
   - Fix canvas initialization for combat tooltip tests
3. **Update test expectations**:
   - Align skill ID expectations with actual data
   - Update assassin skill upgrade tests
   - Update wasp skill balancing tests
4. **Add missing metrics**:
   - Configure and run test coverage
   - Create and run performance benchmarks

## Next Steps

Before proceeding with the refactor:
1. ✅ Document baseline test results (this file)
2. ⏳ Fix failing tests to achieve 100% pass rate
3. ⏳ Add test coverage reporting
4. ⏳ Create and run performance benchmarks
5. ⏳ Document final baseline metrics

**Status**: Task 1.1 partially complete - baseline documented but not all metrics collected
