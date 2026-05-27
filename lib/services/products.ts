import { supabase } from '@/lib/supabase'
import { cached, cacheDel } from '@/lib/cache'
import type { Product } from '@/types'

export async function getProducts(): Promise<Product[]> {
  return cached('products', async () => {
    const { data, error } = await supabase
      .from('cpaz_products')
      .select('*')
      .order('name')
    if (error) throw error
    return data as Product[]
  })
}

export async function createProduct(payload: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const { data, error } = await supabase
    .from('cpaz_products')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw error
  cacheDel('products', 'kpis', 'inventory-by-category')
  return data as Product
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<void> {
  const { error } = await supabase
    .from('cpaz_products')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('products', 'inventory', 'inventory-by-category', 'batches', 'inspections', 'warehouse-ops', 'jit-plans', 'buffer-stock')
}

export async function toggleProductActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase
    .from('cpaz_products')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  cacheDel('products')
}
