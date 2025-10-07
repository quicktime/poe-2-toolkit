const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/poe2-tree-v0.3.json', 'utf8'));

const nodes = Object.values(data.nodes);

// Count connection distribution
const connCounts = {};
nodes.forEach(n => {
  const count = n.connections ? n.connections.length : 0;
  connCounts[count] = (connCounts[count] || 0) + 1;
});

console.log('=== CONNECTION COUNT DISTRIBUTION ===');
Object.keys(connCounts).sort((a,b) => Number(a) - Number(b)).forEach(count => {
  console.log(`  ${count} connections: ${connCounts[count]} nodes`);
});

console.log('\n=== SAMPLE NODES WITH 1-3 CONNECTIONS ===');
nodes.filter(n => n.connections && n.connections.length >= 1 && n.connections.length <= 3)
  .slice(0, 5)
  .forEach(n => {
    console.log(`\nNode: ${n.name} (skill ${n.skill}, orbit ${n.orbit}, group ${n.group})`);
    console.log(`  Connections: ${n.connections.length}`);
    n.connections.forEach(c => {
      const targetNode = data.nodes[c.id];
      if (targetNode) {
        console.log(`    -> ${targetNode.name} (skill ${c.id}, orbit ${c.orbit}, group ${targetNode.group})`);
      }
    });
  });

console.log('\n=== NODES WITH MORE THAN 3 CONNECTIONS ===');
const manyConnections = nodes.filter(n => n.connections && n.connections.length > 3);
console.log(`Found ${manyConnections.length} nodes with >3 connections`);
if (manyConnections.length > 0) {
  manyConnections.slice(0, 3).forEach(n => {
    console.log(`\nNode: ${n.name} (skill ${n.skill}, orbit ${n.orbit})`);
    console.log(`  ${n.connections.length} connections`);
  });
}
