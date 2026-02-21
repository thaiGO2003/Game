# TASK BREAKDOWN - 4 NHIỆM VỤ

**Ngày**: 21/02/2026  
**Trạng thái**: Sẵn sàng thực hiện

---

## ✅ ĐÃ PHÂN TÍCH XONG

### Targeting System
- **File**: `CombatScene.js` (line 4080) và `PlanningScene.js`
- **Hàm**: `scoreTarget(attacker, target)`
- **Hành động**: Sửa logic scoring để match TARGETING_RULES.md

### Stats Display
- **File**: `LibraryModal.js` (line 296)
- **Vấn đề**: CSV không có `accuracy` và `evasion`
- **Hành động**: Tính toán dựa trên role (như encyclopedia)

### Layout
- **File**: `LibraryModal.js`
- **Kết luận**: Code layout đã đúng, có thể cần điều chỉnh nhỏ

### Preview Components
- **Hành động**: Tạo 2 file mới + integrate vào LibraryModal

---

## 📋 TASK 1: FIX TARGETING (Ưu tiên cao)

### File: `src/scenes/CombatScene.js` - Line 4080

**Sửa hàm `scoreTarget()`**:

```javascript
scoreTarget(attacker, target) {
  const myRow = attacker.row;
  const myCol = attacker.col;
  const targetRow = target.row;
  const targetCol = target.col;
  
  const colDist = Math.abs(targetCol - myCol);
  const rowDist = Math.abs(targetRow - myRow);
  const sameRow = targetRow === myRow ? 0 : 1;
  const totalDist = colDist + rowDist;
  const hpRatio = Math.round((target.hp / target.maxHp) * 1000);
  const hpRaw = target.hp;
  
  // CẬN CHIẾN: Ưu tiên CỘT
  if (attacker.range <= 1) {
    if (attacker.classType === "ASSASSIN") {
      // Cột XA NHẤT
      const farthestCol = attacker.side === "LEFT" ? -targetCol : targetCol;
      return [farthestCol, sameRow, rowDist, totalDist, hpRatio, hpRaw];
    } else {
      // Tank/Fighter: Cột GẦN NHẤT
      return [colDist, sameRow, rowDist, totalDist, hpRatio, hpRaw];
    }
  }
  
  // TẦM XA: Ưu tiên HÀNG
  return [sameRow, rowDist, colDist, totalDist, hpRatio, hpRaw];
}
```

**Copy sang PlanningScene.js** nếu có hàm tương tự

---

## 📋 TASK 2: FIX STATS DISPLAY

### File: `src/ui/LibraryModal.js` - Line 296

**Vấn đề**: CSV không có accuracy/evasion

**Giải pháp**: Tính toán như trong encyclopedia


**Thêm helper function**:

```javascript
function calculateAccuracy(classType) {
  const map = {
    TANKER: 85, FIGHTER: 95, ASSASSIN: 105,
    ARCHER: 110, MAGE: 100, SUPPORT: 90
  };
  return map[classType] || 100;
}

function calculateEvasion(stats) {
  // Dựa trên speed (có thể dùng atk hoặc range làm proxy)
  const speed = stats.atk || 50;
  return Math.min(35, Math.max(5, Math.floor(speed / 10)));
}
```

**Sửa trong `renderUnitDetail()`**:

```javascript
const accuracy = calculateAccuracy(unit.classType);
const evasion = calculateEvasion(stats);

const desc = [
  `Tộc: ${getTribeLabelVi(unit.tribe)}   Nghề: ${getClassLabelVi(unit.classType)}`,
  `HP: ${toNumber(stats.hp, 0)}   ATK: ${toNumber(stats.atk, 0)}   DEF: ${toNumber(stats.def, 0)}`,
  `MATK: ${toNumber(stats.matk, 0)}   MDEF: ${toNumber(stats.mdef, 0)}`,
  `Chính xác: ${accuracy}%   Né tránh: ${evasion}%`,
  `Tầm đánh: ${range} ô   Nộ: ${toNumber(stats.rageMax, 0)}`
].join("\n");
```

---

## 📋 TASK 3: CHECK LAYOUT (Nếu cần)

**Hành động**: Chạy game và kiểm tra visual

Nếu vẫn lệch, điều chỉnh:
- Tab positions (line 133-134)
- Search box (line 136)
- Close button (line 119)

---

## 📋 TASK 4: CREATE PREVIEW COMPONENTS

### 4.1: Tạo `src/ui/AttackPreview.js`

```javascript
export class AttackPreview {
  constructor(scene, x, y, width, height, unit) {
    this.scene = scene;
    this.unit = unit;
    this.container = scene.add.container(x, y);
    this.build();
    this.startAnimation();
  }
  
  build() {
    // Title
    const title = this.scene.add.text(0, 0, "Đòn đánh thường", {
      fontSize: "14px", color: "#ffd580"
    });
    this.container.add(title);
    
    // Grid 3x4 mini
    // ... vẽ grid và units
  }
  
  startAnimation() {
    // Fade target highlight loop
  }
  
  destroy() {
    this.container.destroy();
  }
}
```

### 4.2: Tạo `src/ui/SkillPreview.js`

Tương tự AttackPreview

### 4.3: Integrate vào LibraryModal

Trong `renderUnitDetail()` sau skill description:

```javascript
y += skillDesc.height + 16;

const previewW = (this.layout.viewportW - 48) / 2;
const previewH = 200;

this.attackPreview = new AttackPreview(
  this.scene, 16, y, previewW, previewH, unit
);
this.skillPreview = new SkillPreview(
  this.scene, 16 + previewW + 16, y, previewW, previewH, unit, skill
);

this.contentContainer.add([
  this.attackPreview.container,
  this.skillPreview.container
]);

y += previewH + 16;
```

---

## ✅ CHECKLIST

- [ ] Task 1: Sửa scoreTarget() trong CombatScene.js
- [ ] Task 1: Sửa scoreTarget() trong PlanningScene.js
- [ ] Task 2: Thêm calculateAccuracy/Evasion
- [ ] Task 2: Sửa renderUnitDetail()
- [ ] Task 3: Check layout visual
- [ ] Task 4: Tạo AttackPreview.js
- [ ] Task 4: Tạo SkillPreview.js
- [ ] Task 4: Integrate previews

---

**Bắt đầu**: Task 1 - Targeting
