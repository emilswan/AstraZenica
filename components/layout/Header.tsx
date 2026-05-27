'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, LogOut, ScanBarcode, ChevronDown, Package, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, timeAgo } from '@/lib/utils'
import { ScanModal } from '@/components/ui/ScanModal'
import { getOrders } from '@/lib/services/orders'
import toast from 'react-hot-toast'
import type { Order } from '@/types'
import Link from 'next/link'

export function Header() {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showScan, setShowScan] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Order[]>([])

  // Load recent orders as notifications
  useEffect(() => {
    getOrders()
      .then(orders => setNotifications(orders.slice(0, 6)))
      .catch(() => {})
  }, [])

  const notifCount = notifications.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length

  function handleScanResult(code: string) {
    const upper = code.toUpperCase()
    if (upper.startsWith('ORD')) {
      toast.success(`Found order: ${code}`)
      router.push('/dashboard/tracking')
    } else if (upper.startsWith('BATCH') || upper.startsWith('LOT')) {
      toast.success(`Found batch: ${code}`)
      router.push('/dashboard/batch-build')
    } else {
      toast.success(`Searching inventory for: ${code}`)
      router.push('/dashboard/inventory')
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3.5 w-3.5 text-amber-500" />
      case 'processing': case 'approved': return <Package className="h-3.5 w-3.5 text-blue-500" />
      case 'shipped': return <Package className="h-3.5 w-3.5 text-violet-500" />
      case 'delivered': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
      case 'cancelled': return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
      default: return <Clock className="h-3.5 w-3.5 text-slate-400" />
    }
  }

  const statusText = (o: Order) => {
    const name = o.requester?.full_name || 'Unknown'
    switch (o.status) {
      case 'pending': return `${o.order_number} awaiting approval`
      case 'approved': return `${o.order_number} approved`
      case 'processing': return `${o.order_number} being packed`
      case 'shipped': return `${o.order_number} shipped`
      case 'delivered': return `${o.order_number} delivered to ${name}`
      case 'cancelled': return `${o.order_number} cancelled`
      default: return `${o.order_number} — ${o.status}`
    }
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200/60 h-14 flex items-center justify-between px-4 flex-shrink-0 z-30">
        {/* Left — logo */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 az-logo rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-[10px] leading-none">AZ</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-slate-800">Astra<span className="text-violet-600">Zenica</span></span>
            </div>
          </Link>
        </div>

        {/* Center — search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search order / batch / SKU / pallet..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F7FA] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 hidden lg:inline">⌘K</kbd>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowSearch(!showSearch)} className="md:hidden action-btn h-9 w-9 text-slate-500 hover:bg-gray-100 rounded-lg">
            <Search className="h-4 w-4" />
          </button>

          {/* Scan */}
          <button onClick={() => setShowScan(true)} className="action-btn h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs gap-1.5">
            <ScanBarcode className="h-4 w-4" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          {/* Notifications — functional */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative action-btn h-9 w-9 text-slate-500 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-slate-700">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <p className="px-3 py-6 text-xs text-slate-400 text-center">No notifications</p>
                    ) : notifications.map(order => (
                      <Link
                        key={order.id}
                        href="/dashboard/tracking"
                        onClick={() => setShowNotifications(false)}
                      >
                        <div className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                          {statusIcon(order.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-slate-700 leading-snug">{statusText(order)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(order.updated_at || order.created_at)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/dashboard/tracking" onClick={() => setShowNotifications(false)}>
                    <div className="px-3 py-2 text-center text-[10px] text-violet-600 font-semibold border-t border-gray-100 hover:bg-violet-50 transition-colors">
                      View all orders →
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* User */}
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-1.5 h-9 pl-1.5 pr-2 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="h-7 w-7 rounded-full az-logo flex items-center justify-center text-white text-[10px] font-bold">
                {getInitials(profile?.full_name || 'U')}
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{profile?.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{profile?.email}</p>
                  </div>
                  <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile search */}
        {showSearch && (
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 px-3 py-2 md:hidden z-20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input placeholder="Search order / batch / SKU..." className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F7FA] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" autoFocus />
            </div>
          </div>
        )}
      </header>

      <ScanModal isOpen={showScan} onClose={() => setShowScan(false)} onResult={handleScanResult} />
    </>
  )
}
