# KẾ HOẠCH THỰC HIỆN CHI TIẾT - TARGETING & LIBRARY UI

**Ngày**: 21/02/2026  
**Trạng thái**: Đã phân tích code hiện tại, sẵn sàng thực hiện

---

## 📊 PHÂN TÍCH CODE HIỆN TẠI

### ✅ Đã tìm thấy hàm targeting:

**File**: `src/scenes/CombatScene.js` và `src/scenes/PlanningScene.js`

**Hàm hiện tại**:
- `selectTarget(attacker, options)` - Line 4044 (CombatScene), Line 7125 (PlanningScene)
- `compareTargets(attacker, a, b)` - Line 4071
- `scoreTarget(attacker, target)` - Line 4080

**Logic hiện tại**:
```javascript
// scoreTarget trả về mảng điểm số để so sánh
// ASSASSIN: [sameRow, farthestColScore, lineDist, hpRatio, hpRaw]
// ARCHER/MAGE: [sameRow, lineDist, frontlineDist, hpRatio, hpRaw]
// TANK/FIGHTER: [frontlineDist, forwardDist, lateralDist, hpRatio, hpRaw]
```

**Vấn đề**: Logic hiện tại KHÔNG khớp với yêu cầu mới trong TARGETING_RULES.md

---

## 🎯 NHIỆM VỤ 1: REFACTOR TARGETING SYSTEM

### Chiến lược:
**KHÔNG tạo file mới**, sửa trực tiếp hàm `scoreTarget()` trong CombatScene.js và PlanningScene.js

### Chi tiết thực hiện:

#### Bước 1.1: Sửa `scoreTarget()` trong CombatScene.js
**Vị trí**: Line 4080

**Logic mới**:
```javascript
scoreTarget(attacker, target) {
  const myRow = attacker.row;
  const myCol = attacker.col;
  const targetRow = target.row;
  const targetCol = target.col;
  
  // Khoảng cách cột (cho cận chiến)
  const colDist = Math.abs(targetCol - myCol);
  
  // Khoảng cách hàng (cho tầm xa)
  const rowDist = Math.abs(targetRow - myRow);
  
  // Cùng hàng?
  const sameRow = targetRow === myRow ? 0 : 1;
  
  // Khoảng cách Manhattan (tổng)
  const totalDist = colDist + rowDist;
  
  // HP tiebreaker
  const hpRatio = Math.round((target.hp / target.maxHp) * 1000);
  const hpRaw = target.hp;
  
  // === THUẬT TOÁN 1: CẬN CHIẾN (Ưu tiên CỘT) ===
  if (attacker.range <= 1) {
    if (attacker.classType === "ASSASSIN") {
      // Sát thủ: Cột XA NHẤT → Cùng hàng → Lên trên → Xuống dưới
      const farthestCol = attacker.side === "LEFT" ? -targetCol : targetCol;
      return [farthestCol, sameRow, rowDist, totalDist, hpRatio, hpRaw];
    } else {
      // Tank/Fighter: Cột GẦN NHẤT → Cùng hàng → Lên trên → Xuống dưới
      return [colDist, sameRow, rowDist, totalDist, hpRatio, hpRaw];
    }
  }
  
  // === THUẬT TOÁN 2: TẦM XA (Ưu tiên HÀNG) ===
  // Archer/Mage/Support: Cùng hàng → Lên/xuống → Gần nhất trong hàng
  return [sameRow, rowDist, colDist, totalDist, hpRatio, hpRaw];
}
```

**Giải thích**:
- Mảng điểm số được sắp xếp theo thứ tự ưu tiên (nhỏ hơn = ưu tiên cao hơn)
- Cận chiến: `[colDist, sameRow, rowDist, ...]` = Cột trước, hàng sau
- Tầm xa: `[sameRow, rowDist, colDist, ...]` = Hàng trước, cột sau
- Assassin đặc biệt: Cột xa nhất (dấu âm để đảo ngược)

#### Bước 1.2: Sửa `scoreTarget()` trong PlanningScene.js
**Vị trí**: Tìm hàm tương tự (nếu có)

**Hành động**: Copy logic từ CombatScene.js

#### Bước 1.3: Test targeting
- [ ] Test Tank đánh cột gần nhất
- [ ] Test Fighter đánh cột gần nhất
- [ ] Test Assassin đánh cột xa nhất
- [ ] Test Archer đánh cùng hàng trước
- [ ] Test Mage đánh cùng hàng trước
- [ ] Test Support đánh cùng hàng trước

---

## 🎨 NHIỆM VỤ 2: FIX LIBRARY MODAL LAYOUT

### Vấn đề phát hiện trong LibraryModal.js:

**KHÔNG CÓ VẤN ĐỀ LỚN** - Code layout đã khá tốt!

**Các điểm cần kiểm tra**:
1. Tabs position: Line 133-134
   - `unitTab`: x = modalX - modalW/2 + 24
   - `recipeTab`: x = modalX - modalW/2 + 214
   - Gap = 190px (180 width + 10 gap) ✅

2. Search box: Line 136
   - x = modalX - modalW/2 + 416 ✅

3. Close button: Line 119
   - x = modalX + modalW/2 - 88 ✅

**Kết luận**: Layout code là ĐÚNG. Vấn đề có thể do:
- CSS/styling runtime
- Responsive breakpoint
- Font rendering

**Hành động**: Kiểm tra visual trong game, nếu vẫn lệch thì điều chỉnh số pixel

---

## 🐛 NHIỆM VỤ 3: FIX STATS HIỂN THỊ ???

### Phân tích `renderUnitDetail()` - Line 296:

**Code hiện tại**:
```javascript
const stats = unit.stats ?? {};
const range = toNumber(stats.range, 1);

const desc = [
  `Tộc: ${getTribeLabelVi(unit.tribe)}   Nghề: ${getClassLabelVi(unit.classType)}`,
  `HP: ${toNumber(stats.hp, 0)}   ATK: ${toNumber(stats.atk, 0)}   DEF: ${toNumber(stats.def, 0)}`,
  `MATK: ${toNumber(stats.matk, 0)}   MDEF: ${toNumber(stats.mdef, 0)}`,
  `Tầm đánh: ${range} ô (${range >= 2 ? "Đánh xa" : "Cận chiến"})   Nộ tối đa: ${toNumber(stats.rageMax, 0)}`
].join("\n");
```

**Vấn đề**: `unit.stats` có thể KHÔNG TỒN TẠI hoặc có tên field khác!

**Giải pháp**: Kiểm tra cấu trúc data thực tế trong `unitCatalog.js`

**Hành động**:
1. Đọc `src/data/unitCatalog.js` để xem cấu trúc unit
2. Kiểm tra xem stats nằm ở đâu: `unit.stats` hay `unit.baseStats` hay trực tiếp `unit.hp`?
3. Sửa mapping cho đúng

---

## 🎮 NHIỆM VỤ 4: THÊM ATTACK PREVIEW

### Chiến lược:
Tạo 2 component nhỏ để preview targeting pattern

### Bước 4.1: Tạo `src/ui/AttackPreview.js`

**Chức năng**:
- Hiển thị grid 3x4 nhỏ (chiến trường mini)
- Đặt unit ở vị trí mẫu
- Highlight mục tiêu theo thuật toán targeting
- Animation loop (fade in/out target)

**Cấu trúc**:
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
    // Vẽ grid 3x4
    // Đặt unit icon
    // Đặt enemy icons mẫu
    // Highlight target
  }
  
  startAnimation() {
    // Loop: fade target highlight
  }
  
  destroy() {
    this.container.destroy();
  }
}
```

### Bước 4.2: Tạo `src/ui/SkillPreview.js`

**Chức năng**: Tương tự AttackPreview nhưng hiển thị skill targeting

**Cấu trúc**: Giống AttackPreview

### Bước 4.3: Integrate vào LibraryModal

**Vị trí**: Trong `renderUnitDetail()` sau phần skill description

**Code**:
```javascript
// Sau skillDesc
y += skillDesc.height + 16;

const previewTitle = this.scene.add.text(16, y, "🎯 PREVIEW TARGETING:", {
  fontFamily: UI_FONT,
  fontSize: "15px",
  color: "#ffd580",
  fontStyle: "bold"
});
this.contentContainer.add(previewTitle);
y += 28;

// Tạo 2 preview side-by-side
const previewW = (this.layout.viewportW - 48) / 2;
const previewH = 200;

this.attackPreview = new AttackPreview(
  this.scene, 
  16, 
  y, 
  previewW, 
  previewH, 
  unit
);
this.contentContainer.add(this.attackPreview.container);

this.skillPreview = new SkillPreview(
  this.scene, 
  16 + previewW + 16, 
  y, 
  previewW, 
  previewH, 
  unit, 
  skill
);
this.contentContainer.add(this.skillPreview.container);

y += previewH + 16;
```

---

## 📝 THỨ TỰ THỰC HIỆN CUỐI CÙNG

### Phase 1: Targeting (Ưu tiên cao nhất)
1. ✅ Đọc và phân tích code (DONE)
2. ⏳ Sửa `scoreTarget()` trong CombatScene.js
3. ⏳ Sửa `scoreTarget()` trong PlanningScene.js (nếu cần)
4. ⏳ Test targeting với từng role

### Phase 2: Fix Stats ???
5. ⏳ Đọc `unitCatalog.js` để hiểu cấu trúc data
6. ⏳ Sửa mapping trong `renderUnitDetail()`
7. ⏳ Test với nhiều units

### Phase 3: Layout (Nếu cần)
8. ⏳ Kiểm tra visual trong game
9. ⏳ Điều chỉnh pixel nếu cần

### Phase 4: Attack Preview
10. ⏳ Tạo `AttackPreview.js`
11. ⏳ Tạo `SkillPreview.js`
12. ⏳ Integrate vào LibraryModal
13. ⏳ Test animation loop

---

## ✅ CHECKLIST TỔNG

- [ ] **Task 1.1**: Sửa scoreTarget() trong CombatScene.js
- [ ] **Task 1.2**: Sửa scoreTarget() trong PlanningScene.js
- [ ] **Task 1.3**: Test targeting (6 roles)
- [ ] **Task 2.1**: Đọc unitCatalog.js
- [ ] **Task 2.2**: Fix stats mapping
- [ ] **Task 2.3**: Test stats display
- [ ] **Task 3.1**: Check layout visual
- [ ] **Task 3.2**: Adjust if needed
- [ ] **Task 4.1**: Create AttackPreview.js
- [ ] **Task 4.2**: Create SkillPreview.js
- [ ] **Task 4.3**: Integrate previews
- [ ] **Task 4.4**: Test animations

---

**Tổng thời gian ước tính**: 4-5 giờ

**Bắt đầu ngay**: Task 1.1 - Sửa scoreTarget()
