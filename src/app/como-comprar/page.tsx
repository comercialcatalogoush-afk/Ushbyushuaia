import React from 'react';
import Link from 'next/link';
import { Benefits } from '@/components/Benefits';
import { getPageContentServer, sectionStyleFromContent } from '@/lib/siteContent';
import {
  CheckCircle2, HelpCircle, ArrowRight, ShieldCheck, Layers, Truck,
  Sparkles, Calculator, Send, Mail, MapPin, Clock, MessageSquare
} from 'lucide-react';

export const revalidate = 86400;

export async function generateMetadata() {
  const c = await getPageContentServer('como-comprar');
  return {
    title: c.seoTitle?.trim() || 'Beneficios Mayoristas & Calculadora | USH BY USHUAIA',
    description: c.seoDescription?.trim() || 'Conoce los beneficios para comerciantes y distribuidores. Calcula tu inversión y margen con la Calculadora Mayorista integrada.',
  };
}

export default async function ComoComprarPage() {
  const c = await getPageContentServer('como-comprar');

  const headerStyle = sectionStyleFromContent('cc-header', c);
  const processStyle = sectionStyleFromContent('cc-process', c);
  const contactStyle = sectionStyleFromContent('cc-contacto', c);

  const steps = [
    {
      num: '01',
      title: c.ccStep1Title,
      desc: c.ccStep1Text
    },
    {
      num: '02',
      title: c.ccStep2Title,
      desc: c.ccStep2Text
    },
    {
      num: '03',
      title: c.ccStep3Title,
      desc: c.ccStep3Text
    },
    {
      num: '04',
      title: c.ccStep4Title,
      desc: c.ccStep4Text
    }
  ];

  return (
    <div className="py-12 bg-white space-y-16">
      {/* Header Banner */}
      <div data-editor-section="cc-header" style={headerStyle} className="bg-neutral-50 border-b border-gray-200 text-neutral-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span data-field-key="ccEyebrow" className="text-xs font-bold uppercase tracking-[0.25em] text-ush-pink">
            {c.ccEyebrow}
          </span>
          <h1 data-field-key="ccTitle" className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
            {c.ccTitle}
          </h1>
          <p data-field-key="ccIntro" className="text-sm text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
            {c.ccIntro}
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/calculadora-ganancias"
              className="inline-flex items-center gap-2 bg-[#d88193] hover:bg-[#c06579] text-white font-bold px-6 py-3 text-xs uppercase tracking-widest transition-all shadow-md"
            >
              <Calculator size={15} />
              <span>Ir a la Calculadora Mayorista</span>
            </Link>
            <a
              href="#contacto-pie"
              className="inline-flex items-center gap-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold px-6 py-3 text-xs uppercase tracking-widest transition-all"
            >
              <MessageSquare size={15} />
              <span>Canales de Contacto</span>
            </a>
          </div>
        </div>
      </div>

      {/* Benefits grid */}
      <Benefits />

      {/* Step by Step Process */}
      <div data-editor-section="cc-process" style={processStyle} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 data-field-key="ccProcessTitle" className="text-2xl font-bold uppercase tracking-tight text-neutral-900">
            {c.ccProcessTitle}
          </h2>
          <p data-field-key="ccProcessSub" className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
            {c.ccProcessSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-6 border border-gray-200 shadow-sm relative">
              <span className="text-4xl font-black text-ush-pink/30 absolute top-4 right-4">
                {step.num}
              </span>
              <h3 data-field-key={`ccStep${idx + 1}Title`} className="text-base font-bold text-neutral-900 mb-2 pr-8 uppercase">
                {step.title}
              </h3>
              <p data-field-key={`ccStep${idx + 1}Text`} className="text-xs text-neutral-600 font-light leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={c.ccCtaLink}
            className="inline-flex items-center gap-2 bg-[#1b2333] hover:bg-ush-pink text-white font-bold px-8 py-4 text-xs uppercase tracking-widest transition-colors shadow-md"
          >
            <span data-field-key="ccCtaText">{c.ccCtaText}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Aliados Comerciales B2B — Diferenciales de Fábrica Directa */}
      <div data-editor-section="cc-b2b" className="bg-neutral-50 border-t border-b border-gray-200 text-neutral-900 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span data-field-key="b2bEyebrow" className="text-xs font-black uppercase tracking-[0.25em] text-[#d88193]">
              {c.b2bEyebrow || 'FÁBRICA DIRECTA ITAGÜÍ · DISTRIBUCIÓN NACIONAL'}
            </span>
            <h2 data-field-key="b2bTitle" className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
              {c.b2bTitle || 'Programa de Aliados Comerciales B2B'}
            </h2>
            <p data-field-key="b2bSubtitle" className="text-sm text-neutral-600 font-light leading-relaxed">
              {c.b2bSubtitle || 'Abastece tu boutique o tienda multimarca con denim 100% colombiano de alta rotación, sin las rigideces del modelo tradicional.'}
            </p>
          </div>

          {/* 4 Pilares de Fábrica */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 bg-rose-50 text-[#d88193] border border-rose-100 flex items-center justify-center rounded">
                <Layers size={20} />
              </div>
              <h3 data-field-key="b2bDiff1Title" className="text-sm font-bold uppercase text-neutral-900">
                {c.b2bDiff1Title || 'Curvas y Tallas Abiertas'}
              </h3>
              <p data-field-key="b2bDiff1Desc" className="text-xs text-neutral-600 font-light leading-relaxed">
                {c.b2bDiff1Desc || 'Elige solo las tallas y siluetas que rotan en tu punto de venta. Cero inventario muerto obligado.'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center rounded">
                <Truck size={20} />
              </div>
              <h3 data-field-key="b2bDiff2Title" className="text-sm font-bold uppercase text-neutral-900">
                {c.b2bDiff2Title || 'Surtido Libre desde 12 Unidades'}
              </h3>
              <p data-field-key="b2bDiff2Desc" className="text-xs text-neutral-600 font-light leading-relaxed">
                {c.b2bDiff2Desc || 'Combina referencias, siluetas y colores en un solo pedido con precio mayorista de fábrica y flete gratis.'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 bg-rose-50 text-[#d88193] border border-rose-100 flex items-center justify-center rounded">
                <Sparkles size={20} />
              </div>
              <h3 data-field-key="b2bDiff3Title" className="text-sm font-bold uppercase text-neutral-900">
                {c.b2bDiff3Title || 'Material Digital de Reventa'}
              </h3>
              <p data-field-key="b2bDiff3Desc" className="text-xs text-neutral-600 font-light leading-relaxed">
                {c.b2bDiff3Desc || 'Acceso a fotos de modelos y lookbook profesional de alta resolución para promocionar en tus redes antes de recibir el pedido.'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center rounded">
                <ShieldCheck size={20} />
              </div>
              <h3 data-field-key="b2bDiff4Title" className="text-sm font-bold uppercase text-neutral-900">
                {c.b2bDiff4Title || 'Garantía Directa de Fábrica'}
              </h3>
              <p data-field-key="b2bDiff4Desc" className="text-xs text-neutral-600 font-light leading-relaxed">
                {c.b2bDiff4Desc || '45 días de garantía en costuras y mezclilla rígida premium confeccionada en Itagüí, Antioquia.'}
              </p>
            </div>
          </div>

          {/* CTA hacia la Calculadora y WhatsApp */}
          <div className="pt-4 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/calculadora-ganancias"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#d88193] hover:bg-[#c06579] text-white font-bold px-8 py-4 text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              <Calculator size={16} />
              <span data-field-key="b2bCalcCtaText">{c.b2bCalcCtaText || 'Proyectar Ganancias en Calculadora'}</span>
            </Link>

            <a
              href="https://wa.me/573011393902?text=Hola%20USH%20BY%20USHUAIA,%20quisiera%20recibir%20asesoria%20comercial%20B2B%20para%20mi%20tienda"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold px-8 py-4 text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              <Send size={16} />
              <span>Contactar Asesor B2B en WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Invitación a la Calculadora Mayorista en Mi Cuenta */}
      <div className="bg-white border-t border-b border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-rose-50 via-white to-rose-50 border border-rose-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#d88193]/15 text-[#d88193] flex items-center justify-center shrink-0">
            <Calculator size={32} />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[.25em] text-[#d88193]">
              Herramienta Exclusiva para Aliados
            </span>
            <h3 className="text-lg sm:text-xl font-black uppercase text-neutral-900">
              Calculadora de Inversión y Rentabilidad B2B
            </h3>
            <p className="text-xs text-neutral-600 font-light leading-relaxed">
              Disponible dentro de tu cuenta para simular surtidos en tiempo real, proyectar margen de vitrina y flete gratis a todo el país.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/calculadora-ganancias"
              className="inline-flex items-center gap-2 bg-[#d88193] hover:bg-[#c06579] text-white font-bold px-6 py-3.5 rounded-full text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              <span>Probar Calculadora</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Contacto al Pie de la Página (Directo en Beneficios) */}
      <div
        id="contacto-pie"
        data-editor-section="cc-contacto"
        style={contactStyle}
        className="bg-neutral-50 border-t border-gray-200 py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span
              data-field-key="ccContactEyebrow"
              className="text-xs font-black uppercase tracking-[0.25em] text-[#d88193]"
            >
              {c.ccContactEyebrow || 'ATENCIÓN COMERCIAL DIRECTA'}
            </span>
            <h2
              data-field-key="ccContactTitle"
              className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900"
            >
              {c.ccContactTitle || '¿Tienes dudas sobre tu pedido mayorista?'}
            </h2>
            <p
              data-field-key="ccContactIntro"
              className="text-sm text-neutral-600 font-light leading-relaxed"
            >
              {c.ccContactIntro ||
                'Nuestro equipo de asesores en Itagüí está listo para resolver tus preguntas sobre curvas, stock inmediato y despachos nacionales.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* WhatsApp */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 flex items-center justify-center rounded">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">WhatsApp Comercial</h3>
              <p data-field-key="ccContactPhone" className="text-sm font-black text-neutral-900">
                {c.ccContactPhone || '+57 301 139 3902'}
              </p>
              <a
                href="https://wa.me/573011393902?text=Hola%20USH%20BY%20USHUAIA,%20estoy%20viendo%20la%20pagina%20de%20beneficios%20y%20quisiera%20asesoria%20mayorista"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-700 hover:underline pt-1"
              >
                <span>Chatear ahora</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Horario */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-[#d88193]/20 text-[#d88193] flex items-center justify-center rounded">
                <Clock size={20} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Horario de Atención</h3>
              <p data-field-key="ccContactHours" className="text-xs text-neutral-600 font-medium">
                {c.ccContactHours || 'Lunes a Viernes: 8:00 AM – 5:30 PM'}
              </p>
              <p className="text-[11px] text-neutral-400 font-light">Sábados, domingos y festivos cerrado.</p>
            </div>

            {/* Dirección / Planta */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-neutral-100 text-neutral-700 flex items-center justify-center rounded">
                <MapPin size={20} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Punto de Despacho</h3>
              <p data-field-key="ccContactAddress" className="text-xs text-neutral-600 font-medium leading-relaxed">
                {c.ccContactAddress || 'Cll. 85 Sur #50-72, Itagüí, Antioquia — Colombia'}
              </p>
            </div>

            {/* Correo */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 flex items-center justify-center rounded">
                <Mail size={20} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Correo Electrónico</h3>
              <a
                href={`mailto:${c.ccContactEmail || 'comercialmayoristas@ushuaiajeans.com.co'}`}
                data-field-key="ccContactEmail"
                className="text-xs text-neutral-600 font-medium break-all hover:underline block"
              >
                {c.ccContactEmail || 'comercialmayoristas@ushuaiajeans.com.co'}
              </a>
            </div>
          </div>

          <div className="text-center pt-2">
            <a
              href="https://wa.me/573011393902?text=Hola%20USH%20BY%20USHUAIA,%20estoy%20viendo%20la%20pagina%20de%20beneficios%20y%20quisiera%20asesoria%20mayorista"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold px-8 py-4 text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              <Send size={16} />
              <span data-field-key="ccContactWaButton">{c.ccContactWaButton || 'Hablar con Asesor por WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
