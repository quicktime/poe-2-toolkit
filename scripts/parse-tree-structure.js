const fs = require('fs');

console.log('Loading tree data...');
const data = JSON.parse(fs.readFileSync('lib/data/poe2-tree-v0.3.json', 'utf8'));

console.log('\n=== TOP-LEVEL KEYS ===');
console.log(Object.keys(data));

console.log('\n=== FIRST NON-NULL GROUP ===');
const firstGroup = data.groups.find(g => g !== null);
console.log(JSON.stringify(firstGroup, null, 2));

console.log('\n=== ASSETS SAMPLE ===');
console.log('Total assets:', Object.keys(data.assets).length);
console.log('First 10 asset keys:', Object.keys(data.assets).slice(0, 10));

if (data.nodes) {
  console.log('\n=== NODES STRUCTURE ===');
  const nodeIds = Object.keys(data.nodes);
  console.log('Total nodes:', nodeIds.length);
  console.log('\nFirst 3 nodes:');
  for (let i = 0; i < Math.min(3, nodeIds.length); i++) {
    console.log(`\nNode ${nodeIds[i]}:`);
    console.log(JSON.stringify(data.nodes[nodeIds[i]], null, 2));
  }
}

if (data.classes) {
  console.log('\n=== CLASSES ===');
  console.log('Available classes:', Object.keys(data.classes));
  const firstClass = Object.keys(data.classes)[0];
  console.log(`\nFirst class (${firstClass}):`, JSON.stringify(data.classes[firstClass], null, 2));
}

console.log('\n=== OTHER METADATA ===');
console.log('min_y:', data.min_y);
console.log('max_y:', data.max_y);
console.log('Total groups:', data.groups.length);
console.log('Groups that are not null:', data.groups.filter(g => g !== null).length);
