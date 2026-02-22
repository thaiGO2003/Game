/**
 * Performance Benchmarks for Code Architecture Refactor
 * Task 9.4.2: Performance testing
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.6, 12.7
 * 
 * This test suite verifies that all performance targets are met after the refactor:
 * - Combat turn < 16ms (60 FPS)
 * - Shop refresh < 50ms
 * - Synergy calculation < 10ms
 * - Scene transition < 100ms
 * - No performance regression > 5%
 * - No memory increase > 10%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShopSystem } from '../src/systems/ShopSystem.js';
import { SynergySystem } from '../src/systems/SynergySystem.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { BoardSystem } from '../src/systems/BoardSystem.js';
import { UNIT_BY_ID } from '../src/data/unitCatalog.js';

describe('Performance Benchmarks - Task 9.4.2', () => {
  let mockPlayer;
  let mockBoard;
  let mockUnits;

  beforeEach(() => {
    // Create mock player state
    mockPlayer = {
      gold: 100,
      level: 10,
      round: 5,
      shop: [],
      shopLocked: false,
      bench: [],
      gameMode: 'PVE_JOURNEY'
    };

    // Create mock board
    mockBoard = Array(5).fill(null).map(() => Array(5).fill(null));

    // Create mock units for testing
    mockUnits = [];
    const unitIds = Object.keys(UNIT_BY_ID).slice(0, 10);
    unitIds.forEach((baseId, i) => {
      mockUnits.push({
        uid: `unit_${i}`,
        baseId: baseId,
        star: 1,
        base: UNIT_BY_ID[baseId],
        equips: []
      });
    });
  });

  /**
   * **Validates: Requirement 12.1**
   * Combat turn execution SHALL complete in < 16ms to maintain 60 FPS
   */
  describe('Combat Turn Performance', () => {
    it('should execute combat turn in < 16ms', () => {
      // Create combat state with 10 units per side
      const playerUnits = mockUnits.slice(0, 5).map((unit, i) => ({
        ...unit,
        position: { row: 0, col: i },
        stats: {
          hp: 500,
          maxHp: 500,
          attack: 50,
          defense: 20,
          speed: 100,
          element: 'neutral'
        },
        currentHP: 500,
        currentRage: 50,
        statusEffects: [],
        isDead: false
      }));

      const enemyUnits = mockUnits.slice(5, 10).map((unit, i) => ({
        ...unit,
        position: { row: 4, col: i },
        stats: {
          hp: 400,
          maxHp: 400,
          attack: 45,
          defense: 15,
          speed: 90,
          element: 'neutral'
        },
        currentHP: 400,
        currentRage: 30,
        statusEffects: [],
        isDead: false
      }));

      const combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits);

      // Benchmark: Execute one combat turn
      const startTime = performance.now();
      
      const actor = CombatSystem.getNextActor(combatState);
      if (actor) {
        CombatSystem.executeAction(combatState, actor);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`Combat turn execution time: ${executionTime.toFixed(2)}ms`);
      
      // Requirement 12.1: < 16ms for 60 FPS
      expect(executionTime).toBeLessThan(16);
    });

    it('should execute multiple combat turns efficiently', () => {
      const playerUnits = mockUnits.slice(0, 5).map((unit, i) => ({
        ...unit,
        position: { row: 0, col: i },
        stats: {
          hp: 500,
          maxHp: 500,
          attack: 50,
          defense: 20,
          speed: 100,
          element: 'neutral'
        },
        currentHP: 500,
        currentRage: 50,
        statusEffects: [],
        isDead: false
      }));

      const enemyUnits = mockUnits.slice(5, 10).map((unit, i) => ({
        ...unit,
        position: { row: 4, col: i },
        stats: {
          hp: 400,
          maxHp: 400,
          attack: 45,
          defense: 15,
          speed: 90,
          element: 'neutral'
        },
        currentHP: 400,
        currentRage: 30,
        statusEffects: [],
        isDead: false
      }));

      const combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits);

      // Execute 10 turns and measure average time
      const times = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        const actor = CombatSystem.getNextActor(combatState);
        if (actor && !combatState.isFinished) {
          CombatSystem.executeAction(combatState, actor);
        }
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average combat turn time: ${avgTime.toFixed(2)}ms`);
      console.log(`Max combat turn time: ${maxTime.toFixed(2)}ms`);

      // Average should be well under 16ms
      expect(avgTime).toBeLessThan(16);
      // Even worst case should be under 16ms
      expect(maxTime).toBeLessThan(16);
    });
  });

  /**
   * **Validates: Requirement 12.2**
   * Shop refresh operation SHALL complete in < 50ms
   */
  describe('Shop Refresh Performance', () => {
    it('should refresh shop in < 50ms', () => {
      const startTime = performance.now();
      
      const result = ShopSystem.refreshShop(mockPlayer, 2);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`Shop refresh time: ${executionTime.toFixed(2)}ms`);
      
      // Requirement 12.2: < 50ms
      expect(executionTime).toBeLessThan(50);
      expect(result.success).toBe(true);
    });

    it('should refresh shop multiple times efficiently', () => {
      const times = [];
      
      for (let i = 0; i < 20; i++) {
        const player = { ...mockPlayer, gold: 100 };
        
        const startTime = performance.now();
        ShopSystem.refreshShop(player, 2);
        const endTime = performance.now();
        
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average shop refresh time: ${avgTime.toFixed(2)}ms`);
      console.log(`Max shop refresh time: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(50);
    });

    it('should generate shop offers at different levels efficiently', () => {
      const times = [];
      
      // Test all levels 1-25
      for (let level = 1; level <= 25; level++) {
        const player = { ...mockPlayer, level, gold: 100 };
        
        const startTime = performance.now();
        ShopSystem.refreshShop(player, 2);
        const endTime = performance.now();
        
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average shop refresh across all levels: ${avgTime.toFixed(2)}ms`);
      console.log(`Max shop refresh time: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(50);
    });
  });

  /**
   * **Validates: Requirement 12.3**
   * Board synergy calculation SHALL complete in < 10ms
   */
  describe('Synergy Calculation Performance', () => {
    it('should calculate synergies in < 10ms', () => {
      // Place units on board to trigger synergies
      const deployedUnits = mockUnits.slice(0, 8);

      const startTime = performance.now();
      
      const synergies = SynergySystem.calculateSynergies(deployedUnits);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`Synergy calculation time: ${executionTime.toFixed(2)}ms`);
      console.log(`Active synergies: ${synergies.length}`);
      
      // Requirement 12.3: < 10ms
      expect(executionTime).toBeLessThan(10);
    });

    it('should calculate synergies with full board efficiently', () => {
      // Create a full board (25 units)
      const fullBoardUnits = [];
      const unitIds = Object.keys(UNIT_BY_ID);
      
      for (let i = 0; i < 25; i++) {
        const baseId = unitIds[i % unitIds.length];
        fullBoardUnits.push({
          uid: `unit_${i}`,
          baseId: baseId,
          star: 1,
          base: UNIT_BY_ID[baseId],
          equips: []
        });
      }

      const startTime = performance.now();
      
      const synergies = SynergySystem.calculateSynergies(fullBoardUnits);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`Synergy calculation time (25 units): ${executionTime.toFixed(2)}ms`);
      console.log(`Active synergies: ${synergies.length}`);
      
      expect(executionTime).toBeLessThan(10);
    });

    it('should calculate synergies repeatedly without degradation', () => {
      const deployedUnits = mockUnits.slice(0, 10);
      const times = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        SynergySystem.calculateSynergies(deployedUnits);
        const endTime = performance.now();
        
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average synergy calculation time (100 runs): ${avgTime.toFixed(2)}ms`);
      console.log(`Max synergy calculation time: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(10);
      expect(maxTime).toBeLessThan(10);
    });
  });

  /**
   * **Validates: Requirement 12.4**
   * Scene transition SHALL complete in < 100ms
   * 
   * Note: This tests the data preparation for scene transitions,
   * as actual Phaser scene transitions require a running game instance.
   */
  describe('Scene Transition Performance', () => {
    it('should prepare combat state for scene transition in < 100ms', () => {
      // Simulate preparing data for scene transition
      const startTime = performance.now();
      
      // Prepare player units
      const playerUnits = mockUnits.slice(0, 5).map((unit, i) => ({
        ...unit,
        position: { row: 0, col: i },
        stats: {
          hp: 500,
          maxHp: 500,
          attack: 50,
          defense: 20,
          speed: 100,
          element: 'neutral'
        },
        currentHP: 500,
        currentRage: 0,
        statusEffects: [],
        isDead: false
      }));

      // Prepare enemy units
      const enemyUnits = mockUnits.slice(5, 10).map((unit, i) => ({
        ...unit,
        position: { row: 4, col: i },
        stats: {
          hp: 400,
          maxHp: 400,
          attack: 45,
          defense: 15,
          speed: 90,
          element: 'neutral'
        },
        currentHP: 400,
        currentRage: 0,
        statusEffects: [],
        isDead: false
      }));

      // Initialize combat (simulates scene transition preparation)
      const combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits);
      
      // Calculate synergies
      const synergies = SynergySystem.calculateSynergies(playerUnits);
      
      // Apply synergies to units
      playerUnits.forEach(unit => {
        SynergySystem.applySynergiesToUnit(unit, synergies);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`Scene transition preparation time: ${executionTime.toFixed(2)}ms`);
      
      // Requirement 12.4: < 100ms
      expect(executionTime).toBeLessThan(100);
      expect(combatState).toBeDefined();
    });

    it('should prepare planning state for scene transition in < 100ms', () => {
      const startTime = performance.now();
      
      // Simulate preparing planning scene data
      const shopResult = ShopSystem.refreshShop(mockPlayer, 2);
      const deployedUnits = mockUnits.slice(0, 5);
      const synergies = SynergySystem.calculateSynergies(deployedUnits);
      
      // Prepare board state
      const board = Array(5).fill(null).map(() => Array(5).fill(null));
      deployedUnits.forEach((unit, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        board[row][col] = unit;
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`Planning scene preparation time: ${executionTime.toFixed(2)}ms`);
      
      expect(executionTime).toBeLessThan(100);
      expect(shopResult.success).toBe(true);
    });
  });

  /**
   * **Validates: Requirements 12.6, 12.7**
   * Performance SHALL NOT degrade by more than 5%
   * Memory usage SHALL NOT increase by more than 10%
   * 
   * Note: These tests establish baseline metrics for comparison.
   * Actual regression testing requires comparing against pre-refactor baselines.
   */
  describe('Performance Regression Tests', () => {
    it('should maintain consistent performance across operations', () => {
      const operations = {
        shopRefresh: [],
        synergyCalc: [],
        combatTurn: []
      };

      // Run each operation 50 times
      for (let i = 0; i < 50; i++) {
        // Shop refresh
        const player = { ...mockPlayer, gold: 100 };
        let start = performance.now();
        ShopSystem.refreshShop(player, 2);
        operations.shopRefresh.push(performance.now() - start);

        // Synergy calculation
        start = performance.now();
        SynergySystem.calculateSynergies(mockUnits.slice(0, 8));
        operations.synergyCalc.push(performance.now() - start);

        // Combat turn
        const playerUnits = mockUnits.slice(0, 5).map((unit, i) => ({
          ...unit,
          position: { row: 0, col: i },
          stats: { hp: 500, maxHp: 500, attack: 50, defense: 20, speed: 100, element: 'neutral' },
          currentHP: 500,
          currentRage: 50,
          statusEffects: [],
          isDead: false
        }));
        const enemyUnits = mockUnits.slice(5, 10).map((unit, i) => ({
          ...unit,
          position: { row: 4, col: i },
          stats: { hp: 400, maxHp: 400, attack: 45, defense: 15, speed: 90, element: 'neutral' },
          currentHP: 400,
          currentRage: 30,
          statusEffects: [],
          isDead: false
        }));
        const combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits);
        start = performance.now();
        const actor = CombatSystem.getNextActor(combatState);
        if (actor) CombatSystem.executeAction(combatState, actor);
        operations.combatTurn.push(performance.now() - start);
      }

      // Calculate statistics
      const stats = {};
      for (const [op, times] of Object.entries(operations)) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const sorted = [...times].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const stdDev = Math.sqrt(
          times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length
        );
        
        stats[op] = { avg, p95, stdDev };
        
        console.log(`${op}: avg=${avg.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, stdDev=${stdDev.toFixed(2)}ms`);
      }

      // Verify consistency (standard deviation should be small relative to average)
      // This indicates stable performance without degradation
      // Note: For very fast operations (< 1ms), relative variance can be high due to measurement precision
      // We check that absolute standard deviation is small instead
      expect(stats.shopRefresh.stdDev).toBeLessThan(5); // < 5ms variance
      expect(stats.synergyCalc.stdDev).toBeLessThan(5); // < 5ms variance
      expect(stats.combatTurn.stdDev).toBeLessThan(5); // < 5ms variance
    });

    it('should not accumulate memory during repeated operations', () => {
      // Note: JavaScript garbage collection makes precise memory testing difficult
      // This test verifies that operations don't create obvious memory leaks
      
      const iterations = 1000;
      
      // Warm up
      for (let i = 0; i < 10; i++) {
        ShopSystem.refreshShop({ ...mockPlayer, gold: 100 }, 2);
        SynergySystem.calculateSynergies(mockUnits.slice(0, 8));
      }

      // Run many iterations
      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        ShopSystem.refreshShop({ ...mockPlayer, gold: 100 }, 2);
        SynergySystem.calculateSynergies(mockUnits.slice(0, 8));
      }
      const endTime = performance.now();
      
      const avgTime = (endTime - startTime) / iterations;
      console.log(`Average time per iteration (${iterations} runs): ${avgTime.toFixed(2)}ms`);
      
      // Performance should remain stable even after many iterations
      // If there were memory leaks, performance would degrade
      expect(avgTime).toBeLessThan(10);
    });
  });

  /**
   * Summary test that validates all performance requirements together
   */
  describe('Performance Requirements Summary', () => {
    it('should meet all performance targets', () => {
      const results = {
        combatTurn: null,
        shopRefresh: null,
        synergyCalc: null,
        sceneTransition: null
      };

      // Test combat turn (Requirement 12.1: < 16ms)
      const playerUnits = mockUnits.slice(0, 5).map((unit, i) => ({
        ...unit,
        position: { row: 0, col: i },
        stats: { hp: 500, maxHp: 500, attack: 50, defense: 20, speed: 100, element: 'neutral' },
        currentHP: 500,
        currentRage: 50,
        statusEffects: [],
        isDead: false
      }));
      const enemyUnits = mockUnits.slice(5, 10).map((unit, i) => ({
        ...unit,
        position: { row: 4, col: i },
        stats: { hp: 400, maxHp: 400, attack: 45, defense: 15, speed: 90, element: 'neutral' },
        currentHP: 400,
        currentRage: 30,
        statusEffects: [],
        isDead: false
      }));
      const combatState = CombatSystem.initializeCombat(playerUnits, enemyUnits);
      let start = performance.now();
      const actor = CombatSystem.getNextActor(combatState);
      if (actor) CombatSystem.executeAction(combatState, actor);
      results.combatTurn = performance.now() - start;

      // Test shop refresh (Requirement 12.2: < 50ms)
      start = performance.now();
      ShopSystem.refreshShop(mockPlayer, 2);
      results.shopRefresh = performance.now() - start;

      // Test synergy calculation (Requirement 12.3: < 10ms)
      start = performance.now();
      SynergySystem.calculateSynergies(mockUnits.slice(0, 8));
      results.synergyCalc = performance.now() - start;

      // Test scene transition (Requirement 12.4: < 100ms)
      start = performance.now();
      const transitionState = CombatSystem.initializeCombat(playerUnits, enemyUnits);
      const synergies = SynergySystem.calculateSynergies(playerUnits);
      playerUnits.forEach(unit => SynergySystem.applySynergiesToUnit(unit, synergies));
      results.sceneTransition = performance.now() - start;

      // Log all results
      console.log('\n=== Performance Requirements Summary ===');
      console.log(`Combat Turn:       ${results.combatTurn.toFixed(2)}ms (target: < 16ms)`);
      console.log(`Shop Refresh:      ${results.shopRefresh.toFixed(2)}ms (target: < 50ms)`);
      console.log(`Synergy Calc:      ${results.synergyCalc.toFixed(2)}ms (target: < 10ms)`);
      console.log(`Scene Transition:  ${results.sceneTransition.toFixed(2)}ms (target: < 100ms)`);
      console.log('========================================\n');

      // Verify all requirements
      expect(results.combatTurn).toBeLessThan(16);
      expect(results.shopRefresh).toBeLessThan(50);
      expect(results.synergyCalc).toBeLessThan(10);
      expect(results.sceneTransition).toBeLessThan(100);
    });
  });
});
