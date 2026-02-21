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
  SWARM: "Trùng",
  WOOD: "Mộc"
};

const TRIBE_TITLE_POOL = {
  STONE: ["Nham", "Thạch", "Kiên", "Sơn"],
  WIND: ["Phong", "Lốc", "Vân", "Gió"],
  FIRE: ["Hỏa", "Viêm", "Diệm", "Xích"],
  TIDE: ["Thủy", "Triều", "Lam", "Hải"],
  NIGHT: ["Dạ", "U", "Nguyệt", "Hắc"],
  SPIRIT: ["Linh", "Thánh", "Tinh", "Phúc"],
  SWARM: ["Trùng", "Độc", "Bào", "Gai"],
  WOOD: ["Mộc", "Lâm", "Diệp", "Thảo"]
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

export function getUnitVisual(baseId, classType = null) {
  const unit = UNIT_BY_ID[baseId];
  if (!unit) return { nameVi: "Linh thú", icon: "🐾" };
  
  // Use icon from CSV if available, otherwise fallback to "🐾"
  const icon = unit.icon || "🐾";
  
  // Use name from CSV or generate flavor name
  const catalogName = unit.name;
  const nameVi = looksGenericName(catalogName)
    ? buildFlavorName(baseId, classType ?? unit.classType ?? "FIGHTER", unit.tribe ?? "SPIRIT", hashString(baseId))
    : catalogName || buildFlavorName(baseId, classType ?? unit.classType ?? "FIGHTER", unit.tribe ?? "SPIRIT", hashString(baseId)) || "Linh thú";

  return { nameVi, icon };
}

export function getClassLabelVi(code) {
  const normalized = typeof code === "string" ? code.trim() : code;
  if (!normalized || normalized === "undefined" || normalized === "null") return "Không rõ";
  return CLASS_LABELS_VI[normalized] ?? String(normalized);
}

export function getTribeLabelVi(code) {
  const normalized = typeof code === "string" ? code.trim() : code;
  if (!normalized || normalized === "undefined" || normalized === "null") return "Không rõ";
  return TRIBE_LABELS_VI[normalized] ?? String(normalized);
}
