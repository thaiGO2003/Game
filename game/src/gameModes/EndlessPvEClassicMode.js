/**
 * EndlessPvEClassicMode.js
 * 
 * Configuration for the default Endless PvE Classic game mode.
 * This represents the current/existing game mode with standard progression.
 * 
 * Players start with 10 gold and 3 HP, face medium difficulty AI opponents,
 * and progress through rounds with standard gold and enemy scaling.
 */

import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

/**
 * Endless PvE Classic Mode Configuration
 * 
 * The standard game mode where players:
 * - Build teams through shop purchases
 * - Deploy units on a 5x5 board
 * - Battle AI opponents of increasing difficulty
 * - Progress through rounds earning gold
 * - Lose when HP reaches 0
 */
const EndlessPvEClassicMode = createGameModeConfig('EndlessPvEClassic', {
    name: 'PvE Vô tận',
    description: 'The classic auto-battler experience. Build your team, deploy strategically, and survive as long as possible against AI opponents.',

    // Standard scene flow
    scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],

    // Starting resources
    startingGold: 10,
    startingHP: 3,

    // Lose when HP reaches 0
    loseCondition: LOSE_CONDITION.NO_HEARTS,

    // All core systems enabled
    enabledSystems: {
        shop: true,
        crafting: true,
        augments: true,
        pvp: false
    },

    // Medium difficulty AI
    aiDifficulty: AI_DIFFICULTY.MEDIUM,

    // Standard gold scaling: 10 gold per round
    goldScaling: (round) => 10,

    // Enemy strength scales linearly with round number
    enemyScaling: (round) => round
})

// Register the mode in the registry
GameModeRegistry.register(EndlessPvEClassicMode)

export default EndlessPvEClassicMode
