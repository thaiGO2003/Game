/**
 * ShopSystem - Shop Management System
 * 
 * Manages shop operations including refresh, buy, sell, lock/unlock, and shop generation.
 * This system is independent of Phaser and uses pure functions where possible.
 * 
 * **Validates: Requirements 1.1, 1.6, 13.4**
 */

import { UNIT_CATALOG, UNIT_BY_ID } from "../data/unitCatalog.js";
import { rollTierForLevel, randomItem } from "../core/gameUtils.js";

/**
 * Default shop configuration
 */
const DEFAULT_SHOP_SLOTS = 5;
const DEFAULT_REFRESH_COST = 2;

/**
 * Refreshes the shop with new offers
 * Deducts refresh cost from player gold if not locked
 * 
 * @param {Object} player - Player state object
 * @param {number} cost - Cost to refresh shop (default 2)
 * @returns {Object} Result object with success flag, updated player, or error
 * 
 * **Validates: Requirements 3.1, 3.2, 3.9**
 */
export function refreshShop(player, cost = DEFAULT_REFRESH_COST) {
  if (!player) {
    return { success: false, error: 'No player provided' };
  }

  // Check if shop is locked
  if (player.shopLocked) {
    return { success: false, error: 'Shop is locked' };
  }

  // Check if player has enough gold
  if (player.gold < cost) {
    return { success: false, error: 'Not enough gold' };
  }

  // Generate new shop offers
  const offers = generateShopOffers(player.level);

  // Create updated player state
  const updatedPlayer = {
    ...player,
    gold: player.gold - cost,
    shop: offers
  };

  return { success: true, player: updatedPlayer };
}

/**
 * Buys a unit from the shop at the specified slot
 * Deducts unit cost from player gold and adds unit to bench
 * 
 * @param {Object} player - Player state object
 * @param {number} slot - Shop slot index (0-4)
 * @param {Function} createUnitFn - Function to create owned unit (baseId, star) => unit
 * @param {number} benchCap - Maximum bench capacity
 * @returns {Object} Result object with success flag, updated player, purchased unit, or error
 * 
 * **Validates: Requirements 3.3, 3.4, 3.5, 3.10**
 */
export function buyUnit(player, slot, createUnitFn, benchCap) {
  if (!player) {
    return { success: false, error: 'No player provided' };
  }

  if (!player.shop || slot < 0 || slot >= player.shop.length) {
    return { success: false, error: 'Invalid shop slot' };
  }

  const offer = player.shop[slot];
  if (!offer) {
    return { success: false, error: 'No unit in this slot' };
  }

  const base = UNIT_BY_ID[offer.baseId];
  if (!base) {
    return { success: false, error: 'Invalid unit data' };
  }

  const cost = base.tier;

  // Check if player has enough gold
  if (player.gold < cost) {
    return { success: false, error: 'Not enough gold' };
  }

  // Check if bench has space
  if (player.bench.length >= benchCap) {
    return { success: false, error: 'Bench is full' };
  }

  // Create owned unit
  const ownedUnit = createUnitFn(base.id, 1);
  if (!ownedUnit) {
    return { success: false, error: 'Failed to create unit' };
  }

  // Update shop offers (remove purchased unit)
  const updatedShop = [...player.shop];
  updatedShop[slot] = null;

  // Update bench
  const updatedBench = [...player.bench, ownedUnit];

  // Create updated player state
  const updatedPlayer = {
    ...player,
    gold: player.gold - cost,
    shop: updatedShop,
    bench: updatedBench
  };

  return { 
    success: true, 
    player: updatedPlayer,
    unit: ownedUnit,
    cost
  };
}

/**
 * Sells a unit and adds gold to player
 * 
 * @param {Object} player - Player state object
 * @param {Object} unit - Unit to sell
 * @returns {Object} Result object with success flag, updated player, sell value, or error
 * 
 * **Validates: Requirement 3.6**
 */
export function sellUnit(player, unit) {
  if (!player) {
    return { success: false, error: 'No player provided' };
  }

  if (!unit) {
    return { success: false, error: 'No unit provided' };
  }

  const base = UNIT_BY_ID[unit.baseId];
  if (!base) {
    return { success: false, error: 'Invalid unit data' };
  }

  // Calculate sell value using game formula
  // Star 1: tier × 1, Star 2: tier × 3, Star 3: tier × 5
  const starMultiplier = unit.star === 3 ? 5 : unit.star === 2 ? 3 : 1;
  const sellValue = base.tier * starMultiplier;

  // Create updated player state
  const updatedPlayer = {
    ...player,
    gold: player.gold + sellValue
  };

  return { 
    success: true, 
    player: updatedPlayer,
    sellValue
  };
}

/**
 * Locks the shop to preserve current offers
 * 
 * @param {Object} player - Player state object
 * @returns {Object} Result object with success flag and updated player
 * 
 * **Validates: Requirement 3.7**
 */
export function lockShop(player) {
  if (!player) {
    return { success: false, error: 'No player provided' };
  }

  const updatedPlayer = {
    ...player,
    shopLocked: true
  };

  return { success: true, player: updatedPlayer };
}

/**
 * Unlocks the shop to allow refreshing
 * 
 * @param {Object} player - Player state object
 * @returns {Object} Result object with success flag and updated player
 * 
 * **Validates: Requirement 3.7**
 */
export function unlockShop(player) {
  if (!player) {
    return { success: false, error: 'No player provided' };
  }

  const updatedPlayer = {
    ...player,
    shopLocked: false
  };

  return { success: true, player: updatedPlayer };
}

/**
 * Generates shop offers based on player level
 * Uses tier odds to determine which tier units to offer
 * 
 * @param {number} level - Player level (1-25)
 * @param {number} slots - Number of shop slots (default 5)
 * @returns {Array<Object>} Array of shop offers
 * 
 * **Validates: Requirements 3.2, 3.8**
 */
export function generateShopOffers(level, slots = DEFAULT_SHOP_SLOTS) {
  const offers = [];

  for (let i = 0; i < slots; i++) {
    // Roll tier based on player level
    const tier = rollTierForLevel(level);

    // Get units of this tier
    const pool = UNIT_CATALOG.filter((u) => u.tier === tier);
    
    // Fallback to units of tier or lower if no exact match
    const fallback = UNIT_CATALOG.filter((u) => u.tier <= tier);
    
    // Select random unit from pool
    const base = randomItem(pool.length ? pool : fallback.length ? fallback : UNIT_CATALOG);

    if (base) {
      offers.push({ 
        slot: i, 
        baseId: base.id 
      });
    } else {
      offers.push(null);
    }
  }

  return offers;
}

/**
 * Calculates the cost to refresh the shop
 * Currently a fixed cost, but can be extended for dynamic pricing
 * 
 * @returns {number} Cost to refresh shop
 */
export function calculateRefreshCost() {
  // Currently fixed cost, but can be extended for:
  // - Increasing cost per refresh in same round
  // - Discounts from augments/items
  // - Level-based pricing
  return DEFAULT_REFRESH_COST;
}

/**
 * Gets the tier odds for a specific player level
 * Returns probability distribution for tiers 1-5
 * 
 * @param {number} level - Player level (1-25)
 * @returns {Object} Tier odds object with probabilities for each tier
 * 
 * **Validates: Requirement 3.8**
 */
export function getTierOdds(level) {
  // Tier odds are defined in gameUtils.js as TIER_ODDS_BY_LEVEL
  // This is a lookup table from level 1-25
  // For levels beyond 25, use level 25 odds
  
  const tierOddsTable = {
    1: [1, 0, 0, 0, 0],
    2: [0.8, 0.2, 0, 0, 0],
    3: [0.65, 0.3, 0.05, 0, 0],
    4: [0.5, 0.35, 0.13, 0.02, 0],
    5: [0.35, 0.35, 0.22, 0.07, 0.01],
    6: [0.25, 0.3, 0.28, 0.14, 0.03],
    7: [0.18, 0.24, 0.3, 0.2, 0.08],
    8: [0.12, 0.18, 0.27, 0.26, 0.17],
    9: [0.08, 0.12, 0.2, 0.3, 0.3],
    10: [0.05, 0.10, 0.20, 0.35, 0.30],
    11: [0.01, 0.05, 0.15, 0.30, 0.49],
    12: [0, 0, 0.10, 0.30, 0.60],
    13: [0, 0, 0.08, 0.28, 0.64],
    14: [0, 0, 0.06, 0.26, 0.68],
    15: [0, 0, 0.05, 0.24, 0.71],
    16: [0, 0, 0.04, 0.22, 0.74],
    17: [0, 0, 0.03, 0.20, 0.77],
    18: [0, 0, 0.03, 0.18, 0.79],
    19: [0, 0, 0.02, 0.16, 0.82],
    20: [0, 0, 0.02, 0.14, 0.84],
    21: [0, 0, 0.02, 0.12, 0.86],
    22: [0, 0, 0.02, 0.10, 0.88],
    23: [0, 0, 0.02, 0.09, 0.89],
    24: [0, 0, 0.02, 0.08, 0.90],
    25: [0, 0, 0.02, 0.08, 0.90]
  };

  // Clamp level to 1-25 range
  const safeLevel = Math.max(1, Math.min(25, level));
  const odds = tierOddsTable[safeLevel];

  return {
    tier1: odds[0],
    tier2: odds[1],
    tier3: odds[2],
    tier4: odds[3],
    tier5: odds[4]
  };
}

/**
 * ShopSystem - Main export object with all shop operations
 */
export const ShopSystem = {
  // Shop operations
  refreshShop,
  buyUnit,
  sellUnit,
  lockShop,
  unlockShop,
  
  // Shop generation
  generateShopOffers,
  calculateRefreshCost,
  
  // Tier odds
  getTierOdds
};

export default ShopSystem;
