'use client';

import React, { useState } from 'react';
import { Share2, Heart } from 'lucide-react';
import Image from 'next/image';

interface ProductCardProps {
  produto: any;
  onShare?: (produto: any) => void;
  showPrice?: boolean;
  showCode?: boolean;
}

export default function ProductCard({ produto, onShare, showPrice = true, showCode = true }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const mainImage = produto?.imagens?.[0]?.url;
  const hasDiscount = produto?.precoOriginal && produto.precoOriginal > produto?.preco;
  const discountPct = hasDiscount ? Math.round(((produto.precoOriginal - produto.preco) / produto.precoOriginal) * 100) : 0;

  const fmt = (v: number) => `R$ ${v?.toFixed(2)?.replace('.', ',')}`;

  return (
    <div className="group relative bg-card rounded-3xl overflow-hidden transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]">
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
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
            <span className="text-xs text-muted-foreground">Sem foto</span>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && discountPct > 0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-pink-500/30">
            -{discountPct}%
          </div>
        )}

        {/* Share button */}
        {onShare && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 shadow-md"
          >
            <Share2 size={15} className="text-gray-700 dark:text-gray-200" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] text-foreground">
          {produto?.nome ?? ''}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5">
          {showCode && (
            <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
              {produto?.codigo}
            </span>
          )}
          {produto?.categoria?.nome && (
            <span className="text-[11px] text-muted-foreground truncate">
              {produto.categoria.nome}
            </span>
          )}
        </div>

        {showPrice && (
          <div className="mt-3 flex items-end gap-2">
            <span className="text-lg font-bold text-primary">
              {fmt(produto?.preco ?? 0)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through mb-0.5">
                {fmt(produto?.precoOriginal ?? 0)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
