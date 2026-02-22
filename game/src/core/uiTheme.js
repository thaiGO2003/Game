/**
 * uiTheme.js
 *
 * Shared UI constants used across all scenes and UI components.
 * Previously duplicated in PlanningScene, CombatScene, LibraryModal, etc.
 */

export const UI_FONT = "Segoe UI";

export const UI_SPACING = {
    XS: 8,
    SM: 16,
    LG: 24
};

export const UI_COLORS = {
    screenOverlay: 0x060d17,
    panel: 0x0e1828,
    panelSoft: 0x111f32,
    panelEdge: 0x5aa8c8,
    panelEdgeSoft: 0x39576f,
    accent: 0x8de8ff,
    accentSoft: 0x50bfd8,
    cta: 0xbdcf47,
    ctaHover: 0xd4e665,
    ctaEdge: 0xf2ff9a,
    textPrimary: "#e9f5ff",
    textSecondary: "#a6bed3",
    textMuted: "#7f94a7",
    badgeTier: 0x1c3c58,
    badgeRole: 0x1f4a3a,
    badgeCost: 0x4b3a1f,
    boardLeft: 0x133627,
    boardLeftEdge: 0x4cc99b,
    boardRight: 0x3d2523,
    boardRightEdge: 0xd08a7f,
    grassA: 0x6eaf4d,
    grassB: 0x5a973f,
    grassEdgeA: 0xa2d56f,
    grassEdgeB: 0x84be5a,
    grassHighlight: 0xd9f2b4,
    riverA: 0x1f8fe0,
    riverB: 0x176eb7,
    riverEdgeA: 0x8fddff,
    riverEdgeB: 0x6ec7f1,
    riverHighlight: 0xd9f6ff
};

export const CLASS_COLORS = {
    TANKER: 0x5f86d9,
    ASSASSIN: 0x7b59b5,
    ARCHER: 0x5ca65b,
    MAGE: 0xd160b2,
    SUPPORT: 0xd2b35e,
    FIGHTER: 0xb86a44
};

export const ROLE_THEME = {
    TANKER: { fill: 0x5f86d9, glow: 0x9ec6ff, stroke: 0xc2ddff, card: 0x1a2d4c, cardHover: 0x24406a, bench: 0x213655 },
    ASSASSIN: { fill: 0x7b59b5, glow: 0xbf9af5, stroke: 0xdcc9ff, card: 0x2a2146, cardHover: 0x3a2d60, bench: 0x352a54 },
    ARCHER: { fill: 0x5ca65b, glow: 0x9fe3a0, stroke: 0xc9f0c6, card: 0x1f3a2a, cardHover: 0x295039, bench: 0x2a4533 },
    MAGE: { fill: 0xd160b2, glow: 0xf3a9de, stroke: 0xffd3f2, card: 0x4f2144, cardHover: 0x6f2f60, bench: 0x5c2850 },
    SUPPORT: { fill: 0xd2b35e, glow: 0xf0dc9a, stroke: 0xfff0bd, card: 0x4a3b21, cardHover: 0x654f2d, bench: 0x5a4928 },
    FIGHTER: { fill: 0xb86a44, glow: 0xe4a07b, stroke: 0xffcaad, card: 0x44281d, cardHover: 0x61382a, bench: 0x553427 }
};

export const LEVEL_LABEL = { EASY: "Dễ", MEDIUM: "TB", HARD: "Khó" };

export const HISTORY_FILTERS = [
    { key: "ALL", label: "Tất cả" },
    { key: "COMBAT", label: "Giao tranh" },
    { key: "SHOP", label: "Mua sắm" },
    { key: "CRAFT", label: "Ghép đồ" },
    { key: "EVENT", label: "Sự kiện" }
];
