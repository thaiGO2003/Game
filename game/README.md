# Forest Throne - Ba Chu Khu Rung

A Phaser 3 auto-battler game with a layered architecture supporting multiple game modes.

## Quick Start

```bash
npm install
npm run dev
```

Open browser at the URL provided by Vite (usually `http://localhost:5173`).

## Export CSV Data (Excel compatible)

```bash
npm run export:data
```

Files exported to `data/` directory:
- `data/units.csv`
- `data/skills.csv`
- `data/synergies.csv`

## Architecture Overview

The codebase is organized into 6 distinct layers for maintainability, testability, and extensibility:

```
Game Modes Layer → Scene Layer → Systems Layer → UI Components → Core Layer → Data Layer
```

### Layers

1. **Game Modes Layer** (`src/gameModes/`) - Defines different game modes with unique rules and configurations
2. **Scene Layer** (`src/scenes/`) - Phaser scenes handling only orchestration and rendering
3. **Systems Layer** (`src/systems/`) - Independent business logic modules (Shop, Combat, Board, etc.)
4. **UI Components Layer** (`src/ui/`) - Reusable UI components
5. **Core Layer** (`src/core/`) - Shared utilities, state management, effects
6. **Data Layer** (`src/data/`) - Static data, catalogs, CSV parsing

For detailed architecture documentation, see [ARCHITECTURE.md](.kiro/specs/code-architecture-refactor/ARCHITECTURE.md).

## Systems Layer

The game's business logic is organized into independent systems:

### BoardSystem (`src/systems/BoardSystem.js`)
- Manages 5x5 board state
- Validates unit placement and movement
- Tracks deployed units and enforces deploy limits
- Calculates synergies from deployed units

### ShopSystem (`src/systems/ShopSystem.js`)
- Generates shop offers based on player level
- Handles buy/sell operations
- Manages shop refresh and locking
- Calculates tier odds (levels 1-25)

### CombatSystem (`src/systems/CombatSystem.js`)
- Initializes combat state and manages turn order
- Executes skills and basic attacks
- Calculates damage with modifiers
- Applies status effects and determines combat outcomes

### UpgradeSystem (`src/systems/UpgradeSystem.js`)
- Detects upgrade opportunities (3 matching units)
- Combines units to increase star level
- Transfers equipment between units
- Validates star level limits (max 3)

### SynergySystem (`src/systems/SynergySystem.js`)
- Counts units by type and class
- Activates synergies at thresholds
- Applies synergy bonuses to units
- Provides synergy descriptions and icons

### AISystem (`src/systems/AISystem.js`)
- Generates enemy teams within budget
- Scales difficulty (EASY, MEDIUM, HARD)
- Makes tactical AI decisions
- Scales enemy strength by round

**Key Benefits:**
- Framework-agnostic (no Phaser dependencies)
- Independently testable without mocking
- Reusable across different game modes
- Pure functions where possible

## Game Modes

The game supports multiple game modes with different rules and configurations. See [Game Modes Guide](src/gameModes/README.md) for creating custom modes.

### Available Modes

- **PVE Journey** - Standard campaign mode with progressive difficulty
- **Endless Mode** - Survival mode with aggressive scaling
- **PVP Mode** - Player vs Player (future implementation)

### Creating a New Game Mode

```javascript
import { createGameModeConfig, AI_DIFFICULTY } from './gameModes/GameModeConfig.js'
import GameModeRegistry from './gameModes/GameModeRegistry.js'

const MyMode = createGameModeConfig('MY_MODE', {
  name: 'My Custom Mode',
  description: 'A unique gameplay experience',
  startingGold: 15,
  startingHP: 5,
  aiDifficulty: AI_DIFFICULTY.HARD,
  goldScaling: (round) => 10 + round * 2,
  enemyScaling: (round) => round * 1.5
})

GameModeRegistry.register(MyMode)
```

For detailed instructions, see [src/gameModes/README.md](src/gameModes/README.md).

## Development Guide

### Project Structure

```
game/
├── src/
│   ├── gameModes/      # Game mode configurations
│   ├── scenes/         # Phaser scenes (orchestration only)
│   ├── systems/        # Business logic systems
│   ├── ui/             # Reusable UI components
│   ├── core/           # Shared utilities and state
│   ├── data/           # Static data and catalogs
│   └── main.js         # Entry point
├── data/               # CSV data files
├── tests/              # Test files
└── public/             # Static assets
```

### Adding New Features

1. **Identify the appropriate layer** - Business logic goes in Systems, UI goes in UI Components, etc.
2. **Create the module** - Follow the existing patterns in that layer
3. **Write tests** - Unit tests for systems, integration tests for scenes
4. **Update documentation** - Keep README and architecture docs current

### Working with Systems

Systems are pure business logic modules that:
- Accept input parameters (player state, board state, etc.)
- Return result objects with `{ success, data, error }`
- Have no Phaser dependencies
- Use pure functions where possible

Example:
```javascript
import { ShopSystem } from './systems/ShopSystem.js'

// In a scene
const result = ShopSystem.refreshShop(this.player, 2)
if (result.success) {
  this.player = result.player
  this.updateShopUI()
} else {
  this.showError(result.error)
}
```

### Dependency Rules

- Systems CANNOT depend on other Systems
- Systems CANNOT depend on Scenes or Phaser
- Systems CAN depend on Core and Data layers
- Scenes delegate business logic to Systems
- No circular dependencies allowed

## Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Organization

```
tests/
├── systems/          # System unit tests
├── integration/      # Integration tests
└── properties/       # Property-based tests
```

### Writing Tests

Systems are easy to test without Phaser:

```javascript
import { BoardSystem } from '../src/systems/BoardSystem.js'

test('placeUnit validates position bounds', () => {
  const board = createEmptyBoard()
  const unit = createTestUnit()
  
  const result = BoardSystem.placeUnit(board, unit, 5, 5)
  
  expect(result.success).toBe(false)
  expect(result.error).toContain('out of bounds')
})
```

## Implemented Features (MVP Playable)

- Màn hình chính:
  - `Bắt đầu`
  - Sau khi bấm `Bắt đầu`: chọn `chế độ` + `độ khó` trước khi vào trận.
  - `Cài đặt` (âm thanh mặc định, độ khó AI mặc định)
  - `Xóa tiến trình lưu`
- Vòng chơi đầy đủ qua scene độc lập:
  - `PlanningScene` (shop/economy/deploy/augment)
  - `CombatScene` (autobattle/resolve)
  - `PlanningScene` nhận kết quả round và tiếp tục progression.
- Mỗi vòng có đội hình địch được AI xếp sẵn trước giao tranh để người chơi khắc chế.
- Kinh tế kiểu TFT:
  - Vàng theo round (base + interest + streak).
  - Shop 5 tướng, `Roll`, `Buy XP`, `Lock`.
  - Level + deploy cap theo level.
  - Merge sao `3x -> +1 star` tự động.
- Lưu/khôi phục progression bằng `localStorage`:
  - Qua `Cài đặt` (`ESC` hoặc nút góc phải): `Save`, `Load`, `Clear`.
  - Auto save khi thao tác chính và khi chuyển phase.
- Combat theo luật quét ô:
  - Ta: `row 0->4`, `col 4->0`
  - Địch: `row 0->4`, `col 5->9`
  - Xen kẽ hành động theo queue.
- Rule class target:
  - `Assassin` ưu tiên hậu phương.
  - `Archer/Mage` ưu tiên cùng hàng.
  - `Melee/Tanker/Fighter` ưu tiên tiền tuyến.
- Action pattern:
  - Ranged đứng yên.
  - Melee lao trước mặt rồi quay về.
  - Assassin vòng sau rồi quay về.
- Skill system data-driven + bộ skill riêng theo class.
- Synergy `Class/Tribe` mốc `2/4/6`.
- Augment chọn `3 -> 1` ở các mốc round.
- Tooltip chi tiết:
  - Unit tooltip (stats, skill formula, synergy mốc).
  - Synergy/Augment tooltip.
- VFX/SFX cơ bản:
  - Slash/pulse/floating text.
  - Âm click/hit/skill/heal/KO (bật/tắt bằng nút `Audio`).
- Cải tiến giao diện:
  - Việt hóa toàn bộ UI hiển thị.
  - Bàn đấu dùng tọa độ dạng cờ vua (`A1`, `B3`, ...).
  - Hai phe tách nhau 1 ô tượng trưng ở giữa.
  - Phe ta hiển thị trái-dưới, phe địch phải-trên.
  - Có biểu tượng thú (emoji) trong board/shop/bench/combat.
  - Bố cục panel theo tỷ lệ màn hình (responsive theo canvas fit), tách rõ khu combat/shop/side panel.
  - Hỗ trợ zoom/pan sân đấu ở Planning: lăn chuột để zoom, kéo chuột phải để di chuyển.
- Kho thú & vật phẩm:
  - Panel phải dưới hiển thị kho linh thú dự bị + vật phẩm.
  - Có ghép đồ cơ bản (craft) để nhận buff đội hình.
- Nội dung roster:
  - Tổng số tướng trong hệ thống: `40`.
- Âm thanh:
  - Có nhạc nền + SFX (được tải về local trong `public/assets/audio`).
  - Nguồn file âm thanh mẫu: CDN assets của Phaser examples (`cdn.phaserfiles.com`).
- AI difficulty:
  - `Easy`, `Medium`, `Hard`.
  - Scale theo stats, rage gain, target quality, size đội hình.
- Sudden death:
  - Tăng damage toàn trận khi combat kéo dài.

## Controls

- **SPACE**:
  - Planning: Start combat
  - Combat: Step through one action
- **R**: Start new run
- **1 / 2 / 3**: Switch AI difficulty (Easy/Medium/Hard)
- **Mouse**:
  - Click shop cards to buy units
  - Click bench to select units
  - Click board cells to deploy/swap/recall units
  - Click buttons for roll/xp/lock/start/new run/save/load/clear/audio

## Documentation

- [Architecture Documentation](.kiro/specs/code-architecture-refactor/ARCHITECTURE.md) - Detailed layer architecture
- [Game Modes Guide](src/gameModes/README.md) - Creating custom game modes
- [Design Document](.kiro/specs/code-architecture-refactor/design.md) - Refactor design and specifications
- [Requirements](.kiro/specs/code-architecture-refactor/requirements.md) - System requirements

## Contributing

When contributing to this project:

1. Follow the layered architecture principles
2. Keep systems independent and testable
3. Write tests for new features
4. Update documentation as needed
5. Ensure all tests pass before submitting

## Performance

The architecture is optimized for performance:
- Systems are lightweight (no framework overhead)
- Sprite pooling reduces garbage collection
- Pure functions enable optimization
- Combat turn execution < 16ms (60 FPS)
- Shop refresh < 50ms
- Scene transitions < 100ms
