'use client';

import React, { useState } from 'react';
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
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const mainImage = produto?.imagens?.[0]?.url;

  const fmt = (v: number) => `R$ ${v?.toFixed(2)?.replace('.', ',')}`;

  const handleTap = () => {
    if (selectionMode && onSelect) {
      onSelect(produto);
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
        {/* Selection indicator */}
        {selectionMode && (
          <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
            selected ? 'bg-primary text-white scale-100' : 'bg-black/30 backdrop-blur-sm scale-90'
          }`}>
            {selected && <Check size={14} strokeWidth={3} />}
          </div>
        )}

        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-gradient-to-br from-pink-50 to-gray-50 dark:from-gray-800 dark:to-gray-900">
          {mainImage && !imgError ? (
            <Image
              src={mainImage}
              alt={produto?.nome ?? 'Produto Dande'}
              fill
              className={`object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg">💎</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 py-2 pr-3 min-w-0">
          <h3 className="text-xs font-semibold leading-tight line-clamp-1 text-foreground">
            {shortName(produto?.nome)}
          </h3>
          {showCode && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {produto?.codigo}
            </span>
          )}
          {showPrice && (
            <p className="text-sm font-bold text-primary mt-0.5">
              {fmt(produto?.preco ?? 0)}
            </p>
          )}
        </div>

        {/* Share */}
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

  // Grid layout (default)
  return (
    <div
      onClick={handleTap}
      className={`group relative bg-card rounded-3xl overflow-hidden transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${
        selected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
      }`}
    >
      {/* Selection indicator */}
      {selectionMode && (
        <div className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected ? 'bg-primary text-white scale-100' : 'bg-black/30 backdrop-blur-sm scale-90'
        }`}>
          {selected && <Check size={14} strokeWidth={3} />}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-pink-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {mainImage && !imgError ? (
          <>
            <Image
              src={mainImage}
              alt={produto?.nome ?? 'Produto Dande'}
              fill
              className={`object-cover transition-all duration-700 ease-out group-hover:scale-110 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              unoptimized
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <span className="text-xl">💎</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Sem foto</span>
          </div>
        )}

        {/* Share button */}
        {onShare && !selectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
            className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 shadow-md"
          >
            <Share2 size={14} className="text-gray-700 dark:text-gray-200" />
          </button>
        )}
      </div>

      {/* Compact Info */}
      <div className="px-2.5 py-2">
        <h3 className="text-[11px] font-semibold leading-tight line-clamp-1 text-foreground">
          {shortName(produto?.nome)}
        </h3>
        {showCode && (
          <span className="text-[9px] font-mono text-muted-foreground">
            {produto?.codigo}
          </span>
        )}
        {showPrice && (
          <p className="text-xs font-bold text-primary mt-0.5">
            {fmt(produto?.preco ?? 0)}
          </p>
        )}
      </div>
    </div>
  );
}
