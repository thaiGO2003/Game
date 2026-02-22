/**
 * UpgradeSystem - Unit Upgrade Management System
 * 
 * Manages unit upgrade operations including detection, combination, and equipment transfer.
 * This system is independent of Phaser and uses pure functions where possible.
 * 
 * **Validates: Requirements 1.1, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 13.4**
 */

/**
 * Maximum star level for units
 */
const MAX_STAR_LEVEL = 3;

/**
 * Number of units required for upgrade
 */
const UNITS_REQUIRED_FOR_UPGRADE = 3;

/**
 * Maximum equipment slots per unit
 */
const MAX_EQUIPMENT_SLOTS = 3;

/**
 * Gets the equipment name key for deduplication
 * Equipment with the same name cannot be equipped on the same unit
 * 
 * @param {string} itemId - Item ID
 * @param {Object} itemCatalog - Item catalog (ITEM_BY_ID)
 * @returns {string|null} Equipment name key or null if not equipment
 */
export function getEquipmentNameKey(itemId, itemCatalog) {
  if (!itemCatalog) return null;
  const item = itemCatalog[itemId];
  if (!item || item.kind !== 'equipment') return null;
  const byName = String(item.name ?? '').trim().toLowerCase();
  if (byName) return byName;
  return String(item.id ?? itemId).trim().toLowerCase();
}

/**
 * Gets the merge species key for a unit (normalized species/name)
 * Used to group units for merging - units with same species and star can merge
 * 
 * @param {Object} unit - Unit object with base property
 * @returns {string} Normalized species key
 */
export function getMergeSpeciesKey(unit) {
  const raw = unit?.base?.species ?? unit?.base?.name ?? unit?.baseId ?? 'linh-thu';
  const normalized = String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || String(unit?.baseId ?? 'linh-thu');
}

/**
 * Gets the merge species label for display
 * 
 * @param {Object} unit - Unit object
 * @returns {string} Display label
 */
export function getMergeSpeciesLabel(unit) {
  const baseName = String(unit?.base?.name ?? unit?.baseId ?? 'Linh thú').trim();
  return baseName.replace(/\s+\d+\s*$/u, '');
}

/**
 * Checks if a unit can be upgraded (star level < 3)
 * 
 * @param {Object} unit - Unit to check
 * @returns {boolean} True if unit can be upgraded, false otherwise
 * 
 * **Validates: Requirement 5.5**
 */
export function canUpgradeUnit(unit) {
  if (!unit || typeof unit.star !== 'number') {
    return false;
  }
  return unit.star < MAX_STAR_LEVEL;
}

/**
 * Checks if there are enough units to perform an upgrade
 * 
 * @param {Array<Object>} units - Array of units to check
 * @param {string} baseId - Base ID to match
 * @param {number} star - Star level to match
 * @returns {boolean} True if upgrade is possible, false otherwise
 * 
 * **Validates: Requirements 5.1, 5.5**
 */
export function canUpgrade(units, baseId, star) {
  // Can't upgrade star 3 units
  if (star >= MAX_STAR_LEVEL) {
    return false;
  }

  // Count matching units
  const matchingUnits = units.filter(
    unit => unit && unit.baseId === baseId && unit.star === star
  );

  return matchingUnits.length >= UNITS_REQUIRED_FOR_UPGRADE;
}

/**
 * Upgrades a single unit to the next star level
 * Creates a new unit object with incremented star level
 * 
 * @param {Object} unit - Unit to upgrade
 * @returns {Object} Result object with success flag and upgraded unit or error
 * 
 * **Validates: Requirement 5.2**
 */
export function upgradeUnit(unit) {
  if (!unit) {
    return { success: false, error: 'No unit provided' };
  }

  if (!canUpgradeUnit(unit)) {
    return { success: false, error: 'Unit cannot be upgraded (max star level reached)' };
  }

  const upgradedUnit = {
    ...unit,
    star: unit.star + 1,
    uid: `upgraded_${Date.now()}_${Math.random()}`
  };

  return { success: true, unit: upgradedUnit };
}

/**
 * Finds all upgrade candidates from a collection of units
 * Returns groups of units that can be combined
 * 
 * @param {Array<Object>} board - 5x5 board matrix
 * @param {Array<Object>} bench - Bench array
 * @returns {Array<Object>} Array of upgrade candidate groups
 * 
 * **Validates: Requirements 5.1, 5.6, 5.7**
 */
export function findUpgradeCandidates(board, bench) {
  const candidates = [];
  const unitRefs = [];

  // Collect units from bench
  bench.forEach((unit, index) => {
    if (unit) {
      unitRefs.push({
        unit,
        location: 'BENCH',
        index
      });
    }
  });

  // Collect units from board
  if (board) {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const unit = board[row][col];
        if (unit) {
          unitRefs.push({
            unit,
            location: 'BOARD',
            row,
            col
          });
        }
      }
    }
  }

  // Group units by merge key (species + star level)
  const mergeGroups = {};
  unitRefs.forEach(ref => {
    const key = `${getMergeSpeciesKey(ref.unit)}:${ref.unit.star}`;
    if (!mergeGroups[key]) {
      mergeGroups[key] = [];
    }
    mergeGroups[key].push(ref);
  });

  // Find groups with 3+ units that can upgrade
  Object.entries(mergeGroups).forEach(([key, refs]) => {
    const [speciesKey, starStr] = key.split(':');
    const star = parseInt(starStr);

    // Can't upgrade star 3 units
    if (star >= MAX_STAR_LEVEL) {
      return;
    }

    // Need at least 3 units
    if (refs.length >= UNITS_REQUIRED_FOR_UPGRADE) {
      // Use baseId from the first unit
      const baseId = refs[0].unit.baseId;
      
      candidates.push({
        baseId,
        star,
        count: refs.length,
        refs: refs.slice(0, UNITS_REQUIRED_FOR_UPGRADE) // Take first 3
      });
    }
  });

  return candidates;
}

/**
 * Combines 3 units into 1 upgraded unit
 * 
 * @param {Array<Object>} units - Array of exactly 3 units to combine
 * @returns {Object} Result object with success flag and combined unit or error
 * 
 * **Validates: Requirements 5.2, 5.4**
 */
export function combineUnits(units) {
  if (!Array.isArray(units) || units.length !== UNITS_REQUIRED_FOR_UPGRADE) {
    return { 
      success: false, 
      error: `Exactly ${UNITS_REQUIRED_FOR_UPGRADE} units required for combination` 
    };
  }

  // Validate all units have same baseId and star
  const baseId = units[0].baseId;
  const star = units[0].star;

  const allMatch = units.every(
    unit => unit && unit.baseId === baseId && unit.star === star
  );

  if (!allMatch) {
    return { 
      success: false, 
      error: 'All units must have same baseId and star level' 
    };
  }

  // Can't upgrade star 3 units
  if (star >= MAX_STAR_LEVEL) {
    return { 
      success: false, 
      error: 'Cannot upgrade beyond star level 3' 
    };
  }

  // Collect equipment from all units
  const allEquipment = [];
  units.forEach(unit => {
    if (unit.equips && Array.isArray(unit.equips)) {
      allEquipment.push(...unit.equips);
    }
  });

  // Create combined unit
  const combinedUnit = {
    ...units[0],
    star: star + 1,
    uid: `merged_${Date.now()}_${Math.random()}`,
    equips: allEquipment.slice(0, MAX_EQUIPMENT_SLOTS) // Limit to max slots
  };

  return { 
    success: true, 
    unit: combinedUnit,
    equipmentTransferred: allEquipment.length
  };
}

/**
 * Collects and deduplicates equipment from source units for merging
 * Ensures no duplicate equipment names on the merged unit
 * 
 * @param {Array<Object>} refs - Array of unit references with equipment
 * @param {Object} itemCatalog - Item catalog (ITEM_BY_ID)
 * @returns {Object} Object with kept equipment (max 3) and overflow equipment
 * 
 * **Validates: Requirement 5.3**
 */
export function collectMergeEquips(refs, itemCatalog) {
  if (!Array.isArray(refs) || !itemCatalog) {
    return { kept: [], overflow: [] };
  }

  // Collect all equipment from source units
  const all = [];
  refs.forEach((ref) => {
    const equips = Array.isArray(ref?.unit?.equips) ? ref.unit.equips : [];
    equips.forEach((itemId) => {
      if (itemCatalog[itemId]?.kind === 'equipment') {
        all.push(itemId);
      }
    });
  });

  // Deduplicate by equipment name
  const seen = new Set();
  const kept = [];
  const overflow = [];

  all.forEach((itemId) => {
    const key = getEquipmentNameKey(itemId, itemCatalog);
    if (!key) return;

    // If we've seen this equipment name, it goes to overflow
    if (seen.has(key)) {
      overflow.push(itemId);
      return;
    }

    seen.add(key);

    // Keep up to 3 unique equipment
    if (kept.length < MAX_EQUIPMENT_SLOTS) {
      kept.push(itemId);
    } else {
      overflow.push(itemId);
    }
  });

  return { kept, overflow };
}

/**
 * Collects all owned unit references from board and bench
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix
 * @param {Array<Object>} bench - Bench array
 * @returns {Array<Object>} Array of unit references with location info
 */
export function collectOwnedUnitRefs(board, bench) {
  const refs = [];

  // Collect from bench
  if (Array.isArray(bench)) {
    bench.forEach((unit, index) => {
      if (unit) {
        refs.push({
          unit,
          location: 'BENCH',
          index
        });
      }
    });
  }

  // Collect from board
  if (Array.isArray(board)) {
    for (let row = 0; row < board.length; row++) {
      if (Array.isArray(board[row])) {
        for (let col = 0; col < board[row].length; col++) {
          const unit = board[row][col];
          if (unit) {
            refs.push({
              unit,
              location: 'BOARD',
              row,
              col
            });
          }
        }
      }
    }
  }

  return refs;
}

/**
 * Removes unit references from board and bench
 * Modifies board and bench arrays in place
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {Array<Object>} bench - Bench array (will be modified)
 * @param {Array<Object>} refs - Array of unit references to remove
 * @returns {Object} Result with success flag and count of removed units
 */
export function removeUnitRefs(board, bench, refs) {
  if (!Array.isArray(refs) || refs.length === 0) {
    return { success: false, error: 'No references provided' };
  }

  let removedCount = 0;

  refs.forEach(ref => {
    if (!ref) return;

    if (ref.location === 'BOARD') {
      if (board && board[ref.row] && board[ref.row][ref.col]) {
        board[ref.row][ref.col] = null;
        removedCount++;
      }
    } else if (ref.location === 'BENCH') {
      if (bench && bench[ref.index]) {
        bench[ref.index] = null;
        removedCount++;
      }
    }
  });

  // Clean up null entries from bench
  if (bench) {
    const filtered = bench.filter(unit => unit !== null);
    bench.splice(0, bench.length, ...filtered);
  }

  return { success: true, removedCount };
}

/**
 * Places a merged unit at the preferred location
 * Prefers board position if one of the source units was on board
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {Array<Object>} bench - Bench array (will be modified)
 * @param {Object} unit - Unit to place
 * @param {Array<Object>} sourceRefs - References to source units (for position preference)
 * @returns {Object} Result with success flag and placement location
 */
export function placeMergedUnit(board, bench, unit, sourceRefs) {
  if (!unit) {
    return { success: false, error: 'No unit provided' };
  }

  // Prefer board position if available
  const boardRef = sourceRefs.find(ref => ref.location === 'BOARD');
  
  if (boardRef && board && board[boardRef.row]) {
    board[boardRef.row][boardRef.col] = unit;
    return { 
      success: true, 
      location: 'BOARD', 
      row: boardRef.row, 
      col: boardRef.col 
    };
  }

  // Otherwise place on bench
  if (bench) {
    // Find first null slot or push to end
    const emptyIndex = bench.findIndex(u => u === null);
    if (emptyIndex !== -1) {
      bench[emptyIndex] = unit;
      return { success: true, location: 'BENCH', index: emptyIndex };
    } else {
      bench.push(unit);
      return { success: true, location: 'BENCH', index: bench.length - 1 };
    }
  }

  return { success: false, error: 'No valid placement location' };
}

/**
 * Performs automatic upgrade/merge for all eligible units
 * Processes all possible upgrades in one pass
 * Uses species-based grouping to match units for merging
 * 
 * @param {Array<Array<Object|null>>} board - 5x5 board matrix (will be modified)
 * @param {Array<Object>} bench - Bench array (will be modified)
 * @param {Object} itemCatalog - Item catalog for equipment handling (ITEM_BY_ID)
 * @param {Object} unitCatalog - Unit catalog for tier sorting (UNIT_BY_ID)
 * @param {Function} createUnitFn - Function to create a new owned unit (baseId, star, equips) => unit
 * @returns {Object} Result with merge count and log of operations
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**
 */
export function tryAutoMerge(board, bench, itemCatalog, unitCatalog, createUnitFn) {
  const mergeLog = [];
  let totalMerges = 0;
  let merged = true;

  // Keep merging until no more merges are possible
  while (merged) {
    merged = false;

    // Collect all unit references
    const refs = collectOwnedUnitRefs(board, bench);

    // Group by species and star level
    const groups = new Map();
    refs.forEach((ref) => {
      const key = `${getMergeSpeciesKey(ref.unit)}:${ref.unit.star}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(ref);
    });

    // Process each group
    for (const [, group] of groups) {
      // Need at least 3 units to merge
      if (group.length < 3) continue;

      // Take first 3 units
      const picked = group.slice(0, 3);
      const star = picked[0].unit.star;

      // Can't merge star 3 units
      if (star >= MAX_STAR_LEVEL) continue;

      // Pick the highest tier baseId from the group
      const baseId = picked
        .map((ref) => ref.unit.baseId)
        .sort((a, b) => (unitCatalog[b]?.tier ?? 0) - (unitCatalog[a]?.tier ?? 0))[0];

      // Collect and deduplicate equipment
      const mergedEquip = collectMergeEquips(picked, itemCatalog);

      // Remove source units
      removeUnitRefs(board, bench, picked);

      // Create upgraded unit
      const upgraded = createUnitFn(baseId, Math.min(MAX_STAR_LEVEL, star + 1), mergedEquip.kept);
      if (!upgraded) continue;

      // Place merged unit
      placeMergedUnit(board, bench, upgraded, picked);

      // Log merge
      mergeLog.push({
        baseId,
        fromStar: star,
        toStar: star + 1,
        equipCount: mergedEquip.kept.length,
        equipOverflow: mergedEquip.overflow.length,
        overflowItems: mergedEquip.overflow
      });

      totalMerges++;
      merged = true;
      break; // Process one merge at a time, then re-scan
    }
  }

  return { 
    mergeCount: totalMerges, 
    log: mergeLog 
  };
}

/**
 * UpgradeSystem - Main export object with all upgrade operations
 */
export const UpgradeSystem = {
  // Upgrade validation
  canUpgradeUnit,
  canUpgrade,
  
  // Unit upgrade
  upgradeUnit,
  
  // Upgrade detection
  findUpgradeCandidates,
  
  // Unit combination
  combineUnits,
  
  // Equipment management
  collectMergeEquips,
  getEquipmentNameKey,
  
  // Merge key generation
  getMergeSpeciesKey,
  getMergeSpeciesLabel,
  
  // Unit reference management
  collectOwnedUnitRefs,
  removeUnitRefs,
  placeMergedUnit,
  
  // Auto-merge
  tryAutoMerge
};

export default UpgradeSystem;
