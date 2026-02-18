
const fs = require('fs');

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

const skills = parseCsv('p:/DigiGO/games/game/data/skills.csv');
const combatScene = fs.readFileSync('p:/DigiGO/games/game/src/scenes/CombatScene.js', 'utf8');

const uniqueEffects = new Set(skills.map(s => s.effect).filter(Boolean));

console.log(`Unique effects in skills.csv: ${uniqueEffects.size}`);
let missingCount = 0;
uniqueEffects.forEach(effect => {
    if (!combatScene.includes(`case "${effect}":`)) {
        console.log(`[MISSING] Effect "${effect}" is NOT implemented in CombatScene.js switch statement.`);
        missingCount++;
    }
});

if (missingCount === 0) {
    console.log("SUCCESS: All effects in skills.csv are implemented in CombatScene.js.");
} else {
    console.log(`DONE: ${missingCount} effects are missing implementation.`);
}
