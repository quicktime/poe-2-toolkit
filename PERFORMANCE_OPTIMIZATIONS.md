# Performance Optimizations

This document outlines all performance optimizations implemented in the PoE 2 Toolkit.

## Bundle Size Optimization

### Dynamic Imports
Heavy components are lazy-loaded to reduce initial bundle size:

```typescript
// lib/utils/dynamicImports.ts
import dynamic from 'next/dynamic';

export const DynamicBuildOptimizer = dynamic(
  () => import('@/components/BuildOptimizer'),
  { ssr: false, loading: DynamicLoading }
);
```

**Components Using Dynamic Imports:**
- BuildOptimizer
- DPSCalculator
- DotDPSCalculator
- MinionDPSCalculator
- PassiveTreeViewer
- CharacterPassiveTreeViewer
- CharacterComparisonView
- ComprehensiveCharacterView
- CharacterInsightsAnalyzer
- EquipmentUpgradeAnalyzer
- CraftingSimulator
- MarketSearch
- CommunityAnalytics
- CraftOfExileInterface

### Next.js Configuration

```javascript
// next.config.mjs
{
  swcMinify: true, // Faster minification with SWC
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] } // Remove console.logs in production
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Modern image formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  }
}
```

### Bundle Analyzer
Analyze bundle size:
```bash
npm run build:analyze
```

Opens interactive treemap showing bundle composition.

---

## Runtime Performance

### Web Workers
Heavy calculations run off the main thread:

**DPS Calculations:**
```typescript
import { useDPSWorker } from '@/hooks/useDPSWorker';

const { calculateDPS, isReady } = useDPSWorker();
const result = await calculateDPS({ baseDamage, attackSpeed, ... });
```

**Build Optimization:**
- Genetic algorithm runs in optimization.worker.ts
- Prevents UI freezing during complex calculations

### Multi-Layer Caching

**Memory Cache (L1):**
- Instant access for frequently used data
- 5-minute default TTL
- Automatic cleanup

**IndexedDB (L2):**
- Persistent storage across sessions
- Survives page reloads
- Tag-based invalidation

```typescript
import { getMultiLayerCache, CacheKeys, CacheTTL } from '@/lib/cache/multiLayerCache';

const cache = getMultiLayerCache();

// Set with 30min TTL
await cache.set(
  CacheKeys.character('MyChar'),
  data,
  { ttl: CacheTTL.LONG }
);

// Get (checks memory first, then IndexedDB)
const data = await cache.get(CacheKeys.character('MyChar'));
```

### Rate Limiting
Prevents redundant API calls:

- Token bucket algorithm
- Multi-tier limits (IP + Account)
- Automatic request queuing
- Respects PoE API limits: 45/15s (IP), 240/240s (Account)

---

## Image Optimization

### Formats
- AVIF (best compression, modern browsers)
- WebP (good compression, wide support)
- Automatic format selection based on browser support

### Responsive Images
Automatic srcset generation for device sizes:
- 640px (mobile)
- 750px (mobile landscape)
- 828px (tablet)
- 1080px (desktop)
- 1200px (large desktop)
- 1920px (Full HD)
- 2048px (Retina)
- 3840px (4K)

---

## Code Splitting

### Route-Based
Next.js automatically splits code by route:
- `/optimize` page loads BuildOptimizer only when visited
- `/dps-calculator` loads DPSCalculator only when visited
- `/crafting` loads CraftingSimulator only when visited

### Component-Based
Heavy components split into separate chunks:
- PassiveTree components (~200KB)
- Calculator components (~150KB)
- Crafting components (~300KB)

---

## Production Optimizations

### SWC Minification
- Faster build times (3-5x faster than Terser)
- Better tree-shaking
- Smaller output bundles

### Console Removal
Production builds automatically remove:
- `console.log()`
- `console.info()`
- `console.debug()`

Keeps:
- `console.error()`
- `console.warn()`

### Tree Shaking
Unused code automatically removed:
- Lodash functions (only imports used functions)
- Radix UI components (only imports used components)
- Utility functions (dead code elimination)

---

## Measuring Performance

### Bundle Size
```bash
npm run build:analyze
```

### Lighthouse Scores
Target metrics:
- **Performance:** >90
- **Accessibility:** >95
- **Best Practices:** >95
- **SEO:** >95

### Core Web Vitals
- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1

### Custom Metrics
```typescript
// Monitor cache performance
const cache = getMultiLayerCache();
const stats = await cache.getStats();
console.log(stats);
// { memory: { entries, size }, indexedDB: { totalEntries, totalSize, ... } }

// Monitor rate limiter
import apiClient from '@/lib/api/client';
const rateLimitStats = apiClient.getRateLimitStats();
// { ip: { availableTokens, queueLength, ... }, account: { ... } }
```

---

## Best Practices

### 1. Use Dynamic Imports for Heavy Components
```typescript
// ❌ Bad
import HeavyComponent from '@/components/HeavyComponent';

// ✅ Good
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

### 2. Cache API Responses
```typescript
// ❌ Bad
const data = await fetch('/api/characters');

// ✅ Good
const cache = getMultiLayerCache();
let data = await cache.get(CacheKeys.characterList());
if (!data) {
  data = await fetch('/api/characters');
  await cache.set(CacheKeys.characterList(), data, { ttl: CacheTTL.MEDIUM });
}
```

### 3. Use Web Workers for Heavy Calculations
```typescript
// ❌ Bad
const result = heavyCalculation(data); // Blocks UI

// ✅ Good
const { calculateDPS } = useDPSWorker();
const result = await calculateDPS(data); // Non-blocking
```

### 4. Optimize Images
```typescript
// ❌ Bad
<img src="/character.png" />

// ✅ Good
import Image from 'next/image';
<Image src="/character.png" width={800} height={600} alt="Character" />
```

---

## Future Optimizations

### Planned
- [ ] Preload critical resources
- [ ] Service Worker for offline support
- [ ] Resource hints (prefetch, preconnect)
- [ ] Static page generation where possible
- [ ] Edge caching with Vercel Edge Network

### Under Consideration
- [ ] Virtual scrolling for long lists
- [ ] Pagination for character lists
- [ ] Debounced search inputs
- [ ] Compressed API responses (gzip/brotli)

---

## Performance Budget

Target bundle sizes (gzipped):
- **Initial JS:** <200KB
- **Per Route:** <100KB
- **Total JS:** <500KB
- **CSS:** <50KB
- **Images:** <1MB total

Current Performance:
- ✅ Initial load optimized with code splitting
- ✅ Heavy components lazy-loaded
- ✅ Images optimized (AVIF/WebP)
- ✅ API calls cached and rate-limited
- ✅ Calculations run in Web Workers

---

**Last Updated:** October 7, 2025
