/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { initializeApp as initAdminApp, getApps as getAdminApps, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { db } from './src/db/mongodb_store';

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Request logger middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Admin Token Verification Middleware
  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer cozy-cart-admin-token-xyz-123') {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Admin access required.' });
  }

  // --- Auth API ---
  app.get('/api/firebase-config', (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return res.json(config);
      }
    } catch (err) {
      console.error('Error reading firebase config on server:', err);
    }
    return res.status(404).json({ error: 'Firebase config not found' });
  });

  let isFirebaseAuthAvailable = true;

  async function ensureAdminUserInFirebase() {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config && config.projectId) {
          if (getAdminApps().length === 0) {
            let credential;
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
              try {
                credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
                console.log('Firebase Admin initialized with service account from env.');
              } catch (e) {
                console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT in server.ts, falling back to applicationDefault():', e);
                credential = applicationDefault();
              }
            } else {
              credential = applicationDefault();
            }
            initAdminApp({
              credential,
              projectId: config.projectId,
            });
          }
          const auth = getAdminAuth();
          const email = 'thecozycart11@thecozycart.com';
          const defaultPassword = '12345678';
          
          try {
            await auth.getUserByEmail(email);
            console.log(`Firebase Auth Admin User already exists: ${email}`);
          } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
              try {
                await auth.createUser({
                  email,
                  password: defaultPassword,
                  displayName: 'Cozy Admin'
                });
                console.log(`Successfully created default Admin User in Firebase Auth: ${email}`);
              } catch (createErr: any) {
                console.warn('Could not create admin user in Firebase Auth. Disabling secondary Firebase Auth integration:', createErr.message || createErr);
                isFirebaseAuthAvailable = false;
              }
            } else {
              console.warn('Could not retrieve admin user in Firebase Auth. Disabling secondary Firebase Auth integration:', err.message || err);
              isFirebaseAuthAvailable = false;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Firebase Admin setup/ensure user failed on server startup. Disabling secondary Firebase Auth integration:', err.message || err);
      isFirebaseAuthAvailable = false;
    }
  }

  ensureAdminUserInFirebase();

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (username !== 'admin' && username !== 'thecozycart11') {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    const storedHash = await db.getAdminPasswordHash();

    // Default hashes
    const defaultAdminHash = crypto.createHash('sha256').update('admin123').digest('hex');
    const defaultCozyHash = crypto.createHash('sha256').update('12345678').digest('hex');

    let isValid = false;

    // Check if password has been updated in database or if we are using defaults
    if (storedHash === defaultAdminHash) {
      // Not yet customized, or customized back to default admin123
      if (username === 'thecozycart11' && password === '12345678') {
        isValid = true;
      } else if (username === 'admin' && password === 'admin123') {
        isValid = true;
      }
    } else {
      // Check against stored custom hash, or default cozy/admin passwords
      if (inputHash === storedHash || 
          (username === 'thecozycart11' && inputHash === defaultCozyHash) ||
          (username === 'admin' && inputHash === defaultAdminHash)) {
        isValid = true;
      }
    }

    if (isValid) {
      return res.json({
        success: true,
        token: 'cozy-cart-admin-token-xyz-123',
        user: { username }
      });
    }

    return res.status(401).json({ error: 'Invalid admin credentials.' });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const defaultHash = crypto.createHash('sha256').update('12345678').digest('hex');
    await db.updateAdminPassword(defaultHash);

    // Reset in Firebase Auth as well
    if (isFirebaseAuthAvailable) {
      try {
        const auth = getAdminAuth();
        const user = await auth.getUserByEmail('thecozycart11@thecozycart.com');
        await auth.updateUser(user.uid, { password: '12345678' });
        console.log('Successfully reset Admin password in Firebase Authentication');
      } catch (e) {
        console.warn('Could not reset Admin password in Firebase Authentication:', e);
      }
    }

    return res.json({ success: true, message: 'Password reset to default (12345678) successfully.' });
  });

  app.post('/api/auth/update-password', requireAdmin, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }
    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    await db.updateAdminPassword(newHash);

    // Update in Firebase Auth as well
    if (isFirebaseAuthAvailable) {
      try {
        const auth = getAdminAuth();
        const user = await auth.getUserByEmail('thecozycart11@thecozycart.com');
        await auth.updateUser(user.uid, { password: newPassword });
        console.log('Successfully updated Admin password in Firebase Authentication');
      } catch (e) {
        console.warn('Could not update Admin password in Firebase Authentication:', e);
      }
    }

    return res.json({ success: true, message: 'Password updated successfully.' });
  });

  // --- Categories API ---
  app.get('/api/categories', async (req, res) => {
    const categories = await db.getCategories();
    // Visitors only see active, admin gets all.
    const isAdmin = req.headers.authorization === 'Bearer cozy-cart-admin-token-xyz-123';
    if (isAdmin) {
      return res.json(categories);
    }
    return res.json(categories.filter(c => c.status === 'active'));
  });

  app.get('/api/categories/:slug', async (req, res) => {
    const category = await db.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    return res.json(category);
  });

  app.post('/api/categories', requireAdmin, async (req, res) => {
    const { name, slug, description, image, icon, banner, displayOrder, status } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required.' });
    }
    const newCat = await db.createCategory({
      name,
      slug,
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600',
      icon: icon || 'Sparkles',
      banner: banner || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 10,
      status: status || 'active'
    });
    return res.status(201).json(newCat);
  });

  app.put('/api/categories/:id', requireAdmin, async (req, res) => {
    const updated = await db.updateCategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    return res.json(updated);
  });

  app.delete('/api/categories/:id', requireAdmin, async (req, res) => {
    const success = await db.deleteCategory(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    return res.json({ success: true, message: 'Category deleted successfully.' });
  });

  // --- Products API ---
  app.get('/api/products', async (req, res) => {
    const { category, search, store, badge, sort, minPrice, maxPrice, status } = req.query;
    let products = await db.getProducts();

    const isAdmin = req.headers.authorization === 'Bearer cozy-cart-admin-token-xyz-123';

    // Filter by active status by default unless admin requests all
    if (!isAdmin || status !== 'all') {
      products = products.filter(p => p.status === 'active');
    }

    // Category filter (could be id or slug)
    if (category) {
      const catObj = (await db.getCategoryBySlug(category as string)) || (await db.getCategories()).find(c => c.id === category);
      if (catObj) {
        products = products.filter(p => p.category === catObj.id);
      } else {
        products = products.filter(p => p.category === category);
      }
    }

    // Search filter
    if (search) {
      const q = (search as string).toLowerCase().trim();
      products = products.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.detailedDescription.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    // Store filter
    if (store) {
      products = products.filter(p => p.storeName.toLowerCase() === (store as string).toLowerCase());
    }

    // Badge filter
    if (badge) {
      products = products.filter(p => p.badge.toLowerCase() === (badge as string).toLowerCase());
    }

    // Price range filter
    if (minPrice) {
      products = products.filter(p => p.price >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= parseFloat(maxPrice as string));
    }

    // Sorting
    if (sort) {
      switch (sort) {
        case 'trending':
          products.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
          break;
        case 'best_seller':
          products = products.filter(p => p.badge === 'Best Seller').concat(products.filter(p => p.badge !== 'Best Seller'));
          break;
        case 'newest':
          products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'price_low_high':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price_high_low':
          products.sort((a, b) => b.price - a.price);
          break;
        default:
          // Use default display order
          products.sort((a, b) => a.displayOrder - b.displayOrder);
      }
    }

    return res.json(products);
  });

  app.get('/api/products/:id', async (req, res) => {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json(product);
  });

  app.post('/api/products', requireAdmin, async (req, res) => {
    const {
      title, shortDescription, detailedDescription, images, price,
      originalPrice, discount, storeName, affiliateLink, category,
      tags, badge, color, availableSizes, material, brand, displayOrder, status
    } = req.body;

    if (!title || !storeName || !affiliateLink) {
      return res.status(400).json({ error: 'Title, store name, and affiliate link are required.' });
    }

    const newProd = await db.createProduct({
      title,
      shortDescription: shortDescription || '',
      detailedDescription: detailedDescription || '',
      images: images || ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600'],
      price: typeof price === 'number' ? price : 0,
      originalPrice: typeof originalPrice === 'number' ? originalPrice : 0,
      discount: typeof discount === 'number' ? discount : 0,
      storeName,
      affiliateLink,
      category: category || '',
      tags: tags || [],
      badge: badge || '',
      color: color || '',
      availableSizes: availableSizes || ['One Size'],
      material: material || '',
      brand: brand || '',
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 10,
      status: status || 'active'
    });

    return res.status(201).json(newProd);
  });

  app.post('/api/products/duplicate/:id', requireAdmin, async (req, res) => {
    const existing = await db.getProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product to duplicate not found.' });
    }
    const duplicated = await db.createProduct({
      title: `${existing.title} (Copy)`,
      shortDescription: existing.shortDescription,
      detailedDescription: existing.detailedDescription,
      images: [...existing.images],
      price: existing.price,
      originalPrice: existing.originalPrice,
      discount: existing.discount,
      storeName: existing.storeName,
      affiliateLink: existing.affiliateLink,
      category: existing.category,
      tags: [...existing.tags],
      badge: existing.badge,
      color: existing.color,
      availableSizes: [...existing.availableSizes],
      material: existing.material,
      brand: existing.brand,
      displayOrder: existing.displayOrder + 1,
      status: 'hidden' // default to hidden for safety
    });
    return res.status(201).json(duplicated);
  });

  app.put('/api/products/:id', requireAdmin, async (req, res) => {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json(updated);
  });

  app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const success = await db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json({ success: true, message: 'Product deleted successfully.' });
  });

  app.post('/api/products/:id/click', async (req, res) => {
    const success = await db.incrementProductClick(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json({ success: true });
  });

  // --- Collections API ---
  app.get('/api/collections', async (req, res) => {
    const collections = await db.getCollections();
    const isAdmin = req.headers.authorization === 'Bearer cozy-cart-admin-token-xyz-123';
    if (isAdmin) {
      return res.json(collections);
    }
    return res.json(collections.filter(c => c.status === 'active'));
  });

  app.get('/api/collections/:slug', async (req, res) => {
    const col = await db.getCollectionBySlug(req.params.slug);
    if (!col) {
      return res.status(404).json({ error: 'Collection not found.' });
    }
    // Hydrate collection with product details
    const products = (await Promise.all(
      col.productIds.map(pid => db.getProductById(pid))
    )).filter((p): p is NonNullable<typeof p> => !!p);

    return res.json({
      ...col,
      products
    });
  });

  app.post('/api/collections', requireAdmin, async (req, res) => {
    const { title, slug, description, coverImage, productIds, displayOrder, status } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required.' });
    }
    const newCol = await db.createCollection({
      title,
      slug,
      description: description || '',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=600',
      productIds: productIds || [],
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 10,
      status: status || 'active'
    });
    return res.status(201).json(newCol);
  });

  app.put('/api/collections/:id', requireAdmin, async (req, res) => {
    const updated = await db.updateCollection(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Collection not found.' });
    }
    return res.json(updated);
  });

  app.delete('/api/collections/:id', requireAdmin, async (req, res) => {
    const success = await db.deleteCollection(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Collection not found.' });
    }
    return res.json({ success: true, message: 'Collection deleted successfully.' });
  });

  app.post('/api/collections/:id/click', async (req, res) => {
    const success = await db.incrementCollectionClick(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Collection not found.' });
    }
    return res.json({ success: true });
  });

  // --- Analytics API ---
  app.get('/api/analytics', requireAdmin, async (req, res) => {
    const [products, categories, collections] = await Promise.all([
      db.getProducts(),
      db.getCategories(),
      db.getCollections()
    ]);

    const totalProducts = products.length;
    const totalCategories = categories.length;
    const totalCollections = collections.length;

    const totalClicks = products.reduce((sum, p) => sum + (p.clickCount || 0), 0) +
                        collections.reduce((sum, c) => sum + (c.clickCount || 0), 0);

    const mostClickedProducts = [...products]
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 5);

    const recentlyAddedProducts = [...products]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return res.json({
      totalProducts,
      totalCategories,
      totalCollections,
      totalClicks,
      mostClickedProducts,
      recentlyAddedProducts
    });
  });

  // Serve static assets in production or use Vite dev server in development
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Cozy Cart server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
