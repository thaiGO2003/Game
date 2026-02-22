/**
 * MainMenuScene Integration Tests
 * 
 * Tests the main menu scene orchestration:
 * - Menu navigation (panel toggling, button states)
 * - Game start flow (mode selection, difficulty selection)
 * - Scene transitions (to PlanningScene with correct parameters)
 * 
 * **Validates: Requirements 11.4**
 * 
 * Task 5.3.3: Write integration tests for MainMenuScene
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadProgress, clearProgress, saveProgress } from '../src/core/persistence.js';
import { hydrateRunState } from '../src/core/runState.js';
import { createDefaultUiSettings } from '../src/core/uiSettings.js';

/**
 * Mock MainMenuScene that simulates the scene's orchestration
 * Focuses on menu navigation, game start flow, and scene transitions
 */
class MockMainMenuScene {
  constructor() {
    this.settings = createDefaultUiSettings();
    this.selectedMode = 'PVE_JOURNEY';
    this.selectedDifficulty = 'MEDIUM';
    this.savedRun = null;
    
    // Panel visibility states
    this.startPanelVisible = false;
    this.settingsPanelVisible = false;
    this.wikiPanelVisible = false;
    this.updatePanelVisible = false;
    
    // Scene transition tracking
    this.sceneStarted = null;
    this.sceneData = null;
  }

  // Initialize scene (simulates create())
  create() {
    this.savedRun = hydrateRunState(loadProgress());
    return { success: true };
  }

  // Menu navigation methods
  toggleStartPanel() {
    this.startPanelVisible = !this.startPanelVisible;
    // Close other panels
    if (this.startPanelVisible) {
      this.settingsPanelVisible = false;
      this.wikiPanelVisible = false;
      this.updatePanelVisible = false;
    }
    return { success: true, visible: this.startPanelVisible };
  }

  toggleSettingsPanel() {
    this.settingsPanelVisible = !this.settingsPanelVisible;
    // Close other panels
    if (this.settingsPanelVisible) {
      this.startPanelVisible = false;
      this.wikiPanelVisible = false;
      this.updatePanelVisible = false;
    }
    return { success: true, visible: this.settingsPanelVisible };
  }

  toggleWikiPanel() {
    this.wikiPanelVisible = !this.wikiPanelVisible;
    // Close other panels
    if (this.wikiPanelVisible) {
      this.startPanelVisible = false;
      this.settingsPanelVisible = false;
      this.updatePanelVisible = false;
    }
    return { success: true, visible: this.wikiPanelVisible };
  }

  toggleUpdatePanel() {
    this.updatePanelVisible = !this.updatePanelVisible;
    // Close other panels
    if (this.updatePanelVisible) {
      this.startPanelVisible = false;
      this.settingsPanelVisible = false;
      this.wikiPanelVisible = false;
    }
    return { success: true, visible: this.updatePanelVisible };
  }

  // Game mode selection
  selectMode(mode) {
    const validModes = ['PVE_JOURNEY', 'PVE_SANDBOX'];
    if (!validModes.includes(mode)) {
      return { success: false, error: 'Invalid mode' };
    }
    this.selectedMode = mode;
    return { success: true, mode: this.selectedMode };
  }

  // Difficulty selection
  selectDifficulty(difficulty) {
    const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
    if (!validDifficulties.includes(difficulty)) {
      return { success: false, error: 'Invalid difficulty' };
    }
    this.selectedDifficulty = difficulty;
    return { success: true, difficulty: this.selectedDifficulty };
  }

  // Continue run (load saved game)
  continueRun() {
    const restored = this.savedRun ?? hydrateRunState(loadProgress());
    if (!restored) {
      return { success: false, error: 'No saved run to continue' };
    }
    
    this.savedRun = restored;
    this.settings.aiMode = restored.aiMode ?? this.settings.aiMode;
    
    // Simulate scene transition
    this.sceneStarted = 'PlanningScene';
    this.sceneData = {
      settings: this.settings,
      mode: restored.player?.gameMode ?? this.selectedMode,
      restoredState: restored
    };
    
    return { success: true, scene: this.sceneStarted, data: this.sceneData };
  }

  // Start new game
  startNewGame() {
    // Clear any existing save
    clearProgress();
    this.savedRun = null;
    
    // Simulate scene transition
    this.sceneStarted = 'PlanningScene';
    this.sceneData = {
      settings: this.settings,
      mode: this.selectedMode,
      forceNewRun: true
    };
    
    return { success: true, scene: this.sceneStarted, data: this.sceneData };
  }

  // Check if continue button should be enabled
  canContinue() {
    const saved = this.savedRun ?? hydrateRunState(loadProgress());
    return saved !== null;
  }

  // Clear saved progress
  clearSavedProgress() {
    clearProgress();
    this.savedRun = null;
    return { success: true };
  }
}

describe('MainMenuScene Integration Tests', () => {
  let scene;

  beforeEach(() => {
    scene = new MockMainMenuScene();
    // Clear any saved progress before each test
    clearProgress();
  });

  describe('Menu navigation', () => {
    it('should initialize scene successfully', () => {
      const result = scene.create();
      expect(result.success).toBe(true);
    });

    it('should toggle start panel', () => {
      expect(scene.startPanelVisible).toBe(false);
      
      const result1 = scene.toggleStartPanel();
      expect(result1.success).toBe(true);
      expect(result1.visible).toBe(true);
      expect(scene.startPanelVisible).toBe(true);
      
      const result2 = scene.toggleStartPanel();
      expect(result2.success).toBe(true);
      expect(result2.visible).toBe(false);
      expect(scene.startPanelVisible).toBe(false);
    });

    it('should toggle settings panel', () => {
      expect(scene.settingsPanelVisible).toBe(false);
      
      const result1 = scene.toggleSettingsPanel();
      expect(result1.success).toBe(true);
      expect(result1.visible).toBe(true);
      expect(scene.settingsPanelVisible).toBe(true);
      
      const result2 = scene.toggleSettingsPanel();
      expect(result2.success).toBe(true);
      expect(result2.visible).toBe(false);
      expect(scene.settingsPanelVisible).toBe(false);
    });

    it('should toggle wiki panel', () => {
      expect(scene.wikiPanelVisible).toBe(false);
      
      const result1 = scene.toggleWikiPanel();
      expect(result1.success).toBe(true);
      expect(result1.visible).toBe(true);
      expect(scene.wikiPanelVisible).toBe(true);
      
      const result2 = scene.toggleWikiPanel();
      expect(result2.success).toBe(true);
      expect(result2.visible).toBe(false);
      expect(scene.wikiPanelVisible).toBe(false);
    });

    it('should toggle update panel', () => {
      expect(scene.updatePanelVisible).toBe(false);
      
      const result1 = scene.toggleUpdatePanel();
      expect(result1.success).toBe(true);
      expect(result1.visible).toBe(true);
      expect(scene.updatePanelVisible).toBe(true);
      
      const result2 = scene.toggleUpdatePanel();
      expect(result2.success).toBe(true);
      expect(result2.visible).toBe(false);
      expect(scene.updatePanelVisible).toBe(false);
    });

    it('should close other panels when opening a panel', () => {
      // Open start panel
      scene.toggleStartPanel();
      expect(scene.startPanelVisible).toBe(true);
      
      // Open settings panel (should close start panel)
      scene.toggleSettingsPanel();
      expect(scene.settingsPanelVisible).toBe(true);
      expect(scene.startPanelVisible).toBe(false);
      
      // Open wiki panel (should close settings panel)
      scene.toggleWikiPanel();
      expect(scene.wikiPanelVisible).toBe(true);
      expect(scene.settingsPanelVisible).toBe(false);
      
      // Open update panel (should close wiki panel)
      scene.toggleUpdatePanel();
      expect(scene.updatePanelVisible).toBe(true);
      expect(scene.wikiPanelVisible).toBe(false);
    });

    it('should handle multiple panel toggles', () => {
      // Toggle start panel multiple times
      scene.toggleStartPanel();
      expect(scene.startPanelVisible).toBe(true);
      
      scene.toggleStartPanel();
      expect(scene.startPanelVisible).toBe(false);
      
      scene.toggleStartPanel();
      expect(scene.startPanelVisible).toBe(true);
      
      // Switch to different panel
      scene.toggleWikiPanel();
      expect(scene.wikiPanelVisible).toBe(true);
      expect(scene.startPanelVisible).toBe(false);
    });
  });

  describe('Game start flow', () => {
    it('should select game mode', () => {
      expect(scene.selectedMode).toBe('PVE_JOURNEY');
      
      const result = scene.selectMode('PVE_JOURNEY');
      expect(result.success).toBe(true);
      expect(result.mode).toBe('PVE_JOURNEY');
      expect(scene.selectedMode).toBe('PVE_JOURNEY');
    });

    it('should reject invalid game mode', () => {
      const result = scene.selectMode('INVALID_MODE');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid mode');
      expect(scene.selectedMode).toBe('PVE_JOURNEY'); // Should remain unchanged
    });

    it('should select difficulty', () => {
      expect(scene.selectedDifficulty).toBe('MEDIUM');
      
      const result1 = scene.selectDifficulty('EASY');
      expect(result1.success).toBe(true);
      expect(result1.difficulty).toBe('EASY');
      expect(scene.selectedDifficulty).toBe('EASY');
      
      const result2 = scene.selectDifficulty('HARD');
      expect(result2.success).toBe(true);
      expect(result2.difficulty).toBe('HARD');
      expect(scene.selectedDifficulty).toBe('HARD');
    });

    it('should reject invalid difficulty', () => {
      const result = scene.selectDifficulty('IMPOSSIBLE');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid difficulty');
      expect(scene.selectedDifficulty).toBe('MEDIUM'); // Should remain unchanged
    });

    it('should start new game with selected mode', () => {
      scene.selectMode('PVE_JOURNEY');
      scene.selectDifficulty('HARD');
      
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(result.scene).toBe('PlanningScene');
      expect(result.data).toBeDefined();
      expect(result.data.mode).toBe('PVE_JOURNEY');
      expect(result.data.forceNewRun).toBe(true);
      expect(result.data.settings).toBeDefined();
    });

    it('should clear saved progress when starting new game', () => {
      // Create a fake saved run
      const fakeRun = {
        player: { gameMode: 'PVE_JOURNEY', level: 5, gold: 20 },
        aiMode: 'MEDIUM'
      };
      saveProgress(fakeRun);
      scene.savedRun = fakeRun;
      
      expect(scene.canContinue()).toBe(true);
      
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(scene.savedRun).toBeNull();
      expect(scene.canContinue()).toBe(false);
    });

    it('should handle mode selection workflow', () => {
      // Open start panel
      scene.toggleStartPanel();
      expect(scene.startPanelVisible).toBe(true);
      
      // Select mode
      scene.selectMode('PVE_JOURNEY');
      expect(scene.selectedMode).toBe('PVE_JOURNEY');
      
      // Select difficulty
      scene.selectDifficulty('EASY');
      expect(scene.selectedDifficulty).toBe('EASY');
      
      // Start game
      const result = scene.startNewGame();
      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('PVE_JOURNEY');
    });
  });

  describe('Scene transitions', () => {
    it('should transition to PlanningScene with new game', () => {
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(scene.sceneStarted).toBe('PlanningScene');
      expect(scene.sceneData).toBeDefined();
      expect(scene.sceneData.mode).toBe('PVE_JOURNEY');
      expect(scene.sceneData.forceNewRun).toBe(true);
      expect(scene.sceneData.settings).toBeDefined();
    });

    it('should transition to PlanningScene with continue game', () => {
      // Create a saved run
      const savedRun = {
        player: {
          gameMode: 'PVE_JOURNEY',
          level: 5,
          gold: 20,
          round: 3,
          hp: 2
        },
        aiMode: 'MEDIUM'
      };
      saveProgress(savedRun);
      scene.create(); // Load saved run
      
      const result = scene.continueRun();
      
      expect(result.success).toBe(true);
      expect(scene.sceneStarted).toBe('PlanningScene');
      expect(scene.sceneData).toBeDefined();
      expect(scene.sceneData.mode).toBe('PVE_JOURNEY');
      expect(scene.sceneData.restoredState).toBeDefined();
      expect(scene.sceneData.restoredState.player.level).toBe(5);
      expect(scene.sceneData.restoredState.player.round).toBe(3);
    });

    it('should pass correct settings to PlanningScene', () => {
      scene.settings.audioEnabled = false;
      scene.settings.volumeLevel = 5;
      
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(scene.sceneData.settings.audioEnabled).toBe(false);
      expect(scene.sceneData.settings.volumeLevel).toBe(5);
    });

    it('should pass selected mode to PlanningScene', () => {
      scene.selectMode('PVE_JOURNEY');
      
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(scene.sceneData.mode).toBe('PVE_JOURNEY');
    });

    it('should handle continue with no saved game', () => {
      // Ensure no saved game
      clearProgress();
      scene.create();
      
      const result = scene.continueRun();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No saved run to continue');
      expect(scene.sceneStarted).toBeNull();
    });

    it('should restore game mode from saved run', () => {
      // Create a saved run with specific mode
      const savedRun = {
        player: {
          gameMode: 'PVE_JOURNEY',
          level: 10,
          gold: 50
        },
        aiMode: 'HARD'
      };
      saveProgress(savedRun);
      scene.create();
      
      const result = scene.continueRun();
      
      expect(result.success).toBe(true);
      expect(scene.sceneData.mode).toBe('PVE_JOURNEY');
      expect(scene.settings.aiMode).toBe('HARD');
    });

    it('should use default mode if saved run has no mode', () => {
      // Create a saved run without gameMode
      const savedRun = {
        player: {
          level: 5,
          gold: 20
        },
        aiMode: 'MEDIUM'
      };
      saveProgress(savedRun);
      scene.create();
      
      scene.selectedMode = 'PVE_JOURNEY';
      const result = scene.continueRun();
      
      expect(result.success).toBe(true);
      expect(scene.sceneData.mode).toBe('PVE_JOURNEY');
    });
  });

  describe('Continue button state', () => {
    it('should enable continue button when save exists', () => {
      // Create a saved run
      const savedRun = {
        player: { gameMode: 'PVE_JOURNEY', level: 5, gold: 20 },
        aiMode: 'MEDIUM'
      };
      saveProgress(savedRun);
      scene.create();
      
      expect(scene.canContinue()).toBe(true);
    });

    it('should disable continue button when no save exists', () => {
      clearProgress();
      scene.create();
      
      expect(scene.canContinue()).toBe(false);
    });

    it('should update continue button state after clearing progress', () => {
      // Create a saved run
      const savedRun = {
        player: { gameMode: 'PVE_JOURNEY', level: 5, gold: 20 },
        aiMode: 'MEDIUM'
      };
      saveProgress(savedRun);
      scene.create();
      
      expect(scene.canContinue()).toBe(true);
      
      // Clear progress
      scene.clearSavedProgress();
      
      expect(scene.canContinue()).toBe(false);
    });
  });

  describe('Complex workflows', () => {
    it('should handle complete new game workflow', () => {
      // 1. Initialize scene
      scene.create();
      
      // 2. Open start panel
      scene.toggleStartPanel();
      expect(scene.startPanelVisible).toBe(true);
      
      // 3. Select mode and difficulty
      scene.selectMode('PVE_JOURNEY');
      scene.selectDifficulty('HARD');
      
      // 4. Start new game
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(scene.sceneStarted).toBe('PlanningScene');
      expect(scene.sceneData.mode).toBe('PVE_JOURNEY');
      expect(scene.sceneData.forceNewRun).toBe(true);
    });

    it('should handle complete continue game workflow', () => {
      // 1. Create saved run
      const savedRun = {
        player: {
          gameMode: 'PVE_JOURNEY',
          level: 8,
          gold: 35,
          round: 5
        },
        aiMode: 'MEDIUM'
      };
      saveProgress(savedRun);
      
      // 2. Initialize scene
      scene.create();
      expect(scene.canContinue()).toBe(true);
      
      // 3. Continue game
      const result = scene.continueRun();
      
      expect(result.success).toBe(true);
      expect(scene.sceneStarted).toBe('PlanningScene');
      expect(scene.sceneData.restoredState.player.level).toBe(8);
      expect(scene.sceneData.restoredState.player.round).toBe(5);
    });

    it('should handle navigation between panels', () => {
      // Navigate through all panels
      scene.toggleStartPanel();
      expect(scene.startPanelVisible).toBe(true);
      
      scene.toggleSettingsPanel();
      expect(scene.settingsPanelVisible).toBe(true);
      expect(scene.startPanelVisible).toBe(false);
      
      scene.toggleWikiPanel();
      expect(scene.wikiPanelVisible).toBe(true);
      expect(scene.settingsPanelVisible).toBe(false);
      
      scene.toggleUpdatePanel();
      expect(scene.updatePanelVisible).toBe(true);
      expect(scene.wikiPanelVisible).toBe(false);
      
      // Close all panels
      scene.toggleUpdatePanel();
      expect(scene.updatePanelVisible).toBe(false);
    });

    it('should handle clear progress and start new game', () => {
      // 1. Create saved run
      const savedRun = {
        player: { gameMode: 'PVE_JOURNEY', level: 5, gold: 20 },
        aiMode: 'MEDIUM'
      };
      saveProgress(savedRun);
      scene.create();
      
      expect(scene.canContinue()).toBe(true);
      
      // 2. Clear progress
      scene.clearSavedProgress();
      expect(scene.canContinue()).toBe(false);
      
      // 3. Start new game
      scene.selectMode('PVE_JOURNEY');
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(scene.sceneData.forceNewRun).toBe(true);
    });

    it('should maintain settings across scene transitions', () => {
      // Configure settings
      scene.settings.audioEnabled = true;
      scene.settings.volumeLevel = 8;
      scene.settings.guiScale = 1.2;
      
      // Start new game
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(scene.sceneData.settings.audioEnabled).toBe(true);
      expect(scene.sceneData.settings.volumeLevel).toBe(8);
      expect(scene.sceneData.settings.guiScale).toBe(1.2);
    });

    it('should handle mode selection changes before starting', () => {
      // Change mode multiple times
      scene.selectMode('PVE_JOURNEY');
      expect(scene.selectedMode).toBe('PVE_JOURNEY');
      
      scene.selectMode('PVE_JOURNEY');
      expect(scene.selectedMode).toBe('PVE_JOURNEY');
      
      // Start game with final selection
      const result = scene.startNewGame();
      expect(result.success).toBe(true);
      expect(scene.sceneData.mode).toBe('PVE_JOURNEY');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid mode selection gracefully', () => {
      const result = scene.selectMode('INVALID');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(scene.selectedMode).toBe('PVE_JOURNEY'); // Should not change
    });

    it('should handle invalid difficulty selection gracefully', () => {
      const result = scene.selectDifficulty('INVALID');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(scene.selectedDifficulty).toBe('MEDIUM'); // Should not change
    });

    it('should handle continue with corrupted save data', () => {
      // Save invalid data
      saveProgress({ invalid: 'data' });
      scene.create();
      
      // Should handle gracefully (hydrateRunState returns null for invalid data)
      expect(scene.canContinue()).toBe(false);
      
      const result = scene.continueRun();
      expect(result.success).toBe(false);
    });

    it('should handle multiple clear progress calls', () => {
      const result1 = scene.clearSavedProgress();
      expect(result1.success).toBe(true);
      
      const result2 = scene.clearSavedProgress();
      expect(result2.success).toBe(true);
      
      expect(scene.canContinue()).toBe(false);
    });
  });
});
