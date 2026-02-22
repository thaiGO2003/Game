/**
 * Unit tests for GameModeConfig
 * 
 * Tests the createGameModeConfig factory function and validateGameModeConfig
 * validation function.
 */

import { describe, it, expect } from 'vitest'
import {
  createGameModeConfig,
  validateGameModeConfig,
  LOSE_CONDITION,
  AI_DIFFICULTY
} from '../src/gameModes/GameModeConfig.js'

describe('GameModeConfig', () => {
  describe('createGameModeConfig', () => {
    it('should create a valid config with only id provided', () => {
      const config = createGameModeConfig('TEST_MODE')
      
      expect(config.id).toBe('TEST_MODE')
      expect(config.name).toBe('TEST_MODE')
      expect(config.description).toBe('')
      expect(config.scenes).toEqual(['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'])
      expect(config.startingGold).toBe(10)
      expect(config.startingHP).toBe(3)
      expect(config.loseCondition).toBe(LOSE_CONDITION.NO_HEARTS)
      expect(config.enabledSystems).toEqual({
        shop: true,
        crafting: true,
        augments: true,
        pvp: false
      })
      expect(config.aiDifficulty).toBe(AI_DIFFICULTY.MEDIUM)
      expect(typeof config.goldScaling).toBe('function')
      expect(typeof config.enemyScaling).toBe('function')
    })

    it('should override defaults with provided config', () => {
      const config = createGameModeConfig('CUSTOM_MODE', {
        name: 'Custom Mode',
        description: 'A custom game mode',
        startingGold: 20,
        startingHP: 5,
        aiDifficulty: AI_DIFFICULTY.HARD
      })
      
      expect(config.id).toBe('CUSTOM_MODE')
      expect(config.name).toBe('Custom Mode')
      expect(config.description).toBe('A custom game mode')
      expect(config.startingGold).toBe(20)
      expect(config.startingHP).toBe(5)
      expect(config.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
    })

    it('should merge enabledSystems with defaults', () => {
      const config = createGameModeConfig('TEST_MODE', {
        enabledSystems: {
          shop: false,
          pvp: true
        }
      })
      
      expect(config.enabledSystems).toEqual({
        shop: false,
        crafting: true,
        augments: true,
        pvp: true
      })
    })

    it('should not allow id to be overridden', () => {
      const config = createGameModeConfig('CORRECT_ID', {
        id: 'WRONG_ID'
      })
      
      expect(config.id).toBe('CORRECT_ID')
    })

    it('should accept custom scaling functions', () => {
      const goldScaling = (round) => 10 + round * 2
      const enemyScaling = (round) => round * 1.5
      
      const config = createGameModeConfig('TEST_MODE', {
        goldScaling,
        enemyScaling
      })
      
      expect(config.goldScaling(5)).toBe(20)
      expect(config.enemyScaling(4)).toBe(6)
    })

    it('should create config with custom scenes', () => {
      const config = createGameModeConfig('TEST_MODE', {
        scenes: ['LoadingScene', 'CustomScene']
      })
      
      expect(config.scenes).toEqual(['LoadingScene', 'CustomScene'])
    })
  })

  describe('validateGameModeConfig', () => {
    it('should validate a correct config', () => {
      const config = createGameModeConfig('VALID_MODE', {
        name: 'Valid Mode',
        description: 'A valid game mode'
      })
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should reject config with missing id', () => {
      const config = createGameModeConfig('TEST_MODE')
      delete config.id
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('id is required and must be a non-empty string')
    })

    it('should reject config with empty id', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.id = ''
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('id is required and must be a non-empty string')
    })

    it('should reject config with missing name', () => {
      const config = createGameModeConfig('TEST_MODE')
      delete config.name
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('name is required and must be a non-empty string')
    })

    it('should reject config with non-string description', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.description = 123
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('description must be a string')
    })

    it('should reject config with non-array scenes', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.scenes = 'not an array'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('scenes must be an array')
    })

    it('should reject config with empty scenes array', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.scenes = []
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('scenes array must not be empty')
    })

    it('should reject config with non-string scene names', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.scenes = ['LoadingScene', 123, 'CombatScene']
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('scenes[1] must be a string')
    })

    it('should reject config with negative startingGold', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.startingGold = -5
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('startingGold must be >= 0')
    })

    it('should accept config with zero startingGold', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.startingGold = 0
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(true)
    })

    it('should reject config with non-number startingGold', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.startingGold = '10'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('startingGold must be a number')
    })

    it('should reject config with zero or negative startingHP', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.startingHP = 0
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('startingHP must be > 0')
    })

    it('should reject config with non-number startingHP', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.startingHP = '3'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('startingHP must be a number')
    })

    it('should reject config with invalid loseCondition', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.loseCondition = 'INVALID_CONDITION'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('loseCondition must be one of'))).toBe(true)
    })

    it('should accept all valid loseConditions', () => {
      for (const condition of Object.values(LOSE_CONDITION)) {
        const config = createGameModeConfig('TEST_MODE')
        config.loseCondition = condition
        
        const result = validateGameModeConfig(config)
        
        expect(result.valid).toBe(true)
      }
    })

    it('should reject config with missing enabledSystems', () => {
      const config = createGameModeConfig('TEST_MODE')
      delete config.enabledSystems
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('enabledSystems must be an object')
    })

    it('should reject config with non-boolean enabledSystems values', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.enabledSystems.shop = 'true'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('enabledSystems.shop must be a boolean')
    })

    it('should reject config with invalid aiDifficulty', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.aiDifficulty = 'IMPOSSIBLE'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('aiDifficulty must be one of'))).toBe(true)
    })

    it('should accept all valid aiDifficulty values', () => {
      for (const difficulty of Object.values(AI_DIFFICULTY)) {
        const config = createGameModeConfig('TEST_MODE')
        config.aiDifficulty = difficulty
        
        const result = validateGameModeConfig(config)
        
        expect(result.valid).toBe(true)
      }
    })

    it('should reject config with non-function goldScaling', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.goldScaling = 10
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('goldScaling must be a function')
    })

    it('should reject config with goldScaling that returns negative', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.goldScaling = () => -5
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('goldScaling must return a non-negative number')
    })

    it('should reject config with goldScaling that returns non-number', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.goldScaling = () => '10'
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('goldScaling must return a non-negative number')
    })

    it('should reject config with goldScaling that throws error', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.goldScaling = () => { throw new Error('Test error') }
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('goldScaling function threw an error'))).toBe(true)
    })

    it('should reject config with non-function enemyScaling', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.enemyScaling = 1.5
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('enemyScaling must be a function')
    })

    it('should reject config with enemyScaling that returns negative', () => {
      const config = createGameModeConfig('TEST_MODE')
      config.enemyScaling = () => -2
      
      const result = validateGameModeConfig(config)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('enemyScaling must return a non-negative number')
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
  })

  describe('LOSE_CONDITION enum', () => {
    it('should have expected values', () => {
      expect(LOSE_CONDITION.NO_HEARTS).toBe('NO_HEARTS')
      expect(LOSE_CONDITION.SINGLE_LOSS).toBe('SINGLE_LOSS')
      expect(LOSE_CONDITION.TIME_LIMIT).toBe('TIME_LIMIT')
    })
  })

  describe('AI_DIFFICULTY enum', () => {
    it('should have expected values', () => {
      expect(AI_DIFFICULTY.EASY).toBe('EASY')
      expect(AI_DIFFICULTY.MEDIUM).toBe('MEDIUM')
      expect(AI_DIFFICULTY.HARD).toBe('HARD')
    })
  })
})
