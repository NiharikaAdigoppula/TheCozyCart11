/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string; // Category image URL
  icon: string;  // Lucide icon name or emoji
  banner: string; // Banner image URL
  displayOrder: number;
  status: 'active' | 'inactive';
  productCount?: number;
}

export interface Product {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  images: string[]; // Multiple image URLs
  price: number;
  originalPrice: number;
  discount: number; // Discount %
  storeName: string; // Amazon, Myntra, Flipkart, Ajio, Meesho, Nykaa, etc.
  affiliateLink: string;
  category: string; // Category ID or slug
  tags: string[];
  badge: 'Trending' | 'Best Seller' | 'New' | "Editor's Pick" | 'Limited Deal' | 'Featured' | '';
  color: string;
  availableSizes: string[];
  material: string;
  brand: string;
  displayOrder: number;
  status: 'active' | 'hidden';
  clickCount: number;
  createdAt: string;
}

export interface OutfitCollection {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  productIds: string[]; // Associated products
  displayOrder: number;
  status: 'active' | 'hidden';
  clickCount: number;
  createdAt: string;
}

export interface AnalyticsStats {
  totalProducts: number;
  totalCategories: number;
  totalCollections: number;
  totalClicks: number;
  mostClickedProducts: Product[];
  recentlyAddedProducts: Product[];
}

export interface AdminUser {
  username: string;
}
