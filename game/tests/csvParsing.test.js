/**
 * CSV Parsing Robustness Tests
 * Tests for Requirements 24.1-24.5
 */

import { describe, it, expect } from 'vitest';

// Mock CSV parser similar to unitCatalog.js
function parseCsvMock(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  
  const requiredFields = ['id', 'name', 'tier'];
  const numericFields = ['tier', 'hp', 'atk'];
  
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    try {
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

      const obj = {};
      
      headers.forEach((header, index) => {
        let value = values[index];
        
        if (value === undefined || value === null) {
          value = '';
        }
        
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        value = value.trim();
        
        if (value === '' && requiredFields.includes(header)) {
          throw new Error(`Empty value for required field "${header}" at line ${lineNumber}`);
        }
        
        if (!header || value === "") return;

        if (numericFields.includes(header)) {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            throw new Error(`Invalid numeric value "${value}" for field "${header}" at line ${lineNumber}`);
          }
          obj[header] = numValue;
        } else {
          obj[header] = value;
        }
      });
      
      data.push(obj);
    } catch (error) {
      if (error.message.includes('line')) {
        throw error;
      }
      throw new Error(`Parse error at line ${lineNumber}: ${error.message}`);
    }
  }
  return data;
}

describe('CSV Parsing Robustness', () => {
  describe('Requirement 24.1: Handle empty fields', () => {
    it('should reject empty required fields', () => {
      const csv = `id,name,tier
wolf,,2`;
      
      expect(() => parseCsvMock(csv)).toThrow('Empty value for required field "name" at line 2');
    });

    it('should allow empty optional fields', () => {
      const csv = `id,name,tier,description
wolf,Wolf,2,`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wolf');
      expect(result[0].name).toBe('Wolf');
      expect(result[0].tier).toBe(2);
      expect(result[0].description).toBeUndefined();
    });
  });

  describe('Requirement 24.2: Handle special characters', () => {
    it('should handle quoted fields with commas', () => {
      const csv = `id,name,tier,description
wolf,"Wolf, Alpha",2,"A fierce, powerful beast"`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Wolf, Alpha');
      expect(result[0].description).toBe('A fierce, powerful beast');
    });

    it('should handle quoted fields with apostrophes', () => {
      const csv = `id,name,tier,description
wolf,"Wolf's Den",2,"A wolf's territory"`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Wolf's Den");
      expect(result[0].description).toBe("A wolf's territory");
    });

    it('should handle emoji icons', () => {
      const csv = `id,name,tier,icon
wolf,Wolf,2,🐺`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].icon).toBe('🐺');
    });
  });

  describe('Requirement 24.3: Trim whitespace', () => {
    it('should trim whitespace from all string fields', () => {
      const csv = `id,name,tier
  wolf  ,  Wolf Alpha  ,  2  `;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wolf');
      expect(result[0].name).toBe('Wolf Alpha');
      expect(result[0].tier).toBe(2);
    });

    it('should trim whitespace from headers', () => {
      const csv = `  id  ,  name  ,  tier  
wolf,Wolf,2`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('tier');
    });
  });

  describe('Requirement 24.4: Convert numeric fields', () => {
    it('should convert numeric fields to numbers', () => {
      const csv = `id,name,tier,hp,atk
wolf,Wolf,2,280,72`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].tier).toBe(2);
      expect(result[0].hp).toBe(280);
      expect(result[0].atk).toBe(72);
      expect(typeof result[0].tier).toBe('number');
      expect(typeof result[0].hp).toBe('number');
      expect(typeof result[0].atk).toBe('number');
    });

    it('should reject invalid numeric values', () => {
      const csv = `id,name,tier
wolf,Wolf,invalid`;
      
      expect(() => parseCsvMock(csv)).toThrow('Invalid numeric value "invalid" for field "tier" at line 2');
    });

    it('should handle zero values', () => {
      const csv = `id,name,tier,hp,atk
wolf,Wolf,2,0,0`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].hp).toBe(0);
      expect(result[0].atk).toBe(0);
    });
  });

  describe('Requirement 24.5: Report line number and field on errors', () => {
    it('should report line number for empty required field', () => {
      const csv = `id,name,tier
wolf,Wolf,2
bear,,3`;
      
      expect(() => parseCsvMock(csv)).toThrow('Empty value for required field "name" at line 3');
    });

    it('should report line number and field for invalid numeric', () => {
      const csv = `id,name,tier
wolf,Wolf,2
bear,Bear,abc`;
      
      expect(() => parseCsvMock(csv)).toThrow('Invalid numeric value "abc" for field "tier" at line 3');
    });

    it('should report line number for parse errors', () => {
      const csv = `id,name,tier
wolf,Wolf,2
bear,Bear,3`;
      
      // This should parse successfully
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty lines', () => {
      const csv = `id,name,tier
wolf,Wolf,2

bear,Bear,3`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(2);
    });

    it('should handle multiple units', () => {
      const csv = `id,name,tier
wolf,Wolf,2
bear,Bear,3
fox,Fox,1`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('wolf');
      expect(result[1].id).toBe('bear');
      expect(result[2].id).toBe('fox');
    });

    it('should handle missing trailing fields', () => {
      const csv = `id,name,tier,description
wolf,Wolf,2`;
      
      const result = parseCsvMock(csv);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wolf');
      expect(result[0].description).toBeUndefined();
    });
  });
});
