/**
 * Unit tests for example game modes (EndlessMode and PVPMode)
 * 
 * Tests that the example mode configurations are valid and properly registered.
 * These modes demonstrate how to create and configure different game modes.
 * 
 * **Validates: Requirements 9.10, 11.1**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { validateGameModeConfig, AI_DIFFICULTY, LOSE_CONDITION } from '../src/gameModes/GameModeConfig.js'
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js'
import EndlessMode from '../src/gameModes/EndlessMode.js'
import PVPMode from '../src/gameModes/PVPMode.js'

describe('Example Game Modes', () => {
  // Clear and re-register modes before each test to ensure clean state
  beforeEach(() => {
    GameModeRegistry.clear()
    GameModeRegistry.register(EndlessMode)
    GameModeRegistry.register(PVPMode)
  })

  describe('EndlessMode', () => {
    describe('Configuration Validation', () => {
      it('should have a valid configuration', () => {
        const result = validateGameModeConfig(EndlessMode)
        
        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('should have correct id', () => {
        expect(EndlessMode.id).toBe('ENDLESS')
      })

      it('should have correct name', () => {
        expect(EndlessMode.name).toBe('Endless Mode')
      })

      it('should have a description', () => {
        expect(EndlessMode.description).toBeTruthy()
        expect(typeof EndlessMode.description).toBe('string')
        expect(EndlessMode.description.length).toBeGreaterThan(0)
      })

      it('should have standard scene flow', () => {
        expect(EndlessMode.scenes).toEqual([
          'LoadingScene',
          'MainMenuScene',
          'PlanningScene',
          'CombatScene'
        ])
      })
    })

    describe('Starting Resources', () => {
      it('should start with 15 gold', () => {
        expect(EndlessMode.startingGold).toBe(15)
      })

      it('should start with 5 HP', () => {
        expect(EndlessMode.startingHP).toBe(5)
      })
    })

    describe('Game Rules', () => {
      it('should use NO_HEARTS lose condition', () => {
        expect(EndlessMode.loseCondition).toBe(LOSE_CONDITION.NO_HEARTS)
      })

      it('should have correct enabled systems', () => {
        expect(EndlessMode.enabledSystems).toEqual({
          shop: true,
          crafting: true,
          augments: true,
          pvp: false
        })
      })

      it('should use HARD AI difficulty', () => {
        expect(EndlessMode.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
      })
    })

    describe('Scaling Functions', () => {
      it('should have goldScaling function', () => {
        expect(typeof EndlessMode.goldScaling).toBe('function')
      })

      it('should have enemyScaling function', () => {
        expect(typeof EndlessMode.enemyScaling).toBe('function')
      })

      it('should scale gold aggressively (10 + round * 1.5)', () => {
        // Round 1: 10 + 1.5 = 11
        expect(EndlessMode.goldScaling(1)).toBe(11)
        
        // Round 2: 10 + 3 = 13
        expect(EndlessMode.goldScaling(2)).toBe(13)
        
        // Round 3: 10 + 4.5 = 14
        expect(EndlessMode.goldScaling(3)).toBe(14)
        
        // Round 5: 10 + 7.5 = 17
        expect(EndlessMode.goldScaling(5)).toBe(17)
        
        // Round 10: 10 + 15 = 25
        expect(EndlessMode.goldScaling(10)).toBe(25)
      })

      it('should scale enemies aggressively (round * 2.5)', () => {
        // Round 1: 2.5 = 2
        expect(EndlessMode.enemyScaling(1)).toBe(2)
        
        // Round 2: 5 = 5
        expect(EndlessMode.enemyScaling(2)).toBe(5)
        
        // Round 3: 7.5 = 7
        expect(EndlessMode.enemyScaling(3)).toBe(7)
        
        // Round 4: 10 = 10
        expect(EndlessMode.enemyScaling(4)).toBe(10)
        
        // Round 10: 25 = 25
        expect(EndlessMode.enemyScaling(10)).toBe(25)
      })

      it('should return non-negative values for all rounds', () => {
        for (let round = 1; round <= 20; round++) {
          expect(EndlessMode.goldScaling(round)).toBeGreaterThanOrEqual(0)
          expect(EndlessMode.enemyScaling(round)).toBeGreaterThanOrEqual(0)
        }
      })
    })

    describe('Registry Integration', () => {
      it('should be registered in GameModeRegistry', () => {
        expect(GameModeRegistry.has('ENDLESS')).toBe(true)
      })

      it('should be retrievable from registry', () => {
        const retrieved = GameModeRegistry.get('ENDLESS')
        
        expect(retrieved).not.toBeNull()
        expect(retrieved.id).toBe('ENDLESS')
        expect(retrieved.name).toBe('Endless Mode')
      })

      it('should have same properties when retrieved from registry', () => {
        const retrieved = GameModeRegistry.get('ENDLESS')
        
        expect(retrieved.startingGold).toBe(15)
        expect(retrieved.startingHP).toBe(5)
        expect(retrieved.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
        expect(retrieved.goldScaling(5)).toBe(17)
        expect(retrieved.enemyScaling(4)).toBe(10)
      })
    })
  })

  describe('PVPMode', () => {
    describe('Configuration Validation', () => {
      it('should have a valid configuration', () => {
        const result = validateGameModeConfig(PVPMode)
        
        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('should have correct id', () => {
        expect(PVPMode.id).toBe('PVP')
      })

      it('should have correct name', () => {
        expect(PVPMode.name).toBe('PVP Mode (Coming Soon)')
      })

      it('should have a description indicating not yet implemented', () => {
        expect(PVPMode.description).toBeTruthy()
        expect(typeof PVPMode.description).toBe('string')
        expect(PVPMode.description).toContain('NOT YET IMPLEMENTED')
      })

      it('should have standard scene flow', () => {
        expect(PVPMode.scenes).toEqual([
          'LoadingScene',
          'MainMenuScene',
          'PlanningScene',
          'CombatScene'
        ])
      })
    })

    describe('Starting Resources', () => {
      it('should start with 10 gold', () => {
        expect(PVPMode.startingGold).toBe(10)
      })

      it('should start with 3 HP', () => {
        expect(PVPMode.startingHP).toBe(3)
      })
    })

    describe('Game Rules', () => {
      it('should use NO_HEARTS lose condition', () => {
        expect(PVPMode.loseCondition).toBe(LOSE_CONDITION.NO_HEARTS)
      })

      it('should have pvp system enabled', () => {
        expect(PVPMode.enabledSystems.pvp).toBe(true)
      })

      it('should have other systems enabled', () => {
        expect(PVPMode.enabledSystems).toEqual({
          shop: true,
          crafting: true,
          augments: true,
          pvp: true
        })
      })

      it('should have placeholder AI difficulty', () => {
        expect(PVPMode.aiDifficulty).toBe(AI_DIFFICULTY.MEDIUM)
      })
    })

    describe('Scaling Functions', () => {
      it('should have goldScaling function', () => {
        expect(typeof PVPMode.goldScaling).toBe('function')
      })

      it('should have enemyScaling function', () => {
        expect(typeof PVPMode.enemyScaling).toBe('function')
      })

      it('should have flat gold scaling (placeholder)', () => {
        // PVP mode uses flat 10 gold per round (placeholder)
        expect(PVPMode.goldScaling(1)).toBe(10)
        expect(PVPMode.goldScaling(5)).toBe(10)
        expect(PVPMode.goldScaling(10)).toBe(10)
      })

      it('should have linear enemy scaling (placeholder)', () => {
        // PVP mode uses round number as scaling (placeholder)
        expect(PVPMode.enemyScaling(1)).toBe(1)
        expect(PVPMode.enemyScaling(5)).toBe(5)
        expect(PVPMode.enemyScaling(10)).toBe(10)
      })
    })

    describe('Registry Integration', () => {
      it('should be registered in GameModeRegistry', () => {
        expect(GameModeRegistry.has('PVP')).toBe(true)
      })

      it('should be retrievable from registry', () => {
        const retrieved = GameModeRegistry.get('PVP')
        
        expect(retrieved).not.toBeNull()
        expect(retrieved.id).toBe('PVP')
        expect(retrieved.name).toBe('PVP Mode (Coming Soon)')
      })

      it('should have same properties when retrieved from registry', () => {
        const retrieved = GameModeRegistry.get('PVP')
        
        expect(retrieved.startingGold).toBe(10)
        expect(retrieved.startingHP).toBe(3)
        expect(retrieved.enabledSystems.pvp).toBe(true)
        expect(retrieved.goldScaling(5)).toBe(10)
        expect(retrieved.enemyScaling(5)).toBe(5)
      })
    })
  })

  describe('Mode Switching', () => {
    it('should be able to retrieve EndlessMode then PVPMode', () => {
      const endless = GameModeRegistry.get('ENDLESS')
      expect(endless).not.toBeNull()
      expect(endless.id).toBe('ENDLESS')
      expect(endless.startingGold).toBe(15)
      
      const pvp = GameModeRegistry.get('PVP')
      expect(pvp).not.toBeNull()
      expect(pvp.id).toBe('PVP')
      expect(pvp.startingGold).toBe(10)
    })

    it('should be able to retrieve PVPMode then EndlessMode', () => {
      const pvp = GameModeRegistry.get('PVP')
      expect(pvp).not.toBeNull()
      expect(pvp.id).toBe('PVP')
      expect(pvp.enabledSystems.pvp).toBe(true)
      
      const endless = GameModeRegistry.get('ENDLESS')
      expect(endless).not.toBeNull()
      expect(endless.id).toBe('ENDLESS')
      expect(endless.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
    })

    it('should maintain independent configurations when switching', () => {
      const endless1 = GameModeRegistry.get('ENDLESS')
      const pvp = GameModeRegistry.get('PVP')
      const endless2 = GameModeRegistry.get('ENDLESS')
      
      // Verify EndlessMode properties remain consistent
      expect(endless1.startingGold).toBe(endless2.startingGold)
      expect(endless1.aiDifficulty).toBe(endless2.aiDifficulty)
      
      // Verify modes have different properties
      expect(endless1.startingGold).not.toBe(pvp.startingGold)
      expect(endless1.aiDifficulty).not.toBe(pvp.aiDifficulty)
    })

    it('should list both modes in getAll()', () => {
      const allModes = GameModeRegistry.getAll()
      
      expect(allModes).toHaveLength(2)
      
      const ids = allModes.map(m => m.id)
      expect(ids).toContain('ENDLESS')
      expect(ids).toContain('PVP')
    })
  })

  describe('Mode Comparison', () => {
    it('should have different starting resources', () => {
      expect(EndlessMode.startingGold).not.toBe(PVPMode.startingGold)
      expect(EndlessMode.startingHP).not.toBe(PVPMode.startingHP)
    })

    it('should have different AI difficulties', () => {
      expect(EndlessMode.aiDifficulty).toBe(AI_DIFFICULTY.HARD)
      expect(PVPMode.aiDifficulty).toBe(AI_DIFFICULTY.MEDIUM)
      expect(EndlessMode.aiDifficulty).not.toBe(PVPMode.aiDifficulty)
    })

    it('should have different system configurations', () => {
      expect(EndlessMode.enabledSystems.pvp).toBe(false)
      expect(PVPMode.enabledSystems.pvp).toBe(true)
    })

    it('should have different scaling behaviors', () => {
      // EndlessMode has aggressive scaling, PVPMode has flat/linear
      expect(EndlessMode.goldScaling(10)).toBeGreaterThan(PVPMode.goldScaling(10))
      expect(EndlessMode.enemyScaling(10)).toBeGreaterThan(PVPMode.enemyScaling(10))
    })

    it('should both use standard scene flow', () => {
      expect(EndlessMode.scenes).toEqual(PVPMode.scenes)
    })

    it('should both use NO_HEARTS lose condition', () => {
      expect(EndlessMode.loseCondition).toBe(LOSE_CONDITION.NO_HEARTS)
      expect(PVPMode.loseCondition).toBe(LOSE_CONDITION.NO_HEARTS)
    })
  })
})
