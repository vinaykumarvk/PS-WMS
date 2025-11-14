import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();
HTMLElement.prototype.scrollIntoView = vi.fn();

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Radix UI Select portal rendering
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    return this.parentElement;
  },
});

// Ensure portals are rendered in document body
const originalCreateElement = document.createElement.bind(document);
document.createElement = function(tagName: string, options?: ElementCreationOptions) {
  const element = originalCreateElement(tagName, options);
  if (tagName === 'div' && element.getAttribute?.('data-radix-portal')) {
    document.body.appendChild(element);
  }
  return element;
};

