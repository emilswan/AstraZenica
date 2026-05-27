import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { Order, OrderStatus, OrderPriority, Profile } from '@/types'

type UserRow = Pick<Profile, 'id' | 'email' | 'full_name' | 'role' | 'department'>

async function enrichOrders(rows: Order[]): Promise<Order[]> {
  if (!rows.length) return []
  const ids = [...new Set(rows.map(r => r.requester_id).filter(Boolean))]
  const { data: users } = ids.length
    ? await supabase.from('cpaz_users').select('id, email, full_name, role, department').in('id', ids)
    : { data: [] }
  const map: Record<string, UserRow> = {}
  ;(users || []).forEach((u: UserRow) => { map[u.id] = u })
  return rows.map(r => ({ ...r, requester: r.requester_id ? map[r.requester_id] as unknown as Profile : undefined }))
}

export async function getOrders(): Promise<Order[]> {
  return cached('orders', async () => {
    const { data, error } = await supabase
      .from('cpaz_orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return enrichOrders(data as Order[])
  })
}

export async function createOrder(payload: {
  requester_id: string
  priority: OrderPriority
  deliver_by?: string
  notes?: string
  total_value?: number
}): Promise<Order> {
  const { data, error } = await supabase
    .from('cpaz_orders')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  cacheDel('orders', 'kpis', 'order-status-chart', 'orders-trend')
  const [enriched] = await enrichOrders([data as Order])
  return enriched
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('cpaz_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('orders', 'kpis', 'order-status-chart')
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('cpaz_orders').delete().eq('id', id)
  if (error) throw error
  cacheDel('orders', 'kpis', 'order-status-chart', 'orders-trend')
}
