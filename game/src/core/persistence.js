const SAVE_KEY = "forest_throne_progress_v1";

export function saveProgress(payload) {
  try {
    const wrapped = {
      version: 1,
      savedAt: Date.now(),
      payload
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(wrapped));
    return true;
  } catch (_err) {
    return false;
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed.payload ?? null;
  } catch (_err) {
    return null;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (_err) {
    return false;
  }
}

export function clearAllLocalStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (_err) {
    return false;
  }
}
