import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { WarehouseOp, WarehouseOpType, Product, Profile } from '@/types'

type ProductRow = Pick<Product, 'id' | 'sku' | 'name' | 'category' | 'unit'>
type UserRow = Pick<Profile, 'id' | 'full_name' | 'email'>

async function enrichOps(rows: WarehouseOp[]): Promise<WarehouseOp[]> {
  if (!rows.length) return []
  const productIds = [...new Set(rows.map(r => r.product_id).filter(Boolean))]
  const operatorIds = [...new Set(rows.map(r => r.operator_id).filter(Boolean))]

  const [{ data: products }, { data: operators }] = await Promise.all([
    productIds.length
      ? supabase.from('cpaz_products').select('id, sku, name, category, unit').in('id', productIds)
      : Promise.resolve({ data: [] }),
    operatorIds.length
      ? supabase.from('cpaz_users').select('id, full_name, email').in('id', operatorIds)
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

export async function getWarehouseOps(): Promise<WarehouseOp[]> {
  return cached('warehouse-ops', async () => {
    const { data, error } = await supabase
      .from('cpaz_warehouse_ops')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return enrichOps(data as WarehouseOp[])
  })
}

export async function createWarehouseOp(payload: {
  type: WarehouseOpType
  product_id: string
  quantity: number
  from_location?: string
  to_location?: string
  operator_id?: string
  reference_number?: string
  notes?: string
}): Promise<WarehouseOp> {
  const { data, error } = await supabase
    .from('cpaz_warehouse_ops')
    .insert({ ...payload, status: 'pending', updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  cacheDel('warehouse-ops')
  const [enriched] = await enrichOps([data as WarehouseOp])
  return enriched
}

export async function updateWarehouseOpStatus(id: string, status: WarehouseOp['status']): Promise<void> {
  const { error } = await supabase
    .from('cpaz_warehouse_ops')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('warehouse-ops')
}
