import { UNIT_BY_ID } from "../data/unitCatalog.js";

const SAVE_KEY = "forest_throne_progress_v1";
const CURRENT_VERSION = 2; // Incremented for 120-unit expansion

// Unit replacement mapping for removed/changed units (Requirement 27.2)
const UNIT_REPLACEMENT_MAP = {
  // Map old unit IDs to equivalent new unit IDs
  // This will be populated as units are removed/changed
  // Example: "old_wolf_id": "wolf_alpha"
};

/**
 * Migrates legacy speed-based statuses to evasion-based statuses
 * Converts slowTurns to evadeDebuffTurns with 15% penalty
 * Converts hasteTurns to evadeBuffTurns with 10% bonus
 * **Validates: Requirement 7.1**
 */
function migrateLegacyStatuses(unit) {
  if (!unit || !unit.statuses) return;
  
  let migrated = false;
  
  // Convert slowTurns to evadeDebuffTurns
  if (unit.statuses.slowTurns !== undefined) {
    if (unit.statuses.slowTurns > 0) {
      unit.statuses.evadeDebuffTurns = unit.statuses.slowTurns;
      unit.statuses.evadeDebuffValue = 0.15; // 15% evasion penalty
      migrated = true;
    }
    delete unit.statuses.slowTurns;
  }
  
  // Convert hasteTurns to evadeBuffTurns
  if (unit.statuses.hasteTurns !== undefined) {
    if (unit.statuses.hasteTurns > 0) {
      unit.statuses.evadeBuffTurns = unit.statuses.hasteTurns;
      unit.statuses.evadeBuffValue = 0.10; // 10% evasion bonus
      migrated = true;
    }
    delete unit.statuses.hasteTurns;
  }
  
  return migrated;
}

/**
 * Validates and migrates save data to current version
 * **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**
 */
function migrateSaveData(data) {
  const migrationLog = [];
  
  try {
    // Handle corrupted or invalid data (Requirement 27.5)
    if (!data || typeof data !== "object") {
      migrationLog.push("ERROR: Save data is corrupted or invalid");
      return { data: null, migrationLog };
    }

    const version = data.version ?? 1;
    let payload = data.payload;

    // Validate payload structure (Requirement 27.5)
    if (!payload || typeof payload !== "object") {
      migrationLog.push("ERROR: Save payload is corrupted");
      return { data: null, migrationLog };
    }

    if (!payload.player || typeof payload.player !== "object") {
      migrationLog.push("ERROR: Player data is corrupted");
      return { data: null, migrationLog };
    }

    // Migration from version 1 to version 2 (120-unit expansion)
    if (version < 2) {
      migrationLog.push("Migrating save data from version 1 to version 2");
      
      // Migrate level cap: old max was 9, new max is 25 (Requirement 27.3)
      const oldLevel = payload.player.level ?? 1;
      if (oldLevel > 9) {
        migrationLog.push(`WARNING: Level ${oldLevel} exceeds old cap of 9, clamping to 25`);
      }
      payload.player.level = Math.max(1, Math.min(25, oldLevel));
      
      // Migrate units on board (Requirement 27.2)
      if (Array.isArray(payload.player.board)) {
        for (let r = 0; r < payload.player.board.length; r++) {
          const row = payload.player.board[r];
          if (!Array.isArray(row)) continue;
          
          for (let c = 0; c < row.length; c++) {
            const unit = row[c];
            if (!unit || !unit.baseId) continue;
            
            // Migrate legacy speed statuses to evasion (Requirement 7.1)
            if (migrateLegacyStatuses(unit)) {
              migrationLog.push(`Migrated legacy speed statuses for unit ${unit.baseId} at board[${r}][${c}]`);
            }
            
            // Check if unit exists in new catalog
            if (!UNIT_BY_ID[unit.baseId]) {
              // Try to find replacement
              const replacement = UNIT_REPLACEMENT_MAP[unit.baseId];
              if (replacement && UNIT_BY_ID[replacement]) {
                migrationLog.push(`Replaced removed unit ${unit.baseId} with ${replacement} at board[${r}][${c}]`);
                unit.baseId = replacement;
              } else {
                // No replacement found, remove unit
                migrationLog.push(`Removed invalid unit ${unit.baseId} from board[${r}][${c}]`);
                payload.player.board[r][c] = null;
              }
            }
          }
        }
      }
      
      // Migrate units on bench (Requirement 27.2)
      if (Array.isArray(payload.player.bench)) {
        payload.player.bench = payload.player.bench.filter((unit, idx) => {
          if (!unit || !unit.baseId) return false;
          
          // Migrate legacy speed statuses to evasion (Requirement 7.1)
          if (migrateLegacyStatuses(unit)) {
            migrationLog.push(`Migrated legacy speed statuses for unit ${unit.baseId} on bench[${idx}]`);
          }
          
          if (!UNIT_BY_ID[unit.baseId]) {
            const replacement = UNIT_REPLACEMENT_MAP[unit.baseId];
            if (replacement && UNIT_BY_ID[replacement]) {
              migrationLog.push(`Replaced removed unit ${unit.baseId} with ${replacement} on bench[${idx}]`);
              unit.baseId = replacement;
              return true;
            } else {
              migrationLog.push(`Removed invalid unit ${unit.baseId} from bench[${idx}]`);
              return false;
            }
          }
          return true;
        });
      }
      
      // Migrate shop units (Requirement 27.2)
      if (Array.isArray(payload.player.shop)) {
        payload.player.shop = payload.player.shop.map((offer, idx) => {
          if (!offer || !offer.baseId) return null;
          
          if (!UNIT_BY_ID[offer.baseId]) {
            const replacement = UNIT_REPLACEMENT_MAP[offer.baseId];
            if (replacement && UNIT_BY_ID[replacement]) {
              migrationLog.push(`Replaced removed unit ${offer.baseId} with ${replacement} in shop[${idx}]`);
              return { ...offer, baseId: replacement };
            } else {
              migrationLog.push(`Removed invalid unit ${offer.baseId} from shop[${idx}]`);
              return null;
            }
          }
          return offer;
        });
      }
      
      // Update version
      data.version = CURRENT_VERSION;
      migrationLog.push("Migration to version 2 complete");
    }

    // Final validation: clamp all values to valid ranges (Requirement 27.3)
    payload.player.level = Math.max(1, Math.min(25, payload.player.level ?? 1));
    payload.player.round = Math.max(1, payload.player.round ?? 1);
    payload.player.hp = Math.max(0, payload.player.hp ?? 3);
    payload.player.gold = Math.max(0, payload.player.gold ?? 0);
    
    // Validate deploy cap is within valid range
    const deployCapBonus = payload.player.deployCapBonus ?? 0;
    if (deployCapBonus < 0 || deployCapBonus > 100) {
      migrationLog.push(`WARNING: Invalid deployCapBonus ${deployCapBonus}, resetting to 0`);
      payload.player.deployCapBonus = 0;
    }

    return { data, migrationLog };
  } catch (error) {
    // Handle any unexpected errors during migration (Requirement 27.5)
    migrationLog.push(`ERROR: Migration failed - ${error.message}`);
    return { data: null, migrationLog };
  }
}

export function saveProgress(payload) {
  try {
    const wrapped = {
      version: CURRENT_VERSION,
      savedAt: Date.now(),
      payload
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(wrapped));
    return true;
  } catch (_err) {
    return false;
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    
    // Apply migration and validation (Requirement 27.1, 27.4)
    const { data, migrationLog } = migrateSaveData(parsed);
    
    // Log migration actions for debugging (Requirement 27.4)
    if (migrationLog.length > 0) {
      console.log("[Save Data Migration]");
      migrationLog.forEach(msg => console.log(`  ${msg}`));
    }
    
    // Return null if migration failed (Requirement 27.5)
    if (!data) {
      console.error("[Save Data Migration] Failed to migrate save data, starting new game");
      return null;
    }
    
    return data.payload ?? null;
  } catch (_err) {
    // Handle corrupted save data gracefully (Requirement 27.5)
    console.error("[Save Data Migration] Error loading save data:", _err);
    return null;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (_err) {
    return false;
  }
}

export function clearAllLocalStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (_err) {
    return false;
  }
}
