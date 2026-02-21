const fs = require('fs');
const path = require('path');

// Đọc kết quả phân tích
const analysis = JSON.parse(fs.readFileSync(path.join(__dirname, 'role_skill_analysis.json'), 'utf-8'));

// Tính sát thương theo công thức
function calculateDamage(skill, stat, star) {
  const base = parseFloat(skill.base) || 0;
  const scale = parseFloat(skill.scale) || 0;
  const multiplier = star === 1 ? 1.0 : star === 2 ? 1.2 : 1.4;
  
  return Math.round((stat * scale + base) * multiplier);
}

// Tạo nội dung chi tiết
let content = '';

analysis.issues.forEach((issue, index) => {
  const unit = analysis.units.find(u => u.name === issue.unit);
  const skill = issue.skill;
  
  content += `\n### ${index + 1}. ${issue.icon} ${issue.unit}\n\n`;
  content += `**Vai trò hiện tại**: ${issue.role} (Bậc ${issue.tier})\n\n`;
  content += `**Vấn đề**: ${issue.reason}\n\n`;
  
  // Thông tin skill hiện tại
  content += `#### 📋 Skill hiện tại: ${skill.name}\n\n`;
  content += `${skill.descriptionVi}\n\n`;
  
  // Phân tích chi tiết skill
  content += `**Đặc điểm skill**:\n`;
  content += `- Loại hành động: ${skill.actionPattern}\n`;
  content += `- Hiệu ứng: ${skill.effect}\n`;
  content += `- Loại sát thương: ${skill.damageType || 'N/A'}\n`;
  
  if (skill.base && skill.scale) {
    const stat = skill.scaleStat === 'atk' ? parseInt(unit.atk) : parseInt(unit.matk);
    content += `\n⭐ **Mốc sao**:\n\n`;
    content += `⭐ **1 sao**\n`;
    content += `- Sát thương: ${calculateDamage(skill, stat, 1)} (${skill.damageType})\n`;
    content += `- Số mục tiêu: ${skill.maxTargets || '1'} mục tiêu\n`;
    content += `- Hình dạng chiêu thức: ${getSkillShape(skill)}\n`;
    content += `- Hiệu ứng trong: ${skill.turns || '1'} lượt\n`;
    content += `- Công thức: (${skill.scaleStat.toUpperCase()}(${stat}) × ${skill.scale} + ${skill.base}) × 1.00 = ${calculateDamage(skill, stat, 1)} (${skill.damageType})\n\n`;
    
    content += `⭐⭐ **2 sao** – Tăng 20% sát thương\n`;
    content += `- Sát thương: ${calculateDamage(skill, stat, 2)} (${skill.damageType})\n`;
    content += `- Số mục tiêu: ${skill.maxTargets || '1'} mục tiêu\n`;
    content += `- Hình dạng chiêu thức: ${getSkillShape(skill)}\n`;
    content += `- Hiệu ứng trong: ${skill.turns || '1'} lượt\n`;
    content += `- Công thức: (${skill.scaleStat.toUpperCase()}(${stat}) × ${skill.scale} + ${skill.base}) × 1.20 = ${calculateDamage(skill, stat, 2)} (${skill.damageType})\n\n`;
    
    content += `⭐⭐⭐ **3 sao** – Tăng 40% sát thương\n`;
    content += `- Sát thương: ${calculateDamage(skill, stat, 3)} (${skill.damageType})\n`;
    content += `- Số mục tiêu: ${skill.maxTargets || '1'} mục tiêu\n`;
    content += `- Hình dạng chiêu thức: ${getSkillShape(skill)}\n`;
    content += `- Hiệu ứng trong: ${skill.turns || '1'} lượt\n`;
    content += `- Công thức: (${skill.scaleStat.toUpperCase()}(${stat}) × ${skill.scale} + ${skill.base}) × 1.40 = ${calculateDamage(skill, stat, 3)} (${skill.damageType})\n\n`;
  }
  
  // Đề xuất thay đổi
  content += `#### 💡 Đề xuất thay đổi\n\n`;
  content += getRecommendation(issue, unit);
  content += `\n---\n`;
});

function getSkillShape(skill) {
  if (skill.actionPattern === 'ASSASSIN_BACK') return 'Đánh sau lưng mục tiêu';
  if (skill.actionPattern === 'MELEE_FRONT') return '1 ô gần nhất';
  if (skill.actionPattern === 'RANGED_STATIC') {
    if (skill.effect && skill.effect.includes('cross')) return 'Hình thập tự (+)';
    if (skill.effect && skill.effect.includes('column')) return 'Cột dọc';
    if (skill.effect && skill.effect.includes('row')) return 'Hàng ngang';
    if (skill.effect && skill.effect.includes('cone')) return 'Hình tam giác';
    if (skill.effect && skill.effect.includes('circle')) return 'Vùng tròn';
    if (skill.effect && skill.effect.includes('global')) return 'Toàn bộ địch';
    return 'Mục tiêu đơn';
  }
  if (skill.actionPattern === 'SELF') return 'Bản thân/Đồng minh';
  return 'N/A';
}

function getRecommendation(issue, unit) {
  let rec = '';
  
  if (issue.role === 'Đỡ đòn') {
    rec += `**Phương án 1**: Thay đổi vai trò thành **Đấu sĩ** (phù hợp với skill hiện tại)\n\n`;
    rec += `**Phương án 2**: Giữ vai trò Đỡ đòn, thay đổi skill:\n`;
    rec += `- **Skill mới đề xuất**: Tạo khiên + khiêu khích hoặc phản đòn\n`;
    rec += `- **Ví dụ**: "Tạo lá chắn bảo vệ (scale theo DEF), khiêu khích toàn bộ địch trong 2 lượt"\n`;
    rec += `- **Mốc sao**: 1★ khiên cơ bản, 2★ +20% khiên + tăng thời gian khiêu khích, 3★ +40% khiên + phản 20% sát thương\n\n`;
  }
  
  if (issue.role === 'Đấu sĩ') {
    rec += `**Phương án 1**: Giữ vai trò Đấu sĩ, thay đổi skill:\n`;
    rec += `- **Skill mới đề xuất**: Đánh diện rộng (cone/column/cleave) + phá giáp\n`;
    rec += `- **Ví dụ**: "Húc thẳng về phía trước, gây sát thương vật lý lên 3 mục tiêu theo hàng ngang, giảm 15 giáp"\n`;
    rec += `- **Mốc sao**: 1★ đánh 3 mục tiêu, 2★ đánh 4 mục tiêu + tăng 20% sát thương, 3★ đánh 5 mục tiêu + tăng 40% sát thương + phá giáp mạnh hơn\n\n`;
    rec += `**Phương án 2**: Thay đổi vai trò thành **Hỗ trợ** hoặc **Đỡ đòn** (nếu skill có buff/khiêu khích)\n\n`;
  }
  
  if (issue.role === 'Sát thủ') {
    rec += `**Phương án 1**: Thay đổi vai trò thành **Đấu sĩ** hoặc **Hỗ trợ** (phù hợp với skill buff)\n\n`;
    rec += `**Phương án 2**: Giữ vai trò Sát thủ, thay đổi skill:\n`;
    rec += `- **Skill mới đề xuất**: Đánh sau lưng + burst damage cao\n`;
    rec += `- **Ví dụ**: "Lao sau lưng mục tiêu, gây sát thương vật lý cực cao (x2.2 ATK). Nếu hạ gục, hồi 30% Nộ"\n`;
    rec += `- **Mốc sao**: 1★ sát thương gốc, 2★ +20% sát thương + tăng tỷ lệ chí mạng 15%, 3★ +40% sát thương + tăng tỷ lệ chí mạng 25%\n\n`;
  }
  
  if (issue.role === 'Hỗ trợ') {
    rec += `**Phương án 1**: Giữ vai trò Hỗ trợ, thay đổi skill:\n`;
    rec += `- **Skill mới đề xuất**: Hồi máu hoặc buff đồng minh\n`;
    rec += `- **Ví dụ**: "Hồi phục máu cho 2 đồng minh yếu nhất (scale theo MATK x1.2) và tăng 10% né tránh trong 2 lượt"\n`;
    rec += `- **Mốc sao**: 1★ hồi 2 đồng minh, 2★ hồi 3 đồng minh + tăng 20% hiệu lực, 3★ hồi 4 đồng minh + tăng 40% hiệu lực + xóa 1 debuff\n\n`;
    rec += `**Phương án 2**: Thay đổi vai trò thành **Pháp sư** (nếu skill gây sát thương phép)\n\n`;
  }
  
  return rec;
}

// Ghi file
const header = fs.readFileSync(path.join(__dirname, 'ROLE_SKILL_ANALYSIS.md'), 'utf-8');
fs.writeFileSync(
  path.join(__dirname, 'ROLE_SKILL_ANALYSIS.md'),
  header + content
);

console.log('Đã tạo file ROLE_SKILL_ANALYSIS.md với chi tiết đầy đủ!');
