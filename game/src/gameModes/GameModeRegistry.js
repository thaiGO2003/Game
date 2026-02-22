/**
 * GameModeRegistry.js
 * 
 * Central registry for managing game mode configurations.
 * Allows registration, retrieval, and validation of multiple game modes.
 */

import { validateGameModeConfig } from './GameModeConfig.js'

/**
 * Internal storage for registered game modes
 * @type {Map<string, GameModeConfig>}
 */
const gameModes = new Map()

/**
 * Registers a game mode configuration
 * 
 * @param {GameModeConfig} gameMode - The game mode configuration to register
 * @returns {{success: boolean, error?: string}} Result of registration
 * 
 * @example
 * const result = GameModeRegistry.register(myGameMode)
 * if (!result.success) {
 *   console.error("Failed to register:", result.error)
 * }
 */
export function register(gameMode) {
  // Validate the config before registration
  const validation = validateGameModeConfig(gameMode)
  
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid game mode config: ${validation.errors.join(', ')}`
    }
  }

  // Check if a mode with this id already exists
  if (gameModes.has(gameMode.id)) {
    return {
      success: false,
      error: `Game mode with id "${gameMode.id}" is already registered`
    }
  }

  // Register the game mode
  gameModes.set(gameMode.id, gameMode)

  return {
    success: true
  }
}

/**
 * Retrieves a game mode configuration by id
 * 
 * @param {string} gameModeId - The unique identifier of the game mode
 * @returns {GameModeConfig | null} The game mode config, or null if not found
 * 
 * @example
 * const mode = GameModeRegistry.get("EndlessPvEClassic")
 * if (mode) {
 *   console.log("Starting gold:", mode.startingGold)
 * }
 */
export function get(gameModeId) {
  return gameModes.get(gameModeId) || null
}

/**
 * Retrieves all registered game mode configurations
 * 
 * @returns {GameModeConfig[]} Array of all registered game modes
 * 
 * @example
 * const allModes = GameModeRegistry.getAll()
 * allModes.forEach(mode => {
 *   console.log(`${mode.name}: ${mode.description}`)
 * })
 */
export function getAll() {
  return Array.from(gameModes.values())
}

/**
 * Clears all registered game modes (useful for testing)
 * 
 * @returns {void}
 */
export function clear() {
  gameModes.clear()
}

/**
 * Checks if a game mode with the given id is registered
 * 
 * @param {string} gameModeId - The unique identifier to check
 * @returns {boolean} True if the game mode is registered
 * 
 * @example
 * if (GameModeRegistry.has("ENDLESS")) {
 *   console.log("Endless mode is available")
 * }
 */
export function has(gameModeId) {
  return gameModes.has(gameModeId)
}

// Export as default object for convenience
export default {
  register,
  get,
  getAll,
  clear,
  has
}
