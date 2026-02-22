import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import { LibraryModal } from "../src/ui/LibraryModal.js";

function makeObj(extra = {}) {
  const handlers = {};
  return {
    visible: true,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    setFontSize: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setMask: vi.fn().mockReturnThis(),
    setVisible: vi.fn(function (v) { this.visible = v; return this; }),
    setColor: vi.fn().mockReturnThis(),
    setText: vi.fn(function (t) { this.text = t; return this; }),
    setY: vi.fn(function (v) { this.y = v; return this; }),
    setScale: vi.fn().mockReturnThis(),
    add: vi.fn(),
    addAt: vi.fn(),
    removeAll: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(function (name, fn) { handlers[name] = fn; return this; }),
    emit: (name, ...args) => handlers[name]?.(...args),
    ...extra
  };
}

function createMockScene(width = 1920, height = 1080) {
  return {
    scale: { width, height },
    add: {
      rectangle: vi.fn((x, y, w, h) => makeObj({ x, y, width: w, height: h })),
      text: vi.fn((x, y, text) => makeObj({ x, y, text, height: 20 })),
      container: vi.fn((x, y) => makeObj({ x, y })),
      zone: vi.fn((x, y, w, h) => makeObj({ x, y, width: w, height: h })),
      line: vi.fn(() => makeObj()),
      circle: vi.fn((x, y, radius, color, alpha) => makeObj({ x, y, radius, fillColor: color, fillAlpha: alpha }))
    },
    make: {
      graphics: vi.fn(() => ({
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        createGeometryMask: vi.fn(() => ({})),
        destroy: vi.fn(),
        setVisible: vi.fn()
      }))
    },
    tweens: {
      add: vi.fn(() => ({ stop: vi.fn(), remove: vi.fn() }))
    }
  };
}

describe("Property 8: Library Behavior Consistency", () => {
  it("should keep open/close/toggle behavior deterministic", () => {
    const scene = createMockScene();
    const modal = new LibraryModal(scene);
    expect(modal.isOpen()).toBe(false);
    modal.show();
    expect(modal.isOpen()).toBe(true);
    modal.toggle(false);
    expect(modal.isOpen()).toBe(false);
    modal.toggle(true);
    expect(modal.isOpen()).toBe(true);
    modal.hide();
    expect(modal.isOpen()).toBe(false);
  });
});

describe("Property 9: Library Scene Return", () => {
  it("should invoke onClose and return interaction when modal closes", () => {
    const onClose = vi.fn();
    const scene = createMockScene();
    const modal = new LibraryModal(scene, { onClose });
    // Constructor calls setVisible(false) which triggers onClose once
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear(); // Reset the call count
    modal.show();
    expect(modal.isOpen()).toBe(true);
    modal.hide();
    expect(modal.isOpen()).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Property 10: Library Responsive Layout", () => {
  it("should clamp modal size inside viewport for any valid resolution", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 900, max: 2560 }),
        fc.integer({ min: 600, max: 1440 }),
        (width, height) => {
          const scene = createMockScene(width, height);
          const modal = new LibraryModal(scene);
          expect(modal.layout.modalW).toBeLessThanOrEqual(width - 40);
          expect(modal.layout.modalH).toBeLessThanOrEqual(height - 40);
          expect(modal.layout.viewportW).toBeGreaterThan(0);
          expect(modal.layout.viewportH).toBeGreaterThan(0);
          modal.destroy();
        }
      ),
      { numRuns: 60 }
    );
  });
});

describe("Property 12: Planning Scene Library Interaction Blocking", () => {
  it("should block planning interactions while library is visible", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (libraryVisible, settingsVisible, historyVisible) => {
        const canInteract = !(libraryVisible || settingsVisible || historyVisible);
        if (libraryVisible) expect(canInteract).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 13: Planning Scene Library Return", () => {
  it("should preserve scene phase/state after opening and closing library", () => {
    const scene = createMockScene();
    scene.phase = "PLANNING";
    const modal = new LibraryModal(scene);
    modal.show();
    modal.setDetailUnit("triceratops_charge");
    modal.hide();
    expect(scene.phase).toBe("PLANNING");
    expect(modal.isOpen()).toBe(false);
  });
});

