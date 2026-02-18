export const BASE_ITEMS = [
  { id: "claw", name: "Vuốt Sắc", icon: "🗡️" },
  { id: "bark", name: "Vỏ Cứng", icon: "🛡️" },
  { id: "crystal", name: "Tinh Thạch", icon: "🔮" },
  { id: "feather", name: "Lông Vũ", icon: "🪶" },
  { id: "tear", name: "Nước Mắt", icon: "💧" },
  { id: "belt", name: "Đai Lưng", icon: "🥋" }
];

export const CRAFT_RECIPES = [
  {
    id: "death_blade",
    name: "Kiếm Vô Cực",
    icon: "⚔️",
    requires: ["claw", "claw"],
    bonus: { teamAtkPct: 0.15 },
    description: "Team +15% ATK"
  },
  {
    id: "titan_resolve",
    name: "Quyền Năng",
    icon: "🛡️",
    requires: ["claw", "bark"],
    bonus: { teamAtkPct: 0.05, teamHpPct: 0.05, defFlat: 10 },
    description: "Team +5% ATK, +5% HP, +10 DEF"
  },
  {
    id: "hextech_gunblade",
    name: "Kiếm Súng",
    icon: "🔫",
    requires: ["claw", "crystal"],
    bonus: { teamAtkPct: 0.05, teamMatkPct: 0.05, lifestealPct: 0.1 },
    description: "Team +5% ATK/MATK, +10% Hút máu"
  },
  {
    id: "giant_slayer",
    name: "Diệt Khổng Lồ",
    icon: "🗡️",
    requires: ["claw", "feather"],
    bonus: { teamAtkPct: 0.10, critPct: 0.1 },
    description: "Team +10% ATK, +10% Crit"
  },
  {
    id: "spear_shojin",
    name: "Thương Shojin",
    icon: "🔱",
    requires: ["claw", "tear"],
    bonus: { teamAtkPct: 0.05, startingRage: 15 },
    description: "Team +5% ATK, +15 Nộ khởi đầu"
  },
  {
    id: "sterak_gage",
    name: "Móng Vuốt",
    icon: "🥊",
    requires: ["claw", "belt"],
    bonus: { teamAtkPct: 0.05, teamHpPct: 0.1 },
    description: "Team +5% ATK, +10% HP"
  },
  {
    id: "bramble_vest",
    name: "Giáp Gai",
    icon: "🌵",
    requires: ["bark", "bark"],
    bonus: { teamHpPct: 0.05, defFlat: 20 },
    description: "Team +5% HP, +20 DEF"
  },
  {
    id: "ionic_spark",
    name: "Nỏ Sét",
    icon: "⚡",
    requires: ["bark", "crystal"],
    bonus: { teamMatkPct: 0.05, mdefFlat: 15 },
    description: "Team +5% MATK, +15 MDEF"
  },
  {
    id: "quicksilver",
    name: "Khăn Giải Thuật",
    icon: "🧣",
    requires: ["bark", "feather"],
    bonus: { teamHpPct: 0.05, mdefFlat: 10, critPct: 0.05 },
    description: "Team +5% HP, +10 MDEF, +5% Crit"
  },
  {
    id: "frozen_heart",
    name: "Tim Băng",
    icon: "❄️",
    requires: ["bark", "tear"],
    bonus: { teamHpPct: 0.05, startingRage: 10, defFlat: 10 },
    description: "Team +5% HP, +10 Nộ, +10 DEF"
  },
  {
    id: "sunfire_cape",
    name: "Áo Choàng Lửa",
    icon: "🔥",
    requires: ["bark", "belt"],
    bonus: { teamHpPct: 0.15, burnOnHit: 1 },
    description: "Team +15% HP, Đốt cháy khi đánh"
  },
  {
    id: "rabadon_deathcap",
    name: "Mũ Phù Thủy",
    icon: "🧙",
    requires: ["crystal", "crystal"],
    bonus: { teamMatkPct: 0.20 },
    description: "Team +20% MATK"
  },
  {
    id: "guinsoo_rageblade",
    name: "Cuồng Đao",
    icon: "🗡️",
    requires: ["crystal", "feather"],
    bonus: { teamMatkPct: 0.05, critPct: 0.15 },
    description: "Team +5% MATK, +15% Crit"
  },
  {
    id: "archangel_staff",
    name: "Quyền Trượng",
    icon: "⚕️",
    requires: ["crystal", "tear"],
    bonus: { teamMatkPct: 0.10, startingRage: 15 },
    description: "Team +10% MATK, +15 Nộ"
  },
  {
    id: "morellonomicon",
    name: "Quỷ Thư",
    icon: "📖",
    requires: ["crystal", "belt"],
    bonus: { teamMatkPct: 0.05, teamHpPct: 0.1, burnOnHit: 1 },
    description: "Team +5% MATK, +10% HP, Đốt cháy"
  },
  {
    id: "rapid_firecannon",
    name: "Đại Bác",
    icon: "🔭",
    requires: ["feather", "feather"],
    bonus: { critPct: 0.2, teamAtkPct: 0.05 },
    description: "Team +20% Crit, +5% ATK"
  },
  {
    id: "statikk_shiv",
    name: "Dao Điện",
    icon: "⚡",
    requires: ["feather", "tear"],
    bonus: { critPct: 0.1, startingRage: 10, teamMatkPct: 0.05 },
    description: "Team +10% Crit, +10 Nộ, +5% MATK"
  },
  {
    id: "zzrot_portal",
    name: "Thông Đạo",
    icon: "👾",
    requires: ["feather", "belt"],
    bonus: { teamHpPct: 0.1, teamAtkPct: 0.05, defFlat: 5 },
    description: "Team +10% HP, +5% ATK, +5 DEF"
  },
  {
    id: "blue_buff",
    name: "Bùa Xanh",
    icon: "🟦",
    requires: ["tear", "tear"],
    bonus: { startingRage: 30 },
    description: "Team +30 Nộ khởi đầu"
  },
  {
    id: "redemption",
    name: "Dây Chuyền",
    icon: "✝️",
    requires: ["tear", "belt"],
    bonus: { teamHpPct: 0.1, startingRage: 10, healPct: 0.1 },
    description: "Team +10% HP, +10 Nộ, +10% Hồi máu"
  },
  {
    id: "warmog_armor",
    name: "Giáp Máu",
    icon: "💚",
    requires: ["belt", "belt"],
    bonus: { teamHpPct: 0.25 },
    description: "Team +25% HP"
  }
];

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
