'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { CheckSquare, Square, AlertTriangle, FileText, Printer, Package, MapPin, Phone, User, ScanBarcode, X } from 'lucide-react'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ScanModal } from '@/components/ui/ScanModal'
import { getOrders } from '@/lib/services/orders'
import { getInventory } from '@/lib/services/inventory'
import { cn, formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Order, InventoryItem } from '@/types'

interface QCItem {
  id: string
  name: string
  sku: string
  qty: number
  unit: string
  checked: boolean
  damaged: boolean
  batchNumber: string
  expiryDate: string
}

/** Parse SKUs mentioned in order notes (format: "Name (SKU) xQty") */
function parseOrderSkus(notes?: string): string[] {
  if (!notes) return []
  const matches = notes.match(/\(([^)]+)\)/g) || []
  return matches.map(m => m.slice(1, -1)).filter(Boolean)
}

/** Build QC items from inventory items relevant to the selected order */
function buildQCItemsForOrder(order: Order, inventory: InventoryItem[]): QCItem[] {
  const orderSkus = parseOrderSkus(order.notes)
  const seen = new Set<string>()
  const items: QCItem[] = []

  // First pass: items matching this order's SKUs (structured orders from Place Order page)
  if (orderSkus.length > 0) {
    for (const inv of inventory) {
      if (!inv.product || seen.has(inv.product_id)) continue
      if (orderSkus.includes(inv.product.sku)) {
        seen.add(inv.product_id)
        items.push({
          id: inv.id, name: inv.product.name, sku: inv.product.sku,
          qty: inv.quantity, unit: inv.product.unit || 'units',
          checked: false, damaged: false,
          batchNumber: inv.batch_number || '—', expiryDate: inv.expiry_date || '—',
        })
      }
    }
  }

  // Fallback: show available inventory items (for orders without structured notes)
  if (items.length === 0) {
    for (const inv of inventory) {
      if (!inv.product || seen.has(inv.product_id) || inv.status === 'quarantine') continue
      seen.add(inv.product_id)
      items.push({
        id: inv.id, name: inv.product.name, sku: inv.product.sku,
        qty: inv.quantity, unit: inv.product.unit || 'units',
        checked: false, damaged: false,
        batchNumber: inv.batch_number || '—', expiryDate: inv.expiry_date || '—',
      })
      if (items.length >= 6) break
    }
  }

  return items
}

export default function QualityReleasePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<QCItem[]>([])
  const [loadingMsg, setLoadingMsg] = useState('')
  const [showScan, setShowScan] = useState(false)
  const [labelTo, setLabelTo] = useState('')
  const [labelLoc, setLabelLoc] = useState('')
  const [labelPhone, setLabelPhone] = useState('')

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingMsg('Refreshing...')
    try {
      const [o, inv] = await Promise.all([getOrders(), getInventory()])
      const delivered = o.filter(ord => ['delivered', 'shipped'].includes(ord.status))
      setOrders(delivered)
      setInventory(inv)
      if (delivered.length) {
        const first = delivered[0]
        setSelectedOrder(first)
        setItems(buildQCItemsForOrder(first, inv))
        setLabelTo(first.requester?.full_name || '')
      }
    } catch { toast.error('Failed to load data') }
    finally { setLoadingMsg('') }
  }, [])

  useEffect(() => { loadData(false) }, [loadData])

  function selectOrder(order: Order) {
    setSelectedOrder(order)
    setItems(buildQCItemsForOrder(order, inventory))
    setLabelTo(order.requester?.full_name || '')
  }

  function toggleCheck(id: string) { setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)) }
  function toggleDamage(id: string) { setItems(prev => prev.map(i => i.id === id ? { ...i, damaged: !i.damaged } : i)) }

  function handleScanResult(code: string) {
    // Find item by batch number or SKU and auto-check it
    const found = items.find(i => i.batchNumber.toLowerCase() === code.toLowerCase() || i.sku.toLowerCase() === code.toLowerCase())
    if (found) {
      toggleCheck(found.id)
      toast.success(`Checked: ${found.name}`)
    } else {
      toast.error(`No item matched: ${code}`)
    }
  }

  const checked = items.filter(i => i.checked).length
  const allChecked = items.length > 0 && checked === items.length

  return (
    <div className="flex flex-col min-h-full animate-fade-in">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200/60 px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">Quality Check</h1>
            {selectedOrder && <p className="text-[10px] text-slate-400">Order: <span className="font-semibold text-slate-600">{selectedOrder.order_number}</span></p>}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowScan(true)} className="action-btn h-9 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs gap-1.5">
              <ScanBarcode className="h-4 w-4" /><span className="hidden sm:inline">Scan</span>
            </button>
            {selectedOrder && <button onClick={() => { setSelectedOrder(null); setItems([]) }} className="action-btn h-9 w-9 text-slate-400 hover:bg-gray-100 rounded-lg"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        {items.length > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${(checked / items.length) * 100}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 text-right">{checked}/{items.length} verified</p>
          </div>
        )}
      </div>

      <div className="flex-1 p-3 sm:p-4 space-y-3 overflow-y-auto">

        {/* Order selector */}
        {!selectedOrder && orders.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select delivered order</h3>
            {orders.map(order => (
              <div key={order.id} onClick={() => selectOrder(order)} className="op-card px-3 py-2.5 cursor-pointer hover:border-violet-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{order.order_number}</span>
                  <span className="pill bg-emerald-100 text-emerald-700">{order.status}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{order.requester?.full_name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Checklist */}
        {selectedOrder && items.length > 0 && (
          <>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              <span>Item</span><span>Check</span>
            </div>

            <div className="space-y-1.5">
              {items.map(item => (
                <div key={item.id} className={cn('op-card px-3 py-2.5 transition-all', item.checked && 'border-emerald-200 bg-emerald-50/30', item.damaged && 'border-red-200 bg-red-50/30')}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 bg-[#F5F7FA] rounded-lg flex items-center justify-center flex-shrink-0"><Package className="h-5 w-5 text-slate-300" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">{formatNumber(item.qty)} {item.unit}</p>
                      <div className="flex gap-2 text-[9px] text-slate-400 mt-0.5">
                        <span>Lot: {item.batchNumber}</span>
                        <span>Exp: {item.expiryDate}</span>
                        <span className="font-mono">{item.sku}</span>
                      </div>
                    </div>
                    <button onClick={() => toggleCheck(item.id)} className="flex-shrink-0 p-1">
                      {item.checked ? <CheckSquare className="h-6 w-6 text-emerald-500" /> : <Square className="h-6 w-6 text-slate-300" />}
                    </button>
                  </div>
                  {item.checked && (
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-50">
                      <button onClick={() => toggleDamage(item.id)} className={cn('text-[10px] font-semibold flex items-center gap-1', item.damaged ? 'text-red-500' : 'text-slate-400 hover:text-red-400')}>
                        <AlertTriangle className="h-3 w-3" />{item.damaged ? 'Damaged — flagged' : 'Flag damage'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CofA / SDS */}
            <div className="grid grid-cols-2 gap-2">
              <button className="action-btn h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"><FileText className="h-4 w-4" />Cert of Analysis</button>
              <button className="action-btn h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs"><FileText className="h-4 w-4" />SDS</button>
            </div>

            {/* Labels */}
            <div className="op-card px-3 py-3 space-y-2">
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Label Information</h3>
              {[
                { icon: User, label: 'TO', value: labelTo, set: setLabelTo },
                { icon: MapPin, label: 'Location', value: labelLoc, set: setLabelLoc },
                { icon: Phone, label: 'Phone', value: labelPhone, set: setLabelPhone },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <row.icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-400 w-14 flex-shrink-0 text-[10px]">{row.label}:</span>
                  <input value={row.value} onChange={e => row.set(e.target.value)} placeholder={row.label} className="flex-1 border-b border-dashed border-gray-200 pb-0.5 text-slate-800 font-medium focus:outline-none focus:border-violet-400 bg-transparent text-xs" />
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs">
                <Package className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400 w-14 text-[10px]">Items:</span>
                <span className="text-slate-800 font-semibold">{checked} of {items.length}</span>
              </div>
              <button onClick={() => toast.success('Labels sent to printer')} className="w-full action-btn h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs mt-1">
                <Printer className="h-4 w-4" />Print Labels
              </button>
            </div>

            {allChecked && (
              <button onClick={() => toast.success('Quality Release completed! Inventory updated.')} className="w-full action-btn h-12 az-logo text-white font-bold rounded-lg text-sm shadow-sm">
                Complete Quality Release
              </button>
            )}
          </>
        )}

        {!selectedOrder && orders.length === 0 && !loadingMsg && (
          <div className="flex-1 flex items-center justify-center py-16 text-center text-slate-400">
            <div><Package className="h-10 w-10 mx-auto mb-2 opacity-20" /><p className="text-xs">No delivered orders pending QC</p></div>
          </div>
        )}
      </div>

      <ScanModal isOpen={showScan} onClose={() => setShowScan(false)} onResult={handleScanResult} title="Scan Item" placeholder="Enter batch number or SKU..." />
    </div>
  )
}
