// ============================================================
// Mock service implementations — returned when NEXT_PUBLIC_USE_MOCK=true
// Real DB integration is untouched; flip the flag to switch back.
// ============================================================

import {
  mockProducts, mockOrders, mockInventory, mockBatches,
  mockInspections, mockJITPlans, mockBufferStock, mockWarehouseOps,
  mockProfiles, ordersChartData, inventoryByCategoryData,
  orderStatusData, analyticsMonthlyData,
} from '@/lib/mock-data'
import type {
  Product, Order, OrderStatus, OrderPriority,
  InventoryItem, Batch, BatchStatus,
  Inspection, InspectionType, InspectionStatus,
  JITPlan, BufferStock, WarehouseOp, WarehouseOpType,
  KPIStats, OrderStatusChart, CategoryChartData,
} from '@/types'

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))
const now = () => new Date().toISOString()
const fakeId = () => `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getDashboardKPIs(): Promise<KPIStats> {
  await delay()
  const activeOrders = mockOrders.filter(o => ['pending', 'approved', 'processing'].includes(o.status)).length
  const activeBatches = mockBatches.filter(b => b.status === 'in_progress').length
  const pendingInspections = mockInspections.filter(i => ['pending', 'in_progress', 'on_hold'].includes(i.status)).length
  const totalRevenue = mockOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_value ?? 0), 0)
  const minStockMap: Record<string, number> = {}
  mockProducts.forEach(p => { minStockMap[p.id] = p.min_stock })
  const lowStockAlerts = mockInventory.filter(i => i.quantity < (minStockMap[i.product_id] ?? 0)).length
  return {
    totalOrders: mockOrders.length,
    activeOrders,
    activeBatches,
    lowStockAlerts,
    pendingInspections,
    totalRevenue,
    ordersChange: 12,
    batchesChange: -1,
    stockAlertsChange: 2,
  }
}

export async function getOrderStatusChart(): Promise<OrderStatusChart[]> {
  await delay()
  return orderStatusData
}

export async function getInventoryByCategory(): Promise<CategoryChartData[]> {
  await delay()
  return inventoryByCategoryData
}

export async function getOrdersTrend(): Promise<{ date: string; value: number }[]> {
  await delay()
  return ordersChartData
}

export async function getMonthlyData(): Promise<{ month: string; orders: number; revenue: number; batches: number }[]> {
  await delay()
  return analyticsMonthlyData
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  await delay()
  return [...mockProducts]
}

export async function createProduct(payload: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  await delay()
  return { ...payload, id: fakeId(), created_at: now(), updated_at: now() }
}

export async function updateProduct(_id: string, _payload: Partial<Product>): Promise<void> {
  await delay()
}

export async function toggleProductActive(_id: string, _is_active: boolean): Promise<void> {
  await delay()
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  await delay()
  return [...mockOrders]
}

export async function createOrder(payload: {
  requester_id: string
  priority: OrderPriority
  deliver_by?: string
  notes?: string
  total_value?: number
}): Promise<Order> {
  await delay()
  const year = new Date().getFullYear()
  const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return {
    id: fakeId(),
    order_number: `ORD-${year}-${num}`,
    status: 'pending',
    requester: mockProfiles.find(p => p.id === payload.requester_id),
    created_at: now(),
    updated_at: now(),
    ...payload,
  }
}

export async function updateOrderStatus(_id: string, _status: OrderStatus): Promise<void> {
  await delay()
}

export async function deleteOrder(_id: string): Promise<void> {
  await delay()
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  await delay()
  return [...mockInventory]
}

export async function createInventoryItem(payload: {
  product_id: string
  batch_number: string
  quantity: number
  location: string
  expiry_date?: string
  status?: InventoryItem['status']
}): Promise<InventoryItem> {
  await delay()
  const product = mockProducts.find(p => p.id === payload.product_id)
  return {
    id: fakeId(),
    status: 'available',
    product,
    created_at: now(),
    updated_at: now(),
    ...payload,
  } as InventoryItem
}

export async function updateInventoryItem(_id: string, _payload: Partial<InventoryItem>): Promise<void> {
  await delay()
}

// ─── Batches ──────────────────────────────────────────────────────────────────

export async function getBatches(): Promise<Batch[]> {
  await delay()
  return [...mockBatches]
}

export async function createBatch(payload: {
  product_id: string
  quantity: number
  start_date?: string
  end_date?: string
  operator_id?: string
  notes?: string
}): Promise<Batch> {
  await delay()
  const batchNumber = `BAT-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
  const product = mockProducts.find(p => p.id === payload.product_id)
  const operator = mockProfiles.find(p => p.id === payload.operator_id)
  return {
    id: fakeId(),
    batch_number: batchNumber,
    status: 'planned',
    progress: 0,
    product,
    operator,
    created_at: now(),
    updated_at: now(),
    ...payload,
  } as Batch
}

export async function updateBatch(_id: string, _payload: {
  status?: BatchStatus
  progress?: number
  notes?: string
  end_date?: string
}): Promise<void> {
  await delay()
}

// ─── Inspections ──────────────────────────────────────────────────────────────

export async function getInspections(): Promise<Inspection[]> {
  await delay()
  return [...mockInspections]
}

export async function createInspection(payload: {
  product_id: string
  batch_id?: string
  inspector_id?: string
  type: InspectionType
  findings?: string
}): Promise<Inspection> {
  await delay()
  const product = mockProducts.find(p => p.id === payload.product_id)
  const inspector = mockProfiles.find(p => p.id === payload.inspector_id)
  const batch = mockBatches.find(b => b.id === payload.batch_id)
  return {
    id: fakeId(),
    status: 'pending' as InspectionStatus,
    product,
    inspector,
    batch: batch ? { id: batch.id, batch_number: batch.batch_number, status: batch.status } : undefined,
    created_at: now(),
    updated_at: now(),
    ...payload,
  } as unknown as Inspection
}

export async function updateInspection(_id: string, _payload: {
  status?: InspectionStatus
  findings?: string
  checked_at?: string
}): Promise<void> {
  await delay()
}

// ─── JIT Plans ────────────────────────────────────────────────────────────────

export async function getJITPlans(): Promise<JITPlan[]> {
  await delay()
  return [...mockJITPlans]
}

export async function createJITPlan(payload: {
  product_id: string
  planned_quantity: number
  planned_date: string
  notes?: string
  created_by: string
}): Promise<JITPlan> {
  await delay()
  const product = mockProducts.find(p => p.id === payload.product_id)
  const creator = mockProfiles.find(p => p.id === payload.created_by)
  return {
    id: fakeId(),
    status: 'pending',
    product,
    creator,
    created_at: now(),
    updated_at: now(),
    ...payload,
  } as JITPlan
}

export async function updateJITPlan(_id: string, _payload: {
  status?: JITPlan['status']
  actual_quantity?: number
  notes?: string
}): Promise<void> {
  await delay()
}

export async function deleteJITPlan(_id: string): Promise<void> {
  await delay()
}

// ─── Buffer Stock ─────────────────────────────────────────────────────────────

export async function getBufferStock(): Promise<BufferStock[]> {
  await delay()
  return [...mockBufferStock]
}

export async function updateBufferStock(_id: string, _payload: {
  current_level?: number
  minimum_level?: number
  target_level?: number
  location?: string
  last_reviewed?: string
}): Promise<void> {
  await delay()
}

export async function createBufferStock(payload: {
  product_id: string
  minimum_level: number
  target_level: number
  current_level: number
  location: string
}): Promise<BufferStock> {
  await delay()
  const product = mockProducts.find(p => p.id === payload.product_id)
  const { current_level, minimum_level, target_level } = payload
  const health: BufferStock['health'] =
    current_level < minimum_level ? 'critical'
    : current_level < minimum_level * 1.5 ? 'low'
    : current_level < target_level ? 'adequate'
    : 'optimal'
  return {
    id: fakeId(),
    health,
    last_reviewed: now().split('T')[0],
    product,
    created_at: now(),
    updated_at: now(),
    ...payload,
  } as BufferStock
}

// ─── Warehouse Ops ────────────────────────────────────────────────────────────

export async function getWarehouseOps(): Promise<WarehouseOp[]> {
  await delay()
  return [...mockWarehouseOps]
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
  await delay()
  const product = mockProducts.find(p => p.id === payload.product_id)
  const operator = mockProfiles.find(p => p.id === payload.operator_id)
  return {
    id: fakeId(),
    status: 'pending',
    product,
    operator,
    created_at: now(),
    updated_at: now(),
    ...payload,
  } as WarehouseOp
}

export async function updateWarehouseOpStatus(_id: string, _status: WarehouseOp['status']): Promise<void> {
  await delay()
}
