import { describe, it, expect } from 'vitest';
import { getEffectiveEvasion } from '../src/core/gameUtils.js';

describe('Evasion Buff/Debuff System', () => {
  it('should return base evasion when no buffs/debuffs', () => {
    const unit = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBe(0.15);
  });

  it('should apply evasion buff when active', () => {
    const unit = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.10,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBe(0.25); // 0.15 + 0.10
  });

  it('should apply evasion debuff when active', () => {
    const unit = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 2,
        evadeDebuffValue: 0.10
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBeCloseTo(0.05, 5); // 0.15 - 0.10
  });

  it('should apply both buff and debuff when both active', () => {
    const unit = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.20,
        evadeDebuffTurns: 2,
        evadeDebuffValue: 0.10
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBeCloseTo(0.25, 5); // 0.15 + 0.20 - 0.10
  });

  it('should clamp evasion to 0% minimum', () => {
    const unit = {
      mods: { evadePct: 0.05 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 3,
        evadeDebuffValue: 0.20
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBe(0); // Clamped to 0
  });

  it('should clamp evasion to 75% maximum', () => {
    const unit = {
      mods: { evadePct: 0.60 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.30,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBe(0.75); // Clamped to 0.75
  });

  it('should ignore buff when turns is 0', () => {
    const unit = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0.10,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBe(0.15); // Buff not applied
  });

  it('should ignore debuff when turns is 0', () => {
    const unit = {
      mods: { evadePct: 0.15 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0.10
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBe(0.15); // Debuff not applied
  });

  it('should handle missing mods gracefully', () => {
    const unit = {
      mods: {},
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };

    const evasion = getEffectiveEvasion(unit);
    expect(evasion).toBe(0.05); // Default base evasion when classType is undefined
  });
});
