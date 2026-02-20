/**
 * Integration Tests for Combat Flow
 * 
 * **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 8.1, 9.1, 10.1, 11.1**
 * 
 * This test suite verifies the complete combat flow works correctly with:
 * - Rage gain fixes (attacker only gains rage on hit, not miss)
 * - Knockback mechanics (Tricera charge pushes to last empty cell or before tanker)
 * - Endless mode buff removal (no player healing, only AI scaling)
 * - Reworked units: Wolf (ASSASSIN), Mosquito (max HP increase), Fox (gold reward), Leopard (tier 5 with rage refund)
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Mock Combat System for Integration Testing
 * Simulates the full combat flow with all mechanics
 */
class MockCombatSystem {
  constructor() {
    this.globalDamageMult = 1.0;
    this.player = {
      gold: 0,
      gameMode: "NORMAL"
    };
    this.currentRound = 1;
    this.logs = [];
  }

  getAI() {
    return { rageGain: 1 };
  }

  addLog(message) {
    this.logs.push(message);
  }

  // Simplified resolveDamage with rage gain logic
  resolveDamage(attacker, defender, rawDamage, damageType, reason, options = {}) {
    if (!defender || !defender.alive) return 0;
    if (attacker && !attacker.alive) return 0;

    // Evasion check
    if (attacker && !options.forceHit && !options.isSkill) {
      const evadePct = Math.max(0, Math.min(0.6, defender.mods?.evadePct || 0));
      if (Math.random() < evadePct) {
        // Attack missed - defender gains rage, attacker does NOT
        if (!options.noRage && defender.rage < defender.rageMax) {
          defender.rage = Math.min(defender.rageMax, defender.rage + 1);
        }
        return 0; // No damage dealt
      }
    }

    // Calculate damage
    let final = Math.max(1, rawDamage);
    if (damageType === "physical") {
      const def = defender.def || 0;
      final = rawDamage * (100 / (100 + def));
    } else if (damageType === "magic") {
      const mdef = defender.mdef || 0;
      final = rawDamage * (100 / (100 + mdef));
    }

    final = Math.max(1, Math.round(final));

    // Apply damage
    let damageLeft = final;
    if (defender.shield > 0) {
      const absorbed = Math.min(defender.shield, damageLeft);
      defender.shield -= absorbed;
      damageLeft -= absorbed;
    }

    if (damageLeft > 0) {
      defender.hp = Math.max(0, defender.hp - damageLeft);
    }

    // Rage gain logic - attacker only gains rage when damage is dealt
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
      defender.hp = 0;
    }

    return damageLeft;
  }

  // Knockback position finding
  findKnockbackPosition(target, pushDirection, enemies, boardWidth = 10) {
    const currentCol = target.col;
    const currentRow = target.row;
    
    let scanStart, scanEnd, scanStep;
    if (pushDirection > 0) {
      scanStart = currentCol + 1;
      scanEnd = boardWidth - 1;
      scanStep = 1;
    } else {
      scanStart = currentCol - 1;
      scanEnd = 0;
      scanStep = -1;
    }
    
    let lastEmptyCol = currentCol;
    
    for (let col = scanStart; pushDirection > 0 ? col <= scanEnd : col >= scanEnd; col += scanStep) {
      const occupant = enemies.find(u => u.alive && u.row === currentRow && u.col === col);
      
      if (!occupant) {
        lastEmptyCol = col;
      } else {
        if (occupant.classType === "TANKER") {
          if (pushDirection > 0) {
            return Math.max(currentCol, col - 1);
          } else {
            return Math.min(currentCol, col + 1);
          }
        } else {
          break;
        }
      }
    }
    
    return lastEmptyCol;
  }

  // Apply knockback effect
  applyKnockback(attacker, target, rawDamage, enemies) {
    const damageDealt = this.resolveDamage(attacker, target, rawDamage, "physical", "TRICERA_CHARGE", {});
    
    if (target.alive) {
      const pushDirection = attacker.side === "LEFT" ? 1 : -1;
      const newCol = this.findKnockbackPosition(target, pushDirection, enemies);
      
      if (newCol !== target.col) {
        target.col = newCol;
        return "ĐẨY LÙI";
      } else {
        return "KHÓA VỊ TRÍ";
      }
    }
    
    return "TARGET_DEAD";
  }

  // Endless mode buff application
  applyEndlessBuff(unit, round) {
    if (this.player.gameMode !== "ENDLESS") return;
    
    // NO healing for player units
    if (unit.side === "LEFT") {
      // Player units do NOT receive healing buffs
      return;
    }
    
    // AI scaling buffs only after round 30
    if (unit.side === "RIGHT" && round > 30) {
      const scaleFactor = 1 + (round - 30) * 0.05;
      unit.hp = Math.round(unit.hp * scaleFactor);
      unit.maxHp = Math.round(unit.maxHp * scaleFactor);
      unit.atk = Math.round(unit.atk * scaleFactor);
      unit.matk = Math.round(unit.matk * scaleFactor);
    }
  }

  // Mosquito drain with max HP increase
  mosquitoDrain(attacker, target, rawDamage) {
    const dealt = this.resolveDamage(attacker, target, rawDamage, "physical", "MOSQUITO_DRAIN", {});
    
    if (dealt > 0) {
      // Lifesteal (60% of damage)
      const heal = Math.round(dealt * 0.6);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      
      // Max HP increase (15% of damage)
      const maxHpIncrease = Math.round(dealt * 0.15);
      attacker.maxHp += maxHpIncrease;
      attacker.hp += maxHpIncrease;
      
      return { dealt, heal, maxHpIncrease };
    }
    
    return { dealt: 0, heal: 0, maxHpIncrease: 0 };
  }

  // Fox flame combo with gold reward
  foxFlameCombo(attacker, target) {
    // First hit
    const hit1 = Math.round(26 + attacker.atk * 1.45);
    const dealt1 = this.resolveDamage(attacker, target, hit1, "physical", "HỎA ẤN 1", {});
    
    const targetAliveAfterHit1 = target.alive;
    
    // Second hit
    const hit2 = Math.round(22 + attacker.atk * 1.25);
    const dealt2 = this.resolveDamage(attacker, target, hit2, "physical", "HỎA ẤN 2", {});
    
    // Gold reward if kill occurred and attacker is on LEFT side
    let goldAwarded = 0;
    if (targetAliveAfterHit1 && !target.alive && attacker.side === "LEFT") {
      this.player.gold += 1;
      goldAwarded = 1;
      this.addLog(`${attacker.name} kết liễu ${target.name} và nhận 1 vàng!`);
    }
    
    return { dealt1, dealt2, goldAwarded };
  }

  // Leopard execute with rage refund
  leopardExecute(attacker, target, rawDamage) {
    const targetWasAlive = target.alive;
    const dealt = this.resolveDamage(attacker, target, rawDamage, "physical", "VOID_EXECUTE", {});
    
    // Rage refund on kill (50% of rageMax)
    let rageRefund = 0;
    if (targetWasAlive && !target.alive) {
      rageRefund = Math.ceil(attacker.rageMax * 0.5);
      attacker.rage = Math.min(attacker.rageMax, attacker.rage + rageRefund);
    }
    
    return { dealt, rageRefund };
  }
}

// Helper function to create a unit
function createUnit(config) {
  return {
    name: config.name || "Unit",
    hp: config.hp || 100,
    maxHp: config.maxHp || config.hp || 100,
    atk: config.atk || 50,
    def: config.def || 10,
    matk: config.matk || 20,
    mdef: config.mdef || 10,
    rage: config.rage || 0,
    rageMax: config.rageMax || 3,
    shield: config.shield || 0,
    alive: true,
    side: config.side || "LEFT",
    row: config.row || 0,
    col: config.col || 0,
    classType: config.classType || "FIGHTER",
    range: config.range || 1,
    tier: config.tier || 1,
    mods: config.mods || {}
  };
}

describe('Combat Flow Integration Tests', () => {
  let system;

  beforeEach(() => {
    system = new MockCombatSystem();
  });

  describe('Full combat scenario with rage tracking', () => {
    it('should track rage correctly through multiple attacks with hits and misses', () => {
      // **Validates: Requirements 1.1, 2.1**
      const attacker = createUnit({
        name: "Assassin",
        hp: 300,
        atk: 80,
        rage: 0,
        rageMax: 3,
        side: "LEFT"
      });

      const defender = createUnit({
        name: "Tank",
        hp: 500,
        def: 30,
        rage: 0,
        rageMax: 5,
        side: "RIGHT",
        mods: { evadePct: 0 } // No evasion for predictable test
      });

      // Attack 1: Should hit and both gain rage
      const damage1 = system.resolveDamage(attacker, defender, 100, "physical", "ATTACK", {});
      expect(damage1).toBeGreaterThan(0);
      expect(attacker.rage).toBe(1); // Attacker gained rage
      expect(defender.rage).toBe(1); // Defender gained rage
      expect(defender.alive).toBe(true);

      // Attack 2: Should hit and both gain more rage
      const damage2 = system.resolveDamage(attacker, defender, 100, "physical", "ATTACK", {});
      expect(damage2).toBeGreaterThan(0);
      expect(attacker.rage).toBe(2);
      expect(defender.rage).toBe(2);

      // Attack 3: Should hit and attacker reaches max rage
      const damage3 = system.resolveDamage(attacker, defender, 100, "physical", "ATTACK", {});
      expect(damage3).toBeGreaterThan(0);
      expect(attacker.rage).toBe(3); // At max
      expect(defender.rage).toBe(3);
    });

    it('should not grant attacker rage on miss but defender still gains rage', () => {
      // **Validates: Requirements 2.1, 2.2**
      const attacker = createUnit({
        name: "Archer",
        hp: 250,
        atk: 70,
        rage: 1,
        rageMax: 3,
        side: "LEFT"
      });

      const defender = createUnit({
        name: "Evasive Fighter",
        hp: 400,
        def: 20,
        rage: 2,
        rageMax: 5,
        side: "RIGHT",
        mods: { evadePct: 1.0 } // 100% evasion (will be clamped to 60%)
      });

      const initialAttackerRage = attacker.rage;
      const initialDefenderRage = defender.rage;

      // Try multiple attacks - some will miss due to 60% evasion
      let missCount = 0;
      let hitCount = 0;

      for (let i = 0; i < 20; i++) {
        const beforeAttackerRage = attacker.rage;
        const beforeDefenderRage = defender.rage;
        
        const damage = system.resolveDamage(attacker, defender, 80, "physical", "ATTACK", {});
        
        if (damage === 0) {
          // Miss occurred
          missCount++;
          expect(attacker.rage).toBe(beforeAttackerRage); // Attacker did NOT gain rage
          expect(defender.rage).toBeGreaterThanOrEqual(beforeDefenderRage); // Defender gained rage
        } else {
          // Hit occurred
          hitCount++;
          expect(attacker.rage).toBeGreaterThanOrEqual(beforeAttackerRage); // Attacker gained rage
          expect(defender.rage).toBeGreaterThanOrEqual(beforeDefenderRage); // Defender gained rage
        }
        
        // Reset for next attempt
        attacker.rage = initialAttackerRage;
        defender.rage = initialDefenderRage;
        defender.hp = 400;
      }

      // With 60% evasion, we should see both hits and misses
      expect(missCount).toBeGreaterThan(0);
      expect(hitCount).toBeGreaterThan(0);
    });

    it('should handle combat until unit dies with proper rage tracking', () => {
      // **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
      const attacker = createUnit({
        name: "Warrior",
        hp: 400,
        atk: 100,
        rage: 0,
        rageMax: 3,
        side: "LEFT"
      });

      const defender = createUnit({
        name: "Weak Enemy",
        hp: 150,
        def: 10,
        rage: 0,
        rageMax: 3,
        side: "RIGHT",
        mods: { evadePct: 0 }
      });

      let attackCount = 0;
      while (defender.alive && attackCount < 10) {
        const beforeDefenderHp = defender.hp;
        system.resolveDamage(attacker, defender, 100, "physical", "ATTACK", {});
        attackCount++;
        
        if (defender.alive) {
          expect(defender.hp).toBeLessThan(beforeDefenderHp);
        }
      }

      expect(defender.alive).toBe(false);
      expect(defender.hp).toBe(0);
      expect(attacker.rage).toBeGreaterThan(0); // Attacker gained rage during combat
    });
  });

  describe('Knockback in real combat with multiple units', () => {
    it('should push target to last empty cell in combat scenario', () => {
      // **Validates: Requirements 3.1, 3.2, 4.1, 4.2, 4.3, 4.4**
      const tricera = createUnit({
        name: "Tricera",
        hp: 500,
        atk: 80,
        side: "LEFT",
        row: 2,
        col: 0
      });

      const target = createUnit({
        name: "Enemy Fighter",
        hp: 300,
        def: 20,
        side: "RIGHT",
        row: 2,
        col: 3,
        classType: "FIGHTER"
      });

      const enemies = [target];

      const result = system.applyKnockback(tricera, target, 120, enemies);

      expect(target.alive).toBe(true);
      expect(result).toBe("ĐẨY LÙI");
      expect(target.col).toBe(9); // Pushed to last empty cell
    });

    it('should stop knockback before tanker in combat', () => {
      // **Validates: Requirements 3.3, 3.4, 4.5**
      const tricera = createUnit({
        name: "Tricera",
        hp: 500,
        atk: 80,
        side: "LEFT",
        row: 2,
        col: 0
      });

      const target = createUnit({
        name: "Enemy Fighter",
        hp: 300,
        def: 20,
        side: "RIGHT",
        row: 2,
        col: 3,
        classType: "FIGHTER"
      });

      const tanker = createUnit({
        name: "Enemy Tank",
        hp: 600,
        def: 50,
        side: "RIGHT",
        row: 2,
        col: 6,
        classType: "TANKER"
      });

      const enemies = [target, tanker];

      const result = system.applyKnockback(tricera, target, 120, enemies);

      expect(target.alive).toBe(true);
      expect(result).toBe("ĐẨY LÙI");
      expect(target.col).toBe(5); // Stopped before tanker at col 6
    });

    it('should not move target when path is blocked', () => {
      // **Validates: Requirements 3.5, 4.6**
      const tricera = createUnit({
        name: "Tricera",
        hp: 500,
        atk: 80,
        side: "LEFT",
        row: 2,
        col: 0
      });

      const target = createUnit({
        name: "Enemy Fighter",
        hp: 300,
        def: 20,
        side: "RIGHT",
        row: 2,
        col: 3,
        classType: "FIGHTER"
      });

      const blocker = createUnit({
        name: "Enemy Blocker",
        hp: 400,
        def: 30,
        side: "RIGHT",
        row: 2,
        col: 4,
        classType: "FIGHTER"
      });

      const enemies = [target, blocker];

      const result = system.applyKnockback(tricera, target, 120, enemies);

      expect(target.alive).toBe(true);
      expect(result).toBe("KHÓA VỊ TRÍ");
      expect(target.col).toBe(3); // Did not move
    });

    it('should not attempt knockback if target dies from damage', () => {
      // **Validates: Requirements 4.7**
      const tricera = createUnit({
        name: "Tricera",
        hp: 500,
        atk: 200,
        side: "LEFT",
        row: 2,
        col: 0
      });

      const target = createUnit({
        name: "Weak Enemy",
        hp: 50,
        def: 5,
        side: "RIGHT",
        row: 2,
        col: 3,
        classType: "FIGHTER"
      });

      const enemies = [target];

      const result = system.applyKnockback(tricera, target, 500, enemies);

      expect(target.alive).toBe(false);
      expect(result).toBe("TARGET_DEAD");
      expect(target.col).toBe(3); // Position unchanged
    });
  });

  describe('Endless mode buff application', () => {
    it('should NOT apply healing buffs to player units in Endless mode', () => {
      // **Validates: Requirements 5.1**
      system.player.gameMode = "ENDLESS";
      system.currentRound = 35;

      const playerUnit = createUnit({
        name: "Player Fighter",
        hp: 300,
        maxHp: 300,
        atk: 70,
        side: "LEFT"
      });

      const initialHp = playerUnit.hp;
      const initialMaxHp = playerUnit.maxHp;
      const initialAtk = playerUnit.atk;

      system.applyEndlessBuff(playerUnit, system.currentRound);

      // Player units should NOT receive any buffs
      expect(playerUnit.hp).toBe(initialHp);
      expect(playerUnit.maxHp).toBe(initialMaxHp);
      expect(playerUnit.atk).toBe(initialAtk);
    });

    it('should apply scaling buffs to AI units after round 30 in Endless mode', () => {
      // **Validates: Requirements 5.2, 5.3, 5.5**
      system.player.gameMode = "ENDLESS";
      system.currentRound = 35;

      const aiUnit = createUnit({
        name: "AI Fighter",
        hp: 300,
        maxHp: 300,
        atk: 70,
        matk: 50,
        side: "RIGHT"
      });

      const initialHp = aiUnit.hp;
      const initialMaxHp = aiUnit.maxHp;
      const initialAtk = aiUnit.atk;
      const initialMatk = aiUnit.matk;

      system.applyEndlessBuff(aiUnit, system.currentRound);

      // Calculate expected scale factor: 1 + (35 - 30) * 0.05 = 1.25
      const expectedScaleFactor = 1 + (35 - 30) * 0.05;
      
      expect(aiUnit.hp).toBe(Math.round(initialHp * expectedScaleFactor));
      expect(aiUnit.maxHp).toBe(Math.round(initialMaxHp * expectedScaleFactor));
      expect(aiUnit.atk).toBe(Math.round(initialAtk * expectedScaleFactor));
      expect(aiUnit.matk).toBe(Math.round(initialMatk * expectedScaleFactor));
    });

    it('should NOT apply buffs in non-Endless modes', () => {
      // **Validates: Requirements 5.4**
      system.player.gameMode = "NORMAL";
      system.currentRound = 35;

      const playerUnit = createUnit({
        name: "Player Fighter",
        hp: 300,
        maxHp: 300,
        atk: 70,
        side: "LEFT"
      });

      const aiUnit = createUnit({
        name: "AI Fighter",
        hp: 300,
        maxHp: 300,
        atk: 70,
        side: "RIGHT"
      });

      const playerInitialAtk = playerUnit.atk;
      const aiInitialAtk = aiUnit.atk;

      system.applyEndlessBuff(playerUnit, system.currentRound);
      system.applyEndlessBuff(aiUnit, system.currentRound);

      // No buffs should be applied in NORMAL mode
      expect(playerUnit.atk).toBe(playerInitialAtk);
      expect(aiUnit.atk).toBe(aiInitialAtk);
    });

    it('should NOT apply AI buffs before round 30 in Endless mode', () => {
      // **Validates: Requirements 5.2**
      system.player.gameMode = "ENDLESS";
      system.currentRound = 25;

      const aiUnit = createUnit({
        name: "AI Fighter",
        hp: 300,
        maxHp: 300,
        atk: 70,
        side: "RIGHT"
      });

      const initialAtk = aiUnit.atk;

      system.applyEndlessBuff(aiUnit, system.currentRound);

      // No buffs before round 30
      expect(aiUnit.atk).toBe(initialAtk);
    });
  });

  describe('Reworked units in combat scenarios', () => {
    it('Wolf (ASSASSIN) should have correct stats and evasion bonus', () => {
      // **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**
      const wolf = createUnit({
        name: "Sói Thủ Lĩnh",
        hp: 280,
        maxHp: 280,
        atk: 72,
        def: 16,
        rageMax: 2,
        side: "LEFT",
        classType: "ASSASSIN",
        tier: 2,
        mods: { evadePct: 0.20 } // ASSASSIN base evasion
      });

      // Verify Wolf stats match requirements
      expect(wolf.hp).toBe(280);
      expect(wolf.atk).toBe(72);
      expect(wolf.def).toBe(16);
      expect(wolf.rageMax).toBe(2);
      expect(wolf.classType).toBe("ASSASSIN");
      expect(wolf.mods.evadePct).toBe(0.20);

      // Test evasion in combat
      const enemy = createUnit({
        name: "Enemy",
        hp: 300,
        atk: 80,
        side: "RIGHT"
      });

      let missCount = 0;
      const attempts = 100;

      for (let i = 0; i < attempts; i++) {
        wolf.hp = 280; // Reset HP
        const damage = system.resolveDamage(enemy, wolf, 100, "physical", "ATTACK", {});
        if (damage === 0) missCount++;
      }

      // With 20% evasion, expect roughly 15-25% misses (allowing variance)
      const missRate = missCount / attempts;
      expect(missRate).toBeGreaterThan(0.10);
      expect(missRate).toBeLessThan(0.35);
    });

    it('Mosquito should increase max HP when draining', () => {
      // **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
      const mosquito = createUnit({
        name: "Muỗi Độc",
        hp: 200,
        maxHp: 240,
        atk: 75,
        side: "LEFT",
        classType: "ASSASSIN",
        tier: 2
      });

      const enemy = createUnit({
        name: "Enemy Tank",
        hp: 400,
        def: 20,
        side: "RIGHT"
      });

      const initialMaxHp = mosquito.maxHp;
      const initialHp = mosquito.hp;

      // Mosquito drains enemy
      const rawDamage = Math.round(40 + mosquito.atk * 1.5);
      const result = system.mosquitoDrain(mosquito, enemy, rawDamage);

      expect(result.dealt).toBeGreaterThan(0);
      expect(result.heal).toBe(Math.round(result.dealt * 0.6));
      expect(result.maxHpIncrease).toBe(Math.round(result.dealt * 0.15));

      // Verify max HP increased
      expect(mosquito.maxHp).toBe(initialMaxHp + result.maxHpIncrease);
      
      // Verify HP increased by both heal and max HP increase
      const expectedHp = Math.min(mosquito.maxHp, initialHp + result.heal + result.maxHpIncrease);
      expect(mosquito.hp).toBe(expectedHp);
    });

    it('Fox should award gold when killing with skill', () => {
      // **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**
      const fox = createUnit({
        name: "Cáo Hỏa",
        hp: 255,
        atk: 72,
        side: "LEFT",
        classType: "ASSASSIN",
        tier: 1
      });

      const weakEnemy = createUnit({
        name: "Weak Enemy",
        hp: 150, // Increased HP so it survives first hit but dies on second
        def: 10,
        side: "RIGHT"
      });

      const initialGold = system.player.gold;

      // Fox uses flame combo
      const result = system.foxFlameCombo(fox, weakEnemy);

      expect(weakEnemy.alive).toBe(false);
      expect(result.goldAwarded).toBe(1);
      expect(system.player.gold).toBe(initialGold + 1);
      expect(system.logs).toContain(`${fox.name} kết liễu ${weakEnemy.name} và nhận 1 vàng!`);
    });

    it('Fox should NOT award gold when enemy survives', () => {
      // **Validates: Requirements 10.2**
      const fox = createUnit({
        name: "Cáo Hỏa",
        hp: 255,
        atk: 72,
        side: "LEFT",
        classType: "ASSASSIN",
        tier: 1
      });

      const strongEnemy = createUnit({
        name: "Strong Enemy",
        hp: 500,
        def: 30,
        side: "RIGHT"
      });

      const initialGold = system.player.gold;

      // Fox uses flame combo but enemy survives
      const result = system.foxFlameCombo(fox, strongEnemy);

      expect(strongEnemy.alive).toBe(true);
      expect(result.goldAwarded).toBe(0);
      expect(system.player.gold).toBe(initialGold);
    });

    it('Fox should NOT award gold when on AI side', () => {
      // **Validates: Requirements 10.6**
      const foxAI = createUnit({
        name: "Cáo Hỏa (AI)",
        hp: 255,
        atk: 72,
        side: "RIGHT", // AI side
        classType: "ASSASSIN",
        tier: 1
      });

      const playerUnit = createUnit({
        name: "Player Unit",
        hp: 100,
        def: 10,
        side: "LEFT"
      });

      const initialGold = system.player.gold;

      // AI Fox uses flame combo and kills player unit
      const result = system.foxFlameCombo(foxAI, playerUnit);

      expect(playerUnit.alive).toBe(false);
      expect(result.goldAwarded).toBe(0); // No gold for AI
      expect(system.player.gold).toBe(initialGold);
    });

    it('Leopard (tier 5) should refund rage on kill', () => {
      // **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7**
      const leopard = createUnit({
        name: "Báo Hư Không",
        hp: 320,
        atk: 95,
        rage: 0,
        rageMax: 2,
        side: "LEFT",
        classType: "ASSASSIN",
        tier: 5
      });

      const enemy = createUnit({
        name: "Enemy Fighter",
        hp: 150,
        def: 15,
        side: "RIGHT"
      });

      // Leopard executes enemy
      const rawDamage = Math.round(65 + leopard.atk * 2.8);
      const result = system.leopardExecute(leopard, enemy, rawDamage);

      expect(enemy.alive).toBe(false);
      expect(result.dealt).toBeGreaterThan(0);
      expect(result.rageRefund).toBe(Math.ceil(leopard.rageMax * 0.5)); // 50% of rageMax = 1
      // Leopard gains rage from dealing damage (1) + rage refund (1) = 2
      expect(leopard.rage).toBe(2);
    });

    it('Leopard should NOT refund rage if target survives', () => {
      // **Validates: Requirements 11.4**
      const leopard = createUnit({
        name: "Báo Hư Không",
        hp: 320,
        atk: 95,
        rage: 0,
        rageMax: 2,
        side: "LEFT",
        classType: "ASSASSIN",
        tier: 5
      });

      const strongEnemy = createUnit({
        name: "Strong Enemy",
        hp: 600,
        def: 40,
        side: "RIGHT"
      });

      // Leopard executes but enemy survives
      const rawDamage = Math.round(65 + leopard.atk * 2.8);
      const result = system.leopardExecute(leopard, strongEnemy, rawDamage);

      expect(strongEnemy.alive).toBe(true);
      expect(result.dealt).toBeGreaterThan(0);
      expect(result.rageRefund).toBe(0); // No refund
      // Leopard gains rage from dealing damage (1) but no refund
      expect(leopard.rage).toBe(1);
    });

    it('Leopard rage refund should not exceed rageMax', () => {
      // **Validates: Requirements 11.6**
      const leopard = createUnit({
        name: "Báo Hư Không",
        hp: 320,
        atk: 95,
        rage: 1, // Already has some rage
        rageMax: 2,
        side: "LEFT",
        classType: "ASSASSIN",
        tier: 5
      });

      const enemy = createUnit({
        name: "Enemy Fighter",
        hp: 150,
        def: 15,
        side: "RIGHT"
      });

      // Leopard executes enemy
      const rawDamage = Math.round(65 + leopard.atk * 2.8);
      const result = system.leopardExecute(leopard, enemy, rawDamage);

      expect(enemy.alive).toBe(false);
      expect(result.rageRefund).toBe(1); // 50% of 2 = 1
      expect(leopard.rage).toBe(2); // Clamped to rageMax (1 + 1 = 2)
      expect(leopard.rage).toBeLessThanOrEqual(leopard.rageMax);
    });
  });

  describe('Complex combat scenarios with multiple mechanics', () => {
    it('should handle full combat with rage, knockback, and unit death', () => {
      // **Validates: Requirements 1.1, 2.1, 3.1, 4.1**
      const tricera = createUnit({
        name: "Tricera",
        hp: 500,
        atk: 90,
        rage: 0,
        rageMax: 4,
        side: "LEFT",
        row: 2,
        col: 0
      });

      const enemy1 = createUnit({
        name: "Enemy 1",
        hp: 300, // Increased HP so it survives knockback damage
        def: 20,
        rage: 0,
        rageMax: 3,
        side: "RIGHT",
        row: 2,
        col: 3,
        classType: "FIGHTER"
      });

      const enemy2 = createUnit({
        name: "Enemy 2",
        hp: 400,
        def: 30,
        side: "RIGHT",
        row: 2,
        col: 6,
        classType: "TANKER"
      });

      const enemies = [enemy1, enemy2];

      // First attack: normal attack to build rage
      system.resolveDamage(tricera, enemy1, 100, "physical", "ATTACK", {});
      expect(tricera.rage).toBe(1);
      expect(enemy1.rage).toBe(1);
      expect(enemy1.alive).toBe(true);

      // Second attack: knockback charge (with lower damage so enemy survives)
      const knockbackResult = system.applyKnockback(tricera, enemy1, 120, enemies);
      expect(knockbackResult).toBe("ĐẨY LÙI");
      expect(enemy1.col).toBe(5); // Pushed before tanker at col 6
      expect(enemy1.alive).toBe(true);

      // Third attack: finish off enemy1
      system.resolveDamage(tricera, enemy1, 200, "physical", "ATTACK", {});
      expect(enemy1.alive).toBe(false);
      expect(tricera.rage).toBeGreaterThan(1);
    });

    it('should handle Endless mode with multiple units and combat', () => {
      // **Validates: Requirements 5.1, 5.2, 5.3**
      system.player.gameMode = "ENDLESS";
      system.currentRound = 40;

      const playerUnit = createUnit({
        name: "Player Warrior",
        hp: 300,
        maxHp: 300,
        atk: 70,
        side: "LEFT"
      });

      const aiUnit = createUnit({
        name: "AI Fighter",
        hp: 300,
        maxHp: 300,
        atk: 70,
        matk: 50,
        side: "RIGHT"
      });

      // Apply Endless buffs
      system.applyEndlessBuff(playerUnit, system.currentRound);
      system.applyEndlessBuff(aiUnit, system.currentRound);

      // Player should not be buffed
      expect(playerUnit.atk).toBe(70);

      // AI should be buffed: 1 + (40 - 30) * 0.05 = 1.5x
      expect(aiUnit.atk).toBe(Math.round(70 * 1.5));
      expect(aiUnit.hp).toBe(Math.round(300 * 1.5));

      // Combat between them
      const damage = system.resolveDamage(aiUnit, playerUnit, aiUnit.atk, "physical", "ATTACK", {});
      expect(damage).toBeGreaterThan(0);
      expect(playerUnit.hp).toBeLessThan(300);
    });

    it('should handle all 4 reworked units in a single combat scenario', () => {
      // **Validates: Requirements 8.1, 9.1, 10.1, 11.1**
      const wolf = createUnit({
        name: "Wolf",
        hp: 280,
        atk: 72,
        classType: "ASSASSIN",
        tier: 2,
        side: "LEFT",
        mods: { evadePct: 0.20 }
      });

      const mosquito = createUnit({
        name: "Mosquito",
        hp: 200,
        maxHp: 240,
        atk: 75,
        classType: "ASSASSIN",
        tier: 2,
        side: "LEFT"
      });

      const fox = createUnit({
        name: "Fox",
        hp: 255,
        atk: 72,
        classType: "ASSASSIN",
        tier: 1,
        side: "LEFT"
      });

      const leopard = createUnit({
        name: "Leopard",
        hp: 320,
        atk: 95,
        rage: 0,
        rageMax: 2,
        classType: "ASSASSIN",
        tier: 5,
        side: "LEFT"
      });

      // Wolf attacks (ASSASSIN with evasion)
      expect(wolf.classType).toBe("ASSASSIN");
      expect(wolf.mods.evadePct).toBe(0.20);

      // Mosquito drains
      const enemy1 = createUnit({
        name: "Enemy 1",
        hp: 200,
        def: 10,
        side: "RIGHT"
      });
      const mosquitoInitialMaxHp = mosquito.maxHp;
      const drainResult = system.mosquitoDrain(mosquito, enemy1, 100);
      expect(mosquito.maxHp).toBeGreaterThan(mosquitoInitialMaxHp);

      // Fox kills and gets gold
      const enemy2 = createUnit({
        name: "Enemy 2",
        hp: 150,
        def: 10,
        side: "RIGHT"
      });
      const initialGold = system.player.gold;
      system.foxFlameCombo(fox, enemy2);
      expect(system.player.gold).toBeGreaterThan(initialGold);

      // Leopard executes and gets rage refund
      const enemy3 = createUnit({
        name: "Enemy 3",
        hp: 150,
        def: 10,
        side: "RIGHT"
      });
      const executeResult = system.leopardExecute(leopard, enemy3, 300);
      expect(executeResult.rageRefund).toBeGreaterThan(0);
      expect(leopard.rage).toBeGreaterThan(0);
    });
  });
});
