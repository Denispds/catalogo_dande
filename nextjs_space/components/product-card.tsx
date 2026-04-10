'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gem, Share2 } from 'lucide-react';
import Image from 'next/image';

interface ProductCardProps {
  produto: any;
  layout?: 'grid' | 'list';
  selected?: boolean;
  onToggleSelect?: (codigo: string) => void;
  onShare?: (produto: any) => void;
  showPrice?: boolean;
  showCode?: boolean;
}

export default function ProductCard({ produto, layout = 'grid', selected = false, onToggleSelect, onShare, showPrice = true, showCode = true }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const mainImage = produto?.imagens?.[0]?.url;
  const hasDiscount = produto?.precoOriginal && produto.precoOriginal > produto?.preco;
  const discountPct = hasDiscount ? Math.round(((produto.precoOriginal - produto.preco) / produto.precoOriginal) * 100) : 0;

  const fmt = (v: number) => `R$ ${(v ?? 0).toFixed(2).replace('.', ',')}`;

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => onToggleSelect?.(produto?.codigo)}
        className={`flex items-center gap-3 p-3 rounded-2xl bg-card transition-all duration-300 active:scale-[0.98] ${
          selected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'shadow-sm'
        }`}
      >
        <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
          {mainImage && !imgError ? (
            <Image src={mainImage} alt={produto?.nome ?? 'Produto'} fill className="object-cover" onError={() => setImgError(true)} unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <Gem size={20} className="text-primary/40" />
            </div>
          )}
          {hasDiscount && discountPct > 0 && (
            <span className="absolute top-0 right-0 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">-{discountPct}%</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{produto?.nome ?? ''}</p>
          {showCode && <p className="text-[11px] text-muted-foreground mt-0.5">#{produto?.codigo}</p>}
          {showPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-primary">{fmt(produto?.preco)}</span>
              {hasDiscount && <span className="text-[11px] text-muted-foreground line-through">{fmt(produto?.precoOriginal)}</span>}
            </div>
          )}
        </div>
        {onShare && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/10 text-accent active:scale-90 transition-all duration-200"
          >
            <Share2 size={16} />
          </button>
        )}
      </motion.div>
    );
  }

  // Grid layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => onToggleSelect?.(produto?.codigo)}
      className={`relative rounded-2xl overflow-hidden bg-card transition-all duration-300 active:scale-[0.97] ${
        selected ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'shadow-sm'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {mainImage && !imgError ? (
          <Image
            src={mainImage}
            alt={produto?.nome ?? 'Produto'}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
            <Gem size={28} className="text-primary/30" />
            <span className="text-[9px] text-muted-foreground/50 mt-1 font-medium">SEM FOTO</span>
          </div>
        )}
        {/* Discount badge */}
        {hasDiscount && discountPct > 0 && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              -{discountPct}%
            </span>
          </div>
        )}
        {/* Share button */}
        {onShare && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center text-accent shadow-sm active:scale-90 transition-all duration-200"
          >
            <Share2 size={14} />
          </button>
        )}
        {/* Selection indicator */}
        {selected && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[13px] font-semibold line-clamp-2 leading-snug min-h-[2.4rem]">{produto?.nome ?? ''}</p>
        {showCode && (
          <p className="text-[10px] text-muted-foreground mt-1 font-medium">#{produto?.codigo}</p>
        )}
        {showPrice && (
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-[15px] font-bold text-primary">{fmt(produto?.preco)}</span>
            {hasDiscount && (
              <span className="text-[10px] text-muted-foreground line-through">{fmt(produto?.precoOriginal)}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
