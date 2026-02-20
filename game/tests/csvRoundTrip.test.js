/**
 * Property Test: CSV Round-Trip Validation
 * 
 * **Validates: Requirement 1.5**
 * 
 * Feature: post-launch-fixes, Property 2: CSV Round-Trip Validation
 * 
 * This test verifies that for any valid units.csv file, parsing the file then
 * validating uniqueness should confirm zero duplicate emojis. This ensures the
 * CSV parsing and validation pipeline works correctly.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';

/**
 * Parses CSV file with robust error handling
 * @param {string} csvContent - CSV file content as string
 * @returns {Array} - Array of parsed unit objects
 */
function parseCsvContent(csvContent) {
  const lines = csvContent.trim().split(/\r?\n/);
  
  if (lines.length === 0) {
    throw new Error('CSV content is empty');
  }
  
  // Parse headers with trimming
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Define numeric fields that should be converted to numbers
  const numericFields = ['tier', 'hp', 'atk', 'def', 'matk', 'mdef', 'range', 'rageMax'];
  
  return lines.slice(1).map((line, index) => {
    const lineNumber = index + 2; // +2 because: +1 for 0-index, +1 for header row
    
    const values = [];
    let current = "";
    let inQuote = false;
    
    // Parse CSV with quoted field support
    for (const char of line) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    
    // Pad values array if shorter than headers
    while (values.length < headers.length) {
      values.push('');
    }
    
    // Build object with proper field handling
    const obj = {};
    headers.forEach((header, i) => {
      let value = values[i];
      
      if (value === undefined || value === null) {
        value = '';
      }
      
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // Trim whitespace from all string fields
      value = value.trim();
      
      // Handle empty fields
      if (value === '') {
        if (numericFields.includes(header)) {
          obj[header] = undefined;
          return;
        }
        obj[header] = '';
        return;
      }
      
      // Convert numeric fields to numbers
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
    
    return obj;
  });
}

/**
 * Validates emoji uniqueness across all units
 * @param {Array} units - Array of unit objects
 * @returns {Object} - { valid: boolean, duplicates: Map<emoji, unit[]> }
 */
function validateEmojiUniqueness(units) {
  const emojiMap = new Map();
  
  // Build map of emoji -> units using that emoji
  units.forEach(unit => {
    const emoji = unit.icon;
    if (!emojiMap.has(emoji)) {
      emojiMap.set(emoji, []);
    }
    emojiMap.get(emoji).push(unit);
  });
  
  // Find duplicates (emojis used by more than one unit)
  const duplicates = new Map();
  for (const [emoji, unitList] of emojiMap.entries()) {
    if (unitList.length > 1) {
      duplicates.set(emoji, unitList);
    }
  }
  
  return {
    valid: duplicates.size === 0,
    duplicates: duplicates
  };
}

describe('CSV Round-Trip Validation Property Tests', () => {
  /**
   * Property 2: CSV Round-Trip Validation
   * 
   * For any valid units.csv file, parsing the file then validating uniqueness
   * should confirm zero duplicate emojis.
   */
  it('should confirm zero duplicate emojis after parsing units.csv', () => {
    // Read the actual units.csv file
    const csvPath = path.join(process.cwd(), 'data', 'units.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse the CSV content
    const units = parseCsvContent(csvContent);
    
    // Validate emoji uniqueness
    const result = validateEmojiUniqueness(units);
    
    // Assert zero duplicates
    if (!result.valid) {
      const errorMessage = Array.from(result.duplicates.entries())
        .map(([emoji, unitList]) => {
          const unitNames = unitList.map(u => `${u.name} (${u.id})`).join(', ');
          return `  Emoji ${emoji} used by: ${unitNames}`;
        })
        .join('\n');
      
      expect.fail(`Found ${result.duplicates.size} duplicate emoji(s):\n${errorMessage}`);
    }
    
    expect(result.valid).toBe(true);
    expect(result.duplicates.size).toBe(0);
  });

  /**
   * Property-Based Test: CSV Round-Trip with modified content
   * 
   * This test generates variations of the CSV content by selecting random subsets
   * of units and verifies that the parsing and validation pipeline correctly
   * identifies duplicate emojis (or confirms none exist).
   */
  it('should correctly validate emoji uniqueness across random unit subsets (property-based)', () => {
    // Read the actual units.csv file
    const csvPath = path.join(process.cwd(), 'data', 'units.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const allUnits = parseCsvContent(csvContent);
    
    fc.assert(
      fc.property(
        // Generate random subsets of unit indices
        fc.array(
          fc.integer({ min: 0, max: allUnits.length - 1 }),
          { minLength: 2, maxLength: allUnits.length }
        ).map(indices => {
          // Remove duplicates and map to actual units
          const uniqueIndices = [...new Set(indices)];
          return uniqueIndices.map(i => allUnits[i]);
        }),
        (unitSubset) => {
          // Validate emoji uniqueness for this subset
          const result = validateEmojiUniqueness(unitSubset);
          
          // Property: The validation should correctly identify duplicates
          // Count actual duplicates manually
          const emojiCounts = new Map();
          for (const unit of unitSubset) {
            emojiCounts.set(unit.icon, (emojiCounts.get(unit.icon) || 0) + 1);
          }
          
          const actualDuplicateCount = Array.from(emojiCounts.values())
            .filter(count => count > 1).length;
          
          // The validation result should match the actual duplicate count
          return (actualDuplicateCount === 0 && result.valid) ||
                 (actualDuplicateCount > 0 && !result.valid);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in the design
    );
  });

  /**
   * Property-Based Test: CSV parsing preserves emoji data
   * 
   * Verifies that parsing the CSV file preserves all emoji data correctly,
   * and that the icon field is always present and non-empty for valid units.
   */
  it('should preserve emoji data correctly during CSV parsing (property-based)', () => {
    const csvPath = path.join(process.cwd(), 'data', 'units.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const units = parseCsvContent(csvContent);
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: units.length - 1 }),
        (index) => {
          const unit = units[index];
          
          // Property: Every unit must have a non-empty icon field
          return unit.icon !== undefined &&
                 unit.icon !== null &&
                 unit.icon !== '' &&
                 typeof unit.icon === 'string';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property-Based Test: Round-trip consistency
   * 
   * Verifies that parsing the CSV and then validating produces consistent results
   * across multiple invocations. The validation result should be deterministic.
   */
  it('should produce consistent validation results across multiple parses (property-based)', () => {
    const csvPath = path.join(process.cwd(), 'data', 'units.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    fc.assert(
      fc.property(
        fc.constant(csvContent),
        (content) => {
          // Parse and validate multiple times
          const result1 = validateEmojiUniqueness(parseCsvContent(content));
          const result2 = validateEmojiUniqueness(parseCsvContent(content));
          
          // Property: Results should be identical
          return result1.valid === result2.valid &&
                 result1.duplicates.size === result2.duplicates.size;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit Test: Verify the actual units.csv has zero duplicates
   * 
   * This is a concrete test that verifies the current state of the units.csv file.
   */
  it('should have zero duplicate emojis in the current units.csv file', () => {
    const csvPath = path.join(process.cwd(), 'data', 'units.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const units = parseCsvContent(csvContent);
    
    const result = validateEmojiUniqueness(units);
    
    expect(result.valid).toBe(true);
    expect(result.duplicates.size).toBe(0);
    
    // Also verify we have 120 units
    expect(units.length).toBe(120);
  });

  /**
   * Unit Test: Verify CSV parsing handles edge cases
   * 
   * Tests that the CSV parser correctly handles quoted fields, empty fields,
   * and special characters.
   */
  it('should handle CSV edge cases correctly', () => {
    const testCsv = `id,name,icon,tier,hp
unit1,"Test Unit",🐯,1,100
unit2,"Unit, with comma",🐻,2,200
unit3,Simple Unit,🦁,3,300`;
    
    const units = parseCsvContent(testCsv);
    
    expect(units).toHaveLength(3);
    expect(units[0].name).toBe('Test Unit');
    expect(units[1].name).toBe('Unit, with comma');
    expect(units[2].name).toBe('Simple Unit');
    
    // Verify emoji uniqueness validation works on this test data
    const result = validateEmojiUniqueness(units);
    expect(result.valid).toBe(true);
  });

  /**
   * Unit Test: Verify validation detects duplicates correctly
   * 
   * Tests that the validation function correctly identifies duplicate emojis
   * when they exist.
   */
  it('should correctly detect duplicate emojis when present', () => {
    const unitsWithDuplicates = [
      { id: 'unit1', name: 'Unit 1', icon: '🐯' },
      { id: 'unit2', name: 'Unit 2', icon: '🐻' },
      { id: 'unit3', name: 'Unit 3', icon: '🐯' }, // Duplicate
    ];
    
    const result = validateEmojiUniqueness(unitsWithDuplicates);
    
    expect(result.valid).toBe(false);
    expect(result.duplicates.size).toBe(1);
    expect(result.duplicates.has('🐯')).toBe(true);
    expect(result.duplicates.get('🐯')).toHaveLength(2);
  });
});
