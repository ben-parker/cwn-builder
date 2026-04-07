import { describe, it, expect } from 'vitest'
import * as lzString from 'lz-string'
import { encodeShareState, decodeShareState } from '../share.js'

const encode = (payload) => encodeShareState(payload, lzString)
const decode = (encoded) => decodeShareState(encoded, lzString)

describe('encodeShareState / decodeShareState round-trip', () => {
  it('round-trips a minimal drone payload', () => {
    const payload = { v: 1, t: 'drones', units: [] }
    expect(decode(encode(payload))).toEqual(payload)
  })

  it('round-trips a minimal vehicle payload', () => {
    const payload = { v: 1, t: 'vehicles', units: [] }
    expect(decode(encode(payload))).toEqual(payload)
  })

  it('round-trips a full drone build with level, focus, mods, and weapons', () => {
    const payload = {
      v: 1,
      t: 'drones',
      lvl: 7,
      focus: true,
      units: [
        {
          name: 'Stalker Combat Drone',
          mods: ['Armor Plating', 'Sensor Suite', 'Stealth Module'],
          weapons: ['Laser Rifle', 'Missile Launcher'],
        },
        {
          name: 'Scout Drone',
          mods: ['Speed Boost'],
          weapons: [],
        },
      ],
    }
    expect(decode(encode(payload))).toEqual(payload)
  })

  it('round-trips a full vehicle build', () => {
    const payload = {
      v: 1,
      t: 'vehicles',
      lvl: 5,
      focus: true,
      units: [
        {
          name: 'Armored Personnel Carrier',
          mods: ['Reactive Armor', 'Turbo Engine'],
          weapons: ['Heavy Machine Gun', 'Grenade Launcher'],
        },
      ],
    }
    expect(decode(encode(payload))).toEqual(payload)
  })

  it('preserves payload without optional lvl and focus fields', () => {
    const payload = {
      v: 1,
      t: 'drones',
      units: [{ name: 'Basic Drone', mods: [], weapons: [] }],
    }
    const decoded = decode(encode(payload))
    expect(decoded).toEqual(payload)
    expect(decoded).not.toHaveProperty('lvl')
    expect(decoded).not.toHaveProperty('focus')
  })
})

describe('decodeShareState validation', () => {
  it('rejects a payload with wrong version', () => {
    const payload = { v: 999, t: 'drones', units: [] }
    expect(decode(encode(payload))).toBeNull()
  })

  it('rejects a payload with missing version', () => {
    const payload = { t: 'drones', units: [] }
    expect(decode(encode(payload))).toBeNull()
  })

  it('rejects a payload with invalid tool type', () => {
    const payload = { v: 1, t: 'unknown', units: [] }
    expect(decode(encode(payload))).toBeNull()
  })

  it('rejects a payload with out-of-range level', () => {
    const payload = { v: 1, t: 'drones', lvl: 99, units: [] }
    expect(decode(encode(payload))).toBeNull()
  })

  it('rejects a payload with non-array units', () => {
    const payload = { v: 1, t: 'drones', units: 'bad' }
    expect(decode(encode(payload))).toBeNull()
  })

  it('rejects a unit with missing name', () => {
    const payload = { v: 1, t: 'drones', units: [{ mods: [], weapons: [] }] }
    expect(decode(encode(payload))).toBeNull()
  })

  it('filters out non-string entries in mods/weapons', () => {
    const payload = { v: 1, t: 'drones', units: [{ name: 'Test', mods: ['Good', 42, null], weapons: [true, 'Valid'] }] }
    const decoded = decode(encode(payload))
    expect(decoded.units[0].mods).toEqual(['Good'])
    expect(decoded.units[0].weapons).toEqual(['Valid'])
  })

  it('returns null for garbage string', () => {
    expect(decode('not-valid-lz-data!!!')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decode('')).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(decode(undefined)).toBeNull()
  })
})

describe('URL length sanity', () => {
  it('a large build compresses to under 2000 chars', () => {
    const units = Array.from({ length: 6 }, (_, i) => ({
      name: `Heavy Assault Drone Mk${i + 1}`,
      mods: ['Armor Plating', 'Sensor Suite', 'Stealth Module', 'Speed Boost'],
      weapons: ['Laser Rifle', 'Missile Launcher', 'Plasma Cannon'],
    }))
    const payload = { v: 1, t: 'drones', lvl: 10, focus: true, units }
    expect(encode(payload).length).toBeLessThan(2000)
  })
})
