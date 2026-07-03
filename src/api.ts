/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Product, OutfitCollection, AnalyticsStats } from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('cozy_cart_admin_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('cozy_cart_admin_token', token);
  } else {
    localStorage.removeItem('cozy_cart_admin_token');
  }
}

function getHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(cat: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(cat),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create category');
  }
  return res.json();
}

export async function updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(cat),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update category');
  }
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete category');
}

export interface ProductFilters {
  category?: string;
  search?: string;
  store?: string;
  badge?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

export async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        params.append(key, String(val));
      }
    });
  }
  const res = await fetch(`${API_BASE}/products?${params.toString()}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProductById(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function createProduct(prod: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(prod),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create product');
  }
  return res.json();
}

export async function updateProduct(id: string, prod: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(prod),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update product');
  }
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function duplicateProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/duplicate/${id}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to duplicate product');
  return res.json();
}

export async function recordProductClick(id: string): Promise<void> {
  fetch(`${API_BASE}/products/${id}/click`, {
    method: 'POST',
    headers: getHeaders(),
  }).catch(err => console.error('Failed to log product click', err));
}

export async function fetchCollections(): Promise<OutfitCollection[]> {
  const res = await fetch(`${API_BASE}/collections`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
}

export async function fetchCollectionBySlug(slug: string): Promise<OutfitCollection & { products: Product[] }> {
  const res = await fetch(`${API_BASE}/collections/${slug}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch collection details');
  return res.json();
}

export async function createCollection(col: Partial<OutfitCollection>): Promise<OutfitCollection> {
  const res = await fetch(`${API_BASE}/collections`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(col),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create collection');
  }
  return res.json();
}

export async function updateCollection(id: string, col: Partial<OutfitCollection>): Promise<OutfitCollection> {
  const res = await fetch(`${API_BASE}/collections/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(col),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update collection');
  }
  return res.json();
}

export async function deleteCollection(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/collections/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete collection');
}

export async function recordCollectionClick(id: string): Promise<void> {
  fetch(`${API_BASE}/collections/${id}/click`, {
    method: 'POST',
    headers: getHeaders(),
  }).catch(err => console.error('Failed to log collection click', err));
}

export async function fetchAnalytics(): Promise<AnalyticsStats> {
  const res = await fetch(`${API_BASE}/analytics`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}
