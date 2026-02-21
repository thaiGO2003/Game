import { describe, it, expect } from 'vitest';
import { executeAction, executeSkill } from '../src/systems/CombatSystem.js';

/**
 * Unit tests for CombatSystem action execution
 * Task 3.6.3: Extract skill and attack execution
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.11
 * 
 * **Property 19: Skill Execution at Full Rage**
 * **Property 20: Basic Attack Below Full Rage**
 * **Validates: Requirements 4.4, 4.5**
 */

describe('CombatSystem - Action Execution', () => {
  describe('executeAction', () => {
    describe('Requirement 4.4: Skill execution when rage >= 100', () => {
      it('should execute skill when rage is exactly 100', () => {
        const actor = {
          name: 'Warrior',
          rage: 100,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('SKILL');
        expect(result.useSkill).toBe(true);
        expect(result.resetRage).toBe(true);
        expect(result.rageChange).toBe(-100);
      });

      it('should execute skill when rage is above 100', () => {
        const actor = {
          name: 'Warrior',
          rage: 120,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('SKILL');
        expect(result.useSkill).toBe(true);
      });

      it('should reset rage to 0 for non-MAGE classes', () => {
        const actor = {
          name: 'Warrior',
          classType: 'FIGHTER',
          rage: 100,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.resetRage).toBe(true);
        expect(result.rageChange).toBe(-100);
      });

      it('should NOT reset rage for MAGE class', () => {
        const actor = {
          name: 'Mage',
          classType: 'MAGE',
          rage: 100,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.resetRage).toBe(false);
        expect(result.rageChange).toBe(0);
      });

      it('should not execute skill when silenced even with full rage', () => {
        const actor = {
          name: 'Warrior',
          rage: 100,
          rageMax: 100,
          alive: true,
          statuses: { silence: 2 }
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('BASIC_ATTACK');
        expect(result.useSkill).toBe(false);
      });
    });

    describe('Requirement 4.5: Basic attack when rage < 100', () => {
      it('should execute basic attack when rage is 0', () => {
        const actor = {
          name: 'Warrior',
          rage: 0,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('BASIC_ATTACK');
        expect(result.useSkill).toBe(false);
        expect(result.rageChange).toBe(20);
      });

      it('should execute basic attack when rage is 50', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('BASIC_ATTACK');
        expect(result.useSkill).toBe(false);
      });

      it('should execute basic attack when rage is 99', () => {
        const actor = {
          name: 'Warrior',
          rage: 99,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('BASIC_ATTACK');
        expect(result.useSkill).toBe(false);
        expect(result.rageChange).toBe(20);
      });

      it('should increase rage by 20 on basic attack', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.rageChange).toBe(20);
      });
    });

    describe('Disarm status handling', () => {
      it('should return DISARMED action when unit is disarmed', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          rageMax: 100,
          alive: true,
          statuses: { disarmTurns: 2 }
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('DISARMED');
        expect(result.useSkill).toBe(false);
        expect(result.rageChange).toBe(0);
      });

      it('should allow action when disarmTurns is 0', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          rageMax: 100,
          alive: true,
          statuses: { disarmTurns: 0 }
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.actionType).toBe('BASIC_ATTACK');
      });
    });

    describe('Edge cases and error handling', () => {
      it('should handle null actor', () => {
        const state = { combatLog: [] };

        const result = executeAction(state, null);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid actor or state');
      });

      it('should handle null state', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          alive: true
        };

        const result = executeAction(null, actor);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid actor or state');
      });

      it('should handle dead actor', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          alive: false,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Actor is dead');
      });

      it('should handle actor with isDead flag', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          isDead: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Actor is dead');
      });

      it('should handle missing rage property (default to 0)', () => {
        const actor = {
          name: 'Warrior',
          rageMax: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('BASIC_ATTACK');
      });

      it('should handle missing rageMax property (default to 100)', () => {
        const actor = {
          name: 'Warrior',
          rage: 100,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('SKILL');
      });

      it('should handle missing statuses property', () => {
        const actor = {
          name: 'Warrior',
          rage: 50,
          rageMax: 100,
          alive: true
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('BASIC_ATTACK');
      });
    });

    describe('Custom rage max values', () => {
      it('should respect custom rageMax of 80', () => {
        const actor = {
          name: 'Warrior',
          rage: 80,
          rageMax: 80,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('SKILL');
      });

      it('should use basic attack when rage is below custom rageMax', () => {
        const actor = {
          name: 'Warrior',
          rage: 79,
          rageMax: 80,
          alive: true,
          statuses: {}
        };
        const state = { combatLog: [] };

        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('BASIC_ATTACK');
      });
    });
  });

  describe('executeSkill', () => {
    describe('Basic skill execution', () => {
      it('should execute skill with valid parameters', () => {
        const caster = {
          name: 'Mage',
          skillId: 'fireball',
          statuses: {}
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst',
          damageType: 'magic',
          actionPattern: 'RANGED_STATIC'
        };
        const targets = [
          { uid: 't1', alive: true }
        ];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(true);
        expect(result.skillName).toBe('Fireball');
        expect(result.skillEffect).toBe('single_burst');
        expect(result.caster).toBe(caster);
        expect(result.targets).toHaveLength(1);
        expect(result.damageType).toBe('magic');
        expect(result.actionPattern).toBe('RANGED_STATIC');
      });

      it('should handle multiple targets', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Chain Lightning',
          effect: 'aoe_chain',
          damageType: 'magic'
        };
        const targets = [
          { uid: 't1', alive: true },
          { uid: 't2', alive: true },
          { uid: 't3', alive: true }
        ];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(true);
        expect(result.targets).toHaveLength(3);
      });

      it('should filter out dead targets', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const targets = [
          { uid: 't1', alive: true },
          { uid: 't2', alive: false },
          { uid: 't3', isDead: true }
        ];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(true);
        expect(result.targets).toHaveLength(1);
        expect(result.targets[0].uid).toBe('t1');
      });

      it('should convert single target to array', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const target = { uid: 't1', alive: true };
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, target, state);

        expect(result.success).toBe(true);
        expect(result.targets).toHaveLength(1);
        expect(result.targets[0].uid).toBe('t1');
      });
    });

    describe('Silence status handling', () => {
      it('should fail when caster is silenced', () => {
        const caster = {
          name: 'Mage',
          statuses: { silence: 2 }
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Caster is silenced');
      });

      it('should succeed when silence is 0', () => {
        const caster = {
          name: 'Mage',
          statuses: { silence: 0 }
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should handle null caster', () => {
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(null, skill, targets, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid parameters');
      });

      it('should handle null skill', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, null, targets, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid parameters');
      });

      it('should handle null targets', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, null, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid parameters');
      });

      it('should handle null state', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];

        const result = executeSkill(caster, skill, targets, null);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid parameters');
      });

      it('should handle invalid skill definition (missing name)', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid skill definition');
      });

      it('should handle invalid skill definition (missing effect)', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Fireball'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid skill definition');
      });

      it('should handle empty targets array', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const targets = [];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No valid targets');
      });

      it('should handle all dead targets', () => {
        const caster = {
          name: 'Mage',
          statuses: {}
        };
        const skill = {
          name: 'Fireball',
          effect: 'single_burst'
        };
        const targets = [
          { uid: 't1', alive: false },
          { uid: 't2', isDead: true }
        ];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No valid targets');
      });
    });

    describe('Default values', () => {
      it('should default damageType to physical', () => {
        const caster = {
          name: 'Warrior',
          statuses: {}
        };
        const skill = {
          name: 'Slash',
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(true);
        expect(result.damageType).toBe('physical');
      });

      it('should default actionPattern to MELEE_FRONT', () => {
        const caster = {
          name: 'Warrior',
          statuses: {}
        };
        const skill = {
          name: 'Slash',
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(true);
        expect(result.actionPattern).toBe('MELEE_FRONT');
      });

      it('should handle missing statuses property on caster', () => {
        const caster = {
          name: 'Warrior'
        };
        const skill = {
          name: 'Slash',
          effect: 'single_burst'
        };
        const targets = [{ uid: 't1', alive: true }];
        const state = { combatLog: [] };

        const result = executeSkill(caster, skill, targets, state);

        expect(result.success).toBe(true);
      });
    });
  });
});
