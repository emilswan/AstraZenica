import React from 'react'
import { cn } from '@/lib/utils'
import type { OrderStatus, BatchStatus, InspectionStatus } from '@/types'
import {
  getOrderStatusColor,
  getBatchStatusColor,
  getInspectionStatusColor,
  getInventoryStatusColor,
  getPriorityColor,
  getBufferHealthColor,
} from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-blue-100 text-blue-800',
        variant === 'outline' && 'border border-current bg-transparent',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getOrderStatusColor(status))}>
      {label}
    </span>
  )
}

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const label = status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getBatchStatusColor(status))}>
      {label}
    </span>
  )
}

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  const labelMap: Record<InspectionStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    passed: 'Passed',
    failed: 'Failed',
    on_hold: 'On Hold',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getInspectionStatusColor(status))}>
      {labelMap[status]}
    </span>
  )
}

export function InventoryStatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getInventoryStatusColor(status))}>
      {label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1)
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getPriorityColor(priority))}>
      {label}
    </span>
  )
}

export function BufferHealthBadge({ health }: { health: string }) {
  const label = health.charAt(0).toUpperCase() + health.slice(1)
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getBufferHealthColor(health))}>
      {label}
    </span>
  )
}
