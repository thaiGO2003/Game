/**
 * SkillPreview - Hiển thị preview kỹ năng
 */

import { getUnitVisual } from "../data/unitVisuals.js";
import { UI_FONT } from "../core/uiTheme.js";

export class SkillPreview {
  constructor(scene, x, y, width, height, unit, skill) {
    this.scene = scene;
    this.unit = unit;
    this.skill = skill;
    this.width = width;
    this.height = height;
    this.container = scene.add.container(x, y);
    this.highlightTween = null;
    this.build();
    this.startAnimation();
  }

  build() {
    // Background
    const bg = this.scene.add.rectangle(0, 0, this.width, this.height, 0x0a1520, 0.9);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x3a5070, 0.8);
    this.container.add(bg);

    // Title
    const skillName = this.skill?.name || "Kỹ năng";
    const title = this.scene.add.text(8, 8, `⚡ ${skillName}`, {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: "#8df2ff",
      fontStyle: "bold"
    });
    this.container.add(title);

    // Grid setup (3 rows x 4 cols mini)
    const gridStartY = 32;
    const cellSize = Math.min(32, (this.width - 32) / 4);
    const gridW = cellSize * 4;
    const gridH = cellSize * 3;
    const gridX = (this.width - gridW) / 2;

    // Draw grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const cellX = gridX + col * cellSize;
        const cellY = gridStartY + row * cellSize;
        const cell = this.scene.add.rectangle(
          cellX, cellY, cellSize - 2, cellSize - 2, 0x1a2d40, 0.5
        );
        cell.setOrigin(0, 0);
        cell.setStrokeStyle(1, 0x2a4060, 0.6);
        this.container.add(cell);
      }
    }

    // Get unit visual
    const visual = getUnitVisual(this.unit.id, this.unit.classType);

    // Place attacker (left side, middle row)
    const attackerRow = 1;
    const attackerCol = 0;
    const attackerX = gridX + attackerCol * cellSize + cellSize / 2;
    const attackerY = gridStartY + attackerRow * cellSize + cellSize / 2;

    this.attackerIcon = this.scene.add.text(attackerX, attackerY, visual.icon, {
      fontFamily: "Segoe UI Emoji",
      fontSize: "20px"
    }).setOrigin(0.5);
    this.container.add(this.attackerIcon);

    // Place enemies
    const enemies = [
      { row: 0, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 2 }
    ];

    this.enemyIcons = [];
    enemies.forEach((enemy) => {
      const enemyX = gridX + enemy.col * cellSize + cellSize / 2;
      const enemyY = gridStartY + enemy.row * cellSize + cellSize / 2;
      const enemyIcon = this.scene.add.text(enemyX, enemyY, "👹", {
        fontFamily: "Segoe UI Emoji",
        fontSize: "18px"
      }).setOrigin(0.5);
      this.container.add(enemyIcon);
      this.enemyIcons.push({ icon: enemyIcon, row: enemy.row, col: enemy.col });
    });

    // Determine skill targeting pattern
    this.highlightTargets = [];
    const skillDesc = this.skill?.description || this.skill?.descriptionVi || "";
    const range = this.unit.stats?.range || 1;

    // Parse skill type from description
    if (skillDesc.includes("toàn bộ") || skillDesc.includes("tất cả")) {
      // AOE - highlight all enemies
      enemies.forEach((enemy) => {
        const targetX = gridX + enemy.col * cellSize + cellSize / 2;
        const targetY = gridStartY + enemy.row * cellSize + cellSize / 2;
        const highlight = this.scene.add.circle(
          targetX, targetY, cellSize / 2 - 2, 0x8844ff, 0.4
        );
        highlight.setStrokeStyle(2, 0xaa88ff, 0.8);
        this.container.add(highlight);
        this.highlightTargets.push(highlight);
      });
    } else {
      // Single target - use same logic as basic attack
      let targetRow, targetCol;

      if (range <= 1) {
        if (this.unit.classType === "ASSASSIN") {
          targetRow = 1;
          targetCol = 3;
        } else {
          // Tank/Fighter: ưu tiên hàng trên (row 0)
          targetRow = 0;
          targetCol = 2;
        }
      } else {
        targetRow = 1;
        targetCol = 3;
      }

      const targetX = gridX + targetCol * cellSize + cellSize / 2;
      const targetY = gridStartY + targetRow * cellSize + cellSize / 2;
      const highlight = this.scene.add.circle(
        targetX, targetY, cellSize / 2 - 2, 0x8844ff, 0.4
      );
      highlight.setStrokeStyle(2, 0xaa88ff, 0.8);
      this.container.add(highlight);
      this.highlightTargets.push(highlight);
    }

    // Skill info
    const targetType = this.highlightTargets.length > 1 ? "Đa mục tiêu" : "Đơn mục tiêu";
    const info = this.scene.add.text(8, this.height - 32, targetType, {
      fontFamily: UI_FONT,
      fontSize: "11px",
      color: "#8ab4d4"
    });
    this.container.add(info);
  }

  startAnimation() {
    // Pulse animation for all highlights
    if (this.highlightTargets.length > 0) {
      this.highlightTween = this.scene.tweens.add({
        targets: this.highlightTargets,
        alpha: { from: 0.6, to: 0.2 },
        scale: { from: 1, to: 1.2 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.playSkillLoop();
  }

  playSkillLoop() {
    if (!this.scene || !this.container.active) return;

    // Windup
    this.scene.tweens.add({
      targets: this.attackerIcon,
      y: this.attackerIcon.y - 12,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 350,
      yoyo: true,
      onComplete: () => {
        if (!this.container.active) return;
        this.showSkillEffect();
        this.scene.time.delayedCall(1200, () => this.playSkillLoop());
      }
    });
  }

  showSkillEffect() {
    if (!this.container.active) return;

    // Screen flash
    const flash = this.scene.add.rectangle(0, 0, this.width, this.height, 0xb6dbff, 0.2).setOrigin(0, 0);
    this.container.add(flash);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });

    this.highlightTargets.forEach(target => {
      const hit = this.scene.add.text(target.x, target.y - 10, "⚡", { fontSize: "16px" }).setOrigin(0.5);
      this.container.add(hit);

      this.scene.tweens.add({
        targets: hit,
        y: hit.y - 15,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 400,
        onComplete: () => hit.destroy()
      });
    });

    this.enemyIcons.forEach(enemy => {
      // Find if this enemy is targeted
      const isTargeted = this.highlightTargets.some(t =>
        Math.abs(t.x - enemy.icon.x) < 5 && Math.abs(t.y - enemy.icon.y) < 5
      );
      if (isTargeted) {
        this.scene.tweens.add({
          targets: enemy.icon,
          x: enemy.icon.x + 6,
          duration: 50,
          yoyo: true,
          repeat: 2
        });
      }
    });
  }

  destroy() {
    if (this.highlightTween) {
      this.highlightTween.stop();
    }
    this.container.destroy();
  }
}
