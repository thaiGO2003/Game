# KẾ HOẠCH ĐIỀU CHỈNH TARGETING RULES

**Mục tiêu**: Cập nhật định nghĩa targeting cho từng vai trò theo quy tắc mới

---

## 📋 QUY TẮC MỚI TỪ USER

### 1. ĐỠ ĐÒN (TANKER) & ĐẤU SĨ (FIGHTER)
**Ưu tiên: Địch gần nhất cùng hàng**

**Thuật toán tìm mục tiêu:**
```
1. Tìm địch cùng hàng → Chọn gần nhất
2. Nếu không có cùng hàng:
   a. Xét cột lên 1 ô (hàng trên) → Chọn gần nhất
   b. Nếu không có → Xét cột xuống 1 ô (hàng dưới) → Chọn gần nhất
   c. Nếu không có → Xét cột lên 2 ô
   d. Nếu không có → Xét cột xuống 2 ô
3. Nếu cột gần nhất không có con nào:
   → Chuyển sang cột thứ 2
   → Lặp lại thuật toán (tìm cùng hàng, lên 1, xuống 1, lên 2, xuống 2)
```

**Ví dụ trực quan:**
```
Địch:  [ ][ ][ ]     Cột 1  Cột 2  Cột 3
Hàng 1: A  -  D
Hàng 2: -  -  E
Hàng 3: B  C  F

Mình: [Tank] ở hàng 2

Thứ tự ưu tiên:
1. Cùng hàng (hàng 2): E (cột 3)
2. Nếu không có E:
   - Lên 1 (hàng 1): A (cột 1 gần nhất) → D (cột 3)
   - Xuống 1 (hàng 3): B (cột 1 gần nhất) → C (cột 2) → F (cột 3)
   - Lên 2: Không có
   - Xuống 2: Không có
```

---

### 2. XẠ THỦ (ARCHER), PHÁP SƯ (MAGE), HỖ TRỢ (SUPPORT)
**Ưu tiên: Địch gần nhất cùng hàng**

**Thuật toán:**
```
1. Tìm địch cùng hàng trong tầm bắn
2. Chọn địch gần nhất (cột nhỏ nhất)
3. Nếu không có cùng hàng → Không đánh được (hoặc chuyển hàng)
```

**Đặc điểm:**
- **Pháp sư**: Đánh thường = sát thương phép → **Không bao giờ hụt**
- **Xạ thủ**: Đánh thường = sát thương vật lý → Có thể hụt
- **Hỗ trợ**: 
  - Đánh thường = sát thương vật lý → Có thể hụt
  - Skill thường dùng MATK để buff/debuff

**Ví dụ:**
```
Địch:  [ ][ ][ ]     Cột 1  Cột 2  Cột 3
Hàng 1: A  -  D
Hàng 2: -  B  E
Hàng 3: -  C  F

Mình: [Archer] ở hàng 2, tầm 4

Thứ tự ưu tiên:
1. Cùng hàng (hàng 2): B (cột 2 gần nhất) → E (cột 3)
2. Không xét hàng khác
```

---

### 3. SÁT THỦ (ASSASSIN)
**Ưu tiên: Địch xa nhất cùng hàng**

**Thuật toán:**
```
1. Tìm địch cùng hàng
2. Chọn địch xa nhất (cột lớn nhất) = Carry hậu phương
3. Lao vòng ra sau lưng mục tiêu
```

**Ví dụ:**
```
Địch:  [ ][ ][ ]     Cột 1  Cột 2  Cột 3
Hàng 1: A  -  D
Hàng 2: B  C  E
Hàng 3: -  -  F

Mình: [Assassin] ở hàng 2

Thứ tự ưu tiên:
1. Cùng hàng (hàng 2): E (cột 3 xa nhất) → C (cột 2) → B (cột 1)
2. Mục tiêu: E (carry hậu phương)
```

---

## 🔍 KIỂM TRA ĐỊNH NGHĨA HIỆN TẠI

### Trong unit_encyclopedia.md vừa tạo:

#### ✅ ĐÚNG:
1. **Đỡ đòn**: "Ưu tiên địch gần nhất cùng hàng" ✅
2. **Đấu sĩ**: "Ưu tiên địch gần nhất cùng hàng" ✅
3. **Sát thủ**: "Ưu tiên địch xa nhất cùng hàng (carry hậu phương)" ✅
4. **Xạ thủ**: "Ưu tiên địch gần nhất cùng hàng trong tầm" ✅
5. **Pháp sư**: "Ưu tiên địch gần nhất cùng hàng trong tầm" + "không bao giờ hụt" ✅
6. **Hỗ trợ**: "Ưu tiên địch gần nhất cùng hàng hoặc đồng minh yếu nhất" ✅

#### ⚠️ CẦN BỔ SUNG:
1. **Đỡ đòn & Đấu sĩ**: Chưa có chi tiết thuật toán "lên 1, xuống 1, lên 2, xuống 2"
2. **Xạ thủ, Pháp sư, Hỗ trợ**: Chưa nói rõ "không xét hàng khác"

---

## 📝 ĐIỀU CHỈNH CẦN THỰC HIỆN

### 1. Cập nhật mô tả trong encyclopedia

#### Đỡ đòn (Tanker):
```markdown
🎯 **Đánh thường**
- Thi triển: Cận chiến áp sát tiền tuyến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên: Địch gần nhất cùng hàng
  - Nếu không có cùng hàng: Xét lên 1 ô → xuống 1 ô → lên 2 ô → xuống 2 ô
  - Nếu cột gần nhất không có: Chuyển sang cột tiếp theo
- Công thức cơ bản: ATK và giáp mục tiêu
```

#### Đấu sĩ (Fighter):
```markdown
🎯 **Đánh thường**
- Thi triển: Xung phong cận chiến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên: Địch gần nhất cùng hàng
  - Nếu không có cùng hàng: Xét lên 1 ô → xuống 1 ô → lên 2 ô → xuống 2 ô
  - Nếu cột gần nhất không có: Chuyển sang cột tiếp theo
- Công thức cơ bản: ATK và giáp mục tiêu
```

#### Sát thủ (Assassin):
```markdown
🎯 **Đánh thường**
- Thi triển: Lao sau lưng mục tiêu
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên: Địch xa nhất cùng hàng (carry hậu phương)
  - Chỉ tấn công mục tiêu cùng hàng
  - Không xét hàng khác
- Công thức cơ bản: ATK và giáp mục tiêu
```

#### Xạ thủ (Archer):
```markdown
🎯 **Đánh thường**
- Thi triển: Bắn tên từ xa
- Tầm đánh: 4 ô
- Loại sát thương: Vật lý
- Ưu tiên: Địch gần nhất cùng hàng trong tầm
  - Chỉ bắn mục tiêu cùng hàng
  - Không xét hàng khác
- Công thức cơ bản: ATK và giáp mục tiêu
```

#### Pháp sư (Mage):
```markdown
🎯 **Đánh thường**
- Thi triển: Phép thuật từ xa
- Tầm đánh: 4 ô
- Loại sát thương: Phép thuật (không bao giờ hụt)
- Ưu tiên: Địch gần nhất cùng hàng trong tầm
  - Chỉ đánh mục tiêu cùng hàng
  - Không xét hàng khác
  - Phép thuật luôn trúng (100% accuracy)
- Công thức cơ bản: MATK và kháng phép mục tiêu
```

#### Hỗ trợ (Support):
```markdown
🎯 **Đánh thường**
- Thi triển: Hỗ trợ/Phép thuật từ xa
- Tầm đánh: 3 ô
- Loại sát thương: Vật lý (đánh thường) / Phép thuật (skill)
- Ưu tiên: 
  - Tấn công: Địch gần nhất cùng hàng (chỉ cùng hàng)
  - Hỗ trợ: Đồng minh yếu nhất hoặc theo skill
- Công thức cơ bản: ATK (đánh thường) / MATK (skill buff/debuff)
```

---

## 🎯 BƯỚC THỰC HIỆN

### Bước 1: Cập nhật script generate_encyclopedia.cjs
Sửa phần basic attack description cho từng class với mô tả chi tiết hơn

### Bước 2: Chạy lại script
```bash
node generate_encyclopedia.cjs
```

### Bước 3: Kiểm tra kết quả
Đọc file `unit_encyclopedia.md` và verify mô tả đã đúng

### Bước 4: Tạo file TARGETING_RULES.md
Document chi tiết thuật toán targeting để dev implement

---

## 📊 THUẬT TOÁN CHI TIẾT (Cho Dev)

### Hàm findTarget() cho Tanker/Fighter:

```javascript
function findTargetMeleeFrontline(myRow, myCol, enemies) {
  // 1. Tìm cùng hàng
  const sameRow = enemies.filter(e => e.row === myRow);
  if (sameRow.length > 0) {
    return findClosest(sameRow, myCol); // Gần nhất theo cột
  }
  
  // 2. Tìm theo thứ tự: lên 1, xuống 1, lên 2, xuống 2
  const searchOrder = [
    myRow - 1,  // Lên 1
    myRow + 1,  // Xuống 1
    myRow - 2,  // Lên 2
    myRow + 2   // Xuống 2
  ];
  
  for (const row of searchOrder) {
    const targets = enemies.filter(e => e.row === row);
    if (targets.length > 0) {
      return findClosest(targets, myCol);
    }
  }
  
  return null; // Không tìm thấy
}

function findClosest(targets, myCol) {
  return targets.reduce((closest, target) => {
    const distCurrent = Math.abs(target.col - myCol);
    const distClosest = Math.abs(closest.col - myCol);
    return distCurrent < distClosest ? target : closest;
  });
}
```

### Hàm findTarget() cho Assassin:

```javascript
function findTargetAssassin(myRow, enemies) {
  // Chỉ tìm cùng hàng
  const sameRow = enemies.filter(e => e.row === myRow);
  if (sameRow.length === 0) return null;
  
  // Chọn xa nhất (cột lớn nhất)
  return sameRow.reduce((farthest, target) => {
    return target.col > farthest.col ? target : farthest;
  });
}
```

### Hàm findTarget() cho Archer/Mage/Support:

```javascript
function findTargetRanged(myRow, myCol, range, enemies) {
  // Chỉ tìm cùng hàng và trong tầm
  const sameRow = enemies.filter(e => 
    e.row === myRow && 
    Math.abs(e.col - myCol) <= range
  );
  
  if (sameRow.length === 0) return null;
  
  // Chọn gần nhất
  return findClosest(sameRow, myCol);
}
```

---

## ✅ KẾT LUẬN

### Định nghĩa hiện tại:
- ✅ Cơ bản đã đúng
- ⚠️ Cần bổ sung chi tiết thuật toán

### Cần làm:
1. ✅ Cập nhật mô tả trong encyclopedia (chi tiết hơn)
2. ⏳ Tạo file TARGETING_RULES.md cho dev
3. ⏳ Implement thuật toán vào game code
4. ⏳ Test và verify

---

**Bạn muốn tôi:**
1. Cập nhật lại encyclopedia với mô tả chi tiết hơn?
2. Tạo file TARGETING_RULES.md cho dev?
3. Cả hai?
