import { describe, it, expect, beforeEach, vi } from 'vitest'

const STORAGE_KEY = 'cwn-builder-state'

// Mock localStorage since we're not in a browser environment
const store = {}
const localStorageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, val) => { store[key] = val }),
  removeItem: vi.fn((key) => { delete store[key] }),
  clear: vi.fn(() => { for (const k in store) delete store[k] }),
}
vi.stubGlobal('localStorage', localStorageMock)

import {
  savePageState,
  loadPageState,
  saveActiveTool,
  loadActiveTool,
  clearAllState,
  debounce,
} from '../persistence.js'

beforeEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

describe('savePageState / loadPageState', () => {
  it('saves and loads a page payload', () => {
    const payload = { v: 1, t: 'drones', units: [{ name: 'Scout', mods: [], weapons: [] }], lvl: 3, focus: true }
    savePageState('drones', payload)
    expect(loadPageState('drones')).toEqual(payload)
  })

  it('returns null for a page that was never saved', () => {
    expect(loadPageState('drones')).toBeNull()
  })

  it('saves multiple pages independently', () => {
    const drones = { v: 1, t: 'drones', units: [{ name: 'A', mods: [], weapons: [] }] }
    const vehicles = { v: 1, t: 'vehicles', units: [{ name: 'B', mods: [], weapons: [] }] }
    savePageState('drones', drones)
    savePageState('vehicles', vehicles)
    expect(loadPageState('drones')).toEqual(drones)
    expect(loadPageState('vehicles')).toEqual(vehicles)
  })

  it('overwrites a previously saved page', () => {
    savePageState('drones', { v: 1, t: 'drones', units: [] })
    const updated = { v: 1, t: 'drones', units: [{ name: 'New', mods: [], weapons: [] }] }
    savePageState('drones', updated)
    expect(loadPageState('drones')).toEqual(updated)
  })

  it('handles corrupt localStorage gracefully', () => {
    store[STORAGE_KEY] = 'not-json!!!'
    expect(loadPageState('drones')).toBeNull()
  })

  it('handles wrong version gracefully', () => {
    store[STORAGE_KEY] = JSON.stringify({ v: 999, pages: { drones: {} } })
    expect(loadPageState('drones')).toBeNull()
  })
})

describe('saveActiveTool / loadActiveTool', () => {
  it('saves and loads active tool', () => {
    saveActiveTool('vehicles')
    expect(loadActiveTool()).toBe('vehicles')
  })

  it('returns null when nothing saved', () => {
    expect(loadActiveTool()).toBeNull()
  })

  it('preserves page data when saving active tool', () => {
    const payload = { v: 1, t: 'cyberdecks', units: [] }
    savePageState('cyberdecks', payload)
    saveActiveTool('cyberdecks')
    expect(loadPageState('cyberdecks')).toEqual(payload)
    expect(loadActiveTool()).toBe('cyberdecks')
  })
})

describe('clearAllState', () => {
  it('removes all saved state', () => {
    savePageState('drones', { v: 1, t: 'drones', units: [] })
    saveActiveTool('drones')
    clearAllState()
    expect(loadPageState('drones')).toBeNull()
    expect(loadActiveTool()).toBeNull()
  })
})

describe('debounce', () => {
  it('delays execution', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('resets timer on subsequent calls', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('cancel prevents execution', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('flush executes immediately', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced.flush()
    expect(fn).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})
