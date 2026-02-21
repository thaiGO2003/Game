# 🎯 TARGETING RULES - QUY TẮC TÌM MỤC TIÊU

**Version**: 2.0  
**Ngày**: 21/02/2026

---

## 📋 HAI THUẬT TOÁN KHÁC NHAU

### 🗡️ Thuật toán 1: CẬN CHIẾN (Ưu tiên CỘT)
**Áp dụng cho**: Đỡ đòn, Đấu sĩ, Sát thủ

**Nguyên tắc**: Ưu tiên cột gần nhất/xa nhất trước, sau đó mới xét hàng

```
1. Tìm CỘT GẦN NHẤT/XA NHẤT có địch
2. Trong cột đó:
   - Ưu tiên: Cùng hàng
   - Nếu không có: Lên trên (hàng 1, 2, 3, ...)
   - Nếu hết trên: Xuống dưới (hàng +1, +2, +3, ...)
3. Nếu cột đó không có địch → Chuyển sang cột tiếp theo
```

### 🏹 Thuật toán 2: TẦM XA (Ưu tiên HÀNG)
**Áp dụng cho**: Xạ thủ, Pháp sư, Hỗ trợ

**Nguyên tắc**: Ưu tiên hàng trước, sau đó mới xét cột

```
1. Ưu tiên: Cùng hàng → Chọn gần nhất trong tầm
2. Nếu không có cùng hàng:
   - Lên trên (hàng -1, -2, -3, ...) → Chọn gần nhất trong tầm
   - Nếu hết trên: Xuống dưới (hàng +1, +2, +3, ...) → Chọn gần nhất trong tầm
```

---

## 🗡️ CHI TIẾT CẬN CHIẾN

### 1. ĐỠ ĐÒN (TANKER) - Ưu tiên cột gần nhất

**Thuật toán:**
```
1. Tìm CỘT GẦN NHẤT có địch (khoảng cách nhỏ nhất)
2. Trong cột đó:
   a. Ưu tiên: Cùng hàng
   b. Nếu không có: Lên trên (hàng -1, -2, -3, ...)
   c. Nếu hết trên: Xuống dưới (hàng +1, +2, +3, ...)
3. Nếu cột đó không có địch → Chuyển sang cột gần thứ 2
```

**Ví dụ:**
```
Địch:  Cột 1  Cột 2  Cột 3  Cột 4
Hàng 1:  -      -      D      -
Hàng 2:  -      -      -      E
Hàng 3:  -      C      -      F

Tank ở hàng 2, cột 1

Thứ tự ưu tiên:
1. Cột gần nhất có địch: Cột 2 (khoảng cách = 1)
   - Cùng hàng 2: Không có
   - Lên hàng 1: Không có
   - Xuống hàng 3: C ✓ → CHỌN C

2. Nếu không có C:
   - Cột gần thứ 2: Cột 3 (khoảng cách = 2)
     - Cùng hàng 2: Không có
     - Lên hàng 1: D ✓ → CHỌN D
     
3. Nếu không có D:
   - Cột gần thứ 3: Cột 4 (khoảng cách = 3)
     - Cùng hàng 2: E ✓ → CHỌN E
```

---

### 2. ĐẤU SĨ (FIGHTER) - Ưu tiên cột gần nhất

**Thuật toán:**
```
GIỐNG ĐỠ ĐÒN

1. Tìm CỘT GẦN NHẤT có địch
2. Trong cột đó: Cùng hàng → Lên trên → Xuống dưới
3. Nếu không có → Cột gần thứ 2
```

---

### 3. SÁT THỦ (ASSASSIN) - Ưu tiên cột xa nhất

**Thuật toán:**
```
1. Tìm CỘT XA NHẤT có địch (khoảng cách lớn nhất = carry)
2. Trong cột đó:
   a. Ưu tiên: Cùng hàng
   b. Nếu không có: Lên trên (hàng -1, -2, -3, ...)
   c. Nếu hết trên: Xuống dưới (hàng +1, +2, +3, ...)
3. Nếu cột đó không có địch → Chuyển sang cột xa thứ 2
```

**Ví dụ:**
```
Địch:  Cột 1  Cột 2  Cột 3  Cột 4
Hàng 1:  A      -      D      -
Hàng 2:  -      -      -      -
Hàng 3:  B      C      -      F

Assassin ở hàng 2, cột 1

Thứ tự ưu tiên:
1. Cột xa nhất có địch: Cột 4 (khoảng cách = 3)
   - Cùng hàng 2: Không có
   - Lên hàng 1: Không có
   - Xuống hàng 3: F ✓ → CHỌN F (carry hậu phương)

2. Nếu không có F:
   - Cột xa thứ 2: Cột 3 (khoảng cách = 2)
     - Cùng hàng 2: Không có
     - Lên hàng 1: D ✓ → CHỌN D
```

---

## 🏹 CHI TIẾT TẦM XA

### 4. XẠ THỦ (ARCHER) - Ưu tiên hàng

**Thuật toán:**
```
1. Ưu tiên: Cùng hàng → Chọn GẦN NHẤT trong tầm
2. Nếu không có cùng hàng:
   a. Lên trên (hàng -1, -2, -3, ...) → Chọn GẦN NHẤT trong tầm
   b. Nếu hết trên: Xuống dưới (hàng +1, +2, +3, ...) → Chọn GẦN NHẤT trong tầm
```

**Ví dụ:**
```
Địch:  Cột 1  Cột 2  Cột 3  Cột 4  Cột 5
Hàng 1:  A      -      D      -      G
Hàng 2:  -      -      -      -      -
Hàng 3:  B      C      -      F      I

Archer ở hàng 2, cột 1, tầm 4

Thứ tự ưu tiên:
1. Cùng hàng 2: Không có

2. Lên trên:
   - Hàng 1: A (cột 1, trong tầm), D (cột 3, trong tầm)
   → Chọn A (gần nhất) ✓

3. Nếu không có A:
   - Xuống dưới:
   - Hàng 3: B (cột 1, trong tầm), C (cột 2, trong tầm), F (cột 4, trong tầm)
   → Chọn B (gần nhất) ✓
```

---

### 5. PHÁP SƯ (MAGE) - Ưu tiên hàng, không bao giờ hụt

**Thuật toán:**
```
GIỐNG XẠ THỦ

1. Ưu tiên: Cùng hàng → Chọn GẦN NHẤT trong tầm
2. Nếu không có: Lên trên → Chọn GẦN NHẤT trong tầm
3. Nếu hết trên: Xuống dưới → Chọn GẦN NHẤT trong tầm
```

**Đặc biệt**: Phép thuật **KHÔNG BAO GIỜ HỤT** (100% accuracy)

---

### 6. HỖ TRỢ (SUPPORT) - Ưu tiên hàng

**Thuật toán (Tấn công):**
```
GIỐNG XẠ THỦ

1. Ưu tiên: Cùng hàng → Chọn GẦN NHẤT trong tầm
2. Nếu không có: Lên trên → Chọn GẦN NHẤT trong tầm
3. Nếu hết trên: Xuống dưới → Chọn GẦN NHẤT trong tầm
```

**Thuật toán (Hỗ trợ):**
```
Tùy skill:
- Hồi máu: Chọn đồng minh HP thấp nhất
- Buff: Chọn đồng minh theo skill
```

---

## 💻 IMPLEMENTATION (JavaScript)

### Thuật toán 1: Cận chiến (Ưu tiên cột)

```javascript
/**
 * Tìm mục tiêu cho cận chiến (Tank, Fighter, Assassin)
 * @param {Object} attacker - Unit đang tấn công
 * @param {Array} enemies - Danh sách địch
 * @param {String} priority - 'closest' hoặc 'farthest'
 * @returns {Object|null} - Mục tiêu
 */
function findTargetMelee(attacker, enemies, priority = 'closest') {
  const myRow = attacker.row;
  const myCol = attacker.col;
  
  if (enemies.length === 0) return null;
  
  // Nhóm địch theo cột
  const columnGroups = {};
  enemies.forEach(enemy => {
    if (!columnGroups[enemy.col]) {
      columnGroups[enemy.col] = [];
    }
    columnGroups[enemy.col].push(enemy);
  });
  
  // Sắp xếp các cột theo khoảng cách
  const columns = Object.keys(columnGroups).map(col => parseInt(col));
  columns.sort((a, b) => {
    const distA = Math.abs(a - myCol);
    const distB = Math.abs(b - myCol);
    if (priority === 'closest') {
      return distA - distB; // Gần nhất trước
    } else {
      return distB - distA; // Xa nhất trước
    }
  });
  
  // Duyệt qua từng cột theo thứ tự ưu tiên
  for (const col of columns) {
    const enemiesInCol = columnGroups[col];
    
    // Trong cột này, tìm theo thứ tự: Cùng hàng → Lên trên → Xuống dưới
    
    // 1. Cùng hàng
    const sameRow = enemiesInCol.find(e => e.row === myRow);
    if (sameRow) return sameRow;
    
    // 2. Lên trên (hàng nhỏ hơn)
    const above = enemiesInCol
      .filter(e => e.row < myRow)
      .sort((a, b) => b.row - a.row); // Gần nhất trước (hàng lớn nhất)
    if (above.length > 0) return above[0];
    
    // 3. Xuống dưới (hàng lớn hơn)
    const below = enemiesInCol
      .filter(e => e.row > myRow)
      .sort((a, b) => a.row - b.row); // Gần nhất trước (hàng nhỏ nhất)
    if (below.length > 0) return below[0];
  }
  
  return null;
}
```

### Thuật toán 2: Tầm xa (Ưu tiên hàng)

```javascript
/**
 * Tìm mục tiêu cho tầm xa (Archer, Mage, Support)
 * @param {Object} attacker - Unit đang tấn công
 * @param {Array} enemies - Danh sách địch
 * @param {Number} maxRange - Tầm tối đa
 * @returns {Object|null} - Mục tiêu
 */
function findTargetRanged(attacker, enemies, maxRange) {
  const myRow = attacker.row;
  const myCol = attacker.col;
  
  // Lọc địch trong tầm
  const inRange = enemies.filter(e => 
    Math.abs(e.col - myCol) <= maxRange
  );
  
  if (inRange.length === 0) return null;
  
  // 1. Ưu tiên cùng hàng → Chọn gần nhất
  const sameRow = inRange.filter(e => e.row === myRow);
  if (sameRow.length > 0) {
    return sameRow.reduce((closest, enemy) => {
      const distCurrent = Math.abs(enemy.col - myCol);
      const distClosest = Math.abs(closest.col - myCol);
      return distCurrent < distClosest ? enemy : closest;
    });
  }
  
  // 2. Lên trên (hàng nhỏ hơn)
  const above = inRange.filter(e => e.row < myRow);
  if (above.length > 0) {
    // Nhóm theo hàng
    const rowGroups = {};
    above.forEach(e => {
      if (!rowGroups[e.row]) rowGroups[e.row] = [];
      rowGroups[e.row].push(e);
    });
    
    // Lấy hàng gần nhất (lớn nhất)
    const rows = Object.keys(rowGroups).map(r => parseInt(r)).sort((a, b) => b - a);
    const closestRow = rowGroups[rows[0]];
    
    // Trong hàng đó, chọn gần nhất
    return closestRow.reduce((closest, enemy) => {
      const distCurrent = Math.abs(enemy.col - myCol);
      const distClosest = Math.abs(closest.col - myCol);
      return distCurrent < distClosest ? enemy : closest;
    });
  }
  
  // 3. Xuống dưới (hàng lớn hơn)
  const below = inRange.filter(e => e.row > myRow);
  if (below.length > 0) {
    // Nhóm theo hàng
    const rowGroups = {};
    below.forEach(e => {
      if (!rowGroups[e.row]) rowGroups[e.row] = [];
      rowGroups[e.row].push(e);
    });
    
    // Lấy hàng gần nhất (nhỏ nhất)
    const rows = Object.keys(rowGroups).map(r => parseInt(r)).sort((a, b) => a - b);
    const closestRow = rowGroups[rows[0]];
    
    // Trong hàng đó, chọn gần nhất
    return closestRow.reduce((closest, enemy) => {
      const distCurrent = Math.abs(enemy.col - myCol);
      const distClosest = Math.abs(closest.col - myCol);
      return distCurrent < distClosest ? enemy : closest;
    });
  }
  
  return null;
}
```

### Sử dụng:

```javascript
// Đỡ đòn (Tanker) - Cột gần nhất
const target = findTargetMelee(tanker, enemies, 'closest');

// Đấu sĩ (Fighter) - Cột gần nhất
const target = findTargetMelee(fighter, enemies, 'closest');

// Sát thủ (Assassin) - Cột xa nhất
const target = findTargetMelee(assassin, enemies, 'farthest');

// Xạ thủ (Archer) - Hàng, gần nhất
const target = findTargetRanged(archer, enemies, archer.range);

// Pháp sư (Mage) - Hàng, gần nhất, không bao giờ hụt
const target = findTargetRanged(mage, enemies, mage.range);

// Hỗ trợ (Support) - Hàng, gần nhất
const target = findTargetRanged(support, enemies, support.range);
```

---

## 📊 BẢNG TỔNG HỢP

| Vai trò | Thuật toán | Ưu tiên chính | Thứ tự tìm kiếm | Đặc biệt |
|---------|-----------|---------------|-----------------|----------|
| Đỡ đòn | Cận chiến | Cột gần nhất | Cột gần → Cùng hàng → Lên trên → Xuống dưới | Có thể hụt |
| Đấu sĩ | Cận chiến | Cột gần nhất | Cột gần → Cùng hàng → Lên trên → Xuống dưới | Có thể hụt |
| Sát thủ | Cận chiến | Cột xa nhất | Cột xa → Cùng hàng → Lên trên → Xuống dưới | Có thể hụt, ưu tiên carry |
| Xạ thủ | Tầm xa | Hàng | Cùng hàng → Lên trên → Xuống dưới (chọn gần nhất) | Có thể hụt, trong tầm |
| Pháp sư | Tầm xa | Hàng | Cùng hàng → Lên trên → Xuống dưới (chọn gần nhất) | **Không bao giờ hụt**, trong tầm |
| Hỗ trợ | Tầm xa | Hàng | Cùng hàng → Lên trên → Xuống dưới (chọn gần nhất) | Có thể hụt, hoặc buff đồng minh |

---

## 🎯 TEST CASES

### Test 1: Tank (Cột gần nhất)
```javascript
const tank = { row: 2, col: 1 };
const enemies = [
  { row: 1, col: 3, name: 'D' },
  { row: 2, col: 4, name: 'E' },
  { row: 3, col: 2, name: 'C' },
  { row: 3, col: 4, name: 'F' }
];

const target = findTargetMelee(tank, enemies, 'closest');
// Expected: C (cột 2 gần nhất, hàng 3)
```

### Test 2: Assassin (Cột xa nhất)
```javascript
const assassin = { row: 2, col: 1 };
const enemies = [
  { row: 1, col: 1, name: 'A' },
  { row: 1, col: 3, name: 'D' },
  { row: 3, col: 2, name: 'C' },
  { row: 3, col: 4, name: 'F' }
];

const target = findTargetMelee(assassin, enemies, 'farthest');
// Expected: F (cột 4 xa nhất, hàng 3)
```

### Test 3: Archer (Hàng, gần nhất)
```javascript
const archer = { row: 2, col: 1, range: 4 };
const enemies = [
  { row: 1, col: 1, name: 'A' },
  { row: 1, col: 3, name: 'D' },
  { row: 3, col: 1, name: 'B' },
  { row: 3, col: 2, name: 'C' }
];

const target = findTargetRanged(archer, enemies, archer.range);
// Expected: A (hàng 1 trên, cột 1 gần nhất)
```

---

## ✅ CHECKLIST

- [ ] Implement `findTargetMelee()` cho cận chiến
- [ ] Implement `findTargetRanged()` cho tầm xa
- [ ] Test Tank (cột gần nhất)
- [ ] Test Fighter (cột gần nhất)
- [ ] Test Assassin (cột xa nhất)
- [ ] Test Archer (hàng, gần nhất)
- [ ] Test Mage (hàng, không hụt)
- [ ] Test Support (hàng, buff)
- [ ] Integrate vào combat system
- [ ] Visual feedback

---

## 🎯 MỤC TIÊU CHO KỸ NĂNG (SKILL)

### Nguyên tắc chung:

**Kỹ năng sử dụng CÙNG MỤC TIÊU với đòn đánh thường**

Trừ khi skill có chỉ định đặc biệt:

#### Các trường hợp đặc biệt:

1. **Đánh yếu nhất** (Lowest HP)
   ```javascript
   // Ví dụ: Skill hồi máu, skill execute
   target = findLowestHPEnemy(enemies);
   ```

2. **Đánh vị trí cụ thể**
   ```javascript
   // Ví dụ: Assassin lao sau lưng (ASSASSIN_BACK)
   target = findBacklineEnemy(enemies);
   
   // Ví dụ: Đánh hàng sau (BACK_ROW)
   target = findBackRowEnemy(enemies);
   ```

3. **Đánh ngẫu nhiên** (Random)
   ```javascript
   // Ví dụ: Skill bắn kim độc ngẫu nhiên
   targets = selectRandomEnemies(enemies, count);
   ```

4. **Đánh toàn bộ** (AOE)
   ```javascript
   // Ví dụ: Skill AOE, đánh cột, đánh hàng
   targets = selectByPattern(enemies, pattern);
   // pattern: 'column', 'row', 'cross', 'area', 'all'
   ```

5. **Đánh đồng minh** (Ally targeting)
   ```javascript
   // Ví dụ: Skill buff, hồi máu
   target = findLowestHPAlly(allies);
   target = findStrongestAlly(allies);
   ```

### Implementation:

```javascript
/**
 * Tìm mục tiêu cho skill
 * @param {Object} attacker - Unit đang dùng skill
 * @param {Array} enemies - Danh sách địch
 * @param {Array} allies - Danh sách đồng minh
 * @param {Object} skill - Thông tin skill
 * @returns {Object|Array} - Mục tiêu hoặc danh sách mục tiêu
 */
function findSkillTarget(attacker, enemies, allies, skill) {
  // Mặc định: Dùng mục tiêu của đòn đánh thường
  if (!skill.targetType || skill.targetType === 'default') {
    if (attacker.range === 1) {
      // Cận chiến
      const priority = attacker.class === 'ASSASSIN' ? 'farthest' : 'closest';
      return findTargetMelee(attacker, enemies, priority);
    } else {
      // Tầm xa
      return findTargetRanged(attacker, enemies, attacker.range);
    }
  }
  
  // Các trường hợp đặc biệt
  switch (skill.targetType) {
    case 'lowest_hp':
      return enemies.reduce((lowest, e) => 
        e.hp < lowest.hp ? e : lowest
      );
      
    case 'highest_hp':
      return enemies.reduce((highest, e) => 
        e.hp > highest.hp ? e : highest
      );
      
    case 'backline':
      // Địch ở hàng sau (row lớn nhất)
      const maxRow = Math.max(...enemies.map(e => e.row));
      return enemies.filter(e => e.row === maxRow);
      
    case 'random':
      const count = skill.targetCount || 1;
      return selectRandom(enemies, count);
      
    case 'ally_lowest_hp':
      return allies.reduce((lowest, a) => 
        a.hp < lowest.hp ? a : lowest
      );
      
    case 'ally_strongest':
      return allies.reduce((strongest, a) => 
        a.atk > strongest.atk ? a : strongest
      );
      
    case 'all':
      return enemies;
      
    case 'column':
      // Tất cả địch trong cột của mục tiêu chính
      const mainTarget = findTargetMelee(attacker, enemies, 'closest');
      return enemies.filter(e => e.col === mainTarget.col);
      
    case 'row':
      // Tất cả địch trong hàng của mục tiêu chính
      const mainTarget2 = findTargetMelee(attacker, enemies, 'closest');
      return enemies.filter(e => e.row === mainTarget2.row);
      
    case 'cross':
      // Hình thập tự quanh mục tiêu
      const center = findTargetMelee(attacker, enemies, 'closest');
      return enemies.filter(e => 
        (e.row === center.row && Math.abs(e.col - center.col) <= 1) ||
        (e.col === center.col && Math.abs(e.row - center.row) <= 1)
      );
      
    default:
      // Mặc định: Dùng targeting thường
      return findTargetMelee(attacker, enemies, 'closest');
  }
}

function selectRandom(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

### Ví dụ trong skills.csv:

```csv
id,name,targetType,targetCount,...
void_execute,Tất Sát Hư Không,default,1,...          # Dùng targeting thường
healing_song,Khúc Ca Tái Sinh,ally_lowest_hp,2,...   # Hồi 2 đồng minh yếu nhất
poison_dart,Kim Độc,random,3,...                      # Bắn 3 mục tiêu ngẫu nhiên
ice_column,Cột Băng,column,all,...                    # Đánh toàn bộ cột
cross_arrow,Tên Thập Tự,cross,5,...                   # Đánh hình thập tự
```

---

**Tóm tắt**:
- **Đòn đánh thường**: Dùng thuật toán cận chiến hoặc tầm xa
- **Kỹ năng**: Mặc định dùng cùng mục tiêu với đòn thường
- **Kỹ năng đặc biệt**: Có thể chỉ định mục tiêu riêng (yếu nhất, ngẫu nhiên, AOE, buff đồng minh, ...)
- **Cận chiến**: Ưu tiên CỘT (gần/xa) → Trong cột: Cùng hàng → Lên → Xuống
- **Tầm xa**: Ưu tiên HÀNG → Cùng hàng → Lên → Xuống (chọn gần nhất trong hàng)
