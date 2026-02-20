# Game Balance Overhaul - Implementation Summary

## 1. Progression System Expansion (Level 25 Cap)
- **Files Modified**: 
    - `src/core/gameUtils.js`: Extended `XP_TO_LEVEL_UP` and `TIER_ODDS_BY_LEVEL` up to level 25.
    - `src/scenes/PlanningScene.js`: Updated `gainXp` to allow leveling up to 25.
    - `src/scenes/BoardPrototypeScene.js`: Updated `gainXp` to level 25.
    - `src/scenes/CombatScene.js`: Updated `gainXp` to level 25.
- **Result**: Player can now reach level 25, with deployment caps scaling up to 25 (filling the 5x5 board).

## 2. Assassin Skill Upgrade System
- **Files Modified**: 
    - `src/core/gameUtils.js`: Added `getEffectiveSkillId` which upgrades Assassin skills to `_v2` variants at 2+ stars.
    - `src/scenes/CombatScene.js`: Updated `createCombatUnit` to use `getEffectiveSkillId`.
    - `src/scenes/PlanningScene.js`: Updated `createCombatUnit` to use `getEffectiveSkillId`.
- **Verified Skills**: `void_execute_v2` and `flame_combo_v2` are present in `skills.csv`.
- **Result**: Assassins now gain enhanced skill variants upon reaching 2 stars, rewarding vertical progression.

## 3. Gold-Based Skill Scaling
- **Files Modified**: 
    - `src/core/gameUtils.js`: Implemented `getGoldReserveScaling(gold)` (+1% effect per 2 gold above 10, capped at 100% bonus).
    - `src/scenes/CombatScene.js`: 
        - Applied scaling to `calcSkillRaw` (affects all skill damage).
        - Applied scaling to `damage_stun` effect chance.
- **Result**: Players are rewarded for maintaining a strong economy with more potent combat effects.

## 4. Verification & Quality Assurance
- **Tests**:
    - `tests/progression.test.js`: Verified level 25 XP and deployment caps.
    - `tests/rageOverflow.test.js`: Fixed test mock to align with new evasion mechanics.
    - Total 486 tests passing.
- **Bug Fixes**:
    - Removed redundant/duplicate `getGoldReserveScaling` from `gameUtils.js`.
    - Fixed test suites failing due to evasion clamping.

## Next Steps
- Monitor high-level gameplay balance (lvl 20-25).
- Fine-tune `_v2` skill numbers if Assassins become too dominant.
- Consider extending gold scaling to other status effects (Burn, Poison, etc.) if current implementation is well-received.
