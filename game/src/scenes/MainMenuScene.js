import Phaser from "phaser"; // Updated Encyclopedia
import { AudioFx } from "../core/audioFx.js";
import { clearProgress, loadProgress } from "../core/persistence.js";
import { queueSharedAssets } from "../core/sharedAssetLoader.js";
import {
  RESOLUTION_PRESETS,
  createDefaultUiSettings,
  guiScaleToZoom,
  loadUiSettings,
  normalizeResolutionKey,
  resolveResolution,
  saveUiSettings
} from "../core/uiSettings.js";
import { hydrateRunState } from "../core/runState.js";
import { getLoseConditionLabel, normalizeLoseCondition } from "../core/gameRules.js";
import { CRAFT_RECIPES, ITEM_BY_ID } from "../data/items.js";
import { LibraryModal } from "../ui/LibraryModal.js";
import GameModeRegistry from "../gameModes/GameModeRegistry.js";
import { getAvailableLocales, getLocaleLabel } from "../i18n/index.js";

const AI_LABELS = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó"
};

const APP_VERSION = "0.3.3";
const APP_VERSION_DATE = "25/02/2026";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
    this.settings = createDefaultUiSettings();
    this.statusText = null;
    this.selectedMode = "EndlessPvEClassic";
    this.startPanel = null;
    this.startInfoText = null;
    this.modeRadioGroup = null;
    this.difficultyRadioGroup = null;
    this.continueButton = null;
    this.savedRun = null;
    this._craftRecipes = null;
  }

  preload() {
    queueSharedAssets(this);
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
    this.libraryModal = new LibraryModal(this, { title: "Thư Viện Linh Thú" });

    const w = this.scale.width;
    const h = this.scale.height;
    this.add.text(24, h - 18, `Thời gian cập nhật: ${APP_VERSION_DATE}\nBản cập nhật: v${APP_VERSION}`, {
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
      if (this.libraryModal?.isOpen()) {
        this.libraryModal.scrollBy(deltaY);
      }
    });
    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.libraryModal?.isOpen()) this.libraryModal.hide();
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
      clearProgress();
      this.savedRun = null;
      this.refreshMainButtons();

      this.startPanel.setVisible(!this.startPanel.visible);
    }, 0x2f8f6f, 0x8bffd7);

    this.createButton(w * 0.5, startY + 140, 320, 50, "Cài đặt", () => {
      this.settingsPanel.setVisible(!this.settingsPanel.visible);
    }, 0x284b78, 0x9cd0ff);

    this.createButton(w * 0.5, startY + 206, 320, 50, "Thư Viện", () => {
      this.startPanel?.setVisible(false);
      this.settingsPanel?.setVisible(false);
      this.libraryModal.toggle();
    }, 0x2e5f7d, 0x9ed8ff);

    this.createButton(w * 0.5, startY + 272, 320, 50, "Xóa tiến trình lưu", () => {
      clearProgress();
      this.savedRun = null;
      this.refreshMainButtons();
      this.flashStatus("Đã xóa dữ liệu ván chơi.");
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
    const panelHeight = 400;
    const panel = this.add.container(w * 0.5, h * 0.72); // Move up slightly so it doesn't get clipped
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

    // Get available game modes from registry
    const availableModes = GameModeRegistry.getAll();
    const modeOptions = availableModes.map(mode => ({
      value: mode.id,
      label: mode.name,
      disabled: false
    }));

    // Add placeholder for future modes if no modes registered
    if (modeOptions.length === 0) {
      modeOptions.push(
        { value: "EndlessPvEClassic", label: "PvE Vô tận" },
        { value: "PVE_SANDBOX", label: "PvE Sandbox (Khóa)", disabled: true }
      );
    }

    this.modeRadioGroup = this.createRadioGroup({
      parent: panel,
      x: rightX,
      y: topY + 12,
      width: rightWidth,
      title: "Chế độ",
      options: modeOptions,
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
      y: topY + 170,
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

    const actionY = panelHeight * 0.5 - 35;
    this.createButton(-102, actionY, 220, 50, "Vào game", () => {
      clearProgress();
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

    const bg = this.add.rectangle(0, 0, 560, 440, 0x101a2a, 0.96);
    bg.setStrokeStyle(2, 0x7fb8ff, 1);
    panel.add(bg);

    const title = this.add.text(-258, -180, "Cài đặt", {
      fontFamily: "Consolas",
      fontSize: "24px",
      color: "#ffeab0"
    });
    panel.add(title);

    this.audioText = this.add.text(-248, -126, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.audioText);

    this.aiText = this.add.text(-248, -72, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.aiText);

    this.volumeText = this.add.text(-248, -18, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.volumeText);

    this.resolutionText = this.add.text(-248, 36, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.resolutionText);

    this.languageText = this.add.text(-248, 90, "", {
      fontFamily: "Consolas",
      fontSize: "19px",
      color: "#e7f3ff"
    });
    panel.add(this.languageText);

    const audioBtn = this.createButton(170, -116, 160, 40, "Đổi", () => {
      this.settings.audioEnabled = !this.settings.audioEnabled;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    const aiBtn = this.createButton(170, -62, 160, 40, "Đổi", () => {
      const order = ["EASY", "MEDIUM", "HARD"];
      const idx = order.indexOf(this.settings.aiMode);
      this.settings.aiMode = order[(idx + 1) % order.length];
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    const volumeBtn = this.createButton(170, -8, 160, 40, "Tăng", () => {
      const current = Number.isFinite(this.settings.volumeLevel) ? this.settings.volumeLevel : 10;
      const next = Math.min(10, current + 1);
      if (next === current) return;
      this.settings.volumeLevel = next;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);

    this.createButton(52, -8, 56, 40, "-", () => {
      const current = Number.isFinite(this.settings.volumeLevel) ? this.settings.volumeLevel : 10;
      const next = Math.max(1, current - 1);
      if (next === current) return;
      this.settings.volumeLevel = next;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
    }, 0x284b78, 0x9cd0ff, panel);
    const resolutionBtn = this.createButton(170, 46, 160, 40, "Đổi", () => {
      const currentKey = normalizeResolutionKey(this.settings.resolutionKey);
      const idx = RESOLUTION_PRESETS.findIndex((preset) => preset.key === currentKey);
      const next = RESOLUTION_PRESETS[(idx + 1) % RESOLUTION_PRESETS.length];
      this.settings.resolutionKey = next.key;
      saveUiSettings(this.settings);
      this.refreshSettingsPanel();
      this.applyDisplaySettings(this.settings);
      this.scene.restart();
    }, 0x284b78, 0x9cd0ff, panel);
    this.createButton(170, 100, 160, 40, "Đổi", () => {
      const locales = getAvailableLocales();
      const idx = locales.indexOf(this.settings.language ?? "vi");
      this.settings.language = locales[(idx + 1) % locales.length];
      saveUiSettings(this.settings);
      this.scene.restart();
    }, 0x284b78, 0x9cd0ff, panel);
    this.createButton(0, 184, 170, 42, "Đóng", () => {
      panel.setVisible(false);
    }, 0x3b4e66, 0xb6d3ff, panel);

    this.settingsPanel = panel;
    this.refreshSettingsPanel();
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
    this.languageText?.setText(`Ngôn ngữ: ${getLocaleLabel(this.settings.language ?? "vi")}`);
    this.audioFx?.setEnabled(this.settings.audioEnabled !== false);
    this.audioFx?.setVolumeLevel(this.settings.volumeLevel ?? 10);
  }

  applyDisplaySettings(settings) {
    const resolution = resolveResolution(settings?.resolutionKey);
    if (resolution) {
      this.scale.resize(resolution.width, resolution.height);
    }
    // Force Scale.FIT to recalculate viewport↔game coordinate transform
    this.scale.refresh();
    const zoom = guiScaleToZoom(settings?.guiScale);
    this.cameras.main.setZoom(zoom);
  }

  refreshStartPanel() {
    if (!this.startInfoText) return;

    // Get mode config from registry
    const modeConfig = GameModeRegistry.get(this.selectedMode);
    const modeLabel = modeConfig ? modeConfig.name : (this.selectedMode === "EndlessPvEClassic" ? "PvE Vô tận" : "PvE Sandbox");
    const modeDesc = modeConfig ? modeConfig.description : (
      this.selectedMode === "EndlessPvEClassic"
        ? "Thua khi quân ta chết hết. Mỗi vòng xuất hiện đội hình địch đã xếp sẵn, bạn sắp quân để khắc chế."
        : "Tập dượt đội hình nhanh, tập trung thử đội và kỹ năng."
    );

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
