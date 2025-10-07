# Passive Tree Implementation Analysis

## Problem Statement
We need to render the PoE2 passive skill tree as a circular, interactive visualization similar to the in-game tree and PathOfBuilding.

## Current Issues
1. **Black screen** - Nothing renders at all
2. **Wrong structure** - Previous attempts showed a tangled mess, not circular
3. **Coordinate confusion** - Tree spans ~32,000 units but we're rendering to 800px canvas
4. **Data structure misunderstanding** - Not clear how groups, orbits, and nodes relate

## How Other Implementations Work

### PathOfBuilding (Desktop App)
- Uses Lua with OpenGL rendering
- Loads tree data from JSON files
- Renders sprites for nodes at calculated positions
- Uses viewport/camera system for zoom/pan

### poe.ninja (Web)
- Web-based implementation (we should inspect this)
- Likely uses Canvas or WebGL
- Has smooth zoom/pan
- Shows the circular structure clearly

### Official PoE Website
- Another web implementation
- Similar circular structure
- Interactive node selection

## Data Structure Analysis

### What We Know
```
Tree Data Contains:
- 4,118 nodes total
- 1,351 groups (clusters of nodes)
- Groups span from ~1,400 to ~16,500 units from center
- Each node has:
  - group: which group it belongs to
  - orbit: which ring around the group (0-9)
  - orbitIndex: position in that ring
  - connections: array of connected node IDs
```

### Key Concepts

**Groups**: Central points around which nodes orbit
- Groups are positioned in a large 2D space
- Groups form the overall circular structure of the tree
- Each group has multiple orbits

**Orbits**: Concentric circles around a group center
- Orbit 0: Typically connectors (don't render as circular nodes)
- Orbit 1-4: Regular passives
- Orbit 5-6: Notable passives
- Orbit 7-9: Keystone passives

**Node Positioning Formula**:
```
x = group.x + cos(angle) * orbitRadius
y = group.y + sin(angle) * orbitRadius
where:
  angle = (orbitIndex / skillsPerOrbit) * 2π
  orbitRadius = constants.orbitRadii[orbit]
```

## What We Need to Validate FIRST

### Step 1: Verify Groups Form a Circle
- Plot just the group centers as dots
- Should see a rough circular distribution
- This tests if the data itself makes sense

### Step 2: Verify a Single Group's Nodes
- Pick one group
- Render its nodes in orbital rings
- Should see concentric circles of nodes

### Step 3: Verify Connections Make Sense
- Draw lines between connected nodes
- Should see sensible paths, not chaos

## Rendering Strategy

### Coordinate System
- Canvas: 800x800 pixels (viewport)
- World: ~32,000x32,000 units (tree data)
- Scale factor: ~0.025 (32,000 units → 800 pixels)

### Rendering Order
1. Clear canvas (black background)
2. Apply transform (translate to center, apply scale/zoom, apply pan offset)
3. Draw connections (lines between nodes)
4. Draw group centers (debug - optional gray dots)
5. Draw nodes (colored circles)
6. Draw node highlights/hovers

### Canvas Transform Math
```
Canvas coords → World coords:
worldX = (screenX - centerX - offsetX) / scale
worldY = (screenY - centerY - offsetY) / scale

World coords → Canvas coords:
screenX = (worldX * scale) + centerX + offsetX
screenY = (worldY * scale) + centerY + offsetY
```

## Implementation Plan

### Phase 1: Validation (Debug View)
1. Create minimal test page
2. Load tree data
3. Render ONLY group centers as small dots
4. Verify circular structure is visible
5. Add console logging for data stats

### Phase 2: Single Group Test
1. Pick one group (preferably near center)
2. Render its nodes in orbital rings
3. Verify concentric circle pattern
4. Test different orbits have different radii

### Phase 3: Full Tree (No Connections)
1. Render all nodes using calculated positions
2. Color code by type (regular/notable/keystone)
3. Verify overall circular structure
4. Optimize rendering if slow

### Phase 4: Add Connections
1. Draw lines between connected nodes
2. Test connection count (should be 1-3 per node mostly)
3. Verify no crazy tangled mess

### Phase 5: Interactivity
1. Add zoom (mouse wheel)
2. Add pan (mouse drag)
3. Add hover (show node tooltip)
4. Add click (allocate/deallocate)

### Phase 6: Polish
1. Better colors/styling
2. Add node icons
3. Add path validation
4. Add class starting positions

## Questions to Answer First

1. ✅ How many groups? **1,351 groups**
2. ✅ What's the coordinate range? **~1,400 to ~16,500 from center**
3. ✅ How many nodes per group? **Varies, 1-many**
4. ❓ Are groups actually distributed in a circle?
5. ❓ Do orbital calculations actually work?
6. ❓ Why is the canvas currently black?

## Next Actions

1. **Inspect poe.ninja** - See how they handle it
2. **Create minimal test** - Just render group dots
3. **Validate data** - Print actual positions to console
4. **Debug rendering** - Add visible markers to ensure SOMETHING draws
