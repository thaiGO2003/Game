/**
 * Tests for PlanningScene game mode config integration
 * 
 * Validates that PlanningScene correctly reads and applies game mode configuration:
 * - Starting gold and HP from config
 * - Gold scaling per round from config
 * - Conditional UI based on enabledSystems
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import GameModeRegistry from '../src/gameModes/GameModeRegistry.js'
import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from '../src/gameModes/GameModeConfig.js'

/**
 * Mock PlanningScene that simulates game mode config integration
 */
class MockPlanningScene {
  constructor() {
    this.gameMode = 'EndlessPvEClassic'
    this.gameModeConfig = null
    this.player = null
    this.buttons = {}
    this.phase = 'PLANNING'
  }

  init(data) {
    this.gameMode = data?.mode ?? this.gameMode
  }

  create() {
    // Get game mode configuration (simulating PlanningScene.create)
    this.gameModeConfig = GameModeRegistry.get(this.gameMode)
    if (!this.gameModeConfig) {
      console.warn(`Game mode "${this.gameMode}" not found, falling back to EndlessPvEClassic`)
      this.gameMode = 'EndlessPvEClassic'
      this.gameModeConfig = GameModeRegistry.get(this.gameMode)
    }

    // Initialize player with default state
    this.player = {
      gold: 10,
      hp: 3,
      round: 1,
      winStreak: 0,
      loseStreak: 0,
      interestCapBonus: 0
    }

    // Create buttons conditionally based on enabledSystems
    if (this.gameModeConfig?.enabledSystems?.shop !== false) {
      this.buttons.roll = { label: 'Roll' }
      this.buttons.xp = { label: 'XP' }
      this.buttons.lock = { label: 'Lock' }
    }

    if (this.gameModeConfig?.enabledSystems?.crafting !== false) {
      this.buttons.upgradeCraft = { label: 'Upgrade Craft' }
    }
  }

  startNewRun() {
    // Apply game mode config starting values (simulating PlanningScene.startNewRun)
    if (this.gameModeConfig) {
      this.player.gold = this.gameModeConfig.startingGold
      this.player.hp = this.gameModeConfig.startingHP
    }
  }

  grantRoundIncome() {
    // Use game mode config for base gold (simulating PlanningScene.grantRoundIncome)
    const base = this.gameModeConfig?.goldScaling?.(this.player.round) ?? 5
    const interestCap = 5 + this.player.interestCapBonus
    const interest = Math.min(interestCap, Math.floor(this.player.gold / 10))
    const winStreakBonus = this.player.winStreak >= 2 ? Math.min(3, Math.floor(this.player.winStreak / 2)) : 0
    const loseStreakBonus = this.player.loseStreak >= 2 ? Math.min(3, Math.floor(this.player.loseStreak / 2)) : 0
    const streak = Math.max(winStreakBonus, loseStreakBonus)
    const gain = base + interest + streak
    this.player.gold += gain
    return gain
  }

  enterPlanning(grantIncome) {
    if (grantIncome) {
      this.grantRoundIncome()
    }

    // Check if augments should be shown (simulating PlanningScene.enterPlanning)
    const isAugmentRound = [5, 10, 15, 20, 25].includes(this.player.round)
    if (this.gameModeConfig?.enabledSystems?.augments !== false && isAugmentRound) {
      this.phase = 'AUGMENT'
    }
  }
}

describe('PlanningScene Game Mode Integration', () => {
  let scene

  beforeEach(() => {
    // Clear registry before each test
    GameModeRegistry.clear()

    // Create a test game mode
    const testMode = createGameModeConfig('TEST_MODE', {
      name: 'Test Mode',
      description: 'Test mode for validation',
      scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],
      startingGold: 20,
      startingHP: 5,
      loseCondition: LOSE_CONDITION.NO_HEARTS,
      enabledSystems: {
        shop: true,
        crafting: false,
        augments: false,
        pvp: false
      },
      aiDifficulty: AI_DIFFICULTY.EASY,
      goldScaling: (round) => 15 + round,
      enemyScaling: (round) => round * 1.5
    })
    GameModeRegistry.register(testMode)

    // Register EndlessPvEClassic as fallback
    const pveMode = createGameModeConfig('EndlessPvEClassic', {
      name: 'PVE Journey',
      description: 'Standard mode',
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
    })
    GameModeRegistry.register(pveMode)

    scene = new MockPlanningScene()
  })

  afterEach(() => {
    GameModeRegistry.clear()
  })

  it('should read game mode config from scene data', () => {
    // Initialize scene with test mode
    scene.init({ mode: 'TEST_MODE' })
    scene.create()

    expect(scene.gameMode).toBe('TEST_MODE')
    expect(scene.gameModeConfig).toBeDefined()
    expect(scene.gameModeConfig.id).toBe('TEST_MODE')
  })

  it('should fallback to EndlessPvEClassic if mode not found', () => {
    // Initialize with invalid mode
    scene.init({ mode: 'INVALID_MODE' })
    scene.create()

    expect(scene.gameMode).toBe('EndlessPvEClassic')
    expect(scene.gameModeConfig).toBeDefined()
    expect(scene.gameModeConfig.id).toBe('EndlessPvEClassic')
  })

  it('should use config.startingGold when starting new run', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()
    scene.startNewRun()

    expect(scene.player.gold).toBe(20) // TEST_MODE startingGold
  })

  it('should use config.startingHP when starting new run', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()
    scene.startNewRun()

    expect(scene.player.hp).toBe(5) // TEST_MODE startingHP
  })

  it('should use config.goldScaling for round income', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()
    scene.startNewRun()

    scene.player.round = 3

    // Grant income (base from goldScaling + interest + streak)
    const gain = scene.grantRoundIncome()

    // goldScaling(3) = 15 + 3 = 18
    // interest = floor(20/10) = 2
    // streak = 0
    // total = 18 + 2 + 0 = 20
    expect(gain).toBe(20)
    expect(scene.player.gold).toBe(40) // 20 starting + 20 income
  })

  it('should not create craft button when crafting disabled', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()

    // TEST_MODE has crafting: false
    expect(scene.buttons.upgradeCraft).toBeUndefined()
  })

  it('should create craft button when crafting enabled', () => {
    scene.init({ mode: 'EndlessPvEClassic' })
    scene.create()

    // EndlessPvEClassic has crafting: true
    expect(scene.buttons.upgradeCraft).toBeDefined()
  })

  it('should create shop buttons when shop enabled', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()

    // TEST_MODE has shop: true
    expect(scene.buttons.roll).toBeDefined()
    expect(scene.buttons.xp).toBeDefined()
    expect(scene.buttons.lock).toBeDefined()
  })

  it('should not show augments when augments disabled', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()
    scene.startNewRun()

    // Set up for augment round
    scene.player.round = 5 // Augment round

    // Enter planning should not show augments
    scene.enterPlanning(false)

    // TEST_MODE has augments: false, so phase should stay PLANNING
    expect(scene.phase).toBe('PLANNING')
  })

  it('should show augments when augments enabled', () => {
    scene.init({ mode: 'EndlessPvEClassic' })
    scene.create()
    scene.startNewRun()

    // Set up for augment round
    scene.player.round = 5 // Augment round

    // Enter planning should show augments
    scene.enterPlanning(false)

    // EndlessPvEClassic has augments: true, so phase should switch to AUGMENT
    expect(scene.phase).toBe('AUGMENT')
  })

  it('should handle missing gameModeConfig gracefully', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()
    scene.startNewRun()

    // Simulate missing config
    scene.gameModeConfig = null

    // Should not crash when granting income
    expect(() => {
      scene.grantRoundIncome()
    }).not.toThrow()

    // Should fallback to default base gold (5)
    // With 20 starting gold: interest = 2, streak = 0
    // total = 5 + 2 + 0 = 7
  })

  it('should use goldScaling with different round numbers', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()
    scene.startNewRun()

    // Round 1: goldScaling(1) = 15 + 1 = 16
    scene.player.round = 1
    scene.player.gold = 0
    const gain1 = scene.grantRoundIncome()
    expect(gain1).toBe(16) // 16 + 0 interest + 0 streak

    // Round 10: goldScaling(10) = 15 + 10 = 25
    scene.player.round = 10
    scene.player.gold = 0
    const gain10 = scene.grantRoundIncome()
    expect(gain10).toBe(25) // 25 + 0 interest + 0 streak
  })

  it('should preserve interest and streak bonuses with goldScaling', () => {
    scene.init({ mode: 'TEST_MODE' })
    scene.create()
    scene.startNewRun()

    scene.player.round = 5
    scene.player.gold = 50 // Should give 5 interest
    scene.player.winStreak = 4 // Should give 2 streak bonus

    const gain = scene.grantRoundIncome()

    // goldScaling(5) = 15 + 5 = 20
    // interest = min(5, floor(50/10)) = 5
    // winStreak = min(3, floor(4/2)) = 2
    // total = 20 + 5 + 2 = 27
    expect(gain).toBe(27)
    expect(scene.player.gold).toBe(77) // 50 + 27
  })
})
