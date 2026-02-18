const CORE_UNITS = [
  {
    id: "bear_ancient",
    name: "Gấu Cổ Thụ",
    tribe: "STONE",
    classType: "TANKER",
    tier: 1,
    stats: { hp: 340, atk: 42, def: 30, matk: 10, mdef: 24, range: 1, rageMax: 4 },
    skillId: "thorn_bark"
  },
  {
    id: "rhino_quake",
    name: "Tê Giác Địa Chấn",
    tribe: "STONE",
    classType: "TANKER",
    tier: 2,
    stats: { hp: 380, atk: 48, def: 33, matk: 10, mdef: 24, range: 1, rageMax: 4 },
    skillId: "earth_ram"
  },
  {
    id: "turtle_mire",
    name: "Rùa Đầm Lầy",
    tribe: "TIDE",
    classType: "TANKER",
    tier: 3,
    stats: { hp: 410, atk: 50, def: 36, matk: 16, mdef: 30, range: 1, rageMax: 5 },
    skillId: "shell_reflect"
  },
  {
    id: "buffalo_mist",
    name: "Trâu Sương Mù",
    tribe: "WIND",
    classType: "TANKER",
    tier: 4,
    stats: { hp: 450, atk: 55, def: 38, matk: 18, mdef: 31, range: 1, rageMax: 4 },
    skillId: "mist_guard"
  },
  {
    id: "panther_void",
    name: "Báo Hư Không",
    tribe: "NIGHT",
    classType: "ASSASSIN",
    tier: 1,
    stats: { hp: 240, atk: 69, def: 14, matk: 14, mdef: 12, range: 1, rageMax: 2 },
    skillId: "void_execute"
  },
  {
    id: "fox_flame",
    name: "Cáo Hỏa",
    tribe: "FIRE",
    classType: "ASSASSIN",
    tier: 2,
    stats: { hp: 255, atk: 72, def: 15, matk: 18, mdef: 13, range: 1, rageMax: 2 },
    skillId: "flame_combo"
  },
  {
    id: "bat_blood",
    name: "Dơi Huyết",
    tribe: "NIGHT",
    classType: "ASSASSIN",
    tier: 3,
    stats: { hp: 275, atk: 78, def: 16, matk: 20, mdef: 15, range: 1, rageMax: 3 },
    skillId: "blood_bite"
  },
  {
    id: "lynx_echo",
    name: "Bọ Ngựa Gió",
    tribe: "WIND",
    classType: "ASSASSIN",
    tier: 4,
    stats: { hp: 295, atk: 84, def: 18, matk: 22, mdef: 16, range: 1, rageMax: 3 },
    skillId: "echo_slash"
  },
  {
    id: "eagle_marksman",
    name: "Đại Bàng Xạ Thủ",
    tribe: "WIND",
    classType: "ARCHER",
    tier: 1,
    stats: { hp: 230, atk: 62, def: 12, matk: 10, mdef: 11, range: 4, rageMax: 3 },
    skillId: "cross_arrow"
  },
  {
    id: "monkey_spear",
    name: "Khỉ Lao Cành",
    tribe: "WIND",
    classType: "ARCHER",
    tier: 2,
    stats: { hp: 250, atk: 68, def: 12, matk: 12, mdef: 12, range: 4, rageMax: 3 },
    skillId: "row_pierce"
  },
  {
    id: "owl_nightshot",
    name: "Cú Đêm",
    tribe: "NIGHT",
    classType: "ARCHER",
    tier: 3,
    stats: { hp: 265, atk: 74, def: 13, matk: 14, mdef: 13, range: 4, rageMax: 3 },
    skillId: "sleep_shot"
  },
  {
    id: "cat_goldbow",
    name: "Ong Lửa",
    tribe: "FIRE",
    classType: "ARCHER",
    tier: 4,
    stats: { hp: 280, atk: 82, def: 14, matk: 16, mdef: 14, range: 4, rageMax: 3 },
    skillId: "armor_break_arrow"
  },
  {
    id: "ice_mage",
    name: "Chuồn Chuồn Băng",
    tribe: "TIDE",
    classType: "MAGE",
    tier: 1,
    stats: { hp: 215, atk: 16, def: 10, matk: 74, mdef: 20, range: 4, rageMax: 5 },
    skillId: "ice_column"
  },
  {
    id: "worm_ice",
    name: "Sâu Băng",
    tribe: "TIDE",
    classType: "MAGE",
    tier: 2,
    stats: { hp: 230, atk: 18, def: 10, matk: 80, mdef: 21, range: 4, rageMax: 5 },
    skillId: "snow_burst"
  },
  {
    id: "storm_mage",
    name: "Rắn Lôi",
    tribe: "WIND",
    classType: "MAGE",
    tier: 3,
    stats: { hp: 245, atk: 20, def: 11, matk: 88, mdef: 22, range: 4, rageMax: 5 },
    skillId: "storm_column"
  },
  {
    id: "spore_mage",
    name: "Nhện Bào Tử",
    tribe: "SWARM",
    classType: "MAGE",
    tier: 4,
    stats: { hp: 260, atk: 22, def: 11, matk: 96, mdef: 23, range: 4, rageMax: 5 },
    skillId: "spore_rain"
  },
  {
    id: "deer_song",
    name: "Nai Thần Ca",
    tribe: "SPIRIT",
    classType: "SUPPORT",
    tier: 1,
    stats: { hp: 245, atk: 22, def: 14, matk: 62, mdef: 25, range: 3, rageMax: 4 },
    skillId: "life_song"
  },
  {
    id: "butterfly_mirror",
    name: "Bướm Kính",
    tribe: "SPIRIT",
    classType: "SUPPORT",
    tier: 2,
    stats: { hp: 260, atk: 24, def: 15, matk: 68, mdef: 26, range: 3, rageMax: 4 },
    skillId: "mirror_shield"
  },
  {
    id: "parrot_roar",
    name: "Vẹt Linh Hô",
    tribe: "WIND",
    classType: "SUPPORT",
    tier: 3,
    stats: { hp: 280, atk: 26, def: 16, matk: 72, mdef: 27, range: 3, rageMax: 4 },
    skillId: "rage_chant"
  },
  {
    id: "qilin_breeze",
    name: "Kỳ Lân Gió",
    tribe: "SPIRIT",
    classType: "SUPPORT",
    tier: 4,
    stats: { hp: 300, atk: 28, def: 17, matk: 82, mdef: 28, range: 3, rageMax: 5 },
    skillId: "wind_path"
  },
  {
    id: "tiger_fang",
    name: "Hổ Nanh",
    tribe: "FIRE",
    classType: "FIGHTER",
    tier: 1,
    stats: { hp: 305, atk: 58, def: 20, matk: 14, mdef: 16, range: 1, rageMax: 3 },
    skillId: "cleave_fang"
  },
  {
    id: "wolf_alpha",
    name: "Sói Thủ Lĩnh",
    tribe: "NIGHT",
    classType: "FIGHTER",
    tier: 2,
    stats: { hp: 325, atk: 64, def: 21, matk: 16, mdef: 17, range: 1, rageMax: 3 },
    skillId: "alpha_howl"
  },
  {
    id: "hippo_maul",
    name: "Hà Mã Nện",
    tribe: "TIDE",
    classType: "FIGHTER",
    tier: 3,
    stats: { hp: 350, atk: 70, def: 23, matk: 18, mdef: 18, range: 1, rageMax: 3 },
    skillId: "mud_slam"
  },
  {
    id: "beetle_drill",
    name: "Bọ Khoan Giáp",
    tribe: "SWARM",
    classType: "FIGHTER",
    tier: 4,
    stats: { hp: 370, atk: 76, def: 24, matk: 20, mdef: 19, range: 1, rageMax: 3 },
    skillId: "armor_drill"
  },
  {
    id: "worm_queen",
    name: "Sâu Xanh",
    tribe: "SWARM",
    classType: "MAGE",
    tier: 3,
    stats: { hp: 280, atk: 20, def: 12, matk: 85, mdef: 22, range: 4, rageMax: 2 },
    skillId: "worm_evolve"
  },
  {
    id: "mosquito_toxic",
    name: "Muỗi Độc",
    tribe: "SWARM",
    classType: "ASSASSIN",
    tier: 2,
    stats: { hp: 240, atk: 75, def: 14, matk: 15, mdef: 12, range: 1, rageMax: 3 },
    skillId: "mosquito_drain"
  },
  {
    id: "bug_plague",
    name: "Bọ Dịch Hạch",
    tribe: "SWARM",
    classType: "MAGE",
    tier: 4,
    stats: { hp: 260, atk: 22, def: 13, matk: 92, mdef: 24, range: 4, rageMax: 4 },
    skillId: "global_poison"
  },
  {
    id: "lion_general",
    name: "Sư Tử Chiến Tướng",
    tribe: "FIRE",
    classType: "FIGHTER",
    tier: 5,
    stats: { hp: 550, atk: 95, def: 40, matk: 30, mdef: 35, range: 1, rageMax: 4 },
    skillId: "lion_roar_stun"
  },
  {
    id: "ant_guard",
    name: "Kiến Hộ Vệ",
    tribe: "SWARM",
    classType: "TANKER",
    tier: 2,
    stats: { hp: 420, atk: 45, def: 45, matk: 10, mdef: 30, range: 1, rageMax: 4 },
    skillId: "ant_shield_wall"
  },
  {
    id: "mantis_blade",
    name: "Bọ Ngựa Kiếm",
    tribe: "SWARM",
    classType: "ASSASSIN",
    tier: 3,
    stats: { hp: 310, atk: 88, def: 20, matk: 15, mdef: 18, range: 1, rageMax: 3 },
    skillId: "mantis_slice"
  },
  {
    id: "wasp_sting",
    name: "Ong Bắp Cày",
    tribe: "SWARM",
    classType: "ARCHER",
    tier: 2,
    stats: { hp: 260, atk: 65, def: 15, matk: 12, mdef: 14, range: 4, rageMax: 3 },
    skillId: "poison_sting"
  },
  {
    id: "scorpion_king",
    name: "Vua Bọ Cạp",
    tribe: "SWARM",
    classType: "FIGHTER",
    tier: 4,
    stats: { hp: 440, atk: 82, def: 32, matk: 20, mdef: 25, range: 1, rageMax: 3 },
    skillId: "scorpion_venom"
  }
];

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
