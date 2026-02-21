# BÁO CÁO PHÂN TÍCH SKILL - CẬP NHẬT

**Thời gian**: 12:26:22 21/2/2026

## 📊 Tổng quan

- **Tổng units**: 120
- **Tổng skills**: 1254
- **Skills có mô tả nguyên tố**: 99/1254 (8%)
- **Nhóm skill trùng lặp**: 1
  - 🔴 Nghiêm trọng (cùng vai trò ≥5): 1
  - 🟡 Chấp nhận được (khác vai trò): 0

## 🎯 Hệ thống nguyên tố


### 🔥 Hỏa (FIRE)
- **Hiệu ứng**: Gây cháy
- **Mô tả**: Gây sát thương đốt theo thời gian và có tỷ lệ lan sang đồng minh cạnh bên của kẻ địch
- **Scaling**: 15%→25%→35% tỷ lệ lan cháy


### 💧 Thủy (TIDE)
- **Hiệu ứng**: Giảm né tránh
- **Mô tả**: Làm ướt kẻ địch, giảm khả năng né tránh
- **Scaling**: 15%→25%→35% giảm né tránh


### 🌪️ Phong (WIND)
- **Hiệu ứng**: Giảm chính xác
- **Mô tả**: Tạo gió xoáy làm mất thăng bằng, giảm độ chính xác
- **Scaling**: 15%→25%→35% giảm chính xác


### 🌙 Dạ (NIGHT)
- **Hiệu ứng**: Chảy máu + Giảm hồi máu
- **Mô tả**: Gây chảy máu và giảm 25% hiệu quả hồi máu
- **Scaling**: Chảy máu theo thời gian + giảm 25% hồi máu


### 🪨 Nham (STONE)
- **Hiệu ứng**: Giảm giáp
- **Mô tả**: Phá vỡ giáp, giảm phòng thủ theo phần trăm
- **Scaling**: 20%→30%→40% giảm giáp


### 🐝 Bầy (SWARM)
- **Hiệu ứng**: Hiệu ứng bầy đàn
- **Mô tả**: Tăng sức mạnh khi có nhiều đồng minh cùng tộc
- **Scaling**: Tăng dần theo số lượng


## 🔴 Nhóm trùng lặp nghiêm trọng (1)


### 1.  - 

**Tổng**: 120 units

**Phân bố vai trò**:
- Đỡ đòn: 20 units
- Hỗ trợ: 24 units
- Sát thủ: 19 units
- Xạ thủ: 20 units
- Pháp sư: 20 units
- Đấu sĩ: 17 units

**Phân bố nguyên tố**:
- 🪨 Nham: 17 units
- 💧 Thủy: 22 units
- 🌪️ Phong: 20 units
- 🐝 Bầy: 14 units
- 🌙 Dạ: 12 units
- 🔥 Hỏa: 14 units
- ❓ SPIRIT: 16 units
- ❓ WOOD: 5 units

**Đề xuất**: Cần thiết kế lại skill hoặc thêm biến thể rõ ràng hơn.


## 🟡 Nhóm trùng lặp chấp nhận được (0)

_Các nhóm này có thể chấp nhận vì khác vai trò hoặc số lượng ít. Tuy nhiên nên thêm hiệu ứng nguyên tố để tăng sự đa dạng._





## ✅ Kết luận

### Đã hoàn thành:
- ✅ Phân tích 1 nhóm skill trùng lặp
- ✅ Phân loại theo mức độ nghiêm trọng
- ✅ Xác định 1 nhóm cần xử lý ưu tiên

### Cần làm tiếp:
1. ⏳ Thêm mô tả nguyên tố cho 21 skills
2. ⏳ Thiết kế lại 1 nhóm nghiêm trọng
3. ⏳ Implement logic hiệu ứng nguyên tố vào game
4. ⏳ Test và balance

---

**Ghi chú**: 
- Skills có thể trùng effect/pattern nếu khác vai trò và có hiệu ứng nguyên tố khác nhau
- Ví dụ: Đấu sĩ và Cung thủ có thể dùng skill tấn công hình chữ thập, nhưng một gây cháy, một gây giảm né tránh
