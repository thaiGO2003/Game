import { describe, it, expect } from "vitest";
import { UNIT_CATALOG, UNIT_BY_ID } from "../src/data/unitCatalog.js";

describe("Unit Catalog Loading", () => {
  it("should load exactly 120 units from CSV without dynamic generation", () => {
    expect(UNIT_CATALOG.length).toBe(120);
  });

  it("should have all units accessible by ID", () => {
    expect(Object.keys(UNIT_BY_ID).length).toBe(120);
  });

  it("should have all required properties for each unit", () => {
    UNIT_CATALOG.forEach((unit) => {
      expect(unit).toHaveProperty("id");
      expect(unit).toHaveProperty("name");
      expect(unit).toHaveProperty("species");
      expect(unit).toHaveProperty("icon");
      expect(unit).toHaveProperty("tribe");
      expect(unit).toHaveProperty("classType");
      expect(unit).toHaveProperty("tier");
      expect(unit).toHaveProperty("stats");
      expect(unit).toHaveProperty("skillId");

      // Verify stats object has all required properties
      expect(unit.stats).toHaveProperty("hp");
      expect(unit.stats).toHaveProperty("atk");
      expect(unit.stats).toHaveProperty("def");
      expect(unit.stats).toHaveProperty("matk");
      expect(unit.stats).toHaveProperty("mdef");
      expect(unit.stats).toHaveProperty("range");
      expect(unit.stats).toHaveProperty("rageMax");
    });
  });

  it("should have valid tier values (1-5)", () => {
    UNIT_CATALOG.forEach((unit) => {
      expect(unit.tier).toBeGreaterThanOrEqual(1);
      expect(unit.tier).toBeLessThanOrEqual(5);
    });
  });

  it("should have unique unit IDs", () => {
    const ids = UNIT_CATALOG.map((u) => u.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(120);
  });

  it("should have valid classType values", () => {
    const validClasses = ["TANKER", "FIGHTER", "ASSASSIN", "ARCHER", "MAGE", "SUPPORT"];
    UNIT_CATALOG.forEach((unit) => {
      expect(validClasses).toContain(unit.classType);
    });
  });
});
