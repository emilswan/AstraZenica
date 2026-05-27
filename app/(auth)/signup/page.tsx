'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const router = useRouter()

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const validate = () => {
    if (!fullName.trim()) return 'Full name is required'
    if (!email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
    if (password.length < 6) return 'Password must be at least 6 characters'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError('')

    const { error: signUpError } = await signUp({ fullName: fullName.trim(), email, password })

    if (signUpError) {
      setError(signUpError)
      setIsLoading(false)
    } else {
      router.push('/login?registered=true')
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
                Join the
                <br />
                Supply Chain
                <br />
                <span className="text-teal-300">Portal.</span>
              </h2>
              <p className="mt-5 text-violet-100 text-lg leading-relaxed max-w-md">
                Create your account to access real-time inventory tracking, order management,
                batch operations, and quality control — all in one place.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                'Real-time inventory visibility',
                'Automated order processing',
                'Batch build tracking & protocols',
                'JIT planning & buffer stock alerts',
                'Quality check & CofA management',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-violet-100">
                  <CheckCircle2 className="h-5 w-5 text-teal-300 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-violet-300/70 text-xs">
            &copy; {new Date().getFullYear()} AstraZenica. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14 bg-gray-50">
        <div className="w-full max-w-md space-y-7">
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
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create account</h2>
            <p className="mt-2 text-slate-500">
              Fill in your details to get access to the AstraZenica portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@astrazenica.com"
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password */}
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
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-12 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full px-4 py-3 pr-12 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    passwordMismatch
                      ? 'border-red-300 focus:ring-red-500'
                      : passwordsMatch
                      ? 'border-emerald-300 focus:ring-emerald-500'
                      : 'border-gray-300 focus:ring-violet-500'
                  }`}
                  autoComplete="new-password"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {passwordsMatch && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {passwordMismatch && (
                <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="mt-1.5 text-xs text-emerald-600">Passwords match</p>
              )}
            </div>

            {/* Error */}
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 hover:text-violet-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
