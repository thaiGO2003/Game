import { UNIT_BY_ID } from "./unitCatalog.js";

const CLASS_LABELS_VI = {
  TANKER: "Đỡ đòn",
  ASSASSIN: "Sát thủ",
  ARCHER: "Xạ thủ",
  MAGE: "Pháp sư",
  SUPPORT: "Hỗ trợ",
  FIGHTER: "Đấu sĩ"
};

const TRIBE_LABELS_VI = {
  STONE: "Nham",
  WIND: "Phong",
  FIRE: "Hỏa",
  TIDE: "Thủy",
  NIGHT: "Dạ",
  SPIRIT: "Linh",
  SWARM: "Trùng"
};

const UNIT_VISUALS = {
  bear_ancient: { nameVi: "Gấu Cổ Thụ", icon: "🐻" },
  rhino_quake: { nameVi: "Tê Giác Địa Chấn", icon: "🦏" },
  turtle_mire: { nameVi: "Rùa Đầm Lầy", icon: "🐢" },
  buffalo_mist: { nameVi: "Trâu Sương Mù", icon: "🐃" },
  panther_void: { nameVi: "Báo Hư Không", icon: "🐆" },
  fox_flame: { nameVi: "Cáo Hỏa", icon: "🦊" },
  bat_blood: { nameVi: "Dơi Huyết", icon: "🦇" },
  lynx_echo: { nameVi: "Bọ Ngựa Gió", icon: "🦗" },
  eagle_marksman: { nameVi: "Đại Bàng Xạ Thủ", icon: "🦅" },
  monkey_spear: { nameVi: "Khỉ Lao", icon: "🐒" },
  owl_nightshot: { nameVi: "Cú Đêm", icon: "🦉" },
  cat_goldbow: { nameVi: "Ong Lửa", icon: "🐝" },
  ice_mage: { nameVi: "Chuồn Chuồn Băng", icon: "🪰" },
  worm_ice: { nameVi: "Sâu Băng", icon: "🐛" },
  storm_mage: { nameVi: "Rắn Lôi", icon: "🐍" },
  spore_mage: { nameVi: "Nhện Bào Tử", icon: "🕷️" },
  deer_song: { nameVi: "Nai Thần Ca", icon: "🦌" },
  butterfly_mirror: { nameVi: "Bướm Kính", icon: "🦋" },
  lion_general: { nameVi: "Sư Tử Tướng", icon: "🦁" },
  ant_guard: { nameVi: "Kiến Hộ Vệ", icon: "🐜" },
  mantis_blade: { nameVi: "Bọ Ngựa Kiếm", icon: "🦗" },
  wasp_sting: { nameVi: "Ong Bắp Cày", icon: "🐝" },
  scorpion_king: { nameVi: "Vua Bọ Cạp", icon: "🦂" },
  parrot_roar: { nameVi: "Vẹt Linh Hô", icon: "🦜" },
  qilin_breeze: { nameVi: "Kỳ Lân Phong", icon: "🦄" },
  tiger_fang: { nameVi: "Hổ Răng Kiếm", icon: "🐯" },
  wolf_alpha: { nameVi: "Sói Thủ Lĩnh", icon: "🐺" },
  hippo_maul: { nameVi: "Hà Mã Nện", icon: "🦛" },
  beetle_drill: { nameVi: "Bọ Khoan Giáp", icon: "🪲" },
  worm_queen: { nameVi: "Sâu Xanh", icon: "🐛" },
  mosquito_toxic: { nameVi: "Muỗi Độc", icon: "🦟" },
  bug_plague: { nameVi: "Bọ Dịch Hạch", icon: "🐞" }
};

const SPECIES_ICON_MAP = {
  gau: "🐻",
  te: "🦏",
  "te-giac": "🦏",
  rua: "🐢",
  trau: "🐃",
  nguu: "🦬",
  bo: "🐂",
  bao: "🐆",
  cao: "🦊",
  "ho-ly": "🦊",
  doi: "🦇",
  chim: "🐦",
  hac: "🕊️",
  "ha-ma": "🦛",
  mieu: "🐱",
  "linh-mieu": "🐈",
  meo: "🐱",
  ly: "🐈",
  bang: "🦅",
  "ky-lan": "🦄",
  khi: "🐒",
  hau: "🐒",
  co: "🕊️",
  cu: "🦉",
  ran: "🐍",
  nhen: "🕷️",
  nai: "🦌",
  huou: "🦌",
  vet: "🦜",
  lan: "🦄",
  ho: "🐯",
  soi: "🐺",
  chon: "🦡",
  buom: "🦋",
  su: "🪼",
  "su-tu": "🦁",
  kien: "🐜",
  "bo-ngua": "🦗",
  "bo-cap": "🦂",
  ong: "🐝",
  sau: "🐛",
  "cá-sấu": "🐊",
  voi: "🐘",
  "khủng-long": "🦖",
  "cá-heo": "🐬",
  "hải-cẩu": "🦭",
  "sóc": "🐿️",
  "thỏ": "🐇",
  "cừu": "🐑",
  "ngựa": "🐎",
  coc: "🐸",
  boi: "🐟",
  lon: "🐗",
  sao: "⭐",
  "sao-bien": "⭐",
  vit: "🦆",
  moi: "🪳",
  ca: "🐟",
  muc: "🦑",
  "bach-tuoc": "🐙",
  oc: "🐌",
  vuon: "🦍",
  cong: "🦚",
  phuong: "🐦‍🔥",
  long: "🐉",
  "tac-ke": "🦎",
  "thien-nga": "🦢"
};

const SPECIES_PATTERN_ICON = [
  { pattern: /\bho(\s|-)?ly\b/, icon: "🦊" },
  { pattern: /\blinh(\s|-)?mieu\b/, icon: "🐈" },
  { pattern: /\bha(\s|-)?ma\b/, icon: "🦛" },
  { pattern: /\bky(\s|-)?lan\b/, icon: "🦄" },
  { pattern: /\bhac\b|\bco\b/, icon: "🕊️" },
  { pattern: /\bte(\s|-)?giac\b|\bte\b/, icon: "🦏" },
  { pattern: /\bbuom\b/, icon: "🦋" },
  { pattern: /\bdai(\s|-)?bang\b|\bbang\b/, icon: "🦅" },
  { pattern: /\bbeetle\b|bọ|bo(\s|-)?thep|khoan|giap/, icon: "🪲" },
  { pattern: /\bbo(\s|-)?cua\b|\bcua\b/, icon: "🦀" },
  { pattern: /\bbo(\s|-)?cap\b|\bcap\b/, icon: "🦂" },
  { pattern: /\bnhen\b/, icon: "🕷️" },
  { pattern: /\bsua\b|\bsu\b/, icon: "🪼" }
];

const TRIBE_TITLE_POOL = {
  STONE: ["Nham", "Thạch", "Kiên", "Sơn"],
  WIND: ["Phong", "Lốc", "Vân", "Gió"],
  FIRE: ["Hỏa", "Viêm", "Diệm", "Xích"],
  TIDE: ["Thủy", "Triều", "Lam", "Hải"],
  NIGHT: ["Dạ", "U", "Nguyệt", "Hắc"],
  SPIRIT: ["Linh", "Thánh", "Tinh", "Phúc"],
  SWARM: ["Trùng", "Độc", "Bào", "Gai"]
};

const CLASS_TITLE_POOL = {
  TANKER: ["Hộ Vệ", "Kiên Giáp", "Tiên Phong", "Thành Trì"],
  ASSASSIN: ["Ám Kích", "Đoạt Mệnh", "Ảnh Sát", "Kết Liễu"],
  ARCHER: ["Xạ Kích", "Bách Phát", "Truy Kích", "Liên Tiễn"],
  MAGE: ["Pháp Ấn", "Tinh Thuật", "Bùa Chú", "Linh Chú"],
  SUPPORT: ["Hộ Trợ", "Chúc Phúc", "Bảo Hộ", "Dưỡng Sinh"],
  FIGHTER: ["Chiến Binh", "Đột Kích", "Cuồng Kích", "Nộ Trảm"]
};

function hashString(text) {
  const input = String(text ?? "");
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickBySeed(list, seed) {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list[Math.abs(seed) % list.length];
}

function prettyNameFromId(baseId) {
  return String(baseId ?? "")
    .split("_")
    .filter(Boolean)
    .map((w) => `${w.charAt(0).toUpperCase()}${w.slice(1)}`)
    .join(" ");
}

function looksGenericName(name) {
  if (!name) return true;
  const text = String(name).trim();
  if (!text) return true;
  return /\d/.test(text) || /^beast\b/i.test(text) || /^unit\b/i.test(text);
}

function buildFlavorName(baseId, classType, tribe, seed) {
  const root = prettyNameFromId(baseId) || "Linh thú";
  const tribeTitle = pickBySeed(TRIBE_TITLE_POOL[tribe], seed * 3 + 11);
  const classTitle = pickBySeed(CLASS_TITLE_POOL[classType], seed * 5 + 19);
  const shortName = `${root} ${tribeTitle}`.replace(/\s+/g, " ").trim();
  return shortName.length <= 20 ? shortName : `${root} ${classTitle}`.replace(/\s+/g, " ").trim();
}

function toAsciiLower(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveSpeciesIcon(unit) {
  const speciesKey = toAsciiLower(unit?.species ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (speciesKey && SPECIES_ICON_MAP[speciesKey]) return SPECIES_ICON_MAP[speciesKey];

  const merged = `${toAsciiLower(unit?.name)} ${speciesKey} ${toAsciiLower(unit?.id)}`;
  for (const item of SPECIES_PATTERN_ICON) {
    if (item.pattern.test(merged)) return item.icon;
  }

  return "🐾";
}

export function getUnitVisual(baseId, classType = null) {
  if (UNIT_VISUALS[baseId]) return UNIT_VISUALS[baseId];
  const unit = UNIT_BY_ID[baseId];
  const catalogName = unit?.name;
  const icon = resolveSpeciesIcon(unit);
  const nameVi = looksGenericName(catalogName)
    ? buildFlavorName(baseId, classType ?? unit?.classType ?? "FIGHTER", unit?.tribe ?? "SPIRIT", hashString(baseId))
    : catalogName || buildFlavorName(baseId, classType ?? unit?.classType ?? "FIGHTER", unit?.tribe ?? "SPIRIT", hashString(baseId)) || "Linh thú";

  return { nameVi, icon };
}

export function getClassLabelVi(code) {
  return CLASS_LABELS_VI[code] ?? code;
}

export function getTribeLabelVi(code) {
  return TRIBE_LABELS_VI[code] ?? code;
}
