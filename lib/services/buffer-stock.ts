import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { BufferStock, Product } from '@/types'

type ProductRow = Pick<Product, 'id' | 'sku' | 'name' | 'category' | 'unit'>

function computeHealth(current: number, minimum: number, target: number): BufferStock['health'] {
  if (current < minimum) return 'critical'
  if (current < minimum * 1.5) return 'low'
  if (current < target) return 'adequate'
  return 'optimal'
}

async function enrichBufferStock(rows: BufferStock[]): Promise<BufferStock[]> {
  if (!rows.length) return []
  const productIds = [...new Set(rows.map(r => r.product_id).filter(Boolean))]
  const { data: products } = productIds.length
    ? await supabase.from('cpaz_products').select('id, sku, name, category, unit').in('id', productIds)
    : { data: [] }

  const productMap: Record<string, ProductRow> = {}
  ;(products || []).forEach((p: ProductRow) => { productMap[p.id] = p })

  return rows.map(b => ({
    ...b,
    product: productMap[b.product_id] as unknown as Product,
    health: computeHealth(b.current_level, b.minimum_level, b.target_level),
  }))
}

export async function getBufferStock(): Promise<BufferStock[]> {
  return cached('buffer-stock', async () => {
    const { data, error } = await supabase
      .from('cpaz_buffer_stock')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return enrichBufferStock(data as BufferStock[])
  })
}

export async function updateBufferStock(id: string, payload: {
  current_level?: number
  minimum_level?: number
  target_level?: number
  location?: string
  last_reviewed?: string
}): Promise<void> {
  const { error } = await supabase
    .from('cpaz_buffer_stock')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('buffer-stock', 'kpis')
}

export async function createBufferStock(payload: {
  product_id: string
  minimum_level: number
  target_level: number
  current_level: number
  location: string
}): Promise<BufferStock> {
  const { data, error } = await supabase
    .from('cpaz_buffer_stock')
    .insert({ ...payload, last_reviewed: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  cacheDel('buffer-stock', 'kpis')
  const [enriched] = await enrichBufferStock([data as BufferStock])
  return enriched
}
