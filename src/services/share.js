const HASH_PREFIX = '#share='
const CURRENT_VERSION = 1

async function getLzString() {
  return await import('lz-string')
}

function validatePayload(obj) {
  if (!obj || typeof obj !== 'object') return null
  if (obj.v !== CURRENT_VERSION) return null
  if (obj.t !== 'drones' && obj.t !== 'vehicles') return null
  if (obj.lvl != null) {
    const n = parseInt(obj.lvl)
    if (isNaN(n) || n < 1 || n > 10) return null
    obj.lvl = n
  }
  if (obj.units != null) {
    if (!Array.isArray(obj.units)) return null
    for (const unit of obj.units) {
      if (!unit || typeof unit.name !== 'string') return null
      if (unit.mods != null && !Array.isArray(unit.mods)) return null
      if (unit.weapons != null && !Array.isArray(unit.weapons)) return null
      unit.mods = (unit.mods ?? []).filter(m => typeof m === 'string')
      unit.weapons = (unit.weapons ?? []).filter(w => typeof w === 'string')
    }
  }
  return obj
}

export function encodeShareState(payload, lzString) {
  return lzString.compressToEncodedURIComponent(JSON.stringify(payload))
}

export function decodeShareState(encoded, lzString) {
  try {
    const json = lzString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    return validatePayload(JSON.parse(json))
  } catch {
    return null
  }
}

export async function buildShareUrl(payload) {
  const lzString = await getLzString()
  const encoded = encodeShareState(payload, lzString)
  const url = window.location.origin + window.location.pathname + HASH_PREFIX + encoded
  window.history.replaceState(null, '', HASH_PREFIX + encoded)
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

export async function readShareState() {
  const hash = window.location.hash
  if (!hash.startsWith(HASH_PREFIX)) return null
  const lzString = await getLzString()
  return decodeShareState(hash.slice(HASH_PREFIX.length), lzString)
}

export function hasShareHash() {
  return window.location.hash.startsWith(HASH_PREFIX)
}

export function clearShareHash() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
