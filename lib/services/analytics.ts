import { supabase } from '@/lib/supabase'
import { cached } from '@/lib/cache'
import type { KPIStats, OrderStatusChart, CategoryChartData } from '@/types'

export async function getDashboardKPIs(): Promise<KPIStats> {
  return cached('kpis', async () => {
    const [r1, r2, r3] = await Promise.all([
      supabase.from('cpaz_orders').select('*', { count: 'exact', head: true }),
      supabase.from('cpaz_batches').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('cpaz_inspections').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
    ])
    const [r4, r5, r6] = await Promise.all([
      supabase.from('cpaz_inventory').select('product_id, quantity'),
      supabase.from('cpaz_products').select('id, min_stock'),
      supabase.from('cpaz_orders').select('total_value, status'),
    ])

    const minStockMap: Record<string, number> = {}
    ;(r5.data || []).forEach((p: { id: string; min_stock: number | null }) => {
      minStockMap[p.id] = p.min_stock ?? 0
    })

    const lowStockAlerts = (r4.data || []).filter((i: { product_id: string; quantity: number }) =>
      i.quantity < (minStockMap[i.product_id] ?? 0)
    ).length

    const totalRevenue = ((r6.data || []) as { status: string; total_value: number | null }[])
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_value ?? 0), 0)

    const activeOrders = ((r6.data || []) as { status: string }[]).filter(o =>
      ['pending', 'approved', 'processing'].includes(o.status)
    ).length

    return {
      totalOrders: r1.count ?? 0,
      activeOrders,
      activeBatches: r2.count ?? 0,
      lowStockAlerts,
      pendingInspections: r3.count ?? 0,
      totalRevenue,
      ordersChange: 0,
      batchesChange: 0,
      stockAlertsChange: 0,
    }
  })
}

export async function getOrderStatusChart(): Promise<OrderStatusChart[]> {
  return cached('order-status-chart', async () => {
    const { data, error } = await supabase.from('cpaz_orders').select('status')
    if (error) throw error
    const colorMap: Record<string, string> = {
      pending: '#f59e0b', approved: '#10b981', processing: '#3b82f6',
      shipped: '#8b5cf6', delivered: '#22c55e', cancelled: '#ef4444',
    }
    const counts: Record<string, number> = {}
    ;(data || []).forEach((o: { status: string }) => { counts[o.status] = (counts[o.status] || 0) + 1 })
    return Object.entries(counts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: colorMap[status] || '#94a3b8',
    }))
  })
}

export async function getInventoryByCategory(): Promise<CategoryChartData[]> {
  return cached('inventory-by-category', async () => {
    const [{ data: inventoryData, error: invError }, { data: productsData, error: prodError }] = await Promise.all([
      supabase.from('cpaz_inventory').select('product_id, quantity'),
      supabase.from('cpaz_products').select('id, category, unit_price'),
    ])
    if (invError) throw invError
    if (prodError) throw prodError

    const productMap: Record<string, { category: string; unit_price: number }> = {}
    ;(productsData || []).forEach((p: { id: string; category: string; unit_price: number }) => {
      productMap[p.id] = { category: p.category || 'Unknown', unit_price: p.unit_price ?? 0 }
    })

    const categoryMap: Record<string, { count: number; value: number }> = {}
    ;(inventoryData || []).forEach((i: { product_id: string; quantity: number }) => {
      const product = productMap[i.product_id]
      const cat = product?.category || 'Unknown'
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, value: 0 }
      categoryMap[cat].count += 1
      categoryMap[cat].value += i.quantity * (product?.unit_price ?? 0)
    })

    return Object.entries(categoryMap).map(([category, d]) => ({
      category, count: d.count, value: Math.round(d.value),
    }))
  })
}

export async function getOrdersTrend(): Promise<{ date: string; value: number }[]> {
  return cached('orders-trend', async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data, error } = await supabase
      .from('cpaz_orders').select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()).order('created_at')
    if (error) throw error
    const dayMap: Record<string, number> = {}
    ;(data || []).forEach((o: { created_at: string }) => {
      const d = new Date(o.created_at)
      const label = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
      dayMap[label] = (dayMap[label] || 0) + 1
    })
    return Object.entries(dayMap).map(([date, value]) => ({ date, value }))
  })
}

export async function getMonthlyData(): Promise<{ month: string; orders: number; revenue: number; batches: number }[]> {
  return cached('monthly-data', async () => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const [{ data: ordersData }, { data: batchesData }] = await Promise.all([
      supabase.from('cpaz_orders').select('created_at, total_value').gte('created_at', sixMonthsAgo.toISOString()),
      supabase.from('cpaz_batches').select('created_at').gte('created_at', sixMonthsAgo.toISOString()),
    ])
    const months: Record<string, { orders: number; revenue: number; batches: number }> = {}
    const key = (d: string) => new Date(d).toLocaleString('default', { month: 'short' })
    ;(ordersData || []).forEach((o: { created_at: string; total_value: number | null }) => {
      const k = key(o.created_at)
      if (!months[k]) months[k] = { orders: 0, revenue: 0, batches: 0 }
      months[k].orders += 1
      months[k].revenue += o.total_value ?? 0
    })
    ;(batchesData || []).forEach((b: { created_at: string }) => {
      const k = key(b.created_at)
      if (!months[k]) months[k] = { orders: 0, revenue: 0, batches: 0 }
      months[k].batches += 1
    })
    return Object.entries(months).map(([month, d]) => ({ month, ...d }))
  })
}
