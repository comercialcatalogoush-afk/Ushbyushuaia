'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, ClipboardList, X, Calculator, FileText, Truck, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Clave actualizada para que el usuario pueda previsualizarlo de inmediato
const DISMISS_KEY = 'ush_benefits_banner_v7';

export function CustomerBenefitsBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // No mostrar en pantallas internas de administración o checkout
    const excluded = ['/admin', '/checkout', '/profile'];
    if (excluded.some((p) => window.location.pathname.startsWith(p))) return;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled || data.session) return;
      try {
        if (sessionStorage.getItem(DISMISS_KEY)) return;
      } catch (_) {}
      // Aparece suavemente a los 400ms
      window.setTimeout(() => {
        if (!cancelled) {
          setVisible(true);
          try {
            window.dispatchEvent(new CustomEvent('ush:banner-state', { detail: { open: true } }));
          } catch (_) {}
        }
      }, 400);
    });

    return () => {
      cancelled = true;
      try {
        window.dispatchEvent(new CustomEvent('ush:banner-state', { detail: { open: false } }));
      } catch (_) {}
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent('ush:banner-state', { detail: { open: false } }));
    } catch (_) {}
    setVisible(false);
  };

  return (
    <>
      <style>{`
        @keyframes float-banner-in {
          0% { opacity: 0; transform: translate(-50%, 20px) scale(0.97); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .banner-float-anim {
          animation: float-banner-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      <aside
        role="status"
        className="
          banner-float-anim
          fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50
          w-[calc(100%-1rem)] max-w-4xl
          rounded-2xl border border-rose-200/90
          bg-white/98 backdrop-blur-md
          p-3.5 sm:p-6 shadow-[0_16px_50px_rgba(216,129,147,0.25)]
        "
      >
        {/* Botón Cerrar (X) */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="absolute right-3.5 top-3.5 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pr-6 lg:pr-0">
          
          {/* Lado izquierdo: Campana + Textos + Checks */}
          <div className="flex items-start gap-4 min-w-0">
            {/* Campana rosa con brillo */}
            <div className="relative hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-[#d88193] shadow-xs">
              <BellRing size={22} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d88193] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d88193]"></span>
              </span>
            </div>

            <div className="min-w-0 space-y-2">
              {/* Título */}
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-[#d88193] shrink-0" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-neutral-900">
                  Vende más con tu cuenta mayorista
                </h3>
              </div>

              {/* Subtítulo */}
              <p className="text-xs text-neutral-600 font-light leading-relaxed max-w-2xl">
                Crea tu cuenta gratis y recibe herramientas para vender, cotizar y reponer tu negocio con más confianza:
              </p>

              {/* Lista de beneficios organizada en fila responsiva */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-bold text-neutral-700">
                <div className="flex items-center gap-1.5 text-neutral-800">
                  <span className="text-[#d88193] text-sm">✓</span>
                  <span>Calculadora B2B de rentabilidad</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-800">
                  <span className="text-[#d88193] text-sm">✓</span>
                  <span>Fotos y videos para tus redes</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-800">
                  <span className="text-[#d88193] text-sm">✓</span>
                  <span>Precios directos y flete gratis 12+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lado derecho: Botones de acción sin romper texto */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <Link
              href={`/profile?mode=register&returnTo=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.pathname : '/'
              )}`}
              onClick={dismiss}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d88193] hover:bg-[#c06579] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <ClipboardList size={16} />
              <span>Crear mi cuenta gratis</span>
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 hover:bg-neutral-50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-700 transition-colors whitespace-nowrap"
            >
              Continuar sin cuenta
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
