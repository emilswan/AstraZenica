import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  iconBg?: string
  description?: string
  glass?: boolean
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconBg = 'bg-blue-500',
  description,
  glass,
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === 0 || change === undefined

  return (
    <div
      className={cn(
        'rounded-xl p-5 border transition-shadow duration-200 hover:shadow-md',
        glass
          ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/30 text-white'
          : 'bg-white border-gray-100 shadow-sm'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', glass ? 'text-blue-100' : 'text-slate-500')}>
            {title}
          </p>
          <p className={cn('text-2xl font-bold mt-1 tracking-tight', glass ? 'text-white' : 'text-slate-900')}>
            {value}
          </p>
          {(change !== undefined || description) && (
            <div className="mt-2 flex items-center gap-1.5">
              {change !== undefined && (
                <>
                  {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                  {isNegative && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                  {isNeutral && <Minus className="h-3.5 w-3.5 text-slate-400" />}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isPositive && 'text-emerald-600',
                      isNegative && 'text-red-600',
                      isNeutral && 'text-slate-400',
                      glass && 'text-blue-100'
                    )}
                  >
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                </>
              )}
              {changeLabel && (
                <span className={cn('text-xs', glass ? 'text-blue-200' : 'text-slate-400')}>
                  {changeLabel}
                </span>
              )}
              {description && !changeLabel && (
                <span className={cn('text-xs', glass ? 'text-blue-200' : 'text-slate-400')}>
                  {description}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={cn('p-3 rounded-xl flex-shrink-0 ml-4', glass ? 'bg-white/20' : iconBg)}>
          <div className={cn('h-6 w-6', glass ? 'text-white' : 'text-white')}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}
