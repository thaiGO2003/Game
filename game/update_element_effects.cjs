const fs = require('fs');
const path = require('path');

// Đọc file hiện tại
let content = fs.readFileSync(path.join(__dirname, 'ROLE_SKILL_ANALYSIS.md'), 'utf-8');

// Thay thế phần Thủy
const oldTide = /### 💧 Thủy \(TIDE\) - 22 unit[\s\S]*?---/;
const newTide = `### 💧 Thủy (TIDE) - 22 unit

**Hiệu ứng**: Giảm né tránh (Reduce Evasion)

**Mô tả**: Làm ướt mục tiêu, giảm khả năng né tránh

**Công thức tỷ lệ trúng đòn**: 
\`\`\`
Tỷ lệ hụt = 100 - Né tránh mục tiêu + (Chính xác người tấn công - 100)
\`\`\`

**Phạm vi chỉ số**:
- Chính xác: 80% - 125% (con nhỏ nhanh nhẹn có chính xác cao, con to chậm chạp thấp hơn)
- Né tránh: 5% - 35% (Sói, Hổ, Báo ~25-35%, Voi, Rắn, Rùa ~5-10%)

**Chi tiết theo sao**:
- ⭐ 1 sao: Giảm 15% né tránh (1 lượt)
- ⭐⭐ 2 sao: Giảm 25% né tránh (2 lượt)
- ⭐⭐⭐ 3 sao: Giảm 35% né tránh (2 lượt)

**Ví dụ áp dụng**:
\`\`\`
🦤 Bồ Nông Bom (Xạ thủ - Thủy) - Skill: Tên Thập Tự
⭐ 1 sao: Bắn hình thập tự, 25% cơ hội giảm 15% né tránh (1 lượt)
⭐⭐ 2 sao: Bắn hình thập tự, 40% cơ hội giảm 25% né tránh (2 lượt)
⭐⭐⭐ 3 sao: Bắn hình thập tự, 60% cơ hội giảm 35% né tránh (2 lượt)

Ví dụ tính toán:
- Mục tiêu có 20% né tránh
- Bị hiệu ứng Thủy 3 sao: Né tránh giảm xuống còn 20% - 35% = -15% (tối thiểu 0%)
- Người tấn công có 100% chính xác: Tỷ lệ hụt = 100 - 0 + (100 - 100) = 100% trúng đòn
\`\`\`

---`;

// Thay thế phần Phong
const oldWind = /### 🌪️ Phong \(WIND\) - 20 unit[\s\S]*?---/;
const newWind = `### 🌪️ Phong (WIND) - 20 unit

**Hiệu ứng**: Giảm chính xác (Reduce Accuracy)

**Mô tả**: Gió mạnh làm mất thăng bằng, giảm chính xác tấn công

**Công thức tỷ lệ trúng đòn**: 
\`\`\`
Tỷ lệ hụt = 100 - Né tránh mục tiêu + (Chính xác người tấn công - 100)
\`\`\`

**Phạm vi chỉ số**:
- Chính xác: 80% - 125% (con nhỏ nhanh nhẹn có chính xác cao, con to chậm chạp thấp hơn)
- Né tránh: 5% - 35% (Sói, Hổ, Báo ~25-35%, Voi, Rắn, Rùa ~5-10%)

**Chi tiết theo sao**:
- ⭐ 1 sao: Giảm 15% chính xác (1 lượt)
- ⭐⭐ 2 sao: Giảm 25% chính xác (2 lượt)
- ⭐⭐⭐ 3 sao: Giảm 35% chính xác (2 lượt)

**Ví dụ áp dụng**:
\`\`\`
🦅 Đại Bàng Xạ Thủ (Xạ thủ - Phong) - Skill: Tên Thập Tự
⭐ 1 sao: Bắn hình thập tự, 25% cơ hội giảm 15% chính xác (1 lượt)
⭐⭐ 2 sao: Bắn hình thập tự, 40% cơ hội giảm 25% chính xác (2 lượt)
⭐⭐⭐ 3 sao: Bắn hình thập tự, 60% cơ hội giảm 35% chính xác (2 lượt)

Ví dụ tính toán:
- Kẻ địch có 100% chính xác
- Bị hiệu ứng Phong 3 sao: Chính xác giảm xuống 100% - 35% = 65%
- Tấn công mục tiêu có 20% né tránh: Tỷ lệ hụt = 100 - 20 + (65 - 100) = 45% hụt
\`\`\`

---`;

// Thay thế phần Dạ
const oldNight = /### 🌙 Dạ \(NIGHT\) - 12 unit[\s\S]*?---/;
const newNight = `### 🌙 Dạ (NIGHT) - 12 unit

**Hiệu ứng**: Chảy máu (Bleed) + Giảm hồi máu

**Mô tả**: Tấn công từ bóng tối gây vết thương sâu, chảy máu và giảm khả năng hồi phục

**Chi tiết theo sao**:
- ⭐ 1 sao: 8 sát thương chảy máu/lượt (2 lượt) + Giảm 25% hồi máu - Tổng 16 sát thương
- ⭐⭐ 2 sao: 12 sát thương chảy máu/lượt (2 lượt) + Giảm 25% hồi máu - Tổng 24 sát thương
- ⭐⭐⭐ 3 sao: 15 sát thương chảy máu/lượt (3 lượt) + Giảm 25% hồi máu - Tổng 45 sát thương

**Ví dụ áp dụng**:
\`\`\`
🐺 Sói Thủ Lĩnh (Sát thủ - Dạ) - Skill: Buff đồng minh
⭐ 1 sao: Buff ATK, 25% cơ hội gây chảy máu (8 sát thương/lượt, 2 lượt, giảm 25% hồi máu)
⭐⭐ 2 sao: Buff ATK, 40% cơ hội gây chảy máu (12 sát thương/lượt, 2 lượt, giảm 25% hồi máu)
⭐⭐⭐ 3 sao: Buff ATK, 60% cơ hội gây chảy máu (15 sát thương/lượt, 3 lượt, giảm 25% hồi máu)

Ví dụ tính toán:
- Mục tiêu bị chảy máu 3 sao: Mất 15 HP/lượt trong 3 lượt = 45 HP
- Nếu mục tiêu được hồi 100 HP: Chỉ hồi được 100 × (1 - 0.25) = 75 HP
\`\`\`

---`;

// Thay thế phần Nham
const oldStone = /### 🪨 Nham \(STONE\) - 17 unit[\s\S]*?---/;
const newStone = `### 🪨 Nham (STONE) - 17 unit

**Hiệu ứng**: Giảm giáp (Armor Break)

**Mô tả**: Đòn tấn công nặng nề phá vỡ giáp, giảm phòng thủ vật lý

**Chi tiết theo sao**:
- ⭐ 1 sao: Giảm 20% giáp (2 lượt)
- ⭐⭐ 2 sao: Giảm 30% giáp (2 lượt)
- ⭐⭐⭐ 3 sao: Giảm 40% giáp (3 lượt)

**Ví dụ áp dụng**:
\`\`\`
🦏 Tê Giác Địa Chấn (Đấu sĩ - Nham) - Skill: Phản Đòn
⭐ 1 sao: Phản đòn khi bị tấn công, 25% cơ hội giảm 20% giáp kẻ tấn công (2 lượt)
⭐⭐ 2 sao: Phản đòn khi bị tấn công, 40% cơ hội giảm 30% giáp kẻ tấn công (2 lượt)
⭐⭐⭐ 3 sao: Phản đòn khi bị tấn công, 60% cơ hội giảm 40% giáp kẻ tấn công (3 lượt)

Ví dụ tính toán:
- Mục tiêu có 50 giáp
- Bị hiệu ứng Nham 3 sao: Giáp giảm xuống 50 × (1 - 0.4) = 30 giáp
- Sát thương vật lý nhận vào tăng đáng kể
\`\`\`

---`;

// Thay thế phần Hỏa
const oldFire = /### 🔥 Hỏa \(FIRE\) - 14 unit[\s\S]*?---/;
const newFire = `### 🔥 Hỏa (FIRE) - 14 unit

**Hiệu ứng**: Cháy (Burn) + Lan lửa

**Mô tả**: Gây sát thương lửa theo thời gian, có thể lan sang đồng minh cạnh bên của mục tiêu

**Chi tiết theo sao**:
- ⭐ 1 sao: 12 sát thương cháy/lượt (2 lượt) - Tổng 24 sát thương | 15% cơ hội lan lửa
- ⭐⭐ 2 sao: 17 sát thương cháy/lượt (2 lượt) - Tổng 34 sát thương | 25% cơ hội lan lửa
- ⭐⭐⭐ 3 sao: 22 sát thương cháy/lượt (3 lượt) - Tổng 66 sát thương | 35% cơ hội lan lửa

**Cơ chế lan lửa**:
- Khi mục tiêu bị cháy, mỗi lượt có cơ hội lan sang 1 đồng minh cạnh bên (4 ô liền kề)
- Lửa lan gây 50% sát thương cháy của hiệu ứng gốc
- Lửa lan chỉ kéo dài 1 lượt

**Ví dụ áp dụng**:
\`\`\`
🐟 Cắt Lao (Xạ thủ - Hỏa) - Skill: Tên Thập Tự
⭐ 1 sao: Bắn hình thập tự, 25% cơ hội gây cháy (12 sát thương/lượt, 2 lượt)
         Mỗi lượt có 15% cơ hội lan sang đồng minh cạnh bên (6 sát thương, 1 lượt)
⭐⭐ 2 sao: Bắn hình thập tự, 40% cơ hội gây cháy (17 sát thương/lượt, 2 lượt)
         Mỗi lượt có 25% cơ hội lan sang đồng minh cạnh bên (8 sát thương, 1 lượt)
⭐⭐⭐ 3 sao: Bắn hình thập tự, 60% cơ hội gây cháy (22 sát thương/lượt, 3 lượt)
         Mỗi lượt có 35% cơ hội lan sang đồng minh cạnh bên (11 sát thương, 1 lượt)
\`\`\`

---`;

// Thực hiện thay thế
content = content.replace(oldTide, newTide);
content = content.replace(oldWind, newWind);
content = content.replace(oldNight, newNight);
content = content.replace(oldStone, newStone);
content = content.replace(oldFire, newFire);

// Cập nhật bảng tổng hợp
const oldTable = /\| Nguyên tố \| Số unit \| Hiệu ứng \| Tỷ lệ ⭐ \| Tỷ lệ ⭐⭐ \| Tỷ lệ ⭐⭐⭐ \| Đặc điểm \|[\s\S]*?\| ✨ Linh \| 16 \| Thanh tẩy.*?\|/;
const newTable = `| Nguyên tố | Số unit | Hiệu ứng | Tỷ lệ ⭐ | Tỷ lệ ⭐⭐ | Tỷ lệ ⭐⭐⭐ | Đặc điểm |
|-----------|---------|----------|---------|-----------|------------|----------|
| 🔥 Hỏa | 14 | Cháy + Lan lửa | 25% (12 dmg/turn, 2 turns, 15% lan) | 40% (17 dmg/turn, 2 turns, 25% lan) | 60% (22 dmg/turn, 3 turns, 35% lan) | DOT + AoE |
| 💧 Thủy | 22 | Giảm né tránh | 25% (-15% evasion, 1 turn) | 40% (-25% evasion, 2 turns) | 60% (-35% evasion, 2 turns) | Tăng tỷ lệ trúng |
| 🌪️ Phong | 20 | Giảm chính xác | 25% (-15% accuracy, 1 turn) | 40% (-25% accuracy, 2 turns) | 60% (-35% accuracy, 2 turns) | Giảm tỷ lệ trúng |
| 🪨 Nham | 17 | Giảm giáp | 25% (-20% armor, 2 turns) | 40% (-30% armor, 2 turns) | 60% (-40% armor, 3 turns) | Tăng sát thương vật lý |
| 🌿 Mộc | 5 | Hút máu | 25% (15% lifesteal) | 40% (25% lifesteal) | 60% (30% lifesteal) | Hồi phục |
| 🐛 Trùng | 14 | Nhiễm độc | 25% (10 dmg/turn, 2 turns) | 40% (15 dmg/turn, 2 turns) | 60% (18 dmg/turn, 3 turns) | DOT |
| 🌙 Dạ | 12 | Chảy máu + Giảm hồi | 25% (8 dmg/turn, 2 turns, -25% heal) | 40% (12 dmg/turn, 2 turns, -25% heal) | 60% (15 dmg/turn, 3 turns, -25% heal) | DOT + Anti-heal |
| ✨ Linh | 16 | Thanh tẩy | 25% (xóa 1 debuff) | 40% (xóa 1 + hồi 20 HP) | 60% (xóa 2 + hồi 40 HP) | Hỗ trợ |`;

content = content.replace(oldTable, newTable);

// Lưu file
fs.writeFileSync(path.join(__dirname, 'ROLE_SKILL_ANALYSIS.md'), content);

console.log('✅ Đã cập nhật hiệu ứng nguyên tố:');
console.log('- Thủy: Làm chậm → Giảm né tránh');
console.log('- Phong: Đẩy lùi → Giảm chính xác');
console.log('- Dạ: Mù → Chảy máu + Giảm hồi máu 25%');
console.log('- Nham: Choáng → Giảm giáp theo %');
console.log('- Hỏa: Cháy → Cháy + Lan lửa sang đồng minh cạnh bên');
console.log('- Thêm công thức tỷ lệ trúng đòn và phạm vi chỉ số');
