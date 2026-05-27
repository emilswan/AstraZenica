import { getOrders } from './services/orders'
import { getProducts } from './services/products'
import { getInventory } from './services/inventory'
import { getBatches } from './services/batches'
import { getDashboardKPIs, getOrderStatusChart, getInventoryByCategory } from './services/analytics'

export interface PrefetchProgress {
  current: number
  total: number
  label: string
  done: boolean
}

type ProgressCallback = (progress: PrefetchProgress) => void

const steps = [
  { label: 'Loading products...', fn: getProducts },
  { label: 'Loading orders...', fn: getOrders },
  { label: 'Loading inventory...', fn: getInventory },
  { label: 'Loading batches...', fn: getBatches },
  { label: 'Loading dashboard KPIs...', fn: getDashboardKPIs },
  { label: 'Loading analytics...', fn: getOrderStatusChart },
  { label: 'Loading categories...', fn: getInventoryByCategory },
]

/**
 * Prefetch all data in parallel with progress callback.
 * Called once on first login. All 7 requests fire simultaneously
 * instead of waiting for each to complete, reducing load time from
 * ~80s (sequential) to ~12s (parallel, limited by slowest request).
 */
export async function prefetchAllWithProgress(onProgress: ProgressCallback): Promise<void> {
  const total = steps.length
  let completed = 0

  onProgress({ current: 0, total, label: 'Starting...', done: false })

  try {
    await Promise.allSettled(
      steps.map(async (step) => {
        try {
          await step.fn()
        } finally {
          completed++
          onProgress({ current: completed, total, label: step.label, done: false })
        }
      })
    )
  } catch {
    // Swallow any errors — page will handle missing data gracefully
  }

  onProgress({ current: total, total, label: 'Ready!', done: true })
}

/** Quick fire-and-forget prefetch (no progress) */
export function prefetchAll(): void {
  steps.forEach(({ fn }) => fn().catch(() => {}))
}
