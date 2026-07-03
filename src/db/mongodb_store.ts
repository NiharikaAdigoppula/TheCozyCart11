/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { initializeApp as initAdminApp, getApps as getAdminApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Category, Product, OutfitCollection } from '../types';

// Fallback to local store data
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
    category: 'cat-5',
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
    category: 'cat-3',
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
    category: 'cat-2',
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
    category: 'cat-6',
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
    category: 'cat-7',
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
    category: 'cat-8',
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
    category: 'cat-9',
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
    category: 'cat-4',
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
    category: 'cat-10',
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

const DEFAULT_COLLECTIONS: OutfitCollection[] = [
  {
    id: 'look-1',
    title: 'Chic Monday Office Look',
    slug: 'office-look-12',
    description: 'Banish Monday blues with this perfect blend of professional power and soft feminine details. Combining tailored pastel pink with wide cream trousers, balanced by Baroque pearl details.',
    coverImage: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600',
    productIds: ['prod-8', 'prod-2', 'prod-4', 'prod-6', 'prod-5'],
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
    productIds: ['prod-7'],
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
    productIds: ['prod-1', 'prod-3', 'prod-4', 'prod-6', 'prod-9'],
    displayOrder: 3,
    status: 'active',
    clickCount: 304,
    createdAt: new Date().toISOString()
  }
];

// Helper to clean, robustly parse, and URL-encode credentials in a MongoDB URI
export function cleanMongoUri(uri: string, stripBrackets: boolean): string {
  if (!uri) return uri;
  
  uri = uri.trim();
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.substring(1, uri.length - 1).trim();
  }

  const protoMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)/i);
  if (!protoMatch) return uri;
  const protocol = protoMatch[1];
  let rest = uri.substring(protocol.length);

  let query = '';
  const queryIdx = rest.indexOf('?');
  if (queryIdx !== -1) {
    query = rest.substring(queryIdx);
    rest = rest.substring(0, queryIdx);
  }

  let dbPath = '';
  const pathIdx = rest.indexOf('/');
  if (pathIdx !== -1) {
    dbPath = rest.substring(pathIdx);
    rest = rest.substring(0, pathIdx);
  }

  const lastAtIdx = rest.lastIndexOf('@');
  if (lastAtIdx === -1) {
    return uri;
  }

  const credentials = rest.substring(0, lastAtIdx);
  const hosts = rest.substring(lastAtIdx + 1);

  const colonIdx = credentials.indexOf(':');
  if (colonIdx === -1) {
    return `${protocol}${encodeURIComponent(credentials)}@${hosts}${dbPath}${query}`;
  }

  const username = credentials.substring(0, colonIdx);
  let password = credentials.substring(colonIdx + 1);

  if (stripBrackets) {
    if (password.startsWith('<') && password.endsWith('>')) {
      password = password.substring(1, password.length - 1);
    }
  }

  try {
    password = decodeURIComponent(password);
  } catch (e) {
    // Ignore decode errors
  }

  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);

  return `${protocol}${encodedUsername}:${encodedPassword}@${hosts}${dbPath}${query}`;
}

// Safely obfuscate passwords in MongoDB URI for logging
export function obfuscateUri(uri: string): string {
  if (!uri) return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)(@)/i, '$1$2:*****$4');
}

export class MongoDatabase {
  private client: MongoClient | null = null;
  private dbName: string = 'thecozycart';
  private connected: boolean = false;
  private firestoreDb: any = null;
  private isFirebaseAvailable: boolean = false;
  
  // Local fallback DB loaded synchronously if MongoDB is unavailable
  private fallbackData: {
    categories: Category[];
    products: Product[];
    collections: OutfitCollection[];
    adminPasswordHash: string;
  } = {
    categories: DEFAULT_CATEGORIES,
    products: DEFAULT_PRODUCTS,
    collections: DEFAULT_COLLECTIONS,
    adminPasswordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' // 'admin123'
  };

  constructor() {
    this.initFirebase();
    this.initLocalFallback();
    this.connectMongo();
  }

  private initFirebase() {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config && config.projectId) {
          let adminApp;
          if (getAdminApps().length === 0) {
            adminApp = initAdminApp({
              credential: applicationDefault(),
              projectId: config.projectId,
            });
          } else {
            adminApp = getAdminApps()[0];
          }
          
          if (config.firestoreDatabaseId) {
            this.firestoreDb = getFirestore(adminApp, config.firestoreDatabaseId);
          } else {
            this.firestoreDb = getFirestore(adminApp);
          }
          this.isFirebaseAvailable = true;
          console.log('Firebase Admin and Firestore initialized in MongoDatabase class!');
        }
      }
    } catch (err) {
      console.warn('Firebase Admin initialization in MongoDatabase failed:', err);
    }
  }

  private async syncToFirestore() {
    if (!this.isFirebaseAvailable || !this.firestoreDb) return;
    try {
      // Sync Categories
      for (const cat of this.fallbackData.categories) {
        await this.firestoreDb.collection('categories').doc(cat.id).set(cat, { merge: true });
      }
      // Sync Products
      for (const prod of this.fallbackData.products) {
        await this.firestoreDb.collection('products').doc(prod.id).set(prod, { merge: true });
      }
      // Sync Collections
      for (const col of this.fallbackData.collections) {
        await this.firestoreDb.collection('collections').doc(col.id).set(col, { merge: true });
      }
      // Sync Admin Settings
      await this.firestoreDb.collection('settings').doc('admin').set({
        adminPasswordHash: this.fallbackData.adminPasswordHash
      }, { merge: true });
      console.log('Successfully synced MongoDatabase fallbackData to Firestore!');
    } catch (err) {
      console.warn('Failed to sync data to Firestore:', err);
    }
  }

  private async loadFromFirestore() {
    if (!this.isFirebaseAvailable || !this.firestoreDb) return null;
    try {
      const categoriesSnap = await this.firestoreDb.collection('categories').get();
      const productsSnap = await this.firestoreDb.collection('products').get();
      const collectionsSnap = await this.firestoreDb.collection('collections').get();
      const settingsSnap = await this.firestoreDb.collection('settings').doc('admin').get();

      const categories: any[] = [];
      categoriesSnap.forEach((doc: any) => categories.push(doc.data()));

      const products: any[] = [];
      productsSnap.forEach((doc: any) => products.push(doc.data()));

      const collections: any[] = [];
      collectionsSnap.forEach((doc: any) => collections.push(doc.data()));

      const adminPasswordHash = settingsSnap.exists ? settingsSnap.data()?.adminPasswordHash : null;

      if (categories.length > 0 || products.length > 0) {
        console.log('Successfully loaded database content from Firestore!');
        return {
          categories,
          products,
          collections,
          adminPasswordHash: adminPasswordHash || this.fallbackData.adminPasswordHash
        };
      }
    } catch (err) {
      console.warn('Failed to load database content from Firestore:', err);
    }
    return null;
  }

  private initLocalFallback() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        this.fallbackData = {
          categories: data.categories || DEFAULT_CATEGORIES,
          products: data.products || DEFAULT_PRODUCTS,
          collections: data.collections || DEFAULT_COLLECTIONS,
          adminPasswordHash: data.adminPasswordHash || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
        };
      } else {
        this.saveLocalFallback();
      }
    } catch (err) {
      console.warn('MongoDB Store fallback initialization error:', err);
    }
  }

  private saveLocalFallback() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.fallbackData, null, 2), 'utf-8');
      this.syncToFirestore().catch(err => console.warn('Background sync to Firestore failed:', err));
    } catch (err) {
      console.warn('Failed to save fallback data:', err);
    }
  }

  private async connectMongo() {
    const rawUri = process.env.MONGODB_URI || 'mongodb+srv://thecozycart11:Niha%40cozy11@cluster0.kwjwbr.mongodb.net/?appName=Cluster0';
    
    const uriStrip = cleanMongoUri(rawUri, true);
    const uriKeep = cleanMongoUri(rawUri, false);
    
    const connectionAttempts = [
      { uri: uriStrip, name: 'Cleaned (brackets stripped)' },
      { uri: uriKeep, name: 'Cleaned (brackets preserved)' },
      { uri: rawUri, name: 'Raw environment URI' }
    ];

    const uniqueAttempts = connectionAttempts.filter((item, index, self) => 
      self.findIndex(t => t.uri === item.uri) === index
    );

    let lastError: any = null;
    
    for (const attempt of uniqueAttempts) {
      try {
        console.log(`Attempting MongoDB connection using variant: ${attempt.name} (${obfuscateUri(attempt.uri)})`);
        this.client = new MongoClient(attempt.uri, { serverSelectionTimeoutMS: 4000 });
        await this.client.connect();
        this.connected = true;
        console.log(`MongoDB successfully connected via variant: ${attempt.name}!`);
        await this.seedIfNeeded();
        return;
      } catch (err) {
        lastError = err;
        console.warn(`MongoDB connection attempt failed for variant: ${attempt.name}. Error:`, err instanceof Error ? err.message : err);
        if (this.client) {
          try {
            await this.client.close();
          } catch (e) {
            // ignore
          }
          this.client = null;
        }
      }
    }

    console.error('CRITICAL: All MongoDB connection attempts failed! Falling back to file database and Firebase Firestore.', lastError);
    this.connected = false;

    // Load from Firestore as primary fallback
    try {
      const firestoreData = await this.loadFromFirestore();
      if (firestoreData) {
        this.fallbackData = firestoreData;
        // Save locally too so that the local cache is warm
        fs.writeFileSync(DB_FILE, JSON.stringify(this.fallbackData, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('Could not load backup from Firestore:', e);
    }
  }

  private async getDb() {
    if (!this.connected || !this.client) {
      // Try to reconnect once
      try {
        await this.connectMongo();
      } catch (e) {
        // failed, proceed to fallback
      }
    }
    if (this.connected && this.client) {
      return this.client.db(this.dbName);
    }
    return null;
  }

  private async seedIfNeeded() {
    const db = await this.getDb();
    if (!db) return;

    try {
      const catCol = db.collection('categories');
      const prodCol = db.collection('products');
      const lookCol = db.collection('collections');
      const settingsCol = db.collection('settings');

      const catCount = await catCol.countDocuments();
      if (catCount === 0) {
        console.log('Seeding categories to MongoDB...');
        await catCol.insertMany(this.fallbackData.categories);
      }

      const prodCount = await prodCol.countDocuments();
      if (prodCount === 0) {
        console.log('Seeding products to MongoDB...');
        await prodCol.insertMany(this.fallbackData.products);
      }

      const lookCount = await lookCol.countDocuments();
      if (lookCount === 0) {
        console.log('Seeding collections to MongoDB...');
        await lookCol.insertMany(this.fallbackData.collections);
      }

      const adminCount = await settingsCol.countDocuments({ key: 'adminPasswordHash' });
      if (adminCount === 0) {
        console.log('Setting up default admin credentials in MongoDB...');
        await settingsCol.insertOne({ key: 'adminPasswordHash', value: this.fallbackData.adminPasswordHash });
      }
    } catch (err) {
      console.error('Error seeding MongoDB collections:', err);
    }
  }

  // --- Category APIs ---
  async getCategories(): Promise<Category[]> {
    const db = await this.getDb();
    if (db) {
      try {
        const categories = await db.collection<Category>('categories').find({}).toArray();
        const products = await db.collection<Product>('products').find({ status: 'active' }).toArray();
        
        const mapped = categories.map(c => {
          // Remove mongodb _id if present in clean returns
          const { _id, ...rest } = c as any;
          const count = products.filter(p => p.category === rest.id).length;
          return { ...rest, productCount: count } as Category;
        });
        return mapped.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (err) {
        console.error('MongoDB error in getCategories:', err);
      }
    }

    // Fallback
    return this.fallbackData.categories
      .map(c => {
        const count = this.fallbackData.products.filter(p => p.category === c.id && p.status === 'active').length;
        return { ...c, productCount: count };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const db = await this.getDb();
    if (db) {
      try {
        const cat = await db.collection<Category>('categories').findOne({ slug });
        if (cat) {
          const { _id, ...rest } = cat as any;
          return rest as Category;
        }
        return undefined;
      } catch (err) {
        console.error('MongoDB error in getCategoryBySlug:', err);
      }
    }
    return this.fallbackData.categories.find(c => c.slug === slug);
  }

  async createCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`
    };

    const db = await this.getDb();
    if (db) {
      try {
        await db.collection('categories').insertOne({ ...newCat });
      } catch (err) {
        console.error('MongoDB error in createCategory:', err);
      }
    }

    this.fallbackData.categories.push(newCat);
    this.saveLocalFallback();
    return newCat;
  }

  async updateCategory(id: string, updated: Partial<Category>): Promise<Category | undefined> {
    const db = await this.getDb();
    if (db) {
      try {
        // Strip _id to avoid modification error
        const { _id, id: docId, ...cleanFields } = updated as any;
        const result = await db.collection('categories').findOneAndUpdate(
          { id },
          { $set: cleanFields },
          { returnDocument: 'after' }
        );
        if (result) {
          const { _id: rId, ...rest } = result as any;
          // Also update fallback copy to keep in sync
          const idx = this.fallbackData.categories.findIndex(c => c.id === id);
          if (idx !== -1) {
            this.fallbackData.categories[idx] = { ...this.fallbackData.categories[idx], ...updated };
            this.saveLocalFallback();
          }
          return rest as Category;
        }
      } catch (err) {
        console.error('MongoDB error in updateCategory:', err);
      }
    }

    const idx = this.fallbackData.categories.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.fallbackData.categories[idx] = { ...this.fallbackData.categories[idx], ...updated };
    this.saveLocalFallback();
    return this.fallbackData.categories[idx];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const db = await this.getDb();
    let mongoSuccess = false;
    if (db) {
      try {
        const result = await db.collection('categories').deleteOne({ id });
        await db.collection('products').updateMany({ category: id }, { $set: { category: '' } });
        mongoSuccess = result.deletedCount > 0;
      } catch (err) {
        console.error('MongoDB error in deleteCategory:', err);
      }
    }

    if (this.isFirebaseAvailable && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('categories').doc(id).delete();
        console.log(`Successfully deleted category ${id} from Firestore`);
      } catch (err) {
        console.warn(`Failed to delete category ${id} from Firestore:`, err);
      }
    }

    const idx = this.fallbackData.categories.findIndex(c => c.id === id);
    if (idx === -1 && !mongoSuccess) return false;
    if (idx !== -1) {
      this.fallbackData.categories.splice(idx, 1);
      this.fallbackData.products.forEach(p => {
        if (p.category === id) {
          p.category = '';
        }
      });
      this.saveLocalFallback();
    }
    return true;
  }

  // --- Products APIs ---
  async getProducts(): Promise<Product[]> {
    const db = await this.getDb();
    if (db) {
      try {
        const products = await db.collection<Product>('products').find({}).toArray();
        const mapped = products.map(p => {
          const { _id, ...rest } = p as any;
          return rest as Product;
        });
        return mapped.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (err) {
        console.error('MongoDB error in getProducts:', err);
      }
    }
    return [...this.fallbackData.products].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const db = await this.getDb();
    if (db) {
      try {
        const prod = await db.collection<Product>('products').findOne({ id });
        if (prod) {
          const { _id, ...rest } = prod as any;
          return rest as Product;
        }
        return undefined;
      } catch (err) {
        console.error('MongoDB error in getProductById:', err);
      }
    }
    return this.fallbackData.products.find(p => p.id === id);
  }

  async createProduct(prod: Omit<Product, 'id' | 'clickCount' | 'createdAt'>): Promise<Product> {
    const newProd: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      clickCount: 0,
      createdAt: new Date().toISOString()
    };

    const db = await this.getDb();
    if (db) {
      try {
        await db.collection('products').insertOne({ ...newProd });
      } catch (err) {
        console.error('MongoDB error in createProduct:', err);
      }
    }

    this.fallbackData.products.push(newProd);
    this.saveLocalFallback();
    return newProd;
  }

  async updateProduct(id: string, updated: Partial<Product>): Promise<Product | undefined> {
    const db = await this.getDb();
    if (db) {
      try {
        const { _id, id: docId, ...cleanFields } = updated as any;
        const result = await db.collection('products').findOneAndUpdate(
          { id },
          { $set: cleanFields },
          { returnDocument: 'after' }
        );
        if (result) {
          const { _id: rId, ...rest } = result as any;
          // update fallback copy
          const idx = this.fallbackData.products.findIndex(p => p.id === id);
          if (idx !== -1) {
            this.fallbackData.products[idx] = { ...this.fallbackData.products[idx], ...updated };
            this.saveLocalFallback();
          }
          return rest as Product;
        }
      } catch (err) {
        console.error('MongoDB error in updateProduct:', err);
      }
    }

    const idx = this.fallbackData.products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.fallbackData.products[idx] = { ...this.fallbackData.products[idx], ...updated };
    this.saveLocalFallback();
    return this.fallbackData.products[idx];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const db = await this.getDb();
    let mongoSuccess = false;
    if (db) {
      try {
        const result = await db.collection('products').deleteOne({ id });
        // Also remove from collections in DB
        await db.collection('collections').updateMany(
          {},
          { $pull: { productIds: id } as any }
        );
        mongoSuccess = result.deletedCount > 0;
      } catch (err) {
        console.error('MongoDB error in deleteProduct:', err);
      }
    }

    if (this.isFirebaseAvailable && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('products').doc(id).delete();
        console.log(`Successfully deleted product ${id} from Firestore`);
      } catch (err) {
        console.warn(`Failed to delete product ${id} from Firestore:`, err);
      }
    }

    const idx = this.fallbackData.products.findIndex(p => p.id === id);
    if (idx === -1 && !mongoSuccess) return false;
    if (idx !== -1) {
      this.fallbackData.products.splice(idx, 1);
      this.fallbackData.collections.forEach(col => {
        col.productIds = col.productIds.filter(pid => pid !== id);
      });
      this.saveLocalFallback();
    }
    return true;
  }

  async incrementProductClick(id: string): Promise<boolean> {
    const db = await this.getDb();
    if (db) {
      try {
        await db.collection('products').updateOne({ id }, { $inc: { clickCount: 1 } });
      } catch (err) {
        console.error('MongoDB error in incrementProductClick:', err);
      }
    }

    const prod = this.fallbackData.products.find(p => p.id === id);
    if (prod) {
      prod.clickCount = (prod.clickCount || 0) + 1;
      this.saveLocalFallback();
      return true;
    }
    return false;
  }

  // --- Collection APIs ---
  async getCollections(): Promise<OutfitCollection[]> {
    const db = await this.getDb();
    if (db) {
      try {
        const collections = await db.collection<OutfitCollection>('collections').find({}).toArray();
        const mapped = collections.map(c => {
          const { _id, ...rest } = c as any;
          return rest as OutfitCollection;
        });
        return mapped.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (err) {
        console.error('MongoDB error in getCollections:', err);
      }
    }
    return [...this.fallbackData.collections].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCollectionBySlug(slug: string): Promise<OutfitCollection | undefined> {
    const db = await this.getDb();
    if (db) {
      try {
        const col = await db.collection<OutfitCollection>('collections').findOne({ slug });
        if (col) {
          const { _id, ...rest } = col as any;
          return rest as OutfitCollection;
        }
        return undefined;
      } catch (err) {
        console.error('MongoDB error in getCollectionBySlug:', err);
      }
    }
    return this.fallbackData.collections.find(c => c.slug === slug);
  }

  async createCollection(col: Omit<OutfitCollection, 'id' | 'clickCount' | 'createdAt'>): Promise<OutfitCollection> {
    const newCol: OutfitCollection = {
      ...col,
      id: `look-${Date.now()}`,
      clickCount: 0,
      createdAt: new Date().toISOString()
    };

    const db = await this.getDb();
    if (db) {
      try {
        await db.collection('collections').insertOne({ ...newCol });
      } catch (err) {
        console.error('MongoDB error in createCollection:', err);
      }
    }

    this.fallbackData.collections.push(newCol);
    this.saveLocalFallback();
    return newCol;
  }

  async updateCollection(id: string, updated: Partial<OutfitCollection>): Promise<OutfitCollection | undefined> {
    const db = await this.getDb();
    if (db) {
      try {
        const { _id, id: docId, ...cleanFields } = updated as any;
        const result = await db.collection('collections').findOneAndUpdate(
          { id },
          { $set: cleanFields },
          { returnDocument: 'after' }
        );
        if (result) {
          const { _id: rId, ...rest } = result as any;
          // update fallback copy
          const idx = this.fallbackData.collections.findIndex(c => c.id === id);
          if (idx !== -1) {
            this.fallbackData.collections[idx] = { ...this.fallbackData.collections[idx], ...updated };
            this.saveLocalFallback();
          }
          return rest as OutfitCollection;
        }
      } catch (err) {
        console.error('MongoDB error in updateCollection:', err);
      }
    }

    const idx = this.fallbackData.collections.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.fallbackData.collections[idx] = { ...this.fallbackData.collections[idx], ...updated };
    this.saveLocalFallback();
    return this.fallbackData.collections[idx];
  }

  async deleteCollection(id: string): Promise<boolean> {
    const db = await this.getDb();
    let mongoSuccess = false;
    if (db) {
      try {
        const result = await db.collection('collections').deleteOne({ id });
        mongoSuccess = result.deletedCount > 0;
      } catch (err) {
        console.error('MongoDB error in deleteCollection:', err);
      }
    }

    if (this.isFirebaseAvailable && this.firestoreDb) {
      try {
        await this.firestoreDb.collection('collections').doc(id).delete();
        console.log(`Successfully deleted collection ${id} from Firestore`);
      } catch (err) {
        console.warn(`Failed to delete collection ${id} from Firestore:`, err);
      }
    }

    const idx = this.fallbackData.collections.findIndex(c => c.id === id);
    if (idx === -1 && !mongoSuccess) return false;
    if (idx !== -1) {
      this.fallbackData.collections.splice(idx, 1);
      this.saveLocalFallback();
    }
    return true;
  }

  async incrementCollectionClick(id: string): Promise<boolean> {
    const db = await this.getDb();
    if (db) {
      try {
        await db.collection('collections').updateOne({ id }, { $inc: { clickCount: 1 } });
      } catch (err) {
        console.error('MongoDB error in incrementCollectionClick:', err);
      }
    }

    const col = this.fallbackData.collections.find(c => c.id === id);
    if (col) {
      col.clickCount = (col.clickCount || 0) + 1;
      this.saveLocalFallback();
      return true;
    }
    return false;
  }

  // --- Admin credentials ---
  async getAdminPasswordHash(): Promise<string> {
    const db = await this.getDb();
    if (db) {
      try {
        const setting = await db.collection('settings').findOne({ key: 'adminPasswordHash' });
        if (setting) {
          return setting.value;
        }
      } catch (err) {
        console.error('MongoDB error in getAdminPasswordHash:', err);
      }
    }
    return this.fallbackData.adminPasswordHash;
  }

  async updateAdminPassword(newHash: string): Promise<void> {
    const db = await this.getDb();
    if (db) {
      try {
        await db.collection('settings').updateOne(
          { key: 'adminPasswordHash' },
          { $set: { value: newHash } },
          { upsert: true }
        );
      } catch (err) {
        console.error('MongoDB error in updateAdminPassword:', err);
      }
    }
    this.fallbackData.adminPasswordHash = newHash;
    this.saveLocalFallback();
  }
}

// Global mongo-backed database instance
export const db = new MongoDatabase();
