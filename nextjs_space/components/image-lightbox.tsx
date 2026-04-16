'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaItem {
  url: string;
  tipo?: string;
  thumbnailUrl?: string;
}

interface ProductInfo {
  nome?: string;
  codigo?: string;
  preco?: number;
  precoOriginal?: number;
  departamento?: { nome?: string };
  categoria?: { nome?: string };
}

interface ImageLightboxProps {
  images: MediaItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  produto?: ProductInfo | null;
}

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose, produto }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const current = images[currentIndex];
  const isVideo = current?.tipo === 'video';

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbRef.current && images.length > 1) {
      const activeThumb = thumbRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, images.length]);

  const goNext = useCallback(() => {
    if (images.length > 1) setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length > 1) setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
  };

  const fmt = (v: number) => `R$ ${v?.toFixed(2)?.replace('.', ',')}`;

  const handleWhatsApp = () => {
    if (!produto) return;
    let msg = `\u2728 *${produto.nome || 'Produto'}*\n`;
    if (produto.codigo) msg += `C\u00f3d: ${produto.codigo}\n`;
    if (produto.preco) msg += `\uD83D\uDCB0 ${fmt(produto.preco)}\n`;
    if (produto.departamento?.nome) msg += `${produto.departamento.nome}`;
    if (produto.categoria?.nome) msg += ` - ${produto.categoria.nome}`;
    msg += '\n\n\uD83D\uDC8E Dande Acess\u00f3rios';
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (!images || images.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col"
          onClick={onClose}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 z-10" onClick={e => e.stopPropagation()}>
            {/* Counter */}
            {images.length > 1 ? (
              <span className="text-white/70 text-sm font-medium">
                {currentIndex + 1} de {images.length}
              </span>
            ) : <span />}
            {/* Close */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {/* Main image area */}
          <div
            className="flex-1 relative min-h-0"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {isVideo ? (
                  <video
                    src={current?.url ?? ''}
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    controls
                    autoPlay
                    playsInline
                    onEnded={() => { if (images.length > 1) goNext(); }}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={current?.url ?? ''}
                    alt={produto?.nome || 'Produto Dande'}
                    className="max-w-full max-h-full object-contain rounded-2xl"
                    draggable={false}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="px-2 py-2 z-10" onClick={e => e.stopPropagation()}>
              <div
                ref={thumbRef}
                className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {images.map((item: MediaItem, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentIndex
                        ? 'border-[#E91E8C] opacity-100 scale-105'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    {item?.tipo === 'video' ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Play size={16} className="text-white" fill="white" />
                      </div>
                    ) : (
                      <Image
                        src={item?.thumbnailUrl || item?.url}
                        alt={`Imagem ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product info panel */}
          {produto && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="px-4 pb-4 pt-2 z-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3">
                {/* Tags: departamento + categoria */}
                <div className="flex flex-wrap gap-2">
                  {produto.categoria?.nome && (
                    <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium">
                      {produto.categoria.nome}
                    </span>
                  )}
                  {produto.departamento?.nome && (
                    <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium">
                      {produto.departamento.nome}
                    </span>
                  )}
                </div>

                {/* Nome */}
                <h3 className="text-white font-bold text-lg leading-tight">
                  {produto.nome || 'Produto'}
                </h3>

                {/* Código */}
                {produto.codigo && (
                  <p className="text-white/60 text-sm">
                    {produto.codigo}
                  </p>
                )}

                {/* Preço + WhatsApp */}
                <div className="flex items-center justify-between">
                  <div>
                    {produto.preco !== undefined && produto.preco !== null && (
                      <p className="text-[#E91E8C] font-extrabold text-2xl">
                        {fmt(produto.preco)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold transition-all active:scale-95 shadow-lg"
                  >
                    <MessageCircle size={18} />
                    Enviar pro WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Dots (only if few images and no thumbnails needed) */}
          {images.length > 1 && images.length <= 5 && (
            <div className="absolute bottom-[calc(theme(spacing.4)+200px)] left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
              {images.map((_: MediaItem, i: number) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}