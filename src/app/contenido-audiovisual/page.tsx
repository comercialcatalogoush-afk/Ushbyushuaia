'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Film, FileText, Loader2, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { CustomerAudiovisualContent } from '@/components/CustomerAudiovisualContent';
import { CustomerLookbookEditor } from '@/components/CustomerLookbookEditor';
import { LookbookConfig } from '@/lib/lookbookPdf';

export default function AudiovisualPage() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [lookbookConfig, setLookbookConfig] = useState<LookbookConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(data.session?.user || null);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user || null);
        setChecking(false);
      }
    });
    return () => { cancelled = true; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) { setLoadingProducts(false); setLoadingConfig(false); return; }
    let cancelled = false;
    const loadData = async () => {
      try {
        const [{ data }, catalogResponse] = await Promise.all([
          supabase.auth.getSession(),
          fetch('/api/catalog', { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        const payload = await catalogResponse.json();
        setProducts(Array.isArray(payload) ? payload : (payload.products || []));
        const token = data.session?.access_token;
        if (token) {
          const configResponse = await fetch('/api/lookbook-config', { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
          if (configResponse.ok) setLookbookConfig(await configResponse.json());
        }
      } catch (_) {
        if (!cancelled) { setProducts([]); setLookbookConfig(null); }
      } finally {
        if (!cancelled) { setLoadingProducts(false); setLoadingConfig(false); }
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [user]);

  if (checking || (user && (loadingProducts || loadingConfig))) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[#d88193]" /></div>;
  }

  if (!user) {
    return <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-4 py-16"><section className="w-full border border-neutral-200 bg-white p-8 text-center shadow-sm"><Film size={38} className="mx-auto text-[#d88193]" /><p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">Beneficio para clientes registrados</p><h1 className="mt-2 text-2xl font-black uppercase text-[#1b2333]">Contenido audiovisual</h1><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-600">Inicia sesión o crea tu cuenta gratis para acceder a las fotos y videos de tus referencias y compartirlos en tus redes sociales.</p><Link href="/profile?mode=login&returnTo=%2Fcontenido-audiovisual" className="mx-auto mt-6 inline-flex items-center gap-2 rounded-lg bg-[#d88193] px-5 py-3 text-xs font-black uppercase tracking-wide text-white hover:bg-[#c06579]"><LogIn size={16} /> Iniciar sesión</Link></section></div>;
  }

  return <div className="bg-[#f8f8f8] px-3 py-8 sm:px-5 sm:py-10"><div className="mx-auto max-w-7xl"><div className="mb-5 flex items-center justify-between gap-3"><Link href="/profile" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-neutral-500 hover:text-[#d88193]"><ArrowLeft size={15} /> Volver a mi cuenta</Link><span className="hidden text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:block">USH BY USHUAIA · Biblioteca para compartir</span></div><section className="mb-6 border border-[#1b2333] bg-[#1b2333] px-5 py-7 text-white shadow-sm sm:px-8 sm:py-9"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f3b3c0]">Tu espacio de contenido</p><h1 className="mt-2 text-2xl font-black uppercase tracking-tight sm:text-4xl">Contenido para vender</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">Personaliza tu catálogo PDF y descarga fotos y videos de las referencias que quieres compartir con tus clientes y en tus redes sociales.</p><div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-white/80"><span className="border border-white/15 bg-white/5 px-3 py-2">Catálogo PDF a tu medida</span><span className="border border-white/15 bg-white/5 px-3 py-2">Fotos y videos listos</span><span className="border border-white/15 bg-white/5 px-3 py-2">Sin guardar archivos en la plataforma</span></div></section><section className="mb-6"><div className="mb-3 flex items-center gap-2"><FileText size={18} className="text-[#d88193]" /><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">1 · Catálogo comercial</p><h2 className="text-lg font-black uppercase text-[#1b2333]">Personaliza tu catálogo PDF</h2></div></div><CustomerLookbookEditor products={products} config={lookbookConfig} onClose={() => window.history.back()} embedded /></section><section><div className="mb-3 flex items-center gap-2"><Film size={18} className="text-[#d88193]" /><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">2 · Material para redes</p><h2 className="text-lg font-black uppercase text-[#1b2333]">Descarga fotos y videos</h2></div></div><CustomerAudiovisualContent products={products} fullPage /></section></div></div>;
}
