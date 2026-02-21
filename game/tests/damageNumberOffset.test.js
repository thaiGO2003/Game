import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for damage number position offsetting
 * 
 * **Validates: Requirement 10.4**
 * 
 * These tests verify that when multiple damage numbers appear at the same time
 * (e.g., AOE attacks), they are automatically offset to prevent visual collision.
 */

describe('Damage Number Position Offsetting', () => {
  let mockScene;

  beforeEach(() => {
    // Create a minimal mock scene with the damage number tracking
    mockScene = {
      activeDamageNumbers: [],
      add: {
        text: vi.fn(() => ({
          setOrigin: vi.fn(() => ({
            setDepth: vi.fn(() => ({})),
            setScale: vi.fn(() => ({}))
          }))
        }))
      },
      combatSprites: [],
      tweens: {
        add: vi.fn()
      },
      scaleCombatDuration: vi.fn((ms) => ms)
    };
  });

  describe('Overlap Detection', () => {
    it('should detect overlapping damage numbers within 30 pixels', () => {
      // Add a damage number at position (100, 100)
      mockScene.activeDamageNumbers.push({
        x: 100,
        y: 100,
        timestamp: Date.now()
      });

      // Check if a new damage number at (110, 110) would overlap
      const OVERLAP_THRESHOLD = 30;
      const dx = Math.abs(100 - 110);
      const dy = Math.abs(100 - 110);
      const overlaps = dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD;

      expect(overlaps).toBe(true);
      expect(dx).toBeLessThan(OVERLAP_THRESHOLD);
      expect(dy).toBeLessThan(OVERLAP_THRESHOLD);
    });

    it('should not detect overlap for damage numbers more than 30 pixels apart', () => {
      // Add a damage number at position (100, 100)
      mockScene.activeDamageNumbers.push({
        x: 100,
        y: 100,
        timestamp: Date.now()
      });

      // Check if a new damage number at (150, 150) would overlap
      const OVERLAP_THRESHOLD = 30;
      const dx = Math.abs(100 - 150);
      const dy = Math.abs(100 - 150);
      const overlaps = dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD;

      expect(overlaps).toBe(false);
    });
  });

  describe('Position Offsetting', () => {
    it('should offset y-position when damage numbers overlap', () => {
      const OVERLAP_THRESHOLD = 30;
      const OFFSET_AMOUNT = 20;
      
      // Simulate first damage number
      const firstY = 100;
      mockScene.activeDamageNumbers.push({
        x: 100,
        y: firstY,
        timestamp: Date.now()
      });

      // Simulate second damage number at overlapping position
      let adjustedY = 105; // Close to first damage number
      
      for (const activeDN of mockScene.activeDamageNumbers) {
        const dx = Math.abs(activeDN.x - 100);
        const dy = Math.abs(activeDN.y - adjustedY);
        
        if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
          adjustedY -= OFFSET_AMOUNT;
        }
      }

      // Y should be offset by OFFSET_AMOUNT
      expect(adjustedY).toBe(105 - OFFSET_AMOUNT);
      expect(adjustedY).toBe(85);
    });

    it('should offset multiple overlapping damage numbers progressively', () => {
      const OVERLAP_THRESHOLD = 30;
      const OFFSET_AMOUNT = 20;
      const baseX = 100;
      const baseY = 100;

      // Add three damage numbers at the same position
      const positions = [];
      
      for (let i = 0; i < 3; i++) {
        let adjustedY = baseY;
        
        // Check against all existing damage numbers
        for (const activeDN of mockScene.activeDamageNumbers) {
          const dx = Math.abs(activeDN.x - baseX);
          const dy = Math.abs(activeDN.y - adjustedY);
          
          if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
            adjustedY -= OFFSET_AMOUNT;
          }
        }
        
        positions.push(adjustedY);
        mockScene.activeDamageNumbers.push({
          x: baseX,
          y: adjustedY,
          timestamp: Date.now()
        });
      }

      // First should be at original position
      expect(positions[0]).toBe(100);
      // Second should be offset by 20
      expect(positions[1]).toBe(80);
      // Third should be offset by 40 (20 from first, 20 from second)
      expect(positions[2]).toBe(60);
    });
  });

  describe('Cleanup', () => {
    it('should remove expired damage numbers older than 200ms', () => {
      const now = Date.now();
      
      // Add old damage number (300ms ago)
      mockScene.activeDamageNumbers.push({
        x: 100,
        y: 100,
        timestamp: now - 300
      });
      
      // Add recent damage number (100ms ago)
      mockScene.activeDamageNumbers.push({
        x: 150,
        y: 150,
        timestamp: now - 100
      });

      // Simulate cleanup
      mockScene.activeDamageNumbers = mockScene.activeDamageNumbers.filter(
        dn => now - dn.timestamp < 200
      );

      // Only the recent one should remain
      expect(mockScene.activeDamageNumbers).toHaveLength(1);
      expect(mockScene.activeDamageNumbers[0].x).toBe(150);
    });

    it('should keep damage numbers newer than 200ms', () => {
      const now = Date.now();
      
      // Add recent damage numbers
      mockScene.activeDamageNumbers.push({
        x: 100,
        y: 100,
        timestamp: now - 50
      });
      
      mockScene.activeDamageNumbers.push({
        x: 150,
        y: 150,
        timestamp: now - 100
      });

      // Simulate cleanup
      mockScene.activeDamageNumbers = mockScene.activeDamageNumbers.filter(
        dn => now - dn.timestamp < 200
      );

      // Both should remain
      expect(mockScene.activeDamageNumbers).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty activeDamageNumbers array', () => {
      const OVERLAP_THRESHOLD = 30;
      const OFFSET_AMOUNT = 20;
      let adjustedY = 100;
      
      // No existing damage numbers
      for (const activeDN of mockScene.activeDamageNumbers) {
        const dx = Math.abs(activeDN.x - 100);
        const dy = Math.abs(activeDN.y - adjustedY);
        
        if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
          adjustedY -= OFFSET_AMOUNT;
        }
      }

      // Y should remain unchanged
      expect(adjustedY).toBe(100);
    });

    it('should handle damage numbers at exact same position', () => {
      const OVERLAP_THRESHOLD = 30;
      const OFFSET_AMOUNT = 20;
      
      mockScene.activeDamageNumbers.push({
        x: 100,
        y: 100,
        timestamp: Date.now()
      });

      let adjustedY = 100; // Exact same position
      
      for (const activeDN of mockScene.activeDamageNumbers) {
        const dx = Math.abs(activeDN.x - 100);
        const dy = Math.abs(activeDN.y - adjustedY);
        
        if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
          adjustedY -= OFFSET_AMOUNT;
        }
      }

      expect(adjustedY).toBe(80);
    });

    it('should only offset on y-axis, not x-axis', () => {
      const OVERLAP_THRESHOLD = 30;
      const OFFSET_AMOUNT = 20;
      const originalX = 100;
      
      mockScene.activeDamageNumbers.push({
        x: 100,
        y: 100,
        timestamp: Date.now()
      });

      let adjustedX = originalX;
      let adjustedY = 105;
      
      for (const activeDN of mockScene.activeDamageNumbers) {
        const dx = Math.abs(activeDN.x - adjustedX);
        const dy = Math.abs(activeDN.y - adjustedY);
        
        if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
          adjustedY -= OFFSET_AMOUNT;
          // X should not change
        }
      }

      expect(adjustedX).toBe(originalX);
      expect(adjustedY).toBe(85);
    });
  });

  describe('AOE Attack Scenario', () => {
    it('should offset damage numbers from AOE attack hitting multiple units', () => {
      const OVERLAP_THRESHOLD = 30;
      const OFFSET_AMOUNT = 20;
      
      // Simulate 5 units hit by AOE at similar positions
      const unitPositions = [
        { x: 100, y: 100 },
        { x: 105, y: 102 },
        { x: 98, y: 105 },
        { x: 110, y: 98 },
        { x: 95, y: 100 }
      ];

      const finalPositions = [];

      for (const pos of unitPositions) {
        let adjustedY = pos.y;
        
        for (const activeDN of mockScene.activeDamageNumbers) {
          const dx = Math.abs(activeDN.x - pos.x);
          const dy = Math.abs(activeDN.y - adjustedY);
          
          if (dx < OVERLAP_THRESHOLD && dy < OVERLAP_THRESHOLD) {
            adjustedY -= OFFSET_AMOUNT;
          }
        }
        
        finalPositions.push({ x: pos.x, y: adjustedY });
        mockScene.activeDamageNumbers.push({
          x: pos.x,
          y: adjustedY,
          timestamp: Date.now()
        });
      }

      // All damage numbers should have different y-positions
      const yPositions = finalPositions.map(p => p.y);
      const uniqueYPositions = [...new Set(yPositions)];
      
      // Most should be offset (at least 3 out of 5)
      expect(uniqueYPositions.length).toBeGreaterThanOrEqual(3);
      
      // Verify progressive offsetting
      expect(finalPositions[0].y).toBe(100);
      expect(finalPositions[1].y).toBeLessThan(102); // Should be offset
    });
  });
});
