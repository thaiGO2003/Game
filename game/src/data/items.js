export const BASE_ITEMS = [
  { id: "claw", name: "Vuốt Sắc", icon: "🦷", kind: "base" },
  { id: "bark", name: "Vảy Cứng", icon: "🛡️", kind: "base" },
  { id: "crystal", name: "Tinh Thạch", icon: "🔮", kind: "base" },
  { id: "feather", name: "Lông Chim", icon: "🪶", kind: "base" },
  { id: "tear", name: "Nước Linh", icon: "💧", kind: "base" },
  { id: "belt", name: "Da Thú", icon: "🧥", kind: "base" }
];

const CRAFT_RECIPES_RAW = [
  {
    id: "death_blade",
    name: "Kiếm Vô Cực",
    icon: "⚔️",
    pattern: ["claw", "claw", "claw", null],
    bonus: { atkPct: 0.15 },
    description: "Người mang +15% ATK"
  },
  {
    id: "titan_resolve",
    name: "Quyền Năng",
    icon: "🛡️",
    pattern: ["claw", "bark", null, null],
    bonus: { atkPct: 0.05, hpPct: 0.05, defFlat: 10 },
    description: "Người mang +5% ATK, +5% HP, +10 DEF"
  },
  {
    id: "hextech_gunblade",
    name: "Kiếm Súng",
    icon: "🔫",
    pattern: ["claw", "crystal", "crystal", null],
    bonus: { atkPct: 0.05, matkPct: 0.05, lifestealPct: 0.1 },
    description: "Người mang +5% ATK/MATK, +10% Hút máu"
  },
  {
    id: "giant_slayer",
    name: "Diệt Khổng Lồ",
    icon: "🗡️",
    pattern: ["claw", "feather", null, null],
    bonus: { atkPct: 0.1, critPct: 0.1 },
    description: "Người mang +10% ATK, +10% Crit"
  },
  {
    id: "spear_shojin",
    name: "Thương Shojin",
    icon: "🔱",
    pattern: ["claw", "tear", "tear", null],
    bonus: { atkPct: 0.05, startingRage: 15 },
    description: "Người mang +5% ATK, +15 Nộ khởi đầu"
  },
  {
    id: "sterak_gage",
    name: "Móng Vuốt Thần Thú",
    icon: "🥊",
    pattern: ["claw", "belt", null, null],
    bonus: { atkPct: 0.05, hpPct: 0.1 },
    description: "Người mang +5% ATK, +10% HP"
  },
  {
    id: "bramble_vest",
    name: "Giáp Gai",
    icon: "🌵",
    pattern: ["bark", "bark", "bark", null],
    bonus: { hpPct: 0.05, defFlat: 20 },
    description: "Người mang +5% HP, +20 DEF"
  },
  {
    id: "ionic_spark",
    name: "Nỏ Sét",
    icon: "⚡",
    pattern: ["bark", "crystal", null, null],
    bonus: { matkPct: 0.05, mdefFlat: 15 },
    description: "Người mang +5% MATK, +15 MDEF"
  },
  {
    id: "quicksilver",
    name: "Khăn Giải Thuật",
    icon: "🧣",
    pattern: ["bark", "feather", "bark", null],
    bonus: { hpPct: 0.05, mdefFlat: 10, critPct: 0.05 },
    description: "Người mang +5% HP, +10 MDEF, +5% Crit"
  },
  {
    id: "frozen_heart",
    name: "Tim Băng",
    icon: "❄️",
    pattern: ["bark", "tear", "bark", null],
    bonus: { hpPct: 0.05, startingRage: 10, defFlat: 10 },
    description: "Người mang +5% HP, +10 Nộ, +10 DEF"
  },
  {
    id: "sunfire_cape",
    name: "Áo Choàng Lửa",
    icon: "🔥",
    pattern: ["bark", "belt", null, null],
    bonus: { hpPct: 0.15, burnOnHit: 1 },
    description: "Người mang +15% HP, đốt cháy khi đánh"
  },
  {
    id: "rabadon_deathcap",
    name: "Mũ Phù Thủy",
    icon: "🧙",
    pattern: ["crystal", "crystal", "crystal", "crystal"],
    bonus: { matkPct: 0.2 },
    description: "Người mang +20% MATK"
  },
  {
    id: "guinsoo_rageblade",
    name: "Cuồng Đao",
    icon: "🗡️",
    pattern: ["crystal", "feather", "feather", null],
    bonus: { matkPct: 0.05, critPct: 0.15 },
    description: "Người mang +5% MATK, +15% Crit"
  },
  {
    id: "archangel_staff",
    name: "Quyền Trượng",
    icon: "⚕️",
    pattern: ["crystal", "tear", "crystal", null],
    bonus: { matkPct: 0.1, startingRage: 15 },
    description: "Người mang +10% MATK, +15 Nộ"
  },
  {
    id: "morellonomicon",
    name: "Quỷ Thư",
    icon: "📖",
    pattern: ["crystal", "belt", null, null],
    bonus: { matkPct: 0.05, hpPct: 0.1, burnOnHit: 1 },
    description: "Người mang +5% MATK, +10% HP, đốt cháy"
  },
  {
    id: "rapid_firecannon",
    name: "Đại Bác",
    icon: "🔭",
    pattern: ["feather", "feather", "feather", "feather"],
    bonus: { critPct: 0.2, atkPct: 0.05 },
    description: "Người mang +20% Crit, +5% ATK"
  },
  {
    id: "statikk_shiv",
    name: "Dao Điện",
    icon: "⚡",
    pattern: ["feather", "tear", "feather", null],
    bonus: { critPct: 0.1, startingRage: 10, matkPct: 0.05 },
    description: "Người mang +10% Crit, +10 Nộ, +5% MATK"
  },
  {
    id: "zzrot_portal",
    name: "Thông Đạo",
    icon: "👾",
    pattern: ["feather", "belt", null, null],
    bonus: { hpPct: 0.1, atkPct: 0.05, defFlat: 5 },
    description: "Người mang +10% HP, +5% ATK, +5 DEF"
  },
  {
    id: "blue_buff",
    name: "Bùa Xanh",
    icon: "🟦",
    pattern: ["tear", "tear", "tear", "tear"],
    bonus: { startingRage: 30 },
    description: "Người mang +30 Nộ khởi đầu"
  },
  {
    id: "redemption",
    name: "Dây Chuyền",
    icon: "✝️",
    pattern: ["tear", "belt", null, null],
    bonus: { hpPct: 0.1, startingRage: 10, healPct: 0.1 },
    description: "Người mang +10% HP, +10 Nộ, +10% hồi máu"
  },
  {
    id: "warmog_armor",
    name: "Giáp Máu",
    icon: "💚",
    pattern: ["belt", "belt", "belt", null],
    bonus: { hpPct: 0.25 },
    description: "Người mang +25% HP"
  },

  {
    id: "dragon_heart",
    name: "Trái Tim Rồng",
    icon: "🐉",
    gridSize: 3,
    pattern: [
      "claw", "crystal", "claw",
      "belt", "tear", "belt",
      "bark", "feather", "bark"
    ],
    bonus: { atkPct: 0.22, hpPct: 0.18, critPct: 0.12 },
    description: "Người mang +22% ATK, +18% HP, +12% Crit"
  },
  {
    id: "storm_crown",
    name: "Vương Miện Bão Tố",
    icon: "👑",
    gridSize: 3,
    pattern: [
      "crystal", "feather", "crystal",
      "tear", "crystal", "tear",
      null, "feather", null
    ],
    bonus: { matkPct: 0.28, startingRage: 25, mdefFlat: 20 },
    description: "Người mang +28% MATK, +25 Nộ, +20 MDEF"
  },
  {
    id: "titan_shell",
    name: "Mai Titan",
    icon: "🐢",
    gridSize: 3,
    pattern: [
      "bark", "bark", "bark",
      "bark", "belt", "bark",
      "tear", "bark", "tear"
    ],
    bonus: { hpPct: 0.4, defFlat: 35, mdefFlat: 20 },
    description: "Người mang +40% HP, +35 DEF, +20 MDEF"
  },
  {
    id: "bloodfang_reaper",
    name: "Huyết Nha",
    icon: "🩸",
    gridSize: 3,
    pattern: [
      "claw", null, "claw",
      "belt", "claw", "belt",
      null, "tear", null
    ],
    bonus: { atkPct: 0.2, lifestealPct: 0.22, critPct: 0.1 },
    description: "Người mang +20% ATK, +22% hút máu, +10% Crit"
  },
  {
    id: "phoenix_plume",
    name: "Lông Phượng",
    icon: "🐦‍🔥",
    gridSize: 3,
    pattern: [
      "feather", "feather", "feather",
      null, "crystal", null,
      "tear", "belt", "tear"
    ],
    bonus: { matkPct: 0.2, healPct: 0.18, startingRage: 20 },
    description: "Người mang +20% MATK, +18% hồi máu, +20 Nộ"
  },
  {
    id: "void_engine",
    name: "Lõi Hư Không",
    icon: "🌌",
    gridSize: 3,
    pattern: [
      "crystal", "tear", "crystal",
      "claw", "crystal", "claw",
      "feather", "tear", "feather"
    ],
    bonus: { atkPct: 0.12, matkPct: 0.12, critPct: 0.15, startingRage: 10 },
    description: "Người mang +12% ATK/MATK, +15% Crit, +10 Nộ"
  },
  {
    id: "gaia_oath",
    name: "Thệ Ước Đại Địa",
    icon: "🌿",
    gridSize: 3,
    pattern: [
      "belt", "bark", "belt",
      "tear", "crystal", "tear",
      "belt", "bark", "belt"
    ],
    bonus: { hpPct: 0.3, healPct: 0.12, shieldStart: 100 },
    description: "Người mang +30% HP, +12% hồi máu, +100 khiên đầu trận"
  },
  {
    id: "thunder_pike",
    name: "Thương Lôi",
    icon: "⚡",
    gridSize: 3,
    pattern: [
      "feather", "claw", "feather",
      null, "tear", null,
      "claw", "crystal", "claw"
    ],
    bonus: { atkPct: 0.18, critPct: 0.2, startingRage: 15 },
    description: "Người mang +18% ATK, +20% Crit, +15 Nộ"
  }
];

function resolveGridSize(recipe) {
  const raw = Number.isFinite(recipe?.gridSize) ? Math.floor(recipe.gridSize) : null;
  if (raw === 3 || raw === 2) return raw;
  if (Array.isArray(recipe?.pattern) && recipe.pattern.length >= 9) return 3;
  return 2;
}

function normalizePattern(pattern, gridSize, requires = []) {
  const maxCells = gridSize * gridSize;
  if (Array.isArray(pattern) && pattern.length) {
    return Array.from({ length: maxCells }, (_, idx) => pattern[idx] ?? null);
  }
  const out = Array.from({ length: maxCells }, () => null);
  for (let i = 0; i < Math.min(maxCells, requires.length); i += 1) out[i] = requires[i] ?? null;
  return out;
}

function normalizeRecipe(recipe) {
  const gridSize = resolveGridSize(recipe);
  const pattern = normalizePattern(recipe.pattern, gridSize, recipe.requires ?? []);
  const requires = Array.isArray(recipe.requires) && recipe.requires.length
    ? recipe.requires.filter(Boolean)
    : pattern.filter(Boolean);
  return {
    ...recipe,
    gridSize,
    pattern,
    requires
  };
}

export const CRAFT_RECIPES = CRAFT_RECIPES_RAW.map((recipe) => normalizeRecipe(recipe));

export const EQUIPMENT_ITEMS = CRAFT_RECIPES.map((recipe) => ({
  id: `eq_${recipe.id}`,
  name: recipe.name,
  icon: recipe.icon,
  kind: "equipment",
  fromRecipe: recipe.id,
  bonus: { ...(recipe.bonus ?? {}) }
}));

export const ITEM_BY_ID = Object.fromEntries([...BASE_ITEMS, ...EQUIPMENT_ITEMS].map((x) => [x.id, x]));
export const RECIPE_BY_ID = Object.fromEntries(CRAFT_RECIPES.map((x) => [x.id, x]));
