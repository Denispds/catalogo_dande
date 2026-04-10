'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Shield, Sparkles, Truck, Share2, Check } from 'lucide-react';
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

const badgeConfig: Record<string, { icon: any; label: string; color: string }> = {
  garantia: { icon: Shield, label: 'Garantia', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  novo: { icon: Sparkles, label: 'Novo', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  'pronta entrega': { icon: Truck, label: 'Pronta Entrega', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

export default function ProductCard({ produto, layout = 'grid', selected = false, onToggleSelect, onShare, showPrice = true, showCode = true }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const mainImage = produto?.imagens?.[0]?.url;
  const hasDiscount = produto?.precoOriginal && produto.precoOriginal > produto?.preco;
  const discountPct = hasDiscount ? Math.round(((produto.precoOriginal - produto.preco) / produto.precoOriginal) * 100) : 0;
  const badges = produto?.badges ?? [];

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 p-3 rounded-xl bg-card transition-all hover:shadow-md ${
          selected ? 'ring-2 ring-primary' : ''
        }`}
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect?.(produto?.codigo)}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30'
            }`}
          >
            {selected && <Check size={12} />}
          </button>
        )}
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {mainImage && !imgError ? (
            <Image src={mainImage} alt={produto?.nome ?? 'Produto'} fill className="object-cover" onError={() => setImgError(true)} unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-muted-foreground" /></div>
          )}
          {hasDiscount && discountPct > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-primary text-white text-[9px] font-bold px-1 rounded">-{discountPct}%</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{produto?.nome ?? ''}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {showCode && <span className="text-xs text-muted-foreground">#{produto?.codigo}</span>}
            <span className="text-xs text-muted-foreground">{produto?.departamento?.nome ?? ''}</span>
          </div>
          {showPrice && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-primary">R$ {(produto?.preco ?? 0)?.toFixed?.(2)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">R$ {(produto?.precoOriginal ?? 0)?.toFixed?.(2)}</span>
              )}
            </div>
          )}
        </div>
        {onShare && (
          <button onClick={() => onShare?.(produto)} className="p-2 rounded-lg hover:bg-accent/20 text-accent transition-colors flex-shrink-0">
            <Share2 size={16} />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group rounded-xl overflow-hidden bg-card transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {onToggleSelect && (
        <button
          onClick={() => onToggleSelect?.(produto?.codigo)}
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            selected ? 'bg-primary border-primary text-white' : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
          }`}
        >
          {selected && <Check size={12} />}
        </button>
      )}
      <div className="relative aspect-square bg-muted">
        {mainImage && !imgError ? (
          <Image src={mainImage} alt={produto?.nome ?? 'Produto'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgError(true)} unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-muted-foreground" /></div>
        )}
        {hasDiscount && discountPct > 0 && (
          <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">-{discountPct}%</span>
        )}
        {badges?.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
            {badges?.map?.((badge: string) => {
              const config = badgeConfig[badge?.toLowerCase?.()] ?? null;
              if (!config) return null;
              const Icon = config.icon;
              return (
                <span key={badge} className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.color}`}>
                  <Icon size={10} /> {config.label}
                </span>
              );
            }) ?? []}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{produto?.nome ?? ''}</p>
        <div className="flex items-center gap-2 mt-1">
          {showCode && <span className="text-xs text-muted-foreground font-mono">#{produto?.codigo}</span>}
          <span className="text-xs text-muted-foreground">• {produto?.categoria?.nome ?? ''}</span>
        </div>
        {showPrice && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-primary">R$ {(produto?.preco ?? 0)?.toFixed?.(2)}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">R$ {(produto?.precoOriginal ?? 0)?.toFixed?.(2)}</span>
              )}
            </div>
            {onShare && (
              <button onClick={() => onShare?.(produto)} className="p-1.5 rounded-lg hover:bg-accent/20 text-accent transition-colors">
                <Share2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
