import Phaser from "phaser";

export class TooltipController {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0);
    this.root.setDepth(9000);
    this.root.setVisible(false);
    this.width = 320;
    this.height = 120;
    this.padX = 12;
    this.padY = 10;
    this.gapY = 6;

    this.bg = scene.add.rectangle(0, 0, this.width, this.height, 0x0f1624, 0.97);
    this.bg.setOrigin(0, 0);
    this.bg.setStrokeStyle(2, 0x8ec6ff, 1);
    this.titleText = scene.add.text(this.padX, this.padY, "", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#fff1b8",
      wordWrap: { width: this.width - 24, useAdvancedWrap: true }
    });
    this.bodyText = scene.add.text(this.padX, 34, "", {
      fontFamily: "Consolas",
      fontSize: "12px",
      color: "#d9ecff",
      lineSpacing: 3,
      wordWrap: { width: this.width - 24, useAdvancedWrap: true }
    });
    this.rightText = scene.add.text(this.padX, 34, "", {
      fontFamily: "Consolas",
      fontSize: "12px",
      color: "#cde8ff",
      lineSpacing: 3,
      wordWrap: { width: this.width - 24, useAdvancedWrap: true }
    });
    this.divider = scene.add.rectangle(0, 0, 1, 12, 0x5a86aa, 0.85);
    this.divider.setOrigin(0, 0);
    this.divider.setVisible(false);
    this.rightText.setVisible(false);

    this.root.add([this.bg, this.titleText, this.bodyText, this.divider, this.rightText]);
  }

  measureWrappedWidth(lines, textObj) {
    if (!Array.isArray(lines) || !lines.length) return 0;
    const ctx = this.scene?.sys?.game?.canvas?.getContext?.("2d");
    if (!ctx) return 0;
    const style = textObj.style ?? {};
    const fontFamily = Array.isArray(style.fontFamily) ? style.fontFamily.join(",") : style.fontFamily ?? "Consolas";
    const fontSize = typeof style.fontSize === "number" ? `${style.fontSize}px` : style.fontSize ?? "12px";
    const fontStyle = style.fontStyle ? `${style.fontStyle} ` : "";
    ctx.save();
    ctx.font = `${fontStyle}${fontSize} ${fontFamily}`;
    let max = 0;
    lines.forEach((line) => {
      const w = ctx.measureText(String(line ?? "")).width;
      if (w > max) max = w;
    });
    ctx.restore();
    return max;
  }

  attach(target, getContentFn) {
    target.on("pointerover", (pointer) => {
      const content = getContentFn?.();
      if (!content) return;
      this.show(pointer, content.title ?? "", content.body ?? "", content.rightBody ?? "");
    });
    target.on("pointermove", (pointer) => {
      if (!this.root.visible) return;
      this.move(pointer);
    });
    target.on("pointerout", () => {
      this.hide();
    });
  }

  showCombatUnitTooltip(pointer, content = {}, unit = null) {
    if (!content && !unit) {
      this.hide();
      return;
    }

    const safeContent = content ?? {};
    let title = safeContent.title ?? "";
    let body = safeContent.body ?? "";
    const rightBody = safeContent.rightBody ?? "";

    if (!String(body).trim() && unit) {
      const hp = `${unit.hp ?? 0}/${unit.maxHp ?? 0}`;
      const atk = unit.atk ?? 0;
      const def = unit.def ?? 0;
      const matk = unit.matk ?? 0;
      const mdef = unit.mdef ?? 0;
      const range = unit.range ?? 1;
      const role = unit.classType ?? "Không rõ";
      const element = unit.tribe ?? "Không rõ";
      body = [
        `HP: ${hp}`,
        `ATK: ${atk} | DEF: ${def}`,
        `MATK: ${matk} | MDEF: ${mdef}`,
        `Tầm đánh: ${range}`,
        `Nghề: ${role}`,
        `Hệ: ${element}`
      ].join("\n");
    }

    if (!String(title).trim()) {
      title = "Linh thú";
    }

    this.show(pointer, title, body, rightBody);
  }

  show(pointer, title, body, rightBody = "") {
    const hasRightColumn = Boolean(String(rightBody ?? "").trim());

    if (hasRightColumn) {
      const minWidth = 460;
      const maxWidth = Math.max(minWidth, Math.min(580, Math.floor(this.scene.scale.width * 0.52)));
      this.width = Phaser.Math.Clamp(Math.floor(this.scene.scale.width * 0.46), minWidth, maxWidth);
      const splitGap = 16;
      const contentW = this.width - this.padX * 2;
      const leftW = Math.max(210, Math.floor((contentW - splitGap) * 0.46));
      const rightW = Math.max(220, contentW - splitGap - leftW);

      this.titleText.setWordWrapWidth(contentW, true);
      this.bodyText.setWordWrapWidth(leftW, true);
      this.rightText.setWordWrapWidth(rightW, true);

      this.titleText.setText(title);
      this.bodyText.setText(body);
      this.rightText.setText(rightBody);

      this.titleText.setPosition(this.padX, this.padY);
      const bodyY = this.padY + this.titleText.height + this.gapY + 1;
      this.bodyText.setPosition(this.padX, bodyY);
      this.rightText.setPosition(this.padX + leftW + splitGap, bodyY);
      this.divider.setPosition(this.padX + leftW + Math.floor(splitGap / 2), bodyY - 1);
      this.divider.setSize(1, Math.max(this.bodyText.height, this.rightText.height) + 2);

      this.rightText.setVisible(true);
      this.divider.setVisible(true);
      this.height = Math.max(90, Math.ceil(bodyY + Math.max(this.bodyText.height, this.rightText.height) + this.padY));
      this.bg.setSize(this.width, this.height);
      this.move(pointer);
      this.root.setVisible(true);
      return;
    }

    this.rightText.setVisible(false);
    this.divider.setVisible(false);
    const maxWidth = Math.max(260, Math.min(460, Math.floor(this.scene.scale.width * 0.34)));
    const minWidth = 240;
    const measureWrap = maxWidth - this.padX * 2;
    this.titleText.setWordWrapWidth(measureWrap, true);
    this.bodyText.setWordWrapWidth(measureWrap, true);

    const titleLines = this.titleText.getWrappedText(title ?? "");
    const bodyLines = this.bodyText.getWrappedText(body ?? "");
    const measuredTitleW = this.measureWrappedWidth(titleLines, this.titleText);
    const measuredBodyW = this.measureWrappedWidth(bodyLines, this.bodyText);
    const measuredW = Math.ceil(Math.max(measuredTitleW, measuredBodyW) + this.padX * 2 + 2);
    this.width = Phaser.Math.Clamp(measuredW, minWidth, maxWidth);

    this.titleText.setWordWrapWidth(this.width - this.padX * 2, true);
    this.bodyText.setWordWrapWidth(this.width - this.padX * 2, true);
    this.titleText.setText(title);
    this.bodyText.setText(body);

    this.titleText.setPosition(this.padX, this.padY);
    this.bodyText.setPosition(this.padX, this.padY + this.titleText.height + this.gapY);
    this.height = Math.max(82, Math.ceil(this.bodyText.y + this.bodyText.height + this.padY));
    this.bg.setSize(this.width, this.height);
    this.move(pointer);
    this.root.setVisible(true);
  }

  move(pointer) {
    const px = pointer?.x ?? this.scene.input.activePointer.x;
    const py = pointer?.y ?? this.scene.input.activePointer.y;
    const pad = 14;
    const maxX = this.scene.scale.width - this.width - pad;
    const maxY = this.scene.scale.height - this.height - pad;
    const x = Phaser.Math.Clamp(px + 18, pad, maxX);
    const y = Phaser.Math.Clamp(py + 18, pad, maxY);
    this.root.setPosition(x, y);
  }

  hide() {
    this.root.setVisible(false);
  }
}
