/**
 * Preservation Property Tests - Skill Mechanics
 * 
 * **Validates: Requirements 3.10, 3.11, 3.12, 3.13, 3.14**
 * 
 * Tests that preserve existing skill-related behavior:
 * - MAGE skills don't reset rage
 * - Silence prevents skill usage
 * - executeAction correctly determines action type
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { executeAction } from '../src/systems/CombatSystem.js';

/**
 * Helper: create a combat unit for CombatSystem testing
 */
function createUnit(overrides = {}) {
    return {
        name: overrides.name || 'TestUnit',
        alive: true,
        isDead: false,
        rage: overrides.rage ?? 0,
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

describe('Preservation - Skill Mechanics', () => {
    /**
     * Property 1: MAGE skills don't reset rage
     * 
     * **Validates: Requirement 3.10**
     */
    it('Property 1: MAGE skill action has resetRage=false', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 5, max: 10 }),
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
                    expect(result.rageChange).toBe(0);
                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Property 2: Silenced units cannot use skills
     * 
     * **Validates: Requirement 3.14**
     */
    it('Property 2: Silenced units use basic attack instead of skill', () => {
        const allRoles = ['FIGHTER', 'ASSASSIN', 'TANKER', 'SUPPORT', 'MAGE', 'ARCHER'];

        fc.assert(
            fc.property(
                fc.constantFrom(...allRoles),
                fc.integer({ min: 5, max: 10 }),
                fc.integer({ min: 1, max: 5 }),
                (role, rageMax, silenceTurns) => {
                    const actor = createUnit({
                        classType: role,
                        rage: rageMax,
                        rageMax,
                        statuses: { silence: silenceTurns, disarmTurns: 0 }
                    });

                    const state = { turnOrder: [], combatLog: [] };
                    const result = executeAction(state, actor);

                    expect(result.success).toBe(true);
                    expect(result.actionType).toBe('BASIC_ATTACK');
                    expect(result.useSkill).toBe(false);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 3: Non-MAGE roles have resetRage=true when using skills
     * 
     * **Validates: Preservation of rage reset for non-MAGE roles**
     */
    it('Property 3: Non-MAGE roles have resetRage=true for skill actions', () => {
        const nonMageRoles = ['FIGHTER', 'ASSASSIN', 'TANKER', 'SUPPORT', 'ARCHER'];

        fc.assert(
            fc.property(
                fc.constantFrom(...nonMageRoles),
                fc.integer({ min: 5, max: 10 }),
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
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 4: Basic attack gains rage
     * 
     * **Validates: Requirement 3.1 (units gain rage when attacking)**
     */
    it('Property 4: Basic attack provides positive rage gain', () => {
        const allRoles = ['FIGHTER', 'ASSASSIN', 'TANKER', 'SUPPORT', 'MAGE', 'ARCHER'];

        fc.assert(
            fc.property(
                fc.constantFrom(...allRoles),
                fc.integer({ min: 5, max: 10 }),
                (role, rageMax) => {
                    const actor = createUnit({
                        classType: role,
                        rage: 0, // Not enough rage for skill
                        rageMax
                    });

                    const state = { turnOrder: [], combatLog: [] };
                    const result = executeAction(state, actor);

                    expect(result.success).toBe(true);
                    expect(result.actionType).toBe('BASIC_ATTACK');
                    expect(result.rageChange).toBeGreaterThan(0);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 5: Dead units cannot act
     */
    it('Property 5: Dead units cannot execute actions', () => {
        const actor = createUnit({
            alive: false,
            isDead: true,
            rage: 5,
            rageMax: 5
        });

        const state = { turnOrder: [], combatLog: [] };
        const result = executeAction(state, actor);

        expect(result.success).toBe(false);
    });

    /**
     * Property 6: Disarmed units cannot basic attack
     */
    it('Property 6: Disarmed units with insufficient rage are disarmed', () => {
        const actor = createUnit({
            rage: 0,
            rageMax: 5,
            statuses: { silence: 0, disarmTurns: 2 }
        });

        const state = { turnOrder: [], combatLog: [] };
        const result = executeAction(state, actor);

        expect(result.success).toBe(true);
        expect(result.actionType).toBe('DISARMED');
    });
});
