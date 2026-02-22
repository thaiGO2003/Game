import { describe, it, expect } from "vitest";
import {
    UI_FONT, UI_SPACING, UI_COLORS, CLASS_COLORS,
    ROLE_THEME, LEVEL_LABEL, HISTORY_FILTERS
} from "../src/core/uiTheme.js";
import {
    PHASE, TILE_W, TILE_H, ROWS, COLS, PLAYER_COLS,
    RIGHT_COL_START, RIGHT_COL_END, BOARD_GAP_COLS,
    BOARD_FILES, RIVER_LAYER_DEPTH
} from "../src/core/boardConstants.js";
import { CLASS_SKILL_VARIANTS } from "../src/data/classSkillVariants.js";

describe("uiTheme exports", () => {
    it("UI_FONT is a non-empty string", () => {
        expect(typeof UI_FONT).toBe("string");
        expect(UI_FONT.length).toBeGreaterThan(0);
    });

    it("UI_SPACING has XS, SM, LG as numbers", () => {
        expect(UI_SPACING).toHaveProperty("XS");
        expect(UI_SPACING).toHaveProperty("SM");
        expect(UI_SPACING).toHaveProperty("LG");
        expect(typeof UI_SPACING.XS).toBe("number");
    });

    it("UI_COLORS has all expected keys", () => {
        const requiredKeys = [
            "screenOverlay", "panel", "panelSoft", "panelEdge", "panelEdgeSoft",
            "accent", "cta", "textPrimary", "textSecondary", "textMuted",
            "boardLeft", "boardRight", "grassA", "grassB", "riverA", "riverB"
        ];
        requiredKeys.forEach((key) => {
            expect(UI_COLORS).toHaveProperty(key);
        });
    });

    it("CLASS_COLORS has all 6 classes", () => {
        const classes = ["TANKER", "ASSASSIN", "ARCHER", "MAGE", "SUPPORT", "FIGHTER"];
        classes.forEach((cls) => {
            expect(CLASS_COLORS).toHaveProperty(cls);
            expect(typeof CLASS_COLORS[cls]).toBe("number");
        });
    });

    it("ROLE_THEME has fill/glow/stroke/card/cardHover/bench for each class", () => {
        const classes = ["TANKER", "ASSASSIN", "ARCHER", "MAGE", "SUPPORT", "FIGHTER"];
        const subKeys = ["fill", "glow", "stroke", "card", "cardHover", "bench"];
        classes.forEach((cls) => {
            expect(ROLE_THEME).toHaveProperty(cls);
            subKeys.forEach((sk) => {
                expect(ROLE_THEME[cls]).toHaveProperty(sk);
            });
        });
    });

    it("LEVEL_LABEL has EASY, MEDIUM, HARD", () => {
        expect(LEVEL_LABEL).toHaveProperty("EASY");
        expect(LEVEL_LABEL).toHaveProperty("MEDIUM");
        expect(LEVEL_LABEL).toHaveProperty("HARD");
    });

    it("HISTORY_FILTERS is an array of {key, label} objects", () => {
        expect(Array.isArray(HISTORY_FILTERS)).toBe(true);
        expect(HISTORY_FILTERS.length).toBeGreaterThanOrEqual(1);
        HISTORY_FILTERS.forEach((f) => {
            expect(f).toHaveProperty("key");
            expect(f).toHaveProperty("label");
        });
    });
});

describe("boardConstants exports", () => {
    it("PHASE has PLANNING, AUGMENT, COMBAT, GAME_OVER", () => {
        expect(PHASE.PLANNING).toBe("PLANNING");
        expect(PHASE.AUGMENT).toBe("AUGMENT");
        expect(PHASE.COMBAT).toBe("COMBAT");
        expect(PHASE.GAME_OVER).toBe("GAME_OVER");
    });

    it("board dimensions are numbers", () => {
        expect(typeof TILE_W).toBe("number");
        expect(typeof TILE_H).toBe("number");
        expect(typeof ROWS).toBe("number");
        expect(typeof COLS).toBe("number");
        expect(typeof PLAYER_COLS).toBe("number");
        expect(ROWS).toBe(5);
        expect(COLS).toBe(10);
        expect(PLAYER_COLS).toBe(5);
    });

    it("RIGHT_COL range is valid", () => {
        expect(RIGHT_COL_START).toBe(5);
        expect(RIGHT_COL_END).toBe(9);
    });

    it("BOARD_FILES is a string of letters", () => {
        expect(typeof BOARD_FILES).toBe("string");
        expect(BOARD_FILES.length).toBeGreaterThanOrEqual(10);
    });
});

describe("classSkillVariants exports", () => {
    it("CLASS_SKILL_VARIANTS has all 6 classes", () => {
        const classes = ["TANKER", "ASSASSIN", "ARCHER", "MAGE", "SUPPORT", "FIGHTER"];
        classes.forEach((cls) => {
            expect(CLASS_SKILL_VARIANTS).toHaveProperty(cls);
            expect(Array.isArray(CLASS_SKILL_VARIANTS[cls])).toBe(true);
            expect(CLASS_SKILL_VARIANTS[cls].length).toBeGreaterThanOrEqual(1);
        });
    });

    it("each variant has name and bonus", () => {
        Object.values(CLASS_SKILL_VARIANTS).forEach((variants) => {
            variants.forEach((v) => {
                expect(v).toHaveProperty("name");
                expect(v).toHaveProperty("bonus");
                expect(typeof v.name).toBe("string");
                expect(typeof v.bonus).toBe("object");
            });
        });
    });
});
