import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SKILL_LIBRARY } from "../src/data/skills.js";
import { CLASS_SYNERGY, TRIBE_SYNERGY } from "../src/data/synergies.js";
import { UNIT_CATALOG } from "../src/data/unitCatalog.js";
import { getClassLabelVi, getTribeLabelVi, getUnitVisual } from "../src/data/unitVisuals.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "../data");

const SKILL_BASE_KEYS = ["id", "name", "actionPattern", "effect", "damageType", "base", "scaleStat", "scale"];

function csvEscape(value) {
  if (value == null) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row?.[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function buildSkillRows() {
  const skills = Object.values(SKILL_LIBRARY).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const extraKeys = new Set();

  for (const skill of skills) {
    Object.keys(skill).forEach((key) => {
      if (!SKILL_BASE_KEYS.includes(key)) extraKeys.add(key);
    });
  }

  const headers = [...SKILL_BASE_KEYS, ...[...extraKeys].sort()];
  const rows = skills.map((skill) => {
    const row = {};
    headers.forEach((header) => {
      row[header] = skill[header];
    });
    return row;
  });
  return { headers, rows };
}

function buildUnitRows() {
  const headers = [
    "id",
    "name",
    "species",
    "icon",
    "tribe",
    "tribeVi",
    "classType",
    "classVi",
    "tier",
    "hp",
    "atk",
    "def",
    "matk",
    "mdef",
    "range",
    "rageMax",
    "skillId"
  ];
  const rows = UNIT_CATALOG.map((unit) => {
    const visual = getUnitVisual(unit.id, unit.classType);
    return {
      id: unit.id,
      name: unit.name,
      species: unit.species ?? "",
      icon: unit.icon ?? visual.icon,
      tribe: unit.tribe,
      tribeVi: getTribeLabelVi(unit.tribe),
      classType: unit.classType,
      classVi: getClassLabelVi(unit.classType),
      tier: unit.tier,
      hp: unit.stats?.hp ?? "",
      atk: unit.stats?.atk ?? "",
      def: unit.stats?.def ?? "",
      matk: unit.stats?.matk ?? "",
      mdef: unit.stats?.mdef ?? "",
      range: unit.stats?.range ?? "",
      rageMax: unit.stats?.rageMax ?? "",
      skillId: unit.skillId
    };
  }).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { headers, rows };
}

function buildSynergyRows() {
  const headers = ["group", "id", "name", "threshold", "bonus"];
  const rows = [];

  Object.values(CLASS_SYNERGY).forEach((entry) => {
    entry.thresholds.forEach((threshold, index) => {
      rows.push({
        group: "CLASS",
        id: entry.id,
        name: entry.name,
        threshold,
        bonus: entry.bonuses[index]
      });
    });
  });
  Object.values(TRIBE_SYNERGY).forEach((entry) => {
    entry.thresholds.forEach((threshold, index) => {
      rows.push({
        group: "TRIBE",
        id: entry.id,
        name: entry.name,
        threshold,
        bonus: entry.bonuses[index]
      });
    });
  });

  return { headers, rows };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const skills = buildSkillRows();
  const units = buildUnitRows();
  const synergies = buildSynergyRows();

  await Promise.all([
    fs.writeFile(path.join(OUT_DIR, "skills.csv"), toCsv(skills.headers, skills.rows), "utf8"),
    fs.writeFile(path.join(OUT_DIR, "units.csv"), toCsv(units.headers, units.rows), "utf8"),
    fs.writeFile(path.join(OUT_DIR, "synergies.csv"), toCsv(synergies.headers, synergies.rows), "utf8")
  ]);

  console.log(`Exported CSV -> ${OUT_DIR}`);
  console.log(`units: ${units.rows.length}, skills: ${skills.rows.length}, synergies: ${synergies.rows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
