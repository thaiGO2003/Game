import { describe, it, expect } from 'vitest';
import { initializeCombat, getNextActor } from '../src/systems/CombatSystem.js';

/**
 * Unit tests for CombatSystem initialization and turn order
 * Task 3.6.2: Extract combat initialization and turn order
 * Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 4.3
 */

describe('CombatSystem - Initialization and Turn Order', () => {
  describe('initializeCombat', () => {
    it('should initialize combat state with player and enemy units', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', speed: 10, alive: true },
        { uid: 'p2', side: 'LEFT', speed: 8, alive: true }
      ];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', speed: 12, alive: true },
        { uid: 'e2', side: 'RIGHT', speed: 6, alive: true }
      ];

      const state = initializeCombat(playerUnits, enemyUnits);

      expect(state.playerUnits).toHaveLength(2);
      expect(state.enemyUnits).toHaveLength(2);
      expect(state.turnOrder).toHaveLength(4);
      expect(state.currentTurn).toBe(0);
      expect(state.combatLog).toEqual([]);
      expect(state.isFinished).toBe(false);
      expect(state.winner).toBeNull();
    });

    it('should create turn order based on speed (higher speed first)', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', speed: 10, alive: true },
        { uid: 'p2', side: 'LEFT', speed: 5, alive: true }
      ];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', speed: 15, alive: true },
        { uid: 'e2', side: 'RIGHT', speed: 3, alive: true }
      ];

      const state = initializeCombat(playerUnits, enemyUnits);

      // Turn order should interleave player and enemy, sorted by speed within each side
      // Player side sorted: p1 (10), p2 (5)
      // Enemy side sorted: e1 (15), e2 (3)
      // Interleaved: p1, e1, p2, e2
      expect(state.turnOrder[0].uid).toBe('p1');
      expect(state.turnOrder[1].uid).toBe('e1');
      expect(state.turnOrder[2].uid).toBe('p2');
      expect(state.turnOrder[3].uid).toBe('e2');
    });

    it('should handle units with stats.speed property', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', stats: { speed: 10 }, alive: true }
      ];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', stats: { speed: 5 }, alive: true }
      ];

      const state = initializeCombat(playerUnits, enemyUnits);

      expect(state.turnOrder[0].uid).toBe('p1'); // Higher speed first
      expect(state.turnOrder[1].uid).toBe('e1');
    });

    it('should handle empty player units', () => {
      const playerUnits = [];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', speed: 10, alive: true }
      ];

      const state = initializeCombat(playerUnits, enemyUnits);

      expect(state.playerUnits).toHaveLength(0);
      expect(state.enemyUnits).toHaveLength(1);
      expect(state.turnOrder).toHaveLength(1);
      expect(state.turnOrder[0].uid).toBe('e1');
    });

    it('should handle empty enemy units', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', speed: 10, alive: true }
      ];
      const enemyUnits = [];

      const state = initializeCombat(playerUnits, enemyUnits);

      expect(state.playerUnits).toHaveLength(1);
      expect(state.enemyUnits).toHaveLength(0);
      expect(state.turnOrder).toHaveLength(1);
      expect(state.turnOrder[0].uid).toBe('p1');
    });

    it('should handle unequal team sizes', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', speed: 10, alive: true },
        { uid: 'p2', side: 'LEFT', speed: 8, alive: true },
        { uid: 'p3', side: 'LEFT', speed: 6, alive: true }
      ];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', speed: 12, alive: true }
      ];

      const state = initializeCombat(playerUnits, enemyUnits);

      expect(state.turnOrder).toHaveLength(4);
      // Should interleave: p1, e1, p2, p3
      expect(state.turnOrder[0].uid).toBe('p1');
      expect(state.turnOrder[1].uid).toBe('e1');
      expect(state.turnOrder[2].uid).toBe('p2');
      expect(state.turnOrder[3].uid).toBe('p3');
    });

    it('should not mutate original unit arrays', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', speed: 10, alive: true }
      ];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', speed: 5, alive: true }
      ];

      const originalPlayerLength = playerUnits.length;
      const originalEnemyLength = enemyUnits.length;

      initializeCombat(playerUnits, enemyUnits);

      expect(playerUnits).toHaveLength(originalPlayerLength);
      expect(enemyUnits).toHaveLength(originalEnemyLength);
    });
  });

  describe('getNextActor', () => {
    it('should return first actor from turn order', () => {
      const state = {
        turnOrder: [
          { uid: 'p1', alive: true },
          { uid: 'e1', alive: true }
        ],
        currentTurn: 0
      };

      const actor = getNextActor(state);

      expect(actor).toBeDefined();
      expect(actor.uid).toBe('p1');
      expect(state.currentTurn).toBe(1);
    });

    it('should skip dead units', () => {
      const state = {
        turnOrder: [
          { uid: 'p1', alive: false },
          { uid: 'e1', alive: true },
          { uid: 'p2', alive: false },
          { uid: 'e2', alive: true }
        ],
        currentTurn: 0
      };

      const actor1 = getNextActor(state);
      expect(actor1.uid).toBe('e1');
      expect(state.currentTurn).toBe(2);

      const actor2 = getNextActor(state);
      expect(actor2.uid).toBe('e2');
      expect(state.currentTurn).toBe(4);
    });

    it('should skip units with isDead flag', () => {
      const state = {
        turnOrder: [
          { uid: 'p1', isDead: true },
          { uid: 'e1', alive: true }
        ],
        currentTurn: 0
      };

      const actor = getNextActor(state);

      expect(actor.uid).toBe('e1');
      expect(state.currentTurn).toBe(2);
    });

    it('should return null when turn order is exhausted', () => {
      const state = {
        turnOrder: [
          { uid: 'p1', alive: true }
        ],
        currentTurn: 1
      };

      const actor = getNextActor(state);

      expect(actor).toBeNull();
    });

    it('should return null for empty turn order', () => {
      const state = {
        turnOrder: [],
        currentTurn: 0
      };

      const actor = getNextActor(state);

      expect(actor).toBeNull();
    });

    it('should return null when all units are dead', () => {
      const state = {
        turnOrder: [
          { uid: 'p1', alive: false },
          { uid: 'e1', alive: false }
        ],
        currentTurn: 0
      };

      const actor = getNextActor(state);

      expect(actor).toBeNull();
      expect(state.currentTurn).toBe(2);
    });

    it('should handle null state gracefully', () => {
      const actor = getNextActor(null);
      expect(actor).toBeNull();
    });

    it('should handle state without turnOrder', () => {
      const state = {
        currentTurn: 0
      };

      const actor = getNextActor(state);
      expect(actor).toBeNull();
    });

    it('should increment currentTurn correctly through multiple calls', () => {
      const state = {
        turnOrder: [
          { uid: 'p1', alive: true },
          { uid: 'e1', alive: true },
          { uid: 'p2', alive: true }
        ],
        currentTurn: 0
      };

      const actor1 = getNextActor(state);
      expect(actor1.uid).toBe('p1');
      expect(state.currentTurn).toBe(1);

      const actor2 = getNextActor(state);
      expect(actor2.uid).toBe('e1');
      expect(state.currentTurn).toBe(2);

      const actor3 = getNextActor(state);
      expect(actor3.uid).toBe('p2');
      expect(state.currentTurn).toBe(3);

      const actor4 = getNextActor(state);
      expect(actor4).toBeNull();
    });
  });

  describe('Integration: initializeCombat + getNextActor', () => {
    it('should work together for a complete turn cycle', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', speed: 10, alive: true },
        { uid: 'p2', side: 'LEFT', speed: 5, alive: true }
      ];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', speed: 8, alive: true }
      ];

      const state = initializeCombat(playerUnits, enemyUnits);

      const actor1 = getNextActor(state);
      expect(actor1.uid).toBe('p1'); // Highest speed player

      const actor2 = getNextActor(state);
      expect(actor2.uid).toBe('e1'); // Enemy

      const actor3 = getNextActor(state);
      expect(actor3.uid).toBe('p2'); // Lower speed player

      const actor4 = getNextActor(state);
      expect(actor4).toBeNull(); // Turn order exhausted
    });

    it('should handle unit deaths during combat', () => {
      const playerUnits = [
        { uid: 'p1', side: 'LEFT', speed: 10, alive: true },
        { uid: 'p2', side: 'LEFT', speed: 5, alive: true }
      ];
      const enemyUnits = [
        { uid: 'e1', side: 'RIGHT', speed: 8, alive: true }
      ];

      const state = initializeCombat(playerUnits, enemyUnits);

      const actor1 = getNextActor(state);
      expect(actor1.uid).toBe('p1');

      // Simulate unit death
      state.turnOrder[1].alive = false; // Kill e1

      const actor2 = getNextActor(state);
      expect(actor2.uid).toBe('p2'); // Should skip dead e1

      const actor3 = getNextActor(state);
      expect(actor3).toBeNull();
    });
  });
});
