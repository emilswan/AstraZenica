import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'AstraZenica — Pharma Supply Chain Platform',
    template: '%s | AstraZenica',
  },
  description: 'AstraZenica Supply Chain Management System — Enterprise pharmaceutical operations, inventory, orders, batch tracking and quality control.',
  keywords: ['pharmaceutical', 'supply chain', 'inventory', 'batch management', 'AstraZenica', 'quality check', 'order tracking'],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
