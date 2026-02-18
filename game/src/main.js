import Phaser from "phaser";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { PlanningScene } from "./scenes/PlanningScene.js";
import { CombatScene } from "./scenes/CombatScene.js";

const BASE_WIDTH = 1600;
const BASE_HEIGHT = 900;
const RENDER_DPR = Math.min(window.devicePixelRatio || 1, 2);

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  resolution: RENDER_DPR,
  autoRound: false,
  backgroundColor: "#11141b",
  scene: [MainMenuScene, PlanningScene, CombatScene],
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

new Phaser.Game(config);
