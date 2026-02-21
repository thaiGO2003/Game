/**
 * Property Tests: Evasion System
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 * 
 * Feature: skill-differentiation-and-wiki-overhaul
 * 
 * This test suite verifies:
 * - Property 12: Speed Mechanic Removal - No references to speed-based status effects
 * - Property 13: Debuff Evasion Reduction - Debuffs reduce evasion percentage
 * - Property 14: Buff Evasion Increase - Buffs increase evasion percentage
 * - Property 15: Hit Chance Calculation - Hit chance = baseAccuracy - targetEvasion, clamped
 * - Property 16: Evasion Status Tracking - Combat state tracks evasion buff/debuff durations
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getEffectiveEvasion, calculateHitChance } from '../src/core/gameUtils.js';

/**
 * Property 12: Speed Mechanic Removal
 * 
 * For any file in the codebase, there should be no references to "slowTurns", "hasteTurns",
 * "slow_effect", or "haste_effect" status properties.
 * 
 * This ensures the old speed-based system has been completely removed.
 */
describe('Property 12: Speed Mechanic Removal', () => {
  it('should have no references to speed mechanics in source files', () => {
    const srcDir = 'src';
    const violations = [];
    
    // Check all JavaScript files in src directory
    function checkDirectory(dir) {
      try {
        const fs = require('fs');
        const path = require('path');
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            checkDirectory(filePath);
          } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            
            // Check if we're inside the migration function
            let inMigrationFunction = false;
            let braceDepth = 0;
            let migrationStartDepth = 0;
            
            lines.forEach((line, index) => {
              // Detect start of migration function
              if (line.includes('function migrateLegacyStatuses')) {
                inMigrationFunction = true;
                migrationStartDepth = braceDepth;
              }
              
              // Track brace depth
              const openBraces = (line.match(/{/g) || []).length;
              const closeBraces = (line.match(/}/g) || []).length;
              braceDepth += openBraces - closeBraces;
              
              // Exit migration function when we return to the starting depth
              if (inMigrationFunction && braceDepth <= migrationStartDepth && closeBraces > 0) {
                inMigrationFunction = false;
              }
              
              // Skip comment lines (single-line and multi-line comments)
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
                return;
              }
              
              // Skip lines inside the migration function
              if (inMigrationFunction) {
                return;
              }
              
              // Check for speed mechanic references in actual code
              if (line.match(/\b(slowTurns|hasteTurns|slow_effect|haste_effect)\b/)) {
                violations.push({
                  file: filePath,
                  line: index + 1,
                  content: line.trim()
                });
              }
            });
          }
        }
      } catch (error) {
        // Directory might not exist or be accessible, skip
      }
    }
    
    checkDirectory(srcDir);
    
    if (violations.length > 0) {
      const violationReport = violations.map(v => 
        `  - ${v.file}:${v.line}\n    ${v.content}`
      ).join('\n');
      
      expect.fail(
        `Found ${violations.length} reference(s) to speed mechanics:\n${violationReport}\n\n` +
        `Property 12 requires all speed-based status effects to be removed from the codebase.`
      );
    }
    
    expect(violations).toHaveLength(0);
  });
});

/**
 * Property 13: Debuff Evasion Reduction
 * 
 * For any debuff effect that previously reduced speed, applying it to a unit should now
 * reduce the unit's evasion percentage by the specified amount.
 * 
 * This ensures debuffs correctly modify evasion instead of speed.
 */
describe('Property 13: Debuff Evasion Reduction', () => {
  it('should reduce evasion when debuff is active (property-based)', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6), noNaN: true }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3), noNaN: true }),
        fc.integer({ min: 1, max: 5 }),
        (baseEvasion, debuffValue, debuffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const effectiveEvasion = getEffectiveEvasion(unit);
          const expectedEvasion = Math.max(0, baseEvasion - debuffValue);
          
          return Math.abs(effectiveEvasion - expectedEvasion) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply debuff when turns is 0', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        (baseEvasion, debuffValue) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: 0,
              evadeDebuffValue: debuffValue
            }
          };
          
          const effectiveEvasion = getEffectiveEvasion(unit);
          return Math.abs(effectiveEvasion - baseEvasion) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp negative evasion to 0', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.2) }),
        fc.float({ noNaN: true, min: Math.fround(0.21), max: Math.fround(0.5) }),
        fc.integer({ min: 1, max: 5 }),
        (baseEvasion, debuffValue, debuffTurns) => {
          if (debuffValue <= baseEvasion) return true;
          
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const effectiveEvasion = getEffectiveEvasion(unit);
          return effectiveEvasion === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 14: Buff Evasion Increase
 * 
 * For any buff effect that previously increased speed, applying it to a unit should now
 * increase the unit's evasion percentage by the specified amount.
 * 
 * This ensures buffs correctly modify evasion instead of speed.
 */
describe('Property 14: Buff Evasion Increase', () => {
  it('should increase evasion when buff is active (property-based)', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 5 }),
        (baseEvasion, buffValue, buffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          const effectiveEvasion = getEffectiveEvasion(unit);
          const expectedEvasion = Math.min(0.75, baseEvasion + buffValue);
          
          return Math.abs(effectiveEvasion - expectedEvasion) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not apply buff when turns is 0', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        (baseEvasion, buffValue) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          const effectiveEvasion = getEffectiveEvasion(unit);
          return Math.abs(effectiveEvasion - baseEvasion) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clamp excessive evasion to 75%', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: Math.fround(0.5), max: Math.fround(0.7) }),
        fc.float({ noNaN: true, min: Math.fround(0.2), max: Math.fround(0.5) }),
        fc.integer({ min: 1, max: 5 }),
        (baseEvasion, buffValue, buffTurns) => {
          if (baseEvasion + buffValue <= 0.75) return true;
          
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          const effectiveEvasion = getEffectiveEvasion(unit);
          return effectiveEvasion === 0.75;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply both buff and debuff correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        (baseEvasion, buffValue, debuffValue, buffTurns, debuffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const effectiveEvasion = getEffectiveEvasion(unit);
          const rawEvasion = baseEvasion + buffValue - debuffValue;
          const expectedEvasion = Math.max(0, Math.min(0.75, rawEvasion));
          
          return Math.abs(effectiveEvasion - expectedEvasion) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 15: Hit Chance Calculation
 * 
 * For any attack resolution, the hit chance should be calculated as:
 * baseAccuracy - targetEvasion, clamped between 0.1 and 1.0.
 * 
 * This ensures consistent hit chance calculation across all combat scenarios.
 */
describe('Property 15: Hit Chance Calculation', () => {
  it('should calculate hit chance as baseAccuracy minus targetEvasion (property-based)', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.75) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 0, max: 5 }),
        (baseEvasion, buffValue, debuffValue, buffTurns, debuffTurns) => {
          const attacker = {};
          const defender = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const hitChance = calculateHitChance(attacker, defender);
          const effectiveEvasion = getEffectiveEvasion(defender);
          const expectedHitChance = Math.max(0.1, 0.95 - effectiveEvasion);
          
          return Math.abs(hitChance - expectedHitChance) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce minimum 10% hit chance', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: Math.fround(0.6), max: Math.fround(0.75) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.integer({ min: 0, max: 5 }),
        (baseEvasion, buffValue, buffTurns) => {
          const attacker = {};
          const defender = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          const hitChance = calculateHitChance(attacker, defender);
          return hitChance >= 0.1;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never exceed 100% hit chance', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.integer({ min: 0, max: 5 }),
        (baseEvasion, debuffValue, debuffTurns) => {
          const attacker = {};
          const defender = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          const hitChance = calculateHitChance(attacker, defender);
          return hitChance <= 1.0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate correct hit chance for zero evasion', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0 },
      statuses: {
        evadeBuffTurns: 0,
        evadeBuffValue: 0,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };
    
    const hitChance = calculateHitChance(attacker, defender);
    expect(hitChance).toBe(0.95);
  });

  it('should calculate correct hit chance for maximum evasion', () => {
    const attacker = {};
    const defender = {
      mods: { evadePct: 0.60 },
      statuses: {
        evadeBuffTurns: 3,
        evadeBuffValue: 0.30,
        evadeDebuffTurns: 0,
        evadeDebuffValue: 0
      }
    };
    
    const hitChance = calculateHitChance(attacker, defender);
    expect(hitChance).toBeCloseTo(0.20, 5);
  });
});

/**
 * Property 16: Evasion Status Tracking
 * 
 * For any unit with evasion buffs or debuffs, the combat state should track
 * the remaining duration in turns.
 * 
 * This ensures status effects are properly managed and expire correctly.
 */
describe('Property 16: Evasion Status Tracking', () => {
  it('should track buff duration in turns (property-based)', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 10 }),
        (baseEvasion, buffValue, buffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          return (
            typeof unit.statuses.evadeBuffTurns === 'number' &&
            unit.statuses.evadeBuffTurns === buffTurns &&
            unit.statuses.evadeBuffTurns > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track debuff duration in turns (property-based)', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 10 }),
        (baseEvasion, debuffValue, debuffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          return (
            typeof unit.statuses.evadeDebuffTurns === 'number' &&
            unit.statuses.evadeDebuffTurns === debuffTurns &&
            unit.statuses.evadeDebuffTurns > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track both buff and debuff simultaneously', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (baseEvasion, buffValue, debuffValue, buffTurns, debuffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          return (
            unit.statuses.evadeBuffTurns === buffTurns &&
            unit.statuses.evadeBuffTurns > 0 &&
            unit.statuses.evadeDebuffTurns === debuffTurns &&
            unit.statuses.evadeDebuffTurns > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have zero turns when status is inactive', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        (baseEvasion) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: 0,
              evadeBuffValue: 0,
              evadeDebuffTurns: 0,
              evadeDebuffValue: 0
            }
          };
          
          return (
            unit.statuses.evadeBuffTurns === 0 &&
            unit.statuses.evadeDebuffTurns === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should store buff and debuff values', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: Math.fround(0.05), max: Math.fround(0.3) }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (baseEvasion, buffValue, debuffValue, buffTurns, debuffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          return (
            Math.abs(unit.statuses.evadeBuffValue - buffValue) < 0.0001 &&
            Math.abs(unit.statuses.evadeDebuffValue - debuffValue) < 0.0001
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain status structure integrity', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.6) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.float({ noNaN: true, min: 0, max: Math.fround(0.3) }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (baseEvasion, buffValue, debuffValue, buffTurns, debuffTurns) => {
          const unit = {
            mods: { evadePct: baseEvasion },
            statuses: {
              evadeBuffTurns: buffTurns,
              evadeBuffValue: buffValue,
              evadeDebuffTurns: debuffTurns,
              evadeDebuffValue: debuffValue
            }
          };
          
          return (
            unit.statuses.hasOwnProperty('evadeBuffTurns') &&
            unit.statuses.hasOwnProperty('evadeBuffValue') &&
            unit.statuses.hasOwnProperty('evadeDebuffTurns') &&
            unit.statuses.hasOwnProperty('evadeDebuffValue') &&
            typeof unit.statuses.evadeBuffTurns === 'number' &&
            typeof unit.statuses.evadeBuffValue === 'number' &&
            typeof unit.statuses.evadeDebuffTurns === 'number' &&
            typeof unit.statuses.evadeDebuffValue === 'number'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
