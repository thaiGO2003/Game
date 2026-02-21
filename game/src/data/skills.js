import skillsCsv from "../../data/skills.csv?raw";

function parseSkillsCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const library = {};

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

      // Remove surrounding quotes if present
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
          console.warn(`[Skills] Failed to parse JSON for ${header} in skill ${values[0]}`, value);
        }
      } else {
        skill[header] = value;
      }
    });

    if (skill.id) {
      library[skill.id] = skill;
    }
  }
  return library;
}

export const SKILL_LIBRARY = parseSkillsCsv(skillsCsv);
