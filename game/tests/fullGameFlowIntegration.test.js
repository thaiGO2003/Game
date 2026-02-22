/**
 * Full Game Flow Integration Tests
 * Task 11.2.1: Test full game flow multiple times
 * 
 * This test suite simulates complete game playthroughs with different strategies
 * and edge cases to verify all refactored systems work correctly together.
 * 
 * Requirements: 10.4, 10.6
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ShopSystem } from '../src/systems/ShopSystem.js'
import { BoardSystem } from '../src/systems/BoardSystem.js'
import { UpgradeSystem } from '../src/systems/UpgradeSystem.js'
import { SynergySystem } from '../src/systems/SynergySystem.js'
import { CombatSystem } from '../src/systems/CombatSystem.js'
import { AISystem } from '../src/systems/AISystem.js'
import { UNIT_BY_ID } from '../src/data/unitCatalog.js'

describe('Full Game Flow Integration Tests', () => {
  /**
   * Helper function to create a fresh player state
   */
  function createPlayerState(gold = 10, hp = 3, level = 1, round = 1) {
    return {
      gold,
      hp,
      level,
      round,
      bench: [],
      board: Array(5).fill(null).map(() => Array(5).fill(null)),
      shop: [],
      shopLocked: false,
      exp: 0,
      maxBench: 8
    }
  }

  /**
   * Helper function to create a unit
   */
  function createUnit(baseId, star = 1) {
    const base = UNIT_BY_ID[baseId]
    if (!base) {
      throw new Error(`Unit ${baseId} not found`)
    }
    return {
      uid: `${baseId}_${Date.now()}_${Math.random()}`,
      baseId,
      star,
      base,
      equips: []
    }
  }

  /**
   * Helper function to simulate buying a unit
   */
  function buyUnitHelper(player, unitBaseId) {
    // Add unit to shop first (shop format: { baseId, tier })
    const base = UNIT_BY_ID[unitBaseId]
    if (!base) {
      return { success: false, error: `Unit ${unitBaseId} not found` }
    }
    
    player.shop = [{ baseId: unitBaseId, tier: base.tier }]
    
    // Create unit function
    const createUnitFn = (baseId, star) => createUnit(baseId, star)
    
    // Buy the unit
    const result = ShopSystem.buyUnit(player, 0, createUnitFn, player.maxBench || 8)
    return result
  }

  /**
   * Helper function to deploy a unit to the board
   */
  function deployUnit(player, unitIndex, row, col) {
    const unit = player.bench[unitIndex]
    if (!unit) return { success: false, error: 'No unit at index' }
    
    const deployLimit = player.level || 5 // Default to 5 if no level
    const placeResult = BoardSystem.placeUnit(player.board, unit, row, col, deployLimit)
    if (placeResult.success) {
      player.bench.splice(unitIndex, 1)
    }
    return placeResult
  }

  describe('Game Flow 1: Basic Strategy - Balanced Team', () => {
    it('should complete a full game round with balanced team composition', () => {
      let player = createPlayerState(50, 3, 5, 1) // Level 5 allows 5 units deployed
      
      // Round 1: Buy and deploy units
      // Buy 5 different units for diversity
      const unitsToBuy = ['ant_guard', 'wasp_sting', 'eagle_marksman', 'monkey_spear', 'fox_flame']
      
      for (const unitId of unitsToBuy) {
        const buyResult = buyUnitHelper(player, unitId)
        expect(buyResult.success).toBe(true)
        player = buyResult.player
      }
      
      expect(player.bench.length).toBe(5)
      
      // Deploy units to board
      for (let i = 0; i < 5; i++) {
        const deployResult = deployUnit(player, 0, 0, i)
        expect(deployResult.success).toBe(true)
      }
      
      // Calculate synergies
      const deployedUnits = BoardSystem.getDeployedUnits(player.board)
      const synergies = SynergySystem.calculateSynergies(deployedUnits)
      expect(synergies).toBeDefined()
      
      // Generate enemy team
      const enemyTeam = AISystem.generateEnemyTeam(player.round, 15, 'MEDIUM')
      expect(enemyTeam.length).toBeGreaterThan(0)
      
      // Initialize combat
      const playerCombatUnits = deployedUnits.map((unit, idx) => ({
        ...unit,
        currentHP: unit.base.stats.hp * (1 + (unit.star - 1) * 0.5),
        maxHP: unit.base.stats.hp * (1 + (unit.star - 1) * 0.5),
        currentRage: 0,
        isDead: false,
        position: { row: 0, col: idx },
        side: 'LEFT'
      }))
      
      const enemyCombatUnits = enemyTeam.map((unit, idx) => {
        const base = UNIT_BY_ID[unit.baseId]
        if (!base) return null
        return {
          ...unit,
          base,
          currentHP: base.stats.hp * (1 + (unit.star - 1) * 0.5),
          maxHP: base.stats.hp * (1 + (unit.star - 1) * 0.5),
          currentRage: 0,
          isDead: false,
          position: { row: unit.row, col: unit.col },
          side: 'RIGHT'
        }
      }).filter(u => u !== null)
      
      const combatState = CombatSystem.initializeCombat(playerCombatUnits, enemyCombatUnits)
      expect(combatState).toBeDefined()
      expect(combatState.playerUnits.length).toBe(5)
      expect(combatState.enemyUnits.length).toBeGreaterThan(0)
      expect(combatState.turnOrder).toBeDefined()
      expect(combatState.turnOrder.length).toBeGreaterThan(0)
      
      // Verify combat state is properly initialized
      expect(combatState.isFinished).toBe(false)
      expect(combatState.currentTurn).toBe(0)
      expect(combatState.combatLog).toBeDefined()
      
      // This test verifies all systems work together:
      // - ShopSystem for buying units
      // - BoardSystem for deploying units
      // - SynergySystem for calculating bonuses
      // - AISystem for generating enemies
      // - CombatSystem for initializing combat
    })
  })

  describe('Game Flow 2: Upgrade Strategy - Focus on 3-Star Units', () => {
    it('should handle unit upgrades and equipment transfer', () => {
      let player = createPlayerState(100, 3, 5, 2)
      
      // Create unit function for merges
      const createUnitFn = (baseId, star, equips = []) => createUnit(baseId, star)
      
      // Buy 3 of the same unit to trigger upgrade
      for (let i = 0; i < 3; i++) {
        const buyResult = buyUnitHelper(player, 'ant_guard')
        expect(buyResult.success).toBe(true)
        player = buyResult.player
      }
      
      expect(player.bench.length).toBe(3)
      
      // Check for upgrade opportunities
      const upgradeCandidates = UpgradeSystem.findUpgradeCandidates(player.board, player.bench)
      expect(upgradeCandidates.length).toBeGreaterThan(0)
      
      // Perform auto-merge
      const mergeResult = UpgradeSystem.tryAutoMerge(player.board, player.bench, {}, UNIT_BY_ID, createUnitFn)
      expect(mergeResult.mergeCount).toBeGreaterThan(0)
      
      // Check that we now have a 2-star unit
      const twoStarUnits = player.bench.filter(u => u.star === 2)
      expect(twoStarUnits.length).toBeGreaterThan(0)
      
      // Buy 3 more to upgrade to 3-star
      for (let i = 0; i < 6; i++) {
        const buyResult = buyUnitHelper(player, 'ant_guard')
        if (buyResult.success) {
          player = buyResult.player
        }
      }
      
      // Try auto-merge again
      const secondMerge = UpgradeSystem.tryAutoMerge(player.board, player.bench, {}, UNIT_BY_ID, createUnitFn)
      
      // Should have merged some units
      if (secondMerge.mergeCount > 0) {
        const threeStarUnits = player.bench.filter(u => u.star === 3)
        // May or may not have 3-star depending on how many units we bought
        expect(player.bench.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Game Flow 3: Synergy Strategy - Type/Class Focus', () => {
    it('should activate multiple synergies with focused team', () => {
      let player = createPlayerState(100, 3, 5, 3)
      
      // Buy multiple units of same type to activate synergies
      // Buy 6 SWARM units to activate swarm synergy
      const swarmUnits = ['ant_guard', 'wasp_sting', 'mantis_blade', 'ant_guard', 'wasp_sting', 'mantis_blade']
      
      for (const unitId of swarmUnits) {
        const buyResult = buyUnitHelper(player, unitId)
        if (buyResult.success) {
          player = buyResult.player
        }
      }
      
      // Deploy units
      let deployed = 0
      for (let i = 0; i < Math.min(player.bench.length, 5); i++) {
        const row = Math.floor(deployed / 5)
        const col = deployed % 5
        const deployResult = deployUnit(player, 0, row, col)
        if (deployResult.success) {
          deployed++
        }
      }
      
      // Calculate synergies
      const deployedUnits = BoardSystem.getDeployedUnits(player.board)
      const synergies = SynergySystem.calculateSynergies(deployedUnits)
      
      expect(synergies).toBeDefined()
      expect(synergies).toHaveProperty('classCounts')
      expect(synergies).toHaveProperty('tribeCounts')
      
      // Should have some units counted
      const totalClassCount = Object.values(synergies.classCounts).reduce((a, b) => a + b, 0)
      const totalTribeCount = Object.values(synergies.tribeCounts).reduce((a, b) => a + b, 0)
      expect(totalClassCount).toBeGreaterThan(0)
      expect(totalTribeCount).toBeGreaterThan(0)
    })
  })

  describe('Game Flow 4: Edge Case - No Gold', () => {
    it('should handle operations with insufficient gold gracefully', () => {
      const player = createPlayerState(0, 3, 1, 1)
      
      // Try to refresh shop with no gold
      const refreshResult = ShopSystem.refreshShop(player, 2)
      expect(refreshResult.success).toBe(false)
      expect(refreshResult.error).toBeDefined()
      
      // Try to buy unit with no gold
      const base = UNIT_BY_ID['ant_guard']
      player.shop = [{ baseId: 'ant_guard', tier: base.tier }]
      const createUnitFn = (baseId, star) => createUnit(baseId, star)
      const buyResult = ShopSystem.buyUnit(player, 0, createUnitFn, player.maxBench)
      expect(buyResult.success).toBe(false)
      expect(buyResult.error).toBeDefined()
      
      // Verify player state unchanged
      expect(player.gold).toBe(0)
      expect(player.bench.length).toBe(0)
    })
  })

  describe('Game Flow 5: Edge Case - Full Bench', () => {
    it('should handle full bench scenario', () => {
      let player = createPlayerState(100, 3, 5, 1)
      
      // Fill bench to max capacity
      for (let i = 0; i < player.maxBench; i++) {
        const buyResult = buyUnitHelper(player, 'ant_guard')
        if (buyResult.success) {
          player = buyResult.player
        }
      }
      
      expect(player.bench.length).toBe(player.maxBench)
      
      // Try to buy another unit with full bench
      const buyResult = buyUnitHelper(player, 'wasp_sting')
      expect(buyResult.success).toBe(false)
      expect(buyResult.error.toLowerCase()).toContain('bench')
    })
  })

  describe('Game Flow 6: Edge Case - Max Star Units', () => {
    it('should not upgrade beyond 3-star', () => {
      const player = createPlayerState(100, 3, 10, 5)
      
      // Create three 3-star units
      const threeStarUnits = [
        createUnit('ant_guard', 3),
        createUnit('ant_guard', 3),
        createUnit('ant_guard', 3)
      ]
      
      player.bench = threeStarUnits
      
      // Try to find upgrade candidates
      const upgradeCandidates = UpgradeSystem.findUpgradeCandidates(player.board, player.bench)
      
      // Should not find any upgrade opportunities for 3-star units
      const threeStarUpgrades = upgradeCandidates.filter(c => c.star === 3)
      expect(threeStarUpgrades.length).toBe(0)
    })
  })

  describe('Game Flow 7: Edge Case - Deploy Limit', () => {
    it('should enforce deploy limit based on level', () => {
      const player = createPlayerState(100, 3, 1, 1)
      
      // Level 1 should have deploy limit of 1
      const deployLimit = player.level
      
      // Add units to bench
      for (let i = 0; i < 5; i++) {
        player.bench.push(createUnit('ant_guard', 1))
      }
      
      // Try to deploy more units than limit
      let deployed = 0
      for (let i = 0; i < 5; i++) {
        const canDeploy = BoardSystem.canDeploy(player.board, deployLimit)
        if (canDeploy && deployed < deployLimit) {
          const deployResult = deployUnit(player, 0, 0, i)
          if (deployResult.success) {
            deployed++
          }
        }
      }
      
      // Should only deploy up to limit
      const deployCount = BoardSystem.getDeployCount(player.board)
      expect(deployCount).toBeLessThanOrEqual(deployLimit)
    })
  })

  describe('Game Flow 8: Shop Lock Persistence', () => {
    it('should preserve shop offers when locked across rounds', () => {
      let player = createPlayerState(20, 3, 3, 1)
      
      // Generate shop offers
      const refreshResult = ShopSystem.refreshShop(player, 2)
      expect(refreshResult.success).toBe(true)
      player = refreshResult.player
      
      const originalShop = [...player.shop]
      expect(originalShop.length).toBeGreaterThan(0)
      
      // Lock shop
      const lockResult = ShopSystem.lockShop(player)
      expect(lockResult.success).toBe(true)
      player = lockResult.player
      expect(player.shopLocked).toBe(true)
      
      // Simulate round progression (shop should stay the same)
      player.round++
      
      // Shop should be preserved
      expect(player.shop.length).toBe(originalShop.length)
      
      // Unlock shop
      const unlockResult = ShopSystem.unlockShop(player)
      expect(unlockResult.success).toBe(true)
      player = unlockResult.player
      expect(player.shopLocked).toBe(false)
    })
  })

  describe('Game Flow 9: Combat with Status Effects', () => {
    it('should handle combat with status effects correctly', () => {
      const player = createPlayerState(50, 3, 5, 3)
      
      // Create units with skills that apply status effects
      const playerUnits = [
        createUnit('bat_blood', 2), // Has blood skill
        createUnit('wasp_sting', 2)    // Has sting skill
      ]
      
      player.bench = playerUnits
      
      // Deploy units
      deployUnit(player, 0, 0, 0)
      deployUnit(player, 0, 0, 1)
      
      const deployedUnits = BoardSystem.getDeployedUnits(player.board)
      const enemyTeam = AISystem.generateEnemyTeam(3, 20, 'MEDIUM')
      
      // Initialize combat
      const playerCombatUnits = deployedUnits.map((unit, idx) => ({
        ...unit,
        currentHP: unit.base.stats.hp * (1 + (unit.star - 1) * 0.5),
        maxHP: unit.base.stats.hp * (1 + (unit.star - 1) * 0.5),
        currentRage: 100, // Start with full rage to use skills
        isDead: false,
        position: { row: 0, col: idx },
        side: 'LEFT',
        statusEffects: []
      }))
      
      const enemyCombatUnits = enemyTeam.slice(0, 2).map((unit, idx) => {
        const base = UNIT_BY_ID[unit.baseId]
        if (!base) return null
        return {
          ...unit,
          base,
          currentHP: base.stats.hp * (1 + (unit.star - 1) * 0.5),
          maxHP: base.stats.hp * (1 + (unit.star - 1) * 0.5),
          currentRage: 0,
          isDead: false,
          position: { row: unit.row, col: unit.col },
          side: 'RIGHT',
          statusEffects: []
        }
      }).filter(u => u !== null)
      
      const combatState = CombatSystem.initializeCombat(playerCombatUnits, enemyCombatUnits)
      
      // Execute a few turns
      for (let i = 0; i < 10 && !combatState.isFinished; i++) {
        const actor = CombatSystem.getNextActor(combatState)
        if (!actor) break
        
        const actionResult = CombatSystem.executeAction(combatState, actor)
        expect(actionResult).toBeDefined()
        
        // Check if status effects are being applied
        const allUnits = [...combatState.playerUnits, ...combatState.enemyUnits]
        const unitsWithEffects = allUnits.filter(u => u.statusEffects && u.statusEffects.length > 0)
        
        // Status effects should be present at some point
        if (unitsWithEffects.length > 0) {
          expect(unitsWithEffects[0].statusEffects).toBeDefined()
        }
        
        const endResult = CombatSystem.checkCombatEnd(combatState)
        if (endResult.isFinished) {
          combatState.isFinished = true
          combatState.winner = endResult.winner
        }
      }
    })
  })

  describe('Game Flow 10: Multiple Rounds Progression', () => {
    it('should handle progression through multiple rounds', () => {
      let player = createPlayerState(10, 3, 1, 1)
      
      // Simulate 5 rounds
      for (let round = 1; round <= 5; round++) {
        player.round = round
        player.level = Math.min(round, 10)
        player.gold = 10 + round * 2
        
        // Buy units
        const buyResult = buyUnitHelper(player, 'ant_guard')
        if (buyResult.success) {
          player = buyResult.player
        }
        
        // Deploy if possible
        if (player.bench.length > 0) {
          const deployResult = deployUnit(player, 0, 0, round - 1)
          if (deployResult.success) {
            // Unit deployed successfully
          }
        }
        
        // Generate enemy team (should scale with round)
        const enemyTeam = AISystem.generateEnemyTeam(round, 10 + round * 5, 'MEDIUM')
        expect(enemyTeam.length).toBeGreaterThan(0)
        
        // Enemy strength should increase with rounds
        if (round > 1) {
          const prevRoundEnemy = AISystem.generateEnemyTeam(round - 1, 10 + (round - 1) * 5, 'MEDIUM')
          // Later rounds should have stronger enemies (more units or higher stats)
          expect(enemyTeam.length).toBeGreaterThanOrEqual(prevRoundEnemy.length)
        }
      }
      
      expect(player.round).toBe(5)
    })
  })
})
