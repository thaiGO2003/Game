import { UNIT_CATALOG, UNIT_BY_ID } from "../data/unitCatalog.js";
import { SKILL_LIBRARY } from "../data/skills.js";
import { CRAFT_RECIPES, ITEM_BY_ID } from "../data/items.js";
import { getClassLabelVi, getTribeLabelVi, getUnitVisual } from "../data/unitVisuals.js";
import { CLASS_SYNERGY, TRIBE_SYNERGY } from "../data/synergies.js";
import { getElementLabel } from "../data/elementInfo.js";
import {
  describeBasicAttack,
  describeSkillWithElement,
  getSpeciesEvasion,
  getClassAccuracy
} from "../core/unitDescriptionHelper.js";
import { RecipeDiagram } from "./RecipeDiagram.js";
import { AttackPreview } from "./AttackPreview.js";
import { SkillPreview } from "./SkillPreview.js";
import { UI_FONT } from "../core/uiTheme.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '' || value === '?') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeRecipes() {
  return CRAFT_RECIPES.map((recipe) => ({
    ...recipe,
    _gridSize: recipe.gridSize ?? 2,
    _pattern: Array.from({ length: (recipe.gridSize ?? 2) ** 2 }, (_, idx) => {
      const itemId = recipe.pattern?.[idx] ?? null;
      if (!itemId) return null;
      const item = ITEM_BY_ID[itemId];
      if (!item) return null;
      return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        kind: item.kind
      };
    }),
    bonus: { ...(recipe.bonus ?? {}) }
  }));
}

export class LibraryModal {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;
    this.depth = options.depth ?? 6000;
    this.title = options.title ?? "Thư Viện Linh Thú";
    this.activeTab = "units";
    this.searchQuery = "";
    this.filterClass = null;
    this.filterTribe = null;
    this.filterTier = null;
    this.detailUnitId = null;
    this.scrollY = 0;
    this.maxScroll = 0;
    this.visible = false;
    this.overlayParts = [];
    this.recipeDiagram = null;
    this.attackPreview = null;
    this.skillPreview = null;
    this.recipes = normalizeRecipes();
    this.build();
    this.setVisible(false);
  }

  build() {
    const scene = this.scene;
    const width = scene.scale.width;
    const height = scene.scale.height;
    const modalW = Math.min(1060, width - 40);
    const modalH = Math.min(760, height - 40);
    const modalX = width / 2;
    const modalY = height / 2;
    const viewportX = modalX - modalW / 2 + 24;
    const viewportY = modalY - modalH / 2 + 144;
    const viewportW = modalW - 48;
    const viewportH = modalH - 176;

    this.layout = {
      modalW,
      modalH,
      modalX,
      modalY,
      viewportX,
      viewportY,
      viewportW,
      viewportH
    };

    this.dimmer = scene.add.rectangle(modalX, modalY, width, height, 0x060d17, 0.85);
    this.dimmer.setDepth(this.depth);
    this.dimmer.setInteractive({ useHandCursor: true });
    this.dimmer.on("pointerdown", () => this.hide());

    this.panel = scene.add.rectangle(modalX, modalY, modalW, modalH, 0x0e1828, 0.98);
    this.panel.setDepth(this.depth + 1);
    this.panel.setStrokeStyle(1, 0x5aa8c8, 1);
    this.panel.setInteractive();

    this.titleText = scene.add.text(modalX - modalW / 2 + 24, modalY - modalH / 2 + 20, this.title, {
      fontFamily: UI_FONT,
      fontSize: "24px",
      color: "#e9f5ff",
      fontStyle: "bold"
    });
    this.titleText.setDepth(this.depth + 2);

    this.subtitleText = scene.add.text(modalX - modalW / 2 + 24, modalY - modalH / 2 + 54, "Dữ liệu tự động từ unitCatalog + skills.", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: "#a6bed3"
    });
    this.subtitleText.setDepth(this.depth + 2);

    this.closeBg = scene.add.rectangle(modalX + modalW / 2 - 88, modalY - modalH / 2 + 36, 120, 34, 0x162433, 0.94);
    this.closeBg.setStrokeStyle(1, 0x39576f, 0.9);
    this.closeBg.setDepth(this.depth + 2);
    this.closeBg.setInteractive({ useHandCursor: true });
    this.closeBg.on("pointerdown", () => this.hide());

    this.closeText = scene.add.text(this.closeBg.x, this.closeBg.y, "Đóng", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: "#e9f5ff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.closeText.setDepth(this.depth + 3);

    this.unitTab = this.createTab(modalX - modalW / 2 + 24, modalY - modalH / 2 + 86, 180, "🐾 LINH THÚ", "units");
    this.recipeTab = this.createTab(modalX - modalW / 2 + 214, modalY - modalH / 2 + 86, 180, "⚗️ CÔNG THỨC", "recipes");

    this.filterContainer = scene.add.container(modalX - modalW / 2 + 24, modalY - modalH / 2 + 128);
    this.filterContainer.setDepth(this.depth + 2);

    this.contentContainer = scene.add.container(viewportX, viewportY);
    this.contentContainer.setDepth(this.depth + 2);
    this.baseContentY = viewportY;

    const maskShape = scene.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(viewportX, viewportY, viewportW, viewportH);
    this.contentMaskShape = maskShape;
    this.contentContainer.setMask(maskShape.createGeometryMask());

    // Register wheel scrolling on the panel itself (no separate blocking zone)
    this.panel.on("wheel", (_pointer, _dx, dy) => this.scrollBy(dy));

    this.overlayParts = [
      this.dimmer,
      this.panel,
      this.titleText,
      this.subtitleText,
      this.closeBg,
      this.closeText,
      this.unitTab.bg,
      this.unitTab.text,
      this.recipeTab.bg,
      this.recipeTab.text,
      this.filterContainer,
      this.contentContainer,
      this.contentMaskShape
    ];

    this.refreshTabStyles();
  }

  createTab(x, y, width, label, key) {
    const bg = this.scene.add.rectangle(x + width / 2, y, width, 30, 0x1a2d40, 0.8);
    bg.setOrigin(0.5);
    bg.setStrokeStyle(1, 0x3a5070, 1);
    bg.setDepth(this.depth + 2);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      if (this.activeTab === key) return;
      this.activeTab = key;
      this.scrollY = 0;
      if (key !== "units") this.detailUnitId = null;
      this.refresh();
    });

    const text = this.scene.add.text(x + width / 2, y, label, {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: "#8ab4d4",
      fontStyle: "bold"
    }).setOrigin(0.5);
    text.setDepth(this.depth + 3);

    return { bg, text, key };
  }

  getOverlayParts() {
    return this.overlayParts;
  }

  setVisible(next) {
    this.visible = !!next;
    this.overlayParts.forEach((part) => part?.setVisible(this.visible));
    if (!this.visible) {
      this.destroyRecipeDiagram();
      this.destroyPreviews();
    }
    if (!this.visible && this.options.onClose) {
      this.options.onClose();
    }
  }

  isOpen() {
    return this.visible;
  }

  show() {
    if (this.visible) return;
    this.setVisible(true);
    if (this.options.onOpen) this.options.onOpen();
    this.refresh();
  }

  hide() {
    if (!this.visible) return;
    this.setVisible(false);
  }

  toggle(force = null) {
    const next = typeof force === "boolean" ? force : !this.visible;
    if (next) this.show();
    else this.hide();
  }

  scrollBy(deltaY) {
    if (!this.visible) return;
    this.scrollY = clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
    this.contentContainer.setY(this.baseContentY - this.scrollY);
  }

  setDetailUnit(unitId) {
    this.activeTab = "units";
    this.detailUnitId = unitId;
    this.scrollY = 0;
    this.refresh();
  }

  refresh() {
    if (!this.visible) return;
    this.contentContainer.removeAll(true);
    this.destroyRecipeDiagram();
    this.destroyPreviews();
    this.refreshTabStyles();
    this.refreshSearchUi();

    let y = 0;
    if (this.activeTab === "units") {
      y = this.renderUnitsTab(y);
    } else {
      y = this.renderRecipesTab(y);
    }
    this.maxScroll = Math.max(0, y - this.layout.viewportH);
    this.scrollY = clamp(this.scrollY, 0, this.maxScroll);
    this.contentContainer.setY(this.baseContentY - this.scrollY);
  }

  refreshTabStyles() {
    const setStyle = (tab, active) => {
      tab.bg.setFillStyle(active ? 0x2a5080 : 0x1a2d40, active ? 1 : 0.8);
      tab.bg.setStrokeStyle(1, active ? 0x7ab8f5 : 0x3a5070, 1);
      tab.text.setColor(active ? "#ffeab0" : "#8ab4d4");
    };
    setStyle(this.unitTab, this.activeTab === "units");
    setStyle(this.recipeTab, this.activeTab === "recipes");
  }

  createButton(x, y, width, height, label, onClick, bgFill = 0x233850, stroke = 0x5a8ab0, parent = null) {
    const bg = this.scene.add.rectangle(x, y, width, height, bgFill, 0.9).setOrigin(0.5);
    bg.setStrokeStyle(1, stroke, 1);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(0x355070, 0.95));
    bg.on("pointerout", () => bg.setFillStyle(bgFill, 0.9));
    bg.on("pointerdown", onClick);

    const txt = this.scene.add.text(x, y, label, {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: "#e9f5ff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    if (parent) {
      parent.add([bg, txt]);
    }
    return { bg, label: txt };
  }

  refreshSearchUi() {
    this.filterContainer.removeAll(true);
    const showFilter = this.activeTab === "units" && !this.detailUnitId;
    if (!showFilter) return;

    let filterX = 0;
    const filterY = 0;
    const btnH = 30;
    const spacing = 14;

    // Filter: Class
    const classW = 140;
    const classLabel = this.filterClass ? getClassLabelVi(this.filterClass) : "Tất cả Nghề";
    this.createButton(filterX + classW / 2, filterY, classW, btnH, classLabel, () => {
      const options = ["ALL", ...Object.keys(CLASS_SYNERGY)];
      const nextIdx = (options.indexOf(this.filterClass || "ALL") + 1) % options.length;
      this.filterClass = options[nextIdx] === "ALL" ? null : options[nextIdx];
      this.refresh();
    }, 0x233850, 0x5a8ab0, this.filterContainer);
    filterX += classW + spacing;

    // Filter: Tribe
    const tribeW = 140;
    const tribeLabel = this.filterTribe ? getTribeLabelVi(this.filterTribe) : "Tất cả Tộc";
    this.createButton(filterX + tribeW / 2, filterY, tribeW, btnH, tribeLabel, () => {
      const options = ["ALL", ...Object.keys(TRIBE_SYNERGY)];
      const nextIdx = (options.indexOf(this.filterTribe || "ALL") + 1) % options.length;
      this.filterTribe = options[nextIdx] === "ALL" ? null : options[nextIdx];
      this.refresh();
    }, 0x233850, 0x5a8ab0, this.filterContainer);
    filterX += tribeW + spacing;

    // Filter: Tier
    const tierW = 120;
    const tierLabel = this.filterTier ? `Bậc ${this.filterTier}` : "Tất cả Bậc";
    this.createButton(filterX + tierW / 2, filterY, tierW, btnH, tierLabel, () => {
      const options = [0, 1, 2, 3, 4, 5];
      const nextIdx = (options.indexOf(this.filterTier || 0) + 1) % options.length;
      this.filterTier = options[nextIdx] === 0 ? null : options[nextIdx];
      this.refresh();
    }, 0x233850, 0x5a8ab0, this.filterContainer);
    filterX += tierW + spacing;

    // Search
    const searchW = 200;
    const searchLabel = this.searchQuery ? `🔍 "${this.searchQuery}"` : "🔍 Tìm kiếm...";
    this.createButton(filterX + searchW / 2, filterY, searchW, btnH, searchLabel, () => {
      const input = window.prompt("Nhập tên linh thú để tìm kiếm:", this.searchQuery);
      if (input !== null) {
        this.searchQuery = String(input).trim();
        this.refresh();
      }
    }, 0x112235, 0x3a5070, this.filterContainer).label.setFontSize(13);
    filterX += searchW + spacing;

    // Reset
    if (this.filterClass || this.filterTribe || this.filterTier || this.searchQuery) {
      const resetW = 80;
      this.createButton(filterX + resetW / 2, filterY, resetW, btnH, "Xóa lọc", () => {
        this.filterClass = null;
        this.filterTribe = null;
        this.filterTier = null;
        this.searchQuery = "";
        this.refresh();
      }, 0x3b2e2e, 0xff5555, this.filterContainer);
    }
  }

  renderUnitsTab(y) {
    if (this.detailUnitId) {
      return this.renderUnitDetail(y, this.detailUnitId);
    }

    let units = [...UNIT_CATALOG];

    if (this.filterClass) {
      units = units.filter(u => u.classType === this.filterClass);
    }
    if (this.filterTribe) {
      units = units.filter(u => u.tribe === this.filterTribe);
    }
    if (this.filterTier) {
      units = units.filter(u => u.tier === this.filterTier);
    }
    const query = String(this.searchQuery ?? "").trim().toLowerCase();
    if (query) {
      units = units.filter((unit) => {
        const visual = getUnitVisual(unit.id, unit.classType);
        return (
          visual.nameVi.toLowerCase().includes(query) ||
          String(unit.id).toLowerCase().includes(query) ||
          getClassLabelVi(unit.classType).toLowerCase().includes(query) ||
          getTribeLabelVi(unit.tribe).toLowerCase().includes(query)
        );
      });
    }
    units.sort((a, b) => a.tier - b.tier || String(a.classType).localeCompare(String(b.classType)));

    const intro = this.scene.add.text(0, y, `Tổng thú: ${units.length}`, {
      fontFamily: UI_FONT,
      fontSize: "16px",
      color: "#d8edff"
    });
    this.contentContainer.add(intro);
    y += intro.height + 10;

    const columns = this.layout.viewportW > 860 ? 2 : 1;
    const gap = 12;
    const cardW = Math.floor((this.layout.viewportW - gap * (columns - 1)) / columns);
    const cardH = 96;

    units.forEach((unit, idx) => {
      const col = idx % columns;
      const row = Math.floor(idx / columns);
      const cardX = col * (cardW + gap);
      const cardY = y + row * (cardH + 8);
      const visual = getUnitVisual(unit.id, unit.classType);
      const skill = SKILL_LIBRARY[unit.skillId];

      const bg = this.scene.add.rectangle(cardX, cardY, cardW, cardH, idx % 2 === 0 ? 0x182b44 : 0x16273f, 0.88).setOrigin(0, 0);
      bg.setStrokeStyle(1, 0x7ab8f5, 0.45);
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerover", () => bg.setStrokeStyle(1, 0xffeab0, 0.9));
      bg.on("pointerout", () => bg.setStrokeStyle(1, 0x7ab8f5, 0.45));
      bg.on("pointerdown", () => {
        this.detailUnitId = unit.id;
        this.scrollY = 0;
        this.refresh();
      });

      const name = this.scene.add.text(cardX + 10, cardY + 8, `${visual.icon} ${visual.nameVi}`, {
        fontFamily: UI_FONT,
        fontSize: "15px",
        color: "#ffeab0",
        fontStyle: "bold"
      });
      const meta = this.scene.add.text(cardX + 10, cardY + 32, `Bậc ${unit.tier} • ${getTribeLabelVi(unit.tribe)} • ${getClassLabelVi(unit.classType)}`, {
        fontFamily: UI_FONT,
        fontSize: "13px",
        color: "#a6bed3"
      });
      const skillText = this.scene.add.text(cardX + 10, cardY + 56, `Kỹ năng: ${skill?.name ?? unit.skillId}`, {
        fontFamily: UI_FONT,
        fontSize: "13px",
        color: "#d6f5ff"
      });

      this.contentContainer.add([bg, name, meta, skillText]);
    });

    const rows = Math.ceil(units.length / columns);
    return y + rows * (cardH + 8) + 8;
  }

  renderUnitDetail(y, unitId) {
    const unit = UNIT_BY_ID[unitId];
    if (!unit) {
      this.detailUnitId = null;
      return this.renderUnitsTab(y);
    }

    const visual = getUnitVisual(unit.id, unit.classType);
    const skill = SKILL_LIBRARY[unit.skillId];

    // Lấy stats từ unit.stats (không fallback sang unit.hp vì không tồn tại)
    const stats = unit.stats || {};
    const hp = toNumber(stats.hp, 100);
    const atk = toNumber(stats.atk, 50);
    const def = toNumber(stats.def, 20);
    const matk = toNumber(stats.matk, 20);
    const mdef = toNumber(stats.mdef, 20);
    const range = toNumber(stats.range, 1);
    const rageMax = toNumber(stats.rageMax, 3);

    // Accuracy & Evasion from shared helpers (species-based from CSV)
    const accuracy = getClassAccuracy(unit.classType, unit.tier);
    const evasion = getSpeciesEvasion(unit.species);

    // Element label
    const elementLabel = getElementLabel(unit.tribe);

    const back = this.scene.add.text(0, y, "← Quay lại danh sách", {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: "#7ab8f5"
    }).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => {
      this.detailUnitId = null;
      this.scrollY = 0;
      this.refresh();
    });
    this.contentContainer.add(back);
    y += 28;

    const panelH = 500;
    const panel = this.scene.add.rectangle(0, y, this.layout.viewportW - 14, panelH, 0x0f1e30, 0.95).setOrigin(0, 0);
    panel.setStrokeStyle(1, 0x5a8ab0, 0.8);
    this.contentContainer.add(panel);

    const title = this.scene.add.text(16, y + 12, `${visual.icon} ${visual.nameVi}`, {
      fontFamily: UI_FONT,
      fontSize: "26px",
      color: "#ffeab0",
      fontStyle: "bold"
    });
    const tier = this.scene.add.text(this.layout.viewportW - 40, y + 16, `Bậc ${unit.tier}`, {
      fontFamily: UI_FONT,
      fontSize: "16px",
      color: "#8df2ff"
    }).setOrigin(1, 0);

    const desc = [
      `${elementLabel ? elementLabel + " " : ""}🏷️ Tộc: ${getTribeLabelVi(unit.tribe)}    ⚔️ Nghề: ${getClassLabelVi(unit.classType)}`,
      `❤️ HP: ${hp}    🗡️ ATK: ${atk}    🛡️ DEF: ${def}`,
      `✨ MATK: ${matk}    🔰 MDEF: ${mdef}`,
      `🎯 Chính xác: ${accuracy}%    💨 Né tránh: ${evasion}%`,
      `🔥 Nộ: ${rageMax}`
    ].join("\n");
    const meta = this.scene.add.text(16, y + 52, desc, {
      fontFamily: UI_FONT,
      fontSize: "14px",
      color: "#c0ddf5",
      lineSpacing: 10
    });

    const skillTitle = this.scene.add.text(16, y + 180, "⚡ KỸ NĂNG:", {
      fontFamily: UI_FONT,
      fontSize: "15px",
      color: "#ffd580",
      fontStyle: "bold"
    });
    const skillName = this.scene.add.text(16, y + 206, skill?.name ?? unit.skillId, {
      fontFamily: UI_FONT,
      fontSize: "18px",
      color: "#8df2ff",
      fontStyle: "bold"
    });
    const skillDesc = this.scene.add.text(16, y + 236, skill?.descriptionVi ?? skill?.description ?? "Chưa có mô tả.", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: "#d0eaff",
      lineSpacing: 6,
      wordWrap: { width: this.layout.viewportW - 48 }
    });

    // Element effect lines per star
    const skillElementLines = describeSkillWithElement(skill, unit.tribe, unit);
    const elementEffectsText = skillElementLines.filter(l => l.startsWith("⭐")).join("\n");
    const elementSection = this.scene.add.text(16, y + 290, elementEffectsText, {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: "#b8e8b0",
      lineSpacing: 6,
      wordWrap: { width: this.layout.viewportW - 48 }
    });

    // Basic attack description
    const basicAtkLines = describeBasicAttack(unit.classType, range, stats);
    const basicAtkSection = this.scene.add.text(16, y + 340, `🎯 Đánh thường:\n${basicAtkLines.map(l => `  • ${l}`).join("\n")}`, {
      fontFamily: UI_FONT,
      fontSize: "12px",
      color: "#c8d8f0",
      lineSpacing: 5,
      wordWrap: { width: this.layout.viewportW - 48 }
    });

    this.contentContainer.add([title, tier, meta, skillTitle, skillName, skillDesc, elementSection, basicAtkSection]);

    let currentY = y + panelH + 16;

    // Add preview section
    const previewTitle = this.scene.add.text(16, currentY, "🎯 PREVIEW TARGETING:", {
      fontFamily: UI_FONT,
      fontSize: "15px",
      color: "#ffd580",
      fontStyle: "bold"
    });
    this.contentContainer.add(previewTitle);
    currentY += 28;

    // Create previews side by side
    const previewW = Math.floor((this.layout.viewportW - 48) / 2);
    const previewH = 180;

    this.attackPreview = new AttackPreview(
      this.scene,
      16,
      currentY,
      previewW,
      previewH,
      unit
    );
    this.contentContainer.add(this.attackPreview.container);

    this.skillPreview = new SkillPreview(
      this.scene,
      16 + previewW + 16,
      currentY,
      previewW,
      previewH,
      unit,
      skill
    );
    this.contentContainer.add(this.skillPreview.container);

    currentY += previewH + 16;

    return currentY;
  }

  renderRecipesTab(y) {
    const title = this.scene.add.text(0, y, "Sơ đồ công thức chế tạo", {
      fontFamily: UI_FONT,
      fontSize: "20px",
      color: "#ffeab0",
      fontStyle: "bold"
    });
    this.contentContainer.add(title);
    y += title.height + 6;

    const hint = this.scene.add.text(0, y, "Màu đỏ: Công | Màu xanh: Thủ | Màu tím: Phép. Cuộn chuột để di chuyển danh sách.", {
      fontFamily: UI_FONT,
      fontSize: "13px",
      color: "#9ec4e8"
    });
    this.contentContainer.add(hint);
    y += hint.height + 12;

    this.recipeDiagram = new RecipeDiagram(this.scene, 0, y + 20, this.layout.viewportW - 14, 0, this.recipes);
    const diagramHeight = this.recipeDiagram.calculatedHeight ?? 860;
    this.contentContainer.add(this.recipeDiagram.container);
    y += diagramHeight + 40;

    return y;
  }

  destroyRecipeDiagram() {
    if (this.recipeDiagram) {
      this.recipeDiagram.destroy();
      this.recipeDiagram = null;
    }
  }

  destroyPreviews() {
    if (this.attackPreview) {
      this.attackPreview.destroy();
      this.attackPreview = null;
    }
    if (this.skillPreview) {
      this.skillPreview.destroy();
      this.skillPreview = null;
    }
  }

  destroy() {
    this.destroyRecipeDiagram();
    this.destroyPreviews();
    this.overlayParts.forEach((part) => part?.destroy?.());
    this.overlayParts = [];
  }
}

