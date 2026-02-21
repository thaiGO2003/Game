/**
 * RecipeDiagram - Node-based crafting diagram visualization
 * 
 * Displays crafting recipes as an interactive node graph showing:
 * - Recipe nodes grouped by category (Offense, Defense, Magic)
 * - Input patterns (ingredient grids)
 * - Output items with stat benefits
 * - Connections between recipe components
 */

export class RecipeDiagram {
  /**
   * @param {Phaser.Scene} scene - The Phaser scene
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Diagram width
   * @param {number} height - Diagram height
   * @param {Array} recipes - Array of recipe objects
   */
  constructor(scene, x, y, width, height, recipes) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.recipes = recipes;
    this.zoom = 1;
    this.minZoom = 0.6;
    this.maxZoom = 1.8;
    this.panX = 0;
    this.panY = 0;
    
    this.container = scene.add.container(x, y);
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    
    this.categorizeRecipes();
    this.buildDiagram();
    this.enablePanZoom();
  }
  
  /**
   * Categorize recipes into Offense, Defense, and Magic groups
   */
  categorizeRecipes() {
    this.categories = {
      offense: {
        label: "⚔️ TẤN CÔNG",
        color: 0xff6b6b,
        recipes: this.recipes.filter(r => {
          const bonus = r.bonus || r.stats || {};
          return bonus.atk || bonus.atkPct || bonus.critPct;
        })
      },
      defense: {
        label: "🛡️ PHÒNG THỦ",
        color: 0x4ecdc4,
        recipes: this.recipes.filter(r => {
          const bonus = r.bonus || r.stats || {};
          return bonus.hp || bonus.hpPct || bonus.def || bonus.defFlat || 
            bonus.mdef || bonus.mdefFlat || bonus.shieldStart ||
            r.id?.toLowerCase().includes("armor") || r.id?.toLowerCase().includes("crown");
        })
      },
      magic: {
        label: "🔮 PHÁP THUẬT",
        color: 0x9b59b6,
        recipes: this.recipes.filter(r => {
          const bonus = r.bonus || r.stats || {};
          return bonus.matk || bonus.matkPct || 
            r.id?.toLowerCase().includes("staff") || r.id?.toLowerCase().includes("wand");
        })
      }
    };
  }
  
  /**
   * Build the node-based diagram
   */
  buildDiagram() {
    const categoryKeys = Object.keys(this.categories);
    const categoryWidth = this.width / categoryKeys.length;
    const headerHeight = 40;
    
    categoryKeys.forEach((catKey, catIndex) => {
      const category = this.categories[catKey];
      const catX = catIndex * categoryWidth;
      
      // Category header
      const header = this.scene.add.text(
        catX + categoryWidth / 2,
        10,
        category.label,
        {
          fontFamily: "Arial",
          fontSize: "18px",
          color: `#${category.color.toString(16)}`,
          fontStyle: "bold"
        }
      ).setOrigin(0.5, 0);
      
      this.container.add(header);
      
      // Create nodes for recipes in this category
      const nodeSpacing = 120;
      const startY = headerHeight + 20;
      
      category.recipes.forEach((recipe, index) => {
        const nodeX = catX + categoryWidth / 2;
        const nodeY = startY + index * nodeSpacing;
        
        const node = this.createRecipeNode(recipe, nodeX, nodeY, category.color);
        this.nodes.push(node);
      });
    });
    
    // Create connections between nodes
    this.createConnections();
  }
  
  /**
   * Create a recipe node
   * @param {Object} recipe - Recipe data
   * @param {number} x - Node X position
   * @param {number} y - Node Y position
   * @param {number} color - Category color
   * @returns {Object} Node object
   */
  createRecipeNode(recipe, x, y, color) {
    const nodeWidth = 180;
    const nodeHeight = 100;
    
    const nodeContainer = this.scene.add.container(x, y);
    
    // Node background
    const bg = this.scene.add.rectangle(0, 0, nodeWidth, nodeHeight, color, 0.2);
    bg.setStrokeStyle(2, color, 0.8);
    nodeContainer.add(bg);
    
    // Recipe icon and name
    const title = this.scene.add.text(
      -nodeWidth / 2 + 10,
      -nodeHeight / 2 + 8,
      `${recipe.icon} ${recipe.name}`,
      {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold"
      }
    ).setOrigin(0, 0);
    nodeContainer.add(title);
    
    // Input pattern (simplified grid)
    const gridSize = recipe._gridSize ?? 2;
    const slotSize = 12;
    const slotGap = 3;
    const gridStartX = -nodeWidth / 2 + 10;
    const gridStartY = -nodeHeight / 2 + 35;
    
    for (let i = 0; i < gridSize * gridSize; i++) {
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      const slotX = gridStartX + col * (slotSize + slotGap);
      const slotY = gridStartY + row * (slotSize + slotGap);
      
      const slot = this.scene.add.rectangle(
        slotX + slotSize / 2,
        slotY + slotSize / 2,
        slotSize,
        slotSize,
        0x2c3e50,
        0.8
      );
      slot.setStrokeStyle(1, 0x7f8c8d, 0.5);
      nodeContainer.add(slot);
      
      const item = recipe._pattern?.[i];
      if (item) {
        const icon = this.scene.add.text(
          slotX + slotSize / 2,
          slotY + slotSize / 2,
          item.icon ?? "",
          {
            fontFamily: "Segoe UI Emoji",
            fontSize: "10px",
            color: "#ffffff"
          }
        ).setOrigin(0.5);
        nodeContainer.add(icon);
      }
    }
    
    // Arrow
    const arrowX = gridStartX + gridSize * (slotSize + slotGap) + 8;
    const arrowY = gridStartY + (gridSize * (slotSize + slotGap)) / 2;
    const arrow = this.scene.add.text(arrowX, arrowY, "→", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff"
    }).setOrigin(0.5);
    nodeContainer.add(arrow);
    
    // Output item
    const outX = arrowX + 15;
    const outBg = this.scene.add.rectangle(outX, arrowY, 16, 16, 0x34495e, 0.9);
    outBg.setStrokeStyle(1, color, 0.9);
    nodeContainer.add(outBg);
    
    const outIcon = this.scene.add.text(outX, arrowY, recipe.icon, {
      fontFamily: "Segoe UI Emoji",
      fontSize: "12px",
      color: "#ffffff"
    }).setOrigin(0.5);
    nodeContainer.add(outIcon);
    
    // Stat benefits
    const statText = this.formatStatBenefits(recipe);
    const stats = this.scene.add.text(
      -nodeWidth / 2 + 10,
      nodeHeight / 2 - 20,
      statText,
      {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#ecf0f1",
        wordWrap: { width: nodeWidth - 20 }
      }
    ).setOrigin(0, 0);
    nodeContainer.add(stats);
    
    // Make node interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => this.onNodeClick(recipe, nodeContainer));
    
    this.container.add(nodeContainer);
    
    return {
      recipe,
      container: nodeContainer,
      x,
      y,
      bg
    };
  }
  
  /**
   * Format stat benefits for display
   * @param {Object} recipe - Recipe data
   * @returns {string} Formatted stat text
   */
  formatStatBenefits(recipe) {
    const stats = recipe.stats || recipe.bonus || {};
    const benefits = [];
    
    if (stats.atkPct) benefits.push(`+${(stats.atkPct * 100).toFixed(0)}% ATK`);
    if (stats.matkPct) benefits.push(`+${(stats.matkPct * 100).toFixed(0)}% MATK`);
    if (stats.hpPct) benefits.push(`+${(stats.hpPct * 100).toFixed(0)}% HP`);
    if (stats.defFlat) benefits.push(`+${stats.defFlat} DEF`);
    if (stats.mdefFlat) benefits.push(`+${stats.mdefFlat} MDEF`);
    if (stats.critPct) benefits.push(`+${(stats.critPct * 100).toFixed(0)}% Crit`);
    if (stats.lifestealPct) benefits.push(`+${(stats.lifestealPct * 100).toFixed(0)}% Hút máu`);
    if (stats.startingRage) benefits.push(`+${stats.startingRage} Nộ`);
    
    return benefits.join(", ") || "Xem mô tả";
  }
  
  /**
   * Create connections between recipe nodes
   * Shows which recipes use equipment from other recipes
   */
  createConnections() {
    // Find recipes that use equipment as ingredients
    this.nodes.forEach(targetNode => {
      const recipe = targetNode.recipe;
      const pattern = recipe._pattern || [];
      
      // Check if any ingredient is an equipment (from another recipe)
      pattern.forEach(ingredient => {
        if (ingredient && ingredient.kind === "equipment" && ingredient.id) {
          // Find the source node that produces this equipment
          const sourceNode = this.nodes.find(n => 
            n.recipe.id === ingredient.id.replace("eq_", "")
          );
          
          if (sourceNode) {
            this.createConnection(sourceNode, targetNode);
          }
        }
      });
    });
  }
  
  /**
   * Create a visual connection between two nodes
   * @param {Object} sourceNode - Source node
   * @param {Object} targetNode - Target node
   */
  createConnection(sourceNode, targetNode) {
    const line = this.scene.add.line(
      0, 0,
      sourceNode.x, sourceNode.y,
      targetNode.x, targetNode.y,
      0x95a5a6,
      0.3
    );
    line.setOrigin(0, 0);
    line.setLineWidth(2);
    
    // Add to container at the back
    this.container.addAt(line, 0);
    
    this.connections.push({
      line,
      source: sourceNode,
      target: targetNode
    });
  }
  
  /**
   * Handle node click - highlight related recipes
   * @param {Object} recipe - Clicked recipe
   * @param {Phaser.GameObjects.Container} nodeContainer - Node container
   */
  onNodeClick(recipe, nodeContainer) {
    // Reset previous selection
    if (this.selectedNode) {
      this.selectedNode.bg.setStrokeStyle(2, this.selectedNode.color, 0.8);
    }
    
    // Highlight selected node
    const node = this.nodes.find(n => n.container === nodeContainer);
    if (node) {
      node.bg.setStrokeStyle(3, 0xffffff, 1.0);
      this.selectedNode = node;
      
      // Highlight related connections
      this.highlightRelatedRecipes(recipe);
    }
  }

  enablePanZoom() {
    if (!this.scene?.add?.zone) return;
    this.interactionZone = this.scene.add.zone(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
    this.interactionZone.setInteractive?.();

    this._isDragging = false;
    this._lastPointer = null;

    this.interactionZone.on?.("pointerdown", (pointer) => {
      this._isDragging = true;
      this._lastPointer = { x: pointer.x, y: pointer.y };
    });

    this.interactionZone.on?.("pointerup", () => {
      this._isDragging = false;
      this._lastPointer = null;
    });

    this.interactionZone.on?.("pointerout", () => {
      this._isDragging = false;
      this._lastPointer = null;
    });

    this.interactionZone.on?.("pointermove", (pointer) => {
      if (!this._isDragging || !this._lastPointer) return;
      const dx = pointer.x - this._lastPointer.x;
      const dy = pointer.y - this._lastPointer.y;
      this._lastPointer = { x: pointer.x, y: pointer.y };
      this.pan(dx, dy);
    });

    this.interactionZone.on?.("wheel", (_pointer, _dx, dy) => {
      this.handleWheel(dy);
    });
  }

  handleWheel(deltaY) {
    const step = deltaY > 0 ? -0.08 : 0.08;
    this.setZoom(this.zoom + step);
  }

  setZoom(nextZoom) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));
    this.applyTransform();
  }

  pan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.applyTransform();
  }

  applyTransform() {
    this.container.x = this.x + this.panX;
    this.container.y = this.y + this.panY;
    if (typeof this.container.setScale === "function") {
      this.container.setScale(this.zoom);
    } else {
      this.container.scaleX = this.zoom;
      this.container.scaleY = this.zoom;
    }
  }
  
  /**
   * Highlight recipes and connections related to the selected recipe
   * @param {Object} recipe - Selected recipe
   */
  highlightRelatedRecipes(recipe) {
    // Reset all connections
    this.connections.forEach(conn => {
      conn.line.setStrokeStyle(2, 0x95a5a6, 0.3);
    });
    
    // Highlight connections involving this recipe
    this.connections.forEach(conn => {
      if (conn.source.recipe.id === recipe.id || conn.target.recipe.id === recipe.id) {
        conn.line.setStrokeStyle(3, 0xf39c12, 0.8);
      }
    });
    
    // Highlight nodes that are connected
    const relatedRecipeIds = new Set();
    this.connections.forEach(conn => {
      if (conn.source.recipe.id === recipe.id) {
        relatedRecipeIds.add(conn.target.recipe.id);
      }
      if (conn.target.recipe.id === recipe.id) {
        relatedRecipeIds.add(conn.source.recipe.id);
      }
    });
    
    this.nodes.forEach(node => {
      if (relatedRecipeIds.has(node.recipe.id)) {
        node.bg.setStrokeStyle(2, 0xf39c12, 0.6);
      }
    });
  }
  
  /**
   * Destroy the diagram and clean up
   */
  destroy() {
    this.interactionZone?.destroy?.();
    this.container.destroy();
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
  }
}
