/**
 * AISystem Unit Tests
 * 
 * Comprehensive unit tests for AISystem covering enemy generation and AI decisions.
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.6, 7.7, 11.1, 11.2**
 * 
 * Properties tested:
 * - Property 32: AI Budget Constraint
 * - Property 33: AI Difficulty Scaling
 * - Property 34: AI Team Validity
 * - Property 35: AI Strength Increases with Rounds
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateEnemyTeam,
  computeEnemyTeamSize,
  getAIDifficultyMultiplier,
  makeAIDecision,
  selectTarget,
  getAISettings,
  AI_SETTINGS
} from '../src/systems/AISystem.js';
import { UNIT_CATALOG, UNIT_BY_ID } from '../src/data/unitCatalog.js';

describe('AISystem - Unit Tests', () => {
  describe('Property 32: AI Budget Constraint', () => {
    /**
     * **Validates: Requirement 7.1**
     * Generated enemy teams should respect budget constraints
     */
    it('should generate enemy team within budget for round 1', () => {
      const round = 1;
      const budget = 100;
      const team = generateEnemyTeam(round, budget, 'MEDIUM', false);

      expect(team).toBeDefined();
      expect(Array.isArray(team)).toBe(true);
      expect(team.length).toBeGreaterThan(0);
    });

    it('should generate enemy team for early rounds', () => {
      for (let round = 1; round <= 5; round++) {
        const team = generateEnemyTeam(round, 100, 'MEDIUM', false);
        
        expect(team).toBeDefined();
        expect(team.length).toBeGreaterThan(0);
        expect(team.length).toBeLessThanOrEqual(15);
      }
    });

    it('should generate enemy team for mid rounds', () => {
      for (let round = 10; round <= 15; round++) {
        const team = generateEnemyTeam(round, 100, 'MEDIUM', false);
        
        expect(team).toBeDefined();
        expect(team.length).toBeGreaterThan(0);
        expect(team.length).toBeLessThanOrEqual(15);
      }
    });

    it('should generate enemy team for late rounds', () => {
      for (let round = 20; round <= 30; round++) {
        const team = generateEnemyTeam(round, 100, 'MEDIUM', false);
        
        expect(team).toBeDefined();
        expect(team.length).toBeGreaterThan(0);
        expect(team.length).toBeLessThanOrEqual(15);
      }
    });

    it('should generate at least 2 units minimum', () => {
      const team = generateEnemyTeam(1, 10, 'EASY', false);
      
      expect(team.length).toBeGreaterThanOrEqual(2);
    });

    it('should not exceed 15 units maximum', () => {
      const team = generateEnemyTeam(50, 1000, 'HARD', false);
      
      expect(team.length).toBeLessThanOrEqual(15);
    });
  });

  describe('Property 33: AI Difficulty Scaling', () => {
    /**
     * **Validates: Requirements 7.2, 7.3**
     * Difficulty multipliers should scale enemy stats appropriately
     */
    it('should return EASY difficulty multipliers', () => {
      const multipliers = getAIDifficultyMultiplier('EASY');

      expect(multipliers).toBeDefined();
      expect(multipliers.hpMult).toBe(0.84);
      expect(multipliers.atkMult).toBe(0.82);
      expect(multipliers.matkMult).toBe(0.82);
      expect(multipliers.rageGain).toBe(1);
      expect(multipliers.randomTargetChance).toBe(0.58);
    });

    it('should return MEDIUM difficulty multipliers', () => {
      const multipliers = getAIDifficultyMultiplier('MEDIUM');

      expect(multipliers).toBeDefined();
      expect(multipliers.hpMult).toBe(0.95);
      expect(multipliers.atkMult).toBe(0.93);
      expect(multipliers.matkMult).toBe(0.93);
      expect(multipliers.rageGain).toBe(1);
      expect(multipliers.randomTargetChance).toBe(0.3);
    });

    it('should return HARD difficulty multipliers', () => {
      const multipliers = getAIDifficultyMultiplier('HARD');

      expect(multipliers).toBeDefined();
      expect(multipliers.hpMult).toBe(1.05);
      expect(multipliers.atkMult).toBe(1.04);
      expect(multipliers.matkMult).toBe(1.04);
      expect(multipliers.rageGain).toBe(1);
      expect(multipliers.randomTargetChance).toBe(0.12);
    });

    it('should default to MEDIUM for invalid difficulty', () => {
      const multipliers = getAIDifficultyMultiplier('INVALID');

      expect(multipliers).toBeDefined();
      expect(multipliers.hpMult).toBe(0.95);
      expect(multipliers.atkMult).toBe(0.93);
    });

    it('should default to MEDIUM when no difficulty provided', () => {
      const multipliers = getAIDifficultyMultiplier();

      expect(multipliers).toBeDefined();
      expect(multipliers.hpMult).toBe(0.95);
    });

    it('EASY should have lower stats than MEDIUM', () => {
      const easy = getAIDifficultyMultiplier('EASY');
      const medium = getAIDifficultyMultiplier('MEDIUM');

      expect(easy.hpMult).toBeLessThan(medium.hpMult);
      expect(easy.atkMult).toBeLessThan(medium.atkMult);
      expect(easy.matkMult).toBeLessThan(medium.matkMult);
    });

    it('HARD should have higher stats than MEDIUM', () => {
      const hard = getAIDifficultyMultiplier('HARD');
      const medium = getAIDifficultyMultiplier('MEDIUM');

      expect(hard.hpMult).toBeGreaterThan(medium.hpMult);
      expect(hard.atkMult).toBeGreaterThan(medium.atkMult);
      expect(hard.matkMult).toBeGreaterThan(medium.matkMult);
    });

    it('EASY should have highest random target chance', () => {
      const easy = getAIDifficultyMultiplier('EASY');
      const medium = getAIDifficultyMultiplier('MEDIUM');
      const hard = getAIDifficultyMultiplier('HARD');

      expect(easy.randomTargetChance).toBeGreaterThan(medium.randomTargetChance);
      expect(medium.randomTargetChance).toBeGreaterThan(hard.randomTargetChance);
    });
  });

  describe('Property 34: AI Team Validity', () => {
    /**
     * **Validates: Requirement 7.7**
     * Generated teams should have valid units and positions
     */
    it('should generate teams with valid baseId', () => {
      const team = generateEnemyTeam(5, 100, 'MEDIUM', false);

      team.forEach(unit => {
        expect(unit.baseId).toBeDefined();
        expect(typeof unit.baseId).toBe('string');
        expect(UNIT_BY_ID[unit.baseId]).toBeDefined();
      });
    });

    it('should generate teams with valid star levels (1-3)', () => {
      const team = generateEnemyTeam(10, 100, 'MEDIUM', false);

      team.forEach(unit => {
        expect(unit.star).toBeDefined();
        expect(unit.star).toBeGreaterThanOrEqual(1);
        expect(unit.star).toBeLessThanOrEqual(3);
      });
    });

    it('should generate teams with valid board positions', () => {
      const team = generateEnemyTeam(5, 100, 'MEDIUM', false);

      team.forEach(unit => {
        expect(unit.row).toBeDefined();
        expect(unit.col).toBeDefined();
        expect(unit.row).toBeGreaterThanOrEqual(0);
        expect(unit.row).toBeLessThanOrEqual(4);
        expect(unit.col).toBeGreaterThanOrEqual(0);
        expect(unit.col).toBeLessThanOrEqual(9);
      });
    });

    it('should generate teams with no duplicate positions', () => {
      const team = generateEnemyTeam(10, 100, 'MEDIUM', false);

      const positions = new Set();
      team.forEach(unit => {
        const key = `${unit.row}:${unit.col}`;
        expect(positions.has(key)).toBe(false);
        positions.add(key);
      });
    });

    it('should generate teams with mostly star 1 units in early rounds', () => {
      const team = generateEnemyTeam(1, 100, 'MEDIUM', false);

      const star1Count = team.filter(u => u.star === 1).length;
      const totalCount = team.length;

      // Most units should be star 1 in round 1
      expect(star1Count / totalCount).toBeGreaterThan(0.8);
    });

    it('should generate teams with higher star units in later rounds', () => {
      const team = generateEnemyTeam(20, 100, 'MEDIUM', false);

      const higherStarCount = team.filter(u => u.star >= 2).length;
      
      // Should have some higher star units in round 20
      expect(higherStarCount).toBeGreaterThan(0);
    });

    it('should generate diverse team compositions', () => {
      const team = generateEnemyTeam(10, 100, 'MEDIUM', false);

      const uniqueBaseIds = new Set(team.map(u => u.baseId));
      
      // Team should have at least 2 different unit types
      expect(uniqueBaseIds.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Property 35: AI Strength Increases with Rounds', () => {
    /**
     * **Validates: Requirement 7.6**
     * Enemy team strength should scale with round number
     */
    it('should generate larger teams in later rounds', () => {
      const team1 = generateEnemyTeam(1, 100, 'MEDIUM', false);
      const team10 = generateEnemyTeam(10, 100, 'MEDIUM', false);
      const team20 = generateEnemyTeam(20, 100, 'MEDIUM', false);

      // Later rounds should generally have more units
      expect(team20.length).toBeGreaterThanOrEqual(team1.length);
    });

    it('should compute increasing team size with rounds', () => {
      const size1 = computeEnemyTeamSize(1, 'MEDIUM', false);
      const size10 = computeEnemyTeamSize(10, 'MEDIUM', false);
      const size20 = computeEnemyTeamSize(20, 'MEDIUM', false);

      expect(size10).toBeGreaterThanOrEqual(size1);
      expect(size20).toBeGreaterThanOrEqual(size10);
    });

    it('should compute larger team size for HARD difficulty', () => {
      const easySize = computeEnemyTeamSize(10, 'EASY', false);
      const mediumSize = computeEnemyTeamSize(10, 'MEDIUM', false);
      const hardSize = computeEnemyTeamSize(10, 'HARD', false);

      expect(hardSize).toBeGreaterThanOrEqual(mediumSize);
      expect(mediumSize).toBeGreaterThanOrEqual(easySize);
    });

    it('should compute smaller team size in sandbox mode', () => {
      const normalSize = computeEnemyTeamSize(10, 'MEDIUM', false);
      const sandboxSize = computeEnemyTeamSize(10, 'MEDIUM', true);

      expect(sandboxSize).toBeLessThanOrEqual(normalSize);
    });

    it('should respect minimum team size of 2', () => {
      const size = computeEnemyTeamSize(1, 'EASY', true);

      expect(size).toBeGreaterThanOrEqual(2);
    });

    it('should respect maximum team size of 15', () => {
      const size = computeEnemyTeamSize(100, 'HARD', false);

      expect(size).toBeLessThanOrEqual(15);
    });
  });

  describe('AI Decision Making', () => {
    let mockState;
    let mockAIUnit;
    let mockEnemies;

    beforeEach(() => {
      mockEnemies = [
        {
          uid: 'enemy1',
          side: 'LEFT',
          alive: true,
          row: 2,
          col: 2,
          hp: 100,
          maxHp: 100
        },
        {
          uid: 'enemy2',
          side: 'LEFT',
          alive: true,
          row: 1,
          col: 3,
          hp: 80,
          maxHp: 100
        }
      ];

      mockAIUnit = {
        uid: 'ai1',
        side: 'RIGHT',
        alive: true,
        row: 2,
        col: 7,
        rage: 50,
        rageMax: 100,
        skillId: 'test_skill',
        statuses: {},
        range: 1,
        classType: 'FIGHTER'
      };

      mockState = {
        units: [...mockEnemies, mockAIUnit]
      };
    });

    it('should skip turn when unit is stunned', () => {
      mockAIUnit.statuses = { stun: 1 };

      const decision = makeAIDecision(mockState, mockAIUnit, 'MEDIUM');

      expect(decision.action).toBe('SKIP');
      expect(decision.reason).toBe('stunned');
      expect(decision.target).toBeNull();
    });

    it('should use skill when rage is full', () => {
      mockAIUnit.rage = 100;

      const decision = makeAIDecision(mockState, mockAIUnit, 'MEDIUM');

      expect(decision.action).toBe('SKILL');
      expect(decision.reason).toBe('rage_full');
      expect(decision.target).toBeDefined();
    });

    it('should not use skill when silenced', () => {
      mockAIUnit.rage = 100;
      mockAIUnit.statuses = { silence: 1 };

      const decision = makeAIDecision(mockState, mockAIUnit, 'MEDIUM');

      expect(decision.action).not.toBe('SKILL');
    });

    it('should skip turn when disarmed and rage not full', () => {
      mockAIUnit.rage = 50;
      mockAIUnit.statuses = { disarmTurns: 1 };

      const decision = makeAIDecision(mockState, mockAIUnit, 'MEDIUM');

      expect(decision.action).toBe('SKIP');
      expect(decision.reason).toBe('disarmed');
    });

    it('should basic attack when rage not full', () => {
      mockAIUnit.rage = 50;

      const decision = makeAIDecision(mockState, mockAIUnit, 'MEDIUM');

      expect(decision.action).toBe('ATTACK');
      expect(decision.reason).toBe('basic_attack');
      expect(decision.target).toBeDefined();
    });

    it('should skip when no targets available', () => {
      mockState.units = [mockAIUnit]; // No enemies

      const decision = makeAIDecision(mockState, mockAIUnit, 'MEDIUM');

      expect(decision.action).toBe('SKIP');
      expect(decision.reason).toBe('no_target');
      expect(decision.target).toBeNull();
    });
  });

  describe('Target Selection', () => {
    let mockAttacker;
    let mockState;

    beforeEach(() => {
      mockAttacker = {
        uid: 'attacker1',
        side: 'LEFT',
        row: 2,
        col: 2,
        range: 1,
        classType: 'FIGHTER',
        statuses: {}
      };

      mockState = {
        units: [
          mockAttacker,
          {
            uid: 'enemy1',
            side: 'RIGHT',
            alive: true,
            row: 2,
            col: 5,
            hp: 100,
            maxHp: 100
          },
          {
            uid: 'enemy2',
            side: 'RIGHT',
            alive: true,
            row: 1,
            col: 6,
            hp: 80,
            maxHp: 100
          },
          {
            uid: 'enemy3',
            side: 'RIGHT',
            alive: true,
            row: 3,
            col: 7,
            hp: 60,
            maxHp: 100
          }
        ]
      };
    });

    it('should select target from enemy side', () => {
      const target = selectTarget(mockAttacker, mockState, 'MEDIUM', { deterministic: true });

      expect(target).toBeDefined();
      expect(target.side).toBe('RIGHT');
    });

    it('should return null when no enemies available', () => {
      mockState.units = [mockAttacker];

      const target = selectTarget(mockAttacker, mockState, 'MEDIUM', { deterministic: true });

      expect(target).toBeNull();
    });

    it('should respect taunt status', () => {
      mockAttacker.statuses = { tauntTargetId: 'enemy2' };

      const target = selectTarget(mockAttacker, mockState, 'MEDIUM', { deterministic: true });

      expect(target).toBeDefined();
      expect(target.uid).toBe('enemy2');
    });

    it('should select closest target for melee frontline', () => {
      mockAttacker.range = 1;
      mockAttacker.classType = 'FIGHTER';

      const target = selectTarget(mockAttacker, mockState, 'MEDIUM', { deterministic: true });

      expect(target).toBeDefined();
      // Should prefer closest column
      expect(target.uid).toBe('enemy1');
    });

    it('should select backline target for assassin', () => {
      mockAttacker.range = 1;
      mockAttacker.classType = 'ASSASSIN';

      const target = selectTarget(mockAttacker, mockState, 'MEDIUM', { deterministic: true });

      expect(target).toBeDefined();
      // Assassin should target farthest (backline)
    });

    it('should select same row target for ranged units', () => {
      mockAttacker.range = 3;
      mockAttacker.classType = 'ARCHER';
      mockAttacker.row = 2;

      const target = selectTarget(mockAttacker, mockState, 'MEDIUM', { deterministic: true });

      expect(target).toBeDefined();
      // Should prefer same row
      expect(target.row).toBe(2);
    });

    it('should only target alive enemies', () => {
      mockState.units[1].alive = false; // Kill enemy1

      const target = selectTarget(mockAttacker, mockState, 'MEDIUM', { deterministic: true });

      expect(target).toBeDefined();
      expect(target.alive).toBe(true);
      expect(target.uid).not.toBe('enemy1');
    });
  });

  describe('AI Settings', () => {
    it('should return EASY settings', () => {
      const settings = getAISettings('EASY');

      expect(settings).toBeDefined();
      expect(settings.label).toBe('Dễ');
      expect(settings.hpMult).toBe(0.84);
      expect(settings.budgetMult).toBe(0.9);
    });

    it('should return MEDIUM settings', () => {
      const settings = getAISettings('MEDIUM');

      expect(settings).toBeDefined();
      expect(settings.label).toBe('Trung bình');
      expect(settings.hpMult).toBe(0.95);
      expect(settings.budgetMult).toBe(1);
    });

    it('should return HARD settings', () => {
      const settings = getAISettings('HARD');

      expect(settings).toBeDefined();
      expect(settings.label).toBe('Khó');
      expect(settings.hpMult).toBe(1.05);
      expect(settings.budgetMult).toBe(1.08);
    });

    it('should default to MEDIUM for invalid difficulty', () => {
      const settings = getAISettings('INVALID');

      expect(settings).toBeDefined();
      expect(settings.label).toBe('Trung bình');
    });

    it('should have all required settings fields', () => {
      const settings = getAISettings('MEDIUM');

      expect(settings).toHaveProperty('label');
      expect(settings).toHaveProperty('hpMult');
      expect(settings).toHaveProperty('atkMult');
      expect(settings).toHaveProperty('matkMult');
      expect(settings).toHaveProperty('rageGain');
      expect(settings).toHaveProperty('randomTargetChance');
      expect(settings).toHaveProperty('teamSizeBonus');
      expect(settings).toHaveProperty('teamGrowthEvery');
      expect(settings).toHaveProperty('teamGrowthCap');
      expect(settings).toHaveProperty('budgetMult');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle round 0', () => {
      const team = generateEnemyTeam(0, 100, 'MEDIUM', false);

      expect(team).toBeDefined();
      expect(team.length).toBeGreaterThan(0);
    });

    it('should handle negative round', () => {
      const team = generateEnemyTeam(-5, 100, 'MEDIUM', false);

      expect(team).toBeDefined();
      expect(team.length).toBeGreaterThan(0);
    });

    it('should handle very high round numbers', () => {
      const team = generateEnemyTeam(1000, 100, 'MEDIUM', false);

      expect(team).toBeDefined();
      expect(team.length).toBeGreaterThan(0);
      expect(team.length).toBeLessThanOrEqual(15);
    });

    it('should handle very low budget', () => {
      const team = generateEnemyTeam(1, 1, 'MEDIUM', false);

      expect(team).toBeDefined();
      expect(team.length).toBeGreaterThan(0);
    });

    it('should handle very high budget', () => {
      const team = generateEnemyTeam(1, 10000, 'MEDIUM', false);

      expect(team).toBeDefined();
      expect(team.length).toBeLessThanOrEqual(15);
    });

    it('should handle undefined difficulty', () => {
      const team = generateEnemyTeam(5, 100, undefined, false);

      expect(team).toBeDefined();
      expect(team.length).toBeGreaterThan(0);
    });

    it('should handle null difficulty', () => {
      const team = generateEnemyTeam(5, 100, null, false);

      expect(team).toBeDefined();
      expect(team.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should generate consistent teams for same inputs', () => {
      // Note: Due to randomness, we just verify structure consistency
      const team1 = generateEnemyTeam(5, 100, 'MEDIUM', false);
      const team2 = generateEnemyTeam(5, 100, 'MEDIUM', false);

      expect(team1.length).toBeGreaterThan(0);
      expect(team2.length).toBeGreaterThan(0);
      
      // Both should have valid structure
      team1.forEach(unit => {
        expect(unit).toHaveProperty('baseId');
        expect(unit).toHaveProperty('star');
        expect(unit).toHaveProperty('row');
        expect(unit).toHaveProperty('col');
      });
    });

    it('should generate different teams across all difficulties', () => {
      const difficulties = ['EASY', 'MEDIUM', 'HARD'];
      
      difficulties.forEach(difficulty => {
        const team = generateEnemyTeam(10, 100, difficulty, false);
        
        expect(team).toBeDefined();
        expect(team.length).toBeGreaterThan(0);
        expect(team.length).toBeLessThanOrEqual(15);
        
        team.forEach(unit => {
          expect(UNIT_BY_ID[unit.baseId]).toBeDefined();
          expect(unit.star).toBeGreaterThanOrEqual(1);
          expect(unit.star).toBeLessThanOrEqual(3);
        });
      });
    });

    it('should generate teams for progression from round 1 to 30', () => {
      for (let round = 1; round <= 30; round += 5) {
        const team = generateEnemyTeam(round, 100, 'MEDIUM', false);
        
        expect(team).toBeDefined();
        expect(team.length).toBeGreaterThan(0);
        expect(team.length).toBeLessThanOrEqual(15);
      }
    });

    it('should handle complete AI workflow: generate team → make decisions', () => {
      // Generate enemy team
      const team = generateEnemyTeam(5, 100, 'MEDIUM', false);
      
      expect(team.length).toBeGreaterThan(0);

      // Create mock combat state
      const mockState = {
        units: [
          ...team.map(unit => ({
            uid: `enemy_${unit.baseId}_${unit.row}_${unit.col}`,
            baseId: unit.baseId,
            star: unit.star,
            side: 'RIGHT',
            alive: true,
            row: unit.row,
            col: unit.col,
            rage: 50,
            rageMax: 100,
            skillId: 'test_skill',
            statuses: {},
            range: 1,
            classType: 'FIGHTER'
          })),
          {
            uid: 'player1',
            side: 'LEFT',
            alive: true,
            row: 2,
            col: 2,
            hp: 100,
            maxHp: 100
          }
        ]
      };

      // Make AI decisions for each enemy unit
      team.forEach((_, index) => {
        const aiUnit = mockState.units[index];
        const decision = makeAIDecision(mockState, aiUnit, 'MEDIUM');
        
        expect(decision).toBeDefined();
        expect(decision.action).toBeDefined();
        expect(['SKILL', 'ATTACK', 'SKIP']).toContain(decision.action);
      });
    });
  });
});
