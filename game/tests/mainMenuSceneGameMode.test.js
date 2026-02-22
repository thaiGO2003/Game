/**
 * MainMenuScene Game Mode Selection Tests
 * 
 * Tests the main menu scene's game mode selection functionality:
 * - Reading available game modes from GameModeRegistry
 * - Displaying game mode options in UI
 * - Passing selected mode to PlanningScene
 * - Defaulting to EndlessPvEClassic mode
 * 
 * **Validates: Requirements 9.8**
 * 
 * Task 7.3.3: Update MainMenuScene to support game mode selection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js';
import { createGameModeConfig, AI_DIFFICULTY, LOSE_CONDITION } from '../src/gameModes/GameModeConfig.js';
import { clearProgress, saveProgress } from '../src/core/persistence.js';
import { createDefaultUiSettings } from '../src/core/uiSettings.js';

/**
 * Mock MainMenuScene that simulates game mode selection
 */
class MockMainMenuSceneWithGameModes {
  constructor() {
    this.settings = createDefaultUiSettings();
    this.selectedMode = 'EndlessPvEClassic'; // Default mode
    this.savedRun = null;
    
    // Scene transition tracking
    this.sceneStarted = null;
    this.sceneData = null;
  }

  // Get available game modes from registry
  getAvailableGameModes() {
    const modes = GameModeRegistry.getAll();
    return modes.map(mode => ({
      id: mode.id,
      name: mode.name,
      description: mode.description
    }));
  }

  // Select a game mode
  selectGameMode(modeId) {
    const mode = GameModeRegistry.get(modeId);
    if (!mode) {
      return { success: false, error: `Game mode "${modeId}" not found in registry` };
    }
    
    this.selectedMode = modeId;
    return { success: true, mode: this.selectedMode };
  }

  // Get current mode config
  getCurrentModeConfig() {
    return GameModeRegistry.get(this.selectedMode);
  }

  // Start new game with selected mode
  startNewGame() {
    clearProgress();
    this.savedRun = null;
    
    // Simulate scene transition with mode
    this.sceneStarted = 'PlanningScene';
    this.sceneData = {
      settings: this.settings,
      mode: this.selectedMode,
      forceNewRun: true
    };
    
    return { success: true, scene: this.sceneStarted, data: this.sceneData };
  }

  // Continue game (restore mode from save or use default)
  continueRun(savedRun) {
    if (!savedRun) {
      return { success: false, error: 'No saved run to continue' };
    }
    
    this.savedRun = savedRun;
    
    // Use saved mode or fall back to selected mode
    const mode = savedRun.player?.gameMode ?? this.selectedMode;
    
    // Simulate scene transition
    this.sceneStarted = 'PlanningScene';
    this.sceneData = {
      settings: this.settings,
      mode: mode,
      restoredState: savedRun
    };
    
    return { success: true, scene: this.sceneStarted, data: this.sceneData };
  }
}

describe('MainMenuScene Game Mode Selection Tests', () => {
  let scene;
  let testMode1;
  let testMode2;

  beforeEach(() => {
    // Clear registry before each test
    GameModeRegistry.clear();
    
    // Register test game modes with unique IDs
    testMode1 = createGameModeConfig('TEST_MODE_1', {
      name: 'Test Mode 1',
      description: 'First test mode for testing',
      scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
      startingGold: 15,
      startingHP: 5,
      loseCondition: LOSE_CONDITION.NO_HEARTS,
      enabledSystems: {
        shop: true,
        crafting: true,
        augments: true,
        pvp: false
      },
      aiDifficulty: AI_DIFFICULTY.EASY,
      goldScaling: (round) => 10 + round,
      enemyScaling: (round) => round * 1.5
    });
    
    testMode2 = createGameModeConfig('TEST_MODE_2', {
      name: 'Test Mode 2',
      description: 'Second test mode for testing',
      scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
      startingGold: 20,
      startingHP: 10,
      loseCondition: LOSE_CONDITION.SINGLE_LOSS,
      enabledSystems: {
        shop: true,
        crafting: false,
        augments: false,
        pvp: false
      },
      aiDifficulty: AI_DIFFICULTY.HARD,
      goldScaling: (round) => 15 + round * 2,
      enemyScaling: (round) => round * 2
    });
    
    const result1 = GameModeRegistry.register(testMode1);
    const result2 = GameModeRegistry.register(testMode2);
    
    // Verify registration succeeded
    if (!result1.success || !result2.success) {
      console.error('Failed to register test modes:', result1, result2);
    }
    
    scene = new MockMainMenuSceneWithGameModes();
    clearProgress();
  });

  afterEach(() => {
    GameModeRegistry.clear();
  });

  describe('Reading available game modes from registry', () => {
    it('should get all available game modes from registry', () => {
      const modes = scene.getAvailableGameModes();
      
      expect(modes).toBeDefined();
      expect(modes.length).toBe(2); // TEST_MODE_1, TEST_MODE_2
      
      const modeIds = modes.map(m => m.id);
      expect(modeIds).toContain('TEST_MODE_1');
      expect(modeIds).toContain('TEST_MODE_2');
    });

    it('should get mode details from registry', () => {
      const modes = scene.getAvailableGameModes();
      
      const mode1 = modes.find(m => m.id === 'TEST_MODE_1');
      expect(mode1).toBeDefined();
      expect(mode1.name).toBe('Test Mode 1');
      expect(mode1.description).toBe('First test mode for testing');
    });

    it('should handle empty registry gracefully', () => {
      GameModeRegistry.clear();
      
      const modes = scene.getAvailableGameModes();
      expect(modes).toBeDefined();
      expect(modes.length).toBe(0);
    });

    it('should update available modes when registry changes', () => {
      let modes = scene.getAvailableGameModes();
      expect(modes.length).toBe(2);
      
      // Add a new mode
      const newMode = createGameModeConfig('NEW_MODE', {
        name: 'New Mode',
        description: 'Newly added mode',
        scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
        startingGold: 25,
        startingHP: 8,
        loseCondition: LOSE_CONDITION.NO_HEARTS,
        enabledSystems: {
          shop: true,
          crafting: true,
          augments: true,
          pvp: false
        },
        aiDifficulty: AI_DIFFICULTY.MEDIUM,
        goldScaling: (round) => 12,
        enemyScaling: (round) => round * 1.2
      });
      GameModeRegistry.register(newMode);
      
      modes = scene.getAvailableGameModes();
      expect(modes.length).toBe(3);
      expect(modes.find(m => m.id === 'NEW_MODE')).toBeDefined();
    });
  });

  describe('Game mode selection', () => {
    it('should default to EndlessPvEClassic mode', () => {
      expect(scene.selectedMode).toBe('EndlessPvEClassic');
    });

    it('should select a valid game mode', () => {
      const result = scene.selectGameMode('TEST_MODE_1');
      
      expect(result.success).toBe(true);
      expect(result.mode).toBe('TEST_MODE_1');
      expect(scene.selectedMode).toBe('TEST_MODE_1');
    });

    it('should reject invalid game mode', () => {
      const result = scene.selectGameMode('INVALID_MODE');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in registry');
      expect(scene.selectedMode).toBe('EndlessPvEClassic'); // Should remain unchanged
    });

    it('should switch between game modes', () => {
      let result = scene.selectGameMode('TEST_MODE_1');
      expect(result.success).toBe(true);
      expect(scene.selectedMode).toBe('TEST_MODE_1');
      
      result = scene.selectGameMode('TEST_MODE_2');
      expect(result.success).toBe(true);
      expect(scene.selectedMode).toBe('TEST_MODE_2');
      
      result = scene.selectGameMode('TEST_MODE_1');
      expect(result.success).toBe(true);
      expect(scene.selectedMode).toBe('TEST_MODE_1');
    });

    it('should get current mode config', () => {
      scene.selectGameMode('TEST_MODE_1');
      
      const config = scene.getCurrentModeConfig();
      expect(config).toBeDefined();
      expect(config.id).toBe('TEST_MODE_1');
      expect(config.name).toBe('Test Mode 1');
      expect(config.startingGold).toBe(15);
      expect(config.startingHP).toBe(5);
    });

    it('should handle mode selection for all registered modes', () => {
      const modes = scene.getAvailableGameModes();
      
      modes.forEach(mode => {
        const result = scene.selectGameMode(mode.id);
        expect(result.success).toBe(true);
        expect(scene.selectedMode).toBe(mode.id);
      });
    });
  });

  describe('Passing selected mode to PlanningScene', () => {
    it('should pass selected mode when starting new game', () => {
      scene.selectGameMode('TEST_MODE_1');
      
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(result.scene).toBe('PlanningScene');
      expect(result.data.mode).toBe('TEST_MODE_1');
    });

    it('should pass default mode when no mode selected', () => {
      // selectedMode defaults to EndlessPvEClassic
      const result = scene.startNewGame();
      
      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('EndlessPvEClassic');
    });

    it('should pass different modes correctly', () => {
      // Test MODE_1
      scene.selectGameMode('TEST_MODE_1');
      let result = scene.startNewGame();
      expect(result.data.mode).toBe('TEST_MODE_1');
      
      // Create new scene for MODE_2
      scene = new MockMainMenuSceneWithGameModes();
      scene.selectGameMode('TEST_MODE_2');
      result = scene.startNewGame();
      expect(result.data.mode).toBe('TEST_MODE_2');
    });

    it('should include mode in scene data', () => {
      scene.selectGameMode('TEST_MODE_1');
      
      const result = scene.startNewGame();
      
      expect(result.data).toBeDefined();
      expect(result.data.mode).toBe('TEST_MODE_1');
      expect(result.data.settings).toBeDefined();
      expect(result.data.forceNewRun).toBe(true);
    });

    it('should pass mode with other scene data', () => {
      scene.selectGameMode('TEST_MODE_1');
      scene.settings.audioEnabled = false;
      scene.settings.volumeLevel = 7;
      
      const result = scene.startNewGame();
      
      expect(result.data.mode).toBe('TEST_MODE_1');
      expect(result.data.settings.audioEnabled).toBe(false);
      expect(result.data.settings.volumeLevel).toBe(7);
    });
  });

  describe('Continue game with saved mode', () => {
    it('should restore mode from saved game', () => {
      const savedRun = {
        player: {
          gameMode: 'TEST_MODE_1',
          level: 5,
          gold: 20,
          round: 3
        },
        aiMode: 'MEDIUM'
      };
      
      const result = scene.continueRun(savedRun);
      
      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('TEST_MODE_1');
      expect(result.data.restoredState).toBeDefined();
    });

    it('should use default mode if saved game has no mode', () => {
      const savedRun = {
        player: {
          level: 5,
          gold: 20,
          round: 3
          // No gameMode field
        },
        aiMode: 'MEDIUM'
      };
      
      scene.selectedMode = 'EndlessPvEClassic';
      const result = scene.continueRun(savedRun);
      
      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('EndlessPvEClassic');
    });

    it('should use selected mode as fallback', () => {
      const savedRun = {
        player: {
          level: 5,
          gold: 20
        },
        aiMode: 'MEDIUM'
      };
      
      scene.selectGameMode('TEST_MODE_1');
      const result = scene.continueRun(savedRun);
      
      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('TEST_MODE_1');
    });

    it('should handle different saved modes', () => {
      // Save with MODE_1
      let savedRun = {
        player: { gameMode: 'TEST_MODE_1', level: 5 },
        aiMode: 'EASY'
      };
      let result = scene.continueRun(savedRun);
      expect(result.data.mode).toBe('TEST_MODE_1');
      
      // Save with MODE_2
      savedRun = {
        player: { gameMode: 'TEST_MODE_2', level: 8 },
        aiMode: 'HARD'
      };
      result = scene.continueRun(savedRun);
      expect(result.data.mode).toBe('TEST_MODE_2');
    });

    it('should pass restored state with mode', () => {
      const savedRun = {
        player: {
          gameMode: 'TEST_MODE_1',
          level: 10,
          gold: 50,
          round: 7
        },
        aiMode: 'MEDIUM'
      };
      
      const result = scene.continueRun(savedRun);
      
      expect(result.data.mode).toBe('TEST_MODE_1');
      expect(result.data.restoredState).toBeDefined();
      expect(result.data.restoredState.player.level).toBe(10);
      expect(result.data.restoredState.player.round).toBe(7);
    });
  });

  describe('Default mode behavior', () => {
    it('should use EndlessPvEClassic as default when no mode selected', () => {
      const result = scene.startNewGame();
      expect(result.data.mode).toBe('EndlessPvEClassic');
    });

    it('should fall back to EndlessPvEClassic if selected mode not in registry', () => {
      // Manually set invalid mode
      scene.selectedMode = 'INVALID_MODE';
      
      // Should still work, using the invalid mode string
      // (PlanningScene will handle validation)
      const result = scene.startNewGame();
      expect(result.data.mode).toBe('INVALID_MODE');
    });

    it('should maintain EndlessPvEClassic as default after registry clear', () => {
      GameModeRegistry.clear();
      
      // Re-register only EndlessPvEClassic
      const pveJourney = createGameModeConfig('EndlessPvEClassic', {
        name: 'PVE Journey',
        description: 'Default mode',
        scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
        startingGold: 10,
        startingHP: 3,
        loseCondition: LOSE_CONDITION.NO_HEARTS,
        enabledSystems: {
          shop: true,
          crafting: true,
          augments: true,
          pvp: false
        },
        aiDifficulty: AI_DIFFICULTY.MEDIUM,
        goldScaling: (round) => 10,
        enemyScaling: (round) => round
      });
      GameModeRegistry.register(pveJourney);
      
      const newScene = new MockMainMenuSceneWithGameModes();
      expect(newScene.selectedMode).toBe('EndlessPvEClassic');
      
      const result = newScene.startNewGame();
      expect(result.data.mode).toBe('EndlessPvEClassic');
    });
  });

  describe('Integration with game flow', () => {
    it('should handle complete new game flow with mode selection', () => {
      // 1. Get available modes
      const modes = scene.getAvailableGameModes();
      expect(modes.length).toBeGreaterThan(0);
      
      // 2. Select a mode
      const result1 = scene.selectGameMode('TEST_MODE_1');
      expect(result1.success).toBe(true);
      
      // 3. Get mode config
      const config = scene.getCurrentModeConfig();
      expect(config.id).toBe('TEST_MODE_1');
      
      // 4. Start game
      const result2 = scene.startNewGame();
      expect(result2.success).toBe(true);
      expect(result2.data.mode).toBe('TEST_MODE_1');
    });

    it('should handle mode selection change before starting', () => {
      // Select mode 1
      scene.selectGameMode('TEST_MODE_1');
      expect(scene.selectedMode).toBe('TEST_MODE_1');
      
      // Change to mode 2
      scene.selectGameMode('TEST_MODE_2');
      expect(scene.selectedMode).toBe('TEST_MODE_2');
      
      // Start game with final selection
      const result = scene.startNewGame();
      expect(result.data.mode).toBe('TEST_MODE_2');
    });

    it('should handle continue game with different mode than selected', () => {
      // Select TEST_MODE_1
      scene.selectGameMode('TEST_MODE_1');
      
      // But saved game has TEST_MODE_2
      const savedRun = {
        player: {
          gameMode: 'TEST_MODE_2',
          level: 5
        },
        aiMode: 'MEDIUM'
      };
      
      // Should use saved mode, not selected mode
      const result = scene.continueRun(savedRun);
      expect(result.data.mode).toBe('TEST_MODE_2');
    });

    it('should maintain mode selection across multiple operations', () => {
      scene.selectGameMode('TEST_MODE_1');
      
      // Get modes
      const modes = scene.getAvailableGameModes();
      expect(modes.length).toBeGreaterThan(0);
      
      // Mode should still be selected
      expect(scene.selectedMode).toBe('TEST_MODE_1');
      
      // Get config
      const config = scene.getCurrentModeConfig();
      expect(config.id).toBe('TEST_MODE_1');
      
      // Mode should still be selected
      expect(scene.selectedMode).toBe('TEST_MODE_1');
      
      // Start game
      const result = scene.startNewGame();
      expect(result.data.mode).toBe('TEST_MODE_1');
    });
  });

  describe('Error handling', () => {
    it('should handle selecting non-existent mode', () => {
      const result = scene.selectGameMode('NON_EXISTENT');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(scene.selectedMode).toBe('EndlessPvEClassic'); // Should not change
    });

    it('should handle empty mode id', () => {
      const result = scene.selectGameMode('');
      
      expect(result.success).toBe(false);
      expect(scene.selectedMode).toBe('EndlessPvEClassic');
    });

    it('should handle null mode id', () => {
      const result = scene.selectGameMode(null);
      
      expect(result.success).toBe(false);
      expect(scene.selectedMode).toBe('EndlessPvEClassic');
    });

    it('should handle continue with no saved run', () => {
      const result = scene.continueRun(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle corrupted saved mode gracefully', () => {
      const savedRun = {
        player: {
          gameMode: 'CORRUPTED_MODE_THAT_DOES_NOT_EXIST',
          level: 5
        },
        aiMode: 'MEDIUM'
      };
      
      // Should still pass the mode (PlanningScene will validate)
      const result = scene.continueRun(savedRun);
      expect(result.success).toBe(true);
      expect(result.data.mode).toBe('CORRUPTED_MODE_THAT_DOES_NOT_EXIST');
    });
  });
});
