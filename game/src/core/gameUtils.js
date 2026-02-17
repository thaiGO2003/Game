const TIER_ODDS_BY_LEVEL = {
  1: [1, 0, 0, 0, 0],
  2: [0.8, 0.2, 0, 0, 0],
  3: [0.65, 0.3, 0.05, 0, 0],
  4: [0.5, 0.35, 0.13, 0.02, 0],
  5: [0.35, 0.35, 0.22, 0.07, 0.01],
  6: [0.25, 0.3, 0.28, 0.14, 0.03],
  7: [0.18, 0.24, 0.3, 0.2, 0.08],
  8: [0.12, 0.18, 0.27, 0.26, 0.17],
  9: [0.08, 0.12, 0.2, 0.3, 0.3]
};

const XP_TO_LEVEL_UP = {
  1: 2,
  2: 4,
  3: 6,
  4: 10,
  5: 16,
  6: 24,
  7: 36,
  8: 52
};

let uidSeed = 1;

export function createUnitUid() {
  uidSeed += 1;
  return `u_${uidSeed}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function randomItem(list, rng = Math.random) {
  if (!list.length) return null;
  const idx = Math.floor(rng() * list.length);
  return list[idx];
}

export function sampleWithoutReplacement(list, count, rng = Math.random) {
  const pool = [...list];
  const result = [];
  while (pool.length && result.length < count) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export function weightedChoice(weights, rng = Math.random) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 0;
  let needle = rng() * sum;
  for (let i = 0; i < weights.length; i += 1) {
    needle -= weights[i];
    if (needle <= 0) return i;
  }
  return weights.length - 1;
}

export function rollTierForLevel(level, rng = Math.random) {
  const safeLevel = clamp(level, 1, 9);
  const odds = TIER_ODDS_BY_LEVEL[safeLevel];
  return weightedChoice(odds, rng) + 1;
}

export function getDeployCapByLevel(level) {
  // Start at 3 slots so early rounds still allow tactical swaps and additions.
  return clamp(level + 2, 3, 12);
}

export function getXpToLevelUp(level) {
  return XP_TO_LEVEL_UP[level] ?? Number.POSITIVE_INFINITY;
}

export function starMultiplier(star) {
  if (star <= 1) return 1;
  if (star === 2) return 1.6;
  return 2.5;
}

export function scaledBaseStats(baseStats, star) {
  const mult = starMultiplier(star);
  return {
    hp: Math.round(baseStats.hp * mult),
    atk: Math.round(baseStats.atk * mult),
    def: Math.round(baseStats.def * mult),
    matk: Math.round(baseStats.matk * mult),
    mdef: Math.round(baseStats.mdef * mult),
    range: baseStats.range,
    rageMax: baseStats.rageMax
  };
}

export function gridKey(row, col) {
  return `${row}:${col}`;
}

export function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}
