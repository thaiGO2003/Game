import { FOREST_BACKGROUND_ASSETS } from "../data/forestBackgrounds.js";

const SHARED_AUDIO_ASSETS = [
  ["bgm_menu", "assets/audio/bgm_menu.mp3"],
  ["bgm_planning", "assets/audio/bgm_planning.mp3"],
  ["bgm_combat", "assets/audio/bgm_combat.mp3"],
  ["sfx_key", "assets/audio/key.wav"],
  ["sfx_explosion", "assets/audio/explosion.mp3"],
  ["sfx_blaster", "assets/audio/blaster.mp3"],
  ["sfx_sword", "assets/audio/sword.mp3"],
  ["sfx_ping", "assets/audio/p-ping.mp3"],
  ["sfx_shot", "assets/audio/shot1.wav"]
];

export function queueSharedAssets(scene) {
  SHARED_AUDIO_ASSETS.forEach(([key, path]) => {
    if (scene.cache?.audio?.exists?.(key)) return;
    scene.load.audio(key, path);
  });

  FOREST_BACKGROUND_ASSETS.forEach((asset) => {
    if (scene.textures.exists(asset.key)) return;
    scene.load.image(asset.key, asset.path);
  });
}
