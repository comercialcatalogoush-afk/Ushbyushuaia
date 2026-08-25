'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Layers, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCart();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      { toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border-l-4 border-[#d88193] shadow-2xl rounded-sm p-4 flex items-start gap-3 pointer-events-auto"
          style={{ animation: 'slideInRight 0.3s ease-out' }}
          role="alert"
          aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">
            <Layers size={8} className="text-[#d88193]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1b2333] uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
              Misma Referencia — Tallas Diferentes
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-700 transition-colors p-0.5 ml-1"
            aria-label="Cerrar notificacion"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
