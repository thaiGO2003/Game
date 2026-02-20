# Requirements Document: Đại tu và Cân bằng Game Bá Chủ Khu Rừng

## Introduction

Dự án "Đại tu và Cân bằng Game Bá Chủ Khu Rừng" (Forest Lord Overhaul) là một bản cập nhật toàn diện nhằm sửa lỗi các cơ chế cốt lõi, cân bằng lại hệ thống đơn vị, và mở rộng nội dung game từ 50 lên 120 linh thú. Tài liệu này định nghĩa các yêu cầu chức năng dựa trên thiết kế kỹ thuật đã được phê duyệt.

## Glossary

- **Combat_System**: Hệ thống chiến đấu xử lý tấn công, kỹ năng, và tương tác giữa các đơn vị
- **Rage_System**: Hệ thống quản lý tích lũy Nộ (Rage/Mana) cho phép đơn vị sử dụng kỹ năng
- **Knockback_System**: Hệ thống xử lý hiệu ứng đẩy lùi của kỹ năng Tricera Charge
- **Buff_System**: Hệ thống quản lý các hiệu ứng tăng cường trong chế độ Endless
- **Unit_Catalog**: Danh mục chứa tất cả 120 linh thú với thông tin stats và kỹ năng
- **Shop_System**: Hệ thống cửa hàng hiển thị và bán đơn vị theo tier odds
- **Progression_System**: Hệ thống quản lý cấp độ, kinh nghiệm, và deploy cap
- **Validation_System**: Hệ thống kiểm tra tính hợp lệ của dữ liệu CSV
- **Attacker**: Đơn vị thực hiện đòn tấn công
- **Defender**: Đơn vị nhận đòn tấn công
- **Deploy_Cap**: Giới hạn số lượng đơn vị có thể triển khai trên bàn cờ
- **Tier_Odds**: Xác suất xuất hiện các tier đơn vị trong shop theo cấp độ
- **Board**: Bàn cờ 5×10 chứa các đơn vị trong combat


## Requirements

### Requirement 1: Rage Gain on Attack Hit

**User Story:** Là một người chơi, tôi muốn đơn vị của mình chỉ nhận Nộ khi đòn đánh thực sự trúng mục tiêu, để hệ thống combat công bằng và logic.

#### Acceptance Criteria

1. WHEN an Attacker's attack hits a Defender, THEN THE Rage_System SHALL increase the Attacker's rage by the appropriate rage gain value
2. WHEN damage is dealt to a Defender, THEN THE Rage_System SHALL increase the Defender's rage by 1
3. WHEN an Attacker is on the LEFT side (player), THEN THE Rage_System SHALL increase rage by 1 per hit
4. WHEN an Attacker is on the RIGHT side (AI), THEN THE Rage_System SHALL increase rage by the AI rage gain multiplier per hit
5. WHEN rage is increased, THEN THE Rage_System SHALL clamp the rage value to not exceed the unit's rageMax

### Requirement 2: Rage Gain Prevention on Attack Miss

**User Story:** Là một người chơi, tôi muốn đơn vị địch không nhận Nộ khi đòn đánh của họ bị né tránh, để tôi có lợi thế khi build đội hình evasion cao.

#### Acceptance Criteria

1. WHEN an Attacker's attack misses due to evasion, THEN THE Rage_System SHALL NOT increase the Attacker's rage
2. WHEN an attack misses, THEN THE Rage_System SHALL increase the Defender's rage by 1
3. WHEN an attack misses, THEN THE Combat_System SHALL display "TRƯỢT" floating text on the Defender
4. WHEN an attack misses, THEN THE Combat_System SHALL return 0 damage dealt
5. WHEN evasion check occurs, THEN THE Combat_System SHALL check evasion before calculating damage


### Requirement 3: Knockback Position Finding

**User Story:** Là một người chơi, tôi muốn kỹ năng Tricera Charge đẩy địch về vị trí hợp lý (ô trống cuối hoặc trước tanker), để kỹ năng này có giá trị chiến thuật cao.

#### Acceptance Criteria

1. WHEN the Knockback_System searches for a valid position, THEN THE Knockback_System SHALL scan the target's horizontal row in the push direction
2. WHEN an empty cell is found during scanning, THEN THE Knockback_System SHALL record it as a potential knockback position
3. WHEN a TANKER unit is found during scanning, THEN THE Knockback_System SHALL stop scanning and return the cell immediately before the TANKER
4. WHEN no TANKER is found, THEN THE Knockback_System SHALL return the last empty cell found during scanning
5. WHEN all cells are blocked by non-TANKER units, THEN THE Knockback_System SHALL return the target's current position
6. WHEN the calculated position is returned, THEN THE Knockback_System SHALL ensure it is within board bounds [0, boardWidth-1]

### Requirement 4: Knockback Effect Application

**User Story:** Là một người chơi, tôi muốn thấy hiệu ứng đẩy lùi rõ ràng khi Tricera Charge kích hoạt, để hiểu được tác động của kỹ năng.

#### Acceptance Criteria

1. WHEN Tricera Charge skill is cast, THEN THE Combat_System SHALL apply damage to the target first
2. WHEN the target survives the damage, THEN THE Knockback_System SHALL calculate the new position
3. WHEN the new position differs from current position, THEN THE Knockback_System SHALL move the target to the new position
4. WHEN the target is moved, THEN THE Combat_System SHALL play a tween animation showing the movement
5. WHEN the target is moved, THEN THE Combat_System SHALL display "ĐẨY LÙI" floating text
6. WHEN the target cannot be moved (blocked), THEN THE Combat_System SHALL display "KHÓA VỊ TRÍ" floating text
7. WHEN the target dies from the damage, THEN THE Knockback_System SHALL NOT attempt to move the target


### Requirement 5: Endless Mode Buff Management

**User Story:** Là một người chơi, tôi muốn chế độ Endless không tự động hồi máu cho đơn vị của tôi, để độ khó tăng dần một cách công bằng.

#### Acceptance Criteria

1. WHEN the game mode is ENDLESS, THEN THE Buff_System SHALL NOT apply healing buffs to player units
2. WHEN the game mode is ENDLESS and round number exceeds 30, THEN THE Buff_System SHALL apply scaling buffs to AI units
3. WHEN AI scaling buffs are applied, THEN THE Buff_System SHALL increase AI unit HP, ATK, and MATK based on round number
4. WHEN the game mode is not ENDLESS, THEN THE Buff_System SHALL NOT apply any Endless-specific buffs
5. WHEN calculating scale factor, THEN THE Buff_System SHALL use formula: 1 + (round - 30) × 0.05

### Requirement 6: Unit Catalog Loading

**User Story:** Là một developer, tôi muốn hệ thống load chính xác 120 linh thú từ CSV, để đảm bảo nội dung game đầy đủ và không có lỗi.

#### Acceptance Criteria

1. WHEN the game starts, THEN THE Unit_Catalog SHALL parse units.csv and load all unit definitions
2. WHEN parsing is complete, THEN THE Unit_Catalog SHALL return exactly 120 unit objects
3. WHEN loading units, THEN THE Unit_Catalog SHALL NOT execute any dynamic generation logic
4. WHEN a unit is parsed, THEN THE Unit_Catalog SHALL include all required properties: id, name, species, icon, tribe, classType, tier, hp, atk, def, matk, mdef, range, rageMax, skillId
5. WHEN units are loaded, THEN THE Unit_Catalog SHALL make them available to the game runtime


### Requirement 7: Unit Catalog Validation

**User Story:** Là một developer, tôi muốn hệ thống validate dữ liệu CSV trước khi build, để phát hiện lỗi sớm và đảm bảo chất lượng dữ liệu.

#### Acceptance Criteria

1. WHEN validation runs, THEN THE Validation_System SHALL verify the total unit count equals 120
2. WHEN validation runs, THEN THE Validation_System SHALL verify each role (TANKER, FIGHTER, ASSASSIN, ARCHER, MAGE, SUPPORT) has exactly 20 units
3. WHEN validation runs, THEN THE Validation_System SHALL verify each role-tier combination has exactly 4 units
4. WHEN validation runs, THEN THE Validation_System SHALL verify all unit IDs are unique
5. WHEN validation runs, THEN THE Validation_System SHALL verify all name and icon combinations are unique
6. WHEN validation runs, THEN THE Validation_System SHALL verify all skillId references exist in skills.csv
7. WHEN validation fails, THEN THE Validation_System SHALL output detailed error messages listing all violations
8. WHEN validation fails, THEN THE Validation_System SHALL exit with error code 1 to fail the build process

### Requirement 8: Wolf Unit Rework

**User Story:** Là một người chơi, tôi muốn Wolf được chuyển sang role Assassin với stats phù hợp, để đơn vị này có lối chơi rõ ràng hơn.

#### Acceptance Criteria

1. WHEN Wolf unit data is loaded, THEN THE Unit_Catalog SHALL set Wolf's classType to "ASSASSIN"
2. WHEN Wolf unit data is loaded, THEN THE Unit_Catalog SHALL set Wolf's classVi to "Sát thủ"
3. WHEN Wolf is an ASSASSIN, THEN THE Combat_System SHALL apply 20% base evasion (ASSASSIN class bonus)
4. WHEN Wolf stats are loaded, THEN THE Unit_Catalog SHALL set HP to 280 (reduced from 325)
5. WHEN Wolf stats are loaded, THEN THE Unit_Catalog SHALL set ATK to 72 (increased from 64)
6. WHEN Wolf stats are loaded, THEN THE Unit_Catalog SHALL set DEF to 16 (reduced from 21)
7. WHEN Wolf stats are loaded, THEN THE Unit_Catalog SHALL set rageMax to 2 (reduced from 3)


### Requirement 9: Mosquito Drain Enhancement

**User Story:** Là một người chơi, tôi muốn Mosquito tăng HP tối đa khi hút máu, để đơn vị này có khả năng scale tốt hơn trong late game.

#### Acceptance Criteria

1. WHEN Mosquito casts drain skill and deals damage, THEN THE Combat_System SHALL heal the Mosquito by 60% of damage dealt
2. WHEN Mosquito casts drain skill and deals damage, THEN THE Combat_System SHALL increase Mosquito's hpMax by 15% of damage dealt
3. WHEN hpMax is increased, THEN THE Combat_System SHALL also increase current hp by the same amount
4. WHEN hpMax is increased, THEN THE Combat_System SHALL display floating text showing the max HP increase
5. WHEN Mosquito casts drain skill, THEN THE Combat_System SHALL apply disease status to adjacent enemies
6. WHEN disease is applied, THEN THE Combat_System SHALL set disease duration to 3 turns and disease damage to 10

### Requirement 10: Fox Gold Reward

**User Story:** Là một người chơi, tôi muốn Fox nhận thêm vàng khi giết địch bằng kỹ năng, để đơn vị này có giá trị kinh tế cao.

#### Acceptance Criteria

1. WHEN Fox casts flame combo skill, THEN THE Combat_System SHALL deal two separate hits to the target
2. WHEN the target is alive before the second hit and dies from either hit, THEN THE Combat_System SHALL award 1 gold to the player
3. WHEN gold is awarded, THEN THE Combat_System SHALL increase player's gold by 1
4. WHEN gold is awarded, THEN THE Combat_System SHALL display "+1 VÀNG" floating text
5. WHEN gold is awarded, THEN THE Combat_System SHALL add a log message indicating the kill and gold reward
6. WHEN Fox is on the AI side (RIGHT), THEN THE Combat_System SHALL NOT award gold


### Requirement 11: Leopard Tier 5 Upgrade

**User Story:** Là một người chơi, tôi muốn Leopard được nâng lên tier 5 với kỹ năng mạnh hơn, để có thêm lựa chọn assassin mạnh trong late game.

#### Acceptance Criteria

1. WHEN Leopard unit data is loaded, THEN THE Unit_Catalog SHALL set Leopard's tier to 5
2. WHEN Leopard stats are loaded, THEN THE Unit_Catalog SHALL set HP to 320 (buffed)
3. WHEN Leopard stats are loaded, THEN THE Unit_Catalog SHALL set ATK to 95 (buffed)
4. WHEN Leopard casts execute skill and kills the target, THEN THE Combat_System SHALL refund 50% of Leopard's rageMax
5. WHEN rage is refunded, THEN THE Combat_System SHALL increase Leopard's current rage by the refund amount
6. WHEN rage is refunded, THEN THE Combat_System SHALL clamp rage to not exceed rageMax
7. WHEN rage is refunded, THEN THE Combat_System SHALL display floating text showing the rage refund

### Requirement 12: Deploy Cap Increase

**User Story:** Là một người chơi, tôi muốn có thể triển khai tối đa 25 đơn vị (full bàn cờ 5×5), để có nhiều chiến thuật hơn ở late game.

#### Acceptance Criteria

1. WHEN calculating deploy cap for a given level, THEN THE Progression_System SHALL use formula: level + 2
2. WHEN deploy cap is calculated, THEN THE Progression_System SHALL clamp the result to minimum 3
3. WHEN deploy cap is calculated, THEN THE Progression_System SHALL clamp the result to maximum 25
4. WHEN player reaches level 23 or higher, THEN THE Progression_System SHALL return deploy cap of 25
5. WHEN player is at level 1, THEN THE Progression_System SHALL return deploy cap of 3


### Requirement 13: Tier Odds Extension

**User Story:** Là một người chơi, tôi muốn tier odds được mở rộng đến cấp 25+, để progression không bị giới hạn và có thể thấy tier 5 units thường xuyên hơn ở late game.

#### Acceptance Criteria

1. WHEN accessing tier odds for levels 1-9, THEN THE Progression_System SHALL return predefined hardcoded tier odds
2. WHEN accessing tier odds for levels 10-25, THEN THE Progression_System SHALL calculate tier odds using interpolation formula
3. WHEN calculating tier odds, THEN THE Progression_System SHALL ensure tier 1 odds decrease as level increases
4. WHEN calculating tier odds, THEN THE Progression_System SHALL ensure tier 5 odds increase as level increases
5. WHEN tier odds are calculated, THEN THE Progression_System SHALL ensure the sum of all tier odds equals 1.0 (±0.001)
6. WHEN player reaches level 25, THEN THE Progression_System SHALL return tier odds with approximately 70% for tier 5
7. WHEN accessing tier odds for levels beyond 25, THEN THE Progression_System SHALL use level 25 odds as fallback

### Requirement 14: XP Progression Extension

**User Story:** Là một người chơi, tôi muốn có thể lên cấp vượt quá level 9, để game có độ sâu và progression dài hơn.

#### Acceptance Criteria

1. WHEN XP requirements are defined, THEN THE Progression_System SHALL provide XP values for levels 1 through 25
2. WHEN XP requirements are accessed, THEN THE Progression_System SHALL ensure XP values are monotonically increasing
3. WHEN player gains XP, THEN THE Progression_System SHALL allow leveling beyond level 9 without restrictions
4. WHEN player reaches a level beyond the defined XP table, THEN THE Progression_System SHALL continue allowing progression


### Requirement 15: Easy Mode Difficulty Scaling

**User Story:** Là một người chơi chơi Easy mode, tôi muốn độ khó tăng dần sau round 30, để game không trở nên quá dễ ở late game.

#### Acceptance Criteria

1. WHEN the game mode is Easy and round number is 30 or less, THEN THE Combat_System SHALL use standard Easy mode difficulty
2. WHEN the game mode is Easy and round number exceeds 30, THEN THE Combat_System SHALL increase AI unit strength
3. WHEN AI strength is increased, THEN THE Combat_System SHALL apply scaling to AI unit stats based on round number
4. WHEN the game mode is not Easy, THEN THE Combat_System SHALL NOT apply Easy mode difficulty adjustments

### Requirement 16: Shop Tier Odds Application

**User Story:** Là một người chơi, tôi muốn shop hiển thị đơn vị theo tier odds phù hợp với cấp độ của tôi, để có cơ hội tìm được đơn vị mạnh hơn khi lên cấp.

#### Acceptance Criteria

1. WHEN the shop refreshes, THEN THE Shop_System SHALL query tier odds from Progression_System based on player level
2. WHEN selecting units for shop, THEN THE Shop_System SHALL randomly select tier for each slot according to tier odds
3. WHEN a tier is selected, THEN THE Shop_System SHALL randomly select a unit of that tier from Unit_Catalog
4. WHEN shop is displayed, THEN THE Shop_System SHALL show units with correct tier distribution matching the odds
5. WHEN player level increases, THEN THE Shop_System SHALL use updated tier odds for subsequent refreshes


### Requirement 17: Unit Data Integrity

**User Story:** Là một developer, tôi muốn mỗi đơn vị có dữ liệu hợp lệ và đầy đủ, để tránh lỗi runtime và đảm bảo game hoạt động ổn định.

#### Acceptance Criteria

1. WHEN a unit is validated, THEN THE Validation_System SHALL verify tier is in range [1, 5]
2. WHEN a unit is validated, THEN THE Validation_System SHALL verify hp is greater than 0
3. WHEN a unit is validated, THEN THE Validation_System SHALL verify atk is greater than 0
4. WHEN a unit is validated, THEN THE Validation_System SHALL verify def is greater than or equal to 0
5. WHEN a unit is validated, THEN THE Validation_System SHALL verify range is in range [1, 4]
6. WHEN a unit is validated, THEN THE Validation_System SHALL verify rageMax is in range [2, 5]
7. WHEN a unit is validated, THEN THE Validation_System SHALL verify skillId references an existing skill in skills.csv
8. WHEN a unit is validated, THEN THE Validation_System SHALL verify classType is one of: TANKER, FIGHTER, ASSASSIN, ARCHER, MAGE, SUPPORT

### Requirement 18: Skill Data Validation

**User Story:** Là một developer, tôi muốn tất cả kỹ năng được referenced bởi units phải tồn tại trong skills.csv, để tránh lỗi missing skill khi đơn vị cast skill.

#### Acceptance Criteria

1. WHEN validation runs, THEN THE Validation_System SHALL load all skills from skills.csv
2. WHEN validation runs, THEN THE Validation_System SHALL create a set of all valid skill IDs
3. WHEN validating a unit, THEN THE Validation_System SHALL check if the unit's skillId exists in the valid skill IDs set
4. WHEN a unit references a non-existent skill, THEN THE Validation_System SHALL add an error message with unit ID and missing skillId
5. WHEN validation completes with missing skill errors, THEN THE Validation_System SHALL fail the build


### Requirement 19: Combat Damage Calculation

**User Story:** Là một người chơi, tôi muốn damage được tính toán chính xác dựa trên stats và damage type, để combat có tính toán rõ ràng và công bằng.

#### Acceptance Criteria

1. WHEN calculating damage, THEN THE Combat_System SHALL check for evasion before applying damage
2. WHEN evasion check succeeds, THEN THE Combat_System SHALL return 0 damage and skip damage calculation
3. WHEN evasion check fails, THEN THE Combat_System SHALL calculate damage based on rawDamage and damageType
4. WHEN damageType is "physical", THEN THE Combat_System SHALL reduce damage by defender's DEF stat
5. WHEN damageType is "magic", THEN THE Combat_System SHALL reduce damage by defender's MDEF stat
6. WHEN damageType is "true", THEN THE Combat_System SHALL NOT reduce damage by any defense stat
7. WHEN damage is calculated, THEN THE Combat_System SHALL clamp the result to minimum 0

### Requirement 20: Unit Merging System

**User Story:** Là một người chơi, tôi muốn có thể merge 3 đơn vị cùng loài để tạo đơn vị mạnh hơn, để có progression trong việc nâng cấp đội hình.

#### Acceptance Criteria

1. WHEN three units with the same species are on the bench or board, THEN THE Combat_System SHALL allow merging them
2. WHEN units are merged, THEN THE Combat_System SHALL create a new unit with increased star level
3. WHEN a unit's star level increases, THEN THE Combat_System SHALL multiply base stats by star multiplier
4. WHEN a merged unit is created, THEN THE Combat_System SHALL remove the three source units
5. WHEN a merged unit is created, THEN THE Combat_System SHALL place it in an available slot


### Requirement 21: Board Position Management

**User Story:** Là một người chơi, tôi muốn có thể di chuyển đơn vị trên bàn cờ, để tối ưu hóa vị trí và chiến thuật.

#### Acceptance Criteria

1. WHEN a player drags a unit on the board, THEN THE Combat_System SHALL allow moving it to any valid empty cell
2. WHEN a unit is moved, THEN THE Combat_System SHALL update the unit's row and col properties
3. WHEN a unit is moved, THEN THE Combat_System SHALL update the visual position of the unit sprite
4. WHEN a player attempts to move a unit to an occupied cell, THEN THE Combat_System SHALL swap the two units' positions
5. WHEN deploy cap is reached, THEN THE Combat_System SHALL prevent placing additional units from bench to board

### Requirement 22: Skill Casting System

**User Story:** Là một người chơi, tôi muốn đơn vị tự động cast skill khi đủ rage, để combat có chiều sâu và không cần micro-management.

#### Acceptance Criteria

1. WHEN a unit's rage reaches rageMax, THEN THE Combat_System SHALL mark the unit as ready to cast skill
2. WHEN it is the unit's turn and rage is at rageMax, THEN THE Combat_System SHALL execute the unit's skill instead of basic attack
3. WHEN a skill is cast, THEN THE Combat_System SHALL reset the unit's rage to 0
4. WHEN a skill is cast, THEN THE Combat_System SHALL apply the skill's effects according to the skill definition
5. WHEN a skill targets an enemy, THEN THE Combat_System SHALL select target based on the skill's actionPattern


### Requirement 23: Encyclopedia Display

**User Story:** Là một người chơi, tôi muốn xem tất cả 120 linh thú trong encyclopedia, để tìm hiểu về các đơn vị và lên kế hoạch đội hình.

#### Acceptance Criteria

1. WHEN the encyclopedia is opened, THEN THE Combat_System SHALL display all 120 units from Unit_Catalog
2. WHEN displaying units, THEN THE Combat_System SHALL group units by role and tier
3. WHEN a unit is selected, THEN THE Combat_System SHALL display detailed information including stats and skill description
4. WHEN browsing the encyclopedia, THEN THE Combat_System SHALL allow filtering by role, tier, or tribe
5. WHEN the encyclopedia loads, THEN THE Combat_System SHALL verify exactly 120 units are available

### Requirement 24: CSV Parsing Robustness

**User Story:** Là một developer, tôi muốn CSV parser xử lý được các edge cases như empty fields và special characters, để dữ liệu được load chính xác.

#### Acceptance Criteria

1. WHEN parsing CSV, THEN THE Unit_Catalog SHALL handle empty fields by using default values or reporting errors
2. WHEN parsing CSV, THEN THE Unit_Catalog SHALL handle special characters in names and descriptions correctly
3. WHEN parsing CSV, THEN THE Unit_Catalog SHALL trim whitespace from all string fields
4. WHEN parsing CSV, THEN THE Unit_Catalog SHALL convert numeric fields to numbers
5. WHEN parsing fails, THEN THE Unit_Catalog SHALL report the line number and field causing the error


### Requirement 25: Performance Optimization

**User Story:** Là một người chơi, tôi muốn game chạy mượt mà ngay cả khi có 25 đơn vị trên bàn cờ, để trải nghiệm chơi game tốt.

#### Acceptance Criteria

1. WHEN 25 units are on the board, THEN THE Combat_System SHALL maintain frame rate above 30 FPS
2. WHEN loading Unit_Catalog, THEN THE Combat_System SHALL complete loading within 100ms
3. WHEN calculating knockback position, THEN THE Knockback_System SHALL complete calculation in O(n) time where n is board width
4. WHEN applying rage gain, THEN THE Rage_System SHALL complete calculation in O(1) time
5. WHEN rendering combat animations, THEN THE Combat_System SHALL use sprite pooling to reduce memory allocation

### Requirement 26: Error Recovery

**User Story:** Là một người chơi, tôi muốn game xử lý lỗi gracefully mà không crash, để có trải nghiệm chơi game ổn định.

#### Acceptance Criteria

1. WHEN rage calculation would exceed rageMax, THEN THE Rage_System SHALL clamp rage to rageMax
2. WHEN knockback position is invalid, THEN THE Knockback_System SHALL keep unit at current position
3. WHEN a skill references a missing effect, THEN THE Combat_System SHALL log an error and skip the skill
4. WHEN unit data is missing required fields, THEN THE Validation_System SHALL report the error and prevent game start
5. WHEN an unexpected error occurs in combat, THEN THE Combat_System SHALL log the error and continue to next turn


### Requirement 27: Save Data Compatibility

**User Story:** Là một người chơi, tôi muốn save data cũ vẫn hoạt động sau khi update, để không mất tiến độ.

#### Acceptance Criteria

1. WHEN loading save data from previous version, THEN THE Combat_System SHALL validate and migrate data to new format
2. WHEN save data contains units not in new catalog, THEN THE Combat_System SHALL replace them with equivalent units
3. WHEN save data contains invalid level or deploy cap, THEN THE Progression_System SHALL clamp values to valid ranges
4. WHEN migration is needed, THEN THE Combat_System SHALL log migration actions for debugging
5. WHEN save data is corrupted, THEN THE Combat_System SHALL start a new game and notify the player

### Requirement 28: Unit Distribution Balance

**User Story:** Là một game designer, tôi muốn đảm bảo mỗi role và tier có đủ 4 đơn vị, để player có nhiều lựa chọn và build diversity.

#### Acceptance Criteria

1. WHEN designing unit catalog, THEN THE Unit_Catalog SHALL ensure each of 6 roles has exactly 20 units
2. WHEN designing unit catalog, THEN THE Unit_Catalog SHALL ensure each of 5 tiers has exactly 24 units (6 roles × 4 units)
3. WHEN designing unit catalog, THEN THE Unit_Catalog SHALL ensure each role-tier combination has exactly 4 units
4. WHEN validation runs, THEN THE Validation_System SHALL verify this distribution is maintained
5. WHEN adding new units, THEN THE Validation_System SHALL prevent builds if distribution is violated

