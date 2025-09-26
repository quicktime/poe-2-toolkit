# Path of Exile 2 Data Extraction Guide

## What is GGPK?

GGPK (Grinding Gear Games Pack) is the proprietary file format used by Path of Exile to store game assets. The file `Content.ggpk` contains:
- Game data tables (.dat files)
- Images and textures
- Audio files
- 3D models
- Shaders and effects

## Extraction Methods

### Method 1: PyPoE (Recommended)
PyPoE is a Python library for extracting and parsing PoE game data.

```bash
# Install PyPoE
pip install pypoe

# Or from source (more up-to-date)
git clone https://github.com/OmegaK2/PyPoE.git
cd PyPoE
pip install -e .
```

### Method 2: LibGGPK2
A C# tool with GUI for browsing and extracting GGPK files.

Download from: https://github.com/aianlinb/LibGGPK2

### Method 3: PoE-Dat-Viewer
Web-based viewer for already extracted data.

## Extraction Process

### Step 1: Locate Content.ggpk
```
# Default PoE 2 installation paths:
Windows: C:\Program Files (x86)\Grinding Gear Games\Path of Exile 2\Content.ggpk
Steam: C:\Program Files (x86)\Steam\steamapps\common\Path of Exile 2\Content.ggpk
```

### Step 2: Extract Data Tables
The most important files are in `Data/*.dat64` (PoE 2 uses 64-bit format):
- `BaseItemTypes.dat64` - All base items
- `UniqueItems.dat64` - All unique items
- `ActiveSkills.dat64` - Skill gems
- `PassiveSkills.dat64` - Passive tree
- `Mods.dat64` - Item modifiers
- `Stats.dat64` - Stat descriptions

### Step 3: Parse to JSON
PyPoE can convert .dat files to readable formats.

## Important Files for PoE 2 v0.3

### Items
- `Data/BaseItemTypes.dat64`
- `Data/UniqueItems.dat64`
- `Data/ItemClasses.dat64`
- `Data/Mods.dat64`
- `Data/ModType.dat64`
- `Data/Tags.dat64`

### Skills
- `Data/ActiveSkills.dat64`
- `Data/GrantedEffects.dat64`
- `Data/GrantedEffectsPerLevel.dat64`
- `Data/GemTags.dat64`
- `Data/SkillGems.dat64`

### Passive Tree
- `Data/PassiveSkills.dat64`
- `Data/PassiveSkillTrees.dat64`
- `Data/PassiveTreeExpansionJewelSizes.dat64`

### Stats & Descriptions
- `Data/Stats.dat64`
- `Data/StatDescriptions.dat64`

## Legal Considerations

⚠️ **IMPORTANT**:
- GGPK extraction is generally tolerated by GGG for community tools
- Do NOT distribute copyrighted assets (images, audio, models)
- Only extract and share game data (stats, numbers, text)
- Always credit Grinding Gear Games
- Follow PoE's Terms of Service

## Automated Extraction Script

See `extract_poe2_data.py` for an automated extraction script that:
1. Extracts relevant .dat64 files
2. Parses them to JSON
3. Formats for database import
4. Handles PoE 2 v0.3 specific formats