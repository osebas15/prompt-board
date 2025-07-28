import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { showToast } from '@/lib/utils/toast';

// Type definitions for DOM element mocks
interface MockHTMLElement {
  tagName: string;
  className: string;
  innerHTML: string;
  id: string;
  style: Record<string, string | undefined>;
  appendChild: MockedFunction<any>;
  remove: MockedFunction<any>;
  parentNode: Node | null;
}

interface MockContainer extends MockHTMLElement {
  appendChild: MockedFunction<any>;
  id: string;
}

interface MockToastElement extends MockHTMLElement {
  className: string;
  innerHTML: string;
  style: {
    transform?: string;
    opacity?: string;
  };
  remove: MockedFunction<any>;
  parentNode: Node | null;
}

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockImplementation((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      className: '',
      innerHTML: '',
      id: '',
      style: {},
      appendChild: vi.fn(),
      remove: vi.fn(),
      parentNode: null,
    };
    return element;
  }),
  writable: true,
});

Object.defineProperty(document, 'getElementById', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true,
});

describe('Toast Utility', () => {
  let createElementSpy: MockedFunction<any>;
  let getElementByIdSpy: MockedFunction<any>;
  let appendChildSpy: MockedFunction<any>;

  beforeEach(() => {
    // Setup fresh spies each time
    createElementSpy = vi.fn().mockImplementation((tagName: string): MockHTMLElement => ({
      tagName: tagName.toUpperCase(),
      className: '',
      innerHTML: '',
      id: '',
      style: {},
      appendChild: vi.fn(),
      remove: vi.fn(),
      parentNode: null,
    }));
    
    getElementByIdSpy = vi.fn().mockReturnValue(null);
    appendChildSpy = vi.fn();

    // Override the document methods
    Object.defineProperty(document, 'createElement', {
      value: createElementSpy,
      writable: true,
    });
    
    Object.defineProperty(document, 'getElementById', {
      value: getElementByIdSpy,
      writable: true,
    });
    
    Object.defineProperty(document.body, 'appendChild', {
      value: appendChildSpy,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('showToast', () => {
    it('should create toast container if it does not exist', () => {
      showToast('Test message');
      
      // Should create container
      expect(createElementSpy).toHaveBeenCalledWith('div');
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should reuse existing toast container', () => {
      const mockContainer = {
        appendChild: vi.fn(),
        id: 'toast-container',
      };
      getElementByIdSpy.mockReturnValue(mockContainer);
      
      showToast('Test message');
      
      expect(getElementByIdSpy).toHaveBeenCalledWith('toast-container');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should create toast with default options', () => {
      const mockToast: MockToastElement = {
        tagName: 'DIV',
        className: '',
        innerHTML: '',
        id: '',
        style: {},
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: document.body,
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce({
          tagName: 'DIV',
          id: '',
          className: '',
          innerHTML: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: null,
        } as unknown as HTMLElement)
        .mockReturnValueOnce(mockToast as unknown as HTMLElement);
      
      const result = showToast('Test message');
      
      expect(result).toBe(mockToast);
      expect(mockToast.innerHTML).toContain('Test message');
      expect(mockToast.innerHTML).toContain('ℹ️'); // info icon
    });

    it('should create success toast with correct styling', () => {
      const mockToast: MockToastElement = {
        tagName: 'DIV',
        className: '',
        innerHTML: '',
        id: '',
        style: {},
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: document.body,
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce({
          tagName: 'DIV',
          id: '',
          className: '',
          innerHTML: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: null,
        } as unknown as HTMLElement)
        .mockReturnValueOnce(mockToast as unknown as HTMLElement);
      
      showToast('Success message', { type: 'success' });
      
      expect(mockToast.className).toContain('bg-green-50');
      expect(mockToast.innerHTML).toContain('✅'); // success icon
    });

    it('should create error toast with correct styling', () => {
      const mockToast: MockToastElement = {
        tagName: 'DIV',
        className: '',
        innerHTML: '',
        id: '',
        style: {},
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: document.body,
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce({
          tagName: 'DIV',
          id: '',
          className: '',
          innerHTML: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: null,
        } as unknown as HTMLElement)
        .mockReturnValueOnce(mockToast as unknown as HTMLElement);
      
      showToast('Error message', { type: 'error' });
      
      expect(mockToast.className).toContain('bg-red-50');
      expect(mockToast.innerHTML).toContain('❌'); // error icon
    });

    it('should create warning toast with correct styling', () => {
      const mockToast: MockToastElement = {
        tagName: 'DIV',
        className: '',
        innerHTML: '',
        id: '',
        style: {},
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: document.body,
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce({
          tagName: 'DIV',
          id: '',
          className: '',
          innerHTML: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: null,
        } as unknown as HTMLElement)
        .mockReturnValueOnce(mockToast as unknown as HTMLElement);
      
      showToast('Warning message', { type: 'warning' });
      
      expect(mockToast.className).toContain('bg-yellow-50');
      expect(mockToast.innerHTML).toContain('⚠️'); // warning icon
    });

    it('should position toast correctly', () => {
      const mockContainer: MockContainer = {
        tagName: 'DIV',
        id: '',
        className: '',
        innerHTML: '',
        style: {},
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: null,
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce(mockContainer as unknown as HTMLElement)
        .mockReturnValueOnce({
          tagName: 'DIV',
          className: '',
          innerHTML: '',
          id: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: document.body,
        } as unknown as HTMLElement);
      
      showToast('Test message', { position: 'bottom-left' });
      
      expect(mockContainer.className).toContain('bottom-4 left-4');
    });

    it('should auto-remove toast after specified duration', async () => {
      vi.useFakeTimers();
      
      const mockToast: MockToastElement = {
        tagName: 'DIV',
        className: '',
        innerHTML: '',
        id: '',
        style: {
          transform: undefined,
          opacity: undefined,
        },
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: document.body,
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce({
          tagName: 'DIV',
          id: '',
          className: '',
          innerHTML: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: null,
        } as unknown as HTMLElement)
        .mockReturnValueOnce(mockToast as unknown as HTMLElement);
      
      showToast('Test message', { duration: 1000 });
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      // Should start fade animation
      expect(mockToast.style.transform).toBe('translateX(100%)');
      expect(mockToast.style.opacity).toBe('0');
      
      // Fast-forward fade animation
      vi.advanceTimersByTime(300);
      
      expect(mockToast.remove).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should handle custom duration', async () => {
      vi.useFakeTimers();
      
      const mockToast: MockToastElement = {
        tagName: 'DIV',
        className: '',
        innerHTML: '',
        id: '',
        style: {
          transform: undefined,
          opacity: undefined,
        },
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: document.body,
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce({
          tagName: 'DIV',
          id: '',
          className: '',
          innerHTML: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: null,
        } as unknown as HTMLElement)
        .mockReturnValueOnce(mockToast as unknown as HTMLElement);
      
      showToast('Test message', { duration: 5000 });
      
      // Should not remove before duration
      vi.advanceTimersByTime(3000);
      expect(mockToast.style.transform).toBeUndefined();
      
      // Should remove after duration
      vi.advanceTimersByTime(2000);
      expect(mockToast.style.transform).toBe('translateX(100%)');
      
      vi.useRealTimers();
    });

    it('should handle removed toast gracefully', () => {
      vi.useFakeTimers();
      
      const mockToast: MockToastElement = {
        tagName: 'DIV',
        className: '',
        innerHTML: '',
        id: '',
        style: {},
        appendChild: vi.fn(),
        remove: vi.fn(),
        parentNode: null, // Toast already removed
      };
      vi.spyOn(document, 'createElement')
        .mockReturnValueOnce({
          tagName: 'DIV',
          id: '',
          className: '',
          innerHTML: '',
          style: {},
          appendChild: vi.fn(),
          remove: vi.fn(),
          parentNode: null,
        } as unknown as HTMLElement)
        .mockReturnValueOnce(mockToast as unknown as HTMLElement);
      
      showToast('Test message', { duration: 1000 });
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      // Should not crash when toast is already removed
      expect(() => {
        vi.advanceTimersByTime(300);
      }).not.toThrow();
      
      vi.useRealTimers();
    });
  });
});
