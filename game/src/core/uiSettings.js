import { DEFAULT_LOSE_CONDITION, normalizeLoseCondition } from "./gameRules.js";

const UI_SETTINGS_KEY = "forest_throne_ui_settings_v1";

export function createDefaultUiSettings() {
  return {
    audioEnabled: true,
    aiMode: "MEDIUM",
    loseCondition: DEFAULT_LOSE_CONDITION,
    volumeLevel: 10
  };
}

export function loadUiSettings() {
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return createDefaultUiSettings();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return createDefaultUiSettings();
    const defaults = createDefaultUiSettings();
    return {
      ...defaults,
      ...parsed,
      aiMode: ["EASY", "MEDIUM", "HARD"].includes(parsed.aiMode) ? parsed.aiMode : defaults.aiMode,
      loseCondition: normalizeLoseCondition(parsed.loseCondition),
      volumeLevel: Number.isFinite(parsed.volumeLevel) ? Math.min(10, Math.max(1, Math.floor(parsed.volumeLevel))) : defaults.volumeLevel
    };
  } catch (_err) {
    return createDefaultUiSettings();
  }
}

export function saveUiSettings(settings) {
  try {
    const payload = {
      audioEnabled: settings.audioEnabled !== false,
      aiMode: ["EASY", "MEDIUM", "HARD"].includes(settings.aiMode) ? settings.aiMode : "MEDIUM",
      loseCondition: normalizeLoseCondition(settings.loseCondition),
      volumeLevel: Number.isFinite(settings.volumeLevel) ? Math.min(10, Math.max(1, Math.floor(settings.volumeLevel))) : 10
    };
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(payload));
    return true;
  } catch (_err) {
    return false;
  }
}
