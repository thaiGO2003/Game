const fs = require('fs');

// Đọc CSV
function readCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

console.log('=== PHÂN TÍCH SKILL DỰA TRÊN MÔ TẢ ===\n');

const units = readCSV('data/units.csv');
const skills = readCSV('data/skills.csv');

console.log(`📊 Tổng quan:`);
console.log(`   - Units: ${units.length}`);
console.log(`   - Skills: ${skills.length}\n`);

// Tạo map skill -> units
const skillUsage = {};
units.forEach(unit => {
  if (!unit.skillId) return;
  
  if (!skillUsage[unit.skillId]) {
    skillUsage[unit.skillId] = [];
  }
  skillUsage[unit.skillId].push(unit);
});

// Tìm skill data
const skillData = {};
skills.forEach(skill => {
  skillData[skill.id] = skill;
});

console.log(`🔗 ${Object.keys(skillUsage).length} skills đang được sử dụng\n`);

// Phân tích dựa trên mô tả (loại bỏ phần nguyên tố và biến thể)
console.log('🔍 PHÂN TÍCH DỰA TRÊN MÔ TẢ SKILL\n');

function normalizeDescription(desc) {
  if (!desc) return '';
  
  // Loại bỏ phần hiệu ứng nguyên tố
  let normalized = desc.replace(/[🔥💧🌪️🌙🪨🐝👻🌳]\s*Hiệu ứng\s+\w+:.*$/i, '');
  
  // Loại bỏ phần "Biến thể chuyên biệt cho..."
  normalized = normalized.replace(/Biến thể chuyên biệt cho.*$/i, '');
  
  // Loại bỏ phần "Mốc sao"
  normalized = normalized.replace(/Mốc sao:.*$/i, '');
  
  // Trim
  normalized = normalized.trim();
  
  // Loại bỏ dấu chấm cuối
  if (normalized.endsWith('.')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized.toLowerCase();
}

// Nhóm skills theo mô tả chuẩn hóa
const descriptionGroups = {};

Object.entries(skillUsage).forEach(([skillId, unitList]) => {
  const skill = skillData[skillId];
  if (!skill || !skill.descriptionVi) return;
  
  const normalizedDesc = normalizeDescription(skill.descriptionVi);
  
  if (!descriptionGroups[normalizedDesc]) {
    descriptionGroups[normalizedDesc] = {
      description: normalizedDesc,
      skills: []
    };
  }
  
  descriptionGroups[normalizedDesc].skills.push({
    skillId,
    skill,
    units: unitList
  });
});

// Lọc nhóm có > 1 skill
const duplicates = Object.values(descriptionGroups)
  .filter(g => g.skills.length > 1)
  .sort((a, b) => {
    const aTotal = a.skills.reduce((sum, s) => sum + s.units.length, 0);
    const bTotal = b.skills.reduce((sum, s) => sum + s.units.length, 0);
    return bTotal - aTotal;
  });

console.log(`Tìm thấy ${duplicates.length} nhóm có mô tả giống nhau\n`);

// Phân loại
duplicates.forEach(group => {
  const roleCount = {};
  const elementCount = {};
  let totalUnits = 0;
  
  group.skills.forEach(({ units }) => {
    units.forEach(unit => {
      totalUnits++;
      const role = unit.classVi || unit.classType;
      const element = unit.tribe;
      roleCount[role] = (roleCount[role] || 0) + 1;
      elementCount[element] = (elementCount[element] || 0) + 1;
    });
  });
  
  const maxRoleCount = Math.max(...Object.values(roleCount));
  
  group.totalUnits = totalUnits;
  group.roleCount = roleCount;
  group.elementCount = elementCount;
  group.maxRoleCount = maxRoleCount;
  group.severity = maxRoleCount >= 5 ? 'critical' : 'acceptable';
});

const criticalCount = duplicates.filter(g => g.severity === 'critical').length;
const acceptableCount = duplicates.filter(g => g.severity === 'acceptable').length;

console.log(`🔴 Nghiêm trọng (cùng vai trò ≥5): ${criticalCount}`);
console.log(`🟡 Chấp nhận được (khác vai trò hoặc <5): ${acceptableCount}\n`);

// In chi tiết
if (duplicates.length > 0) {
  console.log('📋 CHI TIẾT CÁC NHÓM TRÙNG LẶP:\n');
  
  duplicates.forEach((group, idx) => {
    const severity = group.severity === 'critical' ? '🔴' : '🟡';
    console.log(`${severity} ${idx + 1}. Mô tả: "${group.description.substring(0, 80)}..."`);
    console.log(`   Tổng: ${group.totalUnits} units từ ${group.skills.length} skills (max cùng vai trò: ${group.maxRoleCount})`);
    console.log(`   Vai trò: ${Object.entries(group.roleCount).map(([r, c]) => `${r}(${c})`).join(', ')}`);
    console.log(`   Nguyên tố: ${Object.entries(group.elementCount).map(([e, c]) => `${e}(${c})`).join(', ')}`);
    console.log(`   Skills: ${group.skills.map(s => s.skillId).join(', ')}`);
    console.log('');
  });
} else {
  console.log('✅ Không có skill nào có mô tả trùng lặp!\n');
  console.log('   Mỗi unit đều có skill độc đáo riêng.\n');
}

// Kiểm tra hiệu ứng nguyên tố
console.log('🎨 KIỂM TRA HIỆU ỨNG NGUYÊN TỐ:\n');

let withElement = 0;
let withoutElement = 0;

Object.entries(skillUsage).forEach(([skillId, unitList]) => {
  const skill = skillData[skillId];
  if (!skill) return;
  
  const hasElement = skill.descriptionVi && (
    skill.descriptionVi.includes('🔥') ||
    skill.descriptionVi.includes('💧') ||
    skill.descriptionVi.includes('🌪️') ||
    skill.descriptionVi.includes('🌙') ||
    skill.descriptionVi.includes('🪨') ||
    skill.descriptionVi.includes('🐝') ||
    skill.descriptionVi.includes('👻') ||
    skill.descriptionVi.includes('🌳')
  );
  
  if (hasElement) {
    withElement++;
  } else {
    withoutElement++;
  }
});

console.log(`✅ Có hiệu ứng nguyên tố: ${withElement}/${Object.keys(skillUsage).length}`);
console.log(`❌ Chưa có: ${withoutElement}/${Object.keys(skillUsage).length}\n`);

// Tạo báo cáo
const report = `# BÁO CÁO PHÂN TÍCH SKILL - HOÀN CHỈNH

**Thời gian**: ${new Date().toLocaleString('vi-VN')}

## 📊 Tổng quan

- **Tổng units**: ${units.length}
- **Tổng skills trong database**: ${skills.length}
- **Skills đang được sử dụng**: ${Object.keys(skillUsage).length}
- **Skills có hiệu ứng nguyên tố**: ${withElement}/${Object.keys(skillUsage).length} (${Math.round(withElement/Object.keys(skillUsage).length*100)}%)

## 🔍 Phân tích trùng lặp

- **Nhóm có mô tả giống nhau**: ${duplicates.length}
  - 🔴 Nghiêm trọng (cùng vai trò ≥5): ${criticalCount}
  - 🟡 Chấp nhận được (khác vai trò hoặc <5): ${acceptableCount}

${duplicates.length === 0 ? `
## ✅ KẾT QUẢ TUYỆT VỜI!

**Không có skill nào có mô tả trùng lặp!**

Mỗi unit đều có skill độc đáo riêng biệt. Kết hợp với hiệu ứng nguyên tố khác nhau, game đã có sự đa dạng rất cao.

### Điểm mạnh:
- ✅ 120 units với 120 skills hoàn toàn khác nhau
- ✅ ${withElement} skills đã có hiệu ứng nguyên tố
- ✅ Mỗi vai trò có nhiều lựa chọn đa dạng
- ✅ Mỗi nguyên tố có phong cách chơi riêng

### Cần làm tiếp:
${withoutElement > 0 ? `1. ⏳ Thêm hiệu ứng nguyên tố cho ${withoutElement} skills còn lại` : '1. ✅ Tất cả skills đã có hiệu ứng nguyên tố'}
2. ⏳ Implement logic hiệu ứng nguyên tố vào game code
3. ⏳ Test và balance
4. ⏳ Cập nhật tooltip hiển thị đầy đủ

` : `
## 📋 Chi tiết nhóm trùng lặp

${duplicates.map((group, idx) => {
  const severity = group.severity === 'critical' ? '🔴 NGHIÊM TRỌNG' : '🟡 Chấp nhận được';
  return `
### ${idx + 1}. ${severity}

**Mô tả**: ${group.description.substring(0, 200)}${group.description.length > 200 ? '...' : ''}

**Tổng**: ${group.totalUnits} units từ ${group.skills.length} skills  
**Max cùng vai trò**: ${group.maxRoleCount} units

**Phân bố vai trò**: ${Object.entries(group.roleCount).map(([r, c]) => `${r}(${c})`).join(', ')}  
**Phân bố nguyên tố**: ${Object.entries(group.elementCount).map(([e, c]) => `${e}(${c})`).join(', ')}

**Skills trong nhóm**:
${group.skills.map(({ skillId, units }) => `- ${skillId}: ${units.map(u => u.name).join(', ')}`).join('\n')}

${group.severity === 'critical' ? '**⚠️ Đề xuất**: Cần thiết kế lại skill để tạo sự khác biệt rõ ràng hơn.' : '**✅ Đánh giá**: Chấp nhận được vì khác vai trò hoặc số lượng ít. Hiệu ứng nguyên tố đã tạo sự khác biệt.'}
`;
}).join('\n---\n')}
`}

## 🎯 Hệ thống nguyên tố

### 🔥 Hỏa (FIRE)
- **Hiệu ứng**: Gây cháy lan tỏa
- **Scaling**: 15%→25%→35% tỷ lệ lan cháy sang đồng minh cạnh bên

### 💧 Thủy (TIDE)
- **Hiệu ứng**: Giảm né tránh
- **Scaling**: 15%→25%→35% giảm né tránh

### 🌪️ Phong (WIND)
- **Hiệu ứng**: Giảm chính xác
- **Scaling**: 15%→25%→35% giảm chính xác

### 🌙 Dạ (NIGHT)
- **Hiệu ứng**: Chảy máu + Giảm hồi máu
- **Scaling**: Chảy máu theo thời gian + giảm 25% hồi máu

### 🪨 Nham (STONE)
- **Hiệu ứng**: Giảm giáp
- **Scaling**: 20%→30%→40% giảm giáp

### 🐝 Bầy (SWARM)
- **Hiệu ứng**: Tăng sức mạnh theo số lượng
- **Scaling**: Tăng dần khi có nhiều đồng minh cùng tộc

### 👻 Linh (SPIRIT)
- **Hiệu ứng**: Hiệu ứng linh hồn đặc biệt
- **Scaling**: Tăng theo cấp sao

### 🌳 Mộc (WOOD)
- **Hiệu ứng**: Sinh mệnh tự nhiên
- **Scaling**: Tăng theo cấp sao

## 📐 Công thức Hit Chance

\`\`\`
Tỷ lệ hụt = 100 - Né tránh + (Chính xác - 100)
\`\`\`

**Phạm vi chỉ số**:
- Chính xác: 80-125%
- Né tránh: 5-35%
  - Con nhanh (sói, hổ, báo): 25-35%
  - Con chậm (voi, rắn): 5-10%

---

**Ghi chú**: 
- Skills có thể giống nhau về cơ chế nếu khác vai trò và có hiệu ứng nguyên tố khác nhau
- Ví dụ: Đấu sĩ và Cung thủ có thể dùng skill tấn công hình chữ thập, nhưng một gây cháy, một gây giảm né tránh
- Hiệu ứng nguyên tố tạo ra sự đa dạng và chiến thuật cho game
`;

fs.writeFileSync('ROLE_SKILL_ANALYSIS.md', report, 'utf-8');
console.log('✅ Đã cập nhật ROLE_SKILL_ANALYSIS.md\n');

console.log('=== HOÀN THÀNH ===');
console.log(`\n📊 Tóm tắt:`);
console.log(`   - Skills độc đáo: ${Object.keys(skillUsage).length - duplicates.reduce((sum, g) => sum + g.skills.length, 0) + duplicates.length}`);
console.log(`   - Nhóm trùng lặp: ${duplicates.length} (${criticalCount} nghiêm trọng, ${acceptableCount} chấp nhận được)`);
console.log(`   - Có hiệu ứng nguyên tố: ${withElement}/${Object.keys(skillUsage).length}`);
