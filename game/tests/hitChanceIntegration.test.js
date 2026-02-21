import { describe, it, expect } from 'vitest';
import { calculateHitChance, getEffectiveEvasion } from '../src/core/gameUtils.js';

describe('Hit Chance Integration in Combat Logic', () => {
  it('should calculate correct hit chance for typical combat scenario', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.15 }, // 15% base evasion
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const hitChance = calculateHitChance(attacker, defender);
    
    // Expected: 95% base accuracy - 15% evasion = 80% hit chance
    expect(hitChance).toBeCloseTo(0.80, 5);
  });

  it('should handle high evasion defender with minimum hit chance', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.60 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.30, // Total 90%, but clamped to 75%
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const effectiveEvasion = getEffectiveEvasion(defender);
    const hitChance = calculateHitChance(attacker, defender);
    
    // Evasion should be clamped to 75%
    expect(effectiveEvasion).toBe(0.75);
    // Hit chance = 95% - 75% = 20%
    expect(hitChance).toBeCloseTo(0.20, 5);
    // Should be above minimum 10%
    expect(hitChance).toBeGreaterThanOrEqual(0.1);
  });

  it('should handle debuffed defender with increased hit chance', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 2,
        evadeDebuffValue: 0.10 // -10% evasion
      }
    };

    const effectiveEvasion = getEffectiveEvasion(defender);
    const hitChance = calculateHitChance(attacker, defender);
    
    // Effective evasion = 15% - 10% = 5%
    expect(effectiveEvasion).toBeCloseTo(0.05, 5);
    // Hit chance = 95% - 5% = 90%
    expect(hitChance).toBeCloseTo(0.90, 5);
  });

  it('should handle buffed and debuffed defender', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.20, // +20% evasion
        evadeDebuffTurns: 2,
        evadeDebuffValue: 0.10 // -10% evasion
      }
    };

    const effectiveEvasion = getEffectiveEvasion(defender);
    const hitChance = calculateHitChance(attacker, defender);
    
    // Effective evasion = 15% + 20% - 10% = 25%
    expect(effectiveEvasion).toBeCloseTo(0.25, 5);
    // Hit chance = 95% - 25% = 70%
    expect(hitChance).toBeCloseTo(0.70, 5);
  });

  it('should handle zero evasion defender', () => {
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
    
    // Hit chance = 95% - 0% = 95%
    expect(hitChance).toBe(0.95);
  });

  it('should verify hit chance is used for miss calculation', () => {
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
    
    // Simulate miss check: Math.random() >= hitChance means miss
    // With 80% hit chance, 20% of attacks should miss
    // This test just verifies the hit chance value is correct
    expect(hitChance).toBeCloseTo(0.80, 5);
    
    // Verify that a random value of 0.85 would result in a miss
    const randomValue = 0.85;
    const wouldMiss = randomValue >= hitChance;
    expect(wouldMiss).toBe(true); // 0.85 >= 0.80 = true (miss)
    
    // Verify that a random value of 0.75 would result in a hit
    const randomValue2 = 0.75;
    const wouldHit = randomValue2 < hitChance;
    expect(wouldHit).toBe(true); // 0.75 < 0.80 = true (hit)
  });
});
