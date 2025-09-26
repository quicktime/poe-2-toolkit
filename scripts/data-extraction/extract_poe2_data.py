#!/usr/bin/env python3
"""
Path of Exile 2 Data Extractor
Extracts game data from GGPK files for v0.3+
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any

# Try to import PyPoE
try:
    from pypoe.poe.file import GGPKFile
    from pypoe.poe.file.dat import DatFile
    from pypoe.poe.file.specification import load_spec
    from pypoe.poe.constants import VERSION
    PYPOE_AVAILABLE = True
except ImportError:
    PYPOE_AVAILABLE = False
    print("Warning: PyPoE not installed. Install with: pip install pypoe")

# Configuration
POE2_PATHS = [
    r"C:\Program Files (x86)\Grinding Gear Games\Path of Exile 2",
    r"C:\Program Files (x86)\Steam\steamapps\common\Path of Exile 2",
    r"C:\Program Files\Grinding Gear Games\Path of Exile 2",
]

OUTPUT_DIR = Path("./extracted_data")

# Files to extract for PoE 2 v0.3
EXTRACT_FILES = {
    "items": [
        "Data/BaseItemTypes.dat64",
        "Data/UniqueItems.dat64",
        "Data/ItemClasses.dat64",
        "Data/ItemExperiencePerLevel.dat64",
        "Data/WeaponTypes.dat64",
        "Data/ArmourTypes.dat64",
        "Data/ShieldTypes.dat64",
    ],
    "mods": [
        "Data/Mods.dat64",
        "Data/ModType.dat64",
        "Data/ModDomains.dat64",
        "Data/ModGenerationType.dat64",
        "Data/Tags.dat64",
        "Data/SpawnWeight.dat64",
        "Data/CraftingBenchOptions.dat64",
    ],
    "skills": [
        "Data/ActiveSkills.dat64",
        "Data/GrantedEffects.dat64",
        "Data/GrantedEffectsPerLevel.dat64",
        "Data/GemTags.dat64",
        "Data/SkillGems.dat64",
        "Data/SupportGems.dat64",
        "Data/SkillTotemVariations.dat64",
    ],
    "passive": [
        "Data/PassiveSkills.dat64",
        "Data/PassiveSkillTrees.dat64",
        "Data/PassiveTreeExpansionJewelSizes.dat64",
        "Data/PassiveJewelSlots.dat64",
        "Data/AlternatePassiveSkills.dat64",
    ],
    "stats": [
        "Data/Stats.dat64",
        "Data/StatDescriptions.dat64",
        "Data/StatInterpolationTypes.dat64",
    ],
    "currency": [
        "Data/CurrencyItems.dat64",
        "Data/CurrencyStashTabLayout.dat64",
        "Data/Essences.dat64",
        "Data/EssenceTypes.dat64",
    ]
}

class PoE2DataExtractor:
    """Extract and parse PoE 2 game data"""

    def __init__(self, ggpk_path: str = None):
        """Initialize extractor with GGPK file path"""
        if not PYPOE_AVAILABLE:
            raise ImportError("PyPoE is required. Install with: pip install pypoe")

        self.ggpk_path = ggpk_path or self.find_poe2_installation()
        if not self.ggpk_path:
            raise FileNotFoundError("Could not find PoE 2 installation")

        self.ggpk_file = None
        self.spec = None

    def find_poe2_installation(self) -> str:
        """Find PoE 2 installation automatically"""
        for path in POE2_PATHS:
            content_ggpk = Path(path) / "Content.ggpk"
            if content_ggpk.exists():
                print(f"Found PoE 2 at: {path}")
                return str(content_ggpk)

        # Try to find via registry (Windows)
        if sys.platform == "win32":
            try:
                import winreg
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                                   r"SOFTWARE\WOW6432Node\GrindingGearGames\Path of Exile 2")
                install_path = winreg.QueryValueEx(key, "InstallPath")[0]
                content_ggpk = Path(install_path) / "Content.ggpk"
                if content_ggpk.exists():
                    return str(content_ggpk)
            except:
                pass

        return None

    def open_ggpk(self):
        """Open GGPK file for reading"""
        print(f"Opening GGPK: {self.ggpk_path}")
        self.ggpk_file = GGPKFile()
        self.ggpk_file.open(self.ggpk_path)

        # Load specification for PoE 2
        self.spec = load_spec(version=VERSION.STABLE)

    def extract_file(self, file_path: str) -> bytes:
        """Extract a single file from GGPK"""
        if not self.ggpk_file:
            self.open_ggpk()

        node = self.ggpk_file[file_path]
        if node:
            return node.get_content()
        return None

    def parse_dat_file(self, file_path: str, content: bytes) -> List[Dict]:
        """Parse a .dat64 file to structured data"""
        # Get the table name from file path
        table_name = Path(file_path).stem

        # Create DatFile instance
        dat_file = DatFile(table_name, content, self.spec)

        # Read all rows
        rows = []
        for row in dat_file:
            row_dict = {}
            for col_name in dat_file.columns:
                value = row[col_name]
                # Convert complex types to JSON-serializable format
                if hasattr(value, '__dict__'):
                    value = str(value)
                elif isinstance(value, bytes):
                    value = value.hex()
                row_dict[col_name] = value
            rows.append(row_dict)

        return rows

    def extract_category(self, category: str, files: List[str]) -> Dict[str, Any]:
        """Extract all files in a category"""
        print(f"\nExtracting {category} data...")

        category_data = {}
        for file_path in files:
            try:
                print(f"  - {file_path}")
                content = self.extract_file(file_path)
                if content:
                    parsed = self.parse_dat_file(file_path, content)
                    table_name = Path(file_path).stem
                    category_data[table_name] = parsed
                else:
                    print(f"    WARNING: Could not extract {file_path}")
            except Exception as e:
                print(f"    ERROR: {e}")

        return category_data

    def extract_all(self):
        """Extract all configured data files"""
        if not self.ggpk_file:
            self.open_ggpk()

        all_data = {}

        for category, files in EXTRACT_FILES.items():
            category_data = self.extract_category(category, files)
            all_data[category] = category_data

            # Save category data to JSON
            output_file = OUTPUT_DIR / f"{category}_data.json"
            output_file.parent.mkdir(parents=True, exist_ok=True)

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(category_data, f, indent=2, ensure_ascii=False)

            print(f"  Saved to: {output_file}")

        # Save combined data
        combined_file = OUTPUT_DIR / "poe2_all_data.json"
        with open(combined_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)

        print(f"\nAll data saved to: {combined_file}")

        if self.ggpk_file:
            self.ggpk_file.close()

        return all_data

    def extract_passive_tree_json(self):
        """Extract the passive tree as a formatted JSON"""
        print("\nExtracting passive tree JSON...")

        # The passive tree JSON is usually in a different location
        tree_paths = [
            "Data/PassiveSkillTree.json",
            "Data/PassiveSkillTree_0_3_0.json",  # Version specific
            "Metadata/PassiveSkillTree.json"
        ]

        for path in tree_paths:
            try:
                content = self.extract_file(path)
                if content:
                    tree_data = json.loads(content.decode('utf-8'))

                    # Save formatted tree
                    output_file = OUTPUT_DIR / "passive_tree.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(tree_data, f, indent=2, ensure_ascii=False)

                    print(f"  Saved passive tree to: {output_file}")
                    return tree_data
            except:
                continue

        print("  WARNING: Could not find passive tree JSON")
        return None

# Alternative: Use existing extracted data from community
def download_community_data():
    """Download already extracted data from community sources"""
    import requests

    sources = {
        "RePoE": "https://github.com/brather1ng/RePoE/raw/master/data/",
        "PyPoE_ExportedData": "https://github.com/OmegaK2/PyPoE/raw/master/exported/",
        "poedb": "https://poedb.tw/us/api/",
    }

    print("Downloading community extracted data...")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Download base item data from RePoE
    files_to_download = [
        ("base_items.json", "RePoE", "base_items.json"),
        ("uniques.json", "RePoE", "uniques.json"),
        ("gems.json", "RePoE", "gems.json"),
        ("mods.json", "RePoE", "mods.json"),
        ("passive_skills.json", "RePoE", "passive_skills.json"),
    ]

    for filename, source, remote_file in files_to_download:
        url = sources[source] + remote_file
        output_file = OUTPUT_DIR / filename

        print(f"  Downloading {filename} from {source}...")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            with open(output_file, 'wb') as f:
                f.write(response.content)

            print(f"    Saved to: {output_file}")
        except Exception as e:
            print(f"    ERROR: {e}")

def main():
    """Main extraction process"""
    print("=" * 60)
    print("Path of Exile 2 Data Extractor")
    print("=" * 60)

    if not PYPOE_AVAILABLE:
        print("\nPyPoE is not installed. Falling back to community data...")
        download_community_data()
        return

    # Try extraction
    try:
        extractor = PoE2DataExtractor()

        # Extract all data
        extractor.extract_all()

        # Extract passive tree
        extractor.extract_passive_tree_json()

        print("\n" + "=" * 60)
        print("Extraction complete!")
        print(f"Data saved to: {OUTPUT_DIR.absolute()}")

    except FileNotFoundError as e:
        print(f"\nERROR: {e}")
        print("\nFalling back to community data...")
        download_community_data()

    except Exception as e:
        print(f"\nERROR: {e}")
        print("\nTry using community data instead:")
        print("  python extract_poe2_data.py --community")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract PoE 2 game data")
    parser.add_argument("--ggpk", help="Path to Content.ggpk file")
    parser.add_argument("--community", action="store_true",
                      help="Download community extracted data instead")
    parser.add_argument("--output", default="./extracted_data",
                      help="Output directory for extracted data")

    args = parser.parse_args()

    if args.output:
        OUTPUT_DIR = Path(args.output)

    if args.community:
        download_community_data()
    else:
        main()