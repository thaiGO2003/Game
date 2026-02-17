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
  buffalo_mist: { nameVi: "Trâu Sương", icon: "🐃" },
  panther_void: { nameVi: "Báo Hư Không", icon: "🐆" },
  fox_flame: { nameVi: "Cáo Hỏa", icon: "🦊" },
  bat_blood: { nameVi: "Dơi Huyết", icon: "🦇" },
  lynx_echo: { nameVi: "Linh Miêu Ảnh", icon: "🐈" },
  eagle_marksman: { nameVi: "Đại Bàng Xạ Thủ", icon: "🦅" },
  monkey_spear: { nameVi: "Khỉ Lao", icon: "🐒" },
  owl_nightshot: { nameVi: "Cú Đêm", icon: "🦉" },
  cat_goldbow: { nameVi: "Miêu Kim Cung", icon: "🐱" },
  ice_mage: { nameVi: "Cú Băng", icon: "🦉" },
  snow_mage: { nameVi: "Cáo Tuyết", icon: "🦊" },
  storm_mage: { nameVi: "Rắn Lôi", icon: "🐍" },
  spore_mage: { nameVi: "Nhện Bào Tử", icon: "🕷️" },
  deer_song: { nameVi: "Nai Thần Ca", icon: "🦌" },
  fox_mirror: { nameVi: "Cáo Kính", icon: "🦊" },
  parrot_roar: { nameVi: "Vẹt Linh Hô", icon: "🦜" },
  qilin_breeze: { nameVi: "Kỳ Lân Phong", icon: "🦄" },
  tiger_fang: { nameVi: "Hổ Nanh", icon: "🐯" },
  wolf_alpha: { nameVi: "Sói Thủ Lĩnh", icon: "🐺" },
  hippo_maul: { nameVi: "Hà Mã Nện", icon: "🦛" },
  beetle_drill: { nameVi: "Bọ Khoan Giáp", icon: "🪲" }
};

const CLASS_ICON = {
  TANKER: "🛡️",
  ASSASSIN: "🗡️",
  ARCHER: "🏹",
  MAGE: "🔮",
  SUPPORT: "✨",
  FIGHTER: "🐾"
};

const CLASS_ICON_POOL = {
  TANKER: ["🦬", "🦏", "🐢", "🐻", "🐘", "🦛"],
  ASSASSIN: ["🐆", "🦊", "🐺", "🦇", "🐅", "🐈"],
  ARCHER: ["🦅", "🦉", "🦜", "🕊️", "🦆", "🐒"],
  MAGE: ["🦄", "🐍", "🦋", "🐙", "🪼", "🦂"],
  SUPPORT: ["🦌", "🦢", "🦙", "🫎", "🕊️", "🐬"],
  FIGHTER: ["🐯", "🐗", "🦬", "🪲", "🐺", "🦍"]
};

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

function resolveFallbackIcon(classType, tribe, seed) {
  const tribeSeed = hashString(tribe);
  const pool = CLASS_ICON_POOL[classType] ?? [CLASS_ICON[classType] ?? "🐾"];
  return pickBySeed(pool, seed + tribeSeed);
}

export function getUnitVisual(baseId, classType = null) {
  if (UNIT_VISUALS[baseId]) return UNIT_VISUALS[baseId];
  const unit = UNIT_BY_ID[baseId];
  const resolvedClass = classType ?? unit?.classType ?? "FIGHTER";
  const resolvedTribe = unit?.tribe ?? "SPIRIT";
  const seed = hashString(baseId);
  const catalogName = unit?.name;
  const dynamicIcon = unit ? /** @type {any} */ (unit).icon : null;
  const icon = dynamicIcon ?? resolveFallbackIcon(resolvedClass, resolvedTribe, seed);
  const nameVi = looksGenericName(catalogName)
    ? buildFlavorName(baseId, resolvedClass, resolvedTribe, seed)
    : catalogName || buildFlavorName(baseId, resolvedClass, resolvedTribe, seed) || "Linh thú";

  return { nameVi, icon };
}

export function getClassLabelVi(code) {
  return CLASS_LABELS_VI[code] ?? code;
}

export function getTribeLabelVi(code) {
  return TRIBE_LABELS_VI[code] ?? code;
}
