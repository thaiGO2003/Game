import { DEFAULT_LOSE_CONDITION, normalizeLoseCondition } from "./gameRules.js";
import { setLocale, getLocale, getAvailableLocales } from "../i18n/index.js";

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
    aiMode: "EASY",
    loseCondition: DEFAULT_LOSE_CONDITION,
    volumeLevel: 5,
    resolutionKey: DEFAULT_RESOLUTION_KEY,
    guiScale: 2,
    language: "vi"
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
  void value;
  // GUI scale levels are deprecated; keep a fixed compatibility value.
  return 2;
}

export function guiScaleToZoom(guiScale) {
  void guiScale;
  // Keep UI zoom fixed to avoid level-based scaling (1..5).
  return 1;
}

export function loadUiSettings() {
  try {
    const raw = localStorage.getItem(UI_SETTINGS_KEY);
    if (!raw) return createDefaultUiSettings();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return createDefaultUiSettings();
    const defaults = createDefaultUiSettings();
    const settings = {
      ...defaults,
      ...parsed,
      aiMode: ["EASY", "MEDIUM", "HARD"].includes(parsed.aiMode) ? parsed.aiMode : defaults.aiMode,
      loseCondition: normalizeLoseCondition(parsed.loseCondition),
      volumeLevel: Number.isFinite(parsed.volumeLevel) ? Math.min(10, Math.max(1, Math.floor(parsed.volumeLevel))) : defaults.volumeLevel,
      resolutionKey: normalizeResolutionKey(parsed.resolutionKey),
      guiScale: normalizeGuiScale(parsed.guiScale),
      language: getAvailableLocales().includes(parsed.language) ? parsed.language : defaults.language
    };
    // Sync i18n locale with loaded settings
    setLocale(settings.language);
    return settings;
  } catch (_err) {
    return createDefaultUiSettings();
  }
}

export function saveUiSettings(settings) {
  try {
    const lang = getAvailableLocales().includes(settings.language) ? settings.language : "vi";
    const payload = {
      audioEnabled: settings.audioEnabled !== false,
      aiMode: ["EASY", "MEDIUM", "HARD"].includes(settings.aiMode) ? settings.aiMode : "MEDIUM",
      loseCondition: normalizeLoseCondition(settings.loseCondition),
      volumeLevel: Number.isFinite(settings.volumeLevel) ? Math.min(10, Math.max(1, Math.floor(settings.volumeLevel))) : 10,
      resolutionKey: normalizeResolutionKey(settings.resolutionKey),
      guiScale: normalizeGuiScale(settings.guiScale),
      language: lang
    };
    setLocale(lang);
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(payload));
    return true;
  } catch (_err) {
    return false;
  }
}
