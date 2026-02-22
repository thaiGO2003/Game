/**
 * i18n Manager
 *
 * Lightweight internationalization for Forest Throne.
 * Default locale is Vietnamese ("vi").
 *
 * Usage:
 *   import { t, setLocale, getLocale } from "../i18n/index.js";
 *   t("ui.close")            // → "Đóng" (vi) or "Close" (en)
 *   t("log.levelUp", { level: 5 }) // → "Lên level 5."
 *   setLocale("en");          // Switch to English
 */

import vi from "./vi.js";
import en from "./en.js";

const locales = { vi, en };
let currentLocale = "vi";

/**
 * Set the active locale.
 * @param {string} locale - Locale code ("vi", "en", etc.)
 */
export function setLocale(locale) {
    if (locales[locale]) {
        currentLocale = locale;
    } else {
        console.warn(`[i18n] Unknown locale "${locale}", keeping "${currentLocale}".`);
    }
}

/**
 * Get the currently active locale code.
 * @returns {string}
 */
export function getLocale() {
    return currentLocale;
}

/**
 * Translate a key, optionally interpolating {param} placeholders.
 *
 * @param {string} key   - Translation key, e.g. "ui.close"
 * @param {Object} [params] - Key-value pairs for interpolation
 * @returns {string} Translated string, or the raw key if not found
 *
 * @example
 *   t("log.levelUp", { level: 5 }) // "Lên level 5."
 */
export function t(key, params = {}) {
    const dict = locales[currentLocale] ?? locales.vi;
    let text = dict[key];

    // Fallback to Vietnamese if key missing in current locale
    if (text === undefined && currentLocale !== "vi") {
        text = locales.vi[key];
    }

    // If still missing, return the key itself (makes debugging easy)
    if (text === undefined) {
        return key;
    }

    // Interpolate {param} placeholders
    if (params && typeof params === "object") {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
    }

    return text;
}

/**
 * Get an array of available locale codes.
 * @returns {string[]}
 */
export function getAvailableLocales() {
    return Object.keys(locales);
}

/**
 * Get the display name for a locale code.
 * @param {string} code
 * @returns {string}
 */
export function getLocaleLabel(code) {
    const labels = { vi: "Tiếng Việt", en: "English" };
    return labels[code] ?? code;
}
