'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ShoppingCart, Package, MapPin, Layers, MessageSquare,
  ShieldCheck, ArrowRight, Clock, TrendingUp, Zap, Activity,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardKPIs } from '@/lib/services/analytics'
import { getOrders } from '@/lib/services/orders'
import { getInventory } from '@/lib/services/inventory'
import { timeAgo } from '@/lib/utils'
import type { KPIStats, Order, InventoryItem } from '@/types'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [kpis, setKpis] = useState<KPIStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loadError, setLoadError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const loadData = useCallback(async () => {
    setLoadError(false)
    try {
      const [k, o, inv] = await Promise.all([getDashboardKPIs(), getOrders(), getInventory()])
      setKpis(k); setOrders(o); setInventory(inv)
    } catch { setLoadError(true) }
    finally { setLoaded(true) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Derived stats
  const activeOrders  = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const lateShipments = orders.filter(o => o.deliver_by && new Date(o.deliver_by) < new Date() && !['delivered', 'cancelled'].includes(o.status)).length
  const lowStock      = inventory.filter(i => i.product && i.quantity < (i.product.reorder_point || 0)).length
  const criticalStock = inventory.filter(i => i.product && i.quantity < (i.product.min_stock || 0)).length

  const recentFeed = orders.slice(0, 6).map(o => ({
    id: o.id,
    label: o.order_number,
    detail: o.requester?.full_name || 'Unknown',
    status: o.status,
    time: timeAgo(o.updated_at || o.created_at),
  }))

  const feedDot: Record<string, string> = {
    pending: 'bg-amber-400', approved: 'bg-blue-400', processing: 'bg-violet-400',
    shipped: 'bg-emerald-400', delivered: 'bg-emerald-500', cancelled: 'bg-red-400',
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const tiles = [
    {
      label: 'Track Order',
      desc: 'Live shipment visibility',
      href: '/dashboard/tracking',
      icon: MapPin,
      from: '#1E40AF', to: '#3B82F6', light: '#EFF6FF', tag: 'Operations',
      stat: loaded ? `${activeOrders} active` : '—',
      alert: lateShipments > 0 ? `${lateShipments} delayed` : null,
      alertColor: 'text-red-500',
    },
    {
      label: 'Place Order',
      desc: 'Submit procurement requests',
      href: '/dashboard/orders',
      icon: ShoppingCart,
      from: '#0F766E', to: '#2DD4BF', light: '#F0FDFA', tag: 'Procurement',
      stat: loaded ? `${pendingOrders} pending` : '—',
      alert: null, alertColor: '',
    },
    {
      label: 'Inventory',
      desc: 'Stock levels & warehouse',
      href: '/dashboard/inventory',
      icon: Package,
      from: '#166534', to: '#4ADE80', light: '#F0FDF4', tag: 'Warehouse',
      stat: loaded ? `${inventory.length} SKUs` : '—',
      alert: criticalStock > 0 ? `${criticalStock} critical` : lowStock > 0 ? `${lowStock} low` : null,
      alertColor: criticalStock > 0 ? 'text-red-500' : 'text-amber-500',
    },
    {
      label: 'Define Batch',
      desc: 'Plan production runs',
      href: '/dashboard/batch-build',
      icon: Layers,
      from: '#4C1D95', to: '#A78BFA', light: '#F5F3FF', tag: 'Manufacturing',
      stat: loaded ? `${kpis?.activeBatches ?? 0} running` : '—',
      alert: null, alertColor: '',
    },
    {
      label: 'Chat to us',
      desc: 'Reach the support team',
      href: '/dashboard/settings',
      icon: MessageSquare,
      from: '#075985', to: '#38BDF8', light: '#F0F9FF', tag: 'Support',
      stat: 'Team online',
      alert: null, alertColor: '',
    },
    {
      label: 'Quality Release',
      desc: 'Approve & release products',
      href: '/dashboard/quality-release',
      icon: ShieldCheck,
      from: '#78350F', to: '#FCD34D', light: '#FFFBEB', tag: 'QA / QC',
      stat: loaded ? `${kpis?.pendingInspections ?? 0} pending` : '—',
      alert: (kpis?.pendingInspections ?? 0) > 0 ? 'Needs attention' : null,
      alertColor: 'text-amber-500',
    },
  ]

  const kpiCards = [
    { label: 'Active Orders',   value: loaded ? activeOrders          : undefined, icon: Activity,    color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { label: 'In Production',   value: loaded ? kpis?.activeBatches   : undefined, icon: Zap,         color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Low Stock Items', value: loaded ? lowStock               : undefined, icon: TrendingUp,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    { label: 'Delayed Orders',  value: loaded ? lateShipments         : undefined, icon: Clock,       color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100' },
  ]

  return (
    <div
      className="min-h-full"
      style={{
        backgroundColor: '#F7F9FC',
        backgroundImage: [
          'radial-gradient(circle at 0% 0%, rgba(124,58,237,0.05) 0%, transparent 45%)',
          'radial-gradient(circle at 100% 100%, rgba(14,165,233,0.04) 0%, transparent 45%)',
          'radial-gradient(#DDE3EE 1px, transparent 1px)',
        ].join(','),
        backgroundSize: '100% 100%, 100% 100%, 24px 24px',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-8 sm:px-8 sm:py-10 space-y-6">

        {/* ── Welcome hero ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{dateStr}</p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Operator'}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <p className="text-xs text-slate-500">
                  {loadError ? 'Could not connect to database' :
                   !loaded   ? 'Loading operational data...' :
                   lateShipments > 0 ? `${lateShipments} delayed shipment${lateShipments > 1 ? 's' : ''} require attention` :
                   'All systems operational'}
                </p>
              </div>
            </div>
            {/* KPI pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              {kpiCards.map(k => {
                const Icon = k.icon
                return (
                  <div key={k.label} className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl border ${k.bg} ${k.border} w-full sm:w-24`}>
                    <Icon className={`h-4 w-4 ${k.color} flex-shrink-0`} />
                    <p className={`text-lg font-extrabold leading-none ${k.color}`}>
                      {k.value === undefined ? <span className="inline-block h-5 w-7 bg-current opacity-20 rounded animate-pulse" /> : k.value}
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold text-center leading-tight">{k.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alert bar */}
          {loadError && (
            <div className="border-t border-red-100 bg-red-50 px-6 sm:px-8 py-2.5 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 flex-1">Failed to load operational data.</p>
              <button onClick={loadData} className="text-xs font-bold text-red-600 hover:underline">Retry</button>
            </div>
          )}
          {!loadError && loaded && lateShipments > 0 && (
            <div className="border-t border-amber-100 bg-amber-50 px-6 sm:px-8 py-2.5 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 flex-1 font-medium">
                {lateShipments} shipment{lateShipments > 1 ? 's are' : ' is'} past the expected delivery date.
              </p>
              <Link href="/dashboard/tracking" className="text-[11px] font-bold text-amber-700 hover:underline whitespace-nowrap">View →</Link>
            </div>
          )}
        </div>

        {/* ── Quick actions label ── */}
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Quick Actions</p>
          <div className="flex-1 h-px bg-gray-200/80" />
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
          </div>
        </div>

        {/* ── MOBILE tiles ── */}
        <div className="flex flex-col gap-2 sm:hidden">
          {tiles.map(tile => {
            const Icon = tile.icon
            return (
              <Link key={tile.label} href={tile.href} className="group block">
                <div
                  className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-3 transition-all duration-200 active:scale-[0.98]"
                  style={{ border: `1.5px solid ${tile.from}22`, boxShadow: `0 1px 8px ${tile.from}12` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${tile.from}, ${tile.to})` }}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.9} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-slate-900 leading-tight">{tile.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {!loaded ? <span className="inline-block h-3 w-12 bg-slate-200 rounded animate-pulse" /> : <span className="text-[10px] text-slate-400">{tile.stat}</span>}
                      {tile.alert && <span className={`text-[10px] font-bold ${tile.alertColor}`}>· {tile.alert}</span>}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${tile.from}12`, border: `1.5px solid ${tile.from}25` }}>
                    <ArrowRight className="h-3 w-3" style={{ color: tile.from }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── DESKTOP tiles ── */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {tiles.map(tile => {
            const Icon = tile.icon
            return (
              <Link key={tile.label} href={tile.href} className="group flex">
                <div
                  className="flex flex-col w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-xl"
                  style={{ boxShadow: `0 2px 12px ${tile.from}20`, border: `1.5px solid ${tile.from}25` }}
                >
                  {/* Gradient header */}
                  <div
                    className="relative flex flex-col justify-between p-5 lg:p-6 overflow-hidden h-32 lg:h-44 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${tile.from} 0%, ${tile.to} 100%)` }}
                  >
                    <div className="absolute -top-6 -right-6 w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute -bottom-6 -left-4 w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-black/10 pointer-events-none" />

                    {/* Tag */}
                    <div className="flex items-start justify-between relative z-10">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20 text-white/90">
                        {tile.tag}
                      </span>
                    </div>

                    {/* Live stat on gradient */}
                    <div className="relative z-10">
                      {!loaded
                        ? <span className="inline-block h-3 w-14 bg-white/30 rounded animate-pulse mb-0.5" />
                        : <p className="text-white/70 text-[10px] font-semibold mb-0.5">{tile.stat}</p>
                      }
                      {tile.alert && (
                        <p className="text-white text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" /> {tile.alert}
                        </p>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="absolute bottom-4 right-4 z-10">
                      <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                        <Icon className="h-5 w-5 lg:h-7 lg:w-7 text-white" strokeWidth={1.8} />
                      </div>
                    </div>
                  </div>

                  {/* Label body */}
                  <div className="flex items-center justify-between px-5 py-3.5 lg:py-4 flex-1"
                    style={{ background: tile.light }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] lg:text-[15px] font-extrabold text-slate-900 leading-snug">{tile.label}</p>
                      <p className="text-[10px] lg:text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tile.desc}</p>
                    </div>
                    <div
                      className="ml-3 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ background: `${tile.from}15`, border: `1.5px solid ${tile.from}30` }}
                    >
                      <ArrowRight className="h-3.5 w-3.5" style={{ color: tile.from }} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── Live Operations Feed ── */}
        {loaded && recentFeed.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Live Operations</p>
              </div>
              <Link href="/dashboard/tracking" className="text-[10px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentFeed.map(item => (
                <Link key={item.id} href="/dashboard/tracking">
                  <div className="flex items-center gap-3 px-5 sm:px-6 py-2.5 hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${feedDot[item.status] ?? 'bg-gray-300'}`} />
                    <p className="text-xs font-bold text-slate-800 w-28 flex-shrink-0 truncate">{item.label}</p>
                    <p className="text-xs text-slate-400 flex-1 truncate">{item.detail}</p>
                    <span className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">{item.status}</span>
                    <p className="text-[10px] text-slate-400 flex-shrink-0 hidden sm:block">{item.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
