'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Archive, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { BufferHealthBadge } from '@/components/ui/Badge'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { getBufferStock } from '@/lib/services/buffer-stock'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import toast from 'react-hot-toast'
import type { BufferStock } from '@/types'

const healthBarColor: Record<string, string> = {
  critical: 'bg-red-500',
  low: 'bg-amber-500',
  adequate: 'bg-blue-500',
  optimal: 'bg-emerald-500',
}

const healthBgColor: Record<string, string> = {
  critical: 'bg-red-50 border-red-200',
  low: 'bg-amber-50 border-amber-200',
  adequate: 'bg-blue-50 border-blue-200',
  optimal: 'bg-emerald-50 border-emerald-200',
}

export default function BufferStockPage() {
  const [bufferStock, setBufferStock] = useState<BufferStock[]>([])
  const [search, setSearch] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('')

  const loadData = useCallback(async (msg = 'Loading buffer stock...') => {
    setLoadingMsg(msg)
    try {
      const data = await getBufferStock()
      setBufferStock(data)
    } catch {
      toast.error('Failed to load buffer stock')
    } finally {
      setLoadingMsg('')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleRefresh() {
    cacheDel('buffer-stock')
    loadData('Refreshing buffer stock...')
  }

  const filtered = useMemo(() => bufferStock.filter(b => {
    const matchSearch = !search ||
      b.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.product?.sku?.toLowerCase().includes(search.toLowerCase())
    const matchHealth = !healthFilter || b.health === healthFilter
    const matchLocation = !locationFilter || b.location === locationFilter
    return matchSearch && matchHealth && matchLocation
  }), [bufferStock, search, healthFilter, locationFilter])

  const stats = useMemo(() => ({
    total: bufferStock.length,
    critical: bufferStock.filter(b => b.health === 'critical').length,
    low: bufferStock.filter(b => b.health === 'low').length,
    optimal: bufferStock.filter(b => b.health === 'optimal').length,
  }), [bufferStock])

  const locations = [...new Set(bufferStock.map(b => b.location))]

  const getStockPercent = (b: BufferStock) => Math.min(100, Math.round((b.current_level / b.target_level) * 100))

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Buffer Stock</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor safety stock levels and replenishment needs</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total SKUs" value={stats.total} icon={<Archive className="h-6 w-6" />} iconBg="bg-blue-500" />
        <StatsCard title="Critical" value={stats.critical} icon={<AlertTriangle className="h-6 w-6" />} iconBg="bg-red-500" />
        <StatsCard title="Low Stock" value={stats.low} icon={<TrendingUp className="h-6 w-6" />} iconBg="bg-amber-500" />
        <StatsCard title="Optimal" value={stats.optimal} icon={<CheckCircle className="h-6 w-6" />} iconBg="bg-emerald-500" />
      </div>

      {stats.critical > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Critical Stock Alert</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {bufferStock.filter(b => b.health === 'critical').map(b => (
              <span key={b.id} className="bg-white border border-red-200 text-red-800 text-sm rounded-lg px-3 py-1.5 font-medium">
                {b.product?.name}: {formatNumber(b.current_level)} / {formatNumber(b.minimum_level)} min
              </span>
            ))}
          </div>
        </div>
      )}

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by product..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="sm:w-48">
            <Select options={[{ label: 'All Health', value: '' }, { label: 'Critical', value: 'critical' }, { label: 'Low', value: 'low' }, { label: 'Adequate', value: 'adequate' }, { label: 'Optimal', value: 'optimal' }]} value={healthFilter} onChange={e => setHealthFilter(e.target.value)} placeholder="All Health" />
          </div>
          <div className="sm:w-48">
            <Select options={[{ label: 'All Locations', value: '' }, ...locations.map(l => ({ label: l, value: l }))]} value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="All Locations" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((b: BufferStock) => {
          const pct = getStockPercent(b)
          return (
            <Card key={b.id} padding="md" className={cn('border', healthBgColor[b.health])}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">{b.product?.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{b.product?.sku} · {b.location}</p>
                </div>
                <BufferHealthBadge health={b.health} />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500 font-medium">Current Level</span>
                    <span className="text-sm font-bold text-slate-900">{formatNumber(b.current_level)} units</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                    <div className={`h-full rounded-full transition-all duration-500 ${healthBarColor[b.health]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">Min: {formatNumber(b.minimum_level)}</span>
                    <span className="text-xs text-slate-400">{pct}%</span>
                    <span className="text-xs text-slate-400">Target: {formatNumber(b.target_level)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <p className="text-xs text-slate-400">Minimum</p>
                    <p className="text-sm font-bold text-red-600">{formatNumber(b.minimum_level)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <p className="text-xs text-slate-400">Current</p>
                    <p className={cn('text-sm font-bold', healthBarColor[b.health].replace('bg-', 'text-').replace('-500', '-600'))}>
                      {formatNumber(b.current_level)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <p className="text-xs text-slate-400">Target</p>
                    <p className="text-sm font-bold text-emerald-600">{formatNumber(b.target_level)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Last reviewed: {formatDate(b.last_reviewed) || '—'}</span>
                {b.current_level < b.minimum_level && (
                  <span className="text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />Reorder needed
                  </span>
                )}
              </div>
            </Card>
          )
        })}
        {filtered.length === 0 && <div className="col-span-2 text-center py-12 text-slate-400">No buffer stock entries found</div>}
      </div>
    </div>
  )
}
