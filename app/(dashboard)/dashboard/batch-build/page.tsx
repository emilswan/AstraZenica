'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Layers, CheckCircle, XCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { BatchStatusBadge } from '@/components/ui/Badge'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { getBatches, createBatch } from '@/lib/services/batches'
import { getProducts } from '@/lib/services/products'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { DetailPanel } from '@/components/ui/DetailPanel'
import { getStatusConfig } from '@/lib/constants/status'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { Batch, Product } from '@/types'

interface ProtocolDay { day: number; name: string; items: { name: string; qty: string }[] }

function getProtocol(batch: Batch): ProtocolDay[] {
  return [
    { day: 1, name: 'Plasmid Production', items: [{ name: batch.product?.name || 'Component A', qty: `${formatNumber(Math.round(batch.quantity * 0.4))} ${batch.product?.unit || 'units'}` }, { name: 'DMEM Medium', qty: '500 mL' }, { name: 'T25 EasyFlask', qty: '8 units' }] },
    { day: 2, name: 'Reagent Protocol', items: [{ name: 'Opti-Mem Medium', qty: '500 µL' }, { name: 'Lipofectamine 3000', qty: '40 µL' }, { name: 'Nunc 96 Well', qty: '5 Units' }] },
    { day: batch.quantity > 5000 ? 5 : 3, name: 'Transfection', items: [{ name: batch.product?.name || 'Final', qty: `${formatNumber(batch.quantity)} ${batch.product?.unit || 'units'}` }, { name: 'Resuspension Buffer', qty: '50 mL' }] },
  ]
}

const statusColors: Record<string, string> = { planned: 'bg-gray-300', in_progress: 'bg-blue-500', completed: 'bg-emerald-500', failed: 'bg-red-500', on_hold: 'bg-amber-500' }

function BatchCard({ batch, onClick }: { batch: Batch; onClick: () => void }) {
  const [open, setOpen] = useState(false)
  const protocol = getProtocol(batch)
  const pct = batch.progress ?? 0

  return (
    <div className="op-card overflow-hidden">
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
        {batch.status !== 'planned' && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${statusColors[batch.status]}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{pct}%</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px] text-slate-400">
          <span>Start: <strong className="text-slate-600">{formatDate(batch.start_date) || '—'}</strong></span>
          <span>End: <strong className="text-slate-600">{formatDate(batch.end_date) || '—'}</strong></span>
        </div>
      </div>

      {/* Protocol toggle */}
      <div className="border-t border-gray-100">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-slate-400 hover:bg-gray-50">
          <span>Protocol</span>
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {open && (
          <div className="px-3 pb-3">
            {protocol.map((day, idx) => (
              <div key={idx} className="flex gap-2.5">
                <div className="flex flex-col items-center">
                  <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0', idx === 0 ? 'bg-violet-600 text-white' : idx === protocol.length - 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-slate-600')}>{day.day}</div>
                  {idx < protocol.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-0.5" />}
                </div>
                <div className="flex-1 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">{day.name}</span>
                    <span className="text-[10px] text-slate-400">Day {day.day}</span>
                  </div>
                  {day.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[10px] mt-0.5">
                      <span className="text-slate-500">{it.name}</span>
                      <span className="text-slate-400 font-mono">{it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2.5 mt-1">
              <div className="h-6 w-6 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0"><CheckCircle className="h-3 w-3 text-slate-400" /></div>
              <span className="text-[10px] text-slate-400 font-semibold pt-1">Batch Ends</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BatchBuildPage() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Batch | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ product_id: '', quantity: '', start_date: '', end_date: '', notes: '' })
  const [loadingMsg, setLoadingMsg] = useState('')

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingMsg('Refreshing...')
    try { const [b, p] = await Promise.all([getBatches(), getProducts()]); setBatches(b); setProducts(p) }
    catch { toast.error('Failed') } finally { setLoadingMsg('') }
  }, [])

  useEffect(() => { loadData(false) }, [loadData])
  function handleRefresh() { cacheDel('batches', 'products', 'kpis'); loadData(true) }

  const filtered = useMemo(() => batches.filter(b => {
    const ms = !search || b.batch_number.toLowerCase().includes(search.toLowerCase()) || b.product?.name?.toLowerCase().includes(search.toLowerCase())
    return ms && (!statusFilter || b.status === statusFilter)
  }), [batches, search, statusFilter])

  const stats = useMemo(() => ({ total: batches.length, active: batches.filter(b => b.status === 'in_progress').length, done: batches.filter(b => b.status === 'completed').length, failed: batches.filter(b => b.status === 'failed').length }), [batches])

  const handleCreate = async () => {
    if (!form.product_id || !form.quantity) { toast.error('Fill required fields'); return }
    setSubmitting(true)
    try {
      const nb = await createBatch({ product_id: form.product_id, quantity: Number(form.quantity), start_date: form.start_date || undefined, end_date: form.end_date || undefined, operator_id: user?.id, notes: form.notes || undefined })
      setBatches(prev => [nb, ...prev]); toast.success('Created!'); setShowCreate(false)
      setForm({ product_id: '', quantity: '', start_date: '', end_date: '', notes: '' })
    } catch { toast.error('Failed') } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-full animate-fade-in" style={{ backgroundColor:'#F7F9FC', backgroundImage:'radial-gradient(#DDE3EE 1px,transparent 1px)', backgroundSize:'24px 24px' }}>
      <div className="px-4 sm:px-6 py-5 space-y-4">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Batch Build</h1>
          <p className="text-sm text-slate-400 mt-0.5">Day-by-day protocols & production tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="action-btn h-9 w-9 text-slate-500 hover:bg-gray-100 rounded-lg border border-gray-200"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowCreate(true)} className="action-btn h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs gap-1.5"><Plus className="h-4 w-4" /><span className="hidden sm:inline">New Batch</span></button>
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

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input placeholder="Search batch or product..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-violet-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 bg-white">
          <option value="">All</option>
          <option value="planned">Planned</option>
          <option value="in_progress">Active</option>
          <option value="completed">Done</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Two-column layout: Grid + Detail Panel */}
      <div className="flex gap-3">
        {/* Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(batch => <BatchCard key={batch.id} batch={batch} onClick={() => setSelected(batch)} />)}
          {filtered.length === 0 && <div className="col-span-2 py-12 text-center text-slate-400 text-xs"><Layers className="h-8 w-8 mx-auto mb-1 opacity-20" />No batches</div>}
        </div>

        {/* Detail Panel */}
        {selected && (
          <DetailPanel
            isOpen={!!selected}
            title={`Batch ${selected.batch_number}`}
            subtitle={selected.product?.name}
            onClose={() => setSelected(null)}
          >
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Status</p>
                <div className={cn('inline-block px-3 py-1.5 rounded-lg text-xs font-semibold', getStatusConfig(selected.status).badge)}>
                  {selected.status.charAt(0).toUpperCase() + selected.status.slice(1).replace('_', ' ')}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Product</p>
                <p className="text-sm font-semibold text-slate-900">{selected.product?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Quantity</p>
                <p className="text-lg font-bold text-violet-600">{formatNumber(selected.quantity)} {selected.product?.unit}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Progress</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${statusColors[selected.status]}`} style={{ width: `${selected.progress ?? 0}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-10 text-right">{selected.progress ?? 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Operator</p>
                <p className="text-sm text-slate-700">{selected.operator?.full_name || '—'}</p>
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
            </div>
          </DetailPanel>
        )}
      </div>

      {/* Create */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Batch" size="md"
        footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white">{submitting ? 'Creating...' : 'Create'}</Button></>}>
        <div className="space-y-3">
          <Select label="Product *" options={products.map(p => ({ label: `${p.name} (${p.sku})`, value: p.id }))} placeholder="Select" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} />
          <Input label="Qty *" type="number" min="1" placeholder="50000" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <Textarea label="Notes" placeholder="Protocol notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      </div>{/* end inner */}
    </div>
  )
}
