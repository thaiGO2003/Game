import skillsCsv from "../../data/skills.csv?raw";

function parseSkillsCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  const library = {};

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV split respecting quotes (for descriptions and JSON)
    // Simple split by comma might break on JSON or description commas.
    // Need a robust regex or simple parser.
    // Given the complexity, I'll use a regex for splitting CSV line.
    const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    // Actually, simple regex might fail on empty fields.
    // Let's use a slightly better approach or just simple split if we assume no extra commas in non-quoted fields.
    // My previous write used quotes for Description and JSON.

    // Better Regex for CSV parsing:
    const matches = lines[i].match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)|(,)/g);
    // This is getting complicated to inline. 
    // I'll implementation a simple state-based parser or just use the one below which handles quotes.

    const values = [];
    let current = "";
    let inQuote = false;
    for (const char of lines[i]) {
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

    if (values.length < headers.length) continue;

    const skill = {};
    headers.forEach((header, index) => {
      let value = values[index];
      if (!header) return;
      if (!value) return;

      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }

      const numFields = [
        "base", "scale", "shieldBase", "tauntTurns", "stunChance", "stunTurns", "reflectPct",
        "reflectTurns", "armorBuff", "mdefBuff", "turns", "lifesteal", "echoBase", "echoScale",
        "maxHits", "sleepChance", "sleepTurns", "armorBreak", "freezeChance", "freezeTurns",
        "slowTurns", "splashCount", "poisonTurns", "poisonPerTurn", "shieldScale", "rageGain",
        "maxTargets", "selfAtkBuff", "assistRate", "evadeBuff", "atkBuff", "armorPen",
        "killRage", "diseaseTurns", "diseaseDamage"
      ];
      const jsonFields = ["hit1", "hit2", "buffStats"];

      if (numFields.includes(header)) {
        skill[header] = Number(value);
      } else if (jsonFields.includes(header)) {
        try {
          skill[header] = JSON.parse(value);
        } catch (e) {
          console.warn(`Failed to parse JSON for ${header} in skill ${values[0]}`, value);
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
