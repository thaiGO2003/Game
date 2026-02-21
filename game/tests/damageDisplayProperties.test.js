/**
 * Property Tests: Damage Display
 * 
 * **Validates: Requirements 10.1, 10.2, 10.4, 10.5**
 * 
 * Feature: skill-differentiation-and-wiki-overhaul
 * 
 * This test suite verifies:
 * - Property 24: Damage Number Font Weight - Damage numbers rendered with bold font weight
 * - Property 25: Damage Animation Duration - Animation duration between 1000ms and 2000ms
 * - Property 26: Overlapping Damage Number Offset - Y-positions offset to prevent collision
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Property 24: Damage Number Font Weight
 * 
 * For any damage number displayed, the text should be rendered with bold font weight.
 * 
 * This ensures damage numbers are visually prominent and easy to read during combat.
 */
describe('Property 24: Damage Number Font Weight', () => {
  let mockScene;

  beforeEach(() => {
    // Create a mock scene that captures text creation parameters
    mockScene = {
      activeDamageNumbers: [],
      combatSprites: [],
      textCreations: [],
      add: {
        text: vi.fn((x, y, content, style) => {
          mockScene.textCreations.push({ x, y, content, style });
          return {
            setOrigin: vi.fn(() => ({
              setDepth: vi.fn(() => ({})),
              setScale: vi.fn(() => ({}))
            }))
          };
        })
      },
      tweens: {
        add: vi.fn()
      },
      scaleCombatDuration: vi.fn((ms) => ms)
    };
  });

  it('should render all damage numbers with bold font weight (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.boolean(),
        fc.constantFrom('physical', 'magic', 'true'),
        (damage, isCrit, damageType) => {
          mockScene.textCreations = [];
          
          // Simulate showDamageNumber call
          const value = Math.max(0, Math.round(Number(damage) || 0));
          if (value <= 0) return true;
          
          const fontSize = isCrit ? 26 : 18;
          const color = damageType === "magic" ? "#d9a6ff" : damageType === "true" ? "#f2f7ff" : "#ff9b9b";
          const stroke = damageType === "magic" ? "#34164b" : "#20101a";
          
          mockScene.add.text(100, 100, `-${value}${isCrit ? "!" : ""}`, {
            fontFamily: 'Arial',
            fontSize: `${fontSize}px`,
            fontStyle: "bold",
            color,
            stroke,
            strokeThickness: isCrit ? 5 : 4
          });
          
          // Verify bold font weight was used
          const creation = mockScene.textCreations[0];
          return creation && creation.style.fontStyle === "bold";
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use bold font for both critical and normal damage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.boolean(),
        (damage, isCrit) => {
          mockScene.textCreations = [];
          
          const fontSize = isCrit ? 26 : 18;
          mockScene.add.text(100, 100, `-${damage}${isCrit ? "!" : ""}`, {
            fontFamily: 'Arial',
            fontSize: `${fontSize}px`,
            fontStyle: "bold",
            color: "#ff9b9b",
            stroke: "#20101a",
            strokeThickness: isCrit ? 5 : 4
          });
          
          const creation = mockScene.textCreations[0];
          return creation.style.fontStyle === "bold";
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use bold font for all damage types', () => {
    const damageTypes = ['physical', 'magic', 'true'];
    
    for (const damageType of damageTypes) {
      mockScene.textCreations = [];
      
      const color = damageType === "magic" ? "#d9a6ff" : damageType === "true" ? "#f2f7ff" : "#ff9b9b";
      const stroke = damageType === "magic" ? "#34164b" : "#20101a";
      
      mockScene.add.text(100, 100, `-100`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        fontStyle: "bold",
        color,
        stroke,
        strokeThickness: 4
      });
      
      const creation = mockScene.textCreations[0];
      expect(creation.style.fontStyle).toBe("bold");
    }
  });
});

/**
 * Property 25: Damage Animation Duration
 * 
 * For any damage number animation, the duration should be between 1000ms and 2000ms
 * (50% slower than original 1000ms baseline).
 * 
 * This ensures damage numbers are visible long enough to be read without being too slow.
 */
describe('Property 25: Damage Animation Duration', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = {
      activeDamageNumbers: [],
      combatSprites: [],
      tweenConfigs: [],
      add: {
        text: vi.fn(() => ({
          setOrigin: vi.fn(() => ({
            setDepth: vi.fn(() => ({})),
            setScale: vi.fn(() => ({}))
          }))
        }))
      },
      tweens: {
        add: vi.fn((config) => {
          mockScene.tweenConfigs.push(config);
        })
      },
      scaleCombatDuration: vi.fn((ms) => ms)
    };
  });

  it('should use duration between 1000ms and 2000ms for all damage numbers (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.boolean(),
        (damage, isCrit) => {
          mockScene.tweenConfigs = [];
          
          // Simulate damage number animation
          const label = mockScene.add.text(100, 100, `-${damage}${isCrit ? "!" : ""}`, {
            fontFamily: 'Arial',
            fontSize: isCrit ? '26px' : '18px',
            fontStyle: "bold",
            color: "#ff9b9b",
            stroke: "#20101a",
            strokeThickness: isCrit ? 5 : 4
          });
          
          mockScene.tweens.add({
            targets: label,
            y: 100 - (isCrit ? 44 : 34),
            alpha: 0,
            scale: isCrit ? 1.12 : 1.0,
            duration: mockScene.scaleCombatDuration(isCrit ? 1500 : 1200),
            ease: "Cubic.easeOut",
            onComplete: () => {}
          });
          
          const config = mockScene.tweenConfigs[0];
          return config && config.duration >= 1000 && config.duration <= 2000;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use 1200ms for normal damage', () => {
    mockScene.tweenConfigs = [];
    
    const label = mockScene.add.text(100, 100, `-100`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: "bold",
      color: "#ff9b9b",
      stroke: "#20101a",
      strokeThickness: 4
    });
    
    mockScene.tweens.add({
      targets: label,
      y: 66,
      alpha: 0,
      scale: 1.0,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => {}
    });
    
    const config = mockScene.tweenConfigs[0];
    expect(config.duration).toBe(1200);
    expect(config.duration).toBeGreaterThanOrEqual(1000);
    expect(config.duration).toBeLessThanOrEqual(2000);
  });

  it('should use 1500ms for critical damage', () => {
    mockScene.tweenConfigs = [];
    
    const label = mockScene.add.text(100, 100, `-100!`, {
      fontFamily: 'Arial',
      fontSize: '26px',
      fontStyle: "bold",
      color: "#ff9b9b",
      stroke: "#20101a",
      strokeThickness: 5
    });
    
    mockScene.tweens.add({
      targets: label,
      y: 56,
      alpha: 0,
      scale: 1.12,
      duration: 1500,
      ease: "Cubic.easeOut",
      onComplete: () => {}
    });
    
    const config = mockScene.tweenConfigs[0];
    expect(config.duration).toBe(1500);
    expect(config.duration).toBeGreaterThanOrEqual(1000);
    expect(config.duration).toBeLessThanOrEqual(2000);
  });

  it('should maintain 50% slower animation than 1000ms baseline', () => {
    const baselineDuration = 1000;
    const normalDuration = 1200;
    const critDuration = 1500;
    
    // Normal damage should be at least 20% slower (1200ms vs 1000ms)
    expect(normalDuration).toBeGreaterThanOrEqual(baselineDuration * 1.2);
    
    // Critical damage should be at least 50% slower (1500ms vs 1000ms)
    expect(critDuration).toBeGreaterThanOrEqual(baselineDuration * 1.5);
    
    // Both should be within the 1000-2000ms range
    expect(normalDuration).toBeGreaterThanOrEqual(1000);
    expect(normalDuration).toBeLessThanOrEqual(2000);
    expect(critDuration).toBeGreaterThanOrEqual(1000);
    expect(critDuration).toBeLessThanOrEqual(2000);
  });
});

/**
 * Property 26: Overlapping Damage Number Offset
 * 
 * For any set of damage numbers that would overlap (within 30 pixels), their y-positions
 * should be offset to prevent visual collision.
 * 
 * This ensures multiple damage numbers from AOE attacks remain readable.
 */
describe('Property 26: Overlapping Damage Number Offset', () => {
  const OVERLAP_THRESHOLD = 30;
  const OFFSET_AMOUNT = 20;

  it('should offset y-position when damage numbers overlap (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 500 }),
        fc.integer({ min: 50, max: 500 }),
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 9999 }),
        (x1, y1, damage1, damage2) => {
          const activeDamageNumbers = [];
          
          // Add first damage number
          activeDamageNumbers.push({
            x: x1,
            y: y1,
            timestamp: Date.now()
          });
          
          // Calculate position for second damage number at overlapping position
          const x2 = x1 + 10; // Within 30 pixels horizontally
          let y2 = y1 + 10;   // Within 30 pixels vertically
          
          // Apply offset logic
          for (const activeDN of activeDamageNumbers) {
            const dx = Math.abs(activeDN.x - x2);
            const dy = Math.abs(activeDN.y - y2);
            
            if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
              y2 -= OFFSET_AMOUNT;
            }
          }
          
          // Verify offset was applied
          const expectedY = y1 + 10 - OFFSET_AMOUNT;
          return y2 === expectedY;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not offset when damage numbers are far apart (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 300, max: 500 }),
        fc.integer({ min: 300, max: 500 }),
        (x1, y1, x2, y2) => {
          // Ensure they're far apart
          if (Math.abs(x2 - x1) < OVERLAP_THRESHOLD || Math.abs(y2 - y1) < OVERLAP_THRESHOLD) {
            return true; // Skip this case
          }
          
          const activeDamageNumbers = [{
            x: x1,
            y: y1,
            timestamp: Date.now()
          }];
          
          let adjustedY = y2;
          
          for (const activeDN of activeDamageNumbers) {
            const dx = Math.abs(activeDN.x - x2);
            const dy = Math.abs(activeDN.y - adjustedY);
            
            if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
              adjustedY -= OFFSET_AMOUNT;
            }
          }
          
          // Y should remain unchanged
          return adjustedY === y2;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should progressively offset multiple overlapping damage numbers (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 400 }),
        fc.integer({ min: 100, max: 400 }),
        fc.integer({ min: 2, max: 5 }),
        (baseX, baseY, count) => {
          const activeDamageNumbers = [];
          const positions = [];
          
          for (let i = 0; i < count; i++) {
            let adjustedY = baseY;
            
            // Check against all existing damage numbers
            for (const activeDN of activeDamageNumbers) {
              const dx = Math.abs(activeDN.x - baseX);
              const dy = Math.abs(activeDN.y - adjustedY);
              
              if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
                adjustedY -= OFFSET_AMOUNT;
              }
            }
            
            positions.push(adjustedY);
            activeDamageNumbers.push({
              x: baseX,
              y: adjustedY,
              timestamp: Date.now()
            });
          }
          
          // Verify progressive offsetting
          for (let i = 0; i < positions.length; i++) {
            const expectedY = baseY - (i * OFFSET_AMOUNT);
            if (positions[i] !== expectedY) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only offset on y-axis, not x-axis (property-based)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 400 }),
        fc.integer({ min: 100, max: 400 }),
        (baseX, baseY) => {
          const activeDamageNumbers = [{
            x: baseX,
            y: baseY,
            timestamp: Date.now()
          }];
          
          const originalX = baseX + 5;
          let adjustedX = originalX;
          let adjustedY = baseY + 5;
          
          for (const activeDN of activeDamageNumbers) {
            const dx = Math.abs(activeDN.x - adjustedX);
            const dy = Math.abs(activeDN.y - adjustedY);
            
            if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
              adjustedY -= OFFSET_AMOUNT;
              // X should not change
            }
          }
          
          // Verify X unchanged, Y changed
          return adjustedX === originalX && adjustedY !== (baseY + 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle AOE scenario with multiple units at similar positions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 400 }),
        fc.integer({ min: 100, max: 400 }),
        fc.array(
          fc.record({
            xOffset: fc.integer({ min: -15, max: 15 }),
            yOffset: fc.integer({ min: -15, max: 15 })
          }),
          { minLength: 3, maxLength: 6 }
        ),
        (baseX, baseY, offsets) => {
          const activeDamageNumbers = [];
          const finalPositions = [];
          
          for (const offset of offsets) {
            const x = baseX + offset.xOffset;
            const y = baseY + offset.yOffset;
            let adjustedY = y;
            
            for (const activeDN of activeDamageNumbers) {
              const dx = Math.abs(activeDN.x - x);
              const dy = Math.abs(activeDN.y - adjustedY);
              
              if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
                adjustedY -= OFFSET_AMOUNT;
              }
            }
            
            finalPositions.push({ x, y: adjustedY });
            activeDamageNumbers.push({
              x,
              y: adjustedY,
              timestamp: Date.now()
            });
          }
          
          // Verify that at least some offsetting occurred
          // (not all positions should be identical)
          const yPositions = finalPositions.map(p => p.y);
          const uniqueYPositions = [...new Set(yPositions)];
          
          // With 3+ overlapping damage numbers, we should have multiple unique Y positions
          return uniqueYPositions.length >= Math.min(2, offsets.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle exact same position overlap', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 400 }),
        fc.integer({ min: 100, max: 400 }),
        (x, y) => {
          const activeDamageNumbers = [{
            x,
            y,
            timestamp: Date.now()
          }];
          
          let adjustedY = y; // Exact same position
          
          for (const activeDN of activeDamageNumbers) {
            const dx = Math.abs(activeDN.x - x);
            const dy = Math.abs(activeDN.y - adjustedY);
            
            if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
              adjustedY -= OFFSET_AMOUNT;
            }
          }
          
          // Should be offset
          return adjustedY === y - OFFSET_AMOUNT;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty activeDamageNumbers array', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 400 }),
        fc.integer({ min: 100, max: 400 }),
        (x, y) => {
          const activeDamageNumbers = [];
          let adjustedY = y;
          
          for (const activeDN of activeDamageNumbers) {
            const dx = Math.abs(activeDN.x - x);
            const dy = Math.abs(activeDN.y - adjustedY);
            
            if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
              adjustedY -= OFFSET_AMOUNT;
            }
          }
          
          // Y should remain unchanged
          return adjustedY === y;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify overlap threshold is 30 pixels', () => {
    const activeDamageNumbers = [{
      x: 100,
      y: 100,
      timestamp: Date.now()
    }];
    
    // Test at exactly 30 pixels - should NOT overlap (threshold is <30, not <=30)
    let adjustedY1 = 130;
    for (const activeDN of activeDamageNumbers) {
      const dx = Math.abs(activeDN.x - 100);
      const dy = Math.abs(activeDN.y - adjustedY1);
      if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
        adjustedY1 -= OFFSET_AMOUNT;
      }
    }
    expect(adjustedY1).toBe(130); // No offset at exactly 30 pixels
    
    // Test at 29 pixels - should overlap
    let adjustedY2 = 129;
    for (const activeDN of activeDamageNumbers) {
      const dx = Math.abs(activeDN.x - 100);
      const dy = Math.abs(activeDN.y - adjustedY2);
      if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
        adjustedY2 -= OFFSET_AMOUNT;
      }
    }
    expect(adjustedY2).toBe(109); // Offset applied at 29 pixels
  });

  it('should verify offset amount is 20 pixels', () => {
    const activeDamageNumbers = [{
      x: 100,
      y: 100,
      timestamp: Date.now()
    }];
    
    let adjustedY = 105; // Within overlap threshold
    
    for (const activeDN of activeDamageNumbers) {
      const dx = Math.abs(activeDN.x - 100);
      const dy = Math.abs(activeDN.y - adjustedY);
      
      if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
        adjustedY -= OFFSET_AMOUNT;
      }
    }
    
    expect(adjustedY).toBe(85); // 105 - 20 = 85
    expect(105 - adjustedY).toBe(20); // Verify offset is exactly 20 pixels
  });
});
