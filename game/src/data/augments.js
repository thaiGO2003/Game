export const AUGMENT_ROUNDS = [3, 5, 7];

export const AUGMENT_LIBRARY = [
  {
    id: "gold_cache",
    name: "Kho Vàng Rừng",
    group: "ECONOMY",
    description: "+8 vàng ngay lập tức.",
    effect: { type: "gold_flat", value: 8 }
  },
  {
    id: "banking_roots",
    name: "Rễ Giữ Vàng",
    group: "ECONOMY",
    description: "+1 trần lãi.",
    effect: { type: "interest_cap", value: 1 }
  },
  {
    id: "cheap_reroll",
    name: "Đổi Tướng Tiết Kiệm",
    group: "ECONOMY",
    description: "Đổi tướng giảm 1 vàng (tối thiểu còn 1).",
    effect: { type: "roll_cost_delta", value: -1 }
  },
  {
    id: "wild_command",
    name: "Hiệu Lệnh Hoang Dã",
    group: "FORMATION",
    description: "+1 giới hạn triển khai.",
    effect: { type: "deploy_cap_bonus", value: 1 }
  },
  {
    id: "deep_bench",
    name: "Kho Dự Bị Sâu",
    group: "FORMATION",
    description: "+2 ô dự bị.",
    effect: { type: "bench_bonus", value: 2 }
  },
  {
    id: "opening_fury",
    name: "Nộ Khí Khai Trận",
    group: "COMBAT",
    description: "Đồng minh bắt đầu trận với +1 nộ.",
    effect: { type: "starting_rage", value: 1 }
  },
  {
    id: "battle_hunger",
    name: "Khát Chiến",
    group: "COMBAT",
    description: "Toàn đội +12% công vật lý.",
    effect: { type: "team_atk_pct", value: 0.12 }
  },
  {
    id: "iron_canopy",
    name: "Tán Sắt",
    group: "COMBAT",
    description: "Toàn đội +12% máu.",
    effect: { type: "team_hp_pct", value: 0.12 }
  },
  {
    id: "aegis_seed",
    name: "Mầm Khiên Cổ",
    group: "COMBAT",
    description: "Mỗi tướng có +35 khiên đầu trận.",
    effect: { type: "starting_shield", value: 35 }
  },
  {
    id: "arcane_sap",
    name: "Nhựa Pháp Lực",
    group: "COMBAT",
    description: "Toàn đội +15% công phép.",
    effect: { type: "team_matk_pct", value: 0.15 }
  },
  {
    id: "forest_blessing",
    name: "Phước Lành Đại Ngàn",
    group: "SYNERGY",
    description: "Tăng +1 mốc cộng hưởng Nghề cao nhất (tối đa +1 mốc).",
    effect: { type: "extra_class_count", value: 1 }
  },
  {
    id: "tribe_echo",
    name: "Vọng Âm Tộc Loài",
    group: "SYNERGY",
    description: "Tăng +1 mốc cộng hưởng Tộc cao nhất (tối đa +1 mốc).",
    effect: { type: "extra_tribe_count", value: 1 }
  },
  {
    id: "vampiric_vine",
    name: "Dây Leo Hút Sinh",
    group: "COMBAT",
    description: "Đơn vị vật lý hồi 8% sát thương gây ra.",
    effect: { type: "lifesteal_pct", value: 0.08 }
  },
  {
    id: "guardian_pact",
    name: "Khế Ước Hộ Vệ",
    group: "COMBAT",
    description: "Giảm 2 sát thương thất bại mỗi vòng thua.",
    effect: { type: "hp_loss_reduce", value: 2 }
  },
  {
    id: "wisdom_grove",
    name: "Rừng Tri Thức",
    group: "ECONOMY",
    description: "Nhận +12 XP ngay lập tức.",
    effect: { type: "xp_flat", value: 12 }
  }
];
