/**
 * PVPMode.js
 * 
 * Configuration stub for the future PVP (Player vs Player) game mode.
 * This mode is not yet implemented but demonstrates how future game modes
 * can be added to the system.
 * 
 * In PVP mode, players would compete against each other rather than AI opponents.
 * The AI system would be disabled, and a PVP matchmaking/battle system would be used instead.
 * 
 * TODO: Implement PVP system
 * TODO: Implement matchmaking logic
 * TODO: Implement player-to-player combat
 * TODO: Implement ranking/leaderboard system
 * TODO: Define PVP-specific rules and balancing
 */

import { createGameModeConfig, LOSE_CONDITION, AI_DIFFICULTY } from './GameModeConfig.js'
import GameModeRegistry from './GameModeRegistry.js'

/**
 * PVP Mode Configuration (STUB - NOT YET IMPLEMENTED)
 * 
 * This is a placeholder configuration for a future PVP mode where:
 * - Players compete against other players instead of AI
 * - AI system is disabled (pvp system would be used instead)
 * - Matchmaking determines opponents
 * - Ranking/leaderboard tracks player performance
 * - Special PVP-specific rules may apply
 * 
 * NOTE: This mode is currently disabled and serves as an example
 * of how to structure future game mode additions.
 */
const PVPMode = createGameModeConfig('PVP', {
  name: 'PVP (Sắp ra mắt)',
  description: 'Đấu với người chơi khác trong các trận auto-battler chiến thuật. Thử nghiệm đội hình và chiến lược của bạn trước đối thủ thực. [CHƯA TRIỂN KHAI]',

  // Standard scene flow (may need PVP-specific scenes in the future)
  scenes: ['LoadingScene', 'MainMenuScene', 'PlanningScene', 'CombatScene'],

  // Starting resources (subject to change based on PVP balancing)
  startingGold: 10,
  startingHP: 3,

  // Lose condition for PVP (may use different rules)
  loseCondition: LOSE_CONDITION.NO_HEARTS,

  // Systems configuration for PVP
  enabledSystems: {
    shop: true,
    crafting: true,
    augments: true,
    pvp: true  // PVP system enabled (not yet implemented)
  },

  // AI difficulty is not used in PVP mode (players face other players)
  // This is set to MEDIUM as a placeholder but should be ignored
  aiDifficulty: AI_DIFFICULTY.MEDIUM,

  // Gold scaling for PVP (may need different balancing than PVE)
  // TODO: Determine appropriate gold scaling for PVP balance
  goldScaling: (round) => 10,

  // Enemy scaling not used in PVP (opponent strength determined by matchmaking)
  // This is a placeholder and should be ignored in PVP implementation
  enemyScaling: (round) => round
})

// Register the mode in the registry
// NOTE: This mode is registered but not yet functional
// The game should check if PVP system is implemented before allowing selection
GameModeRegistry.register(PVPMode)

export default PVPMode

