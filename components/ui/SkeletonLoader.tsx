'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn('op-card p-4 animate-pulse', className)}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  )
}

export function SkeletonKPI() {
  return (
    <div className="kpi animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-12 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-20" />
    </div>
  )
}

export function SkeletonTable({ rows = 3 }: { rows?: number }) {
  return (
    <div className="op-card divide-y divide-gray-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-3 py-3 flex items-center gap-3">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="flex-1 h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonKPI key={i} />
      ))}
    </div>
  )
}
