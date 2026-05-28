'use client'

import React, { useState, useEffect } from 'react'
import { Search, MapPin, Truck, CheckCircle, Clock, Package, User, ArrowLeft, ShieldCheck, Warehouse } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { OrderStatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { formatDate, formatDateTime, cn } from '@/lib/utils'
import { getOrders } from '@/lib/services/orders'
import toast from 'react-hot-toast'
import type { Order } from '@/types'

interface TrackingStep {
  label: string
  desc: string
  actor?: string
  meta?: string[]
  icon: React.ComponentType<{ className?: string }>
  status: 'completed' | 'active' | 'pending' | 'blocked'
  time?: string
}

function buildSteps(order: Order): TrackingStep[] {
  const ts = formatDateTime(order.updated_at)
  const requester = order.requester?.full_name || 'Unknown'
  const deliverBy = formatDate(order.deliver_by) || 'TBD'
  const orderValue = order.total_value ? `$${order.total_value.toLocaleString()}` : '—'

  // Maps order status → step index that is currently active
  const activeStepMap: Record<string, number> = {
    pending: 0,
    approved: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
  }
  const activeStep = activeStepMap[order.status] ?? 0

  const steps: Omit<TrackingStep, 'status' | 'time'>[] = [
    { label: 'Order Placed', desc: 'Submitted & awaiting approval', actor: requester, meta: [`Priority: ${order.priority}`, `Deliver by: ${deliverBy}`, `Value: ${orderValue}`], icon: Package },
    { label: 'Approved & Picking', desc: 'Order approved, items being picked from warehouse', actor: requester, meta: undefined, icon: User },
    { label: 'Quality Inspection', desc: 'QC check & certificate of analysis review', actor: undefined, meta: ['CofA verified', 'No damage reported'], icon: ShieldCheck },
    { label: 'Dispatched', desc: 'Loaded onto vehicle and dispatched', actor: undefined, meta: undefined, icon: Truck },
    { label: 'Delivered', desc: 'Order received by recipient', actor: undefined, meta: undefined, icon: CheckCircle },
  ]

  if (order.status === 'cancelled') {
    return steps.map((step, idx) => ({
      ...step,
      status: idx === 0 ? 'blocked' : 'pending' as TrackingStep['status'],
      time: idx === 0 ? ts : undefined,
    }))
  }

  return steps.map((step, idx) => ({
    ...step,
    status: (idx < activeStep ? 'completed' : idx === activeStep ? 'active' : 'pending') as TrackingStep['status'],
    time: idx <= activeStep ? ts : undefined,
  }))
}

function progressPercent(order: Order): number {
  const map: Record<string, number> = { pending: 10, approved: 30, processing: 50, shipped: 75, delivered: 100, cancelled: 0 }
  return map[order.status] ?? 0
}

export default function TrackingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getOrders()
      .then(data => { setOrders(data); if (data.length && !selectedOrder) setSelectedOrder(data[0]) })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOrders = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false
    if (!search) return true
    return o.order_number.toLowerCase().includes(search.toLowerCase()) || o.requester?.full_name?.toLowerCase().includes(search.toLowerCase())
  })

  const steps = selectedOrder ? buildSteps(selectedOrder) : []
  const progress = selectedOrder ? progressPercent(selectedOrder) : 0

  return (
    <div className="min-h-full animate-fade-in px-4 sm:px-6 py-5 space-y-4" style={{ backgroundColor:'#F7F9FC', backgroundImage:'radial-gradient(#DDE3EE 1px,transparent 1px)', backgroundSize:'24px 24px' }}>
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-6 py-4">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Track Order</h1>
        <p className="text-sm text-slate-400 mt-0.5">Live shipment status & delivery timeline</p>
      </div>

      {/* Mobile back */}
      {mobileDetail && (
        <button onClick={() => setMobileDetail(false)} className="lg:hidden flex items-center gap-1 text-xs text-violet-600 font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" /> All Orders
        </button>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['all', 'pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'pill whitespace-nowrap transition-colors',
              filter === f ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Order List */}
        <div className={cn('space-y-2', mobileDetail && 'hidden lg:block')}>
          <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-3.5 w-3.5" />} />
          <div className="space-y-1.5 max-h-[calc(100vh-260px)] overflow-y-auto">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="op-card px-3 py-2.5 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="h-3 bg-gray-200 rounded w-28" />
                    <div className="ml-auto h-3 bg-gray-100 rounded w-14" />
                  </div>
                  <div className="flex justify-between mt-2 pl-4">
                    <div className="h-2.5 bg-gray-100 rounded w-24" />
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              ))
            ) : filteredOrders.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-xs">No orders found</p>
            ) : filteredOrders.map(order => {
              const dotColor = { pending: 'dot-orange', approved: 'dot-blue', processing: 'dot-blue', shipped: 'dot-green', delivered: 'dot-green', cancelled: 'dot-red' }[order.status] || 'dot-gray'
              return (
                <div
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setMobileDetail(true) }}
                  className={cn(
                    'op-card px-3 py-2.5 cursor-pointer transition-all',
                    selectedOrder?.id === order.id ? 'border-violet-400 bg-violet-50/30' : 'hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={`dot ${dotColor}`} />
                    <span className="text-xs font-bold text-slate-800 flex-1">{order.order_number}</span>
                    <span className="text-[10px] font-semibold text-slate-400 capitalize">{order.status}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 pl-4">
                    <span className="text-[10px] text-slate-400 truncate">{order.requester?.full_name}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(order.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail + Timeline */}
        <div className={cn('lg:col-span-2 space-y-3', !mobileDetail && 'hidden lg:block')}>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="op-card px-4 py-3 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-36" />
                <div className="h-3 bg-gray-100 rounded w-48" />
                <div className="h-2 bg-gray-100 rounded-full w-full mt-3" />
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-2 bg-gray-100 rounded w-12" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="op-card px-4 py-3 space-y-4">
                <div className="h-3 bg-gray-200 rounded w-20" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-3 bg-gray-200 rounded w-28" />
                      <div className="h-2 bg-gray-100 rounded w-40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedOrder ? (
            <>
              {/* Order Info — compact */}
              <div className="op-card px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedOrder.order_number}</h2>
                    <p className="text-[11px] text-slate-400">Placed by <span className="font-semibold text-slate-600">{selectedOrder.requester?.full_name}</span></p>
                  </div>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-500">Order Progress</span>
                    <span className="text-[10px] font-bold text-slate-700">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', progress === 100 ? 'bg-emerald-500' : 'bg-blue-500')}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-slate-400">Priority</span><p className="font-semibold text-slate-700 capitalize">{selectedOrder.priority}</p></div>
                  <div><span className="text-slate-400">Deliver By</span><p className="font-semibold text-slate-700">{formatDate(selectedOrder.deliver_by) || '—'}</p></div>
                  <div><span className="text-slate-400">Value</span><p className="font-semibold text-slate-700">${selectedOrder.total_value?.toLocaleString() || '—'}</p></div>
                  <div><span className="text-slate-400">Created</span><p className="font-semibold text-slate-700">{formatDate(selectedOrder.created_at)}</p></div>
                </div>
              </div>

              {/* Timeline — dense */}
              <div className="op-card px-4 py-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Timeline</h3>
                <div className="space-y-0">
                  {steps.map((step, idx) => {
                    const dotCls = {
                      completed: 'bg-emerald-500 border-emerald-500 text-white',
                      active: 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-200',
                      pending: 'bg-white border-gray-300 text-slate-300',
                      blocked: 'bg-red-500 border-red-500 text-white',
                    }[step.status]
                    const lineCls = step.status === 'completed' ? 'bg-emerald-200' : 'bg-gray-100'
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn('h-7 w-7 rounded-full flex items-center justify-center border-2 flex-shrink-0', dotCls)}>
                            <step.icon className="h-3 w-3" />
                          </div>
                          {idx < steps.length - 1 && <div className={cn('w-0.5 flex-1 min-h-[16px]', lineCls)} />}
                        </div>
                        <div className={cn('flex-1 pb-3', step.status === 'pending' && 'opacity-40')}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              'text-xs font-bold',
                              step.status === 'completed' && 'text-slate-800',
                              step.status === 'active' && 'text-blue-700',
                              step.status === 'pending' && 'text-slate-400',
                            )}>{step.label}</span>
                            {step.status === 'active' && <span className="pill bg-blue-100 text-blue-700">Current</span>}
                            {step.time && <span className="text-[10px] text-slate-400 ml-auto">{step.time}</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                          {step.actor && <p className="text-[10px] text-slate-400 mt-0.5">By: <span className="text-violet-600 font-semibold">{step.actor}</span></p>}
                          {step.meta && step.status !== 'pending' && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {step.meta.map((m, i) => (
                                <span key={i} className="pill bg-gray-100 text-slate-600">{m}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Delivery info — compact */}
              <div className="op-card px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Delivery Route</h3>
                </div>
                <div className="h-28 bg-[#F5F7FA] rounded-lg border border-gray-200/60 flex items-center justify-center text-xs text-slate-400">
                  Connect maps API for live route tracking
                </div>
              </div>
            </>
          ) : (
            <div className="op-card flex items-center justify-center h-48 text-slate-400 text-xs">
              Select an order to view tracking
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
