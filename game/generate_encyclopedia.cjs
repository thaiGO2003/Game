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
  FIRE: { emoji: '🔥', nameVi: 'Hỏa', effect1: '15%', effect2: '25%', effect3: '35%', desc: 'tỷ lệ gây cháy lan' },
  TIDE: { emoji: '💧', nameVi: 'Thủy', effect1: '15%', effect2: '25%', effect3: '35%', desc: 'giảm né tránh' },
  WIND: { emoji: '🌪️', nameVi: 'Phong', effect1: '15%', effect2: '25%', effect3: '35%', desc: 'giảm chính xác' },
  NIGHT: { emoji: '🌙', nameVi: 'Dạ', effect1: 'Chảy máu', effect2: 'Chảy máu mạnh', effect3: 'Chảy máu nghiêm trọng', desc: '+ giảm 25% hồi máu' },
  STONE: { emoji: '🪨', nameVi: 'Nham', effect1: '20%', effect2: '30%', effect3: '40%', desc: 'giảm giáp' },
  SWARM: { emoji: '🐝', nameVi: 'Bầy', effect1: '+5%', effect2: '+8%', effect3: '+10%', desc: 'mỗi đồng minh Trùng' },
  SPIRIT: { emoji: '👻', nameVi: 'Linh', effect1: 'Buff', effect2: 'Buff mạnh', effect3: 'Buff cực mạnh', desc: 'đặc biệt' },
  WOOD: { emoji: '🌳', nameVi: 'Mộc', effect1: 'Sinh mệnh', effect2: 'Sinh mệnh mạnh', effect3: 'Sinh mệnh cực mạnh', desc: 'tự nhiên' }
};

// Tính accuracy dựa trên class và đặc điểm
function calculateAccuracy(unit) {
  const classType = unit.classType || unit.classVi;
  const tier = parseInt(unit.tier) || 1;
  
  // Base accuracy theo class
  let base = 95;
  if (classType === 'TANKER' || classType === 'Đỡ đòn') base = 90;
  if (classType === 'FIGHTER' || classType === 'Đấu sĩ') base = 105;
  if (classType === 'ASSASSIN' || classType === 'Sát thủ') base = 115;
  if (classType === 'ARCHER' || classType === 'Xạ thủ') base = 105;
  if (classType === 'MAGE' || classType === 'Pháp sư') base = 100;
  if (classType === 'SUPPORT' || classType === 'Hỗ trợ') base = 95;
  
  // Bonus theo tier
  const tierBonus = (tier - 1) * 2;
  
  return base + tierBonus;
}

// Tính evasion dựa trên species
function calculateEvasion(unit) {
  const species = unit.species || '';
  const name = unit.name || '';
  
  // Fast units
  if (['ho', 'bao', 'soi', 'cao', 'doi', 'khi'].includes(species)) return 25 + Math.floor(Math.random() * 10);
  if (name.includes('Hổ') || name.includes('Báo') || name.includes('Sói') || name.includes('Cáo')) return 25 + Math.floor(Math.random() * 10);
  
  // Slow units
  if (['voi', 'rua', 'trau', 'gau'].includes(species)) return 5 + Math.floor(Math.random() * 5);
  if (name.includes('Voi') || name.includes('Rùa') || name.includes('Trâu') || name.includes('Gấu')) return 5 + Math.floor(Math.random() * 5);
  
  // Medium
  return 12 + Math.floor(Math.random() * 8);
}

console.log('=== TẠO UNIT ENCYCLOPEDIA MỚI ===\n');

const units = readCSV('data/units.csv');
const skills = readCSV('data/skills.csv');

console.log(`📊 Đọc ${units.length} units và ${skills.length} skills\n`);

// Tạo skill map
const skillMap = {};
skills.forEach(skill => {
  skillMap[skill.id] = skill;
});

// Generate encyclopedia
let encyclopedia = `# 📖 THƯ VIỆN LINH THÚ (Unit Encyclopedia)

**Tổng số**: ${units.length} linh thú
**Cập nhật**: ${new Date().toLocaleString('vi-VN')}

---

`;

units.forEach((unit, idx) => {
  const skill = skillMap[unit.skillId];
  const element = ELEMENT_INFO[unit.tribe] || { emoji: '❓', nameVi: unit.tribeVi || unit.tribe };
  const accuracy = calculateAccuracy(unit);
  const evasion = calculateEvasion(unit);
  
  const stars = '⭐'.repeat(parseInt(unit.tier) || 1);
  
  encyclopedia += `## ${idx + 1}. ${unit.icon} ${unit.name.toUpperCase()}

**THÔNG TIN CƠ BẢN**
- ${stars} **Bậc**: ${unit.tier} (${unit.tribeVi}/${unit.classVi})
- ${element.emoji} **Tộc**: ${unit.tribeVi}
- ❤️ **HP**: ${unit.hp}
- ⚔️ **ATK**: ${unit.atk}
- 🛡️ **DEF**: ${unit.def}
- ✨ **MATK**: ${unit.matk}
- 🔮 **MDEF**: ${unit.mdef}
- 🎯 **Tầm**: ${unit.range === '1' ? 'Cận chiến (1)' : `Xa (${unit.range})`}
- 🎯 **Độ chính xác**: ${accuracy}%
- 🎯 **Né tránh**: ${evasion}%
- 🔥 **Nộ tối đa**: ${unit.rageMax}
- 🎨 **Trang bị**: Chưa có
- 💎 **Mốc nghề**: 2/4/6
- 🌱 **Mốc tốc**: 2/4/6

**KỸ NĂNG**

🎯 **Đánh thường**
`;

  // Basic attack description based on class
  const classType = unit.classType || unit.classVi;
  if (classType === 'TANKER' || classType === 'Đỡ đòn') {
    encyclopedia += `- Thi triển: Cận chiến áp sát tiền tuyến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên địch gần nhất cùng hàng
- Công thức cơ bản: ATK và giáp mục tiêu\n\n`;
  } else if (classType === 'FIGHTER' || classType === 'Đấu sĩ') {
    encyclopedia += `- Thi triển: Xung phong cận chiến
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên địch gần nhất cùng hàng
- Công thức cơ bản: ATK và giáp mục tiêu\n\n`;
  } else if (classType === 'ASSASSIN' || classType === 'Sát thủ') {
    encyclopedia += `- Thi triển: Lao sau lưng mục tiêu
- Tầm đánh: Cận chiến
- Loại sát thương: Vật lý
- Ưu tiên địch xa nhất cùng hàng (carry hậu phương)
- Công thức cơ bản: ATK và giáp mục tiêu\n\n`;
  } else if (classType === 'ARCHER' || classType === 'Xạ thủ') {
    encyclopedia += `- Thi triển: Bắn tên từ xa
- Tầm đánh: ${unit.range} ô
- Loại sát thương: Vật lý
- Ưu tiên địch gần nhất cùng hàng trong tầm
- Công thức cơ bản: ATK và giáp mục tiêu\n\n`;
  } else if (classType === 'MAGE' || classType === 'Pháp sư') {
    encyclopedia += `- Thi triển: Phép thuật từ xa
- Tầm đánh: ${unit.range} ô
- Loại sát thương: Phép thuật (không bao giờ hụt)
- Ưu tiên địch gần nhất cùng hàng trong tầm
- Công thức cơ bản: MATK và kháng phép mục tiêu\n\n`;
  } else if (classType === 'SUPPORT' || classType === 'Hỗ trợ') {
    encyclopedia += `- Thi triển: Hỗ trợ/Phép thuật từ xa
- Tầm đánh: ${unit.range} ô
- Loại sát thương: Vật lý (đánh thường) / Phép thuật (skill)
- Ưu tiên địch gần nhất cùng hàng hoặc đồng minh yếu nhất
- Công thức cơ bản: ATK/MATK tùy skill\n\n`;
  }

  // Skill description
  if (skill) {
    const skillName = skill.name || 'Unknown Skill';
    const skillDesc = skill.descriptionVi || 'Chưa có mô tả';
    
    encyclopedia += `${element.emoji} **Chiêu thức: ${skillName}**
${skillDesc.split('.')[0]}.

**Mốc sao:**
- ⭐ **1 sao**: Hiệu lực cơ bản
  - 💥 Sát thương/Hiệu ứng: Theo công thức skill
  - 🎯 Số mục tiêu: Theo skill
  - 📐 Hình dạng: Theo pattern skill
  - ${element.emoji} **Hiệu ứng ${element.nameVi}**: ${element.effect1} ${element.desc}

- ⭐⭐ **2 sao**: +20% hiệu lực
  - 💥 Sát thương/Hiệu ứng: +20%
  - ${element.emoji} **Hiệu ứng ${element.nameVi}**: ${element.effect2} ${element.desc}

- ⭐⭐⭐ **3 sao**: +40% hiệu lực
  - 💥 Sát thương/Hiệu ứng: +40%
  - ${element.emoji} **Hiệu ứng ${element.nameVi}**: ${element.effect3} ${element.desc}

`;
  }
  
  encyclopedia += `---\n\n`;
});

// Ghi file
fs.writeFileSync('unit_encyclopedia.md', encyclopedia, 'utf-8');

console.log('✅ Đã tạo unit_encyclopedia.md');
console.log(`📄 Tổng: ${units.length} units\n`);

console.log('=== HOÀN THÀNH ===');
