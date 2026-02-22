/**
 * Thorough Feature Testing
 * 
 * Comprehensive tests for all game features after refactor:
 * - Shop: refresh, buy, sell, lock, unlock
 * - Board: place, move, remove, deploy limit
 * - Upgrades: 3-star, equipment transfer, auto-upgrade
 * - Synergies: all combinations, multiple active
 * - Combat: skills, damage, status effects, victory/defeat
 * - AI: different difficulties, round scaling
 * - Save/load: save mid-game, load, continue
 * 
 * Validates: Requirements 10.4
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ShopSystem } from '../src/systems/ShopSystem.js'
import { BoardSystem } from '../src/systems/BoardSystem.js'
import { UpgradeSystem } from '../src/systems/UpgradeSystem.js'
import { SynergySystem } from '../src/systems/SynergySystem.js'
import { CombatSystem } from '../src/systems/CombatSystem.js'
import { AISystem } from '../src/systems/AISystem.js'
import { saveGame, loadGame } from '../src/core/persistence.js'

describe('Thorough Feature Testing', () => {
  describe('Shop Features', () => {
    let player

    beforeEach(() => {
      player = {
        gold: 50,
        level: 5,
        round: 3,
        shop: [],
        shopLocked: false,
        bench: []
      }
    })

    it('should refresh shop and deduct gold', () => {
      const result = ShopSystem.refreshShop(player, 2)
      
      expect(result.success).toBe(true)
      expect(result.player.gold).toBe(48)
      expect(result.player.shop.length).toBeGreaterThan(0)
    })

    it('should buy unit and add to bench', () => {
      // First refresh to get shop offers
      const refreshResult = ShopSystem.refreshShop(player, 2)
      player = refreshResult.player
      
      // Buy first unit
      const buyResult = ShopSystem.buyUnit(player, 0)
      
      expect(buyResult.success).toBe(true)
      expect(buyResult.player.bench.length).toBe(1)
      expect(buyResult.player.gold).toBeLessThan(48)
      expect(buyResult.player.shop[0]).toBeNull()
    })

    it('should sell unit and add gold', () => {
      // Create a unit to sell
      const unit = {
        uid: 'test-1',
        baseId: 'WARRIOR',
        star: 1,
        equips: []
      }
      player.bench = [unit]
      
      const sellResult = ShopSystem.sellUnit(player, unit)
      
      expect(sellResult.success).toBe(true)
      expect(sellResult.player.gold).toBeGreaterThan(50)
      expect(sellResult.player.bench.length).toBe(0)
    })

    it('should lock shop and preserve offers', () => {
      // Refresh and lock
      const refreshResult = ShopSystem.refreshShop(player, 2)
      player = refreshResult.player
      const originalShop = [...player.shop]
      
      const lockResult = ShopSystem.lockShop(player)
      player = lockResult.player
      
      expect(player.shopLocked).toBe(true)
      expect(player.shop).toEqual(originalShop)
    })

    it('should unlock shop', () => {
      player.shopLocked = true
      
      const unlockResult = ShopSystem.unlockShop(player)
      
      expect(unlockResult.player.shopLocked).toBe(false)
    })
  })

  describe('Board Features', () => {
    let board

    beforeEach(() => {
      board = Array(5).fill(null).map(() => Array(5).fill(null))
    })

    it('should place unit on board', () => {
      const unit = {
        uid: 'test-1',
        baseId: 'WARRIOR',
        star: 1
      }
      
      const result = BoardSystem.placeUnit(board, unit, 0, 0)
      
      expect(result.success).toBe(true)
      expect(result.board[0][0]).toBe(unit)
    })

    it('should move unit on board', () => {
      const unit = {
        uid: 'test-1',
        baseId: 'WARRIOR',
        star: 1
      }
      board[0][0] = unit
      
      const result = BoardSystem.moveUnit(board, 0, 0, 1, 1)
      
      expect(result.success).toBe(true)
      expect(result.board[0][0]).toBeNull()
      expect(result.board[1][1]).toBe(unit)
    })

    it('should remove unit from board', () => {
      const unit = {
        uid: 'test-1',
        baseId: 'WARRIOR',
        star: 1
      }
      board[0][0] = unit
      
      const result = BoardSystem.removeUnit(board, 0, 0)
      
      expect(result.unit).toBe(unit)
      expect(result.board[0][0]).toBeNull()
    })

    it('should enforce deploy limit', () => {
      const deployLimit = 3
      
      // Place 3 units
      for (let i = 0; i < 3; i++) {
        const unit = { uid: `test-${i}`, baseId: 'WARRIOR', star: 1 }
        board[0][i] = unit
      }
      
      const canDeploy = BoardSystem.canDeploy(board, deployLimit)
      expect(canDeploy).toBe(false)
      
      // Try to place 4th unit
      const unit4 = { uid: 'test-4', baseId: 'WARRIOR', star: 1 }
      const result = BoardSystem.placeUnit(board, unit4, 1, 0, deployLimit)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('deploy limit')
    })
  })

  describe('Upgrade Features', () => {
    it('should detect upgrade opportunity with 3 matching units', () => {
      const units = [
        { uid: 'w1', baseId: 'WARRIOR', star: 1, equips: [] },
        { uid: 'w2', baseId: 'WARRIOR', star: 1, equips: [] },
        { uid: 'w3', baseId: 'WARRIOR', star: 1, equips: [] }
      ]
      
      const canUpgrade = UpgradeSystem.canUpgrade(units, 'WARRIOR', 1)
      
      expect(canUpgrade).toBe(true)
    })

    it('should upgrade to 3-star unit', () => {
      const units = [
        { uid: 'w1', baseId: 'WARRIOR', star: 2, equips: [] },
        { uid: 'w2', baseId: 'WARRIOR', star: 2, equips: [] },
        { uid: 'w3', baseId: 'WARRIOR', star: 2, equips: [] }
      ]
      
      const result = UpgradeSystem.upgradeUnit(units, 'WARRIOR', 2)
      
      expect(result.success).toBe(true)
      expect(result.upgradedUnit.star).toBe(3)
      expect(result.remainingUnits.length).toBe(0)
    })

    it('should transfer equipment during upgrade', () => {
      const units = [
        { uid: 'w1', baseId: 'WARRIOR', star: 1, equips: ['SWORD'] },
        { uid: 'w2', baseId: 'WARRIOR', star: 1, equips: ['SHIELD'] },
        { uid: 'w3', baseId: 'WARRIOR', star: 1, equips: ['HELMET'] }
      ]
      
      const result = UpgradeSystem.upgradeUnit(units, 'WARRIOR', 1)
      
      expect(result.success).toBe(true)
      expect(result.upgradedUnit.equips.length).toBeGreaterThan(0)
    })

    it('should auto-detect upgrade candidates', () => {
      const units = [
        { uid: 'w1', baseId: 'WARRIOR', star: 1, equips: [] },
        { uid: 'w2', baseId: 'WARRIOR', star: 1, equips: [] },
        { uid: 'w3', baseId: 'WARRIOR', star: 1, equips: [] },
        { uid: 'm1', baseId: 'MAGE', star: 1, equips: [] },
        { uid: 'm2', baseId: 'MAGE', star: 1, equips: [] }
      ]
      
      const candidates = UpgradeSystem.findUpgradeCandidates(units)
      
      expect(candidates.length).toBeGreaterThan(0)
      expect(candidates.some(c => c.baseId === 'WARRIOR')).toBe(true)
    })
  })

  describe('Synergy Features', () => {
    it('should calculate synergies from deployed units', () => {
      const units = [
        { uid: 'w1', baseId: 'WARRIOR', star: 1, base: { type: 'HUMAN', class: 'WARRIOR' } },
        { uid: 'w2', baseId: 'WARRIOR', star: 1, base: { type: 'HUMAN', class: 'WARRIOR' } },
        { uid: 'w3', baseId: 'WARRIOR', star: 1, base: { type: 'HUMAN', class: 'WARRIOR' } }
      ]
      
      const synergies = SynergySystem.calculateSynergies(units)
      
      expect(synergies.length).toBeGreaterThan(0)
    })

    it('should activate multiple synergies simultaneously', () => {
      const units = [
        { uid: 'w1', baseId: 'WARRIOR', star: 1, base: { type: 'HUMAN', class: 'WARRIOR' } },
        { uid: 'w2', baseId: 'WARRIOR', star: 1, base: { type: 'HUMAN', class: 'WARRIOR' } },
        { uid: 'm1', baseId: 'MAGE', star: 1, base: { type: 'HUMAN', class: 'MAGE' } },
        { uid: 'm2', baseId: 'MAGE', star: 1, base: { type: 'HUMAN', class: 'MAGE' } }
      ]
      
      const synergies = SynergySystem.calculateSynergies(units)
      
      // Should have both HUMAN and possibly class synergies
      expect(synergies.length).toBeGreaterThan(0)
    })

    it('should apply synergy bonuses to units', () => {
      const unit = {
        uid: 'w1',
        baseId: 'WARRIOR',
        star: 1,
        stats: { attack: 10, defense: 5, hp: 100 }
      }
      
      const synergies = [
        { id: 'WARRIOR', level: 1, bonuses: { attack: 5 } }
      ]
      
      SynergySystem.applySynergiesToUnit(unit, synergies)
      
      expect(unit.stats.attack).toBeGreaterThan(10)
    })
  })

  describe('Combat Features', () => {
    it('should execute skills when rage is full', () => {
      const playerUnits = [{
        uid: 'p1',
        baseId: 'WARRIOR',
        star: 1,
        position: { row: 0, col: 0 },
        stats: { attack: 10, defense: 5, hp: 100, speed: 10 },
        currentHP: 100,
        currentRage: 100,
        statusEffects: [],
        isDead: false,
        skill: { id: 'SLASH', damage: 20 }
      }]
      
      const enemyUnits = [{
        uid: 'e1',
        baseId: 'GOBLIN',
        star: 1,
        position: { row: 4, col: 0 },
        stats: { attack: 8, defense: 3, hp: 80, speed: 8 },
        currentHP: 80,
        currentRage: 0,
        statusEffects: [],
        isDead: false
      }]
      
      const state = CombatSystem.initializeCombat(playerUnits, enemyUnits)
      const result = CombatSystem.executeAction(state, playerUnits[0])
      
      expect(result.actionType).toBe('skill')
      expect(playerUnits[0].currentRage).toBe(0)
    })

    it('should calculate damage with modifiers', () => {
      const attacker = {
        stats: { attack: 20, element: 'FIRE' }
      }
      
      const defender = {
        stats: { defense: 10, element: 'NATURE' }
      }
      
      const damage = CombatSystem.calculateDamage(attacker, defender, { baseDamage: 10 })
      
      expect(damage).toBeGreaterThan(0)
    })

    it('should apply status effects', () => {
      const unit = {
        uid: 'u1',
        currentHP: 100,
        statusEffects: []
      }
      
      const effect = {
        type: 'POISON',
        duration: 3,
        damagePerTurn: 5
      }
      
      CombatSystem.applyStatusEffect(unit, effect)
      
      expect(unit.statusEffects.length).toBe(1)
      expect(unit.statusEffects[0].type).toBe('POISON')
    })

    it('should detect victory when all enemies dead', () => {
      const playerUnits = [{
        uid: 'p1',
        isDead: false,
        currentHP: 50
      }]
      
      const enemyUnits = [{
        uid: 'e1',
        isDead: true,
        currentHP: 0
      }]
      
      const state = {
        playerUnits,
        enemyUnits,
        isFinished: false,
        winner: null
      }
      
      const result = CombatSystem.checkCombatEnd(state)
      
      expect(result.isFinished).toBe(true)
      expect(result.winner).toBe('player')
    })

    it('should detect defeat when all player units dead', () => {
      const playerUnits = [{
        uid: 'p1',
        isDead: true,
        currentHP: 0
      }]
      
      const enemyUnits = [{
        uid: 'e1',
        isDead: false,
        currentHP: 50
      }]
      
      const state = {
        playerUnits,
        enemyUnits,
        isFinished: false,
        winner: null
      }
      
      const result = CombatSystem.checkCombatEnd(state)
      
      expect(result.isFinished).toBe(true)
      expect(result.winner).toBe('enemy')
    })
  })

  describe('AI Features', () => {
    it('should generate enemy team with EASY difficulty', () => {
      const round = 3
      const budget = 100
      const difficulty = 'EASY'
      
      const enemies = AISystem.generateEnemyTeam(round, budget, difficulty)
      
      expect(enemies.length).toBeGreaterThan(0)
      expect(enemies.every(e => e.uid)).toBe(true)
    })

    it('should generate enemy team with MEDIUM difficulty', () => {
      const round = 5
      const budget = 150
      const difficulty = 'MEDIUM'
      
      const enemies = AISystem.generateEnemyTeam(round, budget, difficulty)
      
      expect(enemies.length).toBeGreaterThan(0)
    })

    it('should generate enemy team with HARD difficulty', () => {
      const round = 7
      const budget = 200
      const difficulty = 'HARD'
      
      const enemies = AISystem.generateEnemyTeam(round, budget, difficulty)
      
      expect(enemies.length).toBeGreaterThan(0)
      // Hard difficulty should have stronger units
    })

    it('should scale enemy strength with round number', () => {
      const difficulty = 'MEDIUM'
      const budget = 100
      
      const round3Enemies = AISystem.generateEnemyTeam(3, budget, difficulty)
      const round10Enemies = AISystem.generateEnemyTeam(10, budget * 2, difficulty)
      
      expect(round10Enemies.length).toBeGreaterThanOrEqual(round3Enemies.length)
    })

    it('should apply difficulty multipliers', () => {
      const easyMultiplier = AISystem.getAIDifficultyMultiplier('EASY')
      const mediumMultiplier = AISystem.getAIDifficultyMultiplier('MEDIUM')
      const hardMultiplier = AISystem.getAIDifficultyMultiplier('HARD')
      
      expect(easyMultiplier).toBeLessThan(mediumMultiplier)
      expect(mediumMultiplier).toBeLessThan(hardMultiplier)
    })
  })

  describe('Save/Load Features', () => {
    it('should save game state mid-game', () => {
      const gameState = {
        player: {
          gold: 25,
          level: 5,
          round: 3,
          hp: 2,
          bench: [],
          board: Array(5).fill(null).map(() => Array(5).fill(null))
        },
        timestamp: Date.now()
      }
      
      const result = saveGame(gameState)
      
      expect(result.success).toBe(true)
    })

    it('should load saved game state', () => {
      const gameState = {
        player: {
          gold: 25,
          level: 5,
          round: 3,
          hp: 2,
          bench: [],
          board: Array(5).fill(null).map(() => Array(5).fill(null))
        },
        timestamp: Date.now()
      }
      
      saveGame(gameState)
      const loaded = loadGame()
      
      expect(loaded).toBeDefined()
      expect(loaded.player.gold).toBe(25)
      expect(loaded.player.level).toBe(5)
      expect(loaded.player.round).toBe(3)
    })

    it('should continue game from loaded state', () => {
      const gameState = {
        player: {
          gold: 30,
          level: 6,
          round: 5,
          hp: 3,
          bench: [
            { uid: 'u1', baseId: 'WARRIOR', star: 2, equips: [] }
          ],
          board: Array(5).fill(null).map(() => Array(5).fill(null))
        },
        timestamp: Date.now()
      }
      
      saveGame(gameState)
      const loaded = loadGame()
      
      // Should be able to continue playing
      expect(loaded.player.bench.length).toBe(1)
      expect(loaded.player.bench[0].baseId).toBe('WARRIOR')
      expect(loaded.player.bench[0].star).toBe(2)
    })
  })
})
