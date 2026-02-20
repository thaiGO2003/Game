# Requirements Document: Gold Scaling and Level Cap

## Introduction

This document specifies the requirements for three interconnected game mechanics: a gold reserve scaling system that amplifies skill damage and control effects based on accumulated gold, an assassin skill upgrade system that automatically uses enhanced "_v2" variants for 2-3 star assassins, and an increased level cap from 9-12 to 25 across all game scenes.

## Glossary

- **Gold_Reserve_System**: The subsystem that calculates damage and effect multipliers based on player's accumulated gold
- **Assassin_Upgrade_System**: The subsystem that determines which skill variant to use for assassin units based on star level
- **Level_System**: The subsystem that manages player experience points and level progression
- **Combat_Scene**: The game scene where combat encounters occur
- **Planning_Scene**: The game scene where players prepare between combat rounds
- **Board_Prototype_Scene**: The alternative game scene for board-based gameplay
- **Skill_Library**: The data structure containing all skill definitions
- **Unit_Catalog**: The data structure containing all unit definitions
- **Gold_Multiplier**: A numeric value between 1.0 and 2.0 that scales damage and effects
- **Base_Skill**: The default skill assigned to a unit in the unit catalog
- **Upgraded_Skill**: An enhanced "_v2" variant of a base skill
- **XP**: Experience points that contribute to level progression
- **Level_Cap**: The maximum level a player can reach (25)

## Requirements

### Requirement 1: Gold Reserve Scaling Calculation

**User Story:** As a player, I want my accumulated gold to increase my combat effectiveness, so that economic management is rewarded with stronger abilities.

#### Acceptance Criteria

1. WHEN gold is at or below 10, THE Gold_Reserve_System SHALL return a multiplier of 1.0
2. WHEN gold is above 10, THE Gold_Reserve_System SHALL calculate a multiplier as 1.0 + ((gold - 10) / 2) / 100
3. WHEN the calculated multiplier exceeds 2.0, THE Gold_Reserve_System SHALL cap the multiplier at 2.0
4. FOR ALL gold amounts g1 and g2 where g1 < g2, THE Gold_Reserve_System SHALL return a multiplier for g1 that is less than or equal to the multiplier for g2
5. FOR ALL gold amounts, THE Gold_Reserve_System SHALL return a multiplier between 1.0 and 2.0 inclusive

### Requirement 2: Gold Scaling Application to Skill Damage

**User Story:** As a player, I want my skills to deal more damage when I have more gold, so that I can see the benefit of my economic strategy in combat.

#### Acceptance Criteria

1. WHEN calculating skill damage, THE Combat_Scene SHALL retrieve the gold multiplier from the Gold_Reserve_System
2. WHEN applying the gold multiplier to base damage, THE Combat_Scene SHALL multiply the base damage by the gold multiplier and round the result
3. FOR ALL base damage values, THE Combat_Scene SHALL produce final damage greater than or equal to the base damage
4. WHEN player gold changes during combat, THE Combat_Scene SHALL use the current gold amount for each skill activation

### Requirement 3: Gold Scaling Application to Control Effects

**User Story:** As a player, I want my control effects to be more reliable when I have more gold, so that my crowd control abilities scale with my economic success.

#### Acceptance Criteria

1. WHEN calculating control effect probability, THE Combat_Scene SHALL retrieve the gold multiplier from the Gold_Reserve_System
2. WHEN applying the gold multiplier to base probability, THE Combat_Scene SHALL multiply the base probability by the gold multiplier
3. WHEN the scaled probability exceeds 1.0, THE Combat_Scene SHALL cap the probability at 1.0
4. FOR ALL base probabilities, THE Combat_Scene SHALL produce final probabilities greater than or equal to the base probability

### Requirement 4: Assassin Skill Upgrade Determination

**User Story:** As a player, I want my 2-3 star assassins to automatically use upgraded skills, so that star upgrades provide meaningful power increases for assassin units.

#### Acceptance Criteria

1. WHEN creating a combat unit with class ASSASSIN and star level 2 or 3, THE Assassin_Upgrade_System SHALL check if an upgraded skill exists
2. WHEN an upgraded skill exists in the Skill_Library, THE Assassin_Upgrade_System SHALL return the upgraded skill ID
3. WHEN an upgraded skill does not exist in the Skill_Library, THE Assassin_Upgrade_System SHALL return the base skill ID
4. WHEN creating a combat unit with class other than ASSASSIN, THE Assassin_Upgrade_System SHALL return the base skill ID
5. WHEN creating a combat unit with star level 1, THE Assassin_Upgrade_System SHALL return the base skill ID regardless of class

### Requirement 5: Upgraded Skill Naming Convention

**User Story:** As a developer, I want a consistent naming convention for upgraded skills, so that the system can reliably locate skill variants.

#### Acceptance Criteria

1. WHEN constructing an upgraded skill ID, THE Assassin_Upgrade_System SHALL append "_v2" to the base skill ID
2. FOR ALL base skill IDs, THE Assassin_Upgrade_System SHALL use the format "${baseSkillId}_v2" for upgraded variants
3. WHEN looking up an upgraded skill, THE Assassin_Upgrade_System SHALL verify the skill exists in the Skill_Library before returning it

### Requirement 6: Level Cap Extension

**User Story:** As a player, I want to level up beyond the current cap, so that I can continue progressing in longer gameplay sessions.

#### Acceptance Criteria

1. WHEN gaining experience points, THE Level_System SHALL allow level increases up to level 25
2. WHEN the player reaches level 25, THE Level_System SHALL prevent further level increases
3. WHEN the player is at level 25 and gains experience, THE Level_System SHALL not increment the level
4. THE Level_System SHALL enforce the level cap of 25 in Combat_Scene, Planning_Scene, and Board_Prototype_Scene

### Requirement 7: Experience Point Processing

**User Story:** As a player, I want my experience points to be properly distributed across level ups, so that no XP is lost and progression is fair.

#### Acceptance Criteria

1. WHEN gaining experience points, THE Level_System SHALL add the XP to the current progress
2. WHEN accumulated XP reaches the threshold for the next level, THE Level_System SHALL increment the player level by 1
3. WHEN leveling up, THE Level_System SHALL reset the current XP to 0 and carry over any excess XP
4. WHEN gaining XP that spans multiple levels, THE Level_System SHALL process each level up sequentially
5. WHILE the player level is below 25 and XP remains, THE Level_System SHALL continue processing level ups

### Requirement 8: Level Up Logging

**User Story:** As a player, I want to see when I level up, so that I'm aware of my progression.

#### Acceptance Criteria

1. WHEN the player levels up, THE Level_System SHALL generate a log message indicating the new level
2. WHEN multiple level ups occur from a single XP gain, THE Level_System SHALL generate a log message for each level

### Requirement 9: Deploy Cap and Tier Odds Updates

**User Story:** As a player, I want my deploy capacity and shop tier odds to update as I level, so that higher levels provide strategic advantages.

#### Acceptance Criteria

1. WHEN the player levels up, THE Level_System SHALL update the deploy cap based on the new level
2. WHEN the player levels up, THE Level_System SHALL update the tier odds based on the new level
3. THE Level_System SHALL support deploy cap calculations for all levels from 1 to 25
4. THE Level_System SHALL support tier odds calculations for all levels from 1 to 25

### Requirement 10: Save Data Compatibility

**User Story:** As a player, I want my existing save data to work with the new level cap, so that I don't lose my progress.

#### Acceptance Criteria

1. WHEN loading save data with level 9 or below, THE Level_System SHALL preserve the player level
2. WHEN loading save data with level between 10 and 12, THE Level_System SHALL preserve the player level
3. WHEN loading save data with level above 25, THE Level_System SHALL cap the level at 25
4. WHEN loading save data, THE Level_System SHALL validate that the level is within the valid range of 1 to 25

### Requirement 11: Gold Scaling Input Validation

**User Story:** As a developer, I want the gold scaling system to handle invalid inputs gracefully, so that the game doesn't crash from unexpected data.

#### Acceptance Criteria

1. WHEN gold is negative, THE Gold_Reserve_System SHALL treat it as 0 and return a multiplier of 1.0
2. WHEN gold is not a number, THE Gold_Reserve_System SHALL treat it as 0 and return a multiplier of 1.0
3. WHEN gold is undefined or null, THE Gold_Reserve_System SHALL treat it as 0 and return a multiplier of 1.0

### Requirement 12: Skill Upgrade Fallback Behavior

**User Story:** As a developer, I want the skill upgrade system to fail gracefully when data is missing, so that units can still function with base skills.

#### Acceptance Criteria

1. WHEN an upgraded skill ID is not found in the Skill_Library, THE Assassin_Upgrade_System SHALL return the base skill ID
2. WHEN the base skill ID is empty or invalid, THE Assassin_Upgrade_System SHALL return the base skill ID unchanged
3. FOR ALL units, THE Assassin_Upgrade_System SHALL ensure a valid skill ID is returned

### Requirement 13: XP Overflow Handling

**User Story:** As a player, I want large XP gains to be processed correctly, so that I can level up multiple times from a single reward.

#### Acceptance Criteria

1. WHEN gaining XP that exceeds multiple level thresholds, THE Level_System SHALL process all applicable level ups
2. WHEN gaining XP at level 24 that exceeds the level 25 threshold, THE Level_System SHALL level up to 25 and discard excess XP
3. FOR ALL XP gains, THE Level_System SHALL ensure XP is properly distributed across level ups without loss (except at level cap)
