import Phaser from "phaser";
import { queueSharedAssets } from "../core/sharedAssetLoader.js";

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
    this.progressText = null;
    this.detailText = null;
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x0b1320, 1);
    this.add.text(w * 0.5, h * 0.5 - 84, "FOREST THRONE", {
      fontFamily: "Consolas",
      fontSize: "38px",
      color: "#e7f5ff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.progressText = this.add.text(w * 0.5, h * 0.5 - 20, "Đang loading: 0%", {
      fontFamily: "Consolas",
      fontSize: "22px",
      color: "#a8d7ff"
    }).setOrigin(0.5);

    this.detailText = this.add.text(w * 0.5, h * 0.5 + 20, "Đang chuẩn bị tài nguyên...", {
      fontFamily: "Consolas",
      fontSize: "16px",
      color: "#d8ecff",
      wordWrap: { width: Math.min(1000, w - 60) },
      align: "center"
    }).setOrigin(0.5);

    const barW = Math.min(780, Math.floor(w * 0.62));
    const barH = 20;
    const barX = Math.floor(w * 0.5 - barW * 0.5);
    const barY = Math.floor(h * 0.5 + 68);
    const barBg = this.add.rectangle(w * 0.5, barY + barH * 0.5, barW, barH, 0x1b2a3d, 1);
    barBg.setStrokeStyle(1, 0x4f7397, 1);
    const barFill = this.add.rectangle(barX, barY + barH * 0.5, 0, barH - 4, 0x7fd1ff, 1);
    barFill.setOrigin(0, 0.5);

    this.load.on("progress", (value) => {
      const pct = Math.max(0, Math.min(100, Math.round((Number(value) || 0) * 100)));
      this.progressText?.setText(`Đang loading: ${pct}%`);
      barFill.width = Math.floor((barW - 4) * (pct / 100));
    });

    this.load.on("fileprogress", (file) => {
      const key = file?.key ?? "unknown";
      const type = file?.type ?? "asset";
      this.detailText?.setText(`Đang loading ${type}: ${key}`);
    });

    this.load.on("loaderror", (file) => {
      const key = file?.key ?? "unknown";
      this.detailText?.setText(`Lỗi loading: ${key}`);
    });

    this.load.on("complete", () => {
      this.progressText?.setText("Đang loading: 100%");
      this.detailText?.setText("Hoàn tất tải tài nguyên.");
    });

    queueSharedAssets(this);
  }

  create() {
    this.time.delayedCall(120, () => {
      this.scene.start("MainMenuScene");
    });
  }
}
