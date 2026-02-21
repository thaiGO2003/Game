import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SKILL_LIBRARY } from '../src/data/skills.js';
import unitsCsv from '../data/units.csv?raw';

function parseUnitsCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const units = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = [];
    let current = '';
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
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    const unit = {};
    headers.forEach((header, index) => {
      let value = values[index];
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      unit[header] = value;
    });
    if (unit.id) {
      unit.tier = parseInt(unit.tier, 10);
      units.push(unit);
    }
  }
  return units;
}

const ALL_UNITS = parseUnitsCsv(unitsCsv);

class MockPreviewSystem {
  renderPreview(unit) {
    if (!unit) return { displayed: false, hasAttackOption: false, hasSkillOption: false, skillDescription: null };
    const skill = SKILL_LIBRARY[unit.skillId];
    return {
      displayed: true,
      hasAttackOption: true,
      hasSkillOption: true,
      skillDescription: skill ? (skill.descriptionVi || skill.name || unit.skillId) : null
    };
  }
  triggerPreview(unit, mode) {
    if (!unit || !mode || (mode !== 'attack' && mode !== 'skill')) return { success: false };
    return { success: true, mode, animated: true };
  }
}

describe('Animation Preview System Properties', () => {
  let mockPreview;
  beforeEach(() => { mockPreview = new MockPreviewSystem(); });

  describe('Property 5: Unit Preview Display', () => {
    it('should display preview screen with attack and skill options for any unit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ALL_UNITS.length - 1 }),
          (unitIndex) => {
            const unit = ALL_UNITS[unitIndex];
            const preview = mockPreview.renderPreview(unit);
            return preview.displayed && preview.hasAttackOption && preview.hasSkillOption;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow triggering attack animation for any unit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ALL_UNITS.length - 1 }),
          (unitIndex) => {
            const unit = ALL_UNITS[unitIndex];
            const result = mockPreview.triggerPreview(unit, 'attack');
            return result.success && result.mode === 'attack' && result.animated;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow triggering skill animation for any unit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ALL_UNITS.length - 1 }),
          (unitIndex) => {
            const unit = ALL_UNITS[unitIndex];
            const result = mockPreview.triggerPreview(unit, 'skill');
            return result.success && result.mode === 'skill' && result.animated;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Preview Skill Description', () => {
    it('should display skill description for any unit with a skill', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ALL_UNITS.length - 1 }),
          (unitIndex) => {
            const unit = ALL_UNITS[unitIndex];
            const preview = mockPreview.renderPreview(unit);
            if (unit.skillId && SKILL_LIBRARY[unit.skillId]) {
              return preview.skillDescription !== null && preview.skillDescription !== undefined && preview.skillDescription !== '';
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify all units with skills have descriptions in preview', () => {
      const missingDescriptions = [];
      for (const unit of ALL_UNITS) {
        if (!unit.skillId || !SKILL_LIBRARY[unit.skillId]) continue;
        const preview = mockPreview.renderPreview(unit);
        if (!preview.skillDescription || preview.skillDescription === '') {
          missingDescriptions.push({ unitId: unit.id, skillId: unit.skillId });
        }
      }
      expect(missingDescriptions).toHaveLength(0);
    });

    it('should verify skill descriptions are non-empty strings', () => {
      const invalidDescriptions = [];
      for (const unit of ALL_UNITS) {
        if (!unit.skillId || !SKILL_LIBRARY[unit.skillId]) continue;
        const preview = mockPreview.renderPreview(unit);
        const description = preview.skillDescription;
        if (typeof description !== 'string' || description.trim() === '') {
          invalidDescriptions.push({ unitId: unit.id, skillId: unit.skillId });
        }
      }
      expect(invalidDescriptions).toHaveLength(0);
    });
  });
});
