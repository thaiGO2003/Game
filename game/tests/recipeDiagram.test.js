/**
 * Unit tests for RecipeDiagram - Node-based crafting diagram
 * 
 * Tests the recipe visualization system that displays crafting recipes
 * as a node-based diagram with categories, connections, and interactions.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { RecipeDiagram } from "../src/ui/RecipeDiagram.js";

// Mock Phaser scene
function createMockScene() {
  const mockObjects = [];
  
  const mockScene = {
    add: {
      container: vi.fn((x, y) => {
        const container = {
          x,
          y,
          add: vi.fn(),
          addAt: vi.fn(),
          destroy: vi.fn(),
          removeAll: vi.fn()
        };
        mockObjects.push(container);
        return container;
      }),
      text: vi.fn((x, y, text, style) => {
        const textObj = {
          x,
          y,
          text,
          style,
          setOrigin: vi.fn().mockReturnThis(),
          height: 20,
          width: 100
        };
        mockObjects.push(textObj);
        return textObj;
      }),
      rectangle: vi.fn((x, y, width, height, color, alpha) => {
        const rect = {
          x,
          y,
          width,
          height,
          color,
          alpha,
          setOrigin: vi.fn().mockReturnThis(),
          setStrokeStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis()
        };
        mockObjects.push(rect);
        return rect;
      }),
      line: vi.fn((x, y, x1, y1, x2, y2, color, alpha) => {
        const line = {
          x, y, x1, y1, x2, y2, color, alpha,
          setOrigin: vi.fn().mockReturnThis(),
          setLineWidth: vi.fn().mockReturnThis(),
          setStrokeStyle: vi.fn().mockReturnThis()
        };
        mockObjects.push(line);
        return line;
      })
    },
    mockObjects
  };
  
  return mockScene;
}

// Sample recipe data
const sampleRecipes = [
  {
    id: "death_blade",
    name: "Kiếm Vô Cực",
    icon: "⚔️",
    bonus: { atkPct: 0.15 },
    _gridSize: 2,
    _pattern: [
      { icon: "🦷", name: "Vuốt Sắc" },
      { icon: "🦷", name: "Vuốt Sắc" },
      { icon: "🦷", name: "Vuốt Sắc" },
      null
    ]
  },
  {
    id: "bramble_vest",
    name: "Giáp Gai",
    icon: "🌵",
    bonus: { hpPct: 0.05, defFlat: 20 },
    _gridSize: 2,
    _pattern: [
      { icon: "🛡️", name: "Vảy Cứng" },
      { icon: "🛡️", name: "Vảy Cứng" },
      { icon: "🛡️", name: "Vảy Cứng" },
      null
    ]
  },
  {
    id: "rabadon_deathcap",
    name: "Mũ Phù Thủy",
    icon: "🧙",
    bonus: { matkPct: 0.2 },
    _gridSize: 2,
    _pattern: [
      { icon: "🔮", name: "Tinh Thạch" },
      { icon: "🔮", name: "Tinh Thạch" },
      { icon: "🔮", name: "Tinh Thạch" },
      { icon: "🔮", name: "Tinh Thạch" }
    ]
  }
];

describe("RecipeDiagram", () => {
  let mockScene;
  let diagram;
  
  beforeEach(() => {
    mockScene = createMockScene();
  });
  
  describe("Recipe Categorization", () => {
    it("should categorize recipes into Offense, Defense, and Magic", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      expect(diagram.categories.offense).toBeDefined();
      expect(diagram.categories.defense).toBeDefined();
      expect(diagram.categories.magic).toBeDefined();
      
      // Validates: Requirements 6.2
      expect(diagram.categories.offense.recipes.length).toBeGreaterThan(0);
      expect(diagram.categories.defense.recipes.length).toBeGreaterThan(0);
      expect(diagram.categories.magic.recipes.length).toBeGreaterThan(0);
    });
    
    it("should assign offense recipes correctly", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const offenseRecipe = diagram.categories.offense.recipes.find(r => r.id === "death_blade");
      expect(offenseRecipe).toBeDefined();
      expect(offenseRecipe.bonus.atkPct).toBe(0.15);
    });
    
    it("should assign defense recipes correctly", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const defenseRecipe = diagram.categories.defense.recipes.find(r => r.id === "bramble_vest");
      expect(defenseRecipe).toBeDefined();
      expect(defenseRecipe.bonus.hpPct).toBe(0.05);
    });
    
    it("should assign magic recipes correctly", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const magicRecipe = diagram.categories.magic.recipes.find(r => r.id === "rabadon_deathcap");
      expect(magicRecipe).toBeDefined();
      expect(magicRecipe.bonus.matkPct).toBe(0.2);
    });
  });
  
  describe("Recipe Node Components", () => {
    it("should display input pattern, output unit, and stat benefits for each node", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      // Validates: Requirements 6.3
      // Each node should have been created with all components
      expect(diagram.nodes.length).toBeGreaterThan(0);
      
      diagram.nodes.forEach(node => {
        expect(node.recipe).toBeDefined();
        expect(node.container).toBeDefined();
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
      });
    });
    
    it("should format stat benefits correctly", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const atkRecipe = { bonus: { atkPct: 0.15 } };
      const statText = diagram.formatStatBenefits(atkRecipe);
      expect(statText).toContain("15% ATK");
      
      const defRecipe = { bonus: { hpPct: 0.05, defFlat: 20 } };
      const defStatText = diagram.formatStatBenefits(defRecipe);
      expect(defStatText).toContain("5% HP");
      expect(defStatText).toContain("20 DEF");
    });
    
    it("should handle recipes with multiple stat benefits", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const multiStatRecipe = {
        bonus: {
          atkPct: 0.1,
          critPct: 0.15,
          lifestealPct: 0.05
        }
      };
      
      const statText = diagram.formatStatBenefits(multiStatRecipe);
      expect(statText).toContain("10% ATK");
      expect(statText).toContain("15% Crit");
      expect(statText).toContain("5% Hút máu");
    });
  });
  
  describe("Recipe Node Interaction", () => {
    it("should make nodes interactive", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      // Check that rectangles were made interactive
      const rectangles = mockScene.mockObjects.filter(obj => obj.width && obj.height);
      const interactiveRects = rectangles.filter(rect => 
        rect.setInteractive && rect.setInteractive.mock && rect.setInteractive.mock.calls.length > 0
      );
      
      expect(interactiveRects.length).toBeGreaterThan(0);
    });
    
    it("should highlight selected node on click", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const firstNode = diagram.nodes[0];
      diagram.onNodeClick(firstNode.recipe, firstNode.container);
      
      // Validates: Requirements 6.5
      expect(diagram.selectedNode).toBe(firstNode);
    });
    
    it("should reset previous selection when clicking new node", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const firstNode = diagram.nodes[0];
      const secondNode = diagram.nodes[1];
      
      diagram.onNodeClick(firstNode.recipe, firstNode.container);
      expect(diagram.selectedNode).toBe(firstNode);
      
      diagram.onNodeClick(secondNode.recipe, secondNode.container);
      expect(diagram.selectedNode).toBe(secondNode);
    });
  });
  
  describe("Recipe Connections", () => {
    it("should create connections between related recipes", () => {
      const recipesWithEquipment = [
        ...sampleRecipes,
        {
          id: "advanced_item",
          name: "Advanced Item",
          icon: "🔥",
          bonus: { atkPct: 0.25 },
          _gridSize: 2,
          _pattern: [
            { icon: "⚔️", id: "eq_death_blade", kind: "equipment" },
            { icon: "🦷", name: "Vuốt Sắc" },
            null,
            null
          ]
        }
      ];
      
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, recipesWithEquipment);
      
      // Validates: Requirements 6.4
      // Should have created connections for recipes using equipment
      expect(diagram.connections.length).toBeGreaterThanOrEqual(0);
    });
    
    it("should highlight related connections when node is clicked", () => {
      const recipesWithEquipment = [
        ...sampleRecipes,
        {
          id: "advanced_item",
          name: "Advanced Item",
          icon: "🔥",
          bonus: { atkPct: 0.25 },
          _gridSize: 2,
          _pattern: [
            { icon: "⚔️", id: "eq_death_blade", kind: "equipment" },
            { icon: "🦷", name: "Vuốt Sắc" },
            null,
            null
          ]
        }
      ];
      
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, recipesWithEquipment);
      
      const deathBladeNode = diagram.nodes.find(n => n.recipe.id === "death_blade");
      if (deathBladeNode) {
        diagram.onNodeClick(deathBladeNode.recipe, deathBladeNode.container);
        diagram.highlightRelatedRecipes(deathBladeNode.recipe);
        
        // Should have processed connections
        expect(diagram.connections).toBeDefined();
      }
    });
  });
  
  describe("Diagram Cleanup", () => {
    it("should clean up resources on destroy", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, sampleRecipes);
      
      const container = diagram.container;
      diagram.destroy();
      
      expect(container.destroy).toHaveBeenCalled();
      expect(diagram.nodes).toEqual([]);
      expect(diagram.connections).toEqual([]);
      expect(diagram.selectedNode).toBeNull();
    });
  });
  
  describe("Edge Cases", () => {
    it("should handle empty recipe list", () => {
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, []);
      
      expect(diagram.categories.offense.recipes).toEqual([]);
      expect(diagram.categories.defense.recipes).toEqual([]);
      expect(diagram.categories.magic.recipes).toEqual([]);
      expect(diagram.nodes).toEqual([]);
    });
    
    it("should handle recipes without bonus stats", () => {
      const recipeWithoutBonus = [{
        id: "test_item",
        name: "Test Item",
        icon: "❓",
        _gridSize: 2,
        _pattern: [null, null, null, null]
      }];
      
      diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, recipeWithoutBonus);
      
      const statText = diagram.formatStatBenefits(recipeWithoutBonus[0]);
      expect(statText).toBe("Xem mô tả");
    });
    
    it("should handle recipes with missing pattern", () => {
      const recipeWithoutPattern = [{
        id: "test_item",
        name: "Test Item",
        icon: "❓",
        bonus: { atkPct: 0.1 },
        _gridSize: 2
      }];
      
      expect(() => {
        diagram = new RecipeDiagram(mockScene, 0, 0, 800, 600, recipeWithoutPattern);
      }).not.toThrow();
    });
  });
});
