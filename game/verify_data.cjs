
const fs = require('fs');
const path = require('path');

function parseCsv(csvPath) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = [];
        let current = "";
        let inQuote = false;
        for (const char of line) {
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
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
    });
}

const units = parseCsv('p:/DigiGO/games/game/data/units.csv');
const skills = parseCsv('p:/DigiGO/games/game/data/skills.csv');

const skillIds = new Set(skills.map(s => s.id));

console.log(`--- Unit Skill Audit ---`);
console.log(`Total Units: ${units.length}`);
console.log(`Total Skills: ${skills.length}`);

let missing = 0;
units.forEach(u => {
    if (!u.skillId) {
        console.log(`[MISSING ID] Unit: ${u.id} (${u.name}) has NO skillId.`);
        missing++;
    } else if (!skillIds.has(u.skillId)) {
        console.log(`[NOT FOUND] Unit: ${u.id} (${u.name}) has skillId "${u.skillId}" but it's NOT in skills.csv.`);
        missing++;
    }
});

if (missing === 0) {
    console.log("SUCCESS: All units have matching skills in skills.csv.");
} else {
    console.log(`DONE: Found ${missing} issues.`);
}
