import Phaser from "phaser";
import { UNIT_CATALOG, UNIT_BY_ID } from "../data/unitCatalog.js";
import { SKILL_LIBRARY } from "../data/skills.js";
import { AUGMENT_LIBRARY, AUGMENT_ROUNDS } from "../data/augments.js";
import { CLASS_SYNERGY, TRIBE_SYNERGY, TRIBE_COUNTER, CLASS_COUNTER, COUNTER_BONUS } from "../data/synergies.js";
import { getForestBackgroundKeyByRound } from "../data/forestBackgrounds.js";
import { getClassLabelVi, getTribeLabelVi, getUnitVisual } from "../data/unitVisuals.js";
import { EQUIPMENT_ITEMS, ITEM_BY_ID, RECIPE_BY_ID, CRAFT_RECIPES } from "../data/items.js";
import { TooltipController } from "../core/tooltip.js";
import { AudioFx } from "../core/audioFx.js";
import { VfxController } from "../core/vfx.js";
import { clearProgress } from "../core/persistence.js";
import { LibraryModal } from "../ui/LibraryModal.js";
import { SynergySystem } from "../systems/SynergySystem.js";
import { CombatSystem } from "../systems/CombatSystem.js";
import { generateEnemyTeam, computeEnemyTeamSize, AI_SETTINGS, getAISettings, selectTarget as aiSelectTarget } from "../systems/AISystem.js";
import GameModeRegistry from "../gameModes/GameModeRegistry.js";
import {
  RESOLUTION_PRESETS,
  guiScaleToZoom,
  loadUiSettings,
  normalizeResolutionKey,
  resolveResolution,
  saveUiSettings
} from "../core/uiSettings.js";
import { getLoseConditionLabel, normalizeLoseCondition } from "../core/gameRules.js";
import {
  describeBasicAttack as _describeBasicAttack,
  describeSkillLines as _describeSkillLines,
  describeSkill as _describeSkill,
  buildSkillStarMilestoneLines as _buildSkillStarMilestoneLines,
  stripSkillStarNotes as _stripSkillStarNotes,
  inferBasicActionPattern as _inferBasicActionPattern,
  translateActionPattern as _translateActionPattern,
  getStarStatMultiplier as _getStarStatMultiplier,
  getStarSkillMultiplier as _getStarSkillMultiplier,
  translateDamageType as _translateDamageType,
  translateScaleStat as _translateScaleStat,
  getSkillTargetCountText as _getSkillTargetCountText,
  getSkillShapeText as _getSkillShapeText,
  getSkillDamageAndFormulaText as _getSkillDamageAndFormulaText,
  describeSkillArea as _describeSkillArea,
  translateSkillEffect as _translateSkillEffect,
  translateAugmentGroup as _translateAugmentGroup,
  getAugmentIcon as _getAugmentIcon,
  formatBonusSet as _formatBonusSet,
  describeSkillWithElement as _describeSkillWithElement
} from "../core/unitDescriptionHelper.js";
import { getElementLabel } from "../data/elementInfo.js";
import {
  getGrassTileStyle as _getGrassTileStyle,
  paintGrassTile as _paintGrassTile,
  paintRiverTile as _paintRiverTile,
  drawDiamond as _drawDiamond,
  getRoleTheme as _getRoleTheme
} from "../ui/BoardRenderer.js";
import { createSceneButton } from "../ui/SceneButton.js";
import { hydrateRunState } from "../core/runState.js";
import {
  clamp,
  createUnitUid,
  getBaseEvasion,
  getEffectiveEvasion,
  calculateHitChance,
  getDeployCapByLevel,
  getEffectiveSkillId,
  getGoldReserveScaling,
  getWaspMaxTargets,
  getXpToLevelUp,
  gridKey,
  manhattan,
  randomItem,
  rollTierForLevel,
  sampleWithoutReplacement,
  scaledBaseStats,
  starEffectChanceMultiplier,
  starTargetBonus,
  starAreaBonus,
  getStarTurns,
  getStarDotDamage
} from "../core/gameUtils.js";
import {
  UI_FONT, UI_SPACING, UI_COLORS, CLASS_COLORS,
  ROLE_THEME, LEVEL_LABEL, HISTORY_FILTERS
} from "../core/uiTheme.js";
import {
  PHASE, TILE_W, TILE_H, ROWS, COLS, PLAYER_COLS,
  RIGHT_COL_START, RIGHT_COL_END, BOARD_GAP_COLS,
  BOARD_FILES, RIVER_LAYER_DEPTH
} from "../core/boardConstants.js";

const COMBAT_SLOW_MULTIPLIER = 3;
const MAX_COMBAT_SPEED_MULTIPLIER = 9;

function getEquipmentNameKey(itemId) {
  const item = ITEM_BY_ID[itemId];
  if (!item || item.kind !== "equipment") return null;
  const byName = String(item.name ?? "").trim().toLowerCase();
  if (byName) return byName;
  return String(item.id ?? itemId).trim().toLowerCase();
}

function normalizeEquipIds(equips) {
  if (!Array.isArray(equips)) return [];
  const seen = new Set();
  const out = [];
  equips.forEach((itemId) => {
    const key = getEquipmentNameKey(itemId);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(itemId);
  });
  return out.slice(0, 3);
}

export class CombatScene extends Phaser.Scene {
  constructor() {
    super("CombatScene");
    this.phase = PHASE.PLANNING;
    this.aiMode = "MEDIUM";
    this.gameModeConfig = null;
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
    this.combatRound = 0;
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
    this.loseCondition = "NO_UNITS";
    this.combatLootDrops = [];
    this.boardZoom = 1;
    this.boardPanX = 0;
    this.boardPanY = 0;
    this.isBoardDragging = false;
    this.lastDragPoint = null;
    this.boardPointerDown = null;
    this.boardDragConsumed = false;

    if (this.libraryModal) {
      this.libraryModal.hide();
    }

    // Track active damage numbers for position offsetting
    this.activeDamageNumbers = [];

    // Combat speed multiplier based on unit count (Requirement 11.1, 11.2)
    this.combatSpeedMultiplier = COMBAT_SLOW_MULTIPLIER;
  }

  /**
   * Calculate combat speed multiplier based on player (LEFT) unit count
   * 
   * ≤10 units: 100% speed (multiplier 1.0)
   * 11-20 units: 150% speed (multiplier ~0.67)
   * 21-30 units: 200% speed (multiplier 0.5)
   * 31+ units: 250% speed (multiplier 0.4)
   * Max: 300% speed (multiplier ~0.33)
   * 
   * @returns {number} Duration multiplier (lower = faster)
   */
  calculateCombatSpeedMultiplier() {
    const leftTeam = this.getCombatUnits("LEFT");
    const unitCount = leftTeam.length;

    // Tiers: ≤10 = 100%, 11+ = 150%, 21+ = 200%, 31+ = 250%, cap 300%
    let speedPercent = 100;
    if (unitCount >= 11) speedPercent += 50;
    if (unitCount >= 21) speedPercent += 50;
    if (unitCount >= 31) speedPercent += 50;
    speedPercent = Math.min(speedPercent, 300);

    // Default combat speed is 1/3 of the previous default (multiplier = 3.0 instead of 1.0)
    const baseMultiplier = 3.0;

    // Convert speed% to duration multiplier: higher speed = shorter duration
    return baseMultiplier / (speedPercent / 100);
  }

  scaleCombatDuration(ms) {
    const value = Number(ms);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.max(1, Math.round(value * this.combatSpeedMultiplier));
  }

  resetTransientSceneState() {
    this.phase = PHASE.PLANNING;
    this.aiMode = "MEDIUM";
    this.gameModeConfig = null;
    this.tileLookup = new Map();
    this.playerCellZones = [];
    this.buttons = {};
    this.benchSlots = [];
    this.shopCards = [];
    this.planningSprites = [];
    this.combatSprites = [];
    this.overlaySprites = [];
    if (Array.isArray(this.decorationSprites)) {
      this.decorationSprites.forEach(s => s?.destroy?.());
    }
    this.decorationSprites = [];
    this.logs = [];
    this.selectedBenchIndex = null;
    this.turnQueue = [];
    this.turnIndex = 0;
    this.combatRound = 0;
    this.actionCount = 0;
    this.globalDamageMult = 1;
    this.isActing = false;
    this.runStatePayload = null;
    this.layout = null;
    this.settingsVisible = false;
    this.settingsOverlay = [];
    this.modalButtons = {};
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
    this.loseCondition = "NO_UNITS";
    this.combatLootDrops = [];
    this.boardZoom = 1;
    this.boardPanX = 0;
    this.boardPanY = 0;
    this.isBoardDragging = false;
    this.lastDragPoint = null;
    this.boardPointerDown = null;
    this.boardDragConsumed = false;
    this.activeDamageNumbers = [];
    if (this.combatTickEvent) {
      this.combatTickEvent.remove(false);
      this.combatTickEvent = null;
    }
  }

  init(data) {
    this.resetTransientSceneState();
    this.runStatePayload = data?.runState ?? null;
  }

  create() {
    this.cameras.main.setBackgroundColor("#10141b");
    this.input.keyboard?.removeAllListeners();
    this.input.removeAllListeners();

    // Get game mode configuration
    const gameMode = this.runStatePayload?.player?.gameMode ?? "EndlessPvEClassic";
    this.gameModeConfig = GameModeRegistry.get(gameMode);
    if (!this.gameModeConfig) {
      console.warn(`Game mode "${gameMode}" not found, falling back to EndlessPvEClassic`);
      this.gameModeConfig = GameModeRegistry.get("EndlessPvEClassic");
    }

    const uiSettings = loadUiSettings();
    this.applyDisplaySettings(uiSettings);
    this.layout = this.computeLayout();
    this.tooltip = new TooltipController(this);
    this.audioFx = new AudioFx(this);
    this.audioFx.setVolumeLevel(uiSettings.volumeLevel ?? 10);
    this.vfx = new VfxController(this);
    this.drawBoard();
    this.createHud();
    this.createHistoryModal();
    this.createSettingsOverlay();
    this.libraryModal = new LibraryModal(this, {
      title: "Thư Viện Linh Thú",
      onClose: () => {
        this.clearAttackPreview();
      }
    });
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
    this.buttons.wiki = this.createButton(
      this.layout.rightPanelX + this.layout.sidePanelW - 240,
      this.layout.topPanelY + 8,
      104,
      34,
      "Thư Viện",
      () => {
        this.toggleSettingsOverlay(false);
        this.toggleHistoryModal(false);
        this.libraryModal.toggle();
      },
      { variant: "ghost" }
    );
    this.setupInput();

    this.combatTickEvent = this.time.addEvent({
      delay: this.scaleCombatDuration(420),
      loop: true,
      callback: () => {
        if (!this.settingsVisible && this.phase === PHASE.COMBAT) this.stepCombat();
      }
    });

    this.startFromPayload();
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

  setupInput() {
    this.input.keyboard.on("keydown-SPACE", () => {
      if (!this.settingsVisible && this.phase === PHASE.COMBAT) this.stepCombat();
    });
    this.input.keyboard.on("keydown-ESC", () => {
      if (this.libraryModal?.isOpen()) {
        this.libraryModal.hide();
        return;
      }
      if (this.historyModalVisible) {
        this.toggleHistoryModal(false);
        return;
      }
      this.toggleSettingsOverlay();
    });

    this.input.on("wheel", (pointer, _gos, _dx, dy) => {
      if (this.historyModalVisible) {
        this.onHistoryWheel(dy);
        return;
      }
      if (this.libraryModal?.isOpen()) {
        this.libraryModal.scrollBy(dy);
        return;
      }
      if (this.settingsVisible) return;
      if (!this.pointInBoardPanel(pointer.x, pointer.y)) return;
      const before = this.boardZoom;
      this.boardZoom = clamp(this.boardZoom - dy * 0.0012, 0.65, 1.85);
      if (Math.abs(before - this.boardZoom) < 0.0001) return;
      this.refreshBoardGeometry();
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.settingsVisible || this.historyModalVisible || this.libraryModal?.isOpen()) return;
      if (!this.pointInBoardPanel(pointer.x, pointer.y)) return;
      if (this.isPanPointer(pointer)) {
        this.boardPointerDown = { x: pointer.x, y: pointer.y };
        this.boardDragConsumed = false;
        this.isBoardDragging = true;
        this.lastDragPoint = { x: pointer.x, y: pointer.y };
        return;
      }
      this.boardPointerDown = { x: pointer.x, y: pointer.y };
      this.boardDragConsumed = false;
      this.lastDragPoint = { x: pointer.x, y: pointer.y };
    });

    this.input.on("pointermove", (pointer) => {
      if (this.settingsVisible || this.historyModalVisible || this.libraryModal?.isOpen()) return;

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

    const releaseDrag = () => {
      this.isBoardDragging = false;
      this.lastDragPoint = null;
      this.boardPointerDown = null;
      if (this.boardDragConsumed) {
        this.time.delayedCall(0, () => {
          this.boardDragConsumed = false;
        });
      } else {
        this.boardDragConsumed = false;
      }
    };
    this.input.on("pointerup", releaseDrag);
    this.input.on("pointerupoutside", releaseDrag);
  }

  getTileSize() {
    return {
      tileW: TILE_W * this.boardZoom,
      tileH: TILE_H * this.boardZoom
    };
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

  refreshBoardGeometry() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const data = this.tileLookup.get(gridKey(row, col));
        if (!data) continue;
        const center = this.gridToScreen(col, row);
        data.center = center;
        data.tile.clear();
        this.paintGrassTile(data.tile, center.x, center.y, row, col);
      }
    }
    this.refreshBoardEdgeLabels();

    const { tileW, tileH } = this.getTileSize();
    this.playerCellZones.forEach((entry) => {
      const zone = entry?.zone ?? entry;
      const row = Number.isInteger(entry?.row) ? entry.row : null;
      const col = Number.isInteger(entry?.col) ? entry.col : null;
      if (!zone || row == null || col == null) return;
      const tile = this.tileLookup.get(gridKey(row, col));
      if (!tile) return;
      zone.setPosition(tile.center.x, tile.center.y);
      zone.setSize(tileW - 10, tileH - 10);
    });

    this.gapMarkers.forEach((token, row) => {
      const a = this.gridToScreen(4, row);
      const b = this.gridToScreen(5, row);
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      token.clear();
      this.paintRiverTile(token, mx, my - 2, row);
      token.setDepth(RIVER_LAYER_DEPTH);
    });

    if (this.phase === PHASE.PLANNING || this.phase === PHASE.AUGMENT) {
      this.refreshBoardUi();
    } else if (this.phase === PHASE.COMBAT && Array.isArray(this.combatUnits)) {
      this.combatUnits.forEach((unit) => {
        if (!unit?.sprite?.active) return;
        const point = this.gridToScreen(unit.col, unit.row);
        unit.sprite.setPosition(point.x, point.y - 10);
        this.syncCombatLabels(unit);
        this.updateCombatUnitUi(unit);
      });
      this.clearHighlights();
    }

    if (this.previewHoverUnit) {
      this.showAttackPreviewForUnit(this.previewHoverUnit);
    }
  }

  startFromPayload() {
    const hydrated = hydrateRunState(this.runStatePayload);
    if (!hydrated?.player?.board) {
      this.scene.start("PlanningScene");
      return;
    }
    this.runStatePayload = hydrated;

    // Use game mode config for AI difficulty, fallback to saved aiMode or MEDIUM
    if (this.gameModeConfig?.aiDifficulty) {
      this.aiMode = this.gameModeConfig.aiDifficulty;
    } else {
      this.aiMode = hydrated.aiMode ?? "MEDIUM";
    }

    this.audioFx.setEnabled(hydrated.audioEnabled !== false);
    this.audioFx.startBgm("bgm_combat", 0.2);
    this.player = hydrated.player;

    // Use game mode config for lose condition, fallback to player's loseCondition
    if (this.gameModeConfig?.loseCondition) {
      this.loseCondition = normalizeLoseCondition(this.gameModeConfig.loseCondition);
    } else {
      this.loseCondition = normalizeLoseCondition(this.player?.loseCondition);
    }

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

    const panel = this.add.rectangle(cx, cy, 520, 460, 0x102035, 0.98);
    panel.setStrokeStyle(1, UI_COLORS.panelEdge, 0.9);
    panel.setDepth(5001);
    panel.setVisible(false);
    this.settingsOverlay.push(panel);

    const title = this.add.text(cx, cy - 156, "Cài đặt giao tranh", {
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
    this.modalButtons.audio = makeModalBtn(0, -98, 230, 44, "Âm thanh: Bật", () => this.toggleAudio());
    this.modalButtons.volumeDown = makeModalBtn(-84, -46, 70, 44, "-", () => this.changeVolumeLevel(-1));
    this.modalButtons.volume = makeModalBtn(0, -46, 146, 44, "Âm lượng: 10/10", () => { });
    this.modalButtons.volumeUp = makeModalBtn(84, -46, 70, 44, "+", () => this.changeVolumeLevel(1));
    this.modalButtons.resolution = makeModalBtn(0, 6, 230, 44, "Độ phân giải: 1600x900", () => this.changeResolution());
    this.modalButtons.exit = makeModalBtn(0, 110, 230, 44, "Thoát về chuẩn bị", () => this.exitToPlanning());
    this.modalButtons.menu = makeModalBtn(-126, 172, 220, 44, "Trang chủ", () => this.scene.start("MainMenuScene"), "secondary");
    this.modalButtons.close = makeModalBtn(126, 172, 220, 44, "Đóng", () => this.toggleSettingsOverlay(false));
  }

  toggleSettingsOverlay(force = null) {
    const next = typeof force === "boolean" ? force : !this.settingsVisible;
    if (next) this.toggleHistoryModal(false);
    this.settingsVisible = next;
    this.modalButtons?.audio?.setLabel(`Âm thanh: ${this.audioFx.enabled ? "Bật" : "Tắt"}`);
    this.modalButtons?.volume?.setLabel(`Âm lượng: ${this.audioFx.getVolumeLevel()}/10`);
    if (this.modalButtons?.resolution) {
      const resolution = resolveResolution(loadUiSettings().resolutionKey);
      const label = resolution?.label ?? `${resolution.width}x${resolution.height}`;
      this.modalButtons.resolution.setLabel(`Độ phân giải: ${label}`);
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

  toggleAudio() {
    this.audioFx.setEnabled(!this.audioFx.enabled);
    this.runStatePayload.audioEnabled = this.audioFx.enabled;
    const currentSettings = loadUiSettings();
    saveUiSettings({
      ...currentSettings,
      aiMode: this.runStatePayload.aiMode ?? "MEDIUM",
      audioEnabled: this.audioFx.enabled,
      loseCondition: this.loseCondition,
      volumeLevel: this.audioFx.getVolumeLevel()
    });
    this.modalButtons?.audio?.setLabel(`Âm thanh: ${this.audioFx.enabled ? "Bật" : "Tắt"}`);
    this.modalButtons?.volume?.setLabel(`Âm lượng: ${this.audioFx.getVolumeLevel()}/10`);
  }

  changeVolumeLevel(step = 1) {
    const current = this.audioFx.getVolumeLevel();
    const next = Math.min(10, Math.max(1, current + step));
    if (next === current) return;
    this.audioFx.setVolumeLevel(next);
    const currentSettings = loadUiSettings();
    saveUiSettings({
      ...currentSettings,
      aiMode: this.runStatePayload?.aiMode ?? "MEDIUM",
      audioEnabled: this.audioFx.enabled,
      loseCondition: this.loseCondition,
      volumeLevel: next
    });
    this.modalButtons?.volume?.setLabel(`Âm lượng: ${next}/10`);
  }

  changeResolution() {
    const currentSettings = loadUiSettings();
    const currentKey = normalizeResolutionKey(currentSettings.resolutionKey);
    const idx = RESOLUTION_PRESETS.findIndex((preset) => preset.key === currentKey);
    const next = RESOLUTION_PRESETS[(idx + 1) % RESOLUTION_PRESETS.length];
    saveUiSettings({ ...currentSettings, resolutionKey: next.key });
    this.modalButtons?.resolution?.setLabel(`Độ phân giải: ${next.label ?? `${next.width}x${next.height}`}`);
    this.scene.start("CombatScene", { runState: this.runStatePayload });
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
    clearProgress();
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
      hp: 1,
      gold: 10,
      xp: 0,
      level: 1,
      round: 1,
      gameMode: "EndlessPvEClassic",
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

  createOwnedUnit(baseId, star = 1, equips = []) {
    const base = UNIT_BY_ID[baseId];
    return {
      uid: createUnitUid(),
      baseId,
      star,
      base,
      equips: normalizeEquipIds(equips)
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
    // Combat scene: board panel stretches to the bottom for better battlefield focus.
    const boardPanelH = Math.max(250, h - margin - boardPanelY);

    const boardNudgeX = -44;
    const boardNudgeY = -64;

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
      boardOriginX: boardPanelX + Math.floor(contentW * 0.28) + boardNudgeX,
      boardOriginY: boardPanelY + Math.floor(boardPanelH * 0.78) + boardNudgeY,
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
    const rank = row;
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

    // Decorative elements around the board
    const random = new Phaser.Math.RandomDataGenerator([456]);
    const decoOptions = ["🌲", "🌳", "🪨", "��", "🌿", "🌺", "🌾"];
    const bpX = this.layout.boardPanelX;
    const bpY = this.layout.boardPanelY;
    const bpW = this.layout.boardPanelW;
    const bpH = this.layout.boardPanelH;
    const margin = 60;
    for (let i = 0; i < 24; i++) {
      const side = random.between(0, 3);
      let x, y;
      if (side === 0) {
        x = random.between(bpX - margin, bpX + bpW + margin);
        y = random.between(bpY - margin - 30, bpY - 8);
      } else if (side === 1) {
        x = random.between(bpX - margin, bpX + bpW + margin);
        y = random.between(bpY + bpH + 8, bpY + bpH + margin + 30);
      } else if (side === 2) {
        x = random.between(bpX - margin - 30, bpX - 8);
        y = random.between(bpY - margin, bpY + bpH + margin);
      } else {
        x = random.between(bpX + bpW + 8, bpX + bpW + margin + 30);
        y = random.between(bpY - margin, bpY + bpH + margin);
      }
      x = Math.max(4, Math.min(this.scale.width - 30, x));
      y = Math.max(4, Math.min(this.scale.height - 30, y));
      const text = this.add.text(x, y, random.pick(decoOptions), {
        fontSize: random.pick(["18px", "22px", "26px"]),
        color: "#ffffff"
      });
      text.setAlpha(0.35 + random.realInRange(0, 0.35));
      text.setDepth(1);
      this.decorationSprites.push(text);
    }

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const center = this.gridToScreen(col, row);
        const tile = this.add.graphics();
        this.paintGrassTile(tile, center.x, center.y, row, col);
        // Per-tile coordinate label removed for cleaner UX
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
    this.turnIndicatorLayer = this.add.graphics();
    this.turnIndicatorLayer.setDepth(998);
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
      add(String(row), 0, row, "left");
    }
    for (let col = RIGHT_COL_START; col <= RIGHT_COL_END; col += 1) {
      add(BOARD_FILES[this.toVisualCol(col)] ?? "?", col, 0, "top");
    }
    for (let row = 0; row < ROWS; row += 1) {
      add(String(row), RIGHT_COL_END, row, "right");
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
      entry.label.setDepth(2101);
    });
  }

  getGrassTileStyle(row, col) { return _getGrassTileStyle(row, col); }

  paintGrassTile(graphics, x, y, row, col) {
    const { tileW, tileH } = this.getTileSize();
    _paintGrassTile(graphics, x, y, row, col, tileW, tileH);
  }

  paintRiverTile(graphics, x, y, row) {
    const { tileW, tileH } = this.getTileSize();
    _paintRiverTile(graphics, x, y, row, tileW, tileH);
  }

  drawDiamond(graphics, x, y, fill = true) {
    const { tileW, tileH } = this.getTileSize();
    _drawDiamond(graphics, x, y, tileW, tileH, fill);
  }

  getRoleTheme(classType) { return _getRoleTheme(classType); }

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
      "Luật quét: Ta (E→A, mỗi cột 5→1) | Địch (G→K, mỗi cột 5→1)",
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

    // Round counter — góc trái, ngang với synergy panel
    this.combatRoundLabel = this.add.text(l.boardPanelX + UI_SPACING.SM, l.sidePanelY + UI_SPACING.SM, "LƯỢT 1", {
      fontFamily: UI_FONT,
      fontSize: "28px",
      fontStyle: "bold",
      color: "#ffd97b",
      stroke: "#1a1a2e",
      strokeThickness: 4
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

    this.synergyTitleText = this.add.text(rightX, y, "◎ CỘNG HƯỞNG", {
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
    this.controlsText = this.add.text(40, 640, "[SPACE] combat step/start | [R] new run", {
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
    const { tileW, tileH } = this.getTileSize();
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const tile = this.tileLookup.get(gridKey(row, col));
        const zone = this.add.zone(tile.center.x, tile.center.y, tileW - 10, tileH - 10);
        zone.setInteractive(new Phaser.Geom.Rectangle(0, 0, tileW - 10, tileH - 10), Phaser.Geom.Rectangle.Contains);
        zone.input.dropZone = true;
        zone.on("pointerdown", () => this.onPlayerCellClick(row, col));
        zone.setDepth(1500);
        this.playerCellZones.push({ row, col, zone });
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
    if (this.libraryModal?.isOpen()) return;

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
    if (this.libraryModal?.isOpen()) return;
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
      this.addLog("Không đủ vàng để đổi tướng.");
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
      this.addLog("Không đủ vàng để mua XP.");
      return;
    }
    this.player.gold -= cost;
    this.gainXp(4);
    this.refreshPlanningUi();
  }

  gainXp(value) {
    let amount = value;
    while (amount > 0 && this.player.level < 25) {
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
    if (this.libraryModal?.isOpen()) return;
    const offer = this.player.shop[index];
    if (!offer) return;
    const base = UNIT_BY_ID[offer.baseId];
    const cost = base.tier;
    if (this.player.gold < cost) {
      this.addLog("Không đủ vàng để mua linh thú.");
      return;
    }
    if (this.player.bench.length >= this.getBenchCap()) {
      this.addLog("Hàng chờ dự bị đã đầy.");
      return;
    }
    this.player.gold -= cost;
    this.player.bench.push(this.createOwnedUnit(base.id, 1));
    this.player.shop[index] = null;
    this.tryAutoMerge();
    this.refreshPlanningUi();
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
    const baseName = String(unit?.base?.name ?? unit?.baseId ?? "Beast").trim();
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
        this.removeOwnedUnitRefs(picked);
        const upgraded = this.createOwnedUnit(baseId, Math.min(3, star + 1));
        this.placeMergedUnit(upgraded, picked[0]);
        this.addLog(`Merge: ${this.getMergeSpeciesLabel(picked[0].unit)} -> ${upgraded.star}*`);
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
    const goldBonus = Math.floor(this.player.gold / 5);
    const gain = base + interest + streak + goldBonus;
    this.player.gold += gain;
    this.addLog(`Vòng ${this.player.round}: +${gain} vàng (cơ bản ${base} + lãi ${interest} + chuỗi ${streak} + tích vàng ${goldBonus}).`);
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

    const title = this.add.text(this.scale.width / 2 - 170, 180, "Chọn 1 Pháp Ấn Rừng", {
      fontFamily: "Trebuchet MS",
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
      const card = this.add.rectangle(x, y, 320, 260, 0x1f2b3d, 0.98);
      card.setStrokeStyle(3, 0x8cc8ff, 1);
      card.setDepth(3001);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => this.chooseAugment(choice));
      card.on("pointerover", () => card.setFillStyle(0x2b3d57, 0.98));
      card.on("pointerout", () => card.setFillStyle(0x1f2b3d, 0.98));

      const text = this.add.text(x - 146, y - 106, `${icon} ${choice.name}\n\n[${this.translateAugmentGroup(choice.group)}]\n${choice.description}`, {
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
    if (this.libraryModal?.isOpen()) return;
    this.applyAugment(augment);
    this.player.augments.push(augment.id);
    this.player.augmentRoundsTaken.push(this.player.round);
    this.addLog(`Đã chọn pháp ấn: ${augment.name}`);
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
  /**
   * Begins combat phase
   * 
   * ARCHITECTURE NOTE (Task 5.2.1):
   * Combat logic has been delegated to CombatSystem. This method now only handles:
   * - Scene state management (phase transitions, clearing UI)
   * - Unit spawning and visual setup
   * - Combat initialization via CombatSystem.initializeCombat()
   * - UI updates (header, synergy preview, queue preview)
   * 
   * Combat logic (turn order, action execution, damage calculation) is in CombatSystem.
   * 
   * @see CombatSystem.initializeCombat() - Initializes combat state and turn order
   * @see stepCombat() - Executes combat turns using CombatSystem
   */
  beginCombat() {
    if (this.phase !== PHASE.PLANNING) return;
    if (this.getDeployCount() <= 0) {
      this.addLog("Can deploy it nhat 1 tuong.");
      return;
    }

    // Scene state management - CombatScene responsibility
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
    this.combatLootDrops = [];
    this.highlightLayer.clear();

    // Unit spawning and visual setup - CombatScene responsibility
    this.spawnPlayerCombatUnits();
    this.spawnEnemyCombatUnits();

    // Calculate combat speed multiplier based on unit count (Requirement 11.1, 11.2, 11.3)
    this.combatSpeedMultiplier = this.calculateCombatSpeedMultiplier();

    // Apply synergy bonuses using SynergySystem
    const leftTeam = this.getCombatUnits("LEFT");
    const rightTeam = this.getCombatUnits("RIGHT");

    const leftOptions = {
      extraClassCount: this.player.extraClassCount || 0,
      extraTribeCount: this.player.extraTribeCount || 0
    };
    SynergySystem.applySynergyBonusesToTeam(leftTeam, "LEFT", leftOptions);
    leftTeam.forEach((unit) => this.updateCombatUnitUi(unit));

    SynergySystem.applySynergyBonusesToTeam(rightTeam, "RIGHT", {});
    rightTeam.forEach((unit) => this.updateCombatUnitUi(unit));

    // COMBAT LOGIC DELEGATION: Use CombatSystem to initialize combat state
    // CombatSystem handles: turn order calculation, combat state management
    // Requirements: 8.1, 8.3, 8.4, 8.6
    const playerUnits = this.combatUnits.filter(u => u.side === "LEFT");
    const enemyUnits = this.combatUnits.filter(u => u.side === "RIGHT");
    this.combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits);

    // Use position-based turn order (E5→E1, D→A | G5→G1, H→K)
    this.buildTurnQueue();

    // UI updates - CombatScene responsibility
    this.combatRound = this.turnQueue.length ? 1 : 0;
    this.updateRoundLabel();
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

    // Use AISystem to generate enemy team (Requirements 8.1, 8.6)
    const sandbox = this.player?.gameMode === "PVE_SANDBOX";
    const budget = Math.round((8 + this.player.round * (sandbox ? 2.1 : 2.6)));
    const enemyUnits = generateEnemyTeam(this.player.round, budget, this.aiMode, sandbox);

    // Create combat units from generated enemy team
    enemyUnits.forEach((ref) => {
      const base = UNIT_BY_ID[ref.baseId];
      if (!base) return;
      const owned = this.createOwnedUnit(base.id, ref.star ?? 1);

      // Apply equipment for HARD difficulty
      const ai = getAISettings(this.aiMode);
      if (ai.difficulty === "HARD" && EQUIPMENT_ITEMS.length > 0) {
        const equipChance = clamp(0.15 + (this.player.round - 5) * 0.04, 0, 0.65);
        if (Math.random() < equipChance) {
          const eq = randomItem(EQUIPMENT_ITEMS);
          owned.equips = eq?.id ? [eq.id] : [];
        }
      }

      const unit = this.createCombatUnit(owned, "RIGHT", ref.row, ref.col);
      if (unit) this.combatUnits.push(unit);
    });
  }

  createCombatUnit(owned, side, row, col) {
    const base = owned?.base ?? UNIT_BY_ID[owned?.baseId];
    if (!owned || !base) return null;
    const star = Math.max(1, owned.star ?? 1);
    const baseStats = scaledBaseStats(base.stats, star, base.classType);
    const ai = getAISettings(this.aiMode);
    let hpBase = side === "RIGHT" ? Math.round(baseStats.hp * ai.hpMult) : baseStats.hp;
    let atkBase = side === "RIGHT" ? Math.round(baseStats.atk * ai.atkMult) : baseStats.atk;
    let matkBase = side === "RIGHT" ? Math.round(baseStats.matk * ai.matkMult) : baseStats.matk;

    // Apply game mode config enemy scaling for AI units
    if (side === "RIGHT" && this.gameModeConfig?.enemyScaling) {
      const scaleFactor = this.gameModeConfig.enemyScaling(this.player.round);
      if (typeof scaleFactor === 'number' && scaleFactor > 0) {
        hpBase = Math.round(hpBase * scaleFactor);
        atkBase = Math.round(atkBase * scaleFactor);
        matkBase = Math.round(matkBase * scaleFactor);
      }
    } else {
      // Fallback to legacy scaling for backward compatibility
      // Apply Endless mode scaling for AI units when round > 30
      if (side === "RIGHT" && this.player.gameMode === "EndlessPvEClassic" && this.player.round > 30) {
        const scaleFactor = 1 + (this.player.round - 30) * 0.05;
        hpBase = Math.round(hpBase * scaleFactor);
        atkBase = Math.round(atkBase * scaleFactor);
        matkBase = Math.round(matkBase * scaleFactor);
      }

      // Apply Easy mode difficulty scaling for AI units when round > 30
      if (side === "RIGHT" && ai.difficulty === "EASY" && this.player.round > 30) {
        const scaleFactor = 1 + (this.player.round - 30) * 0.05;
        hpBase = Math.round(hpBase * scaleFactor);
        atkBase = Math.round(atkBase * scaleFactor);
        matkBase = Math.round(matkBase * scaleFactor);
      }
    }

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

    const shortName = visual.nameVi.length > 8 ? `${visual.nameVi.slice(0, 8)}…` : visual.nameVi;
    const tagBg = this.add.rectangle(point.x, point.y - 47, 64, 13, 0x05070c, 0.76);
    tagBg.setStrokeStyle(1, 0x2c3f54, 0.8);
    tagBg.setDepth(point.y + 11);
    const tag = this.add.text(point.x, point.y - 47, shortName, {
      fontFamily: UI_FONT,
      fontSize: "9px",
      color: "#e7f3ff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    tag.setDepth(point.y + 11);
    const starLabel = this.add.text(point.x + 20, point.y - 31, `${owned.star}★`, {
      fontFamily: UI_FONT,
      fontSize: "9px",
      color: "#fff8d7",
      fontStyle: "bold"
    });
    starLabel.setDepth(point.y + 13);

    const barW = 56;
    const hpBarBg = this.add.rectangle(point.x, point.y + 11, barW, 5, 0x0a1320, 0.92);
    hpBarBg.setStrokeStyle(1, 0x30475f, 0.86);
    hpBarBg.setDepth(point.y + 11);
    const hpBarFill = this.add.rectangle(point.x - barW / 2 + 1, point.y + 11, barW - 2, 3, 0x79df7b, 0.98).setOrigin(0, 0.5);
    hpBarFill.setDepth(point.y + 12);
    const shieldBar = this.add.rectangle(point.x - barW / 2 + 1, point.y + 11, 0, 3, 0x9dffba, 0.94).setOrigin(0, 0.5);
    shieldBar.setDepth(point.y + 13);

    const rageBarBg = this.add.rectangle(point.x, point.y + 18, barW, 5, 0x0b1b32, 0.94);
    rageBarBg.setStrokeStyle(2, 0x5fb8ff, 0.95);
    rageBarBg.setDepth(point.y + 11);
    const rageBarFill = this.add.rectangle(point.x - barW / 2 + 1, point.y + 18, 0, 3, 0xf3d66b, 0.98).setOrigin(0, 0.5);
    rageBarFill.setDepth(point.y + 12);
    const rageGrid = this.add.graphics();
    rageGrid.setDepth(point.y + 13);

    const buffBar = this.add.graphics(); // Green bar for positive effects
    buffBar.setDepth(point.y + 12);
    const debuffBar = this.add.graphics(); // Purple bar for negative effects
    debuffBar.setDepth(point.y + 12);

    const statusLabel = this.add.text(point.x, point.y + 36, "", {
      fontFamily: UI_FONT,
      fontSize: "8px",
      color: "#ffe9aa"
    }).setOrigin(0.5, 0);
    statusLabel.setDepth(point.y + 11);

    this.combatSprites.push(
      sprite,
      icon,
      tagBg,
      tag,
      starLabel,
      hpBarBg,
      hpBarFill,
      shieldBar,
      rageBarBg,
      rageBarFill,
      rageGrid,
      buffBar,
      debuffBar,
      statusLabel
    );

    const unit = {
      uid: owned.uid,
      baseId: owned.baseId,
      name: visual.nameVi,
      star,
      tier: base.tier ?? 1,
      side,
      row,
      col,
      homeRow: row,
      homeCol: col,
      classType: base.classType,
      tribe: base.tribe,
      species: base.species,
      skillId: getEffectiveSkillId(base.skillId, base.classType, star, SKILL_LIBRARY),
      equips: Array.isArray(owned.equips) ? [...owned.equips] : [],
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
      tagBg,
      tag,
      starLabel,
      hpBarBg,
      hpBarFill,
      shieldBar,
      rageBarBg,
      rageBarFill,
      rageGrid,
      buffBar,
      debuffBar,
      statusLabel,
      mods: {
        atkPct: 0,
        matkPct: 0,
        healPct: 0,
        lifestealPct: side === "LEFT" ? this.player.lifestealPct : 0,
        critPct: 0.05,
        evadePct: baseStats.evasion ?? 0,
        burnOnHit: 0,
        poisonOnHit: 0,
        shieldStart: 0,
        startingRage: 0,
        basicAttackType: "physical",
        basicAttackScaleStat: "atk"
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
        disarmTurns: 0,
        immuneTurns: 0,
        physReflectTurns: 0,
        counterTurns: 0,
        isProtecting: 0,
        bleedTurns: 0,
        bleedDamage: 0,
        diseaseTurns: 0,
        diseaseDamage: 0,
        atkDebuffTurns: 0,
        atkDebuffValue: 0,
        atkBuffTurns: 0,
        atkBuffValue: 0,
        defBuffTurns: 0,
        defBuffValue: 0,
        mdefBuffTurns: 0,
        mdefBuffValue: 0,
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    this.applyOwnedEquipmentBonuses(unit, owned);
    sprite.on("pointerover", (pointer) => {
      this.tooltip.showCombatUnitTooltip(pointer, this.getCombatUnitTooltip(unit), unit);
      this.showAttackPreviewForUnit(unit);
    });
    sprite.on("pointermove", (pointer) => {
      this.tooltip.move(pointer);
    });
    sprite.on("pointerout", () => {
      this.tooltip.hide();
      this.clearAttackPreview(unit);
    });
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
    this.combatLootDrops = [];
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
    const impactKeySet = new Set(impact.cells.map((cell) => gridKey(cell.row, cell.col)));
    const rangeCells = this.calculateAttackRange(unit);
    const mergedCells = this.dedupePreviewCells([...rangeCells, ...impact.cells]);
    mergedCells.forEach((cell) => {
      const tile = this.tileLookup.get(gridKey(cell.row, cell.col));
      if (!tile) return;
      const isPrimary = cell.row === impact.primary.row && cell.col === impact.primary.col;
      const isImpactCell = impactKeySet.has(gridKey(cell.row, cell.col));
      const fillAlpha = isPrimary ? 0.42 : isImpactCell ? 0.3 : 0.18;
      const lineAlpha = isPrimary ? 1 : 0.82;
      this.attackPreviewLayer?.fillStyle(0xffaa00, fillAlpha);
      this.attackPreviewLayer?.lineStyle(isPrimary ? 3 : 2, 0xffaa00, lineAlpha);
      this.drawDiamond(this.attackPreviewLayer, tile.center.x, tile.center.y);
    });
    this.drawAttackPreviewSword(impact.primary.row, impact.primary.col, unit);
  }

  calculateAttackRange(unit) {
    if (!unit?.alive) return [];
    const cells = [];
    const forward = unit.side === "LEFT" ? 1 : -1;
    const maxRange = Math.max(1, Math.floor(Number(unit.range) || 1));
    for (let dist = 1; dist <= maxRange; dist += 1) {
      const col = unit.col + forward * dist;
      if (col < 0 || col >= COLS) break;
      cells.push({ row: unit.row, col });
    }
    return this.dedupePreviewCells(cells);
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
    const primary = { row: target.row, col: target.col };
    const skillCells = this.collectSkillPreviewCells(attacker, target, skill, allies, enemies);
    const impactCells = this.dedupePreviewCells([primary, ...skillCells]);
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

      case "global_stun":
      case "global_debuff_atk":
      case "global_fire":
      case "global_slow":
      case "global_knockback":
      case "global_poison_team":
        pushUnits(enemies);
        break;
      case "global_tide_evade":
        pushUnits(allies);
        break;
      case "single_burst_armor_pen":
      case "single_poison_slow":
      case "single_poison_stack":
      case "single_bleed":
      case "knockback_charge":
      case "single_strong_poison":
      case "execute_heal":
      case "assassin_execute_rage_refund":
      case "double_hit_gold_reward":
      case "lifesteal_disease_maxhp":
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
      case "team_def_buff":
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
      case "turtle_protection":
      case "rhino_counter":
      case "pangolin_reflect":
      case "self_armor_reflect":
      case "self_shield_immune":
      case "self_maxhp_boost":
      case "self_def_fortify":
      case "resilient_shield":
        pushCell(attacker.row, attacker.col);
        break;
      case "guardian_pact": {
        pushCell(attacker.row, attacker.col);
        const weakestAlly = allies
          .filter(a => a.alive && a.uid !== attacker.uid)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (weakestAlly) pushCell(weakestAlly.row, weakestAlly.col);
        break;
      }
      case "frost_aura_buff":
      case "roar_debuff_heal": {
        pushCell(attacker.row, attacker.col);
        const nearbyTargets = (skill.effect === "frost_aura_buff" ? allies : enemies)
          .filter(a => a.alive && a.uid !== attacker.uid)
          .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
          .slice(0, skill.maxTargets || 2);
        nearbyTargets.forEach(u => pushCell(u.row, u.col));
        break;
      }
      case "team_rage_self_heal":
      case "warcry_atk_def":
      case "team_evade_buff":
      case "team_shield":
        pushUnits(allies);
        break;
      case "single_silence_lock":
        pushCell(target.row, target.col);
        break;
      case "self_regen_team_heal": {
        pushCell(attacker.row, attacker.col);
        allies.filter(a => a.alive && a.uid !== attacker.uid)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
          .slice(0, 2)
          .forEach(a => pushCell(a.row, a.col));
        break;
      }
      case "metamorphosis":
        pushCell(attacker.row, attacker.col);
        if ((attacker.star ?? 1) >= 2) pushUnits(allies);
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
        const baseMaxHits = getWaspMaxTargets(attacker, skill) ?? skill.maxHits ?? 3;
        const maxHits = skill.id === "wasp_triple_strike" ? baseMaxHits : baseMaxHits + starTargetBonus(attacker.star ?? 1);
        const count = Math.min(maxHits, pool.length);
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
      case "column_bleed":
        pushUnits(enemies.filter((enemy) => enemy.col === target.col));
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
    const modeLabel = this.player.gameMode === "PVE_SANDBOX" ? "Sandbox" : "Vô tận";
    const loseLabel = getLoseConditionLabel(this.loseCondition);
    this.headerText.setText(
      `Vòng ${this.player.round}  •  Vàng ${this.player.gold}  •  Cấp ${this.player.level}  •  XP ${xpText}  •  Triển khai ${deployText}  •  AI ${AI_SETTINGS[this.aiMode].label}  •  ${modeLabel}  •  ${loseLabel}`
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
    const summary = SynergySystem.calculateSynergies(deployed, "LEFT", {
      extraClassCount: this.player.extraClassCount || 0,
      extraTribeCount: this.player.extraTribeCount || 0
    });
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
      const entry = this.turnQueue[idx];
      const unit = entry?.unit;
      if (!unit || !unit.alive) continue;
      next.push(`${next.length + 1}. ${unit.name} (${unit.side === "LEFT" ? "Ta" : "Địch"})`);
    }
    this.queueText.setText(`• Thứ tự lượt tiếp theo\n${next.join("\n") || "Đã hết lượt."}`);
  }

  updateRoundLabel() {
    if (this.combatRoundLabel) {
      this.combatRoundLabel.setText(`LƯỢT ${this.combatRound}`);
    }
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
    const rangeTypeLabel = unit.range >= 2 ? "Đánh xa" : "Cận chiến";

    let skillIcon = "✨";
    if (skill?.damageType === "physical") skillIcon = "🗡️";
    else if (skill?.damageType === "magic") skillIcon = "🪄";
    else if (skill?.damageType === "true") skillIcon = "💠";

    const rightLines = [
      `${skillIcon} Chiêu thức: ${skill?.name ?? "Không có"}`,
      ""
    ];

    // Use element-aware skill description for right column
    const baseUnit = UNIT_BY_ID[unit.baseId];
    const skillDescLines = _describeSkillWithElement(skill, unit.tribe, baseUnit);
    skillDescLines.forEach((line) => rightLines.push(line));

    const equippedItems = Array.isArray(unit.equips)
      ? unit.equips.map((id) => ITEM_BY_ID[id]).filter((x) => x?.kind === "equipment")
      : [];
    if (equippedItems.length) {
      rightLines.push("");
      rightLines.push("🛡️ Trang bị đang mặc");
      equippedItems.forEach((item) => {
        const recipe = RECIPE_BY_ID[item.fromRecipe];
        const desc = recipe?.description ? ` (${recipe.description})` : "";
        rightLines.push(`  ${item.icon} ${item.name}${desc}`);
      });
    }

    const baseEvasion = unit.mods.evadePct ?? 0;
    const effectiveEvasion = getEffectiveEvasion(unit);
    let evasionText = `💨 Né tránh: ${(effectiveEvasion * 100).toFixed(1)}%`;
    if (Math.abs(effectiveEvasion - baseEvasion) > 0.001) {
      evasionText += ` (gốc ${(baseEvasion * 100).toFixed(1)}%)`;
    }

    // Element label
    const elementLabel = getElementLabel(unit.tribe);

    // Basic attack goes in left body
    const basicAtkLines = this.describeBasicAttack(unit.classType, unit.range, baseUnit?.stats, unit.star);

    const bodyLines = [
      `🏷️ ${elementLabel ? elementLabel + " " : ""}${getTribeLabelVi(unit.tribe)}/${getClassLabelVi(unit.classType)} | 🎯 Tầm ${rangeTypeLabel}`,
      `❤️ HP ${unit.hp}/${unit.maxHp}${unit.shield ? ` +S${unit.shield}` : ""}`,
      `⚔️ ATK ${this.getEffectiveAtk(unit)} | ✨ MATK ${this.getEffectiveMatk(unit)}`,
      `🛡️ DEF ${this.getEffectiveDef(unit)} | 🔮 MDEF ${this.getEffectiveMdef(unit)}`,
      `${evasionText} | 🔥 Nộ ${unit.rage}/${unit.rageMax}`,
      `🎯 Mốc nghề: ${classDef?.thresholds?.join("/") ?? "-"}`,
      `🌿 Mốc tộc: ${tribeDef?.thresholds?.join("/") ?? "-"}`
    ];

    const effects = [];
    if (unit.statuses.freeze > 0) effects.push(`Đóng băng (${unit.statuses.freeze})`);
    if (unit.statuses.stun > 0) effects.push(`Choáng (${unit.statuses.stun})`);
    if (unit.statuses.sleep > 0) effects.push(`Ngủ (${unit.statuses.sleep})`);
    if (unit.statuses.silence > 0) effects.push(`Câm lặng (${unit.statuses.silence})`);
    if (unit.statuses.burnTurns > 0) effects.push(`Cháy (${unit.statuses.burnTurns})`);
    if (unit.statuses.poisonTurns > 0) effects.push(`Độc (${unit.statuses.poisonTurns})`);
    if (unit.statuses.armorBreakTurns > 0) effects.push(`Phá giáp (${unit.statuses.armorBreakTurns})`);
    if (unit.statuses.reflectTurns > 0) effects.push(`Phản đòn (${unit.statuses.reflectTurns})`);
    if (unit.statuses.atkBuffTurns > 0) effects.push(`Tăng ATK (${unit.statuses.atkBuffTurns})`);
    if (unit.statuses.defBuffTurns > 0) effects.push(`Tăng DEF (${unit.statuses.defBuffTurns})`);
    if (unit.statuses.mdefBuffTurns > 0) effects.push(`Tăng MDEF (${unit.statuses.mdefBuffTurns})`);
    if (unit.statuses.evadeBuffTurns > 0) effects.push(`Tăng né tránh (${unit.statuses.evadeBuffTurns})`);
    if (unit.statuses.evadeDebuffTurns > 0) effects.push(`Giảm né tránh (${unit.statuses.evadeDebuffTurns})`);
    if (unit.statuses.tauntTurns > 0) effects.push(`Khiêu khích (${unit.statuses.tauntTurns})`);

    if (effects.length > 0) {
      bodyLines.push(`🧪 Hiệu ứng: ${effects.join(", ")}`);
    }

    // Basic attack in left body
    bodyLines.push("");
    bodyLines.push("👊 Đánh thường");
    basicAtkLines.forEach((l) => bodyLines.push(`  • ${l}`));

    return {
      title: `${visual.icon} ${visual.nameVi} ${unit.star}★ [${unit.side === "LEFT" ? "Ta" : "Địch"}]`,
      body: bodyLines.join("\n"),
      rightBody: rightLines.join("\n")
    };
  }
  getSynergyTooltip() {
    const leftTeam = this.getCombatUnits("LEFT");
    const rightTeam = this.getCombatUnits("RIGHT");
    const leftSummary = SynergySystem.calculateSynergies(leftTeam, "LEFT", {
      extraClassCount: this.player.extraClassCount || 0,
      extraTribeCount: this.player.extraTribeCount || 0
    });
    const rightSummary = SynergySystem.calculateSynergies(rightTeam, "RIGHT", {});
    const lines = [];

    const pushSide = (title, summary) => {
      lines.push(title);
      Object.entries(summary.classCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
          const def = CLASS_SYNERGY[key];
          if (!def) return;
          const tier = SynergySystem.getSynergyTier(count, def.thresholds);
          lines.push(`Nghề ${getClassLabelVi(key)}: ${count} -> ${tier >= 0 ? this.formatBonusSet(def.bonuses[tier]) : "chưa kích"}`);
        });
      Object.entries(summary.tribeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
          const def = TRIBE_SYNERGY[key];
          if (!def) return;
          const tier = SynergySystem.getSynergyTier(count, def.thresholds);
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
        lines.push(`- ${this.getAugmentIcon(aug)} ${aug.name}: ${aug.description}`);
      });
    }

    return {
      title: "Chi tiết cộng hưởng giao tranh",
      body: lines.filter(Boolean).join("\n")
    };
  }


  formatBonusSet(bonus) { return _formatBonusSet(bonus); }

  inferBasicActionPattern(classType, range) { return _inferBasicActionPattern(classType, range); }

  describeBasicAttack(classType, range, baseStats = null, star = 1) {
    return _describeBasicAttack(classType, range, baseStats, star);
  }

  stripSkillStarNotes(description) { return _stripSkillStarNotes(description); }

  getStarStatMultiplier(star) { return _getStarStatMultiplier(star); }

  getStarSkillMultiplier(star) { return _getStarSkillMultiplier(star); }

  getSkillTargetCountText(skill, star) {
    return _getSkillTargetCountText(skill, star);
  }

  getSkillShapeText(skill) {
    return _getSkillShapeText(skill);
  }

  getSkillDamageAndFormulaText(skill, baseStats, star) {
    return _getSkillDamageAndFormulaText(skill, baseStats, star);
  }

  buildSkillStarMilestoneLines(skill, baseUnit) {
    return _buildSkillStarMilestoneLines(skill, baseUnit);
  }

  describeSkillLines(skill, baseUnit = null) {
    return _describeSkillLines(skill, baseUnit);
  }
  describeSkill(skill) { return _describeSkill(skill); }

  describeSkillArea(skill) { return _describeSkillArea(skill); }

  translateDamageType(type) { return _translateDamageType(type); }

  translateScaleStat(stat) { return _translateScaleStat(stat); }

  translateActionPattern(pattern) {
    return _translateActionPattern(pattern);
  }

  translateAugmentGroup(group) { return _translateAugmentGroup(group); }

  getAugmentIcon(augment) { return _getAugmentIcon(augment); }

  translateSkillEffect(effect) { return _translateSkillEffect(effect); }







  applyOwnedEquipmentBonuses(unit, owned) {
    const equips = normalizeEquipIds(owned?.equips);
    const seen = new Set();
    const equipItems = [];
    const unitStar = unit.star ?? 1;

    equips.forEach((itemId) => {
      const item = ITEM_BY_ID[itemId];
      const key = getEquipmentNameKey(itemId);
      if (!item || item.kind !== "equipment" || !key || seen.has(key)) return;

      // Star-based equipment tier restriction (Requirements 2.11, 2.12, 2.13)
      // 1-star: tier 1 only, 2-star: tier 1-2, 3-star: tier 1-3
      const recipeId = typeof itemId === "string" && itemId.startsWith("eq_") ? itemId.slice(3) : null;
      const recipe = recipeId ? RECIPE_BY_ID[recipeId] : null;
      const equipTier = recipe?.tier ?? 1;
      if (equipTier > unitStar) return;

      seen.add(key);
      equipItems.push(item);
    });

    if (owned?.equipment?.kind === "equipment" && owned.equipment.id) {
      const legacyKey = getEquipmentNameKey(owned.equipment.id);
      if (legacyKey && !seen.has(legacyKey)) {
        // Apply star restriction to legacy equipment too
        const legacyRecipeId = typeof owned.equipment.id === "string" && owned.equipment.id.startsWith("eq_") ? owned.equipment.id.slice(3) : null;
        const legacyRecipe = legacyRecipeId ? RECIPE_BY_ID[legacyRecipeId] : null;
        const legacyTier = legacyRecipe?.tier ?? 1;
        if (legacyTier <= unitStar) {
          seen.add(legacyKey);
          equipItems.push(owned.equipment);
        }
      }
    }

    unit.equips = equipItems.map((item) => item.id).filter((id) => typeof id === "string");
    equipItems.forEach((item) => SynergySystem.applyBonusToCombatUnit(unit, item.bonus));

    if (unit.mods?.startingRage) {
      const capped = Math.min(4, unit.mods.startingRage);
      unit.rage = Math.min(unit.rageMax || 100, (unit.rage || 0) + capped);
      unit.mods.startingRage = 0; // Prevent applying multiple times
    }
  }

  buildTurnQueue() {
    const leftOrder = this.buildOrderForSide("LEFT");
    const rightOrder = this.buildOrderForSide("RIGHT");

    // Group cells into chunks: each chunk = [empty cells...] + [unit cell]
    // Last chunk may have only empties (trailing empty cells at end of side)
    const toChunks = (cells) => {
      const chunks = [];
      let current = [];
      for (const cell of cells) {
        current.push(cell);
        if (cell.unit && cell.unit.alive) {
          chunks.push(current);
          current = [];
        }
      }
      if (current.length) chunks.push(current); // trailing empties
      return chunks;
    };

    const leftChunks = toChunks(leftOrder);
    const rightChunks = toChunks(rightOrder);

    // Interleave chunks: LEFT chunk, RIGHT chunk, LEFT chunk, RIGHT chunk...
    const queue = [];
    const maxLen = Math.max(leftChunks.length, rightChunks.length);
    for (let i = 0; i < maxLen; i += 1) {
      if (i < leftChunks.length) queue.push(...leftChunks[i]);
      if (i < rightChunks.length) queue.push(...rightChunks[i]);
    }

    this.turnQueue = queue;
    this.turnIndex = 0;
  }

  buildOrderForSide(side) {
    const list = [];
    if (side === "LEFT") {
      // E5→E1, D5→D1, C→B→A (frontline trước, hàng 5→1 = row 0→4)
      for (let col = PLAYER_COLS - 1; col >= 0; col -= 1) {
        for (let row = 0; row < ROWS; row += 1) {
          const unit = this.getCombatUnitAt(side, row, col);
          list.push({ row, col, side, unit: unit || null });
        }
      }
    } else {
      // G5→G1, H5→H1, I→J→K (frontline trước, hàng 5→1 = row 0→4)
      for (let col = RIGHT_COL_START; col <= RIGHT_COL_END; col += 1) {
        for (let row = 0; row < ROWS; row += 1) {
          const unit = this.getCombatUnitAt(side, row, col);
          list.push({ row, col, side, unit: unit || null });
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

  /**
   * Find the optimal knockback position for a target unit.
   * Scans the horizontal row in the push direction to find:
   * - The last empty cell, OR
   * - The cell immediately before an enemy TANKER
   * 
   * @param {Object} target - The unit being pushed
   * @param {number} pushDirection - Direction to push: +1 (right) or -1 (left)
   * @param {Array} enemies - Array of enemy units to check for collisions
   * @param {number} boardWidth - Width of the board (default: 10)
   * @returns {number} The target column position (returns current col if no valid push)
   */
  findKnockbackPosition(target, pushDirection, enemies, boardWidth = 10) {
    // Validate inputs - check for valid numeric col and row
    if (!target || typeof target.col !== 'number' || typeof target.row !== 'number' ||
      !Number.isFinite(target.col) || !Number.isFinite(target.row)) {
      console.error('Invalid target in findKnockbackPosition:', target);
      return 0; // Return safe fallback position
    }

    const currentCol = target.col;
    const currentRow = target.row;

    // Ensure current position is within bounds
    if (currentCol < 0 || currentCol >= boardWidth) {
      console.error(`Invalid current column ${currentCol}, clamping to bounds`);
      return Math.max(0, Math.min(boardWidth - 1, currentCol));
    }

    // Determine scan range based on push direction
    let scanStart, scanEnd, scanStep;
    if (pushDirection > 0) {
      // Pushing right (player attacking)
      scanStart = currentCol + 1;
      scanEnd = boardWidth - 1;
      scanStep = 1;
    } else {
      // Pushing left (enemy attacking)
      scanStart = currentCol - 1;
      scanEnd = 0;
      scanStep = -1;
    }

    // Scan for last empty cell or cell before tanker
    let lastEmptyCol = currentCol; // Default: no movement

    for (let col = scanStart; pushDirection > 0 ? col <= scanEnd : col >= scanEnd; col += scanStep) {
      // Check if cell is occupied
      const occupant = enemies.find(u => u.alive && u.row === currentRow && u.col === col);

      if (!occupant) {
        // Empty cell found
        lastEmptyCol = col;
      } else {
        // Cell occupied - check if it's a tanker
        if (occupant.classType === "TANKER") {
          // Stop at cell before tanker
          let targetCol;
          if (pushDirection > 0) {
            targetCol = Math.max(currentCol, col - 1);
          } else {
            targetCol = Math.min(currentCol, col + 1);
          }
          // Ensure result is within bounds
          return Math.max(0, Math.min(boardWidth - 1, targetCol));
        } else {
          // Non-tanker blocking - stop here
          break;
        }
      }
    }

    // Ensure final result is within bounds
    const finalCol = Math.max(0, Math.min(boardWidth - 1, lastEmptyCol));
    return finalCol;
  }

  /**
   * Executes one combat turn
   * 
   * ARCHITECTURE NOTE (Task 5.2.1):
   * Combat logic has been delegated to CombatSystem. This method now only handles:
   * - Combat flow orchestration (turn progression, round management)
   * - Calling CombatSystem for combat logic:
   *   - CombatSystem.checkCombatEnd() - Check if combat is finished
   *   - CombatSystem.initializeCombat() - Rebuild turn queue each round
   *   - CombatSystem.tickStatusEffects() - Process status effects
   *   - CombatSystem.executeAction() - Determine skill vs basic attack
   *   - CombatSystem.applyDamage() - Apply damage from effects
   * - Rendering and animations (highlights, floating text, sprites)
   * - UI updates (queue preview, header, combat log)
   * 
   * Combat calculations (damage, turn order, status effects) are in CombatSystem.
   * 
   * @see CombatSystem.checkCombatEnd() - Checks win/loss conditions
   * @see CombatSystem.executeAction() - Determines action type (skill/attack)
   * @see CombatSystem.tickStatusEffects() - Processes DoT and control effects
   */
  async stepCombat() {
    // Comprehensive error recovery wrapper (Requirement 26.5)
    try {
      if (this.phase !== PHASE.COMBAT) return;
      if (this.isActing) return;
      this.clearAttackPreview();

      // COMBAT LOGIC DELEGATION: Check if combat has ended
      // CombatSystem handles: win/loss condition checking
      const combatEndResult = CombatSystem.checkCombatEnd(this.combatState);
      if (combatEndResult.isFinished) {
        this.resolveCombat(combatEndResult.winner === "player" ? "LEFT" : combatEndResult.winner === "enemy" ? "RIGHT" : "DRAW");
        return;
      }

      // Turn queue management and round progression
      if (this.turnQueue.length === 0 || this.turnIndex >= this.turnQueue.length) {
        if (this.combatRound >= 20) {
          this.resolveCombat("DRAW");
          return;
        }

        // Rebuild turn queue — position-based (E5→E1, D→A | G5→G1, H→K)
        this.buildTurnQueue();

        this.combatRound = Math.max(1, this.combatRound + 1);
        this.updateRoundLabel();
        if (!this.turnQueue.length) {
          this.resolveCombat("RIGHT");
          return;
        }
      }

      const entry = this.turnQueue[this.turnIndex];
      this.turnIndex += 1;
      if (!entry) {
        this.refreshQueuePreview();
        return;
      }

      // Show turn indicator (kể cả ô trống)
      this.showTurnIndicatorAt(entry.row, entry.col);

      const actor = entry.unit;
      if (!actor || !actor.alive) {
        this.isActing = true; // Prevent timer overlap
        await new Promise(r => setTimeout(r, 50)); // Raw 50ms, không bị scale
        this.turnIndicatorLayer?.clear();
        this.refreshQueuePreview();
        this.isActing = false;
        // Gọi lại ngay thay vì chờ timer tick 420ms
        this.stepCombat();
        return;
      }

      this.actionCount += 1;
      if (this.actionCount > 100 && this.actionCount % 5 === 0) {
        this.globalDamageMult += 0.2;
        this.addLog(`Tử chiến x${this.globalDamageMult.toFixed(1)} sát thương.`);
      }

      this.isActing = true;
      this.highlightUnit(actor, 0xffef9f);

      try {
        // COMBAT LOGIC DELEGATION: Tick status effects using CombatSystem
        // CombatSystem handles: DoT damage calculation, control effect processing, status duration
        const statusResult = CombatSystem.tickStatusEffects(actor, this.combatState);

        // Rendering: Apply damage from DoT effects (visual feedback only)
        if (statusResult.success && statusResult.triggeredEffects) {
          for (const effect of statusResult.triggeredEffects) {
            if (effect.damage > 0) {
              // CombatSystem already applied the damage, we just render it
              const damageResult = CombatSystem.applyDamage(actor, effect.damage, this.combatState);
              this.resolveDamage(null, actor, effect.damage, "true", effect.type.toUpperCase(), { noRage: true, noReflect: true });

              // Handle disease spreading (game-specific mechanic)
              if (effect.spreads && effect.type === 'disease') {
                const neighbors = [
                  { r: actor.row - 1, c: actor.col },
                  { r: actor.row + 1, c: actor.col },
                  { r: actor.row, c: actor.col - 1 },
                  { r: actor.row, c: actor.col + 1 }
                ];
                neighbors.forEach((pos) => {
                  const neighbor = this.getCombatUnitAt(actor.side, pos.r, pos.c);
                  if (neighbor && neighbor.alive && !neighbor.statuses.diseaseTurns) {
                    // COMBAT LOGIC DELEGATION: Apply status effect via CombatSystem
                    CombatSystem.applyStatusEffect(neighbor, { type: 'disease', duration: 2, value: effect.damage }, this.combatState);
                    this.showFloatingText(neighbor.sprite.x, neighbor.sprite.y - 45, "LÂY BỆNH", "#880088");
                    this.updateCombatUnitUi(neighbor);
                  }
                });
              }
            }
          }
        }

        // Check if unit died from DoT
        if (!actor.alive) {
          this.addLog(`${actor.name} bỏ lượt (dot).`);
        }
        // Check for control effects (stun, freeze, sleep)
        else if (statusResult.controlStatus) {
          this.addLog(`${actor.name} bỏ lượt (${statusResult.controlStatus}).`);
          this.updateCombatUnitUi(actor);
        }
        // Execute action (skill or basic attack)
        else {
          const target = this.selectTarget(actor);
          if (target) {
            // COMBAT LOGIC DELEGATION: Determine action type using CombatSystem
            // CombatSystem handles: rage check, silence check, disarm check, action type determination
            const actionResult = CombatSystem.executeAction(this.combatState, actor);

            if (actionResult.success) {
              if (actionResult.actionType === 'SKILL') {
                // Reset rage if needed (determined by CombatSystem)
                if (actionResult.resetRage) {
                  actor.rage = 0;
                }
                this.updateCombatUnitUi(actor);
                await this.castSkill(actor, target);
              } else if (actionResult.actionType === 'DISARMED') {
                this.showFloatingText(actor.sprite.x, actor.sprite.y - 45, "BỊ CẤM ĐÁNH", "#ffffff");
              } else {
                // Basic attack
                await this.basicAttack(actor, target);
              }
            }
          }
        }
      } catch (actionError) {
        // Log error and continue combat (Requirement 26.5)
        console.error(`[Combat Error] Error during ${actor?.name || 'unknown'} action:`, actionError);
        this.addLog(`Lỗi kỹ thuật - bỏ qua lượt ${actor?.name || 'unknown'}.`);
      }

      this.clearHighlights();
      this.refreshQueuePreview();
      this.refreshHeader();
      this.isActing = false;

      // Check combat end again after action
      const endCheck = CombatSystem.checkCombatEnd(this.combatState);
      if (endCheck.isFinished) {
        this.resolveCombat(endCheck.winner === "player" ? "LEFT" : endCheck.winner === "enemy" ? "RIGHT" : "DRAW");
      }
    } catch (error) {
      // Critical error recovery - log and continue to next turn (Requirement 26.5)
      console.error('[Combat Error] Unexpected error in stepCombat:', error);
      this.isActing = false;
      this.clearHighlights();

      // Try to continue combat gracefully
      try {
        this.refreshQueuePreview();
        this.refreshHeader();
      } catch (recoveryError) {
        console.error('[Combat Error] Error during recovery:', recoveryError);
      }
    }
  }



  selectTarget(attacker, options = {}) {
    // Use AISystem for target selection (Requirements 8.1, 8.6)
    const state = {
      units: this.combatUnits || []
    };
    return aiSelectTarget(attacker, state, this.aiMode, options);
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
    // Viền xanh dương đậm khi đang đánh thường
    this.setCombatBorder(attacker, "attack");
    await this.runActionPattern(attacker, target, pattern, async () => {
      const basicScaleStat = attacker?.mods?.basicAttackScaleStat === "matk" ? "matk" : "atk";
      const damageType = attacker?.mods?.basicAttackType === "magic" ? "magic" : "physical";
      const baseStat = basicScaleStat === "matk" ? this.getEffectiveMatk(attacker) : this.getEffectiveAtk(attacker);
      const raw = baseStat + Phaser.Math.Between(-5, 6);
      this.audioFx.play("hit");
      this.vfx?.slash(attacker.sprite.x, attacker.sprite.y, target.sprite.x, target.sprite.y, 0xff9f8c);
      this.resolveDamage(attacker, target, raw, damageType, "BASIC");
    });
    this.clearCombatBorder(attacker);
    this.addLog(`${attacker.name} đánh ${target.name}.`);
  }

  async castSkill(attacker, target) {
    const skill = SKILL_LIBRARY[attacker.skillId];
    if (!skill) {
      console.error(`[Skill Error] Unit "${attacker.name}" (ID: ${attacker.baseId || attacker.id}) references non-existent skill "${attacker.skillId}". Falling back to basic attack.`);
      await this.basicAttack(attacker, target);
      return;
    }

    this.audioFx.play("skill");
    this.setCombatBorder(attacker, "skill");
    const effectivePattern = skill.actionPattern || this.inferBasicActionPattern(attacker.classType, attacker.range);
    await this.runActionPattern(attacker, target, effectivePattern, async () => {
      this.vfx?.pulseAt(target.sprite.x, target.sprite.y - 8, 0xb6dbff, 16, 220);
      await this.applySkillEffect(attacker, target, skill);
    });
    if (effectivePattern === "RANGED_STATIC" || effectivePattern === "SELF") {
      await this.wait(400);
    }
    this.clearCombatBorder(attacker);
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
    // Comprehensive error recovery for skill effects (Requirement 26.5)
    try {
      const enemies = this.getCombatUnits(attacker.side === "LEFT" ? "RIGHT" : "LEFT");
      const allies = this.getCombatUnits(attacker.side);
      const rawSkill = this.calcSkillRaw(attacker, skill);
      const starChanceMult = starEffectChanceMultiplier(attacker.star);
      const areaBonus = starAreaBonus(attacker.star);
      const targetBonus = starTargetBonus(attacker.star);
      const skillOpts = { isSkill: true };

      switch (skill.effect) {

        case "global_stun": {
          const goldMultiplier = getGoldReserveScaling(this.player.gold);
          enemies.forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
            const effectiveStunChance = Math.min(1, skill.stunChance * starChanceMult * goldMultiplier);
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
          const star = attacker?.star ?? 1;
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          if (target.alive) {
            target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, getStarTurns(star, skill.poisonTurns));
            target.statuses.poisonDamage = Math.max(target.statuses.poisonDamage, getStarDotDamage(star, skill.poisonPerTurn));
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "aoe_circle_stun": {
          const goldMultiplier = getGoldReserveScaling(this.player.gold);
          const expandAoe = 1 + areaBonus;
          enemies
            .filter((enemy) => Math.abs(enemy.row - target.row) <= expandAoe && Math.abs(enemy.col - target.col) <= expandAoe)
            .forEach((enemy) => {
              this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
              const effectiveStunChance = Math.min(1, skill.stunChance * starChanceMult * goldMultiplier);
              if (enemy.alive && Math.random() < effectiveStunChance) {
                enemy.statuses.stun = Math.max(enemy.statuses.stun, skill.stunTurns);
                this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHOÁNG", "#ffd97b");
                this.updateCombatUnitUi(enemy);
              }
            });
          break;
        }
        case "single_bleed": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          if (target.alive) {
            target.statuses.bleedTurns = Math.max(target.statuses.bleedTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
            const bleedDmg = Math.round(this.getEffectiveAtk(attacker) * 0.3 * starScale);
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
              e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns));
              e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, Math.round((skill.selfAtkBuff || 20) * this.getStarSkillMultiplier(attacker?.star ?? 1)));
              this.showFloatingText(e.sprite.x, e.sprite.y - 45, "YẾU ỚT", "#ffaaaa");
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "ram_charge_pierce": {
          // Cừu Núi: húc xuyên — gây ST cho mục tiêu + kẻ đứng phía sau
          const star = attacker?.star ?? 1;
          const starScale = this.getStarSkillMultiplier(star);
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, "SỪNG HÚC", skillOpts);
          // Tìm kẻ đứng phía sau mục tiêu (cùng hàng, col + pushDir)
          const pushDir = attacker.side === "LEFT" ? 1 : -1;
          const behindCol = target.col + pushDir;
          const behind = enemies.find(e => e.alive && e.row === target.row && e.col === behindCol);
          if (behind) {
            const splashDmg = Math.round(rawSkill * 0.6 * starScale);
            this.resolveDamage(attacker, behind, splashDmg, skill.damageType, "XUYÊN QUA", { isSplash: true });
            this.showFloatingText(behind.sprite.x, behind.sprite.y - 45, "HÚCXUYÊN", "#ffa944");
            this.updateCombatUnitUi(behind);
          }
          break;
        }
        case "knockback_charge": {
          // Apply damage first
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);

          // Check if target survived the damage
          if (target.alive) {
            const pushDirection = attacker.side === "LEFT" ? 1 : -1;
            const boardWidth = 10; // Standard board width

            // Validate target position before knockback
            if (typeof target.col !== 'number' || target.col < 0 || target.col >= boardWidth) {
              console.error(`Invalid target column ${target.col} for knockback, skipping`);
              this.showFloatingText(target.sprite.x, target.sprite.y - 45, "LỖI VỊ TRÍ", "#ff6b6b");
              break;
            }

            const targetPosition = this.findKnockbackPosition(target, pushDirection, enemies, boardWidth);

            // Validate returned position
            if (typeof targetPosition !== 'number' || targetPosition < 0 || targetPosition >= boardWidth) {
              console.error(`Invalid knockback position ${targetPosition}, keeping target at ${target.col}`);
              this.showFloatingText(target.sprite.x, target.sprite.y - 45, "KHÓA VỊ TRÍ", "#c8d5e6");
              break;
            }

            // Move target to new position if different from current
            if (targetPosition !== target.col) {
              target.col = targetPosition;
              target.homeCol = targetPosition; // Sync home position so attack animation returns to correct spot
              const screen = this.gridToScreen(target.col, target.row);
              await this.tweenCombatUnit(target, screen.x, screen.y - 10, 220);
              this.syncCombatLabels(target);
              this.showFloatingText(screen.x, screen.y - 45, "ĐẨY LÙI", "#ffffff");
            } else {
              // Target blocked - cannot move
              this.showFloatingText(target.sprite.x, target.sprite.y - 45, "KHÓA VỊ TRÍ", "#c8d5e6");
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
          const star = attacker?.star ?? 1;
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          if (target.alive) {
            target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, getStarTurns(star, 5));
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
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          attacker.statuses.atkBuffTurns = Math.max(attacker.statuses.atkBuffTurns, 5);
          attacker.statuses.atkBuffValue = Math.max(attacker.statuses.atkBuffValue, Math.round(attacker.atk * 0.5 * starScale));
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
          const star = attacker?.star ?? 1;
          enemies.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "magic", skill.name, skillOpts);
            if (e.alive) {
              e.statuses.burnTurns = Math.max(e.statuses.burnTurns, getStarTurns(star, 3));
              e.statuses.burnDamage = Math.max(e.statuses.burnDamage, Math.round(rawSkill * 0.2));
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "global_knockback": {
          enemies.forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType || "magic", skill.name, skillOpts);
          });
          const push = attacker.side === "LEFT" ? 1 : -1;
          const frontliners = enemies
            .filter((enemy) => enemy.alive && this.distanceToFrontline(enemy) === 0)
            .sort((a, b) => a.row - b.row);
          for (const enemy of frontliners) {
            const newCol = Math.max(0, Math.min(COLS - 1, enemy.col + push));
            const blocked = enemies.some((u) => u.uid !== enemy.uid && u.alive && u.row === enemy.row && u.col === newCol);
            if (blocked || newCol === enemy.col) continue;
            enemy.col = newCol;
            enemy.homeCol = newCol; // Sync home position so attack animation returns to correct spot
            const screen = this.gridToScreen(enemy.col, enemy.row);
            await this.tweenCombatUnit(enemy, screen.x, screen.y - 10, 180);
            this.syncCombatLabels(enemy);
            this.showFloatingText(screen.x, screen.y - 45, "ĐẨY LÙI", "#ffffff");
            this.updateCombatUnitUi(enemy);
          }
          break;
        }
        case "revive_or_heal": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const dead = this.combatUnits.find(u => u.side === attacker.side && !u.alive);
          if (dead && Math.random() < 0.5) {
            dead.alive = true;
            dead.hp = Math.round(dead.maxHp * 0.4 * starScale);
            const revivedTheme = this.getRoleTheme(dead.classType);
            dead.sprite?.setFillStyle?.(revivedTheme.fill, 0.98);
            dead.sprite?.setStrokeStyle?.(3, revivedTheme.stroke, 1);
            dead.tag.setColor("#ffffff");
            this.showFloatingText(dead.sprite.x, dead.sprite.y - 45, "HỒI SINH", "#ffff00");
            this.updateCombatUnitUi(dead);
          } else {
            allies.forEach(a => this.healUnit(attacker, a, Math.round(rawSkill * starScale), "CỨU RỖI"));
          }
          break;
        }
        case "true_execute": {
          const bonus = target.hp < target.maxHp * 0.4 ? rawSkill * 2 : rawSkill;
          this.resolveDamage(attacker, target, bonus, "true", skill.name, skillOpts);
          break;
        }
        case "global_slow": {
          // Removed: slow mechanic replaced by evasion system
          break;
        }
        case "global_tide_evade": {
          let healedAny = false;
          allies.forEach((ally) => {
            if (!ally?.alive) return;
            const missingHp = Math.max(0, (ally.maxHp ?? 0) - (ally.hp ?? 0));
            if (missingHp <= 0) return;
            healedAny = true;
            ally.hp = ally.maxHp;
            this.vfx?.pulseAt(ally.sprite.x, ally.sprite.y - 10, 0x9dffba, 14, 180);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, `+${missingHp}`, "#9dffba");
            this.updateCombatUnitUi(ally);
          });
          if (healedAny) this.audioFx.play("heal");
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 37, healedAny ? "THỦY TRIỀU" : "ĐẦY MÁU", "#c9ffde");
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
        case "team_def_buff":
        case "team_buff_def": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const turns = Number.isFinite(skill.turns) ? Math.max(1, Math.round(skill.turns)) : 3;
          const defBuff = Math.max(1, Math.round((skill.armorBuff || 20) * starScale));
          const mdefBase = Math.max(skill.mdefBuff || 0, skill.armorBuff || 0, 20);
          const mdefBuff = Math.max(1, Math.round(mdefBase * starScale));
          allies.forEach(a => {
            a.statuses.defBuffTurns = Math.max(a.statuses.defBuffTurns, turns);
            a.statuses.defBuffValue = Math.max(a.statuses.defBuffValue, defBuff);
            a.statuses.mdefBuffTurns = Math.max(a.statuses.mdefBuffTurns, turns);
            a.statuses.mdefBuffValue = Math.max(a.statuses.mdefBuffValue, mdefBuff);
            this.updateCombatUnitUi(a);
          });
          const lowest = allies
            .filter((ally) => ally.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (lowest) {
            const healAmount = Math.max(1, Math.round(50 * starScale));
            this.healUnit(attacker, lowest, healAmount, "PHÚC LÀNH");
          }
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "BẢO VỆ", "#00ff00");
          break;
        }

        case "damage_shield_taunt": {
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          this.addShield(attacker, Math.round(skill.shieldBase + this.getEffectiveAtk(attacker) * 0.4));
          enemies.forEach((enemy) => {
            enemy.statuses.tauntTargetId = attacker.uid;
            enemy.statuses.tauntTurns = Math.max(enemy.statuses.tauntTurns, skill.tauntTurns + 1);
            this.updateCombatUnitUi(enemy);
          });
          break;
        }
        case "damage_stun": {
          const goldMultiplier = getGoldReserveScaling(this.player.gold);
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          const effectiveStunChance = Math.min(1, skill.stunChance * starChanceMult * goldMultiplier);
          if (target.alive && Math.random() < effectiveStunChance) {
            target.statuses.stun = Math.max(target.statuses.stun, skill.stunTurns);
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "CHOÁNG", "#ffd97b");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "damage_shield_reflect": {
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          this.addShield(attacker, Math.round(skill.shieldBase + this.getEffectiveDef(attacker) * 0.5));
          attacker.statuses.reflectTurns = Math.max(attacker.statuses.reflectTurns, skill.reflectTurns);
          attacker.statuses.reflectPct = Math.max(attacker.statuses.reflectPct, skill.reflectPct);
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "ally_row_def_buff": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const scaledArmor = Math.max(1, Math.round((skill.armorBuff || 15) * starScale));
          const scaledMdef = Math.max(1, Math.round((skill.mdefBuff || 10) * starScale));
          allies
            .filter((ally) => ally.row === attacker.row)
            .forEach((ally) => {
              ally.statuses.defBuffTurns = Math.max(ally.statuses.defBuffTurns, skill.turns);
              ally.statuses.defBuffValue = Math.max(ally.statuses.defBuffValue, scaledArmor);
              ally.statuses.mdefBuffTurns = Math.max(ally.statuses.mdefBuffTurns, skill.turns);
              ally.statuses.mdefBuffValue = Math.max(ally.statuses.mdefBuffValue, scaledMdef);
              this.updateCombatUnitUi(ally);
              this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "HỘ VỆ", "#a9ebff");
            });
          break;
        }
        case "single_burst": {
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          break;
        }
        case "double_hit": {
          const hit1 = this.calcSkillRaw(attacker, skill.hit1 || { base: skill.base || 0, scaleStat: skill.scaleStat || "atk", scale: skill.scale || 0 });
          const hit2 = this.calcSkillRaw(attacker, skill.hit2 || { base: skill.base || 0, scaleStat: skill.scaleStat || "atk", scale: skill.scale || 0 });
          this.resolveDamage(attacker, target, hit1, skill.damageType || "physical", `${skill.name} 1`, skillOpts);
          if (target.alive) this.resolveDamage(attacker, target, hit2, skill.damageType || "physical", `${skill.name} 2`, skillOpts);
          break;
        }
        case "single_burst_lifesteal": {
          const dealt = this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          if (dealt > 0) this.healUnit(attacker, attacker, Math.round(dealt * skill.lifesteal), "HÚT MÁU");
          break;
        }
        case "single_delayed_echo": {
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          if (target.alive) {
            await this.wait(65);
            const echo = skill.echoBase + this.getEffectiveAtk(attacker) * skill.echoScale;
            this.resolveDamage(attacker, target, echo, skill.damageType, "VỌNG", skillOpts);
          }
          break;
        }
        case "cross_5": {
          const expand = areaBonus;
          const points = [
            [target.row, target.col],
            [target.row - 1, target.col],
            [target.row + 1, target.col],
            [target.row, target.col - 1],
            [target.row, target.col + 1]
          ];
          if (expand >= 1) {
            points.push([target.row - 1, target.col - 1], [target.row - 1, target.col + 1]);
            points.push([target.row + 1, target.col - 1], [target.row + 1, target.col + 1]);
          }
          enemies
            .filter((enemy) => points.some((p) => p[0] === enemy.row && p[1] === enemy.col))
            .forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts));
          break;
        }
        case "row_multi": {
          const maxHits = Number.isFinite(skill.maxHits) ? Math.max(1, Math.floor(skill.maxHits)) : 3;
          const victims = enemies
            .filter((enemy) => enemy.row === target.row)
            .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
            .slice(0, maxHits);
          victims.forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts));
          break;
        }
        case "random_multi": {
          // Use getWaspMaxTargets for wasp skills to scale with star level
          const baseMaxHits = getWaspMaxTargets(attacker, skill) ?? skill.maxHits ?? 3;
          const maxHits = skill.id === "wasp_triple_strike" ? baseMaxHits : baseMaxHits + targetBonus;
          const pool = enemies.filter((enemy) => enemy.alive);
          const victims = sampleWithoutReplacement(pool, Math.min(maxHits, pool.length));
          const waspDamageMult = skill.id === "wasp_triple_strike"
            ? (attacker.star >= 3 ? 1.4 : attacker.star === 2 ? 1.2 : 1)
            : 1;
          const hitDamage = rawSkill * waspDamageMult;
          victims.forEach((enemy) => this.resolveDamage(attacker, enemy, hitDamage, skill.damageType, skill.name, skillOpts));
          break;
        }
        case "single_sleep": {
          const goldMultiplier = getGoldReserveScaling(this.player.gold);
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          const effectiveSleepChance = Math.min(1, skill.sleepChance * starChanceMult * goldMultiplier);
          const maxSleepTargets = Math.min(3, Math.max(1, attacker.star ?? 1));
          const pool = enemies.filter((enemy) => enemy.alive);
          const selected = [];
          while (selected.length < maxSleepTargets && pool.length > 0) {
            const highestRage = Math.max(...pool.map((enemy) => enemy.rage ?? 0));
            const topRageEnemies = pool.filter((enemy) => (enemy.rage ?? 0) === highestRage);
            const victim = topRageEnemies[Math.floor(Math.random() * topRageEnemies.length)];
            if (!victim) break;
            selected.push(victim);
            const victimIndex = pool.indexOf(victim);
            if (victimIndex >= 0) pool.splice(victimIndex, 1);
          }
          selected.forEach((enemy) => {
            if (!enemy.alive || Math.random() >= effectiveSleepChance) return;
            enemy.statuses.sleep = Math.max(enemy.statuses.sleep, skill.sleepTurns);
            this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "NGỦ", "#d4bcff");
            this.updateCombatUnitUi(enemy);
          });
          break;
        }
        case "single_armor_break": {
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          target.statuses.armorBreakTurns = Math.max(target.statuses.armorBreakTurns, skill.turns);
          target.statuses.armorBreakValue = Math.max(target.statuses.armorBreakValue, skill.armorBreak);
          this.updateCombatUnitUi(target);
          break;
        }
        case "single_poison_stack": {
          this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          if (target.alive) {
            target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, skill.poisonTurns || 3);
            const perTurn = skill.poisonPerTurn || 15;
            target.statuses.poisonDamage = (target.statuses.poisonDamage || 0) + perTurn;
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "ĐỘC +", "#880088");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "column_freeze": {
          const goldMultiplier = getGoldReserveScaling(this.player.gold);
          const expandCol = areaBonus;
          enemies
            .filter((enemy) => Math.abs(enemy.col - target.col) <= expandCol)
            .forEach((enemy) => {
              this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
              const effectiveFreezeChance = Math.min(1, skill.freezeChance * starChanceMult * goldMultiplier);
              if (enemy.alive && Math.random() < effectiveFreezeChance) {
                enemy.statuses.freeze = Math.max(enemy.statuses.freeze, skill.freezeTurns);
                this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "ĐÓNG BĂNG", "#83e5ff");
                this.updateCombatUnitUi(enemy);
              }
            });
          break;
        }
        case "aoe_circle": {
          const expandAoe = 1 + areaBonus;
          enemies
            .filter((enemy) => Math.abs(enemy.row - target.row) <= expandAoe && Math.abs(enemy.col - target.col) <= expandAoe)
            .forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts));
          break;
        }
        case "column_plus_splash": {
          // Sét trụ: gây full damage cột chính + lan sang neighbor victims
          const splashMax = (skill.splashCount ?? 2) + targetBonus;
          const columnVictims = enemies.filter(e => e.col === target.col);
          columnVictims.forEach(enemy => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
          });
          const splashTargets = enemies
            .filter(e => e.col !== target.col)
            .sort((a, b) => manhattan(target, a) - manhattan(target, b))
            .slice(0, splashMax);
          splashTargets.forEach(enemy => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, "LAN", skillOpts);
          });
          break;
        }
        case "aoe_poison": {
          const expandPoison = 1 + areaBonus;
          enemies
            .filter((enemy) => Math.abs(enemy.row - target.row) <= expandPoison && Math.abs(enemy.col - target.col) <= expandPoison)
            .forEach((enemy) => {
              this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
              if (enemy.alive) {
                enemy.statuses.poisonTurns = Math.max(enemy.statuses.poisonTurns, skill.poisonTurns);
                enemy.statuses.poisonDamage = Math.max(enemy.statuses.poisonDamage, skill.poisonPerTurn);
                this.updateCombatUnitUi(enemy);
              }
            });
          break;
        }
        case "dual_heal": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const targets = allies
            .filter((ally) => ally.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
            .slice(0, 2);
          targets.forEach((ally) => this.healUnit(attacker, ally, Math.round(rawSkill * starScale), skill.name));
          break;
        }
        case "shield_cleanse": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const lowest = allies
            .filter((ally) => ally.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (!lowest) break;
          const amount = Math.round((skill.shieldBase + this.getEffectiveMatk(attacker) * skill.shieldScale) * starScale);
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
              this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "+NỘ", "#b8f5ff");
            });
          break;
        }
        case "column_bless": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          allies
            .filter((ally) => ally.col === attacker.col)
            .forEach((ally) => {
              ally.statuses.atkBuffTurns = Math.max(ally.statuses.atkBuffTurns, skill.turns);
              ally.statuses.atkBuffValue = Math.max(ally.statuses.atkBuffValue, Math.round((skill.atkBuff || 15) * starScale));
              ally.mods.evadePct = Math.max(ally.mods.evadePct, Math.min(0.5, (skill.evadeBuff || 0.1) * starScale));
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
        case "column_bleed": {
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          enemies
            .filter((enemy) => enemy.col === target.col)
            .forEach((enemy) => {
              this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
              if (enemy.alive) {
                enemy.statuses.bleedTurns = Math.max(enemy.statuses.bleedTurns, skill.turns || 3);
                const bleedDmg = Math.round(this.getEffectiveAtk(attacker) * 0.25 * starScale);
                enemy.statuses.bleedDamage = Math.max(enemy.statuses.bleedDamage || 0, bleedDmg);
                this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 45, "CHẢY MÁU", "#ff4444");
                this.updateCombatUnitUi(enemy);
              }
            });
          break;
        }
        case "self_atk_and_assist": {
          attacker.statuses.atkBuffTurns = Math.max(attacker.statuses.atkBuffTurns, skill.turns);
          attacker.statuses.atkBuffValue = Math.max(attacker.statuses.atkBuffValue, skill.selfAtkBuff);
          this.resolveDamage(attacker, target, rawSkill, skill.damageType || "physical", skill.name, skillOpts);
          const assistChance = Math.min(1, skill.assistRate * starChanceMult);
          const helper = allies.find((ally) => ally.uid !== attacker.uid && ally.row === attacker.row);
          if (helper && target.alive && Math.random() < assistChance) {
            const assist = this.getEffectiveAtk(helper) * 0.8;
            this.resolveDamage(helper, target, assist, "physical", "HỖ TRỢ", skillOpts);
          }
          break;
        }
        case "cone_smash": {
          const coneExpand = 1 + areaBonus;
          enemies
            .filter((enemy) => Math.abs(enemy.row - target.row) <= coneExpand && Math.abs(enemy.col - target.col) <= coneExpand)
            .forEach((enemy) => this.resolveDamage(attacker, enemy, rawSkill, skill.damageType || "physical", skill.name, skillOpts));
          break;
        }
        case "true_single": {
          this.resolveDamage(attacker, target, rawSkill, "true", skill.name, skillOpts);
          break;
        }
        case "global_poison_team": {
          enemies.forEach((enemy) => {
            this.resolveDamage(attacker, enemy, rawSkill, skill.damageType, skill.name, skillOpts);
            if (enemy.alive) {
              enemy.statuses.poisonTurns = Math.max(enemy.statuses.poisonTurns, skill.poisonTurns);
              enemy.statuses.poisonDamage = Math.max(enemy.statuses.poisonDamage, skill.poisonPerTurn);
              this.updateCombatUnitUi(enemy);
            }
          });
          break;
        }
        case "lifesteal_disease": {
          const dmg = this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);
          if (skill.lifesteal) {
            const heal = Math.round(dmg * skill.lifesteal);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, `+${heal}`, "#00ff00");
            this.updateCombatUnitUi(attacker);
          }
          if (target.alive) {
            target.statuses.diseaseTurns = Math.max(target.statuses.diseaseTurns || 0, skill.diseaseTurns);
            target.statuses.diseaseDamage = Math.max(target.statuses.diseaseDamage || 0, skill.diseaseDamage);
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "DỊCH BỆNH", "#880088");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "lifesteal_disease_maxhp": {
          const dealt = this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);

          if (dealt > 0) {
            // Lifesteal (60% of damage dealt)
            const heal = Math.round(dealt * 0.6);
            this.healUnit(attacker, attacker, heal, "HÚT MÁU");

            // Increase max HP (15% of damage dealt)
            const maxHpIncrease = Math.round(dealt * 0.15);
            attacker.maxHp += maxHpIncrease;
            attacker.hp += maxHpIncrease;  // Also increase current hp
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 55, `+${maxHpIncrease} HP TỐI ĐA`, "#00ff88");
            this.updateCombatUnitUi(attacker);

            // Disease spread to adjacent enemies
            const neighbors = enemies.filter(e =>
              Math.abs(e.row - target.row) <= 1 &&
              Math.abs(e.col - target.col) <= 1 &&
              e.uid !== target.uid
            );
            neighbors.forEach(e => {
              e.statuses.diseaseTurns = Math.max(e.statuses.diseaseTurns || 0, 3);
              e.statuses.diseaseDamage = Math.max(e.statuses.diseaseDamage || 0, 10);
              this.updateCombatUnitUi(e);
            });
          }
          break;
        }
        case "double_hit_gold_reward": {
          // Calculate damage for both hits
          const hit1 = this.calcSkillRaw(attacker, skill.hit1 || { base: 26, scaleStat: "atk", scale: 1.45 });
          const hit2 = this.calcSkillRaw(attacker, skill.hit2 || { base: 22, scaleStat: "atk", scale: 1.25 });

          // Execute first hit
          const dealt1 = this.resolveDamage(attacker, target, hit1, "physical", "HỎA ẤN 1", skillOpts);

          // Wait between hits
          await this.wait(120);

          // Check if target was alive after first hit
          const targetAliveAfterHit1 = target.alive;

          // Execute second hit
          const dealt2 = this.resolveDamage(attacker, target, hit2, "physical", "HỎA ẤN 2", skillOpts);

          // Award gold if target was alive before second hit and died from either hit
          // Only award gold when attacker is on LEFT side (player)
          if (targetAliveAfterHit1 && !target.alive && attacker.side === "LEFT") {
            this.player.gold += 1;
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 65, "+1 VÀNG", "#ffd700");
            this.addLog(`${attacker.name} kết liễu ${target.name} và nhận 1 vàng!`);
          }
          break;
        }
        case "assassin_execute_rage_refund": {
          // Track if target was alive before damage
          const targetWasAlive = target.alive;

          // Apply damage
          const dealt = this.resolveDamage(attacker, target, rawSkill, skill.damageType, skill.name, skillOpts);

          // If kill: refund 50% of attacker's rageMax, award 5 gold, and allow extra attack
          if (targetWasAlive && !target.alive) {
            // Refund 50% rage
            const refund = Math.ceil(attacker.rageMax * 0.5);
            attacker.rage = Math.min(attacker.rageMax, attacker.rage + refund);
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 65, `+${refund} NỘ`, "#ff6b9d");

            // Award 5 gold if attacker is on LEFT side (player)
            if (attacker.side === "LEFT") {
              this.player.gold += 5;
              this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 85, "+5 VÀNG", "#ffd700");
              this.addLog(`${attacker.name} kết liễu ${target.name} và nhận 5 vàng!`);
            }

            // Allow immediate extra attack on another enemy
            const enemySide = attacker.side === "LEFT" ? "RIGHT" : "LEFT";
            const remainingEnemies = this.getCombatUnits(enemySide);
            if (remainingEnemies.length > 0) {
              const newTarget = this.selectTarget(attacker);
              if (newTarget) {
                this.addLog(`${attacker.name} tấn công tiếp!`);
                await this.basicAttack(attacker, newTarget);
              }
            }
          }
          break;
        }
        case "metamorphosis": {
          attacker.name = "Bướm Gió";
          attacker.tribe = "WIND";
          if (attacker.icon && typeof attacker.icon.setText === "function") attacker.icon.setText("🦋");
          else attacker.icon = "🦋";
          const matkMult = skill.buffStats?.matk || 1.5;
          attacker.matk = Math.round(attacker.matk * matkMult);
          attacker.mods.basicAttackType = "magic";
          attacker.mods.basicAttackScaleStat = "matk";
          attacker.rage = 0;
          if ((attacker.star ?? 1) >= 2) {
            const agilityBuff = 0.12;
            allies.forEach((ally) => {
              ally.mods.evadePct = Math.max(ally.mods.evadePct, agilityBuff);
              this.showFloatingText(ally.sprite.x, ally.sprite.y - 56, "NHANH NHẸN", "#9fe8ff");
              this.updateCombatUnitUi(ally);
            });
          }
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
          attacker.statuses.counterTurns = getStarTurns(attacker?.star ?? 1, skill.turns || 3) + (attacker?.star >= 2 ? 1 : 0);
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
        // ═══════════════════════════════════════════════════════
        // 14 NEW TANKER SKILLS — each tanker gets unique identity
        // ═══════════════════════════════════════════════════════
        case "self_armor_reflect": {
          // Lửng Đá: Gai Đá — self buff armor + reflect physical damage
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const defBuff = Math.max(1, Math.round((skill.armorBuff || 25) * starScale));
          const reflectPct = skill.reflectPct || 0.20;
          attacker.statuses.defBuffTurns = Math.max(attacker.statuses.defBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
          attacker.statuses.defBuffValue = Math.max(attacker.statuses.defBuffValue, defBuff);
          attacker.statuses.physReflectTurns = Math.max(attacker.statuses.physReflectTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "GAI ĐÁ", "#ffa944");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "roar_debuff_heal": {
          // Gấu Cổ Thụ: Gầm Gừ — debuff ATK N nearest enemies (N = star) + self heal
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const maxTargets = Math.min(3, Math.max(1, attacker?.star ?? 1));
          const debuffValue = Math.max(1, Math.round(20 * starScale));
          const nearest = enemies
            .filter(e => e.alive)
            .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
            .slice(0, maxTargets);
          nearest.forEach(e => {
            e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
            e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, debuffValue);
            this.showFloatingText(e.sprite.x, e.sprite.y - 45, "SỢ HÃI", "#ffaaaa");
            this.updateCombatUnitUi(e);
          });
          const selfHeal = Math.round(attacker.maxHp * 0.10 * starScale);
          this.healUnit(attacker, attacker, selfHeal, "GẦM GỪ");
          break;
        }
        case "self_shield_immune": {
          // Ốc Sên Pháo Đài: shield + CC immunity
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const shieldAmt = Math.round(((skill.shieldBase || 50) + this.getEffectiveDef(attacker) * (skill.shieldScale || 0.40)) * starScale);
          this.addShield(attacker, shieldAmt);
          attacker.statuses.immuneTurns = Math.max(attacker.statuses.immuneTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 2));
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "PHÁO ĐÀI", "#83e5ff");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "guardian_pact": {
          // Cua Giáp: protect weakest ally — absorb 30% damage for them
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const weakest = allies
            .filter(a => a.alive && a.uid !== attacker.uid)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (weakest) {
            weakest.statuses.guardianId = attacker.uid;
            weakest.statuses.guardianTurns = Math.max(weakest.statuses.guardianTurns || 0, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
            weakest.statuses.guardianAbsorb = Math.min(0.5, 0.30 * this.getStarSkillMultiplier(attacker?.star ?? 1));
            this.showFloatingText(weakest.sprite.x, weakest.sprite.y - 45, "ĐƯỢC BẢO VỆ", "#9dffba");
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "KẸP BẢO VỆ", "#9dffba");
            this.updateCombatUnitUi(weakest);
          }
          // Also self buff DEF
          const defBuff = Math.max(1, Math.round(15 * starScale));
          attacker.statuses.defBuffTurns = Math.max(attacker.statuses.defBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
          attacker.statuses.defBuffValue = Math.max(attacker.statuses.defBuffValue, defBuff);
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "self_maxhp_boost": {
          // Bò Núi: permanently increase max HP by 15%
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const boostPct = 0.15 * starScale;
          const increase = Math.round(attacker.maxHp * boostPct);
          attacker.maxHp += increase;
          attacker.hp += increase;
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, `+${increase} HP`, "#00ff88");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "self_def_fortify": {
          // Tatu Cuộn: huge DEF+MDEF buff + 50% damage reduction on next hit
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const defBuff = Math.max(1, Math.round((skill.armorBuff || 30) * starScale));
          const mdefBuff = Math.max(1, Math.round((skill.mdefBuff || 30) * starScale));
          attacker.statuses.defBuffTurns = Math.max(attacker.statuses.defBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 2));
          attacker.statuses.defBuffValue = Math.max(attacker.statuses.defBuffValue, defBuff);
          attacker.statuses.mdefBuffTurns = Math.max(attacker.statuses.mdefBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 2));
          attacker.statuses.mdefBuffValue = Math.max(attacker.statuses.mdefBuffValue, mdefBuff);
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "CUỘN TRÒN", "#ffd97b");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "resilient_shield": {
          // Rùa Đầm Lầy: large shield, if shield survives 2 turns → heal 20% HP
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const shieldAmt = Math.round(((skill.shieldBase || 80) + this.getEffectiveDef(attacker) * (skill.shieldScale || 0.50)) * starScale);
          this.addShield(attacker, shieldAmt);
          attacker.statuses.resilientShieldTurns = skill.turns || 2;
          attacker.statuses.resilientShieldHealPct = 0.20;
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "MAI THẦN", "#9dffba");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "frost_aura_buff": {
          // Hải Mã Băng: buff DEF+MDEF for 2 nearest allies
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const defBuff = Math.max(1, Math.round((skill.armorBuff || 20) * starScale));
          const mdefBuff = Math.max(1, Math.round((skill.mdefBuff || 15) * starScale));
          const maxTargets = (skill.maxTargets || 2) + targetBonus;
          const nearby = allies
            .filter(a => a.alive && a.uid !== attacker.uid)
            .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b))
            .slice(0, maxTargets);
          nearby.forEach(ally => {
            ally.statuses.defBuffTurns = Math.max(ally.statuses.defBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
            ally.statuses.defBuffValue = Math.max(ally.statuses.defBuffValue, defBuff);
            ally.statuses.mdefBuffTurns = Math.max(ally.statuses.mdefBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
            ally.statuses.mdefBuffValue = Math.max(ally.statuses.mdefBuffValue, mdefBuff);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "BĂNG HỘ", "#83e5ff");
            this.updateCombatUnitUi(ally);
          });
          // Also buff self
          attacker.statuses.defBuffTurns = Math.max(attacker.statuses.defBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
          attacker.statuses.defBuffValue = Math.max(attacker.statuses.defBuffValue, defBuff);
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "HÀO QUANG BĂNG", "#83e5ff");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "team_rage_self_heal": {
          // Voi Ma Mút: +3 rage to all allies + self heal 15% HP
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const rageGain = skill.rageGain || 3;
          allies.forEach(ally => {
            if (ally.uid === attacker.uid) return;
            ally.rage = Math.min(ally.rageMax, ally.rage + rageGain);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, `+${rageGain} NỘ`, "#b8f5ff");
            this.updateCombatUnitUi(ally);
          });
          const selfHeal = Math.round(attacker.maxHp * 0.15 * starScale);
          this.healUnit(attacker, attacker, selfHeal, "BẦY ĐÀN");
          break;
        }
        case "warcry_atk_def": {
          // Bò Tây Tạng: buff ATK whole team 2 turns + self DEF 3 turns
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const atkBuff = Math.max(1, Math.round(20 * starScale));
          const defBuff = Math.max(1, Math.round((skill.armorBuff || 25) * starScale));
          allies.forEach(ally => {
            ally.statuses.atkBuffTurns = Math.max(ally.statuses.atkBuffTurns, 2);
            ally.statuses.atkBuffValue = Math.max(ally.statuses.atkBuffValue, atkBuff);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "+SỨC MẠNH", "#ffa944");
            this.updateCombatUnitUi(ally);
          });
          attacker.statuses.defBuffTurns = Math.max(attacker.statuses.defBuffTurns, skill.turns || 3);
          attacker.statuses.defBuffValue = Math.max(attacker.statuses.defBuffValue, defBuff);
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 55, "THÉT CHIẾN", "#ff4444");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "team_evade_buff": {
          // Trâu Sương Mù: evade buff for whole team
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const evadeBuff = 0.20 * starScale;
          allies.forEach(ally => {
            ally.mods.evadePct = Math.max(ally.mods.evadePct || 0, evadeBuff);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "SƯƠNG MÙ", "#d4bcff");
            this.updateCombatUnitUi(ally);
          });
          break;
        }
        case "single_silence_lock": {
          // Mực Khổng Lồ: damage + silence strongest enemy
          this.resolveDamage(attacker, target, rawSkill, skill.damageType || "physical", skill.name, skillOpts);
          if (target.alive) {
            const silenceTurns = skill.turns || 2;
            target.statuses.silence = Math.max(target.statuses.silence || 0, silenceTurns);
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "KHÓA SKILL", "#ff6b9d");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "self_regen_team_heal": {
          // Hydra Đầm Lầy: self heal 8% + heal 2 weakest allies 5%
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const selfHeal = Math.round(attacker.maxHp * 0.08 * starScale);
          this.healUnit(attacker, attacker, selfHeal, "TÁI SINH");
          const weakest = allies
            .filter(a => a.alive && a.uid !== attacker.uid)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)
            .slice(0, 2);
          weakest.forEach(ally => {
            const heal = Math.round(ally.maxHp * 0.05 * starScale);
            this.healUnit(attacker, ally, heal, "ĐA ĐẦU");
          });
          break;
        }
        case "team_shield": {
          // Rồng Đất: shield for all allies, self gets double
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const baseShield = Math.round(((skill.shieldBase || 40) + this.getEffectiveDef(attacker) * (skill.shieldScale || 0.20)) * starScale);
          allies.forEach(ally => {
            const amount = ally.uid === attacker.uid ? baseShield * 2 : baseShield;
            this.addShield(ally, amount);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, `+${amount} KHIÊN`, "#ffd97b");
            this.updateCombatUnitUi(ally);
          });
          break;
        }
        // ═══════════════════════════════════════════════════════
        // MAGE SKILLS (12 new effects)
        // ═══════════════════════════════════════════════════════
        case "chain_shock": {
          // Sứa Điện: sét lan 3 mục tiêu giảm 20% mỗi lần
          const pool = enemies.filter(e => e.alive);
          let dmg = rawSkill;
          for (let i = 0; i < Math.min(3 + targetBonus, pool.length); i++) {
            const e = pool[Math.floor(Math.random() * pool.length)];
            if (e) this.resolveDamage(attacker, e, dmg, "magic", "SÉT LAN", skillOpts);
            dmg *= 0.8;
          }
          break;
        }
        case "frost_storm": {
          // Chuồn Chuồn Băng: nguyên hàng ngang + debuff ATK
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          enemies.filter(e => e.row === target.row).forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "magic", skill.name, skillOpts);
            if (e.alive) {
              e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
              e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, Math.round(15 * starScale));
              this.showFloatingText(e.sprite.x, e.sprite.y - 45, "ĐÓNG BĂNG", "#83e5ff");
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "pollen_confuse": {
          // Ong Phép: damage nhỏ toàn thể + 40% silence
          const goldMult = getGoldReserveScaling(this.player.gold);
          enemies.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "magic", skill.name, skillOpts);
            if (e.alive && Math.random() < 0.40 * starChanceMult * goldMult) {
              e.statuses.silence = Math.max(e.statuses.silence || 0, 1);
              this.showFloatingText(e.sprite.x, e.sprite.y - 45, "IM LẶNG", "#d4bcff");
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "fire_breath_cone": {
          // Kỳ Nhông Lửa: 3 ô phía trước + đốt cháy
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const dir = attacker.side === "LEFT" ? 1 : -1;
          const coneTargets = enemies.filter(e =>
            Math.abs(e.row - attacker.row) <= 1 &&
            e.col >= Math.min(attacker.col, attacker.col + dir * 2) &&
            e.col <= Math.max(attacker.col, attacker.col + dir * 2)
          );
          coneTargets.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "magic", "PHUN LỬA", skillOpts);
            if (e.alive) {
              e.statuses.burnTurns = Math.max(e.statuses.burnTurns || 0, getStarTurns(attacker?.star ?? 1, 3));
              e.statuses.burnDamage = Math.max(e.statuses.burnDamage || 0, Math.round(12 * starScale));
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "flash_blind": {
          // Đom Đóm Sáng: damage nhỏ toàn thể + giảm accuracy
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          enemies.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "magic", "LÓE SÁNG", skillOpts);
            if (e.alive) {
              e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, 2);
              e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, Math.round(10 * starScale));
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "plague_spread": {
          // Bọ Dịch Hạch: damage + disease lây sang lân cận
          this.resolveDamage(attacker, target, rawSkill, "magic", skill.name, skillOpts);
          const neighbors = enemies.filter(e =>
            Math.abs(e.row - target.row) <= 1 && Math.abs(e.col - target.col) <= 1 && e.uid !== target.uid
          );
          [target, ...neighbors].forEach(e => {
            if (e.alive) {
              e.statuses.diseaseTurns = Math.max(e.statuses.diseaseTurns || 0, getStarTurns(attacker?.star ?? 1, 3));
              e.statuses.diseaseDamage = Math.max(e.statuses.diseaseDamage || 0, getStarDotDamage(attacker?.star ?? 1, 12));
              this.showFloatingText(e.sprite.x, e.sprite.y - 45, "DỊCH BỆNH", "#880088");
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "fireball_burn": {
          // Kỳ Giông Lửa: 9 ô vuông + đốt cháy
          const expandAoe = 1 + areaBonus;
          enemies.filter(e => Math.abs(e.row - target.row) <= expandAoe && Math.abs(e.col - target.col) <= expandAoe)
            .forEach(e => {
              this.resolveDamage(attacker, e, rawSkill, "magic", "CẦU LỬA", skillOpts);
              if (e.alive) {
                e.statuses.burnTurns = Math.max(e.statuses.burnTurns || 0, 3);
                e.statuses.burnDamage = Math.max(e.statuses.burnDamage || 0, 15);
                this.updateCombatUnitUi(e);
              }
            });
          break;
        }
        case "ice_blast_freeze": {
          // Cóc Băng: single target damage CAO + 50% đóng băng
          const goldMult = getGoldReserveScaling(this.player.gold);
          this.resolveDamage(attacker, target, rawSkill, "magic", skill.name, skillOpts);
          if (target.alive && Math.random() < 0.50 * starChanceMult * goldMult) {
            target.statuses.freeze = Math.max(target.statuses.freeze, 1);
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "ĐÓNG BĂNG", "#83e5ff");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "dust_sleep": {
          // Bướm Đêm Bụi: 9 ô vuông + 35% ngủ
          const goldMult = getGoldReserveScaling(this.player.gold);
          const expandAoe = 1 + areaBonus;
          enemies.filter(e => Math.abs(e.row - target.row) <= expandAoe && Math.abs(e.col - target.col) <= expandAoe)
            .forEach(e => {
              this.resolveDamage(attacker, e, rawSkill, "magic", "BỤI MÊ", skillOpts);
              if (e.alive && Math.random() < 0.35 * starChanceMult * goldMult) {
                e.statuses.sleep = Math.max(e.statuses.sleep, 1);
                this.showFloatingText(e.sprite.x, e.sprite.y - 45, "NGỦ", "#d4bcff");
                this.updateCombatUnitUi(e);
              }
            });
          break;
        }
        case "ink_blast_debuff": {
          // Bạch Tuộc Tâm: nguyên cột + giảm DEF
          enemies.filter(e => e.col === target.col).forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "magic", "MỰC PHUN", skillOpts);
            if (e.alive) {
              e.statuses.armorBreakTurns = Math.max(e.statuses.armorBreakTurns, skill.turns || 2);
              e.statuses.armorBreakValue = Math.max(e.statuses.armorBreakValue, skill.armorBreak || 20);
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "ink_bomb_blind": {
          // Mực Mực: 9 ô vuông + giảm ATK
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const expandAoe = 1 + areaBonus;
          enemies.filter(e => Math.abs(e.row - target.row) <= expandAoe && Math.abs(e.col - target.col) <= expandAoe)
            .forEach(e => {
              this.resolveDamage(attacker, e, rawSkill, "magic", "BOM MỰC", skillOpts);
              if (e.alive) {
                e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, 2);
                e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, Math.round(12 * starScale));
                this.updateCombatUnitUi(e);
              }
            });
          break;
        }
        // ═══════════════════════════════════════════════════════
        // ARCHER SKILLS (14 new effects)
        // ═══════════════════════════════════════════════════════
        case "piercing_shot": {
          // Cắt Lao: xuyên nguyên hàng ngang, giảm 20% mỗi mục tiêu
          let dmg = rawSkill;
          const rowTargets = enemies.filter(e => e.row === target.row)
            .sort((a, b) => manhattan(attacker, a) - manhattan(attacker, b));
          rowTargets.forEach(e => {
            this.resolveDamage(attacker, e, dmg, "physical", "XUYÊN", skillOpts);
            dmg *= 0.8;
          });
          break;
        }
        case "arrow_rain": {
          // Đại Bàng Xạ Thủ: mũi tên ngẫu nhiên (cho phép trùng)
          const maxHits = (skill.maxHits || 4) + targetBonus;
          for (let i = 0; i < maxHits; i++) {
            const pool = enemies.filter(e => e.alive);
            if (pool.length === 0) break;
            const e = pool[Math.floor(Math.random() * pool.length)];
            this.resolveDamage(attacker, e, rawSkill, "physical", "MƯA TÊN", skillOpts);
          }
          break;
        }
        case "fish_bomb_aoe": {
          // Bồ Nông Bom: 9 ô vuông + 30% choáng
          const goldMult = getGoldReserveScaling(this.player.gold);
          const expandAoe = 1 + areaBonus;
          enemies.filter(e => Math.abs(e.row - target.row) <= expandAoe && Math.abs(e.col - target.col) <= expandAoe)
            .forEach(e => {
              this.resolveDamage(attacker, e, rawSkill, "physical", "BOM CÁ", skillOpts);
              if (e.alive && Math.random() < (skill.stunChance || 0.30) * starChanceMult * goldMult) {
                e.statuses.stun = Math.max(e.statuses.stun, skill.stunTurns || 1);
                this.showFloatingText(e.sprite.x, e.sprite.y - 45, "CHOÁNG", "#ffd97b");
                this.updateCombatUnitUi(e);
              }
            });
          break;
        }
        case "feather_bleed": {
          // Hải Âu Gió: mục tiêu ngẫu nhiên + chảy máu
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const maxT = (skill.maxHits || 3) + targetBonus;
          const pool = enemies.filter(e => e.alive);
          const victims = sampleWithoutReplacement(pool, Math.min(maxT, pool.length));
          victims.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "physical", "LÔNG VŨ", skillOpts);
            if (e.alive) {
              e.statuses.bleedTurns = Math.max(e.statuses.bleedTurns, skill.turns || 2);
              e.statuses.bleedDamage = Math.max(e.statuses.bleedDamage || 0, Math.round(this.getEffectiveAtk(attacker) * 0.2 * starScale));
              this.showFloatingText(e.sprite.x, e.sprite.y - 45, "CHẢY MÁU", "#ff4444");
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "rock_throw_stun": {
          // Khỉ Lao Cành: single target CAO + 40% choáng
          const goldMult = getGoldReserveScaling(this.player.gold);
          this.resolveDamage(attacker, target, rawSkill, "physical", skill.name, skillOpts);
          if (target.alive && Math.random() < (skill.stunChance || 0.40) * starChanceMult * goldMult) {
            target.statuses.stun = Math.max(target.statuses.stun, skill.stunTurns || 1);
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "CHOÁNG", "#ffd97b");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "snipe_execute": {
          // Chim Mỏ To: x2 damage nếu target <30% HP
          const bonus = target.hp < target.maxHp * 0.3 ? rawSkill * 2 : rawSkill;
          this.resolveDamage(attacker, target, bonus, "physical", "MỎ XUYÊN", skillOpts);
          break;
        }
        case "sniper_crit": {
          // Cò Bắn Tỉa: damage rất cao + 50% xuyên giáp
          const penOpts = { ...skillOpts, armorPen: skill.armorPen || 0.5 };
          this.resolveDamage(attacker, target, rawSkill, "physical", "BẮN TỈA", penOpts);
          break;
        }
        case "dive_bomb": {
          // Diều Hâu Khổng Lồ: nguyên cột + phá giáp
          enemies.filter(e => e.col === target.col).forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "physical", "BỔ NHÀO", skillOpts);
            if (e.alive) {
              e.statuses.armorBreakTurns = Math.max(e.statuses.armorBreakTurns, skill.turns || 2);
              e.statuses.armorBreakValue = Math.max(e.statuses.armorBreakValue, skill.armorBreak || 15);
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "beak_disarm": {
          // Chim Mỏ To: damage + tước vũ khí (disarm)
          this.resolveDamage(attacker, target, rawSkill, "physical", skill.name, skillOpts);
          if (target.alive) {
            target.statuses.disarmTurns = Math.max(target.statuses.disarmTurns, getStarTurns(attacker?.star ?? 1, 1));
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "TƯỚC KHÍ", "#ffffff");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "fire_arrow_burn": {
          // Hồng Hạc Bắn: single target + đốt cháy 3 lượt
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.resolveDamage(attacker, target, rawSkill, "physical", "TÊN LỬA", skillOpts);
          if (target.alive) {
            target.statuses.burnTurns = Math.max(target.statuses.burnTurns || 0, getStarTurns(attacker?.star ?? 1, 3));
            target.statuses.burnDamage = Math.max(target.statuses.burnDamage || 0, Math.round(12 * starScale));
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "ĐỐT CHÁY", "#ff6600");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "heat_seek": {
          // Diều Hâu Săn: tìm HP thấp nhất, x2 nếu <50% HP
          const weakest = enemies.filter(e => e.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (weakest) {
            const bonus = weakest.hp < weakest.maxHp * 0.5 ? rawSkill * 2 : rawSkill;
            this.resolveDamage(attacker, weakest, bonus, "physical", "TẦM NHIỆT", skillOpts);
          }
          break;
        }
        case "rapid_fire": {
          // Gõ Kiến Khoan: phát cùng 1 mục tiêu
          const maxHits = 3 + targetBonus;
          for (let i = 0; i < maxHits; i++) {
            if (!target.alive) break;
            this.resolveDamage(attacker, target, rawSkill, "physical", `KHOAN ${i + 1}`, skillOpts);
          }
          break;
        }
        case "dark_feather_debuff": {
          // Quạ Bão Táp: mục tiêu ngẫu nhiên + giảm ATK
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const maxT = (skill.maxHits || 3) + targetBonus;
          const pool = enemies.filter(e => e.alive);
          const victims = sampleWithoutReplacement(pool, Math.min(maxT, pool.length));
          victims.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "physical", "LÔNG ĐEN", skillOpts);
            if (e.alive) {
              e.statuses.atkDebuffTurns = Math.max(e.statuses.atkDebuffTurns, skill.turns || 2);
              e.statuses.atkDebuffValue = Math.max(e.statuses.atkDebuffValue, Math.round(15 * starScale));
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        case "multi_sting_poison": {
          // Ong Bắp Cày: mục tiêu + poison nhẹ
          const maxT = 2 + targetBonus;
          const pool = enemies.filter(e => e.alive);
          const victims = sampleWithoutReplacement(pool, Math.min(maxT, pool.length));
          victims.forEach(e => {
            this.resolveDamage(attacker, e, rawSkill, "physical", "CHÂM", skillOpts);
            if (e.alive) {
              e.statuses.poisonTurns = Math.max(e.statuses.poisonTurns, 2);
              e.statuses.poisonDamage = Math.max(e.statuses.poisonDamage, skill.poisonPerTurn || 10);
              this.updateCombatUnitUi(e);
            }
          });
          break;
        }
        // ═══════════════════════════════════════════════════════
        // ASSASSIN SKILLS (11 new effects)
        // ═══════════════════════════════════════════════════════
        case "backstab_crit": {
          // Chồn Hương Bóng: x1.5 nếu đứng phía sau
          const behind = (attacker.side === "LEFT" && attacker.col > target.col) ||
            (attacker.side === "RIGHT" && attacker.col < target.col);
          const dmg = behind ? rawSkill * 1.5 : rawSkill;
          this.resolveDamage(attacker, target, dmg, "physical", behind ? "CẮN GÁY!" : skill.name, skillOpts);
          break;
        }
        case "scavenge_heal": {
          // Kền Kền Ăn Xác: damage + nếu giết hồi HP
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const wasAlive = target.alive;
          this.resolveDamage(attacker, target, rawSkill, "physical", skill.name, skillOpts);
          if (wasAlive && !target.alive) {
            const heal = Math.round(attacker.maxHp * 0.3 * starScale);
            this.healUnit(attacker, attacker, heal, "XÉ XÁC");
          }
          break;
        }
        case "death_mark": {
          // Quạ Tử Thần: damage + đánh dấu tử thần (dùng disease giả lập)
          this.resolveDamage(attacker, target, rawSkill, "physical", skill.name, skillOpts);
          if (target.alive) {
            const markDmg = Math.round((target.maxHp - target.hp) * 0.25);
            target.statuses.diseaseTurns = Math.max(target.statuses.diseaseTurns || 0, skill.turns || 2);
            target.statuses.diseaseDamage = Math.max(target.statuses.diseaseDamage || 0, markDmg);
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "TỬ THẦN", "#ff0000");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "quick_strike_rage": {
          // Chồn Nhanh: damage thấp + hồi nộ bản thân
          this.resolveDamage(attacker, target, rawSkill, "physical", "ĐÂM NHANH", skillOpts);
          const rageGain = skill.rageGain || 5;
          attacker.rage = Math.min(attacker.rageMax, attacker.rage + rageGain);
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, `+${rageGain} NỘ`, "#b8f5ff");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "stealth_strike": {
          // Tắc Kè Ẩn: damage + buff né
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.resolveDamage(attacker, target, rawSkill, "physical", "ẨN ĐÁNH", skillOpts);
          attacker.mods.evadePct = Math.max(attacker.mods.evadePct || 0, Math.min(0.6, 0.25 * starScale));
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "ẨN MÌNH", "#d4bcff");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "sting_paralyze": {
          // Bọ Cạp Bóng: damage + 40% choáng (same as damage_stun)
          const goldMult = getGoldReserveScaling(this.player.gold);
          this.resolveDamage(attacker, target, rawSkill, "physical", "CHÍCH", skillOpts);
          if (target.alive && Math.random() < (skill.stunChance || 0.40) * starChanceMult * goldMult) {
            target.statuses.stun = Math.max(target.statuses.stun, skill.stunTurns || 1);
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "TÊ LIỆT", "#ffd97b");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "double_poison_hit": {
          // Rắn Lục Tấn: 2 đòn + cộng dồn poison
          for (let i = 0; i < 2; i++) {
            if (!target.alive) break;
            this.resolveDamage(attacker, target, rawSkill, "physical", `ĐỘC ${i + 1}`, skillOpts);
            if (target.alive) {
              target.statuses.poisonTurns = Math.max(target.statuses.poisonTurns, getStarTurns(attacker?.star ?? 1, 3));
              target.statuses.poisonDamage = (target.statuses.poisonDamage || 0) + getStarDotDamage(attacker?.star ?? 1, 10);
              this.updateCombatUnitUi(target);
            }
          }
          break;
        }
        case "flame_combo":
        case "flame_combo_assassin": {
          // Cáo Hỏa: damage + đốt cháy
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.resolveDamage(attacker, target, rawSkill, "physical", "LỬA CÁO", skillOpts);
          if (target.alive) {
            target.statuses.burnTurns = Math.max(target.statuses.burnTurns || 0, getStarTurns(attacker?.star ?? 1, 2));
            target.statuses.burnDamage = Math.max(target.statuses.burnDamage || 0, Math.round(15 * starScale));
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "ĐỐT CHÁY", "#ff6600");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "x_slash_bleed": {
          // Bọ Ngựa Kiếm: damage + chảy máu mạnh
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.resolveDamage(attacker, target, rawSkill, "physical", "KIẾM X", skillOpts);
          if (target.alive) {
            target.statuses.bleedTurns = Math.max(target.statuses.bleedTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
            target.statuses.bleedDamage = Math.max(target.statuses.bleedDamage || 0, Math.round(this.getEffectiveAtk(attacker) * 0.35 * starScale));
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "CHẢY MÁU", "#ff4444");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "web_trap_slow": {
          // Nhện Độc: damage + debuff ATK
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.resolveDamage(attacker, target, rawSkill, "physical", "MẠNG TƠ", skillOpts);
          if (target.alive) {
            target.statuses.atkDebuffTurns = Math.max(target.statuses.atkDebuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 2));
            target.statuses.atkDebuffValue = Math.max(target.statuses.atkDebuffValue, Math.round(20 * starScale));
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "MẮC BẪY", "#ffffff");
            this.updateCombatUnitUi(target);
          }
          break;
        }
        case "silent_kill_stealth": {
          // Chồn Mink Im: damage + nếu giết tăng né
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const wasAlive = target.alive;
          this.resolveDamage(attacker, target, rawSkill, "physical", "ÁM SÁT", skillOpts);
          if (wasAlive && !target.alive) {
            attacker.mods.evadePct = Math.max(attacker.mods.evadePct || 0, Math.min(0.6, 0.30 * starScale));
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "TÀNG HÌNH", "#d4bcff");
            this.updateCombatUnitUi(attacker);
          }
          break;
        }
        // ═══════════════════════════════════════════════════════
        // SUPPORT SKILLS (15 new effects)
        // ═══════════════════════════════════════════════════════
        case "heal_over_time": {
          // Nai Thần Ca: HoT cho 3 đồng minh
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const targets = allies.filter(a => a.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, (skill.maxTargets || 3) + targetBonus);
          targets.forEach(ally => {
            const hotAmount = Math.round(ally.maxHp * 0.05 * starScale);
            ally.statuses.hotTurns = Math.max(ally.statuses.hotTurns || 0, getStarTurns(attacker?.star ?? 1, skill.turns || 3));
            ally.statuses.hotAmount = Math.max(ally.statuses.hotAmount || 0, hotAmount);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "HỒI DẦN", "#9dffba");
            this.updateCombatUnitUi(ally);
          });
          break;
        }
        case "spring_aoe_heal": {
          // Tiên Rừng: heal TẤT CẢ đồng minh
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const healAmt = Math.round(rawSkill * starScale);
          allies.filter(a => a.alive).forEach(ally => {
            this.healUnit(attacker, ally, healAmt, "SUỐI NGUỒN");
          });
          break;
        }
        case "soul_link_heal": {
          // Hồn Ma Sáng: liên kết đồng minh yếu nhất
          const weakest = allies.filter(a => a.alive && a.uid !== attacker.uid)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (weakest) {
            weakest.statuses.soulLinkId = attacker.uid;
            weakest.statuses.soulLinkTurns = getStarTurns(attacker?.star ?? 1, skill.turns || 2);
            this.showFloatingText(weakest.sprite.x, weakest.sprite.y - 45, "HỘ MỆNH", "#ffff00");
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "LIÊN KẾT", "#ffff00");
            this.updateCombatUnitUi(weakest);
          }
          break;
        }
        case "phoenix_rebirth": {
          // Phượng Hoàng Lửa: heal ally yếu nhất 40% + set self-revive flag
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const weakest = allies.filter(a => a.alive && a.uid !== attacker.uid)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (weakest) {
            const heal = Math.round(weakest.maxHp * 0.4 * starScale);
            this.healUnit(attacker, weakest, heal, "BẤT DIỆT");
          }
          if (!attacker.statuses.phoenixUsed) {
            attacker.statuses.phoenixRevive = true;
            this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "PHƯỢNG HOÀNG", "#ff6600");
          }
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "light_purify": {
          // Đom Đóm Chữa: xóa 1 debuff + heal nhỏ cho 2 ally
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const targets = allies.filter(a => a.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, (skill.maxTargets || 2) + targetBonus);
          targets.forEach(ally => {
            // Remove 1 random debuff
            const debuffs = ["stun", "freeze", "sleep", "silence", "burnTurns", "poisonTurns", "bleedTurns"];
            const active = debuffs.filter(d => (ally.statuses[d] || 0) > 0);
            if (active.length > 0) {
              const chosen = active[Math.floor(Math.random() * active.length)];
              ally.statuses[chosen] = 0;
              this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, "THANH TẨY", "#ffff00");
            }
            this.healUnit(attacker, ally, Math.round(20 * starScale), "ÁNH SÁNG");
            this.updateCombatUnitUi(ally);
          });
          break;
        }
        case "unicorn_atk_buff": {
          // Kỳ Lân Sáng: buff ATK +25% cho 1 ally ATK cao nhất
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const strongest = allies.filter(a => a.alive && a.uid !== attacker.uid)
            .sort((a, b) => this.getEffectiveAtk(b) - this.getEffectiveAtk(a))[0];
          if (strongest) {
            const buff = Math.round(this.getEffectiveAtk(strongest) * 0.25 * starScale);
            strongest.statuses.atkBuffTurns = Math.max(strongest.statuses.atkBuffTurns, skill.turns || 3);
            strongest.statuses.atkBuffValue = Math.max(strongest.statuses.atkBuffValue, buff);
            this.showFloatingText(strongest.sprite.x, strongest.sprite.y - 45, "+SỨC MẠNH", "#ffa944");
            this.updateCombatUnitUi(strongest);
          }
          break;
        }
        case "wind_shield_ally": {
          // Yêu Tinh Gió: khiên cho 2 đồng minh yếu nhất
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const shieldAmt = Math.round(((skill.shieldBase || 40) + this.getEffectiveMatk(attacker) * (skill.shieldScale || 0.3)) * starScale);
          const targets = allies.filter(a => a.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, (skill.maxTargets || 2) + targetBonus);
          targets.forEach(ally => {
            this.addShield(ally, shieldAmt);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, `+${shieldAmt} KHIÊN`, "#ffd97b");
            this.updateCombatUnitUi(ally);
          });
          break;
        }
        case "bless_rain_mdef": {
          // Hạc Phước: buff MDEF toàn đội
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const mdefBuff = Math.max(1, Math.round(20 * starScale));
          allies.forEach(ally => {
            ally.statuses.mdefBuffTurns = Math.max(ally.statuses.mdefBuffTurns, getStarTurns(attacker?.star ?? 1, skill.turns || 2));
            ally.statuses.mdefBuffValue = Math.max(ally.statuses.mdefBuffValue, mdefBuff);
            this.updateCombatUnitUi(ally);
          });
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "PHƯỚC LÀNH", "#9dffba");
          break;
        }
        case "mirror_reflect": {
          // Bướm Kính: khiên + phản phép cho bản thân
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.addShield(attacker, Math.round(((skill.shieldBase || 50) + this.getEffectiveDef(attacker) * 0.3) * starScale));
          attacker.statuses.reflectTurns = Math.max(attacker.statuses.reflectTurns, getStarTurns(attacker?.star ?? 1, skill.reflectTurns || 2));
          attacker.statuses.reflectPct = Math.max(attacker.statuses.reflectPct, skill.reflectPct || 0.25);
          this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "VẢY GƯƠNG", "#83e5ff");
          this.updateCombatUnitUi(attacker);
          break;
        }
        case "mass_cleanse": {
          // Tiên Nước: xóa ALL debuff 1 ally + heal 15% HP
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const massTargetCount = 1 + targetBonus;
          const worstList = allies.filter(a => a.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, massTargetCount);
          worstList.forEach(worst => {
            worst.statuses.freeze = 0; worst.statuses.stun = 0; worst.statuses.sleep = 0;
            worst.statuses.silence = 0; worst.statuses.burnTurns = 0; worst.statuses.poisonTurns = 0;
            worst.statuses.bleedTurns = 0; worst.statuses.diseaseTurns = 0;
            const heal = Math.round(worst.maxHp * 0.15 * starScale);
            this.healUnit(attacker, worst, heal, "THANH TẨY");
            this.updateCombatUnitUi(worst);
          });
          break;
        }
        case "scout_buff_ally": {
          // Báo Đốm Săn: buff ATK + 1 nộ cho 1 ally cùng hàng
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const rowAlly = allies.filter(a => a.alive && a.uid !== attacker.uid && a.row === attacker.row)[0];
          if (rowAlly) {
            rowAlly.statuses.atkBuffTurns = Math.max(rowAlly.statuses.atkBuffTurns, 3);
            rowAlly.statuses.atkBuffValue = Math.max(rowAlly.statuses.atkBuffValue, Math.round(15 * starScale));
            rowAlly.rage = Math.min(rowAlly.rageMax, rowAlly.rage + 1);
            this.showFloatingText(rowAlly.sprite.x, rowAlly.sprite.y - 45, "DẪN ĐƯỜNG", "#ffa944");
            this.updateCombatUnitUi(rowAlly);
          }
          break;
        }
        case "pack_howl_rage": {
          // Linh Cẩu Bầy: +2 nộ cho ally cùng hàng
          const rageGain = skill.rageGain || 2;
          allies.filter(a => a.alive && a.uid !== attacker.uid && a.row === attacker.row).forEach(ally => {
            ally.rage = Math.min(ally.rageMax, ally.rage + rageGain);
            this.showFloatingText(ally.sprite.x, ally.sprite.y - 45, `+${rageGain} NỘ`, "#b8f5ff");
            this.updateCombatUnitUi(ally);
          });
          break;
        }
        case "peace_heal_reduce_dmg":
        case "peace_heal_reduce": {
          // Bồ Câu Hòa Bình: heal ally yếu nhất + giảm damage nhận
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          const weakest = allies.filter(a => a.alive)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (weakest) {
            this.healUnit(attacker, weakest, Math.round(rawSkill * starScale), "BÌNH AN");
            weakest.statuses.defBuffTurns = Math.max(weakest.statuses.defBuffTurns, 1);
            weakest.statuses.defBuffValue = Math.max(weakest.statuses.defBuffValue, Math.round(20 * starScale));
            this.updateCombatUnitUi(weakest);
          }
          break;
        }
        case "mimic_rage_buff": {
          // Vẹt Linh Hô: +3 nộ cho 1 ally nộ thấp nhất
          const rageGain = skill.rageGain || 3;
          const lowRageTargets = allies.filter(a => a.alive && a.uid !== attacker.uid)
            .sort((a, b) => a.rage - b.rage).slice(0, 1 + targetBonus);
          lowRageTargets.forEach(lowRage => {
            lowRage.rage = Math.min(lowRage.rageMax, lowRage.rage + rageGain);
            this.showFloatingText(lowRage.sprite.x, lowRage.sprite.y - 45, `+${rageGain} NỘ`, "#b8f5ff");
            this.updateCombatUnitUi(lowRage);
          });
          break;
        }
        case "root_snare_debuff":
        case "root_snare": {
          // Yêu Tinh Cây: damage nhẹ + silence + tự heal
          const starScale = this.getStarSkillMultiplier(attacker?.star ?? 1);
          this.resolveDamage(attacker, target, rawSkill, "magic", "RỄ CÂY", skillOpts);
          if (target.alive) {
            target.statuses.silence = Math.max(target.statuses.silence || 0, getStarTurns(attacker?.star ?? 1, 1));
            this.showFloatingText(target.sprite.x, target.sprite.y - 45, "IM LẶNG", "#9dffba");
            this.updateCombatUnitUi(target);
          }
          this.healUnit(attacker, attacker, Math.round(attacker.maxHp * 0.10 * starScale), "RỄ CÂY");
          break;
        }
        default:
          // Log error for unknown skill effect (Requirement 26.3)
          console.error(`[Skill Error] Unknown skill effect "${skill.effect}" for skill "${skill.name}" (ID: ${skill.id || 'unknown'}). Falling back to basic damage.`);
          this.resolveDamage(attacker, target, rawSkill, skill.damageType || "physical", skill.name, skillOpts);
          break;
      }
    } catch (error) {
      // Log error and continue combat (Requirement 26.5)
      console.error(`[Skill Error] Error applying skill effect "${skill?.effect || 'unknown'}" for ${attacker?.name || 'unknown'}:`, error);
      this.addLog(`Lỗi kỹ năng ${skill?.name || 'unknown'} - bỏ qua hiệu ứng.`);

      // Try to apply basic damage as fallback
      try {
        const rawSkill = this.calcSkillRaw(attacker, skill);
        this.resolveDamage(attacker, target, rawSkill, skill.damageType || "physical", "LỖI", { isSkill: true });
      } catch (fallbackError) {
        console.error('[Skill Error] Fallback damage also failed:', fallbackError);
      }
    }
  }

  calcSkillRaw(attacker, skill) {
    const statName = skill.scaleStat || "atk";
    const sourceStat =
      statName === "atk" ? this.getEffectiveAtk(attacker) : statName === "matk" ? this.getEffectiveMatk(attacker) : attacker[statName] ?? 0;
    const starSkillMult = attacker?.star >= 3 ? 1.4 : attacker?.star === 2 ? 1.2 : 1;
    const baseDamage = ((skill.base || 0) + sourceStat * (skill.scale || 0)) * starSkillMult;
    if (!Number.isFinite(baseDamage) || (skill.base == null && skill.scale == null)) {
      console.warn(`[calcSkillRaw] Missing base/scale for skill ${skill.id || skill.name || "?"}: base=${skill.base}, scale=${skill.scale}, result=${baseDamage}`);
    }

    // Apply gold scaling to skill damage (Requirement 2.1, 2.2, 2.3, 2.4)
    const goldMultiplier = getGoldReserveScaling(this.player.gold);
    const scaledDamage = Math.round(baseDamage * goldMultiplier);

    return scaledDamage;
  }
  getEffectiveAtk(unit) {
    const buff = unit.statuses.atkBuffTurns > 0 ? unit.statuses.atkBuffValue : 0;
    const debuff = unit.statuses.atkDebuffTurns > 0 ? unit.statuses.atkDebuffValue : 0;
    return Math.max(1, unit.atk + buff - debuff);
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

  getSpeciesDropCandidates(unit) {
    const base = UNIT_BY_ID[unit?.baseId];
    const species = String(base?.species ?? unit?.species ?? "").toLowerCase();
    const tribe = base?.tribe ?? unit?.tribe;
    const classType = base?.classType ?? unit?.classType;
    const out = [];
    const add = (itemId) => {
      if (!itemId || out.includes(itemId)) return;
      if (ITEM_BY_ID[itemId]?.kind !== "base") return;
      out.push(itemId);
    };
    const hasSpecies = (...keys) => keys.some((key) => species.includes(String(key).toLowerCase()));

    if (hasSpecies("dai-bang", "qua", "cu", "vet", "cong", "thien-nga", "phuong", "ong")) add("feather");
    if (hasSpecies("rua", "te-te", "te-giac", "ca-sau", "ran", "khung-long", "tac-ke", "bo-cap")) add("bark");
    if (hasSpecies("gau", "trau", "voi", "ho", "soi", "nai", "lon", "su-tu", "ha-ma", "vuon")) add("belt");
    if (hasSpecies("ong", "kien", "bo", "bo-cap", "bo-ngua", "nhen", "muoi", "sau", "chuon-chuon", "buom")) add("claw");
    if (tribe === "TIDE") add("tear");
    if (tribe === "SPIRIT" || tribe === "NIGHT" || classType === "MAGE") add("crystal");

    if (!out.length) {
      const fallbackByTribe = {
        STONE: "bark",
        WIND: "feather",
        FIRE: "claw",
        TIDE: "tear",
        NIGHT: "claw",
        SPIRIT: "crystal",
        SWARM: "claw"
      };
      add(fallbackByTribe[tribe] ?? "claw");
    }

    return out;
  }

  rollLootDropsForUnit(unit) {
    const candidates = this.getSpeciesDropCandidates(unit);
    if (!candidates.length) return [];
    const tier = clamp(Number.isFinite(unit?.tier) ? Math.floor(unit.tier) : 1, 1, 5);
    const drops = [candidates[0]];
    const chanceByTier = {
      1: { second: 0.18, third: 0.04 },
      2: { second: 0.28, third: 0.08 },
      3: { second: 0.4, third: 0.14 },
      4: { second: 0.52, third: 0.2 },
      5: { second: 0.66, third: 0.28 }
    };
    const tierChance = chanceByTier[tier] ?? chanceByTier[1];
    if (candidates.length > 1 && Math.random() < tierChance.second) {
      drops.push(candidates[1]);
    }
    if (candidates.length > 2 && Math.random() < tierChance.third) {
      drops.push(candidates[2]);
    }
    return drops;
  }

  recordEnemyLootDrop(unit) {
    const drops = this.rollLootDropsForUnit(unit);
    if (!drops.length) return;
    if (!Array.isArray(this.combatLootDrops)) this.combatLootDrops = [];
    this.combatLootDrops.push(...drops);
    const label = drops
      .map((id) => {
        const item = ITEM_BY_ID[id];
        return `${item?.icon ?? "❔"} ${item?.name ?? id}`;
      })
      .join(", ");
    this.addLog(`${unit?.name ?? "Linh thú"} rơi: ${label}.`);
  }

  resolveDamage(attacker, defender, rawDamage, damageType, reason, options = {}) {
    // Validate inputs and provide fallback values (Requirement 26.3)
    if (!defender || !defender.alive) return 0;
    if (attacker && !attacker.alive) return 0;

    // Validate and clamp rawDamage (Requirement 26.3)
    if (typeof rawDamage !== 'number' || !Number.isFinite(rawDamage) || rawDamage < 0) {
      console.error(`[Combat Error] Invalid rawDamage value: ${rawDamage}, using fallback 0`);
      rawDamage = 0;
    }

    // Validate damageType (Requirement 26.3)
    if (!['physical', 'magic', 'true'].includes(damageType)) {
      console.error(`[Combat Error] Invalid damageType: ${damageType}, using fallback 'physical'`);
      damageType = 'physical';
    }

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

    // Magic/true damage luôn trúng — chỉ physical mới check né tránh
    if (attacker && !options.forceHit && !options.isSkill && damageType === "physical") {
      const hitChance = calculateHitChance(attacker, defender);
      if (Math.random() >= hitChance) {
        this.audioFx.play("click");
        this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, "TRƯỢT", "#d3f2ff");
        // Defender gains rage even on miss, but attacker does not
        if (!options.noRage) {
          // Clamp rage to rageMax (Requirement 26.1)
          defender.rage = Math.min(defender.rageMax || 5, (defender.rage || 0) + 1);
          this.updateCombatUnitUi(defender);
        }
        if (!options.noAutoCast) {
          this.scheduleTankAutoCast(defender, attacker);
        }
        return 0;
      }
    }

    let raw = Math.max(1, rawDamage);

    // Khắc chế nguyên tố (Requirement 8.1, 8.2, 8.3, 8.4):
    // Apply elemental modifiers BEFORE defense calculations
    if (attacker && defender && TRIBE_COUNTER[attacker.tribe] === defender.tribe) {
      // Attacker has elemental advantage
      if (defender.classType === "TANKER") {
        // Tanker defender reduces incoming damage by 50% (Requirement 8.2)
        raw *= 0.5;
        this.showFloatingText(defender.sprite.x, defender.sprite.y - 55, "HỘ THỂ", "#44ddff");
      } else if (attacker.classType !== "TANKER") {
        // Non-tanker attacker increases damage by 50% (Requirement 8.1, 8.3)
        raw *= 1.5;
        this.showFloatingText(defender.sprite.x, defender.sprite.y - 55, "KHẮC CHẾ", "#ffdd44");
      }
      // Note: If attacker is TANKER and defender is not TANKER, no modifier is applied
    }

    let isPhysicalCrit = false;
    if (attacker && damageType === "physical") {
      if (Math.random() < attacker.mods.critPct) {
        isPhysicalCrit = true;
        raw *= 1.5;
        this.showFloatingText(attacker.sprite.x, attacker.sprite.y - 45, "BẠO KÍCH", "#ffd785");
      }
    }

    let final = raw;
    if (damageType === "physical") {
      if (isPhysicalCrit) {
        // Bạo kích xuyên giáp: giữ đúng 150% raw và bỏ qua giảm sát thương bởi DEF.
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

    // Tướng tier cao (vàng nhiều): thêm chance choáng
    if (attacker && !options.noStunBonus && defender.alive) {
      const tierStunChance = attacker.tier >= 5 ? 0.30 : attacker.tier >= 4 ? 0.20 : 0;
      if (tierStunChance > 0 && Math.random() < tierStunChance) {
        defender.statuses.stun = Math.max(defender.statuses.stun, 1);
        this.showFloatingText(defender.sprite.x, defender.sprite.y - 65, "CHOÁNG", "#ffd97b");
        this.updateCombatUnitUi(defender);
      }
    }

    final *= this.globalDamageMult;
    final = Math.max(1, Math.round(final));

    let damageLeft = final;
    if (defender.shield > 0) {
      const absorbed = Math.min(defender.shield, damageLeft);
      defender.shield -= absorbed;
      damageLeft -= absorbed;
      this.vfx?.pulseAt(defender.sprite.x, defender.sprite.y - 10, 0x8ce9ff, 14, 180);
      this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, `HẤP THỤ ${absorbed}`, "#86e8ff");
    }

    if (damageLeft > 0) {
      defender.hp = Math.max(0, defender.hp - damageLeft);
      this.audioFx.play("hit");
      this.vfx?.pulseAt(defender.sprite.x, defender.sprite.y - 10, 0xff8f8f, 14, 180);
      this.showDamageNumber(defender.sprite.x, defender.sprite.y - 45, damageLeft, {
        damageType,
        isCrit: isPhysicalCrit
      });
      // Viền đỏ nháy khi bị dính đòn
      this.flashHitBorder(defender);
    }

    // Attacker only gains rage when damage is actually dealt (damageLeft > 0)
    // Non-Mage classes DO NOT gain rage from skill hits. Mages DO gain rage from skill hits.
    const canGainRage = !options.noRage && (!options.isSkill || attacker?.classType === "MAGE");

    if (attacker && canGainRage && damageLeft > 0) {
      const gain = attacker.side === "RIGHT" ? getAISettings(this.aiMode).rageGain : 1;
      // Clamp rage to rageMax (Requirement 26.1)
      attacker.rage = Math.min(attacker.rageMax || 5, (attacker.rage || 0) + gain);
    }
    // Defender always gains rage when attacked (even on miss)
    if (!options.noRage) {
      // Clamp rage to rageMax (Requirement 26.1)
      defender.rage = Math.min(defender.rageMax || 5, (defender.rage || 0) + 1);
    }

    if (!options.noAutoCast) {
      this.scheduleTankAutoCast(defender, attacker);
    }

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
      if (attacker.range <= 1 && defender.statuses.counterTurns > 0) {
        this.addLog(`${defender.name} húc trả ${attacker.name}!`);
        this.basicAttack(defender, attacker, { noCounter: true });
      }
    }

    if (attacker && attacker.mods.lifestealPct > 0 && damageLeft > 0) {
      const heal = Math.round(damageLeft * attacker.mods.lifestealPct);
      if (heal > 0) this.healUnit(attacker, attacker, heal, "HÚT MÁU");
    }

    if (defender.hp <= 0) {
      defender.alive = false;
      defender.hp = 0;
      defender.shield = 0;
      defender.sprite.setFillStyle(0x3a3a3a, 0.92);
      defender.tag.setColor("#9a9a9a");
      defender.tagBg.setFillStyle(0x101620, 0.78);
      defender.starLabel.setColor("#9a9a9a");
      defender.hpBarFill.setFillStyle(0x676f77, 0.9);
      defender.rageBarFill.setFillStyle(0x676f77, 0.85);
      defender.shieldBar.setFillStyle(0x676f77, 0.8);
      defender.statusLabel.setColor("#9a9a9a");
      this.audioFx.play("ko", 0.12);
      this.vfx?.pulseAt(defender.sprite.x, defender.sprite.y - 10, 0xffffff, 20, 320);
      this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, "HẠ GỤC", "#ffffff");
      if (defender.side === "RIGHT" && attacker?.side !== "RIGHT") {
        this.recordEnemyLootDrop(defender);
      }

      // Recalculate combat speed multiplier when unit dies (Requirement 11.4)
      this.combatSpeedMultiplier = this.calculateCombatSpeedMultiplier();
    }

    this.updateCombatUnitUi(defender);
    if (attacker) this.updateCombatUnitUi(attacker);
    if (reason) this.showFloatingText(attacker ? attacker.sprite.x : defender.sprite.x, (attacker ? attacker.sprite.y : defender.sprite.y) - 37, reason, "#ffe8ae");
    return damageLeft;
  }

  scheduleTankAutoCast(tank, preferredTarget = null) {
    if (!tank?.alive) return;
    if (tank.classType !== "TANKER") return;
    if ((tank.statuses?.silence ?? 0) > 0) return;
    if (!Number.isFinite(tank.rage) || !Number.isFinite(tank.rageMax) || tank.rage < tank.rageMax) return;
    if (tank._isAutoCastingTankSkill) return;
    const skill = SKILL_LIBRARY[tank.skillId];
    if (!skill) return;

    const fallbackTarget = preferredTarget?.alive ? preferredTarget : this.selectTarget(tank, { deterministic: true });
    if (!fallbackTarget) return;

    tank._isAutoCastingTankSkill = true;
    this.time.delayedCall(0, async () => {
      try {
        if (!tank.alive || (tank.statuses?.silence ?? 0) > 0) return;
        if (tank.rage < tank.rageMax) return;
        const target = preferredTarget?.alive ? preferredTarget : this.selectTarget(tank, { deterministic: true });
        if (!target) return;

        tank.rage = 0;
        this.updateCombatUnitUi(tank);
        this.vfx?.pulseAt(tank.sprite.x, tank.sprite.y - 10, 0x9bdcff, 14, 200);
        this.showFloatingText(tank.sprite.x, tank.sprite.y - 62, "TỰ TUNG CHIÊU", "#9bdcff");
        this.addLog(`${tank.name} tự kích hoạt ${skill.name}!`);
        await this.applySkillEffect(tank, target, skill);
      } catch (error) {
        console.error("[Tank Auto-Cast] Failed to auto-cast skill:", error);
      } finally {
        tank._isAutoCastingTankSkill = false;
        this.updateCombatUnitUi(tank);
      }
    });
  }

  addShield(target, amount) {
    // Validate inputs (Requirement 26.3)
    if (!target || !target.alive) return;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
      console.error(`[Combat Error] Invalid shield amount: ${amount}, using fallback 0`);
      amount = 0;
    }

    const val = Math.max(1, Math.round(amount));
    target.shield += val;
    this.vfx?.pulseAt(target.sprite.x, target.sprite.y - 10, 0x8ce9ff, 18, 220);
    this.showFloatingText(target.sprite.x, target.sprite.y - 45, `KHIÊN +${val}`, "#8ce9ff");
    this.updateCombatUnitUi(target);
  }

  healUnit(caster, target, amount, reason) {
    // Validate inputs (Requirement 26.3)
    if (!target || !target.alive) return 0;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
      console.error(`[Combat Error] Invalid heal amount: ${amount}, using fallback 0`);
      amount = 0;
    }

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
    unit.rageBarFill.width = Math.max(0, rageInnerW * rageRatio);
    unit.rageBarFill.setFillStyle(unit.alive ? 0xf3d66b : 0x676f77, unit.alive ? 0.96 : 0.85);

    // Rage segments
    unit.rageGrid.clear();
    if (unit.rageMax > 0 && unit.alive) {
      unit.rageGrid.lineStyle(2, 0x7ec4ff, 0.95);
      const step = rageInnerW / unit.rageMax;
      const startX = unit.rageBarBg.x - rageInnerW / 2;
      for (let i = 1; i < unit.rageMax; i++) {
        const x = startX + step * i;
        unit.rageGrid.beginPath();
        unit.rageGrid.moveTo(x, unit.rageBarBg.y - 2.5);
        unit.rageGrid.lineTo(x, unit.rageBarBg.y + 2.5);
        unit.rageGrid.strokePath();
      }
    }

    // Effect bars
    unit.buffBar.clear();
    unit.debuffBar.clear();
    if (unit.alive) {
      const maxBuff = Math.max(
        unit.statuses.atkBuffTurns,
        unit.statuses.defBuffTurns,
        unit.statuses.mdefBuffTurns,
        unit.statuses.reflectTurns,
        unit.statuses.tauntTurns > 0 && !unit.statuses.tauntTargetId ? unit.statuses.tauntTurns : 0
      );
      if (maxBuff > 0) {
        const barW = 56;
        const segW = Math.max(3, Math.floor((barW - 2) / 5)); // max 5 segments
        const count = Math.min(5, maxBuff);
        const startX = unit.hpBarBg.x - barW / 2;
        const y = unit.hpBarBg.y + 13; // Below rage bar
        unit.buffBar.fillStyle(0x9dffba, 0.9);
        for (let i = 0; i < count; i++) {
          unit.buffBar.fillRect(startX + i * (segW + 1), y, segW, 3);
        }
      }

      const maxDebuff = Math.max(
        unit.statuses.poisonTurns,
        unit.statuses.burnTurns,
        unit.statuses.stun,
        unit.statuses.freeze,
        unit.statuses.sleep,
        unit.statuses.silence,
        unit.statuses.armorBreakTurns,
        unit.statuses.tauntTurns > 0 && unit.statuses.tauntTargetId ? unit.statuses.tauntTurns : 0
      );
      if (maxDebuff > 0) {
        const barW = 56;
        const segW = Math.max(3, Math.floor((barW - 2) / 5));
        const count = Math.min(5, maxDebuff);
        const startX = unit.hpBarBg.x - barW / 2;
        const y = unit.hpBarBg.y + 13 + (maxBuff > 0 ? 4 : 0); // Stack below buff if exists
        unit.debuffBar.fillStyle(0xd4bcff, 0.9);
        for (let i = 0; i < count; i++) {
          unit.debuffBar.fillRect(startX + i * (segW + 1), y, segW, 3);
        }
      }
    }

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
    if (unit.statuses.atkDebuffTurns > 0) s.push("📉");
    if (unit.statuses.reflectTurns > 0 || unit.statuses.physReflectTurns > 0) s.push("🌀");
    const statusText = s.slice(0, 5).join(" ");
    unit.statusLabel.setText(statusText);
    unit.statusLabel.setVisible(Boolean(statusText));
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
    this.turnIndicatorLayer?.clear();
    this.combatUnits.forEach((u) => {
      if (!u.alive) return;
      const roleTheme = this.getRoleTheme(u.classType);
      u.sprite.setStrokeStyle(3, roleTheme.stroke, 1);
    });
  }

  showTurnIndicator(unit) {
    if (!unit) return;
    this.showTurnIndicatorAt(unit.row, unit.col);
  }

  showTurnIndicatorAt(row, col) {
    this.turnIndicatorLayer?.clear();
    const tile = this.tileLookup?.get(gridKey(row, col));
    if (!tile) return;
    this.turnIndicatorLayer.fillStyle(0xce93d8, 0.45);
    this.turnIndicatorLayer.lineStyle(2, 0xba68c8, 0.8);
    this.drawDiamond(this.turnIndicatorLayer, tile.center.x, tile.center.y);
  }

  // ─── Combat Border Effects ───────────────────────────────────

  setCombatBorder(unit, type) {
    if (!unit?.sprite) return;
    const tile = this.tileLookup?.get(gridKey(unit.row, unit.col));
    if (type === "skill") {
      // Set initial RGB color immediately
      const initColor = Phaser.Display.Color.HSLToColor(0, 1, 0.55).color;
      unit.sprite.setStrokeStyle(5, initColor, 1);
      if (tile) {
        this.highlightLayer?.clear();
        this.highlightLayer?.lineStyle(4, initColor, 1);
        this.drawDiamond(this.highlightLayer, tile.center.x, tile.center.y, false);
      }
      // RGB cycling border (sprite + ô diamond) — 0.1s mỗi màu
      let hue = 0;
      unit._rgbBorderTimer = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          if (!unit.sprite?.active) return;
          hue = (hue + 60) % 360;
          const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.55).color;
          unit.sprite.setStrokeStyle(5, color, 1);
          if (tile) {
            this.highlightLayer?.clear();
            this.highlightLayer?.lineStyle(4, color, 1);
            this.drawDiamond(this.highlightLayer, tile.center.x, tile.center.y, false);
          }
        }
      });
    } else if (type === "attack") {
      // Xanh dương đậm sprite + ô vàng diamond
      unit.sprite.setStrokeStyle(5, 0x1565c0, 1);
      if (tile) {
        this.highlightLayer?.lineStyle(4, 0xffef9f, 1);
        this.drawDiamond(this.highlightLayer, tile.center.x, tile.center.y, false);
      }
    }
  }

  clearCombatBorder(unit) {
    if (!unit?.sprite) return;
    if (unit._rgbBorderTimer) {
      unit._rgbBorderTimer.destroy();
      unit._rgbBorderTimer = null;
    }
    // Clear diamond tile
    this.highlightLayer?.clear();
    const roleTheme = this.getRoleTheme(unit.classType);
    unit.sprite?.setStrokeStyle?.(3, roleTheme.stroke, 1);
  }

  flashHitBorder(unit) {
    if (!unit?.sprite?.active) return;
    unit.sprite.setStrokeStyle(5, 0xff1744, 1);
    this.time.delayedCall(180, () => {
      if (!unit.sprite?.active) return;
      if (unit._rgbBorderTimer) return;
      const roleTheme = this.getRoleTheme(unit.classType);
      unit.sprite?.setStrokeStyle?.(3, roleTheme.stroke, 1);
    });
  }

  tweenCombatUnit(unit, x, y, duration) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: unit.sprite,
        x,
        y,
        duration: this.scaleCombatDuration(duration),
        ease: "Sine.easeInOut",
        onUpdate: () => {
          this.syncCombatLabels(unit);
          if (this.previewHoverUnit?.uid === unit.uid) {
            this.showAttackPreviewForUnit(unit);
          }
        },
        onComplete: () => resolve()
      });
    });
  }

  syncCombatLabels(unit) {
    unit.icon.x = unit.sprite.x;
    unit.icon.y = unit.sprite.y - 10;
    unit.tagBg.x = unit.sprite.x;
    unit.tagBg.y = unit.sprite.y - 47;
    unit.tag.x = unit.sprite.x;
    unit.tag.y = unit.sprite.y - 47;
    unit.starLabel.x = unit.sprite.x + 20;
    unit.starLabel.y = unit.sprite.y - 31;
    unit.hpBarBg.x = unit.sprite.x;
    unit.hpBarBg.y = unit.sprite.y + 11;
    unit.hpBarFill.x = unit.sprite.x - unit.hpBarBg.width / 2 + 1;
    unit.hpBarFill.y = unit.sprite.y + 11;
    unit.shieldBar.x = unit.sprite.x - unit.hpBarBg.width / 2 + 1;
    unit.shieldBar.y = unit.sprite.y + 11;
    unit.rageBarBg.x = unit.sprite.x;
    unit.rageBarBg.y = unit.sprite.y + 18;
    unit.rageBarFill.x = unit.sprite.x - unit.rageBarBg.width / 2 + 1;
    unit.rageBarFill.y = unit.sprite.y + 18;
    unit.statusLabel.x = unit.sprite.x;
    unit.statusLabel.y = unit.sprite.y + 24;
    unit.sprite.setDepth(unit.sprite.y + 10);
    unit.icon.setDepth(unit.sprite.y + 12);
    unit.tagBg.setDepth(unit.sprite.y + 11);
    unit.tag.setDepth(unit.sprite.y + 11);
    unit.starLabel.setDepth(unit.sprite.y + 13);
    unit.hpBarBg.setDepth(unit.sprite.y + 11);
    unit.hpBarFill.setDepth(unit.sprite.y + 12);
    unit.shieldBar.setDepth(unit.sprite.y + 13);
    unit.rageBarBg.setDepth(unit.sprite.y + 11);
    unit.rageBarFill.setDepth(unit.sprite.y + 12);
    unit.statusLabel.setDepth(unit.sprite.y + 11);
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.time.delayedCall(this.scaleCombatDuration(ms), resolve);
    });
  }

  showDamageNumber(x, y, amount, options = {}) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    if (value <= 0) return;
    const damageType = options.damageType ?? "physical";
    const isCrit = options.isCrit === true;
    const color = damageType === "magic" ? "#d9a6ff" : damageType === "true" ? "#f2f7ff" : "#ff9b9b";
    const stroke = damageType === "magic" ? "#34164b" : "#20101a";
    const fontSize = isCrit ? 26 : 18;

    // Clean up expired damage numbers (older than 2000ms)
    const now = Date.now();
    this.activeDamageNumbers = this.activeDamageNumbers.filter(dn => now - dn.timestamp < 2000);

    // Check for overlapping damage numbers within 30 pixels
    const OVERLAP_THRESHOLD = 40;
    const OFFSET_AMOUNT = 28;
    let adjustedY = y;

    for (const activeDN of this.activeDamageNumbers) {
      const dx = Math.abs(activeDN.x - x);
      const dy = Math.abs(activeDN.y - adjustedY);

      // If within overlap threshold, offset the y-position
      if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
        adjustedY -= OFFSET_AMOUNT;
      }
    }

    // Track this damage number
    this.activeDamageNumbers.push({
      x,
      y: adjustedY,
      timestamp: now
    });

    const label = this.add.text(x, adjustedY, `-${value}${isCrit ? "!" : ""}`, {
      fontFamily: UI_FONT,
      fontSize: `${fontSize}px`,
      fontStyle: "bold",
      color,
      stroke,
      strokeThickness: isCrit ? 7 : 5
    }).setOrigin(0.5);
    label.setDepth(4300);
    if (isCrit) label.setScale(0.72);
    this.combatSprites.push(label);
    this.tweens.add({
      targets: label,
      y: adjustedY - (isCrit ? 44 : 34),
      alpha: 0,
      scale: isCrit ? 1.12 : 1.0,
      duration: isCrit ? 7500 : 6000,
      hold: 800, // Giữ nguyên 800ms trước khi bắt đầu mờ
      ease: "Sine.easeIn",
      onComplete: () => {
        if (label && label.destroy) label.destroy();
      }
    });
  }

  showFloatingText(x, y, text, color = "#ffffff") {
    if (this.vfx) {
      this.vfx.textPop(x, y, text, color);
      return;
    }
    const label = this.add.text(x - 10, y, text, {
      fontFamily: "Consolas",
      fontSize: "14px",
      fontStyle: "bold",
      color,
      stroke: "#000000",
      strokeThickness: 4
    });
    label.setDepth(4000);
    this.combatSprites.push(label);
    this.tweens.add({
      targets: label,
      y: y - 30,
      alpha: 0,
      duration: 2700,
      hold: 500, // Giữ nguyên 500ms trước khi mờ
      ease: "Sine.easeIn",
      onComplete: () => {
        if (label && label.destroy) label.destroy();
      }
    });
  }

  resolveCombat(winnerSide) {
    if (this.phase !== PHASE.COMBAT) return;
    this.toggleSettingsOverlay(false);
    this.phase = PHASE.PLANNING;
    const rightSurvivors = this.getCombatUnits("RIGHT").length;
    const rightTeamUnits = Array.isArray(this.combatUnits)
      ? this.combatUnits.filter((u) => u?.side === "RIGHT")
      : [];
    const winGoldBase = rightTeamUnits.length;
    const winGoldStarBonus = rightTeamUnits.reduce((sum, unit) => {
      const star = Number.isFinite(unit?.star) ? Math.floor(unit.star) : 1;
      return sum + Math.max(0, star - 1);
    }, 0);
    const result = {
      winnerSide,
      round: this.player.round,
      rightSurvivors,
      damage: Math.max(1, Math.min(4, rightSurvivors || 1)),
      goldDelta: 0,
      goldBase: winGoldBase,
      goldStarBonus: winGoldStarBonus,
      lootDrops: Array.isArray(this.combatLootDrops) ? [...this.combatLootDrops] : []
    };

    if (winnerSide === "LEFT") {
      result.goldDelta = winGoldBase + winGoldStarBonus;
      this.addLog(
        `Thắng vòng ${this.player.round}. +${result.goldDelta} vàng (${winGoldBase} theo số tướng địch +${winGoldStarBonus} thưởng sao).`
      );
    } else if (winnerSide === "DRAW") {
      result.damage = 0;
      this.addLog(`Hòa vòng ${this.player.round}. Hai bên vẫn còn quân.`);
    } else {
      this.addLog(`Thua vòng ${this.player.round}. Toàn đội đã bị hạ gục.`);
    }

    this.clearCombatSprites();
    this.scene.start("PlanningScene", {
      restoredState: this.runStatePayload,
      combatResult: result
    });
  }

  gridToScreen(col, row) {
    const visualCol = this.toVisualCol(col);
    const { tileW, tileH } = this.getTileSize();
    const x = this.originX + this.boardPanX + (visualCol + row) * (tileW / 2);
    const y = this.originY + this.boardPanY + (row - visualCol) * (tileH / 2);
    return { x, y };
  }
}

