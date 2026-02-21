const fs = require('fs');
const path = require('path');

// Đọc CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return { headers, data: lines.slice(1).map(line => {
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
  })};
}

// Ghi CSV
function writeCSV(filePath, data, headers) {
  const lines = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    lines.push(values.join(','));
  });
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

// Map hiệu ứng nguyên tố
const elementEffects = {
  'FIRE': {
    name: 'Hỏa',
    effect: 'Cháy',
    burnDamage: [12, 17, 22],
    burnTurns: [2, 2, 3],
    spreadChance: [0.15, 0.25, 0.35],
    description: 'gây cháy {dmg} sát thương/lượt ({turns} lượt), {spread}% cơ hội lan lửa'
  },
  'TIDE': {
    name: 'Thủy',
    effect: 'Giảm né tránh',
    evasionDebuff: [15, 25, 35],
    turns: [1, 2, 2],
    description: 'giảm {value}% né tránh ({turns} lượt)'
  },
  'WIND': {
    name: 'Phong',
    effect: 'Giảm chính xác',
    accuracyDebuff: [15, 25, 35],
    turns: [1, 2, 2],
    description: 'giảm {value}% chính xác ({turns} lượt)'
  },
  'STONE': {
    name: 'Nham',
    effect: 'Giảm giáp',
    armorDebuff: [20, 30, 40],
    turns: [2, 2, 3],
    description: 'giảm {value}% giáp ({turns} lượt)'
  },
  'WOOD': {
    name: 'Mộc',
    effect: 'Hút máu',
    lifesteal: [15, 25, 30],
    description: 'hút {value}% sát thương thành máu'
  },
  'SWARM': {
    name: 'Trùng',
    effect: 'Nhiễm độc',
    poisonDamage: [10, 15, 18],
    poisonTurns: [2, 2, 3],
    description: 'nhiễm độc {dmg} sát thương/lượt ({turns} lượt)'
  },
  'NIGHT': {
    name: 'Dạ',
    effect: 'Chảy máu',
    bleedDamage: [8, 12, 15],
    bleedTurns: [2, 2, 3],
    healDebuff: 25,
    description: 'chảy máu {dmg} sát thương/lượt ({turns} lượt), giảm 25% hồi máu'
  },
  'SPIRIT': {
    name: 'Linh',
    effect: 'Thanh tẩy',
    cleanse: [1, 1, 2],
    heal: [0, 20, 40],
    description: 'xóa {cleanse} debuff{heal}'
  }
};

console.log('=== THÊM HIỆU ỨNG NGUYÊN TỐ VÀO SKILLS ===\n');

// Đọc dữ liệu
console.log('📖 Đọc dữ liệu...');
const unitsFile = parseCSV(path.join(__dirname, 'data', 'units.csv'));
const skillsFile = parseCSV(path.join(__dirname, 'data', 'skills.csv'));

const units = unitsFile.data;
const skills = skillsFile.data;

console.log(`   ✓ Đọc ${units.length} units và ${skills.length} skills\n`);

// Tạo map unit -> skill
const unitSkillMap = {};
units.forEach(unit => {
  unitSkillMap[unit.skillId] = unit;
});

// Thêm hiệu ứng nguyên tố vào mô tả skill
console.log('✨ Thêm hiệu ứng nguyên tố...\n');

let updatedCount = 0;

skills.forEach(skill => {
  const unit = unitSkillMap[skill.id];
  if (!unit) return;
  
  const element = unit.tribe;
  const elementData = elementEffects[element];
  
  if (!elementData) return;
  
  // Kiểm tra xem đã có hiệu ứng nguyên tố chưa
  if (skill.descriptionVi && skill.descriptionVi.includes('Hiệu ứng nguyên tố')) {
    return; // Đã có rồi, bỏ qua
  }
  
  // Tạo mô tả hiệu ứng nguyên tố
  let elementDesc = `\n\n**Hiệu ứng nguyên tố ${elementData.name}** (${elementData.effect}):`;
  
  if (element === 'FIRE') {
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description
      .replace('{dmg}', elementData.burnDamage[0])
      .replace('{turns}', elementData.burnTurns[0])
      .replace('{spread}', Math.round(elementData.spreadChance[0] * 100))}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description
      .replace('{dmg}', elementData.burnDamage[1])
      .replace('{turns}', elementData.burnTurns[1])
      .replace('{spread}', Math.round(elementData.spreadChance[1] * 100))}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description
      .replace('{dmg}', elementData.burnDamage[2])
      .replace('{turns}', elementData.burnTurns[2])
      .replace('{spread}', Math.round(elementData.spreadChance[2] * 100))}`;
  } else if (element === 'TIDE') {
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description
      .replace('{value}', elementData.evasionDebuff[0])
      .replace('{turns}', elementData.turns[0])}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description
      .replace('{value}', elementData.evasionDebuff[1])
      .replace('{turns}', elementData.turns[1])}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description
      .replace('{value}', elementData.evasionDebuff[2])
      .replace('{turns}', elementData.turns[2])}`;
  } else if (element === 'WIND') {
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description
      .replace('{value}', elementData.accuracyDebuff[0])
      .replace('{turns}', elementData.turns[0])}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description
      .replace('{value}', elementData.accuracyDebuff[1])
      .replace('{turns}', elementData.turns[1])}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description
      .replace('{value}', elementData.accuracyDebuff[2])
      .replace('{turns}', elementData.turns[2])}`;
  } else if (element === 'STONE') {
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description
      .replace('{value}', elementData.armorDebuff[0])
      .replace('{turns}', elementData.turns[0])}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description
      .replace('{value}', elementData.armorDebuff[1])
      .replace('{turns}', elementData.turns[1])}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description
      .replace('{value}', elementData.armorDebuff[2])
      .replace('{turns}', elementData.turns[2])}`;
  } else if (element === 'WOOD') {
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description.replace('{value}', elementData.lifesteal[0])}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description.replace('{value}', elementData.lifesteal[1])}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description.replace('{value}', elementData.lifesteal[2])}`;
  } else if (element === 'SWARM') {
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description
      .replace('{dmg}', elementData.poisonDamage[0])
      .replace('{turns}', elementData.poisonTurns[0])}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description
      .replace('{dmg}', elementData.poisonDamage[1])
      .replace('{turns}', elementData.poisonTurns[1])}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description
      .replace('{dmg}', elementData.poisonDamage[2])
      .replace('{turns}', elementData.poisonTurns[2])}`;
  } else if (element === 'NIGHT') {
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description
      .replace('{dmg}', elementData.bleedDamage[0])
      .replace('{turns}', elementData.bleedTurns[0])}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description
      .replace('{dmg}', elementData.bleedDamage[1])
      .replace('{turns}', elementData.bleedTurns[1])}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description
      .replace('{dmg}', elementData.bleedDamage[2])
      .replace('{turns}', elementData.bleedTurns[2])}`;
  } else if (element === 'SPIRIT') {
    const healText1 = elementData.heal[0] > 0 ? ` + hồi ${elementData.heal[0]} HP` : '';
    const healText2 = elementData.heal[1] > 0 ? ` + hồi ${elementData.heal[1]} HP` : '';
    const healText3 = elementData.heal[2] > 0 ? ` + hồi ${elementData.heal[2]} HP` : '';
    
    elementDesc += `\n- ⭐ 1 sao: 25% cơ hội ${elementData.description
      .replace('{cleanse}', elementData.cleanse[0])
      .replace('{heal}', healText1)}`;
    elementDesc += `\n- ⭐⭐ 2 sao: 40% cơ hội ${elementData.description
      .replace('{cleanse}', elementData.cleanse[1])
      .replace('{heal}', healText2)}`;
    elementDesc += `\n- ⭐⭐⭐ 3 sao: 60% cơ hội ${elementData.description
      .replace('{cleanse}', elementData.cleanse[2])
      .replace('{heal}', healText3)}`;
  }
  
  // Thêm vào mô tả
  if (skill.descriptionVi) {
    skill.descriptionVi += elementDesc;
    updatedCount++;
    
    console.log(`   ✓ ${unit.icon} ${unit.name} (${elementData.name}) - ${skill.name}`);
  }
});

console.log(`\n   Đã cập nhật ${updatedCount} skills\n`);

// Backup và lưu
console.log('💾 Lưu kết quả...');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
fs.copyFileSync(
  path.join(__dirname, 'data', 'skills.csv'),
  path.join(__dirname, 'data', `skills.csv.backup.${timestamp}`)
);

writeCSV(path.join(__dirname, 'data', 'skills.csv'), skills, skillsFile.headers);

console.log(`   ✓ Đã lưu skills.csv`);
console.log(`   ✓ Backup: skills.csv.backup.${timestamp}\n`);

console.log('=== HOÀN THÀNH ===\n');
console.log(`📊 Đã thêm hiệu ứng nguyên tố cho ${updatedCount}/${skills.length} skills`);
