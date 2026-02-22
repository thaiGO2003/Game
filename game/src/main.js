import Phaser from "phaser";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { PlanningScene } from "./scenes/PlanningScene.js";
import { CombatScene } from "./scenes/CombatScene.js";
import GameModeRegistry from "./gameModes/GameModeRegistry.js";
import "./gameModes/PVEJourneyMode.js"; // Auto-registers PVE_JOURNEY mode
import "./gameModes/EndlessMode.js"; // Auto-registers ENDLESS mode
import "./gameModes/PVPMode.js"; // Auto-registers PVP mode (stub)

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;
const RENDER_DPR = Math.min(window.devicePixelRatio || 1, 2);

/**
 * Initialize the game with an optional game mode
 * 
 * @param {string} [gameModeId="PVE_JOURNEY"] - The game mode to use (default: PVE_JOURNEY)
 * @returns {Phaser.Game} The initialized Phaser game instance
 */
export function initGame(gameModeId = "PVE_JOURNEY") {
  // Get the game mode configuration
  const gameMode = GameModeRegistry.get(gameModeId);
  
  if (!gameMode) {
    console.warn(`Game mode "${gameModeId}" not found, falling back to PVE_JOURNEY`);
    const fallbackMode = GameModeRegistry.get("PVE_JOURNEY");
    if (!fallbackMode) {
      throw new Error("PVE_JOURNEY mode not registered. Cannot start game.");
    }
    return initGame("PVE_JOURNEY");
  }

  const config = {
    type: Phaser.AUTO,
    parent: "app",
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    resolution: RENDER_DPR,
    autoRound: false,
    backgroundColor: "#11141b",
    scene: [LoadingScene, MainMenuScene, PlanningScene, CombatScene],
    render: {
      antialias: true,
      antialiasGL: true,
      roundPixels: false,
      pixelArt: false,
      powerPreference: "high-performance"
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  const game = new Phaser.Game(config);
  
  // Store game mode in game registry for scenes to access
  game.registry.set("gameMode", gameMode);
  game.registry.set("gameModeId", gameModeId);
  
  return game;
}

// Initialize with default PVE_JOURNEY mode
initGame();
