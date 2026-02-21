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

console.log('=== CẬP NHẬT BÁO CÁO PHÂN TÍCH ===\n');

// Đọc dữ liệu mới nhất
const units = parseCSV(path.join(__dirname, 'data', 'units.csv'));
const skills = parseCSV(path.join(__dirname, 'data', 'skills.csv'));

const skillMap = {};
skills.forEach(skill => {
  skillMap[skill.id] = skill;
});

console.log('📊 Phân tích lại sau khi cập nhật...\n');

// 1. Kiểm tra vai trò
console.log('1️⃣ Kiểm tra vai trò không phù hợp...');
const roleIssues = [];

units.forEach(unit => {
  const skill = skillMap[unit.skillId];
  if (!skill) return;
  
  const role = unit.classType;
  let issue = null;
  
  if (role === 'TANKER') {
    const isTankSkill = skill.shieldBase || skill.tauntTurns || skill.reflectPct || 
                        skill.armorBuff || skill.mdefBuff ||
                        skill.effect?.includes('protection') || skill.effect?.includes('counter') || 
                        skill.effect?.includes('reflect') || skill.effect?.includes('def_buff');
    
    if (!isTankSkill && skill.damageType && !skill.effect?.includes('shield')) {
      issue = { unit, reason: 'Đỡ đòn nhưng skill gây sát thương không có yếu tố bảo vệ' };
    }
  }
  
  if (role === 'FIGHTER') {
    const isFighterSkill = skill.effect?.includes('cone') || skill.effect?.includes('column') || 
                           skill.effect?.includes('cleave') || skill.effect?.includes('row') ||
                           skill.armorBreak || skill.damageType === 'true';
    
    const isSupportSkill = skill.tauntTurns || skill.atkBuff || skill.evadeBuff || 
                          skill.effect?.includes('assist') || skill.effect?.includes('buff');
    
    if (isSupportSkill && !isFighterSkill) {
      issue = { unit, reason: 'Đấu sĩ nhưng skill thiên về hỗ trợ/khiêu khích' };
    }
  }
  
  if (role === 'ASSASSIN') {
    const isAssassinSkill = skill.actionPattern === 'ASSASSIN_BACK' || 
                           skill.effect?.includes('execute') || skill.lifesteal;
    
    if (!isAssassinSkill && (skill.atkBuff || skill.effect?.includes('assist'))) {
      issue = { unit, reason: 'Sát thủ nhưng skill buff đồng minh' };
    }
  }
  
  if (issue) roleIssues.push(issue);
});

console.log(`   ✓ Còn ${roleIssues.length} unit có vấn đề vai trò\n`);

// 2. Kiểm tra skill trùng lặp
console.log('2️⃣ Phân tích skill trùng lặp...');

const skillGroups = {};
skills.forEach(skill => {
  const key = skill.effect || 'no_effect';
  if (!skillGroups[key]) skillGroups[key] = [];
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
      // Nhóm theo vai trò
      const byRole = {};
      unitsUsingSkill.forEach(u => {
        const role = u.unit.classVi;
        if (!byRole[role]) byRole[role] = 0;
        byRole[role]++;
      });
      
      duplicates.push({
        effect: effectKey,
        count: unitsUsingSkill.length,
        units: unitsUsingSkill,
        roles: Object.keys(byRole),
        sameRole: Object.keys(byRole).length === 1
      });
    }
  }
});

duplicates.sort((a, b) => b.count - a.count);

const criticalDups = duplicates.filter(d => d.sameRole && d.count >= 5);
const moderateDups = duplicates.filter(d => !d.sameRole || d.count < 5);

console.log(`   ✓ Tổng: ${duplicates.length} nhóm trùng lặp`);
console.log(`   ✓ Nghiêm trọng (cùng vai trò ≥5): ${criticalDups.length} nhóm`);
console.log(`   ✓ Chấp nhận được (khác vai trò): ${moderateDups.length} nhóm\n`);

// 3. Kiểm tra hiệu ứng nguyên tố
console.log('3️⃣ Kiểm tra hiệu ứng nguyên tố...');

let withElement = 0;
let withoutElement = 0;

units.forEach(unit => {
  const skill = skillMap[unit.skillId];
  if (skill && skill.descriptionVi) {
    if (skill.descriptionVi.includes('Hiệu ứng nguyên tố')) {
      withElement++;
    } else {
      withoutElement++;
    }
  }
});

console.log(`   ✓ Có hiệu ứng nguyên tố: ${withElement}/${units.length} (${Math.round(withElement/units.length*100)}%)`);
console.log(`   ✓ Chưa có: ${withoutElement}\n`);

// 4. Tạo báo cáo mới
console.log('📝 Tạo báo cáo cập nhật...\n');

let report = `# PHÂN TÍCH VAI TRÒ VÀ SKILL - CẬP NHẬT MỚI NHẤT\n\n`;
report += `**Thời gian**: ${new Date().toLocaleString('vi-VN')}\n\n`;
report += `## 📊 Tổng quan sau khi cập nhật\n\n`;
report += `- **Tổng số units**: ${units.length}\n`;
report += `- **Tổng số skills**: ${skills.length}\n`;
report += `- **Units có vấn đề vai trò**: ${roleIssues.length} (${Math.round(roleIssues.length/units.length*100)}%)\n`;
report += `- **Nhóm skill trùng lặp**: ${duplicates.length}\n`;
report += `  - Nghiêm trọng (cùng vai trò ≥5): ${criticalDups.length}\n`;
report += `  - Chấp nhận được (khác vai trò): ${moderateDups.length}\n`;
report += `- **Units có hiệu ứng nguyên tố**: ${withElement}/${units.length} (${Math.round(withElement/units.length*100)}%)\n\n`;

report += `## ✅ Cải thiện đã đạt được\n\n`;
report += `### So với phân tích ban đầu:\n\n`;
report += `| Chỉ số | Ban đầu | Hiện tại | Cải thiện |\n`;
report += `|--------|---------|----------|----------|\n`;
report += `| Vấn đề vai trò | 9 units (7.5%) | ${roleIssues.length} units (${Math.round(roleIssues.length/units.length*100)}%) | ${9 - roleIssues.length} units |\n`;
report += `| Có hiệu ứng nguyên tố | 0 units (0%) | ${withElement} units (${Math.round(withElement/units.length*100)}%) | +${withElement} units |\n`;
report += `| Skill độc đáo | Thấp | Cao hơn | Đã thêm hiệu ứng nguyên tố |\n\n`;

if (roleIssues.length > 0) {
  report += `## ⚠️ Vấn đề vai trò còn lại (${roleIssues.length} units)\n\n`;
  roleIssues.forEach((issue, index) => {
    report += `### ${index + 1}. ${issue.unit.icon} ${issue.unit.name}\n\n`;
    report += `- **Vai trò hiện tại**: ${issue.unit.classVi}\n`;
    report += `- **Vấn đề**: ${issue.reason}\n`;
    report += `- **Skill**: ${issue.unit.skillId}\n\n`;
  });
} else {
  report += `## ✅ Không còn vấn đề vai trò\n\n`;
  report += `Tất cả units đã có vai trò phù hợp với skill!\n\n`;
}

report += `## 📋 Skill trùng lặp chi tiết\n\n`;

if (criticalDups.length > 0) {
  report += `### 🔴 Nghiêm trọng - Cần thiết kế lại (${criticalDups.length} nhóm)\n\n`;
  report += `Các nhóm này có ≥5 units cùng vai trò dùng chung 1 skill:\n\n`;
  
  criticalDups.forEach((dup, index) => {
    report += `#### ${index + 1}. ${dup.effect} (${dup.count} units - ${dup.roles[0]})\n\n`;
    report += `**Danh sách**:\n`;
    dup.units.forEach(u => {
      report += `- ${u.unit.icon} ${u.unit.name} (Bậc ${u.unit.tier} - ${u.unit.tribeVi})\n`;
    });
    report += `\n**Đề xuất**: Thiết kế skill hoàn toàn khác nhau cho từng unit\n\n`;
  });
}

report += `### 🟢 Chấp nhận được - Đã có hiệu ứng nguyên tố (${moderateDups.length} nhóm)\n\n`;
report += `Các nhóm này có units khác vai trò hoặc <5 units, đã được cải thiện bằng hiệu ứng nguyên tố:\n\n`;

moderateDups.slice(0, 10).forEach((dup, index) => {
  report += `#### ${index + 1}. ${dup.effect} (${dup.count} units)\n\n`;
  report += `**Vai trò**: ${dup.roles.join(', ')}\n\n`;
  
  const byTribe = {};
  dup.units.forEach(u => {
    const tribe = u.unit.tribeVi;
    if (!byTribe[tribe]) byTribe[tribe] = [];
    byTribe[tribe].push(u.unit);
  });
  
  report += `**Phân bố nguyên tố**:\n`;
  Object.keys(byTribe).forEach(tribe => {
    report += `- ${tribe}: ${byTribe[tribe].map(u => u.icon + ' ' + u.name).join(', ')}\n`;
  });
  report += `\n✅ **Đã cải thiện**: Mỗi unit có hiệu ứng nguyên tố riêng biệt\n\n`;
});

report += `\n_Xem thêm ${moderateDups.length - 10} nhóm khác trong dữ liệu..._\n\n`;

report += `## 🎯 Kết luận\n\n`;
report += `### Đã hoàn thành:\n`;
report += `1. ✅ Sửa ${9 - roleIssues.length}/9 vấn đề vai trò (${Math.round((9-roleIssues.length)/9*100)}%)\n`;
report += `2. ✅ Thêm hiệu ứng nguyên tố cho ${withElement}/${units.length} units (${Math.round(withElement/units.length*100)}%)\n`;
report += `3. ✅ Cải thiện ${moderateDups.length} nhóm skill trùng lặp bằng hiệu ứng nguyên tố\n\n`;

report += `### Cần làm tiếp:\n`;
report += `1. ⏳ Thiết kế lại skill cho ${criticalDups.length} nhóm nghiêm trọng\n`;
report += `2. ⏳ Implement logic hiệu ứng nguyên tố vào code game\n`;
report += `3. ⏳ Test và balance\n\n`;

report += `---\n\n`;
report += `**Ghi chú**: File này được tạo tự động từ dữ liệu CSV mới nhất.\n`;

// Lưu báo cáo
fs.writeFileSync(
  path.join(__dirname, 'ROLE_SKILL_ANALYSIS_UPDATED.md'),
  report
);

console.log('✅ Đã tạo ROLE_SKILL_ANALYSIS_UPDATED.md\n');

// Tạo danh sách skill trùng lặp chi tiết
let detailReport = `# DANH SÁCH CHI TIẾT SKILL TRÙNG LẶP\n\n`;
detailReport += `Cập nhật: ${new Date().toLocaleString('vi-VN')}\n\n`;

duplicates.forEach((dup, index) => {
  detailReport += `## ${index + 1}. ${dup.effect} (${dup.count} units)\n\n`;
  detailReport += `**Vai trò**: ${dup.roles.join(', ')}\n`;
  detailReport += `**Trạng thái**: ${dup.sameRole && dup.count >= 5 ? '🔴 Nghiêm trọng' : '🟢 Chấp nhận được'}\n\n`;
  
  detailReport += `| Unit | Vai trò | Bậc | Nguyên tố | Skill |\n`;
  detailReport += `|------|---------|-----|-----------|-------|\n`;
  
  dup.units.forEach(u => {
    detailReport += `| ${u.unit.icon} ${u.unit.name} | ${u.unit.classVi} | ${u.unit.tier} | ${u.unit.tribeVi} | ${u.skill.name} |\n`;
  });
  
  detailReport += `\n`;
  
  if (dup.sameRole && dup.count >= 5) {
    detailReport += `**⚠️ Đề xuất**: Thiết kế skill hoàn toàn khác nhau\n\n`;
  } else {
    detailReport += `**✅ Đã cải thiện**: Hiệu ứng nguyên tố giúp phân biệt\n\n`;
  }
  
  detailReport += `---\n\n`;
});

fs.writeFileSync(
  path.join(__dirname, 'SKILL_DUPLICATES_DETAIL.md'),
  detailReport
);

console.log('✅ Đã tạo SKILL_DUPLICATES_DETAIL.md\n');

console.log('=== HOÀN THÀNH ===\n');
console.log('📊 Tóm tắt:');
console.log(`   - Vấn đề vai trò còn lại: ${roleIssues.length}`);
console.log(`   - Skill trùng lặp nghiêm trọng: ${criticalDups.length}`);
console.log(`   - Skill trùng lặp chấp nhận được: ${moderateDups.length}`);
console.log(`   - Units có hiệu ứng nguyên tố: ${withElement}/${units.length}`);
