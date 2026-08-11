'use client';

import React, { useState } from 'react';
import { submitWholesaleLead } from '@/lib/supabase';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export const WholesaleInquiryForm: React.FC = () => {
  const [formData, setFormData] = useState({
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
      setFormData({ name: '', email: '', phone: '', city: '', message: '' });
    } else {
      setError('Hubo un error al enviar la solicitud. Intenta nuevamente.');
    }
  };

  return (
    <div className="bg-white p-8 border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold uppercase tracking-tight text-neutral-900 mb-2">
        Solicitar Atención Mayorista
      </h3>
      <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
        Déjanos tus datos de contacto para enviarte nuestro catálogo en PDF con lista especial de precios y asesoría personalizada de despacho.
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Laura Gómez"
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
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
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
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
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
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
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
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
              placeholder="Indica las cantidades aproximadas o dudas sobre despiece de tallas..."
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Enviando...</span>
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
