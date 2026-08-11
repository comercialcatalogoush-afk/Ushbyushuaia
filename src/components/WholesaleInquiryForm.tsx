'use client';

import React, { useState } from 'react';
import { submitWholesaleLead } from '@/lib/supabase';
import { Send, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export const WholesaleInquiryForm: React.FC = () => {
  const [formData, setFormData] = useState({
    doc_type: 'CC',
    doc_number: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await submitWholesaleLead(formData);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setFormData({ doc_type: 'CC', doc_number: '', name: '', email: '', phone: '', city: '', message: '' });
    } else {
      setError('Hubo un error al enviar la solicitud. Intenta nuevamente.');
    }
  };

  return (
    <div className="bg-white p-8 border border-gray-200 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={20} className="text-ush-pink" />
        <h3 className="text-xl font-black uppercase tracking-tight text-ush-navy">
          Solicitar Atención Mayorista
        </h3>
      </div>
      
      <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
        Déjanos tus datos de contacto y número de documento / NIT para enviarte el catálogo PDF actualizado con precios especiales y cotización de despacho.
      </p>

      {success ? (
        <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 text-center animate-fadeIn">
          <CheckCircle size={36} className="mx-auto text-emerald-600 mb-2" />
          <h4 className="text-base font-bold uppercase">¡Solicitud Recibida!</h4>
          <p className="text-xs mt-1 text-emerald-700">
            Un asesor especializado en logística mayorista se pondrá en contacto contigo en breve.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 text-xs font-bold uppercase underline text-emerald-900"
          >
            Enviar otra consulta
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Document Type & Document Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Tipo Doc. *
              </label>
              <select
                value={formData.doc_type}
                onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
              >
                <option value="CC">C.C. (Cédula)</option>
                <option value="NIT">NIT (Empresa)</option>
                <option value="CE">C.E. (Extranjería)</option>
                <option value="PAS">Pasaporte</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Número de Documento / NIT *
              </label>
              <input
                type="text"
                required
                value={formData.doc_number}
                onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                placeholder="Ej: 1020304050 o 900123456-1"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Nombre Completo / Razón Social *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Laura Gómez / Comercializadora Moda S.A.S."
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@tunegocio.com"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+57 300 123 4567"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Ciudad / Municipio *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ej: Medellín, Bogotá, Cali, Itagüí..."
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Mensaje o Referencias de Interés
            </label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Indica cantidades aproximadas, despiece de tallas o inquietudes de envío..."
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ush-navy text-white font-bold py-4 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ush-pink transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span>Enviando Solicitud...</span>
            ) : (
              <>
                <Send size={16} />
                <span>Enviar Solicitud Mayorista</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
