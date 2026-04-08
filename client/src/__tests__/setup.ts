// src/__tests__/setup.ts
// Adds jest-dom matchers (e.g. toBeInTheDocument) to vitest
import '@testing-library/jest-dom'

// ── localStorage stub ──────────────────────────────────────────────────────
// Some versions of vitest/jsdom don't expose localStorage by default; this
// polyfill ensures AuthContext (and any other code using localStorage) works
// in the test environment without real browser APIs.
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
