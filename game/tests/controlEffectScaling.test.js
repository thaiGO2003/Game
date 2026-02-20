import { describe, it, expect, beforeEach } from "vitest";
import { getGoldReserveScaling } from "../src/core/gameUtils.js";

describe("Control Effect Probability Scaling with Gold", () => {
  describe("Gold multiplier calculation", () => {
    it("returns 1.0 for baseline gold (10)", () => {
      const multiplier = getGoldReserveScaling(10);
      expect(multiplier).toBe(1.0);
    });

    it("returns 1.10 for 30 gold (+10% bonus)", () => {
      const multiplier = getGoldReserveScaling(30);
      expect(multiplier).toBeCloseTo(1.10, 2);
    });

    it("returns 1.20 for 50 gold (+20% bonus)", () => {
      const multiplier = getGoldReserveScaling(50);
      expect(multiplier).toBeCloseTo(1.20, 2);
    });

    it("caps at 2.0 for high gold amounts", () => {
      expect(getGoldReserveScaling(210)).toBe(2.0);
      expect(getGoldReserveScaling(500)).toBe(2.0);
    });
  });

  describe("Control effect probability scaling", () => {
    it("scales stun probability with gold multiplier", () => {
      const baseStunChance = 0.40; // 40% base
      const starMult = 1.0; // no star bonus
      
      // With 10 gold (1.0x multiplier)
      const prob10 = Math.min(1, baseStunChance * starMult * getGoldReserveScaling(10));
      expect(prob10).toBeCloseTo(0.40, 2);
      
      // With 30 gold (1.10x multiplier)
      const prob30 = Math.min(1, baseStunChance * starMult * getGoldReserveScaling(30));
      expect(prob30).toBeCloseTo(0.44, 2);
      
      // With 50 gold (1.20x multiplier)
      const prob50 = Math.min(1, baseStunChance * starMult * getGoldReserveScaling(50));
      expect(prob50).toBeCloseTo(0.48, 2);
    });

    it("scales freeze probability with gold multiplier", () => {
      const baseFreezeChance = 0.50; // 50% base
      const starMult = 1.0;
      
      const prob10 = Math.min(1, baseFreezeChance * starMult * getGoldReserveScaling(10));
      expect(prob10).toBeCloseTo(0.50, 2);
      
      const prob30 = Math.min(1, baseFreezeChance * starMult * getGoldReserveScaling(30));
      expect(prob30).toBeCloseTo(0.55, 2);
    });

    it("scales sleep probability with gold multiplier", () => {
      const baseSleepChance = 0.60; // 60% base
      const starMult = 1.0;
      
      const prob10 = Math.min(1, baseSleepChance * starMult * getGoldReserveScaling(10));
      expect(prob10).toBeCloseTo(0.60, 2);
      
      const prob30 = Math.min(1, baseSleepChance * starMult * getGoldReserveScaling(30));
      expect(prob30).toBeCloseTo(0.66, 2);
    });

    it("caps probability at 1.0 (100%)", () => {
      const baseChance = 0.90; // 90% base
      const starMult = 1.0;
      const goldMult = getGoldReserveScaling(50); // 1.20x
      
      // 0.90 * 1.20 = 1.08, should cap at 1.0
      const finalProb = Math.min(1, baseChance * starMult * goldMult);
      expect(finalProb).toBe(1.0);
    });

    it("never reduces probability below base", () => {
      const baseChance = 0.30;
      const starMult = 1.0;
      
      // Even with minimum gold, probability should not decrease
      const prob0 = Math.min(1, baseChance * starMult * getGoldReserveScaling(0));
      expect(prob0).toBeGreaterThanOrEqual(baseChance);
      
      const prob10 = Math.min(1, baseChance * starMult * getGoldReserveScaling(10));
      expect(prob10).toBeGreaterThanOrEqual(baseChance);
    });

    it("combines star multiplier and gold multiplier correctly", () => {
      const baseChance = 0.40;
      const starMult = 1.2; // 20% star bonus
      const goldMult = getGoldReserveScaling(30); // 1.10x gold bonus
      
      // 0.40 * 1.2 * 1.10 = 0.528
      const finalProb = Math.min(1, baseChance * starMult * goldMult);
      expect(finalProb).toBeCloseTo(0.528, 2);
    });
  });

  describe("Edge cases", () => {
    it("handles zero base probability", () => {
      const baseChance = 0;
      const goldMult = getGoldReserveScaling(50);
      
      const finalProb = Math.min(1, baseChance * goldMult);
      expect(finalProb).toBe(0);
    });

    it("handles 100% base probability", () => {
      const baseChance = 1.0;
      const goldMult = getGoldReserveScaling(50);
      
      const finalProb = Math.min(1, baseChance * goldMult);
      expect(finalProb).toBe(1.0);
    });

    it("handles very high gold amounts", () => {
      const baseChance = 0.50;
      const goldMult = getGoldReserveScaling(1000); // Should cap at 2.0
      
      expect(goldMult).toBe(2.0);
      const finalProb = Math.min(1, baseChance * goldMult);
      expect(finalProb).toBe(1.0); // 0.50 * 2.0 = 1.0
    });
  });
});
