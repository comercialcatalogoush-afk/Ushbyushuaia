'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck, Sparkles, CheckCircle2, ArrowRight, RotateCcw,
  MessageCircle, Grid, SlidersHorizontal,
  ExternalLink, TrendingUp, Coins, Flame, Zap, ShoppingBag,
  ChevronLeft, ChevronRight, Ruler, AlertCircle
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getWhatsAppNumber, DEFAULT_WHATSAPP_NUMBER } from '@/lib/siteConfig';

// ── 12 REFERENCIAS OFICIALES DEL PACK MAYORISTA CON DATOS DE REBAJAS ──
export interface PackGarment {
  id: number;
  ref: string;
  title: string;
  category: string;
  desc: string;
  wholesalePrice: number;
  regularPrice: number;
  image: string;
  fallbackImage: string;
  availableSizes: string[];
  allSizes: string[];
}

export const INITIAL_PACK: PackGarment[] = [
  {
    id: 1,
    ref: '552605',
    title: 'Jean Skinny Tiro Medio Denim Stretch Gris',
    category: 'Skinny Fit',
    desc: 'Denim stretch de alta recuperación, ajuste anatómico y lavado gris humo con efecto estilizador.',
    wholesalePrice: 89900,
    regularPrice: 129900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Jean_colombiano_skinny_tiro_medio_en_denim_stretch_Gris_oscuro_100_colombiano_1.jpg?v=1770829274',
    fallbackImage: 'https://lh3.googleusercontent.com/d/1bMHlLBtScerJBd_3dXxn09ajXXRAotYW',
    availableSizes: ['6', '8', '12', '14'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 2,
    ref: '552429',
    title: 'Jean Baggy Bota Tubo Blanco Índigo',
    category: 'Baggy Fit',
    desc: 'Jean rígido de corte relajado y bota tubo en tono blanco estival, silueta juvenil de alta tendencia.',
    wholesalePrice: 69900,
    regularPrice: 119900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Jean_colombiano_r_gido_baggy_bota_tubo_tiro_alto_en_ndigo_blanco_100_colombiano_1.jpg?v=1770839459',
    fallbackImage: '',
    availableSizes: ['8'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 3,
    ref: '552699',
    title: 'Jean Straight Rígido Negro 100% Algodón',
    category: 'Straight Boot',
    desc: 'Corte recto atemporal tiro medio en negro profundo, un fondo de armario imprescindible de rápida venta.',
    wholesalePrice: 71900,
    regularPrice: 119900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Jean_straight_r_gido_tiro_medio_negro_1.jpg?v=1770743827',
    fallbackImage: 'https://lh3.googleusercontent.com/d/1UpJolDNGkMxaev41cUtHy_0WcqIqxbWi',
    availableSizes: ['6', '10', '12', '14', '16'],
    allSizes: ['6', '8', '10', '12', '14', '16'],
  },
  {
    id: 4,
    ref: '552736',
    title: 'Jean Barrel Rígido Tiro Medio Ivory',
    category: 'Barrel Fit',
    desc: 'Silueta barrel curva en tendencia con caída estructurada y tono crema marfil refinado.',
    wholesalePrice: 90930,
    regularPrice: 129900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Jean_barrel_r_gido_tiro_medio_en_denim_ivory_1.jpg?v=1770737466',
    fallbackImage: '',
    availableSizes: ['12'],
    allSizes: ['6', '8', '10', '12'],
  },
  {
    id: 5,
    ref: '552758',
    title: 'Jean Wide Leg Tiro Medio Celeste',
    category: 'Wide Leg',
    desc: 'Bota ancha estilizada que alarga visualmente las piernas en denim suave con desgaste sutil.',
    wholesalePrice: 89900,
    regularPrice: 119900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Ushuaia_Sep172263_b2fc3090-9e6b-4676-8c70-7c2f96ccd54c.jpg?v=1785162587',
    fallbackImage: 'https://lh3.googleusercontent.com/d/1FIaCUKj3HFaRad-ijNNMPUBEophL08cr',
    availableSizes: ['6', '10', '12', '14'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 6,
    ref: '552771',
    title: 'Jean Vaquero Flare Tiro Medio Licrado',
    category: 'Bota Flare',
    desc: 'Bota campana vaquera con elasticidad envolvente y azul medio clásico para siluetas curvilíneas.',
    wholesalePrice: 71940,
    regularPrice: 119900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Ushuaia_Nov_178135.jpg?v=1769100541',
    fallbackImage: '',
    availableSizes: ['8', '14'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 7,
    ref: '556214',
    title: 'Short Corto Denim Clásico',
    category: 'Shorts',
    desc: 'Short veraniego de tiro medio con dobladillo y detalles desgastados de rápida rotación.',
    wholesalePrice: 43140,
    regularPrice: 71900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Ushuaia_Abril_79262.jpg?v=1713536525',
    fallbackImage: '',
    availableSizes: ['8', '10'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 8,
    ref: '556231',
    title: 'Short Largo Denim Bermuda',
    category: 'Shorts',
    desc: 'Bermuda cómoda en tejido fresco y resistente, un básico accesible de alta demanda.',
    wholesalePrice: 39900,
    regularPrice: 69900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Ushuaia_Nov_111927.jpg?v=1732134704',
    fallbackImage: '',
    availableSizes: ['6'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 9,
    ref: '556295',
    title: 'Short Dama Denim Prémium Pretina Asimétrica',
    category: 'Shorts',
    desc: 'Short femenino con lavado prémium y pretina asimétrica, curva completa de tallas disponible.',
    wholesalePrice: 79900,
    regularPrice: 119900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/TELA_CON_DESTELLOS.png?v=1788458939',
    fallbackImage: '',
    availableSizes: ['6', '8', '10', '12', '14'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 10,
    ref: '558068',
    title: 'Falda Corta Colombiana Denim Negro',
    category: 'Faldas',
    desc: 'Falda corta en denim rígido negro intenso con calce perfecto para cualquier ocasión.',
    wholesalePrice: 67410,
    regularPrice: 109900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Falda_corta_colombiana_en_denim_r_gido_Negra_100_algod_n_1.jpg?v=1770826453',
    fallbackImage: '',
    availableSizes: ['6', '8', '10', '12', '14'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 11,
    ref: '558069',
    title: 'Falda Dama Rígida Azul Claro 100% Algodón',
    category: 'Faldas',
    desc: 'Falda de corte recto con abertura frontal en tono azul cielo, máxima frescura juvenil.',
    wholesalePrice: 49538,
    regularPrice: 89900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/Falda_dama_r_gida_100_algod_n_Azul_claro.jpg?v=1773764569',
    fallbackImage: '',
    availableSizes: ['8'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
  {
    id: 12,
    ref: '558070',
    title: 'Falda Dama Licrada Azul Oscuro',
    category: 'Faldas',
    desc: 'Falda en denim licrado con compresión suave que esculpe la silueta con total confort.',
    wholesalePrice: 49538,
    regularPrice: 89900,
    image: 'https://cdn.shopify.com/s/files/1/0402/6508/9180/files/FMR3060.jpg?v=1777318309',
    fallbackImage: 'https://lh3.googleusercontent.com/d/1plUrb6B6_NZhY6mjLqTbtOhujsRUkSKT',
    availableSizes: ['6', '12', '14'],
    allSizes: ['6', '8', '10', '12', '14'],
  },
];

const AUTOPLAY_DELAY = 5000; // 5 segundos

function formatCOP(num: number): string {
  return '$' + Math.round(num).toLocaleString('es-CO');
}

export const PackMayoristaClient: React.FC = () => {
  const { addToCart, setIsCartOpen } = useCart();
  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP_NUMBER);
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('all');
  const [selectedSizesByItem, setSelectedSizesByItem] = useState<{ [ref: string]: string }>({});
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [simulatedPrice, setSimulatedPrice] = useState<number>(115000);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState<boolean>(false);

  // Autoplay timers
  const [progressWidth, setProgressWidth] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressStartTimeRef = useRef<number>(0);

  // Obtener número de WhatsApp oficial
  useEffect(() => {
    getWhatsAppNumber().then(setWhatsappNumber);
  }, []);

  // Inicializar selección de tallas por defecto (primera talla disponible de cada prenda)
  useEffect(() => {
    const initialSizes: { [ref: string]: string } = {};
    INITIAL_PACK.forEach((item) => {
      initialSizes[item.ref] = item.availableSizes[0] || '8';
    });
    setSelectedSizesByItem(initialSizes);
  }, []);

  // Filtrado según la talla seleccionada
  const filteredItems = useMemo(() => {
    if (selectedSizeFilter === 'all') return INITIAL_PACK;
    return INITIAL_PACK.filter((item) => item.availableSizes.includes(selectedSizeFilter));
  }, [selectedSizeFilter]);

  // Si el índice activo queda fuera de rango al filtrar, ajustar a 0
  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(0);
    }
  }, [filteredItems, activeIndex]);

  const activeItem = filteredItems[activeIndex] || INITIAL_PACK[0];

  // Métricas financieras del pack de 12 prendas
  const totalWholesale = useMemo(() => {
    return INITIAL_PACK.reduce((acc, item) => acc + item.wholesalePrice, 0);
  }, []);

  const totalRegular = useMemo(() => {
    return INITIAL_PACK.reduce((acc, item) => acc + item.regularPrice, 0);
  }, []);

  const totalSimulatedRevenue = simulatedPrice * 12;
  const simulatedProfit = totalSimulatedRevenue - totalWholesale;
  const roiPercentage = Math.round((simulatedProfit / totalWholesale) * 100);

  // Manejo de temporizador de carrusel (5s)
  const resetAutoplay = () => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    if (viewMode !== 'carousel' || isHovered || filteredItems.length <= 1) {
      setProgressWidth(0);
      return;
    }

    setProgressWidth(0);
    progressStartTimeRef.current = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartTimeRef.current;
      const pct = Math.min((elapsed / AUTOPLAY_DELAY) * 100, 100);
      setProgressWidth(pct);
      if (pct >= 100 && progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    }, 50);

    autoplayTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
      resetAutoplay();
    }, AUTOPLAY_DELAY);
  };

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeIndex, filteredItems.length, viewMode, isHovered]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  const handleSelectSizeForItem = (ref: string, size: string) => {
    setSelectedSizesByItem((prev) => ({ ...prev, [ref]: size }));
  };

  // URL de WhatsApp para Cambiar Referencia
  const buildSwapWhatsAppUrl = (item: PackGarment) => {
    const selectedSize = selectedSizesByItem[item.ref] || item.availableSizes[0] || '8';
    const otherItems = INITIAL_PACK.filter((p) => p.ref !== item.ref);

    let msg = `¡Hola Ush By Ushuaia! 👋 Me interesa el *Pack Mayorista de 12 Prendas* ($${Math.round(totalWholesale).toLocaleString('es-CO')} COP con Envío 100% Gratis).\n\n`;
    msg += `🔄 *PRENDA QUE DESEO CAMBIAR:*\n`;
    msg += `• Ref: *${item.ref}* — ${item.title} (Talla actual: ${selectedSize}) valor: $${Math.round(item.wholesalePrice).toLocaleString('es-CO')}\n\n`;
    msg += `✅ *PRENDAS QUE SÍ CONSERVO DEL PACK (11 Uds):*\n`;
    otherItems.forEach((p, idx) => {
      const sz = selectedSizesByItem[p.ref] || p.availableSizes[0] || '8';
      msg += `${idx + 1}. Ref ${p.ref} (${p.category}) - Talla ${sz}\n`;
    });
    msg += `\n📦 *Total Inversión Base:* $${Math.round(totalWholesale).toLocaleString('es-CO')} COP`;
    msg += `\n🚚 *Flete Nacional:* 100% BONIFICADO GRATIS`;
    msg += `\n\n¿Por cuál otra referencia disponible del catálogo de rebajas o digital me sugieren cambiarla? ¡Gracias!`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  // URL de WhatsApp para Pedir Pack Completo
  const buildOrderPackWhatsAppUrl = () => {
    let msg = `¡Hola Ush By Ushuaia! 🛍️ Deseo confirmar el *Pack Mayorista Oficial de 12 Prendas* con Envío Gratis:\n\n`;
    INITIAL_PACK.forEach((item, idx) => {
      const sz = selectedSizesByItem[item.ref] || item.availableSizes[0] || '8';
      msg += `${idx + 1}. Ref *${item.ref}* - ${item.title} | *Talla: ${sz}* ($${Math.round(item.wholesalePrice).toLocaleString('es-CO')})\n`;
    });
    msg += `\n💰 *Total Inversión Mayorista:* $${Math.round(totalWholesale).toLocaleString('es-CO')} COP`;
    msg += `\n🚚 *Envío a Nivel Nacional:* 100% GRATIS`;
    msg += `\n📈 *Margen proyectado de venta:* +$${Math.round(simulatedProfit).toLocaleString('es-CO')} COP`;
    msg += `\n\n¿Me confirman los datos de despacho y medios de pago para procesar mi primer pedido? ¡Muchas gracias!`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  // Añadir el lote como Pack Mayorista Edición Limitada al carrito
  const handleAddPackAsBundleToCart = () => {
    // Generar resumen de tallas seleccionadas para el ítem
    const sizeSummary = INITIAL_PACK.map((item) => {
      const sz = selectedSizesByItem[item.ref] || item.availableSizes[0] || '8';
      return `Ref ${item.ref}: T${sz}`;
    }).join(' · ');

    addToCart(
      {
        id: 'pack-12-edicion-limitada',
        reference: 'PACK12-VIP',
        name: 'Pack Mayorista 12 Prendas (Edición Limitada)',
        slug: 'pack-mayorista',
        price: totalWholesale,
        suggested_price: totalRegular,
        in_stock: true,
        ribbon: 'EDICIÓN LIMITADA',
        options: [{ id: 'size', key: 'Talla', values: ['Curva Surtida 12 Uds'] }],
        images: [INITIAL_PACK[0].image, INITIAL_PACK[2].image, INITIAL_PACK[4].image],
        category: 'Packs Mayoristas',
        description: `Lote cerrado de 12 prendas en denim colombiano con envío 100% gratis. Tallas seleccionadas: ${sizeSummary}`,
      },
      'Curva Surtida (12 Uds)',
      'Mix Oficial 12 Prendas',
      1
    );

    setAddedToCartSuccess(true);
    setIsCartOpen(true);
    setTimeout(() => setAddedToCartSuccess(false), 5000);
  };

  // Añadir todas las 12 prendas desglosadas individualmente al carrito web
  const handleAddAllIndividualToCart = () => {
    INITIAL_PACK.forEach((item) => {
      const chosenSize = selectedSizesByItem[item.ref] || item.availableSizes[0] || '8';
      addToCart(
        {
          id: `pack-${item.ref}`,
          reference: item.ref,
          name: item.title,
          slug: `ref-${item.ref}`,
          price: item.wholesalePrice,
          suggested_price: item.regularPrice,
          in_stock: true,
          options: [{ id: 'size', key: 'Talla', values: item.availableSizes }],
          images: [item.image || item.fallbackImage],
          category: item.category,
        },
        chosenSize,
        'Denim Original',
        1
      );
    });
    setAddedToCartSuccess(true);
    setIsCartOpen(true);
    setTimeout(() => setAddedToCartSuccess(false), 5000);
  };

  // Contadores de prendas por talla
  const sizeCounts = useMemo(() => {
    const counts: { [sz: string]: number } = { all: INITIAL_PACK.length };
    ['6', '8', '10', '12', '14', '16'].forEach((sz) => {
      counts[sz] = INITIAL_PACK.filter((p) => p.availableSizes.includes(sz)).length;
    });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f8] text-neutral-900 pb-20">
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(216, 129, 147, 0.4), 0 4px 12px rgba(0,0,0,0.08); transform: scale(1); }
          50% { box-shadow: 0 0 30px rgba(216, 129, 147, 0.7), 0 8px 24px rgba(216, 129, 147, 0.35); transform: scale(1.02); }
        }
        @keyframes shimmerBtn {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .btn-pulse-glow {
          animation: pulseGlow 2.6s infinite ease-in-out;
        }
        .btn-shimmer {
          background: linear-gradient(90deg, #d88193 0%, #f19eb0 50%, #d88193 100%);
          background-size: 200% 100%;
          animation: shimmerBtn 4s infinite linear;
        }
        .btn-green-pulse {
          box-shadow: 0 4px 20px rgba(37, 211, 102, 0.35);
          transition: all 0.25s ease;
        }
        .btn-green-pulse:hover {
          box-shadow: 0 8px 28px rgba(37, 211, 102, 0.55);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ── BARRA SUPERIOR INFORMATIVA ── */}
      <div className="bg-[#1b2333] text-white py-2.5 px-4 text-center text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 sticky top-0 z-40 shadow-sm">
        <span className="bg-[#10b981] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
          ENVÍO GRATIS
        </span>
        <span>
          🔥 Inicia tu negocio con el <strong className="text-rose-200">Pack Oficial de 12 Prendas</strong> · Despacho inmediato a toda Colombia
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">

        {/* ── HERO COMPACTO: PACK OFICIAL 12 PRENDAS ── */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#c06579] text-[11px] font-black uppercase tracking-widest mb-2">
            <Sparkles size={12} className="text-[#d88193]" />
            <span>Oportunidad Mayorista B2B</span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black uppercase text-[#1b2333] tracking-tight leading-tight">
            Pack Mayorista Oficial de 12 Prendas
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xl mx-auto">
            Las 12 siluetas de mayor venta en jeans, shorts y faldas de mezclilla colombiana. Margen directo superior y <strong>envío 100% gratis</strong> a toda Colombia.
          </p>
        </div>

        {/* ── SECCIÓN DE MARGEN DE GANANCIA Y SIMULADOR ARRIBA (COMPACTO Y DESTACADO) ── */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 items-center">

            {/* Columna Resumen Métricas */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                  <Truck size={12} /> Envío 100% Bonificado
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#c06579] text-[10px] font-black uppercase tracking-wider">
                  <TrendingUp size={12} /> Inversión Cerrada
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black uppercase text-[#1b2333] leading-tight">
                Margen de Ganancia para tu Negocio
              </h2>
              <p className="text-xs text-neutral-600 mt-1 leading-snug">
                Precio mayorista garantizado en las 12 prendas. Eres libre de definir tu precio de reventa para maximizar tu rentabilidad.
              </p>

              {/* Grid 4 métricas compactas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-neutral-100 text-center">
                <div className="bg-neutral-50 rounded-lg p-2 border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 block uppercase leading-none">Prendas</span>
                  <span className="text-xs sm:text-sm font-black text-neutral-800 mt-1 block">12 Surtidas</span>
                </div>
                <div className="bg-neutral-50 rounded-lg p-2 border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 block uppercase leading-none">Flete Nacional</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700 mt-1 block">100% GRATIS</span>
                </div>
                <div className="bg-neutral-50 rounded-lg p-2 border border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-500 block uppercase leading-none">Valor Detal Base</span>
                  <span className="text-xs sm:text-sm font-black text-neutral-700 mt-1 block line-through">{formatCOP(totalRegular)}</span>
                </div>
                <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
                  <span className="text-[10px] font-black text-[#c06579] block uppercase leading-none">Tu Inversión</span>
                  <span className="text-xs sm:text-sm font-black text-[#c06579] mt-1 block">{formatCOP(totalWholesale)}</span>
                </div>
              </div>
            </div>

            {/* Columna Simulador y Botones */}
            <div className="bg-[#faf8f8] border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-neutral-700">
                    Tu precio estimado de reventa por prenda:
                  </label>
                  <span className="font-black text-xs sm:text-sm text-[#c06579] bg-white border border-rose-200 px-2.5 py-0.5 rounded-md shadow-2xs">
                    {formatCOP(simulatedPrice)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="range"
                    min="95000"
                    max="180000"
                    step="5000"
                    value={simulatedPrice}
                    onChange={(e) => setSimulatedPrice(Number(e.target.value))}
                    className="flex-1 accent-[#d88193] cursor-pointer"
                  />
                </div>

                {/* Caja de Ganancia Neta */}
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center flex items-center justify-between px-3.5">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block leading-none">
                      Ganancia Neta Estimada:
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                      Retorno proyectado del {roiPercentage}%
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-700">
                    +{formatCOP(simulatedProfit)} COP
                  </div>
                </div>
              </div>

              {/* Botones de Acción Directos */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={buildOrderPackWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1eb855] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 btn-green-pulse shadow-md"
                >
                  <MessageCircle size={15} />
                  <span>Pedir por WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleAddPackAsBundleToCart}
                  className="py-2.5 px-3 rounded-xl bg-[#1b2333] hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <ShoppingBag size={15} />
                  <span>{addedToCartSuccess ? '✓ Pack en Carrito' : '🛒 Agregar Pack Limitado'}</span>
                </button>
              </div>

              {addedToCartSuccess && (
                <div className="mt-2 p-2 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-700" />
                  <span>¡Pack Mayorista Edición Limitada agregado a tu carrito web!</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── BARRA DE FILTRO POR TALLAS (CON BASE EN REBAJAS USHUAIA) ── */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-[#d88193]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1b2333]">
                  Filtrar prendas por talla disponible:
                </h3>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Basado en disponibilidad en tiempo real de bodega (Rebajas Ushuaia):
              </p>
            </div>

            {/* Selector de modo de vista (Carrusel vs Cuadrícula) */}
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('carousel')}
                className={`px-3 py-1 text-[11px] font-black uppercase rounded-md flex items-center gap-1.5 transition ${
                  viewMode === 'carousel' ? 'bg-[#1b2333] text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                <span>⏱️ Carrusel 5s</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-[11px] font-black uppercase rounded-md flex items-center gap-1.5 transition ${
                  viewMode === 'grid' ? 'bg-[#1b2333] text-white shadow-xs' : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Grid size={13} />
                <span>Ver las 12</span>
              </button>
            </div>
          </div>

          {/* Pastillas de Tallas */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-3">
            {[
              { key: 'all', label: 'Todas las tallas', count: sizeCounts['all'] },
              { key: '6', label: 'Talla 6', count: sizeCounts['6'] },
              { key: '8', label: 'Talla 8', count: sizeCounts['8'] },
              { key: '10', label: 'Talla 10', count: sizeCounts['10'] },
              { key: '12', label: 'Talla 12', count: sizeCounts['12'] },
              { key: '14', label: 'Talla 14', count: sizeCounts['14'] },
              { key: '16', label: 'Talla 16', count: sizeCounts['16'] },
            ].map(({ key, label, count }) => {
              const isSelected = selectedSizeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedSizeFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#d88193] text-white shadow-xs font-black'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-rose-50 hover:text-[#d88193]'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MODO 1: CARRUSEL PROTAGONISTA CADA 5 SEGUNDOS ── */}
        {viewMode === 'carousel' && (
          <div
            className="bg-white border border-neutral-200 rounded-2xl shadow-card overflow-hidden mb-12 relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Barra de progreso de 5s */}
            <div className="w-full h-1.5 bg-neutral-100 overflow-hidden relative">
              <div
                className="h-full bg-[#d88193] transition-all duration-75 ease-linear"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] min-h-[500px]">

              {/* Columna Foto Grande */}
              <div className="bg-[#fcfafa] p-6 sm:p-8 flex items-center justify-center relative border-b lg:border-b-0 lg:border-r border-neutral-200 overflow-hidden">
                {/* Badges de esquina */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                  <span className="bg-[#1b2333] text-white text-xs font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                    REF: {activeItem.ref}
                  </span>
                  <span className="bg-rose-50 text-[#d88193] border border-rose-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full w-fit">
                    {activeItem.category}
                  </span>
                </div>

                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-emerald-500 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                  <Truck size={13} />
                  <span>Envío Gratis</span>
                </div>

                <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-xs border border-neutral-200 text-neutral-600 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>⏱️ Pasa cada 5s</span>
                </div>

                {/* Imagen del producto */}
                <div className="w-full max-w-sm aspect-[3/4] relative flex items-center justify-center">
                  <img
                    src={activeItem.image || activeItem.fallbackImage}
                    alt={activeItem.title}
                    onError={(e) => {
                      if (activeItem.fallbackImage && e.currentTarget.src !== activeItem.fallbackImage) {
                        e.currentTarget.src = activeItem.fallbackImage;
                      }
                    }}
                    className="max-h-full max-w-full object-contain drop-shadow-md transition-all duration-300 hover:scale-105"
                  />
                </div>
              </div>

              {/* Columna Datos y Botones Dinámicos */}
              <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#d88193]">
                      Prenda {activeIndex + 1} de {filteredItems.length} {selectedSizeFilter !== 'all' ? `(Talla ${selectedSizeFilter})` : 'del Pack'}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold">
                      Alta Rotación Comprobada
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black uppercase text-[#1b2333] leading-snug">
                    {activeItem.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {activeItem.desc}
                  </p>

                  {/* Selector de tallas individual para esta prenda */}
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <label className="text-[11px] font-black uppercase tracking-wider text-neutral-700 block mb-1.5">
                      Elige tu talla para esta referencia:
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {activeItem.allSizes.map((sz) => {
                        const isAvail = activeItem.availableSizes.includes(sz);
                        const isChosen = (selectedSizesByItem[activeItem.ref] || activeItem.availableSizes[0]) === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            disabled={!isAvail}
                            onClick={() => handleSelectSizeForItem(activeItem.ref, sz)}
                            className={`w-9 h-9 rounded-lg text-xs font-black transition flex items-center justify-center border ${
                              isChosen
                                ? 'bg-[#d88193] text-white border-[#d88193] shadow-xs'
                                : isAvail
                                ? 'bg-white text-neutral-800 border-neutral-300 hover:border-[#d88193]'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through cursor-not-allowed opacity-50'
                            }`}
                            title={isAvail ? `Talla ${sz} disponible` : `Talla ${sz} agotada`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tarjeta de Precios y Margen */}
                  <div className="mt-5 p-4 rounded-xl bg-rose-50/40 border border-rose-100">
                    <div className="flex items-center justify-between text-xs text-neutral-600 mb-1.5">
                      <span>Precio regular en tienda:</span>
                      <span className="line-through font-semibold text-neutral-500">
                        {formatCOP(activeItem.regularPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm sm:text-base font-black text-[#1b2333] mb-2">
                      <span>Tu precio en este Pack:</span>
                      <span className="text-xl font-black text-[#c06579]">
                        {formatCOP(activeItem.wholesalePrice)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-rose-200/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-700">Margen bruto estimado:</span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        +{formatCOP(activeItem.regularPrice - activeItem.wholesalePrice)} COP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones del Carrusel */}
                <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Botón Cambiar Referencia */}
                    <a
                      href={buildSwapWhatsAppUrl(activeItem)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl border-2 border-[#d88193] text-[#c06579] hover:bg-rose-50 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
                    >
                      <RotateCcw size={14} />
                      <span>Cambiar esta prenda</span>
                    </a>

                    {/* Botón Pedir Pack Completo */}
                    <a
                      href={buildOrderPackWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 btn-shimmer btn-pulse-glow hover:-translate-y-0.5 transition shadow-lg"
                    >
                      <MessageCircle size={15} />
                      <span>Pedir Pack Completo</span>
                    </a>
                  </div>

                  <p className="text-[11px] text-center text-neutral-500 leading-tight">
                    💡 Al tocar <strong>"Cambiar esta prenda"</strong> te abre WhatsApp indicándonos cuál referencia deseas cambiar y cuáles 11 conservas.
                  </p>
                </div>

              </div>

            </div>

            {/* Tira inferior de navegación y miniaturas */}
            <div className="bg-neutral-50 border-t border-neutral-200 p-3 sm:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="w-9 h-9 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-[#d88193] hover:text-white hover:border-[#d88193] transition"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-9 h-9 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-[#d88193] hover:text-white hover:border-[#d88193] transition"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                {filteredItems.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`shrink-0 w-14 sm:w-16 h-18 sm:h-20 rounded-lg p-1 bg-white border-2 flex flex-col items-center justify-between transition ${
                        isActive
                          ? 'border-[#d88193] bg-rose-50/50 scale-105 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300 opacity-80'
                      }`}
                    >
                      <img
                        src={item.image || item.fallbackImage}
                        alt={item.ref}
                        className="w-full h-11 sm:h-12 object-contain"
                      />
                      <span className="text-[9px] font-black text-neutral-700">
                        {item.ref}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── MODO 2: CUADRÍCULA COMPLETA DE LAS 12 PRENDAS ── */}
        {viewMode === 'grid' && (
          <div className="mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const chosenSize = selectedSizesByItem[item.ref] || item.availableSizes[0] || '8';
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs hover:border-[#d88193] hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="p-3 bg-[#faf8f8] relative aspect-[3/4] flex items-center justify-center">
                      <span className="absolute top-2 left-2 bg-[#1b2333] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        REF {item.ref}
                      </span>
                      <img
                        src={item.image || item.fallbackImage}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="p-3.5 flex flex-col flex-1 justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#d88193]">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-black uppercase text-[#1b2333] line-clamp-2 mt-0.5 leading-snug">
                          {item.title}
                        </h4>

                        {/* Tallas disponibles */}
                        <div className="mt-2.5">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                            Talla:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {item.allSizes.map((sz) => {
                              const isAvail = item.availableSizes.includes(sz);
                              const isSelected = chosenSize === sz;
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  disabled={!isAvail}
                                  onClick={() => handleSelectSizeForItem(item.ref, sz)}
                                  className={`w-6 h-6 rounded text-[10px] font-black border transition ${
                                    isSelected
                                      ? 'bg-[#d88193] text-white border-[#d88193]'
                                      : isAvail
                                      ? 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:border-[#d88193]'
                                      : 'bg-neutral-100 text-neutral-300 border-neutral-200 line-through'
                                  }`}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Precios */}
                        <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-400 line-through block leading-none">
                              {formatCOP(item.regularPrice)}
                            </span>
                            <span className="font-black text-[#c06579] text-sm">
                              {formatCOP(item.wholesalePrice)}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            +{formatCOP(item.regularPrice - item.wholesalePrice)}
                          </span>
                        </div>
                      </div>

                      {/* Botón WhatsApp cambiar */}
                      <a
                        href={buildSwapWhatsAppUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full py-1.5 rounded-lg border border-[#d88193] text-[#c06579] hover:bg-rose-50 text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1 transition"
                      >
                        <RotateCcw size={11} />
                        <span>Cambiar prenda</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
