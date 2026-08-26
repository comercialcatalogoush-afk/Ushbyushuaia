'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Package, MapPin, Truck, CheckCircle2, ArrowLeft, Loader2, AlertTriangle, Clock, FileText, RefreshCw, Navigation, Box } from 'lucide-react';
import { usePageContent } from '@/lib/siteContentHooks';

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

// Colores de marca según estado
const STATE_COLORS: Record<number, { badge: string; dot: string }> = {
  15: { badge: 'bg-ush-pinkSoft text-[#c06579] border border-[#d88193]/40', dot: 'bg-[#c06579]' },
  1:  { badge: 'bg-ush-pinkLight text-[#b5586c] border border-[#d88193]/40', dot: 'bg-[#d88193]' },
  2:  { badge: 'bg-ush-pinkLight text-[#b5586c] border border-[#d88193]/40', dot: 'bg-[#d88193]' },
  3:  { badge: 'bg-ush-pinkLight text-[#b5586c] border border-[#d88193]/40', dot: 'bg-[#d88193]' },
  5:  { badge: 'bg-[#fdf3f5] text-[#c06579] border border-[#d88193]/40', dot: 'bg-[#c06579]' },
  6:  { badge: 'bg-[#fdf3f5] text-[#c06579] border border-[#d88193]/40', dot: 'bg-[#c06579]' },
  8:  { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-300', dot: 'bg-emerald-500' },
};

// Orden cronológico canónico de Coordinadora (de más antiguo a más reciente)
const STATE_ORDER = [15, 1, 2, 3, 5, 6, 8];

function normalize(data: CoordTrackingResponse): NormalizedTracking {
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
  const c = usePageContent('rastreo');
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
    } finally {
      if (isAutoRefresh) setRefreshing(false); else setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    consultar(guia, false);
  };

  // Auto-refresh en tiempo real (cada 30s)
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

  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);

  // Abre la etiqueta: el endpoint devuelve un PDF en base64 envuelto en JSON
  const abrirEtiqueta = async () => {
    if (!result?.guia_digital) return;
    setLabelLoading(true);
    setLabelError(null);
    try {
      const res = await fetch(result.guia_digital);
      const json = await res.json();
      // Estructura: { response: { data: { data: "<base64 pdf>" } } }
      const b64 = json?.response?.data?.data || json?.data?.data || json?.data || null;
      if (!b64) throw new Error('formato inesperado');
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (_) {
      setLabelError('No pudimos cargar la etiqueta. Inténtalo de nuevo.');
    }
    setLabelLoading(false);
  };

  // Línea de tiempo en orden cronológico (antiguo → actual)
  const timeline = buildTimeline(result);
  const currentIdx = result ? timeline.findIndex((ev) => ev.id === result.id_estado) : -1;

  return (
    <div className="py-12 bg-ush-pinkLight min-h-screen">
      <title>Rastrear mi Pedido | Ush By Ushuaia</title>
      <meta name="description" content="Consulta el estado y la guía de tu pedido mayorista USH BY USHUAIA. Seguimiento de envíos a toda Colombia." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ush-navy hover:text-ush-pink mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Inicio</span>
        </Link>

        {/* Header de marca */}
        <div data-editor-section="tr-header" className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-ush-navy text-white flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-[#d88193]">
            <Box size={28} className="text-ush-pink" />
          </div>
          <h1 className="text-3xl font-black uppercase text-ush-navy tracking-tight">
            <span data-field-key="trTitle">{c.trTitle}</span> <span className="text-ush-pink"><span data-field-key="trTitleEm">{c.trTitleEm}</span></span>
          </h1>
          <p data-field-key="trIntro" className="text-sm text-ush-pinkDark font-medium mt-2 max-w-lg mx-auto">
            {c.trIntro}
          </p>
        </div>

        {/* Search Box de marca */}
        <form data-editor-section="tr-form" onSubmit={handleSubmit} className="bg-white p-6 border-t-4 border-[#d88193] shadow-lg">
          <label data-field-key="trLabel" className="block text-xs font-black uppercase tracking-wider text-ush-navy mb-2">
            {c.trLabel} *
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FileText size={16} className="absolute left-3 top-3.5 text-[#d88193]" />
              <input
                type="text"
                required
                value={guia}
                onChange={(e) => setGuia(e.target.value)}
                placeholder={c.trPlaceholder || CARRIERS[0].placeholder}
                className="w-full border border-gray-300 pl-9 pr-3 py-3 text-sm text-neutral-900 focus:outline-none focus:border-[#d88193] focus:ring-1 focus:ring-[#d88193]/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-ush-navy text-white font-bold py-3 px-6 text-xs uppercase tracking-widest hover:bg-[#d88193] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {loading ? 'Consultando...' : c.trButton}
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 flex items-center gap-1">
            <RefreshCw size={10} /> {c.trAutoNote}
          </p>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Resultado — compacto, sin scroll */}
        {result && !loading && (
          <div className="mt-6 bg-white border border-gray-200 shadow-lg overflow-hidden">
            {/* Cabecera navy con estado */}
            <div className="p-6 bg-ush-navy text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                      Estado Actual
                    </p>
                    {refreshing && <RefreshCw size={11} className="text-[#d88193] animate-spin" />}
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">
                    {result.estado_actual}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-[#d88193] px-2.5 py-1 text-white">
                      Guía {result.guia}
                    </span>
                    {result.dias_promesa ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                        Entrega estimada: {result.dias_promesa} días
                      </span>
                    ) : null}
                  </div>
                  {lastUpdated && (
                    <p className="text-[10px] text-white/40 mt-2 flex items-center gap-1">
                      <Clock size={10} /> Última actualización: {lastUpdated.toLocaleTimeString('es-CO')}
                    </p>
                  )}
                </div>
              </div>

              {/* Origen → Destino */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin size={15} className="text-[#d88193]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Origen</p>
                    <p className="font-black text-white mt-0.5">{result.origen}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[#d88193]">
                  <Navigation size={14} />
                  <span className="tracking-[0.3em] font-black text-sm">────</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                    <Truck size={15} className="text-[#d88193]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Destino</p>
                    <p className="font-black text-white mt-0.5">{result.destino}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Línea de tiempo horizontal (stepper) — sin scroll vertical */}
            <div className="p-6 sm:p-8">
              {timeline.length > 0 ? (
                <div className="flex items-start justify-between gap-1 overflow-x-auto pb-1">
                  {timeline.map((ev, idx) => {
                    const st = STATE_COLORS[ev.id];
                    const isPast = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isDone = isPast && idx !== currentIdx;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 min-w-[76px]">
                        <div className="relative w-full flex items-center justify-center">
                          {/* Línea conectora */}
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 h-[3px] w-full ${
                              idx === 0 ? 'left-1/2' : idx === timeline.length - 1 ? 'right-1/2' : ''
                            } ${isPast ? 'bg-[#d88193]' : 'bg-gray-200'}`}
                          />
                          <div
                            className={`relative w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 shadow-sm transition-all ${
                              isCurrent
                                ? 'bg-[#d88193] border-[#d88193] text-white scale-110 shadow-md shadow-[#d88193]/40'
                                : isDone
                                ? 'bg-ush-navy border-ush-navy text-white'
                                : 'bg-white border-gray-300 text-gray-300'
                            }`}
                          >
                            {isDone ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <span
                            className={`inline-block text-[9px] font-black uppercase tracking-wider leading-tight ${
                              isCurrent ? 'text-[#d88193]' : isPast ? 'text-ush-navy' : 'text-neutral-400'
                            }`}
                          >
                            {ev.nombre}
                          </span>
                          <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">
                            {ev.fecha} · {ev.hora}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-neutral-400">
                  <Package size={24} className="mx-auto mb-2 text-neutral-300" />
                  Sin eventos de seguimiento todavía.
                </div>
              )}

              {/* Guía digital */}
              {result.guia_digital && (
                <div className="mt-6 p-3 bg-ush-pinkLight border border-[#d88193]/30 flex items-center gap-3 rounded-none">
                  <Package size={16} className="text-[#d88193] shrink-0" />
                  <p className="text-xs text-ush-navy font-bold">Guía digital disponible.</p>
                  {labelError && <p className="text-[10px] text-red-600 font-semibold">{labelError}</p>}
                  <button
                    type="button"
                    onClick={abrirEtiqueta}
                    disabled={labelLoading}
                    className="text-xs font-black text-[#d88193] hover:text-ush-navy ml-auto uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {labelLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                    {labelLoading ? 'Abriendo...' : 'Ver etiqueta PDF →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ayuda */}
        <div data-editor-section="tr-help" className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="bg-white p-4 border-t-4 border-ush-navy shadow-sm">
            <Package size={20} className="mx-auto text-[#d88193] mb-2" />
            <p className="text-[11px] font-black text-ush-navy uppercase tracking-wide">{c.trHelp1Title}</p>
            <p className="text-[11px] text-neutral-500 mt-1">{c.trHelp1Text}</p>
          </div>
          <div className="bg-white p-4 border-t-4 border-ush-navy shadow-sm">
            <Clock size={20} className="mx-auto text-[#d88193] mb-2" />
            <p className="text-[11px] font-black text-ush-navy uppercase tracking-wide">{c.trHelp2Title}</p>
            <p className="text-[11px] text-neutral-500 mt-1">{c.trHelp2Text}</p>
          </div>
          <div className="bg-white p-4 border-t-4 border-ush-navy shadow-sm">
            <AlertTriangle size={20} className="mx-auto text-[#d88193] mb-2" />
            <p className="text-[11px] font-black text-ush-navy uppercase tracking-wide">{c.trHelp3Title}</p>
            <p className="text-[11px] text-neutral-500 mt-1">{c.trHelp3Text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: ordena eventos cronológicamente usando el orden canónico
function buildTimeline(result: NormalizedTracking | null) {
  if (!result || result.events.length === 0) return [] as { id: number; nombre: string; fecha: string; hora: string }[];
  const byId = new Map(result.events.map((ev) => [ev.id, ev]));
  const ordered: { id: number; nombre: string; fecha: string; hora: string }[] = [];
  // Orden canónico para los estados conocidos
  for (const sid of STATE_ORDER) {
    const ev = byId.get(sid);
    if (ev) { ordered.push(ev); byId.delete(sid); }
  }
  // Estados desconocidos, al final (ya vienen más recientes primero, así que los invertimos)
  const rest = Array.from(byId.values()).reverse();
  ordered.push(...rest);
  return ordered;
}