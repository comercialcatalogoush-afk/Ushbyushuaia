'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAllProductsAdmin, supabase, saveLocalProductsOverride, logPriceChange, fetchPriceHistory } from '@/lib/supabase';
import { Product, PriceHistoryRecord } from '@/types';
import { 
  Plus, Edit3, Trash2, Save, X, ArrowLeft, Image as ImageIcon, Video, CheckCircle, 
  CheckSquare, Square, Lock, LogOut, ShieldCheck, Key, Search, Filter, History, 
  Upload, Layers, Tag, Eye, EyeOff, Sparkles, RefreshCw, Star, Film
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Logo } from '@/components/Logo';

const DEFAULT_FITS = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
const DEFAULT_CATEGORIES = ['Jeans', 'Shorts', 'Faldas', 'Cargo', 'Bermuda', 'Nuevo', 'Rebajas'];
const ALL_SIZES = ['6', '8', '10', '12', '14'];

export default function AdminCatalogPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'fits' | 'history'>('products');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFit, setFilterFit] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMedia, setFilterMedia] = useState('all');

  // Category & Fit Management State
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  const [availableFits, setAvailableFits] = useState<string[]>(DEFAULT_FITS);
  const [newFitInput, setNewFitInput] = useState('');
  const [editingFitIndex, setEditingFitIndex] = useState<number | null>(null);
  const [editingFitValue, setEditingFitValue] = useState('');

  // Editing Product state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(ALL_SIZES);
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({ '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Multimedia modal state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<'image' | 'video'>('image');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Price History Audit Log
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { formatCOP } = useCart();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          loadProducts();
          loadHistory();
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    checkAuth();

    try {
      const savedFits = localStorage.getItem('ush_admin_fits');
      if (savedFits) setAvailableFits(JSON.parse(savedFits));

      const savedCats = localStorage.getItem('ush_admin_categories');
      if (savedCats) setAvailableCategories(JSON.parse(savedCats));
    } catch (e) {}
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        loadProducts();
        loadHistory();
      } else {
        setLoginError(data.error || 'Credenciales incorrectas. Verifique el correo o la contraseña.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor de autenticación.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}
    setIsAuthenticated(false);
  };

  const loadProducts = async () => {
    setLoading(true);
    // Always fetch directly — bypasses localStorage so admin sees ALL 90 products
    const data = await fetchAllProductsAdmin();
    setProducts(data);
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    const history = await fetchPriceHistory();
    setPriceHistory(history);
    setLoadingHistory(false);
  };

  // ── Categories Management CRUD ──
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    const cleanCat = newCatInput.trim();
    if (!availableCategories.includes(cleanCat)) {
      const updated = [...availableCategories, cleanCat];
      setAvailableCategories(updated);
      try { localStorage.setItem('ush_admin_categories', JSON.stringify(updated)); } catch (e) {}
      window.dispatchEvent(new Event('ush_categories_updated'));
    }
    setNewCatInput('');
  };

  const handleSaveEditCategory = (index: number) => {
    if (!editingCatValue.trim()) return;
    const updated = [...availableCategories];
    updated[index] = editingCatValue.trim();
    setAvailableCategories(updated);
    setEditingCatIndex(null);
    try { localStorage.setItem('ush_admin_categories', JSON.stringify(updated)); } catch (e) {}
    window.dispatchEvent(new Event('ush_categories_updated'));
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updated = availableCategories.filter(c => c !== catToDelete);
    setAvailableCategories(updated);
    try { localStorage.setItem('ush_admin_categories', JSON.stringify(updated)); } catch (e) {}
    window.dispatchEvent(new Event('ush_categories_updated'));
  };

  // ── Fits Management CRUD ──
  const handleAddFit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFitInput.trim()) return;
    const cleanFit = newFitInput.trim();
    if (!availableFits.includes(cleanFit)) {
      const updated = [...availableFits, cleanFit];
      setAvailableFits(updated);
      try { localStorage.setItem('ush_admin_fits', JSON.stringify(updated)); } catch (e) {}
      window.dispatchEvent(new Event('ush_fits_updated'));
    }
    setNewFitInput('');
  };

  const handleSaveEditFit = (index: number) => {
    if (!editingFitValue.trim()) return;
    const updated = [...availableFits];
    updated[index] = editingFitValue.trim();
    setAvailableFits(updated);
    setEditingFitIndex(null);
    try { localStorage.setItem('ush_admin_fits', JSON.stringify(updated)); } catch (e) {}
    window.dispatchEvent(new Event('ush_fits_updated'));
  };

  const handleDeleteFit = (fitToDelete: string) => {
    const updated = availableFits.filter(f => f !== fitToDelete);
    setAvailableFits(updated);
    try { localStorage.setItem('ush_admin_fits', JSON.stringify(updated)); } catch (e) {}
    window.dispatchEvent(new Event('ush_fits_updated'));
  };

  // Compress Image Utility (Client-side Canvas)
  const compressAndReadImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(compressedUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const compressedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await compressAndReadImage(files[i]);
        compressedUrls.push(url);
      }
      if (editingProduct) {
        setEditingProduct({
          ...editingProduct,
          images: [...(editingProduct.images || []), ...compressedUrls]
        });
      }
    } catch (err) {
      console.error('Error compressing image:', err);
    }
    setUploadingImage(false);
    setShowMediaModal(false);
  };

  const handleAddMediaUrl = () => {
    if (!mediaUrlInput.trim() || !editingProduct) return;
    const url = mediaUrlInput.trim();

    if (mediaTypeInput === 'video') {
      setEditingProduct({ ...editingProduct, video_url: url });
    } else {
      setEditingProduct({
        ...editingProduct,
        images: [...(editingProduct.images || []), url]
      });
    }
    setMediaUrlInput('');
    setShowMediaModal(false);
  };

  const handleMakePrincipalImage = (index: number) => {
    if (!editingProduct || !editingProduct.images) return;
    const imgs = [...editingProduct.images];
    const [selected] = imgs.splice(index, 1);
    imgs.unshift(selected);
    setEditingProduct({ ...editingProduct, images: imgs });
  };

  const handleRemoveImage = (index: number) => {
    if (!editingProduct || !editingProduct.images) return;
    const imgs = [...editingProduct.images];
    imgs.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: imgs });
  };

  const handleOpenNew = () => {
    setSelectedSizes(ALL_SIZES);
    setStockBySize({ '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 });
    setEditingProduct({
      id: '',
      name: 'REF: ',
      reference: '',
      slug: '',
      suggested_price: 79900,
      price: 54900,
      ribbon: 'Nuevo',
      category: availableCategories[0] || 'Jeans',
      fit: availableFits[0] || 'Wide Leg',
      status: 'published',
      description: '',
      full_description: '',
      in_stock: true,
      options: [{ id: 'talla-opt', key: 'Talla', values: ALL_SIZES }],
      images: [],
      video_url: ''
    });
  };

  const handleEditOpen = (product: Product) => {
    const sizeOpt = product.options?.find(o => o.key.toLowerCase() === 'talla');
    setSelectedSizes(sizeOpt?.values || ALL_SIZES);
    setStockBySize(product.stock_by_size || { '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 });
    setEditingProduct(product);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const existingProd = products.find(p => p.id === editingProduct.id);
    const oldWholesale = existingProd ? existingProd.price : 0;
    const newWholesale = Number(editingProduct.price || 54900);
    const oldSuggested = existingProd ? existingProd.suggested_price : 0;
    const newSuggested = Number(editingProduct.suggested_price || 79900);

    const slug = editingProduct.slug || editingProduct.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ref-' + Date.now();
    const reference = editingProduct.reference || editingProduct.name?.replace(/ref:?/i, '').trim() || 'REF';

    const fullProd: Product = {
      id: editingProduct.id || 'prod-' + Date.now(),
      name: editingProduct.name || 'NUEVA REFERENCIA',
      reference: reference,
      slug: slug,
      suggested_price: newSuggested,
      price: newWholesale,
      compare_price: newSuggested,
      ribbon: editingProduct.ribbon || '',
      category: editingProduct.category || 'Jeans',
      fit: editingProduct.fit || 'Wide Leg',
      status: editingProduct.status || 'published',
      stock_by_size: stockBySize,
      is_best_seller: editingProduct.is_best_seller === true,
      description: editingProduct.description || '',
      full_description: editingProduct.full_description || '',
      video_url: editingProduct.video_url || '',
      tags: editingProduct.tags || [],
      in_stock: editingProduct.in_stock !== false,
      hidden: editingProduct.hidden === true || editingProduct.status === 'draft',
      options: [{ id: 'talla-opt', key: 'Talla', values: selectedSizes }],
      images: editingProduct.images || []
    };

    let updatedList: Product[];
    if (editingProduct.id) {
      updatedList = products.map(p => p.id === fullProd.id ? fullProd : p);
    } else {
      updatedList = [fullProd, ...products];
    }

    setProducts(updatedList);
    saveLocalProductsOverride(updatedList);

    if (oldWholesale !== newWholesale || oldSuggested !== newSuggested) {
      await logPriceChange({
        product_id: fullProd.id,
        product_name: fullProd.name,
        old_wholesale_price: oldWholesale,
        new_wholesale_price: newWholesale,
        old_suggested_price: oldSuggested,
        new_suggested_price: newSuggested,
      });
      loadHistory();
    }

    setEditingProduct(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este producto del catálogo?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveLocalProductsOverride(updated);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 border border-gray-200 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-ush-navy text-white flex items-center justify-center mx-auto shadow-md">
              <Lock size={22} className="text-ush-pink" />
            </div>
            <h1 className="text-xl font-black text-ush-navy uppercase tracking-wide">
              Acceso Restringido Administrator
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Ingresa tus credenciales autorizadas de USH BY USHUAIA para gestionar el catálogo.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Correo Electrónico Administrador *
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="comercialmayoristas@ushuaiajeans.com.co"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Contraseña de Seguridad *
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ush-navy text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest hover:bg-ush-pink transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Key size={16} /> Iniciar Sesión como Admin
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-neutral-500 hover:text-ush-pink font-semibold">
              ← Volver a la Tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredProductsList = products.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchRef = p.reference.toLowerCase().includes(q);
      if (!matchName && !matchRef) return false;
    }
    if (filterFit !== 'all') {
      if ((p.fit || 'wide leg').toLowerCase() !== filterFit.toLowerCase()) return false;
    }
    if (filterStatus !== 'all') {
      const isDraft = p.status === 'draft' || p.hidden;
      if (filterStatus === 'published' && isDraft) return false;
      if (filterStatus === 'draft' && !isDraft) return false;
    }
    if (filterMedia !== 'all') {
      const hasPhoto = p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== '';
      if (filterMedia === 'with_photo' && !hasPhoto) return false;
      if (filterMedia === 'no_photo' && hasPhoto) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-100 pb-16">
      
      {/* Top Admin Header */}
      <header className="bg-[#1b2333] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="light" size="sm" />
            <span className="text-xs font-bold uppercase tracking-widest bg-[#d88193] text-white px-2.5 py-1">
              Panel Mayorista Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 font-medium">
              <ArrowLeft size={16} /> Ver Catálogo Público
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1 font-bold ml-4 border-l border-neutral-700 pl-4"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Action Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1b2333] uppercase tracking-tight">
              Administración de Referencias
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Gestiona precios, imágenes, categorías, fits y visibilidad del catálogo en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNew}
              className="bg-[#d88193] text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-md hover:bg-[#c06579] transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Agregar Nueva Referencia
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white p-2 mb-6 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'products' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Layers size={14} /> Catálogo ({products.length} prendas)
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'categories' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Tag size={14} /> Gestión de Categorías ({availableCategories.length})
          </button>

          <button
            onClick={() => setActiveTab('fits')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'fits' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Tag size={14} className="text-[#d88193]" /> Gestión de Fits ({availableFits.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'history' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <History size={14} /> Historial Audit de Precios
          </button>
        </div>

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
            <CheckCircle size={18} className="text-emerald-600" />
            <span>¡Cambios guardados con éxito en el catálogo!</span>
          </div>
        )}

        {/* ── TAB 1: PRODUCT LIST ── */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por Nombre o Referencia..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 focus:outline-none focus:border-[#d88193]"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={filterFit}
                  onChange={(e) => setFilterFit(e.target.value)}
                  className="border border-gray-300 p-2 text-xs font-medium text-neutral-700 bg-white focus:outline-none focus:border-[#d88193]"
                >
                  <option value="all">Todos los Fits</option>
                  {availableFits.map(f => (
                    <option key={f} value={f}>Fit: {f}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 p-2 text-xs font-medium text-neutral-700 bg-white focus:outline-none focus:border-[#d88193]"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="published">🟢 Publicados (Visibles)</option>
                  <option value="draft">🔴 Borradores (Ocultos)</option>
                </select>

                <select
                  value={filterMedia}
                  onChange={(e) => setFilterMedia(e.target.value)}
                  className="border border-gray-300 p-2 text-xs font-medium text-neutral-700 bg-white focus:outline-none focus:border-[#d88193]"
                >
                  <option value="all">Todas las Fotos</option>
                  <option value="with_photo">🖼️ Con Fotos ({products.filter(p => p.images && p.images.length > 0 && p.images[0]).length})</option>
                  <option value="no_photo">📷 Sin Foto / Por Editar ({products.filter(p => !p.images || p.images.length === 0 || !p.images[0]).length})</option>
                </select>
              </div>
            </div>

            {/* Product Table List */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-[#1b2333] text-white flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Listado de Referencias ({filteredProductsList.length} de {products.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-200 overflow-x-auto">
                {filteredProductsList.map((p) => {
                  const sizeOpt = p.options?.find(o => o.key.toLowerCase() === 'talla');
                  const sizes = sizeOpt?.values || ALL_SIZES;
                  const isDraft = p.status === 'draft' || p.hidden;
                  const firstImg = p.images && p.images.length > 0 ? p.images[0] : '';

                  return (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative w-16 h-20 bg-neutral-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {firstImg ? (
                            <img src={firstImg} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
                          ) : (
                            <ImageIcon size={20} className="text-neutral-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-[#1b2333] uppercase">{p.name}</h3>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-100 border border-gray-300 text-neutral-800">
                              Ref: {p.reference}
                            </span>
                            {p.category && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-rose-50 text-[#d88193] border border-rose-200">
                                {p.category}
                              </span>
                            )}
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-800 text-white">
                              Fit: {p.fit || 'Wide Leg'}
                            </span>
                            {isDraft ? (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-800 border border-red-200">
                                🔴 Borrador
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🟢 Publicado
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-3 mt-1.5">
                            <span className="text-xs font-black text-neutral-900">Mayorista: {formatCOP(p.price)}</span>
                            <span className="text-[11px] text-gray-400 line-through">PVP: {formatCOP(p.suggested_price || p.price * 1.5)}</span>
                          </div>

                          <p className="text-[11px] text-neutral-500 mt-1">
                            Tallas: <span className="font-bold text-neutral-800">{sizes.join(', ')}</span> · Fotos: <span className="font-bold">{p.images?.length || 0}</span> {p.video_url ? '· 🎥 Video incluido' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditOpen(p)}
                          className="p-2 border border-gray-300 text-neutral-700 hover:border-[#d88193] hover:text-[#d88193] transition-colors text-xs font-bold flex items-center gap-1 bg-white"
                        >
                          <Edit3 size={16} /> Editar
                        </button>

                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors bg-white"
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: GESTIÓN DE CATEGORÍAS ── */}
        {activeTab === 'categories' && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide">
                Gestión de Categorías del Catálogo
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Crea, edita o elimina las categorías principales que se muestran en la barra superior del catálogo público (ej. Jeans, Shorts, Faldas, Cargo, Bermuda).
              </p>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Nombre de la nueva categoría..."
                className="flex-1 border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-[#d88193]"
              />
              <button
                type="submit"
                className="bg-[#1b2333] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-[#d88193] transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> Agregar
              </button>
            </form>

            {/* Category List */}
            <div className="divide-y divide-gray-100 border border-gray-200">
              {availableCategories.map((cat, idx) => (
                <div key={cat} className="p-3.5 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  {editingCatIndex === idx ? (
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <input
                        type="text"
                        value={editingCatValue}
                        onChange={(e) => setEditingCatValue(e.target.value)}
                        className="flex-1 border border-[#d88193] p-1.5 text-xs font-bold text-neutral-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditCategory(idx)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold uppercase"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingCatIndex(null)}
                        className="px-3 py-1.5 border border-gray-300 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-[#d88193]" />
                        <span className="text-xs font-bold uppercase text-neutral-900">{cat}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ({products.filter(p => p.category?.toLowerCase() === cat.toLowerCase()).length} prendas)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingCatIndex(idx); setEditingCatValue(cat); }}
                          className="p-1.5 text-neutral-600 hover:text-[#d88193] border border-gray-200 hover:border-[#d88193]"
                          title="Editar nombre de categoría"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300"
                          title="Eliminar categoría"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: GESTIÓN DE FITS / CORTES ── */}
        {activeTab === 'fits' && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide">
                Gestión de Fits / Cortes de Prenda
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Administra los tipos de corte asignables a cada prenda (Wide Leg, Barrel, Straight Boot, Vaquero, Bota Flare, Skinny, Mom, Cargo, Bermuda, Straight).
              </p>
            </div>

            {/* Add Fit Form */}
            <form onSubmit={handleAddFit} className="flex gap-3 max-w-md">
              <input
                type="text"
                value={newFitInput}
                onChange={(e) => setNewFitInput(e.target.value)}
                placeholder="Nombre del nuevo fit (ej: Barrel)..."
                className="flex-1 border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-[#d88193]"
              />
              <button
                type="submit"
                className="bg-[#1b2333] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-[#d88193] transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> Agregar
              </button>
            </form>

            {/* Fits List */}
            <div className="divide-y divide-gray-100 border border-gray-200">
              {availableFits.map((fit, idx) => (
                <div key={fit} className="p-3.5 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  {editingFitIndex === idx ? (
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <input
                        type="text"
                        value={editingFitValue}
                        onChange={(e) => setEditingFitValue(e.target.value)}
                        className="flex-1 border border-[#d88193] p-1.5 text-xs font-bold text-neutral-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEditFit(idx)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold uppercase"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingFitIndex(null)}
                        className="px-3 py-1.5 border border-gray-300 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-[#d88193]" />
                        <span className="text-xs font-bold uppercase text-neutral-900">{fit}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          ({products.filter(p => p.fit?.toLowerCase() === fit.toLowerCase()).length} prendas)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingFitIndex(idx); setEditingFitValue(fit); }}
                          className="p-1.5 text-neutral-600 hover:text-[#d88193] border border-gray-200 hover:border-[#d88193]"
                          title="Editar nombre de fit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteFit(fit)}
                          className="p-1.5 text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300"
                          title="Eliminar fit"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: HISTORIAL DE PRECIOS ── */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide">
                Historial Auditable de Cambios de Precio
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Registro permanente de cada modificación realizada a los precios mayoristas o PVP.
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b2333] text-white uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Fecha / Hora</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Mayorista Anter.</th>
                    <th className="p-3">Mayorista Nuevo</th>
                    <th className="p-3">PVP Anter.</th>
                    <th className="p-3">PVP Nuevo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {priceHistory.length > 0 ? (
                    priceHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-neutral-50">
                        <td className="p-3 text-neutral-500 font-mono text-[11px]">
                          {new Date(rec.changed_at).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-neutral-900 uppercase">{rec.product_name}</td>
                        <td className="p-3 text-gray-500">{formatCOP(rec.old_wholesale_price)}</td>
                        <td className="p-3 font-black text-emerald-600">{formatCOP(rec.new_wholesale_price)}</td>
                        <td className="p-3 text-gray-500">{formatCOP(rec.old_suggested_price)}</td>
                        <td className="p-3 font-black text-emerald-600">{formatCOP(rec.new_suggested_price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400">
                        No hay registros de cambios de precio aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ── EDIT PRODUCT MODAL (with Multimedia Manager Captura 5 style) ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white max-w-4xl w-full border border-gray-200 shadow-2xl overflow-hidden my-8">

            {/* Modal Header */}
            <div className="bg-[#1b2333] text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {editingProduct.id ? 'Editar Referencia del Catálogo' : 'Agregar Nueva Referencia al Catálogo'}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-300 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
              
              {/* Reference Name & Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Nombre de Referencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ej: REF: 559100"
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Etiqueta / Ribbon
                  </label>
                  <select
                    value={editingProduct.ribbon || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, ribbon: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193] bg-white"
                  >
                    <option value="">Sin etiqueta</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Más vendido">Más vendido</option>
                    <option value="Oferta">Oferta</option>
                    <option value="Exclusivo">Exclusivo</option>
                  </select>
                </div>
              </div>

              {/* Category & Fit Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193] bg-white"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#d88193] mb-1">
                    Fit / Corte de la Prenda
                  </label>
                  <select
                    value={editingProduct.fit || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193] bg-white font-bold"
                  >
                    {availableFits.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-50 border border-gray-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Precio Sugerido Venta (PVP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.suggested_price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, suggested_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#d88193] mb-1">
                    Precio Mayorista (12+ Uds - 35% a 42% OFF) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Available Sizes */}
              <div className="p-3 bg-rose-50/50 border border-rose-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1b2333] mb-2">
                  Tallas Disponibles:
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => {
                    const isChecked = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedSizes(selectedSizes.filter(s => s !== size));
                          } else {
                            setSelectedSizes([...selectedSizes, size].sort((a, b) => parseInt(a) - parseInt(b)));
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all ${
                          isChecked
                            ? 'bg-[#d88193] text-white border-[#d88193]'
                            : 'bg-white text-neutral-600 border-gray-300'
                        }`}
                      >
                        {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                        <span>Talla {size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Display Name & Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Nombre del Producto (Display para el Cliente)
                </label>
                <input
                  type="text"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Ej: Jean Wide Leg Tiro Alto Premium"
                  className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Etiquetas / Tags (separadas por coma)
                </label>
                <input
                  type="text"
                  value={(editingProduct.tags || []).join(', ')}
                  onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Ej: denim, tiro alto, wide leg"
                  className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none"
                />
              </div>

              {/* ── MULTIMEDIA MANAGER (Estilo Captura 5) ── */}
              <div className="p-4 bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b2333] flex items-center gap-1.5">
                      <ImageIcon size={16} className="text-[#d88193]" /> Gestión de Galería Multimedia
                    </h4>
                    <p className="text-[10px] text-neutral-500">
                      Organiza las imágenes y el video de la prenda. La primera foto será la imagen PRINCIPAL.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="px-3.5 py-2 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#d88193] transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Agregar Multimedia
                  </button>
                </div>

                {/* Media Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {(editingProduct.images || []).map((imgUrl, idx) => {
                    const isPrincipal = idx === 0;
                    return (
                      <div key={idx} className="group relative aspect-[3/4] bg-neutral-200 border border-gray-300 overflow-hidden shadow-sm flex items-center justify-center">
                        <img
                          src={imgUrl}
                          alt={`Imagen ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                        />

                        {/* Badge */}
                        {isPrincipal ? (
                          <span className="absolute top-2 left-2 z-10 text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-white shadow-md">
                            PRINCIPAL
                          </span>
                        ) : (
                          <span className="absolute top-2 left-2 z-10 text-[9px] font-bold uppercase px-2 py-0.5 bg-neutral-900/80 text-white">
                            FOTO #{idx + 1}
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          {!isPrincipal && (
                            <button
                              type="button"
                              onClick={() => handleMakePrincipalImage(idx)}
                              className="w-full py-1.5 bg-white text-neutral-900 text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-emerald-50"
                            >
                              <Star size={12} className="text-amber-500 fill-amber-500" /> Principal
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="w-full py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-red-700"
                          >
                            <Trash2 size={12} /> Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Video item if exists */}
                  {editingProduct.video_url && (
                    <div className="group relative aspect-[3/4] bg-neutral-900 border border-gray-300 overflow-hidden shadow-sm flex flex-col items-center justify-center text-white p-3 text-center">
                      <Film size={28} className="text-sky-400 mb-2" />
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-sky-500 text-white mb-1">
                        VIDEO
                      </span>
                      <p className="text-[9px] text-neutral-300 truncate w-full">{editingProduct.video_url}</p>

                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, video_url: '' })}
                          className="w-full py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                        >
                          <Trash2 size={12} /> Quitar Video
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add (+) Box (Captura 5 style) */}
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="aspect-[3/4] border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 transition-colors flex flex-col items-center justify-center text-sky-600 p-4 text-center group"
                  >
                    <div className="w-10 h-10 rounded-full border border-sky-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Agregar Multimedia</span>
                  </button>
                </div>
              </div>

              {/* Status / Visibility Toggle */}
              <div className="p-3 bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Visibilidad en el Catálogo</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">
                    {editingProduct.hidden ? '🔴 Borrador — Oculto para clientes' : '🟢 Publicado — Visible en el catálogo público'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct({ ...editingProduct, hidden: !editingProduct.hidden, status: editingProduct.hidden ? 'published' : 'draft' })}
                  className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                    editingProduct.hidden ? 'bg-red-400' : 'bg-emerald-500'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    editingProduct.hidden ? 'left-1 translate-x-0' : 'left-1 translate-x-7'
                  }`} />
                </button>
              </div>

              {/* Modal Controls */}
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 border border-gray-300 text-xs font-bold uppercase text-neutral-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#d88193] flex items-center gap-2"
                >
                  <Save size={16} /> Guardar Referencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MULTIMEDIA UPLOADER MODAL (Subir local o URL) ── */}
      {showMediaModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white max-w-md w-full border border-gray-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black uppercase text-[#1b2333]">Agregar Foto o Video</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X size={18} />
              </button>
            </div>

            {/* Type tabs */}
            <div className="flex border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => setMediaTypeInput('image')}
                className={`flex-1 py-2 text-xs font-bold uppercase ${mediaTypeInput === 'image' ? 'bg-[#1b2333] text-white' : 'text-neutral-600'}`}
              >
                🖼️ Imagen
              </button>
              <button
                type="button"
                onClick={() => setMediaTypeInput('video')}
                className={`flex-1 py-2 text-xs font-bold uppercase ${mediaTypeInput === 'video' ? 'bg-[#1b2333] text-white' : 'text-neutral-600'}`}
              >
                🎥 Video (MP4 / YouTube)
              </button>
            </div>

            {mediaTypeInput === 'image' && (
              <div className="space-y-4">
                {/* Local Upload */}
                <div className="p-4 border-2 border-dashed border-gray-300 hover:border-[#d88193] text-center space-y-2 bg-neutral-50">
                  <Upload size={24} className="mx-auto text-neutral-400" />
                  <p className="text-xs font-bold text-neutral-700 uppercase">Subir Foto desde tu Equipo</p>
                  <p className="text-[10px] text-neutral-400">Se comprimirá automáticamente en alta calidad</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    className="block w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-[#1b2333] file:text-white hover:file:bg-[#d88193]"
                  />
                </div>

                <div className="relative text-center text-xs text-neutral-400 font-bold uppercase">
                  <span>o pega la URL externa</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">
                {mediaTypeInput === 'image' ? 'URL de la Imagen:' : 'URL del Video (MP4 / YouTube):'}
              </label>
              <input
                type="text"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                placeholder="https://static.wixstatic.com/media/...jpg"
                className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddMediaUrl}
                className="px-5 py-2 bg-[#1b2333] text-white text-xs font-bold uppercase hover:bg-[#d88193]"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
