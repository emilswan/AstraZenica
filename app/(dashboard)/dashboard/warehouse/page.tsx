'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Plus, Warehouse, ArrowDownCircle, ArrowUpCircle, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatNumber, timeAgo, cn } from '@/lib/utils'
import { getWarehouseOps, createWarehouseOp } from '@/lib/services/warehouse'
import { getProducts } from '@/lib/services/products'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { WarehouseOp, WarehouseOpType, Product } from '@/types'

const typeConfig: Record<WarehouseOpType, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  inbound: { label: 'Inbound', color: 'bg-emerald-100 text-emerald-800', icon: ArrowDownCircle },
  outbound: { label: 'Outbound', color: 'bg-blue-100 text-blue-800', icon: ArrowUpCircle },
  transfer: { label: 'Transfer', color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
  return: { label: 'Return', color: 'bg-amber-100 text-amber-800', icon: RotateCcw },
  adjustment: { label: 'Adjustment', color: 'bg-slate-100 text-slate-700', icon: RefreshCw },
}

const statusConfig: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

const LOCATIONS = ['Warehouse A', 'Warehouse B', 'Cold Storage', 'Production Floor', 'QC Lab', 'Receiving Dock', 'Dispatch Bay', 'Quarantine Area']

export default function WarehousePage() {
  const { user } = useAuth()
  const [ops, setOps] = useState<WarehouseOp[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: 'inbound' as WarehouseOpType,
    product_id: '', quantity: '', from_location: '', to_location: '', reference_number: '', notes: '',
  })
  const [loadingMsg, setLoadingMsg] = useState('')

  const loadData = useCallback(async (msg = 'Loading warehouse operations...') => {
    setLoadingMsg(msg)
    try {
      const [o, p] = await Promise.all([getWarehouseOps(), getProducts()])
      setOps(o); setProducts(p)
    } catch {
      toast.error('Failed to load warehouse operations')
    } finally {
      setLoadingMsg('')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleRefresh() {
    cacheDel('warehouse-ops', 'products')
    loadData('Refreshing warehouse operations...')
  }

  const filtered = useMemo(() => ops.filter(op => {
    const matchSearch = !search ||
      op.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      op.reference_number?.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || op.type === typeFilter
    const matchStatus = !statusFilter || op.status === statusFilter
    return matchSearch && matchType && matchStatus
  }), [ops, search, typeFilter, statusFilter])

  const stats = useMemo(() => ({
    total: ops.length,
    inbound: ops.filter(o => o.type === 'inbound').length,
    outbound: ops.filter(o => o.type === 'outbound').length,
    pending: ops.filter(o => o.status === 'pending').length,
  }), [ops])

  const handleCreate = async () => {
    if (!form.product_id || !form.quantity) {
      toast.error('Please fill required fields')
      return
    }
    setSubmitting(true)
    try {
      const newOp = await createWarehouseOp({
        type: form.type,
        product_id: form.product_id,
        quantity: Number(form.quantity),
        from_location: form.from_location || undefined,
        to_location: form.to_location || undefined,
        operator_id: user?.id,
        reference_number: form.reference_number || undefined,
        notes: form.notes || undefined,
      })
      setOps(prev => [newOp, ...prev])
      toast.success('Warehouse operation logged!')
      setShowCreateModal(false)
      setForm({ type: 'inbound', product_id: '', quantity: '', from_location: '', to_location: '', reference_number: '', notes: '' })
    } catch {
      toast.error('Failed to log operation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouse Operations</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track all incoming, outgoing, and internal movements</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh}>Refresh</Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>Log Operation</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Operations" value={stats.total} icon={<Warehouse className="h-6 w-6" />} iconBg="bg-blue-500" />
        <StatsCard title="Inbound" value={stats.inbound} icon={<ArrowDownCircle className="h-6 w-6" />} iconBg="bg-emerald-500" />
        <StatsCard title="Outbound" value={stats.outbound} icon={<ArrowUpCircle className="h-6 w-6" />} iconBg="bg-blue-500" />
        <StatsCard title="Pending" value={stats.pending} icon={<RefreshCw className="h-6 w-6" />} iconBg="bg-amber-500" />
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by product or reference number..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="sm:w-44">
            <Select options={[{ label: 'All Types', value: '' }, ...Object.entries(typeConfig).map(([v, c]) => ({ label: c.label, value: v }))]} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} placeholder="All Types" />
          </div>
          <div className="sm:w-44">
            <Select options={[{ label: 'All Status', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} placeholder="All Status" />
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-slate-900">Operations Log ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Type', 'Product', 'Quantity', 'From → To', 'Operator', 'Reference', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">No operations found</td></tr>
              ) : filtered.map((op: WarehouseOp) => {
                const typeCfg = typeConfig[op.type]
                return (
                  <tr key={op.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', typeCfg.color)}>
                        <typeCfg.icon className="h-3 w-3" />{typeCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4"><p className="font-medium text-slate-900">{op.product?.name}</p><p className="text-xs text-slate-500">{op.product?.sku}</p></td>
                    <td className="py-3 px-4 font-medium"><span className={op.quantity < 0 ? 'text-red-600' : 'text-slate-800'}>{op.quantity > 0 ? '+' : ''}{formatNumber(op.quantity)}</span></td>
                    <td className="py-3 px-4 text-slate-600"><span className="text-xs">{op.from_location || '—'} {op.from_location && op.to_location ? '→' : ''} {op.to_location || '—'}</span></td>
                    <td className="py-3 px-4 text-slate-600">{op.operator?.full_name?.split(' ')[0] || '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{op.reference_number || '—'}</td>
                    <td className="py-3 px-4"><span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[op.status])}>{op.status.charAt(0).toUpperCase() + op.status.slice(1).replace('_', ' ')}</span></td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{timeAgo(op.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Log Warehouse Operation" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Logging…' : 'Log Operation'}</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Operation Type *" options={Object.entries(typeConfig).map(([v, c]) => ({ label: c.label, value: v }))} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as WarehouseOpType })} />
            <Select label="Product *" options={products.map(p => ({ label: p.name, value: p.id }))} placeholder="Select product" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity *" type="number" min="1" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <Input label="Reference Number" placeholder="e.g. GRN-2024-0127" value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="From Location" options={LOCATIONS.map(l => ({ label: l, value: l }))} placeholder="Select location" value={form.from_location} onChange={e => setForm({ ...form, from_location: e.target.value })} />
            <Select label="To Location" options={LOCATIONS.map(l => ({ label: l, value: l }))} placeholder="Select location" value={form.to_location} onChange={e => setForm({ ...form, to_location: e.target.value })} />
          </div>
          <Textarea label="Notes" placeholder="Operation notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
