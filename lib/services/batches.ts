import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { Batch, BatchStatus, Product, Profile } from '@/types'

type ProductRow = Pick<Product, 'id' | 'sku' | 'name' | 'category' | 'unit'>
type UserRow = Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>

async function enrichBatches(rows: Batch[]): Promise<Batch[]> {
  if (!rows.length) return []
  const productIds = [...new Set(rows.map(r => r.product_id).filter(Boolean))]
  const operatorIds = [...new Set(rows.map(r => r.operator_id).filter(Boolean))]

  const [{ data: products }, { data: operators }] = await Promise.all([
    productIds.length
      ? supabase.from('cpaz_products').select('id, sku, name, category, unit').in('id', productIds)
      : Promise.resolve({ data: [] }),
    operatorIds.length
      ? supabase.from('cpaz_users').select('id, full_name, email, role').in('id', operatorIds)
      : Promise.resolve({ data: [] }),
  ])

  const productMap: Record<string, ProductRow> = {}
  ;(products || []).forEach((p: ProductRow) => { productMap[p.id] = p })
  const userMap: Record<string, UserRow> = {}
  ;(operators || []).forEach((u: UserRow) => { userMap[u.id] = u })

  return rows.map(r => ({
    ...r,
    product: productMap[r.product_id] as unknown as Product,
    operator: r.operator_id ? (userMap[r.operator_id] as unknown as Profile) : undefined,
  }))
}

export async function getBatches(): Promise<Batch[]> {
  return cached('batches', async () => {
    const { data, error } = await supabase
      .from('cpaz_batches')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return enrichBatches(data as Batch[])
  })
}

export async function createBatch(payload: {
  product_id: string
  quantity: number
  start_date?: string
  end_date?: string
  operator_id?: string
  notes?: string
}): Promise<Batch> {
  const batchNumber = `BAT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
  const { data, error } = await supabase
    .from('cpaz_batches')
    .insert({ ...payload, batch_number: batchNumber, status: 'planned', progress: 0, updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  cacheDel('batches', 'kpis')
  const [enriched] = await enrichBatches([data as Batch])
  return enriched
}

export async function updateBatch(id: string, payload: {
  status?: BatchStatus
  progress?: number
  notes?: string
  end_date?: string
}): Promise<void> {
  const { error } = await supabase
    .from('cpaz_batches')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('batches', 'kpis')
}
