import Phaser from "phaser";
import { UNIT_CATALOG, UNIT_BY_ID } from "../data/unitCatalog.js";
import { SKILL_LIBRARY } from "../data/skills.js";
import { AUGMENT_LIBRARY, AUGMENT_ROUNDS } from "../data/augments.js";
import { CLASS_SYNERGY, TRIBE_SYNERGY } from "../data/synergies.js";
import { BASE_ITEMS, CRAFT_RECIPES, ITEM_BY_ID, RECIPE_BY_ID } from "../data/items.js";
import { getForestBackgroundKeyByRound } from "../data/forestBackgrounds.js";
import { getClassLabelVi, getTribeLabelVi, getUnitVisual } from "../data/unitVisuals.js";
import { TooltipController } from "../core/tooltip.js";
import { AudioFx } from "../core/audioFx.js";
import { clearProgress, loadProgress, saveProgress } from "../core/persistence.js";
import {
  RESOLUTION_PRESETS,
  guiScaleToZoom,
  loadUiSettings,
  normalizeGuiScale,
  normalizeResolutionKey,
  resolveResolution,
  saveUiSettings
} from "../core/uiSettings.js";
import { DEFAULT_LOSE_CONDITION, getLoseConditionLabel, normalizeLoseCondition } from "../core/gameRules.js";
import { createDefaultRunState, hydrateRunState, serializeRunState } from "../core/runState.js";
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
  scaledBaseStats,
  getBaseEvasion
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
const RIVER_LAYER_DEPTH = 1;

const PHASE = {
  PLANNING: "PLANNING",
  AUGMENT: "AUGMENT",
  COMBAT: "COMBAT",
  GAME_OVER: "GAME_OVER"
};

const AI_SETTINGS = {
  EASY: {
    label: "Dễ",
    hpMult: 0.84,
    atkMult: 0.82,
    matkMult: 0.82,
    rageGain: 1,
    randomTargetChance: 0.58,
    teamSizeBonus: 0,
    teamGrowthEvery: 5,
    teamGrowthCap: 1,
    budgetMult: 0.9,
    levelBonus: 0,
    maxTierBonus: 0,
    star2Bonus: -0.05,
    star3Bonus: -0.02
  },
  MEDIUM: {
    label: "Trung bình",
    hpMult: 0.95,
    atkMult: 0.93,
    matkMult: 0.93,
    rageGain: 1,
    randomTargetChance: 0.3,
    teamSizeBonus: 1,
    teamGrowthEvery: 4,
    teamGrowthCap: 2,
    budgetMult: 1,
    levelBonus: 0,
    maxTierBonus: 0,
    star2Bonus: -0.01,
    star3Bonus: -0.01
  },
  HARD: {
    label: "Khó",
    hpMult: 1.05,
    atkMult: 1.04,
    matkMult: 1.04,
    rageGain: 1,
    randomTargetChance: 0.12,
    teamSizeBonus: 2,
    teamGrowthEvery: 3,
    teamGrowthCap: 3,
    budgetMult: 1.08,
    levelBonus: 1,
    maxTierBonus: 1,
    star2Bonus: 0,
    star3Bonus: 0.01
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

const CLASS_SKILL_VARIANTS = {
  TANKER: [
    { name: "Giáp Dày", bonus: { defFlat: 6, hpPct: 0.04 } },
    { name: "Phản Chấn", bonus: { shieldStart: 18 } },
    { name: "Thành Lũy", bonus: { mdefFlat: 6, hpPct: 0.03 } }
  ],
  ASSASSIN: [
    { name: "Sát Ý", bonus: { atkPct: 0.09 } },
    { name: "Đoạt Mệnh", bonus: { critPct: 0.1 } },
    { name: "Lướt Ảnh", bonus: { startingRage: 1 } }
  ],
  ARCHER: [
    { name: "Xuyên Tâm", bonus: { atkPct: 0.07 } },
    { name: "Liên Xạ", bonus: { startingRage: 1 } },
    { name: "Ưng Nhãn", bonus: { critPct: 0.08 } }
  ],
  MAGE: [
    { name: "Cường Chú", bonus: { matkPct: 0.1 } },
    { name: "Tụ Lực", bonus: { startingRage: 1 } },
    { name: "Khuếch Tán", bonus: { matkPct: 0.06, mdefFlat: 5 } }
  ],
  SUPPORT: [
    { name: "Thần Hộ", bonus: { shieldStart: 16 } },
    { name: "Trị Liệu", bonus: { healPct: 0.08 } },
    { name: "Cổ Vũ", bonus: { startingRage: 1 } }
  ],
  FIGHTER: [
    { name: "Cuồng Nộ", bonus: { atkPct: 0.08 } },
    { name: "Bền Bỉ", bonus: { hpPct: 0.05 } },
    { name: "Chiến Ý", bonus: { critPct: 0.06, atkPct: 0.04 } }
  ]
};

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
  accentSoft: 0x50bfd8,
  cta: 0xbdcf47,
  ctaHover: 0xd4e665,
  ctaEdge: 0xf2ff9a,
  textPrimary: "#e9f5ff",
  textSecondary: "#a6bed3",
  textMuted: "#7f94a7",
  badgeTier: 0x1c3c58,
  badgeRole: 0x1f4a3a,
  badgeCost: 0x4b3a1f,
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

export class PlanningScene extends Phaser.Scene {
  constructor() {
    super("PlanningScene");
    this.phase = PHASE.PLANNING;
    this.aiMode = "MEDIUM";
    this.tileLookup = new Map();
    this.playerCellZones = [];
    this.buttons = {};
    this.benchSlots = [];
    this.benchUpgradeLevel = 0;
    this.shopCards = [];
    this.planningSprites = [];
    this.combatSprites = [];
    this.overlaySprites = [];
    this.logs = [];
    this.selectedBenchIndex = null;
    this.turnQueue = [];
    this.combatUnits = [];
    this.turnIndex = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.persistEnabled = true;
    this.incomingData = null;
    this.layout = null;
    this.runtimeSettings = loadUiSettings();
    this.gameMode = "PVE_JOURNEY";
    this.boardZoom = 1;
    this.boardPanX = 0;
    this.boardPanY = 0;
    this.isBoardDragging = false;
    this.lastDragPoint = null;
    this.boardPointerDown = null;
    this.boardDragConsumed = false;
    this.gapMarkers = [];
    this.boardEdgeLabels = [];
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
    this.attackPreviewIcons = [];
    this.previewHoverUnit = null;
    this.headerStatChips = {};
    this.headerMetaText = null;
    this.enemyInfoExpanded = false;
    this.inventoryCells = [];
    this.storageSummaryText = null;
    this.storageCraftText = null;
    this.craftInputSlots = [];
    this.craftOutputSlot = null;
    this.craftGridItems = Array.from({ length: 9 }, () => null);
    this.craftHintText = null;
    this.craftTitleText = null;
    this.rightPanelContentWidth = 0;
    this.rightPanelArea = null;
    this.rightPanelMask = null;
    this.rightPanelMaskShape = null;
    this.rightPanelScrollItems = [];
    this.rightPanelScrollOffset = 0;
    this.rightPanelMaxScroll = 0;
    this.selectedInventoryItemId = null;
    this.selectedInventoryItemType = null;
    this.gamepadFocus = "BOARD";
    this.gamepadCursor = { row: ROWS - 1, col: 0, shopIndex: 0, benchIndex: 0 };
    this.gamepadActive = false;
    this.gamepadLastDir = { x: 0, y: 0 };
    this.gamepadNextMoveAt = 0;
    this.gamepadButtonLatch = {};
    this.gamepadHintText = null;
    this.gamepadCursorLayer = null;
  }

  resetTransientSceneState() {
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
    this.combatUnits = [];
    this.turnIndex = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.layout = null;
    this.boardZoom = 1;
    this.boardPanX = 0;
    this.boardPanY = 0;
    this.isBoardDragging = false;
    this.lastDragPoint = null;
    this.boardPointerDown = null;
    this.boardDragConsumed = false;
    this.isUnitDragging = false;
    this.dragUnit = null;
    this.dragClone = null;
    this.dragOrigin = null;
    this.gapMarkers = [];
    this.boardEdgeLabels = [];
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
    this.attackPreviewIcons = [];
    this.previewHoverUnit = null;
    this.headerStatChips = {};
    this.headerMetaText = null;
    this.enemyInfoExpanded = false;
    this.inventoryCells = [];
    this.storageSummaryText = null;
    this.storageCraftText = null;
    this.craftInputSlots = [];
    this.craftOutputSlot = null;
    this.craftGridItems = Array.from({ length: 9 }, () => null);
    this.craftHintText = null;
    this.craftTitleText = null;
    this.rightPanelContentWidth = 0;
    this.rightPanelArea = null;
    this.rightPanelMask = null;
    this.rightPanelMaskShape = null;
    this.rightPanelScrollItems = [];
    this.rightPanelScrollOffset = 0;
    this.rightPanelMaxScroll = 0;
    this.selectedInventoryItemId = null;
    this.selectedInventoryItemType = null;
    this.gamepadFocus = "BOARD";
    this.gamepadCursor = { row: ROWS - 1, col: 0, shopIndex: 0, benchIndex: 0 };
    this.gamepadActive = false;
    this.gamepadLastDir = { x: 0, y: 0 };
    this.gamepadNextMoveAt = 0;
    this.gamepadButtonLatch = {};
    this.gamepadHintText = null;
    this.gamepadCursorLayer = null;
    this.settingsVisible = false;
    this.settingsOverlay = [];
    this.modalButtons = {};
    this.wikiVisible = false;
    this.wikiOverlay = [];
    this.wikiSelectedUnitId = null;
    this.wikiSearchQuery = "";
    this.wikiScrollY = 0;
    this.wikiMaxScroll = 0;
    this._wikiTab = "units";
    this._wikiDetailUnit = null;
    this._wikiCraftRecipes = null;
  }

  resetBoardViewTransform(refresh = false) {
    this.boardZoom = 1;
    this.boardPanX = 0;
    this.boardPanY = 0;
    this.isBoardDragging = false;
    this.lastDragPoint = null;
    this.boardPointerDown = null;
    this.boardDragConsumed = false;
    if (refresh && this.tileLookup?.size && this.player?.board) {
      this.refreshBoardGeometry();
    }
  }

  init(data) {
    this.resetTransientSceneState();
    this.incomingData = data ?? null;
  }

  create() {
    this.cameras.main.setBackgroundColor("#10141b");
    this.input.mouse?.disableContextMenu();
    this.input.keyboard?.removeAllListeners();
    this.input.removeAllListeners();
    this.runtimeSettings = this.incomingData?.settings ?? loadUiSettings();
    this.applyDisplaySettings(this.runtimeSettings, false);
    this.layout = this.computeLayout();
    this.gameMode = this.incomingData?.mode ?? this.gameMode;
    this.tooltip = new TooltipController(this);
    this.audioFx = new AudioFx(this);
    this.audioFx.setEnabled(this.runtimeSettings.audioEnabled !== false);
    this.audioFx.setVolumeLevel(this.runtimeSettings.volumeLevel ?? 10);
    this.startPlanningMusic();
    this.drawBoard();
    this.createHud();
    this.createButtons();
    this.createHistoryModal();
    this.createSettingsOverlay();
    this.createPlayerCellZones();
    this.createBenchSlots();
    this.setupBoardViewInput();
    this.setupInput();
    this.setupGamepadInput();

    const forceNewRun = this.incomingData?.forceNewRun === true;
    if (forceNewRun) {
      this.startNewRun();
    } else {
      const loaded = this.incomingData?.restoredState
        ? hydrateRunState(this.incomingData.restoredState)
        : hydrateRunState(loadProgress());
      if (loaded) {
        this.applyRunState(loaded);
        this.prepareEnemyPreview();
        this.addLog("Đã khôi phục tiến trình.");
      } else {
        this.startNewRun();
      }
    }

    this.applyRuntimeSettings(this.runtimeSettings);

    if (this.incomingData?.combatResult) {
      this.applyCombatResult(this.incomingData.combatResult);
    }
  }

  startPlanningMusic() {
    const weights = {
      bgm_warrior: 40,
      bgm_gunny: 5,
      bgm_planning: 10,
      bgm_nature_1: 9,
      bgm_nature_2: 9,
      bgm_nature_3: 9,
      bgm_nature_4: 9,
      bgm_nature_5: 9
    };
    this.audioFx.playWeightedPlaylist(weights, 0.2);
  }

  applyRuntimeSettings(settings) {
    if (!settings) return;
    this.runtimeSettings = { ...this.runtimeSettings, ...settings };
    if (settings.aiMode && AI_SETTINGS[settings.aiMode]) this.aiMode = settings.aiMode;
    const loseCondition = normalizeLoseCondition(settings.loseCondition ?? this.player?.loseCondition ?? DEFAULT_LOSE_CONDITION);
    this.runtimeSettings.loseCondition = loseCondition;
    if (this.player) this.player.loseCondition = loseCondition;
    if (typeof settings.audioEnabled === "boolean") this.audioFx.setEnabled(settings.audioEnabled);
    if (settings.volumeLevel != null) this.audioFx.setVolumeLevel(settings.volumeLevel);
    this.startPlanningMusic();
    this.refreshPlanningUi();
  }

  applyDisplaySettings(settings, refresh = false) {
    const resolution = resolveResolution(settings?.resolutionKey);
    if (resolution) {
      this.scale.resize(resolution.width, resolution.height);
    }
    const zoom = guiScaleToZoom(normalizeGuiScale(settings?.guiScale));
    this.cameras.main.setZoom(zoom);
    if (refresh) {
      this.layout = this.computeLayout();
      this.refreshPlanningUi();
      this.refreshBoardGeometry();
    }
  }

  setupInput() {
    this.input.keyboard.on("keydown-SPACE", () => {
      if (!this.settingsVisible && this.phase === PHASE.PLANNING) this.beginCombat();
    });
    this.input.keyboard.on("keydown-R", () => this.startNewRun());

    this.input.keyboard.on("keydown-S", () => {
      if (!this.settingsVisible && this.phase === PHASE.PLANNING) this.sellSelectedUnit();
    });
    this.input.keyboard.on("keydown-DELETE", () => {
      if (!this.settingsVisible && this.phase === PHASE.PLANNING) this.sellSelectedUnit();
    });
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.wikiVisible) {
        this.toggleWikiModal(false);
        return;
      }
      if (this.historyModalVisible) {
        this.toggleHistoryModal(false);
        return;
      }
      this.toggleSettingsOverlay();
    });

    this.input.on("pointerdown", (pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      }
    });

    this.input.mouse?.disableContextMenu();
  }

  setupGamepadInput() {
    this.gamepadCursorLayer = this.add.graphics();
    this.gamepadCursorLayer.setDepth(3600);
    this.input.gamepad?.on("connected", () => {
      this.gamepadActive = true;
      this.addLog("Đã kết nối tay cầm.");
    });
    this.input.gamepad?.on("disconnected", () => {
      const hasPad = this.input.gamepad?.getAll()?.some((pad) => pad?.connected);
      this.gamepadActive = !!hasPad;
      if (!hasPad) {
        this.gamepadFocus = "BOARD";
        this.gamepadCursorLayer?.clear();
      }
      this.addLog("Tay cầm đã ngắt kết nối.");
    });
  }

  getActivePad() {
    const pads = this.input.gamepad?.getAll?.() ?? [];
    return pads.find((pad) => pad?.connected) ?? null;
  }

  consumePadButton(pad, index) {
    const pressed = !!pad?.buttons?.[index]?.pressed;
    const key = String(index);
    const wasPressed = !!this.gamepadButtonLatch[key];
    if (pressed && !wasPressed) {
      this.gamepadButtonLatch[key] = true;
      return true;
    }
    if (!pressed && wasPressed) this.gamepadButtonLatch[key] = false;
    return false;
  }

  readPadDirection(pad) {
    const dpadLeft = !!pad?.buttons?.[14]?.pressed;
    const dpadRight = !!pad?.buttons?.[15]?.pressed;
    const dpadUp = !!pad?.buttons?.[12]?.pressed;
    const dpadDown = !!pad?.buttons?.[13]?.pressed;
    const axisX = Number.isFinite(pad?.axes?.[0]?.getValue?.()) ? pad.axes[0].getValue() : 0;
    const axisY = Number.isFinite(pad?.axes?.[1]?.getValue?.()) ? pad.axes[1].getValue() : 0;
    const left = dpadLeft || axisX < -0.55;
    const right = dpadRight || axisX > 0.55;
    const up = dpadUp || axisY < -0.55;
    const down = dpadDown || axisY > 0.55;
    const dx = left === right ? 0 : left ? -1 : 1;
    const dy = up === down ? 0 : up ? -1 : 1;
    return { dx, dy };
  }

  update(_time, _delta) {
    const pointer = this.input?.activePointer;
    if (this.isUnitDragging && pointer && !pointer.isDown) {
      this.endUnitDrag(pointer);
    }

    const pad = this.getActivePad();
    this.gamepadActive = !!pad;
    if (!pad) {
      this.gamepadCursorLayer?.clear();
      return;
    }

    const now = this.time.now;
    const { dx, dy } = this.readPadDirection(pad);
    const moved = dx !== 0 || dy !== 0;
    if (moved) {
      const dirChanged = dx !== this.gamepadLastDir.x || dy !== this.gamepadLastDir.y;
      if (dirChanged || now >= this.gamepadNextMoveAt) {
        this.handleGamepadMove(dx, dy);
        this.gamepadNextMoveAt = now + (dirChanged ? 170 : 120);
        this.gamepadLastDir = { x: dx, y: dy };
      }
    } else {
      this.gamepadLastDir = { x: 0, y: 0 };
      this.gamepadNextMoveAt = 0;
    }

    if (this.consumePadButton(pad, 0)) this.handleGamepadConfirm();
    if (this.consumePadButton(pad, 1)) this.handleGamepadCancel();
    if (this.consumePadButton(pad, 2)) this.gamepadFocus = "SHOP";
    if (this.consumePadButton(pad, 3)) this.gamepadFocus = "BOARD";
    if (this.consumePadButton(pad, 4)) this.gamepadFocus = "BENCH";
    if (this.consumePadButton(pad, 5)) this.gamepadFocus = "SHOP";
    if (this.consumePadButton(pad, 8)) this.toggleSettingsOverlay();
    if (this.consumePadButton(pad, 9) && this.phase === PHASE.PLANNING && !this.settingsVisible) this.beginCombat();

    this.refreshGamepadCursorVisual();
  }

  handleGamepadMove(dx, dy) {
    if (this.settingsVisible || this.historyModalVisible) return;
    if (this.gamepadFocus === "SHOP") {
      this.gamepadCursor.shopIndex = clamp(this.gamepadCursor.shopIndex + dx, 0, 4);
      if (dy < 0) this.gamepadFocus = "BOARD";
      if (dy > 0) this.gamepadFocus = "BENCH";
      return;
    }
    if (this.gamepadFocus === "BENCH") {
      const cap = Math.max(1, this.getBenchCap());
      const cols = Math.max(1, this.layout?.benchCols ?? 5);
      const index = this.gamepadCursor.benchIndex;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const maxRow = Math.floor((cap - 1) / cols);
      const nextCol = clamp(col + dx, 0, cols - 1);
      const nextRow = clamp(row + dy, 0, maxRow);
      this.gamepadCursor.benchIndex = clamp(nextRow * cols + nextCol, 0, cap - 1);
      if (dy < 0 && row === 0) this.gamepadFocus = "SHOP";
      return;
    }

    this.gamepadFocus = "BOARD";
    this.gamepadCursor.col = clamp(this.gamepadCursor.col + dx, 0, PLAYER_COLS - 1);
    this.gamepadCursor.row = clamp(this.gamepadCursor.row + dy, 0, ROWS - 1);
    if (dy > 0 && this.gamepadCursor.row >= ROWS - 1) this.gamepadFocus = "BENCH";
  }

  handleGamepadConfirm() {
    if (this.historyModalVisible) {
      this.toggleHistoryModal(false);
      return;
    }
    if (this.settingsVisible) {
      this.toggleSettingsOverlay(false);
      return;
    }
    if (this.gamepadFocus === "SHOP") {
      this.buyFromShop(this.gamepadCursor.shopIndex);
      return;
    }
    if (this.gamepadFocus === "BENCH") {
      this.onBenchClick(this.gamepadCursor.benchIndex);
      if (this.selectedBenchIndex != null) this.gamepadFocus = "BOARD";
      return;
    }
    if (this.phase === PHASE.PLANNING) {
      this.onPlayerCellClick(this.gamepadCursor.row, this.gamepadCursor.col);
    }
  }

  handleGamepadCancel() {
    if (this.historyModalVisible) {
      this.toggleHistoryModal(false);
      return;
    }
    if (this.settingsVisible) {
      this.toggleSettingsOverlay(false);
      return;
    }
    if (this.selectedBenchIndex != null) {
      this.selectedBenchIndex = null;
      this.refreshBenchUi();
      return;
    }
    this.gamepadFocus = "BOARD";
  }

  refreshGamepadCursorVisual() {
    if (!this.gamepadCursorLayer) return;
    this.gamepadCursorLayer.clear();
    if (!this.gamepadActive || this.settingsVisible || this.historyModalVisible) return;

    if (this.gamepadFocus === "SHOP") {
      const card = this.shopCards?.[this.gamepadCursor.shopIndex];
      if (!card?.bg) return;
      this.gamepadCursorLayer.lineStyle(2, 0xfff3a1, 0.95);
      this.gamepadCursorLayer.strokeRect(card.bg.x - card.bg.width / 2, card.bg.y - card.bg.height / 2, card.bg.width, card.bg.height);
      return;
    }

    if (this.gamepadFocus === "BENCH") {
      const slot = this.benchSlots?.[this.gamepadCursor.benchIndex];
      if (!slot?.bg) return;
      this.gamepadCursorLayer.lineStyle(2, 0xfff3a1, 0.95);
      this.gamepadCursorLayer.strokeRect(slot.bg.x - slot.slotW / 2, slot.bg.y - slot.slotH / 2, slot.slotW, slot.slotH);
      return;
    }

    const tile = this.tileLookup.get(gridKey(this.gamepadCursor.row, this.gamepadCursor.col));
    if (!tile) return;
    this.gamepadCursorLayer.lineStyle(3, 0xfff3a1, 0.95);
    this.gamepadCursorLayer.fillStyle(0xffe99b, 0.12);
    this.drawDiamond(this.gamepadCursorLayer, tile.center.x, tile.center.y);
  }

  setAIMode(mode) {
    if (!AI_SETTINGS[mode]) return;
    this.aiMode = mode;
    this.runtimeSettings.aiMode = mode;
    saveUiSettings(this.runtimeSettings);
    this.audioFx.play("click");
    this.addLog(`Độ khó AI -> ${AI_SETTINGS[mode].label}`);
    this.refreshHeader();
    this.persistProgress();
  }

  getLoseCondition() {
    return normalizeLoseCondition(this.player?.loseCondition ?? this.runtimeSettings?.loseCondition ?? DEFAULT_LOSE_CONDITION);
  }

  setLoseCondition(nextMode) {
    const mode = normalizeLoseCondition(nextMode);
    if (this.getLoseCondition() === mode) return;
    this.runtimeSettings.loseCondition = mode;
    if (this.player) {
      this.player.loseCondition = mode;
      if (mode === "NO_HEARTS" && this.player.hp <= 0) this.player.hp = 3;
      if (mode === "NO_UNITS") this.player.hp = Math.max(1, this.player.hp);
    }
    saveUiSettings(this.runtimeSettings);
    this.modalButtons?.loseMode?.setLabel(`Điều kiện thua: ${getLoseConditionLabel(mode)}`);
    this.addLog(`Đã đổi ${getLoseConditionLabel(mode)}.`);
    this.refreshHeader();
    this.persistProgress();
  }

  toggleLoseCondition() {
    const next = this.getLoseCondition() === "NO_UNITS" ? "NO_HEARTS" : "NO_UNITS";
    this.setLoseCondition(next);
  }

  startNewRun() {
    this.toggleSettingsOverlay(false);
    this.toggleHistoryModal(false);
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
    this.historyScrollOffset = 0;
    this.historyFilter = "ALL";
    this.resetBoardViewTransform(true);

    this.applyRunState(createDefaultRunState());
    this.player.gameMode = this.gameMode;
    this.player.loseCondition = normalizeLoseCondition(this.runtimeSettings?.loseCondition ?? DEFAULT_LOSE_CONDITION);
    this.player.hp = this.player.loseCondition === "NO_HEARTS" ? 3 : 1;
    this.applyRuntimeSettings(this.runtimeSettings);
    this.enterPlanning(false);
    this.addLog("Khởi tạo ván mới: Bá Chủ Khu Rừng.");
    this.persistProgress();
  }

  applyRunState(state) {
    this.aiMode = state.aiMode ?? "MEDIUM";
    this.audioFx.setEnabled(state.audioEnabled !== false);
    this.player = state.player;
    this.ensurePlayerStateFields();
    this.runtimeSettings.loseCondition = normalizeLoseCondition(this.player.loseCondition ?? this.runtimeSettings?.loseCondition);
    this.refreshPlanningUi();
  }

  normalizeOwnedUnit(raw) {
    if (!raw || typeof raw !== "object") return null;
    const baseId = raw.baseId ?? raw.base?.id;
    const base = UNIT_BY_ID[baseId];
    if (!base) return null;
    const starRaw = Number.isFinite(raw.star) ? Math.round(raw.star) : 1;
    return {
      uid: raw.uid ?? createUnitUid(),
      baseId: base.id,
      star: clamp(starRaw, 1, 3),
      base,
      equips: Array.isArray(raw.equips) ? raw.equips.filter((id) => ITEM_BY_ID[id]?.kind === "equipment").slice(0, 3) : []
    };
  }

  normalizeBoard(rawBoard) {
    const board = this.createEmptyBoard();
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        board[row][col] = this.normalizeOwnedUnit(rawBoard?.[row]?.[col]);
      }
    }
    return board;
  }

  ensurePlayerStateFields() {
    this.player.board = this.normalizeBoard(this.player.board);
    this.player.bench = (Array.isArray(this.player.bench) ? this.player.bench : [])
      .map((unit) => this.normalizeOwnedUnit(unit))
      .filter(Boolean);

    if (!Array.isArray(this.player.shop)) this.player.shop = [];
    this.player.level = clamp(Number.isFinite(this.player.level) ? Math.floor(this.player.level) : 1, 1, 9);
    this.player.round = Math.max(1, Number.isFinite(this.player.round) ? Math.floor(this.player.round) : 1);
    this.player.hp = Math.max(0, Number.isFinite(this.player.hp) ? Math.round(this.player.hp) : 1);
    this.player.loseCondition = normalizeLoseCondition(this.player.loseCondition ?? this.runtimeSettings?.loseCondition ?? DEFAULT_LOSE_CONDITION);
    if (this.player.loseCondition === "NO_HEARTS") {
      if (!Number.isFinite(this.player.hp) || this.player.hp <= 0) this.player.hp = 3;
    } else {
      this.player.hp = Math.max(this.player.hp, 1);
    }
    this.player.gold = Math.max(0, Number.isFinite(this.player.gold) ? Math.floor(this.player.gold) : 10);
    this.player.xp = Math.max(0, Number.isFinite(this.player.xp) ? Math.floor(this.player.xp) : 0);
    const xpNeed = getXpToLevelUp(this.player.level);
    if (xpNeed !== Number.POSITIVE_INFINITY) {
      this.player.xp = Math.min(this.player.xp, Math.max(0, xpNeed - 1));
    }
    if (!Number.isFinite(this.player.winStreak)) this.player.winStreak = 0;
    if (!Number.isFinite(this.player.loseStreak)) this.player.loseStreak = 0;
    if (!Number.isFinite(this.player.deployCapBonus)) this.player.deployCapBonus = 0;
    if (!Number.isFinite(this.player.benchBonus)) this.player.benchBonus = 0;
    if (!Number.isFinite(this.player.interestCapBonus)) this.player.interestCapBonus = 0;
    if (!Number.isFinite(this.player.rollCostDelta)) this.player.rollCostDelta = 0;
    if (!Number.isFinite(this.player.startingRage)) this.player.startingRage = 0;
    if (!Number.isFinite(this.player.startingShield)) this.player.startingShield = 0;
    if (!Number.isFinite(this.player.teamAtkPct)) this.player.teamAtkPct = 0;
    if (!Number.isFinite(this.player.teamMatkPct)) this.player.teamMatkPct = 0;
    if (!Number.isFinite(this.player.teamHpPct)) this.player.teamHpPct = 0;
    if (!Number.isFinite(this.player.lifestealPct)) this.player.lifestealPct = 0;
    if (!Number.isFinite(this.player.hpLossReduce)) this.player.hpLossReduce = 0;
    if (!Number.isFinite(this.player.extraClassCount)) this.player.extraClassCount = 0;
    if (!Number.isFinite(this.player.extraTribeCount)) this.player.extraTribeCount = 0;
    if (!Number.isFinite(this.player.craftTableLevel)) this.player.craftTableLevel = 0;
    this.player.craftTableLevel = clamp(Math.floor(this.player.craftTableLevel), 0, 1);
    if (typeof this.player.shopLocked !== "boolean") this.player.shopLocked = false;

    if (!Array.isArray(this.player.itemBag)) this.player.itemBag = [];
    if (!Array.isArray(this.player.craftedItems)) this.player.craftedItems = [];
    if (!Array.isArray(this.player.enemyPreview)) {
      this.player.enemyPreview = [];
    } else {
      this.player.enemyPreview = this.player.enemyPreview
        .map((entry) => {
          if (!entry || !UNIT_BY_ID[entry.baseId]) return null;
          const starRaw = Number.isFinite(entry.star) ? Math.round(entry.star) : 1;
          const rowRaw = Number.isFinite(entry.row) ? Math.round(entry.row) : 0;
          const colRaw = Number.isFinite(entry.col) ? Math.round(entry.col) : RIGHT_COL_START;
          return {
            baseId: entry.baseId,
            star: clamp(starRaw, 1, 3),
            row: clamp(rowRaw, 0, ROWS - 1),
            col: clamp(colRaw, RIGHT_COL_START, RIGHT_COL_END)
          };
        })
        .filter(Boolean);
    }
    if (!Number.isInteger(this.player.enemyPreviewRound)) this.player.enemyPreviewRound = 0;
    if (!Number.isFinite(this.player.enemyBudget)) this.player.enemyBudget = 0;
    if (!this.player.gameMode) this.player.gameMode = this.gameMode;
    if (!Array.isArray(this.craftGridItems) || this.craftGridItems.length !== 9) {
      this.craftGridItems = Array.from({ length: 9 }, (_, idx) => this.craftGridItems?.[idx] ?? null);
    }
    this.getCraftActiveIndices().forEach((idx) => {
      const id = this.craftGridItems[idx];
      if (id && ITEM_BY_ID[id]?.kind !== "base") this.craftGridItems[idx] = null;
    });
  }

  exportRunState() {
    return serializeRunState({
      aiMode: this.aiMode,
      audioEnabled: this.audioFx?.enabled !== false,
      player: this.player
    });
  }

  persistProgress() {
    if (!this.persistEnabled) return;
    saveProgress(this.exportRunState());
  }

  applyLootDrops(result) {
    const lootDrops = Array.isArray(result?.lootDrops)
      ? result.lootDrops.filter((id) => ITEM_BY_ID[id]?.kind === "base")
      : [];
    if (!lootDrops.length) return;
    this.player.itemBag.push(...lootDrops);
    const lootCounts = {};
    lootDrops.forEach((id) => {
      lootCounts[id] = (lootCounts[id] ?? 0) + 1;
    });
    const lootLabel = Object.entries(lootCounts)
      .map(([id, amount]) => {
        const item = ITEM_BY_ID[id];
        return `${item?.icon ?? "❔"} ${item?.name ?? id} x${amount}`;
      })
      .join(", ");
    this.addLog(`Nhặt chiến lợi phẩm: ${lootLabel}.`);
  }

  applyCombatResult(result) {
    if (!result) return;
    const won = result.winnerSide === "LEFT";
    if (result.winnerSide === "DRAW") {
      this.applyLootDrops(result);
      this.player.winStreak = 0;
      this.player.loseStreak = 0;
      this.addLog(`Hòa vòng ${result.round}. Hai bên vẫn còn quân.`);
      this.player.round = (result.round ?? this.player.round) + 1;
      this.resetBoardViewTransform(true);
      this.enterPlanning(true);
      this.showRoundResultBanner("HÒA", true);
      this.persistProgress();
      return;
    }
    if (result.winnerSide === "LEFT") {
      this.player.winStreak += 1;
      this.player.loseStreak = 0;
      this.player.gold += result.goldDelta ?? 0;
      this.addLog(`Thắng vòng ${result.round}. +${result.goldDelta ?? 0} vàng.`);
    } else {
      this.player.loseStreak += 1;
      this.player.winStreak = 0;
      if (this.getLoseCondition() === "NO_HEARTS") {
        const damage = Math.max(1, Math.min(4, Number.isFinite(result.damage) ? Math.floor(result.damage) : 1));
        this.player.hp = Math.max(0, this.player.hp - damage);
        this.addLog(`Thua vòng ${result.round}. -${damage} tim (${this.player.hp} tim còn lại).`);
        if (this.player.hp <= 0) {
          this.handleTotalDefeat();
          return;
        }
      } else {
        this.addLog(`Thua vòng ${result.round}. Toàn đội đã bị hạ gục.`);
        this.handleTotalDefeat();
        return;
      }
    }
    this.applyLootDrops(result);

    this.player.round = (result.round ?? this.player.round) + 1;
    this.resetBoardViewTransform(true);
    this.enterPlanning(true);
    this.showRoundResultBanner(won ? "CHIẾN THẮNG" : "THẤT BẠI", won);
    this.persistProgress();
  }

  handleTotalDefeat() {
    this.player.hp = 0;
    this.phase = PHASE.GAME_OVER;
    this.refreshPlanningUi();
    this.addLog("Bạn đã thất bại. Đang quay về màn hình chính...");
    clearProgress();
    this.showRoundResultBanner("THẤT BẠI TOÀN CUỘC", false, 1450, () => {
      this.scene.start("MainMenuScene");
    });
  }

  createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array.from({ length: PLAYER_COLS }, () => null));
  }

  seedStarterUnits() {
    const tierOne = UNIT_CATALOG.filter((u) => u.tier === 1);
    const picks = sampleWithoutReplacement(tierOne, 3);
    picks.forEach((base) => {
      const owned = this.createOwnedUnit(base.id, 1);
      if (owned) this.player.bench.push(owned);
    });
  }

  createOwnedUnit(baseId, star = 1, equips = []) {
    const base = UNIT_BY_ID[baseId];
    if (!base) return null;
    return {
      uid: createUnitUid(),
      baseId: base.id,
      star,
      base,
      equips: Array.isArray(equips) ? equips.filter((id) => ITEM_BY_ID[id]?.kind === "equipment").slice(0, 3) : []
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

    const boardCols = gridCols;
    const contentW = boardCols * colW + (boardCols - 1) * colGap;

    const topPanelY = margin;
    const topPanelH = 120;
    const boardPanelX = margin;
    const boardPanelY = topPanelY + topPanelH + UI_SPACING.SM;

    // Synergy Panel - Floating on the right, higher up
    const sidePanelW = colW * 2.5;
    const sidePanelX = w - margin - sidePanelW - 10;
    const sidePanelY = boardPanelY + 10;
    const sidePanelH = 160;

    const actionsH = 50;
    const controlsH = 20;
    const lowerSplitGap = UI_SPACING.LG;

    // Bottom layout
    const benchRegionW = Math.floor(contentW * 0.42);
    const shopRegionW = contentW - benchRegionW - lowerSplitGap;
    const benchRegionX = boardPanelX;
    const shopRegionX = benchRegionX + benchRegionW + lowerSplitGap;
    const benchRegionInnerGap = UI_SPACING.XS;
    const craftRegionW = Math.max(172, Math.floor(benchRegionW * 0.34));
    const benchSlotsRegionX = benchRegionX;
    const benchSlotsRegionW = Math.max(220, benchRegionW - craftRegionW - benchRegionInnerGap);
    const craftRegionX = benchSlotsRegionX + benchSlotsRegionW + benchRegionInnerGap;

    const shopCardH = 154;
    const benchCols = this.benchUpgradeLevel > 0 ? 7 : 4;
    const benchRows = 2;
    const benchSlotH = 76;
    const benchRowGap = UI_SPACING.XS;

    const lowerPanelH = 210; // Fixed height for bottom section
    const lowerTopY = h - margin - lowerPanelH;

    // Inventory Y - Move it up from bench
    const invCellSize = 42;
    const invY = lowerTopY + 10;

    const benchY = invY + invCellSize + 28; // Increased gap to avoid label overlap
    const shopY = lowerTopY + 45;

    const controlsY = lowerTopY - 12;
    const actionsY = controlsY - actionsH - 6;
    const boardPanelH = Math.max(250, actionsY - UI_SPACING.SM - boardPanelY);

    const shopGap = UI_SPACING.SM;
    const shopCardW = Math.floor((shopRegionW - shopGap * 4) / 5);
    const benchGap = UI_SPACING.XS;
    const benchSlotW = Math.max(68, Math.floor((benchSlotsRegionW - benchGap * (benchCols - 1)) / benchCols));

    return {
      width: w,
      height: h,
      margin,
      colW,
      colGap,
      gridCols,
      contentW,
      topPanelY,
      topPanelH,
      boardOriginX: boardPanelX + Math.floor(contentW * 0.35),
      boardOriginY: boardPanelY + Math.floor(boardPanelH * 0.75),
      boardPanelX,
      boardPanelY,
      boardPanelW: contentW,
      boardPanelH,
      sidePanelX,
      sidePanelY,
      sidePanelW,
      sidePanelH,
      benchRegionX,
      benchRegionW,
      benchSlotsRegionX,
      benchSlotsRegionW,
      craftRegionX,
      craftRegionW,
      shopRegionX,
      shopRegionW,
      actionsY,
      controlsY,
      shopY,
      benchY,
      benchRows,
      benchCols,
      benchRowGap,
      shopCardW,
      shopCardH,
      shopGap,
      benchSlotW,
      benchSlotH,
      benchGap,
      invY,
      invCellSize
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
    const startRound = this.player?.round ?? 1;
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
    const nextKey = getForestBackgroundKeyByRound(this.player?.round ?? 1);
    if (!this.textures.exists(nextKey)) return;
    if (nextKey === this.roundBackgroundKey) return;
    this.roundBackgroundKey = nextKey;
    this.roundBackgroundImage.setTexture(nextKey);
  }

  drawBoard() {
    this.originX = this.layout.boardOriginX;
    this.originY = this.layout.boardOriginY;
    this.createBoardBackground();

    // Decorative elements
    if (!this.decorationsCreated) {
      this.decorationsCreated = true;
      const random = new Phaser.Math.RandomDataGenerator([123]);
      const decoOptions = ["🌲", "🌳", "🪨", "🍄", "🌿", "🌺", "🌾"];
      for (let i = 0; i < 18; i++) {
        const angle = random.angle();
        const dist = random.between(this.layout.boardPanelW * 0.6, this.layout.boardPanelW * 0.9);
        const x = this.layout.boardPanelX + this.layout.boardPanelW / 2 + Math.cos(angle) * dist;
        const y = this.layout.boardPanelY + this.layout.boardPanelH / 2 + Math.sin(angle) * dist * 0.6;
        if (this.pointInBoardPanel(x, y)) continue;

        const text = this.add.text(x, y, random.pick(decoOptions), {
          fontSize: random.pick(["20px", "24px", "28px"]),
          color: "#ffffff"
        });
        text.setAlpha(0.6 + random.realInRange(0, 0.4));
        text.setDepth(y);
        this.overlaySprites.push(text); // Add to overlay so they get cleared/managed or just leave them? 
        // Actually overlaySprites is cleared often. Using planningSprites or a separate list.
        // Let's attach to nothing for now, just let them be background. 
        // Or better, check if they persist. They are Phaser GameObjects.
        // I should probably track them to destroy on restart maybe?
      }
    }

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const center = this.gridToScreen(col, row);
        const tile = this.add.graphics();
        this.paintGrassTile(tile, center.x, center.y, row, col);
        // Removed per-tile label for cleaner UX
        this.tileLookup.set(gridKey(row, col), { tile, center });
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
      token.setDepth(RIVER_LAYER_DEPTH);
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
    const { tileW, tileH } = this.getTileSize();
    this.boardEdgeLabels.forEach((entry) => {
      const p = this.gridToScreen(entry.col, entry.row);
      let dx = 0;
      let dy = 0;
      if (entry.anchor === "bottom") {
        dx = tileW * 0.3;
        dy = tileH * 0.6;
      } else if (entry.anchor === "top") {
        dx = -tileW * 0.3;
        dy = -tileH * 0.6;
      } else if (entry.anchor === "left") {
        dx = -tileW * 0.3;
        dy = tileH * 0.6;
      } else if (entry.anchor === "right") {
        dx = tileW * 0.3;
        dy = -tileH * 0.6;
      }
      entry.label.setPosition(p.x + dx, p.y + dy);
      entry.label.setDepth(2101); // Giữ depth cao để không bị đè
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
    const { tileW, tileH } = this.getTileSize();
    graphics.fillStyle(fill, 0.72);
    graphics.lineStyle(1, stroke, 0.92);
    this.drawDiamond(graphics, x, y);

    // Add a soft top highlight so each grass tile reads as a textured piece.
    graphics.lineStyle(1, UI_COLORS.grassHighlight, 0.2);
    graphics.beginPath();
    graphics.moveTo(x - tileW / 2 + 4, y);
    graphics.lineTo(x, y - tileH / 2 + 2);
    graphics.lineTo(x + tileW / 2 - 4, y);
    graphics.strokePath();
  }

  paintRiverTile(graphics, x, y, row) {
    const { tileW, tileH } = this.getTileSize();
    const w = tileW;
    const h = tileH;
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
    const { tileW, tileH } = this.getTileSize();
    graphics.beginPath();
    graphics.moveTo(x, y - tileH / 2);
    graphics.lineTo(x + tileW / 2, y);
    graphics.lineTo(x, y + tileH / 2);
    graphics.lineTo(x - tileW / 2, y);
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

    this.titleText = this.add
      .text(l.boardPanelX + UI_SPACING.SM, l.topPanelY + UI_SPACING.SM - 4, "FOREST THRONE • BÁ CHỦ KHU RỪNG", {
        fontFamily: UI_FONT,
        fontSize: "24px",
        color: UI_COLORS.textPrimary,
        fontStyle: "bold"
      })
      .setDepth(2000);

    this.ruleText = this.add
      .text(l.boardPanelX + UI_SPACING.SM, l.topPanelY + UI_SPACING.SM + 25, "Luật quét: Ta (hàng 0→4, cột 4→0) | Địch (hàng 0→4, cột 5→9)", {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: UI_COLORS.textSecondary
      })
      .setDepth(2000);

    this.headerMetaText = this.add
      .text(l.boardPanelX + l.boardPanelW - UI_SPACING.SM - 120, l.topPanelY + UI_SPACING.SM + 6, "", {
        fontFamily: UI_FONT,
        fontSize: "13px",
        color: UI_COLORS.textSecondary,
        align: "right"
      })
      .setOrigin(1, 0)
      .setDepth(2000);

    // Stat Chips
    const statDefs = [
      { key: "round", icon: "🧭", label: "Vòng" },
      { key: "gold", icon: "🪙", label: "Vàng", hasBar: true, barColor: 0xd4a017 },
      { key: "level", icon: "⬆", label: "Cấp" },
      { key: "xp", icon: "✦", label: "XP", hasBar: true, barColor: 0x3a8fd4 },
      { key: "deploy", icon: "⚔", label: "Triển khai", hasBar: true, barColor: 0x4caf50 }
    ];
    const chipGap = 10;
    const chipY = l.topPanelY + 58;
    const totalChipW = l.boardPanelW - UI_SPACING.SM * 2;
    const chipW = clamp(Math.floor((totalChipW - chipGap * (statDefs.length - 1)) / statDefs.length), 108, 190);
    const chipsRowW = chipW * statDefs.length + chipGap * (statDefs.length - 1);
    // Align left instead of center
    const chipStartX = l.boardPanelX + UI_SPACING.SM;
    this.headerStatChips = {};

    statDefs.forEach((def, idx) => {
      const x = chipStartX + idx * (chipW + chipGap);
      const bg = this.add.rectangle(x + chipW / 2, chipY + 20, chipW, 40, 0x13273d, 0.94);
      bg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.82);
      bg.setDepth(2000);

      const icon = this.add
        .text(x + 14, chipY + 20, def.icon, {
          fontFamily: "Segoe UI Emoji",
          fontSize: "16px",
          color: "#d8eeff"
        })
        .setOrigin(0, 0.5)
        .setDepth(2001);

      const label = this.add
        .text(x + 38, chipY + 11, def.label, {
          fontFamily: UI_FONT,
          fontSize: "11px",
          color: UI_COLORS.textMuted
        })
        .setDepth(2001);

      const value = this.add
        .text(x + chipW - 10, chipY + 21, "-", {
          fontFamily: UI_FONT,
          fontSize: "14px",
          color: UI_COLORS.textPrimary,
          fontStyle: "bold"
        })
        .setOrigin(1, 0.5)
        .setDepth(2001);

      // Progress bar (thin strip at bottom of chip)
      let bar = null;
      let barBg = null;
      if (def.hasBar) {
        barBg = this.add.rectangle(x + chipW / 2, chipY + 38, chipW - 4, 3, 0x0a1520, 0.9);
        barBg.setDepth(2001);
        bar = this.add.graphics();
        bar.setDepth(2002);
        bar._chipX = x;
        bar._chipW = chipW;
        bar._chipY = chipY;
        bar._barColor = def.barColor;
      }

      this.headerStatChips[def.key] = { bg, icon, label, value, bar, barBg, chipX: x, chipW };
    });

    // Sub-panels (Synergy / Enemy) - Floating on the right over the board
    // Synergy Panel - Floating on the right
    const sideW = l.sidePanelW;
    const sideH = l.sidePanelH;
    const sideX = l.sidePanelX;
    const sideY = l.sidePanelY;

    const synergyBg = this.add.rectangle(sideX + sideW / 2, sideY + sideH / 2, sideW, sideH, 0x0e1828, 0.85);
    synergyBg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.6);
    synergyBg.setDepth(1800);

    this.synergyTitleText = this.add.text(sideX + 12, sideY + 10, "◎ HỆ KÍCH HOẠT", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    }).setDepth(2000);
    this.synergyText = this.add.text(sideX + 12, sideY + 34, "", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: UI_COLORS.textPrimary,
      lineSpacing: 4,
      wordWrap: { width: sideW - 24 }
    }).setDepth(2000);
    this.synergyText.setFixedSize(sideW - 24, sideH - 44);
    this.synergyText.setInteractive({ useHandCursor: true });
    this.tooltip.attach(this.synergyText, () => this.getSynergyTooltip());


    // Inventory - Above Bench (left)
    const invX = l.benchSlotsRegionX ?? l.benchRegionX;
    const invY = l.invY;
    const invCell = l.invCellSize;
    const invGap = UI_SPACING.XS;
    const invAreaW = l.benchSlotsRegionW ?? l.benchRegionW;
    const invCols = clamp(Math.floor((invAreaW + invGap) / (invCell + invGap)), 4, 10);

    this.storageTitleText = this.add.text(invX, invY - 20, "◆ KHO ĐỒ", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    }).setDepth(2000);

    this.storageSummaryText = this.add.text(invX + 92, invY - 20, "", {
      fontFamily: UI_FONT,
      fontSize: "11px",
      color: UI_COLORS.textPrimary
    }).setDepth(2000);

    this.inventoryCells = [];
    for (let i = 0; i < invCols; i += 1) {
      const x = invX + i * (invCell + invGap);
      const yy = invY;
      const bg = this.add.rectangle(x + invCell / 2, yy + invCell / 2, invCell, invCell, 0x162639, 0.95);
      bg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.78);
      bg.setDepth(2000);
      bg.setInteractive({ useHandCursor: true });
      const icon = this.add.text(x + 6, yy + 4, "＋", {
        fontFamily: "Segoe UI Emoji",
        fontSize: "18px",
        color: UI_COLORS.textMuted
      }).setDepth(2001);
      const count = this.add.text(x + invCell - 4, yy + invCell - 4, "", {
        fontFamily: UI_FONT,
        fontSize: "9px",
        color: UI_COLORS.textSecondary
      }).setOrigin(1, 1).setDepth(2001);

      const cell = { bg, icon, count, itemId: null, amount: 0 };
      bg.on("pointerdown", () => this.onInventoryCellClick(cell));
      this.tooltip.attach(bg, () => {
        if (!cell.itemId) return { title: "Ô vật phẩm", body: "Trống." };
        const item = ITEM_BY_ID[cell.itemId];
        const itemType = item?.kind === "equipment" ? "Trang bị" : "Nguyên liệu";
        let extra = "";
        if (item?.kind === "equipment") {
          const recipe = RECIPE_BY_ID[item.fromRecipe];
          if (recipe?.description) extra = `\n\n◆ Hiệu ứng: ${recipe.description}`;
          extra += "\n◆ Nhấn vào thú để trang bị.";
        } else {
          extra = "\n◆ Dùng để ghép đồ.";
        }
        return {
          title: `${item?.icon ?? "❔"} ${item?.name ?? cell.itemId}`,
          body: `Loại: ${itemType}\nSố lượng: ${cell.amount}${extra}`
        };
      });
      this.inventoryCells.push(cell);
    }

    // Craft panel - Right side of bench
    const craftX = l.craftRegionX ?? (l.benchRegionX + l.benchRegionW - 170);
    const craftY = l.benchY + 2;
    const craftW = l.craftRegionW ?? 170;
    const craftCellGap = 5;
    const craftCell = clamp(Math.floor((craftW - 30) / 5), 26, 32);
    const craftGridW = craftCell * 3 + craftCellGap * 2;
    const craftGridH = craftGridW;
    const craftArrowGap = 18;
    const gridX0 = craftX + 6;
    const gridY0 = craftY + 18;
    const outputX = gridX0 + craftGridW + craftArrowGap;
    const outputY = gridY0 + Math.floor((craftGridH - craftCell) * 0.5);

    this.craftTitleText = this.add.text(craftX, l.benchY - 24, "⚒ Bàn chế tạo", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    }).setDepth(2000);

    this.craftInputSlots = [];
    for (let idx = 0; idx < 9; idx += 1) {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = gridX0 + col * (craftCell + craftCellGap);
      const y = gridY0 + row * (craftCell + craftCellGap);
      const bg = this.add.rectangle(x + craftCell / 2, y + craftCell / 2, craftCell, craftCell, 0x162639, 0.96);
      bg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.78);
      bg.setDepth(2000);
      bg.setInteractive({ useHandCursor: true });
      const icon = this.add.text(x + craftCell / 2, y + craftCell / 2, "·", {
        fontFamily: UI_FONT,
        fontSize: "16px",
        color: UI_COLORS.textMuted
      }).setOrigin(0.5).setDepth(2001);
      const slot = { index: idx, bg, icon };
      bg.on("pointerdown", (pointer) => {
        if (pointer?.rightButtonDown?.() || pointer?.leftButtonDown?.()) this.clearCraftGridSlot(idx);
      });
      this.tooltip.attach(bg, () => {
        const active = this.getCraftActiveIndices().includes(idx);
        if (!active) {
          return {
            title: "Ô chế tạo (khóa)",
            body: "Ô này chỉ mở khi nâng bàn chế lên 3x3 (15 vàng)."
          };
        }
        const itemId = this.craftGridItems[idx];
        if (!itemId) return { title: "Ô chế tạo", body: "Ô trống. Nhấn nguyên liệu trong kho để đưa vào." };
        const item = ITEM_BY_ID[itemId];
        return { title: `${item?.icon ?? "❔"} ${item?.name ?? itemId}`, body: "Nhấn vào ô để bỏ nguyên liệu khỏi khung chế tạo." };
      });
      this.craftInputSlots.push(slot);
    }

    const arrowX = gridX0 + craftGridW + Math.floor(craftArrowGap * 0.5);
    const arrowY = gridY0 + Math.floor(craftGridH * 0.5);
    this.add.text(arrowX, arrowY, "→", {
      fontFamily: UI_FONT,
      fontSize: "22px",
      color: "#9ec6ea",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(2001);

    const outBg = this.add.rectangle(outputX + craftCell / 2, outputY + craftCell / 2, craftCell, craftCell, 0x1e2f42, 0.95);
    outBg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.8);
    outBg.setDepth(2000);
    outBg.setInteractive({ useHandCursor: true });
    const outIcon = this.add.text(outputX + craftCell / 2, outputY + craftCell / 2, "?", {
      fontFamily: "Segoe UI Emoji",
      fontSize: "18px",
      color: UI_COLORS.textMuted
    }).setOrigin(0.5).setDepth(2001);
    outBg.on("pointerdown", () => this.craftFromGrid());
    this.craftOutputSlot = { bg: outBg, icon: outIcon };
    this.tooltip.attach(outBg, () => {
      const recipeId = this.getCraftResultRecipeId();
      const size = this.getCraftGridSize();
      if (!recipeId) return { title: "Đầu ra", body: `Chưa có công thức khớp. Sắp nguyên liệu theo mẫu ${size}x${size}.` };
      const recipe = RECIPE_BY_ID[recipeId];
      return {
        title: `${recipe?.icon ?? "✨"} ${recipe?.name ?? recipeId}`,
        body: `${recipe?.description ?? "Trang bị chế tạo"}\n\nNhấn để chế tạo và đưa vào kho đồ.`
      };
    });
    this.craftHintText = this.add.text(craftX, craftY + craftGridH + 8, "Nhấn nguyên liệu để đưa vào ô chế tạo.", {
      fontFamily: UI_FONT,
      fontSize: "10px",
      color: UI_COLORS.textMuted
    }).setDepth(2000);

    // Log & History - Small overlay at bottom left of the board
    this.logHistoryIcon = this.add.text(l.boardPanelX + 10, l.actionsY - 24, "• NHẬT KÝ", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: UI_COLORS.textSecondary
    }).setDepth(2000);

    this.logText = this.add.text(l.boardPanelX + 80, l.actionsY - 24, "", {
      fontFamily: UI_FONT,
      fontSize: "11px",
      color: UI_COLORS.textPrimary
    }).setDepth(2000);

    this.storageCraftText = this.add.text(l.boardPanelX + 400, l.actionsY - 24, "", {
      fontFamily: UI_FONT,
      fontSize: "11px",
      color: UI_COLORS.textSecondary
    }).setDepth(2000);
  }

  createButtons() {
    const l = this.layout;
    const x = l.boardPanelX;
    const y1 = l.actionsY;
    const strip = this.add.rectangle(l.boardPanelX + l.boardPanelW / 2, y1 + 24, l.boardPanelW, 52, 0x101f31, 0.52);
    strip.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.7);
    strip.setDepth(1888);

    const gap = UI_SPACING.SM;
    const ctaW = 240;

    let curX = x;
    const btnH = 44;

    this.buttons.roll = this.createButton(curX, y1, 130, btnH, "Đổi tướng (2 vàng)", () => this.rollShop());
    curX += 130 + gap;

    this.buttons.xp = this.createButton(curX, y1, 130, btnH, "Mua XP (4 vàng)", () => this.buyXp());
    curX += 130 + gap;

    this.buttons.lock = this.createButton(curX, y1, 100, btnH, "Khóa: Tắt", () => this.toggleLock());
    curX += 100 + gap;

    this.buttons.upgradeBench = this.createButton(curX, y1, 160, btnH, "Nâng dự bị (10 vàng)", () => this.upgradeBench());
    curX += 160 + gap;

    this.buttons.upgradeCraft = this.createButton(curX, y1, 160, btnH, "Nâng bàn chế (15 vàng)", () => this.upgradeCraftTable());
    curX += 160 + gap;

    this.buttons.sell = this.createButton(curX, y1, 85, btnH, "Bán (S)", () => this.sellSelectedUnit(), { variant: "ghost" });
    curX += 85 + gap;

    this.buttons.reset = this.createButton(curX, y1, 85, btnH, "Ván mới", () => this.startNewRun(), { variant: "ghost" });

    this.buttons.start = this.createButton(
      l.boardPanelX + l.boardPanelW - ctaW,
      y1 - 2,
      ctaW,
      48,
      "XUẤT TRẬN",
      () => this.beginCombat(),
      { variant: "cta", fontSize: 16, bold: true }
    );
    this.buttons.start.bg.setStrokeStyle(1.4, UI_COLORS.ctaEdge, 0.98);

    // Cài đặt moved to top right
    this.buttons.settings = this.createButton(
      l.boardPanelX + l.boardPanelW - 118,
      l.topPanelY + 14,
      104,
      32,
      "⚙ Cài đặt",
      () => this.toggleSettingsOverlay(),
      { variant: "ghost", fontSize: 12 }
    );

    this.buttons.wiki = this.createButton(
      l.boardPanelX + l.boardPanelW - ctaW - 100, // To the left of START button
      y1 + 8,
      86,
      34,
      "📖 Wiki",
      () => this.toggleWikiModal(),
      { variant: "ghost", fontSize: 13 }
    );

    this.buttons.history = this.createButton(
      l.boardPanelX + l.boardPanelW - ctaW - 194,
      y1 + 8,
      86,
      34,
      "📜 Lịch sử",
      () => this.toggleHistoryModal(true),
      { variant: "ghost", fontSize: 13 }
    );

    const controlsX = l.boardPanelX + l.boardPanelW - 14;
    const controlsY = l.topPanelY + 54;
    this.controlsText = this.add.text(
      controlsX,
      controlsY,
      "[SPACE] Giao tranh • [S] Bán thú • [R] Ván mới\n[ESC] Cài đặt • Chuột: Zoom/Kéo bản đồ\nTay cầm: A chọn, B hủy, X shop, LB dự bị",
      {
        fontFamily: UI_FONT,
        fontSize: "11px",
        color: UI_COLORS.textMuted,
        align: "right",
        lineSpacing: 2,
        wordWrap: { width: Math.min(560, Math.floor(l.boardPanelW * 0.44)) }
      }
    );
    this.controlsText.setOrigin(1, 0);
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
      subtle: {
        fill: 0x172638,
        edge: UI_COLORS.panelEdgeSoft,
        hover: 0x22384f,
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
      fontSize: `${options.fontSize ?? (options.variant === "cta" ? 16 : 14)}px`,
      color: variant.text,
      fontStyle: options.bold || options.variant === "cta" ? "bold" : "normal"
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

  createSettingsOverlay() {
    const cx = this.scale.width * 0.5;
    const cy = this.scale.height * 0.5;
    this.settingsVisible = false;
    this.settingsOverlay = [];

    const shade = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x05070c, 0.62);
    shade.setDepth(5000);
    shade.setVisible(false);
    shade.setInteractive();
    this.settingsOverlay.push(shade);

    const panel = this.add.rectangle(cx, cy, 540, 560, 0x102035, 0.98);
    panel.setStrokeStyle(1, UI_COLORS.panelEdge, 0.9);
    panel.setDepth(5001);
    panel.setVisible(false);
    this.settingsOverlay.push(panel);

    const title = this.add.text(cx, cy - 180, "Cài đặt trong trận", {
      fontFamily: UI_FONT,
      fontSize: "26px",
      color: "#ffeab0"
    });
    title.setOrigin(0.5);
    title.setDepth(5002);
    title.setVisible(false);
    this.settingsOverlay.push(title);

    const makeModalBtn = (dx, dy, w, h, label, onClick) => {
      const btn = this.createButton(cx + dx - w / 2, cy + dy - h / 2, w, h, label, onClick, { variant: "ghost" });
      btn.shadow.setDepth(5002);
      btn.bg.setDepth(5003);
      btn.text.setDepth(5004);
      btn.setVisible(false);
      this.settingsOverlay.push(btn.shadow, btn.bg, btn.text);
      return btn;
    };

    this.modalButtons = {};
    this.modalButtons.save = makeModalBtn(0, -132, 260, 44, "Lưu tiến trình", () => this.onSaveClick());
    this.modalButtons.load = makeModalBtn(0, -80, 260, 44, "Tải tiến trình", () => this.onLoadClick());
    this.modalButtons.clear = makeModalBtn(0, -28, 260, 44, "Xóa tiến trình lưu", () => this.onClearClick());
    this.modalButtons.audio = makeModalBtn(0, 24, 260, 44, "Âm thanh: Bật", () => this.toggleAudio());
    this.modalButtons.volume = makeModalBtn(0, 76, 260, 44, "Âm lượng: 10/10", () => this.changeVolumeLevel(1));
    this.modalButtons.resolution = makeModalBtn(0, 128, 260, 44, "Độ phân giải: 1600x900", () => this.changeResolution());
    this.modalButtons.guiScale = makeModalBtn(0, 180, 260, 44, "Kích thước GUI: 3/5", () => this.changeGuiScale());
    this.modalButtons.menu = makeModalBtn(-136, 242, 230, 44, "Về trang chủ", () => this.goMainMenu());
    this.modalButtons.close = makeModalBtn(136, 242, 230, 44, "Đóng", () => this.toggleSettingsOverlay(false));
  }

  toggleSettingsOverlay(force = null) {
    const next = typeof force === "boolean" ? force : !this.settingsVisible;
    if (next) this.toggleHistoryModal(false);
    this.settingsVisible = next;
    if (this.modalButtons?.audio) {
      this.modalButtons.audio.setLabel(`Âm thanh: ${this.audioFx.enabled ? "Bật" : "Tắt"}`);
    }
    if (this.modalButtons?.volume) {
      this.modalButtons.volume.setLabel(`Âm lượng: ${this.audioFx.getVolumeLevel()}/10`);
    }
    if (this.modalButtons?.loseMode) {
      this.modalButtons.loseMode.setLabel(`Điều kiện thua: ${getLoseConditionLabel(this.getLoseCondition())}`);
    }
    if (this.modalButtons?.resolution) {
      const resolution = resolveResolution(this.runtimeSettings?.resolutionKey);
      const label = resolution?.label ?? `${resolution.width}x${resolution.height}`;
      this.modalButtons.resolution.setLabel(`Độ phân giải: ${label}`);
    }
    if (this.modalButtons?.guiScale) {
      const level = normalizeGuiScale(this.runtimeSettings?.guiScale);
      this.modalButtons.guiScale.setLabel(`Kích thước GUI: ${level}/5`);
    }
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

    const title = this.add.text(x0 + 20, y0 + 14, "Lịch sử / Nhật ký trận", {
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
    const closeText = this.add.text(x0 + panelW - 24, y0 + 24, "×", {
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
    if (next) {
      this.toggleSettingsOverlay(false);
      this.toggleWikiModal(false);
    }
    this.historyModalVisible = next;
    this.historyModalParts?.forEach((part) => part.setVisible(next));
    if (next) this.refreshHistoryModal();
  }

  createWikiModal() {
    const w = this.scale.width;
    const h = this.scale.height;
    const modalW = Math.min(1060, w - 40);
    const modalH = Math.min(760, h - 40);
    const modalX = w / 2;
    const modalY = h / 2;

    const dimmer = this.add.rectangle(modalX, modalY, w, h, UI_COLORS.screenOverlay, 0.85);
    dimmer.setInteractive();
    dimmer.on("pointerdown", () => this.toggleWikiModal(false));

    const bg = this.add.rectangle(modalX, modalY, modalW, modalH, UI_COLORS.panel, 0.98);
    bg.setStrokeStyle(1, UI_COLORS.panelEdge, 1);
    bg.setInteractive();

    const title = this.add.text(modalX, modalY - modalH / 2 + 24, "Wiki Linh Thú", {
      fontFamily: UI_FONT,
      fontSize: "22px",
      color: UI_COLORS.textPrimary,
      fontStyle: "bold"
    }).setOrigin(0.5);

    const closeBtn = this.createButton(
      modalX + modalW / 2 - 60,
      modalY - modalH / 2 + 24,
      80,
      32,
      "Đóng",
      () => this.toggleWikiModal(false),
      { variant: "ghost", fontSize: 14 }
    );

    const viewportX = modalX - modalW / 2 + 24;
    const viewportY = modalY - modalH / 2 + 60;
    const viewportW = modalW - 48;
    const viewportH = modalH - 100;

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(viewportX, viewportY, viewportW, viewportH);
    const mask = maskShape.createGeometryMask();

    this.wikiListBaseY = viewportY;
    this.wikiListContainer = this.add.container(viewportX, this.wikiListBaseY);
    this.wikiListContainer.setMask(mask);

    const wheelZone = this.add.zone(modalX, modalY, modalW, modalH);
    wheelZone.setInteractive();
    wheelZone.on("wheel", (pointer, deltaX, deltaY, deltaZ) => {
      this.onWikiWheel(deltaY);
    });

    this.wikiOverlay = [
      dimmer,
      bg,
      title,
      closeBtn.bg,
      closeBtn.text,
      closeBtn.shadow,
      this.wikiListContainer,
      maskShape,
      wheelZone
    ];
  }

  refreshWikiList() {
    if (!this.wikiListContainer) return;
    this.wikiListContainer.removeAll(true);

    // Prepare craft recipes with base item lookups (lazy)
    if (!this._wikiCraftRecipes) {
      const baseById = Object.fromEntries(BASE_ITEMS.map((b) => [b.id, b]));
      this._wikiCraftRecipes = [...CRAFT_RECIPES]
        .map((r) => {
          const gridSize = this.getRecipeGridSize(r);
          return {
            ...r,
            _gridSize: gridSize,
            _pattern: this.getRecipePattern(r).map((id) => (id ? baseById[id] ?? { icon: "?", name: id } : null)),
            _requiredLabel: this.getRecipeRequiredList(r)
              .map((id) => baseById[id] ?? { icon: "?", name: id })
              .map((item) => `${item.icon} ${item.name}`)
              .join(" + ")
          };
        })
        .sort((a, b) => (a._gridSize ?? 2) - (b._gridSize ?? 2));
    }

    const w = this.scale.width;
    const modalW = Math.min(1060, w - 40);
    const viewportW = modalW - 48;

    let y = 0;

    // --- Tab bar ---
    const tabDefs = [
      { key: "units", label: "🐾 LINH THÚ" },
      { key: "recipes", label: "⚗️ CÔNG THỨC" }
    ];
    tabDefs.forEach((td, i) => {
      const active = this._wikiTab === td.key;
      const tabW = 180;
      const tabX = i * (tabW + 8);
      const tabBg = this.add.rectangle(tabX, y, tabW, 32, active ? 0x2a5080 : 0x1a2d40, active ? 1 : 0.8).setOrigin(0, 0);
      tabBg.setStrokeStyle(1, active ? 0x7ab8f5 : 0x3a5070, 1);
      tabBg.setInteractive({ useHandCursor: true });
      tabBg.on("pointerdown", () => {
        this._wikiDetailUnit = null;
        this._wikiTab = td.key;
        this.wikiScrollY = 0;
        this.refreshWikiList();
      });
      const tabLabel = this.add.text(tabX + tabW / 2, y + 16, td.label, {
        fontFamily: UI_FONT, fontSize: "14px",
        color: active ? "#ffeab0" : "#8ab4d4"
      }).setOrigin(0.5);
      this.wikiListContainer.add([tabBg, tabLabel]);
    });
    y += 44;

    // ---- UNIT DETAIL VIEW ----
    if (this._wikiDetailUnit) {
      const unit =
        typeof this._wikiDetailUnit === "string" ? UNIT_BY_ID[this._wikiDetailUnit] : this._wikiDetailUnit;
      if (!unit) {
        this._wikiDetailUnit = null;
        this.refreshWikiList();
        return;
      }
      const visual = getUnitVisual(unit.id, unit.classType);
      const skill = SKILL_LIBRARY?.[unit.skillId];
      const stats = unit.stats ?? {};
      const range = Number.isFinite(stats.range) ? stats.range : 1;
      const evasionPct = Math.round(getBaseEvasion(unit.classType) * 100);

      const backBtn = this.add.text(0, y, "← Quay lại danh sách", {
        fontFamily: UI_FONT, fontSize: "14px", color: "#7ab8f5"
      }).setInteractive({ useHandCursor: true });
      backBtn.on("pointerdown", () => {
        this._wikiDetailUnit = null;
        this.wikiScrollY = 0;
        this.refreshWikiList();
      });
      this.wikiListContainer.add(backBtn);
      y += 28;

      const detailBg = this.add.rectangle(0, y, viewportW - 14, 300, 0x0f1e30, 0.95).setOrigin(0, 0);
      detailBg.setStrokeStyle(1, 0x5a8ab0, 0.8);
      this.wikiListContainer.add(detailBg);

      const nameText = this.add.text(16, y + 12, `${visual.icon}  ${visual.nameVi}`, {
        fontFamily: UI_FONT, fontSize: "24px", color: "#ffeab0", fontStyle: "bold"
      });
      this.wikiListContainer.add(nameText);

      const tierText = this.add.text(viewportW - 30, y + 12, `Bậc ${unit.tier}`, {
        fontFamily: UI_FONT, fontSize: "16px", color: "#8df2ff"
      }).setOrigin(1, 0);
      this.wikiListContainer.add(tierText);

      const metaText = this.add.text(16, y + 46, [
        `Tộc: ${getTribeLabelVi(unit.tribe)}   Nghề: ${getClassLabelVi(unit.classType)}`,
        `HP: ${stats.hp ?? "?"}   ATK: ${stats.atk ?? "?"}   DEF: ${stats.def ?? "?"}   MDEF: ${stats.mdef ?? "?"}`,
        `MATK: ${stats.matk ?? "?"}   Tầm đánh: ${range}   Né tránh: ${evasionPct}%   Nộ tối đa: ${stats.rageMax ?? "?"}`
      ].join("\n"), {
        fontFamily: UI_FONT, fontSize: "14px", color: "#c0ddf5", lineSpacing: 6
      });
      this.wikiListContainer.add(metaText);

      const skillTitle = this.add.text(16, y + 126, "⚡ KỸ NĂNG:", {
        fontFamily: UI_FONT, fontSize: "14px", color: "#ffd580", fontStyle: "bold"
      });
      this.wikiListContainer.add(skillTitle);

      const skillNameText = this.add.text(16, y + 148, skill?.name ?? unit.skillId, {
        fontFamily: UI_FONT, fontSize: "17px", color: "#8df2ff", fontStyle: "bold"
      });
      this.wikiListContainer.add(skillNameText);

      const skillDesc = this.add.text(16, y + 172, skill?.descriptionVi ?? skill?.description ?? "Chưa có mô tả.", {
        fontFamily: UI_FONT, fontSize: "13px", color: "#d0eaff", lineSpacing: 5,
        wordWrap: { width: viewportW - 44 }
      });
      this.wikiListContainer.add(skillDesc);

      const atkY = y + 172 + skillDesc.height + 14;
      const atkTitle = this.add.text(16, atkY, "⚔️ ĐÁNH THƯỜNG:", {
        fontFamily: UI_FONT, fontSize: "14px", color: "#ffd580", fontStyle: "bold"
      });
      this.wikiListContainer.add(atkTitle);

      const rangeLabel = range >= 3 ? "Tầm xa (3+)" : range >= 2 ? "Tầm trung (2)" : "Cận chiến (1)";
      const atkDesc = this.add.text(16, atkY + 22, `${rangeLabel} • Mỗi lượt tấn công 1 mục tiêu gần nhất của phe địch.`, {
        fontFamily: UI_FONT, fontSize: "13px", color: "#d0eaff", lineSpacing: 4,
        wordWrap: { width: viewportW - 44 }
      });
      this.wikiListContainer.add(atkDesc);

      const detailBottom = atkY + 22 + atkDesc.height + 16;
      const detailHeight = Math.max(300, detailBottom - y);
      detailBg.setSize(viewportW - 14, detailHeight);

      const arenaY = y + detailHeight + 12;
      const arenaHeight = this.renderWikiBattlePreview(arenaY, viewportW - 14, unit);
      y = arenaY + arenaHeight + 8;
      this.wikiMaxScroll = Math.max(0, y - (Math.min(760, this.scale.height - 40) - 100));
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

      const intro = this.add.text(0, y, `Tổng thú: ${units.length}\nTheo nghề: ${classSummary}\nTheo tộc: ${tribeSummary}`, {
        fontFamily: "Consolas", fontSize: "16px", color: "#d8edff", lineSpacing: 5, wordWrap: { width: 900 }
      });
      this.wikiListContainer.add(intro);
      y += intro.height + 14;

      const sectionTitle = this.add.text(0, y, "Danh sách thú  (click để xem chi tiết)", {
        fontFamily: UI_FONT, fontSize: "18px", color: "#ffeab0"
      });
      this.wikiListContainer.add(sectionTitle);
      y += sectionTitle.height + 10;

      const columns = viewportW > 820 ? 2 : 1;
      const gap = 12;
      const cardW = Math.floor((viewportW - gap * (columns - 1)) / columns);
      const cardH = 92;

      units.forEach((unit, idx) => {
        const visual = getUnitVisual(unit.id, unit.classType);
        const skillNameRaw = SKILL_LIBRARY?.[unit.skillId]?.name ?? unit.skillId;
        const skillName = skillNameRaw;
        const col = idx % columns;
        const row = Math.floor(idx / columns);
        const cardX = col * (cardW + gap);
        const cardY = y + row * (cardH + 8);

        const bg = this.add.rectangle(cardX, cardY, cardW, cardH, idx % 2 === 0 ? 0x182b44 : 0x16273f, 0.88).setOrigin(0, 0);
        bg.setStrokeStyle(1, 0x7ab8f5, 0.45);
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerover", () => bg.setStrokeStyle(1, 0xffeab0, 0.9));
        bg.on("pointerout", () => bg.setStrokeStyle(1, 0x7ab8f5, 0.45));
        bg.on("pointerdown", () => {
          this._wikiDetailUnit = unit;
          this.wikiScrollY = 0;
          this.refreshWikiList();
        });

        const name = this.add.text(cardX + 10, cardY + 8, unit.name, {
          fontFamily: UI_FONT, fontSize: "15px", color: "#ffeab0", fontStyle: "bold"
        });
        const tierBadge = this.add.text(cardX + cardW - 30, cardY + 8, `T${unit.tier}`, {
          fontFamily: "Consolas", fontSize: "14px", color: "#8df2ff"
        }).setOrigin(1, 0);

        const meta = this.add.text(cardX + 10, cardY + 30, `${getClassLabelVi(unit.classType)} • ${getTribeLabelVi(unit.tribe)}`, {
          fontFamily: UI_FONT, fontSize: "13px", color: "#a6bed3"
        });

        const skill = this.add.text(cardX + 10, cardY + 52, `Skill: ${skillName}`, {
          fontFamily: UI_FONT, fontSize: "13px", color: "#d6f5ff"
        });

        this.wikiListContainer.add([bg, name, tierBadge, meta, skill]);
      });

      const rows = Math.ceil(units.length / columns);
      y += rows * (cardH + 8);
    }

    // ---- RECIPES TAB ----
    if (this._wikiTab === "recipes") {
      const recipeTitle = this.add.text(0, y, "Công thức chế tạo trang bị", {
        fontFamily: UI_FONT, fontSize: "20px", color: "#ffeab0"
      });
      this.wikiListContainer.add(recipeTitle);
      y += recipeTitle.height + 8;

      const hint = this.add.text(0, y, "Bàn chế mặc định 2x2. Nâng cấp 15 vàng sẽ mở 3x3 và thêm công thức xịn.", {
        fontFamily: UI_FONT, fontSize: "14px", color: "#9ec4e8", wordWrap: { width: viewportW - 14 }
      });
      this.wikiListContainer.add(hint);
      y += hint.height + 12;

      const rcols = viewportW > 700 ? 2 : 1;
      const rgap = 12;
      const rcardW = Math.floor((viewportW - rgap * (rcols - 1)) / rcols);
      const rcardH = 196;

      this._wikiCraftRecipes.forEach((recipe, idx) => {
        const col = idx % rcols;
        const row = Math.floor(idx / rcols);
        const cardX = col * (rcardW + rgap);
        const cardY = y + row * (rcardH + 8);
        const bg = this.add.rectangle(cardX, cardY, rcardW, rcardH, idx % 2 === 0 ? 0x1a2e44 : 0x162840, 0.9).setOrigin(0, 0);
        bg.setStrokeStyle(1, 0x5a8ab0, 0.5);
        const title = this.add.text(cardX + 10, cardY + 8, `${recipe.icon} ${recipe.name}`, {
          fontFamily: UI_FONT,
          fontSize: "14px",
          color: "#e9f5ff",
          fontStyle: "bold"
        });

        const gridSize = recipe._gridSize ?? 2;
        const slotSize = gridSize >= 3 ? 18 : 22;
        const slotGap = 5;
        const gridX = cardX + 10;
        const gridY = cardY + 34;
        const gridW = gridSize * slotSize + (gridSize - 1) * slotGap;
        const gridCenterY = gridY + gridW * 0.5;
        const patternSlots = [];
        for (let s = 0; s < gridSize * gridSize; s += 1) {
          const sx = gridX + (s % gridSize) * (slotSize + slotGap);
          const sy = gridY + Math.floor(s / gridSize) * (slotSize + slotGap);
          const cellBg = this.add.rectangle(sx + slotSize / 2, sy + slotSize / 2, slotSize, slotSize, 0x112235, 0.98);
          cellBg.setStrokeStyle(1, 0x5a8ab0, 0.7);
          const item = recipe._pattern?.[s] ?? null;
          const icon = this.add.text(sx + slotSize / 2, sy + slotSize / 2, item?.icon ?? "", {
            fontFamily: "Segoe UI Emoji",
            fontSize: "14px",
            color: "#ffffff"
          }).setOrigin(0.5);
          patternSlots.push(cellBg, icon);
        }

        const sizeTag = this.add.text(cardX + rcardW - 10, cardY + 10, `Khung ${gridSize}x${gridSize}`, {
          fontFamily: UI_FONT,
          fontSize: "11px",
          color: "#9ec4e8"
        }).setOrigin(1, 0);

        const arrow = this.add.text(gridX + gridW + 10, gridCenterY, "→", {
          fontFamily: UI_FONT,
          fontSize: "18px",
          color: "#a6cff1",
          fontStyle: "bold"
        }).setOrigin(0.5);
        const outX = gridX + gridW + 24;
        const outBg = this.add.rectangle(outX + slotSize / 2, gridCenterY, slotSize, slotSize, 0x2a4563, 0.96);
        outBg.setStrokeStyle(1, 0x82c2ff, 0.9);
        const outIcon = this.add.text(outX + slotSize / 2, gridCenterY, recipe.icon, {
          fontFamily: "Segoe UI Emoji",
          fontSize: "15px",
          color: "#ffffff"
        }).setOrigin(0.5);

        const reqTextY = gridY + gridW + 8;
        const reqText = this.add.text(cardX + 10, reqTextY, `Nguyên liệu: ${recipe._requiredLabel || "?"}`, {
          fontFamily: UI_FONT,
          fontSize: "12px",
          color: "#b9d8f2",
          wordWrap: { width: rcardW - 20 }
        });
        const desc = this.add.text(cardX + 10, reqTextY + reqText.height + 4, recipe.description, {
          fontFamily: UI_FONT,
          fontSize: "12px",
          color: "#d7ecff",
          wordWrap: { width: rcardW - 20 }
        });
        this.wikiListContainer.add([bg, title, sizeTag, ...patternSlots, arrow, outBg, outIcon, reqText, desc]);
      });

      const totalRRows = Math.ceil(this._wikiCraftRecipes.length / rcols);
      y += totalRRows * (rcardH + 8);
    }

    this.wikiMaxScroll = Math.max(0, y - (Math.min(760, this.scale.height - 40) - 100));
  }

  renderWikiBattlePreview(y, width, unit) {
    const panelX = 0;
    const panelH = 318;
    const panel = this.add.rectangle(panelX, y, width, panelH, 0x0f1e30, 0.95).setOrigin(0, 0);
    panel.setStrokeStyle(1, 0x5a8ab0, 0.8);

    const title = this.add.text(panelX + 16, y + 10, "Sân đấu preview đòn đánh / kỹ năng", {
      fontFamily: UI_FONT,
      fontSize: "15px",
      color: "#ffeab0",
      fontStyle: "bold"
    });

    const subTitle = this.add.text(panelX + 16, y + 30, "Phe địch: toàn bộ là hình nộm. Phe ta: 1 linh thú ở trung tâm.", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: "#9ec4e8"
    });

    const buttonY = y + 52;
    const buttonH = 24;
    const buttonW = 124;
    const buttonGap = 10;
    const boardX = panelX + 16;
    const boardY = y + 84;
    const boardW = width - 32;
    const boardH = 176;
    const cellW = Math.max(20, Math.floor(boardW / COLS));
    const cellH = Math.max(24, Math.floor(boardH / ROWS));
    const gridW = cellW * COLS;
    const gridH = cellH * ROWS;
    const gridX = boardX + Math.floor((boardW - gridW) * 0.5);
    const gridY = boardY + Math.floor((boardH - gridH) * 0.5);

    const baseGrid = this.add.graphics();
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const x0 = gridX + col * cellW;
        const y0 = gridY + row * cellH;
        const isEnemy = col >= RIGHT_COL_START;
        const fill = isEnemy ? 0x35201f : 0x193229;
        baseGrid.fillStyle(fill, 0.55);
        baseGrid.fillRoundedRect(x0 + 1, y0 + 1, cellW - 2, cellH - 2, 3);
        baseGrid.lineStyle(1, 0x2f4d63, 0.85);
        baseGrid.strokeRoundedRect(x0 + 0.5, y0 + 0.5, cellW - 1, cellH - 1, 3);
      }
    }
    baseGrid.lineStyle(2, 0x6cb7f0, 0.7);
    baseGrid.beginPath();
    baseGrid.moveTo(gridX + RIGHT_COL_START * cellW, gridY);
    baseGrid.lineTo(gridX + RIGHT_COL_START * cellW, gridY + gridH);
    baseGrid.strokePath();

    const allyLabel = this.add.text(gridX + cellW * 2.5, gridY - 18, "PHE TA", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: "#8fe8bd",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const enemyLabel = this.add.text(gridX + cellW * 7.5, gridY - 18, "PHE ĐỊCH", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: "#ffb0a6",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const dummyFontSize = `${Math.max(12, Math.min(20, Math.floor(cellH * 0.65)))}px`;
    const dummyIcons = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = RIGHT_COL_START; col <= RIGHT_COL_END; col += 1) {
        const cx = gridX + col * cellW + cellW * 0.5;
        const cy = gridY + row * cellH + cellH * 0.5;
        const icon = this.add.text(cx, cy, "🪵", {
          fontFamily: "Segoe UI Emoji",
          fontSize: dummyFontSize
        }).setOrigin(0.5);
        dummyIcons.push(icon);
      }
    }

    const attackerRow = Math.floor(ROWS / 2);
    const attackerCol = Math.floor((PLAYER_COLS - 1) / 2);
    const attackerVisual = getUnitVisual(unit.id, unit.classType);
    const attackerX = gridX + attackerCol * cellW + cellW * 0.5;
    const attackerY = gridY + attackerRow * cellH + cellH * 0.5;
    const attackerIcon = this.add.text(attackerX, attackerY, attackerVisual.icon, {
      fontFamily: "Segoe UI Emoji",
      fontSize: `${Math.max(14, Math.min(24, Math.floor(cellH * 0.75)))}px`
    }).setOrigin(0.5);
    const attackerRing = this.add.circle(attackerX, attackerY, Math.max(10, Math.floor(Math.min(cellW, cellH) * 0.38)), 0x8de8ff, 0.14);
    attackerRing.setStrokeStyle(1.2, 0x8de8ff, 0.9);

    const highlight = this.add.graphics();
    const beam = this.add.graphics();
    const infoText = this.add.text(panelX + 16, y + panelH - 28, "Nhấn nút để xem phạm vi tác động.", {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: "#d0eaff"
    });

    const getCellCenter = (row, col) => ({
      x: gridX + col * cellW + cellW * 0.5,
      y: gridY + row * cellH + cellH * 0.5
    });

    const runPreview = (mode) => {
      const range = Number.isFinite(unit?.stats?.range) ? unit.stats.range : 1;
      const attacker = this.buildPlanningPreviewActor("LEFT", attackerRow, attackerCol, unit.classType, 1, unit.skillId, range);
      attacker.atk = Number.isFinite(unit?.stats?.atk) ? unit.stats.atk : 100;
      attacker.matk = Number.isFinite(unit?.stats?.matk) ? unit.stats.matk : 100;
      const allies = [attacker];
      const enemies = [];
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = RIGHT_COL_START; col <= RIGHT_COL_END; col += 1) {
          const dummy = this.buildPlanningPreviewActor("RIGHT", row, col, "TANKER", 1, null, 1);
          dummy.atk = 90;
          enemies.push(dummy);
        }
      }
      const target = [...enemies].sort((a, b) => this.compareTargets(attacker, a, b))[0];
      if (!target) return;

      const skill = SKILL_LIBRARY[unit.skillId];
      const rawCells =
        mode === "skill"
          ? this.collectSkillPreviewCells(attacker, target, skill, allies, enemies)
          : [{ row: target.row, col: target.col }];
      const cells = this.dedupePreviewCells(rawCells);
      const primary = cells.find((cell) => cell.row === target.row && cell.col === target.col) ?? cells[0] ?? target;

      highlight.clear();
      cells.forEach((cell) => {
        const x0 = gridX + cell.col * cellW;
        const y0 = gridY + cell.row * cellH;
        const isPrimary = cell.row === primary.row && cell.col === primary.col;
        const fill = isPrimary ? 0xffcc6a : 0x6fd6ff;
        const alpha = isPrimary ? 0.34 : 0.2;
        const edge = isPrimary ? 0xffefb5 : 0xb8ebff;
        highlight.fillStyle(fill, alpha);
        highlight.fillRoundedRect(x0 + 1, y0 + 1, cellW - 2, cellH - 2, 3);
        highlight.lineStyle(isPrimary ? 2 : 1.4, edge, 0.95);
        highlight.strokeRoundedRect(x0 + 0.5, y0 + 0.5, cellW - 1, cellH - 1, 3);
      });

      const from = getCellCenter(attacker.row, attacker.col);
      const to = getCellCenter(primary.row, primary.col);
      beam.clear();
      beam.lineStyle(2, mode === "skill" ? 0x93d8ff : 0xffdba0, 0.9);
      beam.beginPath();
      beam.moveTo(from.x, from.y);
      beam.lineTo(to.x, to.y);
      beam.strokePath();

      const projectile = this.add.circle(from.x, from.y, Math.max(3, Math.floor(Math.min(cellW, cellH) * 0.13)), mode === "skill" ? 0x8fdfff : 0xffd783, 0.95);
      this.wikiListContainer.add(projectile);
      this.tweens.add({
        targets: projectile,
        x: to.x,
        y: to.y,
        duration: 220,
        ease: "Sine.Out",
        onComplete: () => projectile.destroy()
      });

      infoText.setText(
        mode === "skill"
          ? `Kỹ năng: ${skill?.name ?? unit.skillId} • ${cells.length} ô tác động`
          : `Đánh thường: mục tiêu chính tại ${this.toChessCoord(primary.row, primary.col)}`
      );
    };

    const createActionButton = (x, label, onClick) => {
      const bg = this.add.rectangle(x, buttonY, buttonW, buttonH, 0x1e3852, 0.95).setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x6aaad8, 0.88);
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", onClick);
      bg.on("pointerover", () => bg.setFillStyle(0x2c5070, 0.98));
      bg.on("pointerout", () => bg.setFillStyle(0x1e3852, 0.95));
      const text = this.add.text(x + buttonW * 0.5, buttonY + buttonH * 0.5, label, {
        fontFamily: UI_FONT,
        fontSize: "12px",
        color: "#e9f5ff",
        fontStyle: "bold"
      }).setOrigin(0.5);
      return [bg, text];
    };

    const basicButton = createActionButton(panelX + 16, "Preview đánh thường", () => runPreview("basic"));
    const skillButton = createActionButton(panelX + 16 + buttonW + buttonGap, "Preview kỹ năng", () => runPreview("skill"));

    this.wikiListContainer.add([
      panel,
      title,
      subTitle,
      ...basicButton,
      ...skillButton,
      baseGrid,
      allyLabel,
      enemyLabel,
      ...dummyIcons,
      attackerRing,
      attackerIcon,
      highlight,
      beam,
      infoText
    ]);

    runPreview("basic");
    return panelH;
  }

  toggleWikiModal(force = null) {
    const next = typeof force === "boolean" ? force : !this.wikiVisible;
    if (next) {
      this.toggleSettingsOverlay(false);
      this.toggleHistoryModal(false);
      if (!this.wikiOverlay.length) this.createWikiModal();
    } else {
      this.clearAttackPreview();
    }
    this.wikiVisible = next;
    this.wikiOverlay.forEach((o) => o?.setVisible(next));
    if (next) {
      this.wikiScrollY = 0;
      this.refreshWikiList();
    }
  }

  onWikiWheel(dy) {
    if (!this.wikiVisible) return;
    this.wikiScrollY = clamp(this.wikiScrollY + dy * 0.5, 0, this.wikiMaxScroll);
    this.wikiListContainer.setY(this.wikiListBaseY - this.wikiScrollY);
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
      const empty = this.add.text(0, 0, "Chưa có dữ liệu lịch sử cho bộ lọc này.", {
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
        const block = this.add.text(0, y, `[Vòng ${entry.round}] [${categoryLabel}] ${entry.message}`, {
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

  onSaveClick() {
    const ok = saveProgress(this.exportRunState());
    this.audioFx.play("click");
    this.addLog(ok ? "Đã lưu tiến trình vào localStorage." : "Không thể lưu tiến trình.");
  }

  onLoadClick() {
    const loaded = hydrateRunState(loadProgress());
    if (!loaded) {
      this.addLog("Không tìm thấy dữ liệu lưu hợp lệ.");
      return;
    }
    this.applyRunState(loaded);
    this.audioFx.setEnabled(loaded.audioEnabled !== false);
    this.runtimeSettings.audioEnabled = this.audioFx.enabled;
    this.runtimeSettings.aiMode = this.aiMode;
    this.runtimeSettings.loseCondition = this.getLoseCondition();
    this.runtimeSettings.volumeLevel = this.audioFx.getVolumeLevel();
    saveUiSettings(this.runtimeSettings);
    this.modalButtons?.audio?.setLabel(`Âm thanh: ${this.audioFx.enabled ? "Bật" : "Tắt"}`);
    this.modalButtons?.volume?.setLabel(`Âm lượng: ${this.audioFx.getVolumeLevel()}/10`);
    this.modalButtons?.loseMode?.setLabel(`Điều kiện thua: ${getLoseConditionLabel(this.getLoseCondition())}`);
    this.prepareEnemyPreview();
    this.addLog("Đã tải tiến trình.");
  }

  onClearClick() {
    const ok = clearProgress();
    this.audioFx.play("click");
    this.addLog(ok ? "Đã xóa dữ liệu lưu cục bộ." : "Không xóa được dữ liệu lưu.");
  }

  toggleAudio() {
    this.audioFx.setEnabled(!this.audioFx.enabled);
    this.runtimeSettings.audioEnabled = this.audioFx.enabled;
    this.runtimeSettings.volumeLevel = this.audioFx.getVolumeLevel();
    saveUiSettings(this.runtimeSettings);
    this.modalButtons?.audio?.setLabel(`Âm thanh: ${this.audioFx.enabled ? "Bật" : "Tắt"}`);
    this.modalButtons?.volume?.setLabel(`Âm lượng: ${this.audioFx.getVolumeLevel()}/10`);
    this.addLog(`Âm thanh ${this.audioFx.enabled ? "Bật" : "Tắt"}.`);
    this.persistProgress();
  }

  changeVolumeLevel(step = 1) {
    const current = this.audioFx.getVolumeLevel();
    const next = current + step > 10 ? 1 : current + step;
    this.audioFx.setVolumeLevel(next);
    this.runtimeSettings.volumeLevel = next;
    saveUiSettings(this.runtimeSettings);
    this.modalButtons?.volume?.setLabel(`Âm lượng: ${next}/10`);
    this.addLog(`Âm lượng: ${next}/10.`);
    this.persistProgress();
  }

  changeResolution() {
    const currentKey = normalizeResolutionKey(this.runtimeSettings?.resolutionKey);
    const idx = RESOLUTION_PRESETS.findIndex((preset) => preset.key === currentKey);
    const next = RESOLUTION_PRESETS[(idx + 1) % RESOLUTION_PRESETS.length];
    this.runtimeSettings.resolutionKey = next.key;
    saveUiSettings(this.runtimeSettings);
    this.modalButtons?.resolution?.setLabel(`Độ phân giải: ${next.label ?? `${next.width}x${next.height}`}`);
    const restoredState = this.exportRunState();
    this.scene.start("PlanningScene", { restoredState, settings: this.runtimeSettings, mode: this.gameMode });
  }

  changeGuiScale() {
    const current = normalizeGuiScale(this.runtimeSettings?.guiScale);
    const next = current >= 5 ? 1 : current + 1;
    this.runtimeSettings.guiScale = next;
    saveUiSettings(this.runtimeSettings);
    this.modalButtons?.guiScale?.setLabel(`Kích thước GUI: ${next}/5`);
    this.applyDisplaySettings(this.runtimeSettings, false);
  }

  goMainMenu() {
    this.toggleSettingsOverlay(false);
    this.persistProgress();
    this.scene.start("MainMenuScene");
  }

  createPlayerCellZones() {
    const { tileW, tileH } = this.getTileSize();
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const tile = this.tileLookup.get(gridKey(row, col));
        const zone = this.add.zone(tile.center.x, tile.center.y, tileW - 10, tileH - 10);
        zone.setRectangleDropZone(tileW - 10, tileH - 10);
        zone.setInteractive({ useHandCursor: true });
        this.tooltip.attach(zone, () => {
          const unit = this.player?.board?.[row]?.[col];
          if (unit) return null;
          return { title: `Ô ${this.toChessCoord(row, col)}`, body: "Ô trống." };
        });
        zone.on("pointerover", () => {
          const unit = this.player?.board?.[row]?.[col];
          if (unit) return;
        });
        zone.on("pointerout", () => {
          const unit = this.player?.board?.[row]?.[col];
          if (unit) return;
          this.clearAttackPreview();
        });
        zone.on("pointerup", (pointer) => {
          if (this.isUnitDragging) return;
          if (this.boardDragConsumed) return;
          if (this.isPanPointer(pointer)) return;
          const occupant = this.player?.board?.[row]?.[col];
          if (occupant) return;
          this.onPlayerCellClick(row, col);
        });
        zone.setDepth(20);
        this.playerCellZones.push({ row, col, zone });
      }
    }
  }
  createBenchSlots() {
    this.benchSlots.forEach(s => {
      s.bg.destroy();
      s.label.destroy();
      s.icon.destroy();
    });
    this.benchSlots = [];

    const l = this.layout;
    const maxSlots = l.benchCols * l.benchRows;
    const startX = l.benchSlotsRegionX ?? l.benchRegionX;
    const y = l.benchY;
    const slotW = l.benchSlotW;
    const slotH = l.benchSlotH;
    const cols = l.benchCols;
    for (let i = 0; i < maxSlots; i += 1) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (slotW + l.benchGap);
      const yy = y + row * (slotH + l.benchRowGap);
      const bg = this.add.rectangle(x + slotW / 2, yy + slotH / 2, slotW, slotH, 0x141f2d, 0.9);
      bg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.85);
      bg.setDepth(1500);
      const label = this.createBenchSlotLabel(x, yy, slotW);
      const icon = this.createBenchSlotIcon(x, yy, slotH);
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", (pointer, _localX, _localY, event) => {
        if (pointer?.rightButtonDown?.()) {
          if (event?.stopPropagation) event.stopPropagation();
          if (this.phase !== PHASE.PLANNING || this.settingsVisible || this.wikiVisible || this.historyModalVisible) return;
          const unit = this.player?.bench?.[i];
          if (unit) this.showContextMenu(unit, "BENCH", i, null, pointer.x, pointer.y);
          return;
        }
        this.onBenchClick(i);
      });
      this.tooltip.attach(bg, () => {
        const unit = this.player?.bench?.[i];
        if (!unit) return { title: `Dự bị ${i + 1}`, body: "Ô trống." };
        return this.getUnitTooltip(unit.baseId, unit.star, unit);
      });
      this.benchSlots.push({ x, y: yy, slotW, slotH, bg, label, icon });
    }

    if (this.shopTitle) this.shopTitle.destroy();
    this.shopTitle = this.add.text(l.shopRegionX, l.shopY - 30, "Cửa hàng", {
      fontFamily: UI_FONT,
      fontSize: "17px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    });
    this.shopTitle.setDepth(2000);

    if (this.benchTitle) this.benchTitle.destroy();
    this.benchTitle = this.add.text(l.benchSlotsRegionX ?? l.benchRegionX, l.benchY - 24, "Dự bị", {
      fontFamily: UI_FONT,
      fontSize: "17px",
      color: UI_COLORS.textSecondary,
      fontStyle: "bold"
    });
    this.benchTitle.setDepth(2000);
  }

  createBenchSlotLabel(x, y, slotW) {
    const label = this.add.text(x + 8, y + 8, "", {
      fontFamily: UI_FONT,
      fontSize: "10px",
      color: UI_COLORS.textPrimary,
      wordWrap: { width: slotW - 14 }
    });
    label.setDepth(1501);
    return label;
  }

  createBenchSlotIcon(x, y, slotH) {
    const icon = this.add.text(x + 8, y + slotH - 24, "", {
      fontFamily: "Segoe UI Emoji",
      fontSize: "16px",
      color: "#ffffff"
    });
    icon.setDepth(1502);
    return icon;
  }

  isTextRenderable(obj) {
    return Boolean(obj && obj.active && obj.scene && obj.texture?.source?.[0]?.image);
  }

  ensureBenchSlotTextObjects(slot) {
    if (!slot) return;
    if (!this.isTextRenderable(slot.label)) {
      slot.label?.destroy();
      slot.label = this.createBenchSlotLabel(slot.x, slot.y, slot.slotW);
    }
    if (!this.isTextRenderable(slot.icon)) {
      slot.icon?.destroy();
      slot.icon = this.createBenchSlotIcon(slot.x, slot.y, slot.slotH);
    }
  }

  safeUpdateBenchSlotText(slot, labelText, labelColor, iconText) {
    if (!slot) return;
    const safeLabelText = String(labelText ?? "");
    const safeIconText = String(iconText ?? "");
    const apply = () => {
      this.ensureBenchSlotTextObjects(slot);
      if (slot.label.text !== safeLabelText) slot.label.setText(safeLabelText);
      const currentColor = slot.label.style?.color;
      if (labelColor && currentColor !== labelColor) {
        try {
          slot.label.setColor(labelColor);
        } catch (_colorErr) {
          slot.label.setStyle({ color: labelColor });
        }
      }
      if (slot.icon.text !== safeIconText) slot.icon.setText(safeIconText);
      slot.icon.setVisible(Boolean(safeIconText));
    };

    try {
      apply();
    } catch (_err) {
      slot.label?.destroy();
      slot.icon?.destroy();
      slot.label = this.createBenchSlotLabel(slot.x, slot.y, slot.slotW);
      slot.icon = this.createBenchSlotIcon(slot.x, slot.y, slot.slotH);
      apply();
    }
  }

  getTileSize() {
    return {
      tileW: TILE_W * this.boardZoom,
      tileH: TILE_H * this.boardZoom
    };
  }

  setupBoardViewInput() {
    this.input.on("wheel", (pointer, _gos, _dx, dy) => {
      if (this.wikiVisible) {
        this.onWikiWheel(dy);
        return;
      }
      if (this.historyModalVisible) {
        this.onHistoryWheel(dy);
        return;
      }
      if (this.pointInRightPanel(pointer.x, pointer.y)) {
        this.onRightPanelWheel(dy);
        return;
      }
      if (!this.pointInBoardPanel(pointer.x, pointer.y)) return;
      const before = this.boardZoom;
      this.boardZoom = clamp(this.boardZoom - dy * 0.0012, 0.65, 1.85);
      if (Math.abs(before - this.boardZoom) < 0.0001) return;
      this.refreshBoardGeometry();
    });

    this.input.on("pointerdown", (pointer) => {
      if (pointer?.rightButtonDown?.()) return;
      if (this.isPanPointer(pointer)) {
        if (!this.pointInBoardPanel(pointer.x, pointer.y)) return;
        this.boardPointerDown = { x: pointer.x, y: pointer.y };
        this.boardDragConsumed = false;
        this.isBoardDragging = true;
        this.lastDragPoint = { x: pointer.x, y: pointer.y };
        return;
      }

      // Check left click for Unit Drag
      if (pointer.leftButtonDown() && this.phase === PHASE.PLANNING && !this.wikiVisible && !this.historyModalVisible && !this.settingsVisible) {
        const unit = this.getUnitAt(pointer.x, pointer.y);
        if (unit) {
          this.startUnitDrag(unit, pointer);
          return;
        }
      }

      // Fallback to Pan if missed unit but on board panel
      if (this.pointInBoardPanel(pointer.x, pointer.y)) {
        this.boardPointerDown = { x: pointer.x, y: pointer.y };
        this.boardDragConsumed = false;
        this.lastDragPoint = { x: pointer.x, y: pointer.y };
      }
    });

    this.input.on("pointermove", (pointer) => {
      if (this.isUnitDragging) {
        this.updateUnitDrag(pointer);
        return;
      }

      if (this.isBoardDragging && this.lastDragPoint) {
        const dx = pointer.x - this.lastDragPoint.x;
        const dy = pointer.y - this.lastDragPoint.y;
        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;
        this.boardDragConsumed = true;
        this.boardPanX += dx;
        this.boardPanY += dy;
        this.lastDragPoint = { x: pointer.x, y: pointer.y };
        this.refreshBoardGeometry();
        return;
      }

      // Check threshold for starting pan if not already dragging
      if (!this.isBoardDragging && this.boardPointerDown) {
        if (!this.pointInBoardPanel(this.boardPointerDown.x, this.boardPointerDown.y)) return;
        const dx0 = pointer.x - this.boardPointerDown.x;
        const dy0 = pointer.y - this.boardPointerDown.y;
        if (Math.hypot(dx0, dy0) > 6) {
          this.isBoardDragging = true;
          this.boardDragConsumed = true;
          this.lastDragPoint = { x: pointer.x, y: pointer.y };
        }
      }
    });

    const releaseDrag = (pointer) => {
      if (this.isUnitDragging) {
        this.endUnitDrag(pointer);
        return;
      }

      this.isBoardDragging = false;
      this.lastDragPoint = null;
      this.boardPointerDown = null;
      if (this.boardDragConsumed) {
        this.time.delayedCall(0, () => {
          this.boardDragConsumed = false;
        });
      } else {
        this.boardDragConsumed = false;
        this.clearHighlights();
      }
    };
    this.input.on("pointerup", releaseDrag);
    this.input.on("pointerupoutside", releaseDrag);
  }

  findPlayerBoardCellFromPoint(x, y, allowNear = true) {
    const { tileW, tileH } = this.getTileSize();
    const halfW = Math.max(1, tileW * 0.5);
    const halfH = Math.max(1, tileH * 0.5);
    const nearThreshold = Math.max(40, Math.min(180, Math.hypot(halfW, halfH) + 8));
    let bestInside = null;
    let bestInsideDist = Number.POSITIVE_INFINITY;
    let bestNear = null;
    let bestNearDist = Number.POSITIVE_INFINITY;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const tile = this.tileLookup.get(gridKey(row, col));
        if (!tile?.center) continue;
        const dx = Math.abs(x - tile.center.x);
        const dy = Math.abs(y - tile.center.y);
        const dist = Phaser.Math.Distance.Between(x, y, tile.center.x, tile.center.y);
        const diamond = dx / halfW + dy / halfH;
        if (diamond <= 1.08 && dist < bestInsideDist) {
          bestInsideDist = dist;
          bestInside = { row, col, center: tile.center };
        }
        if (allowNear && dist < nearThreshold && dist < bestNearDist) {
          bestNearDist = dist;
          bestNear = { row, col, center: tile.center };
        }
      }
    }

    return bestInside ?? bestNear;
  }

  getUnitAt(x, y) {
    // Check Bench
    for (let i = 0; i < this.benchSlots.length; i++) {
      const slot = this.benchSlots[i];
      if (slot.bg.visible && slot.bg.getBounds().contains(x, y)) {
        const unit = this.player?.bench?.[i];
        return unit ? { unit, region: "BENCH", index: i } : null;
      }
    }
    // Check Board (zoom-aware hit)
    const hit = this.findPlayerBoardCellFromPoint(x, y, true);
    if (hit) {
      const { row: r, col: c } = hit;
      const unit = this.player?.board?.[r]?.[c];
      return unit ? { unit, region: "BOARD", r, c } : null;
    }
    return null;
  }

  getDropTarget(x, y) {
    // Check Bench first (UI overlay)
    for (let i = 0; i < this.benchSlots.length; i++) {
      const slot = this.benchSlots[i];
      if (slot.bg.visible && slot.bg.getBounds().contains(x, y)) {
        return { type: "BENCH", index: i, center: { x: slot.x + slot.slotW / 2, y: slot.y + slot.slotH / 2 } };
      }
    }
    // Check Board (zoom-aware hit)
    const hit = this.findPlayerBoardCellFromPoint(x, y, true);
    if (hit) {
      const { row: r, col: c, center } = hit;
      return { type: "BOARD", r, c, center };
    }
    // Check Sell Button
    if (this.buttons.sell && this.buttons.sell.visible && this.buttons.sell.getBounds().contains(x, y)) {
      return { type: "SELL" };
    }

    return null;
  }

  startUnitDrag(dragData, pointer) {
    this.isUnitDragging = true;
    this.dragUnit = dragData.unit;
    this.dragOrigin = dragData;

    // Create Clone
    const visual = getUnitVisual(dragData.unit.baseId, dragData.unit.base.classType);
    const clone = this.add.container(pointer.x, pointer.y);
    const bg = this.add.circle(0, 0, 24, 0x365675, 0.8);
    bg.setStrokeStyle(2, 0xbdcf47, 1);
    const txt = this.add.text(0, 0, visual.icon, { fontSize: "32px" }).setOrigin(0.5);
    clone.add([bg, txt]);
    clone.setDepth(4000);
    this.dragClone = clone;

    // Hide original
    if (dragData.unit.sprite) dragData.unit.sprite.setVisible(false);
    // If on bench
    if (dragData.region === "BENCH") {
      const slot = this.benchSlots[dragData.index];
      if (slot && slot.icon) slot.icon.setVisible(false); // Hide bench icon
    }

    this.audioFx.play("click");
  }

  updateUnitDrag(pointer) {
    if (!this.dragClone) return;
    this.dragClone.setPosition(pointer.x, pointer.y);

    // Highlight target
    const target = this.getDropTarget(pointer.x, pointer.y);
    if (target) {
      if (target.type === "SELL") {
        this.buttons.sell.bg.setStrokeStyle(2, 0xff4444);
      }
      // Bench/Board highlights could be added here
    }
  }

  endUnitDrag(pointer) {
    this.isUnitDragging = false;
    if (this.dragClone) {
      this.dragClone.destroy();
      this.dragClone = null;
    }

    // Show original back (default, will be moved if successful)
    if (this.dragUnit && this.dragUnit.sprite) this.dragUnit.sprite.setVisible(true);
    if (this.dragOrigin && this.dragOrigin.region === "BENCH") {
      this.refreshBenchUi(); // Restore icon visibility
    }

    const target = this.getDropTarget(pointer.x, pointer.y);
    if (!target) {
      // Cancelled
      return;
    }

    const suppressBoardClickOnce = () => {
      this.boardDragConsumed = true;
      this.time.delayedCall(0, () => {
        this.boardDragConsumed = false;
      });
    };
    suppressBoardClickOnce();

    if (target.type === "SELL") {
      this.sellUnit(this.dragUnit.uid);
      return;
    }

    // Move Logic
    const from = this.dragOrigin;
    const to = target.type === "BOARD" ? { region: "BOARD", row: target.r, col: target.c }
      : target.type === "BENCH" ? { region: "BENCH", index: target.index }
        : null;

    if (to) {
      // Check if same slot
      if (from.region === to.region) {
        if (from.region === "BOARD" && from.row === to.row && from.col === to.col) {
          return;
        }
        if (from.region === "BENCH" && from.index === to.index) {
          return;
        }
      }

      const moved = this.moveUnit(from, to, true); // true = swap
      if (moved) {
        this.audioFx.play("click");
      }
    }
  }

  isPanPointer(pointer) {
    if (!pointer) return false;
    const buttons = pointer.event?.buttons ?? 0;
    if (typeof pointer.rightButtonDown === "function" && pointer.rightButtonDown()) return true;
    if (typeof pointer.middleButtonDown === "function" && pointer.middleButtonDown()) return true;
    if (pointer.button === 2 || pointer.button === 1) return true;
    if ((buttons & 2) !== 0 || (buttons & 4) !== 0) return true;
    if ((buttons & 1) !== 0 && (pointer.event?.altKey || pointer.event?.ctrlKey)) return true;
    return false;
  }

  pointInBoardPanel(x, y) {
    const l = this.layout;
    return x >= l.boardPanelX && x <= l.boardPanelX + l.boardPanelW && y >= l.boardPanelY && y <= l.boardPanelY + l.boardPanelH;
  }

  pointInRightPanel(x, y) {
    if (!this.rightPanelArea) return false;
    return (
      x >= this.rightPanelArea.x &&
      x <= this.rightPanelArea.x + this.rightPanelArea.w &&
      y >= this.rightPanelArea.y &&
      y <= this.rightPanelArea.y + this.rightPanelArea.h
    );
  }

  refreshRightPanelScrollMetrics() {
    if (!this.rightPanelArea || !this.rightPanelScrollItems.length) return;
    const viewBottom = this.rightPanelArea.y + this.rightPanelArea.h;
    let contentBottom = this.rightPanelArea.y;
    this.rightPanelScrollItems.forEach((entry) => {
      if (!entry.item?.visible) return;
      const bounds = entry.item.getBounds?.();
      if (!bounds) return;
      const baseBottom = bounds.bottom + this.rightPanelScrollOffset;
      if (baseBottom > contentBottom) contentBottom = baseBottom;
    });
    this.rightPanelMaxScroll = Math.max(0, Math.ceil(contentBottom - viewBottom + 8));
    this.rightPanelScrollOffset = clamp(this.rightPanelScrollOffset, 0, this.rightPanelMaxScroll);
    this.rightPanelScrollItems.forEach((entry) => {
      entry.item.y = entry.baseY - this.rightPanelScrollOffset;
    });
  }

  refreshBoardGeometry() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const data = this.tileLookup.get(gridKey(row, col));
        if (!data) continue;
        const center = this.gridToScreen(col, row);

        data.center = center;
        data.tile.clear();
        this.paintGrassTile(data.tile, center.x, center.y, row, col);
        // Label update removed

      }
    }
    this.refreshBoardEdgeLabels();

    const { tileW, tileH } = this.getTileSize();
    this.playerCellZones.forEach((ref) => {
      const tile = this.tileLookup.get(gridKey(ref.row, ref.col));
      if (!tile) return;
      ref.zone.setPosition(tile.center.x, tile.center.y);
      ref.zone.setSize(tileW - 10, tileH - 10);
    });

    if (this.phase === PHASE.PLANNING || this.phase === PHASE.AUGMENT) {
      this.refreshBoardUi();
    }

    this.gapMarkers.forEach((token, row) => {
      const a = this.gridToScreen(4, row);
      const b = this.gridToScreen(5, row);
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      token.clear();
      this.paintRiverTile(token, mx, my - 2, row);
      token.setDepth(RIVER_LAYER_DEPTH);
    });

    if (this.previewHoverUnit) {
      this.showAttackPreviewForUnit(this.previewHoverUnit);
    }
  }

  canInteractFormation() {
    if (this.phase === PHASE.PLANNING) return true;
    if (this.phase === PHASE.AUGMENT && !this.overlaySprites.length) return true;
    return false;
  }

  onPlayerCellClick(row, col) {
    if (this.isUnitDragging) return;
    if (this.settingsVisible) return;
    if (!this.canInteractFormation()) {
      if (this.phase === PHASE.AUGMENT) this.addLog("Hãy chọn pháp ấn trước khi chỉnh đội hình.");
      return;
    }
    if (this.overlaySprites.length) return;

    const occupant = this.player.board[row][col];
    const selected = this.selectedBenchIndex != null ? this.player.bench[this.selectedBenchIndex] : null;
    if (this.selectedInventoryItemId) {
      if (!occupant) {
        this.addLog("Hãy chọn ô có thú để trang bị.");
        return;
      }
      this.tryEquipSelectedItem(occupant);
      return;
    }

    if (selected) {
      // Check for duplicate unit type on board
      if (this.checkDuplicateUnit(selected.baseId, row, col)) {
        this.addLog("Không thể triển khai 2 thú cùng loại trên sân.");
        return;
      }

      if (!occupant) {
        if (this.getDeployCount() >= this.getDeployCap()) {
          this.addLog(
            `Đã đạt giới hạn triển khai (${this.getDeployCount()}/${this.getDeployCap()}). Hãy nâng cấp hoặc đổi chỗ với thú đang trên sân.`
          );
          return;
        }
        this.player.board[row][col] = selected;
        this.player.bench.splice(this.selectedBenchIndex, 1);
        this.selectedBenchIndex = null;
        this.tryAutoMerge();
        this.refreshPlanningUi();
        this.persistProgress();
        return;
      }

      this.player.board[row][col] = selected;
      this.player.bench[this.selectedBenchIndex] = occupant;
      this.selectedBenchIndex = null;
      this.tryAutoMerge();
      this.refreshPlanningUi();
      this.persistProgress();
      return;
    }

    if (occupant) {
      if (this.player.bench.length >= this.getBenchCap()) {
        this.addLog("Hàng dự bị đã đầy.");
        return;
      }
      this.player.board[row][col] = null;
      this.player.bench.push(occupant);
      this.refreshPlanningUi();
      this.persistProgress();
    }
  }

  checkDuplicateUnit(baseId, ignoreRow = -1, ignoreCol = -1) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < PLAYER_COLS; c++) {
        if (r === ignoreRow && c === ignoreCol) continue;
        const u = this.player.board[r][c];
        if (u && u.baseId === baseId) return true;
      }
    }
    return false;
  }

  onBenchClick(index) {
    if (this.settingsVisible) return;
    if (!this.canInteractFormation()) {
      if (this.phase === PHASE.AUGMENT) this.addLog("Hãy chọn pháp ấn trước khi chỉnh đội hình.");
      return;
    }
    if (this.overlaySprites.length) return;
    if (index >= this.getBenchCap()) return;
    const unit = this.player.bench[index];
    if (unit && this.selectedInventoryItemId) {
      this.tryEquipSelectedItem(unit);
      return;
    }
    if (index >= this.player.bench.length) {
      this.selectedBenchIndex = null;
      this.refreshBenchUi();
      return;
    }

    this.selectedBenchIndex = this.selectedBenchIndex === index ? null : index;
    this.refreshBenchUi();
  }

  getBenchCap() {
    return this.benchUpgradeLevel > 0 ? 14 : 8;
  }

  upgradeBench() {
    if (this.settingsVisible || this.phase !== PHASE.PLANNING) return;
    if (this.benchUpgradeLevel > 0) {
      this.addLog("Dự bị đã đạt cấp tối đa.");
      return;
    }
    const cost = 10;
    if (this.player.gold < cost) {
      this.addLog("Không đủ vàng để nâng cấp dự bị.");
      return;
    }
    this.player.gold -= cost;
    this.benchUpgradeLevel = 1;
    this.addLog("Đã nâng cấp dự bị lên 14 ô.");
    this.audioFx.play("buy");

    // Refresh layout and UI
    this.layout = this.computeLayout();
    this.createBenchSlots();
    this.refreshPlanningUi();
    this.persistProgress();
  }

  upgradeCraftTable() {
    if (this.settingsVisible || this.phase !== PHASE.PLANNING) return;
    if ((this.player?.craftTableLevel ?? 0) >= 1) {
      this.addLog("Bàn chế tạo đã đạt cấp tối đa (3x3).");
      return;
    }
    const cost = 15;
    if (this.player.gold < cost) {
      this.addLog("Không đủ vàng để nâng bàn chế tạo.");
      return;
    }
    this.player.gold -= cost;
    this.player.craftTableLevel = 1;
    this.addLog("Đã nâng bàn chế tạo lên 3x3.");
    this.audioFx.play("buy");
    this.refreshPlanningUi();
    this.persistProgress();
  }

  moveUnit(from, to, allowSwap = true) {
    if (!from || !to) return false;
    if (this.settingsVisible || !this.canInteractFormation() || this.overlaySprites.length) return false;
    if (!["BOARD", "BENCH"].includes(from.region) || !["BOARD", "BENCH"].includes(to.region)) return false;

    const board = this.player.board;
    const bench = this.player.bench;
    const validBoardCell = (row, col) =>
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      row < ROWS &&
      col >= 0 &&
      col < PLAYER_COLS;
    const validBenchIndex = (index) => Number.isInteger(index) && index >= 0 && index < this.getBenchCap();
    let moved = false;

    if (from.region === "BOARD" && to.region === "BOARD") {
      if (!validBoardCell(from.row, from.col) || !validBoardCell(to.row, to.col)) return false;
      if (from.row === to.row && from.col === to.col) return false;
      const moving = board[from.row][from.col];
      if (!moving) return false;
      const target = board[to.row][to.col];
      if (target && !allowSwap) return false;
      board[to.row][to.col] = moving;
      board[from.row][from.col] = target ?? null;
      moved = true;
    } else if (from.region === "BENCH" && to.region === "BOARD") {
      if (!validBenchIndex(from.index) || from.index >= bench.length) return false;
      if (!validBoardCell(to.row, to.col)) return false;
      const moving = bench[from.index];
      if (!moving) return false;
      if (this.checkDuplicateUnit(moving.baseId, to.row, to.col)) {
        this.addLog("Không thể triển khai 2 thú cùng loại trên sân.");
        return false;
      }
      const target = board[to.row][to.col];
      if (!target && this.getDeployCount() >= this.getDeployCap()) {
        this.addLog(
          `Đã đạt giới hạn triển khai (${this.getDeployCount()}/${this.getDeployCap()}). Hãy nâng cấp hoặc đổi chỗ với thú đang trên sân.`
        );
        return false;
      }
      if (target && !allowSwap) return false;
      board[to.row][to.col] = moving;
      if (target) {
        bench[from.index] = target;
      } else {
        bench.splice(from.index, 1);
      }
      moved = true;
    } else if (from.region === "BOARD" && to.region === "BENCH") {
      if (!validBoardCell(from.row, from.col) || !validBenchIndex(to.index)) return false;
      const moving = board[from.row][from.col];
      if (!moving) return false;
      const target = bench[to.index] ?? null;
      if (target && !allowSwap) return false;
      if (!target && bench.length >= this.getBenchCap()) {
        this.addLog("Hàng dự bị đã đầy.");
        return false;
      }
      if (target) {
        board[from.row][from.col] = target;
        bench[to.index] = moving;
      } else {
        board[from.row][from.col] = null;
        if (to.index >= bench.length) bench.push(moving);
        else if (bench[to.index] == null) bench[to.index] = moving;
        else bench.splice(to.index, 0, moving);
      }
      moved = true;
    } else if (from.region === "BENCH" && to.region === "BENCH") {
      if (!validBenchIndex(from.index) || from.index >= bench.length || !validBenchIndex(to.index)) return false;
      if (from.index === to.index) return false;
      const moving = bench[from.index];
      if (!moving) return false;
      const target = bench[to.index] ?? null;
      if (target) {
        if (!allowSwap) return false;
        bench[to.index] = moving;
        bench[from.index] = target;
      } else {
        bench.splice(from.index, 1);
        const insertIndex = Math.max(0, Math.min(to.index, bench.length));
        bench.splice(insertIndex, 0, moving);
      }
      moved = true;
    }

    if (!moved) return false;
    this.selectedBenchIndex = null;
    this.tryAutoMerge();
    this.refreshPlanningUi();
    this.persistProgress();
    return true;
  }

  getUnitSalePrice(unit) {
    if (!unit?.base) return 1;
    return Math.max(1, Math.floor(unit.base.tier * (unit.star === 3 ? 5 : unit.star === 2 ? 3 : 1)));
  }

  sellUnit(uid) {
    if (!uid) return false;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const unit = this.player?.board?.[row]?.[col];
        if (!unit || unit.uid !== uid) continue;
        const salePrice = this.getUnitSalePrice(unit);
        this.player.board[row][col] = null;
        this.player.gold += salePrice;
        this.selectedBenchIndex = null;
        this.addLog(`Bán ${unit.base.name} (${unit.star}★) +${salePrice} vàng.`);
        this.refreshPlanningUi();
        this.persistProgress();
        return true;
      }
    }
    const benchIndex = this.player?.bench?.findIndex((unit) => unit?.uid === uid) ?? -1;
    if (benchIndex >= 0) return this.sellBenchIndex(benchIndex);
    return false;
  }

  sellBenchIndex(index) {
    const unit = this.player?.bench?.[index];
    if (!unit) return false;
    const salePrice = this.getUnitSalePrice(unit);
    this.player.gold += salePrice;
    this.player.bench.splice(index, 1);
    if (this.selectedBenchIndex === index) this.selectedBenchIndex = null;
    if (this.selectedBenchIndex != null && this.selectedBenchIndex > index) this.selectedBenchIndex -= 1;
    this.addLog(`Bán ${unit.base.name} (${unit.star}★) +${salePrice} vàng.`);
    this.refreshPlanningUi();
    this.persistProgress();
    return true;
  }

  sellSelectedUnit() {
    if (this.selectedBenchIndex == null) {
      this.addLog("Hãy chọn một thú ở dự bị để bán.");
      return;
    }
    if (!this.sellBenchIndex(this.selectedBenchIndex)) {
      this.addLog("Không có thú hợp lệ để bán.");
    }
  }

  isEquipmentItem(itemId) {
    return ITEM_BY_ID[itemId]?.kind === "equipment";
  }

  getItemCount(itemId) {
    if (!itemId) return 0;
    return this.player.itemBag.reduce((sum, id) => sum + (id === itemId ? 1 : 0), 0);
  }

  consumeItem(itemId, amount = 1) {
    if (!itemId || amount <= 0) return false;
    let remain = amount;
    const next = [];
    for (let i = 0; i < this.player.itemBag.length; i += 1) {
      const id = this.player.itemBag[i];
      if (id === itemId && remain > 0) {
        remain -= 1;
        continue;
      }
      next.push(id);
    }
    if (remain > 0) return false;
    this.player.itemBag = next;
    return true;
  }

  getCraftGridSize() {
    return (this.player?.craftTableLevel ?? 0) >= 1 ? 3 : 2;
  }

  getCraftActiveIndices() {
    const size = this.getCraftGridSize();
    if (size >= 3) return [0, 1, 2, 3, 4, 5, 6, 7, 8];
    return [0, 1, 3, 4];
  }

  getRecipeGridSize(recipe) {
    const sizeRaw = Number.isFinite(recipe?.gridSize) ? Math.floor(recipe.gridSize) : null;
    if (sizeRaw === 3 || sizeRaw === 2) return sizeRaw;
    return Array.isArray(recipe?.pattern) && recipe.pattern.length >= 9 ? 3 : 2;
  }

  getRecipePattern(recipe) {
    const size = this.getRecipeGridSize(recipe);
    const out = Array.from({ length: size * size }, () => null);
    if (!recipe || typeof recipe !== "object") return out;
    if (Array.isArray(recipe.pattern) && recipe.pattern.length) {
      for (let i = 0; i < out.length; i += 1) out[i] = recipe.pattern[i] ?? null;
      return out;
    }
    const req = Array.isArray(recipe.requires) ? recipe.requires : [];
    for (let i = 0; i < Math.min(out.length, req.length); i += 1) out[i] = req[i] ?? null;
    return out;
  }

  getRecipeRequiredList(recipe) {
    return this.getRecipePattern(recipe).filter(Boolean);
  }

  getCraftGridState(tableSize = this.getCraftGridSize()) {
    const grid = Array.from({ length: tableSize * tableSize }, () => null);
    if (tableSize <= 2) {
      const src = [0, 1, 3, 4];
      src.forEach((sourceIdx, i) => {
        grid[i] = this.craftGridItems[sourceIdx] ?? null;
      });
      return grid;
    }
    for (let i = 0; i < 9; i += 1) grid[i] = this.craftGridItems[i] ?? null;
    return grid;
  }

  matchPatternInGrid(grid, gridSize, pattern, patternSize) {
    if (gridSize === patternSize) {
      for (let i = 0; i < grid.length; i += 1) {
        if ((grid[i] ?? null) !== (pattern[i] ?? null)) return false;
      }
      return true;
    }
    if (gridSize < patternSize) return false;
    const maxOff = gridSize - patternSize;
    for (let offRow = 0; offRow <= maxOff; offRow += 1) {
      for (let offCol = 0; offCol <= maxOff; offCol += 1) {
        let ok = true;
        for (let r = 0; r < gridSize && ok; r += 1) {
          for (let c = 0; c < gridSize; c += 1) {
            const gIdx = r * gridSize + c;
            const localR = r - offRow;
            const localC = c - offCol;
            const inPattern = localR >= 0 && localR < patternSize && localC >= 0 && localC < patternSize;
            const expected = inPattern ? pattern[localR * patternSize + localC] ?? null : null;
            if ((grid[gIdx] ?? null) !== expected) {
              ok = false;
              break;
            }
          }
        }
        if (ok) return true;
      }
    }
    return false;
  }

  getCraftReservedCounts() {
    const counts = {};
    this.getCraftActiveIndices().forEach((idx) => {
      const id = this.craftGridItems[idx];
      if (!id) return;
      counts[id] = (counts[id] ?? 0) + 1;
    });
    return counts;
  }

  getCraftResultRecipeId() {
    const tableSize = this.getCraftGridSize();
    const grid = this.getCraftGridState(tableSize);
    if (!grid.some(Boolean)) return null;
    for (let i = 0; i < CRAFT_RECIPES.length; i += 1) {
      const recipe = CRAFT_RECIPES[i];
      const recipeSize = this.getRecipeGridSize(recipe);
      if (recipeSize > tableSize) continue;
      const pattern = this.getRecipePattern(recipe);
      if (this.matchPatternInGrid(grid, tableSize, pattern, recipeSize)) return recipe.id;
    }
    return null;
  }

  clearCraftGridSlot(index) {
    if (!Number.isInteger(index) || index < 0 || index >= 9) return;
    const active = new Set(this.getCraftActiveIndices());
    if (!active.has(index)) return;
    if (!this.craftGridItems[index]) return;
    this.craftGridItems[index] = null;
    this.refreshStorageUi();
  }

  clearCraftGrid() {
    this.craftGridItems = Array.from({ length: 9 }, () => null);
    this.refreshStorageUi();
  }

  addBaseItemToCraftGrid(itemId) {
    if (!itemId) return false;
    const item = ITEM_BY_ID[itemId];
    if (!item || item.kind !== "base") return false;
    const active = this.getCraftActiveIndices();
    const slotIndex = active.find((idx) => !this.craftGridItems[idx]);
    if (slotIndex == null) {
      this.addLog(`Ô chế tạo ${this.getCraftGridSize()}x${this.getCraftGridSize()} đã đầy.`);
      return false;
    }
    const totalOwned = this.getItemCount(itemId);
    const reserved = this.getCraftReservedCounts()[itemId] ?? 0;
    if (reserved >= totalOwned) {
      this.addLog(`Không còn ${item.icon} ${item.name} trong kho để đưa vào ô chế tạo.`);
      return false;
    }
    this.craftGridItems[slotIndex] = itemId;
    this.refreshStorageUi();
    return true;
  }

  craftFromGrid() {
    if (this.settingsVisible || this.phase !== PHASE.PLANNING) return false;
    const recipeId = this.getCraftResultRecipeId();
    if (!recipeId) {
      this.addLog(`Chưa khớp công thức ${this.getCraftGridSize()}x${this.getCraftGridSize()}.`);
      return false;
    }
    const recipe = RECIPE_BY_ID[recipeId];
    if (!recipe) return false;
    const equipmentId = `eq_${recipe.id}`;
    const equipment = ITEM_BY_ID[equipmentId];
    if (!equipment) {
      this.addLog(`Không thể ghép ${recipe.name}: thiếu dữ liệu trang bị.`);
      return false;
    }

    const required = this.getRecipeRequiredList(recipe);
    const bagCopy = [...this.player.itemBag];
    for (let i = 0; i < required.length; i += 1) {
      const idx = bagCopy.indexOf(required[i]);
      if (idx < 0) {
        this.addLog(`Thiếu vật phẩm để ghép ${recipe.name}.`);
        return false;
      }
      bagCopy.splice(idx, 1);
    }

    bagCopy.push(equipmentId);
    this.player.itemBag = bagCopy;
    this.player.craftedItems.push(recipe.id);
    this.clearCraftGrid();
    this.audioFx.play("buy");
    this.addLog(`Đã ghép: ${recipe.icon} ${recipe.name}. Chọn ô vật phẩm rồi nhấn vào thú để trang bị.`);
    this.refreshStorageUi();
    this.persistProgress();
    return true;
  }

  onInventoryCellClick(cell) {
    if (!cell) return;
    if (!cell.itemId) {
      this.selectedInventoryItemId = null;
      this.refreshStorageUi();
      return;
    }
    const item = ITEM_BY_ID[cell.itemId];
    if (item?.kind === "base") {
      this.selectedInventoryItemId = null;
      this.addBaseItemToCraftGrid(cell.itemId);
      return;
    }
    if (!this.isEquipmentItem(cell.itemId)) return;
    this.selectedInventoryItemId = this.selectedInventoryItemId === cell.itemId ? null : cell.itemId;
    this.refreshStorageUi();
  }

  tryEquipSelectedItem(unit) {
    const itemId = this.selectedInventoryItemId;
    if (!itemId || !unit) return false;
    if (!this.isEquipmentItem(itemId)) {
      this.addLog("Vật phẩm này không thể trang bị.");
      this.selectedInventoryItemId = null;
      this.refreshStorageUi();
      return false;
    }
    const equips = Array.isArray(unit.equips) ? unit.equips : [];
    if (equips.length >= 3) {
      this.addLog(`${unit.base.name} đã đủ 3 trang bị.`);
      return false;
    }
    if (!this.consumeItem(itemId, 1)) {
      this.addLog("Không đủ vật phẩm để trang bị.");
      this.selectedInventoryItemId = null;
      this.refreshStorageUi();
      return false;
    }
    unit.equips = [...equips, itemId];
    const item = ITEM_BY_ID[itemId];
    this.audioFx.play("buy");
    this.addLog(`Trang bị ${item?.icon ?? "✨"} ${item?.name ?? itemId} cho ${unit.base.name}.`);
    if (this.getItemCount(itemId) <= 0) this.selectedInventoryItemId = null;
    this.refreshPlanningUi();
    this.persistProgress();
    return true;
  }

  getDeployCap() {
    const level = Number.isFinite(this.player?.level) ? Math.floor(this.player.level) : 1;
    const bonus = Number.isFinite(this.player?.deployCapBonus) ? Math.floor(this.player.deployCapBonus) : 0;
    return getDeployCapByLevel(level) + bonus;
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
    if (this.settingsVisible) return;
    if (this.phase !== PHASE.PLANNING) return;
    const cost = Math.max(1, 2 + this.player.rollCostDelta);
    if (this.player.gold < cost) {
      this.addLog("Không đủ vàng để đổi cửa hàng.");
      return;
    }
    this.player.gold -= cost;
    this.refreshShop(true);
    this.refreshPlanningUi();
    this.persistProgress();
  }

  buyXp() {
    if (this.settingsVisible) return;
    if (this.phase !== PHASE.PLANNING) return;
    const cost = 4;
    if (this.player.gold < cost) {
      this.addLog("Không đủ vàng để mua XP.");
      return;
    }
    this.player.gold -= cost;
    this.gainXp(4);
    this.refreshPlanningUi();
    this.persistProgress();
  }

  gainXp(value) {
    let amount = value;
    while (amount > 0 && this.player.level < 9) {
      const need = getXpToLevelUp(this.player.level) - this.player.xp;
      if (amount >= need) {
        amount -= need;
        this.player.level += 1;
        this.player.xp = 0;
        this.addLog(`Lên cấp ${this.player.level}.`);
      } else {
        this.player.xp += amount;
        amount = 0;
      }
    }
  }

  toggleLock() {
    if (this.settingsVisible) return;
    if (this.phase !== PHASE.PLANNING) return;
    this.player.shopLocked = !this.player.shopLocked;
    this.refreshPlanningUi();
    this.persistProgress();
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
    if (this.settingsVisible) return;
    if (this.phase !== PHASE.PLANNING) return;
    const offer = this.player.shop[index];
    if (!offer) return;
    const base = UNIT_BY_ID[offer.baseId];
    if (!base) {
      this.player.shop[index] = null;
      this.addLog("Dữ liệu thú trong shop không hợp lệ, đã bỏ qua.");
      this.refreshPlanningUi();
      this.persistProgress();
      return;
    }
    const cost = base.tier;
    if (this.player.gold < cost) {
      this.addLog("Không đủ vàng để mua linh thú.");
      return;
    }
    if (this.player.bench.length >= this.getBenchCap()) {
      this.addLog("Hàng dự bị đã đầy.");
      return;
    }
    this.player.gold -= cost;
    const owned = this.createOwnedUnit(base.id, 1);
    if (owned) this.player.bench.push(owned);
    this.player.shop[index] = null;
    this.tryAutoMerge();
    this.refreshPlanningUi();
    this.persistProgress();
  }

  getMergeSpeciesKey(unit) {
    const raw = unit?.base?.species ?? unit?.base?.name ?? unit?.baseId ?? "linh-thu";
    const normalized = String(raw)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || String(unit?.baseId ?? "linh-thu");
  }

  getMergeSpeciesLabel(unit) {
    const baseName = String(unit?.base?.name ?? unit?.baseId ?? "Linh thú").trim();
    return baseName.replace(/\s+\d+\s*$/u, "");
  }

  tryAutoMerge() {
    let merged = true;
    while (merged) {
      merged = false;
      const refs = this.collectOwnedUnitRefs();
      const groups = new Map();
      refs.forEach((ref) => {
        const key = `${this.getMergeSpeciesKey(ref.unit)}:${ref.unit.star}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(ref);
      });

      for (const [, group] of groups) {
        if (group.length < 3) continue;
        const picked = group.slice(0, 3);
        const star = picked[0].unit.star;
        const baseId = picked
          .map((ref) => ref.unit.baseId)
          .sort((a, b) => (UNIT_BY_ID[b]?.tier ?? 0) - (UNIT_BY_ID[a]?.tier ?? 0))[0];
        const mergedEquip = this.collectMergeEquips(picked);
        this.removeOwnedUnitRefs(picked);
        const upgraded = this.createOwnedUnit(baseId, Math.min(3, star + 1), mergedEquip.kept);
        if (!upgraded) continue;
        this.placeMergedUnit(upgraded, picked[0]);
        if (mergedEquip.overflow.length) {
          this.player.itemBag.push(...mergedEquip.overflow);
          this.addLog(`Nâng sao hoàn trả ${mergedEquip.overflow.length} trang bị dư vào túi đồ.`);
        }
        this.addLog(`Nâng sao: ${this.getMergeSpeciesLabel(picked[0].unit)} -> ${upgraded.star}★`);
        merged = true;
        break;
      }
    }
  }

  collectMergeEquips(refs) {
    const all = [];
    refs.forEach((ref) => {
      const equips = Array.isArray(ref?.unit?.equips) ? ref.unit.equips : [];
      equips.forEach((itemId) => {
        if (ITEM_BY_ID[itemId]?.kind === "equipment") all.push(itemId);
      });
    });
    return {
      kept: all.slice(0, 3),
      overflow: all.slice(3)
    };
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

  removeOwnedUnitRefs(refs) {
    if (!Array.isArray(refs) || !refs.length) return;

    const benchUidSet = new Set();
    const benchIndexFallback = [];

    refs.forEach((ref) => {
      if (!ref) return;
      if (ref.location === "BOARD") {
        this.player.board[ref.row][ref.col] = null;
        return;
      }
      const uid = ref.unit?.uid;
      if (uid) {
        benchUidSet.add(uid);
      } else if (Number.isInteger(ref.index)) {
        benchIndexFallback.push(ref.index);
      }
    });

    if (benchUidSet.size) {
      this.player.bench = this.player.bench.filter((unit) => !benchUidSet.has(unit?.uid));
    }

    // Fallback path for legacy units without uid.
    benchIndexFallback
      .sort((a, b) => b - a)
      .forEach((index) => {
        if (index >= 0 && index < this.player.bench.length) this.player.bench.splice(index, 1);
      });
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
    this.toggleSettingsOverlay(false);
    this.clearCombatSprites();
    this.turnQueue = [];
    this.turnIndex = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.selectedBenchIndex = null;
    this.highlightLayer.clear();

    if (grantIncome) this.grantRoundIncome();
    this.prepareEnemyPreview();
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
    this.addLog(`Vòng ${this.player.round}: +${gain} vàng (cơ bản ${base} + lãi ${interest} + chuỗi ${streak}).`);
    this.persistProgress();
  }

  prepareEnemyPreview(force = false) {
    if (!force && this.player.enemyPreviewRound === this.player.round && this.player.enemyPreview.length) return;
    const plan = this.generateEnemyPreviewPlan();
    this.player.enemyPreview = plan.units;
    this.player.enemyPreviewRound = this.player.round;
    this.player.enemyBudget = plan.budget;
    this.addLog(`Trinh sát địch: ${plan.units.length} linh thú, ngân sách ${plan.budget}.`);
    this.persistProgress();
  }

  generateEnemyPreviewPlan() {
    const sandbox = this.player.gameMode === "PVE_SANDBOX";
    const ai = AI_SETTINGS[this.aiMode] ?? AI_SETTINGS.MEDIUM;
    const modeFactor = ai.budgetMult ?? 1;
    const estLevel = clamp(1 + Math.floor(this.player.round / 2) + (ai.levelBonus ?? 0), 1, 9);
    const teamSize = this.computeEnemyTeamSize(ai, estLevel, sandbox);
    const budget = Math.round((8 + this.player.round * (sandbox ? 2.1 : 2.6)) * modeFactor);
    const maxTier = clamp(1 + Math.floor(this.player.round / 3) + (ai.maxTierBonus ?? 0), 1, 5);
    const pool = UNIT_CATALOG.filter((u) => u.tier <= maxTier);

    const picks = [];
    let coins = budget;
    let frontCount = 0;
    const roleCounts = {
      TANKER: 0,
      FIGHTER: 0,
      ASSASSIN: 0,
      ARCHER: 0,
      MAGE: 0,
      SUPPORT: 0
    };
    const roleProfile = this.getAiRoleProfile(this.aiMode);
    let guard = 0;
    while (picks.length < teamSize && guard < 260) {
      guard += 1;
      let candidates = pool.filter((u) => u.tier <= Math.max(1, coins));
      if (!candidates.length) candidates = pool.filter((u) => u.tier === 1);
      if (!candidates.length) break;

      let pick = null;
      const targetClass = this.pickClassByWeights(roleProfile.weights);
      const byClass = candidates.filter((u) => u.classType === targetClass);
      if (byClass.length) {
        const minRoleCount = Math.min(...Object.values(roleCounts));
        const diversityPool = byClass.filter((u) => roleCounts[u.classType] <= minRoleCount + 1);
        pick = randomItem(diversityPool.length ? diversityPool : byClass);
      }
      if (!pick && frontCount < Math.ceil(teamSize * roleProfile.minFrontRatio)) {
        const frontPool = candidates.filter((u) => u.classType === "TANKER" || u.classType === "FIGHTER");
        if (frontPool.length) pick = randomItem(frontPool);
      }
      if (!pick && Math.random() < roleProfile.nonFrontBias) {
        const nonFrontPool = candidates.filter((u) => u.classType !== "TANKER" && u.classType !== "FIGHTER");
        if (nonFrontPool.length) pick = randomItem(nonFrontPool);
      }
      if (!pick) pick = randomItem(candidates);

      let star = 1;
      const starRoll = Math.random();
      const twoStarChance = clamp((this.player.round - 6) * 0.045 + (ai.star2Bonus ?? 0), 0, 0.38);
      const threeStarChance = clamp((this.player.round - 11) * 0.018 + (ai.star3Bonus ?? 0), 0, 0.08);
      if (starRoll < threeStarChance) star = 3;
      else if (starRoll < threeStarChance + twoStarChance) star = 2;

      picks.push({ baseId: pick.id, classType: pick.classType, tier: pick.tier, star });
      if (pick.classType === "TANKER" || pick.classType === "FIGHTER") frontCount += 1;
      roleCounts[pick.classType] = (roleCounts[pick.classType] ?? 0) + 1;
      coins -= Math.max(1, pick.tier - (star - 1));
      if (coins <= 0 && picks.length >= Math.ceil(teamSize * 0.7)) break;
    }

    if (!picks.length) {
      const fallback = randomItem(UNIT_CATALOG.filter((u) => u.tier === 1));
      picks.push({ baseId: fallback.id, classType: fallback.classType, tier: fallback.tier, star: 1 });
    }

    const frontSlots = [
      { row: 2, col: 5 }, { row: 1, col: 5 }, { row: 3, col: 5 }, { row: 2, col: 6 }, { row: 0, col: 5 }, { row: 4, col: 5 },
      { row: 1, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 7 }, { row: 0, col: 6 }, { row: 4, col: 6 }, { row: 1, col: 7 }
    ];
    const backSlots = [
      { row: 2, col: 9 }, { row: 1, col: 9 }, { row: 3, col: 9 }, { row: 2, col: 8 }, { row: 0, col: 9 }, { row: 4, col: 9 },
      { row: 1, col: 8 }, { row: 3, col: 8 }, { row: 0, col: 8 }, { row: 4, col: 8 }, { row: 2, col: 7 }, { row: 1, col: 7 }
    ];
    const assassinSlots = [
      { row: 0, col: 9 }, { row: 4, col: 9 }, { row: 1, col: 9 }, { row: 3, col: 9 }, { row: 0, col: 8 }, { row: 4, col: 8 }
    ];
    const used = new Set();
    const takeSlot = (list) => {
      for (let i = 0; i < list.length; i += 1) {
        const key = `${list[i].row}:${list[i].col}`;
        if (used.has(key)) continue;
        used.add(key);
        return list[i];
      }
      return null;
    };

    const units = [];
    const ordered = [
      ...picks.filter((p) => p.classType === "TANKER" || p.classType === "FIGHTER"),
      ...picks.filter((p) => p.classType === "SUPPORT" || p.classType === "MAGE" || p.classType === "ARCHER"),
      ...picks.filter((p) => p.classType === "ASSASSIN")
    ];
    ordered.forEach((pick) => {
      let slot = null;
      if (pick.classType === "TANKER" || pick.classType === "FIGHTER") {
        slot = takeSlot(frontSlots) ?? takeSlot(backSlots);
      } else if (pick.classType === "ASSASSIN") {
        slot = takeSlot(assassinSlots) ?? takeSlot(backSlots) ?? takeSlot(frontSlots);
      } else {
        slot = takeSlot(backSlots) ?? takeSlot(frontSlots);
      }
      if (!slot) return;
      units.push({ baseId: pick.baseId, star: pick.star, row: slot.row, col: slot.col });
    });

    return { budget, units };
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

    const title = this.add.text(this.scale.width / 2 - 180, 180, "Chọn 1 Pháp Ấn Rừng", {
      fontFamily: UI_FONT,
      fontSize: "30px",
      color: "#fff0ad",
      fontStyle: "bold"
    });
    title.setDepth(3001);
    this.overlaySprites.push(title);

    choices.forEach((choice, idx) => {
      const icon = this.getAugmentIcon(choice);
      const x = 220 + idx * 360;
      const y = 250;
      const card = this.add.rectangle(x, y, 320, 260, 0x1a2a3e, 0.98);
      card.setStrokeStyle(1, UI_COLORS.panelEdge, 0.9);
      card.setDepth(3001);
      card.setInteractive({ useHandCursor: true });
      this.tooltip.attach(card, () => this.getAugmentTooltip(choice));
      card.on("pointerdown", () => this.chooseAugment(choice));
      card.on("pointerover", () => card.setFillStyle(0x2b3d57, 0.98));
      card.on("pointerout", () => card.setFillStyle(0x1f2b3d, 0.98));

      const text = this.add.text(x - 146, y - 106, `${icon} ${choice.name}\n\n[${this.translateAugmentGroup(choice.group)}]\n${choice.description}`, {
        fontFamily: UI_FONT,
        fontSize: "18px",
        color: UI_COLORS.textPrimary,
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
    this.addLog(`Đã chọn pháp ấn: ${augment.name}`);
    this.clearOverlay();
    this.phase = PHASE.PLANNING;
    this.refreshPlanningUi();
    this.persistProgress();
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
    if (this.settingsVisible) return;
    if (this.phase !== PHASE.PLANNING) return;
    if (this.getDeployCount() <= 0) {
      this.addLog("Cần triển khai ít nhất 1 linh thú.");
      return;
    }
    this.prepareEnemyPreview();
    this.audioFx.play("skill");
    this.persistProgress();
    this.scene.start("CombatScene", {
      runState: this.exportRunState()
    });
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
    const ai = this.getAI();
    const estimateLevel = clamp(1 + Math.floor(this.player.round / 2) + (ai.levelBonus ?? 0), 1, 9);
    const count = this.computeEnemyTeamSize(ai, estimateLevel, this.player?.gameMode === "PVE_SANDBOX");
    const maxTier = clamp(1 + Math.floor(this.player.round / 2) + (ai.maxTierBonus ?? 0), 1, 4);
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
      const twoStarChance = clamp((this.player.round - 6) * 0.05 + (ai.star2Bonus ?? 0), 0, 0.42);
      const threeStarChance = clamp((this.player.round - 11) * 0.02 + (ai.star3Bonus ?? 0), 0, 0.1);
      const roll = Math.random();
      if (roll < threeStarChance) star = 3;
      else if (roll < threeStarChance + twoStarChance) star = 2;

      const owned = this.createOwnedUnit(base.id, star);
      if (!owned) return;
      const unit = this.createCombatUnit(owned, "RIGHT", pos.row, pos.col);
      if (unit) this.combatUnits.push(unit);
    });
  }

  createCombatUnit(owned, side, row, col) {
    if (!owned?.base?.stats) return null;
    const baseStats = scaledBaseStats(owned.base.stats, owned.star);
    const ai = this.getAI();
    const hpBase = side === "RIGHT" ? Math.round(baseStats.hp * ai.hpMult) : baseStats.hp;
    const atkBase = side === "RIGHT" ? Math.round(baseStats.atk * ai.atkMult) : baseStats.atk;
    const matkBase = side === "RIGHT" ? Math.round(baseStats.matk * ai.matkMult) : baseStats.matk;

    const hpWithAug = side === "LEFT" ? Math.round(hpBase * (1 + this.player.teamHpPct)) : hpBase;
    const atkWithAug = side === "LEFT" ? Math.round(atkBase * (1 + this.player.teamAtkPct)) : atkBase;
    const matkWithAug = side === "LEFT" ? Math.round(matkBase * (1 + this.player.teamMatkPct)) : matkBase;

    const point = this.gridToScreen(col, row);
    const roleTheme = this.getRoleTheme(owned.base.classType);
    const sprite = this.add.circle(point.x, point.y - 10, 24, roleTheme.fill, 0.98);
    sprite.setStrokeStyle(3, roleTheme.stroke, 1);
    sprite.setDepth(point.y + 10);
    sprite.setInteractive({ useHandCursor: true });

    const tag = this.add.text(point.x - 46, point.y - 58, `${owned.base.name}\n${owned.star}*`, {
      fontFamily: "Consolas",
      fontSize: "10px",
      color: "#ffffff",
      lineSpacing: 2
    });
    tag.setDepth(point.y + 11);

    const hpLabel = this.add.text(point.x - 46, point.y - 18, "", {
      fontFamily: "Consolas",
      fontSize: "10px",
      color: "#d3ffd6"
    });
    hpLabel.setDepth(point.y + 11);

    const rageLabel = this.add.text(point.x - 46, point.y + 20, "", {
      fontFamily: "Consolas",
      fontSize: "10px",
      color: "#dde8ff"
    });
    rageLabel.setDepth(point.y + 11);

    const statusLabel = this.add.text(point.x - 46, point.y + 34, "", {
      fontFamily: "Consolas",
      fontSize: "9px",
      color: "#ffe9aa"
    });
    statusLabel.setDepth(point.y + 11);

    this.combatSprites.push(sprite, tag, hpLabel, rageLabel, statusLabel);

    const unit = {
      uid: owned.uid,
      baseId: owned.baseId,
      name: owned.base.name,
      star: owned.star,
      equips: Array.isArray(owned.equips) ? [...owned.equips] : [],
      side,
      row,
      col,
      homeRow: row,
      homeCol: col,
      classType: owned.base.classType,
      tribe: owned.base.tribe,
      skillId: owned.base.skillId,
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
      tag,
      hpLabel,
      rageLabel,
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
    this.applyOwnedEquipmentBonuses(unit, owned);
    const styleVariant = this.getUnitSkillVariant(owned);
    if (styleVariant?.bonus) {
      unit.skillVariant = styleVariant.name;
      this.applyBonusToUnit(unit, styleVariant.bonus);
    }

    this.tooltip.attach(sprite, () => this.getUnitTooltip(unit.baseId, unit.star, owned));
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
      (this.phase === PHASE.COMBAT || this.phase === PHASE.PLANNING) &&
      !this.settingsVisible &&
      !this.isActing &&
      (this.phase !== PHASE.COMBAT ||
        (unit.statuses?.freeze <= 0 && unit.statuses?.stun <= 0 && unit.statuses?.sleep <= 0))
    );
  }

  showAttackPreviewForUnit(unit) {
    if (!this.canPreviewAttack(unit)) {
      this.clearAttackPreview();
      return;
    }
    const target =
      this.phase === PHASE.COMBAT
        ? this.selectTarget(unit, { deterministic: true })
        : this.selectPlanningTarget(unit);
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
    const skill = SKILL_LIBRARY[unit.skillId];
    this.attackPreviewLayer?.clear();
    this.clearAttackPreviewIcons();
    impact.cells.forEach((cell) => {
      const tile = this.tileLookup.get(gridKey(cell.row, cell.col));
      if (!tile) return;
      const isPrimary = cell.row === impact.primary.row && cell.col === impact.primary.col;
      this.attackPreviewLayer?.fillStyle(isPrimary ? 0xffcc6a : 0x6fd6ff, isPrimary ? 0.28 : 0.18);
      this.attackPreviewLayer?.lineStyle(isPrimary ? 3 : 2, isPrimary ? 0xffefb5 : 0xb8ebff, 0.95);
      this.drawDiamond(this.attackPreviewLayer, tile.center.x, tile.center.y);
    });
    this.drawAttackPreviewSword(impact.primary.row, impact.primary.col, unit);
    if (impact.skillPrimary) {
      const primaryIcon = this.getPreviewPrimaryIcon(unit, skill);
      this.drawAttackPreviewPrimaryIcon(impact.skillPrimary.row, impact.skillPrimary.col, primaryIcon);
    }
  }

  clearAttackPreview(unit = null) {
    if (unit && this.previewHoverUnit && this.previewHoverUnit.uid !== unit.uid) return;
    this.previewHoverUnit = null;
    this.attackPreviewLayer?.clear();
    this.clearAttackPreviewIcons();
    if (this.attackPreviewSword) {
      this.attackPreviewSword.clear();
      this.attackPreviewSword.setVisible(false);
    }
  }

  clearAttackPreviewIcons() {
    if (!Array.isArray(this.attackPreviewIcons)) this.attackPreviewIcons = [];
    this.attackPreviewIcons.forEach((obj) => obj?.destroy?.());
    this.attackPreviewIcons = [];
  }

  getPreviewPrimaryIcon(attacker, skill) {
    const effect = skill?.effect ?? null;
    const shieldEffects = new Set(["shield_immune", "team_buff_def", "ally_row_def_buff", "shield_cleanse", "column_bless"]);
    const healBuffEffects = new Set(["revive_or_heal", "dual_heal", "team_rage"]);

    if (effect === "damage_shield_taunt") return "🎯";
    if (shieldEffects.has(effect)) return "🛡️";
    if (healBuffEffects.has(effect)) return "💚";
    if (attacker?.classType === "ARCHER") return "🏹";
    if (attacker?.classType === "ASSASSIN") return "🗡️";
    return "👊";
  }

  drawAttackPreviewPrimaryIcon(row, col, iconText = "👊") {
    const tile = this.tileLookup.get(gridKey(row, col));
    if (!tile) return;
    const topDepth = 3300;
    const badgeBg = this.add.circle(tile.center.x, tile.center.y - 11, 12, 0x0b1724, 0.9);
    badgeBg.setStrokeStyle(1.4, 0xe6f5ff, 0.95);
    badgeBg.setDepth(topDepth);
    const badgeIcon = this.add.text(tile.center.x, tile.center.y - 11, iconText, {
      fontFamily: "Segoe UI Emoji",
      fontSize: "13px",
      color: "#ffffff"
    }).setOrigin(0.5);
    badgeIcon.setDepth(topDepth + 1);
    this.attackPreviewIcons.push(badgeBg, badgeIcon);
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
    const allies = this.phase === PHASE.COMBAT ? this.getCombatUnits(attacker.side) : this.collectPlanningPreviewUnits(attacker.side);
    const enemies = this.phase === PHASE.COMBAT ? this.getCombatUnits(enemySide) : this.collectPlanningPreviewUnits(enemySide);
    const skill = SKILL_LIBRARY[attacker.skillId];
    const attackCell = { row: target.row, col: target.col };
    const skillCells = this.collectSkillPreviewCells(attacker, target, skill, allies, enemies);
    const impactCells = this.dedupePreviewCells([attackCell, ...skillCells]);
    let skillPrimary = null;
    if (skillCells.length) {
      const skillHasTarget = skillCells.some((cell) => cell.row === target.row && cell.col === target.col);
      skillPrimary = skillHasTarget
        ? attackCell
        : [...skillCells].sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))[0] ?? null;
    }
    return { primary: attackCell, skillPrimary, cells: impactCells };
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

      case "global_stun":
      case "global_debuff_atk":
      case "global_fire":
      case "global_slow":
      case "global_poison_team":
        pushUnits(enemies);
        break;
      case "single_burst_armor_pen":
      case "single_poison_slow":
      case "single_bleed":
      case "knockback_charge":
      case "single_strong_poison":
      case "execute_heal":
      case "true_execute":
        pushCell(target.row, target.col);
        break;
      case "aoe_circle_stun":
      case "cleave_armor_break":
        enemies.filter(e => Math.abs(e.row - target.row) <= 1 && Math.abs(e.col - target.col) <= 1)
          .forEach(e => pushCell(e.row, e.col));
        break;
      case "cone_shot":
        enemies.filter(e => Math.abs(e.row - target.row) <= 1 && e.col >= target.col)
          .forEach(e => pushCell(e.row, e.col));
        break;
      case "shield_immune":
      case "revive_or_heal":
      case "team_buff_def":
        pushUnits(allies);
        break;
      case "damage_shield_taunt":
        pushCell(target.row, target.col);
        pushUnits(enemies);
        break;
      case "damage_shield_reflect":
        pushCell(target.row, target.col);
        pushCell(attacker.row, attacker.col);
        break;
      case "self_bersek":
      case "metamorphosis":
      case "turtle_protection":
      case "rhino_counter":
      case "pangolin_reflect":
        pushCell(attacker.row, attacker.col);
        break;
      case "lifesteal_disease":
      case "self_atk_and_assist":
        pushCell(target.row, target.col);
        pushUnits(allies.filter((ally) => ally.uid !== attacker.uid && ally.row === attacker.row));
        break;
      case "multi_disarm":
        enemies.sort((a, b) => b.atk - a.atk).slice(0, 3).forEach(e => pushCell(e.row, e.col));
        break;
      case "random_lightning":
        pushCell(target.row, target.col);
        break;


      case "cross_5":
        {
          const targetOnRight = target.col >= RIGHT_COL_START;
          const minCol = targetOnRight ? RIGHT_COL_START : 0;
          const maxCol = targetOnRight ? RIGHT_COL_END : PLAYER_COLS - 1;
          const pushCross = (row, col) => {
            if (col < minCol || col > maxCol) return;
            pushCell(row, col);
          };
          pushCross(target.row, target.col);
          pushCross(target.row - 1, target.col);
          pushCross(target.row + 1, target.col);
          pushCross(target.row, target.col - 1);
          pushCross(target.row, target.col + 1);
        }
        break;
      case "row_multi":
        pushUnits(
          enemies
            .filter((enemy) => enemy.row === target.row)
            .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
            .slice(0, skill.maxHits ?? 3)
        );
        break;
      case "random_multi": {
        const pool = enemies.filter((enemy) => enemy.alive);
        const count = Math.min(skill.maxHits ?? 3, pool.length);
        pushUnits(sampleWithoutReplacement(pool, count));
        break;
      }
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

  countUnitCopies(baseId) {
    let count = 0;
    // Check board (player side only)
    if (this.player.board) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < PLAYER_COLS; c++) {
          const u = this.player.board[r][c];
          if (u && u.baseId === baseId) count++;
        }
      }
    }
    // Check bench
    if (this.player.bench) {
      this.player.bench.forEach((u) => {
        if (u && u.baseId === baseId) count++;
      });
    }
    return count;
  }

  handleRightClick(pointer) {
    if (this.phase !== PHASE.PLANNING) return;
    if (this.settingsVisible || this.wikiVisible || this.historyModalVisible) return;
    if (this.isBoardDragging) {
      this.isBoardDragging = false;
      this.lastDragPoint = null;
      this.boardPointerDown = null;
      this.boardDragConsumed = false;
    }

    // Check Bench
    for (let i = 0; i < this.benchSlots.length; i++) {
      const slot = this.benchSlots[i];
      if (slot.bg.visible && slot.bg.getBounds().contains(pointer.x, pointer.y)) {
        const unit = this.player.bench[i];
        if (unit) {
          // Show Menu instead of direct sell
          this.showContextMenu(unit, "BENCH", i, null, pointer.x, pointer.y);
          return;
        }
      }
    }

    // Check Board
    const hit = this.findPlayerBoardCellFromPoint(pointer.x, pointer.y, true);
    if (hit) {
      const r = hit.row;
      const c = hit.col;
      const unit = this.player.board[r][c];
      if (unit) {
        this.showContextMenu(unit, "BOARD", r, c, pointer.x, pointer.y);
        return;
      }
    }
  }

  showContextMenu(unit, region, r_or_idx, c, x, y) {
    if (this.contextMenu) {
      this.contextMenu.destroy();
      this.contextMenu = null;
    }

    const container = this.add.container(x, y);
    container.setDepth(5000);

    const options = [];
    // Detail
    options.push({
      label: "Chi tiết", action: () => {
        this._wikiDetailUnit = unit.baseId;
        this.toggleWikiModal(true);
      }
    });

    if (region === "BENCH") {
      // Deploy (find free slot on board?) - Logic complex, maybe just Swap mode?
      // For now: "Bán"
      options.push({ label: "Bán", action: () => this.sellBenchIndex(r_or_idx) });
    } else if (region === "BOARD") {
      // Recall
      options.push({
        label: "Thu hồi", action: () => {
          let freeSlot = this.player.bench.findIndex((u) => u == null);
          if (freeSlot === -1 && this.player.bench.length < this.getBenchCap()) {
            freeSlot = this.player.bench.length;
          }
          if (freeSlot !== -1) {
            this.moveUnit({ region: "BOARD", row: r_or_idx, col: c }, { region: "BENCH", index: freeSlot });
            this.audioFx.play("click");
          } else {
            this.addLog("Hàng chờ đầy!");
          }
        }
      });
      options.push({ label: "Bán", action: () => this.sellUnit(unit.uid) });
    }

    // Background
    const w = 120;
    const h = options.length * 35 + 10;
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x111826, 0.95);
    bg.setStrokeStyle(1, 0x4a6fa5);
    container.add(bg);

    options.forEach((opt, idx) => {
      const btnY = 25 + idx * 35;
      const btn = this.add.text(w / 2, btnY, opt.label, {
        fontFamily: UI_FONT, fontSize: "14px", color: "#e0e0e0"
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on("pointerover", () => btn.setColor("#ffffff"));
      btn.on("pointerout", () => btn.setColor("#e0e0e0"));
      btn.on("pointerdown", (pointer, localX, localY, event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        opt.action();
        container.destroy();
        this.contextMenu = null;
      });
      container.add(btn);
    });

    this.contextMenu = container;

    // Close when clicking outside
    this.time.delayedCall(10, () => {
      const closeHandler = () => {
        if (this.contextMenu) {
          this.contextMenu.destroy();
          this.contextMenu = null;
        }
        this.input.off("pointerdown", closeHandler);
      };
      this.input.on("pointerdown", closeHandler);
    });
  }

  dedupePreviewCells(cells) {
    const map = new Map();
    cells.forEach((cell) => {
      const key = gridKey(cell.row, cell.col);
      if (!map.has(key)) map.set(key, cell);
    });
    return [...map.values()];
  }

  buildPlanningPreviewActor(side, row, col, classType, star = 1, skillId = null, range = 1) {
    const hpBase = star >= 3 ? 460 : star === 2 ? 360 : 280;
    return {
      uid: `plan_${side}_${row}_${col}_${classType}_${star}`,
      side,
      row,
      col,
      classType,
      skillId,
      range,
      hp: hpBase,
      maxHp: hpBase,
      alive: true,
      statuses: { tauntTargetId: null }
    };
  }

  collectPlanningPreviewUnits(side) {
    const out = [];
    if (side === "LEFT") {
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < PLAYER_COLS; col += 1) {
          const u = this.player?.board?.[row]?.[col];
          if (!u) continue;
          out.push(this.buildPlanningPreviewActor("LEFT", row, col, u.base.classType, u.star, u.base.skillId, u.base.stats.range));
        }
      }
      return out;
    }
    const enemyPreview = Array.isArray(this.player?.enemyPreview) ? this.player.enemyPreview : [];
    enemyPreview.forEach((p) => {
      const base = UNIT_BY_ID[p.baseId];
      if (!base) return;
      out.push(this.buildPlanningPreviewActor("RIGHT", p.row, p.col, base.classType, p.star ?? 1, base.skillId, base.stats.range));
    });
    return out;
  }

  selectPlanningTarget(attacker) {
    const enemySide = attacker.side === "LEFT" ? "RIGHT" : "LEFT";
    const enemies = this.collectPlanningPreviewUnits(enemySide);
    if (!enemies.length) return null;
    const sorted = [...enemies].sort((a, b) => this.compareTargets(attacker, a, b));
    return sorted[0] ?? null;
  }

  refreshPlanningUi() {
    this.refreshRoundBackground();
    this.refreshHeader();
    this.refreshButtons();
    this.refreshShopUi();
    this.refreshBenchUi();
    this.refreshBoardUi();
    this.refreshSynergyPreview();
    this.refreshStorageUi();
    this.refreshGamepadCursorVisual();
  }

  refreshHeader() {
    const xpNeed = getXpToLevelUp(this.player.level);
    const xpText = xpNeed === Number.POSITIVE_INFINITY ? "TỐI ĐA" : `${this.player.xp}/${xpNeed}`;
    const deployText = `${this.getDeployCount()}/${this.getDeployCap()}`;
    const modeLabel = this.player.gameMode === "PVE_SANDBOX" ? "Sandbox" : "Hành trình";
    const loseCondition = this.getLoseCondition();
    const loseLabel = loseCondition === "NO_HEARTS" ? `${getLoseConditionLabel(loseCondition)} (${this.player.hp} tim)` : getLoseConditionLabel(loseCondition);
    this.setHeaderStatValue("round", `${this.player.round}`);
    this.setHeaderStatValue("gold", this.player.gold, 50);
    this.setHeaderStatValue("level", `${this.player.level}`);
    this.setHeaderStatValue("xp", xpText, xpNeed === Number.POSITIVE_INFINITY ? null : xpNeed);
    this.setHeaderStatValue("deploy", deployText, this.getDeployCap());
    this.headerMetaText?.setText(`Pha ${this.getPhaseLabel(this.phase)} • AI ${AI_SETTINGS[this.aiMode].label} • ${modeLabel} • ${loseLabel}`);
    this.updateLogText();
  }

  setHeaderStatValue(key, value, max = null) {
    const chip = this.headerStatChips?.[key];
    if (!chip?.value) return;
    chip.value.setText(String(value ?? "-"));
    if (chip.bar && max != null && max > 0) {
      const pct = Math.min(1, Math.max(0, (value ?? 0) / max));
      const barMaxW = chip.chipW - 4;
      const barW = Math.max(2, Math.floor(barMaxW * pct));
      chip.bar.clear();
      chip.bar.fillStyle(chip.bar._barColor ?? 0x3a8fd4, 0.85);
      chip.bar.fillRoundedRect(chip.bar._chipX + 2, chip.bar._chipY + 36, barW, 3, 1);
    } else if (chip.bar) {
      chip.bar.clear();
    }
  }

  getPhaseLabel(phase) {
    if (phase === PHASE.PLANNING) return "Chuẩn bị";
    if (phase === PHASE.AUGMENT) return "Chọn pháp ấn";
    if (phase === PHASE.COMBAT) return "Giao tranh";
    if (phase === PHASE.GAME_OVER) return "Kết thúc";
    return phase;
  }

  refreshButtons() {
    const planning = this.phase === PHASE.PLANNING;
    const lock = this.player.shopLocked ? "Bật" : "Tắt";
    const rollCost = Math.max(1, 2 + this.player.rollCostDelta);

    this.buttons.roll.setLabel(`Đổi tướng (${rollCost} vàng)`);
    this.buttons.xp.setLabel("Mua XP (4 vàng)");
    this.buttons.lock.setLabel(`Khóa: ${lock}`);
    const craftLevel = this.player?.craftTableLevel ?? 0;
    this.buttons.upgradeBench?.setLabel(`Nâng dự bị (10 vàng)`);
    this.buttons.upgradeCraft?.setLabel(craftLevel >= 1 ? "Bàn chế: 3x3" : "Nâng bàn chế (15 vàng)");
    this.buttons.sell.setLabel(this.selectedBenchIndex != null ? "Bán đã chọn" : "Bán (S)");
    this.buttons.start.setLabel("BẮT ĐẦU GIAO TRANH");
    this.buttons.settings.setLabel("Cài đặt");
    this.buttons.history?.setLabel(`Xem lịch sử (${this.logHistory.length})`);

    this.buttons.roll.setEnabled(planning);
    this.buttons.xp.setEnabled(planning);
    this.buttons.lock.setEnabled(planning);
    this.buttons.upgradeCraft?.setEnabled(planning && craftLevel < 1);
    this.buttons.sell.setEnabled(planning && this.selectedBenchIndex != null && !!this.player?.bench?.[this.selectedBenchIndex]);
    this.buttons.start.setEnabled(planning && this.getDeployCount() > 0);
    this.buttons.reset.setEnabled(true);
    this.buttons.settings.setEnabled(true);
    this.buttons.history?.setEnabled(true);
    // Craft buttons removed to fix undefined error
  }

  refreshShopUi() {
    this.shopCards.forEach((card) => {
      if (card.shadow) card.shadow.destroy();
      card.bg?.destroy();
      if (card.status) card.status.destroy();
      if (card.badges) card.badges.forEach((b) => b?.destroy());
      if (Array.isArray(card.text)) card.text.forEach((t) => t?.destroy());
      else card.text?.destroy();
      if (Array.isArray(card.icon)) card.icon.forEach((i) => i?.destroy());
      else card.icon?.destroy();
    });
    this.shopCards = [];

    const l = this.layout;
    const y = l.shopY;
    const cardW = l.shopCardW;
    const cardH = l.shopCardH;
    const totalShopW = cardW * 5 + l.shopGap * 4;
    const startX = l.shopRegionX + Math.max(0, l.shopRegionW - totalShopW);
    for (let i = 0; i < 5; i += 1) {
      const x = startX + i * (cardW + l.shopGap);
      const offer = this.player.shop[i];
      const base = offer ? UNIT_BY_ID[offer.baseId] : null;
      const visual = base ? getUnitVisual(offer.baseId, base.classType) : null;
      const sold = !offer;
      const roleTheme = base ? this.getRoleTheme(base.classType) : null;
      const cardFill = sold ? 0x111826 : roleTheme?.card ?? 0x16283c;
      const cardStroke = sold ? UI_COLORS.panelEdgeSoft : roleTheme?.stroke ?? UI_COLORS.panelEdge;
      const cardHover = roleTheme?.cardHover ?? 0x213c58;
      const innerW = Math.max(20, cardW - 20);
      const shadow = this.add.rectangle(x + cardW / 2, y + cardH / 2 + 2, cardW, cardH, 0x000000, 0.2);
      shadow.setDepth(1498);

      const bg = this.add.rectangle(x + cardW / 2, y + cardH / 2, cardW, cardH, cardFill, 0.92);
      bg.setStrokeStyle(1.5, cardStroke, 0.9);
      bg.setDepth(1499);

      // Rainbow border for owned units
      if (offer && !sold) {
        const ownedCount = this.countUnitCopies(offer.baseId);
        if (ownedCount > 0) {
          this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 2500,
            loop: -1,
            onUpdate: (tween) => {
              const val = tween.getValue();
              const color = Phaser.Display.Color.HSVToRGB(val / 100, 1, 1).color;
              if (bg.active) bg.setStrokeStyle(2.5, color, 1);
            }
          });
        }
      }

      let txt = "Ô này đã được mua ở lượt này.";
      let iconText = "❔";
      if (base) {
        iconText = visual.icon;
        txt = `${visual.nameVi}\n${getTribeLabelVi(base.tribe)} • ${getClassLabelVi(base.classType)}\nNộ ${base.stats.rageMax} • Tầm ${base.stats.range}`;
      }

      const status = this.add.text(x + 10, y + 8, sold ? "ĐÃ MUA" : "SẴN SÀNG", {
        fontFamily: UI_FONT,
        fontSize: "11px",
        color: sold ? UI_COLORS.textMuted : "#9fe9ff",
        fontStyle: "bold"
      });
      status.setDepth(1502);

      const badges = [];
      const addBadge = (bx, by, bw, label, fill) => {
        const badgeBg = this.add.rectangle(bx + bw / 2, by + 8, bw, 16, fill, 0.95);
        badgeBg.setStrokeStyle(1, 0x8cb9d8, 0.3);
        badgeBg.setDepth(1501);
        const badgeText = this.add.text(bx + bw / 2, by + 8, label, {
          fontFamily: UI_FONT,
          fontSize: "10px",
          color: "#f0f9ff"
        }).setOrigin(0.5);
        badgeText.setDepth(1502);
        badges.push(badgeBg, badgeText);
      };

      if (base) {
        const badgeGap = 6;
        const tierW = Math.max(40, Math.floor((innerW - badgeGap) * 0.45));
        const costW = Math.max(40, innerW - tierW - badgeGap);
        addBadge(x + 10, y + 30, tierW, `Bậc ${base.tier}`, UI_COLORS.badgeTier);
        addBadge(x + 10 + tierW + badgeGap, y + 30, costW, `${base.tier} vàng`, UI_COLORS.badgeCost);
      } else {
        addBadge(x + 10, y + 30, innerW, "Trống", 0x303844);
      }

      const portraitBg = this.add.circle(
        x + cardW / 2,
        y + 72,
        23,
        sold ? 0x2d3a4b : roleTheme?.fill ?? 0x365675,
        sold ? 0.42 : 0.26
      );
      portraitBg.setStrokeStyle(1, sold ? 0x5f6772 : roleTheme?.stroke ?? UI_COLORS.panelEdge, 0.9);
      portraitBg.setDepth(1500);
      badges.push(portraitBg);

      const text = this.add.text(x + 10, y + 98, txt, {
        fontFamily: UI_FONT,
        fontSize: sold ? "11px" : "12px",
        color: UI_COLORS.textPrimary,
        wordWrap: { width: innerW },
        lineSpacing: 3
      });
      text.setDepth(1501);
      const icon = this.add.text(x + cardW / 2, y + 72, iconText, {
        fontFamily: "Segoe UI Emoji",
        fontSize: "30px",
        color: "#ffffff"
      }).setOrigin(0.5);
      icon.setDepth(1502);
      this.shopCards.push({ shadow, bg, status, badges, text, icon });

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.buyFromShop(i));
      this.tooltip.attach(bg, () => {
        if (!offer) return { title: "Đã mua", body: "Ô này đã được mua ở lượt hiện tại." };
        return this.getUnitTooltip(offer.baseId, 1);
      });
      bg.on("pointerover", () => {
        if (this.phase === PHASE.PLANNING && !sold) {
          bg.setFillStyle(cardHover, 0.95);
          status.setText("ĐANG CHỌN");
          status.setColor("#d7f9ff");
        }
      });
      bg.on("pointerout", () => {
        bg.setFillStyle(cardFill, 0.92);
        status.setText(sold ? "ĐÃ MUA" : "SẴN SÀNG");
        status.setColor(sold ? UI_COLORS.textMuted : "#9fe9ff");
      });
    }
  }

  refreshBenchUi() {
    const cap = this.getBenchCap();
    this.benchSlots.forEach((slot, index) => {
      this.ensureBenchSlotTextObjects(slot);
      if (index >= cap) {
        slot.bg.setVisible(false);
        slot.label.setVisible(false);
        slot.icon.setVisible(false);
        return;
      }
      slot.bg.setVisible(true);
      slot.label.setVisible(true);
      slot.icon.setVisible(true);
      const unit = this.player.bench[index];
      const selected = this.selectedBenchIndex === index;

      if (!unit) {
        slot.bg.setStrokeStyle(1, selected ? UI_COLORS.accent : UI_COLORS.panelEdgeSoft, 0.95);
        slot.bg.setFillStyle(selected ? 0x223951 : 0x141f2d, selected ? 0.94 : 0.9);
        this.safeUpdateBenchSlotText(slot, `[${index + 1}] Trống`, UI_COLORS.textMuted, "");
      } else {
        const roleTheme = this.getRoleTheme(unit.base.classType);
        slot.bg.setStrokeStyle(1, selected ? UI_COLORS.accent : roleTheme.stroke, 0.95);
        slot.bg.setFillStyle(selected ? roleTheme.cardHover : roleTheme.bench, selected ? 0.95 : 0.9);
        const visual = getUnitVisual(unit.baseId, unit.base.classType);
        const nameShort = visual.nameVi.length > 13 ? `${visual.nameVi.slice(0, 12)}…` : visual.nameVi;
        const equipCount = Array.isArray(unit.equips) ? unit.equips.length : 0;
        this.safeUpdateBenchSlotText(
          slot,
          `${nameShort}\n${unit.star}★ • ${getClassLabelVi(unit.base.classType)}\nTrang bị:${equipCount}/3`,
          UI_COLORS.textPrimary,
          visual.icon
        );
      }
    });
  }

  refreshBoardUi() {
    this.clearPlanningSprites();
    if (this.phase !== PHASE.PLANNING && this.phase !== PHASE.AUGMENT) return;
    if (!this.player?.board) return;

    const buildPlanningUnitBars = (point, stats, rageValue = 0, shieldValue = 0) => {
      const barW = 56;
      const hpBarBg = this.add.rectangle(point.x, point.y + 11, barW, 5, 0x0a1320, 0.92);
      hpBarBg.setStrokeStyle(1, 0x30475f, 0.86);
      hpBarBg.setDepth(2001 + point.y);
      const hpBarFill = this.add.rectangle(point.x - barW / 2 + 1, point.y + 11, barW - 2, 3, 0x79df7b, 0.98).setOrigin(0, 0.5);
      hpBarFill.setDepth(2002 + point.y);

      const hpInnerW = Math.max(1, barW - 2);
      const shieldRatio = clamp((stats?.hp ?? 0) > 0 ? shieldValue / stats.hp : 0, 0, 1);
      const shieldBar = this.add.rectangle(point.x - barW / 2 + 1, point.y + 11, hpInnerW * shieldRatio, 3, 0x9dffba, 0.94).setOrigin(0, 0.5);
      shieldBar.setDepth(2003 + point.y);

      const rageMax = Math.max(1, stats?.rageMax || 100);
      const rageRatio = clamp(rageValue / rageMax, 0, 1);
      const rageBarBg = this.add.rectangle(point.x, point.y + 18, barW, 5, 0x0b1b32, 0.94);
      rageBarBg.setStrokeStyle(2, 0x5fb8ff, 0.95);
      rageBarBg.setDepth(2001 + point.y);
      const rageBarFill = this.add.rectangle(point.x - barW / 2 + 1, point.y + 18, hpInnerW * rageRatio, 3, 0xf3d66b, 0.98).setOrigin(0, 0.5);
      rageBarFill.setDepth(2002 + point.y);

      const rageGrid = this.add.graphics();
      rageGrid.setDepth(2003 + point.y);
      if (rageMax > 1) {
        rageGrid.lineStyle(2, 0x7ec4ff, 0.95);
        const step = hpInnerW / rageMax;
        const startX = point.x - hpInnerW / 2;
        for (let i = 1; i < rageMax; i += 1) {
          const x = startX + step * i;
          rageGrid.beginPath();
          rageGrid.moveTo(x, point.y + 15.5);
          rageGrid.lineTo(x, point.y + 20.5);
          rageGrid.strokePath();
        }
      }

      return { barW, hpBarBg, hpBarFill, shieldBar, rageBarBg, rageBarFill, rageGrid };
    };

    const enemyPreview = Array.isArray(this.player.enemyPreview) ? this.player.enemyPreview : [];
    enemyPreview.forEach((preview) => {
      const base = UNIT_BY_ID[preview.baseId];
      if (!base) return;
      const star = Math.max(1, preview.star ?? 1);
      const point = this.gridToScreen(preview.col, preview.row);
      const visual = getUnitVisual(preview.baseId, base.classType);
      const roleTheme = this.getRoleTheme(base.classType);
      const actor = this.buildPlanningPreviewActor(
        "RIGHT",
        preview.row,
        preview.col,
        base.classType,
        star,
        base.skillId,
        base.stats.range
      );
      const glow = this.add.circle(point.x, point.y - 10, 30, roleTheme.glow, 0.2);
      glow.setDepth(point.y + 10);
      const sprite = this.add.circle(point.x, point.y - 10, 22, roleTheme.fill, 0.95);
      sprite.setStrokeStyle(2, roleTheme.stroke, 1);
      sprite.setDepth(2000 + point.y);
      sprite.setInteractive({ useHandCursor: true });
      this.tooltip.attach(sprite, () => this.getUnitTooltip(preview.baseId, star));
      sprite.on("pointerover", () => this.showAttackPreviewForUnit(actor));
      sprite.on("pointerout", () => this.clearAttackPreview(actor));
      const icon = this.add.text(point.x, point.y - 10, visual.icon, {
        fontFamily: "Segoe UI Emoji",
        fontSize: "32px",
        color: "#ffffff"
      }).setOrigin(0.5);
      icon.setDepth(2002 + point.y);
      const enemyName = visual.nameVi.length > 8 ? `${visual.nameVi.slice(0, 8)}…` : visual.nameVi;
      const enemyTagBg = this.add.rectangle(point.x, point.y - 47, 64, 13, 0x05070c, 0.72);
      enemyTagBg.setStrokeStyle(1, 0x2c3f54, 0.76);
      enemyTagBg.setDepth(2001 + point.y);
      const enemyTag = this.add.text(point.x, point.y - 47, enemyName, {
        fontFamily: UI_FONT,
        fontSize: "9px",
        color: "#e7f3ff",
        fontStyle: "bold"
      }).setOrigin(0.5);
      enemyTag.setDepth(2002 + point.y);
      const label = this.add.text(point.x + 20, point.y - 31, `${star}★`, {
        fontFamily: UI_FONT,
        fontSize: "9px",
        color: "#fff8d7",
        fontStyle: "bold"
      });
      label.setDepth(2003 + point.y);

      const baseStats = scaledBaseStats(base.stats, star, base.classType);
      const enemyBars = buildPlanningUnitBars(point, baseStats, 0, 0);
      this.planningSprites.push(
        glow,
        sprite,
        icon,
        enemyTagBg,
        enemyTag,
        label,
        enemyBars.hpBarBg,
        enemyBars.hpBarFill,
        enemyBars.shieldBar,
        enemyBars.rageBarBg,
        enemyBars.rageBarFill,
        enemyBars.rageGrid
      );
    });

    const startingRage = Number.isFinite(this.player?.startingRage) ? this.player.startingRage : 0;
    const startingShield = Number.isFinite(this.player?.startingShield) ? this.player.startingShield : 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const unit = this.player.board[row][col];
        if (!unit) continue;
        const point = this.gridToScreen(col, row);
        const roleTheme = this.getRoleTheme(unit.base.classType);
        const visual = getUnitVisual(unit.baseId, unit.base.classType);
        const actor = this.buildPlanningPreviewActor(
          "LEFT",
          row,
          col,
          unit.base.classType,
          unit.star,
          unit.base.skillId,
          unit.base.stats.range
        );
        const glow = this.add.circle(point.x, point.y - 10, 30, roleTheme.glow, 0.22);
        glow.setDepth(point.y + 13);
        const sprite = this.add.circle(point.x, point.y - 10, 22, roleTheme.fill, 1);
        sprite.setStrokeStyle(2, roleTheme.stroke, 1);
        sprite.setDepth(2000 + point.y);
        const icon = this.add.text(point.x, point.y - 10, visual.icon || "🐾", {
          fontFamily: "Segoe UI Emoji",
          fontSize: "32px",
          color: "#ffffff"
        }).setOrigin(0.5);
        icon.setDepth(2002 + point.y);
        const shortName = visual.nameVi.length > 8 ? `${visual.nameVi.slice(0, 8)}…` : visual.nameVi;
        const tagBg = this.add.rectangle(point.x, point.y - 47, 64, 13, 0x05070c, 0.76);
        tagBg.setStrokeStyle(1, 0x2c3f54, 0.8);
        tagBg.setDepth(2001 + point.y);
        const tag = this.add.text(point.x, point.y - 47, shortName, {
          fontFamily: UI_FONT,
          fontSize: "9px",
          color: "#e7f3ff",
          fontStyle: "bold"
        }).setOrigin(0.5);
        tag.setDepth(2002 + point.y);
        const label = this.add.text(point.x + 20, point.y - 31, `${unit.star}★`, {
          fontFamily: UI_FONT,
          fontSize: "9px",
          color: "#fff8d7",
          fontStyle: "bold"
        });
        label.setDepth(2003 + point.y);

        const baseStats = scaledBaseStats(unit.base.stats, unit.star, unit.base.classType);
        const unitBars = buildPlanningUnitBars(point, baseStats, startingRage, startingShield);

        // Single hover zone prevents pointerover/out conflicts between stacked sprite/icon/bars.
        const hoverZoneW = Math.max(60, unitBars.barW + 16);
        const hoverZoneH = 64;
        const hoverZone = this.add.zone(point.x, point.y - 2, hoverZoneW, hoverZoneH);
        hoverZone.setInteractive({ useHandCursor: true });
        hoverZone.setDepth(2005 + point.y);
        this.tooltip.attach(hoverZone, () => this.getUnitTooltip(unit.baseId, unit.star, unit));
        hoverZone.on("pointerover", () => this.showAttackPreviewForUnit(actor));
        hoverZone.on("pointerout", () => this.clearAttackPreview(actor));
        hoverZone.on("pointerup", (pointer) => {
          if (this.isUnitDragging) return;
          if (this.boardDragConsumed) return;
          if (this.isPanPointer(pointer)) return;
          this.onPlayerCellClick(row, col);
        });

        this.planningSprites.push(
          glow,
          sprite,
          icon,
          tagBg,
          tag,
          label,
          unitBars.hpBarBg,
          unitBars.hpBarFill,
          unitBars.shieldBar,
          unitBars.rageBarBg,
          unitBars.rageBarFill,
          unitBars.rageGrid,
          hoverZone
        );
      }
    }
  }

  refreshSynergyPreview() {
    const deployed = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const unit = this.player.board[row][col];
        if (unit) deployed.push(unit);
      }
    }
    const summary = this.computeSynergyCounts(deployed, "LEFT");
    const classLines = Object.keys(summary.classCounts)
      .sort((a, b) => summary.classCounts[b] - summary.classCounts[a])
      .map((key) => `${getClassLabelVi(key)}: ${summary.classCounts[key]}`);
    const tribeLines = Object.keys(summary.tribeCounts)
      .sort((a, b) => summary.tribeCounts[b] - summary.tribeCounts[a])
      .map((key) => `${getTribeLabelVi(key)}: ${summary.tribeCounts[key]}`);
    const aug = this.player.augments.length ? this.player.augments.join(", ") : null;

    const classPreview = classLines.slice(0, 3);
    const tribePreview = tribeLines.slice(0, 3);
    const augPreview = aug ? aug.split(", ").slice(0, 2) : [];
    const classText = classPreview.length ? classPreview.map((line) => `• ${line}`).join("\n") : "• Chưa kích nghề";
    const tribeText = tribePreview.length ? tribePreview.map((line) => `• ${line}`).join("\n") : "• Chưa kích tộc";
    const augText = augPreview.length
      ? `${augPreview.map((line) => `• ${line}`).join("\n")}${this.player.augments.length > 2 ? `\n• +${this.player.augments.length - 2} khác` : ""}`
      : "• Chưa có pháp ấn";
    this.synergyText.setText(`Nghề\n${classText}\n\nTộc\n${tribeText}\n\nPháp ấn\n${augText}`);
    this.refreshRightPanelScrollMetrics();
  }


  refreshStorageUi() {
    if (!this.storageSummaryText) return;

    const bagCountsRaw = {};
    this.player.itemBag.forEach((id) => {
      bagCountsRaw[id] = (bagCountsRaw[id] ?? 0) + 1;
    });
    const reservedCounts = this.getCraftReservedCounts();
    const bagCounts = {};
    Object.keys(bagCountsRaw).forEach((id) => {
      const available = (bagCountsRaw[id] ?? 0) - (reservedCounts[id] ?? 0);
      if (available > 0) bagCounts[id] = available;
    });
    if (this.selectedInventoryItemId && !bagCounts[this.selectedInventoryItemId]) {
      this.selectedInventoryItemId = null;
    }

    const craftedText = this.player.craftedItems
      .slice(-3)
      .map((id) => {
        const recipe = RECIPE_BY_ID[id];
        return `${recipe?.icon ?? "✨"} ${recipe?.name ?? id}`;
      })
      .join(", ");

    const selectedItem = this.selectedInventoryItemId ? ITEM_BY_ID[this.selectedInventoryItemId] : null;
    const tableSize = this.getCraftGridSize();
    const activeCraftSlots = new Set(this.getCraftActiveIndices());

    this.storageSummaryText.setText(`Kho thú ${this.player.bench.length}/${this.getBenchCap()} | Kho đồ ${this.player.itemBag.length}`);
    this.storageCraftText?.setText(
      `• Đồ ghép gần đây: ${craftedText || "Chưa có"}${selectedItem ? ` • Đang chọn: ${selectedItem.icon} ${selectedItem.name}` : ""}`
    );
    this.craftTitleText?.setText(`⚒ Bàn chế tạo ${tableSize}x${tableSize}`);

    const bagEntries = Object.entries(bagCounts).sort((a, b) => b[1] - a[1]);
    this.inventoryCells.forEach((cell, idx) => {
      const pair = bagEntries[idx];
      if (!pair) {
        cell.itemId = null;
        cell.amount = 0;
        const isSelected = false;
        cell.bg.setFillStyle(0x162639, isSelected ? 1 : 0.95);
        cell.bg.setStrokeStyle(1, isSelected ? UI_COLORS.accent : UI_COLORS.panelEdgeSoft, isSelected ? 0.95 : 0.78);
        cell.icon.setText("＋");
        cell.icon.setColor(UI_COLORS.textMuted);
        cell.count.setText("");
        return;
      }
      const [itemId, amount] = pair;
      const item = ITEM_BY_ID[itemId];
      cell.itemId = itemId;
      cell.amount = amount;
      const isSelected = this.selectedInventoryItemId === itemId;
      cell.bg.setFillStyle(0x203450, 0.96);
      cell.bg.setStrokeStyle(1, isSelected ? UI_COLORS.accent : UI_COLORS.panelEdge, isSelected ? 1 : 0.85);
      cell.icon.setText(item?.icon ?? "❔");
      cell.icon.setColor("#ffffff");
      cell.count.setText(`x${amount}`);
    });

    this.craftInputSlots.forEach((slot) => {
      const enabled = activeCraftSlots.has(slot.index);
      if (!enabled) {
        slot.bg.setFillStyle(0x0f1b2a, 0.65);
        slot.bg.setStrokeStyle(1, 0x2a3b4d, 0.55);
        slot.icon.setText("🔒");
        slot.icon.setColor("#5d7084");
        return;
      }
      const itemId = this.craftGridItems?.[slot.index] ?? null;
      if (!itemId) {
        slot.bg.setFillStyle(0x162639, 0.96);
        slot.bg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.78);
        slot.icon.setText("·");
        slot.icon.setColor(UI_COLORS.textMuted);
        return;
      }
      const item = ITEM_BY_ID[itemId];
      slot.bg.setFillStyle(0x203450, 0.96);
      slot.bg.setStrokeStyle(1, UI_COLORS.panelEdge, 0.85);
      slot.icon.setText(item?.icon ?? "❔");
      slot.icon.setColor("#ffffff");
    });

    const resultRecipeId = this.getCraftResultRecipeId();
    if (this.craftOutputSlot?.bg && this.craftOutputSlot?.icon) {
      if (resultRecipeId) {
        const recipe = RECIPE_BY_ID[resultRecipeId];
        this.craftOutputSlot.bg.setFillStyle(0x2a4563, 0.96);
        this.craftOutputSlot.bg.setStrokeStyle(1, UI_COLORS.accent, 0.95);
        this.craftOutputSlot.icon.setText(recipe?.icon ?? "✨");
        this.craftOutputSlot.icon.setColor("#ffffff");
        this.craftHintText?.setText(`Khớp: ${recipe?.name ?? resultRecipeId}. Nhấn ô đầu ra để chế tạo.`);
      } else {
        this.craftOutputSlot.bg.setFillStyle(0x1e2f42, 0.95);
        this.craftOutputSlot.bg.setStrokeStyle(1, UI_COLORS.panelEdgeSoft, 0.8);
        this.craftOutputSlot.icon.setText("?");
        this.craftOutputSlot.icon.setColor(UI_COLORS.textMuted);
        const lockedCount = tableSize >= 3 ? 0 : 5;
        this.craftHintText?.setText(
          lockedCount > 0
            ? `Nhấn nguyên liệu để xếp mẫu ${tableSize}x${tableSize}. Còn ${lockedCount} ô sẽ mở khi nâng cấp.`
            : `Nhấn nguyên liệu để xếp mẫu ${tableSize}x${tableSize}.`
        );
      }
    }

    this.refreshRightPanelScrollMetrics();
  }

  craftItem(recipeId) {
    if (this.settingsVisible || this.phase !== PHASE.PLANNING) return;
    const recipe = RECIPE_BY_ID[recipeId];
    if (!recipe) return;
    const equipmentId = `eq_${recipe.id}`;
    const equipment = ITEM_BY_ID[equipmentId];
    if (!equipment) {
      this.addLog(`Không thể ghép ${recipe.name}: thiếu dữ liệu trang bị.`);
      return;
    }

    const bagCopy = [...this.player.itemBag];
    const required = this.getRecipeRequiredList(recipe);
    for (let i = 0; i < required.length; i += 1) {
      const idx = bagCopy.indexOf(required[i]);
      if (idx < 0) {
        this.addLog(`Thiếu vật phẩm để ghép ${recipe.name}.`);
        return;
      }
      bagCopy.splice(idx, 1);
    }

    bagCopy.push(equipmentId);
    this.player.itemBag = bagCopy;
    this.player.craftedItems.push(recipe.id);
    this.audioFx.play("buy");
    this.addLog(`Đã ghép: ${recipe.icon} ${recipe.name}. Chọn ô vật phẩm rồi nhấn vào thú để trang bị.`);
    this.refreshStorageUi();
    this.persistProgress();
  }

  inferLogCategory(message) {
    const text = String(message ?? "").toLowerCase();
    if (
      text.includes("giao tranh") ||
      text.includes("thắng") ||
      text.includes("thua") ||
      text.includes("đòn") ||
      text.includes("combat")
    ) {
      return "COMBAT";
    }
    if (
      text.includes("mua") ||
      text.includes("shop") ||
      text.includes("roll") ||
      text.includes("xp") ||
      text.includes("khóa")
    ) {
      return "SHOP";
    }
    if (text.includes("ghép") || text.includes("vật phẩm") || text.includes("craft")) {
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
    this.logText.setText(latest ? `• ${latest}` : "• Chưa có sự kiện.");
    this.buttons.history?.setLabel(`Xem lịch sử (${this.logHistory.length})`);
    this.refreshRightPanelScrollMetrics();
  }

  getUnitTooltip(baseId, star = 1, ownedUnit = null) {
    const base = UNIT_BY_ID[baseId];
    if (!base) return { title: "Không rõ", body: "Không có dữ liệu linh thú." };
    const visual = getUnitVisual(baseId, base.classType);
    const skill = SKILL_LIBRARY[base.skillId];
    const classDef = CLASS_SYNERGY[base.classType];
    const tribeDef = TRIBE_SYNERGY[base.tribe];
    const classMarks = classDef ? classDef.thresholds.join("/") : "-";
    const tribeMarks = tribeDef ? tribeDef.thresholds.join("/") : "-";
    const statScale = star === 1 ? 1 : star === 2 ? 1.6 : 2.5;
    const variant = ownedUnit ? this.getUnitSkillVariant(ownedUnit) : null;
    const equippedItems = Array.isArray(ownedUnit?.equips)
      ? ownedUnit.equips.map((id) => ITEM_BY_ID[id]).filter((x) => x?.kind === "equipment")
      : [];

    let skillIcon = "✨";
    if (skill?.damageType === "physical") skillIcon = "🗡️";
    else if (skill?.damageType === "magic") skillIcon = "🪄";
    else if (skill?.damageType === "true") skillIcon = "💠";

    const rightLines = [
      "👊 Đánh thường",
      ...this.describeBasicAttack(base.classType, base.stats.range).map((line) => `• ${line}`),
      "",
      `${skillIcon} Chiêu thức: ${skill?.name ?? "Không có"}`,
      ...this.describeSkillLines(skill).map((line) => `• ${line}`)
    ];

    if (skill && skill.scaleStat && skill.scale) {
      const scaleStat = skill.scaleStat;
      const statLabel = this.translateScaleStat(scaleStat);
      const baseVal = skill.base || 0;

      let currentStat = 0;
      if (ownedUnit) {
        if (scaleStat === "atk") currentStat = this.getEffectiveAtk(ownedUnit);
        else if (scaleStat === "matk") currentStat = this.getEffectiveMatk(ownedUnit);
        else if (scaleStat === "def") currentStat = this.getEffectiveDef(ownedUnit);
        else if (scaleStat === "mdef") currentStat = this.getEffectiveMdef(ownedUnit);
        else currentStat = ownedUnit[scaleStat] || 0;
      } else {
        currentStat = Math.round((base.stats[scaleStat] || 0) * statScale);
      }

      const bonus = Math.round(currentStat * skill.scale);
      const total = baseVal + bonus;
      rightLines.push(`• Công thức: ${statLabel} (${skill.scale}x) + ${baseVal} = ${bonus} + ${baseVal} = ${total}`);
    }

    if (equippedItems.length) {
      rightLines.push("");
      rightLines.push("📦 Trang bị đang mặc");
      equippedItems.forEach((item) => {
        const recipe = RECIPE_BY_ID[item.fromRecipe];
        const desc = recipe?.description ? ` (${recipe.description})` : "";
        rightLines.push(`• ${item.icon} ${item.name}${desc}`);
      });
    }

    if (variant) {
      rightLines.push("");
      rightLines.push(`◆ Biến thể: ${variant.name}`);
    }

    const equipmentLine = equippedItems.length
      ? `Trang bị: ${equippedItems.map((item) => `${item.icon} ${item.name}`).join(", ")}`
      : "Trang bị: Chưa có";
    return {
      title: `${visual.icon} ${visual.nameVi} (${star}★)`,
      body: [
        `🏷️ Bậc:${base.tier}  ${getTribeLabelVi(base.tribe)}/${getClassLabelVi(base.classType)}`,
        `❤️ HP:${Math.round(base.stats.hp * statScale)}  ATK:${Math.round(base.stats.atk * statScale)}  DEF:${Math.round(base.stats.def * statScale)}`,
        `✨ MATK:${Math.round(base.stats.matk * statScale)}  MDEF:${Math.round(base.stats.mdef * statScale)}  Tầm:${base.stats.range}`,
        `🔥 Nộ tối đa:${base.stats.rageMax}`,
        `🎒 ${equipmentLine}`,
        `🎯 Mốc nghề: ${classMarks}`,
        `🌿 Mốc tộc: ${tribeMarks}`
      ].join("\n"),
      rightBody: rightLines.join("\n")
    };
  }

  getAugmentTooltip(augment) {
    return {
      title: `${this.getAugmentIcon(augment)} ${augment.name} [${this.translateAugmentGroup(augment.group)}]`,
      body: `${augment.description}\n\nHiệu ứng: ${this.translateAugmentEffect(augment.effect.type)}${augment.effect.value != null ? ` (${augment.effect.value})` : ""}`
    };
  }

  getSynergyTooltip() {
    const deployed = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const unit = this.player?.board?.[row]?.[col];
        if (unit) deployed.push(unit);
      }
    }

    const summary = this.computeSynergyCounts(deployed, "LEFT");
    const lines = [];

    Object.entries(summary.classCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, count]) => {
        const def = CLASS_SYNERGY[key];
        if (!def) return;
        const tier = this.getSynergyTier(count, def.thresholds);
        const activeBonus = tier >= 0 ? this.formatBonusSet(def.bonuses[tier]) : "chưa kích hoạt";
        lines.push(`Nghề ${getClassLabelVi(key)}: ${count} | Mốc ${def.thresholds.join("/")} | ${activeBonus}`);
      });

    Object.entries(summary.tribeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, count]) => {
        const def = TRIBE_SYNERGY[key];
        if (!def) return;
        const tier = this.getSynergyTier(count, def.thresholds);
        const activeBonus = tier >= 0 ? this.formatBonusSet(def.bonuses[tier]) : "chưa kích hoạt";
        lines.push(`Tộc ${getTribeLabelVi(key)}: ${count} | Mốc ${def.thresholds.join("/")} | ${activeBonus}`);
      });

    if (!lines.length) lines.push("Chưa có cộng hưởng nào đang kích hoạt.");

    if (this.player?.augments?.length) {
      lines.push("");
      lines.push("Pháp ấn đã chọn:");
      this.player.augments.forEach((id) => {
        const aug = AUGMENT_LIBRARY.find((x) => x.id === id);
        if (!aug) return;
        lines.push(`- ${this.getAugmentIcon(aug)} ${aug.name}: ${aug.description}`);
      });
    }

    return {
      title: "Chi tiết cộng hưởng / pháp ấn",
      body: lines.join("\n")
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
    if (!bonus) return "chưa có hiệu ứng";
    return Object.entries(bonus)
      .map(([k, v]) => `${k}:${typeof v === "number" && v < 1 ? `${Math.round(v * 100)}%` : v}`)
      .join(", ");
  }

  inferBasicActionPattern(classType, range) {
    if (range >= 2) return "RANGED_STATIC";
    if (classType === "ASSASSIN") return "ASSASSIN_BACK";
    return "MELEE_FRONT";
  }

  describeBasicAttack(classType, range) {
    const pattern = this.inferBasicActionPattern(classType, range);
    const lines = [`Thi triển: ${this.translateActionPattern(pattern)}`, `Tầm đánh: ${range} ô`, "Loại sát thương: Vật lý"];
    if (classType === "ASSASSIN") {
      lines.push("Ưu tiên mục tiêu hậu phương thấp máu.");
    } else if (classType === "ARCHER" || classType === "MAGE") {
      lines.push("Ưu tiên mục tiêu cùng hàng, sau đó gần tiền tuyến.");
    } else {
      lines.push("Ưu tiên tiền tuyến gần nhất.");
    }
    lines.push("Công thức cơ bản: ATK và giáp mục tiêu.");
    return lines;
  }

  describeSkillLines(skill) {
    if (!skill) return ["Không có kỹ năng chủ động."];
    if (skill.descriptionVi) {
      return [skill.descriptionVi];
    }
    const lines = [`Thi triển: ${this.translateActionPattern(skill.actionPattern)}`];
    if (skill.effect) lines.push(`Hiệu ứng: ${this.translateSkillEffect(skill.effect)}`);
    const areaText = this.describeSkillArea(skill);
    if (areaText) lines.push(`Vùng tác động: ${areaText}`);
    if (skill.damageType) lines.push(`Loại sát thương: ${this.translateDamageType(skill.damageType)}`);
    return lines;
  }

  describeSkill(skill) {
    return this.describeSkillLines(skill).join(" | ");
  }

  describeSkillArea(skill) {
    if (!skill) return "";
    const maxHits = Number.isFinite(skill.maxHits) ? Math.max(1, Math.floor(skill.maxHits)) : null;
    const maxTargets = Number.isFinite(skill.maxTargets) ? Math.max(1, Math.floor(skill.maxTargets)) : null;
    const map = {
      damage_shield_taunt: "Tấn công 1 ô hình điểm tiền tuyến.",
      damage_stun: "Tấn công 1 ô hình điểm tiền tuyến.",
      damage_shield_reflect: "Tấn công 1 ô hình điểm tiền tuyến.",
      ally_row_def_buff: "Không tấn công. Cường hóa 1 hàng đồng minh (tối đa 5 ô).",
      single_burst: "Tấn công 1 ô hình điểm.",
      double_hit: "Tấn công 1 ô hình điểm (2 đòn liên tiếp).",
      single_burst_lifesteal: "Tấn công 1 ô hình điểm và hút máu.",
      single_delayed_echo: "Tấn công 1 ô hình điểm, sau đó nổ dội cùng ô.",
      cross_5: "Tấn công 5 ô hình chữ thập.",
      row_multi: `Tấn công ${maxHits ?? 3} ô hình hàng ngang.`,
      single_sleep: "Tấn công 1 ô hình điểm, có thể gây ngủ.",
      single_armor_break: "Tấn công 1 ô hình điểm và giảm giáp.",
      column_freeze: "Tấn công 5 ô hình cột dọc.",
      aoe_circle: "Tấn công 5 ô hình vòng tròn nhỏ.",
      column_plus_splash: "Tấn công 5 ô hình cột và lan 2 ô cạnh mục tiêu.",
      aoe_poison: "Tấn công vùng 3x3 (tối đa 9 ô).",
      dual_heal: "Không tấn công. Hồi máu 2 ô đồng minh.",
      shield_cleanse: "Không tấn công. Tạo khiên + thanh tẩy cho đồng minh.",
      team_rage: `Không tấn công. Tăng nộ tối đa ${maxTargets ?? 3} đồng minh.`,
      column_bless: "Không tấn công. Cường hóa 1 cột đồng minh (tối đa 5 ô).",
      row_cleave: "Tấn công 5 ô hình hàng ngang.",
      self_atk_and_assist: "Tấn công 1 ô tiền tuyến, đồng thời tự cường hóa.",
      cone_smash: "Tấn công 3 ô hình nón trước mặt.",
      true_single: "Tấn công 1 ô hình điểm (sát thương chuẩn)."
    };
    const text = map[skill.effect];
    if (text) return text;

    if (skill.actionPattern === "SELF") return "Không tấn công trực tiếp; hiệu ứng tự thân/hỗ trợ.";
    if (String(skill.effect ?? "").includes("single")) return "Tấn công 1 ô hình điểm.";
    if (String(skill.effect ?? "").includes("row")) return "Tấn công nhiều ô hình hàng ngang.";
    if (String(skill.effect ?? "").includes("column")) return "Tấn công nhiều ô hình cột dọc.";
    if (String(skill.effect ?? "").includes("aoe")) return "Tấn công nhiều ô theo vùng.";
    if (String(skill.effect ?? "").includes("cone")) return "Tấn công nhiều ô hình nón.";
    return "Tấn công theo mẫu kỹ năng đặc thù.";
  }

  translateDamageType(type) {
    if (type === "physical") return "Vật lý";
    if (type === "magic") return "Phép";
    if (type === "true") return "Chuẩn";
    return type ?? "-";
  }

  translateScaleStat(stat) {
    if (stat === "matk") return "MATK";
    if (stat === "atk") return "ATK";
    if (stat === "def") return "DEF";
    if (stat === "mdef") return "MDEF";
    return String(stat ?? "chỉ số");
  }

  translateActionPattern(pattern) {
    const map = {
      MELEE_FRONT: "Cận chiến áp sát tiền tuyến",
      ASSASSIN_BACK: "Lao ra hậu phương rồi quay về",
      RANGED_STATIC: "Đứng yên và bắn từ xa",
      SELF: "Tự cường hóa hoặc hỗ trợ"
    };
    return map[pattern] ?? pattern;
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
      random_multi: "Bắn ngẫu nhiên nhiều mục tiêu",
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

  translateAugmentEffect(effectType) {
    const map = {
      gold_flat: "Vàng cộng thẳng",
      interest_cap: "Tăng trần lãi",
      roll_cost_delta: "Giảm giá đổi tướng",
      deploy_cap_bonus: "Tăng giới hạn triển khai",
      bench_bonus: "Tăng ô dự bị",
      starting_rage: "Tăng nộ đầu trận",
      team_atk_pct: "Tăng công toàn đội",
      team_hp_pct: "Tăng máu toàn đội",
      starting_shield: "Tăng khiên đầu trận",
      team_matk_pct: "Tăng công phép toàn đội",
      extra_class_count: "Cộng mốc nghề",
      extra_tribe_count: "Cộng mốc tộc",
      lifesteal_pct: "Hút máu vật lý",
      hp_loss_reduce: "Giảm máu mất khi thua",
      xp_flat: "XP cộng thẳng"
    };
    return map[effectType] ?? effectType;
  }

  translateAugmentGroup(group) {
    const map = {
      ECONOMY: "Kinh tế",
      FORMATION: "Đội hình",
      COMBAT: "Giao tranh",
      SYNERGY: "Cộng hưởng"
    };
    return map[group] ?? group;
  }

  getAugmentIcon(augment) {
    if (augment?.icon) return augment.icon;
    const map = {
      ECONOMY: "💰",
      FORMATION: "🧩",
      COMBAT: "⚔️",
      SYNERGY: "✨"
    };
    return map[augment?.group] ?? "🌲";
  }

  getAI() {
    return AI_SETTINGS[this.aiMode];
  }

  computeEnemyTeamSize(ai, estimateLevel, sandbox = false) {
    const base = getDeployCapByLevel(estimateLevel);
    const flatBonus = ai?.teamSizeBonus ?? 0;
    const growthEvery = Math.max(1, ai?.teamGrowthEvery ?? 4);
    const growthCap = Math.max(0, ai?.teamGrowthCap ?? 2);
    const roundGrowth = clamp(Math.floor((this.player.round - 1) / growthEvery), 0, growthCap);
    const sandboxPenalty = sandbox ? 1 : 0;
    return clamp(base + flatBonus + roundGrowth - sandboxPenalty, 2, 12);
  }

  getAiRoleProfile(mode) {
    if (mode === "EASY") {
      return {
        minFrontRatio: 0.55,
        nonFrontBias: 0.18,
        weights: { TANKER: 0.36, FIGHTER: 0.28, ARCHER: 0.14, SUPPORT: 0.1, MAGE: 0.07, ASSASSIN: 0.05 }
      };
    }
    if (mode === "HARD") {
      return {
        minFrontRatio: 0.34,
        nonFrontBias: 0.45,
        weights: { TANKER: 0.19, FIGHTER: 0.19, ARCHER: 0.18, SUPPORT: 0.15, MAGE: 0.16, ASSASSIN: 0.13 }
      };
    }
    return {
      minFrontRatio: 0.42,
      nonFrontBias: 0.32,
      weights: { TANKER: 0.24, FIGHTER: 0.24, ARCHER: 0.17, SUPPORT: 0.13, MAGE: 0.13, ASSASSIN: 0.09 }
    };
  }

  pickClassByWeights(weights) {
    const entries = Object.entries(weights ?? {}).filter(([, weight]) => Number.isFinite(weight) && weight > 0);
    if (!entries.length) return "FIGHTER";
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let needle = Math.random() * total;
    for (let i = 0; i < entries.length; i += 1) {
      const [classType, weight] = entries[i];
      needle -= weight;
      if (needle <= 0) return classType;
    }
    return entries[entries.length - 1][0];
  }

  computeSynergyCounts(units, side) {
    const classCounts = {};
    const tribeCounts = {};
    const normalizeSynergyKey = (value) => {
      const key = typeof value === "string" ? value.trim() : value;
      if (!key || key === "undefined" || key === "null") return null;
      return key;
    };
    units.forEach((unit) => {
      const classType = normalizeSynergyKey(unit?.classType ?? unit?.base?.classType);
      const tribe = normalizeSynergyKey(unit?.tribe ?? unit?.base?.tribe);
      if (classType) classCounts[classType] = (classCounts[classType] ?? 0) + 1;
      if (tribe) tribeCounts[tribe] = (tribeCounts[tribe] ?? 0) + 1;
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
    const hpPct = bonus.hpPct ?? bonus.teamHpPct ?? 0;
    const atkPct = bonus.atkPct ?? bonus.teamAtkPct ?? 0;
    const matkPct = bonus.matkPct ?? bonus.teamMatkPct ?? 0;
    if (bonus.defFlat) unit.def += bonus.defFlat;
    if (bonus.mdefFlat) unit.mdef += bonus.mdefFlat;
    if (hpPct) {
      const add = Math.round(unit.maxHp * hpPct);
      unit.maxHp += add;
      unit.hp += add;
    }
    if (atkPct) unit.atk = Math.round(unit.atk * (1 + atkPct));
    if (matkPct) unit.matk = Math.round(unit.matk * (1 + matkPct));
    if (bonus.healPct) unit.mods.healPct += bonus.healPct;
    if (bonus.shieldStart) unit.mods.shieldStart += bonus.shieldStart;
    if (bonus.startingRage) unit.mods.startingRage += bonus.startingRage;
    if (bonus.critPct) unit.mods.critPct += bonus.critPct;
    if (bonus.burnOnHit) unit.mods.burnOnHit += bonus.burnOnHit;
    if (bonus.poisonOnHit) unit.mods.poisonOnHit += bonus.poisonOnHit;
  }

  applyOwnedEquipmentBonuses(unit, owned) {
    const equips = Array.isArray(owned?.equips) ? owned.equips : [];
    equips.forEach((itemId) => {
      const item = ITEM_BY_ID[itemId];
      if (!item || item.kind !== "equipment" || !item.bonus) return;
      this.applyBonusToUnit(unit, item.bonus);
    });
  }

  hashUnitSeed(unit) {
    const text = `${unit?.uid ?? ""}:${unit?.baseId ?? ""}`;
    let h = 0;
    for (let i = 0; i < text.length; i += 1) {
      h = (h * 33 + text.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  getUnitSkillVariant(unit) {
    const classType = unit?.base?.classType ?? unit?.classType ?? "FIGHTER";
    const variants = CLASS_SKILL_VARIANTS[classType] ?? CLASS_SKILL_VARIANTS.FIGHTER;
    if (!variants.length) return null;
    const seed = this.hashUnitSeed(unit);
    return variants[seed % variants.length];
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
      this.addLog(`Sudden death x${this.globalDamageMult.toFixed(1)} damage.`);
    }

    this.isActing = true;
    this.highlightUnit(actor, 0xffef9f);
    const skipped = this.processStartTurn(actor);
    if (skipped) {
      this.addLog(`${actor.name} bo luot (${skipped}).`);
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
    this.tickTimedStatus(unit, "slowTurns");
    this.tickTimedStatus(unit, "disarmTurns");
    this.tickTimedStatus(unit, "immuneTurns");
    this.tickTimedStatus(unit, "physReflectTurns");
    this.tickTimedStatus(unit, "counterTurns");
    this.tickTimedStatus(unit, "isProtecting");

    if (unit.statuses.burnTurns > 0) {
      this.resolveDamage(null, unit, unit.statuses.burnDamage, "true", "BURN", { noRage: true, noReflect: true });
      unit.statuses.burnTurns -= 1;
    }
    if (unit.statuses.poisonTurns > 0) {
      this.resolveDamage(null, unit, unit.statuses.poisonDamage, "true", "POISON", { noRage: true, noReflect: true });
      unit.statuses.poisonTurns -= 1;
    }
    if (unit.statuses.bleedTurns > 0) {
      this.resolveDamage(null, unit, unit.statuses.bleedDamage, "true", "MÁU", { noRage: true, noReflect: true });
      unit.statuses.bleedTurns -= 1;
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
    if (key === "atkDebuffTurns" && unit.statuses.atkDebuffTurns <= 0) {
      unit.statuses.atkDebuffValue = 0;
      unit.statuses.atkDebuffTurns = 0;
    }
    if (key === "reflectTurns" && unit.statuses.reflectTurns <= 0) {
      unit.statuses.reflectPct = 0;
      unit.statuses.reflectTurns = 0;
    }
    if (key === "immuneTurns" && unit.statuses.immuneTurns <= 0) {
      unit.statuses.immuneTurns = 0;
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
    const keepFrontline = attacker.range <= 1 && attacker.classType !== "ASSASSIN";
    if (attacker.side === "RIGHT" && !keepFrontline && !options.deterministic && Math.random() < ai.randomTargetChance) {
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
    const lateralDist = Math.abs(target.row - attacker.row);
    const forwardDist = attacker.side === "LEFT" ? Math.max(0, target.col - attacker.col) : Math.max(0, attacker.col - target.col);
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
    return [frontlineDist, forwardDist, lateralDist, hpRatio, hpRaw];
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
      this.resolveDamage(attacker, target, raw, "physical", "BASIC");
    });
    this.addLog(`${attacker.name} danh ${target.name}.`);
  }

  async castSkill(attacker, target) {
    const skill = SKILL_LIBRARY[attacker.skillId];
    if (!skill) {
      await this.basicAttack(attacker, target);
      return;
    }

    await this.runActionPattern(attacker, target, skill.actionPattern, async () => {
      await this.applySkillEffect(attacker, target, skill);
    });
    this.addLog(`${attacker.name} dung skill ${skill.name}.`);
  }

  async runActionPattern(attacker, target, pattern, impactFn) {
    if (pattern === "SELF" || pattern === "RANGED_STATIC") {
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

      case "global_stun": {
        enemies.forEach((enemy) => {
          this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
          const effectiveStunChance = Math.min(1, skill.stunChance * starChanceMult);
          if (enemy.alive && Math.random() < effectiveStunChance) {
            enemy.statuses.stun = Math.max(enemy.statuses.stun, skill.stunTurns);
            this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHOÁNG", "#ffd97b");
            this.updateCombatUnitUi(enemy);
          }
        });
        break;
      }
      case "single_burst_armor_pen": {
        const penOpts = { ...skillOpts, armorPen: skill.armorPen || 0.5 };
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, penOpts);
        break;
      }
      case "single_poison_slow": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
        if (target.alive) {
          target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, skill.poisonTurns);
          target.statuses.poisonDamage = Math.max(target.statuses.poisonDamage, skill.poisonPerTurn);
          target.statuses.slowTurns = Math.max(target.statuses.slowTurns, skill.slowTurns);
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "aoe_circle_stun": {
        const expandAoe = 1 + areaBonus;
        enemies
          .filter((enemy) => Math.abs(enemy.row - target.row) <= expandAoe && Math.abs(enemy.col - target.col) <= expandAoe)
          .forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
            const effectiveStunChance = Math.min(1, skill.stunChance * starChanceMult);
            if (enemy.alive && Math.random() < effectiveStunChance) {
              enemy.statuses.stun = Math.max(enemy.statuses.stun, skill.stunTurns);
              this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHOÁNG", "#ffd97b");
              this.updateCombatUnitUi(enemy);
            }
          });
        break;
      }
      case "single_bleed": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
        if (target.alive) {
          target.statuses.bleedTurns = Math.max(target.statuses.bleedTurns, skill.turns || 3);
          const bleedDmg = Math.round(this.getEffectiveAtk(attacker) * 0.3);
          target.statuses.bleedDamage = Math.max(target.statuses.bleedDamage || 0, bleedDmg);
          this.showFloatingText(target.sprite.x, target.sprite.y - 45, "CHẢY MÁU", "#ff4444");
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "cone_shot": {
        const victims = enemies.filter(e => Math.abs(e.row - target.row) <= 1 && e.col >= target.col);
        victims.forEach(e => this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts));
        break;
      }
      case "global_debuff_atk": {
        enemies.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts);
          if (e.alive) {
            e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, skill.turns);
            e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, skill.selfAtkBuff || 20);
            this.showFloatingText(e.sprite.x, e.sprite.y - 45, "YẾU ỚT", "#ffaaaa");
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "knockback_charge": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
        if (target.alive) {
          const push = attacker.side === "LEFT" ? 1 : -1;
          const newCol = Math.max(0, Math.min(9, target.col + push));
          if (!enemies.find(u => u.row === target.row && u.col === newCol)) {
            target.col = newCol;
            const screen = this.gridToScreen(target.col, target.row);
            this.tweens.add({ targets: target.sprite, x: screen.x, y: screen.y - 10, duration: 200 });
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "ĐẨY LÙI", "#ffffff");
          }
        }
        break;
      }
      case "cleave_armor_break": {
        enemies
          .filter(e => Math.abs(e.row - target.row) <= 1 && Math.abs(e.col - target.col) <= 1)
          .forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts);
            if (e.alive) {
              e.statuses.armorBreakTurns = Math.max(e.statuses.armorBreakTurns, skill.turns);
              e.statuses.armorBreakValue = Math.max(e.statuses.armorBreakValue, skill.armorBreak);
              this.updateCombatUnitUi(e);
            }
          });
        break;
      }
      case "single_strong_poison": {
        this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
        if (target.alive) {
          target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, 5);
          target.statuses.poisonDamage = Math.max(target.statuses.poisonDamage, Math.round(rawSkill * 0.5));
          this.updateCombatUnitUi(target);
        }
        break;
      }
      case "shield_immune": {
        allies.forEach(a => {
          this.addShield(a, rawSkill);
          a.statuses.immuneTurns = Math.max(a.statuses.immuneTurns, skill.turns || 2);
          this.showFloatingText(a.sprite.x, a.sprite.y - 45, "MIỄN NHIỄM", "#ffffff");
          this.updateCombatUnitUi(a);
        });
        break;
      }
      case "self_bersek": {
        attacker.statuses.atkBuffTurns = Math.max(attacker.statuses.atkBuffTurns, 5);
        attacker.statuses.atkBuffValue = Math.max(attacker.statuses.atkBuffValue, Math.round(attacker.atk * 0.5));
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "CUỒNG NỘ", "#ff0000");
        this.updateCombatUnitUi(attacker);
        break;
      }
      case "execute_heal": {
        const dealt = this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
        if (!target.alive) {
          this.healUnit(attacker, attacker, Math.round(attacker.maxHp * 0.2), "HẤP THỤ");
          attacker.rage = Math.min(attacker.rageMax, attacker.rage + 2);
        }
        break;
      }
      case "global_fire": {
        enemies.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill, "magic", skill.name, skillOpts);
          if (e.alive) {
            e.statuses.burnTurns = Math.max(e.statuses.burnTurns, 3);
            e.statuses.burnDamage = Math.max(e.statuses.burnDamage, Math.round(rawSkill * 0.2));
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "revive_or_heal": {
        const dead = this.combatUnits.find(u => u.side === attacker.side && !u.alive);
        if (dead && Math.random() < 0.5) {
          dead.alive = true;
          dead.hp = Math.round(dead.maxHp * 0.4);
          dead.sprite.clearFill();
          dead.tag.setColor("#ffffff");
          this.showFloatingText(dead.sprite.x, dead.sprite.y - 45, "HỒI SINH", "#ffff00");
          this.updateCombatUnitUi(dead);
        } else {
          allies.forEach(a => this.healUnit(attacker, a, rawSkill, "CỨU RỖI"));
        }
        break;
      }
      case "true_execute": {
        const bonus = target.hp < target.maxHp * 0.4 ? rawSkill * 2 : rawSkill;
        this.resolveDamage(attacker, target, bonus, "true", skill.name, skillOpts);
        break;
      }
      case "global_slow": {
        enemies.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill, skill.damageType, skill.name, skillOpts);
          if (e.alive) {
            e.statuses.slowTurns = Math.max(e.statuses.slowTurns, 3);
            this.showFloatingText(e.sprite.x, e.sprite.y - 45, "LÀM CHẬM", "#888888");
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "multi_disarm": {
        const victims = enemies.sort((a, b) => b.atk - a.atk).slice(0, 3);
        victims.forEach(e => {
          this.resolveDamage(attacker, e, rawSkill * 0.5, "magic", skill.name, skillOpts);
          if (e.alive) {
            e.statuses.disarmTurns = Math.max(e.statuses.disarmTurns, 2);
            this.showFloatingText(e.sprite.x, e.sprite.y - 45, "TƯỚC KHÍ", "#ffffff");
            this.updateCombatUnitUi(e);
          }
        });
        break;
      }
      case "random_lightning": {
        for (let i = 0; i < 5; i++) {
          const e = enemies[Math.floor(Math.random() * enemies.length)];
          if (e) this.resolveDamage(attacker, e, rawSkill, "magic", "LÔI PHẠT", skillOpts);
        }
        break;
      }
      case "team_buff_def": {
        allies.forEach(a => {
          a.statuses.defBuffTurns = Math.max(a.statuses.defBuffTurns, 3);
          a.statuses.defBuffValue = Math.max(a.statuses.defBuffValue, skill.armorBuff || 30);
          this.updateCombatUnitUi(a);
        });
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "BẢO VỆ", "#00ff00");
        break;
      }

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
      case "metamorphosis": {
        attacker.name = "Bướm Chúa";
        attacker.icon = "🦋";
        attacker.atk = Math.round(attacker.atk * (skill.buffStats?.atk || 1.5));
        attacker.matk = Math.round(attacker.matk * (skill.buffStats?.matk || 1.5));
        attacker.maxHp = Math.round(attacker.maxHp * (skill.buffStats?.hp || 1.5));
        attacker.hp = attacker.maxHp;
        attacker.rage = 0;
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 60, "BIẾN HÌNH!", "#ff00ff");
        this.updateCombatUnitUi(attacker);
        break;
      }
      case "turtle_protection": {
        attacker.statuses.isProtecting = skill.turns || 3;
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "HÀO QUANG VỆ QUÂN", "#9dffba");
        this.updateCombatUnitUi(attacker);
        break;
      }
      case "rhino_counter": {
        attacker.statuses.counterTurns = skill.turns || 3;
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "TẬP TRUNG PHẢN ĐÒN", "#ffd97b");
        this.updateCombatUnitUi(attacker);
        break;
      }
      case "pangolin_reflect": {
        attacker.statuses.physReflectTurns = skill.turns || 3;
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "GIÁP VẢY SẮC", "#ff9b9b");
        this.updateCombatUnitUi(attacker);
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
        enemies.forEach((enemy) => {
          const isPrimary = enemy.row === target.row && enemy.col === target.col;
          if (points.some((p) => p[0] === enemy.row && p[1] === enemy.col)) {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
          }
        });
        break;
      }
      case "row_multi": {
        const victims = enemies
          .filter((enemy) => enemy.row === target.row)
          .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
          .slice(0, skill.maxHits);
        victims.forEach((enemy) => {
          const isPrimary = enemy.row === target.row && enemy.col === target.col;
          this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
        });
        break;
      }
      case "random_multi": {
        const pool = enemies.filter((enemy) => enemy.alive);
        const count = Math.min(skill.maxHits ?? 3, pool.length);
        const victims = sampleWithoutReplacement(pool, count);
        victims.forEach((enemy) => {
          const isPrimary = enemy.row === target.row && enemy.col === target.col;
          this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
        });
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
            const isPrimary = enemy.row === target.row && enemy.col === target.col;
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
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
          .forEach((enemy) => {
            const isPrimary = enemy.row === target.row && enemy.col === target.col;
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
          });
        break;
      }
      case "column_plus_splash": {
        enemies.forEach((enemy) => {
          const isPrimary = enemy.row === target.row && enemy.col === target.col;
          if (enemy.col === target.col) {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
          } else if (enemy.col === target.col - 1 || enemy.col === target.col + 1) {
            this.resolveDamage(attacker, enemy, rawSkill * skill.splashRate, skill.damageType, "SPLASH", { isSplash: true });
          }
        });
        break;
      }
      case "aoe_poison": {
        enemies
          .filter((enemy) => Math.abs(enemy.row - target.row) <= 1 && Math.abs(enemy.col - target.col) <= 1)
          .forEach((enemy) => {
            const isPrimary = enemy.row === target.row && enemy.col === target.col;
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
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
            const isPrimary = enemy.row === target.row && enemy.col === target.col;
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, { isSplash: !isPrimary });
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
          .forEach((enemy) => {
            const isPrimary = enemy.row === target.row && enemy.col === target.col;
            this.resolveDamage(attacker, enemy, rawSkill, "physical", skill.name, { isSplash: !isPrimary });
          });
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

  getUnitStatFallback(unit, statKey, defaultValue = 0) {
    if (!unit || typeof unit !== "object") return defaultValue;
    const direct = unit[statKey];
    if (Number.isFinite(direct)) return direct;
    const baseStat = unit.base?.stats?.[statKey];
    if (!Number.isFinite(baseStat)) return defaultValue;
    const star = Number.isFinite(unit.star) ? Math.max(1, Math.min(3, Math.floor(unit.star))) : 1;
    const scale = star >= 3 ? 2.5 : star === 2 ? 1.6 : 1;
    return Math.round(baseStat * scale);
  }

  getEffectiveAtk(unit) {
    const statuses = unit?.statuses ?? {};
    const atkBase = this.getUnitStatFallback(unit, "atk", 1);
    const buff = (statuses.atkBuffTurns ?? 0) > 0 ? (statuses.atkBuffValue ?? 0) : 0;
    const debuff = (statuses.atkDebuffTurns ?? 0) > 0 ? (statuses.atkDebuffValue ?? 0) : 0;
    return Math.max(1, atkBase + buff - debuff);
  }

  getEffectiveDef(unit) {
    const statuses = unit?.statuses ?? {};
    const defBase = this.getUnitStatFallback(unit, "def", 0);
    const buff = (statuses.defBuffTurns ?? 0) > 0 ? (statuses.defBuffValue ?? 0) : 0;
    return Math.max(0, defBase + buff);
  }

  getEffectiveMatk(unit) {
    const matkBase = this.getUnitStatFallback(unit, "matk", 1);
    return Math.max(1, matkBase);
  }

  getEffectiveMdef(unit) {
    const statuses = unit?.statuses ?? {};
    const mdefBase = this.getUnitStatFallback(unit, "mdef", 0);
    const buff = (statuses.mdefBuffTurns ?? 0) > 0 ? (statuses.mdefBuffValue ?? 0) : 0;
    return Math.max(0, mdefBase + buff);
  }

  resolveDamage(attacker, defender, rawDamage, damageType, reason, options = {}) {
    if (!defender || !defender.alive) return 0;
    if (attacker && !attacker.alive) return 0;

    // Turtle Protection Logic for Splash Damage
    if (options.isSplash && !options.isProtected) {
      const allies = this.getCombatUnits(defender.side);
      const protector = allies.find((a) =>
        a.alive &&
        a.statuses.isProtecting > 0 &&
        a.uid !== defender.uid &&
        Math.abs(a.row - defender.row) <= 1 &&
        Math.abs(a.col - defender.col) <= 1
      );
      if (protector) {
        this.showFloatingText(defender.sprite.x, defender.sprite.y - 55, "THẾ THÂN", "#ffffff");
        // Tanker intercepts with 25% damage reduction (takes 75%)
        return this.resolveDamage(attacker, protector, rawDamage * 0.75, damageType, "BẢO VỆ", {
          ...options,
          isSplash: false,
          isProtected: true,
          forceHit: true
        });
      }
    }

    if (attacker && !options.forceHit) {
      const evadePct = Phaser.Math.Clamp(Number(defender.mods.evadePct ?? 0), 0, 0.6);
      if (Math.random() < evadePct) {
        this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, "MISS", "#d3f2ff");
        return 0;
      }
    }

    let raw = Math.max(1, rawDamage);
    let isPhysicalCrit = false;
    if (attacker && damageType === "physical" && Math.random() < attacker.mods.critPct) {
      isPhysicalCrit = true;
      raw *= 1.5;
      this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "CRIT", "#ffd785");
    }

    let final = raw;
    if (damageType === "physical") {
      if (isPhysicalCrit) {
        // Crit vật lý xuyên giáp: giữ đúng 150% raw và bỏ qua giảm sát thương bởi DEF.
        final = raw;
      } else {
        const armorBreak = defender.statuses.armorBreakTurns > 0 ? defender.statuses.armorBreakValue : 0;
        const pen = options.armorPen || 0;
        const effectiveDef = Math.max(0, this.getEffectiveDef(defender) - armorBreak);
        const def = effectiveDef * (1 - pen);
        final = raw * (100 / (100 + def));
      }
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
      this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, `ABS ${absorbed}`, "#86e8ff");
    }

    if (damageLeft > 0) {
      defender.hp = Math.max(0, defender.hp - damageLeft);
      this.showDamageNumber(defender.sprite.x, defender.sprite.y - 45, damageLeft, {
        damageType,
        isCrit: isPhysicalCrit
      });
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

    if (attacker && !options.noReflect && attacker.alive) {
      // Standard reflect
      if (defender.statuses.reflectTurns > 0 && defender.statuses.reflectPct > 0) {
        const reflected = Math.max(1, Math.round(damageLeft * defender.statuses.reflectPct));
        this.resolveDamage(defender, attacker, reflected, "true", "REFLECT", {
          noReflect: true,
          forceHit: true
        });
      }
      // Pangolin Physical Reflect
      else if (damageType === "physical" && defender.statuses.physReflectTurns > 0) {
        this.resolveDamage(defender, attacker, damageLeft, "true", "VẢY PHẢN", {
          noReflect: true,
          forceHit: true
        });
      }
    }

    // Rhino Melee Counter
    if (attacker && !options.noCounter && attacker.alive && defender.alive) {
      // PlanningScene doesn't have full combat loop, but for consistency:
      if (attacker.range <= 1 && defender.statuses.counterTurns > 0) {
        // Just show text or simulate a hit if possible
        // (PlanningScene.basicAttack is simpler)
        if (typeof this.basicAttack === "function") {
          this.basicAttack(defender, attacker, { noCounter: true });
        }
      }
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
      defender.hpLabel.setColor("#9a9a9a");
      defender.rageLabel.setColor("#9a9a9a");
      defender.statusLabel.setColor("#9a9a9a");
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
    this.showFloatingText(target.sprite.x, target.sprite.y - 45, `+${applied}`, "#9dffba");
    if (caster && reason) this.showFloatingText(caster.sprite.x, caster.sprite.y - 37, reason, "#c9ffde");
    this.updateCombatUnitUi(target);
    return applied;
  }

  updateCombatUnitUi(unit) {
    unit.hpLabel.setText(`HP:${unit.hp}/${unit.maxHp}${unit.shield ? ` +S${unit.shield}` : ""}`);
    unit.rageLabel.setText(`R:${unit.rage}/${unit.rageMax}`);
    const s = [];
    if (unit.rage >= unit.rageMax - 1 && unit.rage > 0 && unit.alive) s.push("⚡");
    if (unit.shield > 0) s.push("🛡️");
    if (unit.statuses.immuneTurns > 0) s.push("🧤");
    if (unit.statuses.freeze > 0) s.push("❄");
    if (unit.statuses.stun > 0) s.push("💫");
    if (unit.statuses.sleep > 0) s.push("😴");
    if (unit.statuses.silence > 0) s.push("🔇");
    if (unit.statuses.disarmTurns > 0) s.push("🚫");
    if (unit.statuses.burnTurns > 0) s.push("🔥");
    if (unit.statuses.poisonTurns > 0) s.push("☠");
    if (unit.statuses.bleedTurns > 0) s.push("🩸");
    if (unit.statuses.diseaseTurns > 0) s.push("🦠");
    if (unit.statuses.tauntTurns > 0 && unit.statuses.tauntTargetId) s.push("🎯");
    if (unit.statuses.armorBreakTurns > 0) s.push("⚔️");
    if (unit.statuses.slowTurns > 0) s.push("⏳");
    if (unit.statuses.atkDebuffTurns > 0) s.push("📉");
    if (unit.statuses.reflectTurns > 0 || unit.statuses.physReflectTurns > 0) s.push("🌀");
    unit.statusLabel.setText(s.slice(0, 5).join(" "));
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
    this.highlightLayer?.clear();
    const combatUnits = Array.isArray(this.combatUnits) ? this.combatUnits : [];
    combatUnits.forEach((u) => {
      if (!u.alive) return;
      const roleTheme = this.getRoleTheme(u.classType);
      u.sprite?.setStrokeStyle?.(3, roleTheme.stroke, 1);
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
    unit.tag.x = unit.sprite.x - 46;
    unit.tag.y = unit.sprite.y - 48;
    unit.hpLabel.x = unit.sprite.x - 46;
    unit.hpLabel.y = unit.sprite.y - 18;
    unit.rageLabel.x = unit.sprite.x - 46;
    unit.rageLabel.y = unit.sprite.y + 20;
    unit.statusLabel.x = unit.sprite.x - 46;
    unit.statusLabel.y = unit.sprite.y + 34;
    unit.sprite.setDepth(unit.sprite.y + 10);
    unit.tag.setDepth(unit.sprite.y + 11);
    unit.hpLabel.setDepth(unit.sprite.y + 11);
    unit.rageLabel.setDepth(unit.sprite.y + 11);
    unit.statusLabel.setDepth(unit.sprite.y + 11);
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }

  showRoundResultBanner(text, isWin = true, holdMs = 1100, onDone = null) {
    const cx = this.layout.boardPanelX + this.layout.boardPanelW * 0.5;
    const cy = this.layout.boardPanelY + 54;
    const fill = isWin ? 0x21482a : 0x4b1f29;
    const edge = isWin ? 0x9df7b3 : 0xffb3bf;
    const fg = isWin ? "#d7ffe0" : "#ffe0e6";
    const width = Math.max(300, Math.min(520, this.layout.boardPanelW * 0.45));
    const bg = this.add.rectangle(cx, cy, width, 54, fill, 0.94);
    bg.setStrokeStyle(2, edge, 0.98);
    bg.setDepth(4600);
    const label = this.add.text(cx, cy, text, {
      fontFamily: UI_FONT,
      fontSize: "24px",
      color: fg,
      fontStyle: "bold"
    }).setOrigin(0.5);
    label.setDepth(4601);

    this.tweens.add({
      targets: [bg, label],
      alpha: 0,
      delay: holdMs,
      duration: 280,
      ease: "Cubic.easeIn",
      onComplete: () => {
        bg.destroy();
        label.destroy();
        onDone?.();
      }
    });
  }

  showFloatingText(x, y, text, color = "#ffffff") {
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

  showDamageNumber(x, y, amount, options = {}) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    if (value <= 0) return;
    const damageType = options.damageType ?? "physical";
    const isCrit = options.isCrit === true;
    const color = damageType === "magic" ? "#d9a6ff" : damageType === "true" ? "#f2f7ff" : "#ff9b9b";
    const stroke = damageType === "magic" ? "#34164b" : "#20101a";
    const fontSize = isCrit ? 24 : 17;
    const label = this.add.text(x, y, `-${value}${isCrit ? "!" : ""}`, {
      fontFamily: UI_FONT,
      fontSize: `${fontSize}px`,
      fontStyle: "bold",
      color,
      stroke,
      strokeThickness: isCrit ? 5 : 4
    }).setOrigin(0.5);
    label.setDepth(4050);
    if (isCrit) label.setScale(0.74);
    this.combatSprites.push(label);
    this.tweens.add({
      targets: label,
      y: y - (isCrit ? 42 : 32),
      alpha: 0,
      scale: isCrit ? 1.1 : 1.0,
      duration: isCrit ? 620 : 500,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy()
    });
  }

  resolveCombat(winnerSide) {
    if (this.phase !== PHASE.COMBAT) return;
    this.phase = PHASE.PLANNING;

    if (winnerSide === "LEFT") {
      this.player.winStreak += 1;
      this.player.loseStreak = 0;
      const bonus = 1 + (this.player.winStreak >= 3 ? 1 : 0);
      this.player.gold += bonus;
      this.addLog(`Thắng vòng ${this.player.round}. +${bonus} vàng.`);
    } else {
      const enemySurvivors = Math.max(1, this.getCombatUnits("RIGHT").length);
      this.player.loseStreak += 1;
      this.player.winStreak = 0;
      if (this.getLoseCondition() === "NO_HEARTS") {
        const damage = Math.max(1, Math.min(4, enemySurvivors));
        this.player.hp = Math.max(0, this.player.hp - damage);
        this.addLog(`Thua vòng ${this.player.round}. -${damage} tim (${this.player.hp} tim còn lại).`);
        this.clearCombatSprites();
        if (this.player.hp <= 0) {
          this.handleTotalDefeat();
          return;
        }
        this.player.round += 1;
        this.enterPlanning(true);
        this.showRoundResultBanner("THẤT BẠI", false);
        this.persistProgress();
        return;
      }
      this.addLog(`Thua vòng ${this.player.round}. Toàn đội đã bị hạ gục.`);
      this.clearCombatSprites();
      this.handleTotalDefeat();
      return;
    }

    this.player.round += 1;
    this.clearCombatSprites();
    this.enterPlanning(true);
  }

  gridToScreen(col, row) {
    const visualCol = this.toVisualCol(col);
    const { tileW, tileH } = this.getTileSize();
    const x = this.originX + this.boardPanX + (visualCol + row) * (tileW / 2);
    const y = this.originY + this.boardPanY + (row - visualCol) * (tileH / 2);
    return { x, y };
  }
}
