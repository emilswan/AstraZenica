'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Plus, ClipboardCheck, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { InspectionStatusBadge } from '@/components/ui/Badge'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatDate, formatDateTime, timeAgo, cn } from '@/lib/utils'
import { getInspections, createInspection, updateInspection } from '@/lib/services/inspections'
import { getProducts } from '@/lib/services/products'
import { getBatches } from '@/lib/services/batches'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { Inspection, InspectionStatus, InspectionType, Product, Batch } from '@/types'

const typeConfig: Record<InspectionType, { label: string; color: string }> = {
  incoming: { label: 'Incoming', color: 'bg-blue-100 text-blue-800' },
  in_process: { label: 'In-Process', color: 'bg-purple-100 text-purple-800' },
  final: { label: 'Final', color: 'bg-emerald-100 text-emerald-800' },
  periodic: { label: 'Periodic', color: 'bg-slate-100 text-slate-700' },
}

export default function InspectionPage() {
  const { user } = useAuth()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editFindings, setEditFindings] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    product_id: '', batch_id: '', type: 'incoming' as InspectionType, findings: '',
  })
  const [loadingMsg, setLoadingMsg] = useState('')

  const loadData = useCallback(async (msg = 'Loading inspections...') => {
    setLoadingMsg(msg)
    try {
      const [i, p, b] = await Promise.all([getInspections(), getProducts(), getBatches()])
      setInspections(i); setProducts(p); setBatches(b)
    } catch {
      toast.error('Failed to load inspections')
    } finally {
      setLoadingMsg('')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleRefresh() {
    cacheDel('inspections', 'products', 'batches', 'kpis')
    loadData('Refreshing inspections...')
  }

  const filtered = useMemo(() => inspections.filter(i => {
    const matchSearch = !search ||
      i.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.batch?.batch_number?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || i.status === statusFilter
    const matchType = !typeFilter || i.type === typeFilter
    return matchSearch && matchStatus && matchType
  }), [inspections, search, statusFilter, typeFilter])

  const stats = useMemo(() => ({
    total: inspections.length,
    pending: inspections.filter(i => ['pending', 'in_progress'].includes(i.status)).length,
    passed: inspections.filter(i => i.status === 'passed').length,
    failed: inspections.filter(i => i.status === 'failed').length,
  }), [inspections])

  const handleCreate = async () => {
    if (!form.product_id || !form.type) {
      toast.error('Please fill required fields')
      return
    }
    setSubmitting(true)
    try {
      const newInspection = await createInspection({
        product_id: form.product_id,
        batch_id: form.batch_id || undefined,
        inspector_id: user?.id,
        type: form.type,
        findings: form.findings || undefined,
      })
      setInspections(prev => [newInspection, ...prev])
      toast.success('Inspection created!')
      setShowCreateModal(false)
      setForm({ product_id: '', batch_id: '', type: 'incoming', findings: '' })
    } catch {
      toast.error('Failed to create inspection')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'on_hold': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspection</h1>
          <p className="text-slate-500 text-sm mt-0.5">Quality control inspections and findings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh}>Refresh</Button>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>New Inspection</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total" value={stats.total} icon={<ClipboardCheck className="h-6 w-6" />} iconBg="bg-blue-500" />
        <StatsCard title="Pending / Active" value={stats.pending} icon={<Clock className="h-6 w-6" />} iconBg="bg-amber-500" />
        <StatsCard title="Passed" value={stats.passed} icon={<CheckCircle className="h-6 w-6" />} iconBg="bg-emerald-500" />
        <StatsCard title="Failed" value={stats.failed} icon={<XCircle className="h-6 w-6" />} iconBg="bg-red-500" />
      </div>

      <Card padding="sm">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-slate-500">Overall Pass Rate</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%</p>
          </div>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.total > 0 ? (stats.passed / stats.total) * 100 : 0}%` }} />
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Failed</p>
            <p className="text-lg font-bold text-red-600">{stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%</p>
          </div>
        </div>
      </Card>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by product or batch..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="sm:w-44">
            <Select options={[{ label: 'All Status', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Passed', value: 'passed' }, { label: 'Failed', value: 'failed' }, { label: 'On Hold', value: 'on_hold' }]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} placeholder="All Status" />
          </div>
          <div className="sm:w-44">
            <Select options={[{ label: 'All Types', value: '' }, { label: 'Incoming', value: 'incoming' }, { label: 'In-Process', value: 'in_process' }, { label: 'Final', value: 'final' }, { label: 'Periodic', value: 'periodic' }]} value={typeFilter} onChange={e => setTypeFilter(e.target.value)} placeholder="All Types" />
          </div>
          {(search || statusFilter || typeFilter) && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter('') }}>Clear</Button>
          )}
        </div>
      </Card>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-slate-900">Inspection Queue ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Product', 'Batch', 'Type', 'Inspector', 'Status', 'Checked At', 'Created', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">No inspections found</td></tr>
              ) : filtered.map((insp: Inspection) => {
                const typeCfg = typeConfig[insp.type]
                return (
                  <tr key={insp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4"><p className="font-semibold text-slate-900">{insp.product?.name}</p><p className="text-xs text-slate-500">{insp.product?.sku}</p></td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{insp.batch?.batch_number || '—'}</td>
                    <td className="py-3 px-4"><span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', typeCfg.color)}>{typeCfg.label}</span></td>
                    <td className="py-3 px-4 text-slate-600">{insp.inspector?.full_name || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">{getStatusIcon(insp.status)}<InspectionStatusBadge status={insp.status} /></div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{insp.checked_at ? formatDateTime(insp.checked_at) : '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{timeAgo(insp.created_at)}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => { setSelectedInspection(insp); setEditFindings(insp.findings || '') }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Details</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Inspection" size="md"
        footer={<><Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</Button></>}
      >
        <div className="space-y-4">
          <Select label="Product *" options={products.map(p => ({ label: `${p.name} (${p.sku})`, value: p.id }))} placeholder="Select product" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} />
          <Select label="Batch (optional)" options={batches.map(b => ({ label: `${b.batch_number} — ${b.product?.name}`, value: b.id }))} placeholder="Select batch (optional)" value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} />
          <Select label="Inspection Type *" options={[{ label: 'Incoming', value: 'incoming' }, { label: 'In-Process', value: 'in_process' }, { label: 'Final', value: 'final' }, { label: 'Periodic', value: 'periodic' }]} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as InspectionType })} />
          <Textarea label="Initial Findings (optional)" placeholder="Describe what you observed..." value={form.findings} onChange={e => setForm({ ...form, findings: e.target.value })} />
        </div>
      </Modal>

      {selectedInspection && (
        <Modal isOpen={!!selectedInspection} onClose={() => setSelectedInspection(null)} title="Inspection Details" size="md"
          footer={
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => setSelectedInspection(null)}>Close</Button>
              <Button
                disabled={!!updatingId}
                onClick={async () => {
                  if (!selectedInspection) return
                  setUpdatingId(selectedInspection.id)
                  try {
                    await updateInspection(selectedInspection.id, {
                      findings: editFindings || undefined,
                      checked_at: ['passed', 'failed'].includes(selectedInspection.status) ? (selectedInspection.checked_at || new Date().toISOString()) : undefined,
                    })
                    setInspections(prev => prev.map(i => i.id === selectedInspection.id ? { ...i, findings: editFindings || undefined } : i))
                    toast.success('Inspection updated')
                    setSelectedInspection(null)
                  } catch { toast.error('Failed to update') }
                  finally { setUpdatingId(null) }
                }}
              >
                {updatingId ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Product', value: <><p className="mt-1 font-semibold text-slate-900">{selectedInspection.product?.name}</p><p className="text-xs text-slate-500">{selectedInspection.product?.sku}</p></> },
                { label: 'Batch', value: <p className="mt-1 font-mono text-slate-700">{selectedInspection.batch?.batch_number || '—'}</p> },
                { label: 'Type', value: <span className={cn('mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', typeConfig[selectedInspection.type].color)}>{typeConfig[selectedInspection.type].label}</span> },
                { label: 'Inspector', value: <p className="mt-1 text-slate-700">{selectedInspection.inspector?.full_name || '—'}</p> },
                { label: 'Checked At', value: <p className="mt-1 text-slate-700">{selectedInspection.checked_at ? formatDateTime(selectedInspection.checked_at) : '—'}</p> },
              ].map(item => (
                <div key={item.label}><p className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</p>{item.value}</div>
              ))}
            </div>

            {/* Status update */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-1.5">
                {(['pending', 'in_progress', 'passed', 'failed', 'on_hold'] as InspectionStatus[]).map(s => (
                  <button
                    key={s}
                    disabled={selectedInspection.status === s || !!updatingId}
                    onClick={async () => {
                      setUpdatingId(selectedInspection.id)
                      try {
                        const checkedAt = ['passed', 'failed'].includes(s) ? new Date().toISOString() : undefined
                        await updateInspection(selectedInspection.id, { status: s, checked_at: checkedAt })
                        setInspections(prev => prev.map(i => i.id === selectedInspection.id ? { ...i, status: s, checked_at: checkedAt || i.checked_at } : i))
                        setSelectedInspection(prev => prev ? { ...prev, status: s } : null)
                        toast.success(`Status → ${s.replace('_', ' ')}`)
                      } catch { toast.error('Failed') }
                      finally { setUpdatingId(null) }
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                      selectedInspection.status === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    )}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings edit */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Findings</p>
              <textarea
                value={editFindings}
                onChange={e => setEditFindings(e.target.value)}
                rows={4}
                placeholder="Enter inspection findings..."
                className="w-full text-sm text-slate-700 bg-gray-50 rounded-xl p-3 leading-relaxed border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
