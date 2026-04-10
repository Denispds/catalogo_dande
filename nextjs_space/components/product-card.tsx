'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, Check } from 'lucide-react';
import Image from 'next/image';

interface ProductCardProps {
  produto: any;
  onShare?: (produto: any) => void;
  showPrice?: boolean;
  showCode?: boolean;
  layout?: 'grid' | 'list';
  selected?: boolean;
  onSelect?: (produto: any) => void;
  selectionMode?: boolean;
  onImageTap?: (produto: any, imageIndex: number) => void;
}

function shortName(nome: string | undefined | null): string {
  if (!nome) return '';
  const words = nome.trim().split(/\s+/);
  return words.slice(0, 2).join(' ');
}

export default function ProductCard({
  produto,
  onShare,
  showPrice = true,
  showCode = true,
  layout = 'grid',
  selected = false,
  onSelect,
  selectionMode = false,
  onImageTap,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const timerRef = useRef<any>(null);

  const images: { url: string }[] = produto?.imagens ?? [];
  const hasMultipleImages = images.length > 1;
  const currentImage = images[activeImgIdx]?.url;

  const fmt = (v: number) => `R$ ${v?.toFixed(2)?.replace('.', ',')}`;

  // Auto-rotate images every 3s
  const startRotation = useCallback(() => {
    if (!hasMultipleImages) return;
    timerRef.current = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % images.length);
    }, 3000);
  }, [hasMultipleImages, images.length]);

  const stopRotation = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startRotation();
    return stopRotation;
  }, [startRotation, stopRotation]);

  const handleTap = () => {
    if (selectionMode && onSelect) {
      onSelect(produto);
    }
  };

  const handleImageTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode && onSelect) {
      onSelect(produto);
      return;
    }
    if (onImageTap && images.length > 0) {
      onImageTap(produto, activeImgIdx);
    }
  };

  if (layout === 'list') {
    return (
      <div
        onClick={handleTap}
        className={`group relative flex items-center gap-3 bg-card rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.99] ${
          selected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'shadow-sm'
        }`}
      >
        {selectionMode && (
          <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
            selected ? 'bg-primary text-white scale-100' : 'bg-black/30 backdrop-blur-sm scale-90'
          }`}>
            {selected && <Check size={14} strokeWidth={3} />}
          </div>
        )}

        {/* Image */}
        <div
          className="relative w-24 h-24 flex-shrink-0 bg-gradient-to-br from-pink-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 cursor-pointer"
          onClick={handleImageTap}
        >
          {currentImage && !imgError ? (
            <Image
              src={currentImage}
              alt={produto?.nome ?? 'Produto Dande'}
              fill
              className="object-cover transition-opacity duration-500"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg">💎</span>
            </div>
          )}
          {hasMultipleImages && (
            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
              {activeImgIdx + 1}/{images.length}
            </div>
          )}
        </div>

        {/* Info — name on top, code + price aligned on bottom */}
        <div className="flex-1 py-2 pr-3 min-w-0">
          <h3 className="text-xs font-semibold leading-tight line-clamp-1 text-foreground mb-1">
            {shortName(produto?.nome)}
          </h3>
          <div className="flex items-center justify-between gap-2">
            {showCode && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {produto?.codigo}
              </span>
            )}
            {showPrice && (
              <span className="text-sm font-bold text-primary">
                {fmt(produto?.preco ?? 0)}
              </span>
            )}
          </div>
        </div>

        {onShare && !selectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
            className="mr-3 w-8 h-8 bg-muted/60 rounded-full flex items-center justify-center transition-all hover:bg-muted active:scale-90"
          >
            <Share2 size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  // Grid layout
  return (
    <div
      onClick={handleTap}
      className={`group relative bg-card rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:shadow-xl active:scale-[0.98] ${
        selected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
      }`}
    >
      {selectionMode && (
        <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected ? 'bg-primary text-white scale-100' : 'bg-black/30 backdrop-blur-sm scale-90'
        }`}>
          {selected && <Check size={14} strokeWidth={3} />}
        </div>
      )}

      {/* Image area */}
      <div
        className="relative aspect-square bg-gradient-to-br from-pink-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden cursor-pointer"
        onClick={handleImageTap}
      >
        {currentImage && !imgError ? (
          <>
            <Image
              src={currentImage}
              alt={produto?.nome ?? 'Produto Dande'}
              fill
              className={`object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              unoptimized
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <span className="text-lg">💎</span>
            </div>
          </div>
        )}

        {/* Image dots for multi-image */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {images.map((_: any, i: number) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === activeImgIdx ? 'w-4 h-1.5 bg-white shadow-sm' : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Share button */}
        {onShare && !selectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
            className="absolute top-2 right-2 w-7 h-7 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 shadow-md"
          >
            <Share2 size={13} className="text-gray-700 dark:text-gray-200" />
          </button>
        )}
      </div>

      {/* Info: name on top, code + price aligned below */}
      <div className="px-2.5 py-1.5">
        <h3 className="text-[11px] font-medium leading-tight line-clamp-1 text-muted-foreground mb-0.5">
          {shortName(produto?.nome)}
        </h3>
        <div className="flex items-center justify-between">
          {showCode && (
            <span className="text-[10px] font-mono text-muted-foreground/70">
              {produto?.codigo}
            </span>
          )}
          {showPrice && (
            <span className="text-xs font-bold text-primary">
              {fmt(produto?.preco ?? 0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
