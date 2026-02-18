export class VfxController {
  constructor(scene) {
    this.scene = scene;
  }

  pulseAt(x, y, color = 0xffd17b, radius = 18, duration = 220) {
    const ring = this.scene.add.circle(x, y, radius, color, 0.24);
    ring.setDepth(8500);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.9,
      scaleY: 1.9,
      alpha: 0,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy()
    });
  }

  slash(x1, y1, x2, y2, color = 0xff9a9a, duration = 180) {
    const g = this.scene.add.graphics();
    g.setDepth(8500);
    g.lineStyle(4, color, 1);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration,
      onComplete: () => g.destroy()
    });
  }

  textPop(x, y, text, color = "#ffffff") {
    const t = this.scene.add.text(x - 8, y, text, {
      fontFamily: "Consolas",
      fontSize: "13px",
      color
    });
    t.setDepth(8600);
    this.scene.tweens.add({
      targets: t,
      y: y - 26,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy()
    });
  }
}
