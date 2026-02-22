/**
 * AttackPreview - Hiển thị preview đòn đánh thường
 */

import { getUnitVisual } from "../data/unitVisuals.js";
import { UI_FONT } from "../core/uiTheme.js";

export class AttackPreview {
  constructor(scene, x, y, width, height, unit) {
    this.scene = scene;
    this.unit = unit;
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
    const title = this.scene.add.text(8, 8, "⚔️ Đòn đánh thường", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: "#ffd580",
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

    // Place enemies (right side, various positions)
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

    // Determine target based on unit role
    let targetRow, targetCol;
    const range = this.unit.stats?.range || 1;

    if (range <= 1) {
      // Cận chiến: Ưu tiên cột gần nhất
      if (this.unit.classType === "ASSASSIN") {
        // Sát thủ: Cùng hàng xa nhất (col 3)
        targetRow = 1;
        targetCol = 3;
      } else {
        // Tank/Fighter: Cột gần nhất, ưu tiên hàng trên (row 0)
        targetRow = 0;
        targetCol = 2;
      }
    } else {
      // Tầm xa: Ưu tiên cùng hàng (row 1, col 3)
      targetRow = 1;
      targetCol = 3;
    }

    // Highlight target
    const targetX = gridX + targetCol * cellSize + cellSize / 2;
    const targetY = gridStartY + targetRow * cellSize + cellSize / 2;
    this.targetHighlight = this.scene.add.circle(
      targetX, targetY, cellSize / 2 - 2, 0xff4444, 0.4
    );
    this.targetHighlight.setStrokeStyle(2, 0xff8888, 0.8);
    this.container.add(this.targetHighlight);

    // Targeting info
    const roleText = range <= 1 ? "Cận chiến" : "Tầm xa";
    const strategyText = range <= 1
      ? (this.unit.classType === "ASSASSIN" ? "Cột xa nhất" : "Cột gần nhất")
      : "Cùng hàng";

    const info = this.scene.add.text(8, this.height - 32,
      `${roleText} • ${strategyText}`, {
      fontFamily: UI_FONT,
      fontSize: "11px",
      color: "#8ab4d4"
    });
    this.container.add(info);
  }

  startAnimation() {
    // Pulse animation for target highlight
    if (this.targetHighlight) {
      this.highlightTween = this.scene.tweens.add({
        targets: this.targetHighlight,
        alpha: { from: 0.6, to: 0.2 },
        scale: { from: 1, to: 1.2 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.playAttackLoop();
  }

  playAttackLoop() {
    if (!this.scene || !this.container.active) return;

    const startX = this.attackerIcon.x;
    const startY = this.attackerIcon.y;
    const targetX = this.targetHighlight.x;
    const targetY = this.targetHighlight.y;
    const range = this.unit.stats?.range || 1;

    if (range <= 1) {
      // Melee/Assassin dash
      const isAssassin = this.unit.classType === "ASSASSIN";
      const dashX = isAssassin ? targetX + 15 : targetX - 15;
      this.scene.tweens.add({
        targets: this.attackerIcon,
        x: dashX,
        y: targetY,
        duration: 250,
        ease: 'Power2',
        onComplete: () => {
          this.showHit(targetX, targetY);
          this.scene.time.delayedCall(300, () => {
            if (!this.container.active) return;
            this.scene.tweens.add({
              targets: this.attackerIcon,
              x: startX,
              y: startY,
              duration: 250,
              ease: 'Power2',
              onComplete: () => {
                this.scene.time.delayedCall(800, () => this.playAttackLoop());
              }
            });
          });
        }
      });
    } else {
      // Ranged Projectile
      this.scene.tweens.add({
        targets: this.attackerIcon,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 150,
        yoyo: true,
        onComplete: () => {
          if (!this.container.active) return;
          const proj = this.scene.add.circle(startX + 10, startY, 3, 0xbad6ff);
          this.container.add(proj);
          this.scene.tweens.add({
            targets: proj,
            x: targetX,
            y: targetY,
            duration: 250,
            onComplete: () => {
              proj.destroy();
              this.showHit(targetX, targetY);
              this.scene.time.delayedCall(1000, () => this.playAttackLoop());
            }
          });
        }
      });
    }
  }

  showHit(x, y) {
    if (!this.container.active) return;
    const hit = this.scene.add.text(x, y - 10, "💥", { fontSize: "16px" }).setOrigin(0.5);
    this.container.add(hit);
    this.scene.tweens.add({
      targets: hit,
      y: y - 20,
      alpha: 0,
      duration: 400,
      onComplete: () => hit.destroy()
    });
  }

  destroy() {
    if (this.highlightTween) {
      this.highlightTween.stop();
    }
    this.container.destroy();
  }
}
