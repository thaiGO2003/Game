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
    pattern: ["claw", null, null, null],
    bonus: { atkPct: 0.15 },
    description: "Người mang +15% ATK"
  },
  {
    id: "titan_resolve",
    name: "Quyền Năng",
    icon: "🛡️",
    pattern: ["claw", null, null, null],
    bonus: { atkPct: 0.05, hpPct: 0.05, defFlat: 10 },
    description: "Người mang +5% ATK, +5% HP, +10 DEF"
  },
  {
    id: "hextech_gunblade",
    name: "Kiếm Súng",
    icon: "🔫",
    pattern: ["claw", null, null, null],
    bonus: { atkPct: 0.05, matkPct: 0.05, lifestealPct: 0.1 },
    description: "Người mang +5% ATK/MATK, +10% Hút máu"
  },
  {
    id: "giant_slayer",
    name: "Diệt Khổng Lồ",
    icon: "🗡️",
    pattern: ["claw", null, null, null],
    bonus: { atkPct: 0.1, critPct: 0.1 },
    description: "Người mang +10% ATK, +10% Crit"
  },
  {
    id: "spear_shojin",
    name: "Thương Shojin",
    icon: "🔱",
    pattern: ["claw", null, null, null],
    bonus: { atkPct: 0.05, startingRage: 1 },
    description: "Người mang +5% ATK, +1 Nộ khởi đầu"
  },
  {
    id: "sterak_gage",
    name: "Móng Vuốt Thần Thú",
    icon: "🥊",
    pattern: ["claw", null, null, null],
    bonus: { atkPct: 0.05, hpPct: 0.1 },
    description: "Người mang +5% ATK, +10% HP"
  },
  {
    id: "bramble_vest",
    name: "Giáp Gai",
    icon: "🌵",
    pattern: ["bark", null, null, null],
    bonus: { hpPct: 0.05, defFlat: 20 },
    description: "Người mang +5% HP, +20 DEF"
  },
  {
    id: "ionic_spark",
    name: "Nỏ Sét",
    icon: "⚡",
    pattern: ["bark", null, null, null],
    bonus: { matkPct: 0.05, mdefFlat: 15 },
    description: "Người mang +5% MATK, +15 MDEF"
  },
  {
    id: "quicksilver",
    name: "Khăn Giải Thuật",
    icon: "🧣",
    pattern: ["bark", null, null, null],
    bonus: { hpPct: 0.05, mdefFlat: 10, critPct: 0.05 },
    description: "Người mang +5% HP, +10 MDEF, +5% Crit"
  },
  {
    id: "frozen_heart",
    name: "Tim Băng",
    icon: "❄️",
    pattern: ["bark", null, null, null],
    bonus: { hpPct: 0.05, startingRage: 1, defFlat: 10 },
    description: "Người mang +5% HP, +1 Nộ, +10 DEF"
  },
  {
    id: "sunfire_cape",
    name: "Áo Choàng Lửa",
    icon: "🔥",
    pattern: ["bark", null, null, null],
    bonus: { hpPct: 0.15, burnOnHit: 1 },
    description: "Người mang +15% HP, đốt cháy khi đánh"
  },
  {
    id: "rabadon_deathcap",
    name: "Mũ Phù Thủy",
    icon: "🧙",
    pattern: ["crystal", null, null, null],
    bonus: { matkPct: 0.2 },
    description: "Người mang +20% MATK"
  },
  {
    id: "guinsoo_rageblade",
    name: "Cuồng Đao",
    icon: "🗡️",
    pattern: ["crystal", null, null, null],
    bonus: { matkPct: 0.05, critPct: 0.15 },
    description: "Người mang +5% MATK, +15% Crit"
  },
  {
    id: "archangel_staff",
    name: "Quyền Trượng",
    icon: "⚕️",
    pattern: ["crystal", null, null, null],
    bonus: { matkPct: 0.1, startingRage: 1 },
    description: "Người mang +10% MATK, +1 Nộ"
  },
  {
    id: "morellonomicon",
    name: "Quỷ Thư",
    icon: "📖",
    pattern: ["crystal", null, null, null],
    bonus: { matkPct: 0.05, hpPct: 0.1, burnOnHit: 1 },
    description: "Người mang +5% MATK, +10% HP, đốt cháy"
  },
  {
    id: "rapid_firecannon",
    name: "Đại Bác",
    icon: "🔭",
    pattern: ["feather", null, null, null],
    bonus: { critPct: 0.2, atkPct: 0.05 },
    description: "Người mang +20% Crit, +5% ATK"
  },
  {
    id: "statikk_shiv",
    name: "Dao Điện",
    icon: "⚡",
    pattern: ["feather", null, null, null],
    bonus: { critPct: 0.1, startingRage: 1, matkPct: 0.05 },
    description: "Người mang +10% Crit, +1 Nộ, +5% MATK"
  },
  {
    id: "zzrot_portal",
    name: "Thông Đạo",
    icon: "👾",
    pattern: ["feather", null, null, null],
    bonus: { hpPct: 0.1, atkPct: 0.05, defFlat: 5 },
    description: "Người mang +10% HP, +5% ATK, +5 DEF"
  },
  {
    id: "blue_buff",
    name: "Bùa Xanh",
    icon: "🟦",
    pattern: ["tear", null, null, null],
    bonus: { startingRage: 2 },
    description: "Người mang +2 Nộ khởi đầu"
  },
  {
    id: "redemption",
    name: "Dây Chuyền",
    icon: "✝️",
    pattern: ["tear", null, null, null],
    bonus: { hpPct: 0.1, startingRage: 1, healPct: 0.1 },
    description: "Người mang +10% HP, +1 Nộ, +10% hồi máu"
  },
  {
    id: "warmog_armor",
    name: "Giáp Máu",
    icon: "💚",
    pattern: ["belt", null, null, null],
    bonus: { hpPct: 0.25 },
    description: "Người mang +25% HP"
  },

  {
    id: "dragon_heart",
    name: "Trái Tim Rồng",
    icon: "🐉",
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_dawn_edge", "eq_aegis_oath", "claw",
      "claw", "feather", "claw",
      "belt", "claw", "belt"
    ],
    bonus: { atkPct: 0.22, hpPct: 0.18, critPct: 0.12 },
    description: "Người mang +22% ATK, +18% HP, +12% Crit"
  },
  {
    id: "storm_crown",
    name: "Vương Miện Bão Tố",
    icon: "👑",
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_mindforge_spear", "eq_mindforge_spear", "crystal",
      "tear", "crystal", "tear",
      "crystal", "feather", "crystal"
    ],
    bonus: { matkPct: 0.28, startingRage: 3, mdefFlat: 20 },
    description: "Người mang +28% MATK, +3 Nộ, +20 MDEF"
  },
  {
    id: "titan_shell",
    name: "Mai Titan",
    icon: "🐢",
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_aegis_oath", "eq_ember_grimoire", "bark",
      "belt", "bark", "claw",
      "bark", "crystal", "bark"
    ],
    bonus: { hpPct: 0.4, defFlat: 35, mdefFlat: 20 },
    description: "Người mang +40% HP, +35 DEF, +20 MDEF"
  },
  {
    id: "bloodfang_reaper",
    name: "Huyết Nha",
    icon: "🩸",
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_tempest_shroud", "eq_wild_talon_cloak", "belt",
      "belt", "claw", "belt",
      "tear", "tear", "feather"
    ],
    bonus: { atkPct: 0.2, lifestealPct: 0.22, critPct: 0.1 },
    description: "Người mang +20% ATK, +22% hút máu, +10% Crit"
  },
  {
    id: "phoenix_plume",
    name: "Lông Phượng",
    icon: "🐦‍🔥",
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_moonwell_pendant", "eq_ember_grimoire", "feather",
      "crystal", "crystal", "crystal",
      "tear", "belt", "tear"
    ],
    bonus: { matkPct: 0.2, healPct: 0.18, startingRage: 2 },
    description: "Người mang +20% MATK, +18% hồi máu, +2 Nộ"
  },
  {
    id: "void_engine",
    name: "Lõi Hư Không",
    icon: "🌌",
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_skyhunter_scope", "eq_wild_talon_cloak", "crystal",
      "claw", "crystal", "claw",
      "feather", "tear", "feather"
    ],
    bonus: { atkPct: 0.12, matkPct: 0.12, critPct: 0.15, startingRage: 1 },
    description: "Người mang +12% ATK/MATK, +15% Crit, +1 Nộ"
  },
  {
    id: "gaia_oath",
    name: "Thệ Ước Đại Địa",
    icon: "🌿",
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_wild_talon_cloak", "eq_voidfang_lantern", "belt",
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
    tier: 3,
    gridSize: 3,
    pattern: [
      "eq_stormbreaker_ballista", "eq_dawn_edge", "tear",
      "claw", "tear", "feather",
      "tear", "crystal", "tear"
    ],
    bonus: { atkPct: 0.18, critPct: 0.2, startingRage: 2 },
    description: "Người mang +18% ATK, +20% Crit, +2 Nộ"
  },

  {
    id: "dawn_edge",
    name: "Lưỡi Rạng Đông",
    icon: "🌅",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_death_blade", "claw", "tear", "crystal"],
    bonus: { atkPct: 0.22, critPct: 0.12, startingRage: 1 },
    description: "Cấp 2: Người mang +22% ATK, +12% Crit, +1 Nộ"
  },
  {
    id: "aegis_oath",
    name: "Thệ Ước Hộ Vệ",
    icon: "🛡️",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_titan_resolve", "bark", "belt", "crystal"],
    bonus: { hpPct: 0.2, defFlat: 18, mdefFlat: 12 },
    description: "Cấp 2: Người mang +20% HP, +18 DEF, +12 MDEF"
  },
  {
    id: "sanguine_codex",
    name: "Sách Huyết Thuật",
    icon: "📕",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_hextech_gunblade", "crystal", "belt", "crystal"],
    bonus: { atkPct: 0.1, matkPct: 0.14, lifestealPct: 0.12 },
    description: "Cấp 2: Người mang +10% ATK, +14% MATK, +12% hút máu"
  },
  {
    id: "skyhunter_scope",
    name: "Ống Ngắm Thiên Ưng",
    icon: "🎯",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_giant_slayer", "feather", "crystal", "crystal"],
    bonus: { atkPct: 0.16, critPct: 0.18 },
    description: "Cấp 2: Người mang +16% ATK, +18% Crit"
  },
  {
    id: "mindforge_spear",
    name: "Thương Tâm Trí",
    icon: "🪄",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_spear_shojin", "tear", "crystal", "crystal"],
    bonus: { atkPct: 0.1, matkPct: 0.14, startingRage: 2 },
    description: "Cấp 2: Người mang +10% ATK, +14% MATK, +2 Nộ"
  },
  {
    id: "wild_talon_cloak",
    name: "Áo Choàng Móng Dữ",
    icon: "🦴",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_sterak_gage", "belt", "claw", "crystal"],
    bonus: { hpPct: 0.2, atkPct: 0.12, defFlat: 8 },
    description: "Cấp 2: Người mang +20% HP, +12% ATK, +8 DEF"
  },
  {
    id: "thorn_abyss_plate",
    name: "Giáp Gai Vực Sâu",
    icon: "🧱",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_bramble_vest", "bark", "crystal", "crystal"],
    bonus: { hpPct: 0.15, defFlat: 24, mdefFlat: 16 },
    description: "Cấp 2: Người mang +15% HP, +24 DEF, +16 MDEF"
  },
  {
    id: "tempest_shroud",
    name: "Phong Ảnh Y",
    icon: "🌪️",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_quicksilver", "feather", "tear", "crystal"],
    bonus: { evadePct: 0.12, mdefFlat: 12, startingRage: 1 },
    description: "Cấp 2: Người mang +12% né tránh, +12 MDEF, +1 Nộ"
  },
  {
    id: "ember_grimoire",
    name: "Hỏa Tâm Thư",
    icon: "🔥",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_morellonomicon", "crystal", "tear", "crystal"],
    bonus: { matkPct: 0.18, burnOnHit: 4, hpPct: 0.1 },
    description: "Cấp 2: Người mang +18% MATK, đốt cháy mạnh khi đánh, +10% HP"
  },
  {
    id: "stormbreaker_ballista",
    name: "Nỏ Phá Bão",
    icon: "🏹",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_statikk_shiv", "feather", "claw", "crystal"],
    bonus: { atkPct: 0.15, critPct: 0.15, startingRage: 1 },
    description: "Cấp 2: Người mang +15% ATK, +15% Crit, +1 Nộ"
  },
  {
    id: "moonwell_pendant",
    name: "Dây Chuyền Nguyệt Tuyền",
    icon: "🌙",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_redemption", "tear", "bark", "crystal"],
    bonus: { hpPct: 0.16, healPct: 0.15, mdefFlat: 10 },
    description: "Cấp 2: Người mang +16% HP, +15% hồi máu, +10 MDEF"
  },
  {
    id: "voidfang_lantern",
    name: "Đèn Nanh Hư Không",
    icon: "🏮",
    tier: 2,
    gridSize: 2,
    pattern: ["eq_zzrot_portal", "crystal", "claw", "crystal"],
    bonus: { hpPct: 0.12, atkPct: 0.1, poisonOnHit: 4 },
    description: "Cấp 2: Người mang +12% HP, +10% ATK, gây độc khi đánh"
  },

  {
    id: "astral_overlord",
    name: "Vương Ấn Tinh Giới",
    icon: "✨",
    tier: 4,
    gridSize: 3,
    pattern: [
      "eq_dawn_edge", null, "eq_mindforge_spear",
      null, "eq_storm_crown", null,
      "crystal", null, null
    ],
    bonus: { atkPct: 0.24, matkPct: 0.26, critPct: 0.18, startingRage: 4 },
    description: "Cấp 4: Người mang +24% ATK, +26% MATK, +18% Crit, +4 Nộ"
  },
  {
    id: "leviathan_bastion",
    name: "Thành Leviathan",
    icon: "🐋",
    tier: 4,
    gridSize: 3,
    pattern: [
      "eq_aegis_oath", null, "eq_titan_shell",
      null, "bark", null,
      "belt", null, null
    ],
    bonus: { hpPct: 0.42, defFlat: 42, mdefFlat: 30, shieldStart: 160 },
    description: "Cấp 4: Người mang +42% HP, +42 DEF, +30 MDEF, +160 khiên đầu trận"
  },
  {
    id: "phoenix_legacy",
    name: "Di Sản Phượng Hoàng",
    icon: "🕊️",
    tier: 4,
    gridSize: 3,
    pattern: [
      "eq_ember_grimoire", null, "eq_phoenix_plume",
      null, "tear", null,
      "crystal", null, null
    ],
    bonus: { matkPct: 0.32, healPct: 0.22, burnOnHit: 6, startingRage: 3 },
    description: "Cấp 4: Người mang +32% MATK, +22% hồi máu, thiêu đốt mạnh, +3 Nộ"
  },
  {
    id: "shadow_harbinger",
    name: "Sứ Giả Bóng Đêm",
    icon: "🌑",
    tier: 4,
    gridSize: 3,
    pattern: [
      "eq_tempest_shroud", null, "eq_bloodfang_reaper",
      null, "feather", null,
      "claw", null, null
    ],
    bonus: { atkPct: 0.28, critPct: 0.24, evadePct: 0.14, lifestealPct: 0.14 },
    description: "Cấp 4: Người mang +28% ATK, +24% Crit, +14% né tránh, +14% hút máu"
  },
  {
    id: "gaia_eternity",
    name: "Vĩnh Ước Gaia",
    icon: "🌍",
    tier: 4,
    gridSize: 3,
    pattern: [
      "eq_moonwell_pendant", null, "eq_gaia_oath",
      null, "belt", null,
      "tear", null, null
    ],
    bonus: { hpPct: 0.36, healPct: 0.22, shieldStart: 180, startingRage: 2 },
    description: "Cấp 4: Người mang +36% HP, +22% hồi máu, +180 khiên, +2 Nộ"
  },
  {
    id: "thunder_apex",
    name: "Đỉnh Lôi Vực",
    icon: "🌩️",
    tier: 4,
    gridSize: 3,
    pattern: [
      "eq_stormbreaker_ballista", null, "eq_thunder_pike",
      null, "feather", null,
      "crystal", null, null
    ],
    bonus: { atkPct: 0.3, critPct: 0.26, startingRage: 3, matkPct: 0.12 },
    description: "Cấp 4: Người mang +30% ATK, +26% Crit, +3 Nộ, +12% MATK"
  }
];

function resolveGridSize(recipe) {
  const raw = Number.isFinite(recipe?.gridSize) ? Math.floor(recipe.gridSize) : null;
  if (raw >= 1 && raw <= 3) return raw;
  if (Array.isArray(recipe?.pattern) && recipe.pattern.length >= 9) return 3;
  // Tier 1: pattern chỉ có 1 nguyên liệu → grid 1x1
  const nonNull = Array.isArray(recipe?.pattern) ? recipe.pattern.filter(Boolean).length : 0;
  if (nonNull <= 1) return 1;
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
  const tierRaw = Number.isFinite(recipe?.tier) ? Math.floor(recipe.tier) : null;
  const tier = tierRaw && tierRaw >= 1 ? tierRaw : (gridSize >= 3 ? 3 : 1);
  const pattern = normalizePattern(recipe.pattern, gridSize, recipe.requires ?? []);
  const requires = Array.isArray(recipe.requires) && recipe.requires.length
    ? recipe.requires.filter(Boolean)
    : pattern.filter(Boolean);
  return {
    ...recipe,
    tier,
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

function ingredientIsEquipment(id) {
  return ITEM_BY_ID[id]?.kind === "equipment";
}

function ingredientTier(id) {
  if (!ingredientIsEquipment(id)) return 0;
  const recipeId = String(id).startsWith("eq_") ? String(id).slice(3) : null;
  return recipeId ? (RECIPE_BY_ID[recipeId]?.tier ?? 0) : 0;
}

function validateCraftRecipeRules() {
  CRAFT_RECIPES.forEach((recipe) => {
    const requires = Array.isArray(recipe?.requires) ? recipe.requires.filter(Boolean) : [];
    requires.forEach((id) => {
      if (!ITEM_BY_ID[id]) {
        console.warn(`[Items] Recipe ${recipe.id} references unknown ingredient: ${id}`);
      }
    });

    if (recipe.tier === 1) {
      if (requires.length !== 1) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 1) must require exactly 1 ingredient.`);
      }
      if (requires.some((id) => ingredientIsEquipment(id))) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 1) cannot include crafted equipment.`);
      }
    }

    if (recipe.tier === 2) {
      if (requires.length !== 4) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 2) must require exactly 4 ingredients.`);
      }
      if (!requires.some((id) => ingredientIsEquipment(id))) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 2) must include at least 1 crafted ingredient.`);
      }
    }

    if (recipe.tier === 3) {
      if (requires.length !== 9) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 3) must require exactly 9 ingredients, has ${requires.length}.`);
      }
      const tier2Count = requires.filter((id) => ingredientIsEquipment(id) && ingredientTier(id) >= 2).length;
      if (tier2Count < 2) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 3) must include at least 2 tier-2 crafted ingredients.`);
      }
    }

    if (recipe.tier === 4) {
      if (requires.length !== 4) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 4) must require exactly 4 ingredients.`);
      }
      if (!requires.some((id) => ingredientTier(id) >= 2)) {
        console.warn(`[Items] Recipe ${recipe.id} (tier 4) must include at least 1 tier-2 crafted ingredient.`);
      }
    }
  });
}

validateCraftRecipeRules();
