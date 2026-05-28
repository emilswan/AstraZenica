'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, AlertTriangle, Package, Plus, RefreshCw, Download, ScanBarcode, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { getInventory, createInventoryItem } from '@/lib/services/inventory'
import { getProducts } from '@/lib/services/products'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ScanModal } from '@/components/ui/ScanModal'
import { SkeletonTable } from '@/components/ui/SkeletonLoader'
import { DetailPanel } from '@/components/ui/DetailPanel'
import { getStatusConfig } from '@/lib/constants/status'
import toast from 'react-hot-toast'
import type { InventoryItem, Product } from '@/types'

function StatusPill({ level }: { level: 'ok' | 'low' | 'critical' }) {
  const cfg = { ok: 'bg-emerald-100 text-emerald-700 dot-green', low: 'bg-amber-100 text-amber-700 dot-orange', critical: 'bg-red-100 text-red-700 dot-red' }[level]
  const label = { ok: 'OK', low: 'Low', critical: 'Critical' }[level]
  return <span className={`pill ${cfg.split(' ').slice(0, 2).join(' ')}`}><span className={`dot ${cfg.split(' ')[2]}`} />{label}</span>
}

export default function InventoryPage() {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ product_id: '', batch_number: '', quantity: '', location: '', expiry_date: '', status: 'available' as InventoryItem['status'] })
  const [showScan, setShowScan] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingMsg('Refreshing...')
    try { const [inv, prods] = await Promise.all([getInventory(), getProducts()]); setInventory(inv); setProducts(prods) }
    catch { toast.error('Failed to load inventory') }
    finally { setLoadingMsg(''); setIsInitialLoading(false) }
  }, [])

  // On mount: load from cache (show skeleton while loading)
  useEffect(() => { loadData(false) }, [loadData])

  // Refresh: clear cache + reload with spinner
  function handleRefresh() { cacheDel('inventory', 'products', 'kpis', 'inventory-by-category'); loadData(true) }

  const filtered = useMemo(() => inventory.filter(item => {
    const ms = !search || item.product?.name?.toLowerCase().includes(search.toLowerCase()) || item.product?.sku?.toLowerCase().includes(search.toLowerCase()) || item.batch_number.toLowerCase().includes(search.toLowerCase())
    const mst = !statusFilter || item.status === statusFilter
    return ms && mst
  }), [inventory, search, statusFilter])

  const stats = useMemo(() => {
    const total = inventory.length
    const inStock = inventory.filter(i => i.status === 'available').length
    const low = inventory.filter(i => i.product && i.quantity < (i.product.reorder_point || 0)).length
    const critical = inventory.filter(i => i.product && i.quantity < (i.product.min_stock || 0)).length
    return { total, inStock, low, critical }
  }, [inventory])

  const getLevel = (item: InventoryItem): 'ok' | 'low' | 'critical' => {
    const min = item.product?.min_stock || 0; const reorder = item.product?.reorder_point || 0
    if (item.quantity <= 0 || item.quantity < min) return 'critical'
    if (item.quantity < reorder) return 'low'
    return 'ok'
  }

  const handleAdd = async () => {
    if (!form.product_id || !form.batch_number || !form.quantity || !form.location) { toast.error('Fill required fields'); return }
    setSubmitting(true)
    try {
      const ni = await createInventoryItem({ product_id: form.product_id, batch_number: form.batch_number, quantity: Number(form.quantity), location: form.location, expiry_date: form.expiry_date || undefined, status: form.status })
      setInventory(prev => [ni, ...prev]); toast.success('Added!'); setShowAddModal(false)
      setForm({ product_id: '', batch_number: '', quantity: '', location: '', expiry_date: '', status: 'available' })
    } catch { toast.error('Failed') } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-full animate-fade-in" style={{ backgroundColor:'#F7F9FC', backgroundImage:'radial-gradient(#DDE3EE 1px,transparent 1px)', backgroundSize:'24px 24px' }}>
      <div className="px-4 sm:px-6 py-5 space-y-4">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-400 mt-0.5">Stock levels, batches & expiry tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="action-btn h-9 w-9 text-slate-500 hover:bg-gray-100 rounded-lg border border-gray-200"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowScan(true)} className="action-btn h-9 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs gap-1.5"><ScanBarcode className="h-4 w-4" /><span className="hidden sm:inline">Scan</span></button>
          <button onClick={() => setShowAddModal(true)} className="action-btn h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs gap-1.5"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Item</span></button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-2">
        <div className="kpi"><p className="kpi-value text-slate-800">{stats.total}</p><p className="kpi-label">Total</p></div>
        <div className="kpi"><p className="kpi-value text-emerald-600">{stats.inStock}</p><p className="kpi-label">In Stock</p></div>
        <div className="kpi"><p className="kpi-value text-amber-600">{stats.low}</p><p className="kpi-label">Low</p></div>
        <div className="kpi border-red-200 bg-red-50"><p className="kpi-value text-red-600">{stats.critical}</p><p className="kpi-label">Critical</p></div>
      </div>

      {/* Search + filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input placeholder="Search items, SKU, batch..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-violet-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 bg-white focus:ring-1 focus:ring-violet-500">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="quarantine">Quarantine</option>
        </select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter('') }} className="text-xs text-slate-500 hover:text-violet-600 font-semibold px-2 border border-gray-200 rounded-lg bg-white h-8">Clear</button>
        )}
      </div>

      {/* Two-column layout: Table + Detail Panel */}
      <div className="flex gap-3">
        {/* Table or Skeleton */}
        {isInitialLoading ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="flex-1 op-card overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-gray-200/60">
                {['Item', 'SKU', 'Stock', 'Reserved', 'Status', 'Location', 'Expiry', ''].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-xs"><Package className="h-6 w-6 mx-auto mb-1 opacity-20" />No items</td></tr>
              ) : filtered.map(item => {
                const level = getLevel(item)
                const expSoon = item.expiry_date && (new Date(item.expiry_date).getTime() - Date.now()) / 86400000 <= 90
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      'border-b border-gray-50 cursor-pointer transition-colors',
                      selectedItem?.id === item.id ? 'bg-violet-50' : 'hover:bg-violet-50/20'
                    )}
                  >
                    <td className="py-2 px-3">
                      <p className="font-semibold text-slate-800">{item.product?.name}</p>
                      <p className="text-[10px] text-slate-400">{item.product?.category}</p>
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{item.product?.sku}</td>
                    <td className="py-2 px-3">
                      <span className={cn('font-bold', level === 'ok' ? 'text-emerald-600' : level === 'low' ? 'text-amber-600' : 'text-red-600')}>
                        {formatNumber(item.quantity)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{Math.floor(item.quantity * 0.2)}</td>
                    <td className="py-2 px-3"><StatusPill level={level} /></td>
                    <td className="py-2 px-3 text-slate-500">{item.location}</td>
                    <td className="py-2 px-3">
                      {expSoon ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-semibold">
                          <AlertTriangle className="h-3 w-3" />{formatDate(item.expiry_date)}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">{formatDate(item.expiry_date) || '—'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <button onClick={() => router.push('/dashboard/orders')} className="pill bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors cursor-pointer text-[10px]">Order</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">No items</div>
          ) : filtered.map(item => {
            const level = getLevel(item)
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors',
                  selectedItem?.id === item.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                )}
              >
                <div className="h-9 w-9 bg-[#F5F7FA] rounded-lg flex items-center justify-center flex-shrink-0"><Package className="h-4 w-4 text-slate-300" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.product?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">Stock: <strong className={cn(level === 'ok' ? 'text-emerald-600' : level === 'low' ? 'text-amber-600' : 'text-red-600')}>{formatNumber(item.quantity)}</strong></span>
                    <StatusPill level={level} />
                  </div>
                </div>
                <button onClick={() => router.push('/dashboard/orders')} className="action-btn h-8 px-2.5 bg-violet-50 text-violet-600 rounded-lg text-[10px] font-semibold">Order</button>
              </div>
            )
          })}
        </div>
        </div>
        )}

        {/* Detail Panel */}
        <DetailPanel
          isOpen={!!selectedItem}
          title={selectedItem?.product?.name || 'Item Details'}
          subtitle={selectedItem?.batch_number}
          onClose={() => setSelectedItem(null)}
          actions={
            selectedItem && (
              <button onClick={() => router.push('/dashboard/orders')} className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors">
                Create Order
              </button>
            )
          }
        >
          {selectedItem && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">SKU</p>
                <p className="text-sm font-mono text-slate-700">{selectedItem.product?.sku}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Category</p>
                <p className="text-sm text-slate-700">{selectedItem.product?.category || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Stock Level</p>
                <p className={cn('text-lg font-bold', getStatusConfig(getLevel(selectedItem)).text)}>
                  {formatNumber(selectedItem.quantity)} {selectedItem.product?.unit}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Status</p>
                <span className={cn('inline-block px-2 py-1 rounded text-[10px] font-semibold', getStatusConfig(selectedItem.status).badge)}>
                  {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Location</p>
                <p className="text-sm text-slate-700">{selectedItem.location}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Expiry Date</p>
                <p className="text-sm text-slate-700">{selectedItem.expiry_date ? formatDate(selectedItem.expiry_date) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Reorder Point</p>
                <p className="text-sm text-slate-700">{selectedItem.product?.reorder_point || '—'}</p>
              </div>
            </div>
          )}
        </DetailPanel>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Inventory" size="md"
        footer={<><Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAdd} disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white">{submitting ? 'Adding...' : 'Add'}</Button></>}>
        <div className="space-y-3">
          <Select label="Product *" options={products.map(p => ({ label: `${p.name} (${p.sku})`, value: p.id }))} placeholder="Select" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Batch #" placeholder="BATCH-001" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} />
            <Input label="Qty" type="number" min="0" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Location" placeholder="WH-A, Shelf 3" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <Input label="Expiry" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ScanModal
        isOpen={showScan}
        onClose={() => setShowScan(false)}
        onResult={(code) => {
          // Auto-fill search with scanned code
          setSearch(code)
          setShowScan(false)
          toast.success(`Searching for: ${code}`)
        }}
        title="Scan Inventory Item"
        placeholder="Enter SKU, batch number, or product name..."
      />
      </div>{/* end inner */}
    </div>
  )
}
