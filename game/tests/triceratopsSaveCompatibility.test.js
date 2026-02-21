import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { UNIT_BY_ID } from "../src/data/unitCatalog.js";
import { getUnitVisual } from "../src/data/unitVisuals.js";

describe("Property 11: Triceratops Save Compatibility", () => {
  it("should keep legacy unit id `triceratops_charge` loadable from save data", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 3 }), fc.integer({ min: 0, max: 4 }), fc.integer({ min: 0, max: 9 }), (star, row, col) => {
        const legacySavedUnit = {
          baseId: "triceratops_charge",
          star,
          row,
          col
        };
        const catalogUnit = UNIT_BY_ID[legacySavedUnit.baseId];
        expect(catalogUnit).toBeDefined();
        expect(catalogUnit.id).toBe("triceratops_charge");
        expect(catalogUnit.name).toBe("Bò Rừng Xung Phong");
        expect(catalogUnit.icon).toBe("🦬");

        const visual = getUnitVisual(legacySavedUnit.baseId);
        expect(visual.icon).toBe("🦬");
        expect(visual.nameVi).toBe("Bò Rừng Xung Phong");
      }),
      { numRuns: 100 }
    );
  });
});

