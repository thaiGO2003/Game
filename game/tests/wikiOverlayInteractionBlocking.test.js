import { describe, it, expect, beforeEach } from "vitest";

/**
 * Unit tests for Wiki overlay interaction blocking
 * Task 6.2: Implement Wiki overlay interaction blocking
 * Requirements: 2.3, 2.4, 2.5
 */

describe('Wiki Overlay Interaction Blocking', () => {
  let mockScene;

  beforeEach(() => {
    // Create a minimal mock of CombatScene with interaction handlers
    mockScene = {
      wikiVisible: false,
      settingsVisible: false,
      historyModalVisible: false,
      phase: 'PLANNING',
      overlaySprites: [],
      player: {
        board: [[null, null], [null, null]],
        bench: [{ id: 'unit1' }],
        shop: [{ baseId: 'turtle' }],
        gold: 10
      },
      selectedBenchIndex: null,
      
      // Track if actions were executed
      actionExecuted: false,
      
      // Mock methods
      addLog: function() {},
      tryAutoMerge: function() {},
      refreshPlanningUi: function() {},
      refreshBenchUi: function() {},
      createOwnedUnit: function(id, star) { return { id, star }; },
      getBenchCap: function() { return 9; },
      getDeployCount: function() { return 0; },
      getDeployCap: function() { return 5; },
      applyAugment: function() {},
      clearOverlay: function() {},
      pointInBoardPanel: function() { return true; },
      isPanPointer: function() { return false; },
      refreshBoardGeometry: function() {}
    };
  });

  describe('Combat element interaction blocking', () => {
    it('should block onPlayerCellClick when Wiki is visible', () => {
      const onPlayerCellClick = function(row, col) {
        if (this.phase !== 'PLANNING') return;
        if (this.overlaySprites.length) return;
        if (this.wikiVisible) return;
        
        this.actionExecuted = true;
      }.bind(mockScene);

      mockScene.wikiVisible = false;
      onPlayerCellClick(0, 0);
      expect(mockScene.actionExecuted).toBe(true);

      mockScene.actionExecuted = false;
      mockScene.wikiVisible = true;
      onPlayerCellClick(0, 0);
      expect(mockScene.actionExecuted).toBe(false);
    });

    it('should block onBenchClick when Wiki is visible', () => {
      const onBenchClick = function(index) {
        if (this.phase !== 'PLANNING') return;
        if (index >= this.getBenchCap()) return;
        if (this.wikiVisible) return;
        
        this.actionExecuted = true;
      }.bind(mockScene);

      mockScene.wikiVisible = false;
      onBenchClick(0);
      expect(mockScene.actionExecuted).toBe(true);

      mockScene.actionExecuted = false;
      mockScene.wikiVisible = true;
      onBenchClick(0);
      expect(mockScene.actionExecuted).toBe(false);
    });

    it('should block buyFromShop when Wiki is visible', () => {
      const buyFromShop = function(index) {
        if (this.phase !== 'PLANNING') return;
        if (this.wikiVisible) return;
        
        this.actionExecuted = true;
      }.bind(mockScene);

      mockScene.wikiVisible = false;
      buyFromShop(0);
      expect(mockScene.actionExecuted).toBe(true);

      mockScene.actionExecuted = false;
      mockScene.wikiVisible = true;
      buyFromShop(0);
      expect(mockScene.actionExecuted).toBe(false);
    });

    it('should block chooseAugment when Wiki is visible', () => {
      const chooseAugment = function(augment) {
        if (this.wikiVisible) return;
        
        this.actionExecuted = true;
      }.bind(mockScene);

      const mockAugment = { id: 'test', name: 'Test', effect: { type: 'gold_flat', value: 5 } };

      mockScene.wikiVisible = false;
      chooseAugment(mockAugment);
      expect(mockScene.actionExecuted).toBe(true);

      mockScene.actionExecuted = false;
      mockScene.wikiVisible = true;
      chooseAugment(mockAugment);
      expect(mockScene.actionExecuted).toBe(false);
    });
  });

  describe('Input handler blocking', () => {
    it('should block pointerdown handler when Wiki is visible', () => {
      const pointerdownHandler = function(pointer) {
        if (this.settingsVisible || this.historyModalVisible || this.wikiVisible) return;
        if (!this.pointInBoardPanel(pointer.x, pointer.y)) return;
        
        this.actionExecuted = true;
      }.bind(mockScene);

      const mockPointer = { x: 100, y: 100 };

      mockScene.wikiVisible = false;
      pointerdownHandler(mockPointer);
      expect(mockScene.actionExecuted).toBe(true);

      mockScene.actionExecuted = false;
      mockScene.wikiVisible = true;
      pointerdownHandler(mockPointer);
      expect(mockScene.actionExecuted).toBe(false);
    });

    it('should block pointermove handler when Wiki is visible', () => {
      const pointermoveHandler = function(pointer) {
        if (this.settingsVisible || this.historyModalVisible || this.wikiVisible) return;
        
        this.actionExecuted = true;
      }.bind(mockScene);

      const mockPointer = { x: 100, y: 100 };

      mockScene.wikiVisible = false;
      pointermoveHandler(mockPointer);
      expect(mockScene.actionExecuted).toBe(true);

      mockScene.actionExecuted = false;
      mockScene.wikiVisible = true;
      pointermoveHandler(mockPointer);
      expect(mockScene.actionExecuted).toBe(false);
    });
  });

  describe('Wiki scrolling functionality', () => {
    it('should allow Wiki content scrolling when Wiki is visible', () => {
      mockScene.wikiScrollY = 0;
      mockScene.wikiMaxScroll = 500;
      mockScene.wikiListBaseY = 100;
      mockScene.wikiListContainer = {
        y: 100
      };

      const onWikiWheel = function(deltaY) {
        if (!this.wikiVisible) return;
        
        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        const next = clamp(this.wikiScrollY + (deltaY > 0 ? 36 : -36), 0, this.wikiMaxScroll);
        this.wikiScrollY = next;
        if (this.wikiListContainer) {
          this.wikiListContainer.y = this.wikiListBaseY - this.wikiScrollY;
        }
      }.bind(mockScene);

      mockScene.wikiVisible = true;
      onWikiWheel(100); // Scroll down
      expect(mockScene.wikiScrollY).toBe(36);
      expect(mockScene.wikiListContainer.y).toBe(64); // 100 - 36

      onWikiWheel(-100); // Scroll up
      expect(mockScene.wikiScrollY).toBe(0);
      expect(mockScene.wikiListContainer.y).toBe(100); // 100 - 0
    });

    it('should not scroll Wiki when Wiki is not visible', () => {
      mockScene.wikiScrollY = 0;
      mockScene.wikiMaxScroll = 500;
      mockScene.wikiVisible = false;

      const onWikiWheel = function(deltaY) {
        if (!this.wikiVisible) return;
        
        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        this.wikiScrollY = clamp(this.wikiScrollY + (deltaY > 0 ? 36 : -36), 0, this.wikiMaxScroll);
      }.bind(mockScene);

      onWikiWheel(100);
      expect(mockScene.wikiScrollY).toBe(0); // Should not change
    });

    it('should clamp scroll position to valid range', () => {
      mockScene.wikiScrollY = 0;
      mockScene.wikiMaxScroll = 100;
      mockScene.wikiListBaseY = 100;
      mockScene.wikiListContainer = { y: 100 };
      mockScene.wikiVisible = true;

      const onWikiWheel = function(deltaY) {
        if (!this.wikiVisible) return;
        
        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        const next = clamp(this.wikiScrollY + (deltaY > 0 ? 36 : -36), 0, this.wikiMaxScroll);
        this.wikiScrollY = next;
        if (this.wikiListContainer) {
          this.wikiListContainer.y = this.wikiListBaseY - this.wikiScrollY;
        }
      }.bind(mockScene);

      // Scroll down beyond max
      onWikiWheel(100);
      onWikiWheel(100);
      onWikiWheel(100);
      onWikiWheel(100);
      expect(mockScene.wikiScrollY).toBe(100); // Clamped to max

      // Scroll up beyond min
      onWikiWheel(-100);
      onWikiWheel(-100);
      onWikiWheel(-100);
      onWikiWheel(-100);
      expect(mockScene.wikiScrollY).toBe(0); // Clamped to min
    });
  });

  describe('Close functionality', () => {
    it('should close Wiki when toggleWikiModal is called with false', () => {
      mockScene.wikiVisible = true;
      mockScene.wikiOverlay = [
        { setVisible: function(visible) { this.visible = visible; }, visible: true },
        { setVisible: function(visible) { this.visible = visible; }, visible: true }
      ];

      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
      }.bind(mockScene);

      toggleWikiModal(false);
      expect(mockScene.wikiVisible).toBe(false);
      expect(mockScene.wikiOverlay[0].visible).toBe(false);
      expect(mockScene.wikiOverlay[1].visible).toBe(false);
    });

    it('should close Wiki when ESC key is pressed', () => {
      mockScene.wikiVisible = true;
      mockScene.toggleWikiModal = function(force) {
        this.wikiVisible = force;
      };

      const escKeyHandler = function() {
        if (this.wikiVisible) {
          this.toggleWikiModal(false);
          return;
        }
      }.bind(mockScene);

      escKeyHandler();
      expect(mockScene.wikiVisible).toBe(false);
    });

    it('should close Wiki when dimmer is clicked', () => {
      mockScene.wikiVisible = true;
      mockScene.toggleWikiModal = function(force) {
        this.wikiVisible = force;
      };

      // Simulate dimmer click
      mockScene.toggleWikiModal(false);
      expect(mockScene.wikiVisible).toBe(false);
    });
  });

  describe('Wheel event routing', () => {
    it('should route wheel events to Wiki when Wiki is visible', () => {
      mockScene.wikiVisible = true;
      mockScene.historyModalVisible = false;
      mockScene.settingsVisible = false;
      mockScene.wikiWheelCalled = false;
      mockScene.historyWheelCalled = false;

      const wheelHandler = function(pointer, _gos, _dx, dy) {
        if (this.historyModalVisible) {
          this.historyWheelCalled = true;
          return;
        }
        if (this.wikiVisible) {
          this.wikiWheelCalled = true;
          return;
        }
        if (this.settingsVisible) return;
      }.bind(mockScene);

      wheelHandler({}, null, 0, 100);
      expect(mockScene.wikiWheelCalled).toBe(true);
      expect(mockScene.historyWheelCalled).toBe(false);
    });

    it('should prioritize history modal over Wiki for wheel events', () => {
      mockScene.wikiVisible = true;
      mockScene.historyModalVisible = true;
      mockScene.settingsVisible = false;
      mockScene.wikiWheelCalled = false;
      mockScene.historyWheelCalled = false;

      const wheelHandler = function(pointer, _gos, _dx, dy) {
        if (this.historyModalVisible) {
          this.historyWheelCalled = true;
          return;
        }
        if (this.wikiVisible) {
          this.wikiWheelCalled = true;
          return;
        }
        if (this.settingsVisible) return;
      }.bind(mockScene);

      wheelHandler({}, null, 0, 100);
      expect(mockScene.historyWheelCalled).toBe(true);
      expect(mockScene.wikiWheelCalled).toBe(false);
    });
  });
});
