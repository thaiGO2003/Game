/**
 * SceneButton.js
 *
 * Shared button factory used by PlanningScene, CombatScene, and MainMenuScene.
 * Extract of the duplicated createButton() method into a reusable helper.
 *
 * Usage:
 *   import { createSceneButton } from "../ui/SceneButton.js";
 *   const btn = createSceneButton(scene, x, y, w, h, "Label", onClick, options);
 */

import { UI_FONT, UI_COLORS } from "../core/uiTheme.js";

// ── Button variant colour presets ──────────────────────────────────────
const VARIANTS = {
    secondary: {
        fill: 0x1a2d42,
        edge: UI_COLORS.panelEdge,
        hover: 0x25405d,
        text: UI_COLORS.textPrimary
    },
    ghost: {
        fill: 0x162433,
        edge: UI_COLORS.panelEdgeSoft,
        hover: 0x21354c,
        text: UI_COLORS.textSecondary
    },
    cta: {
        fill: UI_COLORS.cta,
        edge: UI_COLORS.ctaEdge,
        hover: UI_COLORS.ctaHover,
        text: "#141f04"
    }
};

/**
 * Create a styled interactive button in a Phaser scene.
 *
 * @param {Phaser.Scene} scene   - The Phaser scene to add the button to
 * @param {number} x            - Left edge X position
 * @param {number} y            - Top edge Y position
 * @param {number} w            - Width
 * @param {number} h            - Height
 * @param {string} label        - Button label text
 * @param {Function} onClick    - Click handler
 * @param {Object} [options={}] - Optional styling: variant, fontSize, bold
 * @returns {Object} Button object with setLabel, setEnabled, setVisible methods
 */
export function createSceneButton(scene, x, y, w, h, label, onClick, options = {}) {
    const variant = VARIANTS[options.variant] ?? VARIANTS.secondary;

    // Drop-shadow rectangle for depth
    const shadow = scene.add.rectangle(x + w / 2, y + h / 2 + 2, w, h, 0x000000, 0.22);
    shadow.setDepth(1998);

    // Main background
    const bg = scene.add.rectangle(x + w / 2, y + h / 2, w, h, variant.fill, 0.94);
    bg.setStrokeStyle(1, variant.edge, 0.95);
    bg.setDepth(1999);

    // Label text
    const text = scene.add.text(x + w / 2, y + h / 2, label, {
        fontFamily: UI_FONT,
        fontSize: `${options.fontSize ?? 14}px`,
        color: variant.text,
        fontStyle: options.bold ? "bold" : "normal"
    });
    text.setOrigin(0.5);
    text.setDepth(2000);

    // Button state object
    const btn = {
        x,
        y,
        w,
        h,
        shadow,
        bg,
        text,
        enabled: true,
        setLabel: (v) => text.setText(v),
        setEnabled: (enabled) => {
            btn.enabled = enabled;
            bg.setFillStyle(enabled ? variant.fill : 0x323943, enabled ? 0.94 : 0.7);
            bg.setStrokeStyle(1, enabled ? variant.edge : 0x5b6572, 0.85);
            text.setColor(enabled ? variant.text : "#8d98a6");
            shadow.setVisible(enabled);
        },
        setVisible: (visible) => {
            shadow.setVisible(visible && btn.enabled);
            bg.setVisible(visible);
            text.setVisible(visible);
        }
    };

    // Pointer interactions
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
        if (btn.enabled) bg.setFillStyle(variant.hover, 0.96);
    });
    bg.on("pointerout", () => {
        if (btn.enabled) bg.setFillStyle(variant.fill, 0.94);
    });
    bg.on("pointerdown", () => {
        if (!btn.enabled) return;
        onClick();
    });

    return btn;
}
