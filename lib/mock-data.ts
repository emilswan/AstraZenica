// ============================================================
// CPAZ Mock Data — Realistic Pharmaceutical Data
// ============================================================

import type {
  Product,
  InventoryItem,
  Order,
  Batch,
  JITPlan,
  BufferStock,
  WarehouseOp,
  Inspection,
  Profile,
} from '@/types'

export const mockProfiles: Profile[] = [
  { id: 'p1', email: 'msarwar@centralpharma.com', full_name: 'Muhammad Sarwar', role: 'admin', department: 'Supply Chain', created_at: '2024-01-01T00:00:00Z' },
  { id: 'p2', email: 'ali.hassan@centralpharma.com', full_name: 'Ali Hassan', role: 'manager', department: 'Procurement', created_at: '2024-01-05T00:00:00Z' },
  { id: 'p3', email: 'fatima.malik@centralpharma.com', full_name: 'Fatima Malik', role: 'inspector', department: 'Quality Control', created_at: '2024-02-01T00:00:00Z' },
  { id: 'p4', email: 'usman.sheikh@centralpharma.com', full_name: 'Usman Sheikh', role: 'staff', department: 'Warehouse', created_at: '2024-02-10T00:00:00Z' },
  { id: 'p5', email: 'sara.ahmed@centralpharma.com', full_name: 'Sara Ahmed', role: 'staff', department: 'Manufacturing', created_at: '2024-03-01T00:00:00Z' },
]

export const mockProducts: Product[] = [
  { id: 'prod1', sku: 'CP-AMX-500', name: 'Amoxicillin 500mg', description: 'Broad-spectrum antibiotic capsules', category: 'Antibiotics', unit: 'capsules', min_stock: 5000, reorder_point: 8000, unit_price: 0.15, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod2', sku: 'CP-PCT-1000', name: 'Paracetamol 1000mg', description: 'Analgesic and antipyretic tablets', category: 'Analgesics', unit: 'tablets', min_stock: 10000, reorder_point: 15000, unit_price: 0.08, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod3', sku: 'CP-IBU-400', name: 'Ibuprofen 400mg', description: 'NSAID anti-inflammatory tablets', category: 'Analgesics', unit: 'tablets', min_stock: 8000, reorder_point: 12000, unit_price: 0.12, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod4', sku: 'CP-MET-500', name: 'Metformin 500mg', description: 'Oral diabetes medication tablets', category: 'Antidiabetics', unit: 'tablets', min_stock: 6000, reorder_point: 9000, unit_price: 0.10, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod5', sku: 'CP-ATV-20', name: 'Atorvastatin 20mg', description: 'Cholesterol-lowering statin tablets', category: 'Cardiovascular', unit: 'tablets', min_stock: 4000, reorder_point: 6000, unit_price: 0.22, country: 'India', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod6', sku: 'CP-OMP-20', name: 'Omeprazole 20mg', description: 'Proton pump inhibitor capsules', category: 'Gastrointestinal', unit: 'capsules', min_stock: 5000, reorder_point: 7500, unit_price: 0.18, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod7', sku: 'CP-AZT-250', name: 'Azithromycin 250mg', description: 'Macrolide antibiotic tablets', category: 'Antibiotics', unit: 'tablets', min_stock: 3000, reorder_point: 5000, unit_price: 0.35, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod8', sku: 'CP-AML-5', name: 'Amlodipine 5mg', description: 'Calcium channel blocker tablets', category: 'Cardiovascular', unit: 'tablets', min_stock: 4500, reorder_point: 7000, unit_price: 0.14, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod9', sku: 'CP-CFL-500', name: 'Ciprofloxacin 500mg', description: 'Fluoroquinolone antibiotic tablets', category: 'Antibiotics', unit: 'tablets', min_stock: 3500, reorder_point: 5500, unit_price: 0.28, country: 'China', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod10', sku: 'CP-DXM-10', name: 'Dexamethasone 10mg/ml', description: 'Corticosteroid injection vials', category: 'Corticosteroids', unit: 'vials', min_stock: 1500, reorder_point: 2500, unit_price: 1.20, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod11', sku: 'CP-VIT-C1000', name: 'Vitamin C 1000mg', description: 'Ascorbic acid effervescent tablets', category: 'Vitamins & Supplements', unit: 'tablets', min_stock: 8000, reorder_point: 12000, unit_price: 0.09, country: 'Pakistan', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'prod12', sku: 'CP-INS-NPH', name: 'Insulin NPH 100IU/ml', description: 'Intermediate-acting insulin vials', category: 'Antidiabetics', unit: 'vials', min_stock: 800, reorder_point: 1200, unit_price: 8.50, country: 'Germany', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
]

export const mockInventory: InventoryItem[] = [
  { id: 'inv1', product_id: 'prod1', product: mockProducts[0], batch_number: 'BAT-2024-001', quantity: 12500, location: 'Warehouse A', expiry_date: '2026-06-30', status: 'available', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'inv2', product_id: 'prod2', product: mockProducts[1], batch_number: 'BAT-2024-002', quantity: 3200, location: 'Warehouse A', expiry_date: '2025-12-31', status: 'available', created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
  { id: 'inv3', product_id: 'prod3', product: mockProducts[2], batch_number: 'BAT-2024-003', quantity: 9800, location: 'Warehouse B', expiry_date: '2026-03-31', status: 'available', created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
  { id: 'inv4', product_id: 'prod4', product: mockProducts[3], batch_number: 'BAT-2024-004', quantity: 4200, location: 'Warehouse A', expiry_date: '2026-09-30', status: 'available', created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z' },
  { id: 'inv5', product_id: 'prod5', product: mockProducts[4], batch_number: 'BAT-2024-005', quantity: 1800, location: 'Warehouse B', expiry_date: '2025-11-30', status: 'reserved', created_at: '2024-02-05T00:00:00Z', updated_at: '2024-02-05T00:00:00Z' },
  { id: 'inv6', product_id: 'prod6', product: mockProducts[5], batch_number: 'BAT-2024-006', quantity: 6700, location: 'Warehouse A', expiry_date: '2026-06-30', status: 'available', created_at: '2024-02-10T00:00:00Z', updated_at: '2024-02-10T00:00:00Z' },
  { id: 'inv7', product_id: 'prod7', product: mockProducts[6], batch_number: 'BAT-2024-007', quantity: 2100, location: 'Warehouse B', expiry_date: '2025-10-31', status: 'available', created_at: '2024-02-15T00:00:00Z', updated_at: '2024-02-15T00:00:00Z' },
  { id: 'inv8', product_id: 'prod8', product: mockProducts[7], batch_number: 'BAT-2024-008', quantity: 3900, location: 'Warehouse A', expiry_date: '2026-12-31', status: 'available', created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z' },
  { id: 'inv9', product_id: 'prod9', product: mockProducts[8], batch_number: 'BAT-2024-009', quantity: 900, location: 'Warehouse B', expiry_date: '2025-09-30', status: 'quarantine', created_at: '2024-03-05T00:00:00Z', updated_at: '2024-03-05T00:00:00Z' },
  { id: 'inv10', product_id: 'prod10', product: mockProducts[9], batch_number: 'BAT-2024-010', quantity: 420, location: 'Cold Storage', expiry_date: '2025-08-31', status: 'available', created_at: '2024-03-10T00:00:00Z', updated_at: '2024-03-10T00:00:00Z' },
  { id: 'inv11', product_id: 'prod11', product: mockProducts[10], batch_number: 'BAT-2024-011', quantity: 14200, location: 'Warehouse A', expiry_date: '2026-04-30', status: 'available', created_at: '2024-03-15T00:00:00Z', updated_at: '2024-03-15T00:00:00Z' },
  { id: 'inv12', product_id: 'prod12', product: mockProducts[11], batch_number: 'BAT-2024-012', quantity: 340, location: 'Cold Storage', expiry_date: '2025-07-31', status: 'available', created_at: '2024-03-20T00:00:00Z', updated_at: '2024-03-20T00:00:00Z' },
]

export const mockOrders: Order[] = [
  { id: 'ord1', order_number: 'ORD-2024-01000', requester_id: 'p2', requester: mockProfiles[1], priority: 'urgent', status: 'processing', deliver_by: '2024-12-30', notes: 'Emergency order for district hospitals', total_value: 15750.00, created_at: '2024-12-01T08:30:00Z', updated_at: '2024-12-02T10:00:00Z' },
  { id: 'ord2', order_number: 'ORD-2024-01001', requester_id: 'p1', requester: mockProfiles[0], priority: 'high', status: 'approved', deliver_by: '2025-01-15', notes: 'Monthly stock replenishment', total_value: 8320.50, created_at: '2024-12-05T09:00:00Z', updated_at: '2024-12-05T14:00:00Z' },
  { id: 'ord3', order_number: 'ORD-2024-01002', requester_id: 'p2', requester: mockProfiles[1], priority: 'normal', status: 'shipped', deliver_by: '2024-12-28', notes: 'Regular supply for pharmacy chain', total_value: 4560.00, created_at: '2024-12-08T11:00:00Z', updated_at: '2024-12-10T09:00:00Z' },
  { id: 'ord4', order_number: 'ORD-2024-01003', requester_id: 'p4', requester: mockProfiles[3], priority: 'normal', status: 'pending', deliver_by: '2025-01-20', notes: undefined, total_value: 2100.00, created_at: '2024-12-10T14:00:00Z', updated_at: '2024-12-10T14:00:00Z' },
  { id: 'ord5', order_number: 'ORD-2024-01004', requester_id: 'p1', requester: mockProfiles[0], priority: 'high', status: 'delivered', deliver_by: '2024-12-15', notes: 'Completed delivery to Lahore facility', total_value: 22400.00, created_at: '2024-11-25T08:00:00Z', updated_at: '2024-12-15T16:00:00Z' },
  { id: 'ord6', order_number: 'ORD-2024-01005', requester_id: 'p5', requester: mockProfiles[4], priority: 'low', status: 'cancelled', deliver_by: '2025-02-01', notes: 'Cancelled - duplicate order', total_value: 1890.00, created_at: '2024-12-12T10:00:00Z', updated_at: '2024-12-12T15:00:00Z' },
  { id: 'ord7', order_number: 'ORD-2024-01006', requester_id: 'p2', requester: mockProfiles[1], priority: 'urgent', status: 'processing', deliver_by: '2024-12-25', notes: 'Winter stock build-up', total_value: 31250.00, created_at: '2024-12-13T07:30:00Z', updated_at: '2024-12-14T09:00:00Z' },
  { id: 'ord8', order_number: 'ORD-2024-01007', requester_id: 'p3', requester: mockProfiles[2], priority: 'normal', status: 'approved', deliver_by: '2025-01-10', notes: 'QC samples for annual audit', total_value: 3780.00, created_at: '2024-12-14T13:00:00Z', updated_at: '2024-12-15T10:00:00Z' },
  { id: 'ord9', order_number: 'ORD-2024-01008', requester_id: 'p1', requester: mockProfiles[0], priority: 'high', status: 'pending', deliver_by: '2025-01-05', notes: 'New year stock preparation', total_value: 18960.00, created_at: '2024-12-15T09:00:00Z', updated_at: '2024-12-15T09:00:00Z' },
  { id: 'ord10', order_number: 'ORD-2024-01009', requester_id: 'p4', requester: mockProfiles[3], priority: 'normal', status: 'shipped', deliver_by: '2024-12-22', notes: 'Express delivery requested', total_value: 5640.00, created_at: '2024-12-16T11:00:00Z', updated_at: '2024-12-17T14:00:00Z' },
]

export const mockBatches: Batch[] = [
  { id: 'bat1', batch_number: 'BAT-2024-001', product_id: 'prod1', product: mockProducts[0], quantity: 50000, status: 'completed', start_date: '2024-11-01', end_date: '2024-11-15', operator_id: 'p5', operator: mockProfiles[4], notes: 'Standard batch production', progress: 100, created_at: '2024-10-28T00:00:00Z', updated_at: '2024-11-15T00:00:00Z' },
  { id: 'bat2', batch_number: 'BAT-2024-002', product_id: 'prod2', product: mockProducts[1], quantity: 100000, status: 'in_progress', start_date: '2024-12-01', end_date: '2024-12-20', operator_id: 'p5', operator: mockProfiles[4], notes: 'High demand season run', progress: 65, created_at: '2024-11-25T00:00:00Z', updated_at: '2024-12-10T00:00:00Z' },
  { id: 'bat3', batch_number: 'BAT-2024-003', product_id: 'prod7', product: mockProducts[6], quantity: 20000, status: 'planned', start_date: '2024-12-22', end_date: '2025-01-05', operator_id: 'p5', operator: mockProfiles[4], notes: 'Pre-scheduled batch', progress: 0, created_at: '2024-12-01T00:00:00Z', updated_at: '2024-12-01T00:00:00Z' },
  { id: 'bat4', batch_number: 'BAT-2024-004', product_id: 'prod5', product: mockProducts[4], quantity: 30000, status: 'in_progress', start_date: '2024-12-05', end_date: '2024-12-25', operator_id: 'p4', operator: mockProfiles[3], notes: 'Q4 cardiovascular batch', progress: 40, created_at: '2024-12-02T00:00:00Z', updated_at: '2024-12-12T00:00:00Z' },
  { id: 'bat5', batch_number: 'BAT-2024-005', product_id: 'prod4', product: mockProducts[3], quantity: 75000, status: 'completed', start_date: '2024-10-15', end_date: '2024-11-01', operator_id: 'p5', operator: mockProfiles[4], notes: 'Diabetes management product batch', progress: 100, created_at: '2024-10-10T00:00:00Z', updated_at: '2024-11-01T00:00:00Z' },
  { id: 'bat6', batch_number: 'BAT-2024-006', product_id: 'prod3', product: mockProducts[2], quantity: 60000, status: 'failed', start_date: '2024-11-20', end_date: '2024-12-05', operator_id: 'p5', operator: mockProfiles[4], notes: 'Failed QC — contamination detected in raw material', progress: 35, created_at: '2024-11-18T00:00:00Z', updated_at: '2024-12-05T00:00:00Z' },
  { id: 'bat7', batch_number: 'BAT-2025-001', product_id: 'prod9', product: mockProducts[8], quantity: 25000, status: 'planned', start_date: '2025-01-08', end_date: '2025-01-20', operator_id: 'p5', operator: mockProfiles[4], notes: 'New year batch', progress: 0, created_at: '2024-12-15T00:00:00Z', updated_at: '2024-12-15T00:00:00Z' },
]

export const mockJITPlans: JITPlan[] = [
  { id: 'jit1', product_id: 'prod2', product: mockProducts[1], planned_quantity: 50000, planned_date: '2024-12-20', actual_quantity: 48000, status: 'completed', notes: 'Slightly under due to machine downtime', created_by: 'p1', creator: mockProfiles[0], created_at: '2024-12-01T00:00:00Z', updated_at: '2024-12-21T00:00:00Z' },
  { id: 'jit2', product_id: 'prod1', product: mockProducts[0], planned_quantity: 30000, planned_date: '2024-12-26', actual_quantity: undefined, status: 'in_progress', notes: 'Q4 demand spike', created_by: 'p2', creator: mockProfiles[1], created_at: '2024-12-10T00:00:00Z', updated_at: '2024-12-22T00:00:00Z' },
  { id: 'jit3', product_id: 'prod6', product: mockProducts[5], planned_quantity: 20000, planned_date: '2025-01-05', actual_quantity: undefined, status: 'pending', notes: 'New year restocking', created_by: 'p1', creator: mockProfiles[0], created_at: '2024-12-15T00:00:00Z', updated_at: '2024-12-15T00:00:00Z' },
  { id: 'jit4', product_id: 'prod4', product: mockProducts[3], planned_quantity: 40000, planned_date: '2025-01-10', actual_quantity: undefined, status: 'pending', notes: 'Seasonal demand for diabetes meds', created_by: 'p2', creator: mockProfiles[1], created_at: '2024-12-16T00:00:00Z', updated_at: '2024-12-16T00:00:00Z' },
  { id: 'jit5', product_id: 'prod5', product: mockProducts[4], planned_quantity: 15000, planned_date: '2025-01-15', actual_quantity: undefined, status: 'pending', notes: 'Buffer replenishment', created_by: 'p1', creator: mockProfiles[0], created_at: '2024-12-17T00:00:00Z', updated_at: '2024-12-17T00:00:00Z' },
  { id: 'jit6', product_id: 'prod7', product: mockProducts[6], planned_quantity: 10000, planned_date: '2025-01-20', actual_quantity: undefined, status: 'cancelled', notes: 'Cancelled — excess stock available', created_by: 'p2', creator: mockProfiles[1], created_at: '2024-12-18T00:00:00Z', updated_at: '2024-12-19T00:00:00Z' },
]

export const mockBufferStock: BufferStock[] = [
  { id: 'buf1', product_id: 'prod1', product: mockProducts[0], minimum_level: 5000, target_level: 15000, current_level: 12500, location: 'Warehouse A', last_reviewed: '2024-12-15', health: 'adequate', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-15T00:00:00Z' },
  { id: 'buf2', product_id: 'prod2', product: mockProducts[1], minimum_level: 10000, target_level: 30000, current_level: 3200, location: 'Warehouse A', last_reviewed: '2024-12-10', health: 'critical', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-10T00:00:00Z' },
  { id: 'buf3', product_id: 'prod3', product: mockProducts[2], minimum_level: 8000, target_level: 20000, current_level: 9800, location: 'Warehouse B', last_reviewed: '2024-12-12', health: 'adequate', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-12T00:00:00Z' },
  { id: 'buf4', product_id: 'prod4', product: mockProducts[3], minimum_level: 6000, target_level: 18000, current_level: 4200, location: 'Warehouse A', last_reviewed: '2024-12-14', health: 'low', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-14T00:00:00Z' },
  { id: 'buf5', product_id: 'prod5', product: mockProducts[4], minimum_level: 4000, target_level: 12000, current_level: 1800, location: 'Warehouse B', last_reviewed: '2024-12-11', health: 'critical', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-11T00:00:00Z' },
  { id: 'buf6', product_id: 'prod6', product: mockProducts[5], minimum_level: 5000, target_level: 15000, current_level: 6700, location: 'Warehouse A', last_reviewed: '2024-12-15', health: 'adequate', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-15T00:00:00Z' },
  { id: 'buf7', product_id: 'prod12', product: mockProducts[11], minimum_level: 500, target_level: 2000, current_level: 340, location: 'Cold Storage', last_reviewed: '2024-12-08', health: 'low', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-08T00:00:00Z' },
  { id: 'buf8', product_id: 'prod8', product: mockProducts[7], minimum_level: 4500, target_level: 12000, current_level: 11200, location: 'Warehouse A', last_reviewed: '2024-12-15', health: 'optimal', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-12-15T00:00:00Z' },
]

export const mockWarehouseOps: WarehouseOp[] = [
  { id: 'wop1', type: 'inbound', product_id: 'prod1', product: mockProducts[0], quantity: 20000, from_location: 'Receiving Dock', to_location: 'Warehouse A', operator_id: 'p4', operator: mockProfiles[3], status: 'completed', reference_number: 'GRN-2024-0124', notes: 'Goods received from Lahore supplier', created_at: '2024-12-01T08:00:00Z', updated_at: '2024-12-01T10:00:00Z' },
  { id: 'wop2', type: 'outbound', product_id: 'prod2', product: mockProducts[1], quantity: 5000, from_location: 'Warehouse A', to_location: 'Dispatch Bay', operator_id: 'p4', operator: mockProfiles[3], status: 'completed', reference_number: 'GDN-2024-0056', notes: 'Dispatched to Karachi hospital', created_at: '2024-12-02T09:00:00Z', updated_at: '2024-12-02T11:00:00Z' },
  { id: 'wop3', type: 'transfer', product_id: 'prod3', product: mockProducts[2], quantity: 3000, from_location: 'Warehouse A', to_location: 'Warehouse B', operator_id: 'p4', operator: mockProfiles[3], status: 'in_progress', reference_number: 'TRF-2024-0034', notes: 'Rebalancing warehouse stock', created_at: '2024-12-05T14:00:00Z', updated_at: '2024-12-05T14:00:00Z' },
  { id: 'wop4', type: 'inbound', product_id: 'prod5', product: mockProducts[4], quantity: 10000, from_location: 'Receiving Dock', to_location: 'Warehouse B', operator_id: 'p4', operator: mockProfiles[3], status: 'completed', reference_number: 'GRN-2024-0125', notes: 'Imported from India supplier', created_at: '2024-12-08T07:00:00Z', updated_at: '2024-12-08T09:30:00Z' },
  { id: 'wop5', type: 'outbound', product_id: 'prod7', product: mockProducts[6], quantity: 2000, from_location: 'Warehouse B', to_location: 'Dispatch Bay', operator_id: 'p4', operator: mockProfiles[3], status: 'pending', reference_number: 'GDN-2024-0057', notes: 'Pending order fulfillment', created_at: '2024-12-10T10:00:00Z', updated_at: '2024-12-10T10:00:00Z' },
  { id: 'wop6', type: 'return', product_id: 'prod3', product: mockProducts[2], quantity: 500, from_location: 'Dispatch Bay', to_location: 'Quarantine Area', operator_id: 'p4', operator: mockProfiles[3], status: 'completed', reference_number: 'RET-2024-0012', notes: 'Customer return — damaged packaging', created_at: '2024-12-11T15:00:00Z', updated_at: '2024-12-11T16:00:00Z' },
  { id: 'wop7', type: 'adjustment', product_id: 'prod9', product: mockProducts[8], quantity: -200, from_location: 'Warehouse B', to_location: 'QC Lab', operator_id: 'p3', operator: mockProfiles[2], status: 'completed', reference_number: 'ADJ-2024-0008', notes: 'Samples taken for quality testing', created_at: '2024-12-12T11:00:00Z', updated_at: '2024-12-12T12:00:00Z' },
  { id: 'wop8', type: 'inbound', product_id: 'prod12', product: mockProducts[11], quantity: 200, from_location: 'Receiving Dock', to_location: 'Cold Storage', operator_id: 'p4', operator: mockProfiles[3], status: 'completed', reference_number: 'GRN-2024-0126', notes: 'Cold chain maintained throughout', created_at: '2024-12-13T06:00:00Z', updated_at: '2024-12-13T08:00:00Z' },
]

export const mockInspections: Inspection[] = [
  { id: 'ins1', batch_id: 'bat1', batch: mockBatches[0], product_id: 'prod1', product: mockProducts[0], inspector_id: 'p3', inspector: mockProfiles[2], type: 'final', status: 'passed', findings: 'All parameters within spec. Purity: 99.2%. Dissolution: 95% in 45 min.', checked_at: '2024-11-16T10:00:00Z', created_at: '2024-11-15T00:00:00Z', updated_at: '2024-11-16T10:00:00Z' },
  { id: 'ins2', batch_id: 'bat6', batch: mockBatches[5], product_id: 'prod3', product: mockProducts[2], inspector_id: 'p3', inspector: mockProfiles[2], type: 'incoming', status: 'failed', findings: 'Contamination detected in API raw material. Bacillus subtilis found. Batch quarantined.', checked_at: '2024-11-21T09:00:00Z', created_at: '2024-11-20T00:00:00Z', updated_at: '2024-11-21T09:00:00Z' },
  { id: 'ins3', batch_id: 'bat2', batch: mockBatches[1], product_id: 'prod2', product: mockProducts[1], inspector_id: 'p3', inspector: mockProfiles[2], type: 'in_process', status: 'in_progress', findings: undefined, checked_at: undefined, created_at: '2024-12-08T00:00:00Z', updated_at: '2024-12-10T00:00:00Z' },
  { id: 'ins4', batch_id: undefined, batch: undefined, product_id: 'prod9', product: mockProducts[8], inspector_id: 'p3', inspector: mockProfiles[2], type: 'incoming', status: 'pending', findings: undefined, checked_at: undefined, created_at: '2024-12-12T00:00:00Z', updated_at: '2024-12-12T00:00:00Z' },
  { id: 'ins5', batch_id: 'bat4', batch: mockBatches[3], product_id: 'prod5', product: mockProducts[4], inspector_id: 'p3', inspector: mockProfiles[2], type: 'in_process', status: 'pending', findings: undefined, checked_at: undefined, created_at: '2024-12-13T00:00:00Z', updated_at: '2024-12-13T00:00:00Z' },
  { id: 'ins6', batch_id: 'bat5', batch: mockBatches[4], product_id: 'prod4', product: mockProducts[3], inspector_id: 'p3', inspector: mockProfiles[2], type: 'final', status: 'passed', findings: 'Tablets meet all pharmacopeial specifications. Hardness 12N. Friability <0.5%.', checked_at: '2024-11-02T14:00:00Z', created_at: '2024-11-01T00:00:00Z', updated_at: '2024-11-02T14:00:00Z' },
  { id: 'ins7', batch_id: undefined, batch: undefined, product_id: 'prod12', product: mockProducts[11], inspector_id: 'p3', inspector: mockProfiles[2], type: 'incoming', status: 'on_hold', findings: 'Awaiting certificate of analysis from manufacturer. Cold chain verification pending.', checked_at: undefined, created_at: '2024-12-13T07:00:00Z', updated_at: '2024-12-14T09:00:00Z' },
]

// Chart Data
export const ordersChartData = [
  { date: 'Nov 22', value: 3 },
  { date: 'Nov 25', value: 5 },
  { date: 'Nov 28', value: 4 },
  { date: 'Dec 01', value: 7 },
  { date: 'Dec 04', value: 6 },
  { date: 'Dec 07', value: 9 },
  { date: 'Dec 10', value: 8 },
  { date: 'Dec 13', value: 11 },
  { date: 'Dec 16', value: 10 },
  { date: 'Dec 19', value: 12 },
]

export const inventoryByCategoryData = [
  { category: 'Antibiotics', count: 3, value: 45200 },
  { category: 'Analgesics', count: 2, value: 38900 },
  { category: 'Antidiabetics', count: 2, value: 32100 },
  { category: 'Cardiovascular', count: 2, value: 28700 },
  { category: 'Gastrointestinal', count: 1, value: 15600 },
  { category: 'Corticosteroids', count: 1, value: 12400 },
  { category: 'Vitamins', count: 1, value: 9800 },
]

export const orderStatusData = [
  { status: 'Processing', count: 2, color: '#3b82f6' },
  { status: 'Approved', count: 2, color: '#10b981' },
  { status: 'Shipped', count: 2, color: '#8b5cf6' },
  { status: 'Pending', count: 2, color: '#f59e0b' },
  { status: 'Delivered', count: 1, color: '#22c55e' },
  { status: 'Cancelled', count: 1, color: '#ef4444' },
]

export const analyticsMonthlyData = [
  { month: 'Jul', orders: 28, revenue: 185000, batches: 5 },
  { month: 'Aug', orders: 34, revenue: 220000, batches: 6 },
  { month: 'Sep', orders: 31, revenue: 198000, batches: 5 },
  { month: 'Oct', orders: 42, revenue: 267000, batches: 8 },
  { month: 'Nov', orders: 38, revenue: 244000, batches: 7 },
  { month: 'Dec', orders: 45, revenue: 289000, batches: 9 },
]
