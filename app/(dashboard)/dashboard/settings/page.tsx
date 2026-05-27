'use client'

import React, { useState } from 'react'
import { User, Bell, Shield, Database, Palette, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
  ]

  const handleSave = () => {
    toast.success('Settings saved!')
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account and application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-52 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === 'profile' && (
            <>
              <Card padding="md">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Profile Information</h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xl font-bold">
                    {getInitials(profile?.full_name || 'U')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{profile?.full_name}</p>
                    <p className="text-sm text-slate-500">{profile?.email}</p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">{profile?.role} · {profile?.department}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" defaultValue={profile?.full_name || ''} placeholder="Your name" />
                  <Input label="Email" defaultValue={profile?.email || ''} type="email" placeholder="your@email.com" />
                  <Input label="Department" defaultValue={profile?.department || ''} placeholder="Your department" />
                  <Input label="Role" defaultValue={profile?.role || ''} disabled hint="Contact admin to change role" />
                </div>
              </Card>
              <div className="flex justify-end">
                <Button onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>Save Changes</Button>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card padding="md">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Low Stock Alerts', desc: 'Get notified when stock falls below minimum level', default: true },
                  { label: 'New Order Notifications', desc: 'Receive alerts for new orders requiring action', default: true },
                  { label: 'Batch Status Updates', desc: 'Updates when batch production status changes', default: false },
                  { label: 'Inspection Results', desc: 'Notifications for inspection pass/fail outcomes', default: true },
                  { label: 'Expiry Warnings', desc: 'Alerts for products expiring within 90 days', default: true },
                  { label: 'Weekly Reports', desc: 'Receive weekly supply chain performance reports', default: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSave} leftIcon={<Save className="h-4 w-4" />}>Save Preferences</Button>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card padding="md">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Security Settings</h2>
              <div className="space-y-4">
                <Input label="Current Password" type="password" placeholder="Enter current password" />
                <Input label="New Password" type="password" placeholder="Enter new password" hint="Minimum 8 characters with uppercase, number, and symbol" />
                <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900">Two-Factor Authentication</p>
                </div>
                <p className="text-xs text-blue-700 mb-3">Add an extra layer of security to your account</p>
                <Button variant="outline" size="sm">Enable 2FA</Button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSave}>Update Password</Button>
              </div>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card padding="md">
              <h2 className="text-base font-semibold text-slate-900 mb-4">System Configuration</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-slate-900 mb-1">Supabase Database</p>
                  <p className="text-xs text-slate-500 mb-2">Connection status and configuration</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs text-amber-700 font-medium">Demo Mode — Configure .env.local</span>
                  </div>
                </div>
                <Input label="Supabase Project URL" placeholder="https://your-project.supabase.co" hint="Set in .env.local as NEXT_PUBLIC_SUPABASE_URL" disabled />
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-slate-900 mb-2">App Version</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><span className="font-medium">CPAZ Version:</span> 1.0.0</div>
                    <div><span className="font-medium">Next.js:</span> 14.2.5</div>
                    <div><span className="font-medium">Supabase SDK:</span> 2.45.0</div>
                    <div><span className="font-medium">Built:</span> {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
