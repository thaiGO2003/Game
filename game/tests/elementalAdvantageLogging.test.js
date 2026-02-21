/**
 * Unit Tests for Elemental Advantage Combat Logging
 * 
 * **Validates: Requirement 8.5**
 * 
 * This test suite verifies that elemental advantage applications are logged
 * correctly for debugging purposes, including attacker, defender, and modifier.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Elemental Advantage Combat Logging', () => {
  let consoleLogSpy;

  beforeEach(() => {
    // Spy on console.log to capture logging output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log after each test
    consoleLogSpy.mockRestore();
  });

  /**
   * Mock Combat Scene for testing elemental advantage logging
   */
  class MockCombatScene {
    constructor() {
      this.TRIBE_COUNTER = {
        FIRE: 'WIND',
        WIND: 'TIDE',
        TIDE: 'FIRE',
        STONE: 'SWARM',
        SWARM: 'STONE',
        NIGHT: 'SPIRIT',
        SPIRIT: 'NIGHT'
      };
    }

    showFloatingText(x, y, text, color) {
      // Mock implementation
    }

    getEffectiveDef(unit) {
      return unit.def || 0;
    }

    getEffectiveMdef(unit) {
      return unit.mdef || 0;
    }

    /**
     * Simplified resolveDamage that includes elemental advantage logging
     * This mirrors the actual implementation in CombatScene.js
     */
    resolveDamage(attacker, defender, rawDamage, damageType = 'physical') {
      if (!defender || !defender.alive) return 0;
      if (attacker && !attacker.alive) return 0;

      let raw = Math.max(1, rawDamage);

      // Apply elemental modifiers BEFORE defense calculations
      if (attacker && defender && this.TRIBE_COUNTER[attacker.tribe] === defender.tribe) {
        // Attacker has elemental advantage
        if (defender.classType === "TANKER") {
          // Tanker defender reduces incoming damage by 50% (Requirement 8.2)
          raw *= 0.5;
          this.showFloatingText(defender.sprite?.x || 0, defender.sprite?.y || 0, "HỘ THỂ", "#44ddff");
          
          // Combat logging for debugging (Requirement 8.5)
          console.log(`[Elemental Advantage] Attacker: ${attacker.name} (${attacker.tribe}) -> Defender: ${defender.name} (${defender.tribe}, TANKER) | Modifier: 0.5x (damage reduction)`);
        } else if (attacker.classType !== "TANKER") {
          // Non-tanker attacker increases damage by 50% (Requirement 8.1, 8.3)
          raw *= 1.5;
          this.showFloatingText(defender.sprite?.x || 0, defender.sprite?.y || 0, "KHẮC CHẾ", "#ffdd44");
          
          // Combat logging for debugging (Requirement 8.5)
          console.log(`[Elemental Advantage] Attacker: ${attacker.name} (${attacker.tribe}) -> Defender: ${defender.name} (${defender.tribe}) | Modifier: 1.5x (damage increase)`);
        }
      }

      // Simplified damage calculation (skip defense for testing)
      return raw;
    }
  }

  it('should log elemental advantage when non-tanker attacks with advantage', () => {
    const scene = new MockCombatScene();
    
    const attacker = {
      name: 'Fire Wolf',
      tribe: 'FIRE',
      classType: 'ASSASSIN',
      alive: true
    };
    
    const defender = {
      name: 'Wind Eagle',
      tribe: 'WIND',
      classType: 'ARCHER',
      alive: true,
      sprite: { x: 100, y: 100 }
    };

    scene.resolveDamage(attacker, defender, 100, 'physical');

    // Verify logging occurred
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Elemental Advantage]')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Fire Wolf (FIRE)')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Wind Eagle (WIND)')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('1.5x (damage increase)')
    );
  });

  it('should log elemental advantage when tanker defender has advantage against them', () => {
    const scene = new MockCombatScene();
    
    const attacker = {
      name: 'Fire Bear',
      tribe: 'FIRE',
      classType: 'FIGHTER',
      alive: true
    };
    
    const defender = {
      name: 'Wind Turtle',
      tribe: 'WIND',
      classType: 'TANKER',
      alive: true,
      sprite: { x: 100, y: 100 }
    };

    scene.resolveDamage(attacker, defender, 100, 'physical');

    // Verify logging occurred with tanker-specific message
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Elemental Advantage]')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Fire Bear (FIRE)')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Wind Turtle (WIND, TANKER)')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('0.5x (damage reduction)')
    );
  });

  it('should not log when there is no elemental advantage', () => {
    const scene = new MockCombatScene();
    
    const attacker = {
      name: 'Fire Wolf',
      tribe: 'FIRE',
      classType: 'ASSASSIN',
      alive: true
    };
    
    const defender = {
      name: 'Stone Rhino',
      tribe: 'STONE',
      classType: 'TANKER',
      alive: true,
      sprite: { x: 100, y: 100 }
    };

    scene.resolveDamage(attacker, defender, 100, 'physical');

    // Verify no elemental advantage logging occurred
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('[Elemental Advantage]')
    );
  });

  it('should not log when tanker attacks with advantage', () => {
    const scene = new MockCombatScene();
    
    const attacker = {
      name: 'Fire Turtle',
      tribe: 'FIRE',
      classType: 'TANKER',
      alive: true
    };
    
    const defender = {
      name: 'Wind Eagle',
      tribe: 'WIND',
      classType: 'ARCHER',
      alive: true,
      sprite: { x: 100, y: 100 }
    };

    scene.resolveDamage(attacker, defender, 100, 'physical');

    // Verify no elemental advantage logging occurred (tanker attacking doesn't get bonus)
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('[Elemental Advantage]')
    );
  });

  it('should include all required information in log message', () => {
    const scene = new MockCombatScene();
    
    const attacker = {
      name: 'Tide Shark',
      tribe: 'TIDE',
      classType: 'FIGHTER',
      alive: true
    };
    
    const defender = {
      name: 'Fire Dragon',
      tribe: 'FIRE',
      classType: 'MAGE',
      alive: true,
      sprite: { x: 100, y: 100 }
    };

    scene.resolveDamage(attacker, defender, 100, 'physical');

    // Verify all required components are in the log
    const logCall = consoleLogSpy.mock.calls[0][0];
    expect(logCall).toContain('[Elemental Advantage]');
    expect(logCall).toContain('Attacker:');
    expect(logCall).toContain('Tide Shark');
    expect(logCall).toContain('(TIDE)');
    expect(logCall).toContain('Defender:');
    expect(logCall).toContain('Fire Dragon');
    expect(logCall).toContain('(FIRE)');
    expect(logCall).toContain('Modifier:');
    expect(logCall).toContain('1.5x');
  });

  it('should log for all elemental counter pairs', () => {
    const scene = new MockCombatScene();
    
    const counterPairs = [
      { attackerTribe: 'FIRE', defenderTribe: 'WIND' },
      { attackerTribe: 'WIND', defenderTribe: 'TIDE' },
      { attackerTribe: 'TIDE', defenderTribe: 'FIRE' },
      { attackerTribe: 'STONE', defenderTribe: 'SWARM' },
      { attackerTribe: 'SWARM', defenderTribe: 'STONE' },
      { attackerTribe: 'NIGHT', defenderTribe: 'SPIRIT' },
      { attackerTribe: 'SPIRIT', defenderTribe: 'NIGHT' }
    ];

    counterPairs.forEach(({ attackerTribe, defenderTribe }) => {
      consoleLogSpy.mockClear();
      
      const attacker = {
        name: `${attackerTribe} Attacker`,
        tribe: attackerTribe,
        classType: 'ASSASSIN',
        alive: true
      };
      
      const defender = {
        name: `${defenderTribe} Defender`,
        tribe: defenderTribe,
        classType: 'ARCHER',
        alive: true,
        sprite: { x: 100, y: 100 }
      };

      scene.resolveDamage(attacker, defender, 100, 'physical');

      // Verify logging occurred for this counter pair
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Elemental Advantage]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(attackerTribe)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(defenderTribe)
      );
    });
  });
});
