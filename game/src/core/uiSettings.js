import { DEFAULT_LOSE_CONDITION, normalizeLoseCondition } from "./gameRules.js";

const UI_SETTINGS_KEY = "forest_throne_ui_settings_v1";

export const RESOLUTION_PRESETS = [
  { key: "1280x720", label: "1280x720 (HD)", width: 1280, height: 720 },
  { key: "1600x900", label: "1600x900", width: 1600, height: 900 },
  { key: "1920x1080", label: "1920x1080 (FHD)", width: 1920, height: 1080 },
  { key: "2560x1440", label: "2560x1440 (QHD)", width: 2560, height: 1440 }
];

const DEFAULT_RESOLUTION_KEY = "1600x900";

export function createDefaultUiSettings() {
  return {
    audioEnabled: true,
    aiMode: "MEDIUM",
    loseCondition: DEFAULT_LOSE_CONDITION,
    volumeLevel: 10,
    resolutionKey: DEFAULT_RESOLUTION_KEY,
    guiScale: 3
  };
}

export function normalizeResolutionKey(value) {
  const key = typeof value === "string" ? value : DEFAULT_RESOLUTION_KEY;
  return RESOLUTION_PRESETS.some((preset) => preset.key === key) ? key : DEFAULT_RESOLUTION_KEY;
}

export function resolveResolution(value) {
  const key = normalizeResolutionKey(value);
  return RESOLUTION_PRESETS.find((preset) => preset.key === key) ?? RESOLUTION_PRESETS[1];
}

export function normalizeGuiScale(value) {
  const numeric = Number.isFinite(value) ? Math.round(value) : 3;
  return Math.min(5, Math.max(1, numeric));
}

export function guiScaleToZoom(guiScale) {
  const level = normalizeGuiScale(guiScale);
  return 0.8 + (level - 1) * 0.2;
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
      volumeLevel: Number.isFinite(parsed.volumeLevel) ? Math.min(10, Math.max(1, Math.floor(parsed.volumeLevel))) : defaults.volumeLevel,
      resolutionKey: normalizeResolutionKey(parsed.resolutionKey),
      guiScale: normalizeGuiScale(parsed.guiScale)
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
      volumeLevel: Number.isFinite(settings.volumeLevel) ? Math.min(10, Math.max(1, Math.floor(settings.volumeLevel))) : 10,
      resolutionKey: normalizeResolutionKey(settings.resolutionKey),
      guiScale: normalizeGuiScale(settings.guiScale)
    };
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(payload));
    return true;
  } catch (_err) {
    return false;
  }
}
