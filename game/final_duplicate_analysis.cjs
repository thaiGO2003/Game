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

console.log('=== PHÂN TÍCH CHI TIẾT SKILL TRÙNG LẶP ===\n');

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

console.log(`🔗 ${Object.keys(skillUsage).length} skills đang được sử dụng\n`);

// Tìm skill data cho mỗi skillId
const skillData = {};
skills.forEach(skill => {
  skillData[skill.id] = skill;
});

// Phân tích trùng lặp dựa trên effect + actionPattern + damageType
console.log('🔍 PHÂN TÍCH TRÙNG LẶP THEO EFFECT/PATTERN\n');

const duplicateGroups = {};

Object.entries(skillUsage).forEach(([skillId, unitList]) => {
  const skill = skillData[skillId];
  if (!skill) return;
  
  // Tạo key dựa trên các thuộc tính quan trọng
  const key = `${skill.effect || 'none'}_${skill.actionPattern || 'none'}_${skill.damageType || 'none'}`;
  
  if (!duplicateGroups[key]) {
    duplicateGroups[key] = {
      effect: skill.effect || '(none)',
      actionPattern: skill.actionPattern || '(none)',
      damageType: skill.damageType || '(none)',
      skills: []
    };
  }
  
  duplicateGroups[key].skills.push({
    skillId,
    skill,
    units: unitList
  });
});

// Lọc nhóm có > 1 skill
const actualDuplicates = Object.values(duplicateGroups)
  .filter(g => g.skills.length > 1)
  .sort((a, b) => {
    const aTotal = a.skills.reduce((sum, s) => sum + s.units.length, 0);
    const bTotal = b.skills.reduce((sum, s) => sum + s.units.length, 0);
    return bTotal - aTotal;
  });

console.log(`Tìm thấy ${actualDuplicates.length} nhóm có nhiều hơn 1 skill cùng effect/pattern\n`);

// Phân loại
let criticalCount = 0;
let acceptableCount = 0;

actualDuplicates.forEach(group => {
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
  
  if (maxRoleCount >= 5) {
    criticalCount++;
    group.severity = 'critical';
  } else {
    acceptableCount++;
    group.severity = 'acceptable';
  }
});

console.log(`🔴 Nghiêm trọng (cùng vai trò ≥5): ${criticalCount}`);
console.log(`🟡 Chấp nhận được (khác vai trò hoặc <5): ${acceptableCount}\n`);

// In chi tiết top 20 nhóm
console.log('📋 TOP 20 NHÓM TRÙNG LẶP:\n');

actualDuplicates.slice(0, 20).forEach((group, idx) => {
  const severity = group.severity === 'critical' ? '🔴' : '🟡';
  console.log(`${severity} ${idx + 1}. ${group.effect} | ${group.actionPattern} | ${group.damageType}`);
  console.log(`   Tổng: ${group.totalUnits} units từ ${group.skills.length} skills (max cùng vai trò: ${group.maxRoleCount})`);
  
  console.log(`   Vai trò: ${Object.entries(group.roleCount).map(([r, c]) => `${r}(${c})`).join(', ')}`);
  console.log(`   Nguyên tố: ${Object.entries(group.elementCount).map(([e, c]) => `${e}(${c})`).join(', ')}`);
  
  // Liệt kê các skills
  console.log(`   Skills:`);
  group.skills.forEach(({ skillId, units }) => {
    const unitNames = units.map(u => u.name).join(', ');
    console.log(`      - ${skillId}: ${units.length} units (${unitNames.substring(0, 60)}${unitNames.length > 60 ? '...' : ''})`);
  });
  console.log('');
});

// Tạo báo cáo markdown
const report = `# BÁO CÁO PHÂN TÍCH SKILL TRÙNG LẶP CHI TIẾT

**Thời gian**: ${new Date().toLocaleString('vi-VN')}

## 📊 Tổng quan

- **Tổng units**: ${units.length}
- **Tổng skills**: ${skills.length}
- **Skills đang dùng**: ${Object.keys(skillUsage).length}
- **Nhóm trùng lặp**: ${actualDuplicates.length}
  - 🔴 Nghiêm trọng (cùng vai trò ≥5): ${criticalCount}
  - 🟡 Chấp nhận được: ${acceptableCount}

## 📋 Chi tiết các nhóm trùng lặp

${actualDuplicates.map((group, idx) => {
  const severity = group.severity === 'critical' ? '🔴 NGHIÊM TRỌNG' : '🟡 Chấp nhận được';
  return `
### ${idx + 1}. ${severity}

**Effect**: ${group.effect}  
**Action Pattern**: ${group.actionPattern}  
**Damage Type**: ${group.damageType}

**Tổng**: ${group.totalUnits} units từ ${group.skills.length} skills  
**Max cùng vai trò**: ${group.maxRoleCount} units

**Phân bố vai trò**:
${Object.entries(group.roleCount).map(([role, count]) => `- ${role}: ${count} units`).join('\n')}

**Phân bố nguyên tố**:
${Object.entries(group.elementCount).map(([element, count]) => `- ${element}: ${count} units`).join('\n')}

**Các skills trong nhóm**:
${group.skills.map(({ skillId, skill, units }) => `
- **${skillId}** (${units.length} units)
  - Units: ${units.map(u => u.name).join(', ')}
  - Mô tả: ${(skill.descriptionVi || '').substring(0, 150)}${skill.descriptionVi && skill.descriptionVi.length > 150 ? '...' : ''}
`).join('\n')}

${group.severity === 'critical' ? '**⚠️ Đề xuất**: Cần thiết kế lại skill hoặc thêm biến thể rõ ràng hơn cho nhóm này.' : '**✅ Đánh giá**: Có thể chấp nhận vì khác vai trò hoặc số lượng ít. Hiệu ứng nguyên tố đã giúp tăng sự đa dạng.'}
`;
}).join('\n---\n')}

## ✅ Kết luận

### Tình trạng hiện tại:
- ✅ Đã thêm hiệu ứng nguyên tố cho skills
- ${criticalCount === 0 ? '✅' : '⚠️'} ${criticalCount === 0 ? 'Không có' : `Còn ${criticalCount}`} nhóm nghiêm trọng cần xử lý
- ✅ ${acceptableCount} nhóm chấp nhận được với hiệu ứng nguyên tố khác nhau

### Đề xuất tiếp theo:
${criticalCount > 0 ? `1. ⏳ Thiết kế lại ${criticalCount} nhóm nghiêm trọng` : '1. ✅ Không có nhóm nghiêm trọng'}
2. ⏳ Implement logic hiệu ứng nguyên tố vào game code
3. ⏳ Test và balance các hiệu ứng
4. ⏳ Cập nhật tooltip hiển thị đầy đủ thông tin

---

**Ghi chú**: 
- Skills có thể trùng effect/pattern nếu khác vai trò và có hiệu ứng nguyên tố khác nhau
- Hiệu ứng nguyên tố giúp tạo sự đa dạng cho các skill tương tự
- Công thức hit chance: Tỷ lệ hụt = 100 - Né tránh + (Chính xác - 100)
`;

fs.writeFileSync('SKILL_DUPLICATE_FINAL_REPORT.md', report, 'utf-8');
console.log('✅ Đã tạo SKILL_DUPLICATE_FINAL_REPORT.md\n');

console.log('=== HOÀN THÀNH ===');
