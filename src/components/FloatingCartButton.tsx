'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

/* ── Mensajes rotativos según estado del carrito ── */
const MESSAGES_EMPTY = [
  '¡Estoy vacía! 🛍️',
  'Agrega tu primera prenda',
  '90 refs te esperan 👖',
  '¡Empieza tu surtido!',
];
const MESSAGES_LOW = [
  '¡Vas muy bien! 🔥',
  '8 uds = 20% OFF',
  'Sigue agregando prendas',
  '¿Qué más te gusta?',
];
const MESSAGES_MID = [
  '¡Casi mayorista! ⚡',
  '12 uds = ENVÍO GRATIS',
  '¡Faltan pocas!',
  '🎯 Cierra tu pedido',
];
const MESSAGES_FULL = [
  '🏆 ¡Nivel Mayorista!',
  '🚚 Envío GRATIS',
  '¡Precio de fábrica!',
  '💎 Surtido completo',
];

type Level = 'empty' | 'low' | 'mid' | 'full';

function useRotatingMessage(messages: string[], intervalMs = 3000) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % messages.length);
        setFade(true);
      }, 300);
    }, intervalMs);
    return () => clearInterval(t);
  }, [messages, intervalMs]);
  return { msg: messages[idx], fade };
}

export const FloatingCartButton: React.FC = () => {
  const { totalItemsCount, totalUnits, isCartOpen, setIsCartOpen, formatCOP, subtotalCOP } = useCart();
  const prevCount = useRef(totalItemsCount);
  const [popping, setPopping] = useState(false);

  /* Animación pop al agregar */
  useEffect(() => {
    if (totalItemsCount > prevCount.current) {
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 600);
      prevCount.current = totalItemsCount;
      return () => clearTimeout(t);
    }
    prevCount.current = totalItemsCount;
  }, [totalItemsCount]);

  /* Ocultar si el banner de beneficios está visible (evita superposición) */
  const [bannerOpen, setBannerOpen] = useState(false);
  useEffect(() => {
    const onBanner = (e: any) => {
      setBannerOpen(Boolean(e.detail?.open));
    };
    window.addEventListener('ush:banner-state', onBanner);
    return () => window.removeEventListener('ush:banner-state', onBanner);
  }, []);

  /* Detectar ruta actual para no sobreponerse en checkout o calculadora */
  const [isExcludedPage, setIsExcludedPage] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkPath = () => {
        const p = window.location.pathname;
        setIsExcludedPage(p.startsWith('/checkout') || p.startsWith('/calculadora-ganancias'));
      };
      checkPath();
      window.addEventListener('popstate', checkPath);
      return () => window.removeEventListener('popstate', checkPath);
    }
  }, []);

  const units = totalUnits ?? totalItemsCount;
  const level: Level =
    units === 0 ? 'empty' : units < 8 ? 'low' : units < 12 ? 'mid' : 'full';

  const msgPool =
    level === 'empty' ? MESSAGES_EMPTY
    : level === 'low'  ? MESSAGES_LOW
    : level === 'mid'  ? MESSAGES_MID
    :                    MESSAGES_FULL;

  const { msg, fade } = useRotatingMessage(msgPool, 3000);
  const priceLabel = subtotalCOP > 0 ? formatCOP(subtotalCOP) : null;

  /* ── Paleta de colores USH según nivel ── */
  const btnClass = {
    empty: 'bg-white border-2 border-[#d88193]/40 text-[#d88193] hover:border-[#d88193] hover:bg-[#fff1f4]',
    low:   'bg-[#d88193] text-white hover:bg-[#c96e80]',
    mid:   'bg-[#1b2333] text-white hover:bg-[#263245]',
    full:  'text-white',
  }[level];

  const ringClass = {
    empty: '',
    low:   'ring-4 ring-[#d88193]/30 ring-offset-1',
    mid:   'ring-4 ring-[#1b2333]/30 ring-offset-1',
    full:  'ring-4 ring-amber-400/50 ring-offset-1',
  }[level];

  const badgeClass = {
    empty: 'hidden',
    low:   'bg-[#1b2333] text-white',
    mid:   'bg-[#d88193] text-white animate-pulse',
    full:  'bg-amber-400 text-[#1b2333] font-black',
  }[level];

  const msgClass = {
    empty: 'bg-white border border-[#d88193]/30 text-[#1b2333]',
    low:   'bg-[#d88193] text-white',
    mid:   'bg-[#1b2333] text-white',
    full:  'bg-gradient-to-r from-amber-400 to-[#d88193] text-white',
  }[level];

  if (bannerOpen || isCartOpen || isExcludedPage) return null;

  return (
    <>
      <style>{`
        @keyframes float-ush {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes pop-ush {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          75%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @keyframes shimmer-ush {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-full {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(251,191,36,.45),0 8px 24px rgba(216,129,147,.4); }
          50%       { box-shadow: 0 0 36px 10px rgba(251,191,36,.7),0 12px 32px rgba(216,129,147,.6); }
        }
        .cart-float { animation: float-ush 3.2s ease-in-out infinite; }
        .cart-pop   { animation: pop-ush 0.55s cubic-bezier(.36,.07,.19,.97) both; }
        .cart-full  {
          background: linear-gradient(135deg,#f59e0b 0%,#d88193 50%,#f59e0b 100%);
          background-size: 200% auto;
          animation: shimmer-ush 3s linear infinite, glow-full 2s ease-in-out infinite;
        }
        .msg-fade-in  { opacity: 1;  transform: translateY(0);    transition: opacity .3s, transform .3s; }
        .msg-fade-out { opacity: 0;  transform: translateY(4px);  transition: opacity .3s, transform .3s; }
      `}</style>

      {/* Contenedor fijo inferior-derecha con z-index seguro y espacio suficiente */}
      <div className="fixed bottom-4 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-1 pointer-events-none">

        {/* ── Mensaje rotativo: visible en móvil y desktop con animación fluida ── */}
        <div
          className={`
            block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg select-none pointer-events-none max-w-[160px] sm:max-w-[200px] text-center truncate transition-all duration-300
            ${msgClass}
            ${fade ? 'msg-fade-in' : 'msg-fade-out'}
          `}
        >
          {msg}
        </div>

        {/* ── Precio total (cuando hay items) ── */}
        {priceLabel && level !== 'empty' && (
          <div className={`
            self-end px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm pointer-events-none
            ${level === 'full' ? 'bg-amber-400 text-[#1b2333]' : 'bg-white text-[#1b2333] border border-[#d88193]/30'}
          `}>
            {priceLabel}
          </div>
        )}

        {/* ── Botón principal ── */}
        <button
          onClick={() => setIsCartOpen(true)}
          aria-label={`Abrir carrito de compras (${units} unidades)`}
          style={{ pointerEvents: 'all' }}
          className={`
            relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-xl
            focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d88193]/50
            ${level === 'full' ? 'cart-full' : btnClass}
            ${ringClass}
            ${popping ? 'cart-pop' : 'cart-float'}
          `}
        >
          {/* Relleno visual de la bolsa */}
          {level !== 'empty' && (
            <div className="absolute inset-0 rounded-full overflow-hidden" aria-hidden="true">
              <div
                className="absolute bottom-0 left-0 right-0 bg-white/20 transition-all duration-700 ease-out"
                style={{
                  height: level === 'low' ? '28%' : level === 'mid' ? '58%' : '88%',
                }}
              />
            </div>
          )}

          {/* Ping para nivel full */}
          {level === 'full' && (
            <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" aria-hidden="true" />
          )}

          {/* Icono bolsa */}
          <ShoppingBag
            size={level === 'empty' ? 20 : 22}
            strokeWidth={level === 'full' ? 2.5 : 2}
            className="relative z-10"
          />

          {/* Badge contador */}
          {level !== 'empty' && (
            <span className={`
              absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full
              text-[10px] flex items-center justify-center z-20 shadow
              ${badgeClass}
            `}>
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};
