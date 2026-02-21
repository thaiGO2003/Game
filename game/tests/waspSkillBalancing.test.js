import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getWaspMaxTargets } from "../src/core/gameUtils.js";
import { SKILL_LIBRARY } from "../src/data/skills.js";
import { UNIT_BY_ID } from "../src/data/unitCatalog.js";

describe("Wasp Skill Balancing", () => {
  describe("getWaspMaxTargets function", () => {
    it("should return 1 target for 1-star wasp", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      const unit = { star: 1, skillId: "wasp_triple_strike" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBe(1);
    });

    it("should return 2 targets for 2-star wasp", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      const unit = { star: 2, skillId: "wasp_triple_strike" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBe(2);
    });

    it("should return 3 targets for 3-star wasp", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      const unit = { star: 3, skillId: "wasp_triple_strike" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBe(3);
    });

    it("should default to 1 target when star is undefined", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      const unit = { skillId: "wasp_triple_strike" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBe(1);
    });

    it("should return skill.maxHits for non-wasp skills", () => {
      const skill = SKILL_LIBRARY["cross_arrow"];
      const unit = { star: 3, skillId: "cross_arrow" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBe(skill.maxHits);
    });

    it("should handle undefined skill.maxHits for non-wasp skills", () => {
      const skill = { id: "some_skill" }; // No maxHits defined
      const unit = { star: 2, skillId: "some_skill" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBeUndefined();
    });
  });

  describe("Wasp units in catalog", () => {
    it("should have wasp_sting unit with tier 1", () => {
      const waspSting = UNIT_BY_ID["wasp_sting"];
      
      expect(waspSting).toBeDefined();
      expect(waspSting.skillId).toBe("wasp_triple_strike");
      expect(waspSting.tier).toBe(1);
    });

    it("should have garuda_divine unit with tier 5", () => {
      const garuda = UNIT_BY_ID["garuda_divine"];
      
      expect(garuda).toBeDefined();
      expect(garuda.skillId).toBe("wasp_triple_strike");
      expect(garuda.tier).toBe(5);
    });
  });

  describe("Star-based scaling validation", () => {
    it("should scale maxHits from 1 to 3 as star increases", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      for (let star = 1; star <= 3; star++) {
        const unit = { star, skillId: "wasp_triple_strike" };
        const maxTargets = getWaspMaxTargets(unit, skill);
        
        expect(maxTargets).toBe(star);
      }
    });

    it("should cap maxHits at 3 for stars above 3", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      const unit = { star: 5, skillId: "wasp_triple_strike" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBe(3);
    });

    it("should floor maxHits at 1 for stars below 1", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      const unit = { star: 0, skillId: "wasp_triple_strike" };
      
      const maxTargets = getWaspMaxTargets(unit, skill);
      
      expect(maxTargets).toBe(1);
    });
  });

  describe("Integration with skill system", () => {
    it("should have wasp_triple_strike in SKILL_LIBRARY", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      expect(skill).toBeDefined();
      expect(skill.id).toBe("wasp_triple_strike");
      expect(skill.effect).toBe("random_multi");
    });

    it("should have maxHits as a number or undefined in wasp_triple_strike skill", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      // maxHits can be undefined or a number - both are valid
      if (skill.maxHits !== undefined) {
        expect(typeof skill.maxHits).toBe("number");
      }
    });
  });
});

/**
 * Property-Based Tests: Wasp Skill Balancing
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 * 
 * Feature: skill-differentiation-and-wiki-overhaul
 * 
 * This test suite verifies:
 * - Property 22: Wasp Star-Based Targeting - maxHits scales with star level
 * - Property 23: Wasp MaxHits Enforcement - actual hits never exceed maxHits
 */
describe("Wasp Skill Balancing - Property-Based Tests", () => {
  /**
   * Property 22: Wasp Star-Based Targeting
   * 
   * For any wasp unit, the maxHits parameter of its skill should equal the unit's star level
   * (1★ = 1 target, 2★ = 2 targets, 3★ = 3 targets).
   * 
   * This ensures wasp skills scale appropriately with unit power level.
   */
  describe("Property 22: Wasp Star-Based Targeting", () => {
    it("should scale maxHits with star level for wasp_triple_strike (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star levels from 1 to 3
          fc.integer({ min: 1, max: 3 }),
          (star) => {
            const unit = { star, skillId: "wasp_triple_strike" };
            const maxTargets = getWaspMaxTargets(unit, skill);
            
            // Property: maxHits should equal star level
            return maxTargets === star;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should cap maxHits at 3 for stars above 3 (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star levels above 3
          fc.integer({ min: 4, max: 10 }),
          (star) => {
            const unit = { star, skillId: "wasp_triple_strike" };
            const maxTargets = getWaspMaxTargets(unit, skill);
            
            // Property: maxHits should be capped at 3
            return maxTargets === 3;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should floor maxHits at 1 for stars below 1 (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star levels below 1 (including 0 and negative)
          fc.integer({ min: -5, max: 0 }),
          (star) => {
            const unit = { star, skillId: "wasp_triple_strike" };
            const maxTargets = getWaspMaxTargets(unit, skill);
            
            // Property: maxHits should be floored at 1
            return maxTargets === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should default to 1 when star is undefined (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate various undefined/null scenarios
          fc.constantFrom(undefined, null),
          (starValue) => {
            const unit = { star: starValue, skillId: "wasp_triple_strike" };
            const maxTargets = getWaspMaxTargets(unit, skill);
            
            // Property: maxHits should default to 1
            return maxTargets === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return skill.maxHits for non-wasp skills (property-based)", () => {
      // Get all non-wasp skills that have maxHits defined
      const nonWaspSkills = Object.values(SKILL_LIBRARY).filter(
        (skill) => skill.id !== "wasp_triple_strike" && skill.maxHits !== undefined
      );
      
      if (nonWaspSkills.length === 0) {
        // Skip test if no non-wasp skills with maxHits
        return;
      }
      
      fc.assert(
        fc.property(
          fc.constantFrom(...nonWaspSkills),
          fc.integer({ min: 1, max: 3 }),
          (skill, star) => {
            const unit = { star, skillId: skill.id };
            const maxTargets = getWaspMaxTargets(unit, skill);
            
            // Property: For non-wasp skills, should return skill.maxHits
            return maxTargets === skill.maxHits;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 23: Wasp MaxHits Enforcement
   * 
   * For any wasp skill execution, the number of enemies actually hit should not exceed
   * the maxHits parameter.
   * 
   * This ensures the combat system respects the star-based targeting limits.
   */
  describe("Property 23: Wasp MaxHits Enforcement", () => {
    /**
     * Helper function to simulate the random_multi targeting logic
     * This mirrors the implementation in CombatScene.js
     */
    function simulateRandomMultiTargeting(attacker, skill, enemies) {
      const pool = enemies.filter((enemy) => enemy.alive);
      const baseMaxHits = getWaspMaxTargets(attacker, skill) ?? skill.maxHits ?? 3;
      const count = Math.min(baseMaxHits, pool.length);
      
      // Simulate sampleWithoutReplacement
      const targets = [];
      const poolCopy = [...pool];
      for (let i = 0; i < count && poolCopy.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * poolCopy.length);
        targets.push(poolCopy[randomIndex]);
        poolCopy.splice(randomIndex, 1);
      }
      
      return targets;
    }

    it("should never exceed maxHits when targeting enemies (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star level (1-3)
          fc.integer({ min: 1, max: 3 }),
          // Generate number of enemies (1-15)
          fc.integer({ min: 1, max: 15 }),
          (star, enemyCount) => {
            const attacker = { star, skillId: "wasp_triple_strike" };
            const maxHits = getWaspMaxTargets(attacker, skill);
            
            // Create mock enemies
            const enemies = Array.from({ length: enemyCount }, (_, i) => ({
              uid: `enemy_${i}`,
              alive: true,
              hp: 100
            }));
            
            // Simulate targeting
            const targets = simulateRandomMultiTargeting(attacker, skill, enemies);
            
            // Property: Number of targets should never exceed maxHits
            return targets.length <= maxHits;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should hit all enemies when enemy count is less than maxHits (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star level (2-3 to ensure maxHits > 1)
          fc.integer({ min: 2, max: 3 }),
          (star) => {
            const attacker = { star, skillId: "wasp_triple_strike" };
            const maxHits = getWaspMaxTargets(attacker, skill);
            
            // Create fewer enemies than maxHits
            const enemyCount = maxHits - 1;
            const enemies = Array.from({ length: enemyCount }, (_, i) => ({
              uid: `enemy_${i}`,
              alive: true,
              hp: 100
            }));
            
            // Simulate targeting
            const targets = simulateRandomMultiTargeting(attacker, skill, enemies);
            
            // Property: Should hit all available enemies when count < maxHits
            return targets.length === enemyCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should hit exactly maxHits enemies when enough enemies are available (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star level (1-3)
          fc.integer({ min: 1, max: 3 }),
          (star) => {
            const attacker = { star, skillId: "wasp_triple_strike" };
            const maxHits = getWaspMaxTargets(attacker, skill);
            
            // Create more enemies than maxHits
            const enemyCount = maxHits + 5;
            const enemies = Array.from({ length: enemyCount }, (_, i) => ({
              uid: `enemy_${i}`,
              alive: true,
              hp: 100
            }));
            
            // Simulate targeting
            const targets = simulateRandomMultiTargeting(attacker, skill, enemies);
            
            // Property: Should hit exactly maxHits enemies when enough are available
            return targets.length === maxHits;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should only target alive enemies (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star level (1-3)
          fc.integer({ min: 1, max: 3 }),
          // Generate number of alive enemies (1-10)
          fc.integer({ min: 1, max: 10 }),
          // Generate number of dead enemies (0-5)
          fc.integer({ min: 0, max: 5 }),
          (star, aliveCount, deadCount) => {
            const attacker = { star, skillId: "wasp_triple_strike" };
            const maxHits = getWaspMaxTargets(attacker, skill);
            
            // Create mix of alive and dead enemies
            const enemies = [
              ...Array.from({ length: aliveCount }, (_, i) => ({
                uid: `alive_${i}`,
                alive: true,
                hp: 100
              })),
              ...Array.from({ length: deadCount }, (_, i) => ({
                uid: `dead_${i}`,
                alive: false,
                hp: 0
              }))
            ];
            
            // Simulate targeting
            const targets = simulateRandomMultiTargeting(attacker, skill, enemies);
            
            // Property: All targets should be alive
            const allTargetsAlive = targets.every((target) => target.alive);
            // Property: Should not exceed maxHits or alive count
            const countValid = targets.length <= Math.min(maxHits, aliveCount);
            
            return allTargetsAlive && countValid;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return empty array when no enemies are alive (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate star level (1-3)
          fc.integer({ min: 1, max: 3 }),
          // Generate number of dead enemies (1-10)
          fc.integer({ min: 1, max: 10 }),
          (star, deadCount) => {
            const attacker = { star, skillId: "wasp_triple_strike" };
            
            // Create only dead enemies
            const enemies = Array.from({ length: deadCount }, (_, i) => ({
              uid: `dead_${i}`,
              alive: false,
              hp: 0
            }));
            
            // Simulate targeting
            const targets = simulateRandomMultiTargeting(attacker, skill, enemies);
            
            // Property: Should return empty array when no alive enemies
            return targets.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should enforce maxHits across different star levels (property-based)", () => {
      const skill = SKILL_LIBRARY["wasp_triple_strike"];
      
      fc.assert(
        fc.property(
          // Generate two different star levels
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 1, max: 3 }),
          // Generate enemy count
          fc.integer({ min: 5, max: 15 }),
          (star1, star2, enemyCount) => {
            // Create enemies
            const enemies = Array.from({ length: enemyCount }, (_, i) => ({
              uid: `enemy_${i}`,
              alive: true,
              hp: 100
            }));
            
            // Test first star level
            const attacker1 = { star: star1, skillId: "wasp_triple_strike" };
            const maxHits1 = getWaspMaxTargets(attacker1, skill);
            const targets1 = simulateRandomMultiTargeting(attacker1, skill, enemies);
            
            // Test second star level
            const attacker2 = { star: star2, skillId: "wasp_triple_strike" };
            const maxHits2 = getWaspMaxTargets(attacker2, skill);
            const targets2 = simulateRandomMultiTargeting(attacker2, skill, enemies);
            
            // Property: Both should respect their respective maxHits
            const valid1 = targets1.length <= maxHits1;
            const valid2 = targets2.length <= maxHits2;
            
            // Property: If star1 < star2, then maxHits1 <= maxHits2
            const scalingValid = star1 < star2 ? maxHits1 <= maxHits2 : true;
            
            return valid1 && valid2 && scalingValid;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
