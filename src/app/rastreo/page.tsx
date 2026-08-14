'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Package, MapPin, Truck, Calendar, CheckCircle2, ArrowLeft, Loader2, AlertTriangle, Clock, FileText, RefreshCw, Navigation } from 'lucide-react';

// Formato real del API de Coordinadora (guía existente)
interface CoordEvent {
  id_estado: number;
  nombre_estado: string;
  fecha_estado: string;
  hora_estado: string;
  internacional?: boolean;
  droop_point?: string;
  action_url?: string;
}

interface CoordTrackingResponse {
  guia: string;
  estado_actual: string;
  id_estado_actual: number;
  estado: CoordEvent[];
  novedad: any[];
  vinculos: any[];
  origen: string;
  destino: string;
  dias_promesa_servicio: number;
  guia_digital?: string;
  // Formato antiguo (guía no existe)
  tracking_number?: string;
  current_state_text?: string;
  states?: { code: string; date: string; description: string }[];
}

interface NormalizedTracking {
  guia: string;
  estado_actual: string;
  id_estado: number;
  origen: string;
  destino: string;
  events: { id: number; nombre: string; fecha: string; hora: string; descripcion?: string }[];
  guia_digital?: string;
  dias_promesa?: number;
  noExiste: boolean;
}

const COORDINADORA_STATES: Record<number, { label: string; color: string; badge: string }> = {
  15: { label: 'En posesión del Remitente', color: 'bg-neutral-100 text-neutral-600 border-neutral-300', badge: 'bg-neutral-500' },
  1:  { label: 'Recogida', color: 'bg-amber-50 text-amber-800 border-amber-200', badge: 'bg-amber-500' },
  2:  { label: 'En Terminal origen', color: 'bg-blue-50 text-blue-800 border-blue-200', badge: 'bg-blue-500' },
  3:  { label: 'En transporte', color: 'bg-blue-50 text-blue-800 border-blue-200', badge: 'bg-blue-500' },
  5:  { label: 'En Terminal destino', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', badge: 'bg-indigo-500' },
  6:  { label: 'En Distribución', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', badge: 'bg-indigo-500' },
  8:  { label: 'Entregada', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', badge: 'bg-emerald-500' },
};

function normalize(data: CoordTrackingResponse): NormalizedTracking {
  // Formato nuevo (guía real): estado_actual + estado[]
  if (data.guia && data.estado_actual) {
    const events = (Array.isArray(data.estado) ? data.estado : []).map((ev) => ({
      id: ev.id_estado,
      nombre: ev.nombre_estado,
      fecha: ev.fecha_estado,
      hora: ev.hora_estado,
      descripcion: ev.droop_point,
    }));
    return {
      guia: data.guia,
      estado_actual: data.estado_actual,
      id_estado: data.id_estado_actual,
      origen: data.origen || 'No definido',
      destino: data.destino || 'No definido',
      events,
      guia_digital: data.guia_digital,
      dias_promesa: data.dias_promesa_servicio,
      noExiste: false,
    };
  }

  // Formato antiguo (guía inexistente)
  const noExiste = !!(data.current_state_text && data.current_state_text.toLowerCase().includes('no existe'));
  const events = (Array.isArray(data.states) ? data.states : []).map((ev) => {
    const [fecha, hora] = (ev.date || '').split(' ');
    return { id: Number(ev.code) || 0, nombre: ev.description, fecha, hora: hora || '', descripcion: undefined };
  });
  return {
    guia: data.tracking_number || data.guia || '',
    estado_actual: noExiste ? 'Guía no encontrada' : (data.current_state_text || 'En tránsito'),
    id_estado: noExiste ? 0 : 3,
    origen: 'No definido',
    destino: 'No definido',
    events,
    dias_promesa: undefined,
    noExiste,
  };
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
  const [result, setResult] = useState<NormalizedTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const consultar = useCallback(async (numero: string, isAutoRefresh = false) => {
    const clean = numero.trim().replace(/\s+/g, '');
    if (!clean) return;
    if (isAutoRefresh) setRefreshing(true); else { setLoading(true); setError(null); setResult(null); }

    try {
      const carrier = CARRIERS[0];
      const res = await fetch(carrier.endpoint(clean));
      if (!res.ok) {
        if (!isAutoRefresh) setError('No pudimos consultar la guía en la transportadora. Inténtalo de nuevo en unos minutos.');
        return;
      }
      const data: CoordTrackingResponse = await res.json();
      const norm = normalize(data);
      setResult(norm);
      setLastUpdated(new Date());
      if (norm.noExiste && !isAutoRefresh) {
        setError('La guía no fue encontrada. Verifica el número e inténtalo de nuevo.');
      }
    } catch (_) {
      if (!isAutoRefresh) setError('Error de conexión con la transportadora. Verifica tu conexión e inténtalo de nuevo.');
    }
    if (isAutoRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    consultar(guia, false);
  };

  // Auto-refresh en tiempo real (cada 30s) mientras haya una guía consultada
  useEffect(() => {
    if (!result || result.noExiste) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      consultar(result.guia, true);
    }, 30000);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [result, consultar]);

  const stateInfo = result ? COORDINADORA_STATES[result.id_estado] : undefined;

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
            Ingresa el número de guía que te envió tu asesor al confirmar el despacho. Podrás seguir el estado de tu pedido en tiempo real con actualización automática.
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
            El estado se consulta directamente en la transportadora y se actualiza automáticamente cada 30 segundos.
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
            {/* Summary Header — réplica de Coordinadora */}
            <div className="p-6 sm:p-8 bg-ush-navy text-white">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      Estado Actual
                    </p>
                    {refreshing && (
                      <RefreshCw size={11} className="text-ush-pink animate-spin" />
                    )}
                  </div>
                  <h2
                    className={`text-2xl sm:text-3xl font-black uppercase mt-1 inline-block px-3 py-1 ${
                      stateInfo ? stateInfo.color : 'bg-ush-pink text-white'
                    }`}
                  >
                    {result.estado_actual}
                  </h2>
                  <p className="text-xs text-white/70 mt-2 font-medium">
                    Guía No. <span className="font-black text-white">{result.guia}</span>
                    {result.dias_promesa ? ` · Promesa de entrega: ${result.dias_promesa} días` : ''}
                  </p>
                  {lastUpdated && (
                    <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                      <Clock size={10} /> Actualizado: {lastUpdated.toLocaleTimeString('es-CO')}
                    </p>
                  )}
                </div>

                {/* Origen → Destino */}
                <div className="flex items-center gap-3 sm:gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Origen</p>
                    <p className="font-black text-white mt-0.5">{result.origen}</p>
                  </div>
                  <div className="flex flex-col items-center text-ush-pink">
                    <Navigation size={16} />
                    <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">→</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Destino</p>
                    <p className="font-black text-white mt-0.5">{result.destino}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guía digital (etiqueta) */}
            {result.guia_digital && (
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-neutral-50">
                <Package size={16} className="text-ush-pink shrink-0" />
                <p className="text-xs text-neutral-600 font-medium">Guía digital disponible:</p>
                <a
                  href={result.guia_digital}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-ush-pink hover:underline ml-auto"
                >
                  Ver etiqueta de la guía →
                </a>
              </div>
            )}

            {/* Timeline — réplica de Coordinadora */}
            <div className="p-6 sm:p-8">
              {result.events.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
                  <div className="space-y-6">
                    {result.events.map((ev, idx) => {
                      const isLast = idx === 0;
                      const st = COORDINADORA_STATES[ev.id];
                      const isDone = isLast || ev.id === 8 || (ev.id && st && ['6', '5', '8'].includes(String(ev.id)));
                      return (
                        <div key={idx} className="relative flex gap-4 pl-12">
                          <div
                            className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 ${
                              isDone
                                ? 'bg-white border-emerald-500 text-emerald-600'
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}
                          >
                            {isDone ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          </div>
                          <div className="pt-0.5">
                            <span
                              className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${st ? st.color : 'bg-neutral-100 text-neutral-600 border border-neutral-300'}`}
                            >
                              {ev.nombre}
                            </span>
                            <p className="text-[11px] text-neutral-400 font-medium mt-1 flex items-center gap-1">
                              <Calendar size={11} /> {ev.fecha} · {ev.hora}
                            </p>
                            {ev.descripcion && (
                              <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                                <MapPin size={11} /> {ev.descripcion}
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