'use client'

import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DetailPanelProps {
  title: string
  subtitle?: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}

export function DetailPanel({ title, subtitle, isOpen, onClose, children, actions }: DetailPanelProps) {
  return (
    <div className={cn(
      'hidden lg:flex lg:flex-col border-l border-gray-200 bg-white transition-all duration-300',
      isOpen ? 'lg:w-80 lg:shadow-lg' : 'lg:w-0 lg:border-0'
    )}>
      {isOpen && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className="border-t border-gray-100 px-4 py-3">
              {actions}
            </div>
          )}
        </>
      )}
    </div>
  )
}
