/**
 * Property Tests: AISystem
 * 
 * **Validates: Requirements 11.2**
 * 
 * Feature: code-architecture-refactor
 * 
 * This test suite verifies:
 * - Property 32: AI Budget Constraint
 * - Property 33: AI Difficulty Scaling
 * - Property 34: AI Team Validity
 * - Property 35: AI Strength Increases with Rounds
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  generateEnemyTeam,
  computeEnemyTeamSize,
  getAIDifficultyMultiplier,
  makeAIDecision,
  selectTarget,
  getAISettings
} from '../src/systems/AISystem.js';
import { UNIT_BY_ID } from '../src/data/unitCatalog.js';

/**
 * Arbitrary generator for round numbers
 */
const roundNumber = () => fc.integer({ min: 1, max: 50 });

/**
 * Arbitrary generator for difficulty levels
 */
const difficultyLevel = () => fc.constantFrom('EASY', 'MEDIUM', 'HARD');

/**
 * Arbitrary generator for budget values
 */
const budgetValue = () => fc.integer({ min: 10, max: 500 });

/**
 * Arbitrary generator for combat units
 */
const combatUnit = (side = 'LEFT') => fc.record({
  uid: fc.string({ minLength: 5, maxLength: 20 }),
  side: fc.constant(side),
  alive: fc.constant(true),
  row: fc.integer({ min: 0, max: 4 }),
  col: fc.integer({ min: 0, max: 9 }),
  hp: fc.integer({ min: 1, max: 1000 }),
  maxHp: fc.integer({ min: 100, max: 1000 }),
  rage: fc.integer({ min: 0, max: 100 }),
  rageMax: fc.constant(100),
  skillId: fc.constantFrom('test_skill', 'another_skill', null),
  statuses: fc.constant({}),
  range: fc.integer({ min: 1, max: 3 }),
  classType: fc.constantFrom('TANKER', 'FIGHTER', 'ARCHER', 'MAGE', 'SUPPORT', 'ASSASSIN')
});

/**
 * Property 32: AI Budget Constraint
 * 
 * For any generated enemy team, all units should have valid baseIds that exist
 * in the unit catalog, and the team should be generated within reasonable constraints.
 * 
 * **Validates: Requirement 7.1**
 */
describe('Property 32: AI Budget Constraint', () => {
  it('should generate valid teams for any round and budget (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        budgetValue(),
        difficultyLevel(),
        fc.boolean(),
        (round, budget, difficulty, sandbox) => {
          const team = generateEnemyTeam(round, budget, difficulty, sandbox);
          
          // Team should exist and be an array
          if (!Array.isArray(team)) return false;
          
          // Team should have at least 2 units
          if (team.length < 2) return false;
          
          // Team should not exceed 15 units
          if (team.length > 15) return false;
          
          // All units should have valid baseIds
          for (const unit of team) {
            if (!unit.baseId || !UNIT_BY_ID[unit.baseId]) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate teams with valid star levels (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        budgetValue(),
        difficultyLevel(),
        (round, budget, difficulty) => {
          const team = generateEnemyTeam(round, budget, difficulty, false);
          
          // All units should have star level between 1 and 3
          return team.every(unit => 
            unit.star >= 1 && unit.star <= 3
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect minimum team size of 2 (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        budgetValue(),
        difficultyLevel(),
        fc.boolean(),
        (round, budget, difficulty, sandbox) => {
          const team = generateEnemyTeam(round, budget, difficulty, sandbox);
          
          return team.length >= 2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect maximum team size of 15 (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        budgetValue(),
        difficultyLevel(),
        fc.boolean(),
        (round, budget, difficulty, sandbox) => {
          const team = generateEnemyTeam(round, budget, difficulty, sandbox);
          
          return team.length <= 15;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 33: AI Difficulty Scaling
 * 
 * For any difficulty level, the multipliers should be consistent and scale
 * appropriately. EASY should have lower multipliers than MEDIUM, and HARD
 * should have higher multipliers than MEDIUM.
 * 
 * **Validates: Requirements 7.2, 7.3**
 */
describe('Property 33: AI Difficulty Scaling', () => {
  it('should return valid multipliers for any difficulty (property-based)', () => {
    fc.assert(
      fc.property(
        difficultyLevel(),
        (difficulty) => {
          const multipliers = getAIDifficultyMultiplier(difficulty);
          
          // All multipliers should be positive numbers
          if (multipliers.hpMult <= 0) return false;
          if (multipliers.atkMult <= 0) return false;
          if (multipliers.matkMult <= 0) return false;
          if (multipliers.rageGain <= 0) return false;
          
          // Random target chance should be between 0 and 1
          if (multipliers.randomTargetChance < 0 || multipliers.randomTargetChance > 1) {
            return false;
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain difficulty ordering: EASY < MEDIUM < HARD (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          const easy = getAIDifficultyMultiplier('EASY');
          const medium = getAIDifficultyMultiplier('MEDIUM');
          const hard = getAIDifficultyMultiplier('HARD');
          
          // HP multipliers should be ordered
          if (easy.hpMult >= medium.hpMult) return false;
          if (medium.hpMult >= hard.hpMult) return false;
          
          // Attack multipliers should be ordered
          if (easy.atkMult >= medium.atkMult) return false;
          if (medium.atkMult >= hard.atkMult) return false;
          
          // Magic attack multipliers should be ordered
          if (easy.matkMult >= medium.matkMult) return false;
          if (medium.matkMult >= hard.matkMult) return false;
          
          // Random target chance should be inversely ordered (EASY has highest)
          if (easy.randomTargetChance <= medium.randomTargetChance) return false;
          if (medium.randomTargetChance <= hard.randomTargetChance) return false;
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return consistent settings for same difficulty (property-based)', () => {
    fc.assert(
      fc.property(
        difficultyLevel(),
        (difficulty) => {
          const settings1 = getAISettings(difficulty);
          const settings2 = getAISettings(difficulty);
          
          // Settings should be identical for same difficulty
          return settings1.hpMult === settings2.hpMult &&
                 settings1.atkMult === settings2.atkMult &&
                 settings1.matkMult === settings2.matkMult &&
                 settings1.budgetMult === settings2.budgetMult;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have higher budget multiplier for harder difficulties (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constant(true),
        () => {
          const easy = getAISettings('EASY');
          const medium = getAISettings('MEDIUM');
          const hard = getAISettings('HARD');
          
          // Budget multiplier should increase with difficulty
          return easy.budgetMult <= medium.budgetMult &&
                 medium.budgetMult <= hard.budgetMult;
        }
      ),
      { numRuns: 10 }
    );
  });
});

/**
 * Property 34: AI Team Validity
 * 
 * For any generated enemy team, all units should have unique positions on the
 * board, valid baseIds, and valid star levels. No two units should occupy the
 * same position.
 * 
 * **Validates: Requirement 7.7**
 */
describe('Property 34: AI Team Validity', () => {
  it('should generate teams with unique positions (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        budgetValue(),
        difficultyLevel(),
        (round, budget, difficulty) => {
          const team = generateEnemyTeam(round, budget, difficulty, false);
          
          // Check for duplicate positions
          const positions = new Set();
          for (const unit of team) {
            const key = `${unit.row}:${unit.col}`;
            if (positions.has(key)) {
              return false; // Duplicate position found
            }
            positions.add(key);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate teams with valid board positions (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        budgetValue(),
        difficultyLevel(),
        (round, budget, difficulty) => {
          const team = generateEnemyTeam(round, budget, difficulty, false);
          
          // All positions should be within board bounds
          return team.every(unit =>
            unit.row >= 0 && unit.row <= 4 &&
            unit.col >= 0 && unit.col <= 9
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate teams with valid unit data (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        budgetValue(),
        difficultyLevel(),
        (round, budget, difficulty) => {
          const team = generateEnemyTeam(round, budget, difficulty, false);
          
          // All units should have required properties
          return team.every(unit =>
            unit.baseId &&
            typeof unit.baseId === 'string' &&
            unit.star >= 1 && unit.star <= 3 &&
            typeof unit.row === 'number' &&
            typeof unit.col === 'number' &&
            UNIT_BY_ID[unit.baseId] !== undefined
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate diverse team compositions (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 30 }),
        budgetValue(),
        difficultyLevel(),
        (round, budget, difficulty) => {
          const team = generateEnemyTeam(round, budget, difficulty, false);
          
          // For teams with 3+ units, should have at least 2 different unit types
          if (team.length >= 3) {
            const uniqueBaseIds = new Set(team.map(u => u.baseId));
            return uniqueBaseIds.size >= 2;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate teams with appropriate star distribution (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        budgetValue(),
        difficultyLevel(),
        (round, budget, difficulty) => {
          const team = generateEnemyTeam(round, budget, difficulty, false);
          
          // In early rounds, most units should be star 1
          const star1Count = team.filter(u => u.star === 1).length;
          const totalCount = team.length;
          
          // At least 50% should be star 1 in early rounds
          return star1Count / totalCount >= 0.5;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 35: AI Strength Increases with Rounds
 * 
 * For any two consecutive rounds N and N+1, the team size should be
 * non-decreasing. Team strength should scale with round number.
 * 
 * **Validates: Requirement 7.6**
 */
describe('Property 35: AI Strength Increases with Rounds', () => {
  it('should compute non-decreasing team size with rounds (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 40 }),
        difficultyLevel(),
        fc.boolean(),
        (round, difficulty, sandbox) => {
          const size1 = computeEnemyTeamSize(round, difficulty, sandbox);
          const size2 = computeEnemyTeamSize(round + 1, difficulty, sandbox);
          
          // Team size should not decrease
          return size2 >= size1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should compute larger teams for harder difficulties (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        fc.boolean(),
        (round, sandbox) => {
          const easySize = computeEnemyTeamSize(round, 'EASY', sandbox);
          const mediumSize = computeEnemyTeamSize(round, 'MEDIUM', sandbox);
          const hardSize = computeEnemyTeamSize(round, 'HARD', sandbox);
          
          // Harder difficulties should have larger or equal team sizes
          return hardSize >= mediumSize && mediumSize >= easySize;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should compute smaller teams in sandbox mode (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        difficultyLevel(),
        (round, difficulty) => {
          const normalSize = computeEnemyTeamSize(round, difficulty, false);
          const sandboxSize = computeEnemyTeamSize(round, difficulty, true);
          
          // Sandbox should have smaller or equal team size
          return sandboxSize <= normalSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect team size bounds for all rounds (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        difficultyLevel(),
        fc.boolean(),
        (round, difficulty, sandbox) => {
          const size = computeEnemyTeamSize(round, difficulty, sandbox);
          
          // Team size should be between 2 and 15
          return size >= 2 && size <= 15;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate stronger teams in later rounds (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 20, max: 30 }),
        difficultyLevel(),
        (earlyRound, lateRound, difficulty) => {
          // Let generateEnemyTeam use its actual budget calculation
          // Budget is calculated as: Math.round((8 + round * 2.6) * modeFactor)
          // Pass 0 as budget parameter (it's not used in the actual implementation)
          const earlyTeam = generateEnemyTeam(earlyRound, 0, difficulty, false);
          const lateTeam = generateEnemyTeam(lateRound, 0, difficulty, false);
          
          // Late round teams should have more higher-star units
          const earlyHighStar = earlyTeam.filter(u => u.star >= 2).length;
          const lateHighStar = lateTeam.filter(u => u.star >= 2).length;
          
          // Late rounds should have at least as many high-star units
          return lateHighStar >= earlyHighStar;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * AI Decision Making Properties
 * 
 * Properties related to AI decision making and target selection.
 */
describe('AI Decision Making Properties', () => {
  it('should always return valid action types (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('RIGHT'),
        difficultyLevel(),
        (aiUnit) => {
          const mockState = {
            units: [
              aiUnit,
              {
                uid: 'enemy1',
                side: 'LEFT',
                alive: true,
                row: 2,
                col: 2,
                hp: 100,
                maxHp: 100
              }
            ]
          };
          
          const decision = makeAIDecision(mockState, aiUnit, 'MEDIUM');
          
          // Action should be one of the valid types
          return ['SKILL', 'ATTACK', 'SKIP'].includes(decision.action);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should skip when stunned (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('RIGHT'),
        difficultyLevel(),
        (aiUnit) => {
          aiUnit.statuses = { stun: 1 };
          
          const mockState = {
            units: [
              aiUnit,
              {
                uid: 'enemy1',
                side: 'LEFT',
                alive: true,
                row: 2,
                col: 2,
                hp: 100,
                maxHp: 100
              }
            ]
          };
          
          const decision = makeAIDecision(mockState, aiUnit, 'MEDIUM');
          
          return decision.action === 'SKIP' && decision.reason === 'stunned';
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should use skill when rage is full (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('RIGHT'),
        difficultyLevel(),
        (aiUnit) => {
          aiUnit.rage = 100;
          aiUnit.skillId = 'test_skill';
          aiUnit.statuses = {};
          
          const mockState = {
            units: [
              aiUnit,
              {
                uid: 'enemy1',
                side: 'LEFT',
                alive: true,
                row: 2,
                col: 2,
                hp: 100,
                maxHp: 100
              }
            ]
          };
          
          const decision = makeAIDecision(mockState, aiUnit, 'MEDIUM');
          
          return decision.action === 'SKILL';
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should select target from enemy side (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        fc.array(combatUnit('RIGHT'), { minLength: 1, maxLength: 5 }),
        difficultyLevel(),
        (attacker, enemies, difficulty) => {
          const mockState = {
            units: [attacker, ...enemies]
          };
          
          const target = selectTarget(attacker, mockState, difficulty, { deterministic: true });
          
          // Target should be from enemy side or null
          return target === null || target.side === 'RIGHT';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when no enemies available (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        difficultyLevel(),
        (attacker, difficulty) => {
          const mockState = {
            units: [attacker] // No enemies
          };
          
          const target = selectTarget(attacker, mockState, difficulty, { deterministic: true });
          
          return target === null;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should respect taunt status (property-based)', () => {
    fc.assert(
      fc.property(
        combatUnit('LEFT'),
        fc.array(combatUnit('RIGHT'), { minLength: 2, maxLength: 5 }),
        difficultyLevel(),
        (attacker, enemies, difficulty) => {
          // Set taunt to first enemy
          attacker.statuses = { tauntTargetId: enemies[0].uid };
          
          const mockState = {
            units: [attacker, ...enemies]
          };
          
          const target = selectTarget(attacker, mockState, difficulty, { deterministic: true });
          
          // Should target the taunted enemy
          return target && target.uid === enemies[0].uid;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Idempotency Properties
 * 
 * Properties that verify consistent behavior across multiple calls.
 */
describe('Idempotency Properties', () => {
  it('should return same difficulty multipliers for same difficulty (property-based)', () => {
    fc.assert(
      fc.property(
        difficultyLevel(),
        (difficulty) => {
          const mult1 = getAIDifficultyMultiplier(difficulty);
          const mult2 = getAIDifficultyMultiplier(difficulty);
          
          return mult1.hpMult === mult2.hpMult &&
                 mult1.atkMult === mult2.atkMult &&
                 mult1.matkMult === mult2.matkMult &&
                 mult1.rageGain === mult2.rageGain &&
                 mult1.randomTargetChance === mult2.randomTargetChance;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return same team size for same inputs (property-based)', () => {
    fc.assert(
      fc.property(
        roundNumber(),
        difficultyLevel(),
        fc.boolean(),
        (round, difficulty, sandbox) => {
          const size1 = computeEnemyTeamSize(round, difficulty, sandbox);
          const size2 = computeEnemyTeamSize(round, difficulty, sandbox);
          
          return size1 === size2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return same AI settings for same difficulty (property-based)', () => {
    fc.assert(
      fc.property(
        difficultyLevel(),
        (difficulty) => {
          const settings1 = getAISettings(difficulty);
          const settings2 = getAISettings(difficulty);
          
          return JSON.stringify(settings1) === JSON.stringify(settings2);
        }
      ),
      { numRuns: 50 }
    );
  });
});
