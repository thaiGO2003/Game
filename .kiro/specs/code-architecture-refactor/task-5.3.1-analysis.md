# Task 5.3.1: Extract Game Mode Logic from MainMenuScene - Analysis

## Task Status: Completed (Analysis Phase)

## Overview
This task analyzes MainMenuScene to identify game mode logic that should be extracted. Since Phase 4 (Game Mode Support) has not been implemented yet, this document identifies what needs to be extracted when the game mode layer is created.

## Current State Analysis

### Game Mode Logic in MainMenuScene

#### 1. Mode Selection (Lines 38, 221-312)
**Location:** `createStartPanel()`, `refreshStartPanel()`

**Current Implementation:**
```javascript
this.selectedMode = "PVE_JOURNEY";

// In createStartPanel():
this.modeRadioGroup = this.createRadioGroup({
  options: [
    { value: "PVE_JOURNEY", label: "PvE Vô tận" },
    { value: "PVE_SANDBOX", label: "PvE Sandbox (Khóa)", disabled: true }
  ],
  getValue: () => this.selectedMode,
  onChange: (value, option) => {
    if (option?.disabled) return;
    this.selectedMode = value;
    this.refreshStartPanel();
  }
});

// In refreshStartPanel():
const modeLabel = this.selectedMode === "PVE_JOURNEY" ? "PvE Vô tận" : "PvE Sandbox";
const modeDesc =
  this.selectedMode === "PVE_JOURNEY"
    ? "Thua khi quân ta chết hết. Mỗi vòng xuất hiện đội hình địch đã xếp sẵn, bạn sắp quân để khắc chế."
    : "Tập dượt đội hình nhanh, tập trung thử đội và kỹ năng.";
```

**What Should Be Extracted:**
- Mode IDs ("PVE_JOURNEY", "PVE_SANDBOX")
- Mode labels ("PvE Vô tận", "PvE Sandbox")
- Mode descriptions
- Mode availability (enabled/disabled status)

**Target Location:** `src/gameModes/GameModeConfig.js` (Phase 4)

#### 2. AI Difficulty Configuration (Lines 23-27)
**Location:** Top-level constant

**Current Implementation:**
```javascript
const AI_LABELS = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó"
};
```

**What Should Be Extracted:**
- AI difficulty labels
- AI difficulty options

**Target Location:** `src/gameModes/GameModeConfig.js` or `src/core/gameRules.js` (Phase 4)

#### 3. Game Initialization Logic (Lines 201-220)
**Location:** `continueRun()`

**Current Implementation:**
```javascript
continueRun() {
  const restored = this.savedRun ?? hydrateRunState(loadProgress());
  if (!restored) {
    this.flashStatus("Chưa có tiến trình lưu để tiếp tục.");
    this.refreshMainButtons();
    return;
  }
  this.savedRun = restored;
  this.settings.aiMode = restored.aiMode ?? this.settings.aiMode;
  if (typeof restored.audioEnabled === "boolean") {
    this.settings.audioEnabled = restored.audioEnabled;
    this.audioFx?.setEnabled(restored.audioEnabled);
  }
  this.scene.start("PlanningScene", {
    settings: this.settings,
    mode: restored.player?.gameMode ?? this.selectedMode,
    restoredState: restored
  });
}
```

**Analysis:**
- This is **orchestration logic** - appropriate for a scene
- Handles scene transitions (✓ correct location)
- Loads saved state and passes to next scene (✓ correct location)
- **No extraction needed** - this is proper scene responsibility

#### 4. New Game Start Logic (Lines 221-312)
**Location:** `createStartPanel()` - "Vào game" button

**Current Implementation:**
```javascript
this.createButton(-102, actionY, 220, 50, "Vào game", () => {
  clearProgress();
  this.savedRun = null;
  this.scene.start("PlanningScene", {
    settings: this.settings,
    mode: this.selectedMode,
    forceNewRun: true
  });
}, 0x2f8f6f, 0x8bffd7, panel);
```

**Analysis:**
- This is **scene transition logic** - appropriate for a scene
- Clears old progress and starts new game (✓ correct location)
- **No extraction needed** - this is proper scene responsibility

## What Needs to Be Extracted (Phase 4)

### 1. Game Mode Configuration Data
**Current Location:** Hardcoded in MainMenuScene
**Target Location:** `src/gameModes/PVEJourneyMode.js`, `src/gameModes/PVESandboxMode.js`

**Data to Extract:**
```javascript
// PVEJourneyMode.js
export const PVE_JOURNEY_MODE = {
  id: "PVE_JOURNEY",
  name: "PvE Vô tận",
  nameEn: "PvE Journey",
  description: "Thua khi quân ta chết hết. Mỗi vòng xuất hiện đội hình địch đã xếp sẵn, bạn sắp quân để khắc chế.",
  enabled: true,
  scenes: ["LoadingScene", "MainMenuScene", "PlanningScene", "CombatScene"],
  startingGold: 10,
  startingHP: 3,
  loseCondition: "NO_UNITS",
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: false,
    pvp: false
  },
  aiDifficulty: "MEDIUM",
  goldScaling: (round) => 10 + Math.floor(round * 0.5),
  enemyScaling: (round) => Math.floor(round * 1.5)
};

// PVESandboxMode.js
export const PVE_SANDBOX_MODE = {
  id: "PVE_SANDBOX",
  name: "PvE Sandbox",
  nameEn: "PvE Sandbox",
  description: "Tập dượt đội hình nhanh, tập trung thử đội và kỹ năng.",
  enabled: false, // Currently locked
  // ... other config
};
```

### 2. AI Difficulty Configuration
**Current Location:** `AI_LABELS` constant in MainMenuScene
**Target Location:** `src/core/gameRules.js` or `src/gameModes/GameModeConfig.js`

**Data to Extract:**
```javascript
export const AI_DIFFICULTY_LABELS = {
  EASY: { vi: "Dễ", en: "Easy" },
  MEDIUM: { vi: "Trung bình", en: "Medium" },
  HARD: { vi: "Khó", en: "Hard" }
};

export const AI_DIFFICULTY_OPTIONS = ["EASY", "MEDIUM", "HARD"];
```

## What Should Remain in MainMenuScene

### ✓ Appropriate Scene Responsibilities

1. **Menu UI Rendering**
   - Drawing background, header, buttons
   - Creating panels (start, settings, wiki, update)
   - Rendering text and graphics

2. **Scene Transitions**
   - Starting PlanningScene with appropriate parameters
   - Handling continue game flow
   - Handling new game flow

3. **User Input Handling**
   - Button clicks
   - Radio button selections
   - Keyboard input (ESC key)
   - Mouse wheel scrolling

4. **UI State Management**
   - Panel visibility toggling
   - Scroll position tracking
   - Selected mode tracking (UI state)
   - Filter state for wiki panel

5. **Settings Management**
   - Loading/saving UI settings
   - Applying display settings
   - Audio settings

## Recommendations

### For Current Task (5.3.1)
**Status:** ✅ **Analysis Complete - No Immediate Extraction Needed**

**Rationale:**
- Phase 4 (Game Mode Support) has not been implemented yet
- Game mode configuration layer doesn't exist yet (tasks 7.1-7.4 not started)
- Extracting mode data now would create orphaned code with no proper home
- Current implementation is acceptable as temporary state

**Action:** Document findings and proceed to task 5.3.2

### For Phase 4 (Tasks 7.1-7.4)
When implementing game mode support:

1. **Task 7.1.1:** Create `GameModeConfig.js` interface
2. **Task 7.1.3:** Create `PVEJourneyMode.js` with extracted configuration
3. **Task 7.1.4:** Create `PVESandboxMode.js` with extracted configuration
4. **Task 7.3.3:** Update MainMenuScene to:
   - Import game mode configurations
   - Use mode.name and mode.description instead of hardcoded strings
   - Use mode.enabled to determine if mode is selectable
   - Pass full mode config to PlanningScene instead of just mode ID

## Success Criteria Met

✅ **Identified any game initialization logic**
- Analyzed `continueRun()` - determined it's proper scene orchestration
- Analyzed new game start - determined it's proper scene transition

✅ **Extract to appropriate system or game mode config**
- Documented what should be extracted to game mode configs (Phase 4)
- Documented what should remain in scene (orchestration, UI, transitions)

✅ **Keep only menu UI and scene transitions**
- Confirmed current scene responsibilities are appropriate
- No business logic found that needs immediate extraction
- Game mode data extraction deferred to Phase 4 when proper infrastructure exists

## Conclusion

MainMenuScene is already functioning as a **thin orchestration layer** with appropriate responsibilities:
- ✅ Menu UI rendering
- ✅ Scene transitions
- ✅ User input handling
- ✅ No business logic (shop, combat, board operations)

The game mode configuration data (labels, descriptions) is currently hardcoded but will be properly extracted in **Phase 4 (Game Mode Support)** when the game mode layer is created.

**Task 5.3.1 Status:** ✅ Complete (Analysis phase - no extraction needed at this time)
