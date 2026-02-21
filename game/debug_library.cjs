// Debug script để kiểm tra unit data
const fs = require('fs');

// Parse CSV
const csvText = fs.readFileSync('./data/units.csv', 'utf8');
const lines = csvText.trim().split(/\r?\n/);
const headers = lines[0].split(',').map(h => h.trim());

console.log('=== HEADERS ===');
console.log(headers);
console.log('');

// Parse first unit
const values = lines[1].split(',').map(v => v.trim());
const unit = {};
const stats = {};

headers.forEach((header, index) => {
  const value = values[index];
  const numericFields = ['tier', 'hp', 'atk', 'def', 'matk', 'mdef', 'range', 'rageMax'];
  
  if (numericFields.includes(header)) {
    if (header === 'tier') {
      unit.tier = Number(value);
    } else {
      stats[header] = Number(value);
    }
  } else if (header !== 'tribeVi' && header !== 'classVi') {
    unit[header] = value;
  }
});

unit.stats = stats;

console.log('=== UNIT OBJECT ===');
console.log(JSON.stringify(unit, null, 2));
console.log('');

console.log('=== STATS OBJECT ===');
console.log(JSON.stringify(stats, null, 2));
console.log('');

console.log('=== ACCESSING STATS ===');
console.log('unit.stats:', unit.stats);
console.log('unit.stats.hp:', unit.stats?.hp);
console.log('unit.stats.atk:', unit.stats?.atk);
console.log('unit.stats.range:', unit.stats?.range);
