/**
 * BoardRenderer.js
 *
 * Shared board rendering helpers for the isometric chess-like board.
 * Extracted from PlanningScene & CombatScene to avoid code duplication.
 *
 * Usage:
 *   import { getGrassTileStyle, paintGrassTile, ... } from "../ui/BoardRenderer.js";
 *   // Call with scene context: paintGrassTile(scene, graphics, x, y, row, col)
 */

import { UI_COLORS, ROLE_THEME } from "../core/uiTheme.js";

// ── Grass tile colour pair (checkerboard pattern) ──────────────────────
export function getGrassTileStyle(row, col) {
    const even = (row + col) % 2 === 0;
    if (even) {
        return { fill: UI_COLORS.grassA, stroke: UI_COLORS.grassEdgeA };
    }
    return { fill: UI_COLORS.grassB, stroke: UI_COLORS.grassEdgeB };
}

// ── Draw an isometric diamond shape ────────────────────────────────────
export function drawDiamond(graphics, x, y, tileW, tileH, fill = true) {
    graphics.beginPath();
    graphics.moveTo(x, y - tileH / 2);
    graphics.lineTo(x + tileW / 2, y);
    graphics.lineTo(x, y + tileH / 2);
    graphics.lineTo(x - tileW / 2, y);
    graphics.closePath();
    if (fill) graphics.fillPath();
    graphics.strokePath();
}

// ── Paint a single grass tile with highlight ───────────────────────────
export function paintGrassTile(graphics, x, y, row, col, tileW, tileH) {
    const { fill, stroke } = getGrassTileStyle(row, col);
    graphics.fillStyle(fill, 0.72);
    graphics.lineStyle(1, stroke, 0.92);
    drawDiamond(graphics, x, y, tileW, tileH);

    // Soft top highlight so each grass tile reads as a textured piece
    graphics.lineStyle(1, UI_COLORS.grassHighlight, 0.2);
    graphics.beginPath();
    graphics.moveTo(x - tileW / 2 + 4, y);
    graphics.lineTo(x, y - tileH / 2 + 2);
    graphics.lineTo(x + tileW / 2 - 4, y);
    graphics.strokePath();
}

// ── Paint a single river tile with highlight ───────────────────────────
export function paintRiverTile(graphics, x, y, row, tileW, tileH) {
    const w = tileW;
    const h = tileH;
    const even = row % 2 === 0;
    const fill = even ? UI_COLORS.riverA : UI_COLORS.riverB;
    const edge = even ? UI_COLORS.riverEdgeA : UI_COLORS.riverEdgeB;
    graphics.fillStyle(fill, 0.94);
    graphics.lineStyle(1, edge, 0.92);
    graphics.beginPath();
    graphics.moveTo(x, y - h / 2);
    graphics.lineTo(x + w / 2, y);
    graphics.lineTo(x, y + h / 2);
    graphics.lineTo(x - w / 2, y);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    // Subtle water highlight along the top edge
    graphics.lineStyle(1, UI_COLORS.riverHighlight, 0.26);
    graphics.beginPath();
    graphics.moveTo(x - w / 2 + 3, y);
    graphics.lineTo(x, y - h / 2 + 2);
    graphics.lineTo(x + w / 2 - 3, y);
    graphics.strokePath();
}

// ── Lookup theme colours for a unit role / class ───────────────────────
export function getRoleTheme(classType) {
    return ROLE_THEME[classType] ?? ROLE_THEME.FIGHTER;
}
