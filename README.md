# Path of Exile 2 Toolkit

A comprehensive character planning and build optimization platform specifically for **Path of Exile 2** (Early Access - Patch 0.3+).

> ⚠️ **Note**: This toolkit is designed exclusively for Path of Exile 2 and includes all the new mechanics introduced in the sequel. It is NOT compatible with Path of Exile 1.

## 🚀 Features (Path of Exile 2 Specific)

### Core Features
- **OAuth Authentication**: Secure login with Path of Exile account
- **Character Management**: Import and manage your PoE 2 characters
- **DPS Calculator**: Advanced damage calculations with PoE 2 mechanics
- **Passive Tree Planner**: Interactive passive tree for all 6 classes
- **Build Optimizer**: AI-powered optimization using genetic algorithms
- **Equipment Analysis**: Upgrade recommendations and efficiency scoring

### Path of Exile 2 Exclusive Mechanics
- **Spirit System**: Manage spirit reservations for buffs and minions
- **Combo System**: Calculate combo multipliers for melee builds
- **Uncut Gem Support**: Optimize support gem configurations with spirit costs
- **Honor Resistance**: Track and optimize honor resistance
- **Dodge Roll Mechanics**: Factor dodge rolls into defensive calculations
- **Dual Weapon Sets**: Manage and optimize weapon swap configurations
- **New Flask System**: Charge-based flask optimization

### Supported Classes & Ascendancies
- **Warrior**: Warbringer, Titan
- **Monk**: Invoker, Acolyte of Chayula
- **Ranger**: Deadeye, Survivalist
- **Mercenary**: Witchhunter, Gemling Legionnaire
- **Witch**: Infernalist, Blood Mage
- **Sorceress**: Stormweaver, Chronomancer

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, React
- **Styling**: Tailwind CSS
- **State Management**: React Query, Zustand
- **Authentication**: OAuth 2.0 with PKCE
- **Performance**: Web Workers, Service Workers

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/quicktime/poe-2-toolkit.git
cd poe-2-toolkit
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 OAuth Setup

To enable authentication with Path of Exile:

1. Create `.env.local` from the example:
```bash
cp .env.local.example .env.local
```

2. Register with Path of Exile OAuth:
   - Visit https://www.pathofexile.com/developer/docs
   - Create a new OAuth application with these settings:
     - **Grant Type**: Authorization Code with PKCE
     - **Redirect URI**: `http://localhost:3000/auth/callback`
     - **Scopes**: `account:profile`, `account:characters`, `account:stashes`
   - Copy your Client ID to `.env.local` (no client secret needed for PKCE)

## 🔐 Authentication Flow

The toolkit uses OAuth 2.0 with PKCE for secure authentication:

1. User clicks "Sign in with Path of Exile"
2. Redirected to Path of Exile OAuth authorization
3. User grants permissions
4. Redirected back with authorization code
5. Code exchanged for access token
6. Token stored in httpOnly cookies

## 📁 Project Structure

```
poe-2-toolkit/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   └── login/             # Login page
├── components/            # React components
├── contexts/              # React contexts
├── lib/                   # Utility libraries
│   └── auth/             # Authentication service
├── docs/                  # Documentation
│   ├── PHASE_*_HLD.md    # High-level design docs
│   └── PHASE_*_LLD.md    # Low-level implementation docs
└── public/                # Static assets
```

## 🔧 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

## 📝 Development Roadmap

### Phase 1: Foundation (Current) ✅
- [x] OAuth authentication
- [x] Basic project setup
- [x] User dashboard
- [ ] Character import
- [ ] Basic calculations

### Phase 2: Advanced Mechanics
- [ ] Skill interactions
- [ ] Support gem calculations
- [ ] Defensive mechanics
- [ ] DoT systems

### Phase 3: Optimization
- [ ] Genetic algorithm optimizer
- [ ] Equipment analysis
- [ ] Build comparison
- [ ] Recommendations

### Phase 4: Polish
- [ ] PWA support
- [ ] Mobile optimization
- [ ] Advanced visualizations
- [ ] Community features

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This is an unofficial fan-made tool. Not affiliated with Grinding Gear Games.

## 🔗 Resources

- [Path of Exile API Documentation](https://www.pathofexile.com/developer/docs)
- [Project Documentation](./docs/DESIGN_OVERVIEW.md)
- [Implementation Roadmap](./docs/IMPLEMENTATION_ROADMAP.md)
