'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAllProductsAdmin, supabase, saveLocalProductsOverride, logPriceChange, fetchPriceHistory, upsertProduct, deleteProductFromSupabase, uploadProductImage, deleteProductImage, fetchOrdersAdmin, confirmOrderAndDeductStock, cancelOrderAndRestoreStock, subscribeCatalogChanges, publishOrderChange, publishCatalogChange, updateProductStock } from '@/lib/supabase';
import { exportBackup, downloadBackup, purgeTransactionalData, getNextBackupReminder, formatReminder, downloadReminderIcs, getReminderCountdown } from '@/lib/backup';
import { Product, PriceHistoryRecord } from '@/types';
import { SiteContentEditor } from '@/components/SiteContentEditor';
import { 
  Plus, Edit3, Trash2, Save, X, ArrowLeft, Image as ImageIcon, Video, CheckCircle, 
  CheckSquare, Square, Lock, LogOut, ShieldCheck, Key, Search, Filter, History, 
  Upload, Layers, Tag, Eye, EyeOff, Sparkles, RefreshCw, Star, Film, ShoppingBag, LayoutTemplate, XCircle
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Logo } from '@/components/Logo';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';
const DEFAULT_FITS = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
const DEFAULT_CATEGORIES = ['Jeans', 'Pantalones', 'Shorts', 'Faldas', 'Cargos', 'Bermuda', 'Nuevo'];
const ALL_SIZES = ['6', '8', '10', '12', '14'];
const DEFAULT_COLORS = [
  'Azul Claro', 'Azul Oscuro', 'Azul Medio', 'Azul Dirty', 'Gris Oscuro', 'Gris Humo',
  'Negro', 'Blanco', 'Ivory', 'Crudo', 'Kaki', 'Mocca', 'Baby Blue', 'Oliva',
  'Café', 'Mostaza', 'Vino', 'Burdeos'
];

export default function AdminCatalogPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'fits' | 'history' | 'backup' | 'orders' | 'site'>('products');

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
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({ '6': 20, '8': 20, '10': 20, '12': 20, '14': 20 });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Inventario rápido (edición inline desde el listado): se marca como pendiente
  // hasta que el admin pulse "Aplicar cambios".
  const [pendingStockIds, setPendingStockIds] = useState<string[]>([]);
  const [applyingStock, setApplyingStock] = useState(false);
  const [inventoryMsg, setInventoryMsg] = useState<string | null>(null);

  // Multimedia modal state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<'image' | 'video'>('image');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Price History Audit Log
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Pedidos (confirmación de pago → descontar stock) ──
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'todos' | 'pending' | 'confirmed' | 'canceled'>('todos');
  const [orderMsg, setOrderMsg] = useState<string | null>(null);

  // ── Respaldos / Limpieza mensual ──
  const [backupReminder, setBackupReminder] = useState<Date>(() => getNextBackupReminder());
  const [backupCountdown, setBackupCountdown] = useState(getReminderCountdown(getNextBackupReminder()));
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const { formatCOP } = useCart();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser && sessionUser.email && sessionUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
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

    // React to session changes (login/logout) in real time
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      const authed = !!sessionUser && !!sessionUser.email && sessionUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      setIsAuthenticated(!!authed);
      if (authed) {
        loadProducts();
        loadHistory();
      } else {
        setLoading(false);
      }
    });

    try {
      const savedFits = localStorage.getItem('ush_admin_fits');
      if (savedFits) setAvailableFits(JSON.parse(savedFits));

      const savedCats = localStorage.getItem('ush_admin_categories');
      if (savedCats) setAvailableCategories(JSON.parse(savedCats));
    } catch (e) {}

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (!error) {
        setIsAuthenticated(true);
        loadProducts();
        loadHistory();
      } else {
        setLoginError('Credenciales incorrectas. Verifique el correo o la contraseña.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor de autenticación.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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

  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await fetchOrdersAdmin();
    setOrders(data);
    setLoadingOrders(false);
  };

  // Realtime: cuando el cliente registra un pedido o se edita un producto,
  // refrescamos automáticamente para mantener el panel sincronizado.
  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
    const unsubscribe = subscribeCatalogChanges(() => {
      loadOrders();
      loadProducts();
    });
    return unsubscribe;
  }, [isAuthenticated]);

  const handleConfirmOrder = async (order: any) => {
    setConfirmingOrderId(order.id);
    setOrderMsg(null);
    const res = await confirmOrderAndDeductStock(order, products);
    if (res.success) {
      setOrderMsg(`Pedido ${order.id} confirmado: se descontó el stock y el pago quedó registrado.`);
      await loadOrders();
      await loadProducts();
      publishOrderChange();
    } else {
      setOrderMsg(`Error al confirmar: ${res.error}`);
    }
    setConfirmingOrderId(null);
  };

  const handleCancelOrder = async (order: any) => {
    if (!window.confirm(
      `¿Cancelar el pedido ${order.id}?\n\n` +
      (order.status === 'confirmed'
        ? 'Se restaurará el stock descontado al inventario de la página.\n'
        : '') +
      'El pedido pasará a "Cancelado / Carrito abandonado".'
    )) return;
    setCancelingOrderId(order.id);
    setOrderMsg(null);
    const res = await cancelOrderAndRestoreStock(order, products);
    if (res.success) {
      setOrderMsg(`Pedido ${order.id} cancelado${res.changed ? ': se restauró el stock al inventario.' : '. Carrito abandonado registrado.'}`);
      await loadOrders();
      await loadProducts();
      publishOrderChange();
    } else {
      setOrderMsg(`Error al cancelar: ${res.error}`);
    }
    setCancelingOrderId(null);
  };

  // ── Respaldos: exportar JSON y vaciar tablas transaccionales ──
  useEffect(() => {
    setBackupReminder(getNextBackupReminder());
    const tick = () => setBackupCountdown(getReminderCountdown(getNextBackupReminder()));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExportBackup = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupError(null);
    try {
      const data = await exportBackup();
      downloadBackup(data);
      setBackupMsg(
        `Respaldo exportado (${data.products.length} productos, ${data.orders.length} pedidos, ` +
        `${data.wholesale_leads.length} leads, ${data.price_history.length} registros de precios). ` +
        'Guárdalo en un lugar seguro.'
      );
    } catch (e: any) {
      setBackupError('No se pudo generar el respaldo: ' + (e?.message || 'error'));
    }
    setBackupLoading(false);
  };

  const handlePurge = async () => {
    if (!window.confirm(
      '⚠️ VACÍO MASIVO de datos transaccionales.\n\n' +
      'Esto ELIMINA de Supabase todos los pedidos, formularios de contacto y el historial de precios.\n' +
      'El catálogo (productos y fotos) NO se toca.\n\n' +
      '¿Ya exportaste el respaldo? ¡Esta acción NO se puede deshacer!'
    )) return;
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupError(null);
    const res = await purgeTransactionalData();
    if (res.success) {
      setBackupMsg('✅ Tablas transaccionales vaciadas. El plan gratuito queda despejado hasta el próximo mes.');
      setBackupReminder(getNextBackupReminder());
    } else {
      setBackupError('No se pudieron vaciar los datos: ' + (res.error || 'error'));
    }
    setBackupLoading(false);
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

  // Compress Image Utility (Client-side Canvas) → Blob for Supabase Storage
  // High-quality near-lossless: 1920px max dim, JPEG q0.92 (visually identical, fits free tier)
  const compressAndReadImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1920;

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
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('No se pudo comprimir la imagen'));
                }
              },
              'image/jpeg',
              0.92
            );
          } else {
            reject(new Error('Canvas no disponible'));
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
      const uploadedUrls: string[] = [];
      const refFolder = (editingProduct?.reference || editingProduct?.id || 'producto').replace(/[^a-zA-Z0-9_-]/g, '-');
      for (let i = 0; i < files.length; i++) {
        try {
          const blob = await compressAndReadImage(files[i]);
          const path = `${refFolder}/${Date.now()}-${i}.jpg`;
          const res = await uploadProductImage(blob, path);
          if (res.success && res.url) {
            uploadedUrls.push(res.url);
          } else {
            console.warn('Supabase storage upload failed:', res.error);
          }
        } catch (err) {
          console.error('Error uploading image:', err);
        }
      }
      if (editingProduct && uploadedUrls.length > 0) {
        setEditingProduct({
          ...editingProduct,
          images: [...(editingProduct.images || []), ...uploadedUrls]
        });
      }
    } catch (err) {
      console.error('Error uploading images:', err);
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
    const [removed] = imgs.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: imgs });

    // If the image lives in our Supabase bucket, delete the file too
    try {
      const marker = '/object/public/product-images/';
      const markerIdx = removed.indexOf(marker);
      if (markerIdx > -1) {
        const path = removed.substring(markerIdx + marker.length);
        deleteProductImage(path).then((res) => {
          if (!res.success) console.warn('Supabase image delete failed:', res.error);
        });
      }
    } catch (e) {}
  };

  const handleOpenNew = () => {
    setSelectedSizes(ALL_SIZES);
    setStockBySize({ '6': 20, '8': 20, '10': 20, '12': 20, '14': 20 });
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
    const allSizes = sizeOpt?.values || ALL_SIZES;
    const stock = product.stock_by_size || {};
    // Las tallas con 0 quedan desmarcadas automáticamente (igual que en el
    // catálogo: no hace falta que el admin las quite a mano). Si todo está en
    // 0 se conservan marcadas para poder reponer stock.
    const activeSizes = allSizes.filter(s => (stock[s] ?? 0) > 0);
    setSelectedSizes(activeSizes.length > 0 ? activeSizes : allSizes);
    setStockBySize({ '6': 20, '8': 20, '10': 20, '12': 20, '14': 20, ...(product.stock_by_size || {}) });
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

    const otherOptions = (editingProduct.options || []).filter(o => o.key.toLowerCase() !== 'talla');
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
      fit: editingProduct.fit || '',
      color: editingProduct.color || '',
      status: editingProduct.status || 'published',
      stock_by_size: stockBySize,
      is_best_seller: editingProduct.is_best_seller === true,
      description: editingProduct.description || '',
      full_description: editingProduct.full_description || '',
      video_url: editingProduct.video_url || '',
      tags: editingProduct.tags || [],
      in_stock: editingProduct.in_stock !== false,
      hidden: editingProduct.hidden === true || editingProduct.status === 'draft',
      options: [...otherOptions, { id: 'talla-opt', key: 'Talla', values: selectedSizes }],
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

    // Persist to Supabase so changes are visible on every device
    const upsertRes = await upsertProduct(fullProd);
    if (!upsertRes.success) {
      console.warn('Supabase upsert failed (falling back to local only):', upsertRes.error);
    } else {
      publishCatalogChange();
    }

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
      deleteProductFromSupabase(id).then(res => {
        if (!res.success) {
          console.warn('Supabase delete failed:', res.error);
        } else {
          publishCatalogChange();
        }
      });
    }
  };

  // Edita el inventario inline: solo actualiza el estado local y marca la fila
  // como pendiente. La BD y el catálogo se actualizan al pulsar "Aplicar cambios".
  const handleQuickStock = (product: Product, size: string, value: string) => {
    const id = product.id;
    const num = Math.max(0, parseInt(value, 10) || 0);
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next = { ...p, stock_by_size: { ...(p.stock_by_size || {}), [size]: num } };
      const sizes = next.options?.find(o => o.key.toLowerCase() === 'talla')?.values || ALL_SIZES;
      next.in_stock = sizes.some(s => (next.stock_by_size?.[s] || 0) > 0);
      return next;
    }));
    setPendingStockIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setInventoryMsg(null);
  };

  // Aplica los cambios pendientes de inventario: guarda en Supabase y publica
  // para que el catálogo se actualice al instante en todos los dispositivos.
  const handleApplyStockChanges = async () => {
    const ids = pendingStockIds;
    if (ids.length === 0) return;
    setApplyingStock(true);
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      const prod = products.find(p => p.id === id);
      if (!prod) continue;
      const stock = prod.stock_by_size || {};
      const hasStock = ALL_SIZES.some(s => (stock[s] || 0) > 0);
      const res = await updateProductStock(id, stock, hasStock);
      if (res.success) ok++; else fail++;
    }
    if (ok > 0) publishCatalogChange();
    setPendingStockIds([]);
    setApplyingStock(false);
    setInventoryMsg(
      ok > 0
        ? `✅ Inventario actualizado y publicado (${ok} producto${ok !== 1 ? 's' : ''})${fail ? `, ${fail} con error` : ''}.`
        : `❌ No se pudo actualizar el inventario${fail ? ` (${fail} con error)` : ''}.`
    );
    setTimeout(() => setInventoryMsg(null), 5000);
  };

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    let ok = 0;
    let fail = 0;
    for (const p of products) {
      const res = await upsertProduct(p);
      if (res.success) ok++; else fail++;
    }
    setSyncing(false);
    if (ok > 0) publishCatalogChange();
    setSyncResult(`Sincronización completada: ${ok} referencias en la nube${fail ? `, ${fail} con error` : ''}.`);
    setTimeout(() => setSyncResult(null), 5000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <meta name="robots" content="noindex,nofollow" />
        <title>Acceso Restringido | Ush By Ushuaia</title>
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
      if ((p.fit || '').toLowerCase() !== filterFit.toLowerCase()) return false;
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
      <meta name="robots" content="noindex,nofollow" />
      <title>Panel de Administración | Ush By Ushuaia</title>
      
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
              onClick={handleSyncAll}
              disabled={syncing}
              className="bg-white text-[#1b2333] border-2 border-[#1b2333] text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-sm hover:bg-[#1b2333] hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} /> {syncing ? 'Sincronizando...' : 'Sincronizar todo a la nube'}
            </button>
            <button
              onClick={handleOpenNew}
              className="bg-[#d88193] text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-md hover:bg-[#c06579] transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Agregar Nueva Referencia
            </button>
          </div>
        </div>

        {syncResult && (
          <div className="p-4 bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-6">
            <CheckCircle size={18} className="text-sky-600" />
            <span>{syncResult}</span>
          </div>
        )}

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

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'backup' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Save size={14} /> Respaldos
          </button>

          <button
            onClick={() => { setActiveTab('orders'); loadOrders(); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'orders' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <ShoppingBag size={14} className="text-[#d88193]" /> Pedidos
          </button>

          <button
            onClick={() => setActiveTab('site')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'site' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <LayoutTemplate size={14} className="text-[#d88193]" /> Sitio Web
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

            {/* Product Table List — Wix Studio Style */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto rounded-sm">

              {/* Table Header Row */}
              <div className="bg-[#116dff] text-white px-5 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide">
                  Productos ({filteredProductsList.length}{filteredProductsList.length !== products.length ? ` de ${products.length}` : ''})
                </h2>
                <button
                  onClick={handleOpenNew}
                  className="flex items-center gap-1.5 bg-white text-[#116dff] text-xs font-bold px-4 py-1.5 rounded hover:bg-blue-50 transition-colors"
                >
                  <Plus size={14} /> Nuevo producto
                </button>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-[40px_56px_1fr_95px_105px_190px_85px_70px] gap-0 border-b border-gray-200 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-neutral-500 min-w-[880px]">
                <div className="px-3 py-2.5 flex items-center"></div>
                <div className="px-2 py-2.5 flex items-center"></div>
                <div className="px-3 py-2.5 flex items-center">Nombre</div>
                <div className="px-3 py-2.5 flex items-center">Tipo</div>
                <div className="px-3 py-2.5 flex items-center">Precio</div>
                <div className="px-3 py-2.5 flex items-center justify-center">Inventario (por talla)</div>
                <div className="px-3 py-2.5 flex items-center">Estado</div>
                <div className="px-3 py-2.5 flex items-center"></div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {filteredProductsList.length === 0 ? (
                  <div className="py-16 text-center text-neutral-400">
                    <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No se encontraron productos</p>
                    <p className="text-xs mt-1">Ajusta los filtros de búsqueda</p>
                  </div>
                ) : filteredProductsList.map((p) => {
                  const isDraft = p.status === 'draft' || p.hidden;
                  const firstImg = p.images && p.images.length > 0 ? p.images[0] : '';
                  const sizeOpt = p.options?.find(o => o.key.toLowerCase() === 'talla');
                  const variantCount = (sizeOpt?.values || ALL_SIZES).length;

                  return (
                    <div
                      key={p.id}
                      className="grid grid-cols-[40px_56px_1fr_95px_105px_190px_85px_70px] gap-0 items-center hover:bg-blue-50/30 transition-colors group cursor-pointer min-w-[880px]"
                      onClick={() => handleEditOpen(p)}
                    >
                      {/* Checkbox placeholder */}
                      <div className="px-3 py-3 flex items-center" onClick={e => e.stopPropagation()}>
                        <div className="w-4 h-4 border border-gray-300 rounded-sm flex-shrink-0" />
                      </div>

                      {/* Thumbnail */}
                      <div className="px-2 py-2 flex items-center">
                        <div className="relative w-10 h-12 bg-neutral-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {firstImg ? (
                            <>
                              <img
                                src={firstImg}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const fallbackEl = (e.target as HTMLElement).nextElementSibling;
                                  if (fallbackEl) fallbackEl.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden absolute inset-0 bg-gradient-to-br from-neutral-100 to-rose-50 flex-col items-center justify-center text-center p-1">
                                <ImageIcon size={12} className="text-ush-pink opacity-60 mb-0.5" />
                                <p className="text-[6px] font-black uppercase tracking-widest text-ush-navy leading-tight">Foto<br />Próximamente</p>
                              </div>
                            </>
                          ) : (
                            <ImageIcon size={14} className="text-neutral-300" />
                          )}
                        </div>
                      </div>

                      {/* Name + variants info */}
                      <div className="px-3 py-3 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-[#116dff] transition-colors">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {variantCount} tallas · {p.images?.length || 0} foto{(p.images?.length || 0) !== 1 ? 's' : ''}
                          {p.video_url ? ' · 🎥 video' : ''}
                          {p.color ? ` · 🎨 ${p.color}` : ''}
                          {p.ribbon ? ` · 🏷️ ${p.ribbon}` : ''}
                        </p>
                      </div>

                      {/* Type */}
                      <div className="px-3 py-3">
                        <span className="text-xs font-semibold text-neutral-700">{p.category || '—'}</span>
                        {p.fit && <p className="text-[10px] text-neutral-400">{p.fit}</p>}
                      </div>

                      {/* Price */}
                      <div className="px-3 py-3">
                        <p className="text-sm font-bold text-neutral-900">{formatCOP(p.price)}</p>
                        <p className="text-[10px] text-neutral-400">mayorista</p>
                      </div>

                      {/* Inventario editable (por talla) */}
                      <div className="px-3 py-2 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        {(() => {
                          const sizes = sizeOpt?.values && sizeOpt.values.length > 0 ? sizeOpt.values : ALL_SIZES;
                          const isPending = pendingStockIds.includes(p.id);
                          return (
                            <div className="flex items-center gap-1">
                              {sizes.map(s => (
                                <div key={s} className="flex flex-col items-center">
                                  <span className="text-[8px] font-bold text-neutral-400 leading-none mb-0.5">{s}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={p.stock_by_size?.[s] ?? 0}
                                    onChange={(e) => handleQuickStock(p, s, e.target.value)}
                                    className={`w-9 h-6 text-center text-[11px] font-semibold border rounded-sm focus:outline-none focus:border-[#116dff] focus:ring-1 focus:ring-blue-100 ${
                                      isPending
                                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                                        : (p.stock_by_size?.[s] ?? 0) > 0
                                        ? 'border-gray-300 bg-white text-neutral-800'
                                        : 'border-red-200 bg-red-50 text-red-500'
                                    }`}
                                  />
                                </div>
                              ))}
                              {isPending && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5 flex-shrink-0" title="Cambio pendiente de aplicar" />
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Status badge */}
                      <div className="px-3 py-3">
                        {isDraft ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> Oculto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Visible
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="px-3 py-3 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditOpen(p)}
                          className="p-1.5 text-neutral-400 hover:text-[#116dff] hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Barra de confirmación de cambios de inventario/tallas (aparece solo tras modificar) */}
        {pendingStockIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1b2333] text-white shadow-2xl border-t-2 border-[#d88193]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={14} className={applyingStock ? 'animate-spin text-[#d88193]' : 'text-[#d88193]'} />
                {applyingStock
                  ? 'Publicando cambios…'
                  : `${pendingStockIds.length} producto(s) con inventario/tallas modificados sin confirmar.`}
              </p>
              <div className="flex items-center gap-2">
                {!applyingStock && (
                  <button
                    type="button"
                    onClick={() => { setPendingStockIds([]); setInventoryMsg(null); }}
                    className="text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white px-3 py-2"
                  >
                    Descartar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleApplyStockChanges}
                  disabled={applyingStock}
                  className="bg-[#d88193] hover:bg-[#c06f81] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 flex items-center gap-2 transition-colors"
                >
                  <CheckCircle size={14} />
                  {applyingStock ? 'Aplicando…' : `Aplicar cambios (${pendingStockIds.length})`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de resultado de la aplicación de cambios */}
        {inventoryMsg && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-wider shadow-2xl border border-[#d88193]">
            {inventoryMsg}
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
                Crea, edita o elimina las categorías principales que se muestran en la barra superior del catálogo público (ej. Jeans, Shorts, Faldas, Cargos, Bermuda).
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

        {/* ── TAB 5: CONFIGURACIÓN ── */}
        {/* ── TAB 6: RESPALDOS Y LIMPIEZA MENSUAL ── */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* Recordatorio mensual */}
            <div className={`bg-white p-6 border shadow-sm ${backupCountdown.overdue ? 'border-red-300' : 'border-[#d88193]/40 border-l-4 border-l-[#d88193]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide flex items-center gap-2">
                    <History size={16} className="text-[#d88193]" />
                    Respaldo Mensual Automático
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    Para no saturar el plan gratuito de Supabase, cada <strong>último viernes del mes a las 3:30 PM</strong> debes
                    exportar el respaldo y vaciar las tablas de datos transaccionales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadReminderIcs(getNextBackupReminder())}
                  className="text-xs font-bold uppercase tracking-wider text-ush-pink hover:text-ush-navy border border-[#d88193]/40 px-3 py-2 flex items-center gap-1.5"
                >
                  <CheckCircle size={14} /> Agregar recordatorio a mi calendario (.ics)
                </button>
              </div>

              <div className="mt-4 p-4 bg-neutral-50 border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Próximo respaldo</p>
                  <p className="text-sm font-black text-ush-navy mt-1 capitalize">{formatReminder(backupReminder)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Días</p>
                  <p className="text-2xl font-black text-[#d88193] mt-1">{backupCountdown.days}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Horas</p>
                  <p className="text-2xl font-black text-[#d88193] mt-1">{backupCountdown.hours}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Minutos</p>
                  <p className="text-2xl font-black text-[#d88193] mt-1">{backupCountdown.minutes}</p>
                </div>
              </div>
              {backupCountdown.overdue && (
                <p className="mt-2 text-xs font-bold text-red-600">
                  ⚠️ ¡Ya pasó la fecha! Exporta el respaldo y vacía los datos lo antes posible.
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-black uppercase text-[#1b2333] tracking-wide mb-1">
                  <Save size={14} className="inline-block mr-1 text-[#d88193]" /> 1. Exportar respaldo (JSON)
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Descarga todos los datos (productos, pedidos, formularios y historial de precios) en un solo archivo JSON.
                  Guárdalo en tu computadora o nube antes de vaciar.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={backupLoading}
                  className="bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-sm hover:bg-[#d88193] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {backupLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {backupLoading ? 'Exportando...' : 'Exportar Respaldo (JSON)'}
                </button>
              </div>

              <div className="bg-white p-6 border border-red-200 shadow-sm">
                <h3 className="text-sm font-black uppercase text-red-700 tracking-wide mb-1">
                  <Trash2 size={14} className="inline-block mr-1" /> 2. Vaciar datos transaccionales
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Elimina de Supabase los <strong>pedidos, formularios de contacto y el historial de precios</strong>.
                  El catálogo (productos, precios y fotos) NO se elimina. Esto libera espacio del plan gratuito.
                </p>
                <button
                  type="button"
                  onClick={handlePurge}
                  disabled={backupLoading}
                  className="bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-sm hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Vaciar Tablas Transaccionales
                </button>
              </div>
            </div>

            {backupMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" /> {backupMsg}
              </div>
            )}
            {backupError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <X size={16} className="text-red-600" /> {backupError}
              </div>
            )}

            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Consejo: el recordatorio también se muestra aquí cada vez que entres al panel. Para asegurarte de no olvidarlo,
              usa el botón <strong>“Agregar recordatorio a mi calendario (.ics)”</strong>, que lo guarda en tu Google Calendar u Outlook.
            </p>
          </div>
        )}

        {/* ── TAB: PEDIDOS (confirmar pago → descontar stock) ── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#d88193]" />
                    Pedidos Recibidos
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    Cuando el cliente confirme el pago, haz clic en <strong>“Confirmar pago y descontar stock”</strong>:
                    se reducen las unidades de cada talla en Supabase y la página pública se actualiza al instante en todos los dispositivos.
                    Si el cliente <strong>no toma el pedido</strong>, usa <strong>“Cancelar pedido”</strong>: quedará marcado como
                    <strong> carrito abandonado</strong> y, si ya había confirmado, el stock se restaura automáticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadOrders()}
                  className="text-xs font-bold uppercase tracking-wider text-ush-pink hover:text-ush-navy border border-[#d88193]/40 px-3 py-2 flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>

              {orderMsg && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" /> {orderMsg}
                </div>
              )}

              {/* Filtro de estados de pedido */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {([
                  ['todos', `Todos (${orders.length})`],
                  ['pending', 'Pendientes'],
                  ['confirmed', 'Confirmados'],
                  ['canceled', 'Cancelados · Carritos abandonados'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOrderStatusFilter(key)}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-all ${
                      orderStatusFilter === key
                        ? 'bg-[#1b2333] text-white border-[#1b2333]'
                        : 'bg-white text-neutral-600 border-gray-200 hover:border-[#d88193] hover:text-[#d88193]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loadingOrders ? (
                <div className="py-16 text-center text-sm text-neutral-400 font-bold uppercase tracking-wider">
                  Cargando pedidos…
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag size={36} className="mx-auto text-neutral-300 mb-3" />
                  <p className="text-sm font-bold uppercase text-neutral-600">Aún no hay pedidos registrados</p>
                  <p className="text-xs text-neutral-400 mt-1">Los pedidos aparecen aquí en tiempo real cuando el cliente los registra en el checkout.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders
                    .filter((order) => {
                      if (orderStatusFilter === 'todos') return true;
                      const key = order.status === 'confirmed' ? 'confirmed' : order.status === 'canceled' ? 'canceled' : 'pending';
                      return key === orderStatusFilter;
                    })
                    .map((order) => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    const statusKey = order.status === 'confirmed' ? 'confirmed' : order.status === 'canceled' ? 'canceled' : 'pending';
                    const statusMeta = {
                      pending: { card: 'border-amber-200 bg-amber-50/40', badge: 'bg-amber-100 text-amber-800', label: 'Pendiente de pago' },
                      confirmed: { card: 'border-emerald-200 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-800', label: 'Confirmado' },
                      canceled: { card: 'border-red-200 bg-red-50/40', badge: 'bg-red-100 text-red-700', label: 'Cancelado · Carrito abandonado' },
                    }[statusKey];
                    return (
                      <div key={order.id} className={`border ${statusMeta.card} p-4`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-[#1b2333]">Pedido {order.id}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${statusMeta.badge}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              {order.order_date || new Date(order.created_at || Date.now()).toLocaleDateString('es-CO')} · {order.customer_name} · {order.city} · {formatCOP(order.total)}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {order.payment_method} · {order.customer_phone}
                            </p>
                          </div>

                          {statusKey !== 'canceled' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {statusKey === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmOrder(order)}
                                  disabled={confirmingOrderId === order.id || cancelingOrderId === order.id}
                                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 transition-colors"
                                >
                                  <CheckCircle size={14} />
                                  {confirmingOrderId === order.id ? 'Confirmando…' : 'Confirmar pago y descontar stock'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order)}
                                disabled={cancelingOrderId === order.id || confirmingOrderId === order.id}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 transition-colors"
                              >
                                <XCircle size={14} />
                                {cancelingOrderId === order.id ? 'Cancelando…' : 'Cancelar pedido'}
                              </button>
                            </div>
                          )}
                        </div>

                        {items.length > 0 && (
                          <div className="mt-3 border border-gray-200 bg-white overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="px-3 py-2">Ref</th>
                                  <th className="px-3 py-2">Prenda</th>
                                  <th className="px-3 py-2">Talla</th>
                                  <th className="px-3 py-2">Color</th>
                                  <th className="px-3 py-2 text-right">Cant</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  // Agrupa por referencia: "REF → Talla 6: 5 uds · Talla 8: 3 uds"
                                  const grouped: Record<string, { name: string; color: string; sizes: { size: string; qty: number }[]; total: number }> = {};
                                  items.forEach((it: any) => {
                                    const refKey = String(it.reference || '—');
                                    const colorKey = String(it.color || '—');
                                    const key = `${refKey}::${colorKey}`;
                                    if (!grouped[key]) grouped[key] = { name: it.name, color: colorKey, sizes: [], total: 0 };
                                    const g = grouped[key];
                                    const size = it.size || 'Única';
                                    const existing = g.sizes.find(s => s.size === size);
                                    const qty = Number(it.quantity) || 0;
                                    if (existing) existing.qty += qty;
                                    else g.sizes.push({ size, qty });
                                    g.total += qty;
                                  });
                                  return Object.entries(grouped).map(([key, g]) => (
                                    <tr key={key} className="border-t border-gray-100">
                                      <td className="px-3 py-2 font-bold text-[#1b2333]">{key.split('::')[0]}</td>
                                      <td className="px-3 py-2 text-neutral-600">{g.name}</td>
                                      <td className="px-3 py-2">
                                        {g.sizes.map(s => (
                                          <span key={s.size} className="inline-flex items-baseline gap-1 mr-3">
                                            <span className="font-bold text-[#1b2333]">{s.size}</span>
                                            <span className="text-neutral-400">·</span>
                                            <span className="font-semibold">{s.qty} uds</span>
                                          </span>
                                        ))}
                                      </td>
                                      <td className="px-3 py-2">{g.color}</td>
                                      <td className="px-3 py-2 text-right font-bold">{g.total}</td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 7: EDITOR DEL SITIO WEB (tipo Wix) ── */}
        {activeTab === 'site' && (
          <SiteContentEditor onExit={() => setActiveTab('products')} />
        )}

      </div>

      {/* ── EDIT PRODUCT DRAWER — Wix Studio Style ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex overflow-hidden" style={{background: 'rgba(0,0,0,0.55)'}}>
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setEditingProduct(null)} />

          {/* Drawer Panel */}
          <div className="bg-white w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden">

            {/* Drawer Header — Wix Studio style */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setEditingProduct(null)} className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-gray-100 rounded transition-colors">
                  <X size={18} />
                </button>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingProduct.id ? editingProduct.name || 'Editar Producto' : '+ Nuevo Producto'}
                </h3>
                {editingProduct.id && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    editingProduct.hidden ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {editingProduct.hidden ? 'Oculto' : 'Visible'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-1.5 border border-gray-300 text-xs font-semibold text-neutral-600 hover:bg-gray-50 rounded transition-colors"
                >
                  Descartar
                </button>
                <button
                  form="product-edit-form"
                  type="submit"
                  className="px-5 py-1.5 bg-[#116dff] text-white text-xs font-bold rounded hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                >
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-1 overflow-hidden">

              {/* ── LEFT COLUMN: Main Content ── */}
              <form id="product-edit-form" onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 border-r border-gray-200">
              
              {/* Section: Nombre */}
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Nombre de la referencia *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Ej: REF: 559100 Jean Wide Leg"
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] focus:ring-1 focus:ring-[#116dff]/20"
                />
              </div>

              {/* Section: Referencia / SKU */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Referencia / SKU</label>
                  <input
                    type="text"
                    value={editingProduct.reference || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reference: e.target.value })}
                    placeholder="Ej: 559100"
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] focus:ring-1 focus:ring-[#116dff]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Slug (URL)</label>
                  <input
                    type="text"
                    value={editingProduct.slug || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    placeholder="Ej: ref-559100"
                    className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] focus:ring-1 focus:ring-[#116dff]/20"
                  />
                </div>
              </div>

              {/* Section: Descripción */}
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Descripción corta</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Ej: Jean Wide Leg Tiro Alto Premium — Confección nacional estilizadora..."
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:border-[#116dff] focus:ring-1 focus:ring-[#116dff]/20 resize-none"
                />
              </div>

              {/* Pricing Section */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 border border-gray-200 rounded">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Precio Sugerido Venta (PVP) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">$</span>
                    <input
                      type="number"
                      required
                      value={editingProduct.suggested_price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, suggested_price: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded pl-7 pr-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#116dff] mb-1.5">Precio Mayorista (12+ uds) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">$</span>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded pl-7 pr-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] font-bold"
                    />
                  </div>
                </div>
              </div>


              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">Etiquetas / Tags <span className="text-neutral-400 font-normal text-xs">(separadas por coma)</span></label>
                <input
                  type="text"
                  value={(editingProduct.tags || []).join(', ')}
                  onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Ej: denim, tiro alto, wide leg"
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:border-[#116dff]"
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
                        <div className="relative w-full h-full">
                          <img
                            src={imgUrl}
                            alt={`Imagen ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallbackEl = (e.target as HTMLElement).nextElementSibling;
                              if (fallbackEl) fallbackEl.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden absolute inset-0 bg-gradient-to-br from-neutral-100 to-rose-50 flex-col items-center justify-center text-center p-2">
                            <ImageIcon size={20} className="text-ush-pink opacity-60 mb-1" />
                            <p className="text-[8px] font-black uppercase tracking-widest text-ush-navy leading-tight">Foto<br />Próximamente</p>
                          </div>
                        </div>

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

            </form>

              {/* ── RIGHT SIDEBAR: Settings ── */}
              <div className="w-72 flex-shrink-0 overflow-y-auto px-5 py-6 space-y-6 bg-gray-50">

                {/* Visibility Toggle */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                  <h4 className="text-sm font-bold text-neutral-800">Mostrar en tienda</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">
                      {editingProduct.hidden ? 'Oculto para clientes' : 'Visible en el catálogo'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, hidden: !editingProduct.hidden, status: editingProduct.hidden ? 'published' : 'draft' })}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        editingProduct.hidden ? 'bg-gray-300' : 'bg-[#116dff]'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        editingProduct.hidden ? 'left-0.5' : 'left-5'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                  <h4 className="text-sm font-bold text-neutral-800">Categoría</h4>
                  <select
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] bg-white"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Fit */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                  <h4 className="text-sm font-bold text-neutral-800">Fit / Corte</h4>
                  <select
                    value={editingProduct.fit || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] bg-white"
                  >
                    <option value="">Sin fit</option>
                    {availableFits.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                  <h4 className="text-sm font-bold text-neutral-800">Color</h4>
                  <select
                    value={editingProduct.color || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] bg-white"
                  >
                    <option value="">Sin color</option>
                    {DEFAULT_COLORS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-500">
                    Se muestra en la tarjeta y se envía por WhatsApp al asesor al pedir el producto.
                  </p>
                </div>

                {/* Ribbon / Badge */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                  <h4 className="text-sm font-bold text-neutral-800">Cinta / Etiqueta</h4>
                  <select
                    value={editingProduct.ribbon || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, ribbon: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-[#116dff] bg-white"
                  >
                    <option value="">Sin cinta</option>
                    <option value="Nuevo">🆕 Nuevo</option>
                    <option value="Más vendido">🔥 Más vendido</option>
                    <option value="Oferta">🏷️ Oferta</option>
                    <option value="Exclusivo">⭐ Exclusivo</option>
                  </select>
                  {editingProduct.ribbon && (
                    <div className="text-[10px] text-neutral-500">
                      Se muestra como badge en la tarjeta del producto.
                    </div>
                  )}
                </div>

                {/* Más Vendido Toggle */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-2">
                  <h4 className="text-sm font-bold text-neutral-800">Más Vendido 🔥</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">Destacar en sección principal</p>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, is_best_seller: !editingProduct.is_best_seller })}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        editingProduct.is_best_seller ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        editingProduct.is_best_seller ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Tallas */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                  <h4 className="text-sm font-bold text-neutral-800">Tallas disponibles</h4>
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
                          className={`w-10 h-10 text-sm font-bold border-2 rounded transition-all ${
                            isChecked
                              ? 'bg-[#116dff] text-white border-[#116dff]'
                              : 'bg-white text-neutral-500 border-gray-300 hover:border-[#116dff]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inventario por talla */}
                <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-800">Inventario por talla</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                      Stock
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Cantidad disponible de cada talla. Si el total es 0, la prenda se muestra agotada.
                  </p>
                  <div className="space-y-2">
                    {ALL_SIZES.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      const stockValue = stockBySize[size] ?? 0;
                      return (
                        <div key={size} className={`flex items-center justify-between gap-3 p-2 border rounded ${
                          isSelected ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-gray-50 opacity-50'
                        }`}>
                          <label className="text-xs font-bold text-neutral-700 w-10">
                            Talla {size}
                          </label>
                          <div className="flex items-center gap-1.5 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSelected) return;
                                setStockBySize({ ...stockBySize, [size]: Math.max(0, (stockBySize[size] ?? 0) - 1) });
                              }}
                              className={`w-7 h-7 border flex items-center justify-center text-sm font-bold ${
                                isSelected ? 'border-gray-300 text-neutral-700 hover:bg-gray-100' : 'border-gray-200 text-neutral-300'
                              }`}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={stockValue}
                              disabled={!isSelected}
                              onChange={(e) => {
                                const v = Math.max(0, parseInt(e.target.value) || 0);
                                setStockBySize({ ...stockBySize, [size]: v });
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-bold text-center text-neutral-900 focus:outline-none focus:border-[#116dff] disabled:bg-gray-100"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSelected) return;
                                setStockBySize({ ...stockBySize, [size]: (stockBySize[size] ?? 0) + 1 });
                              }}
                              className={`w-7 h-7 border flex items-center justify-center text-sm font-bold ${
                                isSelected ? 'border-gray-300 text-neutral-700 hover:bg-gray-100' : 'border-gray-200 text-neutral-300'
                              }`}
                            >
                              +
                            </button>
                          </div>
                          <span className={`text-[10px] font-black uppercase w-14 text-right ${
                            stockValue === 0 ? 'text-rose-500' : 'text-emerald-600'
                          }`}>
                            {stockValue === 0 ? 'Agotado' : 'OK'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>{/* end two-column layout */}
          </div>{/* end drawer */}
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
