export const BASE_ITEMS = [
  { id: "claw", name: "Vuốt Sắc", icon: "🗡️", kind: "base" },
  { id: "bark", name: "Vỏ Cứng", icon: "🛡️", kind: "base" },
  { id: "crystal", name: "Tinh Thạch", icon: "🔮", kind: "base" },
  { id: "feather", name: "Lông Vũ", icon: "🪶", kind: "base" },
  { id: "tear", name: "Nước Mắt", icon: "💧", kind: "base" },
  { id: "belt", name: "Đai Lưng", icon: "🥋", kind: "base" }
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
    name: "Móng Vuốt",
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
    description: "Người mang +15% HP, Đốt cháy khi đánh"
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
    description: "Người mang +5% MATK, +10% HP, Đốt cháy"
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
    description: "Người mang +10% HP, +10 Nộ, +10% Hồi máu"
  },
  {
    id: "warmog_armor",
    name: "Giáp Máu",
    icon: "💚",
    pattern: ["belt", "belt", "belt", null],
    bonus: { hpPct: 0.25 },
    description: "Người mang +25% HP"
  }
];

function normalizePattern(pattern, requires = []) {
  if (Array.isArray(pattern) && pattern.length) {
    const out = Array.from({ length: 4 }, (_, idx) => pattern[idx] ?? null);
    return out;
  }
  const out = [null, null, null, null];
  for (let i = 0; i < Math.min(4, requires.length); i += 1) out[i] = requires[i] ?? null;
  return out;
}

function normalizeRecipe(recipe) {
  const pattern = normalizePattern(recipe.pattern, recipe.requires ?? []);
  const requires = Array.isArray(recipe.requires) && recipe.requires.length
    ? recipe.requires.filter(Boolean)
    : pattern.filter(Boolean);
  return {
    ...recipe,
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
