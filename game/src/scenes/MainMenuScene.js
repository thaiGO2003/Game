import Phaser from "phaser";
import { AudioFx } from "../core/audioFx.js";
import { clearProgress, loadProgress } from "../core/persistence.js";
import { createDefaultUiSettings, loadUiSettings, saveUiSettings } from "../core/uiSettings.js";
import { FOREST_BACKGROUND_ASSETS } from "../data/forestBackgrounds.js";
import { hydrateRunState } from "../core/runState.js";
import { getLoseConditionLabel, normalizeLoseCondition } from "../core/gameRules.js";
import { UNIT_CATALOG } from "../data/unitCatalog.js";
import { SKILL_LIBRARY } from "../data/skills.js";
import { getClassLabelVi, getTribeLabelVi, getUnitVisual } from "../data/unitVisuals.js";

const AI_LABELS = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó"
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
    this.settings = createDefaultUiSettings();
    this.statusText = null;
    this.selectedMode = "PVE_JOURNEY";
    this.startPanel = null;
    this.startInfoText = null;
    this.modeRadioGroup = null;
    this.difficultyRadioGroup = null;
    this.continueButton = null;
    this.savedRun = null;
    this.wikiPanel = null;
    this.wikiContent = null;
    this.wikiScrollY = 0;
    this.wikiScrollMax = 0;
    this.wikiContentBaseY = 0;
    this.wikiViewport = null;
    this.wikiWheelArea = null;
    this.wikiScrollHint = null;
  }

  preload() {
    this.load.audio("bgm_menu", "assets/audio/bgm_menu.mp3");
    this.load.audio("bgm_planning", "assets/audio/bgm_planning.mp3");
    this.load.audio("bgm_combat", "assets/audio/bgm_combat.mp3");
    this.load.audio("sfx_key", "assets/audio/key.wav");
    this.load.audio("sfx_explosion", "assets/audio/explosion.mp3");
    this.load.audio("sfx_blaster", "assets/audio/blaster.mp3");
    this.load.audio("sfx_sword", "assets/audio/sword.mp3");
    this.load.audio("sfx_ping", "assets/audio/p-ping.mp3");
    this.load.audio("sfx_shot", "assets/audio/shot1.wav");

    FOREST_BACKGROUND_ASSETS.forEach((asset) => {
      if (!this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.path);
      }
    });
  }

  create() {
    this.settings = loadUiSettings();
    this.savedRun = hydrateRunState(loadProgress());
    this.audioFx = new AudioFx(this);
    this.audioFx.setEnabled(this.settings.audioEnabled !== false);
    this.audioFx.setVolumeLevel(this.settings.volumeLevel ?? 10);
    this.audioFx.startBgm("bgm_menu", 0.18);
    this.drawBackground();
    this.createHeader();
    this.createMainButtons();
    this.createSettingsPanel();
    this.createStartPanel();
    this.createWikiPanel();
    this.input.on("wheel", (pointer, _objects, _deltaX, deltaY) => {
      if (!this.wikiPanel?.visible || !this.wikiWheelArea) return;
      if (!Phaser.Geom.Rectangle.Contains(this.wikiWheelArea, pointer.x, pointer.y)) return;
      this.scrollWikiBy(deltaY);
    });
    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.wikiPanel?.visible) this.wikiPanel.setVisible(false);
    });
  }

  drawBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x12263a, 0x12263a, 0x0c1728, 0x0c1728, 1);
    bg.fillRect(0, 0, w, h);

    const mist = this.add.graphics();
    mist.fillStyle(0x2a7a5e, 0.15);
    mist.fillEllipse(w * 0.2, h * 0.75, w * 0.45, h * 0.36);
    mist.fillStyle(0x5d96d1, 0.12);
    mist.fillEllipse(w * 0.76, h * 0.26, w * 0.4, h * 0.33);
  }

  createHeader() {
    const w = this.scale.width;
    this.add.text(w * 0.5, 96, "Bá Chủ Khu Rừng", {
      fontFamily: "Trebuchet MS",
      fontSize: "58px",
      color: "#f6f1d5",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(w * 0.5, 154, "Auto-battle chiến thuật 5x5", {
      fontFamily: "Consolas",
      fontSize: "24px",
      color: "#b7d9ff"
    }).setOrigin(0.5);
  }

  createMainButtons() {
    const w = this.scale.width;
    const startY = 250;

    this.continueButton = this.createButton(w * 0.5, startY, 320, 56, "Tiếp tục", () => {
      this.continueRun();
    }, 0x2b5874, 0x9cd0ff);

    this.createButton(w * 0.5, startY + 70, 320, 56, "Bắt đầu mới", () => {
      this.startPanel.setVisible(!this.startPanel.visible);
    }, 0x2f8f6f, 0x8bffd7);

    this.createButton(w * 0.5, startY + 140, 320, 50, "Cài đặt", () => {
      this.settingsPanel.setVisible(!this.settingsPanel.visible);
    }, 0x284b78, 0x9cd0ff);

    this.createButton(w * 0.5, startY + 206, 320, 50, "Wiki Linh thú", () => {
      this.toggleWikiPanel();
    }, 0x2e5f7d, 0x9ed8ff);

    this.createButton(w * 0.5, startY + 272, 320, 50, "Xóa tiến trình lưu", () => {
      clearProgress();
      this.savedRun = null;
      this.refreshMainButtons();
      this.flashStatus("Đã xóa tiến trình lưu cục bộ.");
    }, 0x5f2f3d, 0xffc0cf);

    this.statusText = this.add.text(w * 0.5, startY + 340, "", {
      fontFamily: "Consolas",
      fontSize: "17px",
      color: "#ccecff"
    }).setOrigin(0.5);

    this.refreshMainButtons();
  }

  continueRun() {
    const restored = this.savedRun ?? hydrateRunState(loadProgress());
    if (!restored) {
      this.flashStatus("Chưa có tiến trình lưu để tiếp tục.");
      this.refreshMainButtons();
      return;
    }
    this.savedRun = restored;
    this.settings.aiMode = restored.aiMode ?? this.settings.aiMode;
    if (typeof restored.audioEnabled === "boolean") {
      this.settings.audioEnabled = restored.audioEnabled;
      this.audioFx?.setEnabled(restored.audioEnabled);
    }
    this.scene.start("PlanningScene", {
      settings: this.settings,
      mode: restored.player?.gameMode ?? this.selectedMode,
      restoredState: restored
    });
  }

  createStartPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelWidth = Math.min(Math.floor(w * 0.9), 930);
    const panelHeight = 360;
    const panel = this.add.container(w * 0.5, h * 0.76);
    panel.setDepth(100);
    panel.setVisible(false);

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x0f1a2b, 0.97);
    bg.setStrokeStyle(2, 0x8bc8ff, 1);
    panel.add(bg);

    const leftX = -panelWidth * 0.5 + 34;
    const topY = -panelHeight * 0.5 + 30;
    const rightWidth = Math.min(320, panelWidth * 0.36);
    const rightX = panelWidth * 0.5 - rightWidth - 34;

    panel.add(
      this.add.text(leftX, topY, "Chọn chế độ trước khi vào game", {
        fontFamily: "Consolas",
        fontSize: "25px",
        color: "#ffeab0"
      })
    );

    this.startInfoText = this.add.text(leftX, topY + 74, "", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#c9e7ff",
      lineSpacing: 5,
      wordWrap: { width: panelWidth * 0.52 }
    });
    panel.add(this.startInfoText);

    this.modeRadioGroup = this.createRadioGroup({
      parent: panel,
      x: rightX,
      y: topY + 12,
      width: rightWidth,
      title: "Chế độ",
      options: [
        { value: "PVE_JOURNEY", label: "Hành trình PvE theo vòng" },
        { value: "PVE_SANDBOX", label: "PvE Sandbox" }
      ],
      getValue: () => this.selectedMode,
      onChange: (value) => {
        this.selectedMode = value;
        this.refreshStartPanel();
      }
    });

    this.difficultyRadioGroup = this.createRadioGroup({
      parent: panel,
      x: rightX,
      y: topY + 142,
      width: rightWidth,
      title: "Độ khó AI",
      options: [
        { value: "EASY", label: "Dễ" },
        { value: "MEDIUM", label: "Trung bình" },
        { value: "HARD", label: "Khó" }
      ],
      getValue: () => this.settings.aiMode,
      onChange: (value) => {
        this.settings.aiMode = value;
        saveUiSettings(this.settings);
        this.refreshSettingsPanel();
        this.refreshStartPanel();
      }
    });

    const actionY = panelHeight * 0.5 - 20;
    this.createButton(-102, actionY, 220, 50, "Vào game", () => {
      this.scene.start("PlanningScene", {
        settings: this.settings,
        mode: this.selectedMode,
        forceNewRun: true
      });
    }, 0x2f8f6f, 0x8bffd7, panel);

    this.createButton(156, actionY, 220, 50, "Đóng", () => {
      panel.setVisible(false);
    }, 0x3b4e66, 0xb6d3ff, panel);

    this.startPanel = panel;
    this.refreshStartPanel();
  }

  createSettingsPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panel = this.add.container(w * 0.5, h * 0.72);
    panel.setVisible(false);

    const bg = this.add.rectangle(0, 0, 560, 278, 0x101a2a, 0.96);
    bg.setStrokeStyle(2, 0x7fb8ff, 1);
    panel.add(bg);

    const title = this.add.text(-258, -95, "Cài đặt", {
      fontFamily: "Consolas",
      fontSize: "24px",
      color: "#ffeab0"
    });
    panel.add(title);

    this.audioText = this.add.text(-248, -46, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.audioText);

    this.aiText = this.add.text(-248, 8, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.aiText);

    this.volumeText = this.add.text(-248, 62, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.volumeText);

    const audioBtn = this.createButton(170, -36, 160, 40, "Đổi", () => {
      this.settings.audioEnabled = !this.settings.audioEnabled;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    const aiBtn = this.createButton(170, 18, 160, 40, "Đổi", () => {
      const order = ["EASY", "MEDIUM", "HARD"];
      const idx = order.indexOf(this.settings.aiMode);
      this.settings.aiMode = order[(idx + 1) % order.length];
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    const volumeBtn = this.createButton(170, 72, 160, 40, "Tăng", () => {
      const current = Number.isFinite(this.settings.volumeLevel) ? this.settings.volumeLevel : 10;
      this.settings.volumeLevel = current >= 10 ? 1 : current + 1;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    this.createButton(0, 132, 170, 42, "Đóng", () => {
      panel.setVisible(false);
    }, 0x3b4e66, 0xb6d3ff, panel);

    this.settingsPanel = panel;
    this.refreshSettingsPanel();
  }

  createWikiPanel() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelWidth = Math.min(Math.floor(w * 0.9), 1060);
    const panelHeight = Math.min(Math.floor(h * 0.86), 760);
    const panelX = w * 0.5;
    const panelY = h * 0.5;
    const panel = this.add.container(panelX, panelY);
    panel.setVisible(false);

    const dim = this.add.rectangle(0, 0, w, h, 0x060d18, 0.7);
    dim.setInteractive({ useHandCursor: true });
    dim.on("pointerdown", () => {
      panel.setVisible(false);
    });
    panel.add(dim);

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x0e1a2d, 0.97);
    bg.setStrokeStyle(2, 0x86c8ff, 1);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(-panelWidth * 0.5, -panelHeight * 0.5, panelWidth, panelHeight),
      Phaser.Geom.Rectangle.Contains
    );
    bg.on("pointerdown", (_pointer, _lx, _ly, event) => {
      event?.stopPropagation?.();
    });
    panel.add(bg);

    const title = this.add.text(-panelWidth * 0.5 + 28, -panelHeight * 0.5 + 22, "Wiki Linh Thú", {
      fontFamily: "Consolas",
      fontSize: "29px",
      color: "#ffeab0"
    });
    panel.add(title);

    const subtitle = this.add.text(-panelWidth * 0.5 + 28, -panelHeight * 0.5 + 60, "Dữ liệu tự động từ unitCatalog + skills. Sửa thú trong code là wiki cập nhật theo.", {
      fontFamily: "Consolas",
      fontSize: "16px",
      color: "#cde8ff",
      wordWrap: { width: panelWidth - 220 }
    });
    panel.add(subtitle);

    const viewport = {
      x: -panelWidth * 0.5 + 24,
      y: -panelHeight * 0.5 + 98,
      width: panelWidth - 48,
      height: panelHeight - 172
    };
    this.wikiViewport = viewport;
    this.wikiWheelArea = new Phaser.Geom.Rectangle(
      panelX + viewport.x,
      panelY + viewport.y,
      viewport.width,
      viewport.height
    );

    const contentMaskGfx = this.add.graphics();
    contentMaskGfx.fillStyle(0xffffff, 1);
    contentMaskGfx.fillRect(
      panelX + viewport.x,
      panelY + viewport.y,
      viewport.width,
      viewport.height
    );
    contentMaskGfx.setVisible(false);

    this.wikiContentBaseY = viewport.y + 6;
    this.wikiContent = this.add.container(viewport.x + 6, this.wikiContentBaseY);
    this.wikiContent.setMask(contentMaskGfx.createGeometryMask());
    panel.add(this.wikiContent);

    this.wikiScrollHint = this.add.text(-panelWidth * 0.5 + 28, panelHeight * 0.5 - 42, "Lăn chuột để cuộn • ESC hoặc Đóng để thoát", {
      fontFamily: "Consolas",
      fontSize: "15px",
      color: "#9ec4e8"
    });
    panel.add(this.wikiScrollHint);

    this.createButton(panelWidth * 0.5 - 116, panelHeight * 0.5 - 38, 180, 42, "Đóng", () => {
      panel.setVisible(false);
    }, 0x3b4e66, 0xb6d3ff, panel);

    this.wikiPanel = panel;
    this.refreshWikiPanel();
  }

  toggleWikiPanel() {
    if (!this.wikiPanel) return;
    const nextVisible = !this.wikiPanel.visible;
    this.wikiPanel.setVisible(nextVisible);
    if (nextVisible) {
      this.settingsPanel?.setVisible(false);
      this.startPanel?.setVisible(false);
      this.refreshWikiPanel();
    }
  }

  scrollWikiBy(deltaY) {
    if (!this.wikiContent || !this.wikiViewport) return;
    this.wikiScrollY = Phaser.Math.Clamp(this.wikiScrollY + deltaY * 0.55, 0, this.wikiScrollMax);
    this.wikiContent.y = this.wikiContentBaseY - this.wikiScrollY;
    if (this.wikiScrollHint) {
      const cardHeight = this.wikiViewport.width > 820 ? 92 : 100;
      const columns = this.wikiViewport.width > 820 ? 2 : 1;
      const rowStart = Math.floor(this.wikiScrollY / cardHeight);
      const rowVisible = Math.max(1, Math.ceil(this.wikiViewport.height / cardHeight));
      const shownStart = Math.min(UNIT_CATALOG.length, rowStart * columns + 1);
      const shownEnd = Math.min(UNIT_CATALOG.length, (rowStart + rowVisible) * columns);
      this.wikiScrollHint.setText(`Lăn chuột để cuộn • Đang xem mục ${shownStart}-${shownEnd}/${UNIT_CATALOG.length}`);
    }
  }

  refreshWikiPanel() {
    if (!this.wikiContent || !this.wikiViewport) return;
    this.wikiContent.removeAll(true);

    const units = [...UNIT_CATALOG].sort((a, b) => a.tier - b.tier || a.classType.localeCompare(b.classType) || a.name.localeCompare(b.name));
    const classCount = {};
    const tribeCount = {};
    units.forEach((unit) => {
      classCount[unit.classType] = (classCount[unit.classType] ?? 0) + 1;
      tribeCount[unit.tribe] = (tribeCount[unit.tribe] ?? 0) + 1;
    });

    const maxSummaryItems = 4;
    const classSummaryArr = Object.entries(classCount)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([code, count]) => `${getClassLabelVi(code)}: ${count}`);
    const classSummary = classSummaryArr.length > maxSummaryItems
      ? classSummaryArr.slice(0, maxSummaryItems).join(" • ") + ` (+${classSummaryArr.length - maxSummaryItems})`
      : classSummaryArr.join(" • ");
    const tribeSummaryArr = Object.entries(tribeCount)
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([code, count]) => `${getTribeLabelVi(code)}: ${count}`);
    const tribeSummary = tribeSummaryArr.length > maxSummaryItems
      ? tribeSummaryArr.slice(0, maxSummaryItems).join(" • ") + ` (+${tribeSummaryArr.length - maxSummaryItems})`
      : tribeSummaryArr.join(" • ");

    let y = 0;
    const intro = this.add.text(0, y, `Tổng thú: ${units.length}\nTheo nghề: ${classSummary}\nTheo tộc: ${tribeSummary}`, {
      fontFamily: "Consolas",
      fontSize: "16px",
      color: "#d8edff",
      lineSpacing: 5,
      wordWrap: { width: this.wikiViewport.width - 22 }
    });
    this.wikiContent.add(intro);
    y += intro.height + 14;

    const sectionTitle = this.add.text(0, y, "Danh sách thú hiện tại", {
      fontFamily: "Consolas",
      fontSize: "20px",
      color: "#ffeab0"
    });
    this.wikiContent.add(sectionTitle);
    y += sectionTitle.height + 10;

    const columns = this.wikiViewport.width > 820 ? 2 : 1;
    const gap = 12;
    const cardW = Math.floor((this.wikiViewport.width - 14 - gap * (columns - 1)) / columns);
    const cardH = columns === 2 ? 92 : 100;
    const skillNameMax = columns === 2 ? 26 : 34;

    units.forEach((unit, idx) => {
      const visual = getUnitVisual(unit.id, unit.classType);
      const skillNameRaw = SKILL_LIBRARY?.[unit.skillId]?.name ?? unit.skillId;
      const skillName = skillNameRaw.length > skillNameMax ? `${skillNameRaw.slice(0, skillNameMax - 1)}…` : skillNameRaw;
      const col = idx % columns;
      const row = Math.floor(idx / columns);
      const cardX = col * (cardW + gap);
      const cardY = y + row * (cardH + 8);
      const bg = this.add.rectangle(cardX, cardY, cardW, cardH, idx % 2 === 0 ? 0x182b44 : 0x16273f, 0.88).setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x7ab8f5, 0.45);
      const label = this.add.text(
        cardX + 10,
        cardY + 8,
        `${String(idx + 1).padStart(2, "0")}  ${visual.icon} ${visual.nameVi}\nBậc ${unit.tier} • ${getTribeLabelVi(unit.tribe)} • ${getClassLabelVi(unit.classType)}\nKỹ năng: ${skillName}`,
        {
          fontFamily: "Consolas",
          fontSize: "15px",
          color: "#d7ecff",
          lineSpacing: 4,
          wordWrap: { width: cardW - 20 }
        }
      );
      this.wikiContent.add([bg, label]);
    });

    const totalRows = Math.ceil(units.length / columns);
    y += totalRows * (cardH + 8);
    this.wikiScrollY = 0;
    this.wikiScrollMax = Math.max(0, y - (this.wikiViewport.height - 12));
    this.wikiContent.y = this.wikiContentBaseY;
    if (this.wikiScrollHint) {
      const rowVisible = Math.max(1, Math.ceil(this.wikiViewport.height / (cardH + 8)));
      this.wikiScrollHint.setText(`Lăn chuột để cuộn • Đang xem mục 1-${Math.min(rowVisible * columns, UNIT_CATALOG.length)}/${UNIT_CATALOG.length}`);
    }
  }

  createButton(x, y, w, h, label, onClick, fill, stroke, parent = null) {
    const bg = this.add.rectangle(x, y, w, h, fill, 0.96);
    bg.setStrokeStyle(2, stroke, 1);
    bg.setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: "Consolas",
      fontSize: "20px",
      color: "#f1f8ff"
    }).setOrigin(0.5);

    const button = {
      bg,
      label: text,
      enabled: true,
      baseFill: fill,
      baseStroke: stroke,
      setLabel: (value) => text.setText(value),
      setEnabled: (enabled) => {
        button.enabled = !!enabled;
        bg.setFillStyle(button.enabled ? fill : 0x3a3a3a, button.enabled ? 0.96 : 0.82);
        bg.setStrokeStyle(2, button.enabled ? stroke : 0x6e6e6e, 1);
        text.setColor(button.enabled ? "#f1f8ff" : "#aeb5bd");
      }
    };

    bg.on("pointerover", () => {
      if (button.enabled) bg.setFillStyle(fill, 1);
    });
    bg.on("pointerout", () => {
      if (button.enabled) bg.setFillStyle(fill, 0.96);
    });
    bg.on("pointerdown", () => {
      if (!button.enabled) return;
      onClick?.();
    });

    if (parent) {
      parent.add(bg);
      parent.add(text);
    }

    return button;
  }

  refreshMainButtons() {
    if (!this.continueButton) return;
    const restored = this.savedRun ?? hydrateRunState(loadProgress());
    this.savedRun = restored;
    if (!restored) {
      this.continueButton.setLabel("Tiếp tục");
      this.continueButton.setEnabled(false);
      return;
    }
    const round = restored.player?.round ?? 1;
    const loseCondition = normalizeLoseCondition(restored.player?.loseCondition ?? this.settings?.loseCondition);
    const hp = Math.max(0, Math.floor(restored.player?.hp ?? 0));
    const loseLabel = loseCondition === "NO_HEARTS" ? `${getLoseConditionLabel(loseCondition)} (${hp} tim)` : getLoseConditionLabel(loseCondition);
    this.continueButton.setLabel(`Tiếp tục (Vòng ${round})`);
    this.continueButton.setEnabled(true);
  }

  createRadioGroup({ parent, x, y, width, title, options, getValue, onChange }) {
    const group = this.add.container(x, y);
    parent.add(group);

    const sectionTitle = this.add.text(0, 0, title, {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#ffebb0"
    });
    group.add(sectionTitle);

    const rows = [];
    const rowHeight = 28;
    options.forEach((option, index) => {
      const rowY = 34 + index * (rowHeight + 8);
      const rowBg = this.add.rectangle(0, rowY, width, rowHeight, 0x233850, 0.7).setOrigin(0, 0);
      rowBg.setStrokeStyle(1, 0x7fb8ff, 0.8);
      rowBg.setInteractive({ useHandCursor: true });
      const outerCircle = this.add.circle(16, rowY + rowHeight * 0.5, 8, 0x0c1522, 1);
      outerCircle.setStrokeStyle(2, 0x8fc7ff, 1);
      const innerCircle = this.add.circle(16, rowY + rowHeight * 0.5, 4, 0x75ffd4, 1);
      const rowLabel = this.add.text(32, rowY + 5, option.label, {
        fontFamily: "Consolas",
        fontSize: "15px",
        color: "#e7f4ff"
      });

      rowBg.on("pointerdown", () => onChange(option.value));
      rowBg.on("pointerover", () => {
        if (getValue() !== option.value) rowBg.setFillStyle(0x2f4d6a, 0.86);
      });
      rowBg.on("pointerout", () => {
        if (getValue() !== option.value) rowBg.setFillStyle(0x233850, 0.7);
      });

      group.add([rowBg, outerCircle, innerCircle, rowLabel]);
      rows.push({ option, rowBg, innerCircle, rowLabel });
    });

    const refresh = () => {
      const current = getValue();
      rows.forEach(({ option, rowBg, innerCircle, rowLabel }) => {
        const selected = option.value === current;
        innerCircle.setVisible(selected);
        rowBg.setFillStyle(selected ? 0x365b7d : 0x233850, selected ? 0.96 : 0.7);
        rowLabel.setColor(selected ? "#ffffff" : "#e7f4ff");
      });
    };

    refresh();
    return { group, refresh };
  }

  refreshSettingsPanel() {
    this.audioText.setText(`Âm thanh mặc định: ${this.settings.audioEnabled ? "Bật" : "Tắt"}`);
    this.aiText.setText(`Độ khó AI mặc định: ${AI_LABELS[this.settings.aiMode]}`);
    this.volumeText?.setText(`Âm lượng: ${this.settings.volumeLevel ?? 10}/10`);
    this.audioFx?.setEnabled(this.settings.audioEnabled !== false);
    this.audioFx?.setVolumeLevel(this.settings.volumeLevel ?? 10);
  }

  refreshStartPanel() {
    if (!this.startInfoText) return;
    const modeLabel = this.selectedMode === "PVE_JOURNEY" ? "Hành trình PvE theo vòng" : "PvE Sandbox";
    const modeDesc =
      this.selectedMode === "PVE_JOURNEY"
        ? "Mỗi vòng xuất hiện đội hình địch đã xếp sẵn, bạn sắp quân để khắc chế."
        : "Tập dượt đội hình nhanh, tập trung thử đội và kỹ năng.";
    this.startInfoText.setText(
      [
        `Chế độ: ${modeLabel}`,
        `Độ khó AI: ${AI_LABELS[this.settings.aiMode]}`,
        "",
        modeDesc
      ].join("\n")
    );
    this.modeRadioGroup?.refresh();
    this.difficultyRadioGroup?.refresh();
  }

  flashStatus(message) {
    if (!this.statusText) return;
    this.statusText.setText(message);
    this.tweens.add({
      targets: this.statusText,
      alpha: 0,
      duration: 1600,
      ease: "Cubic.easeIn",
      onStart: () => this.statusText.setAlpha(1),
      onComplete: () => this.statusText.setText("")
    });
  }
}
