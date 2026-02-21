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

// Ghi CSV
function writeCSV(filepath, data, headers) {
  const lines = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(h => {
      let val = row[h] || '';
      // Escape nếu có dấu phẩy hoặc xuống dòng
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    });
    lines.push(values.join(','));
  });
  
  return lines.join('\n');
}

// Mapping nguyên tố
const ELEMENT_INFO = {
  FIRE: {
    emoji: '🔥',
    nameVi: 'Hỏa',
    effect1Star: 'Có 15% tỷ lệ gây cháy, lan sang đồng minh cạnh bên của kẻ địch',
    effect2Star: 'Có 25% tỷ lệ gây cháy, lan sang đồng minh cạnh bên của kẻ địch',
    effect3Star: 'Có 35% tỷ lệ gây cháy, lan sang đồng minh cạnh bên của kẻ địch'
  },
  TIDE: {
    emoji: '💧',
    nameVi: 'Thủy',
    effect1Star: 'Giảm 15% né tránh của mục tiêu',
    effect2Star: 'Giảm 25% né tránh của mục tiêu',
    effect3Star: 'Giảm 35% né tránh của mục tiêu'
  },
  WIND: {
    emoji: '🌪️',
    nameVi: 'Phong',
    effect1Star: 'Giảm 15% chính xác của mục tiêu',
    effect2Star: 'Giảm 25% chính xác của mục tiêu',
    effect3Star: 'Giảm 35% chính xác của mục tiêu'
  },
  NIGHT: {
    emoji: '🌙',
    nameVi: 'Dạ',
    effect1Star: 'Gây chảy máu và giảm 25% hiệu quả hồi máu',
    effect2Star: 'Gây chảy máu mạnh hơn và giảm 25% hiệu quả hồi máu',
    effect3Star: 'Gây chảy máu nghiêm trọng và giảm 25% hiệu quả hồi máu'
  },
  STONE: {
    emoji: '🪨',
    nameVi: 'Nham',
    effect1Star: 'Giảm 20% giáp của mục tiêu',
    effect2Star: 'Giảm 30% giáp của mục tiêu',
    effect3Star: 'Giảm 40% giáp của mục tiêu'
  },
  SWARM: {
    emoji: '🐝',
    nameVi: 'Bầy',
    effect1Star: 'Tăng sức mạnh khi có đồng minh cùng tộc',
    effect2Star: 'Tăng sức mạnh đáng kể khi có đồng minh cùng tộc',
    effect3Star: 'Tăng sức mạnh mạnh mẽ khi có đồng minh cùng tộc'
  },
  SPIRIT: {
    emoji: '👻',
    nameVi: 'Linh',
    effect1Star: 'Hiệu ứng linh hồn đặc biệt',
    effect2Star: 'Hiệu ứng linh hồn mạnh hơn',
    effect3Star: 'Hiệu ứng linh hồn cực mạnh'
  },
  WOOD: {
    emoji: '🌳',
    nameVi: 'Mộc',
    effect1Star: 'Hiệu ứng sinh mệnh tự nhiên',
    effect2Star: 'Hiệu ứng sinh mệnh mạnh hơn',
    effect3Star: 'Hiệu ứng sinh mệnh cực mạnh'
  }
};

console.log('=== THÊM HIỆU ỨNG NGUYÊN TỐ VÀO SKILL ===\n');

// Đọc dữ liệu
const units = readCSV('data/units.csv');
const skills = readCSV('data/skills.csv');

console.log(`📊 Đọc dữ liệu:`);
console.log(`   - Units: ${units.length}`);
console.log(`   - Skills: ${skills.length}\n`);

// Tạo backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
fs.copyFileSync('data/skills.csv', `data/skills.csv.backup.${timestamp}`);
console.log(`💾 Đã tạo backup: skills.csv.backup.${timestamp}\n`);

// Tạo map skillId -> tribe
const skillToTribe = {};
units.forEach(unit => {
  if (unit.skillId && unit.tribe) {
    // Mỗi unit có 3 tier (1★, 2★, 3★)
    for (let tier = 1; tier <= 3; tier++) {
      const skillId = `${unit.skillId}_${tier}`;
      skillToTribe[skillId] = unit.tribe;
    }
    // Cũng map cho base skillId
    skillToTribe[unit.skillId] = unit.tribe;
  }
});

console.log(`🔗 Đã map ${Object.keys(skillToTribe).length} skill -> tribe\n`);

// Cập nhật mô tả skill
let updated = 0;
let skipped = 0;

skills.forEach(skill => {
  const tribe = skillToTribe[skill.id];
  
  if (!tribe) {
    skipped++;
    return;
  }
  
  const elementInfo = ELEMENT_INFO[tribe];
  if (!elementInfo) {
    console.log(`⚠️  Không tìm thấy info cho tribe: ${tribe}`);
    skipped++;
    return;
  }
  
  // Kiểm tra xem đã có emoji nguyên tố chưa
  if (skill.descriptionVi && skill.descriptionVi.includes(elementInfo.emoji)) {
    skipped++;
    return;
  }
  
  // Xác định tier từ skill description
  let elementEffect = elementInfo.effect1Star;
  if (skill.descriptionVi) {
    if (skill.descriptionVi.includes('3★') || skill.descriptionVi.includes('⭐⭐⭐')) {
      elementEffect = elementInfo.effect3Star;
    } else if (skill.descriptionVi.includes('2★') || skill.descriptionVi.includes('⭐⭐')) {
      elementEffect = elementInfo.effect2Star;
    }
  }
  
  // Thêm hiệu ứng nguyên tố vào cuối mô tả
  if (skill.descriptionVi) {
    // Loại bỏ dấu chấm cuối nếu có
    let desc = skill.descriptionVi.trim();
    if (desc.endsWith('.')) {
      desc = desc.slice(0, -1);
    }
    
    skill.descriptionVi = `${desc}. ${elementInfo.emoji} Hiệu ứng ${elementInfo.nameVi}: ${elementEffect}.`;
    updated++;
  }
});

console.log(`✅ Đã cập nhật: ${updated} skills`);
console.log(`⏭️  Bỏ qua: ${skipped} skills\n`);

// Ghi lại file
const headers = Object.keys(skills[0]);
const csvContent = writeCSV('data/skills.csv', skills, headers);
fs.writeFileSync('data/skills.csv', csvContent, 'utf-8');

console.log('💾 Đã ghi file skills.csv\n');

// Thống kê
console.log('📊 THỐNG KÊ THEO NGUYÊN TỐ:\n');
const elementStats = {};

Object.values(skillToTribe).forEach(tribe => {
  elementStats[tribe] = (elementStats[tribe] || 0) + 1;
});

Object.entries(elementStats).sort((a, b) => b[1] - a[1]).forEach(([tribe, count]) => {
  const info = ELEMENT_INFO[tribe] || { emoji: '❓', nameVi: tribe };
  console.log(`   ${info.emoji} ${info.nameVi}: ${count} skills`);
});

console.log('\n=== HOÀN THÀNH ===');
console.log(`\n✅ Đã thêm hiệu ứng nguyên tố cho ${updated} skills`);
console.log(`📝 Kiểm tra lại bằng: node comprehensive_skill_analysis.cjs`);
