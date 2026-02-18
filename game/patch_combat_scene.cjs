const fs = require('fs');
const path = require('path');

const filePath = 'p:/DigiGO/games/game/src/scenes/CombatScene.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add new status timers to processStartTurn
const processStartTurnRegex = /this\.tickTimedStatus\(unit, "mdefBuffTurns"\);/;
if (processStartTurnRegex.test(content)) {
    content = content.replace(processStartTurnRegex,
        'this.tickTimedStatus(unit, "mdefBuffTurns");\n' +
        '    this.tickTimedStatus(unit, "slowTurns");\n' +
        '    this.tickTimedStatus(unit, "disarmTurns");\n' +
        '    this.tickTimedStatus(unit, "immuneTurns");\n' +
        '    this.tickTimedStatus(unit, "physReflectTurns");\n' +
        '    this.tickTimedStatus(unit, "counterTurns");\n' +
        '    this.tickTimedStatus(unit, "isProtecting");'
    );
    console.log('Injected status timers.');
} else {
    console.error('Failed to find processStartTurn insertion point.');
}

// 2. Add Bleed handling to processStartTurn
const poisonTurnsRegex = /if \(unit\.statuses\.poisonTurns > 0\) \{[\s\S]*?unit\.statuses\.poisonTurns -= 1;\s*\}/;
if (poisonTurnsRegex.test(content)) {
    content = content.replace(poisonTurnsRegex, (match) => {
        return match + '\n    if (unit.statuses.bleedTurns > 0) {\n' +
            '      this.resolveDamage(null, unit, unit.statuses.bleedDamage, "true", "MÁU", { noRage: true, noReflect: true });\n' +
            '      unit.statuses.bleedTurns -= 1;\n' +
            '    }';
    });
    console.log('Injected bleed handling.');
}

// 3. Update tickTimedStatus
const tickTimedStatusEndRegex = /if \(key === "reflectTurns" && unit\.statuses\.reflectTurns <= 0\) \{[\s\S]*?unit\.statuses\.reflectTurns = 0;\s*\}/;
if (tickTimedStatusEndRegex.test(content)) {
    content = content.replace(tickTimedStatusEndRegex, (match) => {
        return match + '\n    if (key === "atkDebuffTurns" && unit.statuses.atkDebuffTurns <= 0) {\n' +
            '      unit.statuses.atkDebuffValue = 0;\n' +
            '      unit.statuses.atkDebuffTurns = 0;\n' +
            '    }\n' +
            '    if (key === "immuneTurns" && unit.statuses.immuneTurns <= 0) {\n' +
            '      unit.statuses.immuneTurns = 0;\n' +
            '    }';
    });
    console.log('Updated tickTimedStatus.');
}

// 4. Update updateCombatUnitUi icons
const statusIconsRegex = /const s = \[\];[\s\S]*?const statusText = s\.slice\(0, 4\)\.join\(" "\);/;
if (statusIconsRegex.test(content)) {
    const newIconsBlock = `const s = [];
    if (unit.rage >= unit.rageMax - 1 && unit.rage > 0 && unit.alive) s.push("⚡");
    if (unit.shield > 0) s.push("🛡️");
    if (unit.statuses.immuneTurns > 0) s.push("🧤");
    if (unit.statuses.freeze > 0) s.push("❄");
    if (unit.statuses.stun > 0) s.push("💫");
    if (unit.statuses.sleep > 0) s.push("😴");
    if (unit.statuses.silence > 0) s.push("🔇");
    if (unit.statuses.disarmTurns > 0) s.push("🚫");
    if (unit.statuses.burnTurns > 0) s.push("🔥");
    if (unit.statuses.poisonTurns > 0) s.push("☠");
    if (unit.statuses.bleedTurns > 0) s.push("🩸");
    if (unit.statuses.diseaseTurns > 0) s.push("🦠");
    if (unit.statuses.tauntTurns > 0 && unit.statuses.tauntTargetId) s.push("🎯");
    if (unit.statuses.armorBreakTurns > 0) s.push("⚔️");
    if (unit.statuses.slowTurns > 0) s.push("⏳");
    if (unit.statuses.atkDebuffTurns > 0) s.push("📉");
    if (unit.statuses.reflectTurns > 0 || unit.statuses.physReflectTurns > 0) s.push("🌀");
    const statusText = s.slice(0, 5).join(" ");`;
    content = content.replace(statusIconsRegex, newIconsBlock);
    console.log('Updated status icons.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching CombatScene.js.');
