import { describe, it, expect } from "vitest";
import {
    rollTierForLevel,
    getDeployCapByLevel,
    getXpToLevelUp,
    createUnitUid
} from "../src/core/gameUtils.js";

// We need to access the un-exported TIER_ODDS_BY_LEVEL for testing purposes.
// Since it is not exported, we can infer it or just rely on rollTierForLevel distribution,
// OR we can temporarily export it or use a rewire-like approach.
// However, typically we should test the public API.
// But for "property test for tier odds probability sum", we ideally want access to the data structure.
// Given we can't easily modify the source just for tests without making it public, 
// we will verify the behavior via sampling or just trust the code review mostly, 
// BUT we can use the `getTierOdds` pattern if we refactor, or just inspect the file content if we were a linter.
// 
// Actually, looking at gameUtils.js, TIER_ODDS_BY_LEVEL is NOT exported. 
// I will rely on the fact that I just wrote the file and verified it.
// 
// Wait, I can't import TIER_ODDS_BY_LEVEL if it's not exported. 
// I will verify `getDeployCapByLevel` and `getXpToLevelUp` directly.
// For tier odds, I'll run a statistical test on `rollTierForLevel`.

describe("Progression System Extension", () => {

    describe("XP to Level Up", () => {
        it("should have defined XP for levels 1 through 25", () => {
            // We check specific values for the new levels
            expect(getXpToLevelUp(9)).toBe(68);
            expect(getXpToLevelUp(10)).toBe(88);
            expect(getXpToLevelUp(11)).toBe(112);
            expect(getXpToLevelUp(12)).toBe(140);
            expect(getXpToLevelUp(13)).toBe(172);
            expect(getXpToLevelUp(20)).toBe(508);
            expect(getXpToLevelUp(25)).toBe(868);
        });

        it("should return Infinity for levels beyond 25", () => {
            expect(getXpToLevelUp(26)).toBe(Infinity);
            expect(getXpToLevelUp(30)).toBe(Infinity);
        });

        it("should have monotonically increasing XP requirements", () => {
            for (let level = 1; level < 25; level++) {
                const currentXp = getXpToLevelUp(level);
                const nextXp = getXpToLevelUp(level + 1);
                expect(nextXp).toBeGreaterThan(currentXp);
            }
        });
    });

    describe("Deploy Cap", () => {
        it("should start at 3 and scale up to 25 (full 5×5 board)", () => {
            expect(getDeployCapByLevel(1)).toBe(3);  // 1+2 = 3
            expect(getDeployCapByLevel(5)).toBe(7);  // 5+2 = 7
            expect(getDeployCapByLevel(12)).toBe(14); // 12+2 = 14
            expect(getDeployCapByLevel(13)).toBe(15); // 13+2 = 15
            expect(getDeployCapByLevel(20)).toBe(22); // 20+2 = 22
            expect(getDeployCapByLevel(23)).toBe(25); // 23+2 = 25 (max)
            expect(getDeployCapByLevel(25)).toBe(25); // Clamped at 25
            expect(getDeployCapByLevel(30)).toBe(25); // Clamped at 25
        });

        // **Property 4: Deploy Cap Monotonicity**
        // **Validates: Requirements 12.1, 12.2, 12.3**
        describe("Deploy Cap Monotonicity", () => {
            it("should increase monotonically from level 1 to 30", () => {
                // Test that deploy cap never decreases as level increases
                for (let level = 1; level < 30; level++) {
                    const currentCap = getDeployCapByLevel(level);
                    const nextCap = getDeployCapByLevel(level + 1);
                    expect(nextCap).toBeGreaterThanOrEqual(currentCap);
                }
            });

            it("should respect minimum bound of 3", () => {
                // Test levels 1-30 all have at least 3 deploy cap
                for (let level = 1; level <= 30; level++) {
                    const cap = getDeployCapByLevel(level);
                    expect(cap).toBeGreaterThanOrEqual(3);
                }
            });

            it("should respect maximum bound of 25", () => {
                // Test levels 1-30 never exceed 25 deploy cap
                for (let level = 1; level <= 30; level++) {
                    const cap = getDeployCapByLevel(level);
                    expect(cap).toBeLessThanOrEqual(25);
                }
            });

            it("should reach maximum cap of 25 at level 23", () => {
                // Verify that level 23 is the first level to reach max cap
                expect(getDeployCapByLevel(22)).toBe(24);
                expect(getDeployCapByLevel(23)).toBe(25);
                expect(getDeployCapByLevel(24)).toBe(25);
            });

            it("should maintain cap at 25 for all levels >= 23", () => {
                // Test that cap stays at 25 for high levels
                for (let level = 23; level <= 50; level++) {
                    expect(getDeployCapByLevel(level)).toBe(25);
                }
            });

            it("should handle edge cases correctly", () => {
                // Test edge cases: level 0, negative levels
                expect(getDeployCapByLevel(0)).toBe(3);  // 0+2=2, clamped to 3
                expect(getDeployCapByLevel(-5)).toBe(3); // Negative, clamped to 3
                expect(getDeployCapByLevel(100)).toBe(25); // Very high level, clamped to 25
            });
        });
    });

    describe("Tier Odds (Statistical Check)", () => {
        it("should generate tiers within valid range (1-5) for level 25", () => {
            for (let i = 0; i < 100; i++) {
                const tier = rollTierForLevel(25);
                expect(tier).toBeGreaterThanOrEqual(1);
                expect(tier).toBeLessThanOrEqual(5);
            }
        });

        it("should mostly generate high tiers for level 12", () => {
            // Level 12 odds: [0, 0, 0.10, 0.30, 0.60]
            // We expect mostly 5s and 4s.
            let tier5Count = 0;
            let tier12Count = 0;
            const samples = 1000;
            for (let i = 0; i < samples; i++) {
                const tier = rollTierForLevel(12);
                if (tier === 5) tier5Count++;
                if (tier <= 2) tier12Count++;
            }

            // Tier 5 should be roughly 60% -> 600
            expect(tier5Count).toBeGreaterThan(500);
            // Tier 1 & 2 should be 0
            expect(tier12Count).toBe(0);
        });

        it("should generate ~90% tier 5 units at level 25", () => {
            // Level 25 odds: [0, 0, 0.02, 0.08, 0.90]
            // We expect mostly tier 5s
            let tier5Count = 0;
            let tier4Count = 0;
            const samples = 1000;
            for (let i = 0; i < samples; i++) {
                const tier = rollTierForLevel(25);
                if (tier === 5) tier5Count++;
                if (tier === 4) tier4Count++;
            }

            // Tier 5 should be roughly 90% -> 900 (allow some variance)
            expect(tier5Count).toBeGreaterThan(850);
            // Tier 4 should be roughly 8% -> 80
            expect(tier4Count).toBeGreaterThan(40);
            expect(tier4Count).toBeLessThan(140);
        });

        it("should generate no tier 1 or 2 units at level 12+", () => {
            const samples = 500;
            for (let level = 12; level <= 25; level++) {
                for (let i = 0; i < samples; i++) {
                    const tier = rollTierForLevel(level);
                    expect(tier).toBeGreaterThanOrEqual(3);
                }
            }
        });
    });
});
