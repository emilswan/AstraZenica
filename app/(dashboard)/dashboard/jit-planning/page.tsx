'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Calendar, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { getJITPlans, createJITPlan, updateJITPlan } from '@/lib/services/jit-plans'
import { getProducts } from '@/lib/services/products'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { JITPlan, Product } from '@/types'

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-800', label: 'Pending', icon: Clock },
  in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress', icon: Clock },
  completed: { color: 'bg-emerald-100 text-emerald-800', label: 'Completed', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
}

export default function JITPlanningPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<JITPlan[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<JITPlan | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState({ status: '', actual_quantity: '' })
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    product_id: '', planned_quantity: '', planned_date: '', notes: '',
  })
  const [loadingMsg, setLoadingMsg] = useState('')

  const loadData = useCallback(async (msg = 'Loading JIT plans...') => {
    setLoadingMsg(msg)
    try {
      const [p, prods] = await Promise.all([getJITPlans(), getProducts()])
      setPlans(p); setProducts(prods)
    } catch {
      toast.error('Failed to load JIT plans')
    } finally {
      setLoadingMsg('')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleRefresh() {
    cacheDel('jit-plans', 'products')
    loadData('Refreshing JIT plans...')
  }

  const filtered = useMemo(() => plans.filter(p => {
    const matchSearch = !search ||
      p.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.product?.sku?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.status === statusFilter
    return matchSearch && matchStatus
  }), [plans, search, statusFilter])

  const stats = useMemo(() => ({
    total: plans.length,
    pending: plans.filter(p => p.status === 'pending').length,
    inProgress: plans.filter(p => p.status === 'in_progress').length,
    completed: plans.filter(p => p.status === 'completed').length,
  }), [plans])

  const handleCreate = async () => {
    if (!form.product_id || !form.planned_quantity || !form.planned_date) {
      toast.error('Please fill all required fields')
      return
    }
    if (!user) { toast.error('Not authenticated'); return }
    setSubmitting(true)
    try {
      const newPlan = await createJITPlan({
        product_id: form.product_id,
        planned_quantity: Number(form.planned_quantity),
        planned_date: form.planned_date,
        notes: form.notes || undefined,
        created_by: user.id,
      })
      setPlans(prev => [newPlan, ...prev])
      toast.success('JIT Plan created!')
      setShowCreateModal(false)
      setForm({ product_id: '', planned_quantity: '', planned_date: '', notes: '' })
    } catch {
      toast.error('Failed to create JIT plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedPlan) return
    setUpdatingId(selectedPlan.id)
    try {
      const payload: { status?: JITPlan['status']; actual_quantity?: number } = {}
      if (updateForm.status) payload.status = updateForm.status as JITPlan['status']
      if (updateForm.actual_quantity) payload.actual_quantity = Number(updateForm.actual_quantity)
      await updateJITPlan(selectedPlan.id, payload)
      setPlans(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, ...payload } : p))
      toast.success('JIT Plan updated!')
      setShowUpdateModal(false)
    } catch { toast.error('Failed to update') }
    finally { setUpdatingId(null) }
  }

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">JIT Planning</h1>
          <p className="text-slate-500 text-sm mt-0.5">Just-In-Time production scheduling</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh}>Refresh</Button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('table')} className={cn('px-3 py-2 text-sm font-medium transition-colors', view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50')}>Table</button>
            <button onClick={() => setView('cards')} className={cn('px-3 py-2 text-sm font-medium transition-colors', view === 'cards' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50')}>Cards</button>
          </div>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>New Plan</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Plans" value={stats.total} icon={<Calendar className="h-6 w-6" />} iconBg="bg-blue-500" />
        <StatsCard title="Pending" value={stats.pending} icon={<Clock className="h-6 w-6" />} iconBg="bg-amber-500" />
        <StatsCard title="In Progress" value={stats.inProgress} icon={<Clock className="h-6 w-6" />} iconBg="bg-blue-500" />
        <StatsCard title="Completed" value={stats.completed} icon={<CheckCircle className="h-6 w-6" />} iconBg="bg-emerald-500" />
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by product..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="sm:w-48">
            <Select options={[{ label: 'All Status', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} placeholder="All Status" />
          </div>
          {(search || statusFilter) && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('') }}>Clear</Button>
          )}
        </div>
      </Card>

      {view === 'table' ? (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-slate-900">JIT Plans ({filtered.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Product', 'Planned Qty', 'Actual Qty', 'Planned Date', 'Status', 'Created By', 'Notes', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">No JIT plans found</td></tr>
                ) : filtered.map((plan: JITPlan) => {
                  const cfg = statusConfig[plan.status]
                  return (
                    <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4"><p className="font-semibold text-slate-900">{plan.product?.name}</p><p className="text-xs text-slate-500">{plan.product?.sku}</p></td>
                      <td className="py-3 px-4 font-medium text-slate-800">{formatNumber(plan.planned_quantity)}</td>
                      <td className="py-3 px-4">
                        {plan.actual_quantity !== undefined
                          ? <span className={plan.actual_quantity >= plan.planned_quantity ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>{formatNumber(plan.actual_quantity)}</span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(plan.planned_date)}</td>
                      <td className="py-3 px-4"><span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.color)}>{cfg.label}</span></td>
                      <td className="py-3 px-4 text-slate-600">{plan.creator?.full_name?.split(' ')[0] || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={plan.notes || ''}>{plan.notes || '—'}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => { setSelectedPlan(plan); setUpdateForm({ status: plan.status, actual_quantity: plan.actual_quantity?.toString() || '' }); setShowUpdateModal(true) }} className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">Update</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plan: JITPlan) => {
            const cfg = statusConfig[plan.status]
            const fulfillment = plan.actual_quantity !== undefined ? Math.round((plan.actual_quantity / plan.planned_quantity) * 100) : null
            return (
              <Card key={plan.id} padding="md" hover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{plan.product?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.product?.sku}</p>
                  </div>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cfg.color)}>{cfg.label}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Planned Qty</span><span className="font-semibold text-slate-900">{formatNumber(plan.planned_quantity)}</span></div>
                  {plan.actual_quantity !== undefined && (
                    <div className="flex justify-between"><span className="text-slate-500">Actual Qty</span><span className={`font-semibold ${plan.actual_quantity >= plan.planned_quantity ? 'text-emerald-600' : 'text-amber-600'}`}>{formatNumber(plan.actual_quantity)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-slate-500">Planned Date</span><span className="text-slate-700">{formatDate(plan.planned_date)}</span></div>
                </div>
                {fulfillment !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Fulfillment</span><span className="font-semibold">{fulfillment}%</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${fulfillment >= 100 ? 'bg-emerald-500' : fulfillment >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, fulfillment)}%` }} />
                    </div>
                  </div>
                )}
                {plan.notes && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{plan.notes}</p>}
              </Card>
            )
          })}
          {filtered.length === 0 && <div className="col-span-3 text-center py-12 text-slate-400">No JIT plans found</div>}
        </div>
      )}

      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Update JIT Plan" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowUpdateModal(false)}>Cancel</Button><Button onClick={handleUpdate} disabled={!!updatingId}>{updatingId ? 'Saving…' : 'Save'}</Button></>}
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-1">{selectedPlan.product?.name}</p>
              <p className="text-xs text-slate-400">Planned: {formatNumber(selectedPlan.planned_quantity)} · {formatDate(selectedPlan.planned_date)}</p>
            </div>
            <Select label="Status" options={[{ label: 'Pending', value: 'pending' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Completed', value: 'completed' }, { label: 'Cancelled', value: 'cancelled' }]} value={updateForm.status} onChange={e => setUpdateForm({ ...updateForm, status: e.target.value })} />
            <Input label="Actual Quantity" type="number" min="0" placeholder={`Planned: ${selectedPlan.planned_quantity}`} value={updateForm.actual_quantity} onChange={e => setUpdateForm({ ...updateForm, actual_quantity: e.target.value })} />
          </div>
        )}
      </Modal>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create JIT Plan" size="md"
        footer={<><Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating…' : 'Create Plan'}</Button></>}
      >
        <div className="space-y-4">
          <Select label="Product *" options={products.map(p => ({ label: `${p.name} (${p.sku})`, value: p.id }))} placeholder="Select product" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Planned Quantity *" type="number" min="1" placeholder="e.g. 25000" value={form.planned_quantity} onChange={e => setForm({ ...form, planned_quantity: e.target.value })} />
            <Input label="Planned Date *" type="date" value={form.planned_date} onChange={e => setForm({ ...form, planned_date: e.target.value })} />
          </div>
          <Textarea label="Notes (optional)" placeholder="Planning notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
