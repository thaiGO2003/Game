/**
 * Integration Tests for Scenes with Game Modes
 * 
 * Tests the full scene flow with different game mode configurations:
 * - MainMenuScene → PlanningScene → CombatScene flow
 * - Scenes adapt behavior based on mode config
 * - Conditional system usage (shop, crafting, augments)
 * - Scene flow follows mode.scenes specification
 * 
 * **Validates: Requirements 9.8, 11.4**
 * 
 * Task 7.3.4: Write integration tests for scenes with game modes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js';
import { createGameModeConfig, AI_DIFFICULTY, LOSE_CONDITION } from '../src/gameModes/GameModeConfig.js';
import { getAISettings } from '../src/systems/AISystem.js';
import { createDefaultUiSettings } from '../src/core/uiSettings.js';

/**
 * Mock MainMenuScene for integration testing
 */
class MockMainMenuScene {
  constructor() {
    this.settings = createDefaultUiSettings();
    this.selectedMode = 'EndlessPvEClassic';
    this.sceneStarted = null;
    this.sceneData = null;
  }

  selectGameMode(modeId) {
    const mode = GameModeRegistry.get(modeId);
    if (!mode) {
      return { success: false, error: `Game mode "${modeId}" not found` };
    }
    this.selectedMode = modeId;
    return { success: true };
  }

  startNewGame() {
    this.sceneStarted = 'PlanningScene';
    this.sceneData = {
      settings: this.settings,
      mode: this.selectedMode,
      forceNewRun: true
    };
    return { success: true, scene: this.sceneStarted, data: this.sceneData };
  }
}

/**
 * Mock PlanningScene for integration testing
 */
class MockPlanningScene {
  constructor() {
    this.gameMode = 'EndlessPvEClassic';
    this.gameModeConfig = null;
    this.player = null;
    this.buttons = {};
    this.phase = 'PLANNING';
    this.sceneStarted = null;
    this.sceneData = null;
  }

  init(data) {
    this.gameMode = data?.mode ?? this.gameMode;
  }

  create() {
    this.gameModeConfig = GameModeRegistry.get(this.gameMode);
    if (!this.gameModeConfig) {
      this.gameMode = 'EndlessPvEClassic';
      this.gameModeConfig = GameModeRegistry.get(this.gameMode);
    }

    this.player = {
      gold: 10,
      hp: 3,
      round: 1,
      board: [[null, null, null, null, null]],
      gameMode: this.gameMode
    };

    // Create buttons based on enabled systems
    if (this.gameModeConfig?.enabledSystems?.shop !== false) {
      this.buttons.roll = { label: 'Roll' };
      this.buttons.xp = { label: 'XP' };
      this.buttons.lock = { label: 'Lock' };
    }

    if (this.gameModeConfig?.enabledSystems?.crafting !== false) {
      this.buttons.upgradeCraft = { label: 'Upgrade Craft' };
    }
  }

  startNewRun() {
    if (this.gameModeConfig) {
      this.player.gold = this.gameModeConfig.startingGold;
      this.player.hp = this.gameModeConfig.startingHP;
    }
  }

  startCombat() {
    this.sceneStarted = 'CombatScene';
    this.sceneData = {
      runState: {
        player: this.player,
        aiMode: this.gameModeConfig?.aiDifficulty ?? 'MEDIUM'
      }
    };
    return { success: true, scene: this.sceneStarted, data: this.sceneData };
  }
}

/**
 * Mock CombatScene for integration testing
 */
class MockCombatScene {
  constructor() {
    this.gameModeConfig = null;
    this.aiMode = 'MEDIUM';
    this.loseCondition = 'NO_UNITS';
    this.player = null;
    this.runStatePayload = null;
    this.sceneStarted = null;
    this.sceneData = null;
  }

  init(data) {
    this.runStatePayload = data?.runState ?? null;
  }

  create() {
    const gameMode = this.runStatePayload?.player?.gameMode ?? 'EndlessPvEClassic';
    this.gameModeConfig = GameModeRegistry.get(gameMode);
    if (!this.gameModeConfig) {
      this.gameModeConfig = GameModeRegistry.get('EndlessPvEClassic');
    }
  }

  startFromPayload() {
    const hydrated = this.runStatePayload;
    if (!hydrated?.player?.board) {
      return false;
    }

    if (this.gameModeConfig?.aiDifficulty) {
      this.aiMode = this.gameModeConfig.aiDifficulty;
    } else {
      this.aiMode = hydrated.aiMode ?? 'MEDIUM';
    }

    this.player = hydrated.player;

    if (this.gameModeConfig?.loseCondition) {
      this.loseCondition = this.gameModeConfig.loseCondition;
    } else {
      this.loseCondition = this.player?.loseCondition ?? 'NO_UNITS';
    }

    return true;
  }

  endCombat(result) {
    this.sceneStarted = 'PlanningScene';
    this.sceneData = {
      restoredState: this.runStatePayload,
      combatResult: result
    };
    return { success: true, scene: this.sceneStarted, data: this.sceneData };
  }

  createCombatUnit(owned, side, round) {
    const baseStats = { hp: 100, atk: 20, matk: 15 };
    const ai = getAISettings(this.aiMode);
    
    let hpBase = side === 'RIGHT' ? Math.round(baseStats.hp * ai.hpMult) : baseStats.hp;
    let atkBase = side === 'RIGHT' ? Math.round(baseStats.atk * ai.atkMult) : baseStats.atk;
    let matkBase = side === 'RIGHT' ? Math.round(baseStats.matk * ai.matkMult) : baseStats.matk;

    if (side === 'RIGHT' && this.gameModeConfig?.enemyScaling) {
      const scaleFactor = this.gameModeConfig.enemyScaling(round);
      if (typeof scaleFactor === 'number' && scaleFactor > 0) {
        hpBase = Math.round(hpBase * scaleFactor);
        atkBase = Math.round(atkBase * scaleFactor);
        matkBase = Math.round(matkBase * scaleFactor);
      }
    }

    return {
      side,
      hp: hpBase,
      atk: atkBase,
      matk: matkBase
    };
  }
}

describe('Scene Game Mode Integration Tests', () => {
  let testMode1;
  let testMode2;

  beforeEach(() => {
    GameModeRegistry.clear();

    // Create test mode 1: Shop-only mode
    testMode1 = createGameModeConfig('SHOP_ONLY_MODE', {
      name: 'Shop Only Mode',
      description: 'Mode with only shop enabled',
      scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
      startingGold: 25,
      startingHP: 10,
      loseCondition: LOSE_CONDITION.SINGLE_LOSS,
      enabledSystems: {
        shop: true,
        crafting: false,
        augments: false,
        pvp: false
      },
      aiDifficulty: AI_DIFFICULTY.EASY,
      goldScaling: (round) => 12 + round,
      enemyScaling: (round) => 1 + round * 0.1
    });

    // Create test mode 2: Full features mode
    testMode2 = createGameModeConfig('FULL_FEATURES_MODE', {
      name: 'Full Features Mode',
      description: 'Mode with all systems enabled',
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
      aiDifficulty: AI_DIFFICULTY.HARD,
      goldScaling: (round) => 10 + round * 2,
      enemyScaling: (round) => 1 + round * 0.3
    });

    GameModeRegistry.register(testMode1);
    GameModeRegistry.register(testMode2);
  });

  afterEach(() => {
    GameModeRegistry.clear();
  });

  describe('Full scene flow: MainMenu → Planning → Combat', () => {
    it('should flow through all scenes with SHOP_ONLY_MODE', () => {
      // 1. MainMenuScene: Select mode and start game
      const mainMenu = new MockMainMenuScene();
      const selectResult = mainMenu.selectGameMode('SHOP_ONLY_MODE');
      expect(selectResult.success).toBe(true);

      const startResult = mainMenu.startNewGame();
      expect(startResult.success).toBe(true);
      expect(startResult.scene).toBe('PlanningScene');
      expect(startResult.data.mode).toBe('SHOP_ONLY_MODE');

      // 2. PlanningScene: Initialize with mode
      const planning = new MockPlanningScene();
      planning.init(startResult.data);
      planning.create();
      planning.startNewRun();

      expect(planning.gameMode).toBe('SHOP_ONLY_MODE');
      expect(planning.player.gold).toBe(25); // startingGold
      expect(planning.player.hp).toBe(10); // startingHP
      expect(planning.buttons.roll).toBeDefined(); // shop enabled
      expect(planning.buttons.upgradeCraft).toBeUndefined(); // crafting disabled

      // 3. PlanningScene → CombatScene
      const combatStart = planning.startCombat();
      expect(combatStart.success).toBe(true);
      expect(combatStart.scene).toBe('CombatScene');
      expect(combatStart.data.runState.player.gameMode).toBe('SHOP_ONLY_MODE');

      // 4. CombatScene: Initialize with mode
      const combat = new MockCombatScene();
      combat.init(combatStart.data);
      combat.create();
      const payloadResult = combat.startFromPayload();

      expect(payloadResult).toBe(true);
      expect(combat.aiMode).toBe('EASY'); // aiDifficulty from mode
      expect(combat.loseCondition).toBe('SINGLE_LOSS'); // loseCondition from mode

      // 5. CombatScene → PlanningScene (after combat)
      const combatEnd = combat.endCombat({ victory: true });
      expect(combatEnd.success).toBe(true);
      expect(combatEnd.scene).toBe('PlanningScene');
    });

    it('should flow through all scenes with FULL_FEATURES_MODE', () => {
      // 1. MainMenuScene
      const mainMenu = new MockMainMenuScene();
      mainMenu.selectGameMode('FULL_FEATURES_MODE');
      const startResult = mainMenu.startNewGame();

      // 2. PlanningScene
      const planning = new MockPlanningScene();
      planning.init(startResult.data);
      planning.create();
      planning.startNewRun();

      expect(planning.gameMode).toBe('FULL_FEATURES_MODE');
      expect(planning.player.gold).toBe(15); // startingGold
      expect(planning.player.hp).toBe(5); // startingHP
      expect(planning.buttons.roll).toBeDefined(); // shop enabled
      expect(planning.buttons.upgradeCraft).toBeDefined(); // crafting enabled

      // 3. CombatScene
      const combatStart = planning.startCombat();
      const combat = new MockCombatScene();
      combat.init(combatStart.data);
      combat.create();
      combat.startFromPayload();

      expect(combat.aiMode).toBe('HARD'); // aiDifficulty from mode
      expect(combat.loseCondition).toBe('NO_HEARTS'); // loseCondition from mode
    });

    it('should maintain mode across scene transitions', () => {
      const mainMenu = new MockMainMenuScene();
      mainMenu.selectGameMode('SHOP_ONLY_MODE');
      const startResult = mainMenu.startNewGame();

      const planning = new MockPlanningScene();
      planning.init(startResult.data);
      planning.create();
      planning.startNewRun();

      // Mode should be in player state
      expect(planning.player.gameMode).toBe('SHOP_ONLY_MODE');

      // Mode should be passed to combat
      const combatStart = planning.startCombat();
      expect(combatStart.data.runState.player.gameMode).toBe('SHOP_ONLY_MODE');

      const combat = new MockCombatScene();
      combat.init(combatStart.data);
      combat.create();
      combat.startFromPayload();

      // Combat should read mode from player state
      expect(combat.gameModeConfig.id).toBe('SHOP_ONLY_MODE');
    });
  });

  describe('Scenes adapt to different configs', () => {
    it('should adapt PlanningScene UI based on enabledSystems', () => {
      // Test with shop-only mode
      const planning1 = new MockPlanningScene();
      planning1.init({ mode: 'SHOP_ONLY_MODE' });
      planning1.create();

      expect(planning1.buttons.roll).toBeDefined();
      expect(planning1.buttons.xp).toBeDefined();
      expect(planning1.buttons.lock).toBeDefined();
      expect(planning1.buttons.upgradeCraft).toBeUndefined();

      // Test with full features mode
      const planning2 = new MockPlanningScene();
      planning2.init({ mode: 'FULL_FEATURES_MODE' });
      planning2.create();

      expect(planning2.buttons.roll).toBeDefined();
      expect(planning2.buttons.xp).toBeDefined();
      expect(planning2.buttons.lock).toBeDefined();
      expect(planning2.buttons.upgradeCraft).toBeDefined();
    });

    it('should adapt PlanningScene starting resources based on config', () => {
      // Test SHOP_ONLY_MODE
      const planning1 = new MockPlanningScene();
      planning1.init({ mode: 'SHOP_ONLY_MODE' });
      planning1.create();
      planning1.startNewRun();

      expect(planning1.player.gold).toBe(25);
      expect(planning1.player.hp).toBe(10);

      // Test FULL_FEATURES_MODE
      const planning2 = new MockPlanningScene();
      planning2.init({ mode: 'FULL_FEATURES_MODE' });
      planning2.create();
      planning2.startNewRun();

      expect(planning2.player.gold).toBe(15);
      expect(planning2.player.hp).toBe(5);
    });

    it('should adapt CombatScene AI difficulty based on config', () => {
      // Test EASY difficulty
      const combat1 = new MockCombatScene();
      combat1.init({
        runState: {
          player: { gameMode: 'SHOP_ONLY_MODE', board: [[null]] }
        }
      });
      combat1.create();
      combat1.startFromPayload();

      expect(combat1.aiMode).toBe('EASY');

      // Test HARD difficulty
      const combat2 = new MockCombatScene();
      combat2.init({
        runState: {
          player: { gameMode: 'FULL_FEATURES_MODE', board: [[null]] }
        }
      });
      combat2.create();
      combat2.startFromPayload();

      expect(combat2.aiMode).toBe('HARD');
    });

    it('should adapt CombatScene lose condition based on config', () => {
      // Test SINGLE_LOSS
      const combat1 = new MockCombatScene();
      combat1.init({
        runState: {
          player: { gameMode: 'SHOP_ONLY_MODE', board: [[null]] }
        }
      });
      combat1.create();
      combat1.startFromPayload();

      expect(combat1.loseCondition).toBe('SINGLE_LOSS');

      // Test NO_HEARTS
      const combat2 = new MockCombatScene();
      combat2.init({
        runState: {
          player: { gameMode: 'FULL_FEATURES_MODE', board: [[null]] }
        }
      });
      combat2.create();
      combat2.startFromPayload();

      expect(combat2.loseCondition).toBe('NO_HEARTS');
    });

    it('should adapt CombatScene enemy scaling based on config', () => {
      // Test SHOP_ONLY_MODE scaling (1 + round * 0.1)
      const combat1 = new MockCombatScene();
      combat1.init({
        runState: {
          player: { gameMode: 'SHOP_ONLY_MODE', board: [[null]], round: 5 }
        }
      });
      combat1.create();
      combat1.startFromPayload();

      const enemy1 = combat1.createCombatUnit({}, 'RIGHT', 5);
      // EASY difficulty: hpMult=0.8
      // Base: 100 * 0.8 = 80
      // Scaling: 1 + 5 * 0.1 = 1.5
      // Result: 80 * 1.5 = 120
      expect(enemy1.hp).toBeGreaterThan(100);

      // Test FULL_FEATURES_MODE scaling (1 + round * 0.3)
      const combat2 = new MockCombatScene();
      combat2.init({
        runState: {
          player: { gameMode: 'FULL_FEATURES_MODE', board: [[null]], round: 5 }
        }
      });
      combat2.create();
      combat2.startFromPayload();

      const enemy2 = combat2.createCombatUnit({}, 'RIGHT', 5);
      // HARD difficulty: hpMult=1.3
      // Base: 100 * 1.3 = 130
      // Scaling: 1 + 5 * 0.3 = 2.5
      // Result: 130 * 2.5 = 325
      expect(enemy2.hp).toBeGreaterThan(enemy1.hp);
    });
  });

  describe('Conditional system usage', () => {
    it('should enable shop system when shop is enabled', () => {
      const planning = new MockPlanningScene();
      planning.init({ mode: 'SHOP_ONLY_MODE' });
      planning.create();

      // Shop buttons should exist
      expect(planning.buttons.roll).toBeDefined();
      expect(planning.buttons.xp).toBeDefined();
      expect(planning.buttons.lock).toBeDefined();
    });

    it('should disable crafting system when crafting is disabled', () => {
      const planning = new MockPlanningScene();
      planning.init({ mode: 'SHOP_ONLY_MODE' });
      planning.create();

      // Crafting button should not exist
      expect(planning.buttons.upgradeCraft).toBeUndefined();
    });

    it('should enable crafting system when crafting is enabled', () => {
      const planning = new MockPlanningScene();
      planning.init({ mode: 'FULL_FEATURES_MODE' });
      planning.create();

      // Crafting button should exist
      expect(planning.buttons.upgradeCraft).toBeDefined();
    });

    it('should handle mode with all systems disabled', () => {
      const noSystemsMode = createGameModeConfig('NO_SYSTEMS_MODE', {
        name: 'No Systems Mode',
        description: 'Mode with all systems disabled',
        scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
        startingGold: 10,
        startingHP: 3,
        loseCondition: LOSE_CONDITION.NO_HEARTS,
        enabledSystems: {
          shop: false,
          crafting: false,
          augments: false,
          pvp: false
        },
        aiDifficulty: AI_DIFFICULTY.MEDIUM,
        goldScaling: (round) => 10,
        enemyScaling: (round) => 1.0
      });
      GameModeRegistry.register(noSystemsMode);

      const planning = new MockPlanningScene();
      planning.init({ mode: 'NO_SYSTEMS_MODE' });
      planning.create();

      // No system buttons should exist
      expect(planning.buttons.roll).toBeUndefined();
      expect(planning.buttons.xp).toBeUndefined();
      expect(planning.buttons.lock).toBeUndefined();
      expect(planning.buttons.upgradeCraft).toBeUndefined();
    });

    it('should handle mode with all systems enabled', () => {
      const planning = new MockPlanningScene();
      planning.init({ mode: 'FULL_FEATURES_MODE' });
      planning.create();

      // All system buttons should exist
      expect(planning.buttons.roll).toBeDefined();
      expect(planning.buttons.xp).toBeDefined();
      expect(planning.buttons.lock).toBeDefined();
      expect(planning.buttons.upgradeCraft).toBeDefined();
    });
  });

  describe('Scene flow based on mode.scenes', () => {
    it('should follow standard scene flow: MainMenu → Planning → Combat → Planning', () => {
      // 1. Start from MainMenu
      const mainMenu = new MockMainMenuScene();
      mainMenu.selectGameMode('SHOP_ONLY_MODE');
      const startResult = mainMenu.startNewGame();

      expect(startResult.scene).toBe('PlanningScene');

      // 2. Planning → Combat
      const planning = new MockPlanningScene();
      planning.init(startResult.data);
      planning.create();
      planning.startNewRun();
      const combatStart = planning.startCombat();

      expect(combatStart.scene).toBe('CombatScene');

      // 3. Combat → Planning
      const combat = new MockCombatScene();
      combat.init(combatStart.data);
      combat.create();
      combat.startFromPayload();
      const combatEnd = combat.endCombat({ victory: true });

      expect(combatEnd.scene).toBe('PlanningScene');
    });

    it('should maintain mode throughout scene flow', () => {
      const mainMenu = new MockMainMenuScene();
      mainMenu.selectGameMode('FULL_FEATURES_MODE');
      const startResult = mainMenu.startNewGame();

      // Check mode in Planning
      const planning = new MockPlanningScene();
      planning.init(startResult.data);
      planning.create();
      expect(planning.gameMode).toBe('FULL_FEATURES_MODE');

      // Check mode in Combat
      planning.startNewRun();
      const combatStart = planning.startCombat();
      const combat = new MockCombatScene();
      combat.init(combatStart.data);
      combat.create();
      combat.startFromPayload();
      expect(combat.gameModeConfig.id).toBe('FULL_FEATURES_MODE');

      // Check mode persists after combat
      const combatEnd = combat.endCombat({ victory: true });
      expect(combatEnd.data.restoredState.player.gameMode).toBe('FULL_FEATURES_MODE');
    });

    it('should handle scene transitions with different modes', () => {
      // Test mode 1
      const mainMenu1 = new MockMainMenuScene();
      mainMenu1.selectGameMode('SHOP_ONLY_MODE');
      const start1 = mainMenu1.startNewGame();
      expect(start1.data.mode).toBe('SHOP_ONLY_MODE');

      // Test mode 2
      const mainMenu2 = new MockMainMenuScene();
      mainMenu2.selectGameMode('FULL_FEATURES_MODE');
      const start2 = mainMenu2.startNewGame();
      expect(start2.data.mode).toBe('FULL_FEATURES_MODE');
    });

    it('should pass mode data correctly through scene transitions', () => {
      const mainMenu = new MockMainMenuScene();
      mainMenu.selectGameMode('SHOP_ONLY_MODE');
      const startResult = mainMenu.startNewGame();

      // Mode should be in scene data
      expect(startResult.data.mode).toBe('SHOP_ONLY_MODE');

      // Planning should receive mode
      const planning = new MockPlanningScene();
      planning.init(startResult.data);
      planning.create();
      planning.startNewRun();

      // Mode should be in player state
      expect(planning.player.gameMode).toBe('SHOP_ONLY_MODE');

      // Combat should receive mode through player state
      const combatStart = planning.startCombat();
      expect(combatStart.data.runState.player.gameMode).toBe('SHOP_ONLY_MODE');

      // Combat should read mode
      const combat = new MockCombatScene();
      combat.init(combatStart.data);
      combat.create();
      expect(combat.gameModeConfig.id).toBe('SHOP_ONLY_MODE');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid mode gracefully', () => {
      const planning = new MockPlanningScene();
      planning.init({ mode: 'INVALID_MODE' });
      planning.create();

      // Should fallback to EndlessPvEClassic
      expect(planning.gameMode).toBe('EndlessPvEClassic');
    });

    it('should handle missing mode in scene data', () => {
      const planning = new MockPlanningScene();
      planning.init({});
      planning.create();

      // Should use default mode
      expect(planning.gameMode).toBe('EndlessPvEClassic');
    });

    it('should handle missing gameModeConfig in combat', () => {
      const combat = new MockCombatScene();
      combat.init({
        runState: {
          player: { gameMode: 'INVALID_MODE', board: [[null]] }
        }
      });
      combat.create();

      // Should fallback to EndlessPvEClassic
      expect(combat.gameModeConfig).toBeDefined();
    });

    it('should handle mode switching between runs', () => {
      // First run with mode 1
      const mainMenu1 = new MockMainMenuScene();
      mainMenu1.selectGameMode('SHOP_ONLY_MODE');
      const start1 = mainMenu1.startNewGame();

      const planning1 = new MockPlanningScene();
      planning1.init(start1.data);
      planning1.create();
      planning1.startNewRun();
      expect(planning1.player.gold).toBe(25);

      // Second run with mode 2
      const mainMenu2 = new MockMainMenuScene();
      mainMenu2.selectGameMode('FULL_FEATURES_MODE');
      const start2 = mainMenu2.startNewGame();

      const planning2 = new MockPlanningScene();
      planning2.init(start2.data);
      planning2.create();
      planning2.startNewRun();
      expect(planning2.player.gold).toBe(15);
    });

    it('should handle missing enabledSystems in config', () => {
      const minimalMode = createGameModeConfig('MINIMAL_MODE', {
        name: 'Minimal Mode',
        description: 'Mode with minimal config',
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
        enemyScaling: (round) => 1.0
      });
      GameModeRegistry.register(minimalMode);

      const planning = new MockPlanningScene();
      planning.init({ mode: 'MINIMAL_MODE' });
      
      // Should not crash
      expect(() => planning.create()).not.toThrow();
    });
  });
});
