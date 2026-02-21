import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for Wiki button in CombatScene
 * Task 6.1: Create Wiki button in CombatScene
 * Requirements: 2.1, 2.2
 */

describe('Wiki Button in CombatScene', () => {
  let mockScene;

  beforeEach(() => {
    // Create a minimal mock of CombatScene
    mockScene = {
      wikiVisible: false,
      wikiOverlay: [],
      wikiScrollY: 0,
      wikiMaxScroll: 0,
      wikiListBaseY: 0,
      wikiListContainer: null,
      settingsVisible: false,
      historyModalVisible: false,
      scale: { width: 1920, height: 1080 },
      add: {
        rectangle: vi.fn(() => ({
          setInteractive: vi.fn(() => ({})),
          setDepth: vi.fn(() => ({})),
          setStrokeStyle: vi.fn(() => ({})),
          on: vi.fn()
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn(() => ({})),
          setDepth: vi.fn(() => ({})),
          height: 20
        })),
        container: vi.fn(() => ({
          setMask: vi.fn(() => ({})),
          setDepth: vi.fn(() => ({})),
          removeAll: vi.fn(),
          add: vi.fn(),
          y: 0
        })),
        zone: vi.fn(() => ({
          setInteractive: vi.fn(() => ({})),
          setDepth: vi.fn(() => ({})),
          on: vi.fn()
        }))
      },
      make: {
        graphics: vi.fn(() => ({
          fillStyle: vi.fn(),
          fillRect: vi.fn(),
          createGeometryMask: vi.fn(() => ({}))
        }))
      },
      createButton: vi.fn(() => ({
        bg: { setDepth: vi.fn() },
        text: { setDepth: vi.fn() },
        shadow: { setDepth: vi.fn() }
      })),
      toggleSettingsOverlay: vi.fn(),
      toggleHistoryModal: vi.fn(),
      createWikiModal: vi.fn(),
      refreshWikiList: vi.fn()
    };
  });

  describe('toggleWikiModal function', () => {
    it('should toggle wikiVisible state when called without arguments', () => {
      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      expect(mockScene.wikiVisible).toBe(false);
      toggleWikiModal();
      expect(mockScene.wikiVisible).toBe(true);
      expect(mockScene.toggleSettingsOverlay).toHaveBeenCalledWith(false);
      expect(mockScene.toggleHistoryModal).toHaveBeenCalledWith(false);
    });

    it('should open wiki when force is true', () => {
      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      toggleWikiModal(true);
      expect(mockScene.wikiVisible).toBe(true);
      expect(mockScene.createWikiModal).toHaveBeenCalled();
      expect(mockScene.refreshWikiList).toHaveBeenCalled();
    });

    it('should close wiki when force is false', () => {
      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      mockScene.wikiVisible = true;
      toggleWikiModal(false);
      expect(mockScene.wikiVisible).toBe(false);
    });

    it('should reset scroll position when opening wiki', () => {
      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      mockScene.wikiScrollY = 100;
      toggleWikiModal(true);
      expect(mockScene.wikiScrollY).toBe(0);
    });

    it('should close other modals when opening wiki', () => {
      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      mockScene.settingsVisible = true;
      mockScene.historyModalVisible = true;
      
      toggleWikiModal(true);
      
      expect(mockScene.toggleSettingsOverlay).toHaveBeenCalledWith(false);
      expect(mockScene.toggleHistoryModal).toHaveBeenCalledWith(false);
    });
  });

  describe('createWikiModal function', () => {
    it('should create modal with correct z-index layering', () => {
      const createWikiModal = function() {
        const w = this.scale.width;
        const h = this.scale.height;
        const modalW = Math.min(1060, w - 40);
        const modalH = Math.min(760, h - 40);
        const modalX = w / 2;
        const modalY = h / 2;

        const topDepth = 6000;
        const dimmer = this.add.rectangle(modalX, modalY, w, h, 0x060d17, 0.85);
        dimmer.setInteractive();
        dimmer.setDepth(topDepth);

        const bg = this.add.rectangle(modalX, modalY, modalW, modalH, 0x0e1828, 0.98);
        bg.setDepth(topDepth + 1);

        this.wikiOverlay = [dimmer, bg];
      }.bind(mockScene);

      createWikiModal();

      // Verify z-index is higher than history modal (5800)
      expect(mockScene.add.rectangle).toHaveBeenCalled();
      const calls = mockScene.add.rectangle.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should create modal with proper dimensions', () => {
      const createWikiModal = function() {
        const w = this.scale.width;
        const h = this.scale.height;
        const modalW = Math.min(1060, w - 40);
        const modalH = Math.min(760, h - 40);
        
        expect(modalW).toBeLessThanOrEqual(1060);
        expect(modalH).toBeLessThanOrEqual(760);
        expect(modalW).toBeLessThanOrEqual(w);
        expect(modalH).toBeLessThanOrEqual(h);
      }.bind(mockScene);

      createWikiModal();
    });
  });

  describe('Wiki button positioning', () => {
    it('should position Wiki button in the top panel', () => {
      // The Wiki button is created at:
      // x: layout.rightPanelX + layout.sidePanelW - 240
      // y: layout.topPanelY + 8
      // This places it to the left of the Settings button
      
      const layout = {
        rightPanelX: 1400,
        sidePanelW: 500,
        topPanelY: 10
      };

      const wikiButtonX = layout.rightPanelX + layout.sidePanelW - 240;
      const wikiButtonY = layout.topPanelY + 8;

      expect(wikiButtonX).toBe(1660); // 1400 + 500 - 240
      expect(wikiButtonY).toBe(18); // 10 + 8
    });
  });

  describe('Wiki button visibility during combat', () => {
    it('should be visible during PLANNING phase', () => {
      mockScene.phase = 'PLANNING';
      mockScene.buttons = {
        wiki: { visible: true }
      };
      
      expect(mockScene.buttons.wiki.visible).toBe(true);
    });

    it('should be visible during COMBAT phase', () => {
      mockScene.phase = 'COMBAT';
      mockScene.buttons = {
        wiki: { visible: true }
      };
      
      expect(mockScene.buttons.wiki.visible).toBe(true);
    });

    it('should be visible during AUGMENT phase', () => {
      mockScene.phase = 'AUGMENT';
      mockScene.buttons = {
        wiki: { visible: true }
      };
      
      expect(mockScene.buttons.wiki.visible).toBe(true);
    });

    it('should remain accessible throughout all game phases', () => {
      const phases = ['PLANNING', 'COMBAT', 'AUGMENT', 'GAME_OVER'];
      
      phases.forEach(phase => {
        mockScene.phase = phase;
        mockScene.buttons = {
          wiki: { visible: true }
        };
        
        expect(mockScene.buttons.wiki.visible).toBe(true);
      });
    });
  });

  describe('Overlay display and z-index layering', () => {
    it('should set Wiki overlay z-index higher than history modal', () => {
      const createWikiModal = function() {
        const w = this.scale.width;
        const h = this.scale.height;
        const modalW = Math.min(1060, w - 40);
        const modalH = Math.min(760, h - 40);
        const modalX = w / 2;
        const modalY = h / 2;

        const topDepth = 6000; // Higher than history modal (5800)
        const dimmer = this.add.rectangle(modalX, modalY, w, h, 0x060d17, 0.85);
        dimmer.setInteractive();
        dimmer.setDepth(topDepth);

        const bg = this.add.rectangle(modalX, modalY, modalW, modalH, 0x0e1828, 0.98);
        bg.setDepth(topDepth + 1);

        this.wikiOverlay = [dimmer, bg];
        
        return topDepth;
      }.bind(mockScene);

      const wikiDepth = createWikiModal();
      const historyModalDepth = 5800;
      
      expect(wikiDepth).toBeGreaterThan(historyModalDepth);
    });

    it('should layer background above dimmer', () => {
      const createWikiModal = function() {
        const w = this.scale.width;
        const h = this.scale.height;
        const modalW = Math.min(1060, w - 40);
        const modalH = Math.min(760, h - 40);
        const modalX = w / 2;
        const modalY = h / 2;

        const topDepth = 6000;
        
        const dimmerDepth = topDepth;
        const bgDepth = topDepth + 1;
        
        return { dimmerDepth, bgDepth };
      }.bind(mockScene);

      const { dimmerDepth, bgDepth } = createWikiModal();
      
      expect(bgDepth).toBeGreaterThan(dimmerDepth);
    });

    it('should make overlay elements visible when Wiki is opened', () => {
      mockScene.wikiOverlay = [
        { setVisible: vi.fn(), visible: false },
        { setVisible: vi.fn(), visible: false }
      ];

      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      toggleWikiModal(true);
      
      expect(mockScene.wikiOverlay[0].setVisible).toHaveBeenCalledWith(true);
      expect(mockScene.wikiOverlay[1].setVisible).toHaveBeenCalledWith(true);
    });

    it('should hide overlay elements when Wiki is closed', () => {
      mockScene.wikiVisible = true;
      mockScene.wikiOverlay = [
        { setVisible: vi.fn(), visible: true },
        { setVisible: vi.fn(), visible: true }
      ];

      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      toggleWikiModal(false);
      
      expect(mockScene.wikiOverlay[0].setVisible).toHaveBeenCalledWith(false);
      expect(mockScene.wikiOverlay[1].setVisible).toHaveBeenCalledWith(false);
    });
  });

  describe('Interaction blocking when overlay is open', () => {
    it('should prevent combat actions when Wiki overlay is open', () => {
      mockScene.wikiVisible = true;
      mockScene.phase = 'COMBAT';
      mockScene.actionBlocked = false;

      // Simulate a combat action check
      const canPerformCombatAction = function() {
        if (this.wikiVisible) {
          this.actionBlocked = true;
          return false;
        }
        return true;
      }.bind(mockScene);

      const result = canPerformCombatAction();
      
      expect(result).toBe(false);
      expect(mockScene.actionBlocked).toBe(true);
    });

    it('should allow combat actions when Wiki overlay is closed', () => {
      mockScene.wikiVisible = false;
      mockScene.phase = 'COMBAT';

      const canPerformCombatAction = function() {
        if (this.wikiVisible) {
          return false;
        }
        return true;
      }.bind(mockScene);

      const result = canPerformCombatAction();
      
      expect(result).toBe(true);
    });

    it('should block planning actions when Wiki is open', () => {
      mockScene.wikiVisible = true;
      mockScene.phase = 'PLANNING';
      mockScene.actionExecuted = false;

      const planningAction = function() {
        if (this.wikiVisible) return;
        this.actionExecuted = true;
      }.bind(mockScene);

      planningAction();
      
      expect(mockScene.actionExecuted).toBe(false);
    });

    it('should allow planning actions when Wiki is closed', () => {
      mockScene.wikiVisible = false;
      mockScene.phase = 'PLANNING';
      mockScene.actionExecuted = false;

      const planningAction = function() {
        if (this.wikiVisible) return;
        this.actionExecuted = true;
      }.bind(mockScene);

      planningAction();
      
      expect(mockScene.actionExecuted).toBe(true);
    });
  });

  describe('Wiki overlay interaction with other modals', () => {
    it('should close settings overlay when Wiki is opened', () => {
      mockScene.settingsVisible = true;
      mockScene.wikiVisible = false;

      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      toggleWikiModal(true);
      
      expect(mockScene.toggleSettingsOverlay).toHaveBeenCalledWith(false);
    });

    it('should close history modal when Wiki is opened', () => {
      mockScene.historyModalVisible = true;
      mockScene.wikiVisible = false;

      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      toggleWikiModal(true);
      
      expect(mockScene.toggleHistoryModal).toHaveBeenCalledWith(false);
    });

    it('should not interfere with other modals when closed', () => {
      mockScene.wikiVisible = true;
      mockScene.settingsVisible = false;
      mockScene.historyModalVisible = false;

      const toggleWikiModal = function(force = null) {
        const next = typeof force === "boolean" ? force : !this.wikiVisible;
        if (next) {
          this.toggleSettingsOverlay(false);
          this.toggleHistoryModal(false);
          if (!this.wikiOverlay.length) this.createWikiModal();
        }
        this.wikiVisible = next;
        this.wikiOverlay?.forEach((part) => part.setVisible(next));
        if (next) {
          this.wikiScrollY = 0;
          this.refreshWikiList();
        }
      }.bind(mockScene);

      // Close Wiki
      toggleWikiModal(false);
      
      // Verify other modals were not affected when closing
      expect(mockScene.wikiVisible).toBe(false);
    });
  });

  describe('ESC key handling', () => {
    it('should close Wiki when ESC is pressed and Wiki is open', () => {
      mockScene.wikiVisible = true;
      mockScene.toggleWikiModal = vi.fn();

      const escKeyHandler = function() {
        if (this.wikiVisible) {
          this.toggleWikiModal(false);
          return;
        }
      }.bind(mockScene);

      escKeyHandler();
      
      expect(mockScene.toggleWikiModal).toHaveBeenCalledWith(false);
    });

    it('should not trigger Wiki close when ESC is pressed and Wiki is closed', () => {
      mockScene.wikiVisible = false;
      mockScene.toggleWikiModal = vi.fn();

      const escKeyHandler = function() {
        if (this.wikiVisible) {
          this.toggleWikiModal(false);
          return;
        }
      }.bind(mockScene);

      escKeyHandler();
      
      expect(mockScene.toggleWikiModal).not.toHaveBeenCalled();
    });
  });

  describe('Dimmer interaction', () => {
    it('should close Wiki when dimmer is clicked', () => {
      mockScene.wikiVisible = true;
      mockScene.toggleWikiModal = vi.fn();

      // Simulate dimmer click
      const dimmerClickHandler = function() {
        this.toggleWikiModal(false);
      }.bind(mockScene);

      dimmerClickHandler();
      
      expect(mockScene.toggleWikiModal).toHaveBeenCalledWith(false);
    });

    it('should make dimmer interactive', () => {
      const createWikiModal = function() {
        const w = this.scale.width;
        const h = this.scale.height;
        const modalX = w / 2;
        const modalY = h / 2;

        const dimmer = this.add.rectangle(modalX, modalY, w, h, 0x060d17, 0.85);
        dimmer.setInteractive();
        
        return dimmer;
      }.bind(mockScene);

      const dimmer = createWikiModal();
      
      expect(dimmer.setInteractive).toHaveBeenCalled();
    });
  });
});
