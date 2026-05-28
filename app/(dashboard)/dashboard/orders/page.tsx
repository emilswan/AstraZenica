'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Trash2, Minus, Plus, ShoppingCart, Package, ScanBarcode, AlertTriangle, FileText, Tag } from 'lucide-react'
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

const LOCATIONS = ['Lab 1', 'Lab 2', 'Ward A', 'Ward B', 'Pharmacy', 'Dispensary', 'Cold Store', 'Receiving Bay']

const categoryColors: Record<string, string> = {
  'Antibiotics': 'bg-blue-100 text-blue-700',
  'Analgesics': 'bg-emerald-100 text-emerald-700',
  'Antidiabetics': 'bg-purple-100 text-purple-700',
  'Cardiovascular': 'bg-red-100 text-red-700',
  'Gastrointestinal': 'bg-amber-100 text-amber-700',
  'Corticosteroids': 'bg-orange-100 text-orange-700',
  'Vitamins & Supplements': 'bg-green-100 text-green-700',
}

export default function PlaceOrderPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
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

  const categories = useMemo(() => [...new Set(products.map(p => p.category))].sort(), [products])

  const filteredProducts = useMemo(() => products.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const mc = !categoryFilter || p.category === categoryFilter
    return ms && mc
  }), [products, search, categoryFilter])

  function addToBasket(product: Product) {
    if (basket.find(b => b.product.id === product.id)) {
      updateQty(product.id, 1)
      return
    }
    const info = stockMap[product.id] || { stock: 0, reserved: 0 }
    setBasket(prev => [...prev, { product, quantity: 1, stock: info.stock, reserved: info.reserved, nearestExpiry: info.nearestExpiry }])
    toast.success(`${product.name} added`)
  }

  function removeItem(id: string) { setBasket(prev => prev.filter(b => b.product.id !== id)) }

  function updateQty(id: string, d: number) {
    setBasket(prev => prev.map(b => {
      if (b.product.id !== id) return b
      const available = b.stock - b.reserved
      const next = Math.max(1, b.quantity + d)
      if (d > 0 && next > available && available > 0) {
        toast.error(`Only ${available} units available`)
        return { ...b, quantity: available }
      }
      if (d > 0 && available <= 0) {
        toast.error(`${b.product.name} is out of stock`)
        return b
      }
      return { ...b, quantity: next }
    }))
  }

  const nearestExp = basket.filter(b => b.nearestExpiry).sort((a, b) => new Date(a.nearestExpiry!).getTime() - new Date(b.nearestExpiry!).getTime())[0]?.nearestExpiry
  const orderTotal = basket.reduce((s, b) => s + (b.product.unit_price || 0) * b.quantity, 0)

  function handleScanResult(code: string) {
    const product = products.find(p => p.sku.toLowerCase() === code.toLowerCase() || p.name.toLowerCase().includes(code.toLowerCase()))
    if (product) addToBasket(product)
    else toast.error(`No product found for: ${code}`)
  }

  async function handlePlace() {
    if (!basket.length) { toast.error('Add items first'); return }
    if (!user) { toast.error('Not authenticated'); return }
    setSubmitting(true)
    try {
      const itemLines = basket.map(b => `${b.product.name} (${b.product.sku}) x${b.quantity}`).join('\n')
      const notes = [deliverTo ? `Deliver to: ${deliverTo}` : '', `Items:\n${itemLines}`].filter(Boolean).join('\n\n')
      await createOrder({ requester_id: user.id, priority, deliver_by: deliverBy || undefined, notes, total_value: orderTotal })
      toast.success('Order placed successfully!')
      setBasket([]); setDeliverBy(''); setPriority('normal'); setDeliverTo('')
    } catch { toast.error('Failed to place order') }
    finally { setSubmitting(false) }
  }

  return (
    <div
      className="min-h-full animate-fade-in"
      style={{ backgroundColor: '#F7F9FC', backgroundImage: 'radial-gradient(#DDE3EE 1px,transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />

      <div className="px-4 sm:px-6 py-5 space-y-4">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Place Order</h1>
            <p className="text-sm text-slate-400 mt-0.5">Select products and submit a procurement order</p>
          </div>
          <button onClick={() => setShowScan(true)} className="action-btn h-9 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs gap-1.5">
            <ScanBarcode className="h-4 w-4" /><span className="hidden sm:inline">Scan SKU</span>
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

          {/* ── Left: Product Catalogue ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Search + filters */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F7FA] border border-gray-200 rounded-lg focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={cn('pill whitespace-nowrap text-[11px]', !categoryFilter ? 'bg-violet-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200')}
                >
                  All
                </button>
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c === categoryFilter ? '' : c)}
                    className={cn('pill whitespace-nowrap text-[11px]', categoryFilter === c ? 'bg-violet-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-gray-200')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Product list */}
            <div className="overflow-y-auto max-h-[calc(100vh-320px)] divide-y divide-gray-50">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />No products found
                </div>
              ) : filteredProducts.map(product => {
                const info = stockMap[product.id] || { stock: 0, reserved: 0 }
                const available = info.stock - info.reserved
                const inBasket = basket.find(b => b.product.id === product.id)
                const catColor = categoryColors[product.category] || 'bg-gray-100 text-slate-600'
                const isOut = available <= 0

                return (
                  <div
                    key={product.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors',
                      isOut ? 'opacity-50' : 'hover:bg-gray-50/60 cursor-pointer',
                      inBasket && 'bg-violet-50/40'
                    )}
                    onClick={() => !isOut && addToBasket(product)}
                  >
                    {/* Icon */}
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', inBasket ? 'bg-violet-100' : 'bg-[#F5F7FA]')}>
                      <Package className={cn('h-4 w-4', inBasket ? 'text-violet-500' : 'text-slate-300')} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-slate-900 truncate">{product.name}</p>
                        <span className={cn('pill text-[10px]', catColor)}>{product.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-mono">{product.sku}</span>
                        <span>·</span>
                        <span className={cn('font-semibold', isOut ? 'text-red-500' : available < 1000 ? 'text-amber-600' : 'text-emerald-600')}>
                          {isOut ? 'Out of stock' : `${formatNumber(available)} avail.`}
                        </span>
                        <span>·</span>
                        <span>${product.unit_price.toFixed(3)}/{product.unit}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {inBasket ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => updateQty(product.id, -1)} className="h-7 w-7 rounded border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-gray-100 transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-violet-700">{inBasket.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="h-7 w-7 rounded border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-gray-100 transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center border transition-colors', isOut ? 'border-gray-100 bg-gray-50' : 'border-violet-200 bg-violet-50 hover:bg-violet-100')}>
                          <Plus className={cn('h-3.5 w-3.5', isOut ? 'text-slate-300' : 'text-violet-500')} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
              <p className="text-[10px] text-slate-400">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} · click to add to order</p>
            </div>
          </div>

          {/* ── Right: Basket + Order Config ── */}
          <div className="lg:col-span-2 space-y-3">

            {/* Order config */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Order Details</h3>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as OrderPriority)} className="w-full mt-1 text-xs border border-gray-200 rounded-lg py-2 px-2.5 focus:ring-1 focus:ring-violet-500 bg-white">
                  <option value="low">Low</option>
                  <option value="normal">Standard</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Deliver By</label>
                <input type="date" value={deliverBy} onChange={e => setDeliverBy(e.target.value)} className="w-full mt-1 text-xs border border-gray-200 rounded-lg py-2 px-2.5 focus:ring-1 focus:ring-violet-500 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Deliver To</label>
                <select value={deliverTo} onChange={e => setDeliverTo(e.target.value)} className="w-full mt-1 text-xs border border-gray-200 rounded-lg py-2 px-2.5 focus:ring-1 focus:ring-violet-500 bg-white">
                  <option value="">Select location...</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Basket */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-violet-600" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Basket</h3>
                </div>
                {basket.length > 0 && (
                  <span className="pill bg-violet-100 text-violet-700 text-[11px] font-bold">{basket.length} item{basket.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {basket.length === 0 ? (
                <div className="py-10 text-center text-slate-300">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-slate-400">No items added yet</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Click a product on the left to add it</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {basket.map(item => {
                    const available = item.stock - item.reserved
                    const isLow = available > 0 && available <= 500
                    return (
                      <div key={item.product.id} className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{item.product.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                              <span className="font-mono">{item.product.sku}</span>
                              {isLow && <span className="text-amber-600 font-semibold flex items-center gap-0.5"><AlertTriangle className="h-2.5 w-2.5" />Low stock</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => updateQty(item.product.id, -1)} className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center text-slate-400 hover:bg-gray-50 transition-colors"><Minus className="h-2.5 w-2.5" /></button>
                            <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product.id, 1)} className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center text-slate-400 hover:bg-gray-50 transition-colors"><Plus className="h-2.5 w-2.5" /></button>
                            <button onClick={() => removeItem(item.product.id)} className="h-6 w-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors ml-1"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>Avail: <strong className="text-slate-600">{formatNumber(available)}</strong></span>
                          <span className="font-semibold text-slate-600">${((item.product.unit_price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Order summary */}
              {basket.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Lines</span><span className="font-semibold text-slate-700">{basket.length}</span>
                  </div>
                  {nearestExp && (
                    <div className="flex justify-between text-slate-500">
                      <span>Nearest expiry</span><span className="font-semibold text-amber-600">{formatDate(nearestExp)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700 font-bold pt-1 border-t border-gray-200 text-xs">
                    <span>Order Total</span>
                    <span className="text-emerald-700">${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Place Order button */}
            <button
              onClick={handlePlace}
              disabled={submitting || basket.length === 0}
              className="w-full action-btn h-12 az-logo text-white font-bold text-sm rounded-2xl shadow-sm disabled:opacity-50 gap-2"
            >
              {submitting ? 'Placing...' : <><ShoppingCart className="h-4 w-4" />Place Order</>}
            </button>
          </div>
        </div>
      </div>

      <ScanModal isOpen={showScan} onClose={() => setShowScan(false)} onResult={handleScanResult} title="Scan Product" placeholder="Enter product SKU or name..." />
    </div>
  )
}
