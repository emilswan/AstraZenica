'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus, Search, Layers, CheckCircle, XCircle, Clock, RefreshCw,
  ChevronDown, ChevronUp, FlaskConical, Calendar, Package, User,
  ArrowRight, Beaker, ClipboardList, AlertTriangle, Cpu, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { BatchStatusBadge } from '@/components/ui/Badge'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { getBatches, createBatch, updateBatch } from '@/lib/services/batches'
import { getProducts } from '@/lib/services/products'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { DetailPanel } from '@/components/ui/DetailPanel'
import { getStatusConfig } from '@/lib/constants/status'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { Batch, BatchStatus, Product } from '@/types'

const statusColors: Record<string, string> = {
  planned: 'bg-gray-300', in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500', failed: 'bg-red-500', on_hold: 'bg-amber-500',
}

// ─── Protocol helper ────────────────────────────────────────────────────────
interface ProtocolStep { day: number; name: string; desc: string; items: { name: string; qty: string }[] }

function buildProtocol(product: Product | undefined, quantity: number, startDate: string, endDate: string): ProtocolStep[] {
  const durationDays = startDate && endDate
    ? Math.max(3, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : (quantity > 50000 ? 14 : quantity > 20000 ? 10 : 7)

  const mid = Math.round(durationDays / 2)
  const unit = product?.unit || 'units'
  const name = product?.name || 'Product'

  return [
    { day: 1, name: 'Raw Material Receipt', desc: 'Incoming inspection & weighing', items: [{ name: `${name} API`, qty: `${formatNumber(Math.round(quantity * 0.45))} ${unit}` }, { name: 'Excipients', qty: `${formatNumber(Math.round(quantity * 0.3))} g` }, { name: 'Packaging Materials', qty: `${formatNumber(quantity)} units` }] },
    { day: Math.round(durationDays * 0.25) + 1, name: 'Granulation & Mixing', desc: 'Blend API with excipients', items: [{ name: 'High-Shear Granulator', qty: '1 run' }, { name: 'Binder Solution', qty: '15 L' }, { name: 'Lubricant (MgSt)', qty: '0.5%' }] },
    { day: mid, name: 'Compression / Filling', desc: 'Tablet press or capsule fill', items: [{ name: name, qty: `${formatNumber(quantity)} ${unit}` }, { name: 'Tooling', qty: product?.category?.includes('capsule') ? '24 punches' : '16 punches' }, { name: 'Coating Solution', qty: `${Math.round(quantity / 5000)} L` }] },
    { day: Math.round(durationDays * 0.8), name: 'In-Process QC', desc: 'Dissolution, hardness, friability', items: [{ name: 'Dissolution Test', qty: '6 units' }, { name: 'Hardness Test', qty: '10 units' }, { name: 'Weight Variation', qty: '20 units' }] },
    { day: durationDays, name: 'Packaging & Release', desc: 'Primary + secondary pack, label, QA sign-off', items: [{ name: 'Blister / Bottle', qty: `${formatNumber(Math.round(quantity / 10))} packs` }, { name: 'Printed Leaflet', qty: `${formatNumber(Math.round(quantity / 10))} units` }, { name: 'Batch Record', qty: '1 set' }] },
  ]
}

// ─── Batch Card ──────────────────────────────────────────────────────────────
function BatchCard({ batch, selected, onClick }: { batch: Batch; selected: boolean; onClick: () => void }) {
  const [open, setOpen] = useState(false)
  const pct = batch.progress ?? 0

  return (
    <div className={cn('op-card overflow-hidden transition-all', selected && 'border-violet-400 shadow-sm shadow-violet-100')}>
      <div className="px-3 py-2.5 cursor-pointer" onClick={onClick}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono text-[10px] font-bold text-slate-400">{batch.batch_number}</span>
            <BatchStatusBadge status={batch.status} />
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-sm font-black text-slate-800">{formatNumber(batch.quantity)}</span>
            <span className="text-[10px] text-slate-400 ml-0.5">{batch.product?.unit}</span>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-900 truncate">{batch.product?.name}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', statusColors[batch.status] || 'bg-gray-300')} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{pct}%</span>
        </div>
        <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px] text-slate-400">
          <span>Start: <strong className="text-slate-600">{formatDate(batch.start_date) || '—'}</strong></span>
          <span>End: <strong className="text-slate-600">{formatDate(batch.end_date) || '—'}</strong></span>
        </div>
      </div>

      {/* Protocol toggle */}
      <div className="border-t border-gray-100">
        <button onClick={e => { e.stopPropagation(); setOpen(!open) }} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-slate-400 hover:bg-gray-50">
          <span>Protocol Steps</span>
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {open && (
          <div className="px-3 pb-3">
            {buildProtocol(batch.product, batch.quantity, batch.start_date || '', batch.end_date || '').map((step, idx, arr) => (
              <div key={idx} className="flex gap-2.5">
                <div className="flex flex-col items-center">
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0',
                    idx === 0 ? 'bg-violet-600 text-white' : idx === arr.length - 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-slate-600')}>
                    {step.day}
                  </div>
                  {idx < arr.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-0.5" />}
                </div>
                <div className="flex-1 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">{step.name}</span>
                    <span className="text-[10px] text-slate-400">Day {step.day}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                  {step.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[10px] mt-0.5">
                      <span className="text-slate-500">{it.name}</span>
                      <span className="text-slate-400 font-mono">{it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Define Batch Tab ────────────────────────────────────────────────────────
function DefineBatchTab({ products, onCreated }: { products: Product[]; onCreated: (b: Batch) => void }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ product_id: '', quantity: '', start_date: '', end_date: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const selectedProduct = products.find(p => p.id === form.product_id) || null
  const qty = Number(form.quantity) || 0
  const protocol = selectedProduct ? buildProtocol(selectedProduct, qty, form.start_date, form.end_date) : []

  const durationDays = form.start_date && form.end_date
    ? Math.max(0, Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))
    : null

  const estimatedValue = selectedProduct && qty ? (selectedProduct.unit_price * qty).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : null

  const handleCreate = async () => {
    if (!form.product_id || !form.quantity) { toast.error('Product and quantity are required'); return }
    if (!user) { toast.error('Not authenticated'); return }
    setSubmitting(true)
    try {
      const nb = await createBatch({
        product_id: form.product_id,
        quantity: Number(form.quantity),
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        operator_id: user.id,
        notes: form.notes || undefined,
      })
      onCreated(nb)
      toast.success(`Batch ${nb.batch_number} scheduled!`)
      setForm({ product_id: '', quantity: '', start_date: '', end_date: '', notes: '' })
    } catch { toast.error('Failed to create batch') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* ── Left: Form ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Product */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product</h3>
              <p className="text-[10px] text-slate-400">Select what to manufacture</p>
            </div>
          </div>
          <Select
            label="Product *"
            options={products.map(p => ({ label: `${p.name} (${p.sku})`, value: p.id }))}
            placeholder="Choose product..."
            value={form.product_id}
            onChange={e => setForm({ ...form, product_id: e.target.value })}
          />
          {selectedProduct && (
            <div className="mt-3 p-3 bg-violet-50 rounded-xl border border-violet-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-800">{selectedProduct.category}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Unit</span>
                <span className="font-semibold text-slate-800">{selectedProduct.unit}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Min Stock</span>
                <span className="font-semibold text-slate-800">{formatNumber(selectedProduct.min_stock)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Unit Price</span>
                <span className="font-semibold text-emerald-700">${selectedProduct.unit_price.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Country</span>
                <span className="font-semibold text-slate-800">{selectedProduct.country || '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Beaker className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Batch Size</h3>
              <p className="text-[10px] text-slate-400">Units to produce</p>
            </div>
          </div>
          <Input
            label={`Quantity * ${selectedProduct ? `(${selectedProduct.unit})` : ''}`}
            type="number"
            min="1"
            placeholder="e.g. 50000"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
          />
          {estimatedValue && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <Zap className="h-3.5 w-3.5" />
              Estimated batch value: {estimatedValue}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Schedule</h3>
              <p className="text-[10px] text-slate-400">Production window</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End Date" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
          {durationDays !== null && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
              <Clock className="h-3.5 w-3.5" />
              {durationDays} day production window
            </div>
          )}
          {form.end_date && form.start_date && new Date(form.end_date) < new Date(form.start_date) && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> End date must be after start date</p>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notes</h3>
              <p className="text-[10px] text-slate-400">Optional protocol notes</p>
            </div>
          </div>
          <Textarea
            label=""
            placeholder="e.g. Double batch run due to Q2 demand spike, extended mixing time required..."
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={submitting || !form.product_id || !form.quantity}
          className="w-full action-btn h-12 az-logo text-white font-bold rounded-2xl shadow-sm disabled:opacity-50 text-sm gap-2"
        >
          {submitting ? 'Scheduling...' : <><Plus className="h-4 w-4" />Schedule Batch</>}
        </button>
      </div>

      {/* ── Right: Preview ── */}
      <div className="lg:col-span-3 space-y-4">
        {/* Batch Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-violet-600" />Batch Preview
          </h3>
          {!selectedProduct && !qty ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
              <FlaskConical className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-medium text-slate-400">Select a product and quantity</p>
              <p className="text-xs text-slate-300 mt-1">Preview will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Product', value: selectedProduct?.name || '—', sub: selectedProduct?.sku },
                  { label: 'Quantity', value: qty ? `${formatNumber(qty)} ${selectedProduct?.unit || ''}` : '—', sub: selectedProduct?.category },
                  { label: 'Duration', value: durationDays !== null ? `${durationDays} days` : '—', sub: form.start_date ? `From ${formatDate(form.start_date)}` : undefined },
                  { label: 'Est. Value', value: estimatedValue || '—', sub: 'at unit price' },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.label}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{item.value}</p>
                    {item.sub && <p className="text-[10px] text-slate-400 truncate">{item.sub}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Protocol Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-600" />Production Protocol
          </h3>
          {protocol.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
              <ClipboardList className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-xs text-slate-400">Select a product to see the protocol</p>
            </div>
          ) : (
            <div className="space-y-0">
              {protocol.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-2',
                      idx === 0 ? 'bg-violet-600 border-violet-600 text-white' :
                      idx === protocol.length - 1 ? 'bg-emerald-500 border-emerald-500 text-white' :
                      'bg-white border-gray-200 text-slate-500'
                    )}>
                      {idx === protocol.length - 1 ? <CheckCircle className="h-4 w-4" /> : step.day}
                    </div>
                    {idx < protocol.length - 1 && <div className="w-0.5 flex-1 min-h-[20px] bg-gray-100 my-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-800">{step.name}</span>
                      <span className="pill bg-gray-100 text-slate-500 text-[10px]">Day {step.day}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{step.desc}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {step.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5 text-[11px]">
                          <span className="text-slate-500 truncate mr-1">{item.name}</span>
                          <span className="text-slate-700 font-mono font-semibold flex-shrink-0">{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function BatchBuildPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Batch | null>(null)
  const [tab, setTab] = useState<'batches' | 'define'>('batches')
  const [loadingMsg, setLoadingMsg] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingMsg('Refreshing...')
    try { const [b, p] = await Promise.all([getBatches(), getProducts()]); setBatches(b); setProducts(p) }
    catch { toast.error('Failed to load') } finally { setLoadingMsg('') }
  }, [])

  useEffect(() => { loadData(false) }, [loadData])
  function handleRefresh() { cacheDel('batches', 'products', 'kpis'); loadData(true) }

  const filtered = useMemo(() => batches.filter(b => {
    const ms = !search || b.batch_number.toLowerCase().includes(search.toLowerCase()) || b.product?.name?.toLowerCase().includes(search.toLowerCase())
    return ms && (!statusFilter || b.status === statusFilter)
  }), [batches, search, statusFilter])

  const stats = useMemo(() => ({
    total: batches.length,
    active: batches.filter(b => b.status === 'in_progress').length,
    done: batches.filter(b => b.status === 'completed').length,
    failed: batches.filter(b => b.status === 'failed').length,
  }), [batches])

  async function handleUpdateStatus(batch: Batch, status: BatchStatus) {
    setUpdatingId(batch.id)
    try {
      await updateBatch(batch.id, { status, progress: status === 'completed' ? 100 : status === 'in_progress' ? Math.max(batch.progress ?? 0, 5) : batch.progress })
      setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, status, progress: status === 'completed' ? 100 : b.progress } : b))
      setSelected(prev => prev?.id === batch.id ? { ...prev, status, progress: status === 'completed' ? 100 : prev.progress } : prev)
      toast.success(`Status updated to ${status.replace('_', ' ')}`)
    } catch { toast.error('Failed to update') }
    finally { setUpdatingId(null) }
  }

  async function handleUpdateProgress(batch: Batch, progress: number) {
    setUpdatingId(batch.id)
    try {
      await updateBatch(batch.id, { progress })
      setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, progress } : b))
      setSelected(prev => prev?.id === batch.id ? { ...prev, progress } : prev)
      toast.success('Progress updated')
    } catch { toast.error('Failed') }
    finally { setUpdatingId(null) }
  }

  return (
    <div className="min-h-full animate-fade-in" style={{ backgroundColor: '#F7F9FC', backgroundImage: 'radial-gradient(#DDE3EE 1px,transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="px-4 sm:px-6 py-5 space-y-4">
        <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Batch Build</h1>
            <p className="text-sm text-slate-400 mt-0.5">Production scheduling & protocol management</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="action-btn h-9 w-9 text-slate-500 hover:bg-gray-100 rounded-lg border border-gray-200"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={() => setTab('define')} className="action-btn h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs gap-1.5">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Define Batch</span>
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-100' },
            { label: 'Active', value: stats.active, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Completed', value: stats.done, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Failed', value: stats.failed, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          ].map(k => (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl px-4 py-3 text-center`}>
              <p className={`text-2xl font-extrabold ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[
            { key: 'batches', label: 'Active Batches', icon: Layers },
            { key: 'define', label: 'Define Batch', icon: Plus },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'batches' | 'define')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
                tab === t.key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>

        {tab === 'batches' ? (
          <>
            {/* Filters */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input placeholder="Search batch or product..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-violet-500" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 bg-white">
                <option value="">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_progress">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="on_hold">On Hold</option>
              </select>
              {(search || statusFilter) && (
                <button onClick={() => { setSearch(''); setStatusFilter('') }} className="text-xs text-slate-500 hover:text-violet-600 font-semibold px-2 border border-gray-200 rounded-lg bg-white">Clear</button>
              )}
            </div>

            {/* Grid + Detail */}
            <div className="flex gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                {filtered.map(batch => (
                  <BatchCard key={batch.id} batch={batch} selected={selected?.id === batch.id} onClick={() => setSelected(batch)} />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                    <Layers className="h-8 w-8 mx-auto mb-1 opacity-20" />No batches found
                  </div>
                )}
              </div>

              {/* Detail Panel */}
              {selected && (
                <DetailPanel isOpen={!!selected} title={`Batch ${selected.batch_number}`} subtitle={selected.product?.name} onClose={() => setSelected(null)}>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(['planned', 'in_progress', 'completed', 'failed', 'on_hold'] as BatchStatus[]).map(s => (
                          <button
                            key={s}
                            disabled={selected.status === s || !!updatingId}
                            onClick={() => handleUpdateStatus(selected, s)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all',
                              selected.status === s
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-slate-500 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                            )}
                          >
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Progress ({selected.progress ?? 0}%)</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', statusColors[selected.status])} style={{ width: `${selected.progress ?? 0}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {[0, 10, 25, 50, 75, 90, 100].map(p => (
                          <button
                            key={p}
                            onClick={() => handleUpdateProgress(selected, p)}
                            disabled={!!updatingId}
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-semibold border transition-all',
                              (selected.progress ?? 0) === p
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-slate-500 border-gray-200 hover:border-violet-300'
                            )}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Product</p>
                      <p className="text-sm font-semibold text-slate-900">{selected.product?.name}</p>
                      <p className="text-xs text-slate-400">{selected.product?.sku} · {selected.product?.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Quantity</p>
                      <p className="text-lg font-bold text-violet-600">{formatNumber(selected.quantity)} {selected.product?.unit}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Operator</p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center">
                          <User className="h-3 w-3 text-violet-600" />
                        </div>
                        <span className="text-sm text-slate-700">{selected.operator?.full_name || '—'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Start Date</p>
                        <p className="text-sm text-slate-700">{formatDate(selected.start_date) || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">End Date</p>
                        <p className="text-sm text-slate-700">{formatDate(selected.end_date) || '—'}</p>
                      </div>
                    </div>
                    {selected.notes && (
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Notes</p>
                        <p className="text-xs text-slate-700 bg-gray-50 rounded-lg p-2">{selected.notes}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <button
                        onClick={() => { setTab('define') }}
                        className="w-full action-btn h-9 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-xs gap-1.5 font-semibold"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />Define New Batch
                      </button>
                    </div>
                  </div>
                </DetailPanel>
              )}
            </div>
          </>
        ) : (
          <DefineBatchTab
            products={products}
            onCreated={nb => { setBatches(prev => [nb, ...prev]); setTab('batches') }}
          />
        )}
      </div>
    </div>
  )
}
