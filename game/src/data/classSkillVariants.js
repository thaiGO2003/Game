/**
 * classSkillVariants.js
 *
 * Synergy skill variant bonuses per class — data config for the planning phase.
 * Previously embedded in PlanningScene.js.
 */

export const CLASS_SKILL_VARIANTS = {
    TANKER: [
        { name: "Giáp Dày", bonus: { defFlat: 6, hpPct: 0.04 } },
        { name: "Phản Chấn", bonus: { shieldStart: 18 } },
        { name: "Thành Lũy", bonus: { mdefFlat: 6, hpPct: 0.03 } }
    ],
    ASSASSIN: [
        { name: "Sát Ý", bonus: { atkPct: 0.09 } },
        { name: "Đoạt Mệnh", bonus: { critPct: 0.1 } },
        { name: "Lướt Ảnh", bonus: { startingRage: 1 } }
    ],
    ARCHER: [
        { name: "Xuyên Tâm", bonus: { atkPct: 0.07 } },
        { name: "Liên Xạ", bonus: { startingRage: 1 } },
        { name: "Ưng Nhãn", bonus: { critPct: 0.08 } }
    ],
    MAGE: [
        { name: "Cường Chú", bonus: { matkPct: 0.1 } },
        { name: "Tụ Lực", bonus: { startingRage: 1 } },
        { name: "Khuếch Tán", bonus: { matkPct: 0.06, mdefFlat: 5 } }
    ],
    SUPPORT: [
        { name: "Thần Hộ", bonus: { shieldStart: 16 } },
        { name: "Trị Liệu", bonus: { healPct: 0.08 } },
        { name: "Cổ Vũ", bonus: { startingRage: 1 } }
    ],
    FIGHTER: [
        { name: "Cuồng Nộ", bonus: { atkPct: 0.08 } },
        { name: "Bền Bỉ", bonus: { hpPct: 0.05 } },
        { name: "Chiến Ý", bonus: { critPct: 0.06, atkPct: 0.04 } }
    ]
};
