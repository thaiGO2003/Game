# FOREST THRONE - SYSTEM OVERVIEW (Editable Draft)

Phiên bản: `v0.3 - Balance Update`  
Engine: `Phaser.js 3 (2D browser)`  
Mục tiêu tài liệu: Chốt luật và phạm vi trước khi code core gameplay.

---

## 1) Tầm nhìn & Trụ cột

### 1.1 Fantasy / Chủ đề
- Thế giới rừng nguyên sinh, quái thú - linh thú - bộ tộc tranh đoạt Ngai Bá Chủ.
- Người chơi là Thủ Lĩnh: điều quân, thuần hóa thú, ghép đội hình, chọn Pháp Ấn Rừng.

### 1.2 Pillars
- Đấu trí xếp đội hình 5x5 đối xứng trái-phải.
- Kinh tế kiểu TFT: vàng, roll shop, nâng sao, synergy, augment.
- Combat theo lượt + Nộ đơn giản nhưng có chiều sâu.

### 1.3 USP
- Thứ tự hành động theo quy tắc quét ô (ưu tiên cột sát đối thủ).
- Board 5x5 mỗi bên (tổng 10x5) tạo cảm giác đại quân.
- Cơ chế "lao vào đánh rồi rút về" cho cận chiến giúp combat nhanh và đẹp mắt.

---

## 2) Board & Hệ tọa độ

- Board tổng: `10 cột x 5 hàng`.
- Cột `0-4`: phe ta (trái).
- Cột `5-9`: phe địch (phải).
- Hàng `0`: trên cùng, hàng `4`: dưới cùng.

### 2.1 Quy ước tiền tuyến và hậu phương
- Tiền tuyến là cột gần đối địch nhất của mỗi bên.
- Hậu phương là cột xa đối địch nhất của mỗi bên.
- Cụ thể:
  - Phe ta: tiền tuyến `col 4`, hậu phương `col 0`.
  - Phe địch: tiền tuyến `col 5`, hậu phương `col 9`.

---

## 3) Luật thứ tự đánh (Core bắt buộc)

### 3.1 Phe ta
- Quét `row 0 -> 4`.
- Mỗi hàng quét `col 4 -> 0`.

### 3.2 Phe địch
- Quét `row 0 -> 4`.
- Mỗi hàng quét `col 5 -> 9`.

### 3.3 Xen kẽ hành động
- Mỗi nhịp: `Ta[i]` rồi `Địch[i]`.
- Hết đội hình bên nào trước thì bên còn lại tiếp tục theo queue của vòng hiện tại.

---

## 4) Match Flow

Mỗi round gồm:

1. `Planning phase`
2. `Combat phase`

### 4.1 Planning phase
- Nhận vàng (base + lãi + streak).
- Shop 5 tướng.
- Hành động: mua/bán, roll, mua XP/level, chọn augment, xếp đội hình.

### 4.2 Combat phase
- Auto combat theo rule quét ô + rule target class-specific.
- Kết thúc round: tính thắng/thua + trừ HP người chơi.

### 4.3 Win condition (đề xuất MVP)
- MVP: `1 người chơi vs AI` theo chuỗi round (PvE journey).
- Giai đoạn sau: ghost async, rồi PvP realtime.

### 4.4 AI difficulty mode (MVP)
- Có 3 mức AI: `Easy`, `Medium`, `Hard`.
- `Easy`: target random nhiều hơn, damage thấp hơn.
- `Medium`: rule chuẩn.
- `Hard`: target tối ưu hơn, damage/rage gain cao hơn.

---

## 5) Unit System

### 5.1 Thuộc tính cơ bản
- `hp`, `atk`, `def`, `matk`, `mdef`, `crit`, `critDmg`, `range`
- `tribe`, `class`
- `starLevel` (`1/2/3`)
- `costTier` (`1..5`)

### 5.2 Thuộc tính chiến đấu
- `rageMax` (`1..5`)
- `rageCurrent`
- `skillId`
- `passiveId` (optional)

### 5.3 Quy tắc Nộ
- +1 nộ khi gây sát thương.
- +1 nộ khi nhận sát thương.
- Đầu lượt:
  - Nếu `rageCurrent >= rageMax` và không bị Silence -> cast skill, reset nộ = 0.
  - Nếu không -> đánh thường.

---

## 6) Combat System

### 6.1 Một lượt hành động
- Nếu `Stun/Freeze/Sleep` -> bỏ lượt.
- Nếu đủ nộ + không Silence -> cast skill.
- Nếu chưa đủ nộ -> basic attack.

### 6.2 Targeting rule (global + class)
Ưu tiên theo thứ tự:

1. Mục tiêu có `Taunt`.
2. Rule theo class:
  - `Archer`: ưu tiên mục tiêu cùng hàng (`same row`) trước.
  - `Mage`: ưu tiên mục tiêu cùng hàng (`same row`) trước.
  - `Melee/Tanker/Fighter`: ưu tiên mục tiêu gần tiền tuyến nhất.
  - `Assassin`: ưu tiên carry hậu phương (HP thấp / ít giáp).
3. Nếu còn hòa: Manhattan distance gần nhất.
4. Nếu vẫn hòa: HP thấp nhất.
5. Nếu vẫn hòa: random có seed.

### 6.3 Di chuyển và cách đánh
- `Ranged` (range >= 2):
  - Đứng yên ở ô hiện tại để tấn công.
  - Không lao vào mục tiêu.
- `Melee` (range = 1):
  - Lao tới ô "đứng trước mặt" mục tiêu rồi đánh.
  - Xong đòn thì quay về ô cũ.
- `Assassin` (melee đặc biệt):
  - Ưu tiên lao ra phía sau mục tiêu để đánh.
  - Nếu ô sau lưng bị chặn, chọn ô cạnh sau gần nhất.
  - Xong đòn thì quay về ô cũ.
- Rule kỹ thuật:
  - Cơ chế lao-ra/về là action animation có khóa vị trí tạm thời.
  - Nếu không tìm được ô hợp lệ để lao, fallback đứng yên và dùng basic trong tầm.

### 6.4 Damage formula
- Physical:
  - `raw = atk hoặc skillPhysical`
  - `final = raw * 100 / (100 + def)`
- Magic:
  - `raw = matk hoặc skillMagic`
  - `final = raw * 100 / (100 + mdef)`
- True:
  - `final = raw`
- Counter Bonus:
  - Hệ khắc chế (Thủy > Hỏa > Mộc > Thổ > Lôi > Thủy): +20% sát thương.
  - Role counter (Sát thủ > Xạ thủ...): +20% sát thương (dự kiến).

### 6.5 Status effects (MVP)
- Buffs (Green bar): `shield`, `atkBuff`, `defBuff`, `mdefBuff`, `reflect`, `regen`.
- Debuffs (Purple bar): `stun`, `freeze`, `silence`, `sleep`, `burn`, `poison`, `armorBreak`, `taunt`.
- Hiển thị: Icon trên đầu unit + Thanh thời gian phân khúc (segmented bar).

### 6.6 Anti-infinite draw
- Sau `turnLimit` (đề xuất 100):
  - Tăng damage toàn trận `+20%` mỗi 5 lượt.

---

## 7) Shop / Gold / Roll

### 7.1 Thu nhập
- Base gold: `+5/round`
- Interest: `+1 / mỗi 10 vàng`, tối đa `+5`
- Reserve Bonus: `+1 / mỗi 5 vàng dự trữ` (khuyến khích tích tiền).
- Streak bonus: `+1..+3` cho chuỗi thắng/thua.

### 7.2 Shop
- Mỗi lần hiện `5 tướng`.
- Chức năng: `Roll`, `Buy XP`, `Lock`.

### 7.3 Giá theo tier
- Tier 1: `1`
- Tier 2: `2`
- Tier 3: `3`
- Tier 4: `4`
- Tier 5: `5`

### 7.4 Nâng sao
- `3x 1* -> 1x 2*`
- `3x 2* -> 1x 3*`
- Scaling đề xuất:
  - `2*`: +60% HP/ATK
  - `3*`: +150% HP/ATK

---

## 8) Deploy cap

- Hard cap board: `25 ô / bên`.
- Deploy cap theo level (đề xuất giống TFT):
  - Early/Mid/Late cap: tăng dần theo level.
  - Soft target MVP: cap tối đa `10-12`.

---

## 9) Augment System

### 9.1 Thời điểm chọn
- Ví dụ: round `1-4`, `3-4`, `4-4` (chốt sau).

### 9.2 Nhóm augment
- Kinh tế
- Đội hình
- Giao tranh
- Synergy
- Độc dị (thay đổi luật)

---

## 10) Synergy Framework

- 2 lớp tag:
  - `Tribe` (tộc)
  - `Class` (nghề)
- Mốc kích hoạt: `2/4/6`.
- MVP target: `6 tộc + 6 nghề`.

---

## 11) UI/UX

### 11.1 In-combat HUD
- HP bar, Rage bar (phân khúc).
- Status bars (Buff/Debuff phân khúc).
- Tên, sao, icon tag, equipment icon.
- Tooltip chi tiết: Stats, Equipment, Active Effects.
- Floating text damage/heal/shield (Tiếng Việt).
- Highlight unit đến lượt + queue mini.
- Indicator "dash path" cho cận chiến/sát thủ.

### 11.2 Planning HUD
- Shop 5 ô.
- Gold lớn + nút Roll/XP/Lock.
- Bench.
- Panel synergy mốc.

---

## 12) Skill Schema (data-driven)

```json
{
  "id": "skill_ice_column",
  "name": "Ice Column",
  "type": "Damage_CC",
  "actionPattern": "RangedStatic",
  "targetPriority": "SameRowFirst",
  "targetType": "Column",
  "range": 4,
  "damageType": "Magic",
  "base": 90,
  "scaleStat": "matk",
  "scale": 1.1,
  "statusApply": [
    { "id": "freeze", "chance": 0.5, "durationTurns": 1 }
  ],
  "vfxId": "vfx_ice_column",
  "sfxId": "sfx_ice_break"
}
```

---

## 13) Pseudo-code combat loop

```txt
while leftAlive && rightAlive && turnCount < TURN_LIMIT:
  leftOrder  = buildOrder(LEFT)   # row 0->4, col 4->0
  rightOrder = buildOrder(RIGHT)  # row 0->4, col 5->9

  for i in 0..max(len(leftOrder), len(rightOrder))-1:
    if leftOrder[i]  exists: act(leftOrder[i])
    if rightOrder[i] exists: act(rightOrder[i])
    if battle ended: break

function act(unit):
  if unit.stunnedOrFrozen: skip
  target = selectTargetByClassRules(unit)
  if target == null: return

  if unit.rageFull and !unit.silenced:
    executeActionPattern(unit, target, skill=true)
    unit.rage = 0
  else:
    executeActionPattern(unit, target, skill=false)

function executeActionPattern(unit, target, skill):
  if unit.isRanged:
    castFromCurrentTile(unit, target, skill)       # đứng yên
  else if unit.isAssassin:
    dashToBackOfTarget(unit, target)               # vòng sau lưng
    attack(unit, target, skill)
    returnToOrigin(unit)
  else:
    dashToFrontOfTarget(unit, target)              # đứng trước mặt
    attack(unit, target, skill)
    returnToOrigin(unit)
```

---

## 14) Technical Architecture (Phaser)

### 14.1 Stack
- Runtime: `Phaser 3`
- Build: `Vite`
- Data: `JSON configs` (units, skills, augments, synergies)

### 14.2 Module đề xuất
- `src/core/board/`:
  - grid, spawn, move, occupancy
- `src/core/combat/`:
  - order builder, target resolver, action pattern engine
- `src/core/status/`:
  - status lifecycle
- `src/core/economy/`:
  - gold, shop, level odds
- `src/core/synergy/`:
  - mốc kích hoạt + aura apply
- `src/core/augment/`:
  - generate 3 choices + apply modifier
- `src/scenes/`:
  - planning scene, combat scene
- `src/ui/`:
  - hud, panels, tooltips

### 14.3 Performance notes
- Object pooling cho projectile/VFX/floating text.
- Combat update theo event queue thay vì nhiều `update()` độc lập.
- Dash cận chiến xử lý bằng tween ngắn để không block frame.

---

## 15) Content scope

### MVP
- `25-35 units`
- `6 tribe + 6 class`
- `30-40 augments`

### Full release target
- `70-120 units`
- `10-14 tribe`, `10-12 class`
- `150+ augments`

---

## 16) Roadmap

1. Phase 0: pre-production (rule freeze, data schema, mockup)
2. Phase 1: combat vertical slice (board + turn order + rage + action pattern)
3. Phase 2: TFT-like loop (shop + economy + star-up + augment)
4. Phase 3: content + balance pass
5. Phase 4: meta systems
6. Phase 5: online extensions

---

## 17) QA checklist

- Turn order theo quét ô đúng 100%.
- Ranged luôn đứng yên khi đánh.
- Melee và Assassin luôn quay về đúng ô gốc sau hành động.
- Archer/Mage ưu tiên mục tiêu cùng hàng đúng quy tắc.
- Rage tăng đúng deal/take damage.
- Silence chặn cast khi đủ nộ.
- Taunt ép target đúng.
- Sudden death chạy đúng điều kiện.

---

## 18) Quyết định cần bạn chốt trước khi code sâu

### 18.1 Ưu tiên triển khai tiếp theo (chọn 1 trước)
- [ ] A. Danh sách 40 tướng đầu tiên + skill cụ thể.
- [ ] B. Synergy mốc 2/4/6 + 60 augment.
- [ ] C. Kinh tế chi tiết: tỷ lệ shop theo level + HP loss.
- [ ] D. Wireframe UI planning/combat bám layout mục tiêu.

### 18.2 Các biến số cần khóa sớm
- [ ] DOT có cho nộ hay không.
- [ ] Assassin fallback target khi không vào được hậu phương.
- [ ] Cơ chế random: fixed seed theo trận hay random realtime.
- [ ] Công thức HP loss sau round thua.

---

## 19) Brainstorm bộ skill riêng (24 tướng mẫu)

Mỗi tướng có skill riêng, không copy y hệt nhau. Dưới đây là roster mẫu để mở rộng lên 40 tướng.

| Tướng | Class | Skill riêng | Ghi chú |
|---|---|---|---|
| Gấu Cổ Thụ | Tanker | `Mai Gai Cổ Mộc`: tạo khiên lớn + taunt 2 lượt | Chống dồn sát thương |
| Tê Giác Nham | Tanker | `Húc Địa Mạch`: đâm 1 hàng ngang, choáng mục tiêu đầu | Mở giao tranh |
| Rùa Đá Đầm Lầy | Tanker | `Mai Phản Chấn`: phản % sát thương nhận trong 2 lượt | Khắc chế xạ thủ |
| Trâu Sương Mù | Tanker | `Khí Tức Dày`: tăng giáp/kháng phép cho đồng minh cùng hàng | Tank hỗ trợ |
| Báo Đen Vực Rừng | Assassin | `Tất Sát Bóng Tối`: vòng sau lưng, gây đại sát thương 1 mục tiêu | Đúng yêu cầu assassin |
| Chồn Lửa Đêm | Assassin | `Hỏa Ấn Liên Kích`: 2 nhát vào 1 mục tiêu, nhát 2 tăng crit | Dồn carry |
| Dơi Huyết | Assassin | `Cắn Mạch`: gây sát thương đơn + hút máu mạnh | Sống dai |
| Mèo Rừng Nhị Ảnh | Assassin | `Ảnh Trảm`: để lại bóng gây hit trễ cùng mục tiêu | Burst trễ |
| Đại Bàng Xạ Thủ | Archer | `Tên Thập Tự`: bắn hình thập 5 ô quanh mục tiêu | Đúng yêu cầu archer |
| Khỉ Lao Cành Cao | Archer | `Lao Xuyên Hàng`: xuyên nhiều mục tiêu cùng hàng | Ưu tiên same row |
| Cú Đêm Rừng Già | Archer | `Mũi Tên Ngủ`: sát thương đơn + xác suất Sleep 1 lượt | Khống chế đơn |
| Linh Miêu Cung Vàng | Archer | `Phá Giáp Tiễn`: bắn mục tiêu cùng hàng, giảm giáp | Setup cho team |
| Pháp Sư Băng Trụ | Mage | `Cột Băng Hệ`: đánh 1 cột, 50% đóng băng từng địch trong cột | Đúng yêu cầu mage |
| Pháp Sư Tuyết Lam | Mage | `Băng Vụ Nén`: nổ băng tại mục tiêu cùng hàng, làm chậm diện nhỏ | Biến thể băng |
| Pháp Sư Sấm Cổ | Mage | `Lôi Trụ Tách Nhánh`: dội sét cột mục tiêu rồi lan 2 địch gần nhất | Dps lan |
| Pháp Sư Độc Trùng | Mage | `Mưa Bào Tử`: AOE độc, cộng dồn poison | Theo thời gian |
| Nai Thần Lá Ngọc | Support | `Khúc Ca Tái Sinh`: hồi máu 2 đồng minh thấp máu nhất | Heal lõi |
| Hồ Ly Huyễn Ảnh | Support | `Kính Mộng`: tạo khiên + xóa debuff nhẹ | Bảo kê carry |
| Vẹt Linh Mộc | Support | `Tiếng Hô Kích Nộ`: +1 nộ cho 3 đồng minh gần nhất | Accelerate skill |
| Kỳ Lân Sương Gió | Support | `Lối Gió`: tăng né tránh và tốc đánh cho đồng minh cùng cột | Buff theo cột |
| Hổ Răng Kiếm | Fighter | `Vồ Xé`: lao trước mặt, chém mạnh + giảm giáp mục tiêu | Mở đường |
| Sói Đầu Đàn | Fighter | `Tru Hào`: tăng công bản thân, gọi 1 đòn phụ từ đồng minh cùng hàng | Đánh phối hợp |
| Hà Mã Chiến Binh | Fighter | `Nện Bùn`: quét nửa cung trước mặt, đẩy lùi nhẹ | Kiểm soát không gian |
| Bọ Cánh Cứng Khoan Giáp | Fighter | `Mũi Khoan Xuyên`: sát thương chuẩn đơn mục tiêu | Khắc chế tanker |

---

## Phụ lục A - Trạng thái prototype hiện có trong repo

- Board 10x5 isometric đã hiển thị.
- Đã tách scene độc lập:
  - `MainMenuScene`: bắt đầu + cài đặt cơ bản.
  - `PlanningScene`: economy/shop/augment/deploy/save-load.
  - `CombatScene`: auto combat, resolve kết quả round.
- Đã có vòng chơi đầy đủ: Planning -> Combat -> Resolve round -> quay lại Planning.
- Đã có shop/gold/XP/level/deploy cap/merge sao.
- Đã có synergy + augment + AI difficulty (Easy/Medium/Hard).
- Đã có combat rules class-specific + action pattern + skill riêng theo class.
- Đã có local progression `save/load/clear` bằng `localStorage`.
- Đã có tooltip chi tiết skill/synergy/augment.
- Đã có VFX/SFX cơ bản cho hit/skill/heal/KO.
- Đã đổi tọa độ hiển thị dạng cờ vua (A1...).
- Đã tách hai phe bằng 1 ô tượng trưng ở giữa.
- Đã thêm icon linh thú trong shop/bench/board/combat.
- Đã có chọn mode sau nút Bắt đầu ở màn hình chính.
- Đã bổ sung AI build đội hình theo ngân sách round + độ khó và xếp sẵn đội hình địch theo vai trò (frontline/backline).
- Đã nâng roster lên 100 tướng.
- Đã có panel kho thú & vật phẩm (craft cơ bản).
- Đã có zoom/pan sân đấu ở planning.
- Save/Load/Clear chuyển vào panel Cài đặt (ESC hoặc nút Cài đặt).
- Đã thêm file nhạc nền/SFX local và phát qua hệ Audio.
- **New in v0.3:**
  - Hệ thống trang bị cho địch (Hard Mode).
  - Thanh Nộ/Buff/Debuff phân khúc.
  - Icon trạng thái (Stun, Freeze, Burn...).
  - Sát thương AOE của Mage không bị giảm.
  - Cơ chế ngăn trùng lặp unit trên sân.
  - Cải thiện visual sân đấu (Decorations, River size).

Tệp liên quan:
- `src/scenes/PlanningScene.js`
- `src/scenes/CombatScene.js`
- `src/main.js`
- `src/data/unitCatalog.js`
- `src/data/skills.js`
- `src/data/synergies.js`
- `src/data/augments.js`
- `src/core/gameUtils.js`
- `src/core/persistence.js`
- `src/core/runState.js`
- `src/core/tooltip.js`
- `src/core/vfx.js`
- `src/core/audioFx.js`
