# Forest Throne - Ba Chu Khu Rung

## Chạy dự án

```bash
npm install
npm run dev
```

Mở trình duyệt tại URL do Vite cung cấp (thường là `http://localhost:5173`).

## Xuất dữ liệu CSV (mở bằng Excel)

```bash
npm run export:data
```

File xuất ra tại thư mục `data/`:
- `data/units.csv`
- `data/skills.csv`
- `data/synergies.csv`

## Nội dung đã triển khai (MVP playable)

- Màn hình chính:
  - `Bắt đầu`
  - Sau khi bấm `Bắt đầu`: chọn `chế độ` + `độ khó` trước khi vào trận.
  - `Cài đặt` (âm thanh mặc định, độ khó AI mặc định)
  - `Xóa tiến trình lưu`
- Vòng chơi đầy đủ qua scene độc lập:
  - `PlanningScene` (shop/economy/deploy/augment)
  - `CombatScene` (autobattle/resolve)
  - `PlanningScene` nhận kết quả round và tiếp tục progression.
- Mỗi vòng có đội hình địch được AI xếp sẵn trước giao tranh để người chơi khắc chế.
- Kinh tế kiểu TFT:
  - Vàng theo round (base + interest + streak).
  - Shop 5 tướng, `Roll`, `Buy XP`, `Lock`.
  - Level + deploy cap theo level.
  - Merge sao `3x -> +1 star` tự động.
- Lưu/khôi phục progression bằng `localStorage`:
  - Qua `Cài đặt` (`ESC` hoặc nút góc phải): `Save`, `Load`, `Clear`.
  - Auto save khi thao tác chính và khi chuyển phase.
- Combat theo luật quét ô:
  - Ta: `row 0->4`, `col 4->0`
  - Địch: `row 0->4`, `col 5->9`
  - Xen kẽ hành động theo queue.
- Rule class target:
  - `Assassin` ưu tiên hậu phương.
  - `Archer/Mage` ưu tiên cùng hàng.
  - `Melee/Tanker/Fighter` ưu tiên tiền tuyến.
- Action pattern:
  - Ranged đứng yên.
  - Melee lao trước mặt rồi quay về.
  - Assassin vòng sau rồi quay về.
- Skill system data-driven + bộ skill riêng theo class.
- Synergy `Class/Tribe` mốc `2/4/6`.
- Augment chọn `3 -> 1` ở các mốc round.
- Tooltip chi tiết:
  - Unit tooltip (stats, skill formula, synergy mốc).
  - Synergy/Augment tooltip.
- VFX/SFX cơ bản:
  - Slash/pulse/floating text.
  - Âm click/hit/skill/heal/KO (bật/tắt bằng nút `Audio`).
- Cải tiến giao diện:
  - Việt hóa toàn bộ UI hiển thị.
  - Bàn đấu dùng tọa độ dạng cờ vua (`A1`, `B3`, ...).
  - Hai phe tách nhau 1 ô tượng trưng ở giữa.
  - Phe ta hiển thị trái-dưới, phe địch phải-trên.
  - Có biểu tượng thú (emoji) trong board/shop/bench/combat.
  - Bố cục panel theo tỷ lệ màn hình (responsive theo canvas fit), tách rõ khu combat/shop/side panel.
  - Hỗ trợ zoom/pan sân đấu ở Planning: lăn chuột để zoom, kéo chuột phải để di chuyển.
- Kho thú & vật phẩm:
  - Panel phải dưới hiển thị kho linh thú dự bị + vật phẩm.
  - Có ghép đồ cơ bản (craft) để nhận buff đội hình.
- Nội dung roster:
  - Tổng số tướng trong hệ thống: `40`.
- Âm thanh:
  - Có nhạc nền + SFX (được tải về local trong `public/assets/audio`).
  - Nguồn file âm thanh mẫu: CDN assets của Phaser examples (`cdn.phaserfiles.com`).
- AI difficulty:
  - `Easy`, `Medium`, `Hard`.
  - Scale theo stats, rage gain, target quality, size đội hình.
- Sudden death:
  - Tăng damage toàn trận khi combat kéo dài.

## Điều khiển

- `SPACE`:
  - Planning: bắt đầu combat.
  - Combat: step thêm 1 hành động.
- `R`: bắt đầu run mới.
- `1` / `2` / `3`: đổi AI `Easy/Medium/Hard`.
- Dùng chuột:
  - Click shop card để mua.
  - Click bench để chọn tướng.
  - Click ô board phe ta để deploy/swap/thu hồi.
  - Click button để roll/xp/lock/start/new run/save/load/clear/audio.

## Tài liệu hệ thống

Chỉnh sửa tài liệu tại:

- `SYSTEM_OVERVIEW.md`
