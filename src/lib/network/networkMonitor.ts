// Network monitoring and connectivity detection

export interface NetworkInfo {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface ConnectivityTestResult {
  success: boolean;
  responseTime: number;
  timestamp: number;
}

class NetworkMonitor {
  private isOnlineState: boolean = true;
  private listeners: Set<(info: NetworkInfo) => void> = new Set();
  private connectivityCheckInterval?: number;
  private connectivityTestUrl: string = '/api/health'; // Fallback to simple endpoint
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) return;

    // Initial state
    this.isOnlineState = navigator.onLine;

    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen to network connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && typeof connection.addEventListener === 'function') {
        connection.addEventListener('change', this.handleConnectionChange.bind(this));
      }
    }

    // Start periodic connectivity checks
    this.startConnectivityChecks();
    
    this.isInitialized = true;
  }

  private handleOnline(): void {
    this.updateNetworkState(true);
  }

  private handleOffline(): void {
    this.updateNetworkState(false);
  }

  private handleConnectionChange(): void {
    // Network connection properties changed, notify listeners
    this.notifyListeners();
  }

  private updateNetworkState(online: boolean): void {
    const wasOnline = this.isOnlineState;
    this.isOnlineState = online;

    // Only notify if state actually changed
    if (wasOnline !== online) {
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    const networkInfo = this.getNetworkInfo();
    this.listeners.forEach(listener => {
      try {
        listener(networkInfo);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  getNetworkInfo(): NetworkInfo {
    const info: NetworkInfo = {
      online: this.isOnlineState,
    };

    // Add network connection details if available
    if ('connection' in navigator && navigator.connection) {
      const connection = (navigator as any).connection;
      info.effectiveType = connection.effectiveType;
      info.downlink = connection.downlink;
      info.rtt = connection.rtt;
      info.saveData = connection.saveData;
    }

    return info;
  }

  isOnline(): boolean {
    return this.isOnlineState;
  }

  subscribe(callback: (info: NetworkInfo) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.getNetworkInfo());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  async testConnectivity(): Promise<ConnectivityTestResult> {
    const startTime = performance.now();
    
    try {
      // Use a simple fetch without AbortController in test environment
      const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST;
      
      if (isTestEnv) {
        await fetch(this.connectivityTestUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        });
      } else {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 5000);

        await fetch(this.connectivityTestUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal,
        });

        window.clearTimeout(timeoutId);
      }

      const endTime = performance.now();
      
      return {
        success: true,
        responseTime: endTime - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        success: false,
        responseTime: endTime - startTime,
        timestamp: Date.now(),
      };
    }
  }

  async measureBandwidth(): Promise<number> {
    // Use Network Information API if available
    if ('connection' in navigator && navigator.connection) {
      const connection = (navigator as any).connection;
      if (connection.downlink) {
        return connection.downlink * 1000; // Convert Mbps to Kbps
      }
    }

    // Fallback: measure with a small test request
    try {
      const testUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const testSizeBytes = 150; // Approximate size of the test data
      
      const startTime = performance.now();
      await fetch(testUrl);
      const endTime = performance.now();
      
      const durationMs = endTime - startTime;
      const bitsPerMs = (testSizeBytes * 8) / durationMs;
      const kbps = bitsPerMs; // Rough estimate
      
      return Math.max(kbps, 1); // Minimum 1 Kbps
    } catch (error) {
      return 1; // Default fallback bandwidth
    }
  }

  private startConnectivityChecks(): void {
    // Check connectivity every 30 seconds when online, every 10 seconds when offline
    const checkInterval = () => {
      const interval = this.isOnlineState ? 30000 : 10000;
      this.connectivityCheckInterval = window.setTimeout(async () => {
        const result = await this.testConnectivity();
        
        // Update online state based on connectivity test
        if (result.success !== this.isOnlineState) {
          this.updateNetworkState(result.success);
        }
        
        // Schedule next check
        checkInterval();
      }, interval);
    };

    checkInterval();
  }

  destroy(): void {
    // Clean up event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && typeof connection.removeEventListener === 'function') {
        connection.removeEventListener('change', this.handleConnectionChange.bind(this));
      }
    }

    // Clear connectivity check interval
    if (this.connectivityCheckInterval) {
      window.clearTimeout(this.connectivityCheckInterval);
    }

    // Clear listeners
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const networkMonitor = new NetworkMonitor();
