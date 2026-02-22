# Tài Liệu Yêu Cầu Sửa Lỗi - Combat Rage Equipment Fixes

## Giới Thiệu

Tài liệu này mô tả các lỗi trong hệ thống chiến đấu của game liên quan đến cơ chế nộ (rage), trang bị (equipment), công thức chế tạo (crafting recipes), và hành vi của các vai trò (roles). Các lỗi này ảnh hưởng đến trải nghiệm người chơi và cân bằng game.

## Phân Tích Lỗi

### Hành Vi Hiện Tại (Lỗi)

#### 1. Trang Bị Nộ

1.1 WHEN trang bị có thuộc tính `startingRage` (ví dụ: +10 nộ, +30 nộ) được gắn cho tướng THEN hệ thống không tăng nộ ban đầu của tướng khi bắt đầu chiến đấu

1.2 WHEN trang bị có giá trị `startingRage` vượt quá 4 (ví dụ: +10, +15, +30) THEN hệ thống vẫn cho phép bonus này mà không giới hạn

1.3 WHEN tướng có `rageMax` là 2 và được trang bị có `startingRage` cao THEN tướng vẫn chỉ có 2 nộ tối đa và không nhận được lợi ích từ trang bị

#### 2. Assassin Targeting

2.1 WHEN Assassin thực hiện tấn công thường (basic attack) THEN hệ thống chọn mục tiêu gần nhất thay vì xa nhất

2.2 WHEN Assassin sử dụng kỹ năng với `actionPattern: "ASSASSIN_BACK"` THEN logic targeting hoạt động đúng (chọn mục tiêu xa nhất)

2.3 WHEN có nhiều mục tiêu cùng khoảng cách THEN Assassin không ưu tiên theo thứ tự hàng đúng (cùng hàng → hàng trên → hàng dưới)

#### 3. Công Thức Chế Tạo Bậc 3

3.1 WHEN công thức chế tạo bậc 3 (tier 3) chỉ yêu cầu 4 nguyên liệu THEN người chơi không có động lực sử dụng bàn chế tạo 3x3

3.2 WHEN công thức chế tạo bậc 3 không yêu cầu ít nhất 1 vật phẩm cấp 2 THEN công thức không hợp lý về progression

3.3 WHEN tướng 1 sao có thể trang bị đồ cấp 3 THEN cân bằng game bị phá vỡ

#### 4. Vai Trò Khác Không Mất Nộ

4.1 WHEN vai trò WARRIOR, ASSASSIN, TANKER, hoặc SUPPORT sử dụng kỹ năng THEN nộ của họ không bị reset về 0

4.2 WHEN vai trò MAGE sử dụng kỹ năng THEN nộ được giữ nguyên (hành vi đúng)

4.3 WHEN MAGE sử dụng kỹ năng đánh trúng nhiều kẻ địch THEN nộ không tăng dựa trên số lượng kẻ địch bị ảnh hưởng

#### 5. Tanker Không Tự Động Dùng Skill

5.1 WHEN vai trò TANKER có `rage >= rageMax` và đang bị tấn công THEN hệ thống không tự động kích hoạt kỹ năng

5.2 WHEN TANKER bị tấn công nhưng `rage < rageMax` THEN hệ thống không kích hoạt kỹ năng (hành vi đúng)

### Hành Vi Mong Đợi (Đúng)

#### 1. Trang Bị Nộ

2.1 WHEN trang bị có thuộc tính `startingRage` được gắn cho tướng THEN hệ thống SHALL tăng nộ ban đầu của tướng khi bắt đầu chiến đấu theo giá trị `startingRage`

2.2 WHEN tổng `startingRage` từ tất cả trang bị vượt quá 4 THEN hệ thống SHALL giới hạn tối đa bonus là 4

2.3 WHEN tướng có `rageMax` thấp nhưng có `startingRage` cao THEN tướng SHALL bắt đầu với nộ bằng `min(rageMax, startingRage)`

2.4 WHEN trang bị được tạo ra THEN giá trị `startingRage` tối đa trong mỗi trang bị SHALL không vượt quá 4

#### 2. Assassin Targeting

2.5 WHEN Assassin thực hiện tấn công thường (basic attack) THEN hệ thống SHALL chọn mục tiêu có khoảng cách xa nhất

2.6 WHEN có nhiều mục tiêu cùng khoảng cách xa nhất THEN Assassin SHALL ưu tiên mục tiêu cùng hàng trước

2.7 WHEN không có mục tiêu cùng hàng THEN Assassin SHALL ưu tiên hàng trên trước, sau đó mới đến hàng dưới

#### 3. Công Thức Chế Tạo Bậc 3

2.8 WHEN công thức chế tạo bậc 3 (tier 3) được định nghĩa THEN công thức SHALL yêu cầu tối thiểu 6 nguyên liệu

2.9 WHEN công thức chế tạo bậc 3 được định nghĩa THEN công thức SHALL yêu cầu ít nhất 1 vật phẩm cấp 2

2.10 WHEN công thức chế tạo bậc 3 được định nghĩa THEN công thức SHOULD yêu cầu 9 nguyên liệu để tận dụng bàn 3x3

2.11 WHEN tướng có số sao (star) là 1 THEN tướng SHALL chỉ có thể trang bị đồ cấp 1

2.12 WHEN tướng có số sao (star) là 2 THEN tướng SHALL có thể trang bị đồ cấp 1 và cấp 2

2.13 WHEN tướng có số sao (star) là 3 THEN tướng SHALL có thể trang bị đồ cấp 1, 2 và 3

2.14 WHEN hệ thống cần thêm trang bị cấp 1 THEN hệ thống SHALL bổ sung các trang bị cấp 1 mới vào danh sách

#### 4. Vai Trò Khác Mất Nộ

2.15 WHEN vai trò WARRIOR, ASSASSIN, TANKER, hoặc SUPPORT sử dụng kỹ năng THEN nộ của họ SHALL bị reset về 0

2.16 WHEN vai trò MAGE sử dụng kỹ năng THEN nộ SHALL được giữ nguyên

2.17 WHEN MAGE sử dụng kỹ năng đánh trúng N kẻ địch THEN nộ SHALL tăng dựa trên số lượng N

2.18 WHEN MAGE có `rageMax` quá cao (>7) THEN giá trị `rageMax` SHALL được điều chỉnh xuống 6-7

#### 5. Tanker Tự Động Dùng Skill

2.19 WHEN vai trò TANKER có `rage >= rageMax` và đang bị tấn công THEN hệ thống SHALL tự động kích hoạt kỹ năng ngay lập tức

2.20 WHEN TANKER tự động kích hoạt kỹ năng THEN kỹ năng SHALL được thực thi trước khi nhận sát thương

2.21 WHEN TANKER bị silence hoặc không có kỹ năng hợp lệ THEN hệ thống SHALL không kích hoạt kỹ năng tự động

### Hành Vi Không Đổi (Phòng Ngừa Regression)

#### 1. Cơ Chế Nộ Cơ Bản

3.1 WHEN tướng tấn công hoặc bị tấn công THEN hệ thống SHALL CONTINUE TO tăng nộ theo cơ chế hiện tại

3.2 WHEN tướng đạt `rageMax` THEN hệ thống SHALL CONTINUE TO cho phép sử dụng kỹ năng

3.3 WHEN nộ vượt quá `rageMax` THEN hệ thống SHALL CONTINUE TO giới hạn nộ ở mức `rageMax`

#### 2. Targeting Của Các Vai Trò Khác

3.4 WHEN vai trò TANKER hoặc FIGHTER tấn công THEN hệ thống SHALL CONTINUE TO chọn mục tiêu gần nhất

3.5 WHEN vai trò ARCHER, MAGE, hoặc SUPPORT tấn công THEN hệ thống SHALL CONTINUE TO chọn mục tiêu theo logic hiện tại

3.6 WHEN kỹ năng có `actionPattern` đặc biệt THEN hệ thống SHALL CONTINUE TO sử dụng logic targeting của kỹ năng đó

#### 3. Công Thức Chế Tạo Bậc 1 và 2

3.7 WHEN công thức chế tạo bậc 1 (tier 1) được sử dụng THEN công thức SHALL CONTINUE TO yêu cầu 1-4 nguyên liệu cơ bản

3.8 WHEN công thức chế tạo bậc 2 (tier 2) được sử dụng THEN công thức SHALL CONTINUE TO yêu cầu 3 nguyên liệu với ít nhất 1 trang bị cấp 1

3.9 WHEN người chơi chế tạo trang bị THEN hệ thống SHALL CONTINUE TO áp dụng bonus từ trang bị đó

#### 4. Kỹ Năng MAGE

3.10 WHEN MAGE sử dụng kỹ năng THEN hệ thống SHALL CONTINUE TO không reset nộ về 0

3.11 WHEN MAGE sử dụng kỹ năng AOE THEN hệ thống SHALL CONTINUE TO gây sát thương cho nhiều mục tiêu

#### 5. Hành Vi Kỹ Năng Khác

3.12 WHEN tướng sử dụng kỹ năng có hiệu ứng đặc biệt (stun, freeze, etc.) THEN hệ thống SHALL CONTINUE TO áp dụng hiệu ứng đó

3.13 WHEN kỹ năng có điều kiện đặc biệt (ví dụ: void_execute_v2 hoàn nộ khi giết) THEN hệ thống SHALL CONTINUE TO thực thi điều kiện đó

3.14 WHEN tướng bị silence THEN hệ thống SHALL CONTINUE TO ngăn không cho sử dụng kỹ năng
