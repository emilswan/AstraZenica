'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  MapPin,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Home',     href: '/dashboard',                 icon: LayoutDashboard },
  { label: 'Track',    href: '/dashboard/tracking',        icon: MapPin },
  { label: 'Orders',   href: '/dashboard/orders',          icon: ShoppingCart },
  { label: 'Inventory',href: '/dashboard/inventory',       icon: Package },
  { label: 'Batch',    href: '/dashboard/batch-build',     icon: Layers },
  { label: 'Quality',  href: '/dashboard/quality-release', icon: ShieldCheck },
  { label: 'Chat',     href: '/dashboard/settings',        icon: MessageSquare },
]

export function TopNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="hidden md:flex items-stretch bg-white border-b-2 border-gray-100 shadow-sm">
      {navItems.map(item => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 group',
              active
                ? 'text-violet-700'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {/* Active bottom bar */}
            <span className={cn(
              'absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full transition-all duration-200',
              active ? 'bg-violet-600' : 'bg-transparent group-hover:bg-slate-200'
            )} />

            {/* Icon with active bg dot */}
            <span className={cn(
              'flex items-center justify-center h-7 w-7 rounded-lg transition-colors duration-150',
              active ? 'bg-violet-100' : 'group-hover:bg-slate-100'
            )}>
              <item.icon className={cn('h-4 w-4', active ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600')} />
            </span>

            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 py-2 flex-1 min-w-0 transition-colors',
                active ? 'text-violet-700' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {/* Active top bar */}
              {active && (
                <span className="absolute top-0 inset-x-3 h-[2px] bg-violet-600 rounded-full" />
              )}
              {/* Active icon bg pill */}
              <span className={cn(
                'flex items-center justify-center rounded-lg w-8 h-6 transition-colors',
                active ? 'bg-violet-100' : ''
              )}>
                <item.icon className={cn('h-4 w-4', active ? 'text-violet-600' : 'text-slate-400')} />
              </span>
              <span className={cn(
                'text-[9px] font-semibold leading-none truncate max-w-full px-0.5',
                active ? 'text-violet-700' : 'text-slate-400'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Keep the old export name for backwards compat but it won't be used
export function Sidebar({ isMobileOpen, onMobileClose }: { isMobileOpen: boolean; onMobileClose: () => void }) {
  return null
}
