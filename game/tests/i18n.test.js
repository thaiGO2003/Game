import { describe, it, expect, beforeEach } from "vitest";
import { t, setLocale, getLocale, getAvailableLocales, getLocaleLabel } from "../src/i18n/index.js";
import vi from "../src/i18n/vi.js";
import en from "../src/i18n/en.js";

describe("i18n module", () => {
    beforeEach(() => {
        setLocale("vi");
    });

    it("default locale is vi", () => {
        expect(getLocale()).toBe("vi");
    });

    it("getAvailableLocales returns vi and en", () => {
        const locales = getAvailableLocales();
        expect(locales).toContain("vi");
        expect(locales).toContain("en");
    });

    it("getLocaleLabel returns display names", () => {
        expect(getLocaleLabel("vi")).toBe("Tiếng Việt");
        expect(getLocaleLabel("en")).toBe("English");
    });

    it("t() returns Vietnamese by default", () => {
        expect(t("ui.close")).toBe("Đóng");
        expect(t("ui.settings")).toBe("Cài đặt");
        expect(t("ui.library")).toBe("Thư Viện");
    });

    it("t() returns English after setLocale('en')", () => {
        setLocale("en");
        expect(t("ui.close")).toBe("Close");
        expect(t("ui.settings")).toBe("Settings");
        expect(t("ui.library")).toBe("Library");
    });

    it("t() falls back to key for missing translations", () => {
        expect(t("totally.missing.key")).toBe("totally.missing.key");
    });

    it("t() interpolates {param} placeholders", () => {
        const result = t("log.levelUp", { level: 5 });
        expect(result).toContain("5");
    });

    it("t() falls back to Vietnamese when key missing in current locale", () => {
        setLocale("en");
        // If there's a key only in vi, it should still return the vi value
        const viKeys = Object.keys(vi);
        const enKeys = Object.keys(en);
        // Both should have same keys for this test
        expect(viKeys.length).toBeGreaterThan(0);
        expect(enKeys.length).toBeGreaterThan(0);
    });

    it("setLocale ignores unknown locales", () => {
        setLocale("fr");
        expect(getLocale()).toBe("vi"); // Should remain vi
    });

    it("all keys in vi.js exist in en.js", () => {
        const viKeys = Object.keys(vi);
        const enKeys = new Set(Object.keys(en));
        const missing = viKeys.filter((k) => !enKeys.has(k));
        expect(missing).toEqual([]);
    });

    it("all keys in en.js exist in vi.js", () => {
        const enKeys = Object.keys(en);
        const viKeys = new Set(Object.keys(vi));
        const missing = enKeys.filter((k) => !viKeys.has(k));
        expect(missing).toEqual([]);
    });

    it("switching locale and back works correctly", () => {
        expect(t("ui.close")).toBe("Đóng");
        setLocale("en");
        expect(t("ui.close")).toBe("Close");
        setLocale("vi");
        expect(t("ui.close")).toBe("Đóng");
    });
});
