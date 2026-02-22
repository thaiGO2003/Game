import Phaser from "phaser";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { PlanningScene } from "./scenes/PlanningScene.js";
import { CombatScene } from "./scenes/CombatScene.js";
import GameModeRegistry from "./gameModes/GameModeRegistry.js";
import "./gameModes/EndlessPvEClassicMode.js"; // Auto-registers EndlessPvEClassic mode
import "./gameModes/EndlessMode.js"; // Auto-registers ENDLESS mode
import "./gameModes/PVPMode.js"; // Auto-registers PVP mode (stub)

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;
const RENDER_DPR = Math.min(window.devicePixelRatio || 1, 2);

/**
 * Initialize the game with an optional game mode
 * 
 * @param {string} [gameModeId="EndlessPvEClassic"] - The game mode to use
 * @returns {Phaser.Game} The initialized Phaser game instance
 */
export function initGame(gameModeId = "EndlessPvEClassic") {
  // Get the game mode configuration
  const gameMode = GameModeRegistry.get(gameModeId);

  if (!gameMode) {
    console.warn(`Game mode "${gameModeId}" not found, falling back to EndlessPvEClassic`);
    const fallbackMode = GameModeRegistry.get("EndlessPvEClassic");
    if (!fallbackMode) {
      throw new Error("EndlessPvEClassic mode not registered. Cannot start game.");
    }
    return initGame("EndlessPvEClassic");
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

// Initialize with default EndlessPvEClassic mode
initGame();
