'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Check, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Crop, Sparkles, Image as ImageIcon, Loader2, Move
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob, croppedDataUrl: string) => void;
  initialAspectRatio?: number | null; // e.g. 3/4 = 0.75, 1 = 1, 16/9 = 1.777, null = free
  title?: string;
}

type AspectRatioPreset = {
  label: string;
  ratio: number | null;
  desc: string;
  iconText: string;
};

const ASPECT_PRESETS: AspectRatioPreset[] = [
  { label: '3:4', ratio: 3 / 4, desc: 'Catálogo Jeans (Vertical)', iconText: '3:4' },
  { label: '1:1', ratio: 1, desc: 'Cuadrado / Miniatura', iconText: '1:1' },
  { label: '16:9', ratio: 16 / 9, desc: 'Banner / Horizontal', iconText: '16:9' },
  { label: 'Libre', ratio: null, desc: 'Ajuste personalizado', iconText: 'Libre' },
];

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  initialAspectRatio = 3 / 4,
  title = 'Recortar y Optimizar Imagen',
}) => {
  const [selectedRatio, setSelectedRatio] = useState<number | null>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when opening with a new image
  useEffect(() => {
    if (isOpen && imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setSelectedRatio(initialAspectRatio);
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
    }
  }, [isOpen, imageSrc, initialAspectRatio]);

  // Handle Mouse / Touch Dragging for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Perform Cropping via Canvas
  const handleApplyCrop = useCallback(async () => {
    if (!imageRef.current || !containerRef.current) return;
    setProcessing(true);

    try {
      const img = imageRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Determine viewport crop dimensions
      let cropWidth = rect.width;
      let cropHeight = rect.height;

      if (selectedRatio !== null) {
        if (cropWidth / cropHeight > selectedRatio) {
          cropWidth = cropHeight * selectedRatio;
        } else {
          cropHeight = cropWidth / selectedRatio;
        }
      }

      // Output canvas sizing (high-res for quality)
      const targetWidth = selectedRatio ? Math.round(1200 * (selectedRatio < 1 ? selectedRatio : 1)) : 1200;
      const targetHeight = selectedRatio ? Math.round(1200 / (selectedRatio > 1 ? selectedRatio : 1)) : Math.round(1200 * (img.height / img.width));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo inicializar el lienzo de recorte.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background fill in case of transparent borders
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Translate to canvas center for rotation & zoom
      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Scale factors between container view and target canvas
      const scaleToCanvas = targetWidth / cropWidth;

      // Draw image centered with offset
      const drawX = (offset.x * scaleToCanvas);
      const drawY = (offset.y * scaleToCanvas);

      // Calculate source image display aspect ratio
      const imgAspect = img.width / img.height;
      let drawW = targetWidth;
      let drawH = targetWidth / imgAspect;

      if (drawH < targetHeight) {
        drawH = targetHeight;
        drawW = targetHeight * imgAspect;
      }

      ctx.drawImage(img, -drawW / 2 + drawX, -drawH / 2 + drawY, drawW, drawH);
      ctx.restore();

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          setProcessing(false);
          if (blob) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            onCropComplete(blob, dataUrl);
            onClose();
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Error cropping image:', err);
      setProcessing(false);
    }
  }, [selectedRatio, zoom, rotation, offset, onCropComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-[#1b2333] text-white w-full max-w-4xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d88193] flex items-center justify-center text-white shadow">
              <Crop size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
              <p className="text-[11px] text-neutral-400">
                Ajusta el encuadre, proporción y zoom para mantener fotos uniformes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Workspace */}
        <div className="flex-1 min-h-[340px] max-h-[500px] bg-neutral-950/80 relative flex items-center justify-center overflow-hidden p-6 select-none">
          {!imageLoaded ? (
            <div className="flex flex-col items-center gap-2 text-neutral-400">
              <Loader2 size={28} className="animate-spin text-[#d88193]" />
              <span className="text-xs font-semibold">Cargando imagen...</span>
            </div>
          ) : (
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative overflow-hidden cursor-move border-2 border-dashed border-[#d88193]/80 rounded-xl shadow-2xl bg-neutral-900 transition-all ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                width: selectedRatio ? (selectedRatio <= 1 ? `${Math.round(320 * selectedRatio)}px` : '420px') : '360px',
                height: selectedRatio ? (selectedRatio >= 1 ? `${Math.round(420 / selectedRatio)}px` : '420px') : '360px',
                maxHeight: '440px',
                maxWidth: '100%',
              }}
            >
              {/* Image with transform */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Para recortar"
                className="w-full h-full object-cover pointer-events-none transition-transform"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />

              {/* Grid overlay for rule of thirds */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>

              {/* Guide label */}
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white px-2 py-0.5 rounded flex items-center gap-1">
                <Move size={10} /> Arrastra para encuadrar
              </div>
            </div>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="p-4 sm:p-5 bg-[#171f2e] border-t border-white/10 space-y-4 flex-shrink-0">
          {/* Aspect Ratio Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-bold uppercase tracking-wider">
              <Sparkles size={13} className="text-[#d88193]" />
              Proporción de aspecto:
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              {ASPECT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setSelectedRatio(preset.ratio);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    selectedRatio === preset.ratio
                      ? 'bg-[#d88193] text-white shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={preset.desc}
                >
                  {preset.iconText}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom and Rotate sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Zoom */}
            <div className="flex items-center gap-3 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
              <ZoomOut size={15} className="text-neutral-400" />
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#d88193] h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
              <ZoomIn size={15} className="text-neutral-400" />
              <span className="text-[11px] font-mono text-neutral-300 w-10 text-right">
                {zoom.toFixed(1)}x
              </span>
            </div>

            {/* Rotation & Reset */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                title="Girar 90 grados"
              >
                <RotateCw size={13} /> Girar ({rotation}°)
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setOffset({ x: 0, y: 0 });
                }}
                className="px-3 py-2 text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Restablecer
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/20 text-neutral-300 hover:text-white hover:bg-white/10 text-xs font-black uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={processing || !imageLoaded}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#d88193] hover:bg-[#c3687c] text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-rose-900/40 disabled:opacity-50"
            >
              {processing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {processing ? 'Procesando...' : 'Aplicar y Usar Foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
