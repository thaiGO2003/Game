/**
 * Unit tests for CombatSystem status effects and combat end
 * Tests applyStatusEffect, tickStatusEffects, and checkCombatEnd functions
 * 
 * **Validates: Requirements 4.9, 4.10, 4.11, 4.12, 4.13, 11.1, 11.2**
 * **Validates: Properties 24, 25, 26**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyStatusEffect,
  tickStatusEffects,
  checkCombatEnd,
  applyDamage
} from '../src/systems/CombatSystem.js';

describe('CombatSystem - Status Effects', () => {
  let testUnit;
  let testState;

  beforeEach(() => {
    testUnit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      maxHp: 100,
      alive: true,
      isDead: false,
      statuses: {}
    };

    testState = {
      combatLog: [],
      playerUnits: [],
      enemyUnits: []
    };
  });

  describe('applyStatusEffect', () => {
    it('should apply freeze status effect', () => {
      const effect = { type: 'freeze', duration: 2 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.freeze).toBe(2);
      expect(result.effectType).toBe('freeze');
    });

    it('should apply burn status with damage', () => {
      const effect = { type: 'burn', duration: 3, value: 10 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.burnTurns).toBe(3);
      expect(testUnit.statuses.burnDamage).toBe(10);
    });

    it('should apply poison status with damage', () => {
      const effect = { type: 'poison', duration: 2, value: 5 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.poisonTurns).toBe(2);
      expect(testUnit.statuses.poisonDamage).toBe(5);
    });

    it('should apply armor break with value', () => {
      const effect = { type: 'armorBreak', duration: 2, value: 20 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.armorBreakTurns).toBe(2);
      expect(testUnit.statuses.armorBreakValue).toBe(20);
    });

    it('should apply attack buff', () => {
      const effect = { type: 'atkBuff', duration: 3, value: 15 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.atkBuffTurns).toBe(3);
      expect(testUnit.statuses.atkBuffValue).toBe(15);
    });

    it('should apply taunt with target', () => {
      const effect = { type: 'taunt', duration: 2, targetId: 'enemy1' };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.tauntTurns).toBe(2);
      expect(testUnit.statuses.tauntTargetId).toBe('enemy1');
    });

    it('should not stack shorter duration (use max)', () => {
      testUnit.statuses.freeze = 3;
      const effect = { type: 'freeze', duration: 2 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.freeze).toBe(3); // Should keep longer duration
    });

    it('should extend duration if new duration is longer', () => {
      testUnit.statuses.stun = 1;
      const effect = { type: 'stun', duration: 3 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.stun).toBe(3); // Should use longer duration
    });

    it('should fail for dead unit', () => {
      testUnit.isDead = true;
      testUnit.alive = false;
      const effect = { type: 'freeze', duration: 2 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('dead');
    });

    it('should fail for invalid effect type', () => {
      const effect = { type: 'invalidEffect', duration: 2 };
      const result = applyStatusEffect(testUnit, effect, testState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown');
    });

    it('should log status application to combat log', () => {
      const effect = { type: 'silence', duration: 2 };
      applyStatusEffect(testUnit, effect, testState);

      expect(testState.combatLog.length).toBe(1);
      expect(testState.combatLog[0].type).toBe('STATUS_APPLIED');
      expect(testState.combatLog[0].effectType).toBe('silence');
    });
  });

  describe('tickStatusEffects', () => {
    beforeEach(() => {
      testUnit.statuses = {
        freeze: 2,
        burnTurns: 3,
        burnDamage: 10,
        poisonTurns: 2,
        poisonDamage: 5,
        atkBuffTurns: 2,
        atkBuffValue: 15,
        armorBreakTurns: 1,
        armorBreakValue: 20
      };
    });

    it('should decrement all timed status effects', () => {
      const result = tickStatusEffects(testUnit, testState);

      expect(result.success).toBe(true);
      expect(testUnit.statuses.freeze).toBe(1); // 2 -> 1
      expect(testUnit.statuses.atkBuffTurns).toBe(1); // 2 -> 1
    });

    it('should trigger burn damage', () => {
      const result = tickStatusEffects(testUnit, testState);

      expect(result.success).toBe(true);
      expect(result.triggeredEffects.length).toBeGreaterThan(0);
      
      const burnEffect = result.triggeredEffects.find(e => e.type === 'burn');
      expect(burnEffect).toBeDefined();
      expect(burnEffect.damage).toBe(10);
      expect(testUnit.statuses.burnTurns).toBe(2); // 3 -> 2
    });

    it('should trigger poison damage', () => {
      const result = tickStatusEffects(testUnit, testState);

      const poisonEffect = result.triggeredEffects.find(e => e.type === 'poison');
      expect(poisonEffect).toBeDefined();
      expect(poisonEffect.damage).toBe(5);
      expect(testUnit.statuses.poisonTurns).toBe(1); // 2 -> 1
    });

    it('should return control status when frozen', () => {
      testUnit.statuses.freeze = 2;
      const result = tickStatusEffects(testUnit, testState);

      expect(result.controlStatus).toBe('freeze');
      expect(testUnit.statuses.freeze).toBe(1); // Decremented
    });

    it('should return control status when stunned', () => {
      testUnit.statuses.freeze = 0;
      testUnit.statuses.stun = 2;
      const result = tickStatusEffects(testUnit, testState);

      expect(result.controlStatus).toBe('stun');
      expect(testUnit.statuses.stun).toBe(1);
    });

    it('should return control status when asleep', () => {
      testUnit.statuses.freeze = 0;
      testUnit.statuses.stun = 0;
      testUnit.statuses.sleep = 2;
      const result = tickStatusEffects(testUnit, testState);

      expect(result.controlStatus).toBe('sleep');
      expect(testUnit.statuses.sleep).toBe(1);
    });

    it('should prioritize freeze over stun and sleep', () => {
      testUnit.statuses.freeze = 1;
      testUnit.statuses.stun = 2;
      testUnit.statuses.sleep = 3;
      const result = tickStatusEffects(testUnit, testState);

      expect(result.controlStatus).toBe('freeze');
    });

    it('should clean up armor break value when expired', () => {
      testUnit.statuses.armorBreakTurns = 1;
      testUnit.statuses.armorBreakValue = 20;
      
      tickStatusEffects(testUnit, testState);

      expect(testUnit.statuses.armorBreakTurns).toBe(0);
      expect(testUnit.statuses.armorBreakValue).toBe(0); // Should be cleaned up
    });

    it('should clean up taunt target when expired', () => {
      testUnit.statuses.tauntTurns = 1;
      testUnit.statuses.tauntTargetId = 'enemy1';
      
      tickStatusEffects(testUnit, testState);

      expect(testUnit.statuses.tauntTurns).toBe(0);
      expect(testUnit.statuses.tauntTargetId).toBe(null); // Should be cleaned up
    });

    it('should handle unit with no statuses', () => {
      testUnit.statuses = {};
      const result = tickStatusEffects(testUnit, testState);

      expect(result.success).toBe(true);
      expect(result.triggeredEffects.length).toBe(0);
      expect(result.controlStatus).toBe(null);
    });

    it('should fail for dead unit', () => {
      testUnit.isDead = true;
      testUnit.alive = false;
      const result = tickStatusEffects(testUnit, testState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('dead');
    });

    it('should log status ticks to combat log', () => {
      tickStatusEffects(testUnit, testState);

      expect(testState.combatLog.length).toBeGreaterThan(0);
      const logEntry = testState.combatLog.find(e => e.type === 'STATUS_TICK');
      expect(logEntry).toBeDefined();
      expect(logEntry.triggeredEffects).toBeDefined();
    });
  });

  describe('checkCombatEnd', () => {
    beforeEach(() => {
      testState = {
        playerUnits: [
          { uid: 'p1', name: 'Player 1', alive: true, isDead: false },
          { uid: 'p2', name: 'Player 2', alive: true, isDead: false }
        ],
        enemyUnits: [
          { uid: 'e1', name: 'Enemy 1', alive: true, isDead: false },
          { uid: 'e2', name: 'Enemy 2', alive: true, isDead: false }
        ],
        combatLog: [],
        isFinished: false,
        winner: null
      };
    });

    it('should return not finished when both sides have units', () => {
      const result = checkCombatEnd(testState);

      expect(result.isFinished).toBe(false);
      expect(result.winner).toBe(null);
      expect(result.playerUnitsRemaining).toBe(2);
      expect(result.enemyUnitsRemaining).toBe(2);
    });

    it('should return player victory when all enemies dead', () => {
      testState.enemyUnits[0].isDead = true;
      testState.enemyUnits[0].alive = false;
      testState.enemyUnits[1].isDead = true;
      testState.enemyUnits[1].alive = false;

      const result = checkCombatEnd(testState);

      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('player');
      expect(result.playerUnitsRemaining).toBe(2);
      expect(result.enemyUnitsRemaining).toBe(0);
    });

    it('should return enemy victory when all players dead', () => {
      testState.playerUnits[0].isDead = true;
      testState.playerUnits[0].alive = false;
      testState.playerUnits[1].isDead = true;
      testState.playerUnits[1].alive = false;

      const result = checkCombatEnd(testState);

      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('enemy');
      expect(result.playerUnitsRemaining).toBe(0);
      expect(result.enemyUnitsRemaining).toBe(2);
    });

    it('should return draw when all units dead', () => {
      testState.playerUnits.forEach(u => {
        u.isDead = true;
        u.alive = false;
      });
      testState.enemyUnits.forEach(u => {
        u.isDead = true;
        u.alive = false;
      });

      const result = checkCombatEnd(testState);

      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('draw');
      expect(result.playerUnitsRemaining).toBe(0);
      expect(result.enemyUnitsRemaining).toBe(0);
    });

    it('should update state when combat ends', () => {
      testState.enemyUnits.forEach(u => {
        u.isDead = true;
        u.alive = false;
      });

      checkCombatEnd(testState);

      expect(testState.isFinished).toBe(true);
      expect(testState.winner).toBe('player');
    });

    it('should log combat end to combat log', () => {
      testState.enemyUnits.forEach(u => {
        u.isDead = true;
        u.alive = false;
      });

      checkCombatEnd(testState);

      expect(testState.combatLog.length).toBeGreaterThan(0);
      const logEntry = testState.combatLog.find(e => e.type === 'COMBAT_END');
      expect(logEntry).toBeDefined();
      expect(logEntry.winner).toBe('player');
      expect(logEntry.reason).toBeDefined();
    });

    it('should handle empty unit arrays', () => {
      testState.playerUnits = [];
      testState.enemyUnits = [];

      const result = checkCombatEnd(testState);

      expect(result.isFinished).toBe(true);
      expect(result.winner).toBe('draw');
    });

    it('should ignore units with alive=false', () => {
      testState.playerUnits[0].alive = false;
      testState.enemyUnits[0].alive = false;

      const result = checkCombatEnd(testState);

      expect(result.playerUnitsRemaining).toBe(1);
      expect(result.enemyUnitsRemaining).toBe(1);
    });

    it('should ignore units with isDead=true', () => {
      testState.playerUnits[0].isDead = true;
      testState.enemyUnits[0].isDead = true;

      const result = checkCombatEnd(testState);

      expect(result.playerUnitsRemaining).toBe(1);
      expect(result.enemyUnitsRemaining).toBe(1);
    });
  });
});

// ============================================================================
// Property 24: Combat End Conditions
// ============================================================================
describe('Property 24: Combat End Conditions', () => {
  it('should detect player victory when all enemies dead', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: true, isDead: false },
        { uid: 'p2', alive: true, isDead: false }
      ],
      enemyUnits: [
        { uid: 'e1', alive: false, isDead: true },
        { uid: 'e2', alive: false, isDead: true }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    const result = checkCombatEnd(state);

    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player');
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player');
  });

  it('should detect enemy victory when all players dead', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: false, isDead: true },
        { uid: 'p2', alive: false, isDead: true }
      ],
      enemyUnits: [
        { uid: 'e1', alive: true, isDead: false },
        { uid: 'e2', alive: true, isDead: false }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    const result = checkCombatEnd(state);

    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('enemy');
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('enemy');
  });

  it('should detect draw when all units dead', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: false, isDead: true }
      ],
      enemyUnits: [
        { uid: 'e1', alive: false, isDead: true }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    const result = checkCombatEnd(state);

    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('draw');
  });

  it('should continue combat when both sides have units', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: true, isDead: false }
      ],
      enemyUnits: [
        { uid: 'e1', alive: true, isDead: false }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    const result = checkCombatEnd(state);

    expect(result.isFinished).toBe(false);
    expect(result.winner).toBe(null);
    expect(state.isFinished).toBe(false);
  });

  it('should correctly count remaining units', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: true, isDead: false },
        { uid: 'p2', alive: false, isDead: true },
        { uid: 'p3', alive: true, isDead: false }
      ],
      enemyUnits: [
        { uid: 'e1', alive: true, isDead: false },
        { uid: 'e2', alive: false, isDead: true }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    const result = checkCombatEnd(state);

    expect(result.playerUnitsRemaining).toBe(2);
    expect(result.enemyUnitsRemaining).toBe(1);
    expect(result.isFinished).toBe(false);
  });

  it('should log combat end event with correct details', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: true, isDead: false }
      ],
      enemyUnits: [
        { uid: 'e1', alive: false, isDead: true }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    checkCombatEnd(state);

    expect(state.combatLog.length).toBe(1);
    expect(state.combatLog[0].type).toBe('COMBAT_END');
    expect(state.combatLog[0].winner).toBe('player');
    expect(state.combatLog[0].reason).toBeDefined();
    expect(state.combatLog[0].playerUnitsRemaining).toBe(1);
    expect(state.combatLog[0].enemyUnitsRemaining).toBe(0);
  });

  it('should handle mixed alive/isDead flags correctly', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: true, isDead: false },
        { uid: 'p2', alive: false, isDead: false }, // alive=false should count as dead
        { uid: 'p3', alive: true, isDead: true }    // isDead=true should count as dead
      ],
      enemyUnits: [
        { uid: 'e1', alive: true, isDead: false }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    const result = checkCombatEnd(state);

    expect(result.playerUnitsRemaining).toBe(1); // Only p1 is alive
    expect(result.isFinished).toBe(false);
  });
});

// ============================================================================
// Property 25: Status Effect Ticking
// ============================================================================
describe('Property 25: Status Effect Ticking', () => {
  it('should decrement all status effect durations by 1', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        freeze: 3,
        stun: 2,
        silence: 4,
        burnTurns: 2,
        burnDamage: 10,
        atkBuffTurns: 3,
        atkBuffValue: 15
      }
    };

    const state = { combatLog: [] };
    tickStatusEffects(unit, state);

    // Control statuses: only the highest priority one (freeze) is decremented
    expect(unit.statuses.freeze).toBe(2);
    expect(unit.statuses.stun).toBe(2); // Not decremented because freeze has priority
    
    // Non-control statuses are always decremented
    expect(unit.statuses.silence).toBe(3);
    expect(unit.statuses.burnTurns).toBe(1);
    expect(unit.statuses.atkBuffTurns).toBe(2);
  });

  it('should trigger burn damage each turn', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        burnTurns: 3,
        burnDamage: 15
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    const burnEffect = result.triggeredEffects.find(e => e.type === 'burn');
    expect(burnEffect).toBeDefined();
    expect(burnEffect.damage).toBe(15);
    expect(unit.statuses.burnTurns).toBe(2);
  });

  it('should trigger poison damage each turn', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        poisonTurns: 2,
        poisonDamage: 8
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    const poisonEffect = result.triggeredEffects.find(e => e.type === 'poison');
    expect(poisonEffect).toBeDefined();
    expect(poisonEffect.damage).toBe(8);
    expect(unit.statuses.poisonTurns).toBe(1);
  });

  it('should trigger bleed damage each turn', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        bleedTurns: 3,
        bleedDamage: 12
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    const bleedEffect = result.triggeredEffects.find(e => e.type === 'bleed');
    expect(bleedEffect).toBeDefined();
    expect(bleedEffect.damage).toBe(12);
    expect(unit.statuses.bleedTurns).toBe(2);
  });

  it('should trigger disease damage with spread flag', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        diseaseTurns: 2,
        diseaseDamage: 5
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    const diseaseEffect = result.triggeredEffects.find(e => e.type === 'disease');
    expect(diseaseEffect).toBeDefined();
    expect(diseaseEffect.damage).toBe(5);
    expect(diseaseEffect.spreads).toBe(true);
    expect(unit.statuses.diseaseTurns).toBe(1);
  });

  it('should return control status when unit is frozen', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        freeze: 2
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    expect(result.controlStatus).toBe('freeze');
    expect(unit.statuses.freeze).toBe(1);
  });

  it('should return control status when unit is stunned', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        stun: 2
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    expect(result.controlStatus).toBe('stun');
    expect(unit.statuses.stun).toBe(1);
  });

  it('should return control status when unit is asleep', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        sleep: 2
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    expect(result.controlStatus).toBe('sleep');
    expect(unit.statuses.sleep).toBe(1);
  });

  it('should prioritize freeze over other control effects', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        freeze: 1,
        stun: 2,
        sleep: 3
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    expect(result.controlStatus).toBe('freeze');
  });

  it('should clean up expired status values', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        armorBreakTurns: 1,
        armorBreakValue: 20,
        tauntTurns: 1,
        tauntTargetId: 'enemy1',
        atkBuffTurns: 1,
        atkBuffValue: 15
      }
    };

    const state = { combatLog: [] };
    tickStatusEffects(unit, state);

    expect(unit.statuses.armorBreakTurns).toBe(0);
    expect(unit.statuses.armorBreakValue).toBe(0);
    expect(unit.statuses.tauntTurns).toBe(0);
    expect(unit.statuses.tauntTargetId).toBe(null);
    expect(unit.statuses.atkBuffTurns).toBe(0);
    expect(unit.statuses.atkBuffValue).toBe(0);
  });

  it('should handle multiple DoT effects simultaneously', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        burnTurns: 2,
        burnDamage: 10,
        poisonTurns: 3,
        poisonDamage: 5,
        bleedTurns: 1,
        bleedDamage: 8
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    expect(result.triggeredEffects.length).toBe(3);
    expect(result.triggeredEffects.find(e => e.type === 'burn')).toBeDefined();
    expect(result.triggeredEffects.find(e => e.type === 'poison')).toBeDefined();
    expect(result.triggeredEffects.find(e => e.type === 'bleed')).toBeDefined();
  });

  it('should not trigger DoT when duration is 0', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        burnTurns: 0,
        burnDamage: 10,
        poisonTurns: 0,
        poisonDamage: 5
      }
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    expect(result.triggeredEffects.length).toBe(0);
  });

  it('should handle unit with no statuses gracefully', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {}
    };

    const state = { combatLog: [] };
    const result = tickStatusEffects(unit, state);

    expect(result.success).toBe(true);
    expect(result.triggeredEffects.length).toBe(0);
    expect(result.controlStatus).toBe(null);
  });
});

// ============================================================================
// Property 26: Combat Event Logging
// ============================================================================
describe('Property 26: Combat Event Logging', () => {
  it('should log status application events', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {}
    };

    const state = { combatLog: [] };
    const effect = { type: 'freeze', duration: 2 };

    applyStatusEffect(unit, effect, state);

    expect(state.combatLog.length).toBe(1);
    expect(state.combatLog[0].type).toBe('STATUS_APPLIED');
    expect(state.combatLog[0].unitName).toBe('Test Unit');
    expect(state.combatLog[0].uid).toBe('unit1');
    expect(state.combatLog[0].effectType).toBe('freeze');
    expect(state.combatLog[0].duration).toBe(2);
  });

  it('should log status tick events with triggered effects', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        burnTurns: 2,
        burnDamage: 10,
        freeze: 1
      }
    };

    const state = { combatLog: [] };
    tickStatusEffects(unit, state);

    expect(state.combatLog.length).toBe(1);
    expect(state.combatLog[0].type).toBe('STATUS_TICK');
    expect(state.combatLog[0].unitName).toBe('Test Unit');
    expect(state.combatLog[0].uid).toBe('unit1');
    expect(state.combatLog[0].triggeredEffects).toBeDefined();
    expect(state.combatLog[0].controlStatus).toBe('freeze');
  });

  it('should log combat end events with winner and reason', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: true, isDead: false }
      ],
      enemyUnits: [
        { uid: 'e1', alive: false, isDead: true }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    checkCombatEnd(state);

    expect(state.combatLog.length).toBe(1);
    expect(state.combatLog[0].type).toBe('COMBAT_END');
    expect(state.combatLog[0].winner).toBe('player');
    expect(state.combatLog[0].reason).toBeDefined();
    expect(state.combatLog[0].playerUnitsRemaining).toBe(1);
    expect(state.combatLog[0].enemyUnitsRemaining).toBe(0);
  });

  it('should log unit death events', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 50,
      shield: 0,
      alive: true,
      isDead: false,
      side: 'LEFT'
    };

    const state = {
      combatLog: [],
      turnOrder: [unit]
    };

    applyDamage(unit, 50, state);

    expect(state.combatLog.length).toBe(1);
    expect(state.combatLog[0].type).toBe('UNIT_DEATH');
    expect(state.combatLog[0].unitName).toBe('Test Unit');
    expect(state.combatLog[0].uid).toBe('unit1');
    expect(state.combatLog[0].side).toBe('LEFT');
  });

  it('should accumulate multiple events in combat log', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {}
    };

    const state = { combatLog: [] };

    // Apply multiple status effects
    applyStatusEffect(unit, { type: 'freeze', duration: 2 }, state);
    applyStatusEffect(unit, { type: 'burn', duration: 3, value: 10 }, state);
    applyStatusEffect(unit, { type: 'poison', duration: 2, value: 5 }, state);

    expect(state.combatLog.length).toBe(3);
    expect(state.combatLog[0].type).toBe('STATUS_APPLIED');
    expect(state.combatLog[1].type).toBe('STATUS_APPLIED');
    expect(state.combatLog[2].type).toBe('STATUS_APPLIED');
  });

  it('should log all status types correctly', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {}
    };

    const state = { combatLog: [] };

    const statusTypes = [
      { type: 'freeze', duration: 2 },
      { type: 'stun', duration: 1 },
      { type: 'sleep', duration: 2 },
      { type: 'silence', duration: 3 },
      { type: 'burn', duration: 2, value: 10 },
      { type: 'poison', duration: 2, value: 5 },
      { type: 'armorBreak', duration: 2, value: 20 },
      { type: 'atkBuff', duration: 3, value: 15 },
      { type: 'taunt', duration: 2, targetId: 'enemy1' }
    ];

    statusTypes.forEach(effect => {
      applyStatusEffect(unit, effect, state);
    });

    expect(state.combatLog.length).toBe(statusTypes.length);
    statusTypes.forEach((effect, index) => {
      expect(state.combatLog[index].effectType).toBe(effect.type);
    });
  });

  it('should not log when combat continues', () => {
    const state = {
      playerUnits: [
        { uid: 'p1', alive: true, isDead: false }
      ],
      enemyUnits: [
        { uid: 'e1', alive: true, isDead: false }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    checkCombatEnd(state);

    // Should not log anything when combat continues
    expect(state.combatLog.length).toBe(0);
  });

  it('should preserve existing log entries when adding new ones', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {}
    };

    const state = {
      combatLog: [
        { type: 'EXISTING_EVENT', data: 'test' }
      ]
    };

    applyStatusEffect(unit, { type: 'freeze', duration: 2 }, state);

    expect(state.combatLog.length).toBe(2);
    expect(state.combatLog[0].type).toBe('EXISTING_EVENT');
    expect(state.combatLog[1].type).toBe('STATUS_APPLIED');
  });
});

// ============================================================================
// Integration Tests: Status Effects + Combat End
// ============================================================================
describe('Integration: Status Effects and Combat End', () => {
  it('should handle unit death from DoT triggering combat end', () => {
    const playerUnit = {
      uid: 'p1',
      name: 'Player Unit',
      hp: 5,
      shield: 0,
      alive: true,
      isDead: false,
      side: 'LEFT',
      statuses: {
        burnTurns: 1,
        burnDamage: 10
      }
    };

    const enemyUnit = {
      uid: 'e1',
      name: 'Enemy Unit',
      hp: 100,
      alive: true,
      isDead: false,
      side: 'RIGHT',
      statuses: {}
    };

    const state = {
      playerUnits: [playerUnit],
      enemyUnits: [enemyUnit],
      combatLog: [],
      turnOrder: [playerUnit, enemyUnit],
      isFinished: false,
      winner: null
    };

    // Tick status effects (burn will trigger)
    const tickResult = tickStatusEffects(playerUnit, state);
    expect(tickResult.triggeredEffects.length).toBe(1);
    expect(tickResult.triggeredEffects[0].damage).toBe(10);

    // Apply the burn damage
    applyDamage(playerUnit, 10, state);
    expect(playerUnit.isDead).toBe(true);

    // Check combat end
    const endResult = checkCombatEnd(state);
    expect(endResult.isFinished).toBe(true);
    expect(endResult.winner).toBe('enemy');
  });

  it('should handle multiple status effects expiring simultaneously', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {
        freeze: 1,
        burnTurns: 1,
        burnDamage: 5,
        atkBuffTurns: 1,
        atkBuffValue: 10,
        armorBreakTurns: 1,
        armorBreakValue: 15
      }
    };

    const state = { combatLog: [] };
    tickStatusEffects(unit, state);

    // All should be decremented to 0
    expect(unit.statuses.freeze).toBe(0);
    expect(unit.statuses.burnTurns).toBe(0);
    expect(unit.statuses.atkBuffTurns).toBe(0);
    expect(unit.statuses.armorBreakTurns).toBe(0);

    // Values should be cleaned up
    expect(unit.statuses.atkBuffValue).toBe(0);
    expect(unit.statuses.armorBreakValue).toBe(0);
  });

  it('should log complete combat sequence', () => {
    const unit = {
      uid: 'unit1',
      name: 'Test Unit',
      hp: 100,
      alive: true,
      isDead: false,
      statuses: {}
    };

    const state = {
      playerUnits: [unit],
      enemyUnits: [
        { uid: 'e1', alive: false, isDead: true }
      ],
      combatLog: [],
      isFinished: false,
      winner: null
    };

    // Apply status
    applyStatusEffect(unit, { type: 'burn', duration: 2, value: 10 }, state);

    // Tick status
    tickStatusEffects(unit, state);

    // Check combat end
    checkCombatEnd(state);

    // Should have 3 log entries
    expect(state.combatLog.length).toBe(3);
    expect(state.combatLog[0].type).toBe('STATUS_APPLIED');
    expect(state.combatLog[1].type).toBe('STATUS_TICK');
    expect(state.combatLog[2].type).toBe('COMBAT_END');
  });
});
