const fs = require('fs');
const path = require('path');

// Đọc CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
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
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] || '';
    });
    return obj;
  });
}

// Ghi CSV
function writeCSV(filePath, data, headers) {
  const lines = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape nếu có dấu phẩy hoặc dấu ngoặc kép
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  });
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

console.log('=== BẮT ĐẦU QUY TRÌNH TỰ ĐỘNG SỬA LỖI ===\n');

// Bước 1: Đọc dữ liệu
console.log('📖 Bước 1: Đọc dữ liệu...');
const units = parseCSV(path.join(__dirname, 'data', 'units.csv'));
const skills = parseCSV(path.join(__dirname, 'data', 'skills.csv'));

const skillMap = {};
skills.forEach(skill => {
  skillMap[skill.id] = skill;
});

console.log(`   ✓ Đọc ${units.length} units và ${skills.length} skills\n`);

// Bước 2: Phân tích vấn đề vai trò
console.log('🔍 Bước 2: Phân tích vai trò không phù hợp...');

const roleIssues = [];

units.forEach(unit => {
  const skill = skillMap[unit.skillId];
  if (!skill) return;
  
  const role = unit.classType;
  let issue = null;
  
  // Kiểm tra Đỡ đòn
  if (role === 'TANKER') {
    const isTankSkill = skill.shieldBase || skill.tauntTurns || skill.reflectPct || 
                        skill.armorBuff || skill.mdefBuff ||
                        skill.effect?.includes('protection') || skill.effect?.includes('counter') || 
                        skill.effect?.includes('reflect') || skill.effect?.includes('def_buff');
    
    if (!isTankSkill && skill.damageType && !skill.effect?.includes('shield')) {
      issue = {
        unit: unit,
        currentRole: role,
        suggestedRole: 'FIGHTER',
        reason: 'Đỡ đòn nhưng skill gây sát thương không có yếu tố bảo vệ'
      };
    }
  }
  
  // Kiểm tra Đấu sĩ
  if (role === 'FIGHTER') {
    const isFighterSkill = skill.effect?.includes('cone') || skill.effect?.includes('column') || 
                           skill.effect?.includes('cleave') || skill.effect?.includes('row') ||
                           skill.armorBreak || skill.damageType === 'true';
    
    const isSupportSkill = skill.tauntTurns || skill.atkBuff || skill.evadeBuff || 
                          skill.effect?.includes('assist') || skill.effect?.includes('buff');
    
    if (isSupportSkill && !isFighterSkill) {
      issue = {
        unit: unit,
        currentRole: role,
        suggestedRole: skill.tauntTurns ? 'TANKER' : 'SUPPORT',
        reason: 'Đấu sĩ nhưng skill thiên về hỗ trợ/khiêu khích'
      };
    }
  }
  
  // Kiểm tra Sát thủ
  if (role === 'ASSASSIN') {
    const isAssassinSkill = skill.actionPattern === 'ASSASSIN_BACK' || 
                           skill.effect?.includes('execute') || skill.lifesteal;
    
    if (!isAssassinSkill && (skill.atkBuff || skill.effect?.includes('assist'))) {
      issue = {
        unit: unit,
        currentRole: role,
        suggestedRole: 'SUPPORT',
        reason: 'Sát thủ nhưng skill buff đồng minh'
      };
    }
  }
  
  if (issue) {
    roleIssues.push(issue);
  }
});

console.log(`   ✓ Tìm thấy ${roleIssues.length} unit có vấn đề vai trò\n`);

if (roleIssues.length > 0) {
  console.log('📋 Danh sách unit cần sửa vai trò:\n');
  roleIssues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue.unit.icon} ${issue.unit.name}`);
    console.log(`      ${issue.currentRole} → ${issue.suggestedRole}`);
    console.log(`      Lý do: ${issue.reason}\n`);
  });
}

// Bước 3: Áp dụng sửa vai trò
console.log('✏️ Bước 3: Áp dụng sửa vai trò...');

const roleMapping = {
  'TANKER': 'Đỡ đòn',
  'FIGHTER': 'Đấu sĩ',
  'ASSASSIN': 'Sát thủ',
  'ARCHER': 'Xạ thủ',
  'MAGE': 'Pháp sư',
  'SUPPORT': 'Hỗ trợ'
};

let roleChanges = 0;
roleIssues.forEach(issue => {
  const unit = units.find(u => u.id === issue.unit.id);
  if (unit) {
    unit.classType = issue.suggestedRole;
    unit.classVi = roleMapping[issue.suggestedRole];
    roleChanges++;
  }
});

console.log(`   ✓ Đã sửa ${roleChanges} vai trò\n`);

// Bước 4: Phân tích skill trùng lặp
console.log('🔍 Bước 4: Phân tích skill trùng lặp...');

const skillGroups = {};
skills.forEach(skill => {
  const key = skill.effect || 'no_effect';
  if (!skillGroups[key]) {
    skillGroups[key] = [];
  }
  skillGroups[key].push(skill);
});

const duplicates = [];
Object.keys(skillGroups).forEach(effectKey => {
  const skillList = skillGroups[effectKey];
  if (skillList.length > 1 && effectKey !== 'no_effect') {
    const unitsUsingSkill = [];
    skillList.forEach(skill => {
      const unitsWithSkill = units.filter(u => u.skillId === skill.id);
      unitsWithSkill.forEach(unit => {
        unitsUsingSkill.push({ unit, skill });
      });
    });
    
    if (unitsUsingSkill.length > 1) {
      duplicates.push({
        effect: effectKey,
        count: unitsUsingSkill.length,
        units: unitsUsingSkill
      });
    }
  }
});

duplicates.sort((a, b) => b.count - a.count);

console.log(`   ✓ Tìm thấy ${duplicates.length} nhóm skill trùng lặp\n`);

// Hiển thị top 10 nhóm trùng lặp nghiêm trọng nhất
console.log('📊 Top 10 nhóm skill trùng lặp nghiêm trọng:\n');
duplicates.slice(0, 10).forEach((dup, index) => {
  console.log(`   ${index + 1}. ${dup.effect} - ${dup.count} units`);
  
  // Nhóm theo vai trò
  const byRole = {};
  dup.units.forEach(u => {
    const role = u.unit.classVi;
    if (!byRole[role]) byRole[role] = 0;
    byRole[role]++;
  });
  
  const roleStr = Object.keys(byRole).map(r => `${r}(${byRole[r]})`).join(', ');
  console.log(`      Vai trò: ${roleStr}`);
  
  // Kiểm tra có cùng vai trò không
  if (Object.keys(byRole).length === 1) {
    console.log(`      ⚠️ Tất cả cùng vai trò - CẦN THIẾT KẾ LẠI`);
  } else {
    console.log(`      ✓ Khác vai trò - Có thể thêm hiệu ứng nguyên tố`);
  }
  console.log('');
});

// Bước 5: Lưu kết quả
console.log('💾 Bước 5: Lưu kết quả...');

// Backup file gốc
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
fs.copyFileSync(
  path.join(__dirname, 'data', 'units.csv'),
  path.join(__dirname, 'data', `units.csv.backup.${timestamp}`)
);

// Lưu units đã sửa
const unitHeaders = Object.keys(units[0]);
writeCSV(path.join(__dirname, 'data', 'units.csv'), units, unitHeaders);

console.log(`   ✓ Đã lưu units.csv`);
console.log(`   ✓ Backup: units.csv.backup.${timestamp}\n`);

// Bước 6: Tạo báo cáo
console.log('📝 Bước 6: Tạo báo cáo...');

let report = `# BÁO CÁO TỰ ĐỘNG SỬA LỖI SKILL VÀ VAI TRÒ\n\n`;
report += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n\n`;
report += `## Tổng quan\n\n`;
report += `- Tổng số units: ${units.length}\n`;
report += `- Tổng số skills: ${skills.length}\n`;
report += `- Số vai trò đã sửa: ${roleChanges}\n`;
report += `- Số nhóm skill trùng lặp: ${duplicates.length}\n\n`;

report += `## Chi tiết thay đổi vai trò\n\n`;
if (roleIssues.length > 0) {
  roleIssues.forEach((issue, index) => {
    report += `### ${index + 1}. ${issue.unit.icon} ${issue.unit.name}\n\n`;
    report += `- **Vai trò cũ**: ${roleMapping[issue.currentRole]}\n`;
    report += `- **Vai trò mới**: ${roleMapping[issue.suggestedRole]}\n`;
    report += `- **Lý do**: ${issue.reason}\n`;
    report += `- **Skill**: ${issue.unit.skillId}\n\n`;
  });
} else {
  report += `Không có thay đổi vai trò.\n\n`;
}

report += `## Skill trùng lặp cần xử lý\n\n`;
report += `### Nhóm trùng lặp nghiêm trọng (≥5 units cùng vai trò)\n\n`;

const criticalDuplicates = duplicates.filter(dup => {
  const byRole = {};
  dup.units.forEach(u => {
    const role = u.unit.classVi;
    if (!byRole[role]) byRole[role] = 0;
    byRole[role]++;
  });
  return Object.keys(byRole).length === 1 && dup.count >= 5;
});

if (criticalDuplicates.length > 0) {
  criticalDuplicates.forEach((dup, index) => {
    report += `#### ${index + 1}. ${dup.effect} (${dup.count} units)\n\n`;
    report += `**Đề xuất**: Thiết kế lại skill hoàn toàn khác nhau cho từng unit\n\n`;
    report += `**Danh sách units**:\n`;
    dup.units.forEach(u => {
      report += `- ${u.unit.icon} ${u.unit.name} (${u.unit.classVi} - Bậc ${u.unit.tier})\n`;
    });
    report += `\n`;
  });
} else {
  report += `Không có nhóm trùng lặp nghiêm trọng.\n\n`;
}

report += `### Nhóm trùng lặp trung bình (khác vai trò)\n\n`;
report += `**Đề xuất**: Thêm hiệu ứng nguyên tố để phân biệt\n\n`;

const moderateDuplicates = duplicates.filter(dup => {
  const byRole = {};
  dup.units.forEach(u => {
    const role = u.unit.classVi;
    if (!byRole[role]) byRole[role] = 0;
    byRole[role]++;
  });
  return Object.keys(byRole).length > 1;
}).slice(0, 10);

moderateDuplicates.forEach((dup, index) => {
  report += `#### ${index + 1}. ${dup.effect} (${dup.count} units)\n\n`;
  
  const byRole = {};
  dup.units.forEach(u => {
    const role = u.unit.classVi;
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(u.unit);
  });
  
  Object.keys(byRole).forEach(role => {
    report += `**${role}**:\n`;
    byRole[role].forEach(unit => {
      report += `- ${unit.icon} ${unit.name} (${unit.tribeVi})\n`;
    });
    report += `\n`;
  });
});

report += `## Bước tiếp theo\n\n`;
report += `1. ✅ Đã sửa vai trò không phù hợp\n`;
report += `2. ⏳ Cần thêm hiệu ứng nguyên tố cho skill trùng lặp\n`;
report += `3. ⏳ Cần thiết kế lại skill cho nhóm trùng lặp nghiêm trọng\n`;
report += `4. ⏳ Cần cập nhật tooltip và mô tả skill\n\n`;

fs.writeFileSync(path.join(__dirname, 'AUTO_FIX_REPORT.md'), report);

console.log(`   ✓ Đã tạo báo cáo: AUTO_FIX_REPORT.md\n`);

console.log('=== HOÀN THÀNH ===\n');
console.log('📊 Tóm tắt:');
console.log(`   - Đã sửa ${roleChanges} vai trò`);
console.log(`   - Tìm thấy ${duplicates.length} nhóm skill trùng lặp`);
console.log(`   - Trong đó ${criticalDuplicates.length} nhóm cần thiết kế lại`);
console.log(`\n💡 Xem chi tiết trong AUTO_FIX_REPORT.md`);
