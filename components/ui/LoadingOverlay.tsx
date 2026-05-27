'use client'

import { LoadingSpinner } from './LoadingSpinner'

interface Props {
  visible: boolean
  message?: string
}

export function LoadingOverlay({ visible, message = 'Loading data...' }: Props) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-10 py-8 flex flex-col items-center gap-4 min-w-[260px]">
        <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
          <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
          </svg>
        </div>
        <LoadingSpinner size="md" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">{message}</p>
          <p className="text-xs text-slate-400 mt-1">Please wait...</p>
        </div>
      </div>
    </div>
  )
}
