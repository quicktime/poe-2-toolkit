const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/poe2-tree-v0.3.json', 'utf8'));

const keystoneNames = [
  'Dance with Death',
  'Zealot\'s Oath',
  'Glancing Blows',
  'Unwavering Stance',
  'Crimson Assault',
  'Ritual Cadence'
];

console.log('=== KEYSTONE POSITIONS ===\n');

keystoneNames.forEach(name => {
  const node = Object.values(data.nodes).find(n => n.name === name);
  if (!node) {
    console.log(`NOT FOUND: ${name}`);
    return;
  }

  const group = data.groups[node.group];
  const angle = Math.atan2(group.y, group.x) * 180 / Math.PI;
  const dist = Math.sqrt(group.x * group.x + group.y * group.y);

  // Determine quadrant
  let quadrant;
  if (group.x > 0 && group.y > 0) quadrant = 'top-right';
  else if (group.x < 0 && group.y > 0) quadrant = 'top-left';
  else if (group.x < 0 && group.y < 0) quadrant = 'bottom-left';
  else quadrant = 'bottom-right';

  console.log(`${name}:`);
  console.log(`  Position: (${group.x.toFixed(0)}, ${group.y.toFixed(0)})`);
  console.log(`  Angle: ${angle.toFixed(1)}° (0°=east, 90°=north)`);
  console.log(`  Distance: ${dist.toFixed(0)} units`);
  console.log(`  Quadrant (with Y-flip): ${quadrant}`);
  console.log();
});
