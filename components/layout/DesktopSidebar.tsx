'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, MapPin, Package, Layers, ShieldCheck, MessageSquare, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home',            href: '/dashboard',                 icon: LayoutDashboard },
  { label: 'Track Order',     href: '/dashboard/tracking',        icon: MapPin },
  { label: 'Place Order',     href: '/dashboard/orders',          icon: ShoppingCart },
  { label: 'Inventory',       href: '/dashboard/inventory',       icon: Package },
  { label: 'Define Batch',    href: '/dashboard/batch-build',     icon: Layers },
  { label: 'Chat to us',      href: '/dashboard/settings',        icon: MessageSquare },
  { label: 'Quality Release', href: '/dashboard/quality-release', icon: ShieldCheck },
]

export function DesktopSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex w-60 bg-white border-r border-gray-200/60 flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 az-logo rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">AZ</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900">AstraZenica</h1>
            <p className="text-[10px] text-slate-400">Supply Chain</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-violet-600' : 'text-slate-400')} />
              <span>{item.label}</span>
              {active && <span className="ml-auto h-2 w-2 rounded-full bg-violet-600" />}
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-gray-100 px-3 py-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            pathname === '/dashboard/settings'
              ? 'bg-violet-100 text-violet-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
          )}
        >
          <Settings className={cn('h-4 w-4', pathname === '/dashboard/settings' ? 'text-violet-600' : 'text-slate-400')} />
          Settings
        </Link>
      </div>
    </aside>
  )
}
