import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { JITPlan, Product, Profile } from '@/types'

type ProductRow = Pick<Product, 'id' | 'sku' | 'name' | 'category' | 'unit'>
type UserRow = Pick<Profile, 'id' | 'full_name' | 'email'>

async function enrichPlans(rows: JITPlan[]): Promise<JITPlan[]> {
  if (!rows.length) return []
  const productIds = [...new Set(rows.map(r => r.product_id).filter(Boolean))]
  const creatorIds = [...new Set(rows.map(r => r.created_by).filter(Boolean))]

  const [{ data: products }, { data: creators }] = await Promise.all([
    productIds.length
      ? supabase.from('cpaz_products').select('id, sku, name, category, unit').in('id', productIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length
      ? supabase.from('cpaz_users').select('id, full_name, email').in('id', creatorIds)
      : Promise.resolve({ data: [] }),
  ])

  const productMap: Record<string, ProductRow> = {}
  ;(products || []).forEach((p: ProductRow) => { productMap[p.id] = p })
  const userMap: Record<string, UserRow> = {}
  ;(creators || []).forEach((u: UserRow) => { userMap[u.id] = u })

  return rows.map(r => ({
    ...r,
    product: productMap[r.product_id] as unknown as Product,
    creator: r.created_by ? (userMap[r.created_by] as unknown as Profile) : undefined,
  }))
}

export async function getJITPlans(): Promise<JITPlan[]> {
  return cached('jit-plans', async () => {
    const { data, error } = await supabase
      .from('cpaz_jit_plans')
      .select('*')
      .order('planned_date', { ascending: true })
    if (error) throw error
    return enrichPlans(data as JITPlan[])
  })
}

export async function createJITPlan(payload: {
  product_id: string
  planned_quantity: number
  planned_date: string
  notes?: string
  created_by: string
}): Promise<JITPlan> {
  const { data, error } = await supabase
    .from('cpaz_jit_plans')
    .insert({ ...payload, status: 'pending', updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  cacheDel('jit-plans')
  const [enriched] = await enrichPlans([data as JITPlan])
  return enriched
}

export async function updateJITPlan(id: string, payload: {
  status?: JITPlan['status']
  actual_quantity?: number
  notes?: string
}): Promise<void> {
  const { error } = await supabase
    .from('cpaz_jit_plans')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('jit-plans')
}

export async function deleteJITPlan(id: string): Promise<void> {
  const { error } = await supabase.from('cpaz_jit_plans').delete().eq('id', id)
  if (error) throw error
  cacheDel('jit-plans')
}
