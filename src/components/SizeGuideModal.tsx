'use client';

import React from 'react';
import Image from 'next/image';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-ush-navy text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="text-ush-pink" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Guía Oficial de Tallas USHUAIA
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body with Official Size Chart Image */}
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          <div className="relative aspect-[1/1] w-full bg-neutral-100 border border-gray-100 overflow-hidden">
            <Image
              src="/images/guia-tallas.png"
              alt="Guía de Tallas Oficial USHUAIA - Tallas 6 a 14"
              fill
              className="object-contain"
            />
          </div>

          <div className="mt-4 p-3 bg-neutral-50 border border-gray-200 text-[11px] text-neutral-600 space-y-1">
            <p className="font-bold text-neutral-900 uppercase">💡 Recomendación de Horma:</p>
            <p>• Las prendas están confeccionadas bajo medidas estándar en Colombia.</p>
            <p>• Tallas disponibles para catálogo mayorista: 6, 8, 10, 12, 14.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-100 p-3 text-right">
          <button
            onClick={onClose}
            className="bg-ush-navy text-white text-xs font-bold uppercase tracking-wider px-5 py-2 hover:bg-black"
          >
            Cerrar Guía
          </button>
        </div>

      </div>
    </div>
  );
};
