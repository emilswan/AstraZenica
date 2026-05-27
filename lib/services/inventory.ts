import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { InventoryItem, Product } from '@/types'

type ProductRow = Pick<Product, 'id' | 'sku' | 'name' | 'category' | 'unit' | 'min_stock' | 'reorder_point' | 'unit_price'>

async function fetchProductMap(): Promise<Record<string, ProductRow>> {
  const { data } = await supabase
    .from('cpaz_products')
    .select('id, sku, name, category, unit, min_stock, reorder_point, unit_price')
  const map: Record<string, ProductRow> = {}
  ;(data || []).forEach((p: ProductRow) => { map[p.id] = p })
  return map
}

export async function getInventory(): Promise<InventoryItem[]> {
  return cached('inventory', async () => {
    const [{ data: invData, error }, productMap] = await Promise.all([
      supabase.from('cpaz_inventory').select('*').order('created_at', { ascending: false }),
      fetchProductMap(),
    ])
    if (error) throw error
    return (invData || []).map((item: InventoryItem) => ({ ...item, product: productMap[item.product_id] as unknown as Product }))
  })
}

export async function createInventoryItem(payload: {
  product_id: string
  batch_number: string
  quantity: number
  location: string
  expiry_date?: string
  status?: InventoryItem['status']
}): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('cpaz_inventory')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  const { data: product } = await supabase
    .from('cpaz_products')
    .select('id, sku, name, category, unit, min_stock, reorder_point, unit_price')
    .eq('id', payload.product_id)
    .single()
  cacheDel('inventory', 'kpis', 'inventory-by-category')
  return { ...data, product } as InventoryItem
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItem>): Promise<void> {
  const { error } = await supabase
    .from('cpaz_inventory')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('inventory', 'kpis', 'inventory-by-category')
}
