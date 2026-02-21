import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { UNIT_CATALOG } from "../src/data/unitCatalog.js";
import { getUnitVisual } from "../src/data/unitVisuals.js";

describe("Property 2: Unit Visual Round-Trip", () => {
  it("should keep icon/name resolution stable through repeated round-trips", () => {
    fc.assert(
      fc.property(fc.constantFrom(...UNIT_CATALOG), (unit) => {
        const first = getUnitVisual(unit.id);
        const snapshot = { id: unit.id, icon: first.icon, nameVi: first.nameVi };
        const second = getUnitVisual(snapshot.id);
        const third = getUnitVisual(snapshot.id);

        expect(second.icon).toBe(snapshot.icon);
        expect(third.icon).toBe(snapshot.icon);
        expect(second.nameVi).toBe(snapshot.nameVi);
        expect(third.nameVi).toBe(snapshot.nameVi);
      }),
      { numRuns: 120 }
    );
  });

  it("should preserve CSV icon precedence in round-trip", () => {
    fc.assert(
      fc.property(fc.constantFrom(...UNIT_CATALOG.filter((u) => String(u.icon ?? "").trim())), (unit) => {
        const visual = getUnitVisual(unit.id);
        expect(visual.icon).toBe(unit.icon);
      }),
      { numRuns: 120 }
    );
  });
});

