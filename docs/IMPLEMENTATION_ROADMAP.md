# Implementation Roadmap - Getting Started

## 🚀 Quick Start Development Guide

This roadmap provides concrete next steps to begin implementing the Path of Exile 2 Toolkit based on the comprehensive design documentation.

## Week 1: Foundation Setup

### Day 1-2: Authentication System
```bash
# Install auth dependencies
npm install jose cookies-next

# Create auth structure
mkdir -p lib/auth app/auth app/api/auth
```

**Files to create:**
1. `lib/auth/oauth.ts` - OAuth PKCE implementation
2. `app/auth/callback/page.tsx` - OAuth callback handler
3. `app/api/auth/token/route.ts` - Token exchange endpoint
4. `app/api/auth/refresh/route.ts` - Token refresh endpoint
5. `contexts/AuthContext.tsx` - React context for auth state

### Day 3-4: API Client Setup
```bash
# Install API dependencies
npm install axios p-queue

# Create API structure
mkdir -p lib/api lib/cache
```

**Files to create:**
1. `lib/api/client.ts` - Main API client
2. `lib/api/rateLimiter.ts` - Rate limiting implementation
3. `lib/api/types.ts` - API type definitions
4. `lib/cache/manager.ts` - Cache management

### Day 5: Basic UI Components
```bash
# Install shadcn/ui CLI and add components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card tabs skeleton
```

**Components to create:**
1. `components/layout/Header.tsx` - App header with auth
2. `components/layout/Navigation.tsx` - Main navigation
3. `components/character/CharacterCard.tsx` - Character display card
4. `app/layout.tsx` - Update with providers

## Week 2: Core Features

### Day 1-2: Character Management
**Features to implement:**
- Character list fetching
- Character detail view
- Character state management (Zustand)
- Character data caching

### Day 3-4: Calculation Engine
**Core calculations to implement:**
- Base damage calculation
- Modifier system (increased vs more)
- Attack/cast speed calculations
- Critical strike calculations

### Day 5: Testing Setup
```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @types/jest jest-environment-jsdom
```

## Week 3-4: Advanced Features

### Passive Tree Visualization
- SVG-based tree renderer
- Node allocation system
- Path validation
- Zoom/pan controls

### Web Worker Integration
- Calculation worker setup
- Message passing system
- Result caching
- Error handling

## Priority Implementation Order

### 🔴 Critical Path (Must Have for MVP)
1. ✅ Project setup and configuration
2. 🔄 Authentication system
3. 🔄 API client with rate limiting
4. 🔄 Character data fetching
5. 🔄 Basic damage calculations
6. 🔄 Simple UI for character display

### 🟡 Important Features (Phase 1 Completion)
1. Passive tree visualization
2. Equipment system
3. Skill gem setup
4. Defense calculations
5. Caching layer
6. Error handling

### 🟢 Nice to Have (Future Phases)
1. Build optimization
2. Multi-build comparison
3. Advanced visualizations
4. Community features
5. Mobile optimization

## Development Checklist

### Environment Setup ✅
- [x] Next.js project initialized
- [x] TypeScript configured
- [x] Tailwind CSS setup
- [x] Development server running
- [ ] Environment variables configured
- [ ] Git repository setup

### Phase 1 Foundation 🔄
- [ ] OAuth authentication
- [ ] API client implementation
- [ ] Rate limiting
- [ ] Character management
- [ ] Basic calculations
- [ ] Passive tree integration
- [ ] Testing framework
- [ ] Deployment pipeline

### Phase 2 Advanced 📋
- [ ] Skill interactions
- [ ] Support gems
- [ ] Defense calculations
- [ ] DoT system
- [ ] Keystone effects

### Phase 3 Optimization 📋
- [ ] Build optimizer
- [ ] Equipment analyzer
- [ ] Comparison tools
- [ ] Recommendations

### Phase 4 Polish 📋
- [ ] Performance optimization
- [ ] Mobile support
- [ ] Visualizations
- [ ] Community features

## Sample Implementation Code

### Quick Start: Character Fetching Hook
```typescript
// hooks/useCharacters.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await apiClient.get('/account/characters');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Quick Start: Damage Calculation
```typescript
// lib/calculations/quick-damage.ts
export function calculateBaseDPS(
  weapon: Weapon,
  attackSpeed: number,
  modifiers: Modifier[]
): number {
  const avgDamage = (weapon.minDamage + weapon.maxDamage) / 2;
  const increased = modifiers
    .filter(m => m.type === 'increased')
    .reduce((sum, m) => sum + m.value, 0);
  const more = modifiers
    .filter(m => m.type === 'more')
    .reduce((mult, m) => mult * (1 + m.value / 100), 1);

  return avgDamage * (1 + increased / 100) * more * attackSpeed;
}
```

## Resources & References

### Documentation
- [Design Overview](./DESIGN_OVERVIEW.md) - Complete system design
- [Phase 1 HLD](./PHASE_1_HLD.md) - Architecture details
- [Phase 1 LLD](./PHASE_1_LLD.md) - Implementation details

### External Resources
- [Path of Exile API Docs](https://www.pathofexile.com/developer/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Query Guide](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Getting Help

When implementing features:
1. Refer to the detailed LLD documents for code examples
2. Check the HLD documents for architecture decisions
3. Use the CLAUDE.md file for coding standards
4. Follow the established patterns in existing code

## Next Immediate Steps

1. **Configure Environment Variables**
   - Create `.env.local` file
   - Add PoE API credentials
   - Configure OAuth settings

2. **Implement First Feature**
   - Start with authentication
   - Test OAuth flow
   - Verify token storage

3. **Create First Component**
   - Build character list view
   - Add loading states
   - Implement error handling

4. **Set Up Testing**
   - Write first unit test
   - Set up CI pipeline
   - Configure test coverage

---

Ready to start coding? Begin with the authentication system in Week 1, Day 1-2!