import '@testing-library/jest-dom'

// jsdom has no layout engine, so ResizeObserver isn't implemented. Components
// that measure their own size (e.g. Squircle) need at least a no-op stub to
// avoid throwing in every test that renders them; individual tests can still
// override this with vi.stubGlobal to simulate a specific measured size.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class NoOpResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoOpResizeObserver as unknown as typeof ResizeObserver
}

