/**
 * UpgradeSystem Unit Tests
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 11.1, 11.2**
 * **Property 27: Upgrade Detection**
 * **Property 28: Upgrade Transformation**
 * **Property 29: Equipment Transfer on Upgrade**
 * **Property 30: No Upgrade Beyond Star 3**
 * 
 * Tests UpgradeSystem functionality:
 * - canUpgrade with 3 matching units
 * - canUpgrade with star 3 units (should fail)
 * - combineUnits creates correct star level
 * - Equipment transfer from 3 units
 * - findUpgradeCandidates on bench and board
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  canUpgradeUnit,
  canUpgrade,
  upgradeUnit,
  findUpgradeCandidates,
  combineUnits,
  collectMergeEquips,
  getEquipmentNameKey,
  getMergeSpeciesKey,
  getMergeSpeciesLabel,
  collectOwnedUnitRefs,
  removeUnitRefs,
  placeMergedUnit,
  tryAutoMerge
} from '../src/systems/UpgradeSystem.js';

// Helper function to create a test unit
function createUnit(baseId, star = 1, equips = []) {
  return {
    uid: `${baseId}_${star}_${Math.random()}`,
    baseId,
    star,
    equips: [...equips],
    base: {
      name: `Unit ${baseId}`,
      species: baseId,
      tier: 1
    }
  };
}

// Helper to create empty board
function createEmptyBoard() {
  const board = [];
  for (let row = 0; row < 5; row++) {
    board[row] = [];
    for (let col = 0; col < 5; col++) {
      board[row][col] = null;
    }
  }
  return board;
}

// Mock item catalog for equipment testing
const mockItemCatalog = {
  'sword': { id: 'sword', name: 'Sword', kind: 'equipment' },
  'shield': { id: 'shield', name: 'Shield', kind: 'equipment' },
  'helmet': { id: 'helmet', name: 'Helmet', kind: 'equipment' },
  'boots': { id: 'boots', name: 'Boots', kind: 'equipment' },
  'gloves': { id: 'gloves', name: 'Gloves', kind: 'equipment' },
  'armor': { id: 'armor', name: 'Armor', kind: 'equipment' },
  'potion': { id: 'potion', name: 'Potion', kind: 'consumable' }
};

// Mock unit catalog for tier sorting
const mockUnitCatalog = {
  'warrior': { id: 'warrior', tier: 1 },
  'mage': { id: 'mage', tier: 2 },
  'archer': { id: 'archer', tier: 3 }
};

// Mock createUnit function for tryAutoMerge
function mockCreateUnit(baseId, star, equips) {
  return createUnit(baseId, star, equips);
}

describe('UpgradeSystem Unit Tests', () => {

  describe('canUpgradeUnit', () => {
    it('should return true for star 1 units', () => {
      const unit = createUnit('warrior', 1);
      expect(canUpgradeUnit(unit)).toBe(true);
    });

    it('should return true for star 2 units', () => {
      const unit = createUnit('warrior', 2);
      expect(canUpgradeUnit(unit)).toBe(true);
    });

    it('should return false for star 3 units (Property 30)', () => {
      const unit = createUnit('warrior', 3);
      expect(canUpgradeUnit(unit)).toBe(false);
    });

    it('should return false for null unit', () => {
      expect(canUpgradeUnit(null)).toBe(false);
    });

    it('should return false for unit without star property', () => {
      const unit = { uid: 'test', baseId: 'warrior' };
      expect(canUpgradeUnit(unit)).toBe(false);
    });
  });

  describe('canUpgrade', () => {
    it('should return true with 3 matching units (Property 27)', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      expect(canUpgrade(units, 'warrior', 1)).toBe(true);
    });

    it('should return false with only 2 matching units', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      expect(canUpgrade(units, 'warrior', 1)).toBe(false);
    });

    it('should return false for star 3 units (Property 30)', () => {
      const units = [
        createUnit('warrior', 3),
        createUnit('warrior', 3),
        createUnit('warrior', 3)
      ];
      expect(canUpgrade(units, 'warrior', 3)).toBe(false);
    });

    it('should return false when baseIds do not match', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('mage', 1),
        createUnit('archer', 1)
      ];
      expect(canUpgrade(units, 'warrior', 1)).toBe(false);
    });

    it('should return false when star levels do not match', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 2)
      ];
      expect(canUpgrade(units, 'warrior', 1)).toBe(false);
    });

    it('should return true with more than 3 matching units', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      expect(canUpgrade(units, 'warrior', 1)).toBe(true);
    });

    it('should handle empty units array', () => {
      expect(canUpgrade([], 'warrior', 1)).toBe(false);
    });
  });

  describe('upgradeUnit', () => {
    it('should upgrade star 1 to star 2 (Property 28)', () => {
      const unit = createUnit('warrior', 1);
      const result = upgradeUnit(unit);
      
      expect(result.success).toBe(true);
      expect(result.unit.star).toBe(2);
      expect(result.unit.baseId).toBe('warrior');
    });

    it('should upgrade star 2 to star 3 (Property 28)', () => {
      const unit = createUnit('warrior', 2);
      const result = upgradeUnit(unit);
      
      expect(result.success).toBe(true);
      expect(result.unit.star).toBe(3);
      expect(result.unit.baseId).toBe('warrior');
    });

    it('should not upgrade star 3 units (Property 30)', () => {
      const unit = createUnit('warrior', 3);
      const result = upgradeUnit(unit);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit cannot be upgraded (max star level reached)');
    });

    it('should generate new uid for upgraded unit', () => {
      const unit = createUnit('warrior', 1);
      const originalUid = unit.uid;
      const result = upgradeUnit(unit);
      
      expect(result.success).toBe(true);
      expect(result.unit.uid).not.toBe(originalUid);
      expect(result.unit.uid).toContain('upgraded_');
    });

    it('should preserve unit properties during upgrade', () => {
      const unit = createUnit('warrior', 1, ['sword', 'shield']);
      unit.customProp = 'test';
      
      const result = upgradeUnit(unit);
      
      expect(result.success).toBe(true);
      expect(result.unit.baseId).toBe('warrior');
      expect(result.unit.equips).toEqual(['sword', 'shield']);
      expect(result.unit.customProp).toBe('test');
    });

    it('should return error for null unit', () => {
      const result = upgradeUnit(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No unit provided');
    });
  });

  describe('combineUnits', () => {
    it('should combine 3 star 1 units into 1 star 2 unit (Property 28)', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(true);
      expect(result.unit.star).toBe(2);
      expect(result.unit.baseId).toBe('warrior');
    });

    it('should combine 3 star 2 units into 1 star 3 unit (Property 28)', () => {
      const units = [
        createUnit('warrior', 2),
        createUnit('warrior', 2),
        createUnit('warrior', 2)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(true);
      expect(result.unit.star).toBe(3);
      expect(result.unit.baseId).toBe('warrior');
    });

    it('should not combine star 3 units (Property 30)', () => {
      const units = [
        createUnit('warrior', 3),
        createUnit('warrior', 3),
        createUnit('warrior', 3)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot upgrade beyond star level 3');
    });

    it('should transfer equipment from all 3 units (Property 29)', () => {
      const units = [
        createUnit('warrior', 1, ['sword']),
        createUnit('warrior', 1, ['shield']),
        createUnit('warrior', 1, ['helmet'])
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(true);
      expect(result.unit.equips).toHaveLength(3);
      expect(result.unit.equips).toContain('sword');
      expect(result.unit.equips).toContain('shield');
      expect(result.unit.equips).toContain('helmet');
      expect(result.equipmentTransferred).toBe(3);
    });

    it('should limit equipment to 3 slots (Property 29)', () => {
      const units = [
        createUnit('warrior', 1, ['sword', 'shield']),
        createUnit('warrior', 1, ['helmet', 'boots']),
        createUnit('warrior', 1, ['gloves'])
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(true);
      expect(result.unit.equips).toHaveLength(3);
      expect(result.equipmentTransferred).toBe(5);
    });

    it('should handle units with no equipment', () => {
      const units = [
        createUnit('warrior', 1, []),
        createUnit('warrior', 1, []),
        createUnit('warrior', 1, [])
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(true);
      expect(result.unit.equips).toHaveLength(0);
      expect(result.equipmentTransferred).toBe(0);
    });

    it('should handle mixed equipment scenarios', () => {
      const units = [
        createUnit('warrior', 1, ['sword']),
        createUnit('warrior', 1, []),
        createUnit('warrior', 1, ['shield', 'helmet'])
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(true);
      expect(result.unit.equips).toHaveLength(3);
      expect(result.equipmentTransferred).toBe(3);
    });

    it('should reject combining less than 3 units', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Exactly 3 units required for combination');
    });

    it('should reject combining more than 3 units', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Exactly 3 units required for combination');
    });

    it('should reject units with different baseIds', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('mage', 1),
        createUnit('archer', 1)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('All units must have same baseId and star level');
    });

    it('should reject units with different star levels', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 2)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('All units must have same baseId and star level');
    });

    it('should generate unique uid for combined unit', () => {
      const units = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const result = combineUnits(units);
      
      expect(result.success).toBe(true);
      expect(result.unit.uid).toContain('merged_');
      expect(result.unit.uid).not.toBe(units[0].uid);
    });
  });

  describe('findUpgradeCandidates', () => {
    it('should find upgrade candidates on bench (Property 27)', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates).toHaveLength(1);
      expect(candidates[0].baseId).toBe('warrior');
      expect(candidates[0].star).toBe(1);
      expect(candidates[0].count).toBe(3);
    });

    it('should find upgrade candidates on board (Property 27)', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      board[0][1] = createUnit('warrior', 1);
      board[0][2] = createUnit('warrior', 1);
      const bench = [];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates).toHaveLength(1);
      expect(candidates[0].baseId).toBe('warrior');
      expect(candidates[0].star).toBe(1);
      expect(candidates[0].count).toBe(3);
    });

    it('should find upgrade candidates across bench and board (Property 27)', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      board[0][1] = createUnit('warrior', 1);
      const bench = [createUnit('warrior', 1)];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates).toHaveLength(1);
      expect(candidates[0].baseId).toBe('warrior');
      expect(candidates[0].star).toBe(1);
      expect(candidates[0].count).toBe(3);
    });

    it('should not find candidates with only 2 matching units', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates).toHaveLength(0);
    });

    it('should not find candidates for star 3 units (Property 30)', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 3),
        createUnit('warrior', 3),
        createUnit('warrior', 3)
      ];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates).toHaveLength(0);
    });

    it('should find multiple upgrade groups', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('mage', 1),
        createUnit('mage', 1),
        createUnit('mage', 1)
      ];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty bench and board', () => {
      const board = createEmptyBoard();
      const bench = [];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates).toHaveLength(0);
    });

    it('should provide unit references in candidates', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const candidates = findUpgradeCandidates(board, bench);
      
      expect(candidates[0].refs).toHaveLength(3);
      expect(candidates[0].refs[0].location).toBe('BENCH');
      expect(candidates[0].refs[0].unit).toBeDefined();
    });
  });

  describe('collectMergeEquips', () => {
    it('should collect equipment from multiple units (Property 29)', () => {
      const refs = [
        { unit: createUnit('warrior', 1, ['sword']) },
        { unit: createUnit('warrior', 1, ['shield']) },
        { unit: createUnit('warrior', 1, ['helmet']) }
      ];
      
      const result = collectMergeEquips(refs, mockItemCatalog);
      
      expect(result.kept).toHaveLength(3);
      expect(result.kept).toContain('sword');
      expect(result.kept).toContain('shield');
      expect(result.kept).toContain('helmet');
      expect(result.overflow).toHaveLength(0);
    });

    it('should limit kept equipment to 3 slots', () => {
      const refs = [
        { unit: createUnit('warrior', 1, ['sword', 'shield']) },
        { unit: createUnit('warrior', 1, ['helmet', 'boots']) },
        { unit: createUnit('warrior', 1, ['gloves']) }
      ];
      
      const result = collectMergeEquips(refs, mockItemCatalog);
      
      expect(result.kept).toHaveLength(3);
      expect(result.overflow).toHaveLength(2);
    });

    it('should deduplicate equipment by name', () => {
      const refs = [
        { unit: createUnit('warrior', 1, ['sword']) },
        { unit: createUnit('warrior', 1, ['sword']) },
        { unit: createUnit('warrior', 1, ['shield']) }
      ];
      
      const result = collectMergeEquips(refs, mockItemCatalog);
      
      expect(result.kept).toHaveLength(2);
      expect(result.kept).toContain('sword');
      expect(result.kept).toContain('shield');
      expect(result.overflow).toHaveLength(1);
      expect(result.overflow).toContain('sword');
    });

    it('should handle units with no equipment', () => {
      const refs = [
        { unit: createUnit('warrior', 1, []) },
        { unit: createUnit('warrior', 1, []) },
        { unit: createUnit('warrior', 1, []) }
      ];
      
      const result = collectMergeEquips(refs, mockItemCatalog);
      
      expect(result.kept).toHaveLength(0);
      expect(result.overflow).toHaveLength(0);
    });

    it('should filter out non-equipment items', () => {
      const refs = [
        { unit: createUnit('warrior', 1, ['sword', 'potion']) },
        { unit: createUnit('warrior', 1, ['shield']) }
      ];
      
      const result = collectMergeEquips(refs, mockItemCatalog);
      
      expect(result.kept).toHaveLength(2);
      expect(result.kept).toContain('sword');
      expect(result.kept).toContain('shield');
      expect(result.kept).not.toContain('potion');
    });

    it('should handle empty refs array', () => {
      const result = collectMergeEquips([], mockItemCatalog);
      
      expect(result.kept).toHaveLength(0);
      expect(result.overflow).toHaveLength(0);
    });

    it('should handle null itemCatalog', () => {
      const refs = [
        { unit: createUnit('warrior', 1, ['sword']) }
      ];
      
      const result = collectMergeEquips(refs, null);
      
      expect(result.kept).toHaveLength(0);
      expect(result.overflow).toHaveLength(0);
    });
  });

  describe('getEquipmentNameKey', () => {
    it('should return equipment name key', () => {
      const key = getEquipmentNameKey('sword', mockItemCatalog);
      expect(key).toBe('sword');
    });

    it('should normalize equipment name to lowercase', () => {
      const catalog = {
        'bigSword': { id: 'bigSword', name: 'Big Sword', kind: 'equipment' }
      };
      const key = getEquipmentNameKey('bigSword', catalog);
      expect(key).toBe('big sword');
    });

    it('should return null for non-equipment items', () => {
      const key = getEquipmentNameKey('potion', mockItemCatalog);
      expect(key).toBeNull();
    });

    it('should return null for missing items', () => {
      const key = getEquipmentNameKey('nonexistent', mockItemCatalog);
      expect(key).toBeNull();
    });

    it('should return null for null catalog', () => {
      const key = getEquipmentNameKey('sword', null);
      expect(key).toBeNull();
    });
  });

  describe('getMergeSpeciesKey', () => {
    it('should return normalized species key', () => {
      const unit = createUnit('warrior', 1);
      const key = getMergeSpeciesKey(unit);
      expect(key).toBe('warrior');
    });

    it('should normalize species with special characters', () => {
      const unit = {
        uid: 'test',
        baseId: 'test',
        star: 1,
        base: { species: 'Fire Dragon', name: 'Fire Dragon' }
      };
      const key = getMergeSpeciesKey(unit);
      expect(key).toBe('fire-dragon');
    });

    it('should handle units without base.species', () => {
      const unit = {
        uid: 'test',
        baseId: 'warrior',
        star: 1,
        base: { name: 'Warrior' }
      };
      const key = getMergeSpeciesKey(unit);
      expect(key).toBe('warrior');
    });

    it('should fallback to baseId if no species or name', () => {
      const unit = {
        uid: 'test',
        baseId: 'warrior',
        star: 1,
        base: {}
      };
      const key = getMergeSpeciesKey(unit);
      expect(key).toBe('warrior');
    });
  });

  describe('getMergeSpeciesLabel', () => {
    it('should return display label', () => {
      const unit = createUnit('warrior', 1);
      const label = getMergeSpeciesLabel(unit);
      expect(label).toBe('Unit warrior');
    });

    it('should remove trailing numbers from label', () => {
      const unit = {
        uid: 'test',
        baseId: 'warrior',
        star: 1,
        base: { name: 'Warrior 1' }
      };
      const label = getMergeSpeciesLabel(unit);
      expect(label).toBe('Warrior');
    });
  });

  describe('collectOwnedUnitRefs', () => {
    it('should collect units from bench', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('mage', 1)
      ];
      
      const refs = collectOwnedUnitRefs(board, bench);
      
      expect(refs).toHaveLength(2);
      expect(refs[0].location).toBe('BENCH');
      expect(refs[0].index).toBe(0);
      expect(refs[1].location).toBe('BENCH');
      expect(refs[1].index).toBe(1);
    });

    it('should collect units from board', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      board[2][2] = createUnit('mage', 1);
      const bench = [];
      
      const refs = collectOwnedUnitRefs(board, bench);
      
      expect(refs).toHaveLength(2);
      const boardRefs = refs.filter(r => r.location === 'BOARD');
      expect(boardRefs).toHaveLength(2);
    });

    it('should collect units from both bench and board', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      const bench = [createUnit('mage', 1)];
      
      const refs = collectOwnedUnitRefs(board, bench);
      
      expect(refs).toHaveLength(2);
      expect(refs.some(r => r.location === 'BENCH')).toBe(true);
      expect(refs.some(r => r.location === 'BOARD')).toBe(true);
    });

    it('should handle empty bench and board', () => {
      const board = createEmptyBoard();
      const bench = [];
      
      const refs = collectOwnedUnitRefs(board, bench);
      
      expect(refs).toHaveLength(0);
    });

    it('should skip null entries', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      board[0][1] = null;
      const bench = [createUnit('mage', 1), null];
      
      const refs = collectOwnedUnitRefs(board, bench);
      
      expect(refs).toHaveLength(2);
    });
  });

  describe('removeUnitRefs', () => {
    it('should remove units from bench', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('mage', 1),
        createUnit('archer', 1)
      ];
      
      const refs = [
        { location: 'BENCH', index: 0, unit: bench[0] },
        { location: 'BENCH', index: 2, unit: bench[2] }
      ];
      
      const result = removeUnitRefs(board, bench, refs);
      
      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(2);
      expect(bench).toHaveLength(1);
      expect(bench[0].baseId).toBe('mage');
    });

    it('should remove units from board', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      board[1][1] = createUnit('mage', 1);
      const bench = [];
      
      const refs = [
        { location: 'BOARD', row: 0, col: 0, unit: board[0][0] }
      ];
      
      const result = removeUnitRefs(board, bench, refs);
      
      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(1);
      expect(board[0][0]).toBeNull();
      expect(board[1][1]).not.toBeNull();
    });

    it('should remove units from both bench and board', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      const bench = [createUnit('mage', 1)];
      
      const refs = [
        { location: 'BOARD', row: 0, col: 0, unit: board[0][0] },
        { location: 'BENCH', index: 0, unit: bench[0] }
      ];
      
      const result = removeUnitRefs(board, bench, refs);
      
      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(2);
      expect(board[0][0]).toBeNull();
      expect(bench).toHaveLength(0);
    });

    it('should handle empty refs array', () => {
      const board = createEmptyBoard();
      const bench = [];
      
      const result = removeUnitRefs(board, bench, []);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No references provided');
    });
  });

  describe('placeMergedUnit', () => {
    it('should prefer board position if source was on board', () => {
      const board = createEmptyBoard();
      const bench = [];
      const unit = createUnit('warrior', 2);
      const sourceRefs = [
        { location: 'BOARD', row: 1, col: 1 },
        { location: 'BENCH', index: 0 },
        { location: 'BENCH', index: 1 }
      ];
      
      const result = placeMergedUnit(board, bench, unit, sourceRefs);
      
      expect(result.success).toBe(true);
      expect(result.location).toBe('BOARD');
      expect(result.row).toBe(1);
      expect(result.col).toBe(1);
      expect(board[1][1]).toBe(unit);
    });

    it('should place on bench if no board source', () => {
      const board = createEmptyBoard();
      const bench = [];
      const unit = createUnit('warrior', 2);
      const sourceRefs = [
        { location: 'BENCH', index: 0 },
        { location: 'BENCH', index: 1 },
        { location: 'BENCH', index: 2 }
      ];
      
      const result = placeMergedUnit(board, bench, unit, sourceRefs);
      
      expect(result.success).toBe(true);
      expect(result.location).toBe('BENCH');
      expect(bench).toHaveLength(1);
      expect(bench[0]).toBe(unit);
    });

    it('should place in first null slot on bench', () => {
      const board = createEmptyBoard();
      const bench = [createUnit('mage', 1), null, createUnit('archer', 1)];
      const unit = createUnit('warrior', 2);
      const sourceRefs = [{ location: 'BENCH', index: 0 }];
      
      const result = placeMergedUnit(board, bench, unit, sourceRefs);
      
      expect(result.success).toBe(true);
      expect(result.location).toBe('BENCH');
      expect(result.index).toBe(1);
      expect(bench[1]).toBe(unit);
    });

    it('should append to bench if no null slots', () => {
      const board = createEmptyBoard();
      const bench = [createUnit('mage', 1), createUnit('archer', 1)];
      const unit = createUnit('warrior', 2);
      const sourceRefs = [{ location: 'BENCH', index: 0 }];
      
      const result = placeMergedUnit(board, bench, unit, sourceRefs);
      
      expect(result.success).toBe(true);
      expect(result.location).toBe('BENCH');
      expect(bench).toHaveLength(3);
      expect(bench[2]).toBe(unit);
    });

    it('should return error for null unit', () => {
      const board = createEmptyBoard();
      const bench = [];
      const sourceRefs = [{ location: 'BENCH', index: 0 }];
      
      const result = placeMergedUnit(board, bench, null, sourceRefs);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No unit provided');
    });
  });

  describe('tryAutoMerge', () => {
    it('should merge 3 star 1 units into 1 star 2 unit (Property 28)', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      expect(result.log).toHaveLength(1);
      expect(result.log[0].fromStar).toBe(1);
      expect(result.log[0].toStar).toBe(2);
      
      // Check that merged unit exists
      const refs = collectOwnedUnitRefs(board, bench);
      expect(refs).toHaveLength(1);
      expect(refs[0].unit.star).toBe(2);
    });

    it('should merge 3 star 2 units into 1 star 3 unit (Property 28)', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 2),
        createUnit('warrior', 2),
        createUnit('warrior', 2)
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      expect(result.log[0].fromStar).toBe(2);
      expect(result.log[0].toStar).toBe(3);
      
      const refs = collectOwnedUnitRefs(board, bench);
      expect(refs[0].unit.star).toBe(3);
    });

    it('should not merge star 3 units (Property 30)', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 3),
        createUnit('warrior', 3),
        createUnit('warrior', 3)
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(0);
      expect(bench).toHaveLength(3);
    });

    it('should transfer equipment during merge (Property 29)', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1, ['sword']),
        createUnit('warrior', 1, ['shield']),
        createUnit('warrior', 1, ['helmet'])
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      expect(result.log[0].equipCount).toBe(3);
      
      const refs = collectOwnedUnitRefs(board, bench);
      expect(refs[0].unit.equips).toHaveLength(3);
    });

    it('should handle cascading merges (9 star 1 → 3 star 2 → 1 star 3)', () => {
      const board = createEmptyBoard();
      const bench = [];
      for (let i = 0; i < 9; i++) {
        bench.push(createUnit('warrior', 1));
      }
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      // Should merge multiple times until reaching star 3
      expect(result.mergeCount).toBeGreaterThan(0);
      
      const refs = collectOwnedUnitRefs(board, bench);
      const star3Units = refs.filter(r => r.unit.star === 3);
      expect(star3Units).toHaveLength(1);
    });

    it('should merge units from both bench and board', () => {
      const board = createEmptyBoard();
      board[0][0] = createUnit('warrior', 1);
      board[0][1] = createUnit('warrior', 1);
      const bench = [createUnit('warrior', 1)];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      
      const refs = collectOwnedUnitRefs(board, bench);
      expect(refs).toHaveLength(1);
      expect(refs[0].unit.star).toBe(2);
    });

    it('should prefer board position for merged unit', () => {
      const board = createEmptyBoard();
      board[2][2] = createUnit('warrior', 1);
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      
      // Merged unit should be on board
      expect(board[2][2]).not.toBeNull();
      expect(board[2][2].star).toBe(2);
    });

    it('should handle multiple different unit types', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('mage', 1),
        createUnit('mage', 1),
        createUnit('mage', 1)
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(2);
      expect(result.log).toHaveLength(2);
    });

    it('should handle partial merges (4 units → 1 star 2 + 1 star 1)', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1),
        createUnit('warrior', 1)
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      
      const refs = collectOwnedUnitRefs(board, bench);
      expect(refs).toHaveLength(2); // 1 star 2 + 1 star 1
      const star1 = refs.filter(r => r.unit.star === 1);
      const star2 = refs.filter(r => r.unit.star === 2);
      expect(star1).toHaveLength(1);
      expect(star2).toHaveLength(1);
    });

    it('should handle empty bench and board', () => {
      const board = createEmptyBoard();
      const bench = [];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(0);
      expect(result.log).toHaveLength(0);
    });

    it('should deduplicate equipment during merge', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1, ['sword']),
        createUnit('warrior', 1, ['sword']),
        createUnit('warrior', 1, ['shield'])
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      expect(result.log[0].equipCount).toBe(2); // Only 2 unique equipment
      expect(result.log[0].equipOverflow).toBe(1); // 1 duplicate sword
    });

    it('should log equipment overflow', () => {
      const board = createEmptyBoard();
      const bench = [
        createUnit('warrior', 1, ['sword', 'shield']),
        createUnit('warrior', 1, ['helmet', 'boots']),
        createUnit('warrior', 1, ['gloves'])
      ];
      
      const result = tryAutoMerge(board, bench, mockItemCatalog, mockUnitCatalog, mockCreateUnit);
      
      expect(result.mergeCount).toBe(1);
      expect(result.log[0].equipCount).toBe(3); // Max 3 kept
      expect(result.log[0].equipOverflow).toBe(2); // 2 overflow
      expect(result.log[0].overflowItems).toHaveLength(2);
    });
  });
});
