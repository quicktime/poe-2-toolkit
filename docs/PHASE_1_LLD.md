# Phase 1: Foundation (MVP) - Low Level Implementation Plan

## Implementation Timeline: 8-12 Weeks

## Week 1-2: Project Setup & Authentication

### 1.1 Project Initialization

#### Dependencies Installation
```bash
npm install @tanstack/react-query@^5.0.0 zustand@^4.5.0
npm install react-hook-form@^7.50.0 zod@^3.22.0 @hookform/resolvers@^3.3.0
npm install axios@^1.6.0 js-cookie@^3.0.5
npm install clsx@^2.1.0 tailwind-merge@^2.2.0
npm install -D @types/js-cookie
```

#### Shadcn UI Setup
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input label select tabs toast
```

### 1.2 Environment Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_POE_CLIENT_ID=your_client_id
NEXT_PUBLIC_POE_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_API_BASE_URL=https://api.pathofexile.com
```

### 1.3 Authentication Implementation

#### OAuth Service (`lib/auth/oauth.ts`)
```typescript
import crypto from 'crypto';
import Cookies from 'js-cookie';

export class OAuthService {
  private readonly clientId = process.env.NEXT_PUBLIC_POE_CLIENT_ID!;
  private readonly redirectUri = process.env.NEXT_PUBLIC_POE_REDIRECT_URI!;

  generatePKCE() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    sessionStorage.setItem('pkce_verifier', verifier);
    return { verifier, challenge };
  }

  getAuthorizationUrl(): string {
    const { challenge } = this.generatePKCE();
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'account:profile account:characters',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: crypto.randomBytes(16).toString('hex')
    });

    return `https://www.pathofexile.com/oauth/authorize?${params}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const verifier = sessionStorage.getItem('pkce_verifier');

    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        verifier,
        client_id: this.clientId,
        redirect_uri: this.redirectUri
      })
    });

    const data = await response.json();
    this.storeTokens(data);
    return data;
  }

  private storeTokens(tokens: TokenResponse) {
    // Store in httpOnly cookie via API route
    fetch('/api/auth/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens)
    });
  }
}
```

#### Auth Context (`contexts/AuthContext.tsx`)
```typescript
import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { OAuthService } from '@/lib/auth/oauth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const oauth = new OAuthService();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const login = () => {
    window.location.href = oauth.getAuthorizationUrl();
  };

  const logout = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout: logout.mutate,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## Week 3-4: API Integration Layer

### 2.1 Rate Limiter Implementation

#### Token Bucket Algorithm (`lib/api/rateLimiter.ts`)
```typescript
interface Bucket {
  tokens: number;
  lastRefill: number;
  capacity: number;
  refillRate: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private queue: Array<() => void> = [];

  constructor(
    private limits: RateLimitConfig = {
      requests: 20,
      window: 60000, // 1 minute
      maxBurst: 5
    }
  ) {}

  async acquire(endpoint: string): Promise<void> {
    const bucket = this.getBucket(endpoint);

    // Refill tokens based on time passed
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed * bucket.refillRate / 1000);

    bucket.tokens = Math.min(
      bucket.capacity,
      bucket.tokens + tokensToAdd
    );
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }

    // Queue the request if no tokens available
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private getBucket(endpoint: string): Bucket {
    if (!this.buckets.has(endpoint)) {
      this.buckets.set(endpoint, {
        tokens: this.limits.requests,
        lastRefill: Date.now(),
        capacity: this.limits.requests,
        refillRate: this.limits.requests / (this.limits.window / 1000)
      });
    }
    return this.buckets.get(endpoint)!;
  }

  private processQueue() {
    setTimeout(() => {
      const resolve = this.queue.shift();
      if (resolve) {
        this.acquire('').then(resolve);
      }
    }, 100);
  }
}
```

### 2.2 API Client Implementation

#### Base API Client (`lib/api/client.ts`)
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { RateLimiter } from './rateLimiter';

export class PoEAPIClient {
  private axios: AxiosInstance;
  private rateLimiter: RateLimiter;

  constructor() {
    this.axios = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      timeout: 10000
    });

    this.rateLimiter = new RateLimiter();
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth and rate limiting
    this.axios.interceptors.request.use(async (config) => {
      await this.rateLimiter.acquire(config.url || '');

      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    // Response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
          return this.axios.request(error.config!);
        }

        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          await this.delay(parseInt(retryAfter) * 1000 || 5000);
          return this.axios.request(error.config!);
        }

        throw error;
      }
    );
  }

  async getCharacters(): Promise<Character[]> {
    const { data } = await this.axios.get('/account/characters');
    return data.characters;
  }

  async getCharacter(name: string): Promise<CharacterDetails> {
    const { data } = await this.axios.get(`/character/${name}`);
    return data;
  }

  async getPassiveTree(character: string): Promise<PassiveTreeData> {
    const { data } = await this.axios.get(`/character/${character}/passives`);
    return data;
  }

  private async getAccessToken(): Promise<string | null> {
    const res = await fetch('/api/auth/token');
    const { access_token } = await res.json();
    return access_token;
  }

  private async refreshToken(): Promise<void> {
    await fetch('/api/auth/refresh', { method: 'POST' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2.3 React Query Setup

#### Query Client Configuration (`lib/queryClient.ts`)
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 2
    }
  }
});
```

## Week 5-6: Core Calculation Engine

### 3.1 Type Definitions

#### Core Types (`types/index.ts`)
```typescript
export interface Character {
  id: string;
  name: string;
  level: number;
  class: CharacterClass;
  ascendancy?: AscendancyClass;
  attributes: Attributes;
  equipment: Equipment;
  passives: PassiveAllocation[];
  skills: SkillSetup[];
}

export interface Attributes {
  strength: number;
  dexterity: number;
  intelligence: number;
  life: number;
  mana: number;
  energyShield: number;
}

export interface DamageRange {
  min: number;
  max: number;
}

export interface DamageCalculation {
  physical: DamageRange;
  fire: DamageRange;
  cold: DamageRange;
  lightning: DamageRange;
  chaos: DamageRange;
  total: DamageRange;
  dps: number;
  critChance: number;
  critMultiplier: number;
}
```

### 3.2 Calculation Engine Implementation

#### Base Damage Calculator (`lib/calculations/damage.ts`)
```typescript
export class DamageCalculator {
  calculate(character: Character, skill: Skill): DamageCalculation {
    const baseDamage = this.getBaseDamage(character, skill);
    const modifiers = this.collectModifiers(character);
    const finalDamage = this.applyModifiers(baseDamage, modifiers);

    return {
      ...finalDamage,
      dps: this.calculateDPS(finalDamage, character, skill)
    };
  }

  private getBaseDamage(character: Character, skill: Skill): DamageRange {
    if (skill.type === 'attack') {
      return this.getWeaponDamage(character.equipment.weapon, skill);
    } else {
      return this.getSpellDamage(skill, character.level);
    }
  }

  private getWeaponDamage(weapon: Weapon, skill: Skill): DamageRange {
    const effectiveness = skill.damageEffectiveness || 100;
    return {
      min: weapon.physicalDamage.min * effectiveness / 100,
      max: weapon.physicalDamage.max * effectiveness / 100
    };
  }

  private collectModifiers(character: Character): Modifier[] {
    const modifiers: Modifier[] = [];

    // Collect from passives
    character.passives.forEach(passive => {
      modifiers.push(...this.getPassiveModifiers(passive));
    });

    // Collect from equipment
    Object.values(character.equipment).forEach(item => {
      if (item) modifiers.push(...item.modifiers);
    });

    // Collect from skills
    character.skills.forEach(skill => {
      modifiers.push(...this.getSkillModifiers(skill));
    });

    return modifiers;
  }

  private applyModifiers(
    base: DamageRange,
    modifiers: Modifier[]
  ): DamageRange {
    let increased = 0;
    let more = 1;

    modifiers.forEach(mod => {
      if (mod.type === 'increased') {
        increased += mod.value;
      } else if (mod.type === 'more') {
        more *= (1 + mod.value / 100);
      }
    });

    return {
      min: base.min * (1 + increased / 100) * more,
      max: base.max * (1 + increased / 100) * more
    };
  }

  private calculateDPS(
    damage: DamageRange,
    character: Character,
    skill: Skill
  ): number {
    const avgDamage = (damage.min + damage.max) / 2;
    const attackSpeed = this.getAttackSpeed(character, skill);
    const critDamage = this.calculateCritDamage(avgDamage, character);

    return critDamage * attackSpeed;
  }
}
```

### 3.3 Web Worker Implementation

#### Calculation Worker (`workers/calculation.worker.ts`)
```typescript
import { DamageCalculator } from '@/lib/calculations/damage';
import { DefenseCalculator } from '@/lib/calculations/defense';

self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  try {
    let result;

    switch (type) {
      case 'CALCULATE_DPS':
        const damageCalc = new DamageCalculator();
        result = damageCalc.calculate(data.character, data.skill);
        break;

      case 'CALCULATE_DEFENSE':
        const defenseCalc = new DefenseCalculator();
        result = defenseCalc.calculate(data.character);
        break;

      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }

    self.postMessage({ id, result, success: true });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message,
      success: false
    });
  }
});
```

#### Worker Manager (`lib/workers/workerManager.ts`)
```typescript
export class WorkerManager {
  private workers: Worker[] = [];
  private queue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    task: any;
  }> = [];

  constructor(private workerCount = 4) {
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(
        new URL('../../workers/calculation.worker.ts', import.meta.url)
      );

      worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(event.data);
      });

      this.workers.push(worker);
    }
  }

  async calculate(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const task = { type, data, id };

      this.queue.push({ resolve, reject, task });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    const worker = this.getAvailableWorker();
    if (!worker) return;

    const item = this.queue.shift()!;
    worker.postMessage(item.task);
  }

  private getAvailableWorker(): Worker | null {
    // Simple round-robin for now
    return this.workers[0];
  }

  private handleWorkerMessage(message: any) {
    // Handle response and resolve promise
    // Process next item in queue
  }
}
```

## Week 7-8: Character Management UI

### 4.1 Character Components

#### Character List (`components/character/CharacterList.tsx`)
```typescript
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

export function CharacterList() {
  const { data: characters, isLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: () => apiClient.getCharacters()
  });

  if (isLoading) {
    return <CharacterListSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {characters?.map((character) => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <h3 className="text-lg font-semibold">{character.name}</h3>
      <p className="text-sm text-gray-600">
        Level {character.level} {character.class}
      </p>
      <div className="mt-2 flex justify-between text-sm">
        <span>Life: {character.attributes.life}</span>
        <span>ES: {character.attributes.energyShield}</span>
      </div>
    </Card>
  );
}
```

#### Character Detail View (`components/character/CharacterDetail.tsx`)
```typescript
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CharacterStats } from './CharacterStats';
import { EquipmentPanel } from './EquipmentPanel';
import { SkillsPanel } from './SkillsPanel';
import { PassiveTreeView } from './PassiveTreeView';

export function CharacterDetail({ character }: { character: Character }) {
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{character.name}</h1>
        <p className="text-gray-600">
          Level {character.level} {character.ascendancy || character.class}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="passives">Passive Tree</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <CharacterStats character={character} />
        </TabsContent>

        <TabsContent value="equipment">
          <EquipmentPanel character={character} />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsPanel character={character} />
        </TabsContent>

        <TabsContent value="passives">
          <PassiveTreeView character={character} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4.2 State Management

#### Character Store (`stores/characterStore.ts`)
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CharacterState {
  selectedCharacter: Character | null;
  characters: Character[];
  isLoading: boolean;

  setSelectedCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  allocatePassive: (nodeId: string) => void;
  deallocatePassive: (nodeId: string) => void;
  equipItem: (slot: EquipmentSlot, item: Item) => void;
}

export const useCharacterStore = create<CharacterState>()(
  immer((set) => ({
    selectedCharacter: null,
    characters: [],
    isLoading: false,

    setSelectedCharacter: (character) => set((state) => {
      state.selectedCharacter = character;
    }),

    updateCharacter: (id, updates) => set((state) => {
      const character = state.characters.find(c => c.id === id);
      if (character) {
        Object.assign(character, updates);
      }
      if (state.selectedCharacter?.id === id) {
        Object.assign(state.selectedCharacter, updates);
      }
    }),

    allocatePassive: (nodeId) => set((state) => {
      if (!state.selectedCharacter) return;

      state.selectedCharacter.passives.push({
        nodeId,
        allocated: true
      });
    }),

    deallocatePassive: (nodeId) => set((state) => {
      if (!state.selectedCharacter) return;

      state.selectedCharacter.passives = state.selectedCharacter.passives
        .filter(p => p.nodeId !== nodeId);
    }),

    equipItem: (slot, item) => set((state) => {
      if (!state.selectedCharacter) return;

      state.selectedCharacter.equipment[slot] = item;
    })
  }))
);
```

## Week 9-10: Passive Tree Integration

### 5.1 Passive Tree Data Structure

#### Tree Data Manager (`lib/passiveTree/treeData.ts`)
```typescript
interface PassiveNode {
  id: string;
  name: string;
  type: 'keystone' | 'notable' | 'normal' | 'jewel';
  position: { x: number; y: number };
  connections: string[];
  stats: string[];
  icon: string;
  isStarting?: boolean;
  ascendancyName?: string;
}

export class PassiveTreeData {
  private nodes: Map<string, PassiveNode>;
  private connections: Map<string, Set<string>>;

  constructor(treeData: any) {
    this.nodes = new Map();
    this.connections = new Map();
    this.parseTreeData(treeData);
  }

  private parseTreeData(data: any) {
    // Parse nodes
    Object.entries(data.nodes).forEach(([id, node]: [string, any]) => {
      this.nodes.set(id, {
        id,
        name: node.name,
        type: this.getNodeType(node),
        position: { x: node.x, y: node.y },
        connections: node.out || [],
        stats: node.stats || [],
        icon: node.icon,
        isStarting: node.isStartingNode,
        ascendancyName: node.ascendancyName
      });
    });

    // Build connection map
    this.nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        if (!this.connections.has(node.id)) {
          this.connections.set(node.id, new Set());
        }
        this.connections.get(node.id)!.add(targetId);
      });
    });
  }

  getNode(id: string): PassiveNode | undefined {
    return this.nodes.get(id);
  }

  getConnectedNodes(id: string): PassiveNode[] {
    const connections = this.connections.get(id);
    if (!connections) return [];

    return Array.from(connections)
      .map(nodeId => this.nodes.get(nodeId))
      .filter(Boolean) as PassiveNode[];
  }

  private getNodeType(node: any): PassiveNode['type'] {
    if (node.isKeystone) return 'keystone';
    if (node.isNotable) return 'notable';
    if (node.isJewelSocket) return 'jewel';
    return 'normal';
  }
}
```

### 5.2 Passive Tree Renderer

#### Tree Visualization Component (`components/passiveTree/TreeRenderer.tsx`)
```typescript
import { useRef, useEffect, useState } from 'react';
import { PassiveTreeData } from '@/lib/passiveTree/treeData';
import { PassiveNode } from '@/components/passiveTree/PassiveNode';
import { PassiveConnection } from '@/components/passiveTree/PassiveConnection';

interface TreeRendererProps {
  treeData: PassiveTreeData;
  allocatedNodes: string[];
  onNodeClick: (nodeId: string) => void;
}

export function TreeRenderer({
  treeData,
  allocatedNodes,
  onNodeClick
}: TreeRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.5, Math.min(3, prev * delta)));
    };

    svg.addEventListener('wheel', handleWheel);
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []);

  const viewBox = `${pan.x} ${pan.y} ${1920 / zoom} ${1080 / zoom}`;

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-gray-900"
      viewBox={viewBox}
    >
      <g className="connections">
        {renderConnections(treeData, allocatedNodes)}
      </g>
      <g className="nodes">
        {renderNodes(treeData, allocatedNodes, onNodeClick)}
      </g>
    </svg>
  );
}

function renderNodes(
  treeData: PassiveTreeData,
  allocatedNodes: string[],
  onNodeClick: (nodeId: string) => void
) {
  const nodes: JSX.Element[] = [];

  treeData.getAllNodes().forEach((node) => {
    const isAllocated = allocatedNodes.includes(node.id);
    const isReachable = isNodeReachable(node, allocatedNodes, treeData);

    nodes.push(
      <PassiveNode
        key={node.id}
        node={node}
        isAllocated={isAllocated}
        isReachable={isReachable}
        onClick={() => onNodeClick(node.id)}
      />
    );
  });

  return nodes;
}

function renderConnections(
  treeData: PassiveTreeData,
  allocatedNodes: string[]
) {
  const connections: JSX.Element[] = [];
  const rendered = new Set<string>();

  allocatedNodes.forEach((nodeId) => {
    const node = treeData.getNode(nodeId);
    if (!node) return;

    node.connections.forEach((targetId) => {
      const connectionKey = [nodeId, targetId].sort().join('-');
      if (rendered.has(connectionKey)) return;

      rendered.add(connectionKey);
      const target = treeData.getNode(targetId);
      if (!target) return;

      const isActive = allocatedNodes.includes(targetId);

      connections.push(
        <PassiveConnection
          key={connectionKey}
          from={node.position}
          to={target.position}
          isActive={isActive}
        />
      );
    });
  });

  return connections;
}
```

## Week 11-12: Testing & Deployment

### 6.1 Testing Setup

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
};
```

### 6.2 Unit Tests

#### Damage Calculator Tests (`__tests__/calculations/damage.test.ts`)
```typescript
import { DamageCalculator } from '@/lib/calculations/damage';
import { mockCharacter, mockSkill } from '../mocks';

describe('DamageCalculator', () => {
  let calculator: DamageCalculator;

  beforeEach(() => {
    calculator = new DamageCalculator();
  });

  describe('calculate', () => {
    it('should calculate base weapon damage correctly', () => {
      const character = mockCharacter({
        equipment: {
          weapon: {
            physicalDamage: { min: 100, max: 200 }
          }
        }
      });

      const result = calculator.calculate(character, mockSkill());

      expect(result.physical.min).toBeGreaterThanOrEqual(100);
      expect(result.physical.max).toBeGreaterThanOrEqual(200);
    });

    it('should apply increased damage modifiers', () => {
      const character = mockCharacter({
        passives: [{
          nodeId: '1',
          modifiers: [{
            type: 'increased',
            stat: 'physical_damage',
            value: 50
          }]
        }]
      });

      const baseResult = calculator.calculate(
        mockCharacter(),
        mockSkill()
      );
      const modifiedResult = calculator.calculate(character, mockSkill());

      expect(modifiedResult.physical.min).toBeCloseTo(
        baseResult.physical.min * 1.5
      );
    });

    it('should calculate DPS with attack speed', () => {
      const character = mockCharacter({
        equipment: {
          weapon: {
            physicalDamage: { min: 100, max: 100 },
            attackSpeed: 2.0
          }
        }
      });

      const result = calculator.calculate(character, mockSkill());

      expect(result.dps).toBe(200); // 100 damage * 2 attacks/sec
    });
  });
});
```

### 6.3 Integration Tests

#### API Integration Tests (`__tests__/api/client.test.ts`)
```typescript
import { PoEAPIClient } from '@/lib/api/client';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('*/account/characters', (req, res, ctx) => {
    return res(
      ctx.json({
        characters: [
          { id: '1', name: 'TestChar', level: 90 }
        ]
      })
    );
  })
);

describe('PoEAPIClient', () => {
  let client: PoEAPIClient;

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    client = new PoEAPIClient();
  });

  it('should fetch characters successfully', async () => {
    const characters = await client.getCharacters();

    expect(characters).toHaveLength(1);
    expect(characters[0].name).toBe('TestChar');
  });

  it('should handle rate limiting', async () => {
    server.use(
      rest.get('*/account/characters', (req, res, ctx) => {
        return res(
          ctx.status(429),
          ctx.set('Retry-After', '1')
        );
      })
    );

    const startTime = Date.now();
    await client.getCharacters();
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
  });
});
```

### 6.4 E2E Tests

#### Character Flow Test (`e2e/character.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Character Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    // Mock authentication
  });

  test('should display character list', async ({ page }) => {
    await page.goto('/characters');
    await expect(page.locator('.character-card')).toHaveCount(3);
  });

  test('should show character details', async ({ page }) => {
    await page.goto('/characters');
    await page.click('.character-card:first-child');

    await expect(page.locator('h1')).toContainText('TestCharacter');
    await expect(page.locator('text=Level 90')).toBeVisible();
  });

  test('should calculate DPS', async ({ page }) => {
    await page.goto('/characters/1');
    await page.click('text=Stats');

    const dpsValue = await page.locator('[data-testid="dps-value"]');
    await expect(dpsValue).toContainText(/\d+/);
  });
});
```

### 6.5 Deployment Configuration

#### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_POE_CLIENT_ID": "@poe_client_id",
    "NEXT_PUBLIC_POE_REDIRECT_URI": "@poe_redirect_uri",
    "NEXT_PUBLIC_API_BASE_URL": "@api_base_url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

#### GitHub Actions CI/CD (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run typecheck

      - name: Run tests
        run: npm test -- --coverage

      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Implementation Checklist

### Week 1-2: ✅ Setup & Auth
- [ ] Project initialization
- [ ] Environment configuration
- [ ] OAuth implementation
- [ ] Auth context and hooks
- [ ] Protected routes

### Week 3-4: ✅ API Integration
- [ ] Rate limiter
- [ ] API client
- [ ] Error handling
- [ ] Request interceptors
- [ ] Response caching

### Week 5-6: ✅ Calculation Engine
- [ ] Type definitions
- [ ] Damage calculator
- [ ] Defense calculator
- [ ] Modifier system
- [ ] Web Workers

### Week 7-8: ✅ Character UI
- [ ] Character list
- [ ] Character detail
- [ ] Stats display
- [ ] Equipment panel
- [ ] State management

### Week 9-10: ✅ Passive Tree
- [ ] Tree data structure
- [ ] Tree renderer
- [ ] Node allocation
- [ ] Path validation
- [ ] Tree search

### Week 11-12: ✅ Testing & Deploy
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] CI/CD pipeline
- [ ] Production deployment

## Success Metrics

### Performance Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Calculation Response: < 500ms
- API Response: < 200ms (cached)

### Code Quality
- TypeScript coverage: 100%
- Test coverage: > 80%
- ESLint errors: 0
- Bundle size: < 500KB

### User Experience
- Mobile responsive
- Offline capability
- Real-time calculations
- Intuitive navigation