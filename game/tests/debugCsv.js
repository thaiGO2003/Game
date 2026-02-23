import { readFileSync } from "fs";
const csv = readFileSync("data/skills.csv", "utf8");
const lines = csv.split(/\r?\n/);
const headers = lines[0].split(",").map(h => h.trim());
const idx = {};
headers.forEach((h, i) => idx[h] = i);

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

// Debug: check lines around unit_skill_chimera_flame (line 766, idx 765)
const testLines = [764, 774]; // 0-indexed
for (const li of testLines) {
    const vals = parseCsvLine(lines[li]);
    console.log(`\n--- Line ${li + 1} (${vals.length} cols) ---`);
    console.log("  id:", JSON.stringify(vals[0]?.substring(0, 60)));
    console.log("  actionPattern[3]:", JSON.stringify(vals[idx.actionPattern]?.substring(0, 40)));
    console.log("  effect[4]:", JSON.stringify(vals[idx.effect]?.substring(0, 40)));
    console.log("  damageType[5]:", JSON.stringify(vals[idx.damageType]?.substring(0, 20)));
    console.log("  base[6]:", JSON.stringify(vals[idx.base]?.substring(0, 20)));

    // Also check if data is embedded deeper
    for (let c = 0; c < Math.min(vals.length, 10); c++) {
        const v = vals[c]?.trim();
        if (v && v.length > 0 && v !== '""') {
            console.log(`  col[${c}] ${headers[c] || "?"}: ${JSON.stringify(v.substring(0, 80))}`);
        }
    }
}
