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

// Mapping nguyên tố
const ELEMENT_INFO = {
  FIRE: {
    emoji: '🔥',
    nameVi: 'Hỏa',
    effect: 'Gây cháy',
    description: 'Gây sát thương đốt theo thời gian và có tỷ lệ lan sang đồng minh cạnh bên của kẻ địch',
    scaling: '15%→25%→35% tỷ lệ lan cháy'
  },
  TIDE: {
    emoji: '💧',
    nameVi: 'Thủy',
    effect: 'Giảm né tránh',
    description: 'Làm ướt kẻ địch, giảm khả năng né tránh',
    scaling: '15%→25%→35% giảm né tránh'
  },
  WIND: {
    emoji: '🌪️',
    nameVi: 'Phong',
    effect: 'Giảm chính xác',
    description: 'Tạo gió xoáy làm mất thăng bằng, giảm độ chính xác',
    scaling: '15%→25%→35% giảm chính xác'
  },
  NIGHT: {
    emoji: '🌙',
    nameVi: 'Dạ',
    effect: 'Chảy máu + Giảm hồi máu',
    description: 'Gây chảy máu và giảm 25% hiệu quả hồi máu',
    scaling: 'Chảy máu theo thời gian + giảm 25% hồi máu'
  },
  STONE: {
    emoji: '🪨',
    nameVi: 'Nham',
    effect: 'Giảm giáp',
    description: 'Phá vỡ giáp, giảm phòng thủ theo phần trăm',
    scaling: '20%→30%→40% giảm giáp'
  },
  SWARM: {
    emoji: '🐝',
    nameVi: 'Bầy',
    effect: 'Hiệu ứng bầy đàn',
    description: 'Tăng sức mạnh khi có nhiều đồng minh cùng tộc',
    scaling: 'Tăng dần theo số lượng'
  }
};

console.log('=== PHÂN TÍCH TOÀN DIỆN SKILL VÀ NGUYÊN TỐ ===\n');

// Đọc dữ liệu
const units = readCSV('data/units.csv');
const skills = readCSV('data/skills.csv');

console.log(`📊 Tổng quan:`);
console.log(`   - Units: ${units.length}`);
console.log(`   - Skills: ${skills.length}\n`);

// Tạo map skill -> units sử dụng
const skillUsage = {};
skills.forEach(skill => {
  skillUsage[skill.id] = {
    skill: skill,
    users: []
  };
});

units.forEach(unit => {
  if (unit.skillId && skillUsage[unit.skillId]) {
    skillUsage[unit.skillId].users.push(unit);
  }
});

// Phân tích trùng lặp theo mô tả và effect
console.log('🔍 PHÂN TÍCH SKILL TRÙNG LẶP\n');

const duplicateGroups = {};

Object.values(skillUsage).forEach(({ skill, users }) => {
  if (users.length === 0) return;
  
  // Tạo key dựa trên effect và actionPattern
  const key = `${skill.effect}_${skill.actionPattern}_${skill.damageType}`;
  
  if (!duplicateGroups[key]) {
    duplicateGroups[key] = {
      effect: skill.effect,
      actionPattern: skill.actionPattern,
      damageType: skill.damageType,
      skills: []
    };
  }
  
  duplicateGroups[key].skills.push({ skill, users });
});

// Lọc các nhóm có > 1 skill
const actualDuplicates = Object.values(duplicateGroups).filter(g => g.skills.length > 1);

console.log(`Tìm thấy ${actualDuplicates.length} nhóm skill có cùng effect/pattern\n`);

// Phân loại theo vai trò
let criticalDuplicates = [];
let acceptableDuplicates = [];

actualDuplicates.forEach(group => {
  // Đếm units theo vai trò
  const roleCount = {};
  const elementCount = {};
  
  group.skills.forEach(({ users }) => {
    users.forEach(unit => {
      const role = unit.classVi || unit.classType;
      const element = unit.tribe;
      roleCount[role] = (roleCount[role] || 0) + 1;
      elementCount[element] = (elementCount[element] || 0) + 1;
    });
  });
  
  // Kiểm tra có vai trò nào >= 5 units không
  const maxRoleCount = Math.max(...Object.values(roleCount));
  const totalUnits = group.skills.reduce((sum, { users }) => sum + users.length, 0);
  
  if (maxRoleCount >= 5) {
    criticalDuplicates.push({ ...group, roleCount, elementCount, totalUnits, maxRoleCount });
  } else {
    acceptableDuplicates.push({ ...group, roleCount, elementCount, totalUnits, maxRoleCount });
  }
});

console.log(`🔴 Nghiêm trọng (cùng vai trò ≥5 units): ${criticalDuplicates.length}`);
console.log(`🟡 Chấp nhận được (khác vai trò hoặc <5 units): ${acceptableDuplicates.length}\n`);

// Chi tiết các nhóm nghiêm trọng
if (criticalDuplicates.length > 0) {
  console.log('📋 CHI TIẾT NHÓM NGHIÊM TRỌNG:\n');
  
  criticalDuplicates.forEach((group, idx) => {
    console.log(`${idx + 1}. Effect: ${group.effect} | Pattern: ${group.actionPattern}`);
    console.log(`   Tổng: ${group.totalUnits} units`);
    console.log(`   Vai trò:`);
    Object.entries(group.roleCount).forEach(([role, count]) => {
      console.log(`      - ${role}: ${count} units`);
    });
    console.log(`   Nguyên tố:`);
    Object.entries(group.elementCount).forEach(([element, count]) => {
      const info = ELEMENT_INFO[element] || { emoji: '❓', nameVi: element };
      console.log(`      - ${info.emoji} ${info.nameVi}: ${count} units`);
    });
    console.log('');
  });
}

// Chi tiết các nhóm chấp nhận được
if (acceptableDuplicates.length > 0) {
  console.log('📋 CHI TIẾT NHÓM CHẤP NHẬN ĐƯỢC (10 nhóm đầu):\n');
  
  acceptableDuplicates.slice(0, 10).forEach((group, idx) => {
    console.log(`${idx + 1}. Effect: ${group.effect} | Pattern: ${group.actionPattern}`);
    console.log(`   Tổng: ${group.totalUnits} units (max cùng vai trò: ${group.maxRoleCount})`);
    console.log(`   Vai trò:`);
    Object.entries(group.roleCount).forEach(([role, count]) => {
      console.log(`      - ${role}: ${count} units`);
    });
    console.log(`   Nguyên tố:`);
    Object.entries(group.elementCount).forEach(([element, count]) => {
      const info = ELEMENT_INFO[element] || { emoji: '❓', nameVi: element };
      console.log(`      - ${info.emoji} ${info.nameVi}: ${count} units`);
    });
    console.log('');
  });
}

// Kiểm tra skill đã có mô tả nguyên tố chưa
console.log('\n🎨 KIỂM TRA NGUYÊN TỐ TRONG MÔ TẢ SKILL\n');

let skillsWithElement = 0;
let skillsWithoutElement = 0;

Object.values(skillUsage).forEach(({ skill, users }) => {
  if (users.length === 0) return;
  
  const hasElementEmoji = skill.descriptionVi && (
    skill.descriptionVi.includes('🔥') ||
    skill.descriptionVi.includes('💧') ||
    skill.descriptionVi.includes('🌪️') ||
    skill.descriptionVi.includes('🌙') ||
    skill.descriptionVi.includes('🪨') ||
    skill.descriptionVi.includes('🐝')
  );
  
  if (hasElementEmoji) {
    skillsWithElement++;
  } else {
    skillsWithoutElement++;
  }
});

console.log(`✅ Có nguyên tố: ${skillsWithElement}/${skills.length}`);
console.log(`❌ Chưa có: ${skillsWithoutElement}/${skills.length}`);

// Tạo báo cáo markdown
const report = `# BÁO CÁO PHÂN TÍCH SKILL - CẬP NHẬT

**Thời gian**: ${new Date().toLocaleString('vi-VN')}

## 📊 Tổng quan

- **Tổng units**: ${units.length}
- **Tổng skills**: ${skills.length}
- **Skills có mô tả nguyên tố**: ${skillsWithElement}/${skills.length} (${Math.round(skillsWithElement/skills.length*100)}%)
- **Nhóm skill trùng lặp**: ${actualDuplicates.length}
  - 🔴 Nghiêm trọng (cùng vai trò ≥5): ${criticalDuplicates.length}
  - 🟡 Chấp nhận được (khác vai trò): ${acceptableDuplicates.length}

## 🎯 Hệ thống nguyên tố

${Object.entries(ELEMENT_INFO).map(([key, info]) => `
### ${info.emoji} ${info.nameVi} (${key})
- **Hiệu ứng**: ${info.effect}
- **Mô tả**: ${info.description}
- **Scaling**: ${info.scaling}
`).join('\n')}

## 🔴 Nhóm trùng lặp nghiêm trọng (${criticalDuplicates.length})

${criticalDuplicates.length === 0 ? '_Không có nhóm nghiêm trọng_' : criticalDuplicates.map((group, idx) => `
### ${idx + 1}. ${group.effect} - ${group.actionPattern}

**Tổng**: ${group.totalUnits} units

**Phân bố vai trò**:
${Object.entries(group.roleCount).map(([role, count]) => `- ${role}: ${count} units`).join('\n')}

**Phân bố nguyên tố**:
${Object.entries(group.elementCount).map(([element, count]) => {
  const info = ELEMENT_INFO[element] || { emoji: '❓', nameVi: element };
  return `- ${info.emoji} ${info.nameVi}: ${count} units`;
}).join('\n')}

**Đề xuất**: Cần thiết kế lại skill hoặc thêm biến thể rõ ràng hơn.
`).join('\n')}

## 🟡 Nhóm trùng lặp chấp nhận được (${acceptableDuplicates.length})

_Các nhóm này có thể chấp nhận vì khác vai trò hoặc số lượng ít. Tuy nhiên nên thêm hiệu ứng nguyên tố để tăng sự đa dạng._

${acceptableDuplicates.slice(0, 15).map((group, idx) => `
### ${idx + 1}. ${group.effect} - ${group.actionPattern}

**Tổng**: ${group.totalUnits} units (max cùng vai trò: ${group.maxRoleCount})

**Vai trò**: ${Object.entries(group.roleCount).map(([r, c]) => `${r}(${c})`).join(', ')}

**Nguyên tố**: ${Object.entries(group.elementCount).map(([e, c]) => {
  const info = ELEMENT_INFO[e] || { emoji: '❓', nameVi: e };
  return `${info.emoji}${info.nameVi}(${c})`;
}).join(', ')}
`).join('\n')}

${acceptableDuplicates.length > 15 ? `\n_... và ${acceptableDuplicates.length - 15} nhóm khác_\n` : ''}

## ✅ Kết luận

### Đã hoàn thành:
- ✅ Phân tích ${actualDuplicates.length} nhóm skill trùng lặp
- ✅ Phân loại theo mức độ nghiêm trọng
- ✅ Xác định ${criticalDuplicates.length} nhóm cần xử lý ưu tiên

### Cần làm tiếp:
1. ${skillsWithoutElement > 0 ? `⏳ Thêm mô tả nguyên tố cho ${skillsWithoutElement} skills` : '✅ Đã có mô tả nguyên tố cho tất cả skills'}
2. ${criticalDuplicates.length > 0 ? `⏳ Thiết kế lại ${criticalDuplicates.length} nhóm nghiêm trọng` : '✅ Không có nhóm nghiêm trọng'}
3. ⏳ Implement logic hiệu ứng nguyên tố vào game
4. ⏳ Test và balance

---

**Ghi chú**: 
- Skills có thể trùng effect/pattern nếu khác vai trò và có hiệu ứng nguyên tố khác nhau
- Ví dụ: Đấu sĩ và Cung thủ có thể dùng skill tấn công hình chữ thập, nhưng một gây cháy, một gây giảm né tránh
`;

fs.writeFileSync('SKILL_ANALYSIS_COMPREHENSIVE.md', report, 'utf-8');
console.log('\n✅ Đã tạo SKILL_ANALYSIS_COMPREHENSIVE.md');

console.log('\n=== HOÀN THÀNH ===');
