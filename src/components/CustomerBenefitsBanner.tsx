'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, ClipboardList, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DISMISS_KEY = 'ush_customer_benefits_banner_dismissed';

export function CustomerBenefitsBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (window.location.pathname === '/profile' || window.location.pathname.startsWith('/admin') || window.location.pathname === '/checkout') return;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled || data.session) return;
      try {
        if (sessionStorage.getItem(DISMISS_KEY)) return;
      } catch (_) {}
      window.setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, 900);
    });

    return () => { cancelled = true; };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
    setVisible(false);
  };

  return (
    <aside className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-[#d88193]/30 bg-white/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:bottom-6 sm:flex sm:items-center sm:gap-5 sm:px-5" role="status">
      <button type="button" onClick={dismiss} aria-label="Cerrar beneficios" className="absolute right-2 top-2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800">
        <X size={17} />
      </button>
      <div className="flex min-w-0 flex-1 gap-3 pr-5">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1f4] text-[#d88193] sm:flex">
          <BellRing size={21} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#1b2333]">✨ Vende más con tu cuenta mayorista</p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">Crea tu cuenta gratis y recibe herramientas para vender, organizar y reponer tu negocio con más confianza.</p>
          <div className="mt-2 grid gap-1 text-[10px] font-semibold leading-relaxed text-[#1b2333] sm:grid-cols-3 sm:gap-2">
            <span>✓ Comparte tu catálogo PDF personalizado</span>
            <span>✓ Repite pedidos desde tu historial</span>
            <span>✓ Conoce primero referencias y promociones</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0 sm:shrink-0">
        <Link href={`/profile?mode=register&returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`} onClick={dismiss} className="inline-flex items-center gap-1.5 rounded-lg bg-[#d88193] px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white hover:bg-[#c06579]">
          <ClipboardList size={14} /> Crear mi cuenta gratis
        </Link>
        <button type="button" onClick={dismiss} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600 hover:bg-neutral-50">Continuar sin cuenta</button>
      </div>
    </aside>
  );
}
