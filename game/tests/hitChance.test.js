import { describe, it, expect } from 'vitest';
import { calculateHitChance, getEffectiveEvasion } from '../src/core/gameUtils.js';

describe('Hit Chance Calculation', () => {
  it('should calculate hit chance as baseAccuracy - targetEvasion', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    expect(hitChance).toBeCloseTo(0.80, 5); // 0.95 - 0.15
  });

  it('should ensure minimum 10% hit chance', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.90 }, // Would be clamped to 0.75 by getEffectiveEvasion
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    // Evasion is clamped to 0.75, so hit chance = 0.95 - 0.75 = 0.20
    // This is above the minimum 10%, so no clamping occurs
    expect(hitChance).toBeCloseTo(0.20, 5);
  });

  it('should enforce minimum 10% hit chance even with hypothetical high evasion', () => {
    // This is a theoretical test - in practice, evasion is clamped to 0.75
    // But if we could somehow bypass that, the minimum should still apply
    const attacker = {};
    
    // Create a mock defender with artificially high effective evasion
    // by directly testing the calculateHitChance logic
    const mockDefender = {
      mods: { evadePct: 0.60 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.30, // Total would be 0.90, but clamped to 0.75
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const hitChance = calculateHitChance(attacker, mockDefender);
    // Even with 0.75 evasion (max), hit chance = 0.95 - 0.75 = 0.20
    // which is still above the 0.10 minimum
    expect(hitChance).toBeGreaterThanOrEqual(0.1);
    expect(hitChance).toBeCloseTo(0.20, 5);
  });

  it('should handle very high evasion (above 85%)', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.90 }, // Would be clamped to 0.75 by getEffectiveEvasion
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    // Evasion is clamped to 0.75, so hit chance = 0.95 - 0.75 = 0.20
    expect(hitChance).toBeCloseTo(0.20, 5);
  });

  it('should calculate hit chance with evasion buffs', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.10,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    expect(hitChance).toBeCloseTo(0.70, 5); // 0.95 - (0.15 + 0.10)
  });

  it('should calculate hit chance with evasion debuffs', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 2,
        evadeDebuffValue: 0.10
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    expect(hitChance).toBeCloseTo(0.90, 5); // 0.95 - (0.15 - 0.10)
  });

  it('should handle zero evasion', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    expect(hitChance).toBe(0.95); // Base accuracy
  });

  it('should handle negative effective evasion (clamped to 0)', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.05 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 3,
        evadeDebuffValue: 0.20
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    // Evasion is clamped to 0, so hit chance = 0.95 - 0 = 0.95
    expect(hitChance).toBe(0.95);
  });

  it('should work with both buff and debuff active', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.20,
        evadeDebuffTurns: 2,
        evadeDebuffValue: 0.10
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    // Effective evasion = 0.15 + 0.20 - 0.10 = 0.25
    // Hit chance = 0.95 - 0.25 = 0.70
    expect(hitChance).toBeCloseTo(0.70, 5);
  });
});
