# Task 5.1.5: PlanningScene Orchestration Analysis

**Date**: 2025-01-XX  
**Task**: 5.1.5 Refactor PlanningScene to orchestration only  
**Requirements**: 8.2, 8.3, 8.4, 8.6, 8.7

## Executive Summary

**Status**: ⚠️ PARTIALLY COMPLETE

PlanningScene has been successfully refactored for shop, board, upgrade, and synergy operations (tasks 5.1.1-5.1.4). However, **significant combat business logic remains in PlanningScene** that should be delegated to CombatSystem.

## What's Been Completed ✅

### 1. Shop Logic (Task 5.1.1) ✅
- `rollShop()` → `ShopSystem.refreshShop()`
- `buyFromShop()` → `ShopSystem.buyUnit()`
- `sellUnit()` → `ShopSystem.sellUnit()`
- `toggleLock()` → `ShopSystem.lockShop()` / `unlockShop()`
- `refreshShop()` → `ShopSystem.generateShopOffers()`

### 2. Board Logic (Task 5.1.2) ✅
- `moveUnit()` → `BoardSystem.moveUnit()`, `placeBenchUnitOnBoard()`, etc.
- `sellUnit()` → `BoardSystem.getUnitAt()`, `removeUnit()`
- All board queries → `BoardSystem.getUnitAt()`
- Deploy count → `BoardSystem.getDeployCount()`

### 3. Upgrade Logic (Task 5.1.3) ✅
- `tryAutoMerge()` → `UpgradeSystem.tryAutoMerge()`
- `getEquipmentNameKey()` → `UpgradeSystem.getEquipmentNameKey()`

### 4. Synergy Logic (Task 5.1.4) ✅
- `computeSynergyCounts()` → `SynergySystem.calculateSynergies()`
- `applySynergyBonuses()` → `SynergySystem.applySynergyBonusesToTeam()`
- `getSynergyBonus()` → `SynergySystem.getSynergyBonus()`
- `formatBonusSet()` → `SynergySystem.formatBonusSet()`

## What Remains: Combat Business Logic ⚠️

### Critical Issue: CombatSystem Not Imported

**File**: `game/src/scenes/PlanningScene.js` (Line 1-180)

**Current imports**:
```javascript
import { BoardSystem } from "../systems/BoardSystem.js";
import { UpgradeSystem } from "../systems/UpgradeSystem.js";
import { SynergySystem } from "../systems/SynergySystem.js";
import { ShopSystem } from "../systems/ShopSystem.js";
import { generateEnemyTeam, computeEnemyTeamSize, AI_SETTINGS, getAISettings } from "../systems/AISystem.js";
```

**Missing**:
```javascript
import { CombatSystem } from "../systems/CombatSystem.js";
```

### Combat Business Logic Still in PlanningScene

The following methods contain combat business logic that should be in CombatSystem:

#### 1. Turn Order Management (Lines 6036-6082)

**Current Implementation** (in PlanningScene):
```javascript
buildTurnQueue() {
  const leftOrder = this.buildOrderForSide("LEFT");
  const rightOrder = this.buildOrderForSide("RIGHT");
  const maxLen = Math.max(leftOrder.length, rightOrder.length);
  const queue = [];
  for (let i = 0; i < maxLen; i += 1) {
    if (leftOrder[i]) queue.push(leftOrder[i]);
    if (rightOrder[i]) queue.push(rightOrder[i]);
  }
  this.turnQueue = queue;
  this.turnIndex = 0;
}

buildOrderForSide(side) {
  const list = [];
  if (side === "LEFT") {
    for (let col = PLAYER_COLS - 1; col >= 0; col -= 1) {
      for (let row = 0; row < ROWS; row += 1) {
        const unit = this.getCombatUnitAt(side, row, col);
        if (unit) list.push(unit);
      }
    }
  } else {
    for (let col = RIGHT_COL_START; col <= RIGHT_COL_END; col += 1) {
      for (let row = 0; row < ROWS; row += 1) {
        const unit = this.getCombatUnitAt(side, row, col);
        if (unit) list.push(unit);
      }
    }
  }
  return list;
}
```

**Should be**: Delegated to `CombatSystem.calculateTurnOrder()` or `CombatSystem.initializeCombat()`

**Issue**: Turn order calculation is combat business logic, not scene orchestration.

#### 2. Combat Step Execution (Lines 6084-6150)

**Current Implementation** (in PlanningScene):
```javascript
async stepCombat() {
  if (this.phase !== PHASE.COMBAT) return;
  if (this.isActing) return;
  this.clearAttackPreview();

  const leftAlive = this.getCombatUnits("LEFT").length;
  const rightAlive = this.getCombatUnits("RIGHT").length;
  if (!leftAlive || !rightAlive) {
    this.resolveCombat(leftAlive > 0 ? "LEFT" : "RIGHT");
    return;
  }

  if (this.turnQueue.length === 0 || this.turnIndex >= this.turnQueue.length) {
    this.buildTurnQueue();
    if (!this.turnQueue.length) {
      this.resolveCombat("RIGHT");
      return;
    }
  }

  const actor = this.turnQueue[this.turnIndex];
  this.turnIndex += 1;
  if (!actor || !actor.alive) {
    this.refreshQueuePreview();
    return;
  }

  this.actionCount += 1;
  if (this.actionCount > 100 && this.actionCount % 5 === 0) {
    this.globalDamageMult += 0.2;
    this.addLog(`Sudden death x${this.globalDamageMult.toFixed(1)} damage.`);
  }

  this.isActing = true;
  this.highlightUnit(actor, 0xffef9f);
  const skipped = this.processStartTurn(actor);
  if (skipped) {
    this.addLog(`${actor.name} bo luot (${skipped}).`);
  } else {
    const target = this.selectTarget(actor);
    if (target) {
      if (actor.rage >= actor.rageMax && actor.statuses.silence <= 0) {
        if (actor.classType !== "MAGE") {
          actor.rage = 0;
        }
        this.updateCombatUnitUi(actor);
        await this.castSkill(actor, target);
      } else {
        await this.basicAttack(actor, target);
      }
    }
  }

  this.clearHighlights();
  this.refreshQueuePreview();
  this.refreshHeader();
  this.isActing = false;

  const leftNow = this.getCombatUnits("LEFT").length;
  const rightNow = this.getCombatUnits("RIGHT").length;
  if (!leftNow || !rightNow) {
    this.resolveCombat(leftNow > 0 ? "LEFT" : "RIGHT");
  } else if (this.actionCount >= 240) {
    const leftHp = this.getCombatUnits("LEFT").reduce((s, u) => s + u.hp, 0);
    const rightHp = this.getCombatUnits("RIGHT").reduce((s, u) => s + u.hp, 0);
    this.resolveCombat(leftHp >= rightHp ? "LEFT" : "RIGHT");
  }
}
```

**Should be**: Delegated to `CombatSystem.executeAction()` or `CombatSystem.stepCombat()`

**Issues**:
- Combat end detection logic (checking alive units)
- Turn queue management
- Action count and sudden death logic
- Rage management and skill/attack decision
- Combat resolution triggering

#### 3. Target Selection (Lines 6225-6300)

**Current Implementation** (in PlanningScene):
```javascript
selectTarget(attacker, options = {}) {
  // Complex target selection logic with priority rules
  // Scoring, distance calculations, frontline/backline logic
}

compareTargets(attacker, a, b) {
  // Target comparison logic
}

scoreTarget(attacker, target) {
  // Target scoring logic based on class, HP, position
}

distanceToFrontline(unit) {
  // Distance calculation
}

distanceToBackline(unit) {
  // Distance calculation
}
```

**Should be**: Delegated to `CombatSystem.selectTarget()` or similar

**Issue**: Target selection is combat AI logic, not scene orchestration.

#### 4. Status Effect Processing (Lines 6153-6224)

**Current Implementation** (in PlanningScene):
```javascript
processStartTurn(unit) {
  // Status effect ticking logic
  // Stun, freeze, burn, poison, etc.
}

tickTimedStatus(unit, key) {
  // Status effect duration management
}
```

**Should be**: Delegated to `CombatSystem.tickStatusEffects()` or `CombatSystem.processStartTurn()`

**Issue**: Status effect logic is combat business logic.

#### 5. Damage Calculation (Lines 7096-7251)

**Current Implementation** (in PlanningScene):
```javascript
resolveDamage(attacker, defender, rawDamage, damageType, reason, options = {}) {
  // Complex damage calculation with:
  // - Defense/magic defense
  // - Elemental advantages
  // - Evasion checks
  // - Critical hits
  // - Shields
  // - Damage multipliers
  // - HP updates
}
```

**Should be**: Delegated to `CombatSystem.calculateDamage()` and `CombatSystem.applyDamage()`

**Issue**: Damage calculation is core combat business logic.

#### 6. Skill Execution (Lines 6305-7050)

**Current Implementation** (in PlanningScene):
```javascript
async basicAttack(attacker, target) {
  // Basic attack logic
}

async castSkill(attacker, target) {
  // Skill casting logic
}

async runActionPattern(attacker, target, pattern, impactFn) {
  // Action pattern execution
}

async applySkillEffect(attacker, target, skill) {
  // Massive skill effect application logic (700+ lines)
  // All skill types: damage, heal, buff, debuff, etc.
}

calcSkillRaw(attacker, skill) {
  // Skill damage calculation
}
```

**Should be**: Delegated to `CombatSystem.executeSkill()`, `CombatSystem.executeBasicAttack()`, etc.

**Issue**: Skill execution is combat business logic, not scene orchestration.

## What Should Remain in PlanningScene ✅

The following are appropriate scene responsibilities:

### 1. Phaser Lifecycle Methods ✅
- `init(data)` - Scene initialization
- `create()` - Scene creation
- `update(time, delta)` - Scene update loop
- `shutdown()` - Scene cleanup (if exists)

### 2. Rendering and Animation ✅
- `drawBoard()` - Board rendering
- `refreshBoardUi()` - Board UI updates
- `refreshShopUi()` - Shop UI updates
- `refreshBenchUi()` - Bench UI updates
- `refreshHeader()` - Header UI updates
- `showFloatingText()` - Floating text animations
- `showDamageNumber()` - Damage number animations
- `tweenCombatUnit()` - Unit movement animations
- `highlightUnit()` - Unit highlighting
- `clearHighlights()` - Clear highlights

### 3. User Input Handling ✅
- `setupInput()` - Input setup
- `setupGamepadInput()` - Gamepad setup
- `setupBoardViewInput()` - Board input handling
- `startUnitDrag()` - Drag start
- `updateUnitDrag()` - Drag update
- `endUnitDrag()` - Drag end
- `onPlayerCellClick()` - Cell click handler
- `onBenchClick()` - Bench click handler
- `handleRightClick()` - Right click handler

### 4. UI Orchestration ✅
- `refreshPlanningUi()` - Refresh all planning UI
- `createHud()` - Create HUD elements
- `createButtons()` - Create buttons
- `createSettingsOverlay()` - Create settings
- `createWikiModal()` - Create wiki modal
- `toggleSettingsOverlay()` - Toggle settings
- `toggleWikiModal()` - Toggle wiki

### 5. Scene Transitions ✅
- `beginCombat()` - Start combat phase
- `resolveCombat()` - End combat phase
- `enterPlanning()` - Enter planning phase
- `goMainMenu()` - Return to main menu

### 6. Logging and Persistence ✅
- `addLog()` - Add log message
- `updateLogText()` - Update log display
- `persistProgress()` - Save game state
- `exportRunState()` - Export state
- `applyRunState()` - Load state

## Requirements Analysis

### Requirement 8.2: Scene contains only Phaser lifecycle methods ⚠️
**Status**: PARTIALLY MET
- ✅ Has proper lifecycle methods (init, create, update)
- ⚠️ But also has combat business logic that should be in CombatSystem

### Requirement 8.3: Scene contains only rendering and animation code ⚠️
**Status**: PARTIALLY MET
- ✅ Has proper rendering methods (drawBoard, refreshUi, etc.)
- ⚠️ But also has combat logic mixed with rendering

### Requirement 8.4: Scene contains only user input handling ✅
**Status**: MET
- ✅ Proper input handling for drag-and-drop, clicks, gamepad

### Requirement 8.6: Scene delegates all business logic to systems ⚠️
**Status**: PARTIALLY MET
- ✅ Shop logic → ShopSystem
- ✅ Board logic → BoardSystem
- ✅ Upgrade logic → UpgradeSystem
- ✅ Synergy logic → SynergySystem
- ⚠️ Combat logic → Still in PlanningScene (should be in CombatSystem)

### Requirement 8.7: Scene handles success/error results from systems ✅
**Status**: MET
- ✅ Properly handles results from ShopSystem, BoardSystem, etc.
- ✅ Displays error messages to user

## Recommendations

### Option 1: Complete Combat Refactoring (Recommended)

**Pros**:
- Fully complies with architecture requirements
- Combat logic testable independently
- Consistent with other system extractions
- Easier to maintain and extend

**Cons**:
- Significant refactoring effort
- Risk of introducing bugs in combat
- Requires extensive testing

**Estimated Effort**: 3-4 days

### Option 2: Document Current State as Acceptable

**Pros**:
- No additional work required
- Combat currently works correctly
- Lower risk of introducing bugs

**Cons**:
- Violates architecture requirements 8.2, 8.3, 8.6
- Inconsistent with other systems
- Combat logic harder to test independently
- Future maintenance more difficult

**Estimated Effort**: 1 hour (documentation only)

### Option 3: Hybrid Approach

**Pros**:
- Refactor most critical combat logic
- Leave some scene-specific combat code
- Balance between effort and compliance

**Cons**:
- Still partially violates requirements
- Unclear boundary between scene and system

**Estimated Effort**: 1-2 days

## Conclusion

PlanningScene has been successfully refactored for shop, board, upgrade, and synergy operations. However, **significant combat business logic remains** that should be delegated to CombatSystem to fully meet the architecture requirements.

**Recommendation**: Proceed with Option 1 (Complete Combat Refactoring) to:
1. Import CombatSystem
2. Delegate turn order management to CombatSystem
3. Delegate combat step execution to CombatSystem
4. Delegate target selection to CombatSystem
5. Delegate status effect processing to CombatSystem
6. Delegate damage calculation to CombatSystem
7. Delegate skill execution to CombatSystem

This will ensure PlanningScene is truly "orchestration only" as required by the architecture.

## Next Steps

1. **User Decision Required**: Choose between Option 1, 2, or 3
2. If Option 1: Create detailed refactoring plan for combat logic extraction
3. If Option 2: Document exceptions and mark task as complete
4. If Option 3: Define specific combat logic to extract vs. keep

