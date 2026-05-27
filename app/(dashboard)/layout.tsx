'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/layout/Sidebar'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { prefetchAll } from '@/lib/prefetch'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const prefetched = useRef(false)

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  // Kick off background prefetch once — does NOT block rendering
  useEffect(() => {
    if (!user || prefetched.current) return
    prefetched.current = true
    prefetchAll()
  }, [user])

  // Briefly show nothing while Supabase resolves the session from localStorage
  // This typically takes < 300ms and only happens on hard refresh
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 az-logo rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
            <span className="text-white font-black text-sm">AZ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated — redirect is already firing
  if (!user) return null

  return (
    <div className="flex h-screen bg-[#F8FAFF]">
      <DesktopSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <ErrorBoundary>
            <div className="animate-fade-in">
              {children}
            </div>
          </ErrorBoundary>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
