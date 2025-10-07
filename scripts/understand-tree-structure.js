const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/poe2-tree-v0.3.json', 'utf8'));

console.log('=== GROUPS STRUCTURE ===');
const validGroups = data.groups.filter(g => g !== null);
console.log(`Total groups: ${validGroups.length}`);
console.log('\nSample group positions:');
validGroups.slice(0, 5).forEach(g => {
  console.log(`  Group at (${g.x}, ${g.y}) with ${g.nodes.length} nodes, orbits: [${g.orbits}]`);
});

console.log('\n=== POSITION RANGE ===');
const allX = validGroups.map(g => g.x);
const allY = validGroups.map(g => g.y);
console.log(`X range: ${Math.min(...allX)} to ${Math.max(...allX)}`);
console.log(`Y range: ${Math.min(...allY)} to ${Math.max(...allY)}`);

console.log('\n=== CENTER DETECTION ===');
const centerGroups = validGroups.filter(g => {
  const dist = Math.sqrt(g.x * g.x + g.y * g.y);
  return dist < 1000;
});
console.log(`Groups near center (within 1000 units): ${centerGroups.length}`);
centerGroups.forEach(g => {
  const dist = Math.sqrt(g.x * g.x + g.y * g.y);
  console.log(`  Distance ${dist.toFixed(0)}: ${g.nodes.length} nodes, orbits: [${g.orbits}]`);
  g.nodes.forEach(nodeId => {
    const node = data.nodes[nodeId];
    if (node) {
      console.log(`    - ${node.name} (orbit ${node.orbit})`);
    }
  });
});

console.log('\n=== SAMPLE NODE WITH FULL DETAILS ===');
const sampleNode = Object.values(data.nodes).find(n => n.orbit === 1 && n.connections && n.connections.length > 0);
if (sampleNode) {
  console.log(JSON.stringify(sampleNode, null, 2));
}
