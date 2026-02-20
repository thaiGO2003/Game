# Requirements Document

## Introduction

Sau khi hoàn thành Forest Lord Overhaul với 120 units, cần thực hiện các sửa lỗi và cải tiến để đảm bảo game hoàn thiện, cân bằng và không có lỗi logic. Spec này tập trung vào việc sửa các vấn đề về emoji trùng lặp, mô tả skill không chính xác, cân bằng gameplay, bug logic, và đảm bảo tính đầy đủ của dữ liệu game.

## Glossary

- **Unit**: Một con thú trong game với các thuộc tính như HP, Attack, Role, Tier
- **Emoji**: Biểu tượng đại diện cho mỗi Unit, phải là duy nhất
- **Skill**: Kỹ năng đặc biệt của Unit, được kích hoạt khi đạt đủ Rage
- **Rage**: Năng lượng tích lũy khi Unit tấn công hoặc bị tấn công
- **Role**: Vai trò của Unit (Tanker, Assassin, Mage, Support, Ranger, Warrior)
- **Tier**: Bậc của Unit từ 1 đến 5
- **Combat_System**: Hệ thống chiến đấu xử lý logic tấn công, phòng thủ, skill
- **Unit_Catalog**: Danh sách tất cả các Unit trong game từ file units.csv
- **Skill_Catalog**: Danh sách tất cả các Skill trong game từ file skills.csv
- **Knockback**: Hiệu ứng đẩy lùi kẻ địch
- **Stat_Scaling**: Tăng trưởng chỉ số khi Unit lên cấp

## Requirements

### Requirement 1: Emoji Uniqueness Validation

**User Story:** Là một người chơi, tôi muốn mỗi con thú có emoji riêng biệt, để tôi có thể phân biệt chúng dễ dàng trong trận chiến.

#### Acceptance Criteria

1. THE Unit_Catalog SHALL validate that no two Units share the same emoji
2. WHEN the Unit_Catalog is loaded, THE System SHALL check for duplicate emojis
3. IF duplicate emojis are found, THEN THE System SHALL report all Units with duplicate emojis
4. THE Triceratops SHALL have a different emoji from the Tyrannosaurus
5. FOR ALL Units in the Unit_Catalog, parsing the catalog then validating uniqueness SHALL confirm zero duplicates (round-trip property)

### Requirement 2: Skill Description Accuracy

**User Story:** Là một người chơi, tôi muốn mô tả skill chính xác với gameplay, để tôi hiểu rõ cách skill hoạt động.

#### Acceptance Criteria

1. THE Skill_Catalog SHALL NOT contain geometric terms like "hình nón" or "hình tròn"
2. WHEN a Skill targets multiple enemies, THE Skill description SHALL use grid-based terminology
3. THE System SHALL replace all circular or conical area descriptions with grid-appropriate terms
4. WHEN a Skill description is updated, THE System SHALL maintain semantic equivalence with the original intent

### Requirement 3: Wolf Role Transformation

**User Story:** Là một game designer, tôi muốn Wolf có skill phù hợp với vai trò Assassin, để gameplay cân bằng hơn.

#### Acceptance Criteria

1. THE System SHALL transfer the current Wolf Skill to a Tanker Unit
2. THE Wolf Unit SHALL receive a new Skill appropriate for the Assassin Role
3. WHEN the Wolf Skill is transferred, THE receiving Tanker SHALL have the Skill properly configured
4. THE new Wolf Skill SHALL align with Assassin characteristics (high damage, single target, or stealth mechanics)

### Requirement 4: Mosquito Lifesteal Verification

**User Story:** Là một người chơi, tôi muốn Mosquito hút máu tăng cả HP hiện tại và HP tối đa, để skill này có giá trị chiến thuật.

#### Acceptance Criteria

1. WHEN Mosquito uses its lifesteal Skill, THE Combat_System SHALL increase both current HP and maximum HP
2. THE System SHALL verify that the lifesteal implementation matches the Skill description
3. WHEN Mosquito gains HP from lifesteal, THE HP increase SHALL persist for the remainder of combat

### Requirement 5: Rage Gain on Miss Fix

**User Story:** Là một người chơi, tôi muốn Unit không được tăng Rage khi đánh hụt, để cơ chế evasion có ý nghĩa.

#### Acceptance Criteria

1. WHEN a Unit's attack misses due to evasion, THE Combat_System SHALL NOT increase the attacker's Rage
2. THE test "should not gain rage when attack misses (attacker)" SHALL pass
3. WHEN a Unit evades an attack, THE defender SHALL still gain Rage as normal
4. THE Combat_System SHALL correctly distinguish between hit and miss for Rage calculation

### Requirement 6: Leopard Buff

**User Story:** Là một người chơi, tôi muốn Leopard mạnh hơn với thưởng vàng cao hơn và khả năng tấn công liên tiếp, để Unit này hấp dẫn hơn.

#### Acceptance Criteria

1. WHEN Leopard eliminates an enemy, THE Combat_System SHALL award 5 gold instead of 1 gold
2. WHEN Leopard eliminates an enemy, THE Combat_System SHALL allow Leopard to attack another enemy immediately
3. THE Leopard Skill description SHALL reflect the updated gold reward value
4. WHEN Leopard eliminates multiple enemies in one turn, THE gold reward SHALL stack additively

### Requirement 7: Fox Skill Gold Reward Verification

**User Story:** Là một người chơi, tôi muốn Fox nhận được vàng khi tiêu diệt kẻ địch bằng skill, để khuyến khích sử dụng skill này.

#### Acceptance Criteria

1. WHEN Fox eliminates an enemy with its 150% physical damage Skill, THE Combat_System SHALL award 1 gold per eliminated enemy
2. THE System SHALL verify that the Fox Skill implementation matches the Skill description
3. WHEN Fox eliminates multiple enemies with one Skill activation, THE gold reward SHALL equal the number of enemies eliminated

### Requirement 8: Triceratops Knockback Fix

**User Story:** Là một người chơi, tôi muốn Triceratops húc kẻ địch về phía sau đúng cách, để skill này hoạt động như mô tả.

#### Acceptance Criteria

1. WHEN Triceratops uses its knockback Skill, THE Combat_System SHALL pull the target toward the rearmost column
2. THE knocked-back enemy SHALL remain in the new position after knockback
3. THE knocked-back enemy SHALL be positioned one space in front of allies in the same row
4. WHEN no valid knockback position exists, THE Combat_System SHALL keep the enemy in its current position

### Requirement 9: Skill Description Completeness

**User Story:** Là một người chơi, tôi muốn mô tả skill có đầy đủ số liệu cụ thể, để tôi có thể đánh giá chính xác sức mạnh của Unit.

#### Acceptance Criteria

1. THE Skill_Catalog SHALL include specific numeric values for all scaling effects
2. WHEN a Skill scales with ally count, THE Skill description SHALL specify the scaling formula
3. WHEN a Skill scales with strength, THE Skill description SHALL specify the scaling thresholds
4. THE System SHALL identify all Skills with vague descriptions like "tăng sức mạnh" without numbers

### Requirement 10: Skill Logic Implementation Completeness

**User Story:** Là một game developer, tôi muốn tất cả skill được implement đầy đủ logic, để không có skill nào chỉ là placeholder.

#### Acceptance Criteria

1. THE Combat_System SHALL implement logic for all Skills defined in the Skill_Catalog
2. WHEN a Skill is activated, THE Combat_System SHALL execute the complete Skill effect
3. THE System SHALL identify all Skills with incomplete or missing implementation
4. FOR ALL Skills, THE implementation SHALL match the Skill description semantically

### Requirement 11: Stat Scaling Implementation

**User Story:** Là một người chơi, tôi muốn Units tăng sức mạnh khi lên cấp, để có cảm giác tiến bộ rõ ràng.

#### Acceptance Criteria

1. THE Combat_System SHALL apply stat scaling when a Unit levels up
2. WHEN a Unit levels up, THE System SHALL increase HP, Attack, or other stats based on the Unit's Tier and Role
3. THE System SHALL identify all Units without stat scaling configuration
4. THE stat scaling formula SHALL be consistent across Units of the same Tier and Role

### Requirement 12: 120 Units Verification

**User Story:** Là một game designer, tôi muốn đảm bảo có đúng 120 units không trùng lặp, để game có đủ đa dạng và cân bằng.

#### Acceptance Criteria

1. THE Unit_Catalog SHALL contain exactly 120 Units
2. THE Unit distribution SHALL be 6 Roles × 5 Tiers × 4 Units per combination
3. THE System SHALL verify that no two Units share the same Skill
4. THE System SHALL verify that no two Units share the same emoji
5. FOR ALL Units, THE combination of Role and Tier SHALL have exactly 4 Units

### Requirement 13: Rage Overflow Test Fix

**User Story:** Là một developer, tôi muốn test rageOverflow.test.js pass, để đảm bảo logic evasion hoạt động đúng.

#### Acceptance Criteria

1. THE test "should not gain rage when attack misses (attacker)" SHALL pass with expected value 0
2. WHEN the test simulates an attack miss, THE attacker's Rage SHALL remain at 0
3. THE test SHALL correctly configure evasion to cause the attack to miss
4. THE Combat_System SHALL respect the evasion configuration in the test environment
