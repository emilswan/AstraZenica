import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { Inspection, InspectionType, InspectionStatus, Product, Profile } from '@/types'

type ProductRow = Pick<Product, 'id' | 'sku' | 'name' | 'category'>
type UserRow = Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>
type BatchRow = { id: string; batch_number: string; status: string }

async function enrichInspections(rows: Inspection[]): Promise<Inspection[]> {
  if (!rows.length) return []
  const productIds = [...new Set(rows.map(r => r.product_id).filter(Boolean))]
  const batchIds = [...new Set(rows.map(r => r.batch_id).filter(Boolean))]
  const inspectorIds = [...new Set(rows.map(r => r.inspector_id).filter(Boolean))]

  const [{ data: products }, { data: batches }, { data: inspectors }] = await Promise.all([
    productIds.length
      ? supabase.from('cpaz_products').select('id, sku, name, category').in('id', productIds)
      : Promise.resolve({ data: [] }),
    batchIds.length
      ? supabase.from('cpaz_batches').select('id, batch_number, status').in('id', batchIds)
      : Promise.resolve({ data: [] }),
    inspectorIds.length
      ? supabase.from('cpaz_users').select('id, full_name, email, role').in('id', inspectorIds)
      : Promise.resolve({ data: [] }),
  ])

  const productMap: Record<string, ProductRow> = {}
  ;(products || []).forEach((p: ProductRow) => { productMap[p.id] = p })
  const batchMap: Record<string, BatchRow> = {}
  ;(batches || []).forEach((b: BatchRow) => { batchMap[b.id] = b })
  const userMap: Record<string, UserRow> = {}
  ;(inspectors || []).forEach((u: UserRow) => { userMap[u.id] = u })

  return rows.map(r => ({
    ...r,
    product: productMap[r.product_id] as unknown as Product,
    batch: r.batch_id ? (batchMap[r.batch_id] as unknown as Inspection['batch']) : undefined,
    inspector: r.inspector_id ? (userMap[r.inspector_id] as unknown as Profile) : undefined,
  }))
}

export async function getInspections(): Promise<Inspection[]> {
  return cached('inspections', async () => {
    const { data, error } = await supabase
      .from('cpaz_inspections')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return enrichInspections(data as Inspection[])
  })
}

export async function createInspection(payload: {
  product_id: string
  batch_id?: string
  inspector_id?: string
  type: InspectionType
  findings?: string
}): Promise<Inspection> {
  const { data, error } = await supabase
    .from('cpaz_inspections')
    .insert({ ...payload, status: 'pending', updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  cacheDel('inspections', 'kpis')
  const [enriched] = await enrichInspections([data as Inspection])
  return enriched
}

export async function updateInspection(id: string, payload: {
  status?: InspectionStatus
  findings?: string
  checked_at?: string
}): Promise<void> {
  const { error } = await supabase
    .from('cpaz_inspections')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('inspections', 'kpis')
}
