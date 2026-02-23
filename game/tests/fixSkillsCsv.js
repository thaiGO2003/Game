/**
 * Fix skills.csv — Tự động gộp data từ star3 lines vào unit_skill entries
 * + fix scaleStat cho magic damage skills  
 * 
 * Chạy: node tests/fixSkillsCsv.js
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, "../data/skills.csv");
const csvText = readFileSync(csvPath, "utf-8");
const lines = csvText.split(/\r?\n/);
const headers = lines[0].split(",").map(h => h.trim());

const idx = {};
headers.forEach((h, i) => idx[h] = i);

// Known action patterns
const KNOWN_PATTERNS = [
    "MELEE_FRONT", "ASSASSIN_BACK", "RANGED_STATIC", "SELF"
];

// Known effects
const KNOWN_EFFECTS = [
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
    "global_knockback", "row_cleave", "dual_heal", "shield_cleanse",
    "team_rage", "column_bless", "metamorphosis", "ally_row_def_buff",
    "rhino_counter", "turtle_protection", "pangolin_reflect", "random_lightning",
    "multi_disarm", "team_def_buff"
];

function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuote = false;
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
            if (inQuote && line[j + 1] === '"') { current += '"'; j++; }
            else inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            values.push(current); current = "";
        } else { current += char; }
    }
    values.push(current);
    return values;
}

// Find embedded data in a raw line by looking for known actionPattern+effect combos
function extractEmbeddedData(rawLine) {
    // Try to find a pattern like: MELEE_FRONT,effect_name,damageType,base,scaleStat,scale,...
    for (const ap of KNOWN_PATTERNS) {
        const apIdx = rawLine.indexOf(ap);
        if (apIdx === -1) continue;

        // Extract everything from actionPattern onward  
        const dataStr = rawLine.substring(apIdx);
        // Split by comma
        const parts = dataStr.split(",");

        if (parts.length < 2) continue;
        const actionPattern = parts[0].trim();
        const effect = parts[1].trim();

        if (!KNOWN_EFFECTS.includes(effect)) continue;

        // Success! Map to header fields starting from actionPattern
        const result = {};
        const startIdx = idx.actionPattern; // col 3
        for (let i = 0; i < parts.length; i++) {
            const headerIdx = startIdx + i;
            if (headerIdx >= headers.length) break;
            const val = parts[i].trim()
                .replace(/^["]+/, "").replace(/["]+$/, "") // remove quotes
                .replace(/""/g, '"'); // unescape
            if (val) {
                result[headers[headerIdx]] = val;
            }
        }
        return result;
    }
    return null;
}

// First pass: find unit_skill entries missing data and extract from nearby star3 lines
const fixes = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const vals = parseCsvLine(line);
    const id = vals[0]?.trim();
    if (!id || !id.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) continue;
    if (!id.startsWith("unit_skill_")) continue;

    const effect = vals[idx.effect]?.trim();
    const actionPattern = vals[idx.actionPattern]?.trim();
    if (effect && actionPattern) continue; // Already has data

    // Search forward for star3 line with embedded data
    let found = null;
    let foundLineIdx = -1;

    for (let j = i + 1; j < lines.length && j < i + 25; j++) {
        const nextLine = lines[j];
        if (!nextLine?.trim()) continue;

        // Stop if we hit next unit_skill entry
        const nextVals = parseCsvLine(nextLine);
        const nextId = nextVals[0]?.trim();
        if (nextId?.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) && nextId.startsWith("unit_skill_")) break;

        // Try to extract embedded data from this line
        const extracted = extractEmbeddedData(nextLine);
        if (extracted && extracted.effect) {
            found = extracted;
            foundLineIdx = j;
            // Don't break — we want the LAST one (second block's star3 line)
        }
    }

    if (found) {
        fixes.push({ lineIdx: i, id, name: vals[1]?.trim(), dataLineIdx: foundLineIdx, data: found });
    } else {
        console.warn(`⚠️ Dòng ${i + 1}: ${id} — KHÔNG TÌM THẤY DATA`);
    }
}

console.log(`\nTìm thấy ${fixes.length} unit_skill entries cần fix.\n`);

// Apply fixes
let fixedCount = 0;
for (const fix of fixes) {
    const vals = parseCsvLine(lines[fix.lineIdx]);

    // Ensure vals array is long enough
    while (vals.length < headers.length) vals.push("");

    let modified = false;
    for (const [header, value] of Object.entries(fix.data)) {
        const hi = idx[header];
        if (hi === undefined) continue;
        if (vals[hi]?.trim()) continue; // Don't overwrite existing
        vals[hi] = value;
        modified = true;
    }

    if (modified) {
        // Rebuild CSV line — need to handle description field (col 2) which may contain commas
        const newLine = vals.map((v, ci) => {
            if (ci === 2 && v.includes(",")) {
                // Description field: wrap in quotes
                return `"${v.replace(/"/g, '""')}"`;
            }
            // hit1/hit2 fields with JSON
            if ((ci === idx.hit1 || ci === idx.hit2) && v.includes("{")) {
                return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
        }).join(",");

        lines[fix.lineIdx] = newLine;
        fixedCount++;
        console.log(`✅ ${fix.id} (dòng ${fix.lineIdx + 1}) ← ${fix.data.actionPattern}/${fix.data.effect} base=${fix.data.base || "-"} scale=${fix.data.scale || "-"}`);
    }
}

// Second pass: fix scaleStat for magic damage skills
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

let warningsFixed = 0;
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const vals = parseCsvLine(line);
    const id = vals[0]?.trim();
    if (!id || !id.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) continue;

    const effect = vals[idx.effect]?.trim();
    const damageType = vals[idx.damageType]?.trim();
    const scaleStat = vals[idx.scaleStat]?.trim();

    if (effect && DAMAGE_EFFECTS.has(effect) && damageType === "magic" && !scaleStat) {
        while (vals.length <= idx.scaleStat) vals.push("");
        vals[idx.scaleStat] = "matk";

        const newLine = vals.map((v, ci) => {
            if (ci === 2 && v.includes(",")) return `"${v.replace(/"/g, '""')}"`;
            if ((ci === idx.hit1 || ci === idx.hit2) && v.includes("{")) return `"${v.replace(/"/g, '""')}"`;
            return v;
        }).join(",");

        lines[i] = newLine;
        warningsFixed++;
        console.log(`🟡 ${id} (dòng ${i + 1}) — scaleStat → "matk"`);
    }
}

// Write
writeFileSync(csvPath, lines.join("\r\n"), "utf-8");

console.log(`\n${"=".repeat(60)}`);
console.log(`  DONE: ${fixedCount} unit_skill entries injected, ${warningsFixed} scaleStat fixed`);
console.log(`${"=".repeat(60)}\n`);
