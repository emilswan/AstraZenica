// Status color and styling constants for consistent UI across the dashboard

export const statusColors = {
  // Batch statuses
  planned: { bg: 'bg-gray-300', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
  in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  completed: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  failed: { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  on_hold: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },

  // Order statuses
  pending: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'dot-orange' },
  approved: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', dot: 'dot-blue' },
  processing: { bg: 'bg-violet-500', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', dot: 'dot-blue' },
  shipped: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'dot-green' },
  delivered: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'dot-green' },
  cancelled: { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'dot-red' },

  // Inventory stock levels
  ok: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'dot-green' },
  low: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'dot-orange' },
  critical: { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'dot-red' },
  available: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dot: 'dot-green' },
  reserved: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', dot: 'dot-blue' },
  quarantine: { bg: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'dot-red' },
}

// Feed item colors for live activity
export const feedColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
}

// Get status config with fallback to default
export function getStatusConfig(status: string | undefined) {
  return (statusColors as Record<string, any>)[status || 'pending'] || (statusColors as Record<string, any>).pending
}
