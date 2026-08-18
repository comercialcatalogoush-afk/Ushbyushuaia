'use client';

import React, { useState } from 'react';
import { submitWholesaleLead } from '@/lib/supabase';
import { Send, CheckCircle, AlertCircle, FileText, ChevronDown, Search } from 'lucide-react';
import { COLOMBIA_DEPARTMENTS, COLOMBIA_MUNICIPALITIES, PHONE_COUNTRIES } from '@/lib/colombia';

export const WholesaleInquiryForm: React.FC = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    doc_type: 'CC',
    doc_number: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    department: '',
    notes: ''
  });
  const [cityQuery, setCityQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<string>('+57');
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const extraLines = [
      formData.company && `Empresa / Razón Social: ${formData.company}`,
      formData.address && `Dirección: ${formData.address}`,
      formData.department && `Departamento: ${formData.department}`,
      formData.notes && `Notas / Referencias: ${formData.notes}`,
    ].filter(Boolean);

    const res = await submitWholesaleLead({
      doc_type: formData.doc_type,
      doc_number: formData.doc_number,
      name: formData.name,
      email: formData.email,
      phone: formData.phone.includes('+') ? formData.phone : `${phoneCountry} ${formData.phone}`,
      city: formData.city,
      message: [`Fecha: ${formData.date}`, ...extraLines].join('\n'),
    });
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        doc_type: 'CC', doc_number: '', name: '', company: '', email: '',
        phone: '', address: '', city: '', department: '', notes: ''
      });
      setCityQuery('');
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

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Fecha de la Consulta *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
            />
          </div>

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

          {/* Nombre y Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Nombre y Apellidos *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Laura Gómez"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Razón Social / Empresa <span className="text-neutral-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Ej: Boutique Moda SAS"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>
          </div>

          {/* Contacto */}
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
              <div className="flex items-stretch relative">
                <button
                  type="button"
                  onClick={() => { setPhoneCountryOpen((o) => !o); setPhoneQuery(''); }}
                  className="border border-gray-300 border-r-0 bg-white px-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-ush-pink flex items-center gap-1"
                  title="Código de país"
                >
                  <span className="text-base leading-none">{PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.flag}</span>
                  <span>{phoneCountry}</span>
                  <ChevronDown size={12} className="text-neutral-400" />
                </button>

                {phoneCountryOpen && (
                  <div className="absolute z-30 left-0 top-full mt-1 w-64 bg-white border border-gray-300 shadow-xl">
                    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                      <Search size={14} className="text-neutral-400" />
                      <input
                        type="text"
                        value={phoneQuery}
                        onChange={(e) => setPhoneQuery(e.target.value)}
                        placeholder="Buscar país o código..."
                        autoFocus
                        className="w-full text-xs focus:outline-none text-neutral-900"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {PHONE_COUNTRIES.filter((c) => c.country.toLowerCase().includes(phoneQuery.toLowerCase()) || c.code.includes(phoneQuery)).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => { setPhoneCountry(c.code); setPhoneCountryOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-ush-pinkLight flex items-center gap-2 ${phoneCountry === c.code ? 'font-bold text-ush-pink bg-ush-pinkLight' : 'text-neutral-700'}`}
                        >
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="font-bold">{c.code}</span>
                          <span className="text-neutral-500">{c.country}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.placeholder || '300 000 0000'}
                  className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                {PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.flag} {PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.country} — se enviará como {phoneCountry} {formData.phone || 'tu número'}
              </p>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Dirección Completa *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ej: Calle 10 # 43-20, Barrio El Poblado, Apto 301"
              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
            />
            <p className="text-[10px] text-neutral-400 mt-1">Formato: Calle / Carrera # Número-Número, Barrio, Apto/Local</p>
          </div>

          {/* Departamento y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Departamento *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => {
                  setFormData({ ...formData, department: e.target.value, city: '' });
                  setCityQuery('');
                  setCityOpen(false);
                }}
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
              >
                <option value="">Seleccionar departamento...</option>
                {COLOMBIA_DEPARTMENTS.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Ciudad / Municipio *
              </label>
              {(() => {
                const citiesForDep = formData.department
                  ? COLOMBIA_MUNICIPALITIES[formData.department] || []
                  : [];
                const filtered = cityQuery.trim()
                  ? citiesForDep.filter((c) => c.toLowerCase().includes(cityQuery.toLowerCase()))
                  : citiesForDep;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setCityOpen((o) => !o)}
                      className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white flex items-center justify-between"
                    >
                      <span className={formData.city ? 'text-neutral-900' : 'text-neutral-400'}>
                        {formData.city || (formData.department ? 'Buscar ciudad...' : 'Primero selecciona el departamento')}
                      </span>
                      <ChevronDown size={14} className="text-neutral-400" />
                    </button>

                    {cityOpen && formData.department && (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-gray-300 shadow-xl">
                        <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                          <Search size={14} className="text-neutral-400" />
                          <input
                            type="text"
                            value={cityQuery}
                            onChange={(e) => setCityQuery(e.target.value)}
                            placeholder="Filtrar por nombre..."
                            autoFocus
                            className="w-full text-xs focus:outline-none text-neutral-900"
                          />
                        </div>
                        <div className="max-h-44 overflow-y-auto">
                          {filtered.length === 0 ? (
                            <p className="p-3 text-xs text-neutral-400">No se encontraron ciudades.</p>
                          ) : (
                            filtered.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, city: c });
                                  setCityQuery('');
                                  setCityOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-ush-pinkLight ${formData.city === c ? 'font-bold text-ush-pink bg-ush-pinkLight' : 'text-neutral-700'}`}
                              >
                                {c}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              {cityOpen && !formData.department && (
                <p className="text-[10px] text-amber-600 mt-1">Selecciona primero el departamento para ver sus ciudades.</p>
              )}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Mensaje / Referencias de Interés
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
