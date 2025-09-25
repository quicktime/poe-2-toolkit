# Phase 4: Polish & Advanced Features - Low Level Implementation Plan

## Implementation Timeline: 6-8 Weeks

## Week 1-2: Performance Optimization & PWA

### 1.1 Service Worker Implementation

#### Service Worker Setup (`public/sw.js`)
```javascript
const CACHE_NAME = 'poe2-toolkit-v1';
const STATIC_CACHE = 'poe2-static-v1';
const DATA_CACHE = 'poe2-data-v1';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== DATA_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-builds') {
    event.waitUntil(syncBuilds());
  }
});

async function syncBuilds() {
  const db = await openDB();
  const unsyncedBuilds = await db.getAllFromIndex('builds', 'syncStatus', 'pending');

  for (const build of unsyncedBuilds) {
    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(build)
      });

      if (response.ok) {
        build.syncStatus = 'synced';
        await db.put('builds', build);
      }
    } catch (error) {
      console.error('Sync failed for build:', build.id);
    }
  }
}
```

#### Service Worker Registration (`lib/serviceWorker/register.ts`)
```typescript
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // New service worker activated
            if (window.confirm('New version available! Refresh to update?')) {
              window.location.reload();
            }
          }
        });
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 1000 * 60 * 60); // Every hour

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// Background sync registration
export async function registerBackgroundSync() {
  const registration = await navigator.serviceWorker.ready;

  if ('sync' in registration) {
    await registration.sync.register('sync-builds');
  }
}

// Push notification setup
export async function setupPushNotifications() {
  const registration = await navigator.serviceWorker.ready;

  if ('PushManager' in window) {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
    });

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  }
}
```

### 1.2 Web Worker Pool Implementation

#### Worker Pool Manager (`lib/workers/pool.ts`)
```typescript
interface WorkerTask {
  id: string;
  type: string;
  data: any;
  priority: number;
  timeout?: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeJobs = new Map<Worker, WorkerTask>();

  constructor(
    private workerScript: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initializePool();
  }

  private initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);

      worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(worker, event);
      });

      worker.addEventListener('error', (error) => {
        this.handleWorkerError(worker, error);
      });

      this.workers.push(worker);
      this.available.push(worker);
    }
  }

  async execute<T>(type: string, data: any, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: crypto.randomUUID(),
        type,
        data,
        priority,
        resolve,
        reject
      };

      this.enqueueTask(task);
    });
  }

  private enqueueTask(task: WorkerTask) {
    // Insert based on priority
    const insertIndex = this.taskQueue.findIndex(t => t.priority < task.priority);

    if (insertIndex === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIndex, 0, task);
    }

    this.processQueue();
  }

  private processQueue() {
    while (this.available.length > 0 && this.taskQueue.length > 0) {
      const worker = this.available.shift()!;
      const task = this.taskQueue.shift()!;

      this.activeJobs.set(worker, task);

      worker.postMessage({
        id: task.id,
        type: task.type,
        data: task.data
      });

      // Setup timeout if specified
      if (task.timeout) {
        setTimeout(() => {
          if (this.activeJobs.has(worker)) {
            this.handleTimeout(worker, task);
          }
        }, task.timeout);
      }
    }
  }

  private handleWorkerMessage(worker: Worker, event: MessageEvent) {
    const task = this.activeJobs.get(worker);
    if (!task) return;

    const { id, result, error } = event.data;

    if (id !== task.id) return;

    this.activeJobs.delete(worker);
    this.available.push(worker);

    if (error) {
      task.reject(error);
    } else {
      task.resolve(result);
    }

    this.processQueue();
  }

  private handleWorkerError(worker: Worker, error: ErrorEvent) {
    const task = this.activeJobs.get(worker);
    if (!task) return;

    this.activeJobs.delete(worker);

    // Replace crashed worker
    const newWorker = new Worker(this.workerScript);
    newWorker.addEventListener('message', (event) => {
      this.handleWorkerMessage(newWorker, event);
    });

    const index = this.workers.indexOf(worker);
    this.workers[index] = newWorker;
    this.available.push(newWorker);

    task.reject(error);
    this.processQueue();
  }

  private handleTimeout(worker: Worker, task: WorkerTask) {
    this.activeJobs.delete(worker);
    worker.terminate();

    // Create new worker
    const newWorker = new Worker(this.workerScript);
    newWorker.addEventListener('message', (event) => {
      this.handleWorkerMessage(newWorker, event);
    });

    const index = this.workers.indexOf(worker);
    this.workers[index] = newWorker;
    this.available.push(newWorker);

    task.reject(new Error('Worker timeout'));
    this.processQueue();
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.available = [];
    this.taskQueue = [];
    this.activeJobs.clear();
  }
}
```

### 1.3 Advanced Caching System

#### Multi-layer Cache (`lib/cache/multiLayerCache.ts`)
```typescript
import { LRUCache } from 'lru-cache';
import { openDB, IDBPDatabase } from 'idb';

interface CacheLayer {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class MemoryCacheLayer implements CacheLayer {
  private cache: LRUCache<string, any>;

  constructor(maxSize = 100) {
    this.cache = new LRUCache({
      max: maxSize,
      ttl: 1000 * 60 * 5, // 5 minutes default TTL
      updateAgeOnGet: true
    });
  }

  async get(key: string) {
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number) {
    this.cache.set(key, value, { ttl });
  }

  async delete(key: string) {
    this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }
}

class IndexedDBCacheLayer implements CacheLayer {
  private db: IDBPDatabase | null = null;

  async initialize() {
    this.db = await openDB('poe2-cache', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiry', 'expiry');
        }
      }
    });

    // Clean expired entries periodically
    this.cleanExpired();
    setInterval(() => this.cleanExpired(), 60000);
  }

  async get(key: string) {
    if (!this.db) await this.initialize();

    const entry = await this.db!.get('cache', key);

    if (!entry) return null;

    if (entry.expiry && entry.expiry < Date.now()) {
      await this.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any, ttl?: number) {
    if (!this.db) await this.initialize();

    const entry = {
      key,
      value,
      expiry: ttl ? Date.now() + ttl : null,
      timestamp: Date.now()
    };

    await this.db!.put('cache', entry);
  }

  async delete(key: string) {
    if (!this.db) await this.initialize();
    await this.db!.delete('cache', key);
  }

  async clear() {
    if (!this.db) await this.initialize();
    await this.db!.clear('cache');
  }

  private async cleanExpired() {
    if (!this.db) return;

    const tx = this.db.transaction('cache', 'readwrite');
    const index = tx.objectStore('cache').index('expiry');
    const range = IDBKeyRange.upperBound(Date.now());

    for await (const cursor of index.iterate(range)) {
      await cursor.delete();
    }
  }
}

export class MultiLayerCache {
  private layers: CacheLayer[] = [];

  constructor() {
    this.layers = [
      new MemoryCacheLayer(100),
      new IndexedDBCacheLayer()
    ];
  }

  async get(key: string): Promise<any> {
    for (const layer of this.layers) {
      const value = await layer.get(key);

      if (value !== null && value !== undefined) {
        // Promote to higher layers
        for (let i = 0; i < this.layers.indexOf(layer); i++) {
          await this.layers[i].set(key, value);
        }

        return value;
      }
    }

    return null;
  }

  async set(key: string, value: any, options?: { ttl?: number; layers?: number[] }) {
    const targetLayers = options?.layers || [0, 1]; // Default to all layers

    await Promise.all(
      targetLayers.map(index =>
        this.layers[index]?.set(key, value, options?.ttl)
      )
    );
  }

  async delete(key: string) {
    await Promise.all(
      this.layers.map(layer => layer.delete(key))
    );
  }

  async clear() {
    await Promise.all(
      this.layers.map(layer => layer.clear())
    );
  }

  // Intelligent preloading based on user patterns
  async predictivePreload(userPattern: UserPattern) {
    const predictions = this.analyzePredictions(userPattern);

    for (const prediction of predictions) {
      if (prediction.probability > 0.7) {
        // Preload data if high probability
        const data = await this.fetchData(prediction.key);
        await this.set(prediction.key, data, { ttl: 60000 });
      }
    }
  }

  private analyzePredictions(pattern: UserPattern): Prediction[] {
    // Analyze user navigation patterns and predict next data needs
    // This would use ML or statistical models in production
    return [];
  }
}
```

## Week 3-4: Mobile Optimization

### 2.1 Responsive Design System

#### Responsive Hooks (`hooks/useResponsive.ts`)
```typescript
import { useState, useEffect } from 'react';

interface Breakpoints {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  wide: boolean;
}

export function useResponsive() {
  const [breakpoints, setBreakpoints] = useState<Breakpoints>({
    mobile: false,
    tablet: false,
    desktop: false,
    wide: false
  });

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;

      setBreakpoints({
        mobile: width < 576,
        tablet: width >= 576 && width < 1024,
        desktop: width >= 1024 && width < 1440,
        wide: width >= 1440
      });

      // Detect device type
      if (width < 576) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }

      // Detect orientation
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    updateBreakpoints();

    const resizeObserver = new ResizeObserver(updateBreakpoints);
    resizeObserver.observe(document.documentElement);

    return () => resizeObserver.disconnect();
  }, []);

  return {
    ...breakpoints,
    orientation,
    deviceType,
    isTouchDevice: 'ontouchstart' in window,
    isRetina: window.devicePixelRatio > 1
  };
}

// Responsive component wrapper
export function Responsive({
  mobile,
  tablet,
  desktop,
  children
}: {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { deviceType } = useResponsive();

  if (deviceType === 'mobile' && mobile) return <>{mobile}</>;
  if (deviceType === 'tablet' && tablet) return <>{tablet}</>;
  if (deviceType === 'desktop' && desktop) return <>{desktop}</>;

  return <>{children}</>;
}
```

### 2.2 Touch Gesture Support

#### Gesture Handler (`lib/gestures/gestureHandler.ts`)
```typescript
export class GestureHandler {
  private element: HTMLElement;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTap = 0;

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupListeners();
  }

  private setupListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart);
    this.element.addEventListener('touchmove', this.handleTouchMove);
    this.element.addEventListener('touchend', this.handleTouchEnd);
  }

  private handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      this.handlePinch(e);
    } else {
      this.handleSwipe(e);
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - this.touchStartTime;

    if (touchDuration < 200) {
      // Tap or double tap
      if (touchEndTime - this.lastTap < 300) {
        this.emit('doubleTap', e);
      } else {
        this.emit('tap', e);
      }
      this.lastTap = touchEndTime;
    } else if (touchDuration > 500) {
      // Long press
      this.emit('longPress', e);
    }
  };

  private handleSwipe(e: TouchEvent) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    if (Math.abs(deltaX) > 50) {
      this.emit('swipe', {
        direction: deltaX > 0 ? 'right' : 'left',
        distance: Math.abs(deltaX)
      });
    }

    if (Math.abs(deltaY) > 50) {
      this.emit('swipe', {
        direction: deltaY > 0 ? 'down' : 'up',
        distance: Math.abs(deltaY)
      });
    }
  }

  private handlePinch(e: TouchEvent) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    this.emit('pinch', { distance });
  }

  private emit(event: string, data?: any) {
    this.element.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }
}
```

### 2.3 Mobile-Optimized Components

#### Mobile Navigation (`components/mobile/MobileNav.tsx`)
```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export function MobileNav({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white z-40 shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="p-6 mt-16">
                {items.map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileNavItem({
  item,
  onClose
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => {
          if (item.children) {
            setExpanded(!expanded);
          } else {
            item.onClick?.();
            onClose();
          }
        }}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-3">
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </span>
        {item.children && (
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {expanded && item.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-6 overflow-hidden"
          >
            {item.children.map((child) => (
              <MobileNavItem
                key={child.id}
                item={child}
                onClose={onClose}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## Week 5: Advanced Visualizations

### 3.1 Interactive Damage Flow Visualization

#### Sankey Diagram (`components/visualizations/DamageSankey.tsx`)
```typescript
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

interface SankeyData {
  nodes: { id: string; label: string; value: number }[];
  links: { source: string; target: string; value: number }[];
}

export function DamageSankey({ data }: { data: SankeyData }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create sankey generator
    const sankeyGenerator = sankey()
      .nodeId(d => d.id)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    // Generate layout
    const { nodes, links } = sankeyGenerator({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    });

    // Color scale
    const color = d3.scaleOrdinal()
      .domain(['physical', 'fire', 'cold', 'lightning', 'chaos'])
      .range(['#8B4513', '#FF4500', '#00CED1', '#FFD700', '#800080']);

    // Draw links
    const link = svg.append('g')
      .selectAll('.link')
      .data(links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width))
      .style('fill', 'none')
      .style('stroke', d => color(d.source.id.split('_')[0]))
      .style('stroke-opacity', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this).style('stroke-opacity', 0.8);
        showTooltip(event, d);
      })
      .on('mouseout', function() {
        d3.select(this).style('stroke-opacity', 0.5);
        hideTooltip();
      });

    // Draw nodes
    const node = svg.append('g')
      .selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

    node.append('rect')
      .attr('height', d => d.y1 - d.y0)
      .attr('width', sankeyGenerator.nodeWidth())
      .style('fill', d => color(d.id.split('_')[0]))
      .style('stroke', '#000')
      .on('mouseover', function(event, d) {
        highlightConnections(d);
        showNodeTooltip(event, d);
      })
      .on('mouseout', function() {
        resetHighlight();
        hideTooltip();
      });

    // Add labels
    node.append('text')
      .attr('x', -6)
      .attr('y', d => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .text(d => d.label)
      .filter(d => d.x0 < width / 2)
      .attr('x', 6 + sankeyGenerator.nodeWidth())
      .attr('text-anchor', 'start');

    // Helper functions
    function highlightConnections(node) {
      svg.selectAll('.link')
        .style('stroke-opacity', d =>
          d.source === node || d.target === node ? 0.8 : 0.2
        );
    }

    function resetHighlight() {
      svg.selectAll('.link').style('stroke-opacity', 0.5);
    }

  }, [data]);

  return (
    <div className="damage-sankey">
      <svg ref={svgRef}></svg>
      <div id="sankey-tooltip" className="tooltip hidden"></div>
    </div>
  );
}
```

### 3.2 Passive Tree 3D Visualization

#### 3D Tree Renderer (`components/visualizations/PassiveTree3D.tsx`)
```typescript
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function PassiveTree3D({
  nodes,
  allocated,
  onNodeClick
}: {
  nodes: PassiveNode[];
  allocated: string[];
  onNodeClick: (nodeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    // Create nodes
    const nodeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const nodeMeshes = new Map<string, THREE.Mesh>();

    nodes.forEach((node) => {
      const material = new THREE.MeshPhongMaterial({
        color: allocated.includes(node.id) ? 0x00ff00 : 0x666666,
        emissive: allocated.includes(node.id) ? 0x004400 : 0x000000
      });

      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(node.position.x / 10, node.position.y / 10, 0);
      mesh.userData = { nodeId: node.id };

      nodeMeshes.set(node.id, mesh);
      scene.add(mesh);
    });

    // Create connections
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x333333,
      linewidth: 1
    });

    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (!targetNode) return;

        const points = [
          new THREE.Vector3(node.position.x / 10, node.position.y / 10, 0),
          new THREE.Vector3(targetNode.position.x / 10, targetNode.position.y / 10, 0)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, connectionMaterial);
        scene.add(line);
      });
    });

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function handleMouseClick(event: MouseEvent) {
      const rect = containerRef.current!.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(nodeMeshes.values()));

      if (intersects.length > 0) {
        const nodeId = intersects[0].object.userData.nodeId;
        onNodeClick(nodeId);
      }
    }

    containerRef.current.addEventListener('click', handleMouseClick);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    function handleResize() {
      if (!containerRef.current) return;

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeEventListener('click', handleMouseClick);
      renderer.dispose();
    };
  }, [nodes, allocated, onNodeClick]);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

## Week 6: Community Features

### 4.1 Build Sharing System

#### Build Export/Import (`lib/sharing/buildSharing.ts`)
```typescript
import pako from 'pako';

export class BuildSharer {
  // Export to Path of Building format
  exportToPoB(character: Character): string {
    const xml = this.generatePoBXML(character);
    const compressed = pako.deflate(xml, { level: 9 });
    const base64 = btoa(String.fromCharCode(...compressed));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private generatePoBXML(character: Character): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PathOfBuilding>
  <Build level="${character.level}" className="${character.class}" ascendClassName="${character.ascendancy}">
    <PlayerStat stat="ActiveSkillGemLevel" value="20"/>
    ${this.generateStatsXML(character)}
  </Build>
  <Skills>
    ${this.generateSkillsXML(character.skills)}
  </Skills>
  <Tree>
    <Spec>
      <URL>${this.generateTreeURL(character.passives)}</URL>
    </Spec>
  </Tree>
  <Items>
    ${this.generateItemsXML(character.equipment)}
  </Items>
</PathOfBuilding>`;
    return xml;
  }

  // Import from Path of Building
  importFromPoB(pobCode: string): Character {
    try {
      // Decode and decompress
      const base64 = pobCode.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const xml = pako.inflate(bytes, { to: 'string' });
      return this.parsePoBXML(xml);
    } catch (error) {
      throw new Error('Invalid Path of Building code');
    }
  }

  // Generate shareable URL
  generateShareableLink(character: Character): string {
    const data = this.compressCharacterData(character);
    const encoded = encodeURIComponent(data);
    return `${window.location.origin}/build/${encoded}`;
  }

  private compressCharacterData(character: Character): string {
    const minimal = this.extractMinimalData(character);
    const json = JSON.stringify(minimal);
    const compressed = pako.deflate(json);
    return btoa(String.fromCharCode(...compressed));
  }

  // Generate build image for social sharing
  async generateBuildImage(character: Character): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630; // Open Graph recommended size

    const ctx = canvas.getContext('2d')!;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#2d2d2d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Title
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(character.name, 50, 80);

    // Class info
    ctx.font = '32px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Level ${character.level} ${character.ascendancy || character.class}`, 50, 130);

    // Stats
    const stats = await this.calculateStats(character);
    ctx.font = '24px Arial';

    const statLines = [
      `DPS: ${this.formatNumber(stats.dps)}`,
      `Life: ${this.formatNumber(stats.life)}`,
      `ES: ${this.formatNumber(stats.energyShield)}`,
      `Armor: ${this.formatNumber(stats.armor)}`,
      `Evasion: ${this.formatNumber(stats.evasion)}`
    ];

    statLines.forEach((stat, i) => {
      ctx.fillText(stat, 50, 200 + i * 40);
    });

    // Watermark
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Created with PoE2 Toolkit', 950, 600);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }
}
```

### 4.2 Community Database Integration

#### Build Repository (`lib/community/buildRepository.ts`)
```typescript
export class BuildRepository {
  async publishBuild(
    character: Character,
    metadata: BuildMetadata
  ): Promise<string> {
    const buildId = crypto.randomUUID();

    const buildData = {
      id: buildId,
      character,
      metadata: {
        ...metadata,
        publishedAt: Date.now(),
        author: await this.getCurrentUser(),
        version: '1.0.0'
      },
      stats: await this.calculateBuildStats(character),
      tags: this.generateTags(character),
      thumbnail: await this.generateThumbnail(character)
    };

    // Save to database
    const response = await fetch('/api/community/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildData)
    });

    if (!response.ok) {
      throw new Error('Failed to publish build');
    }

    return buildId;
  }

  async searchBuilds(query: BuildSearchQuery): Promise<BuildSearchResult> {
    const params = new URLSearchParams();

    if (query.class) params.append('class', query.class);
    if (query.minLevel) params.append('minLevel', query.minLevel.toString());
    if (query.maxLevel) params.append('maxLevel', query.maxLevel.toString());
    if (query.tags) params.append('tags', query.tags.join(','));
    if (query.search) params.append('search', query.search);
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.page) params.append('page', query.page.toString());

    const response = await fetch(`/api/community/builds?${params}`);
    const data = await response.json();

    return {
      builds: data.builds,
      total: data.total,
      page: data.page,
      hasMore: data.hasMore
    };
  }

  async rateBuild(buildId: string, rating: number): Promise<void> {
    await fetch(`/api/community/builds/${buildId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating })
    });
  }

  async commentOnBuild(buildId: string, comment: string): Promise<void> {
    await fetch(`/api/community/builds/${buildId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });
  }

  private generateTags(character: Character): string[] {
    const tags: string[] = [];

    // Class tags
    tags.push(character.class.toLowerCase());
    if (character.ascendancy) {
      tags.push(character.ascendancy.toLowerCase());
    }

    // Playstyle tags
    const skills = character.skills;
    if (skills.some(s => s.tags?.includes('melee'))) tags.push('melee');
    if (skills.some(s => s.tags?.includes('spell'))) tags.push('caster');
    if (skills.some(s => s.tags?.includes('minion'))) tags.push('summoner');

    // Defense tags
    if (character.attributes.energyShield > character.attributes.life) {
      tags.push('energy-shield');
    }
    if (character.attributes.armor > 10000) tags.push('armor');
    if (character.attributes.evasion > 10000) tags.push('evasion');

    return tags;
  }
}
```

## Week 7-8: Polish & Testing

### 5.1 Error Handling & Monitoring

#### Error Boundary (`components/ErrorBoundary.tsx`)
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo);
      Sentry.captureException(error);
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary-fallback p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We've encountered an unexpected error. The issue has been reported.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### 5.2 Performance Monitoring

#### Web Vitals Tracking (`lib/monitoring/webVitals.ts`)
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function initWebVitals() {
  // Track Core Web Vitals
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);

  // Custom performance marks
  if ('performance' in window) {
    // Mark important events
    performance.mark('app-interactive');

    // Measure time to interactive
    performance.measure('time-to-interactive', 'navigationStart', 'app-interactive');

    // Get and log measurements
    const measures = performance.getEntriesByType('measure');
    measures.forEach(measure => {
      sendToAnalytics({
        name: measure.name,
        value: measure.duration,
        rating: getRating(measure.name, measure.duration)
      });
    });
  }
}

function sendToAnalytics({ name, value, rating }: any) {
  // Send to analytics service
  if (window.gtag) {
    window.gtag('event', name, {
      value: Math.round(value),
      metric_rating: rating,
      non_interaction: true
    });
  }

  // Also send to custom monitoring
  fetch('/api/monitoring/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  });
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    'CLS': [0.1, 0.25],
    'FID': [100, 300],
    'FCP': [1800, 3000],
    'LCP': [2500, 4000],
    'TTFB': [800, 1800]
  };

  const [good, poor] = thresholds[name] || [0, Infinity];

  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}
```

### 5.3 Accessibility Implementation

#### Accessibility Provider (`contexts/AccessibilityContext.tsx`)
```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  contrast: 'normal' | 'high';
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

const AccessibilityContext = createContext<{
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
} | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    contrast: 'normal',
    reducedMotion: false,
    screenReaderMode: false,
    keyboardNavigation: false
  });

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('accessibility');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    setSettings(prev => ({
      ...prev,
      reducedMotion: prefersReducedMotion,
      contrast: prefersHighContrast ? 'high' : 'normal'
    }));
  }, []);

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement;

    // Font size
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    root.style.setProperty('--base-font-size', fontSizes[settings.fontSize]);

    // Contrast
    if (settings.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Save preferences
    localStorage.setItem('accessibility', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
```

## Implementation Checklist

### Week 1-2: Performance & PWA ✅
- [ ] Service Worker implementation
- [ ] Offline support
- [ ] Push notifications
- [ ] Worker pool management
- [ ] Multi-layer caching
- [ ] Background sync

### Week 3-4: Mobile Optimization ✅
- [ ] Responsive design system
- [ ] Touch gesture support
- [ ] Mobile navigation
- [ ] Bottom sheet components
- [ ] Pull to refresh
- [ ] Device adaptation

### Week 5: Visualizations ✅
- [ ] Damage flow Sankey diagram
- [ ] 3D passive tree
- [ ] Radar charts
- [ ] Heat maps
- [ ] Interactive tooltips
- [ ] Animation system

### Week 6: Community Features ✅
- [ ] Build export/import
- [ ] PoB compatibility
- [ ] URL sharing
- [ ] Build repository
- [ ] Rating system
- [ ] Comments

### Week 7-8: Polish & Testing ✅
- [ ] Error boundaries
- [ ] Performance monitoring
- [ ] Accessibility features
- [ ] Internationalization
- [ ] Security enhancements
- [ ] Comprehensive testing

## Performance Benchmarks

### Target Metrics
```typescript
const performanceTargets = {
  // Core Web Vitals
  LCP: 2500,     // Largest Contentful Paint < 2.5s
  FID: 100,      // First Input Delay < 100ms
  CLS: 0.1,      // Cumulative Layout Shift < 0.1

  // Custom metrics
  TTI: 3800,     // Time to Interactive < 3.8s
  FCP: 1800,     // First Contentful Paint < 1.8s

  // Bundle sizes
  mainBundle: 300 * 1024,      // < 300KB
  vendorBundle: 200 * 1024,    // < 200KB

  // Runtime performance
  calculationTime: 100,        // < 100ms
  renderTime: 16,             // < 16ms (60 FPS)
  workerResponse: 50          // < 50ms
};
```

## Deployment Configuration

### Production Build (`next.config.js`)
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  swcMinify: true,

  // Optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // PWA configuration
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],

  // Image optimization
  images: {
    domains: ['pathofexile.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Internationalization
  i18n: {
    locales: ['en', 'de', 'fr', 'es', 'pt', 'ru', 'ko', 'ja'],
    defaultLocale: 'en',
  },
});
```

## Success Metrics

- Lighthouse score > 95 across all categories
- 100% accessibility compliance
- < 3s load time on 3G
- Zero critical errors in production
- > 99.9% uptime
- < 0.1% error rate