// ============================================================
// CPAZ - Central Pharma Supply Chain - TypeScript Types
// ============================================================

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'staff' | 'inspector'
  department: string
  avatar_url?: string
  created_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category: string
  unit: string
  min_stock: number
  reorder_point: number
  unit_price: number
  country?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  product_id: string
  product?: Product
  batch_number: string
  quantity: number
  location: string
  expiry_date?: string
  status: 'available' | 'reserved' | 'quarantine' | 'expired'
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Order {
  id: string
  order_number: string
  requester_id: string
  requester?: Profile
  priority: OrderPriority
  status: OrderStatus
  deliver_by?: string
  notes?: string
  total_value?: number
  items?: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  status: 'pending' | 'allocated' | 'shipped' | 'delivered'
  created_at: string
}

export type BatchStatus = 'planned' | 'in_progress' | 'completed' | 'failed' | 'on_hold'

export interface Batch {
  id: string
  batch_number: string
  product_id: string
  product?: Product
  quantity: number
  status: BatchStatus
  start_date?: string
  end_date?: string
  operator_id?: string
  operator?: Profile
  notes?: string
  progress?: number
  created_at: string
  updated_at: string
}

export interface JITPlan {
  id: string
  product_id: string
  product?: Product
  planned_quantity: number
  planned_date: string
  actual_quantity?: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  created_by: string
  creator?: Profile
  created_at: string
  updated_at: string
}

export interface BufferStock {
  id: string
  product_id: string
  product?: Product
  minimum_level: number
  target_level: number
  current_level: number
  location: string
  last_reviewed?: string
  health: 'critical' | 'low' | 'adequate' | 'optimal'
  created_at: string
  updated_at: string
}

export type WarehouseOpType = 'inbound' | 'outbound' | 'transfer' | 'return' | 'adjustment'

export interface WarehouseOp {
  id: string
  type: WarehouseOpType
  product_id: string
  product?: Product
  quantity: number
  from_location?: string
  to_location?: string
  operator_id?: string
  operator?: Profile
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  reference_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'on_hold'
export type InspectionType = 'incoming' | 'in_process' | 'final' | 'periodic'

export interface Inspection {
  id: string
  batch_id?: string
  batch?: Batch
  product_id: string
  product?: Product
  inspector_id?: string
  inspector?: Profile
  type: InspectionType
  status: InspectionStatus
  findings?: string
  checked_at?: string
  created_at: string
  updated_at: string
}

export interface MapPoint {
  id: string
  order_id: string
  order?: Order
  latitude: number
  longitude: number
  label: string
  status: string
  recorded_at: string
}

// Dashboard / Analytics Types
export interface KPIStats {
  totalOrders: number
  activeOrders: number
  activeBatches: number
  lowStockAlerts: number
  pendingInspections: number
  totalRevenue: number
  ordersChange: number
  batchesChange: number
  stockAlertsChange: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface CategoryChartData {
  category: string
  count: number
  value: number
}

export interface OrderStatusChart {
  status: string
  count: number
  color: string
}

// Table / Filter Types
export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface FilterOption {
  label: string
  value: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  profile?: Profile
}

export interface LoginCredentials {
  email: string
  password: string
}
