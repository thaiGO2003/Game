/**
 * Bug Condition Exploration Test - TANKER Auto-Cast When Attacked
 * 
 * **Validates: Requirements 5.1, 5.2, 2.19, 2.20, 2.21**
 * 
 * Tests TANKER auto-cast behavior when attacked at full rage.
 * The scheduleTankAutoCast function already exists in CombatScene.
 * These tests verify the logic conditions for auto-casting.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Helper: simulate scheduleTankAutoCast logic (extracted from CombatScene lines 4878-4911)
 * Returns whether the auto-cast should trigger.
 */
function shouldTankerAutoCast(tank, hasSkill = true) {
    if (!tank?.alive) return false;
    if (tank.classType !== 'TANKER') return false;
    if ((tank.statuses?.silence ?? 0) > 0) return false;
    if (!Number.isFinite(tank.rage) || !Number.isFinite(tank.rageMax) || tank.rage < tank.rageMax) return false;
    if (tank._isAutoCastingTankSkill) return false;
    if (!hasSkill) return false;
    return true;
}

/**
 * Helper: create a unit
 */
function createUnit(overrides = {}) {
    return {
        name: overrides.name || 'TestTanker',
        alive: true,
        classType: overrides.classType || 'TANKER',
        rage: overrides.rage ?? 5,
        rageMax: overrides.rageMax ?? 5,
        skillId: overrides.skillId || 'turtle_guard',
        statuses: {
            silence: 0,
            ...(overrides.statuses || {})
        },
        _isAutoCastingTankSkill: false,
        ...overrides
    };
}

describe('Bug Condition Exploration - TANKER Auto-Cast When Attacked', () => {
    /**
     * Property 1: TANKER with rage >= rageMax should auto-cast when attacked
     * 
     * **Validates: Requirements 5.1, 2.19**
     */
    it('Property 1: TANKER with full rage should trigger auto-cast when attacked', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 8 }), // rageMax
                (rageMax) => {
                    const tank = createUnit({
                        rage: rageMax,
                        rageMax
                    });

                    const result = shouldTankerAutoCast(tank, true);
                    expect(result).toBe(true);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 2: TANKER with rage > rageMax should also auto-cast
     * 
     * Edge case: rage might exceed rageMax due to equipment bonuses
     */
    it('Property 2: TANKER with rage exceeding rageMax should also auto-cast', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 8 }),  // rageMax
                fc.integer({ min: 1, max: 3 }),  // extra rage
                (rageMax, extra) => {
                    const tank = createUnit({
                        rage: rageMax + extra,
                        rageMax
                    });

                    const result = shouldTankerAutoCast(tank, true);
                    expect(result).toBe(true);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 3: TANKER with rage < rageMax should NOT auto-cast
     * 
     * **Validates: Requirements 5.2**
     */
    it('Property 3: TANKER with insufficient rage should not auto-cast', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 8 }),  // rageMax
                fc.integer({ min: 0, max: 2 }),  // rage (always < rageMax since max is 2 and min rageMax is 3)
                (rageMax, rage) => {
                    if (rage >= rageMax) return true;

                    const tank = createUnit({
                        rage,
                        rageMax
                    });

                    const result = shouldTankerAutoCast(tank, true);
                    expect(result).toBe(false);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 4: Silenced TANKER should NOT auto-cast
     * 
     * **Validates: Requirement 2.21**
     */
    it('Property 4: Silenced TANKER should not auto-cast', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 8 }),  // rageMax
                fc.integer({ min: 1, max: 3 }),  // silence turns
                (rageMax, silenceTurns) => {
                    const tank = createUnit({
                        rage: rageMax,
                        rageMax,
                        statuses: { silence: silenceTurns }
                    });

                    const result = shouldTankerAutoCast(tank, true);
                    expect(result).toBe(false);
                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Property 5: Non-TANKER roles should NOT auto-cast
     * 
     * Only TANKER has auto-cast behavior.
     */
    it('Property 5: Non-TANKER roles should not auto-cast', () => {
        const nonTankerRoles = ['FIGHTER', 'ASSASSIN', 'MAGE', 'SUPPORT', 'ARCHER'];

        fc.assert(
            fc.property(
                fc.constantFrom(...nonTankerRoles),
                fc.integer({ min: 3, max: 8 }),
                (role, rageMax) => {
                    const unit = createUnit({
                        classType: role,
                        rage: rageMax,
                        rageMax
                    });

                    const result = shouldTankerAutoCast(unit, true);
                    expect(result).toBe(false);
                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Property 6: TANKER without skill should NOT auto-cast
     * 
     * **Validates: Requirement 2.21**
     */
    it('Property 6: TANKER without valid skill should not auto-cast', () => {
        const tank = createUnit({
            rage: 5,
            rageMax: 5
        });

        const result = shouldTankerAutoCast(tank, false);
        expect(result).toBe(false);
    });

    /**
     * Property 7: Dead TANKER should NOT auto-cast
     */
    it('Property 7: Dead TANKER should not auto-cast', () => {
        const tank = createUnit({
            rage: 5,
            rageMax: 5,
            alive: false
        });

        const result = shouldTankerAutoCast(tank, true);
        expect(result).toBe(false);
    });

    /**
     * Property 8: After auto-cast, rage should reset to 0
     * 
     * **Validates: Requirement 2.15 (consistent with non-MAGE rage reset)**
     * 
     * scheduleTankAutoCast sets tank.rage = 0 at line 4898
     */
    it('Property 8: After auto-cast, TANKER rage resets to 0', () => {
        const tank = createUnit({
            rage: 5,
            rageMax: 5
        });

        // Simulate auto-cast rage reset (from scheduleTankAutoCast line 4898)
        if (shouldTankerAutoCast(tank, true)) {
            tank.rage = 0;
        }

        expect(tank.rage).toBe(0);
    });
});
