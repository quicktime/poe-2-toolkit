# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Path of Exile 2 Toolkit** - A comprehensive web application for character planning, build optimization, and damage calculations specifically for **Path of Exile 2 (Patch 0.3+)**.

⚠️ **IMPORTANT**: This toolkit is for Path of Exile 2 ONLY. Do not use or reference Path of Exile 1 mechanics, calculations, or data.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**:
  - React Query (TanStack Query) for API state
  - Zustand for global state management
- **Forms**: React Hook Form + Zod validation

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Base UI components (Shadcn/UI)
│   ├── character/          # Character-specific components
│   ├── calculator/         # Calculation UI components
│   └── shared/             # Shared components
├── lib/
│   ├── api/               # API integration layer (OAuth, rate limiting)
│   ├── calculations/      # Calculation engine (damage, defense, DoT)
│   ├── data/             # Static game data
│   └── utils/            # Utility functions
├── hooks/                # Custom React hooks
├── stores/              # Zustand stores
└── types/               # TypeScript type definitions
```

## Key Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests (when implemented)
npm test
```

## Architecture Overview

### API Integration
- OAuth 2.0 PKCE flow for Path of Exile API authentication
- Rate limiting with token bucket algorithm and request queuing
- Automatic token refresh and secure httpOnly cookie storage
- Exponential backoff for API errors

### Path of Exile 2 Specific Systems (Patch 0.3)

#### Core Mechanics
- **Spirit System**: Replaces mana reservation, used for persistent buffs and minions
- **Uncut Gems**: New support gem system with spirit costs
- **Combo System**: Melee attacks chain into combos with damage multipliers
- **Honor Resistance**: Additional defensive layer alongside traditional resistances
- **Dodge Roll**: Active defensive mechanic with invincibility frames
- **Weapon Swap**: Dual weapon sets with passive bonuses

#### Calculation Engine (PoE 2 Specific)
The calculation engine follows Path of Exile 2's damage calculation order:
1. Base damage (weapon/spell)
2. Combo multipliers (for melee)
3. Added damage
4. Increased damage modifiers (additive)
5. More damage modifiers (multiplicative)
6. Spirit efficiency multiplier
7. Critical strikes and multipliers
8. Damage over time effects

### Key Systems
- **PassiveTreeManager**: Handles passive node allocation, validation, and modifier collection
- **ModifierSystem**: Applies damage modifiers in correct order (base → added → increased → more)
- **SkillInteractionManager**: Processes skill combinations and triggered effects
- **EHPCalculator**: Calculates effective HP across damage types
- **DoTCalculator**: Handles ignite, poison, bleed, and other DoT mechanics
- **KeystoneManager**: Implements special keystone mechanics and interactions

### Optimization Features
- Genetic algorithm for full build optimization
- Incremental optimizer for passive node recommendations
- Equipment upgrade analyzer with market price awareness
- Multi-build comparison framework

## Implementation Phases

The project follows a 4-phase implementation plan:

1. **Phase 1 (MVP)**: Core API integration, basic DPS calculations, character management, passive tree
2. **Phase 2 (Advanced)**: Complex skill interactions, support gems, defensive calculations, keystones
3. **Phase 3 (Optimization)**: Build optimization algorithms, equipment analysis, comparisons
4. **Phase 4 (Polish)**: Performance optimization, mobile support, visualizations, community features

## Important Implementation Notes

- All calculations use Web Workers to prevent UI blocking
- Implement comprehensive caching with IndexedDB for persistence and memory cache for performance
- Rate limiting must respect Path of Exile API limits to prevent account issues
- Character data should be sanitized before sharing to remove sensitive information
- Error handling should provide user-friendly messages while logging detailed context for debugging

## Testing Approach

- Unit tests for calculation engine accuracy
- Integration tests for API rate limiting and error handling
- Component tests for UI interactions
- E2E tests for critical user flows (when implemented)