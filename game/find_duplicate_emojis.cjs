const fs = require('fs');

const csv = fs.readFileSync('data/units.csv', 'utf-8');
const lines = csv.trim().split('\n');
const header = lines[0];
const units = lines.slice(1).map(line => {
  const parts = line.split(',');
  return { id: parts[0], name: parts[1], icon: parts[3] };
});

const emojiMap = {};
units.forEach(unit => {
  if (!emojiMap[unit.icon]) {
    emojiMap[unit.icon] = [];
  }
  emojiMap[unit.icon].push(unit);
});

const duplicates = Object.entries(emojiMap).filter(([emoji, units]) => units.length > 1);

console.log('=== DUPLICATE EMOJIS FOUND ===\n');
duplicates.forEach(([emoji, units]) => {
  console.log(`Emoji: ${emoji} (used ${units.length} times)`);
  units.forEach(u => console.log(`  - ${u.id}: ${u.name}`));
  console.log('');
});

console.log(`Total duplicates: ${duplicates.length} emojis affecting ${duplicates.reduce((sum, [_, units]) => sum + units.length, 0)} units`);
