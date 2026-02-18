
const fs = require('fs');

function checkCsv(path, expectedCols) {
    console.log(`Checking ${path}...`);
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    console.log(`Headers (${headers.length}): ${headers.join(',')}`);

    let errors = 0;
    lines.forEach((line, i) => {
        if (!line.trim()) return;
        const values = [];
        let curr = "";
        let inQ = false;
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '"') {
                if (inQ && line[j + 1] === '"') { curr += '"'; j++; }
                else inQ = !inQ;
            } else if (line[j] === ',' && !inQ) {
                values.push(curr.trim());
                curr = "";
            } else {
                curr += line[j];
            }
        }
        values.push(curr.trim());

        if (values.length !== headers.length) {
            console.log(`Line ${i + 1}: Expected ${headers.length} columns, got ${values.length}. ID: ${values[0]}`);
            errors++;
        }
    });
    console.log(`Done. Found ${errors} errors in ${path}.\n`);
}

checkCsv('p:/DigiGO/games/game/data/units.csv');
checkCsv('p:/DigiGO/games/game/data/skills.csv');
