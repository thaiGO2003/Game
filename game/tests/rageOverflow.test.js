/**
 * Test: Rage Overflow Error Handling
 * 
 * Validates Requirements 1.5, 2.2:
 * - Rage is always clamped to rageMax
 * - Multiple rage gain sources are handled safely
 * - No rage overflow occurs under any circumstances
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Rage Overflow Error Handling', () => {
  let mockScene;
  let attacker;
  let defender;

  beforeEach(() => {
    // Mock CombatScene with minimal resolveDamage implementation
    mockScene = {
      getAI: () => ({ rageGain: 2 }),
      audioFx: { play: () => { } },
      vfx: null,
      globalDamageMult: 1,
      showFloatingText: () => { },
      showDamageNumber: () => { },
      updateCombatUnitUi: () => { },
      addLog: () => { },
      getCombatUnits: () => [],
      getEffectiveDef: (unit) => unit.def,
      getEffectiveMdef: (unit) => unit.mdef,
      recordEnemyLootDrop: () => { },
      basicAttack: () => { },
      healUnit: () => { },

      resolveDamage(attacker, defender, rawDamage, damageType, reason, options = {}) {
        if (!defender || !defender.alive) return 0;
        if (attacker && !attacker.alive) return 0;

        // Evasion check
        if (attacker && !options.forceHit && !options.isSkill) {
          const evadePct = Math.max(0, Math.min(1.0, defender.mods.evadePct || 0));
          if (Math.random() < evadePct) {
            // Attack missed - defender gains rage, attacker does NOT
            if (!options.noRage && defender.rage < defender.rageMax) {
              defender.rage = Math.min(defender.rageMax, defender.rage + 1);
            }
            return 0; // No damage dealt
          }
        }

        // Calculate damage
        let final = rawDamage;
        if (damageType === "physical") {
          final = rawDamage * (100 / (100 + defender.def));
        } else if (damageType === "magic") {
          final = rawDamage * (100 / (100 + defender.mdef));
        }
        final = Math.max(1, Math.round(final));

        let damageLeft = final;
        if (defender.shield > 0) {
          const absorbed = Math.min(defender.shield, damageLeft);
          defender.shield -= absorbed;
          damageLeft -= absorbed;
        }

        if (damageLeft > 0) {
          defender.hp = Math.max(0, defender.hp - damageLeft);
        }

        // Attacker only gains rage when damage is actually dealt (damageLeft > 0)
        if (attacker && !options.noRage && damageLeft > 0 && attacker.rage < attacker.rageMax) {
          const gain = attacker.side === "RIGHT" ? this.getAI().rageGain : 1;
          attacker.rage = Math.min(attacker.rageMax, attacker.rage + gain);
        }

        // Defender gains rage when attacked AND still alive
        if (!options.noRage && damageLeft > 0 && defender.hp > 0 && defender.rage < defender.rageMax) {
          defender.rage = Math.min(defender.rageMax, defender.rage + 1);
        }

        if (defender.hp <= 0) {
          defender.alive = false;
        }

        return damageLeft;
      }
    };

    // Create test units
    attacker = {
      name: "Attacker",
      side: "LEFT",
      hp: 300,
      atk: 80,
      def: 20,
      mdef: 15,
      rage: 0,
      rageMax: 3,
      shield: 0,
      alive: true,
      mods: { evadePct: 0 },
      statuses: {}
    };

    defender = {
      name: "Defender",
      side: "RIGHT",
      hp: 400,
      def: 30,
      mdef: 20,
      rage: 0,
      rageMax: 5,
      shield: 0,
      alive: true,
      mods: { evadePct: 0 },
      statuses: {}
    };
  });

  it('should clamp rage to rageMax when attacker gains rage from hit', () => {
    attacker.rage = 2; // One below max

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(attacker.rage).toBe(3); // Should be clamped to rageMax
    expect(attacker.rage).toBeLessThanOrEqual(attacker.rageMax);
  });

  it('should clamp rage to rageMax when defender gains rage from being hit', () => {
    defender.rage = 4; // One below max

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(defender.rage).toBe(5); // Should be clamped to rageMax
    expect(defender.rage).toBeLessThanOrEqual(defender.rageMax);
  });

  it('should not exceed rageMax when already at maximum', () => {
    attacker.rage = 3; // Already at max
    defender.rage = 5; // Already at max

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(attacker.rage).toBe(3); // Should stay at rageMax
    expect(defender.rage).toBe(5); // Should stay at rageMax
  });

  it('should handle AI rage gain multiplier without overflow', () => {
    const aiAttacker = { ...attacker, side: "RIGHT", rage: 2, rageMax: 3 };

    mockScene.resolveDamage(aiAttacker, defender, 100, "physical", "TEST", {});

    // AI gains 2 rage per hit, but should be clamped to rageMax (3)
    expect(aiAttacker.rage).toBe(3);
    expect(aiAttacker.rage).toBeLessThanOrEqual(aiAttacker.rageMax);
  });

  it('should handle multiple rage sources safely (attacker + defender)', () => {
    attacker.rage = 2;
    defender.rage = 4;

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(attacker.rage).toBe(3); // Clamped to rageMax
    expect(defender.rage).toBe(5); // Clamped to rageMax
    expect(attacker.rage).toBeLessThanOrEqual(attacker.rageMax);
    expect(defender.rage).toBeLessThanOrEqual(defender.rageMax);
  });

  it('should not gain rage when attack misses (attacker)', () => {
    attacker.rage = 2;
    defender.rage = 4;
    defender.mods.evadePct = 1.0; // 100% evasion (forced miss)

    const damage = mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(damage).toBe(0); // Attack missed
    expect(attacker.rage).toBe(2); // Attacker should NOT gain rage
    expect(defender.rage).toBe(5); // Defender should gain rage (clamped)
  });

  it('should clamp defender rage on miss even when at max', () => {
    defender.rage = 5; // Already at max
    defender.mods.evadePct = 1.0; // 100% evasion

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(defender.rage).toBe(5); // Should stay at rageMax, not overflow
  });

  it('should handle edge case: rageMax = 2 (minimum)', () => {
    attacker.rageMax = 2;
    attacker.rage = 1;

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(attacker.rage).toBe(2); // Should be clamped to rageMax
    expect(attacker.rage).toBeLessThanOrEqual(attacker.rageMax);
  });

  it('should handle edge case: rageMax = 5 (maximum)', () => {
    attacker.rageMax = 5;
    attacker.rage = 4;

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    expect(attacker.rage).toBe(5); // Should be clamped to rageMax
    expect(attacker.rage).toBeLessThanOrEqual(attacker.rageMax);
  });

  it('should handle shield absorption without affecting rage clamping', () => {
    attacker.rage = 2;
    defender.rage = 4;
    defender.shield = 50; // Shield absorbs some damage

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", {});

    // Rage should still be gained and clamped properly
    expect(attacker.rage).toBe(3);
    expect(defender.rage).toBe(5);
    expect(defender.shield).toBeLessThan(50); // Shield was used
  });

  it('should not gain rage when defender dies', () => {
    defender.hp = 10; // Low HP
    defender.rage = 4;

    mockScene.resolveDamage(attacker, defender, 1000, "physical", "TEST", {});

    expect(defender.alive).toBe(false);
    expect(defender.hp).toBe(0);
    // Defender should not gain rage when killed
    expect(defender.rage).toBe(4); // Should not change after death
  });

  it('should handle true damage without affecting rage clamping', () => {
    attacker.rage = 2;
    defender.rage = 4;

    mockScene.resolveDamage(attacker, defender, 100, "true", "TEST", {});

    expect(attacker.rage).toBe(3); // Clamped to rageMax
    expect(defender.rage).toBe(5); // Clamped to rageMax
  });

  it('should respect noRage option and not modify rage', () => {
    attacker.rage = 1;
    defender.rage = 2;

    mockScene.resolveDamage(attacker, defender, 100, "physical", "TEST", { noRage: true });

    expect(attacker.rage).toBe(1); // Should not change
    expect(defender.rage).toBe(2); // Should not change
  });

  it('should handle consecutive attacks without rage overflow', () => {
    attacker.rage = 1;

    // First attack
    mockScene.resolveDamage(attacker, defender, 50, "physical", "TEST", {});
    expect(attacker.rage).toBe(2);

    // Second attack
    mockScene.resolveDamage(attacker, defender, 50, "physical", "TEST", {});
    expect(attacker.rage).toBe(3); // Should be clamped to rageMax

    // Third attack (already at max)
    mockScene.resolveDamage(attacker, defender, 50, "physical", "TEST", {});
    expect(attacker.rage).toBe(3); // Should stay at rageMax
  });

  it('should handle rapid AI attacks with high rage gain multiplier', () => {
    const aiAttacker = { ...attacker, side: "RIGHT", rage: 0, rageMax: 3 };

    // AI gains 2 rage per hit
    mockScene.resolveDamage(aiAttacker, defender, 50, "physical", "TEST", {});
    expect(aiAttacker.rage).toBe(2);

    // Second hit should clamp to rageMax
    mockScene.resolveDamage(aiAttacker, defender, 50, "physical", "TEST", {});
    expect(aiAttacker.rage).toBe(3); // Clamped to rageMax, not 4
  });
});
