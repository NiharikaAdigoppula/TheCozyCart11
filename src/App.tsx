/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Shirt, Layers, Briefcase, Heart, ShoppingBag, 
  Gem, Compass, Home, Flame, Search, ArrowRight, Grid, List, 
  Trash2, Edit, Plus, Copy, Share2, ArrowLeft, Check, LogIn,
  Eye, EyeOff, LayoutDashboard, Settings, UserCheck, X, Trash,
  ChevronRight, Bookmark, ArrowUpRight, CheckCircle2, ChevronLeft,
  Info, MessageSquare, HelpCircle, FileText, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Product, OutfitCollection, AnalyticsStats } from './types';
import { getFirebase } from './lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import * as api from './api';
import { ImageUpload } from './components/ImageUpload';

// Map icon names to components
const IconMap: { [key: string]: any } = {
  Sparkles, Shirt, Layers, Briefcase, Heart, ShoppingBag, Gem, Compass, Home, Flame
};

export default function App() {
  // Views: 'home' | 'product-detail' | 'look-detail' | 'admin-login' | 'admin-dashboard' | 'about-disclaimer'
  const [view, setView] = useState<'home' | 'product-detail' | 'look-detail' | 'admin-login' | 'admin-dashboard' | 'about-disclaimer'>('home');
  
  // Navigation stack state
  const [history, setHistory] = useState<string[]>([]);
  
  // App data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<OutfitCollection[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  
  // Selected detail entities
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<string | null>(null);
  const [hydratedCollection, setHydratedCollection] = useState<(OutfitCollection & { products: Product[] }) | null>(null);
  
  // User features states
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('cozy_cart_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    const saved = localStorage.getItem('cozy_cart_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Newsletter & Feedback popup state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Filtering and Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>('all');
  const [activeStore, setActiveStore] = useState<string>('all');
  const [activeBadge, setActiveBadge] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(99999999);
  const [sortBy, setSortBy] = useState<string>('default');
  
  // Admin & Authentication
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(!!api.getAuthToken());
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'collections' | 'settings'>('dashboard');
  const [passwordChange, setPasswordChange] = useState({ old: '', newPass: '', confirm: '' });
  const [passwordChangeStatus, setPasswordChangeStatus] = useState({ success: false, error: '' });

  // Admin Form States for CRUD
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCollection, setEditingCollection] = useState<Partial<OutfitCollection> | null>(null);
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'category' | 'product' | 'collection';
    id: string;
    message: string;
  } | null>(null);

  // Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      const cats = await api.fetchCategories();
      setCategories(cats);
      
      const prods = await api.fetchProducts({ status: isAdminLoggedIn ? 'all' : 'active' });
      setProducts(prods);
      
      const cols = await api.fetchCollections();
      setCollections(cols);

      if (isAdminLoggedIn) {
        const stats = await api.fetchAnalytics();
        setAnalytics(stats);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdminLoggedIn]);

  // Save wishlist to local storage
  const toggleWishlist = (prodId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated;
    if (wishlist.includes(prodId)) {
      updated = wishlist.filter(id => id !== prodId);
      showToast('Removed from wishlist');
    } else {
      updated = [...wishlist, prodId];
      showToast('Saved to wishlist');
    }
    setWishlist(updated);
    localStorage.setItem('cozy_cart_wishlist', JSON.stringify(updated));
  };

  // Add to recently viewed
  const addToRecentlyViewed = (prodId: string) => {
    let updated = [prodId, ...recentlyViewed.filter(id => id !== prodId)].slice(0, 5);
    setRecentlyViewed(updated);
    localStorage.setItem('cozy_cart_recently_viewed', JSON.stringify(updated));
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Product detail view trigger
  const openProductDetail = async (prodId: string) => {
    setSelectedProductId(prodId);
    addToRecentlyViewed(prodId);
    api.recordProductClick(prodId);
    setView('product-detail');
  };

  // Outfit collection detail view trigger
  const openCollectionDetail = async (slug: string) => {
    try {
      setSelectedCollectionSlug(slug);
      const data = await api.fetchCollectionBySlug(slug);
      setHydratedCollection(data);
      api.recordCollectionClick(data.id);
      setView('look-detail');
    } catch (err) {
      showToast('Failed to load collection details');
    }
  };

  // Back button handler
  const handleBack = () => {
    setView('home');
    setSelectedProductId(null);
    setSelectedCollectionSlug(null);
    setHydratedCollection(null);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      // Attempt Firebase client-side Authentication first
      try {
        const { auth } = await getFirebase();
        if (auth) {
          // Translate username to email representation for Firebase Auth
          const email = adminUsername.includes('@') ? adminUsername : `${adminUsername}@thecozycart.com`;
          await signInWithEmailAndPassword(auth, email, adminPassword);
          console.log('Firebase client auth succeeded');
        }
      } catch (fbErr: any) {
        console.warn('Firebase client auth failed or skipped:', fbErr.message);
        // We continue anyway and let the server verify (which acts as a fallback or main check)
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        api.setAuthToken(data.token);
        setIsAdminLoggedIn(true);
        setView('admin-dashboard');
        setAdminActiveTab('dashboard');
        showToast('Successfully logged in as Admin');
      } else {
        setLoginError(data.error || 'Invalid admin credentials');
      }
    } catch (err) {
      setLoginError('Server error during login. Please try again.');
    }
  };

  // Logout handler
  const handleLogout = () => {
    api.setAuthToken(null);
    setIsAdminLoggedIn(false);
    setView('home');
    showToast('Admin logged out successfully');
  };

  // Password update handler
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus({ success: false, error: '' });
    if (passwordChange.newPass !== passwordChange.confirm) {
      setPasswordChangeStatus({ success: false, error: 'New passwords do not match' });
      return;
    }
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getAuthToken()}`
        },
        body: JSON.stringify({ newPassword: passwordChange.newPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordChangeStatus({ success: true, error: '' });
        setPasswordChange({ old: '', newPass: '', confirm: '' });
        showToast('Password updated successfully');
      } else {
        setPasswordChangeStatus({ success: false, error: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setPasswordChangeStatus({ success: false, error: 'Connection error' });
    }
  };

  // Newsletter Sign Up
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      showToast('Subscribed to Cozy Newsletter!');
      setNewsletterEmail('');
    }
  };

  // Contact Submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setContactForm({ name: '', email: '', message: '' });
        setShowContactModal(false);
        showToast('Thank you! Your message was sent.');
      }, 1500);
    }
  };

  // Copy product link to clipboard
  const copyProductLink = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(url);
    showToast('Product link copied to clipboard!');
  };

  // Copy Collection link
  const copyCollectionLink = (col: OutfitCollection, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/the-look/${col.slug}`;
    navigator.clipboard.writeText(url);
    showToast('Collection link copied to clipboard!');
  };

  // Share to social triggers
  const triggerPinterestShare = (url: string, media: string, description: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pinUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(media)}&description=${encodeURIComponent(description)}`;
    window.open(pinUrl, '_blank');
  };

  // Filter products on the visitor view
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Admin filter
      if (!isAdminLoggedIn && p.status !== 'active') return false;

      // Category match
      if (activeCategorySlug !== 'all') {
        const cat = categories.find(c => c.slug === activeCategorySlug);
        if (cat && p.category !== cat.id) return false;
      }

      // Store filter
      if (activeStore !== 'all' && p.storeName.toLowerCase() !== activeStore.toLowerCase()) return false;

      // Badge filter
      if (activeBadge !== 'all' && p.badge !== activeBadge) return false;

      // Max price
      if (p.price > priceRange) return false;

      // Search keyword matching
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low_high') return a.price - b.price;
      if (sortBy === 'price_high_low') return b.price - a.price;
      if (sortBy === 'trending') return (b.clickCount || 0) - (a.clickCount || 0);
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.displayOrder - b.displayOrder;
    });
  }, [products, categories, activeCategorySlug, activeStore, activeBadge, priceRange, searchQuery, sortBy, isAdminLoggedIn]);

  // Selected single product detail entity
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Similar Products for details page
  const similarProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products
      .filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category && p.status === 'active')
      .slice(0, 4);
  }, [products, selectedProduct]);

  // Unique stores available for filter dropdown
  const storeNames = useMemo(() => {
    const list = products.map(p => p.storeName).filter(Boolean);
    return Array.from(new Set(list));
  }, [products]);

  // CRUDS Operations for Categories, Products & Collections
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError(''); setCrudSuccess('');
    if (!editingCategory?.name || !editingCategory?.slug) {
      setCrudError('Name and Slug are required.');
      return;
    }
    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory);
        setCrudSuccess('Category updated successfully!');
      } else {
        await api.createCategory(editingCategory);
        setCrudSuccess('Category created successfully!');
      }
      setEditingCategory(null);
      loadData();
    } catch (err: any) {
      setCrudError(err.message || 'Failed to save category');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { type, id } = deleteConfirmation;
    setDeleteConfirmation(null);
    try {
      if (type === 'category') {
        await api.deleteCategory(id);
        showToast('Category deleted successfully');
      } else if (type === 'product') {
        await api.deleteProduct(id);
        showToast('Product deleted');
      } else if (type === 'collection') {
        await api.deleteCollection(id);
        showToast('Outfit collection deleted');
      }
      loadData();
    } catch (err) {
      showToast(`Failed to delete ${type}`);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setDeleteConfirmation({
      type: 'category',
      id,
      message: 'Are you sure you want to delete this category? This will un-categorize associated products.'
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError(''); setCrudSuccess('');
    if (!editingProduct?.title || !editingProduct?.storeName || !editingProduct?.affiliateLink) {
      setCrudError('Title, Store, and Affiliate Link are required.');
      return;
    }
    try {
      // Split tags by comma
      const formattedTags = typeof editingProduct.tags === 'string'
        ? (editingProduct.tags as string).split(',').map(t => t.trim()).filter(Boolean)
        : editingProduct.tags || [];

      // Split sizes
      const formattedSizes = typeof editingProduct.availableSizes === 'string'
        ? (editingProduct.availableSizes as string).split(',').map(s => s.trim()).filter(Boolean)
        : editingProduct.availableSizes || ['One Size'];

      // Multiple images from comma separated string
      const formattedImages = typeof editingProduct.images === 'string'
        ? (editingProduct.images as string).split(',').map(img => img.trim()).filter(Boolean)
        : editingProduct.images || [];

      const payload = {
        ...editingProduct,
        tags: formattedTags,
        availableSizes: formattedSizes,
        images: formattedImages.length > 0 ? formattedImages : ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600'],
        price: Number(editingProduct.price || 0),
        originalPrice: Number(editingProduct.originalPrice || 0),
        discount: Number(editingProduct.discount || 0),
        displayOrder: Number(editingProduct.displayOrder || 10)
      };

      if (payload.id) {
        await api.updateProduct(payload.id, payload);
        setCrudSuccess('Product updated successfully!');
      } else {
        await api.createProduct(payload);
        setCrudSuccess('Product created successfully!');
      }
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      setCrudError(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteConfirmation({
      type: 'product',
      id,
      message: 'Delete this product? This will also remove it from outfit collections.'
    });
  };

  const handleDuplicateProduct = async (id: string) => {
    try {
      await api.duplicateProduct(id);
      showToast('Product duplicated (set as hidden copy)');
      loadData();
    } catch (err) {
      showToast('Failed to duplicate product');
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError(''); setCrudSuccess('');
    if (!editingCollection?.title || !editingCollection?.slug) {
      setCrudError('Title and Slug are required.');
      return;
    }
    try {
      const payload = {
        ...editingCollection,
        productIds: editingCollection.productIds || [],
        displayOrder: Number(editingCollection.displayOrder || 10)
      };
      if (payload.id) {
        await api.updateCollection(payload.id, payload);
        setCrudSuccess('Outfit collection updated!');
      } else {
        await api.createCollection(payload);
        setCrudSuccess('Outfit collection created!');
      }
      setEditingCollection(null);
      loadData();
    } catch (err: any) {
      setCrudError(err.message || 'Failed to save collection');
    }
  };

  const handleDeleteCollection = (id: string) => {
    setDeleteConfirmation({
      type: 'collection',
      id,
      message: 'Delete this outfit collection?'
    });
  };

  // Toggle products within an outfit collection editor
  const toggleProductInCollection = (prodId: string) => {
    if (!editingCollection) return;
    const currentIds = editingCollection.productIds || [];
    const updatedIds = currentIds.includes(prodId)
      ? currentIds.filter(id => id !== prodId)
      : [...currentIds, prodId];
    setEditingCollection({ ...editingCollection, productIds: updatedIds });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#4A443F] font-sans selection:bg-[#D5BDAF] selection:text-[#FAF7F2] relative overflow-x-hidden flex flex-col">
      {/* Dynamic Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#2D2926] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-2 border border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E3D5CA]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#2D2926]/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-[2rem] p-6 border border-[#E3D5CA]/50 shadow-xl space-y-5 mx-4"
            >
              <div className="space-y-2 text-center">
                <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#2D2926]">Confirm Deletion</h3>
                <p className="text-xs text-[#7A736E] leading-relaxed">
                  {deleteConfirmation.message}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E3D5CA]/50 text-xs font-semibold text-[#4A443F] hover:bg-[#FAF7F2] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-24 -right-24 w-80 h-80 bg-[#E3D5CA]/25 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-24 -left-24 w-96 h-96 bg-[#D5BDAF]/20 blur-[140px] rounded-full -z-10 pointer-events-none" />

      {/* Modern High-End Sticky Header */}
      <nav id="navbar" className="h-20 px-6 md:px-12 flex items-center justify-between glass sticky top-0 z-40 transition-all border-b border-white/30">
        <div className="flex items-center gap-8 md:gap-12">
          <span 
            onClick={handleBack}
            className="font-serif text-2xl font-bold tracking-tight text-[#2D2926] cursor-pointer hover:opacity-80 transition-opacity"
          >
            The Cozy Cart
          </span>
          <div className="hidden lg:flex gap-8 text-xs uppercase tracking-[0.2em] font-semibold opacity-70">
            <button onClick={() => { setView('home'); setActiveCategorySlug('all'); }} className="hover:text-[#2D2926] transition-colors">Curations</button>
            <button onClick={() => { setView('home'); document.getElementById('shop-the-look')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#2D2926] transition-colors">Shop the Look</button>
            <button onClick={() => { setView('home'); document.getElementById('categories-grid')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#2D2926] transition-colors">Categories</button>
            <button onClick={() => setView('about-disclaimer')} className="hover:text-[#2D2926] transition-colors">Disclosures</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="Instant Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-1.5 pl-9 bg-white/40 border border-white/60 rounded-full text-xs text-[#2D2926] focus:outline-none focus:border-[#D5BDAF] focus:bg-white/90 w-44 lg:w-60 transition-all placeholder:text-[#4A443F]/50 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-[#4A443F]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Admin Control Header Button */}
          {isAdminLoggedIn ? (
            <button 
              onClick={() => { setView('admin-dashboard'); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#D5BDAF] to-[#E3D5CA] text-[#2D2926] hover:shadow-md rounded-full text-xs font-bold tracking-wider transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DASHBOARD</span>
            </button>
          ) : (
            <button 
              onClick={() => setView('admin-login')} 
              className="p-2.5 bg-white/50 border border-white/80 hover:bg-[#2D2926] hover:text-white rounded-full transition-all text-[#2D2926]"
              title="Admin Login"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Wishlist Sidebar Count Button */}
          <button 
            onClick={() => {
              showToast(`You have saved ${wishlist.length} picks! Use filters or checkout categories to explore more.`);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2D2926] text-[#FAF7F2] rounded-full text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity"
          >
            <Heart className={`w-3.5 h-3.5 ${wishlist.length > 0 ? 'fill-[#FFF5F5] text-[#FFF5F5]' : ''}`} />
            <span>WISH LIST</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] ml-1 font-bold">{wishlist.length}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Areas */}
      <div className="flex-1">
        {/* VIEW: HOME */}
        {view === 'home' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-16"
          >
            {/* HERO SECTION */}
            <div className="px-6 md:px-12 pt-8 md:pt-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-[#E3D5CA] rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">
                  <Sparkles className="w-3 h-3 text-[#D5BDAF]" />
                  <span>Luxurious Lifestyle Curation</span>
                </div>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-[#2D2926] leading-[1.05] tracking-tight">
                  Curated <br />
                  <span className="italic font-normal text-[#D5BDAF]">Fashion Finds</span> <br />
                  You'll Love
                </h1>
                <p className="text-sm md:text-base leading-relaxed text-[#7A736E] max-w-md">
                  Browse affordable luxury outfits, premium home decor & viral boutique picks, carefully sourced from Amazon, Myntra, Nykaa, and more. Direct affiliate links for instant aesthetic upgrades.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button 
                    onClick={() => document.getElementById('shop-the-look')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 bg-[#D5BDAF] text-[#4A443F] rounded-2xl font-semibold shadow-soft hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-sm"
                  >
                    Explore Collections
                  </button>
                  <button 
                    onClick={() => document.getElementById('categories-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 bg-white/80 border border-[#E3D5CA] text-[#4A443F] rounded-2xl font-semibold shadow-soft hover:bg-[#FAF0E6] transition-all duration-300 text-sm"
                  >
                    Browse Categories
                  </button>
                </div>
              </div>

              {/* Aesthetic Floating Image Collage */}
              <div className="lg:col-span-7 grid grid-cols-12 gap-4 relative">
                <div className="col-span-8 overflow-hidden rounded-[3rem] shadow-soft relative group aspect-[4/3] bg-[#E3D5CA]/40">
                  <img 
                    src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800" 
                    alt="Aesthetic lifestyle look" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-black/10 pinterest-gradient" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded backdrop-blur-md">Shop the Look</span>
                    <h3 className="font-serif text-lg mt-1 font-bold">Parisian Chic Minimal</h3>
                  </div>
                </div>
                <div className="col-span-4 overflow-hidden rounded-[2.5rem] shadow-soft relative aspect-[3/4] self-end bg-[#D5BDAF]/30 transform translate-y-6">
                  <img 
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600" 
                    alt="Pastel aesthetic" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* QUICK SEARCH & FILTERS PANEL */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
              <div className="bg-white/60 rounded-[2.5rem] p-6 border border-white shadow-soft space-y-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                  <div className="w-full lg:w-1/3 relative">
                    <input 
                      type="text" 
                      placeholder="Search tops, linen, bags, jewellery..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-3 pl-11 bg-[#FAF7F2]/80 border border-[#E3D5CA]/50 rounded-2xl text-xs text-[#2D2926] focus:outline-none focus:border-[#D5BDAF] focus:bg-white transition-all font-medium"
                    />
                    <Search className="w-4 h-4 text-[#4A443F]/50 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center justify-start lg:justify-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mr-2">Filters:</span>
                    <select 
                      value={activeStore}
                      onChange={(e) => setActiveStore(e.target.value)}
                      className="px-3 py-1.5 bg-white/80 border border-[#E3D5CA]/50 rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#D5BDAF]"
                    >
                      <option value="all">All Stores</option>
                      {storeNames.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>

                    <select 
                      value={activeBadge}
                      onChange={(e) => setActiveBadge(e.target.value)}
                      className="px-3 py-1.5 bg-white/80 border border-[#E3D5CA]/50 rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#D5BDAF]"
                    >
                      <option value="all">All Badges</option>
                      <option value="Trending">Trending</option>
                      <option value="Best Seller">Best Seller</option>
                      <option value="New">New</option>
                      <option value="Editor's Pick">Editor's Pick</option>
                      <option value="Limited Deal">Limited Deal</option>
                    </select>

                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 bg-white/80 border border-[#E3D5CA]/50 rounded-xl text-xs text-[#4A443F] focus:outline-none focus:border-[#D5BDAF]"
                    >
                      <option value="default">Default Order</option>
                      <option value="price_low_high">Price: Low to High</option>
                      <option value="price_high_low">Price: High to Low</option>
                      <option value="trending">Popularity</option>
                      <option value="newest">Latest Added</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-2 border-t border-[#E3D5CA]/20">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategorySlug('all');
                        setActiveStore('all');
                        setActiveBadge('all');
                        setPriceRange(99999999);
                        setSortBy('default');
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#D5BDAF] hover:text-[#4A443F] transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORIES GRID SECTION */}
            <div id="categories-grid" className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Sensory Exploration</span>
                  <h2 className="font-serif text-3xl text-[#2D2926] mt-1">Browse Categories</h2>
                </div>
                <button 
                  onClick={() => { setActiveCategorySlug('all'); }} 
                  className="text-xs font-bold tracking-widest text-[#2D2926] uppercase hover:opacity-75 flex items-center gap-1 transition-opacity"
                >
                  <span>See All Picks</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* 'All' category card */}
                <div 
                  onClick={() => setActiveCategorySlug('all')}
                  className={`cursor-pointer group rounded-3xl p-4 transition-all duration-300 border ${
                    activeCategorySlug === 'all' 
                      ? 'bg-gradient-to-br from-[#FAF0E6] to-[#FAF7F2] border-[#D5BDAF] shadow-soft scale-[1.02]' 
                      : 'bg-white/40 border-transparent hover:bg-white/80'
                  }`}
                >
                  <div className="w-12 h-12 bg-[#FAF0E6] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-5 h-5 text-[#D5BDAF]" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#2D2926]">All Curations</h3>
                  <p className="text-[10px] text-[#7A736E] mt-1 uppercase tracking-wider">{products.length} Products</p>
                </div>

                {categories.map(cat => {
                  const IconComp = IconMap[cat.icon] || Sparkles;
                  return (
                    <div 
                      key={cat.id}
                      onClick={() => {
                        setActiveCategorySlug(cat.slug);
                        document.getElementById('product-list-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`cursor-pointer group rounded-3xl p-4 transition-all duration-300 border ${
                        activeCategorySlug === cat.slug 
                          ? 'bg-gradient-to-br from-[#FAF0E6] to-[#FAF7F2] border-[#D5BDAF] shadow-soft scale-[1.02]' 
                          : 'bg-white/40 border-transparent hover:bg-white/80'
                      }`}
                    >
                      <div className="w-12 h-12 bg-[#FAF0E6] rounded-2xl overflow-hidden mb-4 relative">
                        <img 
                          src={cat.image} 
                          alt={cat.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-[#D5BDAF]/20 flex items-center justify-center">
                          <IconComp className="w-5 h-5 text-[#FAF7F2] drop-shadow-sm" />
                        </div>
                      </div>
                      <h3 className="font-serif text-base font-bold text-[#2D2926] line-clamp-1">{cat.name}</h3>
                      <p className="text-[10px] text-[#7A736E] mt-1 uppercase tracking-wider">{cat.productCount || 0} Products</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SHOP THE LOOK (OUTFIT COLLECTIONS) SECTION */}
            <div id="shop-the-look" className="max-w-7xl mx-auto px-6 md:px-12 pt-4">
              <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Most Loved Feature</span>
                <h2 className="font-serif text-4xl text-[#2D2926]">Shop The Complete Look</h2>
                <p className="text-xs text-[#7A736E] leading-relaxed">
                  Avoid matching anxiety. Get beautifully cohesive outfit combinations in one tap. Every component is directly linked.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {collections.map(col => (
                  <div 
                    key={col.id}
                    onClick={() => openCollectionDetail(col.slug)}
                    className="group cursor-pointer rounded-[2.5rem] bg-white border border-white/50 shadow-soft overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden relative bg-[#FAF0E6]">
                      <img 
                        src={col.coverImage} 
                        alt={col.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                      
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={(e) => copyCollectionLink(col, e)}
                          className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-[#2D2926] hover:text-white transition-colors"
                          title="Copy Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => triggerPinterestShare(`${window.location.origin}/the-look/${col.slug}`, col.coverImage, col.description, e)}
                          className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-[#E60023] hover:text-white transition-colors"
                          title="Share to Pinterest"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="absolute bottom-4 left-4 bg-white/25 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                        {col.productIds.length} Linked Picks
                      </span>
                    </div>

                    <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-[#D5BDAF] uppercase tracking-widest">#{col.slug}</div>
                        <h3 className="font-serif text-xl text-[#2D2926] group-hover:text-[#D5BDAF] transition-colors">{col.title}</h3>
                        <p className="text-xs text-[#7A736E] line-clamp-2 leading-relaxed">{col.description}</p>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-[#FAF7F2]">
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-55">Popularity: {col.clickCount || 0} taps</span>
                        <span className="text-xs font-bold text-[#2D2926] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span>See Outfits</span>
                          <ChevronRight className="w-4 h-4 text-[#D5BDAF]" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRODUCT CURATIONS LIST SECTION */}
            <div id="product-list-section" className="max-w-7xl mx-auto px-6 md:px-12 pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Handpicked Sensations</span>
                  <h2 className="font-serif text-3xl text-[#2D2926] mt-1">
                    {activeCategorySlug === 'all' 
                      ? 'The Cozy Library' 
                      : categories.find(c => c.slug === activeCategorySlug)?.name || 'Curated Finds'
                    }
                  </h2>
                </div>
                <div className="text-xs text-[#7A736E] font-medium uppercase tracking-widest">
                  Showing {filteredProducts.length} premium picks
                </div>
              </div>

              {/* PRODUCTS GRID */}
              {filteredProducts.length === 0 ? (
                <div className="p-16 text-center bg-white/40 rounded-[2.5rem] border border-[#E3D5CA]/40 max-w-xl mx-auto space-y-4">
                  <ShoppingBag className="w-12 h-12 text-[#D5BDAF] mx-auto opacity-50" />
                  <h3 className="font-serif text-lg font-bold text-[#2D2926]">No products found matching your filters</h3>
                  <p className="text-xs text-[#7A736E] leading-relaxed">
                    Try clearing some tags or reducing the search query.
                  </p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategorySlug('all');
                      setActiveStore('all');
                      setActiveBadge('all');
                      setPriceRange(99999999);
                    }}
                    className="px-6 py-2 bg-[#D5BDAF] text-[#4A443F] text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-md transition-shadow"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map(prod => (
                    <div 
                      key={prod.id}
                      onClick={() => openProductDetail(prod.id)}
                      className="group cursor-pointer bg-white rounded-3xl border border-white shadow-soft overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Product Card Image Container */}
                      <div className="aspect-[1/1] w-full overflow-hidden relative bg-[#FAF0E6]">
                        <img 
                          src={prod.images[0]} 
                          alt={prod.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/5 pinterest-gradient opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Badges and wishlist overlay */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {prod.badge && (
                            <span className="px-2.5 py-1 bg-white text-[#2D2926] text-[8px] font-bold tracking-widest uppercase rounded-md shadow-sm">
                              {prod.badge}
                            </span>
                          )}
                          <span className="px-2.5 py-1 bg-[#FAF0E6] text-[#4A443F] text-[8px] font-bold tracking-widest uppercase rounded-md shadow-sm">
                            {prod.storeName}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => toggleWishlist(prod.id, e)}
                          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-transform"
                        >
                          <Heart className={`w-3.5 h-3.5 ${wishlist.includes(prod.id) ? 'fill-[#E3D5CA] text-[#D5BDAF]' : 'text-[#4A443F]'}`} />
                        </button>
                      </div>

                      {/* Info & Price */}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#D5BDAF] uppercase tracking-widest font-bold">
                            {categories.find(c => c.id === prod.category)?.name || 'Premium curation'}
                          </span>
                          <h3 className="font-serif text-base text-[#2D2926] group-hover:text-[#D5BDAF] transition-colors line-clamp-1">{prod.title}</h3>
                          <p className="text-xs text-[#7A736E] line-clamp-2 leading-relaxed">{prod.shortDescription}</p>
                        </div>

                        <div className="pt-3 border-t border-[#FAF7F2] space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-bold text-[#2D2926]">₹{prod.price}</span>
                              {prod.originalPrice > prod.price && (
                                <span className="text-xs line-through text-[#7A736E]/60">₹{prod.originalPrice}</span>
                              )}
                            </div>
                            {prod.discount > 0 && (
                              <span className="text-[10px] bg-[#FFF5F5] text-[#D5BDAF] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                {prod.discount}% Off
                              </span>
                            )}
                          </div>

                          {/* Affiliate Button */}
                          <a 
                            href={prod.affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              api.recordProductClick(prod.id);
                            }}
                            className="w-full py-2.5 px-4 bg-[#FAF0E6] text-[#4A443F] group-hover:bg-[#2D2926] group-hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1 transition-all"
                          >
                            <span>Shop on {prod.storeName}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ, ABOUT, CONTACT, NEWSLETTER SUB-SECTION */}
            <div className="bg-[#FAF0E6]/50 border-t border-[#E3D5CA]/30 py-16">
              <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* About & Newsletter column */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Sensory Lifestyle</span>
                    <h2 className="font-serif text-3xl text-[#2D2926]">The Cozy Journal</h2>
                    <p className="text-xs text-[#7A736E] leading-relaxed max-w-sm">
                      We hunt the corners of the digital space to find the most premium, budget-friendly lifestyle gems. Subscribe to receive hand-curated design templates, viral clothing find alerts, and aesthetic inspirations.
                    </p>
                  </div>

                  {newsletterSubscribed ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-white rounded-2xl border border-[#D5BDAF]/20 flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <span className="text-xs font-semibold text-[#2D2926]">You are on the Cozy list! Look out for weekly curations.</span>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                      <input 
                        type="email" 
                        required
                        placeholder="Your cozy email..." 
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#E3D5CA]/50 text-xs text-[#2D2926] focus:outline-none focus:border-[#D5BDAF]"
                      />
                      <button 
                        type="submit"
                        className="px-5 py-3 bg-[#2D2926] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#D5BDAF] hover:text-[#4A443F] transition-all"
                      >
                        Subscribe
                      </button>
                    </form>
                  )}

                  <div className="flex gap-4 text-xs font-semibold text-[#4A443F]/70">
                    <button onClick={() => setView('about-disclaimer')} className="hover:text-[#2D2926] underline">Affiliate Disclaimer</button>
                    <span>•</span>
                    <button onClick={() => setView('about-disclaimer')} className="hover:text-[#2D2926] underline">Privacy & Terms</button>
                    <span>•</span>
                    <button onClick={() => setShowContactModal(true)} className="hover:text-[#2D2926] underline">Contact</button>
                  </div>
                </div>

                {/* FAQ Column */}
                <div className="lg:col-span-7 space-y-6">
                  <h3 className="font-serif text-xl text-[#2D2926]">Frequently Inquired</h3>
                  <div className="space-y-4">
                    <div className="bg-white/40 p-5 rounded-2xl border border-white/50 space-y-1">
                      <h4 className="text-xs font-bold text-[#2D2926] uppercase tracking-wider flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-[#D5BDAF]" />
                        <span>Is this an online store? Can I buy here?</span>
                      </h4>
                      <p className="text-xs text-[#7A736E] leading-relaxed pl-5">
                        No. The Cozy Cart is a handpicked <strong>affiliate curation catalog</strong>. We design outfit aesthetics and link each piece directly to their original retailers (Amazon, Myntra, etc.) where you can securely make purchases.
                      </p>
                    </div>

                    <div className="bg-white/40 p-5 rounded-2xl border border-white/50 space-y-1">
                      <h4 className="text-xs font-bold text-[#2D2926] uppercase tracking-wider flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-[#D5BDAF]" />
                        <span>Do you charge extra on the affiliate links?</span>
                      </h4>
                      <p className="text-xs text-[#7A736E] leading-relaxed pl-5">
                        Absolutely not. Clicking through our links does not cost you any additional money. Original store discounts, coupon codes, and rewards remain 100% applicable.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: PRODUCT DETAILS PAGE */}
        {view === 'product-detail' && selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-6 py-8 space-y-12"
          >
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2D2926] hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Curations</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 bg-white rounded-[3rem] p-6 md:p-8 border border-white/70 shadow-soft">
              {/* Product Gallery Section */}
              <div className="md:col-span-6 space-y-4">
                <div className="aspect-square bg-[#FAF0E6] rounded-[2rem] overflow-hidden relative shadow-inner">
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.title} 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Store: {selectedProduct.storeName}
                  </span>
                </div>
                {selectedProduct.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {selectedProduct.images.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-[#FAF0E6] rounded-xl overflow-hidden cursor-pointer hover:border-[#D5BDAF] border border-transparent">
                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info Description Section */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#FAF0E6] text-[#4A443F] text-[9px] font-bold tracking-widest uppercase rounded">
                      {selectedProduct.storeName}
                    </span>
                    {selectedProduct.badge && (
                      <span className="px-2.5 py-1 bg-[#D5BDAF]/20 text-[#2D2926] text-[9px] font-bold tracking-widest uppercase rounded">
                        {selectedProduct.badge}
                      </span>
                    )}
                  </div>

                  <h1 className="font-serif text-3xl md:text-4xl text-[#2D2926] font-bold tracking-tight">
                    {selectedProduct.title}
                  </h1>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-[#2D2926]">₹{selectedProduct.price}</span>
                    {selectedProduct.originalPrice > selectedProduct.price && (
                      <span className="text-sm line-through text-[#7A736E]/60">₹{selectedProduct.originalPrice}</span>
                    )}
                    {selectedProduct.discount > 0 && (
                      <span className="text-xs bg-[#FFF5F5] text-[#D5BDAF] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {selectedProduct.discount}% discount
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2D2926]">Product Journal</h3>
                    <p className="text-sm text-[#7A736E] leading-relaxed">
                      {selectedProduct.detailedDescription || selectedProduct.shortDescription}
                    </p>
                  </div>

                  {/* Attributes Spec */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#FAF7F2] text-xs">
                    <div>
                      <span className="text-[#7A736E] block">Brand Choice</span>
                      <span className="font-bold text-[#2D2926]">{selectedProduct.brand || 'Bespoke design'}</span>
                    </div>
                    <div>
                      <span className="text-[#7A736E] block">Material Detail</span>
                      <span className="font-bold text-[#2D2926]">{selectedProduct.material || 'Organic cotton / linen'}</span>
                    </div>
                    <div>
                      <span className="text-[#7A736E] block">Aesthetic Color</span>
                      <span className="font-bold text-[#2D2926]">{selectedProduct.color || 'Beige / Cream'}</span>
                    </div>
                    <div>
                      <span className="text-[#7A736E] block">Available Sizes</span>
                      <span className="font-bold text-[#2D2926]">{selectedProduct.availableSizes.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-4 pt-4 border-t border-[#FAF7F2]">
                  <div className="flex gap-4">
                    <a 
                      href={selectedProduct.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-4 bg-[#2D2926] text-white hover:bg-[#D5BDAF] hover:text-[#4A443F] text-xs font-bold uppercase tracking-wider rounded-2xl text-center flex items-center justify-center gap-1.5 transition-all shadow-soft"
                    >
                      <span>Secure Checkout on {selectedProduct.storeName}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>

                    <button 
                      onClick={() => toggleWishlist(selectedProduct.id)}
                      className="p-4 bg-[#FAF0E6] text-[#4A443F] hover:bg-white border border-[#E3D5CA]/30 rounded-2xl"
                      title="Save item"
                    >
                      <Heart className={`w-5 h-5 ${wishlist.includes(selectedProduct.id) ? 'fill-[#E3D5CA] text-[#D5BDAF]' : ''}`} />
                    </button>
                  </div>

                  {/* Share option triggers */}
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#7A736E]/60 pt-2">
                    <span>*Redirects to official {selectedProduct.storeName} affiliate storefront</span>
                    <div className="flex gap-4 items-center">
                      <button 
                        onClick={(e) => copyProductLink(selectedProduct, e)}
                        className="hover:text-[#2D2926] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </button>
                      <span>|</span>
                      <button 
                        onClick={(e) => triggerPinterestShare(`${window.location.origin}/?product=${selectedProduct.id}`, selectedProduct.images[0], selectedProduct.shortDescription, e)}
                        className="hover:text-[#E60023] flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Pin Outfit</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Products Section */}
            {similarProducts.length > 0 && (
              <div className="space-y-6 pt-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Aesthetic Harmony</span>
                  <h3 className="font-serif text-2xl text-[#2D2926]">You Might Also Adore</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {similarProducts.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => openProductDetail(p.id)}
                      className="group cursor-pointer bg-white/40 p-3 rounded-2xl border border-transparent hover:border-white hover:bg-white hover:shadow-soft transition-all duration-300"
                    >
                      <div className="aspect-square bg-[#FAF0E6] rounded-xl overflow-hidden mb-3">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h4 className="font-serif text-sm text-[#2D2926] font-bold truncate">{p.title}</h4>
                      <p className="text-[10px] text-[#D5BDAF] font-bold mt-1">₹{p.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW: OUTFIT DETAILS PAGE ("SHOP THE LOOK") */}
        {view === 'look-detail' && hydratedCollection && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-6xl mx-auto px-6 py-8 space-y-8"
          >
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2D2926] hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Curations</span>
            </button>

            {/* Layout divided into Left beautiful Cover & Right listed shopping items */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Aspect Cover Card */}
              <div className="lg:col-span-5 bg-white rounded-[3rem] overflow-hidden border border-white shadow-soft p-4 space-y-4">
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden relative bg-[#FAF0E6]">
                  <img 
                    src={hydratedCollection.coverImage} 
                    alt={hydratedCollection.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white space-y-1">
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded text-[9px] font-bold tracking-widest uppercase">
                      Pinterest Curated
                    </span>
                    <h1 className="font-serif text-3xl font-bold">{hydratedCollection.title}</h1>
                  </div>
                </div>

                <div className="px-4 py-2 space-y-3">
                  <span className="text-[10px] text-[#D5BDAF] font-bold uppercase tracking-widest">Outfit Inspiration Story</span>
                  <p className="text-xs text-[#7A736E] leading-relaxed">
                    {hydratedCollection.description}
                  </p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-[#FAF7F2] text-[10px] font-bold uppercase tracking-widest">
                    <span className="opacity-55">Total Linked Elements: {hydratedCollection.products.length}</span>
                    <button 
                      onClick={(e) => copyCollectionLink(hydratedCollection, e)}
                      className="text-[#D5BDAF] hover:text-[#2D2926] flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Curation URL</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right linked item stack list */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Shop the Components</span>
                  <h2 className="font-serif text-3xl text-[#2D2926] mt-1">Outfit Elements</h2>
                </div>

                <div className="space-y-4">
                  {hydratedCollection.products.length === 0 ? (
                    <div className="p-12 text-center bg-white/50 border border-[#E3D5CA]/30 rounded-2xl">
                      <p className="text-xs text-[#7A736E]">No products are linked to this outfit currently.</p>
                    </div>
                  ) : (
                    hydratedCollection.products.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => openProductDetail(p.id)}
                        className="group bg-white hover:bg-[#FAF0E6]/30 border border-white hover:border-[#E3D5CA]/40 rounded-3xl p-4 shadow-soft hover:shadow-md transition-all duration-300 flex items-center gap-4 cursor-pointer"
                      >
                        <div className="w-20 h-20 bg-[#FAF0E6] rounded-2xl overflow-hidden shrink-0">
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-bold text-[#D5BDAF] uppercase tracking-widest">{p.storeName}</span>
                              {p.badge && (
                                <span className="text-[8px] bg-[#FAF0E6] text-[#2D2926] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <h3 className="font-serif text-sm font-bold text-[#2D2926] group-hover:text-[#D5BDAF] transition-colors truncate mt-0.5">{p.title}</h3>
                            <p className="text-[11px] text-[#7A736E] line-clamp-1 mt-0.5 leading-relaxed">{p.shortDescription}</p>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#FAF7F2]">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs font-bold text-[#2D2926]">₹{p.price}</span>
                              {p.originalPrice > p.price && (
                                <span className="text-[10px] line-through text-[#7A736E]/60">₹{p.originalPrice}</span>
                              )}
                            </div>

                            <a 
                              href={p.affiliateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                api.recordProductClick(p.id);
                              }}
                              className="px-4 py-1.5 bg-[#FAF0E6] group-hover:bg-[#2D2926] group-hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                            >
                              <span>Shop Component</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* VIEW: ABOUT & AFFILIATE DISCLAIMER */}
        {view === 'about-disclaimer' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-6 py-12 space-y-8"
          >
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2D2926] hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Curations</span>
            </button>

            <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-white shadow-soft space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Legal disclosures & privacy policies</span>
                <h1 className="font-serif text-4xl text-[#2D2926]">Affiliate Disclosures</h1>
              </div>

              <div className="space-y-6 text-sm text-[#7A736E] leading-relaxed">
                <section className="space-y-2">
                  <h2 className="font-serif text-lg text-[#2D2926] font-bold">1. How Affiliate Curations Work</h2>
                  <p>
                    The Cozy Cart is a participant in affiliate marketing programs, including but not limited to the Amazon Services LLC Associates Program, Myntra, Nykaa, and other retail referral arrangements. This means that we feature curated lifestyle elements and outfit pairings, and redirect users to original retailers via affiliate tracking URLs.
                  </p>
                  <p>
                    If you click on an affiliate button and make a purchase on the respective retailer website, we may earn a small referral commission at absolutely <strong>no additional cost to you</strong>.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="font-serif text-lg text-[#2D2926] font-bold">2. Our Aesthetic Commitment</h2>
                  <p>
                    Our curations are driven purely by aesthetic and styling choices. We do not accept sponsorship to promote low-quality products. Every product listed as "Editor's Pick" or "Best Seller" undergoes careful styling review by our virtual design desk to guarantee Pinterest-inspired look quality.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="font-serif text-lg text-[#2D2926] font-bold">3. Privacy and Data Protection</h2>
                  <p>
                    We respect your privacy. The Cozy Cart does not track your credit card credentials, home addresses, or personal shopping accounts. Any transaction, shipping, or returns must be managed directly on the respective retailer platform (e.g. Amazon Customer Support, Ajio Returns).
                  </p>
                </section>
              </div>

              <div className="pt-6 border-t border-[#FAF7F2] text-center">
                <button 
                  onClick={handleBack}
                  className="px-8 py-3 bg-[#2D2926] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#D5BDAF] hover:text-[#4A443F] transition-all"
                >
                  Understood, return to curate
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: ADMIN LOGIN PAGE */}
        {view === 'admin-login' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto px-6 py-16"
          >
            <div className="bg-white rounded-[2.5rem] p-8 border border-white/70 shadow-soft space-y-6">
              <div className="text-center space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D5BDAF]">Internal Desk Access</span>
                <h1 className="font-serif text-2xl text-[#2D2926] font-bold">The Cozy Administrator</h1>
                <p className="text-xs text-[#7A736E]">Verify credentials to manage categories, styles, products, and analytics logs.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A443F]/70">Admin Username</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter admin username" 
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2]/80 border border-[#E3D5CA]/50 text-xs text-[#2D2926] focus:outline-none focus:border-[#D5BDAF] focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A443F]/70">Access Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF7F2]/80 border border-[#E3D5CA]/50 text-xs text-[#2D2926] focus:outline-none focus:border-[#D5BDAF] focus:bg-white"
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-[#FFF5F5] border border-red-200 text-xs text-red-700 rounded-xl font-medium space-y-2">
                    <div>{loginError}</div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const r = await fetch('/api/auth/reset-password', { method: 'POST' });
                          const d = await r.json();
                          if (r.ok && d.success) {
                            showToast('Password reset to 12345678!');
                            setLoginError('Password has been successfully reset to "12345678". Please type "12345678" and try again.');
                          } else {
                            showToast('Failed to reset password.');
                          }
                        } catch (err) {
                          showToast('Error resetting password');
                        }
                      }}
                      className="text-[10px] underline font-bold uppercase tracking-wider text-red-800 hover:text-red-950 block text-left"
                    >
                      Reset Password to Default ("12345678")
                    </button>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-3 bg-[#2D2926] hover:bg-[#D5BDAF] hover:text-[#4A443F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Verify Access Key
                </button>
              </form>

              <div className="pt-4 border-t border-[#FAF7F2] text-center">
                <button 
                  onClick={handleBack}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#7A736E] hover:text-[#2D2926]"
                >
                  Cancel and Return
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {view === 'admin-dashboard' && isAdminLoggedIn && (
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left Sidebar Menu */}
              <div className="lg:w-64 shrink-0 bg-white border border-white/60 rounded-[2.5rem] p-6 shadow-soft space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D5BDAF]">Administrator Role</span>
                  <h2 className="font-serif text-lg font-bold text-[#2D2926] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#D5BDAF]" />
                    <span>Control Panel</span>
                  </h2>
                </div>

                <div className="space-y-1.5">
                  <button 
                    onClick={() => { setAdminActiveTab('dashboard'); setCrudError(''); setCrudSuccess(''); }}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-left flex items-center gap-2 transition-colors ${adminActiveTab === 'dashboard' ? 'bg-[#FAF0E6] text-[#2D2926]' : 'text-[#7A736E] hover:bg-[#FAF7F2]'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Statistics Overview</span>
                  </button>

                  <button 
                    onClick={() => { setAdminActiveTab('products'); setEditingProduct(null); setCrudError(''); setCrudSuccess(''); }}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-left flex items-center gap-2 transition-colors ${adminActiveTab === 'products' ? 'bg-[#FAF0E6] text-[#2D2926]' : 'text-[#7A736E] hover:bg-[#FAF7F2]'}`}
                  >
                    <Shirt className="w-4 h-4" />
                    <span>Products Manager</span>
                  </button>

                  <button 
                    onClick={() => { setAdminActiveTab('categories'); setEditingCategory(null); setCrudError(''); setCrudSuccess(''); }}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-left flex items-center gap-2 transition-colors ${adminActiveTab === 'categories' ? 'bg-[#FAF0E6] text-[#2D2926]' : 'text-[#7A736E] hover:bg-[#FAF7F2]'}`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Categories Manager</span>
                  </button>

                  <button 
                    onClick={() => { setAdminActiveTab('collections'); setEditingCollection(null); setCrudError(''); setCrudSuccess(''); }}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-left flex items-center gap-2 transition-colors ${adminActiveTab === 'collections' ? 'bg-[#FAF0E6] text-[#2D2926]' : 'text-[#7A736E] hover:bg-[#FAF7F2]'}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Looks Creator</span>
                  </button>

                  <button 
                    onClick={() => { setAdminActiveTab('settings'); setCrudError(''); setCrudSuccess(''); }}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-left flex items-center gap-2 transition-colors ${adminActiveTab === 'settings' ? 'bg-[#FAF0E6] text-[#2D2926]' : 'text-[#7A736E] hover:bg-[#FAF7F2]'}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin Settings</span>
                  </button>
                </div>

                <div className="pt-6 border-t border-[#FAF7F2]">
                  <button 
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    Logout Admin
                  </button>
                </div>
              </div>

              {/* Right Tab Contents */}
              <div className="flex-1 bg-white border border-white/60 rounded-[2.5rem] p-6 md:p-8 shadow-soft">
                
                {/* ADMIN TAB: STATISTICS OVERVIEW */}
                {adminActiveTab === 'dashboard' && analytics && (
                  <div className="space-y-8">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Live Analytics Overview</span>
                      <h2 className="font-serif text-3xl text-[#2D2926] mt-1">Platform Performance</h2>
                    </div>

                    {/* Stats Grid Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-white shadow-soft">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Products</span>
                        <div className="text-3xl font-serif font-bold text-[#2D2926] mt-1">{analytics.totalProducts}</div>
                      </div>
                      <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-white shadow-soft">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Categories Curated</span>
                        <div className="text-3xl font-serif font-bold text-[#2D2926] mt-1">{analytics.totalCategories}</div>
                      </div>
                      <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-white shadow-soft">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Looks Created</span>
                        <div className="text-3xl font-serif font-bold text-[#2D2926] mt-1">{analytics.totalCollections}</div>
                      </div>
                      <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-white shadow-soft">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Redirection Clicks</span>
                        <div className="text-3xl font-serif font-bold text-[#2D2926] mt-1">{analytics.totalClicks}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Top Clicked Products */}
                      <div className="space-y-4">
                        <h3 className="font-serif text-lg font-bold text-[#2D2926]">Top Redirection Products</h3>
                        <div className="space-y-3">
                          {analytics.mostClickedProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-3 bg-[#FAF7F2]/50 rounded-xl">
                              <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-[#2D2926] truncate">{p.title}</h4>
                                <p className="text-[10px] text-[#7A736E]">Store: {p.storeName} | Price: ₹{p.price}</p>
                              </div>
                              <span className="px-2 py-1 bg-white text-[10px] font-bold text-[#2D2926] rounded-md shrink-0">
                                {p.clickCount || 0} taps
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recently Added */}
                      <div className="space-y-4">
                        <h3 className="font-serif text-lg font-bold text-[#2D2926]">Recently Added Products</h3>
                        <div className="space-y-3">
                          {analytics.recentlyAddedProducts.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-3 bg-[#FAF7F2]/50 rounded-xl">
                              <img src={p.images[0]} alt={p.title} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-[#2D2926] truncate">{p.title}</h4>
                                <p className="text-[10px] text-[#7A736E]">Added {new Date(p.createdAt).toLocaleDateString()}</p>
                              </div>
                              <span className="text-[9px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded uppercase">
                                {p.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADMIN TAB: CATEGORIES MANAGER */}
                {adminActiveTab === 'categories' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Categories Registry</span>
                        <h2 className="font-serif text-3xl text-[#2D2926] mt-1">Manage Categories</h2>
                      </div>
                      {!editingCategory && (
                        <button 
                          onClick={() => setEditingCategory({ name: '', slug: '', description: '', image: '', banner: '', status: 'active', displayOrder: 1 })}
                          className="px-4 py-2 bg-[#2D2926] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1 hover:bg-[#D5BDAF]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Category</span>
                        </button>
                      )}
                    </div>

                    {/* Category CRUD Form */}
                    {editingCategory && (
                      <form onSubmit={handleSaveCategory} className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E3D5CA]/50 space-y-4">
                        <h3 className="font-serif text-lg text-[#2D2926] font-bold">
                          {editingCategory.id ? `Edit Category: ${editingCategory.name}` : 'New Category Configuration'}
                        </h3>

                        {crudError && <div className="p-3 bg-red-50 text-xs text-[#D5BDAF] rounded-xl">{crudError}</div>}
                        {crudSuccess && <div className="p-3 bg-green-50 text-xs text-green-700 rounded-xl">{crudSuccess}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Category Name *</label>
                            <input 
                              type="text" 
                              required
                              value={editingCategory.name || ''}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Slug (Auto-generated) *</label>
                            <input 
                              type="text" 
                              required
                              value={editingCategory.slug || ''}
                              onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2 py-2">
                            <ImageUpload 
                              label="Category Image (Card preview)" 
                              value={editingCategory.image || ''} 
                              onChange={(val) => setEditingCategory({ ...editingCategory, image: val })} 
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2 py-2">
                            <ImageUpload 
                              label="Category Banner Image (Hero banner)" 
                              value={editingCategory.banner || ''} 
                              onChange={(val) => setEditingCategory({ ...editingCategory, banner: val })} 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Display order</label>
                            <input 
                              type="number" 
                              value={editingCategory.displayOrder || 10}
                              onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Status</label>
                            <select 
                              value={editingCategory.status || 'active'}
                              onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value as any })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            >
                              <option value="active">Active (Visible)</option>
                              <option value="inactive">Inactive (Hidden)</option>
                            </select>
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase">Short Description</label>
                            <textarea 
                              rows={2}
                              value={editingCategory.description || ''}
                              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <button 
                            type="button" 
                            onClick={() => setEditingCategory(null)}
                            className="px-4 py-2 bg-white border rounded-xl text-xs uppercase tracking-wider"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-[#2D2926] text-white rounded-xl text-xs uppercase tracking-wider"
                          >
                            Save Category
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Category list table */}
                    <div className="overflow-x-auto border rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#FAF7F2] border-b text-[10px] uppercase tracking-widest font-bold">
                            <th className="p-4">Name</th>
                            <th className="p-4">Slug</th>
                            <th className="p-4">Display Order</th>
                            <th className="p-4">Products Linked</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map(c => (
                            <tr key={c.id} className="border-b hover:bg-[#FAF7F2]/50">
                              <td className="p-4 font-bold text-[#2D2926]">{c.name}</td>
                              <td className="p-4">{c.slug}</td>
                              <td className="p-4">{c.displayOrder}</td>
                              <td className="p-4 font-semibold">{c.productCount || 0} Products</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button 
                                  onClick={() => setEditingCategory(c)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCategory(c.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN TAB: PRODUCTS MANAGER */}
                {adminActiveTab === 'products' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Catalog Warehouse</span>
                        <h2 className="font-serif text-3xl text-[#2D2926] mt-1">Manage Products</h2>
                      </div>
                      {!editingProduct && (
                        <button 
                          onClick={() => setEditingProduct({ title: '', shortDescription: '', detailedDescription: '', images: [], price: 0, originalPrice: 0, discount: 0, storeName: 'Amazon', affiliateLink: '', category: categories[0]?.id || '', tags: [], badge: '', color: '', availableSizes: [], material: '', brand: '', displayOrder: 10, status: 'active' })}
                          className="px-4 py-2 bg-[#2D2926] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1 hover:bg-[#D5BDAF]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Product</span>
                        </button>
                      )}
                    </div>

                    {/* Product Form CRUD */}
                    {editingProduct && (
                      <form onSubmit={handleSaveProduct} className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E3D5CA]/50 space-y-4">
                        <h3 className="font-serif text-lg text-[#2D2926] font-bold">
                          {editingProduct.id ? `Edit Product details: ${editingProduct.title}` : 'Build New Product Card'}
                        </h3>

                        {crudError && <div className="p-3 bg-red-50 text-xs text-[#D5BDAF] rounded-xl">{crudError}</div>}
                        {crudSuccess && <div className="p-3 bg-green-50 text-xs text-green-700 rounded-xl">{crudSuccess}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Product Title *</label>
                            <input 
                              type="text" required
                              value={editingProduct.title || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Store Name *</label>
                            <select 
                              value={editingProduct.storeName || 'Amazon'}
                              onChange={(e) => setEditingProduct({ ...editingProduct, storeName: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            >
                              <option value="Amazon">Amazon</option>
                              <option value="Myntra">Myntra</option>
                              <option value="Flipkart">Flipkart</option>
                              <option value="Ajio">Ajio</option>
                              <option value="Meesho">Meesho</option>
                              <option value="Nykaa Fashion">Nykaa Fashion</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Category *</label>
                            <select 
                              value={editingProduct.category || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            >
                              <option value="">Select Category</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-1 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold uppercase">Direct Affiliate tracking Link *</label>
                            <input 
                              type="text" required
                              placeholder="https://..."
                              value={editingProduct.affiliateLink || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, affiliateLink: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Discounted Price (₹) *</label>
                            <input 
                              type="number" required
                              value={editingProduct.price || 0}
                              onChange={(e) => {
                                const price = Number(e.target.value);
                                const orig = editingProduct.originalPrice || price;
                                const discount = orig > 0 ? Math.round(((orig - price) / orig) * 100) : 0;
                                setEditingProduct({ ...editingProduct, price, discount });
                              }}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Original Price (₹)</label>
                            <input 
                              type="number"
                              value={editingProduct.originalPrice || 0}
                              onChange={(e) => {
                                const orig = Number(e.target.value);
                                const price = editingProduct.price || 0;
                                const discount = orig > 0 ? Math.round(((orig - price) / orig) * 100) : 0;
                                setEditingProduct({ ...editingProduct, originalPrice: orig, discount });
                              }}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Discount Percentage (%)</label>
                            <input 
                              type="number" readOnly
                              value={editingProduct.discount || 0}
                              className="w-full p-2 bg-gray-50 border border-[#E3D5CA]/50 rounded-xl text-xs text-gray-500 cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Product Badge</label>
                            <select 
                              value={editingProduct.badge || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value as any })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            >
                              <option value="">No Badge</option>
                              <option value="Trending">Trending</option>
                              <option value="Best Seller">Best Seller</option>
                              <option value="New">New</option>
                              <option value="Editor's Pick">Editor's Pick</option>
                              <option value="Limited Deal">Limited Deal</option>
                              <option value="Featured">Featured</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Brand Choice</label>
                            <input 
                              type="text" 
                              value={editingProduct.brand || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Material choice</label>
                            <input 
                              type="text" 
                              value={editingProduct.material || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="col-span-1 md:col-span-3 py-2">
                            <ImageUpload 
                              label="Product Gallery Images" 
                              value={editingProduct.images || []} 
                              onChange={(val) => setEditingProduct({ ...editingProduct, images: val })} 
                              multiple={true}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Aesthetic Color</label>
                            <input 
                              type="text" 
                              value={editingProduct.color || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Available Sizes (Comma separated)</label>
                            <input 
                              type="text" 
                              placeholder="S, M, L, XL"
                              value={editingProduct.availableSizes ? (Array.isArray(editingProduct.availableSizes) ? editingProduct.availableSizes.join(', ') : editingProduct.availableSizes) : ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, availableSizes: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Status</label>
                            <select 
                              value={editingProduct.status || 'active'}
                              onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            >
                              <option value="active">Active (Visible)</option>
                              <option value="hidden">Hidden</option>
                            </select>
                          </div>

                          <div className="col-span-1 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold uppercase">Tags (Comma separated)</label>
                            <input 
                              type="text" 
                              placeholder="linen, office, beige, dress"
                              value={editingProduct.tags ? (Array.isArray(editingProduct.tags) ? editingProduct.tags.join(', ') : editingProduct.tags) : ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="col-span-1 md:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold uppercase">Short Description</label>
                            <textarea 
                              rows={2}
                              value={editingProduct.shortDescription || ''}
                              onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <button 
                            type="button" 
                            onClick={() => setEditingProduct(null)}
                            className="px-4 py-2 bg-white border rounded-xl text-xs uppercase"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-[#2D2926] text-white rounded-xl text-xs uppercase"
                          >
                            Save Product
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Product List Inventory Table */}
                    <div className="overflow-x-auto border rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#FAF7F2] border-b text-[10px] uppercase tracking-widest font-bold">
                            <th className="p-4">Product</th>
                            <th className="p-4">Store</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Redirections</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => (
                            <tr key={p.id} className="border-b hover:bg-[#FAF7F2]/50">
                              <td className="p-4 flex items-center gap-3">
                                <img src={p.images[0]} alt={p.title} className="w-8 h-8 object-cover rounded-lg shrink-0 bg-gray-100" />
                                <div className="min-w-0">
                                  <div className="font-bold text-[#2D2926] truncate max-w-[200px]">{p.title}</div>
                                  <div className="text-[10px] text-[#7A736E]">{p.brand || 'No Brand'}</div>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-[#4A443F]">{p.storeName}</td>
                              <td className="p-4">{categories.find(c => c.id === p.category)?.name || 'None'}</td>
                              <td className="p-4 font-bold">₹{p.price}</td>
                              <td className="p-4 font-mono">{p.clickCount || 0} taps</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded uppercase font-bold text-[9px] ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button 
                                  onClick={() => handleDuplicateProduct(p.id)}
                                  className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                                  title="Duplicate/Clone"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingProduct(p)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN TAB: LOOKS MANAGER */}
                {adminActiveTab === 'collections' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Outfit combinations</span>
                        <h2 className="font-serif text-3xl text-[#2D2926] mt-1">Outfit Collections</h2>
                      </div>
                      {!editingCollection && (
                        <button 
                          onClick={() => setEditingCollection({ title: '', slug: '', description: '', coverImage: '', productIds: [], displayOrder: 1, status: 'active' })}
                          className="px-4 py-2 bg-[#2D2926] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1 hover:bg-[#D5BDAF]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create New Look</span>
                        </button>
                      )}
                    </div>

                    {/* Collection CRUD Form */}
                    {editingCollection && (
                      <form onSubmit={handleSaveCollection} className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E3D5CA]/50 space-y-4">
                        <h3 className="font-serif text-lg text-[#2D2926] font-bold">
                          {editingCollection.id ? `Edit Collection: ${editingCollection.title}` : 'Design New Style Selection'}
                        </h3>

                        {crudError && <div className="p-3 bg-red-50 text-xs text-[#D5BDAF] rounded-xl">{crudError}</div>}
                        {crudSuccess && <div className="p-3 bg-green-50 text-xs text-green-700 rounded-xl">{crudSuccess}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Look Title *</label>
                            <input 
                              type="text" required
                              value={editingCollection.title || ''}
                              onChange={(e) => setEditingCollection({ ...editingCollection, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Slug URL path *</label>
                            <input 
                              type="text" required
                              value={editingCollection.slug || ''}
                              onChange={(e) => setEditingCollection({ ...editingCollection, slug: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Cover Image URL</label>
                            <input 
                              type="text" 
                              placeholder="Unsplash URL"
                              value={editingCollection.coverImage || ''}
                              onChange={(e) => setEditingCollection({ ...editingCollection, coverImage: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase">Display Order</label>
                            <input 
                              type="number" 
                              value={editingCollection.displayOrder || 10}
                              onChange={(e) => setEditingCollection({ ...editingCollection, displayOrder: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          <div className="col-span-1 md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold uppercase">Description / Aesthetic Story</label>
                            <textarea 
                              rows={2}
                              value={editingCollection.description || ''}
                              onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                              className="w-full p-2 bg-white border border-[#E3D5CA]/50 rounded-xl text-xs"
                            />
                          </div>

                          {/* Link Products checkbox grid */}
                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold uppercase block">Select components to include in this look ({editingCollection.productIds?.length || 0} linked)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-3 bg-white border border-dashed rounded-xl">
                              {products.map(p => {
                                const isLinked = (editingCollection.productIds || []).includes(p.id);
                                return (
                                  <div 
                                    key={p.id}
                                    onClick={() => toggleProductInCollection(p.id)}
                                    className={`p-2 rounded-lg cursor-pointer border text-left flex items-center gap-2 transition-all ${isLinked ? 'bg-[#FAF0E6] border-[#D5BDAF]' : 'bg-transparent border-gray-100 hover:bg-gray-50'}`}
                                  >
                                    <img src={p.images[0]} alt={p.title} className="w-6 h-6 object-cover rounded" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[10px] font-bold truncate text-[#2D2926]">{p.title}</div>
                                      <div className="text-[8px] text-[#7A736E]">{p.storeName}</div>
                                    </div>
                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isLinked ? 'bg-[#D5BDAF] border-[#D5BDAF]' : 'border-gray-300'}`}>
                                      {isLinked && <Check className="w-2.5 h-2.5 text-[#FAF7F2]" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <button 
                            type="button" 
                            onClick={() => setEditingCollection(null)}
                            className="px-4 py-2 bg-white border rounded-xl text-xs uppercase"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-[#2D2926] text-white rounded-xl text-xs uppercase"
                          >
                            Save Look
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Outfit Collection Table */}
                    <div className="overflow-x-auto border rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#FAF7F2] border-b text-[10px] uppercase tracking-widest font-bold">
                            <th className="p-4">Look Curation</th>
                            <th className="p-4">Slug URL</th>
                            <th className="p-4">Redirections</th>
                            <th className="p-4">Linked Elements</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {collections.map(col => (
                            <tr key={col.id} className="border-b hover:bg-[#FAF7F2]/50">
                              <td className="p-4 flex items-center gap-3">
                                <img src={col.coverImage} alt={col.title} className="w-10 h-10 object-cover rounded-xl" />
                                <span className="font-bold text-[#2D2926]">{col.title}</span>
                              </td>
                              <td className="p-4 font-mono">{col.slug}</td>
                              <td className="p-4 font-bold">{col.clickCount || 0} taps</td>
                              <td className="p-4 font-semibold text-[#D5BDAF]">{col.productIds.length} Products</td>
                              <td className="p-4 text-right space-x-2">
                                <button 
                                  onClick={() => setEditingCollection(col)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCollection(col.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN TAB: SETTINGS & PASSWORD */}
                {adminActiveTab === 'settings' && (
                  <div className="space-y-6 max-w-md">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5BDAF]">Administrative Keys</span>
                      <h2 className="font-serif text-2xl text-[#2D2926] mt-1">Security Settings</h2>
                    </div>

                    <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider">New Password</label>
                        <input 
                          type="password" required
                          value={passwordChange.newPass}
                          onChange={(e) => setPasswordChange({ ...passwordChange, newPass: e.target.value })}
                          className="w-full p-2 bg-[#FAF7F2]/80 border border-[#E3D5CA]/50 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider">Confirm New Password</label>
                        <input 
                          type="password" required
                          value={passwordChange.confirm}
                          onChange={(e) => setPasswordChange({ ...passwordChange, confirm: e.target.value })}
                          className="w-full p-2 bg-[#FAF7F2]/80 border border-[#E3D5CA]/50 rounded-xl text-xs"
                        />
                      </div>

                      {passwordChangeStatus.error && (
                        <div className="p-3 bg-[#FFF5F5] border border-red-200 text-xs text-red-700 rounded-xl font-semibold">
                          {passwordChangeStatus.error}
                        </div>
                      )}

                      {passwordChangeStatus.success && (
                        <div className="p-3 bg-green-50 text-xs text-green-700 rounded-xl font-semibold">
                          Password updated successfully!
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-[#2D2926] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#D5BDAF] hover:text-[#4A443F]"
                      >
                        Change Password
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aesthetic High-End Luxury Footer */}
      <footer className="border-t border-[#E3D5CA]/30 py-12 px-6 md:px-12 bg-white/40 mt-16 text-center space-y-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-serif text-xl font-bold tracking-tight text-[#2D2926]">The Cozy Cart</span>
            <p className="text-[11px] text-[#7A736E]">Affiliate curator for modern wardrobe, aesthetic home decor and feminine lifestyle finds.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-[10px] tracking-[0.2em] font-bold uppercase text-[#4A443F]/80">
            <button onClick={() => { setView('home'); setActiveCategorySlug('all'); }} className="hover:text-[#2D2926]">Picks</button>
            <button onClick={() => setView('about-disclaimer')} className="hover:text-[#2D2926]">Disclaimer</button>
            <button onClick={() => setShowContactModal(true)} className="hover:text-[#2D2926]">Inquire</button>
            <button onClick={() => setView('admin-login')} className="hover:text-[#2D2926]">Admin Console</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#FAF7F2] flex flex-col md:flex-row items-center justify-between text-[9px] tracking-widest font-semibold uppercase opacity-55">
          <span>Instagram @TheCozyCart</span>
          <span>© {new Date().getFullYear()} The Cozy Cart. Handcrafted for premium styling.</span>
          <span>Pinterest Inspiration Daily</span>
        </div>
      </footer>

      {/* Beautiful Contact Form Dialog Modal */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContactModal(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-white shadow-lg relative z-10 space-y-6"
            >
              <button 
                onClick={() => setShowContactModal(false)}
                className="absolute top-6 right-6 p-1 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D5BDAF]">Write to our desk</span>
                <h3 className="font-serif text-2xl text-[#2D2926] font-bold">Get In Touch</h3>
                <p className="text-xs text-[#7A736E]">Inquire about curated listings, partner brands, or feedback.</p>
              </div>

              {contactSubmitted ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-xs font-semibold text-center">
                  Your aesthetic request has been forwarded successfully!
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase">Your Name</label>
                    <input 
                      type="text" required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E3D5CA]/50 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase">Your Email</label>
                    <input 
                      type="email" required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E3D5CA]/50 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase">Message</label>
                    <textarea 
                      rows={3} required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E3D5CA]/50 rounded-xl text-xs"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#2D2926] text-white text-xs font-bold uppercase tracking-wider rounded-xl"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
