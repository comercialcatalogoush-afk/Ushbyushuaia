'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProductsFromSupabase, supabase, saveLocalProductsOverride, logPriceChange, fetchPriceHistory } from '@/lib/supabase';
import { Product, PriceHistoryRecord } from '@/types';
import { 
  Plus, Edit3, Trash2, Save, X, ArrowLeft, Image as ImageIcon, Video, CheckCircle, 
  CheckSquare, Square, Lock, LogOut, ShieldCheck, Key, Search, Filter, History, 
  Upload, Layers, Tag, Eye, EyeOff, Sparkles, RefreshCw
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

const DEFAULT_FITS = ['Wide Leg', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
const ALL_SIZES = ['6', '8', '10', '12', '14'];

export default function AdminCatalogPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'history' | 'fits'>('products');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFit, setFilterFit] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fit Management State
  const [availableFits, setAvailableFits] = useState<string[]>(DEFAULT_FITS);
  const [newFitInput, setNewFitInput] = useState('');

  // Editing state
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(ALL_SIZES);
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({ '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 });
  const [imagePreviewList, setImagePreviewList] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    const data = await fetchProductsFromSupabase();
    setProducts(data);
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    const history = await fetchPriceHistory();
    setPriceHistory(history);
    setLoadingHistory(false);
  };

  // Fits Management
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
      setImagePreviewList(prev => [...prev, ...compressedUrls]);
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
  };

  const handleOpenNew = () => {
    setSelectedSizes(ALL_SIZES);
    setStockBySize({ '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 });
    setImagePreviewList(['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600']);
    setEditingProduct({
      id: '',
      name: 'REF: ',
      reference: '',
      slug: '',
      suggested_price: 79900,
      price: 54900,
      ribbon: 'Nuevo',
      fit: 'Wide Leg',
      status: 'published',
      description: 'Prenda confeccionada en mezclilla rígida de alta calidad.',
      full_description: 'Prenda en mezclilla rígida con corte estilizador confeccionada en Colombia.',
      in_stock: true,
      options: [{ id: 'talla-opt', key: 'Talla', values: ALL_SIZES }],
      images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'],
      video_url: ''
    });
  };

  const handleEditOpen = (product: Product) => {
    const sizeOpt = product.options?.find(o => o.key.toLowerCase() === 'talla');
    setSelectedSizes(sizeOpt?.values || ALL_SIZES);
    setStockBySize(product.stock_by_size || { '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 });
    setImagePreviewList(product.images || []);
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

    const optionsPayload = [
      {
        id: 'talla-opt',
        key: 'Talla',
        values: selectedSizes.length > 0 ? selectedSizes : ALL_SIZES
      }
    ];

    const payload = {
      name: editingProduct.name,
      reference,
      slug,
      suggested_price: newSuggested,
      price: newWholesale,
      compare_price: newSuggested,
      ribbon: editingProduct.ribbon || '',
      fit: editingProduct.fit || 'Wide Leg',
      status: editingProduct.status || 'published',
      stock_by_size: JSON.stringify(stockBySize),
      description: editingProduct.description || '',
      full_description: editingProduct.full_description || '',
      video_url: editingProduct.video_url || '',
      in_stock: editingProduct.in_stock !== false,
      hidden: editingProduct.status === 'draft',
      options: JSON.stringify(optionsPayload),
      images: editingProduct.images || imagePreviewList
    };

    const updatedProductObj: Product = {
      id: editingProduct.id || 'custom-' + Date.now(),
      name: editingProduct.name || 'Nueva Referencia',
      reference,
      slug,
      suggested_price: newSuggested,
      price: newWholesale,
      compare_price: newSuggested,
      ribbon: editingProduct.ribbon || '',
      fit: editingProduct.fit || 'Wide Leg',
      status: editingProduct.status || 'published',
      stock_by_size: stockBySize,
      description: editingProduct.description || '',
      full_description: editingProduct.full_description || '',
      video_url: editingProduct.video_url || '',
      in_stock: editingProduct.in_stock !== false,
      hidden: editingProduct.status === 'draft',
      options: optionsPayload,
      images: editingProduct.images || imagePreviewList
    };

    let updatedList: Product[] = [];
    if (editingProduct.id) {
      updatedList = products.map(p => p.id === editingProduct.id ? updatedProductObj : p);
    } else {
      updatedList = [updatedProductObj, ...products];
    }

    setProducts(updatedList);
    saveLocalProductsOverride(updatedList);

    // Audit log if price changed
    if (existingProd && (oldWholesale !== newWholesale || oldSuggested !== newSuggested)) {
      logPriceChange({
        product_id: existingProd.id,
        product_name: existingProd.name,
        old_wholesale_price: oldWholesale,
        new_wholesale_price: newWholesale,
        old_suggested_price: oldSuggested,
        new_suggested_price: newSuggested,
        changed_by: 'Admin'
      });
      loadHistory();
    }

    try {
      if (editingProduct.id) {
        await supabase.from('products').update(payload).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert([payload]);
      }
    } catch (e) {
      console.error('Supabase sync error:', e);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta referencia del catálogo?')) {
      const updatedList = products.filter(p => p.id !== id);
      setProducts(updatedList);
      saveLocalProductsOverride(updatedList);
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase delete error:', e);
      }
    }
  };

  // 1. ADMIN LOGIN VIEW (Protected Access)
  if (!isAuthenticated) {
    return (
      <div className="py-20 bg-neutral-900 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 border border-gray-200 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-ush-navy text-ush-pink rounded-full flex items-center justify-center mx-auto shadow-md">
              <Lock size={26} />
            </div>
            <h1 className="text-xl font-black uppercase text-ush-navy tracking-tight">
              Acceso Restringido Administrador
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Ingresa tus credenciales autorizadas de USH BY USHUAIA para gestionar el catálogo.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
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
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ush-navy text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest hover:bg-ush-pink transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Key size={16} />
              <span>Iniciar Sesión como Admin</span>
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs font-bold uppercase text-neutral-500 hover:text-black">
              ← Volver a la Tienda
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // 2. AUTHORIZED ADMIN PANEL VIEW
  return (
    <div className="py-12 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck size={12} /> Sesión Admin Activa
              </span>
              <span className="text-xs text-neutral-500">comercialmayoristas@ushuaiajeans.com.co</span>
            </div>
            <h1 className="text-2xl font-black uppercase text-ush-navy tracking-tight">
              Panel de Administración del Catálogo
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNew}
              className="bg-ush-pink hover:bg-ush-pinkHover text-white font-bold px-5 py-3 text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              <span>Agregar Referencia</span>
            </button>

            <button
              onClick={handleLogout}
              className="bg-neutral-800 hover:bg-black text-white font-bold px-4 py-3 text-xs uppercase tracking-wider flex items-center gap-1.5"
              title="Cerrar sesión de administrador"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
            <CheckCircle size={18} className="text-emerald-600" />
            <span>¡Cambios guardados con éxito en la base de datos!</span>
          </div>
        )}

        {/* Edit Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="bg-white max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden my-8">
              
              <div className="bg-ush-navy text-white p-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {editingProduct.id ? 'Editar Referencia' : 'Agregar Nueva Referencia al Catálogo'}
                </h3>
                <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-300 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Etiqueta / Ribbon
                    </label>
                    <select
                      value={editingProduct.ribbon || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, ribbon: e.target.value })}
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                    >
                      <option value="">Sin etiqueta</option>
                      <option value="Nuevo">Nuevo</option>
                      <option value="Más vendido">Más vendido</option>
                      <option value="Oferta">Oferta</option>
                      <option value="Exclusivo">Exclusivo</option>
                    </select>
                  </div>
                </div>

                {/* Category + Fit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                    >
                      <option value="">Sin categoría</option>
                      <option value="Jeans">Jeans</option>
                      <option value="Shorts">Shorts</option>
                      <option value="Faldas">Faldas</option>
                      <option value="Cargo">Cargo</option>
                      <option value="Bermuda">Bermuda</option>
                      <option value="Nuevo">Nuevo</option>
                      <option value="Rebajas">Rebajas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ush-pink mb-1">
                      Fit / Corte de la Prenda
                    </label>
                    <select
                      value={editingProduct.fit || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })}
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                    >
                      <option value="">Sin fit asignado</option>
                      {availableFits.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Solo aparecerá en ese filtro de fit y en "Todos los Fits"</p>
                  </div>
                </div>

                {/* Dual Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-neutral-50 border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Precio Sugerido Venta E-commerce (PVP) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingProduct.suggested_price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, suggested_price: parseFloat(e.target.value) || 0 })}
                      placeholder="79900"
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ush-pink mb-1">
                      Precio Mayorista (12+ Uds - 35% a 42% OFF) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      placeholder="54900"
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink font-bold"
                    />
                  </div>
                </div>

                {/* Available Sizes Selector */}
                <div className="p-3 bg-rose-50/50 border border-rose-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ush-navy mb-2">
                    Tallas Disponibles para esta Referencia:
                  </label>
                  <div className="flex flex-wrap gap-3">
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
                              ? 'bg-ush-pink text-white border-ush-pink'
                              : 'bg-white text-neutral-600 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                          <span>Talla {size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Nombre del Producto (Display para el Cliente)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Ej: Jean Wide Leg Tiro Alto Premium"
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Nombre descriptivo que verá el cliente en el catálogo público.</p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Etiquetas / Tags (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={(editingProduct.tags || []).join(', ')}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    placeholder="Ej: denim, tiro alto, wide leg, tendencia 2025"
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                  <p className="text-[10px] text-neutral-400 mt-0.5">Mejora la búsqueda interna. Ej: denim, tiro alto, verano.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Descripción Completa & Detalles Técnicos
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.full_description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, full_description: e.target.value })}
                    placeholder="Prenda confeccionada en mezclilla de alta durabilidad..."
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                    <ImageIcon size={14} /> URLs de Imágenes (Una por línea — desde tu carpeta externa)
                  </label>
                  <textarea
                    rows={4}
                    value={editingProduct.images?.join('\n') || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: e.target.value.split('\n').map(l => l.trim()).filter(Boolean) })}
                    placeholder={`https://static.wixstatic.com/media/imagen1.jpg\nhttps://static.wixstatic.com/media/imagen2.jpg`}
                    className="w-full border border-gray-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    📁 <strong>Las imágenes NO se suben al servidor</strong> — se enlazan desde tu carpeta externa (Wix, Drive, Dropbox, etc.). Una URL por línea. Formato automático 3:4.
                  </p>
                  {/* Image previews */}
                  {(editingProduct.images || []).filter(Boolean).length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {(editingProduct.images || []).filter(Boolean).map((url, i) => (
                        <div key={i} className="relative w-16 h-20 flex-shrink-0 border border-gray-200 overflow-hidden bg-neutral-100">
                          <img src={url} alt={`Vista previa ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                    <Video size={14} /> URL de Video Promocional (MP4 externo o YouTube)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.video_url || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, video_url: e.target.value })}
                    placeholder="https://video.wixstatic.com/...mp4  o  https://youtube.com/..."
                    className="w-full border border-gray-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    📁 <strong>El video NO se aloja en la página</strong> — se enlaza desde tu carpeta o canal externo.
                  </p>
                </div>

                {/* Visibility Toggle */}
                <div className="p-3 bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Visibilidad en el Catálogo</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      {editingProduct.hidden ? '🔴 Oculto — Solo el admin puede verlo' : '🟢 Visible — Todos los clientes lo ven'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingProduct({ ...editingProduct, hidden: !editingProduct.hidden })}
                    className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                      editingProduct.hidden ? 'bg-red-400' : 'bg-emerald-500'
                    }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      editingProduct.hidden ? 'left-1 translate-x-0' : 'left-1 translate-x-7'
                    }`} />
                  </button>
                </div>

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
                    className="px-6 py-2.5 bg-ush-navy text-white text-xs font-bold uppercase tracking-widest hover:bg-ush-pink flex items-center gap-2"
                  >
                    <Save size={16} /> Guardar Referencia
                  </button>

                </div>
              </form>

            </div>
          </div>
        )}

        {/* Product Table */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-ush-navy text-white flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Catálogo Actual ({products.length} referencias)
            </h2>
          </div>

          <div className="divide-y divide-gray-200 overflow-x-auto">
            {products.map((p) => {
              const sizeOpt = p.options?.find(o => o.key.toLowerCase() === 'talla');
              const sizes = sizeOpt?.values || ['6', '8', '10', '12', '14'];
              return (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-20 bg-neutral-100 border border-gray-200 overflow-hidden flex-shrink-0">
                      <Image
                        src={p.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200'}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-ush-navy uppercase">{p.name}</h3>
                        {p.ribbon && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-ush-pink text-white">
                            {p.ribbon}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xs font-black text-neutral-900">Mayorista: {formatCOP(p.price)}</span>
                        <span className="text-[11px] text-gray-400 line-through">PVP: {formatCOP(p.suggested_price || p.price * 1.5)}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Tallas activas: <span className="font-bold text-neutral-800">{sizes.join(', ')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditOpen(p)}
                      className="p-2 border border-gray-300 text-neutral-700 hover:border-ush-pink hover:text-ush-pink transition-colors text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 size={16} /> Editar
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
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
    </div>
  );
}
