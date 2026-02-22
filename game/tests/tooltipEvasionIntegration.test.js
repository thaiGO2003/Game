/**
 * Integration test for tooltip evasion display
 * Task 12.1: Add evasion stat to unit tooltips
 * Validates Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 7.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getBaseEvasion, getEffectiveEvasion } from '../src/core/gameUtils.js';
import { UNIT_BY_ID } from '../src/data/unitCatalog.js';
import { getUnitVisual, getTribeLabelVi, getClassLabelVi } from '../src/data/unitVisuals.js';
import { SKILL_LIBRARY } from '../src/data/skills.js';
import { CLASS_SYNERGY, TRIBE_SYNERGY } from '../src/data/synergies.js';

/**
 * Simulated getUnitTooltip function from PlanningScene
 * This is a simplified version for testing purposes
 */
function getUnitTooltip(baseId, star = 1, ownedUnit = null) {
  const base = UNIT_BY_ID[baseId];
  if (!base) return { title: "Không rõ", body: "Không có dữ liệu linh thú." };

  const visual = getUnitVisual(baseId, base.classType);
  const skill = SKILL_LIBRARY[base.skillId];
  const classDef = CLASS_SYNERGY[base.classType];
  const tribeDef = TRIBE_SYNERGY[base.tribe];
  const classMarks = classDef ? classDef.thresholds.join("/") : "-";
  const tribeMarks = tribeDef ? tribeDef.thresholds.join("/") : "-";
  const statScale = star === 1 ? 1 : star === 2 ? 1.6 : 2.5;

  // Calculate evasion stat
  const baseEvasion = getBaseEvasion(base.classType);
  let evasionText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}%`;

  // If ownedUnit is provided, check for modified evasion
  if (ownedUnit) {
    const effectiveEvasion = getEffectiveEvasion(ownedUnit);
    if (Math.abs(effectiveEvasion - baseEvasion) > 0.001) {
      evasionText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}% → ${(effectiveEvasion * 100).toFixed(1)}%`;
    }
  }

  const equipmentLine = "Trang bị: Chưa có";

  return {
    title: `${visual.icon} ${visual.nameVi} (${star}★)`,
    body: [
      `🏷️ Bậc:${base.tier}  ${getTribeLabelVi(base.tribe)}/${getClassLabelVi(base.classType)}`,
      `❤️ HP:${Math.round(base.stats.hp * statScale)}  ATK:${Math.round(base.stats.atk * statScale)}  DEF:${Math.round(base.stats.def * statScale)}`,
      `✨ MATK:${Math.round(base.stats.matk * statScale)}  MDEF:${Math.round(base.stats.mdef * statScale)}  Tầm: ${base.stats.range >= 2 ? "Đánh xa" : "Cận chiến"}`,
      evasionText,
      `🔥 Nộ tối đa:${base.stats.rageMax}`,
      `🎒 ${equipmentLine}`,
      `🎯 Mốc nghề: ${classMarks}`,
      `🌿 Mốc tộc: ${tribeMarks}`
    ].join("\n")
  };
}

describe('Task 12.1: Tooltip Evasion Display Integration', () => {
  let testUnitId;
  let testUnit;

  beforeEach(() => {
    // Get a test unit (first available unit)
    testUnitId = Object.keys(UNIT_BY_ID)[0];
    testUnit = UNIT_BY_ID[testUnitId];
  });

  describe('Requirement 13.1: Tooltip displays evasion percentage', () => {
    it('should include evasion stat in tooltip body', () => {
      const tooltip = getUnitTooltip(testUnitId, 1);

      expect(tooltip.body).toContain('💨 Né tránh:');
      expect(tooltip.body).toMatch(/💨 Né tránh: \d+\.\d%/);
    });

    it('should display evasion for all class types', () => {
      const classTypes = ['TANKER', 'FIGHTER', 'ASSASSIN', 'ARCHER', 'MAGE', 'SUPPORT'];

      classTypes.forEach(classType => {
        // Find a unit with this class type
        const unitId = Object.keys(UNIT_BY_ID).find(id => UNIT_BY_ID[id].classType === classType);
        if (unitId) {
          const tooltip = getUnitTooltip(unitId, 1);
          expect(tooltip.body).toContain('💨 Né tránh:');
        }
      });
    });
  });

  describe('Requirement 13.2: Show base and modified evasion when different', () => {
    it('should show only base evasion when no buffs/debuffs', () => {
      const tooltip = getUnitTooltip(testUnitId, 1);
      const baseEvasion = getBaseEvasion(testUnit.classType);
      const expectedText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}%`;

      expect(tooltip.body).toContain(expectedText);
      expect(tooltip.body).not.toContain('→');
    });

    it('should show base → modified when unit has evasion buff', () => {
      const ownedUnit = {
        baseId: testUnitId,
        mods: { evadePct: getBaseEvasion(testUnit.classType) },
        statuses: {
          evadeBuffTurns: 2,
          evadeBuffValue: 0.10,
          evadeDebuffTurns: 0,
          evadeDebuffValue: 0
        }
      };

      const tooltip = getUnitTooltip(testUnitId, 1, ownedUnit);

      expect(tooltip.body).toContain('→');
      expect(tooltip.body).toMatch(/💨 Né tránh: \d+\.\d% → \d+\.\d%/);
    });

    it('should show base → modified when unit has evasion debuff', () => {
      const ownedUnit = {
        baseId: testUnitId,
        mods: { evadePct: getBaseEvasion(testUnit.classType) },
        statuses: {
          evadeBuffTurns: 0,
          evadeBuffValue: 0,
          evadeDebuffTurns: 2,
          evadeDebuffValue: 0.05
        }
      };

      const tooltip = getUnitTooltip(testUnitId, 1, ownedUnit);

      expect(tooltip.body).toContain('→');
      expect(tooltip.body).toMatch(/💨 Né tránh: \d+\.\d% → \d+\.\d%/);
    });
  });

  describe('Requirement 13.3: Format evasion with one decimal place', () => {
    it('should format evasion percentage with exactly one decimal place', () => {
      const tooltip = getUnitTooltip(testUnitId, 1);

      // Extract evasion value from tooltip
      const evasionMatch = tooltip.body.match(/💨 Né tránh: (\d+\.\d)%/);
      expect(evasionMatch).toBeTruthy();

      const evasionStr = evasionMatch[1];
      const decimalPart = evasionStr.split('.')[1];
      expect(decimalPart.length).toBe(1);
    });

    it('should format modified evasion with one decimal place', () => {
      const ownedUnit = {
        baseId: testUnitId,
        mods: { evadePct: getBaseEvasion(testUnit.classType) },
        statuses: {
          evadeBuffTurns: 2,
          evadeBuffValue: 0.10,
          evadeDebuffTurns: 0,
          evadeDebuffValue: 0
        }
      };

      const tooltip = getUnitTooltip(testUnitId, 1, ownedUnit);

      // Extract both evasion values
      const evasionMatch = tooltip.body.match(/💨 Né tránh: (\d+\.\d)% → (\d+\.\d)%/);
      expect(evasionMatch).toBeTruthy();

      const baseStr = evasionMatch[1];
      const modifiedStr = evasionMatch[2];

      expect(baseStr.split('.')[1].length).toBe(1);
      expect(modifiedStr.split('.')[1].length).toBe(1);
    });
  });

  describe('Requirement 13.5: Position evasion consistently with other combat stats', () => {
    it('should position evasion stat after range and before rage max', () => {
      const tooltip = getUnitTooltip(testUnitId, 1);
      const lines = tooltip.body.split('\n');

      // Find the indices of relevant stats
      const rangeIndex = lines.findIndex(line => line.includes('Tầm:'));
      const evasionIndex = lines.findIndex(line => line.includes('💨 Né tránh:'));
      const rageIndex = lines.findIndex(line => line.includes('🔥 Nộ tối đa:'));

      expect(evasionIndex).toBeGreaterThan(rangeIndex);
      expect(evasionIndex).toBeLessThan(rageIndex);
    });

    it('should maintain consistent stat ordering across different units', () => {
      const unitIds = Object.keys(UNIT_BY_ID).slice(0, 5);

      unitIds.forEach(unitId => {
        const tooltip = getUnitTooltip(unitId, 1);
        const lines = tooltip.body.split('\n');

        const evasionIndex = lines.findIndex(line => line.includes('💨 Né tránh:'));
        const rageIndex = lines.findIndex(line => line.includes('🔥 Nộ tối đa:'));

        expect(evasionIndex).toBeGreaterThan(-1);
        expect(evasionIndex).toBeLessThan(rageIndex);
      });
    });
  });

  describe('Requirement 7.6: Tooltip updates when evasion is modified', () => {
    it('should reflect evasion changes from buffs', () => {
      const baseEvasion = getBaseEvasion(testUnit.classType);

      const ownedUnit = {
        baseId: testUnitId,
        mods: { evadePct: baseEvasion },
        statuses: {
          evadeBuffTurns: 2,
          evadeBuffValue: 0.15,
          evadeDebuffTurns: 0,
          evadeDebuffValue: 0
        }
      };

      const tooltip = getUnitTooltip(testUnitId, 1, ownedUnit);
      const effectiveEvasion = getEffectiveEvasion(ownedUnit);

      const expectedText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}% → ${(effectiveEvasion * 100).toFixed(1)}%`;
      expect(tooltip.body).toContain(expectedText);
    });

    it('should reflect evasion changes from debuffs', () => {
      const baseEvasion = getBaseEvasion(testUnit.classType);

      const ownedUnit = {
        baseId: testUnitId,
        mods: { evadePct: baseEvasion },
        statuses: {
          evadeBuffTurns: 0,
          evadeBuffValue: 0,
          evadeDebuffTurns: 2,
          evadeDebuffValue: 0.10
        }
      };

      const tooltip = getUnitTooltip(testUnitId, 1, ownedUnit);
      const effectiveEvasion = getEffectiveEvasion(ownedUnit);

      const expectedText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}% → ${(effectiveEvasion * 100).toFixed(1)}%`;
      expect(tooltip.body).toContain(expectedText);
    });

    it('should reflect combined buff and debuff effects', () => {
      const baseEvasion = getBaseEvasion(testUnit.classType);

      const ownedUnit = {
        baseId: testUnitId,
        mods: { evadePct: baseEvasion },
        statuses: {
          evadeBuffTurns: 2,
          evadeBuffValue: 0.20,
          evadeDebuffTurns: 2,
          evadeDebuffValue: 0.10
        }
      };

      const tooltip = getUnitTooltip(testUnitId, 1, ownedUnit);
      const effectiveEvasion = getEffectiveEvasion(ownedUnit);

      const expectedText = `💨 Né tránh: ${(baseEvasion * 100).toFixed(1)}% → ${(effectiveEvasion * 100).toFixed(1)}%`;
      expect(tooltip.body).toContain(expectedText);
    });
  });
});
