/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { Category, Product, OutfitCollection } from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db_store.json');

// Preloaded beautiful category seed data
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Kurtis Under ₹999',
    slug: 'kurtis-under-999',
    description: 'Chic, premium ethnic Kurtis that are friendly on your budget.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
    icon: 'Sparkles',
    banner: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 1,
    status: 'active'
  },
  {
    id: 'cat-2',
    name: 'Tops & Tunics',
    slug: 'tops-and-tunics',
    description: 'Romantic sleeves, floral prints, and modern minimalist cuts.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600',
    icon: 'Shirt',
    banner: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 2,
    status: 'active'
  },
  {
    id: 'cat-3',
    name: 'Bottom Wear',
    slug: 'bottom-wear',
    description: 'Fluid pleated trousers, linen shorts, and structured denim.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600',
    icon: 'Layers',
    banner: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 3,
    status: 'active'
  },
  {
    id: 'cat-4',
    name: 'Office Wear',
    slug: 'office-wear',
    description: 'Tailored blazers, elegant slip skirts, and sophisticated button-downs.',
    image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=600',
    icon: 'Briefcase',
    banner: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 4,
    status: 'active'
  },
  {
    id: 'cat-5',
    name: 'Dresses',
    slug: 'dresses',
    description: 'Flowy midi dresses, summer maxis, and cozy knit dresses.',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600',
    icon: 'Heart',
    banner: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 5,
    status: 'active'
  },
  {
    id: 'cat-6',
    name: 'Handbags',
    slug: 'handbags',
    description: 'Pinterest-aesthetic shoulder bags, structured totes, and mini baguettes.',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600',
    icon: 'ShoppingBag',
    banner: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 6,
    status: 'active'
  },
  {
    id: 'cat-7',
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Lustrous drop pearls, gold stackable rings, and minimalist necklaces.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600',
    icon: 'Gem',
    banner: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 7,
    status: 'active'
  },
  {
    id: 'cat-8',
    name: 'Footwear',
    slug: 'footwear',
    description: 'Square-toe block heels, retro cream sneakers, and leather mules.',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600',
    icon: 'Compass',
    banner: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 8,
    status: 'active'
  },
  {
    id: 'cat-9',
    name: 'Home Decor',
    slug: 'home-decor',
    description: 'Ribbed ceramic vases, scented soy candles, and textured throw blankets.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600',
    icon: 'Home',
    banner: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 9,
    status: 'active'
  },
  {
    id: 'cat-10',
    name: 'Beauty',
    slug: 'beauty',
    description: 'Dewy skin tints, aesthetic lip oils, and clean herbal perfumes.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600',
    icon: 'Flame',
    banner: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=1200',
    displayOrder: 10,
    status: 'active'
  }
];

// Preloaded beautiful product seed data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Linen Belted Midi Dress in Oat',
    shortDescription: 'Elegant beige linen-blend midi dress with soft structured belt and wooden button details.',
    detailedDescription: 'Crafted from a premium linen-viscose blend, this midi dress strikes the perfect balance between casual comfort and high-end elegance. Features a deep, sophisticated beige color, structured short sleeves, dynamic wood-patterned buttons, and an adjustable tie-up belt to sculpt your silhouette. It pairs gorgeously with block-heel sandals and a vegan leather baguette bag for a perfect Pinterest daytime outfit.',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=600'
    ],
    price: 1499,
    originalPrice: 2499,
    discount: 40,
    storeName: 'Nykaa Fashion',
    affiliateLink: 'https://www.nykaa.com',
    category: 'cat-5', // Dresses
    tags: ['beige', 'linen', 'dress', 'summer', 'aesthetic'],
    badge: "Editor's Pick",
    color: 'Beige',
    availableSizes: ['S', 'M', 'L', 'XL'],
    material: 'Linen Viscose Blend',
    brand: 'The Cozy Studio',
    displayOrder: 1,
    status: 'active',
    clickCount: 124,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    title: 'Wide-Leg Tailored Pleated Trousers',
    shortDescription: 'Ultra-chic, high-waisted cream trousers with deep front pleats and fluid wide legs.',
    detailedDescription: 'These pleated trousers are a Pinterest viral staple. Designed to sit high on the waist, they feature premium draping material that moves beautifully with you. Perfect for office environments, brunches, or shopping trips. Styling tip: Wear with a cropped knit top or a classic French-tucked white linen shirt.',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&q=80&w=600'
    ],
    price: 1299,
    originalPrice: 1999,
    discount: 35,
    storeName: 'Ajio',
    affiliateLink: 'https://www.ajio.com',
    category: 'cat-3', // Bottom Wear
    tags: ['cream', 'trousers', 'pants', 'office', 'minimalist'],
    badge: 'Best Seller',
    color: 'Cream / Off-White',
    availableSizes: ['XS', 'S', 'M', 'L'],
    material: 'Premium Polyester Blend',
    brand: 'Modern Muse',
    displayOrder: 2,
    status: 'active',
    clickCount: 208,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    title: 'Puff Sleeve Romantic Lavender Blouse',
    shortDescription: 'Sweetheart lavender blouse featuring puffed sleeves and elegant keyhole back closure.',
    detailedDescription: 'Enchanting lavender cotton blouse featuring delicate puff sleeves, a gentle sweetheart collar, and a modern relaxed fit. Perfect for layering under neutral knitwear or blazers, adding a subtle lavender accent to your neutral outfits.',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600'
    ],
    price: 899,
    originalPrice: 1599,
    discount: 43,
    storeName: 'Myntra',
    affiliateLink: 'https://www.myntra.com',
    category: 'cat-2', // Tops & Tunics
    tags: ['lavender', 'blouse', 'puff-sleeve', 'romantic'],
    badge: 'New',
    color: 'Lavender Pink',
    availableSizes: ['S', 'M', 'L'],
    material: '100% Breathable Cotton',
    brand: 'Loom & Petal',
    displayOrder: 3,
    status: 'active',
    clickCount: 94,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    title: 'Vegan Leather Croc Shoulder Bag',
    shortDescription: 'Classic baguette-style handbag in luxurious warm caramel croc-embossed vegan leather.',
    detailedDescription: 'Channeling 90s minimalism, this croissant and baguette-inspired shoulder bag is structured yet tactile. Fitted with smooth gold-toned hardware, an inside zipper pouch, and a perfect shoulder strap length to nestle comfortable under your arm.',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600'
    ],
    price: 1199,
    originalPrice: 2999,
    discount: 60,
    storeName: 'Amazon',
    affiliateLink: 'https://www.amazon.in',
    category: 'cat-6', // Handbags
    tags: ['brown', 'bag', 'handbag', 'croc', 'accessories'],
    badge: 'Trending',
    color: 'Caramel Brown',
    availableSizes: ['One Size'],
    material: 'Cruelty-free Croc Embossed Vegan Leather',
    brand: 'Sol & Luna',
    displayOrder: 4,
    status: 'active',
    clickCount: 312,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    title: 'Baroque Irregular Pearl Drop Earrings',
    shortDescription: 'Lustrous irregular freshwater pearls dangling from elegant 18k gold-plated huggies.',
    detailedDescription: 'No two baroque pearls are identical, making these drop earrings beautifully unique. Made with 18k double gold plating over solid brass to prevent fading. Light enough for all-day wear and perfect for highlighting minimalist makeup look.',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600'
    ],
    price: 499,
    originalPrice: 1299,
    discount: 61,
    storeName: 'Meesho',
    affiliateLink: 'https://www.meesho.com',
    category: 'cat-7', // Jewellery
    tags: ['gold', 'pearls', 'earrings', 'jewelry', 'baroque'],
    badge: 'Limited Deal',
    color: 'Gold / Pearl White',
    availableSizes: ['One Size'],
    material: '18k Gold Plating & Freshwater Baroque Pearls',
    brand: 'Aura Fine Jewels',
    displayOrder: 5,
    status: 'active',
    clickCount: 185,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    title: 'Square-Toe Strap Block Sandals',
    shortDescription: 'Minimalist block heels in cream vegan leather with soft padded cushion soles.',
    detailedDescription: 'Featuring clean lines, a secure ankle wrap, and a sturdy 2-inch block heel, these sandals are made for floating around town. Fully padded footbeds mean zero break-in pain and endless compliments.',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600'
    ],
    price: 999,
    originalPrice: 1999,
    discount: 50,
    storeName: 'Flipkart',
    affiliateLink: 'https://www.flipkart.com',
    category: 'cat-8', // Footwear
    tags: ['sandals', 'cream', 'heels', 'shoes', 'footwear'],
    badge: 'Best Seller',
    color: 'Cream White',
    availableSizes: ['36', '37', '38', '39', '40'],
    material: 'Padded Vegan PU Leather',
    brand: 'Steps & Stones',
    displayOrder: 6,
    status: 'active',
    clickCount: 147,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-7',
    title: 'Ribbed Matte Ceramic Donut Vase',
    shortDescription: 'Contemporary off-white ribbed ceramic flower vase with a central circular hollow design.',
    detailedDescription: 'This ribbed ceramic vase is a must-have decorative element to elevate any vanity table, fireplace mantle, or dining setting. Designed with a sleek circular hollow donut shape, it looks stunning either with dried pampas grass or displayed entirely on its own.',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600'
    ],
    price: 799,
    originalPrice: 1499,
    discount: 46,
    storeName: 'Amazon',
    affiliateLink: 'https://www.amazon.in',
    category: 'cat-9', // Home Decor
    tags: ['vase', 'ceramic', 'decor', 'beige', 'pampas'],
    badge: 'Featured',
    color: 'Off-White Matte',
    availableSizes: ['Medium'],
    material: 'Natural Ribbed Earthenware',
    brand: 'Clay & Co.',
    displayOrder: 7,
    status: 'active',
    clickCount: 89,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-8',
    title: 'Tailored Pastel Pink Double Blazer',
    shortDescription: 'Classic double-breasted blazer in a romantic pastel pink hue with tortoiseshell buttons.',
    detailedDescription: 'Sharpen your daily wardrobe with this beautifully tailored pastel blazer. Cut for a relaxed yet commanding fit, it features structural shoulders, thin lapels, tortoiseshell buttons, and full interior satin lining. Style it over white pleated trousers or drape it over a linen dress.',
    images: [
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=600'
    ],
    price: 2499,
    originalPrice: 4999,
    discount: 50,
    storeName: 'Myntra',
    affiliateLink: 'https://www.myntra.com',
    category: 'cat-4', // Office Wear
    tags: ['pink', 'blazer', 'office', 'outerwear', 'suit'],
    badge: "Editor's Pick",
    color: 'Pastel Pink',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL'],
    material: 'Poly-Rayon Lining Blend',
    brand: 'Prestige Fem',
    displayOrder: 8,
    status: 'active',
    clickCount: 224,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-9',
    title: 'Hydrating Glow Lip Oil in Sweet Nectar',
    shortDescription: 'Aesthetic dewy lip oil packed with lavender oil and hyaluronic acid for high-shine hydration.',
    detailedDescription: 'Treat your lips to instant glass-like shine with our luxurious botanical lip oil. Formulated with real French lavender infusion, seed extracts, and hyaluronic acid micro-spheres. Non-sticky, hydrating, and smells like a fresh spring morning.',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600'
    ],
    price: 399,
    originalPrice: 799,
    discount: 50,
    storeName: 'Nykaa Fashion',
    affiliateLink: 'https://www.nykaa.com',
    category: 'cat-10', // Beauty
    tags: ['beauty', 'makeup', 'lip-oil', 'aesthetic', 'lavender'],
    badge: 'Trending',
    color: 'Sweet Nectar Clear Pink',
    availableSizes: ['6ml'],
    material: 'Organic Botanical Hydrator',
    brand: 'Petal & Dew',
    displayOrder: 9,
    status: 'active',
    clickCount: 162,
    createdAt: new Date().toISOString()
  }
];

// Preloaded beautiful collection seed data
const DEFAULT_COLLECTIONS: OutfitCollection[] = [
  {
    id: 'look-1',
    title: 'Chic Monday Office Look',
    slug: 'office-look-12',
    description: 'Banish Monday blues with this perfect blend of professional power and soft feminine details. Combining tailored pastel pink with wide cream trousers, balanced by Baroque pearl details.',
    coverImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600',
    productIds: ['prod-8', 'prod-2', 'prod-4', 'prod-6', 'prod-5'], // Blazer, Trousers, Bag, Sandals, Earrings
    displayOrder: 1,
    status: 'active',
    clickCount: 418,
    createdAt: new Date().toISOString()
  },
  {
    id: 'look-2',
    title: 'Beige Aesthetic Reading Nook',
    slug: 'beige-reading-nook',
    description: 'An elegant curation for the minimalist home lover. Create a cozy, textured sensory escape with ribbed ceramics and organic warm-toned vases.',
    coverImage: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600',
    productIds: ['prod-7'], // Vase
    displayOrder: 2,
    status: 'active',
    clickCount: 195,
    createdAt: new Date().toISOString()
  },
  {
    id: 'look-3',
    title: 'Pastel Dream Sunday Brunch',
    slug: 'sunday-brunch-pastels',
    description: 'Effortless linen dress paired with lavender romantic tops and sandals to create a highly aesthetic, floaty weekend outfit.',
    coverImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600',
    productIds: ['prod-1', 'prod-3', 'prod-4', 'prod-6', 'prod-9'], // Linen Dress, Lavender blouse, bag, sandals, lip-oil
    displayOrder: 3,
    status: 'active',
    clickCount: 304,
    createdAt: new Date().toISOString()
  }
];

// Pure JSON persistence helper
export class LocalDatabase {
  private categories: Category[] = [];
  private products: Product[] = [];
  private collections: OutfitCollection[] = [];
  private adminPasswordHash: string = ''; // Admin credentials: user="admin"

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        this.categories = data.categories || DEFAULT_CATEGORIES;
        this.products = data.products || DEFAULT_PRODUCTS;
        this.collections = data.collections || DEFAULT_COLLECTIONS;
        // default password is "admin123", we store a quick custom hash simple mechanism
        this.adminPasswordHash = data.adminPasswordHash || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // SHA256 of 'admin123'
      } else {
        this.categories = DEFAULT_CATEGORIES;
        this.products = DEFAULT_PRODUCTS;
        this.collections = DEFAULT_COLLECTIONS;
        this.adminPasswordHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // 'admin123'
        this.save();
      }
    } catch (err) {
      console.error('Error loading database file. Initializing in memory fallback...', err);
      this.categories = DEFAULT_CATEGORIES;
      this.products = DEFAULT_PRODUCTS;
      this.collections = DEFAULT_COLLECTIONS;
    }
  }

  private save() {
    try {
      const data = {
        categories: this.categories,
        products: this.products,
        collections: this.collections,
        adminPasswordHash: this.adminPasswordHash,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Categories CRUD
  getCategories(): Category[] {
    return this.categories
      .map(c => {
        const count = this.products.filter(p => p.category === c.id && p.status === 'active').length;
        return { ...c, productCount: count };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return this.categories.find(c => c.slug === slug);
  }

  createCategory(cat: Omit<Category, 'id'>): Category {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`
    };
    this.categories.push(newCat);
    this.save();
    return newCat;
  }

  updateCategory(id: string, updated: Partial<Category>): Category | undefined {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.categories[idx] = { ...this.categories[idx], ...updated };
    this.save();
    return this.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.categories.splice(idx, 1);
    // Also remove reference from products
    this.products.forEach(p => {
      if (p.category === id) {
        p.category = '';
      }
    });
    this.save();
    return true;
  }

  // Products CRUD
  getProducts(): Product[] {
    return [...this.products].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  createProduct(prod: Omit<Product, 'id' | 'clickCount' | 'createdAt'>): Product {
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      clickCount: 0,
      createdAt: new Date().toISOString()
    };
    this.products.push(newProd);
    this.save();
    return newProd;
  }

  updateProduct(id: string, updated: Partial<Product>): Product | undefined {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.products[idx] = { ...this.products[idx], ...updated };
    this.save();
    return this.products[idx];
  }

  deleteProduct(id: string): boolean {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.products.splice(idx, 1);
    // Also remove from any outfit collections
    this.collections.forEach(col => {
      col.productIds = col.productIds.filter(pid => pid !== id);
    });
    this.save();
    return true;
  }

  incrementProductClick(id: string): boolean {
    const prod = this.getProductById(id);
    if (prod) {
      prod.clickCount = (prod.clickCount || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  // Collections CRUD
  getCollections(): OutfitCollection[] {
    return [...this.collections].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getCollectionBySlug(slug: string): OutfitCollection | undefined {
    return this.collections.find(c => c.slug === slug);
  }

  createCollection(col: Omit<OutfitCollection, 'id' | 'clickCount' | 'createdAt'>): OutfitCollection {
    const newCol: OutfitCollection = {
      ...col,
      id: `look-${Date.now()}`,
      clickCount: 0,
      createdAt: new Date().toISOString()
    };
    this.collections.push(newCol);
    this.save();
    return newCol;
  }

  updateCollection(id: string, updated: Partial<OutfitCollection>): OutfitCollection | undefined {
    const idx = this.collections.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.collections[idx] = { ...this.collections[idx], ...updated };
    this.save();
    return this.collections[idx];
  }

  deleteCollection(id: string): boolean {
    const idx = this.collections.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.collections.splice(idx, 1);
    this.save();
    return true;
  }

  incrementCollectionClick(id: string): boolean {
    const col = this.collections.find(c => c.id === id);
    if (col) {
      col.clickCount = (col.clickCount || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  // Admin and Password
  getAdminPasswordHash(): string {
    return this.adminPasswordHash;
  }

  updateAdminPassword(newHash: string) {
    this.adminPasswordHash = newHash;
    this.save();
  }
}

// Global database instance
export const db = new LocalDatabase();
