/**
 * Audit skills.csv — tìm tất cả skill entries bị thiếu dữ liệu quan trọng
 * 
 * Chạy: node tests/auditSkillsCsv.js
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, "../data/skills.csv");
const csvText = readFileSync(csvPath, "utf-8");

// ========== CSV PARSER (copy từ skills.js) ==========
function parseSkillsCsv(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.trim());
    const library = {};
    const allEntries = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = "";
        let inQuote = false;
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (inQuote && line[j + 1] === '"') {
                    current += '"';
                    j++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const skill = {};
        headers.forEach((header, index) => {
            let value = values[index];
            if (!header || value === undefined || value === "") return;

            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/""/g, '"');
            }

            const numFields = [
                "base", "scale", "shieldBase", "tauntTurns", "stunChance", "stunTurns", "reflectPct",
                "reflectTurns", "armorBuff", "mdefBuff", "turns", "lifesteal", "echoBase", "echoScale",
                "maxHits", "sleepChance", "sleepTurns", "armorBreak", "freezeChance", "freezeTurns",
                "splashCount", "poisonTurns", "poisonPerTurn", "shieldScale", "rageGain",
                "maxTargets", "selfAtkBuff", "assistRate", "evadeBuff", "atkBuff", "armorPen",
                "killRage", "diseaseTurns", "diseaseDamage"
            ];
            const jsonFields = ["hit1", "hit2", "buffStats"];

            if (numFields.includes(header)) {
                const num = Number(value);
                if (!isNaN(num)) skill[header] = num;
            } else if (jsonFields.includes(header)) {
                try {
                    skill[header] = JSON.parse(value);
                } catch (e) {
                    skill[`_${header}_parseError`] = value;
                }
            } else {
                skill[header] = value;
            }
        });

        if (skill.id) {
            // Bỏ qua dòng description (id bắt đầu bằng "**", "-", "⭐", etc.)
            const id = skill.id;
            if (id.startsWith("**") || id.startsWith("-") || id.startsWith("⭐") || id.startsWith("- ⭐")) {
                continue;
            }
            // Bỏ qua dòng trống hoặc dòng chỉ có description
            if (!id.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
                continue;
            }
            library[id] = skill;
            allEntries.push({ lineNum: i + 1, skill });
        }
    }
    return { library, allEntries, headers };
}

// ========== AUDIT ==========
const { library, allEntries, headers } = parseSkillsCsv(csvText);

console.log(`\n${"=".repeat(80)}`);
console.log(`  SKILLS CSV AUDIT — ${Object.keys(library).length} skills parsed`);
console.log(`${"=".repeat(80)}\n`);

// Skill effects cần có base/scale (gây damage qua resolveDamage)
const DAMAGE_EFFECTS = new Set([
    "damage_shield_taunt", "single_burst", "assassin_execute_rage_refund",
    "double_hit", "double_hit_gold_reward", "single_burst_lifesteal",
    "single_delayed_echo", "cross_5", "row_multi", "single_sleep",
    "single_armor_break", "column_freeze", "aoe_circle", "column_plus_splash",
    "aoe_poison", "global_stun", "column_bleed", "self_atk_and_assist",
    "cone_smash", "true_single", "global_poison_team", "lifesteal_disease",
    "lifesteal_disease_maxhp", "knockback_charge", "cleave_armor_break",
    "single_strong_poison", "single_poison_stack", "random_multi",
    "single_poison_slow", "aoe_circle_stun", "single_bleed",
    "cone_shot", "global_debuff_atk", "single_burst_armor_pen",
    "global_knockback", "row_cleave"
]);

const issues = [];

for (const { lineNum, skill } of allEntries) {
    const errs = [];

    // Check: effect hợp lệ?
    if (!skill.effect) {
        errs.push(`❌ Thiếu 'effect' (actionPattern: ${skill.actionPattern || "N/A"})`);
    }

    // Check: actionPattern?
    if (!skill.actionPattern) {
        errs.push(`⚠️ Thiếu 'actionPattern'`);
    }

    // Check: base/scale cho damage skills
    if (skill.effect && DAMAGE_EFFECTS.has(skill.effect)) {
        if (skill.base == null && skill.scale == null) {
            errs.push(`🔴 THIẾU CẢ base VÀ scale → damage = 0 (effect: ${skill.effect})`);
        } else if (skill.base == null) {
            errs.push(`🟡 Thiếu 'base' (scale=${skill.scale}, effect: ${skill.effect})`);
        } else if (skill.scale == null) {
            errs.push(`🟡 Thiếu 'scale' (base=${skill.base}, effect: ${skill.effect})`);
        }

        // Check scaleStat cho magic skills
        if (skill.damageType === "magic" && !skill.scaleStat) {
            errs.push(`🟠 Magic damage nhưng scaleStat default sẽ ="atk" — có lẽ nên dùng "matk"`);
        }

        if (!skill.damageType) {
            errs.push(`🟡 Thiếu 'damageType' (effect: ${skill.effect})`);
        }
    }

    // Check: shield skills
    if (skill.effect === "shield_cleanse" && skill.shieldBase == null && skill.shieldScale == null) {
        errs.push(`🟡 Shield cleanse thiếu shieldBase/shieldScale`);
    }
    if (skill.effect === "damage_shield_taunt" && skill.shieldBase == null) {
        errs.push(`🟡 Damage+Shield skill thiếu shieldBase`);
    }

    // Check: heal skills
    if (skill.effect === "dual_heal" && skill.base == null && skill.scale == null) {
        errs.push(`🟡 Heal skill thiếu base/scale — lượng hồi = 0`);
    }

    // Check: double_hit
    if (skill.effect === "double_hit") {
        if (!skill.hit1) errs.push(`🟡 double_hit thiếu 'hit1'`);
        if (!skill.hit2) errs.push(`🟡 double_hit thiếu 'hit2'`);
        if (skill._hit1_parseError) errs.push(`🔴 hit1 JSON parse error: "${skill._hit1_parseError}"`);
        if (skill._hit2_parseError) errs.push(`🔴 hit2 JSON parse error: "${skill._hit2_parseError}"`);
    }

    // Check: metamorphosis
    if (skill.effect === "metamorphosis") {
        if (!skill.buffStats && !skill._buffStats_parseError) errs.push(`🟡 metamorphosis thiếu 'buffStats'`);
        if (skill._buffStats_parseError) errs.push(`🔴 buffStats JSON parse error: "${skill._buffStats_parseError}"`);
    }

    // Check: stun skills
    if ((skill.effect === "global_stun" || skill.effect === "aoe_circle_stun") && skill.stunChance == null) {
        errs.push(`🟡 Stun skill thiếu 'stunChance'`);
    }

    // Check: poison skills
    if (["aoe_poison", "global_poison_team", "single_poison_stack", "single_strong_poison", "single_poison_slow"].includes(skill.effect)) {
        if (skill.poisonTurns == null) errs.push(`🟡 Poison skill thiếu 'poisonTurns'`);
        if (skill.poisonPerTurn == null) errs.push(`🟡 Poison skill thiếu 'poisonPerTurn'`);
    }

    // Check: freeze skills
    if (skill.effect === "column_freeze" && skill.freezeChance == null) {
        errs.push(`🟡 Freeze skill thiếu 'freezeChance'`);
    }

    // Check: sleep skills
    if (skill.effect === "single_sleep") {
        if (skill.sleepChance == null) errs.push(`🟡 Sleep skill thiếu 'sleepChance'`);
        if (skill.sleepTurns == null) errs.push(`🟡 Sleep skill thiếu 'sleepTurns'`);
    }

    // Check: assist skills
    if (skill.effect === "self_atk_and_assist") {
        if (skill.selfAtkBuff == null) errs.push(`🟡 Assist skill thiếu 'selfAtkBuff'`);
        if (skill.assistRate == null) errs.push(`🟡 Assist skill thiếu 'assistRate'`);
    }

    // Check: lifesteal
    if (["single_burst_lifesteal", "lifesteal_disease", "lifesteal_disease_maxhp"].includes(skill.effect)) {
        if (skill.lifesteal == null) errs.push(`🟡 Lifesteal skill thiếu 'lifesteal'`);
    }

    // Check: disease
    if (["lifesteal_disease", "lifesteal_disease_maxhp"].includes(skill.effect)) {
        if (skill.diseaseTurns == null) errs.push(`🟡 Disease skill thiếu 'diseaseTurns'`);
        if (skill.diseaseDamage == null) errs.push(`🟡 Disease skill thiếu 'diseaseDamage'`);
    }

    // Check: armor break
    if (["single_armor_break", "cleave_armor_break", "single_burst_armor_pen"].includes(skill.effect)) {
        if (skill.armorBreak == null && skill.armorPen == null) {
            errs.push(`🟡 Armor break skill thiếu 'armorBreak' hoặc 'armorPen'`);
        }
    }

    // Check: turns khi cần
    if (["self_atk_and_assist", "ally_row_def_buff", "column_bless", "team_def_buff"].includes(skill.effect)) {
        if (skill.turns == null) errs.push(`🟡 Buff skill thiếu 'turns' (thời gian hiệu lực)`);
    }

    if (errs.length > 0) {
        issues.push({ lineNum, id: skill.id, name: skill.name, errs });
    }
}

// ========== Output ==========
if (issues.length === 0) {
    console.log("✅ Không tìm thấy vấn đề nào!\n");
} else {
    const critical = issues.filter(i => i.errs.some(e => e.startsWith("🔴")));
    const warnings = issues.filter(i => !i.errs.some(e => e.startsWith("🔴")) && i.errs.some(e => e.startsWith("🟠") || e.startsWith("🟡")));
    const info = issues.filter(i => i.errs.every(e => e.startsWith("⚠️") || e.startsWith("❌")));

    if (critical.length > 0) {
        console.log(`${"─".repeat(60)}`);
        console.log(`🔴 CRITICAL (${critical.length}) — Crash hoặc damage = 0/1:`);
        console.log(`${"─".repeat(60)}`);
        for (const { lineNum, id, name, errs } of critical) {
            console.log(`\n  [Dòng ${lineNum}] ${id} — ${name}`);
            errs.forEach(e => console.log(`    ${e}`));
        }
    }

    if (warnings.length > 0) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`🟡 WARNINGS (${warnings.length}) — Có thể sai logic:`);
        console.log(`${"─".repeat(60)}`);
        for (const { lineNum, id, name, errs } of warnings) {
            console.log(`\n  [Dòng ${lineNum}] ${id} — ${name}`);
            errs.forEach(e => console.log(`    ${e}`));
        }
    }

    if (info.length > 0) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`⚠️ INFO (${info.length}) — Thiếu field cơ bản (có thể do format CSV):`);
        console.log(`${"─".repeat(60)}`);
        for (const { lineNum, id, name, errs } of info) {
            console.log(`\n  [Dòng ${lineNum}] ${id} — ${name}`);
            errs.forEach(e => console.log(`    ${e}`));
        }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`  TỔNG: ${issues.length} skills (🔴 ${critical.length} critical, 🟡 ${warnings.length} warnings, ⚠️ ${info.length} info)`);
    console.log(`${"=".repeat(80)}\n`);
}

// ========== Summary table cho skills có effect nhưng thiếu base/scale ==========
const damageSkillsMissing = allEntries.filter(({ skill }) => {
    return skill.effect && DAMAGE_EFFECTS.has(skill.effect) && (skill.base == null || skill.scale == null);
});

if (damageSkillsMissing.length > 0) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`  BẢNG TÓM TẮT: ${damageSkillsMissing.length} damage skills thiếu base/scale`);
    console.log(`${"=".repeat(80)}`);
    console.log(`  ${"ID".padEnd(40)} ${"Effect".padEnd(30)} ${"base".padEnd(8)} ${"scale".padEnd(8)} ${"scaleStat".padEnd(10)}`);
    console.log(`  ${"─".repeat(40)} ${"─".repeat(30)} ${"─".repeat(8)} ${"─".repeat(8)} ${"─".repeat(10)}`);
    for (const { lineNum, skill } of damageSkillsMissing) {
        console.log(`  ${skill.id.padEnd(40)} ${(skill.effect || "").padEnd(30)} ${String(skill.base ?? "❌").padEnd(8)} ${String(skill.scale ?? "❌").padEnd(8)} ${(skill.scaleStat || "(atk)").padEnd(10)}`);
    }
}
