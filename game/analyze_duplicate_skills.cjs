const fs = require('fs');
const path = require('path');

// Đọc kết quả phân tích trước
const analysis = JSON.parse(fs.readFileSync(path.join(__dirname, 'role_skill_analysis.json'), 'utf-8'));

// Map nguyên tố sang hiệu ứng
const elementEffects = {
  'FIRE': { name: 'Hỏa', effect: 'Cháy', description: 'Gây sát thương lửa theo thời gian', damagePerTurn: 12 },
  'TIDE': { name: 'Thủy', effect: 'Làm chậm', description: 'Giảm tốc độ đánh 20%', slowPercent: 20 },
  'WIND': { name: 'Phong', effect: 'Đẩy lùi', description: 'Có cơ hội đẩy lùi mục tiêu 1 ô', knockbackChance: 25 },
  'STONE': { name: 'Nham', effect: 'Choáng', description: 'Có cơ hội làm choáng mục tiêu', stunChance: 20 },
  'WOOD': { name: 'Mộc', effect: 'Hút máu', description: 'Hút 15% sát thương thành máu', lifestealPercent: 15 },
  'SWARM': { name: 'Trùng', effect: 'Nhiễm độc', description: 'Gây sát thương độc theo thời gian', poisonPerTurn: 10 },
  'NIGHT': { name: 'Dạ', effect: 'Mù', description: 'Giảm 15% chính xác của mục tiêu', accuracyDebuff: 15 },
  'SPIRIT': { name: 'Linh', effect: 'Thanh tẩy', description: 'Xóa 1 debuff khỏi bản thân sau khi tấn công', cleanse: true }
};

// Nhóm skill theo effect
const skillGroups = {};
analysis.skills.forEach(skill => {
  const key = skill.effect || 'no_effect';
  if (!skillGroups[key]) {
    skillGroups[key] = [];
  }
  skillGroups[key].push(skill);
});

// Tìm skill trùng lặp
const duplicates = [];
Object.keys(skillGroups).forEach(effectKey => {
  const skills = skillGroups[effectKey];
  if (skills.length > 1 && effectKey !== 'no_effect') {
    // Tìm unit sử dụng skill này
    const unitsUsingSkill = [];
    skills.forEach(skill => {
      const units = analysis.units.filter(u => u.skillId === skill.id);
      units.forEach(unit => {
        unitsUsingSkill.push({
          unit: unit,
          skill: skill,
          role: unit.classVi,
          tribe: unit.tribeVi,
          tribeCode: unit.tribe
        });
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

// Sắp xếp theo số lượng trùng lặp
duplicates.sort((a, b) => b.count - a.count);

// In kết quả
console.log('=== PHÂN TÍCH SKILL TRÙNG LẶP ===\n');
console.log(`Tổng số nhóm skill trùng lặp: ${duplicates.length}\n`);

let detailedOutput = '';

duplicates.forEach((dup, index) => {
  console.log(`${index + 1}. Effect: ${dup.effect} - Số unit: ${dup.count}`);
  
  detailedOutput += `\n### ${index + 1}. Nhóm skill: ${dup.effect}\n\n`;
  detailedOutput += `**Số unit sử dụng**: ${dup.count}\n\n`;
  detailedOutput += `**Chi tiết**:\n\n`;
  
  // Nhóm theo vai trò
  const byRole = {};
  dup.units.forEach(u => {
    if (!byRole[u.role]) byRole[u.role] = [];
    byRole[u.role].push(u);
  });
  
  Object.keys(byRole).forEach(role => {
    detailedOutput += `**${role}**:\n`;
    byRole[role].forEach(u => {
      console.log(`   - ${u.unit.icon} ${u.unit.name} (${u.role} - ${u.tribe})`);
      detailedOutput += `- ${u.unit.icon} ${u.unit.name} (Bậc ${u.unit.tier} - ${u.tribe})\n`;
      detailedOutput += `  - Skill: ${u.skill.name}\n`;
    });
    detailedOutput += '\n';
  });
  
  // Đề xuất thay đổi
  detailedOutput += `**💡 Đề xuất**:\n\n`;
  
  // Kiểm tra xem có khác vai trò không
  const roles = [...new Set(dup.units.map(u => u.role))];
  if (roles.length > 1) {
    detailedOutput += `✅ **Chấp nhận được** - Các unit thuộc vai trò khác nhau (${roles.join(', ')}), nhưng nên:\n`;
    detailedOutput += `- Điều chỉnh hệ số sát thương phù hợp với vai trò\n`;
    detailedOutput += `- Thêm hiệu ứng phụ khác nhau dựa trên nguyên tố\n\n`;
  } else {
    detailedOutput += `⚠️ **Cần thay đổi** - Tất cả cùng vai trò ${roles[0]}, nên:\n`;
    detailedOutput += `- Thiết kế skill hoàn toàn khác nhau\n`;
    detailedOutput += `- Hoặc thêm hiệu ứng nguyên tố để phân biệt\n\n`;
  }
  
  // Đề xuất hiệu ứng nguyên tố
  detailedOutput += `**🌟 Đề xuất hiệu ứng nguyên tố**:\n\n`;
  dup.units.forEach(u => {
    const element = elementEffects[u.tribeCode];
    if (element) {
      detailedOutput += `- **${u.unit.icon} ${u.unit.name}** (${element.name}): Thêm hiệu ứng **${element.effect}**\n`;
      detailedOutput += `  - ${element.description}\n`;
      detailedOutput += `  - Tỷ lệ: ⭐ 25% → ⭐⭐ 40% → ⭐⭐⭐ 60%\n`;
      
      if (element.damagePerTurn) {
        detailedOutput += `  - Sát thương: ⭐ ${element.damagePerTurn}/lượt → ⭐⭐ ${element.damagePerTurn + 5}/lượt → ⭐⭐⭐ ${element.damagePerTurn + 10}/lượt\n`;
      }
      if (element.slowPercent) {
        detailedOutput += `  - Giảm tốc: ⭐ ${element.slowPercent}% → ⭐⭐ ${element.slowPercent + 10}% → ⭐⭐⭐ ${element.slowPercent + 20}%\n`;
      }
      if (element.lifestealPercent) {
        detailedOutput += `  - Hút máu: ⭐ ${element.lifestealPercent}% → ⭐⭐ ${element.lifestealPercent + 10}% → ⭐⭐⭐ ${element.lifestealPercent + 15}%\n`;
      }
    }
  });
  
  detailedOutput += `\n---\n`;
  console.log('');
});

// Phân tích nguyên tố
console.log('\n=== PHÂN TÍCH NGUYÊN TỐ ===\n');
const tribeCount = {};
analysis.units.forEach(unit => {
  if (!tribeCount[unit.tribe]) {
    tribeCount[unit.tribe] = { count: 0, name: unit.tribeVi };
  }
  tribeCount[unit.tribe].count++;
});

let elementOutput = '\n## PHÂN TÍCH NGUYÊN TỐ VÀ HIỆU ỨNG\n\n';
elementOutput += '### Phân bố nguyên tố\n\n';

Object.keys(tribeCount).forEach(tribe => {
  console.log(`${tribeCount[tribe].name}: ${tribeCount[tribe].count} unit`);
  elementOutput += `- **${tribeCount[tribe].name}** (${tribe}): ${tribeCount[tribe].count} unit\n`;
});

elementOutput += '\n### Đề xuất hiệu ứng nguyên tố cho skill\n\n';
elementOutput += 'Mỗi nguyên tố nên có hiệu ứng đặc trưng khi sử dụng skill, tỷ lệ kích hoạt tăng theo số sao:\n\n';

Object.keys(elementEffects).forEach(elemCode => {
  const elem = elementEffects[elemCode];
  elementOutput += `#### ${elem.name} (${elemCode})\n\n`;
  elementOutput += `**Hiệu ứng**: ${elem.effect}\n`;
  elementOutput += `**Mô tả**: ${elem.description}\n\n`;
  elementOutput += `**Tỷ lệ kích hoạt**:\n`;
  elementOutput += `- ⭐ 1 sao: 25% cơ hội\n`;
  elementOutput += `- ⭐⭐ 2 sao: 40% cơ hội\n`;
  elementOutput += `- ⭐⭐⭐ 3 sao: 60% cơ hội\n\n`;
  
  if (elem.damagePerTurn) {
    elementOutput += `**Sát thương theo thời gian**:\n`;
    elementOutput += `- ⭐ 1 sao: ${elem.damagePerTurn} sát thương/lượt (2 lượt)\n`;
    elementOutput += `- ⭐⭐ 2 sao: ${elem.damagePerTurn + 5} sát thương/lượt (2 lượt)\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: ${elem.damagePerTurn + 10} sát thương/lượt (3 lượt)\n\n`;
  }
  
  if (elem.slowPercent) {
    elementOutput += `**Hiệu ứng làm chậm**:\n`;
    elementOutput += `- ⭐ 1 sao: Giảm ${elem.slowPercent}% tốc độ (1 lượt)\n`;
    elementOutput += `- ⭐⭐ 2 sao: Giảm ${elem.slowPercent + 10}% tốc độ (2 lượt)\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: Giảm ${elem.slowPercent + 20}% tốc độ (2 lượt)\n\n`;
  }
  
  if (elem.knockbackChance) {
    elementOutput += `**Hiệu ứng đẩy lùi**:\n`;
    elementOutput += `- ⭐ 1 sao: ${elem.knockbackChance}% cơ hội đẩy lùi 1 ô\n`;
    elementOutput += `- ⭐⭐ 2 sao: ${elem.knockbackChance + 15}% cơ hội đẩy lùi 1 ô\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: ${elem.knockbackChance + 25}% cơ hội đẩy lùi 1 ô\n\n`;
  }
  
  if (elem.stunChance) {
    elementOutput += `**Hiệu ứng choáng**:\n`;
    elementOutput += `- ⭐ 1 sao: ${elem.stunChance}% cơ hội choáng 1 lượt\n`;
    elementOutput += `- ⭐⭐ 2 sao: ${elem.stunChance + 15}% cơ hội choáng 1 lượt\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: ${elem.stunChance + 25}% cơ hội choáng 1 lượt\n\n`;
  }
  
  if (elem.lifestealPercent) {
    elementOutput += `**Hiệu ứng hút máu**:\n`;
    elementOutput += `- ⭐ 1 sao: Hút ${elem.lifestealPercent}% sát thương thành máu\n`;
    elementOutput += `- ⭐⭐ 2 sao: Hút ${elem.lifestealPercent + 10}% sát thương thành máu\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: Hút ${elem.lifestealPercent + 15}% sát thương thành máu\n\n`;
  }
  
  if (elem.poisonPerTurn) {
    elementOutput += `**Hiệu ứng nhiễm độc**:\n`;
    elementOutput += `- ⭐ 1 sao: ${elem.poisonPerTurn} sát thương độc/lượt (2 lượt)\n`;
    elementOutput += `- ⭐⭐ 2 sao: ${elem.poisonPerTurn + 5} sát thương độc/lượt (2 lượt)\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: ${elem.poisonPerTurn + 8} sát thương độc/lượt (3 lượt)\n\n`;
  }
  
  if (elem.accuracyDebuff) {
    elementOutput += `**Hiệu ứng giảm chính xác**:\n`;
    elementOutput += `- ⭐ 1 sao: Giảm ${elem.accuracyDebuff}% chính xác (1 lượt)\n`;
    elementOutput += `- ⭐⭐ 2 sao: Giảm ${elem.accuracyDebuff + 10}% chính xác (2 lượt)\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: Giảm ${elem.accuracyDebuff + 15}% chính xác (2 lượt)\n\n`;
  }
  
  if (elem.cleanse) {
    elementOutput += `**Hiệu ứng thanh tẩy**:\n`;
    elementOutput += `- ⭐ 1 sao: Xóa 1 debuff sau khi tấn công\n`;
    elementOutput += `- ⭐⭐ 2 sao: Xóa 1 debuff + hồi 20 HP\n`;
    elementOutput += `- ⭐⭐⭐ 3 sao: Xóa 2 debuff + hồi 40 HP\n\n`;
  }
  
  elementOutput += `---\n\n`;
});

// Lưu kết quả
fs.writeFileSync(
  path.join(__dirname, 'duplicate_skills_analysis.txt'),
  detailedOutput + elementOutput
);

console.log('\nĐã lưu kết quả chi tiết vào duplicate_skills_analysis.txt');
