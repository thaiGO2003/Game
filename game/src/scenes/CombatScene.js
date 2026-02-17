import Phaser from "phaser";
import { UNIT_CATALOG, UNIT_BY_ID } from "../data/unitCatalog.js";
import { SKILL_LIBRARY } from "../data/skills.js";
import { AUGMENT_LIBRARY, AUGMENT_ROUNDS } from "../data/augments.js";
import { CLASS_SYNERGY, TRIBE_SYNERGY } from "../data/synergies.js";
import { getForestBackgroundKeyByRound } from "../data/forestBackgrounds.js";
import { getClassLabelVi, getTribeLabelVi, getUnitVisual } from "../data/unitVisuals.js";
import { TooltipController } from "../core/tooltip.js";
import { AudioFx } from "../core/audioFx.js";
import { VfxController } from "../core/vfx.js";
import { saveUiSettings } from "../core/uiSettings.js";
import { hydrateRunState } from "../core/runState.js";
import {
  clamp,
  createUnitUid,
  getDeployCapByLevel,
  getXpToLevelUp,
  gridKey,
  manhattan,
  randomItem,
  rollTierForLevel,
  sampleWithoutReplacement,
  scaledBaseStats
} from "../core/gameUtils.js";

const TILE_W = 98;
const TILE_H = 50;
const ROWS = 5;
const COLS = 10;
const PLAYER_COLS = 5;
const RIGHT_COL_START = 5;
const RIGHT_COL_END = 9;
const BOARD_GAP_COLS = 1;
const BOARD_FILES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const PHASE = {
  PLANNING: "PLANNING",
  AUGMENT: "AUGMENT",
  COMBAT: "COMBAT",
  GAME_OVER: "GAME_OVER"
};

const AI_SETTINGS = {
  EASY: {
    label: "Dễ",
    hpMult: 0.9,
    atkMult: 0.88,
    matkMult: 0.88,
    rageGain: 1,
    randomTargetChance: 0.45,
    teamSizeBonus: -1
  },
  MEDIUM: {
    label: "Trung bình",
    hpMult: 1,
    atkMult: 1,
    matkMult: 1,
    rageGain: 1,
    randomTargetChance: 0.15,
    teamSizeBonus: 0
  },
  HARD: {
    label: "Khó",
    hpMult: 1.2,
    atkMult: 1.14,
    matkMult: 1.14,
    rageGain: 2,
    randomTargetChance: 0.02,
    teamSizeBonus: 1
  }
};

const CLASS_COLORS = {
  TANKER: 0x5f86d9,
  ASSASSIN: 0x7b59b5,
  ARCHER: 0x5ca65b,
  MAGE: 0x4f95f2,
  SUPPORT: 0xd2b35e,
  FIGHTER: 0xb86a44
};

const ROLE_THEME = {
  TANKER: { fill: 0x5f86d9, glow: 0x9ec6ff, stroke: 0xc2ddff, card: 0x1a2d4c, cardHover: 0x24406a, bench: 0x213655 },
  ASSASSIN: { fill: 0x7b59b5, glow: 0xbf9af5, stroke: 0xdcc9ff, card: 0x2a2146, cardHover: 0x3a2d60, bench: 0x352a54 },
  ARCHER: { fill: 0x5ca65b, glow: 0x9fe3a0, stroke: 0xc9f0c6, card: 0x1f3a2a, cardHover: 0x295039, bench: 0x2a4533 },
  MAGE: { fill: 0x4f95f2, glow: 0xaed9ff, stroke: 0xd3ecff, card: 0x18365a, cardHover: 0x23507d, bench: 0x1f4670 },
  SUPPORT: { fill: 0xd2b35e, glow: 0xf0dc9a, stroke: 0xfff0bd, card: 0x4a3b21, cardHover: 0x654f2d, bench: 0x5a4928 },
  FIGHTER: { fill: 0xb86a44, glow: 0xe4a07b, stroke: 0xffcaad, card: 0x44281d, cardHover: 0x61382a, bench: 0x553427 }
};

const LEVEL_LABEL = { EASY: "Dễ", MEDIUM: "TB", HARD: "Khó" };

const UI_FONT = "Segoe UI";

const UI_SPACING = {
  XS: 8,
  SM: 16,
  LG: 24
};

const UI_COLORS = {
  screenOverlay: 0x060d17,
  panel: 0x0e1828,
  panelSoft: 0x111f32,
  panelEdge: 0x5aa8c8,
  panelEdgeSoft: 0x39576f,
  accent: 0x8de8ff,
  cta: 0xbdcf47,
  ctaHover: 0xd4e665,
  ctaEdge: 0xf2ff9a,
  textPrimary: "#e9f5ff",
  textSecondary: "#a6bed3",
  textMuted: "#7f94a7",
  boardLeft: 0x133627,
  boardLeftEdge: 0x4cc99b,
  boardRight: 0x3d2523,
  boardRightEdge: 0xd08a7f,
  grassA: 0x6eaf4d,
  grassB: 0x5a973f,
  grassEdgeA: 0xa2d56f,
  grassEdgeB: 0x84be5a,
  grassHighlight: 0xd9f2b4,
  riverA: 0x1f8fe0,
  riverB: 0x176eb7,
  riverEdgeA: 0x8fddff,
  riverEdgeB: 0x6ec7f1,
  riverHighlight: 0xd9f6ff
};

const HISTORY_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "COMBAT", label: "Giao tranh" },
  { key: "SHOP", label: "Mua sắm" },
  { key: "CRAFT", label: "Ghép đồ" },
  { key: "EVENT", label: "Sự kiện" }
];

export class CombatScene extends Phaser.Scene {
  constructor() {
    super("CombatScene");
    this.phase = PHASE.PLANNING;
    this.aiMode = "MEDIUM";
    this.tileLookup = new Map();
    this.playerCellZones = [];
    this.buttons = {};
    this.benchSlots = [];
    this.shopCards = [];
    this.planningSprites = [];
    this.combatSprites = [];
    this.overlaySprites = [];
    this.logs = [];
    this.selectedBenchIndex = null;
    this.turnQueue = [];
    this.turnIndex = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.runStatePayload = null;
    this.layout = null;
    this.settingsVisible = false;
    this.settingsOverlay = [];
    this.roundBackgroundImage = null;
    this.roundBackgroundMask = null;
    this.roundBackgroundKey = null;
    this.logHistory = [];
    this.historyFilter = "ALL";
    this.historyModalVisible = false;
    this.historyModalParts = [];
    this.historyFilterButtons = [];
    this.historyListItems = [];
    this.historyScrollOffset = 0;
    this.historyMaxScroll = 0;
    this.historyListViewport = null;
    this.historyButtonRect = null;
    this.attackPreviewLayer = null;
    this.attackPreviewSword = null;
    this.previewHoverUnit = null;
    this.rightPanelArea = null;
    this.rightPanelMask = null;
    this.rightPanelMaskShape = null;
    this.rightPanelScrollItems = [];
    this.rightPanelScrollOffset = 0;
    this.rightPanelMaxScroll = 0;
    this.boardEdgeLabels = [];
    this.gapMarkers = [];
  }

  init(data) {
    this.runStatePayload = data?.runState ?? null;
  }

  create() {
    this.cameras.main.setBackgroundColor("#10141b");
    this.layout = this.computeLayout();
    this.tooltip = new TooltipController(this);
    this.audioFx = new AudioFx(this);
    this.vfx = new VfxController(this);
    this.drawBoard();
    this.createHud();
    this.createHistoryModal();
    this.createSettingsOverlay();
    this.buttons.settings = this.createButton(
      this.layout.rightPanelX + this.layout.sidePanelW - 124,
      this.layout.topPanelY + 8,
      108,
      34,
      "Cài đặt",
      () => this.toggleSettingsOverlay(),
      { variant: "ghost" }
    );
    if (this.historyButtonRect) {
      this.buttons.history = this.createButton(
        this.historyButtonRect.x,
        this.historyButtonRect.y,
        this.historyButtonRect.w,
        this.historyButtonRect.h,
        "Lịch sử",
        () => this.toggleHistoryModal(true),
        { variant: "ghost", fontSize: 12, bold: true }
      );
    }
    this.setupInput();

    this.combatTickEvent = this.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => {
        if (!this.settingsVisible && this.phase === PHASE.COMBAT) this.stepCombat();
      }
    });

    this.startFromPayload();
  }

  setupInput() {
    this.input.keyboard.on("keydown-SPACE", () => {
      if (!this.settingsVisible && this.phase === PHASE.COMBAT) this.stepCombat();
    });
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.historyModalVisible) {
        this.toggleHistoryModal(false);
        return;
      }
      this.toggleSettingsOverlay();
    });
    this.input.on("wheel", (_pointer, _gos, _dx, dy) => {
      if (this.historyModalVisible) this.onHistoryWheel(dy);
    });
  }

  startFromPayload() {
    const hydrated = hydrateRunState(this.runStatePayload);
    if (!hydrated?.player?.board) {
      this.scene.start("PlanningScene");
      return;
    }
    this.runStatePayload = hydrated;
    this.aiMode = hydrated.aiMode ?? "MEDIUM";
    this.audioFx.setEnabled(hydrated.audioEnabled !== false);
    this.audioFx.startBgm("bgm_combat", 0.2);
    this.player = hydrated.player;
    this.phase = PHASE.PLANNING;
    this.logs = [];
    this.logHistory = [];
    this.historyFilter = "ALL";
    this.historyScrollOffset = 0;
    this.toggleHistoryModal(false);
    this.beginCombat();
  }

  createSettingsOverlay() {
    const cx = this.scale.width * 0.5;
    const cy = this.scale.height * 0.5;

    const shade = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x05070c, 0.62);
    shade.setDepth(5000);
    shade.setVisible(false);
    shade.setInteractive();
    this.settingsOverlay.push(shade);

    const panel = this.add.rectangle(cx, cy, 520, 320, 0x102035, 0.98);
    panel.setStrokeStyle(1, UI_COLORS.panelEdge, 0.9);
    panel.setDepth(5001);
    panel.setVisible(false);
    this.settingsOverlay.push(panel);

    const title = this.add.text(cx, cy - 130, "Cài đặt giao tranh", {
      fontFamily: UI_FONT,
      fontSize: "26px",
      color: "#ffeab0"
    });
    title.setOrigin(0.5);
    title.setDepth(5002);
    title.setVisible(false);
    this.settingsOverlay.push(title);

    const makeModalBtn = (dx, dy, w, h, label, onClick, variant = "ghost") => {
      const btn = this.createButton(cx + dx - w / 2, cy + dy - h / 2, w, h, label, onClick, { variant });
      btn.shadow.setDepth(5002);
      btn.bg.setDepth(5003);
      btn.text.setDepth(5004);
      btn.setVisible(false);
      this.settingsOverlay.push(btn.shadow, btn.bg, btn.text);
      return btn;
    };

    this.modalButtons = {};
    this.modalButtons.audio = makeModalBtn(0, -40, 230, 44, "Âm thanh: Bật", () => this.toggleAudio());
    this.modalButtons.exit = makeModalBtn(0, 14, 230, 44, "Thoát về chuẩn bị", () => this.exitToPlanning());
    this.modalButtons.menu = makeModalBtn(-126, 92, 220, 44, "Trang chủ", () => this.scene.start("MainMenuScene"), "secondary");
    this.modalButtons.close = makeModalBtn(126, 92, 220, 44, "Đóng", () => this.toggleSettingsOverlay(false));
  }

  toggleSettingsOverlay(force = null) {
    const next = typeof force === "boolean" ? force : !this.settingsVisible;
    if (next) this.toggleHistoryModal(false);
    this.settingsVisible = next;
    this.modalButtons?.audio?.setLabel(`Âm thanh: ${this.audioFx.enabled ? "Bật" : "Tắt"}`);
    this.settingsOverlay?.forEach((o) => o.setVisible(next));
  }

  createHistoryModal() {
    const w = this.scale.width;
    const h = this.scale.height;
    const panelW = Math.min(640, Math.floor(w * 0.8));
    const panelH = Math.min(Math.floor(h * 0.78), 720);
    const cx = Math.floor(w * 0.5);
    const cy = Math.floor(h * 0.5);
    const x0 = cx - panelW * 0.5;
    const y0 = cy - panelH * 0.5;

    const shade = this.add.rectangle(cx, cy, w, h, 0x020509, 0.68);
    shade.setDepth(5800);
    shade.setVisible(false);
    shade.setInteractive({ useHandCursor: true });
    shade.on("pointerdown", () => this.toggleHistoryModal(false));

    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x0f1a29, 0.97);
    panel.setStrokeStyle(1, UI_COLORS.panelEdge, 0.9);
    panel.setDepth(5801);
    panel.setVisible(false);

    const title = this.add.text(x0 + 20, y0 + 14, "Lich su / Nhat ky tran", {
      fontFamily: UI_FONT,
      fontSize: "20px",
      color: UI_COLORS.textPrimary,
      fontStyle: "bold"
    });
    title.setDepth(5802);
    title.setVisible(false);

    const closeBg = this.add.rectangle(x0 + panelW - 24, y0 + 24, 26, 26, 0x21364d, 0.96);
    closeBg.setStrokeStyle(1, UI_COLORS.panelEdge, 0.85);
    closeBg.setDepth(5802);
    closeBg.setVisible(false);
    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on("pointerdown", () => this.toggleHistoryModal(false));
    const closeText = this.add.text(x0 + panelW - 24, y0 + 24, "x", {
      fontFamily: UI_FONT,
      fontSize: "20px",
      color: UI_COLORS.textPrimary
    }).setOrigin(0.5);
    closeText.setDepth(5803);
    closeText.setVisible(false);

    const tabY = y0 + 52;
    const chipW = Math.floor((panelW - 40 - 8 * (HISTORY_FILTERS.length - 1)) / HISTORY_FILTERS.length);
    this.historyFilterButtons = HISTORY_FILTERS.map((filter, idx) => {
      const bx = x0 + 20 + idx * (chipW + 8);
      const bg = this.add.rectangle(bx + chipW / 2, tabY + 14, chipW, 28, 0x1a2d42, 0.94);
      bg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.8);
      bg.setDepth(5802);
      bg.setVisible(false);
      bg.setInteractive({ useHandCursor: true });
      const text = this.add.text(bx + chipW / 2, tabY + 14, filter.label, {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: UI_COLORS.textSecondary
      }).setOrigin(0.5);
      text.setDepth(5803);
      text.setVisible(false);
      bg.on("pointerdown", () => this.setHistoryFilter(filter.key));
      return { key: filter.key, bg, text };
    });

    const listX = x0 + 20;
    const listY = y0 + 90;
    const listW = panelW - 40;
    const listH = panelH - 120;
    this.historyListViewport = { x: listX, y: listY, w: listW, h: listH };

    const listBg = this.add.rectangle(listX + listW / 2, listY + listH / 2, listW, listH, 0x0d1623, 0.88);
    listBg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.7);
    listBg.setDepth(5801);
    listBg.setVisible(false);

    this.historyListContainer = this.add.container(listX, listY);
    this.historyListContainer.setDepth(5802);
    this.historyListContainer.setVisible(false);

    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(listX, listY, listW, listH);
    maskShape.setVisible(false);
    this.historyListContainer.setMask(maskShape.createGeometryMask());

    this.historyModalParts = [
      shade,
      panel,
      title,
      closeBg,
      closeText,
      listBg,
      this.historyListContainer,
      ...this.historyFilterButtons.flatMap((x) => [x.bg, x.text]),
      maskShape
    ];
  }

  toggleHistoryModal(force = null) {
    const next = typeof force === "boolean" ? force : !this.historyModalVisible;
    if (next) this.toggleSettingsOverlay(false);
    this.historyModalVisible = next;
    this.historyModalParts?.forEach((part) => part.setVisible(next));
    if (next) this.refreshHistoryModal();
  }

  setHistoryFilter(filterKey) {
    this.historyFilter = filterKey;
    this.historyScrollOffset = 0;
    this.refreshHistoryModal();
  }

  onHistoryWheel(deltaY) {
    if (!this.historyModalVisible) return;
    const next = clamp(this.historyScrollOffset + (deltaY > 0 ? 36 : -36), 0, this.historyMaxScroll);
    this.historyScrollOffset = next;
    if (this.historyListContainer && this.historyListViewport) {
      this.historyListContainer.y = this.historyListViewport.y - this.historyScrollOffset;
    }
  }

  refreshHistoryModal() {
    if (!this.historyListContainer || !this.historyListViewport) return;
    this.historyListItems.forEach((item) => item.destroy());
    this.historyListItems = [];
    this.historyFilterButtons.forEach((chip) => {
      const active = chip.key === this.historyFilter;
      chip.bg.setFillStyle(active ? 0x2a4766 : 0x1a2d42, active ? 0.98 : 0.94);
      chip.bg.setStrokeStyle(1, active ? UI_COLORS.panelEdge : UI_COLORS.panelEdgeSoft, active ? 0.95 : 0.8);
      chip.text.setColor(active ? "#ffffff" : UI_COLORS.textSecondary);
    });

    const selected = this.historyFilter;
    const logs =
      selected === "ALL" ? this.logHistory : this.logHistory.filter((entry) => entry.category === selected);
    const sorted = [...logs].reverse();
    const width = this.historyListViewport.w - 14;
    let y = 0;

    if (!sorted.length) {
      const empty = this.add.text(0, 0, "Chua co du lieu lich su cho bo loc nay.", {
        fontFamily: UI_FONT,
        fontSize: "13px",
        color: UI_COLORS.textMuted,
        wordWrap: { width }
      });
      this.historyListContainer.add(empty);
      this.historyListItems.push(empty);
      y = empty.height + 8;
    } else {
      sorted.forEach((entry) => {
        const categoryLabel = HISTORY_FILTERS.find((f) => f.key === entry.category)?.label ?? entry.category;
        const block = this.add.text(0, y, `[Vong ${entry.round}] [${categoryLabel}] ${entry.message}`, {
          fontFamily: UI_FONT,
          fontSize: "13px",
          color: UI_COLORS.textPrimary,
          lineSpacing: 4,
          wordWrap: { width }
        });
        this.historyListContainer.add(block);
        this.historyListItems.push(block);
        y += block.height + 10;
      });
    }

    this.historyMaxScroll = Math.max(0, y - this.historyListViewport.h);
    this.historyScrollOffset = clamp(this.historyScrollOffset, 0, this.historyMaxScroll);
    this.historyListContainer.y = this.historyListViewport.y - this.historyScrollOffset;
  }

  toggleAudio() {
    this.audioFx.setEnabled(!this.audioFx.enabled);
    this.runStatePayload.audioEnabled = this.audioFx.enabled;
    saveUiSettings({ aiMode: this.runStatePayload.aiMode ?? "MEDIUM", audioEnabled: this.audioFx.enabled });
    this.modalButtons?.audio?.setLabel(`Âm thanh: ${this.audioFx.enabled ? "Bật" : "Tắt"}`);
  }

  exitToPlanning() {
    this.toggleSettingsOverlay(false);
    this.scene.start("PlanningScene", { restoredState: this.runStatePayload });
  }

  setAIMode(mode) {
    if (!AI_SETTINGS[mode]) return;
    this.aiMode = mode;
    this.addLog(`Độ khó AI -> ${AI_SETTINGS[mode].label}`);
    this.refreshHeader();
  }

  startNewRun() {
    this.clearCombatSprites();
    this.clearPlanningSprites();
    this.clearOverlay();
    this.selectedBenchIndex = null;
    this.turnQueue = [];
    this.turnIndex = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.phase = PHASE.PLANNING;
    this.logs = [];
    this.logHistory = [];
    this.historyFilter = "ALL";
    this.historyScrollOffset = 0;
    this.toggleHistoryModal(false);

    this.player = {
      hp: 100,
      gold: 10,
      xp: 0,
      level: 1,
      round: 1,
      gameMode: "PVE_JOURNEY",
      audioEnabled: this.audioFx?.enabled !== false,
      winStreak: 0,
      loseStreak: 0,
      board: this.createEmptyBoard(),
      bench: [],
      shop: [],
      shopLocked: false,
      augments: [],
      augmentRoundsTaken: [],
      deployCapBonus: 0,
      benchBonus: 0,
      interestCapBonus: 0,
      rollCostDelta: 0,
      startingRage: 0,
      startingShield: 0,
      teamAtkPct: 0,
      teamMatkPct: 0,
      teamHpPct: 0,
      lifestealPct: 0,
      hpLossReduce: 0,
      extraClassCount: 0,
      extraTribeCount: 0,
      itemBag: [],
      craftedItems: [],
      enemyPreview: [],
      enemyPreviewRound: 0,
      enemyBudget: 0
    };

    this.refreshShop(true);
    this.enterPlanning(false);
    this.addLog("Khởi tạo ván mới: Bá Chủ Khu Rừng.");
  }

  createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array.from({ length: PLAYER_COLS }, () => null));
  }

  createOwnedUnit(baseId, star = 1) {
    const base = UNIT_BY_ID[baseId];
    return {
      uid: createUnitUid(),
      baseId,
      star,
      base
    };
  }

  computeLayout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const margin = Math.max(UI_SPACING.SM, Math.floor(w * 0.015));
    const gridCols = 12;
    const colGap = UI_SPACING.SM;
    const gridW = w - margin * 2;
    const colW = Math.floor((gridW - colGap * (gridCols - 1)) / gridCols);
    const boardCols = 9;
    const sideCols = 3;
    const contentW = boardCols * colW + (boardCols - 1) * colGap;
    const sidePanelW = sideCols * colW + (sideCols - 1) * colGap;
    const topPanelY = margin;
    const topPanelH = 100;
    const boardPanelX = margin;
    const rightPanelX = boardPanelX + contentW + colGap;
    const boardPanelY = topPanelY + topPanelH + UI_SPACING.LG;
    const sidePanelY = boardPanelY;
    const sidePanelH = h - sidePanelY - margin;

    const actionsH = 48;
    const controlsH = 24;
    const shopCardH = 130;
    const benchSlotH = 86;
    const benchY = h - margin - benchSlotH;
    const shopY = benchY - UI_SPACING.SM - shopCardH;
    const controlsY = shopY - UI_SPACING.SM - controlsH;
    const actionsY = controlsY - UI_SPACING.SM - actionsH;
    const boardPanelH = Math.max(250, actionsY - UI_SPACING.LG - boardPanelY);

    return {
      width: w,
      height: h,
      margin,
      colW,
      colGap,
      gridCols,
      sidePanelW,
      contentW,
      rightPanelX,
      topPanelY,
      topPanelH,
      boardOriginX: boardPanelX + Math.floor(contentW * 0.28),
      boardOriginY: boardPanelY + Math.floor(boardPanelH * 0.78),
      boardPanelX,
      boardPanelY,
      boardPanelW: contentW,
      boardPanelH,
      sidePanelY,
      sidePanelH,
      actionsY,
      controlsY,
      shopY,
      benchY
    };
  }

  toVisualCol(col) {
    return col >= RIGHT_COL_START ? col + BOARD_GAP_COLS : col;
  }

  toChessCoord(row, col) {
    const file = BOARD_FILES[this.toVisualCol(col)] ?? "?";
    const rank = ROWS - row;
    return `${file}${rank}`;
  }

  createBoardBackground() {
    const l = this.layout;
    const startRound = this.player?.round ?? this.runStatePayload?.player?.round ?? 1;
    const key = getForestBackgroundKeyByRound(startRound);
    if (!this.textures.exists(key)) return;
    this.roundBackgroundKey = key;
    this.roundBackgroundImage = this.add
      .image(l.boardPanelX + l.boardPanelW / 2, l.boardPanelY + l.boardPanelH / 2, key)
      .setDisplaySize(l.boardPanelW, l.boardPanelH)
      .setAlpha(0.5)
      .setDepth(-20);

    const maskGfx = this.add.graphics();
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(l.boardPanelX, l.boardPanelY, l.boardPanelW, l.boardPanelH);
    this.roundBackgroundMask = maskGfx.createGeometryMask();
    this.roundBackgroundImage.setMask(this.roundBackgroundMask);
    maskGfx.setVisible(false);
  }

  refreshRoundBackground() {
    if (!this.roundBackgroundImage) return;
    const nextKey = getForestBackgroundKeyByRound(this.player?.round ?? this.runStatePayload?.player?.round ?? 1);
    if (!this.textures.exists(nextKey)) return;
    if (nextKey === this.roundBackgroundKey) return;
    this.roundBackgroundKey = nextKey;
    this.roundBackgroundImage.setTexture(nextKey);
  }

  drawBoard() {
    this.originX = this.layout.boardOriginX;
    this.originY = this.layout.boardOriginY;
    this.createBoardBackground();

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const center = this.gridToScreen(col, row);
        const tile = this.add.graphics();
        this.paintGrassTile(tile, center.x, center.y, row, col);
        const label = this.add.text(center.x - 14, center.y - 10, "", {
          fontFamily: UI_FONT,
          fontSize: "11px",
          color: UI_COLORS.textSecondary
        });
        label.setAlpha(0);
        label.setVisible(false);
        label.setDepth(center.y + 1);

        this.tileLookup.set(gridKey(row, col), { tile, center, label });
      }
    }
    this.createBoardEdgeLabels();

    for (let row = 0; row < ROWS; row += 1) {
      const a = this.gridToScreen(4, row);
      const b = this.gridToScreen(5, row);
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const token = this.add.graphics();
      this.paintRiverTile(token, mx, my - 2, row);
      token.setDepth(my + 2);
      this.gapMarkers.push(token);
    }

    this.add.text(this.layout.boardPanelX + 14, this.layout.boardPanelY + this.layout.boardPanelH - 24, "PHE TA", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: UI_COLORS.textSecondary
    }).setDepth(2100);

    this.add.text(this.layout.boardPanelX + this.layout.boardPanelW - 88, this.layout.boardPanelY + 10, "PHE ĐỊCH", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: UI_COLORS.textSecondary
    }).setDepth(2100);

    this.highlightLayer = this.add.graphics();
    this.highlightLayer.setDepth(999);
    this.attackPreviewLayer = this.add.graphics();
    this.attackPreviewLayer.setDepth(1000);
    this.attackPreviewSword = this.add.graphics();
    this.attackPreviewSword.setDepth(1001);
    this.attackPreviewSword.setVisible(false);
  }

  createBoardEdgeLabels() {
    this.boardEdgeLabels.forEach((x) => x.label.destroy());
    this.boardEdgeLabels = [];
    const style = {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    };
    const add = (text, col, row, anchor) => {
      const label = this.add.text(0, 0, text, style).setOrigin(0.5).setDepth(2100);
      this.boardEdgeLabels.push({ label, col, row, anchor });
    };
    for (let col = 0; col < PLAYER_COLS; col += 1) {
      add(BOARD_FILES[this.toVisualCol(col)] ?? "?", col, ROWS - 1, "bottom");
    }
    for (let row = 0; row < ROWS; row += 1) {
      add(String(ROWS - row), 0, row, "left");
    }
    for (let col = RIGHT_COL_START; col <= RIGHT_COL_END; col += 1) {
      add(BOARD_FILES[this.toVisualCol(col)] ?? "?", col, 0, "top");
    }
    for (let row = 0; row < ROWS; row += 1) {
      add(String(ROWS - row), RIGHT_COL_END, row, "right");
    }
    this.refreshBoardEdgeLabels();
  }

  refreshBoardEdgeLabels() {
    this.boardEdgeLabels.forEach((entry) => {
      const p = this.gridToScreen(entry.col, entry.row);
      let dx = 0;
      let dy = 0;
      if (entry.anchor === "bottom") dy = TILE_H * 0.72;
      if (entry.anchor === "top") dy = -TILE_H * 0.72;
      if (entry.anchor === "left") dx = -TILE_W * 0.68;
      if (entry.anchor === "right") dx = TILE_W * 0.68;
      entry.label.setPosition(p.x + dx, p.y + dy);
      entry.label.setDepth(p.y + 4);
    });
  }

  getGrassTileStyle(row, col) {
    const even = (row + col) % 2 === 0;
    if (even) {
      return { fill: UI_COLORS.grassA, stroke: UI_COLORS.grassEdgeA };
    }
    return { fill: UI_COLORS.grassB, stroke: UI_COLORS.grassEdgeB };
  }

  paintGrassTile(graphics, x, y, row, col) {
    const { fill, stroke } = this.getGrassTileStyle(row, col);
    graphics.fillStyle(fill, 0.72);
    graphics.lineStyle(1, stroke, 0.92);
    this.drawDiamond(graphics, x, y);

    // Add a subtle top highlight for a checkerboard grass-tile look.
    graphics.lineStyle(1, UI_COLORS.grassHighlight, 0.2);
    graphics.beginPath();
    graphics.moveTo(x - TILE_W / 2 + 4, y);
    graphics.lineTo(x, y - TILE_H / 2 + 2);
    graphics.lineTo(x + TILE_W / 2 - 4, y);
    graphics.strokePath();
  }

  paintRiverTile(graphics, x, y, row) {
    const w = TILE_W * 0.42;
    const h = TILE_H * 0.42;
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

    graphics.lineStyle(1, UI_COLORS.riverHighlight, 0.26);
    graphics.beginPath();
    graphics.moveTo(x - w / 2 + 3, y);
    graphics.lineTo(x, y - h / 2 + 2);
    graphics.lineTo(x + w / 2 - 3, y);
    graphics.strokePath();
  }

  drawDiamond(graphics, x, y, fill = true) {
    graphics.beginPath();
    graphics.moveTo(x, y - TILE_H / 2);
    graphics.lineTo(x + TILE_W / 2, y);
    graphics.lineTo(x, y + TILE_H / 2);
    graphics.lineTo(x - TILE_W / 2, y);
    graphics.closePath();
    if (fill) graphics.fillPath();
    graphics.strokePath();
  }

  getRoleTheme(classType) {
    return ROLE_THEME[classType] ?? ROLE_THEME.FIGHTER;
  }

  createHud() {
    const l = this.layout;
    const screenOverlay = this.add.rectangle(l.width / 2, l.height / 2, l.width, l.height, UI_COLORS.screenOverlay, 0.36);
    screenOverlay.setDepth(-30);

    const topPanel = this.add.rectangle(
      l.boardPanelX + l.boardPanelW / 2,
      l.topPanelY + l.topPanelH / 2,
      l.boardPanelW,
      l.topPanelH,
      UI_COLORS.panelSoft,
      0.88
    );
    topPanel.setStrokeStyle(1, UI_COLORS.panelEdge, 0.75);
    topPanel.setDepth(1800);

    const boardPanel = this.add.rectangle(
      l.boardPanelX + l.boardPanelW / 2,
      l.boardPanelY + l.boardPanelH / 2,
      l.boardPanelW,
      l.boardPanelH,
      UI_COLORS.panel,
      0.5
    );
    boardPanel.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.75);
    boardPanel.setDepth(-12);

    const rightPanel = this.add.rectangle(
      l.rightPanelX + l.sidePanelW / 2,
      l.sidePanelY + l.sidePanelH / 2,
      l.sidePanelW,
      l.sidePanelH,
      UI_COLORS.panelSoft,
      0.9
    );
    rightPanel.setStrokeStyle(1, UI_COLORS.panelEdge, 0.72);
    rightPanel.setDepth(1800);

    this.titleText = this.add.text(l.boardPanelX + UI_SPACING.SM, l.topPanelY + UI_SPACING.SM - 2, "FOREST THRONE • BÁ CHỦ KHU RỪNG", {
      fontFamily: UI_FONT,
      fontSize: "24px",
      color: UI_COLORS.textPrimary,
      fontStyle: "bold"
    }).setDepth(2000);

    this.ruleText = this.add.text(
      l.boardPanelX + UI_SPACING.SM,
      l.topPanelY + UI_SPACING.SM + 30,
      "Luật quét: Ta (hàng 0→4, cột 4→0) | Địch (hàng 0→4, cột 5→9)",
      {
        fontFamily: UI_FONT,
        fontSize: "13px",
        color: UI_COLORS.textSecondary
      }
    ).setDepth(2000);

    this.headerText = this.add.text(l.boardPanelX + UI_SPACING.SM, l.topPanelY + UI_SPACING.SM + 52, "", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: UI_COLORS.textPrimary
    }).setDepth(2000);

    const rightX = l.rightPanelX + UI_SPACING.SM;
    const rightW = l.sidePanelW - UI_SPACING.SM * 2;
    let y = l.sidePanelY + UI_SPACING.SM;

    this.phaseTitleText = this.add.text(rightX, y, "◉ PHA", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    }).setDepth(2000);
    this.phaseText = this.add.text(rightX, y + 20, "", {
      fontFamily: UI_FONT,
      fontSize: "16px",
      color: UI_COLORS.textPrimary
    }).setDepth(2000);
    y += 62;

    this.synergyTitleText = this.add.text(rightX, y, "◎ SYNERGY", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    }).setDepth(2000);
    this.synergyText = this.add.text(rightX, y + 20, "", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: UI_COLORS.textPrimary,
      lineSpacing: 6,
      wordWrap: { width: rightW }
    }).setDepth(2000);
    this.synergyText.setFixedSize(rightW, 200);
    this.synergyText.setInteractive({ useHandCursor: true });
    this.tooltip.attach(this.synergyText, () => this.getSynergyTooltip());
    y += 232;

    this.enemyTitleText = this.add.text(rightX, y, "◈ ENEMY INFO", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    }).setDepth(2000);
    this.queueText = this.add.text(rightX, y + 20, "", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: UI_COLORS.textPrimary,
      lineSpacing: 5,
      wordWrap: { width: rightW }
    }).setDepth(2000);
    this.queueText.setFixedSize(rightW, 126);
    y += 160;

    this.logTitleText = this.add.text(rightX, y, "• NHẬT KÝ", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    }).setDepth(2000);
    this.logText = this.add.text(rightX, y + 22, "", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: UI_COLORS.textPrimary,
      lineSpacing: 4,
      wordWrap: { width: rightW - 178 }
    }).setDepth(2000);
    this.logText.setFixedSize(rightW - 178, 44);
    this.historyButtonRect = {
      x: rightX + rightW - 170,
      y: y + 16,
      w: 170,
      h: 30
    };
  }

  createButtons() {
    this.buttons.roll = this.createButton(40, 600, 120, 36, "Roll", () => this.rollShop());
    this.buttons.xp = this.createButton(170, 600, 120, 36, "Buy XP", () => this.buyXp());
    this.buttons.lock = this.createButton(300, 600, 120, 36, "Lock: Off", () => this.toggleLock());
    this.buttons.start = this.createButton(430, 600, 160, 36, "Start Combat", () => this.beginCombat());
    this.buttons.reset = this.createButton(600, 600, 120, 36, "New Run", () => this.startNewRun());
    this.buttons.easy = this.createButton(730, 600, 60, 36, "1", () => this.setAIMode("EASY"));
    this.buttons.medium = this.createButton(796, 600, 60, 36, "2", () => this.setAIMode("MEDIUM"));
    this.buttons.hard = this.createButton(862, 600, 60, 36, "3", () => this.setAIMode("HARD"));

    this.controlsText = this.add.text(40, 640, "[SPACE] combat step/start | [R] new run | [1/2/3] AI mode", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#99cdfa"
    });
    this.controlsText.setDepth(2000);
  }

  createButton(x, y, w, h, label, onClick, options = {}) {
    const variants = {
      secondary: {
        fill: 0x1a2d42,
        edge: UI_COLORS.panelEdge,
        hover: 0x25405d,
        text: UI_COLORS.textPrimary
      },
      ghost: {
        fill: 0x162433,
        edge: UI_COLORS.panelEdgeSoft,
        hover: 0x21354c,
        text: UI_COLORS.textSecondary
      },
      cta: {
        fill: UI_COLORS.cta,
        edge: UI_COLORS.ctaEdge,
        hover: UI_COLORS.ctaHover,
        text: "#141f04"
      }
    };
    const variant = variants[options.variant] ?? variants.secondary;
    const shadow = this.add.rectangle(x + w / 2, y + h / 2 + 2, w, h, 0x000000, 0.22);
    shadow.setDepth(1998);
    const bg = this.add.rectangle(x + w / 2, y + h / 2, w, h, variant.fill, 0.94);
    bg.setStrokeStyle(1, variant.edge, 0.95);
    bg.setDepth(1999);
    const text = this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: UI_FONT,
      fontSize: `${options.fontSize ?? 14}px`,
      color: variant.text,
      fontStyle: options.bold ? "bold" : "normal"
    });
    text.setOrigin(0.5);
    text.setDepth(2000);
    const btn = {
      x,
      y,
      w,
      h,
      shadow,
      bg,
      text,
      enabled: true,
      setLabel: (v) => text.setText(v),
      setEnabled: (enabled) => {
        btn.enabled = enabled;
        bg.setFillStyle(enabled ? variant.fill : 0x323943, enabled ? 0.94 : 0.7);
        bg.setStrokeStyle(1, enabled ? variant.edge : 0x5b6572, 0.85);
        text.setColor(enabled ? variant.text : "#8d98a6");
        shadow.setVisible(enabled);
      },
      setVisible: (visible) => {
        shadow.setVisible(visible && btn.enabled);
        bg.setVisible(visible);
        text.setVisible(visible);
      }
    };

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      if (btn.enabled) bg.setFillStyle(variant.hover, 0.96);
    });
    bg.on("pointerout", () => {
      if (btn.enabled) bg.setFillStyle(variant.fill, 0.94);
    });
    bg.on("pointerdown", () => {
      if (!btn.enabled) return;
      onClick();
    });

    return btn;
  }

  createPlayerCellZones() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const tile = this.tileLookup.get(gridKey(row, col));
        const zone = this.add.zone(tile.center.x, tile.center.y, TILE_W - 10, TILE_H - 10);
        zone.setRectangleDropZone(TILE_W - 10, TILE_H - 10);
        zone.setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => this.onPlayerCellClick(row, col));
        zone.setDepth(1500);
        this.playerCellZones.push(zone);
      }
    }
  }
  createBenchSlots() {
    const maxSlots = 12;
    const startX = 40;
    const y = 705;
    const slotW = 96;
    const slotH = 90;
    for (let i = 0; i < maxSlots; i += 1) {
      const x = startX + i * (slotW + 6);
      const bg = this.add.rectangle(x + slotW / 2, y + slotH / 2, slotW, slotH, 0x1f2734, 0.92);
      bg.setStrokeStyle(2, 0x4f607c, 1);
      bg.setDepth(1500);
      const label = this.add.text(x + 8, y + 8, "", {
        fontFamily: "Consolas",
        fontSize: "12px",
        color: "#d9e6ff",
        wordWrap: { width: slotW - 14 }
      });
      label.setDepth(1501);
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.onBenchClick(i));
      this.benchSlots.push({ x, y, slotW, slotH, bg, label });
    }

    this.shopTitle = this.add.text(40, 660, "Shop", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#ffe3a3"
    });
    this.shopTitle.setDepth(2000);

    this.benchTitle = this.add.text(40, 680, "Bench", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#ffe3a3"
    });
    this.benchTitle.setDepth(2000);
  }

  onPlayerCellClick(row, col) {
    if (this.phase !== PHASE.PLANNING) return;
    if (this.overlaySprites.length) return;

    const occupant = this.player.board[row][col];
    const selected = this.selectedBenchIndex != null ? this.player.bench[this.selectedBenchIndex] : null;

    if (selected) {
      if (!occupant) {
        if (this.getDeployCount() >= this.getDeployCap()) {
          this.addLog("Deploy cap da day.");
          return;
        }
        this.player.board[row][col] = selected;
        this.player.bench.splice(this.selectedBenchIndex, 1);
        this.selectedBenchIndex = null;
        this.tryAutoMerge();
        this.refreshPlanningUi();
        return;
      }

      this.player.board[row][col] = selected;
      this.player.bench[this.selectedBenchIndex] = occupant;
      this.selectedBenchIndex = null;
      this.tryAutoMerge();
      this.refreshPlanningUi();
      return;
    }

    if (occupant) {
      if (this.player.bench.length >= this.getBenchCap()) {
        this.addLog("Bench da day.");
        return;
      }
      this.player.board[row][col] = null;
      this.player.bench.push(occupant);
      this.refreshPlanningUi();
    }
  }

  onBenchClick(index) {
    if (this.phase !== PHASE.PLANNING) return;
    if (index >= this.getBenchCap()) return;
    if (index >= this.player.bench.length) {
      this.selectedBenchIndex = null;
      this.refreshBenchUi();
      return;
    }

    this.selectedBenchIndex = this.selectedBenchIndex === index ? null : index;
    this.refreshBenchUi();
  }

  getBenchCap() {
    return 9 + this.player.benchBonus;
  }

  getDeployCap() {
    return getDeployCapByLevel(this.player.level) + this.player.deployCapBonus;
  }

  getDeployCount() {
    let count = 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        if (this.player.board[row][col]) count += 1;
      }
    }
    return count;
  }

  rollShop() {
    if (this.phase !== PHASE.PLANNING) return;
    const cost = Math.max(1, 2 + this.player.rollCostDelta);
    if (this.player.gold < cost) {
      this.addLog("Khong du gold de roll.");
      return;
    }
    this.player.gold -= cost;
    this.refreshShop(true);
    this.refreshPlanningUi();
  }

  buyXp() {
    if (this.phase !== PHASE.PLANNING) return;
    const cost = 4;
    if (this.player.gold < cost) {
      this.addLog("Khong du gold de mua XP.");
      return;
    }
    this.player.gold -= cost;
    this.gainXp(4);
    this.refreshPlanningUi();
  }

  gainXp(value) {
    let amount = value;
    while (amount > 0 && this.player.level < 9) {
      const need = getXpToLevelUp(this.player.level) - this.player.xp;
      if (amount >= need) {
        amount -= need;
        this.player.level += 1;
        this.player.xp = 0;
        this.addLog(`Len level ${this.player.level}.`);
      } else {
        this.player.xp += amount;
        amount = 0;
      }
    }
  }

  toggleLock() {
    if (this.phase !== PHASE.PLANNING) return;
    this.player.shopLocked = !this.player.shopLocked;
    this.refreshPlanningUi();
  }

  refreshShop(forceRoll = false) {
    if (this.player.shopLocked && !forceRoll) return;
    const offers = [];
    for (let i = 0; i < 5; i += 1) {
      const tier = rollTierForLevel(this.player.level);
      const pool = UNIT_CATALOG.filter((u) => u.tier === tier);
      const fallback = UNIT_CATALOG.filter((u) => u.tier <= tier);
      const base = randomItem(pool.length ? pool : fallback.length ? fallback : UNIT_CATALOG);
      offers.push({ slot: i, baseId: base.id });
    }
    this.player.shop = offers;
  }

  buyFromShop(index) {
    if (this.phase !== PHASE.PLANNING) return;
    const offer = this.player.shop[index];
    if (!offer) return;
    const base = UNIT_BY_ID[offer.baseId];
    const cost = base.tier;
    if (this.player.gold < cost) {
      this.addLog("Khong du gold de mua tuong.");
      return;
    }
    if (this.player.bench.length >= this.getBenchCap()) {
      this.addLog("Bench da day.");
      return;
    }
    this.player.gold -= cost;
    this.player.bench.push(this.createOwnedUnit(base.id, 1));
    this.player.shop[index] = null;
    this.tryAutoMerge();
    this.refreshPlanningUi();
  }

  tryAutoMerge() {
    let merged = true;
    while (merged) {
      merged = false;
      const refs = this.collectOwnedUnitRefs();
      const groups = new Map();
      refs.forEach((ref) => {
        const key = `${ref.unit.baseId}:${ref.unit.star}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(ref);
      });

      for (const [, group] of groups) {
        if (group.length < 3) continue;
        const picked = group.slice(0, 3);
        const star = picked[0].unit.star;
        const baseId = picked[0].unit.baseId;
        picked.forEach((ref) => this.removeOwnedUnitRef(ref));
        const upgraded = this.createOwnedUnit(baseId, Math.min(3, star + 1));
        this.placeMergedUnit(upgraded, picked[0]);
        this.addLog(`Merge: ${UNIT_BY_ID[baseId].name} -> ${upgraded.star}*`);
        merged = true;
        break;
      }
    }
  }

  collectOwnedUnitRefs() {
    const refs = [];
    this.player.bench.forEach((unit, index) => {
      refs.push({ unit, location: "BENCH", index });
    });
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const unit = this.player.board[row][col];
        if (unit) refs.push({ unit, location: "BOARD", row, col });
      }
    }
    return refs;
  }

  removeOwnedUnitRef(ref) {
    if (ref.location === "BENCH") {
      this.player.bench.splice(ref.index, 1);
      return;
    }
    this.player.board[ref.row][ref.col] = null;
  }

  placeMergedUnit(unit, preferredRef) {
    if (preferredRef.location === "BOARD") {
      this.player.board[preferredRef.row][preferredRef.col] = unit;
      return;
    }
    if (this.player.bench.length < this.getBenchCap()) {
      this.player.bench.push(unit);
      return;
    }
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        if (!this.player.board[row][col] && this.getDeployCount() < this.getDeployCap()) {
          this.player.board[row][col] = unit;
          return;
        }
      }
    }
    this.player.bench.push(unit);
  }

  enterPlanning(grantIncome) {
    this.phase = PHASE.PLANNING;
    this.clearCombatSprites();
    this.turnQueue = [];
    this.turnIndex = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.selectedBenchIndex = null;
    this.highlightLayer.clear();

    if (grantIncome) this.grantRoundIncome();
    this.refreshShop(false);
    this.refreshPlanningUi();

    if (AUGMENT_ROUNDS.includes(this.player.round) && !this.player.augmentRoundsTaken.includes(this.player.round)) {
      this.showAugmentChoices();
    }
  }

  grantRoundIncome() {
    const base = 5;
    const interestCap = 5 + this.player.interestCapBonus;
    const interest = Math.min(interestCap, Math.floor(this.player.gold / 10));
    const winStreakBonus = this.player.winStreak >= 2 ? Math.min(3, Math.floor(this.player.winStreak / 2)) : 0;
    const loseStreakBonus = this.player.loseStreak >= 2 ? Math.min(3, Math.floor(this.player.loseStreak / 2)) : 0;
    const streak = Math.max(winStreakBonus, loseStreakBonus);
    const gain = base + interest + streak;
    this.player.gold += gain;
    this.addLog(`Round ${this.player.round}: +${gain} gold (base ${base} + interest ${interest} + streak ${streak}).`);
  }

  showAugmentChoices() {
    this.phase = PHASE.AUGMENT;
    this.clearOverlay();
    const remaining = AUGMENT_LIBRARY.filter((a) => !this.player.augments.includes(a.id));
    const choices = sampleWithoutReplacement(remaining, 3);
    this.currentAugmentChoices = choices;

    const shade = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.62);
    shade.setDepth(3000);
    this.overlaySprites.push(shade);

    const title = this.add.text(this.scale.width / 2 - 170, 180, "Chon 1 Forest Augment", {
      fontFamily: "Trebuchet MS",
      fontSize: "30px",
      color: "#fff0ad",
      fontStyle: "bold"
    });
    title.setDepth(3001);
    this.overlaySprites.push(title);

    choices.forEach((choice, idx) => {
      const x = 220 + idx * 360;
      const y = 250;
      const card = this.add.rectangle(x, y, 320, 260, 0x1f2b3d, 0.98);
      card.setStrokeStyle(3, 0x8cc8ff, 1);
      card.setDepth(3001);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => this.chooseAugment(choice));
      card.on("pointerover", () => card.setFillStyle(0x2b3d57, 0.98));
      card.on("pointerout", () => card.setFillStyle(0x1f2b3d, 0.98));

      const text = this.add.text(x - 146, y - 106, `${choice.name}\n\n[${choice.group}]\n${choice.description}`, {
        fontFamily: "Consolas",
        fontSize: "18px",
        color: "#e8f3ff",
        wordWrap: { width: 290 },
        lineSpacing: 6
      });
      text.setDepth(3002);
      this.overlaySprites.push(card, text);
    });
  }

  clearOverlay() {
    this.overlaySprites.forEach((o) => o.destroy());
    this.overlaySprites = [];
    this.currentAugmentChoices = null;
  }

  chooseAugment(augment) {
    this.applyAugment(augment);
    this.player.augments.push(augment.id);
    this.player.augmentRoundsTaken.push(this.player.round);
    this.addLog(`Augment: ${augment.name}`);
    this.clearOverlay();
    this.phase = PHASE.PLANNING;
    this.refreshPlanningUi();
  }

  applyAugment(augment) {
    const eff = augment.effect;
    switch (eff.type) {
      case "gold_flat":
        this.player.gold += eff.value;
        break;
      case "interest_cap":
        this.player.interestCapBonus += eff.value;
        break;
      case "roll_cost_delta":
        this.player.rollCostDelta += eff.value;
        break;
      case "deploy_cap_bonus":
        this.player.deployCapBonus += eff.value;
        break;
      case "bench_bonus":
        this.player.benchBonus += eff.value;
        break;
      case "starting_rage":
        this.player.startingRage += eff.value;
        break;
      case "team_atk_pct":
        this.player.teamAtkPct += eff.value;
        break;
      case "team_hp_pct":
        this.player.teamHpPct += eff.value;
        break;
      case "starting_shield":
        this.player.startingShield += eff.value;
        break;
      case "team_matk_pct":
        this.player.teamMatkPct += eff.value;
        break;
      case "extra_class_count":
        this.player.extraClassCount += eff.value;
        break;
      case "extra_tribe_count":
        this.player.extraTribeCount += eff.value;
        break;
      case "lifesteal_pct":
        this.player.lifestealPct += eff.value;
        break;
      case "hp_loss_reduce":
        this.player.hpLossReduce += eff.value;
        break;
      case "xp_flat":
        this.gainXp(eff.value);
        break;
      default:
        break;
    }
  }
  beginCombat() {
    if (this.phase !== PHASE.PLANNING) return;
    if (this.getDeployCount() <= 0) {
      this.addLog("Can deploy it nhat 1 tuong.");
      return;
    }

    this.phase = PHASE.COMBAT;
    this.selectedBenchIndex = null;
    this.clearPlanningSprites();
    this.clearOverlay();
    this.combatUnits = [];
    this.turnQueue = [];
    this.turnIndex = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.highlightLayer.clear();

    this.spawnPlayerCombatUnits();
    this.spawnEnemyCombatUnits();
    this.applySynergyBonuses("LEFT");
    this.applySynergyBonuses("RIGHT");
    this.buildTurnQueue();
    this.refreshHeader();
    this.refreshSynergyPreview();
    this.refreshQueuePreview();
    this.addLog(`Bắt đầu giao tranh vòng ${this.player.round}.`);
  }

  spawnPlayerCombatUnits() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const owned = this.player.board[row][col];
        if (!owned) continue;
        const unit = this.createCombatUnit(owned, "LEFT", row, col);
        if (unit) this.combatUnits.push(unit);
      }
    }
  }

  spawnEnemyCombatUnits() {
    const preview = Array.isArray(this.player.enemyPreview) ? this.player.enemyPreview : [];
    if (preview.length) {
      preview.forEach((ref) => {
        const base = UNIT_BY_ID[ref.baseId];
        if (!base) return;
        const owned = this.createOwnedUnit(base.id, ref.star ?? 1);
        const unit = this.createCombatUnit(owned, "RIGHT", ref.row, ref.col);
        if (unit) this.combatUnits.push(unit);
      });
      return;
    }

    const ai = this.getAI();
    const estimateLevel = clamp(1 + Math.floor(this.player.round / 2), 1, 9);
    const count = clamp(getDeployCapByLevel(estimateLevel) + ai.teamSizeBonus, 2, 12);
    const maxTier = clamp(1 + Math.floor(this.player.round / 2), 1, 4);
    const pool = UNIT_CATALOG.filter((u) => u.tier <= maxTier);

    const positions = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = RIGHT_COL_START; col <= RIGHT_COL_END; col += 1) {
        positions.push({ row, col });
      }
    }
    Phaser.Utils.Array.Shuffle(positions);
    const picks = positions.slice(0, count);

    picks.forEach((pos) => {
      const tier = Math.min(maxTier, rollTierForLevel(estimateLevel));
      const tierPool = pool.filter((u) => u.tier === tier);
      const base = randomItem(tierPool.length ? tierPool : pool);

      let star = 1;
      const twoStarChance = clamp((this.player.round - 3) * 0.07 + (this.aiMode === "HARD" ? 0.1 : 0), 0, 0.65);
      const threeStarChance = clamp((this.player.round - 8) * 0.03 + (this.aiMode === "HARD" ? 0.03 : 0), 0, 0.18);
      const roll = Math.random();
      if (roll < threeStarChance) star = 3;
      else if (roll < twoStarChance) star = 2;

      const owned = this.createOwnedUnit(base.id, star);
      const unit = this.createCombatUnit(owned, "RIGHT", pos.row, pos.col);
      if (unit) this.combatUnits.push(unit);
    });
  }

  createCombatUnit(owned, side, row, col) {
    const base = owned?.base ?? UNIT_BY_ID[owned?.baseId];
    if (!owned || !base) return null;
    const star = Math.max(1, owned.star ?? 1);
    const baseStats = scaledBaseStats(base.stats, star);
    const ai = this.getAI();
    const hpBase = side === "RIGHT" ? Math.round(baseStats.hp * ai.hpMult) : baseStats.hp;
    const atkBase = side === "RIGHT" ? Math.round(baseStats.atk * ai.atkMult) : baseStats.atk;
    const matkBase = side === "RIGHT" ? Math.round(baseStats.matk * ai.matkMult) : baseStats.matk;

    const hpWithAug = side === "LEFT" ? Math.round(hpBase * (1 + this.player.teamHpPct)) : hpBase;
    const atkWithAug = side === "LEFT" ? Math.round(atkBase * (1 + this.player.teamAtkPct)) : atkBase;
    const matkWithAug = side === "LEFT" ? Math.round(matkBase * (1 + this.player.teamMatkPct)) : matkBase;

    const point = this.gridToScreen(col, row);
    const roleTheme = this.getRoleTheme(base.classType);
    const visual = getUnitVisual(owned.baseId, base.classType);
    const sprite = this.add.circle(point.x, point.y - 10, 24, roleTheme.fill, 0.98);
    sprite.setStrokeStyle(3, roleTheme.stroke, 1);
    sprite.setDepth(point.y + 10);
    sprite.setInteractive({ useHandCursor: true });

    const icon = this.add.text(point.x, point.y - 10, visual.icon, {
      fontFamily: "Segoe UI Emoji",
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5);
    icon.setDepth(point.y + 12);

    const tag = this.add.text(point.x - 58, point.y - 60, `${visual.nameVi}\n${owned.star}★`, {
      fontFamily: UI_FONT,
      fontSize: "10px",
      color: "#ffffff",
      lineSpacing: 2
    });
    tag.setDepth(point.y + 11);

    const barW = 64;
    const hpBarBg = this.add.rectangle(point.x, point.y + 12, barW, 7, 0x0a1320, 0.92);
    hpBarBg.setStrokeStyle(1, 0x30475f, 0.9);
    hpBarBg.setDepth(point.y + 11);
    const hpBarFill = this.add.rectangle(point.x - barW / 2 + 1, point.y + 12, barW - 2, 5, 0x79df7b, 0.98).setOrigin(0, 0.5);
    hpBarFill.setDepth(point.y + 12);
    const shieldBar = this.add.rectangle(point.x - barW / 2 + 1, point.y + 12, 0, 5, 0x7bd5ff, 0.94).setOrigin(0, 0.5);
    shieldBar.setDepth(point.y + 13);

    const hpText = this.add.text(point.x, point.y + 4, "", {
      fontFamily: UI_FONT,
      fontSize: "10px",
      color: "#d3ffd6"
    }).setOrigin(0.5);
    hpText.setDepth(point.y + 14);

    const rageBarBg = this.add.rectangle(point.x, point.y + 23, barW, 6, 0x0a1320, 0.9);
    rageBarBg.setStrokeStyle(1, 0x2f4865, 0.85);
    rageBarBg.setDepth(point.y + 11);
    const rageBarFill = this.add.rectangle(point.x - barW / 2 + 1, point.y + 23, 0, 4, 0x7aa9ff, 0.96).setOrigin(0, 0.5);
    rageBarFill.setDepth(point.y + 12);
    const rageText = this.add.text(point.x, point.y + 18, "", {
      fontFamily: UI_FONT,
      fontSize: "10px",
      color: "#dde8ff"
    }).setOrigin(0.5);
    rageText.setDepth(point.y + 14);

    const statusLabel = this.add.text(point.x - 48, point.y + 30, "", {
      fontFamily: UI_FONT,
      fontSize: "9px",
      color: "#ffe9aa"
    });
    statusLabel.setDepth(point.y + 11);

    this.combatSprites.push(
      sprite,
      icon,
      tag,
      hpBarBg,
      hpBarFill,
      shieldBar,
      hpText,
      rageBarBg,
      rageBarFill,
      rageText,
      statusLabel
    );

    const unit = {
      uid: owned.uid,
      baseId: owned.baseId,
      name: visual.nameVi,
      star,
      side,
      row,
      col,
      homeRow: row,
      homeCol: col,
      classType: base.classType,
      tribe: base.tribe,
      skillId: base.skillId,
      maxHp: hpWithAug,
      hp: hpWithAug,
      atk: atkWithAug,
      def: baseStats.def,
      matk: matkWithAug,
      mdef: baseStats.mdef,
      range: baseStats.range,
      rageMax: baseStats.rageMax,
      rage: side === "LEFT" ? this.player.startingRage : 0,
      shield: side === "LEFT" ? this.player.startingShield : 0,
      alive: true,
      sprite,
      icon,
      tag,
      hpBarBg,
      hpBarFill,
      shieldBar,
      hpText,
      rageBarBg,
      rageBarFill,
      rageText,
      statusLabel,
      mods: {
        atkPct: 0,
        matkPct: 0,
        healPct: 0,
        lifestealPct: side === "LEFT" ? this.player.lifestealPct : 0,
        critPct: 0.05,
        evadePct: 0,
        burnOnHit: 0,
        poisonOnHit: 0,
        shieldStart: 0,
        startingRage: 0
      },
      statuses: {
        freeze: 0,
        stun: 0,
        sleep: 0,
        silence: 0,
        tauntTurns: 0,
        tauntTargetId: null,
        burnTurns: 0,
        burnDamage: 0,
        poisonTurns: 0,
        poisonDamage: 0,
        armorBreakTurns: 0,
        armorBreakValue: 0,
        reflectTurns: 0,
        reflectPct: 0,
        atkBuffTurns: 0,
        atkBuffValue: 0,
        defBuffTurns: 0,
        defBuffValue: 0,
        mdefBuffTurns: 0,
        mdefBuffValue: 0
      }
    };

    this.tooltip.attach(sprite, () => this.getCombatUnitTooltip(unit));
    sprite.on("pointerover", () => this.showAttackPreviewForUnit(unit));
    sprite.on("pointerout", () => this.clearAttackPreview(unit));
    this.syncCombatLabels(unit);
    this.updateCombatUnitUi(unit);
    return unit;
  }

  clearPlanningSprites() {
    this.planningSprites.forEach((s) => s.destroy());
    this.planningSprites = [];
  }

  clearCombatSprites() {
    this.combatSprites.forEach((s) => s.destroy());
    this.combatSprites = [];
    this.combatUnits = [];
    this.highlightLayer.clear();
    this.clearAttackPreview();
  }

  canPreviewAttack(unit) {
    return Boolean(
      unit &&
        unit.alive &&
        this.phase === PHASE.COMBAT &&
        !this.settingsVisible &&
        !this.isActing &&
        unit.statuses?.freeze <= 0 &&
        unit.statuses?.stun <= 0 &&
        unit.statuses?.sleep <= 0
    );
  }

  showAttackPreviewForUnit(unit) {
    if (!this.canPreviewAttack(unit)) {
      this.clearAttackPreview();
      return;
    }
    const target = this.selectTarget(unit, { deterministic: true });
    if (!target) {
      this.clearAttackPreview();
      return;
    }
    const impact = this.getPreviewImpact(unit, target);
    if (!impact.cells.length) {
      this.clearAttackPreview();
      return;
    }

    this.previewHoverUnit = unit;
    this.attackPreviewLayer?.clear();
    impact.cells.forEach((cell) => {
      const tile = this.tileLookup.get(gridKey(cell.row, cell.col));
      if (!tile) return;
      const isPrimary = cell.row === impact.primary.row && cell.col === impact.primary.col;
      this.attackPreviewLayer?.fillStyle(isPrimary ? 0xffcc6a : 0x6fd6ff, isPrimary ? 0.28 : 0.18);
      this.attackPreviewLayer?.lineStyle(isPrimary ? 3 : 2, isPrimary ? 0xffefb5 : 0xb8ebff, 0.95);
      this.drawDiamond(this.attackPreviewLayer, tile.center.x, tile.center.y);
    });
    this.drawAttackPreviewSword(impact.primary.row, impact.primary.col, unit);
  }

  clearAttackPreview(unit = null) {
    if (unit && this.previewHoverUnit && this.previewHoverUnit.uid !== unit.uid) return;
    this.previewHoverUnit = null;
    this.attackPreviewLayer?.clear();
    if (this.attackPreviewSword) {
      this.attackPreviewSword.clear();
      this.attackPreviewSword.setVisible(false);
    }
  }

  drawAttackPreviewSword(row, col, attacker) {
    if (!this.attackPreviewSword) return;
    const tile = this.tileLookup.get(gridKey(row, col));
    if (!tile) return;
    const attackerPoint = this.gridToScreen(attacker.col, attacker.row);
    const dx = tile.center.x - attackerPoint.x;
    const dir = Math.abs(dx) < 2 ? (attacker.side === "LEFT" ? 1 : -1) : dx >= 0 ? 1 : -1;
    const g = this.attackPreviewSword;
    const cy = tile.center.y - 12;
    const cx = tile.center.x;
    const bladeLen = 24;
    const half = bladeLen * 0.5;
    const startX = cx - half * dir;
    const endX = cx + half * dir;
    const tipX = endX + 7 * dir;

    g.clear();
    g.lineStyle(3, 0xfff1c7, 1);
    g.beginPath();
    g.moveTo(startX, cy);
    g.lineTo(endX, cy);
    g.strokePath();

    g.fillStyle(0xffd56a, 1);
    g.fillTriangle(endX, cy - 5, endX, cy + 5, tipX, cy);

    g.lineStyle(3, 0xc4d5e8, 1);
    g.beginPath();
    g.moveTo(startX, cy - 6);
    g.lineTo(startX, cy + 6);
    g.strokePath();

    g.lineStyle(2, 0x8ba3bd, 1);
    g.beginPath();
    g.moveTo(startX - 4 * dir, cy);
    g.lineTo(startX - 9 * dir, cy);
    g.strokePath();

    g.setDepth(tile.center.y + 22);
    g.setVisible(true);
  }

  getPreviewImpact(attacker, target) {
    const enemySide = attacker.side === "LEFT" ? "RIGHT" : "LEFT";
    const allies = this.getCombatUnits(attacker.side);
    const enemies = this.getCombatUnits(enemySide);
    const skill = SKILL_LIBRARY[attacker.skillId];
    const impactCells = this.collectSkillPreviewCells(attacker, target, skill, allies, enemies);
    const hasTarget = impactCells.some((cell) => cell.row === target.row && cell.col === target.col);
    const primary = hasTarget ? { row: target.row, col: target.col } : impactCells[0] ?? { row: target.row, col: target.col };
    return { primary, cells: impactCells };
  }

  collectSkillPreviewCells(attacker, target, skill, allies, enemies) {
    const cells = [];
    const pushCell = (row, col) => {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
      cells.push({ row, col });
    };
    const pushUnits = (units) => units.forEach((u) => pushCell(u.row, u.col));

    if (!skill) {
      pushCell(target.row, target.col);
      return this.dedupePreviewCells(cells);
    }

    switch (skill.effect) {
      case "cross_5":
        pushCell(target.row, target.col);
        pushCell(target.row - 1, target.col);
        pushCell(target.row + 1, target.col);
        pushCell(target.row, target.col - 1);
        pushCell(target.row, target.col + 1);
        break;
      case "row_multi":
        pushUnits(
          enemies
            .filter((enemy) => enemy.row === target.row)
            .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
            .slice(0, skill.maxHits ?? 3)
        );
        break;
      case "column_freeze":
        pushUnits(enemies.filter((enemy) => enemy.col === target.col));
        break;
      case "aoe_circle":
      case "aoe_poison":
      case "cone_smash":
        pushUnits(enemies.filter((enemy) => Math.abs(enemy.row - target.row) <= 1 && Math.abs(enemy.col - target.col) <= 1));
        break;
      case "column_plus_splash":
        pushUnits(enemies.filter((enemy) => enemy.col === target.col || enemy.col === target.col - 1 || enemy.col === target.col + 1));
        break;
      case "row_cleave":
        pushUnits(enemies.filter((enemy) => enemy.row === target.row));
        break;
      case "ally_row_def_buff":
        pushUnits(allies.filter((ally) => ally.row === attacker.row));
        break;
      case "dual_heal":
        pushUnits(
          allies
            .filter((ally) => ally.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
            .slice(0, 2)
        );
        break;
      case "shield_cleanse": {
        const lowest = allies.filter((ally) => ally.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (lowest) pushCell(lowest.row, lowest.col);
        break;
      }
      case "team_rage":
        pushUnits(
          allies
            .filter((ally) => ally.uid !== attacker.uid)
            .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
            .slice(0, skill.maxTargets ?? 3)
        );
        break;
      case "column_bless":
        pushUnits(allies.filter((ally) => ally.col === attacker.col));
        break;
      default:
        pushCell(target.row, target.col);
        break;
    }

    if (!cells.length) pushCell(target.row, target.col);
    return this.dedupePreviewCells(cells);
  }

  dedupePreviewCells(cells) {
    const map = new Map();
    cells.forEach((cell) => {
      const key = gridKey(cell.row, cell.col);
      if (!map.has(key)) map.set(key, cell);
    });
    return [...map.values()];
  }

  refreshPlanningUi() {
    this.refreshRoundBackground();
    this.refreshHeader();
    this.refreshButtons();
    this.refreshShopUi();
    this.refreshBenchUi();
    this.refreshBoardUi();
    this.refreshSynergyPreview();
    this.refreshQueuePreview();
  }

  refreshHeader() {
    const xpNeed = getXpToLevelUp(this.player.level);
    const xpText = xpNeed === Number.POSITIVE_INFINITY ? "TỐI ĐA" : `${this.player.xp}/${xpNeed}`;
    const deployText = `${this.getDeployCount()}/${this.getDeployCap()}`;
    const modeLabel = this.player.gameMode === "PVE_SANDBOX" ? "Sandbox" : "Hành trình";
    this.headerText.setText(
      `Vòng ${this.player.round}  •  Máu ${this.player.hp}  •  Vàng ${this.player.gold}  •  Cấp ${this.player.level}  •  XP ${xpText}  •  Triển khai ${deployText}  •  AI ${AI_SETTINGS[this.aiMode].label}  •  ${modeLabel}`
    );
    this.phaseText.setText(`${this.getPhaseLabel(this.phase)}`);
    this.updateLogText();
  }

  getPhaseLabel(phase) {
    if (phase === PHASE.PLANNING) return "Chuẩn bị";
    if (phase === PHASE.AUGMENT) return "Chọn pháp ấn";
    if (phase === PHASE.COMBAT) return "Giao tranh";
    if (phase === PHASE.GAME_OVER) return "Kết thúc";
    return phase;
  }

  refreshButtons() {
    if (!this.buttons.roll || !this.buttons.xp || !this.buttons.lock || !this.buttons.start) {
      this.buttons.settings?.setLabel("Cài đặt");
      this.buttons.settings?.setEnabled(true);
      this.buttons.history?.setLabel(`Xem lịch sử (${this.logHistory.length})`);
      this.buttons.history?.setEnabled(true);
      return;
    }
    const planning = this.phase === PHASE.PLANNING;
    const lock = this.player.shopLocked ? "Bật" : "Tắt";
    const rollCost = Math.max(1, 2 + this.player.rollCostDelta);

    this.buttons.roll.setLabel(`Đổi tướng (${rollCost})`);
    this.buttons.xp.setLabel("Mua XP (4)");
    this.buttons.lock.setLabel(`Khóa: ${lock}`);
    this.buttons.start.setLabel("BẮT ĐẦU GIAO TRANH");
    this.buttons.settings?.setLabel("Cài đặt");
    this.buttons.history?.setLabel(`Xem lịch sử (${this.logHistory.length})`);

    this.buttons.roll.setEnabled(planning);
    this.buttons.xp.setEnabled(planning);
    this.buttons.lock.setEnabled(planning);
    this.buttons.start.setEnabled(planning && this.getDeployCount() > 0);
    this.buttons.reset?.setEnabled(true);
    this.buttons.easy?.setEnabled(true);
    this.buttons.medium?.setEnabled(true);
    this.buttons.hard?.setEnabled(true);
    this.buttons.history?.setEnabled(true);

    this.buttons.easy?.setLabel(LEVEL_LABEL.EASY);
    this.buttons.medium?.setLabel(LEVEL_LABEL.MEDIUM);
    this.buttons.hard?.setLabel(LEVEL_LABEL.HARD);
  }

  refreshShopUi() {
    this.shopCards.forEach((card) => {
      card.bg.destroy();
      card.text.destroy();
    });
    this.shopCards = [];

    const startX = 40;
    const y = 450;
    const cardW = 132;
    const cardH = 140;
    for (let i = 0; i < 5; i += 1) {
      const x = startX + i * (cardW + 8);
      const offer = this.player.shop[i];
      const base = offer ? UNIT_BY_ID[offer.baseId] : null;
      const roleTheme = base ? this.getRoleTheme(base.classType) : null;
      const cardFill = base ? roleTheme.card : 0x1f2a3a;
      const cardStroke = base ? roleTheme.stroke : 0x6fb0ff;
      const cardHover = base ? roleTheme.cardHover : 0x2b3f5d;
      const bg = this.add.rectangle(x + cardW / 2, y + cardH / 2, cardW, cardH, cardFill, 0.95);
      bg.setStrokeStyle(2, cardStroke, 1);
      bg.setDepth(1500);

      let txt = "SOLD";
      if (offer) {
        txt = `${base.name}\nTier ${base.tier} (${base.tier}g)\n${base.tribe}/${base.classType}\nR:${base.stats.rageMax}`;
      }

      const text = this.add.text(x + 8, y + 8, txt, {
        fontFamily: "Consolas",
        fontSize: "12px",
        color: "#e8f3ff",
        wordWrap: { width: cardW - 14 },
        lineSpacing: 3
      });
      text.setDepth(1501);
      this.shopCards.push({ bg, text });

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.buyFromShop(i));
      bg.on("pointerover", () => {
        if (this.phase === PHASE.PLANNING) bg.setFillStyle(cardHover, 0.95);
      });
      bg.on("pointerout", () => bg.setFillStyle(cardFill, 0.95));
    }
  }

  refreshBenchUi() {
    const cap = this.getBenchCap();
    this.benchSlots.forEach((slot, index) => {
      if (index >= cap) {
        slot.bg.setVisible(false);
        slot.label.setVisible(false);
        return;
      }
      slot.bg.setVisible(true);
      slot.label.setVisible(true);
      const unit = this.player.bench[index];
      const selected = this.selectedBenchIndex === index;

      if (!unit) {
        slot.bg.setStrokeStyle(2, selected ? 0xffef9a : 0x4f607c, 1);
        slot.bg.setFillStyle(selected ? 0x36466a : 0x1f2734, 0.92);
        slot.label.setText(`[${index + 1}] Empty`);
      } else {
        const roleTheme = this.getRoleTheme(unit.base.classType);
        slot.bg.setStrokeStyle(2, selected ? 0xffef9a : roleTheme.stroke, 1);
        slot.bg.setFillStyle(selected ? roleTheme.cardHover : roleTheme.bench, 0.92);
        slot.label.setText(`${unit.base.name}\n${unit.star}* T${unit.base.tier}\n${unit.base.tribe}/${unit.base.classType}`);
      }
    });
  }

  refreshBoardUi() {
    this.clearPlanningSprites();
    if (this.phase !== PHASE.PLANNING && this.phase !== PHASE.AUGMENT) return;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const unit = this.player.board[row][col];
        if (!unit) continue;
        const point = this.gridToScreen(col, row);
        const roleTheme = this.getRoleTheme(unit.base.classType);
        const visual = getUnitVisual(unit.baseId, unit.base.classType);
        const glow = this.add.circle(point.x, point.y - 10, 30, roleTheme.glow, 0.22);
        glow.setDepth(point.y + 13);
        const sprite = this.add.circle(point.x, point.y - 10, 22, roleTheme.fill, 1);
        sprite.setStrokeStyle(2, roleTheme.stroke, 1);
        sprite.setDepth(point.y + 15);
        const icon = this.add.text(point.x, point.y - 10, visual.icon, {
          fontFamily: "Segoe UI Emoji",
          fontSize: "32px",
          color: "#ffffff"
        }).setOrigin(0.5);
        icon.setDepth(point.y + 17);
        const label = this.add.text(point.x + 15, point.y - 35, `${unit.star}★`, {
          fontFamily: UI_FONT,
          fontSize: "12px",
          color: "#ffffff",
          fontStyle: "bold"
        });
        label.setDepth(point.y + 16);
        this.planningSprites.push(glow, sprite, icon, label);
      }
    }
  }

  refreshSynergyPreview() {
    const deployed =
      this.phase === PHASE.COMBAT && Array.isArray(this.combatUnits) && this.combatUnits.length
        ? this.getCombatUnits("LEFT")
        : (() => {
            const items = [];
            for (let row = 0; row < ROWS; row += 1) {
              for (let col = 0; col < PLAYER_COLS; col += 1) {
                const unit = this.player.board[row][col];
                if (unit) items.push(unit);
              }
            }
            return items;
          })();
    const summary = this.computeSynergyCounts(deployed, "LEFT");
    const classLines = Object.keys(summary.classCounts)
      .sort((a, b) => summary.classCounts[b] - summary.classCounts[a])
      .map((key) => `${getClassLabelVi(key)}: ${summary.classCounts[key]}`);
    const tribeLines = Object.keys(summary.tribeCounts)
      .sort((a, b) => summary.tribeCounts[b] - summary.tribeCounts[a])
      .map((key) => `${getTribeLabelVi(key)}: ${summary.tribeCounts[key]}`);
    const aug = this.player.augments.length ? this.player.augments.join(", ") : null;
    const classText = classLines.length ? classLines.map((line) => `• ${line}`).join("\n") : "• Chưa kích nghề";
    const tribeText = tribeLines.length ? tribeLines.map((line) => `• ${line}`).join("\n") : "• Chưa kích tộc";
    const augText = aug ? aug.split(", ").map((line) => `• ${line}`).join("\n") : "• Chưa có pháp ấn";
    this.synergyText.setText(
      `Nghề\n${classText}\n\nTộc\n${tribeText}\n\nPháp ấn\n${augText}`
    );
  }

  refreshQueuePreview() {
    if (this.phase !== PHASE.COMBAT) {
      this.queueText.setText(`• Đang chuẩn bị giao tranh\n• Vòng ${this.player?.round ?? 1}\n• Linh thú địch: ${this.getCombatUnits("RIGHT").length}`);
      return;
    }
    const next = [];
    for (let i = 0; i < 8; i += 1) {
      const idx = this.turnIndex + i;
      if (idx >= this.turnQueue.length) break;
      const unit = this.turnQueue[idx];
      if (!unit || !unit.alive) continue;
      next.push(`${i + 1}. ${unit.name} (${unit.side === "LEFT" ? "Ta" : "Địch"})`);
    }
    this.queueText.setText(`• Thứ tự lượt tiếp theo\n${next.join("\n") || "Đã hết lượt."}`);
  }

  inferLogCategory(message) {
    const text = String(message ?? "").toLowerCase();
    if (
      text.includes("giao tranh") ||
      text.includes("thang") ||
      text.includes("thua") ||
      text.includes("danh") ||
      text.includes("dung ky nang") ||
      text.includes("tu chien") ||
      text.includes("combat")
    ) {
      return "COMBAT";
    }
    if (
      text.includes("mua") ||
      text.includes("shop") ||
      text.includes("roll") ||
      text.includes("xp") ||
      text.includes("khoa")
    ) {
      return "SHOP";
    }
    if (text.includes("ghep") || text.includes("vat pham") || text.includes("craft")) {
      return "CRAFT";
    }
    return "EVENT";
  }

  addLog(message, category = null) {
    const safeMessage = String(message ?? "");
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      round: this.player?.round ?? 1,
      phase: this.phase,
      category: category ?? this.inferLogCategory(safeMessage),
      message: safeMessage
    };
    this.logHistory.push(entry);
    while (this.logHistory.length > 300) this.logHistory.shift();

    this.logs.push(safeMessage);
    while (this.logs.length > 6) this.logs.shift();

    this.updateLogText();
    if (this.historyModalVisible) this.refreshHistoryModal();
  }

  updateLogText() {
    const latest = this.logs.length ? this.logs[this.logs.length - 1] : null;
    this.logText.setText(latest ? `- ${latest}` : "- Chưa có sự kiện.");
    this.buttons.history?.setLabel(`Xem lịch sử (${this.logHistory.length})`);
  }

  getCombatUnitTooltip(unit) {
    if (!unit) return { title: "Không rõ", body: "Không có dữ liệu giao tranh." };
    const visual = getUnitVisual(unit.baseId, unit.classType);
    const skill = SKILL_LIBRARY[unit.skillId];
    const classDef = CLASS_SYNERGY[unit.classType];
    const tribeDef = TRIBE_SYNERGY[unit.tribe];
    return {
      title: `${visual.icon} ${visual.nameVi} ${unit.star}★ [${unit.side === "LEFT" ? "Ta" : "Địch"}]`,
      body: [
        `${getTribeLabelVi(unit.tribe)}/${getClassLabelVi(unit.classType)} | Táº§m ${unit.range}`,
        `HP ${unit.hp}/${unit.maxHp}${unit.shield ? ` +S${unit.shield}` : ""}`,
        `ATK ${this.getEffectiveAtk(unit)} | DEF ${this.getEffectiveDef(unit)} | MATK ${this.getEffectiveMatk(unit)} | MDEF ${this.getEffectiveMdef(unit)}`,
        `Nộ ${unit.rage}/${unit.rageMax}`,
        `Kỹ năng: ${skill?.name ?? "Đánh thường"}`,
        this.describeSkill(skill),
        `Mốc nghề: ${classDef?.thresholds?.join("/") ?? "-"}`,
        `Mốc tộc: ${tribeDef?.thresholds?.join("/") ?? "-"}`
      ].join("\n")
    };
  }

  getSynergyTooltip() {
    const leftTeam = this.getCombatUnits("LEFT");
    const rightTeam = this.getCombatUnits("RIGHT");
    const leftSummary = this.computeSynergyCounts(leftTeam, "LEFT");
    const rightSummary = this.computeSynergyCounts(rightTeam, "RIGHT");
    const lines = [];

    const pushSide = (title, summary) => {
      lines.push(title);
      Object.entries(summary.classCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
          const def = CLASS_SYNERGY[key];
          if (!def) return;
          const tier = this.getSynergyTier(count, def.thresholds);
          lines.push(`Nghề ${getClassLabelVi(key)}: ${count} -> ${tier >= 0 ? this.formatBonusSet(def.bonuses[tier]) : "chưa kích"}`);
        });
      Object.entries(summary.tribeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
          const def = TRIBE_SYNERGY[key];
          if (!def) return;
          const tier = this.getSynergyTier(count, def.thresholds);
          lines.push(`Tộc ${getTribeLabelVi(key)}: ${count} -> ${tier >= 0 ? this.formatBonusSet(def.bonuses[tier]) : "chưa kích"}`);
        });
      lines.push("");
    };

    pushSide("Đội Ta:", leftSummary);
    pushSide("Đội Địch:", rightSummary);

    if (this.player?.augments?.length) {
      lines.push("Pháp ấn:");
      this.player.augments.forEach((id) => {
        const aug = AUGMENT_LIBRARY.find((x) => x.id === id);
        if (!aug) return;
        lines.push(`- ${aug.name}: ${aug.description}`);
      });
    }

    return {
      title: "Chi tiết synergy giao tranh",
      body: lines.filter(Boolean).join("\n")
    };
  }

  getSynergyTier(count, thresholds) {
    let idx = -1;
    for (let i = 0; i < thresholds.length; i += 1) {
      if (count >= thresholds[i]) idx = i;
    }
    return idx;
  }

  formatBonusSet(bonus) {
    if (!bonus) return "no bonus";
    return Object.entries(bonus)
      .map(([k, v]) => `${k}:${typeof v === "number" && v < 1 ? `${Math.round(v * 100)}%` : v}`)
      .join(", ");
  }

  describeSkill(skill) {
    if (!skill) return "Không có kỹ năng chủ động.";
    const lines = [`Mẫu thi triển: ${skill.actionPattern}`];
    if (skill.effect) lines.push(`Hiệu ứng: ${this.translateSkillEffect(skill.effect)}`);
    if (skill.damageType) lines.push(`Loại sát thương: ${this.translateDamageType(skill.damageType)}`);
    if (skill.base != null && skill.scale != null) lines.push(`Công thức: ${skill.base} + chỉ số * ${skill.scale}`);
    if (skill.freezeChance != null) lines.push(`Đóng băng: ${(skill.freezeChance * 100).toFixed(0)}%`);
    if (skill.stunChance != null) lines.push(`Choáng: ${(skill.stunChance * 100).toFixed(0)}%`);
    if (skill.sleepChance != null) lines.push(`Ngủ: ${(skill.sleepChance * 100).toFixed(0)}%`);
    if (skill.maxHits != null) lines.push(`Số mục tiêu: ${skill.maxHits}`);
    if (skill.shieldBase != null) lines.push(`Khiên cơ bản: ${skill.shieldBase}`);
    return lines.join(" | ");
  }

  translateDamageType(type) {
    if (type === "physical") return "Vật lý";
    if (type === "magic") return "Phép";
    if (type === "true") return "Chuẩn";
    return type ?? "-";
  }

  translateSkillEffect(effect) {
    const map = {
      damage_shield_taunt: "Gây sát thương + khiên + khiêu khích",
      damage_stun: "Gây sát thương + choáng",
      damage_shield_reflect: "Gây sát thương + khiên phản đòn",
      ally_row_def_buff: "Tăng giáp/kháng phép theo hàng",
      single_burst: "Dồn sát thương đơn mục tiêu",
      double_hit: "Đánh hai lần",
      single_burst_lifesteal: "Dồn sát thương + hút máu",
      single_delayed_echo: "Sát thương + nổ dội",
      cross_5: "Sát thương hình chữ thập 5 ô",
      row_multi: "Bắn xuyên theo hàng",
      single_sleep: "Sát thương + gây ngủ",
      single_armor_break: "Sát thương + giảm giáp",
      column_freeze: "Cột băng + đóng băng",
      aoe_circle: "Nổ vùng tròn",
      column_plus_splash: "Đánh cột + lan cạnh",
      aoe_poison: "Độc diện rộng",
      dual_heal: "Hồi máu 2 đồng minh",
      shield_cleanse: "Tạo khiên + thanh tẩy",
      team_rage: "Tăng nộ đồng minh",
      column_bless: "Cường hóa theo cột",
      row_cleave: "Quét hàng",
      self_atk_and_assist: "Tự cường hóa + đánh phụ trợ",
      cone_smash: "Nện hình nón",
      true_single: "Sát thương chuẩn đơn mục tiêu"
    };
    return map[effect] ?? effect;
  }

  getAI() {
    return AI_SETTINGS[this.aiMode];
  }

  computeSynergyCounts(units, side) {
    const classCounts = {};
    const tribeCounts = {};
    units.forEach((unit) => {
      classCounts[unit.classType] = (classCounts[unit.classType] ?? 0) + 1;
      tribeCounts[unit.tribe] = (tribeCounts[unit.tribe] ?? 0) + 1;
    });
    if (side === "LEFT" && units.length > 0) {
      if (this.player.extraClassCount > 0) {
        const topClass = Object.keys(classCounts).sort((a, b) => classCounts[b] - classCounts[a])[0];
        if (topClass) classCounts[topClass] += this.player.extraClassCount;
      }
      if (this.player.extraTribeCount > 0) {
        const topTribe = Object.keys(tribeCounts).sort((a, b) => tribeCounts[b] - tribeCounts[a])[0];
        if (topTribe) tribeCounts[topTribe] += this.player.extraTribeCount;
      }
    }
    return { classCounts, tribeCounts };
  }

  applySynergyBonuses(side) {
    const team = this.getCombatUnits(side);
    const summary = this.computeSynergyCounts(team, side);

    team.forEach((unit) => {
      const classDef = CLASS_SYNERGY[unit.classType];
      if (classDef) {
        const bonus = this.getSynergyBonus(classDef, summary.classCounts[unit.classType] ?? 0);
        this.applyBonusToUnit(unit, bonus);
      }

      const tribeDef = TRIBE_SYNERGY[unit.tribe];
      if (tribeDef) {
        const bonus = this.getSynergyBonus(tribeDef, summary.tribeCounts[unit.tribe] ?? 0);
        this.applyBonusToUnit(unit, bonus);
      }

      unit.rage = Math.min(unit.rageMax, unit.rage + (unit.mods.startingRage || 0));
      unit.shield += unit.mods.shieldStart || 0;
      this.updateCombatUnitUi(unit);
    });
  }

  getSynergyBonus(def, count) {
    let bonus = null;
    for (let i = 0; i < def.thresholds.length; i += 1) {
      if (count >= def.thresholds[i]) bonus = def.bonuses[i];
    }
    return bonus;
  }

  applyBonusToUnit(unit, bonus) {
    if (!bonus) return;
    if (bonus.defFlat) unit.def += bonus.defFlat;
    if (bonus.mdefFlat) unit.mdef += bonus.mdefFlat;
    if (bonus.hpPct) {
      const add = Math.round(unit.maxHp * bonus.hpPct);
      unit.maxHp += add;
      unit.hp += add;
    }
    if (bonus.atkPct) unit.atk = Math.round(unit.atk * (1 + bonus.atkPct));
    if (bonus.matkPct) unit.matk = Math.round(unit.matk * (1 + bonus.matkPct));
    if (bonus.healPct) unit.mods.healPct += bonus.healPct;
    if (bonus.shieldStart) unit.mods.shieldStart += bonus.shieldStart;
    if (bonus.startingRage) unit.mods.startingRage += bonus.startingRage;
    if (bonus.critPct) unit.mods.critPct += bonus.critPct;
    if (bonus.burnOnHit) unit.mods.burnOnHit += bonus.burnOnHit;
    if (bonus.poisonOnHit) unit.mods.poisonOnHit += bonus.poisonOnHit;
  }

  buildTurnQueue() {
    const leftOrder = this.buildOrderForSide("LEFT");
    const rightOrder = this.buildOrderForSide("RIGHT");
    const maxLen = Math.max(leftOrder.length, rightOrder.length);
    const queue = [];
    for (let i = 0; i < maxLen; i += 1) {
      if (leftOrder[i]) queue.push(leftOrder[i]);
      if (rightOrder[i]) queue.push(rightOrder[i]);
    }
    this.turnQueue = queue;
    this.turnIndex = 0;
  }

  buildOrderForSide(side) {
    const list = [];
    for (let row = 0; row < ROWS; row += 1) {
      if (side === "LEFT") {
        for (let col = 4; col >= 0; col -= 1) {
          const unit = this.getCombatUnitAt(side, row, col);
          if (unit) list.push(unit);
        }
      } else {
        for (let col = 5; col <= 9; col += 1) {
          const unit = this.getCombatUnitAt(side, row, col);
          if (unit) list.push(unit);
        }
      }
    }
    return list;
  }

  getCombatUnits(side) {
    return this.combatUnits.filter((u) => u.alive && u.side === side);
  }

  getCombatUnitAt(side, row, col) {
    return this.combatUnits.find((u) => u.alive && u.side === side && u.row === row && u.col === col);
  }
  async stepCombat() {
    if (this.phase !== PHASE.COMBAT) return;
    if (this.isActing) return;
    this.clearAttackPreview();

    const leftAlive = this.getCombatUnits("LEFT").length;
    const rightAlive = this.getCombatUnits("RIGHT").length;
    if (!leftAlive || !rightAlive) {
      this.resolveCombat(leftAlive > 0 ? "LEFT" : "RIGHT");
      return;
    }

    if (this.turnQueue.length === 0 || this.turnIndex >= this.turnQueue.length) {
      this.buildTurnQueue();
      if (!this.turnQueue.length) {
        this.resolveCombat("RIGHT");
        return;
      }
    }

    const actor = this.turnQueue[this.turnIndex];
    this.turnIndex += 1;
    if (!actor || !actor.alive) {
      this.refreshQueuePreview();
      return;
    }

    this.actionCount += 1;
    if (this.actionCount > 100 && this.actionCount % 5 === 0) {
      this.globalDamageMult += 0.2;
      this.addLog(`Tử chiến x${this.globalDamageMult.toFixed(1)} sát thương.`);
    }

    this.isActing = true;
    this.highlightUnit(actor, 0xffef9f);
    const skipped = this.processStartTurn(actor);
    if (skipped) {
      this.addLog(`${actor.name} bỏ lượt (${skipped}).`);
    } else {
      const target = this.selectTarget(actor);
      if (target) {
        if (actor.rage >= actor.rageMax && actor.statuses.silence <= 0) {
          actor.rage = 0;
          this.updateCombatUnitUi(actor);
          await this.castSkill(actor, target);
        } else {
          await this.basicAttack(actor, target);
        }
      }
    }

    this.clearHighlights();
    this.refreshQueuePreview();
    this.refreshHeader();
    this.isActing = false;

    const leftNow = this.getCombatUnits("LEFT").length;
    const rightNow = this.getCombatUnits("RIGHT").length;
    if (!leftNow || !rightNow) {
      this.resolveCombat(leftNow > 0 ? "LEFT" : "RIGHT");
    } else if (this.actionCount >= 240) {
      const leftHp = this.getCombatUnits("LEFT").reduce((s, u) => s + u.hp, 0);
      const rightHp = this.getCombatUnits("RIGHT").reduce((s, u) => s + u.hp, 0);
      this.resolveCombat(leftHp >= rightHp ? "LEFT" : "RIGHT");
    }
  }

  processStartTurn(unit) {
    this.tickTimedStatus(unit, "tauntTurns");
    this.tickTimedStatus(unit, "silence");
    this.tickTimedStatus(unit, "armorBreakTurns");
    this.tickTimedStatus(unit, "reflectTurns");
    this.tickTimedStatus(unit, "atkBuffTurns");
    this.tickTimedStatus(unit, "defBuffTurns");
    this.tickTimedStatus(unit, "mdefBuffTurns");

    if (unit.statuses.burnTurns > 0) {
      this.resolveDamage(null, unit, unit.statuses.burnDamage, "true", "BURN", { noRage: true, noReflect: true });
      unit.statuses.burnTurns -= 1;
    }
    if (unit.statuses.poisonTurns > 0) {
      this.resolveDamage(null, unit, unit.statuses.poisonDamage, "true", "POISON", { noRage: true, noReflect: true });
      unit.statuses.poisonTurns -= 1;
    }

    if (!unit.alive) return "dot";

    if (unit.statuses.freeze > 0) {
      unit.statuses.freeze -= 1;
      this.updateCombatUnitUi(unit);
      return "freeze";
    }
    if (unit.statuses.stun > 0) {
      unit.statuses.stun -= 1;
      this.updateCombatUnitUi(unit);
      return "stun";
    }
    if (unit.statuses.sleep > 0) {
      unit.statuses.sleep -= 1;
      this.updateCombatUnitUi(unit);
      return "sleep";
    }

    this.updateCombatUnitUi(unit);
    return null;
  }

  tickTimedStatus(unit, key) {
    if (unit.statuses[key] > 0) unit.statuses[key] -= 1;
    if (key === "tauntTurns" && unit.statuses.tauntTurns <= 0) {
      unit.statuses.tauntTargetId = null;
      unit.statuses.tauntTurns = 0;
    }
    if (key === "armorBreakTurns" && unit.statuses.armorBreakTurns <= 0) {
      unit.statuses.armorBreakValue = 0;
      unit.statuses.armorBreakTurns = 0;
    }
    if (key === "reflectTurns" && unit.statuses.reflectTurns <= 0) {
      unit.statuses.reflectPct = 0;
      unit.statuses.reflectTurns = 0;
    }
  }

  selectTarget(attacker, options = {}) {
    const enemySide = attacker.side === "LEFT" ? "RIGHT" : "LEFT";
    const enemies = this.getCombatUnits(enemySide);
    if (!enemies.length) return null;

    if (attacker.statuses.tauntTargetId) {
      const forced = enemies.find((e) => e.uid === attacker.statuses.tauntTargetId);
      if (forced) return forced;
    }

    const ai = this.getAI();
    if (attacker.side === "RIGHT" && !options.deterministic && Math.random() < ai.randomTargetChance) {
      return randomItem(enemies);
    }

    const sorted = [...enemies].sort((a, b) => this.compareTargets(attacker, a, b));
    return sorted[0];
  }

  compareTargets(attacker, a, b) {
    const sa = this.scoreTarget(attacker, a);
    const sb = this.scoreTarget(attacker, b);
    for (let i = 0; i < sa.length; i += 1) {
      if (sa[i] !== sb[i]) return sa[i] - sb[i];
    }
    return 0;
  }

  scoreTarget(attacker, target) {
    const sameRow = target.row === attacker.row ? 0 : 1;
    const lineDist = manhattan(attacker, target);
    const frontlineDist = this.distanceToFrontline(target);
    const backlineDist = this.distanceToBackline(target);
    const hpRatio = Math.round((target.hp / target.maxHp) * 1000);
    const hpRaw = target.hp;

    if (attacker.classType === "ASSASSIN") {
      return [backlineDist, hpRatio, lineDist, frontlineDist, hpRaw];
    }
    if (attacker.classType === "ARCHER" || attacker.classType === "MAGE") {
      return [sameRow, lineDist, frontlineDist, hpRatio, hpRaw];
    }
    return [frontlineDist, lineDist, sameRow, hpRatio, hpRaw];
  }

  distanceToFrontline(unit) {
    if (unit.side === "LEFT") return 4 - unit.col;
    return unit.col - 5;
  }

  distanceToBackline(unit) {
    if (unit.side === "LEFT") return unit.col;
    return 9 - unit.col;
  }

  async basicAttack(attacker, target) {
    const pattern = attacker.range >= 2 ? "RANGED_STATIC" : attacker.classType === "ASSASSIN" ? "ASSASSIN_BACK" : "MELEE_FRONT";
    await this.runActionPattern(attacker, target, pattern, async () => {
      const raw = this.getEffectiveAtk(attacker) + Phaser.Math.Between(-5, 6);
      this.audioFx.play("hit");
      this.vfx?.slash(attacker.sprite.x, attacker.sprite.y, target.sprite.x, target.sprite.y, 0xff9f8c);
      this.resolveDamage(attacker, target, raw, "physical", "BASIC");
    });
    this.addLog(`${attacker.name} đánh ${target.name}.`);
  }

  async castSkill(attacker, target) {
    const skill = SKILL_LIBRARY[attacker.skillId];
    if (!skill) {
      await this.basicAttack(attacker, target);
      return;
    }

    this.audioFx.play("skill");
    await this.runActionPattern(attacker, target, skill.actionPattern, async () => {
      this.vfx?.pulseAt(target.sprite.x, target.sprite.y - 8, 0xb6dbff, 16, 220);
      await this.applySkillEffect(attacker, target, skill);
    });
    this.addLog(`${attacker.name} dùng kỹ năng ${skill.name}.`);
  }

  async runActionPattern(attacker, target, pattern, impactFn) {
    if (pattern === "SELF" || pattern === "RANGED_STATIC") {
      if (pattern === "RANGED_STATIC") {
        this.vfx?.slash(attacker.sprite.x, attacker.sprite.y, target.sprite.x, target.sprite.y, 0xbad6ff, 140);
      }
      await impactFn();
      return;
    }

    const back = pattern === "ASSASSIN_BACK";
    const deltaFront = attacker.side === "LEFT" ? -1 : 1;
    const deltaBack = -deltaFront;
    const dashCol = clamp(target.col + (back ? deltaBack : deltaFront), 0, 9);
    let dashPoint = this.gridToScreen(dashCol, target.row);
    const isFrontlineTarget = this.distanceToFrontline(target) === 0;
    const isMeleeFront = !back && attacker.range <= 1;
    if (isMeleeFront && isFrontlineTarget) {
      const leftFront = this.gridToScreen(4, target.row);
      const rightFront = this.gridToScreen(5, target.row);
      dashPoint = {
        x: (leftFront.x + rightFront.x) * 0.5,
        y: (leftFront.y + rightFront.y) * 0.5
      };
    }
    const origin = this.gridToScreen(attacker.homeCol, attacker.homeRow);

    await this.tweenCombatUnit(attacker, dashPoint.x, dashPoint.y - 10, 140);
    await this.wait(35);
    await impactFn();
    await this.wait(45);
    await this.tweenCombatUnit(attacker, origin.x, origin.y - 10, 140);
  }

  async applySkillEffect(attacker, target, skill) {
    const enemies = this.getCombatUnits(attacker.side === "LEFT" ? "RIGHT" : "LEFT");
    const allies = this.getCombatUnits(attacker.side);
    const rawSkill = this.calcSkillRaw(attacker, skill);

    switch (skill.effect) {
      case "damage_shield_taunt": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        this.addShield(attacker, Math.round(skill.shieldBase + this.getEffectiveAtk(attacker) * 0.4));
        enemies.forEach((enemy) => {
          enemy.statuses.tauntTargetId = attacker.uid;
          enemy.statuses.tauntTurns = Math.max(enemy.statuses.tauntTurns, skill.tauntTurns + 1);
          this.updateCombatUnitUi(enemy);
        });
        break;
      }
      case "damage_stun": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        if (target.alive && Math.random() < skill.stunChance) {
          target.statuses.stun = Math.max(target.statuses.stun, skill.stunTurns);
          this.showFloatingText(target.sprite.x, target.sprite.y - 45, "STUN", "#ffd97b");
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "damage_shield_reflect": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        this.addShield(attacker, Math.round(skill.shieldBase + this.getEffectiveDef(attacker) * 0.5));
        attacker.statuses.reflectTurns = Math.max(attacker.statuses.reflectTurns, skill.reflectTurns);
        attacker.statuses.reflectPct = Math.max(attacker.statuses.reflectPct, skill.reflectPct);
        this.updateCombatUnitUi(attacker);
        break;
      }
      case "ally_row_def_buff": {
        allies
          .filter((ally) => ally.row === attacker.row)
          .forEach((ally) => {
            ally.statuses.defBuffTurns = Math.max(ally.statuses.defBuffTurns, skill.turns);
            ally.statuses.defBuffValue = Math.max(ally.statuses.defBuffValue, skill.armorBuff);
            ally.statuses.mdefBuffTurns = Math.max(ally.statuses.mdefBuffTurns, skill.turns);
            ally.statuses.mdefBuffValue = Math.max(ally.statuses.mdefBuffValue, skill.mdefBuff);
            this.updateCombatUnitUi(ally);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "GUARD", "#a9ebff");
          });
        break;
      }
      case "single_burst": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        break;
      }
      case "double_hit": {
        const hit1 = skill.hit1.base + this.getEffectiveAtk(attacker) * skill.hit1.scale;
        const hit2 = skill.hit2.base + this.getEffectiveAtk(attacker) * skill.hit2.scale;
        this.resolveDamage(attacker, target, hit1, skill.damageType, `${skill.name} 1`);
        if (target.alive) this.resolveDamage(attacker, target, hit2, skill.damageType, `${skill.name} 2`);
        break;
      }
      case "single_burst_lifesteal": {
        const dealt = this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        if (dealt > 0) this.healUnit(attacker, attacker, Math.round(dealt * skill.lifesteal), "LIFESTEAL");
        break;
      }
      case "single_delayed_echo": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        if (target.alive) {
          await this.wait(65);
          const echo = skill.echoBase + this.getEffectiveAtk(attacker) * skill.echoScale;
          this.resolveDamage(attacker, target, echo, skill.damageType, "ECHO");
        }
        break;
      }
      case "cross_5": {
        const points = [
          [target.row, target.col],
          [target.row - 1, target.col],
          [target.row + 1, target.col],
          [target.row, target.col - 1],
          [target.row, target.col + 1]
        ];
        enemies
          .filter((enemy) => points.some((p) => p[0] === enemy.row && p[1] === enemy.col))
          .forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name));
        break;
      }
      case "row_multi": {
        const victims = enemies
          .filter((enemy) => enemy.row === target.row)
          .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
          .slice(0, skill.maxHits);
        victims.forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name));
        break;
      }
      case "single_sleep": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        if (target.alive && Math.random() < skill.sleepChance) {
          target.statuses.sleep = Math.max(target.statuses.sleep, skill.sleepTurns);
          this.showFloatingText(target.sprite.x, target.sprite.y - 45, "SLEEP", "#d4bcff");
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "single_armor_break": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name);
        target.statuses.armorBreakTurns = Math.max(target.statuses.armorBreakTurns, skill.turns);
        target.statuses.armorBreakValue = Math.max(target.statuses.armorBreakValue, skill.armorBreak);
        this.updateCombatUnitUi(target);
        break;
      }
      case "column_freeze": {
        enemies
          .filter((enemy) => enemy.col === target.col)
          .forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name);
            if (enemy.alive && Math.random() < skill.freezeChance) {
              enemy.statuses.freeze = Math.max(enemy.statuses.freeze, skill.freezeTurns);
              this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "FREEZE", "#83e5ff");
              this.updateCombatUnitUi(enemy);
            }
          });
        break;
      }
      case "aoe_circle": {
        enemies
          .filter((enemy) => Math.abs(enemy.row - target.row) <= 1 && Math.abs(enemy.col - target.col) <= 1)
          .forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name));
        break;
      }
      case "column_plus_splash": {
        enemies.forEach((enemy) => {
          if (enemy.col === target.col) this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name);
          else if (enemy.col === target.col - 1 || enemy.col === target.col + 1) {
            this.resolveDamage(attacker, enemy, rawSkill * skill.splashRate, skill.damageType, "SPLASH");
          }
        });
        break;
      }
      case "aoe_poison": {
        enemies
          .filter((enemy) => Math.abs(enemy.row - target.row) <= 1 && Math.abs(enemy.col - target.col) <= 1)
          .forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name);
            if (enemy.alive) {
              enemy.statuses.poisonTurns = Math.max(enemy.statuses.poisonTurns, skill.poisonTurns);
              enemy.statuses.poisonDamage = Math.max(enemy.statuses.poisonDamage, skill.poisonPerTurn);
              this.updateCombatUnitUi(enemy);
            }
          });
        break;
      }
      case "dual_heal": {
        const targets = allies
          .filter((ally) => ally.alive)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
          .slice(0, 2);
        targets.forEach((ally) => this.healUnit(attacker, ally, rawSkill, skill.name));
        break;
      }
      case "shield_cleanse": {
        const lowest = allies
          .filter((ally) => ally.alive)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (!lowest) break;
        const amount = Math.round(skill.shieldBase + this.getEffectiveMatk(attacker) * skill.shieldScale);
        this.addShield(lowest, amount);
        lowest.statuses.freeze = 0;
        lowest.statuses.stun = 0;
        lowest.statuses.sleep = 0;
        lowest.statuses.silence = 0;
        lowest.statuses.burnTurns = 0;
        lowest.statuses.poisonTurns = 0;
        this.updateCombatUnitUi(lowest);
        break;
      }
      case "team_rage": {
        allies
          .filter((ally) => ally.uid !== attacker.uid)
          .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
          .slice(0, skill.maxTargets)
          .forEach((ally) => {
            ally.rage = Math.min(ally.rageMax, ally.rage + skill.rageGain);
            this.updateCombatUnitUi(ally);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "+RAGE", "#b8f5ff");
          });
        break;
      }
      case "column_bless": {
        allies
          .filter((ally) => ally.col === attacker.col)
          .forEach((ally) => {
            ally.statuses.atkBuffTurns = Math.max(ally.statuses.atkBuffTurns, skill.turns);
            ally.statuses.atkBuffValue = Math.max(ally.statuses.atkBuffValue, skill.atkBuff);
            ally.mods.evadePct = Math.max(ally.mods.evadePct, skill.evadeBuff);
            this.updateCombatUnitUi(ally);
          });
        break;
      }
      case "row_cleave": {
        enemies
          .filter((enemy) => enemy.row === target.row)
          .forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name);
            enemy.statuses.armorBreakTurns = Math.max(enemy.statuses.armorBreakTurns, skill.turns);
            enemy.statuses.armorBreakValue = Math.max(enemy.statuses.armorBreakValue, skill.armorBreak);
            this.updateCombatUnitUi(enemy);
          });
        break;
      }
      case "self_atk_and_assist": {
        attacker.statuses.atkBuffTurns = Math.max(attacker.statuses.atkBuffTurns, skill.turns);
        attacker.statuses.atkBuffValue = Math.max(attacker.statuses.atkBuffValue, skill.selfAtkBuff);
        this.resolveDamage(attacker, target, rawSkill, "physical", skill.name);
        const helper = allies.find((ally) => ally.uid !== attacker.uid && ally.row === attacker.row);
        if (helper && target.alive) {
          const assist = this.getEffectiveAtk(helper) * skill.assistRate;
          this.resolveDamage(helper, target, assist, "physical", "ASSIST");
        }
        break;
      }
      case "cone_smash": {
        enemies
          .filter((enemy) => Math.abs(enemy.row - target.row) <= 1 && Math.abs(enemy.col - target.col) <= 1)
          .forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, "physical", skill.name));
        break;
      }
      case "true_single": {
        this.resolveDamage(attacker, target, rawSkill, "true", skill.name);
        break;
      }
      default:
        this.resolveDamage(attacker, target, rawSkill, skill.damageType || "physical", skill.name);
        break;
    }
  }

  calcSkillRaw(attacker, skill) {
    const statName = skill.scaleStat || "atk";
    const sourceStat =
      statName === "atk" ? this.getEffectiveAtk(attacker) : statName === "matk" ? this.getEffectiveMatk(attacker) : attacker[statName] ?? 0;
    return skill.base + sourceStat * skill.scale;
  }
  getEffectiveAtk(unit) {
    const buff = unit.statuses.atkBuffTurns > 0 ? unit.statuses.atkBuffValue : 0;
    return Math.max(1, unit.atk + buff);
  }

  getEffectiveDef(unit) {
    const buff = unit.statuses.defBuffTurns > 0 ? unit.statuses.defBuffValue : 0;
    return Math.max(0, unit.def + buff);
  }

  getEffectiveMatk(unit) {
    return Math.max(1, unit.matk);
  }

  getEffectiveMdef(unit) {
    const buff = unit.statuses.mdefBuffTurns > 0 ? unit.statuses.mdefBuffValue : 0;
    return Math.max(0, unit.mdef + buff);
  }

  resolveDamage(attacker, defender, rawDamage, damageType, reason, options = {}) {
    if (!defender || !defender.alive) return 0;
    if (attacker && !attacker.alive) return 0;

    if (attacker && !options.forceHit) {
      if (Math.random() < defender.mods.evadePct) {
        this.audioFx.play("click");
        this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, "MISS", "#d3f2ff");
        return 0;
      }
    }

    let raw = Math.max(1, rawDamage);
    if (attacker && damageType === "physical" && Math.random() < attacker.mods.critPct) {
      raw *= 1.5;
      this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "CRIT", "#ffd785");
    }

    let final = raw;
    if (damageType === "physical") {
      const armorBreak = defender.statuses.armorBreakTurns > 0 ? defender.statuses.armorBreakValue : 0;
      const def = Math.max(0, this.getEffectiveDef(defender) - armorBreak);
      final = raw * (100 / (100 + def));
    } else if (damageType === "magic") {
      final = raw * (100 / (100 + this.getEffectiveMdef(defender)));
    }

    final *= this.globalDamageMult;
    final = Math.max(1, Math.round(final));

    let damageLeft = final;
    if (defender.shield > 0) {
      const absorbed = Math.min(defender.shield, damageLeft);
      defender.shield -= absorbed;
      damageLeft -= absorbed;
      this.vfx?.pulseAt(defender.sprite.x, defender.sprite.y - 10, 0x8ce9ff, 14, 180);
      this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, `ABS ${absorbed}`, "#86e8ff");
    }

    if (damageLeft > 0) {
      defender.hp = Math.max(0, defender.hp - damageLeft);
      this.audioFx.play("hit");
      this.vfx?.pulseAt(defender.sprite.x, defender.sprite.y - 10, 0xff8f8f, 14, 180);
      this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, `-${damageLeft}`, "#ff9b9b");
    }

    if (attacker && !options.noRage) {
      const gain = attacker.side === "RIGHT" ? this.getAI().rageGain : 1;
      attacker.rage = Math.min(attacker.rageMax, attacker.rage + gain);
    }
    if (!options.noRage) defender.rage = Math.min(defender.rageMax, defender.rage + 1);

    if (attacker && attacker.mods.burnOnHit > 0 && defender.alive) {
      defender.statuses.burnTurns = Math.max(defender.statuses.burnTurns, 2);
      defender.statuses.burnDamage = Math.max(defender.statuses.burnDamage, attacker.mods.burnOnHit);
    }
    if (attacker && attacker.mods.poisonOnHit > 0 && defender.alive) {
      defender.statuses.poisonTurns = Math.max(defender.statuses.poisonTurns, 2);
      defender.statuses.poisonDamage = Math.max(defender.statuses.poisonDamage, attacker.mods.poisonOnHit);
    }

    if (attacker && !options.noReflect && defender.statuses.reflectTurns > 0 && defender.statuses.reflectPct > 0 && attacker.alive) {
      const reflected = Math.max(1, Math.round(damageLeft * defender.statuses.reflectPct));
      this.resolveDamage(defender, attacker, reflected, "true", "REFLECT", {
        noReflect: true,
        forceHit: true
      });
    }

    if (attacker && attacker.mods.lifestealPct > 0 && damageLeft > 0) {
      const heal = Math.round(damageLeft * attacker.mods.lifestealPct);
      if (heal > 0) this.healUnit(attacker, attacker, heal, "LIFESTEAL");
    }

    if (defender.hp <= 0) {
      defender.alive = false;
      defender.hp = 0;
      defender.shield = 0;
      defender.sprite.setFillStyle(0x3a3a3a, 0.92);
      defender.tag.setColor("#9a9a9a");
      defender.hpBarFill.setFillStyle(0x676f77, 0.9);
      defender.rageBarFill.setFillStyle(0x676f77, 0.85);
      defender.shieldBar.setFillStyle(0x676f77, 0.8);
      defender.hpText.setColor("#9a9a9a");
      defender.rageText.setColor("#9a9a9a");
      defender.statusLabel.setColor("#9a9a9a");
      this.audioFx.play("ko", 0.12);
      this.vfx?.pulseAt(defender.sprite.x, defender.sprite.y - 10, 0xffffff, 20, 320);
      this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, "KO", "#ffffff");
    }

    this.updateCombatUnitUi(defender);
    if (attacker) this.updateCombatUnitUi(attacker);
    if (reason) this.showFloatingText(attacker ? attacker.sprite.x : defender.sprite.x, (attacker ? attacker.sprite.y : defender.sprite.y) - 37, reason, "#ffe8ae");
    return damageLeft;
  }

  addShield(target, amount) {
    const val = Math.max(1, Math.round(amount));
    target.shield += val;
    this.vfx?.pulseAt(target.sprite.x, target.sprite.y - 10, 0x8ce9ff, 18, 220);
    this.showFloatingText(target.sprite.x, target.sprite.y - 45, `SHIELD ${val}`, "#8ce9ff");
    this.updateCombatUnitUi(target);
  }

  healUnit(caster, target, amount, reason) {
    if (!target.alive) return 0;
    const bonus = caster ? 1 + caster.mods.healPct : 1;
    const healRaw = Math.max(1, Math.round(amount * bonus));
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + healRaw);
    const applied = target.hp - before;
    if (applied <= 0) return 0;
    this.audioFx.play("heal");
    this.vfx?.pulseAt(target.sprite.x, target.sprite.y - 10, 0x9dffba, 14, 180);
    this.showFloatingText(target.sprite.x, target.sprite.y - 45, `+${applied}`, "#9dffba");
    if (caster && reason) this.showFloatingText(caster.sprite.x, caster.sprite.y - 37, reason, "#c9ffde");
    this.updateCombatUnitUi(target);
    return applied;
  }

  updateCombatUnitUi(unit) {
    const hpRatio = clamp(unit.maxHp > 0 ? unit.hp / unit.maxHp : 0, 0, 1);
    const rageRatio = clamp(unit.rageMax > 0 ? unit.rage / unit.rageMax : 0, 0, 1);
    const hpInnerW = Math.max(1, unit.hpBarBg.width - 2);
    const rageInnerW = Math.max(1, unit.rageBarBg.width - 2);
    const shieldRatio = clamp(unit.maxHp > 0 ? unit.shield / unit.maxHp : 0, 0, 1);

    unit.hpBarFill.width = Math.max(1, hpInnerW * hpRatio);
    unit.hpBarFill.setFillStyle(unit.alive ? 0x79df7b : 0x676f77, unit.alive ? 0.98 : 0.9);
    unit.shieldBar.width = Math.max(0, hpInnerW * shieldRatio);
    unit.rageBarFill.width = Math.max(1, rageInnerW * rageRatio);
    unit.rageBarFill.setFillStyle(unit.alive ? 0x7aa9ff : 0x676f77, unit.alive ? 0.96 : 0.85);
    unit.hpText.setText(`HP ${unit.hp}/${unit.maxHp}${unit.shield ? ` +${unit.shield}` : ""}`);
    unit.rageText.setText(`Nộ ${unit.rage}/${unit.rageMax}`);

    const s = [];
    if (unit.statuses.freeze > 0) s.push(`FRZ${unit.statuses.freeze}`);
    if (unit.statuses.stun > 0) s.push(`STN${unit.statuses.stun}`);
    if (unit.statuses.sleep > 0) s.push(`SLP${unit.statuses.sleep}`);
    if (unit.statuses.silence > 0) s.push(`SIL${unit.statuses.silence}`);
    if (unit.statuses.burnTurns > 0) s.push(`BRN${unit.statuses.burnTurns}`);
    if (unit.statuses.poisonTurns > 0) s.push(`PSN${unit.statuses.poisonTurns}`);
    if (unit.statuses.tauntTurns > 0 && unit.statuses.tauntTargetId) s.push("TAUNT");
    unit.statusLabel.setText(s.join(" "));
  }

  highlightUnit(unit, color) {
    unit.sprite.setStrokeStyle(6, color, 1);
    const tile = this.tileLookup.get(gridKey(unit.row, unit.col));
    if (tile) {
      this.highlightLayer.lineStyle(4, color, 1);
      this.drawDiamond(this.highlightLayer, tile.center.x, tile.center.y, false);
    }
  }

  clearHighlights() {
    this.highlightLayer.clear();
    this.combatUnits.forEach((u) => {
      if (!u.alive) return;
      const roleTheme = this.getRoleTheme(u.classType);
      u.sprite.setStrokeStyle(3, roleTheme.stroke, 1);
    });
  }

  tweenCombatUnit(unit, x, y, duration) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: unit.sprite,
        x,
        y,
        duration,
        ease: "Sine.easeInOut",
        onUpdate: () => this.syncCombatLabels(unit),
        onComplete: () => resolve()
      });
    });
  }

  syncCombatLabels(unit) {
    unit.icon.x = unit.sprite.x;
    unit.icon.y = unit.sprite.y - 10;
    unit.tag.x = unit.sprite.x - 58;
    unit.tag.y = unit.sprite.y - 48;
    unit.hpBarBg.x = unit.sprite.x;
    unit.hpBarBg.y = unit.sprite.y + 12;
    unit.hpBarFill.x = unit.sprite.x - unit.hpBarBg.width / 2 + 1;
    unit.hpBarFill.y = unit.sprite.y + 12;
    unit.shieldBar.x = unit.sprite.x - unit.hpBarBg.width / 2 + 1;
    unit.shieldBar.y = unit.sprite.y + 12;
    unit.hpText.x = unit.sprite.x;
    unit.hpText.y = unit.sprite.y + 4;
    unit.rageBarBg.x = unit.sprite.x;
    unit.rageBarBg.y = unit.sprite.y + 23;
    unit.rageBarFill.x = unit.sprite.x - unit.rageBarBg.width / 2 + 1;
    unit.rageBarFill.y = unit.sprite.y + 23;
    unit.rageText.x = unit.sprite.x;
    unit.rageText.y = unit.sprite.y + 18;
    unit.statusLabel.x = unit.sprite.x - 48;
    unit.statusLabel.y = unit.sprite.y + 30;
    unit.sprite.setDepth(unit.sprite.y + 10);
    unit.icon.setDepth(unit.sprite.y + 12);
    unit.tag.setDepth(unit.sprite.y + 11);
    unit.hpBarBg.setDepth(unit.sprite.y + 11);
    unit.hpBarFill.setDepth(unit.sprite.y + 12);
    unit.shieldBar.setDepth(unit.sprite.y + 13);
    unit.hpText.setDepth(unit.sprite.y + 14);
    unit.rageBarBg.setDepth(unit.sprite.y + 11);
    unit.rageBarFill.setDepth(unit.sprite.y + 12);
    unit.rageText.setDepth(unit.sprite.y + 14);
    unit.statusLabel.setDepth(unit.sprite.y + 11);
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }

  showFloatingText(x, y, text, color = "#ffffff") {
    if (this.vfx) {
      this.vfx.textPop(x, y, text, color);
      return;
    }
    const label = this.add.text(x - 10, y, text, {
      fontFamily: "Consolas",
      fontSize: "13px",
      color
    });
    label.setDepth(4000);
    this.combatSprites.push(label);
    this.tweens.add({
      targets: label,
      y: y - 26,
      alpha: 0,
      duration: 540,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy()
    });
  }

  resolveCombat(winnerSide) {
    if (this.phase !== PHASE.COMBAT) return;
    this.toggleSettingsOverlay(false);
    this.phase = PHASE.PLANNING;
    const rightSurvivors = this.getCombatUnits("RIGHT").length;
    const result = {
      winnerSide,
      round: this.player.round,
      rightSurvivors,
      goldDelta: 0,
      hpLoss: 0
    };

    if (winnerSide === "LEFT") {
      const nextWinStreak = this.player.winStreak + 1;
      result.goldDelta = 1 + (nextWinStreak >= 3 ? 1 : 0);
      this.addLog(`Thắng vòng ${this.player.round}. +${result.goldDelta} vàng.`);
    } else {
      result.hpLoss = Math.max(1, rightSurvivors + Math.floor(this.player.round / 2) - this.player.hpLossReduce);
      this.addLog(`Thua vòng ${this.player.round}. -${result.hpLoss} máu.`);
    }

    this.clearCombatSprites();
    this.scene.start("PlanningScene", {
      restoredState: this.runStatePayload,
      combatResult: result
    });
  }

  gridToScreen(col, row) {
    const visualCol = this.toVisualCol(col);
    const x = this.originX + (visualCol + row) * (TILE_W / 2);
    const y = this.originY + (row - visualCol) * (TILE_H / 2);
    return { x, y };
  }
}
