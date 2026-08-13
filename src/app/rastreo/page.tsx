'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Package, MapPin, Truck, Calendar, CheckCircle2, ArrowLeft, Loader2, AlertTriangle, Clock, FileText } from 'lucide-react';

interface TrackingEvent {
  code: string;
  date: string;
  description: string;
  icon_color?: string;
  action_url?: string;
  droop_point?: string;
  issue_id?: string;
}

interface TrackingResponse {
  tracking_number: string;
  origin: string;
  destination: string;
  current_state_text: string;
  tracking_type: string;
  states: TrackingEvent[];
  history: TrackingEvent[];
}

const CARRIERS = [
  {
    id: 'coordinadora',
    name: 'Coordinadora Mercantil',
    url: 'https://coordinadora.com',
    endpoint: (guia: string) => `https://coordinadora.com/wp-json/rgc/v1/detail_tracking?remission_code=${encodeURIComponent(guia)}`,
    placeholder: 'Ingresa tu número de guía (11 dígitos)',
  },
];

export default function RastreoPage() {
  const [guia, setGuia] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = guia.trim().replace(/\s+/g, '');
    if (!clean) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const carrier = CARRIERS[0];
      const res = await fetch(carrier.endpoint(clean));
      if (!res.ok) {
        setError('No pudimos consultar la guía en la transportadora. Inténtalo de nuevo en unos minutos.');
        setLoading(false);
        return;
      }
      const data: TrackingResponse = await res.json();
      setResult(data);
      if (data.current_state_text?.toLowerCase().includes('no existe')) {
        setError('La guía no fue encontrada. Verifica el número e inténtalo de nuevo.');
      }
    } catch (_) {
      setError('Error de conexión con la transportadora. Verifica tu conexión e inténtalo de nuevo.');
    }
    setLoading(false);
  };

  const states = result?.states && result.states.length > 0 ? [...result.states].reverse() : [];

  return (
    <div className="py-14 bg-neutral-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ush-navy hover:text-ush-pink mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Inicio</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-ush-navy text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Truck size={28} className="text-ush-pink" />
          </div>
          <h1 className="text-3xl font-black uppercase text-ush-navy tracking-tight">
            Rastrear mi Pedido
          </h1>
          <p className="text-sm text-neutral-500 font-medium mt-2 max-w-xl mx-auto">
            Ingresa el número de guía que te envió tu asesor al confirmar el despacho. Podrás seguir el estado de tu pedido en tiempo real.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 border border-gray-200 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
            Número de Guía *
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FileText size={16} className="absolute left-3 top-3.5 text-neutral-400" />
              <input
                type="text"
                required
                value={guia}
                onChange={(e) => setGuia(e.target.value)}
                placeholder={CARRIERS[0].placeholder}
                className="w-full border border-gray-300 pl-9 pr-3 py-3 text-sm text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-ush-navy text-white font-bold py-3 px-6 text-xs uppercase tracking-widest hover:bg-ush-pink transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {loading ? 'Consultando...' : 'Rastrear'}
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2">
            Solo necesitas el número de guía. El estado se consulta directamente en la transportadora.
          </p>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="mt-6 bg-white border border-gray-200 shadow-sm overflow-hidden">
            {/* Summary Header */}
            <div className="p-6 bg-ush-navy text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    Estado Actual
                  </p>
                  <h2 className="text-2xl font-black uppercase mt-1">
                    {result.current_state_text || 'En tránsito'}
                  </h2>
                  <p className="text-xs text-white/70 mt-1 font-medium">
                    Guía No. {result.tracking_number}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={13} className="text-ush-pink" />
                    <span className="text-white/80 font-bold">Origen:</span>
                    <span>{result.origin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Truck size={13} className="text-ush-pink" />
                    <span className="text-white/80 font-bold">Destino:</span>
                    <span>{result.destination}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 sm:p-8">
              {states.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
                  <div className="space-y-6">
                    {states.map((ev, idx) => {
                      const isLast = idx === 0;
                      const isDone = !isLast;
                      return (
                        <div key={idx} className="relative flex gap-4 pl-12">
                          <div
                            className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${
                              isLast
                                ? 'bg-ush-pink border-ush-pink text-white'
                                : 'bg-white border-emerald-500 text-emerald-600'
                            }`}
                          >
                            {isLast ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                          </div>
                          <div className="pt-1">
                            <p className="text-sm font-bold text-ush-navy">{ev.description}</p>
                            <p className="text-[11px] text-neutral-400 font-medium mt-0.5 flex items-center gap-1">
                              <Calendar size={11} /> {ev.date}
                            </p>
                            {ev.droop_point && (
                              <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                                <MapPin size={11} /> {ev.droop_point}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-neutral-400">
                  <Package size={24} className="mx-auto mb-2 text-neutral-300" />
                  Sin eventos de seguimiento todavía.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-4 border border-gray-200">
            <Package size={20} className="mx-auto text-ush-pink mb-2" />
            <p className="text-xs font-bold text-ush-navy uppercase tracking-wide">¿Dónde está mi guía?</p>
            <p className="text-[11px] text-neutral-500 mt-1">Te la envía tu asesor por WhatsApp al confirmar el despacho.</p>
          </div>
          <div className="bg-white p-4 border border-gray-200">
            <Calendar size={20} className="mx-auto text-ush-pink mb-2" />
            <p className="text-xs font-bold text-ush-navy uppercase tracking-wide">Tiempos de entrega</p>
            <p className="text-[11px] text-neutral-500 mt-1">Normalmente 2–4 días hábiles según la ciudad de destino.</p>
          </div>
          <div className="bg-white p-4 border border-gray-200">
            <AlertTriangle size={20} className="mx-auto text-ush-pink mb-2" />
            <p className="text-xs font-bold text-ush-navy uppercase tracking-wide">¿Problemas con tu pedido?</p>
            <p className="text-[11px] text-neutral-500 mt-1">Escríbenos por WhatsApp y te ayudamos a resolverlo de inmediato.</p>
          </div>
        </div>
      </div>
    </div>
  );
}