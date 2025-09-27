const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'repoe_data/repoe_base_items.json')));
const items = Object.values(data);

// Get all craftable white bases
const whiteBases = items.filter(i =>
  i.domain === 'item' &&
  !i.tags?.includes('unique') &&
  i.release_state !== 'unique_only' &&
  i.name // Has a name
);

console.log('Total potential white bases:', whiteBases.length);

const byClass = {};
whiteBases.forEach(i => {
  byClass[i.item_class] = (byClass[i.item_class] || 0) + 1;
});

console.log('\nBy item class:');
Object.entries(byClass)
  .sort()
  .forEach(([k,v]) => console.log(`  ${k}: ${v}`));

// Check what we're currently missing
const processed = JSON.parse(fs.readFileSync(path.join(__dirname, 'processed_data/base_items_full.json')));
const processedNames = new Set();
Object.values(processed).flat().forEach(i => processedNames.add(i.name));

const missingItems = whiteBases.filter(i => !processedNames.has(i.name));
console.log('\nMissing items:', missingItems.length);

if (missingItems.length > 0) {
  console.log('\nSample missing items:');
  missingItems.slice(0, 10).forEach(i => {
    console.log(`  - ${i.name} (${i.item_class})`);
  });
}