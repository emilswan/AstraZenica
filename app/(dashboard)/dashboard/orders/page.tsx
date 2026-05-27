'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Plus, Trash2, Minus, Info, ShoppingCart, Package, ScanBarcode, AlertTriangle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ScanModal } from '@/components/ui/ScanModal'
import { getProducts } from '@/lib/services/products'
import { getInventory } from '@/lib/services/inventory'
import { createOrder } from '@/lib/services/orders'
import { useAuth } from '@/contexts/AuthContext'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Product, InventoryItem, OrderPriority } from '@/types'

interface BasketItem {
  product: Product
  quantity: number
  stock: number
  reserved: number
  nearestExpiry?: string
}

export default function PlaceOrderPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [deliverBy, setDeliverBy] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('normal')
  const [deliverTo, setDeliverTo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [showScan, setShowScan] = useState(false)

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingMsg('Refreshing...')
    try {
      const [p, inv] = await Promise.all([getProducts(), getInventory()])
      setProducts(p); setInventory(inv)
    } catch { toast.error('Failed to load') }
    finally { setLoadingMsg('') }
  }, [])

  useEffect(() => { loadData(false) }, [loadData])

  const stockMap = useMemo(() => {
    const m: Record<string, { stock: number; reserved: number; nearestExpiry?: string }> = {}
    for (const item of inventory) {
      if (!item.product_id) continue
      if (!m[item.product_id]) m[item.product_id] = { stock: 0, reserved: 0 }
      m[item.product_id].stock += item.quantity
      m[item.product_id].reserved += Math.floor(item.quantity * 0.2)
      if (item.expiry_date) {
        const cur = m[item.product_id].nearestExpiry
        if (!cur || new Date(item.expiry_date) < new Date(cur)) m[item.product_id].nearestExpiry = item.expiry_date
      }
    }
    return m
  }, [inventory])

  const filteredProducts = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))

  function addToBasket(product: Product) {
    if (basket.find(b => b.product.id === product.id)) return
    const info = stockMap[product.id] || { stock: 0, reserved: 0 }
    setBasket(prev => [...prev, { product, quantity: 1, stock: info.stock, reserved: info.reserved, nearestExpiry: info.nearestExpiry }])
    setShowAdd(false)
    toast.success(`${product.name} added`)
  }

  function removeItem(id: string) { setBasket(prev => prev.filter(b => b.product.id !== id)) }
  function updateQty(id: string, d: number) { setBasket(prev => prev.map(b => b.product.id === id ? { ...b, quantity: Math.max(1, b.quantity + d) } : b)) }

  const totalQty = basket.reduce((s, b) => s + b.quantity, 0)
  const nearestExp = basket.filter(b => b.nearestExpiry).sort((a, b) => new Date(a.nearestExpiry!).getTime() - new Date(b.nearestExpiry!).getTime())[0]?.nearestExpiry

  function handleScanResult(code: string) {
    const product = products.find(p => p.sku.toLowerCase() === code.toLowerCase() || p.name.toLowerCase().includes(code.toLowerCase()))
    if (product) {
      addToBasket(product)
    } else {
      toast.error(`No product found for: ${code}`)
    }
  }

  async function handlePlace() {
    if (!basket.length) { toast.error('Add items first'); return }
    if (!user) { toast.error('Not authenticated'); return }
    setSubmitting(true)
    try {
      const val = basket.reduce((s, b) => s + (b.product.unit_price || 0) * b.quantity, 0)
      // Build detailed notes with all items for DB storage
      const itemLines = basket.map(b => `${b.product.name} (${b.product.sku}) x${b.quantity}`).join('\n')
      const notes = [deliverTo ? `Deliver to: ${deliverTo}` : '', `Items:\n${itemLines}`].filter(Boolean).join('\n\n')
      await createOrder({ requester_id: user.id, priority, deliver_by: deliverBy || undefined, notes, total_value: val })
      toast.success('Order placed successfully!')
      setBasket([]); setDeliverBy(''); setPriority('normal'); setDeliverTo('')
    } catch { toast.error('Failed to place order') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ backgroundColor:'#F7F9FC', backgroundImage:'radial-gradient(#DDE3EE 1px,transparent 1px)', backgroundSize:'24px 24px' }}>
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />

      <div className="flex-1 px-4 sm:px-6 py-5 space-y-4 overflow-y-auto">

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Place Order</h1>
          <p className="text-sm text-slate-400 mt-0.5">Build & submit a new procurement order</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowScan(true)} className="action-btn h-9 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs gap-1.5">
            <ScanBarcode className="h-4 w-4" /><span className="hidden sm:inline">Scan</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="action-btn h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs gap-1.5">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Add Item</span>
          </button>
        </div>
      </div>

        {/* Order config — compact row */}
        <div className="op-card px-3 py-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as OrderPriority)} className="w-full mt-0.5 text-xs border border-gray-200 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-violet-500 bg-white">
                <option value="normal">Standard</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Deliver by</label>
              <input type="datetime-local" value={deliverBy} onChange={e => setDeliverBy(e.target.value)} className="w-full mt-0.5 text-xs border border-gray-200 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-violet-500 bg-white" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Location</label>
              <input placeholder="Lab 1, Floor 2" value={deliverTo} onChange={e => setDeliverTo(e.target.value)} className="w-full mt-0.5 text-xs border border-gray-200 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-violet-500 bg-white" />
            </div>
          </div>
        </div>

        {/* Basket */}
        {basket.length === 0 ? (
          <div className="op-card p-8 text-center">
            <ShoppingCart className="h-8 w-8 mx-auto text-slate-200 mb-2" />
            <p className="text-xs text-slate-400 font-medium">No items yet</p>
            <p className="text-[10px] text-slate-300 mt-0.5">Tap "Add Item" or "Scan" to start</p>
          </div>
        ) : (
          <div className="space-y-2">
            {basket.map(item => {
              const available = item.stock - item.reserved
              const isLow = available <= 5 && available > 0
              const isOut = available <= 0
              return (
                <div key={item.product.id} className="op-card px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    {/* Icon */}
                    <div className="h-10 w-10 bg-[#F5F7FA] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-slate-300" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 leading-tight truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.product.sku}</p>
                    </div>
                    {/* Qty */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateQty(item.product.id, -1)} className="h-7 w-7 rounded border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                      <span className="w-7 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="h-7 w-7 rounded border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-gray-50"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>

                  {/* Bottom row — stock info + actions */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-slate-400">Stock <strong className="text-slate-600">{formatNumber(item.stock)}</strong></span>
                      <span className="text-slate-400">Reserved <strong className="text-slate-600">{formatNumber(item.reserved)}</strong></span>
                      {isLow && <span className="pill bg-amber-100 text-amber-700"><AlertTriangle className="h-2.5 w-2.5" /> Low stock</span>}
                      {isOut && <span className="pill bg-red-100 text-red-700"><AlertTriangle className="h-2.5 w-2.5" /> Out of stock</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toast(`Certificate of Analysis for ${item.product.name}\nBatch: Available on delivery\nSKU: ${item.product.sku}`, { icon: '📄', duration: 5000 })} className="pill bg-gray-100 text-slate-500 hover:bg-gray-200 transition-colors cursor-pointer"><FileText className="h-2.5 w-2.5" /> CoA</button>
                      <button onClick={() => removeItem(item.product.id)} className="pill bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"><Trash2 className="h-2.5 w-2.5" /> Remove</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>{/* end inner scroll */}

      {/* Order Summary — sticky */}
      {basket.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 sm:px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-slate-400">Components: <strong className="text-slate-700">{totalQty}</strong></span>
            {nearestExp && <span className="text-slate-400">Nearest Expiry: <strong className="text-slate-700">{formatDate(nearestExp)}</strong></span>}
            {deliverBy && <span className="text-slate-400 hidden sm:inline">Deliver: <strong className="text-slate-700">{new Date(deliverBy).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></span>}
          </div>
          <button onClick={handlePlace} disabled={submitting} className="w-full action-btn h-12 az-logo text-white font-bold text-sm rounded-lg shadow-sm disabled:opacity-60">
            {submitting ? 'Placing...' : 'Place Order'}
          </button>
        </div>
      )}

      {/* Add panel */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col animate-slide-up">
            <div className="px-4 pt-4 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Add Items</h3>
                <button onClick={() => setShowAdd(false)} className="text-xs text-slate-400 font-semibold">Done</button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FA] border border-gray-200 rounded-lg focus:ring-1 focus:ring-violet-500" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {filteredProducts.map(product => {
                const info = stockMap[product.id] || { stock: 0, reserved: 0 }
                const inBasket = basket.some(b => b.product.id === product.id)
                return (
                  <div key={product.id} onClick={() => !inBasket && addToBasket(product)}
                    className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all cursor-pointer', inBasket ? 'border-violet-200 bg-violet-50/30 opacity-50' : 'border-gray-100 hover:border-gray-300')}>
                    <div className="h-8 w-8 bg-[#F5F7FA] rounded flex items-center justify-center flex-shrink-0"><Package className="h-4 w-4 text-slate-300" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-400">{product.sku} · Stock: {formatNumber(info.stock)}</p>
                    </div>
                    {inBasket ? <span className="text-[10px] font-semibold text-violet-500">Added</span> : <Plus className="h-4 w-4 text-violet-500" />}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Scan Modal */}
      <ScanModal isOpen={showScan} onClose={() => setShowScan(false)} onResult={handleScanResult} title="Scan Product" placeholder="Enter product SKU or name..." />
    </div>
  )
}
