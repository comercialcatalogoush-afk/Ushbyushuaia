import React from 'react';
import Link from 'next/link';
import { RefreshCw, ShieldCheck, RotateCcw, CreditCard, Phone, Mail, Clock, MapPin, Truck, ArrowLeft, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Políticas de Cambios, Devoluciones y Envíos | USH BY USHUAIA',
  description: 'Conoce las políticas oficiales de cambios (15 días), garantía (45 días), derecho de retracto (5 días), reversión de pago y política de envíos de USH BY USHUAIA.',
};

const sections = [
  {
    id: 'cambios',
    icon: RefreshCw,
    tag: '15 días calendario',
    title: 'Cambios de Prenda',
    color: 'from-[#d88193] to-[#c06579]',
    lightColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    content: [
      {
        subtitle: '¿Cuándo aplica?',
        text: 'Cuando el cliente no queda conforme con la prenda por un motivo distinto a la garantía. El cambio debe solicitarse dentro de los 15 días calendario siguientes a la fecha de compra.',
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
          'Si el producto elegido para el cambio tiene un valor superior, el cliente paga la diferencia mediante el enlace enviado por WhatsApp; si el valor es inferior, USHUAIA reintegra la diferencia en un plazo máximo de 30 días.',
          'Si el paquete llega abierto, dañado o maltratado, el cliente no debe recibirlo y debe reportarlo de inmediato por WhatsApp.',
        ],
      },
    ],
  },
  {
    id: 'garantia',
    icon: ShieldCheck,
    tag: '45 días calendario',
    title: 'Garantía de Calidad',
    color: 'from-[#1b2333] to-[#2b3445]',
    lightColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    content: [
      {
        subtitle: '¿Qué cubre?',
        text: 'Cubre defectos de calidad, idoneidad o seguridad de la prenda, siempre que el consumidor le haya dado un uso adecuado y haya seguido las instrucciones de lavado y cuidado. El plazo es de 45 días calendario contados desde la entrega del producto.',
      },
      {
        subtitle: 'Procedimiento del reclamo:',
        list: [
          'Se radica por WhatsApp, adjuntando evidencias y datos de contacto y de compra.',
          'USHUAIA responde en un plazo de hasta 15 días hábiles desde la radicación.',
          'Si el defecto es reconocido, USHUAIA decide entre reparar la prenda, reponerla por una nueva de la misma referencia o devolver el valor pagado.',
          'Si la garantía no es aceptada, USHUAIA contacta al cliente dentro de los 15 días hábiles siguientes para indicar el procedimiento de devolución, con flete pagado contra entrega por el consumidor.',
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
          'Fuerza mayor, caso fortuito o hecho de un tercero.',
        ],
      },
    ],
  },
  {
    id: 'retracto',
    icon: RotateCcw,
    tag: '5 días hábiles',
    title: 'Derecho de Retracto',
    color: 'from-emerald-600 to-emerald-700',
    lightColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
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
          'Estampados, apliques o bordados sin inconsistencias por lavado o planchado.',
          'En condiciones aptas para su posterior venta a otro consumidor.',
        ],
      },
      {
        subtitle: 'Costos y plazos:',
        list: [
          'El costo de transporte de la devolución corre por cuenta del consumidor.',
          'Si la devolución se hace contra entrega, USHUAIA no recibe la prenda por esa modalidad; la trazabilidad y el cuidado de la prenda son responsabilidad del consumidor frente a la transportadora.',
          'Una vez recibida la prenda y verificados los requisitos, USHUAIA devuelve el dinero en un plazo máximo de 30 días calendario, contados desde la recepción de la prenda y de los datos bancarios del consumidor.',
        ],
      },
    ],
  },
  {
    id: 'reversion',
    icon: CreditCard,
    tag: '5 + 15 días hábiles',
    title: 'Reversión del Pago',
    color: 'from-amber-600 to-amber-700',
    lightColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    content: [
      {
        subtitle: '¿Cuándo aplica?',
        text: 'Aplica en casos de fraude, operación no solicitada, producto no recibido dentro de los 30 días calendario siguientes a la compra, producto que no corresponde a lo solicitado o producto entregado defectuoso.',
      },
      {
        subtitle: 'Plazos y procedimiento:',
        list: [
          'El consumidor debe presentar la queja ante USHUAIA dentro de los 5 días hábiles siguientes al hecho o a la fecha en que debió recibir el producto.',
          'Dentro del mismo plazo de 5 días hábiles, debe notificar al emisor del medio de pago la petición radicada ante USHUAIA, indicando la causal.',
          'La queja se radica mediante el formulario "Cambios y devoluciones fáciles" o canal de WhatsApp e incluye: razones de la solicitud, causal aplicable (Decreto 587 de 2016), valor solicitado y datos de la cuenta o tarjeta utilizada.',
          'Una vez radicada ante el emisor, este dispone de 15 días hábiles para hacer efectiva la reversión.',
        ],
      },
    ],
  },
];

export default function PoliticasPage() {
  return (
    <div className="bg-white min-h-screen">

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-[#1b2333] via-[#2b3445] to-[#d88193] text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider mb-8">
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
          <span className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white/80 mb-4">
            Información Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Políticas de Cambios,<br />
            <span className="text-[#f5b8c4]">Devoluciones & Envíos</span>
          </h1>
          <p className="mt-4 text-sm text-white/70 max-w-2xl mx-auto leading-relaxed font-light">
            En USH BY USHUAIA cumplimos con todas las normas de protección al consumidor establecidas por la Ley 1480 de 2011 y el Decreto 587 de 2016 de la República de Colombia.
          </p>

          {/* Quick Nav Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white transition-all">
                <ChevronRight size={12} />
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Policy Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={section.id} id={section.id}
              className={`rounded-none border ${section.borderColor} overflow-hidden shadow-sm`}>

              {/* Section Header */}
              <div className={`bg-gradient-to-r ${section.color} text-white p-6 flex items-center gap-4`}>
                <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">
                    Política {idx + 1}
                  </span>
                  <h2 className="text-xl font-black uppercase tracking-tight">{section.title}</h2>
                  <span className="inline-block mt-0.5 bg-white/20 border border-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest">
                    Plazo: {section.tag}
                  </span>
                </div>
              </div>

              {/* Section Content */}
              <div className={`${section.lightColor} p-8 space-y-6`}>
                {section.content.map((block, bIdx) => (
                  <div key={bIdx}>
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800 mb-3">
                      {block.subtitle}
                    </h3>
                    {block.text && (
                      <p className="text-sm text-neutral-700 leading-relaxed font-light">{block.text}</p>
                    )}
                    {block.list && (
                      <ul className="space-y-2">
                        {block.list.map((item, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-3 text-sm text-neutral-700 font-light">
                            <span className="w-5 h-5 rounded-full bg-[#d88193]/20 text-[#c06579] flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black">
                              {iIdx + 1}
                            </span>
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

        {/* Shipping Policy */}
        <div id="envios" className="border border-[#d88193]/30 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-[#d88193] to-[#c06579] text-white p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70">Política 5</span>
              <h2 className="text-xl font-black uppercase tracking-tight">Política de Envíos</h2>
            </div>
          </div>
          <div className="bg-rose-50 p-8 space-y-6">
            <p className="text-sm text-neutral-700 leading-relaxed font-light">
              En <strong>www.ushuaiajeans.com.co</strong>, nuestro compromiso es cumplir con los tiempos de entrega. Si el día que llegue tu pedido no estás presente para recibirlo, la transportadora estará autorizada para dejarlo en el lugar indicado informado por el medio de atención donde se tomó el pedido.
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed font-light">
              En Ush By Ushuaia queremos entregar tu pedido en el menor tiempo posible, por eso nuestra promesa de entrega es:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-rose-200 p-5 text-center">
                <p className="text-2xl font-black text-[#d88193]">5 – 8</p>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-800 mt-1">Días Hábiles</p>
                <p className="text-[11px] text-neutral-500 mt-1">Ciudades principales e intermedias</p>
              </div>
              <div className="bg-white border border-rose-200 p-5 text-center">
                <p className="text-2xl font-black text-[#d88193]">8 – 15</p>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-800 mt-1">Días Hábiles</p>
                <p className="text-[11px] text-neutral-500 mt-1">Municipios y poblaciones pequeñas</p>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 italic font-light border-t border-rose-200 pt-4">
              * Contados a partir del momento en que el consumidor reciba el correo electrónico <strong>"Confirmación pedido"</strong>.
            </p>
          </div>
        </div>

        {/* Contact Channels */}
        <div className="bg-[#1b2333] text-white p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d88193]">Canales de Atención</span>
            <h3 className="text-xl font-black uppercase mt-1">¿Necesitas Ayuda?</h3>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-[#d88193] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">WhatsApp</p>
              <p className="text-sm font-bold">317 435 9968</p>
              <p className="text-[11px] text-white/50 mt-1">Lun – Jue: 7:00 a.m. – 4:00 p.m.<br />Vie: 7:00 a.m. – 3:30 p.m.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-[#d88193] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Correo</p>
              <p className="text-sm font-bold break-all">comercialmayoristas@ushuaiajeans.com.co</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-[#d88193] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Tienda Virtual</p>
              <p className="text-sm font-bold">www.ushuaiajeans.com.co</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
