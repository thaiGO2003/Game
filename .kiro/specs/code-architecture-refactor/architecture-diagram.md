# Architecture Diagram

## High-Level Layer View

```
┌───────────────────────────────────────────────────────────────────────┐
│                         GAME MODES LAYER                              │
│                                                                       │
│  Defines game mode configurations and rules                          │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ PVE Journey │  │ Endless     │  │ PVP Mode    │                 │
│  │ Mode        │  │ Mode        │  │ (Future)    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                       │
│  GameModeConfig • GameModeRegistry                                   │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ uses
                                ↓
┌───────────────────────────────────────────────────────────────────────┐
│                           SCENE LAYER                                 │
│                                                                       │
│  Phaser scenes - orchestration, rendering, user input only           │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Loading  │  │ MainMenu │  │ Planning │  │ Combat   │            │
│  │ Scene    │  │ Scene    │  │ Scene    │  │ Scene    │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                       │
│  • Lifecycle management (create, update, shutdown)                   │
│  • User input handling                                               │
│  • Rendering and animations                                          │
│  • Orchestrate system calls                                          │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ delegates to
                                ↓
┌───────────────────────────────────────────────────────────────────────┐
│                         SYSTEMS LAYER                                 │
│                                                                       │
│  Business logic - independent, testable, reusable modules            │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Board    │  │ Shop     │  │ Combat   │  │ Upgrade  │            │
│  │ System   │  │ System   │  │ System   │  │ System   │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                       │
│  ┌──────────┐  ┌──────────┐                                         │
│  │ Synergy  │  │ AI       │                                         │
│  │ System   │  │ System   │                                         │
│  └──────────┘  └──────────┘                                         │
│                                                                       │
│  • Pure functions (no side effects)                                  │
│  • No Phaser dependencies                                            │
│  • No inter-system dependencies                                      │
│  • Clear input/output interfaces                                     │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ uses
                                ↓
┌───────────────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS LAYER                              │
│                                                                       │
│  Reusable UI widgets and components                                  │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Library  │  │ Skill    │  │ Attack   │  │ Recipe   │            │
│  │ Modal    │  │ Preview  │  │ Preview  │  │ Diagram  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                       │
│  • Self-contained components                                         │
│  • Reusable across scenes                                            │
│  • Event-based communication                                         │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ uses
                                ↓
┌───────────────────────────────────────────────────────────────────────┐
│                          CORE LAYER                                   │
│                                                                       │
│  Shared utilities, state management, effects                         │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ persist  │  │ sprite   │  │ runState │  │ game     │            │
│  │ ence     │  │ Pool     │  │          │  │ Rules    │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ game     │  │ vfx      │  │ audioFx  │  │ tooltip  │            │
│  │ Utils    │  │          │  │          │  │          │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                       │
│  • Utility functions                                                 │
│  • Global state management                                           │
│  • Visual and audio effects                                          │
│  • No business logic                                                 │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ reads from
                                ↓
┌───────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                   │
│                                                                       │
│  Static data, catalogs, CSV parsing                                  │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ unit     │  │ skills   │  │ items    │  │ synergies│            │
│  │ Catalog  │  │          │  │          │  │          │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                       │
│  ┌──────────┐  ┌──────────┐                                         │
│  │ augments │  │ unit     │                                         │
│  │          │  │ Visuals  │                                         │
│  └──────────┘  └──────────┘                                         │
│                                                                       │
│  • Immutable data (read-only)                                        │
│  • CSV files as source of truth                                      │
│  • Efficient lookup structures                                       │
│  • No dependencies                                                   │
└───────────────────────────────────────────────────────────────────────┘
```

## Detailed System Interactions

### Planning Phase Flow

```
User Action (Click "Refresh Shop")
         │
         ↓
┌─────────────────────┐
│  PlanningScene      │  ← Scene Layer
│  refreshShop()      │
└──────────┬──────────┘
           │ delegates to
           ↓
┌─────────────────────┐
│  ShopSystem         │  ← Systems Layer
│  refreshShop()      │
└──────────┬──────────┘
           │ uses
           ↓
┌─────────────────────┐
│  gameRules          │  ← Core Layer
│  REFRESH_COST       │
└──────────┬──────────┘
           │ reads from
           ↓
┌─────────────────────┐
│  unitCatalog        │  ← Data Layer
│  UNIT_BY_ID         │
└──────────┬──────────┘
           │ returns
           ↓
┌─────────────────────┐
│  ShopSystem         │
│  { success, player }│
└──────────┬──────────┘
           │ returns
           ↓
┌─────────────────────┐
│  PlanningScene      │
│  updateShopUI()     │  ← Renders result
└─────────────────────┘
```

### Combat Phase Flow

```
Combat Start
     │
     ↓
┌─────────────────────┐
│  CombatScene        │  ← Scene Layer
│  startCombat()      │
└──────────┬──────────┘
           │ delegates to
           ↓
┌─────────────────────┐
│  AISystem           │  ← Systems Layer
│  generateEnemyTeam()│
└──────────┬──────────┘
           │ returns enemies
           ↓
┌─────────────────────┐
│  CombatSystem       │  ← Systems Layer
│  initializeCombat() │
└──────────┬──────────┘
           │ uses
           ↓
┌─────────────────────┐
│  SynergySystem      │  ← Systems Layer
│  calculateSynergies()│
└──────────┬──────────┘
           │ reads from
           ↓
┌─────────────────────┐
│  synergies          │  ← Data Layer
│  SYNERGY_BY_ID      │
└──────────┬──────────┘
           │ returns combat state
           ↓
┌─────────────────────┐
│  CombatScene        │
│  animateCombat()    │  ← Renders combat
└─────────────────────┘
```

## Dependency Graph

```
Game Modes ──────────────────────────────────┐
    │                                        │
    ↓                                        │
Scenes ──────────────────────────────┐       │
    │                                │       │
    ↓                                │       │
Systems ─────────────────────┐       │       │
    │                        │       │       │
    ↓                        │       │       │
UI Components ───────┐       │       │       │
    │                │       │       │       │
    ↓                ↓       ↓       ↓       ↓
Core ────────────────────────────────────────┤
    │                                        │
    ↓                                        ↓
Data ←───────────────────────────────────────┘

Legend:
  ──→  Allowed dependency (top to bottom)
  ←──  Read-only access
```

## System Independence

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ BoardSystem  │     │ ShopSystem   │     │ CombatSystem │
│              │     │              │     │              │
│ No deps on   │     │ No deps on   │     │ No deps on   │
│ other systems│     │ other systems│     │ other systems│
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │  Core Layer   │
                    │  Data Layer   │
                    └───────────────┘

All systems depend only on Core and Data layers
Systems are completely independent of each other
```

## Game Mode Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Game Start                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  main.js                                                    │
│  • Import GameModeRegistry                                  │
│  • Get selected game mode                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  GameModeRegistry.get('PVE_JOURNEY')                        │
│  Returns:                                                   │
│  • startingGold: 10                                         │
│  • startingHP: 3                                            │
│  • aiDifficulty: 'MEDIUM'                                   │
│  • enabledSystems: { shop: true, ... }                      │
│  • goldScaling: (round) => ...                              │
│  • enemyScaling: (round) => ...                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Scenes receive config via scene.data                       │
│  • PlanningScene uses startingGold, goldScaling             │
│  • CombatScene uses aiDifficulty, enemyScaling              │
│  • MainMenuScene uses enabledSystems for UI                 │
└─────────────────────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Pyramid                           │
│                                                             │
│                        ┌───┐                                │
│                        │ E2E│  Manual testing              │
│                        └───┘                                │
│                      ┌───────┐                              │
│                      │Integr.│  Scene + System tests       │
│                      └───────┘                              │
│                  ┌─────────────┐                            │
│                  │  Property   │  Property-based tests     │
│                  └─────────────┘                            │
│              ┌───────────────────┐                          │
│              │   Unit Tests      │  System unit tests      │
│              └───────────────────┘                          │
│                                                             │
│  • Systems: Unit + Property tests (no Phaser)              │
│  • Scenes: Integration tests (with Phaser)                 │
│  • Full game: E2E tests (manual)                           │
└─────────────────────────────────────────────────────────────┘
```

## Performance Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                   Performance Targets                       │
│                                                             │
│  Scene Layer (60 FPS = 16ms per frame)                     │
│  ├─ Rendering: ~10ms                                       │
│  └─ System calls: ~6ms                                     │
│                                                             │
│  Systems Layer (fast, no Phaser overhead)                  │
│  ├─ Combat turn: < 16ms                                    │
│  ├─ Shop refresh: < 50ms                                   │
│  ├─ Synergy calc: < 10ms                                   │
│  └─ Board operations: < 5ms                                │
│                                                             │
│  Core Layer (optimized utilities)                          │
│  ├─ Sprite pool: O(1) get/release                          │
│  ├─ Save/load: < 100ms                                     │
│  └─ VFX: < 5ms per effect                                  │
│                                                             │
│  Data Layer (cached lookups)                               │
│  └─ Catalog lookup: O(1)                                   │
└─────────────────────────────────────────────────────────────┘
```

## Summary

This architecture provides:

- **6 clear layers** with distinct responsibilities
- **Top-down dependencies** (no circular dependencies)
- **System independence** (no inter-system dependencies)
- **Framework isolation** (systems don't depend on Phaser)
- **Testability** (systems can be tested independently)
- **Extensibility** (new game modes without code changes)
- **Performance** (lightweight systems, optimized core)
- **Maintainability** (clear structure, easy to navigate)
