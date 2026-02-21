import { describe, it, expect } from "vitest";
import { UNIT_CATALOG } from "../src/data/unitCatalog.js";

describe("Encyclopedia Display for 120 Units", () => {
  it("should display exactly 120 units in the encyclopedia", () => {
    expect(UNIT_CATALOG.length).toBe(120);
  });

  it("should group units by role correctly", () => {
    const roleGroups = {};
    UNIT_CATALOG.forEach((unit) => {
      if (!roleGroups[unit.classType]) {
        roleGroups[unit.classType] = [];
      }
      roleGroups[unit.classType].push(unit);
    });

    // Verify each role exists and has the correct count
    const expectedRoleCounts = {
      "TANKER": 20,
      "FIGHTER": 17,
      "ASSASSIN": 19,
      "ARCHER": 20,
      "MAGE": 20,
      "SUPPORT": 24
    };
    
    Object.entries(expectedRoleCounts).forEach(([role, count]) => {
      expect(roleGroups[role]).toBeDefined();
      expect(roleGroups[role].length).toBe(count);
    });
  });

  it("should group units by tier correctly", () => {
    const tierGroups = {};
    UNIT_CATALOG.forEach((unit) => {
      if (!tierGroups[unit.tier]) {
        tierGroups[unit.tier] = [];
      }
      tierGroups[unit.tier].push(unit);
    });

    // Verify each tier has exactly 24 units (5 tiers × 24 = 120)
    for (let tier = 1; tier <= 5; tier++) {
      expect(tierGroups[tier]).toBeDefined();
      expect(tierGroups[tier].length).toBe(24);
    }
  });

  it("should have correct distribution per role-tier combination", () => {
    const roleTierMatrix = {};
    UNIT_CATALOG.forEach((unit) => {
      const key = `${unit.classType}_${unit.tier}`;
      if (!roleTierMatrix[key]) {
        roleTierMatrix[key] = [];
      }
      roleTierMatrix[key].push(unit);
    });

    // Verify each role-tier combination exists and has at least 1 unit
    const expectedRoles = ["TANKER", "FIGHTER", "ASSASSIN", "ARCHER", "MAGE", "SUPPORT"];
    expectedRoles.forEach((role) => {
      for (let tier = 1; tier <= 5; tier++) {
        const key = `${role}_${tier}`;
        expect(roleTierMatrix[key]).toBeDefined();
        expect(roleTierMatrix[key].length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  it("should support filtering by role", () => {
    const filterByRole = (role) => {
      return UNIT_CATALOG.filter((unit) => unit.classType === role);
    };

    const tankers = filterByRole("TANKER");
    expect(tankers.length).toBe(20);

    const assassins = filterByRole("ASSASSIN");
    expect(assassins.length).toBe(19);

    const archers = filterByRole("ARCHER");
    expect(archers.length).toBe(20);
    
    const fighters = filterByRole("FIGHTER");
    expect(fighters.length).toBe(17);
    
    const mages = filterByRole("MAGE");
    expect(mages.length).toBe(20);
    
    const supports = filterByRole("SUPPORT");
    expect(supports.length).toBe(24);
  });

  it("should support filtering by tier", () => {
    const filterByTier = (tier) => {
      return UNIT_CATALOG.filter((unit) => unit.tier === tier);
    };

    const tier1Units = filterByTier(1);
    expect(tier1Units.length).toBe(24);

    const tier5Units = filterByTier(5);
    expect(tier5Units.length).toBe(24);
  });

  it("should support filtering by tribe", () => {
    const filterByTribe = (tribe) => {
      return UNIT_CATALOG.filter((unit) => unit.tribe === tribe);
    };

    // Verify that filtering by tribe works (exact counts may vary)
    const tribes = [...new Set(UNIT_CATALOG.map((u) => u.tribe))];
    expect(tribes.length).toBeGreaterThan(0);

    tribes.forEach((tribe) => {
      const tribeUnits = filterByTribe(tribe);
      expect(tribeUnits.length).toBeGreaterThan(0);
    });
  });

  it("should support combined filtering (role + tier)", () => {
    const filterByRoleAndTier = (role, tier) => {
      return UNIT_CATALOG.filter((unit) => unit.classType === role && unit.tier === tier);
    };

    const tier5Tankers = filterByRoleAndTier("TANKER", 5);
    expect(tier5Tankers.length).toBe(4);

    const tier1Assassins = filterByRoleAndTier("ASSASSIN", 1);
    expect(tier1Assassins.length).toBe(4);
  });

  it("should support search functionality by name", () => {
    const searchByName = (query) => {
      const lowerQuery = query.toLowerCase();
      return UNIT_CATALOG.filter((unit) => unit.name.toLowerCase().includes(lowerQuery));
    };

    // Test that search returns results
    const allUnits = searchByName("");
    expect(allUnits.length).toBe(120);

    // Test specific search (will vary based on actual unit names)
    const results = searchByName("a");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should sort units by tier, role, and name", () => {
    const sortedUnits = [...UNIT_CATALOG].sort((a, b) => {
      // Sort by tier first
      if (a.tier !== b.tier) return a.tier - b.tier;
      // Then by role
      if (a.classType !== b.classType) return a.classType.localeCompare(b.classType);
      // Finally by name
      return a.name.localeCompare(b.name);
    });

    expect(sortedUnits.length).toBe(120);
    
    // Verify sorting is correct
    for (let i = 1; i < sortedUnits.length; i++) {
      const prev = sortedUnits[i - 1];
      const curr = sortedUnits[i];
      
      if (prev.tier !== curr.tier) {
        expect(prev.tier).toBeLessThan(curr.tier);
      } else if (prev.classType !== curr.classType) {
        expect(prev.classType.localeCompare(curr.classType)).toBeLessThan(0);
      } else {
        expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
      }
    }
  });

  it("should have all units with valid display data", () => {
    UNIT_CATALOG.forEach((unit) => {
      // Verify each unit has data needed for encyclopedia display
      expect(unit.id).toBeTruthy();
      expect(unit.name).toBeTruthy();
      expect(unit.icon).toBeTruthy();
      expect(unit.tribe).toBeTruthy();
      expect(unit.classType).toBeTruthy();
      expect(unit.tier).toBeGreaterThanOrEqual(1);
      expect(unit.tier).toBeLessThanOrEqual(5);
      expect(unit.skillId).toBeTruthy();
      
      // Verify stats are present
      expect(unit.stats).toBeDefined();
      expect(unit.stats.hp).toBeGreaterThan(0);
      expect(unit.stats.atk).toBeGreaterThan(0);
    });
  });
});
