import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppModeStore } from '../appMode.js'

vi.mock('@/services/share', () => ({
  clearShareHash: vi.fn(),
}))

import { clearShareHash } from '@/services/share'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAppModeStore', () => {
  it('starts in default mode', () => {
    const store = useAppModeStore()
    expect(store.isSharedView).toBe(false)
    expect(store.sharedPayload).toBeNull()
    expect(store.sharedPageType).toBeNull()
  })

  it('enterSharedView sets shared state', () => {
    const store = useAppModeStore()
    const payload = { v: 1, t: 'drones', units: [] }
    store.enterSharedView(payload)
    expect(store.isSharedView).toBe(true)
    expect(store.sharedPayload).toEqual(payload)
    expect(store.sharedPageType).toBe('drones')
  })

  it('exitSharedView resets state and clears hash', () => {
    const store = useAppModeStore()
    store.enterSharedView({ v: 1, t: 'vehicles', units: [] })
    store.exitSharedView()
    expect(store.isSharedView).toBe(false)
    expect(store.sharedPayload).toBeNull()
    expect(store.sharedPageType).toBeNull()
    expect(clearShareHash).toHaveBeenCalledOnce()
  })

  it('sharedPageType reflects current payload type', () => {
    const store = useAppModeStore()
    store.enterSharedView({ v: 1, t: 'cyberdecks', units: [] })
    expect(store.sharedPageType).toBe('cyberdecks')
    store.enterSharedView({ v: 1, t: 'drones', units: [] })
    expect(store.sharedPageType).toBe('drones')
  })
})
