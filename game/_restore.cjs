/**
 * Custom diff applier: reads a unified diff and applies it to the source file.
 * Uses fuzzy matching to handle encoding differences in context lines.
 */
const fs = require('fs');

const DIFF_PATH = 'C:/Users/luong/.gemini/antigravity/brain/51a97e57-f38e-48a5-a04e-6514d13eb97e/full_diff.txt';
const SRC_PATH = 'p:/DigiGO/games/game/src/scenes/PlanningScene.js';

const diffText = fs.readFileSync(DIFF_PATH, 'utf8');
const srcText = fs.readFileSync(SRC_PATH, 'utf8');
const srcLines = srcText.split('\n');

// Parse hunks from unified diff
const hunks = [];
const hunkHeaderRegex = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/;
let currentHunk = null;

for (const line of diffText.split('\n')) {
    const m = line.match(hunkHeaderRegex);
    if (m) {
        if (currentHunk) hunks.push(currentHunk);
        currentHunk = {
            oldStart: parseInt(m[1]),
            oldCount: m[2] ? parseInt(m[2]) : 1,
            newStart: parseInt(m[3]),
            newCount: m[4] ? parseInt(m[4]) : 1,
            lines: []
        };
        continue;
    }
    if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
        currentHunk.lines.push(line);
    }
}
if (currentHunk) hunks.push(currentHunk);

console.log(`Parsed ${hunks.length} hunks from diff`);

// Apply hunks from bottom to top (to preserve line numbers)
hunks.sort((a, b) => b.oldStart - a.oldStart);

let result = [...srcLines];
let applied = 0;
let failed = 0;

for (const hunk of hunks) {
    const oldLines = hunk.lines
        .filter(l => l.startsWith(' ') || l.startsWith('-'))
        .map(l => l.substring(1));
    const newLines = hunk.lines
        .filter(l => l.startsWith(' ') || l.startsWith('+'))
        .map(l => l.substring(1));

    // Try exact match first at expected position
    const startIdx = hunk.oldStart - 1; // 0-indexed
    let matched = true;

    // Verify context by checking first few old lines
    const checkLen = Math.min(3, oldLines.length);
    for (let i = 0; i < checkLen; i++) {
        const srcLine = (result[startIdx + i] || '').replace(/\r$/, '');
        const diffLine = (oldLines[i] || '').replace(/\r$/, '');
        if (srcLine !== diffLine) {
            matched = false;
            break;
        }
    }

    if (!matched) {
        // Fuzzy search: look for the old lines within ±50 lines
        let foundIdx = -1;
        for (let offset = 0; offset <= 50; offset++) {
            for (const dir of [0, -1, 1]) {
                const tryIdx = startIdx + offset * (dir || 1);
                if (tryIdx < 0 || tryIdx + oldLines.length > result.length) continue;

                let ok = true;
                const checkN = Math.min(3, oldLines.length);
                for (let i = 0; i < checkN; i++) {
                    const srcLine = (result[tryIdx + i] || '').replace(/\r$/, '');
                    const diffLine = (oldLines[i] || '').replace(/\r$/, '');
                    if (srcLine !== diffLine) { ok = false; break; }
                }
                if (ok) { foundIdx = tryIdx; break; }
            }
            if (foundIdx >= 0) break;
        }

        if (foundIdx >= 0) {
            // Replace old lines with new lines
            result.splice(foundIdx, oldLines.length, ...newLines.map(l => l + (l.endsWith('\r') ? '' : '\r')));
            applied++;
        } else {
            console.log(`FAILED hunk at line ${hunk.oldStart}: first line = "${oldLines[0]?.substring(0, 60)}..."`);
            failed++;
        }
    } else {
        // Exact match - apply
        result.splice(startIdx, oldLines.length, ...newLines.map(l => l + (l.endsWith('\r') ? '' : '\r')));
        applied++;
    }
}

console.log(`Applied: ${applied}/${hunks.length}, Failed: ${failed}`);

// Write result
fs.writeFileSync(SRC_PATH, result.join('\n'), 'utf8');
console.log(`Wrote ${result.length} lines to ${SRC_PATH}`);
