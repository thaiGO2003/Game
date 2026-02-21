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

// Đọc dữ liệu
const units = parseCSV(path.join(__dirname, 'data', 'units.csv'));
const skills = parseCSV(path.join(__dirname, 'data', 'skills.csv'));

// Tạo map skill
const skillMap = {};
skills.forEach(skill => {
  skillMap[skill.id] = skill;
});

// Phân loại skill theo đặc điểm
function analyzeSkillType(skill) {
  const types = [];
  
  // Kiểm tra các đặc điểm
  if (skill.shieldBase || skill.shieldScale) types.push('Tạo khiên');
  if (skill.tauntTurns && parseInt(skill.tauntTurns) > 0) types.push('Khiêu khích');
  if (skill.reflectPct && parseFloat(skill.reflectPct) > 0) types.push('Phản đòn');
  if (skill.armorBuff || skill.mdefBuff) types.push('Buff phòng thủ');
  if (skill.effect && (skill.effect.includes('protection') || skill.effect.includes('counter') || skill.effect.includes('reflect'))) types.push('Bảo vệ/Phản đòn');
  
  if (skill.effect && skill.effect.includes('heal')) types.push('Hồi máu');
  if (skill.rageGain && parseInt(skill.rageGain) > 0) types.push('Kích nộ');
  if (skill.atkBuff || skill.evadeBuff || skill.buffStats) types.push('Buff đồng minh');
  if (skill.effect && (skill.effect.includes('cleanse') || skill.effect.includes('shield'))) types.push('Hỗ trợ');
  
  if (skill.actionPattern === 'ASSASSIN_BACK') types.push('Sát thủ - Đánh sau lưng');
  if (skill.lifesteal && parseFloat(skill.lifesteal) > 0) types.push('Hút máu');
  if (skill.effect && skill.effect.includes('execute')) types.push('Kết liễu');
  
  if (skill.actionPattern === 'MELEE_FRONT' && (skill.effect && (skill.effect.includes('cone') || skill.effect.includes('column') || skill.effect.includes('cleave')))) types.push('Đấu sĩ - Đánh diện rộng');
  if (skill.damageType === 'true') types.push('Sát thương chuẩn');
  if (skill.armorBreak || skill.armorPen) types.push('Phá giáp');
  
  if (skill.actionPattern === 'RANGED_STATIC') types.push('Tầm xa');
  if (skill.maxTargets && parseInt(skill.maxTargets) > 1) types.push('Nhiều mục tiêu');
  if (skill.effect && (skill.effect.includes('global') || skill.effect.includes('aoe'))) types.push('Sát thương diện rộng');
  
  return types;
}

// Kiểm tra sự phù hợp
const issues = [];

units.forEach(unit => {
  const skill = skillMap[unit.skillId];
  if (!skill) return;
  
  const skillTypes = analyzeSkillType(skill);
  const role = unit.classType;
  const roleVi = unit.classVi;
  
  let issueFoun = false;
  let reason = '';
  
  // Kiểm tra Đỡ đòn (TANKER)
  if (role === 'TANKER') {
    const hasTankSkill = skillTypes.some(t => 
      t.includes('khiên') || t.includes('Khiêu khích') || t.includes('Phản đòn') || 
      t.includes('Buff phòng thủ') || t.includes('Bảo vệ')
    );
    if (!hasTankSkill) {
      issueFoun = true;
      reason = `Đỡ đòn nhưng skill không có khiên/khiêu khích/phản đòn/buff phòng thủ. Skill hiện tại: ${skillTypes.join(', ')}`;
    }
  }
  
  // Kiểm tra Đấu sĩ (FIGHTER)
  if (role === 'FIGHTER') {
    const hasFighterSkill = skillTypes.some(t => 
      t.includes('Đấu sĩ') || t.includes('diện rộng') || t.includes('Nhiều mục tiêu') || t.includes('Phá giáp')
    );
    const hasSupportSkill = skillTypes.some(t => 
      t.includes('Khiêu khích') || t.includes('Buff đồng minh') || t.includes('Hỗ trợ')
    );
    if (hasSupportSkill && !hasFighterSkill) {
      issueFoun = true;
      reason = `Đấu sĩ nhưng skill thiên về hỗ trợ/khiêu khích thay vì gây sát thương diện rộng. Skill: ${skillTypes.join(', ')}`;
    }
  }
  
  // Kiểm tra Sát thủ (ASSASSIN)
  if (role === 'ASSASSIN') {
    const hasAssassinSkill = skillTypes.some(t => 
      t.includes('Sát thủ') || t.includes('Kết liễu') || t.includes('Hút máu')
    );
    if (!hasAssassinSkill) {
      issueFoun = true;
      reason = `Sát thủ nhưng skill không đánh sau lưng/kết liễu. Skill: ${skillTypes.join(', ')}`;
    }
  }
  
  // Kiểm tra Hỗ trợ (SUPPORT)
  if (role === 'SUPPORT') {
    const hasSupportSkill = skillTypes.some(t => 
      t.includes('Hồi máu') || t.includes('Kích nộ') || t.includes('Buff') || t.includes('Hỗ trợ')
    );
    if (!hasSupportSkill) {
      issueFoun = true;
      reason = `Hỗ trợ nhưng skill không hồi máu/buff/kích nộ. Skill: ${skillTypes.join(', ')}`;
    }
  }
  
  if (issueFoun) {
    issues.push({
      unit: unit.name,
      icon: unit.icon,
      role: roleVi,
      tier: unit.tier,
      skillId: unit.skillId,
      skillName: skill.name,
      skillTypes: skillTypes,
      reason: reason,
      skill: skill
    });
  }
});

// In kết quả
console.log('=== PHÂN TÍCH VAI TRÒ VÀ SKILL KHÔNG PHÙ HỢP ===\n');
console.log(`Tổng số unit: ${units.length}`);
console.log(`Số unit có vấn đề: ${issues.length}\n`);

if (issues.length > 0) {
  console.log('CHI TIẾT CÁC UNIT CÓ VẤN ĐỀ:\n');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.icon} ${issue.unit} (${issue.role} - Bậc ${issue.tier})`);
    console.log(`   Skill: ${issue.skillName}`);
    console.log(`   Vấn đề: ${issue.reason}`);
    console.log('');
  });
}

// Lưu kết quả ra file JSON để xử lý tiếp
fs.writeFileSync(
  path.join(__dirname, 'role_skill_analysis.json'),
  JSON.stringify({ units, skills, issues }, null, 2)
);

console.log('Đã lưu kết quả phân tích vào role_skill_analysis.json');
