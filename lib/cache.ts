const _store = new Map<string, { data: unknown; ts: number }>()
const _inflight = new Map<string, Promise<unknown>>()

// 30 minutes — data stays cached between tab switches.
// Only a manual Refresh button clears and reloads from DB.
const TTL = 30 * 60 * 1000
const TIMEOUT = 12_000

function get<T>(key: string): T | null {
  const e = _store.get(key)
  if (!e) return null
  if (Date.now() - e.ts > TTL) { _store.delete(key); return null }
  return e.data as T
}

function set<T>(key: string, data: T): void {
  _store.set(key, { data, ts: Date.now() })
}

/** Delete specific cache keys — used by Refresh buttons */
export function cacheDel(...keys: string[]): void {
  keys.forEach(k => { _store.delete(k); _inflight.delete(k) })
}

/** Clear ALL cache — used on sign-out or full reload */
export function cacheFlush(): void {
  _store.clear()
  _inflight.clear()
}

/** Check if a key is already cached */
export function cacheHas(key: string): boolean {
  const e = _store.get(key)
  if (!e) return false
  return Date.now() - e.ts <= TTL
}

const MAX_RETRIES = 2

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT)),
    ])
  } catch (err) {
    if (retries > 0) {
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000))
      return fetchWithRetry(fn, retries - 1)
    }
    throw err
  }
}

export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  // 1. Return fresh cached data instantly
  const hit = get<T>(key)
  if (hit !== null) return hit

  // 2. Share in-flight promise (no duplicate requests)
  if (_inflight.has(key)) return _inflight.get(key) as Promise<T>

  // 3. Fetch with retry + timeout
  const promise = fetchWithRetry(fn)
    .then(data => {
      set(key, data)
      _inflight.delete(key)
      return data
    })
    .catch(err => {
      _inflight.delete(key)
      throw err
    })

  _inflight.set(key, promise)
  return promise
}
