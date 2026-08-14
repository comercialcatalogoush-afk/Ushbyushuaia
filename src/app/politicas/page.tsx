import React from 'react';
import Link from 'next/link';
import { RefreshCw, ShieldCheck, RotateCcw, CreditCard, Phone, Mail, MapPin, Truck, ArrowLeft, ChevronRight, Lock, FileText } from 'lucide-react';
import { getWhatsAppNumber, DEFAULT_WHATSAPP_NUMBER } from '@/lib/siteConfig';

export const metadata = {
  title: 'Políticas de Cambios, Garantías, Envíos y Habeas Data | USH BY USHUAIA',
  description: 'Conoce las políticas oficiales de cambios (15 días), garantía (45 días), derecho de retracto, envíos y tratamiento de datos personales (Habeas Data Ley 1581 de 2012) de USH BY USHUAIA.',
};

const sections = [
  {
    id: 'cambios',
    icon: RefreshCw,
    tag: '15 días calendario',
    title: '1. CAMBIOS',
    titleColor: 'text-[#d88193]',
    badgeBg: 'bg-[#d88193]/10 text-[#c06579] border-[#d88193]/30',
    content: [
      {
        subtitle: '¿Cuándo aplica?',
        text: 'Aplica cuando el cliente por un motivo distinto a la garantía. El cambio debe solicitarse dentro de los 15 días calendario siguientes a la fecha de compra.',
      },
      {
        subtitle: 'Requisitos de la prenda:',
        list: [
          'Encontrarse en las mismas condiciones en que fue adquirida y sin haber sido usada.',
          'Contar con todas sus etiquetas, internas y externas.',
          'No haber sido alterada ni modificada por el consumidor.',
          'Sin rastros de uso de químicos o blanqueador, ni desteñido.',
          'Conservar la horma original; estampados, apliques o bordados sin inconsistencias por lavado, planchado o adulteración.',
          'Indicar el número de cédula del comprador.',
        ],
      },
      {
        subtitle: 'Condiciones especiales:',
        list: [
          'Las compras hechas desde fuera de Colombia por el canal virtual no son objeto de cambio.',
          'No se realizan devoluciones de dinero por concepto de cambio de prenda.',
          'Si el producto elegido para el cambio tiene un valor superior, el cliente paga la diferencia mediante el enlace enviado por WhatsApp.',
          'Si el paquete llega abierto, dañado o maltratado, el cliente no debe recibirlo y debe reportarlo de inmediato por WhatsApp.',
        ],
      },
    ],
  },
  {
    id: 'garantia',
    icon: ShieldCheck,
    tag: '45 días calendario',
    title: '2. GARANTÍA',
    titleColor: 'text-[#1b2333]',
    badgeBg: 'bg-neutral-100 text-neutral-800 border-neutral-300',
    content: [
      {
        subtitle: '¿Qué cubre?',
        text: 'Cubre defectos de calidad, idoneidad o seguridad de la prenda, siempre que el consumidor le haya dado un uso adecuado y haya seguido las instrucciones de lavado y cuidado. El plazo de garantía es de 45 días calendario contados desde la entrega del producto.',
      },
      {
        subtitle: 'Procedimiento del reclamo:',
        list: [
          'Se radica por WhatsApp, adjuntando evidencias y datos de contacto y de compra.',
          'USHUAIA responde en un plazo de hasta 15 días hábiles desde la radicación.',
          'Si el defecto es reconocido, USHUAIA decide entre reparar la prenda, reponerla por una nueva de la misma referencia o devolver el valor pagado.',
          'Si la garantía no es aceptada, USHUAIA contacta al cliente dentro de los 15 días hábiles siguientes para indicar el procedimiento de devolución.',
        ],
      },
      {
        subtitle: 'La garantía NO aplica en casos como:',
        list: [
          'Reclamo presentado después de los 45 días calendario de entregado el producto.',
          'Uso de químicos, blanqueador o desodorantes/maquillaje que decoloren la tela.',
          'Desteñido por secado al sol o incumplimiento de instrucciones de lavado.',
          'Alteración de la prenda por el consumidor, desgaste normal o uso indebido.',
          'Irregularidades propias del proceso artesanal de fabricación.',
        ],
      },
    ],
  },
  {
    id: 'retracto',
    icon: RotateCcw,
    tag: '5 días hábiles',
    title: '3. DERECHO DE RETRACTO',
    titleColor: 'text-[#2e7d32]',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    content: [
      {
        subtitle: '¿Cuándo aplica?',
        text: 'Debe ejercerse dentro de los 5 días hábiles siguientes a la entrega del producto o a la celebración del contrato, comunicándose por WhatsApp.',
      },
      {
        subtitle: 'La prenda debe devolverse en las mismas condiciones:',
        list: [
          'Sin uso, sin suciedad y con todas sus etiquetas.',
          'Sin rastros de químicos, blanqueador, desodorantes o maquillaje que decoloren la tela, ni desteñido.',
          'Sin alteraciones ni modificaciones; horma original conservada.',
          'En condiciones aptas para su posterior venta a otro consumidor.',
        ],
      },
      {
        subtitle: 'Costos y plazos:',
        list: [
          'El costo de transporte de la devolución corre por cuenta del consumidor.',
          'Una vez recibida la prenda y verificados los requisitos, USHUAIA devuelve el dinero en un plazo máximo de 30 días calendario.',
        ],
      },
    ],
  },
  {
    id: 'reversion',
    icon: CreditCard,
    tag: '5 + 15 días hábiles',
    title: '4. REVERSIÓN DEL PAGO',
    titleColor: 'text-[#d97706]',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    content: [
      {
        subtitle: '¿Cuándo aplica?',
        text: 'Aplica en casos de fraude, operación no solicitada, producto no recibido dentro de los 30 días calendario siguientes a la compra, producto que no corresponde a lo solicitado o producto entregado defectuoso.',
      },
      {
        subtitle: 'Plazos y procedimiento:',
        list: [
          'El consumidor debe presentar la queja ante USHUAIA dentro de los 5 días hábiles siguientes al hecho o a la fecha en que debió recibir el producto.',
          'Notificar al emisor del medio de pago la petición radicada ante USHUAIA en el mismo plazo.',
          'Una vez radicada ante el emisor, este dispone de 15 días hábiles para hacer efectiva la reversión.',
        ],
      },
    ],
  },
];

export default async function PoliticasPage() {
  const whatsapp = await getWhatsAppNumber();
  const whatsappDisplay = whatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})$/, '+$1 $2 $3 $4 $5');

  return (
    <div className="bg-neutral-50 min-h-screen scroll-smooth">

      {/* Header Clean Banner */}
      <section className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-900 font-bold uppercase tracking-wider mb-4 transition-colors">
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
          <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#d88193] mb-1.5">
            Términos y Políticas Oficiales
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
            Políticas de Cambios, Garantías, Envíos y Habeas Data
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto font-light leading-relaxed">
            En <strong>USH BY USHUAIA</strong> garantizamos tus derechos como consumidor conforme a la Ley 1480 de 2011, Decreto 587 de 2016 y Ley 1581 de 2012 de la República de Colombia.
          </p>
        </div>
      </section>

      {/* ── Sticky Sub-navigation Bar ── */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 whitespace-nowrap transition-colors"
              >
                {s.title}
              </a>
            ))}
            <a
              href="#envios"
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#c06579] whitespace-nowrap transition-colors"
            >
              5. Envíos
            </a>
            <a
              href="#habeas-data"
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 whitespace-nowrap transition-colors"
            >
              6. Habeas Data
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} id={section.id}
              className="bg-white border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-40 scroll-snap-align-start">

              {/* Title Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 text-neutral-700">
                    <Icon size={20} />
                  </div>
                  <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${section.titleColor}`}>
                    {section.title}
                  </h2>
                </div>
                <span className={`inline-self-start sm:inline-self-auto border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${section.badgeBg}`}>
                  {section.tag}
                </span>
              </div>

              {/* Section Details */}
              <div className="space-y-6">
                {section.content.map((block, bIdx) => (
                  <div key={bIdx} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      {block.subtitle}
                    </h3>
                    {block.text && (
                      <p className="text-xs text-neutral-600 leading-relaxed font-light">{block.text}</p>
                    )}
                    {block.list && (
                      <ul className="space-y-2 pt-1">
                        {block.list.map((item, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-2.5 text-xs text-neutral-600 font-light">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0 mt-1.5" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 5. POLÍTICA DE ENVÍO */}
        <div id="envios" className="bg-white border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-40 scroll-snap-align-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-[#d88193]">
                <Truck size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#c06579]">
                5. POLÍTICA DE ENVÍO
              </h2>
            </div>
            <span className="border border-rose-200 bg-rose-50 text-[#c06579] px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              Envíos Nacionales
            </span>
          </div>

          <div className="space-y-4 text-xs text-neutral-600 font-light leading-relaxed">
            <p>
              En <strong>USH BY USHUAIA</strong>, nuestro compromiso es cumplir con los tiempos de entrega, por lo tanto, si el día que llegue tu pedido no estás presente para recibirlo, la transportadora estará autorizada para dejarlo en el lugar indicado informado por el medio de atención donde se tomó el pedido.
            </p>
            <p>
              En Ush By Ushuaia queremos entregar tu pedido en el menor tiempo posible, por eso nuestra promesa de entrega es de:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-neutral-50 border border-neutral-200 p-4 text-center space-y-1">
                <p className="text-2xl font-black text-[#d88193]">5 a 8</p>
                <p className="text-xs font-bold uppercase text-neutral-800">Días Hábiles</p>
                <p className="text-[11px] text-neutral-500">Ciudades principales e intermedias</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-4 text-center space-y-1">
                <p className="text-2xl font-black text-[#d88193]">8 a 15</p>
                <p className="text-xs font-bold uppercase text-neutral-800">Días Hábiles</p>
                <p className="text-[11px] text-neutral-500">Municipios y demás poblaciones</p>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 italic pt-2">
              * Contados a partir del momento en que el consumidor reciba la confirmación de su pedido.
            </p>
          </div>
        </div>

        {/* 6. POLÍTICA DE PRIVACIDAD Y HABEAS DATA (Ley 1581 de 2012) */}
        <div id="habeas-data" className="bg-white border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-40 scroll-snap-align-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-700">
                <Lock size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-indigo-900">
                6. PRIVACIDAD Y TRATAMIENTO DE DATOS (HABEAS DATA)
              </h2>
            </div>
            <span className="border border-indigo-200 bg-indigo-50 text-indigo-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              Ley 1581 de 2012
            </span>
          </div>

          <div className="space-y-4 text-xs text-neutral-600 font-light leading-relaxed">
            <p>
              De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, <strong>USH BY USHUAIA / USHUAIA JEANS</strong> informa que los datos personales suministrados por nuestros clientes en los formularios web, registros de compras y canal de atención comercial son recolectados, almacenados y tratados bajo estrictos parámetros de seguridad y confidencialidad.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Finalidad del Tratamiento de Datos:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs text-neutral-600 font-light">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                  <span>Procesar, confirmar y enviar pedidos solicitados por el cliente a nivel nacional.</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-neutral-600 font-light">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                  <span>Brindar atención comercial directa, soporte en garantías y seguimiento logístico a través de WhatsApp o correo electrónico.</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-neutral-600 font-light">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5" />
                  <span>Enviar promociones, catálogos actualizados y ofertas exclusivas previa autorización explícita del titular.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Derechos del Titular de la Información:</h3>
              <p>
                Como titular de sus datos personales, usted tiene derecho a conocer, actualizar, rectificar o solicitar la supresión de sus datos de nuestras bases de datos en cualquier momento. Para ejercer estos derechos, puede escribir directamente a nuestro correo oficial <strong>comercialmayoristas@ushuauajeans.com.co</strong> indicando el asunto "Habeas Data".
              </p>
            </div>
          </div>
        </div>

        {/* CANALES DE ATENCIÓN */}
        <div className="bg-white border border-gray-200 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-sm">
          <div className="sm:col-span-3 border-b border-gray-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d88193]">Contacto Directo</span>
            <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900 mt-0.5">Canales de Atención</h3>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c06579]">WhatsApp</p>
            <p className="text-sm font-black text-neutral-900">{whatsappDisplay}</p>
            <p className="text-[11px] text-neutral-500 font-light pt-1">
              Lunes a jueves: 7:00 a. m. a 4:00 p. m.<br />
              Viernes: 7:00 a. m. a 3:30 p. m.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c06579]">Correo Electrónico</p>
            <p className="text-xs font-bold text-neutral-900 break-all">comercialmayoristas@ushuauajeans.com.co</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c06579]">Punto de Despacho</p>
            <p className="text-xs font-bold text-neutral-900">Cll. 85 Sur #50-72, Itagüí, Antioquia — Colombia</p>
          </div>
        </div>

      </div>
    </div>
  );
}
