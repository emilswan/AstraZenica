'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Plus, FlaskConical, Package, DollarSign, Tag, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { getProducts, createProduct } from '@/lib/services/products'
import { cacheDel } from '@/lib/cache'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import toast from 'react-hot-toast'
import type { Product } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    sku: '', name: '', description: '', category: '', unit: 'tablets',
    min_stock: '', reorder_point: '', unit_price: '', country: '',
  })

  const [loadingMsg, setLoadingMsg] = useState('')

  const loadData = useCallback(async (msg = 'Loading products...') => {
    setLoadingMsg(msg)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoadingMsg('')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  function handleRefresh() {
    cacheDel('products', 'inventory', 'inventory-by-category')
    loadData('Refreshing products...')
  }

  const categories = [...new Set(products.map(p => p.category))]

  const filtered = useMemo(() => products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.category === categoryFilter
    return matchSearch && matchCategory
  }), [products, search, categoryFilter])

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.is_active).length,
    categories: new Set(products.map(p => p.category)).size,
    avgPrice: products.length > 0 ? products.reduce((s, p) => s + p.unit_price, 0) / products.length : 0,
  }), [products])

  const handleCreate = async () => {
    if (!form.sku || !form.name || !form.category) {
      toast.error('Please fill required fields')
      return
    }
    setSubmitting(true)
    try {
      const newProduct = await createProduct({
        sku: form.sku,
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        unit: form.unit,
        min_stock: Number(form.min_stock) || 0,
        reorder_point: Number(form.reorder_point) || 0,
        unit_price: Number(form.unit_price) || 0,
        country: form.country || undefined,
        is_active: true,
      })
      setProducts(prev => [...prev, newProduct])
      toast.success('Product added to catalog!')
      setShowCreateModal(false)
      setForm({ sku: '', name: '', description: '', category: '', unit: 'tablets', min_stock: '', reorder_point: '', unit_price: '', country: '' })
    } catch {
      toast.error('Failed to add product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <LoadingOverlay visible={!!loadingMsg} message={loadingMsg} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">Product catalog with SKU, pricing, and stock parameters</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleRefresh}>Refresh</Button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn('px-3 py-2 text-sm font-medium transition-colors', viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50')}>Grid</button>
            <button onClick={() => setViewMode('table')} className={cn('px-3 py-2 text-sm font-medium transition-colors', viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-gray-50')}>Table</button>
          </div>
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Products" value={stats.total} icon={<FlaskConical className="h-6 w-6" />} iconBg="bg-blue-500" />
        <StatsCard title="Active" value={stats.active} icon={<Package className="h-6 w-6" />} iconBg="bg-emerald-500" />
        <StatsCard title="Categories" value={stats.categories} icon={<Tag className="h-6 w-6" />} iconBg="bg-purple-500" />
        <StatsCard title="Avg Unit Price" value={formatCurrency(stats.avgPrice)} icon={<DollarSign className="h-6 w-6" />} iconBg="bg-amber-500" />
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input placeholder="Search by name, SKU, or category..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4" />} />
          </div>
          <div className="sm:w-52">
            <Select options={[{ label: 'All Categories', value: '' }, ...categories.map(c => ({ label: c, value: c }))]} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} placeholder="All Categories" />
          </div>
        </div>
      </Card>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product: Product) => (
            <Card key={product.id} padding="md" hover onClick={() => setSelectedProduct(product)}>
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FlaskConical className="h-5 w-5 text-blue-600" />
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 leading-tight mb-1">{product.name}</h3>
              <p className="text-xs text-slate-500 font-mono mb-2">{product.sku}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{product.category}</span>
                {product.country && <span className="text-xs text-slate-400">{product.country}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-2 mt-2">
                <div>
                  <p className="text-slate-400">Unit Price</p>
                  <p className="font-bold text-slate-800">{formatCurrency(product.unit_price)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Min Stock</p>
                  <p className="font-bold text-slate-800">{formatNumber(product.min_stock)}</p>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <div className="col-span-4 text-center py-12 text-slate-400">No products found</div>}
        </div>
      ) : (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-slate-900">Products ({filtered.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['SKU', 'Name', 'Category', 'Unit', 'Unit Price', 'Min Stock', 'Reorder Point', 'Country', 'Status'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: Product) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedProduct(p)}>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{p.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{p.category}</span></td>
                    <td className="py-3 px-4 text-slate-600">{p.unit}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{formatCurrency(p.unit_price)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatNumber(p.min_stock)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatNumber(p.reorder_point)}</td>
                    <td className="py-3 px-4 text-slate-600">{p.country || '—'}</td>
                    <td className="py-3 px-4"><span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-slate-400">No products found</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Product" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button><Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Adding…' : 'Add Product'}</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU *" placeholder="CP-XXX-000" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
            <Input label="Product Name *" placeholder="e.g. Amoxicillin 500mg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <Textarea label="Description" placeholder="Product description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category *" placeholder="e.g. Antibiotics" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <Select label="Unit" options={[{ label: 'Tablets', value: 'tablets' }, { label: 'Capsules', value: 'capsules' }, { label: 'Vials', value: 'vials' }, { label: 'Ampoules', value: 'ampoules' }, { label: 'Bottles', value: 'bottles' }, { label: 'Units', value: 'units' }]} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Unit Price ($)" type="number" min="0" step="0.01" placeholder="0.00" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} />
            <Input label="Min Stock" type="number" min="0" placeholder="0" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} />
            <Input label="Reorder Point" type="number" min="0" placeholder="0" value={form.reorder_point} onChange={e => setForm({ ...form, reorder_point: e.target.value })} />
          </div>
          <Input label="Country of Origin" placeholder="e.g. Pakistan" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
        </div>
      </Modal>

      {selectedProduct && (
        <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={selectedProduct.name} size="md"
          footer={<Button variant="outline" onClick={() => setSelectedProduct(null)}>Close</Button>}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <FlaskConical className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedProduct.name}</h2>
                <p className="font-mono text-sm text-slate-500">{selectedProduct.sku}</p>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{selectedProduct.category}</span>
              </div>
            </div>
            {selectedProduct.description && <p className="text-sm text-slate-600 bg-gray-50 rounded-xl p-3">{selectedProduct.description}</p>}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Unit', value: selectedProduct.unit },
                { label: 'Unit Price', value: formatCurrency(selectedProduct.unit_price) },
                { label: 'Min Stock', value: formatNumber(selectedProduct.min_stock) + ' units' },
                { label: 'Reorder Point', value: formatNumber(selectedProduct.reorder_point) + ' units' },
                { label: 'Country', value: selectedProduct.country || '—' },
                { label: 'Status', value: selectedProduct.is_active ? 'Active' : 'Inactive' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
