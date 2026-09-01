import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[55vh] flex items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="max-w-md text-center">
        <SearchX size={42} className="mx-auto mb-5 text-[#d88193]" />
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400">Página no encontrada</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-[#1b2333]">Esta referencia no está disponible</h1>
        <p className="mt-3 text-sm text-neutral-600">Puede que el enlace esté vencido o que la prenda ya no esté publicada.</p>
        <Link
          href="/catalogo"
          className="mt-7 inline-flex items-center gap-2 bg-[#1b2333] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#d88193]"
        >
          <ArrowLeft size={15} /> Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
