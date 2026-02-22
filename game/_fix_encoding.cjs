/**
 * Fix all mojibake (garbled encoding) in PlanningScene.js
 * The garbled text comes from UTF-8 emoji being re-encoded through a latin1/cp1252 roundtrip
 */
const fs = require('fs');
const path = 'p:/DigiGO/games/game/src/scenes/PlanningScene.js';

let content = fs.readFileSync(path, 'utf8');
const original = content;

// Map of known mojibake patterns to their correct UTF-8 emoji/text
const replacements = [
    // Emoji replacements
    ['≡ƒº¡', '🔔'],     // round icon
    ['≡ƒ¬Ö', '🪙'],     // gold icon  
    ['Γ¼å', '⭐'],       // level icon
    ['Γ£ª', '✪'],        // XP icon (actually ✪)
    ['ΓÜö', '⚒'],       // deploy icon  
    ['≡ƒÅ╖∩╕Å', '🏷️'],   // tag icon
    ['Γ¥ñ∩╕Å', '❤️'],    // heart icon
    ['Γ£¿', '✨'],       // sparkle/matk icon
    ['≡ƒöÑ', '🔥'],     // fire/rage icon
    ['≡ƒÄÆ', '🎒'],     // backpack/equip icon
    ['≡ƒÄ»', '🎯'],     // target icon
    ['≡ƒî┐', '🌿'],     // leaf icon
    ['≡ƒæè', '👊'],     // fist icon
    ['≡ƒôª', '📦'],     // package icon
    ['≡ƒô£', '📋'],     // clipboard icon
    ['≡ƒöä', '🔄'],     // reset icon
    ['≡ƒôÜ', '📚'],     // library icon
    ['Γùå', '◆'],       // diamond
    ['ΓÇó', '•'],       // bullet
    ['Γùà', '◆'],       // alternative diamond
    ['ΓåÆ', '→'],       // arrow
    ['ΓÜÖ', '⚙'],      // gear/settings
    ['Γÿà', '★'],       // star
    ['Γ¥ö', '❔'],       // question
    ['≡ƒÆá', '💠'],     // true damage icon
    ['ΓöÇΓöÇ', '——'],   // em-dash pair (comment markers)

    // Vietnamese text replacements (mojibake -> correct)
    ['V├▓ng', 'Vòng'],
    ['V├áng', 'Vàng'],
    ['Cß║Ñp', 'Cấp'],
    ['Triß╗ân khai', 'Triển khai'],
    ['─Éß╗òi t╞░ß╗¢ng', 'Đổi tướng'],
    ['v├áng', 'vàng'],
    ['Kh├│a', 'Khóa'],
    ['Tß║»t', 'Tắt'],
    ['Bß║¡t', 'Bật'],
    ['N├óng dß╗▒ bß╗ï', 'Nâng dự bị'],
    ['N├óng b├án chß║┐', 'Nâng bàn chế'],
    ['N├óng kho ─æß╗ô', 'Nâng kho đồ'],
    ['B├ín', 'Bán'],
    ['V├ín mß╗¢i', 'Ván mới'],
    ['XUß║ñT TRß║¼N', 'XUẤT TRẬN'],
    ['Bß║«T ─Éß║ªU GIAO TRANH', 'BẮT ĐẦU GIAO TRANH'],
    ['C├ái ─æß║╖t', 'Cài đặt'],
    ['Th╞░ Viß╗çn', 'Thư Viện'],
    ['Nhß║¡t k├╜', 'Nhật ký'],
    ['Lß╗ïch sß╗¡', 'Lịch sử'],
    ['Xem lß╗ïch sß╗¡', 'Xem lịch sử'],
    ['Bß║¡c:', 'Bậc:'],
    ['Nß╗Ö tß╗æi ─æa:', 'Nộ tối đa:'],
    ['Mß╗æc nghß╗ü:', 'Mốc nghề:'],
    ['Mß╗æc tß╗Öc:', 'Mốc tộc:'],
    ['─É├ính th╞░ß╗¥ng', 'Đánh thường'],
    ['Chi├¬u thß╗⌐c:', 'Chiêu thức:'],
    ['Kh├┤ng c├│', 'Không có'],
    ['Trang bß╗ï ─æang mß║╖c', 'Trang bị đang mặc'],
    ['Trang bß╗ï:', 'Trang bị:'],
    ['Trang bß╗ï', 'Trang bị'],
    ['trang bß╗ï', 'trang bị'],
    ['Ch╞░a c├│', 'Chưa có'],
    ['Ch╞░a c├│ sß╗▒ kiß╗çn.', 'Chưa có sự kiện.'],
    ['Biß║┐n thß╗â:', 'Biến thể:'],
    ['N├⌐ tr├ính:', 'Né tránh:'],
    ['─É├ính xa', 'Đánh xa'],
    ['Cß║¡n chiß║┐n', 'Cận chiến'],
    ['Tß║ºm:', 'Tầm:'],
    ['─É├ính xa', 'Đánh xa'],
    ['─É├ú ho├án trß║ú', 'Đã hoàn trả'],
    ['to├án bß╗Ö', 'toàn bộ'],
    ['kß║╗ ─æß╗ïch', 'kẻ địch'],
    ['─æß╗ông minh', 'đồng minh'],
    ['mß╗Ñc ti├¬u', 'mục tiêu'],
    ['h├áng ngang', 'hàng ngang'],
    ['cß╗Öt dß╗ìc', 'cột dọc'],
    ['v├╣ng vu├┤ng', 'vùng vuông'],
    ['rß║úi ngß║½u nhi├¬n', 'rải ngẫu nhiên'],
    ['tiß╗ün tuyß║┐n', 'tiền tuyến'],
    ['bß║ún th├ón', 'bản thân'],
    ['tß╗▒ th├ón', 'tự thân'],
    ['h├¼nh ─æiß╗âm', 'hình điểm'],
    ['h├¼nh chß╗» thß║¡p', 'hình chữ thập'],
    ['theo t├¼nh huß╗æng', 'theo tình huống'],
    ['kh├┤ng r├╡', 'không rõ'],
    ['mß║½u kß╗╣ n─âng ─æß║╖c th├╣', 'mẫu kỹ năng đặc thù'],
    ['Tß║Ñn c├┤ng', 'Tấn công'],
    ['C╞░ß╗¥ng h├│a', 'Cường hóa'],
    ['h├║t m├íu', 'hút máu'],
    ['nß╗ò dß╗Öi', 'nổ dội'],
    ['Loß║íi s├ít th╞░╞íng:', 'Loại sát thương:'],
    ['Vß║¡t l├╜', 'Vật lý'],
    ['C├┤ng thß╗⌐c c╞í bß║ún:', 'Công thức cơ bản:'],
    ['ATK v├á gi├íp mß╗Ñc ti├¬u', 'ATK và giáp mục tiêu'],
    ['╞»u ti├¬n', 'Ưu tiên'],
    ['Thi triß╗ân:', 'Thi triển:'],
    ['Tß║ºm ─æ├ính:', 'Tầm đánh:'],
    ['mß║½u', 'mẫu'],
    ['Sß║»p', 'Sắp'],
    ['vß║¡t phß║⌐m', 'vật phẩm'],
    ['c├┤ng thß╗⌐c khß╗¢p', 'công thức khớp'],
    ['─Éß║ºu ra', 'Đầu ra'],
    ['Pha', 'Pha'],
    ['─æ├ú chß╗ìn', 'đã chọn'],
    ['s├ít th╞░╞íng', 'sát thương'],
    ['c├┤ng thß╗⌐c', 'công thức'],
    ['kh├┤ng g├óy', 'không gây'],
    ['trß╗▒c tiß║┐p', 'trực tiếp'],
    ['Kh├┤ng c├│ c├┤ng thß╗⌐c', 'Không có công thức'],
    ['─É├ú n├óng cß║Ñp', 'Đã nâng cấp'],
    ['Kh├┤ng ─æß╗º v├áng', 'Không đủ vàng'],
    ['n├óng cß║Ñp', 'nâng cấp'],
    ['kho ─æß╗ô', 'kho đồ'],
    ['b├án chß║┐', 'bàn chế'],
    ['dß╗▒ bß╗ï', 'dự bị'],
    ['─Éß╗òi t╞░ß╗¢ng', 'Đổi tướng'],
    ['Mua XP', 'Mua XP'],
    ['─Éß╗â trang bß╗ï', 'Để trang bị'],
    ['─æß╗â trang bß╗ï', 'để trang bị'],
    ['─æ╞░a v├áo b├án chß║┐ tß║ío', 'đưa vào bàn chế tạo'],
    ['D├╣ng ─æß╗â gh├⌐p ─æß╗ô', 'Dùng để ghép đồ'],
    ['gh├⌐p ─æß╗ô', 'ghép đồ'],
    ['├ö vß║¡t phß║⌐m', 'Ô vật phẩm'],
    ['├ö chß║┐ tß║ío', 'Ô chế tạo'],
    ['Trß╗æng', 'Trống'],
    ['Nguy├¬n liß╗çu', 'Nguyên liệu'],
    ['Loß║íi:', 'Loại:'],
    ['Sß╗æ l╞░ß╗úng:', 'Số lượng:'],
    ['Hiß╗çu ß╗⌐ng:', 'Hiệu ứng:'],
    ['Nhß║Ñn v├áo th├║', 'Nhấn vào thú'],
    ['Nhß║Ñn lß║íi lß║ºn 2', 'Nhấn lại lần 2'],
    ['KHO ─Éß╗Æ', 'KHO ĐỒ'],
    ['Bàn chế tạo', 'Bàn chế tạo'],
    ['Chi tiß║┐t', 'Chi tiết'],
    ['─É├ú ho├án trß║ú', 'Đã hoàn trả'],
    ['dß╗▒ l├¬n 16 ├┤', 'dự lên 16 ô'],
    ['khóa', 'khóa'],
    ['Nhß║Ñn', 'Nhấn'],
    ['nguy├¬n liß╗çu', 'nguyên liệu'],
    ['khung chß║┐ tß║ío', 'khung chế tạo'],
    ['bß╗Ñ', 'bỏ'],
    ['Pha ${this.getPhaseLabel', 'Pha ${this.getPhaseLabel'],
];

let count = 0;
for (const [bad, good] of replacements) {
    const before = content;
    content = content.split(bad).join(good);
    if (content !== before) {
        const n = (before.length - content.length + good.length * ((before.length - content.replace(new RegExp(good.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').length) / bad.length)) / bad.length;
        count++;
    }
}

if (content !== original) {
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Fixed ${count} different mojibake patterns`);
    console.log(`File size: ${original.length} -> ${content.length} bytes`);
} else {
    console.log('No mojibake found');
}

// Verify: check for remaining mojibake
const remaining = [];
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Check for common mojibake markers (but exclude legitimate uses)
    if (/[≡ƒ╖╗╞░ß╗ß║├]{3,}/.test(l) && !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.includes('regex') && !l.includes('RegExp')) {
        remaining.push(`${i + 1}: ${l.trim().substring(0, 100)}`);
    }
}
if (remaining.length > 0) {
    console.log(`\nWARNING: ${remaining.length} lines may still have mojibake:`);
    remaining.forEach(l => console.log(l));
} else {
    console.log('\nNo remaining mojibake detected!');
}
