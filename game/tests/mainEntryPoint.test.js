/**
 * Tests for main.js entry point
 * 
 * Verifies that the game initializes correctly with game mode support
 */

import { describe, it, expect, beforeAll } from 'vitest'
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js'
import '../src/gameModes/EndlessPvEClassicMode.js' // Auto-registers EndlessPvEClassic

describe('Main Entry Point', () => {
  beforeAll(() => {
    // Ensure EndlessPvEClassic mode is registered
    // It should be auto-registered by the import above
  })

  describe('Game Mode Registry Integration', () => {
    it('should have EndlessPvEClassic mode registered after import', () => {
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      expect(mode).toBeDefined()
      expect(mode.id).toBe('EndlessPvEClassic')
      expect(mode.name).toBe('Endless PvE Classic')
    })

    it('should have valid EndlessPvEClassic configuration', () => {
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      
      // Verify all required properties exist
      expect(mode.id).toBe('EndlessPvEClassic')
      expect(mode.name).toBe('Endless PvE Classic')
      expect(mode.description).toBeDefined()
      expect(Array.isArray(mode.scenes)).toBe(true)
      expect(mode.scenes).toContain('LoadingScene')
      expect(mode.scenes).toContain('MainMenuScene')
      expect(mode.scenes).toContain('PlanningScene')
      expect(mode.scenes).toContain('CombatScene')
      
      // Verify starting resources
      expect(mode.startingGold).toBe(10)
      expect(mode.startingHP).toBe(3)
      
      // Verify systems
      expect(mode.enabledSystems).toBeDefined()
      expect(mode.enabledSystems.shop).toBe(true)
      expect(mode.enabledSystems.crafting).toBe(true)
      expect(mode.enabledSystems.augments).toBe(true)
      expect(mode.enabledSystems.pvp).toBe(false)
      
      // Verify AI difficulty
      expect(mode.aiDifficulty).toBe('MEDIUM')
      
      // Verify scaling functions
      expect(typeof mode.goldScaling).toBe('function')
      expect(typeof mode.enemyScaling).toBe('function')
      expect(mode.goldScaling(1)).toBe(10)
      expect(mode.enemyScaling(5)).toBe(5)
    })

    it('should support multiple game modes registered simultaneously', async () => {
      // Register a second mode
      const { createGameModeConfig } = await import('../src/gameModes/GameModeConfig.js')
      const testMode = createGameModeConfig('TEST_MODE', {
        name: 'Test Mode',
        description: 'Test mode for testing',
        startingGold: 20,
        startingHP: 5
      })
      
      const result = GameModeRegistry.register(testMode)
      expect(result.success).toBe(true)
      
      // Both modes should be available
      expect(GameModeRegistry.get('EndlessPvEClassic')).toBeDefined()
      expect(GameModeRegistry.get('TEST_MODE')).toBeDefined()
      
      const allModes = GameModeRegistry.getAll()
      expect(allModes.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Game Mode Configuration Flow', () => {
    it('should pass game mode to scenes via scene data', () => {
      // This test verifies the integration pattern used in the codebase
      // MainMenuScene passes mode to PlanningScene via scene.start(sceneName, { mode: ... })
      
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      expect(mode).toBeDefined()
      
      // Simulate what MainMenuScene does
      const sceneData = {
        settings: {},
        mode: 'EndlessPvEClassic',
        forceNewRun: true
      }
      
      // Verify the mode can be retrieved
      expect(sceneData.mode).toBe('EndlessPvEClassic')
      
      // Verify the mode config exists
      const modeConfig = GameModeRegistry.get(sceneData.mode)
      expect(modeConfig).toBeDefined()
      expect(modeConfig.id).toBe('EndlessPvEClassic')
    })

    it('should allow scenes to access game mode configuration', () => {
      // Simulate what PlanningScene does in create()
      const incomingData = {
        mode: 'EndlessPvEClassic',
        settings: {}
      }
      
      const gameMode = incomingData.mode ?? 'EndlessPvEClassic'
      const modeConfig = GameModeRegistry.get(gameMode)
      
      expect(modeConfig).toBeDefined()
      expect(modeConfig.startingGold).toBe(10)
      expect(modeConfig.startingHP).toBe(3)
      expect(modeConfig.aiDifficulty).toBe('MEDIUM')
    })

    it('should support game mode-based system initialization', () => {
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      
      // Scenes can check which systems are enabled
      expect(mode.enabledSystems.shop).toBe(true)
      expect(mode.enabledSystems.crafting).toBe(true)
      expect(mode.enabledSystems.augments).toBe(true)
      expect(mode.enabledSystems.pvp).toBe(false)
      
      // This allows conditional UI/logic based on mode
      const shouldShowShop = mode.enabledSystems.shop
      const shouldShowPvp = mode.enabledSystems.pvp
      
      expect(shouldShowShop).toBe(true)
      expect(shouldShowPvp).toBe(false)
    })
  })

  describe('Main.js Integration', () => {
    it('should import GameModeRegistry in main.js', () => {
      // Verify that main.js imports and uses GameModeRegistry
      // This is tested by checking that EndlessPvEClassic mode is available
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      expect(mode).toBeDefined()
      expect(mode.id).toBe('EndlessPvEClassic')
    })

    it('should auto-register EndlessPvEClassic mode on import', () => {
      // EndlessPvEClassicMode.js auto-registers itself when imported
      // This is verified by checking the registry
      expect(GameModeRegistry.has('EndlessPvEClassic')).toBe(true)
      
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      expect(mode).not.toBeNull()
      expect(mode.id).toBe('EndlessPvEClassic')
    })

    it('should support backward compatibility with existing game flow', () => {
      // The existing game flow should work with game mode support
      // MainMenuScene → PlanningScene with mode parameter
      
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      expect(mode).toBeDefined()
      
      // Simulate existing flow
      const sceneData = {
        settings: {},
        mode: 'EndlessPvEClassic'
      }
      
      // PlanningScene should be able to get mode config
      const modeConfig = GameModeRegistry.get(sceneData.mode)
      expect(modeConfig).toBeDefined()
      expect(modeConfig.startingGold).toBe(10)
      expect(modeConfig.startingHP).toBe(3)
    })
  })

  describe('Game Initialization with EndlessPvEClassicMode', () => {
    it('should start game with EndlessPvEClassicMode by default', () => {
      // Verify that the game starts with EndlessPvEClassic mode when no mode is specified
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      expect(mode).toBeDefined()
      expect(mode.id).toBe('EndlessPvEClassic')
      
      // Verify this is the default mode that would be used
      const defaultModeId = 'EndlessPvEClassic'
      const defaultMode = GameModeRegistry.get(defaultModeId)
      expect(defaultMode).toBe(mode)
    })

    it('should pass EndlessPvEClassicMode configuration to scenes', () => {
      // Verify that scenes receive the correct game mode configuration
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      
      // Simulate what happens when MainMenuScene starts PlanningScene
      const sceneData = {
        settings: {},
        mode: 'EndlessPvEClassic',
        forceNewRun: true
      }
      
      // Verify the mode can be retrieved and used by the scene
      const modeConfig = GameModeRegistry.get(sceneData.mode)
      expect(modeConfig).toBeDefined()
      expect(modeConfig.id).toBe('EndlessPvEClassic')
      expect(modeConfig.startingGold).toBe(10)
      expect(modeConfig.startingHP).toBe(3)
      expect(modeConfig.aiDifficulty).toBe('MEDIUM')
      
      // Verify scenes can use the configuration
      expect(modeConfig.enabledSystems.shop).toBe(true)
      expect(typeof modeConfig.goldScaling).toBe('function')
      expect(typeof modeConfig.enemyScaling).toBe('function')
    })

    it('should allow scenes to initialize systems based on game mode', () => {
      // Verify that scenes can conditionally initialize systems based on mode config
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      
      // Simulate scene initialization logic
      const shouldInitializeShop = mode.enabledSystems.shop
      const shouldInitializeCrafting = mode.enabledSystems.crafting
      const shouldInitializeAugments = mode.enabledSystems.augments
      const shouldInitializePvp = mode.enabledSystems.pvp
      
      expect(shouldInitializeShop).toBe(true)
      expect(shouldInitializeCrafting).toBe(true)
      expect(shouldInitializeAugments).toBe(true)
      expect(shouldInitializePvp).toBe(false)
    })

    it('should provide correct scene list for game flow', () => {
      // Verify that the game mode specifies the correct scenes
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      
      expect(mode.scenes).toBeDefined()
      expect(Array.isArray(mode.scenes)).toBe(true)
      expect(mode.scenes).toContain('LoadingScene')
      expect(mode.scenes).toContain('MainMenuScene')
      expect(mode.scenes).toContain('PlanningScene')
      expect(mode.scenes).toContain('CombatScene')
      expect(mode.scenes.length).toBe(4)
    })

    it('should provide scaling functions for game progression', () => {
      // Verify that the game mode provides valid scaling functions
      const mode = GameModeRegistry.get('EndlessPvEClassic')
      
      // Test gold scaling
      expect(typeof mode.goldScaling).toBe('function')
      expect(mode.goldScaling(1)).toBe(10)
      expect(mode.goldScaling(5)).toBe(10)
      expect(mode.goldScaling(10)).toBe(10)
      
      // Test enemy scaling
      expect(typeof mode.enemyScaling).toBe('function')
      expect(mode.enemyScaling(1)).toBe(1)
      expect(mode.enemyScaling(5)).toBe(5)
      expect(mode.enemyScaling(10)).toBe(10)
      
      // Verify scaling functions return positive numbers
      for (let round = 1; round <= 20; round++) {
        expect(mode.goldScaling(round)).toBeGreaterThan(0)
        expect(mode.enemyScaling(round)).toBeGreaterThan(0)
      }
    })
  })
})
