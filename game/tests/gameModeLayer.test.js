/**
 * Comprehensive unit tests for Game Mode Layer
 * 
 * Tests the complete game mode layer including:
 * - GameModeConfig creation and validation
 * - GameModeRegistry registration and retrieval
 * - EndlessPvEClassicMode configuration
 * - Multiple game modes support
 * 
 * **Property 37: Game Mode Configuration Completeness**
 * **Property 38: Game Mode Configuration Validation**
 * **Property 39: Multiple Game Modes Support**
 * **Validates: Requirements 9.2-9.9, 17.1-17.3**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createGameModeConfig,
  validateGameModeConfig,
  LOSE_CONDITION,
  AI_DIFFICULTY
} from '../src/gameModes/GameModeConfig.js'
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js'
import EndlessPvEClassicMode from '../src/gameModes/EndlessPvEClassicMode.js'

describe('Game Mode Layer - Comprehensive Tests', () => {
  beforeEach(() => {
    // Clear registry before each test
    GameModeRegistry.clear()
  })

  describe('Property 37: Game Mode Configuration Completeness', () => {
    it('should create complete config with all required fields from minimal input', () => {
      const config = createGameModeConfig('MINIMAL_TEST')
      
      // Verify all required fields are present
      expect(config).toHaveProperty('id')
      expect(config).toHaveProperty('name')
      expect(config).toHaveProperty('description')
      expect(config).toHaveProperty('scenes')
      expect(config).toHaveProperty('startingGold')
      expect(config).toHaveProperty('startingHP')
      expect(config).toHaveProperty('loseCondition')
      expect(config).toHaveProperty('enabledSystems')
      expect(config).toHaveProperty('aiDifficulty')
      expect(config).toHaveProperty('goldScaling')
      expect(config).toHaveProperty('enemyScaling')
      
      // Verify types are correct
      expect(typeof config.id).toBe('string')
      expect(typeof config.name).toBe('string')
      expect(typeof config.description).toBe('string')
      expect(Array.isArray(config.scenes)).toBe(true)
      expect(typeof config.startingGold).toBe('number')
      expect(typeof config.startingHP).toBe('number')
      expect(typeof config.loseCondition).toBe('string')
      expect(typeof config.enabledSystems).toBe('object')
      expect(typeof config.aiDifficulty).toBe('string')
      expect(typeof config.goldScaling).toBe('function')
      expect(typeof config.enemyScaling).toBe('function')
    })

    it('should create config with all enabledSystems fields', () => {
      const config = createGameModeConfig('SYSTEMS_TEST')
      
      expect(config.enabledSystems).toHaveProperty('shop')
      expect(config.enabledSystems).toHaveProperty('crafting')
      expect(config.enabledSystems).toHaveProperty('augments')
      expect(config.enabledSystems).toHaveProperty('pvp')
      
      expect(typeof config.enabledSystems.shop).toBe('boolean')
      expect(typeof config.enabledSystems.crafting).toBe('boolean')
      expect(typeof config.enabledSystems.augments).toBe('boolean')
      expect(typeof config.enabledSystems.pvp).toBe('boolean')
    })

    it('should create config with functional scaling functions', () => {
      const config = createGameModeConfig('SCALING_TEST')
      
      // Test goldScaling function works
      const gold1 = config.goldScaling(1)
      const gold5 = config.goldScaling(5)
      const gold10 = config.goldScaling(10)
      
      expect(typeof gold1).toBe('number')
      expect(typeof gold5).toBe('number')
      expect(typeof gold10).toBe('number')
      expect(gold1).toBeGreaterThanOrEqual(0)
      
      // Test enemyScaling function works
      const enemy1 = config.enemyScaling(1)
      const enemy5 = config.enemyScaling(5)
      const enemy10 = config.enemyScaling(10)
      
      expect(typeof enemy1).toBe('number')
      expect(typeof enemy5).toBe('number')
      expect(typeof enemy10).toBe('number')
      expect(enemy1).toBeGreaterThanOrEqual(0)
    })

    it('should create config with non-empty scenes array', () => {
      const config = createGameModeConfig('SCENES_TEST')
      
      expect(config.scenes.length).toBeGreaterThan(0)
      expect(config.scenes.every(scene => typeof scene === 'string')).toBe(true)
    })

    it('should preserve custom config values', () => {
      const customConfig = {
        name: 'Custom Mode',
        description: 'A custom game mode for testing',
        startingGold: 25,
        startingHP: 7,
        aiDifficulty: AI_DIFFICULTY.HARD,
        loseCondition: LOSE_CONDITION.SINGLE_LOSS,
        scenes: ['CustomScene1', 'CustomScene2'],
        enabledSystems: {
          shop: false,
          crafting: true,
          augments: false,
          pvp: true
        },
        goldScaling: (round) => round * 3,
        enemyScaling: (round) => Math.pow(round, 1.5)
      }
      
      const config = createGameModeConfig('CUSTOM_TEST', customConfig)
      
      expect(config.name).toBe('Custom Mode')
      expect(config.description).toBe('A custom game mode for testing')
      expect(config.startingGold).toBe(25)
      expect(config.startingHP).toBe(7)
      expect(config.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
      expect(config.loseCondition).toBe(LOSE_CONDITION.SINGLE_LOSS)
      expect(config.scenes).toEqual(['CustomScene1', 'CustomScene2'])
      expect(config.enabledSystems.shop).toBe(false)
      expect(config.enabledSystems.pvp).toBe(true)
      expect(config.goldScaling(5)).toBe(15)
      expect(config.enemyScaling(4)).toBeCloseTo(8, 0)
    })
  })

  describe('Property 38: Game Mode Configuration Validation', () => {
    it('should validate correct config as valid', () => {
      const config = createGameModeConfig('VALID_TEST', {
        name: 'Valid Test Mode',
        description: 'A valid configuration'
      })
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject config with invalid id', () => {
      const config = createGameModeConfig('TEST')
      config.id = ''
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('id'))).toBe(true)
    })

    it('should reject config with invalid name', () => {
      const config = createGameModeConfig('TEST')
      config.name = ''
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('name'))).toBe(true)
    })

    it('should reject config with invalid scenes', () => {
      const config = createGameModeConfig('TEST')
      config.scenes = []
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('scenes'))).toBe(true)
    })

    it('should reject config with negative startingGold', () => {
      const config = createGameModeConfig('TEST')
      config.startingGold = -10
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('startingGold'))).toBe(true)
    })

    it('should reject config with zero or negative startingHP', () => {
      const config = createGameModeConfig('TEST')
      config.startingHP = 0
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('startingHP'))).toBe(true)
    })

    it('should reject config with invalid loseCondition', () => {
      const config = createGameModeConfig('TEST')
      config.loseCondition = 'INVALID_CONDITION'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('loseCondition'))).toBe(true)
    })

    it('should reject config with invalid aiDifficulty', () => {
      const config = createGameModeConfig('TEST')
      config.aiDifficulty = 'IMPOSSIBLE'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('aiDifficulty'))).toBe(true)
    })

    it('should reject config with invalid enabledSystems', () => {
      const config = createGameModeConfig('TEST')
      config.enabledSystems.shop = 'yes'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('enabledSystems'))).toBe(true)
    })

    it('should reject config with non-function goldScaling', () => {
      const config = createGameModeConfig('TEST')
      config.goldScaling = 10
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('goldScaling'))).toBe(true)
    })

    it('should reject config with goldScaling returning negative', () => {
      const config = createGameModeConfig('TEST')
      config.goldScaling = () => -5
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('goldScaling'))).toBe(true)
    })

    it('should reject config with non-function enemyScaling', () => {
      const config = createGameModeConfig('TEST')
      config.enemyScaling = 1.5
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('enemyScaling'))).toBe(true)
    })

    it('should reject config with enemyScaling returning negative', () => {
      const config = createGameModeConfig('TEST')
      config.enemyScaling = () => -2
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('enemyScaling'))).toBe(true)
    })

    it('should collect multiple validation errors', () => {
      const config = {
        id: '',
        name: '',
        description: 123,
        scenes: [],
        startingGold: -5,
        startingHP: 0,
        loseCondition: 'INVALID',
        enabledSystems: null,
        aiDifficulty: 'INVALID',
        goldScaling: 'not a function',
        enemyScaling: 'not a function'
      }
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(5)
    })

    it('should validate all LOSE_CONDITION values', () => {
      for (const condition of Object.values(LOSE_CONDITION)) {
        const config = createGameModeConfig('TEST')
        config.loseCondition = condition
        
        const result = validateGameModeConfig(config)
        
        expect(result.valid).toBe(true)
      }
    })

    it('should validate all AI_DIFFICULTY values', () => {
      for (const difficulty of Object.values(AI_DIFFICULTY)) {
        const config = createGameModeConfig('TEST')
        config.aiDifficulty = difficulty
        
        const result = validateGameModeConfig(config)
        
        expect(result.valid).toBe(true)
      }
    })
  })

  describe('Property 39: Multiple Game Modes Support', () => {
    it('should register multiple game modes without conflicts', () => {
      const mode1 = createGameModeConfig('MODE_1', {
        name: 'Mode 1',
        startingGold: 10
      })
      const mode2 = createGameModeConfig('MODE_2', {
        name: 'Mode 2',
        startingGold: 15
      })
      const mode3 = createGameModeConfig('MODE_3', {
        name: 'Mode 3',
        startingGold: 20
      })
      
      const result1 = GameModeRegistry.register(mode1)
      const result2 = GameModeRegistry.register(mode2)
      const result3 = GameModeRegistry.register(mode3)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)
      
      expect(GameModeRegistry.has('MODE_1')).toBe(true)
      expect(GameModeRegistry.has('MODE_2')).toBe(true)
      expect(GameModeRegistry.has('MODE_3')).toBe(true)
    })

    it('should retrieve each registered mode with correct config', () => {
      const easyMode = createGameModeConfig('EASY', {
        name: 'Easy Mode',
        startingGold: 20,
        startingHP: 10,
        aiDifficulty: AI_DIFFICULTY.EASY
      })
      
      const mediumMode = createGameModeConfig('MEDIUM', {
        name: 'Medium Mode',
        startingGold: 10,
        startingHP: 3,
        aiDifficulty: AI_DIFFICULTY.MEDIUM
      })
      
      const hardMode = createGameModeConfig('HARD', {
        name: 'Hard Mode',
        startingGold: 5,
        startingHP: 1,
        aiDifficulty: AI_DIFFICULTY.HARD
      })
      
      GameModeRegistry.register(easyMode)
      GameModeRegistry.register(mediumMode)
      GameModeRegistry.register(hardMode)
      
      const retrievedEasy = GameModeRegistry.get('EASY')
      const retrievedMedium = GameModeRegistry.get('MEDIUM')
      const retrievedHard = GameModeRegistry.get('HARD')
      
      expect(retrievedEasy.startingGold).toBe(20)
      expect(retrievedEasy.aiDifficulty).toBe(AI_DIFFICULTY.EASY)
      
      expect(retrievedMedium.startingGold).toBe(10)
      expect(retrievedMedium.aiDifficulty).toBe(AI_DIFFICULTY.MEDIUM)
      
      expect(retrievedHard.startingGold).toBe(5)
      expect(retrievedHard.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
    })

    it('should keep game modes independent from each other', () => {
      const mode1 = createGameModeConfig('INDEPENDENT_1', {
        name: 'Independent 1',
        startingGold: 10,
        enabledSystems: {
          shop: true,
          crafting: true,
          augments: true,
          pvp: false
        }
      })
      
      const mode2 = createGameModeConfig('INDEPENDENT_2', {
        name: 'Independent 2',
        startingGold: 20,
        enabledSystems: {
          shop: false,
          crafting: false,
          augments: false,
          pvp: true
        }
      })
      
      GameModeRegistry.register(mode1)
      GameModeRegistry.register(mode2)
      
      const retrieved1 = GameModeRegistry.get('INDEPENDENT_1')
      const retrieved2 = GameModeRegistry.get('INDEPENDENT_2')
      
      expect(retrieved1.startingGold).toBe(10)
      expect(retrieved1.enabledSystems.shop).toBe(true)
      expect(retrieved1.enabledSystems.pvp).toBe(false)
      
      expect(retrieved2.startingGold).toBe(20)
      expect(retrieved2.enabledSystems.shop).toBe(false)
      expect(retrieved2.enabledSystems.pvp).toBe(true)
    })

    it('should prevent duplicate game mode ids', () => {
      const mode1 = createGameModeConfig('DUPLICATE', {
        name: 'First Version'
      })
      const mode2 = createGameModeConfig('DUPLICATE', {
        name: 'Second Version'
      })
      
      const result1 = GameModeRegistry.register(mode1)
      const result2 = GameModeRegistry.register(mode2)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(false)
      expect(result2.error).toContain('already registered')
    })

    it('should validate each mode independently on registration', () => {
      const validMode = createGameModeConfig('VALID', {
        name: 'Valid Mode'
      })
      
      const invalidMode = createGameModeConfig('INVALID', {
        name: 'Invalid Mode',
        startingGold: -10
      })
      
      const result1 = GameModeRegistry.register(validMode)
      const result2 = GameModeRegistry.register(invalidMode)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(false)
      expect(GameModeRegistry.has('VALID')).toBe(true)
      expect(GameModeRegistry.has('INVALID')).toBe(false)
    })

    it('should support getAll() with multiple modes', () => {
      const mode1 = createGameModeConfig('ALL_1', { name: 'All 1' })
      const mode2 = createGameModeConfig('ALL_2', { name: 'All 2' })
      const mode3 = createGameModeConfig('ALL_3', { name: 'All 3' })
      
      GameModeRegistry.register(mode1)
      GameModeRegistry.register(mode2)
      GameModeRegistry.register(mode3)
      
      const allModes = GameModeRegistry.getAll()
      
      expect(allModes).toHaveLength(3)
      expect(allModes.map(m => m.id)).toContain('ALL_1')
      expect(allModes.map(m => m.id)).toContain('ALL_2')
      expect(allModes.map(m => m.id)).toContain('ALL_3')
    })

    it('should support different scaling functions per mode', () => {
      const linearMode = createGameModeConfig('LINEAR', {
        name: 'Linear Mode',
        goldScaling: (round) => 10 + round,
        enemyScaling: (round) => round
      })
      
      const exponentialMode = createGameModeConfig('EXPONENTIAL', {
        name: 'Exponential Mode',
        goldScaling: (round) => Math.pow(round, 1.5),
        enemyScaling: (round) => Math.pow(round, 2)
      })
      
      GameModeRegistry.register(linearMode)
      GameModeRegistry.register(exponentialMode)
      
      const linear = GameModeRegistry.get('LINEAR')
      const exponential = GameModeRegistry.get('EXPONENTIAL')
      
      expect(linear.goldScaling(5)).toBe(15)
      expect(linear.enemyScaling(5)).toBe(5)
      
      expect(exponential.goldScaling(5)).toBeCloseTo(11.18, 1)
      expect(exponential.enemyScaling(5)).toBe(25)
    })

    it('should support different system configurations per mode', () => {
      const fullMode = createGameModeConfig('FULL', {
        name: 'Full Mode',
        enabledSystems: {
          shop: true,
          crafting: true,
          augments: true,
          pvp: false
        }
      })
      
      const minimalMode = createGameModeConfig('MINIMAL', {
        name: 'Minimal Mode',
        enabledSystems: {
          shop: true,
          crafting: false,
          augments: false,
          pvp: false
        }
      })
      
      const pvpMode = createGameModeConfig('PVP', {
        name: 'PVP Mode',
        enabledSystems: {
          shop: true,
          crafting: true,
          augments: true,
          pvp: true
        }
      })
      
      GameModeRegistry.register(fullMode)
      GameModeRegistry.register(minimalMode)
      GameModeRegistry.register(pvpMode)
      
      const full = GameModeRegistry.get('FULL')
      const minimal = GameModeRegistry.get('MINIMAL')
      const pvp = GameModeRegistry.get('PVP')
      
      expect(full.enabledSystems.crafting).toBe(true)
      expect(full.enabledSystems.augments).toBe(true)
      
      expect(minimal.enabledSystems.crafting).toBe(false)
      expect(minimal.enabledSystems.augments).toBe(false)
      
      expect(pvp.enabledSystems.pvp).toBe(true)
    })
  })

  describe('EndlessPvEClassicMode Configuration', () => {
    it('should have correct id', () => {
      expect(EndlessPvEClassicMode.id).toBe('EndlessPvEClassic')
    })

    it('should have correct starting resources', () => {
      expect(EndlessPvEClassicMode.startingGold).toBe(10)
      expect(EndlessPvEClassicMode.startingHP).toBe(3)
    })

    it('should have correct lose condition', () => {
      expect(EndlessPvEClassicMode.loseCondition).toBe(LOSE_CONDITION.NO_HEARTS)
    })

    it('should have all core systems enabled', () => {
      expect(EndlessPvEClassicMode.enabledSystems.shop).toBe(true)
      expect(EndlessPvEClassicMode.enabledSystems.crafting).toBe(true)
      expect(EndlessPvEClassicMode.enabledSystems.augments).toBe(true)
      expect(EndlessPvEClassicMode.enabledSystems.pvp).toBe(false)
    })

    it('should have medium AI difficulty', () => {
      expect(EndlessPvEClassicMode.aiDifficulty).toBe(AI_DIFFICULTY.MEDIUM)
    })

    it('should have standard gold scaling (10 per round)', () => {
      expect(EndlessPvEClassicMode.goldScaling(1)).toBe(10)
      expect(EndlessPvEClassicMode.goldScaling(5)).toBe(10)
      expect(EndlessPvEClassicMode.goldScaling(10)).toBe(10)
      expect(EndlessPvEClassicMode.goldScaling(100)).toBe(10)
    })

    it('should have linear enemy scaling', () => {
      expect(EndlessPvEClassicMode.enemyScaling(1)).toBe(1)
      expect(EndlessPvEClassicMode.enemyScaling(5)).toBe(5)
      expect(EndlessPvEClassicMode.enemyScaling(10)).toBe(10)
      expect(EndlessPvEClassicMode.enemyScaling(20)).toBe(20)
    })

    it('should have standard scene flow', () => {
      expect(EndlessPvEClassicMode.scenes).toEqual([
        'LoadingScene',
        'MainMenuScene',
        'PlanningScene',
        'CombatScene'
      ])
    })

    it('should be a valid configuration', () => {
      const result = validateGameModeConfig(EndlessPvEClassicMode)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should be registerable in registry', () => {
      // EndlessPvEClassicMode can be registered
      const result = GameModeRegistry.register(EndlessPvEClassicMode)
      expect(result.success).toBe(true)
      
      expect(GameModeRegistry.has('EndlessPvEClassic')).toBe(true)
      
      const retrieved = GameModeRegistry.get('EndlessPvEClassic')
      expect(retrieved).not.toBeNull()
      expect(retrieved.id).toBe('EndlessPvEClassic')
    })

    it('should have descriptive name and description', () => {
      expect(EndlessPvEClassicMode.name).toBeTruthy()
      expect(EndlessPvEClassicMode.name.length).toBeGreaterThan(0)
      expect(EndlessPvEClassicMode.description).toBeTruthy()
      expect(EndlessPvEClassicMode.description.length).toBeGreaterThan(0)
    })
  })

  describe('Integration: Complete Game Mode Layer', () => {
    it('should support full workflow: create, validate, register, retrieve', () => {
      // Create a new game mode
      const newMode = createGameModeConfig('WORKFLOW_TEST', {
        name: 'Workflow Test Mode',
        description: 'Testing the complete workflow',
        startingGold: 15,
        startingHP: 5,
        aiDifficulty: AI_DIFFICULTY.HARD
      })
      
      // Validate it
      const validation = validateGameModeConfig(newMode)
      expect(validation.valid).toBe(true)
      
      // Register it
      const registration = GameModeRegistry.register(newMode)
      expect(registration.success).toBe(true)
      
      // Retrieve it
      const retrieved = GameModeRegistry.get('WORKFLOW_TEST')
      expect(retrieved).not.toBeNull()
      expect(retrieved.name).toBe('Workflow Test Mode')
      expect(retrieved.startingGold).toBe(15)
    })

    it('should prevent invalid configs from being registered', () => {
      const invalidMode = createGameModeConfig('INVALID_WORKFLOW', {
        name: 'Invalid Mode',
        startingGold: -10  // Invalid
      })
      
      const result = GameModeRegistry.register(invalidMode)
      
      expect(result.success).toBe(false)
      expect(GameModeRegistry.has('INVALID_WORKFLOW')).toBe(false)
    })

    it('should support querying all modes after multiple registrations', () => {
      // Clear and register fresh modes
      GameModeRegistry.clear()
      
      const mode1 = createGameModeConfig('QUERY_1', { name: 'Query 1' })
      const mode2 = createGameModeConfig('QUERY_2', { name: 'Query 2' })
      
      GameModeRegistry.register(mode1)
      GameModeRegistry.register(mode2)
      
      // Re-import EndlessPvEClassicMode to re-register it
      GameModeRegistry.register(EndlessPvEClassicMode)
      
      const allModes = GameModeRegistry.getAll()
      
      expect(allModes.length).toBeGreaterThanOrEqual(3)
      expect(allModes.some(m => m.id === 'QUERY_1')).toBe(true)
      expect(allModes.some(m => m.id === 'QUERY_2')).toBe(true)
      expect(allModes.some(m => m.id === 'EndlessPvEClassic')).toBe(true)
    })
  })
})

