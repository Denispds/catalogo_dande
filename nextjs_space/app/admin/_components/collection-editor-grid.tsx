'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { GripVertical, X, Loader2, ArrowUpDown, ArrowDownAZ, ArrowUpAZ, TrendingUp, TrendingDown, Hand } from 'lucide-react';
import { CollectionProductData } from '@/lib/types';

type SortMode = 'manual' | 'nome_asc' | 'nome_desc' | 'preco_asc' | 'preco_desc';

const sortOptions: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'manual', label: 'Manual', icon: <Hand size={12} /> },
  { value: 'nome_asc', label: 'A-Z', icon: <ArrowDownAZ size={12} /> },
  { value: 'nome_desc', label: 'Z-A', icon: <ArrowUpAZ size={12} /> },
  { value: 'preco_asc', label: 'Preco \u2191', icon: <TrendingUp size={12} /> },
  { value: 'preco_desc', label: 'Preco \u2193', icon: <TrendingDown size={12} /> },
];

interface CollectionEditorGridProps {
  products: CollectionProductData[];
  onReorder: (newOrder: CollectionProductData[]) => void;
  onRemove: (codigo: string) => void;
  isSaving?: boolean;
}

export default function CollectionEditorGrid({
  products,
  onReorder,
  onRemove,
  isSaving = false,
}: CollectionEditorGridProps) {
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const getCode = (p: CollectionProductData) => (p.produtoCodigo || p.codigo || '') as string;

  // Sorted products (local sort, doesn't save order)
  const sortedProducts = useMemo(() => {
    if (sortMode === 'manual') return products;
    const sorted = [...products];
    switch (sortMode) {
      case 'nome_asc':
        sorted.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        break;
      case 'nome_desc':
        sorted.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
        break;
      case 'preco_asc':
        sorted.sort((a, b) => Number(a.preco) - Number(b.preco));
        break;
      case 'preco_desc':
        sorted.sort((a, b) => Number(b.preco) - Number(a.preco));
        break;
    }
    return sorted;
  }, [products, sortMode]);

  const handleApplySort = () => {
    if (sortMode === 'manual') return;
    // Apply current sort as new manual order
    const reordered = sortedProducts.map((p, idx) => ({ ...p, ordem: idx + 1 }));
    onReorder(reordered);
    setSortMode('manual');
  };

  const handleDragReorder = (newOrder: CollectionProductData[]) => {
    const reordered = newOrder.map((p, idx) => ({ ...p, ordem: idx + 1 }));
    onReorder(reordered);
  };

  const isManual = sortMode === 'manual';

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">\ud83d\udce6</div>
        <p className="text-sm font-medium">Nenhum produto na cole\u00e7\u00e3o</p>
        <p className="text-xs mt-1 opacity-70">Use a aba "Adicionar" para incluir produtos</p>
      </div>
    );
  }

  const currentLabel = sortOptions.find(o => o.value === sortMode)?.label || 'Manual';

  const renderCard = (product: CollectionProductData, idx: number) => (
    <div className="group/card bg-card rounded-xl border border-border/50 overflow-hidden transition-all hover:shadow-md hover:border-primary/30 p-2.5 flex gap-2.5">
      {/* Drag Handle - only in manual mode */}
      {isManual && (
        <div className="flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-primary transition-colors">
          <GripVertical size={16} />
        </div>
      )}

      {/* Image */}
      <div className="flex-shrink-0 w-14 h-18 bg-muted rounded-lg overflow-hidden relative" style={{ height: '72px' }}>
        {product.imagens && product.imagens.length > 0 ? (
          <Image
            src={product.imagens[0]?.url || ''}
            alt={product.nome}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-muted to-muted-foreground/10">
            \ud83d\udc8e
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <p className="text-[10px] font-mono text-muted-foreground/60">{getCode(product)}</p>
        <h4 className="text-xs font-semibold line-clamp-1 text-foreground mt-0.5">{product.nome}</h4>
        <p className="text-xs font-bold text-primary mt-0.5">
          R$ {Number(product.preco).toFixed(2).replace('.', ',')}
        </p>
      </div>

      {/* Position Badge */}
      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold self-center">
        {idx + 1}
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(getCode(product));
        }}
        disabled={isSaving}
        className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all hover:bg-red-500/20 active:scale-90 self-center"
      >
        <X size={12} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Sort toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{products.length}</span> produto{products.length !== 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowUpDown size={12} />
              {currentLabel}
            </button>

            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortMode(opt.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                        sortMode === opt.value
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Apply sort button */}
          {sortMode !== 'manual' && (
            <button
              onClick={handleApplySort}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all"
            >
              Aplicar Ordem
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {isManual ? (
          <Reorder.Group
            axis="y"
            values={sortedProducts}
            onReorder={handleDragReorder}
            className="space-y-2"
          >
            {sortedProducts.map((product, idx) => (
              <Reorder.Item
                key={getCode(product)}
                value={product}
                as="div"
              >
                {renderCard(product, idx)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-2">
            {sortedProducts.map((product, idx) => (
              <div key={getCode(product)}>
                {renderCard(product, idx)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
