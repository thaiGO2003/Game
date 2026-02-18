export const CLASS_SYNERGY = {
  TANKER: {
    thresholds: [2, 4, 6],
    bonuses: [
      { defFlat: 8, mdefFlat: 6 },
      { defFlat: 16, mdefFlat: 12 },
      { defFlat: 28, mdefFlat: 20 }
    ]
  },
  ASSASSIN: {
    thresholds: [2, 4, 6],
    bonuses: [
      { atkPct: 0.08 },
      { atkPct: 0.18 },
      { atkPct: 0.32 }
    ]
  },
  ARCHER: {
    thresholds: [2, 4, 6],
    bonuses: [
      { atkPct: 0.1 },
      { atkPct: 0.22 },
      { atkPct: 0.36 }
    ]
  },
  MAGE: {
    thresholds: [2, 4, 6],
    bonuses: [
      { matkPct: 0.1 },
      { matkPct: 0.22 },
      { matkPct: 0.36 }
    ]
  },
  SUPPORT: {
    thresholds: [2, 4, 6],
    bonuses: [
      { healPct: 0.12 },
      { healPct: 0.25 },
      { healPct: 0.4 }
    ]
  },
  FIGHTER: {
    thresholds: [2, 4, 6],
    bonuses: [
      { hpPct: 0.08, atkPct: 0.06 },
      { hpPct: 0.16, atkPct: 0.14 },
      { hpPct: 0.3, atkPct: 0.24 }
    ]
  }
};

export const TRIBE_SYNERGY = {
  STONE: {
    thresholds: [2, 4, 6],
    bonuses: [
      { shieldStart: 18 },
      { shieldStart: 40 },
      { shieldStart: 72 }
    ]
  },
  WIND: {
    thresholds: [2, 4, 6],
    bonuses: [
      { atkPct: 0.06, matkPct: 0.06 },
      { atkPct: 0.14, matkPct: 0.14 },
      { atkPct: 0.24, matkPct: 0.24 }
    ]
  },
  FIRE: {
    thresholds: [2, 4, 6],
    bonuses: [
      { burnOnHit: 6 },
      { burnOnHit: 12 },
      { burnOnHit: 20 }
    ]
  },
  TIDE: {
    thresholds: [2, 4, 6],
    bonuses: [
      { mdefFlat: 6, healPct: 0.06 },
      { mdefFlat: 14, healPct: 0.14 },
      { mdefFlat: 24, healPct: 0.24 }
    ]
  },
  NIGHT: {
    thresholds: [2, 4, 6],
    bonuses: [
      { critPct: 0.08 },
      { critPct: 0.18 },
      { critPct: 0.3 }
    ]
  },
  SPIRIT: {
    thresholds: [2, 4, 6],
    bonuses: [
      { startingRage: 1 },
      { startingRage: 1, healPct: 0.12 },
      { startingRage: 2, healPct: 0.24 }
    ]
  },
  SWARM: {
    thresholds: [2, 4, 6],
    bonuses: [
      { poisonOnHit: 8 },
      { poisonOnHit: 14 },
      { poisonOnHit: 22 }
    ]
  }
};

/** Khắc chế nguyên tố: key khắc value (+20% dmg tấn công HOẶC -20% dmg nhận phòng thủ) */
export const TRIBE_COUNTER = {
  FIRE: "SPIRIT",
  SPIRIT: "TIDE",
  TIDE: "FIRE",
  STONE: "WIND",
  WIND: "NIGHT",
  NIGHT: "STONE",
  SWARM: null
};

export const TRIBE_COUNTER_LABEL = {
  FIRE: "Hỏa khắc Linh",
  SPIRIT: "Linh khắc Thủy",
  TIDE: "Thủy khắc Hỏa",
  STONE: "Nham khắc Phong",
  WIND: "Phong khắc Dạ",
  NIGHT: "Dạ khắc Nham"
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

export const COUNTER_BONUS = 0.20;
