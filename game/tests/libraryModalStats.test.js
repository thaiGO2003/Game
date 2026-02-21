/**
 * Test LibraryModal Stats Display
 * Kiểm tra xem stats trong thư viện có hiển thị đúng không
 */

const fs = require('fs');
const path = require('path');

// Mock Phaser
global.Phaser = {
  GameObjects: {
    Container: class Container {
      constructor() {
        this.list = [];
      }
      add(obj) {
        if (Array.isArray(obj)) {
          this.list.push(...obj);
        } else {
          this.list.push(obj);
        }
      }
      removeAll() {
        this.list = [];
      }
      setY() { return this; }
      setVisible() { return this; }
    }
  }
};

// Load unitCatalog
const unitsCsvPath = path.join(__dirname, '../data/units.csv');
const unitsCsv = fs.readFileSync(unitsCsvPath, 'utf8');

function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  
  const numericFields = ['tier', 'hp', 'atk', 'def', 'matk', 'mdef', 'range', 'rageMax'];
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = "";
    let inQuote = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuote && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const unit = {};
    const stats = {};
    
    headers.forEach((header, index) => {
      let value = values[index];
      
      if (value === undefined || value === null) {
        value = '';
      }
      
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      value = value.trim();
      
      if (!header || value === "") return;

      if (numericFields.includes(header)) {
        const numValue = Number(value);
        if (header === "tier") {
          unit.tier = numValue;
        } else {
          stats[header] = numValue;
        }
      } else if (header === "tribeVi" || header === "classVi") {
        // Skip
      } else {
        unit[header] = value;
      }
    });
    
    unit.stats = stats;
    data.push(unit);
  }
  return data;
}

const UNIT_CATALOG = parseCsv(unitsCsv);
const UNIT_BY_ID = Object.fromEntries(UNIT_CATALOG.map((u) => [u.id, u]));

// Helper function từ LibraryModal
function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '' || value === '?') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

describe('LibraryModal Stats Display', () => {
  test('unitCatalog should have stats object', () => {
    expect(UNIT_CATALOG.length).toBeGreaterThan(0);
    
    const firstUnit = UNIT_CATALOG[0];
    expect(firstUnit).toHaveProperty('stats');
    expect(typeof firstUnit.stats).toBe('object');
  });

  test('all units should have stats with numeric values', () => {
    const requiredStats = ['hp', 'atk', 'def', 'matk', 'mdef', 'range', 'rageMax'];
    
    UNIT_CATALOG.forEach((unit, idx) => {
      expect(unit.stats).toBeDefined();
      
      requiredStats.forEach(stat => {
        expect(unit.stats).toHaveProperty(stat);
        expect(typeof unit.stats[stat]).toBe('number');
        expect(Number.isFinite(unit.stats[stat])).toBe(true);
      });
    });
  });

  test('toNumber helper should convert stats correctly', () => {
    const testUnit = UNIT_CATALOG[0];
    const stats = testUnit.stats || {};
    
    const hp = toNumber(stats.hp, 100);
    const atk = toNumber(stats.atk, 50);
    const def = toNumber(stats.def, 20);
    
    expect(typeof hp).toBe('number');
    expect(typeof atk).toBe('number');
    expect(typeof def).toBe('number');
    
    expect(hp).toBeGreaterThan(0);
    expect(atk).toBeGreaterThan(0);
    expect(def).toBeGreaterThan(0);
    
    // Không nên là fallback values
    expect(hp).not.toBe(100);
    expect(atk).not.toBe(50);
    expect(def).not.toBe(20);
  });

  test('stats should not be undefined or null', () => {
    UNIT_CATALOG.forEach((unit) => {
      const stats = unit.stats || {};
      
      expect(stats.hp).not.toBeUndefined();
      expect(stats.hp).not.toBeNull();
      expect(stats.hp).not.toBe('?');
      
      expect(stats.atk).not.toBeUndefined();
      expect(stats.atk).not.toBeNull();
      expect(stats.atk).not.toBe('?');
      
      expect(stats.def).not.toBeUndefined();
      expect(stats.def).not.toBeNull();
      expect(stats.def).not.toBe('?');
    });
  });

  test('UNIT_BY_ID should have same structure', () => {
    const unitIds = Object.keys(UNIT_BY_ID);
    expect(unitIds.length).toBeGreaterThan(0);
    
    unitIds.forEach(id => {
      const unit = UNIT_BY_ID[id];
      expect(unit).toHaveProperty('stats');
      expect(unit.stats).toHaveProperty('hp');
      expect(unit.stats).toHaveProperty('atk');
      expect(unit.stats).toHaveProperty('def');
      
      expect(typeof unit.stats.hp).toBe('number');
      expect(typeof unit.stats.atk).toBe('number');
      expect(typeof unit.stats.def).toBe('number');
    });
  });

  test('sample units should have correct stats', () => {
    // Test một vài unit cụ thể
    const sampleIds = ['turtle_stone_tanker_1', 'leopard_night_assassin_1', 'eagle_wind_archer_1'];
    
    sampleIds.forEach(id => {
      const unit = UNIT_BY_ID[id];
      if (unit) {
        console.log(`\n${id}:`);
        console.log(`  HP: ${unit.stats.hp}`);
        console.log(`  ATK: ${unit.stats.atk}`);
        console.log(`  DEF: ${unit.stats.def}`);
        console.log(`  MATK: ${unit.stats.matk}`);
        console.log(`  MDEF: ${unit.stats.mdef}`);
        console.log(`  Range: ${unit.stats.range}`);
        console.log(`  RageMax: ${unit.stats.rageMax}`);
        
        expect(unit.stats.hp).toBeGreaterThan(0);
        expect(unit.stats.atk).toBeGreaterThan(0);
        expect(unit.stats.def).toBeGreaterThan(0);
      }
    });
  });

  test('stats should not have top-level hp/atk/def', () => {
    // Kiểm tra xem unit có hp/atk/def ở top level không (không nên có)
    UNIT_CATALOG.forEach((unit) => {
      // Stats nên ở trong unit.stats, không phải unit.hp
      expect(unit.hp).toBeUndefined();
      expect(unit.atk).toBeUndefined();
      expect(unit.def).toBeUndefined();
      
      // Nhưng unit.stats.hp phải có
      expect(unit.stats.hp).toBeDefined();
      expect(unit.stats.atk).toBeDefined();
      expect(unit.stats.def).toBeDefined();
    });
  });

  test('LibraryModal renderUnitDetail logic should work', () => {
    // Simulate logic trong LibraryModal.renderUnitDetail
    const testUnit = UNIT_CATALOG[0];
    
    const stats = testUnit.stats || {};
    const hp = toNumber(stats.hp, 100);
    const atk = toNumber(stats.atk, 50);
    const def = toNumber(stats.def, 20);
    const matk = toNumber(stats.matk, 20);
    const mdef = toNumber(stats.mdef, 20);
    const range = toNumber(stats.range, 1);
    const rageMax = toNumber(stats.rageMax, 3);
    
    // Tất cả phải là số hợp lệ
    expect(Number.isFinite(hp)).toBe(true);
    expect(Number.isFinite(atk)).toBe(true);
    expect(Number.isFinite(def)).toBe(true);
    expect(Number.isFinite(matk)).toBe(true);
    expect(Number.isFinite(mdef)).toBe(true);
    expect(Number.isFinite(range)).toBe(true);
    expect(Number.isFinite(rageMax)).toBe(true);
    
    // Không nên là fallback values (trừ khi unit thực sự có giá trị đó)
    expect(hp).toBeGreaterThan(0);
    expect(atk).toBeGreaterThan(0);
    
    console.log('\nTest unit stats:');
    console.log(`  HP: ${hp} (should not be 100 unless actual value)`);
    console.log(`  ATK: ${atk} (should not be 50 unless actual value)`);
    console.log(`  DEF: ${def} (should not be 20 unless actual value)`);
  });
});
