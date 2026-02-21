# KẾ HOẠCH XÓA WIKI CŨ TRONG COMBATSCENE

**Ngày**: 21/02/2026  
**Trạng thái**: ✅ HOÀN THÀNH

---

## 🎯 MỤC TIÊU

Xóa toàn bộ code wiki cũ trong CombatScene.js, chỉ giữ lại phần delegate sang LibraryModal.

---

## ✅ ĐÃ HOÀN THÀNH

### 1. ✅ Xóa biến không dùng trong `create()`
Đã xóa:
- `this.wikiScrollY`
- `this.wikiMaxScroll`
- `this._wikiTab`
- `this._wikiDetailUnit`
- `this._wikiCraftRecipes`

Giữ lại (vẫn cần):
- `this.wikiVisible`
- `this.wikiSelectedUnitId`
- `this.wikiSearchQuery`

---

### 2. ✅ Hàm `createWikiModal()`
Đã clean, chỉ còn delegate sang LibraryModal:
```javascript
createWikiModal() {
  if (!this.libraryModal) {
    this.libraryModal = new LibraryModal(this, {
      title: "Thư Viện Linh Thú",
      onClose: () => {
        this.wikiVisible = false;
        this.clearAttackPreview();
      }
    });
  }
  this.wikiOverlay = this.libraryModal.getOverlayParts();
}
```

---

### 3. ✅ Hàm `toggleWikiModal()`
Đã xóa ~50 dòng code wiki cũ sau `return;`

---

### 4. ✅ Hàm `onWikiWheel()`
Đã đơn giản hóa, chỉ còn:
```javascript
onWikiWheel(deltaY) {
  if (this.libraryModal) {
    this.libraryModal.scrollBy(deltaY);
  }
}
```

---

### 5. ✅ Hàm `refreshWikiList()`
Đã xóa ~130 dòng code render wiki cũ, chỉ còn:
```javascript
refreshWikiList() {
  if (this.libraryModal) {
    this.libraryModal.refresh();
  }
}
```

---

## 📊 KẾT QUẢ

- ✅ Đã xóa tổng cộng ~200 dòng dead code
- ✅ Build thành công không có lỗi
- ✅ Không còn tham chiếu nào đến biến wiki cũ
- ✅ CombatScene.js giờ chỉ delegate sang LibraryModal.js
- ✅ LibraryModal.js là file thống nhất cho cả menu và combat

---

## 📁 FILE LIÊN QUAN

- `game/src/scenes/CombatScene.js` - Đã dọn dẹp xong
- `game/src/ui/LibraryModal.js` - File thống nhất cho cả menu và combat
- `game/src/ui/AttackPreview.js` - Component preview đòn đánh thường
- `game/src/ui/SkillPreview.js` - Component preview kỹ năng

---

## 🎉 HOÀN THÀNH

Công việc dọn dẹp wiki cũ đã hoàn tất. Code giờ sạch hơn, dễ maintain, và không còn duplicate.
