import "@testing-library/jest-dom";

// jsdom doesn't ship ResizeObserver (used by cmdk) or PointerEvent (used by Radix UI)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  global.PointerEvent = PointerEvent as unknown as typeof global.PointerEvent;
}

// Radix UI portals call scrollIntoView which jsdom doesn't implement
window.HTMLElement.prototype.scrollIntoView = () => {};

// Radix Popover uses window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
