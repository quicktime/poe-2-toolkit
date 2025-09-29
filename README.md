# Path of Exile 2 Toolkit

A comprehensive character planning, build optimization, and community analytics platform specifically for **Path of Exile 2** (Early Access - Patch 0.3+).

> ⚠️ **Note**: This toolkit is designed exclusively for Path of Exile 2 and includes all the new mechanics introduced in the sequel. It is NOT compatible with Path of Exile 1.

## 🚀 Current Features (10 Major Tools Complete)

### 🎯 Core Character Tools
- **🔐 OAuth Authentication**: Secure login with Path of Exile account
- **👤 Character Management**: Import and analyze your real PoE 2 characters
- **⚡ DPS Calculator**: Mathematically accurate damage calculations with PoE 2 formulas
- **🌳 Passive Tree Planner**: Interactive passive tree for all 6 classes with import/export
- **⚖️ Character Comparison**: Side-by-side analysis of multiple characters with DPS/stats comparison

### 🛠️ Advanced Build Tools
- **🔍 Build Optimizer**: AI-powered jewel swapping and optimization using genetic algorithms
- **📈 Equipment Upgrades**: Smart upgrade recommendations with DPS impact analysis
- **✨ Build Templates**: Save, categorize, and share character builds with complexity scoring
- **🧠 Character Insights**: Deep analysis of inventory, gems, weaknesses, and combat style
- **🧮 Minion DPS Calculator**: Accurate minion/totem DPS with spirit optimization and passive tree integration

### 🔨 Crafting System (NEW!)
- **🎨 Dynamic Crafting Simulator**: Complete crafting system with real PoE 2 mechanics
- **📋 Mod Database**: Full database of all item modifiers, weights, and tiers
- **🎯 Smart Route Generation**: AI-powered crafting route optimization based on selected mods
- **💰 Real-Time Pricing**: Integration with POE2Scout for live currency rates
- **📊 Cost Analysis**: Detailed breakdown of crafting costs and success rates

### 📊 Community & Analytics
- **📊 Community Analytics**: Real-time insights on class distribution, popular builds, and equipment meta

## 🎮 Path of Exile 2 Exclusive Mechanics

### Fully Supported Systems
- **Spirit System**: Manage spirit reservations for buffs and minions with optimization
- **Combo System**: Calculate combo multipliers and point efficiency for melee builds
- **Uncut Gem Support**: Optimize support gem configurations with spirit costs
- **Honor Resistance**: Track and optimize all resistance types including honor
- **Dodge Roll Mechanics**: Factor dodge rolls into defensive calculations
- **Dual Weapon Sets**: Manage and optimize weapon swap configurations
- **New Flask System**: Charge-based flask optimization and effectiveness
- **Jewel Socket System**: Real jewel data analysis with "what-if" scenarios

### Supported Classes & Ascendancies
- **Warrior**: Warbringer, Titan
- **Monk**: Invoker, Acolyte of Chayula
- **Ranger**: Deadeye, Pathfinder
- **Mercenary**: Witchhunter, Gemling Legionnaire
- **Witch**: Infernalist, Blood Mage
- **Sorceress**: Stormweaver, Chronomancer

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, React 18
- **Styling**: Tailwind CSS with responsive design
- **State Management**: React Query, Context API
- **Authentication**: OAuth 2.0 with PKCE (no client secret required)
- **Data Storage**: LocalStorage-based character database
- **Performance**: Optimized calculations with singleton pattern services
- **Visualization**: Canvas-based passive tree, responsive charts

## 📦 Quick Start

1. **Clone and Install**:
```bash
git clone https://github.com/your-repo/poe-2-toolkit.git
cd poe-2-toolkit
npm install
```

2. **Configure Environment**:
```bash
cp .env.local.example .env.local
# Add your PoE OAuth Client ID to .env.local
```

3. **Run Development Server**:
```bash
npm run dev
```

4. **Open**: http://localhost:3002

## 🔨 Crafting System Features

The new crafting system provides comprehensive crafting simulation for Path of Exile 2:

### Dynamic Mod Selection
- Browse all available modifiers for any item type
- Filter by rarity, tier, tags, and requirements
- Visual indicators for mod rarity (Extremely Rare → Common)
- Real-time validation of mod combinations

### Intelligent Route Generation
- **Homogenous Omen Strategy**: For mirror-tier items with "Gain as Extra" mods
- **Essence Crafting**: Deterministic crafting with guaranteed mods
- **Alt-Regal Strategy**: Budget-friendly approach for starter items
- **Recombinator Method**: Split crafting for difficult combinations
- **Hybrid Approach**: Combines multiple methods for optimal results

### Cost Analysis
- Real-time currency rates from POE2Scout API
- Single attempt vs expected total cost calculations
- Currency breakdown and distribution charts
- Budget utilization tracking with warnings

### Supported Currencies
- All PoE 2 currencies including Perfect and Greater variants
- Homogenous Omens for targeted crafting
- Essences, Runes, and Distilled Emotions
- Proper PoE 2 rates (1 Chaos = 12 Exalted, 1 Divine = 380 Exalted)

## 🔐 OAuth Setup

To enable authentication with Path of Exile:

1. **Register OAuth Application**:
   - Visit: https://www.pathofexile.com/developer/docs
   - Create new OAuth application with:
     - **Grant Type**: Authorization Code with PKCE
     - **Redirect URI**: `http://localhost:3002/api/auth/callback`
     - **Scopes**: `account:characters`, `account:profile`

2. **Configure Environment**:
   ```bash
   # .env.local
   POE_CLIENT_ID=your_oauth_client_id_here
   NEXTAUTH_SECRET=your_random_secret_here
   NEXTAUTH_URL=http://localhost:3002
   ```

## 🎯 Development Status

### ✅ Phase 1: Core PoE 2 Integration (COMPLETE)
- ✅ Real PoE API integration with OAuth 2.0 PKCE authentication
- ✅ Mathematically accurate PoE 2 DPS calculator with correct formulas
- ✅ Interactive passive tree with canvas-based visualization
- ✅ Comprehensive character data parsing and display
- ✅ Spirit system support and combo mechanics

### ✅ Phase 2: Advanced Character Tools (COMPLETE)
- ✅ **Character Comparison Tool**: Side-by-side analysis with export functionality
- ✅ **Build Optimization Engine**: Jewel swapping "what-if" analysis with genetic algorithms
- ✅ **Equipment Upgrade System**: AI-powered upgrade recommendations with DPS impact

### ✅ Phase 3: Enhanced Analysis Features (COMPLETE)
- ✅ **Advanced Build Analysis**: Build Template System with complexity scoring
- ✅ **Enhanced Character Insights**: Comprehensive 5-tab character analysis system
- ✅ **Data-Driven Features**: Community Analytics with real-time insights

### 🚧 Phase 4: Advanced Calculations (IN PROGRESS)
- ✅ **Minion DPS Calculator**: Calculate summon/totem DPS with spirit optimization
- [ ] **DoT DPS Calculator**: Damage over time effects (ignite, poison, bleed)
- [ ] **Effective HP Calculator**: Total EHP with all mitigation layers
- [ ] **Status Effect Calculator**: Ailment effectiveness, duration, stacking
- [ ] **Future Level Planner**: Plan character progression to level 100

## 📁 Project Structure

```
poe-2-toolkit/
├── app/                      # Next.js App Router pages
│   ├── analytics/           # Community analytics dashboard
│   ├── api/                 # API routes & authentication
│   ├── compare/             # Character comparison tool
│   ├── dashboard/           # Main user dashboard
│   ├── dps-calculator/      # DPS calculation interface
│   ├── insights/            # Character insights analyzer
│   └── optimize/            # Build optimization tool
├── components/              # React components
│   ├── BuildTemplateManager.tsx
│   ├── CharacterInsightsAnalyzer.tsx
│   ├── CommunityAnalytics.tsx
│   └── DPSCalculator.tsx
├── contexts/                # React contexts (Auth, etc.)
├── hooks/                   # Custom React hooks
├── lib/                     # Core business logic
│   ├── calculator/          # DPS calculation engines
│   ├── database/            # Character database layer
│   └── auth/               # Authentication services
└── docs/                    # Documentation
```

## 🔧 Available Scripts

```bash
npm run dev        # Start development server (port 3002)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

## 🎯 Key Features Spotlight

### ⚡ Advanced DPS Calculator
- Accurate PoE 2 damage formulas with hit chance calculations
- Support for all damage types: physical, elemental, chaos
- Combo multiplier and spirit cost optimization
- Weapon swap and skill gem interaction analysis

### 🔍 Build Optimization Engine
- Genetic algorithm-powered optimization
- "What if I swap this jewel?" analysis
- Multi-objective optimization (DPS, defense, spirit efficiency)
- Real-time impact calculations

### 📊 Community Analytics
- Automatic character data collection (privacy-focused, localStorage only)
- Class distribution and build popularity tracking
- Equipment meta analysis and trends
- Level progression insights across the community

### 🧠 Character Insights System
- 5-tab analysis: Inventory, Gems, Weaknesses, Resources, Combat Style
- Build complexity scoring and difficulty assessment
- Skill gem synergy and conflict detection
- Resource efficiency optimization recommendations

## 🤝 Contributing

Contributions welcome! Areas needing help:
- **Calculations**: Minion DPS, DoT mechanics, defensive formulas
- **UI/UX**: Mobile responsiveness, accessibility improvements
- **Data**: PoE 2 item database expansion, skill gem interactions
- **Testing**: Build validation, edge case handling

## 📄 License

MIT License - see LICENSE file for details.

## ⚠️ Disclaimer

This is an unofficial fan-made tool. Not affiliated with Grinding Gear Games.

## 🔗 Resources

- [Path of Exile 2 Website](https://pathofexile2.com/)
- [PoE API Documentation](https://www.pathofexile.com/developer/docs)
- [Project Roadmap](./NEXT_STEPS.md)
- [Development Updates](https://github.com/your-repo/poe-2-toolkit/commits/main)

---

**⭐ Star this repo if the toolkit helps your PoE 2 theorycrafting!**