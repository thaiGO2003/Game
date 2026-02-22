import { UNIT_BY_ID } from "../data/unitCatalog.js";
import { createUnitUid } from "./gameUtils.js";
import { DEFAULT_LOSE_CONDITION, normalizeLoseCondition } from "./gameRules.js";

const PLAYER_TEMPLATE = {
  hp: 3,
  gold: 10,
  xp: 0,
  level: 1,
  round: 1,
  gameMode: "EndlessPvEClassic",
  winStreak: 0,
  loseStreak: 0,
  shopLocked: false,
  augments: [],
  augmentRoundsTaken: [],
  deployCapBonus: 0,
  benchBonus: 0,
  benchUpgradeLevel: 0,
  inventoryUpgradeLevel: 0,
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
  craftTableLevel: 0,
  itemBag: [],
  craftedItems: [],
  enemyPreview: [],
  enemyPreviewRound: 0,
  enemyBudget: 0,
  loseCondition: DEFAULT_LOSE_CONDITION
};

export function createEmptyBoard() {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null));
}

export function createOwnedUnit(baseId, star = 1, uid = null, equips = []) {
  const base = UNIT_BY_ID[baseId];
  if (!base) return null;
  return {
    uid: uid ?? createUnitUid(),
    baseId,
    star,
    base,
    equips: Array.isArray(equips) ? equips.filter((x) => typeof x === "string") : []
  };
}

function serializeOwnedUnit(unit) {
  if (!unit) return null;
  return {
    uid: unit.uid,
    baseId: unit.baseId,
    star: unit.star,
    equips: Array.isArray(unit.equips) ? unit.equips.filter((x) => typeof x === "string") : []
  };
}

function hydrateOwnedUnit(raw) {
  if (!raw || !UNIT_BY_ID[raw.baseId]) return null;
  return createOwnedUnit(raw.baseId, raw.star ?? 1, raw.uid, raw.equips ?? []);
}

export function createDefaultRunState() {
  const board = createEmptyBoard();
  return {
    aiMode: "MEDIUM",
    audioEnabled: true,
    player: {
      ...PLAYER_TEMPLATE,
      board,
      bench: [],
      shop: []
    }
  };
}

export function serializeRunState(state) {
  const board = state.player.board.map((row) => row.map((unit) => serializeOwnedUnit(unit)));
  return {
    aiMode: state.aiMode,
    audioEnabled: !!state.audioEnabled,
    player: {
      ...state.player,
      loseCondition: normalizeLoseCondition(state.player?.loseCondition),
      board,
      bench: state.player.bench.map((u) => serializeOwnedUnit(u)),
      shop: state.player.shop?.map((offer) => (offer ? { slot: offer.slot, baseId: offer.baseId } : null)) ?? []
    }
  };
}

export function hydrateRunState(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.player || typeof raw.player !== "object") return null;
  const state = createDefaultRunState();
  state.aiMode = raw.aiMode && ["EASY", "MEDIUM", "HARD"].includes(raw.aiMode) ? raw.aiMode : "MEDIUM";
  state.audioEnabled = raw.audioEnabled !== false;

  const p = raw.player;
  const merged = {
    ...PLAYER_TEMPLATE,
    ...p
  };

  const board = createEmptyBoard();
  if (Array.isArray(p.board)) {
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        board[r][c] = hydrateOwnedUnit(p.board?.[r]?.[c]) ?? null;
      }
    }
  }

  const bench = Array.isArray(p.bench) ? p.bench.map((u) => hydrateOwnedUnit(u)).filter(Boolean) : [];
  const shop = Array.isArray(p.shop)
    ? p.shop.map((offer, idx) => {
      if (!offer || !UNIT_BY_ID[offer.baseId]) return null;
      return { slot: Number.isInteger(offer.slot) ? offer.slot : idx, baseId: offer.baseId };
    })
    : [];

  state.player = {
    ...merged,
    board,
    bench,
    shop
  };

  state.player.level = Math.max(1, Math.min(25, state.player.level));
  state.player.round = Math.max(1, state.player.round);
  state.player.hp = Math.max(0, state.player.hp);
  state.player.loseCondition = normalizeLoseCondition(state.player.loseCondition);
  state.player.gold = Math.max(0, state.player.gold);
  state.player.benchUpgradeLevel = Number.isFinite(state.player.benchUpgradeLevel)
    ? Math.max(0, Math.min(1, Math.floor(state.player.benchUpgradeLevel)))
    : 0;
  state.player.inventoryUpgradeLevel = Number.isFinite(state.player.inventoryUpgradeLevel)
    ? Math.max(0, Math.min(1, Math.floor(state.player.inventoryUpgradeLevel)))
    : 0;
  if (!Array.isArray(state.player.itemBag)) state.player.itemBag = [];
  if (!Array.isArray(state.player.craftedItems)) state.player.craftedItems = [];
  state.player.craftTableLevel = Number.isFinite(state.player.craftTableLevel)
    ? Math.max(0, Math.min(1, Math.floor(state.player.craftTableLevel)))
    : 0;
  if (!Array.isArray(state.player.enemyPreview)) state.player.enemyPreview = [];
  state.player.enemyPreviewRound = Number.isInteger(state.player.enemyPreviewRound) ? state.player.enemyPreviewRound : 0;
  state.player.enemyBudget = Number.isFinite(state.player.enemyBudget) ? state.player.enemyBudget : 0;
  return state;
}
