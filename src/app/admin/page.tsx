'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProductsFromSupabase, supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Plus, Edit3, Trash2, Save, X, ArrowLeft, Image as ImageIcon, Video, CheckCircle, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function AdminCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { formatCOP } = useCart();

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
    setEditingProduct({
      id: '',
      name: 'REF: ',
      reference: '',
      slug: '',
      price: 50000,
      ribbon: 'Nuevo',
      description: 'Prenda confeccionada en mezclilla de alta calidad.',
      full_description: 'Prenda en mezclilla rígida con corte estilizador.',
      in_stock: true,
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'],
      video_url: ''
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const slug = editingProduct.slug || editingProduct.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ref-' + Date.now();
    const reference = editingProduct.reference || editingProduct.name?.replace(/ref:?/i, '').trim() || 'REF';

    const payload = {
      name: editingProduct.name,
      reference,
      slug,
      price: editingProduct.price,
      compare_price: editingProduct.compare_price || 0,
      ribbon: editingProduct.ribbon || '',
      description: editingProduct.description || '',
      full_description: editingProduct.full_description || '',
      video_url: editingProduct.video_url || '',
      in_stock: editingProduct.in_stock !== false,
      options: JSON.stringify(editingProduct.options || []),
      images: editingProduct.images || []
    };

    if (editingProduct.id) {
      // Update existing
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (error) console.error('Error updating product:', error.message);
    } else {
      // Create new
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
              Panel de Edición del Catálogo
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Agrega nuevas referencias, edita fotos, videos, descripciones y precios en tiempo real.
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
                      Precio COP (sin puntos) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      placeholder="49900"
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Estado de Inventario
                    </label>
                    <select
                      value={editingProduct.in_stock ? 'true' : 'false'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.value === 'true' })}
                      className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                    >
                      <option value="true">Disponible (En Stock)</option>
                      <option value="false">Agotado</option>
                    </select>
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
            {products.map((p) => (
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
                    <p className="text-xs font-bold text-neutral-900 mt-1">{formatCOP(p.price)}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 font-light max-w-md">
                      {p.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingProduct(p)}
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
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
