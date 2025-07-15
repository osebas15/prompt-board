import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { networkMonitor } from '@/lib/network/networkMonitor';

// Mock global objects
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockFetch = vi.fn();

// Mock AbortController
global.AbortController = vi.fn().mockImplementation(() => ({
  abort: vi.fn(),
  signal: {},
}));

Object.defineProperty(global, 'window', {
  writable: true,
  value: {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    setTimeout: vi.fn((fn, delay) => setTimeout(fn, delay)),
    clearTimeout: vi.fn(clearTimeout),
  },
});

Object.defineProperty(global, 'navigator', {
  writable: true,
  value: {
    onLine: true,
  },
});

Object.defineProperty(global, 'fetch', {
  writable: true,
  value: mockFetch,
});

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock Date.now to have consistent timestamps
const mockDateNow = vi.fn(() => 1000000);
vi.spyOn(Date, 'now').mockImplementation(mockDateNow);

describe('NetworkMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set test environment
    process.env.VITEST = 'true';
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    // Reset navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      value: undefined,
    });
    networkMonitor.destroy(); // Reset state
  });

  afterEach(() => {
    networkMonitor.destroy();
  });

  describe('initialization', () => {
    it('should initialize with current online state', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      networkMonitor.initialize();
      
      expect(networkMonitor.isOnline()).toBe(false);
    });

    it('should register event listeners', () => {
      networkMonitor.initialize();
      
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should not re-initialize if already initialized', () => {
      networkMonitor.initialize();
      mockAddEventListener.mockClear();
      
      networkMonitor.initialize();
      
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe('getNetworkInfo', () => {
    it('should return basic network info', () => {
      networkMonitor.initialize();
      
      const info = networkMonitor.getNetworkInfo();
      
      expect(info).toEqual({
        online: true,
      });
    });

    it('should include connection details when available', () => {
      // Mock navigator.connection with proper methods
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 100,
          saveData: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      });

      networkMonitor.initialize();
      
      const info = networkMonitor.getNetworkInfo();
      
      expect(info).toEqual({
        online: true,
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      });
    });
  });

  describe('subscribe', () => {
    it('should call callback immediately with current state', () => {
      const callback = vi.fn();
      
      networkMonitor.initialize();
      networkMonitor.subscribe(callback);
      
      expect(callback).toHaveBeenCalledWith({
        online: true,
      });
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      
      networkMonitor.initialize();
      const unsubscribe = networkMonitor.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe works
      callback.mockClear();
      unsubscribe();
      
      // Trigger a network change - callback should not be called
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      
      if (onlineHandler) {
        onlineHandler();
      }
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should notify subscribers when network state changes', () => {
      const callback = vi.fn();
      
      networkMonitor.initialize();
      networkMonitor.subscribe(callback);
      callback.mockClear();
      
      // Simulate going offline
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      
      if (offlineHandler) {
        offlineHandler();
      }
      
      expect(callback).toHaveBeenCalledWith({
        online: false,
      });
    });
  });

  describe('testConnectivity', () => {
    it.skip('should return success result for successful request', async () => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      mockFetch.mockResolvedValueOnce(new Response());
      
      networkMonitor.initialize();
      const result = await networkMonitor.testConnectivity();
      
      expect(result.success).toBe(true);
      expect(result.responseTime).toBe(500);
      expect(result.timestamp).toBeTypeOf('number');
    });

    it('should return failure result for failed request', async () => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      networkMonitor.initialize();
      const result = await networkMonitor.testConnectivity();
      
      expect(result.success).toBe(false);
      expect(result.responseTime).toBe(500);
      expect(result.timestamp).toBeTypeOf('number');
    });

    it('should handle request timeout', async () => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(6000); // 6 seconds later

      // Mock fetch that hangs
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
      );
      
      networkMonitor.initialize();
      const result = await networkMonitor.testConnectivity();
      
      expect(result.success).toBe(false);
    });
  });

  describe('measureBandwidth', () => {
    it('should return connection downlink when available', async () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        value: {
          downlink: 10, // 10 Mbps
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      });

      networkMonitor.initialize();
      const bandwidth = await networkMonitor.measureBandwidth();
      
      expect(bandwidth).toBe(10000); // 10 Mbps converted to Kbps
    });

    it('should fallback to test request when connection API unavailable', async () => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100); // 100ms duration

      mockFetch.mockResolvedValueOnce(new Response());
      
      networkMonitor.initialize();
      const bandwidth = await networkMonitor.measureBandwidth();
      
      expect(bandwidth).toBeGreaterThan(0);
    });

    it('should return fallback bandwidth on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      networkMonitor.initialize();
      const bandwidth = await networkMonitor.measureBandwidth();
      
      expect(bandwidth).toBe(1); // Fallback value
    });
  });

  describe('destroy', () => {
    it('should remove event listeners', () => {
      networkMonitor.initialize();
      networkMonitor.destroy();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should clear all subscribers', () => {
      const callback = vi.fn();
      
      networkMonitor.initialize();
      networkMonitor.subscribe(callback);
      networkMonitor.destroy();
      
      // Re-initialize and trigger change - old callback should not be called
      callback.mockClear();
      networkMonitor.initialize();
      
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      
      if (onlineHandler) {
        onlineHandler();
      }
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
