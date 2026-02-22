/**
 * Bug Condition Exploration Test - Non-MAGE Rage Reset After Skills
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 2.15, 2.16, 2.17, 2.18**
 * 
 * Tests rage reset behavior for different roles after using skills.
 * 
 * **EXPECTED OUTCOME**: Tests PASS (rage reset already implemented in stepCombat line 3665)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { executeAction } from '../src/systems/CombatSystem.js';

/**
 * Helper: create a combat unit with given properties for CombatSystem testing
 */
function createUnit(overrides = {}) {
    return {
        name: overrides.name || 'TestUnit',
        alive: true,
        isDead: false,
        rage: overrides.rage ?? 100,
        rageMax: overrides.rageMax ?? 5,
        classType: overrides.classType || 'FIGHTER',
        statuses: {
            silence: 0,
            disarmTurns: 0,
            ...(overrides.statuses || {})
        },
        ...overrides
    };
}

describe('Bug Condition Exploration - Non-MAGE Rage Reset After Skills', () => {
    /**
     * Property 1: Non-MAGE roles should have resetRage=true when using skills
     * 
     * **Validates: Requirements 4.1, 2.15**
     * 
     * WARRIOR, ASSASSIN, TANKER, and SUPPORT should reset rage after skill use.
     */
    it('Property 1: Non-MAGE roles should reset rage after skill use', () => {
        const nonMageRoles = ['FIGHTER', 'ASSASSIN', 'TANKER', 'SUPPORT'];

        fc.assert(
            fc.property(
                fc.constantFrom(...nonMageRoles),
                fc.integer({ min: 5, max: 10 }),  // rageMax
                (role, rageMax) => {
                    const actor = createUnit({
                        classType: role,
                        rage: rageMax,
                        rageMax
                    });

                    const state = { turnOrder: [], combatLog: [] };
                    const result = executeAction(state, actor);

                    expect(result.success).toBe(true);
                    expect(result.actionType).toBe('SKILL');
                    expect(result.resetRage).toBe(true);

                    // Simulate what stepCombat does (line 3665)
                    if (result.resetRage) {
                        actor.rage = 0;
                    }

                    expect(actor.rage).toBe(0);
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property 2: MAGE role should NOT have resetRage when using skills
     * 
     * **Validates: Requirements 4.2, 2.16**
     * 
     * MAGE keeps rage after skill use.
     */
    it('Property 2: MAGE role should keep rage after skill use', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 5, max: 10 }),  // rageMax
                (rageMax) => {
                    const actor = createUnit({
                        classType: 'MAGE',
                        rage: rageMax,
                        rageMax
                    });

                    const state = { turnOrder: [], combatLog: [] };
                    const result = executeAction(state, actor);

                    expect(result.success).toBe(true);
                    expect(result.actionType).toBe('SKILL');
                    expect(result.resetRage).toBe(false);

                    // Simulate what stepCombat does - MAGE rage is NOT reset
                    if (result.resetRage) {
                        actor.rage = 0;
                    }

                    // MAGE should still have full rage
                    expect(actor.rage).toBe(rageMax);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 3: Silenced units cannot use skills regardless of rage
     * 
     * **Validates: Requirement 3.14**
     */
    it('Property 3: Silenced units fall back to basic attack', () => {
        const roles = ['FIGHTER', 'ASSASSIN', 'TANKER', 'SUPPORT', 'MAGE'];

        fc.assert(
            fc.property(
                fc.constantFrom(...roles),
                fc.integer({ min: 5, max: 10 }),
                (role, rageMax) => {
                    const actor = createUnit({
                        classType: role,
                        rage: rageMax,
                        rageMax,
                        statuses: { silence: 2, disarmTurns: 0 }
                    });

                    const state = { turnOrder: [], combatLog: [] };
                    const result = executeAction(state, actor);

                    expect(result.success).toBe(true);
                    // Silenced units should do basic attack, not skill
                    expect(result.actionType).toBe('BASIC_ATTACK');
                    expect(result.useSkill).toBe(false);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 4: Units with rage < rageMax should use basic attack
     * 
     * **Validates: Requirement 4.5**
     */
    it('Property 4: Units with insufficient rage use basic attack', () => {
        const roles = ['FIGHTER', 'ASSASSIN', 'TANKER', 'SUPPORT', 'MAGE'];

        fc.assert(
            fc.property(
                fc.constantFrom(...roles),
                fc.integer({ min: 5, max: 10 }),
                fc.integer({ min: 0, max: 4 }),
                (role, rageMax, rage) => {
                    // Ensure rage < rageMax
                    if (rage >= rageMax) return true;

                    const actor = createUnit({
                        classType: role,
                        rage,
                        rageMax
                    });

                    const state = { turnOrder: [], combatLog: [] };
                    const result = executeAction(state, actor);

                    expect(result.success).toBe(true);
                    expect(result.actionType).toBe('BASIC_ATTACK');
                    expect(result.useSkill).toBe(false);
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});
