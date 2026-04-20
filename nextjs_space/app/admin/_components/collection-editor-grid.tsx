'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { GripVertical, X, Loader2 } from 'lucide-react';
import { CollectionProductData } from '@/lib/types';

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
  const [items, setItems] = useState<CollectionProductData[]>(products);

  const handleDragEnd = useCallback(async (newOrder: CollectionProductData[]) => {
    setItems(newOrder);
    
    // Reorder with new ordem values
    const reorderedItems = newOrder.map((p, idx) => ({
      ...p,
      ordem: idx + 1,
    }));

    onReorder(reorderedItems);
  }, [onReorder]);

  const getProdutoCodigo = (product: CollectionProductData): string => {
    return (product.produtoCodigo || product.codigo || '') as string;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="text-4xl mb-3">📦</div>
        <p className="text-sm">Nenhum produto na coleção</p>
        <p className="text-xs mt-1">Adicione produtos usando a aba lateral</p>
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={handleDragEnd}
      className="space-y-3"
    >
      <AnimatePresence mode="popLayout">
        {items.map((product, idx) => (
          <Reorder.Item
            key={getProdutoCodigo(product)}
            value={product}
            as="div"
            className="relative"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="group/card bg-card rounded-xl border border-border/50 overflow-hidden transition-all hover:shadow-md hover:border-primary/30 p-3 flex gap-3"
            >
              {/* Drag Handle */}
              <div className="flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors">
                <GripVertical size={18} />
              </div>

              {/* Image */}
              <div className="flex-shrink-0 w-20 h-24 bg-muted rounded-lg overflow-hidden relative">
                {product.imagens && product.imagens.length > 0 ? (
                  <Image
                    src={product.imagens[0]?.url || ''}
                    alt={product.nome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-muted to-muted-foreground/10">
                    💎
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <p className="text-xs font-mono text-muted-foreground/70">
                    {getProdutoCodigo(product)}
                  </p>
                  <h4 className="text-sm font-semibold line-clamp-2 text-foreground mt-0.5">
                    {product.nome}
                  </h4>
                </div>
                <p className="text-sm font-bold text-primary">
                  R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Position Badge */}
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                {idx + 1}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => {
                  onRemove(getProdutoCodigo(product));
                  setItems(items.filter(p => getProdutoCodigo(p) !== getProdutoCodigo(product)));
                }}
                disabled={isSaving}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all hover:bg-red-500/20 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              </button>
            </motion.div>
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}
