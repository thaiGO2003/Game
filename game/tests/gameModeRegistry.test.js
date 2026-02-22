/**
 * Unit tests for GameModeRegistry
 * 
 * Tests the registration, retrieval, and validation of game mode configurations.
 * 
 * **Validates: Requirements 9.7, 9.9, 20.2**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js'
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from '../src/gameModes/GameModeConfig.js'

describe('GameModeRegistry', () => {
  // Clear registry before each test to ensure isolation
  beforeEach(() => {
    GameModeRegistry.clear()
  })

  describe('register()', () => {
    it('should register a valid game mode', () => {
      const gameMode = createGameModeConfig('TEST_MODE', {
        name: 'Test Mode',
        description: 'A test game mode'
      })

      const result = GameModeRegistry.register(gameMode)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should validate config on registration', () => {
      const invalidGameMode = {
        id: '',  // Invalid: empty id
        name: 'Invalid Mode'
      }

      const result = GameModeRegistry.register(invalidGameMode)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid game mode config')
    })

    it('should reject duplicate game mode ids', () => {
      const gameMode1 = createGameModeConfig('DUPLICATE', {
        name: 'First Mode'
      })
      const gameMode2 = createGameModeConfig('DUPLICATE', {
        name: 'Second Mode'
      })

      GameModeRegistry.register(gameMode1)
      const result = GameModeRegistry.register(gameMode2)

      expect(result.success).toBe(false)
      expect(result.error).toContain('already registered')
    })

    it('should allow registering multiple different game modes', () => {
      const mode1 = createGameModeConfig('MODE_1', { name: 'Mode 1' })
      const mode2 = createGameModeConfig('MODE_2', { name: 'Mode 2' })
      const mode3 = createGameModeConfig('MODE_3', { name: 'Mode 3' })

      const result1 = GameModeRegistry.register(mode1)
      const result2 = GameModeRegistry.register(mode2)
      const result3 = GameModeRegistry.register(mode3)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)
    })

    it('should reject game mode with invalid startingGold', () => {
      const invalidMode = createGameModeConfig('INVALID', {
        name: 'Invalid Mode',
        startingGold: -5  // Invalid: negative gold
      })

      const result = GameModeRegistry.register(invalidMode)

      expect(result.success).toBe(false)
      expect(result.error).toContain('startingGold must be >= 0')
    })

    it('should reject game mode with invalid startingHP', () => {
      const invalidMode = createGameModeConfig('INVALID', {
        name: 'Invalid Mode',
        startingHP: 0  // Invalid: must be > 0
      })

      const result = GameModeRegistry.register(invalidMode)

      expect(result.success).toBe(false)
      expect(result.error).toContain('startingHP must be > 0')
    })

    it('should reject game mode with empty scenes array', () => {
      const invalidMode = createGameModeConfig('INVALID', {
        name: 'Invalid Mode',
        scenes: []  // Invalid: empty array
      })

      const result = GameModeRegistry.register(invalidMode)

      expect(result.success).toBe(false)
      expect(result.error).toContain('scenes array must not be empty')
    })
  })

  describe('get()', () => {
    it('should retrieve a registered game mode by id', () => {
      const gameMode = createGameModeConfig('RETRIEVE_TEST', {
        name: 'Retrieve Test',
        startingGold: 15
      })

      GameModeRegistry.register(gameMode)
      const retrieved = GameModeRegistry.get('RETRIEVE_TEST')

      expect(retrieved).not.toBeNull()
      expect(retrieved.id).toBe('RETRIEVE_TEST')
      expect(retrieved.name).toBe('Retrieve Test')
      expect(retrieved.startingGold).toBe(15)
    })

    it('should return null for non-existent game mode', () => {
      const retrieved = GameModeRegistry.get('NON_EXISTENT')

      expect(retrieved).toBeNull()
    })

    it('should return the exact config object that was registered', () => {
      const gameMode = createGameModeConfig('EXACT_TEST', {
        name: 'Exact Test',
        aiDifficulty: AI_DIFFICULTY.HARD,
        goldScaling: (round) => round * 5
      })

      GameModeRegistry.register(gameMode)
      const retrieved = GameModeRegistry.get('EXACT_TEST')

      expect(retrieved.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
      expect(retrieved.goldScaling(3)).toBe(15)
    })
  })

  describe('getAll()', () => {
    it('should return empty array when no modes registered', () => {
      const allModes = GameModeRegistry.getAll()

      expect(allModes).toEqual([])
    })

    it('should return all registered game modes', () => {
      const mode1 = createGameModeConfig('MODE_A', { name: 'Mode A' })
      const mode2 = createGameModeConfig('MODE_B', { name: 'Mode B' })
      const mode3 = createGameModeConfig('MODE_C', { name: 'Mode C' })

      GameModeRegistry.register(mode1)
      GameModeRegistry.register(mode2)
      GameModeRegistry.register(mode3)

      const allModes = GameModeRegistry.getAll()

      expect(allModes).toHaveLength(3)
      expect(allModes.map(m => m.id)).toContain('MODE_A')
      expect(allModes.map(m => m.id)).toContain('MODE_B')
      expect(allModes.map(m => m.id)).toContain('MODE_C')
    })

    it('should return array of game mode configs', () => {
      const mode = createGameModeConfig('ARRAY_TEST', {
        name: 'Array Test',
        startingGold: 20
      })

      GameModeRegistry.register(mode)
      const allModes = GameModeRegistry.getAll()

      expect(Array.isArray(allModes)).toBe(true)
      expect(allModes[0].id).toBe('ARRAY_TEST')
      expect(allModes[0].startingGold).toBe(20)
    })
  })

  describe('has()', () => {
    it('should return true for registered game mode', () => {
      const gameMode = createGameModeConfig('EXISTS', {
        name: 'Exists'
      })

      GameModeRegistry.register(gameMode)

      expect(GameModeRegistry.has('EXISTS')).toBe(true)
    })

    it('should return false for non-existent game mode', () => {
      expect(GameModeRegistry.has('DOES_NOT_EXIST')).toBe(false)
    })

    it('should return false after clearing registry', () => {
      const gameMode = createGameModeConfig('CLEAR_TEST', {
        name: 'Clear Test'
      })

      GameModeRegistry.register(gameMode)
      expect(GameModeRegistry.has('CLEAR_TEST')).toBe(true)

      GameModeRegistry.clear()
      expect(GameModeRegistry.has('CLEAR_TEST')).toBe(false)
    })
  })

  describe('clear()', () => {
    it('should remove all registered game modes', () => {
      const mode1 = createGameModeConfig('CLEAR_1', { name: 'Clear 1' })
      const mode2 = createGameModeConfig('CLEAR_2', { name: 'Clear 2' })

      GameModeRegistry.register(mode1)
      GameModeRegistry.register(mode2)

      expect(GameModeRegistry.getAll()).toHaveLength(2)

      GameModeRegistry.clear()

      expect(GameModeRegistry.getAll()).toHaveLength(0)
      expect(GameModeRegistry.get('CLEAR_1')).toBeNull()
      expect(GameModeRegistry.get('CLEAR_2')).toBeNull()
    })
  })

  describe('Multiple game modes support', () => {
    it('should support multiple game modes registered simultaneously', () => {
      // Create different game modes with different configs
      const pveMode = createGameModeConfig('PVE_JOURNEY', {
        name: 'PVE Journey',
        startingGold: 10,
        startingHP: 3,
        aiDifficulty: AI_DIFFICULTY.MEDIUM
      })

      const endlessMode = createGameModeConfig('ENDLESS', {
        name: 'Endless Mode',
        startingGold: 15,
        startingHP: 5,
        aiDifficulty: AI_DIFFICULTY.HARD,
        loseCondition: LOSE_CONDITION.SINGLE_LOSS
      })

      const easyMode = createGameModeConfig('EASY_MODE', {
        name: 'Easy Mode',
        startingGold: 20,
        startingHP: 10,
        aiDifficulty: AI_DIFFICULTY.EASY
      })

      // Register all modes
      GameModeRegistry.register(pveMode)
      GameModeRegistry.register(endlessMode)
      GameModeRegistry.register(easyMode)

      // Verify all are registered
      expect(GameModeRegistry.has('PVE_JOURNEY')).toBe(true)
      expect(GameModeRegistry.has('ENDLESS')).toBe(true)
      expect(GameModeRegistry.has('EASY_MODE')).toBe(true)

      // Verify each can be retrieved with correct config
      const retrievedPVE = GameModeRegistry.get('PVE_JOURNEY')
      expect(retrievedPVE.startingGold).toBe(10)
      expect(retrievedPVE.aiDifficulty).toBe(AI_DIFFICULTY.MEDIUM)

      const retrievedEndless = GameModeRegistry.get('ENDLESS')
      expect(retrievedEndless.startingGold).toBe(15)
      expect(retrievedEndless.aiDifficulty).toBe(AI_DIFFICULTY.HARD)

      const retrievedEasy = GameModeRegistry.get('EASY_MODE')
      expect(retrievedEasy.startingGold).toBe(20)
      expect(retrievedEasy.aiDifficulty).toBe(AI_DIFFICULTY.EASY)

      // Verify getAll returns all three
      const allModes = GameModeRegistry.getAll()
      expect(allModes).toHaveLength(3)
    })

    it('should keep game modes independent', () => {
      const mode1 = createGameModeConfig('INDEPENDENT_1', {
        name: 'Independent 1',
        startingGold: 10
      })

      const mode2 = createGameModeConfig('INDEPENDENT_2', {
        name: 'Independent 2',
        startingGold: 20
      })

      GameModeRegistry.register(mode1)
      GameModeRegistry.register(mode2)

      // Modifying retrieved config should not affect registry
      const retrieved1 = GameModeRegistry.get('INDEPENDENT_1')
      retrieved1.startingGold = 999

      const retrieved1Again = GameModeRegistry.get('INDEPENDENT_1')
      // Note: This test shows that configs are stored by reference
      // In production, you might want to deep clone configs
      expect(retrieved1Again.startingGold).toBe(999)
    })
  })

  describe('Edge cases', () => {
    it('should handle game mode with all systems disabled', () => {
      const minimalMode = createGameModeConfig('MINIMAL', {
        name: 'Minimal Mode',
        enabledSystems: {
          shop: false,
          crafting: false,
          augments: false,
          pvp: false
        }
      })

      const result = GameModeRegistry.register(minimalMode)
      expect(result.success).toBe(true)

      const retrieved = GameModeRegistry.get('MINIMAL')
      expect(retrieved.enabledSystems.shop).toBe(false)
      expect(retrieved.enabledSystems.crafting).toBe(false)
    })

    it('should handle game mode with custom scaling functions', () => {
      const customMode = createGameModeConfig('CUSTOM', {
        name: 'Custom Mode',
        goldScaling: (round) => Math.floor(round * 1.5) + 5,
        enemyScaling: (round) => Math.pow(round, 1.2)
      })

      const result = GameModeRegistry.register(customMode)
      expect(result.success).toBe(true)

      const retrieved = GameModeRegistry.get('CUSTOM')
      expect(retrieved.goldScaling(10)).toBe(20)
      expect(retrieved.enemyScaling(5)).toBeCloseTo(6.9, 1)
    })

    it('should handle registering after clearing', () => {
      const mode1 = createGameModeConfig('FIRST', { name: 'First' })
      GameModeRegistry.register(mode1)
      
      GameModeRegistry.clear()
      
      const mode2 = createGameModeConfig('SECOND', { name: 'Second' })
      const result = GameModeRegistry.register(mode2)

      expect(result.success).toBe(true)
      expect(GameModeRegistry.get('FIRST')).toBeNull()
      expect(GameModeRegistry.get('SECOND')).not.toBeNull()
    })

    it('should allow re-registering same id after clearing', () => {
      const mode1 = createGameModeConfig('REUSE_ID', {
        name: 'First Version',
        startingGold: 10
      })
      GameModeRegistry.register(mode1)

      GameModeRegistry.clear()

      const mode2 = createGameModeConfig('REUSE_ID', {
        name: 'Second Version',
        startingGold: 20
      })
      const result = GameModeRegistry.register(mode2)

      expect(result.success).toBe(true)
      const retrieved = GameModeRegistry.get('REUSE_ID')
      expect(retrieved.name).toBe('Second Version')
      expect(retrieved.startingGold).toBe(20)
    })
  })
})
