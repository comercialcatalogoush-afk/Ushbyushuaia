'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCart } from '@/context/CartContext';

/* ── Mensajes rotativos según estado del carrito ── */
const MESSAGES_EMPTY = [
  '¡Estoy vacía! 🛍️',
  'Agrega tu primera prenda',
  'Tu próximo surtido empieza aquí',
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

/* Carrito SVG propio: se mantiene nítido en móvil y no depende de una imagen externa. */
function CartMascot({ level, units }: { level: Level; units: number }) {
  const fill = Math.min(1, units / 12);
  const basketColor = level === 'full' ? '#f59e0b' : '#d88193';
  return (
    <svg className="cart-mascot relative z-10" viewBox="0 0 112 82" role="img" aria-label="Carrito animado">
      <g className="cart-mascot-body">
        <path d="M12 13h11l9 42h53l11-31H32" fill="none" stroke="#1b2333" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M35 25h54l-7 24H40z" fill="#fff" stroke="#1b2333" strokeWidth="4" strokeLinejoin="round" />
        <g className="cart-mascot-items" opacity={fill > 0 ? 1 : 0}>
          <path d="M43 28h13l-2 14H42z" fill="#d88193" stroke="#1b2333" strokeWidth="1.5" />
          <path d="M56 27h14l3 15H57z" fill="#1b2333" stroke="#1b2333" strokeWidth="1.5" />
          <path d="M70 29h12l-1 13H72z" fill={basketColor} stroke="#1b2333" strokeWidth="1.5" />
        </g>
        <path d="M43 31h37M46 40h31" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".75" />
        <circle cx="48" cy="66" r="8" fill="#1b2333" />
        <circle cx="48" cy="66" r="3" fill="#fff" />
        <circle cx="78" cy="66" r="8" fill="#1b2333" />
        <circle cx="78" cy="66" r="3" fill="#fff" />
        <circle cx="56" cy="37" r="3" fill="#1b2333" />
        <circle cx="72" cy="37" r="3" fill="#1b2333" />
        <path d="M60 43q4 4 8 0" fill="none" stroke="#1b2333" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {level === 'full' && (
        <g className="cart-mascot-sparkles" fill="#f59e0b">
          <path d="M98 13l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M19 61l1.5 3.5L24 66l-3.5 1.5L19 71l-1.5-3.5L14 66l3.5-1.5z" />
        </g>
      )}
    </svg>
  );
}

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
        .cart-mascot { width: 48px; height: 38px; overflow: visible; }
        .cart-mascot-body { transform-origin: 55px 42px; animation: mascot-bob 2.4s ease-in-out infinite; }
        .cart-mascot-sparkles { animation: mascot-sparkle 1.2s ease-in-out infinite; transform-origin: center; }
        @keyframes mascot-bob {
          0%, 100% { transform: translateY(1px) rotate(-2deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes mascot-sparkle {
          0%, 100% { opacity: .35; transform: scale(.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(12deg); }
        }
        .cart-full  {
          background: linear-gradient(135deg,#f59e0b 0%,#d88193 50%,#f59e0b 100%);
          background-size: 200% auto;
          animation: shimmer-ush 3s linear infinite, glow-full 2s ease-in-out infinite;
        }
        .cart-mascot-items { transform-origin: 62px 38px; animation: clothes-bob 2s ease-in-out infinite; }
        @keyframes clothes-bob {
          0%, 100% { transform: translateY(1px); }
          50% { transform: translateY(-2px); }
        }
        .msg-fade-in  { opacity: 1;  transform: translateY(0);    transition: opacity .3s, transform .3s; }
        .msg-fade-out { opacity: 0;  transform: translateY(4px);  transition: opacity .3s, transform .3s; }
      `}</style>

      {/* Contenedor fijo inferior-derecha con z-index seguro y espacio suficiente */}
      <div className="fixed bottom-4 right-3.5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-1 pointer-events-none">

        {/* En móvil se conserva solo el botón para no tapar textos ni controles multimedia. */}
        <div
          className={`
            hidden sm:block px-3 py-1 rounded-full text-xs font-bold shadow-lg select-none pointer-events-none max-w-[200px] text-center truncate transition-all duration-300
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
          data-cart-button="true"
          style={{ pointerEvents: 'all' }}
          className={`
            relative w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full flex items-center justify-center
            transition-all duration-300 shadow-xl
            border-2 border-[#d88193]/40 bg-white
            focus:outline-none focus-visible:ring-4 focus-visible:ring-[#d88193]/50
            ${level === 'full' ? 'cart-full' : btnClass}
            ${ringClass}
            ${popping ? 'cart-pop' : 'cart-float'}
          `}
        >
          {/* Relleno gradual: cada unidad aumenta visualmente el surtido del carrito. */}
          {level !== 'empty' && (
            <div className="absolute inset-0 z-0 rounded-full overflow-hidden" aria-hidden="true" data-cart-fill="true">
              <div
                className="absolute bottom-0 left-0 right-0 bg-[#d88193]/15 transition-all duration-700 ease-out"
                style={{
                  height: `${Math.max(10, Math.min(100, (units / 12) * 100))}%`,
                }}
              />
            </div>
          )}

          {/* Ping para nivel full */}
          {level === 'full' && (
            <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" aria-hidden="true" />
          )}

          {/* Carrito tipo caricatura con prendas visibles y llegada animada desde cada tarjeta. */}
          <CartMascot level={level} units={units} />

          {/* Badge contador */}
          {level !== 'empty' && (
            <span className={`
              absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full
              text-[10px] flex items-center justify-center z-20 shadow
              ${badgeClass}
            `}
              data-cart-badge="true"
          >
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};
