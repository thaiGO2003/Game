# Design Document: Post-Launch Fixes

## Overview

This design addresses critical post-launch issues and improvements for the game following the Forest Lord Overhaul that introduced 120 units. The fixes span data validation, combat mechanics, skill implementations, and game balance. The primary goals are:

1. **Data Integrity**: Ensure all units have unique emojis and skills, with accurate descriptions
2. **Combat Correctness**: Fix rage gain logic, knockback mechanics, and skill effects
3. **Game Balance**: Buff underperforming units (Leopard, Wolf) and verify skill implementations
4. **Completeness**: Validate all 120 units are properly configured with no missing data

The design follows a systematic approach: first validate and fix data files (units.csv, skills.csv), then correct combat logic in CombatScene.js, and finally verify everything through automated tests.

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  units.csv   │  │  skills.csv  │  │ verify_data  │      │
│  │  (120 units) │  │  (60 skills) │  │    .cjs      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     Game Logic Layer                         │
│                            │                                 │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │              CombatScene.js                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ resolveDamage│  │applySkillEffect│ │findKnockback│ │ │
│  │  │  (Rage Fix)  │  │ (Skill Logic) │ │  Position   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                     Validation Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Emoji Check  │  │ Skill Check  │  │ 120 Units    │      │
│  │  (Uniqueness)│  │ (Completeness)│  │  Verification│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **CSV Parsing**: verify_data.cjs reads and validates units.csv and skills.csv
2. **Validation**: Check for duplicate emojis, missing skills, incomplete descriptions
3. **Combat Execution**: CombatScene.js loads unit/skill data and executes combat logic
4. **Skill Effects**: applySkillEffect() dispatches to specific skill handlers
5. **Rage Management**: resolveDamage() handles rage gain with proper clamping
6. **Position Management**: findKnockbackPosition() calculates valid knockback positions

## Components and Interfaces

### 1. Data Validation Module (verify_data.cjs)

**Purpose**: Validate data integrity before game runtime

**Key Functions**:

```javascript
// Enhanced validation functions
function validateEmojiUniqueness(units) {
  // Returns: { valid: boolean, duplicates: Map<emoji, unit[]> }
}

function validateSkillCompleteness(skills) {
  // Returns: { valid: boolean, incomplete: skill[] }
}

function validate120Units(units) {
  // Returns: { valid: boolean, count: number, distribution: Map }
}

function validateSkillDescriptions(skills) {
  // Returns: { valid: boolean, geometricTerms: skill[] }
}
```

**Validation Rules**:
- Emoji uniqueness: No two units share the same icon
- Skill uniqueness: No two units share the same skillId (except intentional sharing)
- Count validation: Exactly 120 units (6 roles × 5 tiers × 4 units)
- Description completeness: All skills have numeric values for scaling effects
- Terminology consistency: No geometric terms ("hình nón", "hình tròn") in Vietnamese descriptions

### 2. Combat Scene Rage System

**Current Issue**: Attacker gains rage even when attack misses due to evasion

**Fixed Logic**:

```javascript
resolveDamage(attacker, defender, rawDamage, damageType, reason, options = {}) {
  // 1. Evasion check (BEFORE damage calculation)
  if (attacker && !options.forceHit && !options.isSkill) {
    const evadePct = Math.max(0, Math.min(0.6, defender.mods.evadePct || 0));
    if (Math.random() < evadePct) {
      // MISS: Only defender gains rage, attacker does NOT
      if (!options.noRage && defender.rage < defender.rageMax) {
        defender.rage = Math.min(defender.rageMax, defender.rage + 1);
      }
      return 0; // Early return - no damage dealt
    }
  }
  
  // 2. Calculate damage (only if hit)
  let final = calculateDamage(rawDamage, damageType, defender);
  let damageLeft = applyShield(final, defender);
  
  if (damageLeft > 0) {
    defender.hp = Math.max(0, defender.hp - damageLeft);
  }
  
  // 3. Rage gain (only if damage dealt)
  if (attacker && !options.noRage && damageLeft > 0 && attacker.rage < attacker.rageMax) {
    const gain = attacker.side === "RIGHT" ? this.getAI().rageGain : 1;
    attacker.rage = Math.min(attacker.rageMax, attacker.rage + gain);
  }
  
  // 4. Defender rage (only if hit AND alive)
  if (!options.noRage && damageLeft > 0 && defender.hp > 0 && defender.rage < defender.rageMax) {
    defender.rage = Math.min(defender.rageMax, defender.rage + 1);
  }
  
  // 5. Death check
  if (defender.hp <= 0) {
    defender.alive = false;
  }
  
  return damageLeft;
}
```

**Key Changes**:
- Evasion check happens FIRST, before any damage calculation
- On miss: defender gains rage, attacker does NOT
- On hit: both gain rage (if damage > 0 and still alive)
- Rage is always clamped to rageMax using Math.min()

### 3. Knockback System

**Current Issue**: Triceratops knockback pushes forward instead of backward

**Fixed Logic**:

```javascript
findKnockbackPosition(target, pushDirection, enemies, boardWidth = 10) {
  const { row, col } = target;
  
  // Determine direction based on target's side
  // LEFT side units: push toward column 9 (right/back)
  // RIGHT side units: push toward column 0 (left/back)
  const targetBackCol = target.side === "LEFT" ? boardWidth - 1 : 0;
  const moveDirection = target.side === "LEFT" ? 1 : -1;
  
  // Try to move one step toward the back
  let newCol = col + moveDirection;
  
  // Clamp to board boundaries
  newCol = Math.max(0, Math.min(boardWidth - 1, newCol));
  
  // Check if position is occupied by ally
  const occupant = enemies.find(e => e.row === row && e.col === newCol && e.alive);
  
  if (occupant) {
    // Position occupied - stay in current position
    return { row, col };
  }
  
  // Valid position found
  return { row, col: newCol };
}
```

**Knockback Rules**:
- LEFT side units are pushed toward column 9 (their back line)
- RIGHT side units are pushed toward column 0 (their back line)
- If target position is occupied, unit stays in current position
- Knockback moves exactly 1 column toward the back

### 4. Skill Effect Handlers

**New/Updated Skill Effects**:

#### Mosquito Lifesteal (mosquito_drain_v2)

```javascript
case "lifesteal_disease_maxhp": {
  const raw = this.calcSkillRaw(attacker, skill);
  const dealt = await this.resolveDamage(attacker, target, raw, skill.damageType, "SKILL");
  
  if (dealt > 0) {
    // Lifesteal: heal current HP
    const lifestealAmount = Math.round(dealt * (skill.lifesteal || 0.6));
    this.healUnit(attacker, attacker, lifestealAmount, "LIFESTEAL");
    
    // Max HP increase: 15% of damage dealt
    const maxHpIncrease = Math.round(dealt * 0.15);
    attacker.hpMax += maxHpIncrease;
    attacker.hp += maxHpIncrease; // Also increase current HP
    
    this.addLog(`${attacker.name} tăng ${maxHpIncrease} HP tối đa!`);
    
    // Disease spread to adjacent enemies
    if (skill.diseaseTurns && skill.diseaseDamage) {
      const adjacentEnemies = this.getAdjacentEnemies(target, enemies);
      for (const enemy of adjacentEnemies) {
        enemy.statuses.disease = {
          turns: skill.diseaseTurns,
          damagePerTurn: skill.diseaseDamage
        };
      }
    }
  }
  break;
}
```

#### Leopard Execute (void_execute_v2 + Gold Reward)

```javascript
case "assassin_execute_rage_refund": {
  const raw = this.calcSkillRaw(attacker, skill);
  const dealt = await this.resolveDamage(attacker, target, raw, skill.damageType, "SKILL");
  
  if (target.hp <= 0) {
    // Award 5 gold for kill
    if (attacker.side === "LEFT") {
      this.gold += 5;
      this.addLog(`${attacker.name} nhận 5 vàng từ tiêu diệt!`);
    }
    
    // Refund 50% rage
    const refund = Math.floor(attacker.rageMax * (skill.killRage || 0.5));
    attacker.rage = Math.min(attacker.rageMax, attacker.rage + refund);
    
    // Allow immediate second attack
    const secondTarget = this.selectTarget(attacker, { enemies });
    if (secondTarget) {
      await this.basicAttack(attacker, secondTarget);
    }
  }
  break;
}
```

#### Fox Gold Reward (flame_combo_v2)

```javascript
case "double_hit_gold_reward": {
  const hit1 = JSON.parse(skill.hit1);
  const hit2 = JSON.parse(skill.hit2);
  
  // First hit
  const raw1 = hit1.base + attacker.atk * hit1.scale;
  const dealt1 = await this.resolveDamage(attacker, target, raw1, skill.damageType, "SKILL_HIT1");
  
  let killCount = 0;
  if (target.hp <= 0) killCount++;
  
  // Second hit (if target still alive or find new target)
  if (target.hp > 0) {
    const raw2 = hit2.base + attacker.atk * hit2.scale;
    const dealt2 = await this.resolveDamage(attacker, target, raw2, skill.damageType, "SKILL_HIT2");
    if (target.hp <= 0) killCount++;
  }
  
  // Award gold for kills
  if (killCount > 0 && attacker.side === "LEFT") {
    this.gold += killCount;
    this.addLog(`${attacker.name} nhận ${killCount} vàng từ tiêu diệt!`);
  }
  break;
}
```

#### Wolf Alpha Howl (alpha_howl)

**Note**: This skill will be transferred to a Tanker unit. Wolf will receive a new assassin-appropriate skill.

```javascript
// New Wolf skill (to be designed)
case "shadow_strike": {
  // High burst damage, single target
  const raw = this.calcSkillRaw(attacker, skill);
  const dealt = await this.resolveDamage(attacker, target, raw * 2.5, skill.damageType, "SKILL");
  
  // Stealth mechanic: gain evasion buff after skill
  attacker.mods.evadePct = (attacker.mods.evadePct || 0) + 0.3;
  attacker.statuses.stealth = { turns: 2 };
  
  this.addLog(`${attacker.name} ẩn vào bóng tối!`);
  break;
}
```

## Data Models

### Unit Data Structure (units.csv)

```csv
id,name,species,icon,tribe,tribeVi,classType,classVi,tier,hp,atk,def,matk,mdef,range,rageMax,skillId
```

**Validation Constraints**:
- `id`: Unique identifier (snake_case)
- `icon`: Must be unique across all 120 units (emoji)
- `classType`: One of [TANKER, FIGHTER, ASSASSIN, ARCHER, MAGE, SUPPORT]
- `tier`: Integer 1-5
- `skillId`: Reference to skills.csv, can be shared but should be intentional
- Total count: Exactly 120 units
- Distribution: 6 roles × 5 tiers × 4 units = 120

### Skill Data Structure (skills.csv)

```csv
id,name,descriptionVi,actionPattern,effect,damageType,base,scaleStat,scale,...
```

**Validation Constraints**:
- `id`: Unique identifier
- `descriptionVi`: Must NOT contain "hình nón", "hình tròn", or other geometric terms
- `descriptionVi`: Must include specific numeric values for all scaling effects
- `effect`: Must have corresponding handler in applySkillEffect()
- Numeric fields: Must be present for skills that use them (not empty string)

### Combat Unit Runtime Structure

```javascript
{
  // Base stats (from units.csv)
  id: string,
  name: string,
  hp: number,
  hpMax: number,
  atk: number,
  def: number,
  matk: number,
  mdef: number,
  range: number,
  rage: number,
  rageMax: number,
  
  // Combat state
  alive: boolean,
  side: "LEFT" | "RIGHT",
  row: number,
  col: number,
  shield: number,
  
  // Modifiers
  mods: {
    evadePct: number,
    atkMult: number,
    defMult: number,
    // ... other modifiers
  },
  
  // Status effects
  statuses: {
    stun: { turns: number },
    poison: { turns: number, damagePerTurn: number },
    disease: { turns: number, damagePerTurn: number },
    stealth: { turns: number },
    // ... other statuses
  },
  
  // Skill reference
  skill: SkillData
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Emoji Uniqueness

*For any* unit catalog loaded from units.csv, no two units should share the same emoji icon.

**Validates: Requirements 1.1, 12.4**

### Property 2: CSV Round-Trip Validation

*For any* valid units.csv file, parsing the file then validating uniqueness should confirm zero duplicate emojis.

**Validates: Requirements 1.5**

### Property 3: Skill Description Terminology

*For any* skill in the skill catalog, the Vietnamese description should not contain geometric terms like "hình nón" or "hình tròn".

**Validates: Requirements 2.1**

### Property 4: Mosquito Lifesteal Max HP Increase

*For any* combat scenario where Mosquito uses its lifesteal skill and deals damage, both current HP and maximum HP should increase.

**Validates: Requirements 4.1, 4.3**

### Property 5: No Rage Gain on Miss (Attacker)

*For any* attack that misses due to evasion, the attacker's rage should not increase.

**Validates: Requirements 5.1, 13.2**

### Property 6: Rage Gain on Miss (Defender)

*For any* attack that misses due to evasion, the defender should still gain rage as normal (clamped to rageMax).

**Validates: Requirements 5.3**

### Property 7: Hit vs Miss Rage Distinction

*For any* attack, the rage calculation should correctly distinguish between hit (both gain rage) and miss (only defender gains rage).

**Validates: Requirements 5.4, 13.4**

### Property 8: Leopard Gold Reward

*For any* enemy eliminated by Leopard's skill, the combat system should award 5 gold.

**Validates: Requirements 6.1**

### Property 9: Leopard Extra Attack

*For any* enemy eliminated by Leopard's skill, Leopard should be allowed to attack another enemy immediately.

**Validates: Requirements 6.2**

### Property 10: Leopard Multi-Kill Gold Stacking

*For any* sequence of eliminations by Leopard in one turn, the gold reward should stack additively (5 gold per kill).

**Validates: Requirements 6.4**

### Property 11: Fox Gold Reward

*For any* enemy eliminated by Fox's skill, the combat system should award 1 gold per eliminated enemy.

**Validates: Requirements 7.1, 7.3**

### Property 12: Triceratops Knockback Direction

*For any* target hit by Triceratops knockback skill, the target should be moved toward the rearmost column of their side.

**Validates: Requirements 8.1**

### Property 13: Knockback Position Persistence

*For any* unit that is knocked back, the new position should remain stable after the knockback effect completes.

**Validates: Requirements 8.2**

### Property 14: Knockback Relative Positioning

*For any* unit knocked back in a row with allies, the unit should be positioned one space in front of allies in the same row.

**Validates: Requirements 8.3**

### Property 15: Skill Numeric Completeness

*For any* skill with scaling effects, the skill description should include specific numeric values.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 16: Skill Implementation Completeness

*For any* skill defined in the skill catalog, there should be a corresponding effect handler in applySkillEffect().

**Validates: Requirements 10.1**

### Property 17: Stat Scaling on Level Up

*For any* unit that levels up, the combat system should apply stat scaling based on the unit's tier and role.

**Validates: Requirements 11.1, 11.2**

### Property 18: Stat Scaling Consistency

*For any* two units with the same tier and role, the stat scaling formula should be consistent.

**Validates: Requirements 11.4**

### Property 19: 120 Units Distribution

*For any* role and tier combination, there should be exactly 4 units in the catalog.

**Validates: Requirements 12.2, 12.5**

### Property 20: Skill Uniqueness (Intentional Sharing Only)

*For any* two units sharing the same skill, this should be an intentional design decision (not accidental duplication).

**Validates: Requirements 12.3**

## Error Handling

### Data Validation Errors

**Emoji Duplication**:
```javascript
if (duplicates.size > 0) {
  console.error("❌ Emoji Duplication Detected:");
  for (const [emoji, units] of duplicates) {
    console.error(`  ${emoji} used by: ${units.map(u => u.name).join(", ")}`);
  }
  process.exit(1);
}
```

**Missing Skills**:
```javascript
if (missingSkills.length > 0) {
  console.error("❌ Units with missing skills:");
  for (const unit of missingSkills) {
    console.error(`  ${unit.name} (${unit.id}) references non-existent skill: ${unit.skillId}`);
  }
  process.exit(1);
}
```

**Incorrect Unit Count**:
```javascript
if (units.length !== 120) {
  console.error(`❌ Expected 120 units, found ${units.length}`);
  process.exit(1);
}
```

### Combat Runtime Errors

**Rage Overflow Prevention**:
```javascript
// Always clamp rage to rageMax
unit.rage = Math.min(unit.rageMax, unit.rage + gain);
```

**Invalid Knockback Position**:
```javascript
// If no valid position, keep current position
if (occupant || newCol < 0 || newCol >= boardWidth) {
  return { row: target.row, col: target.col };
}
```

**Missing Skill Handler**:
```javascript
default:
  console.warn(`⚠️ Unhandled skill effect: ${skill.effect}`);
  // Fallback to basic damage
  const raw = this.calcSkillRaw(attacker, skill);
  await this.resolveDamage(attacker, target, raw, skill.damageType, "SKILL");
  break;
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests**: Focus on specific examples, edge cases, and data validation
- Specific emoji duplicates (Triceratops vs Tyrannosaurus)
- Wolf skill transfer verification
- Leopard/Fox gold reward examples
- 120 unit count verification
- Geometric term detection in skill descriptions

**Property Tests**: Verify universal properties across all inputs
- Emoji uniqueness across random unit catalogs
- Rage gain behavior across random combat scenarios
- Knockback positioning across random board states
- Skill completeness across all skill definitions
- Stat scaling consistency across tier/role combinations

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: post-launch-fixes, Property {N}: {description}`

**Example Property Test**:

```javascript
import fc from 'fast-check';

// Feature: post-launch-fixes, Property 5: No Rage Gain on Miss (Attacker)
it('should not gain rage when attack misses due to evasion', () => {
  fc.assert(
    fc.property(
      fc.record({
        attackerRage: fc.integer({ min: 0, max: 5 }),
        defenderEvasion: fc.float({ min: 0.5, max: 1.0 }),
        damage: fc.integer({ min: 10, max: 100 })
      }),
      ({ attackerRage, defenderEvasion, damage }) => {
        const attacker = createTestUnit({ rage: attackerRage, rageMax: 5 });
        const defender = createTestUnit({ mods: { evadePct: defenderEvasion } });
        
        const initialRage = attacker.rage;
        mockScene.resolveDamage(attacker, defender, damage, "physical", "TEST");
        
        // If attack missed (damage = 0), attacker rage should not change
        if (defender.hp === defender.hpMax) {
          expect(attacker.rage).toBe(initialRage);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Data Validation Tests**:
- ✅ Emoji uniqueness validation
- ✅ Skill reference validation
- ✅ 120 unit count verification
- ✅ Role/tier distribution verification
- ✅ Geometric term detection
- ✅ Numeric value completeness

**Combat Logic Tests**:
- ✅ Rage gain on hit (attacker and defender)
- ✅ No rage gain on miss (attacker only)
- ✅ Rage clamping to rageMax
- ✅ Knockback direction and positioning
- ✅ Mosquito lifesteal max HP increase
- ✅ Leopard gold reward and extra attack
- ✅ Fox gold reward on kill

**Integration Tests**:
- ✅ Full combat scenario with evasion
- ✅ Multi-kill scenarios (Leopard, Fox)
- ✅ Knockback with occupied positions
- ✅ Skill effect chaining

### Validation Scripts

**Pre-commit Hook** (verify_data.cjs):
```bash
node game/verify_data.cjs
```

This script should run automatically before commits to catch data issues early.

**Test Execution**:
```bash
# Run all tests
npm test

# Run specific test suites
npm test rageOverflow
npm test knockback
npm test dataValidation
```

## Implementation Plan

### Phase 1: Data Fixes (Requirements 1, 2, 3, 9, 12)

1. **Emoji Duplication Fix**:
   - Scan units.csv for duplicate emojis
   - Replace Triceratops emoji (currently 🦕, conflicts with Tyrannosaurus)
   - Suggested: Triceratops → 🦏 (if not used) or unique dinosaur emoji

2. **Skill Description Updates**:
   - Find all skills with "hình nón", "hình tròn" in descriptionVi
   - Replace with grid-based terms:
     - "hình nón" → "vùng hình tam giác phía trước" or "các ô phía trước"
     - "hình tròn" → "vùng xung quanh" or "các ô liền kề"
   - Add specific numeric values to vague descriptions

3. **Wolf Role Transformation**:
   - Transfer alpha_howl skill to a Tanker unit (suggest: ant_guard or pangolin_plate)
   - Create new assassin skill for Wolf (shadow_strike or similar)
   - Update units.csv with new skillId for Wolf

4. **120 Units Verification**:
   - Run validation script to confirm count
   - Verify distribution: 6 roles × 5 tiers × 4 units
   - Check for any missing tier/role combinations

### Phase 2: Combat Logic Fixes (Requirements 5, 8, 13)

1. **Rage Gain Fix** (CombatScene.js, resolveDamage):
   - Move evasion check before damage calculation
   - On miss: only defender gains rage
   - On hit: both gain rage (if damage > 0)
   - Always clamp rage with Math.min(rageMax, rage + gain)

2. **Knockback Fix** (CombatScene.js, findKnockbackPosition):
   - Fix direction calculation based on unit side
   - LEFT units push toward column 9 (back)
   - RIGHT units push toward column 0 (back)
   - Handle occupied positions gracefully

### Phase 3: Skill Implementation (Requirements 4, 6, 7, 10)

1. **Mosquito Lifesteal Enhancement**:
   - Update skillId to mosquito_drain_v2
   - Implement max HP increase (15% of damage dealt)
   - Verify disease spread to adjacent enemies

2. **Leopard Buff**:
   - Update skill effect to award 5 gold per kill
   - Implement extra attack on kill
   - Update skill description with new gold value

3. **Fox Gold Reward**:
   - Verify flame_combo_v2 implementation
   - Ensure gold is awarded for each kill
   - Test multi-kill scenarios

4. **Skill Completeness Audit**:
   - List all skill effects in skills.csv
   - Verify each has a handler in applySkillEffect()
   - Implement missing handlers or mark as TODO

### Phase 4: Testing & Validation (Requirements 11, 13)

1. **Fix rageOverflow.test.js**:
   - Update test expectations to match new rage logic
   - Verify "should not gain rage when attack misses (attacker)" passes

2. **Add Property-Based Tests**:
   - Emoji uniqueness property
   - Rage gain properties (hit vs miss)
   - Knockback positioning properties
   - Skill completeness properties

3. **Stat Scaling Implementation**:
   - Define scaling formulas per tier/role
   - Implement in level-up logic
   - Test consistency across same tier/role units

## Success Criteria

### Data Quality
- ✅ Zero duplicate emojis across all 120 units
- ✅ Zero geometric terms in skill descriptions
- ✅ All skills have numeric values for scaling effects
- ✅ Exactly 120 units with correct distribution (6×5×4)

### Combat Correctness
- ✅ rageOverflow.test.js passes all tests
- ✅ Attacker does not gain rage on miss
- ✅ Defender gains rage on miss (clamped to rageMax)
- ✅ Knockback pushes units toward their back line
- ✅ Mosquito lifesteal increases both current and max HP

### Game Balance
- ✅ Leopard awards 5 gold per kill and attacks again
- ✅ Fox awards 1 gold per kill with skill
- ✅ Wolf has assassin-appropriate skill
- ✅ All skills have complete implementations

### Testing
- ✅ All property-based tests pass (100+ iterations each)
- ✅ All unit tests pass
- ✅ verify_data.cjs reports no errors
- ✅ Integration tests cover multi-kill and knockback scenarios
