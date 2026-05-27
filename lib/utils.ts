import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { OrderStatus, BatchStatus, InspectionStatus } from '@/types'

// Class name utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting
export function formatDate(date: string | Date | null | undefined, pattern = 'MMM dd, yyyy'): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, pattern)
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'MMM dd, yyyy HH:mm')
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

// Currency formatting
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Number formatting
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

// Percentage formatting
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

// Status color mappings
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getBatchStatusColor(status: BatchStatus): string {
  const colors: Record<BatchStatus, string> = {
    planned: 'bg-slate-100 text-slate-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
    on_hold: 'bg-amber-100 text-amber-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getInspectionStatusColor(status: InspectionStatus): string {
  const colors: Record<InspectionStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    passed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
    on_hold: 'bg-orange-100 text-orange-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getInventoryStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-800',
    reserved: 'bg-blue-100 text-blue-800',
    quarantine: 'bg-amber-100 text-amber-800',
    expired: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Priority color
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-50 text-blue-700',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }
  return colors[priority] || 'bg-gray-100 text-gray-700'
}

// Buffer stock health color
export function getBufferHealthColor(health: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    low: 'bg-orange-100 text-orange-800',
    adequate: 'bg-blue-100 text-blue-800',
    optimal: 'bg-emerald-100 text-emerald-800',
  }
  return colors[health] || 'bg-gray-100 text-gray-800'
}

// Calculate buffer health
export function calculateBufferHealth(current: number, minimum: number, target: number): 'critical' | 'low' | 'adequate' | 'optimal' {
  const pct = target > 0 ? (current / target) * 100 : 0
  if (current <= minimum * 0.5) return 'critical'
  if (current <= minimum) return 'low'
  if (pct < 80) return 'adequate'
  return 'optimal'
}

// Truncate text
export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Generate initials from name
export function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return function (...args: Parameters<T>) {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
