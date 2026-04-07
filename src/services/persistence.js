const STORAGE_KEY = 'cwn-builder-state'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data && data.v === 1 ? data : null
  } catch {
    return null
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // quota exceeded or storage unavailable
  }
}

function ensureStore() {
  return readStore() ?? { v: 1, activeTool: null, pages: {} }
}

export function savePageState(pageType, payload) {
  const data = ensureStore()
  data.pages[pageType] = payload
  writeStore(data)
}

export function loadPageState(pageType) {
  const data = readStore()
  return data?.pages?.[pageType] ?? null
}

export function saveActiveTool(toolId) {
  const data = ensureStore()
  data.activeTool = toolId
  writeStore(data)
}

export function loadActiveTool() {
  const data = readStore()
  return data?.activeTool ?? null
}

export function clearAllState() {
  localStorage.removeItem(STORAGE_KEY)
}

export function debounce(fn, ms) {
  let timer = null
  const wrapped = (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
  wrapped.cancel = () => clearTimeout(timer)
  wrapped.flush = () => { clearTimeout(timer); fn() }
  return wrapped
}
