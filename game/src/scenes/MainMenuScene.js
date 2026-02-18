import Phaser from "phaser";
import { AudioFx } from "../core/audioFx.js";
import { clearAllLocalStorage, loadProgress } from "../core/persistence.js";
import {
  RESOLUTION_PRESETS,
  createDefaultUiSettings,
  guiScaleToZoom,
  loadUiSettings,
  normalizeGuiScale,
  normalizeResolutionKey,
  resolveResolution,
  saveUiSettings
} from "../core/uiSettings.js";
import { FOREST_BACKGROUND_ASSETS } from "../data/forestBackgrounds.js";
import { hydrateRunState } from "../core/runState.js";
import { getLoseConditionLabel, normalizeLoseCondition } from "../core/gameRules.js";
import { UNIT_CATALOG } from "../data/unitCatalog.js";
import { SKILL_LIBRARY } from "../data/skills.js";
import { getClassLabelVi, getTribeLabelVi, getUnitVisual } from "../data/unitVisuals.js";
import { CRAFT_RECIPES, ITEM_BY_ID } from "../data/items.js";

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
    this._wikiTab = "units";
    this._wikiDetailUnit = null;
    this._craftRecipes = null;
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

    // Load nature playlist
    for (let i = 1; i <= 5; i++) {
      this.load.audio(`bgm_nature_${i}`, `assets/audio/nature_${i}.mp3`);
    }
    this.load.audio("bgm_warrior", "assets/audio/warrior.mp3");
    this.load.audio("bgm_gunny", "assets/audio/gunny.mp3");

    FOREST_BACKGROUND_ASSETS.forEach((asset) => {
      if (!this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.path);
      }
    });
  }

  create() {
    this.settings = loadUiSettings();
    this.applyDisplaySettings(this.settings);
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
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.text(24, h - 18, "Thời gian cập nhật: 18/02/2026\nBản cập nhật: v0.1.0", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#a9c6ff",
      lineSpacing: 4
    }).setOrigin(0, 1);
    this.add.text(w - 24, h - 18, "DevGOVietnam\nTác giả: Lương Quốc Thái (TPHCM)", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#a9c6ff",
      lineSpacing: 4,
      align: "right"
    }).setOrigin(1, 1);
    // Inject recipe data with full item lookups (base + equipment)
    this._craftRecipes = CRAFT_RECIPES.map((r) => ({
      ...r,
      _requiredLabel: (r.requires ?? [])
        .map((id) => ITEM_BY_ID[id] ?? { icon: "?", name: id })
        .map((item) => `${item.icon} ${item.name}`)
        .join(" + ")
    })).sort((a, b) => (a.tier ?? 1) - (b.tier ?? 1));
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
      clearAllLocalStorage();
      this.savedRun = null;
      this.refreshMainButtons();
      this.startPanel.setVisible(!this.startPanel.visible);
    }, 0x2f8f6f, 0x8bffd7);

    this.createButton(w * 0.5, startY + 140, 320, 50, "Cài đặt", () => {
      this.settingsPanel.setVisible(!this.settingsPanel.visible);
    }, 0x284b78, 0x9cd0ff);

    this.createButton(w * 0.5, startY + 206, 320, 50, "Thư viện", () => {
      this.toggleWikiPanel();
    }, 0x2e5f7d, 0x9ed8ff);

    this.createButton(w * 0.5, startY + 272, 320, 50, "Xóa tiến trình lưu", () => {
      clearAllLocalStorage();
      this.savedRun = null;
      this.refreshMainButtons();
      this.flashStatus("Đã xóa toàn bộ localStorage.");
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
        { value: "PVE_JOURNEY", label: "PvE Vô tận" },
        { value: "PVE_SANDBOX", label: "PvE Sandbox (Khóa)", disabled: true }
      ],
      getValue: () => this.selectedMode,
      onChange: (value, option) => {
        if (option?.disabled) return;
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
      clearAllLocalStorage();
      this.savedRun = null;
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

    const bg = this.add.rectangle(0, 0, 560, 380, 0x101a2a, 0.96);
    bg.setStrokeStyle(2, 0x7fb8ff, 1);
    panel.add(bg);

    const title = this.add.text(-258, -150, "Cài đặt", {
      fontFamily: "Consolas",
      fontSize: "24px",
      color: "#ffeab0"
    });
    panel.add(title);

    this.audioText = this.add.text(-248, -96, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.audioText);

    this.aiText = this.add.text(-248, -42, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.aiText);

    this.volumeText = this.add.text(-248, 12, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.volumeText);

    this.resolutionText = this.add.text(-248, 66, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.resolutionText);

    this.guiScaleText = this.add.text(-248, 120, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.guiScaleText);

    const audioBtn = this.createButton(170, -86, 160, 40, "Đổi", () => {
      this.settings.audioEnabled = !this.settings.audioEnabled;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    const aiBtn = this.createButton(170, -32, 160, 40, "Đổi", () => {
      const order = ["EASY", "MEDIUM", "HARD"];
      const idx = order.indexOf(this.settings.aiMode);
      this.settings.aiMode = order[(idx + 1) % order.length];
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    const volumeBtn = this.createButton(170, 22, 160, 40, "Tăng", () => {
      const current = Number.isFinite(this.settings.volumeLevel) ? this.settings.volumeLevel : 10;
      this.settings.volumeLevel = current >= 10 ? 1 : current + 1;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    const resolutionBtn = this.createButton(170, 76, 160, 40, "Đổi", () => {
      const currentKey = normalizeResolutionKey(this.settings.resolutionKey);
      const idx = RESOLUTION_PRESETS.findIndex((preset) => preset.key === currentKey);
      const next = RESOLUTION_PRESETS[(idx + 1) % RESOLUTION_PRESETS.length];
      this.settings.resolutionKey = next.key;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
      this.applyDisplaySettings(this.settings);
      this.scene.restart();
    }, 0x284b78, 0x9cd0ff, panel);

    const guiBtn = this.createButton(170, 130, 160, 40, "Tăng", () => {
      const current = normalizeGuiScale(this.settings.guiScale);
      this.settings.guiScale = current >= 5 ? 1 : current + 1;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
      this.applyDisplaySettings(this.settings);
      this.scene.restart();
    }, 0x284b78, 0x9cd0ff, panel);

    this.createButton(0, 174, 170, 42, "Đóng", () => {
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

    const title = this.add.text(-panelWidth * 0.5 + 28, -panelHeight * 0.5 + 22, "Thư viện", {
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

  refreshWikiPanel(tab = null) {
    if (!this.wikiContent || !this.wikiViewport) return;
    this.wikiContent.removeAll(true);
    this.wikiScrollY = 0;
    this.wikiContent.y = this.wikiContentBaseY;

    // Tab state
    if (tab !== null) this._wikiTab = tab;
    if (!this._wikiTab) this._wikiTab = "units";
    if (!this._wikiDetailUnit) this._wikiDetailUnit = null;

    const vw = this.wikiViewport.width;

    // --- Tab bar ---
    const tabDefs = [
      { key: "units", label: "🐾 LINH THÚ" },
      { key: "recipes", label: "⚗️ CÔNG THỨC" }
    ];
    let tabY = 0;
    tabDefs.forEach((td, i) => {
      const active = this._wikiTab === td.key;
      const tabW = 180;
      const tabX = i * (tabW + 8);
      const tabBg = this.add.rectangle(tabX, tabY, tabW, 32, active ? 0x2a5080 : 0x1a2d40, active ? 1 : 0.8).setOrigin(0, 0);
      tabBg.setStrokeStyle(1, active ? 0x7ab8f5 : 0x3a5070, 1);
      tabBg.setInteractive({ useHandCursor: true });
      tabBg.on("pointerdown", () => {
        this._wikiDetailUnit = null;
        this.refreshWikiPanel(td.key);
      });
      const tabLabel = this.add.text(tabX + tabW / 2, tabY + 16, td.label, {
        fontFamily: "Consolas", fontSize: "14px",
        color: active ? "#ffeab0" : "#8ab4d4"
      }).setOrigin(0.5);
      this.wikiContent.add([tabBg, tabLabel]);
    });
    tabY += 40;

    // ---- UNIT DETAIL VIEW ----
    if (this._wikiDetailUnit) {
      const unit = this._wikiDetailUnit;
      const visual = getUnitVisual(unit.id, unit.classType);
      const skill = SKILL_LIBRARY?.[unit.skillId];

      const backBtn = this.add.text(0, tabY, "← Quay lại", {
        fontFamily: "Consolas", fontSize: "15px", color: "#7ab8f5"
      }).setInteractive({ useHandCursor: true });
      backBtn.on("pointerdown", () => { this._wikiDetailUnit = null; this.refreshWikiPanel(); });
      this.wikiContent.add(backBtn);
      tabY += 30;

      const detailBg = this.add.rectangle(0, tabY, vw - 14, 320, 0x0f1e30, 0.95).setOrigin(0, 0);
      detailBg.setStrokeStyle(1, 0x5a8ab0, 0.8);
      this.wikiContent.add(detailBg);

      const nameText = this.add.text(16, tabY + 14, `${visual.icon}  ${visual.nameVi}`, {
        fontFamily: "Consolas", fontSize: "26px", color: "#ffeab0", fontStyle: "bold"
      });
      this.wikiContent.add(nameText);

      const tierText = this.add.text(vw - 30, tabY + 14, `Bậc ${unit.tier}`, {
        fontFamily: "Consolas", fontSize: "18px", color: "#8df2ff"
      }).setOrigin(1, 0);
      this.wikiContent.add(tierText);

      const metaText = this.add.text(16, tabY + 50, [
        `Tộc: ${getTribeLabelVi(unit.tribe)}   Nghề: ${getClassLabelVi(unit.classType)}`,
        `HP: ${unit.hp ?? "?"}   ATK: ${unit.atk ?? "?"}   DEF: ${unit.def ?? "?"}   SPD: ${unit.spd ?? "?"}`,
        `Tầm đánh: ${unit.range ?? 1}   Né tránh: ${unit.evasion ?? 0}%`
      ].join("\n"), {
        fontFamily: "Consolas", fontSize: "15px", color: "#c0ddf5", lineSpacing: 6
      });
      this.wikiContent.add(metaText);

      const skillTitle = this.add.text(16, tabY + 130, "⚡ KỸ NĂNG:", {
        fontFamily: "Consolas", fontSize: "16px", color: "#ffd580", fontStyle: "bold"
      });
      this.wikiContent.add(skillTitle);

      const skillName = this.add.text(16, tabY + 154, skill?.name ?? unit.skillId, {
        fontFamily: "Consolas", fontSize: "18px", color: "#8df2ff", fontStyle: "bold"
      });
      this.wikiContent.add(skillName);

      const skillDesc = this.add.text(16, tabY + 180, skill?.descriptionVi ?? skill?.description ?? "Chưa có mô tả.", {
        fontFamily: "Consolas", fontSize: "14px", color: "#d0eaff", lineSpacing: 5,
        wordWrap: { width: vw - 44 }
      });
      this.wikiContent.add(skillDesc);

      const atkPatternY = tabY + 180 + skillDesc.height + 16;
      const atkTitle = this.add.text(16, atkPatternY, "⚔️ ĐÁNH THƯỜNG:", {
        fontFamily: "Consolas", fontSize: "16px", color: "#ffd580", fontStyle: "bold"
      });
      this.wikiContent.add(atkTitle);

      const rangeLabel = unit.range >= 3 ? "Tầm xa (3+)" : unit.range >= 2 ? "Tầm trung (2)" : "Cận chiến (1)";
      const atkDesc = this.add.text(16, atkPatternY + 24, `${rangeLabel} • Mỗi lượt tấn công 1 mục tiêu gần nhất của phe địch.`, {
        fontFamily: "Consolas", fontSize: "14px", color: "#d0eaff", lineSpacing: 4,
        wordWrap: { width: vw - 44 }
      });
      this.wikiContent.add(atkDesc);

      tabY += 340;
      this.wikiScrollMax = Math.max(0, tabY - (this.wikiViewport.height - 12));
      return;
    }

    // ---- UNITS TAB ----
    if (this._wikiTab === "units") {
      const units = [...UNIT_CATALOG].sort((a, b) => a.tier - b.tier || a.classType.localeCompare(b.classType) || a.name.localeCompare(b.name));
      const classCount = {};
      const tribeCount = {};
      units.forEach((unit) => {
        classCount[unit.classType] = (classCount[unit.classType] ?? 0) + 1;
        tribeCount[unit.tribe] = (tribeCount[unit.tribe] ?? 0) + 1;
      });
      const maxSummaryItems = 4;
      const classSummaryArr = Object.entries(classCount).sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([code, count]) => `${getClassLabelVi(code)}: ${count}`);
      const classSummary = classSummaryArr.length > maxSummaryItems ? classSummaryArr.slice(0, maxSummaryItems).join(" • ") + ` (+${classSummaryArr.length - maxSummaryItems})` : classSummaryArr.join(" • ");
      const tribeSummaryArr = Object.entries(tribeCount).sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([code, count]) => `${getTribeLabelVi(code)}: ${count}`);
      const tribeSummary = tribeSummaryArr.length > maxSummaryItems ? tribeSummaryArr.slice(0, maxSummaryItems).join(" • ") + ` (+${tribeSummaryArr.length - maxSummaryItems})` : tribeSummaryArr.join(" • ");

      const intro = this.add.text(0, tabY, `Tổng thú: ${units.length}\nTheo nghề: ${classSummary}\nTheo tộc: ${tribeSummary}`, {
        fontFamily: "Consolas", fontSize: "15px", color: "#d8edff", lineSpacing: 5, wordWrap: { width: vw - 22 }
      });
      this.wikiContent.add(intro);
      tabY += intro.height + 10;

      const sectionTitle = this.add.text(0, tabY, "Danh sách thú hiện tại  (click để xem chi tiết)", {
        fontFamily: "Consolas", fontSize: "17px", color: "#ffeab0"
      });
      this.wikiContent.add(sectionTitle);
      tabY += sectionTitle.height + 10;

      const columns = vw > 820 ? 2 : 1;
      const gap = 12;
      const cardW = Math.floor((vw - 14 - gap * (columns - 1)) / columns);
      const cardH = columns === 2 ? 92 : 100;
      const skillNameMax = columns === 2 ? 26 : 34;

      units.forEach((unit, idx) => {
        const visual = getUnitVisual(unit.id, unit.classType);
        const skillNameRaw = SKILL_LIBRARY?.[unit.skillId]?.name ?? unit.skillId;
        const skillName = skillNameRaw.length > skillNameMax ? `${skillNameRaw.slice(0, skillNameMax - 1)}…` : skillNameRaw;
        const col = idx % columns;
        const row = Math.floor(idx / columns);
        const cardX = col * (cardW + gap);
        const cardY = tabY + row * (cardH + 8);
        const bg = this.add.rectangle(cardX, cardY, cardW, cardH, idx % 2 === 0 ? 0x182b44 : 0x16273f, 0.88).setOrigin(0, 0);
        bg.setStrokeStyle(1, 0x7ab8f5, 0.45);
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerover", () => bg.setStrokeStyle(1, 0xffeab0, 0.9));
        bg.on("pointerout", () => bg.setStrokeStyle(1, 0x7ab8f5, 0.45));
        bg.on("pointerdown", () => { this._wikiDetailUnit = unit; this.refreshWikiPanel(); });
        const label = this.add.text(cardX + 10, cardY + 8,
          `${String(idx + 1).padStart(2, "0")}  ${visual.icon} ${visual.nameVi}\nBậc ${unit.tier} • ${getTribeLabelVi(unit.tribe)} • ${getClassLabelVi(unit.classType)}\nKỹ năng: ${skillName}`,
          { fontFamily: "Consolas", fontSize: "15px", color: "#d7ecff", lineSpacing: 4, wordWrap: { width: cardW - 20 } }
        );
        this.wikiContent.add([bg, label]);
      });

      const totalRows = Math.ceil(units.length / columns);
      tabY += totalRows * (cardH + 8);
    }

    // ---- RECIPES TAB ----
    if (this._wikiTab === "recipes") {
      const recipeTitle = this.add.text(0, tabY, "Công thức chế tạo trang bị", {
        fontFamily: "Consolas", fontSize: "20px", color: "#ffeab0"
      });
      this.wikiContent.add(recipeTitle);
      tabY += recipeTitle.height + 8;

      const hint = this.add.text(0, tabY, "Công thức có nhiều bậc. Bậc 2 dùng 3 nguyên liệu (có ít nhất 1 đồ đã ghép); bậc 4 dùng 4 nguyên liệu.", {
        fontFamily: "Consolas", fontSize: "14px", color: "#9ec4e8", wordWrap: { width: vw - 14 }
      });
      this.wikiContent.add(hint);
      tabY += hint.height + 12;

      const recipes = this._craftRecipes ?? [];
      const rcols = vw > 700 ? 2 : 1;
      const rgap = 12;
      const rcardW = Math.floor((vw - 14 - rgap * (rcols - 1)) / rcols);
      const rcardH = 108;

      recipes.forEach((recipe, idx) => {
        const col = idx % rcols;
        const row = Math.floor(idx / rcols);
        const cardX = col * (rcardW + rgap);
        const cardY = tabY + row * (rcardH + 8);
        const bg = this.add.rectangle(cardX, cardY, rcardW, rcardH, idx % 2 === 0 ? 0x1a2e44 : 0x162840, 0.9).setOrigin(0, 0);
        bg.setStrokeStyle(1, 0x5a8ab0, 0.5);
        const tierText = `Bậc ${recipe.tier ?? 1}`;
        const label = this.add.text(cardX + 10, cardY + 8,
          `${recipe.icon} ${recipe.name}  •  ${tierText}\nNguyên liệu: ${recipe._requiredLabel || "?"}\n${recipe.description}`,
          { fontFamily: "Consolas", fontSize: "13px", color: "#d7ecff", lineSpacing: 3, wordWrap: { width: rcardW - 20 } }
        );
        this.wikiContent.add([bg, label]);
      });

      const totalRRows = Math.ceil(recipes.length / rcols);
      tabY += totalRRows * (rcardH + 8);
    }

    this.wikiScrollY = 0;
    this.wikiScrollMax = Math.max(0, tabY - (this.wikiViewport.height - 12));
    this.wikiContent.y = this.wikiContentBaseY;
    if (this.wikiScrollHint) {
      this.wikiScrollHint.setText(`Lăn chuột để cuộn • ESC hoặc Đóng để thoát`);
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

      rowBg.on("pointerdown", () => onChange(option.value, option));
      rowBg.on("pointerover", () => {
        if (option.disabled) return;
        if (getValue() !== option.value) rowBg.setFillStyle(0x2f4d6a, 0.86);
      });
      rowBg.on("pointerout", () => {
        if (option.disabled) return;
        if (getValue() !== option.value) rowBg.setFillStyle(0x233850, 0.7);
      });

      group.add([rowBg, outerCircle, innerCircle, rowLabel]);
      rows.push({ option, rowBg, innerCircle, rowLabel });
    });

    const refresh = () => {
      const current = getValue();
      rows.forEach(({ option, rowBg, innerCircle, rowLabel }) => {
        const selected = option.value === current;
        innerCircle.setVisible(selected && !option.disabled);
        if (option.disabled) {
          rowBg.setFillStyle(0x1a2533, 0.6);
          rowBg.setStrokeStyle(1, 0x4a5d73, 0.5);
          rowLabel.setColor("#7f8c9d");
        } else {
          rowBg.setFillStyle(selected ? 0x365b7d : 0x233850, selected ? 0.96 : 0.7);
          rowLabel.setColor(selected ? "#ffffff" : "#e7f4ff");
        }
      });
    };

    refresh();
    return { group, refresh };
  }

  refreshSettingsPanel() {
    this.audioText.setText(`Âm thanh mặc định: ${this.settings.audioEnabled ? "Bật" : "Tắt"}`);
    this.aiText.setText(`Độ khó AI mặc định: ${AI_LABELS[this.settings.aiMode]}`);
    this.volumeText?.setText(`Âm lượng: ${this.settings.volumeLevel ?? 10}/10`);
    const resolution = resolveResolution(this.settings.resolutionKey);
    this.resolutionText?.setText(`Độ phân giải: ${resolution.label ?? `${resolution.width}x${resolution.height}`}`);
    const guiScale = normalizeGuiScale(this.settings.guiScale);
    this.guiScaleText?.setText(`Kích thước GUI: ${guiScale}/5`);
    this.audioFx?.setEnabled(this.settings.audioEnabled !== false);
    this.audioFx?.setVolumeLevel(this.settings.volumeLevel ?? 10);
  }

  applyDisplaySettings(settings) {
    const resolution = resolveResolution(settings?.resolutionKey);
    if (resolution) {
      this.scale.resize(resolution.width, resolution.height);
    }
    const zoom = guiScaleToZoom(settings?.guiScale);
    this.cameras.main.setZoom(zoom);
  }

  refreshStartPanel() {
    if (!this.startInfoText) return;
    const modeLabel = this.selectedMode === "PVE_JOURNEY" ? "PvE Vô tận" : "PvE Sandbox";
    const modeDesc =
      this.selectedMode === "PVE_JOURNEY"
        ? "Thua khi quân ta chết hết. Mỗi vòng xuất hiện đội hình địch đã xếp sẵn, bạn sắp quân để khắc chế."
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
