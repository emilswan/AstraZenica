'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Activity, Package } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [justRegistered, setJustRegistered] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { signIn, user, loading } = useAuth()
  const router = useRouter()

  // If already authenticated, go straight to dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  // Load saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem('az_remembered_email')
    if (saved) { setEmail(saved); setRememberMe(true) }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('registered') === 'true') {
      setJustRegistered(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }
    setIsLoading(true)
    setError('')

    try {
      const { error: signInError } = await signIn({ email, password })

      if (signInError) {
        setError(signInError)
      } else {
        if (rememberMe) { localStorage.setItem('az_remembered_email', email) }
        else { localStorage.removeItem('az_remembered_email') }
        toast.success('Welcome back to AstraZenica!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — AstraZenica Branding */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <div className="hero-glass absolute inset-0" />

        {/* Decorative circles */}
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] bg-white/5 rounded-full" />
        <div className="absolute -top-24 -left-24 h-72 w-72 bg-teal-500/10 rounded-full" />
        <div className="absolute top-1/2 right-8 h-40 w-40 bg-violet-300/10 rounded-full" />

        <div className="relative z-10 flex flex-col justify-between p-14 text-white w-full">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <span className="text-white font-black text-base tracking-tight">AZ</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Astra<span className="text-violet-300">Zenica</span>
              </h1>
              <p className="text-violet-200 text-xs tracking-widest uppercase">Supply Chain Platform</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-black leading-[1.1] tracking-tight">
                Pharmaceutical
                <br />
                Supply Chain
                <br />
                <span className="text-teal-300">Excellence.</span>
              </h2>
              <p className="mt-5 text-violet-100 text-lg leading-relaxed max-w-md">
                Manage your entire pharmaceutical supply chain from a single, powerful platform.
                Real-time visibility, intelligent planning, and quality compliance at scale.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3">
              {[
                { icon: Package, label: 'Real-time inventory & stock alerts' },
                { icon: Activity, label: 'Live order tracking & timelines' },
                { icon: ShieldCheck, label: 'Built-in quality inspection & CofA' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-violet-100">
                  <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Products Managed', value: '200+' },
                { label: 'Monthly Orders', value: '1,200+' },
                { label: 'Batch Runs/Year', value: '500+' },
                { label: 'Platform Uptime', value: '99.9%' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15">
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-violet-200 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-violet-300/70 text-xs">
            &copy; {new Date().getFullYear()} AstraZenica. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="h-12 w-12 az-logo rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
              <span className="text-white font-black text-sm">AZ</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Astra<span className="text-violet-600">Zenica</span>
              </h1>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Supply Chain</p>
            </div>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-500">
              Sign in to access the AstraZenica supply chain portal
            </p>
          </div>

          {/* Success banner after signup */}
          {justRegistered && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-emerald-700">
                <strong>Account created!</strong> Sign in with your credentials to continue.
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@astrazenica.com"
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-400"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-violet-600 hover:text-violet-700 font-semibold">
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 az-logo text-white font-bold py-3.5 px-6 rounded-xl transition-opacity duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-200 hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to AstraZenica'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-violet-600 hover:text-violet-700 font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
