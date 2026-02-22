/**
 * Smoke Tests - Quick verification that core game functionality works
 * These tests verify the game can be initialized and basic operations work
 * Complements manual testing for task 9.4.3
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ShopSystem } from '../src/systems/ShopSystem.js'
import { BoardSystem } from '../src/systems/BoardSystem.js'
import { CombatSystem } from '../src/systems/CombatSystem.js'
import { UpgradeSystem } from '../src/systems/UpgradeSystem.js'
import { SynergySystem } from '../src/systems/SynergySystem.js'
import { AISystem } from '../src/systems/AISystem.js'
import { UNIT_BY_ID } from '../src/data/unitCatalog.js'

describe('Smoke Tests - Core Game Functionality', () => {
  describe('Shop System Smoke Test', () => {
    it('should refresh shop and buy unit', () => {
      const player = {
        gold: 20,
        level: 5,
        round: 1,
        bench: [],
        shop: []
      }

      // Refresh shop
      const refreshResult = ShopSystem.refreshShop(player, 2)
      expect(refreshResult.success).toBe(true)
      expect(refreshResult.player.gold).toBe(18)
      expect(refreshResult.player.shop.length).toBeGreaterThan(0)

      // Buy unit
      const buyResult = ShopSystem.buyUnit(refreshResult.player, 0)
      expect(buyResult.success).toBe(true)
      expect(buyResult.player.bench.length).toBe(1)
    })

    it('should lock and preserve shop', () => {
      const player = {
        gold: 20,
        level: 5,
        round: 1,
        bench: [],
        shop: [],
        shopLocked: false
      }

      const refreshResult = ShopSystem.refreshShop(player, 2)
      const shopOffers = refreshResult.player.shop

      ShopSystem.lockShop(refreshResult.player)
      expect(refreshResult.player.shopLocked).toBe(true)
      expect(refreshResult.player.shop).toEqual(shopOffers)
    })
  })

  describe('Board System Smoke Test', () => {
    it('should place and move units on board', () => {
      const board = Array(5).fill(null).map(() => Array(5).fill(null))
      const unit = {
        uid: 'test-1',
        baseId: 'ant',
        star: 1,
        base: UNIT_BY_ID['ant']
      }

      // Place unit
      const placeResult = BoardSystem.placeUnit(board, unit, 2, 2)
      expect(placeResult.success).toBe(true)
      expect(BoardSystem.getUnitAt(board, 2, 2)).toBe(unit)

      // Move unit
      const moveResult = BoardSystem.moveUnit(board, 2, 2, 3, 3)
      expect(moveResult.success).toBe(true)
      expect(BoardSystem.getUnitAt(board, 3, 3)).toBe(unit)
      expect(BoardSystem.getUnitAt(board, 2, 2)).toBe(null)
    })

    it('should enforce deploy limit', () => {
      const board = Array(5).fill(null).map(() => Array(5).fill(null))
      const deployLimit = 2

      // Place 2 units (at limit)
      for (let i = 0; i < 2; i++) {
        const unit = {
          uid: `test-${i}`,
          baseId: 'ant',
          star: 1,
          base: UNIT_BY_ID['ant']
        }
        BoardSystem.placeUnit(board, unit, i, 0)
      }

      expect(BoardSystem.canDeploy(board, deployLimit)).toBe(false)
    })
  })

  describe('Combat System Smoke Test', () => {
    it('should initialize combat and execute turns', () => {
      const playerUnits = [
        {
          uid: 'player-1',
          baseId: 'ant',
          star: 1,
          position: { row: 0, col: 0 },
          stats: { maxHP: 100, attack: 20, defense: 10, speed: 50 },
          currentHP: 100,
          currentRage: 0,
          statusEffects: [],
          isDead: false
        }
      ]

      const enemyUnits = [
        {
          uid: 'enemy-1',
          baseId: 'bee',
          star: 1,
          position: { row: 0, col: 4 },
          stats: { maxHP: 80, attack: 15, defense: 8, speed: 60 },
          currentHP: 80,
          currentRage: 0,
          statusEffects: [],
          isDead: false
        }
      ]

      const state = CombatSystem.initializeCombat(playerUnits, enemyUnits)
      expect(state.playerUnits.length).toBe(1)
      expect(state.enemyUnits.length).toBe(1)
      expect(state.turnOrder.length).toBe(2)

      // Execute one turn
      const nextActor = CombatSystem.getNextActor(state)
      expect(nextActor).toBeDefined()
      expect(nextActor.isDead).toBe(false)
    })

    it('should detect combat end', () => {
      const playerUnits = [
        {
          uid: 'player-1',
          baseId: 'ant',
          star: 1,
          position: { row: 0, col: 0 },
          stats: { maxHP: 100, attack: 20, defense: 10, speed: 50 },
          currentHP: 0,
          currentRage: 0,
          statusEffects: [],
          isDead: true
        }
      ]

      const enemyUnits = [
        {
          uid: 'enemy-1',
          baseId: 'bee',
          star: 1,
          position: { row: 0, col: 4 },
          stats: { maxHP: 80, attack: 15, defense: 8, speed: 60 },
          currentHP: 80,
          currentRage: 0,
          statusEffects: [],
          isDead: false
        }
      ]

      const state = CombatSystem.initializeCombat(playerUnits, enemyUnits)
      const endResult = CombatSystem.checkCombatEnd(state)
      expect(endResult.isFinished).toBe(true)
      expect(endResult.winner).toBe('enemy')
    })
  })

  describe('Upgrade System Smoke Test', () => {
    it('should detect and perform upgrade', () => {
      const units = [
        {
          uid: 'unit-1',
          baseId: 'ant',
          star: 1,
          base: UNIT_BY_ID['ant'],
          equips: []
        },
        {
          uid: 'unit-2',
          baseId: 'ant',
          star: 1,
          base: UNIT_BY_ID['ant'],
          equips: []
        },
        {
          uid: 'unit-3',
          baseId: 'ant',
          star: 1,
          base: UNIT_BY_ID['ant'],
          equips: []
        }
      ]

      const canUpgrade = UpgradeSystem.canUpgrade(units, 'ant', 1)
      expect(canUpgrade).toBe(true)

      const candidates = UpgradeSystem.findUpgradeCandidates(units)
      expect(candidates.length).toBeGreaterThan(0)
    })

    it('should not upgrade star 3 units', () => {
      const units = [
        {
          uid: 'unit-1',
          baseId: 'ant',
          star: 3,
          base: UNIT_BY_ID['ant'],
          equips: []
        },
        {
          uid: 'unit-2',
          baseId: 'ant',
          star: 3,
          base: UNIT_BY_ID['ant'],
          equips: []
        },
        {
          uid: 'unit-3',
          baseId: 'ant',
          star: 3,
          base: UNIT_BY_ID['ant'],
          equips: []
        }
      ]

      const canUpgrade = UpgradeSystem.canUpgrade(units, 'ant', 3)
      expect(canUpgrade).toBe(false)
    })
  })

  describe('Synergy System Smoke Test', () => {
    it('should calculate synergies', () => {
      const units = [
        {
          uid: 'unit-1',
          baseId: 'ant',
          star: 1,
          base: { ...UNIT_BY_ID['ant'], type: 'insect', class: 'warrior' }
        },
        {
          uid: 'unit-2',
          baseId: 'bee',
          star: 1,
          base: { ...UNIT_BY_ID['bee'], type: 'insect', class: 'mage' }
        }
      ]

      const synergies = SynergySystem.calculateSynergies(units)
      expect(Array.isArray(synergies)).toBe(true)
    })
  })

  describe('AI System Smoke Test', () => {
    it('should generate enemy team', () => {
      const round = 1
      const budget = 100
      const difficulty = 'MEDIUM'

      const enemyTeam = AISystem.generateEnemyTeam(round, budget, difficulty)
      expect(Array.isArray(enemyTeam)).toBe(true)
      expect(enemyTeam.length).toBeGreaterThan(0)

      // Verify unique UIDs
      const uids = enemyTeam.map(u => u.uid)
      const uniqueUids = new Set(uids)
      expect(uniqueUids.size).toBe(uids.length)
    })

    it('should scale difficulty', () => {
      const easyMultiplier = AISystem.getAIDifficultyMultiplier('EASY')
      const mediumMultiplier = AISystem.getAIDifficultyMultiplier('MEDIUM')
      const hardMultiplier = AISystem.getAIDifficultyMultiplier('HARD')

      expect(easyMultiplier).toBeLessThan(mediumMultiplier)
      expect(mediumMultiplier).toBeLessThan(hardMultiplier)
    })
  })

  describe('Integration Smoke Test', () => {
    it('should simulate a complete game flow', () => {
      // 1. Initialize player
      const player = {
        gold: 10,
        level: 1,
        round: 1,
        hp: 3,
        bench: [],
        shop: [],
        shopLocked: false
      }

      // 2. Refresh shop
      const refreshResult = ShopSystem.refreshShop(player, 2)
      expect(refreshResult.success).toBe(true)

      // 3. Buy units
      let currentPlayer = refreshResult.player
      if (currentPlayer.shop.length > 0) {
        const buyResult = ShopSystem.buyUnit(currentPlayer, 0)
        if (buyResult.success) {
          currentPlayer = buyResult.player
          expect(currentPlayer.bench.length).toBeGreaterThan(0)
        }
      }

      // 4. Place unit on board
      const board = Array(5).fill(null).map(() => Array(5).fill(null))
      if (currentPlayer.bench.length > 0) {
        const unit = currentPlayer.bench[0]
        const placeResult = BoardSystem.placeUnit(board, unit, 2, 2)
        expect(placeResult.success).toBe(true)
      }

      // 5. Calculate synergies
      const deployedUnits = BoardSystem.getDeployedUnits(board)
      const synergies = SynergySystem.calculateSynergies(deployedUnits)
      expect(Array.isArray(synergies)).toBe(true)

      // 6. Generate enemy team
      const enemyTeam = AISystem.generateEnemyTeam(1, 100, 'MEDIUM')
      expect(enemyTeam.length).toBeGreaterThan(0)

      // Test passes if we get here without errors
      expect(true).toBe(true)
    })
  })
})
