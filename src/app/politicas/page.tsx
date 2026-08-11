import React from 'react';
import Link from 'next/link';
import { RefreshCw, ShieldCheck, RotateCcw, CreditCard, Phone, Mail, MapPin, Truck, ArrowLeft, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'Políticas de Cambios, Devoluciones y Envíos | USH BY USHUAIA',
  description: 'Conoce las políticas oficiales de cambios (15 días), garantía (45 días), derecho de retracto (5 días), reversión de pago y política de envíos de USH BY USHUAIA.',
};

const sections = [
  {
    id: 'cambios',
    icon: RefreshCw,
    tag: '15 días calendario',
    title: '1. CAMBIOS',
    titleColor: 'text-[#d88193]', // Soft Rose
    badgeBg: 'bg-[#d88193]/10 text-[#c06579] border-[#d88193]/30',
    content: [
      {
        subtitle: '¿Cuándo aplica?',
        text: 'Aplica cuando el cliente no queda conforme con la prenda por un motivo distinto a la garantía. El cambio debe solicitarse dentro de los 15 días calendario siguientes a la fecha de compra.',
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
    title: '2. GARANTÍA',
    titleColor: 'text-[#1b2333]', // Navy/Dark
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
    title: '3. DERECHO DE RETRACTO',
    titleColor: 'text-[#2e7d32]', // Forest Green
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
          'Sin alterations ni modificaciones; horma original conservada.',
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
    title: '4. REVERSIÓN DEL PAGO',
    titleColor: 'text-[#d97706]', // Warm Amber/Gold
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
    <div className="bg-neutral-50 min-h-screen">

      {/* Header Clean Banner */}
      <section className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-900 font-bold uppercase tracking-wider mb-6 transition-colors">
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
          <span className="block text-[10px] font-bold uppercase tracking-[0.3em] text-[#d88193] mb-2">
            Términos y Condiciones Legales
          </span>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900">
            Políticas de Cambios, Devoluciones y Envíos
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto font-light leading-relaxed">
            En <strong>USH BY USHUAIA</strong> garantizamos tus derechos como consumidor de acuerdo con la Ley 1480 de 2011 y el Decreto 587 de 2016 de la República de Colombia.
          </p>

          {/* Nav Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className="inline-flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 transition-all">
                <ChevronRight size={12} />
                {s.title}
              </a>
            ))}
            <a href="#envios"
              className="inline-flex items-center gap-1 bg-[#d88193]/10 hover:bg-[#d88193]/20 border border-[#d88193]/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c06579] transition-all">
              <ChevronRight size={12} />
              5. POLÍTICA DE ENVÍO
            </a>
          </div>
        </div>
      </section>

      {/* Main Neutral Content Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} id={section.id}
              className="bg-white border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm">

              {/* Title with Custom Color & Badge */}
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
        <div id="envios" className="bg-white border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm">
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
              En <strong>www.ushuaiajeans.com.co</strong>, nuestro compromiso es cumplir con los tiempos de entrega, por lo tanto, si el día que llegue tu pedido no estás presente para recibirlo, la transportadora estará autorizada para dejarlo en el lugar indicado informado por el medio de atención donde se tomó el pedido.
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
              * Contados a partir del momento en que el consumidor reciba el correo electrónico "Confirmación pedido".
            </p>
          </div>
        </div>

        {/* 6. CANALES DE ATENCIÓN */}
        <div className="bg-white border border-gray-200 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-sm">
          <div className="sm:col-span-3 border-b border-gray-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d88193]">Contacto Directo</span>
            <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900 mt-0.5">Canales de Atención</h3>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c06579]">WhatsApp</p>
            <p className="text-sm font-black text-neutral-900">+57 302 202 8477 / 317 435 9968</p>
            <p className="text-[11px] text-neutral-500 font-light pt-1">
              Lunes a jueves: 7:00 a. m. a 4:00 p. m.<br />
              Viernes: 7:00 a. m. a 3:30 p. m.
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c06579]">Correo Electrónico</p>
            <p className="text-xs font-bold text-neutral-900 break-all">comercialmayoristas@ushuaiajeans.com.co</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c06579]">Tienda Virtual</p>
            <p className="text-xs font-bold text-neutral-900">www.ushuaiajeans.com.co</p>
          </div>
        </div>

      </div>
    </div>
  );
}
