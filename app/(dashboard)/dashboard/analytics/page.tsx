'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingUp, Download, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { getMonthlyData, getOrderStatusChart, getInventoryByCategory } from '@/lib/services/analytics'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import toast from 'react-hot-toast'
import type { OrderStatusChart, CategoryChartData } from '@/types'

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'6m' | '3m' | '1m'>('6m')
  const [monthlyData, setMonthlyData] = useState<{ month: string; orders: number; revenue: number; batches: number }[]>([])
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusChart[]>([])
  const [inventoryByCategory, setInventoryByCategory] = useState<CategoryChartData[]>([])
  const [loadingMsg, setLoadingMsg] = useState('')

  const loadData = useCallback(async (msg = 'Loading analytics...') => {
    setLoadingMsg(msg)
    try {
      const [monthly, status, category] = await Promise.all([getMonthlyData(), getOrderStatusChart(), getInventoryByCategory()])
      setMonthlyData(monthly)
      setOrderStatusData(status)
      setInventoryByCategory(category)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoadingMsg('')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleRefresh() {
    cacheDel('monthly-data', 'order-status-chart', 'inventory-by-category', 'kpis', 'orders-trend')
    loadData('Refreshing analytics...')
  }

  const displayData = period === '1m'
    ? monthlyData.slice(-1)
    : period === '3m'
    ? monthlyData.slice(-3)
    : monthlyData

  const totalRevenue = displayData.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = displayData.reduce((s, d) => s + d.orders, 0)
  const totalBatches = displayData.reduce((s, d) => s + d.batches, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Supply chain performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh}>Refresh</Button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['1m', '3m', '6m'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'}`}>
                {p === '1m' ? '1 Month' : p === '3m' ? '3 Months' : '6 Months'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => toast.success('Report exported!')}>Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<TrendingUp className="h-6 w-6" />} iconBg="bg-blue-500" glass />
        <StatsCard title="Total Orders" value={totalOrders} icon={<BarChart3 className="h-6 w-6" />} iconBg="bg-purple-500" />
        <StatsCard title="Batch Runs" value={totalBatches} icon={<BarChart3 className="h-6 w-6" />} iconBg="bg-emerald-500" />
        <StatsCard title="Avg Order Value" value={formatCurrency(avgOrderValue)} icon={<TrendingUp className="h-6 w-6" />} iconBg="bg-amber-500" />
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Revenue & Orders Trend</CardTitle>
          <span className="text-xs text-slate-400">Last {period === '1m' ? '1 month' : period === '3m' ? '3 months' : '6 months'}</span>
        </CardHeader>
        {displayData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">No data for selected period</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={displayData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(value: number, name: string) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2.5} name="revenue" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} name="orders" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader><CardTitle>Inventory by Category</CardTitle></CardHeader>
          {inventoryByCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400">No inventory data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={inventoryByCategory} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(value: number) => [value, 'Products']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {inventoryByCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>Order Status Distribution</CardTitle></CardHeader>
          {orderStatusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400">No order data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderStatusData} dataKey="count" nameKey="status" cx="45%" cy="50%" outerRadius={90} innerRadius={55} paddingAngle={2}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={entry.status} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Summary Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-slate-900">Monthly Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Month', 'Orders', 'Revenue', 'Batch Runs'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-slate-400">No data yet. Orders and batches will appear here.</td></tr>
              ) : displayData.map((d) => (
                <tr key={d.month} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">{d.month}</td>
                  <td className="py-3 px-4 text-slate-600">{formatNumber(d.orders)}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{formatCurrency(d.revenue)}</td>
                  <td className="py-3 px-4 text-slate-600">{d.batches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
