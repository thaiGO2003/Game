/**
 * SkillPreview - Hiển thị preview kỹ năng với grid màu và blink animation
 *
 * Layout grid 3x4:
 *   Col 0-1 = bên ta (xanh lá đậm nếu trống)
 *   Col 2-3 = bên địch (đỏ nếu trống)
 *
 * Ô ảnh hưởng bởi skill: nhấp nháy (blink tween).
 */

import { getUnitVisual } from "../data/unitVisuals.js";
import { UI_FONT } from "../core/uiTheme.js";
import { starTargetBonus, starAreaBonus } from "../core/gameUtils.js";

// ─── Màu sắc ─────────────────────────────────────────────────────────────
const COLOR = {
  ALLY_EMPTY: 0x0d3d1a,  // xanh lá đậm — ô trống bên ta
  ENEMY_EMPTY: 0x3d0d0d,  // đỏ đậm — ô trống bên địch
  CELL_STROKE_ALLY: 0x1a6632,
  CELL_STROKE_ENEMY: 0x662222,
  HIGHLIGHT_ENEMY: 0xff3333,  // màu blink ô địch bị ảnh hưởng
  HIGHLIGHT_ALLY: 0x33ff88,  // màu blink ô ta bị ảnh hưởng (buff/heal)
  STROKE_ENEMY_HIT: 0xff8888,
  STROKE_ALLY_HIT: 0x88ffbb,
};

// ─── Skill pattern → danh sách ô bị ảnh hưởng ────────────────────────────
// Grid layout: 3 hàng x 4 cột. Cột 0-1 = ta, cột 2-3 = địch.
// Mỗi ô: { row, col, side: 'ally'|'enemy' }
function getAffectedCells(skill, unit, star = 1) {
  const effect = String(skill?.effect ?? "");
  const actionPattern = String(skill?.actionPattern ?? "");
  const classType = String(unit?.classType ?? "");
  const tBonus = starTargetBonus(star);

  // MELEE_FRONT / FIGHTER / TANKER: đánh ô tiền tuyến địch (col 2)
  if (actionPattern === "MELEE_FRONT" || classType === "TANKER" || classType === "FIGHTER") {
    switch (effect) {
      case "damage_shield_taunt":
      case "damage_stun":
      case "damage_shield_reflect":
      case "single_burst":
      case "double_hit":
      case "single_burst_lifesteal":
      case "single_delayed_echo":
      case "single_armor_break":
      case "single_bleed":
      case "true_single":
      case "single_strong_poison":
      case "single_poison_slow":
      case "single_poison_stack":
      case "single_silence_lock":
      case "knockback_charge":
      case "single_burst_armor_pen":
      case "execute_heal":
      case "true_execute":
      case "lifesteal_disease":
      case "lifesteal_disease_maxhp":
      case "double_hit_gold_reward":
      case "komodo_venom":
      case "otter_combo":
      case "kangaroo_uppercut":
      case "bison_charge":
      case "shark_bite_frenzy":
      case "wolverine_frenzy":
      case "cone_shot":
        return [{ row: 1, col: 2, side: "enemy" }];

      // Ram pierce: target + kẻ phía sau
      case "ram_charge_pierce":
        return [
          { row: 1, col: 2, side: "enemy" },
          { row: 1, col: 3, side: "enemy" },
        ];

      // Row charge: tất cả kẻ địch cùng hàng
      case "row_charge":
        return [
          { row: 1, col: 2, side: "enemy" },
          { row: 1, col: 3, side: "enemy" },
          { row: 1, col: 4, side: "enemy" },
        ];

      // Cone shot at 2★+ expands
      // (RANGED handled below)

      // Row cleave (hàng ngang địch)
      case "row_cleave":
        return [
          { row: 1, col: 2, side: "enemy" },
          { row: 1, col: 3, side: "enemy" },
        ];

      // AoE vùng lớn
      case "aoe_circle":
      case "aoe_poison":
      case "aoe_circle_stun":
      case "cleave_armor_break":
      case "cone_smash":
        return [
          { row: 0, col: 2, side: "enemy" }, { row: 0, col: 3, side: "enemy" },
          { row: 1, col: 2, side: "enemy" }, { row: 1, col: 3, side: "enemy" },
          { row: 2, col: 2, side: "enemy" }, { row: 2, col: 3, side: "enemy" },
        ];

      // Cross 5 ô
      case "cross_5":
        return [
          { row: 1, col: 2, side: "enemy" },
          { row: 0, col: 2, side: "enemy" },
          { row: 2, col: 2, side: "enemy" },
          { row: 1, col: 3, side: "enemy" },
        ];

      // Column
      case "column_freeze":
      case "column_bleed":
      case "column_plus_splash":
        return [
          { row: 0, col: 2, side: "enemy" },
          { row: 1, col: 2, side: "enemy" },
          { row: 2, col: 2, side: "enemy" },
        ];

      // Global enemy
      case "global_knockback":
      case "global_poison_team":
      case "global_stun":
      case "global_debuff_atk":
        return [
          { row: 0, col: 2, side: "enemy" }, { row: 0, col: 3, side: "enemy" },
          { row: 1, col: 2, side: "enemy" }, { row: 1, col: 3, side: "enemy" },
          { row: 2, col: 2, side: "enemy" }, { row: 2, col: 3, side: "enemy" },
        ];

      // Self / ally buff
      case "ally_row_def_buff":
        return [
          { row: 1, col: 0, side: "ally" },
          { row: 1, col: 1, side: "ally" },
        ];
      case "roar_debuff_heal":
      case "rhino_counter":
      case "metamorphosis":
      case "turtle_protection":
      case "pangolin_reflect":
      case "self_armor_reflect":
      case "self_shield_immune":
      case "self_def_fortify":
      case "resilient_shield":
      case "self_maxhp_boost":
      case "self_bersek":
      case "self_regen_team_heal":
        return [{ row: 1, col: 0, side: "ally" }];

      // Team-wide ally buffs (MELEE_FRONT tankers)
      case "guardian_pact":
      case "frost_aura_buff":
      case "team_rage_self_heal":
      case "warcry_atk_def":
      case "team_evade_buff":
      case "team_shield":
        return [
          { row: 0, col: 0, side: "ally" }, { row: 0, col: 1, side: "ally" },
          { row: 1, col: 0, side: "ally" }, { row: 1, col: 1, side: "ally" },
          { row: 2, col: 0, side: "ally" }, { row: 2, col: 1, side: "ally" },
        ];

      // Default single enemy front
      default:
        return [{ row: 1, col: 2, side: "enemy" }];
    }
  }

  // ASSASSIN_BACK: lao sau, đánh col 3
  if (actionPattern === "ASSASSIN_BACK" || classType === "ASSASSIN") {
    return [{ row: 1, col: 3, side: "enemy" }];
  }

  // Helper: pick N random enemy cells from a pool
  const allEnemyCells = [
    { row: 0, col: 2, side: "enemy" }, { row: 0, col: 3, side: "enemy" },
    { row: 1, col: 2, side: "enemy" }, { row: 1, col: 3, side: "enemy" },
    { row: 2, col: 2, side: "enemy" }, { row: 2, col: 3, side: "enemy" },
  ];
  const allAllyCells = [
    { row: 0, col: 0, side: "ally" }, { row: 0, col: 1, side: "ally" },
    { row: 1, col: 0, side: "ally" }, { row: 1, col: 1, side: "ally" },
    { row: 2, col: 0, side: "ally" }, { row: 2, col: 1, side: "ally" },
  ];
  function pickCells(pool, count) { return pool.slice(0, Math.min(count, pool.length)); }

  // RANGED_STATIC — Archer/Mage
  switch (effect) {
    case "cross_5":
      return [
        { row: 1, col: 2, side: "enemy" },
        { row: 0, col: 2, side: "enemy" },
        { row: 2, col: 2, side: "enemy" },
        { row: 1, col: 3, side: "enemy" },
        { row: 1, col: 1, side: "enemy" },
      ];

    case "row_multi":
    case "piercing_shot":
    case "frost_storm":
      return [
        { row: 1, col: 2, side: "enemy" },
        { row: 1, col: 3, side: "enemy" },
      ];

    case "dive_bomb":
    case "ink_blast_debuff":
      return [
        { row: 0, col: 2, side: "enemy" },
        { row: 1, col: 2, side: "enemy" },
        { row: 2, col: 2, side: "enemy" },
      ];

    case "random_multi":
    case "arrow_rain":
      return pickCells(allEnemyCells, 3 + tBonus);

    case "multi_sting_poison":
      return pickCells(allEnemyCells, 2 + tBonus);

    case "feather_bleed":
    case "dark_feather_debuff":
    case "chain_shock":
    case "random_lightning":
    case "multi_disarm":
      return pickCells(allEnemyCells, 3 + tBonus);

    case "aoe_circle":
    case "fish_bomb_aoe":
    case "aoe_circle_stun":
    case "fireball_burn":
    case "dust_sleep":
    case "ink_bomb_blind":
    case "aoe_poison":
      return [
        { row: 0, col: 2, side: "enemy" }, { row: 0, col: 3, side: "enemy" },
        { row: 1, col: 2, side: "enemy" }, { row: 1, col: 3, side: "enemy" },
        { row: 2, col: 2, side: "enemy" }, { row: 2, col: 3, side: "enemy" },
      ];

    case "column_freeze":
    case "cone_shot":
      // Hình nón: 1★ = 3 ô, 2★+ = 5 ô
      if (star >= 2) {
        return [
          { row: 0, col: 2, side: "enemy" },
          { row: 1, col: 2, side: "enemy" }, { row: 1, col: 3, side: "enemy" },
          { row: 2, col: 2, side: "enemy" },
        ];
      }
      return [
        { row: 0, col: 2, side: "enemy" },
        { row: 1, col: 2, side: "enemy" },
        { row: 2, col: 2, side: "enemy" },
      ];

    case "fire_breath_cone":
    case "column_plus_splash":
      return [
        { row: 0, col: 2, side: "enemy" },
        { row: 1, col: 2, side: "enemy" },
        { row: 2, col: 2, side: "enemy" },
      ];

    case "global_poison_team":
    case "global_stun":
    case "global_debuff_atk":
    case "global_fire":
    case "global_knockback":
    case "plague_spread":
    case "pollen_confuse":
    case "flash_blind":
      return [
        { row: 0, col: 2, side: "enemy" }, { row: 0, col: 3, side: "enemy" },
        { row: 1, col: 2, side: "enemy" }, { row: 1, col: 3, side: "enemy" },
        { row: 2, col: 2, side: "enemy" }, { row: 2, col: 3, side: "enemy" },
      ];

    // SELF / Heal / Buff
    case "dual_heal":
    case "spring_aoe_heal":
    case "heal_over_time":
    case "bless_rain_mdef":
    case "light_purify":
    case "wind_shield_ally":
    case "soul_link_heal":
    case "phoenix_rebirth":
    case "revive_or_heal":
    case "mirror_reflect":
    case "shield_cleanse":
    case "team_def_buff":
    case "team_rage":
    case "column_bless":
    case "unicorn_atk_buff":
    case "peace_heal_reduce_dmg":
    case "peace_heal_reduce":
    case "scout_buff_ally":
    case "pack_howl_rage":
    case "root_snare_debuff":
    case "root_snare":
    case "global_tide_evade":
      return pickCells(allAllyCells, Math.min(6, 3 + tBonus));

    case "mass_cleanse":
      return pickCells(allAllyCells, 1 + tBonus);

    case "mimic_rage_buff":
      return pickCells(allAllyCells, 1 + tBonus);

    // Single target enemy
    default:
      return [{ row: 1, col: 2, side: "enemy" }];
  }
}

// ─── Class ────────────────────────────────────────────────────────────────

export class SkillPreview {
  constructor(scene, x, y, width, height, unit, skill) {
    this.scene = scene;
    this.unit = unit;
    this.skill = skill;
    this.width = width;
    this.height = height;
    this.container = scene.add.container(x, y);
    this.tweens = [];
    this.build();
    this.startAnimation();
  }

  build() {
    const { width: W, height: H } = this;

    // Background
    const bg = this.scene.add.rectangle(0, 0, W, H, 0x0a1520, 0.9).setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x3a5070, 0.8);
    this.container.add(bg);

    // Title
    const skillName = this.skill?.name || "Kỹ năng";
    const title = this.scene.add.text(8, 6, `⚡ ${skillName}`, {
      fontFamily: UI_FONT, fontSize: "12px", color: "#8df2ff", fontStyle: "bold"
    });
    this.container.add(title);

    // Grid setup: 3 rows × 4 cols
    const ROWS = 3, COLS = 4;
    const cellSize = Math.floor(Math.min((W - 16) / COLS, (H - 56) / ROWS));
    const gridW = cellSize * COLS;
    const gridH = cellSize * ROWS;
    const gridX = Math.floor((W - gridW) / 2);
    const gridY = 30;

    this.cellSize = cellSize;
    this.gridX = gridX;
    this.gridY = gridY;

    // Affected cells set
    const affected = getAffectedCells(this.skill, this.unit, this.unit?.star ?? 1);
    const affectedSet = new Set(affected.map(c => `${c.row},${c.col}`));
    const affectedMap = {};
    for (const c of affected) affectedMap[`${c.row},${c.col}`] = c.side;

    // Draw grid cells
    this.cellRects = {};
    this.blinkRects = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const isAlly = col <= 1;
        const cellKey = `${row},${col}`;
        const isAffected = affectedSet.has(cellKey);
        const side = affectedMap[cellKey] ?? (isAlly ? "ally" : "enemy");

        const cx = gridX + col * cellSize;
        const cy = gridY + row * cellSize;

        // Base cell fill: màu theo bên
        const baseFill = isAlly ? COLOR.ALLY_EMPTY : COLOR.ENEMY_EMPTY;
        const baseStroke = isAlly ? COLOR.CELL_STROKE_ALLY : COLOR.CELL_STROKE_ENEMY;

        const cell = this.scene.add.rectangle(
          cx + 1, cy + 1, cellSize - 2, cellSize - 2, baseFill, 0.7
        ).setOrigin(0, 0);
        cell.setStrokeStyle(1, baseStroke, 0.8);
        this.container.add(cell);
        this.cellRects[cellKey] = cell;

        // Blink overlay cho ô bị ảnh hưởng
        if (isAffected) {
          const blinkColor = side === "ally" ? COLOR.HIGHLIGHT_ALLY : COLOR.HIGHLIGHT_ENEMY;
          const blinkStroke = side === "ally" ? COLOR.STROKE_ALLY_HIT : COLOR.STROKE_ENEMY_HIT;
          const blink = this.scene.add.rectangle(
            cx + 1, cy + 1, cellSize - 2, cellSize - 2, blinkColor, 0.0
          ).setOrigin(0, 0);
          blink.setStrokeStyle(2, blinkStroke, 0.9);
          this.container.add(blink);
          this.blinkRects.push(blink);
        }
      }
    }

    // Divider line between sides (between col 1 and 2)
    const divX = gridX + 2 * cellSize;
    const divLine = this.scene.add.rectangle(divX, gridY, 1, gridH, 0x8888ff, 0.4).setOrigin(0, 0);
    this.container.add(divLine);

    // Unit icon (bên ta, hàng giữa)
    const visual = getUnitVisual(this.unit?.id, this.unit?.classType);
    const attackerCol = this.unit?.classType === "ASSASSIN" ? 1 : 0;
    const attackerRow = 1;
    const attackerX = gridX + attackerCol * cellSize + cellSize / 2;
    const attackerY = gridY + attackerRow * cellSize + cellSize / 2;
    this.attackerIcon = this.scene.add.text(attackerX, attackerY, visual.icon, {
      fontFamily: "Segoe UI Emoji", fontSize: `${Math.floor(cellSize * 0.65)}px`
    }).setOrigin(0.5);
    this.container.add(this.attackerIcon);
    this._attackerStartX = attackerX;
    this._attackerStartY = attackerY;

    // Enemy icons — chỉ đặt ở ô KHÔNG bị affect để tránh che blink
    const allEnemySlots = [
      { row: 0, col: 2 }, { row: 1, col: 3 }, { row: 2, col: 2 }
    ];
    this.enemyIcons = [];
    allEnemySlots.forEach(({ row, col }) => {
      const key = `${row},${col}`;
      const ex = gridX + col * cellSize + cellSize / 2;
      const ey = gridY + row * cellSize + cellSize / 2;
      const icon = this.scene.add.text(ex, ey, "👹", {
        fontFamily: "Segoe UI Emoji", fontSize: `${Math.floor(cellSize * 0.55)}px`
      }).setOrigin(0.5);
      this.container.add(icon);
      this.enemyIcons.push({ icon, row, col, key });
    });

    // Target center list (for hit effects)
    this.targetCenters = affected.map(c => ({
      x: gridX + c.col * cellSize + cellSize / 2,
      y: gridY + c.row * cellSize + cellSize / 2,
      side: c.side,
    }));

    // Info bar
    const areaCount = affected.length;
    const areaLabel = areaCount === 1 ? "Đơn mục tiêu"
      : areaCount <= 3 ? `${areaCount} mục tiêu`
        : "Diện rộng";
    const info = this.scene.add.text(8, H - 20, areaLabel, {
      fontFamily: UI_FONT, fontSize: "11px", color: "#8ab4d4"
    });
    this.container.add(info);
  }

  startAnimation() {
    // Blink animation: ô ảnh hưởng nhấp nháy 0 → 0.65 → 0, repeat
    if (this.blinkRects.length > 0) {
      const t = this.scene.tweens.add({
        targets: this.blinkRects,
        alpha: { from: 0, to: 0.65 },
        duration: 550,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      this.tweens.push(t);
    }

    this.playSkillLoop();
  }

  playSkillLoop() {
    if (!this.scene || !this.container?.active) return;

    const classType = this.unit?.classType ?? "";
    const actionPattern = this.skill?.actionPattern ?? "";
    const range = this.unit?.stats?.range ?? 1;

    // Attacker animation
    if (actionPattern === "ASSASSIN_BACK" || classType === "ASSASSIN") {
      // Dash tới ô đích rồi quay về
      const target = this.targetCenters[0];
      if (!target) { this.scene.time.delayedCall(1500, () => this.playSkillLoop()); return; }
      const t = this.scene.tweens.add({
        targets: this.attackerIcon,
        x: target.x - this.cellSize * 0.4,
        y: target.y,
        duration: 200,
        ease: "Power2",
        onComplete: () => {
          if (!this.container?.active) return;
          this.showSkillEffect();
          const t2 = this.scene.tweens.add({
            targets: this.attackerIcon,
            x: this._attackerStartX,
            y: this._attackerStartY,
            duration: 220,
            ease: "Power2",
            delay: 250,
            onComplete: () => {
              this.scene.time.delayedCall(900, () => this.playSkillLoop());
            }
          });
          this.tweens.push(t2);
        }
      });
      this.tweens.push(t);

    } else if (range >= 2 || actionPattern === "RANGED_STATIC" ||
      classType === "ARCHER" || classType === "MAGE" || classType === "SUPPORT") {
      // Ranged: co người lại → bắn projectile
      const t = this.scene.tweens.add({
        targets: this.attackerIcon,
        scaleX: 1.25, scaleY: 0.85,
        duration: 180,
        yoyo: true,
        onComplete: () => {
          if (!this.container?.active) return;
          // Spawn projectile tới từng target
          this.targetCenters.forEach((tc, i) => {
            this.scene.time.delayedCall(i * 60, () => {
              if (!this.container?.active) return;
              const proj = this.scene.add.circle(
                this._attackerStartX + this.cellSize * 0.6,
                this._attackerStartY, 4,
                tc.side === "ally" ? 0x44ffaa : 0xffdd44
              );
              this.container.add(proj);
              const tp = this.scene.tweens.add({
                targets: proj, x: tc.x, y: tc.y, duration: 220,
                ease: "Power1",
                onComplete: () => { proj.destroy(); this.showHitAt(tc); }
              });
              this.tweens.push(tp);
            });
          });
          this.scene.time.delayedCall(500, () => this.playSkillLoop());
        }
      });
      this.tweens.push(t);

    } else {
      // Melee: nhún người → dash sang địch rồi quay về
      const target = this.targetCenters[0];
      if (!target) { this.scene.time.delayedCall(1500, () => this.playSkillLoop()); return; }
      const t = this.scene.tweens.add({
        targets: this.attackerIcon,
        x: target.x - this.cellSize * 0.5,
        y: target.y,
        duration: 220,
        ease: "Power2",
        onComplete: () => {
          if (!this.container?.active) return;
          this.showSkillEffect();
          const t2 = this.scene.tweens.add({
            targets: this.attackerIcon,
            x: this._attackerStartX, y: this._attackerStartY,
            duration: 220, ease: "Power2", delay: 250,
            onComplete: () => {
              this.scene.time.delayedCall(900, () => this.playSkillLoop());
            }
          });
          this.tweens.push(t2);
        }
      });
      this.tweens.push(t);
    }
  }

  showSkillEffect() {
    if (!this.container?.active) return;
    this.targetCenters.forEach(tc => this.showHitAt(tc));
  }

  showHitAt({ x, y, side }) {
    if (!this.container?.active) return;
    const emoji = side === "ally" ? "✨" : "💥";
    const hit = this.scene.add.text(x, y - 8, emoji, { fontSize: "14px" }).setOrigin(0.5);
    this.container.add(hit);
    const t = this.scene.tweens.add({
      targets: hit, y: y - 20, alpha: 0, duration: 380,
      onComplete: () => hit.destroy()
    });
    this.tweens.push(t);

    // Shake enemy icons in affected cells
    this.enemyIcons.forEach(({ icon, row, col }) => {
      const key = `${row},${col}`;
      const affected = this.targetCenters.some(
        tc => Math.abs(tc.x - (this.gridX + col * this.cellSize + this.cellSize / 2)) < 5
          && Math.abs(tc.y - (this.gridY + row * this.cellSize + this.cellSize / 2)) < 5
      );
      if (affected) {
        const origX = icon.x;
        const ts = this.scene.tweens.add({
          targets: icon, x: origX + 5, duration: 40, yoyo: true, repeat: 2,
          onComplete: () => icon.setX(origX)
        });
        this.tweens.push(ts);
      }
    });
  }

  destroy() {
    this.tweens.forEach(t => t?.stop?.());
    this.container.destroy();
  }
}
