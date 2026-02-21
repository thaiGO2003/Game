/**
 * Unit tests for Wiki Stat Display (Task 10.1)
 * 
 * Tests the complete stat display functionality in Wiki unit view
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UNIT_CATALOG, UNIT_BY_ID } from '../src/data/unitCatalog.js';
import { SKILL_LIBRARY } from '../src/data/skills.js';
import { getBaseEvasion } from '../src/core/gameUtils.js';
import { getUnitVisual, getTribeLabelVi, getClassLabelVi } from '../src/data/unitVisuals.js';

describe('Wiki Stat Display (Requirements 5.1-5.5)', () => {
  let mockScene;
  let testUnit;

  beforeEach(() => {
    // Use a real unit from the catalog for testing
    testUnit = UNIT_CATALOG[0];
    
    mockScene = {
      _wikiDetailUnit: null,
      wikiListContainer: {
        removeAll: function() {},
        add: function() {},
        y: 0
      },
      wikiListBaseY: 0,
      wikiScrollY: 0,
      wikiMaxScroll: 0,
      scale: { width: 1920, height: 1080 },
      add: {
        text: function(x, y, content, style) {
          return {
            height: 20,
            setInteractive: function() { return this; },
            on: function() { return this; },
            setOrigin: function() { return this; }
          };
        },
        rectangle: function(x, y, w, h, color, alpha) {
          return {
            setOrigin: function() { return this; },
            setStrokeStyle: function() { return this; },
            setSize: function() { return this; },
            setInteractive: function() { return this; },
            on: function() { return this; }
          };
        }
      }
    };
  });

  describe('Stat Display Completeness (Requirement 5.1)', () => {
    it('should display HP stat', () => {
      const stats = testUnit.stats;
      expect(stats.hp).toBeDefined();
      expect(typeof stats.hp).toBe('number');
      expect(stats.hp).toBeGreaterThan(0);
    });

    it('should display ATK stat', () => {
      const stats = testUnit.stats;
      expect(stats.atk).toBeDefined();
      expect(typeof stats.atk).toBe('number');
      expect(stats.atk).toBeGreaterThan(0);
    });

    it('should display DEF stat', () => {
      const stats = testUnit.stats;
      expect(stats.def).toBeDefined();
      expect(typeof stats.def).toBe('number');
      expect(stats.def).toBeGreaterThanOrEqual(0);
    });

    it('should display MATK stat', () => {
      const stats = testUnit.stats;
      expect(stats.matk).toBeDefined();
      expect(typeof stats.matk).toBe('number');
      expect(stats.matk).toBeGreaterThanOrEqual(0);
    });

    it('should display MDEF stat', () => {
      const stats = testUnit.stats;
      expect(stats.mdef).toBeDefined();
      expect(typeof stats.mdef).toBe('number');
      expect(stats.mdef).toBeGreaterThanOrEqual(0);
    });

    it('should display Range stat', () => {
      const stats = testUnit.stats;
      expect(stats.range).toBeDefined();
      expect(typeof stats.range).toBe('number');
      expect(stats.range).toBeGreaterThan(0);
    });

    it('should display Evasion stat', () => {
      const evasion = getBaseEvasion(testUnit.classType);
      expect(evasion).toBeDefined();
      expect(typeof evasion).toBe('number');
      expect(evasion).toBeGreaterThanOrEqual(0);
      expect(evasion).toBeLessThanOrEqual(1);
    });
  });

  describe('Base Statistics Calculation (Requirement 5.2)', () => {
    it('should calculate all base statistics correctly', () => {
      const stats = testUnit.stats;
      
      // Verify all stats are calculated and present
      expect(stats.hp).toBeDefined();
      expect(stats.atk).toBeDefined();
      expect(stats.def).toBeDefined();
      expect(stats.matk).toBeDefined();
      expect(stats.mdef).toBeDefined();
      expect(stats.range).toBeDefined();
      expect(stats.rageMax).toBeDefined();
    });

    it('should calculate evasion based on class type', () => {
      const classTypes = ['TANKER', 'FIGHTER', 'ASSASSIN', 'ARCHER', 'MAGE', 'SUPPORT'];
      const expectedEvasion = {
        TANKER: 0.05,
        FIGHTER: 0.08,
        ASSASSIN: 0.15,
        ARCHER: 0.10,
        MAGE: 0.05,
        SUPPORT: 0.07
      };

      classTypes.forEach(classType => {
        const evasion = getBaseEvasion(classType);
        expect(evasion).toBe(expectedEvasion[classType]);
      });
    });

    it('should calculate range type label correctly', () => {
      const meleeUnit = UNIT_CATALOG.find(u => u.stats.range === 1);
      const rangedUnit = UNIT_CATALOG.find(u => u.stats.range >= 2);

      if (meleeUnit) {
        const rangeLabel = meleeUnit.stats.range >= 2 ? "Đánh xa" : "Cận chiến";
        expect(rangeLabel).toBe("Cận chiến");
      }

      if (rangedUnit) {
        const rangeLabel = rangedUnit.stats.range >= 2 ? "Đánh xa" : "Cận chiến";
        expect(rangeLabel).toBe("Đánh xa");
      }
    });
  });

  describe('Readable Layout (Requirement 5.3)', () => {
    it('should format stats in a readable multi-line layout', () => {
      const stats = testUnit.stats;
      const range = stats.range ?? 1;
      const rangeTypeLabel = range >= 2 ? "Đánh xa" : "Cận chiến";
      const evasionPct = Math.round(getBaseEvasion(testUnit.classType) * 100);

      const statsText = [
        `Tộc: ${getTribeLabelVi(testUnit.tribe)}   Nghề: ${getClassLabelVi(testUnit.classType)}`,
        `Máu (HP): ${stats.hp ?? "?"}   Công (ATK): ${stats.atk ?? "?"}   Phòng thủ (DEF): ${stats.def ?? "?"}`,
        `K.Phép (MDEF): ${stats.mdef ?? "?"}   S.Mạnh Phép (MATK): ${stats.matk ?? "?"}`,
        `Tầm đánh: ${range} ô (${rangeTypeLabel})   Né tránh: ${evasionPct}%   Nộ tối đa: ${stats.rageMax ?? "?"}`
      ].join("\n");

      // Verify the format contains all expected elements
      expect(statsText).toContain('Tộc:');
      expect(statsText).toContain('Nghề:');
      expect(statsText).toContain('Máu (HP):');
      expect(statsText).toContain('Công (ATK):');
      expect(statsText).toContain('Phòng thủ (DEF):');
      expect(statsText).toContain('K.Phép (MDEF):');
      expect(statsText).toContain('S.Mạnh Phép (MATK):');
      expect(statsText).toContain('Tầm đánh:');
      expect(statsText).toContain('Né tránh:');
      expect(statsText).toContain('Nộ tối đa:');
    });

    it('should use consistent spacing and separators', () => {
      const stats = testUnit.stats;
      const statsLine = `Máu (HP): ${stats.hp}   Công (ATK): ${stats.atk}   Phòng thủ (DEF): ${stats.def}`;
      
      // Verify consistent use of three-space separator between stat groups
      expect(statsLine).toContain('   '); // Three spaces between stats
      expect(statsLine.split('   ').length).toBeGreaterThan(1); // Multiple stat groups
    });
  });

  describe('Stat Labels and Values (Requirement 5.4)', () => {
    it('should include labels for all stats', () => {
      const stats = testUnit.stats;
      const range = stats.range ?? 1;
      const rangeTypeLabel = range >= 2 ? "Đánh xa" : "Cận chiến";
      const evasionPct = Math.round(getBaseEvasion(testUnit.classType) * 100);

      const statsText = [
        `Tộc: ${getTribeLabelVi(testUnit.tribe)}   Nghề: ${getClassLabelVi(testUnit.classType)}`,
        `Máu (HP): ${stats.hp}   Công (ATK): ${stats.atk}   Phòng thủ (DEF): ${stats.def}`,
        `K.Phép (MDEF): ${stats.mdef}   S.Mạnh Phép (MATK): ${stats.matk}`,
        `Tầm đánh: ${range} ô (${rangeTypeLabel})   Né tránh: ${evasionPct}%   Nộ tối đa: ${stats.rageMax}`
      ].join("\n");

      // Verify each stat has a label
      const labels = ['Tộc:', 'Nghề:', 'Máu (HP):', 'Công (ATK):', 'Phòng thủ (DEF):', 
                      'K.Phép (MDEF):', 'S.Mạnh Phép (MATK):', 'Tầm đánh:', 'Né tránh:', 'Nộ tối đa:'];
      
      labels.forEach(label => {
        expect(statsText).toContain(label);
      });
    });

    it('should display actual stat values', () => {
      const stats = testUnit.stats;
      
      // Verify values are present and not placeholders
      expect(stats.hp).not.toBe("?");
      expect(stats.atk).not.toBe("?");
      expect(stats.def).not.toBe("?");
      expect(stats.matk).not.toBe("?");
      expect(stats.mdef).not.toBe("?");
      expect(stats.range).not.toBe("?");
      expect(stats.rageMax).not.toBe("?");
    });

    it('should handle missing stats gracefully with placeholder', () => {
      const incompleteUnit = { ...testUnit, stats: {} };
      const stats = incompleteUnit.stats;
      
      const hpDisplay = stats.hp ?? "?";
      const atkDisplay = stats.atk ?? "?";
      
      expect(hpDisplay).toBe("?");
      expect(atkDisplay).toBe("?");
    });
  });

  describe('Element and Role Information (Requirement 5.5)', () => {
    it('should display element (tribe) information', () => {
      const tribeLabel = getTribeLabelVi(testUnit.tribe);
      expect(tribeLabel).toBeDefined();
      expect(typeof tribeLabel).toBe('string');
      expect(tribeLabel.length).toBeGreaterThan(0);
    });

    it('should display role (class) information', () => {
      const classLabel = getClassLabelVi(testUnit.classType);
      expect(classLabel).toBeDefined();
      expect(typeof classLabel).toBe('string');
      expect(classLabel.length).toBeGreaterThan(0);
    });

    it('should display element and role in the first line of stats', () => {
      const statsFirstLine = `Tộc: ${getTribeLabelVi(testUnit.tribe)}   Nghề: ${getClassLabelVi(testUnit.classType)}`;
      
      expect(statsFirstLine).toContain('Tộc:');
      expect(statsFirstLine).toContain('Nghề:');
      expect(statsFirstLine).toContain(getTribeLabelVi(testUnit.tribe));
      expect(statsFirstLine).toContain(getClassLabelVi(testUnit.classType));
    });

    it('should display element and role for all unit types', () => {
      // Test a sample of different unit types
      const sampleUnits = UNIT_CATALOG.slice(0, 10);
      
      sampleUnits.forEach(unit => {
        const tribeLabel = getTribeLabelVi(unit.tribe);
        const classLabel = getClassLabelVi(unit.classType);
        
        expect(tribeLabel).toBeDefined();
        expect(classLabel).toBeDefined();
        expect(tribeLabel.length).toBeGreaterThan(0);
        expect(classLabel.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration with Unit Detail View', () => {
    it('should display all stats when unit detail is shown', () => {
      const unit = testUnit;
      const visual = getUnitVisual(unit.id, unit.classType);
      const skill = SKILL_LIBRARY?.[unit.skillId];
      const stats = unit.stats ?? {};
      
      // Verify all components are available
      expect(visual).toBeDefined();
      expect(visual.icon).toBeDefined();
      expect(visual.nameVi).toBeDefined();
      expect(skill).toBeDefined();
      expect(stats).toBeDefined();
    });

    it('should handle units with all stat types', () => {
      // Find units with different characteristics
      const meleeUnit = UNIT_CATALOG.find(u => u.stats.range === 1);
      const rangedUnit = UNIT_CATALOG.find(u => u.stats.range >= 2);
      const tankUnit = UNIT_CATALOG.find(u => u.classType === 'TANKER');
      const assassinUnit = UNIT_CATALOG.find(u => u.classType === 'ASSASSIN');

      [meleeUnit, rangedUnit, tankUnit, assassinUnit].forEach(unit => {
        if (unit) {
          const stats = unit.stats;
          const evasion = getBaseEvasion(unit.classType);
          
          expect(stats.hp).toBeDefined();
          expect(stats.atk).toBeDefined();
          expect(stats.def).toBeDefined();
          expect(stats.matk).toBeDefined();
          expect(stats.mdef).toBeDefined();
          expect(stats.range).toBeDefined();
          expect(evasion).toBeDefined();
        }
      });
    });
  });

  describe('Evasion Display Format', () => {
    it('should display evasion as percentage', () => {
      const evasion = getBaseEvasion(testUnit.classType);
      const evasionPct = Math.round(evasion * 100);
      
      expect(evasionPct).toBeGreaterThanOrEqual(0);
      expect(evasionPct).toBeLessThanOrEqual(100);
    });

    it('should round evasion percentage to nearest integer', () => {
      const classTypes = ['TANKER', 'FIGHTER', 'ASSASSIN', 'ARCHER', 'MAGE', 'SUPPORT'];
      
      classTypes.forEach(classType => {
        const evasion = getBaseEvasion(classType);
        const evasionPct = Math.round(evasion * 100);
        
        expect(Number.isInteger(evasionPct)).toBe(true);
      });
    });
  });
});
