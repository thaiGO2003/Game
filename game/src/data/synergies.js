import synergiesCsv from "../../data/synergies.csv?raw";

function parseBonusValue(bonusStrRaw) {
  const raw = String(bonusStrRaw ?? "").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (_err) {
    // Support legacy CSV object syntax like: {poisonOnHit:22}
    const normalized = raw
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*}/g, "}");
    try {
      return JSON.parse(normalized);
    } catch (_err2) {
      console.warn("Failed to parse bonus JSON", bonusStrRaw);
      return {};
    }
  }
}

function parseSynergiesCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  // header: group,id,name,threshold,bonus
  const classSynergy = {};
  const tribeSynergy = {};

  for (let i = 1; i < lines.length; i++) {
    // Simple split by comma, respecting quotes for JSON bonus
    const matches = lines[i].match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)|(,)/g);
    // Re-use simple parser logic or regex
    const values = [];
    let current = "";
    let inQuote = false;
    for (const char of lines[i]) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length < 5) continue;

    const group = values[0];
    const id = values[1];
    // name is values[2] (ignored or used for UI?)
    const threshold = Number(values[3]);
    let bonusStr = values[4];

    // Remove quotes around JSON
    if (bonusStr.startsWith('"') && bonusStr.endsWith('"')) {
      bonusStr = bonusStr.slice(1, -1).replace(/""/g, '"');
    }

    const bonus = parseBonusValue(bonusStr);

    if (group !== "CLASS" && group !== "TRIBE") continue;
    const targetObj = group === "CLASS" ? classSynergy : tribeSynergy;

    if (!targetObj[id]) {
      targetObj[id] = { thresholds: [], bonuses: [] };
    }

    targetObj[id].thresholds.push(threshold);
    targetObj[id].bonuses.push(bonus);
  }

  return { CLASS_SYNERGY: classSynergy, TRIBE_SYNERGY: tribeSynergy };
}

const parsedSynergies = parseSynergiesCsv(synergiesCsv);
export const CLASS_SYNERGY = parsedSynergies.CLASS_SYNERGY;
export const TRIBE_SYNERGY = parsedSynergies.TRIBE_SYNERGY;

/** Khắc chế nguyên tố: key khắc value (+20% dmg tấn công HOẶC -20% dmg nhận phòng thủ) */
export const TRIBE_COUNTER = {
  FIRE: "SPIRIT",
  SPIRIT: "TIDE",
  TIDE: "FIRE",
  STONE: "WIND",
  WIND: "NIGHT",
  NIGHT: "STONE",
  SWARM: null,
  WOOD: "TIDE"
};

export const TRIBE_COUNTER_LABEL = {
  FIRE: "Hỏa khắc Linh",
  SPIRIT: "Linh khắc Thủy",
  TIDE: "Thủy khắc Hỏa",
  STONE: "Nham khắc Phong",
  WIND: "Phong khắc Dạ",
  NIGHT: "Dạ khắc Nham",
  WOOD: "Mộc khắc Thủy"
};

/** Khắc chế vai trò: key trị các value */
export const CLASS_COUNTER = {
  ASSASSIN: ["MAGE", "ARCHER"],
  ARCHER: ["MAGE"],
  FIGHTER: ["ASSASSIN"],
  TANKER: [],
  MAGE: [],
  SUPPORT: []
};

export const COUNTER_BONUS = 0.50;
