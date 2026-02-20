/**
 * Sprite Pool Unit Tests
 * Requirements: 25.2, 25.5
 * 
 * Tests the sprite pooling implementation for performance optimization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpritePool } from '../src/core/spritePool.js';

describe('SpritePool', () => {
  let mockScene;
  let spritePool;
  let spriteCounter;

  beforeEach(() => {
    spriteCounter = { circles: 0, texts: 0, rectangles: 0, graphics: 0 };

    mockScene = {
      add: {
        circle: vi.fn((x, y, radius, fillColor, alpha) => {
          const sprite = {
            type: 'Circle',
            id: `circle_${spriteCounter.circles++}`,
            x, y, radius, fillColor, alpha,
            visible: true,
            setPosition: vi.fn(function(newX, newY) { this.x = newX; this.y = newY; return this; }),
            setRadius: vi.fn(function(r) { this.radius = r; return this; }),
            setFillStyle: vi.fn(function(color, a) { this.fillColor = color; this.alpha = a; return this; }),
            setVisible: vi.fn(function(v) { this.visible = v; return this; }),
            destroy: vi.fn()
          };
          return sprite;
        }),
        text: vi.fn((x, y, text, style) => {
          const sprite = {
            type: 'Text',
            id: `text_${spriteCounter.texts++}`,
            x, y, text, style,
            visible: true,
            setPosition: vi.fn(function(newX, newY) { this.x = newX; this.y = newY; return this; }),
            setText: vi.fn(function(t) { this.text = t; return this; }),
            setStyle: vi.fn(function(s) { this.style = s; return this; }),
            setVisible: vi.fn(function(v) { this.visible = v; return this; }),
            destroy: vi.fn()
          };
          return sprite;
        }),
        rectangle: vi.fn((x, y, width, height, fillColor, alpha) => {
          const sprite = {
            type: 'Rectangle',
            id: `rect_${spriteCounter.rectangles++}`,
            x, y, width, height, fillColor, alpha,
            visible: true,
            setPosition: vi.fn(function(newX, newY) { this.x = newX; this.y = newY; return this; }),
            setSize: vi.fn(function(w, h) { this.width = w; this.height = h; return this; }),
            setFillStyle: vi.fn(function(color, a) { this.fillColor = color; this.alpha = a; return this; }),
            setVisible: vi.fn(function(v) { this.visible = v; return this; }),
            destroy: vi.fn()
          };
          return sprite;
        }),
        graphics: vi.fn(() => {
          const sprite = {
            type: 'Graphics',
            id: `graphics_${spriteCounter.graphics++}`,
            visible: true,
            clear: vi.fn(function() { return this; }),
            setVisible: vi.fn(function(v) { this.visible = v; return this; }),
            destroy: vi.fn()
          };
          return sprite;
        })
      }
    };

    spritePool = new SpritePool(mockScene);
  });

  /**
   * **Validates: Requirement 25.5**
   * 
   * Test that sprite pool creates new sprites when pool is empty
   */
  it('should create new sprites when pool is empty', () => {
    const circle = spritePool.getCircle(100, 100, 20, 0xff0000, 1);
    const text = spritePool.getText(100, 100, 'Test', {});
    const rect = spritePool.getRectangle(100, 100, 50, 50, 0x00ff00, 1);
    const graphics = spritePool.getGraphics();

    expect(mockScene.add.circle).toHaveBeenCalledTimes(1);
    expect(mockScene.add.text).toHaveBeenCalledTimes(1);
    expect(mockScene.add.rectangle).toHaveBeenCalledTimes(1);
    expect(mockScene.add.graphics).toHaveBeenCalledTimes(1);

    expect(circle.type).toBe('Circle');
    expect(text.type).toBe('Text');
    expect(rect.type).toBe('Rectangle');
    expect(graphics.type).toBe('Graphics');
  });

  /**
   * **Validates: Requirement 25.5**
   * 
   * Test that sprites are reused from pool instead of creating new ones
   */
  it('should reuse sprites from pool', () => {
    // Create and release a circle
    const circle1 = spritePool.getCircle(100, 100, 20, 0xff0000, 1);
    spritePool.release(circle1);

    // Get another circle - should reuse the first one
    const circle2 = spritePool.getCircle(200, 200, 30, 0x00ff00, 0.5);

    // Should not create a new sprite
    expect(mockScene.add.circle).toHaveBeenCalledTimes(1);
    
    // Should be the same sprite
    expect(circle2.id).toBe(circle1.id);
    
    // Should update properties
    expect(circle2.setPosition).toHaveBeenCalledWith(200, 200);
    expect(circle2.setRadius).toHaveBeenCalledWith(30);
    expect(circle2.setFillStyle).toHaveBeenCalledWith(0x00ff00, 0.5);
    expect(circle2.setVisible).toHaveBeenCalledWith(true);
  });

  /**
   * **Validates: Requirement 25.5**
   * 
   * Test that released sprites are hidden
   */
  it('should hide released sprites', () => {
    const circle = spritePool.getCircle(100, 100, 20, 0xff0000, 1);
    
    expect(circle.visible).toBe(true);
    
    spritePool.release(circle);
    
    expect(circle.setVisible).toHaveBeenCalledWith(false);
  });

  /**
   * **Validates: Requirement 25.5**
   * 
   * Test that multiple sprites can be released at once
   */
  it('should release multiple sprites at once', () => {
    const sprites = [
      spritePool.getCircle(100, 100, 20, 0xff0000, 1),
      spritePool.getText(100, 100, 'Test', {}),
      spritePool.getRectangle(100, 100, 50, 50, 0x00ff00, 1)
    ];

    spritePool.releaseAll(sprites);

    sprites.forEach(sprite => {
      expect(sprite.setVisible).toHaveBeenCalledWith(false);
    });
  });

  /**
   * **Validates: Requirement 25.2**
   * 
   * Test that pool tracks active sprites correctly
   */
  it('should track active sprites', () => {
    const circle1 = spritePool.getCircle(100, 100, 20, 0xff0000, 1);
    const circle2 = spritePool.getCircle(200, 200, 20, 0xff0000, 1);
    
    let stats = spritePool.getStats();
    expect(stats.totalActive).toBe(2);

    spritePool.release(circle1);
    
    stats = spritePool.getStats();
    expect(stats.totalActive).toBe(1);

    spritePool.release(circle2);
    
    stats = spritePool.getStats();
    expect(stats.totalActive).toBe(0);
  });

  /**
   * **Validates: Requirement 25.5**
   * 
   * Test that pool can handle multiple sprite types
   */
  it('should manage multiple sprite types independently', () => {
    // Create sprites of each type
    const circle = spritePool.getCircle(100, 100, 20, 0xff0000, 1);
    const text = spritePool.getText(100, 100, 'Test', {});
    const rect = spritePool.getRectangle(100, 100, 50, 50, 0x00ff00, 1);
    const graphics = spritePool.getGraphics();

    // Release all
    spritePool.releaseAll([circle, text, rect, graphics]);

    // Get new sprites - should reuse
    spritePool.getCircle(0, 0, 10, 0x000000, 1);
    spritePool.getText(0, 0, 'New', {});
    spritePool.getRectangle(0, 0, 10, 10, 0x000000, 1);
    spritePool.getGraphics();

    // Should not create new sprites
    expect(mockScene.add.circle).toHaveBeenCalledTimes(1);
    expect(mockScene.add.text).toHaveBeenCalledTimes(1);
    expect(mockScene.add.rectangle).toHaveBeenCalledTimes(1);
    expect(mockScene.add.graphics).toHaveBeenCalledTimes(1);
  });

  /**
   * **Validates: Requirement 25.5**
   * 
   * Test that destroy cleans up all sprites
   */
  it('should destroy all sprites on cleanup', () => {
    const circle = spritePool.getCircle(100, 100, 20, 0xff0000, 1);
    const text = spritePool.getText(100, 100, 'Test', {});
    
    spritePool.release(circle);
    spritePool.release(text);

    spritePool.destroy();

    expect(circle.destroy).toHaveBeenCalled();
    expect(text.destroy).toHaveBeenCalled();
    
    const stats = spritePool.getStats();
    expect(stats.circles.total).toBe(0);
    expect(stats.texts.total).toBe(0);
    expect(stats.totalActive).toBe(0);
  });

  /**
   * **Validates: Requirement 25.2**
   * 
   * Test pool statistics accuracy
   */
  it('should provide accurate pool statistics', () => {
    // Create 3 circles
    const c1 = spritePool.getCircle(0, 0, 10, 0xff0000, 1);
    const c2 = spritePool.getCircle(0, 0, 10, 0xff0000, 1);
    const c3 = spritePool.getCircle(0, 0, 10, 0xff0000, 1);

    // Release 2
    spritePool.release(c1);
    spritePool.release(c2);

    const stats = spritePool.getStats();
    
    expect(stats.circles.total).toBe(3);
    expect(stats.circles.active).toBe(1);
    expect(stats.totalActive).toBe(1);
  });

  /**
   * **Validates: Requirement 25.5**
   * 
   * Test that graphics objects are cleared when reused
   */
  it('should clear graphics objects when reused', () => {
    const g1 = spritePool.getGraphics();
    spritePool.release(g1);

    const g2 = spritePool.getGraphics();

    expect(g2.clear).toHaveBeenCalled();
    expect(g2.id).toBe(g1.id); // Same object reused
  });

  /**
   * **Validates: Requirement 25.2**
   * 
   * Test performance improvement with pooling
   */
  it('should reduce allocation overhead with pooling', () => {
    const iterations = 100;
    
    // Measure time with pooling
    const startPooling = performance.now();
    for (let i = 0; i < iterations; i++) {
      const sprite = spritePool.getCircle(i, i, 10, 0xff0000, 1);
      spritePool.release(sprite);
    }
    const endPooling = performance.now();
    const poolingTime = endPooling - startPooling;

    // Should only create 1 sprite (reused 100 times)
    expect(mockScene.add.circle).toHaveBeenCalledTimes(1);
    
    console.log(`Pooling time for ${iterations} iterations: ${poolingTime.toFixed(2)}ms`);
    
    // Should be very fast
    expect(poolingTime).toBeLessThan(50);
  });
});
