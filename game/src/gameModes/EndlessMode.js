/**
 * EndlessMode.js
 * 
 * Configuration for the Endless game mode.
 * This mode is designed for players who want a more challenging experience
 * with aggressive scaling and harder AI opponents.
 * 
 * Players start with more resources (15 gold, 5 HP) but face HARD difficulty
 * AI with aggressive scaling that ramps up quickly.
 */

import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

/**
 * Endless Mode Configuration
 * 
 * A challenging game mode where players:
 * - Start with more resources (15 gold, 5 HP)
 * - Face HARD difficulty AI opponents
 * - Experience aggressive gold and enemy scaling
 * - Must survive as long as possible against increasingly difficult waves
 * - Lose when HP reaches 0
 * 
 * This mode is ideal for experienced players looking for a greater challenge.
 */
const EndlessMode = createGameModeConfig('ENDLESS', {
  name: 'Chế độ Sinh Tồn',
  description: 'Sống sót càng lâu càng tốt trước kẻ địch ngày càng mạnh. Bắt đầu với nhiều tài nguyên hơn nhưng đối mặt AI khó và scaling nhanh.',

  // Standard scene flow
  scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],

  // Higher starting resources for the challenge ahead
  startingGold: 15,
  startingHP: 5,

  // Lose when HP reaches 0
  loseCondition: LOSE_CONDITION.NO_HEARTS,

  // All core systems enabled
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: true,
    pvp: false
  },

  // Hard difficulty AI for maximum challenge
  aiDifficulty: AI_DIFFICULTY.HARD,

  // Aggressive gold scaling: starts at 10, increases by 1.5 per round
  // Round 1: 10, Round 2: 11, Round 3: 13, Round 4: 16, Round 5: 17, etc.
  goldScaling: (round) => 10 + Math.floor(round * 1.5),

  // Aggressive enemy scaling: 2.5x multiplier per round
  // Round 1: 2.5, Round 2: 5, Round 3: 7.5, Round 4: 10, etc.
  // This creates a steep difficulty curve
  enemyScaling: (round) => Math.floor(round * 2.5)
})

// Register the mode in the registry
GameModeRegistry.register(EndlessMode)

export default EndlessMode
