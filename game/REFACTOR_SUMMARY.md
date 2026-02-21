# TÓM TẮT REFACTOR - LIBRARY MODAL

**Ngày**: 21/02/2026

## ✅ Đã hoàn thành

### 1. Targeting System
- Sửa `scoreTarget()` trong 3 files: CombatScene, PlanningScene, BoardPrototypeScene
- Thuật toán mới theo TARGETING_RULES.md:
  - Tank/Fighter: Ưu tiên cột gần nhất
  - Assassin: Ưu tiên cột xa nhất  
  - Archer/Mage/Support: Ưu tiên cùng hàng

### 2. Library Modal - 1 File Duy Nhất
- **File chính**: `src/ui/LibraryModal.js`
- **Được dùng bởi**:
  - Menu chính (MenuScene)
  - Combat (CombatScene)
- **Tính năng**:
  - Hiển thị danh sách units
  - Chi tiết unit với stats đầy đủ
  - 2 preview chiến trường (AttackPreview + SkillPreview)
  - Animation pulse loop

### 3. Code Wiki Cũ Trong CombatScene
**Trạng thái**: Vẫn còn nhưng không được dùng (sau `return;`)

**Các hàm đã được delegate sang LibraryModal**:
- `toggleWikiModal()` - Gọi `libraryModal.show/hide()`
- `onWikiWheel()` - Gọi `libraryModal.scrollBy()`
- `refreshWikiList()` - Gọi `libraryModal.refresh()`

**Code cũ cần xóa** (không ảnh hưởng vì sau `return;`):
- `refreshWikiList()` - Phần render wiki cũ (line 861-1014)
- Các biến: `wikiListContainer`, `wikiScrollY`, `_wikiDetailUnit`, `wikiMaxScroll`

## ⚠️ Vấn đề Hiện Tại

### Stats vẫn hiển thị `?`

**Nguyên nhân có thể**:
1. Browser cache - Cần hard refresh (Ctrl+Shift+R hoặc Ctrl+F5)
2. Unit data chưa load - Cần kiểm tra console log
3. toNumber() function không hoạt động đúng

**Debug đã thêm**:
```javascript
console.log('=== LIBRARY MODAL DEBUG ===');
console.log('Unit object:', unit);
console.log('Unit.stats:', unit.stats);
console.log('Final stats:', { hp, atk, def, ... });
```

## 📝 Cần Làm Tiếp

### Bước 1: Debug Stats
1. Hard refresh browser (Ctrl+Shift+R)
2. Mở thư viện
3. Click vào 1 con thú
4. Xem console log
5. Copy log và gửi cho dev

### Bước 2: Xóa Code Cũ (Tùy chọn)
Nếu muốn code sạch hơn, có thể xóa:
- Phần code sau `return;` trong `refreshWikiList()`
- Các biến wiki cũ trong `create()`

Nhưng **KHÔNG BẮT BUỘC** vì code đã hoạt động đúng với LibraryModal.

## 🎯 Kết Luận

- ✅ Targeting system: DONE
- ✅ 1 file LibraryModal cho cả 2 nơi: DONE
- ✅ Preview components: DONE
- ⚠️ Stats display: CẦN DEBUG

**File quan trọng**:
- `src/ui/LibraryModal.js` - Component chính
- `src/ui/AttackPreview.js` - Preview đòn thường
- `src/ui/SkillPreview.js` - Preview kỹ năng
- `src/scenes/CombatScene.js` - Dùng LibraryModal
