# Task 5.2.1 Analysis: Remove Combat Logic from CombatScene

## Current State Analysis

### ✅ Already Delegated to CombatSystem

1. **Combat Initialization** - `beginCombat()` uses `CombatSystem.initializeCombat()`
   - Line 1956: `this.combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits)`
   - Turn order is taken from CombatSystem

2. **Turn Order Logic** - `stepCombat()` uses CombatSystem turn order
   - Line 1960: `this.turnQueue = this.combatState.turnOrder`
   - Line 3525: Rebuilds turn queue using `CombatSystem.initializeCombat()`

3. **Action Execution** - `stepCombat()` uses `CombatSystem.executeAction()`
   - Line 3598: `const actionResult = CombatSystem.executeAction(this.combatState, actor)`
   - Determines whether to use skill or basic attack

4. **Status Effect Ticking** - `stepCombat()` uses `CombatSystem.tickStatusEffects()`
   - Line 3551: `const statusResult = CombatSystem.tickStatusEffects(actor, this.combatState)`
   - Handles DoT effects, control effects

5. **Combat End Checking** - `stepCombat()` uses `CombatSystem.checkCombatEnd()`
   - Line 3509: `const combatEndResult = CombatSystem.checkCombatEnd(this.combatState)`
   - Line 3638: Checks again after action

6. **Damage Application** - Uses `CombatSystem.applyDamage()`
   - Line 3559: `CombatSystem.applyDamage(actor, effect.damage, this.combatState)`

### ⚠️ Still Contains Combat Logic

1. **Damage Calculation** - `resolveDamage()` method (lines 4697-4900+)
   - Contains complex damage calculation logic:
     - Defense calculations
     - Critical hit calculations
     - Elemental advantage calculations
     - Shield absorption
     - Reflect damage
     - Counter attacks
     - Lifesteal
     - Status effect application on hit
   - **Should use**: `CombatSystem.calculateDamage()` for the calculation part
   - **Should keep**: Animation, UI updates, floating text

2. **Skill Effect Application** - `applySkillEffect()` method (lines 3833+)
   - Contains skill-specific effect logic for each skill type
   - Calls `resolveDamage()` which has calculation logic
   - **Note**: CombatSystem.executeSkill() is just validation, not execution
   - **Architecture decision needed**: Should skill effects be in CombatSystem or Scene?

3. **Status Effect Processing** - `processStartTurn()` method (lines 3645-3730)
   - Contains manual status effect ticking logic
   - **Already partially replaced** by `CombatSystem.tickStatusEffects()`
   - **Should be removed**: This method is redundant now

## Recommended Changes

### High Priority

1. **Refactor `resolveDamage()` to use `CombatSystem.calculateDamage()`**
   - Split into two parts:
     - Calculation: Use `CombatSystem.calculateDamage()`
     - Rendering: Keep animation, UI, floating text in Scene
   - This is the main combat logic that needs extraction

2. **Remove `processStartTurn()` method**
   - This is now redundant since `CombatSystem.tickStatusEffects()` is used
   - Clean up any remaining calls to this method

### Medium Priority

3. **Document skill effect architecture**
   - Clarify whether skill effects should be in CombatSystem or Scene
   - Current approach: Scene handles skill effects (orchestration + rendering)
   - CombatSystem handles rules (validation, targeting)

### Low Priority

4. **Extract remaining combat calculations**
   - Hit chance/evasion (currently in `resolveDamage`)
   - Shield absorption logic
   - Reflect damage logic
   - Counter attack logic
   - Lifesteal logic

## Architecture Notes

The current architecture follows this pattern:
- **CombatSystem**: Rules, validation, state management
- **CombatScene**: Orchestration, rendering, animations, UI

This is a reasonable separation. The main issue is that `resolveDamage()` mixes calculation (should be in CombatSystem) with rendering (should be in Scene).

## Conclusion

The task is **mostly complete**. The main remaining work is:
1. Refactor `resolveDamage()` to use `CombatSystem.calculateDamage()`
2. Remove redundant `processStartTurn()` method

However, this requires careful refactoring to avoid breaking existing functionality and tests.
