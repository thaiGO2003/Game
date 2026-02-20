/**
 * Shop System Tier Odds Integration Test
 * 
 * Validates Requirements 16.1, 16.2, 16.3, 16.4, 16.5:
 * - Shop queries tier odds for current player level
 * - Handles levels beyond 25 by using level 25 odds as fallback
 * - Shop displays correct tier distribution
 */

import { describe, it, expect } from 'vitest';
import { rollTierForLevel } from '../src/core/gameUtils.js';

describe('Shop System Tier Odds Integration', () => {
  /**
   * Requirement 16.1: Shop queries tier odds from Progression_System based on player level
   * Requirement 16.2: Shop randomly selects tier for each slot according to tier odds
   */
  it('rollTierForLevel returns valid tier (1-5) for all levels', () => {
    for (let level = 1; level <= 30; level++) {
      const tier = rollTierForLevel(level);
      expect(tier).toBeGreaterThanOrEqual(1);
      expect(tier).toBeLessThanOrEqual(5);
    }
  });

  /**
   * Requirement 16.3: Shop uses updated tier odds for subsequent refreshes
   * Requirement 16.4: Tier distribution matches odds at different levels
   */
  it('rollTierForLevel produces tier distribution matching odds at level 1', () => {
    const samples = 1000;
    const tierCounts = [0, 0, 0, 0, 0];
    
    for (let i = 0; i < samples; i++) {
      const tier = rollTierForLevel(1);
      tierCounts[tier - 1]++;
    }
    
    // Level 1 should have 100% tier 1 odds
    expect(tierCounts[0]).toBe(samples); // All tier 1
    expect(tierCounts[1]).toBe(0); // No tier 2
    expect(tierCounts[2]).toBe(0); // No tier 3
    expect(tierCounts[3]).toBe(0); // No tier 4
    expect(tierCounts[4]).toBe(0); // No tier 5
  });

  it('rollTierForLevel produces tier distribution matching odds at level 25', () => {
    const samples = 10000;
    const tierCounts = [0, 0, 0, 0, 0];
    
    for (let i = 0; i < samples; i++) {
      const tier = rollTierForLevel(25);
      tierCounts[tier - 1]++;
    }
    
    // Level 25 should have [0, 0, 0.02, 0.08, 0.90] odds
    // Allow for statistical variance (±5%)
    expect(tierCounts[0]).toBe(0); // No tier 1
    expect(tierCounts[1]).toBe(0); // No tier 2
    expect(tierCounts[2] / samples).toBeCloseTo(0.02, 1); // ~2% tier 3
    expect(tierCounts[3] / samples).toBeCloseTo(0.08, 1); // ~8% tier 4
    expect(tierCounts[4] / samples).toBeCloseTo(0.90, 1); // ~90% tier 5
  });

  /**
   * Requirement 16.5: Handles levels beyond 25 by using level 25 odds as fallback
   * 
   * This is the CRITICAL requirement for task 7.7
   */
  it('rollTierForLevel uses level 25 odds as fallback for levels beyond 25', () => {
    const samples = 10000;
    
    // Test level 26
    const tierCounts26 = [0, 0, 0, 0, 0];
    for (let i = 0; i < samples; i++) {
      const tier = rollTierForLevel(26);
      tierCounts26[tier - 1]++;
    }
    
    // Test level 30
    const tierCounts30 = [0, 0, 0, 0, 0];
    for (let i = 0; i < samples; i++) {
      const tier = rollTierForLevel(30);
      tierCounts30[tier - 1]++;
    }
    
    // Test level 100
    const tierCounts100 = [0, 0, 0, 0, 0];
    for (let i = 0; i < samples; i++) {
      const tier = rollTierForLevel(100);
      tierCounts100[tier - 1]++;
    }
    
    // All should match level 25 odds: [0, 0, 0.02, 0.08, 0.90]
    // Allow for statistical variance (±5%)
    
    // Level 26
    expect(tierCounts26[0]).toBe(0);
    expect(tierCounts26[1]).toBe(0);
    expect(tierCounts26[2] / samples).toBeCloseTo(0.02, 1);
    expect(tierCounts26[3] / samples).toBeCloseTo(0.08, 1);
    expect(tierCounts26[4] / samples).toBeCloseTo(0.90, 1);
    
    // Level 30
    expect(tierCounts30[0]).toBe(0);
    expect(tierCounts30[1]).toBe(0);
    expect(tierCounts30[2] / samples).toBeCloseTo(0.02, 1);
    expect(tierCounts30[3] / samples).toBeCloseTo(0.08, 1);
    expect(tierCounts30[4] / samples).toBeCloseTo(0.90, 1);
    
    // Level 100
    expect(tierCounts100[0]).toBe(0);
    expect(tierCounts100[1]).toBe(0);
    expect(tierCounts100[2] / samples).toBeCloseTo(0.02, 1);
    expect(tierCounts100[3] / samples).toBeCloseTo(0.08, 1);
    expect(tierCounts100[4] / samples).toBeCloseTo(0.90, 1);
  });

  /**
   * Requirement 16.4: Verify tier distribution changes as level increases
   */
  it('tier 5 odds increase significantly from level 1 to level 25', () => {
    const samples = 5000;
    
    // Level 1: 0% tier 5
    let tier5Count = 0;
    for (let i = 0; i < samples; i++) {
      if (rollTierForLevel(1) === 5) tier5Count++;
    }
    expect(tier5Count).toBe(0);
    
    // Level 10: 30% tier 5
    tier5Count = 0;
    for (let i = 0; i < samples; i++) {
      if (rollTierForLevel(10) === 5) tier5Count++;
    }
    expect(tier5Count / samples).toBeCloseTo(0.30, 1);
    
    // Level 25: 90% tier 5
    tier5Count = 0;
    for (let i = 0; i < samples; i++) {
      if (rollTierForLevel(25) === 5) tier5Count++;
    }
    expect(tier5Count / samples).toBeCloseTo(0.90, 1);
  });

  /**
   * Edge case: Verify behavior at boundary levels
   */
  it('handles boundary levels correctly', () => {
    // Level 0 should be clamped to level 1
    const tier0 = rollTierForLevel(0);
    expect(tier0).toBeGreaterThanOrEqual(1);
    expect(tier0).toBeLessThanOrEqual(5);
    
    // Negative level should be clamped to level 1
    const tierNeg = rollTierForLevel(-5);
    expect(tierNeg).toBeGreaterThanOrEqual(1);
    expect(tierNeg).toBeLessThanOrEqual(5);
    
    // Very high level should use level 25 odds
    const tier1000 = rollTierForLevel(1000);
    expect(tier1000).toBeGreaterThanOrEqual(1);
    expect(tier1000).toBeLessThanOrEqual(5);
  });
});
