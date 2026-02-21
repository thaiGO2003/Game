# KẾ HOẠCH FORMAT LẠI UNIT ENCYCLOPEDIA

**Mục tiêu**: Format lại file `unit_encyclopedia.md` theo yêu cầu mới

---

## 📋 YÊU CẦU TỪ ẢNH

### Cột TRÁI - Thông tin cơ bản (Stats):
1. ⚔️ **Bậc**: Tier (1-5 sao)
2. 🎯 **Tộc/Vai trò**: Tribe + Class
3. ❤️ **HP**: Health Points
4. ⚔️ **ATK**: Attack
5. 🛡️ **DEF**: Defense
6. ✨ **MATK**: Magic Attack
7. 🔮 **MDEF**: Magic Defense
8. 🎯 **Tầm**: Range
9. 🔥 **Độ chính xác**: Accuracy (THÊM MỚI - chưa có trong CSV)
10. 🔥 **Nộ tối đa**: Rage Max
11. 🎨 **Trang bị**: Equipment slots
12. 💎 **Mốc nghề**: Synergy tiers
13. 🌱 **Mốc tốc**: Growth tiers

### Cột PHẢI - Skill description với emoji:
1. 🎯 **Đánh thường** (Basic Attack)
   - Thi triển: Pattern
   - Tầm đánh: Range
   - Loại sát thương: Damage type
   - Ưu tiên mục tiêu
   - Công thức cơ bản

2. ✨ **Chiêu thức**: Skill name với emoji nguyên tố
   - Mô tả skill
   - **Mốc sao**: Chi tiết theo 1★, 2★, 3★
     - Sát thương/Hiệu ứng
     - Số mục tiêu
     - Hình dạng chiêu thức (với emoji)
     - Công thức chi tiết

---

## 🎨 FORMAT MỚI - 10 CON SAMPLE


### 1. 🐻 GẤU CỔ THỤ (Tier 1 - Tanker)

**THÔNG TIN CƠ BẢN**
- ⭐ Bậc: 1 (Trung/Đỡ đòn)
- 🪨 Tộc: Nham
- ❤️ HP: 340
- ⚔️ ATK: 42
- 🛡️ DEF: 30
- ✨ MATK: 10
- 🔮 MDEF: 24
- 🎯 Tầm: Cận chiến (1)
- 🎯 Độ chính xác: 95% (thêm mới)
- 🔥 Nộ tối đa: 4
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Cận chiến áp sát tiền tuyến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên tiền tuyến gần nhất
- Công thức cơ bản: ATK và giáp mục tiêu

🪨 **Chiêu thức: Mai Gai Cổ Mộc** (Thorn Bark)
Kích hoạt lớp mai gai tự nhiên, gây sát thương vật lý lên mục tiêu trước mặt, đồng thời tạo lá chắn bảo vệ bản thân và khiêu khích toàn bộ kẻ địch buộc chúng phải tấn công mình trong 1 lượt.

**Mốc sao:**
- ⭐ 1 sao: Sát thương gốc
  - 💥 Sát thương: (ATK×1.05 + 28) × 1.00 = ~72 dmg
  - 🎯 Số mục tiêu: 1 mục tiêu
  - 📐 Hình dạng: ⬜ 1 ô trước mặt
  - 🛡️ Shield: 72 HP
  - 🎯 Taunt: 1 lượt
  - 🪨 Hiệu ứng Nham: Giảm 20% giáp mục tiêu

- ⭐⭐ 2 sao: +20% sát thương
  - 💥 Sát thương: (ATK×1.05 + 28) × 1.20 = ~86 dmg
  - 🛡️ Shield: 86 HP
  - 🪨 Hiệu ứng Nham: Giảm 30% giáp mục tiêu

- ⭐⭐⭐ 3 sao: +40% sát thương
  - 💥 Sát thương: (ATK×1.05 + 28) × 1.40 = ~100 dmg
  - 🛡️ Shield: 100 HP
  - 🪨 Hiệu ứng Nham: Giảm 40% giáp mục tiêu

---

### 2. 🦊 CÁO HỎA (Tier 1 - Assassin)

**THÔNG TIN CƠ BẢN**
- ⭐ Bậc: 1 (Hỏa/Sát thủ)
- 🔥 Tộc: Hỏa
- ❤️ HP: 255
- ⚔️ ATK: 72
- 🛡️ DEF: 15
- ✨ MATK: 18
- 🔮 MDEF: 13
- 🎯 Tầm: Cận chiến (1)
- 🎯 Độ chính xác: 110% (thêm mới)
- 🔥 Nộ tối đa: 2
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Lao sau lưng mục tiêu
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên carry yếu giáp ở hậu phương
- Công thức cơ bản: ATK và giáp mục tiêu

🔥 **Chiêu thức: Hỏa Ấn Liên Kích** (Flame Combo)
Lao sau lưng mục tiêu và tung 2 nhát liên tiếp. Nhát đầu gây sát thương vật lý cơ bản, nhát thứ hai gây thêm sát thương. Tổng sát thương rất cao khi kết hợp cả 2 đòn.

**Mốc sao:**
- ⭐ 1 sao: 2 đòn liên tiếp
  - 💥 Đòn 1: (26 + ATK×1.45) × 1.00 = ~130 dmg
  - 💥 Đòn 2: (22 + ATK×1.25) × 1.00 = ~112 dmg
  - 💥 Tổng: ~242 dmg
  - 🎯 Số mục tiêu: 1 mục tiêu
  - 📐 Hình dạng: ⬜ Sau lưng mục tiêu
  - 🔥 Hiệu ứng Hỏa: 15% tỷ lệ gây cháy lan

- ⭐⭐ 2 sao: +20% sát thương
  - 💥 Tổng: ~290 dmg
  - 🔥 Hiệu ứng Hỏa: 25% tỷ lệ gây cháy lan

- ⭐⭐⭐ 3 sao: +40% sát thương
  - 💥 Tổng: ~339 dmg
  - 🔥 Hiệu ứng Hỏa: 35% tỷ lệ gây cháy lan

---

### 3. 🦅 ĐẠI BÀNG XẠ THỦ (Tier 2 - Archer)

**THÔNG TIN CƠ BẢN**
- ⭐⭐ Bậc: 2 (Phong/Xạ thủ)
- 🌪️ Tộc: Phong
- ❤️ HP: 230
- ⚔️ ATK: 62
- 🛡️ DEF: 12
- ✨ MATK: 10
- 🔮 MDEF: 11
- 🎯 Tầm: Xa (4)
- 🎯 Độ chính xác: 105% (thêm mới)
- 🔥 Nộ tối đa: 3
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Bắn tên từ xa
- Tầm đánh: 4 ô
- Loại sát thương: Vật lý
- Ưu tiên mục tiêu trong tầm
- Công thức cơ bản: ATK và giáp mục tiêu

🌪️ **Chiêu thức: Tên Thập Tự** (Cross Arrow)
Bắn mũi tên nổ hình thập (+) vào mục tiêu, gây sát thương vật lý lên mục tiêu chính và 4 ô liền kề (trên/dưới/trái/phải). Tất cả ô bị ảnh hưởng chịu sát thương đầy đủ.

**Mốc sao:**
- ⭐ 1 sao: Nổ hình +
  - 💥 Sát thương: (ATK×1.8 + 35) × 1.00 = ~147 dmg
  - 🎯 Số mục tiêu: 1 + 4 ô kề
  - 📐 Hình dạng: ➕ Hình thập tự
  ```
     ⬜
  ⬜ 🎯 ⬜
     ⬜
  ```
  - 🌪️ Hiệu ứng Phong: Giảm 15% chính xác

- ⭐⭐ 2 sao: +20% sát thương, mở rộng vùng
  - 💥 Sát thương: ~176 dmg
  - 📐 Hình dạng: Mở rộng thêm 1 ô mỗi hướng
  - 🌪️ Hiệu ứng Phong: Giảm 25% chính xác

- ⭐⭐⭐ 3 sao: +40% sát thương, vùng tối đa
  - 💥 Sát thương: ~206 dmg
  - 📐 Hình dạng: Mở rộng tối đa
  - 🌪️ Hiệu ứng Phong: Giảm 35% chính xác

---


### 4. 🪰 CHUỒN CHUỒN BĂNG (Tier 2 - Mage)

**THÔNG TIN CƠ BẢN**
- ⭐⭐ Bậc: 2 (Thủy/Pháp sư)
- 💧 Tộc: Thủy
- ❤️ HP: 215
- ⚔️ ATK: 16
- 🛡️ DEF: 10
- ✨ MATK: 68
- 🔮 MDEF: 28
- 🎯 Tầm: Xa (4)
- 🎯 Độ chính xác: 100% (thêm mới)
- 🔥 Nộ tối đa: 3
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Phép thuật từ xa
- Tầm đánh: 4 ô
- Loại sát thương: Phép thuật
- Ưu tiên mục tiêu trong tầm
- Công thức cơ bản: MATK và kháng phép mục tiêu

💧 **Chiêu thức: Cột Băng Hệ** (Ice Column)
Triệu hồi cột băng khổng lồ đánh toàn bộ địch trong cùng cột mục tiêu. Gây sát thương phép đầy đủ và có tỷ lệ đóng băng từng kẻ địch trong 1 lượt.

**Mốc sao:**
- ⭐ 1 sao: Cột băng cơ bản
  - 💥 Sát thương: (MATK×2.2 + 40) × 1.00 = ~190 dmg
  - 🎯 Số mục tiêu: Toàn bộ cột
  - 📐 Hình dạng: | Cột dọc
  ```
  ⬜
  🎯
  ⬜
  ⬜
  ```
  - ❄️ Freeze: 50% tỷ lệ đóng băng 1 lượt
  - 💧 Hiệu ứng Thủy: Giảm 15% né tránh

- ⭐⭐ 2 sao: +20% sát thương
  - 💥 Sát thương: ~228 dmg
  - ❄️ Freeze: 75% tỷ lệ đóng băng
  - 💧 Hiệu ứng Thủy: Giảm 25% né tránh

- ⭐⭐⭐ 3 sao: +40% sát thương
  - 💥 Sát thương: ~266 dmg
  - ❄️ Freeze: 100% tỷ lệ đóng băng
  - 💧 Hiệu ứng Thủy: Giảm 35% né tránh

---

### 5. 🫎 NAI THẦN CA (Tier 1 - Support)

**THÔNG TIN CƠ BẢN**
- ⭐ Bậc: 1 (Linh/Hỗ trợ)
- 👻 Tộc: Linh
- ❤️ HP: 245
- ⚔️ ATK: 22
- 🛡️ DEF: 14
- ✨ MATK: 55
- 🔮 MDEF: 25
- 🎯 Tầm: Trung (3)
- 🎯 Độ chính xác: 95% (thêm mới)
- 🔥 Nộ tối đa: 3
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Phép thuật hỗ trợ
- Tầm đánh: 3 ô
- Loại sát thương: Phép thuật
- Ưu tiên mục tiêu yếu nhất
- Công thức cơ bản: MATK và kháng phép

👻 **Chiêu thức: Khúc Ca Tái Sinh** (Healing Song)
Hát bài ca hồi sinh, hồi phục máu cho 2 đồng minh có HP thấp nhất. Lượng hồi dựa trên MATK. Ở sao cao hồi thêm đồng minh.

**Mốc sao:**
- ⭐ 1 sao: Hồi 2 đồng minh
  - 💚 Hồi máu: MATK×1.2 = ~66 HP
  - 🎯 Số mục tiêu: 2 đồng minh HP thấp nhất
  - 📐 Hình dạng: 🎵 Vùng hỗ trợ
  - 👻 Hiệu ứng Linh: Buff đặc biệt

- ⭐⭐ 2 sao: Hồi 3 đồng minh
  - 💚 Hồi máu: MATK×1.4 = ~77 HP
  - 🎯 Số mục tiêu: 3 đồng minh
  - 👻 Hiệu ứng Linh: Buff mạnh hơn

- ⭐⭐⭐ 3 sao: Hồi 4 đồng minh
  - 💚 Hồi máu: MATK×1.6 = ~88 HP
  - 🎯 Số mục tiêu: 4 đồng minh
  - 👻 Hiệu ứng Linh: Buff cực mạnh

---

### 6. 🐯 HỔ NANH (Tier 1 - Fighter)

**THÔNG TIN CƠ BẢN**
- ⭐ Bậc: 1 (Hỏa/Đấu sĩ)
- 🔥 Tộc: Hỏa
- ❤️ HP: 305
- ⚔️ ATK: 58
- 🛡️ DEF: 20
- ✨ MATK: 12
- 🔮 MDEF: 18
- 🎯 Tầm: Cận chiến (1)
- 🎯 Độ chính xác: 115% (thêm mới - hổ rất chính xác)
- 🔥 Nộ tối đa: 3
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Vồ xé cận chiến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên tiền tuyến
- Công thức cơ bản: ATK và giáp mục tiêu

🔥 **Chiêu thức: Vồ Xé** (Tiger Claw)
Vồ mạnh vào mục tiêu với nanh vuốt sắc bén, gây sát thương vật lý cao và có tỷ lệ gây chảy máu.

**Mốc sao:**
- ⭐ 1 sao: Vồ đơn
  - 💥 Sát thương: (ATK×2.0 + 30) × 1.00 = ~146 dmg
  - 🎯 Số mục tiêu: 1 mục tiêu
  - 📐 Hình dạng: ⬜ 1 ô trước mặt
  - 🩸 Bleed: 30% tỷ lệ chảy máu
  - 🔥 Hiệu ứng Hỏa: 15% tỷ lệ gây cháy lan

- ⭐⭐ 2 sao: +20% sát thương
  - 💥 Sát thương: ~175 dmg
  - 🩸 Bleed: 50% tỷ lệ chảy máu
  - 🔥 Hiệu ứng Hỏa: 25% tỷ lệ gây cháy lan

- ⭐⭐⭐ 3 sao: +40% sát thương, đánh 2 mục tiêu
  - 💥 Sát thương: ~204 dmg
  - 🎯 Số mục tiêu: 2 mục tiêu gần nhất
  - 🩸 Bleed: 70% tỷ lệ chảy máu
  - 🔥 Hiệu ứng Hỏa: 35% tỷ lệ gây cháy lan

---


### 7. 🦏 TÊ GIÁC ĐỊA CHẤN (Tier 2 - Support)

**THÔNG TIN CƠ BẢN**
- ⭐⭐ Bậc: 2 (Nham/Hỗ trợ)
- 🪨 Tộc: Nham
- ❤️ HP: 380
- ⚔️ ATK: 48
- 🛡️ DEF: 33
- ✨ MATK: 10
- 🔮 MDEF: 24
- 🎯 Tầm: Cận chiến (1)
- 🎯 Độ chính xác: 90% (thêm mới - tê giác chậm)
- 🔥 Nộ tối đa: 4
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Húc cận chiến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên tiền tuyến
- Công thức cơ bản: ATK và giáp mục tiêu

🪨 **Chiêu thức: Phản Đòn Tê Giác** (Rhino Counter)
Tích tụ năng lượng vào lớp da dày, mỗi khi bị kẻ địch cận chiến tấn công, Tê Giác sẽ lập tức húc trả lại gây sát thương vật lý. Hiệu ứng kéo dài 3 lượt. Khắc chế cứng các đấu sĩ và sát thủ.

**Mốc sao:**
- ⭐ 1 sao: Phản đòn cơ bản
  - 💥 Sát thương phản: ATK×0.8 = ~38 dmg/hit
  - 🎯 Số lần phản: Không giới hạn trong 3 lượt
  - 📐 Hình dạng: 🛡️ Tự động phản đòn
  - ⏱️ Thời gian: 3 lượt
  - 🪨 Hiệu ứng Nham: Giảm 20% giáp kẻ tấn công

- ⭐⭐ 2 sao: +20% sát thương phản
  - 💥 Sát thương phản: ATK×0.96 = ~46 dmg/hit
  - 🪨 Hiệu ứng Nham: Giảm 30% giáp kẻ tấn công

- ⭐⭐⭐ 3 sao: +40% sát thương phản + stun
  - 💥 Sát thương phản: ATK×1.12 = ~54 dmg/hit
  - 😵 Stun: 25% tỷ lệ choáng 1 lượt
  - 🪨 Hiệu ứng Nham: Giảm 40% giáp kẻ tấn công

---

### 8. 🐜 KIẾN HỘ VỆ (Tier 1 - Tanker)

**THÔNG TIN CƠ BẢN**
- ⭐ Bậc: 1 (Trùng/Đỡ đòn)
- 🐝 Tộc: Bầy (Swarm)
- ❤️ HP: 420
- ⚔️ ATK: 45
- 🛡️ DEF: 45
- ✨ MATK: 10
- 🔮 MDEF: 30
- 🎯 Tầm: Cận chiến (1)
- 🎯 Độ chính xác: 95% (thêm mới)
- 🔥 Nộ tối đa: 4
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Cắn cận chiến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên tiền tuyến
- Công thức cơ bản: ATK và giáp mục tiêu

🐝 **Chiêu thức: Kiến Trận Đồ** (Ant Shield Wall)
Dựng tường khiên kiên cố, tăng +25 Giáp và +15 Kháng Phép cho toàn bộ đồng minh cùng hàng trong 3 lượt. Biến hàng tank thành bức tường thành vững chắc.

**Mốc sao:**
- ⭐ 1 sao: Buff hàng tank
  - 🛡️ Buff Giáp: +25
  - 🔮 Buff Kháng Phép: +15
  - 🎯 Số mục tiêu: Toàn bộ đồng minh cùng hàng
  - 📐 Hình dạng: ⬜⬜⬜ Hàng ngang
  - ⏱️ Thời gian: 3 lượt
  - 🐝 Hiệu ứng Bầy: +5% mỗi đồng minh Trùng

- ⭐⭐ 2 sao: Buff mạnh hơn
  - 🛡️ Buff Giáp: +30
  - 🔮 Buff Kháng Phép: +18
  - 🐝 Hiệu ứng Bầy: +8% mỗi đồng minh Trùng

- ⭐⭐⭐ 3 sao: Buff toàn đội
  - 🛡️ Buff Giáp: +35
  - 🔮 Buff Kháng Phép: +20
  - 🎯 Số mục tiêu: Toàn bộ đồng minh
  - 🐝 Hiệu ứng Bầy: +10% mỗi đồng minh Trùng

---

### 9. 🐈‍⬛ BÁO HƯ KHÔNG (Tier 5 - Assassin)

**THÔNG TIN CƠ BẢN**
- ⭐⭐⭐⭐⭐ Bậc: 5 (Dạ/Sát thủ)
- 🌙 Tộc: Dạ
- ❤️ HP: 320
- ⚔️ ATK: 95
- 🛡️ DEF: 14
- ✨ MATK: 14
- 🔮 MDEF: 12
- 🎯 Tầm: Cận chiến (1)
- 🎯 Độ chính xác: 125% (thêm mới - báo cực kỳ chính xác)
- 🔥 Nộ tối đa: 2
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Lao sau lưng mục tiêu
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên carry yếu giáp ở hậu phương
- Công thức cơ bản: ATK và giáp mục tiêu

🌙 **Chiêu thức: Tất Sát Hư Không - Hoàn Nộ** (Void Execute)
Lao vòng ra sau lưng mục tiêu và giáng đòn chí tử với hệ số sát thương cực cao (x2.8 ATK). Nếu hạ gục mục tiêu, hoàn lại 50% Nộ tối đa. Kỹ năng sát thủ tier 5 với khả năng liên hoàn cực mạnh.

**Mốc sao:**
- ⭐ 1 sao: Đòn chí tử
  - 💥 Sát thương: (ATK×2.8 + 65) × 1.00 = ~331 dmg
  - 🎯 Số mục tiêu: 1 mục tiêu (ưu tiên carry)
  - 📐 Hình dạng: ⬜ Sau lưng mục tiêu
  - 🔄 Hoàn Nộ: 50% nếu kill
  - 🌙 Hiệu ứng Dạ: Chảy máu + giảm 25% hồi máu

- ⭐⭐ 2 sao: +20% sát thương
  - 💥 Sát thương: ~397 dmg
  - 🔄 Hoàn Nộ: 60% nếu kill
  - 🌙 Hiệu ứng Dạ: Chảy máu mạnh + giảm 25% hồi máu

- ⭐⭐⭐ 3 sao: +40% sát thương + crit
  - 💥 Sát thương: ~463 dmg
  - 💥 Crit: +25% tỷ lệ chí mạng
  - 🔄 Hoàn Nộ: 75% nếu kill
  - 🌙 Hiệu ứng Dạ: Chảy máu nghiêm trọng + giảm 25% hồi máu

---

### 10. 🐒 KHỈ LAO CÀNH (Tier 1 - Archer)

**THÔNG TIN CƠ BẢN**
- ⭐ Bậc: 1 (Phong/Xạ thủ)
- 🌪️ Tộc: Phong
- ❤️ HP: 250
- ⚔️ ATK: 68
- 🛡️ DEF: 12
- ✨ MATK: 12
- 🔮 MDEF: 12
- 🎯 Tầm: Xa (4)
- 🎯 Độ chính xác: 105% (thêm mới)
- 🔥 Nộ tối đa: 3
- 🎨 Trang bị: Chưa có
- 💎 Mốc nghề: 2/4/6
- 🌱 Mốc tốc: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
- Thi triển: Bắn tên từ xa
- Tầm đánh: 4 ô
- Loại sát thương: Vật lý
- Ưu tiên mục tiêu trong tầm
- Công thức cơ bản: ATK và giáp mục tiêu

🌪️ **Chiêu thức: Xuyên Hàng** (Row Pierce)
Bắn mũi tên xuyên qua nhiều mục tiêu trên cùng hàng, gây sát thương vật lý đầy đủ cho tối đa 3 mục tiêu. Ưu tiên mục tiêu gần nhất trước.

**Mốc sao:**
- ⭐ 1 sao: Xuyên 3 mục tiêu
  - 💥 Sát thương: (ATK×1.6 + 32) × 1.00 = ~141 dmg
  - 🎯 Số mục tiêu: Tối đa 3 mục tiêu cùng hàng
  - 📐 Hình dạng: ➡️ Hàng ngang
  ```
  🎯 ⬜ ⬜ ⬜
  ```
  - 🌪️ Hiệu ứng Phong: Giảm 15% chính xác

- ⭐⭐ 2 sao: +20% sát thương, xuyên 4 mục tiêu
  - 💥 Sát thương: ~169 dmg
  - 🎯 Số mục tiêu: Tối đa 4 mục tiêu
  - 🌪️ Hiệu ứng Phong: Giảm 25% chính xác

- ⭐⭐⭐ 3 sao: +40% sát thương, xuyên 5 mục tiêu
  - 💥 Sát thương: ~197 dmg
  - 🎯 Số mục tiêu: Tối đa 5 mục tiêu (toàn hàng)
  - 🌪️ Hiệu ứng Phong: Giảm 35% chính xác

---


---

## 📊 THAY ĐỔI CHÍNH

### 1. Cột TRÁI - Thêm thông tin:
- ✅ Giữ nguyên: HP, ATK, DEF, MATK, MDEF, Tầm, Nộ tối đa
- ➕ **THÊM MỚI**: 
  - 🎯 **Độ chính xác** (Accuracy) - Chưa có trong CSV, cần thêm
  - 🎨 **Trang bị** (Equipment slots)
  - 💎 **Mốc nghề** (Synergy tiers)
  - 🌱 **Mốc tốc** (Growth tiers)

### 2. Cột PHẢI - Format mới:

#### A. Đánh thường (Basic Attack) - THÊM MỚI
```
🎯 Đánh thường
- Thi triển: [Pattern description]
- Tầm đánh: [Range]
- Loại sát thương: [Damage type]
- Ưu tiên: [Target priority]
- Công thức cơ bản: [Formula]
```

#### B. Chiêu thức (Skill) - Format với emoji
```
[Emoji nguyên tố] Chiêu thức: [Skill Name] ([English Name])
[Mô tả skill]

Mốc sao:
- ⭐ 1 sao: [Description]
  - 💥 Sát thương: [Formula] = [Value]
  - 🎯 Số mục tiêu: [Count]
  - 📐 Hình dạng: [Pattern with emoji]
  - [Các hiệu ứng khác với emoji]
  - [Emoji nguyên tố] Hiệu ứng [Tên nguyên tố]: [Effect]

- ⭐⭐ 2 sao: [Similar format]
- ⭐⭐⭐ 3 sao: [Similar format]
```

### 3. Emoji sử dụng:

#### Thông tin cơ bản:
- ⭐ Bậc/Tier
- ❤️ HP
- ⚔️ ATK
- 🛡️ DEF
- ✨ MATK
- 🔮 MDEF
- 🎯 Tầm/Accuracy
- 🔥 Nộ
- 🎨 Trang bị
- 💎 Mốc nghề
- 🌱 Mốc tốc

#### Nguyên tố:
- 🔥 Hỏa (Fire)
- 💧 Thủy (Tide)
- 🌪️ Phong (Wind)
- 🌙 Dạ (Night)
- 🪨 Nham (Stone)
- 🐝 Bầy (Swarm)
- 👻 Linh (Spirit)
- 🌳 Mộc (Wood)

#### Skill effects:
- 💥 Sát thương
- 💚 Hồi máu
- 🛡️ Shield/Giáp
- 🎯 Mục tiêu
- 📐 Hình dạng
- ⏱️ Thời gian
- 🔄 Hoàn Nộ
- 😵 Stun/Choáng
- 🩸 Bleed/Chảy máu
- ❄️ Freeze/Đóng băng
- 🎵 Buff/Support

#### Hình dạng chiêu thức:
- ⬜ Ô đơn
- ➕ Hình thập tự
- ➡️ Hàng ngang
- | Cột dọc
- 🎯 Mục tiêu chính

---

## 🔧 DỮ LIỆU CẦN BỔ SUNG

### 1. Trong units.csv - THÊM CỘT MỚI:
```csv
accuracy,evasion,equipment,synergyTiers,growthTiers
```

### 2. Giá trị đề xuất cho Accuracy:

**Theo vai trò và đặc điểm:**
- **Tanker** (Đỡ đòn): 85-95%
  - Con chậm, nặng: 85-90% (Voi, Gấu, Rùa)
  - Con trung bình: 90-95%

- **Fighter** (Đấu sĩ): 100-110%
  - Con thường: 100-105%
  - Con nhanh: 105-110% (Hổ, Báo)

- **Assassin** (Sát thủ): 110-125%
  - Con thường: 110-115%
  - Con nhanh: 115-120% (Cáo, Dơi)
  - Tier cao: 120-125% (Báo Hư Không)

- **Archer** (Xạ thủ): 100-110%
  - Tất cả: 100-110%

- **Mage** (Pháp sư): 95-105%
  - Tất cả: 95-105%

- **Support** (Hỗ trợ): 90-100%
  - Tất cả: 90-100%

### 3. Giá trị đề xuất cho Evasion:

**Theo tốc độ và kích thước:**
- **Rất chậm**: 5-8% (Voi, Rùa, Ốc sên)
- **Chậm**: 8-12% (Gấu, Trâu, Tê giác)
- **Trung bình**: 12-18% (Hầu hết units)
- **Nhanh**: 18-25% (Khỉ, Cáo, Dơi)
- **Rất nhanh**: 25-35% (Hổ, Báo, Sói, Châu chấu)

### 4. Equipment/Synergy/Growth:
- Equipment: "Chưa có" (placeholder)
- Synergy: "2/4/6" (standard)
- Growth: "2/4/6" (standard)

---

## 📝 BƯỚC THỰC HIỆN

### Bước 1: Cập nhật units.csv
1. Thêm cột `accuracy` với giá trị theo vai trò
2. Thêm cột `evasion` với giá trị theo tốc độ
3. Thêm cột `equipment` = "Chưa có"
4. Thêm cột `synergyTiers` = "2/4/6"
5. Thêm cột `growthTiers` = "2/4/6"

### Bước 2: Tạo script generate encyclopedia
1. Đọc units.csv và skills.csv
2. Map unit -> skill data
3. Generate format mới theo template trên
4. Xuất ra file `unit_encyclopedia.md` mới

### Bước 3: Xử lý skill description
1. Parse skill description để lấy:
   - Mô tả chính
   - Công thức sát thương
   - Số mục tiêu
   - Hình dạng chiêu thức
   - Hiệu ứng đặc biệt
2. Format theo từng tier (1★, 2★, 3★)
3. Thêm emoji phù hợp

### Bước 4: Tạo basic attack description
1. Dựa vào:
   - `range`: Cận chiến (1) hoặc Xa (>1)
   - `classType`: Xác định pattern
   - `damageType`: Vật lý hoặc Phép thuật
2. Generate mô tả đánh thường

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành, mỗi unit sẽ có:

1. **Thông tin đầy đủ hơn** với Accuracy, Evasion
2. **Mô tả đánh thường** rõ ràng
3. **Skill description** có cấu trúc với emoji
4. **Chi tiết theo tier** (1★, 2★, 3★)
5. **Hình dạng chiêu thức** trực quan với emoji
6. **Hiệu ứng nguyên tố** rõ ràng

---

## 🎯 LƯU Ý

1. **Chưa code** - Đây chỉ là kế hoạch
2. **Cần xác nhận** format có đúng ý bạn không
3. **Cần quyết định** giá trị Accuracy/Evasion cho từng unit
4. **Có thể điều chỉnh** emoji và format nếu cần

---

**Bạn xem kế hoạch này có ổn không? Nếu đồng ý thì tôi sẽ bắt đầu code!**
