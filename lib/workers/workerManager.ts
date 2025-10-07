/**
 * Web Worker Manager with TypeScript support
 * Handles worker lifecycle, message passing, and error handling
 */

export interface WorkerMessage<T = any> {
  type: string;
  payload: T;
  requestId: string;
}

export interface WorkerResponse<T = any> {
  type: string;
  requestId: string;
  result: T;
  error?: string;
}

type MessageHandler<T = any> = (result: T) => void;
type ErrorHandler = (error: Error) => void;

export class WorkerManager {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, {
    resolve: MessageHandler;
    reject: ErrorHandler;
    timeout?: NodeJS.Timeout;
  }> = new Map();
  private requestIdCounter = 0;
  private isReady = false;
  private readyCallbacks: Array<() => void> = [];

  constructor(private workerPath: string, private timeout: number = 30000) {}

  /**
   * Initialize the worker
   */
  async init(): Promise<void> {
    if (this.worker) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(this.workerPath, { type: 'module' });

        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          this.handleMessage(event.data);
        };

        this.worker.onerror = (error) => {
          console.error('[WorkerManager] Worker error:', error);
          reject(new Error(`Worker initialization failed: ${error.message}`));
        };

        // Wait for ready signal
        this.readyCallbacks.push(() => {
          this.isReady = true;
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages from worker
   */
  private handleMessage(response: WorkerResponse): void {
    // Handle ready signal
    if (response.type === 'ready') {
      this.readyCallbacks.forEach(cb => cb());
      this.readyCallbacks = [];
      return;
    }

    const pending = this.pendingRequests.get(response.requestId);
    if (!pending) {
      console.warn('[WorkerManager] Received response for unknown request:', response.requestId);
      return;
    }

    // Clear timeout
    if (pending.timeout) {
      clearTimeout(pending.timeout);
    }

    // Remove from pending
    this.pendingRequests.delete(response.requestId);

    // Handle response
    if (response.error) {
      pending.reject(new Error(response.error));
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Send a message to the worker and get a response
   */
  async sendMessage<TPayload, TResult>(
    type: string,
    payload: TPayload,
    timeoutMs?: number
  ): Promise<TResult> {
    if (!this.worker || !this.isReady) {
      await this.init();
    }

    const requestId = this.generateRequestId();

    return new Promise<TResult>((resolve, reject) => {
      // Set timeout
      const timeoutDuration = timeoutMs || this.timeout;
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Worker request timed out after ${timeoutDuration}ms`));
      }, timeoutDuration);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve: resolve as MessageHandler,
        reject,
        timeout: timeoutHandle,
      });

      // Send message
      const message: WorkerMessage<TPayload> = {
        type,
        payload,
        requestId,
      };

      this.worker!.postMessage(message);
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Terminate the worker and clean up
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      if (timeout) clearTimeout(timeout);
      reject(new Error('Worker terminated'));
    });

    this.pendingRequests.clear();
    this.isReady = false;
  }

  /**
   * Check if worker is ready
   */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * Get number of pending requests
   */
  get pendingCount(): number {
    return this.pendingRequests.size;
  }
}

/**
 * Singleton instance for DPS calculations
 */
let dpsWorkerInstance: WorkerManager | null = null;

export function getDPSWorker(): WorkerManager {
  if (!dpsWorkerInstance) {
    dpsWorkerInstance = new WorkerManager('/workers/dps-calculator.worker.js');
  }
  return dpsWorkerInstance;
}

/**
 * Singleton instance for build optimization
 */
let optimizationWorkerInstance: WorkerManager | null = null;

export function getOptimizationWorker(): WorkerManager {
  if (!optimizationWorkerInstance) {
    optimizationWorkerInstance = new WorkerManager('/workers/optimization.worker.js', 60000); // 60s timeout
  }
  return optimizationWorkerInstance;
}

/**
 * Clean up all workers
 */
export function terminateAllWorkers(): void {
  if (dpsWorkerInstance) {
    dpsWorkerInstance.terminate();
    dpsWorkerInstance = null;
  }
  if (optimizationWorkerInstance) {
    optimizationWorkerInstance.terminate();
    optimizationWorkerInstance = null;
  }
}
