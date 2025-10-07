const fs = require('fs');

const data = JSON.parse(fs.readFileSync('public/data/poe2-tree-v0.3.json', 'utf8'));

console.log('=== CONSTANTS ===');
console.log(JSON.stringify(data.constants, null, 2));

console.log('\n=== SAMPLE NODES WITH ORBIT INFO ===');
const sampleNodes = Object.values(data.nodes).slice(0, 5);
sampleNodes.forEach(node => {
  console.log('\nNode:', node.skill, node.name);
  console.log('  Group:', node.group);
  console.log('  Orbit:', node.orbit);
  console.log('  OrbitIndex:', node.orbitIndex);
  console.log('  Icon:', node.icon);
  console.log('  IsKeystone:', node.isKeystone);
  console.log('  IsNotable:', node.isNotable);
});

console.log('\n=== ASSETS MAPPING ===');
console.log(JSON.stringify(data.assets, null, 2));

console.log('\n=== SAMPLE GROUP ===');
const sampleGroup = data.groups.find(g => g !== null);
console.log(JSON.stringify(sampleGroup, null, 2));
