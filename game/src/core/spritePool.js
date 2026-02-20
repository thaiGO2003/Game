/**
 * Sprite Pool Manager
 * 
 * Implements object pooling for combat unit sprites to reduce
 * memory allocation overhead and improve performance with 25 units.
 * 
 * Requirements: 25.2, 25.5
 */

export class SpritePool {
  constructor(scene) {
    this.scene = scene;
    this.pools = {
      circles: [],
      texts: [],
      rectangles: [],
      graphics: []
    };
    this.activeSprites = new Set();
  }

  /**
   * Get or create a circle sprite
   */
  getCircle(x, y, radius, fillColor, alpha) {
    let sprite = this.pools.circles.find(s => !this.activeSprites.has(s));
    
    if (!sprite) {
      sprite = this.scene.add.circle(x, y, radius, fillColor, alpha);
      this.pools.circles.push(sprite);
    } else {
      sprite.setPosition(x, y);
      sprite.setRadius(radius);
      sprite.setFillStyle(fillColor, alpha);
      sprite.setVisible(true);
    }
    
    this.activeSprites.add(sprite);
    return sprite;
  }

  /**
   * Get or create a text sprite
   */
  getText(x, y, text, style) {
    let sprite = this.pools.texts.find(s => !this.activeSprites.has(s));
    
    if (!sprite) {
      sprite = this.scene.add.text(x, y, text, style);
      this.pools.texts.push(sprite);
    } else {
      sprite.setPosition(x, y);
      sprite.setText(text);
      sprite.setStyle(style);
      sprite.setVisible(true);
    }
    
    this.activeSprites.add(sprite);
    return sprite;
  }

  /**
   * Get or create a rectangle sprite
   */
  getRectangle(x, y, width, height, fillColor, alpha) {
    let sprite = this.pools.rectangles.find(s => !this.activeSprites.has(s));
    
    if (!sprite) {
      sprite = this.scene.add.rectangle(x, y, width, height, fillColor, alpha);
      this.pools.rectangles.push(sprite);
    } else {
      sprite.setPosition(x, y);
      sprite.setSize(width, height);
      sprite.setFillStyle(fillColor, alpha);
      sprite.setVisible(true);
    }
    
    this.activeSprites.add(sprite);
    return sprite;
  }

  /**
   * Get or create a graphics object
   */
  getGraphics() {
    let sprite = this.pools.graphics.find(s => !this.activeSprites.has(s));
    
    if (!sprite) {
      sprite = this.scene.add.graphics();
      this.pools.graphics.push(sprite);
    } else {
      sprite.clear();
      sprite.setVisible(true);
    }
    
    this.activeSprites.add(sprite);
    return sprite;
  }

  /**
   * Release a sprite back to the pool
   */
  release(sprite) {
    if (!sprite) return;
    
    sprite.setVisible(false);
    this.activeSprites.delete(sprite);
  }

  /**
   * Release multiple sprites at once
   */
  releaseAll(sprites) {
    sprites.forEach(sprite => this.release(sprite));
  }

  /**
   * Clear all pools and destroy sprites
   */
  destroy() {
    // Destroy all pooled sprites
    [...this.pools.circles, ...this.pools.texts, ...this.pools.rectangles, ...this.pools.graphics]
      .forEach(sprite => sprite.destroy());
    
    // Clear pools
    this.pools.circles = [];
    this.pools.texts = [];
    this.pools.rectangles = [];
    this.pools.graphics = [];
    this.activeSprites.clear();
  }

  /**
   * Get pool statistics for debugging
   */
  getStats() {
    return {
      circles: {
        total: this.pools.circles.length,
        active: this.pools.circles.filter(s => this.activeSprites.has(s)).length
      },
      texts: {
        total: this.pools.texts.length,
        active: this.pools.texts.filter(s => this.activeSprites.has(s)).length
      },
      rectangles: {
        total: this.pools.rectangles.length,
        active: this.pools.rectangles.filter(s => this.activeSprites.has(s)).length
      },
      graphics: {
        total: this.pools.graphics.length,
        active: this.pools.graphics.filter(s => this.activeSprites.has(s)).length
      },
      totalActive: this.activeSprites.size
    };
  }
}
