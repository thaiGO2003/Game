# Requirements Document: Code Architecture Refactor

## Introduction

Đây là tài liệu yêu cầu cho dự án refactor kiến trúc code của game Phaser 3. Mục tiêu là tổ chức lại codebase để hỗ trợ nhiều chế độ chơi (game modes), tách biệt các concerns, và tạo kiến trúc có thể mở rộng cho tương lai. Refactor này phải đảm bảo không gây lỗi, maintain backward compatibility, và giữ nguyên tất cả functionality hiện tại.

## Glossary

- **System**: Một module độc lập chứa business logic cho một domain cụ thể (Shop, Combat, Board, etc.)
- **Scene**: Phaser Scene, chỉ chứa lifecycle management và orchestration
- **Game_Mode**: Cấu hình định nghĩa rules, systems, và behavior cho một chế độ chơi
- **Core_Layer**: Shared utilities, state management, và effects không phụ thuộc vào business logic
- **Data_Layer**: Static data, catalogs, và CSV parsing logic
- **Pure_Function**: Function không có side effects và luôn trả về cùng output với cùng input
- **Player_State**: Object chứa toàn bộ state của người chơi (gold, units, level, etc.)
- **Combat_State**: Object chứa toàn bộ state của một combat encounter
- **Board**: Ma trận 5x5 chứa units được deploy
- **Owned_Unit**: Unit thuộc sở hữu của player với uid, star level, và equipment
- **Shop_Offer**: Unit có sẵn để mua trong shop
- **Synergy**: Bonus được kích hoạt khi có đủ units cùng type/class
- **Refactor_Step**: Một thay đổi code nhỏ, atomic, có thể test và commit độc lập

## Requirements

### Requirement 1: System Extraction

**User Story:** Là một developer, tôi muốn business logic được tách thành các systems độc lập, để code dễ test, maintain, và reuse.

#### Acceptance Criteria

1. THE System SHALL be extracted to a separate file in `src/systems/` directory
2. THE System SHALL NOT depend on Phaser framework
3. THE System SHALL NOT depend on other Systems (only Core_Layer and Data_Layer)
4. THE System SHALL use Pure_Functions where possible
5. WHEN a System is extracted, THEN all existing tests SHALL still pass
6. THE System SHALL have a clearly defined interface with input/output types
7. THE System SHALL be independently testable without mocking Phaser

### Requirement 2: BoardSystem Functionality

**User Story:** Là một developer, tôi muốn board management logic được centralized, để dễ dàng quản lý unit placement và validation.

#### Acceptance Criteria

1. WHEN placing a unit on Board, THE BoardSystem SHALL validate position is within bounds (0-4 for row and col)
2. WHEN placing a unit on Board, THE BoardSystem SHALL validate position is empty
3. WHEN moving a unit on Board, THE BoardSystem SHALL validate both source and destination positions
4. THE BoardSystem SHALL provide query functions to get unit at position
5. THE BoardSystem SHALL calculate deployed unit count
6. THE BoardSystem SHALL validate deploy limit before placement
7. WHEN calculating synergies, THE BoardSystem SHALL return all active Synergy bonuses

### Requirement 3: ShopSystem Functionality

**User Story:** Là một player, tôi muốn shop operations hoạt động chính xác, để có thể mua và bán units một cách đáng tin cậy.

#### Acceptance Criteria

1. WHEN refreshing shop with sufficient gold, THE ShopSystem SHALL deduct refresh cost from Player_State
2. WHEN refreshing shop, THE ShopSystem SHALL generate Shop_Offers based on player level and tier odds
3. WHEN buying a unit with sufficient gold, THE ShopSystem SHALL deduct unit cost from Player_State
4. WHEN buying a unit, THE ShopSystem SHALL add Owned_Unit to player bench
5. WHEN buying a unit, THE ShopSystem SHALL remove Shop_Offer from that slot
6. WHEN selling a unit, THE ShopSystem SHALL add sell value to Player_State gold
7. WHEN locking shop, THE ShopSystem SHALL preserve current Shop_Offers across rounds
8. THE ShopSystem SHALL calculate tier odds based on player level (1-25)
9. IF player gold is less than refresh cost, THEN THE ShopSystem SHALL return error result
10. IF player gold is less than unit cost, THEN THE ShopSystem SHALL return error result

### Requirement 4: CombatSystem Functionality

**User Story:** Là một player, tôi muốn combat logic hoạt động chính xác và nhất quán, để battles diễn ra công bằng và predictable.

#### Acceptance Criteria

1. WHEN initializing combat, THE CombatSystem SHALL create Combat_State with all units
2. THE CombatSystem SHALL calculate turn order based on unit speed stats
3. WHEN executing a turn, THE CombatSystem SHALL select next actor from turn order
4. WHEN unit rage is >= 100, THE CombatSystem SHALL execute skill and reset rage to 0
5. WHEN unit rage is < 100, THE CombatSystem SHALL execute basic attack and increase rage
6. WHEN calculating damage, THE CombatSystem SHALL apply all stat modifiers (attack, defense, elemental)
7. WHEN applying damage, THE CombatSystem SHALL ensure currentHP never goes below 0
8. WHEN a unit dies, THE CombatSystem SHALL mark unit as dead and remove from turn order
9. WHEN all player units are dead, THE CombatSystem SHALL end combat with enemy victory
10. WHEN all enemy units are dead, THE CombatSystem SHALL end combat with player victory
11. THE CombatSystem SHALL apply status effects at appropriate times
12. THE CombatSystem SHALL tick status effects each turn
13. THE CombatSystem SHALL log all combat events for replay and debugging


### Requirement 5: UpgradeSystem Functionality

**User Story:** Là một player, tôi muốn unit upgrades hoạt động tự động và chính xác, để không phải manually combine units.

#### Acceptance Criteria

1. WHEN player has 3 units with same baseId and same star level, THE UpgradeSystem SHALL detect upgrade opportunity
2. WHEN upgrading units, THE UpgradeSystem SHALL combine 3 units into 1 unit with star level increased by 1
3. WHEN upgrading units, THE UpgradeSystem SHALL transfer equipment from source units to upgraded unit
4. WHEN upgrading units, THE UpgradeSystem SHALL remove the 3 source units from bench
5. THE UpgradeSystem SHALL NOT upgrade beyond star level 3
6. WHEN checking for upgrades, THE UpgradeSystem SHALL check both bench and board units
7. THE UpgradeSystem SHALL return list of all possible upgrade candidates

### Requirement 6: SynergySystem Functionality

**User Story:** Là một player, tôi muốn synergies được tính toán chính xác, để team composition strategy hoạt động đúng.

#### Acceptance Criteria

1. WHEN calculating synergies, THE SynergySystem SHALL count units by type and class
2. WHEN synergy threshold is met, THE SynergySystem SHALL activate synergy at appropriate level
3. WHEN applying synergies to unit, THE SynergySystem SHALL apply all active Synergy bonuses
4. THE SynergySystem SHALL provide synergy description for display
5. THE SynergySystem SHALL provide synergy icon for UI
6. WHEN multiple synergies apply, THE SynergySystem SHALL apply all bonuses cumulatively
7. THE SynergySystem SHALL recalculate synergies when team composition changes

### Requirement 7: AISystem Functionality

**User Story:** Là một player, tôi muốn AI opponents có difficulty scaling hợp lý, để game challenging nhưng fair.

#### Acceptance Criteria

1. WHEN generating enemy team, THE AISystem SHALL respect budget constraint
2. WHEN generating enemy team, THE AISystem SHALL scale difficulty based on round number
3. THE AISystem SHALL apply difficulty multipliers to enemy stats (EASY, MEDIUM, HARD)
4. WHEN AI unit takes turn, THE AISystem SHALL make tactical decisions (target selection, skill usage)
5. THE AISystem SHALL generate diverse team compositions
6. WHEN round number increases, THE AISystem SHALL increase enemy team strength
7. THE AISystem SHALL ensure generated teams are valid (no duplicate uids, valid positions)

### Requirement 8: Scene Refactoring

**User Story:** Là một developer, tôi muốn scenes chỉ chứa orchestration code, để business logic có thể reuse và test độc lập.

#### Acceptance Criteria

1. WHEN Scene is refactored, THE Scene SHALL delegate business logic to Systems
2. THE Scene SHALL contain only Phaser lifecycle methods (create, update, init, shutdown)
3. THE Scene SHALL contain only rendering and animation code
4. THE Scene SHALL contain only user input handling
5. THE Scene SHALL NOT contain business logic calculations
6. THE Scene SHALL NOT directly manipulate Player_State (use Systems instead)
7. WHEN Scene calls System, THE Scene SHALL handle success and error results appropriately
8. WHEN Scene is refactored, THEN all existing functionality SHALL work identically

### Requirement 9: Game Mode Support

**User Story:** Là một developer, tôi muốn có thể tạo game modes mới dễ dàng, để mở rộng game với các chế độ chơi khác nhau.

#### Acceptance Criteria

1. THE Game_Mode SHALL be defined by a configuration object
2. THE Game_Mode configuration SHALL specify starting gold, HP, and lose condition
3. THE Game_Mode configuration SHALL specify which Systems are enabled
4. THE Game_Mode configuration SHALL specify AI difficulty
5. THE Game_Mode configuration SHALL specify scaling functions for gold and enemies
6. THE Game_Mode configuration SHALL specify scene flow
7. WHEN Game_Mode is registered, THE system SHALL validate configuration completeness
8. WHEN starting game with Game_Mode, THE Scenes SHALL adapt behavior based on configuration
9. THE system SHALL support multiple Game_Modes registered simultaneously
10. WHEN switching Game_Modes, THE system SHALL initialize with correct configuration

### Requirement 10: Backward Compatibility

**User Story:** Là một player, tôi muốn existing saves vẫn hoạt động sau refactor, để không mất progress.

#### Acceptance Criteria

1. WHEN loading save data from before refactor, THE system SHALL load successfully
2. THE save data format SHALL remain unchanged
3. WHEN saving game after refactor, THE system SHALL use same format as before
4. THE system SHALL maintain all existing game features
5. WHEN running existing tests, THEN all tests SHALL pass after refactor
6. THE system SHALL NOT introduce functional regressions

### Requirement 11: Testing Requirements

**User Story:** Là một developer, tôi muốn comprehensive test coverage, để đảm bảo refactor không gây lỗi.

#### Acceptance Criteria

1. THE System SHALL have unit tests with >= 90% code coverage
2. THE System SHALL have property-based tests for key invariants
3. WHEN System is extracted, THE tests SHALL verify behavior matches original
4. THE integration tests SHALL verify Systems work together correctly
5. THE tests SHALL verify full game flow from start to combat to next round
6. THE tests SHALL run in < 30 seconds for fast feedback
7. WHEN any code changes, THE tests SHALL run automatically
8. THE tests SHALL NOT require Phaser mocking for System tests

### Requirement 12: Performance Requirements

**User Story:** Là một player, tôi muốn game chạy mượt mà, để trải nghiệm chơi game tốt.

#### Acceptance Criteria

1. THE combat turn execution SHALL complete in < 16ms to maintain 60 FPS
2. THE shop refresh operation SHALL complete in < 50ms
3. THE board synergy calculation SHALL complete in < 10ms
4. THE scene transition SHALL complete in < 100ms
5. THE game load time SHALL be < 2 seconds
6. WHEN refactor is complete, THE performance SHALL NOT degrade by more than 5%
7. THE memory usage SHALL NOT increase by more than 10%

### Requirement 13: Code Quality Requirements

**User Story:** Là một developer, tôi muốn code quality cao, để dễ maintain và extend trong tương lai.

#### Acceptance Criteria

1. THE System file SHALL be <= 500 lines of code
2. THE function cyclomatic complexity SHALL be <= 10
3. THE code duplication SHALL be < 5%
4. THE System SHALL have JSDoc comments for all public functions
5. THE System SHALL follow consistent naming conventions
6. THE System SHALL have no circular dependencies
7. THE code SHALL pass linting without errors
8. THE System interface SHALL be documented with input/output types

### Requirement 14: Incremental Refactoring Process

**User Story:** Là một developer, tôi muốn refactor được thực hiện từng bước nhỏ, để dễ review và rollback nếu cần.

#### Acceptance Criteria

1. WHEN extracting a System, THE developer SHALL commit after extraction is complete and tested
2. THE commit SHALL be atomic (one System or one Scene per commit)
3. WHEN any Refactor_Step is complete, THEN all tests SHALL pass
4. THE codebase SHALL remain runnable after every commit
5. THE refactor SHALL follow dependency order (least dependent Systems first)
6. WHEN tests fail after a change, THE developer SHALL revert and fix before proceeding
7. THE refactor SHALL be done on a separate branch
8. WHEN refactor is complete, THE branch SHALL be reviewed before merging

### Requirement 15: System Independence

**User Story:** Là một developer, tôi muốn Systems độc lập với nhau, để có thể test và modify từng System riêng biệt.

#### Acceptance Criteria

1. THE System SHALL NOT import other Systems
2. THE System SHALL only depend on Core_Layer and Data_Layer
3. THE System SHALL NOT depend on Phaser framework
4. THE System SHALL be testable without instantiating other Systems
5. WHEN analyzing dependencies, THE dependency graph SHALL be acyclic
6. THE System SHALL communicate through well-defined interfaces
7. THE System SHALL NOT share mutable state with other Systems

### Requirement 16: Error Handling

**User Story:** Là một developer, tôi muốn errors được handle rõ ràng, để dễ debug và provide good user experience.

#### Acceptance Criteria

1. WHEN System operation fails, THE System SHALL return error result with descriptive message
2. THE System SHALL NOT throw exceptions for expected error cases (insufficient gold, invalid position)
3. THE System SHALL validate inputs and return error for invalid inputs
4. WHEN Scene receives error result, THE Scene SHALL display appropriate error message to user
5. THE System SHALL log errors for debugging purposes
6. WHEN unexpected error occurs, THE System SHALL fail gracefully without crashing game
7. THE error messages SHALL be clear and actionable

### Requirement 17: Data Validation

**User Story:** Là một developer, tôi muốn data được validate, để prevent invalid states và bugs.

#### Acceptance Criteria

1. WHEN creating Game_Mode configuration, THE system SHALL validate all required fields are present
2. WHEN creating Game_Mode configuration, THE system SHALL validate numeric values are positive
3. WHEN creating Game_Mode configuration, THE system SHALL validate tier odds sum to 100
4. WHEN loading Player_State, THE system SHALL validate state structure is correct
5. WHEN loading Combat_State, THE system SHALL validate all units have valid stats
6. THE System SHALL validate Board positions are within bounds (0-4)
7. THE System SHALL validate unit star level is 1, 2, or 3
8. THE System SHALL validate baseId exists in UNIT_BY_ID catalog

### Requirement 18: Documentation Requirements

**User Story:** Là một developer, tôi muốn documentation đầy đủ, để hiểu cách sử dụng Systems và tạo Game_Modes mới.

#### Acceptance Criteria

1. THE System SHALL have JSDoc comments for all public functions
2. THE System interface SHALL document input parameters and return types
3. THE System SHALL have usage examples in documentation
4. THE architecture SHALL be documented with layer responsibilities
5. THE Game_Mode creation process SHALL be documented with examples
6. THE refactor process SHALL be documented in design document
7. THE README SHALL be updated with new architecture information
8. THE migration guide SHALL explain how to use new Systems

### Requirement 19: Rollback Capability

**User Story:** Là một developer, tôi muốn có khả năng rollback, để có thể revert nếu refactor gây vấn đề nghiêm trọng.

#### Acceptance Criteria

1. THE refactor SHALL be done on a separate git branch
2. WHEN major issues occur, THE developer SHALL be able to revert to main branch
3. WHEN specific commit causes issues, THE developer SHALL be able to revert that commit
4. THE rollback triggers SHALL be documented (> 5 tests failing, > 20% performance regression)
5. THE rollback process SHALL be documented and tested
6. THE developer SHALL maintain backup of working state before major changes

### Requirement 20: File Organization

**User Story:** Là một developer, tôi muốn files được tổ chức rõ ràng, để dễ navigate codebase.

#### Acceptance Criteria

1. THE Systems SHALL be located in `src/systems/` directory
2. THE Game_Mode configurations SHALL be located in `src/gameModes/` directory
3. THE Scenes SHALL remain in `src/scenes/` directory
4. THE Core utilities SHALL remain in `src/core/` directory
5. THE Data layer SHALL remain in `src/data/` directory
6. THE System tests SHALL be located in `tests/systems/` directory
7. THE integration tests SHALL be located in `tests/integration/` directory
8. THE property-based tests SHALL be located in `tests/properties/` directory
9. THE file structure SHALL follow the documented architecture layers

