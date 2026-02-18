import Phaser from "phaser";
import { UNIT_CATALOG, UNIT_BY_ID } from "../data/unitCatalog.js";
import { SKILL_LIBRARY } from "../data/skills.js";
import { AUGMENT_LIBRARY, AUGMENT_ROUNDS } from "../data/augments.js";
import { CLASS_SYNERGY, TRIBE_SYNERGY } from "../data/synergies.js";
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

const TILE_W = 110;
const TILE_H = 56;
const ROWS = 5;
const COLS = 10;
const PLAYER_COLS = 5;
const RIGHT_COL_START = 5;
const RIGHT_COL_END = 9;

const PHASE = {
  PLANNING: "PLANNING",
  AUGMENT: "AUGMENT",
  COMBAT: "COMBAT",
  GAME_OVER: "GAME_OVER"
};

const AI_SETTINGS = {
  EASY: {
    label: "Easy",
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
    label: "Medium",
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
    label: "Hard",
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
  TANKER: 0x91d7a2,
  ASSASSIN: 0x6fd4ff,
  ARCHER: 0xf4dc7a,
  MAGE: 0xd3adff,
  SUPPORT: 0x9df2ca,
  FIGHTER: 0xffba88
};

const LEVEL_LABEL = { EASY: "1", MEDIUM: "2", HARD: "3" };

export class BoardPrototypeScene extends Phaser.Scene {
  constructor() {
    super("BoardPrototypeScene");
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
  }

  create() {
    this.cameras.main.setBackgroundColor("#10141b");
    this.drawBoard();
    this.createHud();
    this.createButtons();
    this.createPlayerCellZones();
    this.createBenchSlots();
    this.setupInput();

    this.combatTickEvent = this.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => {
        if (this.phase === PHASE.COMBAT) this.stepCombat();
      }
    });

    this.startNewRun();
  }

  setupInput() {
    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.phase === PHASE.COMBAT) this.stepCombat();
      if (this.phase === PHASE.PLANNING) this.beginCombat();
    });
    this.input.keyboard.on("keydown-R", () => this.startNewRun());
    this.input.keyboard.on("keydown-ONE", () => this.setAIMode("EASY"));
    this.input.keyboard.on("keydown-TWO", () => this.setAIMode("MEDIUM"));
    this.input.keyboard.on("keydown-THREE", () => this.setAIMode("HARD"));
    this.input.keyboard.on("keydown-NUMPAD_ONE", () => this.setAIMode("EASY"));
    this.input.keyboard.on("keydown-NUMPAD_TWO", () => this.setAIMode("MEDIUM"));
    this.input.keyboard.on("keydown-NUMPAD_THREE", () => this.setAIMode("HARD"));
  }

  setAIMode(mode) {
    if (!AI_SETTINGS[mode]) return;
    this.aiMode = mode;
    this.addLog(`AI mode -> ${AI_SETTINGS[mode].label}`);
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

    this.player = {
      hp: 100,
      gold: 10,
      xp: 0,
      level: 1,
      round: 1,
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
      extraTribeCount: 0
    };

    this.seedStarterUnits();
    this.refreshShop(true);
    this.enterPlanning(false);
    this.addLog("Khoi tao game moi: Ban chu khu rung.");
  }

  createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array.from({ length: PLAYER_COLS }, () => null));
  }

  seedStarterUnits() {
    const tierOne = UNIT_CATALOG.filter((u) => u.tier === 1);
    const picks = sampleWithoutReplacement(tierOne, 3);
    picks.forEach((base) => {
      this.player.bench.push(this.createOwnedUnit(base.id, 1));
    });
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

  drawBoard() {
    this.originX = this.scale.width * 0.5;
    this.originY = 160;

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const center = this.gridToScreen(col, row);
        const isLeft = col < PLAYER_COLS;
        const fill = isLeft ? 0x203f2a : 0x4a2b24;
        const stroke = isLeft ? 0x6dbf85 : 0xe78c80;

        const tile = this.add.graphics();
        tile.fillStyle(fill, 0.77);
        tile.lineStyle(2, stroke, 1);
        this.drawDiamond(tile, center.x, center.y);
        const label = this.add.text(center.x - 18, center.y - 10, `${row},${col}`, {
          fontFamily: "Consolas",
          fontSize: "13px",
          color: "#e4edf7"
        });
        label.setDepth(center.y + 1);

        this.tileLookup.set(gridKey(row, col), { tile, center, label });
      }
    }

    this.highlightLayer = this.add.graphics();
    this.highlightLayer.setDepth(999);
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

  createHud() {
    this.titleText = this.add.text(30, 20, "Forest Throne - Ba Chu Khu Rung", {
      fontFamily: "Trebuchet MS",
      fontSize: "28px",
      color: "#f4f1d2",
      fontStyle: "bold"
    });
    this.titleText.setDepth(2000);

    this.ruleText = this.add.text(30, 58, "Scan: LEFT row0->4 col4->0 | RIGHT row0->4 col5->9", {
      fontFamily: "Consolas",
      fontSize: "16px",
      color: "#97b8ff"
    });
    this.ruleText.setDepth(2000);

    this.headerText = this.add.text(30, 86, "", {
      fontFamily: "Consolas",
      fontSize: "18px",
      color: "#eef4ff"
    });
    this.headerText.setDepth(2000);

    this.phaseText = this.add.text(30, 112, "", {
      fontFamily: "Consolas",
      fontSize: "17px",
      color: "#a8f2d1"
    });
    this.phaseText.setDepth(2000);

    this.synergyText = this.add.text(this.scale.width - 380, 120, "", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#cfe4ff",
      lineSpacing: 4
    });
    this.synergyText.setDepth(2000);

    this.logText = this.add.text(this.scale.width - 380, 330, "", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#f7f7f7",
      lineSpacing: 5
    });
    this.logText.setDepth(2000);

    this.queueText = this.add.text(this.scale.width - 380, 560, "", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: "#ffdca8",
      lineSpacing: 5
    });
    this.queueText.setDepth(2000);
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

  createButton(x, y, w, h, label, onClick) {
    const bg = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x223149, 0.95);
    bg.setStrokeStyle(2, 0x84c6ff, 1);
    bg.setDepth(2000);
    const text = this.add.text(x + 10, y + 8, label, {
      fontFamily: "Consolas",
      fontSize: "15px",
      color: "#e9f4ff"
    });
    text.setDepth(2001);
    const btn = {
      x,
      y,
      w,
      h,
      bg,
      text,
      enabled: true,
      setLabel: (v) => text.setText(v),
      setEnabled: (enabled) => {
        btn.enabled = enabled;
        bg.setFillStyle(enabled ? 0x223149 : 0x2a2a2a, 0.95);
        bg.setStrokeStyle(2, enabled ? 0x84c6ff : 0x6f6f6f, 1);
        text.setColor(enabled ? "#e9f4ff" : "#a0a0a0");
      },
      setVisible: (visible) => {
        bg.setVisible(visible);
        text.setVisible(visible);
      }
    };

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      if (btn.enabled) bg.setFillStyle(0x2f4466, 0.95);
    });
    bg.on("pointerout", () => {
      if (btn.enabled) bg.setFillStyle(0x223149, 0.95);
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
        this.removeOwnedUnitRefs(picked);
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
    this.refreshQueuePreview();
    this.addLog(`Combat round ${this.player.round} start.`);
  }

  spawnPlayerCombatUnits() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < PLAYER_COLS; col += 1) {
        const owned = this.player.board[row][col];
        if (!owned) continue;
        const unit = this.createCombatUnit(owned, "LEFT", row, col);
        this.combatUnits.push(unit);
      }
    }
  }

  spawnEnemyCombatUnits() {
    const ai = this.getAI();
    const estimateLevel = clamp(1 + Math.floor(this.player.round / 2) + (ai.levelBonus ?? 0), 1, 9);
    const count = this.computeEnemyTeamSize(ai, estimateLevel);
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
      const unit = this.createCombatUnit(owned, "RIGHT", pos.row, pos.col);
      this.combatUnits.push(unit);
    });
  }

  createCombatUnit(owned, side, row, col) {
    const baseStats = scaledBaseStats(owned.base.stats, owned.star);
    const ai = this.getAI();
    const hpBase = side === "RIGHT" ? Math.round(baseStats.hp * ai.hpMult) : baseStats.hp;
    const atkBase = side === "RIGHT" ? Math.round(baseStats.atk * ai.atkMult) : baseStats.atk;
    const matkBase = side === "RIGHT" ? Math.round(baseStats.matk * ai.matkMult) : baseStats.matk;

    const hpWithAug = side === "LEFT" ? Math.round(hpBase * (1 + this.player.teamHpPct)) : hpBase;
    const atkWithAug = side === "LEFT" ? Math.round(atkBase * (1 + this.player.teamAtkPct)) : atkBase;
    const matkWithAug = side === "LEFT" ? Math.round(matkBase * (1 + this.player.teamMatkPct)) : matkBase;

    const point = this.gridToScreen(col, row);
    const color = side === "LEFT" ? CLASS_COLORS[owned.base.classType] ?? 0xffffff : 0xffa099;
    const sprite = this.add.circle(point.x, point.y - 10, 18, color, 1);
    sprite.setStrokeStyle(3, 0x161a20, 1);
    sprite.setDepth(point.y + 10);

    const tag = this.add.text(point.x - 35, point.y - 48, `${owned.base.name}\n${owned.star}*`, {
      fontFamily: "Consolas",
      fontSize: "10px",
      color: "#ffffff",
      lineSpacing: 2
    });
    tag.setDepth(point.y + 11);

    const hpLabel = this.add.text(point.x - 35, point.y - 20, "", {
      fontFamily: "Consolas",
      fontSize: "10px",
      color: "#d3ffd6"
    });
    hpLabel.setDepth(point.y + 11);

    const rageLabel = this.add.text(point.x - 35, point.y + 16, "", {
      fontFamily: "Consolas",
      fontSize: "10px",
      color: "#dde8ff"
    });
    rageLabel.setDepth(point.y + 11);

    const statusLabel = this.add.text(point.x - 35, point.y + 29, "", {
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
  }

  refreshPlanningUi() {
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
    const xpText = xpNeed === Number.POSITIVE_INFINITY ? "MAX" : `${this.player.xp}/${xpNeed}`;
    const deployText = `${this.getDeployCount()}/${this.getDeployCap()}`;
    this.headerText.setText(
      `Round:${this.player.round}  HP:${this.player.hp}  Gold:${this.player.gold}  Lv:${this.player.level} XP:${xpText}  Deploy:${deployText}  AI:${AI_SETTINGS[this.aiMode].label}`
    );
    this.phaseText.setText(`Phase: ${this.phase}`);
    this.updateLogText();
  }

  refreshButtons() {
    const planning = this.phase === PHASE.PLANNING;
    const lock = this.player.shopLocked ? "On" : "Off";
    const rollCost = Math.max(1, 2 + this.player.rollCostDelta);

    this.buttons.roll.setLabel(`Roll (${rollCost})`);
    this.buttons.xp.setLabel("Buy XP (4)");
    this.buttons.lock.setLabel(`Lock: ${lock}`);
    this.buttons.start.setLabel("Start Combat");

    this.buttons.roll.setEnabled(planning);
    this.buttons.xp.setEnabled(planning);
    this.buttons.lock.setEnabled(planning);
    this.buttons.start.setEnabled(planning && this.getDeployCount() > 0);
    this.buttons.easy.setEnabled(true);
    this.buttons.medium.setEnabled(true);
    this.buttons.hard.setEnabled(true);

    this.buttons.easy.setLabel(LEVEL_LABEL.EASY);
    this.buttons.medium.setLabel(LEVEL_LABEL.MEDIUM);
    this.buttons.hard.setLabel(LEVEL_LABEL.HARD);
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
      const bg = this.add.rectangle(x + cardW / 2, y + cardH / 2, cardW, cardH, 0x1f2a3a, 0.95);
      bg.setStrokeStyle(2, 0x6fb0ff, 1);
      bg.setDepth(1500);

      let txt = "SOLD";
      if (offer) {
        const base = UNIT_BY_ID[offer.baseId];
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
        if (this.phase === PHASE.PLANNING) bg.setFillStyle(0x2b3f5d, 0.95);
      });
      bg.on("pointerout", () => bg.setFillStyle(0x1f2a3a, 0.95));
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
      slot.bg.setStrokeStyle(2, selected ? 0xffef9a : 0x4f607c, 1);
      slot.bg.setFillStyle(selected ? 0x36466a : 0x1f2734, 0.92);

      if (!unit) {
        slot.label.setText(`[${index + 1}] Empty`);
      } else {
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
        const color = CLASS_COLORS[unit.base.classType] ?? 0xffffff;
        const sprite = this.add.circle(point.x, point.y - 10, 18, color, 1);
        sprite.setStrokeStyle(3, 0x151820, 1);
        sprite.setDepth(point.y + 15);
        const label = this.add.text(point.x - 33, point.y - 48, `${unit.base.name}\n${unit.star}*`, {
          fontFamily: "Consolas",
          fontSize: "10px",
          color: "#ffffff",
          lineSpacing: 2
        });
        label.setDepth(point.y + 16);
        this.planningSprites.push(sprite, label);
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
      .map((key) => `Class ${key}: ${summary.classCounts[key]}`);
    const tribeLines = Object.keys(summary.tribeCounts)
      .sort((a, b) => summary.tribeCounts[b] - summary.tribeCounts[a])
      .map((key) => `Tribe ${key}: ${summary.tribeCounts[key]}`);
    const aug = this.player.augments.length ? this.player.augments.join(", ") : "none";
    this.synergyText.setText(
      `Synergy Preview\n\n${classLines.join("\n") || "Class none"}\n\n${tribeLines.join("\n") || "Tribe none"}\n\nAugments:\n${aug}`
    );
  }

  refreshQueuePreview() {
    if (this.phase !== PHASE.COMBAT) {
      this.queueText.setText("");
      return;
    }
    const next = [];
    for (let i = 0; i < 8; i += 1) {
      const idx = this.turnIndex + i;
      if (idx >= this.turnQueue.length) break;
      const unit = this.turnQueue[idx];
      if (!unit || !unit.alive) continue;
      next.push(`${i + 1}. ${unit.name} (${unit.side})`);
    }
    this.queueText.setText(`Queue\n${next.join("\n")}`);
  }

  addLog(message) {
    this.logs.push(message);
    while (this.logs.length > 9) this.logs.shift();
    this.updateLogText();
  }

  updateLogText() {
    this.logText.setText(`Logs\n${this.logs.join("\n")}`);
  }

  getAI() {
    return AI_SETTINGS[this.aiMode];
  }

  computeEnemyTeamSize(ai, estimateLevel) {
    const base = getDeployCapByLevel(estimateLevel);
    const flatBonus = ai?.teamSizeBonus ?? 0;
    const growthEvery = Math.max(1, ai?.teamGrowthEvery ?? 4);
    const growthCap = Math.max(0, ai?.teamGrowthCap ?? 2);
    const roundGrowth = clamp(Math.floor((this.player.round - 1) / growthEvery), 0, growthCap);
    return clamp(base + flatBonus + roundGrowth, 2, 12);
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

  selectTarget(attacker) {
    const enemySide = attacker.side === "LEFT" ? "RIGHT" : "LEFT";
    const enemies = this.getCombatUnits(enemySide);
    if (!enemies.length) return null;

    if (attacker.statuses.tauntTargetId) {
      const forced = enemies.find((e) => e.uid === attacker.statuses.tauntTargetId);
      if (forced) return forced;
    }

    const ai = this.getAI();
    const keepFrontline = attacker.range <= 1 && attacker.classType !== "ASSASSIN";
    if (attacker.side === "RIGHT" && !keepFrontline && Math.random() < ai.randomTargetChance) {
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
    const dashPoint = this.gridToScreen(dashCol, target.row);
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
      case "random_multi": {
        const pool = enemies.filter((enemy) => enemy.alive);
        const count = Math.min(skill.maxHits ?? 3, pool.length);
        const victims = sampleWithoutReplacement(pool, count);
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
      this.showFloatingText(defender.sprite.x, defender.sprite.y - 45, `ABS ${absorbed}`, "#86e8ff");
    }

    if (damageLeft > 0) {
      defender.hp = Math.max(0, defender.hp - damageLeft);
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
      u.sprite.setStrokeStyle(3, 0x161a20, 1);
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
    unit.tag.x = unit.sprite.x - 35;
    unit.tag.y = unit.sprite.y - 38;
    unit.hpLabel.x = unit.sprite.x - 35;
    unit.hpLabel.y = unit.sprite.y - 10;
    unit.rageLabel.x = unit.sprite.x - 35;
    unit.rageLabel.y = unit.sprite.y + 26;
    unit.statusLabel.x = unit.sprite.x - 35;
    unit.statusLabel.y = unit.sprite.y + 39;
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

  resolveCombat(winnerSide) {
    if (this.phase !== PHASE.COMBAT) return;
    this.phase = PHASE.PLANNING;
    const rightSurvivors = this.getCombatUnits("RIGHT").length;

    if (winnerSide === "LEFT") {
      this.player.winStreak += 1;
      this.player.loseStreak = 0;
      const bonus = 1 + (this.player.winStreak >= 3 ? 1 : 0);
      this.player.gold += bonus;
      this.addLog(`Thang round ${this.player.round}. +${bonus} gold.`);
    } else {
      this.player.loseStreak += 1;
      this.player.winStreak = 0;
      const damage = Math.max(1, rightSurvivors + Math.floor(this.player.round / 2) - this.player.hpLossReduce);
      this.player.hp -= damage;
      this.addLog(`Thua round ${this.player.round}. -${damage} HP.`);
    }

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.phase = PHASE.GAME_OVER;
      this.clearCombatSprites();
      this.refreshHeader();
      this.addLog("Ban da that bai. Nhan New Run de choi lai.");
      return;
    }

    this.player.round += 1;
    this.clearCombatSprites();
    this.enterPlanning(true);
  }

  gridToScreen(col, row) {
    const x = this.originX + (col - row) * (TILE_W / 2) - 260;
    const y = this.originY + (col + row) * (TILE_H / 2);
    return { x, y };
  }
}
