'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, ScanBarcode, Keyboard, Camera, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScanModalProps {
  isOpen: boolean
  onClose: () => void
  onResult: (code: string) => void
  title?: string
  placeholder?: string
}

/**
 * Scan modal — provides two input modes:
 * 1. Camera scan (uses device camera via getUserMedia)
 * 2. Manual entry (type or paste barcode/SKU)
 *
 * For production, integrate a barcode library (e.g. @nicksrandall/react-barcode-reader or quagga2).
 * This implementation uses the device camera as a viewfinder and allows manual input.
 */
export function ScanModal({ isOpen, onClose, onResult, title = 'Scan or Enter Code', placeholder = 'Enter barcode, SKU, or order number...' }: ScanModalProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [value, setValue] = useState('')
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Start camera when mode = camera
  useEffect(() => {
    if (!isOpen || mode !== 'camera') return

    let cancelled = false

    async function startCamera() {
      try {
        setCameraError('')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch {
        setCameraError('Camera not available. Use manual entry instead.')
        setMode('manual')
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
  }, [isOpen, mode])

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [isOpen])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onResult(trimmed)
    setValue('')
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-x-3 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ScanBarcode className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setMode('manual')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
                mode === 'manual' ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/50' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Keyboard className="h-3.5 w-3.5" /> Manual Entry
            </button>
            <button
              onClick={() => setMode('camera')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors',
                mode === 'camera' ? 'text-violet-700 border-b-2 border-violet-600 bg-violet-50/50' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Camera className="h-3.5 w-3.5" /> Camera Scan
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {mode === 'manual' ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 bg-[#F5F7FA]"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!value.trim()}
                  className="w-full action-btn h-11 az-logo text-white font-bold rounded-xl text-sm disabled:opacity-40"
                >
                  Search
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Type or paste a barcode, SKU, order number, or batch ID
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cameraError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                    {cameraError}
                  </div>
                ) : (
                  <>
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      {/* Scan overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-32 border-2 border-white/60 rounded-xl relative">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-violet-400 rounded-tl" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-violet-400 rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-violet-400 rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-violet-400 rounded-br" />
                          {/* Scan line animation */}
                          <div className="absolute left-2 right-2 h-0.5 bg-violet-400 rounded-full animate-pulse" style={{ top: '50%' }} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Point camera at barcode. For production, integrate a decoder library (quagga2 / zxing).
                    </p>
                    {/* Manual fallback in camera mode */}
                    <div className="relative">
                      <input
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Or type code manually..."
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-[#F5F7FA]"
                      />
                    </div>
                    {value.trim() && (
                      <button onClick={handleSubmit} className="w-full action-btn h-10 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg text-xs">
                        Search &quot;{value.trim()}&quot;
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
