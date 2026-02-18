import unitsCsv from "../../data/units.csv?raw";

function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    if (row.length < headers.length) continue;
    const unit = {};
    const stats = {};
    headers.forEach((header, index) => {
      const value = row[index]?.trim();
      if (!header) return;
      if (["hp", "atk", "def", "matk", "mdef", "range", "rageMax"].includes(header)) {
        stats[header] = Number(value);
      } else if (header === "tier") {
        unit.tier = Number(value);
      } else if (header === "tribeVi" || header === "classVi") {
        // Skip display fields
      } else {
        unit[header] = value;
      }
    });
    unit.stats = stats;
    data.push(unit);
  }
  return data;
}

const CORE_UNITS = parseCsv(unitsCsv);

const TARGET_UNIT_COUNT = 40;

const CLASS_SKILLS = {
  TANKER: ["thorn_bark", "earth_ram", "shell_reflect", "mist_guard", "ant_shield_wall"],
  ASSASSIN: ["void_execute", "flame_combo", "blood_bite", "echo_slash", "mantis_slice"],
  ARCHER: ["cross_arrow", "row_pierce", "sleep_shot", "armor_break_arrow", "poison_sting"],
  MAGE: ["ice_column", "snow_burst", "storm_column", "spore_rain"],
  SUPPORT: ["life_song", "mirror_shield", "rage_chant", "wind_path"],
  FIGHTER: ["cleave_fang", "alpha_howl", "mud_slam", "armor_drill", "lion_roar_stun", "scorpion_venom"]
};

const CLASS_BASE_STATS = {
  TANKER: { hp: 360, atk: 46, def: 31, matk: 14, mdef: 23, range: 1, rageByTier: [4, 4, 4, 5, 5] },
  ASSASSIN: { hp: 250, atk: 70, def: 16, matk: 20, mdef: 14, range: 1, rageByTier: [2, 2, 3, 3, 3] },
  ARCHER: { hp: 250, atk: 66, def: 14, matk: 15, mdef: 13, range: 4, rageByTier: [3, 3, 3, 3, 3] },
  MAGE: { hp: 230, atk: 20, def: 12, matk: 84, mdef: 22, range: 4, rageByTier: [5, 5, 5, 5, 5] },
  SUPPORT: { hp: 270, atk: 26, def: 17, matk: 72, mdef: 26, range: 3, rageByTier: [4, 4, 4, 5, 5] },
  FIGHTER: { hp: 320, atk: 63, def: 22, matk: 18, mdef: 18, range: 1, rageByTier: [3, 3, 3, 3, 4] }
};

const NAME_POOL = {
  TANKER: ["Trâu Mộc", "Tê Sắt", "Rùa Nham", "Bọ Cứng", "Kiến Đá", "Cua Sắt", "Ốc Nham", "Tê Mãng", "Ngưu Cổ", "Rùa Mai", "Voi Đá", "Hà Mã Tăng", "Gấu Chiến", "Vá Đất", "Lợn Rừng", "Tê Giác Húc"],
  ASSASSIN: ["Báo Đêm", "Miêu Ảnh", "Bọ Ngựa", "Dơi Sát", "Nhện Sát", "Rết Độc", "Muỗi Đêm", "Hổ Vệt", "Sói Lẩn", "Báo Ảnh", "Rắn Hổ", "Bọ Cạp", "Ong Sát", "Mantis Hư", "Cáo Bóng", "Chồn Đèn"],
  ARCHER: ["Đại Bàng", "Ong Bắp Cày", "Chuồn Chuồn", "Kiến Lửa", "Châu Chấu", "Diều Sấm", "Tước Xạ", "Chim Lửa", "Hầu Xạ", "Cò Linh", "Sáo Đá", "Vịt Trời", "Thiên Nga", "Cú Mèo", "Vẹt Mỏ", "Mối Thợ"],
  MAGE: ["Bướm Đêm", "Nhện Ma", "Đom Đóm", "Sâu Băng", "Cóc Mưa", "Sứa Lam", "Bướm Sương", "Quạ Đêm", "Dơi Sấm", "Tắc Kè Lửa", "Rắn Lục", "Cá Điện", "Bạch Tuộc", "Mực Ống", "Sao Biển", "Ốc Sên"],
  SUPPORT: ["Nai Thần", "Bướm Phấn", "Ong Mật", "Tằm Tơ", "Sên Ngọc", "Sáo Gió", "Chim Sứ", "Hạc Trị", "Cáo Linh", "Nai Ca", "Ngựa Tiên", "Cừu Bông", "Thỏ Ngọc", "Sóc Bay", "Hải Cẩu", "Cá Heo"],
  FIGHTER: ["Hổ Nanh", "Bọ Hung", "Kiến Vương", "Bọ Thép", "Gián Chiến", "Mối Chúa", "Ngưu Đấu", "Tê Chiến", "Lang Cước", "Hổ Trảm", "Sư Tử Vàng", "Gấu Nâu", "Cá Sấu", "Khủng Long", "Vượn Cáo", "Chó Săn"]
};

const CLASS_ORDER = ["TANKER", "ASSASSIN", "ARCHER", "MAGE", "SUPPORT", "FIGHTER"];
const TRIBE_ORDER = ["STONE", "WIND", "FIRE", "TIDE", "NIGHT", "SPIRIT", "SWARM"];

const TRIBE_TITLE_POOL = {
  STONE: ["Nham", "Thạch", "Kiên", "Địa", "Sơn", "Đá"],
  WIND: ["Phong", "Lốc", "Vân", "Bão", "Không", "Gió"],
  FIRE: ["Hỏa", "Viêm", "Diệm", "Xích", "Hồng", "Nhiệt"],
  TIDE: ["Thủy", "Triều", "Lam", "Sương", "Lưu", "Hải"],
  NIGHT: ["Dạ", "U", "Nguyệt", "Hắc", "Ảnh", "Tối"],
  SPIRIT: ["Linh", "Thánh", "Tinh", "Phúc", "Quang", "Âm"],
  SWARM: ["Trùng", "Độc", "Bào", "Kén", "Tơ", "Gai"]
};

const CLASS_TITLE_POOL = {
  TANKER: ["Hộ Vệ", "Thành Trì", "Giữ Đất", "Kiên Giáp", "Tiên Phong", "Thủ Môn"],
  ASSASSIN: ["Ám Kích", "Đoạt Mệnh", "Ảnh Sát", "Lướt Bóng", "Kết Liễu", "Bóng Đen"],
  ARCHER: ["Xạ Kích", "Bách Phát", "Truy Kích", "Viễn Tầm", "Đoản Vũ", "Liên Tiễn"],
  MAGE: ["Pháp Ấn", "Thiên Ấn", "Hư Thuật", "Bùa Chú", "Tinh Thuật", "Linh Chú"],
  SUPPORT: ["Hộ Trợ", "Chúc Phúc", "Tiếp Ứng", "Bảo Hộ", "Tế Vũ", "Dưỡng Sinh"],
  FIGHTER: ["Chiến Binh", "Đột Kích", "Cuồng Kích", "Phong Quyền", "Chiến Ý", "Nộ Trảm"]
};

const CLASS_ICON_POOL = {
  TANKER: ["🦬", "🦏", "🐢", "🦀", "🐌", "🐞", "🐘", "🦕", "🐊", "🐄", "🦍", "🐎"],
  ASSASSIN: ["🐆", "🦊", "🕷️", "🦇", "🦟", "🦗", "🦂", "🐍", "🦑", "🐈‍⬛", "🐀", "🦡"],
  ARCHER: ["🦅", "🐝", "🐜", "🕊️", "🦆", "🦗", "🦃", "🦩", "🐓", "🦜", "🦢", "🦉"],
  MAGE: ["🦋", "🐍", "🕷️", "🐙", "🪼", "🦂", "🦎", "🐡", "🐠", "🐉", "⛈️", "🦠"],
  SUPPORT: ["🦌", "🦋", "🐝", "🐌", "🕊️", "🐬", "🐇", "🐿️", "🐑", "🦘", "🦭", "🦄"],
  FIGHTER: ["🐯", "🐗", "🪲", "🐜", "🐺", "🦗", "🦁", "🐻", "🦖", "🦈", "🦍", "🐕"]
};

function roundStat(value) {
  return Math.max(1, Math.round(value));
}

function pickBySeed(list, seed) {
  if (!Array.isArray(list) || list.length === 0) return "";
  const index = Math.abs(seed) % list.length;
  return list[index];
}

function generateName(classType, tribe, idx, tier, usedNames) {
  const root = pickBySeed(NAME_POOL[classType], idx * 3 + tier);
  const tribeTitle = pickBySeed(TRIBE_TITLE_POOL[tribe], idx * 5 + tier * 2);
  const classTitle = pickBySeed(CLASS_TITLE_POOL[classType], idx * 7 + tier);
  let candidate = `${root} ${tribeTitle}`.replace(/\s+/g, " ").trim();
  let safety = 0;
  while (usedNames.has(candidate) && safety < 24) {
    safety += 1;
    const altClass = pickBySeed(CLASS_TITLE_POOL[classType], idx * (7 + safety) + tier + safety);
    candidate = `${root} ${altClass}`.replace(/\s+/g, " ").trim();
  }
  usedNames.add(candidate);
  return candidate;
}

function generateIcon(classType, tribe, idx) {
  const tribeSeed = Math.max(0, TRIBE_ORDER.indexOf(tribe));
  return pickBySeed(CLASS_ICON_POOL[classType], idx + tribeSeed * 3) || "🐾";
}

function toAsciiLower(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferSpeciesKey(name, fallbackId = "linh-thu") {
  const text = toAsciiLower(name).replace(/[^a-z0-9\s]/g, " ");
  const normalized = text.replace(/\s+/g, " ").trim();
  const phraseRules = [
    ["te giac", "te-giac"],
    ["ky lan", "ky-lan"],
    ["ha ma", "ha-ma"],
    ["dai bang", "dai-bang"],
    ["linh mieu", "linh-mieu"],
    ["ho ly", "ho-ly"],
    ["su tu", "su-tu"],
    ["bo ngua", "bo-ngua"],
    ["bo cap", "bo-cap"],
    ["khung long", "khung-long"],
    ["hai cau", "hai-cau"],
    ["thien nga", "thien-nga"],
    ["bach tuoc", "bach-tuoc"],
    ["sao bien", "sao-bien"],
    ["tac ke", "tac-ke"],
    ["ca heo", "ca-heo"],
    ["ca sau", "ca-sau"]
  ];
  for (const [phrase, key] of phraseRules) {
    if (normalized.includes(phrase)) return key;
  }

  const tokens = normalized.split(" ").filter(Boolean);
  const animalTokens = new Set([
    "gau",
    "te",
    "rua",
    "trau",
    "nguu",
    "bo",
    "bao",
    "cao",
    "cho",
    "doi",
    "mieu",
    "meo",
    "ly",
    "quy",
    "hung",
    "voi",
    "lon",
    "ran",
    "ong",
    "sao",
    "vit",
    "moi",
    "ca",
    "muc",
    "oc",
    "ngua",
    "cuu",
    "tho",
    "soc",
    "vuon",
    "cong",
    "phuong",
    "long",
    "lan",
    "bang",
    "khi",
    "hau",
    "cu",
    "nai",
    "vet",
    "lan",
    "ho",
    "soi",
    "cho",
    "chon",
    "huou",
    "chim",
    "co",
    "diet",
    "buom",
    "coc",
    "su",
    "bo",
    "ong",
    "chuon",
    "kien",
    "sau",
    "oc",
    "ret",
    "muoi",
    "gian",
    "moi",
    "de",
    "chau"
  ]);

  for (const token of tokens) {
    if (animalTokens.has(token)) return token;
  }

  if (tokens.length) return tokens[0];
  const idRoot = String(fallbackId ?? "linh-thu").split("_")[0];
  return idRoot || "linh-thu";
}

function generateExtraUnits(totalCount) {
  const extra = [];
  let idx = 0;
  const usedNames = new Set(CORE_UNITS.map((unit) => unit.name));
  while (CORE_UNITS.length + extra.length < totalCount) {
    const classType = CLASS_ORDER[idx % CLASS_ORDER.length];
    const tier = (idx % 5) + 1;
    const tribe = TRIBE_ORDER[(idx * 2 + tier) % TRIBE_ORDER.length];
    const template = CLASS_BASE_STATS[classType];
    const skillId = CLASS_SKILLS[classType][idx % CLASS_SKILLS[classType].length];
    const name = generateName(classType, tribe, idx, tier, usedNames);
    const icon = generateIcon(classType, tribe, idx);
    const growth = 1 + tier * 0.16 + Math.floor(idx / 6) * 0.006;
    const id = `beast_${String(idx + 1).padStart(3, "0")}`;

    extra.push({
      id,
      name,
      species: inferSpeciesKey(name, id),
      icon,
      tribe,
      classType,
      tier,
      stats: {
        hp: roundStat(template.hp * growth + (idx % 4) * 10),
        atk: roundStat(template.atk * (1 + tier * 0.11) + (idx % 5) * 2),
        def: roundStat(template.def * (1 + tier * 0.08) + (idx % 3)),
        matk: roundStat(template.matk * (1 + tier * 0.12) + (idx % 5)),
        mdef: roundStat(template.mdef * (1 + tier * 0.09) + (idx % 4)),
        range: template.range,
        rageMax: template.rageByTier[tier - 1]
      },
      skillId
    });
    idx += 1;
  }
  return extra;
}

export const UNIT_CATALOG = [...CORE_UNITS, ...generateExtraUnits(TARGET_UNIT_COUNT)].map((unit) => {
  const existingSpecies = /** @type {any} */ (unit).species;
  return {
    ...unit,
    species: existingSpecies ?? inferSpeciesKey(unit.name, unit.id)
  };
});
export const UNIT_BY_ID = Object.fromEntries(UNIT_CATALOG.map((u) => [u.id, u]));
