/**
 * Shared helper functions for generating unit / skill tooltip descriptions.
 *
 * Extracted from PlanningScene and CombatScene to eliminate duplication.
 * Both scenes should import from this module instead of defining their own.
 */

import { starTargetBonus, getWaspMaxTargets } from "./gameUtils.js";
import { getElementLabel, getStarElementEffect } from "../data/elementInfo.js";

// ─── Star multiplier helpers ────────────────────────────────────────────

export function getStarStatMultiplier(star) {
    if (star >= 3) return 2.5;
    if (star === 2) return 1.6;
    return 1;
}

export function getStarSkillMultiplier(star) {
    if (star >= 3) return 1.4;
    if (star === 2) return 1.2;
    return 1;
}

// ─── Action / damage type translation ───────────────────────────────────

export function inferBasicActionPattern(classType, range) {
    if (range >= 2) return "RANGED_STATIC";
    if (classType === "ASSASSIN") return "ASSASSIN_BACK";
    return "MELEE_FRONT";
}

export function translateActionPattern(pattern) {
    const map = {
        MELEE_FRONT: "Cận chiến áp sát tiền tuyến",
        ASSASSIN_BACK: "Lao ra hậu phương rồi quay về",
        RANGED_STATIC: "Đứng yên và bắn từ xa",
        SELF: "Tự cường hóa hoặc hỗ trợ"
    };
    return map[pattern] ?? pattern;
}

export function translateDamageType(type) {
    if (type === "physical") return "Vật lý";
    if (type === "magic") return "Phép";
    if (type === "true") return "Chuẩn";
    return type ?? "-";
}

export function translateScaleStat(stat) {
    if (stat === "matk") return "MATK";
    if (stat === "atk") return "ATK";
    if (stat === "def") return "DEF";
    if (stat === "mdef") return "MDEF";
    return String(stat ?? "chỉ số");
}

// ─── Skill description text stripping ───────────────────────────────────

export function stripSkillStarNotes(description) {
    const raw = String(description ?? "").trim();
    if (!raw) return "";
    return raw.replace(/\s*Mốc sao:[\s\S]*$/i, "").trim();
}

/**
 * Parse "Mốc sao: 1★ text A, 2★ text B, 3★ text C" từ descriptionVi.
 * Cũng hỗ trợ format trực tiếp: "... 1★ text; 2★ text; 3★ text" (không cần prefix).
 * Trả về mảng [{star:1, text:'text A'}, ...] hoặc [] nếu không có.
 */
export function parseStarMilestonesFromDesc(description) {
    const raw = String(description ?? "");
    // Thử match với prefix "Mốc sao:" trước
    let part = "";
    const prefixMatch = raw.match(/Mốc sao:\s*([\s\S]+)$/i);
    if (prefixMatch) {
        part = prefixMatch[1].trim();
    } else {
        // Fallback: tìm pattern "1★" trực tiếp trong description
        const directMatch = raw.match(/(1[★⭐]\s*[\s\S]+)$/);
        if (directMatch) {
            part = directMatch[1].trim();
        }
    }
    if (!part) return [];
    // Tách theo pattern "N★"
    const segments = part.split(/(?=\d[★⭐])/);
    const result = [];
    for (const seg of segments) {
        const m = seg.match(/^(\d)[★⭐]\s*(.+?)[\.\,;]?\s*$/);
        if (m) {
            result.push({ star: Number(m[1]), text: m[2].trim().replace(/[.,;]$/, "") });
        }
    }
    return result;
}

// ─── Basic attack description ───────────────────────────────────────────

export function describeBasicAttack(classType, range, baseStats = null, star = 1) {
    const pattern = inferBasicActionPattern(classType, range);
    const lines = [];

    // Determine which stat the basic attack uses
    const isMagic = classType === "MAGE";
    const statKey = isMagic ? "matk" : "atk";
    const statLabel = translateScaleStat(statKey);
    const statMult = getStarStatMultiplier(star);
    const rawStat = Number(baseStats?.[statKey] ?? 0) || 0;
    const scaledStat = Math.round(rawStat * statMult);
    const formulaStr = `📊 Công thức: 1.0 x ${statLabel}(${scaledStat}) = ${scaledStat}`;
    const fallbackFormula = `📊 Công thức: ${statLabel} vs ${isMagic ? "kháng phép" : "giáp"} mục tiêu.`;
    const formula = baseStats ? formulaStr : fallbackFormula;

    if (classType === "TANKER") {
        lines.push("⚡ Thi triển: Cận chiến áp sát tiền tuyến");
        lines.push("💢 Loại ST: Vật lý");
        lines.push("🎯 Ưu tiên địch gần nhất cùng hàng.");
        lines.push(formula);
    } else if (classType === "FIGHTER") {
        lines.push("⚡ Thi triển: Xung phong cận chiến");
        lines.push("💢 Loại ST: Vật lý");
        lines.push("🎯 Ưu tiên địch gần nhất cùng hàng.");
        lines.push(formula);
    } else if (classType === "ASSASSIN") {
        lines.push("⚡ Thi triển: Lao sau lưng mục tiêu");
        lines.push("💢 Loại ST: Vật lý");
        lines.push("🎯 Ưu tiên carry hậu phương.");
        lines.push(formula);
    } else if (classType === "ARCHER") {
        lines.push(`⚡ Thi triển: Bắn tên từ xa`);
        lines.push("💢 Loại ST: Vật lý");
        lines.push("🎯 Ưu tiên cùng hàng, gần tiền tuyến.");
        lines.push(formula);
    } else if (classType === "MAGE") {
        lines.push(`⚡ Thi triển: Phép thuật từ xa`);
        lines.push("💢 Loại ST: Phép (không bao giờ hụt)");
        lines.push("🎯 Ưu tiên cùng hàng, gần tiền tuyến.");
        lines.push(formula);
    } else if (classType === "SUPPORT") {
        lines.push(`⚡ Thi triển: Hỗ trợ/Phép từ xa`);
        lines.push("💢 Loại ST: Vật lý / Phép (skill)");
        lines.push("🎯 Ưu tiên địch gần hoặc đồng minh yếu.");
        lines.push(formula);
    } else {
        lines.push(`⚡ Thi triển: ${translateActionPattern(pattern)}`);
        lines.push("💢 Loại ST: Vật lý");
        lines.push("🎯 Ưu tiên tiền tuyến gần nhất.");
        lines.push(formula);
    }
    return lines;
}

// ─── Skill target / shape / damage helpers ──────────────────────────────

export function getSkillTargetCountText(skill, star) {
    if (!skill) return "không rõ";
    const effect = String(skill.effect ?? "");
    const targetBonus = starTargetBonus(star);
    const maxHits = Number.isFinite(skill.maxHits) ? Math.max(1, Math.floor(skill.maxHits)) : null;
    const maxTargets = Number.isFinite(skill.maxTargets) ? Math.max(1, Math.floor(skill.maxTargets)) : null;

    if (effect === "random_multi") {
        const baseHits = getWaspMaxTargets({ star }, skill) ?? maxHits ?? 3;
        const count = skill.id === "wasp_triple_strike" ? baseHits : baseHits + targetBonus;
        return `${count} mục tiêu`;
    }
    if (effect === "row_multi") {
        return `${maxHits ?? 3} mục tiêu cùng hàng`;
    }
    if (effect === "team_rage") {
        return `${maxTargets ?? 3} đồng minh`;
    }
    if (effect === "roar_debuff_heal") {
        const targets = Math.min(3, Math.max(1, star));
        return `${targets} kẻ địch gần nhất`;
    }
    if (effect === "single_sleep") {
        const sleepTargets = Math.min(3, Math.max(1, star));
        return `1 mục tiêu chính + ru ngủ tối đa ${sleepTargets} mục tiêu`;
    }

    const map = {
        // Single target melee
        damage_shield_taunt: "1 mục tiêu",
        damage_stun: "1 mục tiêu",
        damage_shield_reflect: "1 mục tiêu",
        single_burst: "1 mục tiêu",
        double_hit: "1 mục tiêu",
        single_burst_lifesteal: "1 mục tiêu",
        single_delayed_echo: "1 mục tiêu",
        single_sleep: "1 mục tiêu chính",
        single_armor_break: "1 mục tiêu",
        single_bleed: "1 mục tiêu",
        true_single: "1 mục tiêu",
        single_strong_poison: "1 mục tiêu",
        single_poison_slow: "1 mục tiêu",
        single_poison_stack: "1 mục tiêu",
        single_silence_lock: "1 mục tiêu",
        knockback_charge: "1 mục tiêu",
        single_burst_armor_pen: "1 mục tiêu",
        // Assassin single target
        flame_combo: "1 mục tiêu",
        quick_strike_rage: "1 mục tiêu",
        web_trap_slow: "1 mục tiêu",
        sting_paralyze: "1 mục tiêu",
        stealth_strike: "1 mục tiêu",
        double_poison_hit: "1 mục tiêu (2 đòn)",
        x_slash_bleed: "1 mục tiêu",
        backstab_crit: "1 mục tiêu",
        silent_kill_stealth: "1 mục tiêu",
        death_mark: "1 mục tiêu",
        scavenge_heal: "1 mục tiêu",
        assassin_execute_rage_refund: "1 mục tiêu",
        // Fighter specials
        komodo_venom: "1 mục tiêu",
        otter_combo: "1 mục tiêu",
        kangaroo_uppercut: "1 mục tiêu",
        bison_charge: "1 mục tiêu",
        shark_bite_frenzy: "1 mục tiêu",
        wolverine_frenzy: "bản thân",
        ram_charge_pierce: "1 mục tiêu + kẻ phía sau",
        row_charge: "toàn hàng ngang",
        // Multi-target ranged
        heat_seek: "1 mục tiêu",
        piercing_shot: "xuyên hàng",
        snipe_execute: "1 mục tiêu",
        sniper_crit: "1 mục tiêu",
        rapid_fire: `${maxHits ?? 3} phát ngẫu nhiên`,
        arrow_rain: `${maxHits ?? 4} mục tiêu ngẫu nhiên`,
        beak_disarm: "1 mục tiêu",
        fire_arrow_burn: "1 mục tiêu",
        cone_shot: "hình nón 3-5 ô",
        // Multi-target magic
        chain_shock: "3-4 mục tiêu ngẫu nhiên",
        rock_throw_stun: "1 mục tiêu",
        multi_sting_poison: `${maxHits ?? 2} mục tiêu ngẫu nhiên`,
        feather_bleed: `${maxHits ?? 3} mục tiêu ngẫu nhiên`,
        dark_feather_debuff: `${maxHits ?? 3} mục tiêu ngẫu nhiên`,
        ice_blast_freeze: "1 mục tiêu",
        frost_storm: "xuyên hàng",
        ink_blast_debuff: "cột dọc",
        dive_bomb: "cột dọc",
        fish_bomb_aoe: "tối đa 9 ô",
        // AoE
        cross_5: "tối đa 5 ô",
        column_freeze: "cột dọc (tối đa 5 ô)",
        column_bleed: "cột dọc (tối đa 5 ô)",
        row_cleave: "toàn hàng ngang",
        aoe_circle: "vùng 3x3 (tối đa 9 ô)",
        aoe_circle_stun: "vùng 3x3 (tối đa 9 ô)",
        aoe_poison: "vùng 3x3 (tối đa 9 ô)",
        column_plus_splash: "1 cột chính + 2 cột cạnh",
        cone_smash: "vùng quạt 3-8 ô",
        cleave_armor_break: "vùng quạt 3-8 ô",
        fireball_burn: "vùng 3x3 (tối đa 9 ô)",
        fire_breath_cone: "hình nón 3-5 ô",
        ink_bomb_blind: "vùng 3x3 (tối đa 9 ô)",
        dust_sleep: "vùng 3x3 (tối đa 9 ô)",
        flash_blind: "toàn bộ kẻ địch",
        pollen_confuse: "toàn bộ kẻ địch",
        plague_spread: "1 mục tiêu + lan kề",
        // Global
        global_knockback: "toàn bộ kẻ địch",
        global_poison_team: "toàn bộ kẻ địch",
        global_stun: "toàn bộ kẻ địch",
        global_debuff_atk: "toàn bộ kẻ địch",
        global_tide_evade: "toàn bộ đồng minh",
        // Self buffs
        metamorphosis: "bản thân",
        turtle_protection: "bản thân",
        rhino_counter: "bản thân",
        pangolin_reflect: "bản thân",
        self_armor_reflect: "bản thân",
        self_shield_immune: "bản thân",
        self_def_fortify: "bản thân",
        self_maxhp_boost: "bản thân",
        self_bersek: "bản thân",
        resilient_shield: "bản thân",
        self_regen_team_heal: "bản thân + đồng minh kề",
        // Ally buffs
        ally_row_def_buff: "đồng minh cùng hàng",
        column_bless: "đồng minh cùng cột",
        dual_heal: "2 đồng minh yếu nhất",
        shield_cleanse: "1 đồng minh yếu nhất",
        team_def_buff: "toàn bộ đồng minh",
        team_shield: "toàn bộ đồng minh",
        team_evade_buff: "toàn bộ đồng minh",
        warcry_atk_def: "toàn bộ đồng minh + bản thân",
        frost_aura_buff: `${maxTargets ?? 2} đồng minh`,
        guardian_pact: "1 đồng minh yếu nhất",
        team_rage_self_heal: "toàn bộ đồng minh + bản thân",
        self_atk_and_assist: "1 mục tiêu + đồng minh hỗ trợ",
        scout_buff_ally: "1 đồng minh",
        // Support heal/buff
        heal_over_time: `${maxTargets ?? 3} đồng minh yếu nhất`,
        spring_aoe_heal: "toàn bộ đồng minh",
        soul_link_heal: "1 đồng minh yếu nhất",
        peace_heal_reduce_dmg: "1 đồng minh yếu nhất",
        bless_rain_mdef: "toàn bộ đồng minh",
        light_purify: `${maxTargets ?? 2} đồng minh`,
        mirror_reflect: "bản thân",
        unicorn_atk_buff: "1 đồng minh ATK cao nhất",
        wind_shield_ally: `${maxTargets ?? 2} đồng minh yếu nhất`,
        phoenix_rebirth: "bản thân (hồi sinh) / đồng minh yếu nhất",
        revive_or_heal: "đồng minh chết / đồng minh yếu nhất",
        mass_cleanse: "1-3 đồng minh (theo sao)",
        pack_howl_rage: `${maxTargets ?? 2} đồng minh`,
        mimic_rage_buff: "1 đồng minh",
        root_snare_debuff: "1 mục tiêu + bản thân",
        lifesteal_disease: "1 mục tiêu",
        multi_disarm: "3 kẻ địch ATK cao nhất",
        random_lightning: "5 lần giáng ngẫu nhiên",
    };
    return map[effect] ?? "theo tình huống";
}

export function getSkillShapeText(skill) {
    if (!skill) return "không rõ";
    const effect = String(skill.effect ?? "");
    const map = {
        damage_shield_taunt: "1 ô điểm tiền tuyến",
        damage_stun: "1 ô điểm",
        damage_shield_reflect: "1 ô điểm",
        single_burst: "1 ô điểm",
        double_hit: "1 ô điểm (2 nhát)",
        single_burst_lifesteal: "1 ô điểm",
        single_delayed_echo: "1 ô điểm + dội lại cùng ô",
        single_sleep: "1 ô điểm",
        single_armor_break: "1 ô điểm",
        single_bleed: "1 ô điểm",
        true_single: "1 ô điểm",
        cross_5: "hình chữ thập 5 ô",
        row_multi: "hàng ngang",
        row_cleave: "hàng ngang",
        column_freeze: "cột dọc",
        column_bleed: "cột dọc",
        column_plus_splash: "cột dọc + 2 cột kế bên",
        aoe_circle: "vùng vuông 3x3",
        aoe_poison: "vùng vuông 3x3",
        random_multi: "rải ngẫu nhiên trên bàn địch",
        ally_row_def_buff: "hàng ngang đồng minh",
        column_bless: "cột dọc đồng minh",
        dual_heal: "2 ô đồng minh thấp máu",
        shield_cleanse: "1 ô đồng minh thấp máu",
        team_rage: "nhóm đồng minh gần bản thân",
        global_tide_evade: "toàn bộ bàn đồng minh",
        global_knockback: "toàn bộ bàn địch",
        global_poison_team: "toàn bộ bàn địch",
        global_stun: "toàn bộ bàn địch",
        multi_disarm: "3 mục tiêu địch có công cao nhất",
        random_lightning: "5 điểm ngẫu nhiên phía địch",
        metamorphosis: "tự thân",
        turtle_protection: "tự thân",
        rhino_counter: "tự thân",
        pangolin_reflect: "tự thân",
        self_atk_and_assist: "điểm tiền tuyến + đồng minh cùng hàng hỗ trợ",
        cone_smash: "quạt 3 ô phía trước",
        team_def_buff: "toàn bộ bàn đồng minh"
    };
    return map[effect] ?? "mẫu kỹ năng đặc thù";
}

export function getSkillDamageAndFormulaText(skill, baseStats, star) {
    const starSkillMult = getStarSkillMultiplier(star);
    const damageType = translateDamageType(skill?.damageType || "physical");
    const statFromKey = (key) => Math.round((Number(baseStats?.[key] ?? 0) || 0) * getStarStatMultiplier(star));

    if (skill?.hit1 && skill?.hit2) {
        const statKey = skill.scaleStat || "atk";
        const statLabel = translateScaleStat(statKey);
        const statValue = statFromKey(statKey);
        const h1Base = Number(skill.hit1.base ?? 0);
        const h1Scale = Number(skill.hit1.scale ?? 0);
        const h2Base = Number(skill.hit2.base ?? 0);
        const h2Scale = Number(skill.hit2.scale ?? 0);
        const h1 = Math.round((h1Base + statValue * h1Scale) * starSkillMult);
        const h2 = Math.round((h2Base + statValue * h2Scale) * starSkillMult);
        const total = Math.max(0, h1 + h2);
        const formula = `Công thức: [(${statLabel}(${statValue}) x ${h1Scale} + ${h1Base}) + (${statLabel}(${statValue}) x ${h2Scale} + ${h2Base})] x${starSkillMult.toFixed(2)} = ${total}`;
        return { damageText: `${total} (${damageType})`, formulaText: formula };
    }

    const baseVal = Number(skill?.base);
    const scaleVal = Number(skill?.scale);
    if (!Number.isFinite(baseVal) || !Number.isFinite(scaleVal)) {
        return {
            damageText: "không gây sát thương trực tiếp",
            formulaText: "Công thức: Không có công thức sát thương trực tiếp."
        };
    }

    const statKey = skill.scaleStat || "atk";
    const statLabel = translateScaleStat(statKey);
    const statValue = statFromKey(statKey);
    const total = Math.max(0, Math.round((baseVal + statValue * scaleVal) * starSkillMult));
    const formula = `Công thức: (${statLabel}(${statValue}) x ${scaleVal} + ${baseVal}) x${starSkillMult.toFixed(2)} = ${total}`;
    return { damageText: `${total} (${damageType})`, formulaText: formula };
}

// ─── Skill star milestone lines ─────────────────────────────────────────

export function buildSkillStarMilestoneLines(skill, baseUnit) {
    if (!skill) return [];
    const baseStats = baseUnit?.stats ?? null;
    const lines = [];

    // Đọc mốc sao từ descriptionVi CSV nếu có
    const csvMilestones = parseStarMilestonesFromDesc(skill.descriptionVi || skill.description);
    const milestoneMap = {};
    for (const m of csvMilestones) milestoneMap[m.star] = m.text;

    for (let star = 1; star <= 3; star += 1) {
        const starIcons = "⭐".repeat(star);
        // Dòng mốc sao chính từ CSV
        const milestoneText = milestoneMap[star];
        if (milestoneText) {
            lines.push(`${starIcons} Mốc ${star} sao: ${milestoneText}`);
        } else {
            lines.push(`${starIcons} ${star} sao:`);
        }
        // Các dòng cơ học chi tiết (giữ nguyên)
        const targetText = getSkillTargetCountText(skill, star);
        const shapeText = getSkillShapeText(skill);
        const { damageText, formulaText } = getSkillDamageAndFormulaText(skill, baseStats, star);
        lines.push(`  • 💥 Sát thương: ${damageText}`);
        lines.push(`  • 🎯 Mục tiêu: ${targetText}`);
        lines.push(`  • 📐 Hình dạng: ${shapeText}`);
        if (formulaText) lines.push(`  • 📊 ${formulaText}`);
    }
    return lines;
}

// ─── Full skill description ─────────────────────────────────────────────

export function describeSkillLines(skill, baseUnit = null) {
    if (!skill) return ["Không có kỹ năng chủ động."];
    const lines = [];
    const description = stripSkillStarNotes(skill.descriptionVi || skill.description);
    if (description) lines.push(description);
    lines.push("Mốc sao:");
    lines.push(...buildSkillStarMilestoneLines(skill, baseUnit));
    return lines;
}

/** Shorthand: join skill description lines into a single string */
export function describeSkill(skill) {
    return describeSkillLines(skill).join(" | ");
}

// ─── Skill area description ─────────────────────────────────────────────

/** Get a Vietnamese description of a skill's area‑of‑effect */
export function describeSkillArea(skill) {
    if (!skill) return "";
    const maxHits = Number.isFinite(skill.maxHits) ? Math.max(1, Math.floor(skill.maxHits)) : null;
    const maxTargets = Number.isFinite(skill.maxTargets) ? Math.max(1, Math.floor(skill.maxTargets)) : null;
    const map = {
        damage_shield_taunt: "Đánh đơn mục tiêu, tạo khiên và khiêu khích.",
        damage_stun: "Đánh đơn mục tiêu, có tỷ lệ gây choáng.",
        damage_shield_reflect: "Đánh đơn mục tiêu, tạo khiên phản đòn.",
        ally_row_def_buff: "Cường hóa giáp và kháng phép cho hàng ngang đồng minh.",
        single_burst: "Tấn công mạnh vào 1 mục tiêu.",
        double_hit: "Tấn công liên tiếp 2 lần vào 1 mục tiêu.",
        single_burst_lifesteal: "Tấn công mạnh và hút máu từ mục tiêu.",
        single_delayed_echo: "Gây sát thương, sau đó nổ thêm lần nữa (vọng âm).",
        cross_5: "Tấn công 5 ô theo hình chữ thập.",
        row_multi: `Bắn xuyên thấu ${maxHits ?? 3} mục tiêu trên cùng hàng.`,
        random_multi: `Bắn ngẫu nhiên ${maxHits ?? 3} mục tiêu.`,
        single_sleep: "Gây sát thương và ru ngủ mục tiêu.",
        single_armor_break: "Gây sát thương và phá giáp mục tiêu.",
        column_freeze: "Triệu hồi cột băng tấn công dọc và gây đóng băng.",
        aoe_circle: "Nổ năng lượng vùng vuông 3x3 quanh mục tiêu.",
        column_plus_splash: "Tấn công cột dọc và lan sang 2 bên.",
        column_bleed: "Xé dọc theo cột mục tiêu, gây chảy máu cho toàn bộ nạn nhân trúng đòn.",
        aoe_poison: "Phun mưa độc vùng 3x3 (tối đa 9 ô).",
        dual_heal: "Hồi máu cho 2 đồng minh yếu nhất.",
        shield_cleanse: "Tạo khiên và xóa hiệu ứng xấu cho đồng minh.",
        team_rage: `Hồi nộ cho ${maxTargets ?? 3} đồng minh xung quanh.`,
        column_bless: "Ban phước tấn công và né tránh cho cột dọc đồng minh.",
        global_tide_evade: "Sóng thần không gây sát thương, hồi đầy máu cho toàn bộ đồng minh.",
        global_knockback: "Gây sát thương toàn bộ kẻ địch và đẩy lùi hàng tiền tuyến 1 ô.",
        team_def_buff: "Tăng giáp + kháng phép toàn đội và hồi máu đồng minh thấp máu nhất.",
        row_cleave: "Quét vũ khí tấn công toàn bộ hàng ngang.",
        self_atk_and_assist: "Tự tăng công và gọi đồng minh cùng hàng đánh bồi.",
        cone_smash: "Nện xuống đất gây sát thương vùng quạt 3 ô vuông.",
        true_single: "Gây sát thương chuẩn (bỏ qua giáp) vào 1 mục tiêu.",
        global_poison_team: "Rải độc tố gây sát thương theo thời gian lên TẤT CẢ kẻ địch.",
        lifesteal_disease: "Hút máu mục tiêu và lây bệnh sang kẻ địch lân cận mỗi lượt.",
        lifesteal_disease_maxhp: "Hút máu mạnh, tăng HP tối đa theo sát thương và phát tán dịch bệnh.",
        single_poison_stack: "Đánh đơn mục tiêu, độc cộng dồn theo từng lần trúng.",
        double_hit_gold_reward: "Đánh 2 nhát; nếu kết liễu mục tiêu sẽ thưởng thêm vàng.",
        assassin_execute_rage_refund: "Đòn kết liễu sát thủ: hồi nộ, thưởng vàng và đánh nối chuỗi.",
        metamorphosis: "Hóa kén thành Bướm Gió, tăng mạnh MATK và đổi đòn đánh thường thành sát thương phép theo MATK; từ 2★ buff nhanh nhẹn toàn đội."
    };
    const text = map[skill.effect];
    if (text) return text;

    if (skill.actionPattern === "SELF") return "Không tấn công trực tiếp; hiệu ứng tự thân/hỗ trợ.";
    if (String(skill.effect ?? "").includes("single")) return "Tấn công tập trung vào một mục tiêu đơn lẻ.";
    if (String(skill.effect ?? "").includes("row")) return "Tấn công quét ngang toàn bộ hàng.";
    if (String(skill.effect ?? "").includes("column")) return "Tấn công xuyên thấu theo cột dọc.";
    if (String(skill.effect ?? "").includes("aoe")) return "Tấn công diện rộng lên nhiều mục tiêu.";
    if (String(skill.effect ?? "").includes("cone")) return "Tấn công nhiều ô vùng quạt trước mặt.";
    return "Tấn công theo mẫu kỹ năng đặc thù.";
}

// ─── Translation helpers ────────────────────────────────────────────────

/** Translate augment group key to Vietnamese */
export function translateAugmentGroup(group) {
    const map = {
        ECONOMY: "Kinh tế",
        FORMATION: "Đội hình",
        COMBAT: "Giao tranh",
        SYNERGY: "Cộng hưởng"
    };
    return map[group] ?? group;
}

/** Get icon emoji for an augment */
export function getAugmentIcon(augment) {
    if (augment?.icon) return augment.icon;
    const map = {
        ECONOMY: "💰",
        FORMATION: "🧩",
        COMBAT: "⚔️",
        SYNERGY: "✨"
    };
    return map[augment?.group] ?? "🌲";
}

/** Translate a skill effect key to Vietnamese label */
export function translateSkillEffect(effect) {
    const map = {
        damage_shield_taunt: "Gây sát thương + khiên + khiêu khích",
        damage_stun: "Gây sát thương + choáng",
        damage_shield_reflect: "Gây sát thương + khiên phản đòn",
        ally_row_def_buff: "Tăng giáp/kháng phép theo hàng",
        single_burst: "Dồn sát thương đơn mục tiêu",
        double_hit: "Đánh hai lần",
        single_burst_lifesteal: "Dồn sát thương + hút máu",
        single_delayed_echo: "Sát thương + nổ dội",
        cross_5: "Sát thương hình chữ thập 5 ô",
        row_multi: "Bắn xuyên theo hàng",
        random_multi: "Bắn ngẫu nhiên nhiều mục tiêu",
        single_sleep: "Sát thương + gây ngủ",
        single_armor_break: "Sát thương + giảm giáp",
        column_freeze: "Cột băng + đóng băng",
        aoe_circle: "Nổ vùng vuông 3x3",
        column_plus_splash: "Đánh cột + lan cạnh",
        aoe_poison: "Độc diện rộng",
        dual_heal: "Hồi máu 2 đồng minh",
        shield_cleanse: "Tạo khiên + thanh tẩy",
        team_rage: "Tăng nộ đồng minh",
        column_bless: "Cường hóa theo cột",
        global_tide_evade: "Sóng thần hồi đầy máu đồng minh",
        global_knockback: "Sóng thần toàn bản đồ + đẩy lùi tiền tuyến",
        team_def_buff: "Tăng giáp/kháng phép toàn đội + hồi máu thấp nhất",
        column_bleed: "Cào rách theo cột",
        row_cleave: "Quét hàng",
        self_atk_and_assist: "Tự cường hóa + đánh phụ trợ",
        cone_smash: "Nện vùng quạt 3 ô",
        true_single: "Sát thương chuẩn đơn mục tiêu",
        global_poison_team: "Đại Dịch Toàn Cầu",
        lifesteal_disease: "Hút Máu & Lây Bệnh",
        lifesteal_disease_maxhp: "Hút Máu + Tăng HP Tối Đa",
        single_poison_stack: "Độc Cộng Dồn",
        double_hit_gold_reward: "Song Kích Thưởng Vàng",
        assassin_execute_rage_refund: "Tất Sát Hoàn Nộ",
        metamorphosis: "Hóa Kén Phong Mộc (MATK + đòn phép)"
    };
    return map[effect] ?? effect;
}

/** Format a bonus object as a human‑readable string */
export function formatBonusSet(bonus) {
    if (!bonus) return "chưa có hiệu ứng";
    return Object.entries(bonus)
        .map(([k, v]) => `${k}:${typeof v === "number" && v < 1 ? `${Math.round(v * 100)}%` : v}`)
        .join(", ");
}

// ─── Species-based evasion (from CSV species field) ─────────────────────

const FAST_SPECIES = ["ho", "bao", "soi", "cao", "doi", "khi", "chon", "tho"];
const SLOW_SPECIES = ["voi", "rua", "trau", "gau", "te-giac", "ha-ma"];

/**
 * Get base evasion percentage based on unit species.
 * Fast species (hổ, báo, sói, cáo, dơi, khỉ): 25-35%
 * Slow species (voi, rùa, trâu, gấu): 5-10%
 * Medium (others): 12-20%
 *
 * @param {string} species - species field from units.csv
 * @returns {number} evasion percentage (integer)
 */
export function getSpeciesEvasion(species) {
    const s = String(species ?? "").toLowerCase().trim();
    if (FAST_SPECIES.includes(s)) return 25;
    if (SLOW_SPECIES.includes(s)) return 5;
    return 12;
}

/**
 * Get base accuracy percentage based on unit class and tier.
 * Includes tier bonus: (tier - 1) * 2
 *
 * @param {string} classType - e.g. "TANKER", "MAGE"
 * @param {number} [tier=1] - unit tier (1-5)
 * @returns {number} accuracy percentage
 */
export function getClassAccuracy(classType, tier = 1) {
    const map = {
        TANKER: 90, FIGHTER: 105, ASSASSIN: 115,
        ARCHER: 105, MAGE: 100, SUPPORT: 95
    };
    const base = map[classType] ?? 95;
    const tierBonus = (Math.max(1, tier || 1) - 1) * 2;
    return base + tierBonus;
}

// ─── Skill description with element effects ─────────────────────────────

/**
 * Generate skill description lines including per-star element effects.
 *
 * Extends the standard `describeSkillLines` with element effect info
 * based on the unit's tribe.
 *
 * @param {object} skill - skill object
 * @param {string} tribe - tribe key e.g. "FIRE"
 * @param {object} [baseUnit] - base unit for stat calculation
 * @returns {string[]} description lines
 */
export function describeSkillWithElement(skill, tribe, baseUnit = null) {
    if (!skill) return ["Không có kỹ năng chủ động."];
    const lines = [];

    // Skill description (without star notes)
    const description = stripSkillStarNotes(skill.descriptionVi || skill.description);
    if (description) lines.push(description);

    // Element label
    const elementLabel = getElementLabel(tribe);
    if (elementLabel) {
        lines.push(`Nguyên tố: ${elementLabel}`);
    }

    // Star milestones with element effects
    lines.push("Mốc sao:");
    const baseStats = baseUnit?.stats ?? null;
    for (let star = 1; star <= 3; star += 1) {
        const targetText = getSkillTargetCountText(skill, star);
        const shapeText = getSkillShapeText(skill);
        const { damageText, formulaText } = getSkillDamageAndFormulaText(skill, baseStats, star);
        const elementEffect = getStarElementEffect(tribe, star);

        // Dòng mốc sao chính từ CSV
        const csvMilestones = parseStarMilestonesFromDesc(skill.descriptionVi || skill.description);
        const milestoneMap = {};
        for (const m of csvMilestones) milestoneMap[m.star] = m.text;
        const milestoneText = milestoneMap[star];
        if (milestoneText) {
            lines.push(`${"⭐".repeat(star)} Mốc ${star} sao: ${milestoneText}`);
        } else {
            lines.push(`${"⭐".repeat(star)} ${star} sao:`);
        }
        lines.push(`  • 💥 Sát thương: ${damageText}`);
        lines.push(`  • 🎯 Mục tiêu: ${targetText}`);
        lines.push(`  • 📐 Hình dạng: ${shapeText}`);
        if (formulaText) {
            lines.push(`  • 📊 ${formulaText}`);
        }
        if (elementEffect) {
            lines.push(`  • ${elementLabel} ${elementEffect}`);
        }
    }

    return lines;
}
