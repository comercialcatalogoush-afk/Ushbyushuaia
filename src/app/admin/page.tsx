'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProductsFromSupabase, supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Plus, Edit3, Trash2, Save, X, ArrowLeft, Image as ImageIcon, Video, CheckCircle, CheckSquare, Square } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['6', '8', '10', '12', '14']);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { formatCOP } = useCart();

  const allAvailableSizes = ['6', '8', '10', '12', '14'];

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchProductsFromSupabase();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenNew = () => {
    setSelectedSizes(['6', '8', '10', '12', '14']);
    setEditingProduct({
      id: '',
      name: 'REF: ',
      reference: '',
      slug: '',
      suggested_price: 49900,
      price: 32400,
      ribbon: 'Nuevo',
      description: 'Prenda confeccionada en mezclilla rígida de alta calidad.',
      full_description: 'Prenda en mezclilla rígida con corte estilizador confeccionada en Colombia.',
      in_stock: true,
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'],
      video_url: ''
    });
  };

  const handleEditOpen = (product: Product) => {
    const sizeOpt = product.options?.find(o => o.key.toLowerCase() === 'talla');
    setSelectedSizes(sizeOpt?.values || ['6', '8', '10', '12', '14']);
    setEditingProduct(product);
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size].sort((a, b) => parseInt(a) - parseInt(b)));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const slug = editingProduct.slug || editingProduct.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ref-' + Date.now();
    const reference = editingProduct.reference || editingProduct.name?.replace(/ref:?/i, '').trim() || 'REF';

    const optionsPayload = [
      {
        id: 'talla-opt',
        key: 'Talla',
        values: selectedSizes.length > 0 ? selectedSizes : ['6', '8', '10', '12', '14']
      }
    ];

    const payload = {
      name: editingProduct.name,
      reference,
      slug,
      suggested_price: editingProduct.suggested_price || editingProduct.price || 49900,
      price: editingProduct.price || 32400,
      compare_price: editingProduct.suggested_price || 0,
      ribbon: editingProduct.ribbon || '',
      description: editingProduct.description || '',
      full_description: editingProduct.full_description || '',
      video_url: editingProduct.video_url || '',
      in_stock: editingProduct.in_stock !== false,
      options: JSON.stringify(optionsPayload),
      images: editingProduct.images || []
    };

    if (editingProduct.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (error) console.error('Error updating product:', error.message);
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (error) console.error('Error inserting product:', error.message);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setEditingProduct(null);
    await loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta referencia del catálogo?')) {
      await supabase.from('products').delete().eq('id', id);
      await loadProducts();
    }
  };

  return (
    <div className="py-12 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-ush-pink hover:underline mb-2">
              <ArrowLeft size={14} /> Volver a la Tienda
            </Link>
            <h1 className="text-2xl font-black uppercase text-ush-navy tracking-tight">
              Panel de Administración & Edición del Catálogo
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Gestiona referencias, precios mayoristas vs e-commerce, tallas disponibles (6 a 14), fotos y videos promocionales.
            </p>
          </div>

          <button
            onClick={handleOpenNew}
            className="bg-ush-pink hover:bg-ush-pinkHover text-white font-bold px-5 py-3 text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            <span>Agregar Nueva Referencia</span>
          </button>
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
                    </select>
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
                      placeholder="49900"
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
                      placeholder="32400"
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
                    {allAvailableSizes.map((size) => {
                      const isChecked = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
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
                    Descripción Corta (Resumen para la tarjeta)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="Short largo en denim flexible..."
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Descripción Completa & Detalles Técnicos
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.full_description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, full_description: e.target.value })}
                    placeholder="Prenda confeccionada en mezclilla de alta durabilidad con costuras en contraste..."
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                    <ImageIcon size={14} /> URLs de Imágenes (una por línea)
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.images?.join('\n') || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: e.target.value.split('\n').filter(Boolean) })}
                    placeholder="https://static.wixstatic.com/media/..."
                    className="w-full border border-gray-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                    <Video size={14} /> URL de Video Promocional (Opcional MP4 o YouTube)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.video_url || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, video_url: e.target.value })}
                    placeholder="https://video.wixstatic.com/...mp4"
                    className="w-full border border-gray-300 p-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:border-ush-pink"
                  />
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
              Referencias Actuales en el Catálogo ({products.length})
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
