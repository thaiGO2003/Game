
const fs = require('fs');

/**
 * Parses CSV file with robust error handling
 * @param {string} csvPath - Path to CSV file
 * @returns {Array} - Array of parsed objects
 * @throws {Error} - If parsing fails with line number and field information
 */
function parseCsv(csvPath) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split(/\r?\n/);
    
    if (lines.length === 0) {
        throw new Error(`CSV file ${csvPath} is empty`);
    }
    
    // Parse headers with trimming (Requirement 24.3)
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Define numeric fields that should be converted to numbers (Requirement 24.4)
    const numericFields = ['tier', 'hp', 'atk', 'def', 'matk', 'mdef', 'range', 'rageMax', 
                          'base', 'scale', 'duration', 'value', 'radius', 'shieldBase', 'tauntTurns',
                          'stunChance', 'stunTurns', 'reflectPct', 'reflectTurns', 'armorBuff', 'mdefBuff',
                          'turns', 'lifesteal', 'echoBase', 'echoScale', 'maxHits',
                          'sleepChance', 'sleepTurns', 'armorBreak', 'freezeChance', 'freezeTurns',
                          'slowTurns', 'splashCount', 'poisonTurns', 'poisonPerTurn', 'shieldScale',
                          'rageGain', 'maxTargets', 'selfAtkBuff', 'assistRate', 'evadeBuff', 'atkBuff',
                          'armorPen', 'killRage', 'diseaseTurns', 'diseaseDamage'];
    
    // Define string fields that should NOT be converted to numbers even if they look numeric
    const stringFields = ['scaleStat', 'shieldScaleStat'];
    
    // Define JSON fields that should be parsed as JSON objects
    const jsonFields = ['hit1', 'hit2', 'buffStats'];
    
    // Define required fields for units.csv (Requirement 24.1)
    const requiredUnitFields = ['id', 'name', 'species', 'icon', 'tribe', 'tribeVi', 'classType', 
                                'classVi', 'tier', 'hp', 'atk', 'def', 'matk', 'mdef', 'range', 
                                'rageMax', 'skillId'];
    
    // Define required fields for skills.csv (Requirement 24.1)
    const requiredSkillFields = ['id', 'name', 'descriptionVi', 'actionPattern', 'effect'];
    
    // Determine which required fields to use based on file path
    const isUnitsFile = csvPath.includes('units.csv');
    const isSkillsFile = csvPath.includes('skills.csv');
    const requiredFields = isUnitsFile ? requiredUnitFields : 
                          isSkillsFile ? requiredSkillFields : [];
    
    return lines.slice(1).map((line, index) => {
        const lineNumber = index + 2; // +2 because: +1 for 0-index, +1 for header row
        
        try {
            const values = [];
            let current = "";
            let inQuote = false;
            
            // Parse CSV with quoted field support (Requirement 24.2)
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
            
            // Pad values array if shorter than headers (handle missing trailing commas)
            while (values.length < headers.length) {
                values.push('');
            }
            
            // Build object with proper field handling
            const obj = {};
            headers.forEach((header, i) => {
                let value = values[i];
                
                // Handle missing values (Requirement 24.1)
                // Allow undefined for optional fields (will be handled below)
                if (value === undefined || value === null) {
                    value = ''; // Treat undefined as empty string
                }
                
                // Remove surrounding quotes if present (Requirement 24.2)
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                
                // Trim whitespace from all string fields (Requirement 24.3)
                value = value.trim();
                
                // Handle empty fields (Requirement 24.1)
                if (value === '') {
                    // Check if this is a required field
                    if (requiredFields.includes(header)) {
                        throw new Error(`Empty value for required field "${header}" at line ${lineNumber} in ${csvPath}`);
                    }
                    // For optional numeric fields, set to undefined instead of empty string
                    if (numericFields.includes(header)) {
                        obj[header] = undefined;
                        return;
                    }
                    // For optional string fields, keep as empty string
                    obj[header] = '';
                    return;
                }
                
                // Convert numeric fields to numbers (Requirement 24.4)
                if (stringFields.includes(header)) {
                    // Keep as string even if it looks numeric
                    obj[header] = value;
                } else if (numericFields.includes(header)) {
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                        throw new Error(`Invalid numeric value "${value}" for field "${header}" at line ${lineNumber} in ${csvPath}`);
                    }
                    obj[header] = numValue;
                } else if (jsonFields.includes(header)) {
                    // Parse JSON fields
                    try {
                        // Replace single quotes with double quotes and add quotes to unquoted keys
                        let jsonStr = value.replace(/'/g, '"');
                        // Add quotes to unquoted keys: {base:26} -> {"base":26}
                        jsonStr = jsonStr.replace(/(\w+):/g, '"$1":');
                        obj[header] = JSON.parse(jsonStr);
                    } catch (e) {
                        throw new Error(`Invalid JSON value "${value}" for field "${header}" at line ${lineNumber} in ${csvPath}: ${e.message}`);
                    }
                } else {
                    obj[header] = value;
                }
            });
            
            return obj;
        } catch (error) {
            // Report line number and field on parse errors (Requirement 24.5)
            if (error.message.includes('line')) {
                throw error; // Already has line number
            }
            throw new Error(`Parse error at line ${lineNumber} in ${csvPath}: ${error.message}`);
        }
    });
}

// Parse CSV files with error handling
let units, skills;

try {
    console.log('Parsing units.csv...');
    units = parseCsv('p:/DigiGO/games/game/data/units.csv');
    console.log(`✓ Parsed ${units.length} units`);
} catch (error) {
    console.error('✗ FAILED to parse units.csv:');
    console.error(`  ${error.message}`);
    process.exit(1);
}

try {
    console.log('Parsing skills.csv...');
    skills = parseCsv('p:/DigiGO/games/game/data/skills.csv');
    console.log(`✓ Parsed ${skills.length} skills`);
} catch (error) {
    console.error('✗ FAILED to parse skills.csv:');
    console.error(`  ${error.message}`);
    process.exit(1);
}

console.log('');

/**
 * Validates emoji uniqueness across all units
 * @param {Array} units - Array of unit objects from units.csv
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

/**
 * Validates the unit catalog according to Algorithm 3 from the design document
 * @param {Array} units - Array of unit objects from units.csv
 * @param {Array} skills - Array of skill objects from skills.csv
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateUnitCatalog(units, skills) {
    const errors = [];
    const expectedCount = 120;
    const expectedRoles = ['TANKER', 'FIGHTER', 'ASSASSIN', 'ARCHER', 'MAGE', 'SUPPORT'];
    const expectedTiers = [1, 2, 3, 4, 5];
    const unitsPerRole = 20;
    const unitsPerRoleTier = 4;

    // Check 1: Total count must be 120
    if (units.length !== expectedCount) {
        errors.push(`Expected ${expectedCount} units, found ${units.length}`);
    }

    // Check 2: Count by role and tier
    const roleCounts = {};
    const tierCounts = {};
    const roleTierMatrix = {};

    units.forEach(unit => {
        // Count by role
        if (!roleCounts[unit.classType]) {
            roleCounts[unit.classType] = 0;
        }
        roleCounts[unit.classType]++;

        // Count by tier
        const tier = parseInt(unit.tier);
        if (!tierCounts[tier]) {
            tierCounts[tier] = 0;
        }
        tierCounts[tier]++;

        // Count by role-tier combination
        const key = `${unit.classType}_${tier}`;
        if (!roleTierMatrix[key]) {
            roleTierMatrix[key] = 0;
        }
        roleTierMatrix[key]++;
    });

    // Check 3: Each role must have exactly 20 units
    expectedRoles.forEach(role => {
        const count = roleCounts[role] || 0;
        if (count !== unitsPerRole) {
            errors.push(`${role} has ${count} units, expected ${unitsPerRole}`);
        }
    });

    // Check 4: Each role-tier combination must have exactly 4 units
    expectedRoles.forEach(role => {
        expectedTiers.forEach(tier => {
            const key = `${role}_${tier}`;
            const count = roleTierMatrix[key] || 0;
            if (count !== unitsPerRoleTier) {
                errors.push(`${role} tier ${tier} has ${count} units, expected ${unitsPerRoleTier}`);
            }
        });
    });

    // Check 5: Unique IDs
    const idSet = new Set();
    units.forEach(unit => {
        if (idSet.has(unit.id)) {
            errors.push(`Duplicate ID: ${unit.id}`);
        }
        idSet.add(unit.id);
    });

    // Check 6: Unique name + icon combinations
    const nameIconSet = new Set();
    units.forEach(unit => {
        const combo = `${unit.name}|${unit.icon}`;
        if (nameIconSet.has(combo)) {
            errors.push(`Duplicate name+icon: ${unit.name} ${unit.icon}`);
        }
        nameIconSet.add(combo);
    });

    // Check 7: All skillId references exist in skills.csv
    const skillIds = new Set(skills.map(s => s.id));
    units.forEach(unit => {
        if (!unit.skillId) {
            errors.push(`Unit ${unit.id} (${unit.name}) has NO skillId`);
        } else if (!skillIds.has(unit.skillId)) {
            errors.push(`Unit ${unit.id} (${unit.name}) has skillId "${unit.skillId}" but it's NOT in skills.csv`);
        }
    });

    // Check 8: Unit data integrity (Requirements 17.1-17.8)
    units.forEach(unit => {
        const tier = parseInt(unit.tier);
        const hp = parseInt(unit.hp);
        const atk = parseInt(unit.atk);
        const def = parseInt(unit.def);
        const matk = parseInt(unit.matk);
        const mdef = parseInt(unit.mdef);
        const range = parseInt(unit.range);
        const rageMax = parseInt(unit.rageMax);

        // Tier must be in range [1, 5]
        if (isNaN(tier) || tier < 1 || tier > 5) {
            errors.push(`Unit ${unit.id} has invalid tier: ${unit.tier} (must be 1-5)`);
        }

        // HP must be greater than 0
        if (isNaN(hp) || hp <= 0) {
            errors.push(`Unit ${unit.id} has invalid hp: ${unit.hp} (must be > 0)`);
        }

        // ATK must be greater than 0
        if (isNaN(atk) || atk <= 0) {
            errors.push(`Unit ${unit.id} has invalid atk: ${unit.atk} (must be > 0)`);
        }

        // DEF must be >= 0
        if (isNaN(def) || def < 0) {
            errors.push(`Unit ${unit.id} has invalid def: ${unit.def} (must be >= 0)`);
        }

        // MATK must be >= 0
        if (isNaN(matk) || matk < 0) {
            errors.push(`Unit ${unit.id} has invalid matk: ${unit.matk} (must be >= 0)`);
        }

        // MDEF must be >= 0
        if (isNaN(mdef) || mdef < 0) {
            errors.push(`Unit ${unit.id} has invalid mdef: ${unit.mdef} (must be >= 0)`);
        }

        // Range must be in range [1, 4]
        if (isNaN(range) || range < 1 || range > 4) {
            errors.push(`Unit ${unit.id} has invalid range: ${unit.range} (must be 1-4)`);
        }

        // RageMax must be in range [2, 5]
        if (isNaN(rageMax) || rageMax < 2 || rageMax > 5) {
            errors.push(`Unit ${unit.id} has invalid rageMax: ${unit.rageMax} (must be 2-5)`);
        }

        // ClassType must be valid
        if (!expectedRoles.includes(unit.classType)) {
            errors.push(`Unit ${unit.id} has invalid classType: ${unit.classType} (must be one of: ${expectedRoles.join(', ')})`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

console.log(`=== Unit Catalog Validation ===`);
console.log(`Total Units: ${units.length}`);
console.log(`Total Skills: ${skills.length}`);
console.log('');

// Validate emoji uniqueness first (Requirements 1.1, 1.2, 1.3)
console.log('Checking emoji uniqueness...');
const emojiResult = validateEmojiUniqueness(units);

if (!emojiResult.valid) {
    console.log('✗ EMOJI DUPLICATION DETECTED:');
    console.log('');
    for (const [emoji, unitList] of emojiResult.duplicates) {
        const unitNames = unitList.map(u => `${u.name} (${u.id})`).join(', ');
        console.log(`  ${emoji} used by: ${unitNames}`);
    }
    console.log('');
    console.log(`Total duplicate emojis: ${emojiResult.duplicates.size}`);
    process.exit(1);
}

console.log('✓ All emojis are unique');
console.log('');

const result = validateUnitCatalog(units, skills);

if (result.isValid) {
    console.log('✓ SUCCESS: All validation checks passed!');
    console.log('  - Total count: 120 units');
    console.log('  - Each role has exactly 20 units');
    console.log('  - Each role-tier combination has exactly 4 units');
    console.log('  - All IDs are unique');
    console.log('  - All name+icon combinations are unique');
    console.log('  - All skillId references exist in skills.csv');
    console.log('  - All unit data integrity checks passed (tier, hp, atk, def, matk, mdef, range, rageMax, classType)');
    process.exit(0);
} else {
    console.log('✗ VALIDATION FAILED:');
    console.log('');
    result.errors.forEach(err => {
        console.log(`  - ${err}`);
    });
    console.log('');
    console.log(`Total errors: ${result.errors.length}`);
    process.exit(1);
}
